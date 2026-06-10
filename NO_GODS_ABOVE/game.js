(() => {
  "use strict";

  const canvas = document.getElementById("game");
  const ctx = canvas.getContext("2d");
  const startButton = document.getElementById("start-button");
  const trainingButton = document.getElementById("training-button");
  const arcadeButton = document.getElementById("arcade-button");
  const controlsButton = document.getElementById("controls-button");
  const titleControlsPanel = document.getElementById("title-controls-panel");
  const titleScreen = document.getElementById("title-screen");
  const modeDetailScreen = document.getElementById("mode-detail-screen");
  const modeDetailPanel = document.getElementById("mode-detail-panel");
  const modeDetailKicker = document.getElementById("mode-detail-kicker");
  const modeDetailTitle = document.getElementById("mode-detail-title");
  const modeDetailDescription = document.getElementById("mode-detail-description");
  const modeDetailActions = document.getElementById("mode-detail-actions");
  const modeDetailBackButton = document.getElementById("mode-detail-back-button");
  const characterSelect = document.getElementById("character-select");
  const characterButtons = document.querySelectorAll("[data-character]");
  const selectHeading = document.getElementById("select-heading");
  const selectModeLabel = document.getElementById("select-mode-label");
  const selectStepIndicators = document.querySelectorAll("[data-select-step]");
  const flowStepIndicators = document.querySelectorAll("[data-flow-step]");
  const selectModeRow = document.getElementById("select-mode-row");
  const selectVersusButton = document.getElementById("select-versus-button");
  const selectTrainingButton = document.getElementById("select-training-button");
  const selectStageRow = document.getElementById("select-stage-row");
  const stagePresetButtons = document.querySelectorAll("[data-stage-preset]");
  const selectSlots = document.getElementById("select-slots");
  const p1SelectSlot = document.getElementById("p1-select-slot");
  const p2SelectSlot = document.getElementById("p2-select-slot");
  const p1SelectName = document.getElementById("p1-select-name");
  const p2SelectName = document.getElementById("p2-select-name");
  const p1SelectStatus = document.getElementById("p1-select-status");
  const p2SelectStatus = document.getElementById("p2-select-status");
  const matchupPreview = document.getElementById("matchup-preview");
  const selectFlowHint = document.getElementById("select-flow-hint");
  const selectGrid = document.getElementById("select-grid");
  const selectBackButton = document.getElementById("select-back-button");
  const selectConfirmButton = document.getElementById("select-confirm-button");
  const selectFooter = document.getElementById("select-footer");
  const fighterConfirmScreen = document.getElementById("fighter-confirm-screen");
  const showcasePortrait = document.getElementById("showcase-portrait");
  const showcaseSide = document.getElementById("showcase-side");
  const showcaseName = document.getElementById("showcase-name");
  const showcaseArchetype = document.getElementById("showcase-archetype");
  const showcasePlaystyle = document.getElementById("showcase-playstyle");
  const showcaseStrengths = document.getElementById("showcase-strengths");
  const showcaseQuote = document.getElementById("showcase-quote");
  const showcaseBackButton = document.getElementById("showcase-back-button");
  const showcaseConfirmButton = document.getElementById("showcase-confirm-button");
  const stageSelectScreen = document.getElementById("stage-select-screen");
  const stageMatchupPreview = document.getElementById("stage-matchup-preview");
  const stageBackButton = document.getElementById("stage-back-button");
  const stageConfirmButton = document.getElementById("stage-confirm-button");
  const matchIntroScreen = document.getElementById("match-intro-screen");
  const introP1Portrait = document.getElementById("intro-p1-portrait");
  const introP2Portrait = document.getElementById("intro-p2-portrait");
  const introP1Name = document.getElementById("intro-p1-name");
  const introP2Name = document.getElementById("intro-p2-name");
  const introStagePreview = document.getElementById("intro-stage-preview");
  const introStageName = document.getElementById("intro-stage-name");
  const introQuote = document.getElementById("intro-quote");
  const introStartButton = document.getElementById("intro-start-button");
  const introBackButton = document.getElementById("intro-back-button");
  const hud = document.getElementById("hud");
  const playerNameEl = document.getElementById("player-name");
  const enemyNameEl = document.getElementById("enemy-name");
  const playerHpEl = document.getElementById("player-hp");
  const enemyHpEl = document.getElementById("enemy-hp");
  const playerMeterEl = document.getElementById("player-meter");
  const enemyMeterEl = document.getElementById("enemy-meter");
  const playerPortraitEl = document.getElementById("player-portrait");
  const enemyPortraitEl = document.getElementById("enemy-portrait");
  const roundStatusEl = document.getElementById("round-status");
  const comboCounterEl = document.getElementById("combo-counter");
  const selectControlsDisplay = document.getElementById("select-controls-display");
  const selectControlsToggle = document.getElementById("select-controls-toggle");
  const matchFlowOverlay = document.getElementById("match-flow-overlay");
  const matchFlowTitle = document.getElementById("match-flow-title");
  const matchFlowSubtitle = document.getElementById("match-flow-subtitle");
  const matchFlowActions = document.getElementById("match-flow-actions");
  const matchControlsDisplay = document.getElementById("match-controls-display");
  const controllerStatusEls = ["controller-status", "title-controller-status"]
    .map((id) => document.getElementById(id))
    .filter(Boolean);
  const onlineMenu = document.getElementById("online-menu");
  const onlineButton = document.getElementById("online-button");
  const onlineModeRow = document.getElementById("online-mode-row");
  const onlineHostButton = document.getElementById("online-host-button");
  const onlineJoinButton = document.getElementById("online-join-button");
  const onlineHostPanel = document.getElementById("online-host-panel");
  const onlineJoinPanel = document.getElementById("online-join-panel");
  const onlineRoomCodeEl = document.getElementById("online-room-code");
  const onlineCodeInput = document.getElementById("online-code-input");
  const onlineConnectButton = document.getElementById("online-connect-button");
  const onlineStatusEl = document.getElementById("online-status");
  const onlineBackButton = document.getElementById("online-back-button");

  const W = canvas.width;
  const H = canvas.height;
  const GROUND_Y = 590;
  const STANDARD_STAGE_ID = "standard";
  const PLATFORM_TEST_STAGE_ID = "platform_test";
  const ECLIPSE_ROOFTOP_STAGE_ID = "eclipse_rooftop";
  const SELECT_STEP_MODE = "mode";
  const SELECT_STEP_CHARACTERS = "characters";
  const SELECT_STEP_ARENA = "arena";
  const SELECT_STEPS = [SELECT_STEP_MODE, SELECT_STEP_CHARACTERS, SELECT_STEP_ARENA];
  const FLOW_STEP_MAIN_MENU = "main-menu";
  const FLOW_STEP_MODE_DETAIL = "mode-detail";
  const FLOW_STEP_FIGHTER_SELECT = "fighter-select";
  const FLOW_STEP_FIGHTER_CONFIRM = "fighter-confirm";
  const FLOW_STEP_STAGE_SELECT = "stage-select";
  const FLOW_STEP_MATCH_INTRO = "match-intro";
  const FLOW_STEPS = [
    FLOW_STEP_MODE_DETAIL,
    FLOW_STEP_FIGHTER_SELECT,
    FLOW_STEP_FIGHTER_CONFIRM,
    FLOW_STEP_STAGE_SELECT,
    FLOW_STEP_MATCH_INTRO
  ];
  const STANDARD_FIGHTING_SPEED_TUNING = {
    groundSpeedMultiplier: 1.18,
    airDriftMultiplier: 1.25,
    gravityMultiplier: 1.18,
    fallSpeedMultiplier: 1.22,
    jumpForceMultiplier: 1,
    animationSpeedMultiplier: 1,
    hitstopMultiplier: 0.85,
    knockbackVelocityMultiplier: 1.12,
    cameraSmoothing: 8
  };
  const PLATFORM_ARENA_CONFIG = {
    label: "Platform Arena",
    worldWidth: 2400,
    bounds: { left: 96, right: 2304 },
    spawns: { p1X: 760, p2X: 1640 },
    groundY: GROUND_Y,
    platforms: [
      { id: "center_lift", x: 1020, y: 456, w: 360, h: 24, dropThrough: true }
    ],
    camera: { minScale: 0.7, maxScale: 1, paddingX: 320, damping: 8 },
    platformSpeedTuning: {
      groundSpeedMultiplier: 2.36,
      airDriftMultiplier: 2.5,
      gravityMultiplier: 2.36,
      fallSpeedMultiplier: 1.22,
      jumpForceMultiplier: 1,
      animationSpeedMultiplier: 1,
      hitstopMultiplier: 0.425,
      knockbackVelocityMultiplier: 2.24,
      cameraSmoothing: 8
    },
    background: {
      filter: "saturate(0.54) brightness(0.6) contrast(0.88) blur(0.6px)",
      overlayAlpha: 0.2,
      vignetteMidAlpha: 0.14,
      vignetteEdgeAlpha: 0.38
    },
    movement: {
      airRecoverySteer: 0.9,
      airRecoveryMix: 0.28,
      dropThroughTimer: 0.24,
      dropThroughNudgeY: 8,
      dropThroughVelocity: 100,
      landingVelocityScale: 0.46
    },
    combat: {
      hitSeparation: { ground: 150, air: 118, heavyGround: 285, heavyAir: 380 },
      juggleHitstunScale: {
        heavyFirst: 0.78,
        heavyRepeated: 0.62,
        heavyLate: 0.5,
        heavyExhausted: 0.42,
        normalMid: 0.78,
        normalLate: 0.64,
        normalExhausted: 0.52
      },
      knockbackScale: {
        heavyGroundBase: 1.24,
        heavyAirBase: 1.44,
        heavyStep: 0.14,
        heavyMax: 1.84,
        normalAirLate: 1.14
      },
      heavyRelaunchAirScale: 0.08,
      heavyRelaunchRepeatedGroundScale: 0.1,
      airRecoveryStartHits: 4,
      airRecoveryWindow: 16 / 60
    }
  };
  const ECLIPSE_ROOFTOP_CONFIG = {
    label: "Eclipse Rooftop",
    worldWidth: 2600,
    bounds: { left: 96, right: 2504 },
    spawns: { p1X: 720, p2X: 1880 },
    groundY: GROUND_Y,
    platforms: [
      { id: "eclipse_left_lift", x: 650, y: 447, w: 310, h: 24, dropThrough: true },
      { id: "eclipse_right_lift", x: 1640, y: 432, w: 310, h: 24, dropThrough: true }
    ],
    camera: { minScale: 0.72, maxScale: 1, paddingX: 300, damping: 9.5 },
    platformSpeedTuning: {
      groundSpeedMultiplier: 2.24,
      airDriftMultiplier: 2.38,
      gravityMultiplier: 2.24,
      fallSpeedMultiplier: 1.22,
      jumpForceMultiplier: 1.13,
      animationSpeedMultiplier: 1,
      hitstopMultiplier: 0.45,
      knockbackVelocityMultiplier: 2.08,
      cameraSmoothing: 9.5
    },
    background: {
      filter: "saturate(0.66) brightness(0.64) contrast(0.96)",
      overlayAlpha: 0.16,
      vignetteMidAlpha: 0.14,
      vignetteEdgeAlpha: 0.38,
      platformTop: "rgba(82, 234, 214, 0.54)",
      platformFillA: "rgba(24, 13, 30, 0.88)",
      platformFillB: "rgba(91, 23, 51, 0.78)",
      platformStroke: "rgba(241, 210, 138, 0.72)"
    },
    render: {
      farBackgroundKey: "eclipseFarBackground",
      midgroundKey: "eclipseMidground",
      mainPlatformKey: "eclipseMainPlatform",
      sidePlatformLeftKey: "eclipseSidePlatformLeft",
      sidePlatformRightKey: "eclipseSidePlatformRight",
      foregroundKey: "eclipseForeground",
      parallaxX: 0.08,
      mainPlatform: { x: 150, y: 420, w: 2300, h: 540 },
      leftPlatform: { x: 450, y: 252, w: 660, h: 390 },
      rightPlatform: { x: 1490, y: 326, w: 650, h: 350 },
      foreground: {
        activeGameplay: false,
        alpha: 0.74,
        clips: [
          { x: 0, y: 0, w: 250, h: H },
          { x: W - 250, y: 0, w: 250, h: H },
          { x: 0, y: H - 112, w: W, h: 112 }
        ]
      }
    },
    movement: PLATFORM_ARENA_CONFIG.movement,
    combat: PLATFORM_ARENA_CONFIG.combat
  };
  const STAGE_PRESETS = {
    [STANDARD_STAGE_ID]: {
      id: STANDARD_STAGE_ID,
      label: "Standard Arena (Fallback)",
      experimental: false,
      worldWidth: W,
      leftBound: 110,
      rightBound: W - 110,
      groundY: GROUND_Y,
      spawnP1X: 330,
      spawnP2X: 720,
      platforms: [],
      camera: { minScale: 1, maxScale: 1, paddingX: 0 }
    },
    [PLATFORM_TEST_STAGE_ID]: {
      id: PLATFORM_TEST_STAGE_ID,
      label: PLATFORM_ARENA_CONFIG.label,
      experimental: true,
      worldWidth: PLATFORM_ARENA_CONFIG.worldWidth,
      leftBound: PLATFORM_ARENA_CONFIG.bounds.left,
      rightBound: PLATFORM_ARENA_CONFIG.bounds.right,
      groundY: PLATFORM_ARENA_CONFIG.groundY,
      spawnP1X: PLATFORM_ARENA_CONFIG.spawns.p1X,
      spawnP2X: PLATFORM_ARENA_CONFIG.spawns.p2X,
      platforms: PLATFORM_ARENA_CONFIG.platforms,
      camera: PLATFORM_ARENA_CONFIG.camera,
      platformSpeedTuning: PLATFORM_ARENA_CONFIG.platformSpeedTuning,
      background: PLATFORM_ARENA_CONFIG.background,
      movement: PLATFORM_ARENA_CONFIG.movement,
      combat: PLATFORM_ARENA_CONFIG.combat
    },
    [ECLIPSE_ROOFTOP_STAGE_ID]: {
      id: ECLIPSE_ROOFTOP_STAGE_ID,
      label: ECLIPSE_ROOFTOP_CONFIG.label,
      experimental: true,
      worldWidth: ECLIPSE_ROOFTOP_CONFIG.worldWidth,
      leftBound: ECLIPSE_ROOFTOP_CONFIG.bounds.left,
      rightBound: ECLIPSE_ROOFTOP_CONFIG.bounds.right,
      groundY: ECLIPSE_ROOFTOP_CONFIG.groundY,
      spawnP1X: ECLIPSE_ROOFTOP_CONFIG.spawns.p1X,
      spawnP2X: ECLIPSE_ROOFTOP_CONFIG.spawns.p2X,
      platforms: ECLIPSE_ROOFTOP_CONFIG.platforms,
      camera: ECLIPSE_ROOFTOP_CONFIG.camera,
      platformSpeedTuning: ECLIPSE_ROOFTOP_CONFIG.platformSpeedTuning,
      background: ECLIPSE_ROOFTOP_CONFIG.background,
      render: ECLIPSE_ROOFTOP_CONFIG.render,
      movement: ECLIPSE_ROOFTOP_CONFIG.movement,
      combat: ECLIPSE_ROOFTOP_CONFIG.combat
    }
  };
  const debugParams = new URLSearchParams(window.location.search);
  const SERIS_HIDDEN_TEST_ENABLED = debugParams.has("serisTest");
  const LAMUH_HIDDEN_TEST_ENABLED = debugParams.has("lamuhTest");
  const CELESTE_HIDDEN_TEST_ENABLED = debugParams.has("celesteTest");
  const PLATFORM_TEST_DEBUG_ENABLED = debugParams.has("platformTest");
  const CELESTE_FRAME_DEBUG_ENABLED = CELESTE_HIDDEN_TEST_ENABLED && debugParams.has("celesteFrameDebug");
  const SERIS_RUNTIME_ENABLED = true;
  const LAMUH_RUNTIME_ENABLED = true;
  const LAMUH_SELECT_PORTRAIT_PATH = "assets/sprites/portraits/lamuh_select.png";
  const LAMUH_SELECT_PORTRAIT_READY = true;
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
  const DOUBLE_TAP_DASH_WINDOW = 0.28;
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
  const HEAVY_HITSTUN_DECAY_MID_START_HITS = 3;
  const HEAVY_HITSTUN_DECAY_HIGH_START_HITS = 6;
  const HEAVY_HITSTUN_MID_COMBO_SCALE = 0.85;
  const HEAVY_HITSTUN_HIGH_COMBO_SCALE = 0.7;
  const HEAVY_BLOWBACK_X_MULT = 1.45;
  const HEAVY_AIRBORNE_BLOWBACK_X_MULT = 2.1;
  const HEAVY_REPEATED_KNOCKBACK_MULT = 1.85;
  const HEAVY_BLOWBACK_KNOCKBACK_SCALE = 2.25;
  const HEAVY_BLOWBACK_MIN_X = 220;
  const HEAVY_AIRBORNE_BLOWBACK_MIN_X = 340;
  const HEAVY_FORCED_KNOCKDOWN_MIN_X = 440;
  const HEAVY_GROUND_BLOWBACK_SEPARATION = 210;
  const HEAVY_AIR_BLOWBACK_SEPARATION = 280;
  const HEAVY_BLOWBACK_DRIFT_TIME = 0.42;
  const HEAVY_RELAUNCH_SECOND_SCALE = 0.15;
  const HEAVY_AIR_BLOWBACK_START_HITS = 1;
  const HEAVY_HITS_BEFORE_FORCED_KNOCKDOWN = 3;
  const HEAVY_HITS_BEFORE_BLOWBACK = HEAVY_HITS_BEFORE_FORCED_KNOCKDOWN;
  const HEAVY_JUGGLE_KNOCKDOWN_THRESHOLD = 7;
  const HEAVY_AIR_KNOCKBACK_CAP = 560;
  const HEAVY_BLOWBACK_DOWN_VELOCITY = 340;
  const HEAVY_FORCED_FALLOUT_HITSTUN = 14 / 60;
  const AIR_JUGGLE_GRAVITY_SCALE_3_HITS = 1.2;
  const AIR_JUGGLE_GRAVITY_SCALE_5_HITS = 1.45;
  const AIR_JUGGLE_GRAVITY_SCALE_7_HITS = 1.75;
  const WALL_BOUNCE_ENABLED = true;
  const WALL_BOUNCE_MAX_PER_COMBO = 1;
  const WALL_BOUNCE_X_VELOCITY_MULT = -0.55;
  const WALL_BOUNCE_Y_POP = -360;
  const WALL_BOUNCE_HITSTUN_FRAMES = 18;
  const WALL_BOUNCE_MIN_HEAVY_KNOCKBACK = 220;
  const MAX_AIR_KNOCKBACK_X = 128;
  const MAX_AIR_SPIKE_VELOCITY = 330;
  const CAMERA_SHAKE_DECAY = 46;
  const PASSIVE_METER_PER_SECOND = 10;
  const ENEMY_AI_WALK_SPEED = 135;
  const ENEMY_AI_ATTACK_RANGE = 320;
  const ENEMY_AI_MIN_COOLDOWN = 1.1;
  const ENEMY_AI_MAX_COOLDOWN = 1.9;
  const LAMUH_CROWN_FINAL_DAMAGE = 280;
  const LAMUH_CROWN_RUSH_SPEED = 760;
  const LAMUH_CROWN_CARRY_DISTANCE = 360;
  const LAMUH_CROWN_LAUNCH_OFFSET_X = 500;
  const LAMUH_CROWN_LAUNCH_OFFSET_Y = -178;
  const LAMUH_CROWN_BEAM_TARGET_X = 586;
  const LAMUH_CROWN_BEAM_TARGET_Y = -132;
  const LAMUH_CROWN_BEAM_ORIGIN_X = 104;
  const LAMUH_CROWN_BEAM_ORIGIN_Y = -112;
  const LAMUH_ASCENDED_BODY_ATLAS_ENABLED = false;
  const LAMUH_CROWN_PHASES = [
    { key: "combo_a", anim: "crown_combo_a", duration: 0.5, freeze: 0.035, shake: 6 },
    { key: "combo_b", anim: "crown_combo_b", duration: 0.54, freeze: 0.045, shake: 8 },
    { key: "launch", anim: "crown_launch", duration: 0.52, freeze: 0.07, shake: 12 },
    { key: "charge", anim: "crown_charge", duration: 0.78, freeze: 0.1, shake: 8 },
    { key: "fire", anim: "crown_fire", duration: 0.86, freeze: 0.045, shake: 18, beamAt: 0.16, damageAt: 0.38 },
    { key: "recovery", anim: "crown_recovery", duration: 0.56, freeze: 0, shake: 4 }
  ];
  const LAMUH_SPECIAL_VFX_ANCHORS = {
    celestialPalm: {
      drawOffsetX: 0,
      drawOffsetY: -66,
      drawW: 168,
      drawH: 68
    },
    ascendStep: {
      enabled: false,
      atlasKey: "lamuhVfxAscendRadiant",
      move: "ascend_step",
      row: 1,
      layer: "behind",
      life: 0.22,
      offsetX: -64,
      offsetY: -76,
      drawW: 176,
      drawH: 76,
      alpha: 0.52,
      followOwner: true,
      reason: "Candidate trail still reads as a detached sticker instead of an attached dash trail."
    },
    heavenSplitter: {
      enabled: false,
      reason: "Candidate vertical burst reads as a detached floor spike beside the raised-hand strike."
    },
    radiantDive: {
      enabled: false,
      reason: "Candidate trail angle reads as a horizontal sticker instead of following the diagonal dive."
    }
  };

  const assetPaths = {
    stage: "assets/backgrounds/stages/forsaken_courtyard.png",
    title: "assets/backgrounds/menus/title_screen_background.png",
    mainMenuBackground: "assets/ui/flow/main_menu_background.png",
    eclipseFarBackground: "assets/stages/eclipse_rooftop/01_far_background_16x9.png",
    eclipseMidground: "assets/stages/eclipse_rooftop/02_midground_layer_transparent.png",
    eclipseMainPlatform: "assets/stages/eclipse_rooftop/03_main_platform_transparent.png",
    eclipseSidePlatformLeft: "assets/stages/eclipse_rooftop/04_side_platform_left_transparent.png",
    eclipseSidePlatformRight: "assets/stages/eclipse_rooftop/05_side_platform_right_transparent.png",
    eclipseForeground: "assets/stages/eclipse_rooftop/06_foreground_layer_transparent.png",
    eclipseStageSelectCard: "assets/stages/eclipse_rooftop/07_stage_select_card_16x9.png",
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
    nyxConcept3x6: null,
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
    lamuhFinalCoreMovement: LAMUH_RUNTIME_ENABLED ? "assets/sprites/lamuh_final/lamuh_sheet_1_core_movement_atlas.png?v=lamuh-public-1" : null,
    lamuhSheet1CoreNormalsRedesign: LAMUH_RUNTIME_ENABLED ? "assets/characters/lamuh/lamuh_sheet_1_core_movement_redesign_atlas.png?v=lamuh-sheet1-redesign-1" : null,
    lamuhForwardSpecialsRedesign: LAMUH_RUNTIME_ENABLED ? "assets/characters/lamuh/lamuh_sheet_forward_specials_redesign_atlas.png?v=lamuh-forward-specials-redesign-1" : null,
    lamuhDownUpSpecialsRedesign: LAMUH_RUNTIME_ENABLED ? "assets/characters/lamuh/lamuh_sheet_3_down_up_specials_body_scale_atlas.png?v=lamuh-down-up-specials-body-scale-1" : null,
    lamuhBackNeutralSpecialsRedesign: LAMUH_RUNTIME_ENABLED ? "assets/characters/lamuh/lamuh_sheet_4_back_neutral_specials_redesign_atlas.png?v=lamuh-back-neutral-specials-redesign-1" : null,
    lamuhNeutralSpecialsBodyVfxRedesign: LAMUH_RUNTIME_ENABLED ? "assets/characters/lamuh/lamuh_sheet_neutral_specials_body_vfx_atlas.png?v=lamuh-neutral-specials-body-vfx-1" : null,
    lamuhReactionsDefenseRedesign: LAMUH_RUNTIME_ENABLED ? "assets/characters/lamuh/lamuh_sheet_reactions_defense_redesign_atlas.png?v=lamuh-reactions-defense-redesign-1" : null,
    lamuhAirCrouchJumpRedesign: LAMUH_RUNTIME_ENABLED ? "assets/characters/lamuh/lamuh_sheet_air_crouch_jump_redesign_atlas_v2.png?v=lamuh-air-crouch-jump-redesign-1" : null,
    lamuhSecondaryMovementDirectionalNormalsRedesign: LAMUH_RUNTIME_ENABLED ? "assets/characters/lamuh/lamuh_sheet_secondary_movement_directional_normals_atlas.png?v=lamuh-secondary-movement-directional-1" : null,
    lamuhSuperAscendedGoldenLocs: LAMUH_RUNTIME_ENABLED ? "assets/characters/lamuh/lamuh_sheet_super_ascended_golden_locs_atlas.png?v=lamuh-super-ascended-golden-locs-1" : null,
    lamuhFinalAirMovement: LAMUH_RUNTIME_ENABLED ? "assets/sprites/lamuh_final/lamuh_sheet_2_air_movement_atlas.png?v=lamuh-public-1" : null,
    lamuhFinalGroundNormals: LAMUH_RUNTIME_ENABLED ? "assets/sprites/lamuh_final/lamuh_sheet_3_ground_normals_atlas.png?v=lamuh-public-1" : null,
    lamuhFinalAirNormals: LAMUH_RUNTIME_ENABLED ? "assets/sprites/lamuh_final/lamuh_sheet_4_air_normals_atlas.png?v=lamuh-public-1" : null,
    lamuhFinalSpecials: LAMUH_RUNTIME_ENABLED ? "assets/sprites/lamuh_final/lamuh_sheet_5_specials_atlas.png?v=lamuh-public-1" : null,
    lamuhFinalDefense: LAMUH_RUNTIME_ENABLED ? "assets/sprites/lamuh_final/lamuh_sheet_6_defense_hit_reactions_atlas.png?v=lamuh-public-1" : null,
    lamuhFinalEndStates: LAMUH_RUNTIME_ENABLED ? "assets/sprites/lamuh_final/lamuh_sheet_7_knockdown_recovery_flavor_atlas.png?v=lamuh-public-1" : null,
    lamuhCrownBody: LAMUH_RUNTIME_ENABLED ? "assets/sprites/lamuh_final/lamuh_sheet_8_crown_of_no_gods_body_atlas.png?v=lamuh-crown-body-1" : null,
    lamuhCrownBeamVfx: LAMUH_RUNTIME_ENABLED ? "assets/effects/lamuh/lamuh_crown_of_no_gods_beam_vfx_atlas.png?v=approved-chat-beam-1" : null,
    lamuhVfxCelestialPalm: LAMUH_RUNTIME_ENABLED ? "assets/effects/lamuh/lamuh_vfx_celestial_palm_projectile.png?v=lamuh-vfx-pack-01" : null,
    lamuhVfxAscendRadiant: LAMUH_RUNTIME_ENABLED && LAMUH_SPECIAL_VFX_ANCHORS.ascendStep.enabled ? "assets/effects/lamuh/lamuh_vfx_ascend_radiant_trail.png?v=lamuh-vfx-pack-01" : null,
    lamuhVfxHeavenSplitter: LAMUH_RUNTIME_ENABLED && LAMUH_SPECIAL_VFX_ANCHORS.heavenSplitter.enabled ? "assets/effects/lamuh/lamuh_vfx_heaven_splitter_vertical.png?v=lamuh-vfx-pack-01" : null,
    serisFinalCoreMovement: SERIS_RUNTIME_ENABLED ? "assets/sprites/seris_revamp_final/seris_revamp_final_sheet_1_core_movement_atlas.png?v=seris-revamp-final-1" : null,
    serisFinalAirMovement: SERIS_RUNTIME_ENABLED ? "assets/sprites/seris_revamp_final/seris_revamp_final_sheet_2_air_movement_atlas.png?v=seris-revamp-final-1" : null,
    serisFinalGroundNormals: SERIS_RUNTIME_ENABLED ? "assets/sprites/seris_revamp_final/seris_revamp_final_sheet_3_ground_normals_atlas.png?v=seris-revamp-final-1" : null,
    serisFinalAirNormals: SERIS_RUNTIME_ENABLED ? "assets/sprites/seris_revamp_final/seris_revamp_final_sheet_4_air_normals_atlas.png?v=seris-revamp-final-1" : null,
    serisFinalSpecials: SERIS_RUNTIME_ENABLED ? "assets/sprites/seris_revamp_final/seris_revamp_final_sheet_5_specials_body_atlas.png?v=seris-revamp-final-1" : null,
    serisFinalDefense: SERIS_RUNTIME_ENABLED ? "assets/sprites/seris_revamp_final/seris_revamp_final_sheet_6_defense_hit_reactions_atlas.png?v=seris-revamp-final-1" : null,
    serisFinalEndStates: SERIS_RUNTIME_ENABLED ? "assets/sprites/seris_revamp_final/seris_revamp_final_sheet_7_knockdown_recovery_flavor_atlas.png?v=seris-revamp-final-1" : null,
    serisChainWhipVfx: SERIS_RUNTIME_ENABLED && SERIS_CHAIN_VFX_RUNTIME_ENABLED ? "assets/effects/seris/seris_chain_whip_vfx_atlas.png?v=seris-visual-integrity-1" : null,
    celesteFinalBodyBasics: "assets/sprites/celeste_final/celeste_sheet_1_body_basics_atlas.png?v=celeste-phase5-4-1",
    celesteFinalGroundNormals: "assets/sprites/celeste_final/celeste_sheet_2_ground_normals_atlas.png?v=celeste-phase5-4-1",
    celesteFinalUpAirAttacks: "assets/sprites/celeste_final/celeste_sheet_3_up_air_attacks_atlas.png?v=celeste-phase5-4-1",
    celesteFinalSpecials: "assets/sprites/celeste_final/celeste_sheet_4_specials_atlas.png?v=celeste-phase5-4-1",
    celesteFinalDefense: "assets/sprites/celeste_final/celeste_sheet_5_defense_reactions_atlas.png?v=celeste-phase5-4-1",
    celesteFinalOctavaBody: "assets/sprites/celeste_final/celeste_sheet_6_octava_body_atlas.png?v=celeste-phase5-4-1",
    celesteFinalVfx: "assets/sprites/celeste_final/celeste_sheet_7_detached_vfx_runtime_atlas.png?v=celeste-phase5-4-1",
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
    lamuhFinalCoreMovement: { cols: 8, rows: 6, cellSize: 448, baselineY: 382, scale: 0.82, frameCounts: [8, 6, 6, 6, 6, 4], fixedSourceCells: true, anchorMode: "lockedFrameBottomCenter", skipSanitize: true },
    lamuhSheet1CoreNormalsRedesign: { cols: 8, rows: 6, cellSize: 448, baselineY: 382, scale: 0.82, frameCounts: [8, 8, 8, 8, 8, 8], fixedSourceCells: true, anchorMode: "lockedFrameBottomCenter", skipSanitize: true },
    lamuhForwardSpecialsRedesign: { cols: 8, rows: 3, cellSize: 448, baselineY: 382, scale: 0.82, frameCounts: [8, 8, 8], fixedSourceCells: true, anchorMode: "lockedFrameBottomCenter", skipSanitize: true },
    lamuhDownUpSpecialsRedesign: { cols: 8, rows: 6, cellSize: 448, baselineY: 382, scale: 0.82, frameCounts: [8, 8, 8, 8, 8, 8], fixedSourceCells: true, anchorMode: "lockedFrameBottomCenter", skipSanitize: true },
    lamuhBackNeutralSpecialsRedesign: { cols: 8, rows: 6, cellSize: 448, baselineY: 382, scale: 0.82, frameCounts: [8, 8, 8, 8, 8, 8], fixedSourceCells: true, anchorMode: "lockedFrameBottomCenter", skipSanitize: true },
    lamuhNeutralSpecialsBodyVfxRedesign: { cols: 8, rows: 6, cellSize: 448, baselineY: 382, scale: 0.82, frameCounts: [8, 8, 8, 8, 8, 8], fixedSourceCells: true, anchorMode: "lockedFrameBottomCenter", skipSanitize: true, allowDetachedEffects: true },
    lamuhReactionsDefenseRedesign: { cols: 8, rows: 6, cellSize: 448, baselineY: 382, scale: 0.82, frameCounts: [8, 8, 8, 8, 8, 8], fixedSourceCells: true, anchorMode: "lockedFrameBottomCenter", skipSanitize: true },
    lamuhAirCrouchJumpRedesign: { cols: 8, rows: 6, cellSize: 448, baselineY: 382, scale: 0.82, frameCounts: [8, 8, 8, 8, 8, 8], fixedSourceCells: true, anchorMode: "lockedFrameBottomCenter", skipSanitize: true, allowDetachedEffects: true },
    lamuhSecondaryMovementDirectionalNormalsRedesign: { cols: 8, rows: 6, cellSize: 448, baselineY: 382, scale: 0.82, frameCounts: [8, 8, 8, 8, 8, 8], fixedSourceCells: true, anchorMode: "lockedFrameBottomCenter", skipSanitize: true, allowDetachedEffects: true },
    lamuhSuperAscendedGoldenLocs: { cols: 8, rows: 6, cellSize: 448, baselineY: 382, scale: 0.82, frameCounts: [8, 8, 8, 8, 8, 8], fixedSourceCells: true, anchorMode: "lockedFrameBottomCenter", skipSanitize: true, allowDetachedEffects: true },
    lamuhFinalAirMovement: { cols: 6, rows: 6, cellSize: 448, baselineY: 382, scale: 0.82, frameCounts: [4, 4, 4, 4, 6, 6], fixedSourceCells: true, anchorMode: "lockedFrameBottomCenter", skipSanitize: true },
    lamuhFinalGroundNormals: { cols: 8, rows: 4, cellSize: 448, baselineY: 382, scale: 0.82, frameCounts: [4, 8, 7, 7], fixedSourceCells: true, anchorMode: "lockedFrameBottomCenter", skipSanitize: true },
    // Sheet 4 source poses are drawn smaller than the other LAMUH atlases, so this is a visual-only scale correction.
    lamuhFinalAirNormals: { cols: 7, rows: 4, cellSize: 448, baselineY: 382, scale: 1.55, frameCounts: [4, 6, 7, 4], fixedSourceCells: true, anchorMode: "lockedFrameBottomCenter", skipSanitize: true },
    lamuhFinalSpecials: { cols: 8, rows: 6, cellSize: 448, baselineY: 382, scale: 0.82, frameCounts: [6, 7, 7, 6, 7, 4], fixedSourceCells: true, anchorMode: "lockedFrameBottomCenter", skipSanitize: true },
    lamuhFinalDefense: { cols: 8, rows: 6, cellSize: 448, baselineY: 382, scale: 0.82, frameCounts: [4, 4, 4, 5, 6, 6], fixedSourceCells: true, anchorMode: "lockedFrameBottomCenter", skipSanitize: true },
    // Hidden LAMUH downed idle holds the clean first Sheet 7 frame; the full packaged row remains unchanged.
    lamuhFinalEndStates: { cols: 8, rows: 7, cellSize: 448, baselineY: 382, scale: 0.82, frameCounts: [6, 1, 6, 8, 8, 8, 8], fixedSourceCells: true, anchorMode: "lockedFrameBottomCenter", skipSanitize: true },
    lamuhCrownBody: { cols: 8, rows: 8, cellSize: 448, baselineY: 382, scale: 0.82, frameCounts: [6, 7, 8, 8, 7, 8, 8, 6], fixedSourceCells: true, anchorMode: "lockedFrameBottomCenter", skipSanitize: true },
    serisFinalCoreMovement: { cols: 8, rows: 6, cellSize: 384, baselineY: 350, scale: 1.0, frameCounts: [8, 6, 6, 6, 6, 4], fixedSourceCells: true, anchorMode: "lockedFrameBottomCenter", skipSanitize: true },
    serisFinalAirMovement: { cols: 6, rows: 6, cellSize: 384, baselineY: 350, scale: 1.0, frameCounts: [4, 4, 4, 4, 6, 6], fixedSourceCells: true, anchorMode: "lockedFrameBottomCenter", skipSanitize: true },
    serisFinalGroundNormals: { cols: 8, rows: 4, cellWidth: 832, cellHeight: 448, anchorX: 320, baselineY: 406, scale: 1.0, frameCounts: [4, 8, 7, 7], fixedSourceCells: true, anchorMode: "lockedFrameBottomCenter", skipSanitize: true },
    serisFinalAirNormals: { cols: 7, rows: 4, cellWidth: 832, cellHeight: 448, anchorX: 320, baselineY: 406, scale: 1.0, frameCounts: [4, 6, 7, 4], fixedSourceCells: true, anchorMode: "lockedFrameBottomCenter", skipSanitize: true },
    serisFinalSpecials: { cols: 8, rows: 6, cellWidth: 832, cellHeight: 448, anchorX: 320, baselineY: 406, scale: 1.0, frameCounts: [4, 6, 4, 8, 8, 4], fixedSourceCells: true, anchorMode: "lockedFrameBottomCenter", skipSanitize: true },
    serisFinalDefense: { cols: 6, rows: 8, cellSize: 384, baselineY: 350, scale: 1.0, frameCounts: [4, 4, 4, 3, 4, 6, 5, 5], fixedSourceCells: true, anchorMode: "lockedFrameBottomCenter", skipSanitize: true },
    serisFinalEndStates: { cols: 8, rows: 7, cellSize: 384, baselineY: 350, scale: 1.0, frameCounts: [6, 3, 6, 8, 8, 8, 8], fixedSourceCells: true, anchorMode: "lockedFrameBottomCenter", skipSanitize: true },
    celesteFinalBodyBasics: { cols: 6, rows: 7, cellWidth: 768, cellHeight: 512, baselineY: 438, scale: 0.66, frameCounts: [6, 6, 6, 3, 3, 3, 3], fixedSourceCells: true, anchorMode: "lockedFrameBottomCenter", skipSanitize: true },
    celesteFinalGroundNormals: { cols: 4, rows: 9, cellWidth: 896, cellHeight: 544, baselineY: 462, scale: 0.66, frameCounts: [4, 4, 4, 4, 4, 4, 4, 4, 4], fixedSourceCells: true, anchorMode: "lockedFrameBottomCenter", skipSanitize: true },
    celesteFinalUpAirAttacks: { cols: 4, rows: 6, cellWidth: 768, cellHeight: 576, baselineY: 488, scale: 0.66, frameCounts: [4, 4, 4, 4, 4, 4], fixedSourceCells: true, anchorMode: "lockedFrameBottomCenter", skipSanitize: true },
    celesteFinalSpecials: { cols: 4, rows: 6, cellWidth: 1280, cellHeight: 576, baselineY: 488, scale: 0.66, frameCounts: [4, 4, 4, 4, 4, 4], fixedSourceCells: true, anchorMode: "lockedFrameBottomCenter", skipSanitize: true },
    celesteFinalDefense: { cols: 5, rows: 8, cellWidth: 1536, cellHeight: 544, baselineY: 438, scale: 0.66, frameCounts: [4, 3, 4, 4, 4, 5, 4, 5], fixedSourceCells: true, anchorMode: "lockedFrameBottomCenter", skipSanitize: true },
    celesteFinalOctavaBody: { cols: 5, rows: 2, cellWidth: 896, cellHeight: 768, baselineY: 690, scale: 0.62, frameCounts: [5, 5], fixedSourceCells: true, anchorMode: "lockedFrameBottomCenter", skipSanitize: true }
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

  const lamuhSpecialMoves = {
    special_1: { type: "mirrorSpark", attack: "special_1", projectileWidth: 68, projectileHeight: 22, projectileLife: 0.34, spawnOffsetX: 86, spawnOffsetY: -86, visualOffsetX: 72, visualOffsetY: -92 },
    special_2: { type: "mirrorPulse", attack: "special_2", projectileWidth: 116, projectileHeight: 34, projectileLife: 0.48, spawnOffsetX: 104, spawnOffsetY: -88, visualOffsetX: 78, visualOffsetY: -96 },
    special_3: { type: "crownBeam", attack: "special_3", projectileWidth: 168, projectileHeight: 42, projectileLife: 0.58, spawnOffsetX: 118, spawnOffsetY: -92, visualOffsetX: 82, visualOffsetY: -104 },
    neutral_special: { type: "mirrorSpark", attack: "neutral_special", projectileWidth: 68, projectileHeight: 22, projectileLife: 0.34, spawnOffsetX: 86, spawnOffsetY: -86, visualOffsetX: 72, visualOffsetY: -92 },
    forward_special: { type: "dashStrike", attack: "forward_special" },
    down_special: { type: "lowMirrorCut", attack: "down_special" },
    back_special: { type: "mirrorSlip", attack: "back_special" },
    air_special: { type: "airMirrorSpark", attack: "air_special", projectileWidth: 70, projectileHeight: 22, projectileLife: 0.28, spawnOffsetX: 80, spawnOffsetY: -74 },
    neutral_light_special: { type: "mirrorSpark", attack: "neutral_light_special", projectileWidth: 68, projectileHeight: 22, projectileLife: 0.34, spawnOffsetX: 86, spawnOffsetY: -86, visualOffsetX: 72, visualOffsetY: -92 },
    neutral_medium_special: { type: "mirrorPulse", attack: "neutral_medium_special", projectileWidth: 116, projectileHeight: 34, projectileLife: 0.48, spawnOffsetX: 104, spawnOffsetY: -88, visualOffsetX: 78, visualOffsetY: -96 },
    neutral_heavy_special: { type: "crownBeam", attack: "neutral_heavy_special", projectileWidth: 168, projectileHeight: 42, projectileLife: 0.58, spawnOffsetX: 118, spawnOffsetY: -92, visualOffsetX: 82, visualOffsetY: -104 },
    forward_light_special: { type: "dashStrike", attack: "forward_light_special" },
    forward_medium_special: { type: "mirrorBreak", attack: "forward_medium_special" },
    forward_heavy_special: { type: "mirrorPierce", attack: "forward_heavy_special", projectileWidth: 640, projectileHeight: 82, projectileLife: 0.24, spawnOffsetX: 52, spawnOffsetY: -144 },
    back_light_special: { type: "mirrorSlip", attack: "back_light_special" },
    back_medium_special: { type: "reboundStrike", attack: "back_medium_special" },
    back_heavy_special: { type: "mirrorReversal", attack: "back_heavy_special" },
    down_light_special: { type: "lowMirrorCut", attack: "down_light_special" },
    down_medium_special: { type: "groundBreaker", attack: "down_medium_special" },
    down_heavy_special: { type: "crownRupture", attack: "down_heavy_special" },
    up_light_special: { type: "crownPop", attack: "up_light_special" },
    up_medium_special: { type: "risingCrown", attack: "up_medium_special" },
    up_heavy_special: { type: "ascendantBreak", attack: "up_heavy_special" },
    air_light_special: { type: "airMirrorSpark", attack: "air_light_special", projectileWidth: 70, projectileHeight: 22, projectileLife: 0.28, spawnOffsetX: 80, spawnOffsetY: -74 },
    air_medium_special: { type: "airDashStrike", attack: "air_medium_special" },
    air_heavy_special: { type: "airCrownDrop", attack: "air_heavy_special" },
    super_dash: { type: "homingDash", attack: "super_dash" },
    ultimate: { type: "ultimate", attack: "ultimate" }
  };

  const lamuhLegacySpecialMoves = {
    special_1: { type: "mirrorSpark", attack: "special_1", projectileWidth: 68, projectileHeight: 22, projectileLife: 0.34, spawnOffsetX: 86, spawnOffsetY: -86 },
    special_2: { type: "dashStrike", attack: "special_2" },
    special_3: { type: "heavenSplitter", attack: "special_3" },
    neutral_special: { type: "mirrorSpark", attack: "neutral_special", projectileWidth: 68, projectileHeight: 22, projectileLife: 0.34, spawnOffsetX: 86, spawnOffsetY: -86 },
    forward_special: { type: "dashStrike", attack: "forward_special" },
    up_special: { type: "heavenSplitter", attack: "up_special" },
    down_special: { type: "heavenSplitter", attack: "down_special" },
    back_special: { type: "mirrorSlip", attack: "back_special" },
    air_special: { type: "airDashStrike", attack: "air_special" },
    super_dash: { type: "homingDash", attack: "super_dash" },
    ultimate: { type: "ultimate", attack: "ultimate" }
  };

  function buildLamuhPlayerAttacks() {
    const attacks = cloneData(solPlayerAttacks);
    attacks.neutral_light = attackDef(24, 2, 5, 5, 18, 14, -16, "light", { autoCombo: true, cancelOnHit: ["neutral_medium"], dashCancel: true, stepForward: 72, anim: "quick_palm" });
    attacks.neutral_medium = attackDef(48, 5, 6, 9, 29, 42, -64, "medium", { cancelOnHit: ["neutral_heavy", "neutral_light_special", "forward_light_special", "down_light_special"], jumpCancel: true, dashCancel: true, stepForward: 84, anim: "mirror_knuckle" });
    attacks.neutral_heavy = attackDef(82, 9, 5, 18, 42, 138, -260, "heavy", { softKnockdown: true, dashCancel: true, anim: "crown_breaker" });
    attacks.forward_light = attackDef(30, 3, 4, 7, 20, 38, -18, "light", { cancelOnHit: ["forward_medium", "neutral_medium"], dashCancel: true, stepForward: 96, anim: "quick_palm" });
    attacks.forward_medium = attackDef(54, 6, 5, 10, 30, 76, -62, "medium", { cancelOnHit: ["forward_heavy", "forward_light_special", "forward_medium_special"], jumpCancel: true, dashCancel: true, anim: "mirror_knuckle" });
    attacks.forward_heavy = attackDef(86, 10, 5, 18, 44, 112, -405, "heavy", { launcher: true, jumpCancel: true, dashCancel: true, softKnockdown: true, anim: "crown_breaker" });
    attacks.back_light = attackDef(28, 3, 4, 7, 20, 30, -18, "light", { cancelOnHit: ["back_medium", "neutral_medium"], dashCancel: true, anim: "quick_palm" });
    attacks.back_medium = attackDef(50, 6, 5, 10, 29, 56, -60, "medium", { cancelOnHit: ["back_heavy", "back_medium_special"], jumpCancel: true, dashCancel: true, anim: "mirror_knuckle" });
    attacks.back_heavy = attackDef(78, 9, 5, 18, 42, 82, -430, "heavy", { launcher: true, jumpCancel: true, dashCancel: true, softKnockdown: true, anim: "crown_breaker" });
    attacks.down_light = attackDef(22, 2, 4, 6, 18, 32, 0, "low", { cancelOnHit: ["down_medium", "neutral_medium"], dashCancel: true, anim: "low_check" });
    attacks.down_medium = attackDef(44, 5, 5, 9, 27, 54, -26, "low", { cancelOnHit: ["down_heavy", "down_light_special"], jumpCancel: true, dashCancel: true, anim: "sweep_line" });
    attacks.down_heavy = attackDef(70, 8, 5, 19, 42, 54, -500, "launcher", { launcher: true, jumpCancel: true, dashCancel: true, softKnockdown: true, anim: "crown_riser" });
    attacks.jump_light = attackDef(22, 2, 5, 4, 20, 28, -16, "airLight", { air: true, cancelOnHit: ["jump_medium"], dashCancel: true, anim: "air_tap" });
    attacks.jump_medium = attackDef(44, 5, 6, 8, 31, 42, -34, "airMedium", { air: true, cancelOnHit: ["jump_heavy", "air_light_special"], dashCancel: true, anim: "sky_knuckle" });
    attacks.jump_heavy = attackDef(72, 7, 5, 15, 38, 52, 245, "airHeavy", { air: true, softKnockdown: true, anim: "crown_drop" });
    attacks.neutral_light_special = attackDef(38, 3, 5, 9, 24, 44, -24, "mirrorSpark", { projectile: true, projectileSpeed: 470, noHit: true, meter: 8, anim: "mirror_spark", visualProfile: "mirrorSpark" });
    attacks.neutral_medium_special = attackDef(64, 6, 7, 14, 32, 94, -48, "mirrorPulse", { projectile: true, projectileSpeed: 540, noHit: true, meter: 12, anim: "mirror_pulse", visualProfile: "mirrorPulse" });
    attacks.neutral_heavy_special = attackDef(92, 13, 8, 28, 40, 156, -85, "crownBeam", { projectile: true, projectileSpeed: 610, noHit: true, meter: 18, anim: "crown_beam", visualProfile: "crownBeam" });
    attacks.forward_light_special = attackDef(62, 5, 6, 15, 30, 92, -70, "dashStrike", { dash: true, dashCancel: true, softKnockdown: true, meter: 10, anim: "dash_strike" });
    attacks.forward_medium_special = attackDef(78, 8, 6, 20, 34, 118, -120, "mirrorBreak", { dash: true, dashSpeed: 520, dashTime: 0.16, dashCancel: true, softKnockdown: true, meter: 14, anim: "mirror_break", visualProfile: "mirrorBreak", impactProfile: { hitStop: 0.064, shake: 7, sparkCount: 17, sparkSize: 15, burstSize: 31, speed: 380, life: 0.28, color: "#f7f2df", dramatic: true } });
    attacks.forward_heavy_special = attackDef(30, 12, 8, 64, 18, 42, -36, "mirrorPierce", { dash: true, dashSpeed: 790, dashTime: 0.22, projectile: true, projectileSpeed: 0, projectileSpawnAt: 0.95, noHit: true, pierceSideSwitch: true, pierceSwitchAt: 0.56, pierceExitOffset: 84, pierceRange: 250, requiresPierceConfirm: true, pierceHitFrame: 17, sideSwitchFrame: 17, palmPoseStartFrame: 18, beamChargeStartFrame: 24, beamFireFrame: 57, beamHitboxStartFrame: 57, beamHitboxEndFrame: 71, recoveryStartFrame: 71, whiffBeamFireFrame: 38, whiffRecoveryEndFrame: 52, maxMirrorPierceFrame: 96, pierceHoldFrames: 46, palmPauseFrames: 40, pierceHitDamage: 30, pierceHitstunFrames: 18, pierceKnockbackX: 42, pierceKnockbackY: -36, beamDamage: 78, beamHitstunFrames: 58, beamKnockbackX: 2600, beamKnockbackY: -420, beamBlockstunFrames: 28, forceWallBounce: true, softKnockdown: true, meter: 22, anim: "mirror_pierce", visualProfile: "mirrorPierce", impactProfile: { hitStop: 0.026, shake: 4, sparkCount: 10, sparkSize: 11, burstSize: 22, speed: 260, life: 0.18, color: "#f7f2df", dramatic: true }, beamImpactProfile: { hitStop: 0.11, shake: 16, sparkCount: 30, sparkSize: 21, burstSize: 48, speed: 560, life: 0.38, color: "#ffe8a3", dramatic: true } });
    attacks.back_light_special = attackDef(0, 2, 0, 13, 0, 0, 0, "mirrorSlip", { noHit: true, shadowStep: true, shadowStepAway: true, shadowStepSpeed: 930, meter: 7, anim: "mirror_slip" });
    attacks.back_medium_special = attackDef(58, 8, 5, 18, 30, 78, -64, "reboundStrike", { shadowStep: true, shadowStepAway: true, shadowStepSpeed: 760, reboundSnap: true, reboundSnapSpeed: 560, reboundSnapStart: 0.88, reboundSnapEnd: 0.62, softKnockdown: true, meter: 12, anim: "rebound_strike", visualProfile: "reboundStrike", impactProfile: { hitStop: 0.06, shake: 6, sparkCount: 15, sparkSize: 13, burstSize: 27, speed: 340, life: 0.26, color: "#f7f2df", dramatic: true } });
    attacks.back_heavy_special = attackDef(86, 14, 6, 30, 36, 132, -105, "mirrorReversal", { shadowStep: true, shadowStepAway: true, shadowStepSpeed: 610, softKnockdown: true, meter: 18, anim: "mirror_reversal" });
    attacks.down_light_special = attackDef(34, 3, 5, 10, 23, 40, 0, "lowMirrorCut", { meter: 8, anim: "low_mirror_cut" });
    attacks.down_medium_special = attackDef(62, 7, 6, 19, 30, 86, -36, "groundBreaker", { softKnockdown: true, meter: 13, anim: "ground_breaker", visualProfile: "groundBreaker", impactProfile: { hitStop: 0.058, shake: 6, sparkCount: 15, sparkSize: 13, burstSize: 28, speed: 340, life: 0.26, color: "#ffe08a", dramatic: true } });
    attacks.down_heavy_special = attackDef(96, 14, 7, 32, 40, 98, -360, "crownRupture", { launcher: true, hardKnockdown: true, meter: 20, anim: "crown_rupture", visualProfile: "crownRupture", impactProfile: { hitStop: 0.092, shake: 13, sparkCount: 23, sparkSize: 19, burstSize: 40, speed: 500, life: 0.34, color: "#ffe08a", dramatic: true } });
    attacks.up_light_special = attackDef(36, 3, 5, 10, 24, 34, -130, "crownPop", { meter: 8, anim: "crown_pop" });
    attacks.up_medium_special = attackDef(72, 7, 6, 22, 36, 54, -465, "risingCrown", { rise: true, riseVelocity: -430, riseTime: 0.2, launcher: true, jumpCancel: true, softKnockdown: true, meter: 15, anim: "rising_crown", visualProfile: "risingCrown", impactProfile: { hitStop: 0.066, shake: 8, sparkCount: 17, sparkSize: 15, burstSize: 32, speed: 390, life: 0.28, color: "#fff3ba", dramatic: true } });
    attacks.up_heavy_special = attackDef(104, 12, 7, 34, 42, 76, -520, "ascendantBreak", { rise: true, riseVelocity: -560, riseTime: 0.26, launcher: true, hardKnockdown: true, meter: 22, anim: "ascendant_break", visualProfile: "ascendantBreak", impactProfile: { hitStop: 0.1, shake: 14, sparkCount: 24, sparkSize: 20, burstSize: 42, speed: 520, life: 0.36, color: "#fff3ba", dramatic: true } });
    attacks.air_light_special = attackDef(32, 3, 5, 10, 22, 38, 26, "airSpark", { air: true, projectile: true, projectileSpeed: 420, noHit: true, meter: 8, anim: "air_mirror_spark" });
    attacks.air_medium_special = attackDef(58, 5, 6, 18, 30, 78, 90, "airDashStrike", { air: true, dive: true, diveSpeedX: 560, diveSpeedY: 260, softKnockdown: true, meter: 13, anim: "air_dash_strike" });
    attacks.air_heavy_special = attackDef(88, 8, 6, 28, 34, 54, 300, "airCrownDrop", { air: true, dive: true, diveSpeedX: 360, diveSpeedY: 680, softKnockdown: true, meter: 18, anim: "air_crown_drop" });
    attacks.neutral_special = cloneData(attacks.neutral_light_special);
    attacks.forward_special = cloneData(attacks.forward_light_special);
    attacks.down_special = cloneData(attacks.down_light_special);
    attacks.back_special = cloneData(attacks.back_light_special);
    attacks.air_special = cloneData(attacks.air_light_special);
    attacks.special_1 = cloneData(attacks.neutral_light_special);
    attacks.special_2 = cloneData(attacks.neutral_medium_special);
    attacks.special_3 = cloneData(attacks.neutral_heavy_special);
    attacks.launcher = cloneData(attacks.down_heavy);
    addLamuhDirectionalCancelTargets(attacks);
    return attacks;
  }

  function buildLamuhEnemyAttacks() {
    const attacks = cloneData(solEnemyAttacks);
    attacks.enemy_light_attack = attackDef(24, 4, 4, 8, 18, 42, -15, "light", { enemy: true, cancelOnHit: ["enemy_medium_attack"], anim: "quick_palm" });
    attacks.enemy_medium_attack = attackDef(48, 7, 5, 12, 28, 72, -55, "medium", { enemy: true, cancelOnHit: ["enemy_heavy_attack"], anim: "mirror_knuckle" });
    attacks.enemy_heavy_attack = attackDef(78, 11, 5, 20, 40, 112, -320, "heavy", { enemy: true, softKnockdown: true, anim: "crown_breaker" });
    attacks.enemy_forward_heavy = attackDef(84, 11, 5, 20, 42, 112, -385, "heavy", { enemy: true, launcher: true, softKnockdown: true, anim: "crown_breaker" });
    attacks.enemy_neutral_light_special = attackDef(34, 4, 5, 11, 22, 54, -22, "mirrorSpark", { enemy: true, projectile: true, projectileSpeed: 430, noHit: true, anim: "mirror_spark", visualProfile: "mirrorSpark" });
    attacks.enemy_neutral_medium_special = attackDef(58, 8, 6, 16, 30, 98, -44, "mirrorPulse", { enemy: true, projectile: true, projectileSpeed: 500, noHit: true, anim: "mirror_pulse", visualProfile: "mirrorPulse" });
    attacks.enemy_neutral_heavy_special = attackDef(84, 15, 7, 30, 38, 150, -80, "crownBeam", { enemy: true, projectile: true, projectileSpeed: 570, noHit: true, anim: "crown_beam", visualProfile: "crownBeam" });
    attacks.enemy_forward_light_special = attackDef(58, 6, 6, 17, 28, 102, -64, "dashStrike", { enemy: true, dash: true, softKnockdown: true, anim: "dash_strike" });
    attacks.enemy_forward_medium_special = attackDef(72, 9, 6, 22, 32, 122, -110, "mirrorBreak", { enemy: true, dash: true, dashSpeed: 500, dashTime: 0.16, softKnockdown: true, anim: "mirror_break", visualProfile: "mirrorBreak", impactProfile: { hitStop: 0.064, shake: 7, sparkCount: 17, sparkSize: 15, burstSize: 31, speed: 380, life: 0.28, color: "#f7f2df", dramatic: true } });
    attacks.enemy_forward_heavy_special = attackDef(28, 14, 7, 66, 18, 40, -34, "mirrorPierce", { enemy: true, dash: true, dashSpeed: 760, dashTime: 0.22, projectile: true, projectileSpeed: 0, projectileSpawnAt: 0.98, noHit: true, pierceSideSwitch: true, pierceSwitchAt: 0.56, pierceExitOffset: 80, pierceRange: 240, requiresPierceConfirm: true, pierceHitFrame: 18, sideSwitchFrame: 18, palmPoseStartFrame: 19, beamChargeStartFrame: 26, beamFireFrame: 59, beamHitboxStartFrame: 59, beamHitboxEndFrame: 73, recoveryStartFrame: 73, whiffBeamFireFrame: 40, whiffRecoveryEndFrame: 54, maxMirrorPierceFrame: 99, pierceHoldFrames: 46, palmPauseFrames: 41, pierceHitDamage: 28, pierceHitstunFrames: 18, pierceKnockbackX: 40, pierceKnockbackY: -34, beamDamage: 70, beamHitstunFrames: 54, beamKnockbackX: 2400, beamKnockbackY: -390, beamBlockstunFrames: 26, forceWallBounce: true, softKnockdown: true, anim: "mirror_pierce", visualProfile: "mirrorPierce", impactProfile: { hitStop: 0.026, shake: 4, sparkCount: 10, sparkSize: 11, burstSize: 22, speed: 260, life: 0.18, color: "#f7f2df", dramatic: true }, beamImpactProfile: { hitStop: 0.1, shake: 14, sparkCount: 28, sparkSize: 20, burstSize: 44, speed: 540, life: 0.36, color: "#ffe8a3", dramatic: true } });
    attacks.enemy_back_light_special = attackDef(0, 3, 0, 15, 0, 0, 0, "mirrorSlip", { enemy: true, noHit: true, shadowStep: true, shadowStepAway: true, shadowStepSpeed: 850, anim: "mirror_slip" });
    attacks.enemy_back_medium_special = attackDef(52, 10, 5, 20, 28, 82, -58, "reboundStrike", { enemy: true, shadowStep: true, shadowStepAway: true, shadowStepSpeed: 710, reboundSnap: true, reboundSnapSpeed: 520, reboundSnapStart: 0.88, reboundSnapEnd: 0.62, softKnockdown: true, anim: "rebound_strike", visualProfile: "reboundStrike", impactProfile: { hitStop: 0.06, shake: 6, sparkCount: 15, sparkSize: 13, burstSize: 27, speed: 340, life: 0.26, color: "#f7f2df", dramatic: true } });
    attacks.enemy_back_heavy_special = attackDef(78, 16, 6, 32, 34, 126, -95, "mirrorReversal", { enemy: true, shadowStep: true, shadowStepAway: true, shadowStepSpeed: 580, softKnockdown: true, anim: "mirror_reversal" });
    attacks.enemy_down_light_special = attackDef(30, 4, 5, 12, 22, 42, 0, "lowMirrorCut", { enemy: true, anim: "low_mirror_cut" });
    attacks.enemy_down_medium_special = attackDef(56, 8, 6, 21, 28, 88, -32, "groundBreaker", { enemy: true, softKnockdown: true, anim: "ground_breaker", visualProfile: "groundBreaker", impactProfile: { hitStop: 0.058, shake: 6, sparkCount: 15, sparkSize: 13, burstSize: 28, speed: 340, life: 0.26, color: "#ffe08a", dramatic: true } });
    attacks.enemy_down_heavy_special = attackDef(88, 16, 7, 34, 38, 96, -330, "crownRupture", { enemy: true, launcher: true, hardKnockdown: true, anim: "crown_rupture", visualProfile: "crownRupture", impactProfile: { hitStop: 0.092, shake: 13, sparkCount: 23, sparkSize: 19, burstSize: 40, speed: 500, life: 0.34, color: "#ffe08a", dramatic: true } });
    attacks.enemy_up_light_special = attackDef(32, 4, 5, 12, 22, 36, -115, "crownPop", { enemy: true, anim: "crown_pop" });
    attacks.enemy_up_medium_special = attackDef(66, 9, 6, 24, 34, 58, -430, "risingCrown", { enemy: true, rise: true, riseVelocity: -410, riseTime: 0.2, launcher: true, softKnockdown: true, anim: "rising_crown", visualProfile: "risingCrown", impactProfile: { hitStop: 0.066, shake: 8, sparkCount: 17, sparkSize: 15, burstSize: 32, speed: 390, life: 0.28, color: "#fff3ba", dramatic: true } });
    attacks.enemy_up_heavy_special = attackDef(94, 14, 7, 36, 40, 78, -490, "ascendantBreak", { enemy: true, rise: true, riseVelocity: -520, riseTime: 0.26, launcher: true, hardKnockdown: true, anim: "ascendant_break", visualProfile: "ascendantBreak", impactProfile: { hitStop: 0.1, shake: 14, sparkCount: 24, sparkSize: 20, burstSize: 42, speed: 520, life: 0.36, color: "#fff3ba", dramatic: true } });
    attacks.enemy_air_light_special = attackDef(30, 4, 5, 12, 20, 38, 24, "airSpark", { enemy: true, air: true, projectile: true, projectileSpeed: 390, noHit: true, anim: "air_mirror_spark" });
    attacks.enemy_air_medium_special = attackDef(52, 6, 6, 20, 28, 78, 82, "airDashStrike", { enemy: true, air: true, dive: true, diveSpeedX: 520, diveSpeedY: 230, softKnockdown: true, anim: "air_dash_strike" });
    attacks.enemy_air_heavy_special = attackDef(80, 10, 6, 30, 32, 56, 285, "airCrownDrop", { enemy: true, air: true, dive: true, diveSpeedX: 330, diveSpeedY: 640, softKnockdown: true, anim: "air_crown_drop" });
    attacks.enemy_neutral_special = cloneData(attacks.enemy_neutral_light_special);
    attacks.enemy_forward_special = cloneData(attacks.enemy_forward_light_special);
    attacks.enemy_down_special = cloneData(attacks.enemy_down_light_special);
    attacks.enemy_back_special = cloneData(attacks.enemy_back_light_special);
    attacks.enemy_air_special = cloneData(attacks.enemy_air_light_special);
    attacks.enemy_special_1 = cloneData(attacks.enemy_neutral_light_special);
    attacks.enemy_special_2 = cloneData(attacks.enemy_neutral_medium_special);
    attacks.enemy_special_3 = cloneData(attacks.enemy_neutral_heavy_special);
    attacks.enemy_launcher = cloneData(attacks.enemy_forward_heavy);
    attacks.enemy_jump_light = cloneData(solPlayerAttacks.jump_light);
    attacks.enemy_jump_medium = cloneData(solPlayerAttacks.jump_medium);
    attacks.enemy_jump_heavy = cloneData(solPlayerAttacks.jump_heavy);
    for (const key of ["enemy_jump_light", "enemy_jump_medium", "enemy_jump_heavy"]) {
      attacks[key].flags.enemy = true;
    }
    addLamuhDirectionalCancelTargets(attacks, "enemy_");
    return attacks;
  }

  const LAMUH_LEGACY_ALLOWED_PLAYER_MOVES = new Set([
    "neutral_light", "neutral_medium", "neutral_heavy",
    "forward_light", "forward_medium", "forward_heavy",
    "back_light", "back_medium", "back_heavy",
    "down_light", "down_medium", "down_heavy",
    "jump_light", "jump_medium", "jump_heavy",
    "launcher",
    "special_1", "special_2", "special_3",
    "neutral_special", "forward_special", "up_special", "down_special", "back_special", "air_special",
    "super_dash", "ultimate"
  ]);
  const LAMUH_LEGACY_ALLOWED_ENEMY_MOVES = new Set([...LAMUH_LEGACY_ALLOWED_PLAYER_MOVES].map((key) => `enemy_${key}`));

  function stripLamuhLegacyCancelTargets(move, allowedMoves) {
    const cancelOnHit = move?.flags?.cancelOnHit;
    if (!Array.isArray(cancelOnHit)) return;
    move.flags.cancelOnHit = cancelOnHit.filter((target) => allowedMoves.has(target));
  }

  function buildLamuhLegacyPlayerAttacks() {
    const attacks = buildLamuhPlayerAttacks();
    const special1 = cloneData(attacks.neutral_light_special);
    const special2 = cloneData(attacks.forward_light_special);
    const special3 = cloneData(attacks.up_medium_special);
    const backSpecial = cloneData(attacks.back_light_special);
    const airSpecial = cloneData(attacks.air_medium_special);
    special1.flags.anim = "celestial_palm";
    special2.flags.anim = "ascend_step";
    special3.flags.anim = "heaven_splitter";
    backSpecial.flags.anim = "divine_vanish";
    airSpecial.flags.anim = "radiant_dive";
    attacks.special_1 = cloneData(special1);
    attacks.neutral_special = cloneData(special1);
    attacks.special_2 = cloneData(special2);
    attacks.forward_special = cloneData(special2);
    attacks.special_3 = cloneData(special3);
    attacks.up_special = cloneData(special3);
    attacks.down_special = cloneData(special3);
    attacks.back_special = cloneData(backSpecial);
    attacks.air_special = cloneData(airSpecial);
    for (const key of Object.keys(attacks)) {
      if (!LAMUH_LEGACY_ALLOWED_PLAYER_MOVES.has(key)) delete attacks[key];
    }
    Object.values(attacks).forEach((move) => stripLamuhLegacyCancelTargets(move, LAMUH_LEGACY_ALLOWED_PLAYER_MOVES));
    return attacks;
  }

  function buildLamuhLegacyEnemyAttacks() {
    const attacks = buildLamuhEnemyAttacks();
    const special1 = cloneData(attacks.enemy_neutral_light_special);
    const special2 = cloneData(attacks.enemy_forward_light_special);
    const special3 = cloneData(attacks.enemy_up_medium_special);
    const backSpecial = cloneData(attacks.enemy_back_light_special);
    const airSpecial = cloneData(attacks.enemy_air_medium_special);
    special1.flags.anim = "celestial_palm";
    special2.flags.anim = "ascend_step";
    special3.flags.anim = "heaven_splitter";
    backSpecial.flags.anim = "divine_vanish";
    airSpecial.flags.anim = "radiant_dive";
    attacks.enemy_special_1 = cloneData(special1);
    attacks.enemy_neutral_special = cloneData(special1);
    attacks.enemy_special_2 = cloneData(special2);
    attacks.enemy_forward_special = cloneData(special2);
    attacks.enemy_special_3 = cloneData(special3);
    attacks.enemy_up_special = cloneData(special3);
    attacks.enemy_down_special = cloneData(special3);
    attacks.enemy_back_special = cloneData(backSpecial);
    attacks.enemy_air_special = cloneData(airSpecial);
    for (const key of Object.keys(attacks)) {
      if (!LAMUH_LEGACY_ALLOWED_ENEMY_MOVES.has(key)) delete attacks[key];
    }
    Object.values(attacks).forEach((move) => stripLamuhLegacyCancelTargets(move, LAMUH_LEGACY_ALLOWED_ENEMY_MOVES));
    return attacks;
  }

  function addLamuhDirectionalCancelTargets(attacks, prefix = "") {
    const lamuhTargets = [
      "neutral_special", "forward_special", "down_special", "back_special", "air_special",
      "neutral_light_special", "neutral_medium_special", "neutral_heavy_special",
      "forward_light_special", "forward_medium_special", "forward_heavy_special",
      "back_light_special", "back_medium_special", "back_heavy_special",
      "down_light_special", "down_medium_special", "down_heavy_special",
      "up_light_special", "up_medium_special", "up_heavy_special",
      "air_light_special", "air_medium_special", "air_heavy_special"
    ].map((target) => `${prefix}${target}`);
    Object.values(attacks).forEach((move) => {
      const cancelOnHit = move?.flags?.cancelOnHit;
      if (!Array.isArray(cancelOnHit)) return;
      for (const target of lamuhTargets) {
        if (!cancelOnHit.includes(target)) cancelOnHit.push(target);
      }
    });
  }

  const lamuhMovementStats = {
    ...cloneData(baselineMovementStats),
    walkForward: 236,
    walkBack: 184,
    dashSpeed: 875,
    dashDuration: 15 / 60,
    dashCooldown: 18 / 60,
    superDashSpeed: 930,
    superDashCooldown: 28 / 60
  };

  const lamuhJumpStats = {
    ...cloneData(baselineJumpStats),
    jumpVelocity: -742,
    gravity: 1840,
    juggleGravity: 1260,
    airRecoveryGravity: 1660,
    landingRecovery: 6 / 60
  };

  const lamuhAirDashStats = {
    ...cloneData(baselineAirDashStats),
    speed: 810,
    duration: 12 / 60,
    cooldown: 18 / 60
  };

  const lamuhHitboxes = {
    ...cloneData(baselineHitboxes),
    launcher: { w: 118, h: 132, ox: 42, oy: -134 },
    airLight: { w: 86, h: 54, ox: 38, oy: -84 },
    airMedium: { w: 126, h: 70, ox: 46, oy: -92 },
    airHeavy: { w: 132, h: 98, ox: 42, oy: -70 },
    mirrorSpark: { w: 92, h: 46, ox: 56, oy: -96 },
    mirrorPulse: { w: 150, h: 66, ox: 70, oy: -104 },
    crownBeam: { w: 210, h: 78, ox: 82, oy: -112 },
    dashStrike: { w: 138, h: 64, ox: 58, oy: -86 },
    mirrorBreak: { w: 166, h: 76, ox: 62, oy: -94 },
    mirrorPierce: { w: 188, h: 84, ox: 66, oy: -96 },
    mirrorSlip: { w: 0, h: 0, ox: 0, oy: 0 },
    reboundStrike: { w: 142, h: 66, ox: 54, oy: -86 },
    mirrorReversal: { w: 176, h: 78, ox: 62, oy: -96 },
    lowMirrorCut: { w: 126, h: 34, ox: 50, oy: -38 },
    groundBreaker: { w: 156, h: 48, ox: 58, oy: -46 },
    crownRupture: { w: 190, h: 96, ox: 64, oy: -90 },
    crownPop: { w: 96, h: 110, ox: 32, oy: -132 },
    risingCrown: { w: 124, h: 150, ox: 38, oy: -164 },
    ascendantBreak: { w: 150, h: 176, ox: 44, oy: -184 },
    airSpark: { w: 86, h: 48, ox: 48, oy: -86 },
    airDashStrike: { w: 136, h: 74, ox: 54, oy: -92 },
    airCrownDrop: { w: 128, h: 104, ox: 42, oy: -70 },
    dive: { w: 122, h: 96, ox: 50, oy: -106 }
  };

  const LAMUH_NEUTRAL_SPECIAL_BODY_CROPS = {
    mirror_pulse: { left: 0, right: 132 },
    crown_beam: { left: 0, right: 164 },
    crown_beam_charge: { left: 0, right: 164 },
    crown_beam_fire: { left: 0, right: 164 },
    crown_beam_recovery: { left: 0, right: 164 }
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

  const celesteSpiritColors = {
    DO: { main: "#ffd66b", secondary: "#fff8de" },
    RE: { main: "#d83d7f", secondary: "#8b46ff" },
    MI: { main: "#4bb6ff", secondary: "#ffd86b" },
    FA: { main: "#48e4ff", secondary: "#d89cff" },
    SOL: { main: "#ffc83d", secondary: "#fff2a8" },
    LA: { main: "#f8fff0", secondary: "#8effb5" },
    TI: { main: "#f8f8ff", secondary: "#9b5cff" }
  };
  const CELESTE_VFX_FRAME_COUNTS = [5, 5, 5, 5, 6, 6, 5, 5, 7, 6];

  const CELESTE_FA_COOLDOWN = 1.05;
  const CELESTE_FA_WINDOW = 0.18;
  const CELESTE_SOL_COOLDOWN = 0.72;
  const CELESTE_LA_COOLDOWN = 2.8;
  const CELESTE_LA_ACTIVE = 0.78;
  const CELESTE_TI_COOLDOWN = 1.65;
  const CELESTE_TI_ARM_TIME = 0.55;
  const CELESTE_TI_DETONATE_TIME = 1.25;
  const CELESTE_TI_LIFE = 1.8;
  const CELESTE_TI_DAMAGE = 46;
  const CELESTE_TI_HITSTUN = 24;
  const CELESTE_AIR_L_BOUNCE_VY = -430;
  const CELESTE_AIR_L_BOUNCE_HITSTUN = 0.5;
  const CELESTE_OCTAVA_STARTUP_FRAMES = 28;
  const CELESTE_OCTAVA_ACTIVE_FRAMES = 18;
  const CELESTE_OCTAVA_RECOVERY_FRAMES = 54;

  const celesteMovementStats = {
    ...cloneData(nyxMovementStats),
    walkForward: 270,
    walkBack: 205,
    dashSpeed: 910,
    dashDuration: 13 / 60,
    dashCooldown: 20 / 60,
    superDashSpeed: 940,
    superDashCooldown: 30 / 60
  };

  const celesteJumpStats = {
    ...cloneData(nyxJumpStats),
    jumpVelocity: -735,
    gravity: 1760,
    juggleGravity: 1260,
    airRecoveryGravity: 1640,
    airRecoveryDuration: 15 / 60,
    landingRecovery: 6 / 60
  };

  const celesteAirDashStats = {
    ...cloneData(nyxAirDashStats),
    speed: 830,
    duration: 11 / 60,
    cooldown: 16 / 60
  };

  const celesteHitboxes = {
    light: { w: 80, h: 54, ox: 36, oy: -76 },
    medium: { w: 112, h: 62, ox: 44, oy: -84 },
    heavy: { w: 136, h: 82, ox: 52, oy: -96 },
    up: { w: 92, h: 132, ox: 28, oy: -158 },
    jump: { w: 108, h: 70, ox: 40, oy: -88 },
    trick: { w: 148, h: 60, ox: 52, oy: -86 },
    trap: { w: 112, h: 112, ox: 74, oy: -122 },
    ultimate: { w: 590, h: 156, ox: 104, oy: -128 }
  };

  const celestePlayerAttacks = {
    neutral_light: attackDef(24, 2, 5, 5, 19, 14, -18, "light", { autoCombo: true, cancelOnHit: ["neutral_medium"], dashCancel: true, stepForward: 74 }),
    neutral_medium: attackDef(44, 4, 6, 9, 31, 30, -66, "medium", { cancelOnHit: ["neutral_heavy", "special_1", "special_2"], jumpCancel: true, dashCancel: true, stepForward: 92 }),
    neutral_heavy: attackDef(68, 8, 5, 17, 43, 88, -245, "heavy", { cancelOnHit: ["up_medium", "special_2"], jumpCancel: true, dashCancel: true, softKnockdown: true }),
    forward_light: attackDef(28, 3, 4, 7, 20, 48, -16, "light", { cancelOnHit: ["forward_medium", "neutral_medium"], dashCancel: true, stepForward: 112 }),
    forward_medium: attackDef(48, 5, 5, 10, 32, 78, -58, "medium", { cancelOnHit: ["forward_heavy", "up_medium", "special_1", "special_2"], jumpCancel: true, dashCancel: true, stepForward: 86 }),
    forward_heavy: attackDef(74, 9, 5, 19, 42, 118, -180, "heavy", { cancelOnHit: ["special_2"], dashCancel: true, softKnockdown: true }),
    back_light: attackDef(24, 3, 4, 8, 20, 36, -18, "light", { cancelOnHit: ["neutral_medium"], dashCancel: true }),
    back_medium: attackDef(44, 5, 5, 11, 31, 64, -62, "medium", { cancelOnHit: ["back_heavy", "special_2"], jumpCancel: true, dashCancel: true }),
    back_heavy: attackDef(66, 8, 5, 20, 42, 60, -360, "heavy", { cancelOnHit: ["up_medium"], jumpCancel: true, dashCancel: true, softKnockdown: true }),
    up_light: attackDef(22, 3, 5, 6, 22, 22, -110, "up", { cancelOnHit: ["up_medium"], jumpCancel: true, dashCancel: true }),
    up_medium: attackDef(46, 6, 6, 13, 42, 46, -500, "up", { launcher: true, cancelOnHit: ["jump_light", "special_2"], jumpCancel: true, dashCancel: true, softKnockdown: true }),
    up_heavy: attackDef(72, 9, 6, 22, 48, 64, -545, "up", { launcher: true, jumpCancel: true, dashCancel: true, softKnockdown: true }),
    down_light: attackDef(24, 3, 4, 7, 19, 34, 0, "light", { cancelOnHit: ["neutral_medium"] }),
    down_medium: attackDef(42, 5, 4, 10, 30, 50, -34, "medium", { cancelOnHit: ["up_medium"], jumpCancel: true, dashCancel: true }),
    down_heavy: attackDef(62, 8, 5, 18, 46, 56, -500, "up", { launcher: true, jumpCancel: true, dashCancel: true, softKnockdown: true }),
    jump_light: attackDef(22, 2, 5, 4, 24, 28, -14, "jump", { air: true, cancelOnHit: ["jump_medium"], dashCancel: true }),
    jump_medium: attackDef(42, 4, 6, 8, 34, 40, -32, "jump", { air: true, cancelOnHit: ["jump_heavy", "special_2"], dashCancel: true }),
    jump_heavy: attackDef(64, 7, 6, 16, 40, 54, 230, "jump", { air: true, softKnockdown: true, dashCancel: true }),
    special_1: attackDef(0, 3, 5, 17, 0, 0, 0, "trick", { noHit: true, faStrobe: true, dash: true, dashCancel: true, anim: "fa_strobe" }),
    special_2: attackDef(50, 11, 7, 25, 30, 82, -52, "medium", { projectile: true, solOvation: true, projectileSpeed: 560, noHit: true, anim: "sol_ovation" }),
    special_3: attackDef(0, 24, 4, 25, 0, 0, 0, "trap", { noHit: true, tiEncore: true, anim: "ti_encore" }),
    back_special: attackDef(0, 5, 6, 24, 0, 0, 0, "trick", { noHit: true, laBarrier: true, anim: "la_seraph_waltz" }),
    super_dash: attackDef(52, 3, 22, 9, 33, 98, -230, "trick", { superDash: true, dashCancel: true, anim: "fa_strobe", blockstun: 21, meter: 10 }),
    ultimate: attackDef(225, CELESTE_OCTAVA_STARTUP_FRAMES, CELESTE_OCTAVA_ACTIVE_FRAMES, CELESTE_OCTAVA_RECOVERY_FRAMES, 54, 360, -270, "ultimate", { ultimate: true, hardKnockdown: true, anim: "octava", blockstun: 34 }),
    taunt: attackDef(0, 0, 0, 30, 0, 0, 0, "light", { noHit: true })
  };

  const celesteEnemyAttacks = {
    enemy_light_attack: attackDef(24, 4, 4, 9, 20, 48, -14, "light", { enemy: true, cancelOnHit: ["enemy_medium_attack"] }),
    enemy_medium_attack: attackDef(42, 6, 5, 12, 30, 76, -55, "medium", { enemy: true, cancelOnHit: ["enemy_heavy_attack"] }),
    enemy_heavy_attack: attackDef(62, 10, 5, 20, 42, 96, -310, "heavy", { enemy: true, softKnockdown: true }),
    enemy_forward_light: attackDef(26, 4, 4, 9, 20, 54, -14, "light", { enemy: true, cancelOnHit: ["enemy_forward_medium"] }),
    enemy_forward_medium: attackDef(44, 7, 5, 13, 31, 86, -52, "medium", { enemy: true, cancelOnHit: ["enemy_forward_heavy"] }),
    enemy_forward_heavy: attackDef(70, 11, 5, 21, 42, 118, -180, "heavy", { enemy: true, softKnockdown: true }),
    enemy_back_light: attackDef(24, 4, 4, 9, 20, 42, -14, "light", { enemy: true, cancelOnHit: ["enemy_medium_attack"] }),
    enemy_back_medium: attackDef(42, 7, 5, 13, 31, 70, -55, "medium", { enemy: true, cancelOnHit: ["enemy_back_heavy"] }),
    enemy_back_heavy: attackDef(62, 10, 5, 22, 42, 72, -310, "heavy", { enemy: true, softKnockdown: true }),
    enemy_up_light: attackDef(22, 4, 5, 8, 22, 28, -105, "up", { enemy: true, cancelOnHit: ["enemy_up_medium"] }),
    enemy_up_medium: attackDef(42, 8, 5, 15, 40, 54, -460, "up", { enemy: true, launcher: true, softKnockdown: true }),
    enemy_up_heavy: attackDef(66, 11, 5, 24, 46, 70, -500, "up", { enemy: true, launcher: true, softKnockdown: true }),
    enemy_down_light: attackDef(22, 4, 4, 9, 19, 36, 0, "light", { enemy: true, cancelOnHit: ["enemy_medium_attack"] }),
    enemy_down_medium: attackDef(40, 7, 4, 13, 30, 58, -32, "medium", { enemy: true, cancelOnHit: ["enemy_up_medium"] }),
    enemy_down_heavy: attackDef(60, 10, 5, 20, 44, 62, -460, "up", { enemy: true, launcher: true, softKnockdown: true }),
    enemy_jump_light: attackDef(22, 4, 5, 6, 24, 28, -14, "jump", { enemy: true, air: true, cancelOnHit: ["enemy_jump_medium"] }),
    enemy_jump_medium: attackDef(40, 6, 5, 10, 33, 42, -28, "jump", { enemy: true, air: true, cancelOnHit: ["enemy_jump_heavy"] }),
    enemy_jump_heavy: attackDef(60, 9, 5, 18, 40, 54, 220, "jump", { enemy: true, air: true, softKnockdown: true }),
    enemy_special_1: attackDef(0, 4, 5, 18, 0, 0, 0, "trick", { enemy: true, noHit: true, faStrobe: true, dash: true, anim: "fa_strobe" }),
    enemy_special_2: attackDef(46, 13, 7, 27, 28, 88, -48, "medium", { enemy: true, projectile: true, solOvation: true, projectileSpeed: 530, noHit: true, anim: "sol_ovation" }),
    enemy_special_3: attackDef(0, 27, 4, 28, 0, 0, 0, "trap", { enemy: true, noHit: true, tiEncore: true, anim: "ti_encore" }),
    enemy_back_special: attackDef(0, 6, 6, 26, 0, 0, 0, "trick", { enemy: true, noHit: true, laBarrier: true, anim: "la_seraph_waltz" }),
    enemy_super_dash: attackDef(50, 4, 22, 10, 32, 100, -220, "trick", { enemy: true, superDash: true, dashCancel: true, anim: "fa_strobe", blockstun: 21 }),
    enemy_ultimate: attackDef(205, 32, 16, 56, 50, 330, -270, "ultimate", { enemy: true, ultimate: true, hardKnockdown: true, anim: "octava", blockstun: 32 })
  };

  const celesteComboRoutes = {
    autoCombos: {
      neutral_light: "neutral_medium",
      neutral_medium: "neutral_heavy",
      up_light: "up_medium",
      enemy_light_attack: "enemy_medium_attack",
      enemy_medium_attack: "enemy_heavy_attack",
      enemy_up_light: "enemy_up_medium"
    },
    airCombos: {
      jump_light: "jump_medium",
      jump_medium: "jump_heavy",
      enemy_jump_light: "enemy_jump_medium",
      enemy_jump_medium: "enemy_jump_heavy"
    }
  };

  const celesteSpecialMoves = {
    special_1: { type: "faStrobe", attack: "special_1" },
    special_2: { type: "solOvation", attack: "special_2", projectileWidth: 96, projectileHeight: 24, projectileLife: 0.86, spawnOffsetX: 108, spawnOffsetY: -90 },
    special_3: { type: "tiEncore", attack: "special_3" },
    back_special: { type: "laSeraphWaltz", attack: "back_special" },
    super_dash: { type: "homingDash", attack: "super_dash" },
    ultimate: { type: "ultimate", attack: "ultimate" }
  };

  const CELESTE_DEFAULT_SOCKETS = {
    root: { x: 0, y: 0 },
    feetBase: { x: 0, y: 0 },
    torsoCenter: { x: 2, y: -108 },
    headCenter: { x: 0, y: -176 },
    frontHand: { x: 42, y: -118 },
    backHand: { x: -34, y: -116 },
    batonTip: { x: 92, y: -132 },
    frontPalm: { x: 70, y: -108 },
    projectileOrigin: { x: 104, y: -102 },
    trapPlacementOrigin: { x: 126, y: -72 },
    barrierCenter: { x: 4, y: -112 },
    octavaOrigin: { x: -62, y: -158 },
    beamOrigin: { x: 112, y: -126 }
  };

  const CELESTE_AIR_SOCKET_OFFSETS = {
    torsoCenter: { y: 12 },
    headCenter: { y: 8 },
    frontHand: { y: 10 },
    backHand: { y: 10 },
    batonTip: { y: 8 },
    frontPalm: { y: 10 },
    projectileOrigin: { y: 12 },
    trapPlacementOrigin: { y: 8 },
    barrierCenter: { y: 10 },
    octavaOrigin: { y: 8 },
    beamOrigin: { y: 8 }
  };

  const CELESTE_ANIMATION_DRAW_META = {
    idle: { rootType: "grounded", frameTiming: 0.72 },
    walk_forward: { rootType: "grounded", frameTiming: 0.56 },
    walk_back: { rootType: "grounded", frameTiming: 0.56 },
    crouch: { rootType: "grounded", sockets: { torsoCenter: { y: -82 }, headCenter: { y: -135 }, frontHand: { y: -92 }, batonTip: { x: 86, y: -104 }, frontPalm: { x: 62, y: -90 }, barrierCenter: { y: -88 } } },
    jump_start: { rootType: "grounded" },
    jump_up: { rootType: "airborne" },
    rising: { rootType: "airborne" },
    fall: { rootType: "airborne" },
    neutral_air_drift: { rootType: "airborne" },
    landing: { rootType: "grounded", frameTiming: 0.24 },
    block: { rootType: "grounded", sockets: { barrierCenter: { x: 12, y: -110 }, frontHand: { x: 38, y: -116 }, batonTip: { x: 78, y: -130 } } },
    guard_idle: { rootType: "grounded", sockets: { barrierCenter: { x: 12, y: -110 }, frontHand: { x: 38, y: -116 }, batonTip: { x: 78, y: -130 } } },
    damaged: { rootType: "grounded" },
    knockback: { rootType: "grounded", drawOffsetX: -6 },
    launch_hitstun: { rootType: "airborne" },
    air_hitstun: { rootType: "airborne" },
    knockdown_fall: { rootType: "knockdown", sockets: { torsoCenter: { y: -44 }, headCenter: { x: -22, y: -56 }, frontHand: { x: 42, y: -34 }, batonTip: { x: 82, y: -42 }, barrierCenter: { y: -50 } } },
    grounded: { rootType: "knockdown", sockets: { torsoCenter: { y: -34 }, headCenter: { x: -30, y: -42 }, frontHand: { x: 44, y: -24 }, batonTip: { x: 80, y: -30 }, barrierCenter: { y: -42 } } },
    downed: { rootType: "knockdown" },
    get_up: { rootType: "knockdown" },
    death: { rootType: "knockdown" },
    ko: { rootType: "knockdown" },
    defeat: { rootType: "knockdown" },
    neutral_light: { rootType: "grounded", frameTiming: 0.18, sockets: { frontPalm: { x: 84, y: -106 }, batonTip: { x: 104, y: -124 } } },
    neutral_medium: { rootType: "grounded", frameTiming: 0.26, sockets: { batonTip: { x: 112, y: -132 }, frontHand: { x: 56, y: -120 } } },
    neutral_heavy: { rootType: "grounded", frameTiming: 0.34, sockets: { frontPalm: { x: 96, y: -104 }, batonTip: { x: 116, y: -116 } } },
    forward_light: { rootType: "grounded", frameTiming: 0.2, sockets: { frontPalm: { x: 96, y: -104 }, batonTip: { x: 112, y: -122 } } },
    forward_medium: { rootType: "grounded", frameTiming: 0.28, sockets: { batonTip: { x: 128, y: -128 }, frontHand: { x: 72, y: -118 } } },
    forward_heavy: { rootType: "grounded", frameTiming: 0.38, sockets: { frontPalm: { x: 118, y: -96 }, batonTip: { x: 138, y: -110 } } },
    back_light: { rootType: "grounded", frameTiming: 0.22, sockets: { frontPalm: { x: 62, y: -104 }, batonTip: { x: 82, y: -122 } } },
    back_medium: { rootType: "grounded", frameTiming: 0.3, sockets: { batonTip: { x: 92, y: -126 }, barrierCenter: { x: 0, y: -112 } } },
    back_heavy: { rootType: "grounded", frameTiming: 0.4, sockets: { frontPalm: { x: 74, y: -98 }, batonTip: { x: 92, y: -110 } } },
    up_light: { rootType: "grounded", frameTiming: 0.2, sockets: { frontPalm: { x: 56, y: -148 }, batonTip: { x: 76, y: -172 } } },
    up_medium: { rootType: "grounded", frameTiming: 0.3, sockets: { batonTip: { x: 78, y: -184 }, frontHand: { x: 46, y: -142 } } },
    up_heavy: { rootType: "grounded", frameTiming: 0.42, sockets: { frontPalm: { x: 72, y: -154 }, batonTip: { x: 88, y: -188 } } },
    jump_light: { rootType: "airborne", frameTiming: 0.2, sockets: { frontPalm: { x: 76, y: -84 }, batonTip: { x: 96, y: -98 } } },
    jump_medium: { rootType: "airborne", frameTiming: 0.28, sockets: { batonTip: { x: 116, y: -100 }, frontHand: { x: 56, y: -92 } } },
    jump_heavy: { rootType: "airborne", frameTiming: 0.38, sockets: { frontPalm: { x: 72, y: -58 }, batonTip: { x: 84, y: -68 }, feetBase: { x: 12, y: -18 } } },
    fa_strobe: { rootType: "grounded", frameTiming: 0.24, sockets: { torsoCenter: { x: -6, y: -104 }, batonTip: { x: 84, y: -124 }, frontPalm: { x: 62, y: -102 } } },
    air_dash_forward: { rootType: "airborne" },
    air_dash_back: { rootType: "airborne" },
    sol_ovation: { rootType: "grounded", frameTiming: 0.42, sockets: { projectileOrigin: { x: 116, y: -102 }, batonTip: { x: 110, y: -116 }, beamOrigin: { x: 118, y: -112 } } },
    la_seraph_waltz: { rootType: "grounded", frameTiming: 0.46, sockets: { barrierCenter: { x: 6, y: -112 }, frontHand: { x: 38, y: -118 }, batonTip: { x: 76, y: -132 } } },
    ti_encore: { rootType: "grounded", frameTiming: 0.54, sockets: { trapPlacementOrigin: { x: 118, y: -68 }, batonTip: { x: 96, y: -116 } } },
    octava_startup: { rootType: "ultimateLarge", frameTiming: 0.48, sockets: { octavaOrigin: { x: -62, y: -176 }, beamOrigin: { x: 126, y: -136 }, batonTip: { x: 118, y: -148 } } },
    octava_fire: { rootType: "ultimateLarge", frameTiming: 0.62, sockets: { octavaOrigin: { x: -70, y: -178 }, beamOrigin: { x: 146, y: -132 }, batonTip: { x: 134, y: -126 } } },
    ultimate: { rootType: "ultimateLarge" },
    victory: { rootType: "grounded", frameTiming: 0.62 }
  };

  const CELESTE_MOVE_VFX = {
    neutral_light: { spirit: "DO", row: 0, socket: "frontPalm", layer: "front", scale: 0.34, alpha: 0.74 },
    forward_light: { spirit: "DO", row: 0, socket: "frontPalm", layer: "front", scale: 0.36, alpha: 0.72 },
    up_light: { spirit: "DO", row: 0, socket: "frontPalm", layer: "front", scale: 0.34, alpha: 0.72, rotation: -0.7 },
    jump_light: { spirit: "DO", row: 0, socket: "frontPalm", layer: "front", scale: 0.32, alpha: 0.7 },
    neutral_medium: { spirit: "RE", row: 1, socket: "batonTip", layer: "front", scale: 0.45, alpha: 0.76 },
    forward_medium: { spirit: "RE", row: 1, socket: "batonTip", layer: "front", scale: 0.52, alpha: 0.78 },
    up_medium: { spirit: "RE", row: 1, socket: "batonTip", layer: "front", scale: 0.5, alpha: 0.78, rotation: -0.65 },
    jump_medium: { spirit: "RE", row: 1, socket: "batonTip", layer: "front", scale: 0.48, alpha: 0.76 },
    back_medium: { spirit: "RE", row: 1, socket: "batonTip", layer: "front", scale: 0.42, alpha: 0.66 },
    neutral_heavy: { spirit: "MI", row: 2, socket: "frontPalm", layer: "front", scale: 0.54, alpha: 0.76 },
    forward_heavy: { spirit: "MI", row: 2, socket: "frontPalm", layer: "front", scale: 0.64, alpha: 0.78 },
    back_heavy: { spirit: "MI", row: 2, socket: "frontPalm", layer: "front", scale: 0.56, alpha: 0.72 },
    up_heavy: { spirit: "MI", row: 2, socket: "batonTip", layer: "front", scale: 0.62, alpha: 0.78, rotation: -0.8 },
    jump_heavy: { spirit: "MI", row: 2, socket: "frontPalm", layer: "front", scale: 0.58, alpha: 0.78 },
    special_2: { spirit: "SOL", row: 4, socket: "projectileOrigin", layer: "front", scale: 0.44, alpha: 0.72 },
    special_3: { spirit: "TI", row: 6, socket: "trapPlacementOrigin", layer: "front", scale: 0.38, alpha: 0.72 }
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
    lamuh: {
      id: "lamuh",
      name: "LAMUH",
      shortName: "LAMUH",
      subtitle: "CELESTIAL KI",
      role: "KI RUSH FIGHTER",
      health: PLAYER_MAX_HP,
      movement: cloneData(lamuhMovementStats),
      jump: cloneData(lamuhJumpStats),
      airDash: cloneData(lamuhAirDashStats),
      attacks: {
        player: buildLamuhPlayerAttacks(),
        enemy: buildLamuhEnemyAttacks()
      },
      comboRoutes: cloneData(baselineComboRoutes),
      hitboxes: cloneData(lamuhHitboxes),
      hurtboxes: {
        standing: { w: 66, h: 164 },
        crouching: { w: 66, h: 94 },
        dead: { w: 74, h: 62 }
      },
      specialMoves: cloneData(lamuhSpecialMoves),
      ai: cloneData(baselineEnemyAI),
      effects: { dashTrail: true },
      projectileColor: "#f7f2df",
      trailColor: "#d6a638",
      ultimateBurstColor: "#ffe08a",
      hurtboxWidth: 66,
      playable: true,
      hiddenDevOnly: false,
      futurePlayer2: true,
      sheets: {
        sheet1Redesign: "lamuhSheet1CoreNormalsRedesign",
        forwardSpecialsRedesign: "lamuhForwardSpecialsRedesign",
        downUpSpecialsRedesign: "lamuhDownUpSpecialsRedesign",
        backNeutralSpecialsRedesign: "lamuhBackNeutralSpecialsRedesign",
        neutralSpecialsBodyVfxRedesign: "lamuhNeutralSpecialsBodyVfxRedesign",
        reactionsDefenseRedesign: "lamuhReactionsDefenseRedesign",
        airCrouchJumpRedesign: "lamuhAirCrouchJumpRedesign",
        secondaryMovementDirectionalNormalsRedesign: "lamuhSecondaryMovementDirectionalNormalsRedesign",
        superAscendedGoldenLocs: "lamuhSuperAscendedGoldenLocs"
      },
      buildPlayerAnimations: buildLamuhFinalPlayerAnimations,
      buildEnemyAnimations: buildLamuhFinalEnemyAnimations
    },
    lamuh_legacy: {
      id: "lamuh_legacy",
      name: "LAMUH LEGACY",
      shortName: "LEGACY",
      subtitle: "CLASSIC CELESTIAL KI",
      role: "CLASSIC KI RUSH",
      health: PLAYER_MAX_HP,
      movement: cloneData(lamuhMovementStats),
      jump: cloneData(lamuhJumpStats),
      airDash: cloneData(lamuhAirDashStats),
      attacks: {
        player: buildLamuhLegacyPlayerAttacks(),
        enemy: buildLamuhLegacyEnemyAttacks()
      },
      comboRoutes: cloneData(baselineComboRoutes),
      hitboxes: cloneData(lamuhHitboxes),
      hurtboxes: {
        standing: { w: 66, h: 164 },
        crouching: { w: 66, h: 94 },
        dead: { w: 74, h: 62 }
      },
      specialMoves: cloneData(lamuhLegacySpecialMoves),
      ai: cloneData(baselineEnemyAI),
      effects: { dashTrail: true },
      projectileColor: "#f7f2df",
      trailColor: "#d6a638",
      ultimateBurstColor: "#ffe08a",
      hurtboxWidth: 66,
      playable: true,
      hiddenDevOnly: false,
      futurePlayer2: true,
      legacyCharacterOf: "lamuh",
      specialRouting: "lamuh_legacy_simple",
      sheets: {
        coreMovement: "lamuhFinalCoreMovement",
        airMovement: "lamuhFinalAirMovement",
        groundNormals: "lamuhFinalGroundNormals",
        airNormals: "lamuhFinalAirNormals",
        specials: "lamuhFinalSpecials",
        defense: "lamuhFinalDefense",
        endStates: "lamuhFinalEndStates",
        crownBody: "lamuhCrownBody"
      },
      buildPlayerAnimations: buildLamuhLegacyPlayerAnimations,
      buildEnemyAnimations: buildLamuhLegacyEnemyAnimations
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
    },
    celeste: {
      id: "celeste",
      name: "CELESTE",
      shortName: "CELESTE",
      subtitle: "CONDUCTOR OF THE SEVEN SPIRITS",
      role: "TRICKSTER RUSHDOWN",
      health: 880,
      movement: cloneData(celesteMovementStats),
      jump: cloneData(celesteJumpStats),
      airDash: cloneData(celesteAirDashStats),
      attacks: {
        player: cloneData(celestePlayerAttacks),
        enemy: cloneData(celesteEnemyAttacks)
      },
      comboRoutes: cloneData(celesteComboRoutes),
      hitboxes: cloneData(celesteHitboxes),
      hurtboxes: {
        standing: { w: 58, h: 154 },
        crouching: { w: 58, h: 88 },
        dead: { w: 76, h: 56 }
      },
      specialMoves: cloneData(celesteSpecialMoves),
      ai: {
        ...cloneData(nyxEnemyAI),
        farRange: 235,
        farAttack: "enemy_special_2",
        weightedAttacks: [
          { threshold: 0.38, move: "enemy_light_attack" },
          { threshold: 0.62, move: "enemy_medium_attack" },
          { threshold: 0.8, move: "enemy_forward_medium" },
          { threshold: 0.92, move: "enemy_up_medium" }
        ],
        fallbackAttack: "enemy_special_1"
      },
      effects: { dashTrail: true, placeholderSpirits: false },
      vfx: {
        placeholderOnly: false,
        atlas: "celesteFinalVfx",
        spiritColors: cloneData(celesteSpiritColors)
      },
      projectileColor: celesteSpiritColors.SOL.main,
      trailColor: celesteSpiritColors.FA.main,
      ultimateBurstColor: celesteSpiritColors.MI.main,
      hurtboxWidth: 58,
      playable: true,
      futurePlayer2: true,
      placeholderArt: "production_sheets_phase_5",
      sheets: {
        bodyBasics: "celesteFinalBodyBasics",
        groundNormals: "celesteFinalGroundNormals",
        upAirAttacks: "celesteFinalUpAirAttacks",
        specials: "celesteFinalSpecials",
        defense: "celesteFinalDefense",
        octavaBody: "celesteFinalOctavaBody"
      },
      buildPlayerAnimations: buildCelesteFinalPlayerAnimations,
      buildEnemyAnimations: buildCelesteFinalEnemyAnimations
    }
  };

  for (const profile of Object.values(characterProfiles)) {
    hydrateCharacterProfile(profile);
  }

  const selectableCharacterIds = ["kairo", "vanta", "nyx", "sol", "seris", "lamuh", "lamuh_legacy", "celeste"];
  const MODE_FLOW_DATA = {
    online: {
      id: "online",
      title: "Online Versus",
      kicker: "Network Match",
      description: "Host a room or join a challenger with a room code.",
      panel: "online",
      actions: [
        { label: "Host Match", action: "host" },
        { label: "Join Match", action: "join" }
      ]
    },
    versus: {
      id: "versus",
      title: "Local Versus",
      kicker: "Same Screen",
      description: "Pick P1, pick P2, choose an arena, then fight.",
      panel: "local",
      actions: [{ label: "Continue", action: "fighter-select", mode: "versus" }]
    },
    training: {
      id: "training",
      title: "Training",
      kicker: "Lab Mode",
      description: "Practice against a dummy or toggle dummy movement in-match.",
      panel: "training",
      actions: [
        { label: "Free Training", action: "fighter-select", mode: "training", variant: "free" },
        { label: "Training Dummy", action: "fighter-select", mode: "training", variant: "dummy" }
      ]
    },
    arcade: {
      id: "arcade",
      title: "Arcade",
      kicker: "Coming Soon",
      description: "Arcade ladder is reserved for a future content pass.",
      panel: "arcade",
      actions: [{ label: "Back", action: "main-menu" }]
    }
  };
  const FIGHTER_SELECT_DATA = {
    kairo: {
      archetype: "Cyber Blade Striker",
      difficulty: "2/5",
      description: "Fast sword pressure with clean confirms.",
      playstyle: "Kairo rewards footsies, fast pokes, and direct conversions.",
      strengths: ["Fast buttons", "Clean movement", "Simple confirms"],
      quote: "Steel answers the sky."
    },
    vanta: {
      archetype: "Crimson Rival",
      difficulty: "3/5",
      description: "Midrange bully with heavy whiff punishes.",
      playstyle: "Vanta controls space with committed strikes and punishing reach.",
      strengths: ["Midrange threat", "Heavy damage", "Solid defense"],
      quote: "Every throne has a shadow."
    },
    nyx: {
      archetype: "Aerial Rushdown",
      difficulty: "4/5",
      description: "Air routes, speed, and slippery angles.",
      playstyle: "Nyx opens fights from odd angles and keeps pressure airborne.",
      strengths: ["Air mobility", "Mixups", "Fast pressure"],
      quote: "Blink once. Miss everything."
    },
    sol: {
      archetype: "Iron Sun",
      difficulty: "3/5",
      description: "Armor-flavored pressure and radiant reach.",
      playstyle: "Sol turns steady forward movement into oppressive close-range pressure.",
      strengths: ["Pressure", "Meter threat", "Durable offense"],
      quote: "Stand in the light or get buried by it."
    },
    seris: {
      archetype: "Halo Chain",
      difficulty: "4/5",
      description: "Chain control, traps, and delayed threat.",
      playstyle: "Seris controls lanes with chain timing and awkward recovery traps.",
      strengths: ["Space control", "Delayed hits", "Special pressure"],
      quote: "The halo is not mercy."
    },
    lamuh: {
      archetype: "Celestial Ki",
      difficulty: "5/5",
      description: "High-commitment divine pressure and beams.",
      playstyle: "LAMUH spends commitment for huge payoff and cinematic momentum.",
      strengths: ["Burst damage", "Beam threat", "High ceiling"],
      quote: "No crown survives heaven."
    },
    lamuh_legacy: {
      archetype: "Classic Ki",
      difficulty: "2/5",
      description: "Simple legacy kit with familiar spacing.",
      playstyle: "Legacy LAMUH keeps older routes readable and direct.",
      strengths: ["Accessible", "Stable routes", "Classic specials"],
      quote: "Old power still burns."
    },
    celeste: {
      archetype: "Seven Spirits",
      difficulty: "4/5",
      description: "Spirit stance flavor and tricky pressure.",
      playstyle: "Celeste changes rhythm with spirit-inflected attacks and mobility.",
      strengths: ["Unusual angles", "Spirit pressure", "Creative routes"],
      quote: "Seven voices. One baton."
    }
  };
  const STAGE_FLOW_DATA = {
    [PLATFORM_TEST_STAGE_ID]: {
      id: PLATFORM_TEST_STAGE_ID,
      name: "Platform Arena",
      note: "Wide stage with center platform",
      previewClass: "stage-preview-platform"
    },
    [STANDARD_STAGE_ID]: {
      id: STANDARD_STAGE_ID,
      name: "Standard Arena",
      note: "Classic fallback ruleset",
      previewClass: "stage-preview-standard"
    },
    [ECLIPSE_ROOFTOP_STAGE_ID]: {
      id: ECLIPSE_ROOFTOP_STAGE_ID,
      name: "Eclipse Rooftop",
      note: "Rooftop floor with elevated side platforms",
      previewClass: "stage-preview-eclipse",
      previewPath: "assets/stages/eclipse_rooftop/07_stage_select_card_16x9.png"
    }
  };
  const hiddenTestCharacterIds = [
    ...(SERIS_HIDDEN_TEST_ENABLED ? ["seris"] : []),
    ...(LAMUH_HIDDEN_TEST_ENABLED ? ["lamuh"] : [])
  ];
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
    Numpad5: "seris",
    Digit6: "lamuh",
    Numpad6: "lamuh",
    Digit7: "lamuh_legacy",
    Numpad7: "lamuh_legacy",
    Digit8: "celeste",
    Numpad8: "celeste"
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
    dash: ["ArrowLeft", "ArrowRight"],
    light: "Numpad1",
    medium: "Numpad2",
    heavy: "Numpad3",
    special1: "Numpad4",
    special2: "Numpad5",
    special3: "Numpad6",
    ultimate: "Numpad0"
  };

  const GAMEPAD_DEADZONE = 0.35;
  const GAMEPAD_TRIGGER_THRESHOLD = 0.5;
  const GAMEPAD_BUTTONS = {
    south: 0,
    east: 1,
    west: 2,
    north: 3,
    leftBumper: 4,
    rightBumper: 5,
    leftTrigger: 6,
    rightTrigger: 7,
    back: 8,
    start: 9,
    dpadUp: 12,
    dpadDown: 13,
    dpadLeft: 14,
    dpadRight: 15
  };

  const gamepadInput = {
    assignments: {
      p1: null,
      p2: null
    },
    soloSide: "p2",
    current: {
      p1: null,
      p2: null
    },
    previous: {
      p1: null,
      p2: null
    },
    lastStatusText: "",
    pollCount: 0,
    lastPollMode: "loading",
    lastRawCount: 0,
    lastConnectedCount: 0,
    userGestureSeen: false
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
    keyboardKeys: new Set(),
    gamepadKeys: new Set(),
    netKeys: new Set(),
    images: {},
    frameBoxes: {},
    particles: [],
    projectiles: [],
    celesteTraps: [],
    nyxSignatureEffects: [],
    lamuhSpecialEffects: [],
    lamuhUltimateBeams: [],
    lamuhCinematicUltimate: null,
    lastLamuhSpecialDebug: null,
    lastLamuhCrownUltimateDebug: null,
    player: null,
    enemy: null,
    selectedPlayerId: "kairo",
    selectedP1CharacterId: "kairo",
    selectedP2CharacterId: "vanta",
    selectCursorCharacterId: "kairo",
    selectGameMode: "versus",
    selectStep: SELECT_STEP_MODE,
    flowStep: FLOW_STEP_MAIN_MENU,
    pendingConfirmCharacterId: "kairo",
    pendingTrainingVariant: "free",
    selectedStagePresetId: PLATFORM_TEST_STAGE_ID,
    stagePresetId: PLATFORM_TEST_STAGE_ID,
    stageCamera: { scale: 1, x: 0, y: 0, initialized: false },
    activeSelectSide: "p1",
    p1Ready: false,
    p2Ready: false,
    matchEnded: false,
    matchWinner: null,
    p1DashTap: { code: null, time: -Infinity },
    p2DashTap: { code: null, time: -Infinity },
    enemyAI: false,
    combo: {
      owner: null,
      target: null,
      hits: 0,
      heavyHits: 0,
      wallBounces: 0,
      celesteAirBounceSpent: false,
      displayHits: 0,
      timer: 0,
      displayTimer: 0
    }
  };

  function getActiveStagePreset() {
    return STAGE_PRESETS[state.stagePresetId] || STAGE_PRESETS[STANDARD_STAGE_ID];
  }

  function getSelectedStagePreset() {
    return STAGE_PRESETS[state.selectedStagePresetId] || STAGE_PRESETS[STANDARD_STAGE_ID];
  }

  function isPlatformTestStage() {
    return Boolean(getActiveStagePreset().experimental);
  }

  function getPlatformArenaConfig() {
    return getActiveStagePreset().combat ? getActiveStagePreset() : null;
  }

  function getPlatformSpeedTuning() {
    return getPlatformArenaConfig()?.platformSpeedTuning || null;
  }

  function isEclipseRooftopStage() {
    return getActiveStagePreset().id === ECLIPSE_ROOFTOP_STAGE_ID;
  }

  function getFightingSpeedTuning() {
    return getPlatformSpeedTuning() || STANDARD_FIGHTING_SPEED_TUNING;
  }

  function getFightingKnockbackVelocityMultiplier() {
    return getFightingSpeedTuning()?.knockbackVelocityMultiplier ?? 1;
  }

  function applyFightingKnockbackVelocity(defender, blocked = false) {
    const multiplier = blocked ? 1 : getFightingKnockbackVelocityMultiplier();
    if (multiplier === 1) return;
    defender.vx *= multiplier;
    defender.vy *= multiplier;
  }

  function getStageBounds() {
    const stage = getActiveStagePreset();
    return { left: stage.leftBound, right: stage.rightBound };
  }

  function clampToStageX(x) {
    const bounds = getStageBounds();
    return clamp(x, bounds.left, bounds.right);
  }

  function syncInputKeys() {
    const filteredKeyboardKeys = [...state.keyboardKeys].filter((code) => shouldUseKeyboardKey(code));
    state.keys = new Set([...filteredKeyboardKeys, ...state.gamepadKeys, ...state.netKeys]);
  }

  function setKeyboardKey(code, pressed) {
    if (!code) return;
    if (pressed) {
      state.keyboardKeys.add(code);
    } else {
      state.keyboardKeys.delete(code);
    }
    syncInputKeys();
  }

  function setGamepadKey(code, pressed) {
    if (!code) return;
    if (pressed) {
      state.gamepadKeys.add(code);
    } else {
      state.gamepadKeys.delete(code);
    }
  }

  function clearInputKeys() {
    state.keyboardKeys.clear();
    state.gamepadKeys.clear();
    state.netKeys.clear();
    state.keys.clear();
  }

  function controlCodesFor(controls) {
    return [
      controls.left,
      controls.right,
      controls.up,
      controls.down,
      controls.modifier,
      controls.light,
      controls.medium,
      controls.heavy,
      controls.special1,
      controls.special2,
      controls.special3,
      controls.ultimate,
      controls.ultimateA,
      controls.ultimateB,
      controls.taunt,
      ...(controls.dash || [])
    ].filter(Boolean);
  }

  const P1_KEYBOARD_CODES = new Set(controlCodesFor(P1_CONTROLS));
  const P2_KEYBOARD_CODES = new Set(controlCodesFor(P2_CONTROLS));

  function isKeyboardEnabledForPlayer(side) {
    return !isFightMode() || gamepadInput.assignments[side] === null;
  }

  function shouldUseKeyboardKey(code) {
    if (netIsActive() && isFightMode()) {
      // Online: the guest's physical keys are translated into net actions, and
      // P2 keyboard codes always belong to the remote player, never local keys.
      if (net.role === "guest" && (P1_KEYBOARD_CODES.has(code) || P2_KEYBOARD_CODES.has(code))) return false;
      if (net.role === "host" && P2_KEYBOARD_CODES.has(code)) return false;
    }
    if (isFightMode()) {
      if (!isKeyboardEnabledForPlayer("p1") && P1_KEYBOARD_CODES.has(code)) return false;
      if (!isKeyboardEnabledForPlayer("p2") && P2_KEYBOARD_CODES.has(code)) return false;
    }
    return true;
  }

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
      quick_palm: [sheets.groundNormals, 0],
      lamuh_stand_light: [sheets.groundNormals, 0],
      neutral_medium: [sheets.groundNormals, 1],
      medium_attack: [sheets.groundNormals, 1],
      mirror_knuckle: [sheets.groundNormals, 1],
      lamuh_stand_medium: [sheets.groundNormals, 1],
      neutral_heavy: [sheets.groundNormals, 2],
      heavy_attack: [sheets.groundNormals, 2],
      crown_breaker: [sheets.groundNormals, 2],
      lamuh_stand_heavy: [sheets.groundNormals, 2],
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

  function buildLamuhLegacyPlayerAnimations(sheets) {
    const core = sheets.coreMovement;
    const airMovement = sheets.airMovement;
    const groundNormals = sheets.groundNormals;
    const airNormals = sheets.airNormals;
    const specials = sheets.specials;
    const defense = sheets.defense;
    const endStates = sheets.endStates;
    const crownBody = sheets.crownBody;
    return {
      idle: [core, 0],
      lamuh_legacy_idle: [core, 0],
      select_idle: [core, 0],
      walk_forward: [core, 1],
      walk_back: [core, 2],
      dash: [core, 3],
      dash_forward: [core, 3],
      dash_back: [core, 4],
      crouch: [core, 5],
      low_stance: [core, 5],
      jump_up: [airMovement, 0],
      rising: [airMovement, 0],
      jump_forward: [airMovement, 1],
      jump_back: [airMovement, 2],
      fall: [airMovement, 3],
      neutral_air_drift: [airMovement, 3],
      air_dash_forward: [airMovement, 4],
      air_dash_back: [airMovement, 5],
      land: [core, 0],
      landing: [core, 0],
      stand_up: [endStates, 2],
      block: [defense, 0],
      guard_idle: [defense, 0],
      stand_block: [defense, 0],
      crouch_block: [defense, 1],
      air_block: [defense, 4],
      damaged: [defense, 3],
      hit_light: [defense, 3],
      light_hitstun: [defense, 3],
      hit_heavy: [defense, 5],
      medium_hitstun: [defense, 5],
      heavy_hitstun: [defense, 5],
      knockback: [defense, 5],
      wall_bounce: [defense, 5],
      launch_hitstun: [defense, 5],
      launch_hit: [defense, 5],
      air_hitstun: [defense, 4],
      knockdown_fall: [endStates, 0],
      knockdown: [endStates, 0],
      grounded: [endStates, 1],
      downed: [endStates, 1],
      get_up: [endStates, 2],
      recovery: [endStates, 2],
      recovery_get_up: [endStates, 2],
      neutral_light: [groundNormals, 0],
      light_attack: [groundNormals, 0],
      quick_palm: [groundNormals, 0],
      neutral_medium: [groundNormals, 1],
      medium_attack: [groundNormals, 1],
      mirror_knuckle: [groundNormals, 1],
      neutral_heavy: [groundNormals, 2],
      heavy_attack: [groundNormals, 2],
      crown_breaker: [groundNormals, 2],
      forward_light: [groundNormals, 0],
      forward_medium: [groundNormals, 1],
      forward_heavy: [groundNormals, 2],
      back_light: [groundNormals, 0],
      back_medium: [groundNormals, 1],
      back_heavy: [groundNormals, 2],
      down_light: [groundNormals, 0],
      low_check: [groundNormals, 0],
      crouch_light: [groundNormals, 0],
      down_medium: [groundNormals, 1],
      sweep_line: [groundNormals, 1],
      crouch_medium: [groundNormals, 1],
      down_heavy: [groundNormals, 3],
      crown_riser: [groundNormals, 3],
      crouch_heavy: [groundNormals, 3],
      launcher: [groundNormals, 3],
      jump_light: [airNormals, 0],
      air_light: [airNormals, 0],
      air_tap: [airNormals, 0],
      jump_medium: [airNormals, 1],
      air_medium: [airNormals, 1],
      sky_knuckle: [airNormals, 1],
      jump_heavy: [airNormals, 2],
      air_heavy: [airNormals, 2],
      crown_drop: [airNormals, 2],
      air_recovery: [airNormals, 3],
      fall_transition: [airNormals, 3],
      special_1: [specials, 0],
      neutral_special: [specials, 0],
      celestial_palm: [specials, 0],
      mirror_spark: [specials, 0],
      special_2: [specials, 1],
      forward_special: [specials, 1],
      ascend_step: [specials, 1],
      dash_strike: [specials, 1],
      special_3: [specials, 2],
      up_special: [specials, 2],
      down_special: [specials, 2],
      heaven_splitter: [specials, 2],
      back_special: [specials, 3],
      divine_vanish: [specials, 3],
      mirror_slip: [specials, 3],
      air_special: [specials, 4],
      radiant_dive: [specials, 4],
      air_dash_strike: [specials, 4],
      special_recovery: [specials, 5],
      super_dash: [specials, 1],
      ultimate: crownBody ? [crownBody, 0] : [specials, 5],
      crown_startup: crownBody ? [crownBody, 0] : [specials, 5],
      crown_rush: crownBody ? [crownBody, 1] : [specials, 1],
      crown_charge: [specials, 5],
      crown_fire: [specials, 5],
      crown_recovery: [core, 0],
      death: [endStates, 3],
      ko: [endStates, 3],
      defeat: [endStates, 3],
      intro_pose: [endStates, 4],
      intro: [endStates, 4],
      victory: [endStates, 5],
      level_up: [endStates, 5],
      taunt: [endStates, 6]
    };
  }

  function buildLamuhLegacyEnemyAnimations(sheets) {
    const player = buildLamuhLegacyPlayerAnimations(sheets);
    const enemy = {};
    for (const [key, value] of Object.entries(player)) {
      enemy[`enemy_${key}`] = value;
    }
    enemy.enemy_idle = player.idle;
    enemy.enemy_walk_forward = player.walk_forward;
    enemy.enemy_walk_back = player.walk_back;
    enemy.enemy_dash = player.dash;
    enemy.enemy_dash_forward = player.dash_forward;
    enemy.enemy_dash_back = player.dash_back;
    enemy.enemy_air_dash_forward = player.air_dash_forward;
    enemy.enemy_air_dash_back = player.air_dash_back;
    enemy.enemy_block = player.block;
    enemy.enemy_damaged = player.damaged;
    enemy.enemy_knockback = player.knockback;
    enemy.enemy_get_up = player.get_up;
    enemy.enemy_death = player.death;
    enemy.enemy_light_attack = player.neutral_light;
    enemy.enemy_medium_attack = player.neutral_medium;
    enemy.enemy_heavy_attack = player.neutral_heavy;
    enemy.enemy_forward_light = player.forward_light;
    enemy.enemy_forward_medium = player.forward_medium;
    enemy.enemy_forward_heavy = player.forward_heavy;
    enemy.enemy_back_light = player.back_light;
    enemy.enemy_back_medium = player.back_medium;
    enemy.enemy_back_heavy = player.back_heavy;
    enemy.enemy_down_light = player.down_light;
    enemy.enemy_down_medium = player.down_medium;
    enemy.enemy_down_heavy = player.down_heavy;
    enemy.enemy_jump_light = player.jump_light;
    enemy.enemy_jump_medium = player.jump_medium;
    enemy.enemy_jump_heavy = player.jump_heavy;
    enemy.enemy_special_1 = player.special_1;
    enemy.enemy_special_2 = player.special_2;
    enemy.enemy_special_3 = player.special_3;
    enemy.enemy_neutral_special = player.neutral_special;
    enemy.enemy_forward_special = player.forward_special;
    enemy.enemy_up_special = player.up_special;
    enemy.enemy_down_special = player.down_special;
    enemy.enemy_back_special = player.back_special;
    enemy.enemy_air_special = player.air_special;
    enemy.enemy_ultimate = player.ultimate;
    return enemy;
  }

  function buildLamuhFinalPlayerAnimations(sheets) {
    const sheet1Redesign = sheets.sheet1Redesign;
    const newIdle = [sheet1Redesign, 0];
    const newWalk = [sheet1Redesign, 1];
    const newRunDash = [sheet1Redesign, 2];
    const newStandLight = [sheet1Redesign, 3];
    const newStandMedium = [sheet1Redesign, 4];
    const newStandHeavy = [sheet1Redesign, 5];
    const dashStrike = sheets.forwardSpecialsRedesign ? [sheets.forwardSpecialsRedesign, 0] : newRunDash;
    const mirrorBreak = sheets.forwardSpecialsRedesign ? [sheets.forwardSpecialsRedesign, 1] : newStandMedium;
    const mirrorPierce = sheets.forwardSpecialsRedesign ? [sheets.forwardSpecialsRedesign, 2] : newStandHeavy;
    const lowMirrorCut = sheets.downUpSpecialsRedesign ? [sheets.downUpSpecialsRedesign, 0] : newStandLight;
    const groundBreaker = sheets.downUpSpecialsRedesign ? [sheets.downUpSpecialsRedesign, 1] : newStandMedium;
    const crownRupture = sheets.downUpSpecialsRedesign ? [sheets.downUpSpecialsRedesign, 2] : newStandHeavy;
    const crownPop = sheets.downUpSpecialsRedesign ? [sheets.downUpSpecialsRedesign, 3] : newStandLight;
    const risingCrown = sheets.downUpSpecialsRedesign ? [sheets.downUpSpecialsRedesign, 4] : newStandMedium;
    const ascendantBreak = sheets.downUpSpecialsRedesign ? [sheets.downUpSpecialsRedesign, 5] : newStandHeavy;
    const mirrorSlip = sheets.backNeutralSpecialsRedesign ? [sheets.backNeutralSpecialsRedesign, 0] : newWalk;
    const reboundStrike = sheets.backNeutralSpecialsRedesign ? [sheets.backNeutralSpecialsRedesign, 1] : newStandMedium;
    const mirrorReversal = sheets.backNeutralSpecialsRedesign ? [sheets.backNeutralSpecialsRedesign, 2] : newStandHeavy;
    const mirrorSpark = sheets.neutralSpecialsBodyVfxRedesign
      ? [sheets.neutralSpecialsBodyVfxRedesign, 0]
      : sheets.backNeutralSpecialsRedesign ? [sheets.backNeutralSpecialsRedesign, 3] : newStandLight;
    const mirrorPulse = sheets.neutralSpecialsBodyVfxRedesign
      ? [sheets.neutralSpecialsBodyVfxRedesign, 1]
      : sheets.backNeutralSpecialsRedesign ? [sheets.backNeutralSpecialsRedesign, 4] : newStandMedium;
    const crownBeam = sheets.neutralSpecialsBodyVfxRedesign
      ? [sheets.neutralSpecialsBodyVfxRedesign, 2]
      : sheets.backNeutralSpecialsRedesign ? [sheets.backNeutralSpecialsRedesign, 5] : newStandHeavy;
    const crownBeamCharge = crownBeam;
    const crownBeamFire = crownBeam;
    const crownBeamRecovery = crownBeam;
    const superIdle = sheets.superAscendedGoldenLocs ? [sheets.superAscendedGoldenLocs, 0] : newIdle;
    const superCharge = sheets.superAscendedGoldenLocs ? [sheets.superAscendedGoldenLocs, 1] : newStandHeavy;
    const superRush = sheets.superAscendedGoldenLocs ? [sheets.superAscendedGoldenLocs, 2] : newRunDash;
    const superComboA = sheets.superAscendedGoldenLocs ? [sheets.superAscendedGoldenLocs, 3] : newStandLight;
    const superComboBLaunch = sheets.superAscendedGoldenLocs ? [sheets.superAscendedGoldenLocs, 4] : newStandHeavy;
    const superLaunch = superComboBLaunch;
    const superFire = sheets.superAscendedGoldenLocs ? [sheets.superAscendedGoldenLocs, 5] : newStandHeavy;
    const hitLight = sheets.reactionsDefenseRedesign ? [sheets.reactionsDefenseRedesign, 0] : newIdle;
    const hitHeavy = sheets.reactionsDefenseRedesign ? [sheets.reactionsDefenseRedesign, 1] : newStandHeavy;
    const launchHit = sheets.reactionsDefenseRedesign ? [sheets.reactionsDefenseRedesign, 2] : newStandHeavy;
    const hardKnockback = sheets.reactionsDefenseRedesign ? [sheets.reactionsDefenseRedesign, 3] : newStandHeavy;
    const knockdownDown = sheets.reactionsDefenseRedesign ? [sheets.reactionsDefenseRedesign, 4] : newIdle;
    const getupBlock = sheets.reactionsDefenseRedesign ? [sheets.reactionsDefenseRedesign, 5] : newIdle;
    const jumpFallLand = sheets.airCrouchJumpRedesign ? [sheets.airCrouchJumpRedesign, 0] : newRunDash;
    const crouchLight = sheets.airCrouchJumpRedesign ? [sheets.airCrouchJumpRedesign, 1] : newStandLight;
    const crouchMedium = sheets.airCrouchJumpRedesign ? [sheets.airCrouchJumpRedesign, 2] : newStandMedium;
    const crouchHeavy = sheets.airCrouchJumpRedesign ? [sheets.airCrouchJumpRedesign, 3] : newStandHeavy;
    const airNormalsCoverage = sheets.airCrouchJumpRedesign ? [sheets.airCrouchJumpRedesign, 4] : null;
    const airSpecialsCoverage = sheets.airCrouchJumpRedesign ? [sheets.airCrouchJumpRedesign, 5] : null;
    const airLight = airNormalsCoverage || newStandLight;
    const airMedium = airNormalsCoverage || newStandMedium;
    const airHeavy = airNormalsCoverage || newStandHeavy;
    const airMirrorSpark = airSpecialsCoverage || newStandLight;
    const airDashStrike = airSpecialsCoverage || newRunDash;
    const airCrownDrop = airSpecialsCoverage || newStandHeavy;
    const secondaryMovement = sheets.secondaryMovementDirectionalNormalsRedesign;
    const walkBack = secondaryMovement ? [secondaryMovement, 0] : newWalk;
    const dashBack = secondaryMovement ? [secondaryMovement, 1] : newRunDash;
    const crouchHold = secondaryMovement ? [secondaryMovement, 2] : newStandLight;
    const forwardDirectionalNormals = secondaryMovement ? [secondaryMovement, 3] : newStandMedium;
    const backDirectionalNormals = secondaryMovement ? [secondaryMovement, 4] : newStandMedium;
    const secondaryAirDashRecovery = secondaryMovement ? [secondaryMovement, 5] : newRunDash;
    return {
      idle: [sheet1Redesign, 0],
      lamuh_idle: [sheet1Redesign, 0],
      select_idle: newIdle,
      walk_forward: [sheet1Redesign, 1],
      lamuh_walk: [sheet1Redesign, 1],
      walk_back: walkBack,
      lamuh_walk_back: walkBack,
      dash: [sheet1Redesign, 2],
      lamuh_run: [sheet1Redesign, 2],
      lamuh_dash: [sheet1Redesign, 2],
      dash_forward: [sheet1Redesign, 2],
      dash_back: dashBack,
      lamuh_dash_back: dashBack,
      crouch: crouchHold,
      lamuh_crouch: crouchHold,
      low_stance: crouchHold,
      jump_up: jumpFallLand,
      lamuh_jump: jumpFallLand,
      rising: jumpFallLand,
      jump_forward: jumpFallLand,
      jump_back: jumpFallLand,
      fall: jumpFallLand,
      lamuh_fall: jumpFallLand,
      neutral_air_drift: jumpFallLand,
      air_dash_forward: secondaryAirDashRecovery,
      air_dash_back: secondaryAirDashRecovery,
      land: jumpFallLand,
      landing: jumpFallLand,
      lamuh_land: jumpFallLand,
      stand_up: getupBlock,
      block: getupBlock,
      guard_idle: getupBlock,
      stand_block: getupBlock,
      lamuh_block_high: getupBlock,
      crouch_block: getupBlock,
      lamuh_block_low: getupBlock,
      air_block: launchHit,
      damaged: hitLight,
      lamuh_hit_light: hitLight,
      hit_light: hitLight,
      light_hitstun: hitLight,
      medium_hitstun: hitHeavy,
      lamuh_hit_heavy: hitHeavy,
      hit_heavy: hitHeavy,
      knockback: hardKnockback,
      lamuh_hard_knockback: hardKnockback,
      lamuh_wall_bounce: hardKnockback,
      wall_bounce: hardKnockback,
      heavy_hitstun: hitHeavy,
      launch_hitstun: launchHit,
      lamuh_launch_hit: launchHit,
      lamuh_air_hit: launchHit,
      launch_hit: launchHit,
      air_hitstun: launchHit,
      neutral_light: [sheet1Redesign, 3],
      light_attack: [sheet1Redesign, 3],
      quick_palm: [sheet1Redesign, 3],
      lamuh_stand_light: [sheet1Redesign, 3],
      neutral_medium: [sheet1Redesign, 4],
      medium_attack: [sheet1Redesign, 4],
      mirror_knuckle: [sheet1Redesign, 4],
      lamuh_stand_medium: [sheet1Redesign, 4],
      neutral_heavy: [sheet1Redesign, 5],
      heavy_attack: [sheet1Redesign, 5],
      crown_breaker: [sheet1Redesign, 5],
      lamuh_stand_heavy: [sheet1Redesign, 5],
      launcher: forwardDirectionalNormals,
      forward_light: forwardDirectionalNormals,
      forward_medium: forwardDirectionalNormals,
      forward_heavy: forwardDirectionalNormals,
      back_light: backDirectionalNormals,
      back_medium: backDirectionalNormals,
      back_heavy: backDirectionalNormals,
      down_light: crouchLight,
      low_check: crouchLight,
      crouch_light: crouchLight,
      lamuh_crouch_light: crouchLight,
      down_medium: crouchMedium,
      sweep_line: crouchMedium,
      crouch_medium: crouchMedium,
      lamuh_crouch_medium: crouchMedium,
      down_heavy: crouchHeavy,
      crown_riser: crouchHeavy,
      lamuh_crown_riser: crouchHeavy,
      crouch_heavy: crouchHeavy,
      lamuh_crouch_heavy: crouchHeavy,
      jump_light: airLight,
      air_light: airLight,
      air_tap: airLight,
      lamuh_air_light: airLight,
      jump_medium: airMedium,
      air_medium: airMedium,
      sky_knuckle: airMedium,
      lamuh_air_medium: airMedium,
      jump_heavy: airHeavy,
      air_heavy: airHeavy,
      crown_drop: airHeavy,
      lamuh_air_heavy: airHeavy,
      air_recovery: secondaryAirDashRecovery,
      fall_transition: secondaryAirDashRecovery,
      special_1: mirrorSpark,
      celestial_palm: mirrorSpark,
      neutral_special: mirrorSpark,
      neutral_light_special: mirrorSpark,
      lamuh_mirror_spark_body: mirrorSpark,
      mirror_spark: mirrorSpark,
      lamuh_mirror_spark: mirrorSpark,
      neutral_medium_special: mirrorPulse,
      lamuh_mirror_pulse_body: mirrorPulse,
      mirror_pulse: mirrorPulse,
      lamuh_mirror_pulse: mirrorPulse,
      neutral_heavy_special: crownBeam,
      lamuh_crown_beam_body: crownBeam,
      crown_beam: crownBeam,
      lamuh_crown_beam: crownBeam,
      crown_beam_charge: crownBeamCharge,
      crown_beam_fire: crownBeamFire,
      crown_beam_recovery: crownBeamRecovery,
      special_2: mirrorPulse,
      ascend_step: dashStrike,
      forward_special: dashStrike,
      forward_light_special: dashStrike,
      dash_strike: dashStrike,
      lamuh_dash_strike: dashStrike,
      forward_medium_special: mirrorBreak,
      mirror_break: mirrorBreak,
      lamuh_mirror_break: mirrorBreak,
      forward_heavy_special: mirrorPierce,
      mirror_pierce: mirrorPierce,
      lamuh_mirror_pierce: mirrorPierce,
      special_3: crownBeam,
      heaven_splitter: groundBreaker,
      down_special: lowMirrorCut,
      down_light_special: lowMirrorCut,
      low_mirror_cut: lowMirrorCut,
      lamuh_low_mirror_cut: lowMirrorCut,
      down_medium_special: groundBreaker,
      ground_breaker: groundBreaker,
      lamuh_ground_breaker: groundBreaker,
      down_heavy_special: crownRupture,
      crown_rupture: crownRupture,
      lamuh_crown_rupture: crownRupture,
      up_light_special: crownPop,
      crown_pop: crownPop,
      lamuh_crown_pop: crownPop,
      up_medium_special: risingCrown,
      rising_crown: risingCrown,
      lamuh_rising_crown: risingCrown,
      up_heavy_special: ascendantBreak,
      ascendant_break: ascendantBreak,
      lamuh_ascendant_break: ascendantBreak,
      back_special: mirrorSlip,
      divine_vanish: mirrorSlip,
      back_light_special: mirrorSlip,
      mirror_slip: mirrorSlip,
      lamuh_mirror_slip: mirrorSlip,
      back_medium_special: reboundStrike,
      rebound_strike: reboundStrike,
      lamuh_rebound_strike: reboundStrike,
      back_heavy_special: mirrorReversal,
      mirror_reversal: mirrorReversal,
      lamuh_mirror_reversal: mirrorReversal,
      air_special: airMirrorSpark,
      radiant_dive: airDashStrike,
      air_light_special: airMirrorSpark,
      air_mirror_spark: airMirrorSpark,
      lamuh_air_mirror_spark: airMirrorSpark,
      air_medium_special: airDashStrike,
      air_dash_strike: airDashStrike,
      lamuh_air_dash_strike: airDashStrike,
      air_heavy_special: airCrownDrop,
      air_crown_drop: airCrownDrop,
      lamuh_air_crown_drop: airCrownDrop,
      special_recovery: crownBeamRecovery,
      crown_startup: superCharge,
      crown_rush: superRush,
      crown_combo_a: superComboA,
      crown_combo_b: superComboBLaunch,
      crown_launch: superLaunch,
      crown_charge: superCharge,
      lamuh_super_activation: superCharge,
      crown_fire: superFire,
      lamuh_super_attack_overlay: superFire,
      crown_recovery: superIdle,
      lamuh_super_idle: superIdle,
      ultimate: superCharge,
      knockdown_fall: knockdownDown,
      lamuh_knockdown: knockdownDown,
      lamuh_down: knockdownDown,
      knockdown: knockdownDown,
      grounded: knockdownDown,
      downed: knockdownDown,
      get_up: getupBlock,
      lamuh_getup: getupBlock,
      recovery: getupBlock,
      recovery_get_up: getupBlock,
      lamuh_super_hit_reaction: hitHeavy,
      death: knockdownDown,
      ko: knockdownDown,
      defeat: knockdownDown,
      intro_pose: newIdle,
      intro: newIdle,
      victory: superIdle,
      level_up: superIdle,
      taunt: newIdle
    };
  }

  function buildCelesteFinalPlayerAnimations(sheets) {
    return {
      idle: [sheets.bodyBasics, 0],
      select_idle: [sheets.bodyBasics, 0],
      walk_forward: [sheets.bodyBasics, 1],
      walk_back: [sheets.bodyBasics, 2],
      dash: [sheets.bodyBasics, 1],
      dash_forward: [sheets.bodyBasics, 1],
      dash_back: [sheets.bodyBasics, 2],
      crouch: [sheets.bodyBasics, 3],
      low_stance: [sheets.bodyBasics, 3],
      jump_start: [sheets.bodyBasics, 3],
      jump_up: [sheets.bodyBasics, 4],
      rising: [sheets.bodyBasics, 4],
      jump_forward: [sheets.bodyBasics, 4],
      jump_back: [sheets.bodyBasics, 4],
      fall: [sheets.bodyBasics, 5],
      neutral_air_drift: [sheets.bodyBasics, 5],
      landing: [sheets.bodyBasics, 6],
      air_dash_forward: [sheets.specials, 0],
      air_dash_back: [sheets.specials, 1],
      block: [sheets.defense, 0],
      guard_idle: [sheets.defense, 0],
      stand_block: [sheets.defense, 0],
      crouch_block: [sheets.defense, 0],
      air_block: [sheets.defense, 0],
      damaged: [sheets.defense, 1],
      light_hitstun: [sheets.defense, 1],
      medium_hitstun: [sheets.defense, 2],
      heavy_hitstun: [sheets.defense, 2],
      knockback: [sheets.defense, 3],
      launch_hitstun: [sheets.defense, 4],
      air_hitstun: [sheets.defense, 4],
      knockdown_fall: [sheets.defense, 5],
      grounded: [sheets.defense, 5],
      downed: [sheets.defense, 5],
      get_up: [sheets.defense, 5],
      recovery: [sheets.defense, 5],
      recovery_get_up: [sheets.defense, 5],
      neutral_light: [sheets.groundNormals, 0],
      light_attack: [sheets.groundNormals, 0],
      neutral_medium: [sheets.groundNormals, 1],
      medium_attack: [sheets.groundNormals, 1],
      neutral_heavy: [sheets.groundNormals, 2],
      heavy_attack: [sheets.groundNormals, 2],
      forward_light: [sheets.groundNormals, 3],
      forward_medium: [sheets.groundNormals, 4],
      forward_heavy: [sheets.groundNormals, 5],
      back_light: [sheets.groundNormals, 6],
      back_medium: [sheets.groundNormals, 7],
      back_heavy: [sheets.groundNormals, 8],
      down_light: [sheets.groundNormals, 0],
      down_medium: [sheets.groundNormals, 1],
      down_heavy: [sheets.upAirAttacks, 1],
      up_light: [sheets.upAirAttacks, 0],
      up_medium: [sheets.upAirAttacks, 1],
      up_heavy: [sheets.upAirAttacks, 2],
      launcher: [sheets.upAirAttacks, 1],
      jump_light: [sheets.upAirAttacks, 3],
      air_light: [sheets.upAirAttacks, 3],
      jump_medium: [sheets.upAirAttacks, 4],
      air_medium: [sheets.upAirAttacks, 4],
      jump_heavy: [sheets.upAirAttacks, 5],
      air_heavy: [sheets.upAirAttacks, 5],
      special_1: [sheets.specials, 0],
      fa_strobe: [sheets.specials, 0],
      special_2: [sheets.specials, 2],
      sol_ovation: [sheets.specials, 2],
      special_3: [sheets.specials, 4],
      ti_encore: [sheets.specials, 4],
      back_special: [sheets.specials, 3],
      la_seraph_waltz: [sheets.specials, 3],
      super_dash: [sheets.specials, 0],
      ultimate: [sheets.octavaBody, 0],
      octava: [sheets.octavaBody, 0],
      octava_startup: [sheets.octavaBody, 0],
      octava_fire: [sheets.octavaBody, 1],
      death: [sheets.defense, 6],
      ko: [sheets.defense, 6],
      defeat: [sheets.defense, 6],
      victory: [sheets.defense, 7],
      intro_pose: [sheets.bodyBasics, 0],
      intro: [sheets.bodyBasics, 0],
      level_up: [sheets.defense, 7],
      taunt: [sheets.bodyBasics, 0]
    };
  }

  function buildCelesteFinalEnemyAnimations(sheets) {
    const player = buildCelesteFinalPlayerAnimations(sheets);
    const enemy = {};
    for (const [key, value] of Object.entries(player)) {
      enemy[`enemy_${key}`] = value;
    }
    enemy.enemy_idle = player.idle;
    enemy.enemy_walk_forward = player.walk_forward;
    enemy.enemy_walk_back = player.walk_back;
    enemy.enemy_dash = player.dash;
    enemy.enemy_dash_forward = player.dash_forward;
    enemy.enemy_dash_back = player.dash_back;
    enemy.enemy_air_dash_forward = player.air_dash_forward;
    enemy.enemy_air_dash_back = player.air_dash_back;
    enemy.enemy_block = player.block;
    enemy.enemy_damaged = player.damaged;
    enemy.enemy_knockback = player.knockback;
    enemy.enemy_get_up = player.get_up;
    enemy.enemy_death = player.death;
    enemy.enemy_light_attack = player.neutral_light;
    enemy.enemy_medium_attack = player.neutral_medium;
    enemy.enemy_heavy_attack = player.neutral_heavy;
    enemy.enemy_forward_light = player.forward_light;
    enemy.enemy_forward_medium = player.forward_medium;
    enemy.enemy_forward_heavy = player.forward_heavy;
    enemy.enemy_back_light = player.back_light;
    enemy.enemy_back_medium = player.back_medium;
    enemy.enemy_back_heavy = player.back_heavy;
    enemy.enemy_up_light = player.up_light;
    enemy.enemy_up_medium = player.up_medium;
    enemy.enemy_up_heavy = player.up_heavy;
    enemy.enemy_down_light = player.down_light;
    enemy.enemy_down_medium = player.down_medium;
    enemy.enemy_down_heavy = player.down_heavy;
    enemy.enemy_jump_light = player.jump_light;
    enemy.enemy_jump_medium = player.jump_medium;
    enemy.enemy_jump_heavy = player.jump_heavy;
    enemy.enemy_special_1 = player.special_1;
    enemy.enemy_special_2 = player.special_2;
    enemy.enemy_special_3 = player.special_3;
    enemy.enemy_back_special = player.back_special;
    enemy.enemy_ultimate = player.ultimate;
    enemy.enemy_octava = player.octava;
    enemy.enemy_octava_startup = player.octava_startup;
    enemy.enemy_octava_fire = player.octava_fire;
    return enemy;
  }

  function buildCelestePlaceholderPlayerAnimations(sheets) {
    const sheet = sheets.placeholder;
    return {
      idle: [sheet, 0],
      select_idle: [sheet, 0],
      walk_forward: [sheet, 1],
      walk_back: [sheet, 1],
      dash: [sheet, 2],
      dash_forward: [sheet, 2],
      dash_back: [sheet, 2],
      crouch: [sheet, 3],
      low_stance: [sheet, 3],
      jump_up: [sheet, 4],
      rising: [sheet, 4],
      jump_forward: [sheet, 4],
      jump_back: [sheet, 4],
      fall: [sheet, 5],
      neutral_air_drift: [sheet, 5],
      air_dash_forward: [sheet, 2],
      air_dash_back: [sheet, 2],
      block: [sheet, 6],
      guard_idle: [sheet, 6],
      stand_block: [sheet, 6],
      crouch_block: [sheet, 6],
      air_block: [sheet, 6],
      damaged: [sheet, 7],
      light_hitstun: [sheet, 7],
      medium_hitstun: [sheet, 7],
      knockback: [sheet, 8],
      heavy_hitstun: [sheet, 8],
      launch_hitstun: [sheet, 8],
      air_hitstun: [sheet, 8],
      knockdown_fall: [sheet, 8],
      grounded: [sheet, 9],
      downed: [sheet, 9],
      get_up: [sheet, 9],
      recovery: [sheet, 9],
      recovery_get_up: [sheet, 9],
      neutral_light: [sheet, 10],
      neutral_medium: [sheet, 11],
      neutral_heavy: [sheet, 12],
      forward_light: [sheet, 13],
      forward_medium: [sheet, 14],
      forward_heavy: [sheet, 15],
      back_light: [sheet, 16],
      back_medium: [sheet, 17],
      back_heavy: [sheet, 18],
      up_light: [sheet, 19],
      up_medium: [sheet, 20],
      up_heavy: [sheet, 21],
      down_light: [sheet, 10],
      down_medium: [sheet, 11],
      down_heavy: [sheet, 20],
      jump_light: [sheet, 22],
      air_light: [sheet, 22],
      jump_medium: [sheet, 23],
      air_medium: [sheet, 23],
      jump_heavy: [sheet, 24],
      air_heavy: [sheet, 24],
      special_1: [sheet, 25],
      fa_strobe: [sheet, 25],
      special_2: [sheet, 26],
      sol_ovation: [sheet, 26],
      special_3: [sheet, 27],
      ti_encore: [sheet, 27],
      ultimate: [sheet, 28],
      octava: [sheet, 28],
      death: [sheet, 29],
      ko: [sheet, 29],
      defeat: [sheet, 29],
      victory: [sheet, 30],
      intro_pose: [sheet, 0],
      intro: [sheet, 0],
      level_up: [sheet, 30],
      taunt: [sheet, 0]
    };
  }

  function buildCelestePlaceholderEnemyAnimations(sheets) {
    const player = buildCelestePlaceholderPlayerAnimations(sheets);
    const enemy = {};
    for (const [key, value] of Object.entries(player)) {
      enemy[`enemy_${key}`] = value;
    }
    enemy.enemy_idle = player.idle;
    enemy.enemy_walk_forward = player.walk_forward;
    enemy.enemy_walk_back = player.walk_back;
    enemy.enemy_dash = player.dash;
    enemy.enemy_dash_forward = player.dash_forward;
    enemy.enemy_dash_back = player.dash_back;
    enemy.enemy_block = player.block;
    enemy.enemy_damaged = player.damaged;
    enemy.enemy_knockback = player.knockback;
    enemy.enemy_get_up = player.get_up;
    enemy.enemy_death = player.death;
    enemy.enemy_light_attack = player.neutral_light;
    enemy.enemy_medium_attack = player.neutral_medium;
    enemy.enemy_heavy_attack = player.neutral_heavy;
    enemy.enemy_forward_light = player.forward_light;
    enemy.enemy_forward_medium = player.forward_medium;
    enemy.enemy_forward_heavy = player.forward_heavy;
    enemy.enemy_back_light = player.back_light;
    enemy.enemy_back_medium = player.back_medium;
    enemy.enemy_back_heavy = player.back_heavy;
    enemy.enemy_up_light = player.up_light;
    enemy.enemy_up_medium = player.up_medium;
    enemy.enemy_up_heavy = player.up_heavy;
    enemy.enemy_down_light = player.down_light;
    enemy.enemy_down_medium = player.down_medium;
    enemy.enemy_down_heavy = player.down_heavy;
    enemy.enemy_jump_light = player.jump_light;
    enemy.enemy_jump_medium = player.jump_medium;
    enemy.enemy_jump_heavy = player.jump_heavy;
    enemy.enemy_special_1 = player.special_1;
    enemy.enemy_special_2 = player.special_2;
    enemy.enemy_special_3 = player.special_3;
    enemy.enemy_ultimate = player.ultimate;
    return enemy;
  }

  function buildEnemyAnimations(sheets) {
    return {
      enemy_idle: [sheets.basic, 0],
      enemy_walk_forward: [sheets.basic, 1],
      enemy_walk_back: [sheets.basic, 2],
      enemy_dash: [sheets.basic, 3],
      enemy_air_dash_forward: [sheets.basic, 3],
      enemy_air_dash_back: [sheets.basic, 3],
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
      enemy_air_dash_forward: [sheets.basic, 3],
      enemy_air_dash_back: [sheets.basic, 3],
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
      enemy_air_dash_forward: [sheets.airMovement, 4],
      enemy_air_dash_back: [sheets.airMovement, 5],
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
      enemy_air_dash_forward: [sheets.airMovement, 4],
      enemy_air_dash_back: [sheets.airMovement, 5],
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
      enemy_air_dash_forward: [sheets.airMovement, 4],
      enemy_air_dash_back: [sheets.airMovement, 5],
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

  function buildLamuhFinalEnemyAnimations(sheets) {
    return Object.fromEntries(
      Object.entries(buildLamuhFinalPlayerAnimations(sheets)).map(([key, entry]) => [`enemy_${key}`, entry])
    );
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
    const base = f?.profile?.movement || baselineMovementStats;
    const speed = getFightingSpeedTuning();
    if (!speed) return base;
    const ground = speed.groundSpeedMultiplier ?? 1;
    return {
      ...base,
      walkForward: base.walkForward * ground,
      walkBack: base.walkBack * ground,
      dashSpeed: base.dashSpeed * ground,
      superDashSpeed: base.superDashSpeed * ground
    };
  }

  function getJumpStats(f) {
    const base = f?.profile?.jump || baselineJumpStats;
    const speed = getFightingSpeedTuning();
    if (!speed) return base;
    return {
      ...base,
      jumpVelocity: base.jumpVelocity * (speed.jumpForceMultiplier ?? 1)
    };
  }

  function getFightingGravityMultiplier(f) {
    const speed = getFightingSpeedTuning();
    if (!speed) return 1;
    const gravityMultiplier = speed.gravityMultiplier ?? 1;
    const fallMultiplier = f?.vy > 0 ? (speed.fallSpeedMultiplier ?? 1) : 1;
    const isReactionGravity = f?.hitstun > 0 || f?.recoveryTimer > 0 || f?.platformAirRecoveryTimer > 0 || f?.knockdownTimer > 0;
    const shouldUseGravityMultiplier = isReactionGravity || f?.vy >= 0;
    return (shouldUseGravityMultiplier ? gravityMultiplier : 1) * fallMultiplier;
  }

  function getAirDashStats(f) {
    const base = f?.profile?.airDash || baselineAirDashStats;
    const speed = getFightingSpeedTuning();
    if (!speed) return base;
    return {
      ...base,
      speed: base.speed * (speed.airDriftMultiplier ?? 1)
    };
  }

  function getOpponentId(characterId) {
    if (characterId === "nyx") return "kairo";
    if (characterId === "sol") return "vanta";
    if (characterId === "celeste") return "vanta";
    if (characterId === "vanta") return "nyx";
    return "vanta";
  }

  function usesNyxArt(f) {
    return f?.profile?.id === "nyx";
  }

  function usesLamuhArt(f) {
    return f?.profile?.id === "lamuh";
  }

  function usesLamuhLegacyArt(f) {
    return f?.profile?.id === "lamuh_legacy";
  }

  function usesLamuhFamilyArt(f) {
    return usesLamuhArt(f) || usesLamuhLegacyArt(f);
  }

  function usesCelestePlaceholder(f) {
    return f?.profile?.id === "celeste";
  }

  function getCelesteBaseAnimKey(animKey = "") {
    return String(animKey || "").replace(/^enemy_/, "");
  }

  function getCelesteActiveMoveKey(f) {
    const raw = (f?.activeMove || f?.anim || "").replace(/^enemy_/, "");
    const aliases = {
      light_attack: "neutral_light",
      medium_attack: "neutral_medium",
      heavy_attack: "neutral_heavy",
      air_light: "jump_light",
      air_medium: "jump_medium",
      air_heavy: "jump_heavy",
      back_special: "la_seraph_waltz",
      special_1: "fa_strobe",
      special_2: "sol_ovation",
      special_3: "ti_encore",
      ultimate: "octava_startup"
    };
    return aliases[raw] || raw;
  }

  function getCelesteAnimationMeta(f, animKey = f?.anim) {
    const baseAnim = getCelesteBaseAnimKey(animKey);
    const moveKey = getCelesteActiveMoveKey(f);
    return {
      ...(CELESTE_ANIMATION_DRAW_META[baseAnim] || {}),
      ...(CELESTE_ANIMATION_DRAW_META[moveKey] || {})
    };
  }

  function getCelesteRootType(f, animKey = f?.anim) {
    const meta = getCelesteAnimationMeta(f, animKey);
    if (meta.rootType) return meta.rootType;
    const baseAnim = getCelesteBaseAnimKey(animKey);
    if (baseAnim.includes("knockdown") || baseAnim.includes("grounded") || baseAnim.includes("death") || baseAnim.includes("ko") || baseAnim.includes("defeat")) return "knockdown";
    if (!f?.grounded || baseAnim.includes("jump") || baseAnim.includes("air") || baseAnim.includes("fall") || baseAnim.includes("rising")) return "airborne";
    return "grounded";
  }

  function getCelesteFrameProgress(f, moveData = getMove(f)) {
    if (moveData) return clamp(f.actionTime / Math.max(moveData.duration, 0.1), 0, 0.999);
    return (state.time * 0.14) % 1;
  }

  function getCelesteSocketLocal(f, socketName, animKey = f?.anim) {
    const rootType = getCelesteRootType(f, animKey);
    const base = CELESTE_DEFAULT_SOCKETS[socketName] || CELESTE_DEFAULT_SOCKETS.root;
    const meta = getCelesteAnimationMeta(f, animKey);
    const override = meta.sockets?.[socketName] || {};
    const air = rootType === "airborne" ? CELESTE_AIR_SOCKET_OFFSETS[socketName] || {} : {};
    return {
      x: (base.x || 0) + (air.x || 0) + (override.x || 0),
      y: (base.y || 0) + (air.y || 0) + (override.y || 0),
      rootType
    };
  }

  function resolveCelesteSocket(f, socketName, options = {}) {
    if (!usesCelestePlaceholder(f)) return { x: f?.x || 0, y: f?.y || 0, facing: f?.facing || 1, rootType: "grounded" };
    const animKey = options.animKey || f.anim;
    const local = getCelesteSocketLocal(f, socketName, animKey);
    const extraX = options.offsetX || 0;
    const extraY = options.offsetY || 0;
    return {
      x: f.x + f.facing * (local.x + extraX),
      y: f.y + local.y + extraY,
      localX: local.x + extraX,
      localY: local.y + extraY,
      facing: f.facing,
      rootType: local.rootType,
      socket: socketName
    };
  }

  function getCelesteRenderContext(f, details = {}) {
    const animKey = details.animKey || f?.anim || "idle";
    const meta = getCelesteAnimationMeta(f, animKey);
    const rootType = getCelesteRootType(f, animKey);
    const sockets = {};
    for (const name of Object.keys(CELESTE_DEFAULT_SOCKETS)) {
      sockets[name] = resolveCelesteSocket(f, name, { animKey });
    }
    return {
      characterId: "celeste",
      root: { x: f.x, y: f.y },
      facing: f.facing,
      animKey,
      baseAnimKey: getCelesteBaseAnimKey(animKey),
      activeMove: (f.activeMove || "").replace(/^enemy_/, ""),
      rootType,
      frame: details.frame ?? 0,
      row: details.row ?? 0,
      sheet: details.sheet || null,
      drawOffsetX: meta.drawOffsetX || 0,
      drawOffsetY: meta.drawOffsetY || 0,
      scale: meta.scale || 1,
      frameTiming: meta.frameTiming || null,
      vfxFrames: [],
      sockets
    };
  }

  function getCelesteSocketSnapshot(f) {
    if (!usesCelestePlaceholder(f)) return null;
    const animKey = f.anim || withEnemyPrefix(f, "idle");
    const names = ["root", "feetBase", "torsoCenter", "headCenter", "frontHand", "backHand", "batonTip", "frontPalm", "projectileOrigin", "trapPlacementOrigin", "barrierCenter", "octavaOrigin", "beamOrigin"];
    const sockets = {};
    for (const name of names) {
      const point = resolveCelesteSocket(f, name, { animKey });
      sockets[name] = {
        x: Math.round(point.x * 10) / 10,
        y: Math.round(point.y * 10) / 10,
        rootType: point.rootType
      };
    }
    return {
      anim: animKey,
      activeMove: (f.activeMove || "").replace(/^enemy_/, ""),
      rootType: getCelesteRootType(f, animKey),
      frame: f.celesteRenderContext?.frame ?? null,
      sockets
    };
  }

  function usesNewGenerationArt(f) {
    return f?.profile?.id === "nyx" || f?.profile?.id === "sol" || f?.profile?.id === "seris" || f?.profile?.id === "lamuh" || f?.profile?.id === "lamuh_legacy" || f?.profile?.id === "celeste";
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
    if (f.profile?.id === "lamuh") return getLamuhActionPhaseAnim(f, moveData);
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

  function getLamuhActionPhaseAnim(f, moveData) {
    const moveKey = f.activeMove.replace(/^enemy_/, "");
    const activeEnd = moveData.startup + moveData.active;
    const identityAnimEnd = Math.max(activeEnd, moveData.duration * 0.82);
    if (["special_1", "neutral_special", "neutral_light_special"].includes(moveKey)) {
      return withEnemyPrefix(f, "mirror_spark");
    }
    if (["special_2", "neutral_medium_special"].includes(moveKey)) {
      return withEnemyPrefix(f, "mirror_pulse");
    }
    if (["special_3", "neutral_heavy_special"].includes(moveKey)) {
      if (f.actionTime < moveData.startup) return withEnemyPrefix(f, "crown_beam_charge");
      if (f.actionTime <= activeEnd) return withEnemyPrefix(f, "crown_beam_fire");
      return withEnemyPrefix(f, "crown_beam_recovery");
    }
    if (["forward_special", "forward_light_special"].includes(moveKey)) {
      if (f.actionTime <= identityAnimEnd) return withEnemyPrefix(f, "dash_strike");
      return withEnemyPrefix(f, "special_recovery");
    }
    if (moveKey === "forward_medium_special") {
      if (f.actionTime <= identityAnimEnd) return withEnemyPrefix(f, "mirror_break");
      return withEnemyPrefix(f, "special_recovery");
    }
    if (moveKey === "forward_heavy_special") {
      return withEnemyPrefix(f, "mirror_pierce");
    }
    if (["back_special", "back_light_special"].includes(moveKey)) {
      if (f.actionTime <= identityAnimEnd) return withEnemyPrefix(f, "mirror_slip");
      return withEnemyPrefix(f, "special_recovery");
    }
    if (moveKey === "back_medium_special") {
      if (f.actionTime < moveData.startup) return withEnemyPrefix(f, "mirror_slip");
      if (f.actionTime <= activeEnd) return withEnemyPrefix(f, "rebound_strike");
      return withEnemyPrefix(f, "special_recovery");
    }
    if (moveKey === "back_heavy_special") {
      if (f.actionTime < moveData.startup) return withEnemyPrefix(f, "divine_vanish");
      if (f.actionTime <= activeEnd) return withEnemyPrefix(f, "mirror_reversal");
      return withEnemyPrefix(f, "special_recovery");
    }
    if (["down_special", "down_light_special"].includes(moveKey)) {
      if (f.actionTime <= identityAnimEnd) return withEnemyPrefix(f, "low_mirror_cut");
      return withEnemyPrefix(f, "special_recovery");
    }
    if (moveKey === "down_medium_special") {
      if (f.actionTime <= identityAnimEnd) return withEnemyPrefix(f, "ground_breaker");
      return withEnemyPrefix(f, "special_recovery");
    }
    if (moveKey === "down_heavy_special") {
      if (f.actionTime < moveData.startup) return withEnemyPrefix(f, "crown_charge");
      if (f.actionTime <= activeEnd) return withEnemyPrefix(f, "crown_rupture");
      return withEnemyPrefix(f, "special_recovery");
    }
    if (moveKey === "up_light_special") {
      if (f.actionTime <= identityAnimEnd) return withEnemyPrefix(f, "crown_pop");
      return withEnemyPrefix(f, "special_recovery");
    }
    if (moveKey === "up_medium_special") {
      if (f.actionTime <= identityAnimEnd) return withEnemyPrefix(f, "rising_crown");
      return withEnemyPrefix(f, "special_recovery");
    }
    if (moveKey === "up_heavy_special") {
      if (f.actionTime < moveData.startup) return withEnemyPrefix(f, "crown_charge");
      if (f.actionTime <= activeEnd) return withEnemyPrefix(f, "ascendant_break");
      return withEnemyPrefix(f, "crown_recovery");
    }
    if (["air_special", "air_light_special"].includes(moveKey)) {
      if (f.actionTime <= identityAnimEnd) return withEnemyPrefix(f, "air_mirror_spark");
      return withEnemyPrefix(f, "special_recovery");
    }
    if (moveKey === "air_medium_special") {
      if (f.actionTime <= identityAnimEnd) return withEnemyPrefix(f, "air_dash_strike");
      return withEnemyPrefix(f, "special_recovery");
    }
    if (moveKey === "air_heavy_special") {
      if (f.actionTime <= identityAnimEnd) return withEnemyPrefix(f, "air_crown_drop");
      return withEnemyPrefix(f, "special_recovery");
    }
    if (moveKey === "ultimate") {
      if (f.actionTime < moveData.startup) return withEnemyPrefix(f, "crown_startup");
      if (f.actionTime <= activeEnd) return withEnemyPrefix(f, "crown_rush");
      return withEnemyPrefix(f, "crown_recovery");
    }
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
      platformAirRecoveryTimer: 0,
      juggleGravityScale: 1,
      upAttackGrace: 0,
      blowbackTimer: 0,
      wallBounceEligible: false,
      standingPlatformId: null,
      platformDropTimer: 0,
      mirrorPierceWallBouncePending: false,
      mirrorPierceHoldTimer: 0,
      mirrorPierceHoldX: null,
      mirrorPierceHoldY: null,
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
      spawnedTrap: false,
      cancelUnlocked: false,
      lamuhPierceDone: false,
      lamuhPierceConfirmed: false,
      lamuhPierceStage1Hit: false,
      lamuhPierceWhiffed: false,
      lamuhPierceBlocked: false,
      lamuhPierceWhiffBeamFired: false,
      lamuhPiercePalmFxAt: -Infinity,
      lamuhMirrorPierceCleanupReason: null,
      lamuhMirrorPierceFailsafeTriggered: false,
      lamuhReboundFlash: false,
      lamuhAscendTrail: -Infinity,
      celesteFaCooldown: 0,
      celesteFaWindow: 0,
      celesteFaStringSpent: false,
      celesteSolCooldown: 0,
      celesteLaCooldown: 0,
      celesteBarrierTimer: 0,
      celesteBarrierHits: 0,
      celesteTiCooldown: 0,
      bufferedMove: null,
      reactionAnim: null,
      anim: kind === "player" ? "idle" : "enemy_idle"
    };
  }

  async function boot() {
    await loadAssets();
    document.documentElement.style.setProperty("--title-bg", `url("${assetPaths.title}")`);
    renderControlsDisplay(selectControlsDisplay, true);
    renderControlsDisplay(matchControlsDisplay, false);
    renderControlsDisplay(titleControlsPanel, true);
    if (PLATFORM_TEST_DEBUG_ENABLED) state.selectedStagePresetId = PLATFORM_TEST_STAGE_ID;
    updateStagePresetUi();
    resetRound();
    if (state.mode === "loading") {
      state.mode = "title";
    }
    if (SERIS_HIDDEN_TEST_ENABLED) {
      startTraining("seris");
      flashStatus("SERIS HIDDEN TEST", 1.2);
    } else if (LAMUH_HIDDEN_TEST_ENABLED) {
      startTraining("lamuh");
      flashStatus("LAMUH HIDDEN TEST", 1.2);
    } else if (CELESTE_HIDDEN_TEST_ENABLED) {
      startTraining("celeste");
      flashStatus("CELESTE HIDDEN TEST", 1.2);
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
      const chroma = ![
        "stage",
        "title",
        "mainMenuBackground",
        "eclipseFarBackground",
        "eclipseMidground",
        "eclipseMainPlatform",
        "eclipseSidePlatformLeft",
        "eclipseSidePlatformRight",
        "eclipseForeground",
        "eclipseStageSelectCard",
        "nyxPhantomSlash"
      ].includes(key);
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

  function mix(a, b, t) {
    return a + (b - a) * clamp(t, 0, 1);
  }

  function easeOutCubic(t) {
    const inv = 1 - clamp(t, 0, 1);
    return 1 - inv * inv * inv;
  }

  function easeInOutCubic(t) {
    const x = clamp(t, 0, 1);
    return x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2;
  }

  function resetRound() {
    const versusMode = state.mode === "versus";
    const playerId = versusMode ? state.selectedP1CharacterId : state.selectedPlayerId;
    const enemyId = versusMode ? state.selectedP2CharacterId : getOpponentId(playerId);
    state.stagePresetId = getSelectedStagePreset().id;
    const stage = getActiveStagePreset();
    hideMatchFlowOverlay();
    state.matchEnded = false;
    state.matchWinner = null;
    state.paused = false;
    clearInputKeys();
    state.p1DashTap = { code: null, time: -Infinity };
    state.p2DashTap = { code: null, time: -Infinity };
    state.player = makeFighter("player", stage.spawnP1X, 1, playerId);
    state.enemy = makeFighter("enemy", stage.spawnP2X, -1, enemyId);
    if (versusMode) state.enemyAI = false;
    state.particles = [];
    state.projectiles = [];
    state.celesteTraps = [];
    state.nyxSignatureEffects = [];
    state.lamuhSpecialEffects = [];
    state.lamuhUltimateBeams = [];
    state.lamuhCinematicUltimate = null;
    state.hitPause = 0;
    state.cameraShake = 0;
    state.messageTimer = 1.5;
    resetCombo(true);
    updateStageCamera(0, true);
    roundStatusEl.textContent = getRoundStatus();
    updateHud();
  }

  function getRoundStatus() {
    const stageTag = isPlatformTestStage() ? ` - ${getActiveStagePreset().label.toUpperCase()}` : "";
    if (state.mode === "versus") {
      const p1Name = state.player?.profile.shortName || "P1";
      const p2Name = state.enemy?.profile.shortName || "P2";
      return `${p1Name} VS ${p2Name}${stageTag}`;
    }
    return `${getTrainingStatus()}${stageTag}`;
  }

  function getTrainingStatus() {
    const enemyName = state.enemy?.profile.shortName || "RIVAL";
    return state.enemyAI ? `${enemyName} AI ON` : `${enemyName} DUMMY`;
  }

  function isFightMode() {
    return state.mode === "training" || state.mode === "versus";
  }

  function showMatchFlowOverlay(title, subtitle, actions, showControls = true, flowKind = "result") {
    if (!matchFlowOverlay) return;
    matchFlowTitle.textContent = title;
    matchFlowSubtitle.textContent = subtitle;
    matchFlowActions.textContent = actions;
    matchFlowOverlay.dataset.flow = flowKind;
    matchControlsDisplay.classList.toggle("hidden", !showControls);
    matchFlowOverlay.classList.remove("hidden");
  }

  function hideMatchFlowOverlay() {
    matchFlowOverlay?.classList.add("hidden");
  }

  function endMatch(defeated) {
    if (!defeated || state.matchEnded) return;
    // Online guests only end the match from a host snapshot, never from local prediction.
    if (netIsActive() && net.role === "guest" && !net.applyingSnapshot) return;
    const p1Won = defeated.kind === "enemy";
    const winner = p1Won ? state.player : state.enemy;
    const loser = defeated;
    state.matchEnded = true;
    state.matchWinner = p1Won ? "p1" : "p2";
    state.paused = false;
    state.hitPause = 0;
    state.lamuhCinematicUltimate = null;
    state.messageTimer = 2.4;
    clearInputKeys();
    state.projectiles = [];
    resetCombo(true);
    loser.dead = true;
    loser.hitstun = 999;
    loser.blockstun = 0;
    loser.action = null;
    loser.activeMove = null;
    loser.anim = loser.kind === "enemy" ? "enemy_death" : "death";
    if (winner && !winner.dead) {
      winner.action = null;
      winner.activeMove = null;
      winner.bufferedMove = null;
      winner.vx = 0;
      winner.anim = withEnemyPrefix(winner, "victory");
    }
    const winnerLabel = p1Won ? "P1 WINS" : "P2 WINS";
    const p1Name = state.player?.profile.shortName || "P1";
    const p2Name = state.enemy?.profile.shortName || "P2";
    const subtitle = state.mode === "versus"
      ? `${p1Won ? p1Name : p2Name} defeats ${p1Won ? p2Name : p1Name}`
      : `${p1Won ? p1Name : p2Name} takes the round`;
    roundStatusEl.textContent = winnerLabel;
    showMatchFlowOverlay(winnerLabel, subtitle, "Press R for Rematch - Press Esc for Character Select", false, "result");
    updateHud();
  }

  function returnToCharacterSelectFromMatch() {
    const selectMode = state.mode === "training" ? "training" : "versus";
    showCharacterSelect(selectMode, SELECT_STEP_CHARACTERS);
  }

  function showPauseHelpOverlay() {
    showMatchFlowOverlay("PAUSED", "Local Versus Controls", "Resume P - Rematch R - Character Select Esc", true, "pause");
  }

  function togglePauseHelp() {
    if (!isFightMode() || state.matchEnded) return;
    state.paused = !state.paused;
    if (state.paused) {
      clearInputKeys();
      showPauseHelpOverlay();
      roundStatusEl.textContent = "PAUSED";
    } else {
      hideMatchFlowOverlay();
      roundStatusEl.textContent = getRoundStatus();
    }
  }

  function normalizeSelectStep(step) {
    const requestedStep = SELECT_STEPS.includes(step) ? step : SELECT_STEP_MODE;
    return netIsActive() && requestedStep === SELECT_STEP_MODE ? SELECT_STEP_CHARACTERS : requestedStep;
  }

  function setSelectStep(step, focus = true) {
    state.selectStep = normalizeSelectStep(step);
    updateCharacterSelectUi();
    if (focus) focusCurrentSelectStep();
  }

  function hideFlowScreens({ hideHud = true } = {}) {
    titleScreen.classList.add("hidden");
    modeDetailScreen?.classList.add("hidden");
    onlineMenu?.classList.add("hidden");
    characterSelect.classList.add("hidden");
    fighterConfirmScreen?.classList.add("hidden");
    stageSelectScreen?.classList.add("hidden");
    matchIntroScreen?.classList.add("hidden");
    if (hideHud) hud.classList.add("hidden");
  }

  function showMainMenu() {
    hideFlowScreens();
    titleScreen.classList.remove("hidden");
    state.mode = "title";
    state.flowStep = FLOW_STEP_MAIN_MENU;
    setSelectControlsOpen(false);
    startButton.focus({ preventScroll: true });
  }

  function runModeDetailAction(action) {
    if (!action) return;
    if (action.action === "main-menu") {
      showMainMenu();
      return;
    }
    if (action.action === "host") {
      hideFlowScreens();
      showOnlineMenu();
      startHosting();
      return;
    }
    if (action.action === "join") {
      hideFlowScreens();
      showOnlineMenu();
      netReset();
      resetOnlinePanels();
      onlineJoinPanel?.classList.remove("hidden");
      setOnlinePhase("idle", "Enter the host's room code.");
      onlineCodeInput?.focus();
      return;
    }
    if (action.action === "fighter-select") {
      state.pendingTrainingVariant = action.variant || "free";
      showCharacterSelect(action.mode || "versus", SELECT_STEP_CHARACTERS);
    }
  }

  function showModeDetail(modeId = "versus") {
    const data = MODE_FLOW_DATA[modeId] || MODE_FLOW_DATA.versus;
    hideFlowScreens();
    modeDetailScreen?.classList.remove("hidden");
    if (modeDetailPanel) {
      modeDetailPanel.dataset.modeDetail = data.panel || data.id;
      modeDetailPanel.style.setProperty("--mode-panel-art", `url("assets/ui/flow/mode_panel_${data.panel || data.id}.png")`);
    }
    if (modeDetailKicker) modeDetailKicker.textContent = data.kicker;
    if (modeDetailTitle) modeDetailTitle.textContent = data.title;
    if (modeDetailDescription) modeDetailDescription.textContent = data.description;
    if (modeDetailActions) {
      modeDetailActions.innerHTML = "";
      data.actions.forEach((action, index) => {
        const button = document.createElement("button");
        button.type = "button";
        button.className = `select-nav-button${index === 0 ? " primary" : ""}`;
        button.textContent = action.label;
        button.addEventListener("click", () => runModeDetailAction(action));
        modeDetailActions.append(button);
      });
      modeDetailActions.querySelector("button")?.focus({ preventScroll: true });
    }
    state.mode = "select";
    state.flowStep = FLOW_STEP_MODE_DETAIL;
    state.selectGameMode = data.id === "training" ? "training" : "versus";
    hideMatchFlowOverlay();
    clearInputKeys();
  }

  function chooseSelectMode(selectGameMode) {
    if (netIsActive()) return;
    setCharacterSelectMode(selectGameMode);
    showCharacterSelect(selectGameMode, SELECT_STEP_CHARACTERS);
  }

  function focusCurrentSelectStep() {
    if (state.mode !== "select") return;
    if (state.flowStep === FLOW_STEP_FIGHTER_CONFIRM) {
      showcaseConfirmButton?.focus({ preventScroll: true });
      return;
    }
    if (state.flowStep === FLOW_STEP_STAGE_SELECT || state.selectStep === SELECT_STEP_ARENA) {
      const selectedStageButton = [...stagePresetButtons].find((button) => button.dataset.stagePreset === state.selectedStagePresetId);
      (selectedStageButton || stageConfirmButton || selectConfirmButton)?.focus({ preventScroll: true });
      return;
    }
    if (state.flowStep === FLOW_STEP_MATCH_INTRO) {
      introStartButton?.focus({ preventScroll: true });
      return;
    }
    if (state.selectStep === SELECT_STEP_MODE) {
      const modeButton = state.selectGameMode === "training" ? selectTrainingButton : selectVersusButton;
      modeButton?.focus({ preventScroll: true });
      return;
    }
    if (state.selectStep === SELECT_STEP_ARENA) {
      const selectedStageButton = [...stagePresetButtons].find((button) => button.dataset.stagePreset === state.selectedStagePresetId);
      (selectedStageButton || selectConfirmButton)?.focus({ preventScroll: true });
      return;
    }
    const selectedButton = characterSelect.querySelector(`[data-character="${state.selectCursorCharacterId}"]`);
    selectedButton?.focus({ preventScroll: true });
  }

  function revealFighterSelectScreen(focus = true) {
    hideFlowScreens();
    characterSelect.classList.remove("hidden");
    state.mode = "select";
    state.flowStep = FLOW_STEP_FIGHTER_SELECT;
    state.selectStep = SELECT_STEP_CHARACTERS;
    updateStagePresetUi();
    updateCharacterSelectUi();
    if (focus) focusCurrentSelectStep();
  }

  function showCharacterSelect(selectGameMode = "versus", selectStep = SELECT_STEP_MODE) {
    hideFlowScreens();
    hideMatchFlowOverlay();
    state.matchEnded = false;
    state.matchWinner = null;
    state.paused = false;
    clearInputKeys();
    characterSelect.classList.remove("hidden");
    state.mode = "select";
    state.flowStep = FLOW_STEP_FIGHTER_SELECT;
    setSelectControlsOpen(false);
    updateStagePresetUi();
    setCharacterSelectMode(selectGameMode);
    state.selectStep = normalizeSelectStep(selectStep === SELECT_STEP_MODE ? SELECT_STEP_CHARACTERS : selectStep);
    revealFighterSelectScreen(true);
  }

  function startTraining(characterId = state.selectedPlayerId) {
    state.selectedPlayerId = isLaunchableCharacterId(characterId) ? characterId : "kairo";
    state.selectedP1CharacterId = state.selectedPlayerId;
    hideFlowScreens({ hideHud: false });
    hud.classList.remove("hidden");
    state.mode = "training";
    state.flowStep = "fight";
    state.paused = false;
    resetRound();
  }

  function startLocalVersus() {
    state.selectedP1CharacterId = isLaunchableCharacterId(state.selectedP1CharacterId) ? state.selectedP1CharacterId : "kairo";
    state.selectedP2CharacterId = isLaunchableCharacterId(state.selectedP2CharacterId) ? state.selectedP2CharacterId : "vanta";
    state.selectedPlayerId = state.selectedP1CharacterId;
    hideFlowScreens({ hideHud: false });
    hud.classList.remove("hidden");
    state.mode = "versus";
    state.flowStep = "fight";
    state.enemyAI = false;
    state.paused = false;
    resetRound();
  }

  function setCharacterSelectMode(selectGameMode) {
    state.selectGameMode = netIsActive() ? "versus" : selectGameMode === "training" ? "training" : "versus";
    state.activeSelectSide = netIsActive() ? (net.role === "guest" ? "p2" : "p1") : "p1";
    state.p1Ready = false;
    state.p2Ready = false;
    if (netIsActive()) {
      state.selectCursorCharacterId = net.role === "guest" ? state.selectedP2CharacterId : state.selectedP1CharacterId;
    } else {
      state.selectCursorCharacterId = state.selectGameMode === "training" ? state.selectedPlayerId : state.selectedP1CharacterId;
    }
    updateCharacterSelectFocus(state.selectCursorCharacterId);
  }

  function setStagePreset(stagePresetId, fromNet = false) {
    if (netIsActive() && net.role === "guest" && !fromNet) return;
    state.selectedStagePresetId = STAGE_PRESETS[stagePresetId]?.id || STANDARD_STAGE_ID;
    if (netIsActive() && net.role === "host" && !fromNet) netSend({ t: "stage", s: state.selectedStagePresetId });
    updateStagePresetUi();
    updateCharacterSelectUi();
    updateStageSelectUi();
  }

  function updateStagePresetUi() {
    stagePresetButtons.forEach((button) => {
      const active = button.dataset.stagePreset === state.selectedStagePresetId;
      button.classList.toggle("active", active);
      button.setAttribute("aria-pressed", active ? "true" : "false");
    });
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

  function getPortraitPath(characterId) {
    const id = isLaunchableCharacterId(characterId) ? characterId : "kairo";
    if (id === "lamuh") return LAMUH_SELECT_PORTRAIT_READY ? LAMUH_SELECT_PORTRAIT_PATH : "assets/sprites/portraits/sol_select.png";
    if (id === "celeste") return "assets/sprites/portraits/celeste_select.png";
    const cache = id === "seris" ? "?v=seris-revamp-final-1" : "";
    return `assets/sprites/portraits/${id}_select.png${cache}`;
  }

  function getFighterSelectData(characterId) {
    return FIGHTER_SELECT_DATA[characterId] || FIGHTER_SELECT_DATA.kairo;
  }

  function getSelectionSideLabel() {
    if (netIsActive()) return net.role === "guest" ? "P2 Confirm" : "P1 Confirm";
    if (state.selectGameMode === "training") return "Training Confirm";
    return state.activeSelectSide === "p2" ? "P2 Confirm" : "P1 Confirm";
  }

  function showFighterConfirm(characterId = state.selectCursorCharacterId) {
    const id = isLaunchableCharacterId(characterId) ? characterId : "kairo";
    const profile = characterProfiles[id] || characterProfiles.kairo;
    const data = getFighterSelectData(id);
    state.pendingConfirmCharacterId = id;
    state.mode = "select";
    state.flowStep = FLOW_STEP_FIGHTER_CONFIRM;
    hideFlowScreens();
    fighterConfirmScreen?.classList.remove("hidden");
    if (showcasePortrait) {
      showcasePortrait.src = getPortraitPath(id);
      showcasePortrait.alt = `${profile.name} portrait`;
    }
    if (showcaseSide) showcaseSide.textContent = getSelectionSideLabel();
    if (showcaseName) showcaseName.textContent = profile.name;
    if (showcaseArchetype) showcaseArchetype.textContent = `${data.archetype} - Difficulty ${data.difficulty}`;
    if (showcasePlaystyle) showcasePlaystyle.textContent = data.playstyle;
    if (showcaseStrengths) {
      showcaseStrengths.innerHTML = data.strengths.map((strength) => `<span>${strength}</span>`).join("");
    }
    if (showcaseQuote) showcaseQuote.textContent = data.quote;
    focusCurrentSelectStep();
  }

  function showStageSelect(focus = true) {
    state.mode = "select";
    state.flowStep = FLOW_STEP_STAGE_SELECT;
    state.selectStep = SELECT_STEP_ARENA;
    hideFlowScreens();
    stageSelectScreen?.classList.remove("hidden");
    updateStagePresetUi();
    updateStageSelectUi();
    if (focus) focusCurrentSelectStep();
  }

  function updateStageSelectUi() {
    const selectedStage = getSelectedStagePreset();
    const p1 = getSelectDisplayName(state.selectedP1CharacterId || state.selectedPlayerId);
    const p2 = state.selectGameMode === "training"
      ? `${getSelectDisplayName(getOpponentId(state.selectedPlayerId))} dummy`
      : getSelectDisplayName(state.selectedP2CharacterId);
    const data = STAGE_FLOW_DATA[selectedStage.id] || STAGE_FLOW_DATA[STANDARD_STAGE_ID];
    if (stageMatchupPreview) stageMatchupPreview.textContent = `${p1} vs ${p2} - ${data.name}`;
    if (stageConfirmButton) {
      stageConfirmButton.textContent = netIsActive() && net.role === "guest" ? "Waiting for Host" : "Confirm Arena";
      stageConfirmButton.disabled = netIsActive() && net.role === "guest";
    }
  }

  function getIntroP2Id() {
    return state.selectGameMode === "training" ? getOpponentId(state.selectedPlayerId) : state.selectedP2CharacterId;
  }

  function buildIntroQuote(p1Id, p2Id, stageId) {
    const left = characterProfiles[p1Id]?.shortName || "P1";
    const right = characterProfiles[p2Id]?.shortName || "P2";
    if (stageId === ECLIPSE_ROOFTOP_STAGE_ID) return `${left} and ${right} fight under a stolen sun.`;
    if (stageId === PLATFORM_TEST_STAGE_ID) return `${left} meets ${right} above broken ground.`;
    return `${left} answers ${right}.`;
  }

  function showMatchIntro({ fromNet = false } = {}) {
    state.mode = "select";
    state.flowStep = FLOW_STEP_MATCH_INTRO;
    hideFlowScreens();
    matchIntroScreen?.classList.remove("hidden");
    const p1Id = isLaunchableCharacterId(state.selectedP1CharacterId) ? state.selectedP1CharacterId : state.selectedPlayerId;
    const p2Id = isLaunchableCharacterId(getIntroP2Id()) ? getIntroP2Id() : "vanta";
    const stage = getSelectedStagePreset();
    const stageData = STAGE_FLOW_DATA[stage.id] || STAGE_FLOW_DATA[STANDARD_STAGE_ID];
    if (introP1Portrait) {
      introP1Portrait.src = getPortraitPath(p1Id);
      introP1Portrait.alt = `${getSelectDisplayName(p1Id)} portrait`;
    }
    if (introP2Portrait) {
      introP2Portrait.src = getPortraitPath(p2Id);
      introP2Portrait.alt = `${getSelectDisplayName(p2Id)} portrait`;
    }
    if (introP1Name) introP1Name.textContent = getSelectDisplayName(p1Id);
    if (introP2Name) introP2Name.textContent = state.selectGameMode === "training" ? `${getSelectDisplayName(p2Id)} DUMMY` : getSelectDisplayName(p2Id);
    if (introStageName) introStageName.textContent = stageData.name;
    if (introStagePreview) {
      introStagePreview.className = `intro-stage-preview ${stageData.previewClass || ""}`;
      introStagePreview.style.backgroundImage = stageData.previewPath ? `url("${stageData.previewPath}")` : "";
    }
    if (introQuote) introQuote.textContent = buildIntroQuote(p1Id, p2Id, stage.id);
    if (introStartButton) {
      introStartButton.textContent = state.selectGameMode === "training" ? "Start Training" : "Start Match";
      introStartButton.disabled = netIsActive() && net.role === "guest" && fromNet;
    }
    focusCurrentSelectStep();
  }

  function startConfirmedMatch() {
    if (netIsActive()) {
      if (net.role === "host" && state.p1Ready && state.p2Ready) {
        netSend({ t: "start", p1: state.selectedP1CharacterId, p2: state.selectedP2CharacterId, s: state.selectedStagePresetId });
        startOnlineVersus(state.selectedP1CharacterId, state.selectedP2CharacterId, state.selectedStagePresetId);
      }
      return;
    }
    if (state.selectGameMode === "training") {
      startTraining(state.selectedPlayerId);
      return;
    }
    if (state.p1Ready && state.p2Ready) startLocalVersus();
  }

  function keyLabel(code) {
    const labels = {
      KeyA: "A",
      KeyD: "D",
      KeyW: "W",
      KeyS: "S",
      KeyJ: "J",
      KeyK: "K",
      KeyL: "L",
      KeyU: "U",
      KeyI: "I",
      KeyO: "O",
      KeyP: "P",
      KeyR: "R",
      KeyT: "T",
      KeyN: "N",
      Escape: "Esc",
      ShiftLeft: "Shift",
      ShiftRight: "Shift",
      ArrowLeft: "Left",
      ArrowRight: "Right",
      ArrowUp: "Up",
      ArrowDown: "Down",
      Numpad0: "Numpad 0",
      Numpad1: "Numpad 1",
      Numpad2: "Numpad 2",
      Numpad3: "Numpad 3",
      Numpad4: "Numpad 4",
      Numpad5: "Numpad 5",
      Numpad6: "Numpad 6"
    };
    return labels[code] || code.replace(/^Key/, "").replace(/^Digit/, "");
  }

  function renderControlsDisplay(target, compact = false) {
    if (!target) return;
    const keyChip = (code) => `<kbd>${keyLabel(code)}</kbd>`;
    const keyCombo = (...codes) => `<span class="key-combo">${codes.map(keyChip).join("<b>+</b>")}</span>`;
    const keyRepeat = (code) => `<span class="key-combo">${keyChip(code)}${keyChip(code)}</span>`;
    const controlRow = (label, content, note = "") => `
      <span class="control-row">
        <span class="control-label">${label}</span>
        <span class="control-keys">${content}</span>
        ${note ? `<span class="control-note">${note}</span>` : ""}
      </span>`;
    const p1Rows = [
      controlRow("Move", `${keyChip(P1_CONTROLS.left)}${keyChip(P1_CONTROLS.right)}`),
      controlRow("Jump / Guard", `${keyChip(P1_CONTROLS.up)}${keyChip(P1_CONTROLS.down)}`),
      controlRow("Dash", `${keyChip(P1_CONTROLS.dash[0])}${keyRepeat(P1_CONTROLS.left)}${keyRepeat(P1_CONTROLS.right)}`, "Shift or double tap"),
      controlRow("Attacks", `${keyChip(P1_CONTROLS.light)}${keyChip(P1_CONTROLS.medium)}${keyChip(P1_CONTROLS.heavy)}`, "Light / Medium / Heavy"),
      controlRow("Specials", `${keyCombo(P1_CONTROLS.modifier, P1_CONTROLS.light)}${keyCombo(P1_CONTROLS.modifier, P1_CONTROLS.medium)}${keyCombo(P1_CONTROLS.modifier, P1_CONTROLS.heavy)}`),
      controlRow("Ultimate", keyCombo(P1_CONTROLS.ultimateA, P1_CONTROLS.ultimateB))
    ];
    const p2Rows = [
      controlRow("Move", `${keyChip(P2_CONTROLS.left)}${keyChip(P2_CONTROLS.right)}`),
      controlRow("Jump / Guard", `${keyChip(P2_CONTROLS.up)}${keyChip(P2_CONTROLS.down)}`),
      controlRow("Dash", `${keyRepeat(P2_CONTROLS.left)}${keyRepeat(P2_CONTROLS.right)}`, "double tap"),
      controlRow("Attacks", `${keyChip(P2_CONTROLS.light)}${keyChip(P2_CONTROLS.medium)}${keyChip(P2_CONTROLS.heavy)}`, "Light / Medium / Heavy"),
      controlRow("Specials", `${keyChip(P2_CONTROLS.special1)}${keyChip(P2_CONTROLS.special2)}${keyChip(P2_CONTROLS.special3)}`),
      controlRow("Ultimate", keyChip(P2_CONTROLS.ultimate))
    ];
    const padRows = [
      controlRow("Move", `${keyChip("LS")}${keyChip("D-pad")}`),
      controlRow("Jump / Guard", `${keyChip("Up")}${keyChip("Down")}`),
      controlRow("Attacks", `${keyChip("X/Square")}${keyChip("A/Cross")}${keyChip("B/Circle")}`, "Light / Medium / Heavy"),
      controlRow("Specials", `${keyChip("Y/Triangle")}${keyChip("LB/L1")}${keyChip("LT/L2")}`, "hold + attack"),
      controlRow("Dash / Ult", `${keyChip("RB/R1")}${keyChip("RT/R2")}`),
      controlRow("Menu", `${keyChip("Start")}${keyChip("View/Share")}`, "Pause / Assign")
    ];
    const systemMarkup = compact
      ? `<div class="controls-side system-controls"><strong>Match</strong>${controlRow("Flow", `${keyChip("KeyR")}${keyChip("KeyP")}${keyChip("Escape")}`, "Rematch / Pause / Select")}</div>`
      : `<div class="pause-actions" aria-label="Pause options">
          <span class="pause-option">${keyChip("KeyP")}<span>Resume</span></span>
          <span class="pause-option">${keyChip("KeyR")}<span>Rematch</span></span>
          <span class="pause-option">${keyChip("Escape")}<span>Character Select</span></span>
        </div>`;
    target.innerHTML = `
      <div class="controls-side"><strong>P1 Keyboard</strong>${p1Rows.join("")}</div>
      <div class="controls-side"><strong>P2 Keyboard</strong>${p2Rows.join("")}</div>
      <div class="controls-side controller-controls"><strong>Controller</strong>${padRows.join("")}</div>
      ${systemMarkup}
    `;
  }

  function setSelectControlsOpen(open) {
    if (!selectControlsDisplay) return;
    selectControlsDisplay.classList.toggle("hidden", !open);
    selectControlsToggle?.setAttribute("aria-expanded", open ? "true" : "false");
  }

  function toggleSelectControls() {
    setSelectControlsOpen(selectControlsDisplay?.classList.contains("hidden"));
  }

  function updateCharacterSelectUi() {
    const trainingMode = state.selectGameMode === "training";
    const modeStep = state.selectStep === SELECT_STEP_MODE;
    const charactersStep = state.selectStep === SELECT_STEP_CHARACTERS;
    const arenaStep = state.selectStep === SELECT_STEP_ARENA;
    const onlineActive = netIsActive();
    const selectedStage = getSelectedStagePreset();
    const stageSuffix = selectedStage.experimental ? ` - ${selectedStage.label}` : ` - ${selectedStage.label.replace(" (Fallback)", "")}`;
    const modeLabel = onlineActive
      ? `Online Versus - Room ${net.roomCode || ""}`.trim()
      : trainingMode ? "Training Dummy" : "Local Versus";
    characterSelect.dataset.step = state.selectStep;
    flowStepIndicators.forEach((indicator) => {
      const step = indicator.dataset.flowStep;
      const stepIndex = FLOW_STEPS.indexOf(step);
      const currentIndex = FLOW_STEPS.indexOf(state.flowStep);
      indicator.classList.toggle("active", step === state.flowStep);
      indicator.classList.toggle("complete", stepIndex >= 0 && currentIndex >= 0 && stepIndex < currentIndex);
    });
    selectModeRow?.classList.toggle("hidden", !modeStep);
    selectGrid?.classList.toggle("hidden", !charactersStep);
    selectStageRow?.classList.toggle("hidden", !arenaStep);
    selectSlots?.classList.toggle("hidden", modeStep);
    selectStepIndicators.forEach((indicator) => {
      const step = indicator.dataset.selectStep;
      const stepIndex = SELECT_STEPS.indexOf(step);
      const currentIndex = SELECT_STEPS.indexOf(state.selectStep);
      indicator.classList.toggle("active", step === state.selectStep);
      indicator.classList.toggle("complete", onlineActive ? stepIndex === 0 || stepIndex < currentIndex : stepIndex < currentIndex);
    });
    if (selectHeading) {
      selectHeading.textContent = modeStep
        ? "Choose Match Mode"
        : arenaStep ? "Choose Arena" : trainingMode ? "Choose Your Fighter" : "Choose Fighters";
    }
    selectModeLabel.textContent = modeStep ? "Mode Selection" : arenaStep ? "Arena Selection" : modeLabel;
    selectVersusButton.classList.toggle("active", !trainingMode);
    selectTrainingButton.classList.toggle("active", trainingMode);
    selectVersusButton.classList.toggle("online-locked", onlineActive);
    selectTrainingButton.classList.toggle("online-locked", onlineActive);
    stagePresetButtons.forEach((button) => button.classList.toggle("online-locked", onlineActive && net.role === "guest"));
    p1SelectName.textContent = getSelectDisplayName(trainingMode ? state.selectCursorCharacterId : state.selectedP1CharacterId);
    p2SelectName.textContent = trainingMode ? getSelectDisplayName(getOpponentId(state.selectCursorCharacterId)) : getSelectDisplayName(state.selectedP2CharacterId);
    p1SelectStatus.textContent = trainingMode ? "Player" : state.p1Ready ? "Ready" : charactersStep && state.activeSelectSide === "p1" ? "Choosing" : "Locked";
    p2SelectStatus.textContent = trainingMode ? "Dummy" : state.p2Ready ? "Ready" : state.p1Ready ? "Choosing" : "Waiting";
    p1SelectSlot.classList.toggle("active", charactersStep && state.activeSelectSide === "p1");
    p2SelectSlot.classList.toggle("active", charactersStep && state.activeSelectSide === "p2");
    p1SelectSlot.classList.toggle("ready", state.p1Ready || trainingMode || arenaStep);
    p2SelectSlot.classList.toggle("ready", state.p2Ready || trainingMode || arenaStep);

    let previewText = "";
    let hintText = "";
    let confirmText = "Continue";
    let confirmDisabled = false;
    let footerText = '<span><kbd>A</kbd>/<kbd>D</kbd> Choose Mode</span><span><kbd>Enter</kbd> Continue</span><span><kbd>Esc</kbd> Back</span>';

    if (modeStep) {
      previewText = `${modeLabel} selected`;
      hintText = "Mode";
      confirmText = "Choose Fighters";
    } else if (onlineActive) {
      const ownReady = net.role === "guest" ? state.p2Ready : state.p1Ready;
      const otherReady = net.role === "guest" ? state.p1Ready : state.p2Ready;
      const matchup = `${getSelectDisplayName(state.selectedP1CharacterId)} vs ${getSelectDisplayName(state.selectedP2CharacterId)}`;
      footerText = '<span><kbd>A</kbd><kbd>D</kbd><kbd>W</kbd><kbd>S</kbd> or <kbd>1</kbd>-<kbd>8</kbd> Choose</span><span><kbd>Enter</kbd> Confirm</span><span><kbd>Esc</kbd> Back</span>';
      if (arenaStep) {
        previewText = `${matchup}${stageSuffix}`;
        hintText = net.role === "host" ? "Host chooses arena" : "Waiting for host arena";
        confirmText = net.role === "host" ? "Start Online Match" : "Waiting for Host";
        confirmDisabled = net.role !== "host";
        footerText = net.role === "host"
          ? '<span><kbd>A</kbd>/<kbd>D</kbd> Choose Arena</span><span><kbd>Enter</kbd> Start</span><span><kbd>Esc</kbd> Back</span>'
          : '<span>Guest arena follows host selection</span><span><kbd>Esc</kbd> Unlock Fighter</span>';
      } else if (!ownReady) {
        previewText = `Choose your fighter (${net.role === "guest" ? "P2" : "P1"})`;
        hintText = "Fighters";
        confirmText = "Review Fighter";
      } else if (!otherReady) {
        previewText = "Locked in - waiting for opponent";
        hintText = "Fighters";
        confirmText = "Waiting";
        confirmDisabled = true;
      } else {
        previewText = `${matchup} locked`;
        hintText = "Fighters ready";
        confirmText = "Choose Arena";
      }
    } else if (arenaStep) {
      if (trainingMode) {
        previewText = `${getSelectDisplayName(state.selectedPlayerId)} vs ${getSelectDisplayName(getOpponentId(state.selectedPlayerId))} dummy${stageSuffix}`;
        confirmText = "Start Training";
      } else {
        previewText = `${getSelectDisplayName(state.selectedP1CharacterId)} vs ${getSelectDisplayName(state.selectedP2CharacterId)}${stageSuffix}`;
        confirmText = "Start Match";
      }
      hintText = "Arena";
      footerText = '<span><kbd>A</kbd>/<kbd>D</kbd> Choose Arena</span><span><kbd>Enter</kbd> Start</span><span><kbd>Esc</kbd> Back</span>';
    } else {
      footerText = '<span><kbd>A</kbd><kbd>D</kbd><kbd>W</kbd><kbd>S</kbd> or <kbd>1</kbd>-<kbd>8</kbd> Choose</span><span><kbd>Enter</kbd> Lock In</span><span><kbd>C</kbd> Controls</span><span><kbd>Esc</kbd> Back</span>';
      if (trainingMode) {
        previewText = `${getSelectDisplayName(state.selectCursorCharacterId)} vs ${getSelectDisplayName(getOpponentId(state.selectCursorCharacterId))} dummy`;
        hintText = "Fighter";
        confirmText = "Review Fighter";
      } else if (!state.p1Ready) {
        previewText = "Choose P1 fighter";
        hintText = "Fighters";
        confirmText = "Review P1";
      } else if (!state.p2Ready) {
        previewText = `${getSelectDisplayName(state.selectedP1CharacterId)} locked - choose P2 fighter`;
        hintText = "Fighters";
        confirmText = "Review P2";
      } else {
        previewText = `${getSelectDisplayName(state.selectedP1CharacterId)} vs ${getSelectDisplayName(state.selectedP2CharacterId)} locked`;
        hintText = "Fighters ready";
        confirmText = "Choose Arena";
      }
    }

    matchupPreview.textContent = previewText;
    if (selectFlowHint) selectFlowHint.textContent = hintText;
    if (selectConfirmButton) {
      selectConfirmButton.textContent = confirmText;
      selectConfirmButton.disabled = confirmDisabled;
    }
    if (selectFooter) selectFooter.innerHTML = footerText;
  }

  function confirmCharacterSelect() {
    if (state.flowStep === FLOW_STEP_FIGHTER_CONFIRM) {
      confirmFighterLock();
      return;
    }
    if (state.flowStep === FLOW_STEP_STAGE_SELECT || state.selectStep === SELECT_STEP_ARENA) {
      confirmArenaSelect();
      return;
    }
    if (state.flowStep === FLOW_STEP_MATCH_INTRO) {
      startConfirmedMatch();
      return;
    }
    if (state.selectStep === SELECT_STEP_MODE) {
      chooseSelectMode(state.selectGameMode);
      return;
    }
    showFighterConfirm(state.selectCursorCharacterId);
  }

  function confirmFighterLock() {
    const pending = isLaunchableCharacterId(state.pendingConfirmCharacterId) ? state.pendingConfirmCharacterId : state.selectCursorCharacterId;
    state.selectCursorCharacterId = pending;
    if (netIsActive()) {
      confirmOnlineCharacterSelect();
      if (state.selectStep === SELECT_STEP_ARENA) showStageSelect();
      else revealFighterSelectScreen();
      return;
    }
    if (state.selectGameMode === "training") {
      state.selectedPlayerId = pending;
      state.selectedP1CharacterId = pending;
      showStageSelect();
      return;
    }
    if (state.activeSelectSide === "p1") {
      state.selectedP1CharacterId = pending;
      state.p1Ready = true;
      state.activeSelectSide = "p2";
      state.selectCursorCharacterId = state.selectedP2CharacterId;
      revealFighterSelectScreen();
      return;
    }
    if (state.activeSelectSide === "p2") {
      state.selectedP2CharacterId = pending;
      state.p2Ready = true;
      state.activeSelectSide = "ready";
      updateCharacterSelectFocus(state.selectCursorCharacterId);
      showStageSelect();
      return;
    }
    showStageSelect();
  }

  function confirmArenaSelect() {
    if (netIsActive()) {
      if (net.role === "host" && state.p1Ready && state.p2Ready) {
        netSend({ t: "intro", p1: state.selectedP1CharacterId, p2: state.selectedP2CharacterId, s: state.selectedStagePresetId });
        showMatchIntro();
      }
      return;
    }
    if (state.selectGameMode === "training") {
      showMatchIntro();
      return;
    }
    if (state.p1Ready && state.p2Ready) showMatchIntro();
  }

  function backCharacterSelect() {
    if (selectControlsDisplay && !selectControlsDisplay.classList.contains("hidden")) {
      setSelectControlsOpen(false);
      return;
    }
    if (state.flowStep === FLOW_STEP_FIGHTER_CONFIRM) {
      revealFighterSelectScreen();
      return;
    }
    if (state.flowStep === FLOW_STEP_MATCH_INTRO) {
      if (netIsActive()) {
        if (net.role === "host") {
          netSend({ t: "stageSelect" });
          showStageSelect();
        } else {
          backOnlineCharacterSelect();
        }
        return;
      }
      showStageSelect();
      return;
    }
    if (state.flowStep === FLOW_STEP_STAGE_SELECT) {
      if (netIsActive()) {
        backOnlineCharacterSelect();
        return;
      }
      if (state.selectGameMode === "versus") {
        state.p2Ready = false;
        state.activeSelectSide = "p2";
        state.selectCursorCharacterId = state.selectedP2CharacterId;
      } else {
        state.selectCursorCharacterId = state.selectedPlayerId;
      }
      revealFighterSelectScreen();
      return;
    }
    if (netIsActive()) {
      backOnlineCharacterSelect();
      return;
    }
    if (state.selectStep === SELECT_STEP_ARENA) {
      if (state.selectGameMode === "versus") {
        state.p2Ready = false;
        state.activeSelectSide = "p2";
        state.selectCursorCharacterId = state.selectedP2CharacterId;
      } else {
        state.selectCursorCharacterId = state.selectedPlayerId;
      }
      setSelectStep(SELECT_STEP_CHARACTERS);
      return;
    }
    if (state.selectStep === SELECT_STEP_CHARACTERS && (state.selectGameMode === "training" || state.activeSelectSide === "p1")) {
      state.p1Ready = false;
      state.p2Ready = false;
      state.activeSelectSide = "p1";
      setSelectStep(SELECT_STEP_MODE);
      return;
    }
    if (state.selectStep === SELECT_STEP_MODE) {
      showMainMenu();
      return;
    }
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
    showModeDetail(state.selectGameMode === "training" ? "training" : "versus");
  }

  function handleCharacterSelectKey(e) {
    const handled = ["KeyA", "ArrowLeft", "Digit1", "Numpad1", "KeyD", "ArrowRight", "Digit2", "Numpad2", "KeyW", "ArrowUp", "Digit3", "Numpad3", "KeyS", "ArrowDown", "Digit4", "Numpad4", "Digit5", "Numpad5", "Digit6", "Numpad6", "Digit7", "Numpad7", "Digit8", "Numpad8", "KeyC", "Slash", "KeyT", "KeyV", "Enter", "Escape", "Backspace"].includes(e.code);
    if (!handled) return false;

    e.preventDefault();
    e.stopPropagation();

    if (e.code === "KeyC" || (e.code === "Slash" && e.shiftKey)) {
      toggleSelectControls();
      return true;
    }

    if (state.flowStep === FLOW_STEP_FIGHTER_CONFIRM) {
      if (e.code === "Enter") confirmFighterLock();
      if (e.code === "Escape" || e.code === "Backspace") backCharacterSelect();
      return true;
    }

    if (state.flowStep === FLOW_STEP_MATCH_INTRO) {
      if (e.code === "Enter") startConfirmedMatch();
      if (e.code === "Escape" || e.code === "Backspace") backCharacterSelect();
      return true;
    }

    if (state.flowStep === FLOW_STEP_STAGE_SELECT || state.selectStep === SELECT_STEP_ARENA) {
      if (["KeyA", "ArrowLeft", "Digit1", "Numpad1"].includes(e.code)) setStagePreset(PLATFORM_TEST_STAGE_ID);
      if (["KeyD", "ArrowRight", "Digit2", "Numpad2"].includes(e.code)) setStagePreset(STANDARD_STAGE_ID);
      if (["KeyW", "ArrowUp", "Digit3", "Numpad3"].includes(e.code)) setStagePreset(ECLIPSE_ROOFTOP_STAGE_ID);
      if (e.code === "Enter") confirmArenaSelect();
      if (e.code === "Escape" || e.code === "Backspace") backCharacterSelect();
      focusCurrentSelectStep();
      return true;
    }

    if (state.selectStep === SELECT_STEP_MODE) {
      if (["KeyA", "ArrowLeft", "Digit1", "Numpad1", "KeyV"].includes(e.code)) setCharacterSelectMode("versus");
      if (["KeyD", "ArrowRight", "Digit2", "Numpad2", "KeyT"].includes(e.code)) setCharacterSelectMode("training");
      if (e.code === "Enter") confirmCharacterSelect();
      if (e.code === "Escape" || e.code === "Backspace") backCharacterSelect();
      focusCurrentSelectStep();
      return true;
    }

    if (!netIsActive()) {
      if (e.code === "KeyV") setCharacterSelectMode("versus");
      if (e.code === "KeyT") setCharacterSelectMode("training");
    }
    if (["KeyA", "ArrowLeft"].includes(e.code)) updateCharacterSelectFocus("kairo");
    if (["KeyD", "ArrowRight"].includes(e.code)) updateCharacterSelectFocus("vanta");
    if (["KeyW", "ArrowUp"].includes(e.code)) updateCharacterSelectFocus("nyx");
    if (["KeyS", "ArrowDown"].includes(e.code)) updateCharacterSelectFocus("sol");
    if (selectShortcutCharacterIds[e.code]) updateCharacterSelectFocus(selectShortcutCharacterIds[e.code]);
    if (e.code === "Enter") confirmCharacterSelect();
    if (e.code === "Escape" || e.code === "Backspace") backCharacterSelect();

    focusCurrentSelectStep();
    return true;
  }

  function getRawGamepads() {
    if (!navigator.getGamepads) return [];
    return Array.from(navigator.getGamepads()).filter(Boolean);
  }

  function getConnectedGamepads() {
    return getRawGamepads()
      .filter((gamepad) => gamepad.connected !== false)
      .sort((a, b) => a.index - b.index);
  }

  function getGamepadLabel(gamepad) {
    if (!gamepad) return "keyboard";
    const raw = gamepad.id || `Gamepad ${gamepad.index + 1}`;
    return raw.replace(/\s+\(.*?\)/g, "").replace(/\s+/g, " ").trim().slice(0, 34) || `Gamepad ${gamepad.index + 1}`;
  }

  function clearGamepadKeysForSide(side) {
    const controls = side === "p1" ? P1_CONTROLS : P2_CONTROLS;
    [controls.left, controls.right, controls.up, controls.down, controls.modifier].filter(Boolean).forEach((code) => {
      state.gamepadKeys.delete(code);
    });
    syncInputKeys();
  }

  function applyGamepadAssignments(nextAssignments) {
    ["p1", "p2"].forEach((side) => {
      if (gamepadInput.assignments[side] === nextAssignments[side]) return;
      clearGamepadKeysForSide(side);
      gamepadInput.current[side] = null;
      gamepadInput.previous[side] = null;
    });
    gamepadInput.assignments.p1 = nextAssignments.p1;
    gamepadInput.assignments.p2 = nextAssignments.p2;
    syncInputKeys();
  }

  function refreshGamepadAssignments() {
    const pads = getConnectedGamepads();
    gamepadInput.lastRawCount = getRawGamepads().length;
    gamepadInput.lastConnectedCount = pads.length;
    const nextAssignments = { p1: null, p2: null };
    if (pads.length === 1) {
      nextAssignments[gamepadInput.soloSide] = pads[0].index;
    } else if (pads.length >= 2) {
      nextAssignments.p1 = pads[0].index;
      nextAssignments.p2 = pads[1].index;
    }
    applyGamepadAssignments(nextAssignments);
  }

  function toggleSoloGamepadAssignment() {
    const pads = getConnectedGamepads();
    if (pads.length !== 1) return false;
    gamepadInput.soloSide = gamepadInput.soloSide === "p2" ? "p1" : "p2";
    refreshGamepadAssignments();
    gamepadInput.lastStatusText = "";
    updateControllerStatus();
    if (isFightMode()) {
      flashStatus(`Controller assigned to ${gamepadInput.soloSide.toUpperCase()}`, 0.9);
    }
    return true;
  }

  function readGamepadButton(gamepad, index) {
    const button = gamepad?.buttons?.[index];
    if (!button) return false;
    return Boolean(button.pressed || button.value > GAMEPAD_TRIGGER_THRESHOLD);
  }

  function readGamepadAxis(gamepad, index) {
    const value = gamepad?.axes?.[index];
    return typeof value === "number" && Number.isFinite(value) ? value : 0;
  }

  function getPressedButtonIndices(gamepad) {
    if (!gamepad?.buttons) return [];
    return gamepad.buttons
      .map((button, index) => ({ button, index }))
      .filter(({ button }) => Boolean(button?.pressed || button?.value > GAMEPAD_TRIGGER_THRESHOLD))
      .map(({ index }) => index);
  }

  function getGamepadAssignmentLabel(index) {
    if (gamepadInput.assignments.p1 === index) return "P1";
    if (gamepadInput.assignments.p2 === index) return "P2";
    return "unassigned";
  }

  function readGamepadFrame(gamepad) {
    if (!gamepad) {
      return {
        connected: false,
        left: false,
        right: false,
        up: false,
        down: false,
        buttons: {}
      };
    }

    const axisX = readGamepadAxis(gamepad, 0);
    const axisY = readGamepadAxis(gamepad, 1);
    const dpadAxisX = readGamepadAxis(gamepad, 6);
    const dpadAxisY = readGamepadAxis(gamepad, 7);
    const dpadLeft = readGamepadButton(gamepad, GAMEPAD_BUTTONS.dpadLeft);
    const dpadRight = readGamepadButton(gamepad, GAMEPAD_BUTTONS.dpadRight);
    const dpadUp = readGamepadButton(gamepad, GAMEPAD_BUTTONS.dpadUp);
    const dpadDown = readGamepadButton(gamepad, GAMEPAD_BUTTONS.dpadDown);
    const left = dpadLeft || axisX < -GAMEPAD_DEADZONE || dpadAxisX < -GAMEPAD_DEADZONE;
    const right = dpadRight || axisX > GAMEPAD_DEADZONE || dpadAxisX > GAMEPAD_DEADZONE;
    const up = dpadUp || axisY < -GAMEPAD_DEADZONE || dpadAxisY < -GAMEPAD_DEADZONE;
    const down = dpadDown || axisY > GAMEPAD_DEADZONE || dpadAxisY > GAMEPAD_DEADZONE;
    const north = readGamepadButton(gamepad, GAMEPAD_BUTTONS.north);
    const leftBumper = readGamepadButton(gamepad, GAMEPAD_BUTTONS.leftBumper);
    const nonstandardMapping = gamepad.mapping !== "standard";
    const leftTrigger = readGamepadButton(gamepad, GAMEPAD_BUTTONS.leftTrigger) || (nonstandardMapping && readGamepadAxis(gamepad, 2) > GAMEPAD_TRIGGER_THRESHOLD);
    const rightTrigger = readGamepadButton(gamepad, GAMEPAD_BUTTONS.rightTrigger) || (nonstandardMapping && readGamepadAxis(gamepad, 5) > GAMEPAD_TRIGGER_THRESHOLD);

    return {
      connected: true,
      id: gamepad.id || "",
      index: gamepad.index,
      mapping: gamepad.mapping || "",
      axes: Array.from(gamepad.axes || []).map((axis) => Math.round(axis * 1000) / 1000),
      pressedButtons: getPressedButtonIndices(gamepad),
      left,
      right,
      up,
      down,
      buttons: {
        confirm: readGamepadButton(gamepad, GAMEPAD_BUTTONS.south),
        cancel: readGamepadButton(gamepad, GAMEPAD_BUTTONS.east),
        light: readGamepadButton(gamepad, GAMEPAD_BUTTONS.west),
        medium: readGamepadButton(gamepad, GAMEPAD_BUTTONS.south),
        heavy: readGamepadButton(gamepad, GAMEPAD_BUTTONS.east),
        specialModifier: north || leftBumper || leftTrigger,
        dash: readGamepadButton(gamepad, GAMEPAD_BUTTONS.rightBumper),
        ultimate: rightTrigger,
        help: readGamepadButton(gamepad, GAMEPAD_BUTTONS.back),
        start: readGamepadButton(gamepad, GAMEPAD_BUTTONS.start)
      }
    };
  }

  function justPressed(input, previous, key) {
    return Boolean(input?.buttons?.[key] && !previous?.buttons?.[key]);
  }

  function directionJustPressed(input, previous, key) {
    return Boolean(input?.[key] && !previous?.[key]);
  }

  function syncGamepadMovementKeys(side, input) {
    const controls = side === "p1" ? P1_CONTROLS : P2_CONTROLS;
    setGamepadKey(controls.left, input.left);
    setGamepadKey(controls.right, input.right);
    setGamepadKey(controls.up, input.up);
    setGamepadKey(controls.down, input.down);
    if (controls.modifier) setGamepadKey(controls.modifier, input.buttons.specialModifier);
  }

  function cycleCharacterSelect(delta) {
    const ids = selectableCharacterIds;
    const currentIndex = Math.max(0, ids.indexOf(state.selectCursorCharacterId));
    const nextIndex = (currentIndex + delta + ids.length) % ids.length;
    updateCharacterSelectFocus(ids[nextIndex]);
    focusCurrentSelectStep();
  }

  function cycleModeSelect(delta) {
    if (netIsActive()) return;
    if (delta !== 0) setCharacterSelectMode(state.selectGameMode === "training" ? "versus" : "training");
    focusCurrentSelectStep();
  }

  function cycleStageSelect(delta) {
    if (netIsActive() && net.role === "guest") return;
    const ids = Object.keys(STAGE_PRESETS);
    const currentIndex = Math.max(0, ids.indexOf(state.selectedStagePresetId));
    const nextIndex = (currentIndex + delta + ids.length) % ids.length;
    setStagePreset(ids[nextIndex]);
    focusCurrentSelectStep();
  }

  function handleGamepadSelectInput(input, previous) {
    if (justPressed(input, previous, "help")) {
      toggleSelectControls();
      return;
    }
    if (justPressed(input, previous, "cancel")) {
      backCharacterSelect();
      return;
    }
    if (state.flowStep === FLOW_STEP_FIGHTER_CONFIRM) {
      if (justPressed(input, previous, "confirm") || justPressed(input, previous, "start")) confirmFighterLock();
      return;
    }
    if (state.flowStep === FLOW_STEP_MATCH_INTRO) {
      if (justPressed(input, previous, "confirm") || justPressed(input, previous, "start")) startConfirmedMatch();
      return;
    }
    if (state.flowStep === FLOW_STEP_STAGE_SELECT || state.selectStep === SELECT_STEP_ARENA) {
      if (directionJustPressed(input, previous, "left") || directionJustPressed(input, previous, "up")) cycleStageSelect(-1);
      if (directionJustPressed(input, previous, "right") || directionJustPressed(input, previous, "down")) cycleStageSelect(1);
      if (justPressed(input, previous, "confirm") || justPressed(input, previous, "start")) confirmArenaSelect();
      return;
    }
    if (state.selectStep === SELECT_STEP_MODE) {
      if (directionJustPressed(input, previous, "left") || directionJustPressed(input, previous, "right") || directionJustPressed(input, previous, "up") || directionJustPressed(input, previous, "down")) {
        cycleModeSelect(1);
      }
      if (justPressed(input, previous, "confirm") || justPressed(input, previous, "start")) {
        confirmCharacterSelect();
      }
      return;
    }
    if (directionJustPressed(input, previous, "left") || directionJustPressed(input, previous, "up")) {
      cycleCharacterSelect(-1);
    }
    if (directionJustPressed(input, previous, "right") || directionJustPressed(input, previous, "down")) {
      cycleCharacterSelect(1);
    }
    if (justPressed(input, previous, "confirm") || justPressed(input, previous, "start")) {
      confirmCharacterSelect();
    }
  }

  function startGamepadAttack(side, input, button) {
    const fighter = side === "p1" ? state.player : state.enemy;
    if (!fighter) return;
    const controls = side === "p1" ? P1_CONTROLS : P2_CONTROLS;
    const specialPrefix = side === "p1" ? "special" : "enemy_special";
    if (input.buttons.specialModifier) {
      startMove(chooseSpecialMove(fighter, controls, `${specialPrefix}_${button}`), fighter);
      return;
    }
    if (button === 1) startMove(chooseLightAttack(fighter, controls), fighter);
    if (button === 2) startMove(chooseAttack("medium", fighter, controls), fighter);
    if (button === 3) startMove(chooseAttack("heavy", fighter, controls), fighter);
  }

  function handleGamepadFightInput(side, input, previous) {
    const fighter = side === "p1" ? state.player : state.enemy;
    const controls = side === "p1" ? P1_CONTROLS : P2_CONTROLS;
    if (!fighter) return;
    if (side === "p2" && state.mode !== "versus") return;

    const celesteUpAttackPressed = usesCelestePlaceholder(fighter) && input.up && (
      justPressed(input, previous, "light") ||
      justPressed(input, previous, "medium") ||
      justPressed(input, previous, "heavy")
    );
    if (directionJustPressed(input, previous, "up") && !celesteUpAttackPressed) jump(fighter);
    if (justPressed(input, previous, "dash")) {
      if (input.buttons.specialModifier) startSuperDash(fighter);
      else startDash(fighter, controls);
    }
    if (justPressed(input, previous, "ultimate")) {
      startMove(side === "p1" ? "ultimate" : "enemy_ultimate", fighter);
      return;
    }
    if (justPressed(input, previous, "light")) startGamepadAttack(side, input, 1);
    if (justPressed(input, previous, "medium")) startGamepadAttack(side, input, 2);
    if (justPressed(input, previous, "heavy")) startGamepadAttack(side, input, 3);
  }

  function handleGamepadMenuInput(side, input, previous) {
    if (state.mode === "title") {
      if (justPressed(input, previous, "help")) {
        toggleSoloGamepadAssignment();
        return true;
      }
      if (justPressed(input, previous, "confirm") || justPressed(input, previous, "start")) showModeDetail("versus");
      return true;
    }
    if (state.mode === "select") {
      if (state.flowStep === FLOW_STEP_MODE_DETAIL) {
        if (justPressed(input, previous, "cancel")) showMainMenu();
        return true;
      }
      if (justPressed(input, previous, "help")) {
        if (input.buttons.specialModifier) toggleSelectControls();
        else toggleSoloGamepadAssignment();
        return true;
      }
      handleGamepadSelectInput(input, previous);
      return true;
    }
    if (!isFightMode()) return false;
    if (state.matchEnded) {
      if (justPressed(input, previous, "confirm") || justPressed(input, previous, "start")) netBroadcastRematch();
      if (justPressed(input, previous, "cancel") || justPressed(input, previous, "help")) netAwareReturnToSelect();
      return true;
    }
    if (justPressed(input, previous, "start") || justPressed(input, previous, "help")) {
      netAwareTogglePause();
      return true;
    }
    if (state.paused) {
      if (justPressed(input, previous, "cancel")) netAwareReturnToSelect();
      return true;
    }
    return false;
  }

  function updateControllerStatus() {
    if (!controllerStatusEls.length) return;
    const pads = getConnectedGamepads();
    const p1Pad = pads.find((pad) => pad.index === gamepadInput.assignments.p1);
    const p2Pad = pads.find((pad) => pad.index === gamepadInput.assignments.p2);
    const padText = (pad) => {
      if (!pad) return "Keyboard";
      const controllerNumber = pads.findIndex((entry) => entry.index === pad.index) + 1;
      return `Controller ${controllerNumber} ${getGamepadLabel(pad)}`;
    };
    const statusText = pads.length
      ? `Inputs: P1 ${padText(p1Pad)} | P2 ${padText(p2Pad)}`
      : "Controllers: none detected - press a controller button after load";
    if (statusText === gamepadInput.lastStatusText) return;
    gamepadInput.lastStatusText = statusText;
    controllerStatusEls.forEach((element) => {
      element.textContent = statusText;
    });
  }

  function pollGamepads() {
    gamepadInput.pollCount += 1;
    gamepadInput.lastPollMode = state.mode;
    refreshGamepadAssignments();
    const pads = getConnectedGamepads();
    ["p1", "p2"].forEach((side) => {
      const pad = pads.find((entry) => entry.index === gamepadInput.assignments[side]);
      const frame = readGamepadFrame(pad);
      gamepadInput.current[side] = frame;
      syncGamepadMovementKeys(side, frame);
    });
    syncInputKeys();

    ["p1", "p2"].forEach((side) => {
      const input = gamepadInput.current[side];
      const previous = gamepadInput.previous[side] || readGamepadFrame(null);
      if (!input?.connected) {
        gamepadInput.previous[side] = input;
        return;
      }
      const handledByMenu = handleGamepadMenuInput(side, input, previous);
      if (!handledByMenu && isFightMode() && !state.paused && !state.matchEnded && !netIsActive()) {
        handleGamepadFightInput(side, input, previous);
      }
      gamepadInput.previous[side] = input;
    });

    updateControllerStatus();
  }

  function loop(now) {
    const last = state.lastNow || now;
    state.lastNow = now;
    const rawDt = Math.min((now - last) / 1000, 1 / 30);
    const dt = state.paused ? 0 : rawDt;
    pollGamepads();
    update(dt);
    netTick(rawDt);
    updateStageCamera(rawDt);
    render();
    requestAnimationFrame(loop);
  }

  function update(dt) {
    state.time += dt;
    updateParticles(dt);
    updateNyxSignatureEffects(dt);
    updateLamuhSpecialEffects(dt);
    updateLamuhUltimateBeams(dt);

    if (!isFightMode() || state.paused) {
      return;
    }

    if (state.messageTimer > 0) {
      state.messageTimer -= dt;
    }

    if (state.matchEnded) {
      updateHud();
      return;
    }

    if (state.lamuhCinematicUltimate) {
      updateLamuhCinematicUltimate(dt);
      updateHud();
      return;
    }

    if (state.hitPause > 0) {
      state.hitPause = Math.max(0, state.hitPause - dt);
      return;
    }

    updateProjectiles(dt);
    updateCelesteTraps(dt);
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

    if (updateMirrorPierceHold(p, dt)) {
      return;
    }

    if (p.hp <= 0) {
      p.dead = true;
      p.anim = "death";
      p.vx = 0;
      integrate(p, dt);
      endMatch(p);
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
      p.vx *= p.blowbackTimer > 0 ? Math.pow(0.93, dt * 60) : 0.42;
      if (Math.abs(p.vx) < 8) p.vx = 0;
      integrate(p, dt);
      if (p.hitstun <= 0 && !p.grounded) {
        p.recoveryTimer = Math.max(p.recoveryTimer, getJumpStats(p).airRecoveryDuration, p.platformAirRecoveryTimer || 0);
        p.platformAirRecoveryTimer = 0;
      }
      if (p.hitstun <= 0) p.reactionAnim = null;
      return;
    }

    if (p.knockdownTimer > 0) {
      p.knockdownTimer = Math.max(0, p.knockdownTimer - dt);
      p.anim = getKnockdownAnim(p, p.knockdownTimer > 0.16 ? "knockback" : "get_up");
      p.vx *= p.blowbackTimer > 0 ? Math.pow(0.9, dt * 60) : 0.22;
      if (p.knockdownTimer <= 0) p.reactionAnim = null;
      integrate(p, dt);
      return;
    }

    if (p.recoveryTimer > 0) {
      p.recoveryTimer = Math.max(0, p.recoveryTimer - dt);
      p.anim = usesNewGenerationArt(p) ? (p.grounded ? "get_up" : "air_recovery") : p.grounded ? "get_up" : "knockback";
      if (isPlatformTestStage() && !p.grounded) readAirRecoveryMovement(p, P1_CONTROLS);
      else p.vx *= p.grounded ? 0.34 : 0.88;
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
    const speed = getFightingSpeedTuning();
    const airDriftScale = !p.grounded && speed
      ? (speed.airDriftMultiplier ?? 1) / Math.max(speed.groundSpeedMultiplier ?? 1, 0.01)
      : 1;

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
      p.vx = p.facing * movement.walkForward * airDriftScale;
      p.anim = p.grounded ? withEnemyPrefix(p, "walk_forward") : getAirDriftAnim(p, true, false);
      return;
    }

    if (holdingBack) {
      p.vx = -p.facing * movement.walkBack * airDriftScale;
      p.anim = p.grounded ? withEnemyPrefix(p, "walk_back") : getAirDriftAnim(p, false, true);
      return;
    }

    p.anim = p.grounded ? withEnemyPrefix(p, "idle") : getAirDriftAnim(p, false, false);
  }

  function readAirRecoveryMovement(p, controls) {
    const movement = getMovementStats(p);
    const platformMovement = getPlatformArenaConfig()?.movement || {};
    const speed = getFightingSpeedTuning();
    const airDriftScale = speed ? (speed.airDriftMultiplier ?? 1) / Math.max(speed.groundSpeedMultiplier ?? 1, 0.01) : 1;
    const left = state.keys.has(controls.left);
    const right = state.keys.has(controls.right);
    const steer = platformMovement.airRecoverySteer ?? 0.76;
    const desired = right === left ? 0 : right ? movement.walkForward * steer * airDriftScale : -movement.walkForward * steer * airDriftScale;
    p.vx = mix(p.vx, desired, platformMovement.airRecoveryMix ?? 0.18);
  }

  function resolveWallBounce(f) {
    if (!WALL_BOUNCE_ENABLED || !f.wallBounceEligible || f.grounded) return false;
    const { left: leftWall, right: rightWall } = getStageBounds();
    const hitLeftWall = f.x <= leftWall && f.vx < 0;
    const hitRightWall = f.x >= rightWall && f.vx > 0;
    if (!hitLeftWall && !hitRightWall) return false;

    const combo = state.combo;
    const canBounce = combo.target === f.kind && combo.wallBounces < WALL_BOUNCE_MAX_PER_COMBO;
    f.x = hitLeftWall ? leftWall : rightWall;
    f.wallBounceEligible = false;

    if (!canBounce) {
      f.mirrorPierceWallBouncePending = false;
      f.pendingKnockdown = Math.max(f.pendingKnockdown, SOFT_KNOCKDOWN);
      return false;
    }

    combo.wallBounces += 1;
    f.vx *= WALL_BOUNCE_X_VELOCITY_MULT;
    f.vy = Math.min(f.vy, WALL_BOUNCE_Y_POP);
    f.hitstun = Math.max(f.hitstun, WALL_BOUNCE_HITSTUN_FRAMES / 60);
    f.blowbackTimer = Math.max(f.blowbackTimer, HEAVY_BLOWBACK_DRIFT_TIME * 0.7);
    if (f.mirrorPierceWallBouncePending) {
      f.mirrorPierceWallBouncePending = false;
      spawnBurst(f.x, f.y - 104, "#ffe8a3", 30, 0.24, "shock");
      spawnBurst(f.x + (hitLeftWall ? 24 : -24), f.y - 88, "#35e8d5", 14, 0.18, "spark");
      state.cameraShake = Math.max(state.cameraShake, 12);
    }
    return true;
  }

  function tickFighterTimers(f, dt) {
    if (f.platformDropTimer > 0) f.platformDropTimer = Math.max(0, f.platformDropTimer - dt);
    if (f.dashCooldown > 0) f.dashCooldown = Math.max(0, f.dashCooldown - dt);
    if (f.airDashCooldown > 0) f.airDashCooldown = Math.max(0, f.airDashCooldown - dt);
    if (f.superDashCooldown > 0) f.superDashCooldown = Math.max(0, f.superDashCooldown - dt);
    if (f.blowbackTimer > 0) f.blowbackTimer = Math.max(0, f.blowbackTimer - dt);
    if (f.upAttackGrace > 0) f.upAttackGrace = Math.max(0, f.upAttackGrace - dt);
    if (usesCelestePlaceholder(f)) {
      if (f.celesteFaCooldown > 0) f.celesteFaCooldown = Math.max(0, f.celesteFaCooldown - dt);
      if (f.celesteFaWindow > 0) f.celesteFaWindow = Math.max(0, f.celesteFaWindow - dt);
      if (f.celesteSolCooldown > 0) f.celesteSolCooldown = Math.max(0, f.celesteSolCooldown - dt);
      if (f.celesteLaCooldown > 0) f.celesteLaCooldown = Math.max(0, f.celesteLaCooldown - dt);
      if (f.celesteBarrierTimer > 0) f.celesteBarrierTimer = Math.max(0, f.celesteBarrierTimer - dt);
      if (f.celesteTiCooldown > 0) f.celesteTiCooldown = Math.max(0, f.celesteTiCooldown - dt);
      if (f.hitstun > 0 || f.blockstun > 0 || f.knockdownTimer > 0) {
        f.celesteFaWindow = 0;
        f.celesteBarrierTimer = 0;
        f.celesteBarrierHits = 0;
      }
      const comboOwned = state.combo.owner === f.kind && state.combo.timer > 0;
      const neutralReady = !f.action && f.hitstun <= 0 && f.blockstun <= 0 && f.knockdownTimer <= 0 && f.recoveryTimer <= 0 && f.landingTimer <= 0;
      if (neutralReady && !comboOwned) f.celesteFaStringSpent = false;
    }
    if (f.bufferedMove) {
      f.bufferedMove.timer -= dt;
      if (f.bufferedMove.timer <= 0) f.bufferedMove = null;
    }
  }

  function updateMirrorPierceHold(f, dt) {
    if (!f || f.mirrorPierceHoldTimer <= 0) return false;
    f.mirrorPierceHoldTimer = Math.max(0, f.mirrorPierceHoldTimer - dt);
    if (Number.isFinite(f.mirrorPierceHoldX)) f.x = f.mirrorPierceHoldX;
    if (Number.isFinite(f.mirrorPierceHoldY)) f.y = f.mirrorPierceHoldY;
    f.vx = 0;
    f.vy = 0;
    f.blockstun = 0;
    f.hitstun = Math.max(f.hitstun, f.mirrorPierceHoldTimer);
    f.grounded = false;
    f.anim = getHitReactionAnim(f, f.kind === "enemy" ? "enemy_heavy_hitstun" : "heavy_hitstun");
    if (f.mirrorPierceHoldTimer <= 0) {
      f.mirrorPierceHoldX = null;
      f.mirrorPierceHoldY = null;
    }
    return true;
  }

  function updateEnemy(dt) {
    const e = state.enemy;
    const p = state.player;
    e.facing = e.x <= p.x ? 1 : -1;
    e.crouching = false;
    e.blocking = false;
    tickFighterTimers(e, dt);
    if (updateMirrorPierceHold(e, dt)) {
      return;
    }
    if (e.hp <= 0) {
      e.dead = true;
      e.anim = "enemy_death";
      e.vx = 0;
      integrate(e, dt);
      endMatch(e);
      return;
    }
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
      e.vx *= e.blowbackTimer > 0 ? Math.pow(0.93, dt * 60) : 0.36;
      if (Math.abs(e.vx) < 8) e.vx = 0;
      if (e.hitstun <= 0 && !e.grounded) {
        e.recoveryTimer = Math.max(e.recoveryTimer, getJumpStats(e).airRecoveryDuration, e.platformAirRecoveryTimer || 0);
        e.platformAirRecoveryTimer = 0;
      }
      if (e.hitstun <= 0) e.reactionAnim = null;
    } else if (e.knockdownTimer > 0) {
      e.knockdownTimer = Math.max(0, e.knockdownTimer - dt);
      e.anim = getKnockdownAnim(e, e.knockdownTimer > 0.16 ? "enemy_knockback" : "enemy_get_up");
      e.vx *= e.blowbackTimer > 0 ? Math.pow(0.9, dt * 60) : 0.22;
      if (e.knockdownTimer <= 0) e.reactionAnim = null;
    } else if (e.recoveryTimer > 0) {
      e.recoveryTimer = Math.max(0, e.recoveryTimer - dt);
      e.anim = usesNewGenerationArt(e) ? (e.grounded ? "enemy_get_up" : "enemy_air_recovery") : e.grounded ? "enemy_get_up" : "enemy_knockback";
      if (isPlatformTestStage() && !e.grounded && state.mode === "versus") readAirRecoveryMovement(e, P2_CONTROLS);
      else e.vx *= e.grounded ? 0.34 : 0.88;
    } else if (e.landingTimer > 0) {
      e.landingTimer = Math.max(0, e.landingTimer - dt);
      e.anim = "enemy_stand_up";
      e.vx *= 0.35;
    } else if (e.airDashTimer > 0) {
      const airDash = getAirDashStats(e);
      e.airDashTimer = Math.max(0, e.airDashTimer - dt);
      e.vx = e.dashDirection * airDash.speed;
      e.vy = 0;
      e.anim = getDashAnim(e);
    } else if (e.dashTimer > 0) {
      const movement = getMovementStats(e);
      e.dashTimer = Math.max(0, e.dashTimer - dt);
      e.vx = e.dashDirection * movement.dashSpeed;
      e.anim = getDashAnim(e);
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
    if (!moveData) return;
    f.actionTime += dt;
    f.anim = getCharacterActionPhaseAnim(f, moveData) || f.anim;
    f.vx *= moveData.flags.dash ? 0.98 : f.grounded ? 0.46 : 0.88;

    if (moveData.flags.superDash) updateSuperDashVelocity(f);
    if (moveData.flags.shadowStep && f.actionTime < (moveData.flags.shadowStepAway ? 0.22 : 0.16)) updateShadowStepVelocity(f, moveData);
    else if (moveData.flags.faStrobe && f.actionTime < CELESTE_FA_WINDOW) f.vx = f.facing * 760;
    else if (moveData.flags.dash && f.actionTime < (moveData.flags.dashTime || 0.18)) f.vx = f.facing * (moveData.flags.dashSpeed || 620);
    if (isLamuhCrownStarter(f, moveData) && f.actionTime >= moveData.startup && f.actionTime < moveData.startup + moveData.active) f.vx = f.facing * LAMUH_CROWN_RUSH_SPEED;
    updateLamuhSpecialMotion(f, moveData);
    updateLamuhMirrorPierce(f, moveData);
    updateLamuhMirrorPiercePalmPause(f, moveData);
    updateLamuhMirrorPierceWhiff(f, moveData);
    if (moveData.flags.dive && f.actionTime < 0.22) updateDiveVelocity(f, moveData);
    if (moveData.flags.stepForward && f.actionTime < moveData.startup + moveData.active) f.vx = f.facing * moveData.flags.stepForward;
    if (moveData.flags.rise && f.actionTime < (moveData.flags.riseTime || 0.2)) f.vy = Math.min(f.vy, moveData.flags.riseVelocity || -360);
    const projectileSpawnAt = Number.isFinite(moveData.flags.projectileSpawnAt)
      ? moveData.flags.projectileSpawnAt
      : moveData.startup;
    if (moveData.flags.projectile && !f.spawnedProjectile && f.actionTime >= projectileSpawnAt) {
      if (moveData.flags.requiresPierceConfirm && !f.lamuhPierceConfirmed) return;
      spawnProjectile(f, moveData);
      f.spawnedProjectile = true;
    }
    if (moveData.flags.tiEncore && !f.spawnedTrap && f.actionTime >= moveData.startup) {
      spawnCelesteTrap(f);
      f.spawnedTrap = true;
    }
    if (!moveData.flags.noHit && isMoveActive(f)) {
      if (moveData.flags.multiHit) {
        tryMultiHit(f, moveData);
      } else if (!f.hasHit) {
        tryHit(f, f.kind === "player" ? state.enemy : state.player, moveData);
      }
    }

    if (tryBufferedMove(f)) return;

    if (moveData.flags.visualProfile === "mirrorPierce") {
      const whiffRecoveryEnd = Number.isFinite(moveData.flags.whiffRecoveryEndFrame) ? moveData.flags.whiffRecoveryEndFrame / 60 : moveData.duration;
      const maxDuration = Number.isFinite(moveData.flags.maxMirrorPierceFrame) ? moveData.flags.maxMirrorPierceFrame / 60 : moveData.duration + 0.2;
      if (f.lamuhPierceWhiffed && f.actionTime >= whiffRecoveryEnd) {
        finishLamuhMirrorPierceAction(f, "whiff_recovery_complete");
        return;
      }
      if (f.actionTime >= maxDuration) {
        finishLamuhMirrorPierceAction(f, "failsafe_max_duration", true);
        return;
      }
    }

    if (f.actionTime >= moveData.duration) {
      const buffered = f.bufferedMove;
      if (moveData.flags.visualProfile === "mirrorPierce") {
        finishLamuhMirrorPierceAction(f, "duration_complete");
        if (buffered) {
          f.bufferedMove = null;
          beginMove(f, buffered.key);
        }
        return;
      }
      if (isLamuhCrownStarter(f, moveData) && state.lastLamuhCrownUltimateDebug?.status === "started") {
        state.lastLamuhCrownUltimateDebug.status = "whiff_recovery";
      }
      f.action = null;
      f.activeMove = null;
      f.hasHit = false;
      f.hitCount = 0;
      f.lastHitTime = -Infinity;
      f.spawnedProjectile = false;
      f.spawnedTrap = false;
      f.cancelUnlocked = false;
      f.lamuhPierceDone = false;
      f.lamuhPierceConfirmed = false;
      f.lamuhPierceStage1Hit = false;
      f.lamuhPierceWhiffed = false;
      f.lamuhPierceBlocked = false;
      f.lamuhPierceWhiffBeamFired = false;
      f.lamuhPiercePalmFxAt = -Infinity;
      f.lamuhReboundFlash = false;
      f.lamuhAscendTrail = -Infinity;
      if (buffered) {
        f.bufferedMove = null;
        beginMove(f, buffered.key);
      }
    }
  }

  function integrate(f, dt) {
    const wasGrounded = f.grounded;
    const previousY = f.y;
    if (!f.grounded || f.vy < 0) {
      const jumpStats = getJumpStats(f);
      let gravity = !f.grounded && f.hitstun > 0 ? jumpStats.juggleGravity * (f.juggleGravityScale || 1) : !f.grounded && f.recoveryTimer > 0 ? jumpStats.airRecoveryGravity : jumpStats.gravity;
      gravity *= getFightingGravityMultiplier(f);
      f.vy += gravity * dt;
      if (!f.grounded && f.hitstun > 0) {
        f.vx *= Math.pow(f.blowbackTimer > 0 ? 0.96 : 0.72, dt * 60);
      }
    }

    f.x += f.vx * dt;
    f.y += f.vy * dt;
    resolveWallBounce(f);
    resolveStageLanding(f, previousY, wasGrounded);

    f.x = clampToStageX(f.x);
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
      p.x = clampToStageX(p.x + dir * push);
      e.x = clampToStageX(e.x - dir * push);
    }
  }

  function canStartCelestePhase2Move(f, moveData, key) {
    if (!usesCelestePlaceholder(f)) return true;
    if (moveData.flags.faStrobe && (f.celesteFaCooldown > 0 || f.celesteFaStringSpent)) {
      if (f.kind === "player" && CELESTE_HIDDEN_TEST_ENABLED) {
        flashStatus("FA STROBE RESET NEEDED", 0.55);
      } else if (f.kind === "player") {
        spawnBurst(f.x - f.facing * 22, f.y - 98, celesteSpiritColors.FA.secondary, 7, 0.12, "spark");
      }
      return false;
    }
    if (moveData.flags.solOvation && f.celesteSolCooldown > 0) return false;
    if (moveData.flags.laBarrier && f.celesteLaCooldown > 0) {
      if (f.kind === "player" && CELESTE_HIDDEN_TEST_ENABLED) {
        flashStatus("LA COOLDOWN", 0.5);
      } else if (f.kind === "player") {
        spawnBurst(f.x, f.y - 112, celesteSpiritColors.LA.secondary, 6, 0.12, "spark");
      }
      return false;
    }
    if (moveData.flags.tiEncore && f.celesteTiCooldown > 0) return false;
    return Boolean(key);
  }

  function startCelesteFaStrobe(f) {
    if (!usesCelestePlaceholder(f)) return;
    f.celesteFaCooldown = CELESTE_FA_COOLDOWN;
    f.celesteFaWindow = CELESTE_FA_WINDOW;
    f.celesteFaStringSpent = true;
    f.vx = f.facing * 760;
    const root = resolveCelesteSocket(f, "root");
    const baton = resolveCelesteSocket(f, "batonTip");
    spawnBurst(root.x - f.facing * 34, root.y - 96, celesteSpiritColors.FA.main, 22, 0.2, "ring");
    spawnBurst(baton.x, baton.y + 20, celesteSpiritColors.FA.secondary, 16, 0.18, "spark");
  }

  function startCelesteBarrier(f) {
    if (!usesCelestePlaceholder(f)) return;
    f.celesteBarrierTimer = CELESTE_LA_ACTIVE;
    f.celesteBarrierHits = 1;
    f.celesteLaCooldown = CELESTE_LA_COOLDOWN;
    const barrier = resolveCelesteSocket(f, "barrierCenter");
    spawnBurst(barrier.x, barrier.y, celesteSpiritColors.LA.secondary, 24, 0.22, "ring");
  }

  function startMove(key, fighter = state.player) {
    const p = fighter;
    if (!isFightMode() || state.paused || state.matchEnded || state.lamuhCinematicUltimate || p.dead || p.dashTimer > 0 || p.airDashTimer > 0) return;
    const data = getMove(p, key);
    if (!data) return;
    if (data.flags.ultimate && p.meter < METER_MAX) {
      flashStatus(`${p.profile.shortName} METER NEEDED`, 0.8);
      return;
    }
    if (!canStartCelestePhase2Move(p, data, key)) return;
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
    if (!data || state.matchEnded || state.lamuhCinematicUltimate || e.dead || e.action || e.hitstun > 0 || e.blockstun > 0 || e.knockdownTimer > 0 || e.recoveryTimer > 0) return;
    if (!canStartCelestePhase2Move(e, data, key)) return;
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
    f.spawnedTrap = false;
    f.cancelUnlocked = false;
    f.lamuhPierceDone = false;
    f.lamuhPierceConfirmed = false;
    f.lamuhPierceStage1Hit = false;
    f.lamuhPierceWhiffed = false;
    f.lamuhPierceBlocked = false;
    f.lamuhPierceWhiffBeamFired = false;
    f.lamuhPiercePalmFxAt = -Infinity;
    f.lamuhMirrorPierceCleanupReason = null;
    f.lamuhMirrorPierceFailsafeTriggered = false;
    f.lamuhReboundFlash = false;
    f.lamuhAscendTrail = -Infinity;
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
    if (data.flags.faStrobe) startCelesteFaStrobe(f);
    if (data.flags.laBarrier) startCelesteBarrier(f);
    if (data.flags.solOvation) f.celesteSolCooldown = CELESTE_SOL_COOLDOWN;
    if (data.flags.tiEncore) f.celesteTiCooldown = CELESTE_TI_COOLDOWN;
    if (data.flags.ultimate) {
      f.meter = 0;
      state.cameraShake = 12;
      spawnBurst(f.x + f.facing * 150, f.y - 95, f.profile.ultimateBurstColor || "#d66bff", 34);
      if (usesNyxArt(f)) spawnNyxUltimateVisual(f);
      if (usesLamuhArt(f)) {
        state.lastLamuhCrownUltimateDebug = {
          status: "started",
          attacker: f.kind,
          facing: f.facing,
          sheet: "lamuhCrownBody",
          phase: "startup",
          beamSpawned: false,
          damageApplied: false
        };
      }
    }
    spawnLamuhSpecialEffectForMove(f, key);
    spawnCelesteSpiritBurstForMove(f);
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
    if (moveData.flags.shadowStepAway) {
      f.vx = -f.facing * (moveData.flags.shadowStepSpeed || 860);
      return;
    }
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

  function updateLamuhSpecialMotion(f, moveData) {
    if (!usesLamuhArt(f) || !moveData?.flags) return;
    if (moveData.flags.reboundSnap) {
      const start = moveData.startup * (moveData.flags.reboundSnapStart || 0.88);
      const end = moveData.startup + moveData.active * (moveData.flags.reboundSnapEnd || 0.62);
      if (f.actionTime >= start && f.actionTime <= end) {
        f.vx = f.facing * (moveData.flags.reboundSnapSpeed || 540);
        if (!f.lamuhReboundFlash) {
          f.lamuhReboundFlash = true;
          spawnLamuhAfterimageTrail(f, 3, 18, "#f7f2df");
          spawnBurst(f.x - f.facing * 36, f.y - 92, "#1b1510", 8, 0.12, "smoke");
        }
      }
    }
    if (moveData.flags.visualProfile === "ascendantBreak" && f.actionTime < moveData.startup + moveData.active) {
      if (!f.lamuhAscendTrail || f.actionTime - f.lamuhAscendTrail > 0.055) {
        f.lamuhAscendTrail = f.actionTime;
        spawnBurst(f.x - f.facing * 12, f.y - 42, "#fff3ba", 5, 0.12, "spark");
      }
    }
  }

  function updateLamuhMirrorPierce(f, moveData) {
    if (!usesLamuhArt(f) || !moveData.flags.pierceSideSwitch || f.lamuhPierceDone) return;
    const switchAt = moveData.startup + moveData.active * (moveData.flags.pierceSwitchAt || 0.48);
    if (f.actionTime < switchAt) return;
    const target = f.kind === "player" ? state.enemy : state.player;
    if (!target || target.dead) {
      markLamuhMirrorPierceWhiff(f, moveData, "no_target");
      f.lamuhPierceDone = true;
      return;
    }
    const range = moveData.flags.pierceRange || 240;
    if (Math.abs(target.x - f.x) > range) {
      markLamuhMirrorPierceWhiff(f, moveData, "out_of_range");
      f.lamuhPierceDone = true;
      return;
    }
    const oldFacing = f.facing || (f.x <= target.x ? 1 : -1);
    const pierceBox = getLamuhMirrorPierceBox(f, target, oldFacing);
    if (intersects(pierceBox, getHurtbox(target))) {
      const result = applyLamuhMirrorPierceHit(f, target, moveData, pierceBox, oldFacing);
      if (result?.hit && !result.blocked) {
        startLamuhMirrorPierceHold(f, target, moveData);
        f.lamuhPierceConfirmed = true;
        f.lamuhPierceStage1Hit = true;
      } else if (result?.blocked) {
        markLamuhMirrorPierceWhiff(f, moveData, "blocked_pierce");
        f.lamuhPierceBlocked = true;
      }
    } else {
      markLamuhMirrorPierceWhiff(f, moveData, "missed_hurtbox");
    }
    f.x = clampToStageX(target.x + oldFacing * (moveData.flags.pierceExitOffset || 72));
    f.y = f.grounded ? GROUND_Y : f.y;
    f.facing = target.x >= f.x ? 1 : -1;
    f.vx = 0;
    f.lamuhPierceDone = true;
    state.cameraShake = Math.max(state.cameraShake, 10);
    spawnLamuhAfterimageTrail(f, 5, 24, "#f7f2df");
    spawnBurst(target.x - oldFacing * 18, target.y - 92, "#ffe8a3", 28, 0.22, "spark");
    spawnBurst(target.x + oldFacing * 16, target.y - 70, "#1b1510", 12, 0.16, "smoke");
    spawnBurst(f.x + f.facing * 48, f.y - 94, "#f7f2df", 22, 0.18, "ring");
  }

  function markLamuhMirrorPierceWhiff(f, moveData, reason) {
    if (!usesLamuhArt(f) || moveData.flags.visualProfile !== "mirrorPierce" || f.lamuhPierceConfirmed) return;
    f.lamuhPierceWhiffed = true;
    f.lamuhMirrorPierceCleanupReason = reason;
    clearMirrorPierceHoldForOpponent(f);
  }

  function getLamuhMirrorPierceBox(attacker, target, facing) {
    const minX = Math.min(attacker.x, target.x);
    const maxX = Math.max(attacker.x, target.x);
    return {
      x: minX - 54,
      y: Math.min(attacker.y, target.y) - 138,
      w: Math.max(120, maxX - minX + 108),
      h: 116
    };
  }

  function applyLamuhMirrorPierceHit(attacker, defender, moveData, box, facing) {
    const source = {
      ownerKind: attacker.kind,
      ownerCharacterId: attacker.profile?.id || attacker.characterId,
      x: attacker.x + facing * 34,
      y: attacker.y - 96,
      facing,
      damage: moveData.flags.pierceHitDamage || moveData.damage,
      hitstun: Number.isFinite(moveData.flags.pierceHitstunFrames) ? moveData.flags.pierceHitstunFrames / 60 : moveData.hitstun,
      blockstun: Math.max(8, Math.round((moveData.flags.pierceHitstunFrames || 18) * 0.58)) / 60,
      knockbackX: moveData.flags.pierceKnockbackX || moveData.knockbackX,
      knockbackY: moveData.flags.pierceKnockbackY ?? moveData.knockbackY,
      boxType: moveData.boxType,
      flags: {
        projectileImpact: true,
        mirrorPierceStage1: true,
        visualProfile: "mirrorPierce",
        impactProfile: moveData.flags.impactProfile
      }
    };
    return applyProjectileHit(source, defender, box);
  }

  function startLamuhMirrorPierceHold(attacker, defender, moveData) {
    const holdFrames = Number.isFinite(moveData.flags.pierceHoldFrames)
      ? moveData.flags.pierceHoldFrames
      : Math.max(24, Math.round(((moveData.flags.projectileSpawnAt || 0.95) - attacker.actionTime + 0.08) * 60));
    const holdSeconds = Math.max(0.2, holdFrames / 60);
    defender.mirrorPierceHoldTimer = Math.max(defender.mirrorPierceHoldTimer || 0, holdSeconds);
    defender.mirrorPierceHoldX = defender.x;
    defender.mirrorPierceHoldY = Math.min(defender.y, GROUND_Y - 24);
    defender.x = defender.mirrorPierceHoldX;
    defender.y = defender.mirrorPierceHoldY;
    defender.grounded = false;
    defender.vx = 0;
    defender.vy = 0;
    defender.hitstun = Math.max(defender.hitstun, holdSeconds);
    defender.reactionAnim = withEnemyPrefix(defender, "heavy_hitstun");
    spawnBurst(attacker.x + attacker.facing * 38, attacker.y - 96, "#35e8d5", 9, 0.16, "spark");
  }

  function updateLamuhMirrorPiercePalmPause(f, moveData) {
    if (!usesLamuhArt(f) || moveData.flags.visualProfile !== "mirrorPierce" || !f.lamuhPierceConfirmed || f.spawnedProjectile) return;
    const chargeStart = Number.isFinite(moveData.flags.beamChargeStartFrame)
      ? moveData.flags.beamChargeStartFrame / 60
      : Math.max(moveData.startup + moveData.active, (moveData.flags.projectileSpawnAt || 0.95) - 0.35);
    const beamFire = Number.isFinite(moveData.flags.beamFireFrame)
      ? moveData.flags.beamFireFrame / 60
      : (moveData.flags.projectileSpawnAt || 0.95);
    if (f.actionTime < chargeStart || f.actionTime >= beamFire) return;
    if (f.actionTime - (f.lamuhPiercePalmFxAt || -Infinity) < 0.1) return;
    f.lamuhPiercePalmFxAt = f.actionTime;
    spawnBurst(f.x + f.facing * 46, f.y - 94, "#35e8d5", 5, 0.12, "spark");
    spawnBurst(f.x + f.facing * 52, f.y - 96, "#ffe8a3", 4, 0.1, "ring");
  }

  function updateLamuhMirrorPierceWhiff(f, moveData) {
    if (!usesLamuhArt(f) || moveData.flags.visualProfile !== "mirrorPierce" || !f.lamuhPierceWhiffed || f.lamuhPierceConfirmed) return;
    const whiffFire = Number.isFinite(moveData.flags.whiffBeamFireFrame)
      ? moveData.flags.whiffBeamFireFrame / 60
      : Math.min(moveData.duration, 0.72);
    if (f.lamuhPierceWhiffBeamFired || f.actionTime < whiffFire) return;
    spawnLamuhMirrorPierceWhiffBeam(f, moveData);
    f.lamuhPierceWhiffBeamFired = true;
    f.spawnedProjectile = true;
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
    if (!isFightMode() || state.matchEnded || state.lamuhCinematicUltimate || p.dead || p.blockstun > 0 || p.hitstun > 0 || p.knockdownTimer > 0 || p.recoveryTimer > 0) return;
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
    if (!isFightMode() || state.matchEnded || state.lamuhCinematicUltimate || p.dead || p.superDashCooldown > 0) return;
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

  function maybeStartDoubleTapDash(fighter, controls, tap, code) {
    if (!fighter || !controls.dash?.includes(code)) return;
    const now = state.time;
    if (tap.code === code && now - tap.time <= DOUBLE_TAP_DASH_WINDOW) {
      startDash(fighter, controls);
      tap.code = null;
      tap.time = -Infinity;
      return;
    }
    tap.code = code;
    tap.time = now;
  }

  function jump(fighter = state.player) {
    const p = fighter;
    if (!isFightMode() || state.matchEnded || state.lamuhCinematicUltimate || p.dead || p.blockstun > 0 || p.hitstun > 0 || p.knockdownTimer > 0 || p.recoveryTimer > 0) return;
    if (p.action) {
      if (!canJumpCancel(p)) return;
      clearAction(p);
    }
    if (!p.grounded) return;
    if (isPlatformTestStage() && handleDropThroughJump(p)) return;
    p.vy = getJumpStats(p).jumpVelocity;
    p.grounded = false;
    p.standingPlatformId = null;
    p.landingTimer = 0;
    if (usesCelestePlaceholder(p)) p.upAttackGrace = 0.08;
  }

  function canJumpCancel(f) {
    const current = getMove(f);
    if (!current) return false;
    return current.flags.jumpCancel && (f.cancelUnlocked || f.actionTime >= current.cancelTime);
  }

  function clearAction(f) {
    const wasMirrorPierce = getMove(f)?.flags?.visualProfile === "mirrorPierce";
    if (wasMirrorPierce) clearMirrorPierceHoldForOpponent(f);
    f.action = null;
    f.activeMove = null;
    f.hasHit = false;
    f.hitCount = 0;
    f.lastHitTime = -Infinity;
    f.spawnedProjectile = false;
    f.spawnedTrap = false;
    f.cancelUnlocked = false;
    f.mirrorPierceWallBouncePending = false;
    f.mirrorPierceHoldTimer = 0;
    f.mirrorPierceHoldX = null;
    f.mirrorPierceHoldY = null;
    f.lamuhPierceDone = false;
    f.lamuhPierceConfirmed = false;
    f.lamuhPierceStage1Hit = false;
    f.lamuhPierceWhiffed = false;
    f.lamuhPierceBlocked = false;
    f.lamuhPierceWhiffBeamFired = false;
    f.lamuhPiercePalmFxAt = -Infinity;
    f.bufferedMove = null;
    f.cinematicAnimDuration = null;
  }

  function clearMirrorPierceHoldForOpponent(attacker) {
    const defender = attacker?.kind === "player" ? state.enemy : state.player;
    if (!defender) return;
    defender.mirrorPierceHoldTimer = 0;
    defender.mirrorPierceHoldX = null;
    defender.mirrorPierceHoldY = null;
  }

  function finishLamuhMirrorPierceAction(f, reason = "finished", failsafe = false) {
    clearMirrorPierceHoldForOpponent(f);
    f.action = null;
    f.activeMove = null;
    f.hasHit = false;
    f.hitCount = 0;
    f.lastHitTime = -Infinity;
    f.spawnedProjectile = false;
    f.spawnedTrap = false;
    f.cancelUnlocked = false;
    f.bufferedMove = null;
    f.vx = 0;
    f.anim = withEnemyPrefix(f, "idle");
    f.lamuhMirrorPierceCleanupReason = reason;
    f.lamuhMirrorPierceFailsafeTriggered = failsafe === true;
    f.lamuhPierceDone = false;
    f.lamuhPierceConfirmed = false;
    f.lamuhPierceStage1Hit = false;
    f.lamuhPierceWhiffed = false;
    f.lamuhPierceBlocked = false;
    f.lamuhPierceWhiffBeamFired = false;
    f.lamuhPiercePalmFxAt = -Infinity;
  }

  function isBlockingHit(attacker, defender) {
    const attackerIsInFront = (attacker.x > defender.x) === (defender.facing === 1);
    return defender.blocking && defender.grounded && attackerIsInFront;
  }

  function getStageHitSeparation(attacker, defender, comboEnder = false) {
    if (!isPlatformTestStage()) {
      return comboEnder
        ? (defender.grounded && attacker.grounded ? HEAVY_GROUND_BLOWBACK_SEPARATION : HEAVY_AIR_BLOWBACK_SEPARATION)
        : (defender.grounded && attacker.grounded ? GROUND_HIT_SEPARATION : AIR_HIT_SEPARATION);
    }
    const separation = getPlatformArenaConfig()?.combat?.hitSeparation || {};
    if (comboEnder) return defender.grounded && attacker.grounded ? separation.heavyGround : separation.heavyAir;
    return defender.grounded && attacker.grounded ? separation.ground : separation.air;
  }

  function enforceHitSeparation(attacker, defender, moveData, blocked = false, comboEnder = false) {
    if (!attacker || !defender || moveData.flags?.superDash) return;
    const desired = getStageHitSeparation(attacker, defender, comboEnder);
    const dir = attacker.facing || (attacker.x <= defender.x ? 1 : -1);
    const currentGap = Math.abs(defender.x - attacker.x);

    if ((dir === 1 && defender.x < attacker.x) || (dir === -1 && defender.x > attacker.x)) {
      defender.x = attacker.x + dir * desired;
    } else if (currentGap < desired) {
      const correction = desired - currentGap;
      const defenderShare = defender.grounded ? 0.68 : 0.76;
      defender.x += dir * correction * defenderShare;
      attacker.x -= dir * correction * (1 - defenderShare);
    } else if (!comboEnder && !defender.grounded && currentGap > AIR_HIT_MAX_SEPARATION && moveData.flags?.air) {
      const pull = Math.min(currentGap - AIR_HIT_MAX_SEPARATION, 28);
      defender.x -= dir * pull;
    }

    if (!blocked && !defender.grounded) {
      defender.vx += dir * 18;
      attacker.vx -= dir * 8;
    }

    attacker.x = clampToStageX(attacker.x);
    defender.x = clampToStageX(defender.x);
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

  function isHeavyComboMove(moveData, moveKey = "") {
    return moveData?.boxType === "heavy" || moveKey.includes("heavy");
  }

  function getComboPriorHits(attacker, defender) {
    const combo = state.combo;
    return combo.owner === attacker.kind && combo.target === defender.kind ? combo.hits : 0;
  }

  function getHeavyHitsInCombo(attacker, defender) {
    const combo = state.combo;
    return combo.owner === attacker.kind && combo.target === defender.kind ? combo.heavyHits || 0 : 0;
  }

  function hasComboWallBounceSpent(attacker, defender) {
    const combo = state.combo;
    return combo.owner === attacker.kind && combo.target === defender.kind && combo.wallBounces >= WALL_BOUNCE_MAX_PER_COMBO;
  }

  function getHeavyComboHitstunScale(attacker, defender, moveData) {
    if (!isHeavyComboMove(moveData, attacker.activeMove || "")) return 1;
    const priorHits = getComboPriorHits(attacker, defender);
    if (priorHits >= HEAVY_HITSTUN_DECAY_HIGH_START_HITS) return HEAVY_HITSTUN_HIGH_COMBO_SCALE;
    if (priorHits >= HEAVY_HITSTUN_DECAY_MID_START_HITS) return HEAVY_HITSTUN_MID_COMBO_SCALE;
    return 1;
  }

  function getCelesteJuggleHitstunScale(attacker, defender, moveData) {
    if (!usesCelestePlaceholder(attacker) || defender.grounded) return 1;
    const move = (attacker.activeMove || "").replace(/^enemy_/, "");
    const priorHits = getComboPriorHits(attacker, defender);
    if (["up_medium", "up_heavy", "down_heavy"].includes(move)) {
      if (priorHits >= 5) return 0.58;
      if (priorHits >= 3) return 0.7;
      if (priorHits >= 1) return 0.84;
    }
    if (moveData.flags?.air) {
      if (priorHits >= 6) return 0.62;
      if (priorHits >= 4) return 0.76;
    }
    return 1;
  }

  function getPlatformJuggleHitstunScale(attacker, defender, source) {
    if (!isPlatformTestStage() || defender.grounded) return 1;
    const decay = getPlatformArenaConfig()?.combat?.juggleHitstunScale || {};
    const priorHits = getComboPriorHits(attacker, defender);
    const heavy = isHeavyComboMove(source, attacker.activeMove || "");
    if (heavy) {
      if (priorHits >= 5) return decay.heavyExhausted ?? 0.45;
      if (priorHits >= 3) return decay.heavyLate ?? 0.56;
      if (priorHits >= 1) return decay.heavyRepeated ?? 0.68;
      return decay.heavyFirst ?? 0.82;
    }
    if (priorHits >= 6) return decay.normalExhausted ?? 0.52;
    if (priorHits >= 4) return decay.normalLate ?? 0.64;
    if (priorHits >= 2) return decay.normalMid ?? 0.78;
    return 1;
  }

  function getPlatformKnockbackScale(attacker, defender, source) {
    if (!isPlatformTestStage()) return 1;
    const knockback = getPlatformArenaConfig()?.combat?.knockbackScale || {};
    const priorHits = getComboPriorHits(attacker, defender);
    if (isHeavyComboMove(source, attacker.activeMove || "")) {
      const heavyHits = getHeavyHitsInCombo(attacker, defender);
      const base = defender.grounded ? knockback.heavyGroundBase : knockback.heavyAirBase;
      return Math.min(knockback.heavyMax ?? 1.76, (base ?? 1.22) + heavyHits * (knockback.heavyStep ?? 0.12));
    }
    return !defender.grounded && priorHits >= 3 ? (knockback.normalAirLate ?? 1.14) : 1;
  }

  function shouldCelesteAirHeavyBounce(attacker, defender) {
    if (!usesCelestePlaceholder(attacker)) return false;
    const move = (attacker.activeMove || "").replace(/^enemy_/, "");
    if (move !== "jump_heavy") return false;
    const combo = state.combo;
    const sameCombo = combo.owner === attacker.kind && combo.target === defender.kind;
    return !sameCombo || !combo.celesteAirBounceSpent;
  }

  function applyCelesteAirHeavyBounce(defender) {
    defender.grounded = false;
    defender.pendingKnockdown = 0;
    defender.vy = Math.min(defender.vy, CELESTE_AIR_L_BOUNCE_VY);
    defender.hitstun = Math.max(defender.hitstun, CELESTE_AIR_L_BOUNCE_HITSTUN);
    defender.juggleGravityScale = Math.max(defender.juggleGravityScale || 1, 1.22);
  }

  function getHeavyComboKnockbackScale(attacker, defender, moveData) {
    if (!isHeavyComboMove(moveData, attacker.activeMove || "")) return 1;
    const heavyHits = getHeavyHitsInCombo(attacker, defender);
    const airborneScale = !defender.grounded ? HEAVY_AIRBORNE_BLOWBACK_X_MULT : HEAVY_BLOWBACK_X_MULT;
    if (heavyHits >= HEAVY_HITS_BEFORE_FORCED_KNOCKDOWN - 1) return Math.max(airborneScale, HEAVY_BLOWBACK_KNOCKBACK_SCALE);
    if (heavyHits >= 1) return Math.max(airborneScale, HEAVY_REPEATED_KNOCKBACK_MULT);
    return airborneScale;
  }

  function shouldHeavyForceBlowback(attacker, defender, moveData) {
    if (!isHeavyComboMove(moveData, attacker.activeMove || "")) return false;
    const heavyHits = getHeavyHitsInCombo(attacker, defender);
    const priorHits = getComboPriorHits(attacker, defender);
    return !defender.grounded && (
      hasComboWallBounceSpent(attacker, defender) ||
      heavyHits >= HEAVY_AIR_BLOWBACK_START_HITS - 1 ||
      heavyHits >= HEAVY_HITS_BEFORE_BLOWBACK - 1 ||
      priorHits >= HEAVY_JUGGLE_KNOCKDOWN_THRESHOLD - 1
    );
  }

  function scaleHeavyRelaunch(attacker, defender, moveData, knockbackY) {
    if (!isHeavyComboMove(moveData, attacker.activeMove || "") || knockbackY >= 0) return knockbackY;
    if (isPlatformTestStage()) {
      const combat = getPlatformArenaConfig()?.combat || {};
      if (!defender.grounded) return knockbackY * (combat.heavyRelaunchAirScale ?? HEAVY_RELAUNCH_SECOND_SCALE);
      return getHeavyHitsInCombo(attacker, defender) >= 1
        ? knockbackY * (combat.heavyRelaunchRepeatedGroundScale ?? HEAVY_RELAUNCH_SECOND_SCALE)
        : knockbackY;
    }
    if (!defender.grounded) return knockbackY * HEAVY_RELAUNCH_SECOND_SCALE;
    return getHeavyHitsInCombo(attacker, defender) >= 1 ? knockbackY * HEAVY_RELAUNCH_SECOND_SCALE : knockbackY;
  }

  function queuePlatformAirRecovery(attacker, defender, moveData, priorHits) {
    if (!isPlatformTestStage() || defender.grounded || !attacker || !defender || !moveData) return;
    const combat = getPlatformArenaConfig()?.combat || {};
    const repeatedHeavy = isHeavyComboMove(moveData, attacker.activeMove || "") && getHeavyHitsInCombo(attacker, defender) >= 1;
    if (!repeatedHeavy && priorHits < (combat.airRecoveryStartHits ?? 4)) return;
    defender.platformAirRecoveryTimer = Math.max(defender.platformAirRecoveryTimer || 0, combat.airRecoveryWindow ?? 0);
  }

  function getHeavyMinimumKnockback(attacker, defender, moveData, forceBlowback) {
    if (!isHeavyComboMove(moveData, attacker.activeMove || "")) return 0;
    if (forceBlowback || getHeavyHitsInCombo(attacker, defender) >= HEAVY_HITS_BEFORE_FORCED_KNOCKDOWN - 1) return HEAVY_FORCED_KNOCKDOWN_MIN_X;
    return defender.grounded ? HEAVY_BLOWBACK_MIN_X : HEAVY_AIRBORNE_BLOWBACK_MIN_X;
  }

  function getAirJuggleGravityScale(priorHits) {
    if (priorHits >= 7) return AIR_JUGGLE_GRAVITY_SCALE_7_HITS;
    if (priorHits >= 5) return AIR_JUGGLE_GRAVITY_SCALE_5_HITS;
    if (priorHits >= 3) return AIR_JUGGLE_GRAVITY_SCALE_3_HITS;
    return 1;
  }

  function getImpactProfile(source, blocked = false) {
    if (blocked) {
      return { hitStop: 0.024, shake: 1.5, sparkCount: 7, sparkSize: 8, burstSize: 18, speed: 180, life: 0.18, color: "#7fd6ff" };
    }
    const flags = source.flags || {};
    if (flags.impactProfile) {
      return {
        hitStop: 0.056,
        shake: 6,
        sparkCount: 14,
        sparkSize: 13,
        burstSize: 27,
        speed: 340,
        life: 0.26,
        color: "#ffe4a8",
        dramatic: true,
        ...flags.impactProfile
      };
    }
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
    const hitStop = profile.hitStop * (getFightingSpeedTuning()?.hitstopMultiplier ?? 1);
    state.hitPause = Math.max(state.hitPause, hitStop);
    state.cameraShake = Math.max(state.cameraShake, profile.shake);
    spawnHitSpark(x, y, profile, blocked);
  }

  function registerComboHit(attacker, defender, moveData) {
    const combo = state.combo;
    if (combo.owner !== attacker.kind || combo.target !== defender.kind) {
      combo.owner = attacker.kind;
      combo.target = defender.kind;
      combo.hits = 0;
      combo.heavyHits = 0;
      combo.wallBounces = 0;
      combo.celesteAirBounceSpent = false;
    }
    combo.hits += 1;
    if (isHeavyComboMove(moveData, attacker.activeMove || "")) combo.heavyHits += 1;
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
    state.combo.heavyHits = 0;
    state.combo.wallBounces = 0;
    state.combo.celesteAirBounceSpent = false;
    state.combo.timer = 0;
    if (hard) {
      state.combo.displayHits = 0;
      state.combo.displayTimer = 0;
    }
  }

  function tryHit(attacker, defender, moveData) {
    if (state.matchEnded) return false;
    if (!defender || defender.dead) return false;
    const hitbox = getHitbox(attacker, moveData);
    const hurtbox = getHurtbox(defender);
    if (!intersects(hitbox, hurtbox)) return false;

    attacker.hasHit = true;
    attacker.cancelUnlocked = true;
    if (tryCelesteBarrierAbsorb(defender, attacker, moveData, hitbox)) return true;
    const blocked = isBlockingHit(attacker, defender);
    const defenderWasAirborne = !defender.grounded;
    const isHeavyHit = isHeavyComboMove(moveData, attacker.activeMove || "");
    const priorComboHits = getComboPriorHits(attacker, defender);
    const postWallBounceHeavy = isHeavyHit && hasComboWallBounceSpent(attacker, defender);
    const heavyBlowback = !blocked && shouldHeavyForceBlowback(attacker, defender, moveData);
    const forceHeavyEnder = !blocked && isHeavyHit && (postWallBounceHeavy || heavyBlowback || getHeavyHitsInCombo(attacker, defender) >= HEAVY_HITS_BEFORE_FORCED_KNOCKDOWN - 1 || priorComboHits >= HEAVY_JUGGLE_KNOCKDOWN_THRESHOLD - 1);
    const celesteAirHeavyBounce = !blocked && shouldCelesteAirHeavyBounce(attacker, defender);
    if (!blocked && isLamuhCrownStarter(attacker, moveData)) {
      startLamuhCinematicUltimate(attacker, defender, hitbox);
      return true;
    }
    const damageScale = blocked ? 1 : getComboDamageScale(attacker);
    const hitstunScale = blocked ? 1 : Math.min(getComboHitstunScale(attacker), getHeavyComboHitstunScale(attacker, defender, moveData), getCelesteJuggleHitstunScale(attacker, defender, moveData), getPlatformJuggleHitstunScale(attacker, defender, moveData));
    const heavyKnockbackScale = getHeavyComboKnockbackScale(attacker, defender, moveData);
    const knockbackScale = blocked ? 1 : getComboKnockbackScale(attacker) * heavyKnockbackScale * getPlatformKnockbackScale(attacker, defender, moveData);
    const damage = blocked ? 0 : Math.max(COMBO_MIN_DAMAGE, Math.ceil(moveData.damage * damageScale));
    defender.hp = Math.max(0, defender.hp - damage);
    defender.blockstun = blocked ? moveData.blockstun : 0;
    defender.hitstun = blocked ? 0 : moveData.hitstun * hitstunScale;
    if (forceHeavyEnder) defender.hitstun = Math.min(defender.hitstun, HEAVY_FORCED_FALLOUT_HITSTUN);
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
      const minHeavyKnockback = getHeavyMinimumKnockback(attacker, defender, moveData, forceHeavyEnder);
      const scaledKnockbackX = Math.max(Math.abs(moveData.knockbackX) * knockbackScale, minHeavyKnockback);
      const airKnockbackCap = isHeavyHit ? HEAVY_AIR_KNOCKBACK_CAP : MAX_AIR_KNOCKBACK_X;
      const cappedKnockback = defenderWasAirborne && !blocked ? Math.min(scaledKnockbackX, airKnockbackCap) : scaledKnockbackX;
      const airScale = defenderWasAirborne && !blocked ? (isHeavyHit ? 1.05 : 0.72) : 1;
      defender.vx = dir * (blocked ? cappedKnockback * 0.3 : cappedKnockback * airScale);
    }
    const comboKnockbackY = scaleHeavyRelaunch(attacker, defender, moveData, moveData.knockbackY);
    const knockbackY = defenderWasAirborne && !blocked && comboKnockbackY > 0 ? Math.min(comboKnockbackY, MAX_AIR_SPIKE_VELOCITY) : comboKnockbackY;
    if (forceHeavyEnder) defender.vy = Math.max(defender.vy, HEAVY_BLOWBACK_DOWN_VELOCITY);
    else if (isHeavyHit && defenderWasAirborne && !blocked) defender.vy = Math.max(defender.vy, HEAVY_BLOWBACK_DOWN_VELOCITY * 0.45);
    else defender.vy = Math.min(defender.vy, blocked ? 0 : knockbackY);
    if (!blocked && (moveData.flags.launcher || moveData.knockbackY < -260)) {
      defender.grounded = false;
    }
    if (celesteAirHeavyBounce) applyCelesteAirHeavyBounce(defender);
    applyFightingKnockbackVelocity(defender, blocked);
    enforceHitSeparation(attacker, defender, moveData, blocked, isHeavyHit && !blocked);
    if (!blocked) {
      if (moveData.flags.hardKnockdown) defender.pendingKnockdown = Math.max(defender.pendingKnockdown, HARD_KNOCKDOWN);
      if (moveData.flags.softKnockdown) defender.pendingKnockdown = Math.max(defender.pendingKnockdown, SOFT_KNOCKDOWN);
      if (forceHeavyEnder) defender.pendingKnockdown = Math.max(defender.pendingKnockdown, SOFT_KNOCKDOWN);
      if (isHeavyHit) {
        defender.blowbackTimer = Math.max(defender.blowbackTimer, HEAVY_BLOWBACK_DRIFT_TIME);
        const canWallBounceThisHeavy = !postWallBounceHeavy && getHeavyHitsInCombo(attacker, defender) < HEAVY_HITS_BEFORE_FORCED_KNOCKDOWN - 1;
        defender.wallBounceEligible = canWallBounceThisHeavy && Math.abs(defender.vx) >= WALL_BOUNCE_MIN_HEAVY_KNOCKBACK;
      } else {
        defender.wallBounceEligible = false;
      }
      defender.juggleGravityScale = !defender.grounded ? Math.max(defender.juggleGravityScale || 1, getAirJuggleGravityScale(priorComboHits + 1)) : 1;
      defender.recoveryTimer = 0;
      defender.landingTimer = 0;
      queuePlatformAirRecovery(attacker, defender, moveData, priorComboHits);
      registerComboHit(attacker, defender, moveData);
      if (celesteAirHeavyBounce) state.combo.celesteAirBounceSpent = true;
    } else {
      resetCombo();
    }

    if (shouldGainMeter(attacker) && !moveData.flags.ultimate) {
      growFighterMeter(attacker, moveData.flags.meter || Math.ceil(moveData.damage / 12));
    }

    applyImpactFeedback(moveData, hitbox.x + hitbox.w * 0.65, hitbox.y + hitbox.h * 0.45, blocked);
    spawnLamuhImpactVfx(attacker, defender, moveData, hitbox, blocked);

    if (defender.hp <= 0) {
      endMatch(defender);
    }
    return true;
  }

  function spawnProjectile(owner, moveData) {
    const direction = owner.facing;
    const activeSpecialKey = owner.activeMove || "";
    const special = owner.profile.specialMoves?.[activeSpecialKey]
      || (owner.profile?.id === "lamuh" ? owner.profile.specialMoves?.[activeSpecialKey.replace(/^enemy_/, "")] : null)
      || {};
    const serisProjectileVfx = owner.profile?.id === "seris" && owner.profile.vfx?.runtimeEnabled
      ? owner.profile.vfx?.mappings?.[owner.activeMove]
      : null;
    const celesteProjectileOrigin = owner.profile?.id === "celeste" ? resolveCelesteSocket(owner, "projectileOrigin") : null;
    const celesteBatonOrigin = owner.profile?.id === "celeste" ? resolveCelesteSocket(owner, "batonTip") : null;
    const lamuhProjectileOrigin = owner.profile?.id === "lamuh"
      ? {
        x: owner.x + direction * (special.spawnOffsetX || 112),
        y: owner.y + (special.spawnOffsetY || -86)
      }
      : null;
    const lamuhVisualOffsetX = Number.isFinite(special.visualOffsetX) ? special.visualOffsetX : (special.spawnOffsetX || 112);
    const lamuhVisualOffsetY = Number.isFinite(special.visualOffsetY) ? special.visualOffsetY : (special.spawnOffsetY || -86);
    const lamuhVisualOrigin = owner.profile?.id === "lamuh"
      ? {
        x: owner.x + direction * lamuhVisualOffsetX,
        y: owner.y + lamuhVisualOffsetY
      }
      : null;
    const visualOriginX = celesteBatonOrigin?.x ?? lamuhVisualOrigin?.x ?? owner.x + direction * 34;
    const visualOriginY = celesteBatonOrigin?.y ?? lamuhVisualOrigin?.y ?? owner.y - 102;
    const spawnX = celesteProjectileOrigin?.x ?? lamuhProjectileOrigin?.x ?? owner.x + direction * (special.spawnOffsetX || 112);
    const spawnY = celesteProjectileOrigin?.y ?? lamuhProjectileOrigin?.y ?? owner.y + (special.spawnOffsetY || -86);
    const mirrorPierceBeam = moveData.flags.visualProfile === "mirrorPierce";
    state.projectiles.push({
      ownerKind: owner.kind,
      ownerCharacterId: owner.profile?.id || owner.characterId,
      visualOriginX,
      visualOriginY,
      visualAnchorOffsetX: lamuhProjectileOrigin ? lamuhVisualOffsetX : null,
      visualAnchorOffsetY: lamuhProjectileOrigin ? lamuhVisualOffsetY : null,
      x: spawnX,
      y: spawnY,
      vx: direction * (moveData.flags.projectileSpeed ?? 520),
      facing: direction,
      w: special.projectileWidth || 92,
      h: special.projectileHeight || 22,
      damage: mirrorPierceBeam ? (moveData.flags.beamDamage || moveData.damage) : moveData.damage,
      hitstun: mirrorPierceBeam && Number.isFinite(moveData.flags.beamHitstunFrames) ? moveData.flags.beamHitstunFrames / 60 : moveData.hitstun,
      blockstun: mirrorPierceBeam && Number.isFinite(moveData.flags.beamBlockstunFrames) ? moveData.flags.beamBlockstunFrames / 60 : moveData.blockstun,
      knockbackX: mirrorPierceBeam ? (moveData.flags.beamKnockbackX || moveData.knockbackX) : moveData.knockbackX,
      knockbackY: mirrorPierceBeam ? (moveData.flags.beamKnockbackY ?? moveData.knockbackY) : moveData.knockbackY,
      boxType: moveData.boxType,
      flags: {
        projectileImpact: true,
        visualProfile: moveData.flags.visualProfile,
        impactProfile: mirrorPierceBeam ? (moveData.flags.beamImpactProfile || moveData.flags.impactProfile) : moveData.flags.impactProfile,
        launcher: moveData.flags.launcher === true,
        softKnockdown: moveData.flags.softKnockdown === true,
        hardKnockdown: moveData.flags.hardKnockdown === true,
        mirrorPierceBeam,
        forceWallBounce: mirrorPierceBeam && moveData.flags.forceWallBounce === true
      },
      life: special.projectileLife || 1.1,
      maxLife: special.projectileLife || 1.1,
      color: owner.profile.projectileColor,
      vfxKey: serisProjectileVfx
    });
    if (mirrorPierceBeam) {
      const tipX = spawnX + direction * (special.projectileWidth || 560);
      spawnBurst(spawnX + direction * 28, spawnY, "#35e8d5", 12, 0.12, "spark");
      spawnBurst(tipX, spawnY, "#ffe8a3", 18, 0.16, "spark");
    } else if (owner.profile?.id !== "seris" || owner.profile.vfx?.runtimeEnabled) {
      spawnBurst(spawnX, spawnY, owner.profile.projectileColor, 18);
    }
  }

  function getFighterControls(f) {
    return f?.kind === "enemy" && state.mode === "versus" ? P2_CONTROLS : P1_CONTROLS;
  }

  function isOverPlatform(f, platform, margin = 34) {
    return f.x >= platform.x - margin && f.x <= platform.x + platform.w + margin;
  }

  function getStandingPlatform(f) {
    if (!f?.standingPlatformId) return null;
    return getActiveStagePreset().platforms.find((platform) => platform.id === f.standingPlatformId) || null;
  }

  function handleDropThroughJump(f, controls = getFighterControls(f)) {
    const platform = getStandingPlatform(f);
    if (!platform?.dropThrough || !state.keys.has(controls.down)) return false;
    const movement = getPlatformArenaConfig()?.movement || {};
    f.platformDropTimer = movement.dropThroughTimer ?? 0.22;
    f.standingPlatformId = null;
    f.grounded = false;
    f.y += movement.dropThroughNudgeY ?? 7;
    f.vy = Math.max(f.vy, movement.dropThroughVelocity ?? 90);
    f.landingTimer = 0;
    return true;
  }

  function finishFighterLanding(f, wasGrounded) {
    f.vy = 0;
    f.grounded = true;
    f.juggleGravityScale = 1;
    f.platformAirRecoveryTimer = 0;
    f.wallBounceEligible = false;
    f.airDashUsed = false;
    if (!wasGrounded) {
      if (f.pendingKnockdown > 0) {
        f.knockdownTimer = Math.max(f.knockdownTimer, f.pendingKnockdown);
        f.pendingKnockdown = 0;
        f.vx *= 0.24;
        spawnLandingDust(f);
      } else if (!f.action && f.hitstun <= 0) {
        f.landingTimer = Math.max(f.landingTimer, getJumpStats(f).landingRecovery);
        f.vx *= isPlatformTestStage() ? (getPlatformArenaConfig()?.movement?.landingVelocityScale ?? 0.42) : 0.42;
      }
    }
  }

  function resolveStageLanding(f, previousY, wasGrounded) {
    const stage = getActiveStagePreset();
    if (f.platformDropTimer <= 0 && f.vy >= 0) {
      for (const platform of stage.platforms) {
        if (!isOverPlatform(f, platform)) continue;
        const crossedTop = previousY <= platform.y + 6 && f.y >= platform.y;
        if (!crossedTop || f.y >= stage.groundY - 16) continue;
        f.y = platform.y;
        f.standingPlatformId = platform.id;
        finishFighterLanding(f, wasGrounded);
        return;
      }
    }

    if (f.y >= stage.groundY) {
      f.y = stage.groundY;
      f.standingPlatformId = null;
      finishFighterLanding(f, wasGrounded);
      return;
    }

    if (wasGrounded && f.standingPlatformId && !isOverPlatform(f, getStandingPlatform(f) || { x: 0, w: 0 })) {
      f.vy = Math.max(f.vy, 0);
    }
    f.grounded = false;
    f.standingPlatformId = null;
  }

  function spawnLamuhMirrorPierceWhiffBeam(owner, moveData) {
    const direction = owner.facing || 1;
    const special = owner.profile.specialMoves?.[owner.activeMove] || {};
    const spawnX = owner.x + direction * (special.spawnOffsetX || 52);
    const spawnY = owner.y + (special.spawnOffsetY || -96);
    state.projectiles.push({
      ownerKind: owner.kind,
      ownerCharacterId: owner.profile?.id || owner.characterId,
      visualOriginX: owner.x + direction * 34,
      visualOriginY: owner.y - 102,
      x: spawnX,
      y: spawnY,
      vx: 0,
      facing: direction,
      w: special.projectileWidth || 640,
      h: special.projectileHeight || 82,
      damage: 0,
      hitstun: 0,
      blockstun: 0,
      knockbackX: 0,
      knockbackY: 0,
      boxType: moveData.boxType,
      flags: {
        visualProfile: "mirrorPierce",
        mirrorPierceBeam: true,
        visualOnly: true
      },
      life: Math.min(special.projectileLife || 0.24, 0.18),
      maxLife: Math.min(special.projectileLife || 0.24, 0.18),
      color: owner.profile.projectileColor
    });
    const tipX = spawnX + direction * (special.projectileWidth || 640);
    spawnBurst(spawnX + direction * 28, spawnY, "#35e8d5", 8, 0.1, "spark");
    spawnBurst(tipX, spawnY, "#ffe8a3", 10, 0.12, "spark");
  }

  function updateProjectiles(dt) {
    for (const projectile of state.projectiles) {
      projectile.life -= dt;
      projectile.x += projectile.vx * dt;
      const defender = projectile.ownerKind === "player" ? state.enemy : state.player;
      if (projectile.flags?.visualOnly || projectile.hit || !defender || defender.dead) continue;
      const box = getProjectileBox(projectile);
      if (intersects(box, getHurtbox(defender))) {
        applyProjectileHit(projectile, defender, box);
      }
    }

    state.projectiles = state.projectiles.filter((projectile) => {
      const stage = getActiveStagePreset();
      const minX = stage.leftBound - 260;
      const maxX = stage.rightBound + 260;
      if (projectile.flags?.mirrorPierceBeam) return projectile.life > 0 && projectile.x > minX && projectile.x < maxX;
      return !projectile.hit && projectile.life > 0 && projectile.x > minX && projectile.x < maxX;
    });
  }

  function applyProjectileHit(projectile, defender, box) {
    if (state.matchEnded) return { hit: false, blocked: false, damage: 0 };
    projectile.hit = true;
    const attackerIsInFront = (projectile.x > defender.x) === (defender.facing === 1);
    const blocked = defender.blocking && defender.grounded && attackerIsInFront;
    const owner = projectile.ownerKind === "player" ? state.player : state.enemy;
    if (tryCelesteBarrierAbsorb(defender, owner, projectile, box)) return { hit: true, blocked: true, damage: 0 };
    const damageScale = blocked || !owner ? 1 : getComboDamageScale(owner);
    const hitstunScale = blocked || !owner ? 1 : Math.min(getComboHitstunScale(owner), getPlatformJuggleHitstunScale(owner, defender, projectile));
    const knockbackScale = blocked || !owner ? 1 : getComboKnockbackScale(owner) * getPlatformKnockbackScale(owner, defender, projectile);
    const damage = blocked ? 0 : Math.max(COMBO_MIN_DAMAGE, Math.ceil(projectile.damage * damageScale));

    defender.hp = Math.max(0, defender.hp - damage);
    defender.blockstun = blocked ? projectile.blockstun : 0;
    defender.hitstun = blocked ? 0 : projectile.hitstun * hitstunScale;
    defender.action = null;
    defender.activeMove = null;
    defender.hasHit = false;
    defender.spawnedProjectile = false;
    defender.mirrorPierceHoldTimer = 0;
    defender.mirrorPierceHoldX = null;
    defender.mirrorPierceHoldY = null;
    setNyxReactionAnim(defender, projectile, blocked);
    const scaledProjectileKnockbackX = Math.abs(projectile.knockbackX) * knockbackScale;
    const airX = !defender.grounded && !blocked && !projectile.flags?.mirrorPierceBeam ? Math.min(scaledProjectileKnockbackX, MAX_AIR_KNOCKBACK_X) * 0.65 : scaledProjectileKnockbackX;
    defender.vx = projectile.facing * (blocked ? airX * 0.25 : airX);
    const projectileY = !defender.grounded && !blocked && projectile.knockbackY > 0 ? Math.min(projectile.knockbackY, MAX_AIR_SPIKE_VELOCITY) : projectile.knockbackY;
    defender.vy = Math.min(defender.vy, blocked ? 0 : projectileY);
    applyFightingKnockbackVelocity(defender, blocked);
    if (!blocked && projectile.flags?.mirrorPierceBeam) {
      defender.grounded = false;
      defender.blowbackTimer = Math.max(defender.blowbackTimer, HEAVY_BLOWBACK_DRIFT_TIME);
      defender.pendingKnockdown = Math.max(defender.pendingKnockdown, SOFT_KNOCKDOWN);
      defender.wallBounceEligible = Math.abs(defender.vx) >= WALL_BOUNCE_MIN_HEAVY_KNOCKBACK;
      defender.mirrorPierceWallBouncePending = projectile.flags.forceWallBounce === true;
    }
    defender.anim = getHitReactionAnim(defender, defender.kind === "enemy" ? "enemy_damaged" : "damaged");
    if (owner) enforceHitSeparation(owner, defender, projectile, blocked);
    if (!blocked && owner) {
      const priorHits = getComboPriorHits(owner, defender);
      defender.juggleGravityScale = !defender.grounded ? Math.max(defender.juggleGravityScale || 1, getAirJuggleGravityScale(priorHits + 1)) : 1;
      queuePlatformAirRecovery(owner, defender, projectile, priorHits);
      registerComboHit(owner, defender, projectile);
    }
    if (blocked) resetCombo();
    if (!blocked && owner && shouldGainMeter(owner)) {
      growFighterMeter(owner, Math.ceil(projectile.damage / 12));
    }

    applyImpactFeedback(projectile, box.x + box.w * 0.5, box.y + box.h * 0.5, blocked);
    spawnLamuhImpactVfx(owner, defender, projectile, box, blocked);

    if (defender.hp <= 0) {
      endMatch(defender);
    }
    return { hit: true, blocked, damage };
  }

  function getFighterByKind(kind) {
    return kind === "enemy" ? state.enemy : state.player;
  }

  function tryCelesteBarrierAbsorb(defender, attacker, source, box) {
    if (!usesCelestePlaceholder(defender) || defender.celesteBarrierTimer <= 0 || defender.celesteBarrierHits <= 0) return false;
    defender.celesteBarrierTimer = 0;
    defender.celesteBarrierHits = 0;
    defender.blockstun = Math.max(defender.blockstun, 0.16);
    defender.vx = -(defender.facing || 1) * 54;
    defender.celesteFaWindow = 0;
    const x = box.x + box.w * 0.5;
    const y = box.y + box.h * 0.5;
    applyImpactFeedback({ ...source, flags: { ...(source.flags || {}), projectileImpact: true }, boxType: source.boxType || "medium" }, x, y, true);
    const barrier = resolveCelesteSocket(defender, "barrierCenter");
    spawnBurst(barrier.x, barrier.y, celesteSpiritColors.LA.main, 30, 0.24, "ring");
    if (attacker && attacker !== defender) {
      attacker.vx *= 0.35;
      attacker.cancelUnlocked = false;
    }
    resetCombo();
    return true;
  }

  function spawnCelesteTrap(owner) {
    if (!usesCelestePlaceholder(owner)) return;
    const placement = resolveCelesteSocket(owner, "trapPlacementOrigin");
    const x = clamp(placement.x, 128, W - 128);
    const y = GROUND_Y - 82;
    state.celesteTraps.push({
      ownerKind: owner.kind,
      ownerCharacterId: owner.profile?.id || owner.characterId,
      x,
      y,
      facing: owner.facing,
      age: 0,
      armTime: CELESTE_TI_ARM_TIME,
      detonateTime: CELESTE_TI_DETONATE_TIME,
      life: CELESTE_TI_LIFE,
      radius: 56,
      detonating: false,
      detonationAge: 0,
      hit: false
    });
    spawnBurst(x, y - 6, celesteSpiritColors.TI.secondary, 18, 0.2, "spark");
  }

  function updateCelesteTraps(dt) {
    for (const trap of state.celesteTraps) {
      trap.age += dt;
      if (trap.detonating) {
        trap.detonationAge += dt;
        continue;
      }
      const defender = trap.ownerKind === "player" ? state.enemy : state.player;
      const armed = trap.age >= trap.armTime;
      const expired = trap.age >= trap.detonateTime || trap.age >= trap.life;
      if (!armed && !expired) continue;
      const triggerBox = getCelesteTrapBox(trap, armed ? trap.radius : trap.radius * 0.72);
      if (expired || (defender && !defender.dead && intersects(triggerBox, getHurtbox(defender)))) {
        detonateCelesteTrap(trap, defender);
      }
    }
    state.celesteTraps = state.celesteTraps.filter((trap) => !trap.hit && (!trap.detonating || trap.detonationAge < 0.18) && trap.age < trap.life + 0.24);
  }

  function getCelesteTrapBox(trap, radius = trap.radius) {
    return {
      x: trap.x - radius,
      y: trap.y - radius,
      w: radius * 2,
      h: radius * 2
    };
  }

  function detonateCelesteTrap(trap, defender) {
    trap.detonating = true;
    trap.detonationAge = 0;
    const box = getCelesteTrapBox(trap, 68);
    const owner = getFighterByKind(trap.ownerKind);
    const canHit = defender && !defender.dead && intersects(box, getHurtbox(defender));
    spawnBurst(trap.x, trap.y - 4, celesteSpiritColors.TI.main, 34, 0.24, "shock");
    if (!canHit || !owner) {
      trap.hit = true;
      return;
    }
    applyCelesteTrapHit(owner, defender, trap, box);
    trap.hit = true;
  }

  function applyCelesteTrapHit(owner, defender, trap, box) {
    const source = {
      damage: CELESTE_TI_DAMAGE,
      hitstun: CELESTE_TI_HITSTUN,
      blockstun: 11,
      knockbackX: 64,
      knockbackY: -180,
      boxType: "trap",
      flags: { projectileImpact: true, celesteTrap: true }
    };
    if (tryCelesteBarrierAbsorb(defender, owner, source, box)) return;
    const attackerIsInFront = (trap.x > defender.x) === (defender.facing === 1);
    const blocked = defender.blocking && defender.grounded && attackerIsInFront;
    const damageScale = blocked ? 1 : Math.min(getComboDamageScale(owner), 0.78);
    const hitstunScale = blocked ? 1 : Math.min(getComboHitstunScale(owner), 0.82);
    const damage = blocked ? 0 : Math.max(COMBO_MIN_DAMAGE, Math.ceil(source.damage * damageScale));
    defender.hp = Math.max(0, defender.hp - damage);
    defender.blockstun = blocked ? source.blockstun / 60 : 0;
    defender.hitstun = blocked ? 0 : (source.hitstun / 60) * hitstunScale;
    defender.action = null;
    defender.activeMove = null;
    defender.hasHit = false;
    defender.spawnedProjectile = false;
    defender.spawnedTrap = false;
    defender.cancelUnlocked = false;
    setNyxReactionAnim(defender, source, blocked);
    const dir = trap.facing || owner.facing;
    defender.vx = dir * (blocked ? 22 : Math.min(source.knockbackX * getComboKnockbackScale(owner), MAX_AIR_KNOCKBACK_X));
    defender.vy = Math.min(defender.vy, blocked ? 0 : source.knockbackY);
    applyFightingKnockbackVelocity(defender, blocked);
    if (!blocked) defender.grounded = false;
    enforceHitSeparation(owner, defender, source, blocked);
    if (!blocked) {
      defender.juggleGravityScale = !defender.grounded ? Math.max(defender.juggleGravityScale || 1, getAirJuggleGravityScale(getComboPriorHits(owner, defender) + 1)) : 1;
      defender.recoveryTimer = 0;
      defender.landingTimer = 0;
      registerComboHit(owner, defender, source);
    } else {
      resetCombo();
    }
    if (!blocked && shouldGainMeter(owner)) growFighterMeter(owner, Math.ceil(source.damage / 16));
    applyImpactFeedback(source, box.x + box.w * 0.5, box.y + box.h * 0.5, blocked);
    if (defender.hp <= 0) endMatch(defender);
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
    const eclipseSmoke = isEclipseRooftopStage();
    const count = eclipseSmoke ? 5 : 8;
    const alpha = eclipseSmoke ? 0.5 : 1;
    const life = eclipseSmoke ? 0.26 : 0.36;
    for (let i = 0; i < count; i += 1) {
      state.particles.push({
        kind: "smoke",
        x: x - state.player.facing * i * 18,
        y: y + 28 + Math.random() * 18,
        vx: -state.player.facing * (80 + Math.random() * 80),
        vy: -20 - Math.random() * 60,
        gravity: 160,
        life,
        maxLife: life,
        size: (14 + Math.random() * 20) * (eclipseSmoke ? 0.72 : 1),
        color: profile.trailColor,
        alpha,
        rot: 0,
        spin: 0
      });
    }
  }

  function spawnLandingDust(f) {
    const color = f.profile?.trailColor || "rgba(190, 150, 130, 0.85)";
    const eclipseSmoke = isEclipseRooftopStage();
    const count = eclipseSmoke ? 4 : 7;
    const alpha = eclipseSmoke ? 0.55 : 1;
    const life = eclipseSmoke ? 0.2 : 0.28;
    for (let i = 0; i < count; i += 1) {
      const side = i % 2 === 0 ? -1 : 1;
      state.particles.push({
        kind: "smoke",
        x: f.x + side * (16 + Math.random() * 22),
        y: getActiveStagePreset().groundY - 5 + Math.random() * 8,
        vx: side * (55 + Math.random() * 90),
        vy: -18 - Math.random() * 36,
        gravity: 110,
        life,
        maxLife: life,
        size: (10 + Math.random() * 14) * (eclipseSmoke ? 0.7 : 1),
        color,
        alpha,
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

  function spawnLamuhAfterimageTrail(f, count = 4, spacing = 22, color = "#f7f2df") {
    for (let i = 0; i < count; i += 1) {
      state.particles.push({
        x: f.x - f.facing * spacing * (i + 1),
        y: f.y - 86 + (Math.random() - 0.5) * 28,
        vx: -f.facing * (30 + i * 18),
        vy: -12 - Math.random() * 34,
        gravity: 40,
        life: 0.16 + i * 0.025,
        maxLife: 0.2 + i * 0.03,
        size: 16 + i * 4,
        color,
        kind: "smoke",
        rot: 0,
        spin: 0
      });
    }
  }

  function spawnLamuhGroundRipple(x, y, facing, color = "#ffe08a", count = 14) {
    spawnBurst(x, y, color, count + 8, 0.24, "shock");
    for (let i = 0; i < count; i += 1) {
      const spread = (i - count * 0.5) * 13;
      state.particles.push({
        x: x + facing * spread,
        y: y + Math.random() * 5,
        vx: facing * spread * 1.8,
        vy: -38 - Math.random() * 52,
        gravity: 210,
        life: 0.18 + Math.random() * 0.1,
        maxLife: 0.3,
        size: 9 + Math.random() * 8,
        color: i % 3 === 0 ? "#1b1510" : color,
        kind: i % 4 === 0 ? "smoke" : "spark",
        rot: -0.05 + Math.random() * 0.1,
        spin: (Math.random() - 0.5) * 3
      });
    }
  }

  function spawnLamuhVerticalCrown(x, y, facing, color = "#fff3ba", count = 16) {
    spawnBurst(x, y - 70, color, count + 6, 0.22, "burst");
    for (let i = 0; i < count; i += 1) {
      const side = (i % 2 === 0 ? 1 : -1) * (18 + Math.random() * 34);
      state.particles.push({
        x: x + side,
        y: y - 34 - Math.random() * 38,
        vx: side * 0.8 + facing * 28,
        vy: -190 - Math.random() * 170,
        gravity: 260,
        life: 0.2 + Math.random() * 0.12,
        maxLife: 0.32,
        size: 10 + Math.random() * 10,
        color: i % 4 === 0 ? "#35e8d5" : color,
        kind: "spark",
        rot: -Math.PI * 0.5,
        spin: (Math.random() - 0.5) * 4
      });
    }
  }

  function spawnLamuhImpactVfx(attacker, defender, source, box, blocked = false) {
    if (!attacker || !usesLamuhArt(attacker) || blocked) return;
    const profile = source.flags?.visualProfile;
    if (!profile) return;
    const x = box.x + box.w * 0.58;
    const y = box.y + box.h * 0.44;
    const facing = attacker.facing || 1;
    if (profile === "mirrorPulse") {
      spawnBurst(x, y, "#f7f2df", 18, 0.18, "burst");
      spawnBurst(x + facing * 16, y + 8, "#35e8d5", 10, 0.14, "spark");
    } else if (profile === "crownBeam") {
      spawnBurst(x, y, "#ffe08a", 30, 0.28, "shock");
      spawnBurst(x - facing * 26, y - 8, "#fff3ba", 18, 0.18, "spark");
    } else if (profile === "mirrorBreak") {
      spawnLamuhAfterimageTrail(attacker, 3, 16, "#f7f2df");
      spawnBurst(x, y, "#f7f2df", 20, 0.18, "spark");
    } else if (profile === "mirrorPierce") {
      spawnBurst(defender.x - facing * 28, defender.y - 88, "#ffe8a3", 32, 0.24, "spark");
      spawnBurst(defender.x + facing * 12, defender.y - 64, "#1b1510", 12, 0.16, "smoke");
    } else if (profile === "reboundStrike") {
      spawnBurst(x - facing * 18, y, "#f7f2df", 18, 0.18, "burst");
      spawnBurst(attacker.x - facing * 46, attacker.y - 92, "#1b1510", 10, 0.14, "smoke");
    } else if (profile === "groundBreaker") {
      spawnLamuhGroundRipple(defender.x, defender.y - 4, facing, "#ffe08a", 12);
    } else if (profile === "crownRupture") {
      spawnLamuhGroundRipple(defender.x, defender.y - 4, facing, "#ffe08a", 18);
      spawnLamuhVerticalCrown(defender.x, defender.y - 8, facing, "#fff3ba", 14);
    } else if (profile === "risingCrown") {
      spawnLamuhVerticalCrown(defender.x, defender.y - 18, facing, "#ffe08a", 12);
    } else if (profile === "ascendantBreak") {
      spawnLamuhVerticalCrown(defender.x, defender.y - 24, facing, "#fff3ba", 20);
      spawnBurst(defender.x, defender.y - 132, "#35e8d5", 12, 0.18, "spark");
    }
  }

  function spawnLamuhSpecialEffectForMove(f, key) {
    if (!usesLamuhArt(f) || !key) return;
    const moveKey = key.replace(/^enemy_/, "");
    const isSpecialKey = moveKey.includes("_special") || ["special_1", "special_2", "special_3"].includes(moveKey);
    if (!isSpecialKey) return;
    const burst = getLamuhSpecialBurst(moveKey);
    if (burst) {
      state.cameraShake = Math.max(state.cameraShake, burst.shake || 0);
      spawnBurst(f.x + f.facing * burst.x, f.y + burst.y, burst.color, burst.count, burst.life, burst.kind);
      if (burst.secondary) {
        spawnBurst(f.x + f.facing * burst.secondary.x, f.y + burst.secondary.y, burst.secondary.color, burst.secondary.count, burst.secondary.life, burst.secondary.kind);
      }
    }
    const profile = getLamuhMoveVisualProfile(moveKey);
    if (profile === "mirrorPierce") {
      spawnLamuhAfterimageTrail(f, 4, 22, "#f7f2df");
    } else if (profile === "reboundStrike") {
      spawnLamuhAfterimageTrail(f, 3, -18, "#f7f2df");
    } else if (profile === "groundBreaker") {
      spawnLamuhGroundRipple(f.x + f.facing * 58, f.y - 2, f.facing, "#ffe08a", 10);
    } else if (profile === "crownRupture") {
      spawnLamuhGroundRipple(f.x + f.facing * 74, f.y - 2, f.facing, "#ffe08a", 16);
    } else if (profile === "risingCrown") {
      spawnLamuhVerticalCrown(f.x + f.facing * 42, f.y - 8, f.facing, "#ffe08a", 12);
    } else if (profile === "ascendantBreak") {
      spawnLamuhVerticalCrown(f.x + f.facing * 54, f.y - 12, f.facing, "#fff3ba", 18);
    }
    if (moveKey === "back_special" || moveKey.startsWith("back_")) return;
    const effectBase = {
      ownerKind: f.kind,
      facing: f.facing,
      age: 0,
      cols: 8,
      rows: 4,
      alpha: 0.82
    };
    if (moveKey === "forward_special" || moveKey.startsWith("forward_")) {
      const anchor = LAMUH_SPECIAL_VFX_ANCHORS.ascendStep;
      if (!anchor.enabled) return;
      state.lamuhSpecialEffects.push({
        ...effectBase,
        atlasKey: anchor.atlasKey,
        move: anchor.move,
        row: anchor.row,
        layer: anchor.layer,
        life: anchor.life,
        x: f.x + f.facing * anchor.offsetX,
        y: f.y + anchor.offsetY,
        offsetX: anchor.offsetX,
        offsetY: anchor.offsetY,
        drawW: anchor.drawW,
        drawH: anchor.drawH,
        followOwner: anchor.followOwner,
        alpha: anchor.alpha
      });
    } else if (moveKey === "down_special" || moveKey.startsWith("down_") || moveKey.startsWith("up_")) {
      const anchor = LAMUH_SPECIAL_VFX_ANCHORS.heavenSplitter;
      if (!anchor.enabled) return;
      state.lamuhSpecialEffects.push({
        ...effectBase,
        atlasKey: anchor.atlasKey,
        move: anchor.move,
        row: anchor.row,
        layer: anchor.layer,
        life: anchor.life,
        x: f.x + f.facing * anchor.offsetX,
        y: f.y + anchor.offsetY,
        offsetX: anchor.offsetX,
        offsetY: anchor.offsetY,
        drawW: anchor.drawW,
        drawH: anchor.drawH,
        followOwner: anchor.followOwner,
        alpha: anchor.alpha
      });
    } else if (moveKey === "air_special" || moveKey.startsWith("air_")) {
      const anchor = LAMUH_SPECIAL_VFX_ANCHORS.radiantDive;
      if (!anchor.enabled) return;
      state.lamuhSpecialEffects.push({
        ...effectBase,
        atlasKey: anchor.atlasKey,
        move: anchor.move,
        row: anchor.row,
        layer: anchor.layer,
        life: anchor.life,
        x: f.x + f.facing * anchor.offsetX,
        y: f.y + anchor.offsetY,
        offsetX: anchor.offsetX,
        offsetY: anchor.offsetY,
        drawW: anchor.drawW,
        drawH: anchor.drawH,
        followOwner: anchor.followOwner,
        alpha: anchor.alpha
      });
    }
  }

  function getLamuhSpecialBurst(moveKey) {
    const white = "#f7f2df";
    const gold = "#ffe08a";
    const blackGold = "#1b1510";
    if (moveKey === "neutral_medium_special" || moveKey === "special_2") return { x: 58, y: -92, color: white, count: 20, life: 0.2, kind: "burst", shake: 4, secondary: { x: 92, y: -88, color: "#35e8d5", count: 8, life: 0.14, kind: "spark" } };
    if (moveKey === "neutral_heavy_special" || moveKey === "special_3") return { x: 104, y: -102, color: gold, count: 34, life: 0.28, kind: "shock", shake: 9, secondary: { x: 38, y: -106, color: blackGold, count: 12, life: 0.18, kind: "smoke" } };
    if (moveKey === "forward_medium_special") return { x: 72, y: -84, color: white, count: 18, life: 0.18, kind: "spark", shake: 5 };
    if (moveKey === "forward_heavy_special") return { x: 102, y: -96, color: gold, count: 26, life: 0.2, kind: "spark", shake: 8, secondary: { x: -18, y: -88, color: white, count: 12, life: 0.14, kind: "smoke" } };
    if (moveKey === "back_medium_special") return { x: -42, y: -92, color: white, count: 14, life: 0.16, kind: "smoke", shake: 4, secondary: { x: 48, y: -84, color: gold, count: 10, life: 0.12, kind: "spark" } };
    if (moveKey === "down_medium_special") return { x: 62, y: -24, color: gold, count: 18, life: 0.2, kind: "shock", shake: 5 };
    if (moveKey === "down_heavy_special") return { x: 78, y: -28, color: gold, count: 30, life: 0.26, kind: "shock", shake: 9, secondary: { x: 36, y: -86, color: blackGold, count: 10, life: 0.16, kind: "smoke" } };
    if (moveKey === "up_medium_special") return { x: 46, y: -72, color: gold, count: 18, life: 0.18, kind: "spark", shake: 5 };
    if (moveKey === "up_heavy_special") return { x: 54, y: -104, color: gold, count: 30, life: 0.26, kind: "burst", shake: 10, secondary: { x: 22, y: -132, color: "#35e8d5", count: 10, life: 0.16, kind: "spark" } };
    if (moveKey === "special_3") return { x: 84, y: -96, color: gold, count: 28, life: 0.24, kind: "shock", shake: 8, secondary: { x: 42, y: -100, color: blackGold, count: 8, life: 0.14, kind: "spark" } };
    if (moveKey === "special_2") return { x: 70, y: -88, color: gold, count: 18, life: 0.18, kind: "ring", shake: 4 };
    if (moveKey === "special_1") return { x: 54, y: -84, color: white, count: 11, life: 0.13, kind: "spark", shake: 2 };
    if (moveKey.includes("heavy")) return { x: 84, y: -96, color: gold, count: 28, life: 0.24, kind: "shock", shake: 8, secondary: { x: 42, y: -100, color: blackGold, count: 8, life: 0.14, kind: "spark" } };
    if (moveKey.includes("medium")) return { x: 70, y: -88, color: gold, count: 18, life: 0.18, kind: "ring", shake: 4 };
    if (moveKey.includes("light") || moveKey === "neutral_special" || moveKey === "forward_special" || moveKey === "down_special" || moveKey === "back_special" || moveKey === "air_special") return { x: 54, y: -84, color: white, count: 11, life: 0.13, kind: "spark", shake: 2 };
    return null;
  }

  function getLamuhMoveVisualProfile(moveKey) {
    if (moveKey === "neutral_medium_special" || moveKey === "special_2") return "mirrorPulse";
    if (moveKey === "neutral_heavy_special" || moveKey === "special_3") return "crownBeam";
    if (moveKey === "forward_medium_special") return "mirrorBreak";
    if (moveKey === "forward_heavy_special") return "mirrorPierce";
    if (moveKey === "back_medium_special") return "reboundStrike";
    if (moveKey === "down_medium_special") return "groundBreaker";
    if (moveKey === "down_heavy_special") return "crownRupture";
    if (moveKey === "up_medium_special") return "risingCrown";
    if (moveKey === "up_heavy_special") return "ascendantBreak";
    return null;
  }

  function updateLamuhSpecialEffects(dt) {
    for (const effect of state.lamuhSpecialEffects) {
      effect.age += dt;
      if (effect.followOwner) {
        const owner = effect.ownerKind === "enemy" ? state.enemy : state.player;
        if (owner?.profile?.id === "lamuh") {
          effect.x = owner.x + owner.facing * effect.offsetX;
          effect.y = owner.y + effect.offsetY;
          effect.facing = owner.facing;
        }
      }
    }
    state.lamuhSpecialEffects = state.lamuhSpecialEffects.filter((effect) => effect.age < effect.life);
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

  function isLamuhCrownStarter(f, moveData) {
    return usesLamuhArt(f) && moveData?.flags?.ultimate && f.activeMove?.replace(/^enemy_/, "") === "ultimate";
  }

  function getLamuhCrownFighter(kind) {
    return kind === "enemy" ? state.enemy : state.player;
  }

  function getLamuhCrownPhase() {
    const cinematic = state.lamuhCinematicUltimate;
    return cinematic ? LAMUH_CROWN_PHASES[cinematic.phaseIndex] : null;
  }

  function startLamuhCinematicUltimate(attacker, defender, hitbox) {
    const facing = attacker.facing || (attacker.x <= defender.x ? 1 : -1);
    const stage = getActiveStagePreset();
    const anchorX = facing === 1
      ? clamp(attacker.x - facing * 22, 140, stage.worldWidth - LAMUH_CROWN_BEAM_TARGET_X - 80)
      : clamp(attacker.x - facing * 22, LAMUH_CROWN_BEAM_TARGET_X + 80, stage.worldWidth - 140);
    const opponentStartX = clampToStageX(anchorX + facing * 178);
    const carryMidX = clampToStageX(anchorX + facing * (178 + LAMUH_CROWN_CARRY_DISTANCE * 0.52));
    const carryEndX = clampToStageX(anchorX + facing * (178 + LAMUH_CROWN_CARRY_DISTANCE));
    const launchX = clampToStageX(anchorX + facing * LAMUH_CROWN_LAUNCH_OFFSET_X);
    const beamTargetX = clampToStageX(anchorX + facing * LAMUH_CROWN_BEAM_TARGET_X);
    const beamTargetY = GROUND_Y + LAMUH_CROWN_BEAM_TARGET_Y;
    attacker.facing = facing;
    defender.facing = -facing;
    attacker.x = anchorX;
    attacker.y = GROUND_Y;
    attacker.grounded = true;
    attacker.vx = 0;
    attacker.vy = 0;
    attacker.action = "cinematic_ultimate";
    attacker.actionTime = 0;
    attacker.activeMove = attacker.kind === "enemy" ? "enemy_ultimate" : "ultimate";
    attacker.hasHit = true;
    attacker.spawnedProjectile = false;
    attacker.cancelUnlocked = false;
    attacker.bufferedMove = null;
    attacker.anim = withEnemyPrefix(attacker, LAMUH_CROWN_PHASES[0].anim);
    attacker.cinematicAnimDuration = LAMUH_CROWN_PHASES[0].duration;

    defender.x = opponentStartX;
    defender.y = GROUND_Y;
    defender.grounded = true;
    defender.vx = 0;
    defender.vy = 0;
    defender.action = "cinematic_victim";
    defender.actionTime = 0;
    defender.cinematicAnimDuration = LAMUH_CROWN_PHASES[0].duration;
    defender.activeMove = null;
    defender.hasHit = false;
    defender.spawnedProjectile = false;
    defender.cancelUnlocked = false;
    defender.hitstun = 999;
    defender.blockstun = 0;
    defender.knockdownTimer = 0;
    defender.recoveryTimer = 0;
    defender.landingTimer = 0;
    defender.pendingKnockdown = 0;
    const starterVictimAnim = getLamuhCrownVictimAnim(defender, "starter");
    defender.reactionAnim = starterVictimAnim;
    defender.anim = starterVictimAnim;

    clearInputKeys();
    state.hitPause = 0;
    state.cameraShake = Math.max(state.cameraShake, 14);
    spawnBurst(hitbox.x + hitbox.w * 0.66, hitbox.y + hitbox.h * 0.45, attacker.profile.ultimateBurstColor || "#67eaff", 32, 0.26, "shock");

    state.lamuhCinematicUltimate = {
      attackerKind: attacker.kind,
      defenderKind: defender.kind,
      facing,
      anchorX,
      lamuhStartX: anchorX,
      lamuhStartY: GROUND_Y,
      opponentStartX,
      opponentStartY: GROUND_Y,
      carryMidX,
      carryEndX,
      launchX,
      launchY: GROUND_Y + LAMUH_CROWN_LAUNCH_OFFSET_Y,
      beamTargetX,
      beamTargetY,
      beamOriginX: anchorX + facing * LAMUH_CROWN_BEAM_ORIGIN_X,
      beamOriginY: GROUND_Y + LAMUH_CROWN_BEAM_ORIGIN_Y,
      age: 0,
      phaseIndex: 0,
      phaseTime: 0,
      phaseFreeze: 0.09,
      beamSpawned: false,
      damageApplied: false,
      finalDamage: LAMUH_CROWN_FINAL_DAMAGE
    };
    state.lastLamuhCrownUltimateDebug = {
      status: "confirmed",
      attacker: attacker.kind,
      defender: defender.kind,
      facing,
      sheet: "lamuhCrownBody",
      phase: LAMUH_CROWN_PHASES[0].key,
      anchors: { anchorX, opponentStartX, carryMidX, carryEndX, launchX, beamTargetX, beamTargetY },
      beamSpawned: false,
      damageApplied: false
    };
  }

  function updateLamuhCinematicUltimate(dt) {
    const cinematic = state.lamuhCinematicUltimate;
    if (!cinematic) return;
    const attacker = getLamuhCrownFighter(cinematic.attackerKind);
    const defender = getLamuhCrownFighter(cinematic.defenderKind);
    if (!attacker || !defender || attacker.dead || state.matchEnded) {
      state.lamuhCinematicUltimate = null;
      return;
    }

    const phase = getLamuhCrownPhase();
    if (!phase) {
      finishLamuhCinematicUltimate(cinematic);
      return;
    }

    cinematic.age += dt;
    let phaseDt = dt;
    if (cinematic.phaseFreeze > 0) {
      const held = Math.min(cinematic.phaseFreeze, phaseDt);
      cinematic.phaseFreeze = Math.max(0, cinematic.phaseFreeze - held);
      phaseDt -= held;
    }
    cinematic.phaseTime += phaseDt;
    attacker.action = "cinematic_ultimate";
    attacker.activeMove = attacker.kind === "enemy" ? "enemy_ultimate" : "ultimate";
    attacker.actionTime = cinematic.phaseTime;
    attacker.cinematicAnimDuration = phase.duration;
    attacker.anim = withEnemyPrefix(attacker, phase.anim);
    lockLamuhCrownCombatants(cinematic, phase);

    if (phase.key === "fire" && !cinematic.beamSpawned && cinematic.phaseTime >= phase.beamAt) {
      cinematic.beamSpawned = true;
      spawnLamuhUltimateBeamVisual(attacker, { life: 1.06, scale: 0.7 });
      if (state.lastLamuhCrownUltimateDebug) state.lastLamuhCrownUltimateDebug.beamSpawned = true;
    }

    if (phase.key === "fire" && !cinematic.damageApplied && cinematic.phaseTime >= phase.damageAt) {
      applyLamuhCrownFinalDamage(cinematic);
      if (state.matchEnded) return;
    }

    if (cinematic.phaseTime >= phase.duration) {
      cinematic.phaseIndex += 1;
      cinematic.phaseTime = 0;
      const next = getLamuhCrownPhase();
      if (!next) {
        finishLamuhCinematicUltimate(cinematic);
      } else {
        cinematic.phaseFreeze = next.freeze || 0;
        state.cameraShake = Math.max(state.cameraShake, next.shake || 0);
        if (state.lastLamuhCrownUltimateDebug) state.lastLamuhCrownUltimateDebug.phase = next.key;
      }
    }
  }

  function lockLamuhCrownCombatants(cinematic, phase) {
    const attacker = getLamuhCrownFighter(cinematic.attackerKind);
    const defender = getLamuhCrownFighter(cinematic.defenderKind);
    if (!attacker || !defender) return;
    const facing = cinematic.facing;
    const t = clamp(cinematic.phaseTime / Math.max(phase.duration, 0.001), 0, 1);
    const eased = easeInOutCubic(t);
    const out = easeOutCubic(t);
    const bob = Math.sin(t * Math.PI);
    const layout = getLamuhCrownLayout(cinematic, phase.key, t, eased, out, bob);

    attacker.x = clampToStageX(layout.ax);
    attacker.y = GROUND_Y;
    attacker.grounded = true;
    attacker.vx = 0;
    attacker.vy = 0;
    attacker.facing = facing;

    defender.x = clampToStageX(layout.dx);
    defender.y = clamp(layout.dy, GROUND_Y - 230, GROUND_Y);
    defender.grounded = Boolean(layout.grounded);
    defender.vx = 0;
    defender.vy = 0;
    defender.facing = -facing;
    defender.hitstun = 999;
    defender.blockstun = 0;
    defender.action = "cinematic_victim";
    defender.actionTime = cinematic.phaseTime;
    defender.cinematicAnimDuration = phase.duration;
    defender.activeMove = null;
    const victimAnim = getLamuhCrownVictimAnim(defender, layout.victimBeat);
    defender.reactionAnim = victimAnim;
    defender.anim = victimAnim;
    if (state.lastLamuhCrownUltimateDebug) {
      state.lastLamuhCrownUltimateDebug.positions = {
        phase: phase.key,
        lamuhX: Math.round(attacker.x),
        opponentX: Math.round(defender.x),
        opponentY: Math.round(defender.y),
        travelFromStart: Math.round(Math.abs(defender.x - cinematic.opponentStartX)),
        victimBeat: layout.victimBeat,
        victimAnim
      };
    }
  }

  function getLamuhCrownVictimAnim(f, beat) {
    const animTable = f.kind === "enemy" ? f.profile.enemyAnimations : f.profile.playerAnimations;
    const candidateMap = {
      starter: ["heavy_hitstun", "medium_hitstun", "damaged", "knockback"],
      combo_medium: ["medium_hitstun", "damaged", "heavy_hitstun", "air_hitstun", "knockback"],
      combo_heavy: ["heavy_hitstun", "knockback", "air_hitstun", "medium_hitstun", "damaged"],
      airborne: ["air_hitstun", "launch_hitstun", "knockdown_fall", "knockback", "heavy_hitstun", "damaged"],
      launch: ["launch_hitstun", "knockdown_fall", "air_hitstun", "knockback", "heavy_hitstun", "damaged"],
      suspend: ["launch_hitstun", "heavy_hitstun", "knockdown_fall", "air_hitstun", "knockback", "damaged"],
      beam: ["knockback", "heavy_hitstun", "knockdown_fall", "launch_hitstun", "damaged"],
      recovery: ["knockdown_fall", "knockback", "heavy_hitstun", "downed", "grounded", "damaged"],
      knockdown: ["knockdown_fall", "downed", "grounded", "knockback", "damaged"]
    };
    const candidates = candidateMap[beat] || candidateMap.combo_heavy;
    for (const base of candidates) {
      const key = f.kind === "enemy" ? `enemy_${base}` : base;
      if (animTable?.[key]) return key;
    }
    const fallback = f.kind === "enemy"
      ? ["enemy_knockback", "enemy_damaged", "enemy_death", "enemy_idle"]
      : ["knockback", "damaged", "death", "idle"];
    return fallback.find((key) => animTable?.[key]) || (f.kind === "enemy" ? "enemy_idle" : "idle");
  }

  function getLamuhCrownLayout(cinematic, phaseKey, t, eased, out, bob) {
    const facing = cinematic.facing;
    const start = cinematic.opponentStartX;
    const mid = cinematic.carryMidX;
    const end = cinematic.carryEndX;
    const launch = cinematic.launchX;
    const target = cinematic.beamTargetX;
    const ground = GROUND_Y;
    switch (phaseKey) {
      case "combo_a":
        return {
          ax: mix(cinematic.lamuhStartX, cinematic.lamuhStartX + facing * 92, eased),
          dx: mix(start, mid, eased),
          dy: ground - bob * 18,
          victimBeat: t < 0.55 ? "combo_medium" : "combo_heavy",
          grounded: t < 0.68
        };
      case "combo_b":
        return {
          ax: mix(cinematic.lamuhStartX + facing * 92, cinematic.lamuhStartX + facing * 196, eased),
          dx: mix(mid, end, eased),
          dy: ground - 22 - bob * 38,
          victimBeat: t < 0.5 ? "combo_heavy" : "airborne",
          grounded: false
        };
      case "launch":
        return {
          ax: mix(cinematic.lamuhStartX + facing * 196, cinematic.lamuhStartX + facing * 248, out),
          dx: mix(end, launch, out),
          dy: mix(ground - 42, cinematic.launchY, out),
          victimBeat: "launch",
          grounded: false
        };
      case "charge":
        return {
          ax: mix(cinematic.lamuhStartX + facing * 140, cinematic.lamuhStartX, out),
          dx: mix(launch, target, out),
          dy: mix(cinematic.launchY, cinematic.beamTargetY, out) + Math.sin(t * Math.PI * 2) * 6,
          victimBeat: "suspend",
          grounded: false
        };
      case "fire":
        return {
          ax: cinematic.lamuhStartX,
          dx: target + facing * (22 * t),
          dy: cinematic.beamTargetY + Math.sin(t * Math.PI) * 10,
          victimBeat: "beam",
          grounded: false
        };
      case "recovery":
        return {
          ax: cinematic.lamuhStartX,
          dx: target + facing * mix(34, 164, out),
          dy: mix(cinematic.beamTargetY, ground - 64, out),
          victimBeat: "recovery",
          grounded: false
        };
      default:
        return { ax: cinematic.lamuhStartX, dx: start, dy: ground, victimBeat: "combo_medium", grounded: true };
    }
  }

  function applyLamuhCrownFinalDamage(cinematic) {
    const attacker = getLamuhCrownFighter(cinematic.attackerKind);
    const defender = getLamuhCrownFighter(cinematic.defenderKind);
    if (!attacker || !defender || defender.dead) return;
    cinematic.damageApplied = true;
    const damage = Math.min(defender.hp, cinematic.finalDamage);
    defender.hp = Math.max(0, defender.hp - damage);
    defender.grounded = false;
    defender.hitstun = 0.42;
    defender.blockstun = 0;
    defender.vx = cinematic.facing * 560;
    defender.vy = -210;
    defender.x = clampToStageX(cinematic.beamTargetX + cinematic.facing * 28);
    defender.y = cinematic.beamTargetY;
    defender.pendingKnockdown = Math.max(defender.pendingKnockdown, HARD_KNOCKDOWN);
    defender.recoveryTimer = 0;
    defender.landingTimer = 0;
    const beamVictimAnim = getLamuhCrownVictimAnim(defender, "beam");
    defender.reactionAnim = beamVictimAnim;
    defender.anim = beamVictimAnim;
    const source = { damage, boxType: "ultimate", flags: { ultimate: true, hardKnockdown: true }, hitstun: defender.hitstun, blockstun: 0, knockbackX: 560, knockbackY: -210 };
    registerComboHit(attacker, defender, source);
    applyImpactFeedback(source, defender.x - cinematic.facing * 18, defender.y, false);
    state.hitPause = 0;
    state.cameraShake = Math.max(state.cameraShake, 22);
    spawnBurst(defender.x - cinematic.facing * 22, defender.y, attacker.profile.ultimateBurstColor || "#67eaff", 58, 0.36, "shock");
    if (state.lastLamuhCrownUltimateDebug) {
      state.lastLamuhCrownUltimateDebug.damageApplied = true;
      state.lastLamuhCrownUltimateDebug.finalDamage = damage;
    }
    if (defender.hp <= 0) endMatch(defender);
  }

  function finishLamuhCinematicUltimate(cinematic) {
    const attacker = getLamuhCrownFighter(cinematic.attackerKind);
    const defender = getLamuhCrownFighter(cinematic.defenderKind);
    if (attacker && !attacker.dead) {
      clearAction(attacker);
      attacker.actionTime = 0;
      attacker.vx = 0;
      attacker.vy = 0;
      attacker.anim = withEnemyPrefix(attacker, "idle");
    }
    if (defender && !defender.dead && !state.matchEnded) {
      defender.hitstun = Math.min(defender.hitstun, 0.28);
      defender.blockstun = 0;
      defender.grounded = false;
      defender.vx = cinematic.facing * 520;
      defender.vy = Math.min(defender.vy, -180);
      defender.x = clampToStageX(cinematic.beamTargetX + cinematic.facing * 150);
      defender.y = Math.min(defender.y, cinematic.beamTargetY + 72);
      defender.pendingKnockdown = Math.max(defender.pendingKnockdown, HARD_KNOCKDOWN);
      defender.action = null;
      defender.actionTime = 0;
      defender.reactionAnim = getLamuhCrownVictimAnim(defender, "knockdown");
      defender.anim = defender.reactionAnim;
      defender.cinematicAnimDuration = null;
    }
    state.lamuhCinematicUltimate = null;
    state.hitPause = 0;
    if (state.lastLamuhCrownUltimateDebug) state.lastLamuhCrownUltimateDebug.status = "finished";
  }

  function spawnLamuhUltimateBeamVisual(f, options = {}) {
    state.lamuhUltimateBeams.push({
      ownerKind: f.kind,
      x: options.x ?? (f.x + f.facing * LAMUH_CROWN_BEAM_ORIGIN_X),
      y: options.y ?? (f.y + LAMUH_CROWN_BEAM_ORIGIN_Y),
      facing: f.facing,
      age: 0,
      life: options.life || 0.78,
      scale: options.scale || 0.64,
      frameCols: 8,
      frameRows: 4,
      originX: 210,
      originY: 256
    });
  }

  function updateLamuhUltimateBeams(dt) {
    for (const beam of state.lamuhUltimateBeams) {
      beam.age += dt;
      const owner = beam.ownerKind === "enemy" ? state.enemy : state.player;
      if (owner?.profile?.id === "lamuh" && owner.activeMove?.replace(/^enemy_/, "") === "ultimate") {
        beam.x = owner.x + owner.facing * LAMUH_CROWN_BEAM_ORIGIN_X;
        beam.y = owner.y + LAMUH_CROWN_BEAM_ORIGIN_Y;
        beam.facing = owner.facing;
      }
    }
    state.lamuhUltimateBeams = state.lamuhUltimateBeams.filter((beam) => beam.age < beam.life);
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
      ctx.save();
      applyStageCamera();
      drawArena();
      drawNyxSignatureBackdrop();
      drawNyxSignatureEffects();
      drawLamuhSpecialEffects("behind");
      drawCelesteOctavaVfx("behind");
      drawFighter(state.enemy);
      drawFighter(state.player);
      drawLamuhSpecialEffects("front");
      drawLamuhUltimateBeams();
      drawCelesteOctavaVfx("front");
      drawProjectiles();
      drawCelesteTraps();
      drawParticles();
      if (state.debug) {
        drawDebug();
        drawCelesteFrameDebugOverlay();
      }
      ctx.restore();
      drawEclipseRooftopForeground();
      drawStatusText();
    }

    ctx.restore();
  }

  function getStageCameraTarget() {
    const stage = getActiveStagePreset();
    if (!isFightMode() || !stage.experimental || !state.player || !state.enemy) {
      return { scale: 1, x: 0, y: 0 };
    }
    const minFighterX = Math.min(state.player.x, state.enemy.x);
    const maxFighterX = Math.max(state.player.x, state.enemy.x);
    const focusX = (minFighterX + maxFighterX) * 0.5;
    const desiredWidth = Math.max(maxFighterX - minFighterX + stage.camera.paddingX, W / stage.camera.maxScale);
    const scale = clamp(W / desiredWidth, stage.camera.minScale, stage.camera.maxScale);
    const scaledWorldWidth = stage.worldWidth * scale;
    const minTranslateX = Math.min(0, W - scaledWorldWidth);
    const x = clamp(W * 0.5 - focusX * scale, minTranslateX, 0);
    const y = GROUND_Y - stage.groundY * scale;
    return { scale, x, y };
  }

  function updateStageCamera(dt, immediate = false) {
    const stage = getActiveStagePreset();
    const target = getStageCameraTarget();
    if (!isFightMode() || !stage.experimental) {
      state.stageCamera = { ...target, initialized: false };
      return;
    }
    if (immediate || !state.stageCamera.initialized) {
      state.stageCamera = { ...target, initialized: true };
      return;
    }
    const damping = getPlatformSpeedTuning()?.cameraSmoothing ?? stage.camera.damping ?? 7.5;
    const t = 1 - Math.exp(-damping * Math.max(0, dt));
    state.stageCamera.x = mix(state.stageCamera.x, target.x, t);
    state.stageCamera.y = mix(state.stageCamera.y, target.y, t);
    state.stageCamera.scale = mix(state.stageCamera.scale, target.scale, t);
    state.stageCamera.initialized = true;
  }

  function getStageCamera() {
    const stage = getActiveStagePreset();
    if (!isFightMode() || !stage.experimental) return { scale: 1, x: 0, y: 0 };
    return state.stageCamera.initialized ? state.stageCamera : getStageCameraTarget();
  }

  function applyStageCamera() {
    const camera = getStageCamera();
    ctx.translate(camera.x, camera.y);
    ctx.scale(camera.scale, camera.scale);
  }

  function drawBackground() {
    const activeStage = getActiveStagePreset();
    const stageBackgroundKey = activeStage.background?.imageKey;
    const bg = state.mode === "title" || state.mode === "select"
      ? state.images.mainMenuBackground || state.images.title
      : (stageBackgroundKey ? state.images[stageBackgroundKey] : null) || state.images.stage;
    if (isFightMode() && activeStage.id === ECLIPSE_ROOFTOP_STAGE_ID) {
      drawEclipseRooftopBackground(activeStage);
      return;
    }
    if (!bg) {
      ctx.fillStyle = "#12070b";
      ctx.fillRect(0, 0, W, H);
      return;
    }
    if (isFightMode() && activeStage.experimental) {
      const background = activeStage.background || {};
      ctx.save();
      ctx.filter = background.filter || "saturate(0.58) brightness(0.62) contrast(0.9) blur(0.6px)";
      drawCover(bg, 0, 0, W, H);
      ctx.restore();
      drawPlatformArenaBackgroundTreatment();
      return;
    }
    drawCover(bg, 0, 0, W, H);
  }

  function drawEclipseRooftopBackground(stage) {
    const render = stage.render || {};
    const far = state.images[render.farBackgroundKey];
    const mid = state.images[render.midgroundKey];
    if (far) drawCover(far, 0, 0, W, H);
    else {
      ctx.fillStyle = "#07040c";
      ctx.fillRect(0, 0, W, H);
    }
    if (mid) {
      const camera = getStageCamera();
      const parallax = clamp(camera.x * (render.parallaxX ?? 0.08), -52, 52);
      ctx.save();
      ctx.globalAlpha = 0.76;
      drawCover(mid, -54 + parallax, 0, W + 108, H);
      ctx.restore();
    }
    drawPlatformArenaBackgroundTreatment();
  }

  function drawPlatformArenaBackgroundTreatment() {
    const background = getActiveStagePreset().background || getPlatformArenaConfig()?.background || {};
    ctx.save();
    ctx.fillStyle = `rgba(0, 0, 0, ${background.overlayAlpha ?? 0.18})`;
    ctx.fillRect(0, 0, W, H);
    const vignette = ctx.createRadialGradient(W * 0.5, H * 0.48, W * 0.24, W * 0.5, H * 0.52, W * 0.68);
    vignette.addColorStop(0, "rgba(0, 0, 0, 0)");
    vignette.addColorStop(0.72, `rgba(0, 0, 0, ${background.vignetteMidAlpha ?? 0.12})`);
    vignette.addColorStop(1, `rgba(0, 0, 0, ${background.vignetteEdgeAlpha ?? 0.36})`);
    ctx.fillStyle = vignette;
    ctx.fillRect(0, 0, W, H);
    ctx.restore();
  }

  function drawArena() {
    const stage = getActiveStagePreset();
    if (stage.id === ECLIPSE_ROOFTOP_STAGE_ID) {
      drawEclipseRooftopArena(stage);
      return;
    }
    const grd = ctx.createLinearGradient(0, 430, 0, H);
    grd.addColorStop(0, "rgba(0, 0, 0, 0)");
    grd.addColorStop(1, "rgba(0, 0, 0, 0.35)");
    ctx.fillStyle = grd;
    ctx.fillRect(0, 430, stage.worldWidth, H - 430);
    if (stage.experimental) {
      ctx.fillStyle = "rgba(13, 10, 18, 0.66)";
      ctx.fillRect(0, stage.groundY + 4, stage.worldWidth, 34);
      ctx.strokeStyle = stage.background?.platformTop || "rgba(127, 224, 162, 0.42)";
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(0, stage.groundY + 2);
      ctx.lineTo(stage.worldWidth, stage.groundY + 2);
      ctx.stroke();
      for (const platform of stage.platforms) {
        const platformGradient = ctx.createLinearGradient(platform.x, platform.y, platform.x, platform.y + platform.h);
        platformGradient.addColorStop(0, stage.background?.platformStroke || "rgba(245, 232, 200, 0.72)");
        platformGradient.addColorStop(0.5, stage.background?.platformFillB || "rgba(95, 38, 54, 0.76)");
        platformGradient.addColorStop(1, "rgba(12, 7, 14, 0.9)");
        ctx.fillStyle = platformGradient;
        ctx.fillRect(platform.x, platform.y, platform.w, platform.h);
        ctx.strokeStyle = stage.background?.platformStroke || "rgba(255, 248, 217, 0.62)";
        ctx.lineWidth = 2;
        ctx.strokeRect(platform.x, platform.y, platform.w, platform.h);
      }
      return;
    }
    ctx.strokeStyle = "rgba(255, 120, 80, 0.25)";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(0, GROUND_Y + 2);
    ctx.lineTo(stage.worldWidth, GROUND_Y + 2);
    ctx.stroke();
  }

  function drawStageLayerImage(key, rect, alpha = 1) {
    const img = state.images[key];
    if (!img || !rect) return;
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.imageSmoothingEnabled = true;
    ctx.drawImage(img, rect.x, rect.y, rect.w, rect.h);
    ctx.restore();
  }

  function drawEclipseCollisionTop(x, y, w) {
    ctx.save();
    ctx.strokeStyle = "rgba(241, 210, 138, 0.22)";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(x, y + 1);
    ctx.lineTo(x + w, y + 1);
    ctx.stroke();
    ctx.restore();
  }

  function drawEclipseRooftopArena(stage) {
    const render = stage.render || {};
    drawStageLayerImage(render.mainPlatformKey, render.mainPlatform);
    drawStageLayerImage(render.sidePlatformLeftKey, render.leftPlatform);
    drawStageLayerImage(render.sidePlatformRightKey, render.rightPlatform);
    drawEclipseCollisionTop(stage.leftBound, stage.groundY, stage.rightBound - stage.leftBound);
    for (const platform of stage.platforms) {
      drawEclipseCollisionTop(platform.x, platform.y, platform.w);
    }
  }

  function drawEclipseRooftopForeground() {
    const stage = getActiveStagePreset();
    if (!isFightMode() || stage.id !== ECLIPSE_ROOFTOP_STAGE_ID) return;
    const render = stage.render || {};
    if (render.foreground?.activeGameplay === false) return;
    const img = state.images[render.foregroundKey];
    if (!img) return;
    const clips = render.foreground?.clips || [];
    ctx.save();
    ctx.globalAlpha = render.foreground?.alpha ?? 0.72;
    ctx.beginPath();
    if (clips.length) {
      for (const clip of clips) ctx.rect(clip.x, clip.y, clip.w, clip.h);
      ctx.clip();
    }
    drawCover(img, 0, 0, W, H);
    ctx.restore();
  }

  function getLamuhMirrorPierceFrameOverride(f, moveData, frameCount, fallbackFrame) {
    if (!usesLamuhArt(f) || !f.action || !moveData || moveData.flags.visualProfile !== "mirrorPierce") return fallbackFrame;
    if ((f.activeMove || "").replace(/^enemy_/, "") !== "forward_heavy_special") return fallbackFrame;
    if (frameCount < 6) return fallbackFrame;
    const sideSwitch = Number.isFinite(moveData.flags.sideSwitchFrame)
      ? moveData.flags.sideSwitchFrame / 60
      : moveData.startup + moveData.active * (moveData.flags.pierceSwitchAt || 0.56);
    const beamFire = f.lamuhPierceWhiffed && Number.isFinite(moveData.flags.whiffBeamFireFrame)
      ? moveData.flags.whiffBeamFireFrame / 60
      : Number.isFinite(moveData.flags.beamFireFrame)
      ? moveData.flags.beamFireFrame / 60
      : (moveData.flags.projectileSpawnAt || 0.95);
    const beamEnd = f.lamuhPierceWhiffed && Number.isFinite(moveData.flags.whiffRecoveryEndFrame)
      ? moveData.flags.whiffRecoveryEndFrame / 60
      : Number.isFinite(moveData.flags.beamHitboxEndFrame)
      ? moveData.flags.beamHitboxEndFrame / 60
      : beamFire + 0.24;
    if (f.actionTime >= sideSwitch && f.actionTime < beamFire) return Math.min(frameCount - 1, 4);
    if (f.actionTime >= beamFire && f.actionTime < beamFire + 0.1) return Math.min(frameCount - 1, 5);
    if (f.actionTime >= beamFire && f.actionTime < beamEnd) return Math.min(frameCount - 1, 6);
    if (f.actionTime >= beamEnd) return Math.min(frameCount - 1, 7);
    return Math.min(fallbackFrame, Math.min(frameCount - 1, 3));
  }

  function getLamuhNeutralSpecialFrameOverride(f, moveData, frameCount, fallbackFrame) {
    if (!usesLamuhArt(f) || !f.action || !moveData || frameCount < 4) return fallbackFrame;
    const moveKey = (f.activeMove || "").replace(/^enemy_/, "");
    const startup = Math.max(moveData.startup || 0.01, 0.01);
    const active = Math.max(moveData.active || 0.01, 0.01);
    const activeEnd = startup + active;
    const recovery = Math.max(moveData.recovery || Math.max(moveData.duration - activeEnd, 0.01), 0.01);
    const t = f.actionTime;
    const last = frameCount - 1;

    if (["special_1", "neutral_special", "neutral_light_special"].includes(moveKey)) {
      if (t < startup) return 0;
      if (t <= activeEnd) {
        const p = clamp((t - startup) / active, 0, 1);
        return Math.min(last, p < 0.52 ? 2 : 3);
      }
      const p = clamp((t - activeEnd) / recovery, 0, 1);
      return Math.min(last, p < 0.46 ? 5 : p < 0.82 ? 6 : 7);
    }

    if (["special_2", "neutral_medium_special"].includes(moveKey)) {
      if (t < startup) {
        const p = clamp(t / startup, 0, 1);
        return Math.min(last, p < 0.58 ? 0 : 1);
      }
      if (t <= activeEnd) {
        const p = clamp((t - startup) / active, 0, 1);
        return Math.min(last, p < 0.42 ? 2 : p < 0.78 ? 3 : 4);
      }
      const p = clamp((t - activeEnd) / recovery, 0, 1);
      return Math.min(last, p < 0.42 ? 5 : p < 0.76 ? 6 : 7);
    }

    if (["special_3", "neutral_heavy_special"].includes(moveKey)) {
      if (t < startup) {
        const p = clamp(t / startup, 0, 1);
        return Math.min(last, p < 0.36 ? 0 : p < 0.74 ? 1 : 2);
      }
      if (t <= activeEnd) {
        const p = clamp((t - startup) / active, 0, 1);
        return Math.min(last, p < 0.36 ? 3 : p < 0.72 ? 4 : 5);
      }
      const p = clamp((t - activeEnd) / recovery, 0, 1);
      return Math.min(last, p < 0.26 ? 5 : p < 0.68 ? 6 : 7);
    }

    return fallbackFrame;
  }

  function getLamuhReactionDefenseFrameOverride(f, animKey, sheetKey, row, frameCount, fallbackFrame) {
    if (!usesLamuhArt(f) || sheetKey !== "lamuhReactionsDefenseRedesign" || row !== 5 || frameCount < 8) return fallbackFrame;
    const key = (animKey || "").replace(/^enemy_/, "");
    if (["get_up", "lamuh_getup", "recovery", "recovery_get_up", "stand_up"].includes(key)) {
      return Math.min(3, fallbackFrame % 4);
    }
    if (["block", "guard_idle", "stand_block", "lamuh_block_high"].includes(key)) {
      return 4 + (Math.floor(state.time * 8) % 2);
    }
    if (["crouch_block", "lamuh_block_low"].includes(key)) {
      return 6 + (Math.floor(state.time * 8) % 2);
    }
    return fallbackFrame;
  }

  function getLamuhAirCrouchJumpFrameOverride(f, animKey, sheetKey, row, frameCount, fallbackFrame) {
    if (!usesLamuhArt(f) || sheetKey !== "lamuhAirCrouchJumpRedesign" || frameCount < 8) return fallbackFrame;
    const key = (animKey || "").replace(/^enemy_/, "");

    if (row === 0) {
      if (["jump_up", "lamuh_jump", "rising", "jump_forward", "jump_back"].includes(key)) {
        return fallbackFrame % 3;
      }
      if (["fall", "lamuh_fall", "neutral_air_drift"].includes(key)) {
        return 3 + (fallbackFrame % 3);
      }
      if (["land", "landing", "lamuh_land"].includes(key)) {
        return 6 + (fallbackFrame % 2);
      }
    }

    if (row === 4) {
      if (["jump_light", "air_light", "air_tap", "lamuh_air_light"].includes(key)) {
        return fallbackFrame % 3;
      }
      if (["jump_medium", "air_medium", "sky_knuckle", "lamuh_air_medium"].includes(key)) {
        return 3 + (fallbackFrame % 3);
      }
      if (["jump_heavy", "air_heavy", "crown_drop", "lamuh_air_heavy"].includes(key)) {
        return 6 + (fallbackFrame % 2);
      }
    }

    if (row === 5) {
      if (["air_special", "air_light_special", "air_mirror_spark", "lamuh_air_mirror_spark"].includes(key)) {
        return fallbackFrame % 3;
      }
      if (["radiant_dive", "air_medium_special", "air_dash_strike", "lamuh_air_dash_strike"].includes(key)) {
        return 3 + (fallbackFrame % 3);
      }
      if (["air_heavy_special", "air_crown_drop", "lamuh_air_crown_drop"].includes(key)) {
        return 6 + (fallbackFrame % 2);
      }
    }

    return fallbackFrame;
  }

  function getLamuhSecondaryMovementFrameOverride(f, animKey, sheetKey, row, frameCount, fallbackFrame) {
    if (!usesLamuhArt(f) || sheetKey !== "lamuhSecondaryMovementDirectionalNormalsRedesign" || frameCount < 8) return fallbackFrame;
    const key = (animKey || "").replace(/^enemy_/, "");

    if (row === 3) {
      if (["forward_light"].includes(key)) return fallbackFrame % 3;
      if (["forward_medium"].includes(key)) return 3 + (fallbackFrame % 3);
      if (["forward_heavy", "launcher"].includes(key)) return 6 + (fallbackFrame % 2);
    }

    if (row === 4) {
      if (["back_light"].includes(key)) return fallbackFrame % 3;
      if (["back_medium"].includes(key)) return 3 + (fallbackFrame % 3);
      if (["back_heavy"].includes(key)) return 6 + (fallbackFrame % 2);
    }

    if (row === 5) {
      if (["air_dash_forward"].includes(key)) return fallbackFrame % 3;
      if (["air_dash_back"].includes(key)) return 3 + (fallbackFrame % 3);
      if (["air_recovery", "fall_transition"].includes(key)) return 6 + (fallbackFrame % 2);
    }

    return fallbackFrame;
  }

  function getLamuhNeutralSpecialBodyCrop(f, animKey, sheetKey) {
    if (!usesLamuhArt(f) || sheetKey !== "lamuhBackNeutralSpecialsRedesign") return null;
    const key = String(animKey || "").replace(/^enemy_/, "");
    return LAMUH_NEUTRAL_SPECIAL_BODY_CROPS[key] || null;
  }

  function drawFighter(f) {
    if (!f) return;
    if (usesCelestePlaceholder(f) && f.profile?.placeholderArt === "procedural_celeste_phase_1") {
      drawCelestePlaceholderFighter(f);
      return;
    }
    const animTable = f.kind === "player" ? f.profile.playerAnimations : f.profile.enemyAnimations;
    let animKey = f.dead ? (f.kind === "player" ? "death" : "enemy_death") : f.anim;
    if (usesCelestePlaceholder(f) && (f.activeMove || "").replace(/^enemy_/, "") === "ultimate") {
      const phaseName = getCelesteOctavaPhase(f)?.name || "startup";
      animKey = phaseName === "startup"
        ? (f.kind === "player" ? "octava_startup" : "enemy_octava_startup")
        : (f.kind === "player" ? "octava_fire" : "enemy_octava_fire");
    }
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
    const moveData = getMove(f);
    const isCeleste = usesCelestePlaceholder(f);
    const celesteMeta = isCeleste ? getCelesteAnimationMeta(f, animKey) : null;
    const animDuration = f.cinematicAnimDuration || moveData?.duration || celesteMeta?.frameTiming || 0.5;
    const idleFps = celesteMeta?.frameTiming ? frameCount / Math.max(celesteMeta.frameTiming, 0.1) : 8;
    let frame = f.action ? Math.min(frameCount - 1, Math.floor((f.actionTime / Math.max(animDuration, 0.1)) * frameCount)) : Math.floor(state.time * idleFps) % frameCount;
    frame = getLamuhMirrorPierceFrameOverride(f, moveData, frameCount, frame);
    frame = getLamuhNeutralSpecialFrameOverride(f, moveData, frameCount, frame);
    frame = getLamuhReactionDefenseFrameOverride(f, animKey, entry[0], row, frameCount, frame);
    frame = getLamuhAirCrouchJumpFrameOverride(f, animKey, entry[0], row, frameCount, frame);
    frame = getLamuhSecondaryMovementFrameOverride(f, animKey, entry[0], row, frameCount, frame);
    const fw = image.width / meta.cols;
    const rh = image.height / meta.rows;
    const analyzedRow = state.frameBoxes[entry[0]]?.[row];
    const frameInfo = analyzedRow?.frames[frame];
    const renderScale = meta.scale * (celesteMeta?.scale || 1);
    const renderOffsetX = celesteMeta?.drawOffsetX || 0;
    const renderOffsetY = celesteMeta?.drawOffsetY || 0;
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
      dx = -(analyzedRow?.anchorX ?? (Number.isFinite(meta.anchorX) ? meta.anchorX : fw / 2)) * renderScale + renderOffsetX;
      dy = f.y - (analyzedRow?.anchorY ?? getSheetBaselineY(meta, rh)) * renderScale + (meta.groundOffset || 0) + renderOffsetY;
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
      dx = -(analyzedRow.anchorX - x0) * renderScale + renderOffsetX;
      dy = f.y - (analyzedRow.anchorY - y0) * renderScale + (meta.groundOffset || 0) + renderOffsetY;
    } else {
      const cropX = meta.cropX || 0;
      const cropTop = meta.cropTop || 0;
      const cropBottom = meta.cropBottom || 0;
      sx = frame * fw + cropX;
      sy = row * rh + cropTop;
      sw = Math.max(1, fw - cropX * 2);
      sh = Math.max(1, rh - cropTop - cropBottom);
      dx = -(sw * renderScale) / 2 + renderOffsetX;
      dy = f.y - sh * renderScale + (meta.groundOffset || 0) + renderOffsetY;
    }

    const lamuhNeutralBodyCrop = getLamuhNeutralSpecialBodyCrop(f, animKey, entry[0]);
    if (lamuhNeutralBodyCrop && meta.fixedSourceCells) {
      const cropLeft = Math.max(0, lamuhNeutralBodyCrop.left || 0);
      const cropRight = Math.max(0, lamuhNeutralBodyCrop.right || 0);
      sx += cropLeft;
      sw = Math.max(1, sw - cropLeft - cropRight);
      dx += cropLeft * renderScale;
    }

    const dw = sw * renderScale;
    const dh = sh * renderScale;
    const celesteRender = isCeleste ? getCelesteRenderContext(f, { animKey, row, frame, sheet: entry[0] }) : null;
    if (celesteRender) {
      celesteRender.sourceRect = { sx, sy, sw, sh };
      celesteRender.drawRect = {
        x: f.facing === 1 ? f.x + dx : f.x - dx - dw,
        y: dy,
        w: dw,
        h: dh
      };
      celesteRender.hitbox = f.activeMove && isMoveActive(f) ? getHitbox(f, moveData) : null;
      f.celesteRenderContext = celesteRender;
      drawCelesteFighterVfxLayer(f, "back", celesteRender);
    }

    drawLamuhAscendedAura(f, animKey, { dx, dy, dw, dh }, "behind");

    ctx.save();
    ctx.translate(f.x, 0);
    ctx.scale(f.facing, 1);
    ctx.globalAlpha = f.hitstun > 0 && !f.dead ? 0.72 + Math.sin(state.time * 55) * 0.18 : 1;
    ctx.drawImage(image, sx, sy, sw, sh, dx, dy, dw, dh);
    ctx.restore();

    drawLamuhAscendedAura(f, animKey, { dx, dy, dw, dh }, "front");
    drawSerisChainWhipOverlay(f);
    if (celesteRender) drawCelesteFighterVfxLayer(f, "front", celesteRender);
  }

  function isLamuhAscendedAuraAnim(animKey = "") {
    const key = animKey.replace(/^enemy_/, "");
    return key === "crown_charge" || key === "crown_fire" || key === "crown_recovery";
  }

  function getLamuhAscendedAuraStrength(animKey = "") {
    const key = animKey.replace(/^enemy_/, "");
    if (key === "crown_fire") return 1;
    if (key === "crown_charge") return 0.78;
    if (key === "crown_recovery") return 0.45;
    return 0;
  }

  function drawLamuhAscendedAura(f, animKey, rect, layer) {
    if (!usesLamuhArt(f) || !isLamuhAscendedAuraAnim(animKey) || !rect) return;
    const strength = getLamuhAscendedAuraStrength(animKey);
    if (strength <= 0) return;
    const cx = rect.dx + rect.dw * 0.5;
    const cy = rect.dy + rect.dh * 0.52;
    const pulse = 0.86 + Math.sin(state.time * 12) * 0.08;
    ctx.save();
    ctx.translate(f.x, 0);
    ctx.scale(f.facing, 1);
    if (layer === "behind") {
      ctx.globalCompositeOperation = "lighter";
      ctx.globalAlpha = 0.2 * strength;
      ctx.strokeStyle = "#fff3ba";
      ctx.lineWidth = 5;
      ctx.beginPath();
      ctx.ellipse(cx, cy, rect.dw * 0.34 * pulse, rect.dh * 0.5 * pulse, 0, 0, Math.PI * 2);
      ctx.stroke();
      ctx.globalAlpha = 0.12 * strength;
      ctx.strokeStyle = "#35e8d5";
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.ellipse(cx + 6, cy - rect.dh * 0.02, rect.dw * 0.25, rect.dh * 0.42, 0.16, 0, Math.PI * 2);
      ctx.stroke();
      ctx.globalCompositeOperation = "source-over";
      ctx.globalAlpha = 0.11 * strength;
      ctx.fillStyle = "#17110d";
      ctx.beginPath();
      ctx.ellipse(cx - 4, rect.dy + rect.dh * 0.86, rect.dw * 0.31, rect.dh * 0.12, 0, 0, Math.PI * 2);
      ctx.fill();
    } else {
      ctx.globalCompositeOperation = "lighter";
      ctx.globalAlpha = 0.34 * strength;
      ctx.strokeStyle = "#ffe08a";
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.arc(cx + rect.dw * 0.18, cy - rect.dh * 0.24, 16 + 8 * strength, -0.7, 1.3);
      ctx.stroke();
      ctx.globalAlpha = 0.24 * strength;
      ctx.strokeStyle = "#f7f2df";
      ctx.beginPath();
      ctx.moveTo(cx - rect.dw * 0.19, cy - rect.dh * 0.38);
      ctx.lineTo(cx - rect.dw * 0.04, cy - rect.dh * 0.48);
      ctx.moveTo(cx + rect.dw * 0.13, cy + rect.dh * 0.28);
      ctx.lineTo(cx + rect.dw * 0.24, cy + rect.dh * 0.13);
      ctx.stroke();
    }
    ctx.restore();
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

  function drawCelesteVfxFrame(row, frame, x, y, facing = 1, options = {}) {
    const atlas = state.images.celesteFinalVfx;
    if (!atlas) return false;
    const cols = 7;
    const rows = 10;
    const frameW = atlas.width / cols;
    const frameH = atlas.height / rows;
    const count = CELESTE_VFX_FRAME_COUNTS[row] || cols;
    const safeFrame = Math.min(count - 1, Math.max(0, frame));
    const scale = options.scale ?? 1;
    const alpha = options.alpha ?? 1;
    ctx.save();
    ctx.globalCompositeOperation = options.composite || "lighter";
    ctx.globalAlpha = alpha;
    ctx.translate(x, y);
    if (options.rotation) ctx.rotate(options.rotation * facing);
    ctx.scale(facing * scale, scale);
    ctx.drawImage(
      atlas,
      safeFrame * frameW,
      row * frameH,
      frameW,
      frameH,
      -(options.originX ?? frameW / 2),
      -(options.originY ?? frameH / 2),
      frameW,
      frameH
    );
    ctx.restore();
    return true;
  }

  function drawCelesteVfxAtSocket(f, socketName, row, frame, options = {}, renderContext = null) {
    const socket = renderContext?.sockets?.[socketName] || resolveCelesteSocket(f, socketName);
    return drawCelesteVfxFrame(
      row,
      frame,
      socket.x + f.facing * (options.offsetX || 0),
      socket.y + (options.offsetY || 0),
      f.facing,
      options
    );
  }

  function getCelesteMoveVfxKey(f) {
    const raw = (f.activeMove || "").replace(/^enemy_/, "");
    const aliases = {
      light_attack: "neutral_light",
      medium_attack: "neutral_medium",
      heavy_attack: "neutral_heavy",
      air_light: "jump_light",
      air_medium: "jump_medium",
      air_heavy: "jump_heavy"
    };
    return aliases[raw] || raw;
  }

  function drawCelesteFighterVfxLayer(f, layer = "front", renderContext = null) {
    if (!usesCelestePlaceholder(f) || f.dead) return;
    const move = (f.activeMove || "").replace(/^enemy_/, "");
    const moveData = getMove(f);
    const duration = Math.max(moveData?.duration || 0.25, 0.1);
    const t = clamp(f.actionTime / duration, 0, 0.999);
    if (move === "special_1" || f.celesteFaWindow > 0 || f.anim?.includes("fa_strobe") || f.dashTimer > 0 || f.airDashTimer > 0) {
      if (layer !== "back") return;
      const frame = Math.min(4, Math.floor(t * 5));
      const root = renderContext?.sockets?.root || resolveCelesteSocket(f, "root");
      renderContext?.vfxFrames?.push({ layer, atlas: "celesteFinalVfx", spirit: "FA", row: 3, frame, socket: "root" });
      drawCelesteVfxFrame(3, frame, root.x - f.facing * 72, root.y - 98, f.facing, { scale: 0.52, alpha: 0.36 });
      renderContext?.vfxFrames?.push({ layer, atlas: "celesteFinalVfx", spirit: "FA", row: 3, frame: (frame + 1) % 5, socket: "root" });
      drawCelesteVfxFrame(3, (frame + 1) % 5, root.x - f.facing * 34, root.y - 100, f.facing, { scale: 0.58, alpha: 0.5 });
      return;
    }
    if (layer === "back") return;
    const vfxKey = getCelesteMoveVfxKey(f);
    const cfg = CELESTE_MOVE_VFX[vfxKey];
    if (cfg && cfg.layer === layer) {
      const count = CELESTE_VFX_FRAME_COUNTS[cfg.row] || 5;
      const frame = Math.min(count - 1, Math.floor(t * count));
      const pulse = Math.sin(t * Math.PI);
      renderContext?.vfxFrames?.push({ layer, atlas: "celesteFinalVfx", spirit: cfg.spirit, row: cfg.row, frame, socket: cfg.socket });
      drawCelesteVfxAtSocket(f, cfg.socket, cfg.row, frame, {
        scale: cfg.scale,
        alpha: (cfg.alpha || 0.7) * Math.max(0.22, pulse),
        rotation: cfg.rotation || 0,
        offsetX: cfg.offsetX || 0,
        offsetY: cfg.offsetY || 0
      }, renderContext);
    }
    if (f.celesteBarrierTimer > 0 || move === "back_special" || f.anim?.includes("la_seraph_waltz")) {
      const lifeT = f.celesteBarrierTimer > 0 ? clamp(1 - f.celesteBarrierTimer / CELESTE_LA_ACTIVE, 0, 0.999) : t;
      const frame = Math.min(5, Math.floor(lifeT * 6));
      renderContext?.vfxFrames?.push({ layer, atlas: "celesteFinalVfx", spirit: "LA", row: 5, frame, socket: "barrierCenter" });
      drawCelesteVfxAtSocket(f, "barrierCenter", 5, frame, {
        scale: 0.78,
        alpha: 0.82,
        composite: "lighter"
      }, renderContext);
    }
  }

  function drawCelesteFighterVfxOverlay(f) {
    drawCelesteFighterVfxLayer(f, "front", f.celesteRenderContext);
  }

  function drawCelestePlaceholderFighter(f) {
    const crouch = f.crouching || f.anim?.includes("crouch");
    const dead = f.dead || f.anim?.includes("death") || f.anim?.includes("ko") || f.anim?.includes("defeat");
    const blocking = f.blocking || f.blockstun > 0 || f.celesteBarrierTimer > 0 || f.anim?.includes("block");
    const moveData = getMove(f);
    const spirit = getCelesteSpiritForMove(f);
    const reach = moveData ? Math.min(118, getHitboxDefinition(f, moveData.boxType).w * 0.58) : 0;
    const bob = Math.sin(state.time * 7) * (f.action ? 0.5 : 3);

    ctx.save();
    ctx.translate(f.x, f.y + (dead ? 8 : bob));
    ctx.scale(f.facing, 1);
    ctx.globalAlpha = f.hitstun > 0 && !dead ? 0.76 + Math.sin(state.time * 52) * 0.16 : 1;

    if (f.activeMove === "special_1" || f.celesteFaWindow > 0 || f.anim?.includes("fa_strobe") || f.dashTimer > 0 || f.airDashTimer > 0) {
      drawCelesteAfterimage(-36, -96, 0.24, celesteSpiritColors.FA.main, celesteSpiritColors.FA.secondary);
      drawCelesteAfterimage(-66, -98, 0.13, celesteSpiritColors.FA.secondary, celesteSpiritColors.FA.main);
    }

    ctx.fillStyle = "rgba(16, 12, 22, 0.42)";
    ctx.beginPath();
    ctx.ellipse(0, dead ? -6 : -4, dead ? 58 : crouch ? 44 : 34, 10, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.save();
    if (dead) {
      ctx.rotate(-Math.PI * 0.5);
      ctx.translate(-26, -8);
    }

    ctx.strokeStyle = "#0d0714";
    ctx.lineWidth = 8;
    ctx.lineCap = "round";
    ctx.beginPath();
    ctx.moveTo(-12, crouch ? -74 : -128);
    ctx.lineTo(-26, crouch ? -42 : -36);
    ctx.moveTo(12, crouch ? -74 : -128);
    ctx.lineTo(26, crouch ? -42 : -36);
    ctx.stroke();

    const coatGradient = ctx.createLinearGradient(0, crouch ? -122 : -172, 0, -28);
    coatGradient.addColorStop(0, "#2b163c");
    coatGradient.addColorStop(0.48, "#151126");
    coatGradient.addColorStop(1, "#09070f");
    ctx.fillStyle = coatGradient;
    ctx.strokeStyle = "#d8c7ff";
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(-30, crouch ? -118 : -168);
    ctx.quadraticCurveTo(-56, crouch ? -88 : -104, -48, -28);
    ctx.lineTo(44, -28);
    ctx.quadraticCurveTo(54, crouch ? -88 : -104, 26, crouch ? -118 : -168);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = "#f4ddbd";
    ctx.beginPath();
    ctx.arc(0, crouch ? -140 : -188, 17, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = "#21102f";
    ctx.lineWidth = 7;
    ctx.beginPath();
    ctx.moveTo(-8, crouch ? -154 : -204);
    ctx.quadraticCurveTo(-38, crouch ? -150 : -194, -40, crouch ? -94 : -122);
    ctx.moveTo(6, crouch ? -155 : -205);
    ctx.quadraticCurveTo(34, crouch ? -150 : -194, 30, crouch ? -96 : -126);
    ctx.stroke();

    ctx.strokeStyle = "#fff0bf";
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(-14, crouch ? -98 : -132);
    ctx.lineTo(28 + reach, crouch ? -82 : -116);
    ctx.stroke();
    ctx.strokeStyle = "#f8f8ff";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(22 + reach, crouch ? -84 : -118);
    ctx.lineTo(74 + reach, crouch ? -72 : -108);
    ctx.stroke();

    if (blocking) drawCelesteBarrier();
    if (spirit) drawCelesteSpiritEffect(f, spirit, reach);

    ctx.restore();
    ctx.restore();
  }

  function drawCelesteAfterimage(x, y, alpha, main, secondary) {
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.strokeStyle = main;
    ctx.fillStyle = secondary;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.ellipse(x, y - 56, 18, 58, 0, 0, Math.PI * 2);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(x, y - 116, 14, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  function getCelesteSpiritForMove(f) {
    const raw = (f.activeMove || "").replace(/^enemy_/, "");
    const move = {
      light_attack: "neutral_light",
      medium_attack: "neutral_medium",
      heavy_attack: "neutral_heavy"
    }[raw] || raw;
    if (["neutral_light", "forward_light", "up_light", "down_light", "jump_light"].includes(move)) return "DO";
    if (["neutral_medium", "forward_medium", "back_medium", "up_medium", "down_medium", "jump_medium"].includes(move)) return "RE";
    if (["neutral_heavy", "forward_heavy", "back_heavy", "up_heavy", "down_heavy", "jump_heavy"].includes(move)) return "MI";
    if (["back_light", "special_1", "super_dash", "fa_strobe"].includes(move)) return "FA";
    if (["special_2", "sol_ovation"].includes(move)) return "SOL";
    if (["back_special", "la_seraph_waltz"].includes(move)) return "LA";
    if (["special_3", "ti_encore"].includes(move)) return "TI";
    if (["ultimate", "octava"].includes(move)) return "OCTAVA";
    return null;
  }

  function spawnCelesteSpiritBurstForMove(f) {
    if (!usesCelestePlaceholder(f)) return;
    const spirit = getCelesteSpiritForMove(f);
    if (!spirit) return;
    const colors = spirit === "OCTAVA" ? celesteSpiritColors.MI : celesteSpiritColors[spirit];
    const size = spirit === "OCTAVA" ? 38 : spirit === "MI" ? 26 : spirit === "TI" ? 22 : 18;
    const socketName = spirit === "DO"
      ? "frontPalm"
      : spirit === "RE"
      ? "batonTip"
      : spirit === "MI"
      ? "frontPalm"
      : spirit === "SOL"
      ? "projectileOrigin"
      : spirit === "LA"
      ? "barrierCenter"
      : spirit === "TI"
      ? "trapPlacementOrigin"
      : spirit === "OCTAVA"
      ? "beamOrigin"
      : "batonTip";
    const socket = resolveCelesteSocket(f, socketName);
    spawnBurst(socket.x, socket.y, colors.main, size);
  }

  function drawCelesteSpiritEffect(f, spirit, reach) {
    const colors = spirit === "OCTAVA" ? celesteSpiritColors.MI : celesteSpiritColors[spirit];
    const t = getMove(f) ? clamp(f.actionTime / Math.max(getMove(f).duration, 0.1), 0, 1) : 0;
    const pulse = Math.sin(clamp(t, 0, 1) * Math.PI);
    ctx.save();
    ctx.globalCompositeOperation = "lighter";
    ctx.globalAlpha = 0.34 + pulse * 0.42;
    ctx.shadowColor = colors.main;
    ctx.shadowBlur = 18;
    ctx.strokeStyle = colors.main;
    ctx.fillStyle = colors.secondary;
    ctx.lineWidth = 4;

    if (spirit === "DO") {
      const x = 70 + reach;
      const y = f.activeMove?.includes("up_") ? -168 : f.activeMove?.includes("jump") ? -98 : -112;
      ctx.beginPath();
      ctx.arc(x, y, 20 + pulse * 9, 0, Math.PI * 2);
      ctx.stroke();
      ctx.globalAlpha *= 0.66;
      ctx.fillRect(x - 9, y - 24, 18, 36);
      ctx.fillRect(x - 22, y - 6, 44, 14);
    } else if (spirit === "RE") {
      const y = f.activeMove?.includes("up_") ? -156 : f.activeMove?.includes("jump") ? -102 : -112;
      ctx.beginPath();
      ctx.moveTo(38, y + 26);
      ctx.quadraticCurveTo(118 + reach, y - 42, 170 + reach, y - 4);
      ctx.stroke();
      ctx.strokeStyle = colors.secondary;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(34, y + 10);
      ctx.lineTo(156 + reach, y - 28);
      ctx.stroke();
    } else if (spirit === "MI") {
      const x = 86 + reach;
      const y = f.activeMove?.includes("up_") ? -160 : f.activeMove?.includes("jump") ? -72 : -106;
      ctx.beginPath();
      ctx.ellipse(x, y, 42 + pulse * 26, 22 + pulse * 12, 0.1, 0, Math.PI * 2);
      ctx.stroke();
      ctx.strokeStyle = colors.secondary;
      ctx.lineWidth = 2;
      for (let i = -2; i <= 2; i += 1) {
        ctx.beginPath();
        ctx.moveTo(x - 28 + i * 10, y - 30);
        ctx.lineTo(x + i * 12, y + 28);
        ctx.stroke();
      }
    } else if (spirit === "FA") {
      drawCelesteAfterimage(76 + reach * 0.25, -104, 0.54, colors.main, colors.secondary);
    } else if (spirit === "SOL") {
      ctx.beginPath();
      ctx.arc(68, -118, 20 + pulse * 5, 0, Math.PI * 2);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(86, -118);
      ctx.lineTo(180, -118);
      ctx.lineTo(154, -102);
      ctx.moveTo(180, -118);
      ctx.lineTo(154, -134);
      ctx.stroke();
    } else if (spirit === "LA") {
      ctx.beginPath();
      ctx.ellipse(34, -120, 34 + pulse * 8, 58 + pulse * 12, -0.28, -1.2, 1.2);
      ctx.stroke();
      ctx.beginPath();
      ctx.ellipse(72, -112, 26 + pulse * 7, 48 + pulse * 10, 0.24, -1.1, 1.25);
      ctx.stroke();
      ctx.strokeStyle = colors.secondary;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(18, -152);
      ctx.quadraticCurveTo(70, -136, 86, -78);
      ctx.stroke();
    } else if (spirit === "TI") {
      const x = 84;
      const y = -138;
      ctx.strokeRect(x - 26, y - 14, 52, 28);
      for (let i = -2; i <= 2; i += 1) {
        ctx.beginPath();
        ctx.moveTo(x + i * 10, y - 14);
        ctx.lineTo(x + i * 10, y + 14);
        ctx.stroke();
      }
      ctx.beginPath();
      ctx.arc(x + 48, y - 34, 10 + pulse * 8, 0, Math.PI * 2);
      ctx.stroke();
    } else if (spirit === "OCTAVA") {
      for (let i = 0; i < 7; i += 1) {
        const a = (i / 7) * Math.PI * 2 + state.time * 1.4;
        const x = Math.cos(a) * 70;
        const y = -126 + Math.sin(a) * 54;
        const c = Object.values(celesteSpiritColors)[i];
        ctx.strokeStyle = c.main;
        ctx.beginPath();
        ctx.arc(x, y, 8 + pulse * 8, 0, Math.PI * 2);
        ctx.stroke();
      }
    }
    ctx.restore();
  }

  function drawCelesteBarrier() {
    const colors = celesteSpiritColors.LA;
    ctx.save();
    ctx.globalCompositeOperation = "lighter";
    ctx.globalAlpha = 0.72;
    ctx.strokeStyle = colors.main;
    ctx.shadowColor = colors.secondary;
    ctx.shadowBlur = 18;
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.ellipse(18, -112, 58, 88, 0.14, -1.2, 1.35);
    ctx.stroke();
    ctx.strokeStyle = colors.secondary;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(10, -158);
    ctx.quadraticCurveTo(62, -140, 54, -82);
    ctx.moveTo(2, -146);
    ctx.quadraticCurveTo(48, -130, 42, -72);
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

  function drawLamuhUltimateBeams() {
    const atlas = state.images.lamuhCrownBeamVfx;
    if (!atlas || !state.lamuhUltimateBeams.length) return;
    const frameW = atlas.width / 8;
    const frameH = atlas.height / 4;
    for (const beam of state.lamuhUltimateBeams) {
      const t = clamp(beam.age / beam.life, 0, 1);
      let row = 2;
      let localT = 0;
      if (t < 0.18) {
        row = 0;
        localT = t / 0.18;
      } else if (t < 0.38) {
        row = 1;
        localT = (t - 0.18) / 0.2;
      } else if (t < 0.78) {
        row = 2;
        localT = (t - 0.38) / 0.4;
      } else {
        row = 3;
        localT = (t - 0.78) / 0.22;
      }
      const frame = Math.min(7, Math.floor(clamp(localT, 0, 0.999) * 8));
      const fadeIn = clamp(t / 0.06, 0, 1);
      const fadeOut = clamp((1 - t) / 0.12, 0, 1);

      ctx.save();
      ctx.globalCompositeOperation = "lighter";
      ctx.globalAlpha = Math.min(fadeIn, fadeOut) * 0.98;
      ctx.translate(beam.x, beam.y);
      ctx.scale(beam.facing * beam.scale, beam.scale);
      ctx.drawImage(
        atlas,
        frame * frameW,
        row * frameH,
        frameW,
        frameH,
        -beam.originX,
        -beam.originY,
        frameW,
        frameH
      );
      ctx.restore();
    }
  }

  function getCelesteOctavaPhase(f) {
    if (!usesCelestePlaceholder(f) || (f.activeMove || "").replace(/^enemy_/, "") !== "ultimate") return null;
    const moveData = getMove(f);
    if (!moveData) return null;
    const activeStart = moveData.startup;
    const activeEnd = moveData.startup + moveData.active;
    if (f.actionTime < activeStart) return { name: "startup", t: clamp(f.actionTime / Math.max(activeStart, 0.01), 0, 1), moveData };
    if (f.actionTime <= activeEnd) return { name: "beam", t: clamp((f.actionTime - activeStart) / Math.max(moveData.active, 0.01), 0, 1), moveData };
    return { name: "recovery", t: clamp((f.actionTime - activeEnd) / Math.max(moveData.recovery, 0.01), 0, 1), moveData };
  }

  function drawCelesteOctavaVfx(layer = "front") {
    drawCelesteOctavaForFighter(state.enemy, layer);
    drawCelesteOctavaForFighter(state.player, layer);
  }

  function drawCelesteOctavaForFighter(f, layer = "front") {
    const phase = getCelesteOctavaPhase(f);
    if (!phase) return;
    const spiritEntries = Object.entries(celesteSpiritColors);
    const startupPull = phase.name === "startup" ? easeInOutCubic(phase.t) : 1;
    const recoveryFade = phase.name === "recovery" ? 1 - phase.t : 1;
    const beamFade = phase.name === "beam" ? Math.min(clamp(phase.t / 0.16, 0, 1), clamp((1 - phase.t) / 0.18, 0, 1)) : 0;
    const octava = resolveCelesteSocket(f, "octavaOrigin");
    const beam = resolveCelesteSocket(f, "beamOrigin");

    if (layer === "front") {
      if (phase.name === "beam") {
        drawCelesteOctavaBeam(beam.x, beam.y, f.facing, beamFade);
      } else if (phase.name === "recovery") {
        drawCelesteOctavaAfterglow(beam.x, beam.y, f.facing, recoveryFade);
      }
      return;
    }

    ctx.save();
    ctx.globalCompositeOperation = "lighter";
    ctx.globalAlpha = 0.72 * recoveryFade;

    for (let i = 0; i < spiritEntries.length; i += 1) {
      const [spirit, colors] = spiritEntries[i];
      const angle = state.time * 4.6 + (i / spiritEntries.length) * Math.PI * 2;
      const orbitRadiusX = mix(88, 18, startupPull);
      const orbitRadiusY = mix(64, 14, startupPull);
      const x = octava.x + Math.cos(angle) * orbitRadiusX;
      const y = octava.y + Math.sin(angle) * orbitRadiusY;
      const size = mix(9, 5, startupPull) + Math.sin(state.time * 8 + i) * 1.5;
      if (state.images.celesteFinalVfx) {
        drawCelesteVfxFrame(8, i, x, y, 1, { scale: 0.22 + (1 - startupPull) * 0.08, alpha: 0.84 * recoveryFade });
        continue;
      }
      ctx.shadowColor = colors.main;
      ctx.shadowBlur = 18;
      ctx.fillStyle = colors.main;
      ctx.strokeStyle = colors.secondary;
      ctx.lineWidth = 2;
      ctx.beginPath();
      if (spirit === "DO") {
        ctx.arc(x, y, size + 2, 0, Math.PI * 2);
      } else if (spirit === "RE") {
        ctx.moveTo(x - size, y + size);
        ctx.lineTo(x + size * 1.5, y - size);
        ctx.lineTo(x + size * 0.2, y + size * 0.2);
      } else if (spirit === "MI") {
        ctx.ellipse(x, y, size * 1.8, size, 0.2, 0, Math.PI * 2);
      } else if (spirit === "FA") {
        ctx.ellipse(x, y, size * 0.8, size * 2.1, 0, 0, Math.PI * 2);
      } else if (spirit === "SOL") {
        ctx.moveTo(x - size, y);
        ctx.lineTo(x + size * 1.8, y - size * 0.8);
        ctx.lineTo(x + size * 1.8, y + size * 0.8);
      } else if (spirit === "LA") {
        ctx.ellipse(x, y, size, size * 1.9, -0.35, 0, Math.PI * 2);
      } else {
        ctx.arc(x, y, size, 0, Math.PI * 2);
        ctx.moveTo(x + size * 0.7, y);
        ctx.lineTo(x + size * 0.7, y - size * 2.5);
      }
      ctx.fill();
      ctx.stroke();
    }

    const mergePulse = phase.name === "startup" ? startupPull : phase.name === "beam" ? 1 : 1 - phase.t * 0.7;
    ctx.shadowColor = "#ffffff";
    ctx.shadowBlur = 30;
    ctx.fillStyle = "rgba(255, 255, 255, 0.72)";
    ctx.strokeStyle = celesteSpiritColors.MI.main;
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.arc(octava.x, octava.y, 18 + mergePulse * 30, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    ctx.restore();
  }

  function drawCelesteOctavaBeam(originX, originY, facing, alpha) {
    if (state.images.celesteFinalVfx) {
      const frame = Math.min(5, Math.max(0, Math.floor(state.time * 18) % 6));
      drawCelesteVfxFrame(9, frame, originX + facing * 246, originY - 4, facing, { scale: 1.34, alpha: alpha * 0.94 });
      return;
    }
    const length = 690;
    const height = 150;
    const beamColors = [
      celesteSpiritColors.DO.main,
      celesteSpiritColors.RE.main,
      celesteSpiritColors.MI.main,
      celesteSpiritColors.FA.main,
      celesteSpiritColors.SOL.main,
      celesteSpiritColors.LA.secondary,
      celesteSpiritColors.TI.secondary
    ];
    ctx.save();
    ctx.globalAlpha = alpha * 0.9;
    ctx.translate(originX, originY);
    ctx.scale(facing, 1);
    ctx.shadowColor = "#fff8ff";
    ctx.shadowBlur = 28;

    const core = ctx.createLinearGradient(0, 0, length, 0);
    core.addColorStop(0, "rgba(255,255,255,0.96)");
    core.addColorStop(0.5, "rgba(185,248,255,0.76)");
    core.addColorStop(1, "rgba(255,255,255,0)");
    ctx.fillStyle = core;
    ctx.beginPath();
    ctx.moveTo(0, -height * 0.38);
    ctx.quadraticCurveTo(length * 0.55, -height * 0.62, length, -height * 0.28);
    ctx.lineTo(length, height * 0.28);
    ctx.quadraticCurveTo(length * 0.55, height * 0.62, 0, height * 0.38);
    ctx.closePath();
    ctx.fill();

    ctx.globalAlpha = alpha * 0.58;
    ctx.lineWidth = 9;
    for (let i = 0; i < beamColors.length; i += 1) {
      const y = -height * 0.42 + (i / (beamColors.length - 1)) * height * 0.84;
      ctx.strokeStyle = beamColors[i];
      ctx.beginPath();
      ctx.moveTo(8, y);
      ctx.bezierCurveTo(length * 0.32, y + Math.sin(state.time * 10 + i) * 14, length * 0.66, y - Math.cos(state.time * 8 + i) * 10, length, y * 0.62);
      ctx.stroke();
    }

    ctx.globalAlpha = alpha * 0.74;
    ctx.strokeStyle = "#ffffff";
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(0, -height * 0.08);
    ctx.lineTo(length * 0.92, 0);
    ctx.moveTo(0, height * 0.08);
    ctx.lineTo(length * 0.82, 0);
    ctx.stroke();
    ctx.restore();
  }

  function drawCelesteOctavaAfterglow(originX, originY, facing, alpha) {
    if (state.images.celesteFinalVfx) {
      drawCelesteVfxFrame(9, 5, originX + facing * 232, originY - 4, facing, { scale: 1.12, alpha: alpha * 0.3 });
      return;
    }
    ctx.save();
    ctx.globalAlpha = alpha * 0.28;
    ctx.translate(originX, originY);
    ctx.scale(facing, 1);
    ctx.globalCompositeOperation = "lighter";
    ctx.strokeStyle = "#bff8ff";
    ctx.shadowColor = "#ffffff";
    ctx.shadowBlur = 18;
    ctx.lineWidth = 5;
    ctx.beginPath();
    ctx.moveTo(0, -32);
    ctx.quadraticCurveTo(220, -72, 420, -12);
    ctx.moveTo(0, 32);
    ctx.quadraticCurveTo(210, 70, 390, 10);
    ctx.stroke();
    ctx.restore();
  }

  function drawLamuhSpecialEffects(layer = "front") {
    if (!state.lamuhSpecialEffects.length) return;
    for (const effect of state.lamuhSpecialEffects) {
      if ((effect.layer || "front") !== layer) continue;
      const atlas = state.images[effect.atlasKey];
      if (!atlas) continue;
      const frameW = atlas.width / effect.cols;
      const frameH = atlas.height / effect.rows;
      const t = clamp(effect.age / Math.max(effect.life, 0.1), 0, 1);
      const frame = Math.min(effect.cols - 1, Math.floor(clamp(t, 0, 0.999) * effect.cols));
      const fadeIn = clamp(t / 0.12, 0, 1);
      const fadeOut = clamp((1 - t) / 0.18, 0, 1);

      ctx.save();
      ctx.globalCompositeOperation = "lighter";
      ctx.globalAlpha = (effect.alpha || 0.8) * Math.min(fadeIn, fadeOut);
      ctx.translate(effect.x || 0, effect.y || 0);
      ctx.scale(effect.facing || 1, 1);
      ctx.drawImage(
        atlas,
        frame * frameW,
        effect.row * frameH,
        frameW,
        frameH,
        -effect.drawW * 0.5,
        -effect.drawH * 0.5,
        effect.drawW,
        effect.drawH
      );
      ctx.restore();
    }
  }

  function drawProjectiles() {
    for (const projectile of state.projectiles) {
      if (projectile.ownerCharacterId === "seris" && !SERIS_CHAIN_VFX_RUNTIME_ENABLED) continue;
      if (drawSerisProjectileVfx(projectile)) continue;
      if (drawLamuhProjectileVfx(projectile)) continue;
      if (drawCelesteProjectileVfx(projectile)) continue;

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

  function drawCelesteTraps() {
    for (const trap of state.celesteTraps) {
      const armed = trap.age >= trap.armTime;
      const armingT = clamp(trap.age / Math.max(trap.armTime, 0.1), 0, 1);
      const detonateT = trap.detonating ? clamp(trap.detonationAge / 0.18, 0, 1) : 0;
      if (state.images.celesteFinalVfx) {
        const row = trap.detonating ? 7 : 6;
        const count = CELESTE_VFX_FRAME_COUNTS[row];
        const rawT = trap.detonating ? detonateT : armed ? 0.78 + Math.sin(state.time * 7) * 0.08 : armingT * 0.75;
        const frame = Math.min(count - 1, Math.max(0, Math.floor(clamp(rawT, 0, 0.999) * count)));
        const alpha = trap.detonating ? Math.max(0.22, 1 - detonateT) : armed ? 0.9 : 0.56 + armingT * 0.24;
        drawCelesteVfxFrame(row, frame, trap.x, trap.y - 10, 1, { scale: trap.detonating ? 0.62 : 0.46, alpha });
        continue;
      }
      const pulse = Math.sin(state.time * (armed ? 12 : 7)) * 0.5 + 0.5;
      const colors = celesteSpiritColors.TI;
      ctx.save();
      ctx.translate(trap.x, trap.y);
      ctx.globalCompositeOperation = "lighter";
      ctx.globalAlpha = trap.detonating ? 0.8 * (1 - detonateT) : armed ? 0.86 : 0.44 + armingT * 0.28;
      ctx.shadowColor = colors.secondary;
      ctx.shadowBlur = armed ? 22 : 12;
      ctx.strokeStyle = armed ? colors.main : "rgba(255, 255, 255, 0.58)";
      ctx.fillStyle = armed ? colors.secondary : "rgba(155, 92, 255, 0.42)";
      ctx.lineWidth = armed ? 4 : 2;
      const radius = trap.detonating ? 44 + detonateT * 64 : 18 + armingT * 26 + pulse * (armed ? 5 : 2);
      ctx.beginPath();
      ctx.arc(0, 0, radius, 0, Math.PI * 2);
      ctx.stroke();
      ctx.beginPath();
      ctx.ellipse(-7, 8, 12, 9, -0.28, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.moveTo(4, 6);
      ctx.lineTo(4, -42);
      ctx.quadraticCurveTo(26, -44, 28, -24);
      ctx.stroke();
      ctx.strokeStyle = "#0d0b14";
      ctx.globalAlpha *= armed ? 0.7 : 0.46;
      for (let i = -2; i <= 2; i += 1) {
        ctx.beginPath();
        ctx.moveTo(i * 11, 30);
        ctx.lineTo(i * 11, 42);
        ctx.stroke();
      }
      ctx.restore();
    }
  }

  function drawLamuhProjectileVfx(projectile) {
    if (projectile.ownerCharacterId !== "lamuh") return false;
    if (projectile.flags?.mirrorPierceBeam) return drawLamuhMirrorPierceBeam(projectile);
    if (projectile.flags?.visualProfile === "mirrorSpark" && drawLamuhNeutralSpecialAtlasVfx(projectile, 3, { drawW: 118, drawH: 118, offsetX: -58, offsetY: -60, fadeIn: 0.06, fadeOut: 0.12, originFlare: { rx: 8, ry: 6, blur: 10, alpha: 0.62, outer: "rgba(247, 242, 223, 0.7)", shadow: "#f7f2df" } })) return true;
    if (projectile.flags?.visualProfile === "mirrorPulse") return drawLamuhMirrorPulseProjectile(projectile);
    if (projectile.flags?.visualProfile === "crownBeam") return drawLamuhCrownBeamProjectile(projectile);
    const atlas = state.images.lamuhVfxCelestialPalm;
    if (!atlas) return false;
    const box = getProjectileBox(projectile);
    const frameW = atlas.width / 8;
    const frameH = atlas.height / 4;
    const age = (projectile.maxLife || 1) - projectile.life;
    const t = clamp(age / Math.max(projectile.maxLife || 1, 0.1), 0, 1);
    let row = 1;
    let localT = t;
    if (t < 0.14) {
      row = 0;
      localT = t / 0.14;
    } else if (t < 0.72) {
      row = 1;
      localT = (t - 0.14) / 0.58;
    } else if (t < 0.9) {
      row = 2;
      localT = (t - 0.72) / 0.18;
    } else {
      row = 3;
      localT = (t - 0.9) / 0.1;
    }
    const frame = Math.min(7, Math.floor(clamp(localT, 0, 0.999) * 8));
    const fadeIn = clamp(t / 0.08, 0, 1);
    const fadeOut = clamp((1 - t) / 0.16, 0, 1);
    const anchor = LAMUH_SPECIAL_VFX_ANCHORS.celestialPalm;

    ctx.save();
    ctx.globalCompositeOperation = "lighter";
    ctx.globalAlpha = Math.min(fadeIn, fadeOut) * 0.94;
    ctx.translate(box.x + box.w / 2 + projectile.facing * anchor.drawOffsetX, box.y + box.h / 2 + anchor.drawOffsetY);
    ctx.scale(projectile.facing, 1);
    ctx.drawImage(
      atlas,
      frame * frameW,
      row * frameH,
      frameW,
      frameH,
      -anchor.drawW * 0.5,
      -anchor.drawH * 0.5,
      anchor.drawW,
      anchor.drawH
    );
    ctx.restore();
    return true;
  }

  function getLamuhProjectileVisualOrigin(projectile, fallbackBox) {
    const owner = getFighterByKind(projectile.ownerKind);
    const profile = projectile.flags?.visualProfile;
    const moveKey = (owner?.activeMove || "").replace(/^enemy_/, "");
    const isAnchoredNeutral = profile === "mirrorSpark"
      ? ["special_1", "neutral_special", "neutral_light_special"].includes(moveKey)
      : profile === "mirrorPulse"
      ? ["special_2", "neutral_medium_special"].includes(moveKey)
      : profile === "crownBeam"
        ? ["special_3", "neutral_heavy_special"].includes(moveKey)
        : false;
    if (owner?.profile?.id === "lamuh" && isAnchoredNeutral) {
      const offsetX = Number.isFinite(projectile.visualAnchorOffsetX) ? projectile.visualAnchorOffsetX : 104;
      const offsetY = Number.isFinite(projectile.visualAnchorOffsetY) ? projectile.visualAnchorOffsetY : -92;
      return {
        x: owner.x + projectile.facing * offsetX,
        y: owner.y + offsetY
      };
    }
    return {
      x: Number.isFinite(projectile.visualOriginX)
        ? projectile.visualOriginX
        : projectile.facing === 1
          ? fallbackBox.x
          : fallbackBox.x + fallbackBox.w,
      y: Number.isFinite(projectile.visualOriginY) ? projectile.visualOriginY : fallbackBox.y + fallbackBox.h * 0.5
    };
  }

  function drawLamuhNeutralSpecialAtlasVfx(projectile, row, options = {}) {
    const atlas = state.images.lamuhNeutralSpecialsBodyVfxRedesign;
    if (!atlas) return false;
    const box = getProjectileBox(projectile);
    const frameW = atlas.width / 8;
    const frameH = atlas.height / 6;
    const age = (projectile.maxLife || options.life || 0.5) - projectile.life;
    const t = clamp(age / Math.max(projectile.maxLife || options.life || 0.5, 0.08), 0, 1);
    const frame = Math.min(7, Math.floor(clamp(t, 0, 0.999) * 8));
    const origin = getLamuhProjectileVisualOrigin(projectile, box);
    const tipX = projectile.facing === 1 ? box.x + box.w : box.x;
    const rawLength = Math.abs(tipX - origin.x);
    const drawW = options.drawW || clamp(rawLength + (options.lengthPad || 90), options.minW || box.w, options.maxW || 680);
    const drawH = options.drawH || Math.max(box.h * (options.heightScale || 2.8), options.minH || 112);
    const fadeIn = clamp(t / (options.fadeIn || 0.1), 0, 1);
    const fadeOut = clamp((1 - t) / (options.fadeOut || 0.18), 0, 1);

    ctx.save();
    ctx.globalCompositeOperation = "lighter";
    ctx.globalAlpha = Math.min(fadeIn, fadeOut) * (options.alpha || 0.92);
    ctx.translate(origin.x, origin.y);
    ctx.scale(projectile.facing || 1, 1);
    ctx.drawImage(
      atlas,
      frame * frameW,
      row * frameH,
      frameW,
      frameH,
      Number.isFinite(options.offsetX) ? options.offsetX : -24,
      Number.isFinite(options.offsetY) ? options.offsetY : -drawH * 0.5,
      drawW,
      drawH
    );
    if (options.originFlare) {
      const flare = options.originFlare;
      const pulse = 0.82 + Math.sin(t * Math.PI) * 0.28;
      ctx.globalAlpha = Math.min(fadeIn, fadeOut) * (flare.alpha || 0.78);
      ctx.shadowColor = flare.shadow || "#ffe08a";
      ctx.shadowBlur = flare.blur || 18;
      ctx.fillStyle = flare.outer || "rgba(255, 224, 138, 0.72)";
      ctx.beginPath();
      ctx.ellipse(flare.x || 0, flare.y || 0, (flare.rx || 14) * pulse, (flare.ry || 10) * pulse, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.globalAlpha *= 0.92;
      ctx.shadowColor = "#f7f2df";
      ctx.shadowBlur = Math.max(8, (flare.blur || 18) * 0.5);
      ctx.fillStyle = flare.inner || "rgba(247, 242, 223, 0.9)";
      ctx.beginPath();
      ctx.ellipse(flare.x || 0, flare.y || 0, (flare.rx || 14) * 0.42, (flare.ry || 10) * 0.42, 0, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
    return true;
  }

  function drawLamuhMirrorPulseProjectile(projectile) {
    if (drawLamuhNeutralSpecialAtlasVfx(projectile, 4, { lengthPad: 76, minW: 154, maxW: 286, drawH: 146, offsetX: -46, fadeOut: 0.22, originFlare: { rx: 12, ry: 9, blur: 14, alpha: 0.7, outer: "rgba(53, 232, 213, 0.64)", shadow: "#35e8d5" } })) {
      return true;
    }
    const box = getProjectileBox(projectile);
    const age = (projectile.maxLife || 0.48) - projectile.life;
    const t = clamp(age / Math.max(projectile.maxLife || 0.48, 0.08), 0, 1);
    const fadeIn = clamp(t / 0.1, 0, 1);
    const fadeOut = clamp((1 - t) / 0.18, 0, 1);
    const alpha = Math.min(fadeIn, fadeOut);
    const origin = getLamuhProjectileVisualOrigin(projectile, box);
    const tipX = projectile.facing === 1 ? box.x + box.w : box.x;
    const rawLength = Math.abs(tipX - origin.x);
    const length = clamp(rawLength, box.w * 0.72, 220);
    const height = Math.max(box.h, 42);
    const pulse = Math.sin(t * Math.PI);

    ctx.save();
    ctx.globalCompositeOperation = "lighter";
    ctx.translate(origin.x, origin.y);
    ctx.scale(projectile.facing || 1, 1);

    ctx.globalAlpha = alpha * 0.72;
    ctx.shadowColor = "#35e8d5";
    ctx.shadowBlur = 18;
    ctx.strokeStyle = "rgba(53, 232, 213, 0.78)";
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.ellipse(length * 0.58, 0, 32 + pulse * 24, height * 0.42 + pulse * 6, 0.08, 0, Math.PI * 2);
    ctx.stroke();

    ctx.globalAlpha = alpha * 0.78;
    ctx.strokeStyle = "rgba(247, 242, 223, 0.9)";
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(4, -height * 0.08);
    ctx.quadraticCurveTo(length * 0.38, -height * 0.34, length * 0.9, -height * 0.04);
    ctx.moveTo(4, height * 0.08);
    ctx.quadraticCurveTo(length * 0.36, height * 0.28, length * 0.84, height * 0.04);
    ctx.stroke();

    ctx.globalAlpha = alpha * 0.92;
    ctx.fillStyle = "#ffe08a";
    ctx.shadowColor = "#ffe08a";
    ctx.shadowBlur = 16;
    ctx.beginPath();
    ctx.ellipse(0, 0, 13 + pulse * 4, 10 + pulse * 3, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.globalAlpha = alpha * 0.36;
    ctx.strokeStyle = "#1b1510";
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(length * 0.18, 0);
    ctx.lineTo(length * 0.68, 0);
    ctx.stroke();
    ctx.restore();
    return true;
  }

  function drawLamuhCrownBeamProjectile(projectile) {
    if (drawLamuhNeutralSpecialAtlasVfx(projectile, 5, { lengthPad: 156, minW: 330, maxW: 760, drawH: 184, offsetX: -42, fadeIn: 0.08, fadeOut: 0.18, alpha: 0.98, originFlare: { rx: 18, ry: 14, blur: 24, alpha: 0.86, outer: "rgba(255, 224, 138, 0.78)", inner: "rgba(255, 255, 255, 0.94)", shadow: "#ffe08a" } })) {
      return true;
    }
    const box = getProjectileBox(projectile);
    const age = (projectile.maxLife || 0.58) - projectile.life;
    const t = clamp(age / Math.max(projectile.maxLife || 0.58, 0.08), 0, 1);
    const fadeIn = clamp(t / 0.12, 0, 1);
    const fadeOut = clamp((1 - t) / 0.2, 0, 1);
    const alpha = Math.min(fadeIn, fadeOut);
    const origin = getLamuhProjectileVisualOrigin(projectile, box);
    const tipX = projectile.facing === 1 ? box.x + box.w : box.x;
    const rawLength = Math.abs(tipX - origin.x);
    const length = clamp(rawLength, box.w, 640);
    const height = Math.max(box.h, 54);
    const pulse = 1 + Math.sin(state.time * 72) * 0.05;

    ctx.save();
    ctx.globalCompositeOperation = "lighter";
    ctx.translate(origin.x, origin.y);
    ctx.scale(projectile.facing || 1, 1);

    const aura = ctx.createLinearGradient(0, 0, length, 0);
    aura.addColorStop(0, "rgba(255, 224, 138, 0.26)");
    aura.addColorStop(0.16, "rgba(247, 242, 223, 0.42)");
    aura.addColorStop(0.68, "rgba(255, 224, 138, 0.32)");
    aura.addColorStop(1, "rgba(53, 232, 213, 0.08)");
    ctx.globalAlpha = alpha * 0.64;
    ctx.shadowColor = "#ffe08a";
    ctx.shadowBlur = 30;
    ctx.fillStyle = aura;
    ctx.fillRect(0, -height * 0.5 * pulse, length, height * pulse);

    const core = ctx.createLinearGradient(0, 0, length, 0);
    core.addColorStop(0, "rgba(255, 255, 255, 0.92)");
    core.addColorStop(0.28, "rgba(247, 242, 223, 0.95)");
    core.addColorStop(0.64, "rgba(255, 232, 163, 0.86)");
    core.addColorStop(1, "rgba(53, 232, 213, 0.28)");
    ctx.globalAlpha = alpha * 0.9;
    ctx.shadowColor = "#f7f2df";
    ctx.shadowBlur = 16;
    ctx.fillStyle = core;
    ctx.fillRect(0, -height * 0.14, length, height * 0.28);

    ctx.globalAlpha = alpha * 0.9;
    ctx.strokeStyle = "#f7f2df";
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(10, -height * 0.18);
    ctx.lineTo(length * 0.92, -height * 0.1);
    ctx.moveTo(12, height * 0.18);
    ctx.lineTo(length * 0.86, height * 0.08);
    ctx.stroke();

    ctx.globalAlpha = alpha * 0.88;
    ctx.fillStyle = "#ffe08a";
    ctx.shadowColor = "#ffe08a";
    ctx.shadowBlur = 24;
    ctx.beginPath();
    ctx.ellipse(0, 0, 16, height * 0.34, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.globalAlpha = alpha * 0.42;
    ctx.fillStyle = "#1b1510";
    ctx.fillRect(length * 0.08, -2, length * 0.55, 4);
    ctx.restore();
    return true;
  }

  function drawLamuhMirrorPierceBeam(projectile) {
    const box = getProjectileBox(projectile);
    const age = (projectile.maxLife || 0.24) - projectile.life;
    const t = clamp(age / Math.max(projectile.maxLife || 0.24, 0.08), 0, 1);
    const fadeIn = clamp(t / 0.12, 0, 1);
    const fadeOut = clamp((1 - t) / 0.18, 0, 1);
    const alpha = Math.min(fadeIn, fadeOut);
    const length = box.w;
    const height = box.h;
    const originX = projectile.facing === 1 ? box.x : box.x + box.w;
    const originY = box.y + box.h * 0.5;
    const pulse = 1 + Math.sin(state.time * 90) * 0.05;

    ctx.save();
    ctx.globalCompositeOperation = "lighter";
    ctx.translate(originX, originY);
    ctx.scale(projectile.facing || 1, 1);

    const glow = ctx.createLinearGradient(0, 0, length, 0);
    glow.addColorStop(0, "rgba(53, 232, 213, 0.18)");
    glow.addColorStop(0.18, "rgba(247, 242, 223, 0.35)");
    glow.addColorStop(0.72, "rgba(255, 224, 138, 0.32)");
    glow.addColorStop(1, "rgba(53, 232, 213, 0.05)");
    ctx.globalAlpha = alpha * 0.58;
    ctx.shadowColor = "#35e8d5";
    ctx.shadowBlur = 30;
    ctx.fillStyle = glow;
    ctx.fillRect(0, -height * 0.5 * pulse, length, height * pulse);

    const core = ctx.createLinearGradient(0, 0, length, 0);
    core.addColorStop(0, "rgba(247, 242, 223, 0.85)");
    core.addColorStop(0.35, "rgba(53, 232, 213, 0.95)");
    core.addColorStop(0.75, "rgba(255, 232, 163, 0.9)");
    core.addColorStop(1, "rgba(255, 255, 255, 0.15)");
    ctx.globalAlpha = alpha * 0.86;
    ctx.shadowColor = "#ffe8a3";
    ctx.shadowBlur = 18;
    ctx.fillStyle = core;
    ctx.fillRect(0, -height * 0.13, length, height * 0.26);

    ctx.globalAlpha = alpha * 0.92;
    ctx.strokeStyle = "#f7f2df";
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(8, -height * 0.18);
    ctx.lineTo(length * 0.93, -height * 0.1);
    ctx.moveTo(14, height * 0.16);
    ctx.lineTo(length * 0.86, height * 0.08);
    ctx.stroke();

    ctx.globalAlpha = alpha * 0.95;
    ctx.fillStyle = "#ffe8a3";
    ctx.shadowColor = "#ffe8a3";
    ctx.shadowBlur = 24;
    ctx.beginPath();
    ctx.ellipse(length, 0, 22, height * 0.34, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.globalAlpha = alpha * 0.62;
    ctx.fillStyle = "#1b1510";
    ctx.fillRect(length * 0.12, -2, length * 0.58, 4);
    ctx.restore();
    return true;
  }

  function drawCelesteProjectileVfx(projectile) {
    if (projectile.ownerCharacterId !== "celeste") return false;
    const box = getProjectileBox(projectile);
    const age = (projectile.maxLife || 1) - projectile.life;
    const t = clamp(age / Math.max(projectile.maxLife || 1, 0.1), 0, 1);
    if (state.images.celesteFinalVfx) {
      const frame = Math.min(5, Math.floor(clamp(t, 0, 0.999) * 6));
      const fadeIn = clamp(t / 0.08, 0, 1);
      const fadeOut = clamp((1 - t) / 0.14, 0, 1);
      drawCelesteVfxFrame(4, frame, box.x + box.w / 2, box.y + box.h / 2, projectile.facing, { scale: 0.58, alpha: Math.min(fadeIn, fadeOut) * 0.96 });
      return true;
    }
    const colors = celesteSpiritColors.SOL;
    const pulse = Math.sin(t * Math.PI);

    ctx.save();
    ctx.translate(box.x + box.w / 2, box.y + box.h / 2);
    ctx.scale(projectile.facing, 1);
    ctx.globalCompositeOperation = "lighter";
    ctx.globalAlpha = 0.9;
    ctx.shadowColor = colors.main;
    ctx.shadowBlur = 20;
    ctx.strokeStyle = colors.main;
    ctx.fillStyle = colors.secondary;
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.ellipse(-box.w * 0.28, 0, 18 + pulse * 5, 16 + pulse * 4, 0, 0, Math.PI * 2);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(-box.w * 0.1, 0);
    ctx.lineTo(box.w * 0.5, -box.h * 0.46);
    ctx.lineTo(box.w * 0.36, 0);
    ctx.lineTo(box.w * 0.5, box.h * 0.46);
    ctx.closePath();
    ctx.fill();
    ctx.globalAlpha = 0.52;
    ctx.strokeStyle = "#fff8da";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(-box.w * 0.45, -4);
    ctx.lineTo(box.w * 0.28, -4);
    ctx.moveTo(-box.w * 0.45, 4);
    ctx.lineTo(box.w * 0.22, 4);
    ctx.stroke();
    ctx.restore();
    return true;
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
      ctx.globalAlpha = alpha * (p.alpha ?? 1);
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
    const stage = getActiveStagePreset();
    ctx.save();
    ctx.strokeStyle = "#ffe45c";
    ctx.lineWidth = 3;
    ctx.setLineDash([14, 8]);
    ctx.beginPath();
    ctx.moveTo(0, stage.groundY);
    ctx.lineTo(stage.worldWidth, stage.groundY);
    ctx.stroke();
    for (const platform of stage.platforms) {
      ctx.strokeRect(platform.x, platform.y, platform.w, platform.h);
    }
    ctx.setLineDash([]);
    ctx.fillStyle = "#ffe45c";
    ctx.font = "700 13px Inter, system-ui, sans-serif";
    ctx.fillText("GROUND / CONTACT BASELINE", 18, stage.groundY - 8);
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

  function drawCelesteFrameDebugOverlay() {
    if (!CELESTE_FRAME_DEBUG_ENABLED) return;
    const fighters = [state.enemy, state.player];
    for (const f of fighters) {
      if (!usesCelestePlaceholder(f)) continue;
      const renderContext = f.celesteRenderContext;
      if (!renderContext?.drawRect) continue;
      const rect = renderContext.drawRect;
      ctx.save();
      ctx.lineWidth = 2;
      ctx.strokeStyle = "rgba(82, 246, 255, 0.95)";
      ctx.setLineDash([8, 5]);
      ctx.strokeRect(rect.x, rect.y, rect.w, rect.h);
      ctx.setLineDash([]);
      ctx.strokeStyle = "rgba(255, 232, 92, 0.82)";
      ctx.beginPath();
      ctx.moveTo(rect.x, f.y);
      ctx.lineTo(rect.x + rect.w, f.y);
      ctx.stroke();
      ctx.fillStyle = "rgba(10, 12, 18, 0.82)";
      ctx.fillRect(rect.x, rect.y - 66, 310, 60);
      ctx.fillStyle = "#ffffff";
      ctx.font = "700 11px Inter, system-ui, sans-serif";
      ctx.fillText(`${renderContext.baseAnimKey} body r${renderContext.row} f${renderContext.frame}`, rect.x + 6, rect.y - 49);
      ctx.fillText(`${renderContext.sheet || "sheet"} ${Math.round(rect.w)}x${Math.round(rect.h)}`, rect.x + 6, rect.y - 33);
      const vfxSummary = renderContext.vfxFrames?.length
        ? renderContext.vfxFrames.map((vfx) => `${vfx.spirit || "VFX"}:${vfx.layer[0]} r${vfx.row}f${vfx.frame}`).slice(0, 3).join(" ")
        : "VFX:none";
      ctx.fillText(vfxSummary, rect.x + 6, rect.y - 17);

      const sockets = renderContext.sockets || {};
      const socketNames = ["root", "feetBase", "frontPalm", "batonTip", "projectileOrigin", "trapPlacementOrigin", "barrierCenter", "octavaOrigin", "beamOrigin"];
      for (const name of socketNames) {
        const socket = sockets[name];
        if (!socket) continue;
        const isRoot = name === "root";
        ctx.fillStyle = isRoot ? "#ff477e" : "#8eff7f";
        ctx.beginPath();
        ctx.arc(socket.x, socket.y, isRoot ? 5 : 3.5, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = "#ffffff";
        ctx.font = "700 9px Inter, system-ui, sans-serif";
        ctx.fillText(name.replace(/[a-z]/g, "").slice(0, 3) || name.slice(0, 2), socket.x + 5, socket.y - 5);
      }

      if (renderContext.hitbox) {
        drawBox(renderContext.hitbox, "rgba(255, 45, 85, 0.18)", "#ff3b63");
      }
      ctx.restore();
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
    playerNameEl.closest(".fighter-card")?.setAttribute("data-fighter", p.profile.id);
    enemyNameEl.closest(".fighter-card")?.setAttribute("data-fighter", e.profile.id);
    if (playerPortraitEl) {
      playerPortraitEl.src = getPortraitPath(p.profile.id);
      playerPortraitEl.alt = `${p.profile.name} portrait`;
    }
    if (enemyPortraitEl) {
      enemyPortraitEl.src = getPortraitPath(e.profile.id);
      enemyPortraitEl.alt = `${e.profile.name} portrait`;
    }
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
      if (isFightMode() && !state.matchEnded && !state.enemy.dead) {
        roundStatusEl.textContent = getRoundStatus();
      }
    }, seconds * 1000);
  }

  function chooseAttack(button, fighter = state.player, controls = P1_CONTROLS) {
    const p = fighter;
    if (p.kind === "enemy") return chooseEnemyControlledAttack(button, p, controls);
    if (usesCelestePlaceholder(p) && p.grounded && state.keys.has(controls.up)) return `up_${button}`;
    if (usesCelestePlaceholder(p) && p.upAttackGrace > 0 && state.keys.has(controls.up)) return `up_${button}`;
    if (!p.grounded) return `jump_${button}`;
    if (state.keys.has(controls.down)) return `down_${button}`;

    const forward = p.facing === 1 ? controls.right : controls.left;
    const back = p.facing === 1 ? controls.left : controls.right;
    if (state.keys.has(forward)) return `forward_${button}`;
    if (state.keys.has(back)) return `back_${button}`;
    return `neutral_${button}`;
  }

  function chooseEnemyControlledAttack(button, fighter, controls) {
    if (usesCelestePlaceholder(fighter)) {
      if (fighter.grounded && state.keys.has(controls.up)) return `enemy_up_${button}`;
      if (fighter.upAttackGrace > 0 && state.keys.has(controls.up)) return `enemy_up_${button}`;
      if (!fighter.grounded) return `enemy_jump_${button}`;
      const forward = fighter.facing === 1 ? controls.right : controls.left;
      const back = fighter.facing === 1 ? controls.left : controls.right;
      if (state.keys.has(controls.down)) return `enemy_down_${button}`;
      if (state.keys.has(forward)) return `enemy_forward_${button}`;
      if (state.keys.has(back)) return `enemy_back_${button}`;
      if (button === "light") return "enemy_light_attack";
      if (button === "medium") return "enemy_medium_attack";
      if (button === "heavy") return "enemy_heavy_attack";
    }
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
    if (p.kind === "enemy") {
      const autoCombos = getComboRoutes(p).autoCombos;
      if (usesCelestePlaceholder(p) && p.action && autoCombos[p.activeMove]) return autoCombos[p.activeMove];
      return usesCelestePlaceholder(p) ? chooseEnemyControlledAttack("light", p, controls) : "enemy_light_attack";
    }
    const autoCombos = getComboRoutes(p).autoCombos;
    if (p.action && autoCombos[p.activeMove]) return autoCombos[p.activeMove];
    if (usesCelestePlaceholder(p) && p.grounded && state.keys.has(controls.up)) return chooseAttack("light", p, controls);
    if (usesCelestePlaceholder(p) && p.upAttackGrace > 0 && state.keys.has(controls.up)) return chooseAttack("light", p, controls);
    if (p.grounded && !isHoldingDirectionalModifier(p, controls)) return "neutral_light";
    return chooseAttack("light", p, controls);
  }

  function isHoldingDirectionalModifier(p, controls = P1_CONTROLS) {
    const forward = p.facing === 1 ? controls.right : controls.left;
    const back = p.facing === 1 ? controls.left : controls.right;
    return state.keys.has(controls.down) || state.keys.has(forward) || state.keys.has(back);
  }

  function chooseSpecialMove(fighter, controls, fallbackKey) {
    const p = fighter;
    if (usesCelestePlaceholder(p)) {
      const prefix = p.kind === "enemy" ? "enemy_" : "";
      if (p.grounded) {
        const back = p.facing === 1 ? controls.left : controls.right;
        if (state.keys.has(back)) return `${prefix}back_special`;
      }
      return fallbackKey;
    }
    if (p?.profile?.id === "lamuh_legacy") {
      return chooseLamuhLegacySpecialMove(p, controls, fallbackKey);
    }
    if (!p || p.profile?.id !== "lamuh") return fallbackKey;
    const prefix = p.kind === "enemy" ? "enemy_" : "";
    const strength = getLamuhSpecialStrengthFromFallback(fallbackKey);
    let direction = "neutral";
    let selected = `${prefix}neutral_${strength}_special`;
    if (!p.grounded) {
      selected = `${prefix}air_${strength}_special`;
      direction = "air";
      recordLamuhSpecialDebug(p, controls, fallbackKey, selected, direction);
      return selected;
    }
    if (state.keys.has(controls.down)) {
      selected = `${prefix}down_${strength}_special`;
      direction = "down";
      recordLamuhSpecialDebug(p, controls, fallbackKey, selected, direction);
      return selected;
    }
    if (state.keys.has(controls.up)) {
      selected = `${prefix}up_${strength}_special`;
      direction = "up";
      recordLamuhSpecialDebug(p, controls, fallbackKey, selected, direction);
      return selected;
    }
    const forward = p.facing === 1 ? controls.right : controls.left;
    const back = p.facing === 1 ? controls.left : controls.right;
    if (state.keys.has(forward)) {
      selected = `${prefix}forward_${strength}_special`;
      direction = "forward";
    } else if (state.keys.has(back)) {
      selected = `${prefix}back_${strength}_special`;
      direction = "back";
    }
    recordLamuhSpecialDebug(p, controls, fallbackKey, selected, direction);
    return selected;
  }

  function chooseLamuhLegacySpecialMove(fighter, controls, fallbackKey) {
    const p = fighter;
    const prefix = p.kind === "enemy" ? "enemy_" : "";
    if (!p.grounded) return `${prefix}air_special`;
    if (state.keys.has(controls.down)) return `${prefix}down_special`;
    if (state.keys.has(controls.up)) return `${prefix}up_special`;
    const forward = p.facing === 1 ? controls.right : controls.left;
    const back = p.facing === 1 ? controls.left : controls.right;
    if (state.keys.has(forward)) return `${prefix}forward_special`;
    if (state.keys.has(back)) return `${prefix}back_special`;
    const bare = fallbackKey.replace(/^enemy_/, "");
    if (bare === "special_2" || bare === "special_3") return `${prefix}${bare}`;
    return `${prefix}neutral_special`;
  }

  function getLamuhSpecialStrengthFromFallback(fallbackKey = "") {
    const bare = fallbackKey.replace(/^enemy_/, "");
    if (bare === "special_2") return "medium";
    if (bare === "special_3") return "heavy";
    return "light";
  }

  function recordLamuhSpecialDebug(fighter, controls, fallbackKey, selected, direction) {
    if (!LAMUH_HIDDEN_TEST_ENABLED) return;
    const bareMove = selected.replace(/^enemy_/, "");
    const animByMove = {
      neutral_special: "mirror_spark",
      forward_special: "dash_strike",
      down_special: "low_mirror_cut",
      back_special: "mirror_slip",
      air_special: "air_mirror_spark",
      neutral_light_special: "mirror_spark",
      neutral_medium_special: "mirror_pulse",
      neutral_heavy_special: "crown_beam",
      forward_light_special: "dash_strike",
      forward_medium_special: "mirror_break",
      forward_heavy_special: "mirror_pierce",
      back_light_special: "mirror_slip",
      back_medium_special: "rebound_strike",
      back_heavy_special: "mirror_reversal",
      down_light_special: "low_mirror_cut",
      down_medium_special: "ground_breaker",
      down_heavy_special: "crown_rupture",
      up_light_special: "crown_pop",
      up_medium_special: "rising_crown",
      up_heavy_special: "ascendant_break",
      air_light_special: "air_mirror_spark",
      air_medium_special: "air_dash_strike",
      air_heavy_special: "air_crown_drop"
    };
    const rowByMove = {
      neutral_special: 0,
      forward_special: 1,
      down_special: 0,
      back_special: 0,
      air_special: 4,
      neutral_light_special: 0,
      neutral_medium_special: 1,
      neutral_heavy_special: 2,
      forward_light_special: 0,
      forward_medium_special: 1,
      forward_heavy_special: 2,
      back_light_special: 0,
      back_medium_special: 1,
      back_heavy_special: 2,
      down_light_special: 0,
      down_medium_special: 1,
      down_heavy_special: 2,
      up_light_special: 3,
      up_medium_special: 4,
      up_heavy_special: 5,
      air_light_special: 0,
      air_medium_special: 4,
      air_heavy_special: "airNormals:2"
    };
    const sheetByMove = bareMove.startsWith("forward_")
      ? "lamuh_sheet_forward_specials_redesign_atlas.png"
      : bareMove.startsWith("down_") || bareMove.startsWith("up_") || bareMove === "down_special"
        ? "lamuh_sheet_3_down_up_specials_body_scale_atlas.png"
        : bareMove.startsWith("neutral_") || bareMove === "neutral_special"
          ? "lamuh_sheet_neutral_specials_body_vfx_atlas.png"
          : bareMove.startsWith("back_") || bareMove === "back_special"
            ? "lamuh_sheet_4_back_neutral_specials_redesign_atlas.png"
            : "lamuh_sheet_5_specials_atlas.png";
    state.lastLamuhSpecialDebug = {
      side: fighter.kind === "enemy" ? "p2" : "p1",
      fighterKind: fighter.kind,
      facing: fighter.facing,
      grounded: fighter.grounded,
      held: {
        left: state.keys.has(controls.left),
        right: state.keys.has(controls.right),
        down: state.keys.has(controls.down)
      },
      direction,
      fallbackKey,
      selectedMove: selected,
      animationKey: fighter.kind === "enemy" ? `enemy_${animByMove[bareMove] || bareMove}` : (animByMove[bareMove] || bareMove),
      sheet: sheetByMove,
      sheetRow: rowByMove[bareMove] ?? null
    };
  }

  function tryCelesteUpAttackFromHeldButtons(fighter, controls = P1_CONTROLS) {
    if (!usesCelestePlaceholder(fighter) || !fighter.grounded) return false;
    if (state.keys.has(controls.light)) {
      startMove(fighter.kind === "enemy" ? "enemy_up_light" : "up_light", fighter);
      return true;
    }
    if (state.keys.has(controls.medium)) {
      startMove(fighter.kind === "enemy" ? "enemy_up_medium" : "up_medium", fighter);
      return true;
    }
    if (state.keys.has(controls.heavy)) {
      startMove(fighter.kind === "enemy" ? "enemy_up_heavy" : "up_heavy", fighter);
      return true;
    }
    return false;
  }

  function handleKeyDown(e) {
    gamepadInput.userGestureSeen = true;
    if (["Space", "ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"].includes(e.code)) e.preventDefault();
    if (e.repeat) {
      setKeyboardKey(e.code, true);
      return;
    }

    setKeyboardKey(e.code, true);

    if (state.mode === "title" && e.code === "Enter") {
      showModeDetail("versus");
      return;
    }
    if (state.flowStep === FLOW_STEP_MODE_DETAIL) {
      if (e.code === "Escape" || e.code === "Backspace") showMainMenu();
      return;
    }
    if (state.mode === "online") {
      if (e.code === "Escape") closeOnlineMenuToTitle();
      return;
    }
    if (state.mode === "select") {
      handleCharacterSelectKey(e);
      return;
    }
    if (e.code === "KeyH") state.debug = !state.debug;
    if (e.code === "KeyP" && isFightMode()) {
      netAwareTogglePause();
      return;
    }
    if (state.matchEnded && isFightMode()) {
      if (e.code === "KeyR") netBroadcastRematch();
      if (e.code === "Escape") netAwareReturnToSelect();
      return;
    }
    if (state.paused && isFightMode()) {
      if (e.code === "Escape") netAwareReturnToSelect();
      if (e.code === "KeyR") netBroadcastRematch();
      return;
    }
    if (e.code === "KeyR" && isFightMode()) {
      netBroadcastRematch();
      return;
    }
    if (!isFightMode() || state.paused) return;

    if (state.mode === "training" && e.code === "KeyN") {
      state.enemyAI = !state.enemyAI;
      flashStatus(getTrainingStatus(), 0.9);
    }
    if (netIsActive()) {
      if (net.role === "guest") {
        handleNetGuestKeyDown(e.code);
        return;
      }
      if (NET_DIRECTION_CODES.has(e.code)) netSendDirMask();
    }
    if (isKeyboardEnabledForPlayer("p1")) {
      if (e.code === P1_CONTROLS.up && !tryCelesteUpAttackFromHeldButtons(state.player, P1_CONTROLS)) jump(state.player);
      if ([P1_CONTROLS.left, P1_CONTROLS.right].includes(e.code)) {
        maybeStartDoubleTapDash(state.player, { ...P1_CONTROLS, dash: [P1_CONTROLS.left, P1_CONTROLS.right] }, state.p1DashTap, e.code);
      }
      if (P1_CONTROLS.dash.includes(e.code)) {
        if (state.keys.has(P1_CONTROLS.modifier)) startSuperDash(state.player);
        else startDash(state.player, P1_CONTROLS);
      }
      if (e.code === P1_CONTROLS.taunt) startMove("taunt", state.player);

      if ((e.code === P1_CONTROLS.ultimateA && state.keys.has(P1_CONTROLS.ultimateB)) || (e.code === P1_CONTROLS.ultimateB && state.keys.has(P1_CONTROLS.ultimateA))) {
        startMove("ultimate", state.player);
        return;
      }

      if (e.code === P1_CONTROLS.light) startMove(state.keys.has(P1_CONTROLS.modifier) ? chooseSpecialMove(state.player, P1_CONTROLS, "special_1") : chooseLightAttack(state.player, P1_CONTROLS), state.player);
      if (e.code === P1_CONTROLS.medium) startMove(state.keys.has(P1_CONTROLS.modifier) ? chooseSpecialMove(state.player, P1_CONTROLS, "special_2") : chooseAttack("medium", state.player, P1_CONTROLS), state.player);
      if (e.code === P1_CONTROLS.heavy) startMove(state.keys.has(P1_CONTROLS.modifier) ? chooseSpecialMove(state.player, P1_CONTROLS, "special_3") : chooseAttack("heavy", state.player, P1_CONTROLS), state.player);
    }

    if (state.mode === "versus" && !netIsActive() && isKeyboardEnabledForPlayer("p2")) {
      maybeStartDoubleTapDash(state.enemy, P2_CONTROLS, state.p2DashTap, e.code);
      if (e.code === P2_CONTROLS.up && !tryCelesteUpAttackFromHeldButtons(state.enemy, P2_CONTROLS)) jump(state.enemy);
      if (e.code === P2_CONTROLS.light) startMove(chooseLightAttack(state.enemy, P2_CONTROLS), state.enemy);
      if (e.code === P2_CONTROLS.medium) startMove(chooseAttack("medium", state.enemy, P2_CONTROLS), state.enemy);
      if (e.code === P2_CONTROLS.heavy) startMove(chooseAttack("heavy", state.enemy, P2_CONTROLS), state.enemy);
      if (e.code === P2_CONTROLS.special1) startMove(chooseSpecialMove(state.enemy, P2_CONTROLS, "enemy_special_1"), state.enemy);
      if (e.code === P2_CONTROLS.special2) startMove(chooseSpecialMove(state.enemy, P2_CONTROLS, "enemy_special_2"), state.enemy);
      if (e.code === P2_CONTROLS.special3) startMove(chooseSpecialMove(state.enemy, P2_CONTROLS, "enemy_special_3"), state.enemy);
      if (e.code === P2_CONTROLS.ultimate) startMove("enemy_ultimate", state.enemy);
    }
  }

  function handleKeyUp(e) {
    setKeyboardKey(e.code, false);
    if (netIsActive() && isFightMode() && !state.paused && !state.matchEnded) {
      if (net.role === "guest") handleNetGuestKeyUp(e.code);
      else if (NET_DIRECTION_CODES.has(e.code)) netSendDirMask();
    }
  }

  function clamp(v, min, max) {
    return Math.max(min, Math.min(max, v));
  }

  function markGamepadUserGesture() {
    gamepadInput.userGestureSeen = true;
    refreshGamepadAssignments();
    updateControllerStatus();
  }

  // ============================================================
  // ONLINE VERSUS (Phase 1: PeerJS P2P, host-authoritative sync)
  // Host runs the authoritative match. The guest plays P2 with the
  // P1 keyboard layout, sends inputs to the host, predicts locally,
  // and gets corrected by host snapshots ~15x per second.
  // ============================================================

  const NET_PROTOCOL_VERSION = 1;
  const NET_PEER_PREFIX = "nga-fight-";
  const NET_ROOM_ALPHABET = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";
  const NET_SNAPSHOT_INTERVAL = 1 / 15;
  const NET_DIRECTION_CODES = new Set(["KeyA", "KeyD", "KeyS", "KeyW"]);
  const NET_DOUBLE_TAP_WINDOW = 0.25;
  const NET_CONNECT_TIMEOUT_MS = 20000;
  const NET_TIMEOUT_TEXT = "Connection timed out. This network may block peer-to-peer multiplayer. Try another Wi-Fi network, a phone hotspot, or the same network as your opponent.";
  const NET_FIGHTER_SYNC_FIELDS = [
    "x", "y", "vx", "vy", "facing", "hp", "meter", "grounded", "crouching", "blocking", "dead",
    "action", "actionTime", "hitstun", "blockstun", "knockdownTimer", "pendingKnockdown",
    "recoveryTimer", "platformAirRecoveryTimer", "juggleGravityScale", "upAttackGrace",
    "blowbackTimer", "wallBounceEligible", "standingPlatformId", "platformDropTimer",
    "landingTimer", "dashTimer", "dashCooldown", "airDashTimer", "airDashCooldown",
    "airDashUsed", "dashDirection", "superDashCooldown", "activeMove", "hasHit", "hitCount",
    "spawnedProjectile", "spawnedTrap", "cancelUnlocked", "bufferedMove", "reactionAnim", "anim",
    "celesteFaCooldown", "celesteFaWindow", "celesteFaStringSpent", "celesteSolCooldown",
    "celesteLaCooldown", "celesteBarrierTimer", "celesteBarrierHits", "celesteTiCooldown",
    "lamuhPierceDone", "lamuhPierceConfirmed", "lamuhPierceStage1Hit", "lamuhPierceWhiffed",
    "lamuhPierceBlocked", "lamuhPierceWhiffBeamFired", "mirrorPierceWallBouncePending",
    "mirrorPierceHoldTimer", "mirrorPierceHoldX", "mirrorPierceHoldY"
  ];

  const net = {
    role: null,
    peer: null,
    conn: null,
    roomCode: null,
    connected: false,
    helloTimer: null,
    connectTimer: null,
    phase: "idle",
    inMatch: false,
    snapTimer: 0,
    dirRefreshTimer: 0,
    lastSentDirMask: -1,
    applyingSnapshot: false,
    guestDashTap: { code: null, time: -Infinity }
  };

  function netIsActive() {
    return net.connected && net.role !== null;
  }

  function makeRoomCode() {
    let code = "";
    for (let i = 0; i < 5; i++) code += NET_ROOM_ALPHABET[Math.floor(Math.random() * NET_ROOM_ALPHABET.length)];
    return code;
  }

  function logOnlineDiagnostic(phase, detail = "") {
    const peerState = net.peer ? {
      disconnected: Boolean(net.peer.disconnected),
      destroyed: Boolean(net.peer.destroyed),
      open: Boolean(net.peer.open)
    } : null;
    console.info("[NGA online]", { phase, detail, role: net.role, mode: state.mode, peerState, hasConnection: Boolean(net.conn) });
  }

  function setOnlineStatus(text, tone = "", phase = net.phase || "idle") {
    if (!onlineStatusEl) return;
    onlineStatusEl.textContent = text;
    onlineStatusEl.dataset.netPhase = phase;
    onlineStatusEl.classList.toggle("error", tone === "error");
    onlineStatusEl.classList.toggle("good", tone === "good");
    onlineStatusEl.classList.toggle("pending", tone === "pending");
  }

  function setOnlinePhase(phase, text, tone = "") {
    net.phase = phase;
    logOnlineDiagnostic(phase, text);
    setOnlineStatus(text, tone, phase);
  }

  function clearNetConnectTimeout() {
    if (!net.connectTimer) return;
    clearTimeout(net.connectTimer);
    net.connectTimer = null;
  }

  function failNetConnection(phase, message) {
    const hadRole = net.role !== null;
    console.warn("[NGA online]", { phase, message, role: net.role, mode: state.mode });
    netReset();
    if (!hadRole) {
      setOnlinePhase(phase, message, "error");
      return;
    }
    hideFlowScreens();
    hideMatchFlowOverlay();
    showOnlineMenu();
    setOnlinePhase(phase, message, "error");
  }

  function scheduleNetConnectTimeout(phase, message = NET_TIMEOUT_TEXT) {
    clearNetConnectTimeout();
    net.connectTimer = setTimeout(() => {
      if (net.phase !== phase || net.connected || net.inMatch) return;
      failNetConnection("timed out", message);
    }, NET_CONNECT_TIMEOUT_MS);
  }

  function resetOnlinePanels() {
    onlineHostPanel?.classList.add("hidden");
    onlineJoinPanel?.classList.add("hidden");
  }

  function showOnlineMenu() {
    hideFlowScreens();
    onlineMenu?.classList.remove("hidden");
    state.mode = "online";
    state.flowStep = FLOW_STEP_MODE_DETAIL;
    resetOnlinePanels();
    setOnlinePhase("idle", "Choose Host or Join. Both players need this page open.");
  }

  function closeOnlineMenuToTitle() {
    netReset();
    showMainMenu();
  }

  function netPeerAvailable() {
    if (typeof Peer === "undefined") {
      setOnlinePhase("failed", "Online service script failed to load - check your connection and refresh.", "error");
      return false;
    }
    return true;
  }

  function startHosting() {
    if (!netPeerAvailable()) return;
    netReset();
    resetOnlinePanels();
    onlineHostPanel?.classList.remove("hidden");
    const code = makeRoomCode();
    net.role = "host";
    net.roomCode = code;
    if (onlineRoomCodeEl) onlineRoomCodeEl.textContent = code;
    setOnlinePhase("creating room", "Creating room...", "pending");
    scheduleNetConnectTimeout("creating room", "Could not create the room. PeerJS signaling may be blocked on this network.");
    net.peer = new Peer(NET_PEER_PREFIX + code.toLowerCase());
    net.peer.on("open", () => {
      clearNetConnectTimeout();
      setOnlinePhase("waiting for opponent", "Room ready - waiting for challenger...", "good");
    });
    net.peer.on("connection", (conn) => {
      if (net.conn) {
        conn.close();
        return;
      }
      setOnlinePhase("connecting", "Challenger found - connecting...", "pending");
      scheduleNetConnectTimeout("connecting");
      bindConnection(conn);
    });
    net.peer.on("error", handlePeerError);
  }

  function joinRoom(rawCode) {
    if (!netPeerAvailable()) return;
    const code = String(rawCode || "").trim().toUpperCase();
    if (code.length < 4) {
      setOnlinePhase("failed", "Enter the 5-character room code.", "error");
      return;
    }
    netReset();
    resetOnlinePanels();
    onlineJoinPanel?.classList.remove("hidden");
    net.role = "guest";
    net.roomCode = code;
    setOnlinePhase("joining room", "Joining room " + code + "...", "pending");
    scheduleNetConnectTimeout("joining room");
    net.peer = new Peer();
    net.peer.on("open", () => {
      setOnlinePhase("connecting", "Connecting to room " + code + "...", "pending");
      scheduleNetConnectTimeout("connecting");
      const conn = net.peer.connect(NET_PEER_PREFIX + code.toLowerCase(), { reliable: true });
      bindConnection(conn);
    });
    net.peer.on("error", handlePeerError);
  }

  function handlePeerError(err) {
    const type = err?.type || "unknown";
    console.warn("[NGA online]", { phase: net.phase, type, role: net.role, message: err?.message || "" });
    if (type === "unavailable-id") {
      setOnlinePhase("failed", "Room code collision - press Host Game again.", "error");
      netReset();
      return;
    }
    if (type === "peer-unavailable") {
      failNetConnection("failed", "Room not found - check the code and try again.");
      return;
    }
    if (netIsActive() || state.mode !== "online") {
      handleNetDrop("Connection lost (" + type + ").");
      return;
    }
    failNetConnection("failed", "Connection error: " + type + ". This network may be blocking peer-to-peer multiplayer.");
  }

  function bindConnection(conn) {
    net.conn = conn;
    const markOpen = () => {
      clearNetConnectTimeout();
      net.connected = true;
      if (net.role === "guest") {
        netSend({ t: "hello", v: NET_PROTOCOL_VERSION });
        setOnlinePhase("connected", "Connected - syncing fighters...", "good");
      }
    };
    conn.on("open", () => {
      markOpen();
      if (net.role === "guest") startGuestHelloRetry();
      else setOnlinePhase("connected", "Challenger connected - syncing...", "good");
    });
    conn.on("data", (message) => {
      if (!net.connected) markOpen();
      netOnData(message);
    });
    conn.on("close", () => handleNetDrop("Opponent disconnected."));
    conn.on("error", () => handleNetDrop("Connection error."));
    if (conn.open) {
      markOpen();
      if (net.role === "guest") startGuestHelloRetry();
    }
  }

  function netSend(message) {
    if (!net.conn || (!net.connected && !net.conn.open)) return;
    try {
      net.conn.send(message);
    } catch {
      /* dropped messages are recovered by snapshots */
    }
  }

  function stopGuestHelloRetry() {
    if (!net.helloTimer) return;
    clearInterval(net.helloTimer);
    net.helloTimer = null;
  }

  function startGuestHelloRetry() {
    if (net.role !== "guest" || net.helloTimer || net.inMatch || state.mode === "select") return;
    let attempts = 0;
    net.helloTimer = setInterval(() => {
      if (!net.conn || !net.connected || state.mode === "select" || net.inMatch || net.role !== "guest") {
        stopGuestHelloRetry();
        return;
      }
      attempts += 1;
      netSend({ t: "hello", v: NET_PROTOCOL_VERSION });
      if (attempts >= 10) {
        stopGuestHelloRetry();
        if (state.mode === "online" && net.role === "guest" && !net.inMatch) {
          failNetConnection("timed out", "Room did not answer. Check the code, keep the host page open, then try again.");
        }
      }
    }, 750);
  }

  function netReset() {
    stopGuestHelloRetry();
    clearNetConnectTimeout();
    try {
      net.conn?.close();
    } catch { /* already closed */ }
    try {
      net.peer?.destroy();
    } catch { /* already destroyed */ }
    net.role = null;
    net.peer = null;
    net.conn = null;
    net.roomCode = null;
    net.connected = false;
    net.phase = "idle";
    net.inMatch = false;
    net.snapTimer = 0;
    net.dirRefreshTimer = 0;
    net.lastSentDirMask = -1;
    net.guestDashTap = { code: null, time: -Infinity };
    state.netKeys.clear();
    syncInputKeys();
  }

  function handleNetDrop(message) {
    const wasActive = net.role !== null;
    netReset();
    if (!wasActive) return;
    hideFlowScreens();
    hideMatchFlowOverlay();
    state.paused = false;
    state.matchEnded = false;
    showOnlineMenu();
    setOnlinePhase("disconnected", message, "error");
  }

  function enterOnlineSelect() {
    net.inMatch = false;
    onlineMenu?.classList.add("hidden");
    titleScreen.classList.add("hidden");
    showCharacterSelect("versus", SELECT_STEP_CHARACTERS);
  }

  function confirmOnlineCharacterSelect() {
    if (state.selectStep === SELECT_STEP_ARENA) {
      confirmArenaSelect();
      return;
    }
    const cursor = isLaunchableCharacterId(state.selectCursorCharacterId) ? state.selectCursorCharacterId : "kairo";
    if (net.role === "host") {
      if (!state.p1Ready) {
        state.selectedP1CharacterId = cursor;
        state.p1Ready = true;
        netSend({ t: "lock", c: cursor });
        updateCharacterSelectFocus(cursor);
        return;
      }
      if (state.p1Ready && state.p2Ready) {
        showStageSelect();
      }
      return;
    }
    if (!state.p2Ready) {
      state.selectedP2CharacterId = cursor;
      state.p2Ready = true;
      netSend({ t: "lock", c: cursor });
      updateCharacterSelectFocus(cursor);
      if (state.p1Ready) showStageSelect();
    }
  }

  function backOnlineCharacterSelect() {
    if (state.selectStep === SELECT_STEP_ARENA) {
      if (net.role === "guest") state.p2Ready = false;
      else state.p1Ready = false;
      netSend({ t: "unlock" });
      revealFighterSelectScreen();
      return;
    }
    const ownReady = net.role === "guest" ? state.p2Ready : state.p1Ready;
    if (ownReady) {
      if (net.role === "guest") state.p2Ready = false;
      else state.p1Ready = false;
      netSend({ t: "unlock" });
      state.selectStep = SELECT_STEP_CHARACTERS;
      revealFighterSelectScreen();
      return;
    }
    netSend({ t: "bye" });
    const code = net.roomCode;
    netReset();
    showOnlineMenu();
    setOnlinePhase("idle", "You left room " + (code || "") + ".");
  }

  function startOnlineVersus(p1Id, p2Id, stagePresetId) {
    state.selectedP1CharacterId = isLaunchableCharacterId(p1Id) ? p1Id : "kairo";
    state.selectedP2CharacterId = isLaunchableCharacterId(p2Id) ? p2Id : "vanta";
    state.selectedPlayerId = state.selectedP1CharacterId;
    if (stagePresetId) state.selectedStagePresetId = STAGE_PRESETS[stagePresetId]?.id || STANDARD_STAGE_ID;
    hideFlowScreens({ hideHud: false });
    hud.classList.remove("hidden");
    state.mode = "versus";
    state.flowStep = "fight";
    state.enemyAI = false;
    state.paused = false;
    net.inMatch = true;
    net.snapTimer = 0;
    net.lastSentDirMask = -1;
    resetRound();
    flashStatus(net.role === "host" ? "ONLINE MATCH - YOU ARE P1" : "ONLINE MATCH - YOU ARE P2", 2.2);
  }

  function netAwareTogglePause() {
    if (!netIsActive()) {
      togglePauseHelp();
      return;
    }
    if (!isFightMode() || state.matchEnded) return;
    netSend({ t: "pause", on: !state.paused });
    togglePauseHelp();
  }

  function netSetPaused(on) {
    if (!isFightMode() || state.matchEnded || state.paused === Boolean(on)) return;
    togglePauseHelp();
  }

  function netBroadcastRematch() {
    if (netIsActive()) netSend({ t: "rematch" });
    resetRound();
    net.lastSentDirMask = -1;
  }

  function netAwareReturnToSelect() {
    if (!netIsActive()) {
      returnToCharacterSelectFromMatch();
      return;
    }
    netSend({ t: "toselect" });
    enterOnlineSelect();
  }

  function netRemoteFighter() {
    return net.role === "host" ? state.enemy : state.player;
  }

  function setNetKey(code, on) {
    if (!code) return;
    if (on) state.netKeys.add(code);
    else state.netKeys.delete(code);
  }

  function netComputeLocalDirMask() {
    let mask = 0;
    if (state.keyboardKeys.has("KeyA")) mask |= 1;
    if (state.keyboardKeys.has("KeyD")) mask |= 2;
    if (state.keyboardKeys.has("KeyS")) mask |= 4;
    if (state.keyboardKeys.has("KeyW")) mask |= 8;
    return mask;
  }

  function applyNetDirMask(fighter, mask) {
    if (!fighter) return;
    const controls = fighter.kind === "enemy" ? P2_CONTROLS : P1_CONTROLS;
    setNetKey(controls.left, mask & 1);
    setNetKey(controls.right, mask & 2);
    setNetKey(controls.down, mask & 4);
    setNetKey(controls.up, mask & 8);
    syncInputKeys();
  }

  function netSendDirMask(force = false) {
    if (!netIsActive()) return;
    const mask = netComputeLocalDirMask();
    if (!force && mask === net.lastSentDirMask) return;
    net.lastSentDirMask = mask;
    if (net.role === "guest") applyNetDirMask(state.enemy, mask);
    netSend({ t: "dir", m: mask });
  }

  function applyNetAction(fighter, action) {
    if (!fighter || !isFightMode() || state.paused || state.matchEnded || fighter.dead) return;
    const controls = fighter.kind === "enemy" ? P2_CONTROLS : P1_CONTROLS;
    const prefix = fighter.kind === "enemy" ? "enemy_" : "";
    switch (action) {
      case "jump":
        if (!tryCelesteUpAttackFromHeldButtons(fighter, controls)) jump(fighter);
        break;
      case "dash":
        startDash(fighter, controls);
        break;
      case "superdash":
        startSuperDash(fighter);
        break;
      case "light":
        startMove(chooseLightAttack(fighter, controls), fighter);
        break;
      case "medium":
        startMove(chooseAttack("medium", fighter, controls), fighter);
        break;
      case "heavy":
        startMove(chooseAttack("heavy", fighter, controls), fighter);
        break;
      case "special1":
        startMove(chooseSpecialMove(fighter, controls, prefix + "special_1"), fighter);
        break;
      case "special2":
        startMove(chooseSpecialMove(fighter, controls, prefix + "special_2"), fighter);
        break;
      case "special3":
        startMove(chooseSpecialMove(fighter, controls, prefix + "special_3"), fighter);
        break;
      case "ultimate":
        startMove(prefix ? "enemy_ultimate" : "ultimate", fighter);
        break;
      default:
        break;
    }
  }

  function sendGuestAction(action) {
    applyNetAction(state.enemy, action);
    netSend({ t: "act", a: action });
  }

  function handleNetGuestKeyDown(code) {
    const held = state.keyboardKeys;
    if (NET_DIRECTION_CODES.has(code)) {
      netSendDirMask();
      if (code === "KeyW") sendGuestAction("jump");
      if (code === "KeyA" || code === "KeyD") {
        const now = performance.now() / 1000;
        if (net.guestDashTap.code === code && now - net.guestDashTap.time < NET_DOUBLE_TAP_WINDOW) {
          sendGuestAction(held.has("KeyU") ? "superdash" : "dash");
        }
        net.guestDashTap = { code, time: now };
      }
      return;
    }
    if (code === "ShiftLeft" || code === "ShiftRight") {
      sendGuestAction(held.has("KeyU") ? "superdash" : "dash");
      return;
    }
    if ((code === "KeyI" && held.has("KeyO")) || (code === "KeyO" && held.has("KeyI"))) {
      sendGuestAction("ultimate");
      return;
    }
    if (code === "KeyJ") sendGuestAction(held.has("KeyU") ? "special1" : "light");
    if (code === "KeyK") sendGuestAction(held.has("KeyU") ? "special2" : "medium");
    if (code === "KeyL") sendGuestAction(held.has("KeyU") ? "special3" : "heavy");
  }

  function handleNetGuestKeyUp(code) {
    if (NET_DIRECTION_CODES.has(code)) netSendDirMask();
  }

  function buildFighterSnap(fighter) {
    return NET_FIGHTER_SYNC_FIELDS.map((key) => {
      const value = fighter[key];
      return value === undefined || value === -Infinity || value === Infinity ? null : value;
    });
  }

  function applyFighterSnap(fighter, values) {
    if (!fighter || !Array.isArray(values)) return;
    NET_FIGHTER_SYNC_FIELDS.forEach((key, index) => {
      const value = values[index];
      if (value !== undefined) fighter[key] = value;
    });
  }

  function netSendSnapshot() {
    netSend({
      t: "snap",
      p: buildFighterSnap(state.player),
      e: buildFighterSnap(state.enemy),
      me: state.matchEnded,
      mw: state.matchWinner,
      hp: state.hitPause,
      c: { ...state.combo },
      dm: netComputeLocalDirMask()
    });
  }

  function netApplySnapshot(message) {
    if (!isFightMode() || !state.player || !state.enemy) return;
    applyFighterSnap(state.player, message.p);
    applyFighterSnap(state.enemy, message.e);
    if (typeof message.hp === "number") state.hitPause = message.hp;
    if (message.c) Object.assign(state.combo, message.c);
    applyNetDirMask(state.player, message.dm | 0);
    if (message.me && !state.matchEnded) {
      const defeated = message.mw === "p1" ? state.enemy : state.player;
      net.applyingSnapshot = true;
      endMatch(defeated);
      net.applyingSnapshot = false;
    }
    updateHud();
  }

  function netOnData(message) {
    if (!message || typeof message !== "object") return;
    switch (message.t) {
      case "hello":
        if (net.role !== "host") return;
        if (message.v !== NET_PROTOCOL_VERSION) {
          netSend({ t: "badver" });
          handleNetDrop("Version mismatch - both players should refresh the page.");
          return;
        }
        net.connected = true;
        netSend({ t: "welcome", v: NET_PROTOCOL_VERSION, s: state.selectedStagePresetId });
        enterOnlineSelect();
        break;
      case "welcome":
        if (net.role !== "guest") return;
        if (message.v !== NET_PROTOCOL_VERSION) {
          handleNetDrop("Version mismatch - both players should refresh the page.");
          return;
        }
        stopGuestHelloRetry();
        net.connected = true;
        if (message.s) setStagePreset(message.s, true);
        enterOnlineSelect();
        break;
      case "badver":
        handleNetDrop("Version mismatch - both players should refresh the page.");
        break;
      case "lock":
        if (net.role === "host") {
          state.selectedP2CharacterId = isLaunchableCharacterId(message.c) ? message.c : "vanta";
          state.p2Ready = true;
        } else {
          state.selectedP1CharacterId = isLaunchableCharacterId(message.c) ? message.c : "kairo";
          state.p1Ready = true;
        }
        if (state.mode === "select") {
          if (state.p1Ready && state.p2Ready) showStageSelect();
          else updateCharacterSelectFocus(state.selectCursorCharacterId);
        }
        break;
      case "unlock":
        if (net.role === "host") state.p2Ready = false;
        else state.p1Ready = false;
        if (state.mode === "select") {
          state.selectStep = SELECT_STEP_CHARACTERS;
          updateCharacterSelectFocus(state.selectCursorCharacterId);
        }
        break;
      case "stage":
        setStagePreset(message.s, true);
        break;
      case "intro":
        state.selectedP1CharacterId = isLaunchableCharacterId(message.p1) ? message.p1 : "kairo";
        state.selectedP2CharacterId = isLaunchableCharacterId(message.p2) ? message.p2 : "vanta";
        if (message.s) setStagePreset(message.s, true);
        showMatchIntro({ fromNet: true });
        break;
      case "stageSelect":
        showStageSelect(false);
        break;
      case "start":
        startOnlineVersus(message.p1, message.p2, message.s);
        break;
      case "dir":
        applyNetDirMask(netRemoteFighter(), message.m | 0);
        break;
      case "act":
        applyNetAction(netRemoteFighter(), message.a);
        break;
      case "snap":
        if (net.role === "guest") netApplySnapshot(message);
        break;
      case "pause":
        netSetPaused(message.on);
        break;
      case "rematch":
        if (isFightMode()) {
          resetRound();
          net.lastSentDirMask = -1;
        }
        break;
      case "toselect":
        enterOnlineSelect();
        break;
      case "bye":
        handleNetDrop("Opponent left the room.");
        break;
      default:
        break;
    }
  }

  function netTick(dt) {
    if (!netIsActive()) return;
    if (net.role === "host") {
      if (state.mode === "versus" && net.inMatch) {
        net.snapTimer -= dt;
        if (net.snapTimer <= 0) {
          net.snapTimer = NET_SNAPSHOT_INTERVAL;
          netSendSnapshot();
        }
      }
      return;
    }
    net.dirRefreshTimer -= dt;
    if (net.dirRefreshTimer <= 0) {
      net.dirRefreshTimer = 0.5;
      if (state.mode === "versus" && net.inMatch && !state.paused && !state.matchEnded) netSendDirMask(true);
    }
  }

  onlineButton?.addEventListener("click", () => showModeDetail("online"));
  onlineHostButton?.addEventListener("click", startHosting);
  onlineJoinButton?.addEventListener("click", () => {
    netReset();
    resetOnlinePanels();
    onlineJoinPanel?.classList.remove("hidden");
    setOnlinePhase("idle", "Enter the host's room code.");
    onlineCodeInput?.focus();
  });
  onlineConnectButton?.addEventListener("click", () => joinRoom(onlineCodeInput?.value));
  onlineCodeInput?.addEventListener("keydown", (e) => {
    e.stopPropagation();
    if (e.key === "Enter") joinRoom(onlineCodeInput.value);
  });
  onlineBackButton?.addEventListener("click", closeOnlineMenuToTitle);

  window.addEventListener("keydown", handleKeyDown);
  window.addEventListener("keyup", handleKeyUp);
  window.addEventListener("pointerdown", markGamepadUserGesture);
  window.addEventListener("mousedown", markGamepadUserGesture);
  window.addEventListener("gamepadconnected", () => {
    gamepadInput.userGestureSeen = true;
    refreshGamepadAssignments();
    updateControllerStatus();
  });
  window.addEventListener("gamepaddisconnected", () => {
    refreshGamepadAssignments();
    updateControllerStatus();
  });
  startButton.addEventListener("click", () => showModeDetail("versus"));
  trainingButton?.addEventListener("click", () => showModeDetail("training"));
  arcadeButton?.addEventListener("click", () => showModeDetail("arcade"));
  controlsButton?.addEventListener("click", () => {
    const opening = titleControlsPanel?.classList.contains("hidden");
    if (titleControlsPanel) titleControlsPanel.classList.toggle("hidden", !opening);
    if (opening) renderControlsDisplay(titleControlsPanel, true);
  });
  modeDetailBackButton?.addEventListener("click", showMainMenu);
  selectVersusButton?.addEventListener("click", () => chooseSelectMode("versus"));
  selectTrainingButton?.addEventListener("click", () => chooseSelectMode("training"));
  selectBackButton?.addEventListener("click", backCharacterSelect);
  selectConfirmButton?.addEventListener("click", confirmCharacterSelect);
  showcaseBackButton?.addEventListener("click", backCharacterSelect);
  showcaseConfirmButton?.addEventListener("click", confirmFighterLock);
  stageBackButton?.addEventListener("click", backCharacterSelect);
  stageConfirmButton?.addEventListener("click", confirmArenaSelect);
  introBackButton?.addEventListener("click", backCharacterSelect);
  introStartButton?.addEventListener("click", startConfirmedMatch);
  selectControlsToggle?.addEventListener("click", () => toggleSelectControls());
  stagePresetButtons.forEach((button) => {
    button.addEventListener("click", () => setStagePreset(button.dataset.stagePreset));
  });
  document.addEventListener("keydown", (e) => {
    if (state.mode === "select" && state.flowStep !== FLOW_STEP_MODE_DETAIL) {
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
  refreshGamepadAssignments();
  updateControllerStatus();
  window.__platformArenaTest = {
    state,
    stagePresets: STAGE_PRESETS,
    platformArenaConfig: PLATFORM_ARENA_CONFIG,
    selectableCharacterIds: [...selectableCharacterIds],
    selectStage(stagePresetId = PLATFORM_TEST_STAGE_ID) {
      setStagePreset(stagePresetId);
      return state.selectedStagePresetId;
    },
    startMatch(p1Id = "sol", p2Id = "lamuh", stagePresetId = PLATFORM_TEST_STAGE_ID) {
      state.selectedStagePresetId = STAGE_PRESETS[stagePresetId]?.id || STANDARD_STAGE_ID;
      state.selectedP1CharacterId = isLaunchableCharacterId(p1Id) ? p1Id : "kairo";
      state.selectedP2CharacterId = isLaunchableCharacterId(p2Id) ? p2Id : "vanta";
      startLocalVersus();
      return this.snapshot();
    },
    startTraining(characterId = "sol", stagePresetId = PLATFORM_TEST_STAGE_ID) {
      state.selectedStagePresetId = STAGE_PRESETS[stagePresetId]?.id || STANDARD_STAGE_ID;
      startTraining(characterId);
      return this.snapshot();
    },
    reset: resetRound,
    syncCamera() {
      updateStageCamera(0, true);
      return this.snapshot().camera;
    },
    startMove(move, side = "p1") {
      const fighter = side === "p2" ? state.enemy : state.player;
      if (!fighter) return null;
      const key = fighter.kind === "enemy" && !move.startsWith("enemy_") ? `enemy_${move}` : move;
      startMove(key, fighter);
      return { side, fighter: fighter.profile?.id, move: fighter.activeMove, anim: fighter.anim };
    },
    tryDirectHit(side = "p1") {
      const attacker = side === "p2" ? state.enemy : state.player;
      const defender = side === "p2" ? state.player : state.enemy;
      if (!attacker || !defender) return { hit: false };
      const moveData = getMove(attacker);
      if (!moveData) return { hit: false, move: attacker.activeMove || null };
      const hit = tryHit(attacker, defender, moveData);
      return {
        hit,
        move: attacker.activeMove,
        defenderHitstun: defender.hitstun,
        defenderVy: defender.vy,
        queuedAirRecovery: defender.platformAirRecoveryTimer || 0,
        combo: { ...state.combo }
      };
    },
    speedSnapshot(side = "p1") {
      const fighter = side === "p2" ? state.enemy : state.player;
      if (!fighter) return null;
      return {
        stagePresetId: state.stagePresetId,
        tuning: getFightingSpeedTuning(),
        stageTuning: getPlatformSpeedTuning(),
        movement: getMovementStats(fighter),
        jump: getJumpStats(fighter),
        airDash: getAirDashStats(fighter),
        effectiveGravity: {
          ascentMultiplier: getFightingGravityMultiplier({ ...fighter, vy: -1, hitstun: 0, recoveryTimer: 0, platformAirRecoveryTimer: 0, knockdownTimer: 0 }),
          fallMultiplier: getFightingGravityMultiplier({ ...fighter, vy: 1, hitstun: 0, recoveryTimer: 0, platformAirRecoveryTimer: 0, knockdownTimer: 0 }),
          reactionMultiplier: getFightingGravityMultiplier({ ...fighter, vy: -1, hitstun: 0.1, recoveryTimer: 0, platformAirRecoveryTimer: 0, knockdownTimer: 0 })
        },
        animationSpeedMultiplier: getFightingSpeedTuning()?.animationSpeedMultiplier ?? 1,
        knockbackVelocityMultiplier: getFightingKnockbackVelocityMultiplier(),
        heavyHitstop: getImpactProfile({ boxType: "heavy", flags: {} }).hitStop * (getFightingSpeedTuning()?.hitstopMultiplier ?? 1)
      };
    },
    setPosition(side = "p1", x = 0, y = GROUND_Y, grounded = true) {
      const fighter = side === "p2" ? state.enemy : state.player;
      if (!fighter) return null;
      fighter.x = clampToStageX(x);
      fighter.y = y;
      fighter.grounded = grounded;
      fighter.vx = 0;
      fighter.vy = 0;
      fighter.standingPlatformId = null;
      fighter.platformAirRecoveryTimer = 0;
      return { side, x: fighter.x, y: fighter.y, grounded: fighter.grounded };
    },
    snapshot() {
      return {
        mode: state.mode,
        selectedStagePresetId: state.selectedStagePresetId,
        stagePresetId: state.stagePresetId,
        stage: getActiveStagePreset(),
        camera: getStageCamera(),
        p1: state.player ? { id: state.player.profile?.id, x: state.player.x, y: state.player.y, grounded: state.player.grounded, platform: state.player.standingPlatformId } : null,
        p2: state.enemy ? { id: state.enemy.profile?.id, x: state.enemy.x, y: state.enemy.y, grounded: state.enemy.grounded, platform: state.enemy.standingPlatformId } : null
      };
    }
  };
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
  if (LAMUH_HIDDEN_TEST_ENABLED) {
    window.__lamuhHiddenTest = {
      state,
      assetPaths,
      sheetMeta,
      selectableCharacterIds: [...selectableCharacterIds],
      hiddenTestCharacterIds: [...hiddenTestCharacterIds],
      profile: characterProfiles.lamuh,
      portrait: {
        expectedPath: LAMUH_SELECT_PORTRAIT_PATH,
        ready: LAMUH_SELECT_PORTRAIT_READY,
        fallbackPath: "assets/sprites/portraits/sol_select.png"
      },
      ultimate: {
        placeholder: false,
        animation: "crown_startup/crown_rush -> golden-locs ascended cinematic",
        bodyAtlas: "lamuhSuperAscendedGoldenLocs",
        bodyAtlasPath: assetPaths.lamuhSuperAscendedGoldenLocs,
        fallbackBodyAtlas: "lamuhCrownBody",
        fallbackBodyAtlasPath: assetPaths.lamuhCrownBody,
        beamVfx: "lamuhCrownBeamVfx",
        beamAtlasPath: assetPaths.lamuhCrownBeamVfx,
        finalDamage: LAMUH_CROWN_FINAL_DAMAGE,
        note: "Crown of No Gods uses a LAMUH-only rush-confirm cinematic. Whiff recovers; confirmed hits play the golden-locs ascended rows and spawn the approved beam during the fire phase."
      },
      startMatch(p1Id = "lamuh", p2Id = "lamuh") {
        state.selectedP1CharacterId = isLaunchableCharacterId(p1Id) ? p1Id : "lamuh";
        state.selectedP2CharacterId = isLaunchableCharacterId(p2Id) ? p2Id : "lamuh";
        startLocalVersus();
        return { mode: state.mode, p1: state.player?.profile?.id, p2: state.enemy?.profile?.id };
      },
      startP1() {
        startTraining("lamuh");
        return { mode: state.mode, p1: state.player?.profile?.id, p2: state.enemy?.profile?.id };
      },
      startP2(opponentId = "sol") {
        state.selectedP1CharacterId = isLaunchableCharacterId(opponentId) ? opponentId : "sol";
        state.selectedP2CharacterId = "lamuh";
        startLocalVersus();
        return { mode: state.mode, p1: state.player?.profile?.id, p2: state.enemy?.profile?.id };
      },
      startMirror() {
        state.selectedP1CharacterId = "lamuh";
        state.selectedP2CharacterId = "lamuh";
        startLocalVersus();
        return { mode: state.mode, p1: state.player?.profile?.id, p2: state.enemy?.profile?.id };
      },
      reset: resetRound,
      setFighterAnim(side = "p1", anim = "idle", options = {}) {
        if (state.mode !== "versus" || state.player?.profile?.id !== "lamuh" || state.enemy?.profile?.id !== "lamuh") {
          this.startMirror();
        }
        const f = side === "p2" ? state.enemy : state.player;
        f.anim = f.kind === "enemy" && !anim.startsWith("enemy_") ? `enemy_${anim}` : anim;
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
        f.facing = options.facing || (side === "p2" ? -1 : 1);
        f.y = options.y || (f.grounded ? GROUND_Y : GROUND_Y - 130);
        f.vx = 0;
        f.vy = 0;
        return { side, anim: f.anim, grounded: f.grounded, facing: f.facing };
      },
      startMove(move, side = "p1", options = {}) {
        if (state.mode !== "versus" || state.player?.profile?.id !== "lamuh" || state.enemy?.profile?.id !== "lamuh") {
          this.startMirror();
        }
        const f = side === "p2" ? state.enemy : state.player;
        const enemyMoveMap = {
          neutral_light: "enemy_light_attack",
          light_attack: "enemy_light_attack",
          neutral_medium: "enemy_medium_attack",
          medium_attack: "enemy_medium_attack",
          neutral_heavy: "enemy_heavy_attack",
          heavy_attack: "enemy_heavy_attack",
          forward_heavy: "enemy_forward_heavy",
          launcher: "enemy_launcher",
          jump_light: "enemy_jump_light",
          air_light: "enemy_jump_light",
          jump_medium: "enemy_jump_medium",
          air_medium: "enemy_jump_medium",
          jump_heavy: "enemy_jump_heavy",
          air_heavy: "enemy_jump_heavy",
          special_1: "enemy_special_1",
          special_2: "enemy_special_2",
          special_3: "enemy_special_3",
          neutral_special: "enemy_neutral_special",
          forward_special: "enemy_forward_special",
          down_special: "enemy_down_special",
          back_special: "enemy_back_special",
          air_special: "enemy_air_special",
          celestial_palm: "enemy_neutral_special",
          ascend_step: "enemy_forward_special",
          heaven_splitter: "enemy_down_special",
          divine_vanish: "enemy_back_special",
          radiant_dive: "enemy_air_special",
          ultimate: "enemy_ultimate"
        };
        const key = f.kind === "enemy" && !move.startsWith("enemy_") ? (enemyMoveMap[move] || `enemy_${move}`) : move;
        f.meter = METER_MAX;
        f.grounded = options.grounded ?? f.grounded;
        f.y = options.y || (f.grounded ? GROUND_Y : GROUND_Y - 130);
        f.hitstun = 0;
        f.blockstun = 0;
        f.knockdownTimer = 0;
        f.recoveryTimer = 0;
        f.landingTimer = 0;
        f.dashTimer = 0;
        f.airDashTimer = 0;
        f.action = null;
        f.activeMove = null;
        state.lamuhCinematicUltimate = null;
        startMove(key, f);
        return { side, move: f.activeMove, anim: f.anim };
      },
      startAnyMove(move, side = "p1", options = {}) {
        if (!isFightMode()) this.startMatch("sol", "nyx");
        const f = side === "p2" ? state.enemy : state.player;
        const key = f.kind === "enemy" && !move.startsWith("enemy_") ? `enemy_${move}` : move;
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
        state.lamuhCinematicUltimate = null;
        startMove(key, f);
        return { side, fighter: f.profile?.id, move: f.activeMove, anim: f.anim };
      },
      loadedLamuhAssets() {
        return Object.fromEntries(
          Object.entries(assetPaths)
            .filter(([key]) => key.startsWith("lamuh"))
            .map(([key]) => [key, Boolean(state.images[key])])
        );
      },
      lamuhUltimateBeamCount() {
        return state.lamuhUltimateBeams.length;
      },
      lamuhSpecialEffectCount() {
        return state.lamuhSpecialEffects.length;
      },
      crownDebug() {
        return {
          cinematicActive: Boolean(state.lamuhCinematicUltimate),
          cinematic: state.lamuhCinematicUltimate ? { ...state.lamuhCinematicUltimate } : null,
          debug: state.lastLamuhCrownUltimateDebug ? { ...state.lastLamuhCrownUltimateDebug } : null,
          beamCount: state.lamuhUltimateBeams.length,
          p1Hp: state.player?.hp,
          p2Hp: state.enemy?.hp,
          p1Anim: state.player?.anim,
          p2Anim: state.enemy?.anim,
          p1Move: state.player?.activeMove,
          p2Move: state.enemy?.activeMove
        };
      },
      scaleSnapshot() {
        const fighterSnapshot = (f) => ({
          id: f?.profile?.id,
          anim: f?.anim,
          x: f?.x,
          y: f?.y,
          grounded: f?.grounded,
          facing: f?.facing,
          sheetScale: f?.profile?.id === "lamuh" ? sheetMeta.lamuhFinalCoreMovement.scale : null
        });
        return {
          p1: fighterSnapshot(state.player),
          p2: fighterSnapshot(state.enemy)
        };
      }
    };
  }
  if (CELESTE_HIDDEN_TEST_ENABLED) {
    window.__celestePhase2Test = {
      state,
      selectableCharacterIds: [...selectableCharacterIds],
      start() {
        startTraining("celeste");
        return { mode: state.mode, p1: state.player?.profile?.id, p2: state.enemy?.profile?.id };
      },
      startVersus(p2Id = "vanta") {
        state.selectedP1CharacterId = "celeste";
        state.selectedP2CharacterId = isLaunchableCharacterId(p2Id) ? p2Id : "vanta";
        startLocalVersus();
        return { mode: state.mode, p1: state.player?.profile?.id, p2: state.enemy?.profile?.id };
      },
      reset: resetRound,
      setPositions(options = {}) {
        if (!isFightMode() || state.player?.profile?.id !== "celeste") startTraining("celeste");
        const p = state.player;
        const e = state.enemy;
        p.x = options.p1x ?? 330;
        e.x = options.p2x ?? 462;
        p.y = options.p1y ?? GROUND_Y;
        e.y = options.p2y ?? GROUND_Y;
        p.facing = p.x <= e.x ? 1 : -1;
        e.facing = e.x <= p.x ? 1 : -1;
        p.grounded = options.p1Grounded ?? true;
        e.grounded = options.p2Grounded ?? true;
        p.vx = 0;
        p.vy = 0;
        e.vx = 0;
        e.vy = 0;
        return { p1x: p.x, p2x: e.x, p1Grounded: p.grounded, p2Grounded: e.grounded };
      },
      clearFighter(side = "p1") {
        const f = side === "p2" ? state.enemy : state.player;
        if (!f) return null;
        clearAction(f);
        f.hitstun = 0;
        f.blockstun = 0;
        f.knockdownTimer = 0;
        f.pendingKnockdown = 0;
        f.recoveryTimer = 0;
        f.landingTimer = 0;
        f.dashTimer = 0;
        f.airDashTimer = 0;
        f.blocking = false;
        return { side, fighter: f.profile?.id };
      },
      setBlocking(side = "p2", blocking = true) {
        const f = side === "p2" ? state.enemy : state.player;
        if (!f) return null;
        f.blocking = Boolean(blocking);
        return { side, blocking: f.blocking };
      },
      setFrameDebug(enabled = true) {
        state.debug = Boolean(enabled);
        return { frameDebugAvailable: CELESTE_FRAME_DEBUG_ENABLED, debug: state.debug };
      },
      holdP2Back(pressed = true) {
        if (!state.enemy) return null;
        const back = state.enemy.facing === 1 ? P2_CONTROLS.left : P2_CONTROLS.right;
        setKeyboardKey(back, Boolean(pressed));
        return { key: back, pressed: Boolean(pressed), facing: state.enemy.facing };
      },
      startMove(move, side = "p1", options = {}) {
        if (!isFightMode() || state.player?.profile?.id !== "celeste") startTraining("celeste");
        const f = side === "p2" ? state.enemy : state.player;
        const key = f.kind === "enemy" && !move.startsWith("enemy_") ? `enemy_${move}` : move;
        this.clearFighter(side);
        f.grounded = options.grounded ?? f.grounded;
        f.y = options.y ?? (f.grounded ? GROUND_Y : GROUND_Y - 130);
        if (options.fullMeter || key.replace(/^enemy_/, "") === "ultimate") f.meter = METER_MAX;
        f.celesteFaCooldown = options.resetCooldowns ? 0 : f.celesteFaCooldown;
        f.celesteSolCooldown = options.resetCooldowns ? 0 : f.celesteSolCooldown;
        f.celesteLaCooldown = options.resetCooldowns ? 0 : f.celesteLaCooldown;
        f.celesteTiCooldown = options.resetCooldowns ? 0 : f.celesteTiCooldown;
        startMove(key, f);
        return { side, fighter: f.profile?.id, move: f.activeMove, anim: f.anim };
      },
      snapshot() {
        return {
          mode: state.mode,
          p1: state.player?.profile?.id,
          p2: state.enemy?.profile?.id,
          p1Move: state.player?.activeMove,
          p2Move: state.enemy?.activeMove,
          p1Hp: state.player?.hp,
          p2Hp: state.enemy?.hp,
          p1Meter: state.player?.meter,
          p2Meter: state.enemy?.meter,
          p1ActionTime: state.player?.actionTime,
          p2ActionTime: state.enemy?.actionTime,
          p1Position: state.player ? { x: state.player.x, y: state.player.y, grounded: state.player.grounded } : null,
          p2Position: state.enemy ? { x: state.enemy.x, y: state.enemy.y, grounded: state.enemy.grounded } : null,
          p1OctavaPhase: getCelesteOctavaPhase(state.player)?.name || null,
          p2OctavaPhase: getCelesteOctavaPhase(state.enemy)?.name || null,
          p2Hitstun: state.enemy?.hitstun,
          p2Blockstun: state.enemy?.blockstun,
          p2KnockdownTimer: state.enemy?.knockdownTimer,
          p2PendingKnockdown: state.enemy?.pendingKnockdown,
          p2Blocking: state.enemy?.blocking,
          p1Cooldowns: state.player ? {
            fa: state.player.celesteFaCooldown,
            sol: state.player.celesteSolCooldown,
            la: state.player.celesteLaCooldown,
            ti: state.player.celesteTiCooldown,
            faSpent: state.player.celesteFaStringSpent,
            barrierTimer: state.player.celesteBarrierTimer,
            barrierHits: state.player.celesteBarrierHits
          } : null,
          projectiles: state.projectiles.filter((projectile) => projectile.ownerCharacterId === "celeste").length,
          traps: state.celesteTraps.length,
          armedTraps: state.celesteTraps.filter((trap) => trap.age >= trap.armTime && !trap.detonating).length,
          combo: { ...state.combo },
          p1Sockets: getCelesteSocketSnapshot(state.player),
          p2Sockets: getCelesteSocketSnapshot(state.enemy)
        };
      }
    };
  }
  window.setInterval(() => {
    if (!isFightMode() || state.paused || state.matchEnded || !state.player || state.player.dead) return;
    growPassiveMeter(0.25);
    updateHud();
  }, 250);
  boot();
})();
