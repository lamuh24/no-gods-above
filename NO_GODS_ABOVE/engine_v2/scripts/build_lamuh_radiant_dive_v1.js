const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const { compileFromPath, stableJson } = require('./production_contracts');
const { fighterDefinitions } = require('../dist/data/fighters');
const { createMatch, tick, currentAuthoredDive } = require('../dist/core/engine');

const root = path.resolve(__dirname, '..'), repo = path.resolve(root, '../..');
const base = path.join(root, 'content-source/characters/lamuh-legacy-v2');
const out = path.join(base, 'radiant-dive-packages');
const reportPath = path.join(repo, 'tools/nga-forge/review/lamuh-legacy-v2-radiant-dive-v1/normalization.report.json');
const reviewPath = path.join(root, 'public/lamuh-legacy-v2/review-data.json');
const firstPath = path.join(base, 'first-playable.bundle.json');
const status = 'awaiting_human_radiant_dive_family_review';
const strengths = ['light', 'medium', 'heavy'];
const read = p => JSON.parse(fs.readFileSync(p, 'utf8'));
const hash = p => crypto.createHash('sha256').update(fs.readFileSync(p)).digest('hex').toUpperCase();
const uri = p => 'repo://' + path.relative(repo, p).replaceAll('\\', '/');
const publicFile = p => path.join(root, 'public', p);
const sourceFile = f => f.publicPath.includes('/radiant-dive-v1/')
  ? path.join(base, 'radiant-dive-frames-v1', path.basename(f.publicPath)) : publicFile(f.publicPath);
const clone = v => structuredClone(v);
const landingDurations = n => [Math.ceil(n * .4), Math.ceil(n * .8) - Math.ceil(n * .4), n - Math.ceil(n * .8)];

function verifyFrame(frame) {
  for (const p of new Set([sourceFile(frame), publicFile(frame.publicPath)])) {
    const bytes = fs.readFileSync(p);
    assert.equal(hash(p), frame.sha256, `Stale source/public PNG: ${p}`);
    assert.equal(bytes.subarray(1, 4).toString(), 'PNG');
    assert.equal(bytes.readUInt32BE(16), 2048); assert.equal(bytes.readUInt32BE(20), 1536);
    assert.equal(bytes[25], 6, 'Runtime cutout must be RGBA, not a matte sheet');
  }
  assert.deepEqual(frame.root, { x: 768, y: 1360 });
}

// These are actual post-tick states, matching the sandbox cursor (which first
// exposes phaseTick 1). Include the first idle completion once, never fake tick 0.
function sampleReference(strength, attack) {
  const state = createMatch(90605, { matchId: `radiant-reference-${strength}`, p1Kind: 'lamuh_legacy_v2', p2Kind: 'lamuh_legacy_v2', p1X: -300, p2X: 300 });
  const fighter = state.fighters.p1;
  Object.assign(fighter, { grounded: false, y: -180, vx: 0, vy: 0, phase: 'jump', airActionsRemaining: 5, airDashesRemaining: 1 });
  const initialX = fighter.x, samples = [], exposureTicks = Array(7).fill(0);
  for (let i = 0; i < 150; i++) {
    tick(state, { p1: i === 0 ? { special: true, [strength]: true } : {} });
    const dive = currentAuthoredDive(fighter, state);
    let frameIndex = 6;
    if (dive?.stage === 'windup') frameIndex = dive.stageTick < Math.ceil(attack.startup * .6) ? 0 : 1;
    else if (dive?.stage === 'strike') frameIndex = 2;
    else if (dive?.stage === 'gather') frameIndex = 3;
    else if (dive?.stage === 'landing') frameIndex = dive.stageTick / dive.landingRecoveryTicks < .4 ? 4 : dive.stageTick / dive.landingRecoveryTicks < .8 ? 5 : 6;
    assert(!samples.length || frameIndex >= samples.at(-1).frameIndex, 'Reference must not restart a source pose');
    exposureTicks[frameIndex]++;
    samples.push({ simulationTick: state.tick - 1, phase: fighter.phase, phaseTick: fighter.phaseTick, stage: dive?.stage ?? 'complete', stageTick: dive?.stageTick ?? 0, frameIndex, root: { x: fighter.x - initialX, y: fighter.y }, grounded: fighter.grounded });
    if (fighter.phase === 'idle' && fighter.currentAttack === null) break;
  }
  assert.equal(samples.at(-1).stage, 'complete');
  assert(exposureTicks.every(n => n > 0));
  assert.equal(state.fighters.p2.hitCountTaken, 0); assert.equal(fighter.moveInstanceCounter, 1);
  return { entryHeight: 180, outcome: 'distant_whiff', hitstopTicks: 0, includesFirstIdleCompletion: true, simulationCursorConvention: 'post_tick_first_move_tick_1', fixedRuntimeLandingTick: false, durationTicks: samples.length, exposureTicks, samples };
}

function build({ check = false } = {}) {
  const report = read(reportPath), review = read(reviewPath), first = read(firstPath);
  // Fail before any write: incomplete Heavy art must never become a live placeholder.
  assert.equal(report.sourceArtStatus, 'candidate_ready_for_human_review', 'Wait for the art owner to finish and explicitly release the normalized candidate');
  assert.equal(report.frames?.length, 12, 'Wait for the final twelve-frame Radiant normalization report');
  assert.equal(report.v1Frames?.length, 7, 'Measured protected row-4 comparison is required');
  assert.equal(report.candidateOnly, true); assert.equal(report.deployable, false);
  assert(report.heavyAuraSourceSha256, 'Heavy surrounding-aura source is not ready');
  assert(report.heavyConnectorSourceSha256, 'Final same-arm Heavy connector source is required');
  const rawSources = [['raw-family-repair-v2.png', 'bodySourceSha256'], ['raw-heavy-aura-v3.png', 'heavyAuraSourceSha256'], ['raw-heavy-connector-single-v5.png', 'heavyConnectorSourceSha256']];
  for (const [file, field] of rawSources) assert.equal(hash(path.join(path.dirname(reportPath), file)), report[field], `Raw Radiant provenance is stale: ${file}`);
  assert.equal(typeof report.releaseSocketMethod, 'string', 'Manual source-palm method must be recorded');
  for (const strength of strengths) assert(report.releaseSockets?.[strength] && ['x', 'y'].every(k => Number.isFinite(report.releaseSockets[strength][k])), 'Measured per-strength source-palm sockets are required');
  assert.equal(report.perFrameRescale, false);
  assert.deepEqual(report.canvas, { width: 2048, height: 1536 }); assert.deepEqual(report.root, { x: 768, y: 1360 });
  assert.equal(first.currentReviewGate.status, status, 'Do not rewind a later review gate');
  report.frames.forEach((f, i) => {
    assert.equal(f.index, i); assert.equal(f.strength, strengths[Math.floor(i / 4)]);
    assert.equal(f.publicPath, `/lamuh-legacy-v2/radiant-dive-v1/${f.strength}-${String(i % 4).padStart(2, '0')}.png`);
    assert.equal(f.auraBaked, i >= 8); assert.equal(f.edgeContact, false); assert.equal(f.magentaRemaining, 0);
    verifyFrame(f);
  });
  const approvedMovement = [...review.movementModernization.states.jump.frames.slice(5, 7), review.movementModernization.states.idle.frames[0]];
  approvedMovement.forEach(verifyFrame);
  const preservedReview = stableJson(Object.fromEntries(Object.entries(review).filter(([k]) => !['radiantDiveFamily', 'firstPlayable', 'timingCandidates'].includes(k))));
  const preservedTiming = stableJson(review.timingCandidates.moves.filter(m => !m.moveId.startsWith('radiant_dive_')));
  const preservedStars = stableJson(first.currentReviewGate.starredForRevisit);
  const protectedPaths = ['records/forward-special-family-v1.approval.json', 'records/celestial-palm-v1.approval.json', 'records/heaven-splitter-v4.approval.json', 'heaven-splitter-family.candidate.v1.json', 'celestial-palm-family.candidate.v1.json', 'character.bundle.json'].map(p => path.join(base, p));
  const protectedHashes = protectedPaths.map(p => [p, hash(p)]);
  const template = read(path.join(base, 'celestial-palm-packages/light/animation.package.json'));
  const bundleTemplate = read(path.join(base, 'character.bundle.json'));
  const warning = [
    'One continuous near-arm descending open palm; the disconnected protected late kick is retired, not a second hit.',
    'Windup/strike/gather follow current airborne position; actual floor contact starts committed 10/14/20 landing recovery.',
    'No invulnerability, OTG, homing, extra shockwave damage, renderer-driven motion or repeat-Dive refund.',
    'B is a measured no-hit height-180 reference, not a universal landing clock. A/C are visual comparison only.',
    'Heavy surrounding aura is embedded motion artwork on hit, block and whiff; no runtime aura spawn or impact claim.',
    'Fixed canvas/root registration and PNG checks do not constitute anatomical, contact-alignment or human motion approval.'
  ];
  const approvalPath = path.join(out, 'records/human-review.pending.json');
  const provenancePath = path.join(out, 'records/provenance.json');
  const registrationPath = path.join(out, 'records/registration.json');
  const provenance = { ...clone(template.provenance), createdAt: new Date(fs.statSync(reportPath).mtime).toISOString(), references: [uri(reportPath), ...rawSources.map(([file]) => uri(path.join(path.dirname(reportPath), file))), uri(path.join(root, 'public/lamuh-legacy-v2/atlases/lamuh_sheet_5_specials_atlas.png')), ...approvedMovement.map(f => uri(publicFile(f.publicPath)))], cleanupOperations: ['generated_same_arm_motion_revision', 'magenta_matte_unmix_preserve_white_fabric', 'constant_source_camera_scale', 'explicit_pelvis_virtual_ground_registration', 'single_pose_connector_resolution_restoration_not_anatomical_bbox_scaling', 'existing_jump_catch_settle_and_idle_reused'], revisionChain: ['PROTECTED_V1_RADIANT_DIVE', 'V2_SINGLE_NEAR_ARM_AIR_SPECIAL_CANDIDATE', 'HEAVY_SURROUNDING_AURA_SOURCE_ART', 'HEAVY_CONNECTOR_SINGLE_V5_SAME_ARM_AND_TWO_LEGS'], humanApproval: { state: 'pending', approvedAt: null, approvedBy: null } };
  const outputs = new Map();
  const put = (p, value) => outputs.set(p, value);
  put(approvalPath, { state: 'pending', approvedAt: null, approvedBy: null, candidateOnly: true, deployable: false, remainingReview: warning });
  put(provenancePath, provenance); put(registrationPath, { ...report, notes: warning });
  const family = { schemaVersion: '1.0.0', status, candidateOnly: true, deployable: false, variants: {}, humanApproval: { family: null, light: null, medium: null, heavy: null }, contactSheets: [report.contactSheetPublicPath], reviewNotes: warning, normalizationReport: uri(reportPath) };
  for (const [ordinal, strength] of strengths.entries()) {
    const id = `radiant_dive_${strength}`, attackId = `legacy_${id}`, attack = fighterDefinitions.lamuh_legacy_v2.attacks[attackId];
    assert(attack?.authoredDive, 'Build the deterministic Radiant core first');
    const track = attack.authoredDive, hit = attack.hitboxes[0];
    assert.equal(attack.hitboxes.length, 1); assert.equal(hit.maxHits, 1);
    const maximumAirTicks = attack.startup + Math.ceil(track.maximumHeight / Math.min(track.strikeVelocity.y, track.gatherVelocity.y));
    const envelope = maximumAirTicks + track.landingRecoveryTicks;
    const reference = sampleReference(strength, attack);
    const frames = [...report.frames.slice(ordinal * 4, ordinal * 4 + 4), ...approvedMovement].map((f, index) => ({ ...clone(f), index, contact: index === 2, visibleImpact: index === 2, role: index < 4 ? f.role : ['existing two-foot landing catch', 'existing guarded landing settle', 'existing idle endpoint'][index - 4], authoredWorldRootOffset: reference.samples.find(s => s.frameIndex === index).root }));
    const phaseExposures = {
      windup: [{ sourceFrameId: `${id}_frame_0`, duration: Math.ceil(attack.startup * .6) }, { sourceFrameId: `${id}_frame_1`, duration: attack.startup - Math.ceil(attack.startup * .6) }],
      strike: [{ sourceFrameId: `${id}_frame_2`, duration: attack.active }], gather: [{ sourceFrameId: `${id}_frame_3`, duration: 1 }],
      landing: landingDurations(track.landingRecoveryTicks).map((duration, i) => ({ sourceFrameId: `${id}_frame_${i + 4}`, duration }))
    };
    const diveContract = { owner: 'deterministic_simulation', attackId, track: clone(track), maximumAirTicks, landingPhase: 'dive_landing', landingTrigger: 'actual_floor_contact', airExposurePolicy: 'stage_driven', hitstopFreezes: true, maxHits: 1, phaseExposures };
    const timing = {};
    for (const [candidate, delta] of [['A', -1], ['B', 0], ['C', 2]]) {
      const exp = [...reference.exposureTicks]; exp[0] += delta; exp[5] += delta;
      assert(exp.every(n => n > 0));
      timing[candidate] = { label: candidate === 'B' ? 'RECOMMENDED_GAMEPLAY_ALIGNED_REFERENCE' : 'VISUAL_COMPARISON_ONLY', phaseTicks: { startup: attack.startup + delta, active: attack.active, recovery: track.landingRecoveryTicks + delta }, durationTicks: exp.reduce((a, b) => a + b, 0), exposureTicks: exp, preservesSourceFrameOrder: true, duplicateMeaninglessFrames: false, visualComparisonOnly: candidate !== 'B', durationModel: 'height_180_state_driven_reference_not_fixed_landing', runtimePhaseTimingsUnchanged: true };
    }
    const releaseSocket = clone(report.releaseSockets[strength]);
    const palmWorld = { x: (releaseSocket.x - 768) * .3 / 1.3, y: (releaseSocket.y - 1360) * .3 / 1.3 };
    assert(palmWorld.x >= hit.rect.x && palmWorld.x <= hit.rect.x + hit.rect.w && palmWorld.y >= hit.rect.y && palmWorld.y <= hit.rect.y + hit.rect.h, 'Final core collision must contain the manually registered visible palm');
    const closure = { status, candidateOnly: true, deployable: false, rendererAuthoritative: false, simulationAuthoritative: true, simulationHz: 60,
      v1: { sourceFrameCount: 7, historicalDurationTicks: 29, reconstructedExposureTicks: [4, 4, 4, 4, 4, 4, 5], exposureEvidence: 'RECONSTRUCTION_ONLY_CURRENT_PROTECTED_5_6_18_NOMINAL_DURATION', root: { x: 224, y: 382 }, visibleBounds: report.v1Frames.map(f => f.visibleBounds), bodyCenters: report.v1Frames.map(f => f.bodyCenter), contactFrame: null, exactContactTick: null, note: 'Protected current P1 metadata is 5/6/18, 29 nominal ticks. Exact historical V1 exposures/contact are unrecoverable; these equalized comparison holds are not original timing. Late kick remains historical only.' },
      v2: { canvas: clone(report.canvas), root: clone(report.root), rootPath: frames.map(f => f.root), authoredWorldRootPath: reference.samples.map(s => s.root), frames, contactFrame: 2, contactFrames: [2], contactPresentation: { publicPath: frames[2].publicPath, sha256: frames[2].sha256, bodyOnlyOnWhiff: strength !== 'heavy', bodyOnlyForAllOutcomes: strength !== 'heavy', vfxEnabled: false, allowedOutcomes: [], classification: strength === 'heavy' ? 'authored_body_plus_motion_aura' : 'opaque_body', separationStatus: 'source_motion_art_separate_from_authoritative_hit_confirm_feedback' }, singleSequenceScale: report.scale, perFrameRescale: false, visualRecentering: false, placementPolicy: report.registration, visibleImpactCount: 1, gameplayHitCount: 1, releaseSocket, releaseSocketEvidence: 'manual_visible_open_palm_center_on_normalized_source', releaseSocketMethod: report.releaseSocketMethod, sourceRegistrationNotes: strength === 'heavy' ? [report.heavyConnectorCamera] : [], authoredDiveTrack: diveContract, referencePlayback: reference, auraBakedIntoFrames: strength === 'heavy', runtimeAuraOverlay: false, preservationBoundary: { protectedLegacyFramesModified: false, sourceOrderPreserved: false, approvedV2Disposition: 'Forward Palm Heaven and movement source bytes unchanged', retainedLegacyQualities: ['descending hand strike', 'forward air approach'], retiredLegacyBeats: ['disconnected late side kick'], explicitRootMotionOwner: 'deterministic_simulation' } },
      timingCandidates: timing, recommendedTimingCandidate: 'B', impactCandidates: Object.fromEntries([['I1', -1], ['I2', 0], ['I3', 1]].map(([id, delta]) => [id, { label: id === 'I2' ? 'AUTHORED' : 'VISUAL_IMPACT_COMPARISON', hitstopTicks: hit.hitstop + delta, contactExposureDelta: 0, recoilExposureDelta: 0, recoveryExposureDelta: 0 }])), recommendedImpactCandidate: 'I2', unsupported: { counterHit: 'UNSUPPORTED — not invented' } };
    family.variants[strength] = closure;
    const pack = clone(template);
    Object.assign(pack, { id, simulationLength: envelope, provenance, entryPose: { ...clone(bundleTemplate.poseLibrary.find(p => p.id === 'airborne')), verticalMotion: 'falling' }, exitPose: clone(bundleTemplate.poseLibrary.find(p => p.id === 'neutral_stand')), presentationTrack: [], presentationSockets: [{ id: 'dive_open_palm', ...releaseSocket, mirrorRule: 'x_prime_equals_canvas_width_minus_x', eventTypes: ['spawn_vfx'] }], transitions: [], playbackPolicy: { mode: 'external_gameplay_state', cursorOwner: 'simulation', hitstopFreezesCursor: true, holdBehavior: 'clamp_to_gameplay_state' } });
    // The contract requires a socket capability; the empty presentationTrack
    // emits no spawn event. Heavy motion aura exists only in source pixels.
    pack.interruptPoses = [clone(pack.entryPose), clone(pack.exitPose)];
    pack.sourceFrames = frames.map((f, i) => ({ id: `${id}_frame_${i}`, sourceUri: uri(sourceFile(f)), width: 2048, height: 1536, sha256: f.sha256, approvalUri: uri(approvalPath), provenanceUri: uri(provenancePath), metadataUri: uri(registrationPath) }));
    let cursor = 0;
    pack.exposures = Object.entries(phaseExposures).flatMap(([stage, entries]) => entries.map(e => { const duration = stage === 'gather' ? maximumAirTicks - attack.startup - attack.active : e.duration; const result = { sourceFrameId: e.sourceFrameId, start: cursor, duration }; cursor += duration; return result; }));
    pack.phases = { anticipation: [], startup: [{ start: 0, end: attack.startup - 1 }], active: [{ start: attack.startup, end: attack.startup + attack.active - 1 }], impact: [], followThrough: [{ start: attack.startup + attack.active, end: maximumAirTicks - 1 }], recovery: [{ start: maximumAirTicks, end: envelope - 1 }] };
    pack.anchors = pack.exposures.map(e => ({ frame: e.start, sourceFrameId: e.sourceFrameId, root: clone(report.root), feet: clone(report.root), nearFoot: clone(report.root), farFoot: clone(report.root), effect: releaseSocket, groundingContract: 'pelvis_registered_virtual_ground_no_airborne_foot_plant_claim' }));
    pack.groundingTrack = pack.sourceFrames.map(f => ({ sourceFrameId: f.id, root: clone(report.root), nearFoot: clone(report.root), farFoot: clone(report.root), nearFootRole: 'virtual_ground_reference_not_measured_foot', farFootRole: 'virtual_ground_reference_not_measured_foot', projectedGroundPlaneY: 1360, contractVersion: 'pelvis_virtual_ground_v1' }));
    pack.combatTrack = { startup: attack.startup, active: attack.active, recovery: track.landingRecoveryTicks, damage: hit.damage, hitstop: hit.hitstop, hitstun: hit.hitstun, blockstun: hit.blockstun, boxes: Array.from({ length: attack.active }, (_, i) => ({ frame: attack.startup + i, kind: 'hit', x: hit.rect.x, y: hit.rect.y, width: hit.rect.w, height: hit.rect.h })), cancelWindows: [], timingAuthorship: { ...clone(template.combatTrack.timingAuthorship), authoredTotalDuration: envelope, timingExceptions: [] }, authoredDiveTrack: diveContract };
    pack.landing = [{ start: maximumAirTicks, end: envelope - 1, result: 'special_landing' }];
    pack.transitionCompatibility = [{ fromStates: ['jump'], toState: id, condition: 'airborne_special_input_height_budget_and_once_per_airtime_gate', addsGameplayFrames: false }];
    pack.approvalRecords = [uri(approvalPath)]; pack.validation = { ...pack.validation, creativeWarnings: warning, humanApprovalRequired: true };
    pack.gameplayTimingStatus = { owner: 'simulation', state: 'sandbox_candidate_awaiting_combat_approval', authoritative: false, candidateValues: { startup: attack.startup, active: attack.active, recovery: track.landingRecoveryTicks, damage: hit.damage, maximumAirTicks, variableLanding: true }, notes: warning };
    put(path.join(out, strength, 'animation.package.json'), pack);
    review.timingCandidates.moves = review.timingCandidates.moves.filter(m => m.moveId !== id).concat({ moveId: id, sourceFrameCount: 7, authoredFrameCount: 7, contactSourceFrames: [2], v1Historical: { durationTicks: 29, exposureTicks: closure.v1.reconstructedExposureTicks, durationEvidence: 'current_protected_runtime_metadata_not_exact_historical_exposures', exposureEvidence: closure.v1.exposureEvidence, note: closure.v1.note }, candidates: timing, recommendedCandidate: 'B', humanReviewStatus: status, note: warning.join(' ') });
    if (!first.coverage.specials.includes(id)) first.coverage.specials.push(id);
  }
  const bundlePath = path.join(out, 'radiant-dive.bundle.json');
  put(bundlePath, { ...bundleTemplate, id: 'lamuh_radiant_dive_v1', displayName: 'Lamuh Radiant Dive candidate', promotionState: 'candidate', animationPackages: strengths.map(s => `${s}/animation.package.json`), packageGroups: { air_specials: strengths.map(s => `radiant_dive_${s}`) } });
  const publish = ([p, value]) => { if (check) assert.equal(stableJson(read(p)), stableJson(value), `Stale Radiant artifact: ${p}`); else { fs.mkdirSync(path.dirname(p), { recursive: true }); fs.writeFileSync(p, JSON.stringify(value, null, 2) + '\n'); } };
  // Validate all source references and the variable-landing contract before the UI
  // receives its additive family. Incomplete/invalid art never enters review-data.
  for (const entry of outputs) publish(entry);
  publish([path.join(root, 'generated/manifests/lamuh_radiant_dive_v1.candidate.runtime.json'), compileFromPath(bundlePath)]);
  first.additiveForgeBundles = (first.additiveForgeBundles || []).filter(b => b.role !== 'air_specials').concat({ path: 'radiant-dive-packages/radiant-dive.bundle.json', packageCount: 3, role: 'air_specials' });
  first.technicalStatus = 'HEAVEN_V4_ACCEPTED_RADIANT_DIVE_STATE_DRIVEN_PLAYABLE_CANDIDATE';
  review.firstPlayable = first; review.radiantDiveFamily = family;
  assert.equal(stableJson(first.currentReviewGate.starredForRevisit), preservedStars);
  assert.equal(stableJson(review.timingCandidates.moves.filter(m => !m.moveId.startsWith('radiant_dive_'))), preservedTiming);
  assert.equal(stableJson(Object.fromEntries(Object.entries(review).filter(([k]) => !['radiantDiveFamily', 'firstPlayable', 'timingCandidates'].includes(k)))), preservedReview);
  publish([path.join(base, 'radiant-dive-family.candidate.v1.json'), family]);
  publish([path.join(root, 'public/lamuh-legacy-v2/radiant-dive-v1/manifest.json'), family]);
  publish([firstPath, first]); publish([reviewPath, review]);
  publish([path.join(base, 'records/radiant-dive-v1.hash-lock.json'), { candidateOnly: true, deployable: false, bodySourceSha256: report.bodySourceSha256, heavyAuraSourceSha256: report.heavyAuraSourceSha256, heavyConnectorSourceSha256: report.heavyConnectorSourceSha256, frames: Object.fromEntries(Object.entries(family.variants).map(([strength, closure]) => [strength, closure.v2.frames.map(f => ({ publicPath: f.publicPath, sha256: f.sha256 }))])) }]);
  for (const [p, expected] of protectedHashes) assert.equal(hash(p), expected, `Protected accepted content changed: ${p}`);
  console.log(`${check ? 'CHECKED' : 'BUILT'} Radiant L/M/H: twelve new poses plus existing landing/idle; one hit; state-driven floor contact. Candidate only, no approval or promotion.`);
  return family;
}

if (require.main === module) build({ check: process.argv.includes('--check') });
module.exports = { build, sampleReference };
