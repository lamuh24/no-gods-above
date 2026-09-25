import fs from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";
import { removeSimpleSolidBackground, writeAutoFixArtifacts } from "./autoFix.js";
import { detectSheetLayout, extractFrameBuffers } from "./sliceSheet.js";
import { measureFrameBuffer } from "./validateTechnical.js";
import {
  type AnimationClip,
  type FrameMeasurement,
  clipConfigForStage,
  ensureDir,
  latestSheetInInbox,
  loadConfig,
  normalizedRootForStage,
  resolveUserPath,
  timestampId,
  toRepoRelative,
  validationMarkdown,
  writeJson,
  writeReportBundle,
  writeText
} from "./report.js";

export interface NormalizeOptions {
  character: string;
  clip: string;
  sheet?: string;
  stage?: string;
}

export interface NormalizationReport {
  schemaVersion: string;
  tool: string;
  generatedAt: string;
  characterId: string;
  clipId: string;
  sourceSheet: string;
  normalizedSheet: string;
  framesDir: string;
  frameCount: number;
  autoFixApplied: boolean;
  measurementsBefore: FrameMeasurement[];
  measurementsAfter: FrameMeasurement[];
  notes: string[];
}

export async function normalizeClip(options: NormalizeOptions): Promise<NormalizationReport> {
  const config = await loadConfig();
  const characterId = options.character;
  const clip = clipConfigForStage(config, options.clip, options.stage);
  const selectedSheet = options.sheet
    ? resolveUserPath(options.sheet)
    : await latestSheetInInbox(config, characterId, clip.clipId, options.stage);
  if (!selectedSheet) {
    throw new Error(`No sheet found for ${characterId}/${clip.clipId}. Provide --sheet or drop a PNG/WEBP into generated/inbox/${clip.clipId}.`);
  }

  const sourceBuffer = await fs.readFile(selectedSheet);
  const autoFix = await removeSimpleSolidBackground(sourceBuffer, config);
  const workingBuffer = autoFix.buffer;
  const metadata = await sharp(workingBuffer, { failOn: "none" }).metadata();
  if (!metadata.width || !metadata.height) {
    throw new Error("Could not read sheet dimensions during normalization.");
  }
  const detected = detectSheetLayout(config, metadata.width, metadata.height, clip.frameCount);
  if (!detected.layout) {
    throw new Error(detected.issues.map((issue) => issue.message).join("; "));
  }
  const hardLayoutIssues = detected.issues.filter((issue) => issue.severity === "fail");
  if (hardLayoutIssues.length > 0) {
    throw new Error(hardLayoutIssues.map((issue) => issue.message).join("; "));
  }

  const version = `v${timestampId()}`;
  const outputDir = path.join(normalizedRootForStage(config, characterId, options.stage), clip.clipId, version);
  const framesDir = path.join(outputDir, "frames");
  const autoFixDir = path.join(outputDir, "autofix");
  await ensureDir(framesDir);

  if (autoFix.applied) {
    await writeAutoFixArtifacts(autoFixDir, selectedSheet, workingBuffer, autoFix);
  }

  const frameBuffers = await extractFrameBuffers(workingBuffer, config, detected.layout, clip.frameCount);
  const measurementsBefore = await Promise.all(
    frameBuffers.map((buffer, index) => measureFrameBuffer(buffer, config, index))
  );
  const normalizedFrames: Buffer[] = [];
  const measurementsAfter: FrameMeasurement[] = [];

  for (let index = 0; index < frameBuffers.length; index += 1) {
    const sourceFrame = frameBuffers[index];
    if (!sourceFrame) {
      continue;
    }
    const normalized = await normalizeSingleFrame(sourceFrame, config, measurementsBefore[index], index);
    normalizedFrames.push(normalized);
    const framePath = path.join(framesDir, `frame_${String(index).padStart(3, "0")}.png`);
    await fs.writeFile(framePath, normalized);
    measurementsAfter.push(await measureFrameBuffer(normalized, config, index));
  }

  const normalizedSheetPath = path.join(outputDir, `${characterId}_${clip.clipId}_normalized_strip.png`);
  await writeStrip(normalizedFrames, config.sprite.frameWidth, config.sprite.frameHeight, normalizedSheetPath);

  const animationClip: AnimationClip = {
    ...clip,
    sourceSheet: toRepoRelative(selectedSheet),
    normalizedSheet: toRepoRelative(normalizedSheetPath),
    validationStatus: "manual_review_required"
  };
  await writeJson(path.join(outputDir, "animation_clip.json"), animationClip);

  const report: NormalizationReport = {
    schemaVersion: config.schemaVersion,
    tool: config.toolName,
    generatedAt: new Date().toISOString(),
    characterId,
    clipId: clip.clipId,
    sourceSheet: toRepoRelative(selectedSheet),
    normalizedSheet: toRepoRelative(normalizedSheetPath),
    framesDir: toRepoRelative(framesDir),
    frameCount: normalizedFrames.length,
    autoFixApplied: autoFix.applied,
    measurementsBefore,
    measurementsAfter,
    notes: [
      "Normalized output is preview-only and not wired into the live roster.",
      ...autoFix.notes
    ]
  };

  await writeJson(path.join(outputDir, "normalization_report.json"), report);
  await writeText(path.join(outputDir, "normalization_report.md"), normalizationMarkdown(report));
  await writeReportBundle(
    config,
    characterId,
    `${timestampId()}_${clip.clipId}_normalization_report`,
    report,
    normalizationMarkdown(report),
    "latest_normalization_report"
  );

  return report;
}

async function normalizeSingleFrame(
  frameBuffer: Buffer,
  config: Awaited<ReturnType<typeof loadConfig>>,
  measurement: FrameMeasurement | undefined,
  frameIndex: number
): Promise<Buffer> {
  if (!measurement?.bbox || measurement.empty) {
    throw new Error(`Cannot normalize empty frame ${frameIndex}.`);
  }
  const bbox = measurement.bbox;
  const scaleToFit = Math.min(
    config.sprite.safeBox.maxWidth / bbox.width,
    config.sprite.safeBox.maxHeight / bbox.height
  );
  const scale = config.sprite.allowScaleUp ? scaleToFit : Math.min(1, scaleToFit);
  const resizedWidth = Math.max(1, Math.round(bbox.width * scale));
  const resizedHeight = Math.max(1, Math.round(bbox.height * scale));
  const cropped = await sharp(frameBuffer)
    .extract({ left: bbox.x, top: bbox.y, width: bbox.width, height: bbox.height })
    .resize({ width: resizedWidth, height: resizedHeight, kernel: sharp.kernel.nearest })
    .png()
    .toBuffer();
  const left = clamp(
    Math.round(config.sprite.anchorX - resizedWidth / 2),
    0,
    config.sprite.frameWidth - resizedWidth
  );
  const top = clamp(
    Math.round(config.sprite.baselineY - resizedHeight),
    0,
    config.sprite.frameHeight - resizedHeight
  );
  return sharp({
    create: {
      width: config.sprite.frameWidth,
      height: config.sprite.frameHeight,
      channels: 4,
      background: { r: 0, g: 0, b: 0, alpha: 0 }
    }
  })
    .composite([{ input: cropped, left, top }])
    .png()
    .toBuffer();
}

async function writeStrip(frames: Buffer[], frameWidth: number, frameHeight: number, outputPath: string): Promise<void> {
  await ensureDir(path.dirname(outputPath));
  const composites = frames.map((frame, index) => ({
    input: frame,
    left: index * frameWidth,
    top: 0
  }));
  await sharp({
    create: {
      width: frameWidth * frames.length,
      height: frameHeight,
      channels: 4,
      background: { r: 0, g: 0, b: 0, alpha: 0 }
    }
  })
    .composite(composites)
    .png()
    .toFile(outputPath);
}

function normalizationMarkdown(report: NormalizationReport): string {
  const before = report.measurementsBefore
    .map((frame) => `| ${frame.frameIndex} | ${frame.bbox?.width ?? 0}x${frame.bbox?.height ?? 0} | ${frame.baselineDeltaPx ?? ""} | ${frame.centerDeltaPx ?? ""} |`)
    .join("\n");
  const after = report.measurementsAfter
    .map((frame) => `| ${frame.frameIndex} | ${frame.bbox?.width ?? 0}x${frame.bbox?.height ?? 0} | ${frame.baselineDeltaPx ?? ""} | ${frame.centerDeltaPx ?? ""} |`)
    .join("\n");
  return `# SpriteForge Normalization Report

Character: \`${report.characterId}\`
Clip: \`${report.clipId}\`
Source: \`${report.sourceSheet}\`
Normalized strip: \`${report.normalizedSheet}\`
Frames: ${report.frameCount}
Auto-fix applied: **${report.autoFixApplied ? "yes" : "no"}**

## Before

| Frame | BBox | Baseline Delta | Center Delta |
| --- | --- | ---: | ---: |
${before}

## After

| Frame | BBox | Baseline Delta | Center Delta |
| --- | --- | ---: | ---: |
${after}

## Notes

${report.notes.map((note) => `- ${note}`).join("\n")}
`;
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}
