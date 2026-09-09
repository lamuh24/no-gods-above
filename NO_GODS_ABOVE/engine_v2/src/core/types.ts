export const TICKS_PER_SECOND = 60 as const;
export interface InputFrame { ultimate?: boolean; }
export type UltimatePhase = "confirm" | "elbow" | "knee" | "charge" | "beam" | "recovery";
export interface UltimateInteraction {
  id: string; attacker: FighterId; defender: FighterId; tick: number; phase: UltimatePhase; facing: 1 | -1;
  attackerStartX: number; defenderStartX: number; defenderStartY: number; entryScaling: number;
  beamOrigin: { x: number; y: number }; beamTarget: { x: number; y: number }; damageLedger: number[];
}
export interface MatchState { ultimateInteraction?: UltimateInteraction; ultimateEventLedger?: string[]; }

export type FighterId = "p1" | "p2";
export type FighterKind = "lamuh_proto" | "lamuh_legacy_v2" | "training_dummy";
export type FighterPhase = "idle" | "walk_forward" | "walk_backward" | "turn" | "crouch" | "crouch_release" | "jump_startup" | "jump" | "air_dash_forward" | "air_dash_backward" | "air_recovery" | "landing" | "dive_landing" | "dash" | "backdash" | "attack" | "throw_startup" | "throw_active" | "throw_whiff" | "thrown" | "roman_cancel" | "burst" | "block" | "hit_reaction" | "knockdown" | "getup";
export type AttackId = "legacy_crown_of_no_gods" | "legacy_aura_sweep_light" | "legacy_aura_sweep_medium" | "legacy_aura_sweep_heavy" | SwahiliAirSpecialId | "standing_light" | "standing_medium" | "standing_heavy" | "crouching_light" | "crouching_medium" | "crouching_heavy" | "air_light" | "air_medium" | "air_heavy" | "air_special_ender" | "special_neutral_medium" | "special_forward_light" | "special_forward_medium" | "special_forward_heavy" | "special_down_light" | "special_down_medium" | "special_down_heavy" | "special_up_medium" | "special_up_heavy" | "legacy_ascend_step_light" | "legacy_ascend_step" | "legacy_ascend_step_heavy" | "legacy_celestial_palm_light" | "legacy_celestial_palm_medium" | "legacy_celestial_palm_heavy" | "legacy_heaven_splitter_light" | "legacy_heaven_splitter_medium" | "legacy_heaven_splitter_heavy" | "legacy_radiant_dive_light" | "legacy_radiant_dive_medium" | "legacy_radiant_dive_heavy" | "legacy_divine_vanish_light" | "legacy_divine_vanish_medium" | "legacy_divine_vanish_heavy";
export type ThrowId = "forward_throw" | "back_throw" | "command_grab";
export type SwahiliAirSpecialId = "special_air_light" | "special_air_medium" | "special_air_heavy";
export type VictimClass = "standard_humanoid" | "small" | "large" | "non_humanoid" | "extreme_proportion";
export type HitLevel = "mid" | "low" | "launcher";
export type KnockdownKind = "none" | "soft" | "hard";
export type AirTechDirection = "neutral" | "forward" | "backward";
export type HitReactionWeight = "light" | "heavy";
export type DummyMode = "idle" | "stand_block" | "crouch_block" | "block_after_first_hit" | "no_recovery" | "auto_recovery";
export type LamuhReviewTimingProfile = "A" | "B" | "C";
export type LamuhReviewHitstop = 8 | 9 | 10;
export interface LamuhReviewAttackProfile { timing: LamuhReviewTimingProfile; hitstop: LamuhReviewHitstop; }

export interface InputFrame { left?: boolean; right?: boolean; down?: boolean; up?: boolean; light?: boolean; medium?: boolean; heavy?: boolean; special?: boolean; romanCancel?: boolean; throw?: boolean; block?: boolean; burst?: boolean; pause?: boolean; reset?: boolean; }
export interface InputLogFrame { tick: number; p1?: InputFrame; p2?: InputFrame; }
export interface InputEdges { pressed: InputFrame; released: InputFrame; held: InputFrame; }
export interface InputHistoryEntry { tick: number; held: InputFrame; pressed: InputFrame; released: InputFrame; facing: 1 | -1; forward?: boolean; back?: boolean; }
export interface DeterministicInputBuffer { current: InputFrame; previous: InputFrame; pressed: InputFrame; released: InputFrame; history: InputHistoryEntry[]; max: number; }

export interface Rect { x: number; y: number; w: number; h: number; }
export interface StrikeHitbox { id: string; start: number; end: number; rect: Rect; damage: number; hitstop: number; blockHitstop?: number; hitstun: number; blockstun: number; knockbackX: number; knockbackY: number; maxHits: number; level: HitLevel; knockdown?: KnockdownKind; launches?: boolean; jumpCancelOnHit?: boolean; juggleCost?: number; allowOTG?: boolean; }
export interface CancelRules { onHit: AttackId[]; onBlock: AttackId[]; }
export interface RootMotionTrack { start: number; end: number; velocity: number; }
// Move-local tick samples own the complete hop, including its grounded recovery.
// Interruption discards the track but preserves current y/vy for ordinary air physics.
export interface AuthoredHopTrack { takeoffTick: number; apexTick: number; landTick: number; height: number; }
// Positive y is downward. Velocities integrate from the CURRENT airborne position;
// no pose, floor-relative hop, target position, or renderer can relocate the actor.
// AttackDefinition.recovery is the minimum POST-LANDING commitment, not flight time.
export interface AuthoredDiveTrack { minimumHeight: number; maximumHeight: number; landingApproachHeight: number; windupVelocity: { x: number; y: number }; strikeVelocity: { x: number; y: number }; gatherVelocity: { x: number; y: number }; landingRecoveryTicks: number; }
export interface AttackDefinition { authoredDive?: AuthoredDiveTrack; }
// A bounded, move-local downward velocity commitment. Ordinary gravity runs first;
// landing/interruption immediately retire the track. It never relocates either fighter.
export interface AirDescentTrack { start: number; end: number; minimumVelocityY: number; maximumVelocityY: number; }
export interface AttackDefinition { airDescent?: AirDescentTrack; }
// Candidate gate is absent, not false, on default snapshots/checksum projections.
export interface FighterState { swahiliAirSpecialsV1?: true; }
export interface MatchConfig { swahiliAirSpecialsV1?: boolean; }
export interface AttackDefinition { hitConfirm?: { hitboxId: string; holdThrough: number; response: AttackDefinition }; }
export interface FighterState { ascendHeavyResponse?: { triggerTick: number; target: FighterId; sourceMoveInstance: number; responseMoveInstance: number }; }
export interface AttackDefinition { strikeCounter?: { start: number; end: number; response: AttackDefinition }; responseStrikeInvulnThrough?: number; }
// Combat modernization v1 (Lamuh Legacy). Move-local invulnerability measured in
// move ticks, inclusive. "strike" ignores strikes and projectiles but still loses to
// throws; "full" also ignores throws. Absent on every untouched fixture.
export interface AttackDefinition { invulnerable?: { start: number; end: number; kind: "strike" | "full" }; }
// Counter hit: contact landed while the defender was committed to their own action.
// Optional so pre-counter-hit fixtures keep their exact event/checksum projection.
export interface CombatEvent { counterHit?: true; }
// Backdash invulnerability ticks remaining. Deleted at zero to preserve fixture checksums.
export interface FighterState { backdashInvuln?: number; }
// Dash may be cancelled into attacks/jumps from this move tick onward; absent disables it.
export interface MovementTuning { dashCancelTick?: number; backdashInvulnTicks?: number; }
export interface FighterState { divineCounterResponse?: { triggerTick: number; stanceTick: number; incomingAttacker: FighterId; incomingAttackId: AttackId; incomingHitboxId: string; incomingMoveInstance: number }; }
// Optional and absent on untouched fixtures: joins the existing checksum projection.
// Kept after interruption/RC until actual floor contact, preventing repeated air stalls.
export interface FighterState { airDiveUsed?: true; airDiveGatherStartTick?: number; }
export interface TargetSideSwitchTrack { triggerTick: number; captureRange: number; behindDistance: number; verticalTolerance: number; requireTargetAhead: boolean; faceTargetAfterSwitch: boolean; }
export interface AttackDefinition { id: AttackId; command: string; startup: number; active: number; recovery: number; hitboxes: StrikeHitbox[]; cancel?: CancelRules; airOnly?: boolean; groundOnly?: boolean; airActionCost?: number; cancelOnly?: boolean; systemTestOnly?: boolean; rootMotion?: RootMotionTrack; rootMotionSegments?: RootMotionTrack[]; targetSideSwitch?: TargetSideSwitchTrack; projectile?: ProjectileDefinition; authoredHop?: AuthoredHopTrack; hurtboxProfile?: "extended"; targetHurtboxProfile?: "extended"; }
export interface ProjectileDefinition { releaseTick: number; spawnOffset: { x: number; y: number }; releaseSweepStartX: number; speed: number; initialVelocityY?: number; gravity: number; maxTravel: number; lifeTicks: number; hitbox: StrikeHitbox; }
export interface ProjectileState {
  id: string; owner: FighterId; attackId: AttackId; moveInstanceId: number; facing: 1 | -1;
  x: number; y: number; previousX: number; previousY: number; velocityX: number; velocityY: number; gravity: number; ageTicks: number; travelled: number;
  maxTravel: number; lifeTicks: number; spawnTick: number; hitbox: StrikeHitbox; hitLedger: FighterId[];
}
export interface ProjectileEvent {
  tick: number; eventId: string; projectileId: string; owner: FighterId; attackId: AttackId;
  type: "spawn" | "hit" | "block" | "expired"; x: number; y: number; defender?: FighterId;
  reason?: "range" | "lifetime" | "stage_boundary" | "ground" | "juggle_limit";
}
// Optional until the first projectile keeps legacy/prototype snapshot projections unchanged.
export interface MatchState { projectiles?: ProjectileState[]; projectileSpawnLedger?: string[]; projectileEventLedger?: string[]; lastProjectileEvent?: ProjectileEvent; }
export interface ThrowTrackPoint { tick: number; attackerOffsetX: number; attackerOffsetY: number; victimOffsetX: number; victimOffsetY: number; victimRotation: number; victimFacing: 1 | -1; }
export interface ThrowDefinition { id: ThrowId; command: string; startup: number; connectTick: number; releaseTick: number; totalTicks: number; range: number; heightTolerance: number; damage: number; hitstop: number; knockdownTicks: number; victimClass: "standard_humanoid"; track: ThrowTrackPoint[]; }
export interface MovementTuning { walkForward: number; walkBackward: number; dashSpeed: number; dashDuration: number; backdashSpeed: number; backdashDuration: number; jumpStartup: number; jumpVelocity: number; forwardJumpVelocityX: number; backJumpVelocityX: number; airControl: number; airDashCount: number; airDashForwardSpeed: number; airDashBackwardSpeed: number; airDashDuration: number; gravity: number; landingRecovery: number; inputBuffer: number; wakeupInvuln: number; comboNeutralTimeout: number; }
export interface CombatTuning { airActionBudget: number; juggleLimit: number; hitstunDecayStartsAtHit: number; hitstunDecayPerHit: number; airborneHitstunBonus: number; minimumAirHitstun: number; airRecoveryDelay: number; airTechInvuln: number; airTechHorizontalSpeed: number; airTechVerticalSpeed: number; softKnockdownTicks: number; hardKnockdownTicks: number; getupTicks: number; damageScalingStep: number; minimumDamageScaling: number; maxTension: number; tensionGainPerForwardTick: number; tensionGainOnHit: number; tensionGainOnBlock: number; romanCancelCost: number; romanCancelFreezeTicks: number; romanCancelRecoveryTicks: number; romanCancelAirActionRefund: number; maxBurst: number; burstCost: number; burstFreezeTicks: number; burstRecoveryTicks: number; burstHitstun: number; burstPushback: number; }
export interface FighterDefinition { kind: FighterKind; maxHealth: number; movement: MovementTuning; combat: CombatTuning; victimClass: VictimClass; pushbox: Rect; standingHurtboxes: Rect[]; crouchingHurtboxes: Rect[]; projectileHurtboxes?: { standing: Rect[]; crouching: Rect[] }; extendedHurtboxes?: { standing: Rect[]; crouching: Rect[] }; attacks: Record<AttackId, AttackDefinition>; throws: Partial<Record<ThrowId, ThrowDefinition>>; }

export interface FighterRecoveryEvent { tick: number; type: "air_tech" | "knockdown" | "landing_recovery"; durationTicks: number; direction?: AirTechDirection; automatic?: boolean; knockdown?: Exclude<KnockdownKind, "none">; }
export interface FighterState { id: FighterId; kind: FighterKind; victimClass: VictimClass; x: number; y: number; vx: number; vy: number; pendingJumpVx: number; facing: 1 | -1; attackFacing: 1 | -1; turnStartingFacing?: 1 | -1; grounded: boolean; phase: FighterPhase; phaseTick: number; health: number; blocking: boolean; crouchBlocking: boolean; currentAttack: AttackId | null; reviewAttackProfile?: LamuhReviewAttackProfile; hitstop: number; hitstun: number; hitReactionWeight: HitReactionWeight; blockstun: number; knockdownKind: KnockdownKind; knockdownTicks: number; getupTicks: number; wakeupInvuln: number; inputBuffer: InputFrame[]; deterministicBuffer: DeterministicInputBuffer; hitLedger: Record<string, string[]>; attackConnected: boolean; attackBlocked: boolean; cancelOptions: AttackId[]; airActionsRemaining: number; airDashesRemaining?: number; airRecoveryTicks: number; airRecoveryCount: number; airTechInvuln: number; lastAirTechDirection: AirTechDirection | null; recoveryEvent: FighterRecoveryEvent | null; comboCount: number; comboDamage: number; comboRoute: AttackId[]; damageScaling: number; comboTarget: FighterId | null; comboNeutralTicks: number; juggleSpent: number; peakJuggleSpent: number; tension: number; tensionEarned: number; tensionSpent: number; romanCancelTicks: number; romanCancelCount: number; burst: number; burstTicks: number; burstCount: number; systemInputConsumed: { romanCancel: number; burst: number }; dummyMode?: DummyMode; hitCountTaken: number; throwInstanceCounter: number; throwRotation: number; moveInstanceCounter: number; currentMoveInstance: number; }
export interface CombatEvent { tick: number; outcome: "hit" | "block" | "juggle_rejected"; attacker: FighterId; defender: FighterId; attackId: AttackId; hitOrdinal: number; damage: number; scaling: number; baseHitstun: number; effectiveHitstun: number; hitstunDecay: number; juggleBefore: number; juggleAfter: number; juggleLimit: number; }
export interface CombatSystemEvent { tick: number; system: "roman_cancel" | "burst"; outcome: "activated" | "rejected"; actor: FighterId; target: FighterId; resourceBefore: number; resourceAfter: number; freezeTicks: number; reason?: "insufficient_resource" | "invalid_state"; }
export interface ThrowEvent { tick: number; eventId: string; type: "startup" | "connect" | "whiff" | "release" | "complete"; throwId: ThrowId; attacker: FighterId; defender: FighterId; damage: number; }
export interface ThrowInteractionState { instanceId: number; throwId: ThrowId; attacker: FighterId; defender: FighterId; tick: number; result: "pending" | "connected" | "whiff"; attackerStartX: number; attackerStartY: number; startingFacing: 1 | -1; defenderStartX: number; defenderStartY: number; victimTrackAnchorX: number; victimTrackAnchorY: number; damageApplied: boolean; released: boolean; }
export interface MatchConfig { matchId?: string; p1Kind?: FighterKind; p2Kind?: FighterKind; p1X?: number; p2X?: number; p1LamuhReview?: LamuhReviewAttackProfile; p2LamuhReview?: LamuhReviewAttackProfile; }
export interface MatchState { schemaVersion: "2.0.0-alpha"; matchId: string; matchConfig: Required<Pick<MatchConfig, "p1Kind" | "p2Kind" | "p1X" | "p2X">> & Pick<MatchConfig, "p1LamuhReview" | "p2LamuhReview" | "swahiliAirSpecialsV1">; seed: number; rngState: number; tick: number; stage: { left: number; right: number; groundY: number; ceilingY: number }; fighters: Record<FighterId, FighterState>; inputLog: InputLogFrame[]; checksums: string[]; debugWarnings: string[]; lastCombatEvent: CombatEvent | null; lastSystemEvent: CombatSystemEvent | null; throwInteraction: ThrowInteractionState | null; lastThrowEvent: ThrowEvent | null; presentationEventLedger: string[]; }
export interface TickResult { tick: number; checksum: string; state: MatchState; }

// Versus playtest body envelope (additive, opt-in, default absent).
// A fighter's authored hurtboxes were sized against an older, shorter silhouette; the
// drawn adult bodies are roughly twice as tall as those boxes. When a match opts in, the
// envelope replaces pushbox/hurtbox/projectile-hurtbox geometry for that fighter only, so
// strikes collide against the body that is actually on screen. Absent = unchanged behaviour.
export interface BodyEnvelope { pushbox: Rect; standing: Rect[]; crouching: Rect[]; }
export interface FighterState { bodyEnvelope?: BodyEnvelope; }
export interface MatchConfig { p1BodyEnvelope?: BodyEnvelope; p2BodyEnvelope?: BodyEnvelope; }
