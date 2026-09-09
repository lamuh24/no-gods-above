const assert = require('assert');
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const { createMatch, executeReplay, recordReplay, resolveAttackDefinition, tick } = require('../dist');

const engineRoot = path.resolve(__dirname, '..');
const repoRoot = path.resolve(engineRoot, '..', '..');
const contentRoot = path.join(engineRoot, 'content-source', 'characters', 'lamuh-legacy-v2');
const standingHeavyRoot = path.join(contentRoot, 'moves', 'standing-heavy');
const reviewRoot = path.join(repoRoot, 'tools', 'nga-forge', 'review', 'lamuh-legacy-v2-standing-heavy-closure-v1');
const standingLightRoot = path.join(contentRoot, 'moves', 'standing-light');
const standingLightReviewRoot = path.join(repoRoot, 'tools', 'nga-forge', 'review', 'lamuh-legacy-v2-standing-light-v1');
const standingMediumRoot = path.join(contentRoot, 'moves', 'standing-medium');
const standingMediumReviewRoot = path.join(repoRoot, 'tools', 'nga-forge', 'review', 'lamuh-legacy-v2-standing-medium-v1');
const crouchingLightRoot = path.join(contentRoot, 'moves', 'crouching-light');
const crouchingLightReviewRoot = path.join(repoRoot, 'tools', 'nga-forge', 'review', 'lamuh-legacy-v2-crouching-light-v1');
const crouchingMediumRoot = path.join(contentRoot, 'moves', 'crouching-medium');
const crouchingMediumReviewRoot = path.join(repoRoot, 'tools', 'nga-forge', 'review', 'lamuh-legacy-v2-crouching-medium-v1');
const crouchingHeavyRoot = path.join(contentRoot, 'moves', 'crouching-heavy');
const crouchingHeavyReviewRoot = path.join(repoRoot, 'tools', 'nga-forge', 'review', 'lamuh-legacy-v2-crouching-heavy-v1');
const airNormalsReviewRoot = path.join(repoRoot, 'tools', 'nga-forge', 'review', 'lamuh-legacy-v2-air-normals-v1');
const movementReviewRoot = path.join(repoRoot, 'tools', 'nga-forge', 'review', 'lamuh-legacy-v2-movement-modernization-v1');
const crouchJumpReviewRoot = path.join(repoRoot, 'tools', 'nga-forge', 'review', 'lamuh-legacy-v2-crouch-jump-modernization-v1');
const dashBlockReviewRoot = path.join(repoRoot, 'tools', 'nga-forge', 'review', 'lamuh-legacy-v2-dash-block-modernization-v1');
const crouchingBlockReviewRoot = path.join(repoRoot, 'tools', 'nga-forge', 'review', 'lamuh-legacy-v2-crouching-block-modernization-v1');
const jumpAdultRepairReviewRoot = path.join(repoRoot, 'tools', 'nga-forge', 'review', 'lamuh-legacy-v2-jump-adult-proportion-repair-v1');
const ascendStepReviewRoot = path.join(repoRoot, 'tools', 'nga-forge', 'review', 'lamuh-legacy-v2-ascend-step-dash-punch-v2');
const read = (filename) => JSON.parse(fs.readFileSync(filename, 'utf8').replace(/^\uFEFF/, ''));
const hash = (filename) => crypto.createHash('sha256').update(fs.readFileSync(filename)).digest('hex').toUpperCase();

function testStandingHeavyMotionAndNormalizationLock() {
  const motion = read(path.join(standingHeavyRoot, 'motion-lock.v1.json'));
  const normalization = read(path.join(reviewRoot, 'normalization.report.json'));
  const sidecar = read(path.join(standingHeavyRoot, 'closure.candidate.v1.json'));
  assert.strictEqual(motion.sourceFrameCount, 7);
  assert.strictEqual(motion.hitCountContract.visibleImpacts, 1);
  assert.strictEqual(motion.hitCountContract.gameplayHits, 1);
  assert.strictEqual(motion.frames[3].role, 'high_side_kick_contact');
  assert.strictEqual(motion.frames[4].role, 'post_contact_overshoot');
  assert.strictEqual(normalization.normalization.sequenceWideScale, 1);
  assert.strictEqual(normalization.normalization.scalePolicy, 'fixed_runtime_scale_after_recorded_source_art_body_scale_correction');
  assert.strictEqual(normalization.normalization.placementPolicy, 'authored_root_landmark_alignment_not_visual_recentering');
  assert.strictEqual(normalization.frames.length, 7);
  assert.strictEqual(new Set(normalization.frames.map((frame) => frame.normalizedSha256)).size, 7);
  assert.ok(normalization.frames.every((frame) => frame.touchesEdge === false));
  assert.ok(normalization.frames.every((frame) => frame.normalizedRoot.x === 768 && frame.normalizedRoot.y === 1360));
  const transitionHeights = normalization.frames.slice(2, 5).map((frame) => frame.visibleBounds.maxY - frame.visibleBounds.minY + 1);
  assert.ok(Math.max(...transitionHeights) / Math.min(...transitionHeights) < 1.08, `launch/contact/overshoot body-height drift: ${transitionHeights.join('/')}`);
  assert.ok(normalization.frames[3].role.includes('scale_repaired'));
  assert.strictEqual(sidecar.promotionState, 'candidate');
  assert.strictEqual(sidecar.deployable, false);
  assert.strictEqual(sidecar.productionApproved, false);
  for (const frame of normalization.frames) {
    const filename = path.join(repoRoot, frame.normalizedPath);
    assert.ok(fs.existsSync(filename));
    assert.strictEqual(hash(filename), frame.normalizedSha256);
  }
  const contactBody = normalization.frames[3].normalizedSha256;
  assert.notStrictEqual(contactBody, normalization.frames[4].normalizedSha256, 'post-contact overshoot cannot duplicate contact');
  assert.notStrictEqual(contactBody, normalization.contactPresentation.sha256, 'contact body and hit composite must remain outcome-routable');
  assert.strictEqual(normalization.contactPresentation.prohibitedOutcome, 'whiff');
}

function testStandingLightSingleHitMotionAndNormalizationLock() {
  const motion = read(path.join(standingLightRoot, 'motion-lock.v1.json'));
  const normalization = read(path.join(standingLightReviewRoot, 'normalization.report.json'));
  const sidecar = read(path.join(standingLightRoot, 'closure.candidate.v1.json'));
  const review = read(path.join(engineRoot, 'public', 'lamuh-legacy-v2', 'review-data.json'));
  const closure = review.standingLightClosure;
  assert.strictEqual(motion.sourceFrameCount, 4);
  assert.strictEqual(motion.authoredFrameCount, 6);
  assert.strictEqual(motion.hitCountContract.visibleImpacts, 1);
  assert.strictEqual(motion.hitCountContract.gameplayHits, 1);
  assert.strictEqual(motion.hitCountContract.impactFrame, 2);
  assert.strictEqual(normalization.frames.length, 6);
  assert.strictEqual(new Set(normalization.frames.map((frame) => frame.normalizedSha256)).size, 6);
  assert.ok(normalization.frames.every((frame) => frame.touchesEdge === false));
  assert.ok(normalization.frames.every((frame) => frame.normalizedRoot.x === 768 && frame.normalizedRoot.y === 1360));
  assert.strictEqual(normalization.normalization.perFrameRendererScale, false);
  assert.strictEqual(normalization.normalization.placementPolicy, 'authored_root_landmark_alignment_not_visual_recentering');
  assert.ok(normalization.frames.every((frame) => Number.isFinite(frame.bodyScaleCorrection) && Number.isFinite(frame.authoredScale)));
  assert.strictEqual(normalization.visualValidation.purpleOutlineRemoved, true);
  assert.strictEqual(normalization.visualValidation.meaningfulMagentaPixelsRemaining, 0);
  assert.ok(normalization.frames.every((frame) => frame.meaningfulMagentaPixelsRemaining === 0));
  assert.strictEqual(sidecar.promotionState, 'candidate');
  assert.strictEqual(sidecar.deployable, false);
  assert.strictEqual(sidecar.productionApproved, false);
  assert.deepStrictEqual(sidecar.hitCountContract, { visibleImpacts: 1, gameplayHits: 1 });
  for (const sourceFrame of motion.legacyFrames) {
    const source = path.join(contentRoot, 'source-frames', 'standing_light', `standing_light_${String(sourceFrame.index).padStart(2, '0')}.png`);
    assert.ok(fs.existsSync(source));
    assert.strictEqual(hash(source), sourceFrame.sha256, `protected V1 Standing Light frame ${sourceFrame.index} changed`);
  }
  assert.strictEqual(closure.status, 'human_approved_standing_light_motion_and_b_retiming_candidate_base');
  assert.strictEqual(closure.candidateOnly, true);
  assert.strictEqual(closure.deployable, false);
  assert.strictEqual(closure.rendererAuthoritative, false);
  assert.strictEqual(closure.simulationAuthoritative, true);
  assert.strictEqual(closure.v1.sourceFrameCount, 4);
  assert.strictEqual(closure.v1.historicalDurationTicks, 15);
  assert.strictEqual(closure.v2.frames.length, 6);
  assert.strictEqual(closure.v2.contactFrame, 2);
  assert.strictEqual(closure.v2.visibleImpactCount, 1);
  assert.strictEqual(closure.v2.gameplayHitCount, 1);
  assert.strictEqual(closure.v2.frames.filter((frame) => frame.visibleImpact).length, 1);
  assert.strictEqual(closure.v2.frames.find((frame) => frame.visibleImpact).index, 2);
  assert.strictEqual(closure.v2.contactPresentation.bodyOnlyOnWhiff, true);
  assert.ok(!closure.v2.contactPresentation.allowedOutcomes.includes('whiff'));
  assert.deepStrictEqual(Object.values(closure.timingCandidates).map((candidate) => candidate.durationTicks), [12, 14, 17]);
  assert.deepStrictEqual(closure.timingCandidates.A.exposureTicks, [2, 1, 4, 2, 1, 2]);
  assert.deepStrictEqual(closure.timingCandidates.B.exposureTicks, [2, 1, 5, 2, 1, 3]);
  assert.deepStrictEqual(closure.timingCandidates.C.exposureTicks, [3, 1, 6, 3, 1, 3]);
  assert.deepStrictEqual(Object.values(closure.impactCandidates).map((candidate) => candidate.hitstopTicks), [3, 4, 5]);
  assert.strictEqual(closure.humanApproval.motion, 'APPROVED_V1_MOTION_PRESERVED');
  assert.strictEqual(closure.humanApproval.timing, 'APPROVED_V2_RETIMING');
  assert.strictEqual(closure.humanApproval.selectedTimingCandidate, 'B');
  assert.strictEqual(closure.humanApproval.combatProfile, null);
  for (const frame of closure.v2.frames) {
    const filename = path.join(engineRoot, 'public', frame.publicPath.replace(/^\//, ''));
    assert.ok(fs.existsSync(filename), frame.publicPath);
    assert.strictEqual(hash(filename), frame.sha256);
  }
  assert.notStrictEqual(closure.v2.frames[2].sha256, closure.v2.frames[3].sha256, 'contact and follow-through cannot duplicate');
  assert.notStrictEqual(closure.v2.frames[2].sha256, closure.v2.contactPresentation.sha256, 'contact body and outcome-routed composite must remain distinct');
}

function testStandingMediumSingleHitMotionAndNormalizationLock() {
  const motion = read(path.join(standingMediumRoot, 'motion-lock.v1.json'));
  const normalization = read(path.join(standingMediumReviewRoot, 'normalization.report.json'));
  const sidecar = read(path.join(standingMediumRoot, 'closure.candidate.v1.json'));
  const review = read(path.join(engineRoot, 'public', 'lamuh-legacy-v2', 'review-data.json'));
  const closure = review.standingMediumClosure;
  assert.strictEqual(motion.sourceFrameCount, 8);
  assert.strictEqual(motion.authoredFrameCount, 8);
  assert.strictEqual(motion.modernizationDecision.classification, 'MODERNIZE');
  assert.strictEqual(motion.hitCountContract.visibleImpacts, 1);
  assert.strictEqual(motion.hitCountContract.gameplayHits, 1);
  assert.strictEqual(motion.hitCountContract.impactFrame, 4);
  assert.strictEqual(motion.strikingLimb, 'rear_arm_same_limb_through_contact_and_recovery');
  assert.strictEqual(normalization.frames.length, 8);
  assert.strictEqual(new Set(normalization.frames.map((frame) => frame.normalizedSha256)).size, 8);
  assert.ok(normalization.frames.every((frame) => frame.touchesEdge === false));
  assert.ok(normalization.frames.every((frame) => frame.normalizedRoot.x === 768 && frame.normalizedRoot.y === 1360));
  assert.strictEqual(normalization.normalization.perFrameRendererScale, false);
  assert.strictEqual(normalization.normalization.placementPolicy, 'authored_root_landmark_alignment_not_visual_recentering');
  assert.ok(normalization.frames.every((frame) => Number.isFinite(frame.bodyScaleCorrection) && Number.isFinite(frame.authoredScale)));
  assert.strictEqual(normalization.visualValidation.purpleOutlineRemoved, true);
  assert.strictEqual(normalization.visualValidation.meaningfulMagentaPixelsRemaining, 0);
  assert.ok(normalization.frames.every((frame) => frame.meaningfulMagentaPixelsRemaining === 0));
  assert.strictEqual(sidecar.promotionState, 'candidate');
  assert.strictEqual(sidecar.deployable, false);
  assert.strictEqual(sidecar.productionApproved, false);
  assert.deepStrictEqual(sidecar.hitCountContract, { visibleImpacts: 1, gameplayHits: 1 });
  for (const sourceFrame of motion.legacyFrames) {
    const source = path.join(contentRoot, 'source-frames', 'standing_medium', `standing_medium_${String(sourceFrame.index).padStart(2, '0')}.png`);
    assert.ok(fs.existsSync(source));
    assert.strictEqual(hash(source), sourceFrame.sha256, `protected V1 Standing Medium frame ${sourceFrame.index} changed`);
  }
  assert.strictEqual(closure.status, 'human_approved_standing_medium_motion_and_b_retiming_candidate_base');
  assert.strictEqual(closure.candidateOnly, true);
  assert.strictEqual(closure.deployable, false);
  assert.strictEqual(closure.rendererAuthoritative, false);
  assert.strictEqual(closure.simulationAuthoritative, true);
  assert.strictEqual(closure.v1.sourceFrameCount, 8);
  assert.strictEqual(closure.v1.historicalDurationTicks, 21);
  assert.strictEqual(closure.v2.frames.length, 8);
  assert.strictEqual(closure.v2.contactFrame, 4);
  assert.strictEqual(closure.v2.visibleImpactCount, 1);
  assert.strictEqual(closure.v2.gameplayHitCount, 1);
  assert.strictEqual(closure.v2.frames.filter((frame) => frame.visibleImpact).length, 1);
  assert.strictEqual(closure.v2.frames.find((frame) => frame.visibleImpact).index, 4);
  assert.strictEqual(closure.v2.contactPresentation.bodyOnlyOnWhiff, true);
  assert.ok(!closure.v2.contactPresentation.allowedOutcomes.includes('whiff'));
  assert.deepStrictEqual(Object.values(closure.timingCandidates).map((candidate) => candidate.durationTicks), [20, 23, 27]);
  assert.deepStrictEqual(closure.timingCandidates.A.exposureTicks, [2, 1, 1, 1, 5, 4, 2, 4]);
  assert.deepStrictEqual(closure.timingCandidates.B.exposureTicks, [2, 2, 1, 1, 6, 4, 3, 4]);
  assert.deepStrictEqual(closure.timingCandidates.C.exposureTicks, [3, 2, 1, 1, 7, 5, 3, 5]);
  assert.deepStrictEqual(Object.values(closure.impactCandidates).map((candidate) => candidate.hitstopTicks), [5, 6, 7]);
  assert.strictEqual(closure.humanApproval.motion, 'APPROVED_V1_MOTION_PRESERVED');
  assert.strictEqual(closure.humanApproval.timing, 'APPROVED_V2_RETIMING');
  assert.strictEqual(closure.humanApproval.selectedTimingCandidate, 'B');
  assert.strictEqual(closure.humanApproval.combatProfile, null);
  for (const frame of closure.v2.frames) {
    const filename = path.join(engineRoot, 'public', frame.publicPath.replace(/^\//, ''));
    assert.ok(fs.existsSync(filename), frame.publicPath);
    assert.strictEqual(hash(filename), frame.sha256);
  }
  assert.notStrictEqual(closure.v2.frames[4].sha256, closure.v2.frames[5].sha256, 'contact and shoulder overshoot cannot duplicate');
  assert.notStrictEqual(closure.v2.frames[4].sha256, closure.v2.contactPresentation.sha256, 'contact body and outcome-routed composite must remain distinct');
}

function testCrouchingLightDistinctLowMotionAndNormalizationLock() {
  const motion = read(path.join(crouchingLightRoot, 'motion-lock.v1.json'));
  const normalization = read(path.join(crouchingLightReviewRoot, 'normalization.report.json'));
  const sidecar = read(path.join(crouchingLightRoot, 'closure.candidate.v1.json'));
  const review = read(path.join(engineRoot, 'public', 'lamuh-legacy-v2', 'review-data.json'));
  const closure = review.crouchingLightClosure;
  assert.strictEqual(motion.status, 'V1_ALIAS_EVIDENCE_LOCKED_FOR_DISTINCT_V2_LOW_ATTACK_MODERNIZATION');
  assert.strictEqual(motion.legacySourceFrameCount, 4);
  assert.strictEqual(motion.authoredFrameCount, 7);
  assert.strictEqual(motion.modernizationDecision.classification, 'MODERNIZE');
  assert.strictEqual(motion.hitCountContract.visibleImpacts, 1);
  assert.strictEqual(motion.hitCountContract.gameplayHits, 1);
  assert.strictEqual(motion.hitCountContract.impactFrame, 3);
  assert.strictEqual(motion.strikingLimb, 'lead_arm_same_limb_low_palm_check_through_contact_and_recovery');
  assert.strictEqual(normalization.frames.length, 7);
  assert.strictEqual(new Set(normalization.frames.map((frame) => frame.normalizedSha256)).size, 7);
  assert.ok(normalization.frames.every((frame) => frame.touchesEdge === false));
  assert.ok(normalization.frames.every((frame) => frame.normalizedRoot.x === 768 && frame.normalizedRoot.y === 1360));
  assert.strictEqual(normalization.normalization.perFrameRendererScale, false);
  assert.strictEqual(normalization.normalization.placementPolicy, 'authored_root_landmark_alignment_not_visual_recentering');
  assert.ok(normalization.frames.every((frame) => Number.isFinite(frame.bodyScaleCorrection) && Number.isFinite(frame.authoredScale)));
  assert.strictEqual(normalization.visualValidation.purpleOutlineRemoved, true);
  assert.strictEqual(normalization.visualValidation.meaningfulMagentaPixelsRemaining, 0);
  assert.ok(normalization.frames.every((frame) => frame.meaningfulMagentaPixelsRemaining === 0));
  assert.strictEqual(sidecar.promotionState, 'candidate');
  assert.strictEqual(sidecar.deployable, false);
  assert.strictEqual(sidecar.productionApproved, false);
  assert.deepStrictEqual(sidecar.hitCountContract, { visibleImpacts: 1, gameplayHits: 1 });
  for (const sourceFrame of motion.legacyFrames) {
    const source = path.join(contentRoot, 'source-frames', 'standing_light', `standing_light_${String(sourceFrame.index).padStart(2, '0')}.png`);
    assert.ok(fs.existsSync(source));
    assert.strictEqual(hash(source), sourceFrame.sha256, `protected V1 Crouching Light alias frame ${sourceFrame.index} changed`);
  }
  assert.strictEqual(closure.status, 'human_approved_crouching_light_motion_and_b_retiming_candidate_base');
  assert.strictEqual(closure.candidateOnly, true);
  assert.strictEqual(closure.deployable, false);
  assert.strictEqual(closure.rendererAuthoritative, false);
  assert.strictEqual(closure.simulationAuthoritative, true);
  assert.strictEqual(closure.v1.sourceFrameCount, 4);
  assert.strictEqual(closure.v1.historicalDurationTicks, 14);
  assert.strictEqual(closure.v2.frames.length, 7);
  assert.strictEqual(closure.v2.contactFrame, 3);
  assert.strictEqual(closure.v2.visibleImpactCount, 1);
  assert.strictEqual(closure.v2.gameplayHitCount, 1);
  assert.strictEqual(closure.v2.frames.filter((frame) => frame.visibleImpact).length, 1);
  assert.strictEqual(closure.v2.frames.find((frame) => frame.visibleImpact).index, 3);
  assert.strictEqual(closure.v2.contactPresentation.bodyOnlyOnWhiff, true);
  assert.ok(!closure.v2.contactPresentation.allowedOutcomes.includes('whiff'));
  assert.deepStrictEqual(Object.values(closure.timingCandidates).map((candidate) => candidate.durationTicks), [12, 14, 17]);
  assert.deepStrictEqual(closure.timingCandidates.A.exposureTicks, [1, 1, 1, 3, 3, 2, 1]);
  assert.deepStrictEqual(closure.timingCandidates.B.exposureTicks, [1, 1, 1, 4, 3, 2, 2]);
  assert.deepStrictEqual(closure.timingCandidates.C.exposureTicks, [2, 1, 1, 5, 3, 3, 2]);
  assert.deepStrictEqual(Object.values(closure.impactCandidates).map((candidate) => candidate.hitstopTicks), [2, 3, 4]);
  assert.strictEqual(closure.humanApproval.motion, 'APPROVED_V1_MOTION_PRESERVED');
  assert.strictEqual(closure.humanApproval.timing, 'APPROVED_V2_RETIMING');
  assert.strictEqual(closure.humanApproval.selectedTimingCandidate, 'B');
  assert.strictEqual(closure.humanApproval.combatProfile, null);
  for (const frame of closure.v2.frames) {
    const filename = path.join(engineRoot, 'public', frame.publicPath.replace(/^\//, ''));
    assert.ok(fs.existsSync(filename), frame.publicPath);
    assert.strictEqual(hash(filename), frame.sha256);
  }
  assert.notStrictEqual(closure.v2.frames[3].sha256, closure.v2.frames[4].sha256, 'contact and follow-through cannot duplicate');
  assert.notStrictEqual(closure.v2.frames[3].sha256, closure.v2.contactPresentation.sha256, 'contact body and outcome-routed composite must remain distinct');
}

function testCrouchingMediumSweepLineMotionAndNormalizationLock() {
  const motion = read(path.join(crouchingMediumRoot, 'motion-lock.v1.json'));
  const normalization = read(path.join(crouchingMediumReviewRoot, 'normalization.report.json'));
  const sidecar = read(path.join(crouchingMediumRoot, 'closure.candidate.v1.json'));
  const review = read(path.join(engineRoot, 'public', 'lamuh-legacy-v2', 'review-data.json'));
  const closure = review.crouchingMediumClosure;
  assert.strictEqual(motion.status, 'V1_ALIAS_EVIDENCE_LOCKED_FOR_DISTINCT_V2_LOW_SWEEP_MODERNIZATION');
  assert.strictEqual(motion.legacySourceFrameCount, 8);
  assert.strictEqual(motion.authoredFrameCount, 8);
  assert.strictEqual(motion.modernizationDecision.classification, 'MODERNIZE');
  assert.strictEqual(motion.hitCountContract.visibleImpacts, 1);
  assert.strictEqual(motion.hitCountContract.gameplayHits, 1);
  assert.strictEqual(motion.hitCountContract.impactFrame, 3);
  assert.strictEqual(motion.strikingLimb, 'lead_leg_same_limb_low_sweep_through_contact_follow_through_and_retraction');
  assert.strictEqual(normalization.frames.length, 8);
  assert.strictEqual(new Set(normalization.frames.map((frame) => frame.normalizedSha256)).size, 8);
  assert.ok(normalization.frames.every((frame) => frame.touchesEdge === false));
  assert.ok(normalization.frames.every((frame) => frame.normalizedRoot.x === 768 && frame.normalizedRoot.y === 1360));
  assert.strictEqual(normalization.normalization.perFrameRendererScale, false);
  assert.ok(normalization.normalization.placementPolicy.includes('authored_hip_and_support-foot_root_landmark_alignment'));
  assert.strictEqual(normalization.visualValidation.purpleOutlineRemoved, true);
  assert.strictEqual(normalization.visualValidation.meaningfulMagentaPixelsRemaining, 0);
  assert.strictEqual(normalization.visualValidation.contactBodyScaleInvariant, true);
  assert.ok(normalization.frames.every((frame) => frame.meaningfulMagentaPixelsRemaining === 0));
  assert.strictEqual(sidecar.promotionState, 'candidate');
  assert.strictEqual(sidecar.deployable, false);
  assert.strictEqual(sidecar.productionApproved, false);
  assert.deepStrictEqual(sidecar.hitCountContract, { visibleImpacts: 1, gameplayHits: 1 });
  for (const sourceFrame of motion.legacyFrames) {
    const source = path.join(contentRoot, 'source-frames', 'standing_medium', `standing_medium_${String(sourceFrame.index).padStart(2, '0')}.png`);
    assert.ok(fs.existsSync(source));
    assert.strictEqual(hash(source), sourceFrame.sha256, `protected V1 Crouching Medium alias frame ${sourceFrame.index} changed`);
  }
  assert.strictEqual(closure.status, 'human_approved_crouching_medium_motion_and_b_retiming_candidate_base');
  assert.strictEqual(closure.candidateOnly, true);
  assert.strictEqual(closure.deployable, false);
  assert.strictEqual(closure.rendererAuthoritative, false);
  assert.strictEqual(closure.simulationAuthoritative, true);
  assert.strictEqual(closure.v1.sourceFrameCount, 8);
  assert.strictEqual(closure.v1.historicalDurationTicks, 19);
  assert.strictEqual(closure.v2.frames.length, 8);
  assert.strictEqual(closure.v2.contactFrame, 3);
  assert.strictEqual(closure.v2.visibleImpactCount, 1);
  assert.strictEqual(closure.v2.gameplayHitCount, 1);
  assert.strictEqual(closure.v2.frames.filter((frame) => frame.visibleImpact).length, 1);
  assert.strictEqual(closure.v2.frames.find((frame) => frame.visibleImpact).index, 3);
  assert.strictEqual(closure.v2.contactPresentation.bodyOnlyOnWhiff, true);
  assert.ok(!closure.v2.contactPresentation.allowedOutcomes.includes('whiff'));
  assert.deepStrictEqual(Object.values(closure.timingCandidates).map((candidate) => candidate.durationTicks), [19, 22, 25]);
  assert.deepStrictEqual(closure.timingCandidates.A.exposureTicks, [2, 2, 1, 4, 3, 3, 2, 2]);
  assert.deepStrictEqual(closure.timingCandidates.B.exposureTicks, [3, 2, 1, 5, 3, 3, 2, 3]);
  assert.deepStrictEqual(closure.timingCandidates.C.exposureTicks, [4, 2, 1, 6, 4, 3, 2, 3]);
  assert.deepStrictEqual(Object.values(closure.impactCandidates).map((candidate) => candidate.hitstopTicks), [4, 5, 6]);
  assert.strictEqual(closure.humanApproval.motion, 'APPROVED_V1_MOTION_PRESERVED');
  assert.strictEqual(closure.humanApproval.timing, 'APPROVED_V2_RETIMING');
  assert.strictEqual(closure.humanApproval.selectedTimingCandidate, 'B');
  assert.strictEqual(closure.humanApproval.combatProfile, null);
  for (const frame of closure.v2.frames) {
    const filename = path.join(engineRoot, 'public', frame.publicPath.replace(/^\//, ''));
    assert.ok(fs.existsSync(filename), frame.publicPath);
    assert.strictEqual(hash(filename), frame.sha256);
  }
  assert.notStrictEqual(closure.v2.frames[3].sha256, closure.v2.frames[4].sha256, 'contact and same-leg follow-through cannot duplicate');
  assert.notStrictEqual(closure.v2.frames[3].sha256, closure.v2.contactPresentation.sha256, 'contact body and outcome-routed composite must remain distinct');
}

function testCrouchingHeavyCrownRiserMotionAndNormalizationLock() {
  const motion = read(path.join(crouchingHeavyRoot, 'motion-lock.v1.json'));
  const normalization = read(path.join(crouchingHeavyReviewRoot, 'normalization.report.json'));
  const sidecar = read(path.join(crouchingHeavyRoot, 'closure.candidate.v1.json'));
  const review = read(path.join(engineRoot, 'public', 'lamuh-legacy-v2', 'review-data.json'));
  const closure = review.crouchingHeavyClosure;
  assert.strictEqual(motion.status, 'V1_MOTION_HASH_LOCKED_FOR_OUTLINE_FREE_V2_RECONSTRUCTION');
  assert.strictEqual(motion.modernizationDecision.classification, 'PRESERVE_WITH_V2_COMBAT_UPDATE');
  assert.strictEqual(motion.strikingLimb, 'rear_hand_same_arm_from_low_coil_through_rising_contact_follow_through_and_guard_recovery');
  assert.strictEqual(motion.hitCountContract.visibleImpacts, 1);
  assert.strictEqual(motion.hitCountContract.gameplayHits, 1);
  assert.strictEqual(motion.hitCountContract.impactFrame, 3);
  assert.deepStrictEqual(motion.legacySource.duplicateEvidence.frames, [4, 5]);
  assert.strictEqual(normalization.frames.length, 7);
  assert.strictEqual(new Set(normalization.frames.map((frame) => frame.normalizedSha256)).size, 7);
  assert.ok(normalization.frames.every((frame) => frame.touchesEdge === false));
  assert.ok(normalization.frames.every((frame) => frame.normalizedRoot.x === 768 && frame.normalizedRoot.y === 1360));
  assert.strictEqual(normalization.normalization.sequenceWideScale, 0.95);
  assert.strictEqual(normalization.normalization.perFrameRendererScale, false);
  assert.strictEqual(normalization.visualValidation.purpleOutlineRemoved, true);
  assert.strictEqual(normalization.visualValidation.meaningfulMagentaPixelsRemaining, 0);
  assert.strictEqual(normalization.visualValidation.userRequestedDownHeavyScaleCorrection, 0.95);
  assert.strictEqual(normalization.visualValidation.sequenceWideCorrectionOnly, true);
  assert.ok(normalization.visualValidation.maxContactNeighborSilhouetteHeightDeltaPct <= normalization.visualValidation.contactSilhouetteHeightRegressionThresholdPct);
  assert.ok(normalization.frames.every((frame) => frame.meaningfulMagentaPixelsRemaining === 0));
  assert.strictEqual(sidecar.promotionState, 'candidate');
  assert.strictEqual(sidecar.deployable, false);
  assert.strictEqual(sidecar.productionApproved, false);
  assert.deepStrictEqual(sidecar.hitCountContract, { visibleImpacts: 1, gameplayHits: 1 });
  for (const sourceFrame of motion.legacyFrames) {
    const source = path.join(contentRoot, 'source-frames', 'crouching_heavy', `crouching_heavy_${String(sourceFrame.index).padStart(2, '0')}.png`);
    assert.ok(fs.existsSync(source));
    assert.strictEqual(hash(source), sourceFrame.sha256, `protected V1 Crouching Heavy frame ${sourceFrame.index} changed`);
  }
  assert.strictEqual(closure.status, 'awaiting_human_crouching_heavy_motion_and_timing_review');
  assert.strictEqual(closure.candidateOnly, true);
  assert.strictEqual(closure.deployable, false);
  assert.strictEqual(closure.rendererAuthoritative, false);
  assert.strictEqual(closure.simulationAuthoritative, true);
  assert.strictEqual(closure.v1.sourceFrameCount, 7);
  assert.strictEqual(closure.v1.historicalDurationTicks, 31);
  assert.strictEqual(closure.v2.frames.length, 7);
  assert.strictEqual(closure.v2.contactFrame, 3);
  assert.strictEqual(closure.v2.visibleImpactCount, 1);
  assert.strictEqual(closure.v2.gameplayHitCount, 1);
  assert.strictEqual(closure.v2.singleSequenceScale, 0.95);
  assert.strictEqual(closure.v2.frames.filter((frame) => frame.visibleImpact).length, 1);
  assert.strictEqual(closure.v2.contactPresentation.bodyOnlyOnWhiff, true);
  assert.strictEqual(closure.v2.contactPresentation.bodyOnlyForAllOutcomes, true);
  assert.strictEqual(closure.v2.contactPresentation.vfxEnabled, false);
  assert.strictEqual(closure.v2.contactPresentation.classification, 'DISABLE_FOR_NOW');
  assert.deepStrictEqual(closure.v2.contactPresentation.allowedOutcomes, []);
  assert.deepStrictEqual(Object.values(closure.timingCandidates).map((candidate) => candidate.durationTicks), [31, 37, 43]);
  assert.deepStrictEqual(closure.timingCandidates.A.exposureTicks, [5, 3, 2, 4, 5, 5, 7]);
  assert.deepStrictEqual(closure.timingCandidates.B.exposureTicks, [5, 3, 2, 5, 6, 7, 9]);
  assert.deepStrictEqual(closure.timingCandidates.C.exposureTicks, [6, 4, 2, 6, 7, 8, 10]);
  assert.deepStrictEqual(Object.values(closure.impactCandidates).map((candidate) => candidate.hitstopTicks), [6, 7, 8]);
  assert.strictEqual(closure.humanApproval.motion, null);
  assert.strictEqual(closure.humanApproval.timing, null);
  assert.strictEqual(closure.humanApproval.selectedTimingCandidate, null);
  assert.strictEqual(closure.humanApproval.combatProfile, null);
  for (const frame of closure.v2.frames) {
    const filename = path.join(engineRoot, 'public', frame.publicPath.replace(/^\//, ''));
    assert.ok(fs.existsSync(filename), frame.publicPath);
    assert.strictEqual(hash(filename), frame.sha256);
  }
  assert.notStrictEqual(closure.v2.frames[3].sha256, closure.v2.frames[4].sha256, 'contact and same-arm follow-through cannot duplicate');
  assert.strictEqual(closure.v2.frames[3].sha256, closure.v2.contactPresentation.sha256, 'Down Heavy contact must remain body-only for every outcome');
  assert.strictEqual(closure.v2.frames[3].publicPath, closure.v2.contactPresentation.publicPath, 'Down Heavy contact presentation must reference the body frame directly');
}

function testAirNormalBatchMotionScaleAndBodyOnlyContactLock() {
  const normalization = read(path.join(airNormalsReviewRoot, 'normalization.report.json'));
  const review = read(path.join(engineRoot, 'public', 'lamuh-legacy-v2', 'review-data.json'));
  assert.strictEqual(normalization.status, 'candidate-only');
  assert.strictEqual(normalization.deployable, false);
  assert.strictEqual(normalization.protectedLegacyAtlas.sha256, '1FFCD0B944A166F6DB7B79D485030741A9A2BF85C4C1CD47C6B4F3D76D9E249F');
  assert.strictEqual(normalization.moves.reduce((sum, move) => sum + move.authoredFrameCount, 0), 18);
  assert.strictEqual(normalization.visualValidation.meaningfulMagentaPixelsRemaining, 0);
  assert.strictEqual(normalization.visualValidation.touchesEdge, false);
  assert.strictEqual(normalization.visualValidation.allFramesDistinct, true);
  assert.strictEqual(normalization.visualValidation.visibleImpactParity, true);
  assert.ok(normalization.visualValidation.crossMoveFirstFrameHeightDeltaPct <= 8);
  assert.deepStrictEqual(normalization.visualValidation.crossMoveFirstFrameVisibleHeights, [812, 823, 814]);
  assert.deepStrictEqual(review.firstPlayable.coverage.airNormals, ['air_light', 'air_medium', 'air_heavy']);
  assert.strictEqual(review.airNormalsBatch.candidateOnly, true);
  assert.strictEqual(review.airNormalsBatch.deployable, false);
  const contactSheet = path.join(engineRoot, 'public', review.airNormalsBatch.contactSheetPublicPath.replace(/^\//, ''));
  assert.ok(fs.existsSync(contactSheet));
  assert.strictEqual(hash(contactSheet), review.airNormalsBatch.contactSheetSha256);

  const expected = {
    air_light: { closure: review.airLightClosure, frames: 5, contacts: [2], hits: 1, scale: 1.96, durations: [11, 13, 15], disposition: 'MODERNIZE' },
    air_medium: { closure: review.airMediumClosure, frames: 6, contacts: [2], hits: 1, scale: 2.4, durations: [19, 21, 24], disposition: 'MODERNIZE' },
    air_heavy: { closure: review.airHeavyClosure, frames: 7, contacts: [3], hits: 1, scale: 3, durations: [27, 30, 35], disposition: 'MODERNIZE' }
  };
  for (const [moveId, record] of Object.entries(expected)) {
    const moveReport = normalization.moves.find((move) => move.moveId === moveId);
    const motion = read(path.join(contentRoot, 'moves', moveId.replaceAll('_', '-'), 'motion-lock.v1.json'));
    const sidecar = read(path.join(contentRoot, 'moves', moveId.replaceAll('_', '-'), 'closure.candidate.v1.json'));
    const packageValue = read(path.join(contentRoot, 'moves', moveId.replaceAll('_', '-'), 'animation.package.json'));
    assert.strictEqual(moveReport.v2Disposition, record.disposition);
    assert.strictEqual(motion.motionPolicy.v2Disposition, record.disposition);
    assert.strictEqual(motion.legacyFrames.length, record.frames);
    assert.strictEqual(motion.hitCountContract.impactFrame, record.contacts[0]);
    assert.deepStrictEqual(motion.hitCountContract, { impactFrame: record.contacts[0], impactFrames: record.contacts, visibleImpacts: record.hits, gameplayHits: record.hits });
    for (const legacyFrame of motion.legacyFrames) {
      const source = path.join(repoRoot, legacyFrame.path);
      assert.ok(fs.existsSync(source));
      assert.strictEqual(hash(source), legacyFrame.sha256, `protected V1 ${moveId} frame ${legacyFrame.index} changed`);
    }
    assert.strictEqual(record.closure.status, 'awaiting_human_air_normal_motion_scale_and_timing_review');
    assert.strictEqual(record.closure.candidateOnly, true);
    assert.strictEqual(record.closure.deployable, false);
    assert.strictEqual(record.closure.v2.frames.length, record.frames);
    assert.strictEqual(record.closure.v2.contactFrame, record.contacts[0]);
    assert.deepStrictEqual(record.closure.v2.contactFrames, record.contacts);
    assert.strictEqual(record.closure.v2.singleSequenceScale, record.scale);
    assert.strictEqual(record.closure.v2.visibleImpactCount, record.hits);
    assert.strictEqual(record.closure.v2.gameplayHitCount, record.hits);
    assert.strictEqual(record.closure.v2.frames.filter((frame) => frame.visibleImpact).length, record.hits);
    assert.strictEqual(record.closure.v2.contactPresentation.vfxEnabled, false);
    assert.strictEqual(record.closure.v2.contactPresentation.bodyOnlyForAllOutcomes, true);
    assert.deepStrictEqual(record.closure.v2.contactPresentation.allowedOutcomes, []);
    assert.strictEqual(record.closure.v2.frames[record.contacts[0]].sha256, record.closure.v2.contactPresentation.sha256);
    assert.deepStrictEqual(record.closure.v2.contactPresentation.contacts.map((contact) => contact.frame), record.contacts);
    assert.deepStrictEqual(Object.values(record.closure.timingCandidates).map((candidate) => candidate.durationTicks), record.durations);
    assert.strictEqual(new Set(record.closure.v2.frames.map((frame) => frame.sha256)).size, record.frames);
    for (const frame of record.closure.v2.frames) {
      const filename = path.join(engineRoot, 'public', frame.publicPath.replace(/^\//, ''));
      assert.ok(fs.existsSync(filename), frame.publicPath);
      assert.strictEqual(hash(filename), frame.sha256);
    }
    assert.strictEqual(sidecar.vfxEnabled, false);
    assert.strictEqual(packageValue.promotionState, 'candidate');
    assert.strictEqual(packageValue.sourceFrames.length, record.frames);
    assert.deepStrictEqual(packageValue.presentationTrack, []);
  }
}

function testModernMovementCombinedPlaytestPackage() {
  const report = read(path.join(movementReviewRoot, 'normalization.report.json'));
  const crouchJumpReport = read(path.join(crouchJumpReviewRoot, 'normalization.report.json'));
  const crouchJumpHashLock = read(path.join(contentRoot, 'records', 'crouch-jump-modernization-v1.hash-lock.json'));
  const dashBlockReport = read(path.join(dashBlockReviewRoot, 'normalization.report.json'));
  const dashBlockHashLock = read(path.join(contentRoot, 'records', 'dash-block-modernization-v1.hash-lock.json'));
  const crouchingBlockReport = read(path.join(crouchingBlockReviewRoot, 'normalization.report.json'));
  const jumpAdultRepairReport = read(path.join(jumpAdultRepairReviewRoot, 'normalization.report.json'));
  const hashLock = read(path.join(contentRoot, 'records', 'movement-modernization-v1.hash-lock.json'));
  const review = read(path.join(engineRoot, 'public', 'lamuh-legacy-v2', 'review-data.json'));
  const movement = review.movementModernization;
  assert.strictEqual(report.status, 'candidate-only');
  assert.strictEqual(report.deployable, false);
  assert.strictEqual(report.sourceFrameCount, 218);
  assert.strictEqual(report.authoredFrameCount, 37);
  assert.strictEqual(report.frames.length, 37);
  assert.strictEqual(new Set(report.frames.map((frame) => frame.normalizedSha256)).size, 37);
  assert.ok(report.frames.every((frame) => frame.touchesEdge === false));
  assert.ok(report.frames.every((frame) => frame.meaningfulMagentaPixelsRemaining === 0));
  assert.ok(report.frames.every((frame) => frame.normalizedRoot.x === 768 && frame.normalizedRoot.y === 1360));
  assert.strictEqual(report.normalization.perFrameRendererScale, false);
  assert.strictEqual(report.visualValidation.purpleOutlineRemoved, true);
  assert.strictEqual(hashLock.status, 'HASH_LOCKED_CANDIDATE_ONLY');
  assert.strictEqual(hashLock.deployable, false);
  assert.strictEqual(hashLock.legacySourceImmutable, true);
  assert.strictEqual(hashLock.frames.length, 37);
  assert.deepStrictEqual(hashLock.sourceSelection.idle, [0, 2, 4, 6]);
  assert.deepStrictEqual(hashLock.sourceSelection.walk_forward_video, [0, 12, 24, 36, 48, 60, 72, 84, 96, 108, 120, 132, 144, 156, 168, 180]);
  assert.deepStrictEqual(hashLock.sourceSelection.air_dash_forward, [0, 1, 2, 3, 4, 5]);
  assert.deepStrictEqual(hashLock.sourceSelection.air_dash_backward, [0, 1, 2, 3, 4]);
  assert.deepStrictEqual(hashLock.sourceSelection.retiredExactDuplicate, { state: 'air_dash_backward', legacyFrame: 5, duplicateOf: 4 });
  assert.strictEqual(hashLock.sourceVideo.sha256, report.sourceVideo.sha256);
  assert.strictEqual(movement.status, 'turn_facing_approved_for_current_baseline_with_polish_debt_remaining_movement_gates_pending');
  assert.strictEqual(movement.candidateOnly, true);
  assert.strictEqual(movement.deployable, false);
  assert.strictEqual(movement.rendererAuthoritative, false);
  assert.strictEqual(movement.simulationAuthoritative, true);
  assert.strictEqual(movement.perFrameRescale, false);
  assert.deepStrictEqual(movement.states.idle.exposureTicks, [15, 15, 15, 15]);
  assert.deepStrictEqual(movement.states.walk_forward.exposureTicks, [2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2]);
  assert.deepStrictEqual(movement.states.walk_backward.exposureTicks, [3, 3, 2, 3, 2, 2, 3]);
  assert.deepStrictEqual(movement.states.dash_forward.exposureTicks, [3, 3, 3, 3, 3, 3]);
  assert.deepStrictEqual(movement.states.dash_backward.exposureTicks, [4, 4, 4, 4, 4]);
  assert.deepStrictEqual(movement.states.air_dash_forward.exposureTicks, [2, 2, 2, 3, 3, 2]);
  assert.deepStrictEqual(movement.states.air_dash_backward.exposureTicks, [2, 2, 3, 3, 4]);
  assert.deepStrictEqual(movement.states.standing_block.exposureTicks, [4, 4, 4, 4]);
  assert.deepStrictEqual(movement.states.crouching_block.exposureTicks, [3, 3, 4, 6]);
  assert.deepStrictEqual(movement.states.crouch.exposureTicks, [3, 3, 6, 6, 4, 4]);
  assert.deepStrictEqual(movement.states.crouch_to_stand.exposureTicks, [4, 4]);
  assert.deepStrictEqual(movement.states.jump.exposureTicks, [4, 3, 5, 4, 5, 4, 3]);
  assert.strictEqual(movement.states.idle.durationTicks, 60);
  assert.strictEqual(movement.states.walk_forward.durationTicks, 32);
  assert.strictEqual(movement.states.walk_backward.durationTicks, 18);
  assert.strictEqual(movement.states.dash_forward.durationTicks, 18);
  assert.strictEqual(movement.states.dash_backward.durationTicks, 20);
  assert.strictEqual(movement.states.air_dash_forward.durationTicks, 14);
  assert.strictEqual(movement.states.air_dash_backward.durationTicks, 14);
  assert.strictEqual(movement.states.standing_block.durationTicks, 16);
  assert.strictEqual(movement.states.crouching_block.durationTicks, 16);
  assert.strictEqual(movement.states.crouch.durationTicks, 26);
  assert.strictEqual(movement.states.crouch_to_stand.durationTicks, 8);
  assert.strictEqual(movement.states.jump.durationTicks, 28);
  assert.deepStrictEqual([movement.states.idle.frames.length, movement.states.walk_forward.frames.length, movement.states.walk_backward.frames.length, movement.states.dash_forward.frames.length, movement.states.dash_backward.frames.length, movement.states.air_dash_forward.frames.length, movement.states.air_dash_backward.frames.length, movement.states.standing_block.frames.length, movement.states.crouching_block.frames.length], [4, 16, 7, 6, 5, 6, 5, 4, 4]);
  assert.deepStrictEqual(movement.states.walk_forward.frames.map((frame) => frame.sourceFrameIndex), [0, 12, 24, 36, 48, 60, 72, 84, 96, 108, 120, 132, 144, 156, 168, 180]);
  assert.ok(movement.states.walk_forward.frames.every((frame) => frame.sourceType === 'user_video'));
  for (const stateId of ['dash_forward', 'dash_backward', 'air_dash_forward', 'air_dash_backward', 'standing_block']) {
    assert.ok(movement.states[stateId].frames.every((frame) => frame.sourceType === 'imagegen_reference_edit'));
    assert.strictEqual(new Set(movement.states[stateId].frames.map((frame) => frame.sourceScaleCorrection)).size, 1, `${stateId} frames must share one fixed anatomy scale`);
  }
  assert.strictEqual(new Set(movement.states.walk_forward.frames.map((frame) => frame.sourceScaleCorrection)).size, 1, 'forward walk must use one source-camera scale');
  assert.ok(Object.values(movement.states).flatMap((state) => state.frames).every((frame) => Number.isFinite(frame.bodyScaleCorrection) && Number.isFinite(frame.sourceScaleCorrection)));
  assert.strictEqual(movement.crossClipScaleAudit.passed, true);
  assert.strictEqual(crouchJumpReport.authoredFrameCount, 13);
  assert.strictEqual(crouchJumpReport.visualValidation.purpleOutlineRemoved, true);
  assert.strictEqual(crouchJumpReport.visualValidation.meaningfulMagentaPixelsRemaining, 0);
  assert.strictEqual(crouchJumpReport.normalization.perFrameRendererScale, false);
  assert.ok(crouchJumpReport.frames.every((frame) => frame.touchesEdge === false));
  assert.strictEqual(crouchJumpHashLock.status, 'HASH_LOCKED_CANDIDATE_ONLY');
  assert.strictEqual(crouchJumpHashLock.deployable, false);
  assert.strictEqual(crouchJumpHashLock.sourceFrames.length, 13);
  assert.strictEqual(dashBlockReport.authoredFrameCount, 26);
  assert.strictEqual(dashBlockReport.visualValidation.meaningfulMagentaPixelsRemaining, 0);
  assert.strictEqual(dashBlockReport.visualValidation.redArtifactPixelsRemaining, 0);
  assert.strictEqual(dashBlockReport.visualValidation.edgeTouches, 0);
  assert.strictEqual(dashBlockReport.visualValidation.fixedRoot, true);
  assert.strictEqual(dashBlockReport.visualValidation.fixedRendererScale, true);
  assert.strictEqual(dashBlockReport.normalization.perFrameRendererScale, false);
  assert.strictEqual(new Set(dashBlockReport.frames.map((frame) => frame.normalizedSha256)).size, 26);
  assert.ok(dashBlockReport.frames.every((frame) => frame.touchesEdge === false));
  assert.ok(dashBlockReport.frames.every((frame) => frame.normalizedRoot.x === 768 && frame.normalizedRoot.y === 1360));
  assert.strictEqual(dashBlockHashLock.status, 'HASH_LOCKED_CANDIDATE_ONLY');
  assert.strictEqual(dashBlockHashLock.deployable, false);
  assert.strictEqual(dashBlockHashLock.sourceFrames.length, 26);
  assert.strictEqual(crouchingBlockReport.status, 'candidate-only');
  assert.strictEqual(crouchingBlockReport.validation.sequenceWideScale, true);
  assert.strictEqual(crouchingBlockReport.validation.perFrameRendererScale, false);
  assert.strictEqual(crouchingBlockReport.frames.length, 4);
  assert.ok(crouchingBlockReport.frames.every((frame) => frame.meaningfulMagentaPixelsRemaining === 0 && frame.touchesEdge === false));
  assert.strictEqual(jumpAdultRepairReport.status, 'candidate-only');
  assert.strictEqual(jumpAdultRepairReport.validation.sequenceWideScale, true);
  assert.strictEqual(jumpAdultRepairReport.validation.simulationOwnsTravel, true);
  assert.strictEqual(jumpAdultRepairReport.frames.length, 7);
  assert.ok(jumpAdultRepairReport.idleHeightDeltaRatio <= 0.03);
  assert.ok(jumpAdultRepairReport.frames.every((frame) => frame.meaningfulMagentaPixelsRemaining === 0 && frame.touchesEdge === false));
  for (const frame of hashLock.frames) {
    const legacy = path.join(repoRoot, frame.legacyPath);
    assert.ok(fs.existsSync(legacy), frame.legacyPath);
    assert.strictEqual(hash(legacy), frame.legacySha256);
  }
  for (const state of Object.values(movement.states)) for (const frame of state.frames) {
    const filename = path.join(engineRoot, 'public', frame.publicPath.replace(/^\//, ''));
    assert.ok(fs.existsSync(filename), frame.publicPath);
    assert.strictEqual(hash(filename), frame.sha256);
  }
  assert.strictEqual(movement.status, 'turn_facing_approved_for_current_baseline_with_polish_debt_remaining_movement_gates_pending');
  assert.strictEqual(review.firstPlayable.humanReviewStatus,'awaiting_human_heaven_splitter_family_review');
  assert.strictEqual(review.firstPlayable.humanReviewStatus, review.firstPlayable.currentReviewGate.status, 'milestone status and open gate must agree');
  assert.strictEqual(review.firstPlayable.deployable, false);
}

function testPublicComparisonUsesDistinctV2Sources() {
  const review = read(path.join(engineRoot, 'public', 'lamuh-legacy-v2', 'review-data.json'));
  const closure = review.standingHeavyClosure;
  assert.strictEqual(closure.status, 'awaiting_human_lamuh_v2_first_playable_closure_review');
  assert.strictEqual(closure.candidateOnly, true);
  assert.strictEqual(closure.deployable, false);
  assert.strictEqual(closure.rendererAuthoritative, false);
  assert.strictEqual(closure.simulationAuthoritative, true);
  assert.strictEqual(closure.v1.historicalDurationTicks, 31);
  assert.ok(closure.v1.exposureEvidence.includes('RECONSTRUCTION'));
  assert.deepStrictEqual(Object.keys(closure.timingCandidates), ['A', 'B', 'C']);
  assert.deepStrictEqual(Object.values(closure.impactCandidates).map((item) => item.hitstopTicks), [8, 9, 10]);
  assert.strictEqual(closure.v2.visibleImpactCount, 1);
  assert.strictEqual(closure.v2.gameplayHitCount, 1);
  assert.strictEqual(closure.v2.contactPresentation.bodyOnlyOnWhiff, true);
  assert.ok(!closure.v2.contactPresentation.allowedOutcomes.includes('whiff'));
  assert.strictEqual(new Set(closure.v2.frames.map((frame) => frame.sha256)).size, 7);
  for (const frame of closure.v2.frames) {
    const filename = path.join(engineRoot, 'public', frame.publicPath.replace(/^\//, ''));
    assert.ok(fs.existsSync(filename), frame.publicPath);
    assert.strictEqual(hash(filename), frame.sha256);
  }
  assert.deepStrictEqual(closure.scenarioCoverage.actors, ['P1_authored_facing_right', 'P2_lossless_mirror_facing_left']);
  assert.deepStrictEqual(closure.scenarioCoverage.spaces, ['center', 'left_corner', 'right_corner']);
  assert.deepStrictEqual(closure.scenarioCoverage.outcomes, ['hit', 'stand_block', 'crouch_block', 'whiff']);
  assert.strictEqual(closure.unsupported.counterHit, 'UNSUPPORTED_IN_CURRENT_LAMUH_CORE_AND_NOT_INVENTED');
}

function testAscendStepLightSingleDashPunchCandidate() {
  const review = read(path.join(engineRoot, 'public', 'lamuh-legacy-v2', 'review-data.json'));
  const closure = review.ascendStepFamily.variants.light;
  const report = read(path.join(ascendStepReviewRoot, 'normalization.report.json'));
  const hashLock = read(path.join(contentRoot, 'records', 'ascend-step-dash-punch-v2.hash-lock.json'));
  const sidecar = read(path.join(contentRoot, 'moves', 'ascend-step', 'visual-modernization.candidate.v2.json'));
  const rejection = read(path.join(contentRoot, 'records', 'ascend-step-two-beat-v1.rejection.json'));
  assert.strictEqual(closure.status, 'APPROVED_FOR_CURRENT_PRODUCTION_BASELINE_WITH_POLISH_DEBT');
  assert.strictEqual(review.ascendStepFamily.starredForRevisit, true);
  assert.strictEqual(review.ascendStepFamily.humanApproval.light, closure.status);
  assert.strictEqual(review.ascendStepFamily.approvalReceipt.sha256, hash(path.join(contentRoot, 'records/forward-special-family-v1.approval.json')));
  assert.strictEqual(closure.candidateOnly, true);
  assert.strictEqual(closure.deployable, false);
  assert.strictEqual(closure.rendererAuthoritative, false);
  assert.strictEqual(closure.simulationAuthoritative, true);
  assert.strictEqual(closure.identityLock.matureAdultProportions, true);
  assert.strictEqual(closure.identityLock.noChibiProportions, true);
  assert.strictEqual(closure.identityLock.boxedBeardAndMustache, true);
  assert.strictEqual(closure.identityLock.longBlackLocs, true);
  assert.strictEqual(closure.identityLock.noPurpleOutline, true);
  assert.strictEqual(closure.identityLock.sameSequenceScale, true);
  assert.strictEqual(closure.identityLock.compactFramesUsePoseCompressionNotPerFrameScale, true);
  assert.strictEqual(closure.identityLock.internalVisualAudit, 'PASS_CANDIDATE_INTERNAL_REVIEW');
  assert.ok(closure.identityLock.directionReceipt.path.endsWith('records/adult-proportion-v2.human-direction.json'));
  assert.strictEqual(closure.identityLock.directionReceipt.sha256, hash(path.join(contentRoot, 'records', 'adult-proportion-v2.human-direction.json')));
  assert.strictEqual(closure.identityLock.humanApproval, null);
  assert.strictEqual(report.validation.adultProportionVisualAudit, 'PASS_CANDIDATE_INTERNAL_REVIEW');
  assert.strictEqual(report.validation.compactFramesUsePoseCompressionNotPerFrameScale, true);
  assert.strictEqual(report.approvalBoundary.adultProportionHumanReviewRequired, true);
  assert.ok(report.validation.endpointHeightDeltaPct <= 5);
  assert.strictEqual(report.validation.meaningfulMagentaPixelsRemaining, 0);
  assert.strictEqual(report.validation.redArtifactPixelsRemaining, 0);
  assert.strictEqual(report.validation.touchesEdge, false);
  assert.strictEqual(closure.v1.sourceFrameCount, 7);
  assert.strictEqual(closure.v2.frames.length, 6);
  assert.strictEqual(new Set(closure.v2.frames.map((frame) => frame.sha256)).size, 6);
  assert.deepStrictEqual(closure.v2.frames.map((frame) => frame.sourceV1Indices), [[0], [1], [2], [5], [5], [6]]);
  assert.ok(closure.v2.frames.every((frame) => frame.root.x === 768 && frame.root.y === 1360));
  assert.strictEqual(closure.v2.perFrameRescale, false);
  assert.strictEqual(closure.v2.visibleImpactCount, 1);
  assert.strictEqual(closure.v2.gameplayHitCount, 1);
  assert.strictEqual(closure.recommendedTimingCandidate, 'B');
  assert.deepStrictEqual(Object.values(closure.timingCandidates).map((candidate) => candidate.durationTicks), [18, 20, 23]);
  assert.deepStrictEqual(closure.timingCandidates.B.exposureTicks, [2, 2, 1, 4, 5, 6]);
  assert.strictEqual(report.validation.oneActionRule, 'PASS_CANDIDATE_INTERNAL_REVIEW');
  assert.strictEqual(report.validation.hitCountParity, true);
  assert.strictEqual(closure.v2.singleActionContract.oneContinuousPhysicalAction, true);
  assert.strictEqual(closure.v2.singleActionContract.groundedDashForward, true);
  assert.strictEqual(closure.v2.singleActionContract.punchOnly, true);
  assert.strictEqual(closure.v2.singleActionContract.strikingLimb, 'right_arm');
  assert.strictEqual(closure.v2.singleActionContract.risingStrikeRemoved, true);
  assert.strictEqual(closure.v2.singleActionContract.airborneFollowupRemoved, true);
  assert.strictEqual(closure.v2.singleActionContract.secondStrikeRemoved, true);
  assert.deepStrictEqual(closure.rootMotionContract, { owner: 'simulation', startTick: 2, endTick: 7, velocityPerTick: 8.3, rendererDrivesGameplay: false, authoredException: null });
  assert.deepStrictEqual([closure.combatCandidate.damage, closure.combatCandidate.hitstop, closure.combatCandidate.hitstun, closure.combatCandidate.blockstun], [32, 5, 22, 12]);
  assert.strictEqual(hashLock.status, 'HASH_LOCKED_CANDIDATE_ONLY');
  assert.strictEqual(hashLock.protectedV1SourcesModified, false);
  assert.strictEqual(hashLock.protectedLegacyFrames.length, 7);
  assert.strictEqual(rejection.decision, 'REJECTED_FOR_MOTION_REVISION');
  assert.strictEqual(rejection.preservedAsHistory, true);
  assert.strictEqual(rejection.replacementDirection.action, 'one_grounded_forward_dash_into_one_right_arm_straight_punch');
  assert.strictEqual(sidecar.promotionState, 'candidate');
  assert.strictEqual(sidecar.productionApproved, false);
  assert.strictEqual(sidecar.identityLock.noChibiProportions, true);
  for (const frame of closure.v2.frames) {
    const filename = path.join(engineRoot, 'public', frame.publicPath.replace(/^\//, ''));
    assert.ok(fs.existsSync(filename), frame.publicPath);
    assert.strictEqual(hash(filename), frame.sha256);
  }
  for (const frame of hashLock.protectedLegacyFrames) {
    const filename = path.join(repoRoot, frame.path);
    assert.ok(fs.existsSync(filename), frame.path);
    assert.strictEqual(hash(filename), frame.sha256);
  }
}

function testAscendStepMediumTargetedMotionRepairCandidate() {
  const review = read(path.join(engineRoot, 'public', 'lamuh-legacy-v2', 'review-data.json'));
  const closure = review.ascendStepFamily.variants.medium;
  const report = read(path.join(repoRoot, 'tools', 'nga-forge', 'review', 'lamuh-legacy-v2-ascend-step-medium-slide-flip-v1', 'normalization.report.json'));
  const hashLock = read(path.join(contentRoot, 'records', 'ascend-step-medium-slide-flip-v1.hash-lock.json'));
  const sidecar = read(path.join(contentRoot, 'moves', 'ascend-step', 'visual-modernization.medium-targeted-motion-repair.candidate.v3.json'));
  assert.deepStrictEqual(closure, review.ascendStepClosure);
  assert.strictEqual(closure.status, 'APPROVED_FOR_CURRENT_PRODUCTION_BASELINE_WITH_POLISH_DEBT');
  assert.strictEqual(review.ascendStepFamily.humanApproval.medium, closure.status);
  assert.strictEqual(review.ascendStepFamily.starredForRevisit, true);
  assert.strictEqual(closure.candidateOnly, true);
  assert.strictEqual(closure.deployable, false);
  assert.strictEqual(closure.identityLock.approvedRuntimeBodyFramesOnly, false);
  assert.strictEqual(closure.identityLock.generatedAvatarPixels, true);
  assert.strictEqual(closure.identityLock.boundedMissingStateSourceFrames, 6);
  assert.strictEqual(closure.identityLock.noChibiProportions, true);
  assert.strictEqual(closure.identityLock.noPurpleOutline, true);
  assert.ok(closure.identityLock.directionReceipt.path.endsWith('records/ascend-step-medium-targeted-motion-repair-v3.human-direction.json'));
  assert.strictEqual(closure.v2.frames.length, 16);
  assert.strictEqual(new Set(closure.v2.frames.map((frame) => frame.sha256)).size, 16);
  assert.deepStrictEqual(closure.v2.contactFrames, [3, 10]);
  assert.strictEqual(closure.v2.frames.filter((frame) => frame.visibleImpact).length, 2);
  assert.strictEqual(closure.v2.visibleImpactCount, 2);
  assert.strictEqual(closure.v2.gameplayHitCount, 2);
  assert.deepStrictEqual(Object.values(closure.timingCandidates).map((candidate) => candidate.durationTicks), [44, 48, 52]);
  assert.deepStrictEqual(closure.timingCandidates.B.exposureTicks, [3, 2, 2, 3, 2, 3, 3, 3, 2, 3, 3, 3, 3, 3, 4, 6]);
  assert.strictEqual(closure.v2.singleActionContract.oneContinuousComboAction, true);
  assert.strictEqual(closure.v2.singleActionContract.strikingLimb, 'one_rising_heel');
  assert.strictEqual(closure.v2.singleActionContract.strikingLimbContinuity, 'slide_lead_leg_retracts_then_one_rising_heel_strikes_while_other_leg_counterbalances');
  assert.strictEqual(closure.v2.singleActionContract.clearStrikingLegCount, 1);
  assert.strictEqual(closure.v2.singleActionContract.counterbalanceLegBent, true);
  assert.strictEqual(closure.v2.singleActionContract.postContactBodyShape, 'distinct_authored_tuck_not_rotated_contact_sprite');
  assert.strictEqual(closure.v2.singleActionContract.victimTeleport, false);
  assert.deepStrictEqual(closure.rootMotionContract.segments, [
    { role: 'forward_slide', startTick: 2, endTick: 11, velocityPerTick: 9 },
    { role: 'compression_redirect', startTick: 12, endTick: 16, velocityPerTick: -2 },
    { role: 'handspring_pivot', startTick: 17, endTick: 26, velocityPerTick: -1.4 },
    { role: 'exit_rotation_to_landing', startTick: 27, endTick: 33, velocityPerTick: -1 }
  ]);
  assert.deepStrictEqual([closure.combatCandidate.damage, closure.combatCandidate.expectedScaledRouteDamage, closure.combatCandidate.hitstop, closure.combatCandidate.hitstun, closure.combatCandidate.blockstun], [70, 66, 8, 34, 18]);
  assert.deepStrictEqual(report.contactFrames, [3, 10]);
  assert.deepStrictEqual(report.timing.contactTicks, [7, 26]);
  assert.strictEqual(report.validation.approvedIdentitySourceReuse, true);
  assert.strictEqual(report.validation.hitCountParity, true);
  assert.strictEqual(report.validation.generatedAvatarSourceFrameCount, 6);
  assert.strictEqual(report.validation.generatedAvatarAnimationFrameCount, 9);
  assert.strictEqual(report.validation.fixedWorldRoot, false);
  assert.strictEqual(report.validation.forwardSlideRootTravel, 'PASS_CANDIDATE_INTERNAL_REVIEW');
  assert.strictEqual(report.validation.backwardMomentumRedirection, 'PASS_CANDIDATE_INTERNAL_REVIEW');
  assert.strictEqual(report.validation.slideRetractionCoilConnector, 'PASS_CANDIDATE_INTERNAL_REVIEW');
  assert.strictEqual(report.validation.backwardHandsReachConnector, 'PASS_CANDIDATE_INTERNAL_REVIEW');
  assert.strictEqual(report.validation.asymmetricSingleLegLauncher, 'PASS_CANDIDATE_INTERNAL_REVIEW');
  assert.strictEqual(report.validation.meaningfulMagentaPixelsRemaining, 0);
  assert.strictEqual(report.validation.redArtifactPixelsRemaining, 0);
  assert.strictEqual(report.validation.touchesEdge, false);
  assert.strictEqual(hashLock.protectedV1SourcesModified, false);
  assert.strictEqual(hashLock.normalizedFrames.length, 16);
  assert.strictEqual(sidecar.promotionState, 'candidate');
  assert.strictEqual(sidecar.productionApproved, false);
  assert.strictEqual(sidecar.identityLock.noChibiProportions, true);
  for (const frame of closure.v2.frames) {
    const filename = path.join(engineRoot, 'public', frame.publicPath.replace(/^\//, ''));
    assert.ok(fs.existsSync(filename), frame.publicPath);
    assert.strictEqual(hash(filename), frame.sha256);
  }
}

function reviewMatch(timing, hitstop, outcome = 'whiff', side = 'p1') {
  const close = outcome !== 'whiff';
  const config = {
    matchId: `closure-${timing}-${hitstop}-${outcome}-${side}`,
    p1Kind: side === 'p1' ? 'lamuh_legacy_v2' : 'training_dummy',
    p2Kind: side === 'p2' ? 'lamuh_legacy_v2' : 'training_dummy',
    p1X: close ? -34 : -140,
    p2X: close ? 34 : 140,
    ...(side === 'p1' ? { p1LamuhReview: { timing, hitstop } } : { p2LamuhReview: { timing, hitstop } })
  };
  const state = createMatch(7000 + hitstop, config);
  const dummy = state.fighters[side === 'p1' ? 'p2' : 'p1'];
  dummy.dummyMode = outcome === 'block' ? 'stand_block' : 'auto_recovery';
  return state;
}

function testDirectGameplayTimingProfiles() {
  const expected = { A: [9, 5, 18], B: [11, 5, 21], C: [13, 6, 23] };
  for (const [timing, phases] of Object.entries(expected)) {
    const state = reviewMatch(timing, 9, 'whiff');
    const fighter = state.fighters.p1;
    tick(state, { p1: { heavy: true } });
    const definition = resolveAttackDefinition(fighter);
    assert.deepStrictEqual([definition.startup, definition.active, definition.recovery], phases);
    assert.deepStrictEqual([definition.hitboxes[0].start, definition.hitboxes[0].end], [phases[0], phases[0] + phases[1] - 1]);
    let calls = 1;
    while (fighter.currentAttack && calls < 100) { tick(state, {}); calls++; }
    assert.strictEqual(calls, phases.reduce((sum, value) => sum + value, 0));
    assert.strictEqual(fighter.phase, 'idle');
    assert.strictEqual(state.lastCombatEvent, null);
  }
}

function testImpactCandidatesDoNotDriftCombatValues() {
  const outcomes = [];
  for (const hitstop of [8, 9, 10]) {
    const state = reviewMatch('B', hitstop, 'hit');
    let calls = 0;
    while (!state.lastCombatEvent && calls++ < 40) tick(state, calls === 1 ? { p1: { heavy: true } } : {});
    assert.strictEqual(state.lastCombatEvent.outcome, 'hit');
    assert.strictEqual(state.fighters.p1.hitstop, hitstop);
    assert.strictEqual(state.fighters.p2.hitstop, hitstop);
    assert.strictEqual(state.fighters.p1.phaseTick, 11);
    outcomes.push({ damage: state.lastCombatEvent.damage, baseHitstun: state.lastCombatEvent.baseHitstun, health: state.fighters.p2.health });
  }
  assert.deepStrictEqual(outcomes, [outcomes[0], outcomes[0], outcomes[0]], 'impact candidates may change hitstop only');
}

function testHitBlockWhiffAndReplayDeterminism() {
  for (const outcome of ['hit', 'block', 'whiff']) {
    const state = reviewMatch('C', 10, outcome);
    for (let frame = 0; frame < 80; frame++) tick(state, frame === 0 ? { p1: { heavy: true } } : {});
    if (outcome === 'whiff') assert.strictEqual(state.lastCombatEvent, null);
    else assert.strictEqual(state.lastCombatEvent.outcome, outcome);
    const recording = recordReplay(state);
    const replayed = outcome === 'block' ? createMatch(recording.seed, recording.matchConfig) : executeReplay(recording);
    if (outcome === 'block') {
      replayed.fighters.p2.dummyMode = 'stand_block';
      for (const frame of recording.frames) tick(replayed, { p1: frame.p1, p2: frame.p2 });
    }
    assert.deepStrictEqual(replayed.matchConfig.p1LamuhReview, { timing: 'C', hitstop: 10 });
    assert.deepStrictEqual(replayed.checksums, state.checksums);
    assert.strictEqual(new Set(state.presentationEventLedger).size, state.presentationEventLedger.length);
  }
}

function testP2MirrorAndPromotionFirewall() {
  const p1 = reviewMatch('A', 8, 'hit', 'p1');
  const p2 = reviewMatch('A', 8, 'hit', 'p2');
  for (let frame = 0; frame < 20; frame++) {
    tick(p1, frame === 0 ? { p1: { heavy: true } } : {});
    tick(p2, frame === 0 ? { p2: { heavy: true } } : {});
  }
  assert.strictEqual(p1.lastCombatEvent.outcome, 'hit');
  assert.strictEqual(p2.lastCombatEvent.outcome, 'hit');
  assert.strictEqual(p1.lastCombatEvent.damage, p2.lastCombatEvent.damage);
  assert.strictEqual(p1.fighters.p1.attackFacing, 1);
  assert.strictEqual(p2.fighters.p2.attackFacing, -1);
  const status = read(path.join(contentRoot, 'records', 'first-playable-closure.pending.json'));
  assert.strictEqual(status.status, 'candidate-only');
  assert.strictEqual(status.deployable, false);
  assert.strictEqual(status.productionApproved, false);
  assert.strictEqual(status.branch, 'codex/lamuh-legacy-v2-rebuild-v1');
  assert.strictEqual(status.humanReviewStatus,'awaiting_human_heaven_splitter_family_review');
  for (const required of ['heaven_splitter_light_medium_heavy_anti_air_motion', 'heaven_splitter_body_scale_and_transition', 'heaven_splitter_single_hit_parity', 'heaven_splitter_counterplay']) {
    assert.ok(status.currentReviewFocus.focusDecisions.includes(required), `closure review focus dropped required decision ${required}`);
  }
  assert.deepStrictEqual(status.currentReviewFocus.requiredDecisions, ['dash_forward_motion_and_transition', 'walk_backward_directional_motion_and_transition', 'dash_backward_motion_and_transition', 'air_dash_forward_motion_and_transition', 'air_dash_backward_motion_and_transition', 'standing_block_motion_and_transition', 'crouch_motion_and_transition', 'jump_motion_and_transition', 'combined_movement_scale_and_flow', 'crouching_block_motion_identity_and_transition', 'jump_adult_proportion_and_transition', 'all_normals_idle_and_transition_combined_flow']);
  assert.deepStrictEqual(status.currentReviewFocus.starredForRevisit, read(path.join(contentRoot, 'first-playable.bundle.json')).currentReviewGate.starredForRevisit);
  assert.deepStrictEqual(status.currentReviewFocus.starredForRevisit.find((entry) => entry.subject === 'turn_facing_motion_mirrored_parity_and_transition'), { subject: 'turn_facing_motion_mirrored_parity_and_transition', decision: 'APPROVED_FOR_CURRENT_PRODUCTION_BASELINE_WITH_POLISH_DEBT', reason: 'user_requested_may_come_back_to_it' });
  assert.ok(status.currentReviewFocus.starredForRevisit.some((entry) => entry.subject === 'forward_special_family_light_medium_heavy'));
  assert.strictEqual(status.decisionQueue.length, 5);
  assert.deepStrictEqual(status.decisionQueue.map((item) => item.section), ['A', 'B', 'C', 'D', 'E']);
  assert.deepStrictEqual(status.decisionQueue[1].requestedEnum, ['TIMING_A_V1_RHYTHM', 'TIMING_B_RECOMMENDED_READABILITY', 'TIMING_C_HEAVIER_ALTERNATE']);
  assert.strictEqual(status.decisionQueue[3].independentDecisions.standardGrab, 'APPROVED_STANDARD_GRAB');
  // Historic Section E preserves the exact Medium repair evidence; the current family gate is separate.
  assert.ok(/^Ascend Step\b/.test(status.decisionQueue[4].subject), `section E must be the Ascend Step decision, got ${status.decisionQueue[4].subject}`);
  assert.ok(/traveling_low_slide_kick/.test(status.decisionQueue[4].actionContract), `Medium action contract must name the traveling slide, got ${status.decisionQueue[4].actionContract}`);
  assert.ok(/slide_retraction_to_handspring_coil/.test(status.decisionQueue[4].actionContract), `Medium action contract must name the coil connector, got ${status.decisionQueue[4].actionContract}`);
  assert.ok(/asymmetric_single_rising_heel_launcher/.test(status.decisionQueue[4].actionContract), `Medium action contract must name the one-heel launcher, got ${status.decisionQueue[4].actionContract}`);
  assert.ok(/simulation_owned_root_travels_forward_then_redirects_backward/.test(status.decisionQueue[4].actionContract), `Medium action contract must name deliberate root travel, got ${status.decisionQueue[4].actionContract}`);
  assert.ok(/light_and_heavy_unchanged/.test(status.decisionQueue[4].actionContract), 'Medium revision must not silently alter Light or Heavy');
  assert.ok(status.decisionQueue[4].independentDecisions.motion.includes('APPROVED_WITH_TARGETED_REPAIR'));
}

// Regression guard for the 2026-09-03 gameplay-reconciliation pass.
//
// Three normals had been authored against a 1-tick active window that does not exist in the combat
// data, so their recommended animation was longer than the move it belonged to. The build then
// emitted a truncated runtime timeline that silently dropped authored follow-through and recovery
// frames, and placed the contact pose outside the live hitbox window. This asserts the invariants
// generically for every attack so that class of drift cannot come back on any move.
function testRuntimeTimelinesReconcileWithCombatData() {
  const review = JSON.parse(fs.readFileSync(path.join(engineRoot, 'public', 'lamuh-legacy-v2', 'review-data.json'), 'utf8'));
  const { fighterDefinitions } = require('../dist/data/fighters');
  const legacy = fighterDefinitions.lamuh_legacy_v2.attacks;
  const closureByMove = {
    standing_light: review.standingLightClosure, standing_medium: review.standingMediumClosure, standing_heavy: review.standingHeavyClosure,
    crouching_light: review.crouchingLightClosure, crouching_medium: review.crouchingMediumClosure, crouching_heavy: review.crouchingHeavyClosure,
    air_light: review.airLightClosure, air_medium: review.airMediumClosure, air_heavy: review.airHeavyClosure,
    ascend_step_light: review.ascendStepFamily.variants.light, ascend_step: review.ascendStepFamily.variants.medium, ascend_step_heavy: review.ascendStepFamily.variants.heavy
  };
  const attackIdByMove = { ascend_step_light: 'legacy_ascend_step_light', ascend_step: 'legacy_ascend_step', ascend_step_heavy: 'legacy_ascend_step_heavy' };
  for (const [moveId, closure] of Object.entries(closureByMove)) {
    const attack = legacy[attackIdByMove[moveId] || moveId];
    assert.ok(attack, `${moveId} has no combat definition`);
    const timeline = review.runtimeTimelines[moveId];
    assert.ok(timeline, `${moveId} has no runtime timeline`);

    // 1. Every authored frame must be reachable. A shorter timeline means frames never render.
    assert.strictEqual(timeline.exposureTicks.length, closure.v2.frames.length,
      `${moveId} runtime timeline shows ${timeline.exposureTicks.length} of ${closure.v2.frames.length} authored frames`);

    // 2. The clip must last exactly as long as the move.
    const total = attack.startup + attack.active + attack.recovery;
    assert.strictEqual(timeline.durationTicks, total, `${moveId} clip is ${timeline.durationTicks} ticks for a ${total}-tick move`);
    assert.strictEqual(timeline.exposureTicks.reduce((sum, value) => sum + value, 0), total, `${moveId} exposures do not sum to its duration`);

    // 3. The contact pose must appear exactly when the hitbox goes live and stay up for all of it.
    const contactFrames = closure.v2.contactFrames || [closure.v2.contactFrame];
    assert.strictEqual(contactFrames.length, attack.hitboxes.length, `${moveId} contact-pose count must equal runtime hitbox count`);
    contactFrames.forEach((contactFrame, index) => {
      const hitbox = attack.hitboxes[index];
      const contactStart = timeline.exposureTicks.slice(0, contactFrame).reduce((sum, value) => sum + value, 0);
      const contactEnd = contactStart + timeline.exposureTicks[contactFrame] - 1;
      assert.strictEqual(contactStart, hitbox.start, `${moveId} contact ${index + 1} appears at tick ${contactStart} but its hitbox goes live at ${hitbox.start}`);
      assert.ok(contactEnd >= hitbox.end, `${moveId} contact ${index + 1} ends at tick ${contactEnd} while its hitbox is live until ${hitbox.end}`);
    });

    // 4. Hit parity: exactly one flagged impact frame per registered hit.
    assert.strictEqual(closure.v2.frames.filter((frame) => frame.visibleImpact).length, closure.v2.gameplayHitCount,
      `${moveId} flags ${closure.v2.frames.filter((frame) => frame.visibleImpact).length} visible impacts for ${closure.v2.gameplayHitCount} registered hit(s)`);
  }

  // 5. The compiled Forge manifest is the artifact a real runtime would load. It has its own path
  // from the content packages and previously carried the truncated tracks after the review harness
  // had already been repaired, so assert it agrees rather than trusting that it followed along.
  const manifest = JSON.parse(fs.readFileSync(path.join(engineRoot, 'generated', 'manifests', 'lamuh_legacy_v2_first_playable.candidate.runtime.json'), 'utf8'));
  const compiled = Object.fromEntries(manifest.animations.map((animation) => [animation.id, animation]));
  for (const moveId of Object.keys(closureByMove)) {
    const animation = compiled[moveId];
    if (!animation) continue; // ascend step L/H have no package yet; covered as known debt
    const attack = legacy[attackIdByMove[moveId] || moveId];
    const durations = animation.exposures.slice().sort((a, b) => a.start - b.start).map((exposure) => exposure.duration);
    assert.deepStrictEqual(durations, review.runtimeTimelines[moveId].exposureTicks,
      `${moveId} compiled manifest exposures disagree with the review timeline`);
    assert.strictEqual(animation.sourceFrames.length, closureByMove[moveId].v2.frames.length,
      `${moveId} compiled manifest references ${animation.sourceFrames.length} frames for ${closureByMove[moveId].v2.frames.length} authored`);
    assert.strictEqual(animation.simulationLength, attack.startup + attack.active + attack.recovery,
      `${moveId} compiled manifest length disagrees with its combat data`);
    assert.strictEqual(animation.combatTrack.startup, attack.startup, `${moveId} compiled startup drift`);
    assert.strictEqual(animation.combatTrack.active, attack.active, `${moveId} compiled active drift`);
    assert.strictEqual(animation.combatTrack.recovery, attack.recovery, `${moveId} compiled recovery drift`);
  }
}

const tests = [testStandingHeavyMotionAndNormalizationLock, testStandingLightSingleHitMotionAndNormalizationLock, testStandingMediumSingleHitMotionAndNormalizationLock, testCrouchingLightDistinctLowMotionAndNormalizationLock, testCrouchingMediumSweepLineMotionAndNormalizationLock, testCrouchingHeavyCrownRiserMotionAndNormalizationLock, testAirNormalBatchMotionScaleAndBodyOnlyContactLock, testModernMovementCombinedPlaytestPackage, testPublicComparisonUsesDistinctV2Sources, testAscendStepLightSingleDashPunchCandidate, testAscendStepMediumTargetedMotionRepairCandidate, testDirectGameplayTimingProfiles, testImpactCandidatesDoNotDriftCombatValues, testHitBlockWhiffAndReplayDeterminism, testP2MirrorAndPromotionFirewall, testRuntimeTimelinesReconcileWithCombatData];
for (const test of tests) { test(); console.log(`PASS ${test.name}`); }
