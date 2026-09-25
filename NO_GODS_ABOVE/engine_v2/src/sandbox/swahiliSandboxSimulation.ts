import { BACKWARD_WALK_SLOTS, FORWARD_WALK_SLOTS, SANDBOX_TUNING, STANDING_HEAVY_EXPOSURES, SWAHILI_SANDBOX_STATUS } from "./sandboxConfig";
import defenseReactionManifest from "./defenseReactionPackages.generated.json";
import type { CompiledDefenseManifest } from "./defenseReactionSandbox";
import {
  FORWARD_WALK_V2_ROOT_CURVE_VERSION,
  FORWARD_WALK_V2_SELECTED_TIMING,
  FORWARD_WALK_V2_TIMING_PROFILES,
  forwardWalkV2DisplacementPerTick,
  forwardWalkV2FrameAtTick,
  supportFootWorldPosition
} from "./forwardWalkV2Review";
import {
  COMMAND_GRAB_MOTION_V1_APPROVAL,
  COMMAND_GRAB_MOTION_V1_FRAMES,
  COMMAND_GRAB_MOTION_V1_REVIEW,
  commandGrabFrameAtSourceTick,
  commandGrabSourceTickAtSimulationTick
} from "./commandGrabMotionV1";
import {
  DASH_REPAIR_V2_APPROVAL,
  DASH_REPAIR_V2_FRAMES,
  DASH_REPAIR_V2_REVIEW,
  dashDisplacementPerTick,
  dashFrameAtTick,
  dashTotalTicks
} from "./dashRepairV2";
import {
  COMMAND_GRAB_VICTIM_FALL_V1_APPROVAL,
  commandGrabVictimFacingForPose,
  commandGrabVictimFallFrameForPose
} from "./commandGrabVictimFallV1";
import {
  COMMAND_GRAB_FINISHER_REVIEW_V1,
  commandGrabFarLaunchPointAtSourceTick
} from "./commandGrabFinisherReviewV1";
import {
  JUMP_FALL_LANDING_V1_FRAMES,
  JUMP_FALL_LANDING_V1_REVIEW,
  jumpLandingHoldTicks,
  jumpLandingState,
  jumpReviewAnimation
} from "./jumpFallLandingV1";
import {
  TURN_SIDE_SWITCH_V1_APPROVAL,
  TURN_SIDE_SWITCH_V1_EXPOSURES,
  TURN_SIDE_SWITCH_V1_REVIEW,
  turnSideSwitchExposureAtTick,
  turnSideSwitchOpponentProgress,
  turnSideSwitchTotalTicks
} from "./turnSideSwitchV1";
import { AIR_MOBILITY_V1_REVIEW, airDashDisplacementPerTick } from "./airMobilityV1";
import { AIR_DASH_MOTION_V1_APPROVAL, AIR_DASH_SIDE_SWITCH_V2_APPROVAL, airDashMotionFrameAtTick, airDashSideSwitchFrameAtTick } from "./airDashMotionV1";
import {
  AIR_NORMALS_PLAYTEST_V1_MAX_ACTIONS,
  AirNormalPlaytestId,
  airNormalForId,
  airNormalForState,
  airNormalFrameAtTick,
  airNormalIsActive,
  airNormalPhase,
  isAirNormalState
} from "./airNormalsPlaytestV1";
import {
  KNOCKDOWN_RECOVERY_MOTION_V1_APPROVAL,
  KNOCKDOWN_RECOVERY_MOTION_V1_REVIEW,
  commandGrabKnockdownRecoveryFrameAtTick
} from "./knockdownRecoveryV1";
import {
  GROUND_NORMALS_PLAYTEST_V1_APPROVAL,
  CROUCHING_LIGHT_V4_DEFAULT_TIMING,
  CROUCHING_LIGHT_V4_TIMING_PROFILES,
  CROUCHING_LIGHT_V4_TIMING_REVIEW_STATUS,
  CROUCHING_MEDIUM_OPPOSED_SPLIT_SHOT_V6_DEFAULT_TIMING,
  CROUCHING_MEDIUM_OPPOSED_SPLIT_SHOT_V6_REVIEW_STATUS,
  CROUCHING_MEDIUM_OPPOSED_SPLIT_SHOT_V6_TIMING_PROFILES,
  CROUCHING_HEAVY_MOTION_V1_DEFAULT_TIMING,
  CROUCHING_HEAVY_MOTION_V1_REVIEW_STATUS,
  CROUCHING_HEAVY_MOTION_V1_TIMING_PROFILES,
  STANDING_NORMALS_MOTION_V1_DEFAULT_TIMING,
  STANDING_NORMALS_MOTION_V1_TIMING_PROFILES,
  GroundNormalPlaytestId,
  groundNormalForId,
  groundNormalForState,
  groundNormalFrameAtTick,
  groundNormalHitAtTick,
  groundNormalPhase,
  isGroundNormalState
} from "./groundNormalsPlaytestV1";
import {
  GRAVE_FURROW_PLAYTEST_V1,
  GRAVE_FURROW_V1_EXPOSURES,
  GRAVE_FURROW_V1_TOTAL_TICKS,
  graveFurrowFrameAtTick,
  graveFurrowIsActive,
  graveFurrowPhaseAtTick,
  graveFurrowRootAdvancePerTick
} from "./graveFurrowPlaytestV1";
import { CrouchingHeavyTimingProfileId, CrouchingLightTimingProfileId, CrouchingMediumTimingProfileId, DashReviewDirection, DefenseReactionPackageId, ForwardWalkV2TimingProfileId, JumpLandingReviewMode, SandboxAnimationFrame, SandboxCombatDiagnostic, SandboxFighterId, SandboxFighterState, SandboxInputFrame, SandboxRect, SandboxReturnState, SandboxStateName, StandingNormalTimingProfileId, SwahiliSandboxState } from "./types";

const clone = <T>(value: T): T => JSON.parse(JSON.stringify(value));
const clamp = (value: number, min: number, max: number) => Math.max(min, Math.min(max, value));
const sign = (value: number): 1 | -1 => value >= 0 ? 1 : -1;
const DEFENSE_MANIFEST = defenseReactionManifest as CompiledDefenseManifest;
type DefenseAnimation = CompiledDefenseManifest["animations"][number];
const DEFENSE_PACKAGES = Object.fromEntries(DEFENSE_MANIFEST.animations.map((animation) => [animation.id, animation])) as Record<DefenseReactionPackageId, DefenseAnimation>;

for (const id of ["standing_block", "crouching_block", "light_hit_reaction", "heavy_hit_reaction"] as const) {
  const animation = DEFENSE_PACKAGES[id];
  if (!animation || animation.playbackPolicy.cursorOwner !== "simulation" || animation.gameplayTimingStatus.authoritative || DEFENSE_MANIFEST.deployable) {
    throw new Error(`Invalid non-deployable simulation-owned defense package: ${id}`);
  }
}

function fighter(id: SandboxFighterId, x: number, facing: 1 | -1): SandboxFighterState {
  return {
    id, x, y: 0, vx: 0, vy: 0, facing, grounded: true, state: "idle", stateTick: 0,
    health: SANDBOX_TUNING.health, meter: 0, damageScaling: 1, moveCursor: null, attackConnected: false, groundNormalConnectedHitOrdinals: [], airNormalConnectedHitOrdinals: [], airNormalContactHoldApplied: false, hitstop: 0,
    hitstun: 0, blockstun: 0, blocking: false, crouching: false, reaction: "none",
    defensePackageId: null, defenseCursor: null, defensePackageInstance: 0,
    returnState: "idle", lastPresentationEventId: null,
    forwardWalkTimingProfile: FORWARD_WALK_V2_SELECTED_TIMING,
    standingNormalTimingProfile: STANDING_NORMALS_MOTION_V1_DEFAULT_TIMING,
    crouchingLightTimingProfile: CROUCHING_LIGHT_V4_DEFAULT_TIMING,
    crouchingMediumTimingProfile: CROUCHING_MEDIUM_OPPOSED_SPLIT_SHOT_V6_DEFAULT_TIMING,
    crouchingHeavyTimingProfile: CROUCHING_HEAVY_MOTION_V1_DEFAULT_TIMING,
    presentationRotationZ: 0, presentationScale: 1, presentationRenderOrder: null,
    presentationShadowVisible: true, presentationRootOffsetX: 0, presentationRootOffsetY: 0
  };
}

export function createSwahiliSandbox(seed = 20260714): SwahiliSandboxState {
  const p1 = fighter("p1", -76, 1);
  const p2 = fighter("p2", 76, -1);
  return {
    schemaVersion: "1.0.0-swahili-sandbox",
    ...SWAHILI_SANDBOX_STATUS,
    seed,
    tick: 0,
    stage: { ...SANDBOX_TUNING.stage },
    fighters: { p1, p2 },
    dummyBlockMode: "off",
    dummyCrouching: false,
    counterHitArmed: false,
    previousP1Input: {},
    warnings: [],
    lastEvent: null,
    presentationEvents: [],
    presentationEventLedger: [],
    lastCombatDiagnostic: null,
    commandGrab: {
      active: false,
      simulationTick: 0,
      sourceTick: 0,
      frameIndex: 1,
      sourceId: COMMAND_GRAB_MOTION_V1_FRAMES[0].sourceId,
      role: COMMAND_GRAB_MOTION_V1_FRAMES[0].role,
      victimPose: COMMAND_GRAB_MOTION_V1_FRAMES[0].victimPose,
      attackerStartX: p1.x,
      startingFacing: p1.facing,
      captured: false,
      captureChecked: false,
      damageApplied: false,
      sideSwitchCompleted: false,
      initialVictimX: p2.x,
      victimTrackScale: COMMAND_GRAB_MOTION_V1_REVIEW.sourcePixelsToSimulationUnits,
      launchDistance: 0,
      maxLaunchDistance: 0,
      launchClippedByStage: false,
      launchPhase: "pre_release",
      shotVisualHitRegistered: false,
      shotVisualHitCount: 0,
      result: "pending",
      playbackRate: COMMAND_GRAB_MOTION_V1_REVIEW.playbackRate,
      gameplayValues: COMMAND_GRAB_MOTION_V1_REVIEW.gameplayValues
    },
    dashReview: {
      active: false,
      direction: "forward",
      simulationTick: 0,
      frameIndex: 1,
      sourceId: DASH_REPAIR_V2_FRAMES.forward[0].sourceId,
      role: DASH_REPAIR_V2_FRAMES.forward[0].role,
      startX: p1.x,
      startingFacing: p1.facing,
      intendedDistance: DASH_REPAIR_V2_REVIEW.forward.intendedDistance,
      actualDistance: 0,
      clippedByStageOrPushbox: false,
      result: "idle",
      gameplayValues: DASH_REPAIR_V2_REVIEW.gameplayValues
    },
    jumpFallLandingReview: {
      active: false,
      phase: "idle",
      landingMode: "soft",
      simulationTick: 0,
      frameIndex: 1,
      sourceId: JUMP_FALL_LANDING_V1_FRAMES[0].sourceId,
      role: JUMP_FALL_LANDING_V1_FRAMES[0].role,
      startX: p1.x,
      startingFacing: p1.facing,
      takeoffTick: null,
      apexTick: null,
      landingTick: null,
      peakY: p1.y,
      airborneTicks: 0,
      horizontalDistance: 0,
      launchVelocityX: 0,
      result: "idle",
      gameplayValues: JUMP_FALL_LANDING_V1_REVIEW.gameplayValues
    },
    airMobilityReview: {
      jumpsUsed: 0,
      airDashesUsed: 0,
      airNormalActionsUsed: 0,
      queuedAirNormal: null,
      doubleJumpTriggered: false,
      airDashActive: false,
      airDashDirection: "forward",
      airDashTick: 0,
      airDashStartX: p1.x,
      airDashStartingFacing: p1.facing,
      airDashTravelSign: p1.facing,
      airDashActualDistance: 0,
      resumeVelocityY: 0,
      crossedOpponent: false,
      sideSwitchTick: null,
      result: "idle",
      gameplayValues: AIR_MOBILITY_V1_REVIEW.gameplayValues
    },
    turnSideSwitchReview: {
      active: false,
      simulationTick: 0,
      frameIndex: 1,
      sourceId: TURN_SIDE_SWITCH_V1_EXPOSURES[0].sourceId,
      role: TURN_SIDE_SWITCH_V1_EXPOSURES[0].role,
      rootX: p1.x,
      startingFacing: p1.facing,
      endingFacing: -p1.facing as 1 | -1,
      opponentStartX: p2.x,
      opponentEndX: p2.x,
      opponentProgress: 0,
      facingSwapCount: 0,
      rootDisplacement: 0,
      result: "idle",
      gameplayValues: TURN_SIDE_SWITCH_V1_REVIEW.gameplayValues
    },
    graveFurrow: {
      active: false,
      simulationTick: 0,
      frameIndex: 1,
      sourceId: GRAVE_FURROW_V1_EXPOSURES[0].sourceId,
      role: GRAVE_FURROW_V1_EXPOSURES[0].role,
      startX: p1.x,
      startingFacing: p1.facing,
      actualRootAdvance: 0,
      contactTick: null,
      contactOutcome: null,
      victimLaunched: false,
      result: "idle",
      gameplayValues: GRAVE_FURROW_PLAYTEST_V1.gameplayValues
    },
    forwardWalkV2Diagnostic: {
      timingProfileId: FORWARD_WALK_V2_SELECTED_TIMING,
      motionCurveVersion: FORWARD_WALK_V2_ROOT_CURVE_VERSION,
      cycleTicks: FORWARD_WALK_V2_TIMING_PROFILES[FORWARD_WALK_V2_SELECTED_TIMING].cycleTicks,
      simulationTick: 0,
      artworkFrame: 0,
      sourceId: "idle_00",
      gaitRole: "idle_cycle",
      supportFoot: "screen_left_principal_support",
      swingFoot: "none",
      fighterRoot: p1.x,
      plantedFootWorldPosition: null,
      perTickDisplacement: 0,
      accumulatedDisplacement: 0,
      cycleAccumulatedDisplacement: 0,
      footSkateEstimate: 0,
      peakFootSkateEstimate: 0,
      meanFootSkateEstimate: 0,
      footSkateSamples: 0,
      transitionState: "idle_stable",
      incompleteBackwardWalkWarning: "walk_backward_v2 incomplete: first_passing, first_up_late_swing, and opposite_foot_down_compression are blocked on manual paintovers"
    }
  };
}

export function resetSandboxRound(state: SwahiliSandboxState, preserveDummyMode = true) {
  const mode = state.dummyBlockMode;
  const standingNormalTimingProfile = state.fighters.p1.standingNormalTimingProfile;
  const crouchingLightTimingProfile = state.fighters.p1.crouchingLightTimingProfile;
  const crouchingMediumTimingProfile = state.fighters.p1.crouchingMediumTimingProfile;
  const crouchingHeavyTimingProfile = state.fighters.p1.crouchingHeavyTimingProfile;
  const fresh = createSwahiliSandbox(state.seed);
  if (preserveDummyMode) fresh.dummyBlockMode = mode;
  fresh.fighters.p1.standingNormalTimingProfile = standingNormalTimingProfile;
  fresh.fighters.p1.crouchingLightTimingProfile = crouchingLightTimingProfile;
  fresh.fighters.p2.crouchingLightTimingProfile = crouchingLightTimingProfile;
  fresh.fighters.p1.crouchingMediumTimingProfile = crouchingMediumTimingProfile;
  fresh.fighters.p2.crouchingMediumTimingProfile = crouchingMediumTimingProfile;
  fresh.fighters.p1.crouchingHeavyTimingProfile = crouchingHeavyTimingProfile;
  fresh.fighters.p2.crouchingHeavyTimingProfile = crouchingHeavyTimingProfile;
  Object.assign(state, fresh);
}

function setState(f: SandboxFighterState, next: SandboxStateName) {
  if (f.state !== next) { f.state = next; f.stateTick = 0; }
}

function isJumpLandingState(state: SandboxStateName) {
  return state === "jump_landing_soft_review" || state === "jump_landing_attack_review" || state === "jump_landing_hard_review";
}

function startTurnSideSwitchReview(state: SwahiliSandboxState) {
  const p1 = state.fighters.p1;
  const p2 = state.fighters.p2;
  if (state.turnSideSwitchReview.active || state.commandGrab.active || !p1.grounded || p1.hitstop > 0 || p1.hitstun > 0 || p1.blockstun > 0) return false;
  const startingFacing = p1.facing;
  const endingFacing = -startingFacing as 1 | -1;
  const separation = Math.max(152, Math.abs(p2.x - p1.x));
  clearDefensePackage(p1);
  clearDefensePackage(p2);
  resetPresentation(p1);
  resetPresentation(p2);
  p1.vx = 0;
  p1.vy = 0;
  p1.moveCursor = null;
  p1.attackConnected = false;
  p1.blocking = false;
  p1.crouching = false;
  p2.vx = 0;
  p2.vy = 0;
  p2.blocking = false;
  p2.crouching = false;
  setState(p1, "turn_side_switch_review");
  setState(p2, "idle");
  state.turnSideSwitchReview = {
    active: true,
    simulationTick: 0,
    frameIndex: 1,
    sourceId: TURN_SIDE_SWITCH_V1_EXPOSURES[0].sourceId,
    role: TURN_SIDE_SWITCH_V1_EXPOSURES[0].role,
    rootX: p1.x,
    startingFacing,
    endingFacing,
    opponentStartX: p2.x,
    opponentEndX: clamp(p1.x - startingFacing * separation, state.stage.left, state.stage.right),
    opponentProgress: 0,
    facingSwapCount: 0,
    rootDisplacement: 0,
    result: "playing",
    gameplayValues: TURN_SIDE_SWITCH_V1_REVIEW.gameplayValues
  };
  state.lastEvent = { tick: state.tick, id: "turn_side_switch_v1_started" };
  return true;
}

function progressTurnSideSwitchReview(state: SwahiliSandboxState) {
  const runtime = state.turnSideSwitchReview;
  if (!runtime.active) return;
  const p1 = state.fighters.p1;
  const p2 = state.fighters.p2;
  const sample = turnSideSwitchExposureAtTick(runtime.simulationTick);
  const progress = turnSideSwitchOpponentProgress(runtime.simulationTick);
  runtime.frameIndex = sample.exposure.index;
  runtime.sourceId = sample.exposure.sourceId;
  runtime.role = sample.exposure.role;
  runtime.opponentProgress = progress;
  p1.x = runtime.rootX;
  p1.vx = 0;
  p2.x = runtime.opponentStartX + (runtime.opponentEndX - runtime.opponentStartX) * progress;
  p2.vx = 0;
  const intendedFacing = sample.exposure.facingPhase === "starting" ? runtime.startingFacing : runtime.endingFacing;
  if (p1.facing !== intendedFacing) runtime.facingSwapCount++;
  p1.facing = intendedFacing;
  p2.facing = sign(p1.x - p2.x);
  p1.stateTick++;
  runtime.rootDisplacement = Math.abs(p1.x - runtime.rootX);
  runtime.simulationTick++;
  if (runtime.simulationTick >= turnSideSwitchTotalTicks()) {
    p1.x = runtime.rootX;
    p2.x = runtime.opponentEndX;
    p1.facing = runtime.endingFacing;
    p2.facing = runtime.startingFacing;
    runtime.opponentProgress = 1;
    runtime.rootDisplacement = Math.abs(p1.x - runtime.rootX);
    runtime.active = false;
    runtime.result = "complete";
    setState(p1, "idle");
    state.lastEvent = { tick: state.tick, id: "turn_side_switch_v1_complete" };
  }
}

function startJumpReview(state: SwahiliSandboxState, input: SandboxInputFrame) {
  const f = state.fighters.p1;
  const runtime = state.jumpFallLandingReview;
  clearDefensePackage(f);
  resetPresentation(f);
  f.vx = 0;
  f.vy = 0;
  f.moveCursor = null;
  f.attackConnected = false;
  f.blocking = false;
  f.crouching = false;
  f.grounded = true;
  setState(f, "jump_anticipation_review");
  runtime.active = true;
  runtime.phase = "anticipation";
  runtime.simulationTick = 0;
  runtime.frameIndex = 1;
  runtime.sourceId = JUMP_FALL_LANDING_V1_FRAMES[0].sourceId;
  runtime.role = JUMP_FALL_LANDING_V1_FRAMES[0].role;
  runtime.startX = f.x;
  runtime.startingFacing = f.facing;
  runtime.takeoffTick = null;
  runtime.apexTick = null;
  runtime.landingTick = null;
  runtime.peakY = f.y;
  runtime.airborneTicks = 0;
  runtime.horizontalDistance = 0;
  runtime.launchVelocityX = input.right ? 2.1 : input.left ? -2.1 : 0;
  runtime.result = "playing";
  const air = state.airMobilityReview;
  air.jumpsUsed = 1;
  air.airDashesUsed = 0;
  air.airNormalActionsUsed = 0;
  air.queuedAirNormal = null;
  air.doubleJumpTriggered = false;
  air.airDashActive = false;
  air.airDashDirection = "forward";
  air.airDashTick = 0;
  air.airDashStartX = f.x;
  air.airDashStartingFacing = f.facing;
  air.airDashTravelSign = f.facing;
  air.airDashActualDistance = 0;
  air.resumeVelocityY = 0;
  air.crossedOpponent = false;
  air.sideSwitchTick = null;
  air.result = "idle";
  state.lastEvent = { tick: state.tick, id: `jump_fall_landing_v1_${runtime.landingMode}_started` };
}

function startDoubleJump(state: SwahiliSandboxState) {
  const f = state.fighters.p1;
  const air = state.airMobilityReview;
  if (f.grounded || f.state !== "jump_airborne_review" || air.jumpsUsed !== 1 || air.airDashActive) return false;
  f.vy = AIR_MOBILITY_V1_REVIEW.doubleJumpVelocity;
  air.jumpsUsed = 2;
  air.doubleJumpTriggered = true;
  air.result = "double_jump";
  state.jumpFallLandingReview.phase = "rising";
  state.jumpFallLandingReview.apexTick = null;
  state.lastEvent = { tick: state.tick, id: "air_mobility_v1_double_jump" };
  return true;
}

function startAirDash(state: SwahiliSandboxState, direction: DashReviewDirection) {
  const f = state.fighters.p1;
  const air = state.airMobilityReview;
  if (f.grounded || f.state !== "jump_airborne_review" || air.airDashesUsed >= AIR_MOBILITY_V1_REVIEW.maxAirDashes || air.airDashActive) return false;
  air.airDashesUsed = 1;
  air.airDashActive = true;
  air.airDashDirection = direction;
  air.airDashTick = 0;
  air.airDashStartX = f.x;
  air.airDashStartingFacing = f.facing;
  air.airDashTravelSign = (f.facing * (direction === "forward" ? 1 : -1)) as 1 | -1;
  air.airDashActualDistance = 0;
  air.resumeVelocityY = f.vy;
  air.crossedOpponent = false;
  air.sideSwitchTick = null;
  air.result = "air_dash_playing";
  f.vx = air.airDashTravelSign * airDashDisplacementPerTick();
  f.vy = -SANDBOX_TUNING.movement.gravityPerTick;
  state.lastEvent = { tick: state.tick, id: `air_mobility_v1_air_dash_${direction}` };
  return true;
}

export function setJumpLandingReviewMode(state: SwahiliSandboxState, mode: JumpLandingReviewMode) {
  if (state.jumpFallLandingReview.active) throw new Error("Cannot change jump landing review mode during an active jump");
  state.jumpFallLandingReview.landingMode = mode;
  state.lastEvent = { tick: state.tick, id: `jump_landing_review_mode_${mode}` };
}

function inferReturnState(f: SandboxFighterState): SandboxReturnState {
  return f.crouching || f.state === "crouch" || f.state === "crouching_block" ? "crouch" : "idle";
}

function startDefensePackage(f: SandboxFighterState, id: DefenseReactionPackageId, returnState = inferReturnState(f)) {
  f.defensePackageId = id;
  f.defenseCursor = 0;
  f.defensePackageInstance++;
  f.returnState = returnState;
  f.lastPresentationEventId = null;
}

function clearDefensePackage(f: SandboxFighterState) {
  f.defensePackageId = null;
  f.defenseCursor = null;
  f.lastPresentationEventId = null;
}

export function currentDefensePackage(f: SandboxFighterState) {
  return f.defensePackageId ? DEFENSE_PACKAGES[f.defensePackageId] : null;
}

export function currentDefenseExposure(f: SandboxFighterState) {
  const animation = currentDefensePackage(f);
  if (!animation || f.defenseCursor === null) return null;
  const exposure = animation.exposures.find((item) => f.defenseCursor! >= item.start && f.defenseCursor! < item.start + item.duration) ?? animation.exposures.at(-1)!;
  return { ...exposure, packageTick: f.defenseCursor };
}

export function currentDefenseGrounding(f: SandboxFighterState) {
  const animation = currentDefensePackage(f);
  const exposure = currentDefenseExposure(f);
  return animation && exposure ? animation.groundingTrack.find((item) => item.sourceFrameId === exposure.sourceFrameId) ?? null : null;
}

function emitPresentation(state: SwahiliSandboxState, f: SandboxFighterState, trigger: string) {
  const animation = currentDefensePackage(f);
  if (!animation) return;
  for (const event of animation.presentationTrack.filter((item) => item.payload.trigger === trigger)) {
    const eventId = `${state.tick}:${f.id}:${f.defensePackageInstance}:${event.index}`;
    const deduplicated = state.presentationEventLedger.includes(eventId);
    if (!deduplicated) state.presentationEventLedger.push(eventId);
    const record = {
      tick: state.tick,
      id: "presentation_event",
      packageId: f.defensePackageId!,
      presentationEventId: eventId,
      deduplicated,
      presentationType: event.type,
      presentationProfile: event.payload.profile ?? "unspecified",
      presentationSocket: event.payload.socket ?? "none",
      optional: event.payload.optional === true
    };
    state.presentationEvents.push(record);
    f.lastPresentationEventId = eventId;
  }
}

export function forceDefenseReaction(
  state: SwahiliSandboxState,
  id: SandboxFighterId,
  weight: "light" | "heavy",
  options: { hitstopTicks?: number; hitstunTicks?: number; returnState?: SandboxReturnState } = {}
) {
  const f = state.fighters[id];
  const packageId = `${weight}_hit_reaction` as DefenseReactionPackageId;
  const animation = DEFENSE_PACKAGES[packageId];
  const values = animation.gameplayTimingStatus.candidateValues as { sandboxHitstopTicks?: number; sandboxHitstunTicks?: number };
  const returnState = options.returnState ?? inferReturnState(f);
  startDefensePackage(f, packageId, returnState);
  f.hitstop = options.hitstopTicks ?? values.sandboxHitstopTicks ?? 0;
  f.hitstun = options.hitstunTicks ?? values.sandboxHitstunTicks ?? animation.simulationLength;
  f.blockstun = 0;
  f.blocking = false;
  f.crouching = returnState === "crouch";
  f.reaction = weight;
  setState(f, packageId);
  emitPresentation(state, f, "external_hit_result");
  state.lastEvent = { tick: state.tick, id: `force_${weight}_reaction`, packageId, presentationEventId: f.lastPresentationEventId ?? undefined };
}

function worldRect(f: SandboxFighterState, rect: SandboxRect): SandboxRect {
  return f.facing > 0
    ? { x: f.x + rect.x, y: f.y + rect.y, w: rect.w, h: rect.h }
    : { x: f.x - rect.x - rect.w, y: f.y + rect.y, w: rect.w, h: rect.h };
}

function overlap(a: SandboxRect, b: SandboxRect) {
  return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
}

export function fighterPushbox(f: SandboxFighterState) { return worldRect(f, SANDBOX_TUNING.pushbox); }
export function fighterHurtboxes(f: SandboxFighterState) {
  if (f.state === "command_grab_victim") return [];
  const heavyExtension = f.state === "standing_heavy" && f.moveCursor !== null
    && f.moveCursor >= SANDBOX_TUNING.standingHeavy.active.start
    && f.moveCursor <= SANDBOX_TUNING.standingHeavy.active.end;
  const reacting = f.state === "light_hit_reaction" || f.state === "heavy_hit_reaction" || f.state === "grave_furrow_launch_victim";
  const source = heavyExtension
    ? SANDBOX_TUNING.standingHeavyExtendedHurtboxes
    : reacting
      ? SANDBOX_TUNING.reactionHurtboxes
      : f.crouching
        ? SANDBOX_TUNING.crouchingHurtboxes
        : SANDBOX_TUNING.standingHurtboxes;
  return source.map((rect) => worldRect(f, rect));
}
export function fighterActiveHitboxes(f: SandboxFighterState) {
  const cursor = f.moveCursor;
  if (cursor === null) return [];
  if (f.state === "standing_heavy") {
    if (f.attackConnected) return [];
    if (cursor < SANDBOX_TUNING.standingHeavy.active.start || cursor > SANDBOX_TUNING.standingHeavy.active.end) return [];
    return [worldRect(f, SANDBOX_TUNING.standingHeavy.hitbox)];
  }
  if (f.state === "grave_furrow_review") {
    if (f.attackConnected || !graveFurrowIsActive(cursor)) return [];
    return [worldRect(f, GRAVE_FURROW_PLAYTEST_V1.hitbox)];
  }
  const groundNormal = groundNormalForState(f.state, f.standingNormalTimingProfile, f.crouchingLightTimingProfile, f.crouchingMediumTimingProfile, f.crouchingHeavyTimingProfile);
  if (groundNormal) {
    const hit = groundNormalHitAtTick(groundNormal, cursor);
    if (!hit || f.groundNormalConnectedHitOrdinals.includes(hit.ordinal)) return [];
    return [worldRect(f, hit.hitbox)];
  }
  const airNormal = airNormalForState(f.state);
  if (!airNormal || !airNormalIsActive(airNormal, cursor) || f.airNormalConnectedHitOrdinals.includes(1)) return [];
  return [worldRect(f, airNormal.hitbox)];
}

function applyCommand(state: SwahiliSandboxState, command: SandboxInputFrame["command"]) {
  if (!command) return false;
  if (command === "reset_round") { resetSandboxRound(state); state.lastEvent = { tick: state.tick, id: "round_reset" }; return true; }
  if (command === "play_turn_side_switch") return startTurnSideSwitchReview(state);
  if (command === "switch_sides") {
    const p1x = state.fighters.p1.x;
    state.fighters.p1.x = state.fighters.p2.x;
    state.fighters.p2.x = p1x;
    state.fighters.p1.facing = sign(state.fighters.p2.x - state.fighters.p1.x);
    state.fighters.p2.facing = sign(state.fighters.p1.x - state.fighters.p2.x);
    state.lastEvent = { tick: state.tick, id: "side_switch" };
    return false;
  }
  if (command === "toggle_dummy_block") {
    const modes = ["off", "standing", "crouching"] as const;
    state.dummyBlockMode = modes[(modes.indexOf(state.dummyBlockMode) + 1) % modes.length];
    state.lastEvent = { tick: state.tick, id: `dummy_block_${state.dummyBlockMode}` };
    return false;
  }
  if (command === "toggle_counter_hit") {
    state.counterHitArmed = !state.counterHitArmed;
    state.lastEvent = { tick: state.tick, id: `counter_hit_${state.counterHitArmed ? "armed" : "off"}` };
    return false;
  }
  const p2 = state.fighters.p2;
  forceDefenseReaction(state, "p2", command === "force_light_reaction" ? "light" : "heavy");
  return false;
}

function updateFacing(state: SwahiliSandboxState) {
  const { p1, p2 } = state.fighters;
  if (state.commandGrab.active) return;
  const p1FacingLocked = p1.state === "standing_heavy" || p1.state === "grave_furrow_review" || isGroundNormalState(p1.state) || isAirNormalState(p1.state) || p1.state === "dash_forward_review" || p1.state === "dash_backward_review" || p1.state === "turn_side_switch_review";
  if (!p1FacingLocked && p1.hitstun === 0 && p1.blockstun === 0) p1.facing = sign(p2.x - p1.x);
  if (p2.hitstun === 0 && p2.blockstun === 0) p2.facing = sign(p1.x - p2.x);
}

function resetPresentation(f: SandboxFighterState) {
  f.presentationRotationZ = 0;
  f.presentationScale = 1;
  f.presentationRenderOrder = null;
  f.presentationShadowVisible = true;
  f.presentationRootOffsetX = 0;
  f.presentationRootOffsetY = 0;
}

function startGroundNormal(state: SwahiliSandboxState, id: GroundNormalPlaytestId) {
  const f = state.fighters.p1;
  const definition = groundNormalForId(id, f.standingNormalTimingProfile, f.crouchingLightTimingProfile, f.crouchingMediumTimingProfile, f.crouchingHeavyTimingProfile);
  clearDefensePackage(f);
  resetPresentation(f);
  f.vx = 0;
  f.moveCursor = 0;
  f.attackConnected = false;
  f.groundNormalConnectedHitOrdinals = [];
  f.blocking = false;
  f.crouching = definition.crouching;
  setState(f, definition.state);
  state.lastEvent = { tick: state.tick, id: `ground_normal_${id}_started`, outcome: "whiff" };
}

function startGraveFurrow(state: SwahiliSandboxState) {
  const f = state.fighters.p1;
  const first = GRAVE_FURROW_V1_EXPOSURES[0];
  clearDefensePackage(f);
  resetPresentation(f);
  f.vx = 0;
  f.vy = 0;
  f.moveCursor = 0;
  f.attackConnected = false;
  f.blocking = false;
  f.crouching = false;
  f.grounded = true;
  setState(f, "grave_furrow_review");
  state.graveFurrow = {
    active: true,
    simulationTick: 0,
    frameIndex: first.index,
    sourceId: first.sourceId,
    role: first.role,
    startX: f.x,
    startingFacing: f.facing,
    actualRootAdvance: 0,
    contactTick: null,
    contactOutcome: null,
    victimLaunched: false,
    result: "playing",
    gameplayValues: GRAVE_FURROW_PLAYTEST_V1.gameplayValues
  };
  state.lastEvent = { tick: state.tick, id: "grave_furrow_v1_started", outcome: "whiff" };
}

function startAirNormal(state: SwahiliSandboxState, id: AirNormalPlaytestId) {
  const f = state.fighters.p1;
  const definition = airNormalForId(id);
  const air = state.airMobilityReview;
  if (f.grounded || air.airDashActive || air.airNormalActionsUsed >= AIR_NORMALS_PLAYTEST_V1_MAX_ACTIONS) return false;
  clearDefensePackage(f);
  resetPresentation(f);
  f.moveCursor = 0;
  f.attackConnected = false;
  f.airNormalConnectedHitOrdinals = [];
  f.airNormalContactHoldApplied = false;
  f.blocking = false;
  f.crouching = false;
  setState(f, definition.state);
  air.queuedAirNormal = null;
  air.airNormalActionsUsed = (air.airNormalActionsUsed + 1) as 1 | 2 | 3;
  state.jumpFallLandingReview.landingMode = "attack";
  state.lastEvent = { tick: state.tick, id: `air_normal_${id}_started`, outcome: "whiff" };
  return true;
}

function startDash(state: SwahiliSandboxState, direction: DashReviewDirection) {
  const f = state.fighters.p1;
  const first = DASH_REPAIR_V2_FRAMES[direction][0];
  clearDefensePackage(f);
  resetPresentation(f);
  f.vx = 0;
  f.vy = 0;
  f.moveCursor = 0;
  f.attackConnected = false;
  f.blocking = false;
  f.crouching = false;
  f.grounded = true;
  setState(f, direction === "forward" ? "dash_forward_review" : "dash_backward_review");
  state.dashReview = {
    active: true,
    direction,
    simulationTick: 0,
    frameIndex: first.index,
    sourceId: first.sourceId,
    role: first.role,
    startX: f.x,
    startingFacing: f.facing,
    intendedDistance: DASH_REPAIR_V2_REVIEW[direction].intendedDistance,
    actualDistance: 0,
    clippedByStageOrPushbox: false,
    result: "playing",
    gameplayValues: DASH_REPAIR_V2_REVIEW.gameplayValues
  };
  state.lastEvent = { tick: state.tick, id: `dash_${direction}_review_started` };
}

function startCommandGrab(state: SwahiliSandboxState) {
  const attacker = state.fighters.p1;
  const victim = state.fighters.p2;
  const separation = Math.abs(victim.x - attacker.x);
  clearDefensePackage(attacker);
  resetPresentation(attacker);
  attacker.vx = 0;
  attacker.vy = 0;
  attacker.moveCursor = 0;
  attacker.attackConnected = false;
  attacker.blocking = false;
  attacker.crouching = false;
  setState(attacker, "command_grab_review");
  state.commandGrab = {
    active: true,
    simulationTick: 0,
    sourceTick: 0,
    frameIndex: 1,
    sourceId: COMMAND_GRAB_MOTION_V1_FRAMES[0].sourceId,
    role: COMMAND_GRAB_MOTION_V1_FRAMES[0].role,
    victimPose: COMMAND_GRAB_MOTION_V1_FRAMES[0].victimPose,
    attackerStartX: attacker.x,
    startingFacing: attacker.facing,
    captured: false,
    captureChecked: false,
    damageApplied: false,
    sideSwitchCompleted: false,
    initialVictimX: victim.x,
    victimTrackScale: clamp(separation / (1520 - 768), 0.14, 0.22),
    launchDistance: 0,
    maxLaunchDistance: 0,
    launchClippedByStage: false,
    launchPhase: "pre_release",
    shotVisualHitRegistered: false,
    shotVisualHitCount: 0,
    result: "pending",
    playbackRate: COMMAND_GRAB_MOTION_V1_REVIEW.playbackRate,
    gameplayValues: COMMAND_GRAB_MOTION_V1_REVIEW.gameplayValues
  };
  state.lastEvent = { tick: state.tick, id: "command_grab_motion_v1_started" };
}

function finishCommandGrab(state: SwahiliSandboxState) {
  const runtime = state.commandGrab;
  const attacker = state.fighters.p1;
  const victim = state.fighters.p2;
  runtime.active = false;
  attacker.moveCursor = null;
  attacker.attackConnected = false;
  attacker.vx = 0;
  attacker.vy = 0;
  resetPresentation(attacker);
  setState(attacker, "idle");
  if (runtime.captured) {
    victim.moveCursor = 0;
    victim.vx = 0;
    victim.vy = 0;
    victim.y = 0;
    victim.grounded = true;
    victim.presentationRotationZ = 0;
    victim.presentationRenderOrder = 30;
    victim.presentationShadowVisible = true;
    setState(victim, "command_grab_downed");
    victim.stateTick = 0;
  }
  state.lastEvent = { tick: state.tick, id: "command_grab_motion_v1_complete", outcome: runtime.result === "hit" ? "hit" : "whiff" };
}

function progressCommandGrab(state: SwahiliSandboxState) {
  const runtime = state.commandGrab;
  if (!runtime.active) return;
  if (runtime.simulationTick >= COMMAND_GRAB_MOTION_V1_REVIEW.simulationTotalTicks) {
    finishCommandGrab(state);
    return;
  }
  const attacker = state.fighters.p1;
  const victim = state.fighters.p2;
  const sourceTick = commandGrabSourceTickAtSimulationTick(runtime.simulationTick);
  const frame = commandGrabFrameAtSourceTick(sourceTick);
  runtime.sourceTick = sourceTick;
  runtime.frameIndex = frame.index;
  runtime.sourceId = frame.sourceId;
  runtime.role = frame.role;
  runtime.victimPose = frame.victimPose;
  attacker.moveCursor = sourceTick;
  attacker.stateTick = runtime.simulationTick;
  attacker.facing = runtime.startingFacing;
  attacker.x = runtime.attackerStartX + runtime.startingFacing * (frame.attackerRoot[0] - 768) * COMMAND_GRAB_MOTION_V1_REVIEW.sourcePixelsToSimulationUnits;
  attacker.y = 0;
  attacker.grounded = true;
  attacker.presentationRootOffsetX = -runtime.startingFacing * (frame.attackerRoot[0] - 768) * COMMAND_GRAB_MOTION_V1_REVIEW.sourcePixelsToSimulationUnits;
  attacker.presentationRootOffsetY = -(frame.attackerRoot[1] - 1408) * COMMAND_GRAB_MOTION_V1_REVIEW.sourcePixelsToSimulationUnits;

  if (!runtime.captureChecked && sourceTick >= COMMAND_GRAB_MOTION_V1_REVIEW.captureSourceTick) {
    runtime.captureChecked = true;
    const signedSeparation = (victim.x - attacker.x) * runtime.startingFacing;
    runtime.captured = signedSeparation > 0 && signedSeparation <= COMMAND_GRAB_MOTION_V1_REVIEW.captureRange && Math.abs(victim.y - attacker.y) <= 45;
    runtime.result = runtime.captured ? "hit" : "whiff";
    attacker.attackConnected = runtime.captured;
    if (runtime.captured) {
      clearDefensePackage(victim);
      victim.hitstop = 0;
      victim.hitstun = 0;
      victim.blockstun = 0;
      victim.blocking = false;
      victim.crouching = false;
      victim.reaction = "heavy";
      victim.vx = 0;
      victim.vy = 0;
      victim.moveCursor = sourceTick;
      setState(victim, "command_grab_victim");
      state.lastEvent = { tick: state.tick, id: "command_grab_hook_capture", outcome: "hit" };
    } else {
      state.lastEvent = { tick: state.tick, id: "command_grab_hook_whiff", outcome: "whiff" };
    }
  }

  if (runtime.captured) {
    const pose = frame.victimPose;
    const victimFallFrame = commandGrabVictimFallFrameForPose(pose);
    const victimRoot = victimFallFrame?.victimRoot ?? frame.victimRoot;
    const farLaunchPoint = commandGrabFarLaunchPointAtSourceTick(sourceTick);
    victim.state = sourceTick >= COMMAND_GRAB_MOTION_V1_REVIEW.landingSourceTick ? "command_grab_downed" : "command_grab_victim";
    victim.stateTick = runtime.simulationTick;
    victim.moveCursor = sourceTick;
    victim.facing = commandGrabVictimFacingForPose(pose, runtime.startingFacing);
    if (farLaunchPoint) {
      const desiredX = runtime.attackerStartX - runtime.startingFacing * farLaunchPoint.oppositeSideDistance;
      const boundedX = clamp(
        desiredX,
        state.stage.left + COMMAND_GRAB_FINISHER_REVIEW_V1.launch.stageMargin,
        state.stage.right - COMMAND_GRAB_FINISHER_REVIEW_V1.launch.stageMargin
      );
      victim.x = boundedX;
      victim.y = farLaunchPoint.victimY;
      victim.grounded = farLaunchPoint.victimY >= 0;
      runtime.launchClippedByStage ||= Math.abs(desiredX - boundedX) > 0.0001;
      runtime.launchPhase = farLaunchPoint.phase;
    } else {
      victim.x = runtime.attackerStartX + runtime.startingFacing * (victimRoot[0] - 768) * runtime.victimTrackScale;
      victim.y = (victimRoot[1] - 1408) * runtime.victimTrackScale;
      victim.grounded = victimRoot[1] >= 1408;
      runtime.launchPhase = "pre_release";
    }
    runtime.launchDistance = Math.abs(victim.x - attacker.x);
    runtime.maxLaunchDistance = Math.max(runtime.maxLaunchDistance, runtime.launchDistance);
    victim.presentationRotationZ = 0;
    victim.presentationScale = 0.94;
    victim.presentationRenderOrder = sourceTick < 57 ? 32 : 30;
    victim.presentationShadowVisible = victim.grounded;
    victim.presentationRootOffsetX = 0;
    victim.presentationRootOffsetY = 0;
    if (!runtime.sideSwitchCompleted && (victim.x - attacker.x) * runtime.startingFacing < 0) {
      runtime.sideSwitchCompleted = true;
      state.lastEvent = { tick: state.tick, id: "command_grab_side_switch_completed", outcome: "hit" };
    }
    if (!runtime.damageApplied && sourceTick >= COMMAND_GRAB_MOTION_V1_REVIEW.shotSourceTick) {
      runtime.damageApplied = true;
      runtime.shotVisualHitRegistered = true;
      runtime.shotVisualHitCount = 1;
      victim.health = Math.max(0, victim.health - COMMAND_GRAB_MOTION_V1_REVIEW.damage);
      state.lastEvent = { tick: state.tick, id: "command_grab_finishing_shot", outcome: "hit" };
    }
  }
  runtime.simulationTick++;
}

function updateP1Control(state: SwahiliSandboxState, input: SandboxInputFrame) {
  const f = state.fighters.p1;
  if (f.hitstop > 0 || f.hitstun > 0 || f.blockstun > 0) return;
  if (f.state === "grave_furrow_review" && f.moveCursor !== null) {
    f.facing = state.graveFurrow.startingFacing;
    f.vx = f.facing * graveFurrowRootAdvancePerTick(f.moveCursor);
    return;
  }
  if (f.state === "standing_heavy" || isGroundNormalState(f.state) || state.commandGrab.active) return;
  if (state.turnSideSwitchReview.active || f.state === "turn_side_switch_review") return;
  if (f.defensePackageId === "light_hit_reaction" || f.defensePackageId === "heavy_hit_reaction") return;
  if ((f.state === "dash_forward_review" || f.state === "dash_backward_review") && f.moveCursor !== null) {
    const runtime = state.dashReview;
    const travelSign = runtime.startingFacing * (runtime.direction === "forward" ? 1 : -1);
    f.facing = runtime.startingFacing;
    f.vx = travelSign * dashDisplacementPerTick(runtime.direction, f.moveCursor);
    return;
  }
  const lightPressed = !!input.light && !state.previousP1Input.light;
  const mediumPressed = !!input.medium && !state.previousP1Input.medium;
  const heavyPressed = !!input.heavy && !state.previousP1Input.heavy;
  const grabPressed = !!input.grab && !state.previousP1Input.grab;
  const commandGrabPressed = !!input.commandGrab && !state.previousP1Input.commandGrab;
  const dashPressed = !!input.dash && !state.previousP1Input.dash;
  const jumpPressed = !!input.up && !state.previousP1Input.up;
  const graveFurrowPressed = (!!input.graveFurrow && !state.previousP1Input.graveFurrow) || (heavyPressed && !!input.up);
  const requestedAirNormal: AirNormalPlaytestId | null = lightPressed
    ? "air_light"
    : mediumPressed
      ? "air_medium"
      : heavyPressed
        ? "air_heavy"
        : null;
  if (f.state === "jump_anticipation_review") {
    if (requestedAirNormal) {
      state.airMobilityReview.queuedAirNormal = requestedAirNormal;
      state.lastEvent = { tick: state.tick, id: `air_normal_${requestedAirNormal}_buffered_during_jump_anticipation` };
    }
    return;
  }
  if (isJumpLandingState(f.state)) return;
  if (f.grounded && graveFurrowPressed) {
    startGraveFurrow(state);
    return;
  }
  if (f.grounded && jumpPressed) {
    startJumpReview(state, input);
    if (requestedAirNormal) {
      state.airMobilityReview.queuedAirNormal = requestedAirNormal;
      state.lastEvent = { tick: state.tick, id: `air_normal_${requestedAirNormal}_buffered_with_jump_start` };
    }
    return;
  }
  if (commandGrabPressed && f.grounded) {
    startCommandGrab(state); return;
  }
  if (grabPressed && f.grounded) {
    f.vx = 0; f.moveCursor = null; f.attackConnected = false; f.blocking = false; f.crouching = false;
    setState(f, "universal_grab_review"); state.lastEvent = { tick: state.tick, id: "universal_grab_transition_review_started" }; return;
  }
  if ((lightPressed || mediumPressed || heavyPressed) && f.grounded) {
    if (input.down) {
      startGroundNormal(state, lightPressed ? "crouching_light" : mediumPressed ? "crouching_medium" : "crouching_heavy");
      return;
    }
    if (lightPressed || mediumPressed) {
      startGroundNormal(state, lightPressed ? "standing_light" : "standing_medium");
      return;
    }
  }
  if (heavyPressed && f.grounded) {
    f.vx = 0; f.moveCursor = 0; f.attackConnected = false; f.blocking = false; f.crouching = false;
    setState(f, "standing_heavy"); state.lastEvent = { tick: state.tick, id: "standing_heavy_started", outcome: "whiff" }; return;
  }
  if (!f.grounded) {
    const air = state.airMobilityReview;
    const requestedOrQueuedAirNormal = requestedAirNormal ?? air.queuedAirNormal;
    const currentAirNormal = airNormalForState(f.state);
    if (requestedOrQueuedAirNormal && (!currentAirNormal || (f.attackConnected && currentAirNormal.cancelOnContact.includes(requestedOrQueuedAirNormal)))) {
      if (startAirNormal(state, requestedOrQueuedAirNormal)) return;
    }
    if (currentAirNormal) {
      const direction = input.right ? 1 : input.left ? -1 : 0;
      f.vx = direction * 2.1;
      return;
    }
    if (air.airDashActive) {
      f.vx = air.airDashTravelSign * airDashDisplacementPerTick();
      f.vy = -SANDBOX_TUNING.movement.gravityPerTick;
      return;
    }
    if (jumpPressed && startDoubleJump(state)) return;
    if (dashPressed) {
      const requestedDirection = input.right ? 1 : input.left ? -1 : f.facing;
      if (startAirDash(state, requestedDirection === f.facing ? "forward" : "backward")) return;
    }
    const direction = input.right ? 1 : input.left ? -1 : 0;
    f.vx = direction * 2.1;
    setState(f, "jump_airborne_review");
    return;
  }

  if (dashPressed) {
    const requestedDirection = input.right ? 1 : input.left ? -1 : f.facing;
    startDash(state, requestedDirection === f.facing ? "forward" : "backward");
    return;
  }

  const blockPackage = f.defensePackageId === "standing_block" || f.defensePackageId === "crouching_block";
  f.blocking = !!input.block;
  f.crouching = !!input.down;
  if (blockPackage) {
    f.vx = 0;
    const requestedPackage: DefenseReactionPackageId = input.down ? "crouching_block" : "standing_block";
    if (input.block && requestedPackage && requestedPackage !== f.defensePackageId) startDefensePackage(f, requestedPackage, input.down ? "crouch" : "idle");
    const crouchingPackage = f.defensePackageId === "crouching_block";
    f.crouching = crouchingPackage;
    setState(f, crouchingPackage ? "crouching_block" : "standing_block");
    return;
  }
  if (f.blocking) {
    f.vx = 0;
    const packageId = f.crouching ? "crouching_block" : "standing_block";
    startDefensePackage(f, packageId, f.crouching ? "crouch" : "idle");
    setState(f, packageId);
    return;
  }
  if (f.crouching) { f.vx = 0; setState(f, "crouch"); return; }

  const direction = input.right ? 1 : input.left ? -1 : 0;
  if (!direction) { f.vx = 0; setState(f, "idle"); return; }
  const movingForward = direction === f.facing;
  setState(f, movingForward ? "walk_forward" : "walk_backward");
  f.vx = direction * (movingForward
    ? forwardWalkV2DisplacementPerTick(f.stateTick, f.forwardWalkTimingProfile, SANDBOX_TUNING.movement.walkForwardPerTick)
    : SANDBOX_TUNING.movement.walkBackwardPerTick);
}

function updateDummy(state: SwahiliSandboxState) {
  const f = state.fighters.p2;
  if (f.state === "command_grab_victim" || f.state === "command_grab_downed" || f.state === "grave_furrow_launch_victim") return;
  if (f.hitstop > 0 || f.hitstun > 0 || f.blockstun > 0) return;
  if (f.defensePackageId === "light_hit_reaction" || f.defensePackageId === "heavy_hit_reaction") return;
  f.vx = 0;
  f.blocking = state.dummyBlockMode !== "off";
  f.crouching = state.dummyBlockMode === "crouching" || state.dummyCrouching;
  f.reaction = "none";
  const blockPackage = f.defensePackageId === "standing_block" || f.defensePackageId === "crouching_block";
  if (f.blocking && !blockPackage) startDefensePackage(f, f.crouching ? "crouching_block" : "standing_block", f.crouching ? "crouch" : "idle");
  if (blockPackage || f.blocking) setState(f, f.defensePackageId === "crouching_block" ? "crouching_block" : "standing_block");
  else setState(f, "idle");
}

function integrate(state: SwahiliSandboxState, frozenAtStart: Record<SandboxFighterId, boolean>) {
  for (const id of ["p1", "p2"] as const) {
    const f = state.fighters[id];
    if (frozenAtStart[id]) continue;
    if (!f.grounded) {
      f.vy += SANDBOX_TUNING.movement.gravityPerTick;
      f.x += f.vx; f.y += f.vy;
      if (f.y < state.stage.ceilingY) { f.y = state.stage.ceilingY; if (f.vy < 0) f.vy = 0; }
      if (f.y >= state.stage.groundY) {
        f.y = state.stage.groundY; f.vy = 0; f.vx = 0; f.grounded = true;
        if (id === "p1" && (f.state === "jump_airborne_review" || isAirNormalState(f.state)) && state.jumpFallLandingReview.active) {
          const landingMode: JumpLandingReviewMode = isAirNormalState(f.state) ? "attack" : state.jumpFallLandingReview.landingMode;
          state.airMobilityReview.airDashActive = false;
          state.airMobilityReview.queuedAirNormal = null;
          state.airMobilityReview.airDashActualDistance = Math.abs(f.x - state.airMobilityReview.airDashStartX);
          state.airMobilityReview.result = "landed";
          state.jumpFallLandingReview.landingMode = landingMode;
          f.moveCursor = null;
          f.attackConnected = false;
          f.airNormalConnectedHitOrdinals = [];
          f.airNormalContactHoldApplied = false;
          setState(f, jumpLandingState(landingMode));
          state.jumpFallLandingReview.phase = "landing";
          state.jumpFallLandingReview.landingTick = state.tick;
          state.lastEvent = { tick: state.tick, id: `jump_fall_landing_v1_${landingMode}_contact` };
        } else if (id === "p2" && f.state === "grave_furrow_launch_victim") {
          f.moveCursor = 0;
          f.reaction = "heavy";
          setState(f, "command_grab_downed");
          state.lastEvent = { tick: state.tick, id: "grave_furrow_v1_knockdown", outcome: "hit" };
        } else {
          setState(f, "idle");
        }
      }
    } else {
      f.y = state.stage.groundY; f.x += f.vx;
    }
    f.x = clamp(f.x, state.stage.left, state.stage.right);
  }
}

function resolvePushboxes(state: SwahiliSandboxState, frozenAtStart: Record<SandboxFighterId, boolean>) {
  if (frozenAtStart.p1 || frozenAtStart.p2) return;
  const { p1, p2 } = state.fighters;
  const a = fighterPushbox(p1), b = fighterPushbox(p2);
  if (!overlap(a, b)) return;
  const depth = Math.min(a.x + a.w - b.x, b.x + b.w - a.x);
  const split = depth / 2;
  if (p1.x <= p2.x) { p1.x -= split; p2.x += split; } else { p1.x += split; p2.x -= split; }
  p1.x = clamp(p1.x, state.stage.left, state.stage.right);
  p2.x = clamp(p2.x, state.stage.left, state.stage.right);
}

function resolveStandingHeavy(state: SwahiliSandboxState, frozenAtStart: Record<SandboxFighterId, boolean>) {
  const attacker = state.fighters.p1, defender = state.fighters.p2;
  if (frozenAtStart.p1 || attacker.state !== "standing_heavy" || attacker.moveCursor === null || attacker.attackConnected) return;
  const hitboxes = fighterActiveHitboxes(attacker);
  if (!hitboxes.some((hitbox) => fighterHurtboxes(defender).some((hurtbox) => overlap(hitbox, hurtbox)))) return;
  const contactTick = attacker.moveCursor;
  const contactHitbox = hitboxes[0];
  const contactHurtboxes = fighterHurtboxes(defender);
  const rootSeparation = Math.abs(defender.x - attacker.x);
  const scalingBefore = attacker.damageScaling;
  attacker.attackConnected = true;
  const blocked = defender.blocking;
  const counterHit = !blocked && state.counterHitArmed;
  const freeze = blocked ? SANDBOX_TUNING.standingHeavy.hitstop.block : SANDBOX_TUNING.standingHeavy.hitstop.hit;
  attacker.hitstop = freeze; defender.hitstop = freeze;
  const remainingRecovery = SANDBOX_TUNING.standingHeavy.returnToIdleTick - contactTick;
  const outcome = blocked ? "block" : counterHit ? "counter_hit" : "hit";
  const hitstun = counterHit ? SANDBOX_TUNING.standingHeavy.counterHit.hitstun : SANDBOX_TUNING.standingHeavy.hitstun;
  const blockstun = blocked ? SANDBOX_TUNING.standingHeavy.blockstun : 0;
  const resultingAdvantage = (blocked ? blockstun : hitstun) - remainingRecovery;
  const meterGain = blocked ? SANDBOX_TUNING.standingHeavy.meterGain.block : SANDBOX_TUNING.standingHeavy.meterGain.hit;
  const damageBase = counterHit ? SANDBOX_TUNING.standingHeavy.counterHit.damage : SANDBOX_TUNING.standingHeavy.damage;
  const damageApplied = blocked ? SANDBOX_TUNING.standingHeavy.chipDamage : Math.round(damageBase * scalingBefore);
  const scalingAfter = blocked
    ? scalingBefore
    : Math.max(SANDBOX_TUNING.standingHeavy.damageScaling.minimumMultiplier, scalingBefore - SANDBOX_TUNING.standingHeavy.damageScaling.postHitStep);
  attacker.meter += meterGain;
  attacker.damageScaling = scalingAfter;
  const diagnostic: SandboxCombatDiagnostic = {
    profileId: SANDBOX_TUNING.standingHeavy.id,
    approval: SANDBOX_TUNING.standingHeavy.approval,
    moveTick: contactTick,
    contactTick,
    outcome,
    resultingAdvantage,
    remainingRecovery,
    hitstop: freeze,
    hitstun: blocked ? 0 : hitstun,
    blockstun,
    pushbackPerTick: blocked ? SANDBOX_TUNING.standingHeavy.blockPushbackPerTick : SANDBOX_TUNING.standingHeavy.hitKnockbackPerTick,
    meterGain,
    scalingBefore,
    scalingAfter,
    damageApplied,
    rootSeparation,
    hitbox: contactHitbox,
    defenderHurtboxes: contactHurtboxes,
    presentationEvents: SANDBOX_TUNING.standingHeavy.presentationEvents
  };
  state.lastCombatDiagnostic = diagnostic;
  state.counterHitArmed = false;
  if (blocked) {
    defender.blockstun = SANDBOX_TUNING.standingHeavy.blockstun;
    defender.hitstun = 0; defender.reaction = "none"; defender.vx = attacker.facing * SANDBOX_TUNING.standingHeavy.blockPushbackPerTick;
    if (defender.defensePackageId !== "standing_block" && defender.defensePackageId !== "crouching_block") startDefensePackage(defender, defender.crouching ? "crouching_block" : "standing_block", defender.crouching ? "crouch" : "idle");
    setState(defender, defender.crouching ? "crouching_block" : "standing_block");
    emitPresentation(state, defender, "external_block_contact");
    state.lastEvent = { tick: state.tick, id: "standing_heavy_contact", outcome: "block", packageId: defender.defensePackageId ?? undefined, presentationEventId: defender.lastPresentationEventId ?? undefined };
  } else {
    defender.health = Math.max(0, defender.health - damageApplied);
    forceDefenseReaction(state, "p2", "heavy", { hitstopTicks: freeze, hitstunTicks: hitstun, returnState: "idle" });
    defender.vx = attacker.facing * SANDBOX_TUNING.standingHeavy.hitKnockbackPerTick;
    state.lastEvent = { tick: state.tick, id: "standing_heavy_contact", outcome, packageId: "heavy_hit_reaction", presentationEventId: defender.lastPresentationEventId ?? undefined };
  }
}

function resolveGraveFurrow(state: SwahiliSandboxState, frozenAtStart: Record<SandboxFighterId, boolean>) {
  const attacker = state.fighters.p1;
  const defender = state.fighters.p2;
  if (frozenAtStart.p1 || attacker.state !== "grave_furrow_review" || attacker.moveCursor === null || attacker.attackConnected) return;
  const hitboxes = fighterActiveHitboxes(attacker);
  const hurtboxes = fighterHurtboxes(defender);
  if (!hitboxes.some((hitbox) => hurtboxes.some((hurtbox) => overlap(hitbox, hurtbox)))) return;

  attacker.attackConnected = true;
  const blocked = defender.blocking;
  const outcome = blocked ? "block" : "hit";
  const freeze = blocked ? GRAVE_FURROW_PLAYTEST_V1.hitstop.block : GRAVE_FURROW_PLAYTEST_V1.hitstop.hit;
  attacker.hitstop = freeze;
  defender.hitstop = freeze;
  state.graveFurrow.contactTick = state.tick;
  state.graveFurrow.contactOutcome = outcome;
  state.graveFurrow.result = outcome;

  if (blocked) {
    defender.blockstun = GRAVE_FURROW_PLAYTEST_V1.blockstun;
    defender.hitstun = 0;
    defender.vx = attacker.facing * GRAVE_FURROW_PLAYTEST_V1.blockPushbackPerTick;
    if (defender.defensePackageId !== "standing_block" && defender.defensePackageId !== "crouching_block") {
      startDefensePackage(defender, defender.crouching ? "crouching_block" : "standing_block", defender.crouching ? "crouch" : "idle");
    }
    setState(defender, defender.crouching ? "crouching_block" : "standing_block");
    emitPresentation(state, defender, "external_block_contact");
  } else {
    clearDefensePackage(defender);
    resetPresentation(defender);
    defender.health = Math.max(0, defender.health - GRAVE_FURROW_PLAYTEST_V1.damage);
    defender.blocking = false;
    defender.crouching = false;
    defender.reaction = "heavy";
    defender.hitstun = 0;
    defender.blockstun = 0;
    defender.grounded = false;
    defender.vx = attacker.facing * GRAVE_FURROW_PLAYTEST_V1.victimLaunchVelocityX;
    defender.vy = GRAVE_FURROW_PLAYTEST_V1.victimLaunchVelocityY;
    defender.moveCursor = 0;
    setState(defender, "grave_furrow_launch_victim");
    state.graveFurrow.victimLaunched = true;
  }
  state.lastEvent = { tick: state.tick, id: "grave_furrow_v1_contact", outcome, visibleImpactCount: 1 };
}

function resolveGroundNormal(state: SwahiliSandboxState, frozenAtStart: Record<SandboxFighterId, boolean>) {
  const attacker = state.fighters.p1;
  const defender = state.fighters.p2;
  const definition = groundNormalForState(attacker.state, attacker.standingNormalTimingProfile, attacker.crouchingLightTimingProfile, attacker.crouchingMediumTimingProfile, attacker.crouchingHeavyTimingProfile);
  if (frozenAtStart.p1 || !definition || attacker.moveCursor === null) return;
  const hit = groundNormalHitAtTick(definition, attacker.moveCursor);
  if (!hit || attacker.groundNormalConnectedHitOrdinals.includes(hit.ordinal)) return;
  const hitboxes = fighterActiveHitboxes(attacker);
  const hurtboxes = fighterHurtboxes(defender);
  if (!hitboxes.some((hitbox) => hurtboxes.some((hurtbox) => overlap(hitbox, hurtbox)))) return;

  attacker.attackConnected = true;
  attacker.groundNormalConnectedHitOrdinals.push(hit.ordinal);
  const blocked = defender.blocking;
  const counterHit = !blocked && state.counterHitArmed;
  const outcome = blocked ? "block" : counterHit ? "counter_hit" : "hit";
  const hitstop = hit.hitstop;
  attacker.hitstop = hitstop;
  defender.hitstop = hitstop;
  state.counterHitArmed = false;

  if (blocked) {
    defender.blockstun = hit.blockstun;
    defender.hitstun = 0;
    defender.reaction = "none";
    defender.vx = attacker.facing * hit.blockPushbackPerTick;
    if (defender.defensePackageId !== "standing_block" && defender.defensePackageId !== "crouching_block") {
      startDefensePackage(defender, defender.crouching ? "crouching_block" : "standing_block", defender.crouching ? "crouch" : "idle");
    }
    setState(defender, defender.crouching ? "crouching_block" : "standing_block");
    emitPresentation(state, defender, "external_block_contact");
  } else {
    const damage = Math.round(hit.damage * attacker.damageScaling);
    defender.health = Math.max(0, defender.health - damage);
    forceDefenseReaction(state, "p2", definition.reaction, {
      hitstopTicks: hitstop,
      hitstunTicks: hit.hitstun,
      returnState: "idle"
    });
    defender.vx = attacker.facing * hit.hitKnockbackPerTick;
  }
  state.lastEvent = {
    tick: state.tick,
    id: definition.hits.length > 1
      ? `ground_normal_${definition.id}_contact_${hit.ordinal}`
      : `ground_normal_${definition.id}_contact`,
    outcome,
    hitOrdinal: hit.ordinal,
    visibleImpactCount: hit.visibleImpactCount,
    packageId: defender.defensePackageId ?? undefined,
    presentationEventId: defender.lastPresentationEventId ?? undefined
  };
}

function resolveAirNormal(state: SwahiliSandboxState, frozenAtStart: Record<SandboxFighterId, boolean>) {
  const attacker = state.fighters.p1;
  const defender = state.fighters.p2;
  const definition = airNormalForState(attacker.state);
  if (frozenAtStart.p1 || !definition || attacker.moveCursor === null || !airNormalIsActive(definition, attacker.moveCursor)) return;
  if (!attacker.airNormalContactHoldApplied) {
    attacker.airNormalContactHoldApplied = true;
    attacker.hitstop = definition.attackerContactHoldTicks;
  }
  if (attacker.airNormalConnectedHitOrdinals.includes(1)) return;
  const hitboxes = fighterActiveHitboxes(attacker);
  const hurtboxes = fighterHurtboxes(defender);
  if (!hitboxes.some((hitbox) => hurtboxes.some((hurtbox) => overlap(hitbox, hurtbox)))) return;

  attacker.attackConnected = true;
  attacker.airNormalConnectedHitOrdinals.push(1);
  const blocked = defender.blocking;
  const counterHit = !blocked && state.counterHitArmed;
  const outcome = blocked ? "block" : counterHit ? "counter_hit" : "hit";
  if (definition.attackerContactHoldTicks === 0) attacker.hitstop = definition.hitstop;
  defender.hitstop = definition.hitstop;
  state.counterHitArmed = false;

  if (blocked) {
    defender.blockstun = definition.blockstun;
    defender.hitstun = 0;
    defender.reaction = "none";
    defender.vx = attacker.facing * definition.blockPushbackPerTick;
    if (defender.defensePackageId !== "standing_block" && defender.defensePackageId !== "crouching_block") {
      startDefensePackage(defender, defender.crouching ? "crouching_block" : "standing_block", defender.crouching ? "crouch" : "idle");
    }
    setState(defender, defender.crouching ? "crouching_block" : "standing_block");
    emitPresentation(state, defender, "external_block_contact");
  } else {
    const damage = Math.round(definition.damage * attacker.damageScaling);
    defender.health = Math.max(0, defender.health - damage);
    forceDefenseReaction(state, "p2", definition.reaction, {
      hitstopTicks: definition.hitstop,
      hitstunTicks: definition.hitstun,
      returnState: "idle"
    });
    defender.vx = attacker.facing * definition.hitKnockbackPerTick;
  }

  state.lastEvent = {
    tick: state.tick,
    id: `air_normal_${definition.id}_contact`,
    outcome,
    hitOrdinal: 1,
    visibleImpactCount: 1,
    packageId: defender.defensePackageId ?? undefined,
    presentationEventId: defender.lastPresentationEventId ?? undefined
  };
}

function finishDefenseReaction(f: SandboxFighterState) {
  const returnState = f.returnState === "crouch" || f.returnState === "crouching_block" ? "crouch" : "idle";
  clearDefensePackage(f);
  f.vx = 0;
  f.reaction = "none";
  f.blocking = false;
  f.crouching = returnState === "crouch";
  setState(f, returnState);
}

function progressBlockPackage(f: SandboxFighterState) {
  const animation = currentDefensePackage(f)!;
  const cursor = f.defenseCursor ?? 0;
  if ((f.blocking || f.blockstun > 0) && cursor >= 15) {
    f.defenseCursor = 15;
    return;
  }
  if (cursor < 16) {
    f.defenseCursor = cursor + 1;
    return;
  }
  f.defenseCursor = cursor + 1;
  if (f.defenseCursor >= animation.simulationLength) finishDefenseReaction(f);
}

function progressFighter(state: SwahiliSandboxState, f: SandboxFighterState, frozenAtStart: boolean) {
  if (f.hitstop > 0) { f.hitstop--; return; }
  if (frozenAtStart) return;
  if (f.hitstun > 0) {
    f.hitstun--; f.x += f.vx; f.stateTick++;
    const animation = currentDefensePackage(f);
    if (animation && f.defenseCursor !== null) f.defenseCursor = Math.min(animation.simulationLength - 1, f.defenseCursor + 1);
    if (f.hitstun === 0) finishDefenseReaction(f);
    return;
  }
  if (f.blockstun > 0) {
    f.blockstun--; f.x += f.vx; f.stateTick++;
    if (f.blockstun === 0) f.vx = 0;
    if (f.defensePackageId === "standing_block" || f.defensePackageId === "crouching_block") progressBlockPackage(f);
    return;
  }
  if (f.id === "p1" && f.state === "jump_anticipation_review") {
    f.stateTick++;
    if (f.stateTick >= JUMP_FALL_LANDING_V1_REVIEW.anticipationTicks) {
      f.grounded = false;
      f.vy = SANDBOX_TUNING.movement.jumpVelocity;
      f.vx = state.jumpFallLandingReview.launchVelocityX;
      setState(f, "jump_airborne_review");
      state.jumpFallLandingReview.phase = "takeoff";
      state.jumpFallLandingReview.takeoffTick = state.tick;
      state.lastEvent = { tick: state.tick, id: "jump_fall_landing_v1_takeoff" };
    }
    return;
  }
  const airNormal = airNormalForState(f.state);
  if (f.id === "p1" && airNormal && f.moveCursor !== null) {
    f.moveCursor++;
    f.stateTick++;
    if (f.moveCursor >= airNormal.totalTicks) {
      if (f.airNormalConnectedHitOrdinals.length === 0) {
        state.lastEvent = { tick: state.tick, id: `air_normal_${airNormal.id}_whiff_complete`, outcome: "whiff" };
      }
      f.moveCursor = null;
      f.attackConnected = false;
      f.airNormalConnectedHitOrdinals = [];
      f.airNormalContactHoldApplied = false;
      setState(f, "jump_airborne_review");
    }
    return;
  }
  if (f.id === "p1" && f.state === "jump_airborne_review") {
    const air = state.airMobilityReview;
    if (air.airDashActive) {
      air.airDashTick++;
      air.airDashActualDistance = Math.abs(f.x - air.airDashStartX);
      const opponentDeltaBefore = (air.airDashStartX - state.fighters.p2.x) * air.airDashTravelSign;
      const opponentDeltaNow = (f.x - state.fighters.p2.x) * air.airDashTravelSign;
      if (!air.crossedOpponent && opponentDeltaBefore < 0 && opponentDeltaNow >= 0) {
        air.crossedOpponent = true;
        air.sideSwitchTick = air.airDashTick;
      }
      if (air.airDashTick >= AIR_MOBILITY_V1_REVIEW.airDashTicks) {
        air.airDashActive = false;
        air.result = "air_dash_complete";
        f.vx = 0;
        f.vy = Math.max(1.5, air.resumeVelocityY * 0.25);
        state.lastEvent = { tick: state.tick, id: `air_mobility_v1_air_dash_${air.airDashDirection}_complete` };
      }
    }
    f.stateTick++;
    return;
  }
  if (f.id === "p1" && isJumpLandingState(f.state)) {
    f.stateTick++;
    if (f.stateTick >= jumpLandingHoldTicks(state.jumpFallLandingReview.landingMode)) {
      state.jumpFallLandingReview.active = false;
      state.jumpFallLandingReview.phase = "complete";
      state.jumpFallLandingReview.result = "complete";
      f.vx = 0;
      setState(f, "idle");
      state.lastEvent = { tick: state.tick, id: `jump_fall_landing_v1_${state.jumpFallLandingReview.landingMode}_complete` };
    }
    return;
  }
  const groundNormal = groundNormalForState(f.state, f.standingNormalTimingProfile, f.crouchingLightTimingProfile, f.crouchingMediumTimingProfile, f.crouchingHeavyTimingProfile);
  if (groundNormal && f.moveCursor !== null) {
    f.moveCursor++;
    f.stateTick++;
    if (f.moveCursor >= groundNormal.totalTicks) {
      if (f.groundNormalConnectedHitOrdinals.length === 0) state.lastEvent = { tick: state.tick, id: `ground_normal_${groundNormal.id}_whiff_complete`, outcome: "whiff" };
      f.moveCursor = null;
      f.attackConnected = false;
      f.groundNormalConnectedHitOrdinals = [];
      f.vx = 0;
      setState(f, groundNormal.crouching ? "crouch" : "idle");
      f.crouching = groundNormal.crouching;
    }
    return;
  }
  if (f.id === "p1" && f.state === "grave_furrow_review" && f.moveCursor !== null) {
    const runtime = state.graveFurrow;
    runtime.simulationTick = f.moveCursor;
    runtime.actualRootAdvance = Math.abs(f.x - runtime.startX);
    const current = graveFurrowFrameAtTick(f.moveCursor);
    runtime.frameIndex = current.index;
    runtime.sourceId = current.sourceId;
    runtime.role = current.role;
    f.stateTick++;
    f.moveCursor++;
    if (f.moveCursor >= GRAVE_FURROW_V1_TOTAL_TICKS) {
      runtime.active = false;
      runtime.simulationTick = GRAVE_FURROW_V1_TOTAL_TICKS;
      runtime.actualRootAdvance = Math.abs(f.x - runtime.startX);
      if (!f.attackConnected) runtime.result = "whiff";
      f.vx = 0;
      f.moveCursor = null;
      f.attackConnected = false;
      setState(f, "idle");
      state.lastEvent = { tick: state.tick, id: `grave_furrow_v1_${runtime.result}_complete`, outcome: runtime.result === "block" ? "block" : runtime.result === "hit" ? "hit" : "whiff" };
    } else {
      const upcoming = graveFurrowFrameAtTick(f.moveCursor);
      runtime.simulationTick = f.moveCursor;
      runtime.frameIndex = upcoming.index;
      runtime.sourceId = upcoming.sourceId;
      runtime.role = upcoming.role;
    }
    return;
  }
  if (f.state === "standing_heavy" && f.moveCursor !== null) {
    if (f.hitstop > 0) return;
    f.moveCursor++;
    f.stateTick++;
    if (f.moveCursor >= SANDBOX_TUNING.standingHeavy.returnToIdleTick) {
      if (!f.attackConnected) {
        state.lastCombatDiagnostic = {
          profileId: SANDBOX_TUNING.standingHeavy.id,
          approval: SANDBOX_TUNING.standingHeavy.approval,
          moveTick: SANDBOX_TUNING.standingHeavy.recovery.end,
          contactTick: null,
          outcome: "whiff",
          resultingAdvantage: null,
          remainingRecovery: 0,
          hitstop: 0,
          hitstun: 0,
          blockstun: 0,
          pushbackPerTick: 0,
          meterGain: SANDBOX_TUNING.standingHeavy.meterGain.whiff,
          scalingBefore: f.damageScaling,
          scalingAfter: f.damageScaling,
          damageApplied: 0,
          rootSeparation: Math.abs(state.fighters.p2.x - f.x),
          hitbox: null,
          defenderHurtboxes: fighterHurtboxes(state.fighters.p2),
          presentationEvents: []
        };
        state.lastEvent = { tick: state.tick, id: "standing_heavy_whiff_complete", outcome: "whiff" };
      }
      state.counterHitArmed = false;
      f.moveCursor = null; f.attackConnected = false; setState(f, "idle");
    }
    return;
  }
  if ((f.state === "dash_forward_review" || f.state === "dash_backward_review") && f.moveCursor !== null) {
    const runtime = state.dashReview;
    const sample = dashFrameAtTick(runtime.direction, f.moveCursor);
    runtime.simulationTick = f.moveCursor;
    runtime.frameIndex = sample.frame.index;
    runtime.sourceId = sample.frame.sourceId;
    runtime.role = sample.frame.role;
    runtime.actualDistance = Math.abs(f.x - runtime.startX);
    const travelSign = runtime.startingFacing * (runtime.direction === "forward" ? 1 : -1);
    const atTravelBoundary = travelSign > 0 ? f.x >= state.stage.right : f.x <= state.stage.left;
    runtime.clippedByStageOrPushbox ||= atTravelBoundary && f.moveCursor < dashTotalTicks(runtime.direction) - 1;
    f.stateTick++;
    f.moveCursor++;
    if (f.moveCursor >= dashTotalTicks(runtime.direction)) {
      runtime.active = false;
      runtime.result = "complete";
      runtime.simulationTick = dashTotalTicks(runtime.direction);
      runtime.actualDistance = Math.abs(f.x - runtime.startX);
      runtime.clippedByStageOrPushbox ||= runtime.actualDistance < runtime.intendedDistance - 1e-6;
      f.vx = 0;
      f.moveCursor = null;
      setState(f, "idle");
      state.lastEvent = { tick: state.tick, id: `dash_${runtime.direction}_review_complete` };
    } else {
      const upcoming = dashFrameAtTick(runtime.direction, f.moveCursor);
      runtime.simulationTick = f.moveCursor;
      runtime.frameIndex = upcoming.frame.index;
      runtime.sourceId = upcoming.frame.sourceId;
      runtime.role = upcoming.frame.role;
    }
    return;
  }
  if (f.state === "universal_grab_review") {
    f.stateTick++;
    if (f.stateTick >= 12) setState(f, "idle");
    return;
  }
  if (f.state === "command_grab_downed") {
    if (f.moveCursor === null) f.moveCursor = 0;
    const recoveryFrame = commandGrabKnockdownRecoveryFrameAtTick(f.moveCursor);
    if (!recoveryFrame) {
      f.moveCursor = null;
      f.reaction = "none";
      resetPresentation(f);
      setState(f, "idle");
      state.lastEvent = { tick: state.tick, id: "knockdown_recovery_motion_v1_complete" };
      return;
    }
    f.grounded = true;
    f.y = 0;
    f.vx = 0;
    f.vy = 0;
    f.stateTick++;
    f.moveCursor++;
    return;
  }
  if (f.defensePackageId === "standing_block" || f.defensePackageId === "crouching_block") {
    progressBlockPackage(f);
    f.stateTick++;
    return;
  }
  f.stateTick++;
}

export function tickSwahiliSandbox(state: SwahiliSandboxState, input: SandboxInputFrame = {}) {
  const previousP1State = state.fighters.p1.state;
  const previousP1X = state.fighters.p1.x;
  const previousP1StateTick = state.fighters.p1.stateTick;
  if (applyCommand(state, input.command)) return state;
  updateFacing(state);
  const frozenAtStart = { p1: state.fighters.p1.hitstop > 0, p2: state.fighters.p2.hitstop > 0 };
  updateP1Control(state, input);
  const commandGrabWasActive = state.commandGrab.active;
  if (commandGrabWasActive) {
    progressCommandGrab(state);
  } else if (state.turnSideSwitchReview.active) {
    progressTurnSideSwitchReview(state);
  } else {
    updateDummy(state);
    integrate(state, frozenAtStart);
    resolvePushboxes(state, frozenAtStart);
    updateFacing(state);
    resolveAirNormal(state, frozenAtStart);
    resolveGraveFurrow(state, frozenAtStart);
    resolveGroundNormal(state, frozenAtStart);
    resolveStandingHeavy(state, frozenAtStart);
    progressFighter(state, state.fighters.p1, frozenAtStart.p1);
    progressFighter(state, state.fighters.p2, frozenAtStart.p2);
  }
  if (state.fighters.p1.state === "idle" && state.fighters.p2.hitstun === 0 && state.fighters.p2.blockstun === 0) {
    state.fighters.p1.damageScaling = 1;
  }
  for (const id of ["p1", "p2"] as const) state.fighters[id].x = clamp(state.fighters[id].x, state.stage.left, state.stage.right);
  syncJumpFallLandingReview(state);
  updateForwardWalkV2Diagnostic(state, previousP1State, previousP1StateTick, previousP1X);
  state.previousP1Input = clone({ left: input.left, right: input.right, down: input.down, up: input.up, block: input.block, light: input.light, medium: input.medium, heavy: input.heavy, grab: input.grab, commandGrab: input.commandGrab, graveFurrow: input.graveFurrow, dash: input.dash });
  state.tick++;
  return state;
}

function syncJumpFallLandingReview(state: SwahiliSandboxState) {
  const runtime = state.jumpFallLandingReview;
  if (!runtime.active) return;
  const f = state.fighters.p1;
  const animation = jumpReviewAnimation(f, runtime.landingMode);
  runtime.frameIndex = animation.frameIndex + 1;
  runtime.sourceId = animation.sourceId;
  runtime.role = animation.role;
  runtime.simulationTick++;
  runtime.peakY = Math.min(runtime.peakY, f.y);
  runtime.horizontalDistance = Math.abs(f.x - runtime.startX);
  if (f.state === "jump_airborne_review") {
    runtime.airborneTicks++;
    runtime.phase = runtime.frameIndex === 2 ? "takeoff" : runtime.frameIndex === 3 ? "rising" : runtime.frameIndex === 4 ? "apex" : "falling";
    if (runtime.phase === "apex" && runtime.apexTick === null) runtime.apexTick = state.tick;
  } else if (isJumpLandingState(f.state)) {
    runtime.phase = "landing";
  }
}

function updateForwardWalkV2Diagnostic(state: SwahiliSandboxState, previousState: SandboxStateName, previousStateTick: number, previousRootX: number) {
  const f = state.fighters.p1;
  const diagnostic = state.forwardWalkV2Diagnostic;
  const animation = selectSandboxAnimation(f, state);
  const displacement = f.x - previousRootX;
  const freshSideSwitch = state.lastEvent?.tick === state.tick && state.lastEvent.id === "side_switch";
  const transitionState = freshSideSwitch
    ? "side_switch"
    : previousState !== f.state
      ? `${previousState}_to_${f.state}`
      : f.state === "walk_forward"
        ? "continuous_forward_walk"
        : `${f.state}_stable`;
  let plantedFootWorldPosition: number | null = null;
  let footSkateEstimate = 0;
  let peakFootSkateEstimate = diagnostic.peakFootSkateEstimate;
  let meanFootSkateEstimate = diagnostic.meanFootSkateEstimate;
  let footSkateSamples = diagnostic.footSkateSamples;
  let accumulatedDisplacement = diagnostic.accumulatedDisplacement;
  let cycleAccumulatedDisplacement = diagnostic.cycleAccumulatedDisplacement;
  if (f.state === "walk_forward") {
    const sample = forwardWalkV2FrameAtTick(f.stateTick, f.forwardWalkTimingProfile);
    plantedFootWorldPosition = supportFootWorldPosition(f.x, f.facing, f.stateTick, f.forwardWalkTimingProfile);
    const continuedSamePlant = previousState === "walk_forward" && diagnostic.plantedFootWorldPosition !== null && diagnostic.supportFoot === sample.slot.supportFoot && !freshSideSwitch;
    if (continuedSamePlant) {
      footSkateEstimate = Math.abs(plantedFootWorldPosition - diagnostic.plantedFootWorldPosition!);
      const total = meanFootSkateEstimate * footSkateSamples + footSkateEstimate;
      footSkateSamples++;
      meanFootSkateEstimate = total / footSkateSamples;
      peakFootSkateEstimate = Math.max(peakFootSkateEstimate, footSkateEstimate);
    }
    if (!freshSideSwitch) {
      accumulatedDisplacement += Math.abs(displacement);
      const previousSample = previousState === "walk_forward" ? forwardWalkV2FrameAtTick(previousStateTick, f.forwardWalkTimingProfile) : null;
      cycleAccumulatedDisplacement = previousSample && sample.cycleTick < previousSample.cycleTick ? Math.abs(displacement) : cycleAccumulatedDisplacement + Math.abs(displacement);
    }
  } else if (previousState === "walk_forward") {
    cycleAccumulatedDisplacement = 0;
  }
  state.forwardWalkV2Diagnostic = {
    timingProfileId: f.forwardWalkTimingProfile,
    motionCurveVersion: FORWARD_WALK_V2_ROOT_CURVE_VERSION,
    cycleTicks: FORWARD_WALK_V2_TIMING_PROFILES[f.forwardWalkTimingProfile].cycleTicks,
    simulationTick: state.tick + 1,
    artworkFrame: animation.frameIndex + 1,
    sourceId: animation.sourceId,
    gaitRole: animation.role,
    supportFoot: animation.supportFoot,
    swingFoot: animation.swingFoot,
    fighterRoot: f.x,
    plantedFootWorldPosition,
    perTickDisplacement: displacement,
    accumulatedDisplacement,
    cycleAccumulatedDisplacement,
    footSkateEstimate,
    peakFootSkateEstimate,
    meanFootSkateEstimate,
    footSkateSamples,
    transitionState,
    incompleteBackwardWalkWarning: "walk_backward_v2 incomplete: first_passing, first_up_late_swing, and opposite_foot_down_compression are blocked on manual paintovers"
  };
}

export function setForwardWalkV2TimingProfile(state: SwahiliSandboxState, profileId: ForwardWalkV2TimingProfileId) {
  const profile = FORWARD_WALK_V2_TIMING_PROFILES[profileId];
  if (!profile) throw new Error(`Unknown Forward Walk V2 timing profile: ${profileId}`);
  state.fighters.p1.forwardWalkTimingProfile = profileId;
  state.fighters.p2.forwardWalkTimingProfile = profileId;
  if (state.fighters.p1.state === "walk_forward") state.fighters.p1.stateTick = 0;
  state.forwardWalkV2Diagnostic = {
    ...state.forwardWalkV2Diagnostic,
    timingProfileId: profileId,
    cycleTicks: profile.cycleTicks,
    artworkFrame: 1,
    perTickDisplacement: 0,
    cycleAccumulatedDisplacement: 0,
    footSkateEstimate: 0,
    peakFootSkateEstimate: 0,
    meanFootSkateEstimate: 0,
    footSkateSamples: 0,
    plantedFootWorldPosition: null,
    transitionState: `timing_profile_selected:${profileId}`
  };
  state.lastEvent = { tick: state.tick, id: `forward_walk_v2_timing:${profileId}` };
}

export function setStandingNormalsMotionV1TimingProfile(state: SwahiliSandboxState, profileId: StandingNormalTimingProfileId) {
  const profile = STANDING_NORMALS_MOTION_V1_TIMING_PROFILES[profileId];
  if (!profile) throw new Error(`Unknown Standing Normals Motion V1 timing profile: ${profileId}`);
  state.fighters.p1.standingNormalTimingProfile = profileId;
  state.fighters.p2.standingNormalTimingProfile = profileId;
  const p1 = state.fighters.p1;
  if (isGroundNormalState(p1.state) && p1.moveCursor !== null) {
    p1.moveCursor = 0;
    p1.attackConnected = false;
    p1.groundNormalConnectedHitOrdinals = [];
  }
  state.lastEvent = { tick: state.tick, id: `standing_normals_motion_v1_timing:${profileId}` };
}

export function setCrouchingLightV4TimingProfile(state: SwahiliSandboxState, profileId: CrouchingLightTimingProfileId) {
  const profile = CROUCHING_LIGHT_V4_TIMING_PROFILES[profileId];
  if (!profile) throw new Error(`Unknown Crouching Light V4 timing profile: ${profileId}`);
  state.fighters.p1.crouchingLightTimingProfile = profileId;
  state.fighters.p2.crouchingLightTimingProfile = profileId;
  const p1 = state.fighters.p1;
  if (p1.state === "crouching_light_review" && p1.moveCursor !== null) {
    p1.moveCursor = 0;
    p1.attackConnected = false;
    p1.groundNormalConnectedHitOrdinals = [];
    p1.hitstop = 0;
  }
  state.lastEvent = { tick: state.tick, id: `crouching_light_v4_timing:${profileId}` };
}

export function setCrouchingMediumOpposedSplitShotV6TimingProfile(state: SwahiliSandboxState, profileId: CrouchingMediumTimingProfileId) {
  const profile = CROUCHING_MEDIUM_OPPOSED_SPLIT_SHOT_V6_TIMING_PROFILES[profileId];
  if (!profile) throw new Error(`Unknown Crouching Medium Opposed Split Shot V6 timing profile: ${profileId}`);
  state.fighters.p1.crouchingMediumTimingProfile = profileId;
  state.fighters.p2.crouchingMediumTimingProfile = profileId;
  const p1 = state.fighters.p1;
  if (p1.state === "crouching_medium_review" && p1.moveCursor !== null) {
    p1.moveCursor = 0;
    p1.attackConnected = false;
    p1.groundNormalConnectedHitOrdinals = [];
    p1.hitstop = 0;
  }
  state.lastEvent = { tick: state.tick, id: `crouching_medium_opposed_split_shot_v6_timing:${profileId}` };
}

export function setCrouchingHeavyMotionV1TimingProfile(state: SwahiliSandboxState, profileId: CrouchingHeavyTimingProfileId) {
  const profile = CROUCHING_HEAVY_MOTION_V1_TIMING_PROFILES[profileId];
  if (!profile) throw new Error(`Unknown Crouching Heavy Motion V1 timing profile: ${profileId}`);
  state.fighters.p1.crouchingHeavyTimingProfile = profileId;
  state.fighters.p2.crouchingHeavyTimingProfile = profileId;
  const p1 = state.fighters.p1;
  if (p1.state === "crouching_heavy_review" && p1.moveCursor !== null) {
    p1.moveCursor = 0;
    p1.attackConnected = false;
    p1.groundNormalConnectedHitOrdinals = [];
    p1.hitstop = 0;
  }
  state.lastEvent = { tick: state.tick, id: `crouching_heavy_motion_v1_timing:${profileId}` };
}

export function currentHeavyPhase(f: SandboxFighterState) {
  if (f.state === "grave_furrow_review" && f.moveCursor !== null) return graveFurrowPhaseAtTick(f.moveCursor);
  const airNormal = airNormalForState(f.state);
  if (airNormal && f.moveCursor !== null) return airNormalPhase(airNormal, f.moveCursor);
  const groundNormal = groundNormalForState(f.state, f.standingNormalTimingProfile, f.crouchingLightTimingProfile, f.crouchingMediumTimingProfile, f.crouchingHeavyTimingProfile);
  if (groundNormal && f.moveCursor !== null) return groundNormalPhase(groundNormal, f.moveCursor);
  if (f.state !== "standing_heavy" || f.moveCursor === null) return "none";
  if (f.moveCursor <= SANDBOX_TUNING.standingHeavy.startup.end) return "startup";
  if (f.moveCursor <= SANDBOX_TUNING.standingHeavy.active.end) return "active";
  return "recovery";
}

export function selectSandboxAnimation(f: SandboxFighterState, state?: SwahiliSandboxState): SandboxAnimationFrame {
  const defenseExposure = currentDefenseExposure(f);
  if (defenseExposure) {
    const grounding = currentDefenseGrounding(f);
    const animation = currentDefensePackage(f)!;
    return {
      sourceId: defenseExposure.sourceFrameId,
      state: f.state,
      frameIndex: animation.exposures.indexOf(animation.exposures.find((item) => item.sourceFrameId === defenseExposure.sourceFrameId)!),
      role: `${f.defensePackageId}_package_exposure`,
      supportFoot: grounding?.nearFootRole ?? "package_grounding_unavailable",
      swingFoot: grounding?.farFootRole ?? "package_grounding_unavailable",
      walkCyclePhase: `${defenseExposure.packageTick + 1}/${animation.simulationLength}`,
      fallbackWarning: null,
      approval: "APPROVED_AS_DEFENSE_REACTION_MOTION_V1"
    };
  }
  if (f.state === "grave_furrow_review" && f.moveCursor !== null) {
    const frame = graveFurrowFrameAtTick(f.moveCursor);
    return {
      sourceId: frame.sourceId,
      state: f.state,
      frameIndex: frame.index - 1,
      role: `grave_furrow_${frame.role}`,
      supportFoot: frame.index <= 4 ? "both_feet_resisted_drag" : frame.index <= 7 ? "lead_foot_drive" : "both_feet_recovery",
      swingFoot: "none",
      walkCyclePhase: `${frame.index}/9 tick_${f.moveCursor + 1}/${GRAVE_FURROW_V1_TOTAL_TICKS} ${graveFurrowPhaseAtTick(f.moveCursor)}`,
      fallbackWarning: null,
      approval: GRAVE_FURROW_PLAYTEST_V1.gate
    };
  }
  if (f.state === "grave_furrow_launch_victim") {
    const launchEntry = f.stateTick <= 4;
    return {
      sourceId: launchEntry ? "knockdown_recovery_01_launch_reaction" : "knockdown_recovery_02_airborne_tumble",
      state: f.state,
      frameIndex: launchEntry ? 0 : 1,
      role: launchEntry ? "grave_furrow_launch_reaction" : "grave_furrow_airborne_tumble",
      supportFoot: "airborne_none",
      swingFoot: "airborne_none",
      walkCyclePhase: `airborne_tick_${f.stateTick}`,
      fallbackWarning: null,
      approval: KNOCKDOWN_RECOVERY_MOTION_V1_APPROVAL
    };
  }
  if (f.state === "command_grab_review" && f.moveCursor !== null) {
    const frame = commandGrabFrameAtSourceTick(f.moveCursor);
    return {
      sourceId: frame.sourceId,
      state: f.state,
      frameIndex: frame.index - 1,
      role: frame.role,
      supportFoot: frame.index >= 16 && frame.index <= 22 ? "rotational_brace" : "both_braced",
      swingFoot: "none",
      walkCyclePhase: `${frame.index}/24 source_tick_${f.moveCursor}`,
      fallbackWarning: null,
      approval: COMMAND_GRAB_MOTION_V1_APPROVAL
    };
  }
  if ((f.state === "command_grab_victim" || f.state === "command_grab_downed") && f.moveCursor !== null) {
    if (f.state === "command_grab_downed" && f.moveCursor <= KNOCKDOWN_RECOVERY_MOTION_V1_REVIEW.commandGrabKnockdownTicks) {
      const recoveryTick = Math.min(f.moveCursor, KNOCKDOWN_RECOVERY_MOTION_V1_REVIEW.commandGrabKnockdownTicks - 1);
      const recoveryFrame = commandGrabKnockdownRecoveryFrameAtTick(recoveryTick);
      if (recoveryFrame) {
        return {
          sourceId: recoveryFrame.sourceId,
          state: f.state,
          frameIndex: recoveryFrame.index - 1,
          role: `command_grab_knockdown_${recoveryFrame.role}`,
          supportFoot: recoveryFrame.support,
          swingFoot: recoveryFrame.grounded ? "grounded_recovery" : "airborne_none",
          walkCyclePhase: `${Math.min(f.moveCursor + 1, KNOCKDOWN_RECOVERY_MOTION_V1_REVIEW.commandGrabKnockdownTicks)}/${KNOCKDOWN_RECOVERY_MOTION_V1_REVIEW.commandGrabKnockdownTicks}`,
          fallbackWarning: null,
          approval: KNOCKDOWN_RECOVERY_MOTION_V1_APPROVAL
        };
      }
    }
    const frame = commandGrabFrameAtSourceTick(f.moveCursor);
    const victimFallFrame = commandGrabVictimFallFrameForPose(frame.victimPose);
    if (victimFallFrame) {
      return {
        sourceId: victimFallFrame.sourceId,
        state: f.state,
        frameIndex: victimFallFrame.index - 1,
        role: `command_grab_victim_${victimFallFrame.role}`,
        supportFoot: victimFallFrame.role === "impact_downed" ? "grounded_downed" : "airborne_none",
        swingFoot: "articulated_victim_fall",
        walkCyclePhase: `${victimFallFrame.index}/6 source_tick_${f.moveCursor}`,
        fallbackWarning: null,
        approval: COMMAND_GRAB_VICTIM_FALL_V1_APPROVAL
      };
    }
    const sourceId = frame.victimPose === "low_hip_contact"
      ? "light_hit_entry"
      : frame.victimPose === "hip_trap"
        ? "heavy_hit_entry"
        : frame.victimPose === "downed"
          ? "heavy_hit_recovery"
          : "heavy_hit_reaction";
    return {
      sourceId,
      state: f.state,
      frameIndex: frame.index - 1,
      role: `command_grab_victim_${frame.victimPose}`,
      supportFoot: frame.victimPose === "downed" ? "grounded_downed" : frame.victimRoot[1] >= 1408 ? "swept_contact" : "airborne_none",
      swingFoot: "controlled_by_scythe_path",
      walkCyclePhase: `${frame.index}/24 source_tick_${f.moveCursor}`,
      fallbackWarning: null,
      approval: "CANDIDATE_ONLY_RUNTIME_REACTION_PROXY"
    };
  }
  const groundNormal = groundNormalForState(f.state, f.standingNormalTimingProfile, f.crouchingLightTimingProfile, f.crouchingMediumTimingProfile, f.crouchingHeavyTimingProfile);
  if (groundNormal && f.moveCursor !== null) {
    const frame = groundNormalFrameAtTick(groundNormal, f.moveCursor);
    return {
      sourceId: frame.sourceId,
      state: f.state,
      frameIndex: frame.index - 1,
      role: `ground_normal_${groundNormal.id}_${frame.role}`,
      supportFoot: groundNormal.crouching ? "grounded_crouch_support" : "both_feet_braced",
      swingFoot: groundNormal.id === "crouching_light" ? "pistol_active_hand" : groundNormal.id === "crouching_medium" ? "opposed_split_pistol_hands" : "none",
      walkCyclePhase: `${frame.index}/${groundNormal.exposures.length} tick_${f.moveCursor + 1}/${groundNormal.totalTicks}`,
      fallbackWarning: null,
      approval: groundNormal.id === "crouching_light"
        ? CROUCHING_LIGHT_V4_TIMING_REVIEW_STATUS
        : groundNormal.id === "crouching_medium"
          ? CROUCHING_MEDIUM_OPPOSED_SPLIT_SHOT_V6_REVIEW_STATUS
          : groundNormal.id === "crouching_heavy"
            ? CROUCHING_HEAVY_MOTION_V1_REVIEW_STATUS
            : GROUND_NORMALS_PLAYTEST_V1_APPROVAL
    };
  }
  if (f.state === "standing_heavy" && f.moveCursor !== null) {
    const exposure = STANDING_HEAVY_EXPOSURES.find((candidate) => f.moveCursor! >= candidate.start && f.moveCursor! <= candidate.end) ?? STANDING_HEAVY_EXPOSURES.at(-1)!;
    return { sourceId: exposure.sourceId, state: f.state, frameIndex: STANDING_HEAVY_EXPOSURES.indexOf(exposure), role: exposure.role, supportFoot: exposure.supportFoot, swingFoot: "screen_right_non_support", walkCyclePhase: null, fallbackWarning: null, approval: "APPROVED_AS_STANDING_HEAVY_MOTION_V1" };
  }
  if ((f.state === "dash_forward_review" || f.state === "dash_backward_review") && f.moveCursor !== null) {
    const direction = f.state === "dash_forward_review" ? "forward" : "backward";
    const sample = dashFrameAtTick(direction, f.moveCursor);
    return {
      sourceId: sample.frame.sourceId,
      state: f.state,
      frameIndex: sample.frame.index - 1,
      role: `dash_${direction}_${sample.frame.role}`,
      supportFoot: sample.frame.supportFoot,
      swingFoot: sample.frame.swingFoot,
      walkCyclePhase: `${sample.frame.index}/6 tick_${f.moveCursor + 1}/${dashTotalTicks(direction)}`,
      fallbackWarning: null,
      approval: DASH_REPAIR_V2_APPROVAL
    };
  }
  const airDash = state?.airMobilityReview;
  const airDashJustCompleted = Boolean(
    airDash
    && !airDash.airDashActive
    && airDash.airDashTick === AIR_MOBILITY_V1_REVIEW.airDashTicks
    && state?.lastEvent?.tick === state.tick - 1
    && state.lastEvent.id === `air_mobility_v1_air_dash_${airDash.airDashDirection}_complete`
  );
  if (f.id === "p1" && f.state === "jump_airborne_review" && airDash && (airDash.airDashActive || airDashJustCompleted)) {
    const sideSwitchActive = airDash.airDashDirection === "forward"
      && airDash.sideSwitchTick !== null
      && airDash.airDashTick >= airDash.sideSwitchTick;
    const frame = sideSwitchActive
      ? airDashSideSwitchFrameAtTick(airDash.airDashTick, airDash.sideSwitchTick!)
      : airDashMotionFrameAtTick(airDash.airDashDirection, airDash.airDashTick);
    const rotationMidpoint = sideSwitchActive && airDash.airDashTick === airDash.sideSwitchTick;
    return {
      sourceId: frame.sourceId,
      state: f.state,
      frameIndex: frame.index - 1,
      role: `air_dash_${airDash.airDashDirection}_${frame.role}`,
      supportFoot: "airborne_none",
      swingFoot: "airborne_none",
      walkCyclePhase: `${frame.index}/${sideSwitchActive ? 6 : 4} tick_${airDash.airDashTick}/${AIR_MOBILITY_V1_REVIEW.airDashTicks}`,
      fallbackWarning: null,
      approval: sideSwitchActive ? AIR_DASH_SIDE_SWITCH_V2_APPROVAL : AIR_DASH_MOTION_V1_APPROVAL,
      presentationFacingOverride: rotationMidpoint ? airDash.airDashStartingFacing : null
    };
  }
  const airNormal = airNormalForState(f.state);
  if (airNormal && f.moveCursor !== null) {
    const frame = airNormalFrameAtTick(airNormal, f.moveCursor);
    return {
      sourceId: frame.sourceId,
      state: f.state,
      frameIndex: frame.index - 1,
      role: `air_normal_${airNormal.id}_${frame.role}`,
      supportFoot: "airborne_none",
      swingFoot: "airborne_none",
      walkCyclePhase: `${frame.index}/${airNormal.exposures.length} tick_${f.moveCursor + 1}/${airNormal.totalTicks} ${airNormalPhase(airNormal, f.moveCursor)}`,
      fallbackWarning: frame.fallbackWarning,
      approval: frame.approval
    };
  }
  if (f.state === "jump_anticipation_review" || f.state === "jump_airborne_review" || isJumpLandingState(f.state)) {
    const landingMode: JumpLandingReviewMode = f.state === "jump_landing_attack_review"
      ? "attack"
      : f.state === "jump_landing_hard_review"
        ? "hard"
        : "soft";
    return jumpReviewAnimation(f, landingMode);
  }
  if (f.state === "turn_side_switch_review") {
    const sample = turnSideSwitchExposureAtTick(f.stateTick);
    return {
      sourceId: sample.exposure.sourceId,
      state: f.state,
      frameIndex: sample.exposure.index - 1,
      role: sample.exposure.role,
      supportFoot: "both_feet_planted_pivot",
      swingFoot: "none",
      walkCyclePhase: `${sample.exposure.index}/4 tick_${f.stateTick + 1}/${turnSideSwitchTotalTicks()}`,
      fallbackWarning: null,
      approval: TURN_SIDE_SWITCH_V1_APPROVAL
    };
  }
  if (f.state === "walk_forward" || f.state === "walk_backward") {
    const slots = f.state === "walk_forward" ? FORWARD_WALK_SLOTS : BACKWARD_WALK_SLOTS;
    const frameIndex = f.state === "walk_forward"
      ? forwardWalkV2FrameAtTick(f.stateTick, f.forwardWalkTimingProfile).frameIndex
      : Math.floor(f.stateTick / 5) % slots.length;
    const slot = slots[frameIndex];
    return { sourceId: slot.sourceId, state: f.state, frameIndex, role: slot.role, supportFoot: slot.supportFoot, swingFoot: slot.swingFoot, walkCyclePhase: `${frameIndex + 1}/8 ${slot.role}`, fallbackWarning: slot.fallbackWarning, approval: slot.approval };
  }
  const direct: Partial<Record<SandboxStateName, Omit<SandboxAnimationFrame, "state">>> = {
    crouch: { sourceId: "crouch", frameIndex: 0, role: "crouch_hold", supportFoot: "screen_left_principal_support", swingFoot: "screen_right_support", walkCyclePhase: null, fallbackWarning: null, approval: "APPROVED_AS_DEFENSE_REACTION_KEY_POSE_LIBRARY_V1" },
    standing_block: { sourceId: "standing_block", frameIndex: 0, role: "standing_guard_hold", supportFoot: "screen_left_principal_support", swingFoot: "screen_right_support", walkCyclePhase: null, fallbackWarning: null, approval: "APPROVED_AS_DEFENSE_REACTION_KEY_POSE_LIBRARY_V1" },
    crouching_block: { sourceId: "crouching_block_v2", frameIndex: 0, role: "crouching_guard_hold", supportFoot: "screen_left_principal_support", swingFoot: "screen_right_support", walkCyclePhase: null, fallbackWarning: null, approval: "APPROVED_AS_CROUCHING_BLOCK_KEY_POSE_V2" },
    universal_grab_review: { sourceId: "universal_grab_reach", frameIndex: 0, role: "walk_to_universal_grab_entry_review", supportFoot: "screen_left_principal_support", swingFoot: "screen_right_braced", walkCyclePhase: null, fallbackWarning: null, approval: "APPROVED_AS_GRAB_THROW_MOTION_V1_TRANSITION_REFERENCE" },
    command_grab_review: { sourceId: "command_grab_01_mounted_startup", frameIndex: 0, role: "command_grab_motion_v1_startup", supportFoot: "both_braced", swingFoot: "none", walkCyclePhase: null, fallbackWarning: null, approval: COMMAND_GRAB_MOTION_V1_APPROVAL },
    command_grab_victim: { sourceId: "heavy_hit_reaction", frameIndex: 0, role: "command_grab_victim_proxy", supportFoot: "controlled_by_scythe", swingFoot: "controlled_by_scythe", walkCyclePhase: null, fallbackWarning: null, approval: "CANDIDATE_ONLY_RUNTIME_REACTION_PROXY" },
    command_grab_downed: { sourceId: "knockdown_recovery_03_ground_impact", frameIndex: 2, role: "command_grab_knockdown_ground_impact", supportFoot: "back_and_coat_floor_contact", swingFoot: "grounded_recovery", walkCyclePhase: null, fallbackWarning: null, approval: KNOCKDOWN_RECOVERY_MOTION_V1_APPROVAL },
    light_hit_reaction: { sourceId: "light_hit_reaction", frameIndex: 0, role: "light_hit_hold", supportFoot: "screen_left_principal_support", swingFoot: "screen_right_support", walkCyclePhase: null, fallbackWarning: null, approval: "APPROVED_AS_DEFENSE_REACTION_KEY_POSE_LIBRARY_V1" },
    heavy_hit_reaction: { sourceId: "heavy_hit_reaction", frameIndex: 0, role: "heavy_hit_hold", supportFoot: "screen_left_approved_support", swingFoot: "screen_right_displaced", walkCyclePhase: null, fallbackWarning: null, approval: "APPROVED_AS_DEFENSE_REACTION_KEY_POSE_LIBRARY_V1" }
  };
  const selected = direct[f.state];
  if (selected) return { ...selected, state: f.state };
  const idleFrame = Math.floor(f.stateTick / 10) % 4;
  return { sourceId: `idle_0${idleFrame}`, state: "idle", frameIndex: idleFrame, role: "idle_cycle", supportFoot: "screen_left_principal_support", swingFoot: "screen_right_support", walkCyclePhase: null, fallbackWarning: null, approval: "APPROVED_AS_IDLE_FOUNDATION_V1" };
}

export function sandboxChecksum(state: SwahiliSandboxState) {
  const graveFurrowChecksum = state.graveFurrow.active || state.graveFurrow.result !== "idle"
    ? { graveFurrow: state.graveFurrow }
    : {};
  const canonical = JSON.stringify({ tick: state.tick, stage: state.stage, fighters: state.fighters, dummyBlockMode: state.dummyBlockMode, dummyCrouching: state.dummyCrouching, counterHitArmed: state.counterHitArmed, previousP1Input: state.previousP1Input, lastEvent: state.lastEvent, lastCombatDiagnostic: state.lastCombatDiagnostic, forwardWalkV2Diagnostic: state.forwardWalkV2Diagnostic, commandGrab: state.commandGrab, dashReview: state.dashReview, jumpFallLandingReview: state.jumpFallLandingReview, airMobilityReview: state.airMobilityReview, turnSideSwitchReview: state.turnSideSwitchReview, ...graveFurrowChecksum, presentationEvents: state.presentationEvents, presentationEventLedger: state.presentationEventLedger });
  let hash = 2166136261;
  for (let index = 0; index < canonical.length; index++) { hash ^= canonical.charCodeAt(index); hash = Math.imul(hash, 16777619); }
  return (hash >>> 0).toString(16).padStart(8, "0");
}

export type SandboxScenarioId =
  | "idle_center" | "forward_walk" | "backward_walk" | "walk_reversal" | "crouch" | "standing_block"
  | "crouching_block" | "standing_heavy_whiff" | "standing_heavy_hit" | "standing_heavy_block"
  | "light_hit_reaction" | "heavy_hit_reaction" | "left_corner" | "right_corner" | "side_switch"
  | "mirrored_facing" | "jump_camera_placeholder" | "jump_soft_review" | "jump_attack_landing_review" | "jump_hard_landing_review" | "jump_mirrored_review"
  | "standing_block_entry" | "standing_block_hold" | "standing_block_release"
  | "crouching_block_entry" | "crouching_block_hold" | "crouching_block_release"
  | "light_hit_from_idle" | "light_hit_from_walk" | "light_hit_from_crouch" | "light_hit_from_block"
  | "heavy_hit_from_idle" | "heavy_hit_from_walk" | "heavy_hit_from_crouch" | "heavy_hit_from_block"
  | "defense_hitstop_freeze" | "defense_rapid_hits" | "defense_return_state"
  | "heavy_first_active_hit" | "heavy_last_active_hit" | "heavy_counter_hit"
  | "heavy_standing_block_v1" | "heavy_crouching_block_v1" | "heavy_whiff_complete"
  | "heavy_corner_hit" | "heavy_max_range_standing" | "heavy_max_range_crouching" | "heavy_just_outside_range"
  | "heavy_mirrored_p2" | "heavy_side_switch" | "heavy_repeated_use"
  | "heavy_punish_after_block" | "heavy_punish_after_whiff"
  | "heavy_normal_hit_pressure" | "heavy_counter_hit_pressure" | "heavy_rollback_replay"
  | "walk_v2_idle_to_forward" | "walk_v2_continuous" | "walk_v2_forward_to_idle" | "walk_v2_repeated_start_stop"
  | "walk_v2_forward_to_backward" | "walk_v2_corner_approach" | "walk_v2_side_switch" | "walk_v2_mirrored_p2"
  | "walk_v2_to_standing_heavy" | "walk_v2_to_universal_grab" | "walk_v2_to_command_grab" | "walk_v2_to_block" | "walk_v2_to_crouch"
  | "command_grab_hit" | "command_grab_whiff" | "command_grab_mirrored"
  | "dash_forward_review" | "dash_backward_review" | "dash_forward_mirrored" | "dash_backward_mirrored"
  | "dash_corner_stop" | "dash_repeated_use"
  | "turn_side_switch_review" | "turn_side_switch_mirrored"
  | "air_mobility_double_jump_review" | "air_mobility_forward_dash_cross"
  | "air_mobility_backward_dash_review" | "air_mobility_mirrored_cross";

export function setupSandboxScenario(state: SwahiliSandboxState, id: SandboxScenarioId) {
  resetSandboxRound(state, false);
  const step = (input: SandboxInputFrame, ticks = 1) => { for (let index = 0; index < ticks; index++) tickSwahiliSandbox(state, index === 0 ? input : { ...input, command: undefined }); };
  const startHeavy = () => step({ heavy: true });
  const waitForOutcome = (outcomes: Array<"hit" | "counter_hit" | "block">) => {
    while ((!state.lastEvent?.outcome || !outcomes.includes(state.lastEvent.outcome as "hit" | "counter_hit" | "block")) && state.tick < 250) step({});
  };
  const lateContact = (blockMode: "off" | "standing" | "crouching" = "off", counter = false) => {
    state.fighters.p2.x = 300;
    state.dummyBlockMode = blockMode;
    state.counterHitArmed = counter;
    startHeavy();
    while (state.fighters.p1.moveCursor !== null && state.fighters.p1.moveCursor < 28) step({});
    state.fighters.p2.x = state.fighters.p1.x + state.fighters.p1.facing * 190;
    updateFacing(state);
    step({});
  };
  switch (id) {
    case "walk_v2_idle_to_forward": state.fighters.p2.x = 360; step({ right: true }); break;
    case "walk_v2_continuous": state.fighters.p2.x = 400; step({ right: true }, 44); break;
    case "walk_v2_forward_to_idle": state.fighters.p2.x = 360; step({ right: true }, 18); step({}); break;
    case "walk_v2_repeated_start_stop": state.fighters.p2.x = 400; step({ right: true }, 8); step({}, 3); step({ right: true }, 8); step({}, 3); step({ right: true }, 8); break;
    case "walk_v2_forward_to_backward": state.fighters.p2.x = 360; step({ right: true }, 14); step({ left: true }, 14); state.lastEvent = { tick: state.tick, id: "walk_v2_forward_to_incomplete_backward" }; break;
    case "walk_v2_corner_approach": state.fighters.p1.x = 330; state.fighters.p2.x = 410; updateFacing(state); step({ right: true }, 28); break;
    case "walk_v2_side_switch": state.fighters.p2.x = 360; step({ right: true }, 12); step({ command: "switch_sides" }); break;
    case "walk_v2_mirrored_p2": state.fighters.p1.x = 88; state.fighters.p2.x = -360; updateFacing(state); step({ left: true }, 18); break;
    case "walk_v2_to_standing_heavy": state.fighters.p2.x = 360; step({ right: true }, 12); step({ heavy: true }); break;
    case "walk_v2_to_universal_grab": state.fighters.p2.x = 360; step({ right: true }, 12); step({ grab: true }); break;
    case "walk_v2_to_command_grab": state.fighters.p2.x = 110; step({ right: true }, 6); step({ commandGrab: true }); break;
    case "walk_v2_to_block": state.fighters.p2.x = 360; step({ right: true }, 12); step({ block: true }); break;
    case "walk_v2_to_crouch": state.fighters.p2.x = 360; step({ right: true }, 12); step({ down: true }); break;
    case "forward_walk": step({ right: true }, 18); break;
    case "backward_walk": step({ left: true }, 18); break;
    case "walk_reversal": step({ right: true }, 14); step({}, 1); step({ left: true }, 14); state.lastEvent = { tick: state.tick, id: "walk_direction_reversal" }; break;
    case "crouch": step({ down: true }, 4); break;
    case "standing_block": step({ block: true }, 4); break;
    case "crouching_block": step({ block: true, down: true }, 4); break;
    case "standing_block_entry": step({ block: true }); break;
    case "standing_block_hold": step({ block: true }, 18); break;
    case "standing_block_release": step({ block: true }, 18); step({}, 3); break;
    case "crouching_block_entry": step({ down: true }); step({ block: true, down: true }); break;
    case "crouching_block_hold": step({ block: true, down: true }, 18); break;
    case "crouching_block_release": step({ block: true, down: true }, 18); step({ down: true }, 3); break;
    case "standing_heavy_whiff": state.fighters.p2.x = 300; step({ heavy: true }); step({}, 30); state.lastEvent = { tick: state.tick, id: "standing_heavy_whiff", outcome: "whiff" }; break;
    case "standing_heavy_hit": step({ heavy: true }); while (state.lastEvent?.outcome !== "hit" && state.tick < 80) step({}); break;
    case "standing_heavy_block": state.dummyBlockMode = "standing"; step({ heavy: true }); while (state.lastEvent?.outcome !== "block" && state.tick < 80) step({}); break;
    case "light_hit_reaction": step({ command: "force_light_reaction" }); break;
    case "heavy_hit_reaction": step({ command: "force_heavy_reaction" }); break;
    case "light_hit_from_idle": step({ command: "force_light_reaction" }); break;
    case "light_hit_from_walk": state.fighters.p2.state = "walk_forward"; state.fighters.p2.stateTick = 7; step({ command: "force_light_reaction" }); break;
    case "light_hit_from_crouch": state.fighters.p2.state = "crouch"; state.fighters.p2.crouching = true; step({ command: "force_light_reaction" }); break;
    case "light_hit_from_block": state.fighters.p2.state = "standing_block"; state.fighters.p2.blocking = true; startDefensePackage(state.fighters.p2, "standing_block"); step({ command: "force_light_reaction" }); break;
    case "heavy_hit_from_idle": step({ command: "force_heavy_reaction" }); break;
    case "heavy_hit_from_walk": state.fighters.p2.state = "walk_backward"; state.fighters.p2.stateTick = 7; step({ command: "force_heavy_reaction" }); break;
    case "heavy_hit_from_crouch": state.fighters.p2.state = "crouch"; state.fighters.p2.crouching = true; step({ command: "force_heavy_reaction" }); break;
    case "heavy_hit_from_block": state.fighters.p2.state = "crouching_block"; state.fighters.p2.blocking = true; state.fighters.p2.crouching = true; startDefensePackage(state.fighters.p2, "crouching_block", "crouch"); step({ command: "force_heavy_reaction" }); break;
    case "defense_hitstop_freeze": step({ command: "force_heavy_reaction" }); step({}, 3); break;
    case "defense_rapid_hits": step({ command: "force_light_reaction" }); step({}, 2); step({ command: "force_heavy_reaction" }); break;
    case "defense_return_state": state.fighters.p2.state = "crouch"; state.fighters.p2.crouching = true; step({ command: "force_light_reaction" }); step({}, 15); break;
    case "heavy_first_active_hit": startHeavy(); waitForOutcome(["hit"]); break;
    case "heavy_last_active_hit": lateContact(); break;
    case "heavy_counter_hit": state.counterHitArmed = true; startHeavy(); waitForOutcome(["counter_hit"]); break;
    case "heavy_standing_block_v1": state.dummyBlockMode = "standing"; startHeavy(); waitForOutcome(["block"]); break;
    case "heavy_crouching_block_v1": state.dummyBlockMode = "crouching"; startHeavy(); waitForOutcome(["block"]); break;
    case "heavy_whiff_complete": state.fighters.p2.x = 300; startHeavy(); while (state.fighters.p1.state !== "idle" && state.tick < 100) step({}); break;
    case "heavy_corner_hit": state.fighters.p1.x = -420; state.fighters.p2.x = -230; updateFacing(state); startHeavy(); waitForOutcome(["hit"]); break;
    case "heavy_max_range_standing": state.fighters.p1.x = -100; state.fighters.p2.x = 99.5; updateFacing(state); startHeavy(); waitForOutcome(["hit"]); break;
    case "heavy_max_range_crouching": state.fighters.p1.x = -100; state.fighters.p2.x = 95.5; state.dummyCrouching = true; state.fighters.p2.crouching = true; state.fighters.p2.state = "crouch"; updateFacing(state); startHeavy(); waitForOutcome(["hit"]); break;
    case "heavy_just_outside_range": state.fighters.p1.x = -100; state.fighters.p2.x = 100.5; updateFacing(state); startHeavy(); while (state.fighters.p1.moveCursor !== null && state.fighters.p1.moveCursor <= SANDBOX_TUNING.standingHeavy.active.end) step({}); state.lastEvent = { tick: state.tick, id: "standing_heavy_just_outside_range", outcome: "whiff" }; break;
    case "heavy_mirrored_p2": state.fighters.p1.x = 76; state.fighters.p2.x = -76; updateFacing(state); startHeavy(); waitForOutcome(["hit"]); break;
    case "heavy_side_switch": step({ command: "switch_sides" }); startHeavy(); waitForOutcome(["hit"]); break;
    case "heavy_repeated_use": startHeavy(); waitForOutcome(["hit"]); while ((state.fighters.p1.state !== "idle" || state.fighters.p2.hitstun > 0) && state.tick < 150) step({}); state.fighters.p1.x = -76; state.fighters.p2.x = 76; state.lastEvent = null; updateFacing(state); startHeavy(); waitForOutcome(["hit"]); break;
    case "heavy_punish_after_block": state.dummyBlockMode = "standing"; startHeavy(); waitForOutcome(["block"]); while (state.fighters.p2.blockstun > 0 && state.tick < 100) step({}); break;
    case "heavy_punish_after_whiff": state.fighters.p2.x = 300; startHeavy(); while (state.fighters.p1.moveCursor !== null && state.fighters.p1.moveCursor <= SANDBOX_TUNING.standingHeavy.active.end) step({}); break;
    case "heavy_normal_hit_pressure": startHeavy(); waitForOutcome(["hit"]); while (state.fighters.p1.state !== "idle" && state.tick < 120) step({}); break;
    case "heavy_counter_hit_pressure": state.counterHitArmed = true; startHeavy(); waitForOutcome(["counter_hit"]); while (state.fighters.p1.state !== "idle" && state.tick < 120) step({}); break;
    case "heavy_rollback_replay": {
      startHeavy();
      while (state.fighters.p1.moveCursor !== null && state.fighters.p1.moveCursor < 23) step({});
      const checkpoint = clone(state);
      step({}, 48);
      const expectedChecksum = sandboxChecksum(state);
      const replay = clone(checkpoint);
      for (let index = 0; index < 48; index++) tickSwahiliSandbox(replay, {});
      const replayChecksum = sandboxChecksum(replay);
      state.lastEvent = { tick: state.tick, id: expectedChecksum === replayChecksum ? "standing_heavy_rollback_replay_pass" : "standing_heavy_rollback_replay_fail", outcome: replay.lastCombatDiagnostic?.outcome };
      if (expectedChecksum !== replayChecksum) state.warnings.push(`Standing Heavy rollback mismatch: ${expectedChecksum} != ${replayChecksum}`);
      break;
    }
    case "left_corner": state.fighters.p1.x = -410; state.fighters.p2.x = -285; updateFacing(state); break;
    case "right_corner": state.fighters.p1.x = 285; state.fighters.p2.x = 410; updateFacing(state); break;
    case "side_switch": step({ command: "switch_sides" }); break;
    case "mirrored_facing": state.fighters.p1.x = 88; state.fighters.p2.x = -88; updateFacing(state); break;
    case "jump_camera_placeholder":
    case "jump_soft_review": setJumpLandingReviewMode(state, "soft"); step({ up: true }); break;
    case "jump_attack_landing_review": setJumpLandingReviewMode(state, "attack"); step({ up: true }); break;
    case "jump_hard_landing_review": setJumpLandingReviewMode(state, "hard"); step({ up: true }); break;
    case "jump_mirrored_review": state.fighters.p1.x = 88; state.fighters.p2.x = -88; updateFacing(state); setJumpLandingReviewMode(state, "soft"); step({ up: true }); break;
    case "air_mobility_double_jump_review":
      state.fighters.p1.x = -120; state.fighters.p2.x = 40; updateFacing(state);
      setJumpLandingReviewMode(state, "soft"); step({ up: true }); step({}, 5); step({ up: true });
      break;
    case "air_mobility_forward_dash_cross":
      state.fighters.p1.x = -96; state.fighters.p2.x = 40; updateFacing(state);
      setJumpLandingReviewMode(state, "soft"); step({ up: true, right: true }); step({ right: true }, 9); step({ up: true, right: true });
      while (state.fighters.p1.y > -108 && state.tick < 40) step({ right: true });
      step({ right: true, dash: true });
      break;
    case "air_mobility_backward_dash_review":
      state.fighters.p1.x = -40; state.fighters.p2.x = 220; updateFacing(state);
      setJumpLandingReviewMode(state, "soft"); step({ up: true }); step({}, 8); step({ left: true, dash: true });
      break;
    case "air_mobility_mirrored_cross":
      state.fighters.p1.x = 96; state.fighters.p2.x = -40; updateFacing(state);
      setJumpLandingReviewMode(state, "soft"); step({ up: true, left: true }); step({ left: true }, 9); step({ up: true, left: true });
      while (state.fighters.p1.y > -108 && state.tick < 40) step({ left: true });
      step({ left: true, dash: true });
      break;
    case "command_grab_hit": state.fighters.p2.x = state.fighters.p1.x + 124; updateFacing(state); step({ commandGrab: true }); break;
    case "command_grab_whiff": state.fighters.p2.x = state.fighters.p1.x + 240; updateFacing(state); step({ commandGrab: true }); break;
    case "command_grab_mirrored": state.fighters.p1.x = 76; state.fighters.p2.x = -48; updateFacing(state); step({ commandGrab: true }); break;
    case "dash_forward_review": state.fighters.p1.x = -180; state.fighters.p2.x = 360; updateFacing(state); step({ right: true, dash: true }); break;
    case "dash_backward_review": state.fighters.p1.x = -60; state.fighters.p2.x = 320; updateFacing(state); step({ left: true, dash: true }); break;
    case "dash_forward_mirrored": state.fighters.p1.x = 180; state.fighters.p2.x = -360; updateFacing(state); step({ left: true, dash: true }); break;
    case "dash_backward_mirrored": state.fighters.p1.x = 60; state.fighters.p2.x = -320; updateFacing(state); step({ right: true, dash: true }); break;
    case "dash_corner_stop": state.fighters.p1.x = 350; state.fighters.p2.x = 420; updateFacing(state); step({ right: true, dash: true }); break;
    case "dash_repeated_use": {
      state.fighters.p1.x = -260; state.fighters.p2.x = 400; updateFacing(state);
      step({ right: true, dash: true });
      while (state.dashReview.active && state.tick < 80) step({});
      step({});
      step({ right: true, dash: true });
      break;
    }
    case "turn_side_switch_review": step({ command: "play_turn_side_switch" }); break;
    case "turn_side_switch_mirrored": state.fighters.p1.x = 88; state.fighters.p2.x = -88; updateFacing(state); step({ command: "play_turn_side_switch" }); break;
  }
  return state;
}
