export type AirDashMotionDirection = "forward" | "backward";

export type AirDashMotionFrameV1 = {
  index: number;
  sourceId: string;
  role: string;
  exposureTicks: number;
};

export const AIR_DASH_MOTION_V1_APPROVAL = "awaiting_human_air_dash_motion_v1_live_review";
export const AIR_DASH_SIDE_SWITCH_V2_APPROVAL = "awaiting_human_air_dash_side_switch_v2_live_review";

export const AIR_DASH_MOTION_V1_REVIEW = {
  record: "SWAHILI_AIR_DASH_MOTION_V1",
  status: "candidate-only",
  deployable: false,
  productionRoster: false,
  runtimeIntegrated: true,
  runtimeSurface: "isolated_engine_v2_swahili_development_sandbox",
  rootMotionAuthority: "deterministic_simulation",
  animationControlsCollision: false,
  frameCountPerDirection: 4,
  activeTicks: 12,
  exposureTicks: [2, 3, 4, 3],
  gameplayValues: "UNCHANGED_TEMPORARY_SANDBOX_AIR_MOBILITY_NOT_PRODUCTION_BALANCE",
  approval: AIR_DASH_MOTION_V1_APPROVAL
} as const;

export const AIR_DASH_MOTION_V1_FRAMES: Record<AirDashMotionDirection, readonly AirDashMotionFrameV1[]> = {
  forward: [
    { index: 1, sourceId: "air_dash_forward_01_air_brace", role: "air_brace", exposureTicks: 2 },
    { index: 2, sourceId: "air_dash_forward_02_forward_burst", role: "forward_burst", exposureTicks: 3 },
    { index: 3, sourceId: "air_dash_forward_03_forward_travel", role: "forward_travel", exposureTicks: 4 },
    { index: 4, sourceId: "air_dash_forward_04_air_brake", role: "air_brake", exposureTicks: 3 }
  ],
  backward: [
    { index: 1, sourceId: "air_dash_backward_01_guarded_recoil", role: "guarded_recoil", exposureTicks: 2 },
    { index: 2, sourceId: "air_dash_backward_02_backward_burst", role: "backward_burst", exposureTicks: 3 },
    { index: 3, sourceId: "air_dash_backward_03_max_retreat", role: "max_retreat", exposureTicks: 4 },
    { index: 4, sourceId: "air_dash_backward_04_air_brake", role: "air_brake", exposureTicks: 3 }
  ]
} as const;

export const AIR_DASH_SIDE_SWITCH_V2_REVIEW = {
  record: "SWAHILI_AIR_DASH_SIDE_SWITCH_V2",
  status: "candidate-only",
  deployable: false,
  productionRoster: false,
  runtimeIntegrated: true,
  runtimeSurface: "isolated_engine_v2_swahili_development_sandbox",
  rootMotionAuthority: "deterministic_simulation",
  facingAuthority: "deterministic_simulation",
  animationControlsCollision: false,
  newFrameCount: 1,
  reusedFrameCount: 4,
  activeTicks: 12,
  exposureTicks: [2, 3, 2, 1, 2, 2],
  motionSpine: [
    "air_brace",
    "forward_burst",
    "forward_travel_pre_cross",
    "airborne_yaw_rotation_midpoint",
    "backdash_carry_post_cross",
    "backdash_brake_post_cross"
  ],
  gameplayValues: "UNCHANGED_TEMPORARY_SANDBOX_AIR_MOBILITY_NOT_PRODUCTION_BALANCE",
  approval: AIR_DASH_SIDE_SWITCH_V2_APPROVAL
} as const;

export const AIR_DASH_SIDE_SWITCH_V2_FRAME: AirDashMotionFrameV1 = {
  index: 4,
  sourceId: "air_dash_side_switch_01_rotation_midpoint",
  role: "airborne_yaw_rotation_midpoint",
  exposureTicks: 1
};

export function airDashMotionFrameAtTick(direction: AirDashMotionDirection, airDashTick: number) {
  const frames = AIR_DASH_MOTION_V1_FRAMES[direction];
  const clampedTick = Math.max(1, Math.min(AIR_DASH_MOTION_V1_REVIEW.activeTicks, airDashTick));
  let cursor = 0;
  for (const frame of frames) {
    cursor += frame.exposureTicks;
    if (clampedTick <= cursor) return frame;
  }
  return frames.at(-1)!;
}

export function airDashSideSwitchFrameAtTick(airDashTick: number, sideSwitchTick: number) {
  if (airDashTick < sideSwitchTick) return airDashMotionFrameAtTick("forward", airDashTick);
  if (airDashTick === sideSwitchTick) return AIR_DASH_SIDE_SWITCH_V2_FRAME;
  if (airDashTick <= sideSwitchTick + 2) {
    return { ...AIR_DASH_MOTION_V1_FRAMES.backward[2], index: 5, role: "backdash_carry_post_cross", exposureTicks: 2 };
  }
  return { ...AIR_DASH_MOTION_V1_FRAMES.backward[3], index: 6, role: "backdash_brake_post_cross", exposureTicks: 2 };
}
