const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const { fighterDefinitions } = require('../dist/data/fighters');
const { createMatch, tick, sampleAuthoredHop } = require('../dist/core/engine');
const { compileFromPath, loadAndValidateBundle, validateAnimationPackage, stableJson } = require('../scripts/production_contracts');
const root = path.resolve(__dirname, '..'), repo = path.resolve(root, '../..');
const source = path.join(root, 'content-source/characters/lamuh-legacy-v2');
const read = (file) => JSON.parse(fs.readFileSync(file, 'utf8'));
const hash = (file) => crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex').toUpperCase();
const family = read(path.join(source, 'heaven-splitter-family.candidate.v1.json'));
const review = read(path.join(root, 'public/lamuh-legacy-v2/review-data.json'));
const bundlePath = path.join(source, 'heaven-splitter-packages/heaven-splitter.bundle.json');
const expected = { light: { total: 36, timing: [7, 4, 25] }, medium: { total: 43, timing: [10, 5, 28] }, heavy: { total: 53, timing: [14, 6, 33] } };
const approved = 'APPROVED_AS_PRODUCTION_BASELINE';
const nextGate = 'awaiting_human_radiant_dive_family_review';
const receiptPath = 'records/heaven-splitter-v4.approval.json';
const receiptSha = 'E318A6F291EE386D96D68F07A8898538EE7FB928B69F92D74FDBB72885627632';
const receipt = read(path.join(source, receiptPath));
const receiptReference = { path: receiptPath, sha256: receiptSha };

function testHeavenScopedV4ApprovalDoesNotPromoteCharacterOrInheritPalmApproval() {
  assert.equal(hash(path.join(source, receiptPath)), receiptSha, 'The exact human receipt is immutable, not silently regenerated from current art');
  assert.equal(receipt.recordType, 'human_scoped_review');
  assert.equal(receipt.userInput, 'passes onto the next moveset');
  assert.equal(receipt.subject, 'lamuh_legacy_v2.heaven_splitter.light_medium_heavy_v4');
  assert.equal(receipt.decision, approved);
  assert.equal(receipt.acceptedProfile, 'B');
  assert.deepEqual(receipt.approvalScope, ['heaven_splitter_light', 'heaven_splitter_medium', 'heaven_splitter_heavy']);
  assert.deepEqual(receipt.approvalBoundary, {
    currentReviewFamilyApproved: true, proceedToNextSpecialFamily: true,
    rosterPromotion: false, runtimeArtPromotion: false, finalCharacterApproval: false,
    fullProductionApproval: false, combatBalanceFinal: false, reactionPackApproved: false, deployable: false
  });
  assert.equal(receipt.candidateOnly, true);
  assert.equal(receipt.legacySourceRemainsImmutable, true);
  assert.equal(receipt.nextHumanGate, nextGate);
  assert.equal(Object.values(receipt.acceptedFrameHashes).reduce((sum, frames) => sum + frames.length, 0), 36, 'Freeze 36 authored frame references, not a claim of 36 unique PNGs');
  const manifest = read(path.join(root, 'public/lamuh-legacy-v2/heaven-splitter-v1/manifest.json'));
  for (const copy of [family, manifest, review.heavenSplitterFamily]) {
    assert.equal(copy.status, approved);
    assert.equal(copy.candidateOnly, true);
    assert.equal(copy.deployable, false);
    assert.deepEqual(copy.humanApproval, { family: approved, light: approved, medium: approved, heavy: approved });
    assert.deepEqual(copy.approvalReceipt, receiptReference);
    assert.equal(copy.approvalScope, 'shown_current_review_family_and_B_profile_only');
    assert.deepEqual(copy.approvalBoundary, receipt.approvalBoundary);
    assert.equal(copy.heavyCinematicRevision.version, 4);
    for (const [strength, variant] of Object.entries(copy.variants)) {
      assert.equal(variant.status, approved, `${strength} shares only the scoped current-family approval`);
      assert.equal(variant.candidateOnly, true);
      assert.equal(variant.deployable, false);
      assert.deepEqual(variant.approvalReceipt, receiptReference, 'Each Heaven variant must cite its own V4 receipt, never Palm approval');
      assert.equal(variant.approvalScope ?? null, null, 'Palm review scope is not Heaven approval');
      assert.deepEqual(variant.v2.frames.map(({ publicPath, sha256 }) => ({ publicPath, sha256 })), receipt.acceptedFrameHashes[strength]);
      assert.deepEqual(variant.timingCandidates.B, receipt.acceptedTiming[strength]);
      assert.deepEqual(fighterDefinitions.lamuh_legacy_v2.attacks[`legacy_heaven_splitter_${strength}`], receipt.acceptedCombat[strength], 'Art/next-family work must not alter the frozen Heaven combat snapshot');
    }
  }
  assert.equal(review.humanReviewStatus, nextGate);
  assert.equal(review.celestialPalmFamily.status, 'APPROVED_AS_PRODUCTION_BASELINE');
  assert.notEqual(review.celestialPalmFamily.approvalReceipt.path, receiptPath);
  assert.equal(review.ascendStepFamily.starredForRevisit, true);
  const first = read(path.join(source, 'first-playable.bundle.json'));
  assert.equal(first.currentReviewGate.status, nextGate);
  assert.deepEqual(first.heavenSplitterApproval, receiptReference);
  for (const subject of ['turn_facing_motion_mirrored_parity_and_transition', 'fighter_pushbox_separation', 'forward_special_family_light_medium_heavy']) {
    assert.ok(first.currentReviewGate.starredForRevisit.some((entry) => entry.subject === subject), `Preserve existing star: ${subject}`);
  }
  const pending = read(path.join(source, 'records/first-playable-closure.pending.json'));
  assert.equal(pending.humanReviewStatus, nextGate);
  assert.deepEqual(pending.completedFamilyReviews.heavenSplitter, receiptReference);
  assert.ok(first.coverage.specials.includes('heaven_splitter_heavy'));
  assert.equal(first.additiveForgeBundles.find((entry) => entry.role === 'up_specials').packageCount, 3);
}

function testHeavenSourceCoreForgeAndSingleHitParity() {
  const loaded = loadAndValidateBundle(bundlePath), compiled = compileFromPath(bundlePath);
  const generated = read(path.join(root, 'generated/manifests/lamuh_heaven_splitter_v1.candidate.runtime.json'));
  assert.equal(stableJson(compiled), stableJson(generated));
  assert.equal(compiled.deployable, false);
  assert.equal(loaded.packages.length, 3);
  assert.equal(loaded.bundle.promotionState, 'candidate');
  for (const { value: pack } of loaded.packages) {
    const strength = pack.id.replace('heaven_splitter_', ''), closure = family.variants[strength];
    const attack = fighterDefinitions.lamuh_legacy_v2.attacks[`legacy_${pack.id}`], hit = attack.hitboxes[0];
    const motion = pack.combatTrack.selfMotionTrack, timing = closure.timingCandidates.B;
    assert.equal(closure.recommendedTimingCandidate, 'B');
    assert.equal(timing.durationTicks, expected[strength].total);
    assert.deepEqual(Object.values(timing.phaseTicks), expected[strength].timing);
    assert.equal(timing.exposureTicks.reduce((sum, value) => sum + value, 0), expected[strength].total);
    assert.equal(pack.simulationLength, expected[strength].total);
    assert.deepEqual(pack.exposures.map((exposure) => exposure.duration), timing.exposureTicks);
    assert.deepEqual([attack.startup, attack.active, attack.recovery], expected[strength].timing);
    assert.equal(attack.hitboxes.length, 1);
    assert.equal(hit.maxHits, 1);
    assert.equal(hit.launches, true);
    assert.equal(closure.v2.gameplayHitCount, 1);
    assert.equal(closure.v2.visibleImpactCount, 1);
    assert.equal(closure.v2.contactFrames.length, 1);
    assert.equal(closure.v2.frames.filter((frame) => frame.visibleImpact).length, 1);
    const contactFrame = closure.v2.contactFrames[0];
    assert.equal(timing.exposureTicks.slice(0, contactFrame).reduce((sum, value) => sum + value, 0), attack.startup,
      'The one authored impact must align with active start; its frame index is free to change with revised art');
    assert.equal(pack.combatTrack.projectileTrack, undefined, 'Heaven is a body uppercut, not inherited Palm flight');
    assert.deepEqual([pack.combatTrack.damage, pack.combatTrack.hitstop, pack.combatTrack.hitstun, pack.combatTrack.blockstun], [hit.damage, hit.hitstop, hit.hitstun, hit.blockstun]);
    assert.equal(motion.owner, 'deterministic_simulation');
    assert.equal(motion.attackId, attack.id);
    assert.deepEqual(motion.hop, attack.authoredHop);
    assert.deepEqual(motion.rootMotion, attack.rootMotion);
    assert.equal(motion.hitstopFreezes, true);
    assert.equal(motion.interruption, 'handoff_current_position_and_velocity_to_physics');
    assert.deepEqual(pack.combatTrack.boxes.map((box) => box.frame), Array.from({ length: attack.active }, (_, index) => attack.startup + index));
    for (const box of pack.combatTrack.boxes) {
      assert.equal(box.kind, 'hit');
      assert.deepEqual([box.x, box.y, box.width, box.height], [hit.rect.x, hit.rect.y, hit.rect.w, hit.rect.h]);
    }
    assert.deepEqual(pack.landing, [{ start: attack.authoredHop.landTick, end: expected[strength].total - 1, result: 'special_landing' }]);
    assert.equal(pack.promotionState, 'candidate');
    assert.equal(pack.provenance.humanApproval.state, 'pending');
    assert.equal(pack.validation.humanApprovalRequired, true);
    assert.ok(pack.transitions.every((transition) => transition.addsGameplayFrames === false));
  }
}

function testCurrentSourceBytesSizesAndAuthoredHop() {
  const loaded = loadAndValidateBundle(bundlePath);
  const lock = read(path.join(source, 'records/heaven-splitter-v1.hash-lock.json'));
  for (const { value: pack } of loaded.packages) {
    const strength = pack.id.replace('heaven_splitter_', ''), variant = family.variants[strength];
    const attack = fighterDefinitions.lamuh_legacy_v2.attacks[`legacy_${pack.id}`];
    assert.equal(variant.v2.perFrameRescale, false);
    assert.equal(variant.v2.visualRecentering, false);
    assert.ok(variant.v2.singleSequenceScale > 0);
    assert.deepEqual(variant.v2.root, { x: 768, y: 1360 });
    assert.equal(pack.sourceFrames.length, variant.v2.frames.length);
    // Freeze the scoped accepted V4 revision, while retaining the rejected histories separately.
    assert.deepEqual(lock.frames[strength], variant.v2.frames.map((frame) => ({ publicPath: frame.publicPath, sha256: frame.sha256 })));
    assert.deepEqual(lock.frames[strength], receipt.acceptedFrameHashes[strength]);
    pack.sourceFrames.forEach((frame, index) => {
      const visible = variant.v2.frames[index];
      const file = path.resolve(repo, frame.sourceUri.replace(/^repo:\/\//, ''));
      const publicFile = path.resolve(root, 'public', visible.publicPath.replace(/^\//, ''));
      assert.ok(file.startsWith(repo + path.sep) && publicFile.startsWith(path.join(root, 'public') + path.sep));
      assert.equal(hash(file), frame.sha256);
      assert.equal(hash(publicFile), frame.sha256);
      assert.equal(visible.sha256, frame.sha256);
      const png = fs.readFileSync(file);
      assert.deepEqual([...png.subarray(0, 8)], [137, 80, 78, 71, 13, 10, 26, 10]);
      assert.deepEqual([png.readUInt32BE(16), png.readUInt32BE(20)], [2048, 1536]);
      assert.equal(png[25], 6, 'Runtime frames must retain real RGBA alpha');
    });
    assert.equal(variant.v2.authoredWorldRootPath.length, expected[strength].total);
    variant.v2.authoredWorldRootPath.forEach((point, moveTick) => {
      assert.equal(point.y, sampleAuthoredHop(attack.authoredHop, moveTick).y);
      const root = attack.rootMotion;
      assert.equal(point.x, Math.max(0, Math.min(moveTick - root.start + 1, root.end - root.start + 1)) * root.velocity);
    });
    for (const actor of ['p1', 'p2']) {
      const state = createMatch(90607, { p1Kind: 'lamuh_legacy_v2', p2Kind: 'lamuh_legacy_v2', p1X: -250, p2X: 250 });
      const fighter = state.fighters[actor];
      let peak = 0;
      for (let moveTick = 1; moveTick <= expected[strength].total; moveTick++) {
        tick(state, moveTick === 1 ? { [actor]: { up: true, special: true, [strength]: true } } : {});
        assert.equal(fighter.y, sampleAuthoredHop(attack.authoredHop, moveTick).y);
        peak = Math.min(peak, fighter.y);
      }
      assert.equal(peak, -attack.authoredHop.height);
      assert.equal(fighter.currentAttack, null);
      assert.equal(fighter.y, 0);
      assert.equal(fighter.grounded, true);
    }
  }
}

function testSelfMotionContractRejectsInvalidOwnershipAndTrajectories() {
  const loaded = loadAndValidateBundle(bundlePath), original = loaded.packages[0].value;
  const poses = new Set(loaded.bundle.poseLibrary.map((pose) => pose.id));
  const ids = new Set(loaded.packages.map((record) => record.value.id));
  const validate = (pack) => validateAnimationPackage(pack, poses, ids, 'Heaven negative fixture');
  validate(original);
  const cases = [
    ['renderer ownership', (m) => { m.owner = 'renderer'; }],
    ['hitstop drift', (m) => { m.hitstopFreezes = false; }],
    ['missing source', (m) => { delete m.attackId; }],
    ['invalid source', (m) => { m.attackId = 'not an id'; }],
    ['teleport interruption', (m) => { m.interruption = 'reset_to_origin'; }],
    ['no hop', (m) => { delete m.hop; }],
    ['early takeoff', (m) => { m.hop.takeoffTick--; }],
    ['fractional takeoff', (m) => { m.hop.takeoffTick += 0.5; }],
    ['apex before takeoff', (m) => { m.hop.apexTick = m.hop.takeoffTick; }],
    ['landing before apex', (m) => { m.hop.landTick = m.hop.apexTick; }],
    ['landing after attack', (m) => { m.hop.landTick = original.simulationLength; }],
    ['fractional apex', (m) => { m.hop.apexTick += 0.5; }],
    ['fractional landing', (m) => { m.hop.landTick += 0.5; }],
    ...[0, -1, NaN, Infinity].map((height) => [`height=${height}`, (m) => { m.hop.height = height; }]),
    ['no horizontal track', (m) => { delete m.rootMotion; }],
    ['negative track start', (m) => { m.rootMotion.start = -1; }],
    ['backward track window', (m) => { m.rootMotion.start = m.rootMotion.end + 1; }],
    ['track outlives attack', (m) => { m.rootMotion.end = original.simulationLength; }],
    ['fractional track start', (m) => { m.rootMotion.start += 0.5; }],
    ['fractional track end', (m) => { m.rootMotion.end += 0.5; }],
    ['nonfinite horizontal speed', (m) => { m.rootMotion.velocity = Infinity; }]
  ];
  for (const [label, mutate] of cases) {
    const pack = structuredClone(original);
    mutate(pack.combatTrack.selfMotionTrack);
    assert.throws(() => validate(pack), /selfMotionTrack/, label);
  }
  assert.equal(cases.length, 24);
  const schema = read(path.join(root, 'schemas/production/combat-track.schema.json')).properties.selfMotionTrack;
  assert.equal(schema.additionalProperties, false);
  for (const key of Object.keys(original.combatTrack.selfMotionTrack)) assert.ok(schema.required.includes(key) && schema.properties[key]);
  assert.equal(schema.properties.owner.const, 'deterministic_simulation');
  assert.equal(schema.properties.hitstopFreezes.const, true);
}

for (const test of [testHeavenScopedV4ApprovalDoesNotPromoteCharacterOrInheritPalmApproval, testHeavenSourceCoreForgeAndSingleHitParity, testCurrentSourceBytesSizesAndAuthoredHop, testSelfMotionContractRejectsInvalidOwnershipAndTrajectories]) {
  test(); console.log(`PASS ${test.name}`);
}
