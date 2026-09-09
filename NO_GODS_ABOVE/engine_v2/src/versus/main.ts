import "./style.css";
import {
  createMatch, fighterExtendedHurtboxes, fighterPushbox, projectileWorldRect, resolveAttackDefinition, tick
} from "../core/engine";
import type { FighterId, FighterState, InputFrame, MatchState, Rect } from "../core/types";
import { ROSTER, ROSTER_ORDER, TARGET_BODY_UNITS, WORLD_SCALE, type CharacterId } from "./roster";
import { createPresenter, type Presenter } from "./presentation";
import { LamuhTribunalArena } from "../lamuhlegacy/tribunalArena";

// Canvas geometry is dictated by the Tribunal renderer, which maps this flat combat
// canvas onto a fixed world-space plane at PIXELS_PER_SIM = WORLD_SCALE and treats
// `height - 80` as the floor line. Matching it here is what lets the same canvas be
// used both flat and inside the 3D arena.
const STAGE_W = 1600, STAGE_H = 900;
const GROUND_Y = STAGE_H - 80;
const CANVAS_CENTRE = STAGE_W / 2;

type Selection = Record<FighterId, CharacterId>;
type ControlScheme = Record<string, keyof InputFrame>;

// P1 keeps the mapping the Lamuh sandbox already uses, so muscle memory carries over.
const P1_KEYS: ControlScheme = {
  KeyA: "left", KeyD: "right", KeyS: "down", KeyW: "up",
  KeyJ: "light", KeyK: "medium", KeyL: "heavy", KeyU: "special", KeyI: "throw", KeyO: "block", KeyP: "ultimate"
};
// P2 gets arrows plus both a numpad cluster and a punctuation cluster, so the
// second player works on a laptop with no numeric keypad.
const P2_KEYS: ControlScheme = {
  ArrowLeft: "left", ArrowRight: "right", ArrowDown: "down", ArrowUp: "up",
  Numpad1: "light", Numpad2: "medium", Numpad3: "heavy", Numpad5: "special", Numpad4: "throw", Numpad6: "block", Numpad0: "ultimate",
  Comma: "light", Period: "medium", Slash: "heavy", Semicolon: "special", Quote: "throw", ShiftRight: "block", Backslash: "ultimate"
};
const P1_DASH = "ShiftLeft", P2_DASH = "Numpad7";

function main() {
  if (!document.querySelector("#app")) throw new Error("Missing #app");
  const app = document.querySelector("#app") as HTMLElement;

  // Review deep links name the character they are meant to exercise.  Honor
  // that contract so `?character=swahili&air-specials-v1=1` never silently
  // leaves Swahili on the dummy side (or on the character-select screen).
  const query = new URLSearchParams(location.search);
  const requestedCharacter = query.get("character") as CharacterId | null;
  const hasRequestedCharacter = !!requestedCharacter && ROSTER_ORDER.includes(requestedCharacter);
  const selection: Selection = hasRequestedCharacter
    ? { p1: requestedCharacter!, p2: requestedCharacter! }
    : { p1: "lamuh", p2: "swahili" };
  const autoAirSpecialPlaytest = requestedCharacter === "swahili" && query.get("air-specials-v1") === "1";
  if (autoAirSpecialPlaytest) {
    void startMatch({ cpu: false, envelope: true, showBoxes: false });
  } else {
    renderSelect();
  }

  // -------------------------------------------------------------------------
  // Character select
  // -------------------------------------------------------------------------
  function renderSelect() {
    app.innerHTML = `
      <section class="select">
        <header>
          <p class="eyebrow">NGA Engine V2 · training mode · deterministic 60 Hz · playtest build, not a release</p>
          <h1>TRAINING — CHOOSE YOUR FIGHTERS</h1>
          <p class="lede">Training mode: P2 is a dummy you can set to stand, crouch, jump or block — or flip on the AI opponent. Both fighters are drawn to the same ${TARGET_BODY_UNITS}-unit body height and collide against full-body hitboxes. Mirror matches allowed; a second player can take over P2 at any time just by pressing their keys.</p>
        </header>
        <div class="picker">
          ${(["p1", "p2"] as FighterId[]).map((side) => `
            <div class="side" data-side="${side}">
              <h2>${side === "p1" ? "PLAYER 1" : "PLAYER 2"}</h2>
              <div class="cards">
                ${ROSTER_ORDER.map((id) => `
                  <button class="card" data-side="${side}" data-pick="${id}" style="--accent:${ROSTER[id].accent}">
                    <span class="card-name">${ROSTER[id].name}</span>
                    <span class="card-tag">${ROSTER[id].tagline}</span>
                    <span class="card-status">${ROSTER[id].animationStatus}</span>
                  </button>`).join("")}
              </div>
              <div class="controls">
                <h3>Controls</h3>
                ${side === "p1"
                  ? `<p><b>A</b>/<b>D</b> move · <b>W</b> jump · <b>S</b> crouch · <b>LShift</b> dash<br>
                     <b>J</b>/<b>K</b>/<b>L</b> light/medium/heavy · <b>U</b> special modifier<br>
                     <b>I</b> throw · <b>O</b> block · <b>P</b> ultimate</p>`
                  : `<p><b>&larr;</b>/<b>&rarr;</b> move · <b>&uarr;</b> jump · <b>&darr;</b> crouch · <b>Num7</b> dash<br>
                     <b>Num1/2/3</b> or <b>, . /</b> light/medium/heavy · <b>Num5</b> or <b>;</b> special<br>
                     <b>Num4</b> or <b>'</b> throw · <b>Num6</b> or <b>RShift</b> block · <b>Num0</b> or <b>\\</b> ultimate</p>`}
              </div>
            </div>`).join("")}
        </div>
        <div class="options">
          <label><input id="cpu" type="checkbox"> Start with AI opponent</label>
          <label><input id="envelope" type="checkbox" checked> Full-body hitboxes</label>
          <label><input id="showBoxes" type="checkbox"> Show boxes in match</label>
          <button id="fight">FIGHT</button>
        </div>
        <p class="fine">Special moves: hold the special modifier and a direction, then a strength. Lamuh: neutral = Celestial Palm, forward = Ascend Step, back = Divine Vanish, down = Aura Sweep, up (hold special then jump) = Heaven Splitter, air = Radiant Dive. Swahili: neutral/forward/down + strength, and up + heavy = Grave Furrow.</p>
      </section>`;

    const paint = () => app.querySelectorAll<HTMLElement>(".card").forEach((card) => {
      card.classList.toggle("picked", selection[card.dataset.side as FighterId] === card.dataset.pick);
    });
    app.querySelectorAll<HTMLButtonElement>(".card").forEach((card) => card.addEventListener("click", () => {
      selection[card.dataset.side as FighterId] = card.dataset.pick as CharacterId;
      paint();
    }));
    paint();
    app.querySelector<HTMLButtonElement>("#fight")!.addEventListener("click", () => {
      void startMatch({
        cpu: app.querySelector<HTMLInputElement>("#cpu")!.checked,
        envelope: app.querySelector<HTMLInputElement>("#envelope")!.checked,
        showBoxes: app.querySelector<HTMLInputElement>("#showBoxes")!.checked
      });
    });
  }

  // -------------------------------------------------------------------------
  // Match
  // -------------------------------------------------------------------------
  async function startMatch(options: { cpu: boolean; envelope: boolean; showBoxes: boolean }) {
    const chosen: Record<FighterId, CharacterId> = { ...selection };
    app.innerHTML = `
      <section class="match">
        <div class="loading"><h2>Preparing fighters…</h2><progress id="progress" max="100" value="0"></progress><p id="progressLabel" class="fine"></p></div>
      </section>`;
    const label = app.querySelector<HTMLElement>("#progressLabel")!;
    const progress = app.querySelector<HTMLProgressElement>("#progress")!;

    const presenters: Record<FighterId, Presenter> = {
      p1: createPresenter(chosen.p1),
      p2: createPresenter(chosen.p2)
    };
    // A mirror match shares one presenter's cache by loading the same set twice;
    // load sequentially so the progress bar is meaningful and memory stays flat.
    for (const side of ["p1", "p2"] as FighterId[]) {
      label.textContent = `Loading ${ROSTER[chosen[side]].name} frames…`;
      await presenters[side].preload((done, total) => {
        progress.value = total ? Math.round((side === "p1" ? 0 : 50) + (done / total) * 50) : 0;
      });
    }

    renderMatch(chosen, presenters, options);
  }

  function renderMatch(chosen: Record<FighterId, CharacterId>, presenters: Record<FighterId, Presenter>, options: { cpu: boolean; envelope: boolean; showBoxes: boolean }) {
    app.innerHTML = `
      <section class="match">
        <div class="hud">
          ${(["p1", "p2"] as FighterId[]).map((side) => `
            <div class="hud-side ${side}">
              <div class="hud-name" style="color:${ROSTER[chosen[side]].accent}">${ROSTER[chosen[side]].name}</div>
              <div class="bar health"><i id="${side}Health"></i></div>
              <div class="bar tension"><i id="${side}Tension"></i></div>
            </div>`).join("")}
        </div>
        <canvas id="stage" width="${STAGE_W}" height="${STAGE_H}"></canvas>
        <div class="toolbar">
          <button id="pause">Pause</button>
          <button id="step">+1 tick</button>
          <button id="reset">Reset positions</button>
          <label class="ai"><input id="aiToggle" type="checkbox" ${options.cpu ? "checked" : ""}> <b>AI opponent</b></label>
          <label>Dummy
            <select id="dummy">
              <option value="stand">Stand</option>
              <option value="crouch">Crouch</option>
              <option value="jump">Jump</option>
              <option value="block_all">Block all</option>
              <option value="block_after_hit">Block after first hit</option>
            </select>
          </label>
          <label>AI
            <select id="aiLevel">
              <option value="easy">Easy</option>
              <option value="normal" selected>Normal</option>
              <option value="aggressive">Aggressive</option>
            </select>
          </label>
          <label><input id="infiniteHealth" type="checkbox" checked> Infinite health</label>
          <label><input id="infiniteMeter" type="checkbox"> Infinite meter</label>
          <label><input id="boxes" type="checkbox" ${options.showBoxes ? "checked" : ""}> boxes</label>
          <label><input id="envelopeToggle" type="checkbox" ${options.envelope ? "checked" : ""}> full-body hitboxes</label>
          <label><input id="half" type="checkbox"> 0.5&times;</label>
          <button id="swap">Swap sides</button>
          <button id="back">Character select</button>
        </div>
        ${(["p1", "p2"] as FighterId[]).filter((side) => chosen[side] === "swahili").map((side) => `
          <div class="air-practice" data-air-side="${side}">
            <span><b>Swahili air-special gameplay rehearsal (${side.toUpperCase()})</b> · jump, then U + strength · dedicated art pending</span>
            <button data-air-strength="light">Air Light <kbd>U + J</kbd></button>
            <button data-air-strength="medium">Air Medium <kbd>U + K</kbd></button>
            <button data-air-strength="heavy">Air Heavy <kbd>U + L</kbd></button>
          </div>`).join("")}
        <div class="panels">
          <article class="panel"><h3>Training readout</h3><div id="readout" class="readout"></div></article>
          <article class="panel"><h3>Move list</h3><div id="moveList" class="movelist"></div></article>
          <article class="panel"><h3>Animation coverage</h3><div id="coverage" class="coverage"></div></article>
          <article class="panel wide"><h3>Body check</h3><div id="bodyCheck" class="readout"></div></article>
        </div>
      </section>`;

    const canvas = app.querySelector<HTMLCanvasElement>("#stage")!;
    const context = canvas.getContext("2d")!;
    const checked = (id: string) => app.querySelector<HTMLInputElement>(`#${id}`)!.checked;

    // The Last Tribunal. The 2D canvas becomes the combat plane inside the real 3D
    // scene, which owns the camera — including the ultimate's charge orbit. `?arena=flat`
    // keeps the plain 2D fallback for frame inspection.
    let tribunal: LamuhTribunalArena | null = null;
    if (new URLSearchParams(location.search).get("arena") !== "flat") {
      const host = document.createElement("div");
      host.id = "tribunalStage";
      host.style.cssText = "width:100%;aspect-ratio:1600/900;position:relative;overflow:hidden;border-radius:10px;border:1px solid #1e2836";
      canvas.before(host);
      try {
        tribunal = new LamuhTribunalArena(host);
        void tribunal.ready.then(() => { canvas.style.display = "none"; });
      } catch (error) {
        console.error("Tribunal arena unavailable; flat fallback", error);
        tribunal = null; host.remove();
      }
    }

    let state = newMatch();
    let playing = true, halfAccumulator = 0, active = true;
    const heldKeys = new Set<string>();
    const queued: Record<FighterId, InputFrame[]> = { p1: [], p2: [] };

    function newMatch(seed = 1): MatchState {
      const useEnvelope = app.querySelector<HTMLInputElement>("#envelopeToggle")?.checked ?? options.envelope;
      return createMatch(seed, {
        p1Kind: ROSTER[chosen.p1].kind,
        p2Kind: ROSTER[chosen.p2].kind,
        p1X: -110, p2X: 110,
        // Both characters' Swahili air specials ride the same match-level flag.
        swahiliAirSpecialsV1: ROSTER[chosen.p1].swahiliAirSpecialsV1 || ROSTER[chosen.p2].swahiliAirSpecialsV1,
        ...(useEnvelope ? { p1BodyEnvelope: ROSTER[chosen.p1].envelope, p2BodyEnvelope: ROSTER[chosen.p2].envelope } : {})
      });
    }

    // --- input ---
    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("keyup", onKeyUp);
    window.addEventListener("blur", () => heldKeys.clear());

    function onKeyDown(event: KeyboardEvent) {
      if (event.code === "Escape") { playing = !playing; syncPause(); event.preventDefault(); return; }
      if (event.code === P1_DASH && !event.repeat) { queueDash("p1"); event.preventDefault(); return; }
      if (event.code === P2_DASH && !event.repeat) { queueDash("p2"); event.preventDefault(); return; }
      if (P1_KEYS[event.code] || P2_KEYS[event.code]) { heldKeys.add(event.code); event.preventDefault(); }
    }
    function onKeyUp(event: KeyboardEvent) { heldKeys.delete(event.code); }

    function readKeys(scheme: ControlScheme): InputFrame {
      const input: InputFrame = {};
      for (const code of heldKeys) { const action = scheme[code]; if (action) (input as any)[action] = true; }
      return input;
    }
    /** A dash is a deterministic forward-tap, gap, forward-tap; queue it as real frames. */
    function queueDash(side: FighterId) {
      const f = state.fighters[side];
      const tap: InputFrame = f.facing === 1 ? { right: true } : { left: true };
      queued[side].push(tap, {}, tap);
    }

    const select = (id: string) => app.querySelector<HTMLSelectElement>(`#${id}`)!.value;
    let dummyHasBeenHit = false;

    /**
     * Deterministic 0..1 from an integer. The training AI must be reproducible —
     * the same match seed and the same inputs have to replay identically — so it
     * never touches Math.random.
     */
    function hash(value: number, salt: number): number {
      let n = (value * 2654435761 + salt * 40503) >>> 0;
      n ^= n >>> 15; n = Math.imul(n, 2246822519); n ^= n >>> 13; n = Math.imul(n, 3266489917); n ^= n >>> 16;
      return (n >>> 0) / 4294967296;
    }

    /**
     * Training AI. Deterministic on the match tick so a run is reproducible;
     * difficulty changes reaction distance and how often it commits, not whether
     * it cheats. It only acts out of neutral, so it never ignores its own recovery.
     */
    function aiInput(): InputFrame {
      const cpu = state.fighters.p2, target = state.fighters.p1;
      if (cpu.phase !== "idle" && cpu.phase !== "walk_forward" && cpu.phase !== "walk_backward") return {};
      const distance = target.x - cpu.x, gap = Math.abs(distance);
      const toward = distance > 18 ? "right" : distance < -18 ? "left" : null;
      const away = toward === "right" ? "left" : "right";
      const level = select("aiLevel");
      const tuning = level === "aggressive" ? { reach: 200, cadence: 14, guard: 0.15 }
        : level === "easy" ? { reach: 120, cadence: 46, guard: 0.5 }
        : { reach: 160, cadence: 26, guard: 0.3 };

      // Guard while the player is committed to a move, more often at lower levels.
      if (target.phase === "attack" && gap < 150 && hash(state.tick, 11) < tuning.guard) return { block: true };
      if (gap > tuning.reach) return toward ? { [toward]: true } as InputFrame : {};

      // One decision per cadence window, so options actually compete instead of
      // whichever modulo happens to line up first.
      const window = Math.floor(state.tick / tuning.cadence);
      if (state.tick % tuning.cadence !== 0) return toward && gap > 70 ? { [toward]: true } as InputFrame : {};
      const roll = hash(window, 7);
      const dir = toward ? { [toward]: true } : {};
      if (gap > 110) return roll < 0.55 ? { ...dir } as InputFrame : { special: true, medium: true } as InputFrame;
      if (roll < 0.22) return { light: true };
      if (roll < 0.42) return { medium: true };
      if (roll < 0.58) return { heavy: true };
      if (roll < 0.68) return { down: true, medium: true };
      if (roll < 0.78) return { special: true, medium: true, ...dir } as InputFrame;
      if (roll < 0.86) return { special: true, light: true } as InputFrame;
      if (roll < 0.92) return { throw: true };
      if (roll < 0.97) return { block: true };
      return { [away]: true } as InputFrame;
    }

    /** Recording dummy behaviour: a fixed stance so a combo can be practised. */
    function dummyInput(): InputFrame {
      switch (select("dummy")) {
        case "crouch": return { down: true };
        case "jump": return state.fighters.p2.grounded && state.tick % 40 === 0 ? { up: true } : {};
        case "block_all": return { block: true, ...(state.fighters.p2.crouchBlocking ? {} : {}) };
        case "block_after_hit": return dummyHasBeenHit ? { block: true } : {};
        default: return {};
      }
    }

    function inputFor(side: FighterId): InputFrame {
      if (queued[side].length) return queued[side].shift()!;
      // P2 is the training dummy unless a second player takes it over. Any P2 key
      // press wins over the dummy/AI for that frame, so two-player still works.
      if (side === "p2") {
        const human = readKeys(P2_KEYS);
        if (Object.keys(human).length) return human;
        return checked("aiToggle") ? aiInput() : dummyInput();
      }
      return readKeys(P1_KEYS);
    }

    /** Training conveniences applied after each tick, never inside the simulation. */
    function applyTrainingRules() {
      const p1 = state.fighters.p1, p2 = state.fighters.p2;
      if (state.lastCombatEvent?.defender === "p2" && state.lastCombatEvent.outcome === "hit") dummyHasBeenHit = true;
      if (checked("infiniteHealth")) {
        // Refill only once the fighter is out of hitstun, so damage still reads.
        if (p1.hitstun === 0 && p1.blockstun === 0 && p1.phase !== "hit_reaction") p1.health = 1000;
        if (p2.hitstun === 0 && p2.blockstun === 0 && p2.phase !== "hit_reaction") p2.health = 1000;
      }
      if (checked("infiniteMeter")) { p1.tension = 100; p2.tension = 100; }
    }

    // --- loop ---
    let engineFaults = 0, lastFault = "";
    /**
     * Runs one simulation tick.
     *
     * The engine asserts that pushboxes never overlap outside a throw, but it skips
     * push resolution on the tick a throw interaction ends. Throw an opponent into a
     * corner and that assertion fires and would otherwise kill the loop. That is a
     * pre-existing engine bug (it reproduces with the body envelope disabled), so it
     * is NOT patched here — training mode just refuses to die on it: the fighters are
     * separated the way resolvePush would have, and the fault is surfaced in the
     * readout instead of being swallowed.
     */
    function stepSimulation() {
      try {
        tick(state, { p1: inputFor("p1"), p2: inputFor("p2") });
      } catch (error) {
        engineFaults += 1;
        lastFault = error instanceof Error ? error.message : String(error);
        separateFighters();
      }
      applyTrainingRules();
    }

    function separateFighters() {
      const p1 = state.fighters.p1, p2 = state.fighters.p2;
      const a = fighterPushbox(p1), b = fighterPushbox(p2);
      const left = a.x <= b.x ? p1 : p2, right = left === p1 ? p2 : p1;
      const leftBox = left === p1 ? a : b, rightBox = left === p1 ? b : a;
      const depth = Math.max(0, leftBox.x + leftBox.w - rightBox.x) + 0.5;
      if (depth <= 0) return;
      const leftRoom = Math.max(0, left.x - state.stage.left);
      const rightRoom = Math.max(0, state.stage.right - right.x);
      const leftShift = Math.min(depth / 2, leftRoom);
      const rightShift = Math.min(depth - leftShift, rightRoom);
      left.x = Math.max(state.stage.left, left.x - leftShift);
      right.x = Math.min(state.stage.right, right.x + Math.max(rightShift, depth - leftShift));
    }

    // Fixed-timestep accumulator: the simulation only ever advances in whole
    // deterministic 60 Hz ticks, and a stall is clamped rather than replayed.
    let lastFrame = performance.now(), accumulator = 0, lastRafAt = performance.now();

    function advance(now: number) {
      const delta = Math.min(250, now - lastFrame);
      lastFrame = now;
      if (playing) {
        accumulator += delta;
        const stepMs = checked("half") ? 1000 / 30 : 1000 / 60;
        let steps = 0;
        while (accumulator >= stepMs && steps < 6) { stepSimulation(); accumulator -= stepMs; steps += 1; }
        if (accumulator > stepMs * 6) accumulator = 0;
      }
      render();
    }

    function loop(now: number) {
      if (!active) return;
      lastRafAt = now;
      advance(now);
      requestAnimationFrame(loop);
    }

    // Animation frames stop arriving when the host pane is not compositing, even
    // though document.hidden stays false. Without this the match silently freezes
    // whenever the preview pane is hidden. The watchdog only takes over once
    // frames have actually stopped, so it never double-drives the simulation.
    const watchdog = window.setInterval(() => {
      const now = performance.now();
      if (active && now - lastRafAt > 100) advance(now);
    }, 100);

    // --- draw ---
    const worldX = (x: number) => CANVAS_CENTRE + x * WORLD_SCALE;
    const worldY = (y: number) => GROUND_Y + y * WORLD_SCALE;

    function rectWorld(f: FighterState, rect: Rect, facing = f.phase === "attack" ? f.attackFacing : f.facing): Rect {
      return { x: f.x + rect.x * facing - (facing < 0 ? rect.w : 0), y: f.y + rect.y, w: rect.w, h: rect.h };
    }
    function strokeRect(rect: Rect, colour: string, width = 2) {
      context.strokeStyle = colour; context.lineWidth = width;
      context.strokeRect(worldX(rect.x), worldY(rect.y), rect.w * WORLD_SCALE, rect.h * WORLD_SCALE);
    }

    const world = { x: worldX, y: worldY };
    function drawFighter(side: FighterId) {
      presenters[side].draw(context, state.fighters[side], state, world);
    }

    function drawBoxes(side: FighterId) {
      const f = state.fighters[side];
      strokeRect(fighterPushbox(f), "rgba(120,200,255,.55)", 1);
      for (const box of fighterExtendedHurtboxes(f)) strokeRect(box, "#4ade80");
      if (f.phase === "attack" && f.currentAttack) {
        const attack = resolveAttackDefinition(f);
        for (const hitbox of attack.hitboxes) {
          if (f.phaseTick < hitbox.start || f.phaseTick > hitbox.end) continue;
          strokeRect(rectWorld(f, hitbox.rect, f.attackFacing), "#ef4444", 3);
        }
      }
    }

    /**
     * A flat, cheap stand-in for The Last Tribunal. Deliberately 2D: the 3D
     * Tribunal renderer uploads the whole combat plane as a texture every frame,
     * which is the path that previously cost most of the frame budget. This
     * playtest is about how the two fighters read against each other.
     */
    function drawArena() {
      const sky = context.createLinearGradient(0, 0, 0, GROUND_Y);
      sky.addColorStop(0, "#0d1119"); sky.addColorStop(.65, "#161f2e"); sky.addColorStop(1, "#20293a");
      context.fillStyle = sky; context.fillRect(0, 0, STAGE_W, GROUND_Y);
      // Back wall columns
      for (let i = 0; i <= 8; i += 1) {
        const x = (STAGE_W / 8) * i;
        context.fillStyle = i % 2 ? "rgba(70,88,116,.13)" : "rgba(70,88,116,.07)";
        context.fillRect(x - 26, GROUND_Y - 330, 52, 330);
      }
      context.fillStyle = "rgba(233,196,106,.05)";
      context.beginPath(); context.arc(STAGE_W / 2, GROUND_Y - 250, 190, 0, Math.PI * 2); context.fill();
      // Floor
      const floor = context.createLinearGradient(0, GROUND_Y, 0, STAGE_H);
      floor.addColorStop(0, "#283145"); floor.addColorStop(1, "#111722");
      context.fillStyle = floor; context.fillRect(0, GROUND_Y, STAGE_W, STAGE_H - GROUND_Y);
      context.strokeStyle = "rgba(150,175,210,.35)"; context.lineWidth = 2;
      context.beginPath(); context.moveTo(0, GROUND_Y); context.lineTo(STAGE_W, GROUND_Y); context.stroke();
      // Floor perspective lines, so travel distance is readable
      context.strokeStyle = "rgba(120,145,180,.12)"; context.lineWidth = 1;
      for (let u = -400; u <= 400; u += 80) {
        context.beginPath(); context.moveTo(worldX(u), GROUND_Y); context.lineTo(worldX(u * 1.6), STAGE_H); context.stroke();
      }
      // Stage walls
      for (const edge of [state.stage.left, state.stage.right]) {
        context.strokeStyle = "rgba(233,196,106,.28)"; context.lineWidth = 2;
        context.beginPath(); context.moveTo(worldX(edge), 0); context.lineTo(worldX(edge), GROUND_Y); context.stroke();
      }
    }

    function render() {
      context.clearRect(0, 0, STAGE_W, STAGE_H);
      // Inside the Tribunal the canvas IS the combat plane: it must stay transparent
      // so the real 3D stage shows through. The flat backdrop is only for ?arena=flat.
      if (!tribunal) drawArena();
      // A shared height ruler makes the "same height" claim checkable on screen.
      if (checked("boxes")) {
        context.strokeStyle = "rgba(233,196,106,.35)"; context.setLineDash([6, 6]); context.lineWidth = 1;
        const headY = worldY(-TARGET_BODY_UNITS);
        context.beginPath(); context.moveTo(0, headY); context.lineTo(STAGE_W, headY); context.stroke();
        context.setLineDash([]);
        context.fillStyle = "rgba(233,196,106,.7)"; context.font = "12px ui-monospace, monospace";
        context.fillText(`shared body height ${TARGET_BODY_UNITS}u`, 12, headY - 6);
      }

      const order: FighterId[] = state.fighters.p1.x <= state.fighters.p2.x ? ["p1", "p2"] : ["p2", "p1"];
      for (const side of order) drawFighter(side);
      for (const projectile of (state as any).projectiles ?? []) {
        const owner = (projectile.owner ?? projectile.attacker) as FighterId | undefined;
        const drew = owner && presenters[owner]?.drawProjectile?.(context, projectile, world, WORLD_SCALE);
        if (!drew) {
          const rect = projectileWorldRect(projectile);
          context.fillStyle = "rgba(255,220,140,.75)";
          context.fillRect(worldX(rect.x), worldY(rect.y), rect.w * WORLD_SCALE, rect.h * WORLD_SCALE);
        }
      }
      for (const side of order) presenters[side].drawEffects?.(context, state, world, WORLD_SCALE);
      if (checked("boxes")) for (const side of order) drawBoxes(side);
      drawCinematicBars();

      // Present. The arena re-uploads this canvas as the combat plane every frame and
      // drives its own camera from state.ultimateInteraction.
      if (tribunal) { try { tribunal.render(state, canvas); } catch { /* keep the flat canvas visible */ } }
      updateHud();
    }

    /**
     * Ultimate letterbox.
     *
     * In the Tribunal the canvas is a textured plane inside the 3D scene, so bars
     * painted onto it would tilt and slide with the camera. They belong in screen
     * space, so there they are a DOM overlay; in the flat fallback the canvas IS
     * the screen and painting them is correct.
     */
    function drawCinematicBars() {
      const shot = (state as any).ultimateInteraction;
      if (tribunal) { toggleDomBars(!!shot); return; }
      if (!shot) return;
      const height = Math.round(STAGE_H * 0.09);
      context.save();
      context.fillStyle = "rgba(2,6,12,.94)";
      context.fillRect(0, 0, STAGE_W, height);
      context.fillRect(0, STAGE_H - height, STAGE_W, height);
      context.fillStyle = "#e5dba9";
      context.font = "600 18px system-ui";
      context.fillText("CROWN OF NO GODS · CELESTIAL CANDIDATE", 28, Math.round(height * 0.62));
      context.restore();
    }

    let domBars: HTMLElement | null = null;
    function toggleDomBars(show: boolean) {
      const host = document.querySelector<HTMLElement>("#tribunalStage");
      if (!host) return;
      if (show && !domBars) {
        domBars = document.createElement("div");
        domBars.className = "cinematic-bars";
        domBars.innerHTML = `<i></i><span>CROWN OF NO GODS · CELESTIAL CANDIDATE</span><i></i>`;
        host.append(domBars);
      } else if (!show && domBars) { domBars.remove(); domBars = null; }
    }

    function updateHud() {
      for (const side of ["p1", "p2"] as FighterId[]) {
        const f = state.fighters[side];
        const max = f.health > 0 ? Math.max(f.health, 1000) : 1000;
        app.querySelector<HTMLElement>(`#${side}Health`)!.style.width = `${Math.max(0, (f.health / max) * 100)}%`;
        app.querySelector<HTMLElement>(`#${side}Tension`)!.style.width = `${Math.max(0, Math.min(100, f.tension))}%`;
      }
      const rows = (["p1", "p2"] as FighterId[]).map((side) => {
        const f = state.fighters[side];
        const boxes = fighterExtendedHurtboxes(f);
        const top = boxes.length ? Math.min(...boxes.map((b) => b.y)) : 0;
        const bottom = boxes.length ? Math.max(...boxes.map((b) => b.y + b.h)) : 0;
        return { side, name: ROSTER[chosen[side]].name, f, span: (bottom - top).toFixed(0), top: top.toFixed(0) };
      });
      // The ✓ compares each fighter's CONFIGURED standing envelope, not the live box:
      // a crouching or downed fighter is meant to be shorter, and that must not read
      // as the two characters having mismatched heights.
      const standing = (side: FighterId) => {
        const boxes = ROSTER[chosen[side]].envelope.standing;
        return Math.max(...boxes.map((b) => b.y + b.h)) - Math.min(...boxes.map((b) => b.y));
      };
      const matched = standing("p1") === standing("p2") && standing("p1") === TARGET_BODY_UNITS;
      app.querySelector<HTMLElement>("#bodyCheck")!.innerHTML = rows.map((r) => `
        <div class="row"><span>${r.name}</span><span>drawn ${TARGET_BODY_UNITS}u · standing ${standing(r.side)}u · live ${r.span}u (head ${r.top}u)${r.f.phase === "crouch" || r.f.phase === "knockdown" || r.f.phase === "getup" || r.f.crouchBlocking ? " · low profile" : ""}</span></div>`).join("")
        + `<div class="row note">${matched ? `✓ both fighters share one ${TARGET_BODY_UNITS}u standing body and full-body hitboxes` : "△ standing envelopes differ"}</div>`;

      const event = state.lastCombatEvent;
      app.querySelector<HTMLElement>("#readout")!.innerHTML = rows.map((r) => `
        <div class="row"><span>${r.name}</span><span>${r.f.phase}${r.f.currentAttack ? ` · ${r.f.currentAttack}` : ""}</span></div>
        <div class="row sub"><span>hp ${Math.round(r.f.health)} · meter ${Math.round(r.f.tension)}</span><span>combo ${r.f.comboCount} · dmg ${Math.round(r.f.comboDamage)}</span></div>
        <div class="row sub"><span>${r.f.phase === "attack" ? `frame ${r.f.phaseTick}` : r.f.hitstun ? `hitstun ${r.f.hitstun}` : r.f.blockstun ? `blockstun ${r.f.blockstun}` : "neutral"}</span><span>${r.f.airActionsRemaining ? `air ${r.f.airActionsRemaining}` : ""}</span></div>`).join("")
        + `<div class="row sub"><span>tick ${state.tick}</span><span>gap ${Math.abs(state.fighters.p1.x - state.fighters.p2.x).toFixed(0)}u</span></div>`
        + (event ? `<div class="row note">last: ${event.attacker} ${event.attackId} — ${event.outcome}${event.damage ? ` ${Math.round(event.damage)}` : ""}</div>` : "")
        + (engineFaults ? `<div class="row fault">engine fault x${engineFaults}: ${lastFault}</div>` : "");
    }

    app.querySelector<HTMLElement>("#moveList")!.innerHTML = (["p1", "p2"] as FighterId[]).map((side) => `
      <div class="cov-block"><h4 style="color:${ROSTER[chosen[side]].accent}">${ROSTER[chosen[side]].name}${side === "p2" ? " (dummy)" : ""}</h4>
      ${presenters[side].moveList().map((m) => `<div class="cov-row ${m.animated ? "animated" : "placeholder"}"><span>${m.command}</span><span>${m.name}</span></div>`).join("")}</div>`).join("");

    app.querySelector<HTMLElement>("#coverage")!.innerHTML = (["p1", "p2"] as FighterId[]).map((side) => `
      <div class="cov-block"><h4 style="color:${ROSTER[chosen[side]].accent}">${ROSTER[chosen[side]].name}</h4>
      ${presenters[side].coverage().map((row) => `<div class="cov-row ${row.status}"><span>${row.label}</span><span>${row.detail}</span></div>`).join("")}</div>`).join("");

    // --- controls ---
    function syncPause() { app.querySelector<HTMLElement>("#pause")!.textContent = playing ? "Pause" : "Play"; }
    app.querySelector<HTMLButtonElement>("#pause")!.addEventListener("click", () => { playing = !playing; syncPause(); });
    app.querySelector<HTMLButtonElement>("#step")!.addEventListener("click", () => { playing = false; syncPause(); stepSimulation(); render(); });
    app.querySelector<HTMLButtonElement>("#reset")!.addEventListener("click", () => { state = newMatch(state.seed + 1); queued.p1 = []; queued.p2 = []; dummyHasBeenHit = false; });
    app.querySelector<HTMLInputElement>("#envelopeToggle")!.addEventListener("change", () => { state = newMatch(state.seed); queued.p1 = []; queued.p2 = []; });
    app.querySelector<HTMLButtonElement>("#swap")!.addEventListener("click", () => {
      const swapped = { p1: chosen.p2, p2: chosen.p1 };
      const swappedPresenters = { p1: presenters.p2, p2: presenters.p1 };
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("keyup", onKeyUp);
      window.clearInterval(watchdog);
      active = false; playing = false;
      renderMatch(swapped, swappedPresenters, { ...options, cpu: checked("aiToggle"), envelope: checked("envelopeToggle"), showBoxes: checked("boxes") });
    });
    app.querySelector<HTMLButtonElement>("#back")!.addEventListener("click", () => {
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("keyup", onKeyUp);
      window.clearInterval(watchdog);
      active = false;
      playing = false;
      document.querySelector("#tribunalStage")?.remove();
      delete (window as any).__versus;
      renderSelect();
    });

    /**
     * Deterministic one-click air-special rehearsal.  It uses the same real
     * input path as the keyboard: jump startup, four neutral ticks, then the
     * simultaneous special/strength chord.  Resetting first keeps the clip
     * visible even when the previous attempt ended in recovery or hitstun.
     */
    function queueAirSpecial(side: FighterId, strength: "light" | "medium" | "heavy") {
      state = newMatch(state.seed + 1);
      queued.p1 = []; queued.p2 = []; dummyHasBeenHit = false;
      const chord = { special: true, [strength]: true } as InputFrame;
      queued[side].push({ up: true }, {}, {}, {}, {}, chord);
      playing = true;
      syncPause();
    }
    // The side marker lives on the practice strip; strength lives on each
    // button. Select the latter, then walk up to the strip in the handler.
    app.querySelectorAll<HTMLButtonElement>(".air-practice [data-air-strength]").forEach((button) => {
      button.addEventListener("click", () => {
        const host = button.closest<HTMLElement>("[data-air-side]");
        const side = host?.dataset.airSide as FighterId | undefined;
        const strength = button.dataset.airStrength as "light" | "medium" | "heavy" | undefined;
        if (side && strength) queueAirSpecial(side, strength);
      });
    });

    // Playtest inspection hook: lets a smoke script drive and read a real match
    // without simulating key hardware. Read-only apart from `queue`.
    (window as any).__versus = {
      get state() { return state; },
      get chosen() { return chosen; },
      get presenters() { return presenters; },
      queue: (side: FighterId, ...frames: InputFrame[]) => queued[side].push(...frames),
      pause: (value: boolean) => { playing = value; syncPause(); },
      step: () => { stepSimulation(); render(); }
    };

    void halfAccumulator;
    syncPause();
    requestAnimationFrame(loop);
  }
}

main();
