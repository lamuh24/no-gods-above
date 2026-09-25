#!/usr/bin/env node
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const PACKAGE_ROOT = path.join(ROOT, 'stage-production', 'arenas', 'the_last_tribunal');
const PACKAGE_PATH = path.join(PACKAGE_ROOT, 'arena.package.json');
const EXPECTED_STATUS = 'production_arena_graybox_candidate';
const EXPECTED_APPROVAL = 'awaiting_human_graybox_and_concept_approval';
const APPROVED_BRIEF_RESULT = 'APPROVED_AS_PRODUCTION_ARENA_BRIEF_V1';
const EVENT_ID_TEMPLATE = '{matchId}:{simulationFrame}:{arenaId}:{sourceEntityId}:{moveInstance}:{eventIndex}';
const REQUIRED_EVENT_IDS = [
  'throw_camera',
  'command_grab_camera',
  'super_camera',
  'ultimate_camera',
  'round_finisher',
  'intro',
  'victory',
  'environmental_reaction'
];
const REQUIRED_ART_CATEGORIES = [
  '3d_geometry',
  'painted_plane',
  'foreground_decal',
  'background_layer',
  'material_definition',
  'light_map',
  'shadow_receiver',
  'atmospheric_effect',
  'optional_mask',
  'presentation_mesh',
  'preview_thumbnail',
  'validation_capture'
];
const REQUIRED_SCENARIOS = [
  'center_stage',
  'left_corner',
  'right_corner',
  'p1_p2_side_switch',
  'high_jump',
  'crouch',
  'knockdown',
  'command_grab',
  'super',
  'ultimate',
  'large_beam',
  'projectile',
  'hit_sparks',
  'dark_costume',
  'bright_costume',
  'mirrored_fighter',
  'rollback_replay',
  'browser_gpu_performance'
];

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function readJson(file) {
  return JSON.parse(fs.readFileSync(file, 'utf8'));
}

function sha256(file) {
  return crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex').toUpperCase();
}

function resolveInside(parent, candidate, label) {
  const resolved = path.resolve(parent, candidate);
  const relative = path.relative(parent, resolved);
  assert(relative === '' || (!relative.startsWith('..') && !path.isAbsolute(relative)), `${label} must stay inside ${parent}`);
  return resolved;
}

function assertUnique(values, label) {
  assert(new Set(values).size === values.length, `${label} contains duplicates`);
}

function assertExactSet(actual, expected, label) {
  assertUnique(actual, label);
  assert(actual.length === expected.length, `${label} count ${actual.length} does not equal ${expected.length}`);
  for (const value of expected) assert(actual.includes(value), `${label} missing ${value}`);
}

function validateRequiredFields(value, schema, label) {
  for (const key of schema.required || []) {
    assert(Object.prototype.hasOwnProperty.call(value, key), `${label} missing ${key}`);
  }
  for (const [key, definition] of Object.entries(schema.properties || {})) {
    if (Object.prototype.hasOwnProperty.call(definition, 'const') && Object.prototype.hasOwnProperty.call(value, key)) {
      assert(value[key] === definition.const, `${label}.${key} must equal ${JSON.stringify(definition.const)}`);
    }
  }
}

function validateGate(value, label) {
  assert(value.status === EXPECTED_STATUS, `${label} status gate changed`);
  assert(value.deployable === false, `${label} must remain non-deployable`);
  assert(value.approvalState === EXPECTED_APPROVAL, `${label} approval gate changed`);
}

function validateBrief(brief, stageContract) {
  assert(brief.status === 'approved', 'arena brief must record approval');
  assert(brief.deployable === false, 'approved brief does not authorize deployment');
  assert(brief.approvalState === APPROVED_BRIEF_RESULT, 'arena brief approval result mismatch');
  assert(brief.id === 'the_last_tribunal', 'arena brief ID mismatch');
  assert(brief.identity.arenaName === 'The Last Tribunal', 'arena identity mismatch');
  assert(brief.identity.dominantColorFamilies.length >= 4, 'arena palette needs at least four color families');
  assert(brief.prohibitedVisualNoise.length >= 6, 'prohibited visual-noise list is incomplete');
  assert(brief.artAssetList.length >= 12, 'arena brief art list is incomplete');
  assert(brief.humanDecisions.length >= 6, 'remaining human decisions are incomplete');

  const contract = brief.productionContract;
  const plane = stageContract.combatPlane;
  assert(JSON.stringify(contract.combatPlaneOrigin) === JSON.stringify(plane.origin), 'combat-plane origin diverged from Stage V1');
  assert(contract.floorY === plane.floorY, 'floor Y diverged from Stage V1');
  assert(contract.worldScale.simulationPixelsToWorldUnits === plane.simulationPixelsToWorldUnits, 'simulation-to-world scale diverged');
  assert(contract.worldScale.spritePixelsToWorldUnits === plane.spritePixelsToWorldUnits, 'sprite-to-world scale diverged');
  assert(contract.gameplayBounds.simulation.left === plane.simulationBounds.left, 'left simulation bound diverged');
  assert(contract.gameplayBounds.simulation.right === plane.simulationBounds.right, 'right simulation bound diverged');
  assert(contract.gameplayBounds.world.left === plane.worldBounds.left, 'left world bound diverged');
  assert(contract.gameplayBounds.world.right === plane.worldBounds.right, 'right world bound diverged');
  assert(contract.spawnPositions.p1.worldX === contract.spawnPositions.p1.simulationX * plane.simulationPixelsToWorldUnits, 'P1 spawn mapping mismatch');
  assert(contract.spawnPositions.p2.worldX === contract.spawnPositions.p2.simulationX * plane.simulationPixelsToWorldUnits, 'P2 spawn mapping mismatch');
  assert(contract.spawnPositions.p1.simulationX > plane.simulationBounds.left, 'P1 spawn is outside bounds');
  assert(contract.spawnPositions.p2.simulationX < plane.simulationBounds.right, 'P2 spawn is outside bounds');
  assert(contract.wallBounceAnchors.simulation.left === plane.simulationBounds.left, 'left wall-bounce anchor mismatch');
  assert(contract.wallBounceAnchors.simulation.right === plane.simulationBounds.right, 'right wall-bounce anchor mismatch');
  assert(JSON.stringify(contract.defaultCameraPosition) === JSON.stringify(stageContract.camera.defaultPosition), 'default camera position diverged');
  assert(contract.cameraZoomRange.minDistance === stageContract.camera.zoom.minDistance, 'minimum camera zoom diverged');
  assert(contract.cameraZoomRange.maxDistance === stageContract.camera.zoom.maxDistance, 'maximum camera zoom diverged');
  assert(contract.cinematicSafeZones.length >= 5, 'cinematic safe zones are incomplete');
  assert(contract.foregroundOcclusionLimits.centralCombatRegionPercent === 0, 'central combat foreground occlusion must be zero');
  assert(contract.foregroundOcclusionLimits.fighterSilhouetteOcclusionAllowed === false, 'fighter silhouette occlusion must be prohibited');
  assert(contract.parallaxDepthValues.fighterPlaneZ === 0, 'fighter plane Z must remain zero');
  assert(contract.contrastZoneMasks.length >= 3, 'contrast-zone masks are incomplete');
  assert(contract.vfxSafetyRegions.length >= 3, 'VFX safety regions are incomplete');
  assert(brief.performanceBudget.targetFps === 60, 'competitive target must remain 60 FPS');
}

function validateEvents(events, stageContract) {
  validateGate(events, 'presentation events');
  assert(events.arenaId === 'the_last_tribunal', 'presentation-event arena mismatch');
  assert(events.eventIdTemplate === EVENT_ID_TEMPLATE, 'rollback-unsafe stage event template');
  assert(events.durationPolicy.arenaDefaultDurationsAre === 'test_values_not_global_move_limits', 'arena durations must remain defaults and test values');
  assert(events.durationPolicy.moveAuthoredDurationSupport === 'arbitrary_positive_fixed_tick_lengths', 'move-authored cinematic lengths must be arbitrary positive fixed ticks');
  assert(events.durationPolicy.identityAndReconstructionIndependentOfDuration === true, 'event identity must remain duration-independent');
  assertExactSet(events.dedupeKeyFields, ['matchId', 'simulationFrame', 'arenaId', 'sourceEntityId', 'moveInstance', 'eventIndex'], 'event dedupe fields');
  assertExactSet(events.events.map((event) => event.id), REQUIRED_EVENT_IDS, 'presentation event IDs');
  for (const event of events.events) {
    assert(event.durationSource === 'arena_default_test_value_overridden_by_deterministic_move_authorship', `${event.id} duration source is binding incorrectly`);
    assert(event.deterministicEventId.template === EVENT_ID_TEMPLATE, `${event.id} event template mismatch`);
    assert(event.triggerConditions.length >= 2, `${event.id} trigger conditions incomplete`);
    assert(event.abortRules.length >= 3, `${event.id} abort rules incomplete`);
    assert(event.rollbackReplayRules.length >= 3, `${event.id} rollback rules incomplete`);
    assert(event.visibilityRequirements.length >= 2, `${event.id} visibility rules incomplete`);
    const track = event.cameraTrack;
    assert(track.entryTicks + track.holdTicks + track.returnTicks === event.durationTicks, `${event.id} camera ticks do not equal duration`);
    if (track.shotId !== 'none') {
      assert(track.returnTicks === stageContract.camera.returnToGameplay.ticks, `${event.id} must use the approved camera-return duration`);
    } else {
      assert(event.id === 'environmental_reaction', 'only environmental reaction may omit a camera shot');
      assert(track.returnTicks === 0, 'non-camera reaction must not start a camera return');
    }
    assert(event.rollbackReplayRules.some((rule) => /determin|fixed|replay|event id/i.test(rule)), `${event.id} lacks an explicit deterministic replay rule`);
  }
}

function validateArtPack(artPack) {
  validateGate(artPack, 'art pack');
  assert(artPack.arenaId === 'the_last_tribunal', 'art-pack arena mismatch');
  assert(artPack.directoryStructure.length >= 10, 'art-pack directory structure is incomplete');
  assert(artPack.authority.presentationMeshesAffectCollision === false, 'presentation meshes cannot affect collision');
  assert(artPack.authority.renderedFloorAffectsGrounding === false, 'rendered floor cannot affect grounding');
  assert(artPack.authority.artMayDefineWalls === false, 'art cannot define walls');
  assert(artPack.authority.hazards.includes('prohibited'), 'art-pack hazards must be prohibited');
  assertExactSet([...new Set(artPack.assets.map((asset) => asset.category))], REQUIRED_ART_CATEGORIES, 'art-pack categories');
  assertUnique(artPack.assets.map((asset) => asset.id), 'art-pack asset IDs');
  assert(artPack.budgets.stageDrawCalls <= 48, 'stage draw-call budget exceeds brief');
  assert(artPack.budgets.visibleTriangles <= 35000, 'visible triangle budget exceeds brief');
  assert(artPack.budgets.loadedTriangles <= 60000, 'loaded triangle budget exceeds brief');
  assert(artPack.budgets.stageTextures <= 12, 'stage texture budget exceeds brief');
  assert(artPack.budgets.stageTextureMemoryMb <= 96, 'stage texture-memory budget exceeds brief');
  assert(artPack.budgets.materialVariants <= 8, 'material-variant budget exceeds brief');
  assert(artPack.budgets.dynamicLights <= 2, 'dynamic-light budget exceeds brief');
  assert(artPack.budgets.shadowCasters === 0, 'real-time stage shadow casters are prohibited for the candidate');
  assert(artPack.budgetPolicy.stageTextureMemoryMb.includes('candidate_maximum_pending'), '72 MB must remain a candidate maximum pending profiling');
  assert(artPack.budgetPolicy.durationsAndBudgetsGloballyBinding === false, 'candidate budgets cannot be globally binding');
  assert(artPack.budgetPolicy.profilingRequired === true, 'production profiling gate missing');
  assert(artPack.promotionGates.length >= 6, 'art-pack promotion gates are incomplete');
}

function validatePlan(plan) {
  validateGate(plan, 'validation plan');
  assert(plan.arenaId === 'the_last_tribunal', 'validation-plan arena mismatch');
  assert(plan.globalAssertions.length >= 8, 'global validation assertions are incomplete');
  assertExactSet(plan.scenarios.map((scenario) => scenario.id), REQUIRED_SCENARIOS, 'validation scenarios');
  for (const scenario of plan.scenarios) {
    assert(scenario.setup.length >= 1, `${scenario.id} setup missing`);
    assert(scenario.assertions.length >= 2, `${scenario.id} assertions incomplete`);
    assert(scenario.captures.length >= 1, `${scenario.id} captures missing`);
  }
  for (const id of ['p1_p2_side_switch', 'command_grab', 'super', 'ultimate', 'large_beam', 'projectile', 'hit_sparks', 'rollback_replay', 'browser_gpu_performance']) {
    assert(plan.scenarios.find((scenario) => scenario.id === id).rollbackRequired, `${id} must require rollback validation`);
  }
  assert(plan.deviceMatrix.length >= 4, 'browser/GPU matrix is incomplete');
  assert(plan.deviceMatrix.every((entry) => entry.browser.includes('WebGL2')), 'every device target must declare WebGL2');
  assert(plan.approvalGate === 'human_graybox_and_concept_approval_required_before_final_art_production', 'graybox approval gate changed');
}

function main() {
  const packageManifest = readJson(PACKAGE_PATH);
  validateGate(packageManifest, 'arena package');
  assert(packageManifest.arenaId === 'the_last_tribunal', 'arena package ID mismatch');
  assert(packageManifest.authorization.finalArt === false, 'final art must remain unauthorized');
  assert(packageManifest.authorization.runtimeIntegration === false, 'runtime integration must remain unauthorized');
  assert(packageManifest.authorization.gameplayChanges === false, 'gameplay changes must remain unauthorized');
  assert(packageManifest.authorization.deployment === false, 'deployment must remain unauthorized');

  const artifactPaths = {
    brief: resolveInside(PACKAGE_ROOT, packageManifest.brief, 'brief'),
    presentationEvents: resolveInside(PACKAGE_ROOT, packageManifest.presentationEvents, 'presentation events'),
    artPack: resolveInside(PACKAGE_ROOT, packageManifest.artPack, 'art pack'),
    validationPlan: resolveInside(PACKAGE_ROOT, packageManifest.validationPlan, 'validation plan'),
    conceptDirection: resolveInside(PACKAGE_ROOT, packageManifest.conceptDirection, 'concept direction'),
    grayboxContract: resolveInside(PACKAGE_ROOT, packageManifest.grayboxContract, 'graybox contract')
  };
  const stageContractPath = path.resolve(PACKAGE_ROOT, packageManifest.inherits.stageContract);
  const stageApprovalPath = path.resolve(PACKAGE_ROOT, packageManifest.inherits.stageApproval);
  const briefApprovalPath = path.resolve(PACKAGE_ROOT, packageManifest.inherits.briefApproval);
  assert(stageContractPath === path.join(ROOT, 'src', 'stage', 'stage_vertical_slice_v1.json'), 'package must inherit the approved Stage V1 contract');
  assert(stageApprovalPath === path.join(ROOT, 'stage-production', 'approvals', 'stage_pipeline_vertical_slice_v1.approval.json'), 'stage approval path mismatch');
  assert(briefApprovalPath === path.join(ROOT, 'stage-production', 'approvals', 'the_last_tribunal.production-arena-brief-v1.approval.json'), 'brief approval path mismatch');

  const schemaArtifacts = [
    ['production-arena-brief.schema.json', artifactPaths.brief, 'arena brief'],
    ['stage-presentation-events.schema.json', artifactPaths.presentationEvents, 'presentation events'],
    ['stage-art-pack.schema.json', artifactPaths.artPack, 'art pack'],
    ['stage-validation-plan.schema.json', artifactPaths.validationPlan, 'validation plan']
  ];
  for (const [schemaName, artifactPath, label] of schemaArtifacts) {
    assert(fs.existsSync(artifactPath), `${label} is missing`);
    validateRequiredFields(readJson(artifactPath), readJson(path.join(ROOT, 'schemas', 'production', schemaName)), label);
  }

  const stageContract = readJson(stageContractPath);
  const stageApproval = readJson(stageApprovalPath);
  const briefApproval = readJson(briefApprovalPath);
  assert(stageContract.status === 'approved', 'Stage V1 contract must record human approval');
  assert(stageApproval.result === 'STAGE_PIPELINE_VERTICAL_SLICE_APPROVED', 'Stage V1 approval record missing');
  assert(stageApproval.productionArenaArtAuthorized === false, 'vertical-slice approval cannot authorize production art');
  assert(stageApproval.deployable === false, 'vertical-slice approval record must remain non-deployable');
  assert(briefApproval.result === APPROVED_BRIEF_RESULT, 'production arena brief approval record missing');
  assert(briefApproval.nextStatus === EXPECTED_STATUS && briefApproval.nextGate === EXPECTED_APPROVAL, 'brief approval handoff mismatch');
  assert(briefApproval.clarifications.moveAuthoredCinematicLengths === 'arbitrary_positive_fixed_tick_durations_supported', 'brief duration clarification missing');
  assert(briefApproval.doesNotAuthorize.includes('final_arena_art'), 'brief approval must not authorize final art');

  validateBrief(readJson(artifactPaths.brief), stageContract);
  validateEvents(readJson(artifactPaths.presentationEvents), stageContract);
  validateArtPack(readJson(artifactPaths.artPack));
  validatePlan(readJson(artifactPaths.validationPlan));

  const concept = readJson(artifactPaths.conceptDirection);
  validateGate(concept, 'concept direction');
  const conceptImage = resolveInside(path.dirname(artifactPaths.conceptDirection), concept.compositionBoard.path, 'concept image');
  assert(fs.existsSync(conceptImage), 'concept composition board is missing');
  assert(sha256(conceptImage) === concept.compositionBoard.sha256, 'concept composition board hash drift');
  assert(concept.requiredViews.length === 8, 'concept composition matrix must contain eight views');

  const graybox = readJson(artifactPaths.grayboxContract);
  validateGate(graybox, 'graybox contract');
  assert(graybox.authority.gameplayPlane === 'deterministic_2d', 'graybox combat authority changed');
  assert(graybox.authority.renderGeometryAuthoritative === false, 'graybox geometry cannot control collision');
  assert(graybox.authority.fighterPlaneZ === 0, 'graybox fighter plane must remain Z=0');
  assert(graybox.lighting.realTimeStageShadowCasters === 0, 'graybox real-time shadow casters must remain zero');
  assert(graybox.lighting.destructiveFighterSpriteRelighting === false, 'dynamic lights cannot destructively relight fighter sprites');
  assert(graybox.eventDurationPolicy.moveAuthoredLengths === 'arbitrary_positive_fixed_tick_durations', 'graybox arbitrary duration support missing');
  assert(graybox.productionTextureMemoryMbMaximumCandidate === 72 && graybox.profilingRequiredBeforeBudgetLock === true, '72 MB candidate profiling gate missing');

  const captureReportPath = path.join(PACKAGE_ROOT, 'graybox', 'captures', 'graybox_browser_report.json');
  const captureReport = readJson(captureReportPath);
  validateGate(captureReport, 'graybox browser report');
  assert(captureReport.captures.length === 28, 'graybox report must contain 28 clean/diagnostic scenario pairs');
  assert(captureReport.performance.cleanDrawCalls.max <= 48, 'graybox stage draw-call result exceeds candidate maximum');
  assert(captureReport.performance.cleanTriangles.max <= 35000, 'graybox triangle result exceeds candidate maximum');
  assert(captureReport.performance.estimatedUncompressedSpriteTextureMemoryMb === 72, 'graybox texture upload estimate changed');
  assert(captureReport.durationProof.testedMoveAuthoredSuperTicks === 73 && captureReport.durationProof.preservedByCameraRig, 'move-authored duration browser proof missing');
  assert(captureReport.consoleErrors.length === 0, 'graybox browser report contains errors');

  const allCandidateText = schemaArtifacts.map(([, file]) => fs.readFileSync(file, 'utf8')).join('\n');
  assert(!allCandidateText.includes('game.js'), 'candidate planning artifacts must not reference legacy game.js');
  console.log(`Validated The Last Tribunal graybox candidate: approved brief, ${REQUIRED_EVENT_IDS.length} rollback-safe events, 56 captures, deployable=false.`);
}

try {
  main();
} catch (error) {
  console.error(error.message);
  process.exit(1);
}
