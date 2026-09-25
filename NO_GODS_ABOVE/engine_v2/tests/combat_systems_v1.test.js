const assert = require('assert');
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const { createMatch, executeReplay, recordReplay, restoreSnapshot, saveSnapshot, tick, tickWithFighterOrder } = require('../dist');
const { defaultTuning } = require('../dist/data/fighters');

const LEGACY_GAME_SHA256 = 'D081DA2D907CF6ABD978301C1637008B26CCB30B47E2CCAFCA3FEA3331910C6B';

function advanceUntil(state, predicate, max = 180, inputAt = () => ({})) {
  for (let index = 0; index < max; index++) {
    tick(state, inputAt(index));
    if (predicate(state)) return index + 1;
  }
  throw new Error(`condition not reached within ${max} ticks: ${JSON.stringify({ tick: state.tick, p1: state.fighters.p1, p2: state.fighters.p2, event: state.lastSystemEvent })}`);
}

function close(state) {
  Object.assign(state.fighters.p1, { x: -50, facing: 1 });
  Object.assign(state.fighters.p2, { x: 50, facing: -1 });
}

function waitForHit(state, count = 1, max = 60) {
  advanceUntil(state, (current) => current.fighters.p1.comboCount >= count, max);
}

function waitOutHitstop(state, fighterId = 'p1') {
  advanceUntil(state, (current) => current.fighters[fighterId].hitstop === 0, 30);
}

function firstLightHit(seed = 1001) {
  const state = createMatch(seed);
  close(state);
  tick(state, { p1: { light: true } });
  waitForHit(state);
  return state;
}

function testCombatSystemsAreDataDrivenAndStartHonest() {
  assert.deepStrictEqual({
    maxTension: defaultTuning.combat.maxTension,
    tensionGainPerForwardTick: defaultTuning.combat.tensionGainPerForwardTick,
    tensionGainOnHit: defaultTuning.combat.tensionGainOnHit,
    tensionGainOnBlock: defaultTuning.combat.tensionGainOnBlock,
    romanCancelCost: defaultTuning.combat.romanCancelCost,
    romanCancelFreezeTicks: defaultTuning.combat.romanCancelFreezeTicks,
    romanCancelRecoveryTicks: defaultTuning.combat.romanCancelRecoveryTicks,
    romanCancelAirActionRefund: defaultTuning.combat.romanCancelAirActionRefund,
    maxBurst: defaultTuning.combat.maxBurst,
    burstCost: defaultTuning.combat.burstCost,
    burstFreezeTicks: defaultTuning.combat.burstFreezeTicks,
    burstRecoveryTicks: defaultTuning.combat.burstRecoveryTicks,
    burstHitstun: defaultTuning.combat.burstHitstun,
    burstPushback: defaultTuning.combat.burstPushback
  }, {
    maxTension: 100, tensionGainPerForwardTick: 2, tensionGainOnHit: 16, tensionGainOnBlock: 5,
    romanCancelCost: 50, romanCancelFreezeTicks: 8, romanCancelRecoveryTicks: 4, romanCancelAirActionRefund: 1,
    maxBurst: 100, burstCost: 100, burstFreezeTicks: 6, burstRecoveryTicks: 20, burstHitstun: 18, burstPushback: 12
  });
  const state = createMatch(1000);
  assert.deepStrictEqual({ tension: state.fighters.p1.tension, burst: state.fighters.p1.burst }, { tension: 0, burst: 100 });
}

function testTensionRequiresForwardMovementOrContact() {
  const movement = createMatch(1002);
  const beforeX = movement.fighters.p1.x;
  tick(movement, { p1: { right: true } });
  assert.ok(movement.fighters.p1.x > beforeX);
  assert.strictEqual(movement.fighters.p1.tension, 2);

  const hit = firstLightHit(1003);
  assert.strictEqual(hit.fighters.p1.tension, 16);

  const block = createMatch(1004);
  close(block);
  block.fighters.p2.dummyMode = 'stand_block';
  tick(block, { p1: { light: true } });
  advanceUntil(block, (current) => current.lastCombatEvent?.outcome === 'block');
  assert.strictEqual(block.fighters.p1.tension, 5);
  assert.strictEqual(block.fighters.p2.health, 1000);
}

function testEarnedRomanCancelExtendsWithoutResettingCombo() {
  const state = firstLightHit(1005);
  const attacker = state.fighters.p1;
  attacker.tension = 50;
  attacker.tensionEarned = 50;
  waitOutHitstop(state);
  const scalingBefore = attacker.damageScaling;
  tick(state, { p1: { romanCancel: true } });
  assert.strictEqual(state.lastSystemEvent.system, 'roman_cancel');
  assert.strictEqual(state.lastSystemEvent.outcome, 'activated');
  assert.strictEqual(attacker.tension, 0);
  assert.strictEqual(attacker.tensionSpent, 50);
  assert.strictEqual(attacker.romanCancelCount, 1);
  assert.strictEqual(attacker.comboCount, 1);
  assert.strictEqual(attacker.damageScaling, scalingBefore);
  assert.strictEqual(attacker.currentAttack, null);
  assert.ok(state.fighters.p2.hitstop > attacker.romanCancelTicks);

  advanceUntil(state, (current) => current.fighters.p1.phase === 'idle', 12);
  tick(state, { p1: { light: true } });
  waitForHit(state, 2);
  assert.deepStrictEqual(attacker.comboRoute, ['standing_light', 'standing_light']);
}

function testDisplayedRomanCancelRouteUsesNaturallyEarnedTension() {
  const state = createMatch(1013);
  advanceUntil(state, (current) => Math.abs(current.fighters.p2.x - current.fighters.p1.x) <= 104, 30, () => ({ p1: { right: true } }));
  tick(state, {});
  tick(state, { p1: { light: true } });
  waitForHit(state, 1);
  tick(state, { p1: { medium: true } });
  waitForHit(state, 2);
  waitOutHitstop(state);
  const tensionBefore = state.fighters.p1.tension;
  assert.ok(tensionBefore >= 50, `displayed setup must naturally earn Roman Cancel meter, got ${tensionBefore}`);
  tick(state, { p1: { romanCancel: true } });
  assert.strictEqual(state.lastSystemEvent.outcome, 'activated');
  assert.strictEqual(state.fighters.p1.tension, tensionBefore - 50);
  advanceUntil(state, (current) => current.fighters.p1.phase === 'idle', 12);

  tick(state, { p1: { down: true, heavy: true } });
  waitForHit(state, 3);
  waitOutHitstop(state);

  tick(state, { p1: { up: true, right: true } });
  advanceUntil(state, (current) => !current.fighters.p1.grounded, 20, () => ({ p1: { right: true } }));
  tick(state, { p1: { light: true, right: true } });
  waitForHit(state, 4, 60);
  tick(state, { p1: { medium: true, right: true } });
  waitForHit(state, 5, 60);
  tick(state, { p1: { heavy: true, right: true } });
  waitForHit(state, 6, 60);
  waitOutHitstop(state);
  tick(state, { p1: { special: true, heavy: true, right: true } });
  waitForHit(state, 7, 60);
  assert.deepStrictEqual(state.fighters.p1.comboRoute, ['standing_light', 'standing_medium', 'crouching_heavy', 'air_light', 'air_medium', 'air_heavy', 'air_special_ender']);
  assert.strictEqual(state.fighters.p1.comboDamage, 271);
  assert.strictEqual(state.fighters.p1.juggleSpent, 8);
  assert.strictEqual(state.fighters.p1.romanCancelCount, 1);
}

function testRomanCancelRejectsRawAndInsufficientUse() {
  const raw = createMatch(1006);
  raw.fighters.p1.tension = 100;
  tick(raw, { p1: { romanCancel: true } });
  assert.deepStrictEqual({ outcome: raw.lastSystemEvent.outcome, reason: raw.lastSystemEvent.reason, tension: raw.fighters.p1.tension }, { outcome: 'rejected', reason: 'invalid_state', tension: 100 });

  const insufficient = firstLightHit(1007);
  insufficient.fighters.p1.tension = 49;
  waitOutHitstop(insufficient);
  tick(insufficient, { p1: { romanCancel: true } });
  assert.deepStrictEqual({ outcome: insufficient.lastSystemEvent.outcome, reason: insufficient.lastSystemEvent.reason, tension: insufficient.fighters.p1.tension, count: insufficient.fighters.p1.romanCancelCount }, { outcome: 'rejected', reason: 'insufficient_resource', tension: 49, count: 0 });
}

function testAirRomanCancelRefundsOneActionOnly() {
  const state = createMatch(1008);
  Object.assign(state.fighters.p1, { x: -40, y: -150, vy: -2, grounded: false, phase: 'jump', airActionsRemaining: 1, tension: 50 });
  Object.assign(state.fighters.p2, { x: 40, y: -145, vy: -2, grounded: false, phase: 'jump' });
  tick(state, { p1: { light: true } });
  waitForHit(state);
  assert.strictEqual(state.fighters.p1.airActionsRemaining, 0);
  waitOutHitstop(state);
  const scalingBefore = state.fighters.p1.damageScaling;
  const juggleBefore = state.fighters.p1.juggleSpent;
  tick(state, { p1: { romanCancel: true } });
  assert.strictEqual(state.lastSystemEvent.outcome, 'activated');
  assert.strictEqual(state.fighters.p1.airActionsRemaining, 1);
  assert.strictEqual(state.fighters.p1.damageScaling, scalingBefore);
  assert.strictEqual(state.fighters.p1.juggleSpent, juggleBefore);
}

function testBurstEscapesHitstunWithoutDamage() {
  const state = firstLightHit(1009);
  waitOutHitstop(state, 'p2');
  const defender = state.fighters.p2;
  const attacker = state.fighters.p1;
  const attackerHealth = attacker.health;
  assert.ok(defender.hitstun > 0);
  tick(state, { p2: { burst: true } });
  assert.deepStrictEqual({ system: state.lastSystemEvent.system, outcome: state.lastSystemEvent.outcome, before: state.lastSystemEvent.resourceBefore, after: state.lastSystemEvent.resourceAfter }, { system: 'burst', outcome: 'activated', before: 100, after: 0 });
  assert.strictEqual(defender.hitstun, 0);
  assert.strictEqual(defender.burst, 0);
  assert.strictEqual(defender.burstCount, 1);
  assert.strictEqual(defender.phase, 'burst');
  assert.strictEqual(attacker.health, attackerHealth, 'Burst is a zero-damage combo escape');
  assert.strictEqual(attacker.comboCount, 0);
  assert.strictEqual(attacker.currentAttack, null);
  assert.strictEqual(attacker.hitstun, defaultTuning.combat.burstHitstun);
}

function testBurstWorksFromBlockstunAndCannotRepeatEmpty() {
  const state = createMatch(1010);
  close(state);
  Object.assign(state.fighters.p2, { blockstun: 8, phase: 'block', burst: 100 });
  tick(state, { p2: { burst: true } });
  assert.strictEqual(state.lastSystemEvent.outcome, 'activated');
  assert.strictEqual(state.fighters.p2.burst, 0);

  Object.assign(state.fighters.p2, { hitstop: 0, hitstun: 5, blockstun: 0, phase: 'hit_reaction', burstTicks: 0 });
  Object.assign(state.fighters.p1, { hitstop: 0, hitstun: 0, phase: 'idle' });
  tick(state, {});
  tick(state, { p2: { burst: true } });
  assert.deepStrictEqual({ outcome: state.lastSystemEvent.outcome, reason: state.lastSystemEvent.reason, burst: state.fighters.p2.burst, count: state.fighters.p2.burstCount }, { outcome: 'rejected', reason: 'insufficient_resource', burst: 0, count: 1 });
}

function testSystemResolutionIsOrderIndependentAndCornerBounded() {
  const normal = createMatch(1011);
  const reversed = createMatch(1011);
  for (const state of [normal, reversed]) {
    Object.assign(state.fighters.p1, { x: 330, facing: 1, phase: 'attack', currentAttack: 'standing_light', attackConnected: true, tension: 50 });
    Object.assign(state.fighters.p2, { x: 410, facing: -1, hitstun: 8, phase: 'hit_reaction' });
  }
  tickWithFighterOrder(normal, { p1: { romanCancel: true }, p2: { burst: true } }, ['p1', 'p2']);
  tickWithFighterOrder(reversed, { p1: { romanCancel: true }, p2: { burst: true } }, ['p2', 'p1']);
  assert.deepStrictEqual(reversed, normal);
  for (let index = 0; index < 30; index++) tick(normal, {});
  for (const fighter of Object.values(normal.fighters)) assert.ok(fighter.x >= normal.stage.left && fighter.x <= normal.stage.right);
}

function testSystemReplayAndSnapshotAreDeterministic() {
  const state = createMatch(1012);
  advanceUntil(state, (current) => Math.abs(current.fighters.p2.x - current.fighters.p1.x) <= 100, 30, () => ({ p1: { right: true } }));
  tick(state, {});
  tick(state, { p1: { light: true } });
  waitForHit(state);
  waitOutHitstop(state, 'p2');
  tick(state, { p2: { burst: true } });
  const replay = recordReplay(state);
  const replayed = executeReplay(replay);
  assert.deepStrictEqual(replayed.checksums, state.checksums);
  assert.strictEqual(replayed.lastSystemEvent.system, 'burst');
  assert.deepStrictEqual(restoreSnapshot(saveSnapshot(state)), state);
}

function testLegacyGameRemainsUntouched() {
  const bytes = fs.readFileSync(path.join(__dirname, '..', '..', 'game.js'));
  assert.strictEqual(crypto.createHash('sha256').update(bytes).digest('hex').toUpperCase(), LEGACY_GAME_SHA256);
}

const tests = [
  testCombatSystemsAreDataDrivenAndStartHonest,
  testTensionRequiresForwardMovementOrContact,
  testEarnedRomanCancelExtendsWithoutResettingCombo,
  testDisplayedRomanCancelRouteUsesNaturallyEarnedTension,
  testRomanCancelRejectsRawAndInsufficientUse,
  testAirRomanCancelRefundsOneActionOnly,
  testBurstEscapesHitstunWithoutDamage,
  testBurstWorksFromBlockstunAndCannotRepeatEmpty,
  testSystemResolutionIsOrderIndependentAndCornerBounded,
  testSystemReplayAndSnapshotAreDeterministic,
  testLegacyGameRemainsUntouched
];

for (const test of tests) {
  test();
  console.log(`PASS ${test.name}`);
}
