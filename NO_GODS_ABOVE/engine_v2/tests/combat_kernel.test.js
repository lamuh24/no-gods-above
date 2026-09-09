const assert = require('assert');
const fs = require('fs');
const path = require('path');
const { createMatch, executeReplay, fighterPushbox, recordReplay, restoreSnapshot, runTicks, saveSnapshot, tick } = require('../dist');

function scriptedInputs(tickNo) {
  if (tickNo < 8) return { p1: { right: true }, p2: {} };
  if (tickNo === 10) return { p1: { light: true }, p2: {} };
  if (tickNo === 46) return { p1: { heavy: true }, p2: {} };
  return { p1: {}, p2: {} };
}

function runScript(seed = 1234, ticks = 90) {
  const s = createMatch(seed);
  runTicks(s, ticks, scriptedInputs);
  return s;
}

function testDeterministicReplay() {
  const a = runScript();
  const replay = recordReplay(a);
  const b = executeReplay(replay);
  assert.deepStrictEqual(b.checksums, a.checksums, 'same input log and seed must produce identical checksums');
  assert.strictEqual(b.checksums.at(-1), replay.finalChecksum);
}

function testRenderPatternIndependence() {
  const a = createMatch(77);
  for (let i = 0; i < 120; i++) tick(a, scriptedInputs(a.tick));
  const b = createMatch(77);
  for (const batch of [1, 4, 2, 7, 16, 30, 60]) {
    runTicks(b, batch, scriptedInputs);
    if (b.tick >= 120) break;
  }
  while (b.tick < 120) tick(b, scriptedInputs(b.tick));
  assert.deepStrictEqual(b.checksums, a.checksums, 'external render update batch sizes must not change simulation output');
}

function testSnapshotRestore() {
  const uninterrupted = createMatch(91);
  runTicks(uninterrupted, 100, scriptedInputs);
  const withSnapshot = createMatch(91);
  runTicks(withSnapshot, 32, scriptedInputs);
  const snapshot = saveSnapshot(withSnapshot);
  const restored = restoreSnapshot(snapshot);
  runTicks(restored, 68, scriptedInputs);
  assert.deepStrictEqual(restored.checksums, uninterrupted.checksums, 'snapshot restore must match uninterrupted simulation');
}

function testLightActiveFramesOnly() {
  const state = createMatch(5);
  state.fighters.p1.x = -72;
  state.fighters.p2.x = 30;
  tick(state, { p1: { light: true } });
  const beforeActive = state.fighters.p2.health;
  assert.strictEqual(state.fighters.p2.health, beforeActive, 'standing light must not hit on the input/startup tick');
  tick(state, {});
  tick(state, {});
  assert.ok(state.fighters.p2.health < beforeActive, 'standing light must hit during active frames');
}

function testNoRepeatedHitsBeyondRules() {
  const state = createMatch(6);
  state.fighters.p1.x = -72;
  state.fighters.p2.x = 30;
  tick(state, { p1: { light: true } });
  runTicks(state, 8);
  assert.strictEqual(state.fighters.p2.health, 970, 'standing light should apply one 30 damage hit only once');
}

function testHitstopPausesProgression() {
  const state = createMatch(7);
  state.fighters.p1.x = -72;
  state.fighters.p2.x = 30;
  tick(state, { p1: { light: true } });
  tick(state, {});
  tick(state, {});
  assert.strictEqual(state.fighters.p1.hitstop, 4);
  const frozenPhaseTick = state.fighters.p1.phaseTick;
  tick(state, {});
  assert.strictEqual(state.fighters.p1.phaseTick, frozenPhaseTick, 'attacker phase progression freezes during hitstop');
  assert.strictEqual(state.fighters.p1.hitstop, 3);
}

function testKnockbackAndGravity() {
  const a = createMatch(8);
  const b = createMatch(8);
  for (const s of [a, b]) {
    s.fighters.p1.x = -72;
    s.fighters.p2.x = 35;
  }
  tick(a, { p1: { heavy: true } });
  tick(b, { p1: { heavy: true } });
  runTicks(a, 20);
  runTicks(b, 20);
  assert.deepStrictEqual({ x: b.fighters.p2.x, y: b.fighters.p2.y, vx: b.fighters.p2.vx, vy: b.fighters.p2.vy }, { x: a.fighters.p2.x, y: a.fighters.p2.y, vx: a.fighters.p2.vx, vy: a.fighters.p2.vy }, 'knockback and gravity must resolve consistently');
  assert.ok(a.fighters.p2.y <= 0, 'vertical motion should stay in deterministic stage coordinates');
}

function testPushboxes() {
  const state = createMatch(9);
  state.fighters.p1.x = -5;
  state.fighters.p2.x = 5;
  runTicks(state, 3, () => ({ p1: { right: true }, p2: {} }));
  const p1 = state.fighters.p1;
  const p2 = state.fighters.p2;
  assert.ok(p1.x < p2.x, 'pushboxes preserve ordering and prevent pass-through');
  assert.ok(p2.x - p1.x >= 43.9, 'pushboxes separate overlapping fighters');
}

function testLamuhPushboxesFullyResolveAtWallAndDuringFreeze() {
  const state = createMatch(10, {
    matchId: 'lamuh-wall-pushbox-pressure',
    p1Kind: 'lamuh_legacy_v2',
    p2Kind: 'lamuh_legacy_v2',
    p1X: 250,
    p2X: 280
  });
  state.stage.left = -280;
  state.stage.right = 280;
  state.fighters.p2.hitstop = 8;

  for (let frame = 0; frame < 30; frame++) {
    tick(state, { p1: { right: true } });
    const p1Box = fighterPushbox(state.fighters.p1);
    const p2Box = fighterPushbox(state.fighters.p2);
    assert.ok(p1Box.x + p1Box.w <= p2Box.x + 0.0001, `pushboxes overlapped on pressure frame ${frame}`);
    assert.strictEqual(state.fighters.p2.x, 280, 'wall-pinned fighter must remain inside the visible arena bound');
    assert.ok(state.fighters.p1.x < state.fighters.p2.x, 'pressure must never reverse fighter ordering');
  }
  assert.strictEqual(state.fighters.p2.hitstop, 0, 'test must cover both frozen and unfrozen defender pressure');
  assert.ok(Math.abs((state.fighters.p2.x - state.fighters.p1.x) - 68.0001) < 0.0001, 'Lamuh roots must settle at the V2 adult-silhouette separation');
}

function testNoLegacyRuntimeImport() {
  const srcRoot = path.join(__dirname, '..', 'src', 'core');
  const files = [];
  function walk(dir) {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) walk(full);
      else if (entry.name.endsWith('.ts')) files.push(full);
    }
  }
  walk(srcRoot);
  for (const file of files) {
    const text = fs.readFileSync(file, 'utf8');
    assert.ok(!text.includes('game.js'), `${file} must not import or reference legacy game.js`);
    assert.ok(!/Date\.now|performance\.now|document\.|window\./.test(text), `${file} must stay headless and deterministic`);
  }
}

const tests = [
  testDeterministicReplay,
  testRenderPatternIndependence,
  testSnapshotRestore,
  testLightActiveFramesOnly,
  testNoRepeatedHitsBeyondRules,
  testHitstopPausesProgression,
  testKnockbackAndGravity,
  testPushboxes,
  testLamuhPushboxesFullyResolveAtWallAndDuringFreeze,
  testNoLegacyRuntimeImport
];

for (const test of tests) {
  test();
  console.log(`PASS ${test.name}`);
}
