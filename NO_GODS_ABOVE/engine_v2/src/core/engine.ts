import { checksumState } from "./checksum";
import { normalizeSeed } from "./rng";
import { backHeld, forwardHeld, held, makeInputBuffer, pushInput, recentDoubleTap, wasPressed, wasPressedWithHeld } from "./input";
import { fighterDefinitions } from "../data/fighters";
import { isSwahiliAirSpecialId, SWAHILI_AIR_SPECIAL_IDS, SWAHILI_AIR_SPECIALS_V1 } from "../data/swahiliAirSpecials";
import { AirTechDirection, AttackDefinition, AttackId, AuthoredHopTrack, BodyEnvelope, FighterId, FighterKind, FighterPhase, FighterState, HitReactionWeight, InputFrame, LamuhReviewAttackProfile, KnockdownKind, MatchConfig, MatchState, ProjectileEvent, ProjectileState, Rect, StrikeHitbox, ThrowDefinition, ThrowId, ThrowTrackPoint, TickResult } from "./types";

const EPSILON = 0.0001;
const LAMUH_CROUCH_RELEASE_PRESENTATION_TICKS = 8;
export const LAMUH_TURN_PRESENTATION_TICKS = 12;

interface HitCandidate {
  attacker: FighterState;
  defender: FighterState;
  attack: AttackDefinition;
  hitbox: StrikeHitbox;
  ledgerKey: string;
  blocked: boolean;
  projectile?: ProjectileState;
}

type SystemInput = "romanCancel" | "burst";
interface SystemAttempt { system: "roman_cancel" | "burst"; actor: FighterState; target: FighterState; input: SystemInput; inputTick: number; }

function blankInput(): InputFrame { return {}; }
function clone<T>(value: T): T { return JSON.parse(JSON.stringify(value)); }
function def(kind: FighterKind) { return fighterDefinitions[kind]; }
const lamuhStandingHeavyReviewTiming = {
  A: { startup: 9, active: 5, recovery: 18 },
  B: { startup: 11, active: 5, recovery: 21 },
  C: { startup: 13, active: 6, recovery: 23 }
} as const;
export function resolveAttackDefinition(fighter: FighterState, attackId: AttackId = fighter.currentAttack as AttackId): AttackDefinition {
  if (fighter.kind === "lamuh_proto" && fighter.swahiliAirSpecialsV1) {
    if (isSwahiliAirSpecialId(attackId)) return SWAHILI_AIR_SPECIALS_V1[attackId];
    if (["air_light", "air_medium", "air_heavy"].includes(attackId)) {
      const normal = def(fighter.kind).attacks[attackId];
      return { ...normal, cancel: {
        onHit: [...(normal.cancel?.onHit ?? []), ...SWAHILI_AIR_SPECIAL_IDS],
        onBlock: [...(normal.cancel?.onBlock ?? []), ...SWAHILI_AIR_SPECIAL_IDS]
      } };
    }
  }
  const base = def(fighter.kind).attacks[attackId];
  if (fighter.ascendHeavyResponse && fighter.currentAttack === attackId && base.hitConfirm) return base.hitConfirm.response;
  if (fighter.divineCounterResponse && fighter.currentAttack === attackId && base.strikeCounter) return base.strikeCounter.response;
  const profile = fighter.reviewAttackProfile;
  if (!profile || fighter.kind !== "lamuh_legacy_v2" || attackId !== "standing_heavy") return base;
  const timing = lamuhStandingHeavyReviewTiming[profile.timing];
  return {
    ...base,
    ...timing,
    hitboxes: base.hitboxes.map((hitbox) => ({
      ...hitbox,
      start: timing.startup,
      end: timing.startup + timing.active - 1,
      hitstop: profile.hitstop,
      blockHitstop: profile.hitstop
    }))
  };
}
function total(a: AttackDefinition) { return a.startup + a.active + a.recovery; }
export function currentAscendHeavyChain(fighter: FighterState) {
  if (fighter.phase !== "attack" || fighter.currentAttack !== "legacy_ascend_step_heavy") return null;
  const t = fighter.phaseTick;
  return { stage: !fighter.ascendHeavyResponse ? "opener" : t < 10 ? "confirm_hold" : t <= 15 ? "vanish" : t < 22 ? "kick_load" : t <= 24 ? "kick" : t < 36 ? "ball_charge" : "ball_recovery",
    responseTick: fighter.ascendHeavyResponse ? t : null, trigger: fighter.ascendHeavyResponse ?? null };
}
// A paused reaction belongs to a live confirmed move instance, never to a victim
// timer or renderer. Interruptions immediately remove the hold without relocation.
function heldByAscendHeavy(target: FighterState, state: MatchState): boolean {
  const owner = state.fighters[target.id === "p1" ? "p2" : "p1"], chain = owner.ascendHeavyResponse;
  return !!chain && owner.phase === "attack" && owner.currentAttack === "legacy_ascend_step_heavy"
    && owner.currentMoveInstance === chain.responseMoveInstance && chain.target === target.id
    && owner.hitstun === 0 && owner.blockstun === 0 && target.phase === "hit_reaction" && target.hitstun > 0
    && owner.phaseTick <= (def(owner.kind).attacks.legacy_ascend_step_heavy.hitConfirm?.holdThrough ?? -1);
}
function signed(n: number): 1 | -1 { return n >= 0 ? 1 : -1; }
function inputMax(kind: FighterKind) { return def(kind).movement.inputBuffer; }
function overlap(a: Rect, b: Rect) { return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y; }
function rectWorld(f: FighterState, r: Rect, facing = f.phase === "attack" ? f.attackFacing : f.facing): Rect { return { x: f.x + r.x * facing - (facing < 0 ? r.w : 0), y: f.y + r.y, w: r.w, h: r.h }; }
function enterPhase(f: FighterState, phase: FighterPhase) { if (f.phase !== phase) { if (f.phase === "turn") delete f.turnStartingFacing; f.phase = phase; f.phaseTick = 0; } }
function restartHitReaction(f: FighterState, weight: HitReactionWeight) { f.hitReactionWeight = weight; f.phase = "hit_reaction"; f.phaseTick = 0; }
function neutralPhase(f: FighterState) { return f.grounded ? "idle" : "jump"; }
function canUpdateFacing(f: FighterState) { return f.grounded && ["idle", "walk_forward", "walk_backward", "turn", "crouch", "crouch_release", "block"].includes(f.phase); }
function recordWarning(state: MatchState, warning: string) { if (!state.debugWarnings.includes(warning)) state.debugWarnings.push(warning); }

export function makeFighter(id: FighterId, kind: FighterKind, x: number, facing: 1 | -1, reviewAttackProfile?: LamuhReviewAttackProfile, swahiliAirSpecialsV1 = false, bodyEnvelope?: BodyEnvelope): FighterState {
  return {
    id, kind, victimClass: def(kind).victimClass, x, y: 0, vx: 0, vy: 0, pendingJumpVx: 0, facing, attackFacing: facing, grounded: true,
    phase: "idle", phaseTick: 0, health: def(kind).maxHealth, blocking: false, crouchBlocking: false,
    currentAttack: null, ...(reviewAttackProfile ? { reviewAttackProfile } : {}), hitstop: 0, hitstun: 0, hitReactionWeight: "light", blockstun: 0, knockdownKind: "none", knockdownTicks: 0, getupTicks: 0,
    wakeupInvuln: 0, inputBuffer: [], deterministicBuffer: makeInputBuffer(inputMax(kind)), hitLedger: {},
    attackConnected: false, attackBlocked: false, cancelOptions: [], airActionsRemaining: 0, airRecoveryTicks: 0, airRecoveryCount: 0,
    airTechInvuln: 0, lastAirTechDirection: null, recoveryEvent: null,
    comboCount: 0, comboDamage: 0, comboRoute: [], damageScaling: 1, comboTarget: null, comboNeutralTicks: 0,
    juggleSpent: 0, peakJuggleSpent: 0,
    tension: 0, tensionEarned: 0, tensionSpent: 0, romanCancelTicks: 0, romanCancelCount: 0,
    burst: def(kind).combat.maxBurst, burstTicks: 0, burstCount: 0, systemInputConsumed: { romanCancel: -1, burst: -1 },
    hitCountTaken: 0, throwInstanceCounter: 0, throwRotation: 0, moveInstanceCounter: 0, currentMoveInstance: 0,
    ...(def(kind).movement.airDashCount > 0 ? { airDashesRemaining: 0 } : {}),
    ...(kind === "lamuh_proto" && swahiliAirSpecialsV1 ? { swahiliAirSpecialsV1: true as const } : {}),
    ...(bodyEnvelope ? { bodyEnvelope: clone(bodyEnvelope) } : {}),
    ...(kind === "training_dummy" ? { dummyMode: "auto_recovery" as const } : {})
  };
}

export function createMatch(seed = 1, config: MatchConfig = {}): MatchState {
  const p1Kind = config.p1Kind ?? "lamuh_proto", p2Kind = config.p2Kind ?? "training_dummy";
  const p1X = config.p1X ?? -76, p2X = config.p2X ?? 76;
  const normalizedSeed = normalizeSeed(seed);
  return {
    schemaVersion: "2.0.0-alpha", matchId: config.matchId ?? `local-${normalizedSeed}`,
    matchConfig: { p1Kind, p2Kind, p1X, p2X, ...(config.p1LamuhReview ? { p1LamuhReview: clone(config.p1LamuhReview) } : {}), ...(config.p2LamuhReview ? { p2LamuhReview: clone(config.p2LamuhReview) } : {}), ...(config.swahiliAirSpecialsV1 ? { swahiliAirSpecialsV1: true } : {}) }, seed: normalizedSeed, rngState: normalizedSeed, tick: 0,
    stage: { left: -420, right: 420, groundY: 0, ceilingY: -180 },
    fighters: { p1: makeFighter("p1", p1Kind, p1X, 1, config.p1LamuhReview, config.swahiliAirSpecialsV1, config.p1BodyEnvelope), p2: makeFighter("p2", p2Kind, p2X, -1, config.p2LamuhReview, config.swahiliAirSpecialsV1, config.p2BodyEnvelope) },
    inputLog: [], checksums: [], debugWarnings: [], lastCombatEvent: null, lastSystemEvent: null,
    throwInteraction: null, lastThrowEvent: null, presentationEventLedger: []
  };
}

export function saveSnapshot(state: MatchState): MatchState { return clone(state); }
export function restoreSnapshot(snapshot: MatchState): MatchState { return clone(snapshot); }

function clearAttack(f: FighterState) { f.currentAttack = null; f.currentMoveInstance = 0; f.hitLedger = {}; f.cancelOptions = []; f.attackConnected = false; f.attackBlocked = false; delete f.airDiveGatherStartTick; delete f.divineCounterResponse; delete f.ascendHeavyResponse; }
export function currentDivineCounter(f: FighterState) {
  if (f.phase !== "attack" || f.currentAttack !== "legacy_divine_vanish_heavy") return null;
  if (f.divineCounterResponse) {
    const tick = f.phaseTick;
    return { stage: tick <= 4 ? "vanish" : tick < 12 ? "kick_load" : tick <= 14 ? "kick" : tick < 19 ? "kick_retract" : tick < (def(f.kind).attacks.legacy_divine_vanish_heavy.strikeCounter!.response.projectile?.releaseTick ?? 25) ? "ball_charge" : "recovery", responseTick: tick, stanceTick: null, trigger: f.divineCounterResponse };
  }
  const counterWindow = def(f.kind).attacks.legacy_divine_vanish_heavy.strikeCounter!;
  return { stage: f.phaseTick < counterWindow.start ? "startup" : f.phaseTick <= counterWindow.end ? "counter_window" : "whiff_recovery", responseTick: null, stanceTick: f.phaseTick, trigger: null };
}
function airActionCost(attack: AttackDefinition) { return attack.airOnly ? attack.airActionCost ?? 1 : 0; }
function canStartAttack(f: FighterState, attackId: AttackId, state: MatchState) {
  // The ultimate still cannot interrupt an arbitrary move; it may only be taken as an
  // authored cancel from a move that lists it, which is how ASW-style super cancels work.
  if (attackId === "legacy_crown_of_no_gods" && (f.kind !== "lamuh_legacy_v2" || f.tension < def(f.kind).combat.maxTension
    || !f.grounded || (f.phase === "attack" && !f.cancelOptions.includes("legacy_crown_of_no_gods"))
    || state.fighters[f.id === "p1" ? "p2" : "p1"].victimClass !== "standard_humanoid")) return false;
  if (isSwahiliAirSpecialId(attackId) && (f.kind !== "lamuh_proto" || !f.swahiliAirSpecialsV1)) return false;
  const attack = resolveAttackDefinition(f, attackId);
  if (attack.authoredDive) {
    const height = state.stage.groundY - f.y, dive = attack.authoredDive;
    if (f.airDiveUsed || height < dive.minimumHeight || height > dive.maximumHeight) return false;
  }
  return !(attack.airOnly && (f.grounded || f.airActionsRemaining < airActionCost(attack)))
    && !(attack.groundOnly && !f.grounded)
    && !(attack.cancelOnly && f.phase !== "attack");
}
function beginAttack(f: FighterState, attackId: AttackId, state: MatchState) {
  const attack = resolveAttackDefinition(f, attackId);
  if (!canStartAttack(f, attackId, state)) return false;
  if (attackId === "legacy_crown_of_no_gods") { const cost = def(f.kind).combat.maxTension; f.tension -= cost; f.tensionSpent += cost; }
  const enteringAttack = f.phase !== "attack";
  if (f.phase === "turn") delete f.turnStartingFacing;
  f.phase = "attack";
  // Playable Swahili and Lamuh timelines begin at zero for every new move, including
  // grounded cancels. Carrying the outgoing clock skips the next move's anticipation.
  if (enteringAttack || attack.airOnly || f.kind === "lamuh_legacy_v2" || f.kind === "lamuh_proto") f.phaseTick = 0;
  f.currentAttack = attackId; f.attackFacing = f.facing; f.moveInstanceCounter++; f.currentMoveInstance = f.moveInstanceCounter;
  if (f.kind === "lamuh_legacy_v2" && attackId.startsWith("legacy_divine_vanish_")) {
    // Back selected guard earlier in this input tick. The committed retreat must
    // already be vulnerable when same-tick enemy contacts are resolved.
    f.blocking = false; f.crouchBlocking = false;
  }
  delete f.airDiveGatherStartTick;
  if (attack.airOnly) f.airActionsRemaining -= airActionCost(attack); else f.vx = 0;
  if (attack.authoredDive) {
    f.airDiveUsed = true;
    if (f.airDashesRemaining !== undefined) f.airDashesRemaining = 0;
    // A committed attack never inherits the temporary invulnerability of an air tech.
    f.airTechInvuln = 0;
  }
  f.hitLedger = {}; f.attackConnected = false; f.attackBlocked = false; f.cancelOptions = [];
  return true;
}
function attackPhase(f: FighterState) { if (!f.currentAttack) return "none"; if (f.phase === "dive_landing" || f.airDiveGatherStartTick !== undefined) return "recovery"; const a = resolveAttackDefinition(f); if (f.phaseTick < a.startup) return "startup"; if (f.phaseTick < a.startup + a.active) return "active"; return "recovery"; }
export function currentAttackPhase(f: FighterState) { return attackPhase(f); }
export function currentAuthoredDive(f: FighterState, state: MatchState) {
  const attack = f.currentAttack ? resolveAttackDefinition(f) : undefined, track = attack?.authoredDive;
  if (!attack || !track || (f.phase !== "attack" && f.phase !== "dive_landing")) return null;
  const stage = f.phase === "dive_landing" ? "landing" : f.airDiveGatherStartTick !== undefined ? "gather" : f.phaseTick < attack.startup ? "windup" : f.phaseTick < attack.startup + attack.active ? "strike" : "gather";
  return {
    attackId: attack.id, stage, moveTick: f.phase === "dive_landing" ? null : f.phaseTick,
    stageTick: stage === "strike" ? f.phaseTick - attack.startup : stage === "gather" ? f.phaseTick - (f.airDiveGatherStartTick ?? attack.startup + attack.active) : f.phaseTick,
    currentHeight: state.stage.groundY - f.y, landingRecoveryTicks: track.landingRecoveryTicks,
    landingTicksRemaining: stage === "landing" ? Math.max(0, track.landingRecoveryTicks - f.phaseTick) : null,
    // This is a conservative legal-entry bound, NOT an authored fixed landing tick.
    maximumAirTicks: attack.startup + Math.ceil(track.maximumHeight / Math.min(track.strikeVelocity.y, track.gatherVelocity.y))
  };
}

function resetCombo(f: FighterState) { f.comboCount = 0; f.comboDamage = 0; f.comboRoute = []; f.damageScaling = 1; f.comboTarget = null; f.comboNeutralTicks = 0; f.juggleSpent = 0; f.peakJuggleSpent = 0; }
function addTension(f: FighterState, amount: number) {
  if (amount <= 0) return;
  const before = f.tension;
  f.tension = Math.min(def(f.kind).combat.maxTension, f.tension + amount);
  f.tensionEarned += f.tension - before;
}
function recentSystemPress(f: FighterState, action: SystemInput, leniency = 6) {
  const recent = f.deterministicBuffer.history.slice(-leniency);
  for (let index = recent.length - 1; index >= 0; index--) {
    if (recent[index].pressed[action] && recent[index].tick > f.systemInputConsumed[action]) return recent[index].tick;
  }
  return null;
}
function rejectSystem(state: MatchState, attempt: SystemAttempt, resource: number, reason: "insufficient_resource" | "invalid_state") {
  state.lastSystemEvent = { tick: state.tick, system: attempt.system, outcome: "rejected", actor: attempt.actor.id, target: attempt.target.id, resourceBefore: resource, resourceAfter: resource, freezeTicks: 0, reason };
}
function applyRomanCancel(state: MatchState, attempt: SystemAttempt) {
  const { actor, target } = attempt;
  const combat = def(actor.kind).combat;
  const before = actor.tension;
  const validState = actor.hitstun === 0 && actor.blockstun === 0 && actor.knockdownTicks === 0 && actor.getupTicks === 0
    && actor.phase === "attack" && !!actor.currentAttack && (actor.attackConnected || actor.attackBlocked);
  if (!validState) { rejectSystem(state, attempt, before, "invalid_state"); return; }
  if (before < combat.romanCancelCost) { rejectSystem(state, attempt, before, "insufficient_resource"); return; }
  actor.tension -= combat.romanCancelCost;
  actor.tensionSpent += combat.romanCancelCost;
  actor.romanCancelCount++;
  actor.romanCancelTicks = combat.romanCancelRecoveryTicks;
  if (!actor.grounded && !resolveAttackDefinition(actor).authoredDive) actor.airActionsRemaining = Math.min(combat.airActionBudget, actor.airActionsRemaining + combat.romanCancelAirActionRefund);
  clearAttack(actor);
  actor.vx *= 0.25;
  enterPhase(actor, "roman_cancel");
  target.hitstop = Math.max(target.hitstop, combat.romanCancelFreezeTicks);
  state.lastSystemEvent = { tick: state.tick, system: "roman_cancel", outcome: "activated", actor: actor.id, target: target.id, resourceBefore: before, resourceAfter: actor.tension, freezeTicks: combat.romanCancelFreezeTicks };
}
function applyBurst(state: MatchState, attempt: SystemAttempt) {
  const { actor, target } = attempt;
  const combat = def(actor.kind).combat;
  const before = actor.burst;
  const validState = (actor.hitstun > 0 || actor.blockstun > 0) && actor.knockdownTicks === 0 && actor.getupTicks === 0;
  if (!validState) { rejectSystem(state, attempt, before, "invalid_state"); return; }
  if (before < combat.burstCost) { rejectSystem(state, attempt, before, "insufficient_resource"); return; }
  actor.burst -= combat.burstCost;
  actor.burstCount++;
  actor.burstTicks = combat.burstRecoveryTicks;
  actor.hitstun = 0; actor.blockstun = 0; actor.airRecoveryTicks = 0; actor.blocking = false; actor.crouchBlocking = false; actor.vx = 0;
  actor.airTechInvuln = 0; actor.knockdownKind = "none";
  clearAttack(actor); resetCombo(actor); enterPhase(actor, "burst");
  clearAttack(target); resetCombo(target);
  target.blockstun = 0; target.hitstun = combat.burstHitstun; target.knockdownKind = "none"; target.knockdownTicks = 0; target.getupTicks = 0; target.airTechInvuln = 0;
  target.blocking = false; target.crouchBlocking = false;
  target.vx = signed(target.x - actor.x) * combat.burstPushback;
  if (!target.grounded) target.vy = Math.min(target.vy, -4);
  restartHitReaction(target, "heavy");
  actor.hitstop = Math.max(actor.hitstop, combat.burstFreezeTicks);
  target.hitstop = Math.max(target.hitstop, combat.burstFreezeTicks);
  state.lastSystemEvent = { tick: state.tick, system: "burst", outcome: "activated", actor: actor.id, target: target.id, resourceBefore: before, resourceAfter: actor.burst, freezeTicks: combat.burstFreezeTicks };
}
function resolveSystemActions(state: MatchState) {
  const ids: FighterId[] = ["p1", "p2"];
  const attempts: SystemAttempt[] = [];
  for (const id of ids) {
    const actor = state.fighters[id], target = state.fighters[id === "p1" ? "p2" : "p1"];
    if (actor.hitstop > 0) continue;
    const burstTick = recentSystemPress(actor, "burst");
    if (burstTick !== null) attempts.push({ system: "burst", actor, target, input: "burst", inputTick: burstTick });
    const romanTick = recentSystemPress(actor, "romanCancel");
    if (romanTick !== null) attempts.push({ system: "roman_cancel", actor, target, input: "romanCancel", inputTick: romanTick });
  }
  attempts.sort((left, right) => (left.system === right.system ? left.actor.id.localeCompare(right.actor.id) : left.system === "burst" ? -1 : 1));
  for (const attempt of attempts) {
    attempt.actor.systemInputConsumed[attempt.input] = attempt.inputTick;
    if (attempt.system === "burst") applyBurst(state, attempt); else applyRomanCancel(state, attempt);
  }
}
function requestAttack(f: FighterState): AttackId | null {
  if (f.kind === "lamuh_legacy_v2" && wasPressed(f.deterministicBuffer, "ultimate", 1)) return "legacy_crown_of_no_gods";
  const b = f.deterministicBuffer;
  if (f.kind === "lamuh_proto" && f.swahiliAirSpecialsV1 && !f.grounded) {
    // Chord history retains its special identity even when U is released. An
    // exhausted/illegal buffered special may not become a cheaper plain normal.
    if (wasPressedWithHeld(b, "heavy", "special", 6) || wasPressedWithHeld(b, "special", "heavy", 6)) return "special_air_heavy";
    if (wasPressedWithHeld(b, "medium", "special", 6) || wasPressedWithHeld(b, "special", "medium", 6)) return "special_air_medium";
    if (wasPressedWithHeld(b, "light", "special", 6) || wasPressedWithHeld(b, "special", "light", 6)) return "special_air_light";
    if (held(b, "special")) return null;
  }
  if (f.kind === "lamuh_legacy_v2" && !f.grounded && held(b, "special")) {
    // One aerial family independent of held direction. Rejected entry cannot fall
    // through into a plain air normal or the generic cancel-only fixture ender.
    if (wasPressedWithHeld(b, "heavy", "special", 6) || wasPressedWithHeld(b, "special", "heavy", 6)) return "legacy_radiant_dive_heavy";
    if (wasPressedWithHeld(b, "medium", "special", 6) || wasPressedWithHeld(b, "special", "medium", 6)) return "legacy_radiant_dive_medium";
    if (wasPressedWithHeld(b, "light", "special", 6) || wasPressedWithHeld(b, "special", "light", 6)) return "legacy_radiant_dive_light";
    return null;
  }
  if (f.kind === "lamuh_legacy_v2" && f.grounded && held(b, "special")) {
    // Authored Down takes precedence over horizontal diagonals, never Up+Down SOCD.
    if (held(b, "down") && !held(b, "up")) {
      if (wasPressedWithHeld(b, "heavy", "special", 6) || wasPressedWithHeld(b, "special", "heavy", 6)) return "legacy_aura_sweep_heavy";
      if (wasPressedWithHeld(b, "medium", "special", 6) || wasPressedWithHeld(b, "special", "medium", 6)) return "legacy_aura_sweep_medium";
      if (wasPressedWithHeld(b, "light", "special", 6) || wasPressedWithHeld(b, "special", "light", 6)) return "legacy_aura_sweep_light";
      return null;
    }
    // Authored Up has priority over both horizontal diagonals and ordinary jump.
    // SOCD Up+Down does not select this family; forward-only routing stays unchanged.
    if (held(b, "up") && !held(b, "down")) {
      if (wasPressedWithHeld(b, "heavy", "special", 6) || wasPressedWithHeld(b, "special", "heavy", 6)) return "legacy_heaven_splitter_heavy";
      if (wasPressedWithHeld(b, "medium", "special", 6) || wasPressedWithHeld(b, "special", "medium", 6)) return "legacy_heaven_splitter_medium";
      if (wasPressedWithHeld(b, "light", "special", 6) || wasPressedWithHeld(b, "special", "light", 6)) return "legacy_heaven_splitter_light";
    }
    if (forwardHeld(b)) {
      if (wasPressedWithHeld(b, "heavy", "special", 6) || wasPressedWithHeld(b, "special", "heavy", 6)) return "legacy_ascend_step_heavy";
      if (wasPressedWithHeld(b, "medium", "special", 6) || wasPressedWithHeld(b, "special", "medium", 6)) return "legacy_ascend_step";
      if (wasPressedWithHeld(b, "light", "special", 6) || wasPressedWithHeld(b, "special", "light", 6)) return "legacy_ascend_step_light";
    }
    if (backHeld(b)) {
      if (wasPressedWithHeld(b, "heavy", "special", 6) || wasPressedWithHeld(b, "special", "heavy", 6)) return "legacy_divine_vanish_heavy";
      if (wasPressedWithHeld(b, "medium", "special", 6) || wasPressedWithHeld(b, "special", "medium", 6)) return "legacy_divine_vanish_medium";
      if (wasPressedWithHeld(b, "light", "special", 6) || wasPressedWithHeld(b, "special", "light", 6)) return "legacy_divine_vanish_light";
    }
    if (!held(b, "left") && !held(b, "right") && !held(b, "up") && !held(b, "down")) {
      if (wasPressedWithHeld(b, "heavy", "special", 6) || wasPressedWithHeld(b, "special", "heavy", 6)) return "legacy_celestial_palm_heavy";
      if (wasPressedWithHeld(b, "medium", "special", 6) || wasPressedWithHeld(b, "special", "medium", 6)) return "legacy_celestial_palm_medium";
      if (wasPressedWithHeld(b, "light", "special", 6) || wasPressedWithHeld(b, "special", "light", 6)) return "legacy_celestial_palm_light";
    }
    return null;
  }
  const airSpecialEnder = !f.grounded && (
    wasPressedWithHeld(b, "heavy", "special", 6)
    || wasPressedWithHeld(b, "special", "heavy", 6)
  );
  if (airSpecialEnder) return "air_special_ender";
  if (!f.grounded && wasPressed(b, "light", 6)) return "air_light";
  if (!f.grounded && wasPressed(b, "medium", 6)) return "air_medium";
  if (!f.grounded && wasPressed(b, "heavy", 6)) return "air_heavy";
  const forwardHeavySpecial = forwardHeld(b) && (
    wasPressedWithHeld(b, "heavy", "special", 6)
    || wasPressedWithHeld(b, "special", "heavy", 6)
  );
  const forwardMediumSpecial = forwardHeld(b) && (
    wasPressedWithHeld(b, "medium", "special", 6)
    || wasPressedWithHeld(b, "special", "medium", 6)
  );
  const forwardLightSpecial = forwardHeld(b) && (
    wasPressedWithHeld(b, "light", "special", 6)
    || wasPressedWithHeld(b, "special", "light", 6)
  );
  const upMediumSpecial = held(b, "up") && (
    wasPressedWithHeld(b, "medium", "special", 6)
    || wasPressedWithHeld(b, "special", "medium", 6)
  );
  const downHeavySpecial = held(b, "down") && (
    wasPressedWithHeld(b, "heavy", "special", 6)
    || wasPressedWithHeld(b, "special", "heavy", 6)
  );
  const downLightSpecial = held(b, "down") && (
    wasPressedWithHeld(b, "light", "special", 6)
    || wasPressedWithHeld(b, "special", "light", 6)
  );
  const downMediumSpecial = held(b, "down") && (
    wasPressedWithHeld(b, "medium", "special", 6)
    || wasPressedWithHeld(b, "special", "medium", 6)
  );
  const neutralMediumSpecial = !held(b, "left") && !held(b, "right") && !held(b, "up") && !held(b, "down") && (
    wasPressedWithHeld(b, "medium", "special", 6)
    || wasPressedWithHeld(b, "special", "medium", 6)
  );
  const upHeavySpecial = held(b, "up") && (
    wasPressedWithHeld(b, "heavy", "up", 6)
    || wasPressedWithHeld(b, "up", "heavy", 6)
  );
  if (f.grounded && forwardHeavySpecial) return "special_forward_heavy";
  if (f.grounded && forwardMediumSpecial) return "special_forward_medium";
  if (f.grounded && forwardLightSpecial) return "special_forward_light";
  if (f.grounded && upMediumSpecial) return "special_up_medium";
  if (f.grounded && downHeavySpecial) return "special_down_heavy";
  if (f.grounded && downLightSpecial) return "special_down_light";
  if (f.grounded && downMediumSpecial) return "special_down_medium";
  if (f.grounded && neutralMediumSpecial) return "special_neutral_medium";
  if (f.kind !== "lamuh_legacy_v2" && f.grounded && upHeavySpecial) return "special_up_heavy";
  if (wasPressedWithHeld(b, "light", "down", 6)) return "crouching_light";
  if (wasPressedWithHeld(b, "medium", "down", 6)) return "crouching_medium";
  if (wasPressedWithHeld(b, "heavy", "down", 6)) return "crouching_heavy";
  if (wasPressed(b, "light", 6)) return "standing_light";
  if (wasPressed(b, "medium", 6)) return "standing_medium";
  if (wasPressed(b, "heavy", 6)) return "standing_heavy";
  return null;
}

function canStartThrow(f: FighterState) {
  return f.grounded && f.hitstop === 0 && f.hitstun === 0 && f.blockstun === 0 && f.knockdownTicks === 0 && f.getupTicks === 0
    && ["idle", "walk_forward", "walk_backward", "crouch", "block"].includes(f.phase);
}

function supportsThrow(f: FighterState, throwId: ThrowId) { return !!def(f.kind).throws[throwId]; }

function throwEventId(state: MatchState, attacker: FighterState, instanceId: number, type: "startup" | "connect" | "whiff" | "release" | "complete") {
  const eventIndex = type === "startup" ? 0 : type === "connect" || type === "whiff" ? 1 : type === "release" ? 2 : 3;
  return `${state.matchId}:${state.tick}:${attacker.id}:${instanceId}:${eventIndex}`;
}

function emitThrowEvent(state: MatchState, type: "startup" | "connect" | "whiff" | "release" | "complete", definition: ThrowDefinition, attacker: FighterState, defender: FighterState, damage = 0) {
  const interaction = state.throwInteraction;
  if (!interaction) return;
  const eventId = throwEventId(state, attacker, interaction.instanceId, type);
  if (state.presentationEventLedger.includes(eventId)) return;
  state.presentationEventLedger.push(eventId);
  state.lastThrowEvent = { tick: state.tick, eventId, type, throwId: definition.id, attacker: attacker.id, defender: defender.id, damage };
}

function emitAttackContactPresentationEvent(state: MatchState, fighter: FighterState, eventIndex: number) {
  if (fighter.kind !== "lamuh_legacy_v2" || !fighter.currentAttack || fighter.currentMoveInstance <= 0) return;
  const eventId = `${state.matchId}:${state.tick}:${fighter.id}:${fighter.currentMoveInstance}:${eventIndex}`;
  if (!state.presentationEventLedger.includes(eventId)) state.presentationEventLedger.push(eventId);
}

function applyTargetSideSwitch(state: MatchState, fighter: FighterState, attack: AttackDefinition) {
  const track = attack.targetSideSwitch;
  if (!track || fighter.phaseTick !== track.triggerTick) return;
  const target = state.fighters[fighter.id === "p1" ? "p2" : "p1"];
  const distanceAhead = (target.x - fighter.x) * fighter.attackFacing;
  if (track.requireTargetAhead && distanceAhead < 0) return;
  if (distanceAhead > track.captureRange || Math.abs(target.y - fighter.y) > track.verticalTolerance) return;
  const switchDirection = fighter.attackFacing;
  const nextFacing = track.faceTargetAfterSwitch ? (switchDirection === 1 ? -1 : 1) : fighter.facing;
  let destination = target.x + switchDirection * track.behindDistance;
  const candidate = { ...fighter, x: destination, facing: nextFacing as 1 | -1, attackFacing: nextFacing as 1 | -1 };
  const candidateBox = fighterPushbox(candidate), targetBox = fighterPushbox(target);
  if (overlap(candidateBox, targetBox)) {
    const collisionDepth = switchDirection === 1
      ? targetBox.x + targetBox.w - candidateBox.x
      : candidateBox.x + candidateBox.w - targetBox.x;
    destination += switchDirection * (collisionDepth + EPSILON);
  }
  if (destination < state.stage.left || destination > state.stage.right) {
    if (!fighter.ascendHeavyResponse) return;
    // No legal behind slot at the wall: place only the attacker on the original
    // side at the authored kicking distance, never displace the victim.
    const fallback = target.x - switchDirection * track.behindDistance;
    if (fallback < state.stage.left || fallback > state.stage.right) return;
    fighter.x = fallback; fighter.vx = 0;
    return;
  }
  fighter.x = destination;
  fighter.vx = 0;
  if (track.faceTargetAfterSwitch) {
    fighter.facing = nextFacing as 1 | -1;
    fighter.attackFacing = fighter.facing;
  }
  const eventId = `${state.matchId}:${state.tick}:${fighter.id}:${fighter.currentMoveInstance}:1`;
  if (!state.presentationEventLedger.includes(eventId)) state.presentationEventLedger.push(eventId);
}

function beginThrow(state: MatchState, attacker: FighterState, defender: FighterState, throwId: ThrowId) {
  const definition = def(attacker.kind).throws[throwId];
  if (!definition) return;
  attacker.throwInstanceCounter++;
  attacker.vx = 0; attacker.vy = 0; attacker.attackFacing = attacker.facing;
  attacker.phase = "throw_startup"; attacker.phaseTick = 0; clearAttack(attacker);
  state.throwInteraction = {
    instanceId: attacker.throwInstanceCounter, throwId, attacker: attacker.id, defender: defender.id, tick: 0, result: "pending",
    attackerStartX: attacker.x, attackerStartY: attacker.y, startingFacing: attacker.facing,
    defenderStartX: defender.x, defenderStartY: defender.y, victimTrackAnchorX: 0, victimTrackAnchorY: 0, damageApplied: false, released: false
  };
  emitThrowEvent(state, "startup", definition, attacker, defender);
}

function resolveThrowRequests(state: MatchState) {
  if (state.throwInteraction) return;
  const attempts = (["p1", "p2"] as FighterId[])
    .map((id) => {
      const fighter = state.fighters[id];
      const commandGrabRequested = fighter.deterministicBuffer.current.special || wasPressed(fighter.deterministicBuffer, "special", 3);
      const throwId = commandGrabRequested ? "command_grab" : backHeld(fighter.deterministicBuffer) ? "back_throw" : "forward_throw";
      return { fighter, throwId } as const;
    })
    .filter(({ fighter, throwId }) => wasPressed(fighter.deterministicBuffer, "throw", 3) && canStartThrow(fighter) && supportsThrow(fighter, throwId))
    .sort((left, right) => left.fighter.id.localeCompare(right.fighter.id));
  if (!attempts.length) return;
  const { fighter: attacker, throwId } = attempts[0];
  const defender = state.fighters[attacker.id === "p1" ? "p2" : "p1"];
  beginThrow(state, attacker, defender, throwId);
}

function lerp(a: number, b: number, t: number) { return a + (b - a) * t; }
function sampleThrowTrack(track: readonly ThrowTrackPoint[], tickNo: number): ThrowTrackPoint {
  if (tickNo <= track[0].tick) return track[0];
  if (tickNo >= track[track.length - 1].tick) return track[track.length - 1];
  const right = track.findIndex((point) => point.tick >= tickNo);
  const a = track[right - 1], b = track[right];
  const t = (tickNo - a.tick) / Math.max(1, b.tick - a.tick);
  return {
    tick: tickNo,
    attackerOffsetX: lerp(a.attackerOffsetX, b.attackerOffsetX, t), attackerOffsetY: lerp(a.attackerOffsetY, b.attackerOffsetY, t),
    victimOffsetX: lerp(a.victimOffsetX, b.victimOffsetX, t), victimOffsetY: lerp(a.victimOffsetY, b.victimOffsetY, t),
    victimRotation: lerp(a.victimRotation, b.victimRotation, t), victimFacing: t < 0.5 ? a.victimFacing : b.victimFacing
  };
}

function finishThrow(state: MatchState, definition: ThrowDefinition, attacker: FighterState, defender: FighterState) {
  const connected = state.throwInteraction?.result === "connected";
  attacker.vx = 0; attacker.vy = 0; attacker.throwRotation = 0; enterPhase(attacker, "idle");
  if (connected) {
    defender.vx = 0; defender.vy = 0; defender.y = state.stage.groundY; defender.grounded = true; defender.throwRotation = 0;
    defender.knockdownKind = "hard"; defender.knockdownTicks = definition.knockdownTicks; defender.hitstun = 0; defender.blockstun = 0;
    enterPhase(defender, "knockdown");
  } else {
    defender.throwRotation = 0;
  }
  emitThrowEvent(state, "complete", definition, attacker, defender);
  state.throwInteraction = null;
}

function progressThrowInteraction(state: MatchState) {
  const interaction = state.throwInteraction;
  if (!interaction) return;
  const attacker = state.fighters[interaction.attacker], defender = state.fighters[interaction.defender];
  const definition = def(attacker.kind).throws[interaction.throwId];
  if (!definition) throw new Error(`${attacker.kind} cannot progress unsupported throw ${interaction.throwId}`);
  if (attacker.hitstop > 0 || defender.hitstop > 0) {
    if (attacker.hitstop > 0) attacker.hitstop--;
    if (defender.hitstop > 0) defender.hitstop--;
    return;
  }
  attacker.phaseTick = interaction.tick;
  if (interaction.result === "pending" && interaction.tick >= definition.connectTick) {
    const signedSeparation = (defender.x - attacker.x) * interaction.startingFacing;
    const validVictim = defender.victimClass === definition.victimClass && defender.grounded && defender.hitstun === 0 && defender.blockstun === 0
      && defender.knockdownTicks === 0 && defender.getupTicks === 0 && defender.phase !== "thrown" && !ignoresThrows(defender);
    if (validVictim && signedSeparation >= 0 && signedSeparation <= definition.range && Math.abs(defender.y - attacker.y) <= definition.heightTolerance) {
      interaction.result = "connected"; attacker.phase = "throw_active"; defender.phase = "thrown"; defender.phaseTick = 0;
      defender.blocking = false; defender.crouchBlocking = false; defender.vx = 0; defender.vy = 0; clearAttack(defender);
      const connectSample = sampleThrowTrack(definition.track, interaction.tick);
      const trackVictimX = interaction.attackerStartX + interaction.startingFacing * connectSample.victimOffsetX;
      const trackVictimY = interaction.defenderStartY + connectSample.victimOffsetY;
      interaction.victimTrackAnchorX = defender.x - trackVictimX;
      interaction.victimTrackAnchorY = defender.y - trackVictimY;
      emitThrowEvent(state, "connect", definition, attacker, defender);
    } else {
      interaction.result = "whiff"; attacker.phase = "throw_whiff";
      emitThrowEvent(state, "whiff", definition, attacker, defender);
    }
  }
  const sample = sampleThrowTrack(definition.track, interaction.tick);
  attacker.x = Math.max(state.stage.left, Math.min(state.stage.right, interaction.attackerStartX + interaction.startingFacing * sample.attackerOffsetX));
  attacker.y = interaction.attackerStartY + sample.attackerOffsetY; attacker.grounded = true; attacker.throwRotation = 0;
  if (interaction.result === "connected") {
    defender.x = Math.max(state.stage.left, Math.min(state.stage.right, interaction.attackerStartX + interaction.startingFacing * sample.victimOffsetX + interaction.victimTrackAnchorX));
    defender.y = Math.min(state.stage.groundY, interaction.defenderStartY + sample.victimOffsetY + interaction.victimTrackAnchorY);
    defender.grounded = sample.victimOffsetY >= 0; defender.throwRotation = interaction.startingFacing * sample.victimRotation;
    defender.facing = (interaction.startingFacing * sample.victimFacing) as 1 | -1; defender.phaseTick = interaction.tick;
    if (!interaction.damageApplied && interaction.tick >= definition.releaseTick) {
      interaction.damageApplied = true; interaction.released = true;
      defender.health = Math.max(0, defender.health - definition.damage); defender.hitCountTaken++;
      attacker.hitstop = definition.hitstop; defender.hitstop = definition.hitstop;
      emitThrowEvent(state, "release", definition, attacker, defender, definition.damage);
      // The authored release cursor is consumed before hitstop freezes subsequent simulation
      // cursor advancement. This keeps global duration = authored ticks + explicit hitstop.
      interaction.tick++;
      return;
    }
  }
  interaction.tick++;
  if (interaction.tick >= definition.totalTicks) finishThrow(state, definition, attacker, defender);
}
function canCancel(f: FighterState, next: AttackId) { return f.cancelOptions.includes(next); }
function hasJumpCancelOnHit(f: FighterState) { return !!f.currentAttack && f.attackConnected && resolveAttackDefinition(f).hitboxes.some((hitbox) => hitbox.jumpCancelOnHit); }
function requestedAirTechDirection(f: FighterState): AirTechDirection | null {
  const b = f.deterministicBuffer;
  const left = wasPressed(b, "left", 6), right = wasPressed(b, "right", 6);
  if (left !== right) {
    const screenDirection = right ? 1 : -1;
    return screenDirection === f.facing ? "forward" : "backward";
  }
  return left || right || wasPressed(b, "up", 6) || wasPressed(b, "down", 6)
    || wasPressed(b, "light", 6) || wasPressed(b, "medium", 6) || wasPressed(b, "heavy", 6) || wasPressed(b, "special", 6) || wasPressed(b, "block", 6)
    ? "neutral" : null;
}
function finishAirRecovery(f: FighterState, state: MatchState, direction: AirTechDirection, automatic: boolean) {
  const combat = def(f.kind).combat;
  f.airRecoveryTicks = 0;
  f.airRecoveryCount++;
  f.airTechInvuln = combat.airTechInvuln;
  f.lastAirTechDirection = direction;
  f.vy = Math.min(f.vy, combat.airTechVerticalSpeed);
  if (direction === "forward") f.vx = f.facing * combat.airTechHorizontalSpeed;
  else if (direction === "backward") f.vx = -f.facing * combat.airTechHorizontalSpeed;
  else f.vx *= 0.35;
  f.phase = "jump";
  f.phaseTick = 0;
  f.recoveryEvent = { tick: state.tick, type: "air_tech", durationTicks: combat.airTechInvuln, direction, automatic };
  const opponent = state.fighters[f.id === "p1" ? "p2" : "p1"];
  if (opponent.comboTarget === f.id) resetCombo(opponent);
}
function beginKnockdown(f: FighterState, state: MatchState, kind: Exclude<KnockdownKind, "none">) {
  const combat = def(f.kind).combat;
  const durationTicks = kind === "hard" ? combat.hardKnockdownTicks : combat.softKnockdownTicks;
  f.hitstun = 0;
  f.blockstun = 0;
  f.airRecoveryTicks = 0;
  f.airTechInvuln = 0;
  f.knockdownKind = kind;
  f.knockdownTicks = durationTicks;
  f.getupTicks = 0;
  f.phase = "knockdown";
  f.phaseTick = 0;
  f.recoveryEvent = { tick: state.tick, type: "knockdown", durationTicks, knockdown: kind };
}
function beginJump(f: FighterState) {
  const m = def(f.kind).movement;
  delete f.airDiveUsed;
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
  if (!f.dummyMode) return;
  if (f.dummyMode === "stand_block") { f.blocking = true; f.crouchBlocking = false; }
  if (f.dummyMode === "crouch_block") { f.blocking = true; f.crouchBlocking = true; }
  if (f.dummyMode === "block_after_first_hit" && f.hitCountTaken > 0) { f.blocking = true; f.crouchBlocking = false; }
}

function processInput(f: FighterState, opponent: FighterState, state: MatchState) {
  if (f.hitstop > 0) return;
  if (state.throwInteraction && (state.throwInteraction.attacker === f.id || state.throwInteraction.defender === f.id)) return;
  const wasCrouchingPresentation = f.kind === "lamuh_legacy_v2" && (f.phase === "crouch" || f.crouchBlocking);
  if (canUpdateFacing(f)) {
    const desiredFacing = signed(opponent.x - f.x);
    if (desiredFacing !== f.facing) {
      const startingFacing = f.facing;
      f.facing = desiredFacing;
      if (f.kind === "lamuh_legacy_v2") {
        f.phase = "turn";
        f.phaseTick = -1;
        f.turnStartingFacing = startingFacing;
      }
    }
  }

  if (f.hitstun > 0) { f.blocking = false; f.crouchBlocking = false; return; }
  if (f.phase === "air_recovery") { const direction = requestedAirTechDirection(f); if (direction) finishAirRecovery(f, state, direction, false); return; }
  if (f.phase === "roman_cancel" || f.phase === "burst") return;
  const mayBlock = f.grounded && f.phase !== "attack" && f.phase !== "dive_landing" && f.knockdownTicks === 0 && f.getupTicks === 0;
  f.blocking = mayBlock && (held(f.deterministicBuffer, "block") || backHeld(f.deterministicBuffer));
  f.crouchBlocking = f.blocking && held(f.deterministicBuffer, "down");
  applyDummyMode(f);

  if (f.blockstun > 0 || f.phase === "knockdown" || f.phase === "getup") return;
  // Dash-cancel window: from this move tick the run may be taken over by an attack or a
  // jump. Without one of those the dash keeps its authored duration; it never decays into
  // a walk, and backdash stays fully committed as the price of its invulnerability.
  const dashCancelTick = def(f.kind).movement.dashCancelTick;
  const inCancelableDash = f.phase === "dash" && dashCancelTick !== undefined && f.phaseTick >= dashCancelTick;
  if (!inCancelableDash && ["jump_startup", "dash", "backdash", "air_dash_forward", "air_dash_backward", "landing", "dive_landing"].includes(f.phase)) return;

  const next = requestAttack(f);
  if (inCancelableDash) {
    if (next && beginAttack(f, next, state)) return;
    if (wasPressed(f.deterministicBuffer, "up", 4)) { beginJump(f); return; }
    return;
  }
  if (f.phase === "attack") {
    const cancelling = next && canCancel(f, next) ? next : null;
    // A special/super cancel the player actually chorded outranks the generic jump cancel,
    // so 2H can still be routed into an Up special. Plain Up keeps jump-cancelling.
    if (f.grounded && hasJumpCancelOnHit(f) && wasPressed(f.deterministicBuffer, "up", 6)
      && !(cancelling && held(f.deterministicBuffer, "special"))) { beginJump(f); return; }
    if (cancelling) beginAttack(f, cancelling, state);
    return;
  }
  if (f.phase === "jump") {
    const movement = def(f.kind).movement;
    if ((f.airDashesRemaining ?? 0) > 0 && recentDoubleTap(f.deterministicBuffer, "forward")) {
      f.airDashesRemaining = (f.airDashesRemaining ?? 0) - 1; f.vx = f.facing * movement.airDashForwardSpeed; f.vy = 0; enterPhase(f, "air_dash_forward"); f.phaseTick = -1; return;
    }
    if ((f.airDashesRemaining ?? 0) > 0 && recentDoubleTap(f.deterministicBuffer, "back")) {
      f.airDashesRemaining = (f.airDashesRemaining ?? 0) - 1; f.vx = -f.facing * movement.airDashBackwardSpeed; f.vy = 0; enterPhase(f, "air_dash_backward"); f.phaseTick = -1; return;
    }
    if (next && beginAttack(f, next, state)) return;
    const dir = held(f.deterministicBuffer, "right") ? 1 : held(f.deterministicBuffer, "left") ? -1 : 0;
    if (dir) f.vx += dir * def(f.kind).movement.airControl * 0.1;
    return;
  }
  if (next) { beginAttack(f, next, state); return; }

  const m = def(f.kind).movement;
  if (f.grounded && wasPressed(f.deterministicBuffer, "up", 4)) {
    beginJump(f);
    return;
  }
  if (f.grounded && recentDoubleTap(f.deterministicBuffer, "forward")) { f.vx = f.facing * m.dashSpeed; enterPhase(f, "dash"); return; }
  if (f.grounded && recentDoubleTap(f.deterministicBuffer, "back")) {
    f.vx = -f.facing * Math.abs(m.backdashSpeed); enterPhase(f, "backdash");
    if (m.backdashInvulnTicks) f.backdashInvuln = m.backdashInvulnTicks;
    return;
  }
  if (held(f.deterministicBuffer, "down") && f.grounded) { f.vx = 0; enterPhase(f, f.blocking ? "block" : "crouch"); return; }

  const dir = held(f.deterministicBuffer, "right") ? 1 : held(f.deterministicBuffer, "left") ? -1 : 0;
  if (dir && f.grounded && f.kind !== "training_dummy") { const forward = dir === f.facing; f.vx = dir * (forward ? m.walkForward : m.walkBackward); enterPhase(f, forward ? "walk_forward" : "walk_backward"); }
  else {
    f.vx = 0;
    if (f.blocking) enterPhase(f, "block");
    else if (wasCrouchingPresentation) enterPhase(f, "crouch_release");
    else if (f.phase !== "crouch_release" && f.phase !== "turn") enterPhase(f, "idle");
  }
}

function progress(f: FighterState, state: MatchState) {
  const m = def(f.kind).movement;
  if (f.hitstop > 0) { f.hitstop--; return; }
  if (f.wakeupInvuln > 0) f.wakeupInvuln--;
  if (f.backdashInvuln !== undefined) { f.backdashInvuln--; if (f.backdashInvuln <= 0) delete f.backdashInvuln; }
  const airTechStartedThisTick = f.recoveryEvent?.type === "air_tech" && f.recoveryEvent.tick === state.tick;
  if (f.airTechInvuln > 0 && !airTechStartedThisTick) f.airTechInvuln--;
  if (f.romanCancelTicks > 0) { f.romanCancelTicks--; enterPhase(f, "roman_cancel"); if (f.romanCancelTicks === 0) enterPhase(f, neutralPhase(f)); return; }
  if (f.burstTicks > 0) { f.burstTicks--; enterPhase(f, "burst"); if (f.burstTicks === 0) enterPhase(f, neutralPhase(f)); return; }
  if (f.knockdownTicks > 0) {
    if (!f.grounded) return;
    f.knockdownTicks--;
    enterPhase(f, "knockdown");
    f.phaseTick++;
    if (f.knockdownTicks === 0) { enterPhase(f, "getup"); f.getupTicks = def(f.kind).combat.getupTicks; f.wakeupInvuln = m.wakeupInvuln; }
    return;
  }
  if (f.getupTicks > 0) { f.getupTicks--; enterPhase(f, "getup"); f.phaseTick++; if (f.getupTicks === 0) { f.knockdownKind = "none"; enterPhase(f, "idle"); } return; }
  if (f.hitstun > 0) {
    f.hitstun--;
    enterPhase(f, "hit_reaction");
    f.phaseTick++;
    if (f.hitstun === 0) {
      if (f.grounded) enterPhase(f, "idle");
      else { f.airRecoveryTicks = def(f.kind).combat.airRecoveryDelay; enterPhase(f, "air_recovery"); }
    }
    return;
  }
  if (f.blockstun > 0) { f.blockstun--; enterPhase(f, "block"); if (f.blockstun === 0) enterPhase(f, "idle"); return; }
  if (f.phase === "air_recovery") {
    if (f.airRecoveryTicks > 0) f.airRecoveryTicks--;
    const autoRecoveryEnabled = f.kind !== "training_dummy" || f.dummyMode !== "no_recovery";
    if (!f.grounded && f.airRecoveryTicks === 0 && autoRecoveryEnabled) finishAirRecovery(f, state, "neutral", true);
    return;
  }
  if (f.phase === "jump_startup") { f.phaseTick++; if (f.phaseTick >= m.jumpStartup) { f.grounded = false; f.airActionsRemaining = def(f.kind).combat.airActionBudget; if (m.airDashCount > 0) f.airDashesRemaining = m.airDashCount; f.vx = f.pendingJumpVx; f.pendingJumpVx = 0; f.vy = m.jumpVelocity; enterPhase(f, "jump"); } return; }
  if (f.phase === "turn") { f.phaseTick++; if (f.phaseTick >= LAMUH_TURN_PRESENTATION_TICKS) enterPhase(f, "idle"); return; }
  if (f.phase === "crouch_release") { f.phaseTick++; if (f.phaseTick > LAMUH_CROUCH_RELEASE_PRESENTATION_TICKS) enterPhase(f, "idle"); return; }
  if (f.phase === "landing") { f.phaseTick++; if (f.phaseTick >= m.landingRecovery) enterPhase(f, "idle"); return; }
  if (f.phase === "dive_landing" && f.currentAttack) {
    const track = resolveAttackDefinition(f).authoredDive!;
    f.phaseTick++; f.vx = 0;
    if (f.phaseTick >= track.landingRecoveryTicks) { clearAttack(f); enterPhase(f, "idle"); }
    return;
  }
  if (f.phase === "dash" || f.phase === "backdash") { f.phaseTick++; const duration = f.phase === "dash" ? m.dashDuration : m.backdashDuration; if (f.phaseTick >= duration) { f.vx = 0; enterPhase(f, "idle"); } return; }
  if (f.phase === "air_dash_forward" || f.phase === "air_dash_backward") { f.phaseTick++; f.vy = 0; if (f.phaseTick >= m.airDashDuration) { f.vx = 0; enterPhase(f, "jump"); } return; }
  if (f.phase === "attack" && f.currentAttack) {
    const a = resolveAttackDefinition(f);
    f.phaseTick++;
    if (a.authoredDive && f.airDiveGatherStartTick === undefined && f.phaseTick >= a.startup
      && (f.phaseTick >= a.startup + a.active || state.stage.groundY - f.y - a.authoredDive.strikeVelocity.y <= a.authoredDive.landingApproachHeight)) {
      // Predict this tick's landing approach before movement/collision. Retire the
      // hit early and physically gather for the floor, never jump strike-to-land.
      f.airDiveGatherStartTick = f.phaseTick;
    }
    applyTargetSideSwitch(state, f, a);
    a.hitboxes.forEach((hitbox, eventIndex) => {
      if (f.phaseTick === hitbox.start && f.airDiveGatherStartTick === undefined) emitAttackContactPresentationEvent(state, f, eventIndex);
    });
    if (a.authoredDive) return; // Landing, not a fixed total, completes this action.
    const segmentedRoot = a.rootMotionSegments?.find((segment) => f.phaseTick >= segment.start && f.phaseTick <= segment.end);
    const root = segmentedRoot || a.rootMotion;
    if (root) f.vx = f.phaseTick >= root.start && f.phaseTick <= root.end ? f.attackFacing * root.velocity : 0;
    else if (f.grounded) f.vx = 0;
    if (f.phaseTick >= total(a)) { clearAttack(f); f.vx = 0; enterPhase(f, neutralPhase(f)); }
    return;
  }
  f.phaseTick++;
}

export function sampleAuthoredHop(track: AuthoredHopTrack, moveTick: number): { y: number; vy: number; airborne: boolean } {
  const yAt = (tickNo: number) => {
    if (tickNo <= track.takeoffTick || tickNo >= track.landTick) return 0;
    if (tickNo <= track.apexTick) {
      const remaining = (track.apexTick - tickNo) / (track.apexTick - track.takeoffTick);
      return -track.height * (1 - remaining * remaining);
    }
    const descent = (tickNo - track.apexTick) / (track.landTick - track.apexTick);
    return -track.height * (1 - descent * descent);
  };
  const y = yAt(moveTick);
  return { y, vy: y === 0 ? 0 : y - yAt(moveTick - 1), airborne: moveTick > track.takeoffTick && moveTick < track.landTick };
}

function integrate(f: FighterState, state: MatchState, frozenAtStart: boolean) {
  if (frozenAtStart || heldByAscendHeavy(f, state)) return;
  const { stage } = state;
  const activeAttack = f.phase === "attack" && f.currentAttack ? resolveAttackDefinition(f) : undefined;
  const hop = activeAttack?.authoredHop;
  const dive = activeAttack?.authoredDive;
  if (dive) {
    const velocity = f.airDiveGatherStartTick !== undefined ? dive.gatherVelocity : f.phaseTick < activeAttack!.startup ? dive.windupVelocity : dive.strikeVelocity;
    f.vx = f.attackFacing * velocity.x; f.vy = velocity.y;
    f.x += f.vx; f.y += f.vy;
    if (f.y >= stage.groundY) {
      f.y = stage.groundY; f.vx = 0; f.vy = 0; f.grounded = true;
      f.airActionsRemaining = 0; delete f.airDiveUsed; delete f.airDiveGatherStartTick;
      if (f.airDashesRemaining !== undefined) f.airDashesRemaining = 0;
      f.airRecoveryTicks = 0; f.blocking = false; f.crouchBlocking = false;
      // Retain attack identity for pose selection; no collision is active in this
      // explicit landing phase, including an early/externally forced floor contact.
      enterPhase(f, "dive_landing");
      f.recoveryEvent = { tick: state.tick, type: "landing_recovery", durationTicks: dive.landingRecoveryTicks };
    }
  }
  else if (hop) {
    const sample = sampleAuthoredHop(hop, f.phaseTick), wasAirborne = !f.grounded;
    f.x += f.vx;
    f.y = Math.max(stage.ceilingY, stage.groundY + sample.y);
    f.vy = sample.vy;
    if (f.y === stage.ceilingY && f.vy < 0) f.vy = 0;
    f.grounded = !sample.airborne;
    // A special hop is commitment, not a new jump or an air-action refund.
    f.airActionsRemaining = 0;
    if (f.airDashesRemaining !== undefined) f.airDashesRemaining = 0;
    if (wasAirborne && f.grounded) {
      delete f.airDiveUsed;
      f.airRecoveryTicks = 0;
      f.recoveryEvent = { tick: state.tick, type: "landing_recovery", durationTicks: total(activeAttack!) - f.phaseTick };
    }
  }
  else if (f.grounded) { f.y = stage.groundY; f.vy = 0; f.x += f.vx; }
  else {
    if (f.phase === "air_dash_forward" || f.phase === "air_dash_backward") f.vy = 0;
    else f.vy += def(f.kind).movement.gravity;
    const descent = activeAttack?.airDescent;
    if (descent && f.phaseTick >= descent.start && f.phaseTick <= descent.end) {
      f.vy = Math.max(descent.minimumVelocityY, Math.min(descent.maximumVelocityY, f.vy));
    }
    f.x += f.vx;
    f.y += f.vy;
    if (f.y < stage.ceilingY) { recordWarning(state, `${f.id}: vertical combat bound clamped`); f.y = stage.ceilingY; if (f.vy < 0) f.vy = 0; }
    if (f.y >= stage.groundY) {
      const unrecoveredAirHit = f.hitstun > 0 || f.phase === "hit_reaction" || f.phase === "air_recovery";
      f.y = stage.groundY; f.vy = 0; f.grounded = true;
      delete f.airDiveUsed;
      if (f.currentAttack && resolveAttackDefinition(f).airOnly) clearAttack(f);
      f.airActionsRemaining = 0;
      if (f.airDashesRemaining !== undefined) f.airDashesRemaining = 0;
      f.airRecoveryTicks = 0;
      if (f.knockdownTicks > 0 || f.phase === "knockdown") enterPhase(f, "knockdown");
      else if (unrecoveredAirHit) beginKnockdown(f, state, "soft");
      else {
        enterPhase(f, "landing");
        f.recoveryEvent = { tick: state.tick, type: "landing_recovery", durationTicks: def(f.kind).movement.landingRecovery };
      }
    }
  }
  if (f.x < stage.left || f.x > stage.right) recordWarning(state, `${f.id}: horizontal stage bound clamped`);
  f.x = Math.max(stage.left, Math.min(stage.right, f.x));
}

export function fighterPushbox(f: FighterState) { return rectWorld(f, f.bodyEnvelope?.pushbox ?? def(f.kind).pushbox); }
function hurtboxes(f: FighterState, requestedProfile?: "extended") {
  const crouching = f.phase === "crouch" || f.crouchBlocking;
  // An opted-in envelope already spans the whole drawn body, so it is the widest profile
  // this fighter has: "extended" requests resolve to the same boxes rather than to a
  // per-kind extended set that would be smaller than the envelope.
  if (f.bodyEnvelope) {
    // A downed or rising body is not standing up. Without this the envelope would
    // leave a full-height box floating over a fighter lying on the floor.
    const low = crouching || f.phase === "knockdown" || f.phase === "getup";
    return (low ? f.bodyEnvelope.crouching : f.bodyEnvelope.standing).map((r) => rectWorld(f, r));
  }
  const ownProfile = f.phase === "attack" && f.currentAttack ? resolveAttackDefinition(f).hurtboxProfile : undefined;
  const extended = (requestedProfile || ownProfile) && def(f.kind).extendedHurtboxes;
  const boxes = extended ? crouching ? extended.crouching : extended.standing : crouching ? def(f.kind).crouchingHurtboxes : def(f.kind).standingHurtboxes;
  return boxes.map((r) => rectWorld(f, r));
}
// New high-contact body moves opt in explicitly; old normal collision is untouched.
export function fighterExtendedHurtboxes(f: FighterState): Rect[] { return hurtboxes(f, "extended"); }
function resolvePush(a: FighterState, b: FighterState, state: MatchState) {
  const pa = fighterPushbox(a), pb = fighterPushbox(b);
  if (!overlap(pa, pb)) return;
  const left = a.x < b.x || (Math.abs(a.x - b.x) <= EPSILON && a.id.localeCompare(b.id) < 0) ? a : b;
  const right = left === a ? b : a;
  const leftBox = fighterPushbox(left), rightBox = fighterPushbox(right);
  const depth = Math.max(0, leftBox.x + leftBox.w - rightBox.x) + EPSILON;
  const leftRoom = Math.max(0, left.x - state.stage.left);
  const rightRoom = Math.max(0, state.stage.right - right.x);
  let leftShift = Math.min(depth / 2, leftRoom);
  let rightShift = Math.min(depth / 2, rightRoom);
  let residual = depth - leftShift - rightShift;

  // If one fighter is wall-pinned, transfer that fighter's half of the correction to
  // the fighter who still has stage room. This resolves the overlap in one tick instead
  // of repeatedly halving it at the boundary.
  const extraLeft = Math.min(residual, leftRoom - leftShift);
  leftShift += extraLeft;
  residual -= extraLeft;
  const extraRight = Math.min(residual, rightRoom - rightShift);
  rightShift += extraRight;

  left.x = Math.max(state.stage.left, left.x - leftShift);
  right.x = Math.min(state.stage.right, right.x + rightShift);
}

export function projectileWorldRect(projectile: ProjectileState): Rect {
  const box = projectile.hitbox.rect;
  return { x: projectile.x + box.x * projectile.facing - (projectile.facing < 0 ? box.w : 0), y: projectile.y + box.y, w: box.w, h: box.h };
}

export function fighterProjectileHurtboxes(fighter: FighterState): Rect[] {
  if (fighter.bodyEnvelope) return hurtboxes(fighter);
  const profile = def(fighter.kind).projectileHurtboxes;
  if (!profile) return hurtboxes(fighter);
  const boxes = fighter.phase === "crouch" || fighter.crouchBlocking ? profile.crouching : profile.standing;
  return boxes.map((box) => rectWorld(fighter, box));
}

function sweptProjectileOverlap(projectile: ProjectileState, target: Rect): boolean {
  const current = projectileWorldRect(projectile);
  const previous = { ...current, x: current.x + projectile.previousX - projectile.x, y: current.y + projectile.previousY - projectile.y };
  if (overlap(previous, target) || overlap(current, target)) return true;
  // Segment-vs-expanded-box test avoids both tunneling and the false corner hits of a swept bounding rectangle.
  let enter = 0, leave = 1;
  for (const [origin, delta, low, high] of [
    [previous.x, current.x - previous.x, target.x - current.w, target.x + target.w],
    [previous.y, current.y - previous.y, target.y - current.h, target.y + target.h]
  ]) {
    if (Math.abs(delta) < EPSILON) { if (origin <= low || origin >= high) return false; continue; }
    const first = (low - origin) / delta, last = (high - origin) / delta;
    enter = Math.max(enter, Math.min(first, last));
    leave = Math.min(leave, Math.max(first, last));
    if (enter >= leave) return false;
  }
  return enter < 1 && leave > 0;
}

function emitProjectileEvent(state: MatchState, projectile: ProjectileState, type: ProjectileEvent["type"], reason?: ProjectileEvent["reason"], defender?: FighterId) {
  const eventId = `${projectile.id}:${type}`;
  state.projectileEventLedger ??= [];
  if (state.projectileEventLedger.includes(eventId)) return;
  state.projectileEventLedger.push(eventId);
  state.lastProjectileEvent = { tick: state.tick, eventId, projectileId: projectile.id, owner: projectile.owner,
    attackId: projectile.attackId, type, x: projectile.x, y: projectile.y, ...(reason ? { reason } : {}), ...(defender ? { defender } : {}) };
}

function spawnProjectiles(state: MatchState, frozen: Record<FighterId, boolean>) {
  // Canonical owner order keeps simultaneous release/event order independent of fighter iteration.
  for (const owner of ["p1", "p2"] as const) {
    const fighter = state.fighters[owner];
    if (fighter.kind !== "lamuh_legacy_v2" || frozen[owner] || fighter.phase !== "attack" || !fighter.currentAttack) continue;
    const attack = resolveAttackDefinition(fighter), definition = attack.projectile;
    if (!definition || fighter.phaseTick !== definition.releaseTick) continue;
    const id = `${state.matchId}:${owner}:${fighter.currentMoveInstance}:projectile_0`;
    state.projectileSpawnLedger ??= [];
    if (state.projectileSpawnLedger.includes(id)) continue;
    const halfWidth = definition.hitbox.rect.w / 2;
    const x = Math.max(state.stage.left + halfWidth, Math.min(state.stage.right - halfWidth, fighter.x + fighter.attackFacing * definition.spawnOffset.x));
    const projectile: ProjectileState = { id, owner, attackId: attack.id, moveInstanceId: fighter.currentMoveInstance,
      facing: fighter.attackFacing, x, y: fighter.y + definition.spawnOffset.y,
      // The release traverses shoulder-to-palm once, so a point-blank target cannot sit behind the muzzle.
      previousX: Math.max(state.stage.left + halfWidth, Math.min(state.stage.right - halfWidth, fighter.x + fighter.attackFacing * definition.releaseSweepStartX)),
      previousY: fighter.y + definition.spawnOffset.y, velocityX: fighter.attackFacing * definition.speed,
      velocityY: definition.initialVelocityY ?? 0, gravity: definition.gravity, ageTicks: 0, travelled: 0,
      maxTravel: definition.maxTravel, lifeTicks: definition.lifeTicks, spawnTick: state.tick,
      hitbox: clone(definition.hitbox), hitLedger: [] };
    state.projectiles ??= [];
    state.projectiles.push(projectile);
    state.projectileSpawnLedger.push(id);
    emitProjectileEvent(state, projectile, "spawn");
  }
  state.projectiles?.sort((left, right) => left.id.localeCompare(right.id));
}

function progressProjectiles(state: MatchState): { candidates: HitCandidate[]; expires: Map<string, ProjectileEvent["reason"]> } {
  const candidates: HitCandidate[] = [], expires = new Map<string, ProjectileEvent["reason"]>();
  for (const projectile of state.projectiles || []) {
    if (projectile.spawnTick !== state.tick) {
      projectile.previousX = projectile.x;
      projectile.previousY = projectile.y;
      projectile.ageTicks++;
      if (projectile.ageTicks >= projectile.lifeTicks) { expires.set(projectile.id, "lifetime"); continue; }
      const distance = Math.min(Math.abs(projectile.velocityX), Math.max(0, projectile.maxTravel - projectile.travelled));
      const desiredX = projectile.x + projectile.facing * distance;
      const halfWidth = projectile.hitbox.rect.w / 2;
      projectile.x = Math.max(state.stage.left + halfWidth, Math.min(state.stage.right - halfWidth, desiredX));
      projectile.travelled += Math.abs(projectile.x - projectile.previousX);
      if (projectile.x !== desiredX) expires.set(projectile.id, "stage_boundary");
      else if (projectile.travelled >= projectile.maxTravel) expires.set(projectile.id, "range");
      projectile.velocityY += projectile.gravity;
      const groundCenterY = state.stage.groundY - projectile.hitbox.rect.y - projectile.hitbox.rect.h;
      projectile.y += projectile.velocityY;
      if (projectile.y >= groundCenterY) { projectile.y = groundCenterY; expires.set(projectile.id, "ground"); }
    }
    const attacker = state.fighters[projectile.owner], defender = state.fighters[projectile.owner === "p1" ? "p2" : "p1"];
    // A connected authored throw remains a locked interaction; flight/lifetime continue normally.
    if (state.throwInteraction?.result === "connected" || defender.phase === "thrown" || defender.phase === "getup"
      || defender.wakeupInvuln > 0 || defender.airTechInvuln > 0 || ignoresStrikes(defender)
      || (defender.grounded && defender.phase === "knockdown")) continue;
    if (projectile.hitLedger.includes(defender.id)) continue;
    if (!fighterProjectileHurtboxes(defender).some((hurtbox) => sweptProjectileOverlap(projectile, hurtbox))) continue;
    const blocked = defender.hitstun === 0 && defender.blocking && (projectile.hitbox.level !== "low" || defender.crouchBlocking);
    candidates.push({ attacker, defender, attack: def(attacker.kind).attacks[projectile.attackId], hitbox: projectile.hitbox,
      ledgerKey: projectile.id, blocked, projectile });
  }
  return { candidates, expires };
}

// Lamuh combat modernization v1 --------------------------------------------------------
// Move-local invulnerability, authored per attack in move ticks. "strike" ignores strikes
// and projectiles but still loses to throws; "full" also refuses throw capture. Backdash
// carries the same full window so retreat is a real defensive option, not just distance.
function activeInvulnKind(f: FighterState): "strike" | "full" | null {
  if ((f.backdashInvuln ?? 0) > 0) return "full";
  if (f.phase !== "attack" || !f.currentAttack) return null;
  const authored = resolveAttackDefinition(f).invulnerable;
  if (!authored || f.phaseTick < authored.start || f.phaseTick > authored.end) return null;
  return authored.kind;
}
function ignoresStrikes(f: FighterState) { return activeInvulnKind(f) !== null; }
function ignoresThrows(f: FighterState) { return activeInvulnKind(f) === "full"; }
// Counter hit: contact that lands while the defender is committed to their own action.
// Scoped to the Lamuh Legacy candidate so every existing fixture keeps its exact numbers.
const COUNTER_HIT_DAMAGE_MULTIPLIER = 1.2, COUNTER_HIT_HITSTUN_BONUS = 6, COUNTER_HIT_HITSTOP_BONUS = 3;
// The cinematic ultimate keeps its authored damage ledger on both sides of a trade.
function isCounterHitContact(attacker: FighterState, defender: FighterState) {
  if (attacker.currentAttack === "legacy_crown_of_no_gods" || defender.currentAttack === "legacy_crown_of_no_gods") return false;
  return attacker.kind === "lamuh_legacy_v2" && defender.hitstun === 0 && defender.blockstun === 0
    && (defender.phase === "attack" || defender.phase === "throw_startup" || defender.phase === "throw_whiff");
}

function collectHitCandidate(attacker: FighterState, defender: FighterState, frozenAtStart: boolean): HitCandidate | null {
  if (frozenAtStart || attacker.phase !== "attack" || !attacker.currentAttack || defender.wakeupInvuln > 0 || defender.airTechInvuln > 0 || defender.phase === "getup") return null;
  if (ignoresStrikes(defender)) return null;
  if (attacker.airDiveGatherStartTick !== undefined) return null;
  // Only the triggered body's brief disappearance avoids body strikes. Throws
  // and independently simulated projectiles never use this exemption.
  if (defender.phase === "attack" && defender.divineCounterResponse && defender.currentAttack
    && defender.phaseTick <= (resolveAttackDefinition(defender).responseStrikeInvulnThrough ?? -1)) return null;
  const attack = resolveAttackDefinition(attacker);
  for (const hitbox of attack.hitboxes) {
    if (attacker.phaseTick < hitbox.start || attacker.phaseTick > hitbox.end) continue;
    if (defender.grounded && defender.phase === "knockdown" && !hitbox.allowOTG) continue;
    const ledgerKey = `${attacker.currentAttack}:${hitbox.id}`;
    const ids = attacker.hitLedger[ledgerKey] || [];
    if (ids.includes(defender.id) || ids.length >= hitbox.maxHits) continue;
    if (!hurtboxes(defender, attack.targetHurtboxProfile).some((hurt) => overlap(rectWorld(attacker, hitbox.rect, attacker.attackFacing), hurt))) continue;
    const blocked = defender.hitstun === 0 && defender.blocking && (hitbox.level !== "low" || defender.crouchBlocking);
    return { attacker, defender, attack, hitbox, ledgerKey, blocked };
  }
  return null;
}

function applyHit(candidate: HitCandidate, state: MatchState) {
  const { attacker, defender, attack, hitbox, ledgerKey, blocked, projectile } = candidate;
  const counter = defender.phase === "attack" && defender.currentAttack && !defender.divineCounterResponse
    ? resolveAttackDefinition(defender).strikeCounter : undefined;
  if (!projectile && counter && defender.grounded && defender.hitstun === 0 && defender.blockstun === 0
    && defender.phaseTick >= counter.start && defender.phaseTick <= counter.end) {
    // Collision and the ordinary ledger already proved this specific strike is
    // fresh. Consume only that contact, without damage, block, hitstop or meter.
    const ids = attacker.hitLedger[ledgerKey] || []; ids.push(defender.id); attacker.hitLedger[ledgerKey] = ids;
    const trigger = { triggerTick: state.tick, stanceTick: defender.phaseTick, incomingAttacker: attacker.id,
      incomingAttackId: attack.id, incomingHitboxId: hitbox.id, incomingMoveInstance: attacker.currentMoveInstance };
    beginAttack(defender, "legacy_divine_vanish_heavy", state);
    defender.divineCounterResponse = trigger;
    return false;
  }
  const contactFacing = projectile?.facing ?? attacker.attackFacing;
  const currentMoveOwnsContact = !projectile || (attacker.currentAttack === projectile.attackId && attacker.currentMoveInstance === projectile.moveInstanceId);
  if (projectile) {
    projectile.hitLedger.push(defender.id);
    if (!blocked && state.throwInteraction && state.throwInteraction.result !== "connected") {
      const interaction = state.throwInteraction, thrower = state.fighters[interaction.attacker], victim = state.fighters[interaction.defender];
      finishThrow(state, def(thrower.kind).throws[interaction.throwId]!, thrower, victim);
    }
  } else {
    const ids = attacker.hitLedger[ledgerKey] || [];
    ids.push(defender.id);
    attacker.hitLedger[ledgerKey] = ids;
  }
  const combat = def(attacker.kind).combat;

  if (blocked) {
    const blockHitstop = hitbox.blockHitstop ?? hitbox.hitstop;
    if (!projectile) attacker.hitstop = Math.max(attacker.hitstop, blockHitstop);
    defender.hitstop = Math.max(defender.hitstop, blockHitstop);
    defender.hitstun = 0;
    defender.blockstun = hitbox.blockstun;
    defender.vx = contactFacing * hitbox.knockbackX * 0.25;
    enterPhase(defender, "block");
    if (currentMoveOwnsContact) {
      attacker.attackBlocked = true;
      attacker.cancelOptions = [...(attack.cancel?.onBlock || [])];
    }
    addTension(attacker, combat.tensionGainOnBlock);
    state.lastCombatEvent = {
      tick: state.tick, outcome: "block", attacker: attacker.id, defender: defender.id, attackId: attack.id,
      hitOrdinal: attacker.comboCount, damage: 0, scaling: attacker.damageScaling, baseHitstun: 0, effectiveHitstun: 0,
      hitstunDecay: 0, juggleBefore: attacker.juggleSpent, juggleAfter: attacker.juggleSpent, juggleLimit: combat.juggleLimit
    };
    return true;
  }

  // Counter hit is decided from the defender's pre-contact commitment, before any mutation.
  const counterHit = isCounterHitContact(attacker, defender);
  if (attacker.comboCount === 0 || attacker.comboTarget !== defender.id) { resetCombo(attacker); attacker.comboTarget = defender.id; }
  const hitOrdinal = attacker.comboCount + 1;
  const juggleBefore = attacker.juggleSpent;
  const juggleCost = (!defender.grounded || hitbox.launches) ? Math.max(0, hitbox.juggleCost ?? 1) : 0;
  const juggleAfter = juggleBefore + juggleCost;
  const hitstunDecaySteps = Math.max(0, hitOrdinal - combat.hitstunDecayStartsAtHit + 1);
  const hitstunDecay = hitstunDecaySteps * combat.hitstunDecayPerHit;
  const willBeAirborne = !defender.grounded || !!hitbox.launches;
  const minimumHitstun = willBeAirborne ? combat.minimumAirHitstun : 1;
  const airborneHitstunBonus = willBeAirborne ? combat.airborneHitstunBonus : 0;
  const effectiveHitstun = hitbox.knockdown && hitbox.knockdown !== "none" ? 0
    : Math.max(minimumHitstun, hitbox.hitstun + airborneHitstunBonus - hitstunDecay) + (counterHit ? COUNTER_HIT_HITSTUN_BONUS : 0);

  if ((!hitbox.launches || attack.authoredHop) && !defender.grounded && juggleAfter > combat.juggleLimit) {
    state.lastCombatEvent = {
      tick: state.tick, outcome: "juggle_rejected", attacker: attacker.id, defender: defender.id, attackId: attack.id,
      hitOrdinal, damage: 0, scaling: attacker.damageScaling, baseHitstun: hitbox.hitstun, effectiveHitstun: 0,
      hitstunDecay, juggleBefore, juggleAfter: juggleBefore, juggleLimit: combat.juggleLimit
    };
    return false;
  }

  const contactHitstop = hitbox.hitstop + (counterHit ? COUNTER_HIT_HITSTOP_BONUS : 0);
  if (!projectile) attacker.hitstop = Math.max(attacker.hitstop, contactHitstop);
  defender.hitstop = Math.max(defender.hitstop, contactHitstop);
  const scalingBefore = attacker.damageScaling;
  const scaledDamage = Math.round(hitbox.damage * scalingBefore * (counterHit ? COUNTER_HIT_DAMAGE_MULTIPLIER : 1));
  defender.health = Math.max(0, defender.health - scaledDamage);
  defender.hitCountTaken++;
  // Lamuh's long light-hit confirm windows do not make those contacts heavy blows.
  // Keep this presentation choice local to the Lamuh mirror review; stun and damage stay authored.
  const lamuhLightContact = attacker.kind === "lamuh_legacy_v2" && defender.kind === "lamuh_legacy_v2"
    && !hitbox.launches && (!hitbox.knockdown || hitbox.knockdown === "none")
    && (["standing_light", "crouching_light", "air_light", "legacy_ascend_step_light"].includes(attack.id)
      || (attack.id === "legacy_ascend_step" && hitbox.id === "legacy_ascend_step_medium_slide"));
  const reactionWeight: HitReactionWeight = counterHit ? "heavy" : lamuhLightContact ? "light"
    : hitbox.launches || hitbox.hitstun >= 18 || (!!hitbox.knockdown && hitbox.knockdown !== "none") ? "heavy" : "light";
  defender.blockstun = 0;
  defender.blocking = false;
  defender.crouchBlocking = false;
  defender.airRecoveryTicks = 0;
  defender.vx = contactFacing * hitbox.knockbackX;
  if (hitbox.launches) {
    defender.grounded = false;
    defender.vy = Math.min(-EPSILON, hitbox.knockbackY);
    defender.hitstun = effectiveHitstun;
    restartHitReaction(defender, reactionWeight);
  } else if (hitbox.knockdown && hitbox.knockdown !== "none") {
    defender.vy = defender.grounded ? 0 : hitbox.knockbackY;
    defender.hitstun = 0;
    beginKnockdown(defender, state, hitbox.knockdown);
  } else {
    if (defender.grounded) defender.vy = 0;
    else defender.vy = hitbox.knockbackY;
    defender.hitstun = effectiveHitstun;
    restartHitReaction(defender, reactionWeight);
  }

  attacker.comboCount = hitOrdinal;
  attacker.comboDamage += scaledDamage;
  attacker.comboRoute.push(attack.id);
  attacker.damageScaling = Math.max(combat.minimumDamageScaling, attacker.damageScaling - combat.damageScalingStep);
  attacker.comboNeutralTicks = 0;
  attacker.juggleSpent = juggleAfter;
  attacker.peakJuggleSpent = Math.max(attacker.peakJuggleSpent, juggleAfter);
  if (currentMoveOwnsContact) {
    attacker.attackConnected = true;
    attacker.cancelOptions = [...(attack.cancel?.onHit || [])];
  }
  addTension(attacker, combat.tensionGainOnHit);
  state.lastCombatEvent = {
    tick: state.tick, outcome: "hit", attacker: attacker.id, defender: defender.id, attackId: attack.id,
    hitOrdinal, damage: scaledDamage, scaling: scalingBefore,
    baseHitstun: hitbox.hitstun, effectiveHitstun, hitstunDecay, juggleBefore, juggleAfter, juggleLimit: combat.juggleLimit,
    ...(counterHit ? { counterHit: true as const } : {})
  };
  if (defender.y < state.stage.ceilingY) recordWarning(state, `${defender.id}: hit resolved beyond vertical combat bound`);
  return true;
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
  if (f.phase === "dive_landing" && (!f.grounded || !f.currentAttack || !resolveAttackDefinition(f).authoredDive)) throw new Error(`${f.id} dive landing requires a grounded authored dive`);
  if (f.airDiveGatherStartTick !== undefined && (f.phase !== "attack" || !f.currentAttack || !resolveAttackDefinition(f).authoredDive
    || !Number.isInteger(f.airDiveGatherStartTick) || f.airDiveGatherStartTick < resolveAttackDefinition(f).startup || f.airDiveGatherStartTick > f.phaseTick)) throw new Error(`${f.id} invalid authored dive gather clock`);
  if (f.phase === "thrown" && (!state.throwInteraction || state.throwInteraction.defender !== f.id)) throw new Error(`${f.id} thrown phase requires active throw interaction`);
  if (f.airRecoveryTicks < 0 || f.airTechInvuln < 0 || f.juggleSpent < 0 || f.juggleSpent > def(f.kind).combat.juggleLimit || f.peakJuggleSpent < f.juggleSpent || f.peakJuggleSpent > def(f.kind).combat.juggleLimit) throw new Error(`${f.id} has invalid combat-spine counters`);
  const combat = def(f.kind).combat;
  if (f.tension < 0 || f.tension > combat.maxTension || f.burst < 0 || f.burst > combat.maxBurst || f.romanCancelTicks < 0 || f.burstTicks < 0 || f.tensionEarned < 0 || f.tensionSpent < 0) throw new Error(`${f.id} has invalid combat-system resources`);
  if (f.y < state.stage.ceilingY - EPSILON || f.y > state.stage.groundY + EPSILON) throw new Error(`${f.id} outside legal vertical stage bounds`);
}

// Confirmed choreography owns both participants, never the renderer. Anchors interpolate
// from actual contact positions, including corners; no arbitrary victim relocation.
function progressUltimate(state: MatchState) {
  const u = state.ultimateInteraction!;
  const a = state.fighters[u.attacker], d = state.fighters[u.defender];
  const t = ++u.tick, floor = state.stage.groundY;
  u.phase = t < 18 ? "confirm" : t < 42 ? "elbow" : t < 66 ? "knee" : t < 166 ? "charge" : t < 202 ? "beam" : "recovery";
  a.phaseTick = t; a.hitstop = d.hitstop = 0;
  const clampX = (x: number) => Math.max(state.stage.left + 34, Math.min(state.stage.right - 34, x));
  const mix = (x: number, y: number, k: number) => x + (y - x) * Math.max(0, Math.min(1, k));
  const carryX = clampX(u.defenderStartX + u.facing * 28);
  const farX = clampX(u.defenderStartX + u.facing * 240);
  d.x = t < 50 ? mix(u.defenderStartX, carryX, (t - 24) / 18) : mix(carryX, farX, (t - 50) / 50);
  d.y = t < 50 ? u.defenderStartY : t < 178 ? mix(u.defenderStartY, floor - 160, (t - 50) / 34)
    : mix(floor - 160, floor, (t - 178) / 24);
  d.grounded = d.y === floor; d.vx = d.vy = 0; d.hitstun = 2;
  d.phase = t >= 202 ? "knockdown" : "hit_reaction"; d.phaseTick = t < 50 ? t % 24 : t - 50;
  d.hitReactionWeight = "heavy"; d.blocking = d.crouchBlocking = false;
  // Release commits the beam's trajectory. The victim falls away after impact;
  // a held release pose must not visually steer its beam down after the target.
  if (t <= 166) u.beamTarget = { x: d.x, y: d.y - 70 };
  const beat = t === 24 ? [24, 50] : t === 50 ? [50, 60] : t === 178 ? [178, 130] : null;
  if (beat && !u.damageLedger.includes(beat[0])) {
    u.damageLedger.push(beat[0]);
    const damage = Math.round(beat[1] * u.entryScaling);
    d.health = Math.max(0, d.health - damage); d.hitCountTaken++;
    a.comboCount++; a.comboDamage += damage; a.comboRoute.push("legacy_crown_of_no_gods");
    a.damageScaling = Math.max(def(a.kind).combat.minimumDamageScaling, a.damageScaling - def(a.kind).combat.damageScalingStep);
    state.ultimateEventLedger!.push(`${u.id}:contact:${beat[0]}`);
    state.lastCombatEvent = { tick: state.tick, outcome: "hit", attacker: a.id, defender: d.id, attackId: "legacy_crown_of_no_gods",
      hitOrdinal: a.comboCount, damage, scaling: u.entryScaling, baseHitstun: 2, effectiveHitstun: 2, hitstunDecay: 0,
      juggleBefore: a.juggleSpent, juggleAfter: a.juggleSpent, juggleLimit: def(a.kind).combat.juggleLimit };
  }
  if (t === 166) state.ultimateEventLedger!.push(`${u.id}:beam-release`);
  if (t >= 240 || a.health <= 0 || d.health <= 0) {
    clearAttack(a); a.phase = "idle"; a.phaseTick = 0; a.vx = a.vy = 0;
    d.hitstun = 0; beginKnockdown(d, state, "hard"); d.vy = d.grounded ? 0 : 2;
    state.ultimateEventLedger!.push(`${u.id}:complete`); delete state.ultimateInteraction;
    resolvePush(a, d, state);
  }
}

export function tickWithFighterOrder(state: MatchState, inputs: { p1?: InputFrame; p2?: InputFrame } = {}, fighterOrder: readonly FighterId[] = ["p1", "p2"]): TickResult {
  if (fighterOrder.length !== 2 || new Set(fighterOrder).size !== 2 || !fighterOrder.includes("p1") || !fighterOrder.includes("p2")) throw new Error("fighterOrder must contain p1 and p2 exactly once");
  const p1Input = inputs.p1 || blankInput(), p2Input = inputs.p2 || blankInput();
  state.inputLog.push({ tick: state.tick, p1: clone(p1Input), p2: clone(p2Input) });
  const { p1, p2 } = state.fighters;
  const inputsById = { p1: p1Input, p2: p2Input };
  for (const id of fighterOrder) collectInput(state.fighters[id], inputsById[id], state.tick);
  if (state.ultimateInteraction) {
    progressUltimate(state);
    const checksum = checksumState(state); state.checksums.push(checksum); state.tick++;
    return { tick: state.tick, checksum, state };
  }

  resolveSystemActions(state);
  resolveThrowRequests(state);
  const throwParticipants = state.throwInteraction ? new Set<FighterId>([state.throwInteraction.attacker, state.throwInteraction.defender]) : new Set<FighterId>();
  const frozen: Record<FighterId, boolean> = { p1: p1.hitstop > 0, p2: p2.hitstop > 0 };
  const xBefore: Record<FighterId, number> = { p1: p1.x, p2: p2.x };
  for (const id of fighterOrder) processInput(state.fighters[id], state.fighters[id === "p1" ? "p2" : "p1"], state);
  // Snapshot before either clock advances: mirrored iteration orders must hold
  // and release the victim on precisely the same simulation tick.
  const heldTargets = new Set(fighterOrder.filter(id => heldByAscendHeavy(state.fighters[id], state)));
  for (const id of heldTargets) if (state.fighters[id].hitstop > 0) state.fighters[id].hitstop--;
  for (const id of fighterOrder) if (!throwParticipants.has(id) && !heldTargets.has(id)) progress(state.fighters[id], state);
  progressThrowInteraction(state);
  for (const id of fighterOrder) if (!throwParticipants.has(id)) integrate(state.fighters[id], state, frozen[id]);
  for (const id of fighterOrder) {
    const fighter = state.fighters[id];
    if (!frozen[id] && fighter.phase === "walk_forward" && (fighter.x - xBefore[id]) * fighter.facing > EPSILON) addTension(fighter, def(fighter.kind).combat.tensionGainPerForwardTick);
  }
  if (!throwParticipants.size) resolvePush(p1, p2, state);

  spawnProjectiles(state, frozen);
  const projectileProgress = progressProjectiles(state);

  // Candidates are collected from one shared snapshot. Applying one result cannot suppress a valid same-tick trade.
  const candidates = fighterOrder
    .map((id) => collectHitCandidate(state.fighters[id], state.fighters[id === "p1" ? "p2" : "p1"], frozen[id]))
    .filter((candidate): candidate is HitCandidate => !!candidate)
    .concat(projectileProgress.candidates)
    .sort((left, right) => left.attacker.id.localeCompare(right.attacker.id) || left.ledgerKey.localeCompare(right.ledgerKey));
  const resolutions = candidates.map((candidate) => {
    const entryScaling = candidate.attacker.damageScaling;
    return { candidate, entryScaling, connected: applyHit(candidate, state) };
  });
  for (const { candidate, connected } of resolutions) if (connected && !candidate.blocked) clearAttack(candidate.defender);
  for (const { candidate, connected, entryScaling } of resolutions) {
    const { attacker, defender, attack } = candidate;
    if (connected && !candidate.blocked && attack.id === "legacy_crown_of_no_gods"
      && attacker.currentAttack === attack.id && attacker.hitstun === 0 && attacker.health > 0 && defender.health > 0) {
      state.ultimateInteraction = {
        id: `${state.matchId}:crown:${attacker.id}:${attacker.currentMoveInstance}`,
        attacker: attacker.id, defender: defender.id, tick: 0, phase: "confirm", facing: attacker.attackFacing,
        attackerStartX: attacker.x, defenderStartX: defender.x, defenderStartY: defender.y,
        entryScaling,
        // Crown release drawing's authored double-palm socket, not a generic fighter dimension.
        beamOrigin: { x: attacker.x + attacker.attackFacing * 57, y: state.stage.groundY - 156 },
        beamTarget: { x: defender.x, y: defender.y - 70 }, damageLedger: [0]
      };
      state.ultimateEventLedger ??= [];
      state.ultimateEventLedger.push(`${state.ultimateInteraction.id}:palm`);
      attacker.hitstop = defender.hitstop = 0; attacker.vx = defender.vx = defender.vy = 0;
    }
  }
  for (const { candidate, connected } of resolutions) {
    const { attacker, defender, attack, hitbox, projectile } = candidate;
    if (!connected || candidate.blocked || projectile || !attack.hitConfirm || hitbox.id !== attack.hitConfirm.hitboxId
      || attacker.phase !== "attack" || attacker.currentAttack !== attack.id || attacker.hitstun > 0 || defender.health <= 0) continue;
    const sourceMoveInstance = attacker.currentMoveInstance;
    if (beginAttack(attacker, attack.id, state)) {
      attacker.ascendHeavyResponse = { triggerTick: state.tick, target: defender.id, sourceMoveInstance, responseMoveInstance: attacker.currentMoveInstance };
      defender.vx = 0; defender.vy = 0;
    }
  }

  if (state.projectiles) {
    const contacts = new Map(resolutions.filter(({ candidate }) => !!candidate.projectile).map((resolution) => [resolution.candidate.projectile!.id, resolution]));
    state.projectiles = state.projectiles.filter((projectile) => {
      const resolution = contacts.get(projectile.id);
      if (resolution) {
        emitProjectileEvent(state, projectile, resolution.connected ? resolution.candidate.blocked ? "block" : "hit" : "expired",
          resolution.connected ? undefined : "juggle_limit", resolution.candidate.defender.id);
        return false;
      }
      const reason = projectileProgress.expires.get(projectile.id);
      if (reason) { emitProjectileEvent(state, projectile, "expired", reason); return false; }
      const bounds = projectileWorldRect(projectile);
      if (![projectile.x, projectile.y, projectile.velocityX, projectile.velocityY, projectile.gravity, projectile.travelled].every(Number.isFinite)
        || bounds.x < state.stage.left - EPSILON || bounds.x + bounds.w > state.stage.right + EPSILON
        || bounds.y + bounds.h > state.stage.groundY + EPSILON
        || projectile.ageTicks >= projectile.lifeTicks || projectile.travelled > projectile.maxTravel + EPSILON) throw new Error("Invalid projectile state");
      return true;
    });
    if (contacts.size && !state.throwInteraction) resolvePush(p1, p2, state);
  }

  updateComboLifecycle(p1, p2);
  updateComboLifecycle(p2, p1);
  if (!state.throwInteraction && overlap(fighterPushbox(p1), fighterPushbox(p2))) throw new Error("fighter pushboxes overlap outside an authored throw interaction");
  assertValidState(p1, state);
  assertValidState(p2, state);
  const checksum = checksumState(state);
  state.checksums.push(checksum);
  state.tick++;
  return { tick: state.tick, checksum, state };
}

export function tick(state: MatchState, inputs: { p1?: InputFrame; p2?: InputFrame } = {}): TickResult { return tickWithFighterOrder(state, inputs); }

export function runTicks(state: MatchState, count: number, inputAt: (tick: number) => { p1?: InputFrame; p2?: InputFrame } = () => ({})): MatchState { for (let i = 0; i < count; i++) tick(state, inputAt(state.tick)); return state; }
