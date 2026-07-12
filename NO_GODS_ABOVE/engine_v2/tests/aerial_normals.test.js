const assert = require('assert');
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const { createMatch, executeReplay, recordReplay, restoreSnapshot, saveSnapshot, tick } = require('../dist');
const { defaultTuning } = require('../dist/data/fighters');

const LEGACY_GAME_SHA256 = '401E262330F74AB9A2673C12C98AA0405F37F04ACC5BA2D773B5F9B531B7E5F1';

function close(state) { state.fighters.p1.x = -72; state.fighters.p2.x = 30; }
function insideBounds(state) { for (const fighter of Object.values(state.fighters)) { assert.ok(fighter.x >= state.stage.left && fighter.x <= state.stage.right); assert.ok(fighter.y >= state.stage.ceilingY && fighter.y <= state.stage.groundY); } }
function advanceUntil(state, predicate, max = 180, inputAt = () => ({})) {
  for (let index = 0; index < max; index++) { tick(state, inputAt(index)); if (predicate(state)) return index + 1; }
  throw new Error(`condition not reached within ${max} ticks at simulation tick ${state.tick}`);
}
function jump(state, directional = {}) {
  tick(state, { p1: { up: true, ...directional } });
  advanceUntil(state, (s) => !s.fighters.p1.grounded, 20, () => ({ p1: directional }));
  assert.strictEqual(state.fighters.p1.phase, 'jump');
  assert.strictEqual(state.fighters.p1.airActionsRemaining, 3);
}
function isolatedAirPair(seed = 700) {
  const state = createMatch(seed); const p1 = state.fighters.p1; const p2 = state.fighters.p2;
  Object.assign(p1, { x: -40, y: -80, vx: 1.5, vy: -2, grounded: false, phase: 'jump', phaseTick: 0, airActionsRemaining: 3 });
  Object.assign(p2, { x: 40, y: -70, vx: 0, vy: 0, grounded: false, phase: 'jump', phaseTick: 0, hitstun: 0, blockstun: 0, knockdownTicks: 0, getupTicks: 0 });
  return state;
}
function waitForHit(state, count, max = 80, inputAt = () => ({})) { return advanceUntil(state, (s) => s.fighters.p1.comboCount >= count, max, inputAt); }
function startAndHit(state, input, count = 1) { tick(state, { p1: input }); waitForHit(state, count); return state; }
function waitOutHitstop(state) { advanceUntil(state, (s) => s.fighters.p1.hitstop === 0, 30); }

function launcherAerialRoute(seed = 800) {
  const state = createMatch(seed); close(state);
  tick(state, { p1: { down: true, heavy: true } });
  waitForHit(state, 1);
  waitOutHitstop(state);
  tick(state, { p1: { up: true, right: true } });
  advanceUntil(state, (s) => !s.fighters.p1.grounded, 20, () => ({ p1: { right: true } }));
  tick(state, { p1: { light: true, right: true } });
  waitForHit(state, 2, 50, () => ({ p1: { right: true } }));
  tick(state, { p1: { medium: true, right: true } });
  waitForHit(state, 3, 50, () => ({ p1: { right: true } }));
  tick(state, { p1: { heavy: true, right: true } });
  waitForHit(state, 4, 60, () => ({ p1: { right: true } }));
  return state;
}

function testAirborneButtonsActivateDistinctNormals() {
  for (const [input, expected] of [[{ light: true }, 'air_light'], [{ medium: true }, 'air_medium'], [{ heavy: true }, 'air_heavy']]) {
    const state = createMatch(701); jump(state); tick(state, { p1: input });
    assert.strictEqual(state.fighters.p1.currentAttack, expected); assert.strictEqual(state.fighters.p1.grounded, false);
  }
}

function testGroundedButtonsRemainGroundedNormals() {
  for (const [input, expected] of [[{ light: true }, 'standing_light'], [{ medium: true }, 'standing_medium'], [{ heavy: true }, 'standing_heavy']]) {
    const state = createMatch(702); tick(state, { p1: input }); assert.strictEqual(state.fighters.p1.currentAttack, expected);
  }
}

function testLauncherToAirLightMediumHeavyConnects() {
  const state = launcherAerialRoute(); const p1 = state.fighters.p1;
  assert.deepStrictEqual(p1.comboRoute, ['crouching_heavy', 'air_light', 'air_medium', 'air_heavy']);
  assert.strictEqual(p1.comboCount, 4); assert.strictEqual(p1.comboDamage, 194); assert.strictEqual(p1.airActionsRemaining, 0);
  assert.strictEqual(state.fighters.p2.phase, 'knockdown'); assert.deepStrictEqual(state.debugWarnings, []); insideBounds(state);
}

function testAirLightToHeavyConnects() {
  const state = isolatedAirPair(703); startAndHit(state, { light: true });
  assert.deepStrictEqual(state.fighters.p1.cancelOptions, ['air_medium', 'air_heavy']);
  tick(state, { p1: { heavy: true } }); waitForHit(state, 2);
  assert.deepStrictEqual(state.fighters.p1.comboRoute, ['air_light', 'air_heavy']);
}

function testAirMediumToHeavyConnects() {
  const state = isolatedAirPair(704); startAndHit(state, { medium: true });
  assert.deepStrictEqual(state.fighters.p1.cancelOptions, ['air_heavy']);
  tick(state, { p1: { heavy: true } }); waitForHit(state, 2);
  assert.deepStrictEqual(state.fighters.p1.comboRoute, ['air_medium', 'air_heavy']);
}

function testReverseAerialChainsAreRejected() {
  for (const [first, attempted, expected] of [[{ medium: true }, { light: true }, 'air_medium'], [{ heavy: true }, { light: true }, 'air_heavy'], [{ heavy: true }, { medium: true }, 'air_heavy']]) {
    const state = isolatedAirPair(705); startAndHit(state, first); tick(state, { p1: attempted }); waitOutHitstop(state); tick(state, {});
    assert.strictEqual(state.fighters.p1.currentAttack, expected); assert.ok(!state.fighters.p1.cancelOptions.includes(expected === 'air_medium' ? 'air_light' : attempted.light ? 'air_light' : 'air_medium'));
  }
}

function testAirAndGroundRestrictionsRemainDataDriven() {
  const attacks = defaultTuning.attacks;
  for (const id of ['air_light', 'air_medium', 'air_heavy']) assert.strictEqual(attacks[id].airOnly, true);
  for (const id of ['standing_light', 'standing_medium', 'standing_heavy', 'crouching_light', 'crouching_medium', 'crouching_heavy']) assert.strictEqual(attacks[id].groundOnly, true);
  const air = createMatch(706); jump(air); tick(air, { p1: { light: true } }); assert.notStrictEqual(air.fighters.p1.currentAttack, 'standing_light');
  const ground = createMatch(707); tick(ground, { p1: { light: true } }); assert.notStrictEqual(ground.fighters.p1.currentAttack, 'air_light');
}

function testAerialAttacksPreserveAirbornePhysics() {
  const state = createMatch(708); jump(state, { right: true }); const p1 = state.fighters.p1;
  const before = { vx: p1.vx, vy: p1.vy, y: p1.y, facing: p1.facing };
  tick(state, { p1: { light: true } });
  assert.strictEqual(p1.currentAttack, 'air_light'); assert.strictEqual(p1.grounded, false); assert.strictEqual(p1.attackFacing, before.facing);
  assert.strictEqual(p1.vx, before.vx); assert.strictEqual(p1.vy, before.vy + defaultTuning.lamuh_proto.gravity); assert.ok(p1.y > before.y + before.vy);
}

function testAerialFacingIsLockedAtAttackStart() {
  const state = isolatedAirPair(709); const p1 = state.fighters.p1; p1.facing = 1;
  tick(state, { p1: { light: true } }); state.fighters.p2.x = -200; tick(state, {});
  assert.strictEqual(p1.attackFacing, 1); assert.strictEqual(p1.facing, 1);
}

function testAerialMovementIsDeterministic() {
  const a = createMatch(710), b = createMatch(710);
  for (const state of [a, b]) { jump(state, { right: true }); tick(state, { p1: { medium: true, right: true } }); for (let i = 0; i < 12; i++) tick(state, { p1: { right: true } }); }
  assert.deepStrictEqual([a.fighters.p1.x, a.fighters.p1.y, a.fighters.p1.vx, a.fighters.p1.vy, a.fighters.p1.phaseTick], [b.fighters.p1.x, b.fighters.p1.y, b.fighters.p1.vx, b.fighters.p1.vy, b.fighters.p1.phaseTick]);
}

function testLandingInterruptsAerialRecovery() {
  const state = createMatch(711); jump(state);
  advanceUntil(state, (s) => !s.fighters.p1.grounded && s.fighters.p1.vy > 0 && s.fighters.p1.y > -45, 120);
  tick(state, { p1: { heavy: true } }); assert.strictEqual(state.fighters.p1.currentAttack, 'air_heavy');
  advanceUntil(state, (s) => s.fighters.p1.grounded, 30);
  assert.strictEqual(state.fighters.p1.phase, 'landing'); assert.strictEqual(state.fighters.p1.currentAttack, null);
  assert.deepStrictEqual(state.fighters.p1.cancelOptions, []); assert.strictEqual(state.fighters.p1.airActionsRemaining, 0);
}

function testAerialHitboxesRespectAuthoredHitCount() {
  const state = isolatedAirPair(712); startAndHit(state, { light: true }); const health = state.fighters.p2.health;
  for (let i = 0; i < 12; i++) tick(state, {});
  assert.strictEqual(health, 975); assert.strictEqual(state.fighters.p2.health, health); assert.strictEqual(state.fighters.p2.hitCountTaken, 1);
}

function testAerialComboResetsAfterLandingNeutral() {
  const state = launcherAerialRoute(713);
  advanceUntil(state, (s) => s.fighters.p1.grounded && s.fighters.p2.grounded && s.fighters.p1.comboCount === 0, 240);
  assert.strictEqual(state.fighters.p1.damageScaling, 1); assert.strictEqual(state.fighters.p1.comboDamage, 0); assert.deepStrictEqual(state.fighters.p1.comboRoute, []);
}

function testFullAerialRouteStaysInsideStageBounds() {
  const state = launcherAerialRoute(714); insideBounds(state);
  for (let index = 0; index < 180; index++) { tick(state, {}); insideBounds(state); }
  assert.deepStrictEqual(state.debugWarnings, []);
}

function testAerialReplayAndSnapshotRemainDeterministic() {
  const state = createMatch(715); jump(state, { right: true }); tick(state, { p1: { light: true, right: true } });
  for (let index = 0; index < 18; index++) tick(state, { p1: { right: true } });
  const replay = recordReplay(state); const replayed = executeReplay(replay);
  assert.deepStrictEqual(replayed.checksums, state.checksums); assert.strictEqual(replayed.checksums.at(-1), replay.finalChecksum);
  const restored = restoreSnapshot(saveSnapshot(state)); assert.deepStrictEqual(restored, state); assert.deepStrictEqual(restored.fighters.p1.comboRoute, state.fighters.p1.comboRoute);
}

function testAirActionBudgetPreventsAerialLoops() {
  const completed = launcherAerialRoute(716); assert.strictEqual(completed.fighters.p1.airActionsRemaining, 0);
  const exhausted = isolatedAirPair(717); exhausted.fighters.p1.airActionsRemaining = 0;
  tick(exhausted, { p1: { light: true } }); assert.strictEqual(exhausted.fighters.p1.currentAttack, null);
}

function testLegacyGameRemainsUntouched() {
  const bytes = fs.readFileSync(path.join(__dirname, '..', '..', 'game.js')); const hash = crypto.createHash('sha256').update(bytes).digest('hex').toUpperCase();
  assert.strictEqual(hash, LEGACY_GAME_SHA256);
}

const tests = [
  testAirborneButtonsActivateDistinctNormals,
  testGroundedButtonsRemainGroundedNormals,
  testLauncherToAirLightMediumHeavyConnects,
  testAirLightToHeavyConnects,
  testAirMediumToHeavyConnects,
  testReverseAerialChainsAreRejected,
  testAirAndGroundRestrictionsRemainDataDriven,
  testAerialAttacksPreserveAirbornePhysics,
  testAerialFacingIsLockedAtAttackStart,
  testAerialMovementIsDeterministic,
  testLandingInterruptsAerialRecovery,
  testAerialHitboxesRespectAuthoredHitCount,
  testAerialComboResetsAfterLandingNeutral,
  testFullAerialRouteStaysInsideStageBounds,
  testAerialReplayAndSnapshotRemainDeterministic,
  testAirActionBudgetPreventsAerialLoops,
  testLegacyGameRemainsUntouched
];

for (const test of tests) { test(); console.log(`PASS ${test.name}`); }
