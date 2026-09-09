const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

const engineRoot = path.resolve(__dirname, '..');
const repoRoot = path.resolve(engineRoot, '..', '..');
const contentRoot = path.join(engineRoot, 'content-source', 'characters', 'lamuh-legacy-v2');
const reviewRoot = path.join(repoRoot, 'tools', 'nga-forge', 'review', 'lamuh-legacy-v2-walk-back-video-rebuild-v1');
const reportPath = path.join(reviewRoot, 'normalization.report.json');
const reviewDataPath = path.join(engineRoot, 'public', 'lamuh-legacy-v2', 'review-data.json');
const firstPlayablePath = path.join(contentRoot, 'first-playable.bundle.json');
const sourceAuditPath = path.join(contentRoot, 'source-audit.v1.json');
const closurePendingPath = path.join(contentRoot, 'records', 'first-playable-closure.pending.json');
const hashLockPath = path.join(contentRoot, 'records', 'walk-back-video-rebuild-v1.hash-lock.json');
const candidateSourceRoot = path.join(contentRoot, 'source-frames', 'candidates', 'walk-back-video-rebuild-v1', 'walk_backward');
const publicRoot = path.join(engineRoot, 'public', 'lamuh-legacy-v2', 'movement-v2');

const readJson = (filename) => JSON.parse(fs.readFileSync(filename, 'utf8').replace(/^\uFEFF/, ''));
const writeJson = (filename, value) => {
  fs.mkdirSync(path.dirname(filename), { recursive: true });
  fs.writeFileSync(filename, `${JSON.stringify(value, null, 2)}\n`, 'utf8');
};
const sha256 = (filename) => crypto.createHash('sha256').update(fs.readFileSync(filename)).digest('hex').toUpperCase();
const repoRelative = (filename) => path.relative(repoRoot, filename).replaceAll('\\', '/');
const publicPathFor = (filename) => `/${path.relative(path.join(engineRoot, 'public'), filename).replaceAll('\\', '/')}`;

for (const filename of [reportPath, reviewDataPath, firstPlayablePath, sourceAuditPath, closurePendingPath]) {
  if (!fs.existsSync(filename)) throw new Error(`Missing Walk Back video rebuild prerequisite: ${filename}`);
}

const report = readJson(reportPath);
const reviewData = readJson(reviewDataPath);
const firstPlayable = readJson(firstPlayablePath);
const sourceAudit = readJson(sourceAuditPath);
const closurePending = readJson(closurePendingPath);
const expectedVideoSha = 'C3D745562609834CEB3FF3DA63047874B0A068688A104EDBF39CB67CACAB0E40';
const expectedSourceFrames = [72, 60, 48, 36, 24, 12, 0];
const expectedExposures = [3, 3, 2, 3, 2, 2, 3];

if (report.status !== 'candidate-only' || report.candidateOnly !== true || report.deployable !== false || report.productionApproved !== false) throw new Error('Walk Back video rebuild promotion boundary failed');
if (report.sourceVideo.sha256 !== expectedVideoSha || report.selection.generatedArtwork !== false || report.selection.reversedPlayback !== true) throw new Error('Walk Back video-source contract failed');
if (JSON.stringify(report.state.selectedSourceFrames) !== JSON.stringify(expectedSourceFrames) || JSON.stringify(report.state.exposureTicks) !== JSON.stringify(expectedExposures) || report.state.durationTicks !== 18 || report.state.authoredFrameCount !== 7) throw new Error('Walk Back video sampling or timing drifted');
if (report.state.simulationTravelChanged !== false || report.state.gameplayTimingChanged !== false || report.perFrameRescale !== false || report.visualRecentering !== false) throw new Error('Walk Back simulation or normalization boundary drifted');
if (report.visualValidation.distinctFrameCount !== 7 || report.visualValidation.meaningfulMagentaPixelsRemaining !== 0 || report.visualValidation.edgeTouches !== 0) throw new Error('Walk Back video visual validation failed');

fs.mkdirSync(candidateSourceRoot, { recursive: true });
fs.mkdirSync(publicRoot, { recursive: true });
const frames = report.frames.map((frame) => {
  const raw = path.join(repoRoot, frame.rawPath);
  const normalized = path.join(repoRoot, frame.normalizedPath);
  if (!fs.existsSync(raw) || sha256(raw) !== frame.rawSha256) throw new Error(`Walk Back raw video frame changed: ${frame.index}`);
  if (!fs.existsSync(normalized) || sha256(normalized) !== frame.normalizedSha256) throw new Error(`Walk Back normalized video frame changed: ${frame.index}`);
  const sourceDestination = path.join(candidateSourceRoot, path.basename(raw));
  fs.copyFileSync(raw, sourceDestination);
  if (sha256(sourceDestination) !== frame.rawSha256) throw new Error(`Walk Back candidate source copy mismatch: ${frame.index}`);
  const publicDestination = path.join(publicRoot, `walk-backward-${String(frame.index).padStart(2, '0')}.png`);
  fs.copyFileSync(normalized, publicDestination);
  if (sha256(publicDestination) !== frame.normalizedSha256) throw new Error(`Walk Back public copy mismatch: ${frame.index}`);
  return {
    index: frame.index,
    role: frame.role,
    publicPath: publicPathFor(publicDestination),
    sha256: frame.normalizedSha256,
    sourceSha256: frame.rawSha256,
    sourceType: 'user_video_reversed_cycle',
    sourceFrameIndex: frame.sourceFrameIndex,
    sourceForwardIndex: frame.sourceForwardIndex,
    bodyScaleCorrection: frame.bodyScaleCorrection,
    sourceScaleCorrection: frame.sourceScaleCorrection,
    legacySha256: null,
    legacyIndex: null,
    root: frame.root,
    visibleBounds: frame.visibleBounds,
    bodyCenter: frame.bodyCenter
  };
});
if (new Set(frames.map((frame) => frame.sha256)).size !== 7) throw new Error('Walk Back video rebuild contains an undeclared duplicate');

const contactSource = path.join(repoRoot, report.contactSheet.path);
if (!fs.existsSync(contactSource) || sha256(contactSource) !== report.contactSheet.sha256) throw new Error('Walk Back video contact sheet hash mismatch');
const contactDestination = path.join(publicRoot, 'walk-backward-video-numbered-contact-sheet.png');
fs.copyFileSync(contactSource, contactDestination);
const contactSheetPublicPath = publicPathFor(contactDestination);
const contactSheetSha256 = sha256(contactDestination);

const hashLock = {
  schemaVersion: '1.0.0',
  subject: report.subject,
  status: 'HASH_LOCKED_CANDIDATE_ONLY',
  candidateOnly: true,
  deployable: false,
  legacySourceImmutable: true,
  generatedArtwork: false,
  sourceVideo: report.sourceVideo,
  selection: report.selection,
  normalizationReport: { path: repoRelative(reportPath), sha256: sha256(reportPath) },
  contactSheet: { path: report.contactSheet.path, sha256: report.contactSheet.sha256 },
  sourceFrames: report.frames.map((frame) => ({ index: frame.index, sourceFrameIndex: frame.sourceFrameIndex, sourceForwardIndex: frame.sourceForwardIndex, path: repoRelative(path.join(candidateSourceRoot, path.basename(frame.rawPath))), sha256: frame.rawSha256 })),
  normalizedFrames: report.frames.map((frame) => ({ index: frame.index, path: frame.normalizedPath, sha256: frame.normalizedSha256 })),
  timing: { exposureTicks: expectedExposures, durationTicks: 18, loop: true, gameplayTimingChanged: false },
  approvalBoundary: { walkBackwardMotionApproved: false, transitionsApproved: false, runtimeArtPromotionApproved: false, productionApproved: false, deployable: false }
};
writeJson(hashLockPath, hashLock);

const state = {
  sourceFrameCount: report.state.sourceFrameCount,
  authoredFrameCount: report.state.authoredFrameCount,
  selectedLegacyFrames: [],
  selectedSourceFrames: report.state.selectedSourceFrames,
  exposureTicks: report.state.exposureTicks,
  durationTicks: report.state.durationTicks,
  loop: report.state.loop,
  frames
};
const movement = reviewData.movementModernization;
if (!movement || movement.candidateOnly !== true || movement.deployable !== false) throw new Error('Existing movement modernization candidate missing');
movement.states.walk_backward = state;
movement.walkBackVideoRebuild = {
  status: 'awaiting_human_video_derived_walk_backward_review',
  candidateOnly: true,
  deployable: false,
  generatedArtwork: false,
  reversedPlayback: true,
  timingChanged: false,
  simulationTravelChanged: false,
  sourceVideo: report.sourceVideo,
  sourceVideoFrames: report.state.selectedSourceFrames,
  normalizationReport: { path: repoRelative(reportPath), sha256: sha256(reportPath) },
  hashLock: { path: repoRelative(hashLockPath), sha256: sha256(hashLockPath) },
  contactSheetPublicPath,
  contactSheetSha256,
  supersedes: report.supersedes,
  humanApproval: { motion: null, transitions: null }
};
if (movement.backwardMotionRepair) movement.backwardMotionRepair.supersededStates = { ...(movement.backwardMotionRepair.supersededStates || {}), walk_backward: 'walkBackVideoRebuild' };
movement.reviewQuestions = [...new Set([...movement.reviewQuestions, 'Does the video-derived reversed gait cycle now read as a natural Walk Back while preserving Lamuh scale and the original 18-tick simulation contract?'])];

reviewData.runtimeTimelines.walk_backward = { exposureTicks: state.exposureTicks, durationTicks: state.durationTicks, contactSourceFrames: [], contactTick: null };
const comparison = reviewData.comparisonClips.find((entry) => entry.clipId === 'walk_backward');
if (!comparison) throw new Error('Walk Back comparison clip missing');
comparison.v2Candidate = { label: 'V2_USER_VIDEO_REVERSED_WALK_BACK', durationTicks: 18, exposureTicks: state.exposureTicks };
comparison.humanReviewStatus = null;

const finding = 'Walk Back now reuses seven frames from the exact user-supplied forward-walk video hash in reverse chronological order. Generated Walk Back artwork is superseded; scale/root normalization, 18-tick duration, simulation travel, inputs, and collision remain unchanged.';
sourceAudit.globalFindings = sourceAudit.globalFindings.filter((item) => !item.startsWith('Walk Back now reuses seven frames from the exact user-supplied'));
sourceAudit.globalFindings.push(finding);
const audit = sourceAudit.animations.find((entry) => entry.animationName === 'walk_backward');
if (!audit) throw new Error('Walk Back source audit entry missing');
audit.sourceMotionReusable = true;
audit.visualArtworkReusable = true;
audit.v2Disposition = 'PRESERVE_WITH_V2_COMBAT_UPDATE';
audit.needsV2Redesign = false;
audit.reviewNotes = 'Use the exact user-supplied forward-walk video frames 72, 60, 48, 36, 24, 12, and 0 as a reversed seven-pose Walk Back loop. No generated Walk Back art remains active; 18-tick simulation timing and code-owned retreat travel remain unchanged.';
writeJson(sourceAuditPath, sourceAudit);

firstPlayable.currentReviewGate.walkBackVideoRebuild = { status: movement.walkBackVideoRebuild.status, motion: null, transitions: null, generatedArtwork: false, timingChanged: false, simulationTravelChanged: false };
writeJson(firstPlayablePath, firstPlayable);
writeJson(path.join(contentRoot, 'moves', 'walk-backward', 'video-derived-rebuild.candidate.v1.json'), {
  schemaVersion: '1.0.0',
  id: 'lamuh_legacy_v2_walk_backward_video_derived_rebuild_v1',
  promotionState: 'candidate',
  candidateOnly: true,
  deployable: false,
  productionApproved: false,
  generatedArtwork: false,
  simulationOwnsTravel: true,
  timingChanged: false,
  normalizationReport: movement.walkBackVideoRebuild.normalizationReport,
  hashLock: movement.walkBackVideoRebuild.hashLock,
  state,
  approvalStatus: movement.walkBackVideoRebuild.status,
  humanApproval: null
});

reviewData.movementModernization = movement;
reviewData.sourceAudit = sourceAudit;
reviewData.candidateOnly = true;
reviewData.deployable = false;
writeJson(reviewDataPath, reviewData);
closurePending.currentReviewFocus = firstPlayable.currentReviewGate;
writeJson(closurePendingPath, closurePending);
console.log('Built video-derived Lamuh Walk Back candidate from seven reversed user-video frames; 18 ticks; simulation travel unchanged.');
