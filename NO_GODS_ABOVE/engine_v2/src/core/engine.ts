import { checksumState } from "./checksum";
import { normalizeSeed } from "./rng";
import { backHeld, forwardHeld, held, makeInputBuffer, pushInput, recentDoubleTap, wasPressed } from "./input";
import { fighterDefinitions } from "../data/fighters";
import { AttackDefinition, AttackId, FighterId, FighterKind, FighterPhase, FighterState, InputFrame, MatchState, Rect, StrikeHitbox, TickResult } from "./types";

const GETUP_TICKS = 18;
const EPSILON = 0.0001;

interface HitCandidate {
  attacker: FighterState;
  defender: FighterState;
  attack: AttackDefinition;
  hitbox: StrikeHitbox;
  ledgerKey: string;
  blocked: boolean;
}

function blankInput(): InputFrame { return {}; }
function clone<T>(value: T): T { return JSON.parse(JSON.stringify(value)); }
function def(kind: FighterKind) { return fighterDefinitions[kind]; }
function total(a: AttackDefinition) { return a.startup + a.active + a.recovery; }
function signed(n: number): 1 | -1 { return n >= 0 ? 1 : -1; }
function inputMax(kind: FighterKind) { return def(kind).movement.inputBuffer; }
function overlap(a: Rect, b: Rect) { return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y; }
function rectWorld(f: FighterState, r: Rect, facing = f.phase === "attack" ? f.attackFacing : f.facing): Rect { return { x: f.x + r.x * facing - (facing < 0 ? r.w : 0), y: f.y + r.y, w: r.w, h: r.h }; }
function enterPhase(f: FighterState, phase: FighterPhase) { if (f.phase !== phase) { f.phase = phase; f.phaseTick = 0; } }
function neutralPhase(f: FighterState) { return f.grounded ? "idle" : "jump"; }
function canUpdateFacing(f: FighterState) { return f.grounded && ["idle", "walk_forward", "walk_backward", "crouch", "block"].includes(f.phase); }
function recordWarning(state: MatchState, warning: string) { if (!state.debugWarnings.includes(warning)) state.debugWarnings.push(warning); }

export function makeFighter(id: FighterId, kind: FighterKind, x: number, facing: 1 | -1): FighterState {
  return {
    id, kind, x, y: 0, vx: 0, vy: 0, pendingJumpVx: 0, facing, attackFacing: facing, grounded: true,
    phase: "idle", phaseTick: 0, health: def(kind).maxHealth, blocking: false, crouchBlocking: false,
    currentAttack: null, hitstop: 0, hitstun: 0, blockstun: 0, knockdownTicks: 0, getupTicks: 0,
    wakeupInvuln: 0, inputBuffer: [], deterministicBuffer: makeInputBuffer(inputMax(kind)), hitLedger: {},
    attackConnected: false, attackBlocked: false, cancelOptions: [], airActionsRemaining: 0, comboCount: 0, comboDamage: 0, comboRoute: [],
    damageScaling: 1, comboTarget: null, comboNeutralTicks: 0, hitCountTaken: 0,
    ...(kind === "training_dummy" ? { dummyMode: "auto_recovery" as const } : {})
  };
}

export function createMatch(seed = 1): MatchState {
  return {
    schemaVersion: "2.0.0-alpha", seed: normalizeSeed(seed), rngState: normalizeSeed(seed), tick: 0,
    stage: { left: -420, right: 420, groundY: 0, ceilingY: -180 },
    fighters: { p1: makeFighter("p1", "lamuh_proto", -76, 1), p2: makeFighter("p2", "training_dummy", 76, -1) },
    inputLog: [], checksums: [], debugWarnings: []
  };
}

export function saveSnapshot(state: MatchState): MatchState { return clone(state); }
export function restoreSnapshot(snapshot: MatchState): MatchState { return clone(snapshot); }

function clearAttack(f: FighterState) { f.currentAttack = null; f.hitLedger = {}; f.cancelOptions = []; f.attackConnected = false; f.attackBlocked = false; }
function canStartAttack(f: FighterState, attackId: AttackId) { const attack = def(f.kind).attacks[attackId]; return !(attack.airOnly && (f.grounded || f.airActionsRemaining <= 0)) && !(attack.groundOnly && !f.grounded); }
function beginAttack(f: FighterState, attackId: AttackId) {
  const attack = def(f.kind).attacks[attackId];
  if (!canStartAttack(f, attackId)) return false;
  const enteringAttack = f.phase !== "attack";
  f.phase = "attack";
  if (enteringAttack || attack.airOnly) f.phaseTick = 0;
  f.currentAttack = attackId; f.attackFacing = f.facing;
  if (attack.airOnly) f.airActionsRemaining--; else f.vx = 0;
  f.hitLedger = {}; f.attackConnected = false; f.attackBlocked = false; f.cancelOptions = [];
  return true;
}
function attackPhase(f: FighterState) { if (!f.currentAttack) return "none"; const a = def(f.kind).attacks[f.currentAttack]; if (f.phaseTick < a.startup) return "startup"; if (f.phaseTick < a.startup + a.active) return "active"; return "recovery"; }
export function currentAttackPhase(f: FighterState) { return attackPhase(f); }

function resetCombo(f: FighterState) { f.comboCount = 0; f.comboDamage = 0; f.comboRoute = []; f.damageScaling = 1; f.comboTarget = null; f.comboNeutralTicks = 0; }
function requestAttack(f: FighterState): AttackId | null {
  const b = f.deterministicBuffer;
  if (!f.grounded && wasPressed(b, "light", 6)) return "air_light";
  if (!f.grounded && wasPressed(b, "medium", 6)) return "air_medium";
  if (!f.grounded && wasPressed(b, "heavy", 6)) return "air_heavy";
  if (held(b, "down") && wasPressed(b, "light", 6)) return "crouching_light";
  if (held(b, "down") && wasPressed(b, "medium", 6)) return "crouching_medium";
  if (held(b, "down") && wasPressed(b, "heavy", 6)) return "crouching_heavy";
  if (wasPressed(b, "light", 6)) return "standing_light";
  if (wasPressed(b, "medium", 6)) return "standing_medium";
  if (wasPressed(b, "heavy", 6)) return "standing_heavy";
  return null;
}
function canCancel(f: FighterState, next: AttackId) { return f.cancelOptions.includes(next); }
function hasJumpCancelOnHit(f: FighterState) { return !!f.currentAttack && f.attackConnected && def(f.kind).attacks[f.currentAttack].hitboxes.some((hitbox) => hitbox.jumpCancelOnHit); }
function beginJump(f: FighterState) {
  const m = def(f.kind).movement;
  f.pendingJumpVx = forwardHeld(f.deterministicBuffer) ? f.facing * m.forwardJumpVelocityX : backHeld(f.deterministicBuffer) ? -f.facing * Math.abs(m.backJumpVelocityX) : 0;
  f.vx = 0; clearAttack(f); enterPhase(f, "jump_startup");
}

function collectInput(f: FighterState, input: InputFrame, tickNo: number) {
  // Input edges/history continue during hitstop. State consumption pauses, so presses remain bufferable within authored leniency.
  f.inputBuffer.push(clone(input));
  if (f.inputBuffer.length > inputMax(f.kind)) f.inputBuffer.shift();
  pushInput(f.deterministicBuffer, input, tickNo, f.facing);
  if (input.reset && f.kind === "training_dummy") Object.assign(f, makeFighter(f.id, f.kind, f.id === "p1" ? -76 : 76, f.id === "p1" ? 1 : -1));
}

function applyDummyMode(f: FighterState) {
  if (f.kind !== "training_dummy") return;
  if (f.dummyMode === "stand_block") { f.blocking = true; f.crouchBlocking = false; }
  if (f.dummyMode === "crouch_block") { f.blocking = true; f.crouchBlocking = true; }
  if (f.dummyMode === "block_after_first_hit" && f.hitCountTaken > 0) { f.blocking = true; f.crouchBlocking = false; }
}

function processInput(f: FighterState, opponent: FighterState) {
  if (f.hitstop > 0) return;
  if (canUpdateFacing(f)) f.facing = signed(opponent.x - f.x);

  if (f.hitstun > 0) { f.blocking = false; f.crouchBlocking = false; return; }
  const mayBlock = f.grounded && f.phase !== "attack" && f.knockdownTicks === 0 && f.getupTicks === 0;
  f.blocking = mayBlock && (held(f.deterministicBuffer, "block") || backHeld(f.deterministicBuffer));
  f.crouchBlocking = f.blocking && held(f.deterministicBuffer, "down");
  applyDummyMode(f);

  if (f.blockstun > 0 || f.phase === "knockdown" || f.phase === "getup") return;
  if (["jump_startup", "dash", "backdash", "landing"].includes(f.phase)) return;

  const next = requestAttack(f);
  if (f.phase === "attack") {
    if (f.grounded && hasJumpCancelOnHit(f) && wasPressed(f.deterministicBuffer, "up", 6)) { beginJump(f); return; }
    if (next && canCancel(f, next)) beginAttack(f, next);
    return;
  }
  if (f.phase === "jump") {
    if (next && beginAttack(f, next)) return;
    const dir = held(f.deterministicBuffer, "right") ? 1 : held(f.deterministicBuffer, "left") ? -1 : 0;
    if (dir) f.vx += dir * def(f.kind).movement.airControl * 0.1;
    return;
  }
  if (next) { beginAttack(f, next); return; }

  const m = def(f.kind).movement;
  if (f.grounded && wasPressed(f.deterministicBuffer, "up", 4)) {
    beginJump(f);
    return;
  }
  if (f.grounded && recentDoubleTap(f.deterministicBuffer, "forward")) { f.vx = f.facing * m.dashSpeed; enterPhase(f, "dash"); return; }
  if (f.grounded && recentDoubleTap(f.deterministicBuffer, "back")) { f.vx = -f.facing * Math.abs(m.backdashSpeed); enterPhase(f, "backdash"); return; }
  if (held(f.deterministicBuffer, "down") && f.grounded) { f.vx = 0; enterPhase(f, f.blocking ? "block" : "crouch"); return; }

  const dir = held(f.deterministicBuffer, "right") ? 1 : held(f.deterministicBuffer, "left") ? -1 : 0;
  if (dir && f.grounded && f.kind !== "training_dummy") { const forward = dir === f.facing; f.vx = dir * (forward ? m.walkForward : m.walkBackward); enterPhase(f, forward ? "walk_forward" : "walk_backward"); }
  else { f.vx = 0; enterPhase(f, f.blocking ? "block" : "idle"); }
}

function progress(f: FighterState) {
  const m = def(f.kind).movement;
  if (f.hitstop > 0) { f.hitstop--; return; }
  if (f.wakeupInvuln > 0) f.wakeupInvuln--;
  if (f.knockdownTicks > 0) {
    if (!f.grounded) return;
    f.knockdownTicks--;
    enterPhase(f, "knockdown");
    if (f.knockdownTicks === 0) { enterPhase(f, "getup"); f.getupTicks = GETUP_TICKS; f.wakeupInvuln = m.wakeupInvuln; }
    return;
  }
  if (f.getupTicks > 0) { f.getupTicks--; enterPhase(f, "getup"); if (f.getupTicks === 0) enterPhase(f, "idle"); return; }
  if (f.hitstun > 0) { f.hitstun--; enterPhase(f, "hit_reaction"); if (f.hitstun === 0) enterPhase(f, neutralPhase(f)); return; }
  if (f.blockstun > 0) { f.blockstun--; enterPhase(f, "block"); if (f.blockstun === 0) enterPhase(f, "idle"); return; }
  if (f.phase === "jump_startup") { f.phaseTick++; if (f.phaseTick >= m.jumpStartup) { f.grounded = false; f.airActionsRemaining = 3; f.vx = f.pendingJumpVx; f.pendingJumpVx = 0; f.vy = m.jumpVelocity; enterPhase(f, "jump"); } return; }
  if (f.phase === "landing") { f.phaseTick++; if (f.phaseTick >= m.landingRecovery) enterPhase(f, "idle"); return; }
  if (f.phase === "dash" || f.phase === "backdash") { f.phaseTick++; const duration = f.phase === "dash" ? m.dashDuration : m.backdashDuration; if (f.phaseTick >= duration) { f.vx = 0; enterPhase(f, "idle"); } return; }
  if (f.phase === "attack" && f.currentAttack) { const a = def(f.kind).attacks[f.currentAttack]; f.phaseTick++; if (f.phaseTick >= total(a)) { clearAttack(f); enterPhase(f, neutralPhase(f)); } return; }
  f.phaseTick++;
}

function integrate(f: FighterState, state: MatchState, frozenAtStart: boolean) {
  if (frozenAtStart) return;
  const { stage } = state;
  if (f.grounded) { f.y = stage.groundY; f.vy = 0; f.x += f.vx; }
  else {
    f.vy += def(f.kind).movement.gravity;
    f.x += f.vx;
    f.y += f.vy;
    if (f.y < stage.ceilingY) { recordWarning(state, `${f.id}: vertical combat bound clamped`); f.y = stage.ceilingY; if (f.vy < 0) f.vy = 0; }
    if (f.y >= stage.groundY) {
      f.y = stage.groundY; f.vy = 0; f.grounded = true;
      if (f.currentAttack && def(f.kind).attacks[f.currentAttack].airOnly) clearAttack(f);
      f.airActionsRemaining = 0;
      if (f.knockdownTicks > 0 || f.phase === "knockdown") enterPhase(f, "knockdown");
      else enterPhase(f, "landing");
    }
  }
  if (f.x < stage.left || f.x > stage.right) recordWarning(state, `${f.id}: horizontal stage bound clamped`);
  f.x = Math.max(stage.left, Math.min(stage.right, f.x));
}

function pushbox(f: FighterState) { return rectWorld(f, def(f.kind).pushbox); }
function hurtboxes(f: FighterState) { return (f.phase === "crouch" || f.crouchBlocking ? def(f.kind).crouchingHurtboxes : def(f.kind).standingHurtboxes).map((r) => rectWorld(f, r)); }
function resolvePush(a: FighterState, b: FighterState, state: MatchState, frozen: Record<FighterId, boolean>) {
  if (frozen[a.id] || frozen[b.id]) return;
  const pa = pushbox(a), pb = pushbox(b);
  if (!overlap(pa, pb)) return;
  const depth = Math.min(pa.x + pa.w - pb.x, pb.x + pb.w - pa.x);
  const split = depth / 2;
  if (a.x <= b.x) { a.x -= split; b.x += split; } else { a.x += split; b.x -= split; }
  a.x = Math.max(state.stage.left, Math.min(state.stage.right, a.x));
  b.x = Math.max(state.stage.left, Math.min(state.stage.right, b.x));
}

function collectHitCandidate(attacker: FighterState, defender: FighterState, frozenAtStart: boolean): HitCandidate | null {
  if (frozenAtStart || attacker.phase !== "attack" || !attacker.currentAttack || defender.wakeupInvuln > 0 || defender.phase === "getup") return null;
  const attack = def(attacker.kind).attacks[attacker.currentAttack];
  for (const hitbox of attack.hitboxes) {
    if (attacker.phaseTick < hitbox.start || attacker.phaseTick > hitbox.end) continue;
    const ledgerKey = `${attacker.currentAttack}:${hitbox.id}`;
    const ids = attacker.hitLedger[ledgerKey] || [];
    if (ids.includes(defender.id) || ids.length >= hitbox.maxHits) continue;
    if (!hurtboxes(defender).some((hurt) => overlap(rectWorld(attacker, hitbox.rect, attacker.attackFacing), hurt))) continue;
    const blocked = defender.hitstun === 0 && defender.blocking && (hitbox.level !== "low" || defender.crouchBlocking);
    return { attacker, defender, attack, hitbox, ledgerKey, blocked };
  }
  return null;
}

function applyHit(candidate: HitCandidate, state: MatchState) {
  const { attacker, defender, attack, hitbox, ledgerKey, blocked } = candidate;
  const ids = attacker.hitLedger[ledgerKey] || [];
  ids.push(defender.id);
  attacker.hitLedger[ledgerKey] = ids;
  attacker.hitstop = Math.max(attacker.hitstop, hitbox.hitstop);
  defender.hitstop = Math.max(defender.hitstop, hitbox.hitstop);

  if (blocked) {
    defender.hitstun = 0;
    defender.blockstun = hitbox.blockstun;
    defender.vx = attacker.attackFacing * hitbox.knockbackX * 0.25;
    enterPhase(defender, "block");
    attacker.attackBlocked = true;
    attacker.cancelOptions = [...(attack.cancel?.onBlock || [])];
    return;
  }

  if (attacker.comboCount === 0 || attacker.comboTarget !== defender.id) { resetCombo(attacker); attacker.comboTarget = defender.id; }
  const scaledDamage = Math.round(hitbox.damage * attacker.damageScaling);
  defender.health = Math.max(0, defender.health - scaledDamage);
  defender.hitCountTaken++;
  defender.blockstun = 0;
  defender.blocking = false;
  defender.crouchBlocking = false;
  defender.vx = attacker.attackFacing * hitbox.knockbackX;
  if (hitbox.launches) {
    defender.grounded = false;
    defender.vy = Math.min(-EPSILON, hitbox.knockbackY);
    defender.hitstun = hitbox.hitstun;
    enterPhase(defender, "hit_reaction");
  } else if (hitbox.knockdown && hitbox.knockdown !== "none") {
    defender.vy = defender.grounded ? 0 : hitbox.knockbackY;
    defender.hitstun = 0;
    defender.knockdownTicks = hitbox.knockdown === "hard" ? 42 : 26;
    enterPhase(defender, "knockdown");
  } else {
    if (defender.grounded) defender.vy = 0;
    else defender.vy = hitbox.knockbackY;
    defender.hitstun = hitbox.hitstun;
    enterPhase(defender, "hit_reaction");
  }

  attacker.comboCount++;
  attacker.comboDamage += scaledDamage;
  attacker.comboRoute.push(attack.id);
  attacker.damageScaling = Math.max(0.5, attacker.damageScaling - 0.08);
  attacker.comboNeutralTicks = 0;
  attacker.attackConnected = true;
  attacker.cancelOptions = [...(attack.cancel?.onHit || [])];
  if (defender.y < state.stage.ceilingY) recordWarning(state, `${defender.id}: hit resolved beyond vertical combat bound`);
}

function updateComboLifecycle(attacker: FighterState, defender: FighterState) {
  if (attacker.comboCount === 0) return;
  if (attacker.hitstun > 0 || attacker.phase === "knockdown" || attacker.phase === "getup") { resetCombo(attacker); return; }
  const connected = defender.hitstun > 0 || !defender.grounded || defender.phase === "knockdown";
  if (connected) { attacker.comboNeutralTicks = 0; return; }
  attacker.comboNeutralTicks++;
  if (attacker.comboNeutralTicks >= def(attacker.kind).movement.comboNeutralTimeout) resetCombo(attacker);
}

function assertValidState(f: FighterState, state: MatchState) {
  if (![f.x, f.y, f.vx, f.vy, f.phaseTick].every(Number.isFinite)) throw new Error(`${f.id} has non-finite simulation state`);
  if (f.grounded && Math.abs(f.y - state.stage.groundY) > EPSILON) throw new Error(`${f.id} grounded outside groundY`);
  if (f.hitstun > 0 && f.blockstun > 0) throw new Error(`${f.id} cannot have hitstun and blockstun simultaneously`);
  if (f.phase === "attack" && !f.currentAttack) throw new Error(`${f.id} attack phase requires currentAttack`);
  if (f.y < state.stage.ceilingY - EPSILON || f.y > state.stage.groundY + EPSILON) throw new Error(`${f.id} outside legal vertical stage bounds`);
}

export function tickWithFighterOrder(state: MatchState, inputs: { p1?: InputFrame; p2?: InputFrame } = {}, fighterOrder: readonly FighterId[] = ["p1", "p2"]): TickResult {
  if (fighterOrder.length !== 2 || new Set(fighterOrder).size !== 2 || !fighterOrder.includes("p1") || !fighterOrder.includes("p2")) throw new Error("fighterOrder must contain p1 and p2 exactly once");
  const p1Input = inputs.p1 || blankInput(), p2Input = inputs.p2 || blankInput();
  state.inputLog.push({ tick: state.tick, p1: clone(p1Input), p2: clone(p2Input) });
  const { p1, p2 } = state.fighters;
  const inputsById = { p1: p1Input, p2: p2Input };
  for (const id of fighterOrder) collectInput(state.fighters[id], inputsById[id], state.tick);

  const frozen: Record<FighterId, boolean> = { p1: p1.hitstop > 0, p2: p2.hitstop > 0 };
  for (const id of fighterOrder) processInput(state.fighters[id], state.fighters[id === "p1" ? "p2" : "p1"]);
  for (const id of fighterOrder) progress(state.fighters[id]);
  for (const id of fighterOrder) integrate(state.fighters[id], state, frozen[id]);
  resolvePush(p1, p2, state, frozen);

  // Candidates are collected from one shared snapshot. Applying one result cannot suppress a valid same-tick trade.
  const candidates = fighterOrder.map((id) => collectHitCandidate(state.fighters[id], state.fighters[id === "p1" ? "p2" : "p1"], frozen[id])).filter((candidate): candidate is HitCandidate => !!candidate);
  for (const candidate of candidates) applyHit(candidate, state);
  for (const candidate of candidates) if (!candidate.blocked) clearAttack(candidate.defender);

  updateComboLifecycle(p1, p2);
  updateComboLifecycle(p2, p1);
  assertValidState(p1, state);
  assertValidState(p2, state);
  const checksum = checksumState(state);
  state.checksums.push(checksum);
  state.tick++;
  return { tick: state.tick, checksum, state };
}

export function tick(state: MatchState, inputs: { p1?: InputFrame; p2?: InputFrame } = {}): TickResult { return tickWithFighterOrder(state, inputs); }

export function runTicks(state: MatchState, count: number, inputAt: (tick: number) => { p1?: InputFrame; p2?: InputFrame } = () => ({})): MatchState { for (let i = 0; i < count; i++) tick(state, inputAt(state.tick)); return state; }
