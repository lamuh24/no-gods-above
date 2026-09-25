const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const { fighterDefinitions } = require('../dist/data/fighters');
const { compileFromPath, loadAndValidateBundle, validateAnimationPackage, stableJson } = require('../scripts/production_contracts');
const { acceptedSnapshot, verifyFrozenAcceptance, decision, nextGate, focusDecisions } = require('../scripts/mark_lamuh_celestial_palm_v1');
const root = path.resolve(__dirname, '..'), repo = path.resolve(root, '../..');
const source = path.join(root, 'content-source/characters/lamuh-legacy-v2');
const read = (file) => JSON.parse(fs.readFileSync(file, 'utf8'));
const hash = (file) => crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex').toUpperCase();
const family = read(path.join(source, 'celestial-palm-family.candidate.v1.json'));
const review = read(path.join(root, 'public/lamuh-legacy-v2/review-data.json'));
const receiptPath = path.join(source, 'records/celestial-palm-v1.approval.json');
const receipt = read(receiptPath);
const bundlePath = path.join(source, 'celestial-palm-packages/celestial-palm.bundle.json');

function testScopedApprovalAndFrozenShownSources() {
  const manifest = read(path.join(root, 'public/lamuh-legacy-v2/celestial-palm-v1/manifest.json'));
  assert.equal(receipt.userInput, 'passes now move onto the next moveset');
  assert.equal(receipt.decision, decision);
  assert.equal(receipt.acceptedProfile, 'B');
  assert.deepEqual(receipt.approvalScope, ['celestial_palm_light', 'celestial_palm_medium', 'celestial_palm_heavy']);
  assert.equal(receipt.approvalBoundary.currentReviewFamilyApproved, true);
  assert.equal(receipt.approvalBoundary.proceedToNextSpecialFamily, true);
  for (const key of ['rosterPromotion', 'runtimeArtPromotion', 'finalCharacterApproval', 'fullProductionApproval', 'combatBalanceFinal', 'reactionPackApproved', 'deployable']) {
    assert.equal(receipt.approvalBoundary[key], false, `${key} was not included in this scoped pass`);
  }
  for (const copy of [family, manifest, review.celestialPalmFamily]) {
    assert.equal(copy.status, decision);
    assert.equal(copy.candidateOnly, true);
    assert.equal(copy.deployable, false);
    assert.equal(copy.approvalReceipt.sha256, hash(receiptPath));
    assert.deepEqual(Object.values(copy.humanApproval), [decision, decision, decision, decision]);
    verifyFrozenAcceptance(receipt, acceptedSnapshot(copy));
  }
  assert.deepEqual(Object.values(receipt.acceptedFrameHashes).map((frames) => frames.length), [7, 8, 7]);
  const alteredFrame = acceptedSnapshot(family);
  alteredFrame.acceptedFrameHashes.light[0].sha256 = '0'.repeat(64);
  assert.throws(() => verifyFrozenAcceptance(receipt, alteredFrame), /art changed/);
  const alteredTiming = acceptedSnapshot(family);
  alteredTiming.acceptedTiming.medium.exposureTicks[0]++;
  assert.throws(() => verifyFrozenAcceptance(receipt, alteredTiming), /timing changed/);
  assert.deepEqual(family.variants.light.timingCandidates.B.phaseTicks, { startup: 9, active: 2, recovery: 17 });
  assert.deepEqual(family.variants.medium.timingCandidates.B.phaseTicks, { startup: 14, active: 3, recovery: 23 });
  assert.deepEqual(family.variants.heavy.timingCandidates.B.phaseTicks, { startup: 21, active: 4, recovery: 31 });
}

function testSourceCoreAndCompiledForgeParity() {
  const loaded = loadAndValidateBundle(bundlePath);
  const compiled = compileFromPath(bundlePath);
  const generated = read(path.join(root, 'generated/manifests/lamuh_celestial_palm_v1.candidate.runtime.json'));
  assert.equal(stableJson(compiled), stableJson(generated), 'Saved candidate must be the actual current Forge compilation');
  assert.equal(compiled.deployable, false);
  assert.equal(loaded.bundle.promotionState, 'candidate', 'Scoped family pass cannot silently promote the art bundle');
  assert.equal(loaded.packages.length, 3);
  for (const record of loaded.packages) {
    const pack = record.value, strength = pack.id.replace('celestial_palm_', '');
    const closure = family.variants[strength], attack = fighterDefinitions.lamuh_legacy_v2.attacks[`legacy_${pack.id}`];
    const shot = attack.projectile, track = pack.combatTrack.projectileTrack;
    assert.equal(pack.promotionState, 'candidate');
    assert.equal(pack.provenance.humanApproval.state, 'pending', 'Whole art/provenance promotion remains separately gated');
    assert.equal(pack.validation.humanApprovalRequired, true);
    assert.deepEqual(attack.hitboxes, []);
    assert.deepEqual(pack.combatTrack.boxes, []);
    assert.equal(pack.simulationLength, attack.startup + attack.active + attack.recovery);
    assert.deepEqual(pack.exposures.map((exposure) => exposure.duration), receipt.acceptedTiming[strength].exposureTicks);
    assert.deepEqual([pack.combatTrack.startup, pack.combatTrack.active, pack.combatTrack.recovery], [attack.startup, attack.active, attack.recovery]);
    assert.deepEqual([pack.combatTrack.damage, pack.combatTrack.hitstop, pack.combatTrack.hitstun, pack.combatTrack.blockstun], [shot.hitbox.damage, shot.hitbox.hitstop, shot.hitbox.hitstun, shot.hitbox.blockstun]);
    assert.equal(track.attackId, attack.id);
    assert.equal(track.releaseTick, shot.releaseTick);
    assert.equal(track.maxHits, 1);
    assert.equal(track.independentAfterRelease, true);
    assert.equal(track.bodyHitboxes, false);
    assert.equal(track.owner, 'deterministic_simulation');
    assert.equal(track.damage, shot.hitbox.damage);
    for (const key of ['spawnOffset', 'speed', 'gravity', 'maxTravel', 'lifeTicks']) assert.deepEqual(track[key], shot[key], `${pack.id}: ${key} source/core drift`);
    assert.deepEqual(track.collisionRect, shot.hitbox.rect);
    assert.equal(pack.presentationTrack.length, 1);
    assert.equal(pack.presentationTrack[0].frame, shot.releaseTick);
    assert.equal(pack.presentationTrack[0].payload.requiresAuthoritativeProjectileSpawn, true);
    assert.equal(closure.v2.gameplayHitCount, 1);
    assert.equal(closure.v2.contactPresentation.bodyOnlyForAllOutcomes, true);
    assert.equal(pack.sourceFrames.length, closure.v2.frames.length);
    pack.sourceFrames.forEach((frame, index) => {
      assert.equal(frame.sha256, closure.v2.frames[index].sha256);
      const file = path.resolve(repo, frame.sourceUri.replace(/^repo:\/\//, ''));
      assert.ok(file.startsWith(repo + path.sep));
      assert.equal(hash(file), frame.sha256, `${pack.id} frame ${index}: actual source bytes drifted`);
      assert.equal(frame.width, 2048);
      assert.equal(frame.height, 1536);
    });
  }
}

function testProjectileTrackRejectsInvalidContracts() {
  const loaded = loadAndValidateBundle(bundlePath);
  const original = loaded.packages.find((record) => record.value.id === 'celestial_palm_light').value;
  const poses = new Set(loaded.bundle.poseLibrary.map((pose) => pose.id));
  const packages = new Set(loaded.packages.map((record) => record.value.id));
  const validate = (pack) => validateAnimationPackage(pack, poses, packages, 'Palm negative fixture');
  validate(original);
  const cases = [
    ['missing damaging track', (p) => { delete p.combatTrack.projectileTrack; }],
    ['renderer ownership', (p) => { p.combatTrack.projectileTrack.owner = 'renderer'; }],
    ['multiple hits', (p) => { p.combatTrack.projectileTrack.maxHits = 2; }],
    ['owner-attached flight', (p) => { p.combatTrack.projectileTrack.independentAfterRelease = false; }],
    ['fake body damage', (p) => { p.combatTrack.projectileTrack.bodyHitboxes = true; }],
    ['missing source attack', (p) => { delete p.combatTrack.projectileTrack.attackId; }],
    ['invalid source attack', (p) => { p.combatTrack.projectileTrack.attackId = 'not a stable attack id'; }],
    ['fractional lifetime', (p) => { p.combatTrack.projectileTrack.lifeTicks = 1.5; }],
    ['fractional release', (p) => { p.combatTrack.projectileTrack.releaseTick = 9.5; }],
    ['early release', (p) => { p.combatTrack.projectileTrack.releaseTick--; }],
    ['late release', (p) => { p.combatTrack.projectileTrack.releaseTick++; }],
    ...['speed', 'maxTravel', 'lifeTicks'].flatMap((key) => [0, -1, NaN, Infinity].map((value) => [`${key}=${value}`, (p) => { p.combatTrack.projectileTrack[key] = value; }])),
    ['negative gravity', (p) => { p.combatTrack.projectileTrack.gravity = -0.18; }],
    ['nonfinite gravity', (p) => { p.combatTrack.projectileTrack.gravity = NaN; }],
    ['missing muzzle', (p) => { delete p.combatTrack.projectileTrack.spawnOffset; }],
    ['nonfinite muzzle', (p) => { p.combatTrack.projectileTrack.spawnOffset.y = Infinity; }],
    ['empty collision', (p) => { p.combatTrack.projectileTrack.collisionRect.w = 0; }],
    ['inverted collision', (p) => { p.combatTrack.projectileTrack.collisionRect.h = -1; }],
    ['nonfinite collision', (p) => { p.combatTrack.projectileTrack.collisionRect.x = NaN; }],
    ['different damage', (p) => { p.combatTrack.projectileTrack.damage++; }]
  ];
  for (const [label, mutate] of cases) {
    const invalid = structuredClone(original);
    mutate(invalid);
    assert.throws(() => validate(invalid), /projectileTrack|no hit, throw or projectile box/, label);
  }
  assert.equal(cases.length, 31);
  const schema = read(path.join(root, 'schemas/production/combat-track.schema.json'));
  const projectileSchema = schema.properties.projectileTrack;
  assert.equal(projectileSchema.additionalProperties, false);
  for (const key of Object.keys(original.combatTrack.projectileTrack)) {
    assert.ok(projectileSchema.properties[key], `${key}: actual Forge output is absent from strict JSON schema`);
    assert.ok(projectileSchema.required.includes(key), `${key}: projectile contract became optional`);
  }
  assert.equal(projectileSchema.properties.owner.const, 'deterministic_simulation');
  assert.equal(projectileSchema.properties.maxHits.const, 1);
  assert.equal(projectileSchema.properties.independentAfterRelease.const, true);
  assert.equal(projectileSchema.properties.bodyHitboxes.const, false);
  assert.equal(projectileSchema.properties.lifeTicks.type, 'integer');
}

function testNextGateAndExistingStarsArePreserved() {
  const first = read(path.join(source, 'first-playable.bundle.json'));
  const closure = read(path.join(source, 'records/first-playable-closure.pending.json'));
  assert.equal(first.currentReviewGate.status, nextGate);
  for (const value of [first, closure, review, review.firstPlayable]) assert.equal(value.humanReviewStatus, nextGate);
  for (const focus of focusDecisions) assert.ok(first.currentReviewGate.focusDecisions.includes(focus));
  assert.equal(closure.activeFamilyReview, 'heaven_splitter_light_medium_heavy');
  assert.equal(closure.celestialPalmApproval.sha256, hash(receiptPath));
  for (const subject of ['turn_facing_motion_mirrored_parity_and_transition', 'fighter_pushbox_separation', 'forward_special_family_light_medium_heavy']) {
    const star = first.currentReviewGate.starredForRevisit.find((entry) => entry.subject === subject);
    assert.ok(star, `${subject} star was lost`);
    assert.equal(star.decision, 'APPROVED_FOR_CURRENT_PRODUCTION_BASELINE_WITH_POLISH_DEBT');
  }
  assert.deepEqual(closure.currentReviewFocus.starredForRevisit, first.currentReviewGate.starredForRevisit);
  assert.equal(review.ascendStepFamily.starredForRevisit, true);
}

for (const test of [testScopedApprovalAndFrozenShownSources, testSourceCoreAndCompiledForgeParity, testProjectileTrackRejectsInvalidContracts, testNextGateAndExistingStarsArePreserved]) {
  test(); console.log(`PASS ${test.name}`);
}
