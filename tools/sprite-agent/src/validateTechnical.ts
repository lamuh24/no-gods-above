import fs from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";
import { writeRetryPrompt } from "./buildPrompt.js";
import { detectSheetLayout, extractFrameBuffers, type SheetLayout } from "./sliceSheet.js";
import { createVisualQaChecklist } from "./validateVisual.js";
import {
  type AgentConfig,
  type DuplicateFrame,
  type FrameMeasurement,
  type ValidationIssue,
  type ValidationReport,
  characterRoot,
  clipConfigForStage,
  ensureDir,
  loadConfig,
  manualProviderConfig,
  pathExists,
  resolveUserPath,
  timestampId,
  toRepoRelative,
  validationMarkdown,
  writeReportBundle
} from "./report.js";

export interface ValidateOptions {
  character: string;
  clip: string;
  sheet: string;
  stage?: string;
}

export async function validateSpriteSheet(options: ValidateOptions): Promise<ValidationReport> {
  const config = await loadConfig();
  const characterId = options.character;
  const clip = clipConfigForStage(config, options.clip, options.stage);
  const issues: ValidationIssue[] = [];
  const copiedSheet = await copySheetIntoInbox(config, characterId, clip.clipId, options.sheet, options.stage);
  const sourceSheet = toRepoRelative(copiedSheet);
  let sheetBuffer: Buffer | null = null;
  let layout: SheetLayout | undefined;
  let frameMeasurements: FrameMeasurement[] = [];
  let duplicateFrames: DuplicateFrame[] = [];

  try {
    sheetBuffer = await fs.readFile(copiedSheet);
    const image = sharp(sheetBuffer, { failOn: "none" });
    const metadata = await image.metadata();

    if (!metadata.format || !["png", "webp"].includes(metadata.format)) {
      issues.push({
        severity: "fail",
        code: "INVALID_FORMAT",
        message: `Expected PNG or WEBP, got ${metadata.format ?? "unknown"}.`
      });
    }

    if (!metadata.width || !metadata.height) {
      issues.push({ severity: "fail", code: "INVALID_IMAGE", message: "Image metadata is missing dimensions." });
    } else {
      const alphaStats = await fullSheetAlphaStats(sheetBuffer, config);
      if (!alphaStats.hasTransparency) {
        issues.push({
          severity: "fail",
          code: "NO_ALPHA_TRANSPARENCY",
          message: "Image has no meaningful transparency."
        });
      }
      if (alphaStats.opaqueRatio >= config.validation.opaqueBackgroundRatio) {
        issues.push({
          severity: "fail",
          code: "OPAQUE_FULL_BACKGROUND",
          message: `Opaque pixel ratio ${alphaStats.opaqueRatio.toFixed(3)} suggests a full baked background.`
        });
      }

      const detected = detectSheetLayout(config, metadata.width, metadata.height, clip.frameCount);
      layout = detected.layout;
      issues.push(...detected.issues);
      if (layout) {
        const frames = await extractFrameBuffers(sheetBuffer, config, layout, Math.min(layout.frameCount, clip.frameCount));
        frameMeasurements = await Promise.all(
          frames.map((frame, index) => measureFrameBuffer(frame, config, index))
        );
        issues.push(...frameIssues(config, frameMeasurements));
        issues.push(...scaleDriftIssues(config, frameMeasurements));
        duplicateFrames = findDuplicateFrames(config, frameMeasurements);
        if (duplicateFrames.length > 0 && !allowsDuplicateFrameWarning(clip, duplicateFrames.length)) {
          issues.push({
            severity: "warn",
            code: "POSSIBLE_DUPLICATE_FRAMES",
            message: `${duplicateFrames.length} near-duplicate frame pair(s) detected. Held frames can be okay, but review the motion.`
          });
        }
      }
    }
  } catch (error) {
    issues.push({
      severity: "fail",
      code: "IMAGE_DECODE_FAILED",
      message: error instanceof Error ? error.message : String(error)
    });
  }

  const technicalStatus = issues.some((issue) => issue.severity === "fail")
    ? "fail"
    : issues.some((issue) => issue.severity === "warn")
      ? "warn"
      : "pass";
  const autoFixRecommended = issues.some((issue) =>
    ["OPAQUE_FULL_BACKGROUND", "NO_ALPHA_TRANSPARENCY", "BASELINE_DRIFT", "CENTER_DRIFT", "BODY_TOO_LARGE"].includes(issue.code)
  );
  const rejected = issues.some((issue) =>
    ["INVALID_FORMAT", "INVALID_IMAGE", "IMAGE_DECODE_FAILED", "DIMENSIONS_NOT_FRAME_MULTIPLE", "FRAME_COUNT_MISMATCH", "EMPTY_FRAME", "CROPPED_BOUNDS"].includes(issue.code)
  );
  const visual = technicalStatus === "fail" ? null : await createVisualQaChecklist(config, characterId, clip.clipId, copiedSheet);

  const report: ValidationReport = {
    schemaVersion: config.schemaVersion,
    tool: config.toolName,
    generatedAt: new Date().toISOString(),
    characterId,
    clipId: clip.clipId,
    sourceSheet,
    expected: { ...clip, sourceSheet },
    layout,
    overallStatus: rejected
      ? "rejected"
      : technicalStatus === "fail" && autoFixRecommended
        ? "needs_autofix"
        : visual
          ? "manual_review_required"
          : technicalStatus === "pass"
            ? "technical_pass"
            : "needs_autofix",
    technicalStatus,
    visualStatus: visual ? visual.status : "not_run",
    approvedForLiveRoster: false,
    issues,
    frameMeasurements,
    duplicateFrames,
    autoFixRecommended
  };

  if (report.overallStatus === "rejected") {
    const retryPath = await writeRetryPrompt(
      config,
      characterId,
      clip,
      issues.filter((issue) => issue.severity === "fail").map((issue) => `${issue.code}: ${issue.message}`)
    );
    report.retryPrompt = toRepoRelative(retryPath);
  }

  const stamp = timestampId();
  await writeReportBundle(
    config,
    characterId,
    `${stamp}_${clip.clipId}_validation_report`,
    report,
    validationMarkdown(report),
    "latest_validation_report"
  );

  return report;
}

export async function measureFrameBuffer(
  frameBuffer: Buffer,
  config: AgentConfig,
  frameIndex: number
): Promise<FrameMeasurement> {
  const { data, info } = await sharp(frameBuffer, { failOn: "none" })
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });
  const width = info.width;
  const height = info.height;
  const channels = info.channels;
  const threshold = config.validation.alphaOpaqueThreshold;
  let minX = width;
  let minY = height;
  let maxX = -1;
  let maxY = -1;
  let opaquePixels = 0;
  let topEdge = 0;
  let bottomEdge = 0;
  let leftEdge = 0;
  let rightEdge = 0;
  let topBandDarkOpaque = 0;
  let bottomBandDarkOpaque = 0;
  const bandHeight = Math.min(72, height);

  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      const offset = (y * width + x) * channels;
      const alpha = data[offset + 3] ?? 0;
      if (alpha <= threshold) {
        continue;
      }
      const r = data[offset] ?? 0;
      const g = data[offset + 1] ?? 0;
      const b = data[offset + 2] ?? 0;
      const dark = (r + g + b) / 3 < 54;
      opaquePixels += 1;
      minX = Math.min(minX, x);
      minY = Math.min(minY, y);
      maxX = Math.max(maxX, x);
      maxY = Math.max(maxY, y);
      if (y === 0) topEdge += 1;
      if (y === height - 1) bottomEdge += 1;
      if (x === 0) leftEdge += 1;
      if (x === width - 1) rightEdge += 1;
      if (dark && y < bandHeight) topBandDarkOpaque += 1;
      if (dark && y >= height - bandHeight) bottomBandDarkOpaque += 1;
    }
  }

  if (opaquePixels === 0) {
    return {
      frameIndex,
      empty: true,
      opaquePixels,
      edgeOpaqueRatio: { top: 0, right: 0, bottom: 0, left: 0 },
      averageHash: await averageHash(frameBuffer)
    };
  }

  const bbox = {
    x: minX,
    y: minY,
    width: maxX - minX + 1,
    height: maxY - minY + 1,
    right: maxX,
    bottom: maxY
  };
  const centerX = bbox.x + bbox.width / 2;
  const edgeOpaqueRatio = {
    top: topEdge / width,
    right: rightEdge / height,
    bottom: bottomEdge / width,
    left: leftEdge / height
  };
  const measurement: FrameMeasurement = {
    frameIndex,
    empty: false,
    opaquePixels,
    bbox,
    baselineDeltaPx: Math.round(bbox.bottom - config.sprite.baselineY),
    centerDeltaPx: Math.round(centerX - config.sprite.anchorX),
    edgeContact:
      bbox.x <= config.validation.cropMarginPx ||
      bbox.y <= config.validation.cropMarginPx ||
      bbox.right >= config.sprite.frameWidth - config.validation.cropMarginPx - 1 ||
      bbox.bottom >= config.sprite.frameHeight - config.validation.cropMarginPx - 1,
    edgeOpaqueRatio,
    averageHash: await averageHash(frameBuffer)
  };

  const detachedComponents = findDetachedComponents(data, width, height, channels, threshold);
  if (detachedComponents.length > 0) {
    measurement.detachedComponents = detachedComponents;
  }

  const bandPixels = width * bandHeight;
  if (topBandDarkOpaque / bandPixels > 0.18 || bottomBandDarkOpaque / bandPixels > 0.18) {
    measurement.textLikeDarkBand = true;
  }

  return measurement;
}

function frameIssues(config: AgentConfig, measurements: FrameMeasurement[]): ValidationIssue[] {
  const issues: ValidationIssue[] = [];
  for (const frame of measurements) {
    if (frame.empty || frame.opaquePixels < config.validation.minOpaquePixels) {
      issues.push({
        severity: "fail",
        code: "EMPTY_FRAME",
        frameIndex: frame.frameIndex,
        message: `Frame has ${frame.opaquePixels} opaque pixels; expected at least ${config.validation.minOpaquePixels}.`
      });
      continue;
    }
    const bbox = frame.bbox;
    if (!bbox) {
      continue;
    }
    if (frame.edgeContact) {
      issues.push({
        severity: "fail",
        code: "CROPPED_BOUNDS",
        frameIndex: frame.frameIndex,
        message: "Opaque bounds touch the frame edge or crop margin."
      });
    }
    if (bbox.height > config.sprite.safeBox.maxHeight || bbox.width > config.sprite.safeBox.maxWidth) {
      issues.push({
        severity: "warn",
        code: "BODY_TOO_LARGE",
        frameIndex: frame.frameIndex,
        message: `Body bbox ${bbox.width}x${bbox.height} exceeds safe box ${config.sprite.safeBox.maxWidth}x${config.sprite.safeBox.maxHeight}.`
      });
    }
    if (bbox.height < config.sprite.safeBox.minHeight) {
      issues.push({
        severity: "warn",
        code: "BODY_TOO_SMALL",
        frameIndex: frame.frameIndex,
        message: `Body height ${bbox.height}px is below configured minimum ${config.sprite.safeBox.minHeight}px.`
      });
    }
    if (Math.abs(frame.baselineDeltaPx ?? 0) > config.validation.maxBaselineDriftPx) {
      issues.push({
        severity: "warn",
        code: "BASELINE_DRIFT",
        frameIndex: frame.frameIndex,
        message: `Frame baseline delta is ${frame.baselineDeltaPx}px; max is ${config.validation.maxBaselineDriftPx}px.`
      });
    }
    if (Math.abs(frame.centerDeltaPx ?? 0) > config.validation.maxCenterDriftPx) {
      issues.push({
        severity: "warn",
        code: "CENTER_DRIFT",
        frameIndex: frame.frameIndex,
        message: `Frame center delta is ${frame.centerDeltaPx}px; max is ${config.validation.maxCenterDriftPx}px.`
      });
    }
    const edge = frame.edgeOpaqueRatio;
    if (edge && Object.values(edge).some((ratio) => ratio >= config.validation.edgeBorderOpaqueRatio)) {
      issues.push({
        severity: "fail",
        code: "FRAME_BORDER_DETECTED",
        frameIndex: frame.frameIndex,
        message: "Opaque pixels cover most of a frame edge, which looks like a border or baked frame line."
      });
    }
    if (frame.textLikeDarkBand) {
      issues.push({
        severity: "warn",
        code: "TEXT_LIKE_DARK_BAND",
        frameIndex: frame.frameIndex,
        message: "Large dark opaque band near top/bottom may indicate labels or generated text; visually review."
      });
    }
    if (frame.detachedComponents?.length) {
      const largestDetached = frame.detachedComponents[0];
      issues.push({
        severity: "warn",
        code: "DETACHED_COMPONENTS",
        frameIndex: frame.frameIndex,
        message: `${frame.detachedComponents.length} large detached opaque component(s) detected outside the main silhouette; largest is ${largestDetached?.pixels ?? 0} px. This often indicates sliced body parts or separated generated artifacts.`
      });
    }
  }
  return issues;
}

function scaleDriftIssues(config: AgentConfig, measurements: FrameMeasurement[]): ValidationIssue[] {
  const heights = measurements
    .map((measurement) => measurement.bbox?.height)
    .filter((height): height is number => typeof height === "number");
  if (heights.length < 2) {
    return [];
  }
  const min = Math.min(...heights);
  const max = Math.max(...heights);
  const drift = max - min;
  if (drift > config.validation.maxScaleDriftPx) {
    return [
      {
        severity: "warn",
        code: "SCALE_DRIFT",
        message: `Frame height drift is ${drift}px (${min}px..${max}px); max is ${config.validation.maxScaleDriftPx}px.`
      }
    ];
  }
  return [];
}

function findDuplicateFrames(config: AgentConfig, measurements: FrameMeasurement[]): DuplicateFrame[] {
  const duplicates: DuplicateFrame[] = [];
  for (let a = 0; a < measurements.length; a += 1) {
    for (let b = a + 1; b < measurements.length; b += 1) {
      const hashA = measurements[a]?.averageHash;
      const hashB = measurements[b]?.averageHash;
      if (!hashA || !hashB) {
        continue;
      }
      const distance = hammingDistance(hashA, hashB);
      if (distance <= config.validation.duplicateHashMaxDistance) {
        duplicates.push({ frameA: a, frameB: b, hammingDistance: distance });
      }
    }
  }
  return duplicates;
}

function allowsDuplicateFrameWarning(clip: ReturnType<typeof clipConfigForStage>, duplicatePairCount: number): boolean {
  if (clip.category === "special" && !clip.loop) {
    return duplicatePairCount <= 1;
  }
  if (clip.category === "normal" && !clip.loop) {
    return duplicatePairCount <= 1;
  }
  if (clip.clipId === "block") {
    return duplicatePairCount <= 1;
  }
  if (clip.category !== "movement" || !clip.loop) {
    return false;
  }
  if (["walk_forward", "walk_backward"].includes(clip.clipId)) {
    return duplicatePairCount <= 1;
  }
  if (!["idle", "crouch"].includes(clip.clipId)) {
    return false;
  }
  const totalPairs = (clip.frameCount * (clip.frameCount - 1)) / 2;
  return duplicatePairCount < totalPairs;
}

async function fullSheetAlphaStats(sheetBuffer: Buffer, config: AgentConfig): Promise<{ hasTransparency: boolean; opaqueRatio: number }> {
  const { data, info } = await sharp(sheetBuffer, { failOn: "none" })
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });
  const totalPixels = info.width * info.height;
  let opaquePixels = 0;
  let transparentPixels = 0;
  for (let offset = 3; offset < data.length; offset += info.channels) {
    const alpha = data[offset] ?? 0;
    if (alpha <= config.validation.alphaOpaqueThreshold) {
      transparentPixels += 1;
    } else {
      opaquePixels += 1;
    }
  }
  return { hasTransparency: transparentPixels > 0, opaqueRatio: opaquePixels / totalPixels };
}

async function averageHash(frameBuffer: Buffer): Promise<string> {
  const { data } = await sharp(frameBuffer, { failOn: "none" })
    .ensureAlpha()
    .flatten({ background: { r: 255, g: 255, b: 255 } })
    .grayscale()
    .resize(16, 16, { fit: "fill" })
    .raw()
    .toBuffer({ resolveWithObject: true });
  const values = Array.from(data);
  const average = values.reduce((sum, value) => sum + value, 0) / values.length;
  return values.map((value) => (value >= average ? "1" : "0")).join("");
}

function findDetachedComponents(
  data: Buffer,
  width: number,
  height: number,
  channels: number,
  alphaThreshold: number
): NonNullable<FrameMeasurement["detachedComponents"]> {
  const visited = new Uint8Array(width * height);
  const components: NonNullable<FrameMeasurement["detachedComponents"]> = [];
  const stack: number[] = [];

  for (let start = 0; start < width * height; start += 1) {
    if (visited[start]) {
      continue;
    }
    const alpha = data[start * channels + 3] ?? 0;
    if (alpha <= alphaThreshold) {
      visited[start] = 1;
      continue;
    }

    let pixels = 0;
    let minX = width;
    let minY = height;
    let maxX = -1;
    let maxY = -1;
    stack.push(start);
    visited[start] = 1;

    while (stack.length) {
      const current = stack.pop();
      if (current === undefined) {
        continue;
      }
      const x = current % width;
      const y = Math.floor(current / width);
      pixels += 1;
      minX = Math.min(minX, x);
      minY = Math.min(minY, y);
      maxX = Math.max(maxX, x);
      maxY = Math.max(maxY, y);

      const neighbors = [
        x > 0 ? current - 1 : -1,
        x < width - 1 ? current + 1 : -1,
        y > 0 ? current - width : -1,
        y < height - 1 ? current + width : -1
      ];
      for (const neighbor of neighbors) {
        if (neighbor < 0 || visited[neighbor]) {
          continue;
        }
        const neighborAlpha = data[neighbor * channels + 3] ?? 0;
        if (neighborAlpha <= alphaThreshold) {
          visited[neighbor] = 1;
          continue;
        }
        visited[neighbor] = 1;
        stack.push(neighbor);
      }
    }

    components.push({
      pixels,
      bbox: {
        x: minX,
        y: minY,
        width: maxX - minX + 1,
        height: maxY - minY + 1,
        right: maxX,
        bottom: maxY
      }
    });
  }

  components.sort((a, b) => b.pixels - a.pixels);
  return components
    .slice(1)
    .filter((component) =>
      component.pixels >= 500 &&
      component.bbox.width >= 18 &&
      component.bbox.height >= 18
    );
}

function hammingDistance(a: string, b: string): number {
  const length = Math.min(a.length, b.length);
  let distance = Math.abs(a.length - b.length);
  for (let index = 0; index < length; index += 1) {
    if (a[index] !== b[index]) {
      distance += 1;
    }
  }
  return distance;
}

async function copySheetIntoInbox(
  config: AgentConfig,
  characterId: string,
  clipId: string,
  sheetPath: string,
  stage?: string
): Promise<string> {
  const source = resolveUserPath(sheetPath);
  if (!(await pathExists(source))) {
    throw new Error(`Sheet does not exist: ${source}`);
  }
  const root = characterRoot(config, characterId);
  const relative = path.relative(root, source);
  if (!relative.startsWith("..") && !path.isAbsolute(relative)) {
    return source;
  }
  const manual = manualProviderConfig(config, stage);
  const versionDir = path.join(root, manual.generatedInbox, clipId, `v${timestampId()}`);
  await ensureDir(versionDir);
  const dest = path.join(versionDir, path.basename(source));
  await fs.copyFile(source, dest);
  return dest;
}
