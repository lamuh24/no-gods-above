export const TICKS_PER_SECOND = 60 as const;

export type FighterId = "p1" | "p2";
export type FighterKind = "lamuh_proto" | "training_dummy";
export type FighterPhase = "idle" | "walk_forward" | "walk_backward" | "crouch" | "jump_startup" | "jump" | "landing" | "dash" | "backdash" | "attack" | "block" | "hit_reaction" | "knockdown" | "getup";
export type AttackId = "standing_light" | "standing_medium" | "standing_heavy" | "crouching_light" | "crouching_medium" | "crouching_heavy" | "air_light" | "air_medium" | "air_heavy";
export type HitLevel = "mid" | "low" | "launcher";
export type KnockdownKind = "none" | "soft" | "hard";
export type DummyMode = "idle" | "stand_block" | "crouch_block" | "block_after_first_hit" | "no_recovery" | "auto_recovery";

export interface InputFrame { left?: boolean; right?: boolean; down?: boolean; up?: boolean; light?: boolean; medium?: boolean; heavy?: boolean; special?: boolean; throw?: boolean; block?: boolean; burst?: boolean; pause?: boolean; reset?: boolean; }
export interface InputLogFrame { tick: number; p1?: InputFrame; p2?: InputFrame; }
export interface InputEdges { pressed: InputFrame; released: InputFrame; held: InputFrame; }
export interface InputHistoryEntry { tick: number; held: InputFrame; pressed: InputFrame; released: InputFrame; facing: 1 | -1; forward?: boolean; back?: boolean; }
export interface DeterministicInputBuffer { current: InputFrame; previous: InputFrame; pressed: InputFrame; released: InputFrame; history: InputHistoryEntry[]; max: number; }

export interface Rect { x: number; y: number; w: number; h: number; }
export interface StrikeHitbox { id: string; start: number; end: number; rect: Rect; damage: number; hitstop: number; hitstun: number; blockstun: number; knockbackX: number; knockbackY: number; maxHits: number; level: HitLevel; knockdown?: KnockdownKind; launches?: boolean; jumpCancelOnHit?: boolean; }
export interface CancelRules { onHit: AttackId[]; onBlock: AttackId[]; }
export interface AttackDefinition { id: AttackId; command: string; startup: number; active: number; recovery: number; hitboxes: StrikeHitbox[]; cancel?: CancelRules; airOnly?: boolean; groundOnly?: boolean; }
export interface MovementTuning { walkForward: number; walkBackward: number; dashSpeed: number; dashDuration: number; backdashSpeed: number; backdashDuration: number; jumpStartup: number; jumpVelocity: number; forwardJumpVelocityX: number; backJumpVelocityX: number; airControl: number; gravity: number; landingRecovery: number; inputBuffer: number; wakeupInvuln: number; comboNeutralTimeout: number; }
export interface FighterDefinition { kind: FighterKind; maxHealth: number; movement: MovementTuning; pushbox: Rect; standingHurtboxes: Rect[]; crouchingHurtboxes: Rect[]; attacks: Record<AttackId, AttackDefinition>; }

export interface FighterState { id: FighterId; kind: FighterKind; x: number; y: number; vx: number; vy: number; pendingJumpVx: number; facing: 1 | -1; attackFacing: 1 | -1; grounded: boolean; phase: FighterPhase; phaseTick: number; health: number; blocking: boolean; crouchBlocking: boolean; currentAttack: AttackId | null; hitstop: number; hitstun: number; blockstun: number; knockdownTicks: number; getupTicks: number; wakeupInvuln: number; inputBuffer: InputFrame[]; deterministicBuffer: DeterministicInputBuffer; hitLedger: Record<string, string[]>; attackConnected: boolean; attackBlocked: boolean; cancelOptions: AttackId[]; airActionsRemaining: number; comboCount: number; comboDamage: number; comboRoute: AttackId[]; damageScaling: number; comboTarget: FighterId | null; comboNeutralTicks: number; dummyMode?: DummyMode; hitCountTaken: number; }
export interface MatchState { schemaVersion: "2.0.0-alpha"; seed: number; rngState: number; tick: number; stage: { left: number; right: number; groundY: number; ceilingY: number }; fighters: Record<FighterId, FighterState>; inputLog: InputLogFrame[]; checksums: string[]; debugWarnings: string[]; }
export interface TickResult { tick: number; checksum: string; state: MatchState; }
