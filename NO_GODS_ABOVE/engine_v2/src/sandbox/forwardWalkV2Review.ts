import type { ForwardWalkV2TimingProfileId } from "./types";

export const FORWARD_WALK_V2_REVIEW_STATUS = {
  status: "candidate-only",
  deployable: false,
  approval: "awaiting_human_forward_walk_v2_smooth_root_review",
  artworkRegenerated: false,
  collisionOwner: "deterministic_sandbox_simulation",
  animationControlsCollision: false
} as const;

export interface ForwardWalkV2SlotReviewMetadata {
  sourceId: string;
  ordinal: number;
  role: string;
  supportFoot: string;
  swingFoot: string;
  supportFootCanvasX: number;
  swingFootCanvasX: number;
  candidateSha256: string;
}

// The X landmarks are review diagnostics only. They were measured against the
// locked 1536 x 1536 alpha silhouettes and never alter source pixels, roots,
// collision, or gameplay displacement.
export const FORWARD_WALK_V2_SLOT_REVIEW_METADATA: readonly ForwardWalkV2SlotReviewMetadata[] = [
  { sourceId: "walk_forward_contact", ordinal: 1, role: "first_foot_contact", supportFoot: "screen_right_contact", swingFoot: "screen_left_trailing", supportFootCanvasX: 923, swingFootCanvasX: 646, candidateSha256: "C131729BB0A15E1FC578C34E0EE9DAF617FDF9C935AE13B5516C2356B4E6707F" },
  { sourceId: "walk_forward_neutral_departure", ordinal: 2, role: "first_foot_down_compression", supportFoot: "screen_right_support", swingFoot: "screen_left_swing", supportFootCanvasX: 925, swingFootCanvasX: 588, candidateSha256: "AD74794522C34C31D9FD1980A52AEEEF21CB26F7C9EA23B19E368844A96954CB" },
  { sourceId: "walk_forward_passing", ordinal: 3, role: "first_passing", supportFoot: "screen_right_support", swingFoot: "screen_left_passing", supportFootCanvasX: 936, swingFootCanvasX: 649, candidateSha256: "E33CDA0F93ADA445AFC303EE42AF7FF1E40545B49620BDB9263945AED08A2EBB" },
  { sourceId: "walk_forward_opposite_contact", ordinal: 4, role: "first_up_late_swing", supportFoot: "screen_right_support", swingFoot: "screen_left_late_swing", supportFootCanvasX: 865, swingFootCanvasX: 650, candidateSha256: "37C24DBE00F0822E74100D1249B243A72127DB69357166D094B42FDEFC81F790" },
  { sourceId: "walk_forward_return", ordinal: 5, role: "opposite_foot_contact", supportFoot: "screen_left_principal_contact", swingFoot: "screen_right_trailing", supportFootCanvasX: 570, swingFootCanvasX: 963, candidateSha256: "A1844C8A86EE2B709161C5BE73EDC450655CE6DB4262AFBED7A7CA786EBDDB1E" },
  { sourceId: "walk_forward_opposite_down", ordinal: 6, role: "opposite_foot_down_compression", supportFoot: "screen_left_support", swingFoot: "screen_right_swing", supportFootCanvasX: 486, swingFootCanvasX: 861, candidateSha256: "97499BF7BEF88A66B1A185974D29DCF11295B4741AD62F17C947AE40CCE80B00" },
  { sourceId: "walk_forward_opposite_passing", ordinal: 7, role: "opposite_passing", supportFoot: "screen_left_support", swingFoot: "screen_right_passing", supportFootCanvasX: 650, swingFootCanvasX: 925, candidateSha256: "938EFDE85655BE57EA8197980F7FD4260159BAC51B41086E77F3B0C0BE4E487F" },
  { sourceId: "walk_forward_opposite_up_return", ordinal: 8, role: "opposite_up_return", supportFoot: "screen_left_support", swingFoot: "screen_right_late_swing", supportFootCanvasX: 650, swingFootCanvasX: 925, candidateSha256: "FF4BAB60315D9AD085B1B4854148344AB83B012D0CFC16B4D90920F7EF1B38FD" }
] as const;

export interface ForwardWalkV2TimingProfile {
  id: ForwardWalkV2TimingProfileId;
  label: string;
  frameTicks: readonly number[];
  cycleTicks: number;
  reviewDurationMs: number;
  note: string;
}

export const FORWARD_WALK_V2_TIMING_PROFILES: Record<ForwardWalkV2TimingProfileId, ForwardWalkV2TimingProfile> = {
  candidate_current_58_ticks: {
    id: "candidate_current_58_ticks",
    label: "Current candidate (58 ticks)",
    frameTicks: [7, 7, 7, 8, 7, 7, 7, 8],
    cycleTicks: 58,
    reviewDurationMs: 58 / 60 * 1000,
    note: "Deterministic 60 Hz translation of the non-authoritative 960 ms / 120 ms-per-frame review GIF (nearest whole-tick cycle)."
  },
  even_40_ticks: {
    id: "even_40_ticks",
    label: "Even 40-tick cycle",
    frameTicks: [5, 5, 5, 5, 5, 5, 5, 5],
    cycleTicks: 40,
    reviewDurationMs: 40 / 60 * 1000,
    note: "Five simulation ticks per artwork frame."
  },
  contact_weighted_40_ticks: {
    id: "contact_weighted_40_ticks",
    label: "Contact-weighted 40-tick cycle",
    frameTicks: [6, 5, 4, 5, 6, 5, 4, 5],
    cycleTicks: 40,
    reviewDurationMs: 40 / 60 * 1000,
    note: "Contact/down readability is preserved while passing and late-swing poses carry the largest displacement."
  }
};

export const FORWARD_WALK_V2_SELECTED_TIMING: ForwardWalkV2TimingProfileId = "contact_weighted_40_ticks";

export const FORWARD_WALK_V2_ROOT_CURVE_VERSION = "contact_aware_smoothstep_v2";

// Root velocity still favors passing and swing phases, but the targets are
// deliberately close enough that the fighter never crawls and then lunges.
// Smoothstep interpolation below blends every target into the next one so a
// frame boundary cannot create a visible root-motion pop.
const ROLE_DISPLACEMENT_TARGETS = [0.55, 0.75, 1.2, 1.5, 0.55, 0.75, 1.2, 1.5] as const;
const SOURCE_ROOT_X = 768;
const SPRITE_PIXEL_TO_SIMULATION_UNIT = 0.0033 / 0.02;

function smoothstep(progress: number) {
  return progress * progress * (3 - 2 * progress);
}

export function forwardWalkV2FrameAtTick(stateTick: number, profileId: ForwardWalkV2TimingProfileId) {
  const profile = FORWARD_WALK_V2_TIMING_PROFILES[profileId];
  const cycleTick = ((stateTick % profile.cycleTicks) + profile.cycleTicks) % profile.cycleTicks;
  let cursor = 0;
  for (let frameIndex = 0; frameIndex < profile.frameTicks.length; frameIndex++) {
    const duration = profile.frameTicks[frameIndex];
    if (cycleTick < cursor + duration) {
      return { profile, cycleTick, frameIndex, tickInFrame: cycleTick - cursor, frameDuration: duration, slot: FORWARD_WALK_V2_SLOT_REVIEW_METADATA[frameIndex] };
    }
    cursor += duration;
  }
  throw new Error(`Forward Walk V2 timing cursor escaped ${profileId}`);
}

function forwardWalkV2RawDisplacementWeight(stateTick: number, profileId: ForwardWalkV2TimingProfileId) {
  const sample = forwardWalkV2FrameAtTick(stateTick, profileId);
  const currentTarget = ROLE_DISPLACEMENT_TARGETS[sample.frameIndex];
  const nextTarget = ROLE_DISPLACEMENT_TARGETS[(sample.frameIndex + 1) % ROLE_DISPLACEMENT_TARGETS.length];
  const centeredProgress = (sample.tickInFrame + 0.5) / sample.frameDuration;
  return currentTarget + (nextTarget - currentTarget) * smoothstep(centeredProgress);
}

export function forwardWalkV2DisplacementPerTick(stateTick: number, profileId: ForwardWalkV2TimingProfileId, authoredSpeedPerTick: number) {
  const profile = FORWARD_WALK_V2_TIMING_PROFILES[profileId];
  let rawCycleWeight = 0;
  for (let tick = 0; tick < profile.cycleTicks; tick++) rawCycleWeight += forwardWalkV2RawDisplacementWeight(tick, profileId);
  const normalization = profile.cycleTicks / rawCycleWeight;
  return authoredSpeedPerTick * forwardWalkV2RawDisplacementWeight(stateTick, profileId) * normalization;
}

export function supportFootWorldPosition(rootX: number, facing: 1 | -1, stateTick: number, profileId: ForwardWalkV2TimingProfileId) {
  const { slot } = forwardWalkV2FrameAtTick(stateTick, profileId);
  return rootX + facing * (slot.supportFootCanvasX - SOURCE_ROOT_X) * SPRITE_PIXEL_TO_SIMULATION_UNIT;
}

export function forwardWalkV2CycleDistance(profileId: ForwardWalkV2TimingProfileId, authoredSpeedPerTick: number) {
  const profile = FORWARD_WALK_V2_TIMING_PROFILES[profileId];
  let distance = 0;
  for (let tick = 0; tick < profile.cycleTicks; tick++) distance += forwardWalkV2DisplacementPerTick(tick, profileId, authoredSpeedPerTick);
  return distance;
}
