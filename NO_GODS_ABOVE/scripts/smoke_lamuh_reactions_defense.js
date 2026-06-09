#!/usr/bin/env node
/* Focused static smoke for LAMUH Reactions + Defense atlas integration. */

const fs = require("fs");
const path = require("path");

const ROOT = path.resolve(__dirname, "..");
const GAME_PATH = path.join(ROOT, "game.js");
const ATLAS_PATH = path.join(ROOT, "assets", "characters", "lamuh", "lamuh_sheet_reactions_defense_redesign_atlas.png");
const REPORT_PATH = path.join(ROOT, "assets", "characters", "lamuh", "lamuh_sheet_reactions_defense_redesign_report.json");
const SMOKE_REPORT_PATH = path.join(ROOT, "assets", "characters", "lamuh", "lamuh_reactions_defense_smoke_report.json");

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
      goldCyanAccentsPreserved: report.gold_cyan_accents_preserved,
      bodyScale: report.body_scale,
      row5FrameRanges: report.row5_frame_ranges,
      repairedSlots: report.repaired_slots,
    },
    code: {
      assetPath: has(game, "lamuhReactionsDefenseRedesign: LAMUH_RUNTIME_ENABLED ? \"assets/characters/lamuh/lamuh_sheet_reactions_defense_redesign_atlas.png"),
      sheetMeta: has(game, "lamuhReactionsDefenseRedesign: { cols: 8, rows: 6, cellSize: 448, baselineY: 382, scale: 0.82"),
      profileSheetKey: has(game, "reactionsDefenseRedesign: \"lamuhReactionsDefenseRedesign\""),
      frameSplitHelper: has(game, "function getLamuhReactionDefenseFrameOverride") &&
        has(game, "return Math.min(3, fallbackFrame % 4);") &&
        has(game, "return 4 + (Math.floor(state.time * 8) % 2);") &&
        has(game, "return 6 + (Math.floor(state.time * 8) % 2);"),
      frameSplitActive: has(game, "frame = getLamuhReactionDefenseFrameOverride(f, animKey, entry[0], row, frameCount, frame);"),
      oldAtlasesRemainFallback: has(game, "lamuhFinalDefense: LAMUH_RUNTIME_ENABLED ? \"assets/sprites/lamuh_final/lamuh_sheet_6_defense_hit_reactions_atlas.png") &&
        has(game, "lamuhFinalEndStates: LAMUH_RUNTIME_ENABLED ? \"assets/sprites/lamuh_final/lamuh_sheet_7_knockdown_recovery_flavor_atlas.png"),
      aliases: {},
    },
  };

  const aliasRows = {
    damaged: "hitLight",
    lamuh_hit_light: "hitLight",
    hit_light: "hitLight",
    light_hitstun: "hitLight",
    medium_hitstun: "hitHeavy",
    lamuh_hit_heavy: "hitHeavy",
    hit_heavy: "hitHeavy",
    heavy_hitstun: "hitHeavy",
    launch_hitstun: "launchHit",
    lamuh_launch_hit: "launchHit",
    lamuh_air_hit: "launchHit",
    launch_hit: "launchHit",
    air_hitstun: "launchHit",
    air_block: "launchHit",
    knockback: "hardKnockback",
    lamuh_hard_knockback: "hardKnockback",
    lamuh_wall_bounce: "hardKnockback",
    wall_bounce: "hardKnockback",
    knockdown_fall: "knockdownDown",
    lamuh_knockdown: "knockdownDown",
    lamuh_down: "knockdownDown",
    knockdown: "knockdownDown",
    grounded: "knockdownDown",
    downed: "knockdownDown",
    get_up: "getupBlock",
    lamuh_getup: "getupBlock",
    recovery: "getupBlock",
    recovery_get_up: "getupBlock",
    block: "getupBlock",
    guard_idle: "getupBlock",
    stand_block: "getupBlock",
    lamuh_block_high: "getupBlock",
    crouch_block: "getupBlock",
    lamuh_block_low: "getupBlock",
  };
  for (const [alias, target] of Object.entries(aliasRows)) {
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
    result.normalization.goldCyanAccentsPreserved &&
    result.normalization.bodyScale?.passes === true &&
    result.normalization.row5FrameRanges?.lamuh_getup?.[0] === 0 &&
    result.normalization.row5FrameRanges?.lamuh_getup?.[1] === 3 &&
    result.normalization.row5FrameRanges?.lamuh_block_high?.[0] === 4 &&
    result.normalization.row5FrameRanges?.lamuh_block_high?.[1] === 5 &&
    result.normalization.row5FrameRanges?.lamuh_block_low?.[0] === 6 &&
    result.normalization.row5FrameRanges?.lamuh_block_low?.[1] === 7 &&
    Object.values(result.code).filter((value) => typeof value === "boolean").every(Boolean) &&
    Object.values(result.code.aliases).every(Boolean);

  fs.writeFileSync(SMOKE_REPORT_PATH, JSON.stringify(result, null, 2));
  console.log(JSON.stringify({ ok: result.ok, report: path.relative(ROOT, SMOKE_REPORT_PATH) }, null, 2));
  if (!result.ok) process.exit(1);
}

main();
