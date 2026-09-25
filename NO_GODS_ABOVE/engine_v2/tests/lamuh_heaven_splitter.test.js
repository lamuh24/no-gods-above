const assert = require('assert');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { createMatch, tick, tickWithFighterOrder, saveSnapshot, restoreSnapshot, sampleAuthoredHop, fighterExtendedHurtboxes } = require('../dist/core/engine');
const { checksumState } = require('../dist/core/checksum');
const { recordReplay, executeReplay } = require('../dist/core/replay');
const { fighterDefinitions } = require('../dist/data/fighters');

const family = [
  { button: 'light', timing: [7, 4, 25], damage: 44, launch: -7, hitstop: 5, travel: 8, hop: [7, 14, 24, 16] },
  { button: 'medium', timing: [10, 5, 28], damage: 62, launch: -10, hitstop: 7, travel: 14, hop: [10, 20, 33, 40] },
  { button: 'heavy', timing: [14, 6, 33], damage: 80, launch: -12, hitstop: 9, travel: 20, hop: [14, 26, 43, 64] }
].map((e) => ({ ...e, id: `legacy_heaven_splitter_${e.button}`, total: e.timing.reduce((a, b) => a + b, 0) }));
const opposite = (id) => id === 'p1' ? 'p2' : 'p1';
const command = (e) => ({ up: true, special: true, [e.button]: true });
const attack = (e) => fighterDefinitions.lamuh_legacy_v2.attacks[e.id];
function match(actor = 'p1', gap = 74) {
  return createMatch(90605, { matchId: `heaven-${actor}-${gap}`, p1Kind: 'lamuh_legacy_v2', p2Kind: 'lamuh_legacy_v2', p1X: -gap / 2, p2X: gap / 2 });
}
function advance(state, count, input = () => ({})) { for (let i = 0; i < count; i++) tick(state, input(i)); }
function until(state, predicate, limit = 160, input = () => ({})) {
  for (let i = 0; i < limit; i++) { if (predicate(state)) return; tick(state, input(i)); }
  assert.fail('Expected Heaven Splitter condition was not reached');
}

function testIndependentAuthoringAndInputPriority() {
  for (const e of family) {
    const a = attack(e), h = a.hitboxes[0];
    assert.deepStrictEqual([a.startup, a.active, a.recovery], e.timing);
    assert.deepStrictEqual(Object.values(a.authoredHop), e.hop);
    assert.strictEqual(a.groundOnly, true);
    assert.strictEqual(a.hitboxes.length, 1);
    assert.strictEqual(h.maxHits, 1);
    assert.strictEqual(h.damage, e.damage);
    assert.strictEqual(h.knockbackY, e.launch);
    assert.strictEqual(h.hitstop, e.hitstop);
    assert.strictEqual(h.start, a.startup);
    assert.strictEqual(h.end, a.startup + a.active - 1);
    assert.deepStrictEqual(h.rect, { x: 6, y: -236, w: 54, h: 102 }, 'Measured adult near-fist/forearm socket plus authored small ki crescent');
    assert.strictEqual(h.launches, true);
    assert.ok(!a.cancel && !h.jumpCancelOnHit && !h.allowOTG && !a.projectile && !a.targetSideSwitch);
    assert.ok(h.rect.w <= 65 && h.rect.h <= 110, 'A hand/forearm-sized collision is not a screen-wide anti-air');
    for (const actor of ['p1', 'p2']) {
      const forward = actor === 'p1' ? 'right' : 'left';
      for (const direction of [{}, { left: true }, { right: true }]) {
        const state = match(actor, 300);
        tick(state, { [actor]: { ...command(e), ...direction } });
        assert.strictEqual(state.fighters[actor].currentAttack, e.id, 'Up+Special outranks jump and both horizontal diagonals');
        assert.strictEqual(state.fighters[actor].phaseTick, 1);
        assert.strictEqual(state.fighters[actor].phase, 'attack');
      }
      const modifierFirst = match(actor, 300);
      tick(modifierFirst, { [actor]: { special: true } });
      tick(modifierFirst, { [actor]: command(e) });
      assert.strictEqual(modifierFirst.fighters[actor].currentAttack, e.id);
      const forwardOnly = match(actor, 300);
      tick(forwardOnly, { [actor]: { special: true, [e.button]: true, [forward]: true } });
      assert.strictEqual(forwardOnly.fighters[actor].currentAttack, e.button === 'medium' ? 'legacy_ascend_step' : `legacy_ascend_step_${e.button}`);
      const noModifier = match(actor, 300);
      tick(noModifier, { [actor]: { up: true, [e.button]: true } });
      assert.notStrictEqual(noModifier.fighters[actor].currentAttack, e.id);
      const socd = match(actor, 300);
      tick(socd, { [actor]: { ...command(e), down: true } });
      assert.notStrictEqual(socd.fighters[actor].currentAttack, e.id);
    }
  }
}

function testExactRootTrajectoryAndSafeRecovery() {
  for (const e of family) for (const actor of ['p1', 'p2']) {
    const state = match(actor, 500), f = state.fighters[actor], startX = f.x;
    const samples = [];
    for (let t = 1; t <= e.total; t++) {
      tick(state, { [actor]: command(e) });
      const sampled = sampleAuthoredHop(attack(e).authoredHop, t);
      assert.strictEqual(f.y, sampled.y);
      assert.strictEqual(f.grounded, !sampled.airborne);
      assert.ok(f.y >= state.stage.ceilingY && f.y <= state.stage.groundY);
      assert.strictEqual(f.airActionsRemaining, 0);
      assert.strictEqual(f.airDashesRemaining, 0);
      assert.strictEqual(f.wakeupInvuln, 0);
      assert.strictEqual(f.airTechInvuln, 0);
      if (t < e.total) assert.strictEqual(f.currentAttack, e.id, 'Landing cannot erase authored recovery');
      samples.push(f.y);
    }
    assert.strictEqual(Math.min(...samples), -e.hop[3]);
    assert.ok(Math.abs(Math.abs(f.x - startX) - e.travel) < 1e-8);
    assert.strictEqual(f.currentAttack, null);
    assert.strictEqual(f.phase, 'idle');
    assert.strictEqual(f.recoveryEvent.durationTicks, e.total - e.hop[2]);
    advance(state, e.total * 2, () => ({ [actor]: command(e) }));
    assert.strictEqual(f.moveInstanceCounter, 1, 'Held chord cannot repeat the attack');
    assert.strictEqual(f.phase, 'idle', 'Held Up is not a fresh jump after recovery');
    tick(state, {});
    tick(state, { [actor]: command(e) });
    assert.strictEqual(f.moveInstanceCounter, 2, 'A fresh post-recovery chord can start the next move');
  }
}

function testSingleHitBlockAndCrouchCounterplay() {
  for (const e of family) for (const actor of ['p1', 'p2']) {
    for (const mode of ['hit', 'block', 'crouch']) {
      const state = match(actor), f = state.fighters[actor], victim = state.fighters[opposite(actor)];
      let firstContact = null, victimFreeWhileCommitted = false;
      for (let i = 0; i < e.total + e.hitstop + 20; i++) {
        const defense = mode === 'block' ? { block: true } : mode === 'crouch' ? { down: true, block: true } : {};
        tick(state, { [actor]: i === 0 ? command(e) : {}, [opposite(actor)]: defense });
        if (state.lastCombatEvent?.tick === state.tick - 1) {
          assert.strictEqual(firstContact, null, 'One rising arm has exactly one registered hit or block');
          firstContact = { ...state.lastCombatEvent };
          if (mode === 'hit') {
            assert.strictEqual(victim.vy, e.launch);
            assert.strictEqual(victim.grounded, false);
            assert.strictEqual(f.hitstop, e.hitstop);
          }
        }
        if (firstContact && mode === 'block' && victim.blockstun === 0 && f.currentAttack) victimFreeWhileCommitted = true;
      }
      assert.strictEqual(victim.health, mode === 'hit' ? 1000 - e.damage : 1000);
      assert.strictEqual(victim.hitCountTaken, mode === 'hit' ? 1 : 0);
      if (mode === 'crouch') assert.strictEqual(firstContact, null, 'High uppercut is not a low-proof reversal');
      else assert.strictEqual(firstContact.outcome, mode);
      if (mode === 'block') assert.ok(victimFreeWhileCommitted, 'Opponent leaves blockstun while the hop/recovery remains committed');
      assert.strictEqual(f.currentAttack, null);
    }
  }
}

function testAntiAirAndNoBehindOrFarSuction() {
  for (const e of family) for (const actor of ['p1', 'p2']) {
    const state = match(actor), f = state.fighters[actor], victim = state.fighters[opposite(actor)];
    tick(state, { [actor]: command(e) });
    until(state, () => f.phaseTick === e.timing[0] - 1);
    Object.assign(victim, { grounded: false, phase: 'jump', y: -100, vy: -0.5, airActionsRemaining: 0 });
    tick(state);
    assert.strictEqual(victim.hitCountTaken, 1, 'Upper forearm catches a real airborne hurtbox');
    assert.strictEqual(victim.vy, e.launch);
    const far = match(actor, 300), farVictim = far.fighters[opposite(actor)], farX = farVictim.x;
    advance(far, e.total + 5, (i) => ({ [actor]: i === 0 ? command(e) : {} }));
    assert.strictEqual(farVictim.hitCountTaken, 0);
    assert.strictEqual(farVictim.x, farX, 'Whiff never attracts or teleports the victim');
    const shortRange = match(actor, 100);
    advance(shortRange, e.total + 5, (i) => ({ [actor]: i === 0 ? command(e) : {} }));
    assert.strictEqual(shortRange.fighters[opposite(actor)].hitCountTaken, 0, 'Vertical body move is not a ranged rush: gap 100 must whiff');
    const behind = match(actor, 300), own = behind.fighters[actor], other = behind.fighters[opposite(actor)];
    tick(behind, { [actor]: command(e) });
    other.x = own.x - own.attackFacing * 90;
    advance(behind, e.total + 5);
    assert.strictEqual(other.hitCountTaken, 0, 'The uppercut is facing-locked, not omnidirectional');
  }
}

function testHitstopFreezesEveryTrajectorySample() {
  for (const e of family) {
    const state = match('p1', 400), f = state.fighters.p1;
    tick(state, { p1: command(e) });
    until(state, () => f.phaseTick === e.hop[1] - 2);
    f.hitstop = 9;
    const before = { x: f.x, y: f.y, vy: f.vy, phaseTick: f.phaseTick, grounded: f.grounded };
    advance(state, 9);
    assert.deepStrictEqual({ x: f.x, y: f.y, vy: f.vy, phaseTick: f.phaseTick, grounded: f.grounded }, before);
    tick(state);
    assert.strictEqual(f.phaseTick, before.phaseTick + 1);
    assert.strictEqual(f.y, sampleAuthoredHop(attack(e).authoredHop, f.phaseTick).y);
  }
}

function testInterruptionsPreserveAirborneStateAndVulnerability() {
  for (const e of family) for (const actor of ['p1', 'p2']) {
    const startup = match(actor, 74), f = startup.fighters[actor], other = opposite(actor);
    tick(startup, { [actor]: command(e), [other]: { light: true } });
    until(startup, () => f.hitCountTaken > 0);
    assert.strictEqual(f.currentAttack, null, 'Startup is vulnerable to an ordinary normal');
    assert.strictEqual(f.grounded, true);

    const state = match(actor, 400), airborne = state.fighters[actor], enemy = state.fighters[other];
    tick(state, { [actor]: command(e) });
    until(state, () => airborne.phaseTick === e.hop[1]);
    assert.ok(fighterExtendedHurtboxes(airborne).some((r) => r.y <= airborne.y - 172), 'Adult head remains hittable');
    enemy.x = airborne.x + airborne.attackFacing * 74;
    Object.assign(enemy, { phase: 'attack', currentAttack: 'standing_heavy', phaseTick: 10, attackFacing: -airborne.attackFacing, facing: -airborne.attackFacing, currentMoveInstance: 1, moveInstanceCounter: 1 });
    tick(state);
    assert.strictEqual(airborne.hitCountTaken, 1, 'Airborne special is not strike invulnerable');
    assert.strictEqual(airborne.currentAttack, null);
    assert.strictEqual(airborne.grounded, false);
    assert.ok(airborne.y < 0, 'Hit interruption never snaps an airborne fighter to ground');
    const interruptedY = airborne.y;
    advance(state, airborne.hitstop);
    assert.strictEqual(airborne.y, interruptedY);
    tick(state);
    assert.notStrictEqual(airborne.y, 0, 'Standard falling physics resumes after the hitstop');
    until(state, () => airborne.grounded, 100);
    assert.strictEqual(airborne.y, state.stage.groundY);
    assert.ok(['knockdown', 'getup', 'idle'].includes(airborne.phase));
  }
}

function testNoAirCancelInvulnerabilityOrJuggleReset() {
  for (const e of family) {
    const state = match('p1', 400), f = state.fighters.p1;
    tick(state, { p1: command(e) });
    until(state, () => !f.grounded);
    for (let i = 0; i < 10; i++) {
      tick(state, { p1: { light: i % 2 === 0, medium: i % 2 === 1, heavy: i % 2 === 0, right: i % 2 === 1 } });
      assert.strictEqual(f.currentAttack, e.id);
      assert.deepStrictEqual(f.cancelOptions, []);
      assert.strictEqual(f.airActionsRemaining, 0);
      assert.strictEqual(f.airDashesRemaining, 0);
      assert.strictEqual(f.wakeupInvuln, 0);
      assert.strictEqual(f.airTechInvuln, 0);
    }
    const juggle = match('p1'), owner = juggle.fighters.p1, target = juggle.fighters.p2;
    tick(juggle, { p1: command(e) });
    until(juggle, () => owner.phaseTick === e.timing[0] - 1);
    Object.assign(owner, { comboCount: 1, comboTarget: 'p2', juggleSpent: 8, peakJuggleSpent: 8 });
    Object.assign(target, { grounded: false, phase: 'hit_reaction', hitstun: 20, y: -100, vy: 0 });
    tick(juggle);
    assert.strictEqual(juggle.lastCombatEvent.outcome, 'juggle_rejected');
    assert.strictEqual(target.hitCountTaken, 0, 'A repeated launcher cannot bypass the existing juggle budget');
  }
}

function testMirrorOrderReplayAndMidHopSnapshot() {
  const inputs = (i) => i === 0 ? { p1: command(family[0]) } : i === 60 ? { p2: command(family[1]) } : i === 125 ? { p1: command(family[2]) } : {};
  const a = match('p1', 95), b = saveSnapshot(a);
  for (let i = 0; i < 220; i++) {
    tickWithFighterOrder(a, inputs(i), ['p1', 'p2']);
    tickWithFighterOrder(b, inputs(i), ['p2', 'p1']);
  }
  assert.deepStrictEqual(a.checksums, b.checksums);
  assert.deepStrictEqual(executeReplay(recordReplay(a)).checksums, a.checksums);
  for (const e of family) {
    const full = match('p1', 400);
    tick(full, { p1: command(e) });
    until(full, () => full.fighters.p1.phaseTick === e.hop[1]);
    const resumed = restoreSnapshot(saveSnapshot(full));
    advance(full, 75); advance(resumed, 75);
    assert.deepStrictEqual(full.checksums, resumed.checksums);
    const changed = saveSnapshot(resumed);
    changed.fighters.p1.vy += 0.01;
    assert.notStrictEqual(checksumState(resumed), checksumState(changed), 'Inherited interrupted velocity belongs to the checksum');
    const left = match('p1', 400), right = match('p2', 400);
    for (let i = 0; i < e.total + 1; i++) {
      tick(left, { p1: i === 0 ? command(e) : {} });
      tick(right, { p2: i === 0 ? command(e) : {} });
      assert.strictEqual(left.fighters.p1.x, -right.fighters.p2.x);
      assert.strictEqual(left.fighters.p1.y, right.fighters.p2.y);
      assert.strictEqual(left.fighters.p1.grounded, right.fighters.p2.grounded);
    }
  }
}

function testStageBoundsAndLegacyProtection() {
  for (const e of family) for (const actor of ['p1', 'p2']) {
    const state = match(actor, 400), f = state.fighters[actor], target = state.fighters[opposite(actor)];
    f.x = actor === 'p1' ? 408 : -408;
    target.x = actor === 'p1' ? 420 : -420;
    state.stage.ceilingY = -45;
    for (let i = 0; i < e.total + 30; i++) {
      tick(state, { [actor]: i === 0 ? command(e) : {}, [opposite(actor)]: { down: true } });
      for (const body of Object.values(state.fighters)) {
        assert.ok(body.x >= state.stage.left && body.x <= state.stage.right);
        assert.ok(body.y >= state.stage.ceilingY && body.y <= state.stage.groundY);
      }
    }
  }
  const file = path.resolve(__dirname, '../../game.js');
  assert.strictEqual(crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex').toUpperCase(), 'D081DA2D907CF6ABD978301C1637008B26CCB30B47E2CCAFCA3FEA3331910C6B');
  for (const kind of ['lamuh_proto', 'training_dummy']) for (const e of family) {
    assert.strictEqual(fighterDefinitions[kind].attacks[e.id], undefined);
    assert.strictEqual(fighterDefinitions[kind].extendedHurtboxes, undefined);
  }
}

const tests = [testIndependentAuthoringAndInputPriority, testExactRootTrajectoryAndSafeRecovery, testSingleHitBlockAndCrouchCounterplay, testAntiAirAndNoBehindOrFarSuction, testHitstopFreezesEveryTrajectorySample, testInterruptionsPreserveAirborneStateAndVulnerability, testNoAirCancelInvulnerabilityOrJuggleReset, testMirrorOrderReplayAndMidHopSnapshot, testStageBoundsAndLegacyProtection];
for (const test of tests) { test(); console.log(`PASS ${test.name}`); }
console.log(`Heaven Splitter ${tests.length} deterministic test groups passed`);
