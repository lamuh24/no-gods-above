#!/usr/bin/env node
/* Focused static smoke for LAMUH Air + Crouch + Jump coverage integration. */

const fs = require("fs");
const path = require("path");

const ROOT = path.resolve(__dirname, "..");
const GAME_PATH = path.join(ROOT, "game.js");
const ATLAS_PATH = path.join(ROOT, "assets", "characters", "lamuh", "lamuh_sheet_air_crouch_jump_redesign_atlas_v2.png");
const REPORT_PATH = path.join(ROOT, "assets", "characters", "lamuh", "lamuh_sheet_air_crouch_jump_redesign_report_v2.json");
const SMOKE_REPORT_PATH = path.join(ROOT, "assets", "characters", "lamuh", "lamuh_air_crouch_jump_smoke_report.json");

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
      weakOrFragmentSlots: report.weak_or_fragment_slots,
      hasRealTransparency: report.has_real_transparency,
      checkerboardRemoved: report.checkerboard_removed,
      whiteCoatPreserved: report.white_coat_preserved,
      blackOutfitLocsPreserved: report.black_outfit_locs_preserved,
      goldCyanAccentsPreserved: report.gold_cyan_accents_preserved,
      bodyScale: report.body_scale,
      groundedCrouchBaselineMaxDeviation: report.grounded_crouch_baseline_max_deviation,
      airborneCenterMaxDeviation: report.airborne_center_max_deviation,
      noImportantAirDashCrownDropClipping: report.no_important_air_dash_crown_drop_clipping,
    },
    code: {
      assetPath: has(game, "lamuhAirCrouchJumpRedesign: LAMUH_RUNTIME_ENABLED ? \"assets/characters/lamuh/lamuh_sheet_air_crouch_jump_redesign_atlas_v2.png"),
      sheetMeta: has(game, "lamuhAirCrouchJumpRedesign: { cols: 8, rows: 6, cellSize: 448, baselineY: 382, scale: 0.82"),
      profileSheetKey: has(game, "airCrouchJumpRedesign: \"lamuhAirCrouchJumpRedesign\""),
      frameSplitHelper: has(game, "function getLamuhAirCrouchJumpFrameOverride") &&
        has(game, "sheetKey !== \"lamuhAirCrouchJumpRedesign\"") &&
        has(game, "if (row === 0)") &&
        has(game, "if (row === 4)") &&
        has(game, "if (row === 5)"),
      frameSplitActive: has(game, "frame = getLamuhAirCrouchJumpFrameOverride(f, animKey, entry[0], row, frameCount, frame);"),
      oldAtlasesRemainFallback: has(game, "lamuhFinalAirMovement: LAMUH_RUNTIME_ENABLED ? \"assets/sprites/lamuh_final/lamuh_sheet_2_air_movement_atlas.png") &&
        has(game, "lamuhFinalGroundNormals: LAMUH_RUNTIME_ENABLED ? \"assets/sprites/lamuh_final/lamuh_sheet_3_ground_normals_atlas.png") &&
        has(game, "lamuhFinalAirNormals: LAMUH_RUNTIME_ENABLED ? \"assets/sprites/lamuh_final/lamuh_sheet_4_air_normals_atlas.png") &&
        has(game, "lamuhFinalSpecials: LAMUH_RUNTIME_ENABLED ? \"assets/sprites/lamuh_final/lamuh_sheet_5_specials_atlas.png"),
      untouchedKnownSpecials: has(game, "mirror_pierce: mirrorPierce,") &&
        has(game, "neutral_heavy_special: crownBeam,") &&
        has(game, "down_heavy_special: crownRupture,") &&
        has(game, "up_heavy_special: ascendantBreak,"),
      aliases: {},
    },
  };

  const aliasTargets = {
    jump_up: "jumpFallLand",
    lamuh_jump: "jumpFallLand",
    fall: "jumpFallLand",
    lamuh_fall: "jumpFallLand",
    land: "jumpFallLand",
    lamuh_land: "jumpFallLand",
    down_light: "crouchLight",
    crouch_light: "crouchLight",
    lamuh_crouch_light: "crouchLight",
    down_medium: "crouchMedium",
    crouch_medium: "crouchMedium",
    lamuh_crouch_medium: "crouchMedium",
    down_heavy: "crouchHeavy",
    crown_riser: "crouchHeavy",
    lamuh_crown_riser: "crouchHeavy",
    crouch_heavy: "crouchHeavy",
    lamuh_crouch_heavy: "crouchHeavy",
    jump_light: "airLight",
    air_light: "airLight",
    lamuh_air_light: "airLight",
    jump_medium: "airMedium",
    air_medium: "airMedium",
    lamuh_air_medium: "airMedium",
    jump_heavy: "airHeavy",
    air_heavy: "airHeavy",
    lamuh_air_heavy: "airHeavy",
    air_special: "airMirrorSpark",
    air_light_special: "airMirrorSpark",
    air_mirror_spark: "airMirrorSpark",
    lamuh_air_mirror_spark: "airMirrorSpark",
    radiant_dive: "airDashStrike",
    air_medium_special: "airDashStrike",
    air_dash_strike: "airDashStrike",
    lamuh_air_dash_strike: "airDashStrike",
    air_heavy_special: "airCrownDrop",
    air_crown_drop: "airCrownDrop",
    lamuh_air_crown_drop: "airCrownDrop",
  };
  for (const [alias, target] of Object.entries(aliasTargets)) {
    result.code.aliases[alias] = hasAliasTarget(game, alias, target);
  }

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
    result.normalization.weakOrFragmentSlots?.length === 0 &&
    result.normalization.whiteCoatPreserved &&
    result.normalization.blackOutfitLocsPreserved &&
    result.normalization.goldCyanAccentsPreserved &&
    result.normalization.bodyScale?.passes === true &&
    result.normalization.groundedCrouchBaselineMaxDeviation === 0 &&
    result.normalization.airborneCenterMaxDeviation <= 24 &&
    result.normalization.noImportantAirDashCrownDropClipping === true &&
    Object.values(result.code).filter((value) => typeof value === "boolean").every(Boolean) &&
    Object.values(result.code.aliases).every(Boolean);

  fs.writeFileSync(SMOKE_REPORT_PATH, JSON.stringify(result, null, 2));
  console.log(JSON.stringify({ ok: result.ok, report: path.relative(ROOT, SMOKE_REPORT_PATH) }, null, 2));
  if (!result.ok) process.exit(1);
}

main();
