const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

const engineRoot = path.resolve(__dirname, '..');
const repoRoot = path.resolve(engineRoot, '..', '..');
const contentRoot = path.join(engineRoot, 'content-source', 'characters', 'lamuh-legacy-v2');
const reviewRoot = path.join(repoRoot, 'tools', 'nga-forge', 'review', 'lamuh-legacy-v2-crouch-jump-modernization-v1');
const reportPath = path.join(reviewRoot, 'normalization.report.json');
const reviewDataPath = path.join(engineRoot, 'public', 'lamuh-legacy-v2', 'review-data.json');
const firstPlayablePath = path.join(contentRoot, 'first-playable.bundle.json');
const sourceAuditPath = path.join(contentRoot, 'source-audit.v1.json');
const characterBundlePath = path.join(contentRoot, 'character.bundle.json');
const closurePendingPath = path.join(contentRoot, 'records', 'first-playable-closure.pending.json');
const styleApprovalPath = path.join(contentRoot, 'records', 'style-checkpoint-v1.approval.json');
const hashLockPath = path.join(contentRoot, 'records', 'crouch-jump-modernization-v1.hash-lock.json');
const candidateSourceRoot = path.join(contentRoot, 'source-frames', 'candidates', 'crouch-jump-modernization-v1');
const publicRoot = path.join(engineRoot, 'public', 'lamuh-legacy-v2', 'movement-v2');

const readJson = (filename) => JSON.parse(fs.readFileSync(filename, 'utf8').replace(/^\uFEFF/, ''));
const writeJson = (filename, value) => {
  fs.mkdirSync(path.dirname(filename), { recursive: true });
  fs.writeFileSync(filename, `${JSON.stringify(value, null, 2)}\n`, 'utf8');
};
const sha256 = (filename) => crypto.createHash('sha256').update(fs.readFileSync(filename)).digest('hex').toUpperCase();
const repoRelative = (filename) => path.relative(repoRoot, filename).replaceAll('\\', '/');
const publicPathFor = (filename) => `/${path.relative(path.join(engineRoot, 'public'), filename).replaceAll('\\', '/')}`;

const activeGoalBranch = 'codex/lamuh-legacy-v2-rebuild-v1';
const currentHumanReviewStatus = 'awaiting_human_crouch_jump_standard_grab_forward_throw_back_throw_and_combined_movement_review';

for (const filename of [reportPath, reviewDataPath, firstPlayablePath, sourceAuditPath, characterBundlePath, closurePendingPath, styleApprovalPath]) {
  if (!fs.existsSync(filename)) throw new Error(`Missing crouch/jump modernization prerequisite: ${filename}`);
}

const report = readJson(reportPath);
const reviewData = readJson(reviewDataPath);
const firstPlayable = readJson(firstPlayablePath);
const sourceAudit = readJson(sourceAuditPath);
const characterBundle = readJson(characterBundlePath);
const closurePending = readJson(closurePendingPath);
const styleApproval = readJson(styleApprovalPath);
if (report.status !== 'candidate-only' || report.deployable !== false || report.authoredFrameCount !== 13) throw new Error('Crouch/jump promotion boundary failed');
if (styleApproval.decision !== 'APPROVED_WITH_TARGETED_REPAIR' || styleApproval.approvalBoundary.deployable !== false) throw new Error('Lamuh style-checkpoint boundary failed');
if (report.normalization.perFrameRendererScale !== false || report.normalization.visualRecentering !== false) throw new Error('Crouch/jump fixed-scale contract failed');
if (report.visualValidation.meaningfulMagentaPixelsRemaining !== 0 || report.visualValidation.edgeTouches !== 0) throw new Error('Crouch/jump visual cleanup failed');
if (report.frames.some((frame) => frame.touchesEdge || frame.meaningfulMagentaPixelsRemaining !== 0)) throw new Error('Crouch/jump frame validation failed');
if (new Set(report.frames.map((frame) => frame.normalizedSha256)).size !== 13) throw new Error('Crouch/jump frames contain an undeclared duplicate');
if (characterBundle.animationPackages.length !== 24) throw new Error('Lamuh first-playable Forge package count drifted');
if (characterBundle.promotionState !== 'candidate') throw new Error('Lamuh first-playable bundle crossed the candidate boundary');

for (const [stateId, expectedCount] of [['crouch', 6], ['jump', 7]]) {
  const state = report.states[stateId];
  if (!state || state.authoredFrameCount !== expectedCount || state.exposureTicks.length !== expectedCount) throw new Error(`${stateId} coverage mismatch`);
  if (state.exposureTicks.reduce((sum, ticks) => sum + ticks, 0) !== state.durationTicks) throw new Error(`${stateId} exposure coverage mismatch`);
}

fs.mkdirSync(publicRoot, { recursive: true });
const states = {};
for (const stateId of ['crouch', 'jump']) {
  const stateReport = report.states[stateId];
  const frames = report.frames.filter((frame) => frame.state === stateId).sort((a, b) => a.index - b.index).map((frame) => {
    const legacy = path.join(repoRoot, frame.legacyPath);
    const source = path.join(repoRoot, frame.sourcePath);
    const normalized = path.join(repoRoot, frame.normalizedPath);
    if (!fs.existsSync(legacy) || sha256(legacy) !== frame.legacySha256) throw new Error(`Protected V1 ${stateId} frame changed: ${frame.legacyIndex}`);
    if (!fs.existsSync(source) || sha256(source) !== frame.sourceSha256) throw new Error(`${stateId} extracted source frame changed: ${frame.index}`);
    if (!fs.existsSync(normalized) || sha256(normalized) !== frame.normalizedSha256) throw new Error(`${stateId} normalized frame changed: ${frame.index}`);

    const sourceDestination = path.join(candidateSourceRoot, stateId, path.basename(source));
    fs.mkdirSync(path.dirname(sourceDestination), { recursive: true });
    fs.copyFileSync(source, sourceDestination);
    if (sha256(sourceDestination) !== frame.sourceSha256) throw new Error(`${stateId} candidate source copy mismatch: ${frame.index}`);

    const publicDestination = path.join(publicRoot, `${stateId}-${String(frame.index).padStart(2, '0')}.png`);
    fs.copyFileSync(normalized, publicDestination);
    if (sha256(publicDestination) !== frame.normalizedSha256) throw new Error(`${stateId} public copy mismatch: ${frame.index}`);
    return {
      index: frame.index,
      role: frame.role,
      publicPath: publicPathFor(publicDestination),
      sha256: frame.normalizedSha256,
      sourceSha256: frame.sourceSha256,
      sourceType: 'imagegen_reference_edit',
      bodyScaleCorrection: 1,
      sourceScaleCorrection: frame.sourceScaleCorrection,
      legacySha256: frame.legacySha256,
      legacyIndex: frame.legacyIndex,
      root: frame.normalizedRoot,
      visibleBounds: frame.visibleBounds,
      bodyCenter: frame.bodyCenter
    };
  });
  states[stateId] = {
    sourceFrameCount: stateReport.sourceFrameCount,
    authoredFrameCount: stateReport.authoredFrameCount,
    selectedLegacyFrames: stateReport.selectedLegacyFrames,
    exposureTicks: stateReport.exposureTicks,
    durationTicks: stateReport.durationTicks,
    loop: stateReport.loop,
    frames
  };
}

const contactSheetSource = path.join(repoRoot, report.reviewArtifacts.numberedContactSheet.path);
if (!fs.existsSync(contactSheetSource) || sha256(contactSheetSource) !== report.reviewArtifacts.numberedContactSheet.sha256) throw new Error('Crouch/jump contact sheet hash mismatch');
const contactSheetDestination = path.join(publicRoot, 'crouch-jump-numbered-contact-sheet.png');
fs.copyFileSync(contactSheetSource, contactSheetDestination);

const hashLock = {
  schemaVersion: '1.0.0',
  subject: report.subject,
  status: 'HASH_LOCKED_CANDIDATE_ONLY',
  candidateOnly: true,
  deployable: false,
  legacySourceImmutable: true,
  generationMode: 'OpenAI built-in image generation reference edit mode',
  generationPromptSummary: 'Modern outline-free Lamuh crouch entry/hold/exit and jump anticipation/takeoff/knee-tuck/apex/fall/landing/recovery, using V1 poses as motion reference and modern idle as identity/scale reference.',
  sourceSheets: report.sourceSheets,
  normalizationReport: { path: repoRelative(reportPath), sha256: sha256(reportPath) },
  contactSheet: { path: repoRelative(contactSheetSource), sha256: sha256(contactSheetSource) },
  protectedLegacyFrames: report.frames.map((frame) => ({ state: frame.state, legacyIndex: frame.legacyIndex, path: frame.legacyPath, sha256: frame.legacySha256 })),
  sourceFrames: report.frames.map((frame) => ({ state: frame.state, index: frame.index, path: repoRelative(path.join(candidateSourceRoot, frame.state, path.basename(frame.sourcePath))), sha256: frame.sourceSha256 })),
  normalizedFrames: report.frames.map((frame) => ({ state: frame.state, index: frame.index, path: frame.normalizedPath, sha256: frame.normalizedSha256 })),
  approvalBoundary: {
    crouchMotionApproved: false,
    jumpMotionApproved: false,
    transitionsApproved: false,
    runtimeArtPromotionApproved: false,
    firstPlayableApproved: false,
    productionApproved: false,
    deployable: false
  }
};
writeJson(hashLockPath, hashLock);

const movement = reviewData.movementModernization;
if (!movement || movement.candidateOnly !== true || movement.deployable !== false) throw new Error('Existing movement modernization candidate missing');
movement.status = currentHumanReviewStatus;
movement.states.crouch = states.crouch;
movement.states.jump = states.jump;
movement.crouchJumpModernization = {
  normalizationReport: { path: repoRelative(reportPath), sha256: sha256(reportPath) },
  hashLock: { path: repoRelative(hashLockPath), sha256: sha256(hashLockPath) },
  contactSheetPublicPath: publicPathFor(contactSheetDestination),
  contactSheetSha256: sha256(contactSheetDestination),
  sourceRepairReason: report.sourceRepairReason,
  sourceSheetCameraCorrections: report.normalization.sourceSheetCameraCorrections,
  humanApproval: { crouch: null, jump: null, transitions: null }
};
movement.reviewQuestions = [...new Set([
  ...movement.reviewQuestions,
  'Does crouch preserve the legacy low silhouette while entering and leaving at the same body scale as idle?',
  'Does the jump read as one connected takeoff, knee-tuck, apex, fall, and landing arc without a costume or size jump?',
  'Do jump travel and landing remain simulation-authored while the sprite provides pose progression only?'
])];

for (const [clipId, state] of Object.entries(states)) {
  reviewData.runtimeTimelines[clipId] = { exposureTicks: state.exposureTicks, durationTicks: state.durationTicks, contactSourceFrames: [], contactTick: null };
  const clip = reviewData.comparisonClips.find((entry) => entry.clipId === clipId);
  if (!clip) throw new Error(`Comparison clip missing: ${clipId}`);
  clip.v2Candidate = { label: 'V2_MODERN_STYLE_TRANSITION_COMPLETE_CANDIDATE', durationTicks: state.durationTicks, exposureTicks: state.exposureTicks };
  clip.humanReviewStatus = null;
}

const completedCoverage = new Set(['stand_to_crouch', 'landing_authored']);
sourceAudit.missingV2Coverage = sourceAudit.missingV2Coverage.filter((item) => !completedCoverage.has(item));
if (!sourceAudit.missingV2Coverage.includes('crouch_to_stand')) sourceAudit.missingV2Coverage.push('crouch_to_stand');
sourceAudit.globalFindings = sourceAudit.globalFindings.filter((item) => !item.includes('turn, stand-to-crouch, crouch-to-stand, and landing'));
sourceAudit.globalFindings.push('Modern crouch entry/hold/exit and jump/fall/landing connector art is now authored and hash-locked as a candidate; simulation remains authoritative for travel and landing recovery. The crouch rising connector is comparison-ready but its live crouch-to-stand presentation integration remains targeted debt so neutral responsiveness and checksum state are not silently changed.');
for (const stateId of ['crouch', 'jump']) {
  const audit = sourceAudit.animations.find((entry) => entry.animationName === stateId);
  if (!audit) throw new Error(`Source audit entry missing: ${stateId}`);
  audit.sourceMotionReusable = true;
  audit.visualArtworkReusable = false;
  audit.v2Disposition = 'PRESERVE_WITH_V2_COMBAT_UPDATE';
  audit.needsV2Redesign = false;
  audit.reviewNotes = stateId === 'crouch'
    ? 'Preserve the V1 deep low guarded silhouette; rebuild obsolete purple-outlined art in the modern style and add lowering/rising connectors at one fixed anatomy scale.'
    : 'Preserve the V1 raised-knee airborne silhouette; rebuild obsolete purple-outlined art in the modern style and add anticipation, takeoff, fall, landing, and recovery connectors without sprite-authored world travel.';
}
writeJson(sourceAuditPath, sourceAudit);

firstPlayable.technicalStatus = 'FIRST_PLAYABLE_PLUS_MODERN_CROUCH_JUMP_AND_THROW_REVIEW_CANDIDATE';
firstPlayable.humanReviewStatus = movement.status;
firstPlayable.goalBranch = activeGoalBranch;
firstPlayable.forgePackageCount = characterBundle.animationPackages.length;
firstPlayable.currentReviewGate = {
  status: currentHumanReviewStatus,
  requiredDecisions: ['crouch_motion_and_transition', 'jump_motion_and_transition', 'standard_grab', 'forward_throw', 'back_throw', 'combined_movement_scale_and_flow'],
  comparisonRoute: '/lamuh-v1-v2-review.html',
  sandboxRoute: '/lamuh-legacy-sandbox.html',
  stopBoundary: 'human_review_required_before_candidate_promotion_or_broader_moveset_expansion'
};
firstPlayable.knownArtDebt = firstPlayable.knownArtDebt.filter((item) => !item.includes('turn, stand-to-crouch, crouch-to-stand, and landing') && !item.includes('turn art remains unauthored'));
firstPlayable.knownArtDebt.push('turn art remains unauthored; the modern crouch rising connector is comparison-ready but live crouch-to-stand presentation integration remains targeted debt pending human motion and transition review');
writeJson(firstPlayablePath, firstPlayable);

for (const stateId of ['crouch', 'jump']) {
  writeJson(path.join(contentRoot, 'moves', stateId, 'visual-modernization.candidate.v1.json'), {
    schemaVersion: '1.0.0',
    id: `lamuh_legacy_v2_${stateId}_modern_visual_candidate_v1`,
    promotionState: 'candidate',
    candidateOnly: true,
    deployable: false,
    productionApproved: false,
    sourceMotionPreserved: true,
    simulationOwnsTravel: true,
    normalizationReport: movement.crouchJumpModernization.normalizationReport,
    hashLock: movement.crouchJumpModernization.hashLock,
    state: states[stateId],
    approvalStatus: movement.status,
    humanApproval: null
  });
}

reviewData.movementModernization = movement;
reviewData.firstPlayable = firstPlayable;
reviewData.sourceAudit = sourceAudit;
reviewData.humanReviewStatus = currentHumanReviewStatus;
reviewData.candidateOnly = true;
reviewData.deployable = false;
reviewData.authority = { renderingAuthoritative: false, simulationAuthoritative: true, candidateOnly: true, deployable: false };
writeJson(reviewDataPath, reviewData);

closurePending.branch = activeGoalBranch;
closurePending.status = 'candidate-only';
closurePending.deployable = false;
closurePending.productionApproved = false;
closurePending.humanReviewStatus = currentHumanReviewStatus;
closurePending.currentReviewFocus = firstPlayable.currentReviewGate;
writeJson(closurePendingPath, closurePending);
console.log('Built modern Lamuh crouch plus jump/fall/landing presentation candidate; 13 distinct frames; gameplay travel and recovery unchanged.');
