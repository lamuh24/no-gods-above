const assert = require('assert');
const { createMatch, tick, tickWithFighterOrder, saveSnapshot, restoreSnapshot, projectileWorldRect } = require('../dist/core/engine');
const { checksumState } = require('../dist/core/checksum');
const { recordReplay, executeReplay } = require('../dist/core/replay');
const { fighterDefinitions } = require('../dist/data/fighters');

const family = [
  { button: 'light', timing: [9, 2, 17], damage: 34, speed: 8, range: 300, life: 48, recoil: 1.8 },
  { button: 'medium', timing: [14, 3, 23], damage: 48, speed: 10, range: 420, life: 54, recoil: 3.6 },
  { button: 'heavy', timing: [21, 4, 31], damage: 68, speed: 12, range: 540, life: 60, recoil: 7.2 }
].map((example) => ({ ...example, id: `legacy_celestial_palm_${example.button}` }));
const opposite = (id) => id === 'p1' ? 'p2' : 'p1';
const command = (example) => ({ special: true, [example.button]: true });
function match(actorId = 'p1', gap = 280, kind = 'lamuh_legacy_v2') {
  return createMatch(90601, {
    matchId: `palm-${actorId}-${gap}-${kind}`, p1X: -gap / 2, p2X: gap / 2,
    p1Kind: actorId === 'p1' ? 'lamuh_legacy_v2' : kind,
    p2Kind: actorId === 'p2' ? 'lamuh_legacy_v2' : kind
  });
}
function until(state, predicate, limit = 160, inputAt = () => ({})) {
  for (let index = 0; index < limit; index++) {
    if (predicate(state)) return;
    tick(state, inputAt(index));
  }
  assert.fail('Expected projectile condition was not reached');
}
function advance(state, ticks, inputAt = () => ({})) {
  for (let index = 0; index < ticks; index++) tick(state, inputAt(index));
}
function release(example, actorId = 'p1', gap = 280) {
  const state = match(actorId, gap);
  tick(state, { [actorId]: command(example) });
  until(state, (s) => s.projectileSpawnLedger?.length === 1);
  return state;
}

function testAuthoredFamilyAndNeutralRouting() {
  for (const example of family) {
    const attack = fighterDefinitions.lamuh_legacy_v2.attacks[example.id];
    assert.deepStrictEqual([attack.startup, attack.active, attack.recovery], example.timing);
    assert.deepStrictEqual(attack.hitboxes, [], 'The body must not impersonate a ranged projectile');
    assert.strictEqual(attack.groundOnly, true);
    assert.strictEqual(attack.projectile.releaseTick, attack.startup);
    assert.strictEqual(attack.projectile.hitbox.damage, example.damage);
    assert.strictEqual(attack.projectile.hitbox.maxHits, 1);
    assert.strictEqual(attack.projectile.speed, example.speed);
    assert.strictEqual(attack.projectile.gravity, 0.18);
    assert.strictEqual(attack.projectile.maxTravel, example.range);
    assert.strictEqual(attack.projectile.lifeTicks, example.life);
    assert.strictEqual(attack.projectile.hitbox.level, 'mid');
    assert.ok(!attack.projectile.hitbox.launches && !attack.projectile.hitbox.knockdown);
    assert.strictEqual(attack.cancel, undefined);
    for (const actorId of ['p1', 'p2']) {
      const state = match(actorId);
      tick(state, { [actorId]: command(example) });
      assert.strictEqual(state.fighters[actorId].currentAttack, example.id);
      assert.strictEqual(state.fighters[actorId].phaseTick, 1);
      assert.strictEqual(state.projectiles, undefined);
      const modifierFirst = match(actorId);
      tick(modifierFirst, { [actorId]: { special: true } });
      tick(modifierFirst, { [actorId]: command(example) });
      assert.strictEqual(modifierFirst.fighters[actorId].currentAttack, example.id);

      const forward = actorId === 'p1' ? 'right' : 'left';
      const ascendId = example.button === 'medium' ? 'legacy_ascend_step' : `legacy_ascend_step_${example.button}`;
      const directed = match(actorId);
      tick(directed, { [actorId]: { ...command(example), [forward]: true } });
      assert.strictEqual(directed.fighters[actorId].currentAttack, ascendId, 'Forward family routing is preserved');
      const upFamily = match(actorId);
      tick(upFamily, { [actorId]: { ...command(example), up: true } });
      assert.strictEqual(upFamily.fighters[actorId].currentAttack, `legacy_heaven_splitter_${example.button}`, 'Up+Special uses its authored family, never neutral Palm');
      for (const direction of ['down', actorId === 'p1' ? 'left' : 'right']) {
        const nonNeutral = match(actorId);
        tick(nonNeutral, { [actorId]: { ...command(example), [direction]: true } });
        assert.strictEqual(nonNeutral.fighters[actorId].currentAttack, direction === 'down' ? `legacy_aura_sweep_${example.button}` : `legacy_divine_vanish_${example.button}`, 'Down selects aura sweep; Back selects retreat, never Palm or copied specials');
      }
      const aerial = match(actorId);
      Object.assign(aerial.fighters[actorId], { grounded: false, phase: 'jump', y: -110, vy: 0, airActionsRemaining: 5 });
      tick(aerial, { [actorId]: command(example) });
      assert.notStrictEqual(aerial.fighters[actorId].currentAttack, example.id, 'Palm cannot start airborne');
      assert.strictEqual(aerial.projectiles, undefined);
    }
  }
}

function testReleaseOnceFullStartupRecoilAndOneContact() {
  for (const example of family) for (const actorId of ['p1', 'p2']) {
    const state = match(actorId), actor = state.fighters[actorId], target = state.fighters[opposite(actorId)];
    const initialX = actor.x;
    for (let elapsed = 1; elapsed <= example.timing[0]; elapsed++) {
      tick(state, { [actorId]: command(example) });
      assert.strictEqual(actor.phaseTick, elapsed);
      if (elapsed < example.timing[0]) assert.strictEqual(state.projectiles, undefined, 'No spawn during anticipation');
    }
    const projectile = state.projectiles[0];
    assert.strictEqual(projectile.ageTicks, 0);
    assert.strictEqual(projectile.moveInstanceId, actor.currentMoveInstance);
    assert.strictEqual(projectile.facing, actor.attackFacing);
    assert.strictEqual(projectile.x, actor.x + actor.attackFacing * fighterDefinitions.lamuh_legacy_v2.attacks[example.id].projectile.spawnOffset.x);
    until(state, (s) => s.lastProjectileEvent?.type === 'hit', 100, () => ({ [actorId]: command(example) }));
    assert.strictEqual(target.hitCountTaken, 1);
    assert.strictEqual(target.health, 1000 - example.damage);
    assert.strictEqual(state.projectiles.length, 0, 'Contact removes the real projectile');
    assert.strictEqual(state.lastCombatEvent.attackId, example.id);
    assert.strictEqual(target.hitstop, projectile.hitbox.hitstop);
    assert.strictEqual(actor.hitstop, 0, 'Detached projectile contact does not freeze the owner');
    until(state, () => actor.currentAttack === null, 100, () => ({ [actorId]: command(example) }));
    assert.strictEqual(state.tick, example.timing.reduce((sum, value) => sum + value, 0), 'Body duration is authored and independent of detached impact hitstop');
    assert.ok(Math.abs(Math.abs(actor.x - initialX) - example.recoil) < 0.00001, 'Each weight retains its authored recoil');
    advance(state, 80, () => ({ [actorId]: command(example) }));
    assert.strictEqual(state.projectileSpawnLedger.length, 1, 'Held buttons cannot repeatedly release');
    assert.strictEqual(target.hitCountTaken, 1);
    assert.strictEqual(state.projectileEventLedger.length, 2, 'Exactly one spawn and one terminal event');
    assert.deepStrictEqual(state.debugWarnings, []);
  }
}

function testPointBlankShoulderToMuzzleSweep() {
  for (const example of family) for (const actorId of ['p1', 'p2']) {
    const state = release(example, actorId, 68), actor = state.fighters[actorId];
    assert.strictEqual(state.fighters[opposite(actorId)].health, 1000 - example.damage);
    assert.strictEqual(state.lastProjectileEvent.type, 'hit', 'Target behind the palm must be caught by honest release sweep');
    assert.strictEqual(state.lastProjectileEvent.x, actor.x + actor.attackFacing * fighterDefinitions.lamuh_legacy_v2.attacks[example.id].projectile.spawnOffset.x,
      'The visible muzzle is not moved backward to fake close-range contact');
    assert.strictEqual(state.projectileSpawnLedger.length, 1);
  }
}

function testStandingBlockAndJumpCounterplay() {
  for (const example of family) for (const actorId of ['p1', 'p2']) {
    const state = match(actorId), target = state.fighters[opposite(actorId)];
    target.dummyMode = 'stand_block';
    tick(state, { [actorId]: command(example) });
    until(state, (s) => s.lastProjectileEvent?.type === 'block');
    assert.strictEqual(target.health, 1000);
    assert.strictEqual(target.hitCountTaken, 0);
    assert.strictEqual(target.blockstun, fighterDefinitions.lamuh_legacy_v2.attacks[example.id].projectile.hitbox.blockstun);
    assert.strictEqual(state.projectiles.length, 0);
    assert.strictEqual(state.projectileEventLedger.length, 2);

    const jumping = match(actorId, 300), targetId = opposite(actorId);
    tick(jumping, { [actorId]: command(example) });
    // At genuine midrange, a real jump clears the gently descending orb (the high muzzle is duckable instead).
    for (let elapsed = 1; elapsed < 120; elapsed++) {
      tick(jumping, elapsed === 14 ? { [targetId]: { up: true } } : {});
    }
    assert.strictEqual(jumping.fighters[targetId].health, 1000, `${example.id}: timed jump must avoid the projectile`);
    assert.strictEqual(jumping.projectileSpawnLedger.length, 1);
    assert.strictEqual(jumping.lastProjectileEvent.type, 'expired');
  }
}

function testFiniteRangeStageBoundsAndLifetime() {
  for (const example of family) for (const actorId of ['p1', 'p2']) {
    const state = release(example, actorId, 820);
    const rangeLimited = restoreSnapshot(saveSnapshot(state));
    rangeLimited.projectiles[0].gravity = 0; // Isolate the independent horizontal range safety cap.
    until(rangeLimited, (s) => s.projectiles.length === 0);
    assert.strictEqual(rangeLimited.lastProjectileEvent.reason, 'range');
    until(state, (s) => s.projectiles.length === 0);
    assert.strictEqual(state.lastProjectileEvent.type, 'expired');
    assert.strictEqual(state.lastProjectileEvent.reason, 'ground');
    assert.strictEqual(state.fighters[opposite(actorId)].health, 1000);

    const wall = release(example, actorId, 280), shot = wall.projectiles[0];
    wall.fighters[opposite(actorId)].phase = 'crouch';
    wall.fighters[opposite(actorId)].dummyMode = 'crouch_block';
    shot.x = shot.facing > 0 ? wall.stage.right - shot.hitbox.rect.w / 2 - 1 : wall.stage.left + shot.hitbox.rect.w / 2 + 1;
    tick(wall);
    assert.strictEqual(wall.projectiles.length, 0);
    assert.strictEqual(wall.lastProjectileEvent.reason, 'stage_boundary');
    assert.ok(wall.lastProjectileEvent.x >= wall.stage.left && wall.lastProjectileEvent.x <= wall.stage.right);

    const lifetime = release(example, actorId, 820);
    lifetime.projectiles[0].velocityX = 0;
    lifetime.projectiles[0].gravity = 0; // Isolate lifetime from the earlier range/ground limits.
    until(lifetime, (s) => s.projectiles.length === 0);
    assert.strictEqual(lifetime.lastProjectileEvent.reason, 'lifetime', 'Zero-speed or future slower variants remain finite');
  }
}

function testNewProjectileDefenseIsScopedAndCrouchIsCounterplay() {
  const definition = fighterDefinitions.lamuh_legacy_v2;
  assert.strictEqual(definition.standingHurtboxes[0].y, -98, 'Old normal hurtboxes must not change');
  assert.strictEqual(definition.crouchingHurtboxes[0].y, -68);
  assert.strictEqual(definition.projectileHurtboxes.standing[0].y, -172);
  assert.strictEqual(definition.projectileHurtboxes.crouching[0].y, -112);
  assert.strictEqual(fighterDefinitions.lamuh_proto.projectileHurtboxes, undefined);
  assert.strictEqual(fighterDefinitions.training_dummy.projectileHurtboxes, undefined);
  for (const example of family) for (const actorId of ['p1', 'p2']) {
    const crouching = match(actorId), defenderId = opposite(actorId);
    // Point-blank release-height coverage: L/M pass over a crouch, while H reaches it.
    crouching.fighters[defenderId].dummyMode = 'crouch_block';
    crouching.fighters[defenderId].x = crouching.fighters[actorId].x + crouching.fighters[actorId].facing * 68;
    tick(crouching, { [actorId]: command(example) });
    until(crouching, (s) => s.projectileSpawnLedger?.length === 1);
    assert.strictEqual(crouching.lastProjectileEvent.type, example.button === 'heavy' ? 'block' : 'spawn');
    assert.strictEqual(crouching.fighters[defenderId].health, 1000);

    const dummy = match(actorId, 68, 'training_dummy');
    tick(dummy, { [actorId]: command(example) });
    until(dummy, (s) => s.projectileSpawnLedger?.length === 1);
    assert.strictEqual(dummy.fighters[defenderId].health, 1000, 'Short dummy has no silently enlarged defense profile');
    assert.strictEqual(dummy.lastProjectileEvent.type, 'spawn', 'High muzzle legitimately passes over unchanged short dummy');
  }
}

function testIndependentFlightAfterRecoveryInterruptionAndFacingChange() {
  const example = family[0];
  for (const actorId of ['p1', 'p2']) {
    const state = release(example, actorId, 390), actor = state.fighters[actorId];
    const shot = state.projectiles[0], originalFacing = shot.facing;
    until(state, () => actor.currentAttack === null);
    assert.strictEqual(state.projectiles.length, 1, 'The light orb outlives body recovery');
    tick(state, { [actorId]: { heavy: true } });
    assert.strictEqual(actor.currentAttack, 'standing_heavy');
    actor.attackFacing = -originalFacing;
    until(state, (s) => s.lastProjectileEvent?.type === 'hit');
    assert.strictEqual(state.fighters[opposite(actorId)].health, 966);
    assert.strictEqual(Math.sign(state.fighters[opposite(actorId)].vx), originalFacing);
    assert.strictEqual(actor.attackConnected, false, 'Old orb cannot grant a new move a hit confirm or RC permission');
    assert.strictEqual(actor.attackBlocked, false);
    assert.deepStrictEqual(actor.cancelOptions, []);

    const interrupted = release(example, actorId, 330), owner = interrupted.fighters[actorId];
    Object.assign(owner, { currentAttack: null, phase: 'hit_reaction', phaseTick: 0, hitstun: 60, hitstop: 6 });
    const xBefore = interrupted.projectiles[0].x;
    tick(interrupted);
    assert.strictEqual(interrupted.projectiles[0].x, xBefore + originalFacing * example.speed, 'Owner hitstop cannot stall independent flight');
    until(interrupted, (s) => s.lastProjectileEvent?.type === 'hit');
    assert.strictEqual(interrupted.fighters[opposite(actorId)].health, 966);
    assert.strictEqual(owner.phase, 'hit_reaction');
  }
}

function testStartupCanBeInterruptedAndNoReleaseDuplicationDuringHitstop() {
  const example = family[2];
  const interrupted = match('p1', 68);
  tick(interrupted, { p1: command(example), p2: { light: true } });
  advance(interrupted, 85);
  assert.ok(interrupted.fighters.p1.health < 1000, 'Palm provides no strike invulnerability');
  assert.strictEqual(interrupted.projectileSpawnLedger, undefined, 'Interrupted startup must not release later');

  const frozen = release(family[0], 'p1', 390);
  frozen.fighters.p1.hitstop = 8;
  advance(frozen, 8);
  assert.strictEqual(frozen.projectileSpawnLedger.length, 1);
  assert.strictEqual(frozen.projectiles[0].ageTicks, 8, 'Flight age advances while owner release pose freezes');
}

function testSnapshotsReplayChecksumsAndIterationOrder() {
  for (const example of family) {
    const state = match('p1', 300, 'lamuh_legacy_v2');
    const reversed = restoreSnapshot(saveSnapshot(state));
    let checkpoint;
    for (let frame = 0; frame < 140; frame++) {
      const input = frame === 0 ? { p1: command(example), p2: command(example) } : {};
      tick(state, input);
      tickWithFighterOrder(reversed, input, ['p2', 'p1']);
      assert.deepStrictEqual(reversed, state, 'Simultaneous shots must not depend on fighter iteration');
      if (state.projectiles?.length && !checkpoint) checkpoint = restoreSnapshot(saveSnapshot(state));
    }
    assert.ok(checkpoint);
    assert.strictEqual(state.projectileSpawnLedger.length, 2);
    assert.strictEqual(new Set(state.projectileEventLedger).size, state.projectileEventLedger.length);
    assert.strictEqual(state.projectileEventLedger.length, 4);
    assert.strictEqual(state.fighters.p1.hitCountTaken, 1);
    assert.strictEqual(state.fighters.p2.hitCountTaken, 1);
    const altered = restoreSnapshot(saveSnapshot(checkpoint));
    altered.projectiles[0].x += 0.5;
    assert.notStrictEqual(checksumState(altered), checksumState(checkpoint), 'Live projectile trajectory must join the checksum');
    altered.projectiles[0].x -= 0.5;
    altered.projectiles[0].hitLedger.push('p2');
    assert.notStrictEqual(checksumState(altered), checksumState(checkpoint), 'The projectile hit ledger must join the checksum');
    const alteredSource = restoreSnapshot(saveSnapshot(checkpoint));
    alteredSource.fighters.p1.currentMoveInstance++;
    assert.notStrictEqual(checksumState(alteredSource), checksumState(checkpoint), 'Source-instance ownership must join the checksum');
    const alteredGravity = restoreSnapshot(saveSnapshot(checkpoint));
    alteredGravity.projectiles[0].gravity = 0;
    assert.notStrictEqual(checksumState(alteredGravity), checksumState(checkpoint), 'Authored gravity must join the checksum');
    while (checkpoint.tick < state.tick) tick(checkpoint);
    assert.deepStrictEqual(checkpoint, state, 'In-flight save/restore must preserve every event and result');
    assert.deepStrictEqual(executeReplay(recordReplay(state)), state, 'Input replay must reproduce real projectile state and events');
    assert.deepStrictEqual(state.debugWarnings, []);
  }
}

function testConnectedThrowLockAndPendingThrowInterruption() {
  const example = family[0];
  function readyThrow() {
    const state = release(example, 'p1', 390);
    Object.assign(state.fighters.p1, { x: 0, vx: 0, phase: 'idle', currentAttack: null });
    Object.assign(state.fighters.p2, { x: 68, vx: 0, phase: 'idle' });
    return state;
  }
  const connected = readyThrow();
  tick(connected, { p1: { throw: true } });
  until(connected, (s) => s.throwInteraction?.result === 'connected');
  const lockedShot = connected.projectiles[0], ageBefore = lockedShot.ageTicks;
  Object.assign(lockedShot, { x: connected.fighters.p2.x - 4, previousX: connected.fighters.p2.x - 4, y: -80, previousY: -80 });
  tick(connected);
  assert.strictEqual(connected.throwInteraction.result, 'connected');
  assert.strictEqual(connected.fighters.p2.health, 1000, 'Connected authored victim track remains authoritative');
  assert.strictEqual(lockedShot.ageTicks, ageBefore + 1, 'Throw lock does not freeze projectile flight');
  assert.strictEqual(connected.projectiles.length, 1);

  const pending = readyThrow(), shot = pending.projectiles[0];
  Object.assign(shot, { x: pending.fighters.p2.x - 4, previousX: pending.fighters.p2.x - 4, y: -80, previousY: -80 });
  tick(pending, { p1: { throw: true } });
  assert.strictEqual(pending.throwInteraction, null, 'Projectile can interrupt a pending, not-yet-connected throw');
  assert.strictEqual(pending.lastProjectileEvent.type, 'hit');
  assert.strictEqual(pending.fighters.p2.health, 966);
  assert.strictEqual(pending.fighters.p2.phase, 'hit_reaction');
  assert.deepStrictEqual(pending.debugWarnings, []);
}

function testFreshInstancesMayCoexistWithoutDuplicateContacts() {
  const state = match('p1', 390), example = family[0];
  let sawTwoLive = false;
  const contactIds = [];
  const terminalIds = [];
  for (let frame = 0; frame < 120; frame++) {
    tick(state, { p1: frame === 0 || frame === 28 ? command(example) : {} });
    sawTwoLive ||= state.projectiles?.length === 2;
    if (state.lastProjectileEvent?.type === 'hit' && state.lastProjectileEvent.tick === frame) contactIds.push(state.lastProjectileEvent.projectileId);
    if (state.lastProjectileEvent?.type !== 'spawn' && state.lastProjectileEvent?.tick === frame) terminalIds.push(state.lastProjectileEvent.projectileId);
  }
  assert.strictEqual(sawTwoLive, true, 'A recovered owner can release a fresh independent instance while the older orb is still live');
  assert.strictEqual(state.projectileSpawnLedger.length, 2);
  assert.strictEqual(new Set(state.projectileSpawnLedger).size, 2);
  assert.strictEqual(state.fighters.p2.hitCountTaken, contactIds.length);
  assert.strictEqual(new Set(contactIds).size, contactIds.length, 'No instance can contact repeatedly');
  assert.deepStrictEqual(terminalIds, state.projectileSpawnLedger, 'Each release terminates once, even if prior knockback makes the later shot whiff');
  assert.deepStrictEqual(executeReplay(recordReplay(state)), state);
}

function testPrototypeAndDummyDoNotAcquirePalmRoutes() {
  for (const kind of ['lamuh_proto', 'training_dummy']) for (const example of family) {
    const state = createMatch(90602, { p1Kind: kind });
    tick(state, { p1: command(example) });
    assert.ok(!state.fighters.p1.currentAttack?.startsWith('legacy_celestial_palm'));
    advance(state, 120);
    assert.strictEqual(state.projectiles, undefined);
    assert.strictEqual(state.projectileSpawnLedger, undefined);
    assert.strictEqual(fighterDefinitions[kind].attacks[example.id], undefined);
  }
}

for (const test of [testAuthoredFamilyAndNeutralRouting, testReleaseOnceFullStartupRecoilAndOneContact,
  testPointBlankShoulderToMuzzleSweep, testStandingBlockAndJumpCounterplay, testFiniteRangeStageBoundsAndLifetime,
  testNewProjectileDefenseIsScopedAndCrouchIsCounterplay,
  testIndependentFlightAfterRecoveryInterruptionAndFacingChange, testStartupCanBeInterruptedAndNoReleaseDuplicationDuringHitstop,
  testSnapshotsReplayChecksumsAndIterationOrder, testConnectedThrowLockAndPendingThrowInterruption,
  testFreshInstancesMayCoexistWithoutDuplicateContacts, testPrototypeAndDummyDoNotAcquirePalmRoutes]) {
  test();
  console.log(`PASS ${test.name}`);
}
