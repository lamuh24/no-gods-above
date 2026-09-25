import { execFile } from "node:child_process";
import path from "node:path";
import { promisify } from "node:util";
import sharp from "sharp";
import { exportPreviewManifest, type SpriteManifest } from "./exportManifest.js";
import { extractFrameBuffers } from "./sliceSheet.js";
import { measureFrameBuffer } from "./validateTechnical.js";
import {
  characterRoot,
  ensureDir,
  gameRoot,
  loadConfig,
  manifestPathForStage,
  pathExists,
  readJson,
  repoRoot,
  timestampId,
  toRepoRelative,
  writeJson,
  writeReportBundle,
  writeText
} from "./report.js";

const execFileAsync = promisify(execFile);

export interface GameSmokeOptions {
  character: string;
  stage?: string;
}

export interface GameSmokeReport {
  schemaVersion: string;
  tool: string;
  generatedAt: string;
  characterId: string;
  stage?: string;
  manifestPath: string;
  gameSyntaxCheck: {
    checked: boolean;
    passed: boolean;
    message: string;
  };
  manifestLoads: boolean;
  clipFramesAdvance: boolean;
  baselineStable: boolean;
  harnessPath: string;
  screenshots: {
    attempted: boolean;
    captured: boolean;
    reason: string;
  };
  issues: string[];
}

export async function runGameSmokeTest(options: GameSmokeOptions): Promise<GameSmokeReport> {
  const config = await loadConfig();
  const manifestPath = manifestPathForStage(config, options.character, options.stage);
  if (!(await pathExists(manifestPath))) {
    await exportPreviewManifest({ character: options.character, stage: options.stage });
  }
  const manifest = await readJson<SpriteManifest>(manifestPath);
  const issues: string[] = [];
  const gameSyntaxCheck = await checkGameSyntax(config);
  if (!gameSyntaxCheck.passed) {
    issues.push(gameSyntaxCheck.message);
  }

  let clipFramesAdvance = true;
  let baselineStable = true;
  for (const clip of manifest.clips) {
    if (!clip.normalizedSheet) {
      issues.push(`${clip.clipId}: missing normalizedSheet`);
      clipFramesAdvance = false;
      baselineStable = false;
      continue;
    }
    const sheetPath = path.resolve(repoRoot(), clip.normalizedSheet);
    if (!(await pathExists(sheetPath))) {
      issues.push(`${clip.clipId}: normalized sheet not found at ${clip.normalizedSheet}`);
      clipFramesAdvance = false;
      baselineStable = false;
      continue;
    }
    const metadata = await sharp(sheetPath, { failOn: "none" }).metadata();
    const expectedWidth = clip.frameWidth * clip.frameCount;
    if (metadata.width !== expectedWidth || metadata.height !== clip.frameHeight) {
      issues.push(`${clip.clipId}: normalized sheet is ${metadata.width}x${metadata.height}, expected ${expectedWidth}x${clip.frameHeight}`);
      clipFramesAdvance = false;
      continue;
    }
    const sheetBuffer = await sharp(sheetPath).png().toBuffer();
    const frames = await extractFrameBuffers(
      sheetBuffer,
      config,
      { mode: "horizontal-strip", columns: clip.frameCount, rows: 1, frameCount: clip.frameCount },
      clip.frameCount
    );
    if (frames.length < 2) {
      clipFramesAdvance = false;
      issues.push(`${clip.clipId}: fewer than two frames available for advance check.`);
    }
    const measurements = await Promise.all(frames.map((frame, index) => measureFrameBuffer(frame, config, index)));
    const unstable = measurements.some(
      (measurement) => Math.abs(measurement.baselineDeltaPx ?? 0) > config.validation.maxBaselineDriftPx
    );
    if (unstable) {
      baselineStable = false;
      issues.push(`${clip.clipId}: baseline drift exceeds ${config.validation.maxBaselineDriftPx}px after normalization.`);
    }
  }

  const harnessPath = await writePreviewHarness(config, options.character, manifest);
  const report: GameSmokeReport = {
    schemaVersion: config.schemaVersion,
    tool: config.toolName,
    generatedAt: new Date().toISOString(),
    characterId: options.character,
    stage: options.stage,
    manifestPath: toRepoRelative(manifestPath),
    gameSyntaxCheck,
    manifestLoads: true,
    clipFramesAdvance,
    baselineStable,
    harnessPath: toRepoRelative(harnessPath),
    screenshots: {
      attempted: false,
      captured: false,
      reason: "No browser automation dependency is bundled with SpriteForge; open the generated harness manually or add a Playwright adapter later."
    },
    issues
  };

  await writeReportBundle(
    config,
    options.character,
    `${timestampId()}_game_smoke_report`,
    report,
    gameSmokeMarkdown(report),
    "latest_game_smoke_report"
  );
  return report;
}

async function checkGameSyntax(config: Awaited<ReturnType<typeof loadConfig>>): Promise<GameSmokeReport["gameSyntaxCheck"]> {
  const gamePath = path.join(gameRoot(config), "game.js");
  if (!(await pathExists(gamePath))) {
    return { checked: false, passed: false, message: `Missing game.js at ${gamePath}` };
  }
  try {
    await execFileAsync("node", ["--check", gamePath], { cwd: repoRoot(), windowsHide: true });
    return { checked: true, passed: true, message: "node --check NO_GODS_ABOVE/game.js passed." };
  } catch (error) {
    return {
      checked: true,
      passed: false,
      message: error instanceof Error ? error.message : String(error)
    };
  }
}

async function writePreviewHarness(
  config: Awaited<ReturnType<typeof loadConfig>>,
  characterId: string,
  manifest: SpriteManifest
): Promise<string> {
  const harnessPath = path.join(characterRoot(config, characterId), config.game.previewHarnessFile);
  await ensureDir(path.dirname(harnessPath));
  const harnessDir = path.dirname(harnessPath);
  const clips = manifest.clips.map((clip) => ({
    clipId: clip.clipId,
    frameCount: clip.frameCount,
    fps: clip.fps,
    frameWidth: clip.frameWidth,
    frameHeight: clip.frameHeight,
    baselineY: clip.baselineY,
    src: clip.normalizedSheet
      ? path.relative(harnessDir, path.resolve(repoRoot(), clip.normalizedSheet)).replace(/\\/g, "/")
      : ""
  }));
  const html = `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>SpriteForge Preview - ${characterId}</title>
  <style>
    body { margin: 0; font-family: system-ui, sans-serif; background: #101215; color: #f2f4f8; }
    main { max-width: 980px; margin: 0 auto; padding: 24px; }
    canvas { image-rendering: pixelated; background: repeating-conic-gradient(#29303a 0 25%, #20262f 0 50%) 50% / 28px 28px; border: 1px solid #3f4a59; }
    select { margin: 12px 0 16px; }
  </style>
</head>
<body>
<main>
  <h1>SpriteForge Preview: ${characterId}</h1>
  <select id="clip"></select>
  <br>
  <canvas id="canvas" width="${config.sprite.frameWidth}" height="${config.sprite.frameHeight}"></canvas>
</main>
<script>
const clips = ${JSON.stringify(clips, null, 2)};
const select = document.getElementById("clip");
const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");
let current = clips[0];
let image = new Image();
let started = performance.now();

for (const clip of clips) {
  const option = document.createElement("option");
  option.value = clip.clipId;
  option.textContent = clip.clipId;
  select.appendChild(option);
}

function loadClip(clip) {
  current = clip;
  image = new Image();
  image.src = clip.src;
  started = performance.now();
}

select.addEventListener("change", () => {
  loadClip(clips.find((clip) => clip.clipId === select.value) || clips[0]);
});

function draw(now) {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  if (current && image.complete && image.naturalWidth > 0) {
    const frame = Math.floor(((now - started) / 1000) * current.fps) % current.frameCount;
    ctx.drawImage(image, frame * current.frameWidth, 0, current.frameWidth, current.frameHeight, 0, 0, current.frameWidth, current.frameHeight);
    ctx.strokeStyle = "#75f0ff";
    ctx.beginPath();
    ctx.moveTo(0, current.baselineY + 0.5);
    ctx.lineTo(canvas.width, current.baselineY + 0.5);
    ctx.stroke();
  }
  requestAnimationFrame(draw);
}

if (clips.length) loadClip(clips[0]);
requestAnimationFrame(draw);
</script>
</body>
</html>`;
  await writeText(harnessPath, html);
  return harnessPath;
}

function gameSmokeMarkdown(report: GameSmokeReport): string {
  return `# SpriteForge Game Smoke Report

Character: \`${report.characterId}\`
Stage: \`${report.stage ?? "all-normalized"}\`
Generated: ${report.generatedAt}
Manifest: \`${report.manifestPath}\`
Harness: \`${report.harnessPath}\`

## Checks

- Game syntax check: ${report.gameSyntaxCheck.passed ? "pass" : "fail"}
- Manifest loads: ${report.manifestLoads ? "pass" : "fail"}
- Clip frames advance: ${report.clipFramesAdvance ? "pass" : "fail"}
- Baseline stable: ${report.baselineStable ? "pass" : "fail"}
- Screenshot capture: skipped (${report.screenshots.reason})

## Issues

${report.issues.map((issue) => `- ${issue}`).join("\n") || "- None."}
`;
}
