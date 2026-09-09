const assert = require('node:assert/strict');
const crypto = require('node:crypto');
const fs = require('node:fs');
const path = require('node:path');
const { fighterDefinitions } = require('../dist/data/fighters');
const { createMatch, tick, currentAuthoredDive } = require('../dist/core/engine');
const { radiantDiveFrame } = require('../dist/lamuhlegacy/radiantDive');
const { loadAndValidateBundle, compileBundle, validateAnimationPackage, stableJson } = require('../scripts/production_contracts');

const root = path.resolve(__dirname, '..'), repo = path.resolve(root, '../..');
const base = path.join(root, 'content-source/characters/lamuh-legacy-v2');
const read = p => JSON.parse(fs.readFileSync(p, 'utf8'));
const hash = p => crypto.createHash('sha256').update(fs.readFileSync(p)).digest('hex').toUpperCase();
const family = read(path.join(base, 'radiant-dive-family.candidate.v1.json'));
const review = read(path.join(root, 'public/lamuh-legacy-v2/review-data.json'));
const reportDir = path.join(repo, 'tools/nga-forge/review/lamuh-legacy-v2-radiant-dive-v1');
const report = read(path.join(reportDir, 'normalization.report.json'));
const lock = read(path.join(base, 'records/radiant-dive-v1.hash-lock.json'));
const loaded = loadAndValidateBundle(path.join(base, 'radiant-dive-packages/radiant-dive.bundle.json'));
const strengths = ['light', 'medium', 'heavy'];
const gate = 'awaiting_human_radiant_dive_family_review';
const attacks = Object.fromEntries(strengths.map(s => [s, fighterDefinitions.lamuh_legacy_v2.attacks[`legacy_radiant_dive_${s}`]]));

function testCandidateBoundaryAndAcceptedFamilyPreservation() {
  assert.equal(family.status, gate); assert.equal(family.candidateOnly, true); assert.equal(family.deployable, false);
  assert.deepEqual(family.humanApproval, { family: null, light: null, medium: null, heavy: null });
  assert.deepEqual(read(path.join(root, 'public/lamuh-legacy-v2/radiant-dive-v1/manifest.json')), family);
  assert.deepEqual(review.radiantDiveFamily, family);
  assert.equal(review.firstPlayable.currentReviewGate.status, gate);
  assert.equal(review.firstPlayable.productionApproved, false); assert.equal(review.firstPlayable.selectableProductionRoster, false);
  assert.deepEqual(review.firstPlayable.currentReviewGate.starredForRevisit.map(s => s.subject), ['turn_facing_motion_mirrored_parity_and_transition', 'fighter_pushbox_separation', 'forward_special_family_light_medium_heavy']);
  assert.equal(review.firstPlayable.heavenSplitterApproval.sha256, 'E318A6F291EE386D96D68F07A8898538EE7FB928B69F92D74FDBB72885627632');
  assert.equal(hash(path.join(base, review.firstPlayable.heavenSplitterApproval.path)), review.firstPlayable.heavenSplitterApproval.sha256);
  assert.equal(hash(path.join(base, review.firstPlayable.celestialPalmApproval.path)), review.firstPlayable.celestialPalmApproval.sha256);
  for (const old of ['heavenSplitterFamily', 'celestialPalmFamily']) assert.equal(review[old].status, 'APPROVED_AS_PRODUCTION_BASELINE');
  const receipt = read(path.join(base, review.firstPlayable.heavenSplitterApproval.path));
  for (const s of strengths) {
    assert.deepEqual(fighterDefinitions.lamuh_legacy_v2.attacks[`legacy_heaven_splitter_${s}`], receipt.acceptedCombat[s]);
    const c = family.variants[s];
    assert.equal(c.status, gate); assert.equal(c.candidateOnly, true); assert.equal(c.deployable, false);
    assert(!c.approvalReceipt && !c.approvedAt && !c.approvedBy, 'New Dive must not inherit another family pass');
  }
  assert(review.firstPlayable.additiveForgeBundles.some(b => b.role === 'air_specials' && b.packageCount === 3 && b.path === 'radiant-dive-packages/radiant-dive.bundle.json'));
}

function testTwentyOneFrameReferencesAndRawProvenance() {
  assert.equal(report.sourceArtStatus, 'candidate_ready_for_human_review'); assert.equal(report.frames.length, 12); assert.equal(report.v1Frames.length, 7);
  assert.equal(report.perFrameRescale, false); assert.equal(report.scale, 2.75);
  for (const [file, key] of [['raw-family-repair-v2.png', 'bodySourceSha256'], ['raw-heavy-aura-v3.png', 'heavyAuraSourceSha256'], ['raw-heavy-connector-single-v5.png', 'heavyConnectorSourceSha256']]) {
    assert.equal(hash(path.join(reportDir, file)), report[key]); assert.equal(lock[key], report[key]);
    assert(loaded.packages.every(p => p.value.provenance.references.includes(`repo://tools/nga-forge/review/lamuh-legacy-v2-radiant-dive-v1/${file}`)));
  }
  const references = [];
  for (const [ordinal, s] of strengths.entries()) {
    const frames = family.variants[s].v2.frames, pack = loaded.packages.find(p => p.value.id === `radiant_dive_${s}`).value;
    assert.equal(frames.length, 7); assert.equal(pack.sourceFrames.length, 7);
    assert.deepEqual(lock.frames[s], frames.map(f => ({ publicPath: f.publicPath, sha256: f.sha256 })));
    for (const [i, frame] of frames.entries()) {
      references.push(frame.publicPath); assert.equal(frame.index, i); assert.deepEqual(frame.root, { x: 768, y: 1360 });
      const expectedSource = i < 4 ? `repo://NO_GODS_ABOVE/engine_v2/content-source/characters/lamuh-legacy-v2/radiant-dive-frames-v1/${s}-${String(i).padStart(2, '0')}.png` : `repo://NO_GODS_ABOVE/engine_v2/public${frame.publicPath}`;
      assert.equal(pack.sourceFrames[i].sourceUri, expectedSource);
      for (const file of [path.join(root, 'public', frame.publicPath), path.join(repo, expectedSource.slice('repo://'.length))]) {
        const bytes = fs.readFileSync(file);
        assert.equal(hash(file), frame.sha256); assert.equal(bytes.readUInt32BE(16), 2048); assert.equal(bytes.readUInt32BE(20), 1536); assert.equal(bytes[25], 6);
      }
      if (i < 4) { assert.equal(frame.sha256, report.frames[ordinal * 4 + i].sha256); assert.equal(frame.auraBaked, s === 'heavy'); }
      else assert.equal(frame.sha256, i === 6 ? review.movementModernization.states.idle.frames[0].sha256 : review.movementModernization.states.jump.frames[i + 1].sha256);
      assert.equal(frame.contact, i === 2); assert.equal(frame.visibleImpact, i === 2);
    }
    assert.equal(pack.provenance.humanApproval.state, 'pending');
    assert.equal(pack.validation.humanApprovalRequired, true);
    assert(pack.approvalRecords.every(p => p.includes('/radiant-dive-packages/records/human-review.pending.json')));
  }
  assert.equal(references.length, 21); assert.equal(new Set(references).size, 15, 'Twelve new poses plus three shared existing catch/settle/idle images');
}

function testActualStageDrivenReferenceUsesRuntimeSelector() {
  const before = JSON.stringify(fighterDefinitions);
  for (const [ordinal, s] of strengths.entries()) {
    const c = family.variants[s], reference = c.v2.referencePlayback;
    const state = createMatch(90605, { p1Kind: 'lamuh_legacy_v2', p2Kind: 'lamuh_legacy_v2', p1X: -300, p2X: 300 });
    const f = state.fighters.p1;
    Object.assign(f, { y: -180, grounded: false, phase: 'jump', vx: 0, vy: 0, airActionsRemaining: 5, airDashesRemaining: 1 });
    const counts = Array(7).fill(0), roots = [], stages = [];
    for (let n = 0; n < 150; n++) {
      tick(state, { p1: n === 0 ? { special: true, [s]: true } : {} });
      const index = radiantDiveFrame(f, state) ?? 6;
      counts[index]++; roots.push({ x: f.x + 300, y: f.y }); stages.push(currentAuthoredDive(f, state)?.stage ?? 'complete');
      assert.equal(index, reference.samples[n].frameIndex); assert.equal(f.phaseTick, reference.samples[n].phaseTick);
      if (f.currentAttack === null && f.phase === 'idle') break;
    }
    assert.deepEqual(roots, c.v2.authoredWorldRootPath); assert.deepEqual(counts, c.timingCandidates.B.exposureTicks);
    assert.deepEqual(stages, reference.samples.map(p => p.stage));
    assert.equal(roots.length, [52, 45, 48][ordinal]); assert.equal(c.timingCandidates.B.durationTicks, roots.length);
    assert.equal(state.fighters.p2.hitCountTaken, 0); assert.equal(reference.fixedRuntimeLandingTick, false);
    assert.equal(reference.simulationCursorConvention, 'post_tick_first_move_tick_1');
    assert.deepEqual(c.timingCandidates.B.phaseTicks, { startup: attacks[s].startup, active: attacks[s].active, recovery: attacks[s].recovery });
    for (const key of ['A', 'C']) { assert.equal(c.timingCandidates[key].visualComparisonOnly, true); assert.equal(c.timingCandidates[key].runtimePhaseTimingsUnchanged, true); }
  }
  assert.equal(JSON.stringify(fighterDefinitions), before, 'Review sampling cannot mutate combat definitions');
}

function testRealForgeCoreParityAndMeasuredPalmContainment() {
  const compiled = compileBundle(loaded);
  assert.deepEqual(compiled, read(path.join(root, 'generated/manifests/lamuh_radiant_dive_v1.candidate.runtime.json')));
  assert.equal(compiled.deployable, false);
  for (const [ordinal, s] of strengths.entries()) {
    const c = family.variants[s], a = attacks[s], h = a.hitboxes[0];
    const pkg = loaded.packages.find(p => p.value.id === `radiant_dive_${s}`).value;
    const runtime = compiled.animations.find(p => p.id === pkg.id);
    assert.equal(pkg.simulationLength, [53, 47, 49][ordinal]);
    assert.deepEqual(pkg.combatTrack.authoredDiveTrack.track, a.authoredDive);
    assert.deepEqual(pkg.combatTrack.authoredDiveTrack, c.v2.authoredDiveTrack);
    assert.deepEqual(runtime.combatTrack, pkg.combatTrack);
    assert.deepEqual(runtime.playbackPolicy, pkg.playbackPolicy);
    assert.equal(pkg.combatTrack.authoredDiveTrack.landingTrigger, 'actual_floor_contact');
    assert.deepEqual([pkg.combatTrack.startup, pkg.combatTrack.active, pkg.combatTrack.recovery, pkg.combatTrack.damage], [a.startup, a.active, a.recovery, h.damage]);
    assert.equal(pkg.combatTrack.boxes.length, a.active);
    for (const [i, box] of pkg.combatTrack.boxes.entries()) assert.deepEqual(box, { frame: a.startup + i, kind: 'hit', x: h.rect.x, y: h.rect.y, width: h.rect.w, height: h.rect.h });
    assert.deepEqual(c.v2.releaseSocket, report.releaseSockets[s]); assert.match(c.v2.releaseSocketMethod, /manual.*visible_open_palm/);
    const palm = { x: (c.v2.releaseSocket.x - 768) * .3 / 1.3, y: (c.v2.releaseSocket.y - 1360) * .3 / 1.3 };
    assert(palm.x >= h.rect.x && palm.x <= h.rect.x + h.rect.w && palm.y >= h.rect.y && palm.y <= h.rect.y + h.rect.h);
    assert.equal(c.v2.gameplayHitCount, 1); assert.equal(c.v2.visibleImpactCount, 1);
    assert.deepEqual(pkg.presentationTrack, []); assert.deepEqual(runtime.presentationTrack, []);
    assert.equal(c.v2.runtimeAuraOverlay, false);
    assert.equal(c.v2.contactPresentation.bodyOnlyOnWhiff, s !== 'heavy');
    assert.equal(c.v2.contactPresentation.vfxEnabled, false);
  }
}

function testActualPackageRejectsInvalidDiveContracts() {
  const original = loaded.packages[0].value;
  const poses = new Set(loaded.bundle.poseLibrary.map(p => p.id)), ids = new Set(loaded.packages.map(p => p.value.id));
  const before = stableJson(original);
  for (const mutate of [
    p => { p.combatTrack.authoredDiveTrack.landingTrigger = 'visual_frame'; },
    p => { p.combatTrack.authoredDiveTrack.track.landingApproachHeight = 0; },
    p => { p.combatTrack.authoredDiveTrack.phaseExposures.gather[0].duration = 2; },
    p => { p.combatTrack.authoredDiveTrack.maxHits = 2; },
    p => { p.playbackPolicy.mode = 'fixed_timeline'; },
    p => { p.combatTrack.boxes[0].frame = p.combatTrack.authoredDiveTrack.maximumAirTicks; }
  ]) {
    const changed = structuredClone(original); mutate(changed);
    assert.throws(() => validateAnimationPackage(changed, poses, ids, 'Actual Radiant package'), /authoredDiveTrack|outside active frames/);
  }
  assert.equal(stableJson(original), before);
}

const tests = [testCandidateBoundaryAndAcceptedFamilyPreservation, testTwentyOneFrameReferencesAndRawProvenance, testActualStageDrivenReferenceUsesRuntimeSelector, testRealForgeCoreParityAndMeasuredPalmContainment, testActualPackageRejectsInvalidDiveContracts];
for (const test of tests) { test(); console.log(`PASS ${test.name}`); }
console.log(`PASS Radiant Dive content: ${tests.length} groups; 21 frame references, 12 new poses, pending human review`);
