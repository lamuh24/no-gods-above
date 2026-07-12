import "./style.css";
import { DebugRuntime } from "./debugRuntime";
import { KeyboardInputAdapter } from "./inputAdapter";
import { DebugRenderer } from "./debugRenderer";
import { ReplayRecording } from "../core/replay";
import { TICKS_PER_SECOND } from "../core/types";
import { currentAttackPhase, getThrowDebugGeometry } from "../core/engine";
import { fighterDefinitions } from "../data/fighters";
import { debugKeyboardMapping, reservedCombatActions, standardGamepadMapping } from "./inputMap";

const root = document.querySelector<HTMLDivElement>("#app")!;
root.innerHTML = `
  <main class="shell">
    <section id="viewport" class="viewport"></section>
    <aside class="panel">
      <h1>NGA Engine V2 Debug Runtime</h1>
      <p class="flow">Keyboard / replay → input adapter → 60 Hz sim → serializable state → Three.js debug renderer</p>
      <div class="buttons">
        <button id="mode">Mode: live</button><button id="pause">Pause</button><button id="step">Step</button><button id="reset">Reset</button><button id="overlays">Toggle overlays</button><button id="dummy">Dummy: auto</button><button id="export-tuning">Copy tuning JSON</button>
      </div>
      <pre id="hud"></pre><textarea id="tuning" readonly rows="8"></textarea>
      <p class="help">A/D or arrows move · W jump · S crouch · J/K/L ground and air normals · I forward throw / throw tech · O block · Esc pause · F1 overlays · . step while paused · R reset · M replay/live · U/P reserved</p>
    </aside>
  </main>`;

const viewport = document.querySelector<HTMLDivElement>("#viewport")!;
const hud = document.querySelector<HTMLPreElement>("#hud")!;
const renderer = new DebugRenderer(viewport);
const input = new KeyboardInputAdapter();
input.attach(window);
const runtime = new DebugRuntime({ seed: 1234 });
(window as any).__NGA_ENGINE_V2_DEBUG__ = { runtime, renderer };
let replay: ReplayRecording | null = null;
let accumulator = 0;
let lastTime = performance.now();
const maxCatchUp = 5 / TICKS_PER_SECOND;

async function loadReplay() {
  replay = await fetch("/replays/lamuh_light_opening.replay.json").then((r) => r.json());
  return replay;
}

function setModeLabel() {
  document.querySelector<HTMLButtonElement>("#mode")!.textContent = `Mode: ${runtime.mode}`;
}

function toggleOverlays() {
  const enabled = !renderer.overlays.push;
  Object.assign(renderer.overlays, { push: enabled, hurt: enabled, strike: enabled, throw: enabled, anchors: enabled, origin: enabled, facing: enabled, ground: true });
}

let lastDevice = input.read();
function liveInput() { lastDevice = input.read(); return { p1: lastDevice.frame, p2: {} }; }
function fixedStep(force = false) { runtime.step(liveInput(), force); }

function updateHud() {
  const s = runtime.state;
  const f = s.fighters.p1;
  const d = s.fighters.p2;
  const attack = f.currentAttack ? fighterDefinitions[f.kind].attacks[f.currentAttack] : null;
  const aerialCancelRoutes = f.cancelOptions.filter((attackId) => fighterDefinitions[f.kind].attacks[attackId].airOnly);
  const throwHud = (id: "p1" | "p2", normalizedHeld?: boolean) => {
    const fighter = s.fighters[id], geometry = getThrowDebugGeometry(s, id);
    return {
      move: geometry?.moveId ?? fighter.currentThrow,
      state: geometry?.state ?? (fighter.currentThrow ? fighter.phase : "none"),
      role: geometry?.role ?? "none",
      partner: fighter.throwPartner,
      timer: fighter.phaseTick,
      techRemaining: geometry?.techWindowRemaining ?? 0,
      facing: fighter.throwFacing,
      invuln: fighter.throwInvulnTicks,
      outcome: fighter.lastThrowOutcome,
      pushSuppressed: geometry?.pushboxSuppressed ?? false,
      anchors: geometry ? { grab: geometry.grabAnchor, victim: geometry.victimAnchor, release: geometry.releaseAnchor, camera: geometry.cameraTarget } : null,
      input: { pressed: !!fighter.deterministicBuffer.pressed.throw, held: !!fighter.deterministicBuffer.current.throw, normalizedHeld: !!normalizedHeld }
    };
  };
  hud.textContent = JSON.stringify({
    mode: runtime.mode,
    activeDevice: lastDevice.device,
    gamepad: lastDevice.connectedGamepad || "none",
    normalizedInput: lastDevice.frame,
    paused: runtime.paused,
    tick: s.tick,
    seed: s.seed,
    checksum: runtime.checksum,
    controls: { throw: `I / gamepad button ${standardGamepadMapping.throw}`, block: "O", pause: "Escape", overlays: "F1", step: ". (paused only)", reset: "R" },
    combatActionStatus: reservedCombatActions,
    debugWarnings: s.debugWarnings,
    aerial: { moveId: attack?.airOnly ? f.currentAttack : null, phase: attack?.airOnly ? currentAttackPhase(f) : "none", availableCancels: aerialCancelRoutes, remainingAirActions: f.airActionsRemaining },
    lamuh: { health: f.health, state: f.phase, attack: f.currentAttack, attackPhase: currentAttackPhase(f), cancelOptions: f.cancelOptions, combo: f.comboCount, comboDamage: f.comboDamage, comboRoute: f.comboRoute, scaling: f.damageScaling, timer: f.phaseTick, pos: [f.x, f.y], vel: [f.vx, f.vy], grounded: f.grounded, hitstop: f.hitstop, hitstun: f.hitstun, blockstun: f.blockstun, throw: throwHud("p1", lastDevice.frame.throw), buffer: f.deterministicBuffer.history.slice(-5) },
    dummy: { health: d.health, mode: d.dummyMode, state: d.phase, timer: d.phaseTick, pos: [d.x, d.y], vel: [d.vx, d.vy], grounded: d.grounded, hitstop: d.hitstop, hitstun: d.hitstun, blockstun: d.blockstun, throw: throwHud("p2") },
    replayFinalChecksum: replay ? runtime.runReplayToEnd(replay).checksums.at(-1) : "loading"
  }, null, 2);
}

function loop(now: number) {
  const delta = Math.min((now - lastTime) / 1000, maxCatchUp);
  lastTime = now;
  accumulator += delta;
  while (accumulator >= 1 / TICKS_PER_SECOND) {
    fixedStep(false);
    accumulator -= 1 / TICKS_PER_SECOND;
  }
  renderer.render(runtime.state);
  updateHud();
  requestAnimationFrame(loop);
}

window.addEventListener("keydown", (event) => {
  if (event.repeat) return;
  if (event.code === debugKeyboardMapping.pause) { event.preventDefault(); runtime.togglePause(); }
  if (event.code === debugKeyboardMapping.step && runtime.paused) runtime.frameAdvance(liveInput());
  if (event.code === debugKeyboardMapping.reset) runtime.reset();
  if (event.code === debugKeyboardMapping.overlay) { event.preventDefault(); toggleOverlays(); }
  if (event.code === debugKeyboardMapping.mode && replay) { if (runtime.mode === "live") runtime.setReplay(replay); else runtime.setMode("live"); setModeLabel(); }
});
document.querySelector("#mode")!.addEventListener("click", () => { if (replay) { if (runtime.mode === "live") runtime.setReplay(replay); else runtime.setMode("live"); setModeLabel(); } });
document.querySelector("#pause")!.addEventListener("click", () => runtime.togglePause());
document.querySelector("#step")!.addEventListener("click", () => { if (runtime.paused) runtime.frameAdvance(liveInput()); });
document.querySelector("#reset")!.addEventListener("click", () => runtime.reset());
document.querySelector("#overlays")!.addEventListener("click", toggleOverlays);
document.querySelector("#dummy")!.addEventListener("click", () => { const d = runtime.state.fighters.p2; const modes = ["idle", "stand_block", "crouch_block", "block_after_first_hit", "no_recovery", "auto_recovery"] as const; d.dummyMode = modes[(modes.indexOf(d.dummyMode as any) + 1) % modes.length]; (document.querySelector("#dummy") as HTMLButtonElement).textContent = `Dummy: ${d.dummyMode}`; });
document.querySelector("#export-tuning")!.addEventListener("click", () => { const text = JSON.stringify({ lamuh: runtime.state.fighters.p1.kind, note: "Temporary runtime tuning lives in src/data/fighters.ts defaults." }, null, 2); (document.querySelector("#tuning") as HTMLTextAreaElement).value = text; navigator.clipboard?.writeText(text); });

loadReplay().then((loaded) => { replay = loaded; setModeLabel(); requestAnimationFrame(loop); });
