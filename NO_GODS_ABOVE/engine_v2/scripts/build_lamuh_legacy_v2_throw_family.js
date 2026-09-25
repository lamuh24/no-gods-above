const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

const engineRoot = path.resolve(__dirname, '..');
const repoRoot = path.resolve(engineRoot, '..', '..');
const contentRoot = path.join(engineRoot, 'content-source', 'characters', 'lamuh-legacy-v2');
const reviewRoot = path.join(repoRoot, 'tools', 'nga-forge', 'review', 'lamuh-legacy-v2-throws-v1');
const reportPath = path.join(reviewRoot, 'normalization.report.json');
const reviewDataPath = path.join(engineRoot, 'public', 'lamuh-legacy-v2', 'review-data.json');
const throwContractPath = path.join(contentRoot, 'throws.standard-humanoid.v1.json');
const firstPlayablePath = path.join(contentRoot, 'first-playable.bundle.json');
const sourceAuditPath = path.join(contentRoot, 'source-audit.v1.json');
const styleApprovalPath = path.join(contentRoot, 'records', 'style-checkpoint-v1.approval.json');
const hashLockPath = path.join(contentRoot, 'records', 'throw-animation-family-v1.hash-lock.json');
const humanApprovalPath = path.join(contentRoot, 'records', 'standard-grab-throw-family-v1.approval.json');
const publicRoot = path.join(engineRoot, 'public', 'lamuh-legacy-v2', 'throw-family-v2');

const readJson = (filename) => JSON.parse(fs.readFileSync(filename, 'utf8').replace(/^\uFEFF/, ''));
const writeJson = (filename, value) => {
  fs.mkdirSync(path.dirname(filename), { recursive: true });
  fs.writeFileSync(filename, `${JSON.stringify(value, null, 2)}\n`, 'utf8');
};
const sha256 = (filename) => crypto.createHash('sha256').update(fs.readFileSync(filename)).digest('hex').toUpperCase();
const repoRelative = (filename) => path.relative(repoRoot, filename).replaceAll('\\', '/');
const publicPathFor = (filename) => `/${path.relative(path.join(engineRoot, 'public'), filename).replaceAll('\\', '/')}`;

for (const filename of [reportPath, reviewDataPath, throwContractPath, firstPlayablePath, sourceAuditPath, styleApprovalPath]) {
  if (!fs.existsSync(filename)) throw new Error(`Missing Lamuh throw-animation prerequisite: ${filename}`);
}

const report = readJson(reportPath);
const reviewData = readJson(reviewDataPath);
const throwContract = readJson(throwContractPath);
const firstPlayable = readJson(firstPlayablePath);
const sourceAudit = readJson(sourceAuditPath);
const styleApproval = readJson(styleApprovalPath);
const humanApproval = fs.existsSync(humanApprovalPath) ? readJson(humanApprovalPath) : null;
if (report.candidateOnly !== true || report.deployable !== false || report.sequences.length !== 3) throw new Error('Throw-animation promotion boundary failed');
if (styleApproval.decision !== 'APPROVED_WITH_TARGETED_REPAIR' || styleApproval.approvalBoundary.deployable !== false) throw new Error('Lamuh V2 style checkpoint boundary failed');
if (!report.validation.exactFrameCountPerSequence || !report.validation.deterministicDurationsPreserved || !report.validation.allFramesDistinctPerSequence) throw new Error('Throw-animation sequence validation failed');
if (report.validation.perFrameRendererScale !== false || report.validation.meaningfulMagentaPixelsRemaining !== 0 || report.validation.touchesEdge) throw new Error('Throw-animation visual normalization failed');
if (report.validation.maxStandingHeightDeltaPct > 8) throw new Error('Throw-animation standing-pose scale delta exceeds 8%');
if (throwContract.victimClass !== report.standardVictimClass || throwContract.globalVictimScale !== false) throw new Error('Throw victim-class contract drift');
if (humanApproval) {
  if (humanApproval.subject !== 'lamuh_legacy_v2.standard_grab_throw_animation_family.candidate.v1') throw new Error('Throw-family approval subject mismatch');
  if (humanApproval.decisions.standardGrab !== 'APPROVED_STANDARD_GRAB' || humanApproval.decisions.forwardThrow !== 'APPROVED_FORWARD_THROW' || humanApproval.decisions.backThrow !== 'APPROVED_BACK_THROW') throw new Error('Throw-family approval decisions are incomplete');
  if (humanApproval.approvedCandidate.normalizationReportSha256 !== sha256(reportPath) || humanApproval.approvedCandidate.contactSheetSha256 !== sha256(path.join(repoRoot, report.contactSheet.path))) throw new Error('Throw-family approval no longer matches review evidence');
  if (humanApproval.approvalBoundary.runtimeArtPromotionApproved !== false || humanApproval.approvalBoundary.deployable !== false) throw new Error('Throw-family approval exceeded the candidate boundary');
}

const approvedThrowStatus = 'APPROVED_STANDARD_GRAB_FORWARD_THROW_BACK_THROW_CANDIDATE_ONLY';
const nextReviewStatus = 'awaiting_human_ascend_step_motion_timing_transition_and_combat_profile_review';
const throwStatus = humanApproval ? approvedThrowStatus : report.status;

const expectedRuntime = {
  universal_grab_attempt: { totalTicks: 20, connectTick: 4, releaseTick: null },
  forward_throw: { totalTicks: throwContract.forwardThrow.totalTicks, connectTick: throwContract.forwardThrow.connectTick, releaseTick: throwContract.forwardThrow.releaseTick },
  back_throw: { totalTicks: throwContract.backThrow.totalTicks, connectTick: throwContract.backThrow.connectTick, releaseTick: throwContract.backThrow.releaseTick }
};

fs.mkdirSync(publicRoot, { recursive: true });
const sequences = {};
for (const sequence of report.sequences) {
  const expected = expectedRuntime[sequence.id];
  if (!expected) throw new Error(`Unexpected throw sequence ${sequence.id}`);
  if (sequence.totalTicks !== expected.totalTicks || sequence.connectTick !== expected.connectTick || sequence.releaseTick !== expected.releaseTick) throw new Error(`${sequence.id} deterministic timing drift`);
  if (sequence.exposureTicks.reduce((sum, ticks) => sum + ticks, 0) !== sequence.totalTicks) throw new Error(`${sequence.id} exposure coverage mismatch`);
  const sequencePublicRoot = path.join(publicRoot, sequence.id.replaceAll('_', '-'));
  fs.mkdirSync(sequencePublicRoot, { recursive: true });
  const frames = sequence.frames.map((frame) => {
    const source = path.join(repoRoot, frame.normalizedPath);
    if (!fs.existsSync(source) || sha256(source) !== frame.normalizedSha256) throw new Error(`${sequence.id} normalized frame changed: ${frame.index}`);
    const destination = path.join(sequencePublicRoot, path.basename(source));
    fs.copyFileSync(source, destination);
    if (sha256(destination) !== frame.normalizedSha256) throw new Error(`${sequence.id} public frame copy mismatch: ${frame.index}`);
    return {
      index: frame.index,
      role: frame.role,
      publicPath: publicPathFor(destination),
      sha256: frame.normalizedSha256,
      sourceSha256: frame.rawSha256,
      root: frame.normalizedRoot,
      visibleBounds: frame.visibleBounds,
      bodyCenter: frame.visualCentroid
    };
  });
  sequences[sequence.id] = {
    id: sequence.id,
    authoredFrameCount: sequence.authoredFrameCount,
    totalTicks: sequence.totalTicks,
    exposureTicks: sequence.exposureTicks,
    connectTick: sequence.connectTick,
    releaseTick: sequence.releaseTick,
    frames
  };
}

const contactSheetSource = path.join(repoRoot, report.contactSheet.path);
if (sha256(contactSheetSource) !== report.contactSheet.sha256) throw new Error('Throw-family contact sheet hash mismatch');
const contactSheetDestination = path.join(publicRoot, path.basename(contactSheetSource));
fs.copyFileSync(contactSheetSource, contactSheetDestination);

const hashLock = {
  schemaVersion: '1.0.0',
  subject: 'lamuh_legacy_v2.standard_grab_throw_animation_family.candidate.v1',
  status: 'HASH_LOCKED_CANDIDATE_ONLY',
  candidateOnly: true,
  deployable: false,
  legacySourceAvailable: false,
  legacySourcesModified: false,
  generationMode: 'OpenAI built-in image generation edit mode',
  generationPromptSummary: 'Six-pose modern Lamuh standard grab attempt, body-driven forward throw, and pivoting back throw; no victim drawn; fixed scale; no purple outline or VFX.',
  normalizationReport: { path: repoRelative(reportPath), sha256: sha256(reportPath) },
  contactSheet: { path: repoRelative(contactSheetSource), sha256: sha256(contactSheetSource) },
  rawStrips: report.sequences.map((sequence) => sequence.rawStrip),
  normalizedFrames: report.sequences.flatMap((sequence) => sequence.frames.map((frame) => ({ sequence: sequence.id, index: frame.index, path: frame.normalizedPath, sha256: frame.normalizedSha256 }))),
  approvalBoundary: {
    standardGrabApproved: !!humanApproval,
    forwardThrowApproved: !!humanApproval,
    backThrowApproved: !!humanApproval,
    combatProfileApproved: false,
    runtimeArtPromotionApproved: false,
    productionApproved: false,
    deployable: false
  },
  approvalReceipt: humanApproval ? { path: repoRelative(humanApprovalPath), sha256: sha256(humanApprovalPath) } : null
};
writeJson(hashLockPath, hashLock);

const throwAnimations = {
  schemaVersion: '1.0.0',
  status: throwStatus,
  candidateOnly: true,
  deployable: false,
  rendererAuthoritative: false,
  simulationAuthoritative: true,
  simulationHz: 60,
  canvas: report.normalization.canvas,
  root: report.normalization.normalizedRoot,
  perFrameRescale: false,
  visualRecentering: false,
  placementPolicy: report.normalization.placementPolicy,
  standardVictimClass: report.standardVictimClass,
  globalVictimScale: false,
  sequences,
  contactSheetPublicPath: publicPathFor(contactSheetDestination),
  contactSheetSha256: sha256(contactSheetDestination),
  normalizationReport: { path: repoRelative(reportPath), sha256: sha256(reportPath) },
  hashLock: { path: repoRelative(hashLockPath), sha256: sha256(hashLockPath) },
  reviewQuestions: [
    'Does the reach read quickly and clearly without becoming a special attack?',
    'Does the forward throw visibly drive through Lamuh body mechanics before release?',
    'Does the back throw pivot and side-switch without an arbitrary victim teleport?',
    'Do grab whiff and both throw recoveries blend back to neutral at one consistent character scale?'
  ],
  humanApproval: humanApproval ? humanApproval.decisions : { standardGrab: null, forwardThrow: null, backThrow: null },
  approvalReceipt: humanApproval ? { path: repoRelative(humanApprovalPath), sha256: sha256(humanApprovalPath) } : null
};

throwContract.technicalStatus = 'DETERMINISTIC_MECHANICS_PLUS_DEDICATED_ATTACKER_ART_CANDIDATE';
throwContract.humanReviewStatus = throwStatus;
throwContract.artStatus = humanApproval ? 'HUMAN_APPROVED_THROW_FAMILY_CANDIDATE_NOT_PROMOTED' : 'DEDICATED_ATTACKER_ART_CANDIDATE_AWAITING_HUMAN_REVIEW';
throwContract.artTruth = 'Dedicated modern-style attacker animation now exists for the universal grab attempt/whiff, forward throw, and back throw. Victim motion remains the deterministic standard-humanoid track; the procedural victim is still review-only.';
throwContract.animationFamily = throwAnimations.hashLock;
throwContract.forwardThrow.humanReviewStatus = humanApproval ? humanApproval.decisions.forwardThrow : report.status;
throwContract.backThrow.humanReviewStatus = humanApproval ? humanApproval.decisions.backThrow : report.status;
throwContract.humanApproval = humanApproval ? humanApproval.decisions : { standardGrab: null, forwardThrow: null, backThrow: null };
throwContract.approvalReceipt = humanApproval ? throwAnimations.approvalReceipt : null;
writeJson(throwContractPath, throwContract);

firstPlayable.technicalStatus = humanApproval ? 'FIRST_PLAYABLE_THROW_FAMILY_APPROVED_ASCEND_STEP_REVIEW_CANDIDATE' : 'FIRST_PLAYABLE_PLUS_DEDICATED_THROW_ART_REVIEW_CANDIDATE';
firstPlayable.humanReviewStatus = humanApproval ? nextReviewStatus : report.status;
if (reviewData.airNormalsBatch && reviewData.airLightClosure && reviewData.airMediumClosure && reviewData.airHeavyClosure) {
  firstPlayable.coverage.airNormals = ['air_light', 'air_medium', 'air_heavy'];
}
firstPlayable.knownArtDebt = firstPlayable.knownArtDebt.filter((item) => !item.includes('universal grab, connect/whiff, both throws'));
firstPlayable.knownArtDebt = firstPlayable.knownArtDebt.filter((item) => !item.includes('all modern movement and ground-normal artwork') && !item.includes('approved high-resolution style direction'));
if (!firstPlayable.knownArtDebt.some((item) => item.includes('modern movement, ground-normal, and air-normal artwork'))) {
  firstPlayable.knownArtDebt.push('modern movement, ground-normal, and air-normal artwork remains candidate-only pending per-set human motion, scale, transition, and timing gates');
}
firstPlayable.knownArtDebt = firstPlayable.knownArtDebt.filter((item) => !item.includes('dedicated standard-grab and throw attacker art'));
firstPlayable.knownArtDebt.push(humanApproval
  ? 'dedicated standard-grab and throw attacker art passed human motion/interaction review but remains candidate-only and is not runtime-promoted'
  : 'dedicated standard-grab and throw attacker art remains candidate-only pending standard-grab, forward-throw, and back-throw human review');
if (humanApproval) {
  firstPlayable.currentReviewGate = {
    ...(firstPlayable.currentReviewGate || {}),
    status: nextReviewStatus,
    focusDecisions: ['ascend_step_motion', 'ascend_step_timing', 'ascend_step_transition', 'ascend_step_combat_profile'],
    requiredDecisions: (firstPlayable.currentReviewGate?.requiredDecisions || []).filter((decision) => !['standard_grab', 'forward_throw', 'back_throw'].includes(decision)),
    comparisonRoute: '/lamuh-v1-v2-review.html',
    sandboxRoute: '/lamuh-legacy-sandbox.html',
    stopBoundary: 'human_review_required_before_next_special_or_candidate_promotion'
  };
}
writeJson(firstPlayablePath, firstPlayable);

const completedThrowArtCoverage = new Set(['grab_startup_art', 'grab_connect_art', 'grab_whiff_art', 'forward_throw_art', 'back_throw_art', 'throw_recovery_art']);
sourceAudit.missingV2Coverage = sourceAudit.missingV2Coverage.filter((item) => !completedThrowArtCoverage.has(item));
sourceAudit.globalFindings = sourceAudit.globalFindings.filter((item) => !item.includes('first-playable uses preserved Lamuh source poses'));
sourceAudit.globalFindings.push('No legacy grab/throw source art exists; dedicated modern V2 attacker animation is now authored and hash-locked as a candidate while the deterministic standard-humanoid victim track remains gameplay authority.');
writeJson(sourceAuditPath, sourceAudit);

for (const [id, sequence] of Object.entries(sequences)) {
  writeJson(path.join(contentRoot, 'moves', id.replaceAll('_', '-'), 'visual-closure.candidate.v1.json'), {
    schemaVersion: '1.0.0',
    id: `lamuh_legacy_v2_${id}_visual_candidate_v1`,
    promotionState: 'candidate',
    candidateOnly: true,
    deployable: false,
    productionApproved: false,
    standardVictimClass: report.standardVictimClass,
    timingAndCombatChanged: false,
    normalizationReport: throwAnimations.normalizationReport,
    hashLock: throwAnimations.hashLock,
    sequence,
    approvalStatus: humanApproval ? humanApproval.decisions[id === 'universal_grab_attempt' ? 'standardGrab' : id === 'forward_throw' ? 'forwardThrow' : 'backThrow'] : report.status,
    humanApproval: humanApproval ? humanApproval.decisions[id === 'universal_grab_attempt' ? 'standardGrab' : id === 'forward_throw' ? 'forwardThrow' : 'backThrow'] : null,
    approvalReceipt: humanApproval ? throwAnimations.approvalReceipt : null
  });
}

reviewData.throwAnimations = throwAnimations;
reviewData.throws = throwContract;
reviewData.firstPlayable = firstPlayable;
reviewData.sourceAudit = sourceAudit;
reviewData.humanReviewStatus = humanApproval ? nextReviewStatus : report.status;
reviewData.authority = { renderingAuthoritative: false, simulationAuthoritative: true, candidateOnly: true, deployable: false };
writeJson(reviewDataPath, reviewData);
console.log(`Built dedicated Lamuh universal-grab, forward-throw, and back-throw animation family; ${humanApproval ? 'human throw approvals preserved and Ascend Step is next' : 'awaiting human throw review'}; gameplay timelines unchanged.`);
