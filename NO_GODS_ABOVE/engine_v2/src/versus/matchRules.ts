import type { AirExtender, LauncherFollowUp, VersusRules } from "../core/types";

/**
 * Versus match rules. Consumed by the engine only because a versus match opts in through
 * `MatchConfig.versusRules`; approved move data and every fixture without it are unchanged.
 *
 * - Pushback decays instead of sliding for the whole reaction, so gatlings stay in range and
 *   spacing after a blockstring is readable.
 * - A wall-pinned defender hands its pushback back to the attacker, so the corner rewards
 *   pressure without allowing touch-of-death loops.
 * - Fast airborne bodies bounce off the arena walls once per combo.
 * - Counter hits reward every character equally, not only the Lamuh Legacy kit.
 */
/**
 * Lamuh launcher follow-ups. Each opens a jump cancel (an air jump when he is mid-hop) once the
 * strike has finished on screen, so every launcher can be chased into an air combo like 2H > jc.
 * Heaven Splitter's uppercut reaches only ~60u, so when it is cancelled from a normal that hit, Lamuh
 * steps in during the windup (never from neutral or on block) and the ground chain links into it.
 * Move definitions and approval receipts are unchanged; this is versus-match behaviour only.
 */
export const LAMUH_LAUNCHER_FOLLOW_UPS: LauncherFollowUp[] = [
  // Splitter pops are short (authored -7/-10/-12); these lifts plus a lower mid-hop air jump put the victim level
  // with Lamuh for the chase, matching how the proven 2H > jc air combo reads on screen.
  { attack: "legacy_heaven_splitter_light", hitbox: "legacy_heaven_splitter_light_uppercut", fromMoveTick: 11, launchVelocityY: -11, airJumpVelocityY: -12, comboApproach: { velocity: 3, untilMoveTick: 9 } },
  { attack: "legacy_heaven_splitter_medium", hitbox: "legacy_heaven_splitter_medium_uppercut", fromMoveTick: 15, launchVelocityY: -12, airJumpVelocityY: -12, comboApproach: { velocity: 2.6, untilMoveTick: 12 } },
  { attack: "legacy_heaven_splitter_heavy", hitbox: "legacy_heaven_splitter_heavy_uppercut", fromMoveTick: 20, launchVelocityY: -13.5, airJumpVelocityY: -12, comboApproach: { velocity: 2.2, untilMoveTick: 16 } },
  { attack: "legacy_ascend_step", hitbox: "legacy_ascend_step_medium_backspring_launcher", fromMoveTick: 29 }
  // Divine Vanish counter kick is excluded: it carries the victim ~250u away and already follows up with its aura ball.
];

/**
 * Lamuh combo extender: Radiant Dive Medium (j.S+M) hitting an airborne victim re-lifts it and rebounds
 * Lamuh into a fresh air jump, once per combo, so an air combo can keep going instead of ending on the dive.
 */
export const LAMUH_AIR_EXTENDERS: AirExtender[] = [
  { attack: "legacy_radiant_dive_medium", hitbox: "legacy_radiant_dive_medium_palm", reboundAfterMoveTicks: 2,
    attackerReboundVelocity: { x: 2.5, y: -11 }, airActions: 3,
    victimVelocity: { x: 0.5, y: -9 }, minimumHitstun: 30, juggleRefund: 4 }
];

export const ROUNDS_RULES: VersusRules = {
  groundPushbackFriction: 0.86,
  blockPushbackScale: 1.2,
  cornerPushback: 0.9,
  wallBounce: { minSpeed: 4.5, restitution: 0.5, popVelocity: -9, hitstun: 26, juggleCost: 1 },
  throwRangeFromContact: true,
  hitstopInputBuffer: true,
  universalCounterHits: true,
  launcherFollowUps: LAMUH_LAUNCHER_FOLLOW_UPS,
  airExtenders: LAMUH_AIR_EXTENDERS,
  knockout: true
};

/** Training shares the feel of a real match but a fighter is never knocked out for the session. */
export const TRAINING_RULES: VersusRules = { ...ROUNDS_RULES, knockout: false };

/** Stock stage keeps the full Fallen Capital slab, with open ends and three pass-through landings. */
export const STOCK_RULES: VersusRules = {
  ...ROUNDS_RULES,
  wallBounce: undefined,
  cornerPushback: 0,
  openPlatform: {
    left: -900, right: 900, blastX: 1170, blastY: 220,
    upperPlatforms: [
      { left: -335, right: -145, y: -72 },
      { left: -105, right: 105, y: -122 },
      { left: 145, right: 335, y: -72 }
    ]
  }
};
