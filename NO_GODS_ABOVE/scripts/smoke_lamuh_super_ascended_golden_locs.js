#!/usr/bin/env node
/* Focused static smoke for LAMUH Super / Ascended golden-locs atlas integration. */

const fs = require("fs");
const path = require("path");

const ROOT = path.resolve(__dirname, "..");
const GAME_PATH = path.join(ROOT, "game.js");
const ATLAS_PATH = path.join(ROOT, "assets", "characters", "lamuh", "lamuh_sheet_super_ascended_golden_locs_atlas.png");
const REPORT_PATH = path.join(ROOT, "assets", "characters", "lamuh", "lamuh_sheet_super_ascended_golden_locs_report.json");
const SMOKE_REPORT_PATH = path.join(ROOT, "assets", "characters", "lamuh", "lamuh_super_ascended_golden_locs_smoke_report.json");

function readPngSize(filePath) {
  const buffer = fs.readFileSync(filePath);
  if (buffer.toString("ascii", 1, 4) !== "PNG") throw new Error(`${filePath} is not a PNG`);
  return {
    width: buffer.readUInt32BE(16),
    height: buffer.readUInt32BE(20),
    colorType: buffer[25],
  };
}

function has(source, needle) {
  return source.includes(needle);
}

function hasAliasTarget(source, alias, target) {
  const escapedAlias = alias.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const escapedTarget = target.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return new RegExp(`${escapedAlias}:\\s*${escapedTarget}`).test(source);
}

function repairedSlot(report, row, col, fromRow, fromCol) {
  return report.source_repaired_slots?.some((slot) =>
    slot.row === row &&
    slot.col === col &&
    Array.isArray(slot.from) &&
    slot.from[0] === fromRow &&
    slot.from[1] === fromCol
  );
}

function main() {
  const game = fs.readFileSync(GAME_PATH, "utf8");
  const report = JSON.parse(fs.readFileSync(REPORT_PATH, "utf8"));
  const png = readPngSize(ATLAS_PATH);
  const result = {
    ok: false,
    atlas: {
      path: path.relative(ROOT, ATLAS_PATH),
      ...png,
      hasAlphaColorType: png.colorType === 6,
    },
    normalization: {
      outputSize: report.output_size,
      grid: report.grid,
      occupiedCells: report.occupied_cells,
      sourceSpriteSlotsDetected: report.source_sprite_slots_detected,
      sourceBodySlotsDetected: report.source_body_slots_detected,
      sourceRawBodyComponentsDetected: report.source_raw_body_components_detected,
      sourceRepairedSlots: report.source_repaired_slots,
      weakOrFragmentSlots: report.weak_or_fragment_slots,
      hasRealTransparency: report.has_real_transparency,
      checkerboardRemoved: report.checkerboard_removed,
      whiteCoatPreserved: report.white_coat_preserved,
      blackOutfitLocsPreserved: report.black_outfit_locs_preserved,
      goldCyanAccentsPreserved: report.gold_cyan_accents_preserved,
      goldenLocsPreserved: report.golden_locs_preserved,
      superBaselineMaxDeviation: report.super_baseline_max_deviation,
      noImportantSuperBodyClipping: report.no_important_super_body_clipping,
      bodyScale: report.body_scale,
    },
    code: {
      assetPath: has(game, "lamuhSuperAscendedGoldenLocs: LAMUH_RUNTIME_ENABLED ? \"assets/characters/lamuh/lamuh_sheet_super_ascended_golden_locs_atlas.png"),
      sheetMeta: has(game, "lamuhSuperAscendedGoldenLocs: { cols: 8, rows: 6, cellSize: 448, baselineY: 382, scale: 0.82"),
      profileSheetKey: has(game, "superAscendedGoldenLocs: \"lamuhSuperAscendedGoldenLocs\""),
      rowTargets: has(game, "const superIdle = sheets.superAscendedGoldenLocs ? [sheets.superAscendedGoldenLocs, 0]") &&
        has(game, "const superCharge = sheets.superAscendedGoldenLocs ? [sheets.superAscendedGoldenLocs, 1]") &&
        has(game, "const superRush = sheets.superAscendedGoldenLocs ? [sheets.superAscendedGoldenLocs, 2]") &&
        has(game, "const superComboA = sheets.superAscendedGoldenLocs ? [sheets.superAscendedGoldenLocs, 3]") &&
        has(game, "const superComboBLaunch = sheets.superAscendedGoldenLocs ? [sheets.superAscendedGoldenLocs, 4]") &&
        has(game, "const superFire = sheets.superAscendedGoldenLocs ? [sheets.superAscendedGoldenLocs, 5]"),
      aliases: {
        crown_startup: hasAliasTarget(game, "crown_startup", "superCharge"),
        crown_rush: hasAliasTarget(game, "crown_rush", "superRush"),
        crown_combo_a: hasAliasTarget(game, "crown_combo_a", "superComboA"),
        crown_combo_b: hasAliasTarget(game, "crown_combo_b", "superComboBLaunch"),
        crown_launch: hasAliasTarget(game, "crown_launch", "superLaunch"),
        crown_charge: hasAliasTarget(game, "crown_charge", "superCharge"),
        lamuh_super_activation: hasAliasTarget(game, "lamuh_super_activation", "superCharge"),
        crown_fire: hasAliasTarget(game, "crown_fire", "superFire"),
        lamuh_super_attack_overlay: hasAliasTarget(game, "lamuh_super_attack_overlay", "superFire"),
        crown_recovery: hasAliasTarget(game, "crown_recovery", "superIdle"),
        lamuh_super_idle: hasAliasTarget(game, "lamuh_super_idle", "superIdle"),
        ultimate: hasAliasTarget(game, "ultimate", "superCharge"),
      },
      oldAtlasesRemainFallback: has(game, "lamuhCrownBody: LAMUH_RUNTIME_ENABLED ? \"assets/sprites/lamuh_final/lamuh_sheet_8_crown_of_no_gods_body_atlas.png") &&
        has(game, "lamuhFinalSpecials: LAMUH_RUNTIME_ENABLED ? \"assets/sprites/lamuh_final/lamuh_sheet_5_specials_atlas.png"),
      regularCrownBeamUntouched: hasAliasTarget(game, "neutral_heavy_special", "crownBeam") &&
        hasAliasTarget(game, "crown_beam_charge", "crownBeamCharge") &&
        hasAliasTarget(game, "crown_beam_fire", "crownBeamFire") &&
        hasAliasTarget(game, "crown_beam_recovery", "crownBeamRecovery"),
      hiddenDiagnosticUpdated: has(game, "golden-locs ascended cinematic") &&
        has(game, "bodyAtlas: \"lamuhSuperAscendedGoldenLocs\""),
    },
  };

  result.ok =
    result.atlas.width === 3584 &&
    result.atlas.height === 2688 &&
    result.atlas.hasAlphaColorType &&
    result.normalization.outputSize?.[0] === 3584 &&
    result.normalization.outputSize?.[1] === 2688 &&
    result.normalization.grid?.cols === 8 &&
    result.normalization.grid?.rows === 6 &&
    result.normalization.grid?.cell === 448 &&
    result.normalization.hasRealTransparency &&
    result.normalization.checkerboardRemoved &&
    result.normalization.occupiedCells === 48 &&
    result.normalization.sourceSpriteSlotsDetected === 48 &&
    result.normalization.sourceBodySlotsDetected === 48 &&
    result.normalization.sourceRawBodyComponentsDetected === 47 &&
    repairedSlot(report, 0, 3, 0, 2) &&
    repairedSlot(report, 1, 3, 1, 2) &&
    result.normalization.weakOrFragmentSlots?.length === 0 &&
    result.normalization.whiteCoatPreserved &&
    result.normalization.blackOutfitLocsPreserved &&
    result.normalization.goldCyanAccentsPreserved &&
    result.normalization.goldenLocsPreserved &&
    result.normalization.superBaselineMaxDeviation === 0 &&
    result.normalization.noImportantSuperBodyClipping === true &&
    result.normalization.bodyScale?.passes === true &&
    Object.entries(result.code)
      .filter(([, value]) => typeof value === "boolean")
      .every(([, value]) => value) &&
    Object.values(result.code.aliases).every(Boolean);

  fs.writeFileSync(SMOKE_REPORT_PATH, JSON.stringify(result, null, 2));
  console.log(JSON.stringify({ ok: result.ok, report: path.relative(ROOT, SMOKE_REPORT_PATH) }, null, 2));
  if (!result.ok) process.exit(1);
}

main();
