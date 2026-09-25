const assert = require('assert');
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const {
  createMatch,
  executeReplay,
  recordReplay,
  restoreSnapshot,
  saveSnapshot,
  tick,
  tickWithFighterOrder
} = require('../dist');
const { fighterDefinitions } = require('../dist/data/fighters');

const EXPECTED_LEGACY_GAME_SHA256 = 'D081DA2D907CF6ABD978301C1637008B26CCB30B47E2CCAFCA3FEA3331910C6B';

function lamuhMatch(seed = 2101, p1X = -30, p2X = 30) {
  return createMatch(seed, {
    matchId: `lamuh-test-${seed}`,
    p1Kind: 'lamuh_legacy_v2',
    p2Kind: 'training_dummy',
    p1X,
    p2X
  });
}

function advanceUntil(state, predicate, max = 240, inputAt = () => ({})) {
  for (let index = 0; index < max; index++) {
    tick(state, inputAt(index));
    if (predicate(state)) return index + 1;
  }
  throw new Error(`condition not reached within ${max} ticks`);
}

function testIndependentRecommendedTimingProfiles() {
  const attacks = fighterDefinitions.lamuh_legacy_v2.attacks;
  assert.deepStrictEqual(
    Object.fromEntries(['standing_light', 'standing_medium', 'standing_heavy', 'crouching_light', 'crouching_medium', 'crouching_heavy'].map((id) => [id, [attacks[id].startup, attacks[id].active, attacks[id].recovery]])),
    {
      standing_light: [3, 5, 6], standing_medium: [6, 6, 11], standing_heavy: [11, 5, 21],
      crouching_light: [3, 4, 7], crouching_medium: [6, 5, 11], crouching_heavy: [10, 5, 22]
    }
  );
  assert.notStrictEqual(14 / 12, 23 / 20, 'moves must not share one blanket duration multiplier');
  assert.deepStrictEqual([attacks.air_light.startup, attacks.air_light.active, attacks.air_light.recovery], [3, 5, 5]);
  assert.deepStrictEqual([attacks.air_medium.startup, attacks.air_medium.active, attacks.air_medium.recovery], [6, 4, 11]);
  assert.strictEqual(attacks.legacy_ascend_step.startup + attacks.legacy_ascend_step.active + attacks.legacy_ascend_step.recovery, 48);
}

function testConfigurableLamuhMatchAndReplay() {
  const state = lamuhMatch(2102);
  assert.strictEqual(state.fighters.p1.kind, 'lamuh_legacy_v2');
  assert.strictEqual(state.matchConfig.p1Kind, 'lamuh_legacy_v2');
  for (let frame = 0; frame < 75; frame++) {
    const p1 = frame === 2 ? { light: true } : frame === 28 ? { throw: true } : {};
    tick(state, { p1 });
  }
  const replay = recordReplay(state);
  const replayed = executeReplay(replay);
  assert.strictEqual(replayed.fighters.p1.kind, 'lamuh_legacy_v2');
  assert.deepStrictEqual(replayed.checksums, state.checksums);
}

function testForwardThrowConnectsThroughPhysicalTrack() {
  const state = lamuhMatch(2103);
  const positions = [];
  tick(state, { p1: { throw: true } });
  advanceUntil(state, (s) => s.throwInteraction?.result === 'connected', 12);
  assert.strictEqual(state.fighters.p2.phase, 'thrown');
  while (state.throwInteraction) {
    positions.push({ attacker: state.fighters.p1.x, victim: state.fighters.p2.x });
    tick(state, {});
  }
  assert.strictEqual(state.fighters.p2.health, 930);
  assert.strictEqual(state.fighters.p2.phase, 'knockdown');
  assert.ok(state.fighters.p2.x > state.fighters.p1.x, 'forward throw must release the victim forward');
  for (let index = 1; index < positions.length; index++) {
    assert.ok(Math.abs(positions[index].victim - positions[index - 1].victim) <= 22, 'victim track must remain continuous rather than teleporting');
  }
}

function testThrowCaptureAnchorsAtMinMidAndMaxRange() {
  // The attacker is at 3.75 units on the last pending sample, so these initial separations
  // exercise actual connect-frame separations of 0, 37 and 74 units.
  for (const initialSeparation of [3.75, 40.75, 77.75]) {
    const state = lamuhMatch(2200 + initialSeparation, 0, initialSeparation);
    tick(state, { p1: { throw: true } });
    let beforeConnect = state.fighters.p2.x;
    while (state.throwInteraction?.result === 'pending') {
      beforeConnect = state.fighters.p2.x;
      tick(state, {});
    }
    assert.strictEqual(state.throwInteraction?.result, 'connected', `separation ${initialSeparation} should connect`);
    assert.ok(Math.abs(state.fighters.p2.x - beforeConnect) < 0.0001, `victim snapped on connect at separation ${initialSeparation}`);
  }
}

function testThrowDurationsHonorAuthoredTicksAndHitstopFreeze() {
  const whiff = lamuhMatch(2301, -140, 140);
  let whiffCalls = 0;
  do { tick(whiff, whiffCalls++ === 0 ? { p1: { throw: true } } : {}); } while (whiff.throwInteraction);
  assert.strictEqual(whiffCalls, 32, '32-tick authored whiff must consume exactly 32 simulation calls');

  for (const [back, authoredTicks, hitstop] of [[false, 32, 6], [true, 36, 7]]) {
    const state = lamuhMatch(back ? 2303 : 2302);
    let calls = 0;
    do {
      const input = calls === 0 ? { p1: back ? { left: true, throw: true } : { throw: true } } : {};
      tick(state, input); calls++;
    } while (state.throwInteraction);
    assert.strictEqual(calls, authoredTicks + hitstop, `${back ? 'back' : 'forward'} throw must add only authored hitstop freezes`);
    assert.strictEqual(state.fighters.p1.phase, 'idle');
  }
}

function testBackThrowSideSwitchesThroughTrack() {
  const state = lamuhMatch(2104);
  tick(state, { p1: { left: true, throw: true } });
  advanceUntil(state, (s) => s.throwInteraction === null, 90);
  assert.strictEqual(state.fighters.p2.health, 925);
  assert.ok(state.fighters.p2.x < state.fighters.p1.x, 'back throw must physically place the victim behind Lamuh');
  assert.strictEqual(state.fighters.p2.phase, 'knockdown');
}

function testThrowWhiffLeavesVictimUntouched() {
  const state = lamuhMatch(2105, -130, 130);
  tick(state, { p1: { throw: true } });
  advanceUntil(state, (s) => s.throwInteraction?.result === 'whiff', 12);
  assert.strictEqual(state.lastThrowEvent.type, 'whiff');
  assert.strictEqual(state.fighters.p2.health, 1000);
  advanceUntil(state, (s) => s.throwInteraction === null, 60);
  assert.strictEqual(state.fighters.p1.phase, 'idle');
  assert.strictEqual(state.fighters.p2.health, 1000);
}

function testThrowSnapshotAndOrderDeterminism() {
  const state = lamuhMatch(2106);
  tick(state, { p1: { throw: true } });
  advanceUntil(state, (s) => s.throwInteraction?.result === 'connected', 12);
  const restored = restoreSnapshot(saveSnapshot(state));
  while (state.throwInteraction) tick(state, {});
  while (restored.throwInteraction) tick(restored, {});
  assert.deepStrictEqual(restored.checksums, state.checksums);

  const normal = lamuhMatch(2107), reversed = lamuhMatch(2107);
  const frames = [{ p1: { throw: true } }, {}, {}, {}, {}, {}, {}, {}, {}, {}];
  for (const frame of frames) {
    tickWithFighterOrder(normal, frame, ['p1', 'p2']);
    tickWithFighterOrder(reversed, frame, ['p2', 'p1']);
  }
  assert.deepStrictEqual(reversed, normal);
}

function testPresentationEventIdsAreDeterministicAndUnique() {
  const state = lamuhMatch(2108);
  tick(state, { p1: { throw: true } });
  advanceUntil(state, (s) => s.throwInteraction === null, 90);
  assert.strictEqual(new Set(state.presentationEventLedger).size, state.presentationEventLedger.length);
  assert.ok(state.presentationEventLedger.every((id) => /^lamuh-test-2108:\d+:p1:1:\d+$/.test(id)));
  const repeat = lamuhMatch(2108);
  tick(repeat, { p1: { throw: true } });
  advanceUntil(repeat, (s) => s.throwInteraction === null, 90);
  assert.deepStrictEqual(repeat.presentationEventLedger, state.presentationEventLedger);
}

function testAttackPresentationEventAlignsWithVisibleContact() {
  const reviewData = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'public', 'lamuh-legacy-v2', 'review-data.json'), 'utf8'));
  const timing = reviewData.timingCandidates.moves.find((move) => move.moveId === 'standing_light');
  const runtime = reviewData.runtimeTimelines.standing_light;
  const contactFrame = Math.min(...timing.contactSourceFrames);
  const displayFrameAt = (tickNo) => {
    let cursor = tickNo;
    for (let frame = 0; frame < runtime.exposureTicks.length; frame++) {
      if (cursor < runtime.exposureTicks[frame]) return frame;
      cursor -= runtime.exposureTicks[frame];
    }
    return runtime.exposureTicks.length - 1;
  };
  const state = lamuhMatch(2401, -150, 150);
  tick(state, { p1: { light: true } });
  advanceUntil(state, (s) => s.fighters.p1.phaseTick === timing.candidates.B.phaseTicks.startup, 10);
  assert.strictEqual(displayFrameAt(state.fighters.p1.phaseTick), contactFrame);
  assert.ok(state.presentationEventLedger.some((id) => /^lamuh-test-2401:\d+:p1:1:0$/.test(id)), 'normal contact event must use the deterministic presentation ID contract');
}

function testSignatureSpecialUsesSimulationRootAndHits() {
  const state = lamuhMatch(2109, -96, 30);
  const startX = state.fighters.p1.x;
  tick(state, { p1: { right: true, special: true, medium: true } });
  assert.strictEqual(state.fighters.p1.currentAttack, 'legacy_ascend_step');
  advanceUntil(state, (s) => s.fighters.p2.hitCountTaken === 2, 60);
  assert.ok(state.fighters.p1.x > startX + 8, 'signature root motion must come from the simulation track');
  assert.strictEqual(state.fighters.p2.health, 934);
  assert.strictEqual(state.fighters.p2.grounded, false);
  assert.ok(state.fighters.p2.vy < 0, 'signature second contact must launch the victim upward');
}

function testAttackEntryAndExitReturnToNeutral() {
  const state = lamuhMatch(2110, -150, 150);
  tick(state, { p1: { light: true } });
  assert.strictEqual(state.fighters.p1.phase, 'attack');
  advanceUntil(state, (s) => s.fighters.p1.phase === 'idle', 30);
  assert.strictEqual(state.fighters.p1.currentAttack, null);
  tick(state, { p1: { right: true } });
  assert.strictEqual(state.fighters.p1.phase, 'walk_forward');
}

function testRequiredTransitionMatrix() {
  const idle = lamuhMatch(2501, -150, 150);
  tick(idle, { p1: { light: true } });
  assert.strictEqual(idle.fighters.p1.phase, 'attack', 'idle -> attack');
  advanceUntil(idle, (s) => s.fighters.p1.phase === 'idle', 30);
  tick(idle, { p1: { right: true } });
  assert.strictEqual(idle.fighters.p1.phase, 'walk_forward', 'attack -> idle -> walk');

  const walk = lamuhMatch(2502, -150, 150);
  tick(walk, { p1: { right: true } });
  tick(walk, { p1: { medium: true } });
  assert.strictEqual(walk.fighters.p1.currentAttack, 'standing_medium', 'walk -> attack');

  const crouch = lamuhMatch(2503, -150, 150);
  tick(crouch, { p1: { down: true } });
  assert.strictEqual(crouch.fighters.p1.phase, 'crouch');
  tick(crouch, { p1: { down: true, light: true } });
  assert.strictEqual(crouch.fighters.p1.currentAttack, 'crouching_light', 'crouch -> attack');

  const air = lamuhMatch(2504, -150, 150);
  tick(air, { p1: { up: true } });
  advanceUntil(air, (s) => s.fighters.p1.phase === 'jump' && !s.fighters.p1.grounded, 12);
  tick(air, { p1: { light: true } });
  assert.strictEqual(air.fighters.p1.currentAttack, 'air_light', 'jump -> air attack');
  advanceUntil(air, (s) => s.fighters.p1.phase === 'landing', 120);
  assert.strictEqual(air.fighters.p1.currentAttack, null, 'air attack -> landing clears attack');

  const hit = lamuhMatch(2505, -30, 30);
  tick(hit, { p2: { light: true } });
  advanceUntil(hit, (s) => s.fighters.p1.phase === 'hit_reaction', 20);
  advanceUntil(hit, (s) => s.fighters.p1.phase === 'idle', 60);
  assert.strictEqual(hit.fighters.p1.hitstun, 0, 'hit -> recovery');

  const whiff = lamuhMatch(2506, -140, 140);
  tick(whiff, { p1: { throw: true } });
  advanceUntil(whiff, (s) => s.throwInteraction === null, 40);
  assert.strictEqual(whiff.fighters.p1.phase, 'idle', 'grab whiff -> neutral');

  const connected = lamuhMatch(2507);
  tick(connected, { p1: { throw: true } });
  advanceUntil(connected, (s) => s.throwInteraction === null, 50);
  assert.strictEqual(connected.fighters.p1.phase, 'idle', 'throw -> neutral');
}

function testAirLightAndAirMediumSingleHitParity() {
  const attacks = fighterDefinitions.lamuh_legacy_v2.attacks;
  assert.strictEqual(attacks.air_light.hitboxes.length, 1, 'Jump Light must remain a single gameplay hit');
  assert.deepStrictEqual(attacks.air_medium.hitboxes.map((hitbox) => [hitbox.id, hitbox.start, hitbox.end, hitbox.damage]), [
    ['legacy_jm_kick', 6, 9, 44]
  ], 'Jump Medium must expose exactly one kick hit window');

  const armAirAttackFixture = (state) => {
    const fighter = state.fighters.p1;
    fighter.grounded = false;
    fighter.phase = 'jump';
    fighter.phaseTick = 0;
    fighter.y = -20;
    fighter.vy = -4;
    fighter.airActionsRemaining = 5;
  };

  const airLight = lamuhMatch(2510, -30, 30);
  armAirAttackFixture(airLight);
  tick(airLight, { p1: { light: true } });
  advanceUntil(airLight, (state) => state.fighters.p2.hitCountTaken === 1, 30);
  advanceUntil(airLight, (state) => state.fighters.p1.currentAttack === null, 90);
  assert.strictEqual(airLight.fighters.p2.hitCountTaken, 1);
  assert.strictEqual(airLight.fighters.p2.health, 978);

  const airMedium = lamuhMatch(2511, -30, 30);
  armAirAttackFixture(airMedium);
  tick(airMedium, { p1: { medium: true } });
  advanceUntil(airMedium, (state) => state.fighters.p2.hitCountTaken === 1, 60);
  advanceUntil(airMedium, (state) => state.fighters.p1.currentAttack === null, 90);
  assert.strictEqual(airMedium.fighters.p2.hitCountTaken, 1);
  assert.strictEqual(airMedium.fighters.p2.health, 956, 'Jump Medium must deal its full 44 damage as one hit');
  assert.strictEqual(airMedium.fighters.p1.comboCount, 1);
  assert.deepStrictEqual(airMedium.fighters.p1.comboRoute, ['air_medium']);
  assert.strictEqual(attacks.air_medium.hitboxes[0].juggleCost, 2);
  assert.strictEqual(airMedium.lastCombatEvent.hitOrdinal, 1);
}

function beginAirDash(state, direction) {
  tick(state, { p1: { up: true } });
  advanceUntil(state, (s) => s.fighters.p1.phase === 'jump' && !s.fighters.p1.grounded, 12);
  const fighter = state.fighters.p1;
  const forward = direction === 'forward';
  const tap = fighter.facing === (forward ? 1 : -1) ? { right: true } : { left: true };
  tick(state, { p1: tap });
  tick(state, {});
  const dashStartX = fighter.x;
  tick(state, { p1: tap });
  assert.strictEqual(fighter.phase, `air_dash_${direction}`);
  return { fighter, dashStartX, tap };
}

function finishAirDash(state, direction) {
  const fighter = state.fighters.p1;
  const samples = [];
  while (fighter.phase === `air_dash_${direction}`) {
    samples.push({ x: fighter.x, y: fighter.y, phaseTick: fighter.phaseTick });
    tick(state, {});
  }
  return samples;
}

function testLamuhAirDashesAreFixedDurationSingleUseAndDeterministic() {
  const forward = lamuhMatch(2701, -180, 180);
  const startedForward = beginAirDash(forward, 'forward');
  assert.strictEqual(startedForward.fighter.airDashesRemaining, 0);
  const forwardSamples = finishAirDash(forward, 'forward');
  assert.strictEqual(forwardSamples.length, fighterDefinitions.lamuh_legacy_v2.movement.airDashDuration);
  assert.strictEqual(new Set(forwardSamples.map((sample) => sample.y)).size, 1, 'air dash must suspend gravity during the authored burst');
  const forwardDistance = Number((startedForward.fighter.x - startedForward.dashStartX).toFixed(2));
  assert.strictEqual(forwardDistance, 72.1);
  assert.strictEqual(startedForward.fighter.phase, 'jump');

  tick(forward, { p1: startedForward.tap }); tick(forward, {}); tick(forward, { p1: startedForward.tap });
  assert.notStrictEqual(startedForward.fighter.phase, 'air_dash_forward', 'only one air dash is allowed before landing');
  advanceUntil(forward, (state) => state.fighters.p1.phase === 'landing', 120);
  advanceUntil(forward, (state) => state.fighters.p1.phase === 'idle', 20);
  tick(forward, { p1: { up: true } });
  advanceUntil(forward, (state) => state.fighters.p1.phase === 'jump', 12);
  assert.strictEqual(startedForward.fighter.airDashesRemaining, 1, 'landing and a new jump must restore one air dash');

  const backward = lamuhMatch(2702, -180, 180);
  const startedBackward = beginAirDash(backward, 'backward');
  const backwardSamples = finishAirDash(backward, 'backward');
  assert.strictEqual(backwardSamples.length, fighterDefinitions.lamuh_legacy_v2.movement.airDashDuration);
  assert.strictEqual(Number((startedBackward.fighter.x - startedBackward.dashStartX).toFixed(2)), -62.3);

  const replay = recordReplay(backward);
  const replayed = executeReplay(replay);
  assert.deepStrictEqual(replayed.checksums, backward.checksums, 'air-dash replay checksums must be deterministic');
  assert.strictEqual(fighterDefinitions.lamuh_proto.movement.airDashCount, 0, 'Lamuh air-dash tuning must not leak into the prototype fighter');
}

function testLamuhThrowTracksAreCharacterScoped() {
  assert.ok(fighterDefinitions.lamuh_legacy_v2.throws.forward_throw);
  assert.ok(fighterDefinitions.lamuh_proto.throws.forward_throw, 'prototype compatibility throw remains available');
  assert.notStrictEqual(fighterDefinitions.lamuh_proto.throws.forward_throw, fighterDefinitions.lamuh_legacy_v2.throws.forward_throw);
  assert.notDeepStrictEqual(fighterDefinitions.lamuh_proto.throws.forward_throw.track, fighterDefinitions.lamuh_legacy_v2.throws.forward_throw.track);
  assert.deepStrictEqual(fighterDefinitions.training_dummy.throws, {});
  const state = createMatch(2601);
  tick(state, { p1: { throw: true }, p2: { throw: true } });
  assert.strictEqual(state.throwInteraction?.attacker, 'p1');
  assert.notDeepStrictEqual(fighterDefinitions.lamuh_proto.throws.forward_throw.track, fighterDefinitions.lamuh_legacy_v2.throws.forward_throw.track, 'default fighter must not execute Lamuh-specific choreography');
}

function testCrouchReleaseIsDeterministicAndImmediatelyInterruptible() {
  const state = lamuhMatch(2801);
  tick(state, { p1: { down: true } });
  tick(state, { p1: { down: true } });
  assert.strictEqual(state.fighters.p1.phase, 'crouch');
  tick(state, {});
  assert.strictEqual(state.fighters.p1.phase, 'crouch_release');
  const visibleTicks = [state.fighters.p1.phaseTick];
  while (state.fighters.p1.phase === 'crouch_release') {
    tick(state, {});
    if (state.fighters.p1.phase === 'crouch_release') visibleTicks.push(state.fighters.p1.phaseTick);
  }
  assert.deepStrictEqual(visibleTicks, [1, 2, 3, 4, 5, 6, 7, 8]);
  assert.strictEqual(state.fighters.p1.phase, 'idle');

  const attackInterrupt = lamuhMatch(2802);
  tick(attackInterrupt, { p1: { down: true } });
  tick(attackInterrupt, { p1: { light: true } });
  assert.strictEqual(attackInterrupt.fighters.p1.phase, 'attack');
  assert.strictEqual(attackInterrupt.fighters.p1.currentAttack, 'standing_light');

  const walkInterrupt = lamuhMatch(2803);
  tick(walkInterrupt, { p1: { down: true } });
  tick(walkInterrupt, { p1: { right: true } });
  assert.strictEqual(walkInterrupt.fighters.p1.phase, 'walk_forward');

  const replay = recordReplay(state);
  const replayed = executeReplay(replay);
  assert.deepStrictEqual(replayed.checksums, state.checksums, 'crouch-release replay checksums must remain deterministic');
}

function testLegacyGameRemainsHashLocked() {
  const gamePath = path.resolve(__dirname, '..', '..', 'game.js');
  const digest = crypto.createHash('sha256').update(fs.readFileSync(gamePath)).digest('hex').toUpperCase();
  assert.strictEqual(digest, EXPECTED_LEGACY_GAME_SHA256);
}

const tests = [
  testIndependentRecommendedTimingProfiles,
  testConfigurableLamuhMatchAndReplay,
  testForwardThrowConnectsThroughPhysicalTrack,
  testThrowCaptureAnchorsAtMinMidAndMaxRange,
  testThrowDurationsHonorAuthoredTicksAndHitstopFreeze,
  testBackThrowSideSwitchesThroughTrack,
  testThrowWhiffLeavesVictimUntouched,
  testThrowSnapshotAndOrderDeterminism,
  testPresentationEventIdsAreDeterministicAndUnique,
  testAttackPresentationEventAlignsWithVisibleContact,
  testSignatureSpecialUsesSimulationRootAndHits,
  testAttackEntryAndExitReturnToNeutral,
  testRequiredTransitionMatrix,
  testAirLightAndAirMediumSingleHitParity,
  testLamuhAirDashesAreFixedDurationSingleUseAndDeterministic,
  testLamuhThrowTracksAreCharacterScoped,
  testCrouchReleaseIsDeterministicAndImmediatelyInterruptible,
  testLegacyGameRemainsHashLocked
];

for (const test of tests) {
  test();
  console.log(`PASS ${test.name}`);
}
