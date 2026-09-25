const assert = require('assert');
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const { createMatch, restoreSnapshot, saveSnapshot, tick, tickWithFighterOrder } = require('../dist');
const { defaultTuning } = require('../dist/data/fighters');

const LEGACY_GAME_SHA256 = 'D081DA2D907CF6ABD978301C1637008B26CCB30B47E2CCAFCA3FEA3331910C6B';

function makeAirRecovery(seed = 1200, facing = -1) {
  const state = createMatch(seed);
  Object.assign(state.fighters.p1, {
    x: -60,
    facing: 1,
    comboCount: 4,
    comboDamage: 155,
    comboRoute: ['standing_light', 'standing_medium', 'crouching_heavy', 'air_light'],
    comboTarget: 'p2',
    damageScaling: 0.68,
    juggleSpent: 3,
    peakJuggleSpent: 3
  });
  Object.assign(state.fighters.p2, {
    x: 60,
    y: -100,
    vx: 2,
    vy: 1,
    facing,
    grounded: false,
    phase: 'air_recovery',
    phaseTick: 0,
    hitstun: 0,
    airRecoveryTicks: defaultTuning.combat.airRecoveryDelay,
    airRecoveryCount: 0
  });
  return state;
}

function testRecoveryRulesAreDataDrivenWithoutChangingAcceptedCadence() {
  assert.deepStrictEqual({
    airRecoveryDelay: defaultTuning.combat.airRecoveryDelay,
    airTechInvuln: defaultTuning.combat.airTechInvuln,
    airTechHorizontalSpeed: defaultTuning.combat.airTechHorizontalSpeed,
    airTechVerticalSpeed: defaultTuning.combat.airTechVerticalSpeed,
    softKnockdownTicks: defaultTuning.combat.softKnockdownTicks,
    hardKnockdownTicks: defaultTuning.combat.hardKnockdownTicks,
    getupTicks: defaultTuning.combat.getupTicks,
    landingRecovery: defaultTuning.lamuh_proto.landingRecovery,
    juggleLimit: defaultTuning.combat.juggleLimit,
    minimumAirHitstun: defaultTuning.combat.minimumAirHitstun
  }, {
    airRecoveryDelay: 6,
    airTechInvuln: 10,
    airTechHorizontalSpeed: 5.5,
    airTechVerticalSpeed: -5.5,
    softKnockdownTicks: 26,
    hardKnockdownTicks: 42,
    getupTicks: 18,
    landingRecovery: 5,
    juggleLimit: 8,
    minimumAirHitstun: 12
  });
}

function testDirectionalAirTechBreaksTheComboAndMovesSafely() {
  const backward = makeAirRecovery(1201, -1);
  tick(backward, { p2: { right: true } });
  const recovered = backward.fighters.p2;
  assert.strictEqual(recovered.phase, 'jump');
  assert.strictEqual(recovered.lastAirTechDirection, 'backward');
  assert.strictEqual(recovered.vx, defaultTuning.combat.airTechHorizontalSpeed);
  assert.ok(recovered.vy < 0);
  assert.strictEqual(recovered.airTechInvuln, defaultTuning.combat.airTechInvuln);
  assert.deepStrictEqual(recovered.recoveryEvent, {
    tick: 0,
    type: 'air_tech',
    durationTicks: 10,
    direction: 'backward',
    automatic: false
  });
  assert.strictEqual(backward.fighters.p1.comboCount, 0, 'a successful air tech must end the old combo immediately');

  const mirroredForward = makeAirRecovery(1202, 1);
  tick(mirroredForward, { p2: { right: true } });
  assert.strictEqual(mirroredForward.fighters.p2.lastAirTechDirection, 'forward');
  assert.strictEqual(mirroredForward.fighters.p2.vx, defaultTuning.combat.airTechHorizontalSpeed);
}

function testAirTechInvulnerabilityRejectsImmediateRehit() {
  const state = makeAirRecovery(1203, -1);
  Object.assign(state.fighters.p1, {
    x: -40,
    y: -100,
    vy: 0,
    grounded: false,
    phase: 'attack',
    phaseTick: 2,
    currentAttack: 'air_light',
    attackFacing: 1,
    airActionsRemaining: 2,
    comboCount: 0,
    comboDamage: 0,
    comboRoute: [],
    comboTarget: null,
    juggleSpent: 0,
    peakJuggleSpent: 0
  });
  Object.assign(state.fighters.p2, { x: 30, y: -100, vy: 0 });
  const health = state.fighters.p2.health;
  tick(state, { p2: { block: true } });
  assert.strictEqual(state.fighters.p2.recoveryEvent.type, 'air_tech');
  assert.strictEqual(state.fighters.p2.health, health);
  assert.strictEqual(state.lastCombatEvent, null, 'the tech-invulnerable fighter cannot be immediately re-hit');
}

function testAutomaticNeutralTechOccursAfterSixTicks() {
  const state = makeAirRecovery(1204);
  for (let index = 0; index < defaultTuning.combat.airRecoveryDelay - 1; index++) tick(state, {});
  assert.strictEqual(state.fighters.p2.phase, 'air_recovery');
  assert.strictEqual(state.fighters.p2.airRecoveryTicks, 1);
  tick(state, {});
  assert.strictEqual(state.fighters.p2.phase, 'jump');
  assert.strictEqual(state.fighters.p2.lastAirTechDirection, 'neutral');
  assert.strictEqual(state.fighters.p2.recoveryEvent.automatic, true);
  assert.strictEqual(state.fighters.p1.comboCount, 0);
}

function testMissedTechAndAirborneHitstunLandInSoftKnockdown() {
  const missed = makeAirRecovery(1205);
  Object.assign(missed.fighters.p2, { y: -1, vy: 2, dummyMode: 'no_recovery' });
  tick(missed, {});
  assert.deepStrictEqual({
    phase: missed.fighters.p2.phase,
    grounded: missed.fighters.p2.grounded,
    kind: missed.fighters.p2.knockdownKind,
    ticks: missed.fighters.p2.knockdownTicks,
    event: missed.fighters.p2.recoveryEvent.type
  }, { phase: 'knockdown', grounded: true, kind: 'soft', ticks: 26, event: 'knockdown' });

  const stillStunned = makeAirRecovery(1206);
  Object.assign(stillStunned.fighters.p2, { y: -1, vy: 2, phase: 'hit_reaction', hitstun: 5, airRecoveryTicks: 0 });
  tick(stillStunned, {});
  assert.strictEqual(stillStunned.fighters.p2.phase, 'knockdown');
  assert.strictEqual(stillStunned.fighters.p2.hitstun, 0);
  assert.strictEqual(stillStunned.fighters.p2.knockdownKind, 'soft');
  assert.strictEqual(stillStunned.fighters.p2.knockdownTicks, 26);
}

function testLandingRecoveryCannotBeInputCanceled() {
  const state = createMatch(1207);
  Object.assign(state.fighters.p1, { y: -1, vy: 2, grounded: false, phase: 'jump', phaseTick: 0, airActionsRemaining: 3 });
  tick(state, {});
  assert.strictEqual(state.fighters.p1.phase, 'landing');
  assert.deepStrictEqual(state.fighters.p1.recoveryEvent, { tick: 0, type: 'landing_recovery', durationTicks: 5 });

  tick(state, { p1: { light: true } });
  assert.strictEqual(state.fighters.p1.currentAttack, null, 'landing recovery must lock attacks');
  for (let index = 0; index < 4; index++) tick(state, {});
  assert.strictEqual(state.fighters.p1.phase, 'idle');
  tick(state, { p1: { light: true } });
  assert.strictEqual(state.fighters.p1.currentAttack, 'standing_light');
}

function testSoftKnockdownCompletesGetupAndClearsItsKind() {
  const state = makeAirRecovery(1208);
  Object.assign(state.fighters.p2, { y: -1, vy: 2, dummyMode: 'no_recovery' });
  tick(state, {});
  for (let index = 0; index < defaultTuning.combat.softKnockdownTicks; index++) tick(state, {});
  assert.strictEqual(state.fighters.p2.phase, 'getup');
  assert.strictEqual(state.fighters.p2.getupTicks, defaultTuning.combat.getupTicks);
  for (let index = 0; index < defaultTuning.combat.getupTicks; index++) tick(state, {});
  assert.strictEqual(state.fighters.p2.phase, 'idle');
  assert.strictEqual(state.fighters.p2.knockdownKind, 'none');
  assert.strictEqual(state.fighters.p2.wakeupInvuln, defaultTuning.lamuh_proto.wakeupInvuln + 1,
    'the release tick is protected without consuming an actionable tick');
}

function makeWokenPair(seed, kind = 'soft') {
  const state = createMatch(seed, { p2Kind: 'lamuh_proto' });
  const knockdownTicks = kind === 'hard' ? defaultTuning.combat.hardKnockdownTicks : defaultTuning.combat.softKnockdownTicks;
  Object.assign(state.fighters.p2, { phase: 'knockdown', knockdownKind: kind, knockdownTicks });
  for (let index = 0; index < knockdownTicks; index++) tick(state, {});
  assert.strictEqual(state.fighters.p2.phase, 'getup');
  for (let index = 0; index < defaultTuning.combat.getupTicks; index++) tick(state, {});
  assert.strictEqual(state.fighters.p2.phase, 'idle');
  return state;
}

function testActionableWakeupRejectsStrikeThenExpires() {
  const state = makeWokenPair(1210);
  const attacker = state.fighters.p1, defender = state.fighters.p2;
  Object.assign(attacker, { x: -35, facing: 1, attackFacing: 1, phase: 'attack', phaseTick: 2,
    currentAttack: 'standing_light', hitLedger: {} });
  Object.assign(defender, { x: 35, facing: -1 });
  const health = defender.health;
  tick(state, { p2: { right: true } });
  assert.ok(defender.x > 35, 'the defender can retreat during wake-up protection');
  assert.strictEqual(defender.health, health, 'a meaty strike cannot restart the combo on the first actionable tick');
  assert.strictEqual(defender.wakeupInvuln, defaultTuning.lamuh_proto.wakeupInvuln);

  for (let index = 0; index < defaultTuning.lamuh_proto.wakeupInvuln; index++) tick(state, {});
  assert.strictEqual(defender.wakeupInvuln, 0);
  Object.assign(attacker, { x: -35, facing: 1, attackFacing: 1, phase: 'attack', phaseTick: 2,
    currentAttack: 'standing_light', hitLedger: {} });
  Object.assign(defender, { x: 35, phase: 'idle' });
  tick(state, {});
  assert.ok(defender.health < health, 'ordinary strikes connect again after protection expires');
}

function testActionableWakeupRejectsThrowAndAllowsAttack() {
  const throwState = makeWokenPair(1211);
  Object.assign(throwState.fighters.p1, { x: -31, facing: 1 });
  Object.assign(throwState.fighters.p2, { x: 31, facing: -1 });
  const health = throwState.fighters.p2.health;
  tick(throwState, { p1: { throw: true }, p2: { right: true } });
  assert.ok(throwState.fighters.p2.x > 31, 'a pending throw cannot pin a protected defender');
  for (let index = 0; index < 5; index++) tick(throwState, {});
  assert.strictEqual(throwState.lastThrowEvent.type, 'whiff', 'a wake-up throw must miss');
  assert.strictEqual(throwState.fighters.p2.health, health);

  const attackState = makeWokenPair(1212);
  tick(attackState, { p1: { throw: true }, p2: { light: true } });
  assert.strictEqual(attackState.fighters.p2.currentAttack, 'standing_light',
    'the defender can start an attack into a pending throw');
  assert.ok(attackState.fighters.p2.wakeupInvuln > 0);

  const hardState = makeWokenPair(1213, 'hard');
  assert.strictEqual(hardState.fighters.p2.wakeupInvuln, defaultTuning.lamuh_proto.wakeupInvuln + 1,
    'hard knockdown grants the same actionable wake-up window');
}

function testSimultaneousTechIsOrderIndependentAndSerializable() {
  const normal = createMatch(1209);
  const reversed = createMatch(1209);
  for (const state of [normal, reversed]) {
    Object.assign(state.fighters.p1, { x: -120, y: -100, grounded: false, phase: 'air_recovery', airRecoveryTicks: 6, facing: 1, comboCount: 1, comboTarget: 'p2' });
    Object.assign(state.fighters.p2, { x: 120, y: -100, grounded: false, phase: 'air_recovery', airRecoveryTicks: 6, facing: -1, comboCount: 1, comboTarget: 'p1' });
  }
  const input = { p1: { right: true }, p2: { left: true } };
  tickWithFighterOrder(normal, input, ['p1', 'p2']);
  tickWithFighterOrder(reversed, input, ['p2', 'p1']);
  assert.deepStrictEqual(reversed, normal);
  assert.deepStrictEqual(restoreSnapshot(saveSnapshot(normal)), normal);
}

function testPlaytestExposesReadableComboAndTechStatus() {
  const source = fs.readFileSync(path.join(__dirname, '..', 'src', 'debug', 'main.ts'), 'utf8');
  for (const required of ['combo-readout', 'recovery-readout', 'Dummy Tech Back', 'Dummy Tech Neutral', 'Dummy Tech Forward', 'TECH WINDOW', 'AIR TECH', 'GETUP']) {
    assert.ok(source.includes(required), `playtest must expose ${required}`);
  }
}

function testLegacyGameRemainsUntouched() {
  const bytes = fs.readFileSync(path.join(__dirname, '..', '..', 'game.js'));
  assert.strictEqual(crypto.createHash('sha256').update(bytes).digest('hex').toUpperCase(), LEGACY_GAME_SHA256);
}

const tests = [
  testRecoveryRulesAreDataDrivenWithoutChangingAcceptedCadence,
  testDirectionalAirTechBreaksTheComboAndMovesSafely,
  testAirTechInvulnerabilityRejectsImmediateRehit,
  testAutomaticNeutralTechOccursAfterSixTicks,
  testMissedTechAndAirborneHitstunLandInSoftKnockdown,
  testLandingRecoveryCannotBeInputCanceled,
  testSoftKnockdownCompletesGetupAndClearsItsKind,
  testActionableWakeupRejectsStrikeThenExpires,
  testActionableWakeupRejectsThrowAndAllowsAttack,
  testSimultaneousTechIsOrderIndependentAndSerializable,
  testPlaytestExposesReadableComboAndTechStatus,
  testLegacyGameRemainsUntouched
];

for (const test of tests) {
  test();
  console.log(`PASS ${test.name}`);
}
