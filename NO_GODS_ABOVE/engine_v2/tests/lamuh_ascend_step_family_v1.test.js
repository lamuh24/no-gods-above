const assert = require('assert');
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const { createMatch, executeReplay, recordReplay, tick, tickWithFighterOrder } = require('../dist');
const { fighterDefinitions, LAMUH_ASCEND_HEAVY_V1_HISTORICAL } = require('../dist/data/fighters');

const EXPECTED_LEGACY_GAME_SHA256 = 'D081DA2D907CF6ABD978301C1637008B26CCB30B47E2CCAFCA3FEA3331910C6B';
const legacyGamePath = path.resolve(__dirname, '..', '..', 'game.js');

function match(seed, p1X = -110, p2X = 30) {
  return createMatch(seed, {
    matchId: `lamuh-ascend-family-${seed}`,
    p1Kind: 'lamuh_legacy_v2',
    p2Kind: 'training_dummy',
    p1X,
    p2X
  });
}

function startVariant(state, button) {
  tick(state, { p1: { right: true, special: true, [button]: true } });
  return state.fighters.p1.currentAttack;
}

function advanceUntil(state, predicate, max = 180) {
  for (let index = 0; index < max; index++) {
    tick(state, {});
    if (predicate(state)) return;
  }
  throw new Error(`condition not reached in ${max} ticks`);
}

function testFamilyDefinitionsAndInputRouting() {
  const attacks = fighterDefinitions.lamuh_legacy_v2.attacks;
  assert.deepStrictEqual(
    ['legacy_ascend_step_light', 'legacy_ascend_step', 'legacy_ascend_step_heavy'].map((id) => [id, attacks[id].command, attacks[id].startup + attacks[id].active + attacks[id].recovery]),
    [
      ['legacy_ascend_step_light', '6S+L', 20],
      ['legacy_ascend_step', '6S+M', 48],
      ['legacy_ascend_step_heavy', '6S+H', 42]
    ]
  );
  assert.strictEqual(startVariant(match(3101), 'light'), 'legacy_ascend_step_light');
  assert.strictEqual(startVariant(match(3102), 'medium'), 'legacy_ascend_step');
  assert.strictEqual(startVariant(match(3103), 'heavy'), 'legacy_ascend_step_heavy');
  assert.deepStrictEqual(
    [attacks.legacy_ascend_step.startup, attacks.legacy_ascend_step.active, attacks.legacy_ascend_step.recovery],
    [7, 24, 17],
    'Medium must preserve the authored traveling slide, coil, planted-hands back-handspring, asymmetric rising heel, tuck, landing, and recovery rhythm'
  );
  assert.deepStrictEqual(
    attacks.legacy_ascend_step.hitboxes.map((hitbox) => [hitbox.id, hitbox.start, hitbox.end, hitbox.damage, hitbox.level, !!hitbox.launches]),
    [
      ['legacy_ascend_step_medium_slide', 7, 9, 26, 'low', false],
      ['legacy_ascend_step_medium_backspring_launcher', 26, 28, 44, 'launcher', true]
    ],
    'Medium must expose exactly the two authored contacts'
  );
  assert.strictEqual(attacks.legacy_ascend_step.rootMotion, undefined);
  assert.deepStrictEqual(attacks.legacy_ascend_step.rootMotionSegments, [
    { start: 2, end: 11, velocity: 9 },
    { start: 12, end: 16, velocity: -2 },
    { start: 17, end: 26, velocity: -1.4 },
    { start: 27, end: 33, velocity: -1 }
  ]);
  assert.deepStrictEqual(
    [attacks.legacy_ascend_step_heavy.startup, attacks.legacy_ascend_step_heavy.active, attacks.legacy_ascend_step_heavy.recovery],
    [24, 5, 13],
    'Heavy must reserve startup for reappearance, pause, and visible energy growth before the single blast'
  );

  const mirrored = createMatch(3104, {
    matchId: 'lamuh-ascend-family-mirrored', p1Kind: 'training_dummy', p2Kind: 'lamuh_legacy_v2', p1X: -30, p2X: 110
  });
  tick(mirrored, { p2: { left: true, special: true, heavy: true } });
  assert.strictEqual(mirrored.fighters.p2.currentAttack, 'legacy_ascend_step_heavy');
}

function testLightAndHeavyRemainOneHitVariants() {
  for (const [seed, button, attackId, damage] of [
    [3111, 'light', 'legacy_ascend_step_light', 32],
    [3113, 'heavy', 'legacy_ascend_step_heavy', 84]
  ]) {
    const state = match(seed);
    assert.strictEqual(startVariant(state, button), attackId);
    advanceUntil(state, (current) => current.fighters.p2.health < 1000);
    advanceUntil(state, (current) => current.fighters.p1.currentAttack === null);
    assert.strictEqual(state.fighters.p2.health, 1000 - damage, `${attackId} must apply exactly one authored hit`);
    assert.strictEqual(state.fighters.p2.hitCountTaken, 1, `${attackId} must not become multi-hit`);
  }
}

function testMediumSlideBackHandspringRegistersTwoHitsAndLaunches() {
  const state = match(3112);
  const startX = state.fighters.p1.x;
  assert.strictEqual(startVariant(state, 'medium'), 'legacy_ascend_step');
  advanceUntil(state, (current) => current.fighters.p2.hitCountTaken === 1);
  assert.strictEqual(state.fighters.p2.health, 974, 'slide kick must apply the first 26-damage contact');
  assert.strictEqual(state.fighters.p2.grounded, true, 'slide kick must stay grounded and set up the back-handspring launcher');
  assert.strictEqual(state.lastCombatEvent.hitOrdinal, 1);
  assert.ok(state.fighters.p1.x > startX, 'the first hit must visibly travel forward with the simulation root');

  advanceUntil(state, (current) => current.fighters.p1.phaseTick === 11);
  const slidePeakX = state.fighters.p1.x;
  advanceUntil(state, (current) => current.fighters.p1.phaseTick === 17);
  assert.ok(state.fighters.p1.x < slidePeakX, 'the coil must redirect the simulation root backward before the rising heel');

  advanceUntil(state, (current) => current.fighters.p2.hitCountTaken === 2);
  assert.strictEqual(state.fighters.p2.health, 934, 'launcher must apply the scaled second hit for 66 total route damage');
  assert.strictEqual(state.fighters.p2.grounded, false, 'the second visible contact must launch upward');
  assert.ok(state.fighters.p2.vy < 0, 'launcher velocity must travel upward');
  assert.strictEqual(state.lastCombatEvent.hitOrdinal, 2);
  assert.strictEqual(state.lastCombatEvent.attackId, 'legacy_ascend_step');
  assert.strictEqual(state.presentationEventLedger.length, 2, 'each authored contact needs one deterministic presentation event');
  assert.ok(state.fighters.p1.x > startX, 'the complete move should retain net forward travel after the backward handspring');
  assert.ok(state.presentationEventLedger.some((id) => id.endsWith(':0')));
  assert.ok(state.presentationEventLedger.some((id) => id.endsWith(':1')));
  assert.strictEqual(new Set(state.presentationEventLedger).size, state.presentationEventLedger.length);

  advanceUntil(state, (current) => current.fighters.p1.currentAttack === null);
  assert.strictEqual(state.fighters.p2.hitCountTaken, 2, 'Medium must not register hidden or duplicate hits');
}

function testHeavySwitchesBehindWithoutMovingVictim() {
  const state = match(3121);
  startVariant(state, 'heavy');
  assert.strictEqual(state.fighters.p2.health, 1000);
  advanceUntil(state, (current) => current.fighters.p1.phaseTick === 13);
  const victimBeforeSwitch = state.fighters.p2.x;
  tick(state, {});
  assert.strictEqual(state.fighters.p1.phaseTick, 14);
  assert.strictEqual(state.fighters.p2.x, victimBeforeSwitch, 'target-side switch must never translate the victim');
  assert.strictEqual(state.fighters.p1.x, victimBeforeSwitch + 62, 'Lamuh must keep the authored distance when the target pushbox already leaves legal space');
  assert.strictEqual(state.fighters.p1.facing, -1, 'Lamuh must turn to face the target after switching sides');
  assert.strictEqual(state.fighters.p2.health, 1000, 'the approach and teleport must not deal damage');
  advanceUntil(state, (current) => current.fighters.p1.phaseTick === 23);
  assert.strictEqual(state.fighters.p2.health, 1000, 'the pause and growing energy ball must not deal early damage');
  assert.ok(state.presentationEventLedger.some((id) => id.endsWith(':1')), 'side switch needs one deterministic presentation event');
  advanceUntil(state, (current) => current.fighters.p2.health < 1000);
  assert.strictEqual(state.fighters.p2.health, 916);
  assert.strictEqual(state.fighters.p2.hitCountTaken, 1);
  assert.ok(state.presentationEventLedger.some((id) => id.endsWith(':0')), 'the single blast needs one deterministic contact event');
  assert.strictEqual(new Set(state.presentationEventLedger).size, state.presentationEventLedger.length);

  const lamuhOpponent = createMatch(3122, {
    matchId: 'lamuh-ascend-heavy-collision-safe-switch', p1Kind: 'lamuh_legacy_v2', p2Kind: 'lamuh_legacy_v2', p1X: -110, p2X: 30
  });
  startVariant(lamuhOpponent, 'heavy');
  advanceUntil(lamuhOpponent, (current) => current.fighters.p1.phaseTick === 13);
  const lamuhVictimBeforeSwitch = lamuhOpponent.fighters.p2.x;
  tick(lamuhOpponent, {});
  assert.strictEqual(lamuhOpponent.fighters.p2.x, lamuhVictimBeforeSwitch, 'collision-safe Heavy switch must not translate a Lamuh victim');
  assert.ok(Math.abs(lamuhOpponent.fighters.p1.x - (lamuhVictimBeforeSwitch + 68.0001)) < 0.0001, 'Heavy switch must expand only its attacker placement to clear the adult Lamuh pushboxes');
}

function testHeavyWhiffAndCornerFallbackAreDeterministic() {
  const far = match(3131, -300, 300);
  startVariant(far, 'heavy');
  advanceUntil(far, (current) => current.fighters.p1.currentAttack === null);
  assert.strictEqual(far.fighters.p2.health, 1000);
  assert.strictEqual(far.fighters.p1.facing, 1, 'far whiff must not side switch');
  assert.ok(!far.presentationEventLedger.some((id) => id.endsWith(':1')));

  const corner = match(3132, 300, 410);
  startVariant(corner, 'heavy');
  advanceUntil(corner, (current) => current.fighters.p1.phaseTick === 14);
  assert.ok(corner.fighters.p1.x <= corner.stage.right);
  assert.strictEqual(corner.fighters.p1.facing, 1, 'illegal behind-target space must use the no-switch corner fallback');
  assert.ok(!corner.presentationEventLedger.some((id) => id.endsWith(':1')));
}

function testHeavyReplayAndFighterOrderParity() {
  const state = match(3141);
  startVariant(state, 'heavy');
  advanceUntil(state, (current) => current.fighters.p1.currentAttack === null);
  const replayed = executeReplay(recordReplay(state));
  assert.deepStrictEqual(replayed.checksums, state.checksums);
  assert.deepStrictEqual(replayed.presentationEventLedger, state.presentationEventLedger);

  const normal = match(3142);
  const reversed = match(3142);
  for (let frame = 0; frame < 64; frame++) {
    const input = frame === 0 ? { p1: { right: true, special: true, heavy: true } } : {};
    tickWithFighterOrder(normal, input, ['p1', 'p2']);
    tickWithFighterOrder(reversed, input, ['p2', 'p1']);
  }
  assert.deepStrictEqual(reversed, normal);
}

function testMediumReplayAndFighterOrderParity() {
  const state = match(3143);
  startVariant(state, 'medium');
  advanceUntil(state, (current) => current.fighters.p1.currentAttack === null);
  const replayed = executeReplay(recordReplay(state));
  assert.deepStrictEqual(replayed.checksums, state.checksums);
  assert.deepStrictEqual(replayed.presentationEventLedger, state.presentationEventLedger);

  const normal = match(3144);
  const reversed = match(3144);
  for (let frame = 0; frame < 72; frame++) {
    const input = frame === 0 ? { p1: { right: true, special: true, medium: true } } : {};
    tickWithFighterOrder(normal, input, ['p1', 'p2']);
    tickWithFighterOrder(reversed, input, ['p2', 'p1']);
  }
  assert.deepStrictEqual(reversed, normal);
}

function testLegacyGameRemainsHashLocked() {
  const actual = crypto.createHash('sha256').update(fs.readFileSync(legacyGamePath)).digest('hex').toUpperCase();
  assert.strictEqual(actual, EXPECTED_LEGACY_GAME_SHA256);
}

const tests = [
  testFamilyDefinitionsAndInputRouting,
  testLightAndHeavyRemainOneHitVariants,
  testMediumSlideBackHandspringRegistersTwoHitsAndLaunches,
  testHeavySwitchesBehindWithoutMovingVictim,
  testHeavyWhiffAndCornerFallbackAreDeterministic,
  testHeavyReplayAndFighterOrderParity,
  testMediumReplayAndFighterOrderParity,
  testLegacyGameRemainsHashLocked
];
for (const test of tests) {
  // Explicit historical V1 audit, not the newly authorized playable hit-confirm H.
  const playableHeavy = fighterDefinitions.lamuh_legacy_v2.attacks.legacy_ascend_step_heavy;
  fighterDefinitions.lamuh_legacy_v2.attacks.legacy_ascend_step_heavy = LAMUH_ASCEND_HEAVY_V1_HISTORICAL;
  try { test(); } finally { fighterDefinitions.lamuh_legacy_v2.attacks.legacy_ascend_step_heavy = playableHeavy; }
  console.log(`PASS ${test.name}`);
}
