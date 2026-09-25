#!/usr/bin/env node
const path = require('path');
const {
  compileFromPath,
  validateProductionSchemas
} = require('./production_contracts');

const ROOT = path.resolve(__dirname, '..');
const bundlePaths = [
  path.join(ROOT, 'content-source', 'characters', 'lamuh', 'character.bundle.json'),
  path.join(ROOT, 'content-source', 'characters', 'swahili', 'character.bundle.json'),
  path.join(ROOT, 'content-source', 'characters', 'lamuh-legacy-v2', 'character.bundle.json')
];

try {
  const schemaCount = validateProductionSchemas();
  const manifests = bundlePaths.map(compileFromPath);
  if (manifests.some((manifest) => manifest.deployable)) throw new Error('Contract fixture and candidate packages must never be deployable');
  console.log(`Validated ${schemaCount} production schemas, ${manifests[0].animations.length} retired Lamuh fixture packages, ${manifests[1].animations.length} Swahili candidate packages, and ${manifests[2].animations.length} Lamuh Legacy V2 first-playable packages (all deployable: false).`);
} catch (error) {
  console.error(error.message);
  process.exit(1);
}
