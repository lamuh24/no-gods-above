import { AttackId } from "../core/types";
import { SwahiliStageFrameId } from "./spriteSources";

/**
 * Attacker-side presentation tracks.
 *
 * The simulation owns every timing value. A track only says which authored pose belongs to the
 * startup, active, and recovery window of a move, and the selector spreads those poses across the
 * window length the simulation actually reports. Artwork never adds, removes, or reorders a
 * gameplay frame, and never writes simulation state.
 */
export interface AttackFrameTrack {
  readonly startup: readonly SwahiliStageFrameId[];
  readonly active: readonly SwahiliStageFrameId[];
  readonly recovery: readonly SwahiliStageFrameId[];
  /** Optional authored cel holds; sums must equal the simulation-owned phase lengths. */
  readonly exposureTicks?: { readonly startup: readonly number[]; readonly active: readonly number[]; readonly recovery: readonly number[] };
}

export const attackFrameTracks: Record<AttackId, AttackFrameTrack> = {
  // Celeste owns character-local manifest tracks in the versus presenter.
  ovation_procession: { startup: [], active: [], recovery: [] },
  quickstep_beat: { startup: [], active: [], recovery: [] },
  crescendo_slash: { startup: [], active: [], recovery: [] },
  curtain_call: { startup: [], active: [], recovery: [] },
  waltz_retreat: { startup: [], active: [], recovery: [] },
  reversal_measure: { startup: [], active: [], recovery: [] },
  broken_tempo: { startup: [], active: [], recovery: [] },
  encore_near: { startup: [], active: [], recovery: [] },
  encore_reach: { startup: [], active: [], recovery: [] },
  encore_balcony: { startup: [], active: [], recovery: [] },
  rising_note: { startup: [], active: [], recovery: [] },
  ascending_aria: { startup: [], active: [], recovery: [] },
  grand_crescendo: { startup: [], active: [], recovery: [] },
  ovation_staccato: { startup: [], active: [], recovery: [] },
  ovation_fortissimo: { startup: [], active: [], recovery: [] },
  strobe_air_waltz: { startup: [], active: [], recovery: [] },
  ovation_descant: { startup: [], active: [], recovery: [] },
  finale_reprise: { startup: [], active: [], recovery: [] },
  octava: { startup: [], active: [], recovery: [] },
  swahili_paid_seal: { startup: [], active: [], recovery: [] },
  special_neutral_light: { startup: [], active: [], recovery: [] },
  // Gated versus Swahili owns these normalized clips; unchanged default stage.
  special_up_light: { startup: [], active: [], recovery: [] },
  special_neutral_heavy: { startup: [], active: [], recovery: [] },
  special_back_light: { startup: [], active: [], recovery: [] },
  special_back_medium: { startup: [], active: [], recovery: [] },
  special_back_heavy: { startup: [], active: [], recovery: [] },
  legacy_crown_of_no_gods: { startup: [], active: [], recovery: [] },
  // Opt-in air-special laboratory owns its dedicated sprite tracks; default arena unchanged.
  special_air_light: { startup: [], active: [], recovery: [] },
  special_air_medium: { startup: [], active: [], recovery: [] },
  special_air_heavy: { startup: [], active: [], recovery: [] },
  // Lamuh-only packages are rendered by lamuhlegacy, never by Swahili's frame registry.
  legacy_divine_vanish_light: { startup: [], active: [], recovery: [] },
  legacy_divine_vanish_medium: { startup: [], active: [], recovery: [] },
  legacy_divine_vanish_heavy: { startup: [], active: [], recovery: [] },
  legacy_radiant_dive_light: { startup: [], active: [], recovery: [] },
  legacy_radiant_dive_medium: { startup: [], active: [], recovery: [] },
  legacy_radiant_dive_heavy: { startup: [], active: [], recovery: [] },
  legacy_aura_sweep_light: { startup: [], active: [], recovery: [] },
  legacy_aura_sweep_medium: { startup: [], active: [], recovery: [] },
  legacy_aura_sweep_heavy: { startup: [], active: [], recovery: [] },
  legacy_heaven_splitter_light: { startup: [], active: [], recovery: [] },
  legacy_heaven_splitter_medium: { startup: [], active: [], recovery: [] },
  legacy_heaven_splitter_heavy: { startup: [], active: [], recovery: [] },
  legacy_celestial_palm_light: { startup: [], active: [], recovery: [] },
  legacy_celestial_palm_medium: { startup: [], active: [], recovery: [] },
  legacy_celestial_palm_heavy: { startup: [], active: [], recovery: [] },
  standing_light: {
    startup: ["standing_light_chamber", "standing_light_extension"],
    active: ["standing_light_contact"],
    recovery: ["standing_light_recoil", "standing_light_retraction", "standing_light_recovery"]
  },
  standing_medium: {
    startup: ["standing_medium_anticipation", "standing_medium_hip_drive"],
    active: ["standing_medium_knee_contact"],
    recovery: ["standing_medium_knee_descent", "standing_medium_settling"]
  },
  standing_heavy: {
    startup: ["standing_heavy_anticipation", "standing_heavy_preparation", "standing_heavy_extension"],
    active: ["standing_heavy_impact"],
    recovery: ["standing_heavy_recoil", "standing_heavy_recovery"]
  },
  crouching_light: {
    startup: ["crouching_light_guarded", "crouching_light_aim"],
    active: ["crouching_light_shot"],
    recovery: ["crouching_light_recoil", "crouching_light_recovery"]
  },
  crouching_medium: {
    startup: ["crouching_medium_preparation", "crouching_medium_alignment"],
    active: ["crouching_medium_contact"],
    recovery: ["crouching_medium_recoil", "crouching_medium_lowering", "crouching_medium_recovery"]
  },
  crouching_heavy: {
    startup: ["crouching_heavy_anticipation", "crouching_heavy_acceleration"],
    active: ["crouching_heavy_contact"],
    recovery: ["crouching_heavy_carry", "crouching_heavy_follow_through", "crouching_heavy_unwind", "crouching_heavy_recovery"]
  },
  air_light: {
    startup: ["air_light_chamber"],
    active: ["air_light_contact"],
    recovery: ["air_light_connector", "air_light_recovery"]
  },
  air_medium: {
    startup: ["air_medium_load"],
    active: ["air_medium_contact"],
    recovery: ["air_medium_unwind"]
  },
  air_heavy: {
    startup: ["air_heavy_load"],
    active: ["air_heavy_contact"],
    recovery: ["air_heavy_carry", "air_heavy_landing_recovery"]
  },
  air_special_ender: {
    startup: ["air_heavy_load"],
    active: ["air_heavy_contact"],
    recovery: ["air_heavy_carry", "air_heavy_landing_recovery"]
  },
  special_neutral_medium: {
    startup: [
      "special_neutral_medium_low_ready_anticipation",
      "special_neutral_medium_scythe_draw_short_load"
    ],
    active: ["special_neutral_medium_control_strike_contact"],
    recovery: [
      "special_neutral_medium_follow_through_recoil",
      "special_neutral_medium_recovery_remount_start"
    ]
  },
  special_forward_light: {
    startup: [
      "special_forward_light_motion_01", "special_forward_light_motion_02", "special_forward_light_motion_03",
      "special_forward_light_motion_04", "special_forward_light_motion_05", "special_forward_light_motion_06",
      "special_forward_light_motion_07", "special_forward_light_motion_08", "special_forward_light_motion_09"
    ],
    active: ["special_forward_light_motion_10"],
    recovery: [
      "special_forward_light_motion_11", "special_forward_light_motion_12", "special_forward_light_motion_13",
      "special_forward_light_motion_14", "special_forward_light_motion_15", "special_forward_light_motion_16"
    ]
  },
  special_forward_medium: {
    startup: [
      "special_forward_medium_motion_01", "special_forward_medium_motion_02", "special_forward_medium_motion_03",
      "special_forward_medium_motion_04", "special_forward_medium_motion_05"
    ],
    active: [
      "special_forward_medium_motion_06", "special_forward_medium_motion_07", "special_forward_medium_motion_08",
      "special_forward_medium_motion_09", "special_forward_medium_motion_10", "special_forward_medium_motion_11"
    ],
    recovery: [
      "special_forward_medium_motion_12", "special_forward_medium_motion_13", "special_forward_medium_motion_14",
      "special_forward_medium_motion_15", "special_forward_medium_motion_16"
    ]
  },
  special_forward_heavy: {
    startup: [
      "special_forward_heavy_motion_01", "special_forward_heavy_motion_02", "special_forward_heavy_motion_03",
      "special_forward_heavy_motion_04", "special_forward_heavy_motion_05", "special_forward_heavy_motion_06",
      "special_forward_heavy_motion_07", "special_forward_heavy_motion_08", "special_forward_heavy_motion_09"
    ],
    active: ["special_forward_heavy_motion_10"],
    recovery: [
      "special_forward_heavy_motion_11", "special_forward_heavy_motion_12", "special_forward_heavy_motion_13",
      "special_forward_heavy_motion_14", "special_forward_heavy_motion_15", "special_forward_heavy_motion_16"
    ]
  },
  special_up_medium: {
    startup: [
      "special_up_medium_grounded_ready",
      "special_up_medium_low_loaded_anticipation"
    ],
    active: ["special_up_medium_rising_hook_contact"],
    recovery: [
      "special_up_medium_upward_recoil_settle",
      "special_up_medium_controlled_remount_connector",
      "special_up_medium_controlled_remount_start"
    ]
  },
  special_down_light: {
    startup: [
      "special_down_light_motion_01",
      "special_down_light_motion_02",
      "special_down_light_motion_03",
      "special_down_light_motion_04",
      "special_down_light_motion_05",
      "special_down_light_motion_06",
      "special_down_light_motion_07",
      "special_down_light_motion_08",
      "special_down_light_motion_09"
    ],
    active: ["special_down_light_motion_10"],
    recovery: [
      "special_down_light_motion_11",
      "special_down_light_motion_12",
      "special_down_light_motion_13",
      "special_down_light_motion_14",
      "special_down_light_motion_15",
      "special_down_light_motion_16"
    ]
  },
  special_down_medium: {
    startup: [
      "special_down_medium_motion_01",
      "special_down_medium_motion_02",
      "special_down_medium_motion_03",
      "special_down_medium_motion_04"
    ],
    active: [
      "special_down_medium_motion_05",
      "special_down_medium_motion_06",
      "special_down_medium_motion_07",
      "special_down_medium_motion_08"
    ],
    recovery: [
      "special_down_medium_motion_09",
      "special_down_medium_motion_10",
      "special_down_medium_motion_11",
      "special_down_medium_motion_12"
    ],
    exposureTicks: { startup: [5, 8, 9, 3], active: [3, 4, 8, 3], recovery: [3, 5, 6, 7] }
  },
  special_down_heavy: {
    startup: [
      "special_down_heavy_low_ready",
      "special_down_heavy_scythe_take",
      "special_down_heavy_blade_flip_load",
      "special_down_heavy_deep_grounded_coil",
      "special_down_heavy_vertical_alignment"
    ],
    active: [
      "special_down_heavy_staff_plant_contact",
      "special_down_heavy_post_plant_release",
      "special_down_heavy_gun_draw_turn",
      "special_down_heavy_spin_midpoint",
      "special_down_heavy_spin_brake_alignment",
      "special_down_heavy_dual_pistol_aim_hold",
      "special_down_heavy_contract_blast_contact"
    ],
    recovery: [
      "special_down_heavy_contract_blast_recoil",
      "special_down_heavy_controlled_lower",
      "special_down_heavy_holster_turn",
      "special_down_heavy_scythe_reclaim",
      "special_down_heavy_ferrule_lift_remount",
      "special_down_heavy_ferrule_lift_hold"
    ]
  },
  special_up_heavy: {
    startup: [
      "special_up_heavy_grave_furrow_motion_01", "special_up_heavy_grave_furrow_motion_02",
      "special_up_heavy_grave_furrow_motion_03", "special_up_heavy_grave_furrow_motion_04",
      "special_up_heavy_grave_furrow_motion_05", "special_up_heavy_grave_furrow_motion_06",
      "special_up_heavy_grave_furrow_motion_07", "special_up_heavy_grave_furrow_motion_08",
      "special_up_heavy_grave_furrow_motion_09"
    ],
    active: ["special_up_heavy_grave_furrow_motion_10"],
    recovery: [
      "special_up_heavy_grave_furrow_motion_11", "special_up_heavy_grave_furrow_motion_12",
      "special_up_heavy_grave_furrow_motion_13", "special_up_heavy_grave_furrow_motion_14",
      "special_up_heavy_grave_furrow_motion_15", "special_up_heavy_grave_furrow_motion_16"
    ]
  },
  legacy_ascend_step_light: {
    startup: ["standing_medium_anticipation", "standing_medium_hip_drive"],
    active: ["standing_heavy_impact"],
    recovery: ["standing_heavy_recoil", "standing_heavy_recovery"]
  },
  legacy_ascend_step: {
    // Compatibility presentation only. The Lamuh review routes use their own
    // character-local V1 source-frame registry while gameplay stays simulation-owned.
    startup: ["standing_medium_anticipation", "standing_medium_hip_drive"],
    active: ["standing_heavy_impact"],
    recovery: ["standing_heavy_recoil", "standing_heavy_recovery"]
  },
  legacy_ascend_step_heavy: {
    startup: ["standing_medium_anticipation", "standing_medium_hip_drive", "standing_heavy_anticipation"],
    active: ["standing_heavy_impact"],
    recovery: ["standing_heavy_recoil", "standing_heavy_recovery"]
  }
};

/** Spread an authored pose list evenly across a simulation-owned window of `length` ticks. */
export function frameAcrossWindow(frames: readonly SwahiliStageFrameId[], cursor: number, length: number, exposures?: readonly number[]): SwahiliStageFrameId | null {
  if (frames.length === 0 || length <= 0) return null;
  const clamped = Math.min(Math.max(0, Math.floor(cursor)), length - 1);
  if (exposures) {
    if (exposures.length !== frames.length || exposures.some((ticks) => !Number.isInteger(ticks) || ticks <= 0) || exposures.reduce((sum, ticks) => sum + ticks, 0) !== length) {
      throw new Error("Authored cel exposures must cover their simulation phase exactly");
    }
    let end = 0;
    for (let index = 0; index < frames.length; index++) {
      end += exposures[index];
      if (clamped < end) return frames[index];
    }
  }
  const index = Math.floor((clamped * frames.length) / length);
  return frames[Math.min(index, frames.length - 1)];
}
