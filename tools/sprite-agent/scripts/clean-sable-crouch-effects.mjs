#!/usr/bin/env node
import fs from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";

const args = parseArgs(process.argv.slice(2));
const character = args.character ?? "sable";
const clip = args.clip ?? "crouch";
const frameWidth = Number(args["frame-width"] ?? 448);
const frameHeight = Number(args["frame-height"] ?? 448);
const frameCount = Number(args.frames ?? 8);
const source = args.source ?? path.join(
  "assets",
  "characters",
  "sable",
  "normalized",
  "crouch",
  "v20260628-175515",
  "sable_crouch_normalized_strip.png"
);

if (!Number.isInteger(frameWidth) || !Number.isInteger(frameHeight) || !Number.isInteger(frameCount)) {
  throw new Error("Invalid frame dimensions or frame count.");
}

const stamp = timestampId();
const outDir = path.join(
  "assets",
  "characters",
  character,
  "generated",
  "inbox",
  clip,
  `v${stamp}-style-reset-cleaned-${clip}`
);
await fs.mkdir(outDir, { recursive: true });
await fs.copyFile(source, path.join(outDir, `${character}_${clip}_style-reset-cleaned_source.png`));

const meta = await sharp(source, { failOn: "none" }).metadata();
if (meta.width !== frameWidth * frameCount || meta.height !== frameHeight) {
  throw new Error(`Expected ${frameWidth * frameCount}x${frameHeight}, got ${meta.width}x${meta.height}`);
}

const cleanedFrames = [];
const frameReports = [];

for (let index = 0; index < frameCount; index += 1) {
  const frame = await sharp(source, { failOn: "none" })
    .extract({ left: index * frameWidth, top: 0, width: frameWidth, height: frameHeight })
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });
  const before = countOpaque(frame.data);
  const cleanup = cleanFrame(frame.data, frameWidth, frameHeight);
  const motion = args["pose-variation"] === "false"
    ? { poseVariationApplied: false, poseDx: 0, poseDy: 0 }
    : applyCrouchBreathing(frame.data, frameWidth, frameHeight, index);
  const after = countOpaque(frame.data);
  const framePng = await sharp(frame.data, { raw: { width: frameWidth, height: frameHeight, channels: 4 } })
    .png()
    .toBuffer();
  cleanedFrames.push(framePng);
  await fs.writeFile(path.join(outDir, `frame_${String(index).padStart(3, "0")}.png`), framePng);
  frameReports.push({ frame: index, opaqueBefore: before, opaqueAfter: after, removedPixels: before - after, ...cleanup, ...motion });
}

const strip = await sharp({
  create: {
    width: frameWidth * frameCount,
    height: frameHeight,
    channels: 4,
    background: { r: 0, g: 0, b: 0, alpha: 0 }
  }
})
  .composite(cleanedFrames.map((input, index) => ({ input, left: index * frameWidth, top: 0 })))
  .png()
  .toBuffer();

const outPath = path.join(outDir, `zz_${character}_${clip}_style-reset-cleaned_prepared_${frameCount}x1_${frameWidth}.png`);
await fs.writeFile(outPath, strip);
await fs.writeFile(path.join(outDir, "style_reset_cleanup_report.json"), `${JSON.stringify({
  schemaVersion: "1.0.0",
  createdAt: new Date().toISOString(),
  character,
  clip,
  source,
  outputPath: outPath,
  frameWidth,
  frameHeight,
  frameCount,
  purpose: "Preview-only Sable crouch redo candidate. Removes placeholder-like lower-left crystal debris while preserving the correct-style crouch body.",
  liveRoster: false,
  frameReports
}, null, 2)}\n`);

console.log(outPath);

function cleanFrame(data, width, height) {
  let spatialRemoved = 0;
  let greenRemoved = 0;

  for (let offset = 0; offset < data.length; offset += 4) {
    const alpha = data[offset + 3] ?? 0;
    if (alpha <= 24) {
      continue;
    }
    const pixel = offset / 4;
    const x = pixel % width;
    const y = Math.floor(pixel / width);
    const r = data[offset] ?? 0;
    const g = data[offset + 1] ?? 0;
    const b = data[offset + 2] ?? 0;

    const greenSpill = g > 80 && g > r * 1.18 && g > b * 1.18 && g - Math.max(r, b) > 18;
    if (greenSpill) {
      data[offset + 3] = 0;
      greenRemoved += 1;
      continue;
    }

    const lowerLeftCrystalZone = (x < 122 && y > 168) || (x < 146 && y > 238);
    const coolShardColor =
      x < 168 &&
      y > 140 &&
      (r + g + b > 190) &&
      (Math.max(r, g, b) - Math.min(r, g, b) > 18) &&
      (b > r + 8 || g > r + 8 || b > 118);
    const farRightDetachedShard = x > 310 && y > 70 && y < 330;
    const rightForearmShardHighlight =
      x > 238 &&
      y > 130 &&
      y < 318 &&
      (r + g + b > 210) &&
      (Math.max(r, g, b) - Math.min(r, g, b) > 20) &&
      (b > r + 8 || b > g + 12 || r > g + 18);
    if (lowerLeftCrystalZone || coolShardColor || farRightDetachedShard || rightForearmShardHighlight) {
      data[offset + 3] = 0;
      spatialRemoved += 1;
    }
  }

  const componentReport = removeDetachedComponents(data, width, height);
  return { spatialRemoved, greenRemoved, ...componentReport };
}

function applyCrouchBreathing(data, width, height, frameIndex) {
  const offsets = [
    { dx: 0, dy: 1 },
    { dx: 1, dy: -1 },
    { dx: 2, dy: -3 },
    { dx: 1, dy: -2 },
    { dx: 0, dy: 0 },
    { dx: -1, dy: 2 },
    { dx: -2, dy: 1 },
    { dx: -1, dy: 0 }
  ];
  const { dx, dy } = offsets[frameIndex % offsets.length] ?? { dx: 0, dy: 0 };
  if (dx === 0 && dy === 0) {
    return { poseVariationApplied: true, poseDx: dx, poseDy: dy };
  }

  const source = new Uint8ClampedArray(data);
  data.fill(0);

  for (let offset = 0; offset < source.length; offset += 4) {
    const alpha = source[offset + 3] ?? 0;
    if (alpha <= 0) {
      continue;
    }
    const pixel = offset / 4;
    const x = pixel % width;
    const y = Math.floor(pixel / width);
    const moveUpperBody = y < 258 && x > 74 && x < 374;
    const targetX = moveUpperBody ? x + dx : x;
    const targetY = moveUpperBody ? y + dy : y;
    if (targetX < 0 || targetX >= width || targetY < 0 || targetY >= height) {
      continue;
    }
    const target = (targetY * width + targetX) * 4;
    const existingAlpha = data[target + 3] ?? 0;
    const sourceLuma = (source[offset] ?? 0) + (source[offset + 1] ?? 0) + (source[offset + 2] ?? 0);
    const existingLuma = (data[target] ?? 0) + (data[target + 1] ?? 0) + (data[target + 2] ?? 0);
    if (alpha > existingAlpha + 8 || (Math.abs(alpha - existingAlpha) <= 8 && sourceLuma >= existingLuma)) {
      data[target] = source[offset] ?? 0;
      data[target + 1] = source[offset + 1] ?? 0;
      data[target + 2] = source[offset + 2] ?? 0;
      data[target + 3] = alpha;
    }
  }

  return { poseVariationApplied: true, poseDx: dx, poseDy: dy };
}

function removeDetachedComponents(data, width, height) {
  const visited = new Uint8Array(width * height);
  const components = [];
  const stack = [];

  for (let start = 0; start < width * height; start += 1) {
    if (visited[start]) {
      continue;
    }
    if ((data[start * 4 + 3] ?? 0) <= 24) {
      visited[start] = 1;
      continue;
    }

    const pixels = [];
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
      pixels.push(current);
      const x = current % width;
      const y = Math.floor(current / width);
      minX = Math.min(minX, x);
      minY = Math.min(minY, y);
      maxX = Math.max(maxX, x);
      maxY = Math.max(maxY, y);

      for (const neighbor of neighbors4(current, x, y, width, height)) {
        if (neighbor < 0 || visited[neighbor]) {
          continue;
        }
        if ((data[neighbor * 4 + 3] ?? 0) <= 24) {
          visited[neighbor] = 1;
          continue;
        }
        visited[neighbor] = 1;
        stack.push(neighbor);
      }
    }
    components.push({ pixels, minX, minY, maxX, maxY, area: pixels.length });
  }

  components.sort((a, b) => b.area - a.area);
  const main = components[0];
  if (!main) {
    return { detachedComponentsRemoved: 0, detachedPixelsRemoved: 0 };
  }

  const keep = new Set(main.pixels);
  let detachedComponentsRemoved = 0;
  let detachedPixelsRemoved = 0;
  const expanded = {
    minX: main.minX - 18,
    minY: main.minY - 18,
    maxX: main.maxX + 18,
    maxY: main.maxY + 18
  };

  for (const component of components.slice(1)) {
    const overlapsMainNeighborhood =
      component.maxX >= expanded.minX &&
      component.minX <= expanded.maxX &&
      component.maxY >= expanded.minY &&
      component.minY <= expanded.maxY;
    const keepSmallBodyDetail = component.area >= 18 && overlapsMainNeighborhood;
    if (keepSmallBodyDetail) {
      for (const pixel of component.pixels) {
        keep.add(pixel);
      }
      continue;
    }
    detachedComponentsRemoved += 1;
    detachedPixelsRemoved += component.area;
  }

  for (let pixel = 0; pixel < width * height; pixel += 1) {
    if (!keep.has(pixel)) {
      data[pixel * 4 + 3] = 0;
    }
  }

  return { detachedComponentsRemoved, detachedPixelsRemoved };
}

function neighbors4(current, x, y, width, height) {
  return [
    x > 0 ? current - 1 : -1,
    x < width - 1 ? current + 1 : -1,
    y > 0 ? current - width : -1,
    y < height - 1 ? current + width : -1
  ];
}

function countOpaque(data) {
  let count = 0;
  for (let offset = 3; offset < data.length; offset += 4) {
    if ((data[offset] ?? 0) > 24) {
      count += 1;
    }
  }
  return count;
}

function parseArgs(argv) {
  const parsed = {};
  for (let index = 0; index < argv.length; index += 1) {
    const token = argv[index];
    if (!token?.startsWith("--")) {
      continue;
    }
    const key = token.slice(2);
    const value = argv[index + 1];
    if (!value || value.startsWith("--")) {
      parsed[key] = "true";
    } else {
      parsed[key] = value;
      index += 1;
    }
  }
  return parsed;
}

function timestampId(date = new Date()) {
  const pad = (value) => String(value).padStart(2, "0");
  return [
    date.getFullYear(),
    pad(date.getMonth() + 1),
    pad(date.getDate()),
    "-",
    pad(date.getHours()),
    pad(date.getMinutes()),
    pad(date.getSeconds())
  ].join("");
}
