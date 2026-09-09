export type TurnSideSwitchFacingPhase = "starting" | "ending";

export interface TurnSideSwitchExposureV1 {
  index: number;
  sourceId: "idle_00" | "turn_pivot_bridge_v1";
  role: string;
  exposureTicks: number;
  facingPhase: TurnSideSwitchFacingPhase;
}

export const TURN_SIDE_SWITCH_V1_APPROVAL = "awaiting_human_turn_side_switch_live_review";

export const TURN_SIDE_SWITCH_V1_EXPOSURES: readonly TurnSideSwitchExposureV1[] = [
  { index: 1, sourceId: "idle_00", role: "current_facing_idle_departure", exposureTicks: 3, facingPhase: "starting" },
  { index: 2, sourceId: "turn_pivot_bridge_v1", role: "planted_pivot_entry", exposureTicks: 2, facingPhase: "starting" },
  { index: 3, sourceId: "turn_pivot_bridge_v1", role: "planted_pivot_exit_runtime_mirrored", exposureTicks: 2, facingPhase: "ending" },
  { index: 4, sourceId: "idle_00", role: "new_facing_idle_settle", exposureTicks: 5, facingPhase: "ending" }
] as const;

export const TURN_SIDE_SWITCH_V1_REVIEW = {
  id: "SWAHILI_TURN_SIDE_SWITCH_COMPATIBILITY_V1",
  status: "candidate-only",
  deployable: false,
  productionRoster: false,
  runtimeSurface: "isolated_engine_v2_swahili_development_sandbox",
  authoredSourceFrames: 1,
  mirroredSourceFiles: 0,
  totalTicks: TURN_SIDE_SWITCH_V1_EXPOSURES.reduce((total, exposure) => total + exposure.exposureTicks, 0),
  exposureTicks: TURN_SIDE_SWITCH_V1_EXPOSURES.map((exposure) => exposure.exposureTicks),
  facingSwapSimulationOwned: true,
  fighterRootDisplacement: 0,
  opponentCrossing: "sandbox_review_script_only",
  candidateSha256: "3E93AB973437B3DB70F1A488E561795B10E7331B0C301E0682CC238CAA6D8CDE",
  gate: TURN_SIDE_SWITCH_V1_APPROVAL,
  gameplayValues: "TEMPORARY_SANDBOX_OPPONENT_CROSSING_NOT_PRODUCTION_GAMEPLAY"
} as const;

export function turnSideSwitchTotalTicks() {
  return TURN_SIDE_SWITCH_V1_REVIEW.totalTicks;
}

export function turnSideSwitchExposureAtTick(tick: number) {
  const boundedTick = Math.max(0, Math.min(turnSideSwitchTotalTicks() - 1, Math.floor(tick)));
  let cursor = 0;
  for (const exposure of TURN_SIDE_SWITCH_V1_EXPOSURES) {
    const end = cursor + exposure.exposureTicks;
    if (boundedTick < end) return { exposure, tickInExposure: boundedTick - cursor, startTick: cursor, endTick: end - 1 };
    cursor = end;
  }
  const exposure = TURN_SIDE_SWITCH_V1_EXPOSURES.at(-1)!;
  return { exposure, tickInExposure: exposure.exposureTicks - 1, startTick: cursor - exposure.exposureTicks, endTick: cursor - 1 };
}

export function turnSideSwitchOpponentProgress(tick: number) {
  const lastTick = Math.max(1, turnSideSwitchTotalTicks() - 1);
  const normalized = Math.max(0, Math.min(1, tick / lastTick));
  return normalized * normalized * (3 - 2 * normalized);
}
