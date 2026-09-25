const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

const engineRoot = path.resolve(__dirname, '..');
const repoRoot = path.resolve(engineRoot, '..', '..');
const contentRoot = path.join(engineRoot, 'content-source', 'characters', 'lamuh-legacy-v2');
const moveRoot = path.join(contentRoot, 'moves', 'ascend-step');
const reviewRoot = path.join(repoRoot, 'tools', 'nga-forge', 'review', 'lamuh-legacy-v2-ascend-step-dash-punch-v2');
const reportPath = path.join(reviewRoot, 'normalization.report.json');
const mediumReviewRoot = path.join(repoRoot, 'tools', 'nga-forge', 'review', 'lamuh-legacy-v2-ascend-step-medium-slide-flip-v1');
const mediumReportPath = path.join(mediumReviewRoot, 'normalization.report.json');
const heavyReviewRoot = path.join(repoRoot, 'tools', 'nga-forge', 'review', 'lamuh-legacy-v2-ascend-step-heavy-v1');
const heavyReportPath = path.join(heavyReviewRoot, 'normalization.report.json');
const reviewDataPath = path.join(engineRoot, 'public', 'lamuh-legacy-v2', 'review-data.json');
const timingPath = path.join(contentRoot, 'timing-candidates.v1.json');
const sourceAuditPath = path.join(contentRoot, 'source-audit.v1.json');
const firstPlayablePath = path.join(contentRoot, 'first-playable.bundle.json');
const closurePendingPath = path.join(contentRoot, 'records', 'first-playable-closure.pending.json');
const styleApprovalPath = path.join(contentRoot, 'records', 'style-checkpoint-v1.approval.json');
const throwApprovalPath = path.join(contentRoot, 'records', 'standard-grab-throw-family-v1.approval.json');
const adultDirectionPath = path.join(contentRoot, 'records', 'adult-proportion-v2.human-direction.json');
const rejectionPath = path.join(contentRoot, 'records', 'ascend-step-two-beat-v1.rejection.json');
const hashLockPath = path.join(contentRoot, 'records', 'ascend-step-dash-punch-v2.hash-lock.json');
const mediumHashLockPath = path.join(contentRoot, 'records', 'ascend-step-medium-slide-flip-v1.hash-lock.json');
const mediumDirectionPath = path.join(contentRoot, 'records', 'ascend-step-medium-targeted-motion-repair-v3.human-direction.json');
const heavyHashLockPath = path.join(contentRoot, 'records', 'ascend-step-heavy-v1.hash-lock.json');
const publicRoot = path.join(engineRoot, 'public', 'lamuh-legacy-v2', 'ascend-step-v2');
const mediumPublicRoot = path.join(engineRoot, 'public', 'lamuh-legacy-v2', 'ascend-step-medium-slide-flip-v1');
const heavyPublicRoot = path.join(engineRoot, 'public', 'lamuh-legacy-v2', 'ascend-step-heavy-v1');

const sha256 = (filename) => crypto.createHash('sha256').update(fs.readFileSync(filename)).digest('hex').toUpperCase();
const readJson = (filename) => JSON.parse(fs.readFileSync(filename, 'utf8').replace(/^\uFEFF/, ''));
const writeJson = (filename, value) => {
  fs.mkdirSync(path.dirname(filename), { recursive: true });
  fs.writeFileSync(filename, `${JSON.stringify(value, null, 2)}\n`, 'utf8');
};
const repoRelative = (filename) => path.relative(repoRoot, filename).replaceAll('\\', '/');

for (const filename of [reportPath, mediumReportPath, heavyReportPath, reviewDataPath, timingPath, sourceAuditPath, firstPlayablePath, closurePendingPath, styleApprovalPath, throwApprovalPath, adultDirectionPath]) {
  if (!fs.existsSync(filename)) throw new Error(`Missing Ascend Step prerequisite: ${filename}`);
}

const report = readJson(reportPath);
const mediumReport = readJson(mediumReportPath);
const heavyReport = readJson(heavyReportPath);
const reviewData = readJson(reviewDataPath);
const timingCatalog = readJson(timingPath);
const sourceAudit = readJson(sourceAuditPath);
const firstPlayable = readJson(firstPlayablePath);
const closurePending = readJson(closurePendingPath);
const styleApproval = readJson(styleApprovalPath);
const throwApproval = readJson(throwApprovalPath);
const adultDirection = readJson(adultDirectionPath);
const reviewStatus = 'awaiting_human_ascend_step_medium_targeted_motion_repair_review';

if (report.subject !== 'lamuh_legacy_v2.ascend_step.single_dash_punch.candidate.v2' || report.candidateOnly !== true || report.deployable !== false) throw new Error('Ascend Step candidate boundary failed');
if (report.frames.length !== 6 || report.validation.exactFrameCount !== true || report.validation.distinctFrameHashes !== true) throw new Error('Ascend Step frame coverage failed');
if (report.validation.touchesEdge !== false || report.validation.meaningfulMagentaPixelsRemaining !== 0 || report.validation.redArtifactPixelsRemaining !== 0) throw new Error('Ascend Step visual normalization failed');
if (report.validation.endpointHeightDeltaPct > 5 || report.validation.exposureCoverageTicks !== 30) throw new Error('Ascend Step scale or exposure coverage failed');
if (report.validation.runtimeTravelChanged !== false || report.validation.combatValuesChanged !== false) throw new Error('Ascend Step normalization changed gameplay authority');
if (report.identityLock.matureAdultProportions !== true || report.identityLock.noChibiProportions !== true || report.validation.adultProportionVisualAudit !== 'PASS_CANDIDATE_INTERNAL_REVIEW' || report.validation.compactFramesUsePoseCompressionNotPerFrameScale !== true) throw new Error('Ascend Step adult-proportion gate failed');
if (report.validation.oneActionRule !== 'PASS_CANDIDATE_INTERNAL_REVIEW' || report.validation.hitCountParity !== true || report.singleActionContract.groundedDashForward !== true || report.singleActionContract.punchOnly !== true || report.singleActionContract.risingStrikeRemoved !== true || report.singleActionContract.airborneFollowupRemoved !== true || report.singleActionContract.secondStrikeRemoved !== true) throw new Error('Ascend Step single-action dash-punch contract failed');
if (report.validation.exactIdentitySourceReuse !== true || report.validation.generatedAvatarFrameCount !== 0 || report.validation.fullBodyCanvasContainment !== true || report.identityLock.exactApprovedBodyFrames !== true || report.identityLock.generatedAvatarPixels !== false || report.identityLock.recoveryUsesApprovedIdle !== true) throw new Error('Ascend Step exact approved identity-source reuse gate failed');
if (report.mobilityIdentity.primaryRead !== 'movement_first_dash_with_single_punch_end_beat' || report.mobilityIdentity.dashAura !== true || report.mobilityIdentity.impactExplosion !== false || report.mobilityIdentity.worldTravelOwner !== 'deterministic_simulation' || report.vfxBoundary.movementAuraRequired !== true) throw new Error('Ascend Step movement-first aura contract failed');
if (report.approvalBoundary.adultProportionHumanReviewRequired !== true) throw new Error('Ascend Step adult-proportion human gate is missing');
if (mediumReport.subject !== 'lamuh_legacy_v2.ascend_step.medium.targeted_motion_repair.candidate.v3' || mediumReport.candidateOnly !== true || mediumReport.deployable !== false) throw new Error('Ascend Step Medium targeted-motion-repair candidate boundary failed');
if (mediumReport.frames.length !== 16 || mediumReport.validation.exactFrameCount !== true || mediumReport.validation.distinctFrameHashes !== true || mediumReport.validation.hitCountParity !== true) throw new Error('Ascend Step Medium frame or hit-count coverage failed');
if (mediumReport.validation.touchesEdge !== false || mediumReport.validation.fullBodyCanvasContainment !== true || mediumReport.validation.meaningfulMagentaPixelsRemaining !== 0 || mediumReport.validation.redArtifactPixelsRemaining !== 0 || mediumReport.validation.exposureCoverageTicks !== 48) throw new Error('Ascend Step Medium normalization failed');
if (mediumReport.identityLock.generatedAvatarPixels !== true || mediumReport.identityLock.authoredMissingStateSourceFrames !== 6 || mediumReport.identityLock.authoredMissingStateAnimationFrames !== 9 || mediumReport.identityLock.authoredMissingStateRigidVariants !== 3 || mediumReport.identityLock.sameSequenceScale !== true || mediumReport.validation.perFrameBodyScale !== false || mediumReport.validation.generatedAvatarSourceFrameCount !== 6 || mediumReport.validation.generatedAvatarAnimationFrameCount !== 9) throw new Error('Ascend Step Medium bounded missing-state authorship gate failed');
if (mediumReport.actionContract.oneContinuousComboAction !== true || mediumReport.actionContract.strikingLimbContinuity !== 'slide_lead_leg_retracts_then_one_rising_heel_strikes_while_other_leg_counterbalances' || mediumReport.actionContract.launcherUsesBothLegs !== false || mediumReport.actionContract.clearStrikingLegCount !== 1 || mediumReport.actionContract.counterbalanceLegBent !== true || mediumReport.actionContract.launcherFeetVisible !== 2 || mediumReport.actionContract.fullFlipMotionArt.length !== 10 || mediumReport.actionContract.postContactBodyShape !== 'distinct_authored_tuck_not_rotated_contact_sprite' || mediumReport.actionContract.visibleImpactCount !== 2 || mediumReport.actionContract.gameplayHitCount !== 2 || mediumReport.actionContract.victimTeleport !== false || mediumReport.validation.backHandspringFloorPlant !== 'PASS_CANDIDATE_INTERNAL_REVIEW' || mediumReport.validation.backHandspringFullFlipCoverage !== 'PASS_CANDIDATE_INTERNAL_REVIEW' || mediumReport.validation.asymmetricSingleLegLauncher !== 'PASS_CANDIDATE_INTERNAL_REVIEW' || mediumReport.validation.counterbalanceLegBent !== 'PASS_CANDIDATE_INTERNAL_REVIEW' || mediumReport.validation.slideRetractionCoilConnector !== 'PASS_CANDIDATE_INTERNAL_REVIEW' || mediumReport.validation.backwardHandsReachConnector !== 'PASS_CANDIDATE_INTERNAL_REVIEW' || mediumReport.validation.backwardRotationDirection !== 'PASS_CANDIDATE_INTERNAL_REVIEW' || mediumReport.validation.postContactLegTuck !== 'PASS_CANDIDATE_INTERNAL_REVIEW' || mediumReport.validation.fixedWorldRoot !== false || mediumReport.validation.forwardSlideRootTravel !== 'PASS_CANDIDATE_INTERNAL_REVIEW' || mediumReport.validation.backwardMomentumRedirection !== 'PASS_CANDIDATE_INTERNAL_REVIEW') throw new Error('Ascend Step Medium targeted motion action contract failed');
if (mediumReport.contactFrames.join(',') !== '3,10' || mediumReport.timing.contactTicks.join(',') !== '7,26') throw new Error('Ascend Step Medium authored contacts drifted');
if (heavyReport.subject !== 'lamuh_legacy_v2.ascend_step.heavy.candidate.v1' || heavyReport.candidateOnly !== true || heavyReport.deployable !== false) throw new Error('Ascend Step Heavy candidate boundary failed');
if (heavyReport.frames.length !== 10 || heavyReport.validation.exactFrameCount !== true || heavyReport.validation.distinctFrameHashes !== true || heavyReport.validation.hitCountParity !== true) throw new Error('Ascend Step Heavy frame or hit-count coverage failed');
if (heavyReport.validation.touchesEdge !== false || heavyReport.validation.meaningfulMagentaPixelsRemaining !== 0 || heavyReport.validation.redArtifactPixelsRemaining !== 0 || heavyReport.validation.exposureCoverageTicks !== 42) throw new Error('Ascend Step Heavy normalization failed');
if (heavyReport.identityLock.matureAdultProportions !== true || heavyReport.identityLock.noChibiProportions !== true || heavyReport.identityLock.noPurpleOutline !== true || heavyReport.actionContract.targetRelativeSideSwitch !== true || heavyReport.actionContract.victimTranslation !== false || heavyReport.actionContract.gameplayHitCount !== 1) throw new Error('Ascend Step Heavy identity or action contract failed');
if (heavyReport.validation.exactIdentitySourceReuse !== true || heavyReport.validation.generatedAvatarFrameCount !== 0 || heavyReport.validation.fullBodyCanvasContainment !== true || heavyReport.identityLock.exactApprovedBodyFrames !== true || heavyReport.identityLock.generatedAvatarPixels !== false || heavyReport.identityLock.recoveryUsesApprovedIdle !== true) throw new Error('Ascend Step Heavy exact approved identity-source reuse gate failed');
if (report.validation.detachedBodyAndEffectComponentsPreserved !== true || heavyReport.validation.detachedBodyAndEffectComponentsPreserved !== true || report.validation.tinyArtifactMaximumAreaPixels !== 12 || heavyReport.validation.tinyArtifactMaximumAreaPixels !== 12) throw new Error('Ascend Step exact-cutout preservation gate failed');
if (heavyReport.contactFrame !== 7 || heavyReport.chargeReadability.briefPauseFrame !== 5 || heavyReport.chargeReadability.growingEnergyBallFrame !== 6 || heavyReport.chargeReadability.singleBlastContactFrame !== 7 || heavyReport.chargeReadability.damageBeforeContact !== false) throw new Error('Ascend Step Heavy pause, growth, or single-contact contract failed');
if (styleApproval.decision !== 'APPROVED_WITH_TARGETED_REPAIR' || styleApproval.approvalBoundary.deployable !== false) throw new Error('Lamuh style checkpoint boundary failed');
if (throwApproval.decisions.standardGrab !== 'APPROVED_STANDARD_GRAB' || throwApproval.decisions.forwardThrow !== 'APPROVED_FORWARD_THROW' || throwApproval.decisions.backThrow !== 'APPROVED_BACK_THROW') throw new Error('Throw-family gate is not closed');
if (adultDirection.subject !== 'lamuh_legacy_v2.all_move_animation_artwork' || adultDirection.enforcement !== 'hard_candidate_gate_before_human_motion_review' || !adultDirection.automaticRejection.includes('chibi or super-deformed anatomy') || adultDirection.approvalBoundary.currentAscendStepHumanApproved !== false || adultDirection.approvalBoundary.deployable !== false) throw new Error('Lamuh V2 adult-proportion direction is incomplete');

const timing = timingCatalog.moves.find((move) => move.moveId === 'ascend_step');
if (!timing || timing.recommendedCandidate !== 'B') throw new Error('Ascend Step timing candidates are missing');
timing.sourceFrameCount = 7;
timing.contactSourceFrames = [3, 10];
timing.authoredFrameCount = 16;
timing.candidates = {
  A: { label: 'QUICK_TARGETED_REPAIR_44', phaseTicks: { startup: 7, active: 22, recovery: 15 }, durationTicks: 44, exposureTicks: [3, 2, 2, 3, 2, 2, 3, 3, 2, 2, 3, 2, 2, 3, 4, 6], preservesSourceFrameOrder: false, preservesAuthoredFrameOrder: true, duplicateMeaninglessFrames: false },
  B: { label: 'READABLE_TARGETED_REPAIR_RECOMMENDED_48', phaseTicks: { startup: 7, active: 24, recovery: 17 }, durationTicks: 48, exposureTicks: [3, 2, 2, 3, 2, 3, 3, 3, 2, 3, 3, 3, 3, 3, 4, 6], preservesSourceFrameOrder: false, preservesAuthoredFrameOrder: true, duplicateMeaninglessFrames: false },
  C: { label: 'BROAD_ROTATIONAL_RECOVERY_52', phaseTicks: { startup: 8, active: 24, recovery: 20 }, durationTicks: 52, exposureTicks: [4, 2, 2, 3, 2, 3, 3, 4, 2, 3, 3, 3, 3, 3, 5, 7], preservesSourceFrameOrder: false, preservesAuthoredFrameOrder: true, duplicateMeaninglessFrames: false }
};
timing.v2Reinterpretation = {
  approvedDisposition: 'MODERNIZE',
  reason: 'Targeted motion repair keeps the approved two-hit concept but replaces the fixed-root, symmetrical gymnastics read. The slide visibly travels, a new coil pose recycles its momentum backward, the hands plant as a temporary pivot, one heel rises as the clear striking leg while the other leg stays bent for counterbalance, and distinct post-contact tuck art carries Lamuh into a compressed landing.',
  retiredLegacyBeats: ['shared Light/Medium dash-punch clone', 'punch contact', 'soft-knockdown finish'],
  retainedLegacyQualities: ['forward-loaded momentum', 'low dash energy', 'coat and loc drag', 'connected recovery direction'],
  protectedLegacyFramesModified: false
};
timing.recommendedCandidate = 'B';
timing.humanReviewStatus = null;
timing.note = 'Targeted Medium-special motion repair: a traveling low slide-kick contact flows through an authored retraction/coil into a planted-hands back-handspring and one asymmetric rising-heel launcher, then a distinct airborne tuck and controlled landing. The two visible impacts map to two deterministic hitboxes.';
if (timing.candidates.B.durationTicks !== 48 || timing.candidates.B.exposureTicks.join(',') !== mediumReport.timing.exposureTicks.join(',')) throw new Error('Ascend Step Medium recommended timing drift');
writeJson(timingPath, timingCatalog);

const clone = (value) => JSON.parse(JSON.stringify(value));
const upsertTiming = (moveId, value) => {
  const existingIndex = timingCatalog.moves.findIndex((move) => move.moveId === moveId);
  if (existingIndex >= 0) timingCatalog.moves[existingIndex] = value;
  else timingCatalog.moves.push(value);
  return value;
};
const lightTiming = upsertTiming('ascend_step_light', {
  moveId: 'ascend_step_light', sourceFrameCount: 7, authoredFrameCount: 6, contactSourceFrames: [3], v1Historical: clone(timing.v1Historical),
  candidates: {
    A: { label: 'QUICK_LEGACY_RHYTHM', phaseTicks: { startup: 4, active: 4, recovery: 10 }, durationTicks: 18, exposureTicks: [2, 1, 1, 4, 4, 6], preservesSourceFrameOrder: false, preservesAuthoredFrameOrder: true, duplicateMeaninglessFrames: false },
    B: { label: 'QUICK_MOBILITY_RECOMMENDED', phaseTicks: { startup: 5, active: 4, recovery: 11 }, durationTicks: 20, exposureTicks: [2, 2, 1, 4, 5, 6], preservesSourceFrameOrder: false, preservesAuthoredFrameOrder: true, duplicateMeaninglessFrames: false },
    C: { label: 'READABLE_LIGHT_ALTERNATE', phaseTicks: { startup: 6, active: 5, recovery: 12 }, durationTicks: 23, exposureTicks: [3, 2, 1, 5, 5, 7], preservesSourceFrameOrder: false, preservesAuthoredFrameOrder: true, duplicateMeaninglessFrames: false }
  },
  recommendedCandidate: 'B', humanReviewStatus: null,
  note: 'Ascend Step Light uses the approved family dash-punch motion at the shortest travel and lowest reward. It is one cyan-gold movement dash and one punch, never a second attack.',
  v2Reinterpretation: {
    approvedDisposition: 'MODERNIZE',
    reason: 'Shares the reinterpreted family dash-punch motion; the seven V1 source cells are not replayed in order.',
    retiredLegacyBeats: ['rising palm contact', 'airborne palm follow-through', 'extended airborne second strike'],
    retainedLegacyQualities: ['forward-loaded momentum', 'low dash energy', 'coat and loc drag', 'forward follow-through', 'grounded recovery direction'],
    protectedLegacyFramesModified: false
  }
});
const heavyTiming = upsertTiming('ascend_step_heavy', {
  moveId: 'ascend_step_heavy', sourceFrameCount: 0, authoredFrameCount: 10, contactSourceFrames: [7],
  v1Historical: { durationTicks: 0, exposureTicks: [], durationEvidence: 'No recoverable V1 Heavy variant; V2 missing-state authoring.', exposureEvidence: 'Not applicable.', contactTick: null, note: 'Ascend Step Heavy is a new V2 family variant, not a claim about legacy timing.' },
  candidates: {
    A: { label: 'FAST_CHARGE_ROUTE', phaseTicks: { startup: 22, active: 4, recovery: 12 }, durationTicks: 38, exposureTicks: [3, 3, 4, 2, 4, 3, 3, 4, 5, 7], preservesSourceFrameOrder: null, preservesAuthoredFrameOrder: true, duplicateMeaninglessFrames: false },
    B: { label: 'PAUSE_GROWTH_RECOMMENDED', phaseTicks: { startup: 24, active: 5, recovery: 13 }, durationTicks: 42, exposureTicks: [4, 4, 4, 2, 4, 3, 3, 5, 6, 7], preservesSourceFrameOrder: null, preservesAuthoredFrameOrder: true, duplicateMeaninglessFrames: false },
    C: { label: 'HEAVIER_GROWING_BLAST_ALTERNATE', phaseTicks: { startup: 26, active: 6, recovery: 14 }, durationTicks: 46, exposureTicks: [5, 4, 4, 2, 5, 3, 3, 6, 7, 7], preservesSourceFrameOrder: null, preservesAuthoredFrameOrder: true, duplicateMeaninglessFrames: false }
  },
  recommendedCandidate: 'B', humanReviewStatus: null,
  note: 'Ascend Step Heavy approaches with the family aura, performs one deterministic target-relative side switch without translating the victim, pauses briefly behind them, visibly grows a palm energy ball, then fires one blast. It has no approach hit and no multi-hit sequence.'
});
if (lightTiming.candidates.B.durationTicks !== 20 || heavyTiming.candidates.B.durationTicks !== heavyReport.timing.totalTicks || heavyTiming.candidates.B.exposureTicks.join(',') !== heavyReport.timing.exposureTicks.join(',')) throw new Error('Ascend Step family recommended timing drift');
writeJson(timingPath, timingCatalog);
reviewData.timingCandidates = timingCatalog;

fs.mkdirSync(publicRoot, { recursive: true });
const publicFrames = report.frames.map((frame) => {
  const source = path.join(repoRoot, frame.normalizedPath);
  if (!fs.existsSync(source) || sha256(source) !== frame.normalizedSha256) throw new Error(`Ascend Step normalized hash mismatch: ${frame.index}`);
  for (const legacyRef of frame.legacyMotionReferences) {
    const legacy = path.join(repoRoot, legacyRef.path);
    if (!fs.existsSync(legacy) || sha256(legacy) !== legacyRef.sha256) throw new Error(`Ascend Step protected V1 source changed: ${legacyRef.index}`);
  }
  const destination = path.join(publicRoot, path.basename(source));
  fs.copyFileSync(source, destination);
  if (sha256(destination) !== frame.normalizedSha256) throw new Error(`Ascend Step public frame copy mismatch: ${frame.index}`);
  return {
    index: frame.index,
    sourceV1Indices: frame.legacyMotionReferences.map((item) => item.index),
    role: frame.role,
    publicPath: `/lamuh-legacy-v2/ascend-step-v2/${path.basename(destination)}`,
    sha256: frame.normalizedSha256,
    sourceSha256: frame.rawSha256,
    root: frame.normalizedRoot,
    visibleBounds: frame.visibleBounds,
    bodyCenter: frame.visualCentroid,
    contact: frame.index === report.contactFrame,
    visibleImpact: frame.index === report.contactFrame
  };
});

const contactSheetSource = path.join(repoRoot, report.contactSheet.path);
if (sha256(contactSheetSource) !== report.contactSheet.sha256) throw new Error('Ascend Step contact sheet hash mismatch');
const contactSheetDestination = path.join(publicRoot, path.basename(contactSheetSource));
fs.copyFileSync(contactSheetSource, contactSheetDestination);

fs.mkdirSync(mediumPublicRoot, { recursive: true });
const mediumPublicFrames = mediumReport.frames.map((frame) => {
  const source = path.join(repoRoot, frame.normalizedPath);
  if (!fs.existsSync(source) || sha256(source) !== frame.normalizedSha256) throw new Error(`Ascend Step Medium normalized hash mismatch: ${frame.index}`);
  const bodySource = path.join(repoRoot, frame.identityBodyPath);
  if (!fs.existsSync(bodySource) || sha256(bodySource) !== frame.identityBodySha256) throw new Error(`Ascend Step Medium approved body source changed: ${frame.index}`);
  const destination = path.join(mediumPublicRoot, path.basename(source));
  fs.copyFileSync(source, destination);
  if (sha256(destination) !== frame.normalizedSha256) throw new Error(`Ascend Step Medium public frame copy mismatch: ${frame.index}`);
  return {
    index: frame.index,
    role: frame.role,
    publicPath: `/lamuh-legacy-v2/ascend-step-medium-slide-flip-v1/${path.basename(destination)}`,
    sha256: frame.normalizedSha256,
    sourceSha256: frame.identityBodySha256,
    root: frame.normalizedRoot,
    authoredWorldRootOffset: frame.authoredWorldRootOffset,
    visibleBounds: frame.visibleBounds,
    bodyCenter: frame.visualCentroid,
    rigidBodyTransform: frame.rigidBodyTransform,
    contact: mediumReport.contactFrames.includes(frame.index),
    visibleImpact: mediumReport.contactFrames.includes(frame.index)
  };
});
const mediumContactSheetSource = path.join(repoRoot, mediumReport.contactSheet.path);
if (sha256(mediumContactSheetSource) !== mediumReport.contactSheet.sha256) throw new Error('Ascend Step Medium contact sheet hash mismatch');
const mediumContactSheetDestination = path.join(mediumPublicRoot, path.basename(mediumContactSheetSource));
fs.copyFileSync(mediumContactSheetSource, mediumContactSheetDestination);
const mediumReviewOutputs = Object.fromEntries(Object.entries(mediumReport.reviewOutputs).map(([key, value]) => {
  if (typeof value === 'string' || value === null) return [key, value];
  const source = path.join(repoRoot, value.path);
  if (!fs.existsSync(source) || sha256(source) !== value.sha256) throw new Error(`Ascend Step Medium review output hash mismatch: ${key}`);
  const destination = path.join(mediumPublicRoot, path.basename(source));
  fs.copyFileSync(source, destination);
  return [key, { ...value, publicPath: `/lamuh-legacy-v2/ascend-step-medium-slide-flip-v1/${path.basename(destination)}` }];
}));

fs.mkdirSync(heavyPublicRoot, { recursive: true });
const heavyPublicFrames = heavyReport.frames.map((frame) => {
  const source = path.join(repoRoot, frame.normalizedPath);
  if (!fs.existsSync(source) || sha256(source) !== frame.normalizedSha256) throw new Error(`Ascend Step Heavy normalized hash mismatch: ${frame.index}`);
  const destination = path.join(heavyPublicRoot, path.basename(source));
  fs.copyFileSync(source, destination);
  if (sha256(destination) !== frame.normalizedSha256) throw new Error(`Ascend Step Heavy public frame copy mismatch: ${frame.index}`);
  return {
    index: frame.index, role: frame.role, publicPath: `/lamuh-legacy-v2/ascend-step-heavy-v1/${path.basename(destination)}`,
    sha256: frame.normalizedSha256, sourceSha256: frame.rawSha256, root: frame.normalizedRoot,
    visibleBounds: frame.visibleBounds, bodyCenter: frame.visualCentroid,
    contact: frame.index === heavyReport.contactFrame, visibleImpact: frame.index === heavyReport.contactFrame
  };
});
const heavyContactSheetSource = path.join(repoRoot, heavyReport.contactSheet.path);
if (sha256(heavyContactSheetSource) !== heavyReport.contactSheet.sha256) throw new Error('Ascend Step Heavy contact sheet hash mismatch');
const heavyContactSheetDestination = path.join(heavyPublicRoot, path.basename(heavyContactSheetSource));
fs.copyFileSync(heavyContactSheetSource, heavyContactSheetDestination);

const hashLock = {
  schemaVersion: '1.0.0',
  subject: report.subject,
  status: 'HASH_LOCKED_CANDIDATE_ONLY',
  candidateOnly: true,
  deployable: false,
  protectedV1SourcesModified: false,
  generationMode: 'Exact approved runtime body-frame reuse with separate VFX-only generation and compositing',
  generationPromptSummary: 'User-directed six-pose Ascend Step modernization: exact approved idle, dash, standing-light contact, follow-through, and idle-recovery body frames with separate cyan-gold VFX-only layers. No generated avatar pixels are present.',
  normalizationReport: { path: repoRelative(reportPath), sha256: sha256(reportPath) },
  contactSheet: { path: repoRelative(contactSheetSource), sha256: sha256(contactSheetSource) },
  rawStrip: { path: report.frames[0].rawPath, sha256: report.frames[0].rawSha256 },
  protectedLegacyFrames: report.protectedLegacyFrames,
  normalizedFrames: report.frames.map((frame) => ({ index: frame.index, path: frame.normalizedPath, sha256: frame.normalizedSha256 })),
  approvalBoundary: report.approvalBoundary
};
writeJson(hashLockPath, hashLock);

const mediumHashLock = {
  schemaVersion: '1.0.0',
  subject: mediumReport.subject,
  status: 'HASH_LOCKED_CANDIDATE_ONLY',
  candidateOnly: true,
  deployable: false,
  protectedV1SourcesModified: false,
  generationMode: 'Approved Lamuh V2 slide/recovery reuse plus six bounded missing-state key poses at one locked scale: coil, backward two-hand reach, plant, asymmetric rising heel, post-contact tuck, and landing; rigid transforms are limited to in-betweens',
  generationPromptSummary: 'Sixteen-frame targeted motion repair: aura-led traveling low slide kick, distinct slide-retraction coil, backward two-hand floor reach, two-hand plant, hips-over-shoulders transition, asymmetric single rising-heel launcher with bent counterbalance leg, authored post-contact tuck, controlled landing compression, and exact approved Idle recovery.',
  normalizationReport: { path: repoRelative(mediumReportPath), sha256: sha256(mediumReportPath) },
  contactSheet: { path: repoRelative(mediumContactSheetSource), sha256: sha256(mediumContactSheetSource) },
  approvedBodySources: [...new Map(mediumReport.frames.map((frame) => [frame.identityBodyPath, { path: frame.identityBodyPath, sha256: frame.identityBodySha256 }])).values()],
  normalizedFrames: mediumReport.frames.map((frame) => ({ index: frame.index, path: frame.normalizedPath, sha256: frame.normalizedSha256, rigidBodyTransform: frame.rigidBodyTransform })),
  approvalBoundary: mediumReport.approvalBoundary
};
writeJson(mediumHashLockPath, mediumHashLock);

writeJson(mediumDirectionPath, {
  schemaVersion: '1.0.0',
  subject: 'lamuh_legacy_v2.ascend_step.medium_special',
  date: '2026-09-03',
  source: 'live_user_direction',
  direction: 'Targeted motion repair preserves the approved traveling slide kick into back-handspring rising-kick concept. The world root travels forward through the slide then redirects backward; a distinct retraction/coil bridges the attacks; both hands plant; one heel is the clear rising launcher while the other leg stays bent for counterbalance; authored follow-through gathers the legs into a controlled landing.',
  supersedesForMediumOnly: 'fixed_root_simultaneous_double_leg_handspring_candidate',
  leavesUnchanged: ['legacy_ascend_step_light', 'legacy_ascend_step_heavy', 'standing_medium'],
  visibleImpactCount: 2,
  gameplayHitCount: 2,
  victimTeleport: false,
  approvalBoundary: { motionApproved: false, timingApproved: false, combatProfileApproved: false, productionApproved: false, deployable: false }
});

const heavyHashLock = {
  schemaVersion: '1.0.0',
  subject: heavyReport.subject,
  status: 'HASH_LOCKED_CANDIDATE_ONLY',
  candidateOnly: true,
  deployable: false,
  generationMode: 'Exact approved runtime body-frame reuse with separate VFX-only dash, charge, teleport, and blast compositing',
  generationPromptSummary: 'Ten-pose Ascend Step Heavy: exact approved Lamuh idle, dash, guard, punch, recoil, and recovery body frames; deterministic behind-target side switch; brief pause; growing VFX-only energy ball; and exactly one complete VFX-only blast. No generated avatar pixels are present.',
  normalizationReport: { path: repoRelative(heavyReportPath), sha256: sha256(heavyReportPath) },
  contactSheet: { path: repoRelative(heavyContactSheetSource), sha256: sha256(heavyContactSheetSource) },
  rawSources: [...new Map(heavyReport.frames.map((frame) => [frame.rawPath, { path: frame.rawPath, sha256: frame.rawSha256 }])).values()],
  normalizedFrames: heavyReport.frames.map((frame) => ({ index: frame.index, path: frame.normalizedPath, sha256: frame.normalizedSha256 })),
  approvalBoundary: heavyReport.approvalBoundary
};
writeJson(heavyHashLockPath, heavyHashLock);

writeJson(rejectionPath, {
  schemaVersion: '1.0.0',
  subject: 'lamuh_legacy_v2.ascend_step.two_beat_candidate.v1',
  date: '2026-09-03',
  decision: 'REJECTED_FOR_MOTION_REVISION',
  userDirection: 'ascend step should not be 2 moves its confusing it should just be a dash forward with a punch',
  reason: 'The rising contact followed by an airborne punch reads as two separate attacks instead of one continuous special.',
  preservedAsHistory: true,
  supersessionBoundary: {
    light: 'still_applies_one_dash_punch',
    medium: 'superseded_by_later_live_user_direction_for_a_connected_slide_kick_into_back_handspring_launcher',
    heavy: 'not_applicable_heavy_keeps_approach_switch_blast'
  },
  rejectedCandidate: {
    normalizationReport: 'tools/nga-forge/review/lamuh-legacy-v2-ascend-step-modernization-v1/normalization.report.json',
    sidecar: 'NO_GODS_ABOVE/engine_v2/content-source/characters/lamuh-legacy-v2/moves/ascend-step/visual-modernization.candidate.v1.json',
    hashLock: 'NO_GODS_ABOVE/engine_v2/content-source/characters/lamuh-legacy-v2/records/ascend-step-modernization-v1.hash-lock.json'
  },
  replacementDirection: {
    v2Disposition: 'MODERNIZE',
    action: 'one_grounded_forward_dash_into_one_right_arm_straight_punch',
    visibleImpactCount: 1,
    gameplayHitCount: 1,
    removedBeats: ['rising_palm_contact', 'airborne_palm_follow_through', 'airborne_second_strike']
  },
  approvalBoundary: {
    replacementMotionApproved: false,
    replacementTimingApproved: false,
    combatProfileApproved: false,
    productionApproved: false,
    deployable: false
  }
});

const v1VisibleBounds = [
  { minX: 61, minY: 77, maxX: 386, maxY: 381 },
  { minX: 17, minY: 112, maxX: 433, maxY: 378 },
  { minX: 17, minY: 132, maxX: 433, maxY: 381 },
  { minX: 88, minY: 72, maxX: 360, maxY: 342 },
  { minX: 82, minY: 72, maxX: 366, maxY: 381 },
  { minX: 100, minY: 72, maxX: 346, maxY: 381 },
  { minX: 61, minY: 72, maxX: 386, maxY: 381 }
];
const v1BodyCenters = [
  { x: 234.44, y: 233.49 }, { x: 261.86, y: 250.57 }, { x: 270.15, y: 265.14 },
  { x: 229.48, y: 210.93 }, { x: 205.73, y: 201.16 }, { x: 205.65, y: 212.79 }, { x: 196.75, y: 227.31 }
];
const impactCandidates = {
  I1: { label: 'CLEAN_6', hitstopTicks: 6, contactExposureDelta: 0, recoilExposureDelta: 0, recoveryExposureDelta: 0 },
  I2: { label: 'READABLE_7', hitstopTicks: 7, contactExposureDelta: 0, recoilExposureDelta: 0, recoveryExposureDelta: 0 },
  I3: { label: 'WEIGHTED_8', hitstopTicks: 8, contactExposureDelta: 1, recoilExposureDelta: 1, recoveryExposureDelta: -2 }
};
const sharedDashPunchTiming = {
  A: { label: 'CURRENT_LEGACY_RUNTIME_RHYTHM', phaseTicks: { startup: 5, active: 6, recovery: 15 }, durationTicks: 26, exposureTicks: [2, 2, 1, 6, 6, 9], preservesSourceFrameOrder: false, preservesAuthoredFrameOrder: true, duplicateMeaninglessFrames: false },
  B: { label: 'SLIGHTLY_SLOWER_RECOMMENDED', phaseTicks: { startup: 6, active: 6, recovery: 18 }, durationTicks: 30, exposureTicks: [3, 2, 1, 6, 7, 11], preservesSourceFrameOrder: false, preservesAuthoredFrameOrder: true, duplicateMeaninglessFrames: false },
  C: { label: 'HEAVIER_ALTERNATE', phaseTicks: { startup: 8, active: 7, recovery: 19 }, durationTicks: 34, exposureTicks: [4, 3, 1, 7, 8, 11], preservesSourceFrameOrder: false, preservesAuthoredFrameOrder: true, duplicateMeaninglessFrames: false }
};

const ascendStepClosure = {
  schemaVersion: '1.0.0',
  status: reviewStatus,
  candidateOnly: true,
  deployable: false,
  rendererAuthoritative: false,
  simulationAuthoritative: true,
  simulationHz: 60,
  identityLock: {
    matureAdultProportions: report.identityLock.matureAdultProportions,
    noChibiProportions: report.identityLock.noChibiProportions,
    boxedBeardAndMustache: report.identityLock.boxedBeardAndMustache,
    longBlackLocs: report.identityLock.longBlackLocs,
    noPurpleOutline: report.identityLock.noPurpleOutline,
    sameSequenceScale: report.identityLock.sameSequenceScale,
    compactFramesUsePoseCompressionNotPerFrameScale: report.validation.compactFramesUsePoseCompressionNotPerFrameScale,
    internalVisualAudit: report.validation.adultProportionVisualAudit,
    directionReceipt: { path: repoRelative(adultDirectionPath), sha256: sha256(adultDirectionPath) },
    humanApproval: null
  },
  hashLock: { path: repoRelative(hashLockPath), sha256: sha256(hashLockPath) },
  normalizationReport: { path: repoRelative(reportPath), sha256: sha256(reportPath) },
  styleApproval: { path: repoRelative(styleApprovalPath), sha256: sha256(styleApprovalPath), decision: styleApproval.decision },
  priorGateApproval: { path: repoRelative(throwApprovalPath), sha256: sha256(throwApprovalPath), decisions: throwApproval.decisions },
  v1: {
    sourceFrameCount: 7,
    historicalDurationTicks: timing.v1Historical.durationTicks,
    reconstructedExposureTicks: timing.v1Historical.exposureTicks,
    exposureEvidence: timing.v1Historical.exposureEvidence,
    root: { x: 224, y: 382 },
    visibleBounds: v1VisibleBounds,
    bodyCenters: v1BodyCenters,
    contactFrame: 3,
    exactContactTick: timing.v1Historical.contactTick,
    note: `${timing.v1Historical.note} The full legacy two-beat arc is protected but intentionally not reproduced in V2 after human rejection.`
  },
  v2: {
    canvas: report.normalization.canvas,
    root: report.normalization.normalizedRoot,
    rootPath: publicFrames.map(() => report.normalization.normalizedRoot),
    frames: publicFrames,
    contactFrame: report.contactFrame,
    contactPresentation: {
      publicPath: publicFrames[report.contactFrame].publicPath,
      sha256: publicFrames[report.contactFrame].sha256,
      bodyOnlyOnWhiff: true,
      bodyOnlyForAllOutcomes: true,
      vfxEnabled: false,
      classification: 'movement_aura_in_body_presentation_single_dash_punch_separate_hit_spark_deferred',
      allowedOutcomes: ['hit', 'block', 'whiff'],
      separationStatus: 'ATTACK_AURA_PRESERVED_SEPARATE_HIT_SPARK_DEFERRED_NOT_BLOCKING'
    },
    singleSequenceScale: report.normalization.sequenceWideScale,
    perFrameRescale: false,
    visualRecentering: false,
    placementPolicy: report.normalization.placementPolicy,
    visibleImpactCount: report.visibleImpactCount,
    gameplayHitCount: 1,
    singleActionContract: report.singleActionContract,
    mobilityIdentity: report.mobilityIdentity,
    preservationBoundary: report.preservationBoundary
  },
  timingCandidates: sharedDashPunchTiming,
  recommendedTimingCandidate: timing.recommendedCandidate,
  impactCandidates,
  recommendedImpactCandidate: 'I2',
  rootMotionContract: {
    owner: 'simulation',
    startTick: 4,
    endTick: 15,
    velocityPerTick: 9.2,
    rendererDrivesGameplay: false,
    authoredException: null
  },
  combatCandidate: {
    runtimeAttackId: 'legacy_ascend_step',
    damage: 62,
    hitstop: 7,
    hitstun: 30,
    blockstun: 17,
    knockbackX: 5.2,
    knockbackY: -5,
    level: 'mid',
    knockdown: 'soft',
    approval: null
  },
  transitionMatrix: ['idle_to_ascend_step', 'walk_forward_to_ascend_step', 'walk_backward_to_ascend_step', 'crouch_to_ascend_step', 'ascend_step_to_idle', 'ascend_step_to_walk'],
  rejectedCandidate: { path: repoRelative(rejectionPath), sha256: sha256(rejectionPath), decision: 'REJECTED_FOR_MOTION_REVISION' },
  unsupported: { counterHit: 'CANDIDATE_METADATA_ONLY_NOT_ENABLED' },
  humanApproval: { motion: null, timing: null, combatProfile: null, transitions: null, adultProportions: null }
};

const lightClosure = clone(ascendStepClosure);
lightClosure.status = reviewStatus;
lightClosure.timingCandidates = lightTiming.candidates;
lightClosure.recommendedTimingCandidate = lightTiming.recommendedCandidate;
lightClosure.v1.historicalDurationTicks = lightTiming.v1Historical.durationTicks;
lightClosure.v1.reconstructedExposureTicks = lightTiming.v1Historical.exposureTicks;
lightClosure.v1.exposureEvidence = lightTiming.v1Historical.exposureEvidence;
lightClosure.v1.exactContactTick = lightTiming.v1Historical.contactTick;
lightClosure.v1.note = `${lightTiming.v1Historical.note} The Light variant reuses the family motion at a shorter deterministic travel and lower combat reward.`;
lightClosure.v2.mobilityIdentity = { ...lightClosure.v2.mobilityIdentity, primaryRead: 'quick_short_range_movement_dash_with_single_punch_end_beat', variation: 'light' };
lightClosure.rootMotionContract = { owner: 'simulation', startTick: 2, endTick: 7, velocityPerTick: 8.3, rendererDrivesGameplay: false, authoredException: null };
lightClosure.combatCandidate = { runtimeAttackId: 'legacy_ascend_step_light', damage: 32, hitstop: 5, hitstun: 22, blockstun: 12, knockbackX: 3.5, knockbackY: 0, level: 'mid', knockdown: 'none', approval: null };

const mediumImpactCandidates = {
  I1: { label: 'CLEAN_SLIDE_4_LAUNCHER_7', hitstopTicks: 7, contactExposureDelta: 0, recoilExposureDelta: 0, recoveryExposureDelta: 0 },
  I2: { label: 'READABLE_SLIDE_5_LAUNCHER_8', hitstopTicks: 8, contactExposureDelta: 0, recoilExposureDelta: 0, recoveryExposureDelta: 0 },
  I3: { label: 'WEIGHTED_SLIDE_6_LAUNCHER_9', hitstopTicks: 9, contactExposureDelta: 1, recoilExposureDelta: 1, recoveryExposureDelta: -2 }
};
const mediumClosure = {
  schemaVersion: '1.0.0', status: reviewStatus, candidateOnly: true, deployable: false,
  rendererAuthoritative: false, simulationAuthoritative: true, simulationHz: 60,
  identityLock: {
    matureAdultProportions: mediumReport.identityLock.matureAdultProportions,
    noChibiProportions: mediumReport.identityLock.noChibiProportions,
    boxedBeardAndMustache: mediumReport.identityLock.boxedBeardAndMustache,
    longBlackLocs: mediumReport.identityLock.longBlackLocs,
    noPurpleOutline: mediumReport.identityLock.noPurpleOutline,
    sameSequenceScale: mediumReport.identityLock.sameSequenceScale,
    compactFramesUsePoseCompressionNotPerFrameScale: true,
    approvedRuntimeBodyFramesOnly: false,
    approvedRuntimeConnectorFrames: true,
    boundedMissingStateSourceFrames: mediumReport.identityLock.authoredMissingStateSourceFrames,
    rigidRotationOnlyForConnectorFrames: true,
    generatedAvatarPixels: true,
    authoredMissingStateScale: mediumReport.identityLock.authoredMissingStateScale,
    internalVisualAudit: mediumReport.validation.adultProportionVisualAudit,
    directionReceipt: { path: repoRelative(mediumDirectionPath), sha256: sha256(mediumDirectionPath) },
    humanApproval: null
  },
  hashLock: { path: repoRelative(mediumHashLockPath), sha256: sha256(mediumHashLockPath) },
  normalizationReport: { path: repoRelative(mediumReportPath), sha256: sha256(mediumReportPath) },
  reviewOutputs: mediumReviewOutputs,
  styleApproval: { path: repoRelative(styleApprovalPath), sha256: sha256(styleApprovalPath), decision: styleApproval.decision },
  priorGateApproval: { path: repoRelative(throwApprovalPath), sha256: sha256(throwApprovalPath), decisions: throwApproval.decisions },
  v1: {
    sourceFrameCount: 7,
    historicalDurationTicks: timing.v1Historical.durationTicks,
    reconstructedExposureTicks: timing.v1Historical.exposureTicks,
    exposureEvidence: timing.v1Historical.exposureEvidence,
    root: { x: 224, y: 382 },
    visibleBounds: v1VisibleBounds,
    bodyCenters: v1BodyCenters,
    contactFrame: 3,
    exactContactTick: timing.v1Historical.contactTick,
    note: `${timing.v1Historical.note} The protected V1 source remains unchanged; this Medium-specific V2 redesign follows later live human direction.`
  },
  v2: {
    canvas: mediumReport.normalization.canvas,
    root: mediumReport.normalization.normalizedSourceAnchor,
    rootPath: mediumReport.normalization.authoredWorldRootPath,
    authoredWorldRootPath: mediumReport.normalization.authoredWorldRootPath,
    frames: mediumPublicFrames,
    contactFrame: mediumReport.contactFrames[1],
    contactFrames: mediumReport.contactFrames,
    contactPresentation: {
      publicPath: mediumPublicFrames[mediumReport.contactFrames[1]].publicPath,
      sha256: mediumPublicFrames[mediumReport.contactFrames[1]].sha256,
      bodyOnlyOnWhiff: true,
      bodyOnlyForAllOutcomes: true,
      vfxEnabled: false,
      classification: 'slide_aura_in_body_presentation_two_distinct_body_contacts_generic_contact_sparks_runtime_owned',
      allowedOutcomes: ['hit', 'block', 'whiff'],
      separationStatus: 'SLIDE_AURA_PRESERVED_SEPARATE_CONTACT_SPARKS_RUNTIME_OWNED'
    },
    singleSequenceScale: mediumReport.normalization.sequenceWideScale,
    perFrameRescale: false,
    visualRecentering: false,
    placementPolicy: mediumReport.normalization.placementPolicy,
    visibleImpactCount: 2,
    gameplayHitCount: 2,
    singleActionContract: {
      oneContinuousPhysicalAction: true,
      oneContinuousComboAction: true,
      groundedDashForward: true,
      strikingLimb: 'one_rising_heel',
      strikingLimbContinuity: mediumReport.actionContract.strikingLimbContinuity,
      clearStrikingLegCount: mediumReport.actionContract.clearStrikingLegCount,
      counterbalanceLegBent: mediumReport.actionContract.counterbalanceLegBent,
      postContactBodyShape: mediumReport.actionContract.postContactBodyShape,
      punchOnly: false,
      contactFrame: mediumReport.contactFrames[1],
      contactFrames: mediumReport.contactFrames,
      visibleImpactCount: 2,
      gameplayHitCount: 2,
      firstBeat: mediumReport.actionContract.firstBeat,
      secondBeat: mediumReport.actionContract.secondBeat,
      victimTeleport: false,
      poseProgression: mediumReport.actionContract.poseProgression
    },
    mobilityIdentity: {
      primaryRead: mediumReport.mobilityIdentity.primaryRead,
      dashAura: true,
      auraPalette: mediumReport.mobilityIdentity.auraPalette,
      auraFrames: mediumReport.mobilityIdentity.auraFrames,
      strongestAuraFrame: 2,
      impactExplosion: false,
      afterimageBodyClone: false,
      worldTravelOwner: mediumReport.mobilityIdentity.worldTravelOwner
    },
    preservationBoundary: {
      protectedLegacyFramesModified: false,
      approvedV2Disposition: 'MODERNIZE',
      retainedLegacyQualities: ['forward-loaded momentum', 'low dash energy', 'coat and loc drag', 'connected recovery direction'],
      newV2Authorship: ['slide-retraction-to-handspring coil', 'backward two-hand floor reach', 'traveling low slide kick', 'two-hand floor plant', 'hips-over-shoulders back-handspring arc', 'asymmetric single rising-heel launcher', 'authored post-contact leg gather', 'two-foot landing approach'],
      explicitRootMotionOwner: 'deterministic simulation legacy_ascend_step rootMotionSegments: forward slide ticks 2-11, backward redirection ticks 12-33'
    }
  },
  timingCandidates: timing.candidates,
  recommendedTimingCandidate: 'B',
  impactCandidates: mediumImpactCandidates,
  recommendedImpactCandidate: 'I2',
  rootMotionContract: {
    owner: 'simulation',
    segments: [
      { role: 'forward_slide', startTick: 2, endTick: 11, velocityPerTick: 9 },
      { role: 'compression_redirect', startTick: 12, endTick: 16, velocityPerTick: -2 },
      { role: 'handspring_pivot', startTick: 17, endTick: 26, velocityPerTick: -1.4 },
      { role: 'exit_rotation_to_landing', startTick: 27, endTick: 33, velocityPerTick: -1 }
    ],
    rendererDrivesGameplay: false,
    authoredException: 'deliberate_direction_change_recycles_slide_momentum_into_backward_handspring'
  },
  combatCandidate: {
    runtimeAttackId: 'legacy_ascend_step',
    damage: 70,
    expectedScaledRouteDamage: 66,
    hitstop: 8,
    hitstun: 34,
    blockstun: 18,
    knockbackX: 2.8,
    knockbackY: -15.5,
    level: 'launcher',
    knockdown: 'none',
    launches: true,
    hitboxes: [
      { id: 'legacy_ascend_step_medium_slide', start: 7, end: 9, damage: 26, hitstop: 5, hitstun: 28, blockstun: 16, knockbackX: 1, knockbackY: 0, level: 'low', launches: false },
      { id: 'legacy_ascend_step_medium_backspring_launcher', start: 26, end: 28, damage: 44, hitstop: 8, hitstun: 34, blockstun: 18, knockbackX: 3.4, knockbackY: -15.5, level: 'launcher', launches: true }
    ],
    approval: null
  },
  transitionMatrix: ['idle_to_ascend_step_medium', 'walk_forward_to_ascend_step_medium', 'walk_backward_to_ascend_step_medium', 'crouch_to_ascend_step_medium', 'ascend_step_medium_to_idle', 'ascend_step_medium_to_walk'],
  rejectedCandidate: { path: repoRelative(rejectionPath), sha256: sha256(rejectionPath), decision: 'REJECTED_FOR_MOTION_REVISION', supersededForMediumByLaterLiveDirection: true },
  unsupported: { counterHit: 'CANDIDATE_METADATA_ONLY_NOT_ENABLED' },
  humanApproval: { motion: null, timing: null, combatProfile: null, transitions: null, adultProportions: null }
};

const heavyImpactCandidates = {
  I1: { label: 'CLEAN_8', hitstopTicks: 8, contactExposureDelta: 0, recoilExposureDelta: 0, recoveryExposureDelta: 0 },
  I2: { label: 'READABLE_9', hitstopTicks: 9, contactExposureDelta: 0, recoilExposureDelta: 0, recoveryExposureDelta: 0 },
  I3: { label: 'WEIGHTED_10', hitstopTicks: 10, contactExposureDelta: 0, recoilExposureDelta: 1, recoveryExposureDelta: -1 }
};
const heavyClosure = {
  schemaVersion: '1.0.0', status: reviewStatus, candidateOnly: true, deployable: false,
  rendererAuthoritative: false, simulationAuthoritative: true, simulationHz: 60,
  identityLock: {
    matureAdultProportions: heavyReport.identityLock.matureAdultProportions,
    noChibiProportions: heavyReport.identityLock.noChibiProportions,
    boxedBeardAndMustache: heavyReport.identityLock.beardAndMustache,
    longBlackLocs: heavyReport.identityLock.longBlackLocs,
    noPurpleOutline: heavyReport.identityLock.noPurpleOutline,
    sameSequenceScale: heavyReport.identityLock.sameSequenceScale,
    compactFramesUsePoseCompressionNotPerFrameScale: true,
    internalVisualAudit: heavyReport.validation.adultProportionVisualAudit,
    directionReceipt: { path: repoRelative(adultDirectionPath), sha256: sha256(adultDirectionPath) },
    humanApproval: null
  },
  hashLock: { path: repoRelative(heavyHashLockPath), sha256: sha256(heavyHashLockPath) },
  normalizationReport: { path: repoRelative(heavyReportPath), sha256: sha256(heavyReportPath) },
  styleApproval: { path: repoRelative(styleApprovalPath), sha256: sha256(styleApprovalPath), decision: styleApproval.decision },
  priorGateApproval: { path: repoRelative(throwApprovalPath), sha256: sha256(throwApprovalPath), decisions: throwApproval.decisions },
  v1: {
    sourceFrameCount: 0, historicalDurationTicks: 0, reconstructedExposureTicks: [], exposureEvidence: 'No V1 Heavy variant exists.',
    root: { x: 224, y: 382 }, visibleBounds: [], bodyCenters: [], contactFrame: null, exactContactTick: null,
    note: 'New V2 missing-state authoring. This Heavy variation does not overwrite or make claims about the protected V1 Ascend Step source.'
  },
  v2: {
    canvas: heavyReport.normalization.canvas,
    root: heavyReport.normalization.normalizedRoot,
    rootPath: heavyPublicFrames.map(() => heavyReport.normalization.normalizedRoot),
    frames: heavyPublicFrames,
    contactFrame: heavyReport.contactFrame,
    contactPresentation: {
      publicPath: heavyPublicFrames[heavyReport.contactFrame].publicPath,
      sha256: heavyPublicFrames[heavyReport.contactFrame].sha256,
      bodyOnlyOnWhiff: true,
      vfxEnabled: false,
      classification: 'brief_pause_then_growing_energy_ball_into_one_complete_rear_blast_present_on_hit_block_or_whiff',
      allowedOutcomes: ['hit', 'block', 'whiff'],
      separationStatus: 'MOVEMENT_AURA_TELEPORT_STREAK_AND_BLAST_BAKED_INTO_CANDIDATE_SEPARATE_CONTACT_SPARK_DEFERRED'
    },
    singleSequenceScale: heavyReport.normalization.sequenceWideScale,
    perFrameRescale: false,
    visualRecentering: false,
    placementPolicy: heavyReport.normalization.placementPolicy,
    visibleImpactCount: 1,
    gameplayHitCount: 1,
    singleActionContract: {
      oneContinuousPhysicalAction: true, groundedDashForward: true, strikingLimb: 'blast_hand', punchOnly: false,
      contactFrame: heavyReport.contactFrame, visibleImpactCount: 1, gameplayHitCount: 1,
      risingStrikeRemoved: true, airborneFollowupRemoved: true, secondStrikeRemoved: true,
      poseProgression: heavyReport.actionContract.poseProgression
    },
    mobilityIdentity: {
      primaryRead: heavyReport.mobilityIdentity.primaryRead, dashAura: true,
      auraPalette: heavyReport.mobilityIdentity.auraPalette, auraFrames: [1, 2, 3], strongestAuraFrame: 1,
      impactExplosion: false, afterimageBodyClone: false, worldTravelOwner: heavyReport.mobilityIdentity.worldTravelOwner
    },
    targetSideSwitchContract: {
      owner: 'simulation', triggerTick: 14, captureRange: 150, behindDistance: 62, verticalTolerance: 110,
      requireTargetAhead: true, faceTargetAfterSwitch: true, victimTranslated: false, cornerFallback: 'no_switch_when_legal_behind_space_is_unavailable'
    },
    chargeReadability: heavyReport.chargeReadability,
    preservationBoundary: {
      protectedLegacyFramesModified: false, sourceOrderPreserved: null, sourceOrderApplicable: false, approvedV2Disposition: 'MODERNIZE',
      retainedLegacyQualities: ['forward-loaded momentum', 'low dash energy', 'coat and loc drag', 'grounded recovery direction'],
      retiredLegacyBeats: ['rising palm contact', 'airborne palm follow-through', 'extended airborne second strike'],
      explicitRootMotionOwner: 'deterministic simulation legacy_ascend_step_heavy rootMotion ticks 4-11; target-relative side switch tick 14'
    }
  },
  timingCandidates: heavyTiming.candidates,
  recommendedTimingCandidate: 'B',
  impactCandidates: heavyImpactCandidates,
  recommendedImpactCandidate: 'I2',
  rootMotionContract: { owner: 'simulation', startTick: 4, endTick: 11, velocityPerTick: 10.5, rendererDrivesGameplay: false, authoredException: null },
  targetSideSwitchContract: { triggerTick: 14, captureRange: 150, behindDistance: 62, verticalTolerance: 110, victimTranslated: false },
  combatCandidate: { runtimeAttackId: 'legacy_ascend_step_heavy', damage: 84, hitstop: 9, hitstun: 36, blockstun: 20, knockbackX: 7.5, knockbackY: -2, level: 'mid', knockdown: 'soft', approval: null },
  transitionMatrix: ['idle_to_ascend_step_heavy', 'walk_forward_to_ascend_step_heavy', 'walk_backward_to_ascend_step_heavy', 'crouch_to_ascend_step_heavy', 'ascend_step_heavy_to_idle', 'ascend_step_heavy_to_walk'],
  unsupported: { counterHit: 'CANDIDATE_METADATA_ONLY_NOT_ENABLED' },
  humanApproval: { motion: null, timing: null, combatProfile: null, transitions: null, adultProportions: null, targetSideSwitch: null }
};

writeJson(path.join(moveRoot, 'visual-modernization.candidate.v2.json'), {
  schemaVersion: '1.0.0',
  id: 'lamuh_legacy_v2_ascend_step_single_dash_punch_candidate_v2',
  promotionState: 'candidate',
  candidateOnly: true,
  deployable: false,
  productionApproved: false,
  v1Disposition: 'MODERNIZE',
  supersedesRejectedCandidate: ascendStepClosure.rejectedCandidate,
  hashLock: ascendStepClosure.hashLock,
  normalizationReport: ascendStepClosure.normalizationReport,
  frames: publicFrames.map((frame) => ({ index: frame.index, role: frame.role, sourceV1Indices: frame.sourceV1Indices, sourceUri: `repo://${report.frames[frame.index].normalizedPath}`, sha256: frame.sha256, root: frame.root, visibleBounds: frame.visibleBounds })),
  timingCandidates: sharedDashPunchTiming,
  recommendedTimingCandidate: timing.recommendedCandidate,
  impactCandidates,
  rootMotionContract: ascendStepClosure.rootMotionContract,
  combatCandidate: ascendStepClosure.combatCandidate,
  singleActionContract: report.singleActionContract,
  mobilityIdentity: report.mobilityIdentity,
  preservationBoundary: report.preservationBoundary,
  approvalStatus: reviewStatus,
  identityLock: ascendStepClosure.identityLock,
  humanApproval: ascendStepClosure.humanApproval
});

writeJson(path.join(moveRoot, 'visual-modernization.medium-targeted-motion-repair.candidate.v3.json'), {
  schemaVersion: '1.0.0',
  id: 'lamuh_legacy_v2_ascend_step_medium_targeted_motion_repair_candidate_v3',
  promotionState: 'candidate',
  candidateOnly: true,
  deployable: false,
  productionApproved: false,
  v1Disposition: 'MODERNIZE',
  supersedesForMediumOnly: {
    priorCandidate: 'visual-modernization.candidate.v2.json',
    directionReceipt: mediumClosure.identityLock.directionReceipt
  },
  hashLock: mediumClosure.hashLock,
  normalizationReport: mediumClosure.normalizationReport,
  reviewOutputs: mediumClosure.reviewOutputs,
  frames: mediumPublicFrames.map((frame) => ({
    index: frame.index,
    role: frame.role,
    sourceUri: `repo://${mediumReport.frames[frame.index].normalizedPath}`,
    approvedIdentityBodyUri: `repo://${mediumReport.frames[frame.index].identityBodyPath}`,
    sha256: frame.sha256,
    root: frame.root,
    visibleBounds: frame.visibleBounds,
    rigidBodyTransform: frame.rigidBodyTransform,
    contact: frame.contact
  })),
  timingCandidates: timing.candidates,
  recommendedTimingCandidate: 'B',
  impactCandidates: mediumImpactCandidates,
  rootMotionContract: mediumClosure.rootMotionContract,
  combatCandidate: mediumClosure.combatCandidate,
  singleActionContract: mediumClosure.v2.singleActionContract,
  mobilityIdentity: mediumClosure.v2.mobilityIdentity,
  approvalStatus: reviewStatus,
  identityLock: mediumClosure.identityLock,
  humanApproval: mediumClosure.humanApproval
});

writeJson(path.join(moveRoot, 'visual-modernization.light.candidate.v1.json'), {
  schemaVersion: '1.0.0', id: 'lamuh_legacy_v2_ascend_step_light_candidate_v1', promotionState: 'candidate',
  candidateOnly: true, deployable: false, productionApproved: false, v1Disposition: 'MODERNIZE',
  sharedVisualSource: ascendStepClosure.hashLock, frames: publicFrames, timingCandidates: lightTiming.candidates,
  recommendedTimingCandidate: 'B', rootMotionContract: lightClosure.rootMotionContract,
  combatCandidate: lightClosure.combatCandidate, mobilityIdentity: lightClosure.v2.mobilityIdentity,
  approvalStatus: reviewStatus, humanApproval: lightClosure.humanApproval
});

writeJson(path.join(moveRoot, 'visual-modernization.heavy.candidate.v1.json'), {
  schemaVersion: '1.0.0', id: 'lamuh_legacy_v2_ascend_step_heavy_candidate_v1', promotionState: 'candidate',
  candidateOnly: true, deployable: false, productionApproved: false, v1Disposition: 'NEW_V2_VARIATION',
  hashLock: heavyClosure.hashLock, normalizationReport: heavyClosure.normalizationReport,
  frames: heavyPublicFrames.map((frame) => ({ index: frame.index, role: frame.role, sourceUri: `repo://${heavyReport.frames[frame.index].normalizedPath}`, sha256: frame.sha256, root: frame.root, visibleBounds: frame.visibleBounds })),
  timingCandidates: heavyTiming.candidates, recommendedTimingCandidate: 'B', impactCandidates: heavyImpactCandidates,
  rootMotionContract: heavyClosure.rootMotionContract, targetSideSwitchContract: heavyClosure.targetSideSwitchContract,
  combatCandidate: heavyClosure.combatCandidate, singleActionContract: heavyClosure.v2.singleActionContract,
  mobilityIdentity: heavyClosure.v2.mobilityIdentity, chargeReadability: heavyClosure.v2.chargeReadability, approvalStatus: reviewStatus,
  identityLock: heavyClosure.identityLock, humanApproval: heavyClosure.humanApproval
});

const auditEntry = sourceAudit.animations.find((entry) => entry.animationName === 'ascend_step');
if (!auditEntry) throw new Error('Ascend Step source audit entry is missing');
auditEntry.v2Disposition = 'MODERNIZE';
auditEntry.needsV2Redesign = true;
auditEntry.reviewNotes = 'All seven V1 poses remain hash-locked and unmodified. Ascend Step Light keeps the short one-hit dash-punch. The targeted Medium repair preserves the approved slide-to-handspring concept while replacing its fixed-root and symmetrical-gymnastics read: the slide now has deliberate simulation-owned travel, a distinct retraction/coil, a two-hand floor plant, hips-over-shoulders rotation, one asymmetric rising-heel launcher contact with the other leg bent for counterbalance, authored post-contact leg gathering, and a controlled landing. Heavy keeps its approach, deterministic behind-side switch, pause, growing energy ball, and one rear blast. Motion, timing, transitions, and combat profile still await human review.';
sourceAudit.globalFindings = sourceAudit.globalFindings.filter((item) => !item.startsWith('Ascend Step is the first special review gate:'));
const finding = 'Ascend Step is the first special-family review gate: Light is the short cyan/gold one-hit dash-punch; Medium is a two-contact traveling low slide kick whose root redirects backward through a readable coil into a two-hand floor-planted back-handspring and one asymmetric rising-heel launcher, then a distinct tuck and controlled landing; Heavy approaches, performs one deterministic target-relative side switch without moving the victim, pauses while a palm energy ball visibly grows, then fires one complete rear blast. The V1 source and superseded Medium variants remain protected history.';
if (!sourceAudit.globalFindings.includes(finding)) sourceAudit.globalFindings.push(finding);
writeJson(sourceAuditPath, sourceAudit);

firstPlayable.technicalStatus = 'FIRST_PLAYABLE_THROW_FAMILY_APPROVED_ASCEND_STEP_MEDIUM_TARGETED_MOTION_REPAIR_CANDIDATE';
firstPlayable.humanReviewStatus = reviewStatus;
firstPlayable.knownArtDebt = firstPlayable.knownArtDebt.filter((item) => !item.includes('Ascend Step'));
firstPlayable.knownArtDebt.push('Ascend Step Medium targeted motion repair is hash-locked but awaits 1x motion, deliberate root-path, slide-to-coil continuity, hand-plant, asymmetric rising-heel launcher, landing, timing, transition, adult-proportion, two-hit readability, and combat-profile human decisions; Light and Heavy remain unchanged candidate variants');
firstPlayable.currentReviewGate = {
  ...(firstPlayable.currentReviewGate || {}),
  status: reviewStatus,
  focusDecisions: ['ascend_step_medium_targeted_motion_repair', 'ascend_step_medium_deliberate_root_path', 'ascend_step_medium_slide_retraction_coil', 'ascend_step_medium_two_hand_floor_plant', 'ascend_step_medium_asymmetric_rising_heel', 'ascend_step_medium_controlled_landing', 'ascend_step_medium_adult_proportions', 'ascend_step_medium_two_hit_readability', 'ascend_step_medium_timing', 'ascend_step_medium_transition', 'ascend_step_medium_launcher_combat_profile'],
  requiredDecisions: [...new Set((firstPlayable.currentReviewGate?.requiredDecisions || []).filter((decision) => !['standard_grab', 'forward_throw', 'back_throw'].includes(decision)))],
  comparisonRoute: '/lamuh-v1-v2-review.html',
  sandboxRoute: '/lamuh-legacy-sandbox.html',
  stopBoundary: 'human_review_required_before_next_special_family_or_candidate_promotion',
  rejectedCandidate: ascendStepClosure.rejectedCandidate,
  activeMotionContract: 'light_short_dash_punch_medium_traveling_low_slide_retraction_coil_deliberate_backward_root_redirect_two_hand_floor_plant_asymmetric_single_rising_heel_launcher_authored_tuck_controlled_landing_heavy_approach_target_relative_behind_switch_pause_growing_ball_one_rear_blast'
};
writeJson(firstPlayablePath, firstPlayable);

closurePending.humanReviewStatus = reviewStatus;
closurePending.status = 'candidate-only';
closurePending.deployable = false;
closurePending.productionApproved = false;
closurePending.firstPlayable.standardGrab = throwApproval.decisions.standardGrab;
closurePending.firstPlayable.forwardThrow = throwApproval.decisions.forwardThrow;
closurePending.firstPlayable.backThrow = throwApproval.decisions.backThrow;
closurePending.currentReviewFocus = firstPlayable.currentReviewGate;
closurePending.stopBoundary = 'Do not start the next special family or promote this candidate until the targeted Ascend Step Medium motion-repair human review is resolved at 1x speed.';
const ascendQueue = {
  section: 'E',
  subject: 'Ascend Step Medium targeted slide-to-handspring motion repair',
  independentDecisions: {
    motion: ['APPROVED_WITH_TARGETED_REPAIR', 'APPROVED_FOR_CURRENT_PRODUCTION_BASELINE_WITH_POLISH_DEBT', 'REJECTED_FOR_MOTION_REVISION'],
    timing: ['TIMING_A_V1_RHYTHM', 'TIMING_B_RECOMMENDED_READABILITY', 'TIMING_C_HEAVIER_ALTERNATE'],
    transitions: ['APPROVED_V1_MOTION_PRESERVED', 'APPROVED_WITH_TARGETED_REPAIR', 'REJECTED_FOR_MOTION_REVISION'],
    combatProfile: ['APPROVED_V2_COMBAT_PROFILE', 'APPROVED_WITH_TARGETED_REPAIR', 'REJECTED_FOR_COMBAT_REDESIGN']
  },
  actionContract: 'medium_one_traveling_low_slide_kick_contact_then_slide_retraction_to_handspring_coil_then_full_two_hand_floor_plant_and_hips_over_shoulders_rotation_into_one_asymmetric_single_rising_heel_launcher_contact_with_bent_counterbalance_leg_then_authored_post_contact_tuck_and_controlled_landing; simulation_owned_root_travels_forward_then_redirects_backward; light_and_heavy_unchanged',
  rejectedPriorCandidate: ascendStepClosure.rejectedCandidate
};
closurePending.decisionQueue = [...closurePending.decisionQueue.filter((entry) => entry.section !== 'E'), ascendQueue];
writeJson(closurePendingPath, closurePending);

reviewData.ascendStepClosure = mediumClosure;
reviewData.ascendStepFamily = {
  schemaVersion: '1.0.0', status: reviewStatus, candidateOnly: true, deployable: false,
  variants: { light: lightClosure, medium: mediumClosure, heavy: heavyClosure },
  inputs: { light: '6S+L', medium: '6S+M', heavy: '6S+H' },
  differentiation: {
    light: 'shortest travel, fastest recovery, lowest damage, no knockdown',
    medium: 'traveling low slide kick, authored retraction/coil, full two-hand floor-planted back-handspring, one asymmetric rising-heel launcher with bent counterbalance leg, authored post-contact tuck, controlled landing, two readable contacts, deliberate simulation-owned root path',
    heavy: 'approach dash, deterministic behind-target side switch, brief pause, growing energy ball, one rear blast, longest commitment'
  },
  humanApproval: { family: null, light: null, medium: null, heavy: null, heavyTargetSideSwitch: null }
};
reviewData.runtimeTimelines.ascend_step_light = { exposureTicks: lightTiming.candidates.B.exposureTicks, durationTicks: lightTiming.candidates.B.durationTicks, contactSourceFrames: [report.contactFrame], contactTick: lightTiming.candidates.B.exposureTicks.slice(0, report.contactFrame).reduce((sum, value) => sum + value, 0) };
reviewData.runtimeTimelines.ascend_step = { exposureTicks: timing.candidates.B.exposureTicks, durationTicks: timing.candidates.B.durationTicks, contactSourceFrames: mediumReport.contactFrames, contactTicks: mediumReport.contactFrames.map((frame) => timing.candidates.B.exposureTicks.slice(0, frame).reduce((sum, value) => sum + value, 0)), contactTick: timing.candidates.B.exposureTicks.slice(0, mediumReport.contactFrames[0]).reduce((sum, value) => sum + value, 0) };
reviewData.runtimeTimelines.ascend_step_heavy = { exposureTicks: heavyTiming.candidates.B.exposureTicks, durationTicks: heavyTiming.candidates.B.durationTicks, contactSourceFrames: [heavyReport.contactFrame], contactTick: heavyTiming.candidates.B.exposureTicks.slice(0, heavyReport.contactFrame).reduce((sum, value) => sum + value, 0) };
reviewData.firstPlayable = firstPlayable;
reviewData.sourceAudit = sourceAudit;
reviewData.humanReviewStatus = reviewStatus;
reviewData.candidateOnly = true;
reviewData.deployable = false;
reviewData.authority = { renderingAuthoritative: false, simulationAuthoritative: true, candidateOnly: true, deployable: false };
writeJson(reviewDataPath, reviewData);

console.log('Built Lamuh Ascend Step L/M/H V2 review family with the revised two-contact Medium slide/back-handspring launcher while preserving the Light dash-punch and Heavy behind-switch blast.');
