const assert = require('assert');
const fs = require('fs');
const path = require('path');
const { createMatch } = require('../dist/core/engine');
const { StageCameraRig } = require('../dist/stage/cameraRig');
const { stageVerticalSliceContract } = require('../dist/stage/stageContract');

function clone(value) { return JSON.parse(JSON.stringify(value)); }
function rounded(value) { return JSON.parse(JSON.stringify(value), (_, item) => typeof item === 'number' ? Number(item.toFixed(8)) : item); }

function testStageAuthorityAndCoordinateParity() {
  const contract = stageVerticalSliceContract;
  assert.strictEqual(contract.authority.gameplayPlane, 'deterministic_2d');
  assert.strictEqual(contract.authority.renderingMayAffectGameplay, false);
  assert.strictEqual(contract.collision.renderGeometryAuthoritative, false);
  assert.strictEqual(contract.collision.hazards, 'prohibited');
  assert.strictEqual(contract.combatPlane.worldBounds.left, contract.combatPlane.simulationBounds.left * contract.combatPlane.simulationPixelsToWorldUnits);
  assert.strictEqual(contract.combatPlane.worldBounds.right, contract.combatPlane.simulationBounds.right * contract.combatPlane.simulationPixelsToWorldUnits);
}

function testCameraCannotMutateSimulation() {
  const state = createMatch(77);
  const before = clone(state);
  const rig = new StageCameraRig(stageVerticalSliceContract);
  rig.update(state, 16 / 9);
  rig.startCinematic('throw', 'p1', state, 16 / 9);
  rig.update(state, 16 / 9);
  assert.deepStrictEqual(state, before);
}

function testDeterministicCameraReplay() {
  const left = new StageCameraRig(stageVerticalSliceContract);
  const right = new StageCameraRig(stageVerticalSliceContract);
  const a = createMatch(12);
  const b = clone(a);
  const posesA = [];
  const posesB = [];
  for (let tick = 0; tick <= 90; tick++) {
    a.tick = b.tick = tick;
    a.fighters.p1.x = b.fighters.p1.x = -76 + tick * 1.5;
    a.fighters.p2.x = b.fighters.p2.x = 76 + tick * 0.35;
    a.fighters.p1.y = b.fighters.p1.y = tick > 25 && tick < 65 ? -Math.sin((tick - 25) / 40 * Math.PI) * 180 : 0;
    if (tick === 18) { left.startCinematic('super', 'p1', a, 16 / 9); right.startCinematic('super', 'p1', b, 16 / 9); }
    posesA.push(rounded(left.update(a, 16 / 9)));
    posesB.push(rounded(right.update(b, 16 / 9)));
  }
  assert.deepStrictEqual(posesA, posesB);
}

function testSideSwitchAndJumpFraming() {
  const state = createMatch(4);
  const rig = new StageCameraRig(stageVerticalSliceContract);
  const neutral = rig.snapToGameplay(state, 16 / 9);
  const x = state.fighters.p1.x;
  state.fighters.p1.x = state.fighters.p2.x;
  state.fighters.p2.x = x;
  state.tick++;
  const switched = rig.snapToGameplay(state, 16 / 9);
  assert.deepStrictEqual(switched, neutral, 'unordered fighter framing must survive side switch');
  state.fighters.p1.y = state.stage.ceilingY;
  state.tick++;
  const jump = rig.snapToGameplay(state, 16 / 9);
  assert.ok(jump.target[1] > neutral.target[1], 'jump framing must raise the camera target');
  assert.ok(jump.position[2] >= neutral.position[2], 'jump framing must not zoom closer');
}

function testCornerFramingUsesArtOverscan() {
  const state = createMatch(5);
  const rig = new StageCameraRig(stageVerticalSliceContract);
  state.fighters.p1.x = 285;
  state.fighters.p2.x = 410;
  const right = rig.snapToGameplay(state, 1050 / 900);
  assert.ok(right.target[0] > 5.5, 'right corner camera must follow fighters instead of pinning viewport inside the wall');
  state.fighters.p1.x = -410;
  state.fighters.p2.x = -285;
  state.tick++;
  const left = rig.snapToGameplay(state, 1050 / 900);
  assert.ok(left.target[0] < -5.5, 'left corner camera must mirror overscan behavior');
}

function testCinematicMirrorAbortAndReturn() {
  const state = createMatch(9);
  const rightFacing = new StageCameraRig(stageVerticalSliceContract);
  rightFacing.snapToGameplay(state, 16 / 9);
  rightFacing.startCinematic('ultimate', 'p1', state, 16 / 9);
  state.tick += 8;
  const rightPose = rightFacing.update(state, 16 / 9);

  const mirroredState = createMatch(9);
  mirroredState.fighters.p1.facing = -1;
  mirroredState.fighters.p1.attackFacing = -1;
  const leftFacing = new StageCameraRig(stageVerticalSliceContract);
  leftFacing.snapToGameplay(mirroredState, 16 / 9);
  leftFacing.startCinematic('ultimate', 'p1', mirroredState, 16 / 9);
  mirroredState.tick += 8;
  const leftPose = leftFacing.update(mirroredState, 16 / 9);
  assert.ok(Math.sign(rightPose.position[0] - rightPose.target[0]) === -Math.sign(leftPose.position[0] - leftPose.target[0]), 'cinematic lateral offset must mirror with attacker facing');

  leftFacing.abort(mirroredState, true, 16 / 9);
  assert.strictEqual(leftFacing.snapshot().pose.mode, 'gameplay', 'rollback abort must snap to gameplay camera');

  const returnRig = new StageCameraRig(stageVerticalSliceContract);
  const returnState = createMatch(3);
  returnRig.snapToGameplay(returnState, 16 / 9);
  returnRig.startCinematic('throw', 'p1', returnState, 16 / 9);
  returnState.tick += stageVerticalSliceContract.cinematicCameras.shots.throw.durationTicks + stageVerticalSliceContract.camera.returnToGameplay.ticks;
  assert.strictEqual(returnRig.update(returnState, 16 / 9).mode, 'gameplay');
}

function testMoveAuthoredCinematicDuration() {
  const state = createMatch(19);
  const rig = new StageCameraRig(stageVerticalSliceContract);
  rig.snapToGameplay(state, 16 / 9);
  rig.startCinematic('super', 'p1', state, 16 / 9, 77);
  assert.strictEqual(rig.snapshot().active.durationTicks, 77, 'move-authored duration must override only the arena default');
  state.tick += 60;
  assert.strictEqual(rig.update(state, 16 / 9).mode, 'cinematic', 'arbitrary fixed-tick duration must remain active beyond the arena default');
  state.tick += 17 + stageVerticalSliceContract.camera.returnToGameplay.ticks;
  assert.strictEqual(rig.update(state, 16 / 9).mode, 'gameplay');
  assert.throws(() => rig.startCinematic('super', 'p1', state, 16 / 9, 0), /positive fixed-tick integer/);
}

function testGroundedCinematicTargetVisibilityClamp() {
  const state = createMatch(23);
  state.fighters.p1.x = -74;
  state.fighters.p2.x = 86;
  const rig = new StageCameraRig(stageVerticalSliceContract);
  const gameplay = rig.snapToGameplay(state, 1280 / 720);
  rig.startCinematic('ultimate', 'p1', state, 1280 / 720);
  state.tick += 20;
  const cinematic = rig.update(state, 1280 / 720);
  assert.ok(cinematic.target[1] <= gameplay.target[1] + 0.85, 'grounded cinematic target must remain within the visibility-safe vertical band');
  assert.strictEqual(cinematic.context, 'ultimate');
}

function testLegacyAndCombatKernelIsolation() {
  const renderer = fs.readFileSync(path.join(__dirname, '..', 'src', 'debug', 'debugRenderer.ts'), 'utf8');
  const presentation = fs.readFileSync(path.join(__dirname, '..', 'src', 'stage', 'stagePresentation.ts'), 'utf8');
  assert.ok(!renderer.includes('game.js'));
  assert.ok(!presentation.includes('game.js'));
  assert.ok(!presentation.includes('tick('), 'stage presentation must not advance simulation');
  assert.ok(!presentation.includes('fighter.x ='), 'stage presentation must not write fighter X');
  assert.ok(!presentation.includes('fighter.y ='), 'stage presentation must not write fighter Y');
}

for (const test of [testStageAuthorityAndCoordinateParity, testCameraCannotMutateSimulation, testDeterministicCameraReplay, testSideSwitchAndJumpFraming, testCornerFramingUsesArtOverscan, testCinematicMirrorAbortAndReturn, testMoveAuthoredCinematicDuration, testGroundedCinematicTargetVisibilityClamp, testLegacyAndCombatKernelIsolation]) {
  test();
  console.log(`PASS ${test.name}`);
}
