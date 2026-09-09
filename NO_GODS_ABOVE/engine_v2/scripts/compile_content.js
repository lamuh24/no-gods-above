#!/usr/bin/env node
const fs = require('fs');
const path = require('path');
const {
  compileFromPath,
  stableJson,
  writeCompiledManifest
} = require('./production_contracts');

const ROOT = path.resolve(__dirname, '..');
const targets = [
  {
    bundlePath: path.join(ROOT, 'content-source', 'characters', 'lamuh', 'character.bundle.json'),
    outputPath: path.join(ROOT, 'generated', 'manifests', 'lamuh_legacy_motion_fixture.runtime.json')
  },
  {
    bundlePath: path.join(ROOT, 'content-source', 'characters', 'swahili', 'character.bundle.json'),
    outputPath: path.join(ROOT, 'generated', 'manifests', 'swahili_defense_reaction_v1.candidate.runtime.json')
  },
  {
    bundlePath: path.join(ROOT, 'content-source', 'characters', 'lamuh-legacy-v2', 'character.bundle.json'),
    outputPath: path.join(ROOT, 'generated', 'manifests', 'lamuh_legacy_v2_first_playable.candidate.runtime.json')
  },
  {
    // The current Swahili moveset bundle was never in this list, so its generated manifest was not
    // recompiled or checked and had drifted from its source packages.
    bundlePath: path.join(ROOT, 'content-source', 'characters', 'swahili-goal-v1', 'character.bundle.json'),
    outputPath: path.join(ROOT, 'generated', 'manifests', 'swahili_moveset_goal_v1.candidate.runtime.json')
  }
];
const checkOnly = process.argv.includes('--check');

try {
  if (checkOnly) {
    for (const { bundlePath, outputPath } of targets) {
      const expected = stableJson(compileFromPath(bundlePath));
      const actual = fs.readFileSync(outputPath, 'utf8');
      if (actual !== expected) throw new Error(`Compiled manifest is stale: ${outputPath}`);
      console.log(`Compiled manifest is current: ${outputPath}`);
    }
  } else {
    for (const { bundlePath, outputPath } of targets) {
      const result = writeCompiledManifest(bundlePath, outputPath);
      console.log(`Compiled ${result.manifest.animations.length} animation packages to ${result.outputPath}`);
    }
  }
} catch (error) {
  console.error(error.message);
  process.exit(1);
}
