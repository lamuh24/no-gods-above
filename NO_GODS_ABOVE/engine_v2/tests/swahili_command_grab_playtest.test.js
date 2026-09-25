const assert = require('assert');
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const sim = require('../dist/sandbox/swahiliSandboxSimulation');
const motion = require('../dist/sandbox/commandGrabMotionV1');
const victimFall = require('../dist/sandbox/commandGrabVictimFallV1');
const finisher = require('../dist/sandbox/commandGrabFinisherReviewV1');
const recovery = require('../dist/sandbox/knockdownRecoveryV1');

function run(name, test) { test(); console.log(`PASS ${name}`); }
function tickUntilComplete(state, observations = []) {
  while (state.commandGrab.active && state.tick < 180) {
    const victimAnimation = sim.selectSandboxAnimation(state.fighters.p2);
    observations.push({
      frame: state.commandGrab.frameIndex,
      sourceTick: state.commandGrab.sourceTick,
      victimPose: state.commandGrab.victimPose,
      captured: state.commandGrab.captured,
      sideSwitchCompleted: state.commandGrab.sideSwitchCompleted,
      p1x: state.fighters.p1.x,
      p2x: state.fighters.p2.x,
      p2y: state.fighters.p2.y,
      p2Grounded: state.fighters.p2.grounded,
      victimFacing: state.fighters.p2.facing,
      health: state.fighters.p2.health,
      event: state.lastEvent?.id ?? null,
      eventTick: state.lastEvent?.tick ?? null,
      victimSourceId: victimAnimation.sourceId,
      victimRotation: state.fighters.p2.presentationRotationZ,
      launchDistance: state.commandGrab.launchDistance,
      launchPhase: state.commandGrab.launchPhase,
      shotVisualHitCount: state.commandGrab.shotVisualHitCount,
      vfx: finisher.commandGrabFinisherVfxPresentation(state.commandGrab, state.fighters.p1, state.fighters.p2)
    });
    sim.tickSwahiliSandbox(state, {});
  }
  return state;
}

run('all 24 immutable approved frames remain byte-identical to the frozen synchronization record', () => {
  assert.strictEqual(motion.COMMAND_GRAB_MOTION_V1_FRAMES.length, 24);
  assert.strictEqual(motion.COMMAND_GRAB_MOTION_V1_FRAMES.reduce((total, frame) => total + frame.exposureTicks, 0), 85);
  const repoRoot = path.join(__dirname, '..', '..', '..');
  const syncPath = path.join(repoRoot, 'tools', 'nga-forge', 'production', 'characters', 'swahili', 'motion', 'command-grab-motion-v1.approved.synchronization.json');
  const sync = JSON.parse(fs.readFileSync(syncPath, 'utf8'));
  const registry = fs.readFileSync(path.join(__dirname, '..', 'src', 'sandbox', 'swahiliSandboxSpriteSources.ts'), 'utf8');
  assert.strictEqual(sync.frameCount, 24);
  for (const [index, approvedFrame] of sync.frames.entries()) {
    const approvedPath = path.join(repoRoot, ...approvedFrame.approvedPath.split('/'));
    const hash = crypto.createHash('sha256').update(fs.readFileSync(approvedPath)).digest('hex').toUpperCase();
    assert.strictEqual(hash, approvedFrame.approvedSha256, `approved pixel hash drift in frame ${index + 1}`);
    assert.ok(registry.includes(motion.COMMAND_GRAB_MOTION_V1_FRAMES[index].sourceId), `sprite registry missing frame ${index + 1}`);
  }
});

run('historical mannequin frames remain archived but are excluded from the runtime sprite registry', () => {
  const repoRoot = path.join(__dirname, '..', '..', '..');
  const candidateRoot = path.join(repoRoot, 'tools', 'nga-forge', 'production', 'characters', 'swahili', 'source-frames', 'candidates', 'command-grab-victim-fall-v1', 'victim-only');
  const registry = fs.readFileSync(path.join(__dirname, '..', 'src', 'sandbox', 'swahiliSandboxSpriteSources.ts'), 'utf8');
  assert.strictEqual(victimFall.COMMAND_GRAB_VICTIM_FALL_V1_FRAMES.length, 6);
  for (const frame of victimFall.COMMAND_GRAB_VICTIM_FALL_V1_FRAMES) {
    const file = path.join(candidateRoot, `${String(frame.index).padStart(2, '0')}_${frame.archivedMannequinSourceId}.png`);
    assert.ok(fs.existsSync(file), file);
    const actual = crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex').toUpperCase();
    assert.strictEqual(actual, frame.candidateSha256, frame.archivedMannequinSourceId);
    assert.ok(!registry.includes(frame.archivedMannequinSourceId), `${frame.archivedMannequinSourceId} must not be runtime-loaded`);
    assert.ok(registry.includes(frame.sourceId), `${frame.sourceId} must be available as enemy reaction art`);
  }
  assert.strictEqual(victimFall.COMMAND_GRAB_VICTIM_FALL_V1_REVIEW.enemyCharacterOnly, true);
  assert.strictEqual(victimFall.COMMAND_GRAB_VICTIM_FALL_V1_REVIEW.mannequinRuntimeSourcesAllowed, false);
  assert.strictEqual(victimFall.COMMAND_GRAB_VICTIM_FALL_V1_REVIEW.facingHandoffPhase, 'final_two_airborne_fall_poses');
  assert.deepStrictEqual(victimFall.COMMAND_GRAB_VICTIM_FALL_V1_REVIEW.facingFlipPoses, ['post_shot_fall', 'fall_low']);
  assert.strictEqual(victimFall.COMMAND_GRAB_VICTIM_FALL_V1_REVIEW.presentationRotationZDegrees, 0);
});

run('in-range K command plays every approved frame, switches sides once, shoots airborne, then lands', () => {
  const state = sim.createSwahiliSandbox();
  const startX = state.fighters.p1.x;
  state.fighters.p2.x = startX + 124;
  sim.tickSwahiliSandbox(state, { commandGrab: true });
  const observations = [];
  tickUntilComplete(state, observations);
  const seenFrames = [...new Set(observations.map((item) => item.frame))];
  assert.deepStrictEqual(seenFrames, Array.from({ length: 24 }, (_, index) => index + 1));
  assert.strictEqual(state.commandGrab.result, 'hit');
  assert.strictEqual(state.commandGrab.sideSwitchCompleted, true);
  assert.strictEqual(state.fighters.p2.health, 780, 'temporary sandbox damage must apply exactly once');
  const shot = observations.find((item) => item.event === 'command_grab_finishing_shot');
  assert.ok(shot && shot.sourceTick >= motion.COMMAND_GRAB_MOTION_V1_REVIEW.shotSourceTick);
  assert.ok(shot.p2y < 0, 'victim must still be airborne at the finishing shot');
  assert.ok(shot.launchDistance >= 300, `finishing shot must happen at far launch distance, got ${shot.launchDistance}`);
  assert.strictEqual(shot.shotVisualHitCount, 1, 'the single registered shot must have one visual impact');
  assert.strictEqual(shot.vfx.showMuzzleFlash, true);
  assert.strictEqual(shot.vfx.showTracer, true);
  assert.strictEqual(shot.vfx.showImpact, true);
  assert.ok(shot.vfx.impact[0] < shot.vfx.muzzle[0], 'authored tracer must travel from the pistol toward the opposite-side victim');
  const landing = observations.find((item) => item.sourceTick >= motion.COMMAND_GRAB_MOTION_V1_REVIEW.landingSourceTick);
  assert.ok(landing && landing.sourceTick > shot.sourceTick && landing.p2y === 0, 'landing must occur after the shot');
  assert.ok((state.fighters.p2.x - state.fighters.p1.x) < 0, 'victim must finish on the opposite side');
  assert.strictEqual(state.fighters.p1.state, 'idle');
  assert.strictEqual(state.fighters.p2.state, 'command_grab_downed');
  assert.strictEqual(state.commandGrab.shotVisualHitCount, 1);
  assert.ok(state.commandGrab.maxLaunchDistance >= 330, `far launch must separate by at least 330 units, got ${state.commandGrab.maxLaunchDistance}`);
  assert.strictEqual(state.commandGrab.launchClippedByStage, false, 'center-stage far launch should not require stage clipping');
  const expectedEnemyReactionIds = [...new Set(victimFall.COMMAND_GRAB_VICTIM_FALL_V1_FRAMES.map((frame) => frame.sourceId))];
  const enemyReactionIds = [...new Set(observations.map((item) => item.victimSourceId).filter((id) => expectedEnemyReactionIds.includes(id)))];
  assert.deepStrictEqual(enemyReactionIds, expectedEnemyReactionIds);
  assert.ok(observations.every((item) => !item.victimSourceId.startsWith('command_grab_victim_')), 'captured P2 must never swap to mannequin/test-victim art');
  const captured = observations.filter((item) => item.captured);
  assert.ok(captured.every((item) => item.victimRotation === 0), 'victim presentation must never spin');
  const uniqueCapturedTicks = captured.filter((item, index) => index === 0 || captured[index - 1].sourceTick !== item.sourceTick);
  const facingTransitions = uniqueCapturedTicks.slice(1).filter((item, index) => item.victimFacing !== uniqueCapturedTicks[index].victimFacing);
  assert.strictEqual(facingTransitions.length, 1, 'victim facing must flip exactly once');
  assert.strictEqual(facingTransitions[0].victimPose, 'post_shot_fall', 'facing handoff must begin on the first of the final two falling poses');
  assert.strictEqual(facingTransitions[0].p2Grounded, false, 'facing handoff must occur before ground impact');
  const authoredFallHandoff = uniqueCapturedTicks.filter((item) => !item.p2Grounded && item.victimFacing === 1);
  assert.deepStrictEqual([...new Set(authoredFallHandoff.map((item) => item.victimPose))], ['post_shot_fall', 'fall_low']);
  assert.strictEqual(landing.victimFacing, 1, 'authored landing must retain the facing established during the fall');
  assert.strictEqual(landing.victimRotation, 0, 'ground impact must remain unrotated');
  const recoverySources = [];
  while (state.fighters.p2.state === 'command_grab_downed' && state.tick < 240) {
    recoverySources.push(sim.selectSandboxAnimation(state.fighters.p2, state).sourceId);
    sim.tickSwahiliSandbox(state, {});
  }
  assert.strictEqual(state.fighters.p2.state, 'idle');
  assert.strictEqual(recoverySources.length, recovery.KNOCKDOWN_RECOVERY_MOTION_V1_REVIEW.commandGrabKnockdownTicks + 1);
  assert.deepStrictEqual(
    [...new Set(recoverySources)],
    recovery.KNOCKDOWN_RECOVERY_MOTION_V1_FRAMES.slice(2).map((frame) => frame.sourceId),
    'command grab must hand off through the approved impact, downed hold, get-up, and rise frames'
  );
  assert.strictEqual(state.lastEvent.id, 'knockdown_recovery_motion_v1_complete');
});

run('out-of-range K is a full visual whiff and cannot move or damage the dummy', () => {
  const state = sim.createSwahiliSandbox();
  state.fighters.p2.x = state.fighters.p1.x + 240;
  const victimStartX = state.fighters.p2.x;
  sim.tickSwahiliSandbox(state, { commandGrab: true });
  tickUntilComplete(state);
  assert.strictEqual(state.commandGrab.result, 'whiff');
  assert.strictEqual(state.commandGrab.captured, false);
  assert.strictEqual(state.fighters.p2.health, 1000);
  assert.strictEqual(state.fighters.p2.x, victimStartX);
  assert.strictEqual(state.commandGrab.shotVisualHitCount, 0);
  assert.strictEqual(finisher.commandGrabFinisherVfxPresentation(state.commandGrab, state.fighters.p1, state.fighters.p2).active, false);
});

run('mirrored command grab preserves the same one-crossing side-switch logic', () => {
  const state = sim.createSwahiliSandbox();
  state.fighters.p1.x = 76;
  state.fighters.p2.x = -48;
  sim.tickSwahiliSandbox(state, {});
  assert.strictEqual(state.fighters.p1.facing, -1);
  sim.tickSwahiliSandbox(state, { commandGrab: true });
  const observations = [];
  tickUntilComplete(state, observations);
  assert.strictEqual(state.commandGrab.result, 'hit');
  assert.strictEqual(state.commandGrab.sideSwitchCompleted, true);
  assert.ok(state.fighters.p2.x > state.fighters.p1.x, 'mirrored victim must finish on the opposite screen side');
  assert.strictEqual(state.commandGrab.shotVisualHitCount, 1);
  assert.ok(observations.every((item) => !item.victimSourceId.startsWith('command_grab_victim_')), 'mirrored capture must keep P2 on enemy-character art');
  const expectedEnemyReactionIds = [...new Set(victimFall.COMMAND_GRAB_VICTIM_FALL_V1_FRAMES.map((frame) => frame.sourceId))];
  assert.deepStrictEqual(
    [...new Set(observations.map((item) => item.victimSourceId).filter((id) => expectedEnemyReactionIds.includes(id)))],
    expectedEnemyReactionIds,
    'mirrored playback must expose the same enemy-character reaction set'
  );
  const mirroredCaptured = observations.filter((item) => item.captured);
  assert.ok(mirroredCaptured.every((item) => item.victimRotation === 0), 'mirrored victim presentation must never spin');
  const uniqueMirroredTicks = mirroredCaptured.filter((item, index) => index === 0 || mirroredCaptured[index - 1].sourceTick !== item.sourceTick);
  const mirroredFacingTransitions = uniqueMirroredTicks.slice(1).filter((item, index) => item.victimFacing !== uniqueMirroredTicks[index].victimFacing);
  assert.strictEqual(mirroredFacingTransitions.length, 1, 'mirrored victim facing must flip exactly once');
  assert.strictEqual(mirroredFacingTransitions[0].victimPose, 'post_shot_fall');
  assert.strictEqual(mirroredFacingTransitions[0].p2Grounded, false);
  const mirroredFallHandoff = uniqueMirroredTicks.filter((item) => !item.p2Grounded && item.victimFacing === -1);
  assert.deepStrictEqual([...new Set(mirroredFallHandoff.map((item) => item.victimPose))], ['post_shot_fall', 'fall_low']);
  const mirroredLanding = uniqueMirroredTicks.find((item) => item.sourceTick >= motion.COMMAND_GRAB_MOTION_V1_REVIEW.landingSourceTick);
  assert.ok(mirroredLanding && mirroredLanding.victimFacing === -1, 'mirrored landing must retain the facing established during the fall');
});

run('far launch root path is continuous and never reverses after release', () => {
  const state = sim.createSwahiliSandbox();
  state.fighters.p2.x = state.fighters.p1.x + 124;
  sim.tickSwahiliSandbox(state, { commandGrab: true });
  const observations = [];
  tickUntilComplete(state, observations);
  const uniqueSourceTicks = observations.filter((item, index) => index === 0 || observations[index - 1].sourceTick !== item.sourceTick);
  const release = uniqueSourceTicks.filter((item) => item.sourceTick >= finisher.COMMAND_GRAB_FINISHER_REVIEW_V1.launch.startsAtSourceTick);
  for (let index = 1; index < release.length; index++) {
    assert.ok(release[index].p2x <= release[index - 1].p2x + 0.0001, `victim reversed between source ticks ${release[index - 1].sourceTick} and ${release[index].sourceTick}`);
    assert.ok(Math.abs(release[index].p2x - release[index - 1].p2x) <= 35, `victim teleported between source ticks ${release[index - 1].sourceTick} and ${release[index].sourceTick}`);
  }
  assert.strictEqual(new Set(release.filter((item) => item.event === 'command_grab_finishing_shot').map((item) => item.eventTick)).size, 1, 'finishing shot event must emit once');
});

run('mirrored shot sockets reverse direction and still converge on the victim', () => {
  const state = sim.createSwahiliSandbox();
  state.fighters.p1.x = 76;
  state.fighters.p2.x = -48;
  sim.tickSwahiliSandbox(state, {});
  sim.tickSwahiliSandbox(state, { commandGrab: true });
  let shotVfx = null;
  while (state.commandGrab.active && state.tick < 180) {
    if (state.commandGrab.sourceTick === motion.COMMAND_GRAB_MOTION_V1_REVIEW.shotSourceTick) {
      shotVfx = finisher.commandGrabFinisherVfxPresentation(state.commandGrab, state.fighters.p1, state.fighters.p2);
      break;
    }
    sim.tickSwahiliSandbox(state, {});
  }
  assert.ok(shotVfx && shotVfx.active);
  assert.ok(shotVfx.impact[0] > shotVfx.muzzle[0], 'mirrored tracer must travel screen-right toward the victim');
  assert.strictEqual(shotVfx.visibleImpactCount, 1);
});

run('corner launch clamps safely without losing opposite-side logic or the visual hit', () => {
  const state = sim.createSwahiliSandbox();
  state.fighters.p1.x = -300;
  state.fighters.p2.x = -176;
  sim.tickSwahiliSandbox(state, {});
  sim.tickSwahiliSandbox(state, { commandGrab: true });
  tickUntilComplete(state);
  assert.strictEqual(state.commandGrab.result, 'hit');
  assert.strictEqual(state.commandGrab.launchClippedByStage, true);
  assert.ok(state.fighters.p2.x >= state.stage.left + finisher.COMMAND_GRAB_FINISHER_REVIEW_V1.launch.stageMargin);
  assert.ok(state.fighters.p2.x < state.fighters.p1.x);
  assert.strictEqual(state.commandGrab.shotVisualHitCount, 1);
});

run('command-grab replay is deterministic', () => {
  const execute = () => {
    const state = sim.createSwahiliSandbox(33);
    state.fighters.p2.x = state.fighters.p1.x + 124;
    sim.tickSwahiliSandbox(state, { commandGrab: true });
    tickUntilComplete(state);
    return sim.sandboxChecksum(state);
  };
  assert.strictEqual(execute(), execute());
});

console.log('Swahili command-grab playtest passed: 24 frozen attacker frames, enemy-character-only victim reactions with zero runtime mannequin sources, zero spin, one fall-phase facing handoff across the final two airborne poses, .8x review playback, capture, side switch, airborne shot, landing, approved knockdown recovery, mirrored parity, and deterministic replay.');
