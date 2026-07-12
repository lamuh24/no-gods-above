const assert = require('assert');
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const {
  createMatch,
  executeReplay,
  getThrowDebugGeometry,
  recordReplay,
  restoreSnapshot,
  saveSnapshot,
  tick,
  tickWithFighterOrder
} = require('../dist');
const { defaultTuning, fighterDefinitions } = require('../dist/data/fighters');
const { KeyboardInputAdapter, normalizeMockGamepad } = require('../dist/debug/inputAdapter');
const { debugKeyboardMapping, keyboardMapping, reservedCombatActions, standardGamepadMapping } = require('../dist/debug/inputMap');

const LEGACY_GAME_SHA256 = '401E262330F74AB9A2673C12C98AA0405F37F04ACC5BA2D773B5F9B531B7E5F1';
const THROW_ID = 'forward_throw';
const authoredThrow = defaultTuning.throws[THROW_ID];

function close(state, facing = 1) {
  const p1 = state.fighters.p1;
  const p2 = state.fighters.p2;
  p1.x = facing === 1 ? -40 : 40;
  p2.x = facing === 1 ? 40 : -40;
  p1.facing = facing;
  p2.facing = -facing;
}

function advanceUntil(state, predicate, max = 180, inputAt = () => ({})) {
  for (let index = 0; index < max; index++) {
    tick(state, inputAt(index));
    if (predicate(state)) return index + 1;
  }
  throw new Error(`condition not reached within ${max} ticks`);
}

function startCapture(state, facing = 1) {
  close(state, facing);
  tick(state, { p1: { throw: true } });
  assert.strictEqual(state.fighters.p1.phase, 'throw_startup');
  advanceUntil(state, (current) => current.fighters.p1.phase === 'throw_capture', authoredThrow.startup + authoredThrow.active + 2);
  assert.strictEqual(state.fighters.p2.phase, 'throw_victim_captured');
  return state;
}

function advanceToRelease(state) {
  advanceUntil(state, (current) => current.fighters.p1.phase === 'throw_release', authoredThrow.impactTick + 2);
  return state;
}

function ticksUntilTechRecoveryEnds(state) {
  let ticks = 0;
  while (state.fighters.p1.phase === 'throw_teched' && ticks <= authoredThrow.techRecovery) {
    tick(state, {});
    ticks++;
  }
  return ticks;
}

function assertInsideBounds(state) {
  for (const fighter of Object.values(state.fighters)) {
    assert.ok(fighter.x >= state.stage.left && fighter.x <= state.stage.right, `${fighter.id} escaped horizontal stage bounds at ${fighter.x}`);
    assert.ok(fighter.y >= state.stage.ceilingY && fighter.y <= state.stage.groundY, `${fighter.id} escaped vertical stage bounds at ${fighter.y}`);
  }
}

function assertThrowLinksCleared(state) {
  for (const fighter of Object.values(state.fighters)) {
    assert.strictEqual(fighter.throwPartner, null);
    assert.strictEqual(fighter.currentThrow, null);
  }
}

function button(pressed = false) {
  return { pressed, touched: pressed, value: pressed ? 1 : 0 };
}

function testForwardThrowIsAuthoredDataNotAStrikeAlias() {
  assert.strictEqual(authoredThrow.id, THROW_ID);
  assert.strictEqual(authoredThrow.command, 'Throw');
  assert.ok(authoredThrow.startup >= 5 && authoredThrow.startup <= 7);
  assert.strictEqual(authoredThrow.active, 2);
  assert.ok(authoredThrow.techWindow >= 7 && authoredThrow.techWindow <= 10);
  assert.ok(authoredThrow.impactTick > authoredThrow.techWindow, 'impact must happen after the complete tech window');
  assert.ok(authoredThrow.release > 0 && authoredThrow.recovery > 0);
  assert.ok(authoredThrow.whiffRecovery > authoredThrow.recovery, 'a missed throw needs meaningful recovery');
  assert.ok(authoredThrow.damage > 0);
  const aerialRouteDamage = ['air_light', 'air_medium', 'air_heavy'].reduce((sum, id) => sum + defaultTuning.attacks[id].hitboxes[0].damage, 0);
  assert.ok(authoredThrow.damage < aerialRouteDamage, 'universal throw damage must stay below a complete aerial route');
  assert.strictEqual(authoredThrow.knockdown, 'hard');
  assert.ok(authoredThrow.knockdownTicks > 0);
  assert.strictEqual(authoredThrow.throwBox.maxTargets, 1);
  assert.strictEqual(authoredThrow.throwBox.groundedOnly, true);
  assert.ok(fighterDefinitions.lamuh_proto.throwHurtbox);
  assert.ok(fighterDefinitions.training_dummy.throwHurtbox);
  assert.deepStrictEqual(fighterDefinitions.lamuh_proto.throws[THROW_ID], fighterDefinitions.training_dummy.throws[THROW_ID]);
  const strikeIds = Object.values(defaultTuning.attacks).flatMap((attack) => attack.hitboxes.map((hitbox) => hitbox.id));
  assert.ok(!strikeIds.includes(authoredThrow.throwBox.id), 'throw collision must remain distinct from strike hitboxes');
  assert.notStrictEqual(fighterDefinitions.lamuh_proto.throwHurtbox, fighterDefinitions.lamuh_proto.standingHurtboxes[0]);
}

function testThrowInputUsesNormalizedKeyboardAndGamepadMappings() {
  assert.deepStrictEqual(keyboardMapping.throw, ['KeyI']);
  assert.strictEqual(standardGamepadMapping.throw, 5);
  assert.strictEqual(reservedCombatActions.throw, 'active / universal forward throw + throw tech');
  const debugCodes = new Set(Object.values(debugKeyboardMapping));
  assert.ok(!debugCodes.has('KeyI'), 'the combat throw key cannot also trigger a debug command');

  const listeners = {};
  const target = { addEventListener(type, listener) { listeners[type] = listener; } };
  const adapter = new KeyboardInputAdapter();
  adapter.attach(target);
  listeners.keydown({ code: 'KeyI' });
  assert.strictEqual(adapter.readKeyboard().throw, true);
  listeners.keyup({ code: 'KeyI' });
  assert.strictEqual(adapter.readKeyboard().throw, false);

  const buttons = Array.from({ length: 16 }, () => button(false));
  buttons[standardGamepadMapping.throw] = button(true);
  const normalized = normalizeMockGamepad({ id: 'throw-pad', axes: [0, 0], buttons });
  assert.strictEqual(normalized.frame.throw, true);
  assert.strictEqual(normalized.frame.light, false);
  assert.strictEqual(normalized.frame.block, false);
}

function testThrowInputIsJustPressedAndHeldInputDoesNotRepeat() {
  const state = createMatch(2001);
  tick(state, { p1: { throw: true } });
  const heldTicks = authoredThrow.startup + authoredThrow.active + authoredThrow.whiffRecovery + 8;
  for (let index = 0; index < heldTicks; index++) tick(state, { p1: { throw: true } });
  assert.strictEqual(state.fighters.p1.phase, 'idle');
  assert.strictEqual(state.fighters.p1.currentThrow, null);
  assert.strictEqual(state.fighters.p1.lastThrowOutcome, 'whiff');
  tick(state, { p1: {} });
  tick(state, { p1: { throw: true } });
  assert.strictEqual(state.fighters.p1.phase, 'throw_startup', 'a release and new press must start a fresh throw');
}

function testHeldDefenderThrowBeforeCaptureDoesNotTech() {
  const state = createMatch(2002);
  close(state);
  state.fighters.p2.phase = 'landing';
  state.fighters.p2.phaseTick = 0;
  tick(state, { p1: { throw: true }, p2: { throw: true } });
  advanceUntil(
    state,
    (current) => current.fighters.p1.phase === 'throw_capture',
    authoredThrow.startup + 2,
    () => ({ p2: { throw: true } })
  );
  assert.strictEqual(state.fighters.p1.phase, 'throw_capture');
  assert.strictEqual(state.fighters.p2.phase, 'throw_victim_captured');
  assert.strictEqual(state.fighters.p2.deterministicBuffer.pressed.throw, undefined);
}

function testCloseGroundedThrowCapturesOnceWithoutEarlyDamage() {
  const state = startCapture(createMatch(2003));
  const p1 = state.fighters.p1;
  const p2 = state.fighters.p2;
  assert.strictEqual(p1.currentThrow, THROW_ID);
  assert.strictEqual(p2.currentThrow, THROW_ID);
  assert.strictEqual(p1.throwPartner, 'p2');
  assert.strictEqual(p2.throwPartner, 'p1');
  assert.strictEqual(p1.lastThrowOutcome, 'captured');
  assert.strictEqual(p2.lastThrowOutcome, 'captured');
  assert.strictEqual(p2.health, 1000, 'capture cannot deal damage before the authored impact');
  assert.strictEqual(p2.hitCountTaken, 0);
  assert.strictEqual(p1.throwFacing, 1);
}

function testBlockingDoesNotProtectAgainstAStandardThrow() {
  const state = createMatch(2004);
  close(state);
  tick(state, { p1: { throw: true }, p2: { block: true } });
  advanceUntil(
    state,
    (current) => current.fighters.p1.phase === 'throw_capture',
    authoredThrow.startup + 2,
    () => ({ p2: { block: true } })
  );
  assert.strictEqual(state.fighters.p2.phase, 'throw_victim_captured');
  assert.strictEqual(state.fighters.p2.blocking, false);
}

function testAirborneAttackerCannotStartGroundThrow() {
  const state = createMatch(2005);
  const p1 = state.fighters.p1;
  p1.grounded = false;
  p1.y = -80;
  p1.phase = 'jump';
  p1.airActionsRemaining = 3;
  tick(state, { p1: { throw: true } });
  assert.strictEqual(p1.currentThrow, null);
  assert.strictEqual(p1.phase, 'jump');
}

function testInvalidTargetsCannotBeCaptured() {
  const cases = [
    ['airborne', (target) => Object.assign(target, { grounded: false, y: -160, vy: 0, phase: 'jump' })],
    ['hitstun', (target) => Object.assign(target, { hitstun: 30, phase: 'hit_reaction' })],
    ['blockstun', (target) => Object.assign(target, { blockstun: 30, phase: 'block' })],
    ['knockdown', (target) => Object.assign(target, { knockdownTicks: 30, phase: 'knockdown' })],
    ['getup', (target) => Object.assign(target, { getupTicks: 30, wakeupInvuln: 18, phase: 'getup' })],
    ['throw invulnerability', (target) => Object.assign(target, { throwInvulnTicks: 30 })],
    ['throw recovery', (target) => Object.assign(target, { currentThrow: THROW_ID, phase: 'throw_recovery', phaseTick: 0 })]
  ];
  for (const [name, configure] of cases) {
    const state = createMatch(2100 + cases.findIndex(([entry]) => entry === name));
    close(state);
    configure(state.fighters.p2);
    tick(state, { p1: { throw: true } });
    advanceUntil(state, (current) => current.fighters.p1.phase === 'throw_whiff', authoredThrow.startup + authoredThrow.active + 3);
    assert.strictEqual(state.fighters.p2.health, 1000, `${name} target was damaged`);
    assert.notStrictEqual(state.fighters.p2.phase, 'throw_victim_captured', `${name} target was captured`);
  }

  const inactive = createMatch(2110);
  close(inactive);
  inactive.roundActive = false;
  tick(inactive, { p1: { throw: true } });
  assert.strictEqual(inactive.fighters.p1.currentThrow, null);

  const defeated = createMatch(2111);
  close(defeated);
  defeated.fighters.p2.health = 0;
  tick(defeated, { p1: { throw: true } });
  assert.strictEqual(defeated.fighters.p1.currentThrow, null);
}

function testThrowWhiffUsesExactStartupActiveAndRecoveryTiming() {
  const state = createMatch(2006);
  tick(state, { p1: { throw: true } });
  for (let index = 1; index < authoredThrow.startup; index++) tick(state, {});
  assert.strictEqual(state.tick, authoredThrow.startup);
  assert.strictEqual(state.fighters.p1.phase, 'throw_active');
  assert.strictEqual(state.fighters.p1.phaseTick, 0);
  for (let index = 1; index < authoredThrow.active; index++) tick(state, {});
  assert.strictEqual(state.fighters.p1.phase, 'throw_active');
  tick(state, {});
  assert.strictEqual(state.tick, authoredThrow.startup + authoredThrow.active);
  assert.strictEqual(state.fighters.p1.phase, 'throw_whiff');
  assert.strictEqual(state.fighters.p1.phaseTick, 0);
  for (let index = 1; index < authoredThrow.whiffRecovery; index++) tick(state, {});
  assert.strictEqual(state.fighters.p1.phase, 'throw_whiff');
  tick(state, {});
  assert.strictEqual(state.tick, authoredThrow.startup + authoredThrow.active + authoredThrow.whiffRecovery);
  assert.strictEqual(state.fighters.p1.phase, 'idle');
  assert.strictEqual(state.fighters.p1.currentThrow, null);
}

function testCaptureFrameAndLastWindowTickCanTech() {
  const captureFrame = createMatch(2007);
  close(captureFrame);
  tick(captureFrame, { p1: { throw: true } });
  while (captureFrame.fighters.p1.phaseTick < authoredThrow.startup - 1) tick(captureFrame, {});
  tick(captureFrame, { p2: { throw: true } });
  assert.strictEqual(captureFrame.fighters.p1.phase, 'throw_teched');
  assert.strictEqual(captureFrame.fighters.p2.phase, 'throw_teched');
  assert.strictEqual(captureFrame.fighters.p2.health, 1000);
  assert.strictEqual(captureFrame.fighters.p1.phaseTick, 0);
  assert.strictEqual(ticksUntilTechRecoveryEnds(captureFrame), authoredThrow.techRecovery);

  const lastTick = startCapture(createMatch(2008));
  for (let index = 0; index < authoredThrow.techWindow - 1; index++) tick(lastTick, {});
  assert.strictEqual(lastTick.fighters.p1.phaseTick, authoredThrow.techWindow - 1);
  tick(lastTick, { p2: { throw: true } });
  assert.strictEqual(lastTick.fighters.p1.phase, 'throw_teched');
  assert.strictEqual(lastTick.fighters.p2.phase, 'throw_teched');
  assert.strictEqual(lastTick.fighters.p2.health, 1000);
  assert.strictEqual(lastTick.fighters.p1.phaseTick, 0);
  assert.strictEqual(ticksUntilTechRecoveryEnds(lastTick), authoredThrow.techRecovery);
}

function testLateThrowTechIsRejectedAndImpactStillOccurs() {
  const state = startCapture(createMatch(2009));
  for (let index = 0; index < authoredThrow.techWindow; index++) tick(state, {});
  assert.strictEqual(state.fighters.p1.phase, 'throw_capture');
  assert.strictEqual(state.fighters.p1.phaseTick, authoredThrow.techWindow);
  tick(state, { p2: { throw: true } });
  assert.notStrictEqual(state.fighters.p1.phase, 'throw_teched');
  advanceToRelease(state);
  assert.strictEqual(state.fighters.p2.health, 1000 - authoredThrow.damage);
  assert.strictEqual(state.fighters.p1.lastThrowOutcome, 'released');
}

function testAuthoredAnchorsFacingAndCaptureHitstopStayStable() {
  const state = startCapture(createMatch(2010), -1);
  const p1 = state.fighters.p1;
  const p2 = state.fighters.p2;
  const geometry = getThrowDebugGeometry(state, 'p1');
  assert.strictEqual(geometry.moveId, THROW_ID);
  assert.strictEqual(geometry.role, 'attacker');
  assert.strictEqual(geometry.pushboxSuppressed, true);
  assert.deepStrictEqual(geometry.grabAnchor, geometry.victimAnchor, 'authored grab and victim anchors must coincide');
  assert.ok(geometry.releaseAnchor && geometry.cameraTarget);
  assert.strictEqual(p1.throwFacing, -1);
  assert.strictEqual(p1.facing, -1);
  assert.strictEqual(p2.facing, 1);
  assert.deepStrictEqual([p1.vx, p1.vy, p2.vx, p2.vy], [0, 0, 0, 0]);

  const frozen = { p1x: p1.x, p2x: p2.x, p1y: p1.y, p2y: p2.y, phaseTick: p1.phaseTick };
  p1.hitstop = 3;
  p2.hitstop = 3;
  for (let index = 0; index < 3; index++) {
    tick(state, {});
    assert.deepStrictEqual(
      { p1x: p1.x, p2x: p2.x, p1y: p1.y, p2y: p2.y, phaseTick: p1.phaseTick },
      frozen,
      'captured pair drifted during hitstop'
    );
    assert.deepStrictEqual(getThrowDebugGeometry(state, 'p1').grabAnchor, getThrowDebugGeometry(state, 'p1').victimAnchor);
  }
  assert.strictEqual(p1.hitstop, 0);
  assert.strictEqual(p2.hitstop, 0);
}

function testReleaseDealsDamageOnceMovesForwardAndCausesHardKnockdown() {
  const state = startCapture(createMatch(2011));
  const captureX = state.fighters.p1.x;
  advanceToRelease(state);
  const p1 = state.fighters.p1;
  const p2 = state.fighters.p2;
  assert.strictEqual(p2.health, 1000 - authoredThrow.damage);
  assert.strictEqual(p2.hitCountTaken, 1);
  assert.strictEqual(p1.x, captureX + authoredThrow.forwardDisplacement);
  assert.strictEqual(p1.phase, 'throw_release');
  assert.strictEqual(p2.phase, 'throw_victim_released');
  assert.strictEqual(p2.knockdownTicks, authoredThrow.knockdownTicks);
  assert.strictEqual(p1.throwPartner, null);
  assert.strictEqual(p2.throwPartner, null);
  assert.strictEqual(p1.hitstop, authoredThrow.hitstop);
  assert.strictEqual(p2.hitstop, authoredThrow.hitstop);
  const releaseHealth = p2.health;
  for (let index = 0; index < 100; index++) {
    tick(state, {});
    assertInsideBounds(state);
  }
  assert.strictEqual(p2.health, releaseHealth, 'the throw impact applied more than once');
  assert.strictEqual(p2.hitCountTaken, 1);
  assert.strictEqual(p1.currentThrow, null);
  assert.ok(['knockdown', 'getup', 'idle'].includes(p2.phase));
}

function testForwardThrowContainsBothCornerDirectionsWithoutSideSwap() {
  for (const facing of [1, -1]) {
    const state = createMatch(2020 + facing);
    const p1 = state.fighters.p1;
    const p2 = state.fighters.p2;
    p1.x = facing === 1 ? 360 : -360;
    p2.x = facing === 1 ? 410 : -410;
    p1.facing = facing;
    p2.facing = -facing;
    tick(state, { p1: { throw: true } });
    assertInsideBounds(state);
    advanceUntil(
      state,
      (current) => current.fighters.p1.phase === 'throw_release',
      authoredThrow.startup + authoredThrow.impactTick + 4,
      () => {
        assertInsideBounds(state);
        return {};
      }
    );
    assertInsideBounds(state);
    assert.strictEqual(Math.sign(p2.x - p1.x), facing, 'forward throw swapped sides at the corner');
    for (let index = 0; index < 100; index++) {
      tick(state, {});
      assertInsideBounds(state);
    }
    assert.ok(!state.debugWarnings.some((warning) => warning.includes('vertical')));
  }
}

function testResetAndInvalidPairCleanupRestoreBothFighters() {
  const startupReset = createMatch(2029);
  startupReset.fighters.p1.x = 20;
  startupReset.fighters.p2.x = 76;
  tick(startupReset, { p1: { throw: true } });
  assert.strictEqual(startupReset.fighters.p1.phase, 'throw_startup');
  tick(startupReset, { p2: { reset: true } });
  assert.strictEqual(startupReset.fighters.p1.phase, 'idle');
  assert.strictEqual(startupReset.fighters.p1.currentThrow, null);
  assert.strictEqual(startupReset.fighters.p1.lastThrowOutcome, 'interrupted');

  const reset = startCapture(createMatch(2030));
  tick(reset, { p2: { reset: true } });
  assert.strictEqual(reset.fighters.p1.lastThrowOutcome, 'interrupted');
  assert.strictEqual(reset.fighters.p1.phase, 'idle');
  assert.strictEqual(reset.fighters.p2.phase, 'idle');
  assertThrowLinksCleared(reset);

  const defeatedVictim = startCapture(createMatch(2031));
  defeatedVictim.fighters.p2.health = 0;
  tick(defeatedVictim, {});
  assert.strictEqual(defeatedVictim.fighters.p1.lastThrowOutcome, 'interrupted');
  assert.strictEqual(defeatedVictim.fighters.p2.lastThrowOutcome, 'interrupted');
  assertThrowLinksCleared(defeatedVictim);

  const invalidRound = startCapture(createMatch(2032));
  invalidRound.roundActive = false;
  tick(invalidRound, {});
  assertThrowLinksCleared(invalidRound);
  assert.ok(!['throw_capture', 'throw_victim_captured'].includes(invalidRound.fighters.p1.phase));
  assert.ok(!['throw_capture', 'throw_victim_captured'].includes(invalidRound.fighters.p2.phase));
}

function testReleasedAndTechedFightersReceiveAuthoredThrowInvulnerability() {
  const released = startCapture(createMatch(2033));
  advanceToRelease(released);
  assert.strictEqual(released.fighters.p2.throwInvulnTicks, authoredThrow.releaseThrowInvuln);

  const teched = startCapture(createMatch(2034));
  tick(teched, { p2: { throw: true } });
  assert.strictEqual(teched.fighters.p1.phase, 'throw_teched');
  assert.strictEqual(teched.fighters.p1.throwInvulnTicks, authoredThrow.techThrowInvuln);
  assert.strictEqual(teched.fighters.p2.throwInvulnTicks, authoredThrow.techThrowInvuln);
}

function testConnectedStrikeBeatsUnconfirmedThrowAndCleansItUp() {
  const state = createMatch(2035);
  close(state);
  tick(state, { p1: { throw: true } });
  tick(state, {});
  tick(state, {});
  tick(state, { p2: { light: true } });
  tick(state, {});
  tick(state, {});
  assert.strictEqual(state.fighters.p1.health, 970);
  assert.strictEqual(state.fighters.p2.health, 1000);
  assert.strictEqual(state.fighters.p1.lastThrowOutcome, 'interrupted');
  assert.strictEqual(state.fighters.p1.currentThrow, null);
  assert.strictEqual(state.fighters.p1.throwPartner, null);
  assert.strictEqual(state.fighters.p2.throwPartner, null);
}

function testMutualForwardThrowsResolveAsDeterministicTech() {
  const state = createMatch(2036);
  close(state);
  tick(state, { p1: { throw: true }, p2: { throw: true } });
  advanceUntil(state, (current) => current.fighters.p1.phase === 'throw_teched', authoredThrow.startup + 3);
  assert.strictEqual(state.fighters.p2.phase, 'throw_teched');
  assert.strictEqual(state.fighters.p1.lastThrowOutcome, 'teched');
  assert.strictEqual(state.fighters.p2.lastThrowOutcome, 'teched');
  assert.strictEqual(state.fighters.p1.health, 1000);
  assert.strictEqual(state.fighters.p2.health, 1000);
  assert.strictEqual(state.fighters.p1.throwPartner, null);
  assert.strictEqual(state.fighters.p2.throwPartner, null);
  assert.strictEqual(state.fighters.p1.phaseTick, 0);
  assert.strictEqual(ticksUntilTechRecoveryEnds(state), authoredThrow.techRecovery);
}

function testThrowConsumesCombatInputAndCannotCancelFromGroundedAttacks() {
  const priority = createMatch(2037);
  close(priority);
  tick(priority, { p1: { throw: true, light: true } });
  assert.strictEqual(priority.fighters.p1.phase, 'throw_startup');
  assert.strictEqual(priority.fighters.p1.currentAttack, null);
  assert.strictEqual(priority.fighters.p1.currentThrow, THROW_ID);

  const attack = createMatch(2038);
  tick(attack, { p1: { light: true } });
  tick(attack, { p1: { throw: true } });
  assert.strictEqual(attack.fighters.p1.phase, 'attack');
  assert.strictEqual(attack.fighters.p1.currentAttack, 'standing_light');
  assert.strictEqual(attack.fighters.p1.currentThrow, null);
  for (let index = 0; index < 30; index++) tick(attack, {});
  assert.strictEqual(attack.fighters.p1.currentThrow, null, 'throw input during attack recovery must not leak into neutral');
}

function testThrowUsesStandaloneComboPolicyAndResetsAfterNeutral() {
  const state = createMatch(2039);
  close(state);
  Object.assign(state.fighters.p1, {
    comboCount: 3,
    comboDamage: 155,
    comboRoute: ['standing_light', 'standing_medium', 'standing_heavy'],
    comboTarget: 'p2',
    damageScaling: 0.76,
    comboNeutralTicks: 0
  });
  tick(state, { p1: { throw: true } });
  advanceUntil(state, (current) => current.fighters.p1.phase === 'throw_release', authoredThrow.startup + authoredThrow.impactTick + 3);
  assert.deepStrictEqual(state.fighters.p1.comboRoute, [THROW_ID]);
  assert.strictEqual(state.fighters.p1.comboCount, 1);
  assert.strictEqual(state.fighters.p1.comboDamage, authoredThrow.damage);
  assert.strictEqual(state.fighters.p1.damageScaling, 1);
  advanceUntil(state, (current) => current.fighters.p1.comboCount === 0, 180);
  assert.deepStrictEqual(state.fighters.p1.comboRoute, []);
  assert.strictEqual(state.fighters.p1.comboDamage, 0);
  assert.strictEqual(state.fighters.p1.damageScaling, 1);
}

function testThrowReplayAndCaptureSnapshotAreDeterministic() {
  const replayState = createMatch(2040);
  for (let index = 0; index < 15; index++) tick(replayState, { p1: { right: true } });
  tick(replayState, {});
  tick(replayState, { p1: { throw: true } });
  for (let index = 0; index < 100; index++) tick(replayState, {});
  assert.ok(replayState.inputLog.some((frame) => frame.p1?.throw));
  const replay = recordReplay(replayState);
  const replayed = executeReplay(replay);
  assert.deepStrictEqual(replayed.checksums, replayState.checksums);
  assert.strictEqual(replayed.checksums.at(-1), replay.finalChecksum);
  assert.strictEqual(replayed.fighters.p2.health, 1000 - authoredThrow.damage);

  const uninterrupted = startCapture(createMatch(2041));
  const restored = restoreSnapshot(saveSnapshot(uninterrupted));
  for (let index = 0; index < 100; index++) {
    tick(uninterrupted, {});
    tick(restored, {});
  }
  assert.deepStrictEqual(restored, uninterrupted);
}

function testMutualThrowIsIndependentOfFighterIterationOrder() {
  const normal = createMatch(2042);
  const reversed = createMatch(2042);
  close(normal);
  close(reversed);
  const frames = [{ p1: { throw: true }, p2: { throw: true } }, ...Array.from({ length: 40 }, () => ({}))];
  for (const frame of frames) {
    tickWithFighterOrder(normal, frame, ['p1', 'p2']);
    tickWithFighterOrder(reversed, frame, ['p2', 'p1']);
  }
  assert.deepStrictEqual(reversed, normal);
}

function testThrowStateNeverEscapesStageOrCameraHeightBounds() {
  const state = createMatch(2043);
  state.fighters.p1.x = 360;
  state.fighters.p2.x = 410;
  state.fighters.p1.facing = 1;
  state.fighters.p2.facing = -1;
  tick(state, { p1: { throw: true } });
  assertInsideBounds(state);
  for (let index = 0; index < 180; index++) {
    tick(state, {});
    assertInsideBounds(state);
  }
}

function testLegacyGameRemainsUntouched() {
  const bytes = fs.readFileSync(path.join(__dirname, '..', '..', 'game.js'));
  const hash = crypto.createHash('sha256').update(bytes).digest('hex').toUpperCase();
  assert.strictEqual(hash, LEGACY_GAME_SHA256);
}

const tests = [
  testForwardThrowIsAuthoredDataNotAStrikeAlias,
  testThrowInputUsesNormalizedKeyboardAndGamepadMappings,
  testThrowInputIsJustPressedAndHeldInputDoesNotRepeat,
  testHeldDefenderThrowBeforeCaptureDoesNotTech,
  testCloseGroundedThrowCapturesOnceWithoutEarlyDamage,
  testBlockingDoesNotProtectAgainstAStandardThrow,
  testAirborneAttackerCannotStartGroundThrow,
  testInvalidTargetsCannotBeCaptured,
  testThrowWhiffUsesExactStartupActiveAndRecoveryTiming,
  testCaptureFrameAndLastWindowTickCanTech,
  testLateThrowTechIsRejectedAndImpactStillOccurs,
  testAuthoredAnchorsFacingAndCaptureHitstopStayStable,
  testReleaseDealsDamageOnceMovesForwardAndCausesHardKnockdown,
  testForwardThrowContainsBothCornerDirectionsWithoutSideSwap,
  testResetAndInvalidPairCleanupRestoreBothFighters,
  testReleasedAndTechedFightersReceiveAuthoredThrowInvulnerability,
  testConnectedStrikeBeatsUnconfirmedThrowAndCleansItUp,
  testMutualForwardThrowsResolveAsDeterministicTech,
  testThrowConsumesCombatInputAndCannotCancelFromGroundedAttacks,
  testThrowUsesStandaloneComboPolicyAndResetsAfterNeutral,
  testThrowReplayAndCaptureSnapshotAreDeterministic,
  testMutualThrowIsIndependentOfFighterIterationOrder,
  testThrowStateNeverEscapesStageOrCameraHeightBounds,
  testLegacyGameRemainsUntouched
];

const failures = [];
for (const test of tests) {
  try {
    test();
    console.log(`PASS ${test.name}`);
  } catch (error) {
    failures.push({ test: test.name, error });
    console.error(`FAIL ${test.name}: ${error.message}`);
  }
}
if (failures.length > 0) {
  const details = failures.map(({ test, error }) => `${test}\n${error.stack}`).join('\n\n');
  throw new Error(`${failures.length} forward throw regression(s) failed:\n${details}`);
}
