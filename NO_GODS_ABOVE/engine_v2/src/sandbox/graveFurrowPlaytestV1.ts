import type { SandboxRect } from "./types";

export interface GraveFurrowExposureV1 {
  readonly index: number;
  readonly sourceId: string;
  readonly role: string;
  readonly ticks: number;
}

export const GRAVE_FURROW_PLAYTEST_V1 = {
  id: "special_up_heavy_grave_furrow_v1",
  label: "Grave Furrow V1",
  status: "candidate-only",
  deployable: false,
  productionRoster: false,
  gate: "awaiting_human_grave_furrow_sandbox_playtest_review",
  input: "sandbox_key_y_or_same_tick_up_heavy",
  gameplayValues: "TEMPORARY_SANDBOX_GRAVE_FURROW_VALUES_NOT_PRODUCTION_BALANCE",
  sourceApproval: "awaiting_human_grave_furrow_launch_repair_review",
  timingAuthoritative: false,
  tickRateHz: 60,
  active: { start: 34, end: 38 },
  hitbox: { x: 52, y: -132, w: 150, h: 100 } satisfies SandboxRect,
  damage: 120,
  chipDamage: 0,
  hitstop: { hit: 12, block: 9 },
  blockstun: 20,
  blockPushbackPerTick: 4.2,
  victimLaunchVelocityX: 8.2,
  victimLaunchVelocityY: -7.4,
  rootAdvance: { start: 20, end: 34, perTick: 0.7 },
  vfx: "detached_runtime_overlay_only"
} as const;

export const GRAVE_FURROW_V1_EXPOSURES: readonly GraveFurrowExposureV1[] = [
  { index: 1, sourceId: "grave_furrow_v1_01_grounded_ready", role: "grounded_ready", ticks: 5 },
  { index: 2, sourceId: "grave_furrow_v1_02_blade_ground_plant", role: "blade_ground_plant", ticks: 6 },
  { index: 3, sourceId: "grave_furrow_v1_03_ground_drag_connector", role: "ground_drag_connector", ticks: 7 },
  { index: 4, sourceId: "grave_furrow_v1_04_maximum_furrow_resistance", role: "maximum_furrow_resistance", ticks: 9 },
  { index: 5, sourceId: "grave_furrow_v1_05_release_acceleration", role: "release_acceleration", ticks: 5 },
  { index: 6, sourceId: "grave_furrow_v1_06_single_rising_contact", role: "single_rising_contact", ticks: 9 },
  { index: 7, sourceId: "grave_furrow_v1_07_launcher_follow_through", role: "launcher_follow_through", ticks: 7 },
  { index: 8, sourceId: "grave_furrow_v1_08_controlled_recovery", role: "controlled_recovery", ticks: 8 },
  { index: 9, sourceId: "grave_furrow_v1_09_controlled_remount", role: "controlled_remount", ticks: 8 }
] as const;

export const GRAVE_FURROW_V1_TOTAL_TICKS = GRAVE_FURROW_V1_EXPOSURES.reduce((sum, exposure) => sum + exposure.ticks, 0);

export function graveFurrowFrameAtTick(tick: number) {
  const clamped = Math.max(0, Math.min(GRAVE_FURROW_V1_TOTAL_TICKS - 1, tick));
  let cursor = 0;
  for (const exposure of GRAVE_FURROW_V1_EXPOSURES) {
    if (clamped < cursor + exposure.ticks) return exposure;
    cursor += exposure.ticks;
  }
  return GRAVE_FURROW_V1_EXPOSURES.at(-1)!;
}

export function graveFurrowPhaseAtTick(tick: number) {
  if (tick < GRAVE_FURROW_PLAYTEST_V1.active.start) return "startup" as const;
  if (tick <= GRAVE_FURROW_PLAYTEST_V1.active.end) return "active" as const;
  return "recovery" as const;
}

export function graveFurrowIsActive(tick: number) {
  return tick >= GRAVE_FURROW_PLAYTEST_V1.active.start && tick <= GRAVE_FURROW_PLAYTEST_V1.active.end;
}

export function graveFurrowRootAdvancePerTick(tick: number) {
  const root = GRAVE_FURROW_PLAYTEST_V1.rootAdvance;
  return tick >= root.start && tick <= root.end ? root.perTick : 0;
}
