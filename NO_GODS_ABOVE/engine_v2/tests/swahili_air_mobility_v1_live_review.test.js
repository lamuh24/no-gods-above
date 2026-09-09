const assert = require('assert');
const sim = require('../dist/sandbox/swahiliSandboxSimulation');
const review = require('../dist/sandbox/airMobilityV1');
const motion = require('../dist/sandbox/airDashMotionV1');

function run(name, test) { test(); console.log(`PASS ${name}`); }
function step(state, input = {}, ticks = 1) {
  for (let index = 0; index < ticks; index++) sim.tickSwahiliSandbox(state, index === 0 ? input : { ...input, command: undefined });
}
function finishAirDash(state) {
  for (let guard = 0; guard < 30 && state.airMobilityReview.airDashActive; guard++) step(state);
}
function captureAirDashArtwork(state) {
  const sourceIds = [];
  for (let tick = 0; tick < review.AIR_MOBILITY_V1_REVIEW.airDashTicks; tick++) {
    sourceIds.push(sim.selectSandboxAnimation(state.fighters.p1, state).sourceId);
    if (tick + 1 < review.AIR_MOBILITY_V1_REVIEW.airDashTicks) step(state);
  }
  return sourceIds;
}
function captureAirDashSelections(state) {
  const selections = [];
  for (let tick = 0; tick < review.AIR_MOBILITY_V1_REVIEW.airDashTicks; tick++) {
    selections.push(sim.selectSandboxAnimation(state.fighters.p1, state));
    if (tick + 1 < review.AIR_MOBILITY_V1_REVIEW.airDashTicks) step(state);
  }
  return selections;
}

run('double jump is available exactly once per airtime', () => {
  const state = sim.createSwahiliSandbox();
  sim.setupSandboxScenario(state, 'air_mobility_double_jump_review');
  assert.strictEqual(state.airMobilityReview.jumpsUsed, 2);
  assert.strictEqual(state.airMobilityReview.doubleJumpTriggered, true);
  const velocityAfterDoubleJump = state.fighters.p1.vy;
  step(state, {});
  step(state, { up: true });
  assert.strictEqual(state.airMobilityReview.jumpsUsed, 2);
  assert.notStrictEqual(state.fighters.p1.vy, review.AIR_MOBILITY_V1_REVIEW.doubleJumpVelocity);
  assert.ok(velocityAfterDoubleJump < 0);
});

run('forward air dash crosses the grounded opponent without moving the dummy', () => {
  const state = sim.createSwahiliSandbox();
  sim.setupSandboxScenario(state, 'air_mobility_forward_dash_cross');
  const dummyStartX = state.fighters.p2.x;
  finishAirDash(state);
  assert.strictEqual(state.airMobilityReview.airDashesUsed, 1);
  assert.strictEqual(state.airMobilityReview.airDashTick, review.AIR_MOBILITY_V1_REVIEW.airDashTicks);
  assert.strictEqual(state.airMobilityReview.airDashActualDistance, review.AIR_MOBILITY_V1_REVIEW.airDashDistance);
  assert.strictEqual(state.airMobilityReview.crossedOpponent, true);
  assert.strictEqual(state.airMobilityReview.sideSwitchTick, 8);
  assert.ok(state.fighters.p1.x > state.fighters.p2.x);
  assert.strictEqual(state.fighters.p2.x, dummyStartX);
  assert.strictEqual(state.fighters.p1.facing, -1);
});

run('mirrored air dash has equal distance and crossing behavior', () => {
  const authored = sim.createSwahiliSandbox();
  const mirrored = sim.createSwahiliSandbox();
  sim.setupSandboxScenario(authored, 'air_mobility_forward_dash_cross');
  sim.setupSandboxScenario(mirrored, 'air_mobility_mirrored_cross');
  finishAirDash(authored);
  finishAirDash(mirrored);
  assert.strictEqual(authored.airMobilityReview.airDashActualDistance, mirrored.airMobilityReview.airDashActualDistance);
  assert.strictEqual(authored.airMobilityReview.crossedOpponent, true);
  assert.strictEqual(mirrored.airMobilityReview.crossedOpponent, true);
  assert.strictEqual(authored.fighters.p1.x, -mirrored.fighters.p1.x);
  assert.strictEqual(authored.fighters.p1.y, mirrored.fighters.p1.y);
});

run('only one air dash can be used before landing', () => {
  const state = sim.createSwahiliSandbox();
  sim.setupSandboxScenario(state, 'air_mobility_backward_dash_review');
  finishAirDash(state);
  step(state, {});
  step(state, { dash: true, left: true });
  assert.strictEqual(state.airMobilityReview.airDashesUsed, 1);
  assert.strictEqual(state.airMobilityReview.airDashActive, false);
});

run('forward opponent crossing rotates cleanly into the existing backdash carry', () => {
  const state = sim.createSwahiliSandbox();
  sim.setupSandboxScenario(state, 'air_mobility_forward_dash_cross');
  const selections = captureAirDashSelections(state);
  assert.deepStrictEqual(selections.map((selection) => selection.sourceId), [
    'air_dash_forward_01_air_brace', 'air_dash_forward_01_air_brace',
    'air_dash_forward_02_forward_burst', 'air_dash_forward_02_forward_burst', 'air_dash_forward_02_forward_burst',
    'air_dash_forward_03_forward_travel', 'air_dash_forward_03_forward_travel',
    'air_dash_side_switch_01_rotation_midpoint',
    'air_dash_backward_03_max_retreat', 'air_dash_backward_03_max_retreat',
    'air_dash_backward_04_air_brake', 'air_dash_backward_04_air_brake'
  ]);
  assert.strictEqual(state.airMobilityReview.sideSwitchTick, 8);
  assert.strictEqual(selections[7].presentationFacingOverride, 1);
  assert.strictEqual(selections[8].presentationFacingOverride, null);
  assert.strictEqual(selections[7].approval, motion.AIR_DASH_SIDE_SWITCH_V2_APPROVAL);
});

run('mirrored side-switch connector keeps incoming facing for one rotation tick', () => {
  const state = sim.createSwahiliSandbox();
  sim.setupSandboxScenario(state, 'air_mobility_mirrored_cross');
  const selections = captureAirDashSelections(state);
  assert.strictEqual(state.airMobilityReview.sideSwitchTick, 8);
  assert.strictEqual(selections[7].sourceId, 'air_dash_side_switch_01_rotation_midpoint');
  assert.strictEqual(selections[7].presentationFacingOverride, -1);
  assert.strictEqual(selections[8].sourceId, 'air_dash_backward_03_max_retreat');
  assert.strictEqual(selections[8].presentationFacingOverride, null);
});

run('dedicated backward air-dash art uses the authored 2-3-4-3 exposure rhythm', () => {
  const state = sim.createSwahiliSandbox();
  sim.setupSandboxScenario(state, 'air_mobility_backward_dash_review');
  assert.deepStrictEqual(captureAirDashArtwork(state), [
    'air_dash_backward_01_guarded_recoil', 'air_dash_backward_01_guarded_recoil',
    'air_dash_backward_02_backward_burst', 'air_dash_backward_02_backward_burst', 'air_dash_backward_02_backward_burst',
    'air_dash_backward_03_max_retreat', 'air_dash_backward_03_max_retreat', 'air_dash_backward_03_max_retreat', 'air_dash_backward_03_max_retreat',
    'air_dash_backward_04_air_brake', 'air_dash_backward_04_air_brake', 'air_dash_backward_04_air_brake'
  ]);
});

run('air-dash artwork remains presentation-only and candidate-gated', () => {
  assert.strictEqual(motion.AIR_DASH_MOTION_V1_REVIEW.rootMotionAuthority, 'deterministic_simulation');
  assert.strictEqual(motion.AIR_DASH_MOTION_V1_REVIEW.animationControlsCollision, false);
  assert.strictEqual(motion.AIR_DASH_MOTION_V1_REVIEW.status, 'candidate-only');
  assert.strictEqual(motion.AIR_DASH_MOTION_V1_REVIEW.deployable, false);
  assert.strictEqual(motion.AIR_DASH_MOTION_V1_REVIEW.productionRoster, false);
  assert.strictEqual(motion.AIR_DASH_MOTION_V1_REVIEW.activeTicks, review.AIR_MOBILITY_V1_REVIEW.airDashTicks);
  assert.strictEqual(motion.AIR_DASH_SIDE_SWITCH_V2_REVIEW.rootMotionAuthority, 'deterministic_simulation');
  assert.strictEqual(motion.AIR_DASH_SIDE_SWITCH_V2_REVIEW.animationControlsCollision, false);
  assert.strictEqual(motion.AIR_DASH_SIDE_SWITCH_V2_REVIEW.status, 'candidate-only');
  assert.strictEqual(motion.AIR_DASH_SIDE_SWITCH_V2_REVIEW.deployable, false);
  assert.strictEqual(motion.AIR_DASH_SIDE_SWITCH_V2_REVIEW.productionRoster, false);
  assert.strictEqual(motion.AIR_DASH_SIDE_SWITCH_V2_REVIEW.activeTicks, review.AIR_MOBILITY_V1_REVIEW.airDashTicks);
});

run('air mobility is deterministic and remains candidate-only', () => {
  const a = sim.createSwahiliSandbox();
  const b = sim.createSwahiliSandbox();
  sim.setupSandboxScenario(a, 'air_mobility_forward_dash_cross');
  sim.setupSandboxScenario(b, 'air_mobility_forward_dash_cross');
  step(a, {}, 30);
  step(b, {}, 30);
  assert.strictEqual(sim.sandboxChecksum(a), sim.sandboxChecksum(b));
  assert.strictEqual(review.AIR_MOBILITY_V1_REVIEW.status, 'candidate-only');
  assert.strictEqual(review.AIR_MOBILITY_V1_REVIEW.deployable, false);
  assert.strictEqual(review.AIR_MOBILITY_V1_REVIEW.productionRoster, false);
});

console.log('Swahili Air Mobility V1 live review tests passed: one double jump, one air dash, clean rotation-to-backdash side switching, backward 2-3-4-3 artwork exposure, mirror parity, determinism, and candidate-only isolation.');
