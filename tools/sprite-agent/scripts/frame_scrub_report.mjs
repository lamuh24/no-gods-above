#!/usr/bin/env node

import fs from "node:fs/promises";
import path from "node:path";
import sharp from "../node_modules/sharp/lib/index.js";

const args = parseArgs(process.argv.slice(2));
const input = requiredArg(args, "input");
const clip = requiredArg(args, "clip");
const outDir = requiredArg(args, "out-dir");
const frameW = numberArg(args, "frame-width", 448);
const frameH = numberArg(args, "frame-height", 448);
const baselineY = numberArg(args, "baseline-y", 382);
const alphaThreshold = numberArg(args, "alpha-threshold", 24);
const duplicateHashMaxDistance = numberArg(args, "duplicate-hash-max-distance", 4);

await fs.mkdir(outDir, { recursive: true });

const metadata = await sharp(input).metadata();
if (!metadata.width || !metadata.height) {
  throw new Error(`Cannot read dimensions for ${input}`);
}
if (metadata.height !== frameH || metadata.width % frameW !== 0) {
  throw new Error(`Expected a horizontal strip with ${frameW}x${frameH} frames, got ${metadata.width}x${metadata.height}.`);
}

const frameCount = metadata.width / frameW;
const frames = [];
for (let index = 0; index < frameCount; index += 1) {
  const buffer = await sharp(input)
    .extract({ left: index * frameW, top: 0, width: frameW, height: frameH })
    .png()
    .toBuffer();
  frames.push({
    index,
    buffer,
    measurement: await measureFrame(buffer, index),
    hash: await averageHash(buffer)
  });
}

const duplicatePairs = [];
for (let a = 0; a < frames.length; a += 1) {
  for (let b = a + 1; b < frames.length; b += 1) {
    const distance = hammingDistance(frames[a].hash, frames[b].hash);
    if (distance <= duplicateHashMaxDistance) {
      duplicatePairs.push({ frameA: a, frameB: b, hammingDistance: distance });
    }
  }
}

const contactSheetPath = path.join(outDir, `${clip}_numbered_contact_sheet.png`);
const contactComposites = [];
for (const frame of frames) {
  contactComposites.push({ input: frame.buffer, left: frame.index * frameW, top: 0 });
  contactComposites.push({
    input: labelSvg(frame.index + 1, frameW, frameH),
    left: frame.index * frameW,
    top: 0
  });
}

await sharp({
  create: {
    width: metadata.width,
    height: metadata.height,
    channels: 4,
    background: { r: 0, g: 0, b: 0, alpha: 0 }
  }
})
  .composite(contactComposites)
  .png()
  .toFile(contactSheetPath);

const report = {
  schemaVersion: "1.0.0",
  reportKind: "animation-fluidity-frame-scrub",
  generatedAt: new Date().toISOString(),
  clip,
  sourceStrip: input,
  numberedContactSheet: contactSheetPath,
  frameCount,
  frameWidth: frameW,
  frameHeight: frameH,
  baselineY,
  duplicatePairs,
  frameMeasurements: frames.map((frame) => frame.measurement),
  fluidityChecklist: {
    oneContinuousAction: "manual_check_required",
    anticipationContactFollowThroughRecovery: "manual_check_required",
    lockedStrikingLimb: "manual_check_required",
    noMirroredFrames: "manual_check_required",
    recoveryTowardIdleWithoutDuplicateFrame0: duplicatePairs.some((pair) => pair.frameA === 0 && pair.frameB === frameCount - 1)
      ? "fail_duplicate_first_last"
      : "manual_check_required",
    visibleImpactCountMatchesMoveData: "manual_check_required",
    notes: [
      "This script is audit-only. It does not alter, offset, synthesize, or repair frames.",
      "Manual scrub must verify adjacent-frame continuity, striking-limb lock, phase readability, and hit-count parity before SpriteForge validation."
    ]
  }
};

const reportJson = path.join(outDir, `${clip}_frame_scrub_report.json`);
const reportMd = path.join(outDir, `${clip}_frame_scrub_report.md`);
await fs.writeFile(reportJson, `${JSON.stringify(report, null, 2)}\n`);
await fs.writeFile(reportMd, markdown(report));

console.log(contactSheetPath);
console.log(reportJson);

async function measureFrame(buffer, frameIndex) {
  const { data, info } = await sharp(buffer).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  let minX = info.width;
  let minY = info.height;
  let maxX = -1;
  let maxY = -1;
  let opaquePixels = 0;

  for (let y = 0; y < info.height; y += 1) {
    for (let x = 0; x < info.width; x += 1) {
      const alpha = data[(y * info.width + x) * info.channels + 3] ?? 0;
      if (alpha <= alphaThreshold) {
        continue;
      }
      opaquePixels += 1;
      minX = Math.min(minX, x);
      minY = Math.min(minY, y);
      maxX = Math.max(maxX, x);
      maxY = Math.max(maxY, y);
    }
  }

  if (opaquePixels === 0) {
    return { frameIndex, empty: true, opaquePixels };
  }

  const bbox = {
    x: minX,
    y: minY,
    width: maxX - minX + 1,
    height: maxY - minY + 1,
    right: maxX,
    bottom: maxY
  };
  return {
    frameIndex,
    empty: false,
    opaquePixels,
    bbox,
    baselineDeltaPx: bbox.bottom - baselineY,
    centerDeltaPx: Math.round(bbox.x + bbox.width / 2 - frameW / 2)
  };
}

async function averageHash(buffer) {
  const { data } = await sharp(buffer)
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

function hammingDistance(a, b) {
  let distance = 0;
  for (let index = 0; index < a.length; index += 1) {
    if (a[index] !== b[index]) {
      distance += 1;
    }
  }
  return distance;
}

function labelSvg(frameNumber, width, height) {
  return Buffer.from(`
<svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
  <rect x="8" y="8" width="54" height="42" rx="0" fill="black" opacity="0.72"/>
  <text x="35" y="37" text-anchor="middle" font-family="Arial, sans-serif" font-size="26" font-weight="700" fill="white">${frameNumber}</text>
</svg>`);
}

function markdown(report) {
  const duplicateRows = report.duplicatePairs.length
    ? report.duplicatePairs.map((pair) => `- ${pair.frameA + 1} / ${pair.frameB + 1}: distance ${pair.hammingDistance}`).join("\n")
    : "- None.";
  return `# ${report.clip} Frame-Scrub Report

Generated: ${report.generatedAt}

Source strip: \`${report.sourceStrip}\`
Numbered contact sheet: \`${report.numberedContactSheet}\`

## Objective Checks

- Frame count: ${report.frameCount}
- Frame size: ${report.frameWidth}x${report.frameHeight}
- First/last duplicate risk: ${report.fluidityChecklist.recoveryTowardIdleWithoutDuplicateFrame0}

## Near-Duplicate Pairs

${duplicateRows}

## Manual Fluidity Checklist

- One continuous physical action: ${report.fluidityChecklist.oneContinuousAction}
- Anticipation/contact/follow-through/recovery: ${report.fluidityChecklist.anticipationContactFollowThroughRecovery}
- Locked striking limb: ${report.fluidityChecklist.lockedStrikingLimb}
- No mirrored frames: ${report.fluidityChecklist.noMirroredFrames}
- Visible impacts match move data: ${report.fluidityChecklist.visibleImpactCountMatchesMoveData}

This report is audit-only and does not approve the clip.
`;
}

function parseArgs(tokens) {
  const parsed = {};
  for (let index = 0; index < tokens.length; index += 1) {
    const token = tokens[index];
    if (!token.startsWith("--")) {
      continue;
    }
    parsed[token.slice(2)] = tokens[index + 1];
    index += 1;
  }
  return parsed;
}

function requiredArg(parsed, key) {
  const value = parsed[key];
  if (!value) {
    throw new Error(`Missing --${key}`);
  }
  return value;
}

function numberArg(parsed, key, fallback) {
  const value = parsed[key];
  if (value === undefined) {
    return fallback;
  }
  const number = Number(value);
  if (!Number.isFinite(number)) {
    throw new Error(`Invalid --${key}: ${value}`);
  }
  return number;
}
