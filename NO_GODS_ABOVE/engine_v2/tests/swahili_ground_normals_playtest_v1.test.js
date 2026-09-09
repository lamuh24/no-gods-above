const assert = require('assert');
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const sim = require('../dist/sandbox/swahiliSandboxSimulation');
const normals = require('../dist/sandbox/groundNormalsPlaytestV1');
const mediumPresentation = require('../dist/sandbox/crouchingMediumOpposedSplitShotV6');

const REPO = path.resolve(__dirname, '../../..');
const INPUTS = {
  standing_light: { light: true },
  standing_medium: { medium: true },
  crouching_light: { down: true, light: true },
  crouching_medium: { down: true, medium: true },
  crouching_heavy: { down: true, heavy: true }
};

const STANDING_SOURCE_PATHS = {
  standing_normals_motion_v1_light_01_compact_chamber: 'tools/nga-forge/production/characters/swahili/source-frames/approved/standing-normal-key-poses-v2/standing_light/01_compact_chamber.png',
  standing_normals_motion_v1_light_02_fast_low_extension: 'tools/nga-forge/production/characters/swahili/source-frames/candidates/attack-animation-cleanup-v1/standing-neutral-normals-motion-v1/standing_light/02_fast_low_extension_connector.png',
  standing_normals_motion_v1_light_03_low_kick_contact: 'tools/nga-forge/production/characters/swahili/source-frames/approved/standing-normal-key-poses-v2/standing_light/02_low_kick_contact.png',
  standing_normals_motion_v1_light_04_post_contact_recoil: 'tools/nga-forge/production/characters/swahili/source-frames/candidates/attack-animation-cleanup-v1/standing-neutral-normals-motion-v1/standing_light/04_post_contact_recoil_connector.png',
  standing_normals_motion_v1_light_05_leg_retraction: 'tools/nga-forge/production/characters/swahili/source-frames/approved/standing-normal-key-poses-v2/standing_light/03_leg_retraction.png',
  standing_normals_motion_v1_light_06_planted_recovery: 'tools/nga-forge/production/characters/swahili/source-frames/approved/standing-normal-key-poses-v2/standing_light/04_planted_recovery.png',
  standing_normals_motion_v1_medium_01_anticipation: 'tools/nga-forge/production/characters/swahili/source-frames/approved/standing-normal-key-poses-v2/standing_medium/01_anticipation.png',
  standing_normals_motion_v1_medium_02_hip_drive_rise: 'tools/nga-forge/production/characters/swahili/source-frames/candidates/attack-animation-cleanup-v1/standing-neutral-normals-motion-v1/standing_medium/02_hip_drive_rise_connector.png',
  standing_normals_motion_v1_medium_03_rising_knee_contact: 'tools/nga-forge/production/characters/swahili/source-frames/approved/standing-normal-key-poses-v2/standing_medium/02_rising_knee_contact.png',
  standing_normals_motion_v1_medium_04_knee_descent: 'tools/nga-forge/production/characters/swahili/source-frames/approved/standing-normal-key-poses-v2/standing_medium/03_knee_descent.png',
  standing_normals_motion_v1_medium_05_torso_settling: 'tools/nga-forge/production/characters/swahili/source-frames/approved/standing-normal-key-poses-v2/standing_medium/04_torso_settling.png'
};

const CROUCHING_MOTION_V1_SOURCE_PATHS = {
  crouching_medium_opposed_split_shot_v6_01_guarded_crouch_preparation: 'tools/nga-forge/production/characters/swahili/source-frames/candidates/attack-animation-cleanup-v1/crouching-medium-opposed-double-shot-v2-vfx-v6/crouching_medium/01_guarded_crouch_preparation.png',
  crouching_medium_opposed_split_shot_v6_02_opposed_split_alignment: 'tools/nga-forge/production/characters/swahili/source-frames/candidates/attack-animation-cleanup-v1/crouching-medium-opposed-double-shot-v2-vfx-v6/crouching_medium/02_opposed_split_alignment.png',
  crouching_medium_opposed_split_shot_v6_03_simultaneous_contact: 'tools/nga-forge/production/characters/swahili/source-frames/candidates/attack-animation-cleanup-v1/crouching-medium-opposed-double-shot-v2-vfx-v6/crouching_medium/03_opposed_simultaneous_double_shot_contact.png',
  crouching_medium_opposed_split_shot_v6_04_opposed_dual_recoil: 'tools/nga-forge/production/characters/swahili/source-frames/candidates/attack-animation-cleanup-v1/crouching-medium-opposed-double-shot-v2-vfx-v6/crouching_medium/04_opposed_dual_recoil.png',
  crouching_medium_opposed_split_shot_v6_05_controlled_pistol_lowering: 'tools/nga-forge/production/characters/swahili/source-frames/candidates/attack-animation-cleanup-v1/crouching-medium-opposed-double-shot-v2-vfx-v6/crouching_medium/05_controlled_pistol_lowering.png',
  crouching_medium_opposed_split_shot_v6_06_crouched_recovery: 'tools/nga-forge/production/characters/swahili/source-frames/candidates/attack-animation-cleanup-v1/crouching-medium-opposed-double-shot-v2-vfx-v6/crouching_medium/06_crouched_recovery.png',
  crouching_heavy_motion_v1_01_deep_rotational_anticipation: 'tools/nga-forge/production/characters/swahili/source-frames/candidates/attack-animation-cleanup-v1/crouching-normals-motion-v1/crouching_heavy/01_deep_rotational_anticipation.png',
  crouching_heavy_motion_v1_02_sweep_acceleration: 'tools/nga-forge/production/characters/swahili/source-frames/candidates/attack-animation-cleanup-v1/crouching-normals-motion-v1/crouching_heavy/02_sweep_acceleration.png',
  crouching_heavy_motion_v1_03_low_ground_contact: 'tools/nga-forge/production/characters/swahili/source-frames/candidates/attack-animation-cleanup-v1/crouching-normals-motion-v1/crouching_heavy/03_low_ground_contact.png',
  crouching_heavy_motion_v1_04_rotational_carry_past_contact: 'tools/nga-forge/production/characters/swahili/source-frames/candidates/attack-animation-cleanup-v1/crouching-normals-motion-v1/crouching_heavy/04_rotational_carry_past_contact.png',
  crouching_heavy_motion_v1_05_committed_follow_through: 'tools/nga-forge/production/characters/swahili/source-frames/candidates/attack-animation-cleanup-v1/crouching-normals-motion-v1/crouching_heavy/05_committed_follow_through.png',
  crouching_heavy_motion_v1_06_recovery_unwind: 'tools/nga-forge/production/characters/swahili/source-frames/candidates/attack-animation-cleanup-v1/crouching-normals-motion-v1/crouching_heavy/06_recovery_unwind.png',
  crouching_heavy_motion_v1_07_planted_recovery: 'tools/nga-forge/production/characters/swahili/source-frames/candidates/attack-animation-cleanup-v1/crouching-normals-motion-v1/crouching_heavy/07_planted_recovery.png'
};

const CROUCHING_LIGHT_V4_SOURCE_PATHS = {
  crouching_light_v4_01_guarded_crouch: 'tools/nga-forge/production/characters/swahili/source-frames/approved/crouching-light-key-poses-v4/01_guarded_crouch.png',
  crouching_light_v4_02_rapid_low_aim: 'tools/nga-forge/production/characters/swahili/source-frames/approved/crouching-light-key-poses-v4/02_rapid_low_aim.png',
  crouching_light_v4_03_point_blank_shot: 'tools/nga-forge/production/characters/swahili/source-frames/approved/crouching-light-key-poses-v4/03_point_blank_shot.png',
  crouching_light_v4_04_compact_recoil: 'tools/nga-forge/production/characters/swahili/source-frames/approved/crouching-light-key-poses-v4/04_compact_recoil.png',
  crouching_light_v4_05_crouched_recovery: 'tools/nga-forge/production/characters/swahili/source-frames/approved/crouching-light-key-poses-v4/05_crouched_recovery.png'
};

const CROUCHING_MOTION_V1_ROLES = {
  crouching_medium: ['guarded_crouch_preparation', 'opposed_split_alignment', 'opposed_simultaneous_double_shot_contact', 'opposed_dual_recoil', 'controlled_pistol_lowering', 'crouched_recovery'],
  crouching_heavy: ['deep_rotational_anticipation', 'sweep_acceleration', 'low_ground_contact', 'rotational_carry_past_contact', 'committed_follow_through', 'recovery_unwind', 'planted_recovery']
};

function expectedState(id) {
  return `${id}_review`;
}

function runMove(id, options = {}) {
  const state = sim.createSwahiliSandbox(700 + Object.keys(INPUTS).indexOf(id));
  sim.setStandingNormalsMotionV1TimingProfile(state, options.timing || 'responsive');
  sim.setCrouchingLightV4TimingProfile(state, '17_ticks');
  sim.setCrouchingMediumOpposedSplitShotV6TimingProfile(state, options.crouchingMediumTiming || 'opposed_split_shot_v6');
  sim.setCrouchingHeavyMotionV1TimingProfile(state, options.crouchingHeavyTiming || 'responsive_heavy_sweep');
  state.fighters.p1.x = options.far ? -250 : options.mirrored ? 76 : -76;
  state.fighters.p2.x = options.far ? 250 : options.mirrored ? -60 : 60;
  if (options.block) state.dummyBlockMode = id.startsWith('crouching_') ? 'crouching' : 'standing';
  const initialHealth = state.fighters.p2.health;
  const initialTick = state.tick;
  const sources = [];
  const contactTicks = [];
  sim.tickSwahiliSandbox(state, INPUTS[id]);
  assert.strictEqual(state.fighters.p1.state, expectedState(id), `${id} must start its candidate review state`);
  while (state.fighters.p1.moveCursor !== null && state.tick < 180) {
    const art = sim.selectSandboxAnimation(state.fighters.p1, state);
    if (!sources.includes(art.sourceId)) sources.push(art.sourceId);
    sim.tickSwahiliSandbox(state, {});
    if (state.lastEvent && state.lastEvent.id.startsWith(`ground_normal_${id}_contact`) && !contactTicks.includes(state.lastEvent.tick)) contactTicks.push(state.lastEvent.tick);
  }
  return { state, initialHealth, sources, contactTicks, elapsedTicks: state.tick - initialTick };
}

assert.strictEqual(normals.GROUND_NORMALS_PLAYTEST_V1_APPROVAL, 'APPROVED_AS_CURRENT_SANDBOX_MOVESET_2026_08_12');
assert.strictEqual(normals.GROUND_NORMALS_PLAYTEST_V1_GAMEPLAY_VALUES, 'TEMPORARY_SANDBOX_GROUND_NORMALS_NOT_PRODUCTION_BALANCE');
assert.strictEqual(normals.STANDING_NORMALS_MOTION_V1_DEFAULT_TIMING, 'responsive');
assert.strictEqual(normals.STANDING_NORMALS_MOTION_V1_RANGE_TIMING_POLICY, 'NO_HITSTOP_RANGE_NORMALIZED_MOTION_REVIEW');
assert.strictEqual(normals.CROUCHING_LIGHT_V4_DEFAULT_TIMING, '17_ticks');
assert.strictEqual(normals.CROUCHING_LIGHT_V4_TIMING_REVIEW_STATUS, 'APPROVED_AS_CROUCHING_LIGHT_MOTION_V1');
assert.strictEqual(normals.CROUCHING_MEDIUM_OPPOSED_SPLIT_SHOT_V6_DEFAULT_TIMING, 'opposed_split_shot_v6');
assert.strictEqual(normals.CROUCHING_MEDIUM_OPPOSED_SPLIT_SHOT_V6_REVIEW_STATUS, 'APPROVED_AS_CURRENT_SANDBOX_MOVESET_2026_08_12');

for (const timing of ['responsive', 'weight_emphasized']) {
  const definitions = normals.GROUND_NORMALS_PLAYTEST_V1_BY_TIMING[timing];
  for (const id of ['standing_light', 'standing_medium']) {
    const definition = definitions[id];
    const expectedExposureCount = id === 'standing_light' ? 6 : 5;
    assert.strictEqual(definition.exposures.length, expectedExposureCount, `${id} must expose its reviewed motion spine`);
    assert.strictEqual(definition.totalTicks, definition.startupTicks + definition.activeTicks + definition.recoveryTicks);
    assert.strictEqual(normals.groundNormalIsActive(definition, definition.startupTicks), true);
    assert.strictEqual(normals.groundNormalIsActive(definition, definition.startupTicks + definition.activeTicks), false);
    assert.deepStrictEqual(definition.exposures.map((frame) => frame.ticks), normals.STANDING_NORMALS_MOTION_V1_TIMING_PROFILES[timing][id]);

    const result = runMove(id, { timing });
    const whiff = runMove(id, { timing, far: true });
    assert.deepStrictEqual(result.sources, definition.exposures.map((frame) => frame.sourceId), `${id}/${timing} must expose all reviewed poses in order`);
    assert.deepStrictEqual(whiff.sources, definition.exposures.map((frame) => frame.sourceId), `${id}/${timing} whiff must expose the same poses in order`);
    assert.strictEqual(result.contactTicks.length, 1, `${id}/${timing} must register one visible/gameplay contact`);
    assert.strictEqual(whiff.contactTicks.length, 0, `${id}/${timing} out-of-range review must whiff`);
    assert.strictEqual(definition.hitstop, 0, `${id}/${timing} motion review must not vary animation duration by contact range`);
    assert.strictEqual(result.elapsedTicks, whiff.elapsedTicks, `${id}/${timing} hit and whiff must have identical wall-clock animation duration`);
    assert.strictEqual(result.elapsedTicks, definition.totalTicks, `${id}/${timing} must retain its authored exposure duration`);
    assert.strictEqual(result.initialHealth - result.state.fighters.p2.health, definition.damage, `${id}/${timing} damage must retain the existing temporary value`);
    assert.strictEqual(result.state.fighters.p1.state, 'idle');
    assert.strictEqual(result.state.fighters.p1.x, optionsRoot(result.state.fighters.p1.facing), `${id}/${timing} root must remain simulation-stable`);
  }
}

function optionsRoot(facing) {
  return facing > 0 ? -76 : 76;
}

for (const [profileId, profile] of Object.entries(normals.CROUCHING_LIGHT_V4_TIMING_PROFILES)) {
  const definition = normals.groundNormalForId('crouching_light', 'responsive', profileId);
  assert.deepStrictEqual(definition.exposures.map((frame) => frame.role), ['guarded_crouch', 'rapid_low_aim', 'point_blank_shot', 'compact_recoil', 'crouched_recovery']);
  assert.deepStrictEqual(definition.exposures.map((frame) => frame.ticks), profile.exposures, `${profileId} must use its nonuniform exposure map`);
  assert.strictEqual(definition.startupTicks, profile.startupTicks);
  assert.strictEqual(definition.activeTicks, 1, `${profileId} must keep the shot crisp at one tick`);
  assert.strictEqual(definition.recoveryTicks, profile.recoveryTicks);
  assert.strictEqual(definition.totalTicks, profile.totalTicks);
  assert.strictEqual(definition.hitstop, 1, `${profileId} confirmed hit must add exactly one hitstop tick`);
  assert.strictEqual(definition.damage, 40, `${profileId} must not change sandbox damage`);
  assert.deepStrictEqual(definition.hitbox, { x: 24, y: -48, w: 94, h: 34 }, `${profileId} must not change combat geometry`);

  const result = runMove('crouching_light');
  const whiff = runMove('crouching_light', { far: true });
  const mirrored = runMove('crouching_light', { mirrored: true });
  assert.deepStrictEqual(result.sources, definition.exposures.map((frame) => frame.sourceId), `${profileId} hit must expose all five approved V4 poses`);
  assert.deepStrictEqual(whiff.sources, definition.exposures.map((frame) => frame.sourceId), `${profileId} whiff must expose the identical five approved V4 poses`);
  assert.deepStrictEqual(mirrored.sources, definition.exposures.map((frame) => frame.sourceId), `${profileId} mirrored playback must preserve V4 pose order`);
  assert.strictEqual(result.contactTicks.length, 1, `${profileId} must remain single-hit`);
  assert.strictEqual(whiff.contactTicks.length, 0, `${profileId} outside range must whiff`);
  assert.strictEqual(whiff.elapsedTicks, definition.totalTicks, `${profileId} whiff wall time must equal visual exposure total`);
  assert.strictEqual(result.elapsedTicks, definition.totalTicks + 1, `${profileId} hit wall time must add only the authorized one-tick hitstop`);
  assert.strictEqual(mirrored.state.fighters.p1.facing, -1, `${profileId} mirrored P1 must stay opponent-facing`);
  assert.strictEqual(result.state.fighters.p1.state, 'crouch', `${profileId} must return to crouch`);
  assert.strictEqual(result.state.fighters.p1.x, optionsRoot(result.state.fighters.p1.facing), `${profileId} must not move the gameplay root`);
}

for (const [id, profiles] of [
  ['crouching_medium', normals.CROUCHING_MEDIUM_OPPOSED_SPLIT_SHOT_V6_TIMING_PROFILES],
  ['crouching_heavy', normals.CROUCHING_HEAVY_MOTION_V1_TIMING_PROFILES]
]) {
  for (const [profileId, profile] of Object.entries(profiles)) {
    const options = id === 'crouching_medium' ? { crouchingMediumTiming: profileId } : { crouchingHeavyTiming: profileId };
    const definition = normals.groundNormalForId(
      id,
      'responsive',
      '17_ticks',
      id === 'crouching_medium' ? profileId : 'opposed_split_shot_v6',
      id === 'crouching_heavy' ? profileId : 'responsive_heavy_sweep'
    );
    assert.deepStrictEqual(definition.exposures.map((frame) => frame.role), CROUCHING_MOTION_V1_ROLES[id]);
    assert.deepStrictEqual(definition.exposures.map((frame) => frame.ticks), profile.exposures, `${id}/${profileId} must use the reviewed nonuniform exposure map`);
    assert.strictEqual(definition.startupTicks, profile.startupTicks);
    assert.strictEqual(definition.activeTicks, profile.activeTicks);
    assert.strictEqual(definition.recoveryTicks, profile.recoveryTicks);
    assert.strictEqual(definition.totalTicks, profile.totalTicks);
    const result = runMove(id, options);
    const whiff = runMove(id, { ...options, far: true });
    const mirrored = runMove(id, { ...options, mirrored: true });
    assert.deepStrictEqual(result.sources, definition.exposures.map((frame) => frame.sourceId), `${id}/${profileId} must expose every reviewed motion frame in order`);
    assert.deepStrictEqual(whiff.sources, definition.exposures.map((frame) => frame.sourceId), `${id}/${profileId} whiff must preserve the same pose order`);
    assert.deepStrictEqual(mirrored.sources, definition.exposures.map((frame) => frame.sourceId), `${id}/${profileId} mirrored playback must preserve the same pose order`);
    assert.strictEqual(result.contactTicks.length, 1, `${id}/${profileId} must preserve visible/gameplay hit parity`);
    assert.strictEqual(whiff.contactTicks.length, 0, `${id}/${profileId} must whiff when outside hitbox range`);
    assert.strictEqual(mirrored.state.fighters.p1.facing, -1, `${id}/${profileId} mirrored P1 must remain opponent-facing`);
    assert.strictEqual(result.state.commandGrab.active, false, `${id}/${profileId} must not route into command-grab knockdown logic`);
    assert.notStrictEqual(result.state.fighters.p2.state, 'command_grab_downed', `${id}/${profileId} must not add an unapproved knockdown outcome`);
    assert.strictEqual(result.state.fighters.p1.state, 'crouch', `${id}/${profileId} must return to the approved crouch state`);
    assert.strictEqual(result.state.fighters.p1.x, optionsRoot(result.state.fighters.p1.facing), `${id}/${profileId} root must remain simulation-stable`);
    if (id === 'crouching_medium') {
      assert.strictEqual(result.initialHealth - result.state.fighters.p2.health, 65, `${id}/${profileId} must preserve the 65 damage total`);
      assert.deepStrictEqual(definition.hits.map((hit) => hit.ordinal), [1], `${id}/${profileId} must define one simultaneous firing beat`);
      assert.deepStrictEqual(definition.hits.map((hit) => hit.damage), [65], `${id}/${profileId} must register at most one hit per opponent`);
      assert.deepStrictEqual(definition.hits.map((hit) => hit.visibleImpactCount), [1], `${id}/${profileId} must expose one visible impact per opponent`);
      assert.strictEqual(definition.hitstop, 10, `${id}/${profileId} must retain the approved hit-only impact hold`);
    }
  }
}

function runMediumCycle(state) {
  const sources = [];
  const contacts = [];
  sim.tickSwahiliSandbox(state, INPUTS.crouching_medium);
  assert.strictEqual(state.fighters.p1.state, 'crouching_medium_review', 'Crouching Medium must enter from the crouch command');
  while (state.fighters.p1.moveCursor !== null && state.tick < 180) {
    const art = sim.selectSandboxAnimation(state.fighters.p1, state);
    if (!sources.includes(art.sourceId)) sources.push(art.sourceId);
    sim.tickSwahiliSandbox(state, {});
    if (state.lastEvent && state.lastEvent.id.startsWith('ground_normal_crouching_medium_contact') && !contacts.includes(state.lastEvent.tick)) contacts.push(state.lastEvent.tick);
  }
  assert.strictEqual(state.fighters.p1.state, 'crouch', 'Crouching Medium must settle back into approved crouch');
  return { sources, contacts };
}

const repeatedMedium = sim.createSwahiliSandbox(734);
sim.setCrouchingMediumOpposedSplitShotV6TimingProfile(repeatedMedium, 'opposed_split_shot_v6');
repeatedMedium.fighters.p1.x = -76;
repeatedMedium.fighters.p2.x = 60;
const splitShotDefinition = normals.groundNormalForId('crouching_medium', 'responsive', '17_ticks', 'opposed_split_shot_v6');
const firstMediumCycle = runMediumCycle(repeatedMedium);
while ((repeatedMedium.fighters.p2.hitstun > 0 || repeatedMedium.fighters.p2.blockstun > 0) && repeatedMedium.tick < 240) {
  sim.tickSwahiliSandbox(repeatedMedium, {});
}
repeatedMedium.fighters.p1.x = -76;
repeatedMedium.fighters.p2.x = 60;
const secondMediumCycle = runMediumCycle(repeatedMedium);
assert.deepStrictEqual(firstMediumCycle.sources, splitShotDefinition.exposures.map((frame) => frame.sourceId), 'first Opposed Split Shot cycle must expose all six V6 poses');
assert.deepStrictEqual(secondMediumCycle.sources, splitShotDefinition.exposures.map((frame) => frame.sourceId), 'repeated Opposed Split Shot use must expose the same six V6 poses');
assert.strictEqual(firstMediumCycle.contacts.length, 1, 'first Opposed Split Shot cycle must register exactly one hit on this opponent');
assert.strictEqual(secondMediumCycle.contacts.length, 1, 'repeated Opposed Split Shot use must register exactly one hit on this opponent');
assert.strictEqual(repeatedMedium.fighters.p1.x, -76, 'repeated split-shot use must keep the gameplay root fixed');

const crouchingValidation = JSON.parse(fs.readFileSync(path.resolve(REPO, 'tools/nga-forge/production/characters/swahili/reports/attack-animation-cleanup-v1/crouching-normals-motion-v1/structural-validation.json'), 'utf8'));
const mediumSourceVerification = JSON.parse(fs.readFileSync(path.resolve(REPO, 'tools/nga-forge/production/characters/swahili/reports/attack-animation-cleanup-v1/crouching-medium-opposed-double-shot-v2-vfx-v6/source-copy-verification.json'), 'utf8'));
const mediumFinalReview = JSON.parse(fs.readFileSync(path.resolve(REPO, 'tools/nga-forge/production/characters/swahili/status/crouching-medium-opposed-double-shot-v2-vfx-v6.status.json'), 'utf8'));
const mediumFinalProtectedHashes = JSON.parse(fs.readFileSync(path.resolve(REPO, 'tools/nga-forge/production/characters/swahili/reports/attack-animation-cleanup-v1/crouching-medium-opposed-double-shot-v2-vfx-v6/protected-hash-verification.json'), 'utf8'));
assert.strictEqual(mediumFinalReview.deployable, false, 'Crouching Medium Opposed Split Shot V6 must remain candidate-only');
assert.strictEqual(mediumFinalReview.gate, 'APPROVED_AS_CURRENT_SANDBOX_MOVESET_2026_08_12');
assert.deepStrictEqual(mediumFinalReview.exposures, [12, 9, 7, 10, 11, 11]);
assert.strictEqual(mediumFinalReview.visibleMuzzleEventCount, 2);
assert.strictEqual(mediumFinalReview.simultaneousFiringBeatCount, 1);
assert.strictEqual(mediumFinalReview.proposedRegisteredHitCountPerOpponent, 1);
assert.strictEqual(mediumFinalReview.totalTicks, 60);
assert.strictEqual(mediumFinalProtectedHashes.status, 'PASS', 'all prohibited neighboring assets and packages must remain hash-identical');
const crouchingValidatedHashes = new Map([
  ...crouchingValidation.records.map((frame) => [frame.path, frame.sha256]),
  ...mediumSourceVerification.records.map((frame) => [frame.target, frame.targetSha256])
]);
for (const [sourceId, relativePath] of Object.entries(CROUCHING_MOTION_V1_SOURCE_PATHS)) {
  const source = path.resolve(REPO, relativePath);
  assert.ok(fs.existsSync(source), `missing Crouching Normals Motion V1 source ${sourceId}`);
  const actual = crypto.createHash('sha256').update(fs.readFileSync(source)).digest('hex').toUpperCase();
  assert.strictEqual(actual, crouchingValidatedHashes.get(relativePath), `${sourceId} must preserve its reviewed Motion V1 hash`);
}

const v4Approval = JSON.parse(fs.readFileSync(path.resolve(REPO, 'tools/nga-forge/production/characters/swahili/approvals/crouching-light-v4-base-artwork.approval.json'), 'utf8'));
const v4Hashes = new Map(v4Approval.frames.map((frame) => [frame.approvedPath, frame.approvedSha256]));
for (const [sourceId, relativePath] of Object.entries(CROUCHING_LIGHT_V4_SOURCE_PATHS)) {
  const source = path.resolve(REPO, relativePath);
  assert.ok(fs.existsSync(source), `missing approved Crouching Light V4 source ${sourceId}`);
  const actual = crypto.createHash('sha256').update(fs.readFileSync(source)).digest('hex').toUpperCase();
  assert.strictEqual(actual, v4Hashes.get(relativePath), `${sourceId} must remain byte-identical to the approved V4 record`);
}

const presentationValidation = JSON.parse(fs.readFileSync(path.resolve(REPO, 'tools/nga-forge/production/characters/swahili/reports/attack-animation-cleanup-v1/crouching-light-presentation-v1/presentation-validation.json'), 'utf8'));
for (const assets of Object.values(presentationValidation.vfxAssets)) {
  for (const asset of assets) {
    const source = path.resolve(REPO, asset.path);
    assert.ok(fs.existsSync(source), `missing approved presentation VFX ${asset.path}`);
    const actual = crypto.createHash('sha256').update(fs.readFileSync(source)).digest('hex').toUpperCase();
    assert.strictEqual(actual, asset.sha256, `${asset.path} must remain byte-identical to the presentation review record`);
  }
}
assert.strictEqual(presentationValidation.timing.cameraShakeMaxPixels, 2);
assert.strictEqual(presentationValidation.timing.recoilDrawJoltMaxPixels, 4);
assert.strictEqual(presentationValidation.hitWhiffParity.impactSparkOnWhiff, false);
assert.strictEqual(presentationValidation.hitWhiffParity.impactSparkOnHit, true);

const validation = JSON.parse(fs.readFileSync(path.resolve(REPO, 'tools/nga-forge/production/characters/swahili/reports/attack-animation-cleanup-v1/standing-neutral-normals-motion-v1/structural-validation.json'), 'utf8'));
const validatedHashes = new Map(validation.moves.flatMap((move) => move.frames.map((frame) => [frame.path, frame.sha256])));
for (const [sourceId, relativePath] of Object.entries(STANDING_SOURCE_PATHS)) {
  const source = path.resolve(REPO, relativePath);
  assert.ok(fs.existsSync(source), `missing Standing Normals Motion V1 source ${sourceId}`);
  const actual = crypto.createHash('sha256').update(fs.readFileSync(source)).digest('hex').toUpperCase();
  assert.strictEqual(actual, validatedHashes.get(relativePath), `${sourceId} must preserve its reviewed hash`);
}

const blocked = runMove('standing_medium', { timing: 'weight_emphasized', block: true });
assert.strictEqual(blocked.state.fighters.p2.health, blocked.initialHealth, 'standing medium block must deal zero candidate chip damage');
assert.strictEqual(blocked.contactTicks.length, 1, 'blocked standing medium remains single-hit');

const mirrored = runMove('standing_light', { timing: 'responsive', mirrored: true });
assert.strictEqual(mirrored.state.fighters.p1.facing, -1, 'mirrored P1 must remain opponent-facing');
assert.strictEqual(mirrored.contactTicks.length, 1, 'mirrored Standing Light must retain contact parity');

const blockedSplitShot = runMove('crouching_medium', { crouchingMediumTiming: 'opposed_split_shot_v6', block: true });
assert.strictEqual(blockedSplitShot.state.fighters.p2.health, blockedSplitShot.initialHealth, 'blocked Crouching Medium Opposed Split Shot must deal zero candidate chip damage');
assert.strictEqual(blockedSplitShot.contactTicks.length, 1, 'blocked Crouching Medium Opposed Split Shot must register one simultaneous firing beat against this opponent');

const presentationState = sim.createSwahiliSandbox(735);
sim.setCrouchingMediumOpposedSplitShotV6TimingProfile(presentationState, 'opposed_split_shot_v6');
presentationState.fighters.p1.x = -76;
presentationState.fighters.p2.x = 60;
sim.tickSwahiliSandbox(presentationState, INPUTS.crouching_medium);
let simultaneousMuzzleEventsSeen = 0;
let impactEventsSeen = 0;
while (presentationState.fighters.p1.moveCursor !== null && presentationState.tick < 180) {
  const sample = mediumPresentation.crouchingMediumOpposedSplitShotSample(presentationState.fighters.p1);
  simultaneousMuzzleEventsSeen = Math.max(simultaneousMuzzleEventsSeen, sample.visibleMuzzleEvents);
  impactEventsSeen = Math.max(impactEventsSeen, sample.visibleImpactEvents);
  sim.tickSwahiliSandbox(presentationState, {});
}
assert.strictEqual(simultaneousMuzzleEventsSeen, 2, 'presentation must show both opposed muzzle events on one firing beat');
assert.strictEqual(impactEventsSeen, 1, 'presentation must show one impact family for this opponent');
assert.strictEqual(mediumPresentation.CROUCHING_MEDIUM_OPPOSED_SPLIT_SHOT_V6_PRESENTATION.visibleMuzzleEventCount, 2);
assert.strictEqual(mediumPresentation.CROUCHING_MEDIUM_OPPOSED_SPLIT_SHOT_V6_PRESENTATION.simultaneousFiringBeatCount, 1);
assert.strictEqual(mediumPresentation.CROUCHING_MEDIUM_OPPOSED_SPLIT_SHOT_V6_PRESENTATION.registeredHitCountPerOpponent, 1);
assert.strictEqual(mediumPresentation.CROUCHING_MEDIUM_OPPOSED_SPLIT_SHOT_V6_PRESENTATION.projectileEntityCount, 0, 'split shot must remain a close-range hitbox attack, not a zoning projectile');

const reset = sim.createSwahiliSandbox();
sim.setStandingNormalsMotionV1TimingProfile(reset, 'weight_emphasized');
sim.setCrouchingLightV4TimingProfile(reset, '17_ticks');
sim.setCrouchingMediumOpposedSplitShotV6TimingProfile(reset, 'opposed_split_shot_v6');
sim.setCrouchingHeavyMotionV1TimingProfile(reset, 'weight_emphasized_heavy_sweep');
sim.resetSandboxRound(reset);
assert.strictEqual(reset.fighters.p1.standingNormalTimingProfile, 'weight_emphasized', 'round reset must preserve the selected playtest timing');
assert.strictEqual(reset.fighters.p1.crouchingLightTimingProfile, '17_ticks', 'round reset must preserve the approved Crouching Light timing');
assert.strictEqual(reset.fighters.p1.crouchingMediumTimingProfile, 'opposed_split_shot_v6', 'round reset must preserve the selected Crouching Medium timing');
assert.strictEqual(reset.fighters.p1.crouchingHeavyTimingProfile, 'weight_emphasized_heavy_sweep', 'round reset must preserve the selected Crouching Heavy timing');

console.log('Swahili Ground Normals live-review checks passed:');
console.log('- exact six-pose Light / five-pose Medium source order and reviewed hashes');
console.log('- responsive and weight-emphasized timing profiles');
console.log('- range-normalized hit/whiff duration with no standing-normal motion-review hitstop');
console.log('- single-hit parity, root stability, block, mirroring, and idle return');
console.log('- exact approved five-pose Crouching Light V4 source order and hashes');
console.log('- approved 17-tick Crouching Light timing with one-tick shot and one-tick hitstop');
console.log('- exact Variant D VFX source hashes; hit-only impact policy remains intact');
console.log('- Crouching Heavy Motion V1 connector order, dual timing profiles, single-hit parity, and unchanged temporary sandbox combat values');
console.log('- Crouching Medium Opposed Split Shot V6 six-pose order, 60-tick weight, simultaneous left/right muzzle events, one-hit-per-opponent parity, preserved 65 damage, and approved current-sandbox boundary');
