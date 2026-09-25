import type { SandboxRect, SandboxStateName } from "./types";

export const AIR_NORMALS_PLAYTEST_V1_STATUS = "approved-current-sandbox-baseline" as const;
export const AIR_NORMALS_PLAYTEST_V1_GATE = "APPROVED_AS_CURRENT_SANDBOX_MOVESET_2026_08_12" as const;
export const AIR_NORMALS_PLAYTEST_V1_GAMEPLAY_VALUES = "TEMPORARY_SANDBOX_AIR_NORMALS_NOT_PRODUCTION_BALANCE" as const;
export const AIR_NORMALS_PLAYTEST_V1_MAX_ACTIONS = 3 as const;

export type AirNormalPlaytestId = "air_light" | "air_medium" | "air_heavy";
export type AirNormalPlaytestState = "air_light_review" | "air_medium_review" | "air_heavy_review";

export interface AirNormalExposure {
  sourceId: string;
  role: string;
  ticks: number;
  approval: string;
  fallbackWarning: string | null;
}

export interface AirNormalPlaytestDefinition {
  id: AirNormalPlaytestId;
  state: AirNormalPlaytestState;
  reaction: "light" | "heavy";
  exposures: readonly AirNormalExposure[];
  startupTicks: number;
  activeTicks: number;
  recoveryTicks: number;
  totalTicks: number;
  damage: number;
  attackerContactHoldTicks: number;
  hitstop: number;
  hitstun: number;
  blockstun: number;
  hitKnockbackPerTick: number;
  blockPushbackPerTick: number;
  hitbox: SandboxRect;
  cancelOnContact: readonly AirNormalPlaytestId[];
  candidateArtComplete: boolean;
}

const airLightApproval = AIR_NORMALS_PLAYTEST_V1_GATE;
const airMediumApproval = AIR_NORMALS_PLAYTEST_V1_GATE;
const airHeavyApproval = AIR_NORMALS_PLAYTEST_V1_GATE;

export const AIR_NORMALS_PLAYTEST_V1: Record<AirNormalPlaytestId, AirNormalPlaytestDefinition> = {
  air_light: {
    id: "air_light",
    state: "air_light_review",
    reaction: "light",
    exposures: [
      { sourceId: "air_light_compact_boot_v2_01_approved_apex_chamber", role: "compact_apex_chamber", ticks: 5, approval: airLightApproval, fallbackWarning: null },
      {
        sourceId: "air_light_compact_boot_v2_02_compact_boot_contact",
        role: "one_hit_compact_boot_contact",
        ticks: 3,
        approval: airLightApproval,
        fallbackWarning: null
      },
      { sourceId: "air_light_compact_boot_v2_03_approved_fall_connector", role: "apex_to_fall_connector", ticks: 4, approval: airLightApproval, fallbackWarning: null },
      { sourceId: "air_light_compact_boot_v2_04_approved_falling_recovery", role: "falling_recovery", ticks: 5, approval: airLightApproval, fallbackWarning: null }
    ],
    startupTicks: 5,
    activeTicks: 3,
    recoveryTicks: 9,
    totalTicks: 17,
    damage: 25,
    attackerContactHoldTicks: 3,
    hitstop: 3,
    hitstun: 13,
    blockstun: 7,
    hitKnockbackPerTick: 1.5,
    blockPushbackPerTick: 0.45,
    hitbox: { x: 20, y: -78, w: 64, h: 30 },
    cancelOnContact: ["air_medium", "air_heavy"],
    candidateArtComplete: true
  },
  air_medium: {
    id: "air_medium",
    state: "air_medium_review",
    reaction: "light",
    exposures: [
      { sourceId: "air_medium_scythe_shaft_v1_01_cross_body_load", role: "cross_body_load", ticks: 7, approval: airMediumApproval, fallbackWarning: null },
      { sourceId: "air_medium_scythe_shaft_v1_02_shaft_contact", role: "one_hit_shaft_contact", ticks: 4, approval: airMediumApproval, fallbackWarning: null },
      { sourceId: "air_medium_scythe_shaft_v1_03_fall_compatible_unwind", role: "fall_compatible_unwind", ticks: 9, approval: airMediumApproval, fallbackWarning: null }
    ],
    startupTicks: 7,
    activeTicks: 4,
    recoveryTicks: 9,
    totalTicks: 20,
    damage: 45,
    attackerContactHoldTicks: 0,
    hitstop: 4,
    hitstun: 16,
    blockstun: 9,
    hitKnockbackPerTick: 2.8,
    blockPushbackPerTick: 0.6,
    hitbox: { x: 26, y: -70, w: 72, h: 42 },
    cancelOnContact: ["air_heavy"],
    candidateArtComplete: true
  },
  air_heavy: {
    id: "air_heavy",
    state: "air_heavy_review",
    reaction: "heavy",
    exposures: [
      { sourceId: "air_heavy_descending_hook_v1_01_committed_airborne_load", role: "committed_airborne_load", ticks: 10, approval: airHeavyApproval, fallbackWarning: null },
      { sourceId: "air_heavy_descending_hook_v1_02_descending_hook_contact", role: "one_descending_hook_contact", ticks: 4, approval: airHeavyApproval, fallbackWarning: null },
      { sourceId: "air_heavy_descending_hook_v1_03_post_contact_landing_carry", role: "post_contact_landing_carry", ticks: 7, approval: airHeavyApproval, fallbackWarning: null },
      { sourceId: "air_heavy_descending_hook_v1_04_held_scythe_attack_landing_recovery", role: "held_scythe_recovery", ticks: 13, approval: airHeavyApproval, fallbackWarning: null }
    ],
    startupTicks: 10,
    activeTicks: 4,
    recoveryTicks: 20,
    totalTicks: 34,
    damage: 70,
    attackerContactHoldTicks: 0,
    hitstop: 6,
    hitstun: 18,
    blockstun: 12,
    hitKnockbackPerTick: 5,
    blockPushbackPerTick: 0.8,
    hitbox: { x: 22, y: -82, w: 78, h: 58 },
    cancelOnContact: [],
    candidateArtComplete: true
  }
};

const ID_BY_STATE: Partial<Record<SandboxStateName, AirNormalPlaytestId>> = {
  air_light_review: "air_light",
  air_medium_review: "air_medium",
  air_heavy_review: "air_heavy"
};

export function airNormalForId(id: AirNormalPlaytestId) {
  return AIR_NORMALS_PLAYTEST_V1[id];
}

export function airNormalForState(state: SandboxStateName) {
  const id = ID_BY_STATE[state];
  return id ? AIR_NORMALS_PLAYTEST_V1[id] : null;
}

export function isAirNormalState(state: SandboxStateName): state is AirNormalPlaytestState {
  return Boolean(ID_BY_STATE[state]);
}

export function airNormalFrameAtTick(definition: AirNormalPlaytestDefinition, tick: number) {
  let cursor = Math.max(0, Math.min(tick, definition.totalTicks - 1));
  for (let index = 0; index < definition.exposures.length; index++) {
    const exposure = definition.exposures[index];
    if (cursor < exposure.ticks) return { ...exposure, index: index + 1 };
    cursor -= exposure.ticks;
  }
  const last = definition.exposures.at(-1)!;
  return { ...last, index: definition.exposures.length };
}

export function airNormalIsActive(definition: AirNormalPlaytestDefinition, tick: number) {
  return tick >= definition.startupTicks && tick < definition.startupTicks + definition.activeTicks;
}

export function airNormalPhase(definition: AirNormalPlaytestDefinition, tick: number) {
  if (tick < definition.startupTicks) return "startup";
  if (airNormalIsActive(definition, tick)) return "active";
  return "recovery";
}
