export const COMMAND_GRAB_MOTION_V1_APPROVAL = "APPROVED_AS_COMMAND_GRAB_MOTION_V1_IMMUTABLE_REFERENCE";
export const COMMAND_GRAB_CURRENT_SANDBOX_PLAYTEST_APPROVAL = "APPROVED_AS_CURRENT_SANDBOX_MOVESET_2026_08_12";

// Artwork and root metadata are frozen. Playback speed and combat values below are
// deliberately sandbox-only until human gameplay review approves runtime timing.
export const COMMAND_GRAB_MOTION_V1_REVIEW = {
  status: "approved-current-sandbox-baseline",
  humanPlaytestApproval: COMMAND_GRAB_CURRENT_SANDBOX_PLAYTEST_APPROVAL,
  deployable: false,
  productionRoster: false,
  sourceTicksPerSecond: 60,
  sourceTotalTicks: 85,
  playbackRate: 0.8,
  simulationTotalTicks: 107,
  captureSourceTick: 34,
  releaseSourceTick: 52,
  shotSourceTick: 64,
  landingSourceTick: 73,
  captureRange: 165,
  damage: 220,
  sourcePixelsToSimulationUnits: 0.165,
  gameplayValues: "TEMPORARY_SANDBOX_VALUES_NOT_PRODUCTION_BALANCE"
} as const;

export type CommandGrabVictimPose =
  | "neutral"
  | "low_hip_contact"
  | "hip_trap"
  | "feet_swept"
  | "pelvis_leading_rotation_v2"
  | "low_rotational_carry_camera_axis_midpoint"
  | "victim_crosses_centerline_v2"
  | "airborne_release"
  | "airborne_hang"
  | "shot_react"
  | "post_shot_fall"
  | "fall_low"
  | "downed";

export interface CommandGrabMotionFrameV1 {
  index: number;
  sourceId: string;
  frameId: string;
  role: string;
  exposureTicks: number;
  attackerRoot: readonly [number, number];
  victimRoot: readonly [number, number];
  victimPose: CommandGrabVictimPose;
  startSourceTick: number;
  endSourceTick: number;
}

const authoredFrames = [
  ["command_grab_01_mounted_startup", "01_mounted_startup", "mounted_startup", 5, 768, 1408, 1520, 1408, "neutral"],
  ["command_grab_02_hand_reaches_scythe", "02_hand_reaches_scythe", "hand_reaches_scythe", 4, 768, 1408, 1515, 1408, "neutral"],
  ["command_grab_03_scythe_clears_back", "03_scythe_clears_back", "scythe_clears_back", 5, 768, 1408, 1510, 1408, "neutral"],
  ["command_grab_04_blade_flip_transition", "04_blade_flip_transition", "blade_flip_transition", 4, 768, 1408, 1510, 1408, "neutral"],
  ["command_grab_05_hook_ready_maximum_coil", "05_hook_ready_maximum_coil", "hook_ready_maximum_coil", 8, 768, 1408, 1508, 1408, "neutral"],
  ["command_grab_06_lead_foot_plant_weapon_lag", "06_lead_foot_plant_weapon_lag", "lead_foot_plant_weapon_lag", 4, 768, 1408, 1505, 1408, "neutral"],
  ["command_grab_07_acceleration_begins_scoop_curve", "07_acceleration_begins_scoop_curve", "acceleration_begins_scoop_curve", 2, 768, 1408, 1502, 1408, "neutral"],
  ["command_grab_08_scoop_acceleration_entry", "07_scoop_acceleration_entry", "scoop_acceleration_entry", 1, 768, 1408, 1500, 1408, "neutral"],
  ["command_grab_09_maximum_speed_scoop", "08_maximum_speed_scoop", "maximum_speed_scoop", 1, 768, 1408, 1460, 1408, "neutral"],
  ["command_grab_10_first_low_hook_contact", "09_first_low_hook_contact", "first_low_hook_contact", 4, 768, 1408, 1320, 1408, "low_hip_contact"],
  ["command_grab_11_secure_scoop_catch", "10_impact_compression_secure_scoop_catch", "impact_compression_secure_scoop_catch", 4, 768, 1408, 1240, 1408, "hip_trap"],
  ["command_grab_12_feet_swept_out_locked", "12_feet_swept_out_locked", "feet_swept_out", 2, 768, 1408, 1210, 1380, "feet_swept"],
  ["command_grab_13_pelvis_leading_rotation_v2", "13_pelvis_leading_rotation_v2", "pelvis_leading_rotation_v2", 3, 825, 1408, 1080, 1230, "pelvis_leading_rotation_v2"],
  ["command_grab_14_locked_low_carry", "14_locked_low_carry", "low_carry_midpoint_edge_on", 2, 900, 1408, 950, 1163, "low_rotational_carry_camera_axis_midpoint"],
  ["command_grab_15_continued_carry_v2", "15_continued_carry_head_direction_v2", "continued_carry_correct_head_direction", 3, 995, 1408, 650, 1010, "victim_crosses_centerline_v2"],
  ["command_grab_16_airborne_release_v2", "16_airborne_release_head_direction_v2", "opposite_side_airborne_release_correct_head_direction", 4, 1062, 1408, 440, 980, "airborne_release"],
  ["command_grab_17_head_reorientation_connector_v2", "16_to_17_head_reorientation_connector_v2", "post_release_scythe_reorientation", 1, 1062, 1408, 440, 980, "airborne_release"],
  ["command_grab_18_airborne_hang", "16_airborne_hang", "airborne_hang", 4, 1062, 1408, 300, 880, "airborne_hang"],
  ["command_grab_19_aim_at_midair", "17_aim_at_midair", "aim_at_midair", 3, 1062, 1408, 240, 850, "airborne_hang"],
  ["command_grab_20_midair_shot", "18_midair_shot", "midair_shot", 3, 1062, 1408, 210, 870, "shot_react"],
  ["command_grab_21_post_shot_fall", "19_post_shot_fall", "post_shot_fall", 3, 1062, 1408, 190, 1080, "post_shot_fall"],
  ["command_grab_22_fall_toward_floor", "20_fall_toward_floor", "fall_toward_floor", 3, 1062, 1408, 190, 1290, "fall_low"],
  ["command_grab_23_landing_after_shot", "21_landing_after_shot", "landing_after_shot", 4, 1062, 1408, 190, 1408, "downed"],
  ["command_grab_24_recovery", "22_recovery", "recovery", 8, 1062, 1408, 190, 1408, "downed"]
] as const;

let sourceCursor = 0;
export const COMMAND_GRAB_MOTION_V1_FRAMES: readonly CommandGrabMotionFrameV1[] = authoredFrames.map((frame, zeroIndex) => {
  const [sourceId, frameId, role, exposureTicks, attackerX, attackerY, victimX, victimY, victimPose] = frame;
  const startSourceTick = sourceCursor;
  sourceCursor += exposureTicks;
  return {
    index: zeroIndex + 1,
    sourceId,
    frameId,
    role,
    exposureTicks,
    attackerRoot: [attackerX, attackerY],
    victimRoot: [victimX, victimY],
    victimPose: victimPose as CommandGrabVictimPose,
    startSourceTick,
    endSourceTick: sourceCursor - 1
  };
});

if (sourceCursor !== COMMAND_GRAB_MOTION_V1_REVIEW.sourceTotalTicks) {
  throw new Error(`Command Grab Motion V1 exposure drift: ${sourceCursor} source ticks`);
}

export function commandGrabSourceTickAtSimulationTick(simulationTick: number) {
  return Math.min(
    COMMAND_GRAB_MOTION_V1_REVIEW.sourceTotalTicks - 1,
    Math.floor(Math.max(0, simulationTick) * COMMAND_GRAB_MOTION_V1_REVIEW.playbackRate)
  );
}

export function commandGrabFrameAtSourceTick(sourceTick: number) {
  const bounded = Math.max(0, Math.min(COMMAND_GRAB_MOTION_V1_REVIEW.sourceTotalTicks - 1, sourceTick));
  return COMMAND_GRAB_MOTION_V1_FRAMES.find((frame) => bounded >= frame.startSourceTick && bounded <= frame.endSourceTick)
    ?? COMMAND_GRAB_MOTION_V1_FRAMES.at(-1)!;
}
