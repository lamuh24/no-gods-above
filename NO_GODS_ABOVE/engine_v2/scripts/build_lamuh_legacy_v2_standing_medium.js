const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

const engineRoot = path.resolve(__dirname, '..');
const repoRoot = path.resolve(engineRoot, '..', '..');
const contentRoot = path.join(engineRoot, 'content-source', 'characters', 'lamuh-legacy-v2');
const standingMediumRoot = path.join(contentRoot, 'moves', 'standing-medium');
const reviewRoot = path.join(repoRoot, 'tools', 'nga-forge', 'review', 'lamuh-legacy-v2-standing-medium-v1');
const publicRoot = path.join(engineRoot, 'public', 'lamuh-legacy-v2', 'standing-medium-v2');
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

const motionLockPath = path.join(standingMediumRoot, 'motion-lock.v1.json');
const normalizationPath = path.join(reviewRoot, 'normalization.report.json');
const styleApprovalPath = path.join(contentRoot, 'records', 'style-checkpoint-v1.approval.json');
const standingMediumApprovalPath = path.join(contentRoot, 'records', 'standing-medium-v1.approval.json');
for (const filename of [motionLockPath, normalizationPath, styleApprovalPath, publicReviewDataPath, timingSourcePath, sourceAuditPath]) {
  if (!fs.existsSync(filename)) throw new Error(`Missing Lamuh Standing Medium prerequisite: ${filename}`);
}

const motionLock = readJson(motionLockPath);
const normalization = readJson(normalizationPath);
const styleApproval = readJson(styleApprovalPath);
const reviewData = readJson(publicReviewDataPath);
const timingSource = readJson(timingSourcePath);
const sourceAudit = readJson(sourceAuditPath);
const standingMediumApproval = fs.existsSync(standingMediumApprovalPath) ? readJson(standingMediumApprovalPath) : null;

if (motionLock.status !== 'V1_MOTION_LOCKED_FOR_TARGETED_V2_SINGLE_HIT_REBUILD' || motionLock.deployable !== false) throw new Error('Standing Medium motion lock boundary failed');
if (normalization.status !== 'candidate-only' || normalization.deployable !== false) throw new Error('Standing Medium normalization promotion boundary failed');
if (styleApproval.decision !== 'APPROVED_WITH_TARGETED_REPAIR' || styleApproval.approvalBoundary.deployable !== false) throw new Error('Standing Medium style approval boundary failed');
if (normalization.frames.length !== 8 || normalization.frames.some((frame) => frame.touchesEdge)) throw new Error('Standing Medium normalized frame coverage or edge padding failed');
if (new Set(normalization.frames.map((frame) => frame.normalizedSha256)).size !== 8) throw new Error('Standing Medium contains an undeclared duplicate pose');
if (normalization.frames.some((frame) => !Number.isFinite(frame.bodyScaleCorrection) || !Number.isFinite(frame.authoredScale))) throw new Error('Standing Medium lacks recorded source-art scale normalization metadata');
if (normalization.normalization.perFrameRendererScale !== false || normalization.normalization.placementPolicy !== 'authored_root_landmark_alignment_not_visual_recentering') throw new Error('Standing Medium fixed-root renderer contract failed');
if (normalization.visualValidation?.meaningfulMagentaPixelsRemaining !== 0 || normalization.frames.some((frame) => frame.meaningfulMagentaPixelsRemaining !== 0)) throw new Error('Standing Medium still contains meaningful magenta outline pixels');
if (normalization.visibleImpactCount !== 1 || motionLock.hitCountContract.visibleImpacts !== 1 || motionLock.hitCountContract.gameplayHits !== 1) throw new Error('Standing Medium one-hit parity failed');
if (normalization.contactFrame !== motionLock.hitCountContract.impactFrame || normalization.contactPresentation.touchesEdge) throw new Error('Standing Medium contact presentation contract failed');
if (standingMediumApproval && (standingMediumApproval.decisions.motion !== 'APPROVED_V1_MOTION_PRESERVED' || standingMediumApproval.decisions.timing !== 'APPROVED_V2_RETIMING' || standingMediumApproval.decisions.selectedTimingCandidate !== 'B' || standingMediumApproval.approvalBoundary.deployable !== false)) throw new Error('Standing Medium human approval record failed');

fs.mkdirSync(publicRoot, { recursive: true });
const publicFrames = normalization.frames.map((frame) => {
  const source = path.join(repoRoot, frame.normalizedPath);
  if (!fs.existsSync(source) || sha256(source) !== frame.normalizedSha256) throw new Error(`Standing Medium normalized hash mismatch: ${frame.index}`);
  const destination = path.join(publicRoot, path.basename(source));
  fs.copyFileSync(source, destination);
  if (sha256(destination) !== frame.normalizedSha256) throw new Error(`Standing Medium public copy mismatch: ${frame.index}`);
  return {
    index: frame.index,
    role: frame.role,
    publicPath: `/lamuh-legacy-v2/standing-medium-v2/${path.basename(destination)}`,
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
if (sha256(compositeSource) !== normalization.contactPresentation.sha256) throw new Error('Standing Medium contact composite source hash mismatch');
fs.copyFileSync(compositeSource, compositeDestination);
if (sha256(compositeDestination) !== normalization.contactPresentation.sha256) throw new Error('Standing Medium public contact composite mismatch');

const buildTimingCandidates = () => Object.fromEntries(Object.entries(motionLock.timingCandidates).map(([id, candidate]) => [id, {
  label: candidate.label,
  phaseTicks: candidate.phaseTicks,
  durationTicks: candidate.durationTicks,
  exposureTicks: candidate.exposureTicks,
  preservesSourceFrameOrder: true,
  duplicateMeaninglessFrames: false
}]));
const candidates = buildTimingCandidates();
const impactCandidates = Object.fromEntries(Object.entries(motionLock.impactCandidates).map(([id, candidate]) => [id, {
  label: candidate.label,
  hitstopTicks: candidate.hitstopTicks,
  contactExposureDelta: 0,
  recoilExposureDelta: 0,
  recoveryExposureDelta: 0
}]));

const timingMove = timingSource.moves.find((move) => move.moveId === 'standing_medium');
if (!timingMove || timingMove.v1Historical.durationTicks !== 21) throw new Error('Standing Medium historical timing evidence is missing');
timingMove.sourceFrameCount = 8;
timingMove.authoredFrameCount = 8;
timingMove.contactSourceFrames = [motionLock.hitCountContract.impactFrame];
timingMove.candidates = candidates;
timingMove.recommendedCandidate = motionLock.recommendedTimingCandidate;
timingMove.humanReviewStatus = standingMediumApproval ? 'APPROVED_V2_RETIMING' : null;
timingMove.note = 'Targeted V2 one-hit modernization: the V1 wide base, cross-body coil, rear-hand arc, body momentum, secondary lag and recovery direction are preserved; the obsolete post-punch knee and high kick are replaced by same-arm overshoot and recoil.';
writeJson(timingSourcePath, timingSource);

const publicTimingMove = reviewData.timingCandidates.moves.find((move) => move.moveId === 'standing_medium');
if (!publicTimingMove) throw new Error('Standing Medium public timing entry is missing');
Object.assign(publicTimingMove, JSON.parse(JSON.stringify(timingMove)));
// The recommended candidate is the single source of runtime presentation truth for this move.
// Without this the review-data bootstrap track survives, which previously truncated the clip and
// dropped authored follow-through and recovery frames.
reviewData.runtimeTimelines.standing_medium = {
  exposureTicks: candidates.B.exposureTicks,
  durationTicks: candidates.B.durationTicks,
  contactSourceFrames: [motionLock.hitCountContract.impactFrame],
  contactTick: candidates.B.exposureTicks.slice(0, motionLock.hitCountContract.impactFrame).reduce((sum, value) => sum + value, 0)
};
if (reviewData.runtimeTimelines.standing_medium.exposureTicks.length !== publicFrames.length) throw new Error('Standing Medium runtime timeline drops authored frames');

const auditEntry = sourceAudit.animations.find((entry) => entry.animationName === 'standing_medium');
if (!auditEntry) throw new Error('Standing Medium source audit entry is missing');
auditEntry.sourceMotionReusable = true;
auditEntry.visualArtworkReusable = false;
auditEntry.v2Disposition = 'MODERNIZE';
auditEntry.needsV2Redesign = true;
auditEntry.reviewNotes = 'Preserve the V1 wide base, cross-body rear-hand coil, hip and shoulder drive, coat/loc lag, and recovery direction. Rebuild the runtime art in the approved outline-free NGA V2 style and retire the legacy knee/high-kick tail because it creates a second physical attack in a one-hit move.';
writeJson(sourceAuditPath, sourceAudit);

const v1BodyCenters = [
  { x: 224.0, y: 221.0 }, { x: 238.2, y: 217.9 }, { x: 233.2, y: 250.4 }, { x: 219.3, y: 221.5 },
  { x: 216.3, y: 226.6 }, { x: 217.7, y: 196.9 }, { x: 212.1, y: 211.3 }, { x: 229.0, y: 221.8 }
];
const v1VisibleBounds = [
  { minX: 103, minY: 41, maxX: 344, maxY: 381 },
  { minX: 89, minY: 33, maxX: 358, maxY: 381 },
  { minX: 80, minY: 90, maxX: 366, maxY: 381 },
  { minX: 100, minY: 43, maxX: 346, maxY: 381 },
  { minX: 80, minY: 48, maxX: 366, maxY: 381 },
  { minX: 106, minY: 33, maxX: 341, maxY: 381 },
  { minX: 39, minY: 52, maxX: 407, maxY: 381 },
  { minX: 106, minY: 48, maxX: 341, maxY: 381 }
];

const standingMediumClosure = {
  schemaVersion: '1.0.0',
  status: standingMediumApproval ? 'human_approved_standing_medium_motion_and_b_retiming_candidate_base' : 'awaiting_human_standing_medium_motion_and_timing_review',
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
      publicPath: `/lamuh-legacy-v2/standing-medium-v2/${path.basename(compositeDestination)}`,
      sha256: sha256(compositeDestination),
      bodyOnlyOnWhiff: true,
      allowedOutcomes: ['hit', 'block'],
      separationStatus: 'OUTCOME_ROUTED_SINGLE_CONTACT_COMPOSITE'
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
    motion: standingMediumApproval?.decisions.motion || null,
    timing: standingMediumApproval?.decisions.timing || null,
    selectedTimingCandidate: standingMediumApproval?.decisions.selectedTimingCandidate || null,
    combatProfile: null,
    record: standingMediumApproval ? { path: repoRelative(standingMediumApprovalPath), sha256: sha256(standingMediumApprovalPath) } : null
  }
};

reviewData.authority = { renderingAuthoritative: false, simulationAuthoritative: true, candidateOnly: true, deployable: false };
reviewData.standingMediumClosure = standingMediumClosure;
if (!standingMediumApproval) reviewData.firstPlayable.humanReviewStatus = 'awaiting_human_standing_medium_motion_and_timing_review';
reviewData.firstPlayable.candidateOnly = true;
reviewData.firstPlayable.deployable = false;
writeJson(publicReviewDataPath, reviewData);

const sidecar = {
  schemaVersion: '1.0.0',
  id: 'standing_medium_single_hit_candidate_v1',
  promotionState: 'candidate',
  deployable: false,
  productionApproved: false,
  motionLock: standingMediumClosure.motionLock,
  styleApproval: standingMediumClosure.styleApproval,
  normalizationReport: standingMediumClosure.normalizationReport,
  frames: publicFrames.map((frame) => ({ index: frame.index, role: frame.role, sourceUri: `repo://${normalization.frames[frame.index].normalizedPath}`, sha256: frame.sha256, root: frame.root, visibleBounds: frame.visibleBounds })),
  contactPresentation: standingMediumClosure.v2.contactPresentation,
  hitCountContract: { visibleImpacts: 1, gameplayHits: 1 },
  timingCandidates: standingMediumClosure.timingCandidates,
  impactCandidates,
  approvalStatus: standingMediumClosure.status,
  humanApproval: standingMediumClosure.humanApproval
};
writeJson(path.join(standingMediumRoot, 'closure.candidate.v1.json'), sidecar);

console.log(`Built Lamuh Standing Medium candidate with ${publicFrames.length} distinct V2 frames; one-hit parity preserved; candidate-only, deployable false.`);

