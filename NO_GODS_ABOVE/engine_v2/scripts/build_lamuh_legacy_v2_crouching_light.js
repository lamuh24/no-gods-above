const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

const engineRoot = path.resolve(__dirname, '..');
const repoRoot = path.resolve(engineRoot, '..', '..');
const contentRoot = path.join(engineRoot, 'content-source', 'characters', 'lamuh-legacy-v2');
const crouchingLightRoot = path.join(contentRoot, 'moves', 'crouching-light');
const reviewRoot = path.join(repoRoot, 'tools', 'nga-forge', 'review', 'lamuh-legacy-v2-crouching-light-v1');
const publicRoot = path.join(engineRoot, 'public', 'lamuh-legacy-v2', 'crouching-light-v2');
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

const motionLockPath = path.join(crouchingLightRoot, 'motion-lock.v1.json');
const normalizationPath = path.join(reviewRoot, 'normalization.report.json');
const styleApprovalPath = path.join(contentRoot, 'records', 'style-checkpoint-v1.approval.json');
const crouchingLightApprovalPath = path.join(contentRoot, 'records', 'crouching-light-v1.approval.json');
for (const filename of [motionLockPath, normalizationPath, styleApprovalPath, publicReviewDataPath, timingSourcePath, sourceAuditPath]) {
  if (!fs.existsSync(filename)) throw new Error(`Missing Lamuh Crouching Light prerequisite: ${filename}`);
}

const motionLock = readJson(motionLockPath);
const normalization = readJson(normalizationPath);
const styleApproval = readJson(styleApprovalPath);
const reviewData = readJson(publicReviewDataPath);
const timingSource = readJson(timingSourcePath);
const sourceAudit = readJson(sourceAuditPath);
const crouchingLightApproval = fs.existsSync(crouchingLightApprovalPath) ? readJson(crouchingLightApprovalPath) : null;

if (motionLock.status !== 'V1_ALIAS_EVIDENCE_LOCKED_FOR_DISTINCT_V2_LOW_ATTACK_MODERNIZATION' || motionLock.deployable !== false) throw new Error('Crouching Light motion lock boundary failed');
if (normalization.status !== 'candidate-only' || normalization.deployable !== false) throw new Error('Crouching Light normalization promotion boundary failed');
if (styleApproval.decision !== 'APPROVED_WITH_TARGETED_REPAIR' || styleApproval.approvalBoundary.deployable !== false) throw new Error('Crouching Light style approval boundary failed');
if (normalization.frames.length !== 7 || normalization.frames.some((frame) => frame.touchesEdge)) throw new Error('Crouching Light normalized frame coverage or edge padding failed');
if (new Set(normalization.frames.map((frame) => frame.normalizedSha256)).size !== 7) throw new Error('Crouching Light contains an undeclared duplicate pose');
if (normalization.frames.some((frame) => !Number.isFinite(frame.bodyScaleCorrection) || !Number.isFinite(frame.authoredScale))) throw new Error('Crouching Light lacks recorded source-art scale normalization metadata');
if (normalization.normalization.perFrameRendererScale !== false || normalization.normalization.placementPolicy !== 'authored_root_landmark_alignment_not_visual_recentering') throw new Error('Crouching Light fixed-root renderer contract failed');
if (normalization.visualValidation?.meaningfulMagentaPixelsRemaining !== 0 || normalization.frames.some((frame) => frame.meaningfulMagentaPixelsRemaining !== 0)) throw new Error('Crouching Light still contains meaningful magenta outline pixels');
if (normalization.visibleImpactCount !== 1 || motionLock.hitCountContract.visibleImpacts !== 1 || motionLock.hitCountContract.gameplayHits !== 1) throw new Error('Crouching Light one-hit parity failed');
if (normalization.contactFrame !== motionLock.hitCountContract.impactFrame || normalization.contactPresentation.touchesEdge) throw new Error('Crouching Light contact presentation contract failed');
if (crouchingLightApproval && (crouchingLightApproval.decisions.motion !== 'APPROVED_V1_MOTION_PRESERVED' || crouchingLightApproval.decisions.timing !== 'APPROVED_V2_RETIMING' || crouchingLightApproval.decisions.selectedTimingCandidate !== 'B' || crouchingLightApproval.approvalBoundary.deployable !== false)) throw new Error('Crouching Light human approval record failed');

fs.mkdirSync(publicRoot, { recursive: true });
const publicFrames = normalization.frames.map((frame) => {
  const source = path.join(repoRoot, frame.normalizedPath);
  if (!fs.existsSync(source) || sha256(source) !== frame.normalizedSha256) throw new Error(`Crouching Light normalized hash mismatch: ${frame.index}`);
  const destination = path.join(publicRoot, path.basename(source));
  fs.copyFileSync(source, destination);
  if (sha256(destination) !== frame.normalizedSha256) throw new Error(`Crouching Light public copy mismatch: ${frame.index}`);
  return {
    index: frame.index,
    role: frame.role,
    publicPath: `/lamuh-legacy-v2/crouching-light-v2/${path.basename(destination)}`,
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
if (sha256(compositeSource) !== normalization.contactPresentation.sha256) throw new Error('Crouching Light contact composite source hash mismatch');
fs.copyFileSync(compositeSource, compositeDestination);
if (sha256(compositeDestination) !== normalization.contactPresentation.sha256) throw new Error('Crouching Light public contact composite mismatch');

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

const timingMove = timingSource.moves.find((move) => move.moveId === 'crouching_light');
if (!timingMove || timingMove.v1Historical.durationTicks !== 14) throw new Error('Crouching Light historical timing evidence is missing');
timingMove.sourceFrameCount = 4;
timingMove.authoredFrameCount = 7;
timingMove.contactSourceFrames = [motionLock.hitCountContract.impactFrame];
timingMove.candidates = candidates;
timingMove.recommendedCandidate = motionLock.recommendedTimingCandidate;
timingMove.humanReviewStatus = crouchingLightApproval?.decisions.timing || null;
timingMove.note = 'Distinct V2 low-attack modernization: V1 Crouching Light only aliased Standing Light artwork, so the compact lead-arm rhythm, planted base, fast acceleration, body momentum, secondary lag and guard-return direction are preserved while a true low palm-check silhouette is authored.';
writeJson(timingSourcePath, timingSource);

const publicTimingMove = reviewData.timingCandidates.moves.find((move) => move.moveId === 'crouching_light');
if (!publicTimingMove) throw new Error('Crouching Light public timing entry is missing');
Object.assign(publicTimingMove, JSON.parse(JSON.stringify(timingMove)));
// The recommended candidate is the single source of runtime presentation truth for this move.
// Without this the review-data bootstrap track survives, which previously truncated the clip and
// dropped authored follow-through and recovery frames.
reviewData.runtimeTimelines.crouching_light = {
  exposureTicks: candidates.B.exposureTicks,
  durationTicks: candidates.B.durationTicks,
  contactSourceFrames: [motionLock.hitCountContract.impactFrame],
  contactTick: candidates.B.exposureTicks.slice(0, motionLock.hitCountContract.impactFrame).reduce((sum, value) => sum + value, 0)
};
if (reviewData.runtimeTimelines.crouching_light.exposureTicks.length !== publicFrames.length) throw new Error('Crouching Light runtime timeline drops authored frames');

let auditEntry = sourceAudit.animations.find((entry) => entry.animationName === 'crouching_light');
if (!auditEntry) {
  const aliasSource = sourceAudit.animations.find((entry) => entry.animationName === 'standing_light');
  if (!aliasSource) throw new Error('Crouching Light legacy Standing Light alias evidence is missing');
  auditEntry = {
    ...JSON.parse(JSON.stringify(aliasSource)),
    animationName: 'crouching_light',
    legacyAliasOf: 'standing_light',
    originalExposureTiming: {
      source: 'historical_v1_c032',
      durationTicks: 14,
      meanTicksPerSourceFrame: 3.5
    },
    historicalV1Combat: { durationTicks: 14, damage: 32 },
    currentLamuhLegacyCombat: { phases: [2, 4, 6], damage: 22 }
  };
  const standingLightIndex = sourceAudit.animations.indexOf(aliasSource);
  sourceAudit.animations.splice(standingLightIndex + 1, 0, auditEntry);
}
auditEntry.sourceMotionReusable = true;
auditEntry.visualArtworkReusable = false;
auditEntry.v2Disposition = 'MODERNIZE';
auditEntry.needsV2Redesign = true;
auditEntry.reviewNotes = 'V1 Crouching Light aliases Standing Light artwork. Preserve the compact lead-arm rhythm, planted base, fast acceleration, body momentum, coat/loc lag and guard-return direction while authoring a distinct low palm check in the approved outline-free NGA V2 style.';
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

const crouchingLightClosure = {
  schemaVersion: '1.0.0',
  status: crouchingLightApproval ? 'human_approved_crouching_light_motion_and_b_retiming_candidate_base' : 'awaiting_human_crouching_light_motion_and_timing_review',
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
      publicPath: `/lamuh-legacy-v2/crouching-light-v2/${path.basename(compositeDestination)}`,
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
    motion: crouchingLightApproval?.decisions.motion || null,
    timing: crouchingLightApproval?.decisions.timing || null,
    selectedTimingCandidate: crouchingLightApproval?.decisions.selectedTimingCandidate || null,
    combatProfile: null,
    record: crouchingLightApproval ? { path: repoRelative(crouchingLightApprovalPath), sha256: sha256(crouchingLightApprovalPath) } : null
  }
};

reviewData.authority = { renderingAuthoritative: false, simulationAuthoritative: true, candidateOnly: true, deployable: false };
reviewData.crouchingLightClosure = crouchingLightClosure;
reviewData.firstPlayable.humanReviewStatus = crouchingLightApproval ? 'human_approved_crouching_light_motion_and_b_retiming_candidate_base' : 'awaiting_human_crouching_light_motion_and_timing_review';
reviewData.firstPlayable.candidateOnly = true;
reviewData.firstPlayable.deployable = false;
writeJson(publicReviewDataPath, reviewData);

const sidecar = {
  schemaVersion: '1.0.0',
  id: 'crouching_light_distinct_low_single_hit_candidate_v1',
  promotionState: 'candidate',
  deployable: false,
  productionApproved: false,
  motionLock: crouchingLightClosure.motionLock,
  styleApproval: crouchingLightClosure.styleApproval,
  normalizationReport: crouchingLightClosure.normalizationReport,
  frames: publicFrames.map((frame) => ({ index: frame.index, role: frame.role, sourceUri: `repo://${normalization.frames[frame.index].normalizedPath}`, sha256: frame.sha256, root: frame.root, visibleBounds: frame.visibleBounds })),
  contactPresentation: crouchingLightClosure.v2.contactPresentation,
  hitCountContract: { visibleImpacts: 1, gameplayHits: 1 },
  timingCandidates: crouchingLightClosure.timingCandidates,
  impactCandidates,
  approvalStatus: crouchingLightClosure.status,
  humanApproval: crouchingLightClosure.humanApproval
};
writeJson(path.join(crouchingLightRoot, 'closure.candidate.v1.json'), sidecar);

console.log(`Built Lamuh Crouching Light candidate with ${publicFrames.length} distinct V2 frames; one-hit parity preserved; candidate-only, deployable false.`);

