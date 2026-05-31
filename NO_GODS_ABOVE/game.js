(() => {
  "use strict";

  const canvas = document.getElementById("game");
  const ctx = canvas.getContext("2d");
  const startButton = document.getElementById("start-button");
  const titleScreen = document.getElementById("title-screen");
  const characterSelect = document.getElementById("character-select");
  const characterButtons = document.querySelectorAll("[data-character]");
  const hud = document.getElementById("hud");
  const playerNameEl = document.getElementById("player-name");
  const enemyNameEl = document.getElementById("enemy-name");
  const playerHpEl = document.getElementById("player-hp");
  const enemyHpEl = document.getElementById("enemy-hp");
  const playerMeterEl = document.getElementById("player-meter");
  const roundStatusEl = document.getElementById("round-status");
  const comboCounterEl = document.getElementById("combo-counter");

  const W = canvas.width;
  const H = canvas.height;
  const GROUND_Y = 590;
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
  const SOFT_KNOCKDOWN = 34 / 60;
  const HARD_KNOCKDOWN = 76 / 60;
  const GROUND_PUSH_SEPARATION = 116;
  const GROUND_HIT_SEPARATION = 108;
  const AIR_HIT_SEPARATION = 82;
  const AIR_HIT_MAX_SEPARATION = 128;
  const COMBO_DROP_WINDOW = 0.75;
  const COMBO_DISPLAY_TIME = 1.15;
  const COMBO_SCALE_STEP = 0.05;
  const COMBO_MIN_SCALE = 0.2;
  const HITSTUN_DECAY_STEP = 0.035;
  const HITSTUN_MIN_SCALE = 0.58;
  const LAUNCHER_HITSTUN_MIN_SCALE = 0.7;
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
    vantaFinalEnd: { cols: 6, rows: 5, baselineRatio: 0.94, scale: 1.38, framePad: 2, anchorMode: "lockedFrameBottomCenter" }
  };

  const characterProfiles = {
    kairo: {
      id: "kairo",
      name: "KAIRO FINAL",
      shortName: "KAIRO",
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
    }
  };

  for (const profile of Object.values(characterProfiles)) {
    profile.playerAnimations = (profile.buildPlayerAnimations || buildPlayerAnimations)(profile.sheets);
    profile.enemyAnimations = (profile.buildEnemyAnimations || buildEnemyAnimations)(profile.sheets);
  }

  const moves = {
    neutral_light: move(32, 3, 7, 5, 20, 10, -20, "light", { autoCombo: true, cancelOnHit: ["neutral_medium"], dashCancel: true, stepForward: 100 }),
    neutral_medium: move(58, 5, 7, 9, 31, 22, -80, "medium", { cancelOnHit: ["neutral_heavy", "special_1", "special_2", "special_3"], jumpCancel: true, dashCancel: true, stepForward: 120 }),
    neutral_heavy: move(88, 9, 5, 17, 50, 74, -535, "heavy", { launcher: true, jumpCancel: true, dashCancel: true, softKnockdown: true }),
    forward_light: move(38, 4, 4, 8, 22, 44, -18, "light", { cancelOnHit: ["forward_medium", "neutral_medium"], dashCancel: true }),
    forward_medium: move(66, 6, 4, 11, 32, 78, -68, "medium", { cancelOnHit: ["forward_heavy", "special_1", "special_2"], jumpCancel: true, dashCancel: true }),
    forward_heavy: move(104, 10, 5, 18, 47, 104, -430, "heavy", { launcher: true, jumpCancel: true, dashCancel: true, softKnockdown: true }),
    back_light: move(34, 4, 4, 8, 21, 38, -18, "light", { cancelOnHit: ["back_medium", "neutral_medium"], dashCancel: true }),
    back_medium: move(62, 6, 4, 11, 31, 66, -72, "medium", { cancelOnHit: ["back_heavy", "special_2"], jumpCancel: true, dashCancel: true }),
    back_heavy: move(92, 9, 5, 18, 50, 60, -545, "heavy", { launcher: true, jumpCancel: true, dashCancel: true, softKnockdown: true }),
    down_light: move(28, 3, 4, 7, 19, 38, 0, "low", { cancelOnHit: ["down_medium", "neutral_medium"] }),
    down_medium: move(54, 5, 4, 10, 30, 58, -38, "low", { cancelOnHit: ["down_heavy"], jumpCancel: true, dashCancel: true }),
    down_heavy: move(78, 8, 5, 18, 50, 64, -565, "low", { launcher: true, jumpCancel: true, dashCancel: true, softKnockdown: true }),
    jump_light: move(30, 3, 5, 4, 24, 32, -16, "jump", { air: true, cancelOnHit: ["jump_medium"], dashCancel: true }),
    jump_medium: move(56, 5, 6, 8, 34, 48, -32, "jump", { air: true, cancelOnHit: ["jump_heavy", "special_1"], dashCancel: true }),
    jump_heavy: move(82, 7, 6, 13, 42, 56, 220, "jump", { air: true, softKnockdown: true, dashCancel: true }),
    special_1: move(102, 7, 7, 15, 36, 118, -150, "chain", { dash: true, dashCancel: true, softKnockdown: true, meter: 16 }),
    special_2: move(78, 8, 10, 14, 34, 125, -70, "medium", { projectile: true, projectileSpeed: 700, noHit: true, meter: 14 }),
    special_3: move(116, 7, 7, 22, 50, 76, -555, "heavy", { rise: true, launcher: true, hardKnockdown: true, meter: 18 }),
    super_dash: move(68, 2, 24, 8, 34, 120, -260, "chain", { superDash: true, dashCancel: true, anim: "dash", blockstun: 22, meter: 10 }),
    ultimate: move(260, 10, 20, 32, 56, 330, -260, "ultimate", { ultimate: true, hardKnockdown: true }),
    taunt: move(0, 0, 0, 32, 0, 0, 0, "light", { noHit: true }),
    enemy_light_attack: move(34, 5, 4, 10, 22, 58, -15, "light", { enemy: true, cancelOnHit: ["enemy_medium_attack"] }),
    enemy_medium_attack: move(58, 7, 4, 13, 30, 90, -65, "medium", { enemy: true, cancelOnHit: ["enemy_heavy_attack"] }),
    enemy_heavy_attack: move(82, 10, 5, 19, 44, 110, -410, "heavy", { enemy: true, launcher: true, softKnockdown: true }),
    enemy_forward_heavy: move(96, 11, 5, 20, 44, 132, -365, "heavy", { enemy: true, launcher: true, softKnockdown: true }),
    enemy_special_1: move(96, 7, 7, 17, 36, 165, -130, "chain", { enemy: true, dash: true, softKnockdown: true }),
    enemy_special_2: move(66, 10, 8, 20, 30, 135, -40, "medium", { enemy: true, projectile: true, projectileSpeed: 620, noHit: true }),
    enemy_special_3: move(108, 8, 7, 23, 48, 96, -500, "heavy", { enemy: true, rise: true, launcher: true, hardKnockdown: true }),
    enemy_ultimate: move(220, 13, 18, 34, 52, 280, -180, "ultimate", { enemy: true, ultimate: true, hardKnockdown: true })
  };

  const autoCombos = {
    neutral_light: "neutral_medium",
    neutral_medium: "neutral_heavy"
  };

  const airComboRoutes = {
    jump_light: "jump_medium",
    jump_medium: "jump_heavy"
  };

  const boxDefaults = {
    light: { w: 86, h: 58, ox: 42, oy: -76 },
    medium: { w: 112, h: 64, ox: 50, oy: -82 },
    heavy: { w: 142, h: 88, ox: 58, oy: -96 },
    low: { w: 104, h: 42, ox: 42, oy: -42 },
    jump: { w: 106, h: 70, ox: 42, oy: -88 },
    chain: { w: 185, h: 58, ox: 58, oy: -84 },
    ultimate: { w: 320, h: 150, ox: 90, oy: -115 }
  };

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
    player: null,
    enemy: null,
    selectedPlayerId: "kairo",
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

  function getCharacterProfile(characterId) {
    return characterProfiles[characterId] || characterProfiles.kairo;
  }

  function getOpponentId(characterId) {
    return characterId === "vanta" ? "kairo" : "vanta";
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
      hp: kind === "player" ? PLAYER_MAX_HP : ENEMY_MAX_HP,
      maxHp: kind === "player" ? PLAYER_MAX_HP : ENEMY_MAX_HP,
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
      spawnedProjectile: false,
      cancelUnlocked: false,
      bufferedMove: null,
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
    requestAnimationFrame(loop);
  }

  async function loadAssets() {
    const entries = Object.entries(assetPaths);
    await Promise.all(entries.map(async ([key, path]) => {
      const chroma = !["stage", "title"].includes(key);
      const image = await loadImage(path);
      if (!image) {
        state.images[key] = null;
        return;
      }
      const keyed = chroma ? chromaKey(image) : image;
      state.images[key] = sheetMeta[key] ? sanitizeSpriteSheet(keyed, sheetMeta[key]) : keyed;
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
        anchorX: meta.allowDetachedEffects
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
    const playerId = state.selectedPlayerId;
    const enemyId = getOpponentId(playerId);
    state.player = makeFighter("player", 330, 1, playerId);
    state.enemy = makeFighter("enemy", 720, -1, enemyId);
    state.particles = [];
    state.projectiles = [];
    state.hitPause = 0;
    state.cameraShake = 0;
    state.messageTimer = 1.5;
    resetCombo(true);
    roundStatusEl.textContent = getTrainingStatus();
    updateHud();
  }

  function getTrainingStatus() {
    const enemyName = state.enemy?.profile.shortName || "RIVAL";
    return state.enemyAI ? `${enemyName} AI ON` : `${enemyName} DUMMY`;
  }

  function showCharacterSelect() {
    titleScreen.classList.add("hidden");
    characterSelect.classList.remove("hidden");
    state.mode = "select";
    updateCharacterSelectFocus(state.selectedPlayerId);
    const selectedButton = characterSelect.querySelector(`[data-character="${state.selectedPlayerId}"]`);
    selectedButton?.focus({ preventScroll: true });
  }

  function startTraining(characterId = state.selectedPlayerId) {
    state.selectedPlayerId = characterProfiles[characterId] ? characterId : "kairo";
    titleScreen.classList.add("hidden");
    characterSelect.classList.add("hidden");
    hud.classList.remove("hidden");
    state.mode = "training";
    state.paused = false;
    resetRound();
  }

  function updateCharacterSelectFocus(characterId) {
    state.selectedPlayerId = characterProfiles[characterId] ? characterId : "kairo";
    characterButtons.forEach((button) => {
      const selected = button.dataset.character === state.selectedPlayerId;
      button.classList.toggle("selected", selected);
      button.setAttribute("aria-pressed", selected ? "true" : "false");
    });
  }

  function handleCharacterSelectKey(e) {
    const handled = ["KeyA", "ArrowLeft", "Digit1", "Numpad1", "KeyD", "ArrowRight", "Digit2", "Numpad2", "Enter", "Escape"].includes(e.code);
    if (!handled) return false;

    e.preventDefault();
    e.stopPropagation();

    if (["KeyA", "ArrowLeft", "Digit1", "Numpad1"].includes(e.code)) updateCharacterSelectFocus("kairo");
    if (["KeyD", "ArrowRight", "Digit2", "Numpad2"].includes(e.code)) updateCharacterSelectFocus("vanta");
    if (e.code === "Enter") startTraining(state.selectedPlayerId);
    if (e.code === "Escape") {
      characterSelect.classList.add("hidden");
      titleScreen.classList.remove("hidden");
      state.mode = "title";
      startButton.focus({ preventScroll: true });
    }

    const selectedButton = characterSelect.querySelector(`[data-character="${state.selectedPlayerId}"]`);
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

    if (state.mode !== "training" || state.paused) {
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
      p.anim = "block";
      p.vx *= 0.32;
      if (Math.abs(p.vx) < 8) p.vx = 0;
      integrate(p, dt);
      return;
    }

    if (p.hitstun > 0) {
      p.hitstun = Math.max(0, p.hitstun - dt);
      p.anim = p.grounded ? "damaged" : "knockback";
      p.vx *= 0.42;
      if (Math.abs(p.vx) < 8) p.vx = 0;
      integrate(p, dt);
      if (p.hitstun <= 0 && !p.grounded) p.recoveryTimer = Math.max(p.recoveryTimer, AIR_RECOVERY_DURATION);
      return;
    }

    if (p.knockdownTimer > 0) {
      p.knockdownTimer = Math.max(0, p.knockdownTimer - dt);
      p.anim = p.knockdownTimer > 0.16 ? "knockback" : "get_up";
      p.vx *= 0.22;
      integrate(p, dt);
      return;
    }

    if (p.recoveryTimer > 0) {
      p.recoveryTimer = Math.max(0, p.recoveryTimer - dt);
      p.anim = p.grounded ? "get_up" : "knockback";
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

    if (p.airDashTimer > 0) {
      p.airDashTimer = Math.max(0, p.airDashTimer - dt);
      p.vx = p.dashDirection * AIR_DASH_SPEED;
      p.vy = 0;
      p.anim = "dash";
    } else if (p.dashTimer > 0) {
      p.dashTimer = Math.max(0, p.dashTimer - dt);
      p.vx = p.dashDirection * DASH_SPEED;
      p.anim = "dash";
    } else if (p.action) {
      updateAction(p, dt);
    } else {
      readMovement(p, dt);
    }

    integrate(p, dt);
  }

  function readMovement(p) {
    const forward = p.facing === 1 ? "KeyD" : "KeyA";
    const back = p.facing === 1 ? "KeyA" : "KeyD";
    const holdingForward = state.keys.has(forward);
    const holdingBack = state.keys.has(back);
    const holdingDown = state.keys.has("KeyS");

    p.vx = 0;

    if (holdingDown && p.grounded) {
      p.crouching = true;
      p.anim = "crouch";
      return;
    }

    if (holdingBack && p.grounded) {
      p.blocking = true;
      p.vx = -p.facing * WALK_BACK;
      p.anim = "block";
      return;
    }

    if (holdingForward) {
      p.vx = p.facing * WALK_FORWARD;
      p.anim = "walk_forward";
      return;
    }

    if (holdingBack) {
      p.vx = -p.facing * WALK_BACK;
      p.anim = "walk_back";
      return;
    }

    p.anim = p.grounded ? "idle" : "jump_light";
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
    tickFighterTimers(e, dt);
    if (e.dead) {
      e.anim = "enemy_death";
      e.vx = 0;
    } else if (e.blockstun > 0) {
      e.blockstun = Math.max(0, e.blockstun - dt);
      e.anim = "enemy_block";
      e.vx *= 0.32;
    } else if (e.action) {
      updateAction(e, dt);
    } else if (e.hitstun > 0) {
      e.hitstun = Math.max(0, e.hitstun - dt);
      e.anim = e.grounded ? "enemy_damaged" : "enemy_knockback";
      e.vx *= 0.36;
      if (Math.abs(e.vx) < 8) e.vx = 0;
      if (e.hitstun <= 0 && !e.grounded) e.recoveryTimer = Math.max(e.recoveryTimer, AIR_RECOVERY_DURATION);
    } else if (e.knockdownTimer > 0) {
      e.knockdownTimer = Math.max(0, e.knockdownTimer - dt);
      e.anim = e.knockdownTimer > 0.16 ? "enemy_knockback" : "enemy_get_up";
      e.vx *= 0.22;
    } else if (e.recoveryTimer > 0) {
      e.recoveryTimer = Math.max(0, e.recoveryTimer - dt);
      e.anim = e.grounded ? "enemy_get_up" : "enemy_knockback";
      e.vx *= e.grounded ? 0.34 : 0.88;
    } else if (e.landingTimer > 0) {
      e.landingTimer = Math.max(0, e.landingTimer - dt);
      e.anim = "enemy_stand_up";
      e.vx *= 0.35;
    } else {
      if (state.enemyAI) {
        updateEnemyAI(e, p, dt);
      } else {
        e.vx *= 0.55;
        if (Math.abs(e.vx) < 5) e.vx = 0;
        e.anim = "enemy_idle";
      }
    }
    integrate(e, dt);
  }

  function growPassiveMeter(dt) {
    const p = state.player;
    if (p.dead || p.meter >= METER_MAX) return;
    p.meter = clamp(p.meter + PASSIVE_METER_PER_SECOND * dt, 0, METER_MAX);
  }

  function updateEnemyAI(e, p, dt) {
    const distance = Math.abs(p.x - e.x);
    e.aiCooldown = Math.max(0, e.aiCooldown - dt);
    e.facing = e.x <= p.x ? 1 : -1;

    if (p.dead) {
      e.anim = "enemy_idle";
      e.vx = 0;
      return;
    }

    if (distance > ENEMY_AI_ATTACK_RANGE) {
      e.vx = e.facing * ENEMY_AI_WALK_SPEED;
      e.anim = "enemy_walk_forward";
      return;
    }

    e.vx *= 0.55;
    if (Math.abs(e.vx) < 5) e.vx = 0;
    e.anim = "enemy_idle";

    if (e.aiCooldown <= 0) {
      const attack = chooseEnemyAttack(distance);
      startEnemyMove(attack);
      e.aiCooldown = ENEMY_AI_MIN_COOLDOWN + Math.random() * (ENEMY_AI_MAX_COOLDOWN - ENEMY_AI_MIN_COOLDOWN);
    }
  }

  function chooseEnemyAttack(distance) {
    if (distance > 270) return "enemy_special_2";
    const roll = Math.random();
    if (roll < 0.42) return "enemy_light_attack";
    if (roll < 0.66) return "enemy_medium_attack";
    if (roll < 0.82) return "enemy_heavy_attack";
    if (roll < 0.93) return "enemy_special_1";
    return "enemy_special_3";
  }

  function updateAction(f, dt) {
    const moveData = moves[f.activeMove];
    f.actionTime += dt;
    f.vx *= moveData.flags.dash ? 0.98 : f.grounded ? 0.46 : 0.88;

    if (moveData.flags.superDash) updateSuperDashVelocity(f);
    if (moveData.flags.dash && f.actionTime < 0.18) f.vx = f.facing * 620;
    if (moveData.flags.stepForward && f.actionTime < moveData.startup + moveData.active) f.vx = f.facing * moveData.flags.stepForward;
    if (moveData.flags.rise && f.actionTime < 0.2) f.vy = Math.min(f.vy, -360);
    if (moveData.flags.projectile && !f.spawnedProjectile && f.actionTime >= moveData.startup) {
      spawnProjectile(f, moveData);
      f.spawnedProjectile = true;
    }
    if (!moveData.flags.noHit && isMoveActive(f) && !f.hasHit) {
      tryHit(f, f.kind === "player" ? state.enemy : state.player, moveData);
    }

    if (tryBufferedMove(f)) return;

    if (f.actionTime >= moveData.duration) {
      const buffered = f.bufferedMove;
      f.action = null;
      f.activeMove = null;
      f.hasHit = false;
      f.spawnedProjectile = false;
      f.cancelUnlocked = false;
      if (buffered && f.kind === "player") {
        f.bufferedMove = null;
        beginMove(f, buffered.key);
      }
    }
  }

  function integrate(f, dt) {
    const wasGrounded = f.grounded;
    if (!f.grounded || f.vy < 0) {
      const gravity = !f.grounded && f.hitstun > 0 ? JUGGLE_GRAVITY : !f.grounded && f.recoveryTimer > 0 ? AIR_RECOVERY_GRAVITY : GRAVITY;
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
          f.landingTimer = Math.max(f.landingTimer, LANDING_RECOVERY);
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

  function startMove(key) {
    const p = state.player;
    if (state.mode !== "training" || state.paused || p.dead || p.dashTimer > 0 || p.airDashTimer > 0) return;
    if (key === "ultimate" && p.meter < METER_MAX) {
      flashStatus("METER NEEDED", 0.8);
      return;
    }
    const data = moves[key];
    if (!data) return;
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
    const data = moves[key];
    if (!data || e.dead || e.action || e.hitstun > 0 || e.blockstun > 0 || e.knockdownTimer > 0 || e.recoveryTimer > 0) return;
    beginMove(e, key);
  }

  function beginMove(f, key) {
    const data = moves[key];
    if (!data) return;
    f.action = "attack";
    f.actionTime = 0;
    f.activeMove = key;
    f.hasHit = false;
    f.spawnedProjectile = false;
    f.cancelUnlocked = false;
    f.bufferedMove = null;
    f.anim = getMoveAnimKey(f, key, data);
    if (f.grounded && !data.flags.dash && !data.flags.rise && !data.flags.superDash) {
      f.vx = 0;
    }
    if (data.flags.superDash) {
      f.superDashCooldown = SUPER_DASH_COOLDOWN;
      f.vy = 0;
      spawnBurst(f.x + f.facing * 62, f.y - 82, f.profile.projectileColor, 18);
    }
    if (data.flags.ultimate && f.kind === "player") {
      f.meter = 0;
      state.cameraShake = 12;
      spawnBurst(f.x + f.facing * 150, f.y - 95, "#d66bff", 34);
    }
  }

  function getMoveAnimKey(f, key, data) {
    if (data.flags.anim) return f.kind === "enemy" ? `enemy_${data.flags.anim}` : data.flags.anim;
    return key;
  }

  function canCancelInto(f, nextKey) {
    const current = moves[f.activeMove];
    const next = moves[nextKey];
    if (!current || !next) return false;
    const lateCancel = f.actionTime >= current.cancelTime;
    const basicChainReady = f.actionTime >= current.startup + current.active * 0.34;
    const hitCancelReady = f.actionTime >= current.startup + current.active * 0.38;
    if (autoCombos[f.activeMove] === nextKey && f.grounded && basicChainReady) return true;
    if (airComboRoutes[f.activeMove] === nextKey && !f.grounded && basicChainReady) return true;
    if (!f.cancelUnlocked) return false;
    if (current.flags.superDash && !next.flags.ultimate) return hitCancelReady;
    if (current.flags.cancelOnHit?.includes(nextKey)) return hitCancelReady;
    if (current.flags.dashCancel && next.flags.superDash) return lateCancel || hitCancelReady;
    if (next.flags.projectile && current.flags.cancelOnHit?.includes(nextKey)) return hitCancelReady;
    return false;
  }

  function tryBufferedMove(f) {
    if (f.kind !== "player" || !f.bufferedMove) return false;
    if (!canCancelInto(f, f.bufferedMove.key)) return false;
    const key = f.bufferedMove.key;
    beginMove(f, key);
    return true;
  }

  function updateSuperDashVelocity(f) {
    const target = f.kind === "player" ? state.enemy : state.player;
    if (!target || target.dead) return;
    const dx = target.x - f.x;
    const dy = (target.y - 76) - (f.y - 76);
    const len = Math.max(1, Math.hypot(dx, dy));
    f.vx = (dx / len) * SUPER_DASH_SPEED;
    f.vy = (dy / len) * SUPER_DASH_SPEED;
    f.facing = dx >= 0 ? 1 : -1;
  }

  function startDash() {
    const p = state.player;
    if (state.mode !== "training" || p.dead || p.blockstun > 0 || p.hitstun > 0 || p.knockdownTimer > 0 || p.recoveryTimer > 0) return;
    if (p.action) {
      if (!canDashCancel(p)) return;
      clearAction(p);
    }
    const direction = getDashDirection(p);
    if (!p.grounded) {
      if (p.airDashUsed || p.airDashCooldown > 0) return;
      p.airDashTimer = AIR_DASH_DURATION;
      p.airDashCooldown = AIR_DASH_COOLDOWN;
      p.airDashUsed = true;
      p.dashDirection = direction;
      p.vy = 0;
    } else {
      if (p.dashCooldown > 0) return;
      p.dashTimer = DASH_DURATION;
      p.dashCooldown = DASH_COOLDOWN;
      p.dashDirection = direction;
    }
    p.anim = "dash";
    if (p.profile.id !== "vanta") {
      spawnTrail(p.x, p.y - 80);
    }
  }

  function startSuperDash() {
    const p = state.player;
    if (state.mode !== "training" || p.dead || p.superDashCooldown > 0) return;
    if (p.blockstun > 0 || p.hitstun > 0 || p.knockdownTimer > 0 || p.recoveryTimer > 0) return;
    if (p.action && !canDashCancel(p)) {
      p.bufferedMove = { key: "super_dash", timer: INPUT_BUFFER };
      return;
    }
    if (p.action) clearAction(p);
    beginMove(p, "super_dash");
  }

  function canDashCancel(f) {
    const current = moves[f.activeMove];
    if (!current) return false;
    return current.flags.dashCancel && (f.cancelUnlocked || f.actionTime >= current.cancelTime);
  }

  function getDashDirection(p) {
    const forward = p.facing === 1 ? "KeyD" : "KeyA";
    const back = p.facing === 1 ? "KeyA" : "KeyD";
    if (state.keys.has(back)) return -p.facing;
    if (state.keys.has(forward)) return p.facing;
    return p.facing;
  }

  function jump() {
    const p = state.player;
    if (state.mode !== "training" || p.dead || p.blockstun > 0 || p.hitstun > 0 || p.knockdownTimer > 0 || p.recoveryTimer > 0) return;
    if (p.action) {
      if (!canJumpCancel(p)) return;
      clearAction(p);
    }
    if (!p.grounded) return;
    p.vy = JUMP_VELOCITY;
    p.grounded = false;
    p.landingTimer = 0;
  }

  function canJumpCancel(f) {
    const current = moves[f.activeMove];
    if (!current) return false;
    return current.flags.jumpCancel && (f.cancelUnlocked || f.actionTime >= current.cancelTime);
  }

  function clearAction(f) {
    f.action = null;
    f.activeMove = null;
    f.hasHit = false;
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

  function getComboHitstunScale(attacker, moveData) {
    const combo = state.combo;
    if (combo.owner !== attacker.kind || combo.hits <= 0) return 1;
    const minScale = moveData.flags?.launcher ? LAUNCHER_HITSTUN_MIN_SCALE : HITSTUN_MIN_SCALE;
    return Math.max(minScale, 1 - combo.hits * HITSTUN_DECAY_STEP);
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
    if (!defender || defender.dead) return;
    const hitbox = getHitbox(attacker, moveData);
    const hurtbox = getHurtbox(defender);
    if (!intersects(hitbox, hurtbox)) return;

    attacker.hasHit = true;
    attacker.cancelUnlocked = true;
    const blocked = isBlockingHit(attacker, defender);
    const damageScale = blocked ? 1 : getComboDamageScale(attacker);
    const hitstunScale = blocked ? 1 : getComboHitstunScale(attacker, moveData);
    const damage = blocked ? 0 : Math.ceil(moveData.damage * damageScale);
    defender.hp = Math.max(0, defender.hp - damage);
    defender.blockstun = blocked ? moveData.blockstun : 0;
    defender.hitstun = blocked ? 0 : moveData.hitstun * hitstunScale;
    defender.action = null;
    defender.activeMove = null;
    defender.hasHit = false;
    defender.spawnedProjectile = false;
    defender.cancelUnlocked = false;

    const dir = attacker.facing;
    if (moveData.flags.pull) {
      defender.vx = -dir * Math.min(Math.abs(moveData.knockbackX), defender.kind === "enemy" ? 90 : Math.abs(moveData.knockbackX));
    } else {
      const cappedKnockback = !defender.grounded && !blocked ? Math.min(Math.abs(moveData.knockbackX), MAX_AIR_KNOCKBACK_X) : Math.abs(moveData.knockbackX);
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

    if (attacker.kind === "player" && !moveData.flags.ultimate) {
      attacker.meter = clamp(attacker.meter + (moveData.flags.meter || Math.ceil(moveData.damage / 12)), 0, METER_MAX);
    }

    applyImpactFeedback(moveData, hitbox.x + hitbox.w * 0.65, hitbox.y + hitbox.h * 0.45, blocked);

    if (defender.hp <= 0) {
      defender.dead = true;
      defender.hitstun = 999;
      defender.anim = defender.kind === "enemy" ? "enemy_death" : "death";
      flashStatus(defender.kind === "enemy" ? `${defender.profile.shortName} DEFEATED` : `${defender.profile.shortName} DOWN`, 2.4);
    }
  }

  function spawnProjectile(owner, moveData) {
    const direction = owner.facing;
    state.projectiles.push({
      ownerKind: owner.kind,
      x: owner.x + direction * 112,
      y: owner.y - 86,
      vx: direction * (moveData.flags.projectileSpeed || 520),
      facing: direction,
      w: 92,
      h: 22,
      damage: moveData.damage,
      hitstun: moveData.hitstun,
      blockstun: moveData.blockstun,
      knockbackX: moveData.knockbackX,
      knockbackY: moveData.knockbackY,
      boxType: moveData.boxType,
      flags: { projectileImpact: true },
      life: 1.1,
      color: owner.profile.projectileColor
    });
    spawnBurst(owner.x + direction * 72, owner.y - 78, owner.profile.projectileColor, 18);
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
    const hitstunScale = blocked || !owner ? 1 : getComboHitstunScale(owner, projectile);
    const damage = blocked ? 0 : Math.ceil(projectile.damage * damageScale);

    defender.hp = Math.max(0, defender.hp - damage);
    defender.blockstun = blocked ? projectile.blockstun : 0;
    defender.hitstun = blocked ? 0 : projectile.hitstun * hitstunScale;
    defender.action = null;
    defender.activeMove = null;
    defender.hasHit = false;
    defender.spawnedProjectile = false;
    const airX = !defender.grounded && !blocked ? Math.min(Math.abs(projectile.knockbackX), MAX_AIR_KNOCKBACK_X) * 0.65 : Math.abs(projectile.knockbackX);
    defender.vx = projectile.facing * (blocked ? airX * 0.25 : airX);
    const projectileY = !defender.grounded && !blocked && projectile.knockbackY > 0 ? Math.min(projectile.knockbackY, MAX_AIR_SPIKE_VELOCITY) : projectile.knockbackY;
    defender.vy = Math.min(defender.vy, blocked ? 0 : projectileY);
    defender.anim = defender.kind === "enemy" ? "enemy_damaged" : "damaged";
    if (owner) enforceHitSeparation(owner, defender, projectile, blocked);
    if (!blocked && owner) registerComboHit(owner, defender);
    if (blocked) resetCombo();

    applyImpactFeedback(projectile, box.x + box.w * 0.5, box.y + box.h * 0.5, blocked);

    if (defender.hp <= 0) {
      defender.dead = true;
      defender.hitstun = 999;
      defender.anim = defender.kind === "enemy" ? "enemy_death" : "death";
      flashStatus(defender.kind === "enemy" ? `${defender.profile.shortName} DEFEATED` : `${defender.profile.shortName} DOWN`, 2.4);
    }
  }

  function isMoveActive(f) {
    const m = moves[f.activeMove];
    return f.actionTime >= m.startup && f.actionTime <= m.startup + m.active;
  }

  function getHitbox(f, moveData) {
    const base = boxDefaults[moveData.boxType];
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
    const h = dead ? 62 : crouch ? 94 : 164;
    const w = f.profile?.hurtboxWidth || (f.kind === "enemy" ? 74 : 66);
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
    const frameCount = meta.cols;
    const frame = f.action ? Math.min(frameCount - 1, Math.floor((f.actionTime / Math.max(moves[f.activeMove]?.duration || 0.5, 0.1)) * frameCount)) : Math.floor(state.time * 8) % frameCount;
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

    if (analyzedRow && frameInfo) {
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
  }

  function drawPlaceholderFighter(f) {
    const hurt = getHurtbox(f);
    ctx.fillStyle = f.kind === "player" ? "#6b3bd1" : "#c9973d";
    ctx.fillRect(hurt.x, hurt.y, hurt.w, hurt.h);
  }

  function drawKairoPlaceholder(f) {
    const hurt = getHurtbox(f);
    const crouch = f.crouching || f.anim === "crouch";
    const attackReach = f.activeMove ? Math.min(92, boxDefaults[moves[f.activeMove].boxType].w * 0.55) : 0;

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

  function drawProjectiles() {
    for (const projectile of state.projectiles) {
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
      drawBox(getHitbox(p, moves[p.activeMove]), "rgba(255, 45, 85, 0.32)", "#ff3b63");
    }
    if (e.activeMove && isMoveActive(e)) {
      drawBox(getHitbox(e, moves[e.activeMove]), "rgba(255, 149, 0, 0.3)", "#ffb15c");
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
    if (state.mode !== "training") return;
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
      if (state.mode === "training" && !state.enemy.dead) {
        roundStatusEl.textContent = getTrainingStatus();
      }
    }, seconds * 1000);
  }

  function chooseAttack(button) {
    const p = state.player;
    if (!p.grounded) return `jump_${button}`;
    if (state.keys.has("KeyS")) return `down_${button}`;

    const forward = p.facing === 1 ? "KeyD" : "KeyA";
    const back = p.facing === 1 ? "KeyA" : "KeyD";
    if (state.keys.has(forward)) return `forward_${button}`;
    if (state.keys.has(back)) return `back_${button}`;
    return `neutral_${button}`;
  }

  function chooseLightAttack() {
    const p = state.player;
    if (!p) return "neutral_light";
    if (p.action && autoCombos[p.activeMove]) return autoCombos[p.activeMove];
    if (p.grounded && !isHoldingDirectionalModifier(p)) return "neutral_light";
    return chooseAttack("light");
  }

  function isHoldingDirectionalModifier(p) {
    const forward = p.facing === 1 ? "KeyD" : "KeyA";
    const back = p.facing === 1 ? "KeyA" : "KeyD";
    return state.keys.has("KeyS") || state.keys.has(forward) || state.keys.has(back);
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
    if (e.code === "KeyR") resetRound();
    if (e.code === "KeyH") state.debug = !state.debug;
    if (e.code === "KeyP" && state.mode === "training") {
      state.paused = !state.paused;
      flashStatus(state.paused ? "PAUSED" : getTrainingStatus(), 0.8);
    }
    if (state.mode !== "training" || state.paused) return;

    if (e.code === "KeyN") {
      state.enemyAI = !state.enemyAI;
      flashStatus(getTrainingStatus(), 0.9);
    }
    if (e.code === "KeyW") jump();
    if (e.code === "ShiftLeft" || e.code === "ShiftRight") {
      if (state.keys.has("KeyU")) startSuperDash();
      else startDash();
    }
    if (e.code === "KeyT") startMove("taunt");

    if ((e.code === "KeyI" && state.keys.has("KeyO")) || (e.code === "KeyO" && state.keys.has("KeyI"))) {
      startMove("ultimate");
      return;
    }

    if (e.code === "KeyJ") startMove(state.keys.has("KeyU") ? "special_1" : chooseLightAttack());
    if (e.code === "KeyK") startMove(state.keys.has("KeyU") ? "special_2" : chooseAttack("medium"));
    if (e.code === "KeyL") startMove(state.keys.has("KeyU") ? "special_3" : chooseAttack("heavy"));
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
  document.addEventListener("keydown", (e) => {
    if (state.mode === "select") {
      handleCharacterSelectKey(e);
    }
  }, true);
  characterButtons.forEach((button) => {
    button.addEventListener("focus", () => updateCharacterSelectFocus(button.dataset.character));
    button.addEventListener("click", () => startTraining(button.dataset.character));
  });
  window.setInterval(() => {
    if (state.mode !== "training" || state.paused || !state.player || state.player.dead) return;
    growPassiveMeter(0.25);
    updateHud();
  }, 250);
  boot();
})();
