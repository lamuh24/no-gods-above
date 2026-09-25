import { SandboxAnimationFrame, SandboxRect } from "./types";
import { SWAHILI_STANDING_HEAVY_COMBAT_PROFILE_V1 } from "./standingHeavyCombatProfile";

export const SWAHILI_SANDBOX_STATUS = {
  status: "preview-only",
  candidateOnly: true,
  deployable: false,
  productionRoster: false
} as const;

// Body-only deterministic profiles. These deliberately exclude Swahili's
// mounted scythe, pistol barrels, coat flare, and transparent sprite margins.
// Runtime pixels never generate or resize these gameplay rectangles.
export const BODY_HURTBOX_PROFILES = {
  standing: [
    { x: -14, y: -164, w: 31, h: 36 },
    { x: -40, y: -132, w: 88, h: 72 },
    { x: -36, y: -64, w: 72, h: 64 }
  ],
  crouching: [
    { x: -10, y: -148, w: 31, h: 34 },
    { x: -42, y: -120, w: 86, h: 64 },
    { x: -44, y: -62, w: 88, h: 62 }
  ],
  reaction: [
    { x: -32, y: -160, w: 34, h: 36 },
    { x: -52, y: -132, w: 84, h: 72 },
    { x: -40, y: -64, w: 78, h: 64 }
  ],
  standingHeavyExtended: [
    { x: -15, y: -160, w: 34, h: 36 },
    { x: -43, y: -134, w: 94, h: 74 },
    { x: -40, y: -66, w: 80, h: 66 },
    { x: 35, y: -132, w: 45, h: 32 }
  ]
} satisfies Record<string, SandboxRect[]>;

export const SANDBOX_TUNING = {
  classification: "MIXED_AUTHORITY_SANDBOX_DEFENSE_TIMING_TEMPORARY_STANDING_HEAVY_V1_AUTHORITATIVE",
  tickRateHz: 60,
  health: 1000,
  movement: {
    walkForwardPerTick: 3.6,
    walkBackwardPerTick: 2.8,
    jumpVelocity: -13,
    gravityPerTick: 0.85
  },
  stage: { left: -420, right: 420, groundY: 0, ceilingY: -180 },
  pushbox: { x: -26, y: -104, w: 52, h: 104 } satisfies SandboxRect,
  standingHurtboxes: BODY_HURTBOX_PROFILES.standing,
  crouchingHurtboxes: BODY_HURTBOX_PROFILES.crouching,
  reactionHurtboxes: BODY_HURTBOX_PROFILES.reaction,
  standingHeavyExtendedHurtboxes: BODY_HURTBOX_PROFILES.standingHeavyExtended,
  standingHeavy: SWAHILI_STANDING_HEAVY_COMBAT_PROFILE_V1
} as const;

export const MISSING_ANIMATION_STATES = [
  "walk_backward:first_passing",
  "walk_backward:first_up_late_swing",
  "walk_backward:opposite_foot_down_compression",
  "knockdown",
  "getup",
  "ground_normals_candidate_awaiting_human_live_playtest_review",
  "air_normals_candidate_awaiting_human_live_playtest_review",
  "throws",
  "specials",
  "supers",
  "ultimates"
] as const;

type WalkSlot = Omit<SandboxAnimationFrame, "state" | "frameIndex" | "walkCyclePhase"> & { sourceId: string; role: string; missing?: boolean };

export const FORWARD_WALK_SLOTS: WalkSlot[] = [
  { sourceId: "walk_forward_contact", role: "first_foot_contact", supportFoot: "screen_right_contact", swingFoot: "screen_left_trailing", fallbackWarning: null, approval: "awaiting_human_forward_walk_v2_live_review" },
  { sourceId: "walk_forward_neutral_departure", role: "first_foot_down_compression", supportFoot: "screen_right_support", swingFoot: "screen_left_swing", fallbackWarning: null, approval: "awaiting_human_forward_walk_v2_live_review" },
  { sourceId: "walk_forward_passing", role: "first_passing", supportFoot: "screen_right_support", swingFoot: "screen_left_passing", fallbackWarning: null, approval: "awaiting_human_forward_walk_v2_live_review" },
  { sourceId: "walk_forward_opposite_contact", role: "first_up_late_swing", supportFoot: "screen_right_support", swingFoot: "screen_left_late_swing", fallbackWarning: null, approval: "awaiting_human_forward_walk_v2_live_review" },
  { sourceId: "walk_forward_return", role: "opposite_foot_contact", supportFoot: "screen_left_principal_contact", swingFoot: "screen_right_trailing", fallbackWarning: null, approval: "awaiting_human_forward_walk_v2_live_review" },
  { sourceId: "walk_forward_opposite_down", role: "opposite_foot_down_compression", supportFoot: "screen_left_support", swingFoot: "screen_right_swing", fallbackWarning: null, approval: "awaiting_human_forward_walk_v2_live_review" },
  { sourceId: "walk_forward_opposite_passing", role: "opposite_passing", supportFoot: "screen_left_support", swingFoot: "screen_right_passing", fallbackWarning: null, approval: "awaiting_human_forward_walk_v2_live_review" },
  { sourceId: "walk_forward_opposite_up_return", role: "opposite_up_return", supportFoot: "screen_left_support", swingFoot: "screen_right_late_swing", fallbackWarning: null, approval: "awaiting_human_forward_walk_v2_live_review" }
];

export const BACKWARD_WALK_SLOTS: WalkSlot[] = [
  { sourceId: "walk_backward_rearward_contact", role: "first_foot_contact", supportFoot: "screen_left_contact", swingFoot: "screen_right_trailing", fallbackWarning: null, approval: "candidate_acceptable_preview_only" },
  { sourceId: "walk_backward_neutral_departure", role: "first_foot_down_compression", supportFoot: "screen_left_support", swingFoot: "screen_right_swing", fallbackWarning: null, approval: "candidate_acceptable_preview_only" },
  { sourceId: "walk_backward_neutral_departure", role: "first_passing", supportFoot: "UNKNOWN_MISSING_ROLE", swingFoot: "UNKNOWN_MISSING_ROLE", missing: true, fallbackWarning: "DEBUG FALLBACK - MISSING walk_backward_first_passing", approval: "BLOCKED_ON_MANUAL_PAINTOVER" },
  { sourceId: "walk_backward_neutral_departure", role: "first_up_late_swing", supportFoot: "UNKNOWN_MISSING_ROLE", swingFoot: "UNKNOWN_MISSING_ROLE", missing: true, fallbackWarning: "DEBUG FALLBACK - MISSING walk_backward_first_up", approval: "BLOCKED_ON_MANUAL_PAINTOVER" },
  { sourceId: "walk_backward_opposite_contact", role: "opposite_foot_contact", supportFoot: "screen_right_contact", swingFoot: "screen_left_trailing", fallbackWarning: null, approval: "candidate_acceptable_preview_only" },
  { sourceId: "walk_backward_opposite_contact", role: "opposite_foot_down_compression", supportFoot: "UNKNOWN_MISSING_ROLE", swingFoot: "UNKNOWN_MISSING_ROLE", missing: true, fallbackWarning: "DEBUG FALLBACK - MISSING walk_backward_opposite_down", approval: "BLOCKED_ON_MANUAL_PAINTOVER" },
  { sourceId: "walk_backward_passing", role: "opposite_passing", supportFoot: "screen_right_support", swingFoot: "screen_left_passing", fallbackWarning: null, approval: "candidate_acceptable_preview_only" },
  { sourceId: "walk_backward_return", role: "opposite_up_return", supportFoot: "screen_left_principal_contact", swingFoot: "screen_right_late_swing", fallbackWarning: null, approval: "candidate_acceptable_preview_only" }
];

export const STANDING_HEAVY_EXPOSURES = [
  { sourceId: "idle_00", start: 0, end: 11, role: "startup_stillness", supportFoot: "screen_left_principal_support" },
  { sourceId: "standing_heavy_anticipation_v2", start: 12, end: 21, role: "anticipation", supportFoot: "screen_left_principal_support" },
  { sourceId: "standing_heavy_preparation", start: 22, end: 26, role: "preparation", supportFoot: "screen_left_principal_support" },
  { sourceId: "standing_heavy_extension", start: 27, end: 29, role: "extension", supportFoot: "screen_left_principal_support" },
  { sourceId: "standing_heavy_impact_v2", start: 30, end: 35, role: "visual_impact_hold", supportFoot: "screen_left_principal_support" },
  { sourceId: "standing_heavy_recoil_v2", start: 36, end: 40, role: "recoil", supportFoot: "screen_left_principal_support" },
  { sourceId: "standing_heavy_recovery", start: 41, end: 49, role: "recovery_bridge", supportFoot: "screen_left_principal_support" },
  { sourceId: "idle_00", start: 50, end: 74, role: "committed_return_hold_not_neutral", supportFoot: "screen_left_principal_support" }
] as const;
