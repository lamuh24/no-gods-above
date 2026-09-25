import "./style.css";
import { DebugRenderer } from "../debug/debugRenderer";
import { DebugRuntime } from "../debug/debugRuntime";
import { currentAttackPhase } from "../core/engine";
import { TICKS_PER_SECOND } from "../core/types";
import { stageFrameFor } from "../stage/fighterFrameSelector";
import { JuggleRouteDriver } from "./driver";
import { juggleRoutes, RouteId } from "./routes";

interface FrameLogEntry {
  tick: number;
  frame: string;
  attack: string;
  phase: string;
  ticks: number;
}

const root = document.querySelector<HTMLDivElement>("#app")!;
root.innerHTML = `
  <main class="shell">
    <section id="viewport" class="viewport"></section>
    <aside class="panel">
      <h1>NGA Engine V2 Juggle Animation Lab</h1>
      <p class="contract-badge">juggle_animation_lab_v1 · candidate-only presentation review · simulation owns every timing value · no production balance authority</p>
      <p class="help">The route below is played back as scripted P1 inputs at 60 Hz. Slow the speed down and read the attacker frame log: every startup, contact, and recovery pose the attack actually shows is listed with the tick it appeared on.</p>
      <div class="controls">
        <label for="route">Route</label>
        <select id="route"></select>
        <label for="speed">Speed</label>
        <select id="speed">
          <option value="1">1x</option>
          <option value="0.5" selected>0.5x</option>
          <option value="0.25">0.25x</option>
          <option value="0.1">0.1x</option>
        </select>
      </div>
      <div class="controls">
        <button id="play">Pause</button><button id="step">Step frame</button><button id="restart">Restart route</button><button id="overlays">Show hitboxes</button>
      </div>
      <div class="readout">
        <span id="stage-readout">ROUTE</span>
        <span id="combo-readout">READY</span>
        <span id="attacker-readout" class="motion">ATTACKER</span>
        <span id="defender-readout">DEFENDER</span>
      </div>
      <p id="route-description" class="help"></p>
      <div class="section-title">Attacker frame log (P1)</div>
      <ul id="frame-log" class="frame-log"></ul>
      <div class="section-title">Loop summary</div>
      <pre id="summary"></pre>
    </aside>
  </main>`;

const viewport = document.querySelector<HTMLDivElement>("#viewport")!;
const routeSelect = document.querySelector<HTMLSelectElement>("#route")!;
const speedSelect = document.querySelector<HTMLSelectElement>("#speed")!;
const playButton = document.querySelector<HTMLButtonElement>("#play")!;
const overlayButton = document.querySelector<HTMLButtonElement>("#overlays")!;
const stageReadout = document.querySelector<HTMLSpanElement>("#stage-readout")!;
const comboReadout = document.querySelector<HTMLSpanElement>("#combo-readout")!;
const attackerReadout = document.querySelector<HTMLSpanElement>("#attacker-readout")!;
const defenderReadout = document.querySelector<HTMLSpanElement>("#defender-readout")!;
const routeDescription = document.querySelector<HTMLParagraphElement>("#route-description")!;
const frameLogList = document.querySelector<HTMLUListElement>("#frame-log")!;
const summary = document.querySelector<HTMLPreElement>("#summary")!;

routeSelect.innerHTML = juggleRoutes.map((route) => `<option value="${route.id}">${route.label}</option>`).join("");

const renderer = new DebugRenderer(viewport);
const runtime = new DebugRuntime({ seed: 1301 });
const driver = new JuggleRouteDriver(juggleRoutes[0]);

Object.assign(renderer.overlays, { push: false, hurt: false, strike: false, origin: false, facing: false, ground: false });

let frameLog: FrameLogEntry[] = [];
let distinctFrames = new Set<string>();
let attackFramesSeen = new Set<string>();
let observedAttacks: string[] = [];
let peakComboCount = 0;
let peakJuggleSpent = 0;
let knockdownSeen: string | null = null;
let lastLoop: ReturnType<typeof loopSummary> | null = null;
let speed = Number(speedSelect.value);
let paused = false;

function startingPositions() {
  const state = runtime.state;
  Object.assign(state.fighters.p1, { x: -50, facing: 1, attackFacing: 1 });
  Object.assign(state.fighters.p2, { x: 50, facing: -1, attackFacing: -1 });
}

function restart() {
  runtime.reset();
  startingPositions();
  driver.rewind();
  frameLog = [];
  distinctFrames = new Set();
  attackFramesSeen = new Set();
  observedAttacks = [];
  peakComboCount = 0;
  peakJuggleSpent = 0;
  knockdownSeen = null;
  frameLogList.replaceChildren();
}

function recordAttackerFrame() {
  const state = runtime.state;
  const attacker = state.fighters.p1;
  const frame = stageFrameFor(attacker, state);
  const attack = attacker.currentAttack ?? "-";
  const phase = attacker.phase === "attack" ? currentAttackPhase(attacker) : "none";
  distinctFrames.add(frame);
  peakComboCount = Math.max(peakComboCount, attacker.comboCount);
  peakJuggleSpent = Math.max(peakJuggleSpent, attacker.juggleSpent);
  if (state.fighters.p2.knockdownKind !== "none") knockdownSeen = state.fighters.p2.knockdownKind;
  if (attacker.phase === "attack") {
    attackFramesSeen.add(frame);
    if (observedAttacks.at(-1) !== attack) observedAttacks.push(attack);
  }
  const last = frameLog.at(-1);
  if (last && last.frame === frame && last.attack === attack && last.phase === phase) {
    last.ticks++;
    return false;
  }
  frameLog.push({ tick: state.tick, frame, attack, phase, ticks: 1 });
  if (frameLog.length > 60) frameLog.shift();
  return true;
}

function renderFrameLog() {
  frameLogList.replaceChildren(...frameLog.map((entry) => {
    const item = document.createElement("li");
    const tick = document.createElement("span");
    tick.className = "tick";
    tick.textContent = `t${entry.tick}`;
    const frame = document.createElement("span");
    frame.className = "frame";
    frame.textContent = `${entry.frame} ×${entry.ticks}`;
    const phase = document.createElement("span");
    phase.className = `phase ${entry.phase}`;
    phase.textContent = entry.phase;
    item.append(tick, frame, phase);
    return item;
  }));
  frameLogList.scrollTop = frameLogList.scrollHeight;
}

function loopSummary() {
  return {
    route: driver.route.id,
    expectedAttacks: [...driver.route.expectedRoute],
    observedAttacks: [...observedAttacks],
    attackFrames: [...attackFramesSeen],
    distinctFrames: [...distinctFrames],
    frameLog: frameLog.map((entry) => ({ ...entry })),
    peakComboCount,
    peakJuggleSpent,
    knockdownSeen
  };
}

function fixedStep() {
  const input = driver.nextInput(runtime.state);
  if (driver.restartRequested) {
    lastLoop = loopSummary();
    restart();
    return;
  }
  runtime.step({ p1: input }, true);
  if (recordAttackerFrame()) renderFrameLog();
}

function updateReadouts() {
  const state = runtime.state;
  const attacker = state.fighters.p1;
  const defender = state.fighters.p2;
  const status = driver.status();
  const attackPhase = attacker.phase === "attack" ? currentAttackPhase(attacker) : "-";

  stageReadout.textContent = `${status.stageIndex + 1}/${status.stageCount} · ${status.stageLabel}`;
  comboReadout.textContent = attacker.comboCount > 0
    ? `${attacker.comboCount} HIT · ${attacker.comboDamage} DMG · JUGGLE ${attacker.juggleSpent}`
    : "READY";
  attackerReadout.textContent = `P1 ${attacker.phase.toUpperCase()} · ${attacker.currentAttack ?? "-"} · ${attackPhase} · ${stageFrameFor(attacker, state)}`;
  defenderReadout.textContent = `P2 ${defender.phase.toUpperCase()} · ${stageFrameFor(defender, state)}`;

  const desynced = status.desyncs > 0;
  stageReadout.className = desynced ? "warn" : "";
  summary.textContent = [
    `route            ${driver.route.label}`,
    `expected attacks ${driver.route.expectedRoute.join(" → ")}`,
    `observed attacks ${observedAttacks.join(" → ") || "(none yet)"}`,
    `attacker frames  ${attackFramesSeen.size} distinct attack poses this loop`,
    `all frames       ${distinctFrames.size} distinct poses this loop`,
    `loops played     ${status.loops}`,
    `last full loop   ${lastLoop ? `${lastLoop.attackFrames.length} attack poses · ${lastLoop.peakComboCount} hits · juggle ${lastLoop.peakJuggleSpent} · ${lastLoop.knockdownSeen ?? "no"} knockdown` : "(in progress)"}`,
    `route desyncs    ${status.desyncs}${status.lastDesync ? ` (${status.lastDesync})` : ""}`,
    `simulation tick  ${state.tick}`,
    `checksum         ${runtime.checksum}`
  ].join("\n");
}

routeSelect.addEventListener("change", () => {
  const route = juggleRoutes.find((candidate) => candidate.id === (routeSelect.value as RouteId)) ?? juggleRoutes[0];
  driver.setRoute(route);
  routeDescription.textContent = route.description;
  restart();
});
speedSelect.addEventListener("change", () => { speed = Number(speedSelect.value); });
playButton.addEventListener("click", () => {
  paused = !paused;
  playButton.textContent = paused ? "Play" : "Pause";
});
document.querySelector<HTMLButtonElement>("#step")!.addEventListener("click", () => {
  paused = true;
  playButton.textContent = "Play";
  fixedStep();
  updateReadouts();
  renderer.render(runtime.state);
});
document.querySelector<HTMLButtonElement>("#restart")!.addEventListener("click", restart);
overlayButton.addEventListener("click", () => {
  const enabled = !renderer.overlays.strike;
  Object.assign(renderer.overlays, { push: enabled, hurt: enabled, strike: enabled, origin: enabled, facing: enabled, ground: enabled });
  overlayButton.textContent = enabled ? "Hide hitboxes" : "Show hitboxes";
});
window.addEventListener("keydown", (event) => {
  if (event.code === "Space") { event.preventDefault(); playButton.click(); }
  if (event.code === "KeyR") restart();
  if (event.code === "Period") document.querySelector<HTMLButtonElement>("#step")!.click();
});

routeDescription.textContent = driver.route.description;
restart();

const step = 1 / TICKS_PER_SECOND;
const maxCatchUp = 5 * step;
let accumulator = 0;
let lastTime = performance.now();

function loop(now: number) {
  const delta = Math.min((now - lastTime) / 1000, maxCatchUp);
  lastTime = now;
  if (!paused) {
    accumulator += delta * speed;
    while (accumulator >= step) {
      fixedStep();
      accumulator -= step;
    }
  } else {
    accumulator = 0;
  }
  updateReadouts();
  renderer.render(runtime.state);
  requestAnimationFrame(loop);
}
requestAnimationFrame(loop);

(window as any).__NGA_JUGGLE_LAB__ = {
  runtime,
  renderer,
  driver,
  stageReady: renderer.whenReady(),
  setPaused(value: boolean) { paused = value; playButton.textContent = value ? "Play" : "Pause"; },
  setSpeed(value: number) { speed = value; speedSelect.value = String(value); },
  selectRoute(id: RouteId) { routeSelect.value = id; routeSelect.dispatchEvent(new Event("change")); },
  advance(ticks: number) { for (let index = 0; index < ticks; index++) fixedStep(); updateReadouts(); renderer.render(runtime.state); },
  restart,
  snapshot() {
    return {
      ...loopSummary(),
      status: driver.status(),
      lastLoop,
      defenderPhase: runtime.state.fighters.p2.phase,
      checksum: runtime.checksum,
      tick: runtime.state.tick
    };
  }
};
