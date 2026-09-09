const assert = require('assert');
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const { createMatch, executeReplay, recordReplay, restoreSnapshot, saveSnapshot, tick } = require('../dist');
const { defaultTuning } = require('../dist/data/fighters');

const LEGACY_GAME_SHA256 = 'D081DA2D907CF6ABD978301C1637008B26CCB30B47E2CCAFCA3FEA3331910C6B';
const EXPECTED_ROUTE = ['standing_light', 'standing_medium', 'crouching_heavy', 'air_light', 'air_medium', 'air_heavy', 'air_special_ender'];

function advanceUntil(state, predicate, max = 180, inputAt = () => ({})) {
  for (let index = 0; index < max; index++) {
    tick(state, inputAt(index));
    if (predicate(state)) return index + 1;
  }
  throw new Error(`condition not reached within ${max} ticks at simulation tick ${state.tick}: ${JSON.stringify({ p1: state.fighters.p1, p2: state.fighters.p2, lastCombatEvent: state.lastCombatEvent })}`);
}

function waitForComboHit(state, count, max = 90, inputAt = () => ({})) {
  return advanceUntil(state, (current) => current.fighters.p1.comboCount >= count, max, inputAt);
}

function waitOutAttackerHitstop(state) {
  advanceUntil(state, (current) => current.fighters.p1.hitstop === 0, 30);
}

function moveIntoRecordedRange(state) {
  // The full-startup launcher route needs close confirm spacing; wider low-route
  // pushback whiffs are covered separately in gameplay_kernel_repair.test.js.
  advanceUntil(state, (current) => Math.abs(current.fighters.p2.x - current.fighters.p1.x) <= 96, 30, () => ({ p1: { right: true } }));
  tick(state, {});
}

function runCombatSpineRoute(seed = 900, options = {}) {
  const state = createMatch(seed);
  if (options.positions) {
    Object.assign(state.fighters.p1, { x: options.positions[0], facing: options.facing ?? 1 });
    Object.assign(state.fighters.p2, { x: options.positions[1], facing: (options.facing ?? 1) * -1 });
  } else {
    moveIntoRecordedRange(state);
  }
  const forward = state.fighters.p1.facing === 1 ? { right: true } : { left: true };

  tick(state, { p1: { light: true } });
  waitForComboHit(state, 1);
  tick(state, { p1: { medium: true } });
  waitForComboHit(state, 2);
  tick(state, { p1: { down: true, heavy: true } });
  waitForComboHit(state, 3);
  waitOutAttackerHitstop(state);

  tick(state, { p1: { up: true, ...forward } });
  advanceUntil(state, (current) => !current.fighters.p1.grounded, 20, () => ({ p1: forward }));
  if (process.env.TRACE_COMBAT_SPINE) console.log('TRACE before air light', JSON.stringify({ tick: state.tick, p1: state.fighters.p1, p2: state.fighters.p2 }));
  tick(state, { p1: { light: true, ...forward } });
  waitForComboHit(state, 4, 60, () => ({ p1: forward }));
  tick(state, { p1: { medium: true, ...forward } });
  waitForComboHit(state, 5, 60, () => ({ p1: forward }));
  tick(state, { p1: { heavy: true, ...forward } });
  waitForComboHit(state, 6, 60, () => ({ p1: forward }));
  waitOutAttackerHitstop(state);
  if (process.env.TRACE_COMBAT_SPINE) console.log('TRACE before air special', JSON.stringify({ tick: state.tick, p1: state.fighters.p1, p2: state.fighters.p2, event: state.lastCombatEvent }));
  tick(state, { p1: { special: true, heavy: true, ...forward } });
  waitForComboHit(state, 7, 60, () => ({ p1: forward }));
  return state;
}

function makeAirPair(seed = 940) {
  const state = createMatch(seed);
  Object.assign(state.fighters.p1, { x: -40, y: -170, vx: 0, vy: -3, grounded: false, phase: 'jump', phaseTick: 0, airActionsRemaining: defaultTuning.combat.airActionBudget });
  Object.assign(state.fighters.p2, { x: 40, y: -160, vx: 0, vy: -3, grounded: false, phase: 'jump', phaseTick: 0, hitstun: 0, blockstun: 0, knockdownTicks: 0, getupTicks: 0 });
  return state;
}

function testExactGroundToAirSpecialRoute() {
  const state = runCombatSpineRoute();
  const attacker = state.fighters.p1;
  const defender = state.fighters.p2;
  assert.deepStrictEqual(attacker.comboRoute, EXPECTED_ROUTE);
  assert.strictEqual(attacker.comboCount, 7);
  assert.strictEqual(attacker.comboDamage, 271);
  assert.strictEqual(attacker.juggleSpent, 8);
  assert.strictEqual(attacker.peakJuggleSpent, 8);
  assert.strictEqual(attacker.airActionsRemaining, 2, 'the accepted three-normal route leaves two actions for the longer alternating route');
  assert.strictEqual(defender.phase, 'knockdown');
  assert.strictEqual(defender.knockdownTicks, 42);
  assert.strictEqual(state.lastCombatEvent.attackId, 'air_special_ender');
  assert.strictEqual(state.lastCombatEvent.outcome, 'hit');
}

function testCombatRulesAreDataDriven() {
  const combatSpine = defaultTuning.combat;
  assert.deepStrictEqual({
    airActionBudget: combatSpine.airActionBudget,
    juggleLimit: combatSpine.juggleLimit,
    hitstunDecayStartsAtHit: combatSpine.hitstunDecayStartsAtHit,
    hitstunDecayPerHit: combatSpine.hitstunDecayPerHit,
    airborneHitstunBonus: combatSpine.airborneHitstunBonus,
    minimumAirHitstun: combatSpine.minimumAirHitstun,
    airRecoveryDelay: combatSpine.airRecoveryDelay,
    damageScalingStep: combatSpine.damageScalingStep,
    minimumDamageScaling: combatSpine.minimumDamageScaling
  }, {
    airActionBudget: 5,
    juggleLimit: 8,
    hitstunDecayStartsAtHit: 4,
    hitstunDecayPerHit: 2,
    airborneHitstunBonus: 8,
    minimumAirHitstun: 12,
    airRecoveryDelay: 6,
    damageScalingStep: 0.08,
    minimumDamageScaling: 0.5
  });
  assert.deepStrictEqual(defaultTuning.attacks.standing_medium.cancel.onHit, ['standing_heavy', 'crouching_heavy']);
  assert.deepStrictEqual(defaultTuning.attacks.air_medium.cancel.onHit, ['air_light', 'air_heavy']);
  assert.deepStrictEqual(defaultTuning.attacks.air_heavy.cancel.onHit, ['air_special_ender']);
  assert.strictEqual(defaultTuning.attacks.air_special_ender.airActionCost, 0);
  assert.strictEqual(defaultTuning.attacks.air_special_ender.cancelOnly, true);
  assert.strictEqual(defaultTuning.attacks.air_special_ender.systemTestOnly, true);
}

function testHitstunDecayAndFloor() {
  const decayed = makeAirPair(941);
  Object.assign(decayed.fighters.p1, { comboCount: 3, comboTarget: 'p2', comboRoute: ['standing_light', 'standing_medium', 'crouching_heavy'], damageScaling: 0.76 });
  tick(decayed, { p1: { light: true } });
  waitForComboHit(decayed, 4);
  assert.deepStrictEqual({ base: decayed.lastCombatEvent.baseHitstun, decay: decayed.lastCombatEvent.hitstunDecay, effective: decayed.lastCombatEvent.effectiveHitstun }, { base: 13, decay: 2, effective: 19 });

  const floored = makeAirPair(942);
  Object.assign(floored.fighters.p1, { comboCount: 10, comboTarget: 'p2', comboRoute: Array(10).fill('air_light'), damageScaling: 0.5 });
  tick(floored, { p1: { light: true } });
  waitForComboHit(floored, 11);
  assert.strictEqual(floored.lastCombatEvent.hitstunDecay, 16);
  assert.strictEqual(floored.lastCombatEvent.effectiveHitstun, 12, 'air hitstun cannot decay below the configured floor');
}

function testAirborneBonusDoesNotSlowGroundedHitstun() {
  const grounded = createMatch(952);
  Object.assign(grounded.fighters.p1, { x: -35, facing: 1 });
  Object.assign(grounded.fighters.p2, { x: 35, facing: -1, grounded: true, y: 0, phase: 'idle' });
  tick(grounded, { p1: { light: true } });
  waitForComboHit(grounded, 1);
  assert.strictEqual(grounded.lastCombatEvent.effectiveHitstun, 12, 'grounded hitstun stays at the authored move value');

  const airborne = makeAirPair(953);
  tick(airborne, { p1: { light: true } });
  waitForComboHit(airborne, 1);
  assert.strictEqual(airborne.lastCombatEvent.baseHitstun, 13);
  assert.strictEqual(airborne.lastCombatEvent.effectiveHitstun, 21, 'airborne targets receive the configured eight-tick untech bonus');
}

function testJuggleLimitRejectsOverflowCleanly() {
  const state = makeAirPair(943);
  const attacker = state.fighters.p1;
  Object.assign(attacker, { comboCount: 5, comboTarget: 'p2', comboRoute: Array(5).fill('air_light'), damageScaling: 0.6, juggleSpent: 7, peakJuggleSpent: 7 });
  const defenderHealth = state.fighters.p2.health;
  tick(state, { p1: { medium: true } });
  advanceUntil(state, (current) => current.lastCombatEvent?.outcome === 'juggle_rejected', 30);
  assert.strictEqual(state.fighters.p2.health, defenderHealth);
  assert.strictEqual(attacker.comboCount, 5);
  assert.strictEqual(attacker.juggleSpent, 7);
  assert.strictEqual(attacker.hitstop, 0);
  assert.strictEqual(state.lastCombatEvent.juggleAfter, 7);
  assert.strictEqual(state.lastCombatEvent.juggleLimit, 8);
}

function testExplicitAirRecoveryManualAndAutomatic() {
  const manual = makeAirPair(944);
  Object.assign(manual.fighters.p1, { comboCount: 10, comboTarget: 'p2', comboRoute: Array(10).fill('air_light'), damageScaling: 0.5 });
  tick(manual, { p1: { light: true } });
  waitForComboHit(manual, 11);
  advanceUntil(manual, (current) => current.fighters.p2.phase === 'air_recovery', 80);
  assert.strictEqual(manual.fighters.p2.airRecoveryTicks, 6);
  tick(manual, { p2: { block: true } });
  assert.strictEqual(manual.fighters.p2.phase, 'jump');
  assert.strictEqual(manual.fighters.p2.airRecoveryCount, 1);

  const automatic = makeAirPair(945);
  Object.assign(automatic.fighters.p1, { comboCount: 10, comboTarget: 'p2', comboRoute: Array(10).fill('air_light'), damageScaling: 0.5 });
  tick(automatic, { p1: { light: true } });
  waitForComboHit(automatic, 11);
  advanceUntil(automatic, (current) => current.fighters.p2.phase === 'air_recovery', 80);
  advanceUntil(automatic, (current) => current.fighters.p2.airRecoveryCount === 1, 12);
  assert.ok(['jump', 'landing'].includes(automatic.fighters.p2.phase), 'automatic recovery may immediately transition into a legal landing');
}

function testReverseGatlingsAndEarlySpecialAreRejected() {
  const raw = makeAirPair(946);
  tick(raw, { p1: { special: true } });
  assert.strictEqual(raw.fighters.p1.currentAttack, null, 'the system-test ender cannot start raw');

  const state = makeAirPair(947);
  tick(state, { p1: { medium: true } });
  waitForComboHit(state, 1);
  tick(state, { p1: { special: true, heavy: true } });
  waitOutAttackerHitstop(state);
  tick(state, {});
  assert.strictEqual(state.fighters.p1.currentAttack, 'air_medium');
  assert.ok(!state.fighters.p1.cancelOptions.includes('air_special_ender'));
}

function testGroundedKnockdownRejectsOrdinaryOTG() {
  const state = createMatch(948);
  Object.assign(state.fighters.p1, { x: -45, facing: 1 });
  Object.assign(state.fighters.p2, { x: 35, grounded: true, y: 0, phase: 'knockdown', knockdownTicks: 20 });
  const health = state.fighters.p2.health;
  tick(state, { p1: { light: true } });
  for (let index = 0; index < 12; index++) tick(state, {});
  assert.strictEqual(state.fighters.p2.health, health);
  assert.strictEqual(state.fighters.p2.hitCountTaken, 0);
}

function testMirroredAndCornerRoutesStayBounded() {
  // Match the 92.6-unit gap reached by the recorded 5.4-unit walk steps above.
  const mirrored = runCombatSpineRoute(949, { positions: [62.6, -30], facing: -1 });
  assert.deepStrictEqual(mirrored.fighters.p1.comboRoute, EXPECTED_ROUTE);
  const corner = runCombatSpineRoute(950, { positions: [286, 388], facing: 1 });
  assert.deepStrictEqual(corner.fighters.p1.comboRoute, EXPECTED_ROUTE);
  for (const state of [mirrored, corner]) {
    for (const fighter of Object.values(state.fighters)) {
      assert.ok(fighter.x >= state.stage.left && fighter.x <= state.stage.right);
      assert.ok(fighter.y >= state.stage.ceilingY && fighter.y <= state.stage.groundY);
    }
  }
}

function testRouteReplayAndSnapshotAreDeterministic() {
  const state = runCombatSpineRoute(951);
  const replay = recordReplay(state);
  const replayed = executeReplay(replay);
  assert.deepStrictEqual(replayed.checksums, state.checksums);
  assert.strictEqual(replayed.checksums.at(-1), replay.finalChecksum);
  assert.deepStrictEqual(replayed.fighters.p1.comboRoute, EXPECTED_ROUTE);
  assert.deepStrictEqual(restoreSnapshot(saveSnapshot(state)), state);
}

function testLegacyGameRemainsUntouched() {
  const bytes = fs.readFileSync(path.join(__dirname, '..', '..', 'game.js'));
  const hash = crypto.createHash('sha256').update(bytes).digest('hex').toUpperCase();
  assert.strictEqual(hash, LEGACY_GAME_SHA256);
}

const tests = [
  testExactGroundToAirSpecialRoute,
  testCombatRulesAreDataDriven,
  testHitstunDecayAndFloor,
  testAirborneBonusDoesNotSlowGroundedHitstun,
  testJuggleLimitRejectsOverflowCleanly,
  testExplicitAirRecoveryManualAndAutomatic,
  testReverseGatlingsAndEarlySpecialAreRejected,
  testGroundedKnockdownRejectsOrdinaryOTG,
  testMirroredAndCornerRoutesStayBounded,
  testRouteReplayAndSnapshotAreDeterministic,
  testLegacyGameRemainsUntouched
];

for (const test of tests) {
  test();
  console.log(`PASS ${test.name}`);
}
