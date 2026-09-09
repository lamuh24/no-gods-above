import type { JumpLandingReviewMode, SandboxAnimationFrame, SandboxFighterState } from "./types";

export const JUMP_FALL_LANDING_V1_APPROVAL = "awaiting_human_jump_fall_landing_live_review" as const;

export const JUMP_FALL_LANDING_V1_REVIEW = {
  record: "SWAHILI_JUMP_FALL_LANDING_KEY_POSES_V1_LIVE_REVIEW",
  status: "candidate-only",
  deployable: false,
  productionRoster: false,
  trajectoryAuthority: "existing_sandbox_simulation_only",
  artworkAuthority: "pose_selection_only",
  connectorsAuthorized: false,
  runtimeIntegrationScope: "isolated_engine_v2_swahili_development_sandbox",
  anticipationTicks: 4,
  takeoffPoseTicks: 3,
  apexVelocityWindow: 2.5,
  landingHoldTicks: {
    soft: 6,
    attack: 9,
    hard: 12
  },
  gameplayValues: "EXISTING_SANDBOX_JUMP_PHYSICS_UNCHANGED"
} as const;

export const JUMP_FALL_LANDING_V1_FRAMES = [
  { index: 1, sourceId: "jump_v1_anticipation", role: "jump_anticipation", verticalState: "grounded_pre_takeoff" },
  { index: 2, sourceId: "jump_v1_takeoff", role: "takeoff", verticalState: "rising_takeoff" },
  { index: 3, sourceId: "jump_v1_rising", role: "rising_jump", verticalState: "rising" },
  { index: 4, sourceId: "jump_v1_apex", role: "jump_apex", verticalState: "apex_near_zero_vertical_velocity" },
  { index: 5, sourceId: "jump_v1_falling", role: "falling", verticalState: "falling" },
  { index: 6, sourceId: "jump_v1_soft_landing", role: "soft_landing", verticalState: "grounded_soft_landing_contact" },
  { index: 7, sourceId: "jump_v1_attack_landing_recovery", role: "attack_landing_recovery", verticalState: "grounded_attack_landing_recovery" },
  { index: 8, sourceId: "jump_v1_hard_landing_compatibility", role: "hard_landing_compatibility", verticalState: "grounded_hard_landing_contact" }
] as const;

const frameByIndex = (index: number) => JUMP_FALL_LANDING_V1_FRAMES[index - 1];

export function jumpLandingFrame(mode: JumpLandingReviewMode) {
  return frameByIndex(mode === "soft" ? 6 : mode === "attack" ? 7 : 8);
}

export function jumpReviewFrame(f: SandboxFighterState, landingMode: JumpLandingReviewMode) {
  if (f.state === "jump_anticipation_review") return frameByIndex(1);
  if (f.state === "jump_landing_soft_review") return frameByIndex(6);
  if (f.state === "jump_landing_attack_review") return frameByIndex(7);
  if (f.state === "jump_landing_hard_review") return frameByIndex(8);
  if (f.grounded) return jumpLandingFrame(landingMode);
  if (f.stateTick <= JUMP_FALL_LANDING_V1_REVIEW.takeoffPoseTicks) return frameByIndex(2);
  if (f.vy < -JUMP_FALL_LANDING_V1_REVIEW.apexVelocityWindow) return frameByIndex(3);
  if (f.vy <= JUMP_FALL_LANDING_V1_REVIEW.apexVelocityWindow) return frameByIndex(4);
  return frameByIndex(5);
}

export function jumpReviewAnimation(f: SandboxFighterState, landingMode: JumpLandingReviewMode): SandboxAnimationFrame {
  const frame = jumpReviewFrame(f, landingMode);
  const grounded = frame.index === 1 || frame.index >= 6;
  return {
    sourceId: frame.sourceId,
    state: f.state,
    frameIndex: frame.index - 1,
    role: frame.role,
    supportFoot: grounded ? "grounded_pose_root" : "airborne_none",
    swingFoot: grounded ? "grounded_pose_root" : "airborne_none",
    walkCyclePhase: `${frame.index}/8 ${frame.verticalState}`,
    fallbackWarning: null,
    approval: JUMP_FALL_LANDING_V1_APPROVAL
  };
}

export function jumpLandingState(mode: JumpLandingReviewMode) {
  if (mode === "attack") return "jump_landing_attack_review" as const;
  if (mode === "hard") return "jump_landing_hard_review" as const;
  return "jump_landing_soft_review" as const;
}

export function jumpLandingHoldTicks(mode: JumpLandingReviewMode) {
  return JUMP_FALL_LANDING_V1_REVIEW.landingHoldTicks[mode];
}
