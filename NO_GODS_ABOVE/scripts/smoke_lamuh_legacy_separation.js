const fs = require("fs");
const path = require("path");

const root = path.resolve(__dirname, "..");
const gamePath = path.join(root, "game.js");
const htmlPath = path.join(root, "index.html");
const cssPath = path.join(root, "style.css");
const portraitPath = path.join(root, "assets", "sprites", "portraits", "lamuh_legacy_select.png");
const reportPath = path.join(root, "assets", "characters", "lamuh", "lamuh_legacy_separation_smoke_report.json");

function read(file) {
  return fs.readFileSync(file, "utf8");
}

function findBalancedBlock(source, marker) {
  const markerIndex = source.indexOf(marker);
  if (markerIndex < 0) {
    throw new Error(`Marker not found: ${marker}`);
  }
  const openIndex = source.indexOf("{", markerIndex);
  if (openIndex < 0) {
    throw new Error(`Opening brace not found after marker: ${marker}`);
  }

  let depth = 0;
  let quote = null;
  let inLineComment = false;
  let inBlockComment = false;
  let escaped = false;

  for (let i = openIndex; i < source.length; i += 1) {
    const ch = source[i];
    const next = source[i + 1];

    if (inLineComment) {
      if (ch === "\n") inLineComment = false;
      continue;
    }
    if (inBlockComment) {
      if (ch === "*" && next === "/") {
        inBlockComment = false;
        i += 1;
      }
      continue;
    }
    if (quote) {
      if (escaped) {
        escaped = false;
      } else if (ch === "\\") {
        escaped = true;
      } else if (ch === quote) {
        quote = null;
      }
      continue;
    }
    if (ch === "/" && next === "/") {
      inLineComment = true;
      i += 1;
      continue;
    }
    if (ch === "/" && next === "*") {
      inBlockComment = true;
      i += 1;
      continue;
    }
    if (ch === "\"" || ch === "'" || ch === "`") {
      quote = ch;
      continue;
    }
    if (ch === "{") depth += 1;
    if (ch === "}") {
      depth -= 1;
      if (depth === 0) {
        return source.slice(openIndex, i + 1);
      }
    }
  }

  throw new Error(`Closing brace not found for marker: ${marker}`);
}

function assertCheck(checks, name, passed, details = "") {
  checks.push({ name, passed: Boolean(passed), details });
}

function parsePngDimensions(file) {
  const buffer = fs.readFileSync(file);
  if (buffer.length < 24 || buffer.toString("ascii", 1, 4) !== "PNG") {
    throw new Error(`${file} is not a PNG`);
  }
  return {
    width: buffer.readUInt32BE(16),
    height: buffer.readUInt32BE(20)
  };
}

const game = read(gamePath);
const html = read(htmlPath);
const css = read(cssPath);
const checks = [];

const lamuhProfile = findBalancedBlock(game, "lamuh: {");
const legacyProfile = findBalancedBlock(game, "lamuh_legacy: {");
const lamuhBuilder = findBalancedBlock(game, "function buildLamuhFinalPlayerAnimations");
const lamuhEnemyBuilder = findBalancedBlock(game, "function buildLamuhFinalEnemyAnimations");
const legacyBuilder = findBalancedBlock(game, "function buildLamuhLegacyPlayerAnimations");
const legacyEnemyBuilder = findBalancedBlock(game, "function buildLamuhLegacyEnemyAnimations");
const chooseSpecialMove = findBalancedBlock(game, "function chooseSpecialMove");
const legacyChooser = findBalancedBlock(game, "function chooseLamuhLegacySpecialMove");

const oldProfileTokens = [
  "coreMovement",
  "airMovement",
  "groundNormals",
  "airNormals",
  "specials",
  "defense",
  "endStates",
  "crownBody",
  "lamuhFinal"
];
const oldBuilderTokens = [
  "sheets.coreMovement",
  "sheets.airMovement",
  "sheets.groundNormals",
  "sheets.airNormals",
  "sheets.specials",
  "sheets.defense",
  "sheets.endStates",
  "sheets.crownBody",
  "LAMUH_ASCENDED_BODY_ATLAS_ENABLED"
];
const redesignTokens = [
  "sheet1Redesign",
  "forwardSpecialsRedesign",
  "downUpSpecialsRedesign",
  "backNeutralSpecialsRedesign",
  "neutralSpecialsBodyVfxRedesign",
  "reactionsDefenseRedesign",
  "airCrouchJumpRedesign",
  "secondaryMovementDirectionalNormalsRedesign",
  "superAscendedGoldenLocs"
];
const advancedLamuhMoveKeys = [
  "neutral_light_special",
  "neutral_medium_special",
  "neutral_heavy_special",
  "forward_light_special",
  "forward_medium_special",
  "forward_heavy_special",
  "back_light_special",
  "back_medium_special",
  "back_heavy_special",
  "down_light_special",
  "down_medium_special",
  "down_heavy_special",
  "up_light_special",
  "up_medium_special",
  "up_heavy_special",
  "air_light_special",
  "air_medium_special",
  "air_heavy_special"
];

assertCheck(checks, "selectable ids include redesigned and legacy LAMUH", /const selectableCharacterIds = \[[^\]]*"lamuh"[^\]]*"lamuh_legacy"/.test(game));
assertCheck(checks, "LAMUH profile does not include old LAMUH sheet keys", !oldProfileTokens.some((token) => lamuhProfile.includes(token)), oldProfileTokens.filter((token) => lamuhProfile.includes(token)).join(", "));
assertCheck(checks, "LAMUH profile includes only redesigned sheet keys", redesignTokens.every((token) => lamuhProfile.includes(token)), redesignTokens.filter((token) => !lamuhProfile.includes(token)).join(", "));
assertCheck(checks, "LAMUH Legacy profile includes old LAMUH sheets", ["lamuhFinalCoreMovement", "lamuhFinalAirMovement", "lamuhFinalGroundNormals", "lamuhFinalAirNormals", "lamuhFinalSpecials", "lamuhFinalDefense", "lamuhFinalEndStates", "lamuhCrownBody"].every((token) => legacyProfile.includes(token)));
assertCheck(checks, "LAMUH Legacy profile does not include redesigned sheets", !redesignTokens.some((token) => legacyProfile.includes(token)), redesignTokens.filter((token) => legacyProfile.includes(token)).join(", "));
assertCheck(checks, "redesigned LAMUH player builder has no old sheet refs", !oldBuilderTokens.some((token) => lamuhBuilder.includes(token)), oldBuilderTokens.filter((token) => lamuhBuilder.includes(token)).join(", "));
assertCheck(checks, "redesigned LAMUH enemy builder mirrors player builder", lamuhEnemyBuilder.includes("buildLamuhFinalPlayerAnimations(sheets)") && !oldBuilderTokens.some((token) => lamuhEnemyBuilder.includes(token)));
assertCheck(checks, "redesigned LAMUH builder maps forward heavy to Sheet 2 row 2", /const mirrorPierce = sheets\.forwardSpecialsRedesign \? \[sheets\.forwardSpecialsRedesign, 2\]/.test(lamuhBuilder) && /forward_heavy_special:\s*mirrorPierce/.test(lamuhBuilder));
assertCheck(checks, "redesigned LAMUH builder maps neutral heavy to neutral body/VFX row 2", /const crownBeam = sheets\.neutralSpecialsBodyVfxRedesign\s*\?\s*\[sheets\.neutralSpecialsBodyVfxRedesign, 2\]/.test(lamuhBuilder) && /neutral_heavy_special:\s*crownBeam/.test(lamuhBuilder));
assertCheck(checks, "legacy LAMUH builder uses old sheet refs", oldBuilderTokens.slice(0, 8).every((token) => legacyBuilder.includes(token)), oldBuilderTokens.slice(0, 8).filter((token) => !legacyBuilder.includes(token)).join(", "));
assertCheck(checks, "legacy LAMUH builder does not use redesigned sheets", !redesignTokens.some((token) => legacyBuilder.includes(token)), redesignTokens.filter((token) => legacyBuilder.includes(token)).join(", "));
assertCheck(checks, "legacy LAMUH enemy builder mirrors legacy player builder", legacyEnemyBuilder.includes("buildLamuhLegacyPlayerAnimations(sheets)"));
assertCheck(checks, "legacy special chooser is routed before redesigned LAMUH advanced routing", chooseSpecialMove.indexOf("lamuh_legacy") >= 0 && chooseSpecialMove.indexOf("lamuh_legacy") < chooseSpecialMove.indexOf("p.profile?.id !== \"lamuh\""));
assertCheck(checks, "legacy chooser keeps simple directional specials", ["neutral_special", "forward_special", "back_special", "down_special", "up_special", "air_special"].every((token) => legacyChooser.includes(token)));
assertCheck(checks, "legacy allowed moves exclude advanced 15-special keys", advancedLamuhMoveKeys.every((token) => !findBalancedBlock(game, "const LAMUH_LEGACY_ALLOWED_PLAYER_MOVES").includes(token)));
assertCheck(checks, "select screen includes LAMUH Legacy card", html.includes('data-character="lamuh_legacy"') && html.includes("lamuh_legacy_select.png"));
assertCheck(checks, "select footer advertises 1-8 shortcuts", /<kbd>1<\/kbd>\s*-\s*<kbd>8<\/kbd>/.test(html));
assertCheck(checks, "keyboard shortcut 7 selects LAMUH Legacy", game.includes('Digit7: "lamuh_legacy"') && game.includes('Numpad7: "lamuh_legacy"'));
assertCheck(checks, "select grid supports eight desktop cards", /\.select-grid\s*\{[\s\S]*?grid-template-columns:\s*repeat\(8,\s*minmax\(0,\s*1fr\)\)/.test(css));
assertCheck(checks, "LAMUH Legacy portrait exists", fs.existsSync(portraitPath), portraitPath);

let portraitDimensions = null;
if (fs.existsSync(portraitPath)) {
  portraitDimensions = parsePngDimensions(portraitPath);
  assertCheck(checks, "LAMUH Legacy portrait dimensions are 460x520", portraitDimensions.width === 460 && portraitDimensions.height === 520, JSON.stringify(portraitDimensions));
}

const passed = checks.every((check) => check.passed);
const report = {
  passed,
  generatedAt: new Date().toISOString(),
  files: {
    game: path.relative(root, gamePath),
    html: path.relative(root, htmlPath),
    css: path.relative(root, cssPath),
    portrait: path.relative(root, portraitPath),
    report: path.relative(root, reportPath)
  },
  portraitDimensions,
  checks
};

fs.mkdirSync(path.dirname(reportPath), { recursive: true });
fs.writeFileSync(reportPath, `${JSON.stringify(report, null, 2)}\n`);

if (!passed) {
  console.error(JSON.stringify(report, null, 2));
  process.exit(1);
}

console.log(`LAMUH legacy separation smoke passed: ${checks.length} checks`);
console.log(`Report: ${path.relative(process.cwd(), reportPath)}`);
