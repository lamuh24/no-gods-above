const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

const engineRoot = path.resolve(__dirname, '..');
const repoRoot = path.resolve(engineRoot, '..', '..');
const contentRoot = path.join(engineRoot, 'content-source', 'characters', 'lamuh-legacy-v2');
const reviewRoot = path.join(repoRoot, 'tools', 'nga-forge', 'review', 'lamuh-legacy-v2-turn-facing-modernization-v1');
const reportPath = path.join(reviewRoot, 'normalization.report.json');
const reviewDataPath = path.join(engineRoot, 'public', 'lamuh-legacy-v2', 'review-data.json');
const publicRoot = path.join(engineRoot, 'public', 'lamuh-legacy-v2', 'movement-v2');
const candidateSourceRoot = path.join(contentRoot, 'source-frames', 'candidates', 'turn-facing-modernization-v1');
const candidatePath = path.join(contentRoot, 'moves', 'turn-facing', 'visual-modernization.candidate.v1.json');
const packagePath = path.join(contentRoot, 'moves', 'turn-facing', 'animation.package.json');
const hashLockPath = path.join(contentRoot, 'records', 'turn-facing-modernization-v1.hash-lock.json');
const approvalPath = path.join(contentRoot, 'records', 'turn-facing-v1.approval.json');
const rejectedEvidencePath = path.join(contentRoot, 'records', 'turn-facing-modernization-v1.rejected-generation.json');
const characterBundlePath = path.join(contentRoot, 'character.bundle.json');
const firstPlayablePath = path.join(contentRoot, 'first-playable.bundle.json');
const sourceAuditPath = path.join(contentRoot, 'source-audit.v1.json');
const closurePendingPath = path.join(contentRoot, 'records', 'first-playable-closure.pending.json');

const readJson = (filename) => JSON.parse(fs.readFileSync(filename, 'utf8').replace(/^\uFEFF/, ''));
const writeJson = (filename, value) => {
  fs.mkdirSync(path.dirname(filename), { recursive: true });
  fs.writeFileSync(filename, `${JSON.stringify(value, null, 2)}\n`, 'utf8');
};
const sha256 = (filename) => crypto.createHash('sha256').update(fs.readFileSync(filename)).digest('hex').toUpperCase();
const repoRelative = (filename) => path.relative(repoRoot, filename).replaceAll('\\', '/');
const repoUri = (filename) => `repo://${repoRelative(filename)}`;
const publicPathFor = (filename) => `/${path.relative(path.join(engineRoot, 'public'), filename).replaceAll('\\', '/')}`;

for (const filename of [reportPath, reviewDataPath, characterBundlePath, firstPlayablePath, sourceAuditPath, closurePendingPath]) {
  if (!fs.existsSync(filename)) throw new Error(`Missing Turn / Facing prerequisite: ${filename}`);
}

const report = readJson(reportPath);
const reviewData = readJson(reviewDataPath);
const characterBundle = readJson(characterBundlePath);
const firstPlayable = readJson(firstPlayablePath);
const sourceAudit = readJson(sourceAuditPath);
const closurePending = readJson(closurePendingPath);
const movement = reviewData.movementModernization;
const turnApproval = fs.existsSync(approvalPath) ? readJson(approvalPath) : null;
const turnDecision = turnApproval?.decisions?.motionAndTransition || null;
const turnStarredForRevisit = turnApproval?.starredForRevisit === true;

if (turnApproval) {
  if (turnApproval.subject !== 'lamuh_legacy_v2.turn_facing.transition.candidate.v1') throw new Error('Turn / Facing approval subject mismatch');
  if (turnDecision !== 'APPROVED_FOR_CURRENT_PRODUCTION_BASELINE_WITH_POLISH_DEBT') throw new Error('Turn / Facing approval decision mismatch');
  if (!turnStarredForRevisit) throw new Error('Turn / Facing approval must preserve the user-requested revisit star');
  if (turnApproval.approvedCandidate?.normalizationReportSha256 !== sha256(reportPath)) throw new Error('Turn / Facing approval normalization hash mismatch');
  if (turnApproval.approvedCandidate?.contactSheetSha256 !== report.contactSheet.sha256) throw new Error('Turn / Facing approval contact-sheet hash mismatch');
}

if (report.status !== 'candidate-only' || report.candidateOnly !== true || report.deployable !== false || report.productionApproved !== false) throw new Error('Turn / Facing candidate boundary failed');
if (report.state.authoredFrameCount !== 4 || report.state.durationTicks !== 12 || report.state.exposureTicks.reduce((sum, value) => sum + value, 0) !== 12) throw new Error('Turn / Facing timing contract failed');
if (!report.validation.sequenceWideScale || report.validation.perFrameRendererScale !== false || report.validation.visualRecentering !== false || !report.validation.simulationOwnsFacing || !report.validation.simulationOwnsRoot || !report.validation.immediatelyInterruptible) throw new Error('Turn / Facing authority contract failed');
if (report.validation.meaningfulMagentaPixelsRemaining !== 0 || report.frames.some((frame) => frame.meaningfulMagentaPixelsRemaining !== 0)) throw new Error('Turn / Facing contains meaningful purple pixels');
if (report.normalizedHeightSpread > 0.04 || report.idleHeightDeltaRatio > 0.02) throw new Error('Turn / Facing body-scale contract failed');
if (new Set(report.frames.map((frame) => frame.normalizedSha256)).size !== 4) throw new Error('Turn / Facing contains an undeclared duplicate');

fs.mkdirSync(publicRoot, { recursive: true });
fs.mkdirSync(candidateSourceRoot, { recursive: true });

const frames = [...report.frames].sort((a, b) => a.index - b.index).map((frame) => {
  const source = path.join(repoRoot, frame.sourcePath);
  const normalized = path.join(repoRoot, frame.normalizedPath);
  if (!fs.existsSync(source) || sha256(source) !== frame.sourceSha256) throw new Error(`Turn / Facing source frame changed: ${frame.index}`);
  if (!fs.existsSync(normalized) || sha256(normalized) !== frame.normalizedSha256) throw new Error(`Turn / Facing normalized frame changed: ${frame.index}`);
  const candidateSource = path.join(candidateSourceRoot, `turn-facing-${String(frame.index).padStart(2, '0')}.png`);
  const publicDestination = path.join(publicRoot, `turn-facing-${String(frame.index).padStart(2, '0')}.png`);
  fs.copyFileSync(normalized, candidateSource);
  fs.copyFileSync(normalized, publicDestination);
  if (sha256(candidateSource) !== frame.normalizedSha256 || sha256(publicDestination) !== frame.normalizedSha256) throw new Error(`Turn / Facing copy mismatch: ${frame.index}`);
  return {
    index: frame.index,
    role: frame.role,
    publicPath: publicPathFor(publicDestination),
    sha256: frame.normalizedSha256,
    sourceSha256: frame.sourceSha256,
    sourceType: 'imagegen_reference_edit_missing_state_authoring',
    bodyScaleCorrection: 1,
    sourceScaleCorrection: report.sequenceScale,
    legacySha256: null,
    legacyIndex: null,
    root: frame.root,
    visibleBounds: frame.visibleBounds,
    bodyCenter: frame.bodyCenter,
    candidateSourcePath: candidateSource
  };
});

const contactSource = path.join(repoRoot, report.contactSheet.path);
if (!fs.existsSync(contactSource) || sha256(contactSource) !== report.contactSheet.sha256) throw new Error('Turn / Facing contact sheet changed');
const contactDestination = path.join(publicRoot, 'turn-facing-numbered-contact-sheet.png');
fs.copyFileSync(contactSource, contactDestination);
if (sha256(contactDestination) !== report.contactSheet.sha256) throw new Error('Turn / Facing public contact sheet copy mismatch');

const state = {
  sourceFrameCount: 0,
  authoredFrameCount: frames.length,
  selectedLegacyFrames: [],
  exposureTicks: report.state.exposureTicks,
  durationTicks: report.state.durationTicks,
  loop: false,
  frames: frames.map(({ candidateSourcePath, ...frame }) => frame)
};

writeJson(rejectedEvidencePath, {
  schemaVersion: '1.0.0',
  subject: 'lamuh_legacy_v2.turn_facing.rejected_generation_evidence.v1',
  candidateOnly: true,
  deployable: false,
  rejection: report.rejectedGeneration
});

writeJson(hashLockPath, {
  schemaVersion: '1.0.0',
  subject: report.subject,
  status: 'HASH_LOCKED_CANDIDATE_ONLY',
  candidateOnly: true,
  deployable: false,
  productionApproved: false,
  legacySourceImmutable: true,
  legacySourceAvailable: false,
  generationMode: report.sourceSheet.generationMode,
  sourceSheet: report.sourceSheet,
  rejectedGeneration: { path: repoRelative(rejectedEvidencePath), sha256: sha256(rejectedEvidencePath) },
  normalizationReport: { path: repoRelative(reportPath), sha256: sha256(reportPath) },
  contactSheet: { path: repoRelative(contactSource), sha256: report.contactSheet.sha256 },
  fixedRoot: report.fixedRoot,
  sequenceScale: report.sequenceScale,
  normalizedHeightSpread: report.normalizedHeightSpread,
  idleHeightDeltaRatio: report.idleHeightDeltaRatio,
  sourceRepairReason: report.sourceRepairReason,
  normalizedFrames: frames.map((frame) => ({ index: frame.index, sourcePath: repoRelative(frame.candidateSourcePath), publicPath: frame.publicPath, sha256: frame.sha256 })),
  approvalBoundary: {
    turnMotionApprovedForCurrentBaseline: !!turnApproval,
    transitionApprovedForCurrentBaseline: !!turnApproval,
    starredForRevisit: turnStarredForRevisit,
    combinedMovementApproved: false,
    runtimeArtPromotionApproved: false,
    firstPlayableApproved: false,
    productionApproved: false,
    deployable: false
  }
});

writeJson(candidatePath, {
  schemaVersion: '1.0.0',
  id: 'lamuh_legacy_v2_turn_facing_modern_visual_candidate_v1',
  promotionState: 'candidate',
  candidateOnly: true,
  deployable: false,
  productionApproved: false,
  sourceMotionPreserved: false,
  missingStateAuthored: true,
  gameplayFacingChanged: true,
  gameplayFacingSwapDelayed: false,
  gameplayResponsivenessChanged: false,
  fixedWorldRoot: true,
  state,
  normalizationReport: { path: repoRelative(reportPath), sha256: sha256(reportPath) },
  hashLock: { path: repoRelative(hashLockPath), sha256: sha256(hashLockPath) },
  transitionContract: {
    simulationPhase: 'turn',
    durationTicks: 12,
    gameplayFacingChangesImmediately: true,
    presentationUsesTurnStartingFacing: true,
    immediatelyInterruptibleByAttackJumpDashCrouchWalkOrBlock: true,
    rendererOwnsGameplayState: false
  },
  humanApproval: turnDecision,
  approvalReceipt: turnApproval ? { path: repoRelative(approvalPath), sha256: sha256(approvalPath) } : null,
  starredForRevisit: turnStarredForRevisit,
  polishDebt: turnStarredForRevisit ? 'user_requested_revisit_after_current_baseline_pass' : null
});

const neutralPose = characterBundle.poseLibrary.find((pose) => pose.id === 'neutral_stand');
if (!neutralPose) throw new Error('Lamuh neutral_stand pose is missing');
const neutralEither = { ...neutralPose, facing: 'either' };
const exposureStarts = [];
let cursor = 0;
for (const duration of state.exposureTicks) { exposureStarts.push(cursor); cursor += duration; }
const footPairs = [
  [{ x: 640, y: 1360 }, { x: 899, y: 1360 }],
  [{ x: 622, y: 1360 }, { x: 882, y: 1360 }],
  [{ x: 685, y: 1360 }, { x: 841, y: 1360 }],
  [{ x: 694, y: 1360 }, { x: 858, y: 1360 }]
];
const sourceFrames = frames.map((frame) => ({
  id: `turn_facing_${String(frame.index).padStart(2, '0')}`,
  sourceUri: repoUri(frame.candidateSourcePath),
  width: 2048,
  height: 1536,
  sha256: frame.sha256,
  approvalUri: repoUri(hashLockPath),
  provenanceUri: repoUri(reportPath),
  metadataUri: repoUri(candidatePath)
}));
const packageRecord = {
  schemaVersion: '2.1.0-contract',
  id: 'turn_facing',
  version: 1,
  promotionState: 'candidate',
  simulationLength: state.durationTicks,
  sourceFrames,
  exposures: frames.map((frame, index) => ({ sourceFrameId: sourceFrames[index].id, start: exposureStarts[index], duration: state.exposureTicks[index] })),
  phases: {
    anticipation: [], startup: [], active: [], impact: [],
    followThrough: [{ start: 0, end: 7 }],
    recovery: [{ start: 8, end: 11 }]
  },
  entryPose: neutralEither,
  exitPose: neutralEither,
  interruptPoses: [neutralEither],
  transitions: [],
  landing: [],
  anchors: frames.map((frame, index) => ({
    frame: exposureStarts[index], sourceFrameId: sourceFrames[index].id,
    root: { x: 768, y: 1360 }, feet: { x: 768, y: 1360 },
    nearFoot: footPairs[index][0], farFoot: footPairs[index][1],
    effect: { x: 768, y: 900 }, groundingContract: 'lamuh_turn_facing_fixed_root_v1'
  })),
  groundingTrack: frames.map((frame, index) => ({
    sourceFrameId: sourceFrames[index].id,
    root: { x: 768, y: 1360 }, nearFoot: footPairs[index][0], farFoot: footPairs[index][1],
    nearFootRole: index < 2 ? 'pivoting_contact' : 'receiving_contact',
    farFootRole: index < 2 ? 'receiving_contact' : 'settling_contact',
    projectedGroundPlaneY: 1360,
    contractVersion: 'lamuh_turn_facing_fixed_root_v1'
  })),
  facingBehavior: {
    authoredFacing: 'P1_screen_right',
    runtimeP2: 'horizontal_mirror_screen_left',
    mirrorAxisX: 768,
    losslessMirrorRequired: true,
    canonicalSequence: 'right_facing_to_left_facing',
    runtimePresentationBasis: 'turnStartingFacing',
    gameplayFacingSwap: 'simulation_owned_immediate'
  },
  playbackPolicy: { mode: 'fixed_timeline', cursorOwner: 'simulation', hitstopFreezesCursor: true, holdBehavior: 'none' },
  interruptionBehavior: {
    owner: 'simulation',
    allowedSources: ['attack_input', 'jump_input', 'dash_input', 'crouch_input', 'walk_input', 'block_input', 'incoming_hit', 'incoming_throw', 'round_end', 'forced_state', 'rollback_restore'],
    onInterrupt: 'simulation immediately selects the requested authoritative state and clears turnStartingFacing',
    returnStatePolicy: 'simulation returns to neutral after twelve ticks only when no higher-priority gameplay state preempts the presentation'
  },
  transitionCompatibility: [
    { fromStates: ['idle', 'walk_forward', 'walk_backward', 'block', 'turn'], toState: 'turn', condition: 'grounded opponent side changes while facing updates are legal', addsGameplayFrames: false },
    { fromStates: ['turn'], toState: 'idle', condition: 'twelve presentation ticks complete without a higher-priority gameplay input', addsGameplayFrames: false },
    { fromStates: ['turn'], toState: 'any_legal_ground_action', condition: 'attack, jump, dash, crouch, walk or block input preempts immediately', addsGameplayFrames: false }
  ],
  combatTrack: {
    startup: 0, active: 0, recovery: 12, damage: 0, hitstop: 0, hitstun: 0, blockstun: 0, boxes: [], cancelWindows: [],
    timingAuthorship: {
      simulationTickRateHz: 60,
      authoredTotalDuration: 12,
      durationModel: 'independently_authored_per_move',
      durationBasis: ['move_weight', 'readability', 'combat_role', 'risk_reward', 'character_identity', 'animation_quality', 'balance'],
      uniformDurationNormalizationProhibited: true,
      visualGameplayAlignment: 'aligned_by_default',
      timingExceptions: []
    }
  },
  gameplayTimingStatus: {
    state: 'not_applicable', authoritative: true, owner: 'simulation',
    candidateValues: { reviewState: turnDecision || 'awaiting_human_turn_facing_and_combined_transition_review', starredForRevisit: turnStarredForRevisit, visualDurationTicks: 12, gameplayFacingSwapTick: 0, fighterRootDisplacement: 0 },
    notes: ['Facing changes immediately in deterministic simulation.', 'The twelve-tick artwork is non-blocking presentation and never delays legal inputs.', 'Renderer mirrors the canonical sequence from simulation-owned turnStartingFacing and never drives gameplay.']
  },
  presentationSockets: [{ id: 'character_center', x: 768, y: 900, mirrorRule: 'x_prime_equals_canvas_width_minus_x', eventTypes: ['frame_change'] }],
  presentationTrack: [],
  approvalRecords: [repoUri(hashLockPath), ...(turnApproval ? [repoUri(approvalPath)] : [])],
  validation: {
    hardGates: ['contract_shape', 'source_sha256', 'exposure_coverage', 'fixed_root', 'sequence_wide_scale', 'simulation_owned_facing', 'immediate_interrupts', 'mirror_round_trip', 'replay_checksum', 'provenance_present'],
    creativeWarnings: [turnApproval ? 'current-baseline pass carries user-requested polish debt and a revisit star' : 'awaiting_human_turn_facing_and_combined_transition_review', 'missing-state V2 authoring; no V1 turn motion is claimed', 'candidate package only; no production roster or deployment authorization'],
    humanApprovalRequired: true
  },
  provenance: {
    sourceType: 'imagegen_reference_edit_missing_state_authoring_normalized_rgba',
    tool: 'OpenAI built-in image generation plus NGA Forge deterministic normalization',
    model: null,
    createdAt: '2026-09-02T00:00:00Z',
    promptHash: null,
    seed: null,
    references: [repoUri(reportPath), repoUri(hashLockPath), repoUri(candidatePath)],
    revisionChain: ['rejected_checkerboard_and_duplicate_settle_v1', 'targeted_chroma_green_distinct_settle_v2', 'turn_facing_modernization_candidate_v1'],
    cleanupOperations: ['uniform_chroma_background_removal', 'sequence_wide_scale_only', 'fixed_root_placement', 'purple_fringe_audit'],
    humanApproval: { state: 'pending', approvedBy: null, approvedAt: null },
    licensingNotes: ['Local candidate-only Lamuh Legacy V2 transition art; not approved for shipping atlas, production roster, publication, or deployment.']
  },
  goalV1Extension: {
    reviewState: turnDecision || 'awaiting_human_turn_facing_and_combined_transition_review',
    starredForRevisit: turnStarredForRevisit,
    sourceFrameCount: 0,
    authoredFrameCount: 4,
    fixedRoot: { x: 768, y: 1360 },
    rootDisplacement: 0,
    gameplayFacingSwapDelayed: false,
    victimFrames: [],
    interactionContract: null
  }
};
writeJson(packagePath, packageRecord);

const packageRelative = 'moves/turn-facing/animation.package.json';
if (!characterBundle.animationPackages.includes(packageRelative)) {
  const after = characterBundle.animationPackages.indexOf('moves/walk-backward/animation.package.json');
  characterBundle.animationPackages.splice(after >= 0 ? after + 1 : characterBundle.animationPackages.length, 0, packageRelative);
}
characterBundle.packageGroups.movement = [...new Set([...characterBundle.packageGroups.movement, 'turn_facing'])];
writeJson(characterBundlePath, characterBundle);

const turnAudit = {
  animationName: 'turn_facing',
  sheetId: 'v2_missing_state_turn_facing_candidate',
  row: null,
  sourceFrameCount: 0,
  originalExposureTiming: { source: 'NO_DEDICATED_V1_TURN_CLIP', note: 'V1 changed facing through generic state logic and horizontal mirroring without a dedicated physical pivot animation.' },
  gameplayRole: 'grounded_facing_transition',
  historicalV1Combat: null,
  currentLamuhLegacyCombat: { durationTicks: 12, gameplayFacingSwapTick: 0, fighterRootDisplacement: 0, immediatelyInterruptible: true },
  originalHitBlockBehavior: null,
  rootBehavior: 'Fixed authored root (768, 1360); zero simulation displacement.',
  existingCollisionData: 'Standing gameplay pushbox and hurtboxes remain active; artwork has no local collision authority.',
  transitionBehavior: 'Simulation changes gameplay facing immediately, records turnStartingFacing, plays twelve non-blocking presentation ticks, and lets every legal attack/movement/defense action preempt on input.',
  vfxDependencies: [],
  audioDependencies: [],
  sourceMotionReusable: false,
  visualArtworkReusable: false,
  v2Disposition: 'MODERNIZE',
  needsV2Redesign: false,
  reviewNotes: report.sourceRepairReason
};
const existingAuditIndex = sourceAudit.animations.findIndex((entry) => entry.animationName === 'turn_facing' || entry.animationName === 'turn');
if (existingAuditIndex >= 0) sourceAudit.animations[existingAuditIndex] = turnAudit;
else sourceAudit.animations.push(turnAudit);
sourceAudit.missingV2Coverage = (sourceAudit.missingV2Coverage || []).filter((entry) => entry !== 'turn' && entry !== 'turn_facing');
const finding = 'Dedicated Turn / Facing is now authored as a four-pose, twelve-tick, fixed-root modern candidate. The deterministic simulation swaps gameplay facing immediately, preserves mirrored parity, and allows every legal action to interrupt without delay.';
if (!sourceAudit.globalFindings.includes(finding)) sourceAudit.globalFindings.push(finding);
writeJson(sourceAuditPath, sourceAudit);

const pendingTurnStatus = 'awaiting_human_turn_facing_and_combined_transition_review';
const throwReviewStatus = 'awaiting_human_standard_grab_forward_throw_back_throw_review';
const currentReviewStatus = turnApproval ? throwReviewStatus : pendingTurnStatus;
movement.status = turnApproval ? 'turn_facing_approved_for_current_baseline_with_polish_debt_remaining_movement_gates_pending' : pendingTurnStatus;
movement.states.turn_facing = state;
movement.turnFacingModernization = {
  status: 'candidate-only', candidateOnly: true, deployable: false, productionApproved: false,
  timingChanged: false, combatChanged: false, gameplayFacingSwapDelayed: false, fighterRootDisplacement: 0,
  normalizationReport: { path: repoRelative(reportPath), sha256: sha256(reportPath) },
  hashLock: { path: repoRelative(hashLockPath), sha256: sha256(hashLockPath) },
  contactSheetPublicPath: publicPathFor(contactDestination),
  contactSheetSha256: sha256(contactDestination),
  rejectedGenerationEvidence: repoRelative(rejectedEvidencePath),
  sourceRepairReason: report.sourceRepairReason,
  identityLock: { matureAdultProportions: true, boxedBeardAndMustache: true, noPurpleOutline: true, fixedIdleScale: true },
  transitionContract: { durationTicks: 12, gameplayFacingSwapTick: 0, presentationFacingSource: 'turnStartingFacing', immediatelyInterruptible: true, rendererOwnsGameplayState: false },
  humanApproval: turnDecision,
  approvalReceipt: turnApproval ? { path: repoRelative(approvalPath), sha256: sha256(approvalPath) } : null,
  starredForRevisit: turnStarredForRevisit,
  polishDebt: turnStarredForRevisit ? 'user_requested_revisit_after_current_baseline_pass' : null
};
movement.reviewQuestions = [...new Set([...movement.reviewQuestions,
  'Does Turn / Facing read as one planted body-driven pivot with feet, hips, shoulders, head, coat and locs rotating in order?',
  'Does the canonical right-to-left turn and its runtime mirror preserve the same adult anatomy scale and zero-root behavior?',
  'Can attack, jump, dash, crouch, walk and block inputs interrupt the turn naturally without a control delay?'
])];
reviewData.runtimeTimelines.turn_facing = { exposureTicks: state.exposureTicks, durationTicks: state.durationTicks, contactSourceFrames: [], contactTick: null };
const comparison = {
  clipId: 'turn_facing', sourceFrameCount: 0, v1Historical: null,
  v2Candidate: { label: 'V2_DEDICATED_TURN_FACING_MISSING_STATE_CANDIDATE', durationTicks: 12, exposureTicks: state.exposureTicks },
  humanReviewStatus: turnDecision,
  starredForRevisit: turnStarredForRevisit
};
const comparisonIndex = reviewData.comparisonClips.findIndex((entry) => entry.clipId === 'turn_facing');
if (comparisonIndex >= 0) reviewData.comparisonClips[comparisonIndex] = comparison;
else reviewData.comparisonClips.push(comparison);

firstPlayable.technicalStatus = turnApproval ? 'FIRST_PLAYABLE_TURN_FACING_CURRENT_BASELINE_THROW_REVIEW_CANDIDATE' : 'FIRST_PLAYABLE_PLUS_DEDICATED_TURN_FACING_REVIEW_CANDIDATE';
firstPlayable.humanReviewStatus = currentReviewStatus;
firstPlayable.coverage.movement = [...new Set([...firstPlayable.coverage.movement, 'turn_facing'])];
firstPlayable.knownArtDebt = firstPlayable.knownArtDebt.filter((entry) => !entry.toLowerCase().startsWith('turn art remains unauthored') && !entry.toLowerCase().startsWith('dedicated turn / facing'));
const turnDebt = turnApproval
  ? 'dedicated Turn / Facing is accepted for the current production baseline with polish debt and starred for revisit; the art remains candidate-only and is not promoted'
  : 'dedicated Turn / Facing art is authored and deterministic but remains candidate-only pending motion, mirrored parity, interruptibility, and combined-transition human review';
if (!firstPlayable.knownArtDebt.includes(turnDebt)) firstPlayable.knownArtDebt.push(turnDebt);
firstPlayable.currentReviewGate = {
  ...(firstPlayable.currentReviewGate || {}),
  status: currentReviewStatus,
  focusDecisions: turnApproval ? ['standard_grab', 'forward_throw', 'back_throw'] : ['turn_facing_motion_mirrored_parity_and_transition'],
  requiredDecisions: [...new Set([...(firstPlayable.currentReviewGate?.requiredDecisions || []), 'turn_facing_motion_mirrored_parity_and_transition', 'all_normals_idle_and_transition_combined_flow'])].filter((decision) => !turnApproval || decision !== 'turn_facing_motion_mirrored_parity_and_transition'),
  starredForRevisit: turnApproval ? [{ subject: 'turn_facing_motion_mirrored_parity_and_transition', decision: turnDecision, reason: 'user_requested_may_come_back_to_it' }] : [],
  comparisonRoute: '/lamuh-v1-v2-review.html',
  sandboxRoute: '/lamuh-legacy-sandbox.html',
  stopBoundary: 'human_review_required_before_specials_phase_or_candidate_promotion'
};
firstPlayable.forgePackageCount = characterBundle.animationPackages.length;
writeJson(firstPlayablePath, firstPlayable);

reviewData.movementModernization = movement;
reviewData.firstPlayable = firstPlayable;
reviewData.sourceAudit = sourceAudit;
reviewData.humanReviewStatus = currentReviewStatus;
reviewData.candidateOnly = true;
reviewData.deployable = false;
reviewData.authority = { renderingAuthoritative: false, simulationAuthoritative: true, candidateOnly: true, deployable: false };
writeJson(reviewDataPath, reviewData);

closurePending.currentReviewFocus = firstPlayable.currentReviewGate;
closurePending.humanReviewStatus = currentReviewStatus;
closurePending.status = 'candidate-only';
closurePending.deployable = false;
closurePending.productionApproved = false;
writeJson(closurePendingPath, closurePending);

console.log(`Built Lamuh Legacy V2 dedicated Turn / Facing candidate: four fixed-scale frames, twelve interruptible ticks, immediate simulation-owned facing swap, ${turnApproval ? 'current-baseline pass with revisit star; throw review is next' : 'awaiting human review'}; candidate-only.`);
