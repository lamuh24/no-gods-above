const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

const engineRoot = path.resolve(__dirname, '..');
const repoRoot = path.resolve(engineRoot, '..', '..');
const contentRoot = path.join(engineRoot, 'content-source', 'characters', 'lamuh-legacy-v2');
const reviewRoot = path.join(repoRoot, 'tools', 'nga-forge', 'review', 'lamuh-legacy-v2-backward-motion-repair-v1');
const reportPath = path.join(reviewRoot, 'normalization.report.json');
const reviewDataPath = path.join(engineRoot, 'public', 'lamuh-legacy-v2', 'review-data.json');
const firstPlayablePath = path.join(contentRoot, 'first-playable.bundle.json');
const sourceAuditPath = path.join(contentRoot, 'source-audit.v1.json');
const closurePendingPath = path.join(contentRoot, 'records', 'first-playable-closure.pending.json');
const hashLockPath = path.join(contentRoot, 'records', 'backward-motion-repair-v1.hash-lock.json');
const candidateSourceRoot = path.join(contentRoot, 'source-frames', 'candidates', 'backward-motion-repair-v1');
const publicRoot = path.join(engineRoot, 'public', 'lamuh-legacy-v2', 'movement-v2');
const stateIds = ['walk_backward', 'dash_backward'];

const readJson = (filename) => JSON.parse(fs.readFileSync(filename, 'utf8').replace(/^\uFEFF/, ''));
const writeJson = (filename, value) => {
  fs.mkdirSync(path.dirname(filename), { recursive: true });
  fs.writeFileSync(filename, `${JSON.stringify(value, null, 2)}\n`, 'utf8');
};
const sha256 = (filename) => crypto.createHash('sha256').update(fs.readFileSync(filename)).digest('hex').toUpperCase();
const repoRelative = (filename) => path.relative(repoRoot, filename).replaceAll('\\', '/');
const publicPathFor = (filename) => `/${path.relative(path.join(engineRoot, 'public'), filename).replaceAll('\\', '/')}`;
const folderFor = (stateId) => stateId.replaceAll('_', '-');

for (const filename of [reportPath, reviewDataPath, firstPlayablePath, sourceAuditPath, closurePendingPath]) {
  if (!fs.existsSync(filename)) throw new Error(`Missing backward-motion repair prerequisite: ${filename}`);
}

const report = readJson(reportPath);
const reviewData = readJson(reviewDataPath);
const firstPlayable = readJson(firstPlayablePath);
const sourceAudit = readJson(sourceAuditPath);
const closurePending = readJson(closurePendingPath);

if (report.status !== 'candidate-only' || report.candidateOnly !== true || report.deployable !== false || report.productionApproved !== false || report.authoredFrameCount !== 11) throw new Error('Backward-motion repair promotion boundary failed');
if (report.normalization.perFrameRendererScale !== false || report.normalization.visualRecentering !== false) throw new Error('Backward-motion repair fixed-scale contract failed');
if (report.visualValidation.meaningfulMagentaPixelsRemaining !== 0 || report.visualValidation.redArtifactPixelsRemaining !== 0 || report.visualValidation.edgeTouches !== 0 || report.visualValidation.distinctFrameCount !== 11) throw new Error('Backward-motion repair visual validation failed');
if (report.frames.some((frame) => frame.touchesEdge || frame.meaningfulMagentaPixelsRemaining !== 0 || frame.redArtifactPixelsRemaining !== 0)) throw new Error('Backward-motion repair frame validation failed');
if (new Set(report.frames.map((frame) => frame.normalizedSha256)).size !== 11) throw new Error('Backward-motion repair contains an undeclared duplicate');

const expected = {
  walk_backward: { frames: 6, exposures: [3, 3, 3, 3, 3, 3], duration: 18, loop: true },
  dash_backward: { frames: 5, exposures: [4, 4, 4, 4, 4], duration: 20, loop: false }
};
for (const stateId of stateIds) {
  const state = report.states[stateId];
  const contract = expected[stateId];
  if (!state || state.authoredFrameCount !== contract.frames || JSON.stringify(state.exposureTicks) !== JSON.stringify(contract.exposures) || state.durationTicks !== contract.duration || state.loop !== contract.loop) throw new Error(`${stateId} timing or coverage drifted`);
}

fs.mkdirSync(publicRoot, { recursive: true });
const states = {};
for (const stateId of stateIds) {
  const stateReport = report.states[stateId];
  const stateFrames = report.frames
    .filter((frame) => frame.state === stateId)
    .sort((a, b) => a.index - b.index)
    .map((frame) => {
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
    exposureTicks: stateReport.exposureTicks,
    durationTicks: stateReport.durationTicks,
    loop: stateReport.loop,
    frames: stateFrames
  };
}

const contactSheetPublicPaths = {};
const contactSheetSha256 = {};
for (const stateId of stateIds) {
  const artifact = report.reviewArtifacts.numberedContactSheets[stateId];
  const source = path.join(repoRoot, artifact.path);
  if (!fs.existsSync(source) || sha256(source) !== artifact.sha256) throw new Error(`${stateId} contact sheet hash mismatch`);
  const destination = path.join(publicRoot, `${folderFor(stateId)}-directional-repair-numbered-contact-sheet.png`);
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
  generationPromptSummary: 'Right-facing Lamuh visibly retreats left: guarded backpedal for Walk Back and recoil, takeoff, airborne retreat, landing catch, and planted brake for Back Dash.',
  timingPreserved: {
    walk_backward: expected.walk_backward,
    dash_backward: expected.dash_backward
  },
  sourceSheets: report.sourceSheets,
  normalizationReport: { path: repoRelative(reportPath), sha256: sha256(reportPath) },
  contactSheets: Object.fromEntries(stateIds.map((stateId) => [stateId, { path: report.reviewArtifacts.numberedContactSheets[stateId].path, sha256: report.reviewArtifacts.numberedContactSheets[stateId].sha256 }])),
  protectedLegacyFrames: report.frames.map((frame) => ({ state: frame.state, legacyIndex: frame.legacyIndex, path: frame.legacyPath, sha256: frame.legacySha256 })),
  sourceFrames: report.frames.map((frame) => ({ state: frame.state, index: frame.index, path: repoRelative(path.join(candidateSourceRoot, frame.state, path.basename(frame.sourcePath))), sha256: frame.sourceSha256 })),
  normalizedFrames: report.frames.map((frame) => ({ state: frame.state, index: frame.index, path: frame.normalizedPath, sha256: frame.normalizedSha256 })),
  approvalBoundary: {
    walkBackwardDirectionalMotionApproved: false,
    dashBackwardDirectionalMotionApproved: false,
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
for (const stateId of stateIds) movement.states[stateId] = states[stateId];
movement.backwardMotionRepair = {
  status: 'awaiting_human_walk_backward_and_dash_backward_directional_review',
  candidateOnly: true,
  deployable: false,
  timingChanged: false,
  simulationTravelChanged: false,
  normalizationReport: { path: repoRelative(reportPath), sha256: sha256(reportPath) },
  hashLock: { path: repoRelative(hashLockPath), sha256: sha256(hashLockPath) },
  contactSheetPublicPaths,
  contactSheetSha256,
  sourceRepairReason: report.sourceRepairReason,
  humanApproval: { walk_backward: null, dash_backward: null, transitions: null }
};
movement.reviewQuestions = [...new Set([
  ...movement.reviewQuestions,
  'Does Walk Back visibly step away from the opponent through rearward foot placement and weight transfer while Lamuh keeps his guard facing forward?',
  'Does Back Dash read as recoil, backward takeoff, airborne retreat, landing catch, and brake rather than a forward sprint played in reverse?'
])];

for (const stateId of stateIds) {
  reviewData.runtimeTimelines[stateId] = { exposureTicks: states[stateId].exposureTicks, durationTicks: states[stateId].durationTicks, contactSourceFrames: [], contactTick: null };
  const clip = reviewData.comparisonClips.find((entry) => entry.clipId === stateId);
  if (!clip) throw new Error(`Comparison clip missing: ${stateId}`);
  clip.v2Candidate = { label: 'V2_BACKWARD_DIRECTIONAL_MOTION_REPAIR', durationTicks: states[stateId].durationTicks, exposureTicks: states[stateId].exposureTicks };
  clip.humanReviewStatus = null;
}

const finding = 'Walk Back and Back Dash now use directionally explicit outline-free V2 candidate art: right-facing guard with leftward retreat, rearward weight transfer, backward takeoff, airborne recoil, landing catch, and planted brake. Their 18-tick and 20-tick gameplay timelines and simulation-owned travel are unchanged.';
sourceAudit.globalFindings = sourceAudit.globalFindings.filter((item) => !item.startsWith('Walk Back and Back Dash now use directionally explicit'));
sourceAudit.globalFindings.push(finding);
for (const stateId of stateIds) {
  const audit = sourceAudit.animations.find((entry) => entry.animationName === stateId);
  if (!audit) throw new Error(`Source audit entry missing: ${stateId}`);
  audit.sourceMotionReusable = true;
  audit.visualArtworkReusable = false;
  audit.v2Disposition = 'PRESERVE_WITH_V2_COMBAT_UPDATE';
  audit.needsV2Redesign = false;
  audit.reviewNotes = stateId === 'walk_backward'
    ? 'Preserve the six-pose and 18-tick retreat rhythm, but make rearward foot placement, leftward weight transfer, forward-facing guard, and rightward coat/loc drag visually explicit.'
    : 'Preserve the five-pose and 20-tick backdash contract, but replace the forward-sprint silhouette with guarded recoil, backward takeoff, airborne retreat, landing catch, and planted brake.';
}
writeJson(sourceAuditPath, sourceAudit);

const requiredDecisions = firstPlayable.currentReviewGate.requiredDecisions;
if (!requiredDecisions.includes('walk_backward_directional_motion_and_transition')) requiredDecisions.splice(1, 0, 'walk_backward_directional_motion_and_transition');
firstPlayable.currentReviewGate.backwardMotionRepair = {
  status: movement.backwardMotionRepair.status,
  walkBackward: null,
  dashBackward: null,
  timingChanged: false,
  simulationTravelChanged: false
};
writeJson(firstPlayablePath, firstPlayable);

for (const stateId of stateIds) {
  writeJson(path.join(contentRoot, 'moves', folderFor(stateId), 'directional-motion-repair.candidate.v1.json'), {
    schemaVersion: '1.0.0',
    id: `lamuh_legacy_v2_${stateId}_directional_motion_repair_v1`,
    promotionState: 'candidate',
    candidateOnly: true,
    deployable: false,
    productionApproved: false,
    simulationOwnsTravel: true,
    timingChanged: false,
    normalizationReport: movement.backwardMotionRepair.normalizationReport,
    hashLock: movement.backwardMotionRepair.hashLock,
    state: states[stateId],
    approvalStatus: movement.backwardMotionRepair.status,
    humanApproval: null
  });
}

reviewData.movementModernization = movement;
reviewData.sourceAudit = sourceAudit;
reviewData.candidateOnly = true;
reviewData.deployable = false;
reviewData.authority = { renderingAuthoritative: false, simulationAuthoritative: true, candidateOnly: true, deployable: false };
writeJson(reviewDataPath, reviewData);

closurePending.currentReviewFocus = firstPlayable.currentReviewGate;
writeJson(closurePendingPath, closurePending);
console.log('Built Lamuh Walk Back and Back Dash directional-motion repair candidate; 11 distinct fixed-root frames; gameplay timing and simulation travel unchanged.');
