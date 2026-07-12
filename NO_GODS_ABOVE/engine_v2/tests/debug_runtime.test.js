const assert = require('assert');
const fs = require('fs');
const path = require('path');
const { createMatch } = require('../dist');
const { DebugRuntime } = require('../dist/debug/debugRuntime');

const replay = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'replays', 'lamuh_light_opening.replay.json'), 'utf8'));

function checksumAfterReplay() {
  return new DebugRuntime({ replay }).runReplayToEnd(replay).checksums.at(-1);
}

function testDebugImportsSimulation() {
  const text = fs.readFileSync(path.join(__dirname, '..', 'src', 'debug', 'debugRuntime.ts'), 'utf8');
  assert.ok(text.includes('from "../core/engine"'), 'debug runtime must import the simulation engine');
  assert.ok(text.includes('tick(this.state'), 'debug runtime must use the shared tick path');
}

function testRenderCannotMutateStateByContract() {
  const text = fs.readFileSync(path.join(__dirname, '..', 'src', 'debug', 'debugRenderer.ts'), 'utf8');
  assert.ok(!/tick\(|createMatch\(|state\.[a-zA-Z0-9_]+\s*=|state\.fighters\.[a-z0-9_]+\.[a-zA-Z0-9_]+\s*=/.test(text), 'renderer must not advance or mutate authoritative combat state');
}

function testLiveAndReplayUseSameStepPath() {
  const text = fs.readFileSync(path.join(__dirname, '..', 'src', 'debug', 'debugRuntime.ts'), 'utf8');
  const tickCalls = [...text.matchAll(/tick\(this\.state/g)].length;
  assert.strictEqual(tickCalls, 1, 'live and replay modes should share a single tick(this.state) execution path');
}

function testReplayFinalChecksum() {
  assert.strictEqual(checksumAfterReplay(), replay.finalChecksum);
}

function testPausePreventsAdvancement() {
  const runtime = new DebugRuntime({ seed: 3 });
  runtime.setPaused(true);
  runtime.step({ p1: { right: true } });
  assert.strictEqual(runtime.state.tick, 0);
}

function testSingleFrameAdvance() {
  const runtime = new DebugRuntime({ seed: 3 });
  runtime.setPaused(true);
  runtime.frameAdvance({ p1: { right: true } });
  assert.strictEqual(runtime.state.tick, 1);
}

function testResetInitialState() {
  const runtime = new DebugRuntime({ seed: 3 });
  runtime.frameAdvance({ p1: { right: true } });
  runtime.reset();
  assert.deepStrictEqual(runtime.state, createMatch(3));
}

function testDebugIsolationFromLegacyRuntime() {
  for (const file of ['debugRuntime.ts', 'debugRenderer.ts', 'inputAdapter.ts', 'main.ts']) {
    const text = fs.readFileSync(path.join(__dirname, '..', 'src', 'debug', file), 'utf8');
    assert.ok(!text.includes('game.js'), `${file} must not import or reference legacy game.js`);
  }
}

for (const test of [testDebugImportsSimulation, testRenderCannotMutateStateByContract, testLiveAndReplayUseSameStepPath, testReplayFinalChecksum, testPausePreventsAdvancement, testSingleFrameAdvance, testResetInitialState, testDebugIsolationFromLegacyRuntime]) {
  test();
  console.log(`PASS ${test.name}`);
}
