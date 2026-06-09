#!/usr/bin/env node
/* Focused static smoke for LAMUH secondary movement/directional normals integration. */

const fs = require("fs");
const path = require("path");

const ROOT = path.resolve(__dirname, "..");
const GAME_PATH = path.join(ROOT, "game.js");
const ATLAS_PATH = path.join(ROOT, "assets", "characters", "lamuh", "lamuh_sheet_secondary_movement_directional_normals_atlas.png");
const REPORT_PATH = path.join(ROOT, "assets", "characters", "lamuh", "lamuh_sheet_secondary_movement_directional_normals_report.json");
const SMOKE_REPORT_PATH = path.join(ROOT, "assets", "characters", "lamuh", "lamuh_secondary_movement_directional_normals_smoke_report.json");

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

function aliasUses(source, alias, target) {
  const escapedAlias = alias.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const escapedTarget = target.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return new RegExp(`${escapedAlias}:\\s*${escapedTarget}`).test(source);
}

function main() {
  const game = fs.readFileSync(GAME_PATH, "utf8");
  const report = JSON.parse(fs.readFileSync(REPORT_PATH, "utf8"));
  const png = readPngSize(ATLAS_PATH);
  const expectedAliases = {
    walk_back: "walkBack",
    lamuh_walk_back: "walkBack",
    dash_back: "dashBack",
    lamuh_dash_back: "dashBack",
    crouch: "crouchHold",
    lamuh_crouch: "crouchHold",
    low_stance: "crouchHold",
    launcher: "forwardDirectionalNormals",
    forward_light: "forwardDirectionalNormals",
    forward_medium: "forwardDirectionalNormals",
    forward_heavy: "forwardDirectionalNormals",
    back_light: "backDirectionalNormals",
    back_medium: "backDirectionalNormals",
    back_heavy: "backDirectionalNormals",
    air_dash_forward: "secondaryAirDashRecovery",
    air_dash_back: "secondaryAirDashRecovery",
    air_recovery: "secondaryAirDashRecovery",
    fall_transition: "secondaryAirDashRecovery",
  };

  const result = {
    ok: false,
    atlas: {
      path: path.relative(ROOT, ATLAS_PATH),
      ...png,
      hasAlphaColorType: png.colorType === 6,
    },
    normalization: {
      ok: report.ok,
      outputSize: report.output_size,
      grid: report.grid,
      occupiedCells: report.occupied_cells,
      sourceSpriteSlotsDetected: report.source_sprite_slots_detected,
      hasRealTransparency: report.has_real_transparency,
      backgroundRemoved: report.checkerboard_or_chroma_removed,
      whiteCoatPreserved: report.white_coat_preserved,
      blackOutfitLocsPreserved: report.black_outfit_locs_preserved,
      goldCyanAccentsPreserved: report.gold_cyan_accents_preserved,
      bodyScaleRatioVsSheet1: report.body_scale_ratio_vs_sheet1,
      groundedBaselineMaxDeviation: report.grounded_baseline_max_deviation,
    },
    code: {
      assetPath: has(game, "lamuhSecondaryMovementDirectionalNormalsRedesign: LAMUH_RUNTIME_ENABLED ? \"assets/characters/lamuh/lamuh_sheet_secondary_movement_directional_normals_atlas.png"),
      sheetMeta: has(game, "lamuhSecondaryMovementDirectionalNormalsRedesign: { cols: 8, rows: 6, cellSize: 448, baselineY: 382, scale: 0.82"),
      profileSheetKey: has(game, "secondaryMovementDirectionalNormalsRedesign: \"lamuhSecondaryMovementDirectionalNormalsRedesign\""),
      frameOverrideHelper: has(game, "function getLamuhSecondaryMovementFrameOverride") &&
        has(game, "sheetKey !== \"lamuhSecondaryMovementDirectionalNormalsRedesign\"") &&
        has(game, "if (row === 3)") &&
        has(game, "if (row === 4)") &&
        has(game, "if (row === 5)"),
      frameOverrideActive: has(game, "frame = getLamuhSecondaryMovementFrameOverride(f, animKey, entry[0], row, frameCount, frame);"),
      oldAtlasesRemainFallback: has(game, "lamuhFinalCoreMovement: LAMUH_RUNTIME_ENABLED ? \"assets/sprites/lamuh_final/lamuh_sheet_1_core_movement_atlas.png") &&
        has(game, "lamuhFinalGroundNormals: LAMUH_RUNTIME_ENABLED ? \"assets/sprites/lamuh_final/lamuh_sheet_3_ground_normals_atlas.png") &&
        has(game, "lamuhFinalAirMovement: LAMUH_RUNTIME_ENABLED ? \"assets/sprites/lamuh_final/lamuh_sheet_2_air_movement_atlas.png") &&
        has(game, "lamuhFinalAirNormals: LAMUH_RUNTIME_ENABLED ? \"assets/sprites/lamuh_final/lamuh_sheet_4_air_normals_atlas.png"),
      aliases: {},
    },
  };

  for (const [alias, target] of Object.entries(expectedAliases)) {
    result.code.aliases[alias] = aliasUses(game, alias, target);
  }

  result.ok =
    result.atlas.width === 3584 &&
    result.atlas.height === 2688 &&
    result.atlas.hasAlphaColorType &&
    result.normalization.ok === true &&
    result.normalization.outputSize?.[0] === 3584 &&
    result.normalization.outputSize?.[1] === 2688 &&
    result.normalization.grid?.cols === 8 &&
    result.normalization.grid?.rows === 6 &&
    result.normalization.grid?.cell === 448 &&
    result.normalization.hasRealTransparency === true &&
    result.normalization.backgroundRemoved === true &&
    result.normalization.occupiedCells === 48 &&
    result.normalization.sourceSpriteSlotsDetected === 48 &&
    result.normalization.whiteCoatPreserved === true &&
    result.normalization.blackOutfitLocsPreserved === true &&
    result.normalization.goldCyanAccentsPreserved === true &&
    result.normalization.groundedBaselineMaxDeviation === 0 &&
    Object.entries(result.code).filter(([, value]) => typeof value === "boolean").every(([, value]) => value) &&
    Object.values(result.code.aliases).every(Boolean);

  fs.writeFileSync(SMOKE_REPORT_PATH, JSON.stringify(result, null, 2));
  console.log(JSON.stringify({ ok: result.ok, report: path.relative(ROOT, SMOKE_REPORT_PATH) }, null, 2));
  if (!result.ok) process.exit(1);
}

main();
