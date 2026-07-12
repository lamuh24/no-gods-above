#!/usr/bin/env node
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const REPO_ROOT = path.resolve(ROOT, '..', '..');
const GAME_JS = path.join(REPO_ROOT, 'NO_GODS_ABOVE', 'game.js');
const CHARACTER_MANIFEST = path.join(ROOT, 'manifests', 'characters.seed.json');
const STAGE_MANIFEST = path.join(ROOT, 'manifests', 'stages.seed.json');
const ID_PATTERN = /^[a-z0-9_]+$/;

function readJson(file) {
  return JSON.parse(fs.readFileSync(file, 'utf8'));
}

function readText(file) {
  return fs.readFileSync(file, 'utf8');
}

function unique(values) {
  return [...new Set(values)];
}

function duplicates(values) {
  const seen = new Set();
  const dupes = new Set();
  for (const value of values) {
    if (seen.has(value)) dupes.add(value);
    seen.add(value);
  }
  return [...dupes].sort();
}

function malformed(values) {
  return unique(values.filter((value) => !ID_PATTERN.test(value))).sort();
}

function difference(left, right) {
  const rightSet = new Set(right);
  return unique(left.filter((value) => !rightSet.has(value))).sort();
}

function sectionBetween(source, startPattern, endPattern, label) {
  const start = source.search(startPattern);
  if (start < 0) throw new Error(`Could not find ${label} start in game.js`);
  const afterStart = source.slice(start);
  const end = afterStart.search(endPattern);
  if (end < 0) throw new Error(`Could not find ${label} end in game.js`);
  return afterStart.slice(0, end);
}

function extractConstStrings(source) {
  const constants = new Map();
  const pattern = /const\s+([A-Z][A-Z0-9_]*)\s*=\s*"([a-z0-9_]+)"\s*;/g;
  for (const match of source.matchAll(pattern)) constants.set(match[1], match[2]);
  return constants;
}

function extractLegacyCharacterIds(source) {
  const match = source.match(/const\s+selectableCharacterIds\s*=\s*\[([\s\S]*?)\]\s*;/);
  if (!match) throw new Error('Could not find selectableCharacterIds in game.js');
  const staticBlock = match[1].split('...')[0];
  return [...staticBlock.matchAll(/["']([a-z0-9_]+)["']/g)].map((entry) => entry[1]);
}

function extractGatedCharacterIds(source) {
  const match = source.match(/const\s+selectableCharacterIds\s*=\s*\[([\s\S]*?)\]\s*;/);
  if (!match) return [];
  return [...match[1].matchAll(/\.\.\.\([^\n]*?\[\s*["']([a-z0-9_]+)["']\s*\]/g)].map((entry) => entry[1]);
}

function extractLegacyStageIds(source) {
  const constants = extractConstStrings(source);
  const block = sectionBetween(source, /const\s+STAGE_FLOW_DATA\s*=\s*\{/, /const\s+hiddenTestCharacterIds\s*=\s*\[/, 'STAGE_FLOW_DATA');
  const ids = [];
  const pattern = /\[([A-Z][A-Z0-9_]*)\]\s*:\s*\{/g;
  for (const match of block.matchAll(pattern)) {
    const resolved = constants.get(match[1]);
    if (!resolved) throw new Error(`Could not resolve stage constant ${match[1]} from STAGE_FLOW_DATA`);
    ids.push(resolved);
  }
  return ids;
}

function getV2CharacterIds() {
  return readJson(CHARACTER_MANIFEST).characters.map((character) => character.id);
}

function getV2StageIds() {
  return readJson(STAGE_MANIFEST).stages.map((stage) => stage.id);
}

function analyze(label, legacyIds, v2Ids) {
  const both = unique(legacyIds.filter((id) => v2Ids.includes(id))).sort();
  return {
    label,
    legacyIds,
    v2Ids,
    both,
    missingFromV2: difference(legacyIds, v2Ids),
    extraInV2: difference(v2Ids, legacyIds),
    duplicateLegacy: duplicates(legacyIds),
    duplicateV2: duplicates(v2Ids),
    malformedLegacy: malformed(legacyIds),
    malformedV2: malformed(v2Ids)
  };
}

function printList(name, values) {
  console.log(`  ${name}: ${values.length ? values.join(', ') : '(none)'}`);
}

function printReport(result) {
  console.log(`\n${result.label}`);
  printList('Legacy select flow IDs', result.legacyIds);
  printList('V2 manifest IDs', result.v2Ids);
  printList('Present in both', result.both);
  printList('Missing from V2', result.missingFromV2);
  printList('Present in V2 but absent from legacy select flow', result.extraInV2);
  printList('Duplicate legacy IDs', result.duplicateLegacy);
  printList('Duplicate V2 IDs', result.duplicateV2);
  printList('Malformed legacy IDs', result.malformedLegacy);
  printList('Malformed V2 IDs', result.malformedV2);
}

function hasFailure(result) {
  return result.missingFromV2.length > 0 ||
    result.extraInV2.length > 0 ||
    result.duplicateLegacy.length > 0 ||
    result.duplicateV2.length > 0 ||
    result.malformedLegacy.length > 0 ||
    result.malformedV2.length > 0;
}

function main() {
  const source = readText(GAME_JS);
  const gatedCharacterIds = extractGatedCharacterIds(source);
  const characterResult = analyze('Character parity', extractLegacyCharacterIds(source), getV2CharacterIds());
  const stageResult = analyze('Stage parity', extractLegacyStageIds(source), getV2StageIds());
  console.log('NGA Engine V2 read-only parity smoke');
  console.log(`Source: ${path.relative(REPO_ROOT, GAME_JS)}`);
  console.log('Extraction mode: static source text scan; game runtime is not evaluated.');
  printList('Excluded gated test-only character IDs', gatedCharacterIds);
  printReport(characterResult);
  printReport(stageResult);
  const failed = hasFailure(characterResult) || hasFailure(stageResult);
  if (failed) {
    console.error('\nParity smoke FAILED: V2 manifests and legacy select flow are out of contract parity.');
    process.exit(1);
  }
  console.log('\nParity smoke PASSED: V2 manifests match current legacy selectable character and stage IDs.');
}

try {
  main();
} catch (error) {
  console.error(`Parity smoke ERROR: ${error.message}`);
  process.exit(1);
}
