const assert = require('node:assert/strict');
const { createMatch, tick, tickWithFighterOrder, saveSnapshot, restoreSnapshot } = require('../dist/core/engine');
const { checksumState } = require('../dist/core/checksum');
const { fighterDefinitions } = require('../dist/data/fighters');
const family = [
  { button: 'light', timing: [8, 4, 16], damage: 32 },
  { button: 'medium', timing: [13, 5, 24], damage: 48 },
  { button: 'heavy', timing: [22, 1, 33], damage: 66 },
].map(v => ({ ...v, id: 'legacy_aura_sweep_' + v.button }));
const other = id => id === 'p1' ? 'p2' : 'p1';
const command = e => ({ down: true, special: true, [e.button]: true });
function match(gap = 90) {
  return createMatch(90908, { matchId: 'aura-sweep', p1Kind: 'lamuh_legacy_v2', p2Kind: 'lamuh_legacy_v2', p1X: -gap / 2, p2X: gap / 2 });
}
function advance(s, n, inputs = {}) { for (let i = 0; i < n; i++) tick(s, inputs); }
for (const e of family) {
  const a = fighterDefinitions.lamuh_legacy_v2.attacks[e.id];
  assert.deepEqual([a.startup, a.active, a.recovery], e.timing);
  const contact = a.projectile?.hitbox ?? a.hitboxes[0];
  assert.equal(contact.damage, e.damage);
  assert.equal(contact.level, 'low');
  assert.equal(contact.maxHits, 1);
  assert.equal(a.groundOnly, true);
  assert.equal(a.cancel, undefined);
  assert.equal(a.responseStrikeInvulnThrough, undefined);
  if (e.button === 'heavy') {
    assert.deepEqual(a.hitboxes, []);
    assert.equal(a.projectile.releaseTick, 22);
    assert.equal(a.projectile.maxTravel, 240);
    assert.equal(a.projectile.gravity, 0);
  }
  for (const actor of ['p1', 'p2']) {
    for (const direction of [{}, { left: true }, { right: true }]) {
      const s = match();
      tick(s, { [actor]: { ...command(e), ...direction } });
      assert.equal(s.fighters[actor].currentAttack, e.id, 'Down chord owns both diagonals');
    }
    for (const mode of ['idle', 'crouch_block', 'stand_block']) {
      const s = match(), target = s.fighters[other(actor)];
      target.dummyMode = mode;
      tick(s, { [actor]: command(e) });
      advance(s, 140, { [actor]: command(e) });
      assert.equal(target.health, mode === 'crouch_block' ? 1000 : 1000 - e.damage, e.id + mode);
      assert.equal(target.hitCountTaken, mode === 'crouch_block' ? 0 : 1);
      assert.equal(s.lastCombatEvent.outcome, mode === 'crouch_block' ? 'block' : 'hit');
      assert.equal(s.lastCombatEvent.attackId, e.id);
      assert.equal(s.fighters[actor].currentAttack, null, 'Held chord cannot repeat');
      if (e.button === 'heavy') assert.equal(s.projectileSpawnLedger.length, 1);
      assert.deepEqual(s.debugWarnings, []);
    }
    const whiff = match(820);
    tick(whiff, { [actor]: command(e) });
    advance(whiff, 140);
    assert.equal(whiff.fighters[other(actor)].health, 1000);
    assert.equal(whiff.fighters[actor].currentAttack, null);
    if (e.button === 'heavy') {
      assert.equal(whiff.projectiles.length, 0);
      assert.equal(whiff.lastProjectileEvent.reason, 'range');
    }
    const airborne = match();
    Object.assign(airborne.fighters[actor], { grounded: false, phase: 'jump', y: -120, vy: 0, airActionsRemaining: 5 });
    tick(airborne, { [actor]: command(e) });
    assert.equal(airborne.fighters[actor].currentAttack, 'legacy_radiant_dive_' + e.button);
  }
  // Check replay/snapshot and actor-order independence through startup, contact,
  // detached wave lifetime, hitstop and recovery without touching render state.
  const s = match(180), reversed = restoreSnapshot(saveSnapshot(s)), snapshots = [];
  for (let t = 0; t < 100; t++) {
    const inputs = t === 0 ? { p1: command(e) } : {};
    tick(s, inputs);
    tickWithFighterOrder(reversed, inputs, ['p2', 'p1']);
    assert.equal(checksumState(s), checksumState(reversed));
    for (const restored of snapshots) {
      tick(restored, inputs);
      assert.equal(checksumState(restored), checksumState(s), 'Restored timelines must match uninterrupted simulation');
    }
    if ([5, 14, 23, 30].includes(t)) {
      snapshots.push(restoreSnapshot(saveSnapshot(s)));
    }
  }
}
console.log('PASS Lamuh aura sweep: three authored low profiles, mirrored/diagonal/air routing, hit/block/whiff, single contacts, finite wave, snapshot/order determinism.');
