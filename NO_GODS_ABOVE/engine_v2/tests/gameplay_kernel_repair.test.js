const assert = require('assert');
const fs = require('fs');
const path = require('path');
const { createMatch, restoreSnapshot, saveSnapshot, tick, tickWithFighterOrder } = require('../dist');
const { defaultTuning, fighterDefinitions } = require('../dist/data/fighters');
const { debugKeyboardMapping, keyboardMapping, reservedCombatActions } = require('../dist/debug/inputMap');

function close(state) { state.fighters.p1.x = -72; state.fighters.p2.x = 30; }
function advanceUntil(state, predicate, max = 180, inputAt = () => ({})) {
  for (let index = 0; index < max; index++) { tick(state, inputAt(index)); if (predicate(state)) return index + 1; }
  throw new Error(`condition not reached within ${max} ticks`);
}
function hitWith(input, seed = 100) { const state = createMatch(seed); close(state); tick(state, { p1: input }); advanceUntil(state, (s) => s.fighters.p2.health < 1000); return state; }
function runChain(first, second, third, holdDownAfterSecond = false) {
  // Full authored startup lets the defender travel during knockback; test confirmed
  // close-range chains here and keep the wider spacing whiff in its own regression.
  const state = createMatch(140, { p1X: -66, p2X: 30 });
  tick(state, { p1: first }); advanceUntil(state, (s) => s.fighters.p1.comboCount === 1);
  tick(state, { p1: second }); advanceUntil(state, (s) => s.fighters.p1.comboCount === 2, 90, () => ({ p1: holdDownAfterSecond ? { down: true } : {} }));
  tick(state, { p1: third }); advanceUntil(state, (s) => s.fighters.p1.comboCount === 3, 120, () => ({ p1: holdDownAfterSecond ? { down: true } : {} }));
  return state;
}
function assertInsideBounds(state) { for (const fighter of Object.values(state.fighters)) { assert.ok(fighter.x >= state.stage.left && fighter.x <= state.stage.right); assert.ok(fighter.y >= state.stage.ceilingY && fighter.y <= state.stage.groundY); } }

function testGroundedMediumAndHeavyStayOnFloor() {
  for (const input of [{ medium: true }, { heavy: true }]) {
    const state = hitWith(input);
    const defender = state.fighters.p2;
    assert.strictEqual(defender.grounded, true); assert.strictEqual(defender.y, state.stage.groundY); assert.strictEqual(defender.vy, 0);
    for (let i = 0; i < 30; i++) { tick(state, {}); assert.strictEqual(defender.y, state.stage.groundY); assert.strictEqual(defender.vy, 0); }
  }
}

function testLauncherBoundedAndLands() {
  const state = hitWith({ down: true, heavy: true }, 101); const defender = state.fighters.p2;
  assert.strictEqual(defender.grounded, false);
  let minimumY = defender.y;
  const landingTicks = advanceUntil(state, (s) => s.fighters.p2.grounded && s.fighters.p2.y === s.stage.groundY, 120, () => { minimumY = Math.min(minimumY, defender.y); return {}; });
  assert.ok(minimumY >= state.stage.ceilingY); assert.ok(landingTicks < 120); assert.strictEqual(defender.vy, 0); assertInsideBounds(state);
}

function testJumpStartupExactlyOnce() {
  const state = createMatch(102); tick(state, { p1: { up: true } }); let elapsed = 1;
  while (state.fighters.p1.grounded && elapsed < 20) { tick(state, {}); elapsed++; }
  assert.strictEqual(elapsed, defaultTuning.lamuh_proto.jumpStartup); assert.strictEqual(state.fighters.p1.phase, 'jump'); assert.ok(state.fighters.p1.y < 0);
  const landingTicks = advanceUntil(state, (s) => s.fighters.p1.grounded && s.fighters.p1.phase === 'landing', 120);
  assert.ok(landingTicks < 120); assert.strictEqual(state.fighters.p1.y, state.stage.groundY);
}

function movementDuration(direction, phase, duration) {
  const state = createMatch(103); const key = direction === 'forward' ? 'right' : 'left';
  tick(state, { p1: { [key]: true } }); tick(state, {}); tick(state, { p1: { [key]: true } });
  let elapsed = 1; while (state.fighters.p1.phase === phase && elapsed < 40) { tick(state, {}); elapsed++; }
  assert.strictEqual(elapsed, duration); assert.strictEqual(state.fighters.p1.phase, 'idle');
}
function testDashDurations() { movementDuration('forward', 'dash', defaultTuning.lamuh_proto.dashDuration); movementDuration('back', 'backdash', defaultTuning.lamuh_proto.backdashDuration); }

function testHitstopFreezesEverything() {
  const state = hitWith({ down: true, heavy: true }, 104); const attacker = state.fighters.p1, defender = state.fighters.p2;
  const before = { ax: attacker.x, ay: attacker.y, avx: attacker.vx, avy: attacker.vy, at: attacker.phaseTick, dx: defender.x, dy: defender.y, dvx: defender.vx, dvy: defender.vy, dt: defender.phaseTick, hitstop: defender.hitstop };
  tick(state, {});
  assert.deepStrictEqual({ ax: attacker.x, ay: attacker.y, avx: attacker.vx, avy: attacker.vy, at: attacker.phaseTick, dx: defender.x, dy: defender.y, dvx: defender.vx, dvy: defender.vy, dt: defender.phaseTick }, { ax: before.ax, ay: before.ay, avx: before.avx, avy: before.avy, at: before.at, dx: before.dx, dy: before.dy, dvx: before.dvx, dvy: before.dvy, dt: before.dt });
  assert.strictEqual(defender.hitstop, before.hitstop - 1);
}

function testBufferedInputDuringHitstop() {
  const state = hitWith({ light: true }, 105); assert.ok(state.fighters.p1.hitstop > 0);
  tick(state, { p1: { medium: true } });
  advanceUntil(state, (s) => s.fighters.p1.currentAttack === 'standing_medium', 20);
  assert.strictEqual(state.fighters.p1.currentAttack, 'standing_medium');
}

function testComboResetAndFreshScaling() {
  const state = hitWith({ light: true }, 106); assert.strictEqual(state.fighters.p1.comboCount, 1);
  const resetTicks = advanceUntil(state, (s) => s.fighters.p1.comboCount === 0, 180);
  assert.ok(resetTicks < 180); assert.strictEqual(state.fighters.p1.damageScaling, 1); assert.strictEqual(state.fighters.p1.comboDamage, 0);
  close(state); Object.assign(state.fighters.p2, { vx: 0, vy: 0, y: 0, grounded: true, phase: 'idle', hitstun: 0, blockstun: 0, knockdownTicks: 0, getupTicks: 0 });
  tick(state, { p1: { light: true } }); advanceUntil(state, (s) => s.fighters.p1.comboCount === 1);
  assert.strictEqual(state.fighters.p1.comboDamage, 30); assert.strictEqual(state.fighters.p1.damageScaling, 0.92);
}

function testRequiredChainsConnect() {
  const standing = runChain({ light: true }, { medium: true }, { heavy: true });
  const low = runChain({ down: true, light: true }, { down: true, medium: true }, { down: true, heavy: true }, true);
  const mixed = runChain({ light: true }, { down: true, medium: true }, { down: true, heavy: true }, true);
  for (const state of [standing, low, mixed]) { assert.strictEqual(state.fighters.p1.comboCount, 3); assert.ok(state.fighters.p2.health < 900); assertInsideBounds(state); }
}

function testWideLowAndMixedChainsWhiffFromReachWhileDefenderIsStunned() {
  for (const first of [{ down: true, light: true }, { light: true }]) {
    const state = createMatch(141, { p1X: -72, p2X: 30 });
    const attacker = state.fighters.p1, defender = state.fighters.p2;
    tick(state, { p1: first });
    advanceUntil(state, () => attacker.comboCount === 1);
    tick(state, { p1: { down: true, medium: true } });
    advanceUntil(state, () => attacker.comboCount === 2, 90, () => ({ p1: { down: true } }));
    tick(state, { p1: { down: true, heavy: true } });
    advanceUntil(state, () => attacker.currentAttack === 'crouching_heavy', 20, () => ({ p1: { down: true } }));
    assert.strictEqual(attacker.phaseTick, 1, 'The buffered Heavy must start its complete authored timeline');
    const contact = defaultTuning.attacks.crouching_heavy.hitboxes[0];
    advanceUntil(state, () => attacker.phaseTick === contact.start, 20, () => ({ p1: { down: true } }));
    assert.ok(defender.hitstun > 0, 'The miss must not be explained by expired stun');
    assert.strictEqual(defender.hitCountTaken, 2);
    const contactTop = attacker.y + contact.rect.y;
    const contactBottom = contactTop + contact.rect.h;
    const targetLanes = fighterDefinitions[defender.kind].standingHurtboxes.filter((box) =>
      contactTop < defender.y + box.y + box.h && contactBottom > defender.y + box.y);
    assert.ok(targetLanes.length > 0, 'Heavy and defender must share a vertical collision lane');
    const rightEdge = attacker.x + contact.rect.x + contact.rect.w;
    const defenderLeft = Math.min(...targetLanes.map((box) => defender.x + box.x));
    assert.ok(rightEdge < defenderLeft, 'The full-startup launcher must miss because knockback placed the defender beyond reach');
    while (attacker.phaseTick <= contact.end) {
      tick(state, { p1: { down: true } });
      assert.strictEqual(defender.hitCountTaken, 2, 'No late active frame may invent a third hit across the gap');
    }
  }
}

function testDisallowedChainRemainsDisallowed() {
  const state = createMatch(107); close(state); tick(state, { p1: { heavy: true } }); tick(state, {}); tick(state, { p1: { light: true } });
  assert.strictEqual(state.fighters.p1.currentAttack, 'standing_heavy');
}

function testBlockingRejectedDuringHitstun() {
  const state = hitWith({ light: true }, 108); const firstHealth = state.fighters.p2.health;
  tick(state, { p1: { medium: true }, p2: { block: true } });
  advanceUntil(state, (s) => s.fighters.p1.comboCount === 2, 60, () => ({ p2: { block: true } }));
  assert.ok(state.fighters.p2.health < firstHealth); assert.strictEqual(state.fighters.p2.blockstun, 0); assert.strictEqual(state.fighters.p2.blocking, false);
}

function testSimultaneousLightsTrade() {
  const state = createMatch(109); state.fighters.p1.x = -50; state.fighters.p2.x = 50;
  tick(state, { p1: { light: true }, p2: { light: true } });
  advanceUntil(state, (s) => s.fighters.p1.health < 1000 && s.fighters.p2.health < 1000, 20);
  assert.strictEqual(state.fighters.p1.health, 970); assert.strictEqual(state.fighters.p2.health, 970);
}

function testFighterOrderIndependence() {
  const normal = createMatch(110), reversed = createMatch(110); for (const state of [normal, reversed]) { state.fighters.p1.x = -50; state.fighters.p2.x = 50; }
  const frames = [{ p1: { light: true }, p2: { light: true } }, {}, {}, {}, {}, {}, {}];
  for (const frame of frames) { tickWithFighterOrder(normal, frame, ['p1', 'p2']); tickWithFighterOrder(reversed, frame, ['p2', 'p1']); }
  assert.deepStrictEqual(reversed, normal);
}

function testLegalStageBounds() {
  const state = runChain({ light: true }, { medium: true }, { heavy: true }); for (let i = 0; i < 120; i++) { tick(state, {}); assertInsideBounds(state); }
}

function testControlsHaveNoCombatDebugDuplicates() {
  const combatCodes = new Set(Object.entries(keyboardMapping).filter(([action]) => action !== 'pause').flatMap(([, codes]) => [...codes]));
  for (const [action, code] of Object.entries(debugKeyboardMapping)) { if (action !== 'pause') assert.ok(!combatCodes.has(code), `${code} duplicates combat and debug actions`); }
  assert.deepStrictEqual(keyboardMapping.block, ['KeyO']); assert.strictEqual(debugKeyboardMapping.pause, 'Escape'); assert.strictEqual(debugKeyboardMapping.overlay, 'F1');
  assert.strictEqual(reservedCombatActions.special, 'U alone / no action; U+K / Neutral Medium control strike; S+U+J / Down Light Stamped Shaft Check V3; S+U+K / Down Medium Crossdraw Reprisal V6 two-hit process; S+U+L / Down Heavy Grounded Verdict two-hit process; W+U+K / Up Medium rising scythe hook; D+U+J / Forward Light V3; D+U+K / Forward Medium V3 two-hit process; D+U+L / Forward Heavy V3; W+L / Grave Furrow V7; U+L / airborne ender; U+I Command Grab'); assert.strictEqual(reservedCombatActions.romanCancel, 'H / active after a connected or blocked attack'); assert.strictEqual(reservedCombatActions.throw, 'I / universal throw; hold back for back throw; U+I Command Grab'); assert.strictEqual(reservedCombatActions.burst, 'P / active while P1 is in hitstun; B queues dummy Burst');
}

function testBrowserSmokeUsesCrossPlatformNodeSpawn() {
  const source = fs.readFileSync(path.join(__dirname, '..', 'scripts', 'browser_smoke.js'), 'utf8');
  assert.ok(source.includes('process.execPath')); assert.ok(source.includes("node_modules', 'vite', 'bin', 'vite.js")); assert.ok(!source.includes("'npm.cmd'"));
}

function testSnapshotReplayStateIncludesRepairFields() {
  const state = createMatch(111); tick(state, { p1: { up: true } }); const restored = restoreSnapshot(saveSnapshot(state)); assert.deepStrictEqual(restored, state); assert.ok(Array.isArray(restored.debugWarnings)); assert.strictEqual(restored.fighters.p1.comboTarget, null);
}

const tests = [testGroundedMediumAndHeavyStayOnFloor, testLauncherBoundedAndLands, testJumpStartupExactlyOnce, testDashDurations, testHitstopFreezesEverything, testBufferedInputDuringHitstop, testComboResetAndFreshScaling, testRequiredChainsConnect, testWideLowAndMixedChainsWhiffFromReachWhileDefenderIsStunned, testDisallowedChainRemainsDisallowed, testBlockingRejectedDuringHitstun, testSimultaneousLightsTrade, testFighterOrderIndependence, testLegalStageBounds, testControlsHaveNoCombatDebugDuplicates, testBrowserSmokeUsesCrossPlatformNodeSpawn, testSnapshotReplayStateIncludesRepairFields];
for (const test of tests) { test(); console.log(`PASS ${test.name}`); }
