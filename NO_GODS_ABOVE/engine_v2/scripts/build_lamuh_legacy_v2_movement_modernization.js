const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

const engineRoot = path.resolve(__dirname, '..');
const repoRoot = path.resolve(engineRoot, '..', '..');
const contentRoot = path.join(engineRoot, 'content-source', 'characters', 'lamuh-legacy-v2');
const reviewRoot = path.join(repoRoot, 'tools', 'nga-forge', 'review', 'lamuh-legacy-v2-movement-modernization-v1');
const reportPath = path.join(reviewRoot, 'normalization.report.json');
const publicRoot = path.join(engineRoot, 'public', 'lamuh-legacy-v2', 'movement-v2');
const publicReviewDataPath = path.join(engineRoot, 'public', 'lamuh-legacy-v2', 'review-data.json');
const sourceAuditPath = path.join(contentRoot, 'source-audit.v1.json');
const styleApprovalPath = path.join(contentRoot, 'records', 'style-checkpoint-v1.approval.json');
const hashLockPath = path.join(contentRoot, 'records', 'movement-modernization-v1.hash-lock.json');
const crossScaleReportPath = path.join(repoRoot, 'tools', 'nga-forge', 'review', 'lamuh-legacy-v2-cross-clip-scale-v1', 'cross-clip-scale.report.json');

const sha256 = (filename) => crypto.createHash('sha256').update(fs.readFileSync(filename)).digest('hex').toUpperCase();
const readJson = (filename) => JSON.parse(fs.readFileSync(filename, 'utf8').replace(/^\uFEFF/, ''));
const writeJson = (filename, value) => {
  fs.mkdirSync(path.dirname(filename), { recursive: true });
  fs.writeFileSync(filename, `${JSON.stringify(value, null, 2)}\n`, 'utf8');
};
const repoRelative = (filename) => path.relative(repoRoot, filename).replaceAll('\\', '/');

for (const filename of [reportPath, publicReviewDataPath, sourceAuditPath, styleApprovalPath, crossScaleReportPath]) {
  if (!fs.existsSync(filename)) throw new Error(`Missing movement modernization prerequisite: ${filename}`);
}
const report = readJson(reportPath);
const reviewData = readJson(publicReviewDataPath);
const sourceAudit = readJson(sourceAuditPath);
const styleApproval = readJson(styleApprovalPath);
const crossScaleReport = readJson(crossScaleReportPath);
if (report.status !== 'candidate-only' || report.deployable !== false || report.authoredFrameCount !== 37) throw new Error('Movement report promotion or coverage boundary failed');
if (styleApproval.decision !== 'APPROVED_WITH_TARGETED_REPAIR' || styleApproval.approvalBoundary.deployable !== false) throw new Error('Movement style approval boundary failed');
if (report.normalization.perFrameRendererScale !== false || report.frames.some((frame) => frame.touchesEdge)) throw new Error('Movement fixed-root or padding contract failed');
if (report.visualValidation.meaningfulMagentaPixelsRemaining !== 0 || report.frames.some((frame) => frame.meaningfulMagentaPixelsRemaining !== 0)) throw new Error('Movement frames contain meaningful magenta pixels');
if (new Set(report.frames.map((frame) => frame.normalizedSha256)).size !== 37) throw new Error('Movement frames contain an undeclared duplicate');
if (crossScaleReport.validation.passed !== true || crossScaleReport.deployable !== false) throw new Error('Cross-clip fixed-scale audit has not passed its candidate gate');
for (const measurement of Object.values(crossScaleReport.measurements)) {
  const framePath = path.join(repoRoot, measurement.path);
  if (!fs.existsSync(framePath) || sha256(framePath) !== measurement.frameSha256) throw new Error(`Cross-clip scale report is stale: ${measurement.path}`);
}

for (const frame of report.frames) {
  const legacy = path.join(repoRoot, frame.legacyPath);
  const raw = path.join(repoRoot, frame.rawPath);
  const normalized = path.join(repoRoot, frame.normalizedPath);
  if (!fs.existsSync(legacy) || sha256(legacy) !== frame.legacySha256) throw new Error(`Protected V1 movement frame changed: ${frame.state} ${frame.legacyIndex}`);
  if (!fs.existsSync(raw) || sha256(raw) !== frame.rawSha256) throw new Error(`Movement raw candidate changed: ${frame.state} ${frame.index}`);
  if (!fs.existsSync(normalized) || sha256(normalized) !== frame.normalizedSha256) throw new Error(`Movement normalized candidate changed: ${frame.state} ${frame.index}`);
}

fs.mkdirSync(publicRoot, { recursive: true });
const stateEntries = {};
for (const stateId of ['idle', 'walk_forward', 'walk_backward', 'air_dash_forward', 'air_dash_backward']) {
  const stateReport = report.states[stateId];
  const frames = report.frames.filter((frame) => frame.state === stateId).sort((a, b) => a.index - b.index).map((frame) => {
    const source = path.join(repoRoot, frame.normalizedPath);
    const destinationName = `${stateId.replaceAll('_', '-')}-${String(frame.index).padStart(2, '0')}.png`;
    const destination = path.join(publicRoot, destinationName);
    fs.copyFileSync(source, destination);
    if (sha256(destination) !== frame.normalizedSha256) throw new Error(`Movement public copy mismatch: ${stateId} ${frame.index}`);
    return {
      index: frame.index,
      role: frame.role,
      publicPath: `/lamuh-legacy-v2/movement-v2/${destinationName}`,
      sha256: frame.normalizedSha256,
      sourceSha256: frame.rawSha256,
      sourceType: frame.sourceType,
      sourceFrameIndex: frame.sourceFrameIndex,
      bodyScaleCorrection: frame.bodyScaleCorrection,
      sourceScaleCorrection: frame.sourceScaleCorrection,
      legacySha256: frame.legacySha256,
      legacyIndex: frame.legacyIndex,
      root: frame.normalizedRoot,
      visibleBounds: frame.visibleBounds,
      bodyCenter: frame.visualCentroid
    };
  });
  if (frames.length !== stateReport.authoredFrameCount || stateReport.exposureTicks.reduce((sum, value) => sum + value, 0) !== stateReport.durationTicks) throw new Error(`Movement state timeline mismatch: ${stateId}`);
  stateEntries[stateId] = {
    sourceFrameCount: stateReport.sourceFrameCount,
    authoredFrameCount: stateReport.authoredFrameCount,
    selectedLegacyFrames: stateReport.selectedLegacyFrames,
    selectedSourceFrames: stateReport.selectedSourceFrames || null,
    exposureTicks: stateReport.exposureTicks,
    durationTicks: stateReport.durationTicks,
    loop: stateReport.loop,
    frames
  };
}

const movementData = {
  schemaVersion: '1.0.0',
  status: 'awaiting_human_combined_modern_style_playtest',
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
  sourceRepairReason: report.sourceRepairReason,
  states: stateEntries,
  reviewQuestions: [
    'Does the modern idle read naturally beside the modern attacks without a scale or costume jump?',
    'Does forward walk stay grounded and preserve the V1 footfall rhythm without looking like a dash?',
    'Does backward walk retreat while Lamuh remains facing and guarding toward the opponent?',
    'Do forward and backward air dashes preserve Lamuh V1 body arcs without any per-frame size change?',
    'Does each air dash travel through simulation motion and return cleanly to jump/fall before landing?',
    'Do idle to walk, walk to attack and attack to idle transitions feel visually connected?',
    'Is the purple outline absent throughout normal play?'
  ],
  approvalBoundary: {
    movementMotionApproved: false,
    combinedPlaytestApproved: false,
    combatProfileApproved: false,
    runtimeArtPromotionApproved: false,
    firstPlayableApproved: false,
    productionApproved: false,
    deployable: false
  },
  normalizationReport: { path: repoRelative(reportPath), sha256: sha256(reportPath) },
  crossClipScaleAudit: { path: repoRelative(crossScaleReportPath), sha256: sha256(crossScaleReportPath), passed: true, measuredRangePixels: [crossScaleReport.validation.minimumPixels, crossScaleReport.validation.maximumPixels] },
  styleApproval: { path: repoRelative(styleApprovalPath), sha256: sha256(styleApprovalPath), decision: styleApproval.decision },
  hashLock: null
};

writeJson(hashLockPath, {
  schemaVersion: '1.0.0',
  subject: 'lamuh_legacy_v2.movement_modernization.combined_playtest.candidate.v1',
  status: 'HASH_LOCKED_CANDIDATE_ONLY',
  deployable: false,
  legacySourceImmutable: true,
  sourceSelection: { idle: [0, 2, 4, 6], walk_forward_video: report.states.walk_forward.selectedSourceFrames, walk_backward: [0, 1, 2, 3, 4, 5], air_dash_forward: [0, 1, 2, 3, 4, 5], air_dash_backward: [0, 1, 2, 3, 4], retiredExactDuplicate: { state: 'air_dash_backward', legacyFrame: 5, duplicateOf: 4 } },
  sourceVideo: report.sourceVideo,
  frames: report.frames.map((frame) => ({ state: frame.state, index: frame.index, sourceType: frame.sourceType, sourceFrameIndex: frame.sourceFrameIndex, bodyScaleCorrection: frame.bodyScaleCorrection, sourceScaleCorrection: frame.sourceScaleCorrection, legacyIndex: frame.legacyIndex, legacyPath: frame.legacyPath, legacySha256: frame.legacySha256, rawPath: frame.rawPath, rawSha256: frame.rawSha256, normalizedPath: frame.normalizedPath, normalizedSha256: frame.normalizedSha256 })),
  approvalBoundary: movementData.approvalBoundary
});
movementData.hashLock = { path: repoRelative(hashLockPath), sha256: sha256(hashLockPath) };

for (const [animationName, stateId] of [['idle', 'idle'], ['walk_forward', 'walk_forward'], ['walk_backward', 'walk_backward'], ['air_dash_forward', 'air_dash_forward'], ['air_dash_backward', 'air_dash_backward']]) {
  const audit = sourceAudit.animations.find((entry) => entry.animationName === animationName);
  if (!audit) throw new Error(`Movement source audit entry missing: ${animationName}`);
  audit.sourceMotionReusable = true;
  audit.visualArtworkReusable = stateId === 'walk_forward' || stateId.startsWith('air_dash_');
  audit.v2Disposition = 'PRESERVE_WITH_V2_COMBAT_UPDATE';
  audit.needsV2Redesign = false;
  audit.reviewNotes = stateId === 'idle'
    ? 'Preserve the V1 60-tick breathing cadence using four unique modern key poses and authored exposure holds; reconstruct only the obsolete purple-outlined artwork.'
    : stateId === 'walk_forward'
      ? 'Use the user-supplied 192-frame modern-style motion clip as the forward-walk source. Preserve sixteen evenly spaced gait poses in a responsive 32-tick loop with one baked source-camera scale and no runtime rescaling.'
      : stateId === 'walk_backward'
        ? 'Preserve all six V1 walk backward footfall poses and 18-tick cycle while reconstructing the obsolete purple-outlined artwork in the modern Lamuh V2 style.'
        : `Preserve all six V1 ${stateId.replaceAll('_', ' ')} body poses, bake one fixed anatomy scale, replace the purple fringe with V2 dark ink, and keep all travel simulation-authored.`;
}
writeJson(sourceAuditPath, sourceAudit);

reviewData.movementModernization = movementData;
reviewData.firstPlayable.humanReviewStatus = movementData.status;
reviewData.firstPlayable.candidateOnly = true;
reviewData.firstPlayable.deployable = false;
reviewData.runtimeTimelines.idle = { exposureTicks: stateEntries.idle.exposureTicks, durationTicks: stateEntries.idle.durationTicks, contactSourceFrames: [], contactTick: null };
reviewData.runtimeTimelines.walk_forward = { exposureTicks: stateEntries.walk_forward.exposureTicks, durationTicks: stateEntries.walk_forward.durationTicks, contactSourceFrames: [], contactTick: null };
reviewData.runtimeTimelines.walk_backward = { exposureTicks: stateEntries.walk_backward.exposureTicks, durationTicks: stateEntries.walk_backward.durationTicks, contactSourceFrames: [], contactTick: null };
reviewData.runtimeTimelines.air_dash_forward = { exposureTicks: stateEntries.air_dash_forward.exposureTicks, durationTicks: stateEntries.air_dash_forward.durationTicks, contactSourceFrames: [], contactTick: null };
reviewData.runtimeTimelines.air_dash_backward = { exposureTicks: stateEntries.air_dash_backward.exposureTicks, durationTicks: stateEntries.air_dash_backward.durationTicks, contactSourceFrames: [], contactTick: null };
writeJson(publicReviewDataPath, reviewData);

for (const [folder, stateId] of [['idle', 'idle'], ['walk-forward', 'walk_forward'], ['walk-backward', 'walk_backward'], ['air-dash-forward', 'air_dash_forward'], ['air-dash-backward', 'air_dash_backward']]) {
  writeJson(path.join(contentRoot, 'moves', folder, 'visual-modernization.candidate.v1.json'), {
    schemaVersion: '1.0.0',
    id: `lamuh_legacy_v2_${stateId}_modern_visual_candidate_v1`,
    promotionState: 'candidate',
    deployable: false,
    productionApproved: false,
    sourceMotionPreserved: true,
    hashLock: movementData.hashLock,
    normalizationReport: movementData.normalizationReport,
    state: movementData.states[stateId],
    approvalStatus: movementData.status,
    humanApproval: null
  });
}

console.log('Built modern Lamuh ground movement plus forward/backward air-dash combined playtest package; 37 unique frames; candidate-only, deployable false.');
