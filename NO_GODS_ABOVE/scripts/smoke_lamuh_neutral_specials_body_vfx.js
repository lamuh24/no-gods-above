#!/usr/bin/env node
/* Focused static smoke for LAMUH Neutral Specials Body + VFX atlas integration. */

const fs = require("fs");
const path = require("path");

const ROOT = path.resolve(__dirname, "..");
const GAME_PATH = path.join(ROOT, "game.js");
const ATLAS_PATH = path.join(ROOT, "assets", "characters", "lamuh", "lamuh_sheet_neutral_specials_body_vfx_atlas.png");
const REPORT_PATH = path.join(ROOT, "assets", "characters", "lamuh", "lamuh_sheet_neutral_specials_body_vfx_report.json");
const SMOKE_REPORT_PATH = path.join(ROOT, "assets", "characters", "lamuh", "lamuh_neutral_specials_body_vfx_smoke_report.json");

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
      outputSize: report.output_size,
      grid: report.grid,
      occupiedCells: report.occupied_cells,
      sourceSpriteSlotsDetected: report.source_sprite_slots_detected,
      hasRealTransparency: report.has_real_transparency,
      checkerboardRemoved: report.checkerboard_removed,
      whiteCoatPreserved: report.white_coat_preserved,
      blackOutfitLocsPreserved: report.black_outfit_locs_preserved,
      vfxPreserved: report.gold_cyan_white_vfx_preserved,
      bodyScale: report.body_scale,
      bodyBaselineMaxDeviation: report.body_baseline_max_deviation,
      repairedBodySlots: report.repaired_body_slots,
    },
    code: {
      assetPath: has(game, "lamuhNeutralSpecialsBodyVfxRedesign: LAMUH_RUNTIME_ENABLED ? \"assets/characters/lamuh/lamuh_sheet_neutral_specials_body_vfx_atlas.png"),
      sheetMeta: has(game, "lamuhNeutralSpecialsBodyVfxRedesign: { cols: 8, rows: 6, cellSize: 448, baselineY: 382, scale: 0.82"),
      profileSheetKey: has(game, "neutralSpecialsBodyVfxRedesign: \"lamuhNeutralSpecialsBodyVfxRedesign\""),
      bodyRows: {
        mirrorSpark: has(game, "const mirrorSpark = sheets.neutralSpecialsBodyVfxRedesign") && has(game, "[sheets.neutralSpecialsBodyVfxRedesign, 0]"),
        mirrorPulse: has(game, "const mirrorPulse = sheets.neutralSpecialsBodyVfxRedesign") && has(game, "[sheets.neutralSpecialsBodyVfxRedesign, 1]"),
        crownBeam: has(game, "const crownBeam = sheets.neutralSpecialsBodyVfxRedesign") && has(game, "[sheets.neutralSpecialsBodyVfxRedesign, 2]"),
        crownBeamPhases: has(game, "const crownBeamCharge = crownBeam;") &&
          has(game, "const crownBeamFire = crownBeam;") &&
          has(game, "const crownBeamRecovery = crownBeam;"),
      },
      aliases: {},
      vfxRows: {
        mirrorSpark: has(game, "drawLamuhNeutralSpecialAtlasVfx(projectile, 3"),
        mirrorPulse: has(game, "drawLamuhNeutralSpecialAtlasVfx(projectile, 4"),
        crownBeam: has(game, "drawLamuhNeutralSpecialAtlasVfx(projectile, 5"),
        crownBeamNotBodyRow: !has(game, "const crownBeam = sheets.neutralSpecialsBodyVfxRedesign\n      ? [sheets.neutralSpecialsBodyVfxRedesign, 5]"),
      },
      projectileProfiles: {
        mirrorSpark: has(game, "anim: \"mirror_spark\", visualProfile: \"mirrorSpark\""),
        enemyMirrorSpark: has(game, "anim: \"mirror_spark\", visualProfile: \"mirrorSpark\" });"),
        mirrorPulse: has(game, "visualProfile: \"mirrorPulse\""),
        crownBeam: has(game, "visualProfile: \"crownBeam\""),
      },
      visualAnchors: {
        mirrorSpark: has(game, "spawnOffsetX: 86, spawnOffsetY: -86, visualOffsetX: 72, visualOffsetY: -92"),
        mirrorPulse: has(game, "spawnOffsetX: 104, spawnOffsetY: -88, visualOffsetX: 78, visualOffsetY: -96"),
        crownBeam: has(game, "spawnOffsetX: 118, spawnOffsetY: -92, visualOffsetX: 82, visualOffsetY: -104"),
        splitFromHitboxSpawn: has(game, "const lamuhVisualOffsetX = Number.isFinite(special.visualOffsetX)") &&
          has(game, "const visualOriginX = celesteBatonOrigin?.x ?? lamuhVisualOrigin?.x"),
      },
      frameHolds: {
        helper: has(game, "function getLamuhNeutralSpecialFrameOverride"),
        active: has(game, "frame = getLamuhNeutralSpecialFrameOverride(f, moveData, frameCount, frame);"),
        noPulseOldRecovery: !has(game, "return withEnemyPrefix(f, \"special_recovery\");\n    }\n    if ([\"special_3\", \"neutral_heavy_special\"]"),
      },
      debugRows: {
        neutral_special: has(game, "neutral_special: 0,"),
        neutral_light_special: has(game, "neutral_light_special: 0,"),
        neutral_medium_special: has(game, "neutral_medium_special: 1,"),
        neutral_heavy_special: has(game, "neutral_heavy_special: 2,"),
        neutralDebugSheet: has(game, "? \"lamuh_sheet_neutral_specials_body_vfx_atlas.png\""),
        backDebugSheet: has(game, "? \"lamuh_sheet_4_back_neutral_specials_redesign_atlas.png\""),
      },
      backSpecialsStillSheet4: {
        mirrorSlip: has(game, "const mirrorSlip = sheets.backNeutralSpecialsRedesign ? [sheets.backNeutralSpecialsRedesign, 0] : newWalk;"),
        reboundStrike: has(game, "const reboundStrike = sheets.backNeutralSpecialsRedesign ? [sheets.backNeutralSpecialsRedesign, 1] : newStandMedium;"),
        mirrorReversal: has(game, "const mirrorReversal = sheets.backNeutralSpecialsRedesign ? [sheets.backNeutralSpecialsRedesign, 2] : newStandHeavy;"),
      },
    },
  };

  const aliasTargets = {
    special_1: "mirrorSpark",
    neutral_special: "mirrorSpark",
    neutral_light_special: "mirrorSpark",
    mirror_spark: "mirrorSpark",
    lamuh_mirror_spark: "mirrorSpark",
    lamuh_mirror_spark_body: "mirrorSpark",
    special_2: "mirrorPulse",
    neutral_medium_special: "mirrorPulse",
    mirror_pulse: "mirrorPulse",
    lamuh_mirror_pulse: "mirrorPulse",
    lamuh_mirror_pulse_body: "mirrorPulse",
    special_3: "crownBeam",
    neutral_heavy_special: "crownBeam",
    crown_beam: "crownBeam",
    lamuh_crown_beam: "crownBeam",
    lamuh_crown_beam_body: "crownBeam",
    crown_beam_charge: "crownBeamCharge",
    crown_beam_fire: "crownBeamFire",
    crown_beam_recovery: "crownBeamRecovery",
  };
  for (const [alias, target] of Object.entries(aliasTargets)) {
    result.code.aliases[alias] = has(game, `${alias}: ${target},`);
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
    result.normalization.whiteCoatPreserved &&
    result.normalization.blackOutfitLocsPreserved &&
    result.normalization.vfxPreserved &&
    result.normalization.bodyScale?.passes === true &&
    result.normalization.bodyBaselineMaxDeviation === 0 &&
    result.code.assetPath &&
    result.code.sheetMeta &&
    result.code.profileSheetKey &&
    Object.values(result.code.bodyRows).every(Boolean) &&
    Object.values(result.code.aliases).every(Boolean) &&
    Object.values(result.code.vfxRows).every(Boolean) &&
    Object.values(result.code.projectileProfiles).every(Boolean) &&
    Object.values(result.code.visualAnchors).every(Boolean) &&
    Object.values(result.code.frameHolds).every(Boolean) &&
    Object.values(result.code.debugRows).every(Boolean) &&
    Object.values(result.code.backSpecialsStillSheet4).every(Boolean);

  fs.writeFileSync(SMOKE_REPORT_PATH, JSON.stringify(result, null, 2));
  console.log(JSON.stringify({ ok: result.ok, report: path.relative(ROOT, SMOKE_REPORT_PATH) }, null, 2));
  if (!result.ok) process.exit(1);
}

main();
