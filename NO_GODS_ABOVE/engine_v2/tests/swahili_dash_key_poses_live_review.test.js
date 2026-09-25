const assert = require('assert');
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const sim = require('../dist/sandbox/swahiliSandboxSimulation');
const dash = require('../dist/sandbox/dashRepairV2');

const ROOT = path.resolve(__dirname, '..', '..', '..');
const CANDIDATE_ROOT = path.join(ROOT, 'tools', 'nga-forge', 'production', 'characters', 'swahili', 'source-frames', 'candidates', 'locomotion-completion-v1', 'dash-repair-v2');
const hash = (file) => crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex').toUpperCase();
const run = (name, test) => { test(); console.log(`PASS ${name}`); };
const tickUntilDashComplete = (state, frames = []) => {
  while (state.dashReview.active && state.tick < 120) {
    frames.push(sim.selectSandboxAnimation(state.fighters.p1).sourceId);
    sim.tickSwahiliSandbox(state, {});
  }
};

run('all twelve repaired dash candidate frames remain byte-identical to recorded review hashes', () => {
  for (const direction of ['forward', 'backward']) {
    assert.strictEqual(dash.DASH_REPAIR_V2_FRAMES[direction].length, 6);
    for (const frame of dash.DASH_REPAIR_V2_FRAMES[direction]) {
      const folder = direction === 'forward' ? 'dash-forward' : 'dash-backward-recoil-v3';
      const file = path.join(CANDIDATE_ROOT, folder, `${String(frame.index).padStart(2, '0')}_${frame.sourceId}.png`);
      assert.ok(fs.existsSync(file), file);
      assert.strictEqual(hash(file), frame.candidateSha256, frame.sourceId);
    }
  }
});

run('timing-only polish shortens the dash while preserving all six artwork poses', () => {
  assert.strictEqual(dash.dashTotalTicks('forward'), 44);
  assert.strictEqual(dash.dashTotalTicks('backward'), 50);
  assert.deepStrictEqual(dash.DASH_REPAIR_V2_FRAMES.forward.map((frame) => frame.exposureTicks), [8, 6, 5, 7, 7, 11]);
  assert.deepStrictEqual(dash.DASH_REPAIR_V2_FRAMES.backward.map((frame) => frame.exposureTicks), [9, 7, 6, 8, 8, 12]);
  assert.strictEqual(dash.DASH_REPAIR_V2_REVIEW.timingChangeOnly, true);
  assert.strictEqual(dash.DASH_REPAIR_V2_REVIEW.artworkFrameCountUnchanged, true);
  assert.strictEqual(dash.DASH_REPAIR_V2_REVIEW.connectorFrameAdded, false);
  assert.ok(dash.dashTotalTicks('forward') < dash.DASH_REPAIR_V2_REVIEW.predecessorTiming.forward.totalTicks);
  assert.ok(dash.dashTotalTicks('backward') < dash.DASH_REPAIR_V2_REVIEW.predecessorTiming.backward.totalTicks);
});

run('simulation-owned dash curves are non-linear and preserve intended travel distance', () => {
  for (const direction of ['forward', 'backward']) {
    const totalTicks = dash.dashTotalTicks(direction);
    const deltas = Array.from({ length: totalTicks }, (_, tick) => dash.dashDisplacementPerTick(direction, tick));
    assert.ok(new Set(deltas.map((value) => value.toFixed(6))).size > 8, `${direction} fell back to linear translation`);
    assert.ok(deltas[0] < Math.max(...deltas) * 0.02, `${direction} lacks a loaded start`);
    assert.ok(Math.max(...deltas) > deltas.at(-2), `${direction} lacks acceleration and braking`);
    const intended = dash.DASH_REPAIR_V2_REVIEW[direction].intendedDistance;
    assert.ok(Math.abs(dash.dashCurveDistance(direction) - intended) < 1e-9);
  }
});

run('forward and backward dash play all six repaired poses and move in opposite directions while facing the opponent', () => {
  for (const [direction, input, expectedSign] of [
    ['forward', { right: true, dash: true }, 1],
    ['backward', { left: true, dash: true }, -1]
  ]) {
    const state = sim.createSwahiliSandbox();
    state.fighters.p1.x = -160;
    state.fighters.p2.x = 360;
    sim.tickSwahiliSandbox(state, input);
    const startX = state.dashReview.startX;
    const frames = [];
    tickUntilDashComplete(state, frames);
    assert.deepStrictEqual([...new Set(frames)], dash.DASH_REPAIR_V2_FRAMES[direction].map((frame) => frame.sourceId));
    assert.strictEqual(Math.sign(state.fighters.p1.x - startX), expectedSign);
    assert.strictEqual(state.fighters.p1.facing, 1, 'retreating dash must not turn around');
    assert.ok(Math.abs(state.dashReview.actualDistance - state.dashReview.intendedDistance) < 1e-6);
    assert.strictEqual(state.fighters.p1.state, 'idle');
  }
});

run('mirrored forward and backward dash preserve direction relative to facing', () => {
  for (const [direction, input, expectedSign] of [
    ['forward', { left: true, dash: true }, -1],
    ['backward', { right: true, dash: true }, 1]
  ]) {
    const state = sim.createSwahiliSandbox();
    state.fighters.p1.x = 160;
    state.fighters.p2.x = -360;
    sim.tickSwahiliSandbox(state, {});
    assert.strictEqual(state.fighters.p1.facing, -1);
    sim.tickSwahiliSandbox(state, input);
    const startX = state.dashReview.startX;
    tickUntilDashComplete(state);
    assert.strictEqual(Math.sign(state.fighters.p1.x - startX), expectedSign);
    assert.strictEqual(state.dashReview.direction, direction);
  }
});

run('corner or pushbox collision clips travel without exceeding stage bounds', () => {
  const state = sim.createSwahiliSandbox();
  state.fighters.p1.x = 350;
  state.fighters.p2.x = 420;
  sim.tickSwahiliSandbox(state, {});
  sim.tickSwahiliSandbox(state, { right: true, dash: true });
  tickUntilDashComplete(state);
  assert.ok(state.fighters.p1.x <= state.stage.right);
  assert.strictEqual(state.dashReview.clippedByStageOrPushbox, true);
  assert.ok(state.dashReview.actualDistance < state.dashReview.intendedDistance);
});

run('dash replay is deterministic and cannot retrigger while active', () => {
  const execute = () => {
    const state = sim.createSwahiliSandbox(20260719);
    state.fighters.p2.x = 400;
    sim.tickSwahiliSandbox(state, { right: true, dash: true });
    for (let tick = 0; tick < 12; tick++) sim.tickSwahiliSandbox(state, { right: true, dash: true });
    assert.ok(state.dashReview.simulationTick > 0, 'dash should continue instead of restarting');
    tickUntilDashComplete(state);
    return sim.sandboxChecksum(state);
  };
  assert.strictEqual(execute(), execute());
});

run('backdash uses recoil-retreat roles with only compact airborne poses', () => {
  assert.deepStrictEqual(
    dash.DASH_REPAIR_V2_FRAMES.backward.map((frame) => frame.role),
    ['load_low', 'push_away', 'compact_retreat_hop_slide', 'max_retreat', 'controlled_landing', 'guarded_recovery']
  );
  assert.deepStrictEqual(
    dash.DASH_REPAIR_V2_FRAMES.backward.filter((frame) => frame.supportFoot === 'airborne_none').map((frame) => frame.index),
    [3, 4]
  );
});

console.log('Swahili dash timing-polish review passed: exact 12 candidate pixels, faster six-pose timing, compact recoil backdash roles, non-linear deterministic travel, mirrored parity, corner clipping, and replay stability.');
