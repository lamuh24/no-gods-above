import fs from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";
import type { AgentConfig } from "./report.js";
import { ensureDir, timestampId, writeJson, writeText } from "./report.js";

export interface BackgroundFixResult {
  buffer: Buffer;
  applied: boolean;
  clearedPixels: number;
  notes: string[];
}

interface Rgba {
  r: number;
  g: number;
  b: number;
  a: number;
}

export async function removeSimpleSolidBackground(
  inputBuffer: Buffer,
  config: AgentConfig
): Promise<BackgroundFixResult> {
  const image = sharp(inputBuffer, { failOn: "none" }).ensureAlpha();
  const { data, info } = await image.raw().toBuffer({ resolveWithObject: true });
  const width = info.width;
  const height = info.height;
  const channels = info.channels;
  const notes: string[] = [];

  if (channels !== 4) {
    return { buffer: inputBuffer, applied: false, clearedPixels: 0, notes: ["Image could not be decoded as RGBA."] };
  }

  const corners = [
    pixelAt(data, width, channels, 0, 0),
    pixelAt(data, width, channels, width - 1, 0),
    pixelAt(data, width, channels, 0, height - 1),
    pixelAt(data, width, channels, width - 1, height - 1)
  ];

  if (corners.some((corner) => corner.a < config.validation.alphaOpaqueThreshold)) {
    return {
      buffer: inputBuffer,
      applied: false,
      clearedPixels: 0,
      notes: ["Corners already contain transparency; solid-background flood fill skipped."]
    };
  }

  const base = corners[0] ?? { r: 0, g: 0, b: 0, a: 255 };
  const consistent = corners.every(
    (corner) => colorDistance(base, corner) <= config.validation.solidBackgroundColorDistance
  );
  if (!consistent) {
    return {
      buffer: inputBuffer,
      applied: false,
      clearedPixels: 0,
      notes: ["Corner colors are not consistent enough for safe solid-background removal."]
    };
  }

  const visited = new Uint8Array(width * height);
  const queue: number[] = [];
  const enqueue = (x: number, y: number) => {
    if (x < 0 || x >= width || y < 0 || y >= height) {
      return;
    }
    const index = y * width + x;
    if (visited[index] === 1) {
      return;
    }
    const pixel = pixelAt(data, width, channels, x, y);
    if (pixel.a >= config.validation.alphaOpaqueThreshold && colorDistance(base, pixel) <= config.validation.solidBackgroundColorDistance) {
      visited[index] = 1;
      queue.push(index);
    }
  };

  for (let x = 0; x < width; x += 1) {
    enqueue(x, 0);
    enqueue(x, height - 1);
  }
  for (let y = 0; y < height; y += 1) {
    enqueue(0, y);
    enqueue(width - 1, y);
  }

  let clearedPixels = 0;
  for (let cursor = 0; cursor < queue.length; cursor += 1) {
    const index = queue[cursor] ?? 0;
    const x = index % width;
    const y = Math.floor(index / width);
    const offset = index * channels;
    data[offset + 3] = 0;
    clearedPixels += 1;
    enqueue(x + 1, y);
    enqueue(x - 1, y);
    enqueue(x, y + 1);
    enqueue(x, y - 1);
  }

  if (clearedPixels === 0) {
    return { buffer: inputBuffer, applied: false, clearedPixels: 0, notes: ["No background pixels were safe to clear."] };
  }

  const buffer = await sharp(data, { raw: { width, height, channels } }).png().toBuffer();
  notes.push(`Cleared ${clearedPixels} edge-connected solid-background pixels.`);
  return { buffer, applied: true, clearedPixels, notes };
}

export async function writeAutoFixArtifacts(
  outputDir: string,
  originalSheet: string,
  fixedBuffer: Buffer,
  result: BackgroundFixResult
): Promise<{ fixedSheetPath: string; reportPath: string; markdownPath: string }> {
  await ensureDir(outputDir);
  const fixedSheetPath = path.join(outputDir, `${timestampId()}_autofix_background.png`);
  const reportPath = path.join(outputDir, "autofix_report.json");
  const markdownPath = path.join(outputDir, "autofix_report.md");
  await fs.writeFile(fixedSheetPath, fixedBuffer);
  await writeJson(reportPath, {
    originalSheet,
    fixedSheet: fixedSheetPath,
    applied: result.applied,
    clearedPixels: result.clearedPixels,
    notes: result.notes
  });
  await writeText(
    markdownPath,
    `# SpriteForge Auto-Fix Report

Original: \`${originalSheet}\`
Fixed sheet: \`${fixedSheetPath}\`
Applied: **${result.applied ? "yes" : "no"}**
Cleared pixels: ${result.clearedPixels}

## Notes

${result.notes.map((note) => `- ${note}`).join("\n")}
`
  );
  return { fixedSheetPath, reportPath, markdownPath };
}

function pixelAt(data: Buffer, width: number, channels: number, x: number, y: number): Rgba {
  const offset = (y * width + x) * channels;
  return {
    r: data[offset] ?? 0,
    g: data[offset + 1] ?? 0,
    b: data[offset + 2] ?? 0,
    a: data[offset + 3] ?? 255
  };
}

function colorDistance(a: Rgba, b: Rgba): number {
  const dr = a.r - b.r;
  const dg = a.g - b.g;
  const db = a.b - b.b;
  return Math.sqrt(dr * dr + dg * dg + db * db);
}
