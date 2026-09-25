const assert = require('assert');
const { createMatch, tick } = require('../dist');
const { stageFrameFor } = require('../dist/stage/fighterFrameSelector');

function close(state) {
  Object.assign(state.fighters.p1, { x: -50, facing: 1 });
  Object.assign(state.fighters.p2, { x: 50, facing: -1 });
}

function advanceUntil(state, predicate, max = 120, inputAt = () => ({})) {
  for (let index = 0; index < max; index++) {
    tick(state, inputAt(index));
    if (predicate(state)) return;
  }
  throw new Error(`condition not reached within ${max} ticks`);
}

function testGroundedLightReactionUsesApprovedThreePoseMotion() {
  const state = createMatch(1201);
  close(state);
  tick(state, { p1: { light: true } });
  advanceUntil(state, (current) => current.fighters.p2.hitCountTaken === 1);
  const defender = state.fighters.p2;
  assert.strictEqual(defender.phase, 'hit_reaction');
  assert.strictEqual(defender.hitReactionWeight, 'light');
  assert.strictEqual(stageFrameFor(defender, state), 'light_hit_entry');

  const frozenCursor = defender.phaseTick;
  tick(state, {});
  assert.strictEqual(defender.phaseTick, frozenCursor, 'hitstop must freeze the artwork cursor');

  advanceUntil(state, (current) => current.fighters.p2.phaseTick >= 2);
  assert.strictEqual(stageFrameFor(defender, state), 'light_hit_reaction');
  advanceUntil(state, (current) => current.fighters.p2.phaseTick >= 6);
  assert.strictEqual(stageFrameFor(defender, state), 'light_hit_recovery');
  advanceUntil(state, (current) => current.fighters.p2.hitstun === 0);
  assert.ok(stageFrameFor(defender, state).startsWith('idle_'), 'reaction must return cleanly to idle when hitstun ends');
}

function testBurstUsesHeavyReactionWithoutDamage() {
  const state = createMatch(1202);
  close(state);
  tick(state, { p1: { light: true } });
  advanceUntil(state, (current) => current.fighters.p2.hitCountTaken === 1);
  advanceUntil(state, (current) => current.fighters.p2.hitstop === 0);
  tick(state, { p2: { burst: true } });
  const target = state.fighters.p1;
  assert.strictEqual(target.hitReactionWeight, 'heavy');
  assert.strictEqual(target.phase, 'hit_reaction');
  assert.strictEqual(stageFrameFor(target, state), 'heavy_hit_entry');
  advanceUntil(state, (current) => current.fighters.p1.phaseTick >= 3);
  assert.strictEqual(stageFrameFor(target, state), 'heavy_hit_reaction');
  advanceUntil(state, (current) => current.fighters.p1.phaseTick >= 11);
  assert.strictEqual(stageFrameFor(target, state), 'heavy_hit_recovery');
}

function testLauncherUsesAirborneReactionAndTumble() {
  const state = createMatch(1203);
  close(state);
  tick(state, { p1: { down: true, heavy: true } });
  advanceUntil(state, (current) => current.fighters.p2.hitCountTaken === 1);
  const defender = state.fighters.p2;
  assert.strictEqual(defender.grounded, false);
  assert.strictEqual(defender.hitReactionWeight, 'heavy');
  assert.strictEqual(stageFrameFor(defender, state), 'airborne_launch_reaction');
  advanceUntil(state, (current) => current.fighters.p2.phaseTick >= 4);
  assert.strictEqual(stageFrameFor(defender, state), 'airborne_tumble');
}

function testEachComboHitRestartsTheReactionAtImpact() {
  const state = createMatch(1205);
  close(state);
  tick(state, { p1: { light: true } });
  advanceUntil(state, (current) => current.fighters.p2.hitCountTaken === 1);
  advanceUntil(state, (current) => current.fighters.p2.phaseTick >= 3);
  assert.strictEqual(stageFrameFor(state.fighters.p2, state), 'light_hit_reaction');
  tick(state, { p1: { medium: true } });
  advanceUntil(state, (current) => current.fighters.p2.hitCountTaken === 2);
  assert.strictEqual(state.fighters.p2.phaseTick, 0, 'a fresh connected hit must restart the reaction cursor');
  assert.strictEqual(stageFrameFor(state.fighters.p2, state), 'light_hit_entry');
}

function testPresentationSelectionCannotMutateSimulation() {
  const state = createMatch(1204);
  const before = JSON.stringify(state);
  stageFrameFor(state.fighters.p1, state);
  stageFrameFor(state.fighters.p2, state);
  assert.strictEqual(JSON.stringify(state), before);
}

for (const test of [testGroundedLightReactionUsesApprovedThreePoseMotion, testBurstUsesHeavyReactionWithoutDamage, testLauncherUsesAirborneReactionAndTumble, testEachComboHitRestartsTheReactionAtImpact, testPresentationSelectionCannotMutateSimulation]) {
  test();
  console.log(`PASS ${test.name}`);
}
