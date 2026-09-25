import "./style.css";
import { DebugRuntime } from "./debugRuntime";
import { KeyboardInputAdapter } from "./inputAdapter";
import { DebugRenderer } from "./debugRenderer";
import { ReplayRecording } from "../core/replay";
import { InputFrame, TICKS_PER_SECOND } from "../core/types";
import { currentAttackPhase } from "../core/engine";
import { fighterDefinitions } from "../data/fighters";
import { debugKeyboardMapping, reservedCombatActions } from "./inputMap";
import { createSpecialReviewScenario, SPECIAL_REVIEW_GROUPS_V3, SPECIAL_REVIEW_SCENARIOS, SpecialReviewScenarioId } from "./specialReviewScenarios";
import { createThrowReviewScenario, THROW_REVIEW_SCENARIO_ORDER_V3, THROW_REVIEW_SCENARIOS, ThrowReviewScenarioId } from "./throwReviewScenarios";
import { resolveReviewDeepLink } from "./reviewDeepLink";
import {
  createSpecialCadenceReviewScenario,
  observeSpecialCadenceReview,
  SPECIAL_CADENCE_SCENARIO_ORDER,
  SPECIAL_CADENCE_SCENARIOS,
  SpecialCadenceReviewSetup,
  SpecialCadenceScenarioId
} from "./specialCadenceScenarios";
import {
  createThrowCadenceReviewScenario,
  observeThrowCadenceReview,
  THROW_CADENCE_SCENARIO_ORDER,
  THROW_CADENCE_SCENARIOS,
  ThrowCadenceReviewSetup,
  ThrowCadenceScenarioId
} from "./throwCadenceScenarios";

const reviewDeepLinkResolution = resolveReviewDeepLink(
  location.search,
  Object.keys(SPECIAL_REVIEW_SCENARIOS),
  Object.keys(THROW_REVIEW_SCENARIOS)
);

const specialScenarioGroups = SPECIAL_REVIEW_GROUPS_V3.map((group) => `
  <div class="scenario-group" data-special-review-group="${group.id}">
    <h3>${group.label}</h3>
    <div class="buttons special-buttons">${group.scenarioIds.map((id) => {
      const scenario = SPECIAL_REVIEW_SCENARIOS[id];
      return `<button data-special-scenario="${id}" title="${scenario.reviewQuestion}">${scenario.shortLabel}</button>`;
    }).join("")}</div>
  </div>`).join("");

const throwScenarioButtons = THROW_REVIEW_SCENARIO_ORDER_V3.map((id) => {
  const scenario = THROW_REVIEW_SCENARIOS[id];
  return `<button data-throw-scenario="${id}" title="${scenario.reviewQuestion}">${scenario.shortLabel}</button>`;
}).join("");

const throwCadenceButtons = THROW_CADENCE_SCENARIO_ORDER.map((id) => {
  const scenario = THROW_CADENCE_SCENARIOS[id];
  return `<button data-throw-cadence-scenario="${id}" title="${scenario.reviewQuestion}">${scenario.shortLabel}</button>`;
}).join("");

const specialCadenceButtons = SPECIAL_CADENCE_SCENARIO_ORDER.map((id) => {
  const scenario = SPECIAL_CADENCE_SCENARIOS[id];
  return `<button data-special-cadence-scenario="${id}" title="${scenario.reviewQuestion}">${scenario.shortLabel}</button>`;
}).join("");

const NEW_MOTION_PREVIEWS = {
  forwardDown: {
    title: "Forward + Down redesigns · unfinished motion archive",
    url: "http://127.0.0.1:4196/tools/nga-forge/production/characters/swahili/reviews/swahili-forward-down-special-direction-rhythm-sampler-v1/review.html?rhythm-v1=1&embedded-playtest-v1=1&pose-playback-v2=1"
  },
  neutralBackUp: {
    title: "Neutral + Back + Up · unfinished motion archive",
    url: "http://127.0.0.1:4196/tools/nga-forge/production/characters/swahili/reviews/swahili-remaining-special-review-sampler-v1/review.html?remaining-v1=1&move=special_backward_medium&embedded-playtest-v1=1&pose-playback-v2=1"
  },
  graveFurrow: {
    title: "Grave Furrow · complete 16-frame animation V7",
    url: "http://127.0.0.1:4196/tools/nga-forge/production/characters/swahili/reviews/special-up-heavy-grave-furrow-running-slash-carry-motion-v7/review.html?embedded-playtest-v1=1&complete-motion-v7=1&layout-v2=1"
  }
} as const;
type NewMotionPreviewId = keyof typeof NEW_MOTION_PREVIEWS;
const FORWARD_DOWN_MOTION_PREVIEW_MOVES = [
  "special_forward_light",
  "special_forward_medium",
  "special_forward_heavy",
  "special_down_light",
  "special_down_medium"
] as const;
type ForwardDownMotionPreviewMove = typeof FORWARD_DOWN_MOTION_PREVIEW_MOVES[number];
const REMAINING_MOTION_PREVIEW_MOVES = [
  "special_neutral_light",
  "special_neutral_heavy",
  "special_backward_light",
  "special_backward_medium",
  "special_backward_heavy",
  "special_up_light"
] as const;
type RemainingMotionPreviewMove = typeof REMAINING_MOTION_PREVIEW_MOVES[number];
const GRAVE_FURROW_MOTION_PREVIEW_MOVES = ["special_up_heavy"] as const;
type GraveFurrowMotionPreviewMove = typeof GRAVE_FURROW_MOTION_PREVIEW_MOVES[number];
type MotionPreviewMove = ForwardDownMotionPreviewMove | RemainingMotionPreviewMove | GraveFurrowMotionPreviewMove;
const MOTION_PREVIEW_TITLES: Record<MotionPreviewMove, string> = {
  special_forward_light: "Forward Light · complete 16-frame animation V3",
  special_forward_medium: "Forward Medium · complete 16-frame animation V3",
  special_forward_heavy: "Forward Heavy · complete 16-frame animation V3",
  special_down_light: "Down Light · complete Stamped Shaft Check V3",
  special_down_medium: "Down Medium · Crossdraw Reprisal V6",
  special_neutral_light: "Neutral Light · Claim Check direction",
  special_neutral_heavy: "Neutral Heavy · two-hit Writ Enforcement direction",
  special_backward_light: "Backward Light · Deflect key-pose motion",
  special_backward_medium: "Backward Medium · Counter Conversion key poses",
  special_backward_heavy: "Backward Heavy · Contract Reversal direction",
  special_up_light: "Up Light · Pistol-Frame Check key poses",
  special_up_heavy: "Grave Furrow · complete 16-frame animation V7"
};
const COMPLETED_MOTION_PREVIEW_URLS: Partial<Record<MotionPreviewMove, string>> = {
  special_forward_light: "http://127.0.0.1:4196/tools/nga-forge/production/characters/swahili/reviews/special-forward-light-warning-drag-shaft-drive-motion-v3/review.html?embedded-playtest-v1=1&complete-motion-v3=1&layout-v2=1",
  special_forward_medium: "http://127.0.0.1:4196/tools/nga-forge/production/characters/swahili/reviews/special-forward-medium-shoulder-rip-combination-motion-v3/review.html?embedded-playtest-v1=1&complete-motion-v3=1&layout-v2=1",
  special_forward_heavy: "http://127.0.0.1:4196/tools/nga-forge/production/characters/swahili/reviews/special-forward-heavy-execution-crescent-motion-v3/review.html?embedded-playtest-v1=1&complete-motion-v3=1&layout-v2=1",
  special_down_light: "http://127.0.0.1:4196/tools/nga-forge/production/characters/swahili/reviews/special-down-light-stamped-shaft-check-motion-v3/review.html?embedded-playtest-v1=1&complete-motion-v3=1",
  special_down_medium: "http://127.0.0.1:4196/tools/nga-forge/production/characters/swahili/reviews/special-down-medium-crossdraw-reprisal-v6/review.html?embedded-playtest-v1=1&crossdraw-v6=1",
  special_up_heavy: "http://127.0.0.1:4196/tools/nga-forge/production/characters/swahili/reviews/special-up-heavy-grave-furrow-running-slash-carry-motion-v7/review.html?embedded-playtest-v1=1&complete-motion-v7=1&layout-v2=1"
};
const INCOMPLETE_MOTION_NOTICE_URL = "http://127.0.0.1:4196/tools/nga-forge/production/characters/swahili/reviews/swahili-incomplete-motion-notice-v1/review.html?embedded-playtest-v1=1";
function isForwardDownMotionPreviewMove(value: string | null): value is ForwardDownMotionPreviewMove {
  return value !== null && (FORWARD_DOWN_MOTION_PREVIEW_MOVES as readonly string[]).includes(value);
}
function isRemainingMotionPreviewMove(value: string | null): value is RemainingMotionPreviewMove {
  return value !== null && (REMAINING_MOTION_PREVIEW_MOVES as readonly string[]).includes(value);
}
function isGraveFurrowMotionPreviewMove(value: string | null): value is GraveFurrowMotionPreviewMove {
  return value !== null && (GRAVE_FURROW_MOTION_PREVIEW_MOVES as readonly string[]).includes(value);
}
function isMotionPreviewMoveForGroup(id: NewMotionPreviewId, value: string | null): value is MotionPreviewMove {
  if (id === "forwardDown") return isForwardDownMotionPreviewMove(value);
  if (id === "neutralBackUp") return isRemainingMotionPreviewMove(value);
  return isGraveFurrowMotionPreviewMove(value);
}
const pageSearchParams = new URLSearchParams(location.search);
const requestedNewMotionPreview = pageSearchParams.get("motionPreview");
const requestedNewMotionPreviewId = requestedNewMotionPreview && requestedNewMotionPreview in NEW_MOTION_PREVIEWS
  ? requestedNewMotionPreview as NewMotionPreviewId
  : null;
const requestedNewMotionPreviewMoveCandidate = pageSearchParams.get("motionPreviewMove");
const requestedNewMotionPreviewMove = requestedNewMotionPreviewId && isMotionPreviewMoveForGroup(requestedNewMotionPreviewId, requestedNewMotionPreviewMoveCandidate)
  ? requestedNewMotionPreviewMoveCandidate
  : null;
const requestedSpecialCadenceCandidate = pageSearchParams.get("cadenceScenario");
const requestedSpecialCadenceScenario = requestedSpecialCadenceCandidate && requestedSpecialCadenceCandidate in SPECIAL_CADENCE_SCENARIOS
  ? requestedSpecialCadenceCandidate as SpecialCadenceScenarioId
  : null;
const requestedThrowCadenceCandidate = pageSearchParams.get("throwCadenceScenario");
const requestedThrowCadenceScenario = requestedThrowCadenceCandidate && requestedThrowCadenceCandidate in THROW_CADENCE_SCENARIOS
  ? requestedThrowCadenceCandidate as ThrowCadenceScenarioId
  : null;
function newMotionPreviewHref(id: NewMotionPreviewId, move?: MotionPreviewMove) {
  const url = new URL(location.href);
  url.searchParams.set("motionPreview", id);
  if (move && isMotionPreviewMoveForGroup(id, move)) url.searchParams.set("motionPreviewMove", move);
  else url.searchParams.delete("motionPreviewMove");
  url.hash = "special-review-controls";
  return url.href.replaceAll("&", "&amp;");
}

const root = document.querySelector<HTMLDivElement>("#app")!;
root.innerHTML = `
  <main class="shell">
    <section id="viewport" class="viewport"></section>
    <aside class="panel">
      <h1>NGA Engine V2 Combat Systems V1</h1>
      <p class="contract-badge">combat_systems_v1 · deterministic candidate · Tension + Roman Cancel + Burst · no production balance authority</p>
      <p class="flow"><strong>Roman Cancel:</strong> spend 50 Tension just after your attack hits or is blocked to stop that move's recovery early. This lets you keep the combo going or recover sooner.</p>
      <p class="flow"><strong>Air Knockdown:</strong> Air Heavy ends the route by dropping the opponent into soft knockdown. Try J → K → L or J → K → J → K → L after launching.</p>
      <p class="flow"><strong>Control Strike:</strong> press U + K together with no direction for the compact one-hit Neutral Medium scythe candidate.</p>
      <p class="flow"><strong>Grounded Verdict:</strong> hold S and press U + L together for the two-hit Down Heavy: staff plant, gun-draw spin, then contract-bullet blast.</p>
      <p class="flow"><strong>Stamped Shaft Check:</strong> hold S and press U + J together for the complete weighted one-hit Down Light.</p>
      <p class="flow"><strong>Crossdraw Reprisal:</strong> hold S and press U + K together: duck into a low shot, rise into a second torso shot, then recover. The scythe remains mounted.</p>
      <p class="flow"><strong>Rising Scythe Hook:</strong> hold W and press U + K together for the one-hit Up Medium anti-air candidate.</p>
      <p class="flow"><strong>Completed Forward family:</strong> hold toward the opponent and press U + J for Forward Light V3, U + K for the two-hit Forward Medium V3, or U + L for Forward Heavy V3. Each uses its connected sixteen-frame arena animation.</p>
      <p class="flow"><strong>Special modifier:</strong> U does nothing alone. Press W + L together for the connected sixteen-frame Grave Furrow V7, or U + L during the valid air-combo cancel for the airborne ender.</p>
      <p class="flow"><strong>Universal Throw:</strong> press I at close range; hold away from the opponent + I for the backward side-switch throw.</p>
      <p class="flow"><strong>Command Grab:</strong> press U + I together for the frozen scythe capture, side switch, airborne release, and midair shot sequence.</p>
      <p class="flow"><strong>Air Tech:</strong> when airborne hitstun ends without a Heavy ender, tap a direction or attack/block to recover. Direction chooses forward, backward, or neutral tech. Missing the window before landing causes soft knockdown.</p>
      <p class="flow">Keyboard / replay → input adapter → 60 Hz sim → serializable state → Three.js debug renderer</p>
      <div id="combat-readout" class="combat-readout" aria-live="polite"><span id="combo-readout">READY</span><span id="recovery-readout">DEFENSE READY</span><span id="special-readout">SPECIAL REVIEW READY</span><span id="throw-readout">THROW REVIEW READY</span></div>
      <div class="buttons">
        <button id="mode">Mode: live</button><button id="review-speed">Review speed: 1×</button><button id="pause">Pause</button><button id="step">Step</button><button id="reset">Reset</button><button id="demo-grounded-verdict">Demo Grounded Verdict</button><button id="overlays">Toggle overlays</button><button id="dummy">Dummy: auto</button><button id="dummy-tech-back">Dummy Tech Back</button><button id="dummy-tech-neutral">Dummy Tech Neutral</button><button id="dummy-tech-forward">Dummy Tech Forward</button><button id="dummy-burst">Dummy Burst (B)</button><button id="camera-throw">Throw camera</button><button id="camera-ultimate">Ultimate camera</button><button id="camera-abort">Return camera</button><button id="export-tuning">Copy tuning JSON</button>
      </div>
      <section id="special-review-controls" class="review-controls special-review-controls" aria-labelledby="special-review-title">
        <h2 id="special-review-title">Special review controls</h2>
        <p>Deterministic hit, block, whiff, low-profile, complete P2 mirror, and completed-motion setups for the current gameplay candidates. Use Review speed for 1× and 0.5× motion checks. Each scenario queues one normal combat input tick; no result is human approval.</p>
        <div class="new-motion-callout" data-preview-authority="local-runtime-candidate">
          <p class="new-motion-kicker">SWAHILI MOVESET PLAYTEST · CROSSDRAW REPRISAL V6</p>
          <p><strong>Crossdraw Reprisal V6 replaces Down Medium with twelve authored poses and two timed shots. Forward Light/Medium/Heavy V3, Down Light V3, and Grave Furrow V7 remain available with animation repairs listed in the moveset audit.</strong> Use the six buttons below for instant hit setups, or use the real keyboard inputs during free play. Direction boards and key-pose-only GIFs remain in the separate decision hub until their connector frames are authored and validated.</p>
          <div class="new-motion-subgroup">
            <p class="new-motion-subgroup-title">Live moveset playtest · same completed frames</p>
            <div class="buttons new-motion-buttons">
              <button data-special-scenario="p1_forward_light_live_hit">Play Forward Light V3 · 16 frames · 1 hit</button>
              <button data-special-scenario="p1_forward_medium_live_hit">Play Forward Medium V3 · 16 frames · 2 hits</button>
              <button data-special-scenario="p1_forward_heavy_live_hit">Play Forward Heavy V3 · 16 frames · 1 hit</button>
              <button data-special-scenario="p1_down_light_fallback_hit">Play Down Light V3 · 16 frames · 1 hit</button>
              <button data-special-scenario="p1_down_medium_fallback_hit">Play Crossdraw Reprisal V6 · 12 poses · 2 hits</button>
              <button data-special-scenario="p1_grave_furrow_hit">Play Grave Furrow V7 · 16 frames · 1 hit</button>
            </div>
            <p class="new-motion-subgroup-title">Isolated animation references</p>
            <div class="buttons new-motion-buttons">
              <a class="new-motion-preview-link exact-motion-preview" data-new-motion-preview="forwardDown" data-motion-preview-move="special_forward_light" href="${newMotionPreviewHref("forwardDown", "special_forward_light")}">Open Forward Light animation reference</a>
              <a class="new-motion-preview-link exact-motion-preview" data-new-motion-preview="forwardDown" data-motion-preview-move="special_forward_medium" href="${newMotionPreviewHref("forwardDown", "special_forward_medium")}">Open Forward Medium animation reference</a>
              <a class="new-motion-preview-link exact-motion-preview" data-new-motion-preview="forwardDown" data-motion-preview-move="special_forward_heavy" href="${newMotionPreviewHref("forwardDown", "special_forward_heavy")}">Open Forward Heavy animation reference</a>
              <a class="new-motion-preview-link exact-motion-preview" data-new-motion-preview="forwardDown" data-motion-preview-move="special_down_light" href="${newMotionPreviewHref("forwardDown", "special_down_light")}">Open Down Light animation reference</a>
              <a class="new-motion-preview-link exact-motion-preview" data-new-motion-preview="forwardDown" data-motion-preview-move="special_down_medium" href="${newMotionPreviewHref("forwardDown", "special_down_medium")}">Open Down Medium animation reference</a>
              <a class="new-motion-preview-link exact-motion-preview" data-new-motion-preview="graveFurrow" data-motion-preview-move="special_up_heavy" href="${newMotionPreviewHref("graveFurrow", "special_up_heavy")}">Open Grave Furrow animation reference</a>
            </div>
          </div>
          <div class="new-motion-subgroup">
            <p class="new-motion-subgroup-title">Unfinished direction/key-pose work</p>
            <p>These moves are intentionally absent from the animation player until each has a complete connector pass. Opening an old exact deep link now shows an honest incomplete-motion notice instead of a pose slideshow.</p>
            <div class="buttons new-motion-buttons">
              <a class="review-link review-hub-link" href="http://127.0.0.1:4196/tools/nga-forge/production/characters/swahili/reviews/swahili-v2-special-throw-review-hub-v1/review.html?hub-v1=1" target="_blank" rel="noreferrer">Open unfinished direction-art decision hub</a>
            </div>
          </div>
        </div>
        ${specialScenarioGroups}
        <div class="scenario-group" data-special-review-group="repeat_cadence">
          <h3>Recovery + repeat cadence</h3>
          <p>Each button whiffs the same move twice. The second fresh input is queued on the first neutral tick after full recovery, exposing the real earliest repeat rhythm without changing timing, damage, hitboxes, or input rules.</p>
          <div class="buttons special-buttons cadence-buttons">${specialCadenceButtons}</div>
        </div>
      </section>
      <section id="throw-review-controls" class="review-controls" aria-labelledby="throw-review-title">
        <h2 id="throw-review-title">Throw review controls</h2>
        <p>Each button resets a deterministic candidate-only setup and queues exactly one normal combat input tick. V3 includes P1/P2 forward, back, and Command Grab corner checks while preserving the same approved motion and combat definitions.</p>
        <div class="buttons throw-buttons">${throwScenarioButtons}</div>
        <div class="scenario-group" data-throw-review-group="repeat_cadence">
          <h3>Throw recovery + repeat cadence</h3>
          <p>Each button whiffs the same throw twice from far range. The second fresh input is queued on the first neutral tick after the full whiff, exposing universal-throw and frozen Command Grab commitment without changing timing, range, damage, or choreography.</p>
          <div class="buttons throw-buttons throw-cadence-buttons">${throwCadenceButtons}</div>
        </div>
      </section>
      <pre id="hud"></pre><textarea id="tuning" readonly rows="8"></textarea>
      <p class="help">Hold D to earn Tension and close range · J/K/L = Light/Medium/Heavy · U alone = no action · U+K with no direction = Neutral Medium control strike · hold toward + U+J/U+K/U+L = Forward Light V3 / Forward Medium V3 two-hit / Forward Heavy V3 · S+U+J = Down Light Stamped Shaft Check V3 · S+U+K = Down Medium Crossdraw Reprisal V6 two-hit process · S+U+L = Down Heavy Grounded Verdict (staff plant → gun spin → contract blast) · W+U+K = Up Medium rising scythe hook · I = universal throw; hold away + I = back throw; U+I = Command Grab · W+L = Grave Furrow V7 · U+L during a valid air cancel = system-test ender · air knockdown routes: J → K → L or J → K → J → K → L · H spends 50 Tension after contact to end your move early · P Burst while P1 is hit · B queues dummy Burst during hitstun · use Dummy Tech buttons during airborne hitstun · RC route: J → K → H → S+L → W+D → J → K → L → U+L · Esc pause · R reset</p>
    </aside>
    <div id="new-motion-preview-modal" class="new-motion-preview-modal" data-completed-motion-version="8" role="dialog" aria-modal="true" aria-labelledby="new-motion-preview-title" hidden>
      <div class="new-motion-preview-dialog">
        <header>
          <div>
            <p class="new-motion-kicker">COMPLETED SPRITE ANIMATION REFERENCE · LIVE ARENA CANDIDATE</p>
            <h2 id="new-motion-preview-title">New motion preview</h2>
          </div>
          <button id="close-new-motion-preview" type="button" aria-label="Close new motion preview">Close ×</button>
        </header>
        <p class="new-motion-preview-boundary">This isolated reference plays the same connected frames now used by the arena candidate for this move. Approval here covers only the shown motion; roster, deployment, and release stay gated.</p>
        <iframe id="new-motion-preview-frame" title="Swahili new motion preview" loading="eager"></iframe>
      </div>
    </div>
  </main>`;

const viewport = document.querySelector<HTMLDivElement>("#viewport")!;
const hud = document.querySelector<HTMLPreElement>("#hud")!;
const comboReadout = document.querySelector<HTMLSpanElement>("#combo-readout")!;
const recoveryReadout = document.querySelector<HTMLSpanElement>("#recovery-readout")!;
const specialReadout = document.querySelector<HTMLSpanElement>("#special-readout")!;
const throwReadout = document.querySelector<HTMLSpanElement>("#throw-readout")!;
const newMotionPreviewModal = document.querySelector<HTMLDivElement>("#new-motion-preview-modal")!;
const newMotionPreviewFrame = document.querySelector<HTMLIFrameElement>("#new-motion-preview-frame")!;
const newMotionPreviewTitle = document.querySelector<HTMLHeadingElement>("#new-motion-preview-title")!;
const renderer = new DebugRenderer(viewport);
const input = new KeyboardInputAdapter();
input.attach(window);
const runtime = new DebugRuntime({ seed: 1234 });
(window as any).__NGA_ENGINE_V2_DEBUG__ = { runtime, renderer, stageReady: renderer.whenReady() };
let replay: ReplayRecording | null = null;
let accumulator = 0;
let lastTime = performance.now();
let reviewSpeed: 1 | 0.5 = 1;
const maxCatchUp = 5 / TICKS_PER_SECOND;

async function loadReplay() {
  replay = await fetch("/replays/lamuh_light_opening.replay.json").then((r) => r.json());
  return replay;
}

function setModeLabel() {
  document.querySelector<HTMLButtonElement>("#mode")!.textContent = `Mode: ${runtime.mode}`;
}

function toggleReviewSpeed() {
  reviewSpeed = reviewSpeed === 1 ? 0.5 : 1;
  document.querySelector<HTMLButtonElement>("#review-speed")!.textContent = `Review speed: ${reviewSpeed === 1 ? "1×" : "0.5×"}`;
}

function toggleOverlays() {
  const enabled = !renderer.overlays.push;
  Object.assign(renderer.overlays, { push: enabled, hurt: enabled, strike: enabled, origin: enabled, facing: enabled, ground: true });
}

let lastDevice = input.read();
let queuedP1Input: InputFrame = {};
let queuedP2Input: InputFrame = {};
let activeSpecialReviewScenario: SpecialReviewScenarioId | null = null;
let specialReviewStarted = false;
let specialReviewDefenderStartHealth = 0;
let activeSpecialCadenceReview: SpecialCadenceReviewSetup | null = null;
let activeThrowReviewScenario: ThrowReviewScenarioId | null = null;
let activeThrowCadenceReview: ThrowCadenceReviewSetup | null = null;
let activeNewMotionPreview: NewMotionPreviewId | null = null;
let activeNewMotionPreviewMove: MotionPreviewMove | null = null;
function openNewMotionPreview(id: NewMotionPreviewId, requestedMove?: string | null) {
  const preview = NEW_MOTION_PREVIEWS[id];
  const previewMoveCandidate = requestedMove ?? (id === "graveFurrow" ? "special_up_heavy" : null);
  const previewMove: MotionPreviewMove | null = isMotionPreviewMoveForGroup(id, previewMoveCandidate)
    ? previewMoveCandidate
    : null;
  const completedUrl = previewMove ? COMPLETED_MOTION_PREVIEW_URLS[previewMove] : undefined;
  const previewUrl = new URL(completedUrl ?? INCOMPLETE_MOTION_NOTICE_URL);
  if (!completedUrl) previewUrl.searchParams.set("move", id === "graveFurrow" ? "special_up_heavy" : previewMove ?? `${id}_family`);
  activeNewMotionPreview = id;
  activeNewMotionPreviewMove = previewMove;
  newMotionPreviewTitle.textContent = previewMove ? MOTION_PREVIEW_TITLES[previewMove] : preview.title;
  newMotionPreviewFrame.src = previewUrl.href;
  newMotionPreviewModal.hidden = false;
  document.body.classList.add("motion-preview-open");
}
function closeNewMotionPreview() {
  activeNewMotionPreview = null;
  activeNewMotionPreviewMove = null;
  newMotionPreviewModal.hidden = true;
  newMotionPreviewFrame.removeAttribute("src");
  document.body.classList.remove("motion-preview-open");
}
function queueGroundedVerdictDemo() {
  queueSpecialReviewScenario("p1_grounded_verdict_hit");
}
function queueSpecialReviewScenario(id: SpecialReviewScenarioId) {
  const setup = createSpecialReviewScenario(id, runtime.state.seed);
  activeThrowReviewScenario = null;
  activeSpecialReviewScenario = id;
  activeSpecialCadenceReview = null;
  activeThrowCadenceReview = null;
  specialReviewStarted = false;
  runtime.mode = "live";
  runtime.setPaused(false);
  runtime.restore(setup.state);
  const defenderId = setup.definition.attacker === "p1" ? "p2" : "p1";
  specialReviewDefenderStartHealth = setup.state.fighters[defenderId].health;
  queuedP1Input = setup.input.p1 ?? {};
  queuedP2Input = setup.input.p2 ?? {};
  setModeLabel();
}
function queueInputMap(inputMap: { p1?: InputFrame; p2?: InputFrame }) {
  queuedP1Input = inputMap.p1 ?? {};
  queuedP2Input = inputMap.p2 ?? {};
}
function queueSpecialCadenceReviewScenario(id: SpecialCadenceScenarioId) {
  const setup = createSpecialCadenceReviewScenario(id, runtime.state.seed);
  activeThrowReviewScenario = null;
  activeSpecialReviewScenario = null;
  activeThrowCadenceReview = null;
  specialReviewStarted = false;
  activeSpecialCadenceReview = setup;
  runtime.mode = "live";
  runtime.setPaused(false);
  runtime.restore(setup.state);
  queueInputMap(setup.input);
  setModeLabel();
}
function queueThrowReviewScenario(id: ThrowReviewScenarioId) {
  const setup = createThrowReviewScenario(id, runtime.state.seed);
  activeSpecialReviewScenario = null;
  activeSpecialCadenceReview = null;
  activeThrowCadenceReview = null;
  specialReviewStarted = false;
  runtime.mode = "live";
  runtime.setPaused(false);
  runtime.restore(setup.state);
  queuedP1Input = setup.input.p1 ?? {};
  queuedP2Input = setup.input.p2 ?? {};
  activeThrowReviewScenario = id;
  setModeLabel();
}
function queueThrowCadenceReviewScenario(id: ThrowCadenceScenarioId) {
  const setup = createThrowCadenceReviewScenario(id, runtime.state.seed);
  activeSpecialReviewScenario = null;
  activeSpecialCadenceReview = null;
  specialReviewStarted = false;
  activeThrowReviewScenario = null;
  activeThrowCadenceReview = setup;
  runtime.mode = "live";
  runtime.setPaused(false);
  runtime.restore(setup.state);
  queueInputMap(setup.input);
  setModeLabel();
}
function queueDummyBurst() { queuedP2Input = { burst: true }; }
function queueDummyTech(direction: "forward" | "neutral" | "backward") {
  const facing = runtime.state.fighters.p2.facing;
  if (direction === "neutral") queuedP2Input = { block: true };
  else if ((direction === "forward" && facing === 1) || (direction === "backward" && facing === -1)) queuedP2Input = { right: true };
  else queuedP2Input = { left: true };
}
function liveInput() {
  lastDevice = input.read();
  const p1 = Object.keys(queuedP1Input).length ? queuedP1Input : lastDevice.frame;
  const p2 = queuedP2Input;
  queuedP1Input = {};
  queuedP2Input = {};
  return { p1, p2 };
}
function fixedStep(force = false) {
  const beforeTick = runtime.state.tick;
  runtime.step(liveInput(), force);
  if (runtime.state.tick === beforeTick) return;
  if (activeSpecialCadenceReview) {
    const nextInput = observeSpecialCadenceReview(activeSpecialCadenceReview, runtime.state);
    if (nextInput) queueInputMap(nextInput);
  }
  if (activeThrowCadenceReview) {
    const nextThrowInput = observeThrowCadenceReview(activeThrowCadenceReview, runtime.state);
    if (nextThrowInput) queueInputMap(nextThrowInput);
  }
}

function updateHud() {
  const s = runtime.state;
  const f = s.fighters.p1;
  const d = s.fighters.p2;
  const attack = f.currentAttack ? fighterDefinitions[f.kind].attacks[f.currentAttack] : null;
  const aerialCancelRoutes = f.cancelOptions.filter((attackId) => fighterDefinitions[f.kind].attacks[attackId].airOnly);
  comboReadout.textContent = f.comboCount > 0 ? `${f.comboCount} HIT · ${f.comboDamage} DMG · JUGGLE ${f.juggleSpent}/${fighterDefinitions[f.kind].combat.juggleLimit}` : "READY";
  const eventAge = d.recoveryEvent ? s.tick - d.recoveryEvent.tick : Number.POSITIVE_INFINITY;
  if (d.phase === "air_recovery") recoveryReadout.textContent = `TECH WINDOW · ${d.airRecoveryTicks}`;
  else if (d.phase === "knockdown") recoveryReadout.textContent = `${d.knockdownKind.toUpperCase()} KNOCKDOWN · ${d.knockdownTicks}`;
  else if (d.phase === "getup") recoveryReadout.textContent = `GETUP · ${d.getupTicks}`;
  else if (d.phase === "landing") recoveryReadout.textContent = `LANDING RECOVERY · ${Math.max(0, fighterDefinitions[d.kind].movement.landingRecovery - d.phaseTick)}`;
  else if (d.recoveryEvent?.type === "air_tech" && eventAge <= 45) recoveryReadout.textContent = `AIR TECH · ${d.recoveryEvent.direction?.toUpperCase()}${d.recoveryEvent.automatic ? " · AUTO" : ""}`;
  else recoveryReadout.textContent = "DEFENSE READY";
  const specialScenario = activeSpecialReviewScenario ? SPECIAL_REVIEW_SCENARIOS[activeSpecialReviewScenario] : null;
  const specialActor = specialScenario ? s.fighters[specialScenario.attacker] : null;
  const specialDefenderId = specialScenario?.attacker === "p2" ? "p1" : "p2";
  const specialDefender = specialScenario ? s.fighters[specialDefenderId] : null;
  const matchingSpecialEvent = specialScenario && s.lastCombatEvent?.attackId === specialScenario.expectedAttackId && s.lastCombatEvent.attacker === specialScenario.attacker
    ? s.lastCombatEvent
    : null;
  if (specialScenario && specialActor?.currentAttack === specialScenario.expectedAttackId) specialReviewStarted = true;
  const cadence = activeSpecialCadenceReview;
  if (cadence) {
    const tracker = cadence.tracker;
    if (tracker.stage === "complete") specialReadout.textContent = `${cadence.definition.label} · 2 RUNS · ${tracker.startToStartTicks}T START→START · ${tracker.neutralVisualGapTicks}T NEUTRAL`;
    else if (tracker.stage === "failed") specialReadout.textContent = `${cadence.definition.label} · FAILED · ${tracker.failure}`;
    else specialReadout.textContent = `${cadence.definition.label} · ${tracker.stage.replaceAll("_", " ").toUpperCase()} · ${tracker.startCount}/2 STARTS`;
  } else if (!specialScenario) specialReadout.textContent = "SPECIAL REVIEW READY";
  else if (!specialReviewStarted) specialReadout.textContent = `${specialScenario.label} · QUEUED`;
  else if (specialActor?.currentAttack === specialScenario.expectedAttackId) specialReadout.textContent = `${specialScenario.label} · ${currentAttackPhase(specialActor).toUpperCase()} · T${specialActor.phaseTick}`;
  else {
    const outcome = matchingSpecialEvent?.outcome ?? "whiff";
    const damage = specialReviewDefenderStartHealth - (specialDefender?.health ?? specialReviewDefenderStartHealth);
    specialReadout.textContent = `${specialScenario.label} · ${outcome.toUpperCase()} · ${damage} DMG · COMPLETE`;
  }
  const throwScenario = activeThrowReviewScenario ? THROW_REVIEW_SCENARIOS[activeThrowReviewScenario] : null;
  const throwCadence = activeThrowCadenceReview;
  if (throwCadence) {
    const tracker = throwCadence.tracker;
    if (tracker.stage === "complete") throwReadout.textContent = `${throwCadence.definition.label} · 2 RUNS · ${tracker.startToStartTicks}T START→START · ${tracker.neutralVisualGapTicks}T NEUTRAL`;
    else if (tracker.stage === "failed") throwReadout.textContent = `${throwCadence.definition.label} · FAILED · ${tracker.failure}`;
    else throwReadout.textContent = `${throwCadence.definition.label} · ${tracker.stage.replaceAll("_", " ").toUpperCase()} · ${tracker.startCount}/2 STARTS${s.throwInteraction ? ` · T${s.throwInteraction.tick}` : ""}`;
  } else if (s.throwInteraction) {
    const interaction = s.throwInteraction;
    throwReadout.textContent = `${throwScenario?.label ?? interaction.throwId} · ${interaction.result.toUpperCase()} · T${interaction.tick}`;
  } else if (s.lastThrowEvent) {
    throwReadout.textContent = `${throwScenario?.label ?? s.lastThrowEvent.throwId} · ${s.lastThrowEvent.type.toUpperCase()}${s.lastThrowEvent.damage ? ` · ${s.lastThrowEvent.damage} DMG` : ""}`;
  } else throwReadout.textContent = throwScenario ? `${throwScenario.label} · QUEUED` : "THROW REVIEW READY";
  hud.textContent = JSON.stringify({
    mode: runtime.mode,
    activeDevice: lastDevice.device,
    gamepad: lastDevice.connectedGamepad || "none",
    normalizedInput: lastDevice.frame,
    paused: runtime.paused,
    tick: s.tick,
    seed: s.seed,
    checksum: runtime.checksum,
    controls: { setup: "Hold D to approach and earn Tension", specialModifier: "U alone does nothing", neutralMedium: "U+K together with no direction", forwardLight: "hold toward + U+J together", forwardMedium: "hold toward + U+K together; two hits", forwardHeavy: "hold toward + U+L together", downLight: "S+U+J together", downMedium: "S+U+K together", downHeavy: "S+U+L together", upMedium: "W+U+K together", universalThrow: "I close; hold away + I for back throw", commandGrab: "U+I together at command-grab range", graveFurrow: "W+L together", airKnockdownRoutes: "J > K > L or J > K > J > K > L after launch", rcRoute: "J > K > H > S+L > W+D > J > K > L > U+L", romanCancel: "H after contact: spend 50 Tension to stop your move's recovery early", p1Burst: "P while P1 is in hitstun/blockstun", dummyBurst: "B during dummy hitstun", specialEnder: "U+L (airborne cancel from j.H)", block: "O", pause: "Escape", overlays: "F1", step: ". (paused only)", reset: "R" },
    reservedActions: reservedCombatActions,
    specialReview: { scenario: activeSpecialReviewScenario, definition: specialScenario, started: specialReviewStarted, actorAttack: specialActor?.currentAttack ?? null, lastEvent: matchingSpecialEvent, cadence: activeSpecialCadenceReview ? { definition: activeSpecialCadenceReview.definition, tracker: activeSpecialCadenceReview.tracker } : null },
    throwReview: { scenario: activeThrowReviewScenario, definition: throwScenario, interaction: s.throwInteraction, lastEvent: s.lastThrowEvent, cadence: activeThrowCadenceReview ? { definition: activeThrowCadenceReview.definition, tracker: activeThrowCadenceReview.tracker } : null },
    debugWarnings: s.debugWarnings,
    combatSpine: { juggle: `${f.juggleSpent}/${fighterDefinitions[f.kind].combat.juggleLimit}`, peakJuggle: f.peakJuggleSpent, scalingFloor: fighterDefinitions[f.kind].combat.minimumDamageScaling, airborneHitstunBonus: fighterDefinitions[f.kind].combat.airborneHitstunBonus, minimumAirHitstun: fighterDefinitions[f.kind].combat.minimumAirHitstun, hitstunDecay: `${fighterDefinitions[f.kind].combat.hitstunDecayPerHit}/hit from hit ${fighterDefinitions[f.kind].combat.hitstunDecayStartsAtHit}`, lastEvent: s.lastCombatEvent },
    combatSystems: { tension: `${f.tension}/${fighterDefinitions[f.kind].combat.maxTension}`, tensionEarned: f.tensionEarned, tensionSpent: f.tensionSpent, romanCancels: f.romanCancelCount, burst: `${f.burst}/${fighterDefinitions[f.kind].combat.maxBurst}`, bursts: f.burstCount, lastEvent: s.lastSystemEvent },
    aerial: { moveId: attack?.airOnly ? f.currentAttack : null, phase: attack?.airOnly ? currentAttackPhase(f) : "none", availableCancels: aerialCancelRoutes, remainingAirActions: f.airActionsRemaining, recoveryTicks: f.airRecoveryTicks, recoveryCount: f.airRecoveryCount, techInvuln: f.airTechInvuln, lastTechDirection: f.lastAirTechDirection, recoveryEvent: f.recoveryEvent },
    lamuh: { health: f.health, state: f.phase, attack: f.currentAttack, attackPhase: currentAttackPhase(f), cancelOptions: f.cancelOptions, combo: f.comboCount, comboDamage: f.comboDamage, comboRoute: f.comboRoute, scaling: f.damageScaling, timer: f.phaseTick, pos: [f.x, f.y], vel: [f.vx, f.vy], grounded: f.grounded, hitstop: f.hitstop, hitstun: f.hitstun, hitReaction: f.hitReactionWeight, presentationFrame: renderer.getFighterPresentationSnapshots().p1.frame, blockstun: f.blockstun, buffer: f.deterministicBuffer.history.slice(-5) },
    dummy: { health: d.health, mode: d.dummyMode, state: d.phase, timer: d.phaseTick, pos: [d.x, d.y], vel: [d.vx, d.vy], grounded: d.grounded, hitstop: d.hitstop, hitstun: d.hitstun, hitReaction: d.hitReactionWeight, presentationFrame: renderer.getFighterPresentationSnapshots().p2.frame, blockstun: d.blockstun, burst: d.burst, burstCount: d.burstCount, airRecoveryTicks: d.airRecoveryTicks, airRecoveryCount: d.airRecoveryCount, airTechInvuln: d.airTechInvuln, lastAirTechDirection: d.lastAirTechDirection, knockdownKind: d.knockdownKind, recoveryEvent: d.recoveryEvent },
    replayFinalChecksum: replay ? runtime.runReplayToEnd(replay).checksums.at(-1) : "loading",
    stage: renderer.getStageStatus(),
    camera: renderer.getCameraSnapshot()
  }, null, 2);
}

function loop(now: number) {
  const delta = Math.min((now - lastTime) / 1000, maxCatchUp);
  lastTime = now;
  accumulator += delta * reviewSpeed;
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
  if (!newMotionPreviewModal.hidden && event.code === debugKeyboardMapping.pause) { event.preventDefault(); closeNewMotionPreview(); return; }
  if (event.code === debugKeyboardMapping.pause) { event.preventDefault(); runtime.togglePause(); }
  if (event.code === debugKeyboardMapping.step && runtime.paused) runtime.frameAdvance(liveInput());
  if (event.code === debugKeyboardMapping.reset) runtime.reset();
  if (event.code === debugKeyboardMapping.dummyBurst) queueDummyBurst();
  if (event.code === debugKeyboardMapping.overlay) { event.preventDefault(); toggleOverlays(); }
  if (event.code === debugKeyboardMapping.mode && replay) { if (runtime.mode === "live") runtime.setReplay(replay); else runtime.setMode("live"); setModeLabel(); }
});
document.querySelector("#mode")!.addEventListener("click", () => { if (replay) { if (runtime.mode === "live") runtime.setReplay(replay); else runtime.setMode("live"); setModeLabel(); } });
document.querySelector("#review-speed")!.addEventListener("click", toggleReviewSpeed);
document.querySelector("#pause")!.addEventListener("click", () => runtime.togglePause());
document.querySelector("#step")!.addEventListener("click", () => { if (runtime.paused) runtime.frameAdvance(liveInput()); });
document.querySelector("#reset")!.addEventListener("click", () => { activeSpecialReviewScenario = null; activeSpecialCadenceReview = null; specialReviewStarted = false; activeThrowReviewScenario = null; activeThrowCadenceReview = null; runtime.reset(); });
document.querySelector("#demo-grounded-verdict")!.addEventListener("click", queueGroundedVerdictDemo);
document.querySelector("#overlays")!.addEventListener("click", toggleOverlays);
document.querySelector("#dummy")!.addEventListener("click", () => { const d = runtime.state.fighters.p2; const modes = ["idle", "stand_block", "crouch_block", "block_after_first_hit", "no_recovery", "auto_recovery"] as const; d.dummyMode = modes[(modes.indexOf(d.dummyMode as any) + 1) % modes.length]; (document.querySelector("#dummy") as HTMLButtonElement).textContent = `Dummy: ${d.dummyMode}`; });
document.querySelector("#dummy-tech-back")!.addEventListener("click", () => queueDummyTech("backward"));
document.querySelector("#dummy-tech-neutral")!.addEventListener("click", () => queueDummyTech("neutral"));
document.querySelector("#dummy-tech-forward")!.addEventListener("click", () => queueDummyTech("forward"));
document.querySelector("#dummy-burst")!.addEventListener("click", queueDummyBurst);
document.querySelector("#camera-throw")!.addEventListener("click", () => renderer.startCinematic("throw", "p1", runtime.state));
document.querySelector("#camera-ultimate")!.addEventListener("click", () => renderer.startCinematic("ultimate", "p1", runtime.state));
document.querySelector("#camera-abort")!.addEventListener("click", () => renderer.abortCinematic(runtime.state));
document.querySelector("#export-tuning")!.addEventListener("click", () => { const text = JSON.stringify({ lamuh: runtime.state.fighters.p1.kind, note: "Temporary runtime tuning lives in src/data/fighters.ts defaults." }, null, 2); (document.querySelector("#tuning") as HTMLTextAreaElement).value = text; navigator.clipboard?.writeText(text); });
document.querySelectorAll<HTMLButtonElement>("[data-special-scenario]").forEach((button) => button.addEventListener("click", () => queueSpecialReviewScenario(button.dataset.specialScenario as SpecialReviewScenarioId)));
document.querySelectorAll<HTMLButtonElement>("[data-special-cadence-scenario]").forEach((button) => button.addEventListener("click", () => queueSpecialCadenceReviewScenario(button.dataset.specialCadenceScenario as SpecialCadenceScenarioId)));
document.querySelectorAll<HTMLButtonElement>("[data-throw-scenario]").forEach((button) => button.addEventListener("click", () => queueThrowReviewScenario(button.dataset.throwScenario as ThrowReviewScenarioId)));
document.querySelectorAll<HTMLButtonElement>("[data-throw-cadence-scenario]").forEach((button) => button.addEventListener("click", () => queueThrowCadenceReviewScenario(button.dataset.throwCadenceScenario as ThrowCadenceScenarioId)));
document.querySelectorAll<HTMLAnchorElement>("[data-new-motion-preview]").forEach((link) => link.addEventListener("click", (event) => { event.preventDefault(); openNewMotionPreview(link.dataset.newMotionPreview as NewMotionPreviewId, link.dataset.motionPreviewMove); }));
document.querySelector("#close-new-motion-preview")!.addEventListener("click", closeNewMotionPreview);
newMotionPreviewModal.addEventListener("click", (event) => { if (event.target === newMotionPreviewModal) closeNewMotionPreview(); });
Object.assign((window as any).__NGA_ENGINE_V2_DEBUG__, {
  runSpecialReviewScenario: queueSpecialReviewScenario,
  specialReviewScenarios: SPECIAL_REVIEW_SCENARIOS,
  getSpecialReviewScenario: () => activeSpecialReviewScenario,
  getReviewSpeed: () => reviewSpeed,
  runSpecialCadenceReviewScenario: queueSpecialCadenceReviewScenario,
  specialCadenceScenarios: SPECIAL_CADENCE_SCENARIOS,
  getSpecialCadenceReview: () => activeSpecialCadenceReview ? { definition: activeSpecialCadenceReview.definition, tracker: activeSpecialCadenceReview.tracker } : null,
  runThrowReviewScenario: queueThrowReviewScenario,
  throwReviewScenarios: THROW_REVIEW_SCENARIOS,
  getThrowReviewScenario: () => activeThrowReviewScenario,
  runThrowCadenceReviewScenario: queueThrowCadenceReviewScenario,
  throwCadenceScenarios: THROW_CADENCE_SCENARIOS,
  getThrowCadenceReview: () => activeThrowCadenceReview ? { definition: activeThrowCadenceReview.definition, tracker: activeThrowCadenceReview.tracker } : null,
  getReviewDeepLinkResolution: () => reviewDeepLinkResolution,
  openNewMotionPreview,
  closeNewMotionPreview,
  newMotionPreviews: NEW_MOTION_PREVIEWS,
  getNewMotionPreviewState: () => ({ active: activeNewMotionPreview, move: activeNewMotionPreviewMove, open: !newMotionPreviewModal.hidden, src: newMotionPreviewFrame.getAttribute("src") })
});

loadReplay().then((loaded) => {
  replay = loaded;
  setModeLabel();
  if (reviewDeepLinkResolution.kind === "special") queueSpecialReviewScenario(reviewDeepLinkResolution.id as SpecialReviewScenarioId);
  else if (reviewDeepLinkResolution.kind === "throw") queueThrowReviewScenario(reviewDeepLinkResolution.id as ThrowReviewScenarioId);
  else if (requestedSpecialCadenceScenario) queueSpecialCadenceReviewScenario(requestedSpecialCadenceScenario);
  else if (requestedThrowCadenceScenario) queueThrowCadenceReviewScenario(requestedThrowCadenceScenario);
  if (requestedNewMotionPreviewId) openNewMotionPreview(requestedNewMotionPreviewId, requestedNewMotionPreviewMove);
  requestAnimationFrame(loop);
});
