import { AttackDefinition, AttackId, CancelRules, CombatTuning, FighterDefinition, MovementTuning, SwahiliAirSpecialId, ThrowDefinition, ThrowId } from "../core/types";
import { COMMAND_GRAB_MOTION_V1_FRAMES, COMMAND_GRAB_MOTION_V1_REVIEW } from "../sandbox/commandGrabMotionV1";

const move: MovementTuning = { walkForward: 5.4, walkBackward: 3.8, dashSpeed: 13, dashDuration: 12, backdashSpeed: -10, backdashDuration: 14, jumpStartup: 4, jumpVelocity: -18, forwardJumpVelocityX: 6.2, backJumpVelocityX: -5.1, airControl: 1.4, airDashCount: 0, airDashForwardSpeed: 0, airDashBackwardSpeed: 0, airDashDuration: 0, gravity: 1.05, landingRecovery: 5, inputBuffer: 18, wakeupInvuln: 18, comboNeutralTimeout: 12 };
const combat: CombatTuning = {
  airActionBudget: 5, juggleLimit: 8, hitstunDecayStartsAtHit: 4, hitstunDecayPerHit: 2,
  airborneHitstunBonus: 8, minimumAirHitstun: 12, airRecoveryDelay: 6,
  airTechInvuln: 10, airTechHorizontalSpeed: 5.5, airTechVerticalSpeed: -5.5,
  softKnockdownTicks: 26, hardKnockdownTicks: 42, getupTicks: 18,
  damageScalingStep: 0.08, minimumDamageScaling: 0.5,
  maxTension: 100, tensionGainPerForwardTick: 2, tensionGainOnHit: 16, tensionGainOnBlock: 5,
  romanCancelCost: 50, romanCancelFreezeTicks: 8, romanCancelRecoveryTicks: 4, romanCancelAirActionRefund: 1,
  maxBurst: 100, burstCost: 100, burstFreezeTicks: 6, burstRecoveryTicks: 20, burstHitstun: 18, burstPushback: 12
};
function hit(id: string, start: number, end: number, rect: any, damage: number, hitstop: number, hitstun: number, blockstun: number, kx: number, ky: number, level: any, extra = {}) { return { id, start, end, rect, damage, hitstop, hitstun, blockstun, knockbackX: kx, knockbackY: ky, maxHits: 1, level, ...extra }; }
const attacks: Record<string, AttackDefinition> = {
  legacy_crown_of_no_gods: { id: "legacy_crown_of_no_gods", command: "Ultimate", startup: 18, active: 4, recovery: 30, groundOnly: true,
    rootMotion: { start: 10, end: 20, velocity: 6 },
    hitboxes: [hit("crown_palm", 18, 21, { x: 26, y: -105, w: 88, h: 80 }, 40, 8, 32, 18, 0, 0, "mid")] },
  standing_light: { id: "standing_light", command: "5L", startup: 3, active: 3, recovery: 7, cancel: { onHit: ["standing_medium", "crouching_medium"], onBlock: ["standing_medium", "crouching_medium"] }, groundOnly: true, hitboxes: [hit("5l", 3, 5, { x: 28, y: -78, w: 54, h: 34 }, 30, 4, 12, 8, 2.2, 0, "mid")] },
  standing_medium: { id: "standing_medium", command: "5M", startup: 5, active: 4, recovery: 11, cancel: { onHit: ["standing_heavy", "crouching_heavy"], onBlock: ["standing_heavy", "crouching_heavy"] }, groundOnly: true, hitboxes: [hit("5m", 5, 8, { x: 34, y: -86, w: 76, h: 40 }, 55, 5, 16, 10, 3, 0, "mid")] },
  standing_heavy: { id: "standing_heavy", command: "5H", startup: 8, active: 5, recovery: 17, groundOnly: true, hitboxes: [hit("5h", 8, 12, { x: 42, y: -94, w: 92, h: 50 }, 85, 7, 22, 14, 5, 0, "mid", { knockdown: "soft" })] },
  crouching_light: { id: "crouching_light", command: "2L", startup: 4, active: 3, recovery: 8, cancel: { onHit: ["crouching_medium"], onBlock: ["crouching_medium"] }, groundOnly: true, hitboxes: [hit("2l", 4, 6, { x: 24, y: -38, w: 58, h: 28 }, 25, 3, 11, 7, 2, 0, "low")] },
  crouching_medium: { id: "crouching_medium", command: "2M", startup: 6, active: 4, recovery: 13, cancel: { onHit: ["crouching_heavy"], onBlock: ["crouching_heavy"] }, groundOnly: true, hitboxes: [hit("2m", 6, 9, { x: 28, y: -42, w: 96, h: 30 }, 50, 5, 15, 10, 3, 0, "low")] },
  crouching_heavy: { id: "crouching_heavy", command: "2H", startup: 9, active: 5, recovery: 19, groundOnly: true, hitboxes: [hit("2h", 9, 13, { x: 26, y: -112, w: 88, h: 110 }, 80, 7, 28, 15, 1.5, -16, "launcher", { launches: true, jumpCancelOnHit: true, juggleCost: 0 })] },
  air_light: { id: "air_light", command: "j.J", startup: 3, active: 3, recovery: 7, cancel: { onHit: ["air_medium", "air_heavy"], onBlock: ["air_medium", "air_heavy"] }, airOnly: true, hitboxes: [hit("jj", 3, 5, { x: 20, y: -78, w: 64, h: 30 }, 25, 3, 13, 7, 1.5, -1.5, "mid", { juggleCost: 1 })] },
  air_medium: { id: "air_medium", command: "j.K", startup: 5, active: 4, recovery: 10, cancel: { onHit: ["air_light", "air_heavy"], onBlock: ["air_light", "air_heavy"] }, airOnly: true, hitboxes: [hit("jk", 5, 8, { x: 26, y: -70, w: 72, h: 42 }, 45, 4, 16, 9, 2.8, -8, "mid", { juggleCost: 2 })] },
  air_heavy: { id: "air_heavy", command: "j.L", startup: 6, active: 6, recovery: 14, cancel: { onHit: ["air_special_ender"], onBlock: ["air_special_ender"] }, airOnly: true, hitboxes: [hit("jl", 6, 11, { x: 22, y: -82, w: 78, h: 58 }, 70, 6, 18, 12, 5, 4, "mid", { knockdown: "soft", juggleCost: 2 })] },
  air_special_ender: { id: "air_special_ender", command: "j.S", startup: 5, active: 5, recovery: 18, airOnly: true, airActionCost: 0, cancelOnly: true, systemTestOnly: true, hitboxes: [hit("js", 5, 9, { x: 30, y: -80, w: 96, h: 100 }, 60, 7, 0, 13, 7, 10, "mid", { knockdown: "hard", juggleCost: 3 })] },
  special_neutral_medium: {
    id: "special_neutral_medium", command: "5S+M", startup: 9, active: 3, recovery: 13, groundOnly: true,
    hitboxes: [hit("neutral_control_strike", 9, 11, { x: 40, y: -118, w: 120, h: 72 }, 65, 6, 16, 11, 4.8, 0, "mid", { blockHitstop: 5 })]
  },
  special_forward_light: {
    id: "special_forward_light", command: "6S+L", startup: 18, active: 3, recovery: 19, groundOnly: true,
    rootMotion: { start: 2, end: 20, velocity: 2.2 },
    hitboxes: [hit("warning_drag_shaft_drive", 18, 20, { x: 40, y: -90, w: 130, h: 60 }, 48, 5, 14, 10, 4.4, 0, "mid", { blockHitstop: 4 })]
  },
  special_forward_medium: {
    id: "special_forward_medium", command: "6S+M", startup: 18, active: 18, recovery: 16, groundOnly: true,
    rootMotion: { start: 3, end: 35, velocity: 1.65 },
    hitboxes: [
      hit("shoulder_drive", 18, 20, { x: 38, y: -100, w: 120, h: 70 }, 34, 5, 14, 10, 2.8, 0, "mid", { blockHitstop: 4 }),
      hit("cross_body_rip", 33, 35, { x: 44, y: -112, w: 145, h: 88 }, 52, 8, 18, 14, 7.2, -3, "mid", { blockHitstop: 7, knockdown: "soft" })
    ]
  },
  special_forward_heavy: {
    id: "special_forward_heavy", command: "6S+H", startup: 26, active: 4, recovery: 32, groundOnly: true,
    rootMotion: { start: 11, end: 26, velocity: 1.2 },
    hitboxes: [hit("ground_drag_slice", 26, 29, { x: 48, y: -62, w: 150, h: 58 }, 105, 10, 18, 17, 9, -4.5, "low", { blockHitstop: 8, launches: true, juggleCost: 1 })]
  },
  special_up_medium: {
    id: "special_up_medium", command: "8S+M", startup: 11, active: 4, recovery: 20, groundOnly: true,
    hitboxes: [hit("rising_scythe_hook", 11, 14, { x: 24, y: -170, w: 124, h: 98 }, 78, 7, 17, 13, 4.8, -8.2, "launcher", { blockHitstop: 6, launches: true, juggleCost: 1 })]
  },
  special_down_light: {
    id: "special_down_light", command: "2S+L", startup: 14, active: 3, recovery: 19, groundOnly: true,
    hitboxes: [hit("stamped_shaft_check", 14, 16, { x: 38, y: -60, w: 116, h: 48 }, 45, 6, 14, 10, 3.8, 0, "low", { blockHitstop: 5 })]
  },
  special_down_medium: {
    id: "special_down_medium", command: "2S+M", startup: 25, active: 18, recovery: 21, groundOnly: true,
    hitboxes: [
      hit("crossdraw_low_shot", 25, 27, { x: 40, y: -64, w: 142, h: 54 }, 30, 7, 18, 13, 1.2, 0, "low", { blockHitstop: 6 }),
      hit("crossdraw_mid_shot", 40, 42, { x: 42, y: -104, w: 154, h: 62 }, 42, 8, 16, 13, 5.2, 0, "mid", { blockHitstop: 7 })
    ]
  },
  special_down_heavy: {
    id: "special_down_heavy", command: "2S+H", startup: 28, active: 24, recovery: 28, groundOnly: true,
    hitboxes: [
      hit("grounded_verdict_staff_plant", 28, 31, { x: 38, y: -52, w: 102, h: 50 }, 40, 8, 22, 18, 1.2, 0, "low", { blockHitstop: 6 }),
      hit("grounded_verdict_contract_blast", 49, 51, { x: 54, y: -126, w: 176, h: 78 }, 70, 11, 18, 16, 9, 0, "mid", { blockHitstop: 8, knockdown: "soft" })
    ]
  },
  special_up_heavy: {
    id: "special_up_heavy", command: "8H", startup: 34, active: 5, recovery: 25, groundOnly: true,
    rootMotion: { start: 20, end: 34, velocity: 0.7 },
    hitboxes: [hit("grave_furrow", 34, 38, { x: 52, y: -132, w: 150, h: 100 }, 120, 12, 22, 20, 8.2, -7.4, "launcher", { blockHitstop: 9, launches: true, juggleCost: 1 })]
  }
};

const legacyMove: MovementTuning = { dashCancelTick: 5, backdashInvulnTicks: 7, walkForward: 5.2, walkBackward: 3.7, dashSpeed: 12.5, dashDuration: 18, backdashSpeed: -9.5, backdashDuration: 20, jumpStartup: 4, jumpVelocity: -17.5, forwardJumpVelocityX: 6, backJumpVelocityX: -5, airControl: 1.35, airDashCount: 1, airDashForwardSpeed: 5.15, airDashBackwardSpeed: 4.45, airDashDuration: 14, gravity: 1.05, landingRecovery: 7, inputBuffer: 18, wakeupInvuln: 18, comboNeutralTimeout: 12 };
const legacyCombat: CombatTuning = { ...combat };
// Adult V2 defensive silhouette. Palm keeps its existing projectile-only query;
// Heaven Splitter opts into the same body extent for high contact and vulnerability.
const legacyAdultHurtboxes = { standing: [{ x: -25, y: -172, w: 50, h: 76 }, { x: -25, y: -98, w: 50, h: 48 }, { x: -21, y: -54, w: 42, h: 54 }], crouching: [{ x: -26, y: -112, w: 52, h: 112 }] };
// Lamuh combat modernization v1: an ASW-style gatling ladder. The graph is strictly
// increasing (light -> medium -> heavy -> special -> super), so no chain can loop back on
// itself and no route survives on lights alone. Divine Vanish is deliberately excluded:
// a retreat cancel out of a blocked normal would make every blockstring risk-free.
const LAMUH_SPECIAL_CANCELS: AttackId[] = [
  "legacy_celestial_palm_light", "legacy_celestial_palm_medium", "legacy_celestial_palm_heavy",
  "legacy_aura_sweep_light", "legacy_aura_sweep_medium", "legacy_aura_sweep_heavy",
  "legacy_heaven_splitter_light", "legacy_heaven_splitter_medium", "legacy_heaven_splitter_heavy",
  "legacy_ascend_step_light", "legacy_ascend_step", "legacy_ascend_step_heavy"
];
const LAMUH_SUPER_CANCEL: AttackId[] = ["legacy_crown_of_no_gods"];
const LAMUH_AIR_SPECIAL_CANCELS: AttackId[] = ["legacy_radiant_dive_light", "legacy_radiant_dive_medium", "legacy_radiant_dive_heavy"];
function lamuhCancels(normals: AttackId[]): CancelRules {
  const targets = [...normals, ...LAMUH_SPECIAL_CANCELS, ...LAMUH_SUPER_CANCEL];
  return { onHit: targets, onBlock: targets };
}
function lamuhAirCancels(normals: AttackId[]): CancelRules {
  const targets = [...normals, ...LAMUH_AIR_SPECIAL_CANCELS];
  return { onHit: targets, onBlock: targets };
}
const legacyAttacks: Record<Exclude<AttackId, SwahiliAirSpecialId>, AttackDefinition> = {
  legacy_crown_of_no_gods: attacks.legacy_crown_of_no_gods,
  standing_light: { id: "standing_light", command: "5L", startup: 3, active: 5, recovery: 6, cancel: lamuhCancels(["standing_medium", "crouching_medium"]), groundOnly: true, hitboxes: [hit("legacy_5l", 3, 7, { x: 26, y: -82, w: 62, h: 36 }, 24, 4, 18, 10, 2.3, 0, "mid")] },
  standing_medium: { id: "standing_medium", command: "5M", startup: 6, active: 6, recovery: 11, cancel: lamuhCancels(["standing_heavy", "crouching_heavy"]), groundOnly: true, hitboxes: [hit("legacy_5m", 6, 11, { x: 30, y: -90, w: 82, h: 44 }, 48, 5, 29, 17, 3.1, 0, "mid")] },
  standing_heavy: { id: "standing_heavy", command: "5H", startup: 11, active: 5, recovery: 21, cancel: lamuhCancels([]), groundOnly: true, hitboxes: [hit("legacy_5h", 11, 15, { x: 38, y: -96, w: 104, h: 54 }, 82, 8, 42, 24, 5.5, -3, "mid", { knockdown: "soft" })] },
  crouching_light: { id: "crouching_light", command: "2L", startup: 3, active: 4, recovery: 7, cancel: lamuhCancels(["crouching_medium", "standing_medium"]), groundOnly: true, hitboxes: [hit("legacy_2l", 3, 6, { x: 22, y: -40, w: 62, h: 30 }, 22, 3, 18, 10, 2.1, 0, "low")] },
  crouching_medium: { id: "crouching_medium", command: "2M", startup: 6, active: 5, recovery: 11, cancel: lamuhCancels(["crouching_heavy", "standing_heavy"]), groundOnly: true, hitboxes: [hit("legacy_2m", 6, 10, { x: 26, y: -44, w: 102, h: 32 }, 44, 5, 27, 16, 3, 0, "low")] },
  crouching_heavy: { id: "crouching_heavy", command: "2H", startup: 10, active: 5, recovery: 22, cancel: lamuhCancels([]), groundOnly: true, hitboxes: [hit("legacy_2h", 10, 14, { x: 24, y: -118, w: 94, h: 116 }, 70, 8, 42, 24, 1.8, -15.5, "launcher", { launches: true, jumpCancelOnHit: true, juggleCost: 0 })] },
  air_light: { id: "air_light", command: "j.L", startup: 3, active: 5, recovery: 5, cancel: lamuhAirCancels(["air_medium", "air_heavy"]), airOnly: true, hitboxes: [hit("legacy_jl", 3, 7, { x: 18, y: -80, w: 68, h: 34 }, 22, 3, 20, 12, 1.7, -1.5, "mid", { juggleCost: 1 })] },
  air_medium: { id: "air_medium", command: "j.M", startup: 6, active: 4, recovery: 11, cancel: lamuhAirCancels(["air_heavy"]), airOnly: true, hitboxes: [hit("legacy_jm_kick", 6, 9, { x: 24, y: -74, w: 78, h: 44 }, 44, 4, 25, 15, 2.8, -7, "mid", { juggleCost: 2 })] },
  air_heavy: { id: "air_heavy", command: "j.H", startup: 8, active: 5, recovery: 17, cancel: lamuhAirCancels([]), airOnly: true, hitboxes: [hit("legacy_jh", 8, 12, { x: 20, y: -86, w: 86, h: 64 }, 72, 7, 30, 18, 5, 5, "mid", { knockdown: "soft", juggleCost: 2 })] },
  air_special_ender: { id: "air_special_ender", command: "j.S", startup: 5, active: 5, recovery: 18, airOnly: true, airActionCost: 0, cancelOnly: true, systemTestOnly: true, hitboxes: [hit("legacy_js", 5, 9, { x: 30, y: -80, w: 96, h: 100 }, 60, 7, 0, 13, 7, 10, "mid", { knockdown: "hard", juggleCost: 3 })] },
  special_neutral_medium: attacks.special_neutral_medium,
  special_forward_light: attacks.special_forward_light,
  special_forward_medium: attacks.special_forward_medium,
  special_forward_heavy: attacks.special_forward_heavy,
  special_down_light: attacks.special_down_light,
  special_down_medium: attacks.special_down_medium,
  special_down_heavy: attacks.special_down_heavy,
  special_up_medium: attacks.special_up_medium,
  special_up_heavy: attacks.special_up_heavy,
  legacy_celestial_palm_light: {
    id: "legacy_celestial_palm_light", command: "5S+L", startup: 9, active: 2, recovery: 17, groundOnly: true,
    rootMotion: { start: 10, end: 12, velocity: -0.6 }, hitboxes: [],
    projectile: { releaseTick: 9, spawnOffset: { x: 100, y: -137 }, releaseSweepStartX: 30, speed: 8, gravity: 0.18, maxTravel: 300, lifeTicks: 48,
      hitbox: hit("legacy_celestial_palm_light_orb", 0, 47, { x: -13, y: -13, w: 26, h: 26 }, 34, 4, 18, 11, 3.2, 0, "mid", { blockHitstop: 3, juggleCost: 1 }) }
  },
  legacy_celestial_palm_medium: {
    id: "legacy_celestial_palm_medium", command: "5S+M", startup: 14, active: 3, recovery: 23, groundOnly: true,
    rootMotion: { start: 15, end: 18, velocity: -0.9 }, hitboxes: [],
    projectile: { releaseTick: 14, spawnOffset: { x: 100, y: -137 }, releaseSweepStartX: 30, speed: 10, gravity: 0.18, maxTravel: 420, lifeTicks: 54,
      hitbox: hit("legacy_celestial_palm_medium_orb", 0, 53, { x: -17, y: -17, w: 34, h: 34 }, 48, 5, 23, 14, 4.4, 0, "mid", { blockHitstop: 4, juggleCost: 1 }) }
  },
  legacy_celestial_palm_heavy: {
    id: "legacy_celestial_palm_heavy", command: "5S+H", startup: 21, active: 4, recovery: 31, groundOnly: true,
    rootMotion: { start: 22, end: 27, velocity: -1.2 }, hitboxes: [],
    projectile: { releaseTick: 21, spawnOffset: { x: 130, y: -119 }, releaseSweepStartX: 30, speed: 12, gravity: 0.18, maxTravel: 540, lifeTicks: 60,
      hitbox: hit("legacy_celestial_palm_heavy_orb", 0, 59, { x: -21, y: -21, w: 42, h: 42 }, 68, 7, 29, 18, 6, 0, "mid", { blockHitstop: 6, juggleCost: 2 }) }
  },
  // Candidate ground aura family: one low contact per move; Heavy is a detached wave only.
  legacy_aura_sweep_light: {
    id: "legacy_aura_sweep_light", command: "2S+L", startup: 8, active: 4, recovery: 16, groundOnly: true,
    hitboxes: [hit("legacy_aura_sweep_light_heel", 8, 11, { x: 24, y: -42, w: 88, h: 36 }, 32, 4, 22, 12, 3.5, 0, "low", { blockHitstop: 3, juggleCost: 1 })]
  },
  legacy_aura_sweep_medium: {
    id: "legacy_aura_sweep_medium", command: "2S+M", startup: 13, active: 5, recovery: 24, groundOnly: true,
    rootMotion: { start: 4, end: 15, velocity: 3 },
    hitboxes: [hit("legacy_aura_sweep_medium_heel", 13, 17, { x: 24, y: -46, w: 112, h: 40 }, 48, 6, 28, 16, 5.5, 0, "low", { blockHitstop: 5, knockdown: "soft", juggleCost: 1 })]
  },
  legacy_aura_sweep_heavy: {
    id: "legacy_aura_sweep_heavy", command: "2S+H", startup: 22, active: 1, recovery: 33, groundOnly: true, hitboxes: [],
    projectile: { releaseTick: 22, spawnOffset: { x: 76, y: -24 }, releaseSweepStartX: 24, speed: 9, gravity: 0, maxTravel: 240, lifeTicks: 30,
      hitbox: hit("legacy_aura_sweep_heavy_wave", 0, 29, { x: -30, y: -23, w: 60, h: 46 }, 66, 8, 32, 20, 7.5, 0, "low", { blockHitstop: 6, knockdown: "soft", juggleCost: 2 }) }
  },
  // Divine Vanish is vulnerable grounded spacing, with no damaging active phase.
  legacy_divine_vanish_light: {
    id: "legacy_divine_vanish_light", command: "4S+L", startup: 3, active: 0, recovery: 17, groundOnly: true,
    rootMotionSegments: [{ start: 3, end: 4, velocity: -6 }, { start: 5, end: 6, velocity: -18 }, { start: 7, end: 8, velocity: -6 }], hitboxes: []
  },
  legacy_divine_vanish_medium: {
    id: "legacy_divine_vanish_medium", command: "4S+M", startup: 5, active: 0, recovery: 27, groundOnly: true,
    rootMotionSegments: [{ start: 5, end: 7, velocity: -2 }, { start: 8, end: 9, velocity: -3 }, { start: 10, end: 17, velocity: -20 }, { start: 18, end: 19, velocity: -4 }], hitboxes: []
  },
  legacy_divine_vanish_heavy: {
    id: "legacy_divine_vanish_heavy", command: "4S+H", startup: 6, active: 0, recovery: 34, groundOnly: true, hitboxes: [],
    strikeCounter: { start: 6, end: 17, response: {
      id: "legacy_divine_vanish_heavy", command: "genuine_strike_counter_only", startup: 12, active: 3, recovery: 40, groundOnly: true,
      responseStrikeInvulnThrough: 4,
      targetHurtboxProfile: "extended",
      hitboxes: [hit("legacy_divine_vanish_counter_rising_kick", 12, 14, { x: 62, y: -202, w: 52, h: 54 }, 28, 6, 38, 16, 12, -18, "launcher", { launches: true, juggleCost: 0, blockHitstop: 5 })],
      projectile: { releaseTick: 32, spawnOffset: { x: 73, y: -167 }, releaseSweepStartX: 73, speed: 32, initialVelocityY: -6, gravity: 0, maxTravel: 800, lifeTicks: 50,
        hitbox: hit("legacy_divine_vanish_counter_aura_ball", 0, 49, { x: -24, y: -24, w: 48, h: 48 }, 44, 8, 28, 16, 9, -7, "mid", { knockdown: "soft", juggleCost: 1, blockHitstop: 6 }) }
    } }
  },
  legacy_heaven_splitter_light: {
    id: "legacy_heaven_splitter_light", command: "8S+L", startup: 7, active: 4, recovery: 25, groundOnly: true,
    rootMotion: { start: 7, end: 10, velocity: 2 }, authoredHop: { takeoffTick: 7, apexTick: 14, landTick: 24, height: 16 },
    hurtboxProfile: "extended", targetHurtboxProfile: "extended",
    hitboxes: [hit("legacy_heaven_splitter_light_uppercut", 7, 10, { x: 6, y: -236, w: 54, h: 102 }, 44, 5, 22, 12, 2.5, -7, "launcher", { blockHitstop: 4, launches: true, juggleCost: 1 })]
  },
  legacy_heaven_splitter_medium: {
    id: "legacy_heaven_splitter_medium", command: "8S+M", startup: 10, active: 5, recovery: 28, groundOnly: true,
    rootMotion: { start: 10, end: 16, velocity: 2 }, authoredHop: { takeoffTick: 10, apexTick: 20, landTick: 33, height: 40 },
    hurtboxProfile: "extended", targetHurtboxProfile: "extended",
    hitboxes: [hit("legacy_heaven_splitter_medium_uppercut", 10, 14, { x: 6, y: -236, w: 54, h: 102 }, 62, 7, 28, 16, 3.4, -10, "launcher", { blockHitstop: 6, launches: true, juggleCost: 2 })]
  },
  legacy_heaven_splitter_heavy: {
    id: "legacy_heaven_splitter_heavy", command: "8S+H", startup: 14, active: 6, recovery: 33, groundOnly: true,
    rootMotion: { start: 14, end: 23, velocity: 2 }, authoredHop: { takeoffTick: 14, apexTick: 26, landTick: 43, height: 64 },
    hurtboxProfile: "extended", targetHurtboxProfile: "extended",
    hitboxes: [hit("legacy_heaven_splitter_heavy_uppercut", 14, 19, { x: 6, y: -236, w: 54, h: 102 }, 80, 9, 34, 19, 4.4, -12, "launcher", { blockHitstop: 8, launches: true, juggleCost: 2 })]
  },
  // Flight is entry-height dependent. `recovery` is post-landing commitment;
  // neither startup+active+recovery nor the pose strip is a fixed world landing clock.
  legacy_radiant_dive_light: {
    id: "legacy_radiant_dive_light", command: "j.S+L", startup: 7, active: 10, recovery: 10, airOnly: true, airActionCost: 2,
    authoredDive: { minimumHeight: 32, maximumHeight: 180, landingApproachHeight: 10, windupVelocity: { x: 0.8, y: 0.5 }, strikeVelocity: { x: 7, y: 5 }, gatherVelocity: { x: 2, y: 5 }, landingRecoveryTicks: 10 },
    hurtboxProfile: "extended", targetHurtboxProfile: "extended",
    hitboxes: [hit("legacy_radiant_dive_light_palm", 7, 16, { x: 40, y: -62, w: 54, h: 46 }, 40, 5, 18, 11, 4.5, 3, "mid", { blockHitstop: 4, juggleCost: 1 })]
  },
  legacy_radiant_dive_medium: {
    id: "legacy_radiant_dive_medium", command: "j.S+M", startup: 10, active: 10, recovery: 14, airOnly: true, airActionCost: 2,
    authoredDive: { minimumHeight: 44, maximumHeight: 180, landingApproachHeight: 16, windupVelocity: { x: 0.8, y: 0.5 }, strikeVelocity: { x: 5, y: 8 }, gatherVelocity: { x: 1, y: 8 }, landingRecoveryTicks: 14 },
    hurtboxProfile: "extended", targetHurtboxProfile: "extended",
    hitboxes: [hit("legacy_radiant_dive_medium_palm", 10, 19, { x: 38, y: -55, w: 54, h: 46 }, 58, 7, 24, 14, 6, 5, "mid", { blockHitstop: 6, juggleCost: 2 })]
  },
  legacy_radiant_dive_heavy: {
    id: "legacy_radiant_dive_heavy", command: "j.S+H", startup: 14, active: 12, recovery: 20, airOnly: true, airActionCost: 2,
    authoredDive: { minimumHeight: 60, maximumHeight: 180, landingApproachHeight: 24, windupVelocity: { x: 0.8, y: 0.5 }, strikeVelocity: { x: 3, y: 12 }, gatherVelocity: { x: 0.5, y: 12 }, landingRecoveryTicks: 20 },
    hurtboxProfile: "extended", targetHurtboxProfile: "extended",
    hitboxes: [hit("legacy_radiant_dive_heavy_palm", 14, 25, { x: 14, y: -28, w: 54, h: 50 }, 76, 9, 28, 17, 7.5, 8, "mid", { blockHitstop: 8, juggleCost: 2, knockdown: "soft" })]
  },
  legacy_ascend_step_light: { id: "legacy_ascend_step_light", command: "6S+L", startup: 5, active: 4, recovery: 11, groundOnly: true, rootMotion: { start: 2, end: 7, velocity: 8.3 }, hitboxes: [hit("legacy_ascend_step_light", 5, 8, { x: 28, y: -86, w: 88, h: 48 }, 32, 5, 22, 12, 3.5, 0, "mid")] },
  legacy_ascend_step: {
    id: "legacy_ascend_step", command: "6S+M", startup: 7, active: 24, recovery: 17, groundOnly: true,
    rootMotionSegments: [
      { start: 2, end: 11, velocity: 9 },
      { start: 12, end: 16, velocity: -2 },
      { start: 17, end: 26, velocity: -1.4 },
      { start: 27, end: 33, velocity: -1 }
    ],
    hitboxes: [
      hit("legacy_ascend_step_medium_slide", 7, 9, { x: 20, y: -48, w: 130, h: 42 }, 26, 5, 28, 16, 1, 0, "low", { blockHitstop: 4 }),
      hit("legacy_ascend_step_medium_backspring_launcher", 26, 28, { x: 12, y: -176, w: 122, h: 166 }, 44, 8, 34, 18, 3.4, -15.5, "launcher", { blockHitstop: 7, launches: true, juggleCost: 1 })
    ]
  },
  legacy_ascend_step_heavy: {
    id: "legacy_ascend_step_heavy", command: "6S+H", startup: 10, active: 3, recovery: 17, groundOnly: true,
    hitboxes: [hit("legacy_ascend_step_heavy_punch", 10, 12, { x: 20, y: -120, w: 105, h: 66 }, 24, 5, 12, 16, 0, 0, "mid", { blockHitstop: 4 })],
    hitConfirm: { hitboxId: "legacy_ascend_step_heavy_punch", holdThrough: 21, response: {
      id: "legacy_ascend_step_heavy", command: "genuine_punch_hit_only", startup: 22, active: 3, recovery: 39, groundOnly: true,
      targetHurtboxProfile: "extended",
      targetSideSwitch: { triggerTick: 14, captureRange: 180, behindDistance: 140, verticalTolerance: 110, requireTargetAhead: true, faceTargetAfterSwitch: true },
      hitboxes: [hit("legacy_ascend_step_heavy_kick", 22, 24, { x: 108, y: -148, w: 70, h: 58 }, 28, 6, 42, 18, 15, 0, "mid", { blockHitstop: 5 })],
      projectile: { releaseTick: 36, spawnOffset: { x: 58, y: -95 }, releaseSweepStartX: 30, speed: 28, gravity: 0, maxTravel: 1400, lifeTicks: 60,
        hitbox: hit("legacy_ascend_step_heavy_aura_ball", 0, 0, { x: -26, y: -30, w: 52, h: 60 }, 32, 6, 24, 18, 9, 0, "mid", { knockdown: "soft", blockHitstop: 5 }) }
    } }
  }
};
// Additive historical fixture: the retired single-blast Heavy is not playable.
export const LAMUH_ASCEND_HEAVY_V1_HISTORICAL: AttackDefinition = {
  id: "legacy_ascend_step_heavy", command: "6S+H", startup: 24, active: 5, recovery: 13, groundOnly: true,
  rootMotion: { start: 4, end: 11, velocity: 10.5 },
  targetSideSwitch: { triggerTick: 14, captureRange: 150, behindDistance: 62, verticalTolerance: 110, requireTargetAhead: true, faceTargetAfterSwitch: true },
  hitboxes: [hit("legacy_ascend_step_heavy_blast", 24, 28, { x: 24, y: -108, w: 142, h: 76 }, 84, 9, 36, 20, 7.5, -2, "mid", { blockHitstop: 7, knockdown: "soft" })]
};

const forwardThrow: ThrowDefinition = {
  id: "forward_throw", command: "Throw", startup: 4, connectTick: 4, releaseTick: 14, totalTicks: 32,
  range: 74, heightTolerance: 34, damage: 70, hitstop: 6, knockdownTicks: 30, victimClass: "standard_humanoid",
  track: [
    { tick: 0, attackerOffsetX: 0, attackerOffsetY: 0, victimOffsetX: 62, victimOffsetY: 0, victimRotation: 0, victimFacing: -1 },
    { tick: 4, attackerOffsetX: 5, attackerOffsetY: 0, victimOffsetX: 48, victimOffsetY: -4, victimRotation: -6, victimFacing: -1 },
    { tick: 8, attackerOffsetX: 12, attackerOffsetY: 0, victimOffsetX: 34, victimOffsetY: -15, victimRotation: -22, victimFacing: -1 },
    { tick: 12, attackerOffsetX: 23, attackerOffsetY: 0, victimOffsetX: 56, victimOffsetY: -26, victimRotation: -48, victimFacing: -1 },
    { tick: 14, attackerOffsetX: 30, attackerOffsetY: 0, victimOffsetX: 92, victimOffsetY: -34, victimRotation: -68, victimFacing: -1 },
    { tick: 20, attackerOffsetX: 34, attackerOffsetY: 0, victimOffsetX: 142, victimOffsetY: -22, victimRotation: -82, victimFacing: -1 },
    { tick: 26, attackerOffsetX: 34, attackerOffsetY: 0, victimOffsetX: 178, victimOffsetY: 0, victimRotation: -90, victimFacing: -1 },
    { tick: 31, attackerOffsetX: 34, attackerOffsetY: 0, victimOffsetX: 184, victimOffsetY: 0, victimRotation: 0, victimFacing: -1 }
  ]
};
const backThrow: ThrowDefinition = {
  id: "back_throw", command: "4+Throw", startup: 4, connectTick: 4, releaseTick: 16, totalTicks: 36,
  range: 74, heightTolerance: 34, damage: 75, hitstop: 7, knockdownTicks: 32, victimClass: "standard_humanoid",
  track: [
    { tick: 0, attackerOffsetX: 0, attackerOffsetY: 0, victimOffsetX: 62, victimOffsetY: 0, victimRotation: 0, victimFacing: -1 },
    { tick: 4, attackerOffsetX: 4, attackerOffsetY: 0, victimOffsetX: 46, victimOffsetY: -5, victimRotation: 8, victimFacing: -1 },
    { tick: 9, attackerOffsetX: -2, attackerOffsetY: 0, victimOffsetX: 22, victimOffsetY: -18, victimRotation: 35, victimFacing: -1 },
    { tick: 13, attackerOffsetX: -8, attackerOffsetY: 0, victimOffsetX: -12, victimOffsetY: -30, victimRotation: 82, victimFacing: 1 },
    { tick: 16, attackerOffsetX: -4, attackerOffsetY: 0, victimOffsetX: -58, victimOffsetY: -34, victimRotation: 118, victimFacing: 1 },
    { tick: 23, attackerOffsetX: 2, attackerOffsetY: 0, victimOffsetX: -112, victimOffsetY: -18, victimRotation: 156, victimFacing: 1 },
    { tick: 29, attackerOffsetX: 4, attackerOffsetY: 0, victimOffsetX: -148, victimOffsetY: 0, victimRotation: 180, victimFacing: 1 },
    { tick: 35, attackerOffsetX: 4, attackerOffsetY: 0, victimOffsetX: -154, victimOffsetY: 0, victimRotation: 0, victimFacing: 1 }
  ]
};

const commandGrabRotations = [0, 0, 0, 0, 0, 0, -4, -8, -14, -20, -30, -48, -72, -104, -142, -180, -180, -164, -146, -112, -72, -36, 0, 0] as const;
const commandGrab: ThrowDefinition = {
  id: "command_grab", command: "S+Throw", startup: 43, connectTick: 43, releaseTick: 80, totalTicks: COMMAND_GRAB_MOTION_V1_REVIEW.simulationTotalTicks,
  range: COMMAND_GRAB_MOTION_V1_REVIEW.captureRange, heightTolerance: 45, damage: COMMAND_GRAB_MOTION_V1_REVIEW.damage,
  hitstop: 12, knockdownTicks: 42, victimClass: "standard_humanoid",
  track: COMMAND_GRAB_MOTION_V1_FRAMES.map((frame) => ({
    tick: Math.ceil(frame.startSourceTick / COMMAND_GRAB_MOTION_V1_REVIEW.playbackRate),
    attackerOffsetX: (frame.attackerRoot[0] - 768) * COMMAND_GRAB_MOTION_V1_REVIEW.sourcePixelsToSimulationUnits,
    attackerOffsetY: (frame.attackerRoot[1] - 1408) * COMMAND_GRAB_MOTION_V1_REVIEW.sourcePixelsToSimulationUnits,
    victimOffsetX: (frame.victimRoot[0] - 768) * COMMAND_GRAB_MOTION_V1_REVIEW.sourcePixelsToSimulationUnits,
    victimOffsetY: (frame.victimRoot[1] - 1408) * COMMAND_GRAB_MOTION_V1_REVIEW.sourcePixelsToSimulationUnits,
    victimRotation: commandGrabRotations[frame.index - 1],
    victimFacing: frame.index >= 21 ? 1 : -1
  }))
};
const lamuhLegacyThrows: Partial<Record<ThrowId, ThrowDefinition>> = { forward_throw: forwardThrow, back_throw: backThrow };
// Compatibility prototype throws remain character-neutral fixtures. They intentionally use
// separate tracks from Lamuh Legacy so generic/default simulations do not inherit Lamuh's body
// mechanics, root offsets, or side-switch choreography.
const prototypeForwardThrow: ThrowDefinition = {
  ...forwardThrow,
  track: [
    { tick: 0, attackerOffsetX: 0, attackerOffsetY: 0, victimOffsetX: 58, victimOffsetY: 0, victimRotation: 0, victimFacing: -1 },
    { tick: 4, attackerOffsetX: 3, attackerOffsetY: 0, victimOffsetX: 50, victimOffsetY: -2, victimRotation: 0, victimFacing: -1 },
    { tick: 14, attackerOffsetX: 14, attackerOffsetY: 0, victimOffsetX: 76, victimOffsetY: -18, victimRotation: -30, victimFacing: -1 },
    { tick: 22, attackerOffsetX: 18, attackerOffsetY: 0, victimOffsetX: 128, victimOffsetY: -10, victimRotation: -85, victimFacing: -1 },
    { tick: 31, attackerOffsetX: 18, attackerOffsetY: 0, victimOffsetX: 156, victimOffsetY: 0, victimRotation: 0, victimFacing: -1 }
  ]
};
const prototypeBackThrow: ThrowDefinition = {
  ...backThrow,
  track: [
    { tick: 0, attackerOffsetX: 0, attackerOffsetY: 0, victimOffsetX: 58, victimOffsetY: 0, victimRotation: 0, victimFacing: -1 },
    { tick: 4, attackerOffsetX: 2, attackerOffsetY: 0, victimOffsetX: 48, victimOffsetY: -2, victimRotation: 0, victimFacing: -1 },
    { tick: 16, attackerOffsetX: -2, attackerOffsetY: 0, victimOffsetX: -44, victimOffsetY: -20, victimRotation: 92, victimFacing: 1 },
    { tick: 25, attackerOffsetX: 1, attackerOffsetY: 0, victimOffsetX: -104, victimOffsetY: -10, victimRotation: 180, victimFacing: 1 },
    { tick: 35, attackerOffsetX: 1, attackerOffsetY: 0, victimOffsetX: -138, victimOffsetY: 0, victimRotation: 0, victimFacing: 1 }
  ]
};
const prototypeThrows: Partial<Record<ThrowId, ThrowDefinition>> = {
  forward_throw: prototypeForwardThrow,
  back_throw: prototypeBackThrow,
  command_grab: commandGrab
};
export const fighterDefinitions: Record<string, FighterDefinition> = {
  lamuh_proto: { kind: "lamuh_proto", maxHealth: 1000, movement: move, combat, victimClass: "standard_humanoid", pushbox: { x: -22, y: -96, w: 44, h: 96 }, standingHurtboxes: [{ x: -24, y: -96, w: 48, h: 46 }, { x: -20, y: -52, w: 40, h: 52 }], crouchingHurtboxes: [{ x: -25, y: -66, w: 50, h: 66 }], attacks: { ...attacks, legacy_ascend_step_light: legacyAttacks.legacy_ascend_step_light, legacy_ascend_step: legacyAttacks.legacy_ascend_step, legacy_ascend_step_heavy: LAMUH_ASCEND_HEAVY_V1_HISTORICAL } as Record<AttackId, AttackDefinition>, throws: prototypeThrows },
  // Candidate body-aligned defense for new traveling projectiles only. Existing normal collisions are unchanged.
  lamuh_legacy_v2: { kind: "lamuh_legacy_v2", maxHealth: 1000, movement: legacyMove, combat: legacyCombat, victimClass: "standard_humanoid", pushbox: { x: -34, y: -98, w: 68, h: 98 }, standingHurtboxes: [{ x: -25, y: -98, w: 50, h: 48 }, { x: -21, y: -54, w: 42, h: 54 }], crouchingHurtboxes: [{ x: -26, y: -68, w: 52, h: 68 }], projectileHurtboxes: legacyAdultHurtboxes, extendedHurtboxes: legacyAdultHurtboxes, attacks: legacyAttacks as Record<AttackId, AttackDefinition>, throws: lamuhLegacyThrows },
  training_dummy: { kind: "training_dummy", maxHealth: 1000, movement: { ...move, walkForward: 0, walkBackward: 0 }, combat, victimClass: "standard_humanoid", pushbox: { x: -23, y: -98, w: 46, h: 98 }, standingHurtboxes: [{ x: -25, y: -98, w: 50, h: 48 }, { x: -21, y: -54, w: 42, h: 54 }], crouchingHurtboxes: [{ x: -25, y: -68, w: 50, h: 68 }], attacks: { ...attacks, legacy_ascend_step_light: legacyAttacks.legacy_ascend_step_light, legacy_ascend_step: legacyAttacks.legacy_ascend_step, legacy_ascend_step_heavy: LAMUH_ASCEND_HEAVY_V1_HISTORICAL } as Record<AttackId, AttackDefinition>, throws: {} }
};
export const defaultTuning = { lamuh_proto: move, lamuh_legacy_v2: { movement: legacyMove, combat: legacyCombat, attacks: legacyAttacks, throws: lamuhLegacyThrows }, combat, attacks };
