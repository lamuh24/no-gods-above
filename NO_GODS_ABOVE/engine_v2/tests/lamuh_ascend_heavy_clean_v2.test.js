const assert = require('node:assert/strict'), fs = require('node:fs'), path = require('node:path'), crypto = require('node:crypto');
const root = path.resolve(__dirname, '..'), repo = path.resolve(root, '../..');
const read = p => JSON.parse(fs.readFileSync(p, 'utf8').replace(/^\uFEFF/, ''));
const hash = p => crypto.createHash('sha256').update(fs.readFileSync(p)).digest('hex').toUpperCase();
const m = read(path.join(root, 'public/lamuh-legacy-v2/ascend-heavy-clean-v2/manifest.json'));
const r = read(path.join(repo, 'tools/nga-forge/review/lamuh-legacy-v2-ascend-heavy-clean-v2/normalization.report.json'));
const a = require('../dist/data/fighters').fighterDefinitions.lamuh_legacy_v2.attacks.legacy_ascend_step_heavy;
assert.equal(m.candidateOnly, true); assert.equal(m.deployable, false); assert.equal(m.heavy.humanApproval, null);
assert.equal(m.heavy.v2.frames.length, 11);
assert.deepEqual(m.heavy.timingCandidates.B.exposureTicks, [4,4,4,2,4,3,3,5,3,3,7]);
assert.deepEqual(m.heavy.timingCandidates.B.phaseTicks, { startup: a.startup, active: a.active, recovery: a.recovery });
assert.equal(m.heavy.v2.frames.filter(f => f.contact).length, 1); assert.equal(m.heavy.v2.contactFrame, 7);
assert.equal(a.hitboxes[0].damage, 84); assert.equal(a.hitboxes[0].start, 24); assert.equal(a.hitboxes[0].end, 28);
for (const f of m.heavy.v2.frames) assert.equal(hash(path.join(root, 'public', f.publicPath)), f.sha256);
for (const f of r.frames) { assert.equal(f.greenRemaining, 0); assert.equal(f.edgeContact, false); assert(f.opaqueWhitePixels > 0); assert(f.transparentPixels > 0); }
for (const p of r.preservedOldHeavy) assert.equal(hash(p.path), p.sha256);
const divine = read(path.join(root, 'public/lamuh-legacy-v2/divine-vanish-v3/manifest.json'));
for (const f of divine.response.frames) assert.equal(hash(path.join(root, 'public', f.publicPath)), f.sha256);
console.log('PASS HeavycleanV2 source/alpha/timeline/onehit and Divine sharedsource preservation');
