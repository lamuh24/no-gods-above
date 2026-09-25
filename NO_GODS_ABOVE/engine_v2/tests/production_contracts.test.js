const assert = require('assert');
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const {
  compileFromPath,
  loadAndValidateBundle,
  stableJson,
  TIMING_DURATION_BASIS,
  validateAnimationPackage,
  validateProductionSchemas,
  writeCompiledManifest
} = require('../scripts/production_contracts');

const ROOT = path.resolve(__dirname, '..');
const bundlePath = path.join(ROOT, 'content-source', 'characters', 'lamuh', 'character.bundle.json');
const generatedPath = path.join(ROOT, 'generated', 'manifests', 'lamuh_legacy_motion_fixture.runtime.json');

function sourceDigest() {
  const sourceRoot = path.join(ROOT, 'content-source');
  const files = [];
  function visit(directory) {
    for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
      const absolute = path.join(directory, entry.name);
      if (entry.isDirectory()) visit(absolute);
      else files.push(absolute);
    }
  }
  visit(sourceRoot);
  const hash = crypto.createHash('sha256');
  for (const file of files.sort()) {
    hash.update(path.relative(sourceRoot, file).replaceAll('\\', '/'));
    hash.update(fs.readFileSync(file));
  }
  return hash.digest('hex');
}

function run() {
  assert.strictEqual(validateProductionSchemas(), 13, 'all production schemas, including arena planning contracts, should parse');

  const sourceBefore = sourceDigest();
  const loaded = loadAndValidateBundle(bundlePath);
  const first = compileFromPath(bundlePath);
  const second = compileFromPath(bundlePath);
  const sourceAfter = sourceDigest();

  assert.strictEqual(sourceBefore, sourceAfter, 'compilation must not modify source content');
  assert.strictEqual(stableJson(first), stableJson(second), 'identical source must compile byte-identically');
  assert.strictEqual(first.deployable, false, 'contract fixture must remain non-deployable');
  assert.strictEqual(first.fighterId, 'lamuh_legacy_motion_fixture');
  assert.strictEqual(loaded.bundle.promotionState, 'retired');
  assert.ok(loaded.packages.every(({ value }) => value.promotionState === 'retired'));
  assert.ok(loaded.packages.every(({ value }) => value.provenance.humanApproval.state === 'rejected'));
  assert.match(first.sourceDigest, /^[a-f0-9]{64}$/);
  assert.deepStrictEqual(first.animations.map((animation) => animation.id), ['idle', 'standing_heavy']);
  assert.strictEqual(loaded.packages.length, 2);

  const standingHeavy = first.animations.find((animation) => animation.id === 'standing_heavy');
  const idle = first.animations.find((animation) => animation.id === 'idle');
  assert.notStrictEqual(idle.simulationLength, standingHeavy.simulationLength, 'moves must retain independently authored durations');
  assert.strictEqual(standingHeavy.exposures.reduce((sum, exposure) => sum + exposure.duration, 0), standingHeavy.simulationLength);
  assert.strictEqual(standingHeavy.combatTrack.startup + standingHeavy.combatTrack.active + standingHeavy.combatTrack.recovery, standingHeavy.simulationLength);
  assert.ok(standingHeavy.transitions.every((transition) => transition.addsGameplayFrames === false), 'visual transitions must not add gameplay frames');
  assert.strictEqual(standingHeavy.presentationTrack[0].eventIdTemplate, '{matchId}:{simulationFrame}:{fighterId}:{moveInstance}:{eventIndex}');

  const combatSchema = JSON.parse(fs.readFileSync(path.join(ROOT, 'schemas', 'production', 'combat-track.schema.json'), 'utf8'));
  const timingSchema = combatSchema.properties.timingAuthorship;
  assert.strictEqual(timingSchema.properties.simulationTickRateHz.const, 60, '60 Hz is tick rate only');
  assert.strictEqual(timingSchema.properties.durationModel.const, 'independently_authored_per_move');
  assert.strictEqual(timingSchema.properties.uniformDurationNormalizationProhibited.const, true);
  assert.deepStrictEqual(timingSchema.properties.durationBasis.items.enum, TIMING_DURATION_BASIS);
  assert.strictEqual(timingSchema.properties.visualGameplayAlignment.const, 'aligned_by_default');
  assert.strictEqual(timingSchema.properties.timingExceptions.items.properties.approvalStatus.const, 'approved');
  const animationSchema = JSON.parse(fs.readFileSync(path.join(ROOT, 'schemas', 'production', 'animation-package.schema.json'), 'utf8'));
  assert.deepStrictEqual(
    animationSchema.allOf[0].then.properties.combatTrack.required,
    ['timingAuthorship'],
    'non-retired Animation Packages must carry explicit timing authorship'
  );

  const swahiliLoaded = loadAndValidateBundle(path.join(ROOT, 'content-source', 'characters', 'swahili', 'character.bundle.json'));
  const sourceHeavyRecord = swahiliLoaded.packages.find(({ value }) => value.id === 'heavy_hit_reaction');
  const candidateHeavy = JSON.parse(JSON.stringify(sourceHeavyRecord.value));
  delete candidateHeavy.combatTrack.timingAuthorship;
  const poseIds = new Set(swahiliLoaded.bundle.poseLibrary.map((pose) => pose.id));
  const packageIds = new Set(swahiliLoaded.packages.map(({ value }) => value.id));
  assert.throws(
    () => validateAnimationPackage(candidateHeavy, poseIds, packageIds, 'candidate timing regression'),
    /timingAuthorship required/,
    'production candidates without independently authored timing metadata must fail'
  );
  candidateHeavy.combatTrack.timingAuthorship = {
    simulationTickRateHz: 60,
    authoredTotalDuration: candidateHeavy.simulationLength,
    durationModel: 'independently_authored_per_move',
    durationBasis: [...TIMING_DURATION_BASIS],
    uniformDurationNormalizationProhibited: true,
    visualGameplayAlignment: 'aligned_by_default',
    timingExceptions: []
  };
  validateAnimationPackage(candidateHeavy, poseIds, packageIds, 'candidate timing regression');

  const architecture = fs.readFileSync(path.join(ROOT, 'docs', 'production_ecosystem_architecture.md'), 'utf8');
  const forgeTiming = fs.readFileSync(path.join(ROOT, '..', '..', 'tools', 'nga-forge', 'docs', 'TIMING_AUTHORING.md'), 'utf8');
  assert.match(architecture, /fixed 60 Hz simulation rate defines the duration of one simulation tick/);
  assert.match(architecture, /independently authored integer duration/);
  assert.match(forgeTiming, /must never normalize attacks toward a shared length/);
  assert.match(forgeTiming, /Rendering is non-authoritative/);

  assert.strictEqual(fs.readFileSync(generatedPath, 'utf8'), stableJson(first), 'checked-in compiled fixture must be current');
  assert.throws(
    () => writeCompiledManifest(bundlePath, path.join(ROOT, 'content-source', 'should-never-write.json')),
    /compiled output must stay inside/,
    'compiler must reject writes outside generated/'
  );

  console.log('Production contract tests passed: schemas, invariants, deterministic compile, source immutability, and promotion gate.');
}

run();
