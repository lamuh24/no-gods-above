const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const { loadAndValidateBundle, compileBundle, validateAnimationPackage, stableJson } = require('../scripts/production_contracts');
const { holds, status } = require('../scripts/build_lamuh_divine_vanish_v1');
const root = path.resolve(__dirname, '..'), repo = path.resolve(root, '../..');
const base = path.join(root, 'content-source/characters/lamuh-legacy-v2');
const read = p => JSON.parse(fs.readFileSync(p, 'utf8'));
const hash = p => crypto.createHash('sha256').update(fs.readFileSync(p)).digest('hex').toUpperCase();
const strengths = ['light', 'medium', 'heavy'];

function testStrictGroundedTrackAndUnchangedHopValidation() {
  const fixture = read(path.join(base, 'celestial-palm-packages/light/animation.package.json'));
  fixture.combatTrack = { ...fixture.combatTrack, active: 0, recovery: fixture.simulationLength - fixture.combatTrack.startup, damage: 0, hitstop: 0, hitstun: 0, blockstun: 0, boxes: [], cancelWindows: [], rootMotionTrack: { owner: 'deterministic_simulation', attackId: 'legacy_divine_vanish_light', hitstopFreezes: true, segments: [{ start: 3, end: 4, velocity: -6 }, { start: 5, end: 6, velocity: -18 }] } };
  delete fixture.combatTrack.projectileTrack;
  const bundle = read(path.join(base, 'character.bundle.json'));
  const context = { packageIds: new Set([fixture.id]), poseIds: new Set(bundle.poseLibrary.map(p => p.id)) };
  const validate = value => validateAnimationPackage(value, context.poseIds, context.packageIds, 'Grounded motion fixture');
  validate(fixture);
  for (const mutate of [
    p => p.combatTrack.rootMotionTrack.owner = 'renderer',
    p => p.combatTrack.rootMotionTrack.hitstopFreezes = false,
    p => p.combatTrack.rootMotionTrack.segments = [],
    p => p.combatTrack.rootMotionTrack.segments[0].velocity = NaN,
    p => p.combatTrack.rootMotionTrack.segments[0].start = .5,
    p => p.combatTrack.rootMotionTrack.segments[0].end = 28,
    p => p.combatTrack.rootMotionTrack.segments[1].start = 4,
    p => p.combatTrack.rootMotionTrack.segments.reverse(),
    p => p.combatTrack.selfMotionTrack = {}
  ]) {
    const broken = structuredClone(fixture); mutate(broken); assert.throws(() => validate(broken), /rootMotionTrack/);
  }
  const hop = read(path.join(base, 'heaven-splitter-packages/light/animation.package.json'));
  const hopContext = { packageIds: new Set([hop.id]), poseIds: context.poseIds };
  validateAnimationPackage(hop, hopContext.poseIds, hopContext.packageIds, 'Existing hop');
  const brokenHop = structuredClone(hop); delete brokenHop.combatTrack.selfMotionTrack.hop;
  assert.throws(() => validateAnimationPackage(brokenHop, hopContext.poseIds, hopContext.packageIds, 'Broken existing hop'), /hop invalid/);
}

function testCandidateAndSourceIntegrity() {
  const family = read(path.join(base, 'divine-vanish-family.candidate.v1.json'));
  const review = read(path.join(root, 'public/lamuh-legacy-v2/review-data.json'));
  const report = read(path.join(repo, 'tools/nga-forge/review/lamuh-legacy-v2-divine-vanish-v1/normalization.report.json'));
  assert.equal(family.status, status); assert.equal(family.candidateOnly, true); assert.equal(family.deployable, false);
  assert.deepEqual(family.humanApproval, { family: null, light: 'APPROVED_AS_PRODUCTION_BASELINE', medium: null, heavy: null });
  const receipt = read(path.join(base, 'records/divine-vanish-light-v1.approval.json'));
  assert.equal(receipt.combatApproved, false); assert.equal(receipt.productionPromotion, false);
  assert.equal(receipt.deployable, false); assert.equal(receipt.mediumApproved, false); assert.equal(receipt.heavyApproved, false);
  assert.deepEqual(family, read(path.join(root, 'public/lamuh-legacy-v2/divine-vanish-v1/manifest.json')));
  assert.equal(report.sourceArtStatus, 'candidate_ready_for_human_review'); assert.equal(report.frames.length, 6);
  assert.equal(report.perFrameRescale, false);
  for (const strength of strengths) {
    const c = family.variants[strength];
    assert.equal(c.v2.frames.length, strength === 'light' ? 8 : 10); assert.equal(c.v2.contactFrame, null); assert.deepEqual(c.v2.contactFrames, []);
    assert.equal(c.v2.visibleImpactCount, 0); assert.equal(c.v2.gameplayHitCount, 0);
    assert.equal(c.v2.frames[0].sha256, review.movementModernization.states.idle.frames[0].sha256);
    assert.equal(c.v2.frames.at(-1).sha256, c.v2.frames[0].sha256);
    if (strength === 'light') {
      assert.deepEqual(c.v2.frames.map(f => ({ publicPath: f.publicPath, sha256: f.sha256 })), receipt.acceptedFrameHashes);
      assert(c.v2.frames.every(f => f.bodyVisible));
    } else {
      assert.deepEqual(c.v2.frames.map((f, i) => f.bodyVisible === false ? i : -1).filter(i => i >= 0), [4]);
      assert.equal(c.v2.frames[4].publicPath, '/lamuh-legacy-v2/divine-vanish-v2/aura-only-00.png');
      assert.equal(c.v2.frames[3].sha256, c.v2.frames[5].sha256, 'Same complete body pose brackets the blink');
      assert.equal(c.v2.visualBlink.vulnerabilityUnchanged, true);
    }
    assert.equal(c.v1.contactFrame, null); assert.equal(c.v1.exactContactTick, null);
    assert.equal(c.v1.historicalDurationTicks, 15); assert.match(c.v1.exposureEvidence, /RECONSTRUCTION_ONLY/);
    for (const f of c.v2.frames) {
      assert.equal(f.contact, false); assert.equal(f.visibleImpact, false); assert.deepEqual(f.root, { x: 768, y: 1360 });
      const file = path.join(root, 'public', f.publicPath), png = fs.readFileSync(file);
      assert.equal(hash(file), f.sha256); assert.equal(png.readUInt32BE(16), 2048); assert.equal(png.readUInt32BE(20), 1536); assert.equal(png[25], 6);
    }
    assert.deepEqual(c.timingCandidates.B.exposureTicks, holds[strength]);
    for (const [key, t] of Object.entries(c.timingCandidates)) {
      assert.equal(t.durationTicks, t.exposureTicks.reduce((a, b) => a + b, 0)); assert.equal(t.phaseTicks.active, 0);
      assert.equal(t.durationTicks, t.phaseTicks.startup + t.phaseTicks.recovery);
      assert.equal(t.visualComparisonOnly, key !== 'B'); assert(t.exposureTicks.every(n => Number.isInteger(n) && n > 0));
    }
  }
}

function testForgeSimulationParityAndZeroContact() {
  const { fighterDefinitions } = require('../dist/data/fighters');
  const loaded = loadAndValidateBundle(path.join(base, 'divine-vanish-packages/divine-vanish.bundle.json'));
  const compiled = compileBundle(loaded);
  assert.deepEqual(compiled, read(path.join(root, 'generated/manifests/lamuh_divine_vanish_v1.candidate.runtime.json')));
  assert.equal(compiled.deployable, false);
  for (const [ordinal, s] of strengths.entries()) {
    const attack = fighterDefinitions.lamuh_legacy_v2.attacks[`legacy_divine_vanish_${s}`];
    const p = loaded.packages.find(p => p.value.id === `divine_vanish_${s}`).value;
    assert.equal(p.simulationLength, [20, 28, 40][ordinal]);
    assert.equal(p.combatTrack.startup, s === 'heavy' ? 8 : attack.startup); assert.equal(p.combatTrack.recovery, s === 'heavy' ? 32 : s === 'medium' ? 23 : attack.recovery);
    for (const key of ['active', 'damage', 'hitstop', 'hitstun', 'blockstun']) assert.equal(p.combatTrack[key], 0);
    assert.deepEqual(p.combatTrack.boxes, []); assert.deepEqual(p.combatTrack.cancelWindows, []);
    assert.deepEqual(p.combatTrack.rootMotionTrack.segments, s === 'heavy' ? [{ start: 8, end: 11, velocity: -6 }, { start: 12, end: 19, velocity: -14 }, { start: 20, end: 23, velocity: -6 }] : s === 'medium' ? [{ start: 5, end: 7, velocity: -6 }, { start: 8, end: 12, velocity: -16 }, { start: 13, end: 15, velocity: -4 }] : attack.rootMotionSegments);
    assert.deepEqual(p.phases.active, []); assert.deepEqual(p.phases.impact, []); assert.deepEqual(p.presentationTrack, []);
    assert.equal(p.provenance.humanApproval.state, 'pending');
    assert.equal(stableJson(p.exposures.map(e => e.duration)), stableJson(holds[s]));
  }
}

const tests = [testStrictGroundedTrackAndUnchangedHopValidation, testCandidateAndSourceIntegrity, testForgeSimulationParityAndZeroContact];
if (require.main === module) {
  for (const test of process.argv.includes('--schema-only') ? tests.slice(0, 1) : tests) { test(); console.log(`PASS ${test.name}`); }
}
module.exports = { tests };
