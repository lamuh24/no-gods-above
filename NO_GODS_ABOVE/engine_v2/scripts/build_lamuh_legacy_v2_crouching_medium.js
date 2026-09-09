const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

const engineRoot = path.resolve(__dirname, '..');
const repoRoot = path.resolve(engineRoot, '..', '..');
const contentRoot = path.join(engineRoot, 'content-source', 'characters', 'lamuh-legacy-v2');
const moveRoot = path.join(contentRoot, 'moves', 'crouching-medium');
const reviewRoot = path.join(repoRoot, 'tools', 'nga-forge', 'review', 'lamuh-legacy-v2-crouching-medium-v1');
const publicRoot = path.join(engineRoot, 'public', 'lamuh-legacy-v2', 'crouching-medium-v2');
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
const humanApprovalPath = path.join(contentRoot, 'records', 'crouching-medium-v1.approval.json');
for (const filename of [motionLockPath, normalizationPath, styleApprovalPath, humanApprovalPath, publicReviewDataPath, timingSourcePath, sourceAuditPath]) {
  if (!fs.existsSync(filename)) throw new Error(`Missing Lamuh Crouching Medium prerequisite: ${filename}`);
}

const motionLock = readJson(motionLockPath);
const normalization = readJson(normalizationPath);
const styleApproval = readJson(styleApprovalPath);
const humanApproval = readJson(humanApprovalPath);
const reviewData = readJson(publicReviewDataPath);
const timingSource = readJson(timingSourcePath);
const sourceAudit = readJson(sourceAuditPath);

if (motionLock.status !== 'V1_ALIAS_EVIDENCE_LOCKED_FOR_DISTINCT_V2_LOW_SWEEP_MODERNIZATION' || motionLock.deployable !== false) throw new Error('Crouching Medium motion lock boundary failed');
if (normalization.status !== 'candidate-only' || normalization.deployable !== false) throw new Error('Crouching Medium normalization promotion boundary failed');
if (styleApproval.decision !== 'APPROVED_WITH_TARGETED_REPAIR' || styleApproval.approvalBoundary.deployable !== false) throw new Error('Crouching Medium style approval boundary failed');
if (humanApproval.decisions?.motion !== 'APPROVED_V1_MOTION_PRESERVED' || humanApproval.decisions?.timing !== 'APPROVED_V2_RETIMING' || humanApproval.decisions?.selectedTimingCandidate !== 'B') throw new Error('Crouching Medium human motion/timing approval is missing or invalid');
if (humanApproval.approvalBoundary?.combatProfileApproved !== false || humanApproval.approvalBoundary?.runtimeArtPromotionApproved !== false || humanApproval.approvalBoundary?.deployable !== false) throw new Error('Crouching Medium human approval exceeded its candidate-only boundary');
if (normalization.frames.length !== 8 || normalization.frames.some((frame) => frame.touchesEdge)) throw new Error('Crouching Medium normalized frame coverage or edge padding failed');
if (new Set(normalization.frames.map((frame) => frame.normalizedSha256)).size !== 8) throw new Error('Crouching Medium contains an undeclared duplicate pose');
if (normalization.normalization.perFrameRendererScale !== false || !normalization.normalization.placementPolicy.includes('authored_hip_and_support-foot_root_landmark_alignment')) throw new Error('Crouching Medium fixed-root renderer contract failed');
if (normalization.visualValidation?.meaningfulMagentaPixelsRemaining !== 0 || normalization.frames.some((frame) => frame.meaningfulMagentaPixelsRemaining !== 0)) throw new Error('Crouching Medium still contains meaningful magenta outline pixels');
if (normalization.visibleImpactCount !== 1 || motionLock.hitCountContract.visibleImpacts !== 1 || motionLock.hitCountContract.gameplayHits !== 1) throw new Error('Crouching Medium one-hit parity failed');
if (normalization.contactFrame !== motionLock.hitCountContract.impactFrame || normalization.contactPresentation.touchesEdge) throw new Error('Crouching Medium contact presentation contract failed');

fs.mkdirSync(publicRoot, { recursive: true });
const publicFrames = normalization.frames.map((frame) => {
  const source = path.join(repoRoot, frame.normalizedPath);
  if (!fs.existsSync(source) || sha256(source) !== frame.normalizedSha256) throw new Error(`Crouching Medium normalized hash mismatch: ${frame.index}`);
  const destination = path.join(publicRoot, path.basename(source));
  fs.copyFileSync(source, destination);
  if (sha256(destination) !== frame.normalizedSha256) throw new Error(`Crouching Medium public copy mismatch: ${frame.index}`);
  return {
    index: frame.index,
    role: frame.role,
    publicPath: `/lamuh-legacy-v2/crouching-medium-v2/${path.basename(destination)}`,
    sha256: frame.normalizedSha256,
    sourceSha256: frame.rawSha256,
    root: frame.normalizedRoot,
    visibleBounds: frame.visibleBounds,
    bodyCenter: frame.visualCentroid,
    contact: frame.index === motionLock.hitCountContract.impactFrame,
    visibleImpact: frame.index === motionLock.hitCountContract.impactFrame
  };
});

const compositeSource = path.join(repoRoot, normalization.contactPresentation.path);
const compositeDestination = path.join(publicRoot, path.basename(compositeSource));
if (sha256(compositeSource) !== normalization.contactPresentation.sha256) throw new Error('Crouching Medium contact composite source hash mismatch');
fs.copyFileSync(compositeSource, compositeDestination);
if (sha256(compositeDestination) !== normalization.contactPresentation.sha256) throw new Error('Crouching Medium public contact composite mismatch');

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

const timingMove = timingSource.moves.find((move) => move.moveId === 'crouching_medium');
if (!timingMove || timingMove.v1Historical.durationTicks !== 19) throw new Error('Crouching Medium historical timing evidence is missing');
timingMove.sourceFrameCount = 8;
timingMove.authoredFrameCount = 8;
timingMove.contactSourceFrames = [motionLock.hitCountContract.impactFrame];
timingMove.candidates = candidates;
timingMove.recommendedCandidate = motionLock.recommendedTimingCandidate;
timingMove.humanReviewStatus = humanApproval.decisions.timing;
timingMove.note = 'Sweep Line modernization: V1 Crouching Medium aliased Standing Medium art, so V2 preserves medium-weight load, hip-led torque, fast post-load acceleration, secondary-motion follow-through and guarded recovery while authoring a true one-hit lead-leg low sweep.';
writeJson(timingSourcePath, timingSource);

const publicTimingMove = reviewData.timingCandidates.moves.find((move) => move.moveId === 'crouching_medium');
if (!publicTimingMove) throw new Error('Crouching Medium public timing entry is missing');
Object.assign(publicTimingMove, JSON.parse(JSON.stringify(timingMove)));
// The recommended candidate is the single source of runtime presentation truth for this move.
// Without this the review-data bootstrap track survives, which previously truncated the clip and
// dropped authored follow-through and recovery frames.
reviewData.runtimeTimelines.crouching_medium = {
  exposureTicks: candidates.B.exposureTicks,
  durationTicks: candidates.B.durationTicks,
  contactSourceFrames: [motionLock.hitCountContract.impactFrame],
  contactTick: candidates.B.exposureTicks.slice(0, motionLock.hitCountContract.impactFrame).reduce((sum, value) => sum + value, 0)
};
if (reviewData.runtimeTimelines.crouching_medium.exposureTicks.length !== publicFrames.length) throw new Error('Crouching Medium runtime timeline drops authored frames');

let auditEntry = sourceAudit.animations.find((entry) => entry.animationName === 'crouching_medium');
if (!auditEntry) {
  const aliasSource = sourceAudit.animations.find((entry) => entry.animationName === 'standing_medium');
  if (!aliasSource) throw new Error('Crouching Medium legacy Standing Medium alias evidence is missing');
  auditEntry = {
    ...JSON.parse(JSON.stringify(aliasSource)),
    animationName: 'crouching_medium',
    legacyAliasOf: 'standing_medium',
    originalExposureTiming: { source: 'historical_v1_c032', durationTicks: 19, meanTicksPerSourceFrame: 2.38 },
    historicalV1Combat: { durationTicks: 19, damage: 54 },
    currentLamuhLegacyCombat: { phases: [5, 5, 9], damage: 44 }
  };
  const standingMediumIndex = sourceAudit.animations.indexOf(aliasSource);
  sourceAudit.animations.splice(standingMediumIndex + 1, 0, auditEntry);
}
auditEntry.sourceMotionReusable = true;
auditEntry.visualArtworkReusable = false;
auditEntry.v2Disposition = 'MODERNIZE';
auditEntry.needsV2Redesign = true;
auditEntry.reviewNotes = 'V1 Crouching Medium aliases all eight Standing Medium frames. Preserve medium-weight load, hip-led torque, fast acceleration, coat/loc lag and guarded recovery while authoring the distinct one-hit Sweep Line low-sweep silhouette in the approved outline-free NGA V2 style.';
writeJson(sourceAuditPath, sourceAudit);

const v1BodyCenters = [
  { x: 224.0, y: 221.0 }, { x: 238.2, y: 217.9 }, { x: 233.2, y: 250.4 }, { x: 219.3, y: 221.5 },
  { x: 216.3, y: 226.6 }, { x: 217.7, y: 196.9 }, { x: 212.1, y: 211.3 }, { x: 229.0, y: 221.8 }
];
const v1VisibleBounds = [
  { minX: 103, minY: 41, maxX: 344, maxY: 381 }, { minX: 89, minY: 33, maxX: 358, maxY: 381 },
  { minX: 80, minY: 90, maxX: 366, maxY: 381 }, { minX: 100, minY: 43, maxX: 346, maxY: 381 },
  { minX: 80, minY: 48, maxX: 366, maxY: 381 }, { minX: 106, minY: 33, maxX: 341, maxY: 381 },
  { minX: 39, minY: 52, maxX: 407, maxY: 381 }, { minX: 106, minY: 48, maxX: 341, maxY: 381 }
];

const closure = {
  schemaVersion: '1.0.0',
  status: 'human_approved_crouching_medium_motion_and_b_retiming_candidate_base',
  candidateOnly: true,
  deployable: false,
  rendererAuthoritative: false,
  simulationAuthoritative: true,
  simulationHz: 60,
  motionLock: { path: repoRelative(motionLockPath), sha256: sha256(motionLockPath) },
  normalizationReport: { path: repoRelative(normalizationPath), sha256: sha256(normalizationPath) },
  styleApproval: { path: repoRelative(styleApprovalPath), sha256: sha256(styleApprovalPath), decision: styleApproval.decision },
  v1: {
    sourceFrameCount: 8,
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
      publicPath: `/lamuh-legacy-v2/crouching-medium-v2/${path.basename(compositeDestination)}`,
      sha256: sha256(compositeDestination),
      bodyOnlyOnWhiff: true,
      allowedOutcomes: ['hit', 'block'],
      separationStatus: 'OUTCOME_ROUTED_SINGLE_LOW_CONTACT_COMPOSITE'
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
  humanApproval: {
    motion: humanApproval.decisions.motion,
    timing: humanApproval.decisions.timing,
    selectedTimingCandidate: humanApproval.decisions.selectedTimingCandidate,
    combatProfile: null,
    record: { path: repoRelative(humanApprovalPath), sha256: sha256(humanApprovalPath) }
  }
};

reviewData.authority = { renderingAuthoritative: false, simulationAuthoritative: true, candidateOnly: true, deployable: false };
reviewData.crouchingMediumClosure = closure;
reviewData.firstPlayable.humanReviewStatus = 'human_approved_crouching_medium_motion_and_b_retiming_candidate_base';
reviewData.firstPlayable.candidateOnly = true;
reviewData.firstPlayable.deployable = false;
writeJson(publicReviewDataPath, reviewData);

writeJson(path.join(moveRoot, 'closure.candidate.v1.json'), {
  schemaVersion: '1.0.0',
  id: 'crouching_medium_sweep_line_candidate_v1',
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

console.log(`Built Lamuh Crouching Medium Sweep Line candidate with ${publicFrames.length} distinct V2 frames; one-hit parity preserved; candidate-only, deployable false.`);
