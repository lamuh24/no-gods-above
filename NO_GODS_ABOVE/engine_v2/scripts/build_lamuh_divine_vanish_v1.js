const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const { compileFromPath, stableJson } = require('./production_contracts');

const root = path.resolve(__dirname, '..'), repo = path.resolve(root, '../..');
const base = path.join(root, 'content-source/characters/lamuh-legacy-v2');
const out = path.join(base, 'divine-vanish-packages');
const reportPath = path.join(repo, 'tools/nga-forge/review/lamuh-legacy-v2-divine-vanish-v1/normalization.report.json');
const blinkReportPath = path.join(repo, 'tools/nga-forge/review/lamuh-legacy-v2-divine-vanish-transit-v2/normalization.report.json');
const reviewPath = path.join(root, 'public/lamuh-legacy-v2/review-data.json');
const firstPath = path.join(base, 'first-playable.bundle.json');
const status = 'awaiting_human_divine_vanish_family_review';
const strengths = ['light', 'medium', 'heavy'];
const holds = { light: [1, 2, 2, 4, 3, 3, 3, 2], medium: [1, 4, 3, 2, 4, 2, 3, 4, 3, 2], heavy: [1, 7, 4, 3, 6, 3, 5, 5, 4, 2] };
const read = p => JSON.parse(fs.readFileSync(p, 'utf8'));
const hash = p => crypto.createHash('sha256').update(fs.readFileSync(p)).digest('hex').toUpperCase();
const uri = p => 'repo://' + path.relative(repo, p).replaceAll('\\', '/');
const publicFile = p => path.join(root, 'public', p);
const sourceFile = f => f.publicPath.includes('/divine-vanish-v2/') ? path.join(base, 'divine-vanish-v2', path.basename(f.publicPath)) : f.publicPath.includes('/divine-vanish-v1/') ? path.join(base, 'divine-vanish-frames-v1', path.basename(f.publicPath)) : publicFile(f.publicPath);
const sum = values => values.reduce((a, b) => a + b, 0);

function verifyFrame(frame) {
  for (const p of new Set([sourceFile(frame), publicFile(frame.publicPath)])) {
    const bytes = fs.readFileSync(p);
    assert.equal(hash(p), frame.sha256, `Stale source/public PNG: ${p}`);
    assert.equal(bytes.subarray(1, 4).toString(), 'PNG');
    assert.equal(bytes.readUInt32BE(16), 2048); assert.equal(bytes.readUInt32BE(20), 1536);
    assert.equal(bytes[25], 6, 'Runtime source must be RGBA');
  }
  assert.deepEqual(frame.root, { x: 768, y: 1360 });
  assert(frame.visibleBounds && frame.bodyCenter, 'Measured frame bounds/center required');
}

function build({ check = false, integrate = false } = {}) {
  const { fighterDefinitions } = require('../dist/data/fighters');
  const report = read(reportPath), blinkReport = read(blinkReportPath), review = read(reviewPath), first = read(firstPath);
  assert.equal(report.sourceArtStatus, 'candidate_ready_for_human_review', 'Art must be explicitly released before packaging');
  assert.equal(report.frames?.length, 6); assert.equal(report.v1Frames?.length, 6);
  assert.equal(report.candidateOnly, true); assert.equal(report.deployable, false);
  assert.equal(report.perFrameRescale, false); assert(Number.isFinite(report.scale) && report.scale > 0);
  assert.deepEqual(report.canvas, { width: 2048, height: 1536 }); assert.deepEqual(report.root, { x: 768, y: 1360 });
  assert(Array.isArray(report.rawSources) && report.rawSources.length > 0, 'Raw art provenance required');
  for (const source of report.rawSources) assert.equal(hash(path.resolve(path.dirname(reportPath), source.file)), source.sha256);
  report.frames.forEach((f, i) => {
    assert.equal(f.index, i); assert.equal(f.publicPath, `/lamuh-legacy-v2/divine-vanish-v1/pose-${String(i).padStart(2, '0')}.png`);
    assert.equal(f.edgeContact, false); verifyFrame(f);
  });
  assert.equal(blinkReport.sourceArtStatus, 'candidate_ready_for_human_review');
  assert.equal(blinkReport.frames?.length, 1); assert.equal(blinkReport.candidateOnly, true); assert.equal(blinkReport.deployable, false);
  const auraOnly = blinkReport.frames[0];
  for (const source of blinkReport.rawSources) assert.equal(hash(path.resolve(path.dirname(blinkReportPath), source.file)), source.sha256);
  assert.equal(auraOnly.publicPath, '/lamuh-legacy-v2/divine-vanish-v2/aura-only-00.png');
  assert.equal(auraOnly.bodyVisible, false); assert.equal(auraOnly.edgeContact, false); verifyFrame(auraOnly);
  const lightReceiptPath = path.join(base, 'records/divine-vanish-light-v1.approval.json');
  const lightReceipt = read(lightReceiptPath);
  const idle = review.movementModernization.states.idle.frames[0]; verifyFrame(idle);
  const priorReview = stableJson(Object.fromEntries(Object.entries(review).filter(([k]) => !['divineVanishFamily', 'firstPlayable', 'timingCandidates'].includes(k))));
  const priorTiming = stableJson(review.timingCandidates.moves.filter(m => !m.moveId.startsWith('divine_vanish_')));
  const priorStars = stableJson(first.currentReviewGate.starredForRevisit);
  const protectedPaths = ['records/forward-special-family-v1.approval.json', 'records/celestial-palm-v1.approval.json', 'records/heaven-splitter-v4.approval.json', 'radiant-dive-family.candidate.v1.json', 'character.bundle.json'].map(p => path.join(base, p));
  const protectedHashes = protectedPaths.map(p => [p, hash(p)]);
  const template = read(path.join(base, 'celestial-palm-packages/light/animation.package.json'));
  const bundleTemplate = read(path.join(base, 'character.bundle.json'));
  const warning = [
    'Grounded backward retreat only: zero damage, zero visible contacts, no hidden punch, teleport or sideswitch.',
    'No invulnerability, cancel, meter gain, victim motion or collision immunity is granted by the phase aura.',
    'L/M/H share a continuous retreat and differ in authored distance, load and recovery commitment.',
    'A/C are visual comparison candidates only; B matches deterministic simulation timing.',
    'Source-bound surrounding aura is visual motion, not proof of invulnerability or contact; M/H use one complete aura-only disappearance, never partial erased limbs.',
    'Fixed roots and source hash validation do not constitute human anatomical, cutout or motion approval.'
  ];
  const approvalPath = path.join(out, 'records/human-review.pending.json');
  const provenancePath = path.join(out, 'records/provenance.json');
  const registrationPath = path.join(out, 'records/registration.json');
  const provenance = { ...structuredClone(template.provenance), createdAt: new Date(fs.statSync(reportPath).mtime).toISOString(), references: [uri(reportPath), uri(blinkReportPath), ...report.rawSources.map(s => uri(path.resolve(path.dirname(reportPath), s.file))), uri(publicFile(idle.publicPath)), uri(publicFile('/lamuh-legacy-v2/atlases/lamuh_sheet_5_specials_atlas.png'))], cleanupOperations: ['dedicated_backward_retreat_candidate', 'single_sequence_scale', 'fixed_source_root', 'exact_idle_endpoints_reused', 'medium_heavy_complete_visual_blink_no_invulnerability'], revisionChain: ['PROTECTED_V1_DIVINE_VANISH', 'V2_GROUNDED_RETREAT_CANDIDATE', 'MEDIUM_HEAVY_VISUAL_BLINK_V2'], humanApproval: { state: 'pending', approvedAt: null, approvedBy: null } };
  const outputs = new Map(), put = (p, value) => outputs.set(p, value);
  put(approvalPath, { state: 'pending', approvedAt: null, approvedBy: null, candidateOnly: true, deployable: false, remainingReview: warning });
  put(provenancePath, provenance); put(registrationPath, { ...report, notes: warning });
  const family = { schemaVersion: '1.0.0', status, candidateOnly: true, deployable: false, variants: {}, humanApproval: { family: null, light: lightReceipt.decision, medium: null, heavy: null }, lightMotionApproval: { path: uri(lightReceiptPath), sha256: hash(lightReceiptPath), combatApproved: false }, contactSheets: [report.contactSheetPublicPath], reviewNotes: warning, normalizationReport: uri(reportPath), blinkNormalizationReport: uri(blinkReportPath) };
  for (const [ordinal, strength] of strengths.entries()) {
    const id = `divine_vanish_${strength}`, attackId = `legacy_${id}`;
    // V3 replaced Heavy with a counter stance. This V1 builder retains the
    // explicit retired retreat candidate rather than rewriting its history.
    const attack = strength === 'heavy' ? { startup: 8, active: 0, recovery: 32, hitboxes: [], rootMotionSegments: [{ start: 8, end: 11, velocity: -6 }, { start: 12, end: 19, velocity: -14 }, { start: 20, end: 23, velocity: -6 }] } : strength === 'medium' ? { startup: 5, active: 0, recovery: 23, hitboxes: [], rootMotionSegments: [{ start: 5, end: 7, velocity: -6 }, { start: 8, end: 12, velocity: -16 }, { start: 13, end: 15, velocity: -4 }] } : fighterDefinitions.lamuh_legacy_v2.attacks[attackId];
    assert(attack, 'Build the deterministic Divine Vanish core first');
    assert.equal(attack.active, 0); assert.deepEqual(attack.hitboxes, []);
    assert.equal(attack.startup + attack.recovery, sum(holds[strength]));
    assert.equal(sum(attack.rootMotionSegments.map(s => (s.end - s.start + 1) * s.velocity)), -[60, 110, 160][ordinal]);
    const duration = sum(holds[strength]);
    const sourceSequence = strength === 'light' ? [idle, ...report.frames, idle] : [idle, ...report.frames.slice(0, 3), auraOnly, report.frames[2], ...report.frames.slice(3), idle];
    const frames = sourceSequence.map((f, index) => ({ ...structuredClone(f), index, contact: false, visibleImpact: false, bodyVisible: f.bodyVisible !== false, role: index === 0 ? 'exact idle entry' : index === sourceSequence.length - 1 ? 'exact idle endpoint' : f.role }));
    if (strength === 'light') {
      assert.deepEqual(frames.map(f => ({ publicPath: f.publicPath, sha256: f.sha256 })), lightReceipt.acceptedFrameHashes);
      assert.deepEqual(holds.light, lightReceipt.acceptedExposureTicks);
    }
    const timing = {};
    for (const [candidate, delta] of [['A', -1], ['B', 0], ['C', 1]]) {
      const exposure = [...holds[strength]];
      exposure[1] += delta; exposure[5] += delta; exposure[6] += delta;
      timing[candidate] = { label: candidate === 'B' ? 'RECOMMENDED_GAMEPLAY_ALIGNED' : 'VISUAL_COMPARISON_ONLY', phaseTicks: { startup: attack.startup + delta, active: 0, recovery: attack.recovery + delta * 2 }, durationTicks: sum(exposure), exposureTicks: exposure, preservesSourceFrameOrder: true, duplicateMeaninglessFrames: false, visualComparisonOnly: candidate !== 'B', runtimePhaseTimingsUnchanged: true };
    }
    let rootX = 0;
    const rootPath = Array.from({ length: duration }, (_, tick) => {
      const segment = attack.rootMotionSegments.find(s => tick >= s.start && tick <= s.end);
      if (segment) rootX += segment.velocity;
      return { x: rootX, y: 0 };
    });
    const motionTrack = { owner: 'deterministic_simulation', attackId, hitstopFreezes: true, segments: structuredClone(attack.rootMotionSegments) };
    const closure = { status, candidateOnly: true, deployable: false, rendererAuthoritative: false, simulationAuthoritative: true, simulationHz: 60,
      v1: { sourceFrameCount: 6, historicalDurationTicks: 15, reconstructedExposureTicks: [2, 2, 3, 3, 3, 2], exposureEvidence: 'RECONSTRUCTION_ONLY_CURRENT_PROTECTED_P1_2_0_13_NOMINAL_DURATION', root: { x: 224, y: 382 }, visibleBounds: report.v1Frames.map(f => f.visibleBounds), bodyCenters: report.v1Frames.map(f => f.bodyCenter), contactFrame: null, exactContactTick: null, note: 'Protected P1 metadata is 2/0/13 (15 ticks); P2 is 3/0/15 (18 ticks). Original individual exposure is unrecoverable. These six comparison holds are a reconstruction, not original rhythm. V1 has no contact.' },
      v2: { canvas: report.canvas, root: report.root, rootPath: frames.map(f => f.root), authoredWorldRootPath: rootPath, frames, contactFrame: null, contactFrames: [], singleSequenceScale: report.scale, perFrameRescale: false, visualRecentering: false, placementPolicy: report.registration, visibleImpactCount: 0, gameplayHitCount: 0, rootMotionTrack: motionTrack, auraBakedIntoFrames: report.frames.some(f => f.auraBaked), runtimeAuraOverlay: false, preservationBoundary: { protectedLegacyFramesModified: false, sourceOrderPreserved: false, approvedV2Disposition: 'All previous family and movement source bytes preserved', retainedLegacyQualities: ['backward retreat', 'phase aura'], retiredLegacyBeats: ['legacy scale shrink'], explicitRootMotionOwner: 'deterministic_simulation' } },
      timingCandidates: timing, recommendedTimingCandidate: 'B', impactCandidates: { I2: { label: 'NON_DAMAGING_NO_CONTACT', hitstopTicks: 0, contactExposureDelta: 0, recoilExposureDelta: 0, recoveryExposureDelta: 0 } }, recommendedImpactCandidate: 'I2', unsupported: { counterHit: 'NOT_APPLICABLE_ZERO_HIT_RETREAT' } };
    closure.v2.visualBlink = strength === 'light' ? null : { frameIndex: 4, bodyVisible: false, vulnerabilityUnchanged: true, sourceResolutionRestorationScale: blinkReport.scale, effectOnlyNoBodyRescale: true };
    if (strength === 'light') closure.motionApprovalReceipt = family.lightMotionApproval;
    family.variants[strength] = closure;
    const pack = structuredClone(template), neutral = structuredClone(bundleTemplate.poseLibrary.find(p => p.id === 'neutral_stand'));
    Object.assign(pack, { id, simulationLength: duration, provenance, entryPose: neutral, exitPose: structuredClone(neutral), interruptPoses: [structuredClone(neutral)], transitions: [], landing: [], presentationTrack: [], playbackPolicy: { mode: 'fixed_timeline', cursorOwner: 'simulation', hitstopFreezesCursor: true, holdBehavior: 'none' }, presentationSockets: [{ id: 'body_root', ...report.root, mirrorRule: 'x_prime_equals_canvas_width_minus_x', eventTypes: ['spawn_vfx'] }] });
    pack.sourceFrames = frames.map((f, i) => ({ id: `${id}_frame_${i}`, sourceUri: uri(sourceFile(f)), width: 2048, height: 1536, sha256: f.sha256, approvalUri: uri(approvalPath), provenanceUri: uri(provenancePath), metadataUri: uri(registrationPath) }));
    let cursor = 0;
    pack.exposures = holds[strength].map((duration, i) => { const exposure = { sourceFrameId: `${id}_frame_${i}`, start: cursor, duration }; cursor += duration; return exposure; });
    pack.phases = { anticipation: [], startup: [{ start: 0, end: attack.startup - 1 }], active: [], impact: [], followThrough: [], recovery: [{ start: attack.startup, end: duration - 1 }] };
    pack.anchors = pack.exposures.map(e => ({ frame: e.start, sourceFrameId: e.sourceFrameId, root: report.root, feet: report.root, effect: report.root }));
    pack.groundingTrack = pack.sourceFrames.map(f => ({ sourceFrameId: f.id, root: report.root, nearFoot: report.root, farFoot: report.root, nearFootRole: 'fixed_ground_registration_not_anatomical_measurement', farFootRole: 'fixed_ground_registration_not_anatomical_measurement', projectedGroundPlaneY: 1360, contractVersion: 'fixed_root_candidate_v1' }));
    pack.combatTrack = { startup: attack.startup, active: 0, recovery: attack.recovery, damage: 0, hitstop: 0, hitstun: 0, blockstun: 0, boxes: [], cancelWindows: [], timingAuthorship: { ...structuredClone(template.combatTrack.timingAuthorship), authoredTotalDuration: duration, timingExceptions: [] }, rootMotionTrack: motionTrack };
    pack.transitionCompatibility = [{ fromStates: ['idle', 'walk_forward', 'walk_backward', 'crouch'], toState: id, condition: 'grounded_back_special_strength_input', addsGameplayFrames: false }];
    pack.approvalRecords = [uri(approvalPath)]; pack.validation.creativeWarnings = warning;
    pack.gameplayTimingStatus = { owner: 'simulation', state: 'sandbox_candidate_awaiting_combat_approval', authoritative: false, candidateValues: { startup: attack.startup, active: 0, recovery: attack.recovery, damage: 0, retreatDistance: -rootX }, notes: warning };
    put(path.join(out, strength, 'animation.package.json'), pack);
    review.timingCandidates.moves = review.timingCandidates.moves.filter(m => m.moveId !== id).concat({ moveId: id, sourceFrameCount: 6, authoredFrameCount: frames.length, contactSourceFrames: [], v1Historical: { durationTicks: 15, exposureTicks: closure.v1.reconstructedExposureTicks, contactTick: null, durationEvidence: 'current_protected_runtime_metadata_not_exact_historical_exposures', exposureEvidence: closure.v1.exposureEvidence, note: closure.v1.note }, candidates: timing, recommendedCandidate: 'B', humanReviewStatus: status, note: warning.join(' ') });
    if (!first.coverage.specials.includes(id)) first.coverage.specials.push(id);
  }
  const bundlePath = path.join(out, 'divine-vanish.bundle.json');
  put(bundlePath, { ...bundleTemplate, id: 'lamuh_divine_vanish_v1', displayName: 'Lamuh Divine Vanish candidate', promotionState: 'candidate', animationPackages: strengths.map(s => `${s}/animation.package.json`), packageGroups: { backward_specials: strengths.map(s => `divine_vanish_${s}`) } });
  const publish = ([p, value]) => { if (check) assert.equal(stableJson(read(p)), stableJson(value), `Stale Divine artifact: ${p}`); else { fs.mkdirSync(path.dirname(p), { recursive: true }); fs.writeFileSync(p, JSON.stringify(value, null, 2) + '\n'); } };
  for (const entry of outputs) publish(entry);
  publish([path.join(root, 'generated/manifests/lamuh_divine_vanish_v1.candidate.runtime.json'), compileFromPath(bundlePath)]);
  publish([path.join(base, 'divine-vanish-family.candidate.v1.json'), family]);
  publish([path.join(root, 'public/lamuh-legacy-v2/divine-vanish-v1/manifest.json'), family]);
  publish([path.join(base, 'records/divine-vanish-v1.hash-lock.json'), { candidateOnly: true, deployable: false, rawSources: report.rawSources, frames: Object.fromEntries(Object.entries(family.variants).map(([s, c]) => [s, c.v2.frames.map(f => ({ publicPath: f.publicPath, sha256: f.sha256 }))])) }]);
  if (integrate) {
    assert(!fighterDefinitions.lamuh_legacy_v2.attacks.legacy_divine_vanish_heavy.strikeCounter, 'V1 Heavy retreat is history; cannot integrate over the V3 counter');
    assert(['awaiting_human_radiant_dive_family_review', status].includes(first.currentReviewGate.status), 'Do not rewind another human gate');
    first.currentReviewGate = { ...first.currentReviewGate, status, next: 'Human review of Divine Vanish L/M/H; all prior approval scopes remain unchanged.' };
    first.additiveForgeBundles = (first.additiveForgeBundles || []).filter(b => b.role !== 'backward_specials').concat({ path: 'divine-vanish-packages/divine-vanish.bundle.json', packageCount: 3, role: 'backward_specials' });
    first.technicalStatus = 'DIVINE_VANISH_GROUNDED_RETREAT_PLAYABLE_CANDIDATE';
    review.firstPlayable = first; review.divineVanishFamily = family;
    assert.equal(stableJson(first.currentReviewGate.starredForRevisit), priorStars);
    assert.equal(stableJson(review.timingCandidates.moves.filter(m => !m.moveId.startsWith('divine_vanish_'))), priorTiming);
    assert.equal(stableJson(Object.fromEntries(Object.entries(review).filter(([k]) => !['divineVanishFamily', 'firstPlayable', 'timingCandidates'].includes(k)))), priorReview);
    publish([firstPath, first]); publish([reviewPath, review]);
  }
  for (const [p, expected] of protectedHashes) assert.equal(hash(p), expected, `Protected prior content changed: ${p}`);
  console.log(`${check ? 'CHECKED' : 'BUILT'} Divine Vanish L/M/H${integrate ? ' and review integration' : ' additive packages only'}; zero hits, candidate only.`);
  return family;
}
if (require.main === module) build({ check: process.argv.includes('--check'), integrate: process.argv.includes('--integrate') });
module.exports = { build, holds, status };
