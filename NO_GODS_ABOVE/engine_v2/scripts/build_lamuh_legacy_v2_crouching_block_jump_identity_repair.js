const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

const engineRoot = path.resolve(__dirname, '..');
const repoRoot = path.resolve(engineRoot, '..', '..');
const contentRoot = path.join(engineRoot, 'content-source', 'characters', 'lamuh-legacy-v2');
const publicRoot = path.join(engineRoot, 'public', 'lamuh-legacy-v2', 'movement-v2');
const reviewDataPath = path.join(engineRoot, 'public', 'lamuh-legacy-v2', 'review-data.json');
const firstPlayablePath = path.join(contentRoot, 'first-playable.bundle.json');
const sourceAuditPath = path.join(contentRoot, 'source-audit.v1.json');
const closurePendingPath = path.join(contentRoot, 'records', 'first-playable-closure.pending.json');
const crouchingBlockReviewRoot = path.join(repoRoot, 'tools', 'nga-forge', 'review', 'lamuh-legacy-v2-crouching-block-modernization-v1');
const jumpReviewRoot = path.join(repoRoot, 'tools', 'nga-forge', 'review', 'lamuh-legacy-v2-jump-adult-proportion-repair-v1');
const crouchingBlockReportPath = path.join(crouchingBlockReviewRoot, 'normalization.report.json');
const jumpReportPath = path.join(jumpReviewRoot, 'normalization.report.json');
const crouchingBlockHashLockPath = path.join(contentRoot, 'records', 'crouching-block-modernization-v1.hash-lock.json');
const jumpHashLockPath = path.join(contentRoot, 'records', 'jump-adult-proportion-repair-v1.hash-lock.json');
const candidateSourceRoot = path.join(contentRoot, 'source-frames', 'candidates');

const readJson = (filename) => JSON.parse(fs.readFileSync(filename, 'utf8').replace(/^\uFEFF/, ''));
const writeJson = (filename, value) => {
  fs.mkdirSync(path.dirname(filename), { recursive: true });
  fs.writeFileSync(filename, `${JSON.stringify(value, null, 2)}\n`, 'utf8');
};
const sha256 = (filename) => crypto.createHash('sha256').update(fs.readFileSync(filename)).digest('hex').toUpperCase();
const repoRelative = (filename) => path.relative(repoRoot, filename).replaceAll('\\', '/');
const publicPathFor = (filename) => `/${path.relative(path.join(engineRoot, 'public'), filename).replaceAll('\\', '/')}`;

for (const filename of [crouchingBlockReportPath, jumpReportPath, reviewDataPath, firstPlayablePath, sourceAuditPath, closurePendingPath]) {
  if (!fs.existsSync(filename)) throw new Error(`Missing Crouching Block / Jump repair prerequisite: ${filename}`);
}

const crouchingBlockReport = readJson(crouchingBlockReportPath);
const jumpReport = readJson(jumpReportPath);
const reviewData = readJson(reviewDataPath);
const firstPlayable = readJson(firstPlayablePath);
const sourceAudit = readJson(sourceAuditPath);
const closurePending = readJson(closurePendingPath);
const movement = reviewData.movementModernization;

if (!movement || movement.candidateOnly !== true || movement.deployable !== false) throw new Error('Movement candidate boundary is missing');
if (crouchingBlockReport.status !== 'candidate-only' || crouchingBlockReport.deployable !== false || crouchingBlockReport.frames.length !== 4) throw new Error('Crouching Block candidate boundary failed');
if (jumpReport.status !== 'candidate-only' || jumpReport.deployable !== false || jumpReport.frames.length !== 7) throw new Error('Jump identity repair candidate boundary failed');
if (!crouchingBlockReport.validation.sequenceWideScale || crouchingBlockReport.validation.perFrameRendererScale !== false) throw new Error('Crouching Block fixed-scale contract failed');
if (!jumpReport.validation.sequenceWideScale || jumpReport.validation.perFrameRendererScale !== false || jumpReport.validation.simulationOwnsTravel !== true) throw new Error('Jump fixed-scale / travel authority contract failed');
if (jumpReport.idleHeightDeltaRatio > 0.03) throw new Error('Jump recovery no longer matches Idle adult scale');

fs.mkdirSync(publicRoot, { recursive: true });

function copyContactSheet(report, sourceRoot, filename) {
  const source = path.join(repoRoot, report.contactSheet.path);
  if (!fs.existsSync(source) || sha256(source) !== report.contactSheet.sha256) throw new Error(`Contact sheet hash mismatch: ${source}`);
  const destination = path.join(publicRoot, filename);
  fs.copyFileSync(source, destination);
  return { source, destination, publicPath: publicPathFor(destination), sha256: sha256(destination) };
}

function buildState({ stateId, report, selectedLegacyFrames, sourceFrameCount, sourceFolder, publicPrefix }) {
  const frames = [...report.frames].sort((a, b) => a.index - b.index).map((frame) => {
    const legacy = path.join(repoRoot, frame.legacyPath);
    const source = path.join(repoRoot, frame.sourcePath);
    const normalized = path.join(repoRoot, frame.normalizedPath);
    for (const [label, filename, expected] of [['legacy', legacy, frame.legacySha256], ['source', source, frame.sourceSha256], ['normalized', normalized, frame.normalizedSha256]]) {
      if (!fs.existsSync(filename) || sha256(filename) !== expected) throw new Error(`${stateId} ${label} frame changed: ${frame.index}`);
    }
    const sourceDestination = path.join(candidateSourceRoot, sourceFolder, path.basename(source));
    fs.mkdirSync(path.dirname(sourceDestination), { recursive: true });
    fs.copyFileSync(source, sourceDestination);
    const publicDestination = path.join(publicRoot, `${publicPrefix}-${String(frame.index).padStart(2, '0')}.png`);
    fs.copyFileSync(normalized, publicDestination);
    if (sha256(publicDestination) !== frame.normalizedSha256) throw new Error(`${stateId} public frame copy mismatch: ${frame.index}`);
    return {
      index: frame.index,
      role: frame.role,
      publicPath: publicPathFor(publicDestination),
      sha256: frame.normalizedSha256,
      sourceSha256: frame.sourceSha256,
      sourceType: 'imagegen_reference_edit',
      bodyScaleCorrection: 1,
      sourceScaleCorrection: report.sequenceScale,
      legacySha256: frame.legacySha256,
      legacyIndex: frame.legacyIndex ?? frame.index,
      root: frame.normalizedRoot || frame.root,
      visibleBounds: frame.visibleBounds,
      bodyCenter: frame.bodyCenter
    };
  });
  if (new Set(frames.map((frame) => frame.sha256)).size !== frames.length) throw new Error(`${stateId} contains an undeclared duplicate`);
  return {
    sourceFrameCount,
    authoredFrameCount: frames.length,
    selectedLegacyFrames,
    exposureTicks: report.state.exposureTicks,
    durationTicks: report.state.durationTicks,
    loop: report.state.loop,
    frames
  };
}

const crouchingBlockState = buildState({
  stateId: 'crouching_block',
  report: crouchingBlockReport,
  selectedLegacyFrames: [0, 1, 2, 3],
  sourceFrameCount: 4,
  sourceFolder: 'crouching-block-modernization-v1',
  publicPrefix: 'crouching-block'
});
const jumpState = buildState({
  stateId: 'jump',
  report: jumpReport,
  selectedLegacyFrames: [0, 0, 1, 2, 3, 3, 0],
  sourceFrameCount: 4,
  sourceFolder: 'jump-adult-proportion-repair-v1',
  publicPrefix: 'jump'
});
const crouchSourceState = movement.states.crouch;
if (!crouchSourceState || crouchSourceState.frames.length < 6) throw new Error('Modern Crouch must expose authored rise and standing-recovery frames');
const crouchToStandState = {
  sourceFrameCount: crouchSourceState.sourceFrameCount,
  authoredFrameCount: 2,
  selectedLegacyFrames: [3, 0],
  exposureTicks: [4, 4],
  durationTicks: 8,
  loop: false,
  frames: [crouchSourceState.frames[4], crouchSourceState.frames[5]].map((frame, index) => ({
    ...frame,
    index,
    role: index === 0 ? 'crouch_release_rising_connector' : 'crouch_release_standing_recovery'
  }))
};

const crouchingBlockContact = copyContactSheet(crouchingBlockReport, crouchingBlockReviewRoot, 'crouching-block-numbered-contact-sheet.png');
const jumpContact = copyContactSheet(jumpReport, jumpReviewRoot, 'jump-adult-proportion-numbered-contact-sheet.png');

const rejectedGenerationPaths = [
  path.join(crouchingBlockReviewRoot, 'raw', 'rejected', 'crouching-block-source-sheet-chibi-missing-beard.png'),
  path.join(crouchingBlockReviewRoot, 'raw', 'rejected', 'crouching-block-source-sheet-beard-restored-proportion-drift.png')
];
for (const filename of rejectedGenerationPaths) if (!fs.existsSync(filename)) throw new Error(`Rejected Crouching Block evidence is missing: ${filename}`);
writeJson(path.join(crouchingBlockReviewRoot, 'rejected-generations.candidate.v1.json'), {
  schemaVersion: '1.0.0',
  subject: 'lamuh_legacy_v2.crouching_block.rejected_generation_evidence.v1',
  candidateOnly: true,
  deployable: false,
  rejections: [
    { path: repoRelative(rejectedGenerationPaths[0]), sha256: sha256(rejectedGenerationPaths[0]), reason: 'REJECTED_FOR_IDENTITY_DRIFT: missing boxed beard and chibi head-to-body proportions' },
    { path: repoRelative(rejectedGenerationPaths[1]), sha256: sha256(rejectedGenerationPaths[1]), reason: 'REJECTED_FOR_IDENTITY_DRIFT: beard restored but torso and limb compression still read too young' }
  ]
});

function writeHashLock(filename, report, stateId, state, contact, repairReason) {
  writeJson(filename, {
    schemaVersion: '1.0.0',
    subject: report.subject,
    status: 'HASH_LOCKED_CANDIDATE_ONLY',
    candidateOnly: true,
    deployable: false,
    legacySourceImmutable: true,
    generationMode: 'OpenAI built-in image generation reference edit mode',
    sourceSheet: report.sourceSheet,
    normalizationReport: { path: repoRelative(stateId === 'jump' ? jumpReportPath : crouchingBlockReportPath), sha256: sha256(stateId === 'jump' ? jumpReportPath : crouchingBlockReportPath) },
    contactSheet: { path: repoRelative(contact.source), sha256: contact.sha256 },
    sourceRepairReason: repairReason,
    timingChanged: false,
    gameplayChanged: false,
    normalizedFrames: state.frames.map((frame) => ({ index: frame.index, publicPath: frame.publicPath, sha256: frame.sha256 })),
    approvalBoundary: { motionApproved: false, adultIdentityApproved: false, transitionsApproved: false, runtimeArtPromotionApproved: false, productionApproved: false, deployable: false }
  });
}
writeHashLock(crouchingBlockHashLockPath, crouchingBlockReport, 'crouching_block', crouchingBlockState, crouchingBlockContact, crouchingBlockReport.sourceRepairReason);
writeHashLock(jumpHashLockPath, jumpReport, 'jump', jumpState, jumpContact, jumpReport.sourceRepairReason);

movement.states.crouching_block = crouchingBlockState;
movement.states.jump = jumpState;
movement.states.crouch_to_stand = crouchToStandState;
movement.crouchingBlockModernization = {
  status: 'candidate-only', candidateOnly: true, deployable: false, timingChanged: false, gameplayChanged: false,
  normalizationReport: { path: repoRelative(crouchingBlockReportPath), sha256: sha256(crouchingBlockReportPath) },
  hashLock: { path: repoRelative(crouchingBlockHashLockPath), sha256: sha256(crouchingBlockHashLockPath) },
  contactSheetPublicPath: crouchingBlockContact.publicPath,
  contactSheetSha256: crouchingBlockContact.sha256,
  rejectedGenerationEvidence: 'tools/nga-forge/review/lamuh-legacy-v2-crouching-block-modernization-v1/rejected-generations.candidate.v1.json',
  sourceRepairReason: crouchingBlockReport.sourceRepairReason,
  identityLock: { matureAdultProportions: true, boxedBeardAndMustache: true, noPurpleOutline: true, humanApproval: null },
  humanApproval: null
};
movement.jumpAdultProportionRepair = {
  status: 'candidate-only', candidateOnly: true, deployable: false, timingChanged: false, physicsChanged: false,
  normalizationReport: { path: repoRelative(jumpReportPath), sha256: sha256(jumpReportPath) },
  hashLock: { path: repoRelative(jumpHashLockPath), sha256: sha256(jumpHashLockPath) },
  contactSheetPublicPath: jumpContact.publicPath,
  contactSheetSha256: jumpContact.sha256,
  sourceRepairReason: jumpReport.sourceRepairReason,
  idleHeightDeltaRatio: jumpReport.idleHeightDeltaRatio,
  identityLock: { matureAdultProportions: true, boxedBeardAndMustache: true, noPurpleOutline: true, sameSevenPoseArc: true, humanApproval: null },
  humanApproval: null
};
movement.reviewQuestions = [...new Set([
  ...movement.reviewQuestions,
  'Does Crouching Block retain Lamuh\'s mature boxed beard and adult skeletal scale through all four guard poses?',
  'Does Jump preserve the seven-pose motion arc without chibi head, torso, hand, or limb proportions?',
  'Do Crouching Block and Jump transition naturally beside the approved Idle, Crouch, Block, and normal-attack candidates?'
])];

reviewData.runtimeTimelines.crouching_block = { exposureTicks: crouchingBlockState.exposureTicks, durationTicks: crouchingBlockState.durationTicks, contactSourceFrames: [], contactTick: null };
reviewData.runtimeTimelines.jump = { exposureTicks: jumpState.exposureTicks, durationTicks: jumpState.durationTicks, contactSourceFrames: [], contactTick: null };
reviewData.runtimeTimelines.crouch_to_stand = { exposureTicks: crouchToStandState.exposureTicks, durationTicks: crouchToStandState.durationTicks, contactSourceFrames: [], contactTick: null };

function ensureComparisonClip(clipId, state, label) {
  let clip = reviewData.comparisonClips.find((entry) => entry.clipId === clipId);
  if (!clip) {
    clip = {
      clipId,
      sourceFrameCount: state.sourceFrameCount,
      v1Historical: {
        durationTicks: 30,
        exposureTicks: [8, 7, 8, 7],
        durationEvidence: 'RECOVERED_LEGACY_GLOBAL_8_FPS_PRESENTATION_CLOCK',
        exposureEvidence: '60_HZ_INTEGER_EXPOSURE_RECONSTRUCTION_OF_8_FPS',
        contactTick: null,
        note: 'Legacy movement and defense loops were clock-driven and did not consistently reset on state entry.'
      },
      v2Candidate: { label, durationTicks: state.durationTicks, exposureTicks: state.exposureTicks },
      humanReviewStatus: null
    };
    reviewData.comparisonClips.push(clip);
  } else {
    clip.v2Candidate = { label, durationTicks: state.durationTicks, exposureTicks: state.exposureTicks };
    clip.humanReviewStatus = null;
  }
}
ensureComparisonClip('crouching_block', crouchingBlockState, 'V2_MODERN_ADULT_IDENTITY_CANDIDATE');
ensureComparisonClip('jump', jumpState, 'V2_ADULT_PROPORTION_REPAIR_CANDIDATE');
ensureComparisonClip('crouch_to_stand', crouchToStandState, 'V2_LIVE_CROUCH_RELEASE_PRESERVE_FIRST_CANDIDATE');

for (const [animationName, reviewNotes] of [
  ['crouching_block', 'Preserve the four V1 low-guard beats while replacing obsolete purple-outlined art with mature adult Lamuh anatomy, boxed beard continuity, and a stable final guard hold.'],
  ['jump', 'Preserve the seven-pose modern Jump arc and unchanged simulation travel while repairing the user-rejected chibi head-to-body ratio and beard continuity.']
]) {
  const audit = sourceAudit.animations.find((entry) => entry.animationName === animationName);
  if (audit) {
    audit.sourceMotionReusable = true;
    audit.visualArtworkReusable = false;
    audit.v2Disposition = 'PRESERVE_WITH_V2_COMBAT_UPDATE';
    audit.needsV2Redesign = false;
    audit.reviewNotes = reviewNotes;
  }
}
sourceAudit.missingV2Coverage = (sourceAudit.missingV2Coverage || []).filter((entry) => entry !== 'crouch_to_stand');
if (!sourceAudit.animations.some((entry) => entry.animationName === 'crouch_to_stand')) {
  sourceAudit.animations.push({
    animationName: 'crouch_to_stand',
    sheetId: 'v2_movement_transition_candidate',
    row: null,
    sourceFrameCount: 0,
    originalExposureTiming: { source: 'NO_DEDICATED_V1_TRANSITION', note: 'V1 returned through generic state logic without a dedicated crouch-release clip.' },
    gameplayRole: 'movement_transition',
    historicalV1Combat: null,
    currentLamuhLegacyCombat: null,
    originalHitBlockBehavior: null,
    rootBehavior: 'V2 reuses the fixed authored root from the approved modern Crouch package.',
    existingCollisionData: 'No animation-local collision track; standing gameplay boxes apply immediately on release.',
    transitionBehavior: 'Eight simulation-owned presentation ticks; attack, jump, dash, crouch, walk, or block input interrupts immediately.',
    vfxDependencies: [],
    audioDependencies: [],
    sourceMotionReusable: false,
    visualArtworkReusable: false,
    v2Disposition: 'MODERNIZE',
    needsV2Redesign: false,
    reviewNotes: 'Reuse the existing modern Crouch rising connector and standing recovery frames without regeneration or per-frame scaling.'
  });
}

const existingRequired = new Set(firstPlayable.currentReviewGate?.requiredDecisions || []);
existingRequired.add('crouching_block_motion_identity_and_transition');
existingRequired.add('jump_adult_proportion_and_transition');
existingRequired.add('all_normals_idle_and_transition_combined_flow');
firstPlayable.technicalStatus = 'FIRST_PLAYABLE_PLUS_CROUCHING_BLOCK_AND_ADULT_JUMP_REVIEW_CANDIDATE';
firstPlayable.currentReviewGate = {
  ...(firstPlayable.currentReviewGate || {}),
  status: movement.status,
  requiredDecisions: [...existingRequired],
  comparisonRoute: '/lamuh-v1-v2-review.html',
  sandboxRoute: '/lamuh-legacy-sandbox.html',
  stopBoundary: 'human_review_required_before_specials_phase_or_candidate_promotion'
};

writeJson(path.join(contentRoot, 'moves', 'crouching-block', 'visual-modernization.candidate.v1.json'), {
  schemaVersion: '1.0.0', id: 'lamuh_legacy_v2_crouching_block_modern_visual_candidate_v1', promotionState: 'candidate', candidateOnly: true, deployable: false, productionApproved: false,
  sourceMotionPreserved: true, combatStateChanged: false, timingChanged: false, state: crouchingBlockState,
  normalizationReport: movement.crouchingBlockModernization.normalizationReport, hashLock: movement.crouchingBlockModernization.hashLock, humanApproval: null
});
writeJson(path.join(contentRoot, 'moves', 'jump', 'adult-proportion-repair.candidate.v1.json'), {
  schemaVersion: '1.0.0', id: 'lamuh_legacy_v2_jump_adult_proportion_repair_candidate_v1', promotionState: 'candidate', candidateOnly: true, deployable: false, productionApproved: false,
  sourceMotionPreserved: true, timingChanged: false, physicsChanged: false, state: jumpState,
  normalizationReport: movement.jumpAdultProportionRepair.normalizationReport, hashLock: movement.jumpAdultProportionRepair.hashLock, humanApproval: null
});
writeJson(path.join(contentRoot, 'moves', 'crouch', 'release-transition.candidate.v1.json'), {
  schemaVersion: '1.0.0', id: 'lamuh_legacy_v2_crouch_release_transition_candidate_v1', promotionState: 'candidate', candidateOnly: true, deployable: false, productionApproved: false,
  sourceMotionPreserved: true, sourceArtworkReused: true, gameplayResponsivenessChanged: false, state: crouchToStandState,
  transitionContract: { simulationPhase: 'crouch_release', durationTicks: 8, immediatelyInterruptibleByAttackJumpDashCrouchWalkOrBlock: true, rendererOwnsGameplayState: false },
  humanApproval: null
});

reviewData.movementModernization = movement;
reviewData.firstPlayable = firstPlayable;
reviewData.sourceAudit = sourceAudit;
reviewData.candidateOnly = true;
reviewData.deployable = false;
reviewData.authority = { renderingAuthoritative: false, simulationAuthoritative: true, candidateOnly: true, deployable: false };
writeJson(reviewDataPath, reviewData);
writeJson(firstPlayablePath, firstPlayable);
writeJson(sourceAuditPath, sourceAudit);

closurePending.currentReviewFocus = firstPlayable.currentReviewGate;
closurePending.status = 'candidate-only';
closurePending.deployable = false;
closurePending.productionApproved = false;
writeJson(closurePendingPath, closurePending);

console.log('Built candidate-only modern Crouching Block and adult-proportion Jump repair; gameplay timelines, jump physics, and block mechanics unchanged.');
