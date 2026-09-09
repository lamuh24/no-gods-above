#!/usr/bin/env node
const assert = require('assert');
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const { compileFromPath, stableJson } = require('./production_contracts');

const engineRoot = path.resolve(__dirname, '..');
const projectRoot = path.resolve(engineRoot, '..', '..');
const contentRoot = path.join(engineRoot, 'content-source/characters/lamuh-legacy-v2');
const outputRoot = path.join(contentRoot, 'quality-reaction-packages');
const sourcePath = path.join(contentRoot, 'reactions-quality.v1.json');
const bundlePath = path.join(outputRoot, 'quality-reactions.bundle.json');
const compiledPath = path.join(engineRoot, 'generated/manifests/lamuh_quality_reactions_v1.candidate.runtime.json');
const checkOnly = process.argv.includes('--check');
const readJson = (file) => JSON.parse(fs.readFileSync(file, 'utf8'));
const hash = (file) => crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex').toUpperCase();
const uri = (file) => `repo://${path.relative(projectRoot, file).replaceAll('\\', '/')}`;
const source = readJson(sourcePath);
const template = readJson(path.join(contentRoot, 'moves/light-reaction/animation.package.json'));
const baseBundle = readJson(path.join(contentRoot, 'character.bundle.json'));
const approvalPath = path.join(outputRoot, 'records/human-review.pending.json');
const provenancePath = path.join(outputRoot, 'records/provenance.json');
const metadataPath = path.join(outputRoot, 'records/registration-and-playback.json');
const root = { x: 768, y: 1360 };
const warnings = [
  'Human motion, adult-identity, transition, and support-foot registration review remains pending.',
  'Fixed canvas root and silhouette-bottom registration are not anatomical support-foot measurements.',
  'Anchor feet/nearFoot/farFoot coordinates are registration references only; the role labels explicitly exclude support-foot claims.',
  'Nominal exposure lengths are metadata for review, not combat hitstun, launch, knockdown, or getup durations.',
  'Runtime selects frames from simulation phase, phaseTick, velocity, grounded state, and remaining stun; it never loops a completed reaction.',
  'This independent candidate bundle does not replace or modify the existing first-playable bundle or runtime mappings.'
];
assert.strictEqual(source.candidateOnly, true);
assert.strictEqual(source.deployable, false);
assert.deepStrictEqual(source.root, root);
assert.strictEqual(source.perFrameScale, false);
assert.strictEqual(source.frames.length, 12);
assert.strictEqual(hash(path.join(engineRoot, 'public/lamuh-legacy-v2/movement-v2/idle-00.png')), source.idleReferenceSha256);

function writeOrCheck(file, value) {
  assert(file.startsWith(outputRoot + path.sep) || file === compiledPath, 'Output must stay inside the explicitly scoped additive package');
  const expected = stableJson(value);
  if (checkOnly) assert.strictEqual(fs.readFileSync(file, 'utf8'), expected, `Stale artifact: ${file}`);
  else {
    fs.mkdirSync(path.dirname(file), { recursive: true });
    fs.writeFileSync(file, expected, 'utf8');
  }
}

for (const frame of source.frames) {
  const canonical = path.join(contentRoot, 'reaction-frames-quality-v1', path.basename(frame.publicPath));
  const publicFile = path.join(engineRoot, 'public', frame.publicPath.slice(1));
  const png = fs.readFileSync(canonical);
  assert.strictEqual(hash(canonical), frame.sha256, `Canonical frame hash mismatch: ${frame.index}`);
  assert.strictEqual(hash(publicFile), frame.sha256, `Public frame hash mismatch: ${frame.index}`);
  assert.strictEqual(png.subarray(1, 4).toString(), 'PNG');
  assert.strictEqual(png.readUInt32BE(16), source.canvas.width);
  assert.strictEqual(png.readUInt32BE(20), source.canvas.height);
  assert.strictEqual(png[25], 6, 'Reaction PNG must retain RGBA');
  assert.deepStrictEqual(frame.root, root);
  assert.strictEqual(frame.touchesEdge, false);
}

const approval = { candidateOnly: true, deployable: false, state: 'pending', approvedBy: null, approvedAt: null, sourceManifestSha256: hash(sourcePath), remainingReview: warnings };
const provenance = {
  sourceType: 'ai_assisted', tool: 'Built-in image generation; existing Lamuh quality normalizer; additive Forge contract packaging',
  model: null, createdAt: fs.statSync(sourcePath).mtime.toISOString(), promptHash: null, seed: null,
  references: [uri(sourcePath), uri(path.join(engineRoot, 'public/lamuh-legacy-v2/movement-v2/idle-00.png'))],
  revisionChain: ['REACTION_QUALITY_V1_SOURCE', 'ADDITIVE_FORGE_REACTION_CANDIDATE'],
  cleanupOperations: ['existing_normalized_frames_reused_without_pixel_changes', 'source_public_sha256_parity_checked'],
  humanApproval: { state: 'pending', approvedBy: null, approvedAt: null },
  licensingNotes: ['Local generated Lamuh candidate. No promotion or deployment approval. createdAt records the source-manifest snapshot time.']
};
writeOrCheck(approvalPath, approval);
writeOrCheck(provenancePath, provenance);
writeOrCheck(metadataPath, {
  candidateOnly: true, deployable: false, sourceManifest: uri(sourcePath), sourceManifestSha256: hash(sourcePath),
  canvas: source.canvas, root, sequenceScale: source.sequenceScale, perFrameScale: false,
  nearFarFootMeasurement: 'UNMEASURED_REGISTRATION_REFERENCES_ONLY',
  runtimePresentationException: {
    mode: 'external_gameplay_state', policy: 'one_shot_or_state_selected_hold_never_loop',
    nominalExposuresAreCombatDurations: false, simulationAuthorityChanged: false, humanApproval: 'pending',
    ownerSource: uri(path.join(engineRoot, 'src/lamuhlegacy/quality.ts'))
  }, warnings
});

const poses = {
  upright: { ...structuredClone(template.entryPose), id: 'quality_reaction_upright', silhouette: 'adult_lamuh_upright_recoil_or_guard' },
  airborne: { ...structuredClone(template.entryPose), id: 'quality_reaction_airborne', elevation: 'airborne', plantedFoot: 'none', weight: 'airborne', verticalMotion: 'falling', silhouette: 'adult_lamuh_airborne_recoil' },
  grounded: { ...structuredClone(template.entryPose), id: 'quality_reaction_grounded', plantedFoot: 'none', weight: 'low', silhouette: 'adult_lamuh_grounded_settle' }
};
const packages = [];
for (const name of ['light', 'heavy', 'launch', 'knockdown', 'getup']) {
  const sequence = source.sequences[name];
  assert.strictEqual(sequence.indices.length, sequence.exposureTicks.length);
  const item = structuredClone(template);
  item.id = `quality_reaction_${name}`;
  item.simulationLength = sequence.exposureTicks.reduce((sum, value) => sum + value, 0);
  item.sourceFrames = sequence.indices.map((index) => {
    const frame = source.frames[index];
    return { id: `${item.id}_frame_${index}`, sourceUri: uri(path.join(contentRoot, 'reaction-frames-quality-v1', path.basename(frame.publicPath))),
      width: source.canvas.width, height: source.canvas.height, sha256: frame.sha256,
      approvalUri: uri(approvalPath), provenanceUri: uri(provenancePath), metadataUri: uri(metadataPath) };
  });
  let cursor = 0;
  item.exposures = item.sourceFrames.map((frame, index) => {
    const exposure = { sourceFrameId: frame.id, start: cursor, duration: sequence.exposureTicks[index] };
    cursor += exposure.duration;
    return exposure;
  });
  item.phases = { anticipation: [], startup: [], active: [], impact: [], followThrough: [], recovery: [{ start: 0, end: cursor - 1 }] };
  item.entryPose = name === 'launch' ? poses.airborne : name === 'getup' || name === 'knockdown' ? poses.grounded : poses.upright;
  item.exitPose = name === 'launch' ? poses.airborne : name === 'knockdown' ? poses.grounded : poses.upright;
  item.interruptPoses = Object.values(poses);
  item.transitions = [];
  item.landing = name === 'launch' ? [{ start: 0, end: cursor - 1, result: 'knockdown_landing' }] : [];
  item.anchors = item.exposures.map((exposure) => ({ frame: exposure.start, sourceFrameId: exposure.sourceFrameId,
    root, feet: root, effect: root, nearFoot: root, farFoot: root, groundingContract: 'fixed_canvas_registration_only_unmeasured_feet_v1' }));
  item.groundingTrack = item.sourceFrames.map((frame) => ({ sourceFrameId: frame.id, root, nearFoot: root, farFoot: root,
    nearFootRole: 'unmeasured_registration_reference_not_support', farFootRole: 'unmeasured_registration_reference_not_support',
    projectedGroundPlaneY: root.y, contractVersion: 'fixed_canvas_registration_only_unmeasured_feet_v1' }));
  item.combatTrack = { startup: 0, active: 0, recovery: cursor, damage: 0, hitstop: 0, hitstun: 0, blockstun: 0, boxes: [], cancelWindows: [],
    timingAuthorship: { ...structuredClone(template.combatTrack.timingAuthorship), authoredTotalDuration: cursor, timingExceptions: [] } };
  item.presentationTrack = [];
  item.playbackPolicy = { mode: 'external_gameplay_state', cursorOwner: 'simulation', hitstopFreezesCursor: true, holdBehavior: 'clamp_to_gameplay_state' };
  item.interruptionBehavior = { owner: 'simulation', allowedSources: ['incoming_hit', 'incoming_throw', 'ground_contact', 'recovery_complete', 'round_end', 'forced_state'],
    onInterrupt: 'simulation_selects_target_state', returnStatePolicy: 'simulation_state_controls_exit_not_nominal_package_length' };
  item.facingBehavior.mirrorAxisX = root.x;
  item.transitionCompatibility = [{ fromStates: ['hit_reaction', 'knockdown', 'getup', 'air_recovery', 'thrown'], toState: item.id,
    condition: 'existing_simulation_selects_reaction_state', addsGameplayFrames: false }];
  item.presentationSockets = [{ id: 'registration_reference', ...root, mirrorRule: 'x_prime_equals_canvas_width_minus_x', eventTypes: ['play_sound'] }];
  item.gameplayTimingStatus = { owner: 'simulation', state: 'not_applicable', authoritative: false,
    candidateValues: { nominalReviewDuration: cursor, reactionState: name, damage: 0, runtimePresentationException: 'one_shot_or_state_selected_hold_never_loop', combatDurationOverride: false }, notes: warnings };
  item.approvalRecords = [uri(approvalPath)];
  item.validation = { hardGates: ['contract_shape', 'source_sha256', 'source_public_parity', 'rgba_dimensions', 'exposure_coverage', 'fixed_registration_root', 'zero_damage'], creativeWarnings: warnings, humanApprovalRequired: true };
  item.provenance = provenance;
  writeOrCheck(path.join(outputRoot, name, 'animation.package.json'), item);
  packages.push(item.id);
}

const bundle = { ...baseBundle, id: 'lamuh_quality_reactions_v1', displayName: 'LAMUH Legacy V2 additive reaction quality candidate', promotionState: 'candidate',
  runtimeProfile: { ...baseBundle.runtimeProfile, centerline: root.x, footPosition: root.y, universalCapabilities: ['reaction_presentation_only'] },
  poseLibrary: Object.values(poses), animationPackages: ['light', 'heavy', 'launch', 'knockdown', 'getup'].map((name) => `${name}/animation.package.json`), packageGroups: { reaction_quality: packages } };
writeOrCheck(bundlePath, bundle);
const compiled = compileFromPath(bundlePath);
assert.strictEqual(compiled.deployable, false);
assert.strictEqual(compiled.animations.length, 5);
assert(compiled.animations.every((item) => item.combatTrack.damage === 0 && item.combatTrack.boxes.length === 0 && item.playbackPolicy.mode === 'external_gameplay_state'));
writeOrCheck(compiledPath, compiled);
console.log(`${checkOnly ? 'Verified' : 'Packaged'} five additive Lamuh reaction candidates; deployable=false; anatomical foot registration and human approval remain pending.`);
