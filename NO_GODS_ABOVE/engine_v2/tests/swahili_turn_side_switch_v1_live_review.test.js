const assert = require('assert');
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const sim = require('../dist/sandbox/swahiliSandboxSimulation');
const turn = require('../dist/sandbox/turnSideSwitchV1');

const REPO_ROOT = path.resolve(__dirname, '..', '..', '..');
const SOURCE_DIR = path.join(REPO_ROOT, 'tools', 'nga-forge', 'production', 'characters', 'swahili', 'source-frames', 'candidates', 'animation-coverage-completion-v1', 'turn-side-switch-compatibility-v1');
const SOURCE_FILE = path.join(SOURCE_DIR, '01_turn_pivot_bridge.png');
const EXPECTED_HASH = '3E93AB973437B3DB70F1A488E561795B10E7331B0C301E0682CC238CAA6D8CDE';

function run(name, test) { test(); console.log(`PASS ${name}`); }
function sha256(file) { return crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex').toUpperCase(); }
function filesUnder(root) {
  return fs.readdirSync(root, { withFileTypes: true }).flatMap((entry) => {
    const target = path.join(root, entry.name);
    return entry.isDirectory() ? filesUnder(target) : [target];
  });
}
function playTurn(mirrored = false) {
  const state = sim.createSwahiliSandbox(20260720);
  if (mirrored) sim.setupSandboxScenario(state, 'mirrored_facing');
  const rootX = state.fighters.p1.x;
  const startingFacing = state.fighters.p1.facing;
  sim.tickSwahiliSandbox(state, { command: 'play_turn_side_switch' });
  const samples = [];
  while (state.turnSideSwitchReview.active && samples.length < 30) {
    const animation = sim.selectSandboxAnimation(state.fighters.p1);
    samples.push({ sourceId: animation.sourceId, role: animation.role, facing: state.fighters.p1.facing, rootX: state.fighters.p1.x, opponentX: state.fighters.p2.x });
    sim.tickSwahiliSandbox(state, {});
  }
  return { state, samples, rootX, startingFacing };
}

run('the exact single authored pivot candidate retains its recorded hash and has no mirrored source duplicate', () => {
  assert.strictEqual(sha256(SOURCE_FILE), EXPECTED_HASH);
  const mirroredSources = filesUnder(SOURCE_DIR).filter((file) => /mirror/i.test(path.basename(file)));
  assert.deepStrictEqual(mirroredSources, []);
  assert.strictEqual(turn.TURN_SIDE_SWITCH_V1_REVIEW.authoredSourceFrames, 1);
  assert.strictEqual(turn.TURN_SIDE_SWITCH_V1_REVIEW.mirroredSourceFiles, 0);
});

run('the four-phase review spine uses 3-2-2-5 timing and one simulation-owned facing change', () => {
  const { state, samples, rootX, startingFacing } = playTurn(false);
  assert.strictEqual(samples.length, 12);
  assert.deepStrictEqual(turn.TURN_SIDE_SWITCH_V1_EXPOSURES.map((exposure) => exposure.exposureTicks), [3, 2, 2, 5]);
  assert.deepStrictEqual(samples.map((sample) => sample.role), [
    ...Array(3).fill('current_facing_idle_departure'),
    ...Array(2).fill('planted_pivot_entry'),
    ...Array(2).fill('planted_pivot_exit_runtime_mirrored'),
    ...Array(5).fill('new_facing_idle_settle')
  ]);
  assert.ok(samples.slice(3, 7).every((sample) => sample.sourceId === 'turn_pivot_bridge_v1'));
  assert.strictEqual(state.turnSideSwitchReview.facingSwapCount, 1);
  assert.strictEqual(state.fighters.p1.facing, -startingFacing);
  assert.strictEqual(state.fighters.p1.x, rootX);
  assert.strictEqual(state.turnSideSwitchReview.rootDisplacement, 0);
  assert.strictEqual(state.fighters.p1.state, 'idle');
});

run('the sandbox dummy crosses monotonically while Swahili stays planted', () => {
  const { state, samples, rootX, startingFacing } = playTurn(false);
  const opponentTravel = samples.map((sample) => sample.opponentX);
  for (let index = 1; index < opponentTravel.length; index++) assert.ok(opponentTravel[index] <= opponentTravel[index - 1] + 1e-9);
  assert.ok(samples.every((sample) => sample.rootX === rootX));
  assert.ok((state.fighters.p2.x - rootX) * startingFacing < 0, 'opponent must finish on the opposite side');
  sim.tickSwahiliSandbox(state, {});
  assert.strictEqual(state.fighters.p1.facing, -startingFacing, 'new facing must remain stable after recovery');
});

run('authored and mirrored playbacks preserve identical roles, timing, and zero-root behavior', () => {
  const authored = playTurn(false);
  const mirrored = playTurn(true);
  assert.deepStrictEqual(mirrored.samples.map((sample) => sample.role), authored.samples.map((sample) => sample.role));
  assert.strictEqual(authored.startingFacing, 1);
  assert.strictEqual(mirrored.startingFacing, -1);
  assert.strictEqual(authored.state.turnSideSwitchReview.rootDisplacement, 0);
  assert.strictEqual(mirrored.state.turnSideSwitchReview.rootDisplacement, 0);
  assert.strictEqual(mirrored.state.turnSideSwitchReview.facingSwapCount, 1);
});

run('turn scenarios are available and deterministic without changing the legacy instant-side-switch command', () => {
  const authoredScenario = sim.createSwahiliSandbox();
  sim.setupSandboxScenario(authoredScenario, 'turn_side_switch_review');
  assert.strictEqual(authoredScenario.turnSideSwitchReview.active, true);
  const mirroredScenario = sim.createSwahiliSandbox();
  sim.setupSandboxScenario(mirroredScenario, 'turn_side_switch_mirrored');
  assert.strictEqual(mirroredScenario.turnSideSwitchReview.active, true);
  assert.strictEqual(mirroredScenario.turnSideSwitchReview.startingFacing, -1);

  const checksum = () => sim.sandboxChecksum(playTurn(false).state);
  assert.strictEqual(checksum(), checksum());

  const legacy = sim.createSwahiliSandbox();
  sim.tickSwahiliSandbox(legacy, { command: 'switch_sides' });
  assert.strictEqual(legacy.turnSideSwitchReview.active, false);
  assert.strictEqual(legacy.lastEvent.id, 'side_switch');
});

run('review remains isolated and non-deployable', () => {
  assert.strictEqual(turn.TURN_SIDE_SWITCH_V1_REVIEW.status, 'candidate-only');
  assert.strictEqual(turn.TURN_SIDE_SWITCH_V1_REVIEW.deployable, false);
  assert.strictEqual(turn.TURN_SIDE_SWITCH_V1_REVIEW.productionRoster, false);
  assert.strictEqual(turn.TURN_SIDE_SWITCH_V1_REVIEW.fighterRootDisplacement, 0);
  assert.strictEqual(turn.TURN_SIDE_SWITCH_V1_REVIEW.gameplayValues, 'TEMPORARY_SANDBOX_OPPONENT_CROSSING_NOT_PRODUCTION_GAMEPLAY');
});

console.log('Swahili Turn / Side-Switch V1 live review passed: exact candidate hash, 3-2-2-5 spine, one facing swap, fixed P1 root, sandbox-only opponent crossing, mirrored parity, deterministic replay, and candidate-only isolation.');
