const assert = require('assert');
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const sim = require('../dist/sandbox/swahiliSandboxSimulation');
const config = require('../dist/sandbox/sandboxConfig');
const walk = require('../dist/sandbox/forwardWalkV2Review');

const ROOT = path.resolve(__dirname, '..', '..', '..');
const CANDIDATE_ROOT = path.join(ROOT, 'tools', 'nga-forge', 'production', 'characters', 'swahili', 'source-frames', 'candidates', 'locomotion-completion-v1', 'walk-forward-v2');
const hash = (file) => crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex').toUpperCase();
const advance = (state, input, count) => { for (let tick = 0; tick < count; tick++) sim.tickSwahiliSandbox(state, input); return state; };
const run = (name, test) => { test(); console.log(`PASS ${name}`); };

run('exact eight Forward Walk V2 candidate frames and hashes are preserved', () => {
  assert.strictEqual(config.FORWARD_WALK_SLOTS.length, 8);
  assert.strictEqual(walk.FORWARD_WALK_V2_SLOT_REVIEW_METADATA.length, 8);
  for (const slot of walk.FORWARD_WALK_V2_SLOT_REVIEW_METADATA) {
    const file = path.join(CANDIDATE_ROOT, `${String(slot.ordinal).padStart(2, '0')}_${slot.sourceId}.png`);
    assert.ok(fs.existsSync(file), file);
    assert.strictEqual(hash(file), slot.candidateSha256);
  }
});

run('all three required timing profiles have exact deterministic cycle lengths', () => {
  const expected = {
    candidate_current_58_ticks: [58, [7, 7, 7, 8, 7, 7, 7, 8]],
    even_40_ticks: [40, [5, 5, 5, 5, 5, 5, 5, 5]],
    contact_weighted_40_ticks: [40, [6, 5, 4, 5, 6, 5, 4, 5]]
  };
  for (const [id, [ticks, exposures]] of Object.entries(expected)) {
    const profile = walk.FORWARD_WALK_V2_TIMING_PROFILES[id];
    assert.strictEqual(profile.cycleTicks, ticks);
    assert.deepStrictEqual([...profile.frameTicks], exposures);
    assert.strictEqual(profile.frameTicks.reduce((a, b) => a + b, 0), ticks);
  }
});

run('contact-aware displacement is non-linear and preserves gameplay-authored cycle distance', () => {
  for (const id of Object.keys(walk.FORWARD_WALK_V2_TIMING_PROFILES)) {
    const profile = walk.FORWARD_WALK_V2_TIMING_PROFILES[id];
    const distance = walk.forwardWalkV2CycleDistance(id, config.SANDBOX_TUNING.movement.walkForwardPerTick);
    assert.ok(Math.abs(distance - profile.cycleTicks * config.SANDBOX_TUNING.movement.walkForwardPerTick) < 1e-9);
    const deltas = Array.from({ length: profile.cycleTicks }, (_, tick) => walk.forwardWalkV2DisplacementPerTick(tick, id, config.SANDBOX_TUNING.movement.walkForwardPerTick));
    assert.ok(new Set(deltas.map((value) => value.toFixed(9))).size > 1, `${id} fell back to linear translation`);
  }
  const profileId = 'contact_weighted_40_ticks';
  const profile = walk.FORWARD_WALK_V2_TIMING_PROFILES[profileId];
  const deltas = Array.from({ length: profile.cycleTicks }, (_, tick) => walk.forwardWalkV2DisplacementPerTick(tick, profileId, 3.6));
  const deltaChanges = deltas.map((value, tick) => Math.abs(value - deltas[(tick + profile.cycleTicks - 1) % profile.cycleTicks]));
  const displacementByFrame = Array(8).fill(0);
  deltas.forEach((delta, tick) => { displacementByFrame[walk.forwardWalkV2FrameAtTick(tick, profileId).frameIndex] += delta; });
  const contactAndDown = displacementByFrame[0] + displacementByFrame[1] + displacementByFrame[4] + displacementByFrame[5];
  const passingAndSwing = displacementByFrame[2] + displacementByFrame[3] + displacementByFrame[6] + displacementByFrame[7];
  assert.strictEqual(walk.FORWARD_WALK_V2_ROOT_CURVE_VERSION, 'contact_aware_smoothstep_v2');
  assert.ok(Math.max(...deltaChanges) < 1.5, 'root velocity must not jump at frame boundaries');
  assert.ok(Math.max(...deltas) / Math.min(...deltas) < 3, 'root curve must not crawl and then lunge');
  assert.ok(passingAndSwing > contactAndDown, 'passing and swing phases must still carry more displacement than contact and down');
});

run('Forward Walk V2 diagnostics expose frame, feet, root, displacement, transition, and skating', () => {
  const state = sim.createSwahiliSandbox();
  state.fighters.p2.x = 400;
  sim.setForwardWalkV2TimingProfile(state, 'contact_weighted_40_ticks');
  advance(state, { right: true }, 40);
  const diagnostic = state.forwardWalkV2Diagnostic;
  assert.strictEqual(diagnostic.timingProfileId, 'contact_weighted_40_ticks');
  assert.strictEqual(diagnostic.motionCurveVersion, 'contact_aware_smoothstep_v2');
  assert.ok(diagnostic.artworkFrame >= 1 && diagnostic.artworkFrame <= 8);
  assert.match(diagnostic.gaitRole, /(contact|compression|passing|swing|return)/);
  assert.match(diagnostic.supportFoot, /screen_/);
  assert.match(diagnostic.swingFoot, /screen_/);
  assert.strictEqual(typeof diagnostic.fighterRoot, 'number');
  assert.strictEqual(typeof diagnostic.plantedFootWorldPosition, 'number');
  assert.ok(diagnostic.accumulatedDisplacement > 0);
  assert.ok(diagnostic.footSkateSamples > 0);
  assert.match(diagnostic.incompleteBackwardWalkWarning, /three|first_passing/);
});

run('walk transitions are sandbox-only, rooted, and use approved immutable references', () => {
  const expectations = {
    walk_v2_idle_to_forward: 'walk_forward',
    walk_v2_forward_to_idle: 'idle',
    walk_v2_to_standing_heavy: 'standing_heavy',
    walk_v2_to_universal_grab: 'universal_grab_review',
    walk_v2_to_command_grab: 'command_grab_review',
    walk_v2_to_block: 'standing_block',
    walk_v2_to_crouch: 'crouch'
  };
  for (const [scenario, expectedState] of Object.entries(expectations)) {
    const state = sim.createSwahiliSandbox();
    sim.setupSandboxScenario(state, scenario);
    assert.strictEqual(state.fighters.p1.state, expectedState, scenario);
    assert.ok(Math.abs(state.forwardWalkV2Diagnostic.perTickDisplacement) < 20, `${scenario} root popped`);
  }
  const command = sim.createSwahiliSandbox();
  sim.setupSandboxScenario(command, 'walk_v2_to_command_grab');
  assert.strictEqual(sim.selectSandboxAnimation(command.fighters.p1).sourceId, 'command_grab_01_mounted_startup');
  assert.strictEqual(sim.selectSandboxAnimation(command.fighters.p1).approval, 'APPROVED_AS_COMMAND_GRAB_MOTION_V1_IMMUTABLE_REFERENCE');
});

run('rollback checksum remains deterministic under timing changes and repeated start-stop input', () => {
  const inputs = [
    ...Array.from({ length: 8 }, () => ({ right: true })),
    {}, {}, {},
    ...Array.from({ length: 8 }, () => ({ right: true })),
    {},
    { block: true },
    {}
  ];
  const replay = () => {
    const state = sim.createSwahiliSandbox(20260718);
    state.fighters.p2.x = 400;
    sim.setForwardWalkV2TimingProfile(state, 'contact_weighted_40_ticks');
    for (const input of inputs) sim.tickSwahiliSandbox(state, input);
    return sim.sandboxChecksum(state);
  };
  assert.strictEqual(replay(), replay());
});

console.log('Forward Walk V2 live-review tests passed: exact candidate art, three timings, contact-aware movement, diagnostics, transitions, and deterministic replay.');
