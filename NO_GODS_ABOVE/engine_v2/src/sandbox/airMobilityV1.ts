export const AIR_MOBILITY_V1_REVIEW = {
  record: "SWAHILI_AIR_MOBILITY_V1",
  status: "candidate-only",
  deployable: false,
  productionRoster: false,
  maxJumps: 2,
  maxAirDashes: 1,
  doubleJumpVelocity: -11.5,
  airDashTicks: 12,
  airDashDistance: 168,
  gameplayValues: "TEMPORARY_SANDBOX_AIR_MOBILITY_NOT_PRODUCTION_BALANCE"
} as const;

export function airDashDisplacementPerTick() {
  return AIR_MOBILITY_V1_REVIEW.airDashDistance / AIR_MOBILITY_V1_REVIEW.airDashTicks;
}
