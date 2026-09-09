const assert = require('assert');
const { createMatch, tick, saveSnapshot, restoreSnapshot } = require('../dist/core/engine');
const { fighterDefinitions } = require('../dist/data/fighters');
const { stageFrameFor } = require('../dist/stage/fighterFrameSelector');
const { attackFrameTracks } = require('../dist/stage/attackFrameTracks');

const routes = [
  { from: 'standing_light', to: 'standing_medium', first: 'light', next: 'medium', ticks: [3, 6, 10] },
  { from: 'standing_medium', to: 'standing_heavy', first: 'medium', next: 'heavy', ticks: [5, 10, 16] }
];

function match(actorId = 'p1', kind = 'lamuh_proto') {
  return createMatch(90550, {
    matchId: `swahili-cancel-${actorId}-${kind}`,
    p1Kind: actorId === 'p1' ? kind : 'training_dummy',
    p2Kind: actorId === 'p2' ? kind : 'training_dummy',
    p1X: -30, p2X: 30
  });
}

function advanceUntil(state, predicate, limit = 100) {
  for (let i = 0; i < limit; i++) {
    if (predicate()) return;
    tick(state);
  }
  assert.fail('Expected cancel state was not reached');
}

function assertCompleteStartupAndContact(state, actorId, route, blocked, hitsBefore) {
  const actor = state.fighters[actorId];
  const defender = state.fighters[actorId === 'p1' ? 'p2' : 'p1'];
  const move = fighterDefinitions[actor.kind].attacks[route.to];
  assert.strictEqual(actor.currentAttack, route.to);
  // beginAttack initializes tick 0, then this simulation tick advances it to tick 1.
  assert.strictEqual(actor.phaseTick, 1, 'Every canceled move must begin its own authored clock');
  assert.strictEqual(stageFrameFor(actor, state), attackFrameTracks[route.to].startup[0]);
  assert.strictEqual(defender.hitCountTaken, hitsBefore, 'Cancel cannot damage before its startup');
  while (actor.phaseTick < move.startup - 1) {
    tick(state);
    assert.strictEqual(actor.currentAttack, route.to);
    assert.strictEqual(defender.hitCountTaken, hitsBefore);
    assert.ok(actor.phaseTick < move.startup);
  }
  tick(state);
  assert.strictEqual(actor.phaseTick, move.startup, 'The next contact must occur on the authored tick');
  assert.strictEqual(stageFrameFor(actor, state), attackFrameTracks[route.to].active[0]);
  assert.strictEqual(state.lastCombatEvent.attackId, route.to);
  assert.strictEqual(state.lastCombatEvent.outcome, blocked ? 'block' : 'hit');
  assert.strictEqual(defender.hitCountTaken, hitsBefore + (blocked ? 0 : 1));
}

function testEarlyAndDelayedGroundedCancels() {
  for (const actorId of ['p1', 'p2']) {
    for (const route of routes) {
      for (const outgoingTick of route.ticks) {
        for (const blocked of [false, true]) {
          const state = match(actorId);
          const actor = state.fighters[actorId];
          const defender = state.fighters[actorId === 'p1' ? 'p2' : 'p1'];
          if (blocked) defender.dummyMode = 'stand_block';
          tick(state, { [actorId]: { [route.first]: true } });
          advanceUntil(state, () => actor.currentAttack === route.from
            && actor.phaseTick === outgoingTick && actor.hitstop === 0
            && (blocked ? actor.attackBlocked : actor.attackConnected));
          const hitsBefore = defender.hitCountTaken;
          tick(state, { [actorId]: { [route.next]: true } });
          assertCompleteStartupAndContact(state, actorId, route, blocked, hitsBefore);
        }
      }
    }
  }
}

function testBufferedCancelKeepsHitstopAndRestartsAfterFreeze() {
  for (const actorId of ['p1', 'p2']) {
    for (const route of routes) {
      const state = match(actorId);
      const actor = state.fighters[actorId];
      const defender = state.fighters[actorId === 'p1' ? 'p2' : 'p1'];
      tick(state, { [actorId]: { [route.first]: true } });
      advanceUntil(state, () => actor.attackConnected && actor.hitstop > 0);
      const hitsBefore = defender.hitCountTaken;
      const frozenTick = actor.phaseTick;
      const freezeBefore = actor.hitstop;
      tick(state, { [actorId]: { [route.next]: true } });
      assert.strictEqual(actor.currentAttack, route.from, 'A buffered cancel must wait for hitstop');
      assert.strictEqual(actor.phaseTick, frozenTick);
      assert.strictEqual(actor.hitstop, freezeBefore - 1);
      while (actor.hitstop > 0) {
        tick(state);
        assert.strictEqual(actor.phaseTick, frozenTick);
      }
      tick(state);
      const restored = restoreSnapshot(saveSnapshot(state));
      assertCompleteStartupAndContact(state, actorId, route, false, hitsBefore);
      while (restored.tick < state.tick) tick(restored);
      assert.deepStrictEqual(restored, state, 'Canceled startup and contact must restore deterministically');
    }
  }
}

function testWhiffsAndUnrelatedTimelinesRemainIntact() {
  const whiff = createMatch(90551, { p1X: -250, p2X: 250 });
  tick(whiff, { p1: { light: true } });
  advanceUntil(whiff, () => whiff.fighters.p1.phaseTick === 6);
  tick(whiff, { p1: { medium: true } });
  assert.strictEqual(whiff.fighters.p1.currentAttack, 'standing_light');
  assert.strictEqual(whiff.fighters.p1.phaseTick, 7, 'Whiff must not gain a cancel');

  // The existing Lamuh branch and airborne start path already reset; preserve both.
  const lamuh = match('p1', 'lamuh_legacy_v2');
  tick(lamuh, { p1: { light: true } });
  advanceUntil(lamuh, () => lamuh.fighters.p1.attackConnected && lamuh.fighters.p1.hitstop === 0);
  tick(lamuh, { p1: { medium: true } });
  assert.strictEqual(lamuh.fighters.p1.phaseTick, 1);
  assert.strictEqual(lamuh.fighters.p1.currentAttack, 'standing_medium');

  const air = match();
  Object.assign(air.fighters.p1, { grounded: false, phase: 'attack', phaseTick: 9,
    currentAttack: 'air_light', cancelOptions: ['air_medium'], attackConnected: true,
    y: -90, vy: -1, airActionsRemaining: 4 });
  tick(air, { p1: { medium: true } });
  assert.strictEqual(air.fighters.p1.currentAttack, 'air_medium');
  assert.strictEqual(air.fighters.p1.phaseTick, 1);
  assert.strictEqual(air.fighters.p1.airActionsRemaining, 3);
}

for (const test of [testEarlyAndDelayedGroundedCancels,
  testBufferedCancelKeepsHitstopAndRestartsAfterFreeze, testWhiffsAndUnrelatedTimelinesRemainIntact]) {
  test();
  console.log(`PASS ${test.name}`);
}
