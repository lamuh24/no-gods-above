#!/usr/bin/env node
"use strict";

const fs = require("fs");
const path = require("path");

const REPO_ROOT = path.resolve(__dirname, "..", "..", "..");
const ENGINE_ROOT = path.join(REPO_ROOT, "NO_GODS_ABOVE", "engine_v2");
const BUNDLE = path.join(
  ENGINE_ROOT,
  "content-source",
  "characters",
  "swahili-goal-v1",
  "character.bundle.json"
);
const OUTPUT = path.join(
  ENGINE_ROOT,
  "generated",
  "manifests",
  "swahili_moveset_goal_v1.candidate.runtime.json"
);
const { compileFromPath, stableJson, writeCompiledManifest } = require(
  path.join(ENGINE_ROOT, "scripts", "production_contracts")
);

const checkOnly = process.argv.includes("--check");

try {
  const sourceBundle = JSON.parse(fs.readFileSync(BUNDLE, "utf8"));
  const compiled = compileFromPath(BUNDLE);
  if (compiled.fighterId !== "swahili_goal_v1") {
    throw new Error(`Unexpected candidate fighter id: ${compiled.fighterId}`);
  }
  if (sourceBundle.promotionState !== "candidate") {
    throw new Error(`Candidate bundle promotion state changed: ${sourceBundle.promotionState}`);
  }
  if (compiled.deployable !== false) {
    throw new Error(`Candidate runtime unexpectedly became deployable: ${compiled.deployable}`);
  }
  if (checkOnly) {
    const expected = stableJson(compiled);
    const actual = fs.readFileSync(OUTPUT, "utf8");
    if (actual !== expected) throw new Error(`Compiled manifest is stale: ${OUTPUT}`);
    console.log(`Swahili Moveset Goal V1 candidate manifest is current: ${OUTPUT}`);
  } else {
    const result = writeCompiledManifest(BUNDLE, OUTPUT);
    console.log(
      JSON.stringify(
        {
          result: "PASS",
          animationPackageCount: result.manifest.animations.length,
          sourcePromotionState: sourceBundle.promotionState,
          deployable: result.manifest.deployable,
          outputPath: result.outputPath,
          sourceDigest: result.manifest.sourceDigest
        },
        null,
        2
      )
    );
  }
} catch (error) {
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
}
