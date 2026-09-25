const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

const engineRoot = path.resolve(__dirname, '..');
const repoRoot = path.resolve(engineRoot, '..', '..');
const contentRoot = path.join(engineRoot, 'content-source', 'characters', 'lamuh-legacy-v2');
const moveRoot = path.join(contentRoot, 'moves', 'crouching-heavy');
const reviewRoot = path.join(repoRoot, 'tools', 'nga-forge', 'review', 'lamuh-legacy-v2-crouching-heavy-v1');
const publicRoot = path.join(engineRoot, 'public', 'lamuh-legacy-v2', 'crouching-heavy-v2');
const publicReviewDataPath = path.join(engineRoot, 'public', 'lamuh-legacy-v2', 'review-data.json');
const timingSourcePath = path.join(contentRoot, 'timing-candidates.v1.json');
const sourceAuditPath = path.join(contentRoot, 'source-audit.v1.json');

const sha256 = (filename) => crypto.createHash('sha256').update(fs.readFileSync(filename)).digest('hex').toUpperCase();
const readJson = (filename) => JSON.parse(fs.readFileSync(filename, 'utf8').replace(/^\uFEFF/, ''));
const writeJson = (filename, value) => {
  fs.mkdirSync(path.dirname(filename), { recursive: true });
  fs.writeFileSync(filename, `${JSON.stringify(value, null, 2)}\n`, 'utf8');
};
const repoRelative = (filename) => path.relative(repoRoot, filename).replaceAll('\\', '/');

const motionLockPath = path.join(moveRoot, 'motion-lock.v1.json');
const normalizationPath = path.join(reviewRoot, 'normalization.report.json');
const styleApprovalPath = path.join(contentRoot, 'records', 'style-checkpoint-v1.approval.json');
for (const filename of [motionLockPath, normalizationPath, styleApprovalPath, publicReviewDataPath, timingSourcePath, sourceAuditPath]) {
  if (!fs.existsSync(filename)) throw new Error(`Missing Lamuh Crouching Heavy prerequisite: ${filename}`);
}

const motionLock = readJson(motionLockPath);
const normalization = readJson(normalizationPath);
const styleApproval = readJson(styleApprovalPath);
const reviewData = readJson(publicReviewDataPath);
const timingSource = readJson(timingSourcePath);
const sourceAudit = readJson(sourceAuditPath);

if (motionLock.status !== 'V1_MOTION_HASH_LOCKED_FOR_OUTLINE_FREE_V2_RECONSTRUCTION' || motionLock.deployable !== false) throw new Error('Crouching Heavy motion lock boundary failed');
if (normalization.status !== 'candidate-only' || normalization.deployable !== false) throw new Error('Crouching Heavy normalization promotion boundary failed');
if (styleApproval.decision !== 'APPROVED_WITH_TARGETED_REPAIR' || styleApproval.approvalBoundary.deployable !== false) throw new Error('Crouching Heavy style approval boundary failed');
if (normalization.frames.length !== 7 || normalization.frames.some((frame) => frame.touchesEdge)) throw new Error('Crouching Heavy normalized frame coverage or edge padding failed');
if (new Set(normalization.frames.map((frame) => frame.normalizedSha256)).size !== 7) throw new Error('Crouching Heavy contains an undeclared duplicate V2 pose');
if (normalization.normalization.perFrameRendererScale !== false || !normalization.normalization.placementPolicy.includes('authored_hip_and_support-foot_root_landmark_alignment')) throw new Error('Crouching Heavy fixed-root renderer contract failed');
if (normalization.normalization.sequenceWideScale !== 0.95 || normalization.visualValidation?.sequenceWideCorrectionOnly !== true) throw new Error('Crouching Heavy user-requested sequence-wide scale correction failed');
if (normalization.visualValidation?.meaningfulMagentaPixelsRemaining !== 0 || normalization.frames.some((frame) => frame.meaningfulMagentaPixelsRemaining !== 0)) throw new Error('Crouching Heavy still contains meaningful magenta outline pixels');
if (normalization.visualValidation?.maxContactNeighborSilhouetteHeightDeltaPct > normalization.visualValidation?.contactSilhouetteHeightRegressionThresholdPct) throw new Error('Crouching Heavy contact silhouette-height regression failed');
if (normalization.visibleImpactCount !== 1 || motionLock.hitCountContract.visibleImpacts !== 1 || motionLock.hitCountContract.gameplayHits !== 1) throw new Error('Crouching Heavy one-hit parity failed');
if (normalization.contactFrame !== motionLock.hitCountContract.impactFrame || normalization.contactPresentation.touchesEdge || normalization.contactPresentation.vfxEnabled !== false || normalization.contactPresentation.classification !== 'DISABLE_FOR_NOW' || normalization.contactPresentation.bodyOnlyForAllOutcomes !== true) throw new Error('Crouching Heavy body-only contact presentation contract failed');

for (const sourceFrame of motionLock.legacyFrames) {
  const sourcePath = path.join(contentRoot, 'source-frames', 'crouching_heavy', `crouching_heavy_${String(sourceFrame.index).padStart(2, '0')}.png`);
  if (!fs.existsSync(sourcePath) || sha256(sourcePath) !== sourceFrame.sha256) throw new Error(`Protected V1 Crouching Heavy frame changed: ${sourceFrame.index}`);
}

fs.mkdirSync(publicRoot, { recursive: true });
const publicFrames = normalization.frames.map((frame) => {
  const source = path.join(repoRoot, frame.normalizedPath);
  if (!fs.existsSync(source) || sha256(source) !== frame.normalizedSha256) throw new Error(`Crouching Heavy normalized hash mismatch: ${frame.index}`);
  const destination = path.join(publicRoot, path.basename(source));
  fs.copyFileSync(source, destination);
  if (sha256(destination) !== frame.normalizedSha256) throw new Error(`Crouching Heavy public copy mismatch: ${frame.index}`);
  return {
    index: frame.index,
    role: frame.role,
    publicPath: `/lamuh-legacy-v2/crouching-heavy-v2/${path.basename(destination)}`,
    sha256: frame.normalizedSha256,
    sourceSha256: frame.rawSha256,
    root: frame.normalizedRoot,
    visibleBounds: frame.visibleBounds,
    bodyCenter: frame.visualCentroid,
    contact: frame.index === motionLock.hitCountContract.impactFrame,
    visibleImpact: frame.index === motionLock.hitCountContract.impactFrame
  };
});

const contactBodyFrame = publicFrames[motionLock.hitCountContract.impactFrame];
if (contactBodyFrame.sha256 !== normalization.contactPresentation.sha256) throw new Error('Crouching Heavy body-only contact hash mismatch');

const candidates = Object.fromEntries(Object.entries(motionLock.timingCandidates).map(([id, candidate]) => [id, {
  label: candidate.label,
  phaseTicks: candidate.phaseTicks,
  durationTicks: candidate.durationTicks,
  exposureTicks: candidate.exposureTicks,
  preservesSourceFrameOrder: true,
  duplicateMeaninglessFrames: false
}]));
const impactCandidates = Object.fromEntries(Object.entries(motionLock.impactCandidates).map(([id, candidate]) => [id, {
  label: candidate.label,
  hitstopTicks: candidate.hitstopTicks,
  contactExposureDelta: 0,
  recoilExposureDelta: 0,
  recoveryExposureDelta: 0
}]));

const timingMove = timingSource.moves.find((move) => move.moveId === 'crouching_heavy');
if (!timingMove || timingMove.v1Historical.durationTicks !== 31) throw new Error('Crouching Heavy historical timing evidence is missing');
timingMove.sourceFrameCount = 7;
timingMove.authoredFrameCount = 7;
timingMove.contactSourceFrames = [motionLock.hitCountContract.impactFrame];
timingMove.candidates = candidates;
timingMove.recommendedCandidate = motionLock.recommendedTimingCandidate;
timingMove.humanReviewStatus = null;
timingMove.note = 'Crown Riser preserves the V1 low coil, lead-knee drive, same rear-hand rise, impact extension, held follow-through and guarded return. V2 replaces the exact duplicate drawing with one recovery connector and keeps the hold in exposure timing.';
writeJson(timingSourcePath, timingSource);

const publicTimingMove = reviewData.timingCandidates.moves.find((move) => move.moveId === 'crouching_heavy');
if (!publicTimingMove) throw new Error('Crouching Heavy public timing entry is missing');
Object.assign(publicTimingMove, JSON.parse(JSON.stringify(timingMove)));
reviewData.runtimeTimelines.crouching_heavy = {
  exposureTicks: candidates.B.exposureTicks,
  durationTicks: candidates.B.durationTicks,
  contactSourceFrames: [motionLock.hitCountContract.impactFrame],
  contactTick: candidates.B.exposureTicks.slice(0, motionLock.hitCountContract.impactFrame).reduce((sum, value) => sum + value, 0)
};

const auditEntry = sourceAudit.animations.find((entry) => entry.animationName === 'launcher_crouching_heavy');
if (!auditEntry) throw new Error('Crouching Heavy source-audit entry is missing');
auditEntry.sourceMotionReusable = true;
auditEntry.visualArtworkReusable = false;
auditEntry.v2Disposition = 'PRESERVE_WITH_V2_COMBAT_UPDATE';
auditEntry.needsV2Redesign = false;
auditEntry.reviewNotes = 'Preserve the V1 low-to-high same-arm launcher arc. Reconstruct the purple-outlined artwork in modern NGA V2 style, retain the duplicate follow-through as timing exposure, and use one authored recovery connector plus modern deterministic launcher metadata.';
writeJson(sourceAuditPath, sourceAudit);

const v1BodyCenters = [
  { x: 224, y: 221 }, { x: 224, y: 210 }, { x: 220, y: 205 }, { x: 223, y: 204 },
  { x: 225, y: 206 }, { x: 225, y: 206 }, { x: 224, y: 220 }
];
const v1VisibleBounds = [
  { minX: 104, minY: 42, maxX: 344, maxY: 381 }, { minX: 98, minY: 30, maxX: 351, maxY: 381 },
  { minX: 100, minY: 32, maxX: 338, maxY: 381 }, { minX: 125, minY: 38, maxX: 319, maxY: 381 },
  { minX: 134, minY: 39, maxX: 318, maxY: 381 }, { minX: 134, minY: 39, maxX: 318, maxY: 381 },
  { minX: 105, minY: 40, maxX: 342, maxY: 381 }
];

const closure = {
  schemaVersion: '1.0.0',
  status: 'awaiting_human_crouching_heavy_motion_and_timing_review',
  candidateOnly: true,
  deployable: false,
  rendererAuthoritative: false,
  simulationAuthoritative: true,
  simulationHz: 60,
  motionLock: { path: repoRelative(motionLockPath), sha256: sha256(motionLockPath) },
  normalizationReport: { path: repoRelative(normalizationPath), sha256: sha256(normalizationPath) },
  styleApproval: { path: repoRelative(styleApprovalPath), sha256: sha256(styleApprovalPath), decision: styleApproval.decision },
  v1: {
    sourceFrameCount: 7,
    historicalDurationTicks: timingMove.v1Historical.durationTicks,
    reconstructedExposureTicks: timingMove.v1Historical.exposureTicks,
    exposureEvidence: timingMove.v1Historical.exposureEvidence,
    root: { x: 224, y: 382 },
    visibleBounds: v1VisibleBounds,
    bodyCenters: v1BodyCenters,
    contactFrame: null,
    exactContactTick: null,
    note: timingMove.v1Historical.note
  },
  v2: {
    canvas: normalization.normalization.canvas,
    root: normalization.normalization.normalizedRoot,
    rootPath: publicFrames.map(() => normalization.normalization.normalizedRoot),
    frames: publicFrames,
    contactFrame: motionLock.hitCountContract.impactFrame,
    contactPresentation: {
      publicPath: contactBodyFrame.publicPath,
      sha256: contactBodyFrame.sha256,
      bodyOnlyOnWhiff: true,
      bodyOnlyForAllOutcomes: true,
      vfxEnabled: false,
      classification: 'DISABLE_FOR_NOW',
      allowedOutcomes: [],
      separationStatus: 'BODY_ONLY_ALL_OUTCOMES_VFX_DISABLED_BY_HUMAN_FEEDBACK'
    },
    singleSequenceScale: normalization.normalization.sequenceWideScale,
    sourceArtCameraCorrections: normalization.frames.map((frame) => frame.sourceScaleCorrection),
    perFrameRescale: false,
    visualRecentering: false,
    placementPolicy: normalization.normalization.placementPolicy,
    visibleImpactCount: 1,
    gameplayHitCount: 1
  },
  timingCandidates: candidates,
  recommendedTimingCandidate: motionLock.recommendedTimingCandidate,
  impactCandidates,
  recommendedImpactCandidate: motionLock.recommendedImpactCandidate,
  unsupported: { counterHit: 'PRESENTATION_CANDIDATE_NOT_YET_AUTHORED' },
  benchmarkQuestions: motionLock.benchmarkQuestions,
  humanApproval: { motion: null, timing: null, selectedTimingCandidate: null, combatProfile: null, record: null }
};

reviewData.authority = { renderingAuthoritative: false, simulationAuthoritative: true, candidateOnly: true, deployable: false };
reviewData.crouchingHeavyClosure = closure;
reviewData.firstPlayable.humanReviewStatus = 'awaiting_human_crouching_heavy_motion_and_timing_review';
reviewData.firstPlayable.candidateOnly = true;
reviewData.firstPlayable.deployable = false;
writeJson(publicReviewDataPath, reviewData);

writeJson(path.join(moveRoot, 'closure.candidate.v1.json'), {
  schemaVersion: '1.0.0',
  id: 'crouching_heavy_crown_riser_candidate_v1',
  promotionState: 'candidate',
  deployable: false,
  productionApproved: false,
  motionLock: closure.motionLock,
  styleApproval: closure.styleApproval,
  normalizationReport: closure.normalizationReport,
  frames: publicFrames.map((frame) => ({ index: frame.index, role: frame.role, sourceUri: `repo://${normalization.frames[frame.index].normalizedPath}`, sha256: frame.sha256, root: frame.root, visibleBounds: frame.visibleBounds })),
  contactPresentation: closure.v2.contactPresentation,
  hitCountContract: { visibleImpacts: 1, gameplayHits: 1 },
  timingCandidates: closure.timingCandidates,
  impactCandidates,
  approvalStatus: closure.status,
  humanApproval: closure.humanApproval
});

console.log(`Built Lamuh Crouching Heavy Crown Riser candidate with ${publicFrames.length} distinct V2 frames; single-hit parity and fixed anatomical scale preserved; candidate-only, deployable false.`);
