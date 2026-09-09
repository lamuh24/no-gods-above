const assert = require('assert');
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const { createMatch, tick, tickWithFighterOrder, saveSnapshot, restoreSnapshot } = require('../dist/core/engine');
const { recordReplay, executeReplay } = require('../dist/core/replay');
const { fighterDefinitions } = require('../dist/data/fighters');
const family = [
  { button: 'light', startup: 3, total: 20, distance: 60, end: 8 },
  { button: 'medium', startup: 5, total: 32, distance: 180, end: 19 }
].map(e => ({ ...e, id: `legacy_divine_vanish_${e.button}` }));
const attack = e => fighterDefinitions.lamuh_legacy_v2.attacks[e.id];
const other = id => id === 'p1' ? 'p2' : 'p1';
const back = id => id === 'p1' ? 'left' : 'right';
const forward = id => id === 'p1' ? 'right' : 'left';
const command = (e, id = 'p1') => ({ [back(id)]: true, special: true, [e.button]: true });
function match(gap = 150) { return createMatch(90607, { matchId: 'vanish', p1Kind: 'lamuh_legacy_v2', p2Kind: 'lamuh_legacy_v2', p1X: -gap / 2, p2X: gap / 2 }); }
function advance(s, n, input = {}) { for (let i = 0; i < n; i++) tick(s, input); }
function testDefinitionsAndPreservation() {
  for (const e of family) {
    const a = attack(e);
    assert.deepStrictEqual([a.startup, a.active, a.recovery], [e.startup, 0, e.total - e.startup]);
    assert.deepStrictEqual(a.hitboxes, []);
    assert.ok(a.groundOnly && !a.cancel && !a.projectile && !a.authoredHop && !a.authoredDive && !a.targetSideSwitch);
  }
  const oldHashes = { lamuh_proto: '86b0db13e7875d336fb54c22bf561533b925a1b0ee4865e222702d2bc2639cf8', lamuh_legacy_v2: 'b83c386ba8ec4d2b969fddd9099186be0dd1a66e46aee158b63fd986dcc3b405', training_dummy: '313311553cff4a64794b1d90f6e10a6e553f7abf58bb5d255fabfa0c788d4a7a' };
  for (const [kind, definition] of Object.entries(fighterDefinitions)) {
    const original = JSON.parse(JSON.stringify(definition));
    for (const id of ['legacy_divine_vanish_light', 'legacy_divine_vanish_medium', 'legacy_divine_vanish_heavy']) delete original.attacks[id];
    if (kind === 'lamuh_legacy_v2') original.attacks.legacy_ascend_step_heavy = require('../dist/data/fighters').LAMUH_ASCEND_HEAVY_V1_HISTORICAL;
    assert.strictEqual(crypto.createHash('sha256').update(JSON.stringify(original)).digest('hex'), oldHashes[kind], `${kind}: every old definition remains exact`);
  }
  assert.strictEqual(crypto.createHash('sha256').update(fs.readFileSync(path.resolve(__dirname, '../../game.js'))).digest('hex').toUpperCase(), 'D081DA2D907CF6ABD978301C1637008B26CCB30B47E2CCAFCA3FEA3331910C6B');
}
function testInputsAndExistingPriority() {
  for (const e of family) for (const actor of ['p1', 'p2']) {
    for (const modifierFirst of [false, true]) {
      const s = match();
      if (modifierFirst) tick(s, { [actor]: { special: true } });
      tick(s, { [actor]: command(e, actor) });
      assert.strictEqual(s.fighters[actor].currentAttack, e.id);
    }
    for (const [direction, expected] of [
      [{ up: true, [back(actor)]: true }, `legacy_heaven_splitter_${e.button}`],
      [{ [forward(actor)]: true }, e.button === 'medium' ? 'legacy_ascend_step' : `legacy_ascend_step_${e.button}`],
      [{}, `legacy_celestial_palm_${e.button}`]
    ]) {
      const s = match(); tick(s, { [actor]: { ...direction, special: true, [e.button]: true } });
      assert.strictEqual(s.fighters[actor].currentAttack, expected);
    }
    const air = match(), af = air.fighters[actor];
    af.grounded = false; af.phase = 'jump'; af.y = -120; af.airActionsRemaining = 5;
    tick(air, { [actor]: command(e, actor) });
    assert.strictEqual(af.currentAttack, `legacy_radiant_dive_${e.button}`);
    const normal = match(); tick(normal, { [actor]: { [back(actor)]: true, [e.button]: true } });
    assert.notStrictEqual(normal.fighters[actor].currentAttack, e.id);
    const strengthFirst = match(); tick(strengthFirst, { [actor]: { [e.button]: true } });
    tick(strengthFirst, { [actor]: command(e, actor) });
    assert.notStrictEqual(strengthFirst.fighters[actor].currentAttack, e.id, 'No retroactive replacement of an already started normal');
  }
}
function testExactMirroredRetreatAndNoContacts() {
  for (const e of family) for (const actor of ['p1', 'p2']) {
    const s = match(), f = s.fighters[actor], target = s.fighters[other(actor)], start = f.x, targetX = target.x, hp = target.health;
    const meter = [f.tension, f.tensionEarned, f.tensionSpent];
    for (let t = 1; t <= e.total; t++) {
      tick(s, { [actor]: command(e, actor) });
      const traveled = attack(e).rootMotionSegments.reduce((sum, r) => sum + Math.max(0, Math.min(t, r.end) - r.start + 1) * -r.velocity, 0);
      assert.strictEqual(f.x, start - f.attackFacing * traveled);
      assert.strictEqual(f.y, s.stage.groundY); assert.strictEqual(f.grounded, true);
      assert.strictEqual(target.x, targetX); assert.strictEqual(target.health, hp);
      assert.strictEqual(f.wakeupInvuln, 0); assert.strictEqual(f.airTechInvuln, 0);
      assert.deepStrictEqual([f.tension, f.tensionEarned, f.tensionSpent], meter);
      assert.strictEqual(s.presentationEventLedger.length, 0, 'No phantom contact presentation');
      assert.ok(!f.attackConnected && !f.attackBlocked);
      if (t < e.total) assert.strictEqual(f.currentAttack, e.id);
    }
    assert.strictEqual(Math.abs(f.x - start), e.distance);
    assert.strictEqual(f.phase, 'idle'); assert.strictEqual(f.currentAttack, null);
    advance(s, 45, { [actor]: command(e, actor) });
    assert.strictEqual(f.moveInstanceCounter, 1, 'Held chord cannot repeat');
  }
}
function stageEnemyContact(s, actor) {
  const enemy = s.fighters[other(actor)];
  tick(s, { [other(actor)]: { light: true } });
  const first = fighterDefinitions.lamuh_legacy_v2.attacks.standing_light.hitboxes[0].start;
  while (enemy.phaseTick < first - 1) tick(s, {});
}
function testEntryIsPunishableWithoutStaleBackGuard() {
  for (const e of family) for (const actor of ['p1', 'p2']) {
    const s = match(74), f = s.fighters[actor];
    stageEnemyContact(s, actor); const hp = f.health;
    tick(s, { [actor]: { ...command(e, actor), block: true } });
    assert.ok(f.health < hp, `${e.id} ${actor}: initial back chord must not auto-block enemy contact`);
    assert.strictEqual(f.currentAttack, null); assert.strictEqual(f.phase, 'hit_reaction');
  }
}
function testRecoveryAndInterruption() {
  for (const e of family) for (const actor of ['p1', 'p2']) {
    const s = match(), f = s.fighters[actor];
    tick(s, { [actor]: command(e, actor) }); advance(s, e.end);
    const enemy = s.fighters[other(actor)]; enemy.x = f.x + f.facing * 74;
    stageEnemyContact(s, actor); const hp = f.health;
    tick(s, { [actor]: { ...command(e, actor), up: true, block: true, throw: true, romanCancel: true } });
    assert.ok(f.health < hp, 'Stationary recovery remains punishable despite action/guard inputs');
    assert.strictEqual(f.currentAttack, null);
    const interruptedX = f.x; advance(s, 3);
    assert.ok(Math.abs(f.x - interruptedX) < e.distance, 'Authored retreat does not continue after interruption');
  }
}
function testBoundsHitstopAndSnapshot() {
  for (const e of family) for (const actor of ['p1', 'p2']) {
    const s = match(), f = s.fighters[actor];
    tick(s, { [actor]: command(e, actor) }); advance(s, e.startup);
    const frozen = [f.x, f.phaseTick]; f.hitstop = 3;
    advance(s, 3); assert.deepStrictEqual([f.x, f.phaseTick], frozen);
    const resumed = restoreSnapshot(saveSnapshot(s)); advance(s, 60); advance(resumed, 60);
    assert.deepStrictEqual(s.checksums, resumed.checksums);
    const wall = match(), wf = wall.fighters[actor]; wf.x = actor === 'p1' ? wall.stage.left + 5 : wall.stage.right - 5;
    tick(wall, { [actor]: command(e, actor) }); advance(wall, e.total);
    assert.strictEqual(wf.x, actor === 'p1' ? wall.stage.left : wall.stage.right);
    assert.strictEqual(wf.currentAttack, null); assert.strictEqual(wf.phase, 'idle');
  }
}
function testReplayAndFighterOrder() {
  const a = match(), b = saveSnapshot(a);
  for (let t = 0; t < 180; t++) {
    const e = family[Math.floor(t / 60) % family.length], input = t % 60 === 0 ? { p1: command(e), p2: command(e, 'p2') } : {};
    tickWithFighterOrder(a, input, ['p1', 'p2']); tickWithFighterOrder(b, input, ['p2', 'p1']);
  }
  assert.deepStrictEqual(a.checksums, b.checksums);
  assert.deepStrictEqual(executeReplay(recordReplay(a)).checksums, a.checksums);
}
function testNoCancelEscapeAndOrdinaryDefenseThrow() {
  for (const e of family) for (const actor of ['p1', 'p2']) {
    const s = match(), f = s.fighters[actor]; f.tension = 100;
    tick(s, { [actor]: command(e, actor) });
    for (let t = 2; t < e.total; t++) {
      tick(s, { [actor]: t % 2 ? {} : { up: true, special: true, heavy: true, romanCancel: true, block: true, throw: true } });
      assert.strictEqual(f.currentAttack, e.id); assert.strictEqual(f.phase, 'attack');
      assert.strictEqual(f.tension, 100); assert.strictEqual(f.romanCancelCount, 0);
    }
    const guard = match(74), gf = guard.fighters[actor];
    stageEnemyContact(guard, actor); const hp = gf.health;
    tick(guard, { [actor]: { [back(actor)]: true } });
    assert.strictEqual(gf.health, hp); assert.ok(gf.blockstun > 0, 'Ordinary back guard preserved');
    const grab = match(74);
    tick(grab, { [actor]: { [back(actor)]: true, throw: true } });
    assert.strictEqual(grab.throwInteraction?.throwId, 'back_throw');
  }
}
const tests = [testDefinitionsAndPreservation, testInputsAndExistingPriority, testExactMirroredRetreatAndNoContacts, testEntryIsPunishableWithoutStaleBackGuard, testRecoveryAndInterruption, testBoundsHitstopAndSnapshot, testReplayAndFighterOrder, testNoCancelEscapeAndOrdinaryDefenseThrow];
for (const test of tests) { test(); console.log(`PASS ${test.name}`); }
console.log(`Divine Vanish ${tests.length} deterministic test groups passed`);
