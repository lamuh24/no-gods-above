const assert = require('assert');
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const sim = require('../dist/sandbox/swahiliSandboxSimulation');
const config = require('../dist/sandbox/sandboxConfig');
const review = require('../dist/sandbox/jumpFallLandingV1');

const REPO_ROOT = path.resolve(__dirname, '..', '..', '..');
const SOURCE_DIR = path.join(REPO_ROOT, 'tools', 'nga-forge', 'production', 'characters', 'swahili', 'source-frames', 'candidates', 'animation-coverage-completion-v1', 'jump-fall-landing-key-poses-v1');
const EXPECTED_HASHES = {
  '01_jump_anticipation.png': '22D7B448AB5F9EED95D85FE5B39BD5C51481BDE4F48080E02B8A410D9B33DD79',
  '02_takeoff.png': '49FA55DB968FEAAA263768FE97243313871C9EABEE764CCE9CD6D87F07696CEF',
  '03_rising_jump.png': 'D051A2377D59A3EBC2B225A00212D5E998AC4F6ED4BED67DBE9EA60E38EB04E8',
  '04_jump_apex.png': '7B5850C074D6209DCE4DF3DA1BF580F3FFE2BC4BFE019272190ECDB46C362A4B',
  '05_falling.png': 'A159E1BE748E1D677D06D99CC64524B02952F3E7E4F08A10E486616E69334018',
  '06_soft_landing.png': '3BB12FF9626C293C90B3014D48FF74C94034C6E25AA71530E091F50A48A44D39',
  '07_attack_landing_recovery.png': '77B10A87B117A38BCB82C9EC1F0F9423676150A075ABAAE3E46EE6D0B0FEAF32',
  '08_hard_landing_compatibility.png': 'E28294F729E88D511A74870B87F6455183EA6C44E92BBE3371778FBA16361208'
};

function run(name, test) { test(); console.log(`PASS ${name}`); }
function sha256(file) { return crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex').toUpperCase(); }
function runJump(mode, mirrored = false) {
  const state = sim.createSwahiliSandbox();
  if (mirrored) sim.setupSandboxScenario(state, 'mirrored_facing');
  sim.setJumpLandingReviewMode(state, mode);
  sim.tickSwahiliSandbox(state, { up: true });
  const seen = [];
  let previous = null;
  for (let guard = 0; guard < 100 && state.jumpFallLandingReview.active; guard++) {
    const animation = sim.selectSandboxAnimation(state.fighters.p1);
    if (animation.sourceId !== previous) seen.push(animation.sourceId);
    previous = animation.sourceId;
    sim.tickSwahiliSandbox(state, {});
  }
  return { state, seen };
}

run('all eight exact source candidates retain their approved candidate hashes', () => {
  for (const [file, expected] of Object.entries(EXPECTED_HASHES)) assert.strictEqual(sha256(path.join(SOURCE_DIR, file)), expected, `${file} pixel hash changed`);
});

run('soft jump exposes anticipation, takeoff, rise, apex, fall, and soft landing in order', () => {
  const { state, seen } = runJump('soft');
  assert.deepStrictEqual(seen, [
    'jump_v1_anticipation',
    'jump_v1_takeoff',
    'jump_v1_rising',
    'jump_v1_apex',
    'jump_v1_falling',
    'jump_v1_soft_landing'
  ]);
  assert.strictEqual(state.jumpFallLandingReview.result, 'complete');
  assert.strictEqual(state.fighters.p1.state, 'idle');
  assert.strictEqual(state.fighters.p1.y, config.SANDBOX_TUNING.stage.groundY);
  assert.strictEqual(state.jumpFallLandingReview.peakY, -93.00000000000003);
  assert.strictEqual(state.jumpFallLandingReview.airborneTicks, 30);
  assert.strictEqual(state.jumpFallLandingReview.gameplayValues, 'EXISTING_SANDBOX_JUMP_PHYSICS_UNCHANGED');
});

run('landing review branches expose the seventh and eighth candidates without changing the airborne trajectory', () => {
  const attack = runJump('attack');
  const hard = runJump('hard');
  assert.strictEqual(attack.seen.at(-1), 'jump_v1_attack_landing_recovery');
  assert.strictEqual(hard.seen.at(-1), 'jump_v1_hard_landing_compatibility');
  assert.strictEqual(attack.state.jumpFallLandingReview.peakY, hard.state.jumpFallLandingReview.peakY);
  assert.strictEqual(attack.state.jumpFallLandingReview.airborneTicks, hard.state.jumpFallLandingReview.airborneTicks);
  assert.strictEqual(attack.state.jumpFallLandingReview.landingTick, hard.state.jumpFallLandingReview.landingTick);
});

run('authored P1 and runtime-mirrored facing select the same single-source frames', () => {
  const authored = runJump('soft');
  const mirrored = runJump('soft', true);
  assert.deepStrictEqual(mirrored.seen, authored.seen);
  assert.strictEqual(mirrored.state.jumpFallLandingReview.startingFacing, -1);
  assert.strictEqual(review.JUMP_FALL_LANDING_V1_REVIEW.productionRoster, false);
  assert.strictEqual(review.JUMP_FALL_LANDING_V1_REVIEW.deployable, false);
  assert.strictEqual(review.JUMP_FALL_LANDING_V1_REVIEW.connectorsAuthorized, false);
});

run('jump is no longer reported missing while unrelated missing coverage remains explicit', () => {
  assert.strictEqual(config.MISSING_ANIMATION_STATES.includes('jump'), false);
  assert.strictEqual(config.MISSING_ANIMATION_STATES.filter((entry) => entry.startsWith('walk_backward:')).length, 3);
});

console.log('Swahili Jump/Fall/Landing V1 live review tests passed: exact candidate pixels, simulation-owned trajectory, all landing branches, mirrored playback, candidate-only isolation.');
