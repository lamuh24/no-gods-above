const assert = require('assert');
const { createMatch, tick } = require('../dist');
const { fighterDefinitions } = require('../dist/data/fighters');

const LAMUH = fighterDefinitions.lamuh_legacy_v2;
const GROUND_NORMALS = ['standing_light', 'standing_medium', 'standing_heavy', 'crouching_light', 'crouching_medium', 'crouching_heavy'];
const AIR_NORMALS = ['air_light', 'air_medium', 'air_heavy'];
const SPECIAL_FAMILIES = ['legacy_celestial_palm_', 'legacy_aura_sweep_', 'legacy_heaven_splitter_', 'legacy_ascend_step'];
const RANK = { standing_light: 1, crouching_light: 1, standing_medium: 2, crouching_medium: 2, standing_heavy: 3, crouching_heavy: 3, air_light: 1, air_medium: 2, air_heavy: 3 };

function match(seed, p1X = -30, p2X = 30, p1Kind = 'lamuh_legacy_v2', p2Kind = 'lamuh_legacy_v2') {
  return createMatch(seed, { matchId: `modernization-${seed}`, p1Kind, p2Kind, p1X, p2X });
}
function run(state, ticks, inputAt = () => ({})) {
  for (let index = 0; index < ticks; index++) tick(state, inputAt(index, state));
  return state;
}

// 1. The gatling ladder exists and cannot loop back on itself ------------------------------
function testGatlingLadderIsCompleteAndStrictlyIncreasing() {
  for (const id of GROUND_NORMALS) {
    const cancel = LAMUH.attacks[id].cancel;
    assert.ok(cancel, `${id} must carry gatling routes`);
    assert.deepStrictEqual(cancel.onHit, cancel.onBlock, `${id} confirms and blockstrings must offer the same routes`);
    for (const family of SPECIAL_FAMILIES) {
      assert.ok(cancel.onHit.some((target) => target.startsWith(family)), `${id} must cancel into the ${family} family`);
    }
    assert.ok(cancel.onHit.includes('legacy_crown_of_no_gods'), `${id} must super cancel`);
    for (const target of cancel.onHit) {
      if (RANK[target] === undefined) continue;
      assert.ok(RANK[target] > RANK[id], `${id} -> ${target} would let a chain loop or repeat a button rank`);
    }
    assert.ok(!cancel.onHit.some((target) => target.startsWith('legacy_divine_vanish_')),
      `${id} must not cancel into the retreat: a blocked normal cannot buy a free escape`);
  }
  for (const id of AIR_NORMALS) {
    const cancel = LAMUH.attacks[id].cancel;
    assert.ok(cancel.onHit.some((target) => target.startsWith('legacy_radiant_dive_')), `${id} must cancel into the air special ender`);
    for (const target of cancel.onHit) {
      if (RANK[target] === undefined) continue;
      assert.ok(RANK[target] > RANK[id], `${id} -> ${target} would loop the air chain`);
    }
  }
}

// 2. Accepted move contracts stay untouched by the modernization ---------------------------
function testApprovedFamiliesAndOtherFightersAreUnchanged() {
  for (const id of Object.keys(LAMUH.attacks)) {
    if (GROUND_NORMALS.includes(id) || AIR_NORMALS.includes(id)) continue;
    assert.ok(!LAMUH.attacks[id].cancel, `${id} keeps its approved cancel-free contract`);
    assert.ok(!LAMUH.attacks[id].invulnerable, `${id} may not gain invulnerability without a human approval receipt`);
  }
  assert.deepStrictEqual(fighterDefinitions.lamuh_proto.attacks.standing_light.cancel,
    { onHit: ['standing_medium', 'crouching_medium'], onBlock: ['standing_medium', 'crouching_medium'] });
  assert.strictEqual(fighterDefinitions.lamuh_proto.movement.dashCancelTick, undefined);
  assert.strictEqual(fighterDefinitions.lamuh_proto.movement.backdashInvulnTicks, undefined);
  assert.strictEqual(fighterDefinitions.training_dummy.movement.backdashInvulnTicks, undefined);
}

// 3. A confirm actually routes light -> medium -> heavy -> special in the simulation --------
function testLiveNormalIntoSpecialRoute() {
  const state = match(4101);
  const p1 = state.fighters.p1;
  run(state, 46, (index) => {
    if (index === 0) return { p1: { light: true } };
    if (index === 6) return { p1: { medium: true } };
    if (index === 16) return { p1: { heavy: true } };
    // Chorded inside the heavy's hitstop and held through it, the way the special is played.
    if (index === 34) return { p1: { special: true, light: true } };
    if (index > 34 && index < 40) return { p1: { special: true } };
    return {};
  });
  assert.deepStrictEqual(p1.comboRoute, ['standing_light', 'standing_medium', 'standing_heavy']);
  assert.ok((state.projectiles || []).some((projectile) => projectile.attackId === 'legacy_celestial_palm_light'),
    'the blockstring/confirm must be able to end in a special, not dead-end on the heavy');
  assert.ok(state.fighters.p2.health < 900, 'the routed confirm must actually convert');
}

// 4. Super cancel is authored, not a free interrupt ----------------------------------------
function testSuperCancelRequiresAnAuthoredRoute() {
  const routed = match(4102);
  routed.fighters.p1.tension = 100;
  run(routed, 14, (index) => (index === 0 ? { p1: { light: true } } : index === 8 ? { p1: { ultimate: true } } : {}));
  assert.strictEqual(routed.fighters.p1.currentAttack, 'legacy_crown_of_no_gods', '5L must super cancel on hit');

  const raw = match(4103);
  raw.fighters.p1.tension = 100;
  run(raw, 14, (index) => (index === 0 ? { p1: { special: true, light: true } } : index === 8 ? { p1: { ultimate: true } } : {}));
  assert.strictEqual(raw.fighters.p1.currentAttack, 'legacy_celestial_palm_light',
    'a special with no authored super route may not be interrupted by the ultimate');
}

// 5. Counter hit rewards striking a committed opponent -------------------------------------
// p1's 5L lands on tick 5, while the defender is still in their own 5L startup.
function counterHitProbe(seed, defenderInput) {
  const state = match(seed);
  run(state, 6, (index) => ({ p1: index === 2 ? { light: true } : {}, p2: index === 4 ? defenderInput : {} }));
  return state;
}
function testCounterHitScalesDamageStunAndFreeze() {
  const neutral = counterHitProbe(4201, {});
  assert.strictEqual(neutral.fighters.p2.health, 976, 'a neutral opponent takes the authored 24');
  assert.ok(!neutral.lastCombatEvent.counterHit);

  const counter = counterHitProbe(4202, { light: true });
  assert.strictEqual(counter.lastCombatEvent.counterHit, true);
  assert.strictEqual(counter.fighters.p2.health, 971, 'counter hit applies the 1.2x damage bonus');
  assert.strictEqual(counter.lastCombatEvent.effectiveHitstun, neutral.lastCombatEvent.effectiveHitstun + 6);
  assert.strictEqual(counter.fighters.p2.hitstop, neutral.fighters.p2.hitstop + 3);
  assert.strictEqual(counter.fighters.p1.hitstop, counter.fighters.p2.hitstop, 'freeze stays symmetric, so frame advantage is unchanged');
  assert.strictEqual(counter.fighters.p2.hitReactionWeight, 'heavy', 'counter hit reads as a heavy reaction');
}
function testCounterHitIsScopedToLamuhLegacyAndSpareTheUltimate() {
  const proto = createMatch(4203, { matchId: 'modernization-proto', p1Kind: 'lamuh_proto', p2Kind: 'lamuh_proto', p1X: -30, p2X: 30 });
  run(proto, 6, (index) => ({ p1: index === 2 ? { light: true } : {}, p2: index === 4 ? { light: true } : {} }));
  assert.ok(!proto.lastCombatEvent.counterHit, 'other fighters keep their existing numbers');
  assert.strictEqual(proto.fighters.p2.health, 970, 'lamuh_proto 5L still deals its authored 30');
}

// 6. Dash is cancelable into offense, and never decays into a walk -------------------------
function dashState(seed) {
  const state = match(seed, -200, 200);
  run(state, 3, (index) => ({ p1: index === 0 || index === 2 ? { right: true } : {} }));
  assert.strictEqual(state.fighters.p1.phase, 'dash');
  return state;
}
function testDashCancelWindow() {
  const early = dashState(4301);
  tick(early, { p1: { right: true, light: true } });
  assert.strictEqual(early.fighters.p1.phase, 'dash', 'the first frames of the run stay committed');

  const late = dashState(4302);
  run(late, 5, () => ({ p1: { right: true } }));
  assert.strictEqual(late.fighters.p1.phase, 'dash', 'holding forward must not turn the run into a walk');
  assert.ok(late.fighters.p1.phaseTick >= LAMUH.movement.dashCancelTick);
  tick(late, { p1: { right: true, light: true } });
  assert.strictEqual(late.fighters.p1.phase, 'attack');
  assert.strictEqual(late.fighters.p1.currentAttack, 'standing_light');

  const jumped = dashState(4303);
  run(jumped, 6, () => ({ p1: { right: true } }));
  tick(jumped, { p1: { up: true } });
  assert.strictEqual(jumped.fighters.p1.phase, 'jump_startup', 'the run may also be cancelled into a jump');
}

// 7. Backdash buys real invulnerability, priced by full commitment --------------------------
function backdashProbe(seed, p1Kind) {
  const state = match(seed, -20, 20, p1Kind);
  run(state, 3, (index) => ({ p1: index === 0 || index === 2 ? { left: true } : {}, p2: index === 2 ? { light: true } : {} }));
  assert.strictEqual(state.fighters.p1.phase, 'backdash');
  run(state, 6);
  return state;
}
function testBackdashInvulnerability() {
  const lamuh = backdashProbe(4401, 'lamuh_legacy_v2');
  assert.strictEqual(lamuh.fighters.p1.health, 1000, 'the invulnerable window ignores the strike');

  const proto = backdashProbe(4402, 'lamuh_proto');
  assert.ok(proto.fighters.p1.health < 1000, 'a fighter without the authored window is still struck out of a backdash');

  // Started before the grab so the throw attempt meets an already invulnerable backdash.
  const throwProbe = match(4403, -20, 20);
  run(throwProbe, 4, (index) => ({ p1: index === 0 || index === 2 ? { left: true } : {}, p2: index === 3 ? { throw: true } : {} }));
  run(throwProbe, 6);
  assert.strictEqual(throwProbe.throwInteraction.result, 'whiff', 'full invulnerability also refuses throw capture');
  assert.strictEqual(throwProbe.fighters.p1.phase, 'backdash');
  assert.strictEqual(throwProbe.fighters.p1.health, 1000);

  const committed = match(4404, -20, 20);
  run(committed, 3, (index) => ({ p1: index === 0 || index === 2 ? { left: true } : {} }));
  tick(committed, { p1: { light: true } });
  assert.strictEqual(committed.fighters.p1.phase, 'backdash', 'backdash stays fully committed: it cannot be cancelled');
  run(committed, 8);
  assert.strictEqual(committed.fighters.p1.backdashInvuln, undefined, 'the window expires well before the retreat does');
  assert.strictEqual(committed.fighters.p1.phase, 'backdash', 'the remaining recovery is the price of the invulnerable escape');
}

// 8. Untouched fixtures keep their exact deterministic projection ---------------------------
function testAbsentModernizationStateKeepsOldChecksums() {
  const fixture = createMatch(901);
  run(fixture, 20);
  assert.strictEqual(fixture.checksums.at(-1), '366de6d2', 'absent optional state must not join the checksum projection');
}

const tests = [
  testGatlingLadderIsCompleteAndStrictlyIncreasing,
  testApprovedFamiliesAndOtherFightersAreUnchanged,
  testLiveNormalIntoSpecialRoute,
  testSuperCancelRequiresAnAuthoredRoute,
  testCounterHitScalesDamageStunAndFreeze,
  testCounterHitIsScopedToLamuhLegacyAndSpareTheUltimate,
  testDashCancelWindow,
  testBackdashInvulnerability,
  testAbsentModernizationStateKeepsOldChecksums
];
for (const test of tests) { test(); console.log(`PASS ${test.name}`); }
