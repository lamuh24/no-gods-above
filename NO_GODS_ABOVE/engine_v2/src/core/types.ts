export const TICKS_PER_SECOND = 60 as const;

export type FighterId = "p1" | "p2";
export type FighterKind = "lamuh_proto" | "training_dummy";
export type FighterPhase = "idle" | "walk_forward" | "walk_backward" | "crouch" | "jump_startup" | "jump" | "landing" | "dash" | "backdash" | "attack" | "block" | "hit_reaction" | "knockdown" | "getup" | "throw_startup" | "throw_active" | "throw_capture" | "throw_release" | "throw_recovery" | "throw_whiff" | "throw_teched" | "throw_victim_captured" | "throw_victim_released";
export type AttackId = "standing_light" | "standing_medium" | "standing_heavy" | "crouching_light" | "crouching_medium" | "crouching_heavy" | "air_light" | "air_medium" | "air_heavy";
export type ThrowId = "forward_throw";
export type ComboMoveId = AttackId | ThrowId;
export type HitLevel = "mid" | "low" | "launcher";
export type KnockdownKind = "none" | "soft" | "hard";
export type DummyMode = "idle" | "stand_block" | "crouch_block" | "block_after_first_hit" | "no_recovery" | "auto_recovery";
export type ThrowOutcome = "whiff" | "captured" | "teched" | "released" | "interrupted";

export interface InputFrame { left?: boolean; right?: boolean; down?: boolean; up?: boolean; light?: boolean; medium?: boolean; heavy?: boolean; special?: boolean; throw?: boolean; block?: boolean; burst?: boolean; pause?: boolean; reset?: boolean; }
export interface InputLogFrame { tick: number; p1?: InputFrame; p2?: InputFrame; }
export interface InputEdges { pressed: InputFrame; released: InputFrame; held: InputFrame; }
export interface InputHistoryEntry { tick: number; held: InputFrame; pressed: InputFrame; released: InputFrame; facing: 1 | -1; forward?: boolean; back?: boolean; }
export interface DeterministicInputBuffer { current: InputFrame; previous: InputFrame; pressed: InputFrame; released: InputFrame; history: InputHistoryEntry[]; max: number; }

export interface Point { x: number; y: number; }
export interface Rect { x: number; y: number; w: number; h: number; }
export interface StrikeHitbox { id: string; start: number; end: number; rect: Rect; damage: number; hitstop: number; hitstun: number; blockstun: number; knockbackX: number; knockbackY: number; maxHits: number; level: HitLevel; knockdown?: KnockdownKind; launches?: boolean; jumpCancelOnHit?: boolean; }
export interface CancelRules { onHit: AttackId[]; onBlock: AttackId[]; }
export interface AttackDefinition { id: AttackId; command: string; startup: number; active: number; recovery: number; hitboxes: StrikeHitbox[]; cancel?: CancelRules; airOnly?: boolean; groundOnly?: boolean; }
export interface ThrowCollisionBox { id: string; rect: Rect; maxTargets: 1; groundedOnly: true; }
export interface ThrowAnchors { grabAnchor: Point; victimAnchor: Point; releaseAnchor: Point; cameraTarget?: Point; }
export interface ThrowDefinition { id: ThrowId; command: string; startup: number; active: number; techWindow: number; impactTick: number; release: number; recovery: number; whiffRecovery: number; techRecovery: number; damage: number; hitstop: number; throwBox: ThrowCollisionBox; anchors: ThrowAnchors; forwardDisplacement: number; releaseVelocityX: number; releaseVelocityY: number; knockdown: "hard"; knockdownTicks: number; techPushback: number; techThrowInvuln: number; releaseThrowInvuln: number; }
export interface MovementTuning { walkForward: number; walkBackward: number; dashSpeed: number; dashDuration: number; backdashSpeed: number; backdashDuration: number; jumpStartup: number; jumpVelocity: number; forwardJumpVelocityX: number; backJumpVelocityX: number; airControl: number; gravity: number; landingRecovery: number; inputBuffer: number; wakeupInvuln: number; comboNeutralTimeout: number; }
export interface FighterDefinition { kind: FighterKind; maxHealth: number; movement: MovementTuning; pushbox: Rect; throwHurtbox: Rect; standingHurtboxes: Rect[]; crouchingHurtboxes: Rect[]; attacks: Record<AttackId, AttackDefinition>; throws: Record<ThrowId, ThrowDefinition>; }

export interface FighterState { id: FighterId; kind: FighterKind; x: number; y: number; vx: number; vy: number; pendingJumpVx: number; facing: 1 | -1; attackFacing: 1 | -1; grounded: boolean; phase: FighterPhase; phaseTick: number; health: number; blocking: boolean; crouchBlocking: boolean; currentAttack: AttackId | null; currentThrow: ThrowId | null; throwPartner: FighterId | null; throwFacing: 1 | -1; throwInvulnTicks: number; lastThrowOutcome: ThrowOutcome | null; hitstop: number; hitstun: number; blockstun: number; knockdownTicks: number; getupTicks: number; wakeupInvuln: number; inputBuffer: InputFrame[]; deterministicBuffer: DeterministicInputBuffer; hitLedger: Record<string, string[]>; attackConnected: boolean; attackBlocked: boolean; cancelOptions: AttackId[]; airActionsRemaining: number; comboCount: number; comboDamage: number; comboRoute: ComboMoveId[]; damageScaling: number; comboTarget: FighterId | null; comboNeutralTicks: number; dummyMode?: DummyMode; hitCountTaken: number; }
export interface MatchState { schemaVersion: "2.0.0-alpha"; seed: number; rngState: number; tick: number; roundActive: boolean; stage: { left: number; right: number; groundY: number; ceilingY: number }; fighters: Record<FighterId, FighterState>; inputLog: InputLogFrame[]; checksums: string[]; debugWarnings: string[]; }
export interface TickResult { tick: number; checksum: string; state: MatchState; }
