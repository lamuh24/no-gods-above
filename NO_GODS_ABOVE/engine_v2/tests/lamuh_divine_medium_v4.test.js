const assert = require('node:assert/strict');
const crypto = require('node:crypto');
const path = require('node:path');
const fs = require('node:fs');
const { fighterDefinitions } = require('../dist/data/fighters');
const { loadAndValidateBundle, compileBundle } = require('../scripts/production_contracts');
const root = path.resolve(__dirname, '..'), base = path.join(root, 'content-source/characters/lamuh-legacy-v2');
const read = p => JSON.parse(fs.readFileSync(p, 'utf8'));
const a = fighterDefinitions.lamuh_legacy_v2.attacks;
const m = read(path.join(root, 'public/lamuh-legacy-v2/divine-vanish-medium-v4/manifest.json'));
const old = read(path.join(base, 'divine-vanish-family.candidate.v1.json'));
function testOnlyMediumDefinitionChanged() {
  const expected = { light: 'cf4ae7ee22a69ea60cec46aebb71e19c9e0af5db4146c12701036497e355a15b', heavy: '81c5103e9866a9913ef65fa5b173831559bcd33311358aed9fa2c789e3bd6b60' };
  for (const s of ['light', 'heavy']) {
    const preserved=structuredClone(a[`legacy_divine_vanish_${s}`]);
    // Sept8 user explicitly superseded only Heavy's response. Keep the old hash
    // as a test of unchanged stance/window and preserved historical response.
    if(s==='heavy')preserved.strikeCounter.response=read(path.join(root,'public/lamuh-legacy-v2/divine-vanish-v3/manifest.json')).response.combatProfile;
    assert.equal(crypto.createHash('sha256').update(JSON.stringify(preserved)).digest('hex'), expected[s]);
  }
  assert.deepEqual([a.legacy_divine_vanish_medium.startup, a.legacy_divine_vanish_medium.active, a.legacy_divine_vanish_medium.recovery], [5, 0, 27]);
  assert.deepEqual(a.legacy_divine_vanish_medium.hitboxes, []);
}
function testBlinkMatchesTravelWithoutArtDrift() {
  assert.equal(m.candidateOnly, true); assert.equal(m.deployable, false);
  assert.deepEqual(m.medium.v2.frames, old.variants.medium.v2.frames);
  assert.deepEqual(m.medium.timingCandidates.B.exposureTicks, [1, 4, 3, 2, 8, 2, 3, 4, 3, 2]);
  assert.equal(m.medium.timingCandidates.B.durationTicks, 32);
  assert.deepEqual(m.medium.v2.visualBlink.window, { start: 10, end: 17 });
  const track = a.legacy_divine_vanish_medium.rootMotionSegments;
  const distance = (start, end) => track.reduce((n, s) => n + Math.max(0, Math.min(end, s.end) - Math.max(start, s.start) + 1) * -s.velocity, 0);
  assert.equal(distance(0, 31), 180); assert.equal(distance(10, 17), 160);
  assert.equal(m.medium.v2.visualBlink.vulnerabilityUnchanged, true);
  assert.deepEqual(m.medium.v2.authoredWorldRootPath.at(-1), { x: -180, y: 0 });
  for (const c of Object.values(m.medium.timingCandidates)) assert.equal(c.durationTicks, c.phaseTicks.startup + c.phaseTicks.recovery);
}
function testForgeMatchesSourceAndCore() {
  const loaded = loadAndValidateBundle(path.join(base, 'divine-vanish-medium-packages-v4/medium-v4.bundle.json'));
  const p = loaded.packages[0].value, compiled = compileBundle(loaded);
  assert.equal(p.simulationLength, 32); assert.equal(p.combatTrack.recovery, 27); assert.equal(p.combatTrack.damage, 0);
  assert.deepEqual(p.combatTrack.rootMotionTrack.segments, a.legacy_divine_vanish_medium.rootMotionSegments);
  assert.deepEqual(p.exposures.map(e => e.duration), m.medium.timingCandidates.B.exposureTicks);
  assert.equal(compiled.deployable, false);
  assert.deepEqual(compiled, read(path.join(root, 'generated/manifests/lamuh_divine_medium_v4.candidate.runtime.json')));
}
for (const test of [testOnlyMediumDefinitionChanged, testBlinkMatchesTravelWithoutArtDrift, testForgeMatchesSourceAndCore]) { test(); console.log(`PASS ${test.name}`); }
