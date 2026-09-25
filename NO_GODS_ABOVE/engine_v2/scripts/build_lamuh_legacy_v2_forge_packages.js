const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

const engineRoot = path.resolve(__dirname, '..');
const projectRoot = path.resolve(engineRoot, '..', '..');
const contentRoot = path.join(engineRoot, 'content-source', 'characters', 'lamuh-legacy-v2');
const frameRoot = path.join(contentRoot, 'source-frames');
const timing = JSON.parse(fs.readFileSync(path.join(contentRoot, 'timing-candidates.v1.json'), 'utf8'));
const timingByMove = Object.fromEntries(timing.moves.map((move) => [move.moveId, move]));
const reviewData = JSON.parse(fs.readFileSync(path.join(engineRoot, 'public', 'lamuh-legacy-v2', 'review-data.json'), 'utf8'));
// Every move that has a V2 closure must have its package describe the V2 art, not the retired V1
// source cells. Previously only the three air normals did, which is why they were the only attack
// packages whose frame count and exposure track agreed with what the review harness actually plays;
// the rest still described 4-frame V1 clips while 6- and 7-frame V2 clips were on screen.
const closureKeys = {
  standing_light: 'standingLightClosure', standing_medium: 'standingMediumClosure', standing_heavy: 'standingHeavyClosure',
  crouching_light: 'crouchingLightClosure', crouching_medium: 'crouchingMediumClosure', crouching_heavy: 'crouchingHeavyClosure',
  air_light: 'airLightClosure', air_medium: 'airMediumClosure', air_heavy: 'airHeavyClosure'
};
// Continuous movement loops carry no startup/active/recovery split, so their V2 art and exposures
// can be adopted without inventing a phase boundary. `crouch` and `jump` are deliberately excluded:
// their package length is a gameplay claim (crouch release, jump startup) while their runtime
// timeline is a longer presentation loop, and deciding which is authoritative is a design call.
const movementLoopIds = new Set(['idle', 'walk_forward', 'walk_backward', 'dash_forward', 'dash_backward']);
const movementLoopFor = (moveId, data) => movementLoopIds.has(moveId) && data.movementModernization
  ? { frames: data.movementModernization.states[moveId].frames, canvas: data.movementModernization.canvas, root: data.movementModernization.root }
  : null;

const closureFor = (moveId, data) => {
  if (moveId === 'ascend_step_light') return data.ascendStepFamily?.variants?.light || null;
  if (moveId === 'ascend_step') return data.ascendStepFamily?.variants?.medium || data.ascendStepClosure;
  if (moveId === 'ascend_step_heavy') return data.ascendStepFamily?.variants?.heavy || null;
  return closureKeys[moveId] ? data[closureKeys[moveId]] : null;
};
const throwAnimationFamily = reviewData.throwAnimations || null;
const repoUri = (absolutePath) => `repo://${path.relative(projectRoot, absolutePath).replaceAll('\\', '/')}`;
const sha256 = (absolutePath) => crypto.createHash('sha256').update(fs.readFileSync(absolutePath)).digest('hex').toUpperCase();
const writeJson = (absolutePath, value) => {
  fs.mkdirSync(path.dirname(absolutePath), { recursive: true });
  fs.writeFileSync(absolutePath, `${JSON.stringify(value, null, 2)}\n`, 'utf8');
};

const recordsRoot = path.join(contentRoot, 'records');
const approvalPath = path.join(recordsRoot, 'first-playable-human-review.pending.json');
const provenancePath = path.join(recordsRoot, 'legacy-source-provenance.json');
const metadataPath = path.join(recordsRoot, 'source-frame-metadata.json');
writeJson(approvalPath, {
  technicalStatus: 'LOCAL_CANDIDATE_AWAITING_HUMAN_REVIEW', humanReviewStatus: null,
  allowedHumanStatuses: ['APPROVED_AS_PRODUCTION_BASELINE', 'APPROVED_FOR_CURRENT_PRODUCTION_BASELINE_WITH_POLISH_DEBT', 'APPROVED_V1_MOTION_PRESERVED', 'APPROVED_V2_RETIMING', 'APPROVED_V2_COMBAT_PROFILE', 'APPROVED_STANDARD_GRAB', 'APPROVED_FORWARD_THROW', 'APPROVED_BACK_THROW', 'APPROVED_WITH_TARGETED_REPAIR', 'REJECTED_V2_LOST_V1_FLOW', 'REJECTED_FOR_TIMING', 'REJECTED_FOR_MOTION_REVISION', 'REJECTED_FOR_COMBAT_REDESIGN', 'BLOCKED_MANUAL_ART', 'DEFERRED_NOT_BLOCKING'],
  candidateOnly: true, deployable: false, approvedBy: null, approvedAt: null
});
writeJson(provenancePath, { sourceType: 'legacy_import', sourceLock: '../source-lock.v1.json', originalFilesModified: false, humanApproval: 'pending' });
writeJson(metadataPath, { canvas: [448, 448], baselineY: 382, anchor: 'bottom_center', sourceFacing: 'right', source: 'hash_locked_v1_atlas_cell' });

const pose = (id, elevation = 'grounded', weight = 'neutral', verticalMotion = 'stationary') => ({
  id, facing: 'forward', elevation, plantedFoot: elevation === 'airborne' ? 'none' : id === 'crouch' ? 'both' : 'both', weight,
  weaponState: 'legacy_lamuh_body', handOccupancy: { left: 'free', right: 'free' },
  silhouette: id === 'crouch' ? 'compact_low_lamuh' : id === 'airborne' ? 'airborne_lamuh_arc' : 'upright_lamuh_ready', verticalMotion
});
const poses = {
  neutral_stand: pose('neutral_stand'), crouch: pose('crouch', 'grounded', 'low'),
  airborne: pose('airborne', 'airborne', 'airborne', 'rising')
};
const durationBasis = ['move_weight', 'readability', 'combat_role', 'risk_reward', 'character_identity', 'animation_quality', 'balance'];

const timingSpec = (moveId) => {
  const candidate = timingByMove[moveId].candidates.B;
  return { phases: [candidate.phaseTicks.startup, candidate.phaseTicks.active, candidate.phaseTicks.recovery], exposures: candidate.exposureTicks };
};
const specs = [
  { id: 'idle', source: 'idle', exposures: [8, 8, 8, 8, 7, 7, 7, 7], phases: [0, 60, 0], damage: 0 },
  { id: 'walk_forward', source: 'walk_forward', exposures: [3, 3, 3, 3, 3, 3], phases: [0, 18, 0], damage: 0 },
  { id: 'walk_backward', source: 'walk_backward', exposures: [3, 3, 3, 3, 3, 3], phases: [0, 18, 0], damage: 0 },
  { id: 'dash_forward', source: 'dash_forward', exposures: [3, 3, 3, 3, 3, 3], phases: [0, 18, 0], damage: 0 },
  { id: 'dash_backward', source: 'dash_backward', exposures: [4, 4, 3, 3, 3, 3], phases: [0, 20, 0], damage: 0 },
  { id: 'crouch', source: 'crouch', exposures: [2, 2, 2, 2], phases: [2, 4, 2], damage: 0, pose: 'crouch' },
  { id: 'jump', source: 'jump', exposures: [3, 3, 3, 3], phases: [4, 8, 0], damage: 0, airborne: true },
  { id: 'air_dash_forward', source: 'air_dash_forward', exposures: [2, 2, 2, 3, 3, 2], phases: [2, 10, 2], damage: 0, airborne: true },
  { id: 'air_dash_backward', source: 'air_dash_backward', exposures: [2, 2, 3, 3, 4], phases: [2, 10, 2], damage: 0, airborne: true },
  { id: 'standing_block', source: 'standing_block', exposures: [4, 4, 4, 4], phases: [4, 8, 4], damage: 0 },
  { id: 'light_reaction', source: 'light_reaction', exposures: [3, 3, 3, 3, 3], phases: [0, 9, 6], damage: 0 },
  { id: 'standing_light', source: 'standing_light', ...timingSpec('standing_light'), damage: 24, hitstop: 4, hitstun: 18, blockstun: 10 },
  { id: 'standing_medium', source: 'standing_medium', ...timingSpec('standing_medium'), damage: 48, hitstop: 5, hitstun: 29, blockstun: 17 },
  { id: 'standing_heavy', source: 'standing_heavy', ...timingSpec('standing_heavy'), damage: 82, hitstop: 8, hitstun: 42, blockstun: 24 },
  { id: 'crouching_light', source: 'standing_light', ...timingSpec('crouching_light'), damage: 22, hitstop: 3, hitstun: 18, blockstun: 10, pose: 'crouch' },
  { id: 'crouching_medium', source: 'standing_medium', ...timingSpec('crouching_medium'), damage: 44, hitstop: 5, hitstun: 27, blockstun: 16, pose: 'crouch' },
  { id: 'crouching_heavy', source: 'crouching_heavy', ...timingSpec('crouching_heavy'), damage: 70, hitstop: 8, hitstun: 42, blockstun: 24, pose: 'crouch' },
  { id: 'air_light', source: 'air_light', ...timingSpec('air_light'), damage: 22, hitstop: 3, hitstun: 20, blockstun: 12, airborne: true, vfx: false },
  { id: 'air_medium', source: 'air_medium', ...timingSpec('air_medium'), damage: 44, hitstop: 4, hitstun: 25, blockstun: 15, airborne: true, vfx: false },
  { id: 'air_heavy', source: 'air_heavy', ...timingSpec('air_heavy'), damage: 72, hitstop: 7, hitstun: 30, blockstun: 18, airborne: true, vfx: false },
  { id: 'ascend_step_light', source: 'ascend_step', ...timingSpec('ascend_step_light'), damage: 32, hitstop: 5, hitstun: 22, blockstun: 12 },
  { id: 'ascend_step', source: 'ascend_step', ...timingSpec('ascend_step'), damage: 70, hitstop: 8, hitstun: 34, blockstun: 18 },
  { id: 'ascend_step_heavy', source: 'ascend_step_heavy', ...timingSpec('ascend_step_heavy'), damage: 84, hitstop: 9, hitstun: 36, blockstun: 20 },
  { id: 'universal_grab_attempt', source: 'universal_grab_attempt', exposures: [3, 2, 3, 3, 4, 5], phases: [4, 2, 14], damage: 0, dedicatedThrowArt: true },
  { id: 'forward_throw', source: 'forward_throw', exposures: [6, 2, 3, 4, 5, 12], phases: [4, 11, 17], damage: 70, hitstop: 6, dedicatedThrowArt: true, throw: true },
  { id: 'back_throw', source: 'back_throw', exposures: [6, 2, 4, 4, 6, 14], phases: [4, 13, 19], damage: 75, hitstop: 7, dedicatedThrowArt: true, throw: true }
];
const airNormalsOnly = process.argv.includes('--air-normals-only');
const throwsOnly = process.argv.includes('--throws-only');
const ascendStepFamilyOnly = process.argv.includes('--ascend-step-family-only');
if ([airNormalsOnly, throwsOnly, ascendStepFamilyOnly].filter(Boolean).length > 1) throw new Error('Choose only one focused Forge build mode');
const buildSpecs = airNormalsOnly
  ? specs.filter((spec) => ['air_light', 'air_medium', 'air_heavy'].includes(spec.id))
  : throwsOnly
    ? specs.filter((spec) => ['universal_grab_attempt', 'forward_throw', 'back_throw'].includes(spec.id))
    : ascendStepFamilyOnly
      ? specs.filter((spec) => ['ascend_step_light', 'ascend_step', 'ascend_step_heavy'].includes(spec.id))
      : specs;

// These candidate records mirror the Lamuh Legacy V2 runtime profile. The focused parity test
// compares every field back to src/data/fighters.ts so Forge metadata cannot silently drift.
const runtimeCombatProfiles = {
  standing_light: { runtimeId: 'standing_light', hitboxId: 'legacy_5l', rect: { x: 26, y: -82, w: 62, h: 36 }, damage: 24, hitstop: 4, hitstun: 18, blockstun: 10, knockbackX: 2.3, knockbackY: 0, level: 'mid', cancelOnHit: ['standing_medium', 'crouching_medium'], cancelOnBlock: ['standing_medium', 'crouching_medium'] },
  standing_medium: { runtimeId: 'standing_medium', hitboxId: 'legacy_5m', rect: { x: 30, y: -90, w: 82, h: 44 }, damage: 48, hitstop: 5, hitstun: 29, blockstun: 17, knockbackX: 3.1, knockbackY: 0, level: 'mid', cancelOnHit: ['standing_heavy', 'crouching_heavy', 'legacy_ascend_step'], cancelOnBlock: ['standing_heavy', 'crouching_heavy'] },
  standing_heavy: { runtimeId: 'standing_heavy', hitboxId: 'legacy_5h', rect: { x: 38, y: -96, w: 104, h: 54 }, damage: 82, hitstop: 8, hitstun: 42, blockstun: 24, knockbackX: 5.5, knockbackY: -3, level: 'mid', knockdown: 'soft', cancelOnHit: [], cancelOnBlock: [] },
  crouching_light: { runtimeId: 'crouching_light', hitboxId: 'legacy_2l', rect: { x: 22, y: -40, w: 62, h: 30 }, damage: 22, hitstop: 3, hitstun: 18, blockstun: 10, knockbackX: 2.1, knockbackY: 0, level: 'low', cancelOnHit: ['crouching_medium'], cancelOnBlock: ['crouching_medium'] },
  crouching_medium: { runtimeId: 'crouching_medium', hitboxId: 'legacy_2m', rect: { x: 26, y: -44, w: 102, h: 32 }, damage: 44, hitstop: 5, hitstun: 27, blockstun: 16, knockbackX: 3, knockbackY: 0, level: 'low', cancelOnHit: ['crouching_heavy'], cancelOnBlock: ['crouching_heavy'] },
  crouching_heavy: { runtimeId: 'crouching_heavy', hitboxId: 'legacy_2h', rect: { x: 24, y: -118, w: 94, h: 116 }, damage: 70, hitstop: 8, hitstun: 42, blockstun: 24, knockbackX: 1.8, knockbackY: -15.5, level: 'launcher', launches: true, jumpCancelOnHit: true, juggleCost: 0, cancelOnHit: [], cancelOnBlock: [] },
  air_light: { runtimeId: 'air_light', hitboxId: 'legacy_jl', rect: { x: 18, y: -80, w: 68, h: 34 }, damage: 22, hitstop: 3, hitstun: 20, blockstun: 12, knockbackX: 1.7, knockbackY: -1.5, level: 'mid', juggleCost: 1, cancelOnHit: ['air_medium', 'air_heavy'], cancelOnBlock: ['air_medium', 'air_heavy'] },
  air_medium: { runtimeId: 'air_medium', hitboxId: 'legacy_jm_kick', rect: { x: 24, y: -74, w: 78, h: 44 }, damage: 44, hitstop: 4, hitstun: 25, blockstun: 15, knockbackX: 2.8, knockbackY: -7, level: 'mid', juggleCost: 2, cancelOnHit: ['air_heavy'], cancelOnBlock: ['air_heavy'] },
  air_heavy: { runtimeId: 'air_heavy', hitboxId: 'legacy_jh', rect: { x: 20, y: -86, w: 86, h: 64 }, damage: 72, hitstop: 7, hitstun: 30, blockstun: 18, knockbackX: 5, knockbackY: 5, level: 'mid', knockdown: 'soft', juggleCost: 2, cancelOnHit: [], cancelOnBlock: [] },
  ascend_step_light: { runtimeId: 'legacy_ascend_step_light', hitboxId: 'legacy_ascend_step_light', rect: { x: 28, y: -86, w: 88, h: 48 }, damage: 32, hitstop: 5, hitstun: 22, blockstun: 12, knockbackX: 3.5, knockbackY: 0, level: 'mid', knockdown: 'none', cancelOnHit: [], cancelOnBlock: [] },
  ascend_step: {
    runtimeId: 'legacy_ascend_step', hitboxId: 'legacy_ascend_step_medium_slide', rect: { x: 20, y: -48, w: 130, h: 42 },
    damage: 70, hitstop: 8, hitstun: 34, blockstun: 18, knockbackX: 2.8, knockbackY: -15.5,
    level: 'launcher', launches: true, juggleCost: 1, expectedScaledRouteDamage: 66, cancelOnHit: [], cancelOnBlock: [],
    hitboxes: [
      { id: 'legacy_ascend_step_medium_slide', start: 7, end: 9, rect: { x: 20, y: -48, w: 130, h: 42 }, damage: 26, hitstop: 5, hitstun: 28, blockstun: 16, knockbackX: 1, knockbackY: 0, level: 'low', juggleCost: 0 },
      { id: 'legacy_ascend_step_medium_backspring_launcher', start: 26, end: 28, rect: { x: 12, y: -176, w: 122, h: 166 }, damage: 44, hitstop: 8, hitstun: 34, blockstun: 18, knockbackX: 3.4, knockbackY: -15.5, level: 'launcher', juggleCost: 1 }
    ]
  },
  ascend_step_heavy: { runtimeId: 'legacy_ascend_step_heavy', hitboxId: 'legacy_ascend_step_heavy_blast', rect: { x: 24, y: -108, w: 142, h: 76 }, damage: 84, hitstop: 9, hitstun: 36, blockstun: 20, knockbackX: 7.5, knockbackY: -2, level: 'mid', knockdown: 'soft', cancelOnHit: [], cancelOnBlock: [], targetSideSwitch: { triggerTick: 14, captureRange: 150, behindDistance: 62, verticalTolerance: 110, requireTargetAhead: true, faceTargetAfterSwitch: true } }
};
for (const spec of specs) {
  const profile = runtimeCombatProfiles[spec.id];
  if (!profile) continue;
  if (spec.damage !== profile.damage || (spec.hitstop || 0) !== profile.hitstop || (spec.hitstun || 0) !== profile.hitstun || (spec.blockstun || 0) !== profile.blockstun) throw new Error(`${spec.id} Forge/runtime combat profile drift`);
  spec.runtimeCombatProfile = profile;
}

const packagePaths = [];
for (const spec of buildSpecs) {
  // Adopt the V2 movement art and its timeline before length and phases are read from the spec.
  const movementLoop = movementLoopFor(spec.id, reviewData);
  if (movementLoop) {
    const timeline = reviewData.runtimeTimelines[spec.id];
    if (!timeline) throw new Error(`Missing runtime timeline for movement loop ${spec.id}`);
    if (timeline.exposureTicks.length !== movementLoop.frames.length) throw new Error(`${spec.id} movement timeline drops authored frames`);
    spec.exposures = timeline.exposureTicks;
    spec.phases = [0, timeline.durationTicks, 0];
  }
  const simulationLength = spec.exposures.reduce((sum, value) => sum + value, 0);
  const [startup, active, recovery] = spec.phases;
  if (startup + active + recovery !== simulationLength) throw new Error(`${spec.id} phase mismatch`);
  const airClosure = closureFor(spec.id, reviewData);
  const throwSequence = spec.dedicatedThrowArt ? throwAnimationFamily?.sequences?.[spec.id] : null;
  if (spec.dedicatedThrowArt && !throwSequence) throw new Error(`Missing dedicated Lamuh throw animation sequence: ${spec.id}`);
  const sourceDirectory = path.join(frameRoot, spec.source);
  const v2Art = airClosure ? airClosure.v2 : movementLoop;
  const frameFiles = v2Art
    ? v2Art.frames.map((frame) => path.join(engineRoot, 'public', frame.publicPath.replace(/^\//, '')))
    : throwSequence
      ? throwSequence.frames.map((frame) => path.join(engineRoot, 'public', frame.publicPath.replace(/^\//, '')))
    : [...Array(spec.exposures.length)].map((_, index) => path.join(sourceDirectory, `${spec.source}_${String(index).padStart(2, '0')}.png`));
  if (frameFiles.length !== spec.exposures.length) throw new Error(`${spec.id} authored frame/exposure mismatch`);
  for (const frameFile of frameFiles) if (!fs.existsSync(frameFile)) throw new Error(`Missing extracted source frame: ${frameFile}`);
  const frameWidth = v2Art ? v2Art.canvas.width : throwSequence ? throwAnimationFamily.canvas.width : 448;
  const frameHeight = v2Art ? v2Art.canvas.height : throwSequence ? throwAnimationFamily.canvas.height : 448;
  const authoredRoot = v2Art ? v2Art.root : throwSequence ? throwAnimationFamily.root : { x: 224, y: 382 };
  const frameIds = frameFiles.map((_, index) => `${spec.id}_frame_${String(index).padStart(2, '0')}`);
  const sourceFrames = frameFiles.map((frameFile, index) => ({
    id: frameIds[index], sourceUri: repoUri(frameFile), width: frameWidth, height: frameHeight, sha256: sha256(frameFile),
    approvalUri: repoUri(approvalPath),
    provenanceUri: throwSequence ? `repo://${throwAnimationFamily.hashLock.path}` : repoUri(provenancePath),
    metadataUri: throwSequence ? `repo://${throwAnimationFamily.normalizationReport.path}` : repoUri(metadataPath)
  }));
  let exposureStart = 0;
  const exposures = spec.exposures.map((duration, index) => {
    const exposure = { sourceFrameId: frameIds[index], start: exposureStart, duration };
    exposureStart += duration;
    return exposure;
  });
  const selectedPose = spec.airborne ? poses.airborne : spec.pose === 'crouch' ? poses.crouch : poses.neutral_stand;
  const range = (start, length) => length > 0 ? [{ start, end: start + length - 1 }] : [];
  const activeStart = startup;
  const activeEnd = startup + active - 1;
  const profile = spec.runtimeCombatProfile;
  const runtimeHitboxes = profile ? profile.hitboxes || [{
    id: profile.hitboxId || profile.runtimeId, start: activeStart, end: activeEnd, rect: profile.rect, damage: profile.damage, hitstop: profile.hitstop,
    hitstun: profile.hitstun, blockstun: profile.blockstun, knockbackX: profile.knockbackX, knockbackY: profile.knockbackY,
    level: profile.level, juggleCost: profile.juggleCost ?? 0
  }] : spec.damage > 0 ? [{ id: spec.id, start: activeStart, end: activeEnd, rect: { x: 0, y: -172, w: spec.throw ? 96 : 120, h: spec.throw ? 120 : 92 }, damage: spec.damage, hitstop: spec.hitstop || 0, hitstun: spec.hitstun || 0, blockstun: spec.blockstun || 0 }] : [];
  const presentationTrack = spec.damage > 0 && spec.vfx !== false ? runtimeHitboxes.map((hitbox, index) => ({
    index, frame: hitbox.start, type: 'spawn_vfx', eventIdTemplate: '{matchId}:{simulationFrame}:{fighterId}:{moveInstance}:{eventIndex}',
    payload: { profile: spec.throw ? 'lamuh_standard_throw_contact_candidate' : 'lamuh_legacy_contact_candidate', socket: 'contact', hitboxId: hitbox.id, candidateOnly: true }
  })) : [];
  const packageValue = {
    schemaVersion: '2.1.0-contract', id: spec.id, version: 1, promotionState: 'candidate', simulationLength,
    sourceFrames, exposures,
    phases: {
      anticipation: startup > 1 ? [{ start: 0, end: startup - 1 }] : [], startup: range(0, startup), active: range(startup, active),
      impact: spec.damage > 0 ? runtimeHitboxes.map((hitbox) => ({ start: hitbox.start, end: hitbox.start })) : [],
      followThrough: recovery > 0 ? [{ start: startup + active, end: Math.min(simulationLength - 1, startup + active + Math.max(0, Math.floor(recovery / 2) - 1)) }] : [],
      recovery: range(startup + active, recovery)
    },
    entryPose: selectedPose, exitPose: selectedPose, interruptPoses: [selectedPose], transitions: [],
    landing: spec.airborne ? [{ start: 0, end: simulationLength - 1, result: 'seamless_continuation' }] : [],
    anchors: exposures.map((exposure, index) => ({ frame: exposure.start, sourceFrameId: frameIds[index], root: authoredRoot, feet: authoredRoot, effect: v2Art || throwSequence ? { x: authoredRoot.x + 320, y: authoredRoot.y - 420 } : { x: 320, y: 220 }, nearFoot: authoredRoot, farFoot: authoredRoot, groundingContract: v2Art || throwSequence ? 'lamuh_legacy_v2_fixed_root_candidate_v1' : 'lamuh_legacy_v1_bottom_center_v1' })),
    combatTrack: {
      startup, active, recovery, damage: spec.damage, hitstop: spec.hitstop || 0, hitstun: spec.hitstun || 0, blockstun: spec.blockstun || 0,
      boxes: spec.damage > 0 ? runtimeHitboxes.map((hitbox) => ({
        frame: hitbox.start, endFrame: hitbox.end, id: hitbox.id, kind: spec.throw ? 'throw' : 'hit',
        x: authoredRoot.x + hitbox.rect.x, y: authoredRoot.y + hitbox.rect.y,
        width: hitbox.rect.w, height: hitbox.rect.h
      })) : [],
      cancelWindows: profile && new Set([...profile.cancelOnHit, ...profile.cancelOnBlock]).size ? [{ start: activeStart, end: simulationLength - 1, targets: [...new Set([...profile.cancelOnHit, ...profile.cancelOnBlock])] }] : [],
      timingAuthorship: { simulationTickRateHz: 60, authoredTotalDuration: simulationLength, durationModel: 'independently_authored_per_move', durationBasis, uniformDurationNormalizationProhibited: true, visualGameplayAlignment: 'aligned_by_default', timingExceptions: [] }
    },
    presentationTrack,
    playbackPolicy: { mode: 'fixed_timeline', cursorOwner: 'simulation', hitstopFreezesCursor: true, holdBehavior: 'none' },
    interruptionBehavior: { owner: 'simulation', allowedSources: ['incoming_hit', 'incoming_throw', 'round_end', 'forced_state'], onInterrupt: 'simulation_selects_target_state', returnStatePolicy: 'return_only_after_authored_recovery_or_forced_state' },
    groundingTrack: frameIds.map((sourceFrameId) => ({ sourceFrameId, root: authoredRoot, nearFoot: authoredRoot, farFoot: authoredRoot, nearFootRole: spec.airborne ? 'not_applicable_airborne' : 'principal_support', farFootRole: spec.airborne ? 'not_applicable_airborne' : 'secondary_support', projectedGroundPlaneY: authoredRoot.y, contractVersion: v2Art ? 'lamuh_legacy_v2_fixed_root_candidate_v1' : 'lamuh_legacy_v1_bottom_center_v1' })),
    facingBehavior: { authoredFacing: 'P1_screen_right', runtimeP2: 'horizontal_mirror_screen_left', mirrorAxisX: authoredRoot.x, losslessMirrorRequired: true },
    transitionCompatibility: [{ fromStates: spec.airborne ? ['jump', 'air_recovery'] : spec.pose === 'crouch' ? ['crouch', 'idle'] : ['idle', 'walk_forward', 'walk_backward', 'crouch'], toState: spec.id, condition: 'simulation_command_or_state_entry', addsGameplayFrames: false }],
    presentationSockets: [{ id: 'contact', x: 320, y: 220, mirrorRule: 'x_prime_equals_canvas_width_minus_x', eventTypes: ['spawn_vfx', 'play_sound'] }],
    gameplayTimingStatus: { owner: 'simulation', state: 'sandbox_candidate_awaiting_combat_approval', authoritative: false, candidateValues: {
      runtimeProfile: 'B', throwPlaceholder: false, dedicatedThrowArt: !!throwSequence,
      ...(profile ? {
        runtimeAttackId: profile.runtimeId,
        runtimeHitbox: profile.rect,
        runtimeHitboxes,
        expectedScaledRouteDamage: profile.expectedScaledRouteDamage ?? profile.damage,
        knockback: { x: profile.knockbackX, y: profile.knockbackY }, level: profile.level,
        knockdown: profile.knockdown || 'none', launches: !!profile.launches, jumpCancelOnHit: !!profile.jumpCancelOnHit, juggleCost: profile.juggleCost ?? 0,
        cancelOnHit: profile.cancelOnHit, cancelOnBlock: profile.cancelOnBlock,
        ...(profile.targetSideSwitch ? { targetSideSwitch: profile.targetSideSwitch } : {}),
        counterHitCandidate: { enabledInRuntime: false, damageMultiplier: 1.08, extraHitstunTicks: spec.id.includes('heavy') ? 4 : 2, extraHitstopTicks: spec.id.includes('heavy') ? 2 : 1 },
        meterCandidate: { tensionOnHit: 16, tensionOnBlock: 5 },
        scalingCandidate: { initialProration: 1, perHitStep: 0.08, minimum: 0.5 }
      } : {})
    }, notes: ['Candidate timing only; human review is required.', throwSequence ? 'Dedicated modern Lamuh attacker art is hash-locked for standard-grab/throw review; the existing deterministic victim track and combat values are unchanged.' : airClosure ? 'Hash-locked V1 motion references are preserved; targeted V2 connector art and the runtime profile are parity-tested against this package.' : 'V1 source-frame order is preserved and the runtime profile is parity-tested against this package.'] },
    approvalRecords: [repoUri(approvalPath)],
    validation: { hardGates: ['contract_shape', 'source_sha256', 'exposure_coverage', 'phase_bounds', 'rollback_event_identity', 'simulation_owns_cursor', 'grounding_track'], creativeWarnings: [], humanApprovalRequired: true },
    provenance: { sourceType: throwSequence ? 'new_v2_missing_state_authoring' : airClosure ? 'v1_motion_referenced_targeted_v2_connector_reconstruction' : 'legacy_import', tool: 'NGA Forge contract compiler and Codex', model: airClosure || throwSequence ? 'OpenAI built-in image generation edit mode' : null, createdAt: throwSequence ? '2026-08-31T00:00:00.000Z' : airClosure ? '2026-08-29T00:00:00.000Z' : '2026-08-26T00:00:00.000Z', promptHash: null, seed: null, references: throwSequence ? [`repo://${throwAnimationFamily.hashLock.path}`, `repo://${throwAnimationFamily.normalizationReport.path}`] : [repoUri(path.join(contentRoot, 'source-lock.v1.json')), repoUri(path.join(contentRoot, 'source-audit.v1.json'))], revisionChain: throwSequence ? ['V2_MISSING_STATE_AUTHORING', 'V2_FIXED_ROOT_NORMALIZATION', 'V2_STANDARD_HUMANOID_THROW_BINDING'] : airClosure ? ['V1_HASH_LOCK', 'V2_SINGLE_HIT_REPAIR', 'V2_TARGETED_CONNECTOR_RECONSTRUCTION'] : ['V1_HASH_LOCK', 'V2_FIRST_PLAYABLE_CANDIDATE'], cleanupOperations: airClosure || throwSequence ? ['targeted_connector_authoring', 'chroma_background_removal', 'fixed_root_normalization', 'single_sequence_scale'] : ['lossless_atlas_cell_extraction', 'metadata_only_retiming'], humanApproval: { state: 'pending', approvedBy: null, approvedAt: null }, licensingNotes: ['Local candidate-only legacy game asset; not approved for deployment.'] }
  };
  const packagePath = path.join(contentRoot, 'moves', spec.id.replaceAll('_', '-'), 'animation.package.json');
  writeJson(packagePath, packageValue);
  packagePaths.push({ id: spec.id, path: path.relative(contentRoot, packagePath).replaceAll('\\', '/') });
}

if (airNormalsOnly || throwsOnly || ascendStepFamilyOnly) {
  const bundlePath = path.join(contentRoot, 'character.bundle.json');
  if (!fs.existsSync(bundlePath)) throw new Error('Focused Forge build requires the existing Lamuh character bundle');
  const bundle = JSON.parse(fs.readFileSync(bundlePath, 'utf8'));
  const focusedPaths = packagePaths.map((record) => record.path);
  bundle.animationPackages = [...new Set([
    ...bundle.animationPackages.filter((record) => !focusedPaths.some((focusedPath) => record === focusedPath)),
    ...focusedPaths
  ])];
  if (airNormalsOnly) bundle.packageGroups.air_normals = ['air_light', 'air_medium', 'air_heavy'];
  else if (throwsOnly) bundle.packageGroups.throws = ['universal_grab_attempt', 'forward_throw', 'back_throw'];
  else bundle.packageGroups.specials = ['ascend_step_light', 'ascend_step', 'ascend_step_heavy'];
  writeJson(bundlePath, bundle);
  if (ascendStepFamilyOnly) {
    const firstPlayablePath = path.join(contentRoot, 'first-playable.bundle.json');
    const firstPlayable = JSON.parse(fs.readFileSync(firstPlayablePath, 'utf8'));
    firstPlayable.coverage.specials = ['ascend_step_light', 'ascend_step', 'ascend_step_heavy'];
    firstPlayable.forgePackageCount = bundle.animationPackages.length;
    writeJson(firstPlayablePath, firstPlayable);
  }
  console.log(airNormalsOnly
    ? `Built ${packagePaths.length} Lamuh Legacy V2 air-normal Forge candidate packages from hash-locked V1 motion references and targeted connector strips.`
    : throwsOnly
      ? `Built ${packagePaths.length} Lamuh Legacy V2 standard-grab/throw Forge candidate packages from dedicated fixed-root V2 attacker art.`
      : `Built ${packagePaths.length} Lamuh Legacy V2 Ascend Step L/M/H Forge candidate packages with authored visual anchors, simulation-owned movement, and deterministic combat metadata.`);
  process.exit(0);
}

const group = (ids) => ids.filter((id) => packagePaths.some((record) => record.id === id));
// Packages authored by other build stages (currently turn/facing) live in the bundle but are not in
// this script's spec list. A full run must carry them forward, or it silently drops them from the
// bundle and from the compiled manifest.
const generatedPaths = packagePaths.map((record) => record.path);
const existingBundlePath = path.join(contentRoot, 'character.bundle.json');
const carriedPaths = fs.existsSync(existingBundlePath)
  ? JSON.parse(fs.readFileSync(existingBundlePath, 'utf8')).animationPackages
      .filter((record) => !generatedPaths.includes(record))
      .filter((record) => fs.existsSync(path.join(contentRoot, record)))
  : [];
const carriedIds = carriedPaths.map((record) => JSON.parse(fs.readFileSync(path.join(contentRoot, record), 'utf8')).id);
const groupWithCarried = (ids) => ids.filter((id) => packagePaths.some((record) => record.id === id) || carriedIds.includes(id));
const bundle = {
  schemaVersion: '2.1.0-contract', id: 'lamuh_legacy_v2', displayName: 'LAMUH Legacy V2', bundleVersion: 1, promotionState: 'candidate',
  runtimeProfile: { worldHeight: 164, centerline: 224, footPosition: 382, handReach: 120, universalCapabilities: ['ground_normals', 'air_normals', 'standing_block', 'hit_reaction', 'standard_throw'] },
  poseLibrary: Object.values(poses),
  animationPackages: [...generatedPaths, ...carriedPaths],
  packageGroups: {
    movement: groupWithCarried(['idle', 'walk_forward', 'walk_backward', 'dash_forward', 'dash_backward', 'crouch', 'jump', 'air_dash_forward', 'air_dash_backward', 'turn_facing']),
    defense: group(['standing_block', 'light_reaction']),
    ground_normals: group(['standing_light', 'standing_medium', 'standing_heavy', 'crouching_light', 'crouching_medium', 'crouching_heavy']),
    air_normals: group(['air_light', 'air_medium', 'air_heavy']), specials: group(['ascend_step_light', 'ascend_step', 'ascend_step_heavy']), throws: group(['universal_grab_attempt', 'forward_throw', 'back_throw'])
  },
  design: { characterBible: repoUri(path.join(contentRoot, 'COMBAT_IDENTITY.md')), palette: repoUri(path.join(contentRoot, 'source-lock.v1.json')), forbiddenMutations: ['identity_drift', 'major_scale_drift', 'root_teleportation', 'broken_anatomy', 'costume_mutation', 'squash_stretch_suppression'] }
};
writeJson(path.join(contentRoot, 'character.bundle.json'), bundle);
console.log(`Built ${packagePaths.length} Lamuh Legacy V2 Forge candidate packages from ${new Set(specs.map((spec) => spec.source)).size} protected V1 source rows; carried ${carriedPaths.length} package(s) authored by other stages.`);
