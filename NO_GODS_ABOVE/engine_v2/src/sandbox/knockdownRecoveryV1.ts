export const KNOCKDOWN_RECOVERY_MOTION_V1_APPROVAL = "APPROVED_AS_KNOCKDOWN_RECOVERY_MOTION_V1" as const;

export interface KnockdownRecoveryFrameV1 {
  readonly index: number;
  readonly sourceId: string;
  readonly role: string;
  readonly exposureTicks: number;
  readonly grounded: boolean;
  readonly support: string;
}

export const KNOCKDOWN_RECOVERY_MOTION_V1_FRAMES: readonly KnockdownRecoveryFrameV1[] = [
  { index: 1, sourceId: "knockdown_recovery_01_launch_reaction", role: "launch_reaction", exposureTicks: 4, grounded: false, support: "airborne_none" },
  { index: 2, sourceId: "knockdown_recovery_02_airborne_tumble", role: "airborne_tumble", exposureTicks: 4, grounded: false, support: "airborne_none" },
  { index: 3, sourceId: "knockdown_recovery_03_ground_impact", role: "ground_impact", exposureTicks: 2, grounded: true, support: "back_and_coat_floor_contact" },
  { index: 4, sourceId: "knockdown_recovery_04_impact_settle", role: "impact_settle", exposureTicks: 2, grounded: true, support: "back_hips_and_coat_floor_contact" },
  { index: 5, sourceId: "knockdown_recovery_05_face_up_knockdown", role: "face_up_knockdown", exposureTicks: 18, grounded: true, support: "back_and_coat_floor_contact" },
  { index: 6, sourceId: "knockdown_recovery_06_shoulder_roll_knee_draw", role: "shoulder_roll_knee_draw", exposureTicks: 3, grounded: true, support: "back_opposite_shoulder_and_forearm_transition" },
  { index: 7, sourceId: "knockdown_recovery_07_face_up_roll_brace", role: "face_up_roll_brace", exposureTicks: 4, grounded: true, support: "forearm_hip_and_lower_leg" },
  { index: 8, sourceId: "knockdown_recovery_08_push_to_kneel", role: "push_to_kneel", exposureTicks: 4, grounded: true, support: "planted_hand_knee_and_foot" },
  { index: 9, sourceId: "knockdown_recovery_09_neutral_get_up", role: "neutral_get_up", exposureTicks: 6, grounded: true, support: "planted_hand_knee_and_foot" },
  { index: 10, sourceId: "knockdown_recovery_10_rise_to_stand", role: "rise_to_stand", exposureTicks: 4, grounded: true, support: "both_feet_bent_knee_stand" }
] as const;

export const KNOCKDOWN_RECOVERY_MOTION_V1_REVIEW = {
  record: "SWAHILI_KNOCKDOWN_RECOVERY_MOTION_V1",
  approval: KNOCKDOWN_RECOVERY_MOTION_V1_APPROVAL,
  status: "sandbox_approved_motion",
  candidateOnly: true,
  deployable: false,
  cursorOwner: "sandbox_simulation",
  rootMotionOwner: "sandbox_simulation",
  commandGrabStartsAtFrame: 3,
  commandGrabKnockdownTicks: KNOCKDOWN_RECOVERY_MOTION_V1_FRAMES.slice(2).reduce((sum, frame) => sum + frame.exposureTicks, 0),
  fullSequenceTicks: KNOCKDOWN_RECOVERY_MOTION_V1_FRAMES.reduce((sum, frame) => sum + frame.exposureTicks, 0),
  wakeupInvulnerability: "not_authored_in_preview_sandbox",
  gameplayValues: "TEMPORARY_SANDBOX_KNOCKDOWN_TIMING_NOT_PRODUCTION_BALANCE"
} as const;

export function commandGrabKnockdownRecoveryFrameAtTick(tick: number): KnockdownRecoveryFrameV1 | null {
  if (tick < 0) return KNOCKDOWN_RECOVERY_MOTION_V1_FRAMES[2];
  let cursor = tick;
  for (const frame of KNOCKDOWN_RECOVERY_MOTION_V1_FRAMES.slice(2)) {
    if (cursor < frame.exposureTicks) return frame;
    cursor -= frame.exposureTicks;
  }
  return null;
}
