#!/usr/bin/env node
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const REPO_ROOT = path.resolve(ROOT, '..', '..');
const CHARACTER_MANIFEST = path.join(ROOT, 'manifests', 'characters.seed.json');
const STAGE_MANIFEST = path.join(ROOT, 'manifests', 'stages.seed.json');
const CHARACTER_SCHEMA = path.join(ROOT, 'schemas', 'character.schema.json');
const STAGE_SCHEMA = path.join(ROOT, 'schemas', 'stage.schema.json');

function readJson(file) {
  return JSON.parse(fs.readFileSync(file, 'utf8'));
}

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function assertStringArray(value, label, min = 0) {
  assert(Array.isArray(value), `${label} must be an array`);
  assert(value.length >= min, `${label} must have at least ${min} item(s)`);
  for (const [index, item] of value.entries()) {
    assert(typeof item === 'string', `${label}[${index}] must be a string`);
  }
}

function validateCharacter(character, ids) {
  const required = ['schemaVersion', 'id', 'displayName', 'status', 'source', 'select', 'runtime', 'moves', 'animation', 'assets', 'validation'];
  for (const key of required) assert(Object.prototype.hasOwnProperty.call(character, key), `character ${character.id || '<unknown>'} missing ${key}`);
  assert(character.schemaVersion === '2.0.0-alpha', `${character.id} has unexpected schemaVersion`);
  assert(/^[a-z0-9_]+$/.test(character.id), `${character.id} id must be snake_case`);
  assert(!ids.has(character.id), `duplicate character id ${character.id}`);
  ids.add(character.id);
  assert(['legacy-adapted', 'native-v2', 'candidate', 'disabled'].includes(character.status), `${character.id} invalid status`);
  assertStringArray(character.source.notes, `${character.id}.source.notes`);
  assert(typeof character.select.archetype === 'string' && character.select.archetype, `${character.id}.select.archetype required`);
  assertStringArray(character.select.strengths, `${character.id}.select.strengths`, 1);
  assert(character.runtime.preserveHydration === true, `${character.id} must preserve hydration for V2 alpha`);
  assertStringArray(character.moves.knownPolicies, `${character.id}.moves.knownPolicies`);
  assertStringArray(character.animation.manifestRefs, `${character.id}.animation.manifestRefs`);
  assertStringArray(character.assets.spriteRoots, `${character.id}.assets.spriteRoots`);
  assertStringArray(character.validation.requiredChecks, `${character.id}.validation.requiredChecks`, 1);
  assertStringArray(character.validation.lastKnownReports, `${character.id}.validation.lastKnownReports`);
  assertStringArray(character.validation.gotchas, `${character.id}.validation.gotchas`);
}

function validateStage(stage, ids) {
  const required = ['schemaVersion', 'id', 'displayName', 'status', 'runtime', 'camera', 'collision', 'render', 'assets', 'validation'];
  for (const key of required) assert(Object.prototype.hasOwnProperty.call(stage, key), `stage ${stage.id || '<unknown>'} missing ${key}`);
  assert(stage.schemaVersion === '2.0.0-alpha', `${stage.id} has unexpected schemaVersion`);
  assert(/^[a-z0-9_]+$/.test(stage.id), `${stage.id} id must be snake_case`);
  assert(!ids.has(stage.id), `duplicate stage id ${stage.id}`);
  ids.add(stage.id);
  assert(Number.isFinite(stage.runtime.worldWidth) && stage.runtime.worldWidth > 0, `${stage.id}.runtime.worldWidth invalid`);
  assert(stage.runtime.bounds.left < stage.runtime.bounds.right, `${stage.id}.runtime.bounds invalid`);
  assert(Number.isFinite(stage.runtime.spawns.p1X) && Number.isFinite(stage.runtime.spawns.p2X), `${stage.id}.runtime.spawns invalid`);
  assert(Array.isArray(stage.collision.platforms), `${stage.id}.collision.platforms must be an array`);
  assert(typeof stage.render.foregroundPolicy === 'string' && stage.render.foregroundPolicy, `${stage.id}.render.foregroundPolicy required`);
  assertStringArray(stage.assets.layers, `${stage.id}.assets.layers`);
  assertStringArray(stage.validation.requiredChecks, `${stage.id}.validation.requiredChecks`, 1);
  assertStringArray(stage.validation.lastKnownReports, `${stage.id}.validation.lastKnownReports`);
  assertStringArray(stage.validation.gotchas, `${stage.id}.validation.gotchas`);
}

function validateExistingPaths(manifest) {
  const refs = [];
  for (const character of manifest.characters || []) {
    refs.push(...character.animation.manifestRefs, ...character.assets.spriteRoots, ...character.validation.lastKnownReports);
    if (character.assets.portrait) refs.push(character.assets.portrait);
  }
  for (const stage of manifest.stages || []) {
    refs.push(...stage.assets.layers, ...stage.validation.lastKnownReports);
    if (stage.assets.stageCard) refs.push(stage.assets.stageCard);
  }
  const missing = refs.filter((ref) => ref.startsWith('NO_GODS_ABOVE/') && !fs.existsSync(path.join(REPO_ROOT, ref)));
  assert(missing.length === 0, `missing referenced path(s): ${missing.join(', ')}`);
}

function main() {
  readJson(CHARACTER_SCHEMA);
  readJson(STAGE_SCHEMA);
  const characters = readJson(CHARACTER_MANIFEST);
  const stages = readJson(STAGE_MANIFEST);
  assert(characters.schemaVersion === '2.0.0-alpha', 'characters manifest version mismatch');
  assert(stages.schemaVersion === '2.0.0-alpha', 'stages manifest version mismatch');
  assert(Array.isArray(characters.characters), 'characters must be an array');
  assert(Array.isArray(stages.stages), 'stages must be an array');
  const characterIds = new Set();
  const stageIds = new Set();
  characters.characters.forEach((character) => validateCharacter(character, characterIds));
  stages.stages.forEach((stage) => validateStage(stage, stageIds));
  validateExistingPaths({ characters: characters.characters, stages: stages.stages });
  console.log(`Validated ${characterIds.size} character contracts and ${stageIds.size} stage contracts.`);
}

try {
  main();
} catch (error) {
  console.error(error.message);
  process.exit(1);
}
