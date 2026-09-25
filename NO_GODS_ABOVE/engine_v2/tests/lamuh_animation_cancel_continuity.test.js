const assert = require('assert');
const { createMatch, tick, saveSnapshot, restoreSnapshot } = require('../dist/core/engine');
const { executeReplay, recordReplay } = require('../dist/core/replay');
const { fighterDefinitions } = require('../dist/data/fighters');

function match(actorId = 'p1', kind = 'lamuh_legacy_v2') {
  return createMatch(90501, {
    matchId: `lamuh-cancel-${actorId}-${kind}`,
    p1Kind: actorId === 'p1' ? kind : 'training_dummy',
    p2Kind: actorId === 'p2' ? kind : 'training_dummy',
    p1X: -34,
    p2X: 34
  });
}

function advanceUntil(state, predicate, limit = 100) {
  for (let index = 0; index < limit; index++) {
    if (predicate()) return;
    tick(state);
  }
  assert.fail('Expected state was not reached');
}

function testGroundedCancelRestartsAuthoredTimeline() {
  for (const actorId of ['p1', 'p2']) {
    for (const outgoingTick of [3, 9, 12]) {
      for (const blocked of [false, true]) {
        const state = match(actorId);
        const actor = state.fighters[actorId];
        const defender = state.fighters[actorId === 'p1' ? 'p2' : 'p1'];
        if (blocked) defender.dummyMode = 'stand_block';
        tick(state, { [actorId]: { light: true } });
        advanceUntil(state, () => actor.currentAttack === 'standing_light'
          && actor.phaseTick === outgoingTick && actor.hitstop === 0
          && (blocked ? actor.attackBlocked : actor.attackConnected));

        const hitsBefore = defender.hitCountTaken;
        tick(state, { [actorId]: { medium: true } });
        assert.strictEqual(actor.currentAttack, 'standing_medium');
        assert.strictEqual(actor.phaseTick, 1, 'Cancel must start on the first authored simulation tick');
        assert.strictEqual(defender.hitCountTaken, hitsBefore, 'Cancel cannot skip startup and hit immediately');
        assert.strictEqual(actor.hitstop, 0);

        const startup = fighterDefinitions.lamuh_legacy_v2.attacks.standing_medium.startup;
        while (actor.phaseTick < startup - 1) {
          tick(state);
          assert.strictEqual(defender.hitCountTaken, hitsBefore, 'The complete Medium startup must remain non-damaging');
        }
        tick(state);
        assert.strictEqual(actor.phaseTick, startup);
        assert.strictEqual(state.lastCombatEvent.attackId, 'standing_medium');
        assert.strictEqual(state.lastCombatEvent.outcome, blocked ? 'block' : 'hit');
        assert.strictEqual(defender.hitCountTaken, hitsBefore + (blocked ? 0 : 1));
      }
    }
  }
}

function testSpecialCancelPreservesBothAuthoredContactsAndReplay() {
  for (const actorId of ['p1', 'p2']) {
    const state = match(actorId);
    const actor = state.fighters[actorId];
    tick(state, { [actorId]: { medium: true } });
    advanceUntil(state, () => actor.currentAttack === 'standing_medium'
      && actor.attackConnected && actor.phaseTick === 8 && actor.hitstop === 0);
    const forward = actorId === 'p1' ? 'right' : 'left';
    tick(state, { [actorId]: { [forward]: true, special: true, medium: true } });
    assert.strictEqual(actor.currentAttack, 'legacy_ascend_step');
    assert.strictEqual(actor.phaseTick, 1, 'Special cancel must retain slide anticipation and its root-motion entry');
    const restored = restoreSnapshot(saveSnapshot(state));
    const contacts = [];
    while (actor.currentAttack === 'legacy_ascend_step') {
      tick(state);
      tick(restored);
      if (state.lastCombatEvent?.tick === state.tick - 1
        && state.lastCombatEvent.attackId === 'legacy_ascend_step') {
        contacts.push(actor.phaseTick);
      }
    }
    assert.deepStrictEqual(contacts, [7, 26], 'Ascend Step Medium must retain exactly two contacts');
    assert.deepStrictEqual(restored, state, 'Snapshot restore must reproduce the complete canceled move');
    const replayed = executeReplay(recordReplay(state));
    assert.deepStrictEqual(replayed.checksums, state.checksums, 'Input replay must preserve canceled animation timing');
  }
}

function testWhiffCannotCancelAndPrototypeBehaviorIsPreserved() {
  const whiff = createMatch(90502, { p1Kind: 'lamuh_legacy_v2', p2Kind: 'training_dummy', p1X: -200, p2X: 200 });
  tick(whiff, { p1: { light: true } });
  advanceUntil(whiff, () => whiff.fighters.p1.phaseTick === 9);
  tick(whiff, { p1: { medium: true } });
  assert.strictEqual(whiff.fighters.p1.currentAttack, 'standing_light');

  const prototype = match('p1', 'lamuh_proto');
  const actor = prototype.fighters.p1;
  tick(prototype, { p1: { light: true } });
  advanceUntil(prototype, () => actor.attackConnected && actor.hitstop === 0);
  const outgoingTick = actor.phaseTick;
  tick(prototype, { p1: { medium: true } });
  assert.strictEqual(actor.currentAttack, 'standing_medium');
  assert.strictEqual(actor.phaseTick, 1, 'The subsequent Swahili repair starts each prototype cancel on its own authored clock');
}

function testLamuhCannotReachCopiedUpHeavySpecial() {
  for (const actorId of ['p1', 'p2']) {
    const state = match(actorId);
    tick(state, { [actorId]: { up: true, heavy: true } });
    assert.strictEqual(state.fighters[actorId].currentAttack, 'standing_heavy');
    assert.strictEqual(state.fighters[actorId].phaseTick, 1);

    const air = match(actorId);
    const fighter = air.fighters[actorId];
    fighter.grounded = false;
    fighter.phase = 'jump';
    fighter.y = -90;
    fighter.vy = -1;
    fighter.airActionsRemaining = 5;
    tick(air, { [actorId]: { up: true, heavy: true } });
    assert.strictEqual(fighter.currentAttack, 'air_heavy');
  }

  const prototype = match('p1', 'lamuh_proto');
  tick(prototype, { p1: { up: true, heavy: true } });
  assert.strictEqual(prototype.fighters.p1.currentAttack, 'special_up_heavy', 'Prototype special input must remain unchanged');
}

function testLamuhReactionWeightMatchesContactIntent() {
  const cases = [
    { input: { light: true }, weights: ['light'], id: 'standing_light' },
    { input: { down: true, light: true }, weights: ['light'], id: 'crouching_light' },
    { input: { light: true }, air: true, weights: ['light'], id: 'air_light' },
    { input: { right: true, special: true, light: true }, weights: ['light'], id: 'legacy_ascend_step_light' },
    { input: { right: true, special: true, medium: true }, weights: ['light', 'heavy'], id: 'legacy_ascend_step' },
    { input: { medium: true }, weights: ['heavy'], id: 'standing_medium' },
    { input: { down: true, heavy: true }, weights: ['heavy'], id: 'crouching_heavy' }
  ];
  for (const example of cases) {
    const state = createMatch(90503, { p1Kind: 'lamuh_legacy_v2', p2Kind: 'lamuh_legacy_v2', p1X: -34, p2X: 34 });
    const actor = state.fighters.p1, defender = state.fighters.p2;
    if (example.air) {
      actor.grounded = false;
      actor.phase = 'jump';
      actor.y = -12;
      actor.vy = -1;
      actor.airActionsRemaining = 5;
    }
    const observed = [];
    for (let index = 0; index < 100; index++) {
      tick(state, index === 0 ? { p1: example.input } : {});
      if (state.lastCombatEvent?.tick === state.tick - 1 && state.lastCombatEvent.outcome === 'hit') {
        assert.strictEqual(state.lastCombatEvent.attackId, example.id);
        observed.push(defender.hitReactionWeight);
        const hitbox = fighterDefinitions.lamuh_legacy_v2.attacks[example.id].hitboxes[observed.length - 1];
        assert.strictEqual(state.lastCombatEvent.baseHitstun, hitbox.hitstun, 'Reaction classification must preserve authored hitstun');
        assert.strictEqual(actor.hitstop, hitbox.hitstop, 'Reaction classification must preserve authored hitstop');
      }
    }
    assert.deepStrictEqual(observed, example.weights, `${example.id} must distinguish light contacts from heavy/launch contacts`);
  }

  const crossKind = match('p1');
  tick(crossKind, { p1: { light: true } });
  advanceUntil(crossKind, () => crossKind.fighters.p1.attackConnected);
  assert.strictEqual(crossKind.fighters.p2.hitReactionWeight, 'heavy', 'Other victim presentations must remain unchanged');
}

for (const test of [
  testGroundedCancelRestartsAuthoredTimeline,
  testSpecialCancelPreservesBothAuthoredContactsAndReplay,
  testWhiffCannotCancelAndPrototypeBehaviorIsPreserved,
  testLamuhCannotReachCopiedUpHeavySpecial,
  testLamuhReactionWeightMatchesContactIntent
]) {
  test();
  console.log(`PASS ${test.name}`);
}
