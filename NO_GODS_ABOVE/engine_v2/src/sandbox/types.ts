export type SandboxFighterId = "p1" | "p2";
export type SandboxDummyBlockMode = "off" | "standing" | "crouching";
export type SandboxReaction = "none" | "light" | "heavy";
export type ForwardWalkV2TimingProfileId = "candidate_current_58_ticks" | "even_40_ticks" | "contact_weighted_40_ticks";
export type StandingNormalTimingProfileId = "responsive" | "weight_emphasized";
export type CrouchingLightTimingProfileId = "17_ticks";
export type CrouchingMediumTimingProfileId = "opposed_split_shot_v6";
export type AirNormalInputId = "air_light" | "air_medium" | "air_heavy";
export type CrouchingHeavyTimingProfileId = "responsive_heavy_sweep" | "weight_emphasized_heavy_sweep";
export type DefenseReactionPackageId = "standing_block" | "crouching_block" | "light_hit_reaction" | "heavy_hit_reaction";
export type DashReviewDirection = "forward" | "backward";
export type JumpLandingReviewMode = "soft" | "attack" | "hard";
export type SandboxReturnState = "idle" | "crouch" | "standing_block" | "crouching_block";
export type SandboxStateName =
  | "idle"
  | "walk_forward"
  | "walk_backward"
  | "dash_forward_review"
  | "dash_backward_review"
  | "turn_side_switch_review"
  | "crouch"
  | "standing_block"
  | "crouching_block"
  | "standing_light_review"
  | "standing_medium_review"
  | "crouching_light_review"
  | "crouching_medium_review"
  | "crouching_heavy_review"
  | "standing_heavy"
  | "grave_furrow_review"
  | "grave_furrow_launch_victim"
  | "universal_grab_review"
  | "command_grab_review"
  | "command_grab_victim"
  | "command_grab_downed"
  | "light_hit_reaction"
  | "heavy_hit_reaction"
  | "jump_anticipation_review"
  | "jump_airborne_review"
  | "air_light_review"
  | "air_medium_review"
  | "air_heavy_review"
  | "jump_landing_soft_review"
  | "jump_landing_attack_review"
  | "jump_landing_hard_review";

export type SandboxCommand =
  | "reset_round"
  | "switch_sides"
  | "play_turn_side_switch"
  | "toggle_dummy_block"
  | "toggle_counter_hit"
  | "force_light_reaction"
  | "force_heavy_reaction";

export interface SandboxInputFrame {
  left?: boolean;
  right?: boolean;
  down?: boolean;
  up?: boolean;
  block?: boolean;
  light?: boolean;
  medium?: boolean;
  heavy?: boolean;
  grab?: boolean;
  commandGrab?: boolean;
  graveFurrow?: boolean;
  dash?: boolean;
  command?: SandboxCommand;
}

export interface SandboxRect { x: number; y: number; w: number; h: number; }

export interface SandboxFighterState {
  id: SandboxFighterId;
  x: number;
  y: number;
  vx: number;
  vy: number;
  facing: 1 | -1;
  grounded: boolean;
  state: SandboxStateName;
  stateTick: number;
  health: number;
  meter: number;
  damageScaling: number;
  moveCursor: number | null;
  attackConnected: boolean;
  groundNormalConnectedHitOrdinals: number[];
  airNormalConnectedHitOrdinals: number[];
  airNormalContactHoldApplied: boolean;
  hitstop: number;
  hitstun: number;
  blockstun: number;
  blocking: boolean;
  crouching: boolean;
  reaction: SandboxReaction;
  defensePackageId: DefenseReactionPackageId | null;
  defenseCursor: number | null;
  defensePackageInstance: number;
  returnState: SandboxReturnState;
  lastPresentationEventId: string | null;
  forwardWalkTimingProfile: ForwardWalkV2TimingProfileId;
  standingNormalTimingProfile: StandingNormalTimingProfileId;
  crouchingLightTimingProfile: CrouchingLightTimingProfileId;
  crouchingMediumTimingProfile: CrouchingMediumTimingProfileId;
  crouchingHeavyTimingProfile: CrouchingHeavyTimingProfileId;
  presentationRotationZ: number;
  presentationScale: number;
  presentationRenderOrder: number | null;
  presentationShadowVisible: boolean;
  presentationRootOffsetX: number;
  presentationRootOffsetY: number;
}

export interface CommandGrabRuntimeV1 {
  active: boolean;
  simulationTick: number;
  sourceTick: number;
  frameIndex: number;
  sourceId: string;
  role: string;
  victimPose: string;
  attackerStartX: number;
  startingFacing: 1 | -1;
  captured: boolean;
  captureChecked: boolean;
  damageApplied: boolean;
  sideSwitchCompleted: boolean;
  initialVictimX: number;
  victimTrackScale: number;
  launchDistance: number;
  maxLaunchDistance: number;
  launchClippedByStage: boolean;
  launchPhase: "pre_release" | "release_impulse" | "far_airborne_launch" | "shot_suspension" | "post_shot_descent" | "grounded_finish";
  shotVisualHitRegistered: boolean;
  shotVisualHitCount: 0 | 1;
  result: "pending" | "hit" | "whiff";
  playbackRate: 0.8;
  gameplayValues: "TEMPORARY_SANDBOX_VALUES_NOT_PRODUCTION_BALANCE";
}

export interface DashReviewRuntimeV1 {
  active: boolean;
  direction: DashReviewDirection;
  simulationTick: number;
  frameIndex: number;
  sourceId: string;
  role: string;
  startX: number;
  startingFacing: 1 | -1;
  intendedDistance: number;
  actualDistance: number;
  clippedByStageOrPushbox: boolean;
  result: "idle" | "playing" | "complete";
  gameplayValues: "TEMPORARY_SANDBOX_DASH_DISTANCE_NOT_PRODUCTION_BALANCE";
}

export interface JumpFallLandingReviewRuntimeV1 {
  active: boolean;
  phase: "idle" | "anticipation" | "takeoff" | "rising" | "apex" | "falling" | "landing" | "complete";
  landingMode: JumpLandingReviewMode;
  simulationTick: number;
  frameIndex: number;
  sourceId: string;
  role: string;
  startX: number;
  startingFacing: 1 | -1;
  takeoffTick: number | null;
  apexTick: number | null;
  landingTick: number | null;
  peakY: number;
  airborneTicks: number;
  horizontalDistance: number;
  launchVelocityX: number;
  result: "idle" | "playing" | "complete";
  gameplayValues: "EXISTING_SANDBOX_JUMP_PHYSICS_UNCHANGED";
}

export interface AirMobilityReviewRuntimeV1 {
  jumpsUsed: 0 | 1 | 2;
  airDashesUsed: 0 | 1;
  airNormalActionsUsed: 0 | 1 | 2 | 3;
  queuedAirNormal: AirNormalInputId | null;
  doubleJumpTriggered: boolean;
  airDashActive: boolean;
  airDashDirection: DashReviewDirection;
  airDashTick: number;
  airDashStartX: number;
  airDashStartingFacing: 1 | -1;
  airDashTravelSign: 1 | -1;
  airDashActualDistance: number;
  resumeVelocityY: number;
  crossedOpponent: boolean;
  sideSwitchTick: number | null;
  result: "idle" | "double_jump" | "air_dash_playing" | "air_dash_complete" | "landed";
  gameplayValues: "TEMPORARY_SANDBOX_AIR_MOBILITY_NOT_PRODUCTION_BALANCE";
}

export interface TurnSideSwitchReviewRuntimeV1 {
  active: boolean;
  simulationTick: number;
  frameIndex: number;
  sourceId: string;
  role: string;
  rootX: number;
  startingFacing: 1 | -1;
  endingFacing: 1 | -1;
  opponentStartX: number;
  opponentEndX: number;
  opponentProgress: number;
  facingSwapCount: number;
  rootDisplacement: number;
  result: "idle" | "playing" | "complete";
  gameplayValues: "TEMPORARY_SANDBOX_OPPONENT_CROSSING_NOT_PRODUCTION_GAMEPLAY";
}

export interface GraveFurrowRuntimeV1 {
  active: boolean;
  simulationTick: number;
  frameIndex: number;
  sourceId: string;
  role: string;
  startX: number;
  startingFacing: 1 | -1;
  actualRootAdvance: number;
  contactTick: number | null;
  contactOutcome: "hit" | "block" | null;
  victimLaunched: boolean;
  result: "idle" | "playing" | "hit" | "block" | "whiff" | "complete";
  gameplayValues: "TEMPORARY_SANDBOX_GRAVE_FURROW_VALUES_NOT_PRODUCTION_BALANCE";
}

export interface ForwardWalkV2Diagnostic {
  timingProfileId: ForwardWalkV2TimingProfileId;
  motionCurveVersion: string;
  cycleTicks: number;
  simulationTick: number;
  artworkFrame: number;
  sourceId: string;
  gaitRole: string;
  supportFoot: string;
  swingFoot: string;
  fighterRoot: number;
  plantedFootWorldPosition: number | null;
  perTickDisplacement: number;
  accumulatedDisplacement: number;
  cycleAccumulatedDisplacement: number;
  footSkateEstimate: number;
  peakFootSkateEstimate: number;
  meanFootSkateEstimate: number;
  footSkateSamples: number;
  transitionState: string;
  incompleteBackwardWalkWarning: string | null;
}

export interface SandboxEvent {
  tick: number;
  id: string;
  outcome?: "whiff" | "hit" | "counter_hit" | "block";
  packageId?: DefenseReactionPackageId;
  presentationEventId?: string;
  deduplicated?: boolean;
  presentationType?: string;
  presentationProfile?: string;
  presentationSocket?: string;
  optional?: boolean;
  hitOrdinal?: number;
  visibleImpactCount?: number;
}

export interface SandboxCombatDiagnostic {
  profileId: "SWAHILI_STANDING_HEAVY_COMBAT_PROFILE_V1";
  approval: "APPROVED_RECOMMENDED_PROFILE";
  moveTick: number;
  contactTick: number | null;
  outcome: "whiff" | "hit" | "counter_hit" | "block";
  resultingAdvantage: number | null;
  remainingRecovery: number;
  hitstop: number;
  hitstun: number;
  blockstun: number;
  pushbackPerTick: number;
  meterGain: number;
  scalingBefore: number;
  scalingAfter: number;
  damageApplied: number;
  rootSeparation: number;
  hitbox: SandboxRect | null;
  defenderHurtboxes: SandboxRect[];
  presentationEvents: readonly string[];
}

export interface SwahiliSandboxState {
  schemaVersion: "1.0.0-swahili-sandbox";
  status: "preview-only";
  candidateOnly: true;
  deployable: false;
  productionRoster: false;
  seed: number;
  tick: number;
  stage: { left: number; right: number; groundY: number; ceilingY: number };
  fighters: Record<SandboxFighterId, SandboxFighterState>;
  dummyBlockMode: SandboxDummyBlockMode;
  dummyCrouching: boolean;
  counterHitArmed: boolean;
  previousP1Input: SandboxInputFrame;
  warnings: string[];
  lastEvent: SandboxEvent | null;
  presentationEvents: SandboxEvent[];
  presentationEventLedger: string[];
  lastCombatDiagnostic: SandboxCombatDiagnostic | null;
  forwardWalkV2Diagnostic: ForwardWalkV2Diagnostic;
  commandGrab: CommandGrabRuntimeV1;
  dashReview: DashReviewRuntimeV1;
  jumpFallLandingReview: JumpFallLandingReviewRuntimeV1;
  airMobilityReview: AirMobilityReviewRuntimeV1;
  turnSideSwitchReview: TurnSideSwitchReviewRuntimeV1;
  graveFurrow: GraveFurrowRuntimeV1;
}

export interface SandboxAnimationFrame {
  sourceId: string;
  state: SandboxStateName;
  frameIndex: number;
  role: string;
  supportFoot: string;
  swingFoot: string;
  walkCyclePhase: string | null;
  fallbackWarning: string | null;
  approval: string;
  presentationFacingOverride?: 1 | -1 | null;
}
