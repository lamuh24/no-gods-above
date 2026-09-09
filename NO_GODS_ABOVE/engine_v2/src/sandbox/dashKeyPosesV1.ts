export type DashKeyPoseDirection = "forward" | "backward";

export const DASH_KEY_POSES_V1_APPROVAL = "awaiting_human_dash_key_pose_review" as const;

export interface DashKeyPoseFrame {
  readonly index: number;
  readonly sourceId: string;
  readonly role: "startup_load" | "launch" | "travel" | "brake_recovery";
  readonly exposureTicks: number;
  readonly supportFoot: string;
  readonly swingFoot: string;
  readonly candidateSha256: string;
}

export const DASH_KEY_POSES_V1_FRAMES: Record<DashKeyPoseDirection, readonly DashKeyPoseFrame[]> = {
  forward: [
    { index: 1, sourceId: "dash_forward_startup_load", role: "startup_load", exposureTicks: 11, supportFoot: "screen_left_loaded_support", swingFoot: "screen_right_ready", candidateSha256: "C92B89F6D5C705A2A5A6239F8A2CB3EE29FF3766EA3E28566DF18427C4B09EE3" },
    { index: 2, sourceId: "dash_forward_launch", role: "launch", exposureTicks: 5, supportFoot: "screen_left_launch_push", swingFoot: "screen_right_leading", candidateSha256: "69CE27860F9A97C5B1301696AEC2CE9A92E15A0FF1C9DE8C0D0872A2CB18BBAE" },
    { index: 3, sourceId: "dash_forward_travel", role: "travel", exposureTicks: 7, supportFoot: "simulation_grounded_visual_travel", swingFoot: "simulation_grounded_visual_travel", candidateSha256: "B313499BB48FCFF4B1958F3933E903E5A96F785B0D2306D60AA632520FACFB10" },
    { index: 4, sourceId: "dash_forward_brake_recovery", role: "brake_recovery", exposureTicks: 13, supportFoot: "screen_right_brake_contact", swingFoot: "screen_left_recovering", candidateSha256: "336B449533FD39325E1A001CA4EF1B884202C6781D855DB214A66E1E551401CD" }
  ],
  backward: [
    { index: 1, sourceId: "dash_backward_startup_load", role: "startup_load", exposureTicks: 11, supportFoot: "both_guarded_load", swingFoot: "none", candidateSha256: "70A07D03325D4BEA900EC84BDFAA7117FFCBB490E2CD635585C47434494B1215" },
    { index: 2, sourceId: "dash_backward_launch", role: "launch", exposureTicks: 6, supportFoot: "screen_right_retreat_push", swingFoot: "screen_left_receding", candidateSha256: "7DF8600BC65D9690638A43CBCFDCFA19130E85FDDA9EAD0074C74047932F831E" },
    { index: 3, sourceId: "dash_backward_travel", role: "travel", exposureTicks: 8, supportFoot: "simulation_grounded_visual_travel", swingFoot: "simulation_grounded_visual_travel", candidateSha256: "8AC7D725836762B5A964EA50809800A83B2BE7FDE605564D1722C69F40A9460E" },
    { index: 4, sourceId: "dash_backward_brake_recovery", role: "brake_recovery", exposureTicks: 13, supportFoot: "screen_left_rear_brake", swingFoot: "screen_right_recovering", candidateSha256: "1C793B0EE0FC4EE5D59E9DD7065EEB421E974F1549E97939106B3EE99D046C98" }
  ]
} as const;

const FORWARD_DISPLACEMENT_WEIGHTS = [
  0, 0, 0.1, 0.15, 0.2, 0.25, 0.35, 0.45, 0.55, 0.7, 0.9,
  2.6, 3.2, 3.7, 3.5, 3.2,
  3.0, 2.8, 2.6, 2.4, 2.2, 2.0, 1.8,
  1.5, 1.25, 1.0, 0.8, 0.65, 0.5, 0.4, 0.3, 0.2, 0.15, 0.1, 0.05, 0
] as const;

const BACKWARD_DISPLACEMENT_WEIGHTS = [
  0, 0, 0.08, 0.12, 0.18, 0.24, 0.32, 0.4, 0.5, 0.62, 0.78,
  2.3, 2.7, 3.0, 2.9, 2.7, 2.5,
  2.3, 2.15, 2.0, 1.85, 1.7, 1.55, 1.4, 1.25,
  1.1, 0.9, 0.75, 0.6, 0.48, 0.38, 0.3, 0.23, 0.17, 0.12, 0.08, 0.04, 0
] as const;

const DISPLACEMENT_WEIGHTS: Record<DashKeyPoseDirection, readonly number[]> = {
  forward: FORWARD_DISPLACEMENT_WEIGHTS,
  backward: BACKWARD_DISPLACEMENT_WEIGHTS
};

const TOTAL_DISTANCE: Record<DashKeyPoseDirection, number> = {
  forward: 200,
  backward: 156
};

export const DASH_KEY_POSES_V1_REVIEW = {
  record: "SWAHILI_DASH_KEY_POSES_V1",
  candidateOnly: true,
  deployable: false,
  productionRoster: false,
  approval: DASH_KEY_POSES_V1_APPROVAL,
  timingAuthority: "POSE_REVIEW_TIMING_FROM_AUTHORED_1X_GIFS",
  movementAuthority: "DETERMINISTIC_SIMULATION_OWNED_REVIEW_CURVE",
  gameplayValues: "TEMPORARY_SANDBOX_DASH_DISTANCE_NOT_PRODUCTION_BALANCE",
  sourceCanvas: [1536, 1536],
  sourceRoot: [768, 1408],
  forward: { totalTicks: 36, intendedDistance: TOTAL_DISTANCE.forward, authoredDurationsMs: [180, 90, 120, 210] },
  backward: { totalTicks: 38, intendedDistance: TOTAL_DISTANCE.backward, authoredDurationsMs: [180, 100, 130, 220] },
  humanArtFlags: [
    "Forward launch and travel still require human judgment for dash versus run or jump readability.",
    "Backward launch and travel still require human judgment for unmistakable retreat while facing the opponent.",
    "The generated mounted scythe has not passed the canonical rigid-prop identity audit."
  ]
} as const;

export function dashTotalTicks(direction: DashKeyPoseDirection) {
  return DASH_KEY_POSES_V1_FRAMES[direction].reduce((total, frame) => total + frame.exposureTicks, 0);
}

export function dashFrameAtTick(direction: DashKeyPoseDirection, tick: number) {
  const frames = DASH_KEY_POSES_V1_FRAMES[direction];
  const clampedTick = Math.max(0, Math.min(dashTotalTicks(direction) - 1, Math.floor(tick)));
  let cursor = 0;
  for (const frame of frames) {
    const end = cursor + frame.exposureTicks;
    if (clampedTick < end) return { frame, frameTick: clampedTick - cursor, startTick: cursor, endTick: end - 1 };
    cursor = end;
  }
  const frame = frames.at(-1)!;
  return { frame, frameTick: frame.exposureTicks - 1, startTick: cursor - frame.exposureTicks, endTick: cursor - 1 };
}

export function dashDisplacementPerTick(direction: DashKeyPoseDirection, tick: number) {
  const weights = DISPLACEMENT_WEIGHTS[direction];
  const index = Math.max(0, Math.min(weights.length - 1, Math.floor(tick)));
  const weightTotal = weights.reduce((sum, value) => sum + value, 0);
  return TOTAL_DISTANCE[direction] * weights[index] / weightTotal;
}

export function dashCurveDistance(direction: DashKeyPoseDirection) {
  return Array.from({ length: dashTotalTicks(direction) }, (_, tick) => dashDisplacementPerTick(direction, tick))
    .reduce((sum, value) => sum + value, 0);
}
