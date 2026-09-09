import type { SandboxRect } from "./types";

export const SWAHILI_STANDING_HEAVY_COMBAT_PROFILE_V1 = {
  id: "SWAHILI_STANDING_HEAVY_COMBAT_PROFILE_V1",
  approval: "APPROVED_RECOMMENDED_PROFILE",
  authority: "authoritative_v1_balance_baseline",
  candidateOnly: true,
  deployable: false,
  productionRoster: false,
  tickRateHz: 60,
  startup: { start: 0, end: 23 },
  active: { start: 24, end: 28 },
  recovery: { start: 29, end: 74 },
  returnToIdleTick: 75,
  hitstop: { hit: 8, block: 5, whiff: 0 },
  damage: 120,
  chipDamage: 0,
  hitstun: 56,
  blockstun: 20,
  counterHit: {
    damage: 138,
    hitstun: 64,
    behavior: "grounded_heavy_stagger",
    launch: false,
    knockdown: false
  },
  advantage: {
    calculation: "stun_ticks_minus_return_to_idle_tick_minus_contact_tick; shared hitstop cancels from relative advantage",
    normalHit: { firstActiveTick24: 5, lastActiveTick28: 9 },
    block: { firstActiveTick24: -31, lastActiveTick28: -27 },
    counterHit: { firstActiveTick24: 13, lastActiveTick28: 17 }
  },
  hitKnockbackPerTick: 2.3,
  blockPushbackPerTick: 0.575,
  meterGain: { hit: 12, block: 4, whiff: 0 },
  damageScaling: { starterProration: 1, postHitStep: 0.08, minimumMultiplier: 0.5 },
  hitLevel: "mid",
  guardBehavior: { standing: true, crouching: true, guardBreak: false },
  hitbox: { x: 44, y: -92, w: 108, h: 50 } satisfies SandboxRect,
  localEndpoint: 152,
  strictOverlapRootDistance: { standing: 200, crouching: 196 },
  maxHits: 1,
  projectile: false,
  cancelWindows: [] as string[],
  armor: [] as string[],
  invulnerability: [] as string[],
  rootMotion: false,
  vulnerableThroughTick: 74,
  reaction: "grounded_heavy_stagger",
  presentationSockets: {
    coordinateSystem: "approved_1536x1536_source_canvas_P1",
    leftMuzzle: { x: 1215, y: 650 },
    rightMuzzle: { x: 1430, y: 700 },
    impactOrigin: { x: 1430, y: 675 },
    mirrorRule: "xMirrored = 1535 - x; y unchanged"
  },
  presentationEvents: [
    "left_muzzle",
    "right_muzzle",
    "impact_origin",
    "hit_spark",
    "block_spark",
    "character_hit_flash",
    "impact_sound",
    "optional_camera_shake",
    "optional_smoke",
    "optional_debris"
  ]
} as const;

