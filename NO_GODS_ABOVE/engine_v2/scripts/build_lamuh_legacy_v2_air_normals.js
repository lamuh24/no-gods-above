const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

const engineRoot = path.resolve(__dirname, '..');
const repoRoot = path.resolve(engineRoot, '..', '..');
const contentRoot = path.join(engineRoot, 'content-source', 'characters', 'lamuh-legacy-v2');
const reviewRoot = path.join(repoRoot, 'tools', 'nga-forge', 'review', 'lamuh-legacy-v2-air-normals-v1');
const normalizationPath = path.join(reviewRoot, 'normalization.report.json');
const timingSourcePath = path.join(contentRoot, 'timing-candidates.v1.json');
const sourceAuditPath = path.join(contentRoot, 'source-audit.v1.json');
const styleApprovalPath = path.join(contentRoot, 'records', 'style-checkpoint-v1.approval.json');
const publicReviewDataPath = path.join(engineRoot, 'public', 'lamuh-legacy-v2', 'review-data.json');
const publicRoot = path.join(engineRoot, 'public', 'lamuh-legacy-v2', 'air-normals-v2');

const sha256 = (filename) => crypto.createHash('sha256').update(fs.readFileSync(filename)).digest('hex').toUpperCase();
const readJson = (filename) => JSON.parse(fs.readFileSync(filename, 'utf8').replace(/^\uFEFF/, ''));
const writeJson = (filename, value) => {
  fs.mkdirSync(path.dirname(filename), { recursive: true });
  fs.writeFileSync(filename, `${JSON.stringify(value, null, 2)}\n`, 'utf8');
};
const repoRelative = (filename) => path.relative(repoRoot, filename).replaceAll('\\', '/');
const publicPathFor = (filename) => `/${path.relative(path.join(engineRoot, 'public'), filename).replaceAll('\\', '/')}`;

for (const filename of [normalizationPath, timingSourcePath, sourceAuditPath, styleApprovalPath, publicReviewDataPath]) {
  if (!fs.existsSync(filename)) throw new Error(`Missing Lamuh air-normal prerequisite: ${filename}`);
}

const normalization = readJson(normalizationPath);
const timingSource = readJson(timingSourcePath);
const sourceAudit = readJson(sourceAuditPath);
const styleApproval = readJson(styleApprovalPath);
const reviewData = readJson(publicReviewDataPath);
if (normalization.status !== 'candidate-only' || normalization.deployable !== false || normalization.moves.length !== 3) throw new Error('Air-normal normalization promotion boundary failed');
if (normalization.protectedLegacyAtlas.sha256 !== '1FFCD0B944A166F6DB7B79D485030741A9A2BF85C4C1CD47C6B4F3D76D9E249F') throw new Error('Protected V1 air-normal atlas hash lock failed');
if (normalization.visualValidation.meaningfulMagentaPixelsRemaining !== 0 || normalization.visualValidation.touchesEdge || !normalization.visualValidation.allFramesDistinct || !normalization.visualValidation.visibleImpactParity) throw new Error('Air-normal visual validation failed');
if (normalization.visualValidation.crossMoveFirstFrameHeightDeltaPct > 8) throw new Error('Air-normal cross-move first-frame scale delta exceeds 8%');
if (styleApproval.decision !== 'APPROVED_WITH_TARGETED_REPAIR' || styleApproval.approvalBoundary.deployable !== false) throw new Error('Lamuh V2 style checkpoint boundary failed');

const config = {
  air_light: {
    closureKey: 'airLightClosure', impactHitstop: [2, 3, 4],
    benchmarkQuestions: ['Do chamber, extension, one palm contact, follow-through, and recovery read as one continuous action?', 'Does B keep the palm acceleration fast while the connectors remove the pose jump?', 'Does the guarded recovery connect naturally to continued air movement?']
  },
  air_medium: {
    closureKey: 'airMediumClosure', impactHitstop: [3, 4, 5],
    benchmarkQuestions: ['Do chamber, extension, one side-kick contact, retraction, knee recoil, and recovery read as one continuous action?', 'Does B keep the kick fast while the connectors remove the pose jump?', 'Does the compact recovery support j.M to j.H chaining?']
  },
  air_heavy: {
    closureKey: 'airHeavyClosure', impactHitstop: [6, 7, 8],
    benchmarkQuestions: ['Does the descending two-hand slam keep V1 body compression and vertical momentum?', 'Is frame 03 clearly the only contact?', 'Does the recoil return to air or landing without a pose teleport?']
  }
};

fs.mkdirSync(publicRoot, { recursive: true });
const publicContactSheet = path.join(publicRoot, path.basename(normalization.contactSheet.path));
const contactSheetSource = path.join(repoRoot, normalization.contactSheet.path);
if (sha256(contactSheetSource) !== normalization.contactSheet.sha256) throw new Error('Air-normal contact sheet hash mismatch');
fs.copyFileSync(contactSheetSource, publicContactSheet);

for (const move of normalization.moves) {
  const moveConfig = config[move.moveId];
  if (!moveConfig) throw new Error(`Unexpected air-normal move: ${move.moveId}`);
  const timingMove = timingSource.moves.find((entry) => entry.moveId === move.moveId);
  const auditEntry = sourceAudit.animations.find((entry) => entry.animationName === move.moveId);
  if (!timingMove || !auditEntry) throw new Error(`Missing timing or audit entry for ${move.moveId}`);
  if (timingMove.sourceFrameCount !== move.sourceFrameCount || move.frames.length !== move.authoredFrameCount) throw new Error(`${move.moveId} frame-count contract failed`);
  if (move.visibleImpactCount !== move.contactFrames.length || move.gameplayHitCount !== move.contactFrames.length || move.contactPresentation.vfxEnabled !== false || move.contactPresentation.bodyOnlyForAllOutcomes !== true) throw new Error(`${move.moveId} body-only hit-parity contract failed`);

  for (const frame of move.frames) {
    const sourceV1 = path.join(repoRoot, frame.sourceV1Path);
    if (!fs.existsSync(sourceV1) || sha256(sourceV1) !== frame.sourceV1Sha256) throw new Error(`Protected V1 ${move.moveId} source frame changed: ${frame.index}`);
  }

  const movePublicRoot = path.join(publicRoot, move.moveId.replaceAll('_', '-'));
  fs.mkdirSync(movePublicRoot, { recursive: true });
  const publicFrames = move.frames.map((frame) => {
    const source = path.join(repoRoot, frame.normalizedPath);
    if (!fs.existsSync(source) || sha256(source) !== frame.normalizedSha256) throw new Error(`${move.moveId} normalized hash mismatch: ${frame.index}`);
    const destination = path.join(movePublicRoot, path.basename(source));
    fs.copyFileSync(source, destination);
    if (sha256(destination) !== frame.normalizedSha256) throw new Error(`${move.moveId} public copy mismatch: ${frame.index}`);
    return {
      index: frame.index,
      sourceV1Index: frame.sourceV1Index,
      sourceV1ReferenceIndex: frame.sourceV1ReferenceIndex,
      rawFrameIndex: frame.rawFrameIndex,
      frameOrigin: frame.frameOrigin,
      sourceRelationship: frame.sourceRelationship,
      role: frame.role,
      publicPath: publicPathFor(destination),
      sha256: frame.normalizedSha256,
      sourceSha256: frame.sourceV1Sha256,
      root: frame.normalizedRoot,
      visibleBounds: frame.visibleBounds,
      bodyCenter: frame.visualCentroid,
      contact: move.contactFrames.includes(frame.index),
      visibleImpact: move.contactFrames.includes(frame.index)
    };
  });

  const timingCandidates = Object.fromEntries(Object.entries(timingMove.candidates).map(([id, candidate]) => [id, {
    label: candidate.label,
    phaseTicks: candidate.phaseTicks,
    durationTicks: candidate.durationTicks,
    exposureTicks: candidate.exposureTicks,
    preservesSourceFrameOrder: true,
    duplicateMeaninglessFrames: false
  }]));
  for (const [id, candidate] of Object.entries(timingCandidates)) {
    if (candidate.exposureTicks.length !== move.authoredFrameCount || candidate.exposureTicks.reduce((sum, value) => sum + value, 0) !== candidate.durationTicks) throw new Error(`${move.moveId} timing candidate ${id} coverage failed`);
  }
  const impactCandidates = Object.fromEntries(['I1', 'I2', 'I3'].map((id, index) => [id, {
    label: index === 0 ? 'clean restrained impact' : index === 1 ? 'recommended readable impact' : 'heavier review alternate',
    hitstopTicks: moveConfig.impactHitstop[index],
    contactExposureDelta: 0,
    recoilExposureDelta: 0,
    recoveryExposureDelta: 0
  }]));

  const hasTargetedConnectorArt = move.frames.some((frame) => frame.frameOrigin === 'TARGETED_CONNECTOR_ART' || frame.frameOrigin === 'TARGETED_SMOOTH_RECONSTRUCTION');
  const motionLockPath = path.join(contentRoot, 'moves', move.moveId.replaceAll('_', '-'), 'motion-lock.v1.json');
  const motionLock = {
    schemaVersion: '1.0.0',
    subject: `lamuh_legacy_v2.${move.moveId}.motion_lock.v1`,
    status: hasTargetedConnectorArt ? 'V1_MOTION_REFERENCE_HASH_LOCKED_WITH_TARGETED_V2_CONNECTORS' : 'V1_MOTION_HASH_LOCKED_FOR_OUTLINE_FREE_V2_RECONSTRUCTION',
    candidateOnly: true,
    deployable: false,
    protectedAtlas: normalization.protectedLegacyAtlas,
    legacyFrames: move.frames.map((frame) => ({ index: frame.sourceV1ReferenceIndex, authoredIndex: frame.index, row: move.sourceRow, path: frame.sourceV1Path, sha256: frame.sourceV1Sha256, relationship: frame.sourceRelationship })),
    frameProvenance: move.frames.map((frame) => ({ authoredIndex: frame.index, rawFrameIndex: frame.rawFrameIndex, frameOrigin: frame.frameOrigin, sourceV1ReferenceIndex: frame.sourceV1ReferenceIndex, rawPath: frame.rawPath, rawSha256: frame.rawSha256 })),
    motionPolicy: { sourceFrameOrderPreserved: true, targetedConnectorArt: hasTargetedConnectorArt, v2Disposition: move.v2Disposition, motionNote: move.motionNote },
    hitCountContract: { impactFrame: move.contactFrame, impactFrames: move.contactFrames, visibleImpacts: move.visibleImpactCount, gameplayHits: move.gameplayHitCount },
    timingCandidates,
    recommendedTimingCandidate: 'B',
    impactCandidates,
    recommendedImpactCandidate: 'I2',
    benchmarkQuestions: moveConfig.benchmarkQuestions
  };
  writeJson(motionLockPath, motionLock);

  timingMove.authoredFrameCount = move.authoredFrameCount;
  timingMove.contactSourceFrames = move.contactFrames;
  timingMove.humanReviewStatus = null;
  timingMove.note = move.motionNote;
  const v1ContactFrame = move.frames[move.contactFrame].sourceV1Index;
  const v1ContactTick = timingMove.v1Historical.exposureTicks.slice(0, v1ContactFrame).reduce((sum, value) => sum + value, 0);
  const v1Bounds = Array.from({ length: move.sourceFrameCount }, () => ({ minX: 0, minY: 0, maxX: 447, maxY: 447 }));
  const v1Centers = Array.from({ length: move.sourceFrameCount }, () => ({ x: 224, y: 224 }));
  const contactBodyFrame = publicFrames[move.contactFrame];
  const closure = {
    schemaVersion: '1.0.0',
    status: 'awaiting_human_air_normal_motion_scale_and_timing_review',
    candidateOnly: true,
    deployable: false,
    rendererAuthoritative: false,
    simulationAuthoritative: true,
    simulationHz: 60,
    motionLock: { path: repoRelative(motionLockPath), sha256: sha256(motionLockPath) },
    normalizationReport: { path: repoRelative(normalizationPath), sha256: sha256(normalizationPath) },
    styleApproval: { path: repoRelative(styleApprovalPath), sha256: sha256(styleApprovalPath), decision: styleApproval.decision },
    v1: {
      sourceFrameCount: move.sourceFrameCount,
      historicalDurationTicks: timingMove.v1Historical.durationTicks,
      reconstructedExposureTicks: timingMove.v1Historical.exposureTicks,
      exposureEvidence: timingMove.v1Historical.exposureEvidence,
      root: { x: 224, y: 382 },
      visibleBounds: v1Bounds,
      bodyCenters: v1Centers,
      contactFrame: v1ContactFrame,
      exactContactTick: v1ContactTick,
      note: timingMove.v1Historical.note
    },
    v2: {
      canvas: move.normalization.canvas,
      root: move.normalization.normalizedRoot,
      rootPath: publicFrames.map(() => move.normalization.normalizedRoot),
      frames: publicFrames,
      contactFrame: move.contactFrame,
      contactFrames: move.contactFrames,
      contactPresentation: {
        publicPath: contactBodyFrame.publicPath,
        sha256: contactBodyFrame.sha256,
        bodyOnlyOnWhiff: true,
        bodyOnlyForAllOutcomes: true,
        vfxEnabled: false,
        classification: 'DISABLE_FOR_NOW',
        allowedOutcomes: [],
        contacts: move.contactFrames.map((frameIndex) => ({ frame: frameIndex, publicPath: publicFrames[frameIndex].publicPath, sha256: publicFrames[frameIndex].sha256, role: publicFrames[frameIndex].role })),
        separationStatus: 'BODY_ONLY_ALL_OUTCOMES_AIR_NORMAL_REVIEW_BATCH'
      },
      singleSequenceScale: move.normalization.sequenceWideScale,
      perFrameRescale: false,
      visualRecentering: false,
      placementPolicy: move.normalization.placementPolicy,
      visibleImpactCount: move.visibleImpactCount,
      gameplayHitCount: move.gameplayHitCount
    },
    timingCandidates,
    recommendedTimingCandidate: 'B',
    impactCandidates,
    recommendedImpactCandidate: 'I2',
    unsupported: { counterHit: 'PRESENTATION_CANDIDATE_NOT_YET_AUTHORED' },
    benchmarkQuestions: moveConfig.benchmarkQuestions,
    humanApproval: { motion: null, timing: null, selectedTimingCandidate: null, combatProfile: null, record: null }
  };
  reviewData[moveConfig.closureKey] = closure;
  reviewData.runtimeTimelines[move.moveId] = {
    exposureTicks: timingCandidates.B.exposureTicks,
    durationTicks: timingCandidates.B.durationTicks,
    contactSourceFrames: move.contactFrames,
    contactTick: timingCandidates.B.exposureTicks.slice(0, move.contactFrame).reduce((sum, value) => sum + value, 0),
    contactTicks: move.contactFrames.map((frameIndex) => timingCandidates.B.exposureTicks.slice(0, frameIndex).reduce((sum, value) => sum + value, 0))
  };

  auditEntry.sourceMotionReusable = true;
  auditEntry.visualArtworkReusable = false;
  auditEntry.v2Disposition = move.v2Disposition;
  auditEntry.needsV2Redesign = move.v2Disposition === 'MODERNIZE';
  auditEntry.reviewNotes = move.motionNote;

  writeJson(path.join(contentRoot, 'moves', move.moveId.replaceAll('_', '-'), 'closure.candidate.v1.json'), {
    schemaVersion: '1.0.0', moveId: move.moveId, promotionState: 'candidate', candidateOnly: true, deployable: false, productionApproved: false,
    motionLock: repoRelative(motionLockPath), normalizationReport: repoRelative(normalizationPath), publicFrameCount: publicFrames.length,
    contactFrame: move.contactFrame, contactFrames: move.contactFrames, visibleImpactCount: move.visibleImpactCount, gameplayHitCount: move.gameplayHitCount, vfxEnabled: false,
    humanReviewStatus: closure.status
  });
}

reviewData.timingCandidates = timingSource;
reviewData.sourceAudit = sourceAudit;
reviewData.authority = { renderingAuthoritative: false, simulationAuthoritative: true, candidateOnly: true, deployable: false };
reviewData.airNormalsBatch = {
  status: 'awaiting_human_air_normal_motion_scale_and_timing_review',
  candidateOnly: true,
  deployable: false,
  contactSheetPublicPath: publicPathFor(publicContactSheet),
  contactSheetSha256: sha256(publicContactSheet),
  humanReviewStatus: 'awaiting_human_air_normal_motion_scale_and_timing_review'
};
reviewData.firstPlayable.technicalStatus = 'FIRST_PLAYABLE_PLUS_AIR_NORMALS_REVIEW_CANDIDATE';
reviewData.firstPlayable.humanReviewStatus = 'awaiting_human_air_normal_motion_scale_and_timing_review';
reviewData.firstPlayable.coverage.airNormals = ['air_light', 'air_medium', 'air_heavy'];
reviewData.firstPlayable.knownArtDebt = reviewData.firstPlayable.knownArtDebt.filter((item) => !item.includes('all modern movement and ground-normal artwork'));
reviewData.firstPlayable.knownArtDebt.push('modern movement, ground-normal, and air-normal artwork remains candidate-only pending per-set human motion, scale, transition, and timing gates');

writeJson(timingSourcePath, timingSource);
writeJson(sourceAuditPath, sourceAudit);
writeJson(publicReviewDataPath, reviewData);
console.log('Built Lamuh Legacy V2 Air Light, Air Medium, and Air Heavy review closures.');
