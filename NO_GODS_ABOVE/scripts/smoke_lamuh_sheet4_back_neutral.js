#!/usr/bin/env node
/* Focused static smoke for LAMUH Sheet 4 Back Specials fallback rows. */

const fs = require("fs");
const path = require("path");

const ROOT = path.resolve(__dirname, "..");
const GAME_PATH = path.join(ROOT, "game.js");
const ATLAS_PATH = path.join(ROOT, "assets", "characters", "lamuh", "lamuh_sheet_4_back_neutral_specials_redesign_atlas.png");
const REPORT_PATH = path.join(ROOT, "assets", "characters", "lamuh", "lamuh_sheet_4_back_neutral_specials_redesign_report.json");
const SMOKE_REPORT_PATH = path.join(ROOT, "assets", "characters", "lamuh", "lamuh_sheet4_back_neutral_smoke_report.json");

const EXPECTED_ALIASES = {
  back_special: 0,
  back_light_special: 0,
  mirror_slip: 0,
  lamuh_mirror_slip: 0,
  back_medium_special: 1,
  rebound_strike: 1,
  lamuh_rebound_strike: 1,
  back_heavy_special: 2,
  mirror_reversal: 2,
  lamuh_mirror_reversal: 2,
};

const EXPECTED_DEBUG_ROWS = {
  back_special: 0,
  back_light_special: 0,
  back_medium_special: 1,
  back_heavy_special: 2,
};

function readPngSize(filePath) {
  const buffer = fs.readFileSync(filePath);
  if (buffer.toString("ascii", 1, 4) !== "PNG") {
    throw new Error(`${filePath} is not a PNG`);
  }
  return {
    width: buffer.readUInt32BE(16),
    height: buffer.readUInt32BE(20),
    colorType: buffer[25],
  };
}

function has(source, needle) {
  return source.includes(needle);
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
      validationPassed: report.validation_passed,
      outputSize: report.output_size,
      occupiedCells: report.occupied_cells,
      sourceSpriteComponentsDetected: report.source_sprite_components_detected,
      hasRealTransparency: report.has_real_transparency,
      greenBackgroundRemoved: report.green_background_removed,
      whiteCoatPreserved: report.white_coat_preserved,
      blackOutfitLocsPreserved: report.black_outfit_locs_preserved,
      vfxPreserved: report.gold_cyan_white_vfx_preserved,
      bodyScale: report.body_scale,
      baselineMaxDeviation: report.baseline_max_deviation,
    },
    code: {
      assetPath: has(game, "lamuhBackNeutralSpecialsRedesign: LAMUH_RUNTIME_ENABLED ? \"assets/characters/lamuh/lamuh_sheet_4_back_neutral_specials_redesign_atlas.png"),
      sheetMeta: has(game, "lamuhBackNeutralSpecialsRedesign: { cols: 8, rows: 6, cellSize: 448, baselineY: 382, scale: 0.82"),
      profileSheetKey: has(game, "backNeutralSpecialsRedesign: \"lamuhBackNeutralSpecialsRedesign\""),
      constants: {
        mirrorSlip: has(game, "const mirrorSlip = sheets.backNeutralSpecialsRedesign ? [sheets.backNeutralSpecialsRedesign, 0] : newWalk;"),
        reboundStrike: has(game, "const reboundStrike = sheets.backNeutralSpecialsRedesign ? [sheets.backNeutralSpecialsRedesign, 1] : newStandMedium;"),
        mirrorReversal: has(game, "const mirrorReversal = sheets.backNeutralSpecialsRedesign ? [sheets.backNeutralSpecialsRedesign, 2] : newStandHeavy;"),
      },
      aliases: {},
      debugRows: {},
      neutralMovedToDedicatedAtlas: has(game, "neutralSpecialsBodyVfxRedesign: \"lamuhNeutralSpecialsBodyVfxRedesign\""),
    },
  };

  const aliasTargets = {
    back_special: "mirrorSlip",
    back_light_special: "mirrorSlip",
    mirror_slip: "mirrorSlip",
    lamuh_mirror_slip: "mirrorSlip",
    back_medium_special: "reboundStrike",
    rebound_strike: "reboundStrike",
    lamuh_rebound_strike: "reboundStrike",
    back_heavy_special: "mirrorReversal",
    mirror_reversal: "mirrorReversal",
    lamuh_mirror_reversal: "mirrorReversal",
  };
  for (const [alias, target] of Object.entries(aliasTargets)) {
    result.code.aliases[alias] = has(game, `${alias}: ${target},`);
  }
  for (const [alias, row] of Object.entries(EXPECTED_DEBUG_ROWS)) {
    result.code.debugRows[alias] = has(game, `${alias}: ${row},`);
  }

  result.ok =
    result.atlas.width === 3584 &&
    result.atlas.height === 2688 &&
    result.atlas.hasAlphaColorType &&
    result.normalization.validationPassed &&
    result.normalization.occupiedCells === 48 &&
    result.normalization.sourceSpriteComponentsDetected === 48 &&
    result.normalization.hasRealTransparency &&
    result.normalization.greenBackgroundRemoved &&
    result.normalization.whiteCoatPreserved &&
    result.normalization.blackOutfitLocsPreserved &&
    result.normalization.vfxPreserved &&
    result.normalization.bodyScale?.passes === true &&
    result.normalization.baselineMaxDeviation === 0 &&
    result.code.assetPath &&
    result.code.sheetMeta &&
    result.code.profileSheetKey &&
    Object.values(result.code.constants).every(Boolean) &&
    result.code.neutralMovedToDedicatedAtlas &&
    Object.values(result.code.aliases).every(Boolean) &&
    Object.values(result.code.debugRows).every(Boolean);

  fs.writeFileSync(SMOKE_REPORT_PATH, JSON.stringify(result, null, 2));
  console.log(JSON.stringify({ ok: result.ok, report: path.relative(ROOT, SMOKE_REPORT_PATH) }, null, 2));
  if (!result.ok) process.exit(1);
}

main();
