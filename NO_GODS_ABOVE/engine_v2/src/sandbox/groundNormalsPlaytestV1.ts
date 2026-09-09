import type {
  CrouchingHeavyTimingProfileId,
  CrouchingLightTimingProfileId,
  CrouchingMediumTimingProfileId,
  SandboxRect,
  SandboxStateName,
  StandingNormalTimingProfileId
} from "./types";

export const GROUND_NORMALS_PLAYTEST_V1_APPROVAL = "APPROVED_AS_CURRENT_SANDBOX_MOVESET_2026_08_12" as const;
export const GROUND_NORMALS_PLAYTEST_V1_GAMEPLAY_VALUES = "TEMPORARY_SANDBOX_GROUND_NORMALS_NOT_PRODUCTION_BALANCE" as const;
export const STANDING_NORMALS_MOTION_V1_DEFAULT_TIMING = "responsive" as const;
export const STANDING_NORMALS_MOTION_V1_RANGE_TIMING_POLICY = "NO_HITSTOP_RANGE_NORMALIZED_MOTION_REVIEW" as const;
export const CROUCHING_LIGHT_V4_DEFAULT_TIMING = "17_ticks" as const;
export const CROUCHING_LIGHT_V4_TIMING_REVIEW_STATUS = "APPROVED_AS_CROUCHING_LIGHT_MOTION_V1" as const;
export const CROUCHING_LIGHT_MOTION_V1_APPROVAL = CROUCHING_LIGHT_V4_TIMING_REVIEW_STATUS;
export const CROUCHING_MEDIUM_OPPOSED_SPLIT_SHOT_V6_DEFAULT_TIMING = "opposed_split_shot_v6" as const;
export const CROUCHING_HEAVY_MOTION_V1_DEFAULT_TIMING = "responsive_heavy_sweep" as const;
export const CROUCHING_MEDIUM_OPPOSED_SPLIT_SHOT_V6_REVIEW_STATUS = GROUND_NORMALS_PLAYTEST_V1_APPROVAL;
export const CROUCHING_HEAVY_MOTION_V1_REVIEW_STATUS = GROUND_NORMALS_PLAYTEST_V1_APPROVAL;

export type GroundNormalPlaytestId =
  | "standing_light"
  | "standing_medium"
  | "crouching_light"
  | "crouching_medium"
  | "crouching_heavy";

export type GroundNormalPlaytestState =
  | "standing_light_review"
  | "standing_medium_review"
  | "crouching_light_review"
  | "crouching_medium_review"
  | "crouching_heavy_review";

export type GroundNormalFrameRole =
  | "compact_chamber"
  | "fast_low_extension"
  | "low_kick_contact"
  | "post_contact_recoil"
  | "post_contact_recoil_connector"
  | "leg_retraction"
  | "planted_recovery"
  | "anticipation"
  | "hip_drive_rise"
  | "rising_knee_contact"
  | "knee_descent"
  | "torso_settling"
  | "guarded_anticipation"
  | "guarded_crouch"
  | "rapid_low_aim"
  | "point_blank_shot"
  | "compact_recoil"
  | "pistol_frame_contact"
  | "immediate_recoil"
  | "crouched_recovery"
  | "kick_acceleration"
  | "low_side_kick_contact"
  | "planted_crouch_recovery"
  | "guarded_crouch_anticipation"
  | "guarded_crouch_preparation"
  | "opposed_split_alignment"
  | "opposed_simultaneous_double_shot_contact"
  | "opposed_dual_recoil"
  | "controlled_pistol_lowering"
  | "deep_rotational_anticipation"
  | "sweep_acceleration"
  | "low_ground_contact"
  | "rotational_carry_past_contact"
  | "committed_follow_through"
  | "recovery_unwind"
  | "contact"
  | "recovery";

export interface GroundNormalExposure {
  sourceId: string;
  role: GroundNormalFrameRole;
  ticks: number;
}

export interface GroundNormalPlaytestDefinition {
  id: GroundNormalPlaytestId;
  state: GroundNormalPlaytestState;
  crouching: boolean;
  reaction: "light" | "heavy";
  exposures: readonly GroundNormalExposure[];
  startupTicks: number;
  activeTicks: number;
  recoveryTicks: number;
  totalTicks: number;
  damage: number;
  hitstop: number;
  hitstun: number;
  blockstun: number;
  hitKnockbackPerTick: number;
  blockPushbackPerTick: number;
  hitbox: SandboxRect;
  hits: readonly GroundNormalHitDefinition[];
}

export interface GroundNormalHitDefinition {
  ordinal: number;
  startTick: number;
  endTick: number;
  damage: number;
  hitstop: number;
  hitstun: number;
  blockstun: number;
  hitKnockbackPerTick: number;
  blockPushbackPerTick: number;
  hitbox: SandboxRect;
  visibleImpactCount: 1;
}

export const STANDING_NORMALS_MOTION_V1_TIMING_PROFILES = {
  responsive: {
    id: "responsive",
    label: "Responsive",
    standing_light: [3, 1, 2, 1, 2, 3],
    standing_medium: [5, 2, 3, 4, 6]
  },
  weight_emphasized: {
    id: "weight_emphasized",
    label: "Weight-emphasized",
    standing_light: [3, 1, 2, 1, 2, 3],
    standing_medium: [6, 2, 3, 4, 7]
  }
} as const satisfies Record<StandingNormalTimingProfileId, {
  id: StandingNormalTimingProfileId;
  label: string;
  standing_light: readonly [number, number, number, number, number, number];
  standing_medium: readonly [number, number, number, number, number];
}>;

export const CROUCHING_LIGHT_V4_TIMING_PROFILES = {
  "17_ticks": {
    id: "17_ticks",
    label: "17 ticks (approved)",
    exposures: [2, 3, 1, 5, 6],
    startupTicks: 5,
    activeTicks: 1,
    recoveryTicks: 11,
    totalTicks: 17
  }
} as const satisfies Record<CrouchingLightTimingProfileId, {
  id: CrouchingLightTimingProfileId;
  label: string;
  exposures: readonly [number, number, number, number, number];
  startupTicks: number;
  activeTicks: number;
  recoveryTicks: number;
  totalTicks: number;
}>;

export const CROUCHING_MEDIUM_OPPOSED_SPLIT_SHOT_V6_TIMING_PROFILES = {
  opposed_split_shot_v6: {
    id: "opposed_split_shot_v6",
    label: "Opposed Split Shot V6 - 60 ticks",
    exposures: [12, 9, 7, 10, 11, 11],
    startupTicks: 21,
    activeTicks: 7,
    recoveryTicks: 32,
    totalTicks: 60,
    hitWindows: [{ ordinal: 1, startTick: 21, endTick: 27 }]
  }
} as const satisfies Record<CrouchingMediumTimingProfileId, {
  id: CrouchingMediumTimingProfileId;
  label: string;
  exposures: readonly [number, number, number, number, number, number];
  startupTicks: number;
  activeTicks: number;
  recoveryTicks: number;
  totalTicks: number;
  hitWindows: readonly [
    { readonly ordinal: 1; readonly startTick: number; readonly endTick: number }
  ];
}>;

export const CROUCHING_HEAVY_MOTION_V1_TIMING_PROFILES = {
  responsive_heavy_sweep: {
    id: "responsive_heavy_sweep",
    label: "A - Responsive heavy sweep (32 ticks)",
    exposures: [7, 3, 4, 3, 4, 5, 6],
    startupTicks: 10,
    activeTicks: 4,
    recoveryTicks: 18,
    totalTicks: 32
  },
  weight_emphasized_heavy_sweep: {
    id: "weight_emphasized_heavy_sweep",
    label: "B - Weight-emphasized heavy sweep (40 ticks)",
    exposures: [9, 4, 5, 4, 5, 6, 7],
    startupTicks: 13,
    activeTicks: 5,
    recoveryTicks: 22,
    totalTicks: 40
  }
} as const satisfies Record<CrouchingHeavyTimingProfileId, {
  id: CrouchingHeavyTimingProfileId;
  label: string;
  exposures: readonly [number, number, number, number, number, number, number];
  startupTicks: number;
  activeTicks: number;
  recoveryTicks: number;
  totalTicks: number;
}>;

const gameplay = {
  standing_light: {
    damage: 45, hitstop: 0, hitstun: 12, blockstun: 7, hitKnockbackPerTick: 1.15, blockPushbackPerTick: 0.45,
    hitbox: { x: 30, y: -118, w: 86, h: 44 }
  },
  standing_medium: {
    damage: 70, hitstop: 0, hitstun: 17, blockstun: 10, hitKnockbackPerTick: 1.55, blockPushbackPerTick: 0.6,
    hitbox: { x: 28, y: -136, w: 108, h: 62 }
  },
  crouching_light: {
    damage: 40, hitstop: 1, hitstun: 11, blockstun: 7, hitKnockbackPerTick: 1.0, blockPushbackPerTick: 0.4,
    hitbox: { x: 24, y: -48, w: 94, h: 34 }
  },
  crouching_medium: {
    damage: 65, hitstop: 10, hitstun: 16, blockstun: 10, hitKnockbackPerTick: 1.45, blockPushbackPerTick: 0.55,
    hitbox: { x: 30, y: -54, w: 132, h: 40 }
  },
  crouching_heavy: {
    damage: 90, hitstop: 6, hitstun: 24, blockstun: 13, hitKnockbackPerTick: 2.0, blockPushbackPerTick: 0.75,
    hitbox: { x: 18, y: -154, w: 104, h: 118 }
  }
} as const;

function definition(
  id: GroundNormalPlaytestId,
  state: GroundNormalPlaytestState,
  crouching: boolean,
  reaction: "light" | "heavy",
  exposures: readonly GroundNormalExposure[],
  activeIndex: number
): GroundNormalPlaytestDefinition {
  const startupTicks = exposures.slice(0, activeIndex).reduce((sum, exposure) => sum + exposure.ticks, 0);
  const activeTicks = exposures[activeIndex].ticks;
  const recoveryTicks = exposures.slice(activeIndex + 1).reduce((sum, exposure) => sum + exposure.ticks, 0);
  const baseGameplay = gameplay[id];
  return {
    id,
    state,
    crouching,
    reaction,
    exposures,
    startupTicks,
    activeTicks,
    recoveryTicks,
    totalTicks: startupTicks + activeTicks + recoveryTicks,
    ...baseGameplay,
    hits: [{
      ordinal: 1,
      startTick: startupTicks,
      endTick: startupTicks + activeTicks - 1,
      damage: baseGameplay.damage,
      hitstop: baseGameplay.hitstop,
      hitstun: baseGameplay.hitstun,
      blockstun: baseGameplay.blockstun,
      hitKnockbackPerTick: baseGameplay.hitKnockbackPerTick,
      blockPushbackPerTick: baseGameplay.blockPushbackPerTick,
      hitbox: baseGameplay.hitbox,
      visibleImpactCount: 1
    }]
  };
}

function standingDefinitions(profileId: StandingNormalTimingProfileId) {
  const profile = STANDING_NORMALS_MOTION_V1_TIMING_PROFILES[profileId];
  return {
    standing_light: definition("standing_light", "standing_light_review", false, "light", [
      { sourceId: "standing_normals_motion_v1_light_01_compact_chamber", role: "compact_chamber", ticks: profile.standing_light[0] },
      { sourceId: "standing_normals_motion_v1_light_02_fast_low_extension", role: "fast_low_extension", ticks: profile.standing_light[1] },
      { sourceId: "standing_normals_motion_v1_light_03_low_kick_contact", role: "low_kick_contact", ticks: profile.standing_light[2] },
      { sourceId: "standing_normals_motion_v1_light_04_post_contact_recoil", role: "post_contact_recoil", ticks: profile.standing_light[3] },
      { sourceId: "standing_normals_motion_v1_light_05_leg_retraction", role: "leg_retraction", ticks: profile.standing_light[4] },
      { sourceId: "standing_normals_motion_v1_light_06_planted_recovery", role: "planted_recovery", ticks: profile.standing_light[5] }
    ], 2),
    standing_medium: definition("standing_medium", "standing_medium_review", false, "light", [
      { sourceId: "standing_normals_motion_v1_medium_01_anticipation", role: "anticipation", ticks: profile.standing_medium[0] },
      { sourceId: "standing_normals_motion_v1_medium_02_hip_drive_rise", role: "hip_drive_rise", ticks: profile.standing_medium[1] },
      { sourceId: "standing_normals_motion_v1_medium_03_rising_knee_contact", role: "rising_knee_contact", ticks: profile.standing_medium[2] },
      { sourceId: "standing_normals_motion_v1_medium_04_knee_descent", role: "knee_descent", ticks: profile.standing_medium[3] },
      { sourceId: "standing_normals_motion_v1_medium_05_torso_settling", role: "torso_settling", ticks: profile.standing_medium[4] }
    ], 2)
  } as const;
}

function crouchingLightDefinition(profileId: CrouchingLightTimingProfileId) {
  const profile = CROUCHING_LIGHT_V4_TIMING_PROFILES[profileId];
  return definition("crouching_light", "crouching_light_review", true, "light", [
    { sourceId: "crouching_light_v4_01_guarded_crouch", role: "guarded_crouch", ticks: profile.exposures[0] },
    { sourceId: "crouching_light_v4_02_rapid_low_aim", role: "rapid_low_aim", ticks: profile.exposures[1] },
    { sourceId: "crouching_light_v4_03_point_blank_shot", role: "point_blank_shot", ticks: profile.exposures[2] },
    { sourceId: "crouching_light_v4_04_compact_recoil", role: "compact_recoil", ticks: profile.exposures[3] },
    { sourceId: "crouching_light_v4_05_crouched_recovery", role: "crouched_recovery", ticks: profile.exposures[4] }
  ], 2);
}

const CROUCHING_LIGHT_DEFINITIONS: Record<CrouchingLightTimingProfileId, GroundNormalPlaytestDefinition> = {
  "17_ticks": crouchingLightDefinition("17_ticks")
};

function crouchingMediumDefinition(profileId: CrouchingMediumTimingProfileId) {
  const profile = CROUCHING_MEDIUM_OPPOSED_SPLIT_SHOT_V6_TIMING_PROFILES[profileId];
  const exposures = [
    { sourceId: "crouching_medium_opposed_split_shot_v6_01_guarded_crouch_preparation", role: "guarded_crouch_preparation", ticks: profile.exposures[0] },
    { sourceId: "crouching_medium_opposed_split_shot_v6_02_opposed_split_alignment", role: "opposed_split_alignment", ticks: profile.exposures[1] },
    { sourceId: "crouching_medium_opposed_split_shot_v6_03_simultaneous_contact", role: "opposed_simultaneous_double_shot_contact", ticks: profile.exposures[2] },
    { sourceId: "crouching_medium_opposed_split_shot_v6_04_opposed_dual_recoil", role: "opposed_dual_recoil", ticks: profile.exposures[3] },
    { sourceId: "crouching_medium_opposed_split_shot_v6_05_controlled_pistol_lowering", role: "controlled_pistol_lowering", ticks: profile.exposures[4] },
    { sourceId: "crouching_medium_opposed_split_shot_v6_06_crouched_recovery", role: "crouched_recovery", ticks: profile.exposures[5] }
  ] as const;
  const base = definition("crouching_medium", "crouching_medium_review", true, "light", exposures, 2);
  const hitbox = gameplay.crouching_medium.hitbox;
  const hits: readonly GroundNormalHitDefinition[] = profile.hitWindows.map((window) => ({
    ...window,
    damage: 65,
    hitstop: 10,
    hitstun: 16,
    blockstun: 10,
    hitKnockbackPerTick: 1.45,
    blockPushbackPerTick: 0.55,
    hitbox,
    visibleImpactCount: 1
  }));
  return {
    ...base,
    startupTicks: profile.startupTicks,
    activeTicks: profile.activeTicks,
    recoveryTicks: profile.recoveryTicks,
    totalTicks: profile.totalTicks,
    hitbox,
    hits
  };
}

function crouchingHeavyDefinition(profileId: CrouchingHeavyTimingProfileId) {
  const profile = CROUCHING_HEAVY_MOTION_V1_TIMING_PROFILES[profileId];
  return definition("crouching_heavy", "crouching_heavy_review", true, "heavy", [
    { sourceId: "crouching_heavy_motion_v1_01_deep_rotational_anticipation", role: "deep_rotational_anticipation", ticks: profile.exposures[0] },
    { sourceId: "crouching_heavy_motion_v1_02_sweep_acceleration", role: "sweep_acceleration", ticks: profile.exposures[1] },
    { sourceId: "crouching_heavy_motion_v1_03_low_ground_contact", role: "low_ground_contact", ticks: profile.exposures[2] },
    { sourceId: "crouching_heavy_motion_v1_04_rotational_carry_past_contact", role: "rotational_carry_past_contact", ticks: profile.exposures[3] },
    { sourceId: "crouching_heavy_motion_v1_05_committed_follow_through", role: "committed_follow_through", ticks: profile.exposures[4] },
    { sourceId: "crouching_heavy_motion_v1_06_recovery_unwind", role: "recovery_unwind", ticks: profile.exposures[5] },
    { sourceId: "crouching_heavy_motion_v1_07_planted_recovery", role: "planted_recovery", ticks: profile.exposures[6] }
  ], 2);
}

const CROUCHING_MEDIUM_DEFINITIONS: Record<CrouchingMediumTimingProfileId, GroundNormalPlaytestDefinition> = {
  opposed_split_shot_v6: crouchingMediumDefinition("opposed_split_shot_v6")
};

const CROUCHING_HEAVY_DEFINITIONS: Record<CrouchingHeavyTimingProfileId, GroundNormalPlaytestDefinition> = {
  responsive_heavy_sweep: crouchingHeavyDefinition("responsive_heavy_sweep"),
  weight_emphasized_heavy_sweep: crouchingHeavyDefinition("weight_emphasized_heavy_sweep")
};

const CROUCHING_NORMALS = {
  crouching_light: CROUCHING_LIGHT_DEFINITIONS[CROUCHING_LIGHT_V4_DEFAULT_TIMING],
  crouching_medium: CROUCHING_MEDIUM_DEFINITIONS[CROUCHING_MEDIUM_OPPOSED_SPLIT_SHOT_V6_DEFAULT_TIMING],
  crouching_heavy: CROUCHING_HEAVY_DEFINITIONS[CROUCHING_HEAVY_MOTION_V1_DEFAULT_TIMING]
} as const;

export const GROUND_NORMALS_PLAYTEST_V1_BY_TIMING = {
  responsive: { ...standingDefinitions("responsive"), ...CROUCHING_NORMALS },
  weight_emphasized: { ...standingDefinitions("weight_emphasized"), ...CROUCHING_NORMALS }
} as const satisfies Record<StandingNormalTimingProfileId, Record<GroundNormalPlaytestId, GroundNormalPlaytestDefinition>>;

export const GROUND_NORMALS_PLAYTEST_V1 = GROUND_NORMALS_PLAYTEST_V1_BY_TIMING[STANDING_NORMALS_MOTION_V1_DEFAULT_TIMING];

const ID_BY_STATE: Partial<Record<SandboxStateName, GroundNormalPlaytestId>> = Object.fromEntries(
  Object.values(GROUND_NORMALS_PLAYTEST_V1).map((candidate) => [candidate.state, candidate.id])
);

export function groundNormalForId(
  id: GroundNormalPlaytestId,
  profileId: StandingNormalTimingProfileId = STANDING_NORMALS_MOTION_V1_DEFAULT_TIMING,
  crouchingLightProfileId: CrouchingLightTimingProfileId = CROUCHING_LIGHT_V4_DEFAULT_TIMING,
  crouchingMediumProfileId: CrouchingMediumTimingProfileId = CROUCHING_MEDIUM_OPPOSED_SPLIT_SHOT_V6_DEFAULT_TIMING,
  crouchingHeavyProfileId: CrouchingHeavyTimingProfileId = CROUCHING_HEAVY_MOTION_V1_DEFAULT_TIMING
) {
  if (id === "crouching_light") return CROUCHING_LIGHT_DEFINITIONS[crouchingLightProfileId];
  if (id === "crouching_medium") return CROUCHING_MEDIUM_DEFINITIONS[crouchingMediumProfileId];
  if (id === "crouching_heavy") return CROUCHING_HEAVY_DEFINITIONS[crouchingHeavyProfileId];
  return GROUND_NORMALS_PLAYTEST_V1_BY_TIMING[profileId][id];
}

export function groundNormalForState(
  state: SandboxStateName,
  profileId: StandingNormalTimingProfileId = STANDING_NORMALS_MOTION_V1_DEFAULT_TIMING,
  crouchingLightProfileId: CrouchingLightTimingProfileId = CROUCHING_LIGHT_V4_DEFAULT_TIMING,
  crouchingMediumProfileId: CrouchingMediumTimingProfileId = CROUCHING_MEDIUM_OPPOSED_SPLIT_SHOT_V6_DEFAULT_TIMING,
  crouchingHeavyProfileId: CrouchingHeavyTimingProfileId = CROUCHING_HEAVY_MOTION_V1_DEFAULT_TIMING
) {
  const id = ID_BY_STATE[state];
  return id ? groundNormalForId(id, profileId, crouchingLightProfileId, crouchingMediumProfileId, crouchingHeavyProfileId) : null;
}

export function isGroundNormalState(state: SandboxStateName): state is GroundNormalPlaytestState {
  return Boolean(ID_BY_STATE[state]);
}

export function groundNormalFrameAtTick(definition: GroundNormalPlaytestDefinition, tick: number) {
  let cursor = Math.max(0, Math.min(tick, definition.totalTicks - 1));
  for (let index = 0; index < definition.exposures.length; index++) {
    const exposure = definition.exposures[index];
    if (cursor < exposure.ticks) return { ...exposure, index: index + 1 };
    cursor -= exposure.ticks;
  }
  const last = definition.exposures.at(-1)!;
  return { ...last, index: definition.exposures.length };
}

export function groundNormalIsActive(definition: GroundNormalPlaytestDefinition, tick: number) {
  return groundNormalHitAtTick(definition, tick) !== null;
}

export function groundNormalHitAtTick(definition: GroundNormalPlaytestDefinition, tick: number) {
  return definition.hits.find((hit) => tick >= hit.startTick && tick <= hit.endTick) ?? null;
}

export function groundNormalPhase(definition: GroundNormalPlaytestDefinition, tick: number) {
  if (tick < definition.startupTicks) return "startup";
  if (tick < definition.startupTicks + definition.activeTicks) return "active";
  return "recovery";
}
