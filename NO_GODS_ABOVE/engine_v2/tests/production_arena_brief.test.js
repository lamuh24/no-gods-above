const assert = require('assert');
const childProcess = require('child_process');
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const ARENA_ROOT = path.join(ROOT, 'stage-production', 'arenas', 'the_last_tribunal');

function readJson(file) {
  return JSON.parse(fs.readFileSync(file, 'utf8'));
}

function run() {
  const output = childProcess.execFileSync(process.execPath, [path.join(ROOT, 'scripts', 'validate_production_arena_package.js')], {
    cwd: ROOT,
    encoding: 'utf8'
  });
  assert.match(output, /Validated The Last Tribunal graybox candidate/);

  const manifest = readJson(path.join(ARENA_ROOT, 'arena.package.json'));
  const brief = readJson(path.join(ARENA_ROOT, manifest.brief));
  const events = readJson(path.join(ARENA_ROOT, manifest.presentationEvents));
  const artPack = readJson(path.join(ARENA_ROOT, manifest.artPack));
  const validation = readJson(path.join(ARENA_ROOT, manifest.validationPlan));
  for (const artifact of [manifest, events, artPack, validation]) {
    assert.strictEqual(artifact.status, 'production_arena_graybox_candidate');
    assert.strictEqual(artifact.deployable, false);
    assert.strictEqual(artifact.approvalState, 'awaiting_human_graybox_and_concept_approval');
  }
  assert.strictEqual(brief.status, 'approved');
  assert.strictEqual(brief.deployable, false);
  assert.strictEqual(brief.approvalState, 'APPROVED_AS_PRODUCTION_ARENA_BRIEF_V1');

  const template = readJson(path.join(ROOT, 'stage-production', 'templates', 'production-arena-brief.template.json'));
  assert.deepStrictEqual(Object.keys(brief).sort(), Object.keys(template).sort(), 'brief instance and reusable template must expose the same top-level contract');
  assert.strictEqual(manifest.authorization.finalArt, false);
  assert.strictEqual(manifest.authorization.runtimeIntegration, false);
  assert.strictEqual(manifest.authorization.gameplayChanges, false);
  assert.strictEqual(manifest.authorization.deployment, false);

  const eventIds = events.events.map((event) => event.id);
  assert.strictEqual(new Set(eventIds).size, eventIds.length, 'event IDs must be unique');
  assert.ok(events.events.every((event) => event.deterministicEventId.template === events.eventIdTemplate));
  assert.ok(events.events.every((event) => event.cameraTrack.entryTicks + event.cameraTrack.holdTicks + event.cameraTrack.returnTicks === event.durationTicks));
  assert.ok(events.events.every((event) => event.durationSource === 'arena_default_test_value_overridden_by_deterministic_move_authorship'));
  assert.strictEqual(events.durationPolicy.moveAuthoredDurationSupport, 'arbitrary_positive_fixed_tick_lengths');
  assert.match(JSON.stringify(events), /Math\.random.*prohibited/);

  assert.strictEqual(artPack.authority.presentationMeshesAffectCollision, false);
  assert.strictEqual(artPack.authority.renderedFloorAffectsGrounding, false);
  assert.strictEqual(artPack.authority.artMayDefineWalls, false);
  assert.strictEqual(artPack.budgetPolicy.durationsAndBudgetsGloballyBinding, false);
  assert.strictEqual(validation.scenarios.length, 18);
  assert.strictEqual(validation.approvalGate, 'human_graybox_and_concept_approval_required_before_final_art_production');

  const concept = readJson(path.join(ARENA_ROOT, manifest.conceptDirection));
  const graybox = readJson(path.join(ARENA_ROOT, manifest.grayboxContract));
  const browserReport = readJson(path.join(ARENA_ROOT, 'graybox', 'captures', 'graybox_browser_report.json'));
  assert.strictEqual(concept.requiredViews.length, 8);
  assert.strictEqual(graybox.authority.fighterPlaneZ, 0);
  assert.strictEqual(graybox.lighting.realTimeStageShadowCasters, 0);
  assert.strictEqual(graybox.eventDurationPolicy.moveAuthoredLengths, 'arbitrary_positive_fixed_tick_durations');
  assert.strictEqual(browserReport.captures.length, 28);
  assert.strictEqual(browserReport.durationProof.testedMoveAuthoredSuperTicks, 73);

  console.log('PASS production arena graybox: approved brief, concept hash, arbitrary fixed-tick cinematics, captures, and non-deployable gate.');
}

run();
