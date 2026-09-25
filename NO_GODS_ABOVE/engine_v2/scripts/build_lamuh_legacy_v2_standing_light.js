const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

const engineRoot = path.resolve(__dirname, '..');
const repoRoot = path.resolve(engineRoot, '..', '..');
const contentRoot = path.join(engineRoot, 'content-source', 'characters', 'lamuh-legacy-v2');
const standingLightRoot = path.join(contentRoot, 'moves', 'standing-light');
const reviewRoot = path.join(repoRoot, 'tools', 'nga-forge', 'review', 'lamuh-legacy-v2-standing-light-v1');
const publicRoot = path.join(engineRoot, 'public', 'lamuh-legacy-v2', 'standing-light-v2');
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

const motionLockPath = path.join(standingLightRoot, 'motion-lock.v1.json');
const normalizationPath = path.join(reviewRoot, 'normalization.report.json');
const styleApprovalPath = path.join(contentRoot, 'records', 'style-checkpoint-v1.approval.json');
const standingLightApprovalPath = path.join(contentRoot, 'records', 'standing-light-v1.approval.json');
for (const filename of [motionLockPath, normalizationPath, styleApprovalPath, publicReviewDataPath, timingSourcePath, sourceAuditPath]) {
  if (!fs.existsSync(filename)) throw new Error(`Missing Lamuh Standing Light prerequisite: ${filename}`);
}

const motionLock = readJson(motionLockPath);
const normalization = readJson(normalizationPath);
const styleApproval = readJson(styleApprovalPath);
const reviewData = readJson(publicReviewDataPath);
const timingSource = readJson(timingSourcePath);
const sourceAudit = readJson(sourceAuditPath);
const standingLightApproval = fs.existsSync(standingLightApprovalPath) ? readJson(standingLightApprovalPath) : null;

if (motionLock.status !== 'V1_MOTION_LOCKED_FOR_TARGETED_V2_SINGLE_HIT_REBUILD' || motionLock.deployable !== false) throw new Error('Standing Light motion lock boundary failed');
if (normalization.status !== 'candidate-only' || normalization.deployable !== false) throw new Error('Standing Light normalization promotion boundary failed');
if (styleApproval.decision !== 'APPROVED_WITH_TARGETED_REPAIR' || styleApproval.approvalBoundary.deployable !== false) throw new Error('Standing Light style approval boundary failed');
if (normalization.frames.length !== 6 || normalization.frames.some((frame) => frame.touchesEdge)) throw new Error('Standing Light normalized frame coverage or edge padding failed');
if (new Set(normalization.frames.map((frame) => frame.normalizedSha256)).size !== 6) throw new Error('Standing Light contains an undeclared duplicate pose');
if (normalization.frames.some((frame) => !Number.isFinite(frame.bodyScaleCorrection) || !Number.isFinite(frame.authoredScale))) throw new Error('Standing Light lacks recorded source-art scale normalization metadata');
if (normalization.normalization.perFrameRendererScale !== false || normalization.normalization.placementPolicy !== 'authored_root_landmark_alignment_not_visual_recentering') throw new Error('Standing Light fixed-root renderer contract failed');
if (normalization.visualValidation?.meaningfulMagentaPixelsRemaining !== 0 || normalization.frames.some((frame) => frame.meaningfulMagentaPixelsRemaining !== 0)) throw new Error('Standing Light still contains meaningful magenta outline pixels');
if (normalization.visibleImpactCount !== 1 || motionLock.hitCountContract.visibleImpacts !== 1 || motionLock.hitCountContract.gameplayHits !== 1) throw new Error('Standing Light one-hit parity failed');
if (normalization.contactFrame !== motionLock.hitCountContract.impactFrame || normalization.contactPresentation.touchesEdge) throw new Error('Standing Light contact presentation contract failed');
if (standingLightApproval && (standingLightApproval.decisions.motion !== 'APPROVED_V1_MOTION_PRESERVED' || standingLightApproval.decisions.timing !== 'APPROVED_V2_RETIMING' || standingLightApproval.decisions.selectedTimingCandidate !== 'B' || standingLightApproval.approvalBoundary.deployable !== false)) throw new Error('Standing Light human approval record failed');

fs.mkdirSync(publicRoot, { recursive: true });
const publicFrames = normalization.frames.map((frame) => {
  const source = path.join(repoRoot, frame.normalizedPath);
  if (!fs.existsSync(source) || sha256(source) !== frame.normalizedSha256) throw new Error(`Standing Light normalized hash mismatch: ${frame.index}`);
  const destination = path.join(publicRoot, path.basename(source));
  fs.copyFileSync(source, destination);
  if (sha256(destination) !== frame.normalizedSha256) throw new Error(`Standing Light public copy mismatch: ${frame.index}`);
  return {
    index: frame.index,
    role: frame.role,
    publicPath: `/lamuh-legacy-v2/standing-light-v2/${path.basename(destination)}`,
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
if (sha256(compositeSource) !== normalization.contactPresentation.sha256) throw new Error('Standing Light contact composite source hash mismatch');
fs.copyFileSync(compositeSource, compositeDestination);
if (sha256(compositeDestination) !== normalization.contactPresentation.sha256) throw new Error('Standing Light public contact composite mismatch');

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

const timingMove = timingSource.moves.find((move) => move.moveId === 'standing_light');
if (!timingMove || timingMove.v1Historical.durationTicks !== 15) throw new Error('Standing Light historical timing evidence is missing');
timingMove.sourceFrameCount = 4;
timingMove.authoredFrameCount = 6;
timingMove.contactSourceFrames = [motionLock.hitCountContract.impactFrame];
timingMove.candidates = candidates;
timingMove.recommendedCandidate = motionLock.recommendedTimingCandidate;
timingMove.humanReviewStatus = standingLightApproval ? 'APPROVED_V2_RETIMING' : null;
timingMove.note = 'Targeted V2 one-hit reconstruction: V1 stance, lead-arm arc, momentum and recovery direction preserved; the obsolete second full extension is replaced by connected same-arm follow-through and recoil.';
writeJson(timingSourcePath, timingSource);

const publicTimingMove = reviewData.timingCandidates.moves.find((move) => move.moveId === 'standing_light');
if (!publicTimingMove) throw new Error('Standing Light public timing entry is missing');
Object.assign(publicTimingMove, JSON.parse(JSON.stringify(timingMove)));
// The recommended candidate is the single source of runtime presentation truth for this move.
// Without this the review-data bootstrap track survives, which previously truncated the clip and
// dropped authored follow-through and recovery frames.
reviewData.runtimeTimelines.standing_light = {
  exposureTicks: candidates.B.exposureTicks,
  durationTicks: candidates.B.durationTicks,
  contactSourceFrames: [motionLock.hitCountContract.impactFrame],
  contactTick: candidates.B.exposureTicks.slice(0, motionLock.hitCountContract.impactFrame).reduce((sum, value) => sum + value, 0)
};
if (reviewData.runtimeTimelines.standing_light.exposureTicks.length !== publicFrames.length) throw new Error('Standing Light runtime timeline drops authored frames');

const auditEntry = sourceAudit.animations.find((entry) => entry.animationName === 'standing_light');
if (!auditEntry) throw new Error('Standing Light source audit entry is missing');
auditEntry.sourceMotionReusable = true;
auditEntry.visualArtworkReusable = false;
auditEntry.v2Disposition = 'PRESERVE_WITH_V2_COMBAT_UPDATE';
auditEntry.needsV2Redesign = true;
auditEntry.reviewNotes = 'Preserve the V1 stance, lead-arm arc, planted base, momentum and recovery direction. Runtime art is rebuilt in the approved outline-free NGA V2 style because the legacy row has a purple extraction fringe and two full-extension silhouettes despite one gameplay hit.';
writeJson(sourceAuditPath, sourceAudit);

const v1BodyCenters = [
  { x: 218.8, y: 202.8 }, { x: 204.0, y: 214.5 }, { x: 238.1, y: 210.8 }, { x: 209.8, y: 218.0 }
];
const v1VisibleBounds = [
  { minX: 108, minY: 9, maxX: 339, maxY: 381 },
  { minX: 54, minY: 33, maxX: 392, maxY: 381 },
  { minX: 99, minY: 18, maxX: 347, maxY: 381 },
  { minX: 62, minY: 35, maxX: 385, maxY: 381 }
];

const standingLightClosure = {
  schemaVersion: '1.0.0',
  status: standingLightApproval ? 'human_approved_standing_light_motion_and_b_retiming_candidate_base' : 'awaiting_human_standing_light_motion_and_timing_review',
  candidateOnly: true,
  deployable: false,
  rendererAuthoritative: false,
  simulationAuthoritative: true,
  simulationHz: 60,
  motionLock: { path: repoRelative(motionLockPath), sha256: sha256(motionLockPath) },
  normalizationReport: { path: repoRelative(normalizationPath), sha256: sha256(normalizationPath) },
  styleApproval: { path: repoRelative(styleApprovalPath), sha256: sha256(styleApprovalPath), decision: styleApproval.decision },
  v1: {
    sourceFrameCount: 4,
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
      publicPath: `/lamuh-legacy-v2/standing-light-v2/${path.basename(compositeDestination)}`,
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
    motion: standingLightApproval?.decisions.motion || null,
    timing: standingLightApproval?.decisions.timing || null,
    selectedTimingCandidate: standingLightApproval?.decisions.selectedTimingCandidate || null,
    combatProfile: null,
    record: standingLightApproval ? { path: repoRelative(standingLightApprovalPath), sha256: sha256(standingLightApprovalPath) } : null
  }
};

reviewData.authority = { renderingAuthoritative: false, simulationAuthoritative: true, candidateOnly: true, deployable: false };
reviewData.standingLightClosure = standingLightClosure;
if (!standingLightApproval) reviewData.firstPlayable.humanReviewStatus = 'awaiting_human_standing_light_motion_and_timing_review';
reviewData.firstPlayable.candidateOnly = true;
reviewData.firstPlayable.deployable = false;
writeJson(publicReviewDataPath, reviewData);

const sidecar = {
  schemaVersion: '1.0.0',
  id: 'standing_light_single_hit_candidate_v1',
  promotionState: 'candidate',
  deployable: false,
  productionApproved: false,
  motionLock: standingLightClosure.motionLock,
  styleApproval: standingLightClosure.styleApproval,
  normalizationReport: standingLightClosure.normalizationReport,
  frames: publicFrames.map((frame) => ({ index: frame.index, role: frame.role, sourceUri: `repo://${normalization.frames[frame.index].normalizedPath}`, sha256: frame.sha256, root: frame.root, visibleBounds: frame.visibleBounds })),
  contactPresentation: standingLightClosure.v2.contactPresentation,
  hitCountContract: { visibleImpacts: 1, gameplayHits: 1 },
  timingCandidates: standingLightClosure.timingCandidates,
  impactCandidates,
  approvalStatus: standingLightClosure.status,
  humanApproval: standingLightClosure.humanApproval
};
writeJson(path.join(standingLightRoot, 'closure.candidate.v1.json'), sidecar);

console.log(`Built Lamuh Standing Light candidate with ${publicFrames.length} distinct V2 frames; one-hit parity preserved; candidate-only, deployable false.`);
