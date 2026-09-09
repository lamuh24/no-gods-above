import "./style.css";
import {
  ACTUAL_TRIBUNAL_ARENA_ID,
  ACTUAL_TRIBUNAL_PRESENTATION_ID,
  ActualTribunalGrayboxRenderer
} from "../graybox/actualTribunalGrayboxRenderer";
import { TribunalEffectStudyMode, TribunalGrayboxRenderer } from "../graybox/tribunalGrayboxRenderer";
import { MISSING_ANIMATION_STATES, SANDBOX_TUNING } from "./sandboxConfig";
import { FORWARD_WALK_V2_REVIEW_STATUS, FORWARD_WALK_V2_TIMING_PROFILES } from "./forwardWalkV2Review";
import { COMMAND_GRAB_MOTION_V1_FRAMES, COMMAND_GRAB_MOTION_V1_REVIEW } from "./commandGrabMotionV1";
import { DASH_REPAIR_V2_FRAMES, DASH_REPAIR_V2_REVIEW } from "./dashRepairV2";
import { JUMP_FALL_LANDING_V1_FRAMES, JUMP_FALL_LANDING_V1_REVIEW } from "./jumpFallLandingV1";
import { TURN_SIDE_SWITCH_V1_REVIEW } from "./turnSideSwitchV1";
import { AIR_MOBILITY_V1_REVIEW } from "./airMobilityV1";
import { AIR_DASH_MOTION_V1_FRAMES, AIR_DASH_MOTION_V1_REVIEW, AIR_DASH_SIDE_SWITCH_V2_FRAME, AIR_DASH_SIDE_SWITCH_V2_REVIEW } from "./airDashMotionV1";
import {
  AIR_NORMALS_PLAYTEST_V1,
  AIR_NORMALS_PLAYTEST_V1_GAMEPLAY_VALUES,
  AIR_NORMALS_PLAYTEST_V1_GATE,
  AIR_NORMALS_PLAYTEST_V1_MAX_ACTIONS,
  airNormalForState,
  airNormalPhase
} from "./airNormalsPlaytestV1";
import { COMMAND_GRAB_VICTIM_FALL_V1_REVIEW } from "./commandGrabVictimFallV1";
import {
  CROUCHING_LIGHT_V4_DEFAULT_TIMING,
  CROUCHING_LIGHT_V4_TIMING_PROFILES,
  CROUCHING_LIGHT_V4_TIMING_REVIEW_STATUS,
  CROUCHING_MEDIUM_OPPOSED_SPLIT_SHOT_V6_DEFAULT_TIMING,
  CROUCHING_MEDIUM_OPPOSED_SPLIT_SHOT_V6_REVIEW_STATUS,
  CROUCHING_MEDIUM_OPPOSED_SPLIT_SHOT_V6_TIMING_PROFILES,
  CROUCHING_HEAVY_MOTION_V1_DEFAULT_TIMING,
  CROUCHING_HEAVY_MOTION_V1_REVIEW_STATUS,
  CROUCHING_HEAVY_MOTION_V1_TIMING_PROFILES,
  STANDING_NORMALS_MOTION_V1_TIMING_PROFILES
} from "./groundNormalsPlaytestV1";
import {
  CROUCHING_LIGHT_PRESENTATION_V1,
  CROUCHING_LIGHT_PRESENTATION_V1_ASSETS,
  CrouchingLightVfxAsset,
  crouchingLightPresentationSample
} from "./crouchingLightPresentationV1";
import {
  CROUCHING_MEDIUM_OPPOSED_SPLIT_SHOT_V6_PRESENTATION,
  crouchingMediumOpposedSplitShotSample
} from "./crouchingMediumOpposedSplitShotV6";
import { AIR_LIGHT_CONTACT_PRESENTATION_V1, airLightContactPresentationSample } from "./airLightContactPresentationV1";
import { GRAVE_FURROW_PLAYTEST_V1, GRAVE_FURROW_V1_EXPOSURES, GRAVE_FURROW_V1_TOTAL_TICKS } from "./graveFurrowPlaytestV1";
import {
  COMMAND_GRAB_FINISHER_REVIEW_V1,
  commandGrabFinisherVfxPresentation
} from "./commandGrabFinisherReviewV1";
import { swahiliSandboxSpriteSources } from "./swahiliSandboxSpriteSources";
import {
  createSwahiliSandbox,
  currentDefenseExposure,
  currentDefenseGrounding,
  currentDefensePackage,
  currentHeavyPhase,
  fighterActiveHitboxes,
  fighterHurtboxes,
  fighterPushbox,
  forceDefenseReaction,
  sandboxChecksum,
  SandboxScenarioId,
  selectSandboxAnimation,
  setForwardWalkV2TimingProfile,
  setCrouchingLightV4TimingProfile,
  setCrouchingMediumOpposedSplitShotV6TimingProfile,
  setCrouchingHeavyMotionV1TimingProfile,
  setStandingNormalsMotionV1TimingProfile,
  setJumpLandingReviewMode,
  setupSandboxScenario,
  tickSwahiliSandbox
} from "./swahiliSandboxSimulation";
import { CrouchingHeavyTimingProfileId, CrouchingLightTimingProfileId, CrouchingMediumTimingProfileId, ForwardWalkV2TimingProfileId, JumpLandingReviewMode, SandboxCommand, SandboxFighterId, SandboxInputFrame, SandboxRect, StandingNormalTimingProfileId } from "./types";

const tribunalLivePlaytestRoute = location.pathname.endsWith("/tribunal-playtest.html");
const routeIdentity = tribunalLivePlaytestRoute
  ? "swahili_sandbox_x_the_last_tribunal_graybox"
  : "swahili_engine_v2_development_sandbox";
const routeTitle = tribunalLivePlaytestRoute
  ? "Swahili Sandbox × The Last Tribunal Actual Graybox"
  : "Swahili Engine V2 Development Sandbox";
document.title = routeTitle;

const scenarioLabels: Record<SandboxScenarioId, string> = {
  idle_center: "1. Idle at center",
  forward_walk: "2. Forward walk",
  backward_walk: "3. Backward walk (incomplete)",
  walk_reversal: "4. Walk reversal",
  crouch: "5. Crouch",
  standing_block: "6. Standing block",
  crouching_block: "7. Crouching block",
  standing_heavy_whiff: "8. Standing Heavy whiff",
  standing_heavy_hit: "9. Standing Heavy hit",
  standing_heavy_block: "10. Standing Heavy block",
  light_hit_reaction: "11. Light hit reaction",
  heavy_hit_reaction: "12. Heavy hit reaction",
  left_corner: "13. Left corner",
  right_corner: "14. Right corner",
  side_switch: "15. P1/P2 side switch",
  mirrored_facing: "16. Mirrored facing",
  jump_camera_placeholder: "17. Jump V1 soft landing review"
  ,standing_block_entry: "18. Standing block entry"
  ,standing_block_hold: "19. Held standing block"
  ,standing_block_release: "20. Standing block release"
  ,crouching_block_entry: "21. Crouching block entry"
  ,crouching_block_hold: "22. Held crouching block"
  ,crouching_block_release: "23. Crouching block release"
  ,light_hit_from_idle: "24. Light hit from idle"
  ,light_hit_from_walk: "25. Light hit from walk"
  ,light_hit_from_crouch: "26. Light hit from crouch"
  ,light_hit_from_block: "27. Light hit from block"
  ,heavy_hit_from_idle: "28. Heavy hit from idle"
  ,heavy_hit_from_walk: "29. Heavy hit from walk"
  ,heavy_hit_from_crouch: "30. Heavy hit from crouch"
  ,heavy_hit_from_block: "31. Heavy hit from block"
  ,defense_hitstop_freeze: "32. Defense hitstop freeze"
  ,defense_rapid_hits: "33. Repeated rapid hits"
  ,defense_return_state: "34. Return to valid control"
  ,heavy_first_active_hit: "35. Heavy first-active hit (tick 24)"
  ,heavy_last_active_hit: "36. Heavy last-active hit (tick 28)"
  ,heavy_counter_hit: "37. Heavy counter hit"
  ,heavy_standing_block_v1: "38. Heavy standing block"
  ,heavy_crouching_block_v1: "39. Heavy crouching block"
  ,heavy_whiff_complete: "40. Heavy complete whiff"
  ,heavy_corner_hit: "41. Heavy corner hit"
  ,heavy_max_range_standing: "42. Heavy max standing range"
  ,heavy_max_range_crouching: "43. Heavy max crouching range"
  ,heavy_just_outside_range: "44. Heavy just outside range"
  ,heavy_mirrored_p2: "45. Heavy mirrored P2-facing"
  ,heavy_side_switch: "46. Heavy after side switch"
  ,heavy_repeated_use: "47. Heavy repeated use"
  ,heavy_punish_after_block: "48. Heavy block-punish window"
  ,heavy_punish_after_whiff: "49. Heavy whiff-punish window"
  ,heavy_normal_hit_pressure: "50. Heavy normal-hit pressure"
  ,heavy_counter_hit_pressure: "51. Heavy counter-hit pressure"
  ,heavy_rollback_replay: "52. Heavy rollback checkpoint"
  ,walk_v2_idle_to_forward: "53. Walk V2 idle to forward"
  ,walk_v2_continuous: "54. Walk V2 continuous"
  ,walk_v2_forward_to_idle: "55. Walk V2 forward to idle"
  ,walk_v2_repeated_start_stop: "56. Walk V2 repeated start/stop"
  ,walk_v2_forward_to_backward: "57. Walk V2 to incomplete backward"
  ,walk_v2_corner_approach: "58. Walk V2 corner approach"
  ,walk_v2_side_switch: "59. Walk V2 side switch"
  ,walk_v2_mirrored_p2: "60. Walk V2 mirrored P2-facing"
  ,walk_v2_to_standing_heavy: "61. Walk V2 to Standing Heavy"
  ,walk_v2_to_universal_grab: "62. Walk V2 to universal grab"
  ,walk_v2_to_command_grab: "63. Walk V2 to command grab"
  ,walk_v2_to_block: "64. Walk V2 to block"
  ,walk_v2_to_crouch: "65. Walk V2 to crouch"
  ,command_grab_hit: "66. Command grab hit (.8x review)"
  ,command_grab_whiff: "67. Command grab whiff"
  ,command_grab_mirrored: "68. Command grab mirrored P2"
  ,dash_forward_review: "69. Dash forward key-pose review"
  ,dash_backward_review: "70. Dash backward key-pose review"
  ,dash_forward_mirrored: "71. Dash forward mirrored P2-facing"
  ,dash_backward_mirrored: "72. Dash backward mirrored P2-facing"
  ,dash_corner_stop: "73. Dash forward corner stop"
  ,dash_repeated_use: "74. Dash repeated-use review"
  ,jump_soft_review: "75. Jump V1 soft landing"
  ,jump_attack_landing_review: "76. Jump V1 attack landing recovery"
  ,jump_hard_landing_review: "77. Jump V1 hard landing compatibility"
  ,jump_mirrored_review: "78. Jump V1 mirrored P2-facing"
  ,turn_side_switch_review: "79. Turn / side-switch authored P1"
  ,turn_side_switch_mirrored: "80. Turn / side-switch mirrored P2-facing"
  ,air_mobility_double_jump_review: "81. Double jump review"
  ,air_mobility_forward_dash_cross: "82. Forward air dash over opponent"
  ,air_mobility_backward_dash_review: "83. Backward air dash review"
  ,air_mobility_mirrored_cross: "84. Mirrored air dash over opponent"
};

const root = document.querySelector<HTMLDivElement>("#app")!;
root.innerHTML = `
  <main class="shell">
    <section id="viewport" class="viewport">
      ${tribunalLivePlaytestRoute ? `<div id="arena-identity" class="arena-identity">ARENA: ${ACTUAL_TRIBUNAL_ARENA_ID}<br>PRESENTATION: ${ACTUAL_TRIBUNAL_PRESENTATION_ID}</div><div id="stage-load-error" class="stage-load-error" hidden></div>` : ""}
      <canvas id="combat-overlay"></canvas>
      <div id="fallback-p1" class="fallback-label"></div>
      <div id="fallback-p2" class="fallback-label"></div>
    </section>
    <aside class="panel">
      <h1>${routeTitle}</h1>
      <p class="badge">${tribunalLivePlaytestRoute
        ? "production_arena_live_playtest_candidate · deployable: false<br>awaiting_actual_tribunal_graybox_integration"
        : "APPROVED_RECOMMENDED_PROFILE · authoritative V1 sandbox baseline<br>candidate-only · deployable: false · not in production roster"}</p>
      <p class="authority">Authoritative deterministic 60 Hz sandbox simulation → Last Tribunal presentation. Rendering cannot move fighters, resolve collision, choose attack timing, or change state.</p>
      <div class="health-row"><b>P1</b><div class="health-track"><div id="p1-health" class="health-fill"></div></div><span id="p1-health-value"></span></div>
      <div class="health-row"><b>P2</b><div class="health-track"><div id="p2-health" class="health-fill"></div></div><span id="p2-health-value"></span></div>
      <h2>Playtest controls</h2>
      <div class="buttons">
        <button id="pause">Pause</button><button id="step">Frame advance</button>
        <button id="slow">Slow motion: off</button><button id="reset">Reset round</button>
        <button id="switch">Instant switch sides</button><button id="turn-side-switch">Play turn / side switch (T)</button>
        <button id="dummy">Dummy block: off</button>
        <button id="diagnostics">Diagnostics: on</button><button id="light-reaction">Force light reaction</button>
        <button id="heavy-reaction">Force heavy reaction</button><button id="counter-hit">Counter hit: off</button>
        <button id="standing-light">Standing Light Motion V1 (U)</button><button id="standing-medium">Standing Medium Motion V1 (I)</button>
        <button id="crouching-light">Crouching Light V4 + Variant D (S + U)</button><button id="crouching-medium">Crouching Medium Opposed Split Shot V6 (S + I)</button>
        <button id="crouching-heavy">Crouching Heavy V2 (S + L)</button>
        <button id="air-light">Air Light gameplay review (W then U)</button>
        <button id="air-medium">Air Medium candidate (W then I)</button>
        <button id="air-heavy">Air Heavy candidate (W then L)</button>
        <button id="grave-furrow">Grave Furrow V1 playtest (Y)</button>
        <button id="command-grab">Play command grab (K)</button>
        <button id="command-grab-vfx">Command grab VFX: on</button>
        <button id="dash-forward">Dash forward (Shift + toward)</button>
        <button id="dash-backward">Dash backward (Shift + away)</button>
        <button id="jump-soft">Jump: soft landing (W)</button>
        <button id="jump-attack">Jump: attack landing</button>
        <button id="jump-hard">Jump: hard landing</button>
        <button id="double-jump">Double jump (W again)</button>
        <button id="air-dash-forward">Air dash forward (Shift + toward)</button>
        <button id="air-dash-backward">Air dash backward (Shift + away)</button>
        <button id="vfx-study">VFX contrast: off</button>
        <button id="focus">Focus playfield</button>
      </div>
      <div class="help">A/D or ←/→ move · S/↓ crouch · U Light · I Medium · L or H Heavy · Y Grave Furrow · press U/I/L while airborne for jump attacks · hold S for crouching attacks · O block · C arm counter hit · W jump · R reset · F side switch · B dummy block · F1 diagnostics · Q slow motion</div>
      <div class="help">Live review: Shift + toward = forward dash; Shift + away = backward dash. J = universal-grab entry; K = full command grab.</div>
      <div class="warning">Standing Normals Motion V1 is approved as part of the current sandbox moveset baseline. Light uses the six-pose 12-tick path; the live rising-knee Medium uses the five-pose 20-tick path. Hitstop remains disabled so hit and whiff playback keep identical authored timing at every range.</div>
      <div class="warning">Crouching Light Motion V1 is locked at the approved 17-tick timing. Variant D flash + smoke + shell appears on whiff; confirmed hits add only the compact impact spark, one hitstop tick, at most two pixels of camera shake, and a two-to-four-pixel draw-only recoil jolt. Fighter and VFX source pixels are unchanged.</div>
      <div class="warning">Crouching Medium now uses the approved opposed split-shot direction: both pistols fire simultaneously, one screen-left and one screen-right. The preferred V2 VFX remain detached, the 60-tick motion registers at most one 65-damage hit per opponent, and no projectile entity is created. Crouching Heavy Motion V1 is unchanged.</div>
      <div class="warning">Command Grab Motion V1 keeps all 24 frozen approved attacker frames at the selected .8x review speed. P2 stays on approved enemy-character reaction and knockdown art with zero spin, then flips horizontal body facing across the final two airborne fall poses so the landing is already opponent-facing; mannequin/test-victim art is runtime-excluded.</div>
      <div class="warning">Dash Repair V2.1 timing polish uses the same six forward poses and six-pose Backdash V3 recoil sequence at a slightly faster cadence. No sprite pixels or travel distances changed; both clips await human motion review.</div>
      <div class="warning">Jump/Fall/Landing V1 uses the exact eight candidate key poses. Existing sandbox velocity, gravity, air steering, ceiling, and landing detection remain simulation-owned and unchanged. No connectors or production integration are included.</div>
      <div class="warning">Air Light, Medium, and Heavy are approved as the current sandbox moveset baseline. Each registers one hit, preserves airborne physics, and lands through attack recovery. W then U/I/L buffers during jump anticipation. Air Light keeps its three-tick attacker contact hold so the kick's 20-tick visible cadence remains identical on close hit and far whiff.</div>
      <div class="warning">Grave Furrow V1 is a candidate-only sandbox special on Y. Its nine reviewed poses play for 64 ticks, the sixth pose owns the only hit, and a confirmed hit sends the dummy mostly backward with modest lift into the approved knockdown/recovery art. Damage, hitbox, launch, blockstun, and hitstop are temporary playtest values; no roster or production combat mapping is changed.</div>
      <div class="warning">Turn / Side-Switch V1 uses one authored planted pivot and runtime mirroring only. P1 root remains fixed while a sandbox-only dummy crossing drives one simulation-owned facing change.</div>
      <div class="warning">Air Mobility V1 adds one double jump and one air dash per airtime for sandbox review. Side-Switch Air Dash V2 now rotates through opponent crossing and hands off into the existing backdash carry/brake. W again double-jumps; Shift + toward/away air-dashes. Values are temporary and do not alter production gameplay.</div>
      <h2>Standing Normals Motion V1 timing</h2>
      <div class="scenario-row"><select id="standing-normal-timing">${Object.values(STANDING_NORMALS_MOTION_V1_TIMING_PROFILES).map((profile) => `<option value="${profile.id}">${profile.label}</option>`).join("")}</select><button id="apply-standing-normal-timing">Apply</button></div>
      <div class="warning">Timing selection changes only the candidate Light/Medium exposure map. Damage, hitboxes, collision, and every other move remain unchanged.</div>
      <h2>Crouching Light Motion V1 timing</h2>
      <div class="scenario-row"><select id="crouching-light-timing">${Object.values(CROUCHING_LIGHT_V4_TIMING_PROFILES).map((profile) => `<option value="${profile.id}">${profile.label}</option>`).join("")}</select><button id="apply-crouching-light-timing">Apply</button></div>
      <div class="warning">The approved five-frame pistol shot is fixed at 17 simulation ticks: 5 startup, 1 active, 11 recovery. Gameplay timing and artwork exposure share the same cursor.</div>
      <h2>Crouching Medium Opposed Split Shot V6 timing</h2>
      <div class="scenario-row"><select id="crouching-medium-timing">${Object.values(CROUCHING_MEDIUM_OPPOSED_SPLIT_SHOT_V6_TIMING_PROFILES).map((profile) => `<option value="${profile.id}">${profile.label}</option>`).join("")}</select><button id="apply-crouching-medium-timing">Apply</button></div>
      <h2>Crouching Heavy Motion V1 timing</h2>
      <div class="scenario-row"><select id="crouching-heavy-timing">${Object.values(CROUCHING_HEAVY_MOTION_V1_TIMING_PROFILES).map((profile) => `<option value="${profile.id}">${profile.label}</option>`).join("")}</select><button id="apply-crouching-heavy-timing">Apply</button></div>
      <div class="warning">These timing switches change only candidate artwork exposure. Knockdown behavior, damage, hitstun, cancel rules, combat geometry, and movement remain unchanged and non-authoritative.</div>
      <h2>Forward Walk V2 timing</h2>
      <div class="scenario-row"><select id="walk-timing">${Object.values(FORWARD_WALK_V2_TIMING_PROFILES).map((profile) => `<option value="${profile.id}">${profile.label}</option>`).join("")}</select><button id="apply-walk-timing">Apply</button></div>
      <div class="warning">Movement distance remains simulation-authored. Timing changes gait exposure and deterministic displacement spacing only; artwork never controls collision.</div>
      <h2>Scenario presets</h2>
      <div class="scenario-row"><select id="scenario">${Object.entries(scenarioLabels).map(([id, label]) => `<option value="${id}">${label}</option>`).join("")}</select><button id="load-scenario">Load</button></div>
      <h2>Known incomplete coverage</h2>
      <div class="warning">Current sandbox attacks and Command Grab are human-approved. Grave Furrow is present only as a candidate playtest. Backward walk still has three labeled manual-paintover fallbacks and is outside this moveset approval. Remaining specials, directional normals, unsupported victim variants, production balance, final packaging, roster promotion, and deployment are also outside the approval.</div>
      <h2>Live diagnostics</h2>
      <pre id="locomotion-hud" class="locomotion-hud"></pre>
      <pre id="hud"></pre>
    </aside>
  </main>`;

if (!tribunalLivePlaytestRoute) document.querySelector<HTMLParagraphElement>(".badge")!.innerHTML = "SWAHILI CURRENT SANDBOX MOVESET BASELINE<br>Command Grab targeted correction: no spin; victim flips body facing during the final two airborne fall poses and awaits playtest confirmation. Sandbox only - deployable: false - not in production roster";

const viewport = document.querySelector<HTMLDivElement>("#viewport")!;
const overlay = document.querySelector<HTMLCanvasElement>("#combat-overlay")!;
const hud = document.querySelector<HTMLPreElement>("#hud")!;
const locomotionHud = document.querySelector<HTMLPreElement>("#locomotion-hud")!;
const rendererOptions = {
  spriteSources: swahiliSandboxSpriteSources,
  initialFrameId: "idle_00",
  textureMaxResolution: 768
};
let renderer: TribunalGrayboxRenderer;
try {
  renderer = tribunalLivePlaytestRoute
    ? new ActualTribunalGrayboxRenderer(viewport, rendererOptions)
    : new TribunalGrayboxRenderer(viewport, rendererOptions);
  if (tribunalLivePlaytestRoute) {
    const identity = renderer.presentationIdentity();
    if (identity.arenaId !== ACTUAL_TRIBUNAL_ARENA_ID || identity.presentationId !== ACTUAL_TRIBUNAL_PRESENTATION_ID || identity.genericFallbackRendered) {
      throw new Error("ACTUAL TRIBUNAL GRAYBOX LOAD ERROR: generic sandbox presentation is not allowed on this route");
    }
  }
} catch (error) {
  const message = error instanceof Error ? error.message : String(error);
  const element = document.querySelector<HTMLDivElement>("#stage-load-error");
  if (element) { element.hidden = false; element.textContent = message; }
  throw error;
}

type CrouchingLightVfxGroup = keyof typeof CROUCHING_LIGHT_PRESENTATION_V1_ASSETS;
const crouchingLightVfxImages = new Map<string, HTMLImageElement>();
const crouchingLightVfxKey = (group: CrouchingLightVfxGroup, index: number) => `${group}:${index}`;
const crouchingLightVfxReady = Promise.all(
  (["muzzleFlash", "smokePuff", "shellEjection", "impactSpark"] as const).flatMap((group) =>
    CROUCHING_LIGHT_PRESENTATION_V1_ASSETS[group].map((asset, index) => new Promise<void>((resolve, reject) => {
      const image = new Image();
      image.decoding = "async";
      image.onload = () => { crouchingLightVfxImages.set(crouchingLightVfxKey(group, index), image); resolve(); };
      image.onerror = () => reject(new Error(`Crouching Light V4 VFX failed to load: ${group}:${index}`));
      image.src = asset.url;
    }))
  )
).then(() => undefined);
const sandboxReady = Promise.all([renderer.ready, crouchingLightVfxReady]).then(() => undefined);
let state = createSwahiliSandbox();
const requestedTiming = new URLSearchParams(location.search).get("walkTiming") as ForwardWalkV2TimingProfileId | null;
if (requestedTiming && Object.prototype.hasOwnProperty.call(FORWARD_WALK_V2_TIMING_PROFILES, requestedTiming)) setForwardWalkV2TimingProfile(state, requestedTiming);
const requestedStandingNormalTiming = new URLSearchParams(location.search).get("standingNormalTiming") as StandingNormalTimingProfileId | null;
if (requestedStandingNormalTiming && Object.prototype.hasOwnProperty.call(STANDING_NORMALS_MOTION_V1_TIMING_PROFILES, requestedStandingNormalTiming)) setStandingNormalsMotionV1TimingProfile(state, requestedStandingNormalTiming);
const requestedCrouchingLightTiming = new URLSearchParams(location.search).get("crouchingLightTiming") as CrouchingLightTimingProfileId | null;
if (requestedCrouchingLightTiming && Object.prototype.hasOwnProperty.call(CROUCHING_LIGHT_V4_TIMING_PROFILES, requestedCrouchingLightTiming)) setCrouchingLightV4TimingProfile(state, requestedCrouchingLightTiming);
const requestedCrouchingMediumTiming = new URLSearchParams(location.search).get("crouchingMediumTiming") as CrouchingMediumTimingProfileId | null;
if (requestedCrouchingMediumTiming && Object.prototype.hasOwnProperty.call(CROUCHING_MEDIUM_OPPOSED_SPLIT_SHOT_V6_TIMING_PROFILES, requestedCrouchingMediumTiming)) setCrouchingMediumOpposedSplitShotV6TimingProfile(state, requestedCrouchingMediumTiming);
const requestedCrouchingHeavyTiming = new URLSearchParams(location.search).get("crouchingHeavyTiming") as CrouchingHeavyTimingProfileId | null;
if (requestedCrouchingHeavyTiming && Object.prototype.hasOwnProperty.call(CROUCHING_HEAVY_MOTION_V1_TIMING_PROFILES, requestedCrouchingHeavyTiming)) setCrouchingHeavyMotionV1TimingProfile(state, requestedCrouchingHeavyTiming);
document.querySelector<HTMLSelectElement>("#standing-normal-timing")!.value = state.fighters.p1.standingNormalTimingProfile;
document.querySelector<HTMLSelectElement>("#crouching-light-timing")!.value = state.fighters.p1.crouchingLightTimingProfile;
document.querySelector<HTMLSelectElement>("#crouching-medium-timing")!.value = state.fighters.p1.crouchingMediumTimingProfile;
document.querySelector<HTMLSelectElement>("#crouching-heavy-timing")!.value = state.fighters.p1.crouchingHeavyTimingProfile;
let diagnostics = true;
let paused = false;
let slowMotion = false;
let vfxStudyMode: TribunalEffectStudyMode = "off";
let commandGrabFinisherVfxEnabled = new URLSearchParams(location.search).get("commandGrabVfx") !== "off";
let pendingCommand: SandboxCommand | undefined;
let accumulator = 0;
let lastTime = performance.now();
const keys = new Set<string>();
const captureMode = new URLSearchParams(location.search).has("capture");

function inputFrame(): SandboxInputFrame {
  const frame: SandboxInputFrame = {
    left: keys.has("KeyA") || keys.has("ArrowLeft"),
    right: keys.has("KeyD") || keys.has("ArrowRight"),
    down: keys.has("KeyS") || keys.has("ArrowDown"),
    up: keys.has("KeyW") || keys.has("ArrowUp"),
    block: keys.has("KeyO"),
    light: keys.has("KeyU"),
    medium: keys.has("KeyI"),
    heavy: keys.has("KeyL") || keys.has("KeyH"),
    grab: keys.has("KeyJ"),
    commandGrab: keys.has("KeyK"),
    graveFurrow: keys.has("KeyY"),
    dash: keys.has("ShiftLeft") || keys.has("ShiftRight"),
    command: pendingCommand
  };
  pendingCommand = undefined;
  return frame;
}

function fixedStep(input = inputFrame()) {
  const commandGrabWasActive = state.commandGrab.active;
  tickSwahiliSandbox(state, input);
  if (!commandGrabWasActive && state.commandGrab.active) {
    renderer.startCinematic("command_grab", "p1", state, COMMAND_GRAB_MOTION_V1_REVIEW.simulationTotalTicks);
  }
}

function worldRectToScreen(rect: SandboxRect) {
  const topLeft = renderer.projectSimulationPoint(rect.x, rect.y);
  const bottomRight = renderer.projectSimulationPoint(rect.x + rect.w, rect.y + rect.h);
  return { x: Math.min(topLeft.x, bottomRight.x), y: Math.min(topLeft.y, bottomRight.y), w: Math.abs(bottomRight.x - topLeft.x), h: Math.abs(bottomRight.y - topLeft.y) };
}

function drawBox(context: CanvasRenderingContext2D, rect: SandboxRect, color: string, label: string) {
  const screen = worldRectToScreen(rect);
  context.strokeStyle = color; context.lineWidth = 2; context.strokeRect(screen.x, screen.y, screen.w, screen.h);
  context.fillStyle = color; context.font = "10px ui-monospace, Consolas"; context.fillText(label, screen.x + 3, Math.max(11, screen.y - 3));
}

function crouchingLightSourceSocketToSimulation(
  fighter: typeof state.fighters.p1,
  socket: readonly [number, number],
  followDrawJolt = false
): readonly [number, number] {
  const [rootX, rootY] = CROUCHING_LIGHT_PRESENTATION_V1.sourceRoot;
  const sourceScale = CROUCHING_LIGHT_PRESENTATION_V1.sourcePixelsToSimulationUnits;
  return [
    fighter.x + (followDrawJolt ? fighter.presentationRootOffsetX : 0) + fighter.facing * (socket[0] - rootX) * sourceScale,
    fighter.y + (socket[1] - rootY) * sourceScale
  ];
}

function drawCrouchingLightVfxAsset(
  context: CanvasRenderingContext2D,
  group: CrouchingLightVfxGroup,
  index: number,
  asset: CrouchingLightVfxAsset,
  simulationPoint: readonly [number, number],
  facing: 1 | -1
) {
  const image = crouchingLightVfxImages.get(crouchingLightVfxKey(group, index));
  if (!image) return;
  const point = renderer.projectSimulationPoint(simulationPoint[0], simulationPoint[1]);
  const oneSourcePixelRight = renderer.projectSimulationPoint(
    simulationPoint[0] + CROUCHING_LIGHT_PRESENTATION_V1.sourcePixelsToSimulationUnits,
    simulationPoint[1]
  );
  const scale = Math.max(0.01, Math.abs(oneSourcePixelRight.x - point.x)) * (asset.sourceScale ?? 1);
  context.save();
  context.translate(point.x, point.y);
  context.scale(facing, 1);
  context.drawImage(
    image,
    -asset.anchor[0] * scale,
    -asset.anchor[1] * scale,
    image.naturalWidth * scale,
    image.naturalHeight * scale
  );
  context.restore();
}

function drawCrouchingLightVfx(context: CanvasRenderingContext2D, sample: ReturnType<typeof crouchingLightPresentationSample>) {
  if (!sample.active || sample.shotAge === null) return;
  const attacker = state.fighters.p1;
  const defender = state.fighters.p2;
  const muzzle = crouchingLightSourceSocketToSimulation(attacker, CROUCHING_LIGHT_PRESENTATION_V1.muzzleSocket, true);
  if (sample.showSmoke) {
    drawCrouchingLightVfxAsset(context, "smokePuff", sample.smokeFrame, CROUCHING_LIGHT_PRESENTATION_V1_ASSETS.smokePuff[sample.smokeFrame], muzzle, attacker.facing);
  }
  if (sample.showShell) {
    const age = sample.shotAge;
    const socket = [
      CROUCHING_LIGHT_PRESENTATION_V1.ejectionSocket[0] + 34 * age,
      CROUCHING_LIGHT_PRESENTATION_V1.ejectionSocket[1] - 44 * age + 13 * age * age
    ] as const;
    const shell = crouchingLightSourceSocketToSimulation(attacker, socket);
    drawCrouchingLightVfxAsset(context, "shellEjection", sample.shellFrame, CROUCHING_LIGHT_PRESENTATION_V1_ASSETS.shellEjection[sample.shellFrame], shell, attacker.facing);
  }
  if (sample.showMuzzleFlash) {
    drawCrouchingLightVfxAsset(context, "muzzleFlash", sample.muzzleFrame, CROUCHING_LIGHT_PRESENTATION_V1_ASSETS.muzzleFlash[sample.muzzleFrame], muzzle, attacker.facing);
  }
  if (sample.showImpact) {
    const impact = [defender.x - attacker.facing * 22, defender.y - 76] as const;
    drawCrouchingLightVfxAsset(context, "impactSpark", sample.impactFrame, CROUCHING_LIGHT_PRESENTATION_V1_ASSETS.impactSpark[sample.impactFrame], impact, attacker.facing);
  }
}

function drawCrouchingMediumOpposedSplitShotVfx(context: CanvasRenderingContext2D, sample: ReturnType<typeof crouchingMediumOpposedSplitShotSample>) {
  if (!sample.active || sample.contactAge === null) return;
  const attacker = state.fighters.p1;
  const defender = state.fighters.p2;
  for (const lane of ["screenLeft", "screenRight"] as const) {
    const authoredDirection = lane === "screenLeft" ? -1 : 1;
    const laneFacing = (attacker.facing * authoredDirection) as 1 | -1;
    const muzzleSocket = CROUCHING_MEDIUM_OPPOSED_SPLIT_SHOT_V6_PRESENTATION.muzzleSockets[lane];
    const muzzle = crouchingLightSourceSocketToSimulation(attacker, muzzleSocket, true);
    if (sample.showTracer) {
      const start = renderer.projectSimulationPoint(muzzle[0], muzzle[1]);
      const end = renderer.projectSimulationPoint(muzzle[0] + laneFacing * 170, muzzle[1]);
      context.save();
      context.strokeStyle = lane === "screenLeft" ? "rgba(255,214,102,.9)" : "rgba(255,245,186,.98)";
      context.lineWidth = 3;
      context.beginPath();
      context.moveTo(start.x, start.y);
      context.lineTo(end.x, end.y);
      context.stroke();
      context.restore();
    }
    if (sample.showSmoke) {
      drawCrouchingLightVfxAsset(context, "smokePuff", sample.smokeFrame, CROUCHING_LIGHT_PRESENTATION_V1_ASSETS.smokePuff[sample.smokeFrame], muzzle, laneFacing);
    }
    if (sample.showShell) {
      const age = sample.contactAge;
      const base = CROUCHING_MEDIUM_OPPOSED_SPLIT_SHOT_V6_PRESENTATION.ejectionSockets[lane];
      const socket = [base[0] - authoredDirection * 34 * age, base[1] - 44 * age + 13 * age * age] as const;
      const shell = crouchingLightSourceSocketToSimulation(attacker, socket);
      drawCrouchingLightVfxAsset(context, "shellEjection", sample.shellFrame, CROUCHING_LIGHT_PRESENTATION_V1_ASSETS.shellEjection[sample.shellFrame], shell, laneFacing);
    }
    if (sample.showMuzzleFlash) {
      drawCrouchingLightVfxAsset(context, "muzzleFlash", sample.muzzleFrame, CROUCHING_LIGHT_PRESENTATION_V1_ASSETS.muzzleFlash[sample.muzzleFrame], muzzle, laneFacing);
    }
  }
  if (sample.showImpact) {
    const impact = [defender.x - attacker.facing * 22, defender.y - 70] as const;
    drawCrouchingLightVfxAsset(context, "impactSpark", sample.impactFrame, CROUCHING_LIGHT_PRESENTATION_V1_ASSETS.impactSpark[sample.impactFrame], impact, attacker.facing);
  }
}

function drawAirLightContactPresentation(context: CanvasRenderingContext2D, sample: ReturnType<typeof airLightContactPresentationSample>) {
  if (!sample.active) return;
  const attacker = state.fighters.p1;
  const defender = state.fighters.p2;
  if (sample.showImpact) {
    const impact = [defender.x - attacker.facing * 18, defender.y - 98] as const;
    drawCrouchingLightVfxAsset(context, "impactSpark", Math.min(sample.activeAge ?? 0, 2), CROUCHING_LIGHT_PRESENTATION_V1_ASSETS.impactSpark[Math.min(sample.activeAge ?? 0, 2)], impact, attacker.facing);
  }
}

function graveFurrowPresentationActive() {
  const runtime = state.graveFurrow;
  const contactAge = runtime.contactTick === null ? null : state.tick - runtime.contactTick;
  return (runtime.active && runtime.frameIndex >= 5 && runtime.frameIndex <= 7) || (contactAge !== null && contactAge >= 0 && contactAge <= 4);
}

function drawGraveFurrowVfx(context: CanvasRenderingContext2D) {
  const runtime = state.graveFurrow;
  const attacker = state.fighters.p1;
  const defender = state.fighters.p2;
  if (runtime.active && runtime.frameIndex >= 5 && runtime.frameIndex <= 7) {
    const progress = runtime.frameIndex === 5 ? 0.18 : runtime.frameIndex === 6 ? 0.62 : 1;
    const start = renderer.projectSimulationPoint(attacker.x + attacker.facing * 28, attacker.y - 18);
    const end = renderer.projectSimulationPoint(attacker.x + attacker.facing * (112 + 78 * progress), attacker.y - (30 + 112 * progress));
    const control = renderer.projectSimulationPoint(attacker.x + attacker.facing * (92 + 42 * progress), attacker.y - (10 + 46 * progress));
    context.save();
    context.globalCompositeOperation = "screen";
    context.lineCap = "round";
    for (const [width, alpha] of [[14, 0.12], [7, 0.28], [2.5, 0.86]] as const) {
      context.strokeStyle = `rgba(255,205,84,${alpha})`;
      context.lineWidth = width;
      context.beginPath();
      context.moveTo(start.x, start.y);
      context.quadraticCurveTo(control.x, control.y, end.x, end.y);
      context.stroke();
    }
    context.restore();
  }
  const contactAge = runtime.contactTick === null ? null : state.tick - runtime.contactTick;
  if (runtime.contactOutcome === "hit" && contactAge !== null && contactAge >= 0 && contactAge <= 2) {
    const impact = [defender.x - attacker.facing * 18, defender.y - 92] as const;
    drawCrouchingLightVfxAsset(context, "impactSpark", contactAge, CROUCHING_LIGHT_PRESENTATION_V1_ASSETS.impactSpark[contactAge], impact, attacker.facing);
  }
}

function applyPistolPresentations(
  lightSample: ReturnType<typeof crouchingLightPresentationSample>,
  mediumSample: ReturnType<typeof crouchingMediumOpposedSplitShotSample>
) {
  const fighter = state.fighters.p1;
  const activeSample = fighter.state === "crouching_light_review"
    ? lightSample
    : fighter.state === "crouching_medium_review"
      ? mediumSample
      : null;
  if (activeSample) {
    const root = renderer.projectSimulationPoint(fighter.x, fighter.y);
    const oneUnit = renderer.projectSimulationPoint(fighter.x + 1, fighter.y);
    const pixelsPerSimulationUnit = Math.max(0.01, Math.abs(oneUnit.x - root.x));
    fighter.presentationRootOffsetX = -fighter.facing * activeSample.recoilJoltPixels / pixelsPerSimulationUnit;
    fighter.presentationRootOffsetY = 0;
  }
  const [shakeX, shakeY] = activeSample?.cameraShakePixels ?? [0, 0];
  const transform = `translate(${shakeX}px, ${shakeY}px)`;
  renderer.renderer.domElement.style.transformOrigin = "0 0";
  renderer.renderer.domElement.style.transform = transform;
  overlay.style.transformOrigin = "0 0";
  overlay.style.transform = transform;
}

function drawCombatDiagnostics(
  lightSample: ReturnType<typeof crouchingLightPresentationSample>,
  mediumSample: ReturnType<typeof crouchingMediumOpposedSplitShotSample>,
  airLightSample: ReturnType<typeof airLightContactPresentationSample>
) {
  const width = viewport.clientWidth, height = viewport.clientHeight;
  const dpr = Math.min(devicePixelRatio || 1, 2);
  if (overlay.width !== Math.round(width * dpr) || overlay.height !== Math.round(height * dpr)) { overlay.width = Math.round(width * dpr); overlay.height = Math.round(height * dpr); }
  const context = overlay.getContext("2d")!;
  context.setTransform(dpr, 0, 0, dpr, 0, 0); context.clearRect(0, 0, width, height);
  overlay.style.display = diagnostics || lightSample.active || mediumSample.active || airLightSample.active || graveFurrowPresentationActive() ? "block" : "none";
  drawCrouchingLightVfx(context, lightSample);
  drawCrouchingMediumOpposedSplitShotVfx(context, mediumSample);
  drawAirLightContactPresentation(context, airLightSample);
  drawGraveFurrowVfx(context);
  if (!diagnostics) return;
  for (const id of ["p1", "p2"] as const) {
    const f = state.fighters[id];
    drawBox(context, fighterPushbox(f), "#f4d35e", `${id} push`);
    const hurtboxLabels = ["HEAD", "TORSO + ARMS", "LOWER BODY", "ATTACK ARM"];
    fighterHurtboxes(f).forEach((rect, index) => drawBox(context, rect, "#55d6be", `${id} ${hurtboxLabels[index]} HURTBOX`));
    fighterActiveHitboxes(f).forEach((rect, index) => drawBox(context, rect, "#ff4d6d", `${id} hit${index}`));
    const rootPoint = renderer.projectSimulationPoint(f.x, f.y);
    context.fillStyle = "#ffffff"; context.beginPath(); context.arc(rootPoint.x, rootPoint.y, 4, 0, Math.PI * 2); context.fill();
    const animation = selectSandboxAnimation(f, state);
    const diagnosticFoot = id === "p1" ? state.forwardWalkV2Diagnostic.plantedFootWorldPosition : null;
    const footOffset = animation.supportFoot.includes("screen_left") ? -16 : animation.supportFoot.includes("screen_right") ? 16 : 0;
    const support = renderer.projectSimulationPoint(diagnosticFoot ?? f.x + footOffset * f.facing, state.stage.groundY);
    context.fillStyle = "#ff9f1c"; context.beginPath(); context.arc(support.x, support.y, 5, 0, Math.PI * 2); context.fill();
    context.fillText(`${id} support: ${animation.supportFoot}`, support.x + 7, support.y - 7);
  }
}

function updateFallbackLabel(id: SandboxFighterId) {
  const fighter = state.fighters[id];
  const animation = selectSandboxAnimation(fighter, state);
  const element = document.querySelector<HTMLDivElement>(`#fallback-${id}`)!;
  if (!animation.fallbackWarning) { element.style.display = "none"; return; }
  const point = renderer.projectSimulationPoint(fighter.x, fighter.y - 138);
  element.textContent = animation.fallbackWarning;
  element.style.left = `${point.x}px`; element.style.top = `${point.y}px`; element.style.display = "block";
}

function renderFrame() {
  const crouchingLightPresentation = crouchingLightPresentationSample(state.fighters.p1);
  const crouchingMediumOpposedSplitShotPresentation = crouchingMediumOpposedSplitShotSample(state.fighters.p1);
  const airLightContactPresentation = airLightContactPresentationSample(state.fighters.p1);
  const activeAirNormal = airNormalForState(state.fighters.p1.state);
  applyPistolPresentations(crouchingLightPresentation, crouchingMediumOpposedSplitShotPresentation);
  for (const id of ["p1", "p2"] as const) {
    const animation = selectSandboxAnimation(state.fighters[id], state);
    renderer.setFighterFrame(id, animation.sourceId, animation.presentationFacingOverride ?? null);
  }
  const finisherVfx = commandGrabFinisherVfxPresentation(state.commandGrab, state.fighters.p1, state.fighters.p2);
  renderer.setFinisherShotVfx(commandGrabFinisherVfxEnabled ? finisherVfx : {
    ...finisherVfx,
    active: false,
    showMuzzleFlash: false,
    showTracer: false,
    showImpact: false,
    visibleImpactCount: 0
  });
  renderer.render(state);
  drawCombatDiagnostics(crouchingLightPresentation, crouchingMediumOpposedSplitShotPresentation, airLightContactPresentation);
  updateFallbackLabel("p1"); updateFallbackLabel("p2");
  const baseArena = renderer.snapshot(state, routeIdentity);
  const arena = tribunalLivePlaytestRoute
    ? {
        ...baseArena,
        status: "production_arena_live_playtest_candidate",
        deployable: false,
        approvalState: "awaiting_actual_tribunal_graybox_integration"
      }
    : baseArena;
  const fighters = Object.fromEntries((["p1", "p2"] as const).map((id) => {
    const fighter = state.fighters[id], animation = selectSandboxAnimation(fighter, state);
    const defensePackage = currentDefensePackage(fighter);
    const defenseExposure = currentDefenseExposure(fighter);
    return [id, {
      health: fighter.health,
      meter: fighter.meter,
      damageScaling: fighter.damageScaling,
      fighterState: fighter.state,
      animationFrame: animation.sourceId,
      animationApproval: animation.approval,
      moveCursor: fighter.moveCursor,
      movePhase: currentHeavyPhase(fighter),
      rootPosition: [fighter.x, fighter.y],
      collisionPosition: [fighter.x, fighter.y],
      hitboxes: fighterActiveHitboxes(fighter),
      hurtboxes: fighterHurtboxes(fighter),
      pushbox: fighterPushbox(fighter),
      facing: fighter.facing,
      mirrored: fighter.facing < 0,
      supportFoot: animation.supportFoot,
      swingFoot: animation.swingFoot,
      walkCyclePhase: animation.walkCyclePhase,
      fallbackWarning: animation.fallbackWarning,
      hitstop: fighter.hitstop,
      hitstun: fighter.hitstun,
      blockstun: fighter.blockstun
      ,packageId: fighter.defensePackageId
      ,packageCursor: fighter.defenseCursor
      ,packageInstance: fighter.defensePackageInstance
      ,gameplayTimingStatus: defensePackage?.gameplayTimingStatus ?? null
      ,artworkExposure: defenseExposure
      ,sourceGrounding: currentDefenseGrounding(fighter)
      ,returnState: fighter.returnState
      ,presentationEventId: fighter.lastPresentationEventId
    }];
  }));
  const snapshot = {
    routeIdentity,
    tribunalLivePlaytestRoute,
    stageStatus: arena.status,
    stageApprovalState: arena.approvalState,
    status: state.status,
    candidateOnly: state.candidateOnly,
    deployable: state.deployable,
    productionRoster: state.productionRoster,
    spriteRegistryCount: Object.keys(swahiliSandboxSpriteSources).length,
    authority: { simulation: "deterministic_60hz", renderingMayAffectGameplay: false },
    tick: state.tick,
    checksum: sandboxChecksum(state),
    paused,
    slowMotion,
    vfxStudyMode,
    commandGrabFinisherVfxEnabled,
    dummyBlockMode: state.dummyBlockMode,
    dummyCrouching: state.dummyCrouching,
    counterHitArmed: state.counterHitArmed,
    lastEvent: state.lastEvent,
    lastCombatDiagnostic: state.lastCombatDiagnostic,
    warnings: state.warnings,
    presentationEvents: state.presentationEvents,
    presentationEventLedger: state.presentationEventLedger,
    fighters,
    standingHeavy: SANDBOX_TUNING.standingHeavy,
    balanceAuthority: SANDBOX_TUNING.classification,
    missingAnimationStates: MISSING_ANIMATION_STATES,
    backwardWalk: { complete: false, realRoles: 5, missingRoles: 3, status: "BLOCKED_ON_THREE_MANUAL_PAINTOVERS" },
    forwardWalkV2: {
      ...FORWARD_WALK_V2_REVIEW_STATUS,
      selectedTiming: state.forwardWalkV2Diagnostic.timingProfileId,
      timingProfiles: FORWARD_WALK_V2_TIMING_PROFILES,
      diagnostic: state.forwardWalkV2Diagnostic
    },
    standingNormalsMotionV1: {
      approval: "awaiting_human_standing_normals_motion_live_review",
      candidateOnly: true,
      deployable: false,
      selectedTiming: state.fighters.p1.standingNormalTimingProfile,
      timingProfiles: STANDING_NORMALS_MOTION_V1_TIMING_PROFILES,
      artwork: selectSandboxAnimation(state.fighters.p1, state)
    },
    crouchingLightV4TimingReview: {
      ...CROUCHING_LIGHT_PRESENTATION_V1,
      approval: CROUCHING_LIGHT_V4_TIMING_REVIEW_STATUS,
      selectedTiming: state.fighters.p1.crouchingLightTimingProfile,
      defaultTiming: CROUCHING_LIGHT_V4_DEFAULT_TIMING,
      timingProfiles: CROUCHING_LIGHT_V4_TIMING_PROFILES,
      presentation: crouchingLightPresentation,
      artwork: selectSandboxAnimation(state.fighters.p1, state),
      gameplayExposureCursorAligned: true,
      combatGeometryChanged: false,
      damageChanged: false
    },
    crouchingMediumOpposedSplitShotV6: {
      ...CROUCHING_MEDIUM_OPPOSED_SPLIT_SHOT_V6_PRESENTATION,
      approval: CROUCHING_MEDIUM_OPPOSED_SPLIT_SHOT_V6_REVIEW_STATUS,
      candidateOnly: true,
      deployable: false,
      selectedTiming: state.fighters.p1.crouchingMediumTimingProfile,
      defaultTiming: CROUCHING_MEDIUM_OPPOSED_SPLIT_SHOT_V6_DEFAULT_TIMING,
      timingProfiles: CROUCHING_MEDIUM_OPPOSED_SPLIT_SHOT_V6_TIMING_PROFILES,
      presentation: crouchingMediumOpposedSplitShotPresentation,
      connectedHitOrdinals: [...state.fighters.p1.groundNormalConnectedHitOrdinals],
      finalHumanReviewGate: CROUCHING_MEDIUM_OPPOSED_SPLIT_SHOT_V6_REVIEW_STATUS,
      twoOpposedMuzzleEventsShareOneFiringBeat: true,
      oneRegisteredHitPerOpponentMaximum: true,
      gameplayConceptChangedByHumanInstruction: true,
      damageTotalPreservedAt65: true
    },
    crouchingHeavyMotionV1: {
      approval: CROUCHING_HEAVY_MOTION_V1_REVIEW_STATUS,
      candidateOnly: true,
      deployable: false,
      selectedTiming: state.fighters.p1.crouchingHeavyTimingProfile,
      defaultTiming: CROUCHING_HEAVY_MOTION_V1_DEFAULT_TIMING,
      timingProfiles: CROUCHING_HEAVY_MOTION_V1_TIMING_PROFILES,
      connectorCount: 2,
      knockdownAuthoritative: false,
      combatGeometryChanged: false,
      damageChanged: false
    },
    commandGrabMotionV1: {
      ...COMMAND_GRAB_MOTION_V1_REVIEW,
      approvedFrameCount: COMMAND_GRAB_MOTION_V1_FRAMES.length,
      runtime: state.commandGrab,
      victimReactionArt: COMMAND_GRAB_VICTIM_FALL_V1_REVIEW.approval
    },
    commandGrabVictimFallV1: COMMAND_GRAB_VICTIM_FALL_V1_REVIEW,
    commandGrabFinisherReviewV1: {
      ...COMMAND_GRAB_FINISHER_REVIEW_V1,
      runtime: {
        launchDistance: state.commandGrab.launchDistance,
        maxLaunchDistance: state.commandGrab.maxLaunchDistance,
        launchClippedByStage: state.commandGrab.launchClippedByStage,
        launchPhase: state.commandGrab.launchPhase,
        shotVisualHitRegistered: state.commandGrab.shotVisualHitRegistered,
        shotVisualHitCount: state.commandGrab.shotVisualHitCount
      },
      vfx: arena.effects.finisherShot
    },
    dashRepairV2: {
      ...DASH_REPAIR_V2_REVIEW,
      frameCount: DASH_REPAIR_V2_FRAMES.forward.length + DASH_REPAIR_V2_FRAMES.backward.length,
      runtime: state.dashReview
    },
    jumpFallLandingV1: {
      ...JUMP_FALL_LANDING_V1_REVIEW,
      frameCount: JUMP_FALL_LANDING_V1_FRAMES.length,
      runtime: state.jumpFallLandingReview
    },
    airMobilityV1: {
      ...AIR_MOBILITY_V1_REVIEW,
      runtime: state.airMobilityReview
    },
    airNormalsPlaytestV1: {
      status: "candidate-only",
      deployable: false,
      productionRoster: false,
      gate: AIR_NORMALS_PLAYTEST_V1_GATE,
      gameplayValues: AIR_NORMALS_PLAYTEST_V1_GAMEPLAY_VALUES,
      maxActionsPerAirtime: AIR_NORMALS_PLAYTEST_V1_MAX_ACTIONS,
      definitions: AIR_NORMALS_PLAYTEST_V1,
      activeMove: activeAirNormal?.id ?? null,
      activePhase: activeAirNormal && state.fighters.p1.moveCursor !== null ? airNormalPhase(activeAirNormal, state.fighters.p1.moveCursor) : "none",
      connectedHitOrdinals: state.fighters.p1.airNormalConnectedHitOrdinals,
      runtime: { actionsUsed: state.airMobilityReview.airNormalActionsUsed, queuedAirNormal: state.airMobilityReview.queuedAirNormal },
      airLightPresentation: { ...AIR_LIGHT_CONTACT_PRESENTATION_V1, sample: airLightContactPresentation }
    },
    graveFurrowPlaytestV1: {
      ...GRAVE_FURROW_PLAYTEST_V1,
      exposures: GRAVE_FURROW_V1_EXPOSURES,
      totalTicks: GRAVE_FURROW_V1_TOTAL_TICKS,
      runtime: state.graveFurrow,
      artwork: selectSandboxAnimation(state.fighters.p1, state)
    },
    airDashMotionV1: {
      ...AIR_DASH_MOTION_V1_REVIEW,
      frameCount: AIR_DASH_MOTION_V1_FRAMES.forward.length + AIR_DASH_MOTION_V1_FRAMES.backward.length,
      artwork: selectSandboxAnimation(state.fighters.p1, state)
    },
    airDashSideSwitchV2: {
      ...AIR_DASH_SIDE_SWITCH_V2_REVIEW,
      frameCount: 1,
      connector: AIR_DASH_SIDE_SWITCH_V2_FRAME,
      runtime: state.airMobilityReview,
      artwork: selectSandboxAnimation(state.fighters.p1, state)
    },
    turnSideSwitchV1: {
      ...TURN_SIDE_SWITCH_V1_REVIEW,
      runtime: state.turnSideSwitchReview
    },
    stageCamera: arena.camera,
    fighterScale: 0.0033,
    arena
  };
  hud.textContent = JSON.stringify(snapshot, null, 2);
  const walk = state.forwardWalkV2Diagnostic;
  locomotionHud.textContent = [
    `simulation tick: ${walk.simulationTick}`,
    `root curve: ${walk.motionCurveVersion}`,
    `artwork frame: ${String(walk.artworkFrame).padStart(2, "0")} ${walk.sourceId}`,
    `gait role: ${walk.gaitRole}`,
    `support foot: ${walk.supportFoot}`,
    `swing foot: ${walk.swingFoot}`,
    `fighter root: ${walk.fighterRoot.toFixed(3)}`,
    `planted-foot world: ${walk.plantedFootWorldPosition === null ? "n/a" : walk.plantedFootWorldPosition.toFixed(3)}`,
    `per-tick displacement: ${walk.perTickDisplacement.toFixed(3)}`,
    `accumulated displacement: ${walk.accumulatedDisplacement.toFixed(3)}`,
    `cycle displacement: ${walk.cycleAccumulatedDisplacement.toFixed(3)}`,
    `foot-skate estimate: ${walk.footSkateEstimate.toFixed(3)} sim units`,
    `mean / peak skate: ${walk.meanFootSkateEstimate.toFixed(3)} / ${walk.peakFootSkateEstimate.toFixed(3)}`,
    `transition: ${walk.transitionState}`,
    `backward warning: ${walk.incompleteBackwardWalkWarning}`,
    "",
    `ground normal state: ${state.fighters.p1.state}`,
    `standing normal timing: ${state.fighters.p1.standingNormalTimingProfile}`,
    `crouching light timing: ${state.fighters.p1.crouchingLightTimingProfile}`,
    `crouching medium timing: ${state.fighters.p1.crouchingMediumTimingProfile}`,
    `crouching heavy timing: ${state.fighters.p1.crouchingHeavyTimingProfile}`,
    `ground normal art: ${selectSandboxAnimation(state.fighters.p1, state).sourceId}`,
    `ground normal role: ${selectSandboxAnimation(state.fighters.p1, state).role}`,
    `ground normal cursor: ${state.fighters.p1.moveCursor ?? "inactive"}`,
    `ground normal hit connected: ${state.fighters.p1.attackConnected}`,
    `ground normal connected hit ordinals: ${state.fighters.p1.groundNormalConnectedHitOrdinals.join(",") || "none"}`,
    `crouching light VFX: flash=${crouchingLightPresentation.showMuzzleFlash} smoke=${crouchingLightPresentation.showSmoke} shell=${crouchingLightPresentation.showShell} impact=${crouchingLightPresentation.showImpact}`,
    `crouching light hitstop / jolt / shake: ${state.fighters.p1.hitstop} / ${crouchingLightPresentation.recoilJoltPixels}px / ${crouchingLightPresentation.cameraShakePixels.join(",")}px`,
    `crouching medium opposed split shot: age=${crouchingMediumOpposedSplitShotPresentation.contactAge ?? "n/a"} simultaneous flashes=${crouchingMediumOpposedSplitShotPresentation.visibleMuzzleEvents} impact=${crouchingMediumOpposedSplitShotPresentation.showImpact}`,
    `crouching medium parity: opposed muzzle events=2 firing beats=1 registered hits=${state.fighters.p1.groundNormalConnectedHitOrdinals.length}/1`,
    `air light buffer / body contact / detached arc: ${state.airMobilityReview.queuedAirNormal ?? "none"} / ${AIR_LIGHT_CONTACT_PRESENTATION_V1.bodyArtworkComplete} / ${airLightContactPresentation.showContactArc}`,
    "",
    `grave furrow: ${state.graveFurrow.active ? "PLAYING" : state.graveFurrow.result}`,
    `grave furrow frame: ${state.graveFurrow.frameIndex}/9 ${state.graveFurrow.sourceId}`,
    `grave furrow tick / role: ${state.graveFurrow.simulationTick}/${GRAVE_FURROW_V1_TOTAL_TICKS} / ${state.graveFurrow.role}`,
    `grave furrow contact / launch: ${state.graveFurrow.contactOutcome ?? "none"} / ${state.graveFurrow.victimLaunched}`,
    `grave furrow root advance: ${state.graveFurrow.actualRootAdvance.toFixed(3)}`,
    `grave furrow values: ${state.graveFurrow.gameplayValues}`,
    "",
    `command grab: ${state.commandGrab.active ? "PLAYING" : state.commandGrab.result}`,
    `CG frame: ${String(state.commandGrab.frameIndex).padStart(2, "0")}/24 ${state.commandGrab.sourceId}`,
    `CG source tick: ${state.commandGrab.sourceTick}/84 at ${state.commandGrab.playbackRate}x`,
    `CG role: ${state.commandGrab.role}`,
    `CG victim: ${state.commandGrab.victimPose}`,
    `CG captured / side switched: ${state.commandGrab.captured} / ${state.commandGrab.sideSwitchCompleted}`,
    `CG launch: ${state.commandGrab.launchDistance.toFixed(3)} current / ${state.commandGrab.maxLaunchDistance.toFixed(3)} max (${state.commandGrab.launchPhase})`,
    `CG stage-clipped: ${state.commandGrab.launchClippedByStage}`,
    `CG visual shot hit: ${state.commandGrab.shotVisualHitCount}/1 registered=${state.commandGrab.shotVisualHitRegistered}`,
    `CG values: ${state.commandGrab.gameplayValues}`,
    `CG knockdown recovery: ${state.fighters.p2.state === "command_grab_downed" ? selectSandboxAnimation(state.fighters.p2, state).role : "inactive"}`,
    "",
    `dash: ${state.dashReview.active ? "PLAYING" : state.dashReview.result} ${state.dashReview.direction}`,
    `dash frame: ${state.dashReview.frameIndex}/6 ${state.dashReview.sourceId}`,
    `dash tick: ${state.dashReview.simulationTick}/${DASH_REPAIR_V2_REVIEW[state.dashReview.direction].totalTicks}`,
    `dash role: ${state.dashReview.role}`,
    `dash distance: ${state.dashReview.actualDistance.toFixed(3)} / ${state.dashReview.intendedDistance.toFixed(3)}`,
    `dash stage/pushbox-clipped: ${state.dashReview.clippedByStageOrPushbox}`,
    `dash values: ${state.dashReview.gameplayValues}`,
    "",
    `jump: ${state.jumpFallLandingReview.active ? "PLAYING" : state.jumpFallLandingReview.result} ${state.jumpFallLandingReview.landingMode}`,
    `jump frame: ${state.jumpFallLandingReview.frameIndex}/8 ${state.jumpFallLandingReview.sourceId}`,
    `jump phase / role: ${state.jumpFallLandingReview.phase} / ${state.jumpFallLandingReview.role}`,
    `jump tick / airborne: ${state.jumpFallLandingReview.simulationTick} / ${state.jumpFallLandingReview.airborneTicks}`,
    `jump takeoff / apex / landing: ${state.jumpFallLandingReview.takeoffTick ?? "n/a"} / ${state.jumpFallLandingReview.apexTick ?? "n/a"} / ${state.jumpFallLandingReview.landingTick ?? "n/a"}`,
    `jump peak Y / horizontal: ${state.jumpFallLandingReview.peakY.toFixed(3)} / ${state.jumpFallLandingReview.horizontalDistance.toFixed(3)}`,
    `jump values: ${state.jumpFallLandingReview.gameplayValues}`,
    "",
    `air normal: ${activeAirNormal?.id ?? "inactive"}`,
    `air normal phase / cursor: ${activeAirNormal && state.fighters.p1.moveCursor !== null ? airNormalPhase(activeAirNormal, state.fighters.p1.moveCursor) : "none"} / ${state.fighters.p1.moveCursor ?? "inactive"}`,
    `air normal artwork: ${activeAirNormal ? selectSandboxAnimation(state.fighters.p1, state).sourceId : "jump/fall/landing"}`,
    `air normal connected hits: ${state.fighters.p1.airNormalConnectedHitOrdinals.join(",") || "none"}`,
    `air normal actions: ${state.airMobilityReview.airNormalActionsUsed}/${AIR_NORMALS_PLAYTEST_V1_MAX_ACTIONS}`,
    `air normal gate: ${AIR_NORMALS_PLAYTEST_V1_GATE}`,
    `air normal values: ${AIR_NORMALS_PLAYTEST_V1_GAMEPLAY_VALUES}`,
    "",
    `air mobility: jumps ${state.airMobilityReview.jumpsUsed}/${AIR_MOBILITY_V1_REVIEW.maxJumps} air dashes ${state.airMobilityReview.airDashesUsed}/${AIR_MOBILITY_V1_REVIEW.maxAirDashes}`,
    `double jump triggered: ${state.airMobilityReview.doubleJumpTriggered}`,
    `air dash: ${state.airMobilityReview.airDashActive ? "PLAYING" : state.airMobilityReview.result} ${state.airMobilityReview.airDashDirection}`,
    `air dash tick / distance: ${state.airMobilityReview.airDashTick}/${AIR_MOBILITY_V1_REVIEW.airDashTicks} / ${state.airMobilityReview.airDashActualDistance.toFixed(3)}`,
    `air dash artwork: ${selectSandboxAnimation(state.fighters.p1, state).sourceId}`,
    `air dash crossed opponent: ${state.airMobilityReview.crossedOpponent}`,
    `air dash side-switch tick: ${state.airMobilityReview.sideSwitchTick ?? "n/a"}`,
    `air dash presentation facing override: ${selectSandboxAnimation(state.fighters.p1, state).presentationFacingOverride ?? "none"}`,
    `air mobility values: ${state.airMobilityReview.gameplayValues}`,
    "",
    `turn: ${state.turnSideSwitchReview.active ? "PLAYING" : state.turnSideSwitchReview.result}`,
    `turn frame: ${state.turnSideSwitchReview.frameIndex}/4 ${state.turnSideSwitchReview.sourceId}`,
    `turn tick: ${state.turnSideSwitchReview.simulationTick}/${TURN_SIDE_SWITCH_V1_REVIEW.totalTicks}`,
    `turn role: ${state.turnSideSwitchReview.role}`,
    `turn facing: ${state.turnSideSwitchReview.startingFacing} -> ${state.turnSideSwitchReview.endingFacing} swaps=${state.turnSideSwitchReview.facingSwapCount}`,
    `turn root displacement: ${state.turnSideSwitchReview.rootDisplacement.toFixed(3)}`,
    `turn opponent crossing: ${(state.turnSideSwitchReview.opponentProgress * 100).toFixed(1)}%`,
    `turn values: ${state.turnSideSwitchReview.gameplayValues}`
  ].join("\n");
  document.querySelector<HTMLSelectElement>("#walk-timing")!.value = walk.timingProfileId;
  document.querySelector<HTMLSelectElement>("#crouching-light-timing")!.value = state.fighters.p1.crouchingLightTimingProfile;
  document.querySelector<HTMLSelectElement>("#crouching-medium-timing")!.value = state.fighters.p1.crouchingMediumTimingProfile;
  document.querySelector<HTMLSelectElement>("#crouching-heavy-timing")!.value = state.fighters.p1.crouchingHeavyTimingProfile;
  for (const id of ["p1", "p2"] as const) {
    const health = state.fighters[id].health;
    document.querySelector<HTMLDivElement>(`#${id}-health`)!.style.width = `${health / SANDBOX_TUNING.health * 100}%`;
    document.querySelector<HTMLSpanElement>(`#${id}-health-value`)!.textContent = String(health);
  }
  document.querySelector<HTMLButtonElement>("#dummy")!.textContent = `Dummy block: ${state.dummyBlockMode}`;
  document.querySelector<HTMLButtonElement>("#counter-hit")!.textContent = `Counter hit: ${state.counterHitArmed ? "armed" : "off"}`;
  document.querySelector<HTMLButtonElement>("#pause")!.textContent = paused ? "Resume" : "Pause";
  return snapshot;
}

function setDiagnostics(enabled: boolean) { diagnostics = enabled; renderer.setDiagnostics(enabled); document.querySelector<HTMLButtonElement>("#diagnostics")!.textContent = `Diagnostics: ${enabled ? "on" : "off"}`; return renderFrame(); }
function runScenario(id: SandboxScenarioId) { setupSandboxScenario(state, id); renderer.snapCamera(state); return renderFrame(); }
function setWalkTiming(profileId: ForwardWalkV2TimingProfileId) { setForwardWalkV2TimingProfile(state, profileId); return renderFrame(); }
function setStandingNormalTiming(profileId: StandingNormalTimingProfileId) { setStandingNormalsMotionV1TimingProfile(state, profileId); return renderFrame(); }
function setCrouchingLightTiming(profileId: CrouchingLightTimingProfileId) { setCrouchingLightV4TimingProfile(state, profileId); return renderFrame(); }
function setCrouchingMediumTiming(profileId: CrouchingMediumTimingProfileId) { setCrouchingMediumOpposedSplitShotV6TimingProfile(state, profileId); return renderFrame(); }
function setCrouchingHeavyTiming(profileId: CrouchingHeavyTimingProfileId) { setCrouchingHeavyMotionV1TimingProfile(state, profileId); return renderFrame(); }
function issue(command: SandboxCommand) { fixedStep({ command }); renderFrame(); }
function playTurnSideSwitch() { fixedStep({ command: "play_turn_side_switch" }); return renderFrame(); }
function playCommandGrab() { fixedStep({ commandGrab: true }); return renderFrame(); }
function playGraveFurrow() { fixedStep({ graveFurrow: true }); return renderFrame(); }
function playGroundNormal(strength: "light" | "medium" | "heavy", crouching = false) {
  fixedStep({ down: crouching, light: strength === "light", medium: strength === "medium", heavy: strength === "heavy" });
  return renderFrame();
}
function playAirNormal(strength: "light" | "medium" | "heavy") {
  prepareAirborne(0);
  fixedStep({ light: strength === "light", medium: strength === "medium", heavy: strength === "heavy" });
  return renderFrame();
}
function playDash(direction: "forward" | "backward") {
  const travel = state.fighters.p1.facing * (direction === "forward" ? 1 : -1);
  fixedStep({ dash: true, left: travel < 0, right: travel > 0 });
  return renderFrame();
}
function playJump(mode: JumpLandingReviewMode) {
  if (state.jumpFallLandingReview.active || !state.fighters.p1.grounded) return renderFrame();
  setJumpLandingReviewMode(state, mode);
  fixedStep({ up: true });
  return renderFrame();
}
function prepareAirborne(travel: -1 | 0 | 1) {
  if (!state.fighters.p1.grounded) return;
  setJumpLandingReviewMode(state, "soft");
  fixedStep({ up: true, left: travel < 0, right: travel > 0 });
  for (let tick = 0; tick < 7; tick++) fixedStep({ left: travel < 0, right: travel > 0 });
}
function playDoubleJump() {
  prepareAirborne(0);
  fixedStep({ up: true });
  return renderFrame();
}
function playAirDash(direction: "forward" | "backward") {
  const travel = state.fighters.p1.facing * (direction === "forward" ? 1 : -1) as -1 | 1;
  prepareAirborne(travel);
  fixedStep({ dash: true, left: travel < 0, right: travel > 0 });
  return renderFrame();
}
function setVfxStudy(mode: TribunalEffectStudyMode) {
  vfxStudyMode = mode;
  renderer.setEffectStudy(mode);
  document.querySelector<HTMLButtonElement>("#vfx-study")!.textContent = `VFX contrast: ${mode}`;
  return renderFrame();
}
function cycleVfxStudy() {
  const modes: TribunalEffectStudyMode[] = ["off", "hit_sparks", "projectile", "large_beam", "all"];
  return setVfxStudy(modes[(modes.indexOf(vfxStudyMode) + 1) % modes.length]);
}
function setCommandGrabFinisherVfx(enabled: boolean) {
  commandGrabFinisherVfxEnabled = enabled;
  document.querySelector<HTMLButtonElement>("#command-grab-vfx")!.textContent = `Command grab VFX: ${enabled ? "on" : "off"}`;
  return renderFrame();
}

function loop(now: number) {
  const delta = Math.min(0.1, (now - lastTime) / 1000);
  lastTime = now;
  if (!paused) accumulator += delta * (slowMotion ? 0.25 : 1);
  while (accumulator >= 1 / 60) { fixedStep(); accumulator -= 1 / 60; }
  renderFrame();
  requestAnimationFrame(loop);
}

window.addEventListener("keydown", (event) => {
  if (["ArrowLeft", "ArrowRight", "ArrowDown", "ArrowUp", "F1"].includes(event.code)) event.preventDefault();
  keys.add(event.code);
  if (event.repeat) return;
  if (event.code === "Escape") paused = !paused;
  if (event.code === "Period" && paused) fixedStep();
  if (event.code === "KeyR") pendingCommand = "reset_round";
  if (event.code === "KeyF") pendingCommand = "switch_sides";
  if (event.code === "KeyT") pendingCommand = "play_turn_side_switch";
  if (event.code === "KeyB") pendingCommand = "toggle_dummy_block";
  if (event.code === "KeyC") pendingCommand = "toggle_counter_hit";
  if (event.code === "F1") setDiagnostics(!diagnostics);
  if (event.code === "KeyQ") slowMotion = !slowMotion;
  if (event.code === "KeyV") cycleVfxStudy();
});
window.addEventListener("keyup", (event) => keys.delete(event.code));
window.addEventListener("blur", () => keys.clear());
window.addEventListener("resize", () => { renderer.resize(); renderFrame(); });

document.querySelector("#pause")!.addEventListener("click", () => { paused = !paused; renderFrame(); });
document.querySelector("#step")!.addEventListener("click", () => { if (paused) fixedStep(); renderFrame(); });
document.querySelector("#slow")!.addEventListener("click", () => { slowMotion = !slowMotion; document.querySelector<HTMLButtonElement>("#slow")!.textContent = `Slow motion: ${slowMotion ? "0.25x" : "off"}`; });
document.querySelector("#reset")!.addEventListener("click", () => issue("reset_round"));
document.querySelector("#switch")!.addEventListener("click", () => issue("switch_sides"));
document.querySelector("#turn-side-switch")!.addEventListener("click", () => playTurnSideSwitch());
document.querySelector("#dummy")!.addEventListener("click", () => issue("toggle_dummy_block"));
document.querySelector("#diagnostics")!.addEventListener("click", () => setDiagnostics(!diagnostics));
document.querySelector("#light-reaction")!.addEventListener("click", () => issue("force_light_reaction"));
document.querySelector("#heavy-reaction")!.addEventListener("click", () => issue("force_heavy_reaction"));
document.querySelector("#counter-hit")!.addEventListener("click", () => issue("toggle_counter_hit"));
document.querySelector("#standing-light")!.addEventListener("click", () => playGroundNormal("light"));
document.querySelector("#standing-medium")!.addEventListener("click", () => playGroundNormal("medium"));
document.querySelector("#crouching-light")!.addEventListener("click", () => playGroundNormal("light", true));
document.querySelector("#crouching-medium")!.addEventListener("click", () => playGroundNormal("medium", true));
document.querySelector("#crouching-heavy")!.addEventListener("click", () => playGroundNormal("heavy", true));
document.querySelector("#air-light")!.addEventListener("click", () => playAirNormal("light"));
document.querySelector("#air-medium")!.addEventListener("click", () => playAirNormal("medium"));
document.querySelector("#air-heavy")!.addEventListener("click", () => playAirNormal("heavy"));
document.querySelector("#grave-furrow")!.addEventListener("click", () => playGraveFurrow());
document.querySelector("#command-grab")!.addEventListener("click", () => playCommandGrab());
document.querySelector("#command-grab-vfx")!.addEventListener("click", () => setCommandGrabFinisherVfx(!commandGrabFinisherVfxEnabled));
document.querySelector("#dash-forward")!.addEventListener("click", () => playDash("forward"));
document.querySelector("#dash-backward")!.addEventListener("click", () => playDash("backward"));
document.querySelector("#jump-soft")!.addEventListener("click", () => playJump("soft"));
document.querySelector("#jump-attack")!.addEventListener("click", () => playJump("attack"));
document.querySelector("#jump-hard")!.addEventListener("click", () => playJump("hard"));
document.querySelector("#double-jump")!.addEventListener("click", () => playDoubleJump());
document.querySelector("#air-dash-forward")!.addEventListener("click", () => playAirDash("forward"));
document.querySelector("#air-dash-backward")!.addEventListener("click", () => playAirDash("backward"));
document.querySelector("#vfx-study")!.addEventListener("click", () => cycleVfxStudy());
document.querySelector("#focus")!.addEventListener("click", () => viewport.focus());
document.querySelector("#load-scenario")!.addEventListener("click", () => runScenario(document.querySelector<HTMLSelectElement>("#scenario")!.value as SandboxScenarioId));
document.querySelector("#apply-walk-timing")!.addEventListener("click", () => setWalkTiming(document.querySelector<HTMLSelectElement>("#walk-timing")!.value as ForwardWalkV2TimingProfileId));
document.querySelector("#apply-standing-normal-timing")!.addEventListener("click", () => setStandingNormalTiming(document.querySelector<HTMLSelectElement>("#standing-normal-timing")!.value as StandingNormalTimingProfileId));
document.querySelector("#apply-crouching-light-timing")!.addEventListener("click", () => setCrouchingLightTiming(document.querySelector<HTMLSelectElement>("#crouching-light-timing")!.value as CrouchingLightTimingProfileId));
document.querySelector("#apply-crouching-medium-timing")!.addEventListener("click", () => setCrouchingMediumTiming(document.querySelector<HTMLSelectElement>("#crouching-medium-timing")!.value as CrouchingMediumTimingProfileId));
document.querySelector("#apply-crouching-heavy-timing")!.addEventListener("click", () => setCrouchingHeavyTiming(document.querySelector<HTMLSelectElement>("#crouching-heavy-timing")!.value as CrouchingHeavyTimingProfileId));

const api = {
  renderer,
  ready: sandboxReady,
  get state() { return state; },
  get diagnostics() { return diagnostics; },
  runScenario,
  setDiagnostics,
  setVfxStudy,
  setCommandGrabFinisherVfx,
  setForwardWalkTiming: setWalkTiming,
  setStandingNormalTiming,
  setCrouchingLightTiming,
  setCrouchingMediumTiming,
  setCrouchingHeavyTiming,
  playGroundNormal,
  playAirNormal,
  playGraveFurrow,
  playCommandGrab,
  playDash,
  playJump,
  playDoubleJump,
  playAirDash,
  playTurnSideSwitch,
  commandGrabReview: COMMAND_GRAB_MOTION_V1_REVIEW,
  graveFurrowReview: GRAVE_FURROW_PLAYTEST_V1,
  commandGrabFinisherReview: COMMAND_GRAB_FINISHER_REVIEW_V1,
  dashRepairReview: DASH_REPAIR_V2_REVIEW,
  jumpFallLandingReview: JUMP_FALL_LANDING_V1_REVIEW,
  airMobilityReview: AIR_MOBILITY_V1_REVIEW,
  turnSideSwitchReview: TURN_SIDE_SWITCH_V1_REVIEW,
  commandGrabVictimFallReview: COMMAND_GRAB_VICTIM_FALL_V1_REVIEW,
  timingProfiles: FORWARD_WALK_V2_TIMING_PROFILES,
  standingNormalTimingProfiles: STANDING_NORMALS_MOTION_V1_TIMING_PROFILES,
  crouchingLightTimingProfiles: CROUCHING_LIGHT_V4_TIMING_PROFILES,
  crouchingMediumTimingProfiles: CROUCHING_MEDIUM_OPPOSED_SPLIT_SHOT_V6_TIMING_PROFILES,
  crouchingHeavyTimingProfiles: CROUCHING_HEAVY_MOTION_V1_TIMING_PROFILES,
  step: (input: SandboxInputFrame = {}, ticks = 1) => { for (let index = 0; index < ticks; index++) fixedStep(index === 0 ? input : { ...input, command: undefined }); return renderFrame(); },
  forceReaction: (id: SandboxFighterId, weight: "light" | "heavy", options = {}) => { forceDefenseReaction(state, id, weight, options); return renderFrame(); },
  cloneState: () => structuredClone(state),
  restoreState: (snapshot: typeof state, preservePresentationLedger = true) => {
    const ledger = state.presentationEventLedger;
    const events = state.presentationEvents;
    state = structuredClone(snapshot);
    if (preservePresentationLedger) { state.presentationEventLedger = ledger; state.presentationEvents = events; }
    return renderFrame();
  },
  snapshot: renderFrame,
  reset: () => runScenario("idle_center")
};
(window as any).__NGA_SWAHILI_SANDBOX__ = api;
if (tribunalLivePlaytestRoute) (window as any).__NGA_TRIBUNAL_PLAYTEST__ = api;

sandboxReady.then(() => {
  renderer.setDiagnostics(true);
  renderer.snapCamera(state);
  renderFrame();
  if (!captureMode) requestAnimationFrame(loop);
}).catch((error) => {
  const message = error instanceof Error ? error.message : String(error);
  const element = document.querySelector<HTMLDivElement>("#stage-load-error");
  if (element) { element.hidden = false; element.textContent = `ACTUAL TRIBUNAL GRAYBOX LOAD ERROR: ${message}`; }
});
