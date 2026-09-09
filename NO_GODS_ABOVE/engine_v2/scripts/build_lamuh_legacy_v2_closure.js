const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

const engineRoot = path.resolve(__dirname, '..');
const repoRoot = path.resolve(engineRoot, '..', '..');
const contentRoot = path.join(engineRoot, 'content-source', 'characters', 'lamuh-legacy-v2');
const standingHeavyRoot = path.join(contentRoot, 'moves', 'standing-heavy');
const reviewRoot = path.join(repoRoot, 'tools', 'nga-forge', 'review', 'lamuh-legacy-v2-standing-heavy-closure-v1');
const publicRoot = path.join(engineRoot, 'public', 'lamuh-legacy-v2', 'standing-heavy-v2');
const publicReviewDataPath = path.join(engineRoot, 'public', 'lamuh-legacy-v2', 'review-data.json');

const sha256 = (filename) => crypto.createHash('sha256').update(fs.readFileSync(filename)).digest('hex').toUpperCase();
const readJson = (filename) => JSON.parse(fs.readFileSync(filename, 'utf8').replace(/^\uFEFF/, ''));
const writeJson = (filename, value) => {
  fs.mkdirSync(path.dirname(filename), { recursive: true });
  fs.writeFileSync(filename, `${JSON.stringify(value, null, 2)}\n`, 'utf8');
};
const repoRelative = (filename) => path.relative(repoRoot, filename).replaceAll('\\', '/');

const motionLockPath = path.join(standingHeavyRoot, 'motion-lock.v1.json');
const normalizationPath = path.join(reviewRoot, 'normalization.report.json');
const styleApprovalPath = path.join(contentRoot, 'records', 'style-checkpoint-v1.approval.json');
for (const filename of [motionLockPath, normalizationPath, styleApprovalPath, publicReviewDataPath]) {
  if (!fs.existsSync(filename)) throw new Error(`Missing Lamuh closure prerequisite: ${filename}`);
}

const motionLock = readJson(motionLockPath);
const normalization = readJson(normalizationPath);
const styleApproval = readJson(styleApprovalPath);
const reviewData = readJson(publicReviewDataPath);

if (motionLock.status !== 'V1_MOTION_LOCKED_FOR_V2_CANDIDATE_AUTHORING' || motionLock.deployable !== false) throw new Error('Standing Heavy motion lock boundary failed');
if (normalization.status !== 'candidate-only' || normalization.deployable !== false) throw new Error('Standing Heavy normalization promotion boundary failed');
if (styleApproval.decision !== 'APPROVED_WITH_TARGETED_REPAIR' || styleApproval.approvalBoundary.deployable !== false) throw new Error('Standing Heavy style approval boundary failed');
if (normalization.frames.length !== 7 || normalization.frames.some((frame) => frame.touchesEdge)) throw new Error('Standing Heavy normalized frame coverage or edge padding failed');
if (new Set(normalization.frames.map((frame) => frame.normalizedSha256)).size !== 7) throw new Error('Standing Heavy V2 contains an undeclared duplicate pose');
if (normalization.contactPresentation.touchesEdge) throw new Error('Standing Heavy contact composite touches an edge');

fs.mkdirSync(publicRoot, { recursive: true });
const publicFrames = normalization.frames.map((frame) => {
  const source = path.join(repoRoot, frame.normalizedPath);
  if (!fs.existsSync(source) || sha256(source) !== frame.normalizedSha256) throw new Error(`Standing Heavy normalized hash mismatch: ${frame.index}`);
  const destination = path.join(publicRoot, path.basename(source));
  fs.copyFileSync(source, destination);
  if (sha256(destination) !== frame.normalizedSha256) throw new Error(`Standing Heavy public copy mismatch: ${frame.index}`);
  return {
    index: frame.index,
    role: frame.role,
    publicPath: `/lamuh-legacy-v2/standing-heavy-v2/${path.basename(destination)}`,
    sha256: frame.normalizedSha256,
    sourceSha256: frame.rawSha256,
    root: frame.normalizedRoot,
    visibleBounds: frame.visibleBounds,
    bodyCenter: frame.visualCentroid,
    contact: frame.index === 3,
    visibleImpact: frame.index === 3
  };
});

const compositeSource = path.join(repoRoot, normalization.contactPresentation.path);
const compositeDestination = path.join(publicRoot, path.basename(compositeSource));
if (sha256(compositeSource) !== normalization.contactPresentation.sha256) throw new Error('Standing Heavy contact composite source hash mismatch');
fs.copyFileSync(compositeSource, compositeDestination);

const timing = reviewData.timingCandidates.moves.find((move) => move.moveId === 'standing_heavy');
if (!timing) throw new Error('Standing Heavy timing candidates are missing');
const impactCandidates = {
  I1: { label: 'CLEAN_8', hitstopTicks: 8, contactExposureDelta: 0, recoilExposureDelta: 0, recoveryExposureDelta: 0 },
  I2: { label: 'READABLE_9', hitstopTicks: 9, contactExposureDelta: 0, recoilExposureDelta: 1, recoveryExposureDelta: -1 },
  I3: { label: 'WEIGHTED_10', hitstopTicks: 10, contactExposureDelta: 1, recoilExposureDelta: 1, recoveryExposureDelta: -2 }
};

const v1BodyCenters = [
  { x: 221.2, y: 242.3 }, { x: 215.6, y: 222.3 }, { x: 209.1, y: 230.1 },
  { x: 164.9, y: 222.3 }, { x: 164.9, y: 222.3 }, { x: 206.0, y: 224.4 }, { x: 232.7, y: 235.2 }
];

const standingHeavyClosure = {
  schemaVersion: '1.0.0',
  status: 'awaiting_human_lamuh_v2_first_playable_closure_review',
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
    historicalDurationTicks: timing.v1Historical.durationTicks,
    reconstructedExposureTicks: timing.v1Historical.exposureTicks,
    exposureEvidence: timing.v1Historical.exposureEvidence,
    root: { x: 224, y: 382 },
    visibleBounds: [
      { minX: 73, minY: 69, maxX: 374, maxY: 381 }, { minX: 65, minY: 54, maxX: 381, maxY: 381 },
      { minX: 33, minY: 54, maxX: 414, maxY: 381 }, { minX: 14, minY: 96, maxX: 433, maxY: 381 },
      { minX: 14, minY: 96, maxX: 433, maxY: 381 }, { minX: 97, minY: 60, maxX: 349, maxY: 381 },
      { minX: 64, minY: 71, maxX: 382, maxY: 381 }
    ],
    bodyCenters: v1BodyCenters,
    contactFrame: 3,
    exactContactTick: null,
    note: timing.v1Historical.note
  },
  v2: {
    canvas: normalization.normalization.canvas,
    root: normalization.normalization.normalizedRoot,
    rootPath: publicFrames.map(() => normalization.normalization.normalizedRoot),
    frames: publicFrames,
    contactFrame: 3,
    contactPresentation: {
      publicPath: `/lamuh-legacy-v2/standing-heavy-v2/${path.basename(compositeDestination)}`,
      sha256: sha256(compositeDestination),
      bodyOnlyOnWhiff: true,
      allowedOutcomes: ['hit', 'block'],
      separationStatus: 'OUTCOME_ROUTED_COMPOSITE_WITH_LAYER_POLISH_DEBT'
    },
    singleSequenceScale: normalization.normalization.sequenceWideScale,
    perFrameRescale: false,
    visualRecentering: false,
    placementPolicy: normalization.normalization.placementPolicy,
    visibleImpactCount: 1,
    gameplayHitCount: 1
  },
  timingCandidates: timing.candidates,
  recommendedTimingCandidate: timing.recommendedCandidate,
  impactCandidates,
  recommendedImpactCandidate: 'I2',
  unsupported: { counterHit: 'UNSUPPORTED_IN_CURRENT_LAMUH_CORE_AND_NOT_INVENTED' },
  scenarioCoverage: {
    actors: ['P1_authored_facing_right', 'P2_lossless_mirror_facing_left'],
    spaces: ['center', 'left_corner', 'right_corner'],
    outcomes: ['hit', 'stand_block', 'crouch_block', 'whiff'],
    repetition: 'three_deterministic_executions_with_neutral_restoration',
    overlays: ['hitbox', 'hurtbox', 'root', 'body_center', 'VFX'],
    controls: ['1x', '0.5x', 'pause', 'frame_advance', 'restart'],
    counterHit: 'UNSUPPORTED'
  },
  transitionMatrix: [
    'idle_to_standing_light', 'idle_to_standing_medium', 'idle_to_standing_heavy',
    'walk_forward_to_attack', 'walk_backward_to_attack', 'dash_to_attack', 'crouch_to_attack',
    'attack_to_idle', 'attack_to_walk', 'jump_to_air_light', 'air_light_to_landing',
    'standing_block_to_neutral', 'crouching_block_to_neutral', 'hit_to_recovery',
    'grab_whiff_to_neutral', 'forward_throw_to_neutral', 'back_throw_to_neutral',
    'ascend_step_to_neutral'
  ],
  humanApproval: {
    motion: null,
    timing: null,
    combatProfile: null,
    overallFirstPlayable: null,
    standardGrab: null,
    forwardThrow: null,
    backThrow: null
  }
};

reviewData.authority = { renderingAuthoritative: false, simulationAuthoritative: true, candidateOnly: true, deployable: false };
reviewData.standingHeavyClosure = standingHeavyClosure;
reviewData.firstPlayable.technicalStatus = 'FIRST_PLAYABLE_CLOSURE_CANDIDATE';
reviewData.firstPlayable.humanReviewStatus = 'awaiting_human_lamuh_v2_first_playable_closure_review';
reviewData.firstPlayable.candidateOnly = true;
reviewData.firstPlayable.deployable = false;
writeJson(publicReviewDataPath, reviewData);

const sidecar = {
  schemaVersion: '1.0.0',
  id: 'standing_heavy_closure_candidate_v1',
  promotionState: 'candidate',
  deployable: false,
  productionApproved: false,
  motionLock: standingHeavyClosure.motionLock,
  styleApproval: standingHeavyClosure.styleApproval,
  normalizationReport: standingHeavyClosure.normalizationReport,
  frames: publicFrames.map((frame) => ({ index: frame.index, role: frame.role, sourceUri: `repo://${normalization.frames[frame.index].normalizedPath}`, sha256: frame.sha256, root: frame.root, visibleBounds: frame.visibleBounds })),
  contactPresentation: standingHeavyClosure.v2.contactPresentation,
  timingCandidates: standingHeavyClosure.timingCandidates,
  impactCandidates,
  approvalStatus: 'awaiting_human_lamuh_v2_first_playable_closure_review'
};
writeJson(path.join(standingHeavyRoot, 'closure.candidate.v1.json'), sidecar);

const closureStatus = {
  schemaVersion: '1.0.0',
  goal: 'LAMUH LEGACY V2 — STANDING HEAVY COMPLETION + FIRST PLAYABLE HUMAN CLOSURE',
  branch: 'codex/lamuh-legacy-v2-rebuild-v1',
  status: 'candidate-only',
  deployable: false,
  productionApproved: false,
  humanReviewStatus: 'awaiting_human_lamuh_v2_first_playable_closure_review',
  standingHeavy: { motion: null, timing: null },
  firstPlayable: { overall: null, standardGrab: null, forwardThrow: null, backThrow: null },
  decisionQueue: [
    { section: 'A', subject: 'Standing Heavy visual/motion reconstruction', requestedEnum: ['APPROVED_V1_MOTION_PRESERVED', 'APPROVED_WITH_TARGETED_REPAIR', 'REJECTED_V2_LOST_V1_FLOW', 'REJECTED_FOR_MOTION_REVISION'] },
    { section: 'B', subject: 'Standing Heavy timing', requestedEnum: ['TIMING_A_V1_RHYTHM', 'TIMING_B_RECOMMENDED_READABILITY', 'TIMING_C_HEAVIER_ALTERNATE'], targetedAdjustmentAllowed: true },
    { section: 'C', subject: 'Overall Lamuh first playable', requestedEnum: ['APPROVED_FIRST_PLAYABLE_V1', 'APPROVED_FIRST_PLAYABLE_WITH_POLISH_DEBT', 'APPROVED_WITH_TARGETED_REPAIR', 'REJECTED_FOR_TIMING', 'REJECTED_FOR_MOTION_REVISION'] },
    { section: 'D', subject: 'Standard grab / throws', independentDecisions: { standardGrab: 'APPROVED_STANDARD_GRAB', forwardThrow: 'APPROVED_FORWARD_THROW', backThrow: 'APPROVED_BACK_THROW' }, exactTargetedRejectionReasonAllowed: true }
  ],
  stopBoundary: 'Do not expand the moveset until this human review gate is resolved.'
};
writeJson(path.join(contentRoot, 'records', 'first-playable-closure.pending.json'), closureStatus);

console.log(`Built Lamuh Standing Heavy closure candidate with ${publicFrames.length} distinct V2 frames; candidate-only, deployable false.`);
