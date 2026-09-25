export type DashRepairDirection = "forward" | "backward";

export const DASH_REPAIR_V2_APPROVAL = "awaiting_human_dash_timing_polish_review" as const;

export interface DashRepairFrame {
  readonly index: number;
  readonly sourceId: string;
  readonly role: string;
  readonly exposureTicks: number;
  readonly supportFoot: string;
  readonly swingFoot: string;
  readonly candidateSha256: string;
}

export const DASH_REPAIR_V2_FRAMES: Record<DashRepairDirection, readonly DashRepairFrame[]> = {
  forward: [
    { index: 1, sourceId: "dash_forward_v2_startup_load", role: "startup_load", exposureTicks: 8, supportFoot: "screen_left_loaded_support", swingFoot: "screen_right_ready", candidateSha256: "067216E931FADEDCEBA423585C814785B63C0C33608E6B4E2360062D439D10A9" },
    { index: 2, sourceId: "dash_forward_v2_grounded_push_connector", role: "grounded_push_connector", exposureTicks: 6, supportFoot: "screen_left_push_contact", swingFoot: "screen_right_leading", candidateSha256: "D2ED4BE2BE6D2B28D9E6B5BD480555AE7FAB8BD533E86FD96F4A6557A755FF93" },
    { index: 3, sourceId: "dash_forward_v2_committed_launch", role: "committed_launch", exposureTicks: 5, supportFoot: "screen_left_launch_extension", swingFoot: "screen_right_leading", candidateSha256: "88AA55D699F9CF3157DE288B01F7A1807606C71EE4DFEB754D819E136D51AD6A" },
    { index: 4, sourceId: "dash_forward_v2_low_travel_carry", role: "low_travel_carry", exposureTicks: 7, supportFoot: "low_burst_visual_contact", swingFoot: "trailing_leg_low", candidateSha256: "D4E7DBB81A503F6FD44238EB856C7E7C2108807F013A63950220C1CE73FA310B" },
    { index: 5, sourceId: "dash_forward_v2_deceleration_catch", role: "deceleration_catch", exposureTicks: 7, supportFoot: "screen_right_deceleration_contact", swingFoot: "screen_left_recovering", candidateSha256: "09827943771230F6482B0E8FD340CB21AC4B85836F7FF46F946C2106686937D1" },
    { index: 6, sourceId: "dash_forward_v2_brake_recovery", role: "brake_recovery", exposureTicks: 11, supportFoot: "both_grounded_brake", swingFoot: "none", candidateSha256: "EC3C5B2B778DDC35441417F54A8F9F7EBEF7DCA62B618F0006AD3AD2CBF5C5AC" }
  ],
  backward: [
    { index: 1, sourceId: "dash_backward_v3_load_low", role: "load_low", exposureTicks: 9, supportFoot: "screen_right_loaded_support", swingFoot: "screen_left_ready", candidateSha256: "702280E3EEA290E1DAFC52D4E1B19FE28A6617271006628730BD0F0169891C74" },
    { index: 2, sourceId: "dash_backward_v3_push_away", role: "push_away", exposureTicks: 7, supportFoot: "screen_right_retreat_push", swingFoot: "screen_left_reaching", candidateSha256: "B8195F0B3C6E510255BEA5EDA6E1A5F079EFB0FAB3CCEDB65D0B673DA383DA23" },
    { index: 3, sourceId: "dash_backward_v3_compact_retreat_hop_slide", role: "compact_retreat_hop_slide", exposureTicks: 6, supportFoot: "airborne_none", swingFoot: "knees_tucked_beneath_pelvis", candidateSha256: "7128CA1C1A0A83284DF149F8F8A1D2B068269D9893C55374606C08BD2086BBF7" },
    { index: 4, sourceId: "dash_backward_v3_max_retreat", role: "max_retreat", exposureTicks: 8, supportFoot: "airborne_none", swingFoot: "compact_max_retreat", candidateSha256: "C6DA56D6273EC2296E6B8868149B54B570814B76FAE0E26AAC14E0DCA28CEA4E" },
    { index: 5, sourceId: "dash_backward_v3_controlled_landing", role: "controlled_landing", exposureTicks: 8, supportFoot: "screen_left_rear_catch", swingFoot: "screen_right_recovering", candidateSha256: "3D635F9490BF91B6F8017EAC0AAD2820B332742C8C78B0C4C9C854CD423DE400" },
    { index: 6, sourceId: "dash_backward_v3_guarded_recovery", role: "guarded_recovery", exposureTicks: 12, supportFoot: "both_grounded_brake", swingFoot: "none", candidateSha256: "52F955C2B7F388625690C75BDE9A9C9F6550AE63108CADD0ADB059B9418AD4A7" }
  ]
} as const;

const TOTAL_DISTANCE: Record<DashRepairDirection, number> = { forward: 200, backward: 156 };

export const DASH_REPAIR_V2_REVIEW = {
  record: "SWAHILI_DASH_REPAIR_TIMING_POLISH_V2_1",
  predecessorRecord: "SWAHILI_DASH_REPAIR_PASS_V2",
  candidateOnly: true,
  deployable: false,
  productionRoster: false,
  approval: DASH_REPAIR_V2_APPROVAL,
  timingAuthority: "HUMAN_REQUESTED_FASTER_SIX_POSE_REVIEW_TIMING",
  movementAuthority: "DETERMINISTIC_SIMULATION_OWNED_EASE_IN_OUT_CURVE",
  gameplayValues: "TEMPORARY_SANDBOX_DASH_DISTANCE_NOT_PRODUCTION_BALANCE",
  timingChangeOnly: true,
  artworkFrameCountUnchanged: true,
  connectorFrameAdded: false,
  sourceCanvas: [1536, 1536],
  sourceRoot: [768, 1408],
  predecessorTiming: {
    forward: { totalTicks: 52, exposureTicks: [10, 7, 6, 8, 8, 13] },
    backward: { totalTicks: 58, exposureTicks: [11, 8, 7, 9, 9, 14] }
  },
  forward: { totalTicks: 44, intendedDistance: TOTAL_DISTANCE.forward, authoredExposureTicks: [8, 6, 5, 7, 7, 11] },
  backward: { totalTicks: 50, intendedDistance: TOTAL_DISTANCE.backward, authoredExposureTicks: [9, 7, 6, 8, 8, 12] },
  backdashRead: "load_low -> push_away -> compact_retreat_hop_slide -> max_retreat -> controlled_landing -> guarded_recovery"
} as const;

export function dashTotalTicks(direction: DashRepairDirection) {
  return DASH_REPAIR_V2_FRAMES[direction].reduce((total, frame) => total + frame.exposureTicks, 0);
}

export function dashFrameAtTick(direction: DashRepairDirection, tick: number) {
  const frames = DASH_REPAIR_V2_FRAMES[direction];
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

function displacementWeights(direction: DashRepairDirection) {
  const totalTicks = dashTotalTicks(direction);
  const exponent = direction === "forward" ? 1.65 : 1.9;
  const phaseMultipliers = direction === "forward"
    ? [0.25, 0.8, 1.2, 1.45, 0.8, 0.18]
    : [0.25, 0.8, 1.25, 1.55, 0.8, 0.15];
  let cursor = 0;
  const phaseCenters = DASH_REPAIR_V2_FRAMES[direction].map((frame) => {
    const center = cursor + (frame.exposureTicks - 1) / 2;
    cursor += frame.exposureTicks;
    return center;
  });
  const multiplierAt = (tick: number) => {
    if (tick <= phaseCenters[0]) return phaseMultipliers[0];
    if (tick >= phaseCenters.at(-1)!) return phaseMultipliers.at(-1)!;
    for (let index = 0; index < phaseCenters.length - 1; index++) {
      const start = phaseCenters[index];
      const end = phaseCenters[index + 1];
      if (tick <= end) {
        const blend = (tick - start) / (end - start);
        return phaseMultipliers[index] + (phaseMultipliers[index + 1] - phaseMultipliers[index]) * blend;
      }
    }
    return phaseMultipliers.at(-1)!;
  };
  return Array.from({ length: totalTicks }, (_, index) =>
    Math.pow(Math.sin(Math.PI * index / (totalTicks - 1)), exponent) * multiplierAt(index)
  );
}

export function dashDisplacementPerTick(direction: DashRepairDirection, tick: number) {
  const weights = displacementWeights(direction);
  const index = Math.max(0, Math.min(weights.length - 1, Math.floor(tick)));
  const weightTotal = weights.reduce((sum, value) => sum + value, 0);
  return TOTAL_DISTANCE[direction] * weights[index] / weightTotal;
}

export function dashCurveDistance(direction: DashRepairDirection) {
  return Array.from({ length: dashTotalTicks(direction) }, (_, tick) => dashDisplacementPerTick(direction, tick))
    .reduce((sum, value) => sum + value, 0);
}
