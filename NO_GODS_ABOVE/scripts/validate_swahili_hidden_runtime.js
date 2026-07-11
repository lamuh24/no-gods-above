#!/usr/bin/env node
"use strict";

const fs = require("fs");
const path = require("path");
const vm = require("vm");

const ROOT = path.resolve(__dirname, "..");
const dataPath = path.join(ROOT, "data", "characters", "swahili.js");
const gamePath = path.join(ROOT, "game.js");
const indexPath = path.join(ROOT, "index.html");

const sandbox = { globalThis: {} };
vm.createContext(sandbox);
vm.runInContext(fs.readFileSync(dataPath, "utf8"), sandbox, { filename: dataPath });
const data = sandbox.globalThis.SWAHILI_CHARACTER_DATA;
if (!data) throw new Error("Swahili data file did not register SWAHILI_CHARACTER_DATA.");

const game = fs.readFileSync(gamePath, "utf8");
const index = fs.readFileSync(indexPath, "utf8");
const failures = [];
const check = (condition, message) => { if (!condition) failures.push(message); };

const normalKeys = Object.keys(data.normals || {});
const specialKeys = Object.keys(data.specials || {});
const requiredClips = data.requiredProductionClips || [];
const missingProductionClips = Object.entries(data.productionAnimationStatus || {})
  .filter(([, status]) => status !== "ready")
  .map(([clip]) => clip);

check(normalKeys.length === 15, `Expected 15 canonical normals, found ${normalKeys.length}.`);
check(specialKeys.length === 15, `Expected 15 directional specials, found ${specialKeys.length}.`);
check(Boolean(data.ultimate), "Expected one ultimate definition.");
check(new Set(requiredClips).size === requiredClips.length, "Required production clip list contains duplicates.");
check(missingProductionClips.length === requiredClips.length, "Every production clip must remain honestly marked missing in Phase 1.");
check(data.approvedForLiveRoster === false, "Swahili must not be approved for the live roster.");
check(data.placeholderMode === "procedural_dev_only", "Phase 1 must use the procedural dev placeholder.");

check(/const selectableCharacterIds = \["kairo", "vanta", "nyx", "sol", "seris", "lamuh", "lamuh_legacy", "celeste"\]/.test(game), "Public selectableCharacterIds changed or includes Swahili.");
check(game.includes('debugParams.has("swahiliTest")'), "Missing ?swahiliTest gate.");
check(game.includes('...(SWAHILI_HIDDEN_TEST_ENABLED ? ["swahili"] : [])'), "Swahili is not conditionally registered as a hidden test character.");
check(game.includes("swahiliPlaceholder: null"), "Swahili placeholder asset must remain null/procedural.");
check(!game.includes("assets/sprites/swahili"), "Runtime contains a Swahili sprite path before production art approval.");
check(index.includes('has("swahiliTest")'), "index.html does not conditionally load Swahili data.");
check(index.includes("data/characters/swahili.js"), "index.html does not reference the Swahili data file.");
check(game.includes("window.__swahiliTest"), "Missing hidden Swahili runtime test hook.");

const report = {
  ok: failures.length === 0,
  publicSelectable: false,
  hiddenFlag: "?swahiliTest",
  canonicalNormals: normalKeys.length,
  canonicalSpecials: specialKeys.length,
  ultimateDefinitions: data.ultimate ? 1 : 0,
  placeholderMode: data.placeholderMode,
  productionRuntimeAssets: [],
  requiredProductionClipCount: requiredClips.length,
  missingProductionClips,
  failures
};

process.stdout.write(`${JSON.stringify(report, null, 2)}\n`);
if (!report.ok) process.exitCode = 1;
