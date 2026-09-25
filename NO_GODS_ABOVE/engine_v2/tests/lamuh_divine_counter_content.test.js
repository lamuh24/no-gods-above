const assert = require('node:assert/strict');
const path = require('node:path');
const fs = require('node:fs');
const { loadAndValidateBundle, compileBundle, validateAnimationPackage } = require('../scripts/production_contracts');
const { fighterDefinitions } = require('../dist/data/fighters');
const root = path.resolve(__dirname, '..'), base = path.join(root, 'content-source/characters/lamuh-legacy-v2');
const read = p => JSON.parse(fs.readFileSync(p, 'utf8'));
const m = read(path.join(root, 'public/lamuh-legacy-v2/divine-vanish-v3/manifest.json'));
const old = read(path.join(base, 'divine-vanish-family.candidate.v1.json'));
const loaded = loadAndValidateBundle(path.join(base, 'divine-vanish-counter-packages-v3/divine-counter.bundle.json'));
const a = fighterDefinitions.lamuh_legacy_v2.attacks.legacy_divine_vanish_heavy;
function testSequenceAndScopedApprovalBoundaries() {
  assert.equal(m.candidateOnly, true); assert.equal(m.deployable, false);
  assert.deepEqual(m.light, old.variants.light); assert.deepEqual(m.medium, old.variants.medium);
  assert.deepEqual(m.approval, { heavy: null, combat: null, character: null });
  assert.deepEqual(m.stance.exposureTicks, [2, 16, 8, 6, 8]); assert.equal(m.stance.durationTicks, 40);
  assert.deepEqual(m.response.exposureTicks, [5, 2, 1, 3, 6, 7, 6, 6]); assert.equal(m.response.durationTicks, 36);
  assert.equal(m.stance.contactFrame, null); assert.equal(m.response.contactFrame, 3);
  assert.equal(m.response.frames[0].bodyVisible, false);
  assert.equal(m.response.exposureTicks.slice(0, 3).reduce((a, b) => a + b), 8);
  assert.equal(m.response.frames.filter(f => f.contact).length, 1);
  assert.deepEqual(m.response.combatProfile, a.strikeCounter.response);
  assert.equal(m.counterTrack.start, a.strikeCounter.start); assert.equal(m.counterTrack.end, a.strikeCounter.end);
  assert.equal(m.counterTrack.responseStrikeInvulnThrough, a.strikeCounter.response.responseStrikeInvulnThrough);
}
function testRealForgeCounterParity() {
  const compiled = compileBundle(loaded);
  assert.equal(compiled.deployable, false);
  assert.deepEqual(compiled, read(path.join(root, 'generated/manifests/lamuh_divine_counter_v3.candidate.runtime.json')));
  const stance = loaded.packages.find(p => p.value.id.endsWith('_stance')).value;
  const response = loaded.packages.find(p => p.value.id.endsWith('_response')).value;
  assert.deepEqual(stance.combatTrack.counterTrack, m.counterTrack);
  assert.equal(stance.combatTrack.damage, 0); assert.deepEqual(stance.combatTrack.boxes, []);
  assert.equal(response.combatTrack.damage, 72); assert.deepEqual(response.combatTrack.boxes.map(b => b.frame), [8, 9, 10]);
  assert.deepEqual(stance.presentationTrack, []); assert.deepEqual(response.presentationTrack, []);
}
function testCounterContractRejectsInvalidData() {
  const p = loaded.packages.find(p => p.value.id.endsWith('_stance')).value;
  const poses = new Set(read(path.join(base, 'character.bundle.json')).poseLibrary.map(p => p.id));
  const ids = new Set(loaded.packages.map(p => p.value.id));
  for (const mutate of [
    p => p.combatTrack.counterTrack.owner = 'renderer',
    p => p.combatTrack.counterTrack.hitstopFreezes = false,
    p => p.combatTrack.counterTrack.start = 5,
    p => p.combatTrack.counterTrack.end = 40,
    p => p.combatTrack.counterTrack.end = 4,
    p => p.combatTrack.counterTrack.responseActive = 0,
    p => p.combatTrack.counterTrack.responseStrikeInvulnThrough = 8,
    p => p.combatTrack.counterTrack.trigger = 'projectile',
    p => p.combatTrack.rootMotionTrack = { owner: 'deterministic_simulation' },
    p => p.combatTrack.damage = 1
  ]) {
    const broken = structuredClone(p); mutate(broken);
    assert.throws(() => validateAnimationPackage(broken, poses, ids, 'counter mutation'), /counterTrack/);
  }
}
for (const test of [testSequenceAndScopedApprovalBoundaries, testRealForgeCounterParity, testCounterContractRejectsInvalidData]) { test(); console.log(`PASS ${test.name}`); }
