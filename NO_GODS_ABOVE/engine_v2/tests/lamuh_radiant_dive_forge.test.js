const assert = require('assert');
const fs = require('fs');
const path = require('path');
const { fighterDefinitions } = require('../dist/data/fighters');
const { loadAndValidateBundle, compileBundle, stableJson, validateAnimationPackage, validateProductionSchemas } = require('../scripts/production_contracts');

// Reuse hash-verified candidate frame references purely as a contract fixture.
// This test creates no art/package files and does not visually approve a dive.
const root = path.resolve(__dirname, '..');
const seed = loadAndValidateBundle(path.join(root, 'content-source/characters/lamuh-legacy-v2/heaven-splitter-packages/heaven-splitter.bundle.json'));
const seedPackage = seed.packages.find(({ value }) => value.id === 'heaven_splitter_light').value;
const poseIds = new Set([...seed.bundle.poseLibrary.map(p => p.id), 'contract_airborne']);
const copy = value => structuredClone(value);
const durations = (ticks) => [Math.ceil(ticks * 0.4), Math.ceil(ticks * 0.8) - Math.ceil(ticks * 0.4), ticks - Math.ceil(ticks * 0.8)];

function fixture(strength) {
  const attackId = `legacy_radiant_dive_${strength}`;
  const attack = fighterDefinitions.lamuh_legacy_v2.attacks[attackId], track = copy(attack.authoredDive);
  const pkg = copy(seedPackage), frames = pkg.sourceFrames.map(frame => frame.id);
  pkg.id = `radiant_dive_contract_${strength}`;
  pkg.entryPose = { ...pkg.entryPose, id: 'contract_airborne', elevation: 'airborne', plantedFoot: 'none', weight: 'airborne', verticalMotion: 'falling' };
  pkg.playbackPolicy = { mode: 'external_gameplay_state', cursorOwner: 'simulation', hitstopFreezesCursor: true, holdBehavior: 'clamp_to_gameplay_state' };
  const maximumAirTicks = attack.startup + Math.ceil(track.maximumHeight / Math.min(track.strikeVelocity.y, track.gatherVelocity.y));
  pkg.simulationLength = maximumAirTicks + track.landingRecoveryTicks;
  const phaseExposures = {
    windup: [{ sourceFrameId: frames[0], duration: Math.ceil(attack.startup * 0.6) }, { sourceFrameId: frames[1], duration: attack.startup - Math.ceil(attack.startup * 0.6) }],
    strike: [{ sourceFrameId: frames[2], duration: attack.active }],
    gather: [{ sourceFrameId: frames[3], duration: 1 }],
    landing: durations(track.landingRecoveryTicks).map((duration, i) => ({ sourceFrameId: frames[4 + i], duration }))
  };
  let cursor = 0;
  pkg.exposures = Object.entries(phaseExposures).flatMap(([stage, exposures]) => exposures.map(exposure => {
    const duration = stage === 'gather' ? maximumAirTicks - attack.startup - attack.active : exposure.duration;
    const item = { ...exposure, start: cursor, duration }; cursor += duration; return item;
  }));
  pkg.phases = { anticipation: [], startup: [{ start: 0, end: attack.startup - 1 }], active: [{ start: attack.startup, end: attack.startup + attack.active - 1 }], impact: [], followThrough: [{ start: attack.startup + attack.active, end: maximumAirTicks - 1 }], recovery: [{ start: maximumAirTicks, end: pkg.simulationLength - 1 }] };
  pkg.landing = [{ start: maximumAirTicks, end: pkg.simulationLength - 1, result: 'special_landing' }];
  pkg.anchors = pkg.exposures.map(exposure => ({ ...copy(seedPackage.anchors[0]), frame: exposure.start, sourceFrameId: exposure.sourceFrameId }));
  const hit = attack.hitboxes[0];
  pkg.combatTrack = {
    startup: attack.startup, active: attack.active, recovery: track.landingRecoveryTicks,
    damage: hit.damage, hitstop: hit.hitstop, hitstun: hit.hitstun, blockstun: hit.blockstun,
    boxes: Array.from({ length: attack.active }, (_, i) => ({ frame: attack.startup + i, kind: 'hit', x: hit.rect.x, y: hit.rect.y, width: hit.rect.w, height: hit.rect.h })),
    cancelWindows: [], timingAuthorship: { ...copy(seedPackage.combatTrack.timingAuthorship), authoredTotalDuration: pkg.simulationLength },
    authoredDiveTrack: { owner: 'deterministic_simulation', attackId, track, maximumAirTicks, landingPhase: 'dive_landing', landingTrigger: 'actual_floor_contact', airExposurePolicy: 'stage_driven', hitstopFreezes: true, maxHits: 1, phaseExposures }
  };
  pkg.presentationTrack = [];
  return pkg;
}

function validate(pkg) { validateAnimationPackage(pkg, poseIds, new Set([pkg.id]), 'Radiant Forge fixture'); }
function rejects(name, mutate, pattern = /authoredDiveTrack/) {
  const pkg = fixture('light'); mutate(pkg, pkg.combatTrack.authoredDiveTrack);
  assert.throws(() => validate(pkg), pattern, name);
}

function testStageDrivenEnvelopesAndRuntimePassthrough() {
  const packages = ['light', 'medium', 'heavy'].map(fixture);
  assert.deepStrictEqual(packages.map(pkg => pkg.combatTrack.authoredDiveTrack.maximumAirTicks), [43, 33, 29]);
  assert.deepStrictEqual(packages.map(pkg => pkg.simulationLength), [53, 47, 49]);
  for (const pkg of packages) {
    validate(pkg);
    const dive = pkg.combatTrack.authoredDiveTrack;
    assert.notStrictEqual(pkg.simulationLength, pkg.combatTrack.startup + pkg.combatTrack.active + pkg.combatTrack.recovery, 'Envelope includes variable non-damaging gather, never a universal fixed move duration');
    assert.deepStrictEqual(dive.phaseExposures.landing.map(e => e.duration), durations(dive.track.landingRecoveryTicks));
    const reordered = copy(pkg), phases = reordered.combatTrack.authoredDiveTrack.phaseExposures;
    reordered.combatTrack.authoredDiveTrack.phaseExposures = { landing: phases.landing, gather: phases.gather, strike: phases.strike, windup: phases.windup };
    validate(reordered);
  }
  const loaded = { bundle: { ...seed.bundle, id: 'radiant_contract_fixture', promotionState: 'candidate' }, packages: packages.map(value => ({ relativePath: `${value.id}/animation.package.json`, value })) };
  const before = stableJson(loaded), first = compileBundle(loaded), second = compileBundle(loaded);
  assert.strictEqual(stableJson(loaded), before, 'Compilation must not alter source');
  assert.strictEqual(stableJson(first), stableJson(second));
  assert.strictEqual(first.deployable, false);
  for (const pkg of packages) {
    const animation = first.animations.find(item => item.id === pkg.id);
    assert.deepStrictEqual(animation.combatTrack.authoredDiveTrack, pkg.combatTrack.authoredDiveTrack);
    assert.deepStrictEqual(animation.playbackPolicy, pkg.playbackPolicy);
    assert.deepStrictEqual(animation.exposures, pkg.exposures);
  }
}

function testOwnershipAndUnsafeCombinationRejections() {
  rejects('renderer ownership', (_, d) => { d.owner = 'renderer'; });
  rejects('hitstop drifting', (_, d) => { d.hitstopFreezes = false; });
  rejects('invalid source identifier', (_, d) => { d.attackId = 'bad identifier'; });
  rejects('renderer landing', (_, d) => { d.landingTrigger = 'visual_frame'; });
  rejects('generic landing erases recovery', (_, d) => { d.landingPhase = 'landing'; });
  rejects('fixed exposure authority', (_, d) => { d.airExposurePolicy = 'fixed_timeline'; });
  rejects('extra hit', (_, d) => { d.maxHits = 2; });
  rejects('unknown capability', (_, d) => { d.invulnerable = true; });
  rejects('missing required track', p => { p.combatTrack.authoredDiveTrack = null; });
  rejects('ground hop masquerades as dive', p => { p.combatTrack.selfMotionTrack = copy(seedPackage.combatTrack.selfMotionTrack); });
  rejects('projectile double contact', p => { p.combatTrack.projectileTrack = {}; });
  rejects('cancel escape', p => { p.combatTrack.cancelWindows = [{ start: 0, end: 1, targets: ['air_light'] }]; });
  rejects('throw mismatch', p => { p.combatTrack.boxes[0].kind = 'throw'; });
  rejects('ground entry', p => { p.entryPose.elevation = 'grounded'; });
  rejects('air exit', p => { p.exitPose.elevation = 'airborne'; });
  rejects('fixed playback', p => { p.playbackPolicy.mode = 'fixed_timeline'; p.playbackPolicy.holdBehavior = 'none'; });
}

function testHeightVelocityClockAndPhaseRejections() {
  rejects('zero minimum height', (_, d) => { d.track.minimumHeight = 0; });
  rejects('inverted height gate', (_, d) => { d.track.maximumHeight = 1; });
  rejects('nonfinite maximum', (_, d) => { d.track.maximumHeight = Infinity; });
  rejects('zero landing approach', (_, d) => { d.track.landingApproachHeight = 0; });
  rejects('landing approach at entry gate', (_, d) => { d.track.landingApproachHeight = d.track.minimumHeight; });
  rejects('missing landing approach', (_, d) => { delete d.track.landingApproachHeight; });
  for (const field of ['windupVelocity', 'strikeVelocity', 'gatherVelocity']) {
    rejects(`${field} nonfinite`, (_, d) => { d.track[field].x = NaN; });
    rejects(`${field} backward suction`, (_, d) => { d.track[field].x = -1; });
    rejects(`${field} rising`, (_, d) => { d.track[field].y = -1; });
    rejects(`${field} hidden homing`, (_, d) => { d.track[field].targetRelative = true; });
  }
  rejects('strike never descends', (_, d) => { d.track.strikeVelocity.y = 0; });
  rejects('gather never lands', (_, d) => { d.track.gatherVelocity.y = 0; });
  rejects('fractional recovery', (_, d) => { d.track.landingRecoveryTicks = 1.5; });
  rejects('recovery mismatch', (_, d) => { d.track.landingRecoveryTicks++; });
  rejects('wrong envelope', (_, d) => { d.maximumAirTicks--; });
  rejects('fractional envelope', (_, d) => { d.maximumAirTicks += 0.5; });
  rejects('fixed floor metadata', p => { p.landing[0].start--; });
  rejects('landing damage', (p, d) => { p.combatTrack.boxes[0].frame = d.maximumAirTicks; }, /outside active frames/);
  for (const stage of ['windup', 'strike', 'gather', 'landing']) {
    rejects(`${stage} unknown source`, (_, d) => { d.phaseExposures[stage][0].sourceFrameId = 'absent_frame'; });
    rejects(`${stage} zero duration`, (_, d) => { d.phaseExposures[stage][0].duration = 0; });
    rejects(`${stage} wrong sum`, (_, d) => { d.phaseExposures[stage][0].duration++; });
    rejects(`${stage} missing phase`, (_, d) => { delete d.phaseExposures[stage]; });
  }
  rejects('second strike pose', (_, d) => { d.phaseExposures.strike[0].duration--; d.phaseExposures.strike.push({ ...d.phaseExposures.strike[0], duration: 1 }); });
  rejects('gather loop', (_, d) => { d.phaseExposures.gather.push(copy(d.phaseExposures.gather[0])); });
  rejects('mismatched tool pose', p => { p.exposures[0].sourceFrameId = p.sourceFrames[9].id; });
}

function testSchemaAndFixedPackagePreservation() {
  assert.strictEqual(validateProductionSchemas(), 13);
  const schema = JSON.parse(fs.readFileSync(path.join(root, 'schemas/production/combat-track.schema.json'), 'utf8'));
  const dive = schema.properties.authoredDiveTrack;
  assert.strictEqual(dive.additionalProperties, false);
  assert.strictEqual(dive.properties.landingTrigger.const, 'actual_floor_contact');
  assert.strictEqual(dive.properties.airExposurePolicy.const, 'stage_driven');
  assert.strictEqual(dive.properties.maxHits.const, 1);
  assert.strictEqual(dive.properties.phaseExposures.properties.strike.maxItems, 1);
  assert.strictEqual(schema.$defs.descendingVelocity.properties.y.exclusiveMinimum, 0);
  assert.match(dive.description, /NOT a fixed floor-contact tick/);
  const poses = new Set(seed.bundle.poseLibrary.map(p => p.id)), ids = new Set(seed.packages.map(p => p.value.id));
  for (const { value } of seed.packages) validateAnimationPackage(value, poses, ids, 'Unchanged Heaven package');
  const unchanged = compileBundle(seed), seedBefore = stableJson(seed);
  assert.strictEqual(stableJson(compileBundle(seed)), stableJson(unchanged));
  assert.strictEqual(stableJson(seed), seedBefore);
  const invalidFixed = copy(seedPackage); invalidFixed.combatTrack.recovery++;
  assert.throws(() => validateAnimationPackage(invalidFixed, poses, ids, 'Fixed timing regression'), /combat timing must equal simulationLength/);
  const deletedDive = fixture('light'); delete deletedDive.combatTrack.authoredDiveTrack;
  assert.throws(() => validate(deletedDive), /combat timing must equal simulationLength/);
}

const tests = [testStageDrivenEnvelopesAndRuntimePassthrough, testOwnershipAndUnsafeCombinationRejections, testHeightVelocityClockAndPhaseRejections, testSchemaAndFixedPackagePreservation];
for (const test of tests) { test(); console.log(`PASS ${test.name}`); }
console.log(`PASS Radiant Dive Forge: ${tests.length} groups; no source/package writes or art approval`);
