/* Hidden preview-only Swahili character data.
 * Loaded by index.html only when ?swahiliTest is present.
 * Runtime adapters live in game.js; production art remains intentionally absent.
 */
(function registerSwahiliCharacterData(global) {
  "use strict";

  const move = (name, damage, startup, active, recovery, hitstun, knockbackX, knockbackY, boxType, flags = {}) => ({
    name,
    damage,
    startup,
    active,
    recovery,
    hitstun,
    knockbackX,
    knockbackY,
    boxType,
    flags
  });

  const normals = {
    neutral_light: move("Cuff Check", 24, 5, 3, 8, 16, 24, -12, "light", { cancelOnHit: ["neutral_medium"], autoCombo: true, debtVfx: "ring_glint" }),
    neutral_medium: move("Silk Lapel", 43, 8, 4, 13, 25, 42, -28, "medium", { cancelOnHit: ["neutral_heavy", "down_medium", "neutral_light_special"], debtVfx: "coat_snap" }),
    neutral_heavy: move("Executive Cleave", 72, 14, 5, 22, 36, 104, -54, "scytheHeavy", { softKnockdown: true, debtOnCounterHit: 1, scythe: true }),
    down_light: move("Low Fee", 22, 6, 3, 9, 15, 28, 0, "low", { cancelOnHit: ["down_medium", "neutral_medium"] }),
    down_medium: move("Contract Sweep", 40, 10, 4, 16, 28, 62, 70, "scytheLow", { softKnockdown: true, cancelOnHit: ["down_heavy", "down_medium_special"], scythe: true }),
    down_heavy: move("Audit Uppercut", 64, 11, 5, 25, 38, 46, -420, "scytheAntiAir", { launcher: true, jumpCancel: true, softKnockdown: true, debtOnAirHit: 1, scythe: true }),
    jump_light: move("Pocket Tap", 20, 5, 4, 7, 18, 22, -12, "jump", { air: true, cancelOnHit: ["jump_medium"], pistolButt: true }),
    jump_medium: move("Gold-Toe Drop", 38, 8, 5, 11, 26, 34, 30, "jump", { air: true, cancelOnHit: ["jump_heavy"], crossUp: true }),
    jump_heavy: move("Reaper's Hem", 62, 13, 6, 20, 34, 52, 170, "scytheAir", { air: true, softKnockdown: true, scythe: true }),
    forward_light: move("Tie Flick", 25, 7, 3, 11, 17, 30, -10, "light", { cancelOnHit: ["forward_medium", "neutral_medium"], tieStrike: true }),
    forward_medium: move("Probate Step", 46, 12, 4, 17, 28, 66, -34, "medium", { cancelOnHit: ["neutral_medium"], stepForward: 82, upperBodyArmorStub: true }),
    forward_heavy: move("Estate Breaker", 78, 24, 5, 26, 42, 96, 120, "scytheOverhead", { overhead: true, softKnockdown: true, scythe: true }),
    back_light: move("Receipt Jab", 23, 6, 3, 10, 16, 30, -12, "light", { retreatStep: 44, pistolButt: true }),
    back_medium: move("Collateral Hook", 42, 11, 4, 17, 28, 58, -30, "scytheHook", { pull: true, cancelOnHit: ["neutral_heavy", "back_light_special"], scythe: true }),
    back_heavy: move("Repossession", 58, 17, 1, 24, 30, 84, -80, "pistol", { projectile: true, projectileSpeed: 640, noHit: true, softKnockdown: true, pistolShot: true })
  };

  const specials = {
    neutral_light_special: move("Clause: Single Notice", 28, 12, 1, 20, 22, 52, -24, "pistol", { projectile: true, projectileSpeed: 620, noHit: true, pistolShot: true, visualProfile: "contractBullet", variantRole: "fast_check" }),
    neutral_medium_special: move("Collateral: Double Entry", 24, 14, 1, 26, 24, 60, -28, "pistol", { projectile: true, projectileSpeed: 590, noHit: true, pistolShot: true, visualProfile: "doubleEntry", stubMultiShot: 2, variantRole: "pressure_gap" }),
    neutral_heavy_special: move("Golden Injunction", 66, 22, 1, 31, 34, 156, -76, "pistolHeavy", { projectile: true, projectileSpeed: 520, noHit: true, pistolShot: true, visualProfile: "goldenInjunction", debtOnHit: 1, softKnockdown: true, variantRole: "charged_wall_control" }),
    forward_light_special: move("Signature Swipe", 44, 10, 4, 17, 26, 76, -42, "scytheMedium", { dash: true, dashSpeed: 460, dashTime: 0.13, scythe: true, variantRole: "quick_ender" }),
    forward_medium_special: move("Ink-Dry Lunge", 58, 15, 5, 22, 31, 106, -58, "scytheLunge", { dash: true, dashSpeed: 590, dashTime: 0.18, scythe: true, softKnockdown: true, variantRole: "wall_carry" }),
    forward_heavy_special: move("Execution Clause", 76, 24, 6, 30, 38, 148, -88, "scytheHeavy", { dash: true, dashSpeed: 680, dashTime: 0.22, scythe: true, armorStub: true, defaultedCashoutStub: true, softKnockdown: true, variantRole: "armored_callout" }),
    back_light_special: move("Fine Print", 0, 18, 0, 20, 0, 0, 0, "contractTrap", { noHit: true, swahiliTrap: true, trapDistance: 116, trapLife: 4, debtOnHit: 1, variantRole: "near_trap" }),
    back_medium_special: move("Hidden Clause", 0, 22, 0, 24, 0, 0, 0, "contractTrap", { noHit: true, swahiliTrap: true, trapDistance: 230, trapLife: 5, debtOnHit: 1, variantRole: "far_trap" }),
    back_heavy_special: move("Default Judgment", 34, 4, 1, 32, 32, 88, -90, "contractCounter", { noHit: true, swahiliCounter: true, counterActiveFrames: 16, debtOnCounter: 2, softKnockdown: true, variantRole: "reversal_counter_stub" }),
    down_light_special: move("Kneecap Notice", 30, 13, 1, 21, 22, 52, 8, "pistolLow", { projectile: true, projectileSpeed: 520, noHit: true, lowProjectile: true, pistolShot: true, visualProfile: "kneecapNotice" }),
    down_medium_special: move("Shin Reaper", 54, 16, 6, 24, 30, 84, 96, "scytheLow", { dash: true, dashSpeed: 420, dashTime: 0.16, hardKnockdown: true, scythe: true, variantRole: "sliding_low" }),
    down_heavy_special: move("Asset Seizure", 62, 18, 3, 34, 34, 34, -72, "scytheHook", { swahiliCommandGrabStub: true, pull: true, debtOnHit: 1, hardKnockdown: true, scythe: true, variantRole: "command_grab_stub" }),
    up_light_special: move("Ceiling Tax", 28, 8, 1, 18, 24, 36, -170, "pistolUp", { projectile: true, projectileSpeed: 560, noHit: true, pistolShot: true, launcher: true, visualProfile: "ceilingTax" }),
    up_medium_special: move("Vertical Audit", 56, 11, 7, 26, 34, 44, -390, "scytheAntiAir", { rise: true, riseVelocity: -300, riseTime: 0.18, launcher: true, scythe: true, softKnockdown: true, variantRole: "rising_launcher" }),
    up_heavy_special: move("Death & Interest", 72, 7, 8, 38, 38, 74, -330, "scytheReversal", { rise: true, riseVelocity: -360, riseTime: 0.2, invulnerableStubFrames: 8, consumeDebtStub: 1, hardKnockdown: true, scythe: true, variantRole: "invincible_reversal_stub" })
  };

  const requiredProductionClips = [
    "idle", "walk_forward", "walk_backward", "dash_forward", "dash_backward", "jump_start", "jump_up", "jump_forward", "jump_backward", "fall", "land", "crouch", "crouch_idle", "turn",
    "stand_block", "crouch_block", "air_block", "blockstun_high", "blockstun_low", "guard_break", "counter_stance", "wakeup",
    "hit_high_light", "hit_high_heavy", "hit_low", "hit_air", "launch", "wall_bounce", "ground_bounce", "knockdown", "hard_knockdown", "getup", "dizzy_stagger",
    ...Object.keys(normals),
    ...Object.keys(specials),
    "forward_throw", "back_throw", "throw_whiff",
    "ultimate_start", "ultimate_hit", "ultimate_cinematic", "ultimate_finish", "ultimate_whiff", "ultimate_blocked",
    "intro", "round_start", "taunt_tie_adjust", "win", "perfect_win", "lose", "time_over", "mirror_match_intro"
  ];

  global.SWAHILI_CHARACTER_DATA = {
    schemaVersion: 1,
    id: "swahili",
    name: "SWAHILI",
    shortName: "SWAHILI",
    subtitle: "THE DIVINE DEBT COLLECTOR",
    role: "CONTRACT TRAP / WHIFF PUNISH",
    health: 1050,
    movement: { walkForward: 187, walkBack: 145, dashSpeed: 784, dashDuration: 0.2667, dashCooldown: 0.3333, superDashSpeed: 874, superDashCooldown: 0.4667 },
    jump: { jumpVelocity: -612, gravity: 1900, juggleGravity: 1350, airRecoveryGravity: 1780, landingRecovery: 0.1167, airRecoveryDuration: 0.22 },
    airDash: { speed: 620, duration: 0.1667, cooldown: 0.25 },
    normals,
    specials,
    ultimate: move("Paid in Full", 190, 10, 5, 42, 50, 250, -240, "ultimate", { ultimate: true, swahiliUltimate: true, hardKnockdown: true, invulnerableStubFrames: 12 }),
    debt: { maxMarks: 5, markDuration: 8, defaultedDuration: 3, knockdownPenalty: 2 },
    palette: { black: "#1a1a1a", nearBlack: "#0b0b0d", white: "#ffffff", gold: "#d9aa37", brass: "#888608", skin: "#f0b1a8", smoke: "#2b2b2b" },
    hooks: {
      vfx: ["contract_seal_apply", "defaulted_ring", "counter_page_shield", "ledger_open", "paid_in_full_overlay"],
      sfx: ["pistol_luxury_crack", "scythe_heavy_whoosh", "debt_stamp_coin", "trap_parchment_bell", "ultimate_vault_stamp"],
      voice: ["intro", "round_start", "damage", "low_health", "win", "taunt", "ultimate_start", "ultimate_finish"]
    },
    requiredProductionClips,
    productionAnimationStatus: Object.fromEntries(requiredProductionClips.map((clip) => [clip, "missing"])),
    placeholderMode: "procedural_dev_only",
    approvedForLiveRoster: false
  };
})(globalThis);
