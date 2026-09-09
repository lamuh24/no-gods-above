const assert = require('assert');
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const { compileFromPath } = require('../scripts/production_contracts');
const { fighterDefinitions } = require('../dist/data/fighters');

const engineRoot = path.resolve(__dirname, '..');
const gameRoot = path.resolve(engineRoot, '..');
const repoRoot = path.resolve(engineRoot, '..', '..');
const contentRoot = path.join(engineRoot, 'content-source', 'characters', 'lamuh-legacy-v2');
const read = (name) => JSON.parse(fs.readFileSync(path.join(contentRoot, name), 'utf8'));
const hash = (file) => crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex').toUpperCase();

function testSourceLockAndPublicCopies() {
  const lock = read('source-lock.v1.json');
  assert.strictEqual(lock.immutableSourcePolicy, true);
  assert.strictEqual(lock.legacyOriginalsModified, false);
  assert.strictEqual(lock.artifacts.length, 22);
  for (const artifact of lock.artifacts) {
    const file = path.join(gameRoot, artifact.path);
    assert.ok(fs.existsSync(file), artifact.path);
    assert.strictEqual(hash(file), artifact.sha256, `${artifact.path} changed after hash lock`);
    if (artifact.kind === 'runtime_atlas') {
      const copy = path.join(engineRoot, 'public', 'lamuh-legacy-v2', 'atlases', path.basename(artifact.path));
      assert.ok(fs.existsSync(copy));
      assert.strictEqual(hash(copy), artifact.sha256, `${artifact.path} public copy is not byte-identical`);
    }
  }
}

function testAuditIsCompleteAndHonest() {
  const audit = read('source-audit.v1.json');
  assert.strictEqual(audit.animations.length, 51);
  for (const animation of audit.animations) {
    for (const field of ['animationName', 'sourceFrameCount', 'originalExposureTiming', 'gameplayRole', 'rootBehavior', 'existingCollisionData', 'transitionBehavior', 'vfxDependencies', 'audioDependencies', 'sourceMotionReusable', 'visualArtworkReusable', 'v2Disposition', 'needsV2Redesign']) {
      assert.notStrictEqual(animation[field], undefined, `${animation.animationName}.${field} missing`);
    }
  }
  assert.ok(!audit.missingV2Coverage.includes('forward_throw_art'));
  assert.ok(!audit.missingV2Coverage.includes('back_throw_art'));
  assert.ok(!audit.missingV2Coverage.includes('grab_whiff_art'));
  assert.ok(!audit.missingV2Coverage.includes('turn'));
  assert.ok(audit.missingV2Coverage.includes('victim_throw_rows'));
  assert.ok(audit.globalFindings.some((finding) => finding.includes('No per-frame V1 root')));
  const crouchingLight = audit.animations.find((animation) => animation.animationName === 'crouching_light');
  assert.strictEqual(crouchingLight.legacyAliasOf, 'standing_light');
  assert.strictEqual(crouchingLight.v2Disposition, 'MODERNIZE');
  assert.strictEqual(crouchingLight.visualArtworkReusable, false);
  const crouchingMedium = audit.animations.find((animation) => animation.animationName === 'crouching_medium');
  assert.strictEqual(crouchingMedium.legacyAliasOf, 'standing_medium');
  assert.strictEqual(crouchingMedium.v2Disposition, 'MODERNIZE');
  assert.strictEqual(crouchingMedium.visualArtworkReusable, false);
  const ground = audit.sheets.find((sheet) => sheet.id === 'end_states');
  assert.strictEqual(ground.frameCounts[1], 3);
  assert.strictEqual(ground.runtimeFrameCounts[1], 1);
  const turn = audit.animations.find((animation) => animation.animationName === 'turn_facing');
  assert.ok(turn, 'dedicated turn/facing missing-state audit entry must exist');
  assert.strictEqual(turn.v2Disposition, 'MODERNIZE');
  assert.strictEqual(turn.sourceFrameCount, 0);
}

function testIndependentTimingCandidates() {
  const timing = read('timing-candidates.v1.json');
  assert.strictEqual(timing.simulationHz, 60);
  assert.strictEqual(timing.blanketDurationMultiplier, null);
  const ratios = [];
  for (const move of timing.moves) {
    // A move with no recoverable V1 source cannot carry V1 historical evidence. It must say so
    // explicitly rather than claiming a reconstructed duration it does not have.
    if (move.sourceFrameCount === 0) {
      assert.strictEqual(move.v1Historical.durationTicks, 0, `${move.moveId} has no V1 source and must not claim a historical duration`);
      assert.deepStrictEqual(move.v1Historical.exposureTicks, [], `${move.moveId} has no V1 source and must not claim historical exposures`);
      assert.ok(/not applicable/i.test(move.v1Historical.exposureEvidence), `${move.moveId} must declare its V1 exposure evidence as not applicable`);
      assert.ok(/no recoverable v1/i.test(move.v1Historical.durationEvidence), `${move.moveId} must declare that no V1 variant is recoverable`);
    } else {
      assert.ok(move.v1Historical.durationTicks > 0);
      assert.strictEqual(move.v1Historical.exposureTicks.reduce((sum, value) => sum + value, 0), move.v1Historical.durationTicks);
      assert.ok(move.v1Historical.exposureEvidence.includes('RECONSTRUCTION'));
    }
    assert.deepStrictEqual(Object.keys(move.candidates), ['A', 'B', 'C']);
    for (const candidate of Object.values(move.candidates)) {
      assert.strictEqual(candidate.exposureTicks.reduce((sum, value) => sum + value, 0), candidate.durationTicks);
      assert.strictEqual(Object.values(candidate.phaseTicks).reduce((sum, value) => sum + value, 0), candidate.durationTicks);
      // Three-state frame-order contract:
      //   true  - the V1 source poses appear in their original relative order (in-betweens may be inserted).
      //   false - a V2 reinterpretation removed or replaced V1 beats; this MUST be justified by a
      //           move-level v2Reinterpretation record and an explicit authored-order guarantee.
      //   null  - the move has no V1 source at all, so source order does not apply.
      const sourceOrder = candidate.preservesSourceFrameOrder;
      if (sourceOrder === null) {
        assert.strictEqual(move.sourceFrameCount, 0, `${move.moveId} may only record source order as not-applicable when it has no V1 source frames`);
        assert.strictEqual(candidate.preservesAuthoredFrameOrder, true, `${move.moveId} must still preserve authored frame order`);
      } else if (sourceOrder === false) {
        assert.ok(move.v2Reinterpretation, `${move.moveId} drops V1 source order and must carry a v2Reinterpretation record`);
        assert.strictEqual(move.v2Reinterpretation.approvedDisposition, 'MODERNIZE', `${move.moveId} may only drop source order under an approved MODERNIZE disposition`);
        assert.ok(Array.isArray(move.v2Reinterpretation.retiredLegacyBeats) && move.v2Reinterpretation.retiredLegacyBeats.length > 0, `${move.moveId} must name the retired legacy beats`);
        assert.ok(Array.isArray(move.v2Reinterpretation.retainedLegacyQualities) && move.v2Reinterpretation.retainedLegacyQualities.length > 0, `${move.moveId} must name the retained legacy qualities`);
        assert.strictEqual(move.v2Reinterpretation.protectedLegacyFramesModified, false, `${move.moveId} must not modify protected legacy frames`);
        assert.strictEqual(candidate.preservesAuthoredFrameOrder, true, `${move.moveId} must still preserve authored frame order`);
      } else {
        assert.strictEqual(sourceOrder, true, `${move.moveId} source frame order must be true, false-with-justification, or null when no source exists`);
      }
      assert.strictEqual(candidate.duplicateMeaninglessFrames, false);
      const contactTick = candidate.exposureTicks.slice(0, Math.min(...move.contactSourceFrames)).reduce((sum, value) => sum + value, 0);
      assert.strictEqual(contactTick, candidate.phaseTicks.startup, `${move.moveId} visual contact must align with gameplay active start`);
    }
    const ratio = move.candidates.B.durationTicks / move.candidates.A.durationTicks;
    const minimumReadableIncrease = move.moveId === 'ascend_step' ? 1.09 : 1.1;
    assert.ok(ratio >= minimumReadableIncrease && ratio <= 1.2, `${move.moveId} recommended ratio ${ratio} outside approximate review target`);
    ratios.push(ratio.toFixed(4));
  }
  assert.ok(new Set(ratios).size >= 5, 'timing candidates appear blanket-normalized');
}

function testFirstPlayableAndVictimContract() {
  const milestone = read('first-playable.bundle.json');
  const throws = read('throws.standard-humanoid.v1.json');
  const style = read('style-checkpoint.v1.json');
  const styleApproval = read(path.join('records', 'style-checkpoint-v1.approval.json'));
  const throwApproval = read(path.join('records', 'standard-grab-throw-family-v1.approval.json'));
  const pushboxApproval = read(path.join('records', 'fighter-pushbox-separation-v1.approval.json'));
  const adultDirection = read(path.join('records', 'adult-proportion-v2.human-direction.json'));
  assert.strictEqual(milestone.deployable, false);
  assert.strictEqual(milestone.candidateOnly, true);
  assert.deepStrictEqual(milestone.coverage.groundNormals, ['standing_light', 'standing_medium', 'standing_heavy', 'crouching_light', 'crouching_medium', 'crouching_heavy']);
  assert.ok(milestone.coverage.grabs.includes('forward_throw'));
  assert.ok(milestone.coverage.grabs.includes('back_throw'));
  assert.strictEqual(throws.victimClass, 'standard_humanoid');
  assert.strictEqual(throws.globalVictimScale, false);
  assert.strictEqual(throws.artStatus, 'HUMAN_APPROVED_THROW_FAMILY_CANDIDATE_NOT_PROMOTED');
  assert.strictEqual(throws.humanReviewStatus, 'APPROVED_STANDARD_GRAB_FORWARD_THROW_BACK_THROW_CANDIDATE_ONLY');
  assert.strictEqual(throws.humanApproval.standardGrab, 'APPROVED_STANDARD_GRAB');
  assert.strictEqual(throws.humanApproval.forwardThrow, 'APPROVED_FORWARD_THROW');
  assert.strictEqual(throws.humanApproval.backThrow, 'APPROVED_BACK_THROW');
  assert.deepStrictEqual(throwApproval.decisions, throws.humanApproval);
  assert.strictEqual(throwApproval.approvalBoundary.deployable, false);
  assert.strictEqual(throwApproval.approvalBoundary.productionApproved, false);
  assert.strictEqual(throwApproval.approvalBoundary.runtimeArtPromotionApproved, false);
  const pushboxStar = milestone.currentReviewGate.starredForRevisit.find((entry) => entry.subject === 'fighter_pushbox_separation');
  assert.ok(pushboxStar, 'fighter pushbox provisional pass must remain visibly starred for revisit');
  assert.strictEqual(pushboxStar.decision, 'APPROVED_FOR_CURRENT_PRODUCTION_BASELINE_WITH_POLISH_DEBT');
  assert.strictEqual(pushboxStar.approvalReceipt.path, 'records/fighter-pushbox-separation-v1.approval.json');
  assert.strictEqual(pushboxStar.approvalReceipt.sha256, hash(path.join(contentRoot, pushboxStar.approvalReceipt.path)));
  assert.strictEqual(pushboxApproval.userInput, 'pass for now but mark it');
  assert.strictEqual(hash(path.join(engineRoot, '..', pushboxApproval.reviewEvidence.screenshot)), pushboxApproval.reviewEvidence.screenshotSha256, 'Provisional review screenshot must remain preserved separately from new smoke captures');
  assert.strictEqual(pushboxApproval.starredForRevisit, true);
  assert.strictEqual(pushboxApproval.approvalBoundary.fighterPushboxSeparationApprovedForCurrentBaseline, true);
  assert.strictEqual(pushboxApproval.approvalBoundary.animationMotionApproved, false);
  assert.strictEqual(pushboxApproval.approvalBoundary.productionApproved, false);
  assert.strictEqual(pushboxApproval.approvalBoundary.deployable, false);
  // The milestone status must match the open review gate rather than a hardcoded literal, which
  // silently went stale when the single-dash-punch gate was superseded by the L/M/H family gate.
  assert.ok(/^awaiting_human_/.test(milestone.humanReviewStatus), `milestone must be awaiting a named human gate, got ${milestone.humanReviewStatus}`);
  assert.strictEqual(milestone.humanReviewStatus, milestone.currentReviewGate.status, 'milestone status and open review gate must agree');
  assert.strictEqual(adultDirection.subject, 'lamuh_legacy_v2.all_move_animation_artwork');
  assert.strictEqual(adultDirection.enforcement, 'hard_candidate_gate_before_human_motion_review');
  assert.ok(adultDirection.automaticRejection.includes('chibi or super-deformed anatomy'));
  assert.strictEqual(adultDirection.approvalBoundary.deployable, false);
  assert.ok(!milestone.knownArtDebt.some((item) => item.includes('BLOCKED_MANUAL_ART')));
  assert.strictEqual(milestone.productionApproved, false);
  assert.strictEqual(style.deployable, false);
  assert.strictEqual(style.humanReviewStatus, 'APPROVED_WITH_TARGETED_REPAIR');
  assert.strictEqual(style.approvalReceipt, 'records/style-checkpoint-v1.approval.json');
  assert.strictEqual(styleApproval.decision, 'APPROVED_WITH_TARGETED_REPAIR');
  assert.strictEqual(styleApproval.approvalBoundary.runtimeArtApproved, false);
  assert.strictEqual(styleApproval.approvalBoundary.productionApproved, false);
  assert.strictEqual(styleApproval.approvalBoundary.deployable, false);
  assert.strictEqual(style.purpleFringeAudit.candidateMagentaPixels, 3);
  assert.strictEqual(style.alphaAudit.backgroundResidueRequiresIsolation, true);
  assert.strictEqual(style.alphaAudit.genuineTransparency, true);
  const reviewCopy = path.join(engineRoot, 'public', 'lamuh-legacy-v2', 'style', 'standing-heavy-contact-style-candidate-v2.png');
  assert.ok(fs.existsSync(reviewCopy));
  assert.strictEqual(hash(reviewCopy), hash(path.resolve(gameRoot, '..', 'tools', 'nga-forge', 'review', 'lamuh-legacy-v2-style-modernization-v1', 'standing-heavy-contact-style-candidate-v2.png')));
  assert.strictEqual(path.resolve(contentRoot, 'records', styleApproval.approvedAsset.path), path.resolve(gameRoot, '..', 'tools', 'nga-forge', 'review', 'lamuh-legacy-v2-style-modernization-v1', 'standing-heavy-contact-style-candidate-v2.png'));
  assert.strictEqual(styleApproval.approvedAsset.sha256, hash(reviewCopy));
}

function testFirstPlayableRequirementsMapAndCurrentGate() {
  const milestone = read('first-playable.bundle.json');
  const bundle = read('character.bundle.json');
  const closure = read(path.join('records', 'first-playable-closure.pending.json'));
  const review = JSON.parse(fs.readFileSync(path.join(engineRoot, 'public', 'lamuh-legacy-v2', 'review-data.json'), 'utf8'));
  // Derive the gate from the data and then assert every record agrees, instead of pinning a literal
  // that goes stale each time the open gate advances.
  const requiredStatus = milestone.currentReviewGate.status;
  assert.strictEqual(requiredStatus, 'awaiting_human_heaven_splitter_family_review');
  assert.strictEqual(milestone.goalBranch, 'codex/lamuh-legacy-v2-rebuild-v1');
  assert.strictEqual(closure.branch, milestone.goalBranch);
  assert.strictEqual(milestone.forgePackageCount, 27);
  assert.strictEqual(bundle.animationPackages.length, milestone.forgePackageCount);
  assert.deepStrictEqual(bundle.packageGroups.movement, milestone.coverage.movement);
  assert.deepStrictEqual(bundle.packageGroups.defense, milestone.coverage.defense);
  assert.deepStrictEqual(bundle.packageGroups.ground_normals, milestone.coverage.groundNormals);
  assert.deepStrictEqual(bundle.packageGroups.air_normals, milestone.coverage.airNormals);
  const additiveSpecials = milestone.additiveForgeBundles.flatMap((entry) => {
    const additive = read(entry.path);
    assert.strictEqual(additive.animationPackages.length, entry.packageCount);
    return Object.values(additive.packageGroups).flat();
  });
  assert.deepStrictEqual([...bundle.packageGroups.specials, ...additiveSpecials], milestone.coverage.specials);
  assert.strictEqual(milestone.additiveForgeBundles.find((entry) => entry.role === 'neutral_specials').packageCount, 3);
  assert.deepStrictEqual(bundle.packageGroups.throws, ['universal_grab_attempt', 'forward_throw', 'back_throw']);
  for (const semanticGrabState of ['universal_grab_startup', 'grab_connect', 'grab_whiff', 'forward_throw', 'back_throw', 'throw_recovery']) {
    assert.ok(milestone.coverage.grabs.includes(semanticGrabState), `${semanticGrabState} missing from milestone coverage`);
  }
  for (const relativePath of bundle.animationPackages) {
    const packagePath = path.join(contentRoot, relativePath);
    assert.ok(fs.existsSync(packagePath), `${relativePath} missing`);
    const pkg = JSON.parse(fs.readFileSync(packagePath, 'utf8'));
    assert.strictEqual(pkg.promotionState, 'candidate', `${pkg.id} crossed candidate boundary`);
    assert.strictEqual(pkg.validation.humanApprovalRequired, true, `${pkg.id} lost human gate`);
  }
  assert.strictEqual(milestone.humanReviewStatus, requiredStatus);
  assert.strictEqual(milestone.currentReviewGate.status, requiredStatus);
  assert.strictEqual(closure.humanReviewStatus, requiredStatus);
  assert.strictEqual(review.humanReviewStatus, requiredStatus);
  assert.strictEqual(review.candidateOnly, true);
  assert.strictEqual(review.deployable, false);
  // The gate may add decisions as the family grows, but it must never drop a required one.
  for (const required of ['heaven_splitter_light_medium_heavy_anti_air_motion','heaven_splitter_body_scale_and_transition','heaven_splitter_single_hit_parity','heaven_splitter_counterplay']) {
    assert.ok(milestone.currentReviewGate.focusDecisions.includes(required), `open review gate dropped required decision ${required}`);
  }
  assert.deepStrictEqual(milestone.currentReviewGate.requiredDecisions, ['dash_forward_motion_and_transition', 'walk_backward_directional_motion_and_transition', 'dash_backward_motion_and_transition', 'air_dash_forward_motion_and_transition', 'air_dash_backward_motion_and_transition', 'standing_block_motion_and_transition', 'crouch_motion_and_transition', 'jump_motion_and_transition', 'combined_movement_scale_and_flow', 'crouching_block_motion_identity_and_transition', 'jump_adult_proportion_and_transition', 'all_normals_idle_and_transition_combined_flow']);
  assert.deepStrictEqual(milestone.currentReviewGate.starredForRevisit.find((entry) => entry.subject === 'turn_facing_motion_mirrored_parity_and_transition'), { subject: 'turn_facing_motion_mirrored_parity_and_transition', decision: 'APPROVED_FOR_CURRENT_PRODUCTION_BASELINE_WITH_POLISH_DEBT', reason: 'user_requested_may_come_back_to_it' });
  const auditPath = path.join(contentRoot, 'FIRST_PLAYABLE_REQUIREMENTS_AUDIT.md');
  assert.ok(fs.existsSync(auditPath));
  const audit = fs.readFileSync(auditPath, 'utf8');
  assert.ok(audit.includes('candidate packages'));
  assert.ok(audit.includes('Crouch-to-Stand motion/transition is `APPROVED_V1_MOTION_PRESERVED`'));
  assert.ok(audit.includes('Turn / Facing passed for the current baseline with polish debt'));
  const comparisonSource = fs.readFileSync(path.join(engineRoot, 'src', 'lamuhlegacy', 'review.ts'), 'utf8');
  // A newly authored Heaven family must become the default; until it exists, the accepted Palm is reference only.
  assert.ok(comparisonSource.includes(review.heavenSplitterFamily ? 'attack:heaven_splitter_medium' : 'attack:celestial_palm_medium'));
  assert.ok(comparisonSource.includes('CURRENT GATE: HEAVEN SPLITTER'));
  assert.ok(comparisonSource.includes('CANDIDATE ONLY')&&comparisonSource.includes('NO PRODUCTION PROMOTION'));
  assert.ok(comparisonSource.includes('adult-proportioned'));
  const forwardMark=milestone.currentReviewGate.starredForRevisit.find(x=>x.subject==='forward_special_family_light_medium_heavy');
  assert.strictEqual(forwardMark.decision,'APPROVED_FOR_CURRENT_PRODUCTION_BASELINE_WITH_POLISH_DEBT');
}

function testReviewCoverageAndImmutableLockBuild() {
  const review = JSON.parse(fs.readFileSync(path.join(engineRoot, 'public', 'lamuh-legacy-v2', 'review-data.json'), 'utf8'));
  assert.deepStrictEqual(review.comparisonClips.map((clip) => clip.clipId), ['idle', 'walk_forward', 'walk_backward', 'dash_forward', 'dash_backward', 'crouch', 'jump', 'air_dash_forward', 'air_dash_backward', 'standing_block', 'light_reaction', 'crouching_block', 'crouch_to_stand', 'turn_facing']);
  assert.deepStrictEqual(review.movementModernization.states.air_dash_forward.exposureTicks, [2, 2, 2, 3, 3, 2]);
  assert.deepStrictEqual(review.movementModernization.states.air_dash_backward.exposureTicks, [2, 2, 3, 3, 4]);
  assert.deepStrictEqual(review.movementModernization.states.dash_forward.exposureTicks, [3, 3, 3, 3, 3, 3]);
  assert.deepStrictEqual(review.movementModernization.states.dash_backward.exposureTicks, [4, 4, 4, 4, 4]);
  assert.deepStrictEqual(review.movementModernization.states.standing_block.exposureTicks, [4, 4, 4, 4]);
  assert.strictEqual(review.movementModernization.states.air_dash_forward.frames.length, 6);
  assert.strictEqual(review.movementModernization.states.air_dash_backward.frames.length, 5);
  assert.strictEqual(review.movementModernization.states.dash_forward.frames.length, 6);
  assert.strictEqual(review.movementModernization.states.dash_backward.frames.length, 5);
  assert.strictEqual(review.movementModernization.states.standing_block.frames.length, 4);
  assert.deepStrictEqual(review.movementModernization.states.crouching_block.exposureTicks, [3, 3, 4, 6]);
  assert.strictEqual(review.movementModernization.states.crouching_block.durationTicks, 16);
  assert.strictEqual(review.movementModernization.states.crouching_block.frames.length, 4);
  assert.ok(review.movementModernization.states.crouching_block.frames.every((frame) => frame.sourceType === 'imagegen_reference_edit'));
  assert.ok(['dash_forward', 'dash_backward', 'air_dash_forward', 'air_dash_backward', 'standing_block'].every((stateId) => review.movementModernization.states[stateId].frames.every((frame) => frame.sourceType === 'imagegen_reference_edit')));
  assert.strictEqual(review.movementModernization.status, 'turn_facing_approved_for_current_baseline_with_polish_debt_remaining_movement_gates_pending');
  assert.deepStrictEqual(review.movementModernization.states.crouch.exposureTicks, [3, 3, 6, 6, 4, 4]);
  assert.deepStrictEqual(review.movementModernization.states.jump.exposureTicks, [4, 3, 5, 4, 5, 4, 3]);
  assert.strictEqual(review.movementModernization.states.crouch.frames.length, 6);
  assert.strictEqual(review.movementModernization.states.jump.frames.length, 7);
  assert.deepStrictEqual(review.movementModernization.states.crouch_to_stand.exposureTicks, [4, 4]);
  assert.strictEqual(review.movementModernization.states.crouch_to_stand.durationTicks, 8);
  assert.deepStrictEqual(review.movementModernization.states.crouch_to_stand.frames.map((frame) => frame.sha256), review.movementModernization.states.crouch.frames.slice(4).map((frame) => frame.sha256));
  assert.strictEqual(review.movementModernization.jumpAdultProportionRepair.timingChanged, false);
  assert.strictEqual(review.movementModernization.jumpAdultProportionRepair.physicsChanged, false);
  assert.ok(review.movementModernization.jumpAdultProportionRepair.idleHeightDeltaRatio <= 0.03);
  assert.strictEqual(review.movementModernization.jumpAdultProportionRepair.identityLock.matureAdultProportions, true);
  assert.strictEqual(review.movementModernization.jumpAdultProportionRepair.identityLock.boxedBeardAndMustache, true);
  assert.strictEqual(review.movementModernization.crouchingBlockModernization.gameplayChanged, false);
  assert.strictEqual(review.movementModernization.crouchingBlockModernization.identityLock.matureAdultProportions, true);
  assert.strictEqual(review.movementModernization.crouchingBlockModernization.identityLock.boxedBeardAndMustache, true);
  assert.strictEqual(review.movementModernization.crouchJumpModernization.sourceSheetCameraCorrections.crouch > 0, true);
  assert.strictEqual(review.movementModernization.crouchJumpModernization.sourceSheetCameraCorrections.jump > 0, true);
  assert.strictEqual(review.movementModernization.crouchJumpModernization.humanApproval.crouch, null);
  assert.strictEqual(review.movementModernization.crouchJumpModernization.humanApproval.jump, null);
  assert.strictEqual(review.movementModernization.dashBlockModernization.humanApproval.dash_forward, null);
  assert.strictEqual(review.movementModernization.dashBlockModernization.humanApproval.dash_backward, null);
  assert.strictEqual(review.movementModernization.dashBlockModernization.humanApproval.air_dash_forward, null);
  assert.strictEqual(review.movementModernization.dashBlockModernization.humanApproval.air_dash_backward, null);
  assert.strictEqual(review.movementModernization.dashBlockModernization.humanApproval.standing_block, null);
  assert.strictEqual(review.movementModernization.backwardMotionRepair.status, 'awaiting_human_walk_backward_and_dash_backward_directional_review');
  assert.strictEqual(review.movementModernization.backwardMotionRepair.timingChanged, false);
  assert.strictEqual(review.movementModernization.backwardMotionRepair.simulationTravelChanged, false);
  assert.strictEqual(review.movementModernization.backwardMotionRepair.humanApproval.walk_backward, null);
  assert.strictEqual(review.movementModernization.backwardMotionRepair.humanApproval.dash_backward, null);
  assert.strictEqual(review.movementModernization.walkBackVideoRebuild.status, 'awaiting_human_video_derived_walk_backward_review');
  assert.strictEqual(review.movementModernization.walkBackVideoRebuild.generatedArtwork, false);
  assert.strictEqual(review.movementModernization.walkBackVideoRebuild.reversedPlayback, true);
  assert.deepStrictEqual(review.movementModernization.walkBackVideoRebuild.sourceVideoFrames, [72, 60, 48, 36, 24, 12, 0]);
  assert.deepStrictEqual(review.movementModernization.states.walk_backward.exposureTicks, [3, 3, 2, 3, 2, 2, 3]);
  assert.strictEqual(review.movementModernization.states.walk_backward.frames.length, 7);
  assert.ok(review.movementModernization.states.walk_backward.frames.every((frame) => frame.sourceType === 'user_video_reversed_cycle'));
  assert.deepStrictEqual(review.movementModernization.states.turn_facing.exposureTicks, [2, 3, 3, 4]);
  assert.strictEqual(review.movementModernization.states.turn_facing.durationTicks, 12);
  assert.strictEqual(review.movementModernization.turnFacingModernization.transitionContract.gameplayFacingSwapTick, 0);
  assert.strictEqual(review.movementModernization.turnFacingModernization.transitionContract.immediatelyInterruptible, true);
  assert.strictEqual(review.movementModernization.turnFacingModernization.humanApproval, 'APPROVED_FOR_CURRENT_PRODUCTION_BASELINE_WITH_POLISH_DEBT');
  assert.strictEqual(review.movementModernization.turnFacingModernization.starredForRevisit, true);
  assert.ok(review.movementModernization.turnFacingModernization.approvalReceipt.path.endsWith('records/turn-facing-v1.approval.json'));
  for (const stateId of ['dash_forward', 'dash_backward', 'air_dash_forward', 'air_dash_backward', 'standing_block', 'crouching_block', 'crouch', 'crouch_to_stand', 'jump', 'turn_facing']) {
    const frames = review.movementModernization.states[stateId].frames;
    assert.strictEqual(new Set(frames.map((frame) => frame.sha256)).size, frames.length);
    for (const frame of frames) {
      const filename = path.join(engineRoot, 'public', frame.publicPath.replace(/^\//, ''));
      assert.ok(fs.existsSync(filename), frame.publicPath);
      assert.strictEqual(hash(filename), frame.sha256);
      assert.deepStrictEqual(frame.root, { x: 768, y: 1360 });
    }
  }
  assert.ok(!review.sourceAudit.missingV2Coverage.includes('stand_to_crouch'));
  assert.ok(!review.sourceAudit.missingV2Coverage.includes('crouch_to_stand'));
  assert.ok(review.sourceAudit.animations.some((entry) => entry.animationName === 'crouch_to_stand' && entry.transitionBehavior.includes('interrupts immediately')));
  assert.ok(!review.sourceAudit.missingV2Coverage.includes('landing_authored'));
  assert.strictEqual(review.throwAnimations.status, 'APPROVED_STANDARD_GRAB_FORWARD_THROW_BACK_THROW_CANDIDATE_ONLY');
  assert.strictEqual(review.throwAnimations.candidateOnly, true);
  assert.strictEqual(review.throwAnimations.deployable, false);
  assert.strictEqual(review.throwAnimations.perFrameRescale, false);
  assert.strictEqual(review.throwAnimations.globalVictimScale, false);
  assert.deepStrictEqual(review.throwAnimations.humanApproval, { standardGrab: 'APPROVED_STANDARD_GRAB', forwardThrow: 'APPROVED_FORWARD_THROW', backThrow: 'APPROVED_BACK_THROW' });
  assert.ok(review.throwAnimations.approvalReceipt.path.endsWith('records/standard-grab-throw-family-v1.approval.json'));
  assert.deepStrictEqual(Object.keys(review.throwAnimations.sequences), ['universal_grab_attempt', 'forward_throw', 'back_throw']);
  assert.deepStrictEqual(review.throwAnimations.sequences.forward_throw.exposureTicks, [6, 2, 3, 4, 5, 12]);
  assert.deepStrictEqual(review.throwAnimations.sequences.back_throw.exposureTicks, [6, 2, 4, 4, 6, 14]);
  for (const sequence of Object.values(review.throwAnimations.sequences)) {
    assert.strictEqual(sequence.frames.length, 6);
    assert.strictEqual(new Set(sequence.frames.map((frame) => frame.sha256)).size, 6);
    assert.strictEqual(sequence.exposureTicks.reduce((sum, ticks) => sum + ticks, 0), sequence.totalTicks);
    for (const frame of sequence.frames) {
      const filename = path.join(engineRoot, 'public', frame.publicPath.replace(/^\//, ''));
      assert.ok(fs.existsSync(filename), frame.publicPath);
      assert.strictEqual(hash(filename), frame.sha256);
      assert.deepStrictEqual(frame.root, { x: 768, y: 1360 });
    }
  }
  const comparisonSource = fs.readFileSync(path.join(engineRoot, 'src', 'lamuhlegacy', 'review.ts'), 'utf8');
  assert.ok(comparisonSource.includes('NEW V2 STANDARD GRAB / THROWS'));
  assert.ok(comparisonSource.includes('NO RECOVERABLE V1 UNIVERSAL THROW SOURCE'));
  assert.ok(comparisonSource.includes('throw:${sequence.id}'));
  assert.ok(comparisonSource.includes('RELEASE / SIDE SWITCH'));
  assert.ok(comparisonSource.includes('fixed ${data.throwAnimations.root.x}, ${data.throwAnimations.root.y} · body path overlay'));
  assert.strictEqual(review.timingCandidates.moves.find((move) => move.moveId === 'standing_light').v1Historical.durationTicks, 15);
  assert.strictEqual(review.timingCandidates.moves.find((move) => move.moveId === 'standing_heavy').v1Historical.durationTicks, 31);
  assert.strictEqual(review.timingCandidates.moves.find((move) => move.moveId === 'ascend_step').v1Historical.durationTicks, 30);
  const dashPunchReport = JSON.parse(fs.readFileSync(path.join(repoRoot, 'tools', 'nga-forge', 'review', 'lamuh-legacy-v2-ascend-step-dash-punch-v2', 'normalization.report.json'), 'utf8').replace(/^\uFEFF/, ''));
  const mediumReport = JSON.parse(fs.readFileSync(path.join(repoRoot, 'tools', 'nga-forge', 'review', 'lamuh-legacy-v2-ascend-step-medium-slide-flip-v1', 'normalization.report.json'), 'utf8').replace(/^\uFEFF/, ''));
  const heavyReport = JSON.parse(fs.readFileSync(path.join(repoRoot, 'tools', 'nga-forge', 'review', 'lamuh-legacy-v2-ascend-step-heavy-v1', 'normalization.report.json'), 'utf8').replace(/^\uFEFF/, ''));
  for (const report of [dashPunchReport, heavyReport]) {
    assert.strictEqual(report.validation.exactIdentitySourceReuse, true);
    assert.strictEqual(report.validation.generatedAvatarFrameCount, 0);
    assert.strictEqual(report.validation.fullBodyCanvasContainment, true);
    assert.strictEqual(report.identityLock.exactApprovedBodyFrames, true);
    assert.strictEqual(report.identityLock.generatedAvatarPixels, false);
    assert.strictEqual(report.identityLock.recoveryUsesApprovedIdle, true);
  }
  assert.strictEqual(mediumReport.validation.approvedIdentitySourceReuse, true);
  assert.strictEqual(mediumReport.validation.generatedAvatarSourceFrameCount, 6);
  assert.strictEqual(mediumReport.validation.generatedAvatarAnimationFrameCount, 9);
  assert.strictEqual(mediumReport.validation.fullBodyCanvasContainment, true);
  assert.strictEqual(mediumReport.validation.hitCountParity, true);
  assert.strictEqual(mediumReport.validation.fixedWorldRoot, false);
  assert.strictEqual(mediumReport.validation.forwardSlideRootTravel, 'PASS_CANDIDATE_INTERNAL_REVIEW');
  assert.strictEqual(mediumReport.validation.backwardMomentumRedirection, 'PASS_CANDIDATE_INTERNAL_REVIEW');
  assert.strictEqual(mediumReport.validation.slideRetractionCoilConnector, 'PASS_CANDIDATE_INTERNAL_REVIEW');
  assert.strictEqual(mediumReport.validation.backwardHandsReachConnector, 'PASS_CANDIDATE_INTERNAL_REVIEW');
  assert.strictEqual(mediumReport.validation.asymmetricSingleLegLauncher, 'PASS_CANDIDATE_INTERNAL_REVIEW');
  assert.strictEqual(mediumReport.identityLock.approvedRuntimeBodyFramesOnly, false);
  assert.strictEqual(mediumReport.identityLock.generatedAvatarPixels, true);
  assert.strictEqual(mediumReport.identityLock.authoredMissingStateSourceFrames, 6);
  assert.strictEqual(mediumReport.identityLock.recoveryUsesApprovedIdle, true);
  assert.deepStrictEqual(mediumReport.contactFrames, [3, 10]);
  assert.deepStrictEqual(mediumReport.timing.contactTicks, [7, 26]);
  assert.ok(mediumReport.frames.every((frame) => frame.identityBodyPath.includes('NO_GODS_ABOVE/engine_v2/public/lamuh-legacy-v2/') || frame.identityBodyPath.includes('tools/nga-forge/review/lamuh-legacy-v2-ascend-step-medium-slide-flip-v1/raw/')));
  assert.strictEqual(mediumReport.frames.filter((frame) => frame.sourceKind.startsWith('authored_missing_state_')).length, 9);
  assert.ok(mediumReport.frames.every((frame) => frame.rigidBodyTransform.scale === 1));
  assert.ok(dashPunchReport.frames.every((frame) => frame.identityBodyPath.includes('/public/lamuh-legacy-v2/')));
  assert.strictEqual(heavyReport.frames.filter((frame) => frame.identityBodyPath === null).length, 1, 'only the authored teleport streak may omit Lamuh');
  assert.strictEqual(heavyReport.frames.find((frame) => frame.index === 3).role, 'vfx_only_teleport_dissolve_streak');
  const avatarRejection = read('records/ascend-step-generated-avatar-v3.rejection.json');
  assert.strictEqual(avatarRejection.decision, 'REJECTED_FOR_MOTION_REVISION');
  assert.strictEqual(avatarRejection.replacementDirection.generatedAvatarPixels, false);
  assert.strictEqual(avatarRejection.approvalBoundary.deployable, false);
  const ascend = review.ascendStepClosure;
  assert.strictEqual(ascend.status, 'APPROVED_FOR_CURRENT_PRODUCTION_BASELINE_WITH_POLISH_DEBT', 'Forward family retains its provisional starred status independently of next gate');
  assert.strictEqual(ascend.candidateOnly, true);
  assert.strictEqual(ascend.deployable, false);
  assert.strictEqual(ascend.identityLock.matureAdultProportions, true);
  assert.strictEqual(ascend.identityLock.noChibiProportions, true);
  assert.strictEqual(ascend.identityLock.compactFramesUsePoseCompressionNotPerFrameScale, true);
  assert.strictEqual(ascend.identityLock.internalVisualAudit, 'PASS_CANDIDATE_INTERNAL_REVIEW');
  assert.strictEqual(ascend.identityLock.humanApproval, null);
  assert.ok(ascend.identityLock.directionReceipt.path.endsWith('records/ascend-step-medium-targeted-motion-repair-v3.human-direction.json'));
  assert.strictEqual(ascend.v1.sourceFrameCount, 7);
  assert.strictEqual(ascend.v2.frames.length, 16);
  assert.deepStrictEqual(ascend.v2.contactFrames, [3, 10]);
  assert.strictEqual(new Set(ascend.v2.frames.map((frame) => frame.sha256)).size, 16);
  assert.ok(ascend.v2.frames.every((frame) => frame.root.x === 768 && frame.root.y === 1360));
  assert.ok(ascend.v2.frames.every((frame) => frame.rigidBodyTransform.scale === 1));
  assert.strictEqual(ascend.v2.perFrameRescale, false);
  assert.strictEqual(ascend.v2.visualRecentering, false);
  assert.strictEqual(ascend.v2.visibleImpactCount, 2);
  assert.strictEqual(ascend.v2.gameplayHitCount, 2);
  assert.strictEqual(ascend.recommendedTimingCandidate, 'B');
  assert.deepStrictEqual(Object.values(ascend.timingCandidates).map((candidate) => candidate.durationTicks), [44, 48, 52]);
  assert.strictEqual(ascend.timingCandidates.B.durationTicks, 48);
  assert.deepStrictEqual(ascend.timingCandidates.B.exposureTicks, [3, 2, 2, 3, 2, 3, 3, 3, 2, 3, 3, 3, 3, 3, 4, 6]);
  assert.strictEqual(ascend.v2.singleActionContract.oneContinuousPhysicalAction, true);
  assert.strictEqual(ascend.v2.singleActionContract.oneContinuousComboAction, true);
  assert.strictEqual(ascend.v2.singleActionContract.groundedDashForward, true);
  assert.strictEqual(ascend.v2.singleActionContract.punchOnly, false);
  assert.strictEqual(ascend.v2.singleActionContract.strikingLimb, 'one_rising_heel');
  assert.strictEqual(ascend.v2.singleActionContract.strikingLimbContinuity, 'slide_lead_leg_retracts_then_one_rising_heel_strikes_while_other_leg_counterbalances');
  assert.strictEqual(ascend.v2.singleActionContract.clearStrikingLegCount, 1);
  assert.strictEqual(ascend.v2.singleActionContract.counterbalanceLegBent, true);
  assert.strictEqual(ascend.v2.singleActionContract.postContactBodyShape, 'distinct_authored_tuck_not_rotated_contact_sprite');
  assert.deepStrictEqual(ascend.v2.singleActionContract.contactFrames, [3, 10]);
  assert.strictEqual(ascend.v2.singleActionContract.victimTeleport, false);
  assert.strictEqual(ascend.rejectedCandidate.decision, 'REJECTED_FOR_MOTION_REVISION');
  assert.strictEqual(ascend.rejectedCandidate.supersededForMediumByLaterLiveDirection, true);
  assert.strictEqual(ascend.rootMotionContract.owner, 'simulation');
  assert.deepStrictEqual(ascend.rootMotionContract.segments, [
    { role: 'forward_slide', startTick: 2, endTick: 11, velocityPerTick: 9 },
    { role: 'compression_redirect', startTick: 12, endTick: 16, velocityPerTick: -2 },
    { role: 'handspring_pivot', startTick: 17, endTick: 26, velocityPerTick: -1.4 },
    { role: 'exit_rotation_to_landing', startTick: 27, endTick: 33, velocityPerTick: -1 }
  ]);
  assert.deepStrictEqual([ascend.combatCandidate.damage, ascend.combatCandidate.hitstop, ascend.combatCandidate.hitstun, ascend.combatCandidate.blockstun], [70, 8, 34, 18]);
  assert.strictEqual(ascend.combatCandidate.expectedScaledRouteDamage, 66);
  assert.deepStrictEqual(ascend.combatCandidate.hitboxes.map((hitbox) => [hitbox.id, hitbox.start, hitbox.end, hitbox.damage, hitbox.level, hitbox.launches]), [
    ['legacy_ascend_step_medium_slide', 7, 9, 26, 'low', false],
    ['legacy_ascend_step_medium_backspring_launcher', 26, 28, 44, 'launcher', true]
  ]);
  for (const frame of ascend.v2.frames) {
    const filename = path.join(engineRoot, 'public', frame.publicPath.replace(/^\//, ''));
    assert.ok(fs.existsSync(filename), frame.publicPath);
    assert.strictEqual(hash(filename), frame.sha256);
  }
  const builder = fs.readFileSync(path.join(engineRoot, 'scripts', 'build_lamuh_legacy_v2_candidate.js'), 'utf8');
  assert.ok(builder.includes('--bootstrap-source-lock'));
  assert.ok(builder.includes('IMMUTABLE SOURCE LOCK MISMATCH'));
  assert.ok(builder.includes('Style approval asset path mismatch'));
  assert.ok(builder.includes('Style approval asset hash mismatch'));
  assert.ok(!builder.includes("writeJson(path.join(contentRoot, 'source-lock.v1.json')"), 'normal build must never rewrite the immutable source lock');
}

function testForgeRuntimeCombatParity() {
  const bundle = read('character.bundle.json');
  const runtime = fighterDefinitions.lamuh_legacy_v2;
  const packageById = Object.fromEntries(bundle.animationPackages.map((relativePath) => {
    const value = JSON.parse(fs.readFileSync(path.join(contentRoot, relativePath), 'utf8'));
    return [value.id, value];
  }));
  for (const [packageId, runtimeId] of Object.entries({
    standing_light: 'standing_light', standing_medium: 'standing_medium', standing_heavy: 'standing_heavy',
    crouching_light: 'crouching_light', crouching_medium: 'crouching_medium', crouching_heavy: 'crouching_heavy',
    air_light: 'air_light', air_medium: 'air_medium', air_heavy: 'air_heavy',
    ascend_step_light: 'legacy_ascend_step_light', ascend_step: 'legacy_ascend_step', ascend_step_heavy: 'legacy_ascend_step_heavy'
  })) {
    const pkg = packageById[packageId], attack = runtime.attacks[runtimeId], profile = pkg.gameplayTimingStatus.candidateValues;
    assert.deepStrictEqual([pkg.combatTrack.startup, pkg.combatTrack.active, pkg.combatTrack.recovery], [attack.startup, attack.active, attack.recovery], `${packageId} phases`);
    const hitbox = attack.hitboxes[0], finalHitbox = attack.hitboxes.at(-1);
    assert.deepStrictEqual([pkg.combatTrack.damage, pkg.combatTrack.hitstop, pkg.combatTrack.hitstun, pkg.combatTrack.blockstun], [attack.hitboxes.reduce((sum, item) => sum + item.damage, 0), finalHitbox.hitstop, finalHitbox.hitstun, finalHitbox.blockstun], `${packageId} impact values`);
    assert.deepStrictEqual(profile.runtimeHitbox, hitbox.rect, `${packageId} first runtime hitbox`);
    if (profile.runtimeHitboxes) assert.deepStrictEqual(profile.runtimeHitboxes, attack.hitboxes.map((item) => ({ id: item.id, start: item.start, end: item.end, rect: item.rect, damage: item.damage, hitstop: item.hitstop, hitstun: item.hitstun, blockstun: item.blockstun, knockbackX: item.knockbackX, knockbackY: item.knockbackY, level: item.level, juggleCost: item.juggleCost || 0 })), `${packageId} full runtime hitbox track`);
    else assert.strictEqual(attack.hitboxes.length, 1, `${packageId} legacy single-hit profile may omit the expanded track`);
    assert.strictEqual(pkg.combatTrack.boxes.length, attack.hitboxes.length, `${packageId} Forge hitbox count`);
    assert.deepStrictEqual(profile.cancelOnHit, attack.cancel?.onHit || []);
    assert.deepStrictEqual(profile.cancelOnBlock, attack.cancel?.onBlock || []);
    assert.ok(profile.counterHitCandidate && profile.meterCandidate && profile.scalingCandidate, `${packageId} gameplay-impact candidates`);
    if (packageId === 'ascend_step_heavy') assert.deepStrictEqual(profile.targetSideSwitch, attack.targetSideSwitch, 'Ascend Step Heavy target-side-switch metadata');
    if (packageId === 'ascend_step') {
      assert.strictEqual(pkg.presentationTrack.length, 2, 'Ascend Step Medium must present both authored contacts');
      assert.deepStrictEqual(pkg.presentationTrack.map((event) => event.frame), [7, 26]);
    }
    if (pkg.presentationTrack.length) assert.strictEqual(pkg.presentationTrack[0].frame, attack.startup, `${packageId} presentation contact event`);
    else assert.ok(packageId.startsWith('air_'), `${packageId} may omit presentation only for the body-only air-normal review batch`);
  }
  for (const [packageId, totalTicks] of Object.entries({ universal_grab_attempt: 20, forward_throw: runtime.throws.forward_throw.totalTicks, back_throw: runtime.throws.back_throw.totalTicks })) {
    const pkg = packageById[packageId];
    assert.strictEqual(pkg.simulationLength, totalTicks, `${packageId} duration`);
    assert.strictEqual(pkg.sourceFrames.length, 6, `${packageId} dedicated frame count`);
    assert.ok(pkg.sourceFrames.every((frame) => frame.width === 2048 && frame.height === 1536), `${packageId} fixed canvas`);
    assert.strictEqual(pkg.gameplayTimingStatus.candidateValues.throwPlaceholder, false);
    assert.strictEqual(pkg.gameplayTimingStatus.candidateValues.dedicatedThrowArt, true);
    assert.deepStrictEqual(pkg.validation.creativeWarnings, []);
    assert.strictEqual(pkg.provenance.sourceType, 'new_v2_missing_state_authoring');
  }
}

function testForgeBundleCompilesNonDeployable() {
  const bundlePath = path.join(contentRoot, 'character.bundle.json');
  const manifest = compileFromPath(bundlePath);
  assert.strictEqual(manifest.fighterId, 'lamuh_legacy_v2');
  assert.strictEqual(manifest.animations.length, 27);
  assert.strictEqual(manifest.deployable, false);
  const bundle = JSON.parse(fs.readFileSync(bundlePath, 'utf8'));
  assert.ok(bundle.animationPackages.every((relativePath) => JSON.parse(fs.readFileSync(path.join(contentRoot, relativePath), 'utf8')).promotionState === 'candidate'));
  assert.ok(manifest.animations.some((animation) => animation.id === 'forward_throw'));
  assert.ok(manifest.animations.some((animation) => animation.id === 'back_throw'));
  assert.ok(manifest.animations.some((animation) => animation.id === 'air_dash_forward'));
  assert.ok(manifest.animations.some((animation) => animation.id === 'air_dash_backward'));
  assert.ok(manifest.animations.some((animation) => animation.id === 'ascend_step_light'));
  assert.ok(manifest.animations.some((animation) => animation.id === 'ascend_step_heavy'));
}

function testLegacyOriginalAndRetiredFixtureProtection() {
  const lock = read('source-lock.v1.json');
  const gameRecord = lock.artifacts.find((artifact) => artifact.kind === 'legacy_gameplay_definition');
  assert.strictEqual(gameRecord.sha256, 'D081DA2D907CF6ABD978301C1637008B26CCB30B47E2CCAFCA3FEA3331910C6B');
  const retired = JSON.parse(fs.readFileSync(path.join(engineRoot, 'content-source', 'characters', 'lamuh', 'character.bundle.json'), 'utf8'));
  assert.strictEqual(retired.promotionState, 'retired');
  assert.strictEqual(retired.id, 'lamuh_legacy_motion_fixture');
}

const tests = [testSourceLockAndPublicCopies, testAuditIsCompleteAndHonest, testIndependentTimingCandidates, testFirstPlayableAndVictimContract, testFirstPlayableRequirementsMapAndCurrentGate, testReviewCoverageAndImmutableLockBuild, testForgeRuntimeCombatParity, testForgeBundleCompilesNonDeployable, testLegacyOriginalAndRetiredFixtureProtection];
for (const test of tests) { test(); console.log(`PASS ${test.name}`); }
