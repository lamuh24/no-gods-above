const assert = require('assert');
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const { createMatch, tick } = require('../dist');
const { defaultTuning } = require('../dist/data/fighters');
const { stageFrameFor } = require('../dist/stage/fighterFrameSelector');

const LEGACY_GAME_SHA256 = 'D081DA2D907CF6ABD978301C1637008B26CCB30B47E2CCAFCA3FEA3331910C6B';

function advanceUntil(state, predicate, max = 180, inputAt = () => ({})) {
  for (let index = 0; index < max; index++) {
    tick(state, inputAt(index));
    if (predicate(state)) return;
  }
  throw new Error(`condition not reached within ${max} ticks: ${JSON.stringify({ tick: state.tick, p1: state.fighters.p1, p2: state.fighters.p2, event: state.lastCombatEvent })}`);
}

function waitForComboHit(state, count, forward) {
  advanceUntil(state, (current) => current.fighters.p1.comboCount >= count, 90, () => ({ p1: forward }));
}

function waitOutAttackerHitstop(state) {
  advanceUntil(state, (current) => current.fighters.p1.hitstop === 0, 30);
}

function runLaunchedAirRoute(buttons, seed = 1301, mirrored = false) {
  const state = createMatch(seed);
  const facing = mirrored ? -1 : 1;
  Object.assign(state.fighters.p1, { x: mirrored ? 50 : -50, facing, attackFacing: facing });
  Object.assign(state.fighters.p2, { x: mirrored ? -50 : 50, facing: -facing, attackFacing: -facing });
  const forward = mirrored ? { left: true } : { right: true };

  tick(state, { p1: { down: true, heavy: true } });
  waitForComboHit(state, 1, forward);
  waitOutAttackerHitstop(state);
  tick(state, { p1: { up: true, ...forward } });
  advanceUntil(state, (current) => !current.fighters.p1.grounded, 20, () => ({ p1: forward }));

  for (const button of buttons) {
    const nextHit = state.fighters.p1.comboCount + 1;
    tick(state, { p1: { [button]: true, ...forward } });
    waitForComboHit(state, nextHit, forward);
    if (process.env.TRACE_AIR_KNOCKDOWN) console.log('TRACE', button, JSON.stringify({ tick: state.tick, p1: { x: state.fighters.p1.x, y: state.fighters.p1.y, vx: state.fighters.p1.vx, vy: state.fighters.p1.vy, phase: state.fighters.p1.phase }, p2: { x: state.fighters.p2.x, y: state.fighters.p2.y, vx: state.fighters.p2.vx, vy: state.fighters.p2.vy, phase: state.fighters.p2.phase } }));
  }
  return state;
}

function testRawAirHeavyKnocksAnAirborneOpponentDown() {
  const state = createMatch(1300);
  Object.assign(state.fighters.p1, { x: -40, y: -80, vx: 0, vy: -2, grounded: false, phase: 'jump', phaseTick: 0, airActionsRemaining: defaultTuning.combat.airActionBudget });
  Object.assign(state.fighters.p2, { x: 40, y: -70, vx: 0, vy: 0, grounded: false, phase: 'jump', phaseTick: 0 });
  tick(state, { p1: { heavy: true } });
  advanceUntil(state, (current) => current.fighters.p2.hitCountTaken === 1, 30);
  assert.deepStrictEqual(state.fighters.p1.comboRoute, ['air_heavy']);
  assert.strictEqual(state.fighters.p2.phase, 'knockdown');
  assert.strictEqual(state.fighters.p2.knockdownKind, 'soft');
  assert.strictEqual(stageFrameFor(state.fighters.p2, state), 'airborne_tumble');
}

function testAirHeavyEndsLightMediumHeavyInSoftKnockdown() {
  assert.strictEqual(defaultTuning.attacks.air_medium.hitboxes[0].knockbackY, -8);
  const state = runLaunchedAirRoute(['light', 'medium', 'heavy']);
  const attacker = state.fighters.p1;
  const defender = state.fighters.p2;
  assert.deepStrictEqual(attacker.comboRoute, ['crouching_heavy', 'air_light', 'air_medium', 'air_heavy']);
  assert.strictEqual(attacker.comboDamage, 194);
  assert.strictEqual(attacker.juggleSpent, 5);
  assert.strictEqual(attacker.airActionsRemaining, 2);
  assert.strictEqual(defender.phase, 'knockdown');
  assert.strictEqual(defender.knockdownKind, 'soft');
  assert.strictEqual(defender.knockdownTicks, defaultTuning.combat.softKnockdownTicks);
  assert.strictEqual(stageFrameFor(defender, state), 'airborne_tumble');
}

function testAlternatingFiveButtonRouteConsumesTheFiniteBudget() {
  const state = runLaunchedAirRoute(['light', 'medium', 'light', 'medium', 'heavy'], 1302);
  const attacker = state.fighters.p1;
  const defender = state.fighters.p2;
  assert.deepStrictEqual(attacker.comboRoute, ['crouching_heavy', 'air_light', 'air_medium', 'air_light', 'air_medium', 'air_heavy']);
  assert.strictEqual(attacker.comboDamage, 233);
  assert.strictEqual(attacker.juggleSpent, defaultTuning.combat.juggleLimit);
  assert.strictEqual(attacker.peakJuggleSpent, defaultTuning.combat.juggleLimit);
  assert.strictEqual(attacker.airActionsRemaining, 0);
  assert.strictEqual(defender.phase, 'knockdown');
  assert.strictEqual(defender.knockdownKind, 'soft');

  Object.assign(attacker, { currentAttack: null, phase: 'jump', phaseTick: 0, grounded: false });
  tick(state, { p1: { light: true } });
  assert.strictEqual(attacker.currentAttack, null, 'a sixth normal cannot start after the five-action route');
}

function testAlternatingRouteIsMirroredMechanically() {
  const state = runLaunchedAirRoute(['light', 'medium', 'light', 'medium', 'heavy'], 1303, true);
  assert.deepStrictEqual(state.fighters.p1.comboRoute, ['crouching_heavy', 'air_light', 'air_medium', 'air_light', 'air_medium', 'air_heavy']);
  assert.strictEqual(state.fighters.p1.juggleSpent, 8);
  assert.strictEqual(state.fighters.p2.knockdownKind, 'soft');
}

function testApprovedKnockdownAndGetupFramesCoverEveryPhase() {
  const state = createMatch(1304);
  const defender = state.fighters.p2;
  Object.assign(defender, { phase: 'knockdown', grounded: false, y: -60, phaseTick: 0, knockdownKind: 'soft', knockdownTicks: 26 });
  assert.strictEqual(stageFrameFor(defender, state), 'airborne_tumble');

  Object.assign(defender, { grounded: true, y: 0 });
  const knockdownTrack = [[0, 'knockdown_ground_impact'], [2, 'knockdown_ground_impact'], [3, 'knockdown_impact_settle'], [6, 'knockdown_impact_settle'], [7, 'knockdown_face_up'], [25, 'knockdown_face_up']];
  for (const [phaseTick, expected] of knockdownTrack) {
    defender.phaseTick = phaseTick;
    assert.strictEqual(stageFrameFor(defender, state), expected);
  }

  defender.phase = 'getup';
  const getupTrack = [[0, 'getup_shoulder_roll'], [2, 'getup_shoulder_roll'], [3, 'getup_roll_brace'], [5, 'getup_roll_brace'], [6, 'getup_push_to_kneel'], [9, 'getup_push_to_kneel'], [10, 'getup_neutral'], [13, 'getup_neutral'], [14, 'getup_rise_to_stand'], [17, 'getup_rise_to_stand']];
  for (const [phaseTick, expected] of getupTrack) {
    defender.phaseTick = phaseTick;
    assert.strictEqual(stageFrameFor(defender, state), expected);
    defender.facing *= -1;
    assert.strictEqual(stageFrameFor(defender, state), expected, 'authored and mirrored fighters must use the same approved motion phase');
  }
}

function testKnockdownAndGetupCursorsAdvanceAtFixedTick() {
  const state = createMatch(1305);
  const defender = state.fighters.p2;
  Object.assign(defender, { phase: 'knockdown', grounded: true, y: 0, phaseTick: 0, knockdownKind: 'soft', knockdownTicks: 2, getupTicks: 0 });
  tick(state, {});
  assert.strictEqual(defender.phaseTick, 1);
  assert.strictEqual(stageFrameFor(defender, state), 'knockdown_ground_impact');
  tick(state, {});
  assert.strictEqual(defender.phase, 'getup');
  assert.strictEqual(defender.phaseTick, 0);
  tick(state, {});
  assert.strictEqual(defender.phaseTick, 1);
  assert.strictEqual(stageFrameFor(defender, state), 'getup_shoulder_roll');
}

function testLegacyGameRemainsUntouched() {
  const bytes = fs.readFileSync(path.join(__dirname, '..', '..', 'game.js'));
  const hash = crypto.createHash('sha256').update(bytes).digest('hex').toUpperCase();
  assert.strictEqual(hash, LEGACY_GAME_SHA256);
}

for (const test of [
  testRawAirHeavyKnocksAnAirborneOpponentDown,
  testAirHeavyEndsLightMediumHeavyInSoftKnockdown,
  testAlternatingFiveButtonRouteConsumesTheFiniteBudget,
  testAlternatingRouteIsMirroredMechanically,
  testApprovedKnockdownAndGetupFramesCoverEveryPhase,
  testKnockdownAndGetupCursorsAdvanceAtFixedTick,
  testLegacyGameRemainsUntouched
]) {
  test();
  console.log(`PASS ${test.name}`);
}
