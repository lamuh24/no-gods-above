const assert = require('assert');
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const { createMatch, tick, tickWithFighterOrder, saveSnapshot, restoreSnapshot, currentAuthoredDive, currentAttackPhase, fighterPushbox } = require('../dist/core/engine');
const { checksumState } = require('../dist/core/checksum');
const { recordReplay, executeReplay } = require('../dist/core/replay');
const { fighterDefinitions } = require('../dist/data/fighters');

const family = [
  { button: 'light', startup: 7, active: 10, landing: 10, minHeight: 32, vx: 7, vy: 5, gatherVx: 2, damage: 40, hitstop: 5, palm: [1056, 1189], rect: { x: 40, y: -62, w: 54, h: 46 } },
  { button: 'medium', startup: 10, active: 10, landing: 14, minHeight: 44, vx: 5, vy: 8, gatherVx: 1, damage: 58, hitstop: 7, palm: [1045, 1220], rect: { x: 38, y: -55, w: 54, h: 46 } },
  { button: 'heavy', startup: 14, active: 12, landing: 20, minHeight: 60, vx: 3, vy: 12, gatherVx: 0.5, damage: 76, hitstop: 9, palm: [946, 1354], rect: { x: 14, y: -28, w: 54, h: 50 } }
].map((e) => ({ ...e, id: `legacy_radiant_dive_${e.button}` }));
const opposite = (id) => id === 'p1' ? 'p2' : 'p1';
const command = (e) => ({ special: true, [e.button]: true });
const attack = (e) => fighterDefinitions.lamuh_legacy_v2.attacks[e.id];
const hash = (value) => crypto.createHash('sha256').update(JSON.stringify(value)).digest('hex');
function previousBuildCompatibleDefinition(value) {
  const result = structuredClone(value);
  for (const e of family) delete result.attacks[e.id];
  // Later additive retreat family is outside this pre-Dive baseline. Keep the
  // historical expected hash and all old move fields exact.
  for (const id of ['legacy_divine_vanish_light', 'legacy_divine_vanish_medium', 'legacy_divine_vanish_heavy']) delete result.attacks[id];
  if (result.kind === 'lamuh_legacy_v2') result.attacks.legacy_ascend_step_heavy = require('../dist/data/fighters').LAMUH_ASCEND_HEAVY_V1_HISTORICAL;
  // The pre-task Vite/dist baseline predates these two Swahili source IDs.
  // Preserve current source (also required by swahili_down_special_motion_v3),
  // and allow ONLY this verified source/build compatibility delta in old hashes.
  const boxes = result.attacks.special_down_medium.hitboxes;
  assert.deepStrictEqual(boxes.map(h => h.id), ['crossdraw_low_shot', 'crossdraw_mid_shot']);
  boxes[0].id = 'hook_ferrule_low_hook'; boxes[1].id = 'hook_ferrule_shove';
  return result;
}
function match(actor = 'p1', height = 100, gap = 100) {
  const state = createMatch(90605, { matchId: `dive-${actor}-${height}-${gap}`, p1Kind: 'lamuh_legacy_v2', p2Kind: 'lamuh_legacy_v2', p1X: -gap / 2, p2X: gap / 2 });
  Object.assign(state.fighters[actor], { grounded: false, y: -height, phase: 'jump', vy: -4, vx: actor === 'p1' ? 2 : -2, airActionsRemaining: 5, airDashesRemaining: 1 });
  return state;
}
function advance(state, count, input = () => ({})) { for (let i = 0; i < count; i++) tick(state, input(i)); }
function until(state, predicate, limit = 150, input = () => ({})) {
  for (let i = 0; i < limit; i++) { if (predicate(state)) return; tick(state, input(i)); }
  assert.fail('Expected Radiant Dive condition not reached');
}
function separated(state) {
  const a = fighterPushbox(state.fighters.p1), b = fighterPushbox(state.fighters.p2);
  return !(a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y);
}

function testIndependentProfilesAndPreservedBaselines() {
  for (const e of family) {
    const a = attack(e), h = a.hitboxes[0];
    assert.deepStrictEqual([a.startup, a.active, a.recovery], [e.startup, e.active, e.landing]);
    assert.deepStrictEqual(a.authoredDive, { minimumHeight: e.minHeight, maximumHeight: 180, landingApproachHeight: 2 * e.vy, windupVelocity: { x: 0.8, y: 0.5 }, strikeVelocity: { x: e.vx, y: e.vy }, gatherVelocity: { x: e.gatherVx, y: e.vy }, landingRecoveryTicks: e.landing });
    assert.strictEqual(a.airOnly, true); assert.strictEqual(a.airActionCost, 2);
    assert.strictEqual(a.hitboxes.length, 1); assert.strictEqual(h.maxHits, 1);
    assert.strictEqual(h.start, e.startup); assert.strictEqual(h.end, e.startup + e.active - 1);
    assert.strictEqual(h.damage, e.damage); assert.strictEqual(h.hitstop, e.hitstop);
    assert(!a.cancel && !a.authoredHop && !a.projectile && !a.targetSideSwitch && !h.allowOTG && !h.launches && !h.jumpCancelOnHit);
    assert(h.rect.w <= 80 && h.rect.h <= 80, 'One hand/forearm box, not a full-body/screen hitbox');
    assert.deepStrictEqual(h.rect, e.rect);
    const palmX = (e.palm[0] - 768) * 0.3 / 1.3, palmY = (e.palm[1] - 1360) * 0.3 / 1.3;
    assert(palmX >= h.rect.x && palmX <= h.rect.x + h.rect.w && palmY >= h.rect.y && palmY <= h.rect.y + h.rect.h, 'Independently normalized contact-palm socket must be inside its variant hand-only collision');
  }
  const oldLegacy = previousBuildCompatibleDefinition(fighterDefinitions.lamuh_legacy_v2);
  assert.strictEqual(hash(oldLegacy), 'f18519c2dc1bee1c63aa5b5a588b90d1a809e46a66fdc28958068301d038a4bd', 'Existing Lamuh data, including accepted Heaven, Palm, forward and normals, must stay byte-identical');
  assert.strictEqual(hash(previousBuildCompatibleDefinition(fighterDefinitions.lamuh_proto)), '419c14147996759221235bd720e09cedf5bfcddbc21dcf6e3969027b985a539c');
  assert.strictEqual(hash(previousBuildCompatibleDefinition(fighterDefinitions.training_dummy)), '4192024bc2545622d4bb5bd6e20b3b617fc8aafd1c9d0a59126c646887a571cb');
  const oldFixture = createMatch(901); advance(oldFixture, 20);
  assert.strictEqual(oldFixture.checksums.at(-1), '366de6d2', 'Absent optional dive state keeps old checksums unchanged');
  assert.strictEqual(crypto.createHash('sha256').update(fs.readFileSync(path.resolve(__dirname, '../../game.js'))).digest('hex').toUpperCase(), 'D081DA2D907CF6ABD978301C1637008B26CCB30B47E2CCAFCA3FEA3331910C6B');
}

function testAerialInputPriorityAndHeightGates() {
  for (const e of family) for (const actor of ['p1', 'p2']) {
    for (const direction of [{}, { up: true }, { down: true }, { left: true }, { right: true }]) {
      const state = match(actor, 100, 600);
      tick(state, { [actor]: { ...direction, ...command(e) } });
      assert.strictEqual(state.fighters[actor].currentAttack, e.id);
      assert.strictEqual(state.fighters[actor].airActionsRemaining, 3);
      assert.strictEqual(state.fighters[actor].airDashesRemaining, 0);
      assert.strictEqual(state.fighters[actor].airDiveUsed, true);
    }
    const modifierFirst = match(actor, 100, 600);
    tick(modifierFirst, { [actor]: { special: true } }); tick(modifierFirst, { [actor]: command(e) });
    assert.strictEqual(modifierFirst.fighters[actor].currentAttack, e.id);
    for (const mode of ['too_low', 'too_high', 'budget', 'already_used']) {
      const state = match(actor, mode === 'too_low' ? e.minHeight - 0.1 : mode === 'too_high' ? 181 : 100, 600), f = state.fighters[actor];
      if (mode === 'too_high') state.stage.ceilingY = -220;
      if (mode === 'budget') f.airActionsRemaining = 1;
      if (mode === 'already_used') f.airDiveUsed = true;
      tick(state, { [actor]: command(e) });
      assert.strictEqual(f.currentAttack, null, `${mode}: rejected special cannot become a plain normal/fixture ender`);
      assert.strictEqual(f.moveInstanceCounter, 0);
    }
    const threshold = match(actor, e.minHeight, 600); tick(threshold, { [actor]: command(e) });
    assert.strictEqual(threshold.fighters[actor].currentAttack, e.id);
    const grounded = createMatch(1, { p1Kind: 'lamuh_legacy_v2', p2Kind: 'lamuh_legacy_v2' });
    tick(grounded, { [actor]: command(e) });
    assert.strictEqual(grounded.fighters[actor].currentAttack, `legacy_celestial_palm_${e.button}`, 'Ground neutral special route remains unchanged');
    const buttonFirst = match(actor, 100, 600);
    tick(buttonFirst, { [actor]: { [e.button]: true } }); tick(buttonFirst, { [actor]: command(e) });
    assert.strictEqual(buttonFirst.fighters[actor].currentAttack, `air_${e.button}`, 'A normal already started on the prior tick is not silently replaced');
  }
}

function testCurrentPositionTrajectoryAndVariableLanding() {
  for (const e of family) for (const actor of ['p1', 'p2']) {
    const landingTicks = [];
    for (const height of [e.minHeight, 120, 180]) {
      const state = match(actor, height, 700), f = state.fighters[actor], facing = f.facing, startX = f.x;
      tick(state, { [actor]: command(e) });
      assert.strictEqual(f.y, -height + 0.5, 'Windup starts relative to current airborne y, never a ground-relative hop');
      assert(Math.abs(f.x - startX - 0.8 * facing) < 1e-10);
      assert.strictEqual(currentAuthoredDive(f, state).stage, 'windup');
      const airBound = currentAuthoredDive(f, state).maximumAirTicks;
      let lastY = f.y, gatherFrames = 0;
      until(state, () => f.phase === 'dive_landing', 100, () => {
        assert(f.y >= lastY, 'Uninterrupted dive never jerks upward'); lastY = f.y;
        const info = currentAuthoredDive(f, state);
        if (info.stage === 'strike') { assert.strictEqual(f.vx, facing * e.vx); assert.strictEqual(f.vy, e.vy); }
        if (info.stage === 'gather') { gatherFrames++; assert.strictEqual(f.vx, facing * e.gatherVx); assert.strictEqual(f.vy, e.vy); assert.strictEqual(currentAttackPhase(f), 'recovery'); }
        assert(f.phaseTick <= airBound); assert.strictEqual(f.currentAttack, e.id);
        return { [actor]: command(e) };
      });
      assert(gatherFrames >= 2, 'Every legal entry, including minimum height, physically gathers before floor contact');
      landingTicks.push(state.tick);
      assert.strictEqual(f.y, 0); assert.strictEqual(f.vy, 0); assert.strictEqual(f.vx, 0); assert.strictEqual(f.grounded, true);
      assert.strictEqual(f.phaseTick, 0); assert.strictEqual(f.airDiveUsed, undefined); assert.strictEqual(f.airActionsRemaining, 0);
      assert.strictEqual(currentAttackPhase(f), 'recovery');
      assert.strictEqual(currentAuthoredDive(f, state).landingTicksRemaining, e.landing);
      assert.strictEqual(f.recoveryEvent.durationTicks, e.landing);
      for (let t = 1; t < e.landing; t++) {
        tick(state, { [actor]: { ...command(e), up: true, right: true, block: true, throw: true } });
        assert.strictEqual(f.phase, 'dive_landing'); assert.strictEqual(f.phaseTick, t);
        assert.strictEqual(f.currentAttack, e.id); assert.strictEqual(f.blocking, false); assert.strictEqual(f.wakeupInvuln, 0);
      }
      tick(state, {}); assert.strictEqual(f.phase, 'idle'); assert.strictEqual(f.currentAttack, null); assert.strictEqual(currentAuthoredDive(f, state), null);
      assert.strictEqual(f.moveInstanceCounter, 1);
    }
    assert.strictEqual(new Set(landingTicks).size, 3, 'Different entry heights cannot claim one fixed landing tick');
  }
}

function testLandingApproachRetiresCollisionAndOwnsClock() {
  for (const e of family) {
    const state = match('p1', e.minHeight, 700), f = state.fighters.p1, victim = state.fighters.p2;
    tick(state, { p1: command(e) }); until(state, () => currentAuthoredDive(f, state)?.stage === 'gather');
    assert(f.phaseTick < e.startup + e.active, 'Floor approach may retire contact before its maximum active length');
    assert(f.y < 0); assert.strictEqual(currentAuthoredDive(f, state).stageTick, 0);
    assert.strictEqual(f.airDiveGatherStartTick, f.phaseTick);
    const snapshot = saveSnapshot(state), changed = restoreSnapshot(snapshot); changed.fighters.p1.airDiveGatherStartTick--;
    assert.notStrictEqual(checksumState(changed), checksumState(snapshot), 'Gather local clock must participate in rollback checksum');
    f.hitstop = 3;
    const frozenGather = { ...currentAuthoredDive(f, state), x: f.x, y: f.y, gatherStart: f.airDiveGatherStartTick };
    for (let t = 0; t < 3; t++) {
      tick(state, {});
      assert.deepStrictEqual({ ...currentAuthoredDive(f, state), x: f.x, y: f.y, gatherStart: f.airDiveGatherStartTick }, frozenGather);
    }
    Object.assign(victim, { x: f.x + 68, y: f.y, grounded: false, phase: 'jump', vy: 0 });
    until(state, () => f.phase === 'dive_landing');
    assert.strictEqual(victim.health, 1000); assert.strictEqual(victim.hitCountTaken, 0, 'Gather must not retain the old active hitbox near the floor');
    assert.strictEqual(f.airDiveGatherStartTick, undefined);
  }
}

function testEarlyFloorContactStillCommits() {
  for (const e of family) {
    const state = match('p1', e.minHeight, 100), f = state.fighters.p1;
    tick(state, { p1: command(e) });
    // Simulate a floor rising into the windup; no active hit may leak on crossing.
    state.stage.groundY = f.y + 0.2; state.fighters.p2.y = state.stage.groundY;
    tick(state, {});
    assert.strictEqual(f.phase, 'dive_landing'); assert.strictEqual(f.phaseTick, 0);
    assert.strictEqual(state.fighters.p2.hitCountTaken, 0);
    assert.strictEqual(f.recoveryEvent.durationTicks, e.landing);
    advance(state, e.landing - 1); assert.strictEqual(f.phase, 'dive_landing');
    tick(state, {}); assert.strictEqual(f.phase, 'idle');
  }
}

function testHitBlockWhiffAndOneContact() {
  for (const e of family) for (const actor of ['p1', 'p2']) for (const outcome of ['hit', 'stand_block', 'crouch_block', 'whiff']) {
    const state = match(actor, 100, outcome === 'whiff' ? 700 : 100), f = state.fighters[actor], victim = state.fighters[opposite(actor)];
    const contacts = []; let sawLanding = false;
    for (let i = 0; i < 100; i++) {
      const defense = outcome === 'stand_block' ? { block: true } : outcome === 'crouch_block' ? { block: true, down: true } : {};
      tick(state, { [actor]: i === 0 ? command(e) : {}, [opposite(actor)]: defense });
      if (state.lastCombatEvent?.tick === state.tick - 1) contacts.push(state.lastCombatEvent);
      if (f.phase === 'dive_landing') { sawLanding = true; assert.strictEqual(f.blocking, false); }
      assert(separated(state), `${actor}/${e.button}/${outcome}: pushboxes overlap`);
    }
    assert.strictEqual(contacts.length, outcome === 'whiff' ? 0 : 1);
    assert.strictEqual(victim.hitCountTaken, outcome === 'hit' ? 1 : 0);
    assert.strictEqual(victim.health, 1000 - (outcome === 'hit' ? e.damage : 0));
    if (outcome.includes('block')) assert.strictEqual(contacts[0].outcome, 'block');
    assert(sawLanding); assert.strictEqual(f.currentAttack, null); assert.strictEqual(f.moveInstanceCounter, 1);
  }
}

function testHitstopAndInterruptionPhysics() {
  for (const e of family) {
    const state = match('p1', 140, 700), f = state.fighters.p1;
    tick(state, { p1: command(e) }); until(state, () => f.phaseTick === e.startup + 1);
    f.hitstop = 8;
    const before = { x: f.x, y: f.y, vx: f.vx, vy: f.vy, phaseTick: f.phaseTick, used: f.airDiveUsed };
    for (let i = 0; i < 8; i++) { tick(state, {}); assert.deepStrictEqual({ x: f.x, y: f.y, vx: f.vx, vy: f.vy, phaseTick: f.phaseTick, used: f.airDiveUsed }, before); }
    tick(state, {}); assert.strictEqual(f.phaseTick, before.phaseTick + 1); assert.strictEqual(f.y, before.y + e.vy);
    const interrupted = match('p1', 80, 74), diver = interrupted.fighters.p1, opponent = interrupted.fighters.p2;
    tick(interrupted, { p1: command(e) });
    Object.assign(opponent, { phase: 'attack', phaseTick: 5, currentAttack: 'standing_medium', currentMoveInstance: 1, moveInstanceCounter: 1, attackFacing: -1 });
    const yBeforeHit = diver.y; tick(interrupted, {});
    assert.strictEqual(diver.currentAttack, null); assert(diver.hitstun > 0); assert.strictEqual(diver.grounded, false);
    assert.strictEqual(diver.y, yBeforeHit + 0.5); assert.strictEqual(diver.airDiveUsed, true);
    until(interrupted, () => diver.hitstop === 0);
    const yAfterHitstop = diver.y, velocity = diver.vy;
    tick(interrupted, {});
    assert.strictEqual(diver.y, yAfterHitstop + velocity + 1.05, 'Interrupted motion hands off to normal gravity, never resumes dive velocity or snaps to floor');
    until(interrupted, () => diver.grounded); assert.strictEqual(diver.airDiveUsed, undefined);
  }
}

function testRomanCancelBudgetAndNoRepeat() {
  for (const e of family) {
    const state = match('p1', 120, 100), f = state.fighters.p1;
    f.tension = 100;
    tick(state, { p1: command(e) }); until(state, () => f.attackConnected);
    until(state, () => f.hitstop === 0);
    const actions = f.airActionsRemaining;
    tick(state, { p1: { romanCancel: true } });
    assert.strictEqual(f.phase, 'roman_cancel'); assert.strictEqual(f.tensionSpent, 50);
    assert.strictEqual(f.airActionsRemaining, actions, 'Paid RC does not refund dive air-actions');
    assert.strictEqual(f.airDashesRemaining, 0); assert.strictEqual(f.airDiveUsed, true);
    until(state, () => f.phase !== 'roman_cancel');
    // Rejection uses the persistent flag independently of budget or minimum height.
    f.y = -100; f.vy = 0; f.airActionsRemaining = 5;
    tick(state, {}); tick(state, { p1: command(family[0]) });
    assert.strictEqual(f.currentAttack, null); assert.strictEqual(f.moveInstanceCounter, 1);
    assert.strictEqual(f.airDiveUsed, true);
  }
}

function testMirroredBoundedTrajectoriesAndOrderParity() {
  for (const e of family) {
    const a = match('p1', 140, 300), b = match('p2', 140, 300);
    for (let i = 0; i < 100; i++) {
      tick(a, { p1: i === 0 ? command(e) : {} }); tick(b, { p2: i === 0 ? command(e) : {} });
      assert(Math.abs(a.fighters.p1.x + b.fighters.p2.x) < 1e-8);
      assert.strictEqual(a.fighters.p1.y, b.fighters.p2.y);
      assert.strictEqual(a.fighters.p1.phase, b.fighters.p2.phase);
    }
    for (const actor of ['p1', 'p2']) for (const corner of [-1, 1]) {
      const state = match(actor, 180, 68), f = state.fighters[actor];
      state.stage.left = -280; state.stage.right = 280;
      f.x = corner * 265; f.facing = corner; f.attackFacing = corner;
      state.fighters[opposite(actor)].x = corner * 180;
      for (let i = 0; i < 100; i++) {
        tick(state, { [actor]: i === 0 ? command(e) : {} });
        assert(f.x >= -280 && f.x <= 280); assert(f.y <= 0 && f.y >= -180); assert(separated(state));
      }
    }
    const ordered = match('p1', 100, 100), reversed = restoreSnapshot(ordered);
    for (let i = 0; i < 100; i++) {
      const input = { p1: i === 0 ? command(e) : {}, p2: i < 40 ? { block: true } : {} };
      tickWithFighterOrder(ordered, input, ['p1', 'p2']); tickWithFighterOrder(reversed, input, ['p2', 'p1']);
      assert.strictEqual(checksumState(ordered), checksumState(reversed));
    }
  }
}

function testSnapshotsReplayAndChecksumOwnership() {
  for (const e of family) {
    const windup = match('p1', 180, 700); tick(windup, { p1: command(e) });
    assert.strictEqual(windup.presentationEventLedger.length, 0);
    for (const field of ['moveInstanceCounter', 'currentMoveInstance']) {
      const changedSource = restoreSnapshot(windup); changedSource.fighters.p1[field] += 100;
      assert.notStrictEqual(checksumState(windup), checksumState(changedSource), `Dive windup must checksum future contact source ${field} before a presentation event exists`);
    }
    const changedMatch = restoreSnapshot(windup); changedMatch.matchId += '-different';
    assert.notStrictEqual(checksumState(windup), checksumState(changedMatch), 'The future contact match namespace is authoritative during windup');
    const live = match('p1', 180, 700); tick(live, { p1: command(e) }); advance(live, 5);
    const snapshot = saveSnapshot(live), restored = restoreSnapshot(snapshot);
    for (let i = 0; i < 100; i++) { tick(live, {}); tick(restored, {}); assert.strictEqual(checksumState(live), checksumState(restored)); }
    const changed = restoreSnapshot(snapshot); delete changed.fighters.p1.airDiveUsed;
    assert.notStrictEqual(checksumState(changed), checksumState(snapshot), 'Once-per-airtime state must be checksum-owned');
    const natural = createMatch(931, { p1Kind: 'lamuh_legacy_v2', p2Kind: 'lamuh_legacy_v2', p1X: -50, p2X: 50 });
    for (let i = 0; i < 120; i++) tick(natural, { p1: i === 0 ? { up: true } : i === 10 ? command(e) : {} });
    assert.strictEqual(natural.fighters.p1.moveInstanceCounter, 1);
    const replay = executeReplay(recordReplay(natural));
    assert.strictEqual(replay.checksums.at(-1), natural.checksums.at(-1));
    assert.deepStrictEqual(replay.checksums, natural.checksums);
  }
}

const tests = [testIndependentProfilesAndPreservedBaselines, testAerialInputPriorityAndHeightGates, testCurrentPositionTrajectoryAndVariableLanding, testEarlyFloorContactStillCommits, testLandingApproachRetiresCollisionAndOwnsClock, testHitBlockWhiffAndOneContact, testHitstopAndInterruptionPhysics, testRomanCancelBudgetAndNoRepeat, testMirroredBoundedTrajectoriesAndOrderParity, testSnapshotsReplayAndChecksumOwnership];
for (const test of tests) { test(); console.log(`PASS ${test.name}`); }
console.log(`PASS Radiant Dive deterministic core: ${tests.length} groups`);
