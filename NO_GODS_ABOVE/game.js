(() => {
  "use strict";

  const canvas = document.getElementById("game");
  const ctx = canvas.getContext("2d");
  const startButton = document.getElementById("start-button");
  const titleScreen = document.getElementById("title-screen");
  const characterSelect = document.getElementById("character-select");
  const characterButtons = document.querySelectorAll("[data-character]");
  const selectModeLabel = document.getElementById("select-mode-label");
  const selectVersusButton = document.getElementById("select-versus-button");
  const selectTrainingButton = document.getElementById("select-training-button");
  const p1SelectSlot = document.getElementById("p1-select-slot");
  const p2SelectSlot = document.getElementById("p2-select-slot");
  const p1SelectName = document.getElementById("p1-select-name");
  const p2SelectName = document.getElementById("p2-select-name");
  const p1SelectStatus = document.getElementById("p1-select-status");
  const p2SelectStatus = document.getElementById("p2-select-status");
  const matchupPreview = document.getElementById("matchup-preview");
  const hud = document.getElementById("hud");
  const playerNameEl = document.getElementById("player-name");
  const enemyNameEl = document.getElementById("enemy-name");
  const playerHpEl = document.getElementById("player-hp");
  const enemyHpEl = document.getElementById("enemy-hp");
  const playerMeterEl = document.getElementById("player-meter");
  const enemyMeterEl = document.getElementById("enemy-meter");
  const roundStatusEl = document.getElementById("round-status");
  const comboCounterEl = document.getElementById("combo-counter");

  const W = canvas.width;
  const H = canvas.height;
  const GROUND_Y = 590;
  const debugParams = new URLSearchParams(window.location.search);
  const SERIS_HIDDEN_TEST_ENABLED = debugParams.has("serisTest");
  const SERIS_RUNTIME_ENABLED = true;
  const SERIS_CHAIN_VFX_RUNTIME_ENABLED = false;
  const PLAYER_MAX_HP = 1000;
  const ENEMY_MAX_HP = 1000;
  const METER_MAX = 100;
  const GRAVITY = 1800;
  const JUGGLE_GRAVITY = 1260;
  const AIR_RECOVERY_GRAVITY = 1660;
  const JUMP_VELOCITY = -720;
  const WALK_FORWARD = 220;
  const WALK_BACK = 170;
  const DASH_SPEED = 825;
  const DASH_DURATION = 16 / 60;
  const DASH_COOLDOWN = 20 / 60;
  const AIR_DASH_SPEED = 760;
  const AIR_DASH_DURATION = 13 / 60;
  const AIR_DASH_COOLDOWN = 12 / 60;
  const SUPER_DASH_SPEED = 920;
  const SUPER_DASH_COOLDOWN = 28 / 60;
  const INPUT_BUFFER = 14 / 60;
  const AIR_RECOVERY_DURATION = 16 / 60;
  const LANDING_RECOVERY = 6 / 60;
  const SOFT_KNOCKDOWN = 30 / 60;
  const HARD_KNOCKDOWN = 68 / 60;
  const GROUND_PUSH_SEPARATION = 116;
  const GROUND_HIT_SEPARATION = 108;
  const AIR_HIT_SEPARATION = 82;
  const AIR_HIT_MAX_SEPARATION = 128;
  const COMBO_DROP_WINDOW = 0.68;
  const COMBO_DISPLAY_TIME = 1.15;
  // Versus combo governor: damage starts full, then falls 10% per hit to a 50% floor.
  const COMBO_SCALE_STEP = 0.1;
  const COMBO_MIN_SCALE = 0.5;
  const COMBO_MIN_DAMAGE = 1;
  const HITSTUN_DECAY_MID_START_HITS = 3;
  const HITSTUN_DECAY_HIGH_START_HITS = 6;
  const HITSTUN_MID_COMBO_SCALE = 0.9;
  const HITSTUN_HIGH_COMBO_SCALE = 0.8;
  const KNOCKBACK_GROWTH_START_HITS = 3;
  const KNOCKBACK_GROWTH_STEP = 0.025;
  const KNOCKBACK_GROWTH_MAX = 1.18;
  const MAX_AIR_KNOCKBACK_X = 128;
  const MAX_AIR_SPIKE_VELOCITY = 330;
  const CAMERA_SHAKE_DECAY = 46;
  const PASSIVE_METER_PER_SECOND = 10;
  const ENEMY_AI_WALK_SPEED = 135;
  const ENEMY_AI_ATTACK_RANGE = 320;
  const ENEMY_AI_MIN_COOLDOWN = 1.1;
  const ENEMY_AI_MAX_COOLDOWN = 1.9;

  const assetPaths = {
    stage: "assets/backgrounds/stages/forsaken_courtyard.png",
    title: "assets/backgrounds/menus/title_screen_background.png",
    kairoFinalBasic: "assets/sprites/kairo_final/kairo_sheet_1_basic_movement.png",
    kairoFinalDefense: "assets/sprites/kairo_final/kairo_sheet_2_defense_recovery.png",
    kairoFinalCoreA: "assets/sprites/kairo_final/kairo_sheet_3_core_attacks_a.png",
    kairoFinalCoreB: "assets/sprites/kairo_final/kairo_sheet_4_core_attacks_b.png",
    kairoFinalLowAir: "assets/sprites/kairo_final/kairo_sheet_5_low_air.png",
    kairoFinalSpecials: "assets/sprites/kairo_final/kairo_sheet_6_specials_ultimate.png",
    kairoFinalEnd: "assets/sprites/kairo_final/kairo_sheet_7_end_states_extras.png",
    vantaFinalBasic: "assets/sprites/vanta_final/vanta_sheet_1_basic_movement.png?v=vanta-row-fix-1",
    vantaFinalDefense: "assets/sprites/vanta_final/vanta_sheet_2_defense_recovery.png",
    vantaFinalCoreA: "assets/sprites/vanta_final/vanta_sheet_3_core_attacks_a.png",
    vantaFinalCoreB: "assets/sprites/vanta_final/vanta_sheet_4_core_attacks_b.png",
    vantaFinalLowAir: "assets/sprites/vanta_final/vanta_sheet_5_low_air.png",
    vantaFinalSpecials: "assets/sprites/vanta_final/vanta_sheet_6_specials_ultimate.png?v=vanta-row-fix-1",
    vantaFinalEnd: "assets/sprites/vanta_final/vanta_sheet_7_end_states_extras.png",
    nyxConcept3x6: "assets/sprites/nyx_generated/nyx_concept_sheet_3x6_shadow_assassin.png",
    nyxFinalCoreMovement: "assets/sprites/nyx_final/nyx_sheet_1_core_movement_atlas.png",
    nyxFinalAirMovement: "assets/sprites/nyx_final/nyx_sheet_2_air_movement_atlas.png",
    nyxFinalGroundNormals: "assets/sprites/nyx_final/nyx_sheet_3_ground_normals_atlas.png",
    nyxFinalAirNormals: "assets/sprites/nyx_final/nyx_sheet_4_air_normals_atlas.png",
    nyxFinalSpecials: "assets/sprites/nyx_final/nyx_sheet_5_specials_atlas.png",
    nyxFinalDefense: "assets/sprites/nyx_final/nyx_sheet_6_defense_hit_reactions_atlas.png",
    nyxFinalEndStates: "assets/sprites/nyx_final/nyx_sheet_7_knockdown_recovery_flavor_atlas.png",
    nyxPhantomSlash: "assets/effects/nyx/nyx_phantom_slash_wave_anim.png",
    solFinalCoreMovement: "assets/sprites/sol_final/sol_sheet_1_core_movement_atlas.png?v=sol-runtime-1",
    solFinalAirMovement: "assets/sprites/sol_final/sol_sheet_2_air_movement_atlas.png?v=sol-runtime-1",
    solFinalGroundNormals: "assets/sprites/sol_final/sol_sheet_3_ground_normals_atlas.png?v=sol-runtime-1",
    solFinalAirNormals: "assets/sprites/sol_final/sol_sheet_4_air_normals_atlas.png?v=sol-runtime-1",
    solFinalSpecials: "assets/sprites/sol_final/sol_sheet_5_specials_atlas.png?v=sol-runtime-1",
    solFinalDefense: "assets/sprites/sol_final/sol_sheet_6_defense_hit_reactions_atlas.png?v=sol-runtime-1",
    solFinalEndStates: "assets/sprites/sol_final/sol_sheet_7_knockdown_recovery_flavor_atlas.png?v=sol-runtime-1",
    solFinalDirectionalNormals: "assets/sprites/sol_final/sol_sheet_8_directional_normals_atlas.png?v=sol-directional-normals-1",
    serisFinalCoreMovement: SERIS_RUNTIME_ENABLED ? "assets/sprites/seris_revamp_final/seris_revamp_final_sheet_1_core_movement_atlas.png?v=seris-revamp-final-1" : null,
    serisFinalAirMovement: SERIS_RUNTIME_ENABLED ? "assets/sprites/seris_revamp_final/seris_revamp_final_sheet_2_air_movement_atlas.png?v=seris-revamp-final-1" : null,
    serisFinalGroundNormals: SERIS_RUNTIME_ENABLED ? "assets/sprites/seris_revamp_final/seris_revamp_final_sheet_3_ground_normals_atlas.png?v=seris-revamp-final-1" : null,
    serisFinalAirNormals: SERIS_RUNTIME_ENABLED ? "assets/sprites/seris_revamp_final/seris_revamp_final_sheet_4_air_normals_atlas.png?v=seris-revamp-final-1" : null,
    serisFinalSpecials: SERIS_RUNTIME_ENABLED ? "assets/sprites/seris_revamp_final/seris_revamp_final_sheet_5_specials_body_atlas.png?v=seris-revamp-final-1" : null,
    serisFinalDefense: SERIS_RUNTIME_ENABLED ? "assets/sprites/seris_revamp_final/seris_revamp_final_sheet_6_defense_hit_reactions_atlas.png?v=seris-revamp-final-1" : null,
    serisFinalEndStates: SERIS_RUNTIME_ENABLED ? "assets/sprites/seris_revamp_final/seris_revamp_final_sheet_7_knockdown_recovery_flavor_atlas.png?v=seris-revamp-final-1" : null,
    serisChainWhipVfx: SERIS_RUNTIME_ENABLED && SERIS_CHAIN_VFX_RUNTIME_ENABLED ? "assets/effects/seris/seris_chain_whip_vfx_atlas.png?v=seris-visual-integrity-1" : null,
    vfx: "assets/effects/combat/combat_vfx_sheet.png"
  };

  const sheetMeta = {
    kairoFinalBasic: { cols: 6, rows: 5, cellSize: 320, baselineY: 300, scale: 1.38, framePad: 2, anchorMode: "lockedFrameBottomCenter" },
    kairoFinalDefense: { cols: 6, rows: 5, cellSize: 320, baselineY: 300, scale: 1.38, framePad: 2, anchorMode: "lockedFrameBottomCenter" },
    kairoFinalCoreA: { cols: 6, rows: 5, cellSize: 320, baselineY: 300, scale: 1.38, framePad: 2, anchorMode: "lockedFrameBottomCenter", allowDetachedEffects: true },
    kairoFinalCoreB: { cols: 6, rows: 5, cellSize: 320, baselineY: 300, scale: 1.38, framePad: 2, anchorMode: "lockedFrameBottomCenter", allowDetachedEffects: true },
    kairoFinalLowAir: { cols: 6, rows: 5, cellSize: 320, baselineY: 300, scale: 1.42, framePad: 2, anchorMode: "lockedFrameBottomCenter", allowDetachedEffects: true },
    kairoFinalSpecials: { cols: 6, rows: 5, cellSize: 320, baselineY: 300, scale: 1.42, framePad: 2, anchorMode: "lockedFrameBottomCenter", allowDetachedEffects: true, noDetachedEffectRows: [2] },
    kairoFinalEnd: { cols: 6, rows: 5, cellSize: 320, baselineY: 300, scale: 1.38, framePad: 2, anchorMode: "lockedFrameBottomCenter" },
    vantaFinalBasic: { cols: 6, rows: 5, baselineRatio: 0.94, scale: 1.38, framePad: 2, anchorMode: "lockedFrameBottomCenter" },
    vantaFinalDefense: { cols: 6, rows: 5, baselineRatio: 0.94, scale: 1.38, framePad: 2, anchorMode: "lockedFrameBottomCenter" },
    vantaFinalCoreA: { cols: 6, rows: 5, baselineRatio: 0.94, scale: 1.38, framePad: 2, anchorMode: "lockedFrameBottomCenter", allowDetachedEffects: true },
    vantaFinalCoreB: { cols: 6, rows: 5, baselineRatio: 0.94, scale: 1.38, framePad: 2, anchorMode: "lockedFrameBottomCenter", allowDetachedEffects: true },
    vantaFinalLowAir: { cols: 6, rows: 5, baselineRatio: 0.94, scale: 1.42, framePad: 2, anchorMode: "lockedFrameBottomCenter", allowDetachedEffects: true },
    vantaFinalSpecials: { cols: 6, rows: 5, baselineRatio: 0.94, scale: 1.42, framePad: 2, anchorMode: "lockedFrameBottomCenter", allowDetachedEffects: true, noDetachedEffectRows: [2] },
    vantaFinalEnd: { cols: 6, rows: 5, baselineRatio: 0.94, scale: 1.38, framePad: 2, anchorMode: "lockedFrameBottomCenter" },
    nyxConcept3x6: { cols: 6, rows: 3, baselineRatio: 0.88, scale: 1.0, framePad: 2, anchorMode: "lockedFrameBottomCenter", allowDetachedEffects: true },
    nyxFinalCoreMovement: { cols: 6, rows: 6, cellSize: 320, baselineY: 300, scale: 1.0, framePad: 2, anchorMode: "lockedFrameBottomCenter" },
    nyxFinalAirMovement: { cols: 6, rows: 6, cellSize: 320, baselineY: 300, scale: 1.0, framePad: 2, anchorMode: "lockedFrameBottomCenter" },
    nyxFinalGroundNormals: { cols: 8, rows: 4, cellSize: 320, baselineY: 300, scale: 1.0, framePad: 2, anchorMode: "lockedFrameBottomCenter", allowDetachedEffects: true },
    nyxFinalAirNormals: { cols: 6, rows: 4, cellSize: 320, baselineY: 300, scale: 1.0, framePad: 2, anchorMode: "lockedFrameBottomCenter", allowDetachedEffects: true },
    nyxFinalSpecials: { cols: 10, rows: 7, cellSize: 320, baselineY: 300, scale: 1.0, framePad: 2, anchorMode: "lockedFrameBottomCenter", allowDetachedEffects: true },
    nyxFinalDefense: { cols: 6, rows: 8, cellSize: 320, baselineY: 300, scale: 1.0, framePad: 2, anchorMode: "lockedFrameBottomCenter" },
    nyxFinalEndStates: { cols: 8, rows: 7, cellSize: 320, baselineY: 300, scale: 1.0, framePad: 2, anchorMode: "lockedFrameBottomCenter" },
    solFinalCoreMovement: { cols: 8, rows: 6, cellSize: 448, baselineY: 382, scale: 1.0, frameCounts: [8, 6, 6, 6, 6, 4], fixedSourceCells: true, anchorMode: "lockedFrameBottomCenter", skipSanitize: true },
    solFinalAirMovement: { cols: 6, rows: 6, cellSize: 448, baselineY: 382, scale: 1.0, frameCounts: [4, 4, 4, 4, 6, 6], fixedSourceCells: true, anchorMode: "lockedFrameBottomCenter", skipSanitize: true },
    solFinalGroundNormals: { cols: 7, rows: 4, cellSize: 448, baselineY: 382, scale: 1.0, frameCounts: [4, 6, 7, 7], fixedSourceCells: true, anchorMode: "lockedFrameBottomCenter", skipSanitize: true },
    solFinalAirNormals: { cols: 7, rows: 4, cellSize: 448, baselineY: 382, scale: 1.0, frameCounts: [4, 6, 7, 4], fixedSourceCells: true, anchorMode: "lockedFrameBottomCenter", skipSanitize: true },
    solFinalSpecials: { cols: 8, rows: 5, cellSize: 448, baselineY: 382, scale: 1.0, frameCounts: [8, 8, 8, 6, 8], fixedSourceCells: true, anchorMode: "lockedFrameBottomCenter", skipSanitize: true },
    solFinalDefense: { cols: 6, rows: 8, cellSize: 448, baselineY: 382, scale: 1.0, frameCounts: [4, 4, 4, 3, 4, 6, 5, 5], fixedSourceCells: true, anchorMode: "lockedFrameBottomCenter", skipSanitize: true },
    solFinalEndStates: { cols: 8, rows: 7, cellSize: 448, baselineY: 382, scale: 1.0, frameCounts: [6, 3, 6, 8, 8, 8, 8], fixedSourceCells: true, anchorMode: "lockedFrameBottomCenter", skipSanitize: true },
    solFinalDirectionalNormals: { cols: 6, rows: 6, cellSize: 448, baselineY: 382, scale: 1.0, frameCounts: [4, 4, 4, 6, 6, 6], fixedSourceCells: true, anchorMode: "lockedFrameBottomCenter", skipSanitize: true },
    serisFinalCoreMovement: { cols: 8, rows: 6, cellSize: 384, baselineY: 350, scale: 1.0, frameCounts: [8, 6, 6, 6, 6, 4], fixedSourceCells: true, anchorMode: "lockedFrameBottomCenter", skipSanitize: true },
    serisFinalAirMovement: { cols: 6, rows: 6, cellSize: 384, baselineY: 350, scale: 1.0, frameCounts: [4, 4, 4, 4, 6, 6], fixedSourceCells: true, anchorMode: "lockedFrameBottomCenter", skipSanitize: true },
    serisFinalGroundNormals: { cols: 8, rows: 4, cellWidth: 832, cellHeight: 448, anchorX: 320, baselineY: 406, scale: 1.0, frameCounts: [4, 8, 7, 7], fixedSourceCells: true, anchorMode: "lockedFrameBottomCenter", skipSanitize: true },
    serisFinalAirNormals: { cols: 7, rows: 4, cellWidth: 832, cellHeight: 448, anchorX: 320, baselineY: 406, scale: 1.0, frameCounts: [4, 6, 7, 4], fixedSourceCells: true, anchorMode: "lockedFrameBottomCenter", skipSanitize: true },
    serisFinalSpecials: { cols: 8, rows: 6, cellWidth: 832, cellHeight: 448, anchorX: 320, baselineY: 406, scale: 1.0, frameCounts: [4, 6, 4, 8, 8, 4], fixedSourceCells: true, anchorMode: "lockedFrameBottomCenter", skipSanitize: true },
    serisFinalDefense: { cols: 6, rows: 8, cellSize: 384, baselineY: 350, scale: 1.0, frameCounts: [4, 4, 4, 3, 4, 6, 5, 5], fixedSourceCells: true, anchorMode: "lockedFrameBottomCenter", skipSanitize: true },
    serisFinalEndStates: { cols: 8, rows: 7, cellSize: 384, baselineY: 350, scale: 1.0, frameCounts: [6, 3, 6, 8, 8, 8, 8], fixedSourceCells: true, anchorMode: "lockedFrameBottomCenter", skipSanitize: true }
  };

  const baselineMovementStats = {
    walkForward: WALK_FORWARD,
    walkBack: WALK_BACK,
    dashSpeed: DASH_SPEED,
    dashDuration: DASH_DURATION,
    dashCooldown: DASH_COOLDOWN,
    superDashSpeed: SUPER_DASH_SPEED,
    superDashCooldown: SUPER_DASH_COOLDOWN
  };

  const baselineJumpStats = {
    jumpVelocity: JUMP_VELOCITY,
    gravity: GRAVITY,
    juggleGravity: JUGGLE_GRAVITY,
    airRecoveryGravity: AIR_RECOVERY_GRAVITY,
    airRecoveryDuration: AIR_RECOVERY_DURATION,
    landingRecovery: LANDING_RECOVERY
  };

  const baselineAirDashStats = {
    speed: AIR_DASH_SPEED,
    duration: AIR_DASH_DURATION,
    cooldown: AIR_DASH_COOLDOWN
  };

  const baselineHitboxes = {
    light: { w: 86, h: 58, ox: 42, oy: -76 },
    medium: { w: 112, h: 64, ox: 50, oy: -82 },
    heavy: { w: 142, h: 88, ox: 58, oy: -96 },
    low: { w: 104, h: 42, ox: 42, oy: -42 },
    jump: { w: 106, h: 70, ox: 42, oy: -88 },
    chain: { w: 185, h: 58, ox: 58, oy: -84 },
    ultimate: { w: 320, h: 150, ox: 90, oy: -115 }
  };

  const baselinePlayerAttacks = {
    neutral_light: attackDef(32, 3, 7, 5, 20, 10, -20, "light", { autoCombo: true, cancelOnHit: ["neutral_medium"], dashCancel: true, stepForward: 100 }),
    neutral_medium: attackDef(58, 5, 7, 9, 31, 22, -80, "medium", { cancelOnHit: ["neutral_heavy", "special_1", "special_2", "special_3"], jumpCancel: true, dashCancel: true, stepForward: 120 }),
    neutral_heavy: attackDef(88, 9, 5, 17, 50, 74, -535, "heavy", { launcher: true, jumpCancel: true, dashCancel: true, softKnockdown: true }),
    forward_light: attackDef(38, 4, 4, 8, 22, 44, -18, "light", { cancelOnHit: ["forward_medium", "neutral_medium"], dashCancel: true }),
    forward_medium: attackDef(66, 6, 4, 11, 32, 78, -68, "medium", { cancelOnHit: ["forward_heavy", "special_1", "special_2"], jumpCancel: true, dashCancel: true }),
    forward_heavy: attackDef(104, 10, 5, 18, 47, 104, -430, "heavy", { launcher: true, jumpCancel: true, dashCancel: true, softKnockdown: true }),
    back_light: attackDef(34, 4, 4, 8, 21, 38, -18, "light", { cancelOnHit: ["back_medium", "neutral_medium"], dashCancel: true }),
    back_medium: attackDef(62, 6, 4, 11, 31, 66, -72, "medium", { cancelOnHit: ["back_heavy", "special_2"], jumpCancel: true, dashCancel: true }),
    back_heavy: attackDef(92, 9, 5, 18, 50, 60, -545, "heavy", { launcher: true, jumpCancel: true, dashCancel: true, softKnockdown: true }),
    down_light: attackDef(28, 3, 4, 7, 19, 38, 0, "low", { cancelOnHit: ["down_medium", "neutral_medium"] }),
    down_medium: attackDef(54, 5, 4, 10, 30, 58, -38, "low", { cancelOnHit: ["down_heavy"], jumpCancel: true, dashCancel: true }),
    down_heavy: attackDef(78, 8, 5, 18, 50, 64, -565, "low", { launcher: true, jumpCancel: true, dashCancel: true, softKnockdown: true }),
    jump_light: attackDef(30, 3, 5, 4, 24, 32, -16, "jump", { air: true, cancelOnHit: ["jump_medium"], dashCancel: true }),
    jump_medium: attackDef(56, 5, 6, 8, 34, 48, -32, "jump", { air: true, cancelOnHit: ["jump_heavy", "special_1"], dashCancel: true }),
    jump_heavy: attackDef(82, 7, 6, 13, 42, 56, 220, "jump", { air: true, softKnockdown: true, dashCancel: true }),
    special_1: attackDef(102, 7, 7, 15, 36, 118, -150, "chain", { dash: true, dashCancel: true, softKnockdown: true, meter: 16 }),
    special_2: attackDef(78, 8, 10, 14, 34, 125, -70, "medium", { projectile: true, projectileSpeed: 700, noHit: true, meter: 14 }),
    special_3: attackDef(116, 7, 7, 22, 50, 76, -555, "heavy", { rise: true, launcher: true, hardKnockdown: true, meter: 18 }),
    super_dash: attackDef(68, 2, 24, 8, 34, 120, -260, "chain", { superDash: true, dashCancel: true, anim: "dash", blockstun: 22, meter: 10 }),
    ultimate: attackDef(260, 10, 20, 32, 56, 330, -260, "ultimate", { ultimate: true, hardKnockdown: true }),
    taunt: attackDef(0, 0, 0, 32, 0, 0, 0, "light", { noHit: true })
  };

  const baselineEnemyAttacks = {
    enemy_light_attack: attackDef(34, 5, 4, 10, 22, 58, -15, "light", { enemy: true, cancelOnHit: ["enemy_medium_attack"] }),
    enemy_medium_attack: attackDef(58, 7, 4, 13, 30, 90, -65, "medium", { enemy: true, cancelOnHit: ["enemy_heavy_attack"] }),
    enemy_heavy_attack: attackDef(82, 10, 5, 19, 44, 110, -410, "heavy", { enemy: true, launcher: true, softKnockdown: true }),
    enemy_forward_heavy: attackDef(96, 11, 5, 20, 44, 132, -365, "heavy", { enemy: true, launcher: true, softKnockdown: true }),
    enemy_special_1: attackDef(96, 7, 7, 17, 36, 165, -130, "chain", { enemy: true, dash: true, softKnockdown: true }),
    enemy_special_2: attackDef(66, 10, 8, 20, 30, 135, -40, "medium", { enemy: true, projectile: true, projectileSpeed: 620, noHit: true }),
    enemy_special_3: attackDef(108, 8, 7, 23, 48, 96, -500, "heavy", { enemy: true, rise: true, launcher: true, hardKnockdown: true }),
    enemy_ultimate: attackDef(220, 13, 18, 34, 52, 280, -180, "ultimate", { enemy: true, ultimate: true, hardKnockdown: true })
  };

  const baselineComboRoutes = {
    autoCombos: {
      neutral_light: "neutral_medium",
      neutral_medium: "neutral_heavy"
    },
    airCombos: {
      jump_light: "jump_medium",
      jump_medium: "jump_heavy"
    }
  };

  const baselineSpecialMoves = {
    special_1: { type: "dashStrike", attack: "special_1" },
    special_2: { type: "projectile", attack: "special_2", projectileWidth: 92, projectileHeight: 22, projectileLife: 1.1, spawnOffsetX: 112, spawnOffsetY: -86 },
    special_3: { type: "risingLauncher", attack: "special_3" },
    super_dash: { type: "homingDash", attack: "super_dash" },
    ultimate: { type: "ultimate", attack: "ultimate" }
  };

  const baselineEnemyAI = {
    walkSpeed: ENEMY_AI_WALK_SPEED,
    attackRange: ENEMY_AI_ATTACK_RANGE,
    minCooldown: ENEMY_AI_MIN_COOLDOWN,
    maxCooldown: ENEMY_AI_MAX_COOLDOWN,
    farRange: 270,
    farAttack: "enemy_special_2",
    weightedAttacks: [
      { threshold: 0.42, move: "enemy_light_attack" },
      { threshold: 0.66, move: "enemy_medium_attack" },
      { threshold: 0.82, move: "enemy_heavy_attack" },
      { threshold: 0.93, move: "enemy_special_1" }
    ],
    fallbackAttack: "enemy_special_3"
  };

  const nyxMovementStats = {
    ...cloneData(baselineMovementStats),
    walkForward: 285,
    walkBack: 215,
    dashSpeed: 930,
    dashDuration: 14 / 60,
    dashCooldown: 17 / 60,
    superDashSpeed: 980,
    superDashCooldown: 25 / 60
  };

  const nyxJumpStats = {
    ...cloneData(baselineJumpStats),
    jumpVelocity: -760,
    gravity: 1720,
    juggleGravity: 1160,
    airRecoveryGravity: 1560,
    airRecoveryDuration: 14 / 60,
    landingRecovery: 5 / 60
  };

  const nyxAirDashStats = {
    speed: 875,
    duration: 12 / 60,
    cooldown: 10 / 60
  };

  const nyxHitboxes = {
    light: { w: 78, h: 54, ox: 38, oy: -74 },
    medium: { w: 104, h: 62, ox: 46, oy: -82 },
    heavy: { w: 132, h: 78, ox: 56, oy: -92 },
    low: { w: 96, h: 40, ox: 40, oy: -40 },
    jump: { w: 102, h: 66, ox: 42, oy: -86 },
    chain: { w: 170, h: 58, ox: 54, oy: -82 },
    dive: { w: 118, h: 96, ox: 48, oy: -106 },
    flurry: { w: 150, h: 66, ox: 48, oy: -84 },
    ultimate: { w: 300, h: 140, ox: 86, oy: -112 }
  };

  const nyxPlayerAttacks = {
    neutral_light: attackDef(24, 2, 6, 4, 19, 12, -18, "light", { autoCombo: true, cancelOnHit: ["neutral_medium"], dashCancel: true, stepForward: 115 }),
    neutral_medium: attackDef(44, 4, 7, 8, 32, 20, -70, "medium", { cancelOnHit: ["neutral_heavy", "down_heavy", "special_1", "special_2", "special_3"], jumpCancel: true, dashCancel: true, stepForward: 135 }),
    neutral_heavy: attackDef(70, 7, 5, 14, 42, 86, -245, "heavy", { cancelOnHit: ["down_heavy", "special_3"], jumpCancel: true, dashCancel: true, softKnockdown: true }),
    forward_light: attackDef(28, 3, 4, 6, 20, 46, -18, "light", { cancelOnHit: ["forward_medium", "neutral_medium"], dashCancel: true, stepForward: 125 }),
    forward_medium: attackDef(48, 5, 5, 9, 32, 70, -62, "medium", { cancelOnHit: ["forward_heavy", "down_heavy", "special_1", "special_2"], jumpCancel: true, dashCancel: true }),
    forward_heavy: attackDef(76, 8, 5, 15, 43, 106, -280, "heavy", { cancelOnHit: ["down_heavy", "special_3"], jumpCancel: true, dashCancel: true, softKnockdown: true }),
    back_light: attackDef(26, 3, 4, 7, 20, 36, -18, "light", { cancelOnHit: ["back_medium", "neutral_medium"], dashCancel: true }),
    back_medium: attackDef(46, 5, 5, 9, 31, 58, -66, "medium", { cancelOnHit: ["back_heavy", "special_1", "special_2"], jumpCancel: true, dashCancel: true }),
    back_heavy: attackDef(68, 7, 5, 15, 42, 58, -390, "heavy", { cancelOnHit: ["down_heavy", "special_3"], jumpCancel: true, dashCancel: true, softKnockdown: true }),
    down_light: attackDef(22, 2, 4, 6, 18, 34, 0, "low", { cancelOnHit: ["down_medium", "neutral_medium"], dashCancel: true }),
    down_medium: attackDef(40, 4, 5, 8, 30, 50, -34, "low", { cancelOnHit: ["down_heavy", "special_2"], jumpCancel: true, dashCancel: true }),
    down_heavy: attackDef(62, 6, 5, 15, 48, 52, -545, "low", { launcher: true, jumpCancel: true, dashCancel: true, softKnockdown: true }),
    jump_light: attackDef(22, 2, 5, 3, 24, 28, -16, "jump", { air: true, cancelOnHit: ["jump_medium"], dashCancel: true }),
    jump_medium: attackDef(42, 4, 6, 7, 35, 36, -46, "jump", { air: true, cancelOnHit: ["jump_heavy", "special_2"], dashCancel: true }),
    jump_heavy: attackDef(64, 6, 6, 11, 40, 44, 215, "jump", { air: true, softKnockdown: true, dashCancel: true }),
    special_1: attackDef(52, 3, 8, 10, 31, 60, -58, "chain", { shadowStep: true, shadowStepSpeed: 980, shadowStepOffset: 82, dashCancel: true, jumpCancel: true, cancelOnHit: ["neutral_medium", "special_3"], softKnockdown: true, meter: 12 }),
    special_2: attackDef(58, 5, 7, 13, 36, 48, 245, "dive", { air: true, dive: true, diveSpeedX: 610, diveSpeedY: 560, dashCancel: true, softKnockdown: true, meter: 14 }),
    special_3: attackDef(18, 4, 22, 16, 18, 20, -32, "flurry", { dash: true, multiHit: { maxHits: 4, intervalFrames: 5 }, cancelOnHit: ["down_heavy", "super_dash"], dashCancel: true, meter: 18 }),
    super_dash: attackDef(54, 2, 23, 7, 33, 105, -245, "chain", { superDash: true, dashCancel: true, anim: "dash", blockstun: 21, meter: 10 }),
    ultimate: attackDef(220, 9, 19, 30, 54, 300, -245, "ultimate", { ultimate: true, hardKnockdown: true }),
    taunt: attackDef(0, 0, 0, 28, 0, 0, 0, "light", { noHit: true })
  };

  const nyxEnemyAttacks = {
    enemy_light_attack: attackDef(26, 3, 4, 8, 20, 52, -15, "light", { enemy: true, cancelOnHit: ["enemy_medium_attack"] }),
    enemy_medium_attack: attackDef(44, 5, 5, 11, 30, 78, -55, "medium", { enemy: true, cancelOnHit: ["enemy_heavy_attack", "enemy_special_3"] }),
    enemy_heavy_attack: attackDef(64, 8, 5, 16, 40, 100, -310, "heavy", { enemy: true, cancelOnHit: ["enemy_forward_heavy"], softKnockdown: true }),
    enemy_forward_heavy: attackDef(68, 8, 5, 16, 44, 70, -500, "heavy", { enemy: true, launcher: true, softKnockdown: true }),
    enemy_special_1: attackDef(50, 4, 8, 12, 30, 88, -58, "chain", { enemy: true, shadowStep: true, shadowStepSpeed: 900, shadowStepOffset: 86, dash: true, softKnockdown: true }),
    enemy_special_2: attackDef(56, 6, 7, 15, 34, 58, 230, "dive", { enemy: true, dive: true, diveSpeedX: 560, diveSpeedY: 520, softKnockdown: true }),
    enemy_special_3: attackDef(17, 5, 20, 18, 17, 24, -25, "flurry", { enemy: true, dash: true, multiHit: { maxHits: 3, intervalFrames: 6 }, softKnockdown: true }),
    enemy_ultimate: attackDef(190, 12, 17, 32, 50, 250, -170, "ultimate", { enemy: true, ultimate: true, hardKnockdown: true })
  };

  const nyxComboRoutes = {
    autoCombos: {
      neutral_light: "neutral_medium",
      neutral_medium: "neutral_heavy"
    },
    airCombos: {
      jump_light: "jump_medium",
      jump_medium: "jump_heavy"
    }
  };

  const nyxSpecialMoves = {
    special_1: { type: "shadowStep", attack: "special_1" },
    special_2: { type: "diveKick", attack: "special_2" },
    special_3: { type: "rapidFlurry", attack: "special_3", maxHits: 4 },
    super_dash: { type: "homingDash", attack: "super_dash" },
    ultimate: { type: "ultimate", attack: "ultimate" }
  };

  const nyxEnemyAI = {
    ...cloneData(baselineEnemyAI),
    walkSpeed: 172,
    attackRange: 292,
    minCooldown: 0.86,
    maxCooldown: 1.45,
    farRange: 250,
    farAttack: "enemy_special_1",
    weightedAttacks: [
      { threshold: 0.36, move: "enemy_light_attack" },
      { threshold: 0.62, move: "enemy_medium_attack" },
      { threshold: 0.78, move: "enemy_heavy_attack" },
      { threshold: 0.91, move: "enemy_special_3" }
    ],
    fallbackAttack: "enemy_special_2"
  };

  const solPlayerAttacks = {
    ...cloneData(baselinePlayerAttacks),
    special_1: attackDef(102, 7, 7, 15, 36, 118, -150, "heavy", { dash: true, dashCancel: true, softKnockdown: true, meter: 16 }),
    special_2: attackDef(78, 8, 8, 14, 34, 96, -70, "medium", { cancelOnHit: ["special_3"], dashCancel: true, meter: 14 }),
    special_3: attackDef(116, 7, 7, 22, 50, 76, -555, "heavy", { rise: true, launcher: true, hardKnockdown: true, meter: 18 }),
    super_dash: attackDef(68, 2, 24, 8, 34, 120, -260, "heavy", { superDash: true, dashCancel: true, anim: "dash", blockstun: 22, meter: 10 })
  };

  const solEnemyAttacks = {
    ...cloneData(baselineEnemyAttacks),
    enemy_special_1: attackDef(96, 7, 7, 17, 36, 142, -130, "heavy", { enemy: true, dash: true, softKnockdown: true }),
    enemy_special_2: attackDef(66, 10, 8, 20, 30, 104, -40, "medium", { enemy: true, softKnockdown: true }),
    enemy_special_3: attackDef(108, 8, 7, 23, 48, 96, -500, "heavy", { enemy: true, rise: true, launcher: true, hardKnockdown: true }),
    enemy_super_dash: attackDef(68, 2, 24, 8, 34, 120, -260, "heavy", { enemy: true, superDash: true, dashCancel: true, anim: "dash", blockstun: 22, meter: 10 })
  };

  const solSpecialMoves = {
    special_1: { type: "solarStep", attack: "special_1" },
    special_2: { type: "radiantBreak", attack: "special_2" },
    special_3: { type: "risingHalo", attack: "special_3" },
    super_dash: { type: "homingDash", attack: "super_dash" },
    ultimate: { type: "ultimate", attack: "ultimate" }
  };

  const serisMovementStats = {
    ...cloneData(baselineMovementStats),
    walkForward: 230,
    walkBack: 180,
    dashSpeed: 780,
    dashDuration: 17 / 60,
    dashCooldown: 22 / 60,
    superDashSpeed: 900,
    superDashCooldown: 30 / 60
  };

  const serisJumpStats = {
    ...cloneData(baselineJumpStats),
    jumpVelocity: -705,
    gravity: 1780,
    juggleGravity: 1220,
    airRecoveryGravity: 1620,
    airRecoveryDuration: 16 / 60,
    landingRecovery: 7 / 60
  };

  const serisAirDashStats = {
    speed: 710,
    duration: 13 / 60,
    cooldown: 14 / 60
  };

  const serisHitboxes = {
    light: { w: 92, h: 58, ox: 46, oy: -78 },
    medium: { w: 152, h: 68, ox: 62, oy: -84 },
    heavy: { w: 202, h: 88, ox: 72, oy: -98 },
    low: { w: 164, h: 44, ox: 58, oy: -42 },
    jump: { w: 136, h: 72, ox: 48, oy: -88 },
    chain: { w: 242, h: 66, ox: 74, oy: -86 },
    ultimate: { w: 340, h: 152, ox: 96, oy: -120 }
  };

  const serisPlayerAttacks = {
    neutral_light: attackDef(30, 4, 6, 6, 21, 18, -18, "light", { autoCombo: true, cancelOnHit: ["neutral_medium"], dashCancel: true, stepForward: 54 }),
    neutral_medium: attackDef(56, 6, 7, 11, 32, 38, -70, "medium", { cancelOnHit: ["neutral_heavy", "special_1", "special_2"], jumpCancel: true, dashCancel: true, stepForward: 46 }),
    neutral_heavy: attackDef(86, 9, 6, 18, 50, 80, -515, "heavy", { launcher: true, jumpCancel: true, dashCancel: true, softKnockdown: true }),
    forward_light: attackDef(34, 5, 5, 8, 23, 34, -18, "light", { cancelOnHit: ["forward_medium", "neutral_medium"], dashCancel: true }),
    forward_medium: attackDef(62, 7, 6, 12, 34, 76, -70, "medium", { cancelOnHit: ["forward_heavy", "special_1", "special_2"], jumpCancel: true, dashCancel: true }),
    forward_heavy: attackDef(94, 11, 6, 19, 48, 92, -500, "heavy", { launcher: true, jumpCancel: true, dashCancel: true, softKnockdown: true }),
    back_light: attackDef(32, 5, 5, 8, 22, 28, -18, "light", { cancelOnHit: ["back_medium", "neutral_medium"], dashCancel: true }),
    back_medium: attackDef(58, 7, 6, 12, 32, 58, -68, "medium", { cancelOnHit: ["back_heavy", "special_2"], jumpCancel: true, dashCancel: true }),
    back_heavy: attackDef(88, 10, 6, 20, 48, 54, -520, "heavy", { launcher: true, jumpCancel: true, dashCancel: true, softKnockdown: true }),
    down_light: attackDef(28, 4, 5, 8, 20, 32, 0, "low", { cancelOnHit: ["down_medium", "neutral_medium"] }),
    down_medium: attackDef(54, 6, 5, 11, 31, 54, -36, "low", { cancelOnHit: ["down_heavy", "special_2"], jumpCancel: true, dashCancel: true }),
    down_heavy: attackDef(78, 9, 6, 18, 50, 58, -540, "low", { launcher: true, jumpCancel: true, dashCancel: true, softKnockdown: true }),
    jump_light: attackDef(30, 4, 5, 5, 24, 30, -16, "jump", { air: true, cancelOnHit: ["jump_medium"], dashCancel: true }),
    jump_medium: attackDef(54, 6, 6, 9, 34, 45, -30, "jump", { air: true, cancelOnHit: ["jump_heavy", "special_1"], dashCancel: true }),
    jump_heavy: attackDef(80, 8, 6, 14, 42, 54, 210, "jump", { air: true, softKnockdown: true, dashCancel: true }),
    special_1: attackDef(76, 8, 9, 16, 36, 104, -120, "chain", { projectile: true, projectileSpeed: 620, noHit: true, cancelOnHit: ["neutral_medium"], meter: 12 }),
    special_2: attackDef(72, 9, 8, 17, 36, 82, -36, "low", { cancelOnHit: ["special_3"], dashCancel: true, meter: 14 }),
    special_3: attackDef(92, 7, 8, 21, 48, 70, -470, "chain", { dash: true, launcher: true, jumpCancel: true, hardKnockdown: true, meter: 16 }),
    super_dash: attackDef(64, 3, 22, 9, 34, 112, -250, "chain", { superDash: true, dashCancel: true, anim: "dash_forward", blockstun: 22, meter: 10 }),
    ultimate: attackDef(230, 11, 18, 34, 54, 310, -240, "ultimate", { ultimate: true, hardKnockdown: true, anim: "divine_recoil" }),
    taunt: attackDef(0, 0, 0, 32, 0, 0, 0, "light", { noHit: true })
  };

  const serisEnemyAttacks = {
    enemy_light_attack: attackDef(30, 6, 5, 10, 22, 52, -15, "light", { enemy: true, cancelOnHit: ["enemy_medium_attack"] }),
    enemy_medium_attack: attackDef(54, 8, 5, 14, 31, 78, -62, "medium", { enemy: true, cancelOnHit: ["enemy_heavy_attack"] }),
    enemy_heavy_attack: attackDef(78, 11, 6, 20, 44, 96, -390, "heavy", { enemy: true, launcher: true, softKnockdown: true }),
    enemy_forward_heavy: attackDef(90, 12, 6, 20, 44, 120, -360, "heavy", { enemy: true, launcher: true, softKnockdown: true }),
    enemy_special_1: attackDef(70, 9, 8, 18, 34, 132, -105, "chain", { enemy: true, projectile: true, projectileSpeed: 570, noHit: true }),
    enemy_special_2: attackDef(66, 10, 7, 18, 34, 86, -36, "low", { enemy: true, softKnockdown: true }),
    enemy_special_3: attackDef(88, 8, 7, 24, 46, 82, -450, "chain", { enemy: true, dash: true, launcher: true, hardKnockdown: true }),
    enemy_ultimate: attackDef(205, 14, 17, 34, 50, 260, -170, "ultimate", { enemy: true, ultimate: true, hardKnockdown: true, anim: "divine_recoil" })
  };

  const serisComboRoutes = {
    autoCombos: {
      neutral_light: "neutral_medium",
      neutral_medium: "neutral_heavy"
    },
    airCombos: {
      jump_light: "jump_medium",
      jump_medium: "jump_heavy"
    }
  };

  const serisSpecialMoves = {
    special_1: { type: "chainSnare", attack: "special_1", projectileWidth: 156, projectileHeight: 30, projectileLife: 0.82, spawnOffsetX: 136, spawnOffsetY: -84 },
    special_2: { type: "sanctumSweep", attack: "special_2" },
    special_3: { type: "divineRecoil", attack: "special_3" },
    super_dash: { type: "homingDash", attack: "super_dash" },
    ultimate: { type: "ultimate", attack: "ultimate" }
  };

  const serisVfxMappings = {
    special_1: "vfx_horizontal_chain_snare",
    special_2: "vfx_low_sweep_chain_arc",
    special_3: "vfx_divine_recoil_tether_pull",
    ultimate: "vfx_rising_launcher_chain_arc",
    enemy_special_1: "vfx_horizontal_chain_snare",
    enemy_special_2: "vfx_low_sweep_chain_arc",
    enemy_special_3: "vfx_divine_recoil_tether_pull",
    enemy_ultimate: "vfx_rising_launcher_chain_arc"
  };

  const serisChainWhipVfxRows = {
    vfx_quick_chain_flick: { row: 0, frames: 5, scale: 0.6, ox: -8, oy: -98, start: 0.08, end: 0.84, alpha: 0.88, snapX: 166, snapY: -96 },
    vfx_horizontal_chain_snare: { row: 1, frames: 7, scale: 0.72, ox: -2, oy: -104, start: 0.05, end: 0.92, alpha: 0.9, snapX: 344, snapY: -102 },
    vfx_low_sweep_chain_arc: { row: 2, frames: 7, scale: 0.72, ox: -6, oy: -42, start: 0.04, end: 0.9, alpha: 0.86, snapX: 334, snapY: -36 },
    vfx_rising_launcher_chain_arc: { row: 3, frames: 7, scale: 0.78, ox: -70, oy: -142, start: 0.04, end: 0.92, alpha: 0.9, snapX: 220, snapY: -178 },
    vfx_aerial_forward_chain_arc: { row: 4, frames: 6, scale: 0.7, ox: -42, oy: -92, start: 0.04, end: 0.9, alpha: 0.86, snapX: 276, snapY: -104 },
    vfx_aerial_downward_finisher_arc: { row: 5, frames: 6, scale: 0.72, ox: -58, oy: -74, start: 0.04, end: 0.9, alpha: 0.88, snapX: 268, snapY: -46 },
    vfx_divine_recoil_tether_pull: { row: 6, frames: 8, scale: 0.76, ox: -4, oy: -100, start: 0.0, end: 0.88, alpha: 0.86, snapX: 326, snapY: -100 }
  };

  const serisMoveVfxOverrides = {
    special_1: { accentOnly: true, scale: 0.74, ox: -6, oy: -104, end: 0.86, snapX: 366 },
    special_2: { accentOnly: true, scale: 0.76, ox: -8, oy: -38, end: 0.86, snapX: 358, snapY: -34 },
    special_3: { accentOnly: true, scale: 0.78, ox: -4, oy: -96, end: 0.82, snapX: 338 },
    ultimate: { accentOnly: true, scale: 0.82, ox: -78, oy: -144, alpha: 0.94, snapX: 226, snapY: -184 }
  };

  const serisEnemyAI = {
    ...cloneData(baselineEnemyAI),
    walkSpeed: 128,
    attackRange: 348,
    minCooldown: 1.0,
    maxCooldown: 1.72,
    farRange: 330,
    farAttack: "enemy_special_1",
    weightedAttacks: [
      { threshold: 0.34, move: "enemy_medium_attack" },
      { threshold: 0.58, move: "enemy_light_attack" },
      { threshold: 0.76, move: "enemy_heavy_attack" },
      { threshold: 0.92, move: "enemy_special_2" }
    ],
    fallbackAttack: "enemy_special_3"
  };

  const characterProfiles = {
    kairo: {
      id: "kairo",
      name: "KAIRO FINAL",
      shortName: "KAIRO",
      health: PLAYER_MAX_HP,
      movement: cloneData(baselineMovementStats),
      jump: cloneData(baselineJumpStats),
      airDash: cloneData(baselineAirDashStats),
      attacks: {
        player: cloneData(baselinePlayerAttacks),
        enemy: cloneData(baselineEnemyAttacks)
      },
      comboRoutes: cloneData(baselineComboRoutes),
      hitboxes: cloneData(baselineHitboxes),
      hurtboxes: {
        standing: { w: 66, h: 164 },
        crouching: { w: 66, h: 94 },
        dead: { w: 66, h: 62 }
      },
      specialMoves: cloneData(baselineSpecialMoves),
      ai: cloneData(baselineEnemyAI),
      effects: { dashTrail: true },
      projectileColor: "#7fd6ff",
      trailColor: "#8c3aa8",
      hurtboxWidth: 66,
      playable: true,
      futurePlayer2: true,
      sheets: {
        basic: "kairoFinalBasic",
        defense: "kairoFinalDefense",
        coreA: "kairoFinalCoreA",
        coreB: "kairoFinalCoreB",
        lowAir: "kairoFinalLowAir",
        specials: "kairoFinalSpecials",
        end: "kairoFinalEnd"
      },
      buildPlayerAnimations: buildFinalFighterPlayerAnimations,
      buildEnemyAnimations: buildFinalFighterEnemyAnimations
    },
    vanta: {
      id: "vanta",
      name: "VANTA REIGN",
      shortName: "VANTA",
      health: ENEMY_MAX_HP,
      movement: cloneData(baselineMovementStats),
      jump: cloneData(baselineJumpStats),
      airDash: cloneData(baselineAirDashStats),
      attacks: {
        player: cloneData(baselinePlayerAttacks),
        enemy: cloneData(baselineEnemyAttacks)
      },
      comboRoutes: cloneData(baselineComboRoutes),
      hitboxes: cloneData(baselineHitboxes),
      hurtboxes: {
        standing: { w: 74, h: 164 },
        crouching: { w: 74, h: 94 },
        dead: { w: 74, h: 62 }
      },
      specialMoves: cloneData(baselineSpecialMoves),
      ai: cloneData(baselineEnemyAI),
      effects: { dashTrail: false },
      projectileColor: "#ff2d45",
      trailColor: "#6e1838",
      hurtboxWidth: 74,
      playable: true,
      futurePlayer2: true,
      sheets: {
        basic: "vantaFinalBasic",
        defense: "vantaFinalDefense",
        coreA: "vantaFinalCoreA",
        coreB: "vantaFinalCoreB",
        lowAir: "vantaFinalLowAir",
        specials: "vantaFinalSpecials",
        end: "vantaFinalEnd"
      },
      buildPlayerAnimations: buildFinalFighterPlayerAnimations,
      buildEnemyAnimations: buildFinalFighterEnemyAnimations
    },
    nyx: {
      id: "nyx",
      name: "NYX",
      shortName: "NYX",
      health: 860,
      movement: cloneData(nyxMovementStats),
      jump: cloneData(nyxJumpStats),
      airDash: cloneData(nyxAirDashStats),
      attacks: {
        player: cloneData(nyxPlayerAttacks),
        enemy: cloneData(nyxEnemyAttacks)
      },
      comboRoutes: cloneData(nyxComboRoutes),
      hitboxes: cloneData(nyxHitboxes),
      hurtboxes: {
        standing: { w: 58, h: 154 },
        crouching: { w: 58, h: 88 },
        dead: { w: 58, h: 58 }
      },
      specialMoves: cloneData(nyxSpecialMoves),
      ai: cloneData(nyxEnemyAI),
      effects: { dashTrail: true },
      projectileColor: "#d78cff",
      trailColor: "#4b194f",
      hurtboxWidth: 58,
      playable: true,
      futurePlayer2: true,
      placeholderArt: "replacedByNyxFinalAtlases",
      sheets: {
        coreMovement: "nyxFinalCoreMovement",
        airMovement: "nyxFinalAirMovement",
        groundNormals: "nyxFinalGroundNormals",
        airNormals: "nyxFinalAirNormals",
        specials: "nyxFinalSpecials",
        defense: "nyxFinalDefense",
        endStates: "nyxFinalEndStates"
      },
      buildPlayerAnimations: buildNyxFinalPlayerAnimations,
      buildEnemyAnimations: buildNyxFinalEnemyAnimations
    },
    sol: {
      id: "sol",
      name: "SOL RAZE",
      shortName: "SOL",
      subtitle: "THE IRON SUN",
      role: "SOLAR BRAWLER",
      health: PLAYER_MAX_HP,
      movement: cloneData(baselineMovementStats),
      jump: cloneData(baselineJumpStats),
      airDash: cloneData(baselineAirDashStats),
      attacks: {
        player: cloneData(solPlayerAttacks),
        enemy: cloneData(solEnemyAttacks)
      },
      comboRoutes: cloneData(baselineComboRoutes),
      hitboxes: cloneData(baselineHitboxes),
      hurtboxes: {
        standing: { w: 66, h: 164 },
        crouching: { w: 66, h: 94 },
        dead: { w: 66, h: 62 }
      },
      specialMoves: cloneData(solSpecialMoves),
      ai: cloneData(baselineEnemyAI),
      effects: { dashTrail: true },
      projectileColor: "#ffcf48",
      trailColor: "#d6a638",
      ultimateBurstColor: "#ffcf48",
      hurtboxWidth: 66,
      playable: true,
      futurePlayer2: true,
      sheets: {
        coreMovement: "solFinalCoreMovement",
        airMovement: "solFinalAirMovement",
        groundNormals: "solFinalGroundNormals",
        airNormals: "solFinalAirNormals",
        specials: "solFinalSpecials",
        defense: "solFinalDefense",
        endStates: "solFinalEndStates",
        directionalNormals: "solFinalDirectionalNormals"
      },
      buildPlayerAnimations: buildSolFinalPlayerAnimations,
      buildEnemyAnimations: buildSolFinalEnemyAnimations
    },
    seris: {
      id: "seris",
      name: "SERIS",
      shortName: "SERIS",
      subtitle: "THE HALO CHAIN",
      role: "MID-RANGE CHAIN",
      health: 960,
      movement: cloneData(serisMovementStats),
      jump: cloneData(serisJumpStats),
      airDash: cloneData(serisAirDashStats),
      attacks: {
        player: cloneData(serisPlayerAttacks),
        enemy: cloneData(serisEnemyAttacks)
      },
      comboRoutes: cloneData(serisComboRoutes),
      hitboxes: cloneData(serisHitboxes),
      hurtboxes: {
        standing: { w: 64, h: 158 },
        crouching: { w: 66, h: 88 },
        dead: { w: 78, h: 58 }
      },
      specialMoves: cloneData(serisSpecialMoves),
      ai: cloneData(serisEnemyAI),
      effects: { dashTrail: true },
      vfx: {
        chainWhipAtlas: SERIS_CHAIN_VFX_RUNTIME_ENABLED ? "serisChainWhipVfx" : null,
        overlayStatus: SERIS_CHAIN_VFX_RUNTIME_ENABLED ? "prepared" : "disabled_no_vfx_baseline",
        runtimeEnabled: SERIS_CHAIN_VFX_RUNTIME_ENABLED,
        mappings: SERIS_CHAIN_VFX_RUNTIME_ENABLED ? cloneData(serisVfxMappings) : {}
      },
      projectileColor: "#35e8d5",
      trailColor: "#d6b24a",
      hurtboxWidth: 64,
      playable: true,
      disabledReason: null,
      futurePlayer2: false,
      sheets: {
        coreMovement: "serisFinalCoreMovement",
        airMovement: "serisFinalAirMovement",
        groundNormals: "serisFinalGroundNormals",
        airNormals: "serisFinalAirNormals",
        specials: "serisFinalSpecials",
        defense: "serisFinalDefense",
        endStates: "serisFinalEndStates"
      },
      buildPlayerAnimations: buildSerisFinalPlayerAnimations,
      buildEnemyAnimations: buildSerisFinalEnemyAnimations
    }
  };

  for (const profile of Object.values(characterProfiles)) {
    hydrateCharacterProfile(profile);
  }

  const selectableCharacterIds = ["kairo", "vanta", "nyx", "sol", "seris"];
  const hiddenTestCharacterIds = SERIS_HIDDEN_TEST_ENABLED ? ["seris"] : [];
  const selectShortcutCharacterIds = {
    Digit1: "kairo",
    Numpad1: "kairo",
    Digit2: "vanta",
    Numpad2: "vanta",
    Digit3: "nyx",
    Numpad3: "nyx",
    Digit4: "sol",
    Numpad4: "sol",
    Digit5: "seris",
    Numpad5: "seris"
  };
  const P1_CONTROLS = {
    left: "KeyA",
    right: "KeyD",
    up: "KeyW",
    down: "KeyS",
    modifier: "KeyU",
    light: "KeyJ",
    medium: "KeyK",
    heavy: "KeyL",
    ultimateA: "KeyI",
    ultimateB: "KeyO",
    dash: ["ShiftLeft", "ShiftRight"],
    taunt: "KeyT"
  };
  const P2_CONTROLS = {
    left: "ArrowLeft",
    right: "ArrowRight",
    up: "ArrowUp",
    down: "ArrowDown",
    light: "Numpad1",
    medium: "Numpad2",
    heavy: "Numpad3",
    special1: "Numpad4",
    special2: "Numpad5",
    special3: "Numpad6",
    ultimate: "Numpad0"
  };
  const moves = characterProfiles.kairo.moves.player;

  const state = {
    mode: "loading",
    paused: false,
    debug: false,
    time: 0,
    hitPause: 0,
    cameraShake: 0,
    messageTimer: 0,
    keys: new Set(),
    images: {},
    frameBoxes: {},
    particles: [],
    projectiles: [],
    nyxSignatureEffects: [],
    player: null,
    enemy: null,
    selectedPlayerId: "kairo",
    selectedP1CharacterId: "kairo",
    selectedP2CharacterId: "vanta",
    selectCursorCharacterId: "kairo",
    selectGameMode: "versus",
    activeSelectSide: "p1",
    p1Ready: false,
    p2Ready: false,
    enemyAI: false,
    combo: {
      owner: null,
      target: null,
      hits: 0,
      displayHits: 0,
      timer: 0,
      displayTimer: 0
    }
  };

  function cloneData(value) {
    if (Array.isArray(value)) return value.map(cloneData);
    if (value && typeof value === "object") {
      return Object.fromEntries(Object.entries(value).map(([key, entry]) => [key, cloneData(entry)]));
    }
    return value;
  }

  function attackDef(damage, startup, active, recovery, hitstun, knockbackX, knockbackY, boxType, flags = {}) {
    const blockstun = flags.blockstun ?? Math.max(8, Math.round(hitstun * 0.58));
    return {
      damage,
      startup,
      active,
      recovery,
      hitstun,
      blockstun,
      knockbackX,
      knockbackY,
      knockback: { x: knockbackX, y: knockbackY },
      launch: {
        launcher: flags.launcher === true,
        rise: flags.rise === true,
        softKnockdown: flags.softKnockdown === true,
        hardKnockdown: flags.hardKnockdown === true
      },
      cancel: {
        cancelOnHit: cloneData(flags.cancelOnHit || []),
        jumpCancel: flags.jumpCancel === true,
        dashCancel: flags.dashCancel === true,
        autoCombo: flags.autoCombo === true
      },
      boxType,
      flags
    };
  }

  function compileMoveSet(attackDefinitions) {
    return Object.fromEntries(Object.entries(attackDefinitions).map(([key, def]) => {
      return [key, move(def.damage, def.startup, def.active, def.recovery, def.hitstun, def.knockbackX, def.knockbackY, def.boxType, cloneData(def.flags || {}))];
    }));
  }

  function hydrateCharacterProfile(profile) {
    profile.attackDefinitions = profile.attacks;
    profile.damageValues = extractAttackValues(profile.attacks, "damage");
    profile.hitstunValues = extractAttackValues(profile.attacks, "hitstun");
    profile.blockstunValues = extractAttackValues(profile.attacks, "blockstun");
    profile.knockbackValues = extractAttackValues(profile.attacks, "knockback");
    profile.launchProperties = extractAttackValues(profile.attacks, "launch");
    profile.cancelWindows = extractAttackValues(profile.attacks, "cancel");
    profile.playerAnimations = (profile.buildPlayerAnimations || buildPlayerAnimations)(profile.sheets);
    profile.enemyAnimations = (profile.buildEnemyAnimations || buildEnemyAnimations)(profile.sheets);
    profile.animationReferences = {
      player: profile.playerAnimations,
      enemy: profile.enemyAnimations
    };
    profile.moves = {
      player: compileMoveSet(profile.attacks.player),
      enemy: compileMoveSet(profile.attacks.enemy)
    };
  }

  function extractAttackValues(attacks, field) {
    return {
      player: Object.fromEntries(Object.entries(attacks.player).map(([key, def]) => [key, cloneData(def[field])])),
      enemy: Object.fromEntries(Object.entries(attacks.enemy).map(([key, def]) => [key, cloneData(def[field])]))
    };
  }

  function move(damage, startup, active, recovery, hitstun, kx, ky, boxType, flags = {}) {
    const hitstunSeconds = hitstun / 60;
    const blockstunFrames = flags.blockstun ?? Math.max(8, Math.round(hitstun * 0.58));
    return {
      damage,
      startup: startup / 60,
      active: active / 60,
      recovery: recovery / 60,
      hitstun: hitstunSeconds,
      blockstun: blockstunFrames / 60,
      knockbackX: kx,
      knockbackY: ky,
      boxType,
      duration: (startup + active + recovery) / 60,
      cancelTime: (startup + Math.max(1, active - 1)) / 60,
      flags
    };
  }

  function buildPlayerAnimations(sheets) {
    return {
      idle: [sheets.basic, 0],
      walk_forward: [sheets.basic, 1],
      walk_back: [sheets.basic, 2],
      dash: [sheets.basic, 3],
      crouch: [sheets.basic, 4],
      block: [sheets.basic, 5],
      neutral_light: [sheets.core, 0],
      neutral_medium: [sheets.core, 1],
      neutral_heavy: [sheets.core, 2],
      forward_light: [sheets.core, 3],
      forward_medium: [sheets.core, 4],
      forward_heavy: [sheets.core, 5],
      back_light: [sheets.backLow, 0],
      back_medium: [sheets.backLow, 1],
      back_heavy: [sheets.backLow, 2],
      down_light: [sheets.backLow, 3],
      down_medium: [sheets.backLow, 4],
      down_heavy: [sheets.backLow, 5],
      jump_light: [sheets.airSpecials, 0],
      jump_medium: [sheets.airSpecials, 1],
      jump_heavy: [sheets.airSpecials, 2],
      special_1: [sheets.airSpecials, 3],
      special_2: [sheets.airSpecials, 4],
      special_3: [sheets.airSpecials, 5],
      damaged: [sheets.states, 0],
      death: [sheets.states, 1],
      level_up: [sheets.states, 2],
      ultimate: [sheets.states, 3],
      taunt: [sheets.states, 4],
      victory: [sheets.states, 5]
    };
  }

  function buildFinalFighterPlayerAnimations(sheets) {
    return {
      idle: [sheets.basic, 0],
      walk_forward: [sheets.basic, 1],
      walk_back: [sheets.basic, 2],
      dash: [sheets.basic, 3],
      crouch: [sheets.basic, 4],
      stand_up: [sheets.defense, 0],
      block: [sheets.defense, 1],
      guard_idle: [sheets.defense, 1],
      damaged: [sheets.defense, 2],
      knockback: [sheets.defense, 3],
      get_up: [sheets.defense, 4],
      neutral_light: [sheets.coreA, 0],
      neutral_medium: [sheets.coreA, 1],
      neutral_heavy: [sheets.coreA, 2],
      forward_light: [sheets.coreA, 3],
      forward_medium: [sheets.coreA, 4],
      forward_heavy: [sheets.coreB, 0],
      back_light: [sheets.coreB, 1],
      back_medium: [sheets.coreB, 2],
      back_heavy: [sheets.coreB, 3],
      taunt: [sheets.coreB, 4],
      down_light: [sheets.lowAir, 0],
      down_medium: [sheets.lowAir, 1],
      down_heavy: [sheets.lowAir, 2],
      jump_light: [sheets.lowAir, 3],
      jump_medium: [sheets.lowAir, 4],
      jump_heavy: [sheets.specials, 0],
      special_1: [sheets.specials, 1],
      special_2: [sheets.specials, 2],
      special_3: [sheets.specials, 3],
      ultimate: [sheets.specials, 4],
      death: [sheets.end, 0],
      victory: [sheets.end, 1],
      level_up: [sheets.end, 2],
      intro_pose: [sheets.end, 3],
      select_idle: [sheets.end, 4]
    };
  }

  function buildNyxConceptPlayerAnimations(sheets) {
    const animations = buildFinalFighterPlayerAnimations(sheets);
    // Nyx concept 3x6 rows: 0 idle, 1 dash/run, 2 neutral light.
    return {
      ...animations,
      idle: [sheets.concept, 0],
      walk_forward: [sheets.concept, 1],
      dash: [sheets.concept, 1],
      neutral_light: [sheets.concept, 2]
    };
  }

  function buildNyxFinalPlayerAnimations(sheets) {
    // Nyx final atlas row map:
    // S1 movement, S2 air movement, S3 ground normals, S4 air normals,
    // S5 specials, S6 defense/hit reactions, S7 knockdown/flavor.
    return {
      idle: [sheets.coreMovement, 0],
      walk_forward: [sheets.coreMovement, 1],
      walk_back: [sheets.coreMovement, 2],
      dash: [sheets.coreMovement, 3],
      dash_back: [sheets.coreMovement, 4],
      crouch: [sheets.coreMovement, 5],
      low_stance: [sheets.coreMovement, 5],
      jump_up: [sheets.airMovement, 0],
      rising: [sheets.airMovement, 0],
      jump_forward: [sheets.airMovement, 1],
      jump_back: [sheets.airMovement, 2],
      fall: [sheets.airMovement, 3],
      neutral_air_drift: [sheets.airMovement, 3],
      air_dash_forward: [sheets.airMovement, 4],
      air_dash_back: [sheets.airMovement, 5],
      stand_up: [sheets.endStates, 2],
      block: [sheets.defense, 0],
      guard_idle: [sheets.defense, 0],
      stand_block: [sheets.defense, 0],
      crouch_block: [sheets.defense, 1],
      air_block: [sheets.defense, 2],
      damaged: [sheets.defense, 3],
      light_hitstun: [sheets.defense, 3],
      medium_hitstun: [sheets.defense, 4],
      knockback: [sheets.defense, 5],
      heavy_hitstun: [sheets.defense, 5],
      launch_hitstun: [sheets.defense, 6],
      air_hitstun: [sheets.defense, 7],
      get_up: [sheets.endStates, 2],
      recovery: [sheets.endStates, 2],
      recovery_get_up: [sheets.endStates, 2],
      neutral_light: [sheets.groundNormals, 0],
      light_attack: [sheets.groundNormals, 0],
      neutral_medium: [sheets.groundNormals, 1],
      medium_attack: [sheets.groundNormals, 1],
      neutral_heavy: [sheets.groundNormals, 2],
      heavy_attack: [sheets.groundNormals, 2],
      launcher: [sheets.groundNormals, 3],
      forward_light: [sheets.groundNormals, 0],
      forward_medium: [sheets.groundNormals, 1],
      forward_heavy: [sheets.groundNormals, 2],
      back_light: [sheets.groundNormals, 0],
      back_medium: [sheets.groundNormals, 1],
      back_heavy: [sheets.groundNormals, 2],
      down_light: [sheets.groundNormals, 0],
      down_medium: [sheets.groundNormals, 1],
      down_heavy: [sheets.groundNormals, 3],
      jump_light: [sheets.airNormals, 0],
      air_light: [sheets.airNormals, 0],
      jump_medium: [sheets.airNormals, 1],
      air_medium: [sheets.airNormals, 1],
      jump_heavy: [sheets.airNormals, 2],
      air_heavy: [sheets.airNormals, 2],
      air_recovery: [sheets.airNormals, 3],
      fall_transition: [sheets.airNormals, 3],
      special_1: [sheets.specials, 1],
      shadow_step_start: [sheets.specials, 0],
      shadow_step_travel: [sheets.specials, 1],
      shadow_step_end: [sheets.specials, 2],
      special_2: [sheets.specials, 4],
      falling_slash_start: [sheets.specials, 3],
      dive_kick_start: [sheets.specials, 3],
      falling_slash_active: [sheets.specials, 4],
      dive_kick_active: [sheets.specials, 4],
      falling_slash_land: [sheets.specials, 5],
      dive_kick_land_recover: [sheets.specials, 5],
      special_3: [sheets.specials, 6],
      rapid_flurry: [sheets.specials, 6],
      ultimate: [sheets.specials, 6],
      knockdown_fall: [sheets.endStates, 0],
      grounded: [sheets.endStates, 1],
      downed: [sheets.endStates, 1],
      death: [sheets.endStates, 3],
      ko: [sheets.endStates, 3],
      defeat: [sheets.endStates, 3],
      intro_pose: [sheets.endStates, 4],
      intro: [sheets.endStates, 4],
      victory: [sheets.endStates, 5],
      level_up: [sheets.endStates, 5],
      taunt: [sheets.endStates, 6],
      select_idle: [sheets.coreMovement, 0]
    };
  }

  function buildSolFinalPlayerAnimations(sheets) {
    return {
      idle: [sheets.coreMovement, 0],
      walk_forward: [sheets.coreMovement, 1],
      walk_back: [sheets.coreMovement, 2],
      dash: [sheets.coreMovement, 3],
      dash_forward: [sheets.coreMovement, 3],
      dash_back: [sheets.coreMovement, 4],
      crouch: [sheets.coreMovement, 5],
      low_stance: [sheets.coreMovement, 5],
      jump_up: [sheets.airMovement, 0],
      rising: [sheets.airMovement, 0],
      jump_forward: [sheets.airMovement, 1],
      jump_back: [sheets.airMovement, 2],
      fall: [sheets.airMovement, 3],
      neutral_air_drift: [sheets.airMovement, 3],
      air_dash_forward: [sheets.airMovement, 4],
      air_dash_back: [sheets.airMovement, 5],
      stand_up: [sheets.endStates, 2],
      block: [sheets.defense, 0],
      guard_idle: [sheets.defense, 0],
      stand_block: [sheets.defense, 0],
      crouch_block: [sheets.defense, 1],
      air_block: [sheets.defense, 2],
      damaged: [sheets.defense, 3],
      light_hitstun: [sheets.defense, 3],
      medium_hitstun: [sheets.defense, 4],
      knockback: [sheets.defense, 5],
      heavy_hitstun: [sheets.defense, 5],
      launch_hitstun: [sheets.defense, 6],
      air_hitstun: [sheets.defense, 7],
      get_up: [sheets.endStates, 2],
      recovery: [sheets.endStates, 2],
      recovery_get_up: [sheets.endStates, 2],
      neutral_light: [sheets.groundNormals, 0],
      light_attack: [sheets.groundNormals, 0],
      sun_jab: [sheets.groundNormals, 0],
      neutral_medium: [sheets.groundNormals, 1],
      medium_attack: [sheets.groundNormals, 1],
      iron_palm: [sheets.groundNormals, 1],
      neutral_heavy: [sheets.groundNormals, 2],
      heavy_attack: [sheets.groundNormals, 2],
      furnace_hook: [sheets.groundNormals, 2],
      launcher: [sheets.groundNormals, 3],
      dawn_upper: [sheets.groundNormals, 3],
      forward_light: [sheets.directionalNormals, 0],
      forward_medium: [sheets.directionalNormals, 3],
      forward_heavy: [sheets.groundNormals, 2],
      back_light: [sheets.directionalNormals, 1],
      back_medium: [sheets.directionalNormals, 4],
      back_heavy: [sheets.groundNormals, 2],
      down_light: [sheets.directionalNormals, 2],
      down_medium: [sheets.directionalNormals, 5],
      down_heavy: [sheets.groundNormals, 3],
      jump_light: [sheets.airNormals, 0],
      air_light: [sheets.airNormals, 0],
      falling_tap: [sheets.airNormals, 0],
      jump_medium: [sheets.airNormals, 1],
      air_medium: [sheets.airNormals, 1],
      comet_knee: [sheets.airNormals, 1],
      jump_heavy: [sheets.airNormals, 2],
      air_heavy: [sheets.airNormals, 2],
      sunfall_axe: [sheets.airNormals, 2],
      air_recovery: [sheets.airNormals, 3],
      fall_transition: [sheets.airNormals, 3],
      special_1: [sheets.specials, 0],
      solar_step: [sheets.specials, 0],
      special_2: [sheets.specials, 1],
      radiant_break: [sheets.specials, 1],
      special_3: [sheets.specials, 2],
      rising_halo: [sheets.specials, 2],
      solar_verdict_startup: [sheets.specials, 3],
      ultimate: [sheets.specials, 4],
      solar_verdict_finish: [sheets.specials, 4],
      knockdown_fall: [sheets.endStates, 0],
      grounded: [sheets.endStates, 1],
      downed: [sheets.endStates, 1],
      death: [sheets.endStates, 3],
      ko: [sheets.endStates, 3],
      defeat: [sheets.endStates, 3],
      intro_pose: [sheets.endStates, 4],
      intro: [sheets.endStates, 4],
      victory: [sheets.endStates, 5],
      level_up: [sheets.endStates, 5],
      taunt: [sheets.endStates, 6],
      select_idle: [sheets.coreMovement, 0]
    };
  }

  function buildSerisFinalPlayerAnimations(sheets) {
    return {
      idle: [sheets.coreMovement, 0],
      walk_forward: [sheets.coreMovement, 1],
      walk_back: [sheets.coreMovement, 2],
      dash: [sheets.coreMovement, 3],
      dash_forward: [sheets.coreMovement, 3],
      dash_back: [sheets.coreMovement, 4],
      crouch: [sheets.coreMovement, 5],
      low_stance: [sheets.coreMovement, 5],
      jump_up: [sheets.airMovement, 0],
      rising: [sheets.airMovement, 0],
      jump_forward: [sheets.airMovement, 1],
      jump_back: [sheets.airMovement, 2],
      fall: [sheets.airMovement, 3],
      neutral_air_drift: [sheets.airMovement, 3],
      air_dash_forward: [sheets.airMovement, 4],
      air_dash_back: [sheets.airMovement, 5],
      stand_up: [sheets.endStates, 2],
      block: [sheets.defense, 0],
      guard_idle: [sheets.defense, 0],
      stand_block: [sheets.defense, 0],
      crouch_block: [sheets.defense, 1],
      air_block: [sheets.defense, 2],
      damaged: [sheets.defense, 3],
      light_hitstun: [sheets.defense, 3],
      medium_hitstun: [sheets.defense, 4],
      knockback: [sheets.defense, 5],
      heavy_hitstun: [sheets.defense, 5],
      launch_hitstun: [sheets.defense, 6],
      air_hitstun: [sheets.defense, 7],
      get_up: [sheets.endStates, 2],
      recovery: [sheets.endStates, 2],
      recovery_get_up: [sheets.endStates, 2],
      neutral_light: [sheets.groundNormals, 0],
      light_attack: [sheets.groundNormals, 0],
      neutral_medium: [sheets.groundNormals, 1],
      medium_attack: [sheets.groundNormals, 1],
      neutral_heavy: [sheets.groundNormals, 2],
      heavy_attack: [sheets.groundNormals, 2],
      launcher: [sheets.groundNormals, 3],
      forward_light: [sheets.groundNormals, 0],
      forward_medium: [sheets.groundNormals, 1],
      forward_heavy: [sheets.groundNormals, 2],
      back_light: [sheets.groundNormals, 0],
      back_medium: [sheets.groundNormals, 1],
      back_heavy: [sheets.groundNormals, 2],
      down_light: [sheets.groundNormals, 0],
      down_medium: [sheets.groundNormals, 1],
      down_heavy: [sheets.groundNormals, 3],
      jump_light: [sheets.airNormals, 0],
      air_light: [sheets.airNormals, 0],
      jump_medium: [sheets.airNormals, 1],
      air_medium: [sheets.airNormals, 1],
      jump_heavy: [sheets.airNormals, 2],
      air_heavy: [sheets.airNormals, 2],
      air_recovery: [sheets.airNormals, 3],
      fall_transition: [sheets.airNormals, 3],
      special_1: [sheets.specials, 1],
      chain_snare_start: [sheets.specials, 0],
      chain_snare_active: [sheets.specials, 1],
      chain_snare_recovery: [sheets.specials, 2],
      special_2: [sheets.specials, 3],
      sanctum_sweep: [sheets.specials, 3],
      special_3: [sheets.specials, 4],
      divine_recoil: [sheets.specials, 4],
      special_recovery: [sheets.specials, 5],
      ultimate: [sheets.specials, 4],
      knockdown_fall: [sheets.endStates, 0],
      grounded: [sheets.endStates, 1],
      downed: [sheets.endStates, 1],
      death: [sheets.endStates, 3],
      ko: [sheets.endStates, 3],
      defeat: [sheets.endStates, 3],
      intro_pose: [sheets.endStates, 4],
      intro: [sheets.endStates, 4],
      victory: [sheets.endStates, 5],
      level_up: [sheets.endStates, 5],
      taunt: [sheets.endStates, 6],
      select_idle: [sheets.coreMovement, 0]
    };
  }

  function buildEnemyAnimations(sheets) {
    return {
      enemy_idle: [sheets.basic, 0],
      enemy_walk_forward: [sheets.basic, 1],
      enemy_walk_back: [sheets.basic, 2],
      enemy_dash: [sheets.basic, 3],
      enemy_crouch: [sheets.basic, 4],
      enemy_block: [sheets.basic, 5],
      enemy_light_attack: [sheets.core, 0],
      enemy_medium_attack: [sheets.core, 1],
      enemy_heavy_attack: [sheets.core, 2],
      enemy_forward_light: [sheets.core, 3],
      enemy_forward_medium: [sheets.core, 4],
      enemy_forward_heavy: [sheets.core, 5],
      enemy_back_light: [sheets.backLow, 0],
      enemy_back_medium: [sheets.backLow, 1],
      enemy_back_heavy: [sheets.backLow, 2],
      enemy_down_light: [sheets.backLow, 3],
      enemy_down_medium: [sheets.backLow, 4],
      enemy_down_heavy: [sheets.backLow, 5],
      enemy_jump_light: [sheets.airSpecials, 0],
      enemy_jump_medium: [sheets.airSpecials, 1],
      enemy_jump_heavy: [sheets.airSpecials, 2],
      enemy_special_1: [sheets.airSpecials, 3],
      enemy_special_2: [sheets.airSpecials, 4],
      enemy_special_3: [sheets.airSpecials, 5],
      enemy_damaged: [sheets.states, 0],
      enemy_death: [sheets.states, 1],
      enemy_level_up: [sheets.states, 2],
      enemy_ultimate: [sheets.states, 3],
      enemy_taunt: [sheets.states, 4],
      enemy_victory: [sheets.states, 5]
    };
  }

  function buildFinalFighterEnemyAnimations(sheets) {
    return {
      enemy_idle: [sheets.basic, 0],
      enemy_walk_forward: [sheets.basic, 1],
      enemy_walk_back: [sheets.basic, 2],
      enemy_dash: [sheets.basic, 3],
      enemy_crouch: [sheets.basic, 4],
      enemy_stand_up: [sheets.defense, 0],
      enemy_block: [sheets.defense, 1],
      enemy_damaged: [sheets.defense, 2],
      enemy_knockback: [sheets.defense, 3],
      enemy_get_up: [sheets.defense, 4],
      enemy_light_attack: [sheets.coreA, 0],
      enemy_medium_attack: [sheets.coreA, 1],
      enemy_heavy_attack: [sheets.coreA, 2],
      enemy_forward_light: [sheets.coreA, 3],
      enemy_forward_medium: [sheets.coreA, 4],
      enemy_forward_heavy: [sheets.coreB, 0],
      enemy_back_light: [sheets.coreB, 1],
      enemy_back_medium: [sheets.coreB, 2],
      enemy_back_heavy: [sheets.coreB, 3],
      enemy_taunt: [sheets.coreB, 4],
      enemy_down_light: [sheets.lowAir, 0],
      enemy_down_medium: [sheets.lowAir, 1],
      enemy_down_heavy: [sheets.lowAir, 2],
      enemy_jump_light: [sheets.lowAir, 3],
      enemy_jump_medium: [sheets.lowAir, 4],
      enemy_jump_heavy: [sheets.specials, 0],
      enemy_special_1: [sheets.specials, 1],
      enemy_special_2: [sheets.specials, 2],
      enemy_special_3: [sheets.specials, 3],
      enemy_ultimate: [sheets.specials, 4],
      enemy_death: [sheets.end, 0],
      enemy_victory: [sheets.end, 1],
      enemy_level_up: [sheets.end, 2],
      enemy_intro_pose: [sheets.end, 3],
      enemy_select_idle: [sheets.end, 4]
    };
  }

  function buildNyxConceptEnemyAnimations(sheets) {
    const animations = buildFinalFighterEnemyAnimations(sheets);
    // Nyx concept 3x6 rows: 0 idle, 1 dash/run, 2 light attack.
    return {
      ...animations,
      enemy_idle: [sheets.concept, 0],
      enemy_walk_forward: [sheets.concept, 1],
      enemy_dash: [sheets.concept, 1],
      enemy_light_attack: [sheets.concept, 2]
    };
  }

  function buildNyxFinalEnemyAnimations(sheets) {
    return {
      enemy_idle: [sheets.coreMovement, 0],
      enemy_walk_forward: [sheets.coreMovement, 1],
      enemy_walk_back: [sheets.coreMovement, 2],
      enemy_dash: [sheets.coreMovement, 3],
      enemy_dash_back: [sheets.coreMovement, 4],
      enemy_crouch: [sheets.coreMovement, 5],
      enemy_stand_up: [sheets.endStates, 2],
      enemy_block: [sheets.defense, 0],
      enemy_guard_idle: [sheets.defense, 0],
      enemy_stand_block: [sheets.defense, 0],
      enemy_crouch_block: [sheets.defense, 1],
      enemy_air_block: [sheets.defense, 2],
      enemy_damaged: [sheets.defense, 3],
      enemy_light_hitstun: [sheets.defense, 3],
      enemy_medium_hitstun: [sheets.defense, 4],
      enemy_knockback: [sheets.defense, 5],
      enemy_heavy_hitstun: [sheets.defense, 5],
      enemy_launch_hitstun: [sheets.defense, 6],
      enemy_air_hitstun: [sheets.defense, 7],
      enemy_get_up: [sheets.endStates, 2],
      enemy_light_attack: [sheets.groundNormals, 0],
      enemy_medium_attack: [sheets.groundNormals, 1],
      enemy_heavy_attack: [sheets.groundNormals, 2],
      enemy_forward_light: [sheets.groundNormals, 0],
      enemy_forward_medium: [sheets.groundNormals, 1],
      enemy_forward_heavy: [sheets.groundNormals, 2],
      enemy_back_light: [sheets.groundNormals, 0],
      enemy_back_medium: [sheets.groundNormals, 1],
      enemy_back_heavy: [sheets.groundNormals, 2],
      enemy_down_light: [sheets.groundNormals, 0],
      enemy_down_medium: [sheets.groundNormals, 1],
      enemy_down_heavy: [sheets.groundNormals, 3],
      enemy_jump_light: [sheets.airNormals, 0],
      enemy_air_light: [sheets.airNormals, 0],
      enemy_jump_medium: [sheets.airNormals, 1],
      enemy_air_medium: [sheets.airNormals, 1],
      enemy_jump_heavy: [sheets.airNormals, 2],
      enemy_air_heavy: [sheets.airNormals, 2],
      enemy_air_recovery: [sheets.airNormals, 3],
      enemy_special_1: [sheets.specials, 1],
      enemy_shadow_step_start: [sheets.specials, 0],
      enemy_shadow_step_travel: [sheets.specials, 1],
      enemy_shadow_step_end: [sheets.specials, 2],
      enemy_special_2: [sheets.specials, 4],
      enemy_falling_slash_start: [sheets.specials, 3],
      enemy_falling_slash_active: [sheets.specials, 4],
      enemy_falling_slash_land: [sheets.specials, 5],
      enemy_special_3: [sheets.specials, 6],
      enemy_rapid_flurry: [sheets.specials, 6],
      enemy_ultimate: [sheets.specials, 6],
      enemy_knockdown_fall: [sheets.endStates, 0],
      enemy_grounded: [sheets.endStates, 1],
      enemy_death: [sheets.endStates, 3],
      enemy_intro_pose: [sheets.endStates, 4],
      enemy_victory: [sheets.endStates, 5],
      enemy_level_up: [sheets.endStates, 5],
      enemy_taunt: [sheets.endStates, 6],
      enemy_select_idle: [sheets.coreMovement, 0]
    };
  }

  function buildSolFinalEnemyAnimations(sheets) {
    return {
      enemy_idle: [sheets.coreMovement, 0],
      enemy_walk_forward: [sheets.coreMovement, 1],
      enemy_walk_back: [sheets.coreMovement, 2],
      enemy_dash: [sheets.coreMovement, 3],
      enemy_dash_forward: [sheets.coreMovement, 3],
      enemy_dash_back: [sheets.coreMovement, 4],
      enemy_crouch: [sheets.coreMovement, 5],
      enemy_stand_up: [sheets.endStates, 2],
      enemy_block: [sheets.defense, 0],
      enemy_guard_idle: [sheets.defense, 0],
      enemy_stand_block: [sheets.defense, 0],
      enemy_crouch_block: [sheets.defense, 1],
      enemy_air_block: [sheets.defense, 2],
      enemy_damaged: [sheets.defense, 3],
      enemy_light_hitstun: [sheets.defense, 3],
      enemy_medium_hitstun: [sheets.defense, 4],
      enemy_knockback: [sheets.defense, 5],
      enemy_heavy_hitstun: [sheets.defense, 5],
      enemy_launch_hitstun: [sheets.defense, 6],
      enemy_air_hitstun: [sheets.defense, 7],
      enemy_get_up: [sheets.endStates, 2],
      enemy_light_attack: [sheets.groundNormals, 0],
      enemy_sun_jab: [sheets.groundNormals, 0],
      enemy_medium_attack: [sheets.groundNormals, 1],
      enemy_iron_palm: [sheets.groundNormals, 1],
      enemy_heavy_attack: [sheets.groundNormals, 2],
      enemy_furnace_hook: [sheets.groundNormals, 2],
      enemy_forward_light: [sheets.directionalNormals, 0],
      enemy_forward_medium: [sheets.directionalNormals, 3],
      enemy_forward_heavy: [sheets.groundNormals, 2],
      enemy_back_light: [sheets.directionalNormals, 1],
      enemy_back_medium: [sheets.directionalNormals, 4],
      enemy_back_heavy: [sheets.groundNormals, 2],
      enemy_down_light: [sheets.directionalNormals, 2],
      enemy_down_medium: [sheets.directionalNormals, 5],
      enemy_down_heavy: [sheets.groundNormals, 3],
      enemy_launcher: [sheets.groundNormals, 3],
      enemy_dawn_upper: [sheets.groundNormals, 3],
      enemy_jump_light: [sheets.airNormals, 0],
      enemy_air_light: [sheets.airNormals, 0],
      enemy_falling_tap: [sheets.airNormals, 0],
      enemy_jump_medium: [sheets.airNormals, 1],
      enemy_air_medium: [sheets.airNormals, 1],
      enemy_comet_knee: [sheets.airNormals, 1],
      enemy_jump_heavy: [sheets.airNormals, 2],
      enemy_air_heavy: [sheets.airNormals, 2],
      enemy_sunfall_axe: [sheets.airNormals, 2],
      enemy_air_recovery: [sheets.airNormals, 3],
      enemy_special_1: [sheets.specials, 0],
      enemy_solar_step: [sheets.specials, 0],
      enemy_special_2: [sheets.specials, 1],
      enemy_radiant_break: [sheets.specials, 1],
      enemy_special_3: [sheets.specials, 2],
      enemy_rising_halo: [sheets.specials, 2],
      enemy_solar_verdict_startup: [sheets.specials, 3],
      enemy_ultimate: [sheets.specials, 4],
      enemy_solar_verdict_finish: [sheets.specials, 4],
      enemy_knockdown_fall: [sheets.endStates, 0],
      enemy_grounded: [sheets.endStates, 1],
      enemy_death: [sheets.endStates, 3],
      enemy_intro_pose: [sheets.endStates, 4],
      enemy_victory: [sheets.endStates, 5],
      enemy_level_up: [sheets.endStates, 5],
      enemy_taunt: [sheets.endStates, 6],
      enemy_select_idle: [sheets.coreMovement, 0]
    };
  }

  function buildSerisFinalEnemyAnimations(sheets) {
    return {
      enemy_idle: [sheets.coreMovement, 0],
      enemy_walk_forward: [sheets.coreMovement, 1],
      enemy_walk_back: [sheets.coreMovement, 2],
      enemy_dash: [sheets.coreMovement, 3],
      enemy_dash_forward: [sheets.coreMovement, 3],
      enemy_dash_back: [sheets.coreMovement, 4],
      enemy_crouch: [sheets.coreMovement, 5],
      enemy_stand_up: [sheets.endStates, 2],
      enemy_block: [sheets.defense, 0],
      enemy_guard_idle: [sheets.defense, 0],
      enemy_stand_block: [sheets.defense, 0],
      enemy_crouch_block: [sheets.defense, 1],
      enemy_air_block: [sheets.defense, 2],
      enemy_damaged: [sheets.defense, 3],
      enemy_light_hitstun: [sheets.defense, 3],
      enemy_medium_hitstun: [sheets.defense, 4],
      enemy_knockback: [sheets.defense, 5],
      enemy_heavy_hitstun: [sheets.defense, 5],
      enemy_launch_hitstun: [sheets.defense, 6],
      enemy_air_hitstun: [sheets.defense, 7],
      enemy_get_up: [sheets.endStates, 2],
      enemy_light_attack: [sheets.groundNormals, 0],
      enemy_medium_attack: [sheets.groundNormals, 1],
      enemy_heavy_attack: [sheets.groundNormals, 2],
      enemy_forward_light: [sheets.groundNormals, 0],
      enemy_forward_medium: [sheets.groundNormals, 1],
      enemy_forward_heavy: [sheets.groundNormals, 2],
      enemy_back_light: [sheets.groundNormals, 0],
      enemy_back_medium: [sheets.groundNormals, 1],
      enemy_back_heavy: [sheets.groundNormals, 2],
      enemy_down_light: [sheets.groundNormals, 0],
      enemy_down_medium: [sheets.groundNormals, 1],
      enemy_down_heavy: [sheets.groundNormals, 3],
      enemy_jump_light: [sheets.airNormals, 0],
      enemy_air_light: [sheets.airNormals, 0],
      enemy_jump_medium: [sheets.airNormals, 1],
      enemy_air_medium: [sheets.airNormals, 1],
      enemy_jump_heavy: [sheets.airNormals, 2],
      enemy_air_heavy: [sheets.airNormals, 2],
      enemy_air_recovery: [sheets.airNormals, 3],
      enemy_special_1: [sheets.specials, 1],
      enemy_chain_snare_start: [sheets.specials, 0],
      enemy_chain_snare_active: [sheets.specials, 1],
      enemy_chain_snare_recovery: [sheets.specials, 2],
      enemy_special_2: [sheets.specials, 3],
      enemy_sanctum_sweep: [sheets.specials, 3],
      enemy_special_3: [sheets.specials, 4],
      enemy_divine_recoil: [sheets.specials, 4],
      enemy_special_recovery: [sheets.specials, 5],
      enemy_ultimate: [sheets.specials, 4],
      enemy_knockdown_fall: [sheets.endStates, 0],
      enemy_grounded: [sheets.endStates, 1],
      enemy_death: [sheets.endStates, 3],
      enemy_intro_pose: [sheets.endStates, 4],
      enemy_victory: [sheets.endStates, 5],
      enemy_level_up: [sheets.endStates, 5],
      enemy_taunt: [sheets.endStates, 6],
      enemy_select_idle: [sheets.coreMovement, 0]
    };
  }

  function getCharacterProfile(characterId) {
    const profile = characterProfiles[characterId];
    return profile && (profile.playable !== false || hiddenTestCharacterIds.includes(characterId)) ? profile : characterProfiles.kairo;
  }

  function getMoveSet(f) {
    const role = f?.kind === "enemy" ? "enemy" : "player";
    return f?.profile?.moves?.[role] || moves;
  }

  function getMove(f, key = f?.activeMove) {
    return key ? getMoveSet(f)[key] : null;
  }

  function getComboRoutes(f) {
    return f?.profile?.comboRoutes || baselineComboRoutes;
  }

  function getHitboxDefinition(f, boxType) {
    return f?.profile?.hitboxes?.[boxType] || baselineHitboxes[boxType];
  }

  function getMovementStats(f) {
    return f?.profile?.movement || baselineMovementStats;
  }

  function getJumpStats(f) {
    return f?.profile?.jump || baselineJumpStats;
  }

  function getAirDashStats(f) {
    return f?.profile?.airDash || baselineAirDashStats;
  }

  function getOpponentId(characterId) {
    if (characterId === "nyx") return "kairo";
    if (characterId === "sol") return "vanta";
    if (characterId === "vanta") return "nyx";
    return "vanta";
  }

  function usesNyxArt(f) {
    return f?.profile?.id === "nyx";
  }

  function usesNewGenerationArt(f) {
    return f?.profile?.id === "nyx" || f?.profile?.id === "sol" || f?.profile?.id === "seris";
  }

  function withEnemyPrefix(f, anim) {
    return f.kind === "enemy" ? `enemy_${anim}` : anim;
  }

  function getDashAnim(f) {
    if (!usesNewGenerationArt(f)) return withEnemyPrefix(f, "dash");
    const forwardDash = f.dashDirection === f.facing;
    if (!f.grounded || f.airDashTimer > 0) {
      return withEnemyPrefix(f, forwardDash ? "air_dash_forward" : "air_dash_back");
    }
    return withEnemyPrefix(f, forwardDash ? (usesNyxArt(f) ? "dash" : "dash_forward") : "dash_back");
  }

  function getAirDriftAnim(f, holdingForward, holdingBack) {
    if (!usesNewGenerationArt(f)) return withEnemyPrefix(f, "jump_light");
    if (holdingForward) return withEnemyPrefix(f, "jump_forward");
    if (holdingBack) return withEnemyPrefix(f, "jump_back");
    return withEnemyPrefix(f, f.vy < -40 ? "jump_up" : "fall");
  }

  function getHitReactionAnim(f, fallback) {
    if (!usesNewGenerationArt(f)) return fallback;
    return f.reactionAnim || fallback;
  }

  function getKnockdownAnim(f, fallback) {
    if (!usesNewGenerationArt(f)) return fallback;
    if (!f.grounded) return withEnemyPrefix(f, "knockdown_fall");
    return withEnemyPrefix(f, f.knockdownTimer > 0.16 ? "grounded" : "get_up");
  }

  function getCharacterActionPhaseAnim(f, moveData) {
    if (!f.activeMove) return null;
    if (f.profile?.id === "sol") return getSolActionPhaseAnim(f, moveData);
    if (f.profile?.id === "seris") return getSerisActionPhaseAnim(f, moveData);
    if (!usesNyxArt(f)) return null;
    const moveKey = f.activeMove.replace(/^enemy_/, "");
    const activeEnd = moveData.startup + moveData.active;
    if (moveKey === "special_1") {
      if (f.actionTime < moveData.startup) return withEnemyPrefix(f, "shadow_step_start");
      if (f.actionTime <= activeEnd) return withEnemyPrefix(f, "shadow_step_travel");
      return withEnemyPrefix(f, "shadow_step_end");
    }
    if (moveKey === "special_2") {
      if (f.actionTime < moveData.startup) return withEnemyPrefix(f, "falling_slash_start");
      if (f.actionTime <= activeEnd) return withEnemyPrefix(f, "falling_slash_active");
      return withEnemyPrefix(f, "falling_slash_land");
    }
    return null;
  }

  function getSolActionPhaseAnim(f, moveData) {
    const moveKey = f.activeMove.replace(/^enemy_/, "");
    const activeEnd = moveData.startup + moveData.active;
    if (moveKey === "ultimate") {
      if (f.actionTime < activeEnd * 0.54) return withEnemyPrefix(f, "solar_verdict_startup");
      return withEnemyPrefix(f, "solar_verdict_finish");
    }
    if (moveKey === "special_1") return withEnemyPrefix(f, "solar_step");
    if (moveKey === "special_2") return withEnemyPrefix(f, "radiant_break");
    if (moveKey === "special_3") return withEnemyPrefix(f, "rising_halo");
    return null;
  }

  function getSerisActionPhaseAnim(f, moveData) {
    const moveKey = f.activeMove.replace(/^enemy_/, "");
    const activeEnd = moveData.startup + moveData.active;
    if (moveKey === "special_1") {
      if (f.actionTime < moveData.startup) return withEnemyPrefix(f, "chain_snare_start");
      if (f.actionTime <= activeEnd) return withEnemyPrefix(f, "chain_snare_active");
      return withEnemyPrefix(f, "chain_snare_recovery");
    }
    if (moveKey === "special_2") return withEnemyPrefix(f, "sanctum_sweep");
    if (moveKey === "special_3" || moveKey === "ultimate") return withEnemyPrefix(f, "divine_recoil");
    return null;
  }

  function setNyxReactionAnim(defender, source, blocked = false) {
    if (!usesNewGenerationArt(defender)) return;
    if (blocked) {
      defender.reactionAnim = withEnemyPrefix(defender, defender.grounded ? "stand_block" : "air_block");
      return;
    }
    if (!defender.grounded) {
      defender.reactionAnim = withEnemyPrefix(defender, "air_hitstun");
      return;
    }
    if (source.flags?.launcher || source.knockbackY < -260) {
      defender.reactionAnim = withEnemyPrefix(defender, "launch_hitstun");
      return;
    }
    if (source.boxType === "light" || source.boxType === "low") {
      defender.reactionAnim = withEnemyPrefix(defender, "light_hitstun");
    } else if (source.boxType === "medium" || source.boxType === "jump") {
      defender.reactionAnim = withEnemyPrefix(defender, "medium_hitstun");
    } else {
      defender.reactionAnim = withEnemyPrefix(defender, "heavy_hitstun");
    }
  }

  function makeFighter(kind, x, facing, characterId) {
    const profile = getCharacterProfile(characterId);
    return {
      kind,
      characterId: profile.id,
      profile,
      x,
      y: GROUND_Y,
      vx: 0,
      vy: 0,
      facing,
      hp: profile.health,
      maxHp: profile.health,
      meter: kind === "player" ? 0 : 0,
      grounded: true,
      crouching: false,
      blocking: false,
      dead: false,
      action: null,
      actionTime: 0,
      hitstun: 0,
      blockstun: 0,
      knockdownTimer: 0,
      pendingKnockdown: 0,
      recoveryTimer: 0,
      landingTimer: 0,
      dashTimer: 0,
      dashCooldown: 0,
      airDashTimer: 0,
      airDashCooldown: 0,
      airDashUsed: false,
      dashDirection: facing,
      superDashCooldown: 0,
      aiCooldown: kind === "enemy" ? 0.4 : 0,
      activeMove: null,
      hasHit: false,
      hitCount: 0,
      lastHitTime: -Infinity,
      spawnedProjectile: false,
      cancelUnlocked: false,
      bufferedMove: null,
      reactionAnim: null,
      anim: kind === "player" ? "idle" : "enemy_idle"
    };
  }

  async function boot() {
    await loadAssets();
    document.documentElement.style.setProperty("--title-bg", `url("${assetPaths.title}")`);
    resetRound();
    if (state.mode === "loading") {
      state.mode = "title";
    }
    if (SERIS_HIDDEN_TEST_ENABLED) {
      startTraining("seris");
      flashStatus("SERIS HIDDEN TEST", 1.2);
    }
    requestAnimationFrame(loop);
  }

  async function loadAssets() {
    const entries = Object.entries(assetPaths);
    await Promise.all(entries.map(async ([key, path]) => {
      if (!path) {
        state.images[key] = null;
        return;
      }
      const chroma = !["stage", "title", "nyxPhantomSlash"].includes(key);
      const image = await loadImage(path);
      if (!image) {
        state.images[key] = null;
        return;
      }
      const keyed = chroma ? chromaKey(image) : image;
      state.images[key] = sheetMeta[key] && !sheetMeta[key].skipSanitize ? sanitizeSpriteSheet(keyed, sheetMeta[key]) : keyed;
    }));
    state.frameBoxes = buildSpriteFrameBoxes();
  }

  function loadImage(path) {
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = () => resolve(null);
      img.src = path;
    });
  }

  function chromaKey(img) {
    const c = document.createElement("canvas");
    c.width = img.width;
    c.height = img.height;
    const cctx = c.getContext("2d", { willReadFrequently: true });
    cctx.drawImage(img, 0, 0);
    try {
      const data = cctx.getImageData(0, 0, c.width, c.height);
      const px = data.data;
      for (let i = 0; i < px.length; i += 4) {
        if (isChromaArtifact(px[i], px[i + 1], px[i + 2])) {
          px[i + 3] = 0;
        }
      }
      cctx.putImageData(data, 0, 0);
      return c;
    } catch {
      return img;
    }
  }

  function isChromaArtifact(r, g, b) {
    const hotMagenta = r > 218 && g < 105 && b > 205 && Math.abs(r - b) < 74;
    const magentaShadow = r > 170 && g < 80 && b > 190 && Math.abs(r - b) < 70;
    return hotMagenta || magentaShadow;
  }

  function sanitizeSpriteSheet(image, meta) {
    const source = document.createElement("canvas");
    source.width = image.width;
    source.height = image.height;
    const sctx = source.getContext("2d", { willReadFrequently: true });
    sctx.drawImage(image, 0, 0);

    let sourceData;
    try {
      sourceData = sctx.getImageData(0, 0, source.width, source.height);
    } catch {
      return image;
    }

    const output = document.createElement("canvas");
    output.width = source.width;
    output.height = source.height;
    const octx = output.getContext("2d");
    const outData = octx.createImageData(output.width, output.height);
    const fw = source.width / meta.cols;
    const rh = source.height / meta.rows;

    for (let row = 0; row < meta.rows; row += 1) {
      for (let frame = 0; frame < meta.cols; frame += 1) {
        copySanitizedFrame(sourceData, outData, source.width, source.height, fw, rh, row, frame, meta);
      }
    }

    octx.putImageData(outData, 0, 0);
    return output;
  }

  function copySanitizedFrame(sourceData, outData, imageWidth, imageHeight, fw, rh, row, frame, meta) {
    const cellX = Math.floor(frame * fw);
    const nextCellX = Math.min(imageWidth, Math.floor((frame + 1) * fw));
    const cellY = Math.floor(row * rh);
    const nextCellY = Math.min(imageHeight, Math.floor((row + 1) * rh));
    const w = Math.max(1, nextCellX - cellX);
    const h = Math.max(1, nextCellY - cellY);
    const mask = new Uint32Array(w * h);
    const src = sourceData.data;

    for (let y = 0; y < h; y += 1) {
      for (let x = 0; x < w; x += 1) {
        const srcIndex = ((cellY + y) * imageWidth + cellX + x) * 4;
        if (src[srcIndex + 3] <= 18) continue;
        if (isChromaArtifact(src[srcIndex], src[srcIndex + 1], src[srcIndex + 2])) continue;
        mask[y * w + x] = 1;
      }
    }

    const components = findFrameComponents(mask, w, h, sourceData.data, imageWidth, cellX, cellY);
    const allowDetachedEffects = meta.allowDetachedEffects === true && !(meta.noDetachedEffectRows || []).includes(row);
    const keep = pickFrameComponents(components, w, h, allowDetachedEffects);
    if (keep.size === 0) return;

    const dst = outData.data;
    for (let y = 0; y < h; y += 1) {
      for (let x = 0; x < w; x += 1) {
        const localIndex = y * w + x;
        const componentId = mask[localIndex];
        if (!keep.has(componentId)) continue;
        const srcIndex = ((cellY + y) * imageWidth + cellX + x) * 4;
        const dstIndex = srcIndex;
        dst[dstIndex] = src[srcIndex];
        dst[dstIndex + 1] = src[srcIndex + 1];
        dst[dstIndex + 2] = src[srcIndex + 2];
        dst[dstIndex + 3] = src[srcIndex + 3];
      }
    }
  }

  function findFrameComponents(mask, w, h, pixels, imageWidth, cellX, cellY) {
    const components = [];
    let id = 1;
    const stack = [];

    for (let start = 0; start < mask.length; start += 1) {
      if (mask[start] !== 1) continue;

      id += 1;
      const component = {
        id,
        count: 0,
        darkCount: 0,
        minX: Infinity,
        minY: Infinity,
        maxX: -Infinity,
        maxY: -Infinity,
        touchesLeft: false,
        touchesRight: false,
        touchesTop: false,
        touchesBottom: false
      };

      mask[start] = id;
      stack.push(start);

      while (stack.length > 0) {
        const current = stack.pop();
        const x = current % w;
        const y = Math.floor(current / w);
        component.count += 1;
        component.minX = Math.min(component.minX, x);
        component.minY = Math.min(component.minY, y);
        component.maxX = Math.max(component.maxX, x);
        component.maxY = Math.max(component.maxY, y);
        component.touchesLeft ||= x <= 1;
        component.touchesRight ||= x >= w - 2;
        component.touchesTop ||= y <= 1;
        component.touchesBottom ||= y >= h - 2;

        const pxIndex = ((cellY + y) * imageWidth + cellX + x) * 4;
        if (pixels[pxIndex] + pixels[pxIndex + 1] + pixels[pxIndex + 2] < 430) {
          component.darkCount += 1;
        }

        for (let oy = -1; oy <= 1; oy += 1) {
          for (let ox = -1; ox <= 1; ox += 1) {
            if (ox === 0 && oy === 0) continue;
            const nx = x + ox;
            const ny = y + oy;
            if (nx < 0 || nx >= w || ny < 0 || ny >= h) continue;
            const ni = ny * w + nx;
            if (mask[ni] !== 1) continue;
            mask[ni] = id;
            stack.push(ni);
          }
        }
      }

      component.w = component.maxX - component.minX + 1;
      component.h = component.maxY - component.minY + 1;
      component.cx = component.minX + component.w / 2;
      component.cy = component.minY + component.h / 2;
      components.push(component);
    }

    return components;
  }

  function pickFrameComponents(components, frameWidth, frameHeight, allowDetachedEffects) {
    const keep = new Set();
    if (components.length === 0) return keep;

    let primary = components[0];
    let bestScore = -Infinity;
    for (const component of components) {
      const edgePenalty = component.touchesLeft || component.touchesRight || component.touchesTop ? component.count * 0.35 : 0;
      const centerPenalty = Math.abs(component.cx - frameWidth / 2) * 2.5;
      const groundedRootBonus = allowDetachedEffects ? 0 : component.maxY * 12;
      const score = component.count + component.darkCount * 2.2 + groundedRootBonus - edgePenalty - centerPenalty;
      if (score > bestScore) {
        bestScore = score;
        primary = component;
      }
    }

    keep.add(primary.id);
    const expandX = Math.max(30, frameWidth * 0.16);
    const expandY = Math.max(24, frameHeight * 0.14);
    const primaryBox = {
      minX: primary.minX - expandX,
      minY: primary.minY - expandY,
      maxX: primary.maxX + expandX,
      maxY: primary.maxY + expandY
    };

    for (const component of components) {
      if (component === primary) continue;
      const overlapsPrimary = component.maxX >= primaryBox.minX && component.minX <= primaryBox.maxX && component.maxY >= primaryBox.minY && component.minY <= primaryBox.maxY;
      const largeEffect = component.count >= Math.max(900, primary.count * 0.22) && component.w > 16 && component.h > 16;
      const meaningfulBodyPiece = component.darkCount >= Math.max(100, primary.darkCount * 0.16);
      const edgeScrap = (component.touchesLeft || component.touchesRight || component.touchesTop) && component.count < primary.count * 0.2 && !overlapsPrimary;
      if (!edgeScrap && (overlapsPrimary || (allowDetachedEffects && (largeEffect || meaningfulBodyPiece)))) {
        keep.add(component.id);
      }
    }

    return keep;
  }

  function buildSpriteFrameBoxes() {
    const frameBoxes = {};
    for (const key of Object.keys(sheetMeta)) {
      const image = state.images[key];
      const meta = sheetMeta[key];
      if (!image || !meta) continue;
      const sheetInfo = analyzeSpriteSheet(image, meta);
      if (sheetInfo) frameBoxes[key] = sheetInfo;
    }
    return frameBoxes;
  }

  function analyzeSpriteSheet(image, meta) {
    const c = document.createElement("canvas");
    c.width = image.width;
    c.height = image.height;
    const cctx = c.getContext("2d", { willReadFrequently: true });
    cctx.drawImage(image, 0, 0);

    let pixels;
    try {
      pixels = cctx.getImageData(0, 0, c.width, c.height).data;
    } catch {
      return null;
    }

    const fw = c.width / meta.cols;
    const rh = c.height / meta.rows;
    const sheetBaselineY = getSheetBaselineY(meta, rh);
    const rows = [];

    for (let row = 0; row < meta.rows; row += 1) {
      const frames = [];

      for (let frame = 0; frame < meta.cols; frame += 1) {
        const frameInfo = analyzeFramePixels(pixels, c.width, fw, rh, row, frame, meta);
        frames.push(frameInfo);
      }

      rows[row] = {
        anchorX: Number.isFinite(meta.anchorX)
          ? meta.anchorX
          : meta.allowDetachedEffects
          ? median(frames.map((f) => f.anchorX))
          : meta.anchorMode === "lockedFrameBottomCenter"
          ? fw / 2
          : meta.anchorMode === "bottomCenter"
          ? median(frames.map((f) => f.bodyCenterX))
          : median(frames.map((f) => f.anchorX)),
        anchorY: meta.allowDetachedEffects
          ? median(frames.map((f) => f.anchorY))
          : meta.anchorMode === "lockedFrameBottomCenter"
          ? sheetBaselineY
          : meta.anchorMode === "bottomCenter"
          ? median(frames.map((f) => f.bounds.y + f.bounds.h))
          : median(frames.map((f) => f.anchorY)),
        frames
      };
    }

    return rows;
  }

  function getSheetBaselineY(meta, frameHeight) {
    if (Number.isFinite(meta.baselineY)) return meta.baselineY;
    if (Number.isFinite(meta.baselineRatio)) return frameHeight * meta.baselineRatio;
    return frameHeight - (meta.cropBottom || 0);
  }

  function analyzeFramePixels(pixels, imageWidth, fw, rh, row, frame, meta) {
    const cropX = meta.cropX || 0;
    const cellX = frame * fw;
    const cellY = row * rh;
    const x0 = Math.max(0, Math.floor(cellX + cropX));
    const x1 = Math.min(imageWidth, Math.ceil(cellX + fw - cropX));
    const y0 = Math.max(0, Math.floor(cellY + (meta.cropTop || 0)));
    const y1 = Math.ceil(cellY + rh - (meta.cropBottom || 0));

    let minX = Infinity;
    let minY = Infinity;
    let maxX = -Infinity;
    let maxY = -Infinity;
    let darkMaxY = -Infinity;
    const columnCounts = meta.pruneHorizontalClusters ? new Array(Math.ceil(fw)).fill(0) : null;

    for (let y = y0; y < y1; y += 1) {
      for (let x = x0; x < x1; x += 1) {
        const i = (y * imageWidth + x) * 4;
        const alpha = pixels[i + 3];
        if (alpha <= 18) continue;
        if (isChromaArtifact(pixels[i], pixels[i + 1], pixels[i + 2])) continue;
        minX = Math.min(minX, x);
        minY = Math.min(minY, y);
        maxX = Math.max(maxX, x);
        maxY = Math.max(maxY, y);
        if (columnCounts) {
          columnCounts[clamp(Math.floor(x - cellX), 0, columnCounts.length - 1)] += 1;
        }
        if (pixels[i] + pixels[i + 1] + pixels[i + 2] < 430) {
          darkMaxY = Math.max(darkMaxY, y);
        }
      }
    }

    if (!Number.isFinite(minX)) {
      const fallbackW = Math.max(1, fw - cropX * 2);
      const fallbackH = Math.max(1, rh - (meta.cropTop || 0) - (meta.cropBottom || 0));
      return {
        bounds: { x: cropX, y: meta.cropTop || 0, w: fallbackW, h: fallbackH },
        anchorX: cropX + fallbackW / 2,
        anchorY: (meta.cropTop || 0) + fallbackH,
        bodyCenterX: cropX + fallbackW / 2
      };
    }

    let renderMinX = minX;
    let renderMaxX = maxX;
    const primaryCluster = columnCounts ? pickPrimaryColumnCluster(columnCounts, fw) : null;
    if (primaryCluster) {
      renderMinX = Math.max(minX, Math.floor(cellX + primaryCluster.start));
      renderMaxX = Math.min(maxX, Math.ceil(cellX + primaryCluster.end));
      minY = Infinity;
      maxY = -Infinity;
      darkMaxY = -Infinity;

      for (let y = y0; y < y1; y += 1) {
        for (let x = renderMinX; x <= renderMaxX; x += 1) {
          const i = (y * imageWidth + x) * 4;
          const alpha = pixels[i + 3];
          if (alpha <= 18) continue;
          if (isChromaArtifact(pixels[i], pixels[i + 1], pixels[i + 2])) continue;
          minY = Math.min(minY, y);
          maxY = Math.max(maxY, y);
          if (pixels[i] + pixels[i + 1] + pixels[i + 2] < 430) {
            darkMaxY = Math.max(darkMaxY, y);
          }
        }
      }

      if (!Number.isFinite(minY)) {
        minY = y0;
        maxY = y1 - 1;
      }
    }

    const anchorYAbs = Number.isFinite(darkMaxY) ? darkMaxY : maxY;
    const bandTop = Math.max(minY, anchorYAbs - 18);
    let darkSumX = 0;
    let darkCount = 0;
    let allSumX = 0;
    let allCount = 0;

    for (let y = bandTop; y <= anchorYAbs; y += 1) {
      for (let x = renderMinX; x <= renderMaxX; x += 1) {
        const i = (y * imageWidth + x) * 4;
        const alpha = pixels[i + 3];
        if (alpha <= 18) continue;
        if (isChromaArtifact(pixels[i], pixels[i + 1], pixels[i + 2])) continue;
        allSumX += x;
        allCount += 1;
        if (pixels[i] + pixels[i + 1] + pixels[i + 2] < 430) {
          darkSumX += x;
          darkCount += 1;
        }
      }
    }

    const anchorXAbs = darkCount > 6 ? darkSumX / darkCount : allCount > 0 ? allSumX / allCount : (minX + maxX) / 2;

    return {
      bounds: {
        x: renderMinX - cellX,
        y: minY - cellY,
        w: renderMaxX - renderMinX + 1,
        h: maxY - minY + 1
      },
      anchorX: anchorXAbs - cellX,
      anchorY: anchorYAbs - cellY,
      bodyCenterX: (minX + maxX) / 2 - cellX
    };
  }

  function pickPrimaryColumnCluster(columnCounts, frameWidth) {
    const clusters = [];
    let activeStart = -1;
    let activeEnd = -1;
    let count = 0;
    let gap = 0;
    const activeThreshold = 4;
    const splitGap = 9;

    for (let i = 0; i < columnCounts.length; i += 1) {
      if (columnCounts[i] > activeThreshold) {
        if (activeStart < 0) activeStart = i;
        activeEnd = i;
        count += columnCounts[i];
        gap = 0;
      } else if (activeStart >= 0) {
        gap += 1;
        if (gap >= splitGap) {
          clusters.push({ start: activeStart, end: activeEnd, count });
          activeStart = -1;
          activeEnd = -1;
          count = 0;
          gap = 0;
        }
      }
    }

    if (activeStart >= 0) {
      clusters.push({ start: activeStart, end: activeEnd, count });
    }

    if (clusters.length <= 1) return null;

    const center = frameWidth / 2;
    let primary = clusters[0];
    let bestScore = -Infinity;
    for (const cluster of clusters) {
      const clusterCenter = (cluster.start + cluster.end) / 2;
      const score = cluster.count - Math.abs(clusterCenter - center) * 5;
      if (score > bestScore) {
        bestScore = score;
        primary = cluster;
      }
    }

    let start = primary.start;
    let end = primary.end;
    const keepGap = 28;
    for (const cluster of clusters) {
      if (cluster === primary) continue;
      const gapToPrimary = cluster.end < start ? start - cluster.end : cluster.start - end;
      if (gapToPrimary <= keepGap) {
        start = Math.min(start, cluster.start);
        end = Math.max(end, cluster.end);
      }
    }

    return { start, end };
  }

  function median(values) {
    const clean = values.filter(Number.isFinite).sort((a, b) => a - b);
    if (clean.length === 0) return 0;
    return clean[Math.floor(clean.length / 2)];
  }

  function resetRound() {
    const versusMode = state.mode === "versus";
    const playerId = versusMode ? state.selectedP1CharacterId : state.selectedPlayerId;
    const enemyId = versusMode ? state.selectedP2CharacterId : getOpponentId(playerId);
    state.player = makeFighter("player", 330, 1, playerId);
    state.enemy = makeFighter("enemy", 720, -1, enemyId);
    if (versusMode) state.enemyAI = false;
    state.particles = [];
    state.projectiles = [];
    state.nyxSignatureEffects = [];
    state.hitPause = 0;
    state.cameraShake = 0;
    state.messageTimer = 1.5;
    resetCombo(true);
    roundStatusEl.textContent = getRoundStatus();
    updateHud();
  }

  function getRoundStatus() {
    if (state.mode === "versus") {
      const p1Name = state.player?.profile.shortName || "P1";
      const p2Name = state.enemy?.profile.shortName || "P2";
      return `${p1Name} VS ${p2Name}`;
    }
    return getTrainingStatus();
  }

  function getTrainingStatus() {
    const enemyName = state.enemy?.profile.shortName || "RIVAL";
    return state.enemyAI ? `${enemyName} AI ON` : `${enemyName} DUMMY`;
  }

  function isFightMode() {
    return state.mode === "training" || state.mode === "versus";
  }

  function showCharacterSelect(selectGameMode = "versus") {
    titleScreen.classList.add("hidden");
    characterSelect.classList.remove("hidden");
    state.mode = "select";
    setCharacterSelectMode(selectGameMode);
    const selectedButton = characterSelect.querySelector(`[data-character="${state.selectCursorCharacterId}"]`);
    selectedButton?.focus({ preventScroll: true });
  }

  function startTraining(characterId = state.selectedPlayerId) {
    state.selectedPlayerId = isLaunchableCharacterId(characterId) ? characterId : "kairo";
    state.selectedP1CharacterId = state.selectedPlayerId;
    titleScreen.classList.add("hidden");
    characterSelect.classList.add("hidden");
    hud.classList.remove("hidden");
    state.mode = "training";
    state.paused = false;
    resetRound();
  }

  function startLocalVersus() {
    state.selectedP1CharacterId = isLaunchableCharacterId(state.selectedP1CharacterId) ? state.selectedP1CharacterId : "kairo";
    state.selectedP2CharacterId = isLaunchableCharacterId(state.selectedP2CharacterId) ? state.selectedP2CharacterId : "vanta";
    state.selectedPlayerId = state.selectedP1CharacterId;
    titleScreen.classList.add("hidden");
    characterSelect.classList.add("hidden");
    hud.classList.remove("hidden");
    state.mode = "versus";
    state.enemyAI = false;
    state.paused = false;
    resetRound();
  }

  function setCharacterSelectMode(selectGameMode) {
    state.selectGameMode = selectGameMode === "training" ? "training" : "versus";
    state.activeSelectSide = "p1";
    state.p1Ready = false;
    state.p2Ready = false;
    state.selectCursorCharacterId = state.selectGameMode === "training" ? state.selectedPlayerId : state.selectedP1CharacterId;
    updateCharacterSelectFocus(state.selectCursorCharacterId);
  }

  function updateCharacterSelectFocus(characterId) {
    state.selectCursorCharacterId = selectableCharacterIds.includes(characterId) ? characterId : "kairo";
    if (state.selectGameMode === "training") {
      state.selectedPlayerId = state.selectCursorCharacterId;
      state.selectedP1CharacterId = state.selectCursorCharacterId;
    }
    characterButtons.forEach((button) => {
      const character = button.dataset.character;
      const selected = character === state.selectCursorCharacterId;
      button.classList.toggle("selected", selected);
      button.classList.toggle("p1-picked", state.p1Ready && character === state.selectedP1CharacterId);
      button.classList.toggle("p2-picked", state.p2Ready && character === state.selectedP2CharacterId);
      button.setAttribute("aria-pressed", selected ? "true" : "false");
      let badgeWrap = button.querySelector(".selection-badges");
      if (!badgeWrap) {
        badgeWrap = document.createElement("span");
        badgeWrap.className = "selection-badges";
        button.prepend(badgeWrap);
      }
      const badges = [];
      if (state.p1Ready && character === state.selectedP1CharacterId) badges.push("P1");
      if (state.p2Ready && character === state.selectedP2CharacterId) badges.push("P2");
      badgeWrap.innerHTML = badges.map((badge) => `<span>${badge}</span>`).join("");
    });
    updateCharacterSelectUi();
  }

  function isLaunchableCharacterId(characterId) {
    return selectableCharacterIds.includes(characterId) || hiddenTestCharacterIds.includes(characterId);
  }

  function getSelectDisplayName(characterId) {
    return characterProfiles[characterId]?.name || "SELECT";
  }

  function updateCharacterSelectUi() {
    const trainingMode = state.selectGameMode === "training";
    selectModeLabel.textContent = trainingMode ? "Training Dummy" : "Local Versus";
    selectVersusButton.classList.toggle("active", !trainingMode);
    selectTrainingButton.classList.toggle("active", trainingMode);
    p1SelectName.textContent = getSelectDisplayName(trainingMode ? state.selectCursorCharacterId : state.selectedP1CharacterId);
    p2SelectName.textContent = trainingMode ? getSelectDisplayName(getOpponentId(state.selectCursorCharacterId)) : getSelectDisplayName(state.selectedP2CharacterId);
    p1SelectStatus.textContent = trainingMode ? "Player" : state.p1Ready ? "Ready" : "Choosing";
    p2SelectStatus.textContent = trainingMode ? "Dummy" : state.p2Ready ? "Ready" : state.p1Ready ? "Choosing" : "Waiting";
    p1SelectSlot.classList.toggle("active", state.activeSelectSide === "p1");
    p2SelectSlot.classList.toggle("active", state.activeSelectSide === "p2");
    p1SelectSlot.classList.toggle("ready", state.p1Ready || trainingMode);
    p2SelectSlot.classList.toggle("ready", state.p2Ready || trainingMode);
    if (trainingMode) {
      matchupPreview.textContent = `${getSelectDisplayName(state.selectCursorCharacterId)} vs ${getSelectDisplayName(getOpponentId(state.selectCursorCharacterId))} dummy`;
    } else if (!state.p1Ready) {
      matchupPreview.textContent = "Choose P1 fighter";
    } else if (!state.p2Ready) {
      matchupPreview.textContent = `${getSelectDisplayName(state.selectedP1CharacterId)} locked - choose P2 fighter`;
    } else {
      matchupPreview.textContent = `${getSelectDisplayName(state.selectedP1CharacterId)} vs ${getSelectDisplayName(state.selectedP2CharacterId)} - press Enter to start`;
    }
  }

  function confirmCharacterSelect() {
    if (state.selectGameMode === "training") {
      startTraining(state.selectCursorCharacterId);
      return;
    }
    if (state.activeSelectSide === "p1") {
      state.selectedP1CharacterId = state.selectCursorCharacterId;
      state.p1Ready = true;
      state.activeSelectSide = "p2";
      state.selectCursorCharacterId = state.selectedP2CharacterId;
      updateCharacterSelectFocus(state.selectCursorCharacterId);
      return;
    }
    if (state.activeSelectSide === "p2") {
      state.selectedP2CharacterId = state.selectCursorCharacterId;
      state.p2Ready = true;
      state.activeSelectSide = "ready";
      updateCharacterSelectFocus(state.selectCursorCharacterId);
      return;
    }
    startLocalVersus();
  }

  function backCharacterSelect() {
    if (state.selectGameMode === "versus" && state.activeSelectSide === "ready") {
      state.p2Ready = false;
      state.activeSelectSide = "p2";
      state.selectCursorCharacterId = state.selectedP2CharacterId;
      updateCharacterSelectFocus(state.selectCursorCharacterId);
      return;
    }
    if (state.selectGameMode === "versus" && state.activeSelectSide === "p2") {
      state.p1Ready = false;
      state.activeSelectSide = "p1";
      state.selectCursorCharacterId = state.selectedP1CharacterId;
      updateCharacterSelectFocus(state.selectCursorCharacterId);
      return;
    }
    characterSelect.classList.add("hidden");
    titleScreen.classList.remove("hidden");
    state.mode = "title";
    startButton.focus({ preventScroll: true });
  }

  function handleCharacterSelectKey(e) {
    const handled = ["KeyA", "ArrowLeft", "Digit1", "Numpad1", "KeyD", "ArrowRight", "Digit2", "Numpad2", "KeyW", "ArrowUp", "Digit3", "Numpad3", "KeyS", "ArrowDown", "Digit4", "Numpad4", "Digit5", "Numpad5", "KeyT", "KeyV", "Enter", "Escape", "Backspace"].includes(e.code);
    if (!handled) return false;

    e.preventDefault();
    e.stopPropagation();

    if (e.code === "KeyV") setCharacterSelectMode("versus");
    if (e.code === "KeyT") setCharacterSelectMode("training");
    if (["KeyA", "ArrowLeft"].includes(e.code)) updateCharacterSelectFocus("kairo");
    if (["KeyD", "ArrowRight"].includes(e.code)) updateCharacterSelectFocus("vanta");
    if (["KeyW", "ArrowUp"].includes(e.code)) updateCharacterSelectFocus("nyx");
    if (["KeyS", "ArrowDown"].includes(e.code)) updateCharacterSelectFocus("sol");
    if (selectShortcutCharacterIds[e.code]) updateCharacterSelectFocus(selectShortcutCharacterIds[e.code]);
    if (e.code === "Enter") confirmCharacterSelect();
    if (e.code === "Escape" || e.code === "Backspace") backCharacterSelect();

    const selectedButton = characterSelect.querySelector(`[data-character="${state.selectCursorCharacterId}"]`);
    selectedButton?.focus({ preventScroll: true });
    return true;
  }

  function loop(now) {
    const last = state.lastNow || now;
    state.lastNow = now;
    const rawDt = Math.min((now - last) / 1000, 1 / 30);
    const dt = state.paused ? 0 : rawDt;
    update(dt);
    render();
    requestAnimationFrame(loop);
  }

  function update(dt) {
    state.time += dt;
    updateParticles(dt);
    updateNyxSignatureEffects(dt);

    if (!isFightMode() || state.paused) {
      return;
    }

    if (state.messageTimer > 0) {
      state.messageTimer -= dt;
    }

    if (state.hitPause > 0) {
      state.hitPause = Math.max(0, state.hitPause - dt);
      return;
    }

    updateProjectiles(dt);
    updateCombo(dt);
    updatePlayer(dt);
    updateEnemy(dt);
    resolveFighterPush();
    updateHud();
  }

  function updatePlayer(dt) {
    const p = state.player;
    const e = state.enemy;
    p.facing = p.x <= e.x ? 1 : -1;
    p.crouching = false;
    p.blocking = false;
    tickFighterTimers(p, dt);

    if (p.hp <= 0) {
      p.dead = true;
      p.anim = "death";
      p.vx = 0;
      integrate(p, dt);
      return;
    }

    if (p.blockstun > 0) {
      p.blockstun = Math.max(0, p.blockstun - dt);
      p.anim = getHitReactionAnim(p, "block");
      p.vx *= 0.32;
      if (Math.abs(p.vx) < 8) p.vx = 0;
      if (p.blockstun <= 0) p.reactionAnim = null;
      integrate(p, dt);
      return;
    }

    if (p.hitstun > 0) {
      p.hitstun = Math.max(0, p.hitstun - dt);
      p.anim = getHitReactionAnim(p, p.grounded ? "damaged" : "knockback");
      p.vx *= 0.42;
      if (Math.abs(p.vx) < 8) p.vx = 0;
      integrate(p, dt);
      if (p.hitstun <= 0 && !p.grounded) p.recoveryTimer = Math.max(p.recoveryTimer, getJumpStats(p).airRecoveryDuration);
      if (p.hitstun <= 0) p.reactionAnim = null;
      return;
    }

    if (p.knockdownTimer > 0) {
      p.knockdownTimer = Math.max(0, p.knockdownTimer - dt);
      p.anim = getKnockdownAnim(p, p.knockdownTimer > 0.16 ? "knockback" : "get_up");
      p.vx *= 0.22;
      if (p.knockdownTimer <= 0) p.reactionAnim = null;
      integrate(p, dt);
      return;
    }

    if (p.recoveryTimer > 0) {
      p.recoveryTimer = Math.max(0, p.recoveryTimer - dt);
      p.anim = usesNewGenerationArt(p) ? (p.grounded ? "get_up" : "air_recovery") : p.grounded ? "get_up" : "knockback";
      p.vx *= p.grounded ? 0.34 : 0.88;
      integrate(p, dt);
      return;
    }

    if (p.landingTimer > 0) {
      p.landingTimer = Math.max(0, p.landingTimer - dt);
      p.anim = "stand_up";
      p.vx *= 0.35;
      integrate(p, dt);
      return;
    }

    const movement = getMovementStats(p);
    const airDash = getAirDashStats(p);
    if (p.airDashTimer > 0) {
      p.airDashTimer = Math.max(0, p.airDashTimer - dt);
      p.vx = p.dashDirection * airDash.speed;
      p.vy = 0;
      p.anim = getDashAnim(p);
    } else if (p.dashTimer > 0) {
      p.dashTimer = Math.max(0, p.dashTimer - dt);
      p.vx = p.dashDirection * movement.dashSpeed;
      p.anim = getDashAnim(p);
    } else if (p.action) {
      updateAction(p, dt);
    } else {
      readMovement(p, P1_CONTROLS);
    }

    integrate(p, dt);
  }

  function readMovement(p, controls) {
    const forward = p.facing === 1 ? controls.right : controls.left;
    const back = p.facing === 1 ? controls.left : controls.right;
    const holdingForward = state.keys.has(forward);
    const holdingBack = state.keys.has(back);
    const holdingDown = state.keys.has(controls.down);
    const movement = getMovementStats(p);

    p.vx = 0;

    if (holdingDown && p.grounded) {
      p.crouching = true;
      p.anim = withEnemyPrefix(p, "crouch");
      return;
    }

    if (holdingBack && p.grounded) {
      p.blocking = true;
      p.vx = -p.facing * movement.walkBack;
      p.anim = usesNewGenerationArt(p) ? withEnemyPrefix(p, "walk_back") : withEnemyPrefix(p, "block");
      return;
    }

    if (holdingForward) {
      p.vx = p.facing * movement.walkForward;
      p.anim = p.grounded ? withEnemyPrefix(p, "walk_forward") : getAirDriftAnim(p, true, false);
      return;
    }

    if (holdingBack) {
      p.vx = -p.facing * movement.walkBack;
      p.anim = p.grounded ? withEnemyPrefix(p, "walk_back") : getAirDriftAnim(p, false, true);
      return;
    }

    p.anim = p.grounded ? withEnemyPrefix(p, "idle") : getAirDriftAnim(p, false, false);
  }

  function tickFighterTimers(f, dt) {
    if (f.dashCooldown > 0) f.dashCooldown = Math.max(0, f.dashCooldown - dt);
    if (f.airDashCooldown > 0) f.airDashCooldown = Math.max(0, f.airDashCooldown - dt);
    if (f.superDashCooldown > 0) f.superDashCooldown = Math.max(0, f.superDashCooldown - dt);
    if (f.bufferedMove) {
      f.bufferedMove.timer -= dt;
      if (f.bufferedMove.timer <= 0) f.bufferedMove = null;
    }
  }

  function updateEnemy(dt) {
    const e = state.enemy;
    const p = state.player;
    e.facing = e.x <= p.x ? 1 : -1;
    e.crouching = false;
    e.blocking = false;
    tickFighterTimers(e, dt);
    if (e.dead) {
      e.anim = "enemy_death";
      e.vx = 0;
    } else if (e.blockstun > 0) {
      e.blockstun = Math.max(0, e.blockstun - dt);
      e.anim = getHitReactionAnim(e, "enemy_block");
      e.vx *= 0.32;
      if (e.blockstun <= 0) e.reactionAnim = null;
    } else if (e.action) {
      updateAction(e, dt);
    } else if (e.hitstun > 0) {
      e.hitstun = Math.max(0, e.hitstun - dt);
      e.anim = getHitReactionAnim(e, e.grounded ? "enemy_damaged" : "enemy_knockback");
      e.vx *= 0.36;
      if (Math.abs(e.vx) < 8) e.vx = 0;
      if (e.hitstun <= 0 && !e.grounded) e.recoveryTimer = Math.max(e.recoveryTimer, getJumpStats(e).airRecoveryDuration);
      if (e.hitstun <= 0) e.reactionAnim = null;
    } else if (e.knockdownTimer > 0) {
      e.knockdownTimer = Math.max(0, e.knockdownTimer - dt);
      e.anim = getKnockdownAnim(e, e.knockdownTimer > 0.16 ? "enemy_knockback" : "enemy_get_up");
      e.vx *= 0.22;
      if (e.knockdownTimer <= 0) e.reactionAnim = null;
    } else if (e.recoveryTimer > 0) {
      e.recoveryTimer = Math.max(0, e.recoveryTimer - dt);
      e.anim = usesNewGenerationArt(e) ? (e.grounded ? "enemy_get_up" : "enemy_air_recovery") : e.grounded ? "enemy_get_up" : "enemy_knockback";
      e.vx *= e.grounded ? 0.34 : 0.88;
    } else if (e.landingTimer > 0) {
      e.landingTimer = Math.max(0, e.landingTimer - dt);
      e.anim = "enemy_stand_up";
      e.vx *= 0.35;
    } else {
      if (state.enemyAI) {
        updateEnemyAI(e, p, dt);
      } else if (state.mode === "versus") {
        readMovement(e, P2_CONTROLS);
      } else {
        e.vx *= 0.55;
        if (Math.abs(e.vx) < 5) e.vx = 0;
        e.anim = "enemy_idle";
      }
    }
    integrate(e, dt);
  }

  function growPassiveMeter(dt) {
    growFighterMeter(state.player, PASSIVE_METER_PER_SECOND * dt);
    if (state.mode === "versus") growFighterMeter(state.enemy, PASSIVE_METER_PER_SECOND * dt);
  }

  function shouldGainMeter(f) {
    return f?.kind === "player" || (state.mode === "versus" && f?.kind === "enemy");
  }

  function growFighterMeter(f, amount) {
    if (!f || f.dead || f.meter >= METER_MAX) return;
    f.meter = clamp(f.meter + amount, 0, METER_MAX);
  }

  function updateEnemyAI(e, p, dt) {
    const distance = Math.abs(p.x - e.x);
    const ai = e.profile.ai || baselineEnemyAI;
    e.aiCooldown = Math.max(0, e.aiCooldown - dt);
    e.facing = e.x <= p.x ? 1 : -1;

    if (p.dead) {
      e.anim = "enemy_idle";
      e.vx = 0;
      return;
    }

    if (distance > ai.attackRange) {
      e.vx = e.facing * ai.walkSpeed;
      e.anim = "enemy_walk_forward";
      return;
    }

    e.vx *= 0.55;
    if (Math.abs(e.vx) < 5) e.vx = 0;
    e.anim = "enemy_idle";

    if (e.aiCooldown <= 0) {
      const attack = chooseEnemyAttack(distance);
      startEnemyMove(attack);
      e.aiCooldown = ai.minCooldown + Math.random() * (ai.maxCooldown - ai.minCooldown);
    }
  }

  function chooseEnemyAttack(distance) {
    const ai = state.enemy?.profile?.ai || baselineEnemyAI;
    if (distance > ai.farRange) return ai.farAttack;
    const roll = Math.random();
    for (const route of ai.weightedAttacks) {
      if (roll < route.threshold) return route.move;
    }
    return ai.fallbackAttack;
  }

  function updateAction(f, dt) {
    const moveData = getMove(f);
    f.actionTime += dt;
    f.anim = getCharacterActionPhaseAnim(f, moveData) || f.anim;
    f.vx *= moveData.flags.dash ? 0.98 : f.grounded ? 0.46 : 0.88;

    if (moveData.flags.superDash) updateSuperDashVelocity(f);
    if (moveData.flags.shadowStep && f.actionTime < 0.16) updateShadowStepVelocity(f, moveData);
    else if (moveData.flags.dash && f.actionTime < 0.18) f.vx = f.facing * 620;
    if (moveData.flags.dive && f.actionTime < 0.22) updateDiveVelocity(f, moveData);
    if (moveData.flags.stepForward && f.actionTime < moveData.startup + moveData.active) f.vx = f.facing * moveData.flags.stepForward;
    if (moveData.flags.rise && f.actionTime < 0.2) f.vy = Math.min(f.vy, -360);
    if (moveData.flags.projectile && !f.spawnedProjectile && f.actionTime >= moveData.startup) {
      spawnProjectile(f, moveData);
      f.spawnedProjectile = true;
    }
    if (!moveData.flags.noHit && isMoveActive(f)) {
      if (moveData.flags.multiHit) {
        tryMultiHit(f, moveData);
      } else if (!f.hasHit) {
        tryHit(f, f.kind === "player" ? state.enemy : state.player, moveData);
      }
    }

    if (tryBufferedMove(f)) return;

    if (f.actionTime >= moveData.duration) {
      const buffered = f.bufferedMove;
      f.action = null;
      f.activeMove = null;
      f.hasHit = false;
      f.hitCount = 0;
      f.lastHitTime = -Infinity;
      f.spawnedProjectile = false;
      f.cancelUnlocked = false;
      if (buffered) {
        f.bufferedMove = null;
        beginMove(f, buffered.key);
      }
    }
  }

  function integrate(f, dt) {
    const wasGrounded = f.grounded;
    if (!f.grounded || f.vy < 0) {
      const jumpStats = getJumpStats(f);
      const gravity = !f.grounded && f.hitstun > 0 ? jumpStats.juggleGravity : !f.grounded && f.recoveryTimer > 0 ? jumpStats.airRecoveryGravity : jumpStats.gravity;
      f.vy += gravity * dt;
      if (!f.grounded && f.hitstun > 0) {
        f.vx *= Math.pow(0.72, dt * 60);
      }
    }

    f.x += f.vx * dt;
    f.y += f.vy * dt;

    if (f.y >= GROUND_Y) {
      f.y = GROUND_Y;
      f.vy = 0;
      f.grounded = true;
      f.airDashUsed = false;
      if (!wasGrounded) {
        if (f.pendingKnockdown > 0) {
          f.knockdownTimer = Math.max(f.knockdownTimer, f.pendingKnockdown);
          f.pendingKnockdown = 0;
          f.vx *= 0.24;
          spawnLandingDust(f);
        } else if (!f.action && f.hitstun <= 0) {
          f.landingTimer = Math.max(f.landingTimer, getJumpStats(f).landingRecovery);
          f.vx *= 0.42;
        }
      }
    } else {
      f.grounded = false;
    }

    f.x = clamp(f.x, 110, W - 110);
  }

  function resolveFighterPush() {
    const p = state.player;
    const e = state.enemy;
    const gap = Math.abs(p.x - e.x);
    const airborne = !p.grounded || !e.grounded;
    const minGap = airborne ? AIR_HIT_SEPARATION : GROUND_PUSH_SEPARATION;
    if (gap < minGap) {
      const push = (minGap - gap) * (airborne ? 0.26 : 0.5);
      const dir = p.x < e.x ? -1 : 1;
      p.x = clamp(p.x + dir * push, 110, W - 110);
      e.x = clamp(e.x - dir * push, 110, W - 110);
    }
  }

  function startMove(key, fighter = state.player) {
    const p = fighter;
    if (!isFightMode() || state.paused || p.dead || p.dashTimer > 0 || p.airDashTimer > 0) return;
    const data = getMove(p, key);
    if (!data) return;
    if (data.flags.ultimate && p.meter < METER_MAX) {
      flashStatus(`${p.profile.shortName} METER NEEDED`, 0.8);
      return;
    }
    if (p.blockstun > 0 || p.hitstun > 0 || p.knockdownTimer > 0 || p.recoveryTimer > 0 || p.landingTimer > 0) return;

    if (p.action) {
      if (canCancelInto(p, key)) {
        beginMove(p, key);
      } else {
        p.bufferedMove = { key, timer: INPUT_BUFFER };
      }
      return;
    }

    beginMove(p, key);
  }

  function startEnemyMove(key) {
    const e = state.enemy;
    const data = getMove(e, key);
    if (!data || e.dead || e.action || e.hitstun > 0 || e.blockstun > 0 || e.knockdownTimer > 0 || e.recoveryTimer > 0) return;
    beginMove(e, key);
  }

  function beginMove(f, key) {
    const data = getMove(f, key);
    if (!data) return;
    f.action = "attack";
    f.actionTime = 0;
    f.activeMove = key;
    f.hasHit = false;
    f.hitCount = 0;
    f.lastHitTime = -Infinity;
    f.spawnedProjectile = false;
    f.cancelUnlocked = false;
    f.bufferedMove = null;
    f.anim = getMoveAnimKey(f, key, data);
    if (f.grounded && !data.flags.dash && !data.flags.rise && !data.flags.superDash) {
      f.vx = 0;
    }
    if (data.flags.superDash) {
      f.superDashCooldown = getMovementStats(f).superDashCooldown;
      f.vy = 0;
      spawnBurst(f.x + f.facing * 62, f.y - 82, f.profile.projectileColor, 18);
    }
    if (data.flags.ultimate) {
      f.meter = 0;
      state.cameraShake = 12;
      spawnBurst(f.x + f.facing * 150, f.y - 95, f.profile.ultimateBurstColor || "#d66bff", 34);
      if (usesNyxArt(f)) spawnNyxUltimateVisual(f);
    }
  }

  function getMoveAnimKey(f, key, data) {
    if (data.flags.anim) return f.kind === "enemy" ? `enemy_${data.flags.anim}` : data.flags.anim;
    return key;
  }

  function canCancelInto(f, nextKey) {
    const current = getMove(f);
    const next = getMove(f, nextKey);
    if (!current || !next) return false;
    const routes = getComboRoutes(f);
    const lateCancel = f.actionTime >= current.cancelTime;
    const basicChainReady = f.actionTime >= current.startup + current.active * 0.34;
    const hitCancelReady = f.actionTime >= current.startup + current.active * 0.38;
    if (routes.autoCombos[f.activeMove] === nextKey && f.grounded && basicChainReady) return true;
    if (routes.airCombos[f.activeMove] === nextKey && !f.grounded && basicChainReady) return true;
    if (!f.cancelUnlocked) return false;
    if (current.flags.superDash && !next.flags.ultimate) return hitCancelReady;
    if (current.flags.cancelOnHit?.includes(nextKey)) return hitCancelReady;
    if (current.flags.dashCancel && next.flags.superDash) return lateCancel || hitCancelReady;
    if (next.flags.projectile && current.flags.cancelOnHit?.includes(nextKey)) return hitCancelReady;
    return false;
  }

  function tryBufferedMove(f) {
    if (!f.bufferedMove) return false;
    if (!canCancelInto(f, f.bufferedMove.key)) return false;
    const key = f.bufferedMove.key;
    beginMove(f, key);
    return true;
  }

  function updateSuperDashVelocity(f) {
    const target = f.kind === "player" ? state.enemy : state.player;
    if (!target || target.dead) return;
    const movement = getMovementStats(f);
    const dx = target.x - f.x;
    const dy = (target.y - 76) - (f.y - 76);
    const len = Math.max(1, Math.hypot(dx, dy));
    f.vx = (dx / len) * movement.superDashSpeed;
    f.vy = (dy / len) * movement.superDashSpeed;
    f.facing = dx >= 0 ? 1 : -1;
  }

  function updateShadowStepVelocity(f, moveData) {
    const target = f.kind === "player" ? state.enemy : state.player;
    if (!target || target.dead) {
      f.vx = f.facing * (moveData.flags.shadowStepSpeed || 860);
      return;
    }
    const offset = moveData.flags.shadowStepOffset || 84;
    const nearEnoughToSlipBehind = Math.abs(target.x - f.x) < 135;
    const targetX = nearEnoughToSlipBehind ? target.x + f.facing * offset : target.x - f.facing * offset;
    const dir = Math.sign(targetX - f.x) || f.facing;
    f.vx = dir * (moveData.flags.shadowStepSpeed || 860);
  }

  function updateDiveVelocity(f, moveData) {
    f.vx = f.facing * (moveData.flags.diveSpeedX || 540);
    if (!f.grounded) {
      f.vy = Math.max(f.vy, moveData.flags.diveSpeedY || 480);
    }
  }

  function tryMultiHit(f, moveData) {
    const multi = moveData.flags.multiHit;
    const maxHits = multi.maxHits || 2;
    const interval = (multi.intervalFrames || 5) / 60;
    if (f.hitCount >= maxHits) return;
    if (f.actionTime - f.lastHitTime < interval) return;
    const defender = f.kind === "player" ? state.enemy : state.player;
    if (tryHit(f, defender, moveData)) {
      f.hitCount += 1;
      f.lastHitTime = f.actionTime;
      f.hasHit = false;
    }
  }

  function startDash(fighter = state.player, controls = P1_CONTROLS) {
    const p = fighter;
    if (!isFightMode() || p.dead || p.blockstun > 0 || p.hitstun > 0 || p.knockdownTimer > 0 || p.recoveryTimer > 0) return;
    if (p.action) {
      if (!canDashCancel(p)) return;
      clearAction(p);
    }
    const direction = getDashDirection(p, controls);
    const movement = getMovementStats(p);
    const airDash = getAirDashStats(p);
    if (!p.grounded) {
      if (p.airDashUsed || p.airDashCooldown > 0) return;
      p.airDashTimer = airDash.duration;
      p.airDashCooldown = airDash.cooldown;
      p.airDashUsed = true;
      p.dashDirection = direction;
      p.vy = 0;
    } else {
      if (p.dashCooldown > 0) return;
      p.dashTimer = movement.dashDuration;
      p.dashCooldown = movement.dashCooldown;
      p.dashDirection = direction;
    }
    p.anim = getDashAnim(p);
    if (p.profile.effects?.dashTrail) {
      spawnTrail(p.x, p.y - 80);
    }
  }

  function startSuperDash(fighter = state.player) {
    const p = fighter;
    if (!isFightMode() || p.dead || p.superDashCooldown > 0) return;
    if (p.blockstun > 0 || p.hitstun > 0 || p.knockdownTimer > 0 || p.recoveryTimer > 0) return;
    if (p.action && !canDashCancel(p)) {
      p.bufferedMove = { key: "super_dash", timer: INPUT_BUFFER };
      return;
    }
    if (p.action) clearAction(p);
    beginMove(p, "super_dash");
  }

  function canDashCancel(f) {
    const current = getMove(f);
    if (!current) return false;
    return current.flags.dashCancel && (f.cancelUnlocked || f.actionTime >= current.cancelTime);
  }

  function getDashDirection(p, controls = P1_CONTROLS) {
    const forward = p.facing === 1 ? controls.right : controls.left;
    const back = p.facing === 1 ? controls.left : controls.right;
    if (state.keys.has(back)) return -p.facing;
    if (state.keys.has(forward)) return p.facing;
    return p.facing;
  }

  function jump(fighter = state.player) {
    const p = fighter;
    if (!isFightMode() || p.dead || p.blockstun > 0 || p.hitstun > 0 || p.knockdownTimer > 0 || p.recoveryTimer > 0) return;
    if (p.action) {
      if (!canJumpCancel(p)) return;
      clearAction(p);
    }
    if (!p.grounded) return;
    p.vy = getJumpStats(p).jumpVelocity;
    p.grounded = false;
    p.landingTimer = 0;
  }

  function canJumpCancel(f) {
    const current = getMove(f);
    if (!current) return false;
    return current.flags.jumpCancel && (f.cancelUnlocked || f.actionTime >= current.cancelTime);
  }

  function clearAction(f) {
    f.action = null;
    f.activeMove = null;
    f.hasHit = false;
    f.hitCount = 0;
    f.lastHitTime = -Infinity;
    f.spawnedProjectile = false;
    f.cancelUnlocked = false;
    f.bufferedMove = null;
  }

  function isBlockingHit(attacker, defender) {
    const attackerIsInFront = (attacker.x > defender.x) === (defender.facing === 1);
    return defender.blocking && defender.grounded && attackerIsInFront;
  }

  function enforceHitSeparation(attacker, defender, moveData, blocked = false) {
    if (!attacker || !defender || moveData.flags?.superDash) return;
    const desired = defender.grounded && attacker.grounded ? GROUND_HIT_SEPARATION : AIR_HIT_SEPARATION;
    const dir = attacker.facing || (attacker.x <= defender.x ? 1 : -1);
    const currentGap = Math.abs(defender.x - attacker.x);

    if ((dir === 1 && defender.x < attacker.x) || (dir === -1 && defender.x > attacker.x)) {
      defender.x = attacker.x + dir * desired;
    } else if (currentGap < desired) {
      const correction = desired - currentGap;
      const defenderShare = defender.grounded ? 0.68 : 0.76;
      defender.x += dir * correction * defenderShare;
      attacker.x -= dir * correction * (1 - defenderShare);
    } else if (!defender.grounded && currentGap > AIR_HIT_MAX_SEPARATION && moveData.flags?.air) {
      const pull = Math.min(currentGap - AIR_HIT_MAX_SEPARATION, 28);
      defender.x -= dir * pull;
    }

    if (!blocked && !defender.grounded) {
      defender.vx += dir * 18;
      attacker.vx -= dir * 8;
    }

    attacker.x = clamp(attacker.x, 110, W - 110);
    defender.x = clamp(defender.x, 110, W - 110);
  }

  function getComboDamageScale(attacker) {
    const combo = state.combo;
    if (combo.owner !== attacker.kind || combo.hits <= 0) return 1;
    return Math.max(COMBO_MIN_SCALE, 1 - combo.hits * COMBO_SCALE_STEP);
  }

  function getComboHitstunScale(attacker) {
    const combo = state.combo;
    if (combo.owner !== attacker.kind || combo.hits <= 0) return 1;
    if (combo.hits >= HITSTUN_DECAY_HIGH_START_HITS) return HITSTUN_HIGH_COMBO_SCALE;
    if (combo.hits >= HITSTUN_DECAY_MID_START_HITS) return HITSTUN_MID_COMBO_SCALE;
    return 1;
  }

  function getComboKnockbackScale(attacker) {
    const combo = state.combo;
    if (combo.owner !== attacker.kind || combo.hits < KNOCKBACK_GROWTH_START_HITS) return 1;
    const extraHits = combo.hits - KNOCKBACK_GROWTH_START_HITS + 1;
    return Math.min(KNOCKBACK_GROWTH_MAX, 1 + extraHits * KNOCKBACK_GROWTH_STEP);
  }

  function getImpactProfile(source, blocked = false) {
    if (blocked) {
      return { hitStop: 0.024, shake: 1.5, sparkCount: 7, sparkSize: 8, burstSize: 18, speed: 180, life: 0.18, color: "#7fd6ff" };
    }
    const flags = source.flags || {};
    if (flags.ultimate) {
      return { hitStop: 0.13, shake: 16, sparkCount: 22, sparkSize: 20, burstSize: 42, speed: 520, life: 0.36, color: "#f2b3ff", dramatic: true };
    }
    if (flags.launcher || flags.hardKnockdown) {
      return { hitStop: 0.078, shake: 11, sparkCount: 18, sparkSize: 17, burstSize: 34, speed: 420, life: 0.3, color: "#fff3ba", dramatic: true };
    }
    if (source.boxType === "heavy" || source.boxType === "ultimate") {
      return { hitStop: 0.066, shake: 8, sparkCount: 16, sparkSize: 15, burstSize: 31, speed: 380, life: 0.28, color: "#fff3ba", dramatic: true };
    }
    if (flags.dash || flags.rise || flags.superDash || flags.projectileImpact || source.boxType === "chain") {
      return { hitStop: 0.056, shake: 6, sparkCount: 14, sparkSize: 13, burstSize: 27, speed: 340, life: 0.26, color: "#ffe4a8", dramatic: true };
    }
    if (source.boxType === "medium" || source.boxType === "low" || source.boxType === "jump") {
      return { hitStop: 0.04, shake: 3.5, sparkCount: 10, sparkSize: 10, burstSize: 22, speed: 260, life: 0.22, color: "#fff8d9" };
    }
    return { hitStop: 0.018, shake: 0, sparkCount: 6, sparkSize: 7, burstSize: 15, speed: 195, life: 0.16, color: "#fff8d9" };
  }

  function applyImpactFeedback(source, x, y, blocked = false) {
    const profile = getImpactProfile(source, blocked);
    state.hitPause = Math.max(state.hitPause, profile.hitStop);
    state.cameraShake = Math.max(state.cameraShake, profile.shake);
    spawnHitSpark(x, y, profile, blocked);
  }

  function registerComboHit(attacker, defender) {
    const combo = state.combo;
    if (combo.owner !== attacker.kind || combo.target !== defender.kind) {
      combo.owner = attacker.kind;
      combo.target = defender.kind;
      combo.hits = 0;
    }
    combo.hits += 1;
    combo.displayHits = combo.hits;
    combo.timer = COMBO_DROP_WINDOW;
    combo.displayTimer = COMBO_DISPLAY_TIME;
  }

  function updateCombo(dt) {
    const combo = state.combo;
    if (combo.displayTimer > 0) combo.displayTimer = Math.max(0, combo.displayTimer - dt);
    if (!combo.owner) return;
    combo.timer = Math.max(0, combo.timer - dt);
    const target = combo.target === "enemy" ? state.enemy : state.player;
    if (!target || target.dead) return;
    const airborneJuggleWindow = !target.grounded && combo.timer > 0 && target.hitstun <= 0 && target.recoveryTimer <= 0;
    const targetIsCaptive = target.hitstun > 0 || target.knockdownTimer > 0 || airborneJuggleWindow;
    const recoveredNeutral = target.grounded && !target.action && target.hitstun <= 0 && target.blockstun <= 0 && target.knockdownTimer <= 0 && target.recoveryTimer <= 0 && target.landingTimer <= 0;
    const recoveryStarted = target.recoveryTimer > 0 || target.landingTimer > 0;
    if (target.blockstun > 0 || recoveryStarted || recoveredNeutral || (combo.timer <= 0 && !targetIsCaptive)) resetCombo();
  }

  function resetCombo(hard = false) {
    state.combo.owner = null;
    state.combo.target = null;
    state.combo.hits = 0;
    state.combo.timer = 0;
    if (hard) {
      state.combo.displayHits = 0;
      state.combo.displayTimer = 0;
    }
  }

  function tryHit(attacker, defender, moveData) {
    if (!defender || defender.dead) return false;
    const hitbox = getHitbox(attacker, moveData);
    const hurtbox = getHurtbox(defender);
    if (!intersects(hitbox, hurtbox)) return false;

    attacker.hasHit = true;
    attacker.cancelUnlocked = true;
    const blocked = isBlockingHit(attacker, defender);
    const damageScale = blocked ? 1 : getComboDamageScale(attacker);
    const hitstunScale = blocked ? 1 : getComboHitstunScale(attacker);
    const knockbackScale = blocked ? 1 : getComboKnockbackScale(attacker);
    const damage = blocked ? 0 : Math.max(COMBO_MIN_DAMAGE, Math.ceil(moveData.damage * damageScale));
    defender.hp = Math.max(0, defender.hp - damage);
    defender.blockstun = blocked ? moveData.blockstun : 0;
    defender.hitstun = blocked ? 0 : moveData.hitstun * hitstunScale;
    defender.action = null;
    defender.activeMove = null;
    defender.hasHit = false;
    defender.spawnedProjectile = false;
    defender.cancelUnlocked = false;
    setNyxReactionAnim(defender, moveData, blocked);

    const dir = attacker.facing;
    if (moveData.flags.pull) {
      defender.vx = -dir * Math.min(Math.abs(moveData.knockbackX), defender.kind === "enemy" ? 90 : Math.abs(moveData.knockbackX));
    } else {
      const scaledKnockbackX = Math.abs(moveData.knockbackX) * knockbackScale;
      const cappedKnockback = !defender.grounded && !blocked ? Math.min(scaledKnockbackX, MAX_AIR_KNOCKBACK_X) : scaledKnockbackX;
      const airScale = !defender.grounded && !blocked ? 0.72 : 1;
      defender.vx = dir * (blocked ? cappedKnockback * 0.3 : cappedKnockback * airScale);
    }
    const knockbackY = !defender.grounded && !blocked && moveData.knockbackY > 0 ? Math.min(moveData.knockbackY, MAX_AIR_SPIKE_VELOCITY) : moveData.knockbackY;
    defender.vy = Math.min(defender.vy, blocked ? 0 : knockbackY);
    if (!blocked && (moveData.flags.launcher || moveData.knockbackY < -260)) {
      defender.grounded = false;
    }
    enforceHitSeparation(attacker, defender, moveData, blocked);
    if (!blocked) {
      if (moveData.flags.hardKnockdown) defender.pendingKnockdown = Math.max(defender.pendingKnockdown, HARD_KNOCKDOWN);
      if (moveData.flags.softKnockdown) defender.pendingKnockdown = Math.max(defender.pendingKnockdown, SOFT_KNOCKDOWN);
      defender.recoveryTimer = 0;
      defender.landingTimer = 0;
      registerComboHit(attacker, defender);
    } else {
      resetCombo();
    }

    if (shouldGainMeter(attacker) && !moveData.flags.ultimate) {
      growFighterMeter(attacker, moveData.flags.meter || Math.ceil(moveData.damage / 12));
    }

    applyImpactFeedback(moveData, hitbox.x + hitbox.w * 0.65, hitbox.y + hitbox.h * 0.45, blocked);

    if (defender.hp <= 0) {
      defender.dead = true;
      defender.hitstun = 999;
      defender.anim = defender.kind === "enemy" ? "enemy_death" : "death";
      flashStatus(defender.kind === "enemy" ? `${defender.profile.shortName} DEFEATED` : `${defender.profile.shortName} DOWN`, 2.4);
    }
    return true;
  }

  function spawnProjectile(owner, moveData) {
    const direction = owner.facing;
    const special = owner.profile.specialMoves?.[owner.activeMove] || {};
    const serisProjectileVfx = owner.profile?.id === "seris" && owner.profile.vfx?.runtimeEnabled
      ? owner.profile.vfx?.mappings?.[owner.activeMove]
      : null;
    const visualOriginX = owner.x + direction * 34;
    const visualOriginY = owner.y - 102;
    state.projectiles.push({
      ownerKind: owner.kind,
      ownerCharacterId: owner.profile?.id || owner.characterId,
      visualOriginX,
      visualOriginY,
      x: owner.x + direction * (special.spawnOffsetX || 112),
      y: owner.y + (special.spawnOffsetY || -86),
      vx: direction * (moveData.flags.projectileSpeed || 520),
      facing: direction,
      w: special.projectileWidth || 92,
      h: special.projectileHeight || 22,
      damage: moveData.damage,
      hitstun: moveData.hitstun,
      blockstun: moveData.blockstun,
      knockbackX: moveData.knockbackX,
      knockbackY: moveData.knockbackY,
      boxType: moveData.boxType,
      flags: { projectileImpact: true },
      life: special.projectileLife || 1.1,
      maxLife: special.projectileLife || 1.1,
      color: owner.profile.projectileColor,
      vfxKey: serisProjectileVfx
    });
    if (owner.profile?.id !== "seris" || owner.profile.vfx?.runtimeEnabled) {
      spawnBurst(owner.x + direction * 72, owner.y - 78, owner.profile.projectileColor, 18);
    }
  }

  function updateProjectiles(dt) {
    for (const projectile of state.projectiles) {
      projectile.life -= dt;
      projectile.x += projectile.vx * dt;
      const defender = projectile.ownerKind === "player" ? state.enemy : state.player;
      if (projectile.hit || !defender || defender.dead) continue;
      const box = getProjectileBox(projectile);
      if (intersects(box, getHurtbox(defender))) {
        applyProjectileHit(projectile, defender, box);
      }
    }

    state.projectiles = state.projectiles.filter((projectile) => {
      return !projectile.hit && projectile.life > 0 && projectile.x > -160 && projectile.x < W + 160;
    });
  }

  function applyProjectileHit(projectile, defender, box) {
    projectile.hit = true;
    const attackerIsInFront = (projectile.x > defender.x) === (defender.facing === 1);
    const blocked = defender.blocking && defender.grounded && attackerIsInFront;
    const owner = projectile.ownerKind === "player" ? state.player : state.enemy;
    const damageScale = blocked || !owner ? 1 : getComboDamageScale(owner);
    const hitstunScale = blocked || !owner ? 1 : getComboHitstunScale(owner);
    const knockbackScale = blocked || !owner ? 1 : getComboKnockbackScale(owner);
    const damage = blocked ? 0 : Math.max(COMBO_MIN_DAMAGE, Math.ceil(projectile.damage * damageScale));

    defender.hp = Math.max(0, defender.hp - damage);
    defender.blockstun = blocked ? projectile.blockstun : 0;
    defender.hitstun = blocked ? 0 : projectile.hitstun * hitstunScale;
    defender.action = null;
    defender.activeMove = null;
    defender.hasHit = false;
    defender.spawnedProjectile = false;
    setNyxReactionAnim(defender, projectile, blocked);
    const scaledProjectileKnockbackX = Math.abs(projectile.knockbackX) * knockbackScale;
    const airX = !defender.grounded && !blocked ? Math.min(scaledProjectileKnockbackX, MAX_AIR_KNOCKBACK_X) * 0.65 : scaledProjectileKnockbackX;
    defender.vx = projectile.facing * (blocked ? airX * 0.25 : airX);
    const projectileY = !defender.grounded && !blocked && projectile.knockbackY > 0 ? Math.min(projectile.knockbackY, MAX_AIR_SPIKE_VELOCITY) : projectile.knockbackY;
    defender.vy = Math.min(defender.vy, blocked ? 0 : projectileY);
    defender.anim = getHitReactionAnim(defender, defender.kind === "enemy" ? "enemy_damaged" : "damaged");
    if (owner) enforceHitSeparation(owner, defender, projectile, blocked);
    if (!blocked && owner) registerComboHit(owner, defender);
    if (blocked) resetCombo();
    if (!blocked && owner && shouldGainMeter(owner)) {
      growFighterMeter(owner, Math.ceil(projectile.damage / 12));
    }

    applyImpactFeedback(projectile, box.x + box.w * 0.5, box.y + box.h * 0.5, blocked);

    if (defender.hp <= 0) {
      defender.dead = true;
      defender.hitstun = 999;
      defender.anim = defender.kind === "enemy" ? "enemy_death" : "death";
      flashStatus(defender.kind === "enemy" ? `${defender.profile.shortName} DEFEATED` : `${defender.profile.shortName} DOWN`, 2.4);
    }
  }

  function isMoveActive(f) {
    const m = getMove(f);
    return f.actionTime >= m.startup && f.actionTime <= m.startup + m.active;
  }

  function getHitbox(f, moveData) {
    const base = getHitboxDefinition(f, moveData.boxType);
    const x = f.x + f.facing * base.ox;
    return {
      x: f.facing === 1 ? x : x - base.w,
      y: f.y + base.oy,
      w: base.w,
      h: base.h
    };
  }

  function getHurtbox(f) {
    const crouch = f.crouching || f.anim === "crouch";
    const dead = f.dead;
    const hurtboxes = f.profile?.hurtboxes;
    const box = dead ? hurtboxes?.dead : crouch ? hurtboxes?.crouching : hurtboxes?.standing;
    const w = box?.w || f.profile?.hurtboxWidth || (f.kind === "enemy" ? 74 : 66);
    const h = box?.h || (dead ? 62 : crouch ? 94 : 164);
    return { x: f.x - w / 2, y: f.y - h, w, h };
  }

  function getProjectileBox(projectile) {
    return {
      x: projectile.facing === 1 ? projectile.x : projectile.x - projectile.w,
      y: projectile.y - projectile.h / 2,
      w: projectile.w,
      h: projectile.h
    };
  }

  function intersects(a, b) {
    return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
  }

  function updateParticles(dt) {
    for (const p of state.particles) {
      p.life -= dt;
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.vy += p.gravity * dt;
      p.rot += p.spin * dt;
    }
    state.particles = state.particles.filter((p) => p.life > 0);
    state.cameraShake = Math.max(0, state.cameraShake - CAMERA_SHAKE_DECAY * dt);
  }

  function spawnHitSpark(x, y, profile, blocked = false) {
    spawnBurst(x, y, profile.color, profile.burstSize, profile.life + 0.08, blocked ? "guard" : "burst");
    if (profile.dramatic && !blocked) {
      state.particles.push({
        kind: "shock",
        x,
        y,
        vx: 0,
        vy: 0,
        gravity: 0,
        life: profile.life + 0.05,
        maxLife: profile.life + 0.05,
        size: profile.burstSize * 1.35,
        color: profile.color,
        rot: 0,
        spin: 0
      });
    }
    for (let i = 0; i < profile.sparkCount; i += 1) {
      const spread = blocked ? Math.PI * 0.55 : Math.PI * 1.5;
      const baseAngle = blocked ? Math.PI : 0;
      const angle = baseAngle + (Math.random() - 0.5) * spread;
      const speed = profile.speed * (0.55 + Math.random() * 0.65);
      state.particles.push({
        kind: "spark",
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        gravity: blocked ? 140 : 190,
        life: profile.life,
        maxLife: profile.life,
        size: profile.sparkSize * (0.65 + Math.random() * 0.5),
        color: blocked ? "#7fd6ff" : i % 4 === 0 ? "#e3313f" : profile.color,
        rot: angle,
        spin: (Math.random() - 0.5) * 6
      });
    }
  }

  function spawnBurst(x, y, color, size, life = 0.4, kind = "burst") {
    state.particles.push({
      kind,
      x,
      y,
      vx: 0,
      vy: 0,
      gravity: 0,
      life,
      maxLife: life,
      size,
      color,
      rot: 0,
      spin: 0
    });
  }

  function spawnTrail(x, y) {
    const profile = state.player.profile;
    for (let i = 0; i < 8; i += 1) {
      state.particles.push({
        kind: "smoke",
        x: x - state.player.facing * i * 18,
        y: y + 28 + Math.random() * 18,
        vx: -state.player.facing * (80 + Math.random() * 80),
        vy: -20 - Math.random() * 60,
        gravity: 160,
        life: 0.36,
        maxLife: 0.36,
        size: 14 + Math.random() * 20,
        color: profile.trailColor,
        rot: 0,
        spin: 0
      });
    }
  }

  function spawnLandingDust(f) {
    const color = f.profile?.trailColor || "rgba(190, 150, 130, 0.85)";
    for (let i = 0; i < 7; i += 1) {
      const side = i % 2 === 0 ? -1 : 1;
      state.particles.push({
        kind: "smoke",
        x: f.x + side * (16 + Math.random() * 22),
        y: GROUND_Y - 5 + Math.random() * 8,
        vx: side * (55 + Math.random() * 90),
        vy: -18 - Math.random() * 36,
        gravity: 110,
        life: 0.28,
        maxLife: 0.28,
        size: 10 + Math.random() * 14,
        color,
        rot: 0,
        spin: 0
      });
    }
  }

  function spawnNyxUltimateVisual(f) {
    const startX = clamp(f.x + f.facing * 150, 90, W - 90);
    const endX = clamp(f.x + f.facing * 760, 90, W - 90);
    const y = clamp(f.y - 116, 178, GROUND_Y - 82);
    state.nyxSignatureEffects.push({
      kind: "ultimateSlash",
      startX,
      endX,
      x: startX,
      y,
      facing: f.facing,
      age: 0,
      life: 0.76,
      impactAt: 0.52,
      trailTimer: 0,
      impactSpawned: false
    });
    state.cameraShake = Math.max(state.cameraShake, 16);
    spawnBurst(f.x + f.facing * 54, f.y - 90, "#ff38f4", 36, 0.34, "shock");
    for (let i = 0; i < 10; i += 1) {
      const angle = -f.facing * (0.1 + Math.random() * 0.7) + (Math.random() - 0.5) * 0.4;
      const speed = 220 + Math.random() * 280;
      state.particles.push({
        kind: "spark",
        x: f.x + f.facing * (32 + Math.random() * 54),
        y: f.y - 100 + (Math.random() - 0.5) * 58,
        vx: Math.cos(angle) * speed * f.facing,
        vy: Math.sin(angle) * speed - 40,
        gravity: 90,
        life: 0.24 + Math.random() * 0.12,
        maxLife: 0.36,
        size: 10 + Math.random() * 13,
        color: i % 3 === 0 ? "#ff4df4" : "#9b5cff",
        rot: angle,
        spin: (Math.random() - 0.5) * 5
      });
    }
  }

  function updateNyxSignatureEffects(dt) {
    for (const effect of state.nyxSignatureEffects) {
      effect.age += dt;
      effect.trailTimer -= dt;
      const t = clamp(effect.age / effect.life, 0, 1);
      const travel = 1 - Math.pow(1 - t, 3);
      effect.x = effect.startX + (effect.endX - effect.startX) * travel;

      if (effect.trailTimer <= 0 && t < 0.68) {
        effect.trailTimer = 0.055;
        state.particles.push({
          kind: "spark",
          x: effect.x - effect.facing * (78 + Math.random() * 72),
          y: effect.y + (Math.random() - 0.5) * 46,
          vx: -effect.facing * (110 + Math.random() * 150),
          vy: (Math.random() - 0.5) * 70,
          gravity: 0,
          life: 0.16,
          maxLife: 0.16,
          size: 12 + Math.random() * 14,
          color: Math.random() > 0.45 ? "#ff37f1" : "#6d42ff",
          rot: (Math.random() - 0.5) * 0.36,
          spin: 0
        });
      }

      if (!effect.impactSpawned && t >= effect.impactAt) {
        effect.impactSpawned = true;
        state.cameraShake = Math.max(state.cameraShake, 18);
        spawnBurst(effect.endX, effect.y + 8, "#ff4df4", 56, 0.38, "shock");
        spawnBurst(effect.endX - effect.facing * 28, effect.y - 4, "#b47cff", 34, 0.28);
      }
    }
    state.nyxSignatureEffects = state.nyxSignatureEffects.filter((effect) => effect.age < effect.life);
  }

  function render() {
    ctx.save();
    const shakeX = state.cameraShake ? (Math.random() - 0.5) * state.cameraShake : 0;
    const shakeY = state.cameraShake ? (Math.random() - 0.5) * state.cameraShake : 0;
    ctx.translate(shakeX, shakeY);
    drawBackground();

    if (state.mode === "loading") {
      drawCenteredText("LOADING", H / 2);
    } else {
      drawArena();
      drawNyxSignatureBackdrop();
      drawNyxSignatureEffects();
      drawFighter(state.enemy);
      drawFighter(state.player);
      drawProjectiles();
      drawParticles();
      if (state.debug) drawDebug();
      drawStatusText();
    }

    ctx.restore();
  }

  function drawBackground() {
    const bg = state.mode === "title" || state.mode === "select" ? state.images.title : state.images.stage;
    if (!bg) {
      ctx.fillStyle = "#12070b";
      ctx.fillRect(0, 0, W, H);
      return;
    }
    drawCover(bg, 0, 0, W, H);
  }

  function drawArena() {
    const grd = ctx.createLinearGradient(0, 430, 0, H);
    grd.addColorStop(0, "rgba(0, 0, 0, 0)");
    grd.addColorStop(1, "rgba(0, 0, 0, 0.35)");
    ctx.fillStyle = grd;
    ctx.fillRect(0, 430, W, H - 430);
    ctx.strokeStyle = "rgba(255, 120, 80, 0.25)";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(0, GROUND_Y + 2);
    ctx.lineTo(W, GROUND_Y + 2);
    ctx.stroke();
  }

  function drawFighter(f) {
    if (!f) return;
    const animTable = f.kind === "player" ? f.profile.playerAnimations : f.profile.enemyAnimations;
    const animKey = f.dead ? (f.kind === "player" ? "death" : "enemy_death") : f.anim;
    const entry = animTable[animKey] || animTable.idle || animTable.enemy_idle;
    const image = state.images[entry[0]];
    const meta = sheetMeta[entry[0]];
    if (!image || !meta) {
      if (f.kind === "player") {
        drawKairoPlaceholder(f);
        return;
      }
      drawPlaceholderFighter(f);
      return;
    }

    const row = entry[1];
    const frameCount = Math.min(meta.cols, Math.max(1, meta.frameCounts?.[row] || meta.cols));
    const frame = f.action ? Math.min(frameCount - 1, Math.floor((f.actionTime / Math.max(getMove(f)?.duration || 0.5, 0.1)) * frameCount)) : Math.floor(state.time * 8) % frameCount;
    const fw = image.width / meta.cols;
    const rh = image.height / meta.rows;
    const analyzedRow = state.frameBoxes[entry[0]]?.[row];
    const frameInfo = analyzedRow?.frames[frame];
    let sx;
    let sy;
    let sw;
    let sh;
    let dx;
    let dy;

    if (meta.fixedSourceCells) {
      sx = frame * fw;
      sy = row * rh;
      sw = fw;
      sh = rh;
      dx = -(analyzedRow?.anchorX ?? (Number.isFinite(meta.anchorX) ? meta.anchorX : fw / 2)) * meta.scale;
      dy = f.y - (analyzedRow?.anchorY ?? getSheetBaselineY(meta, rh)) * meta.scale + (meta.groundOffset || 0);
    } else if (analyzedRow && frameInfo) {
      const pad = meta.framePad || 0;
      const x0 = clamp(frameInfo.bounds.x - pad, meta.cropX || 0, fw - 1);
      const y0 = clamp(frameInfo.bounds.y - pad, meta.cropTop || 0, rh - 1);
      const x1 = clamp(frameInfo.bounds.x + frameInfo.bounds.w + pad, x0 + 1, fw - (meta.cropX || 0));
      const y1 = clamp(frameInfo.bounds.y + frameInfo.bounds.h + pad, y0 + 1, rh - (meta.cropBottom || 0));
      sx = frame * fw + x0;
      sy = row * rh + y0;
      sw = x1 - x0;
      sh = y1 - y0;
      dx = -(analyzedRow.anchorX - x0) * meta.scale;
      dy = f.y - (analyzedRow.anchorY - y0) * meta.scale + (meta.groundOffset || 0);
    } else {
      const cropX = meta.cropX || 0;
      const cropTop = meta.cropTop || 0;
      const cropBottom = meta.cropBottom || 0;
      sx = frame * fw + cropX;
      sy = row * rh + cropTop;
      sw = Math.max(1, fw - cropX * 2);
      sh = Math.max(1, rh - cropTop - cropBottom);
      dx = -(sw * meta.scale) / 2;
      dy = f.y - sh * meta.scale + (meta.groundOffset || 0);
    }

    const dw = sw * meta.scale;
    const dh = sh * meta.scale;

    ctx.save();
    ctx.translate(f.x, 0);
    ctx.scale(f.facing, 1);
    ctx.globalAlpha = f.hitstun > 0 && !f.dead ? 0.72 + Math.sin(state.time * 55) * 0.18 : 1;
    ctx.drawImage(image, sx, sy, sw, sh, dx, dy, dw, dh);
    ctx.restore();

    drawSerisChainWhipOverlay(f);
  }

  function drawSerisChainWhipOverlay(f) {
    if (!f || f.profile?.id !== "seris" || f.dead || !f.activeMove) return;
    if (!f.profile.vfx?.runtimeEnabled) return;
    const vfxKey = f.profile.vfx?.mappings?.[f.activeMove];
    const moveData = getMove(f);
    drawSerisChainWhipVfx(f, vfxKey, {
      time: f.actionTime,
      moveKey: f.activeMove,
      moveData,
      progress: getSerisVfxProgress(f, moveData),
      activePulse: getSerisVfxActivePulse(f, moveData)
    });
  }

  function drawSerisChainWhipVfx(f, vfxKey, timing = {}) {
    if (!SERIS_CHAIN_VFX_RUNTIME_ENABLED) return false;
    const image = state.images.serisChainWhipVfx;
    const baseCfg = serisChainWhipVfxRows[vfxKey];
    if (!image || !baseCfg) return false;
    const cfg = {
      ...baseCfg,
      ...(serisMoveVfxOverrides[timing.moveKey] || {})
    };

    const start = cfg.start ?? 0;
    const end = cfg.end ?? 1;
    const duration = Math.max(timing.duration || timing.moveData?.duration || 0.1, 0.1);
    const raw = Number.isFinite(timing.progress)
      ? timing.progress
      : clamp((timing.time || 0) / duration, 0, 1);
    if (raw < start || raw > end) return false;

    const localT = clamp((raw - start) / Math.max(end - start, 0.01), 0, 1);
    const frame = Math.min(cfg.frames - 1, Math.floor(localT * cfg.frames));
    const fw = image.width / 8;
    const fh = image.height / 7;
    const scale = cfg.scale || 1;
    const alpha = (cfg.alpha || 1) * Math.sin(localT * Math.PI) * 1.08;

    ctx.save();
    ctx.translate(f.x, 0);
    ctx.scale(f.facing, 1);
    ctx.globalAlpha = clamp(alpha, 0, cfg.alpha || 1);
    ctx.globalCompositeOperation = "source-over";
    ctx.shadowColor = "rgba(53, 232, 213, 0.55)";
    ctx.shadowBlur = 9;
    if (!cfg.accentOnly) {
      ctx.drawImage(
        image,
        frame * fw,
        cfg.row * fh,
        fw,
        fh,
        cfg.ox || 0,
        f.y + (cfg.oy || -96) - (fh * scale) / 2,
        fw * scale,
        fh * scale
      );
    }
    drawSerisActiveSnap(f, cfg, scale, timing.activePulse || 0);
    ctx.restore();
    return true;
  }

  function getSerisVfxProgress(f, moveData) {
    if (!moveData) return 0;
    const t = f.actionTime;
    const startup = Math.max(moveData.startup, 1 / 60);
    const activeEnd = moveData.startup + moveData.active;
    const recovery = Math.max(moveData.duration - activeEnd, 1 / 60);
    if (t < moveData.startup) {
      return 0.04 + 0.34 * clamp(t / startup, 0, 1);
    }
    if (t <= activeEnd) {
      return 0.38 + 0.34 * clamp((t - moveData.startup) / Math.max(moveData.active, 1 / 60), 0, 1);
    }
    return 0.72 + 0.28 * clamp((t - activeEnd) / recovery, 0, 1);
  }

  function getSerisVfxActivePulse(f, moveData) {
    if (!moveData) return 0;
    const activeCenter = moveData.startup + moveData.active * 0.5;
    const activeHalf = Math.max(moveData.active * 0.55, 1 / 60);
    return clamp(1 - Math.abs(f.actionTime - activeCenter) / activeHalf, 0, 1);
  }

  function drawSerisActiveSnap(f, cfg, scale, pulse) {
    if (pulse <= 0.02) return;
    const x = cfg.snapX ?? 260;
    const y = f.y + (cfg.snapY ?? -96);
    ctx.save();
    ctx.globalCompositeOperation = "lighter";
    ctx.globalAlpha = Math.min(0.44, pulse * 0.48);
    ctx.strokeStyle = "#fff7c7";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(x, y, 5 + pulse * 5, -0.35, Math.PI * 1.25);
    ctx.stroke();
    ctx.strokeStyle = "#35e8d5";
    ctx.lineWidth = 1.7;
    ctx.beginPath();
    ctx.moveTo(x - 7 * scale, y - 4 * scale);
    ctx.lineTo(x + 10 * scale, y + 5 * scale);
    ctx.moveTo(x - 5 * scale, y + 7 * scale);
    ctx.lineTo(x + 8 * scale, y - 7 * scale);
    ctx.stroke();
    ctx.restore();
  }

  function drawPlaceholderFighter(f) {
    const hurt = getHurtbox(f);
    ctx.fillStyle = f.kind === "player" ? "#6b3bd1" : "#c9973d";
    ctx.fillRect(hurt.x, hurt.y, hurt.w, hurt.h);
  }

  function drawKairoPlaceholder(f) {
    const hurt = getHurtbox(f);
    const crouch = f.crouching || f.anim === "crouch";
    const moveData = getMove(f);
    const attackReach = moveData ? Math.min(92, getHitboxDefinition(f, moveData.boxType).w * 0.55) : 0;

    ctx.save();
    ctx.translate(f.x, f.y);
    ctx.scale(f.facing, 1);

    ctx.globalAlpha = f.hitstun > 0 && !f.dead ? 0.78 + Math.sin(state.time * 55) * 0.14 : 1;
    ctx.shadowColor = "rgba(50, 220, 255, 0.65)";
    ctx.shadowBlur = f.activeMove ? 20 : 10;

    ctx.fillStyle = "rgba(12, 76, 92, 0.42)";
    ctx.beginPath();
    ctx.ellipse(0, -4, crouch ? 44 : 34, 10, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = "#190817";
    ctx.lineWidth = 10;
    ctx.lineCap = "round";
    ctx.beginPath();
    ctx.moveTo(-10, crouch ? -72 : -128);
    ctx.lineTo(-25, -92);
    ctx.lineTo(-44, -40);
    ctx.moveTo(12, crouch ? -72 : -126);
    ctx.lineTo(24, -80);
    ctx.lineTo(34, -34);
    ctx.stroke();

    ctx.fillStyle = "#0c0a10";
    ctx.strokeStyle = "#72525f";
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(-28, crouch ? -122 : -166);
    ctx.quadraticCurveTo(-54, -86, -48, -30);
    ctx.lineTo(44, -32);
    ctx.quadraticCurveTo(50, -96, 24, crouch ? -122 : -166);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = "#151016";
    ctx.strokeStyle = "#c9a37d";
    ctx.beginPath();
    ctx.roundRect(-22, crouch ? -120 : -150, 44, crouch ? 66 : 82, 8);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = "#09070b";
    ctx.beginPath();
    ctx.arc(0, crouch ? -142 : -174, 18, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = "#050406";
    ctx.lineWidth = 8;
    ctx.beginPath();
    ctx.moveTo(-5, crouch ? -154 : -190);
    ctx.quadraticCurveTo(-34, -158, -38, -102);
    ctx.moveTo(4, crouch ? -156 : -192);
    ctx.quadraticCurveTo(34, -158, 30, -110);
    ctx.stroke();

    ctx.strokeStyle = "#44dfff";
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(-10, crouch ? -94 : -126);
    ctx.quadraticCurveTo(30 + attackReach, -98, 54 + attackReach, crouch ? -72 : -108);
    ctx.quadraticCurveTo(80 + attackReach, -84, 102 + attackReach, crouch ? -58 : -92);
    ctx.stroke();

    ctx.strokeStyle = "#d6ccd8";
    ctx.lineWidth = 7;
    ctx.beginPath();
    ctx.moveTo(24, crouch ? -94 : -128);
    ctx.lineTo(58 + attackReach, crouch ? -72 : -104);
    ctx.stroke();
    ctx.strokeStyle = "#44dfff";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(60 + attackReach, crouch ? -72 : -104);
    ctx.lineTo(88 + attackReach, crouch ? -64 : -96);
    ctx.stroke();

    if (f.activeMove) {
      ctx.strokeStyle = f.activeMove === "ultimate" ? "#bff8ff" : "#44dfff";
      ctx.lineWidth = f.activeMove === "ultimate" ? 6 : 4;
      ctx.beginPath();
      ctx.arc(36 + attackReach, crouch ? -82 : -116, f.activeMove === "ultimate" ? 78 : 42, -0.85, 0.8);
      ctx.stroke();
    }

    ctx.restore();
  }

  function drawNyxSignatureBackdrop() {
    if (!state.nyxSignatureEffects.length) return;
    const strength = state.nyxSignatureEffects.reduce((best, effect) => {
      const t = clamp(effect.age / effect.life, 0, 1);
      const pulse = Math.sin(t * Math.PI);
      return Math.max(best, pulse);
    }, 0);
    if (strength <= 0) return;

    ctx.save();
    ctx.globalAlpha = 0.16 * strength;
    ctx.fillStyle = "#08000f";
    ctx.fillRect(0, 0, W, H);

    const gradient = ctx.createRadialGradient(W * 0.52, H * 0.42, 90, W * 0.52, H * 0.42, W * 0.72);
    gradient.addColorStop(0, "rgba(101, 26, 150, 0.18)");
    gradient.addColorStop(0.55, "rgba(39, 4, 58, 0.08)");
    gradient.addColorStop(1, "rgba(0, 0, 0, 0)");
    ctx.globalAlpha = 0.62 * strength;
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, W, H);
    ctx.restore();
  }

  function drawNyxSignatureEffects() {
    for (const effect of state.nyxSignatureEffects) {
      const t = clamp(effect.age / effect.life, 0, 1);
      const rise = Math.sin(t * Math.PI);
      const leadAlpha = clamp(t < 0.14 ? t / 0.14 : (1 - t) / 0.22, 0, 1);
      const slashAlpha = Math.max(0.14, leadAlpha) * (0.50 + rise * 0.22);

      ctx.save();
      ctx.globalCompositeOperation = "lighter";
      ctx.translate(effect.x, effect.y);
      ctx.scale(effect.facing, 1);
      ctx.rotate(-0.04);

      const wave = state.images.nyxPhantomSlash;
      if (wave) {
        const frameCount = 8;
        const sourceW = wave.width / frameCount;
        const sourceH = wave.height;
        const sourceFrame = Math.min(frameCount - 1, Math.floor(t * frameCount));
        const w = 640 + rise * 120;
        const h = 204 + rise * 56;
        ctx.globalAlpha = slashAlpha;
        ctx.shadowColor = "#ff35ef";
        ctx.shadowBlur = 22;
        ctx.drawImage(wave, sourceFrame * sourceW, 0, sourceW, sourceH, -w * 0.5, -h * 0.5, w, h);
      }

      ctx.restore();
    }
  }

  function drawProjectiles() {
    for (const projectile of state.projectiles) {
      if (projectile.ownerCharacterId === "seris" && !SERIS_CHAIN_VFX_RUNTIME_ENABLED) continue;
      if (drawSerisProjectileVfx(projectile)) continue;

      const box = getProjectileBox(projectile);
      ctx.save();
      ctx.translate(box.x + box.w / 2, box.y + box.h / 2);
      ctx.scale(projectile.facing, 1);
      ctx.shadowColor = projectile.color;
      ctx.shadowBlur = 22;
      ctx.fillStyle = projectile.color;
      ctx.beginPath();
      ctx.moveTo(-box.w / 2, 0);
      ctx.lineTo(box.w / 2 - 18, -box.h / 2);
      ctx.lineTo(box.w / 2, 0);
      ctx.lineTo(box.w / 2 - 18, box.h / 2);
      ctx.closePath();
      ctx.fill();
      ctx.globalAlpha = 0.36;
      ctx.fillStyle = "#fff5f5";
      ctx.fillRect(-box.w / 2, -3, box.w * 0.78, 6);
      ctx.restore();
    }
  }

  function drawSerisProjectileVfx(projectile) {
    if (!SERIS_CHAIN_VFX_RUNTIME_ENABLED) return false;
    if (projectile.ownerCharacterId !== "seris" || !projectile.vfxKey) return false;
    const box = getProjectileBox(projectile);
    const owner = projectile.ownerKind === "player" ? state.player : state.enemy;
    const originX = owner && owner.profile?.id === "seris"
      ? owner.x + projectile.facing * 34
      : projectile.visualOriginX;
    const originY = owner && owner.profile?.id === "seris"
      ? owner.y - 102
      : projectile.visualOriginY;
    const tipX = projectile.facing === 1 ? box.x + box.w : box.x;
    const tipY = box.y + box.h * 0.5;
    const lifeAlpha = clamp(projectile.life / Math.max(projectile.maxLife || 1, 0.1), 0.1, 1);
    const extendAlpha = clamp(((projectile.maxLife || 1) - projectile.life) / 0.16, 0, 1);
    const alpha = Math.min(0.88, lifeAlpha * extendAlpha);

    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.shadowColor = "rgba(214, 178, 74, 0.65)";
    ctx.shadowBlur = 8;
    drawSerisTether(originX, originY, tipX, tipY, alpha);
    ctx.restore();
    return true;
  }

  function drawSerisTether(x0, y0, x1, y1, alpha) {
    const dx = x1 - x0;
    const dy = y1 - y0;
    const len = Math.max(1, Math.hypot(dx, dy));
    const ux = dx / len;
    const uy = dy / len;
    const nx = -uy;
    const ny = ux;

    ctx.strokeStyle = "rgba(14, 31, 34, 0.84)";
    ctx.lineWidth = 8;
    ctx.lineCap = "round";
    ctx.beginPath();
    ctx.moveTo(x0, y0);
    ctx.quadraticCurveTo((x0 + x1) * 0.5 + nx * 12, (y0 + y1) * 0.5 + ny * 12, x1, y1);
    ctx.stroke();

    ctx.strokeStyle = "rgba(53, 232, 213, 0.86)";
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(x0, y0);
    ctx.quadraticCurveTo((x0 + x1) * 0.5 + nx * 12, (y0 + y1) * 0.5 + ny * 12, x1, y1);
    ctx.stroke();

    const links = Math.min(18, Math.max(5, Math.floor(len / 28)));
    for (let i = 1; i < links; i += 1) {
      const t = i / links;
      const bend = Math.sin(t * Math.PI) * 12;
      const x = x0 + dx * t + nx * bend;
      const y = y0 + dy * t + ny * bend;
      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(Math.atan2(dy, dx));
      ctx.strokeStyle = i % 2 === 0 ? "rgba(244, 210, 111, 0.86)" : "rgba(53, 232, 213, 0.78)";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.ellipse(0, 0, 7, 3.2, 0, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
    }

    ctx.globalCompositeOperation = "lighter";
    ctx.globalAlpha = Math.min(0.72, alpha * 0.86);
    ctx.strokeStyle = "#fff6c5";
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(x1, y1, 14, 0, Math.PI * 2);
    ctx.stroke();
    ctx.globalCompositeOperation = "source-over";
  }

  function drawParticles() {
    for (const p of state.particles) {
      const alpha = clamp(p.life / p.maxLife, 0, 1);
      ctx.save();
      ctx.globalAlpha = alpha;
      ctx.translate(p.x, p.y);
      ctx.rotate(p.rot);
      if (p.kind === "burst") {
        ctx.strokeStyle = p.color;
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(0, 0, p.size * (1 - alpha + 0.2), 0, Math.PI * 2);
        ctx.stroke();
      } else if (p.kind === "guard") {
        ctx.strokeStyle = p.color;
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(0, 0, p.size * (1 - alpha + 0.3), -0.9, 0.9);
        ctx.stroke();
      } else if (p.kind === "shock") {
        ctx.strokeStyle = p.color;
        ctx.lineWidth = 2;
        ctx.globalAlpha = alpha * 0.55;
        ctx.beginPath();
        ctx.ellipse(0, 0, p.size * (1.05 - alpha * 0.35), p.size * 0.36 * (1.05 - alpha * 0.2), 0, 0, Math.PI * 2);
        ctx.stroke();
      } else if (p.kind === "smoke") {
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.ellipse(0, 0, p.size, p.size * 0.45, 0, 0, Math.PI * 2);
        ctx.fill();
      } else {
        ctx.strokeStyle = p.color;
        ctx.lineWidth = p.kind === "spark" ? 2 : 3;
        ctx.beginPath();
        ctx.moveTo(-p.size * 0.5, 0);
        ctx.lineTo(p.size * 0.72, 0);
        ctx.stroke();
      }
      ctx.restore();
    }
  }

  function drawDebug() {
    const p = state.player;
    const e = state.enemy;
    ctx.save();
    ctx.strokeStyle = "#ffe45c";
    ctx.lineWidth = 3;
    ctx.setLineDash([14, 8]);
    ctx.beginPath();
    ctx.moveTo(0, GROUND_Y);
    ctx.lineTo(W, GROUND_Y);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.fillStyle = "#ffe45c";
    ctx.font = "700 13px Inter, system-ui, sans-serif";
    ctx.fillText("GROUND / CONTACT BASELINE", 18, GROUND_Y - 8);
    ctx.restore();
    drawBox(getHurtbox(p), "rgba(54, 156, 255, 0.28)", "#5ac8ff");
    drawBox(getHurtbox(e), "rgba(54, 156, 255, 0.28)", "#5ac8ff");
    if (p.activeMove && isMoveActive(p)) {
      drawBox(getHitbox(p, getMove(p)), "rgba(255, 45, 85, 0.32)", "#ff3b63");
    }
    if (e.activeMove && isMoveActive(e)) {
      drawBox(getHitbox(e, getMove(e)), "rgba(255, 149, 0, 0.3)", "#ffb15c");
    }
    for (const projectile of state.projectiles) {
      drawBox(getProjectileBox(projectile), "rgba(255, 45, 69, 0.24)", "#ff2d45");
    }
  }

  function drawBox(b, fill, stroke) {
    ctx.fillStyle = fill;
    ctx.strokeStyle = stroke;
    ctx.lineWidth = 2;
    ctx.fillRect(b.x, b.y, b.w, b.h);
    ctx.strokeRect(b.x, b.y, b.w, b.h);
  }

  function drawStatusText() {
    if (!isFightMode()) return;
    if (state.paused) {
      drawCenteredText("PAUSED", H / 2);
    } else if (state.messageTimer > 0) {
      drawCenteredText(roundStatusEl.textContent, 124, 28);
    }
  }

  function drawCenteredText(text, y, size = 46) {
    ctx.save();
    ctx.textAlign = "center";
    ctx.font = `900 ${size}px Inter, system-ui, sans-serif`;
    ctx.lineWidth = 8;
    ctx.strokeStyle = "rgba(0, 0, 0, 0.8)";
    ctx.fillStyle = "#fff4e7";
    ctx.strokeText(text, W / 2, y);
    ctx.fillText(text, W / 2, y);
    ctx.restore();
  }

  function drawCover(img, x, y, w, h) {
    const scale = Math.max(w / img.width, h / img.height);
    const sw = w / scale;
    const sh = h / scale;
    const sx = (img.width - sw) / 2;
    const sy = (img.height - sh) / 2;
    ctx.drawImage(img, sx, sy, sw, sh, x, y, w, h);
  }

  function updateHud() {
    const p = state.player;
    const e = state.enemy;
    if (!p || !e) return;
    playerNameEl.textContent = p.profile.name;
    enemyNameEl.textContent = e.profile.name;
    playerHpEl.style.width = `${(p.hp / p.maxHp) * 100}%`;
    enemyHpEl.style.width = `${(e.hp / e.maxHp) * 100}%`;
    playerMeterEl.style.width = `${(p.meter / METER_MAX) * 100}%`;
    enemyMeterEl.style.width = `${(e.meter / METER_MAX) * 100}%`;
    if (comboCounterEl) {
      const visible = state.combo.displayHits >= 2 && state.combo.displayTimer > 0;
      comboCounterEl.textContent = visible ? `${state.combo.displayHits} Hits` : "";
      comboCounterEl.classList.toggle("visible", visible);
    }
  }

  function flashStatus(text, seconds) {
    roundStatusEl.textContent = text;
    state.messageTimer = seconds;
    window.setTimeout(() => {
      if (isFightMode() && !state.enemy.dead) {
        roundStatusEl.textContent = getRoundStatus();
      }
    }, seconds * 1000);
  }

  function chooseAttack(button, fighter = state.player, controls = P1_CONTROLS) {
    const p = fighter;
    if (p.kind === "enemy") return chooseEnemyControlledAttack(button, p, controls);
    if (!p.grounded) return `jump_${button}`;
    if (state.keys.has(controls.down)) return `down_${button}`;

    const forward = p.facing === 1 ? controls.right : controls.left;
    const back = p.facing === 1 ? controls.left : controls.right;
    if (state.keys.has(forward)) return `forward_${button}`;
    if (state.keys.has(back)) return `back_${button}`;
    return `neutral_${button}`;
  }

  function chooseEnemyControlledAttack(button, fighter, controls) {
    if (button === "light") return "enemy_light_attack";
    if (button === "medium") return "enemy_medium_attack";
    if (button === "heavy") {
      const forward = fighter.facing === 1 ? controls.right : controls.left;
      return state.keys.has(forward) ? "enemy_forward_heavy" : "enemy_heavy_attack";
    }
    return "enemy_light_attack";
  }

  function chooseLightAttack(fighter = state.player, controls = P1_CONTROLS) {
    const p = fighter;
    if (!p) return "neutral_light";
    if (p.kind === "enemy") return "enemy_light_attack";
    const autoCombos = getComboRoutes(p).autoCombos;
    if (p.action && autoCombos[p.activeMove]) return autoCombos[p.activeMove];
    if (p.grounded && !isHoldingDirectionalModifier(p, controls)) return "neutral_light";
    return chooseAttack("light", p, controls);
  }

  function isHoldingDirectionalModifier(p, controls = P1_CONTROLS) {
    const forward = p.facing === 1 ? controls.right : controls.left;
    const back = p.facing === 1 ? controls.left : controls.right;
    return state.keys.has(controls.down) || state.keys.has(forward) || state.keys.has(back);
  }

  function handleKeyDown(e) {
    if (["Space", "ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"].includes(e.code)) e.preventDefault();
    if (e.repeat) {
      state.keys.add(e.code);
      return;
    }

    state.keys.add(e.code);

    if (state.mode === "title" && e.code === "Enter") {
      showCharacterSelect();
      return;
    }
    if (state.mode === "select") {
      handleCharacterSelectKey(e);
      return;
    }
    if (e.code === "KeyR" && isFightMode()) resetRound();
    if (e.code === "KeyH") state.debug = !state.debug;
    if (e.code === "KeyP" && isFightMode()) {
      state.paused = !state.paused;
      flashStatus(state.paused ? "PAUSED" : getRoundStatus(), 0.8);
    }
    if (!isFightMode() || state.paused) return;

    if (state.mode === "training" && e.code === "KeyN") {
      state.enemyAI = !state.enemyAI;
      flashStatus(getTrainingStatus(), 0.9);
    }
    if (e.code === P1_CONTROLS.up) jump(state.player);
    if (P1_CONTROLS.dash.includes(e.code)) {
      if (state.keys.has(P1_CONTROLS.modifier)) startSuperDash(state.player);
      else startDash(state.player, P1_CONTROLS);
    }
    if (e.code === P1_CONTROLS.taunt) startMove("taunt", state.player);

    if ((e.code === P1_CONTROLS.ultimateA && state.keys.has(P1_CONTROLS.ultimateB)) || (e.code === P1_CONTROLS.ultimateB && state.keys.has(P1_CONTROLS.ultimateA))) {
      startMove("ultimate", state.player);
      return;
    }

    if (e.code === P1_CONTROLS.light) startMove(state.keys.has(P1_CONTROLS.modifier) ? "special_1" : chooseLightAttack(state.player, P1_CONTROLS), state.player);
    if (e.code === P1_CONTROLS.medium) startMove(state.keys.has(P1_CONTROLS.modifier) ? "special_2" : chooseAttack("medium", state.player, P1_CONTROLS), state.player);
    if (e.code === P1_CONTROLS.heavy) startMove(state.keys.has(P1_CONTROLS.modifier) ? "special_3" : chooseAttack("heavy", state.player, P1_CONTROLS), state.player);

    if (state.mode === "versus") {
      if (e.code === P2_CONTROLS.up) jump(state.enemy);
      if (e.code === P2_CONTROLS.light) startMove(chooseLightAttack(state.enemy, P2_CONTROLS), state.enemy);
      if (e.code === P2_CONTROLS.medium) startMove(chooseAttack("medium", state.enemy, P2_CONTROLS), state.enemy);
      if (e.code === P2_CONTROLS.heavy) startMove(chooseAttack("heavy", state.enemy, P2_CONTROLS), state.enemy);
      if (e.code === P2_CONTROLS.special1) startMove("enemy_special_1", state.enemy);
      if (e.code === P2_CONTROLS.special2) startMove("enemy_special_2", state.enemy);
      if (e.code === P2_CONTROLS.special3) startMove("enemy_special_3", state.enemy);
      if (e.code === P2_CONTROLS.ultimate) startMove("enemy_ultimate", state.enemy);
    }
  }

  function handleKeyUp(e) {
    state.keys.delete(e.code);
  }

  function clamp(v, min, max) {
    return Math.max(min, Math.min(max, v));
  }

  window.addEventListener("keydown", handleKeyDown);
  window.addEventListener("keyup", handleKeyUp);
  startButton.addEventListener("click", showCharacterSelect);
  selectVersusButton.addEventListener("click", () => setCharacterSelectMode("versus"));
  selectTrainingButton.addEventListener("click", () => setCharacterSelectMode("training"));
  document.addEventListener("keydown", (e) => {
    if (state.mode === "select") {
      handleCharacterSelectKey(e);
    }
  }, true);
  characterButtons.forEach((button) => {
    button.addEventListener("focus", () => updateCharacterSelectFocus(button.dataset.character));
    button.addEventListener("click", () => {
      updateCharacterSelectFocus(button.dataset.character);
      confirmCharacterSelect();
    });
  });
  if (SERIS_HIDDEN_TEST_ENABLED) {
    window.__serisRevampTest = {
      state,
      assetPaths,
      selectableCharacterIds: [...selectableCharacterIds],
      hiddenTestCharacterIds: [...hiddenTestCharacterIds],
      chainVfxEnabled: SERIS_CHAIN_VFX_RUNTIME_ENABLED,
      start: () => startTraining("seris"),
      reset: resetRound,
      setPlayerAnim(anim, options = {}) {
        if (state.mode !== "training" || state.player?.profile?.id !== "seris") startTraining("seris");
        const f = state.player;
        f.anim = anim;
        f.action = null;
        f.activeMove = null;
        f.actionTime = 0;
        f.hitstun = options.hitstun || 0;
        f.blockstun = options.blockstun || 0;
        f.knockdownTimer = options.knockdownTimer || 0;
        f.recoveryTimer = 0;
        f.landingTimer = 0;
        f.dead = Boolean(options.dead);
        f.grounded = options.grounded ?? true;
        f.facing = options.facing || 1;
        f.y = options.y || (f.grounded ? GROUND_Y : GROUND_Y - 130);
        f.vx = 0;
        f.vy = 0;
        return f.anim;
      },
      startMove(move, options = {}) {
        if (state.mode !== "training" || state.player?.profile?.id !== "seris") startTraining("seris");
        const f = state.player;
        f.meter = METER_MAX;
        f.grounded = options.grounded ?? f.grounded;
        f.y = options.y || (f.grounded ? GROUND_Y : GROUND_Y - 130);
        f.hitstun = 0;
        f.blockstun = 0;
        f.knockdownTimer = 0;
        f.recoveryTimer = 0;
        f.landingTimer = 0;
        f.action = null;
        f.activeMove = null;
        startMove(move);
        return { move: f.activeMove, anim: f.anim };
      },
      loadedSerisAssets() {
        return Object.fromEntries(
          Object.entries(assetPaths)
            .filter(([key]) => key.startsWith("seris"))
            .map(([key]) => [key, Boolean(state.images[key])])
        );
      }
    };
  }
  window.setInterval(() => {
    if (!isFightMode() || state.paused || !state.player || state.player.dead) return;
    growPassiveMeter(0.25);
    updateHud();
  }, 250);
  boot();
})();
