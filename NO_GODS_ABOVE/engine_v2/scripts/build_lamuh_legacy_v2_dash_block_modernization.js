const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

const engineRoot = path.resolve(__dirname, '..');
const repoRoot = path.resolve(engineRoot, '..', '..');
const contentRoot = path.join(engineRoot, 'content-source', 'characters', 'lamuh-legacy-v2');
const reviewRoot = path.join(repoRoot, 'tools', 'nga-forge', 'review', 'lamuh-legacy-v2-dash-block-modernization-v1');
const reportPath = path.join(reviewRoot, 'normalization.report.json');
const reviewDataPath = path.join(engineRoot, 'public', 'lamuh-legacy-v2', 'review-data.json');
const firstPlayablePath = path.join(contentRoot, 'first-playable.bundle.json');
const sourceAuditPath = path.join(contentRoot, 'source-audit.v1.json');
const characterBundlePath = path.join(contentRoot, 'character.bundle.json');
const closurePendingPath = path.join(contentRoot, 'records', 'first-playable-closure.pending.json');
const styleApprovalPath = path.join(contentRoot, 'records', 'style-checkpoint-v1.approval.json');
const hashLockPath = path.join(contentRoot, 'records', 'dash-block-modernization-v1.hash-lock.json');
const candidateSourceRoot = path.join(contentRoot, 'source-frames', 'candidates', 'dash-block-modernization-v1');
const publicRoot = path.join(engineRoot, 'public', 'lamuh-legacy-v2', 'movement-v2');

const readJson = (filename) => JSON.parse(fs.readFileSync(filename, 'utf8').replace(/^\uFEFF/, ''));
const writeJson = (filename, value) => {
  fs.mkdirSync(path.dirname(filename), { recursive: true });
  fs.writeFileSync(filename, `${JSON.stringify(value, null, 2)}\n`, 'utf8');
};
const sha256 = (filename) => crypto.createHash('sha256').update(fs.readFileSync(filename)).digest('hex').toUpperCase();
const repoRelative = (filename) => path.relative(repoRoot, filename).replaceAll('\\', '/');
const publicPathFor = (filename) => `/${path.relative(path.join(engineRoot, 'public'), filename).replaceAll('\\', '/')}`;
const stateIds = ['dash_forward', 'dash_backward', 'air_dash_forward', 'air_dash_backward', 'standing_block'];
const folderFor = (stateId) => stateId.replaceAll('_', '-');
const activeGoalBranch = 'codex/lamuh-legacy-v2-rebuild-v1';
const currentHumanReviewStatus = 'awaiting_human_dash_air_dash_standing_block_crouch_jump_grab_throw_and_combined_movement_review';

for (const filename of [reportPath, reviewDataPath, firstPlayablePath, sourceAuditPath, characterBundlePath, closurePendingPath, styleApprovalPath]) {
  if (!fs.existsSync(filename)) throw new Error(`Missing dash/block modernization prerequisite: ${filename}`);
}

const report = readJson(reportPath);
const reviewData = readJson(reviewDataPath);
const firstPlayable = readJson(firstPlayablePath);
const sourceAudit = readJson(sourceAuditPath);
const characterBundle = readJson(characterBundlePath);
const closurePending = readJson(closurePendingPath);
const styleApproval = readJson(styleApprovalPath);
if (report.status !== 'candidate-only' || report.candidateOnly !== true || report.deployable !== false || report.productionApproved !== false || report.authoredFrameCount !== 26) throw new Error('Dash/block promotion boundary failed');
if (styleApproval.decision !== 'APPROVED_WITH_TARGETED_REPAIR' || styleApproval.approvalBoundary.deployable !== false) throw new Error('Lamuh style-checkpoint boundary failed');
if (report.normalization.perFrameRendererScale !== false || report.normalization.visualRecentering !== false) throw new Error('Dash/block fixed-scale contract failed');
if (report.visualValidation.meaningfulMagentaPixelsRemaining !== 0 || report.visualValidation.redArtifactPixelsRemaining !== 0 || report.visualValidation.edgeTouches !== 0 || report.visualValidation.fixedRoot !== true || report.visualValidation.fixedRendererScale !== true) throw new Error('Dash/block visual cleanup failed');
if (report.frames.some((frame) => frame.touchesEdge || frame.meaningfulMagentaPixelsRemaining !== 0 || frame.redArtifactPixelsRemaining !== 0)) throw new Error('Dash/block frame validation failed');
if (new Set(report.frames.map((frame) => frame.normalizedSha256)).size !== 26) throw new Error('Dash/block frames contain an undeclared duplicate');
if (characterBundle.animationPackages.length !== 24 || characterBundle.promotionState !== 'candidate') throw new Error('Lamuh first-playable candidate bundle boundary drifted');

const expectedCounts = { dash_forward: 6, dash_backward: 5, air_dash_forward: 6, air_dash_backward: 5, standing_block: 4 };
for (const stateId of stateIds) {
  const state = report.states[stateId];
  if (!state || state.authoredFrameCount !== expectedCounts[stateId] || state.exposureTicks.length !== expectedCounts[stateId]) throw new Error(`${stateId} coverage mismatch`);
  if (state.exposureTicks.reduce((sum, ticks) => sum + ticks, 0) !== state.durationTicks) throw new Error(`${stateId} exposure coverage mismatch`);
}

fs.mkdirSync(publicRoot, { recursive: true });
const states = {};
for (const stateId of stateIds) {
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

    const publicDestination = path.join(publicRoot, `${folderFor(stateId)}-${String(frame.index).padStart(2, '0')}.png`);
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
    retiredGeneratedFrame: stateReport.retiredGeneratedFrame,
    exposureTicks: stateReport.exposureTicks,
    durationTicks: stateReport.durationTicks,
    loop: stateReport.loop,
    frames
  };
}

const contactSheetPublicPaths = {};
const contactSheetSha256 = {};
for (const stateId of stateIds) {
  const artifact = report.reviewArtifacts.numberedContactSheets[stateId];
  const source = path.join(repoRoot, artifact.path);
  if (!fs.existsSync(source) || sha256(source) !== artifact.sha256) throw new Error(`${stateId} contact sheet hash mismatch`);
  const destination = path.join(publicRoot, `${folderFor(stateId)}-numbered-contact-sheet.png`);
  fs.copyFileSync(source, destination);
  contactSheetPublicPaths[stateId] = publicPathFor(destination);
  contactSheetSha256[stateId] = sha256(destination);
}

const hashLock = {
  schemaVersion: '1.0.0',
  subject: report.subject,
  status: 'HASH_LOCKED_CANDIDATE_ONLY',
  candidateOnly: true,
  deployable: false,
  legacySourceImmutable: true,
  generationMode: 'OpenAI built-in image generation reference edit mode',
  generationPromptSummary: 'Modern outline-free Lamuh ground dash, air dash, and standing block reconstruction using protected V1 pose progression plus the approved modern idle identity and fixed scale.',
  sourceSheets: report.sourceSheets,
  normalizationReport: { path: repoRelative(reportPath), sha256: sha256(reportPath) },
  contactSheets: Object.fromEntries(stateIds.map((stateId) => [stateId, { path: report.reviewArtifacts.numberedContactSheets[stateId].path, sha256: report.reviewArtifacts.numberedContactSheets[stateId].sha256 }])),
  protectedLegacyFrames: report.frames.map((frame) => ({ state: frame.state, legacyIndex: frame.legacyIndex, path: frame.legacyPath, sha256: frame.legacySha256 })),
  sourceFrames: report.frames.map((frame) => ({ state: frame.state, index: frame.index, path: repoRelative(path.join(candidateSourceRoot, frame.state, path.basename(frame.sourcePath))), sha256: frame.sourceSha256 })),
  normalizedFrames: report.frames.map((frame) => ({ state: frame.state, index: frame.index, path: frame.normalizedPath, sha256: frame.normalizedSha256 })),
  approvalBoundary: {
    dashForwardApproved: false,
    dashBackwardApproved: false,
    airDashForwardApproved: false,
    airDashBackwardApproved: false,
    standingBlockApproved: false,
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
for (const stateId of stateIds) movement.states[stateId] = states[stateId];
movement.dashBlockModernization = {
  normalizationReport: { path: repoRelative(reportPath), sha256: sha256(reportPath) },
  hashLock: { path: repoRelative(hashLockPath), sha256: sha256(hashLockPath) },
  contactSheetPublicPaths,
  contactSheetSha256,
  sourceRepairReason: report.sourceRepairReason,
  humanApproval: Object.fromEntries(stateIds.map((stateId) => [stateId, null]))
};
movement.reviewQuestions = [...new Set([
  ...movement.reviewQuestions,
  'Do both ground dashes preserve Lamuh V1 momentum while holding one body scale and leaving travel simulation-authored?',
  'Do both air dashes read as clean single movement arcs without purple fringe, costume drift, duplicate feet, or sprite-authored travel?',
  'Does standing block enter a readable body-driven guard without changing Lamuh anatomy scale or becoming visually confused with crouching block?'
])];

for (const [clipId, state] of Object.entries(states)) {
  reviewData.runtimeTimelines[clipId] = { exposureTicks: state.exposureTicks, durationTicks: state.durationTicks, contactSourceFrames: [], contactTick: null };
  const clip = reviewData.comparisonClips.find((entry) => entry.clipId === clipId);
  if (!clip) throw new Error(`Comparison clip missing: ${clipId}`);
  clip.v2Candidate = { label: 'V2_MODERN_STYLE_DASH_BLOCK_CANDIDATE', durationTicks: state.durationTicks, exposureTicks: state.exposureTicks };
  clip.humanReviewStatus = null;
}

const finding = 'Modern ground dashes, air dashes, and standing block are now rebuilt in the outline-free Lamuh V2 style and hash-locked as fixed-scale candidates; simulation remains authoritative for dash travel, air-dash travel, collision, and defense state.';
sourceAudit.globalFindings = sourceAudit.globalFindings.filter((item) => !item.startsWith('Modern ground dashes, air dashes, and standing block'));
sourceAudit.globalFindings.push(finding);
for (const stateId of stateIds) {
  const audit = sourceAudit.animations.find((entry) => entry.animationName === stateId);
  if (!audit) throw new Error(`Source audit entry missing: ${stateId}`);
  audit.sourceMotionReusable = true;
  audit.visualArtworkReusable = false;
  audit.v2Disposition = 'PRESERVE_WITH_V2_COMBAT_UPDATE';
  audit.needsV2Redesign = false;
  audit.reviewNotes = stateId === 'standing_block'
    ? 'Preserve the V1 raised-knee defensive rhythm; rebuild the obsolete purple-outlined art in modern style at one fixed anatomy scale while leaving block rules simulation-authored.'
    : `Preserve the V1 ${stateId.replaceAll('_', ' ')} pose progression, momentum, loc drag, and coat follow-through; rebuild obsolete artwork in modern style at one fixed anatomy scale and keep all world travel simulation-authored.`;
}
writeJson(sourceAuditPath, sourceAudit);

firstPlayable.technicalStatus = 'FIRST_PLAYABLE_PLUS_MODERN_DASH_AIR_DASH_BLOCK_CROUCH_JUMP_AND_THROW_REVIEW_CANDIDATE';
firstPlayable.humanReviewStatus = currentHumanReviewStatus;
firstPlayable.goalBranch = activeGoalBranch;
firstPlayable.forgePackageCount = characterBundle.animationPackages.length;
firstPlayable.currentReviewGate = {
  status: currentHumanReviewStatus,
  requiredDecisions: ['dash_forward_motion_and_transition', 'dash_backward_motion_and_transition', 'air_dash_forward_motion_and_transition', 'air_dash_backward_motion_and_transition', 'standing_block_motion_and_transition', 'crouch_motion_and_transition', 'jump_motion_and_transition', 'standard_grab', 'forward_throw', 'back_throw', 'combined_movement_scale_and_flow'],
  comparisonRoute: '/lamuh-v1-v2-review.html',
  sandboxRoute: '/lamuh-legacy-sandbox.html',
  stopBoundary: 'human_review_required_before_candidate_promotion_or_broader_moveset_expansion'
};
writeJson(firstPlayablePath, firstPlayable);

for (const stateId of stateIds) {
  writeJson(path.join(contentRoot, 'moves', folderFor(stateId), 'visual-modernization.candidate.v1.json'), {
    schemaVersion: '1.0.0',
    id: `lamuh_legacy_v2_${stateId}_modern_visual_candidate_v1`,
    promotionState: 'candidate',
    candidateOnly: true,
    deployable: false,
    productionApproved: false,
    sourceMotionPreserved: true,
    simulationOwnsTravel: stateId !== 'standing_block',
    simulationOwnsDefenseState: stateId === 'standing_block',
    normalizationReport: movement.dashBlockModernization.normalizationReport,
    hashLock: movement.dashBlockModernization.hashLock,
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
console.log('Built modern Lamuh ground dash, air dash, and standing block presentation candidate; 26 distinct frames; gameplay travel, collision, and defense rules unchanged.');
