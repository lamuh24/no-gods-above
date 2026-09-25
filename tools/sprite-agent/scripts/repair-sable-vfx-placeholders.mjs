#!/usr/bin/env node
import fs from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";

const args = parseArgs(process.argv.slice(2));
const character = args.character ?? "sable";
const clip = required(args, "clip");
const source = required(args, "source");
const frameCount = Number(required(args, "frames"));
const frameWidth = Number(args["frame-width"] ?? 448);
const frameHeight = Number(args["frame-height"] ?? 448);

const stamp = timestampId();
const safeClip = clip.replace(/[^a-z0-9_-]+/gi, "_");
const outDir = path.join(
  "assets",
  "characters",
  character,
  "generated",
  "inbox",
  clip,
  `v${stamp}-style-reset-vfx-clean-${safeClip}`
);
await fs.mkdir(outDir, { recursive: true });
await fs.copyFile(source, path.join(outDir, `${character}_${safeClip}_style-reset-vfx-clean_source.png`));

const metadata = await sharp(source, { failOn: "none" }).metadata();
if (metadata.width !== frameWidth * frameCount || metadata.height !== frameHeight) {
  throw new Error(`Expected ${frameWidth * frameCount}x${frameHeight}, got ${metadata.width}x${metadata.height}`);
}

const frames = [];
const frameReports = [];
for (let index = 0; index < frameCount; index += 1) {
  const { data, info } = await sharp(source, { failOn: "none" })
    .extract({ left: index * frameWidth, top: 0, width: frameWidth, height: frameHeight })
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });
  const before = countOpaque(data);
  const removed = removeFlatPlaceholderPurple(data, info.width, info.height);
  const removedDetached = removeGroundNormalDetachedPlaceholders(data, info.width, info.height);
  const frameBase = await sharp(data, { raw: { width: info.width, height: info.height, channels: 4 } })
    .png()
    .toBuffer();
  const overlay = vfxOverlayFor(clip, index, frameWidth, frameHeight);
  const frame = overlay
    ? await sharp(frameBase).composite([{ input: overlay, left: 0, top: 0 }]).png().toBuffer()
    : frameBase;
  frames.push(frame);
  await fs.writeFile(path.join(outDir, `frame_${String(index).padStart(3, "0")}.png`), frame);
  frameReports.push({
    frame: index,
    opaqueBefore: before,
    removedPlaceholderPixels: removed + removedDetached,
    addedControlledVfx: Boolean(overlay)
  });
}

const strip = await sharp({
  create: {
    width: frameWidth * frameCount,
    height: frameHeight,
    channels: 4,
    background: { r: 0, g: 0, b: 0, alpha: 0 }
  }
})
  .composite(frames.map((input, index) => ({ input, left: index * frameWidth, top: 0 })))
  .png()
  .toBuffer();

const outPath = path.join(outDir, `zz_${character}_${safeClip}_style-reset-vfx-clean_prepared_${frameCount}x1_${frameWidth}.png`);
await fs.writeFile(outPath, strip);
await fs.writeFile(path.join(outDir, "style_reset_vfx_cleanup_report.json"), `${JSON.stringify({
  schemaVersion: "1.0.0",
  createdAt: new Date().toISOString(),
  character,
  clip,
  source,
  outputPath: outPath,
  frameWidth,
  frameHeight,
  frameCount,
  purpose: "Preview-only Sable style-reset cleanup. Removes flat placeholder VFX and keeps controlled attached void accents.",
  liveRoster: false,
  frameReports
}, null, 2)}\n`);

console.log(outPath);

function removeFlatPlaceholderPurple(data, width, height) {
  let removed = 0;
  for (let offset = 0; offset < data.length; offset += 4) {
    const alpha = data[offset + 3] ?? 0;
    const pixel = offset / 4;
    const x = pixel % width;
    const y = Math.floor(pixel / width);
    const groundNormalFarPlaceholderZone =
      (clip === "stand_light" || clip === "stand_medium") &&
      x > 346 &&
      y > 48 &&
      y < 390;
    if (groundNormalFarPlaceholderZone && alpha > 0) {
      data[offset] = 0;
      data[offset + 1] = 0;
      data[offset + 2] = 0;
      data[offset + 3] = 0;
      removed += 1;
      continue;
    }
    if (alpha <= 24) {
      continue;
    }
    const r = data[offset] ?? 0;
    const g = data[offset + 1] ?? 0;
    const b = data[offset + 2] ?? 0;
    const saturatedFlatViolet =
      x > 220 &&
      y > 70 &&
      y < 330 &&
      b > 92 &&
      r > 42 &&
      g > 36 &&
      b > g + 18 &&
      Math.max(r, g, b) - Math.min(r, g, b) > 34;
    const paleFlatShard =
      x > 220 &&
      y > 80 &&
      y < 330 &&
      r > 125 &&
      g > 125 &&
      b > 155 &&
      Math.max(r, g, b) - Math.min(r, g, b) < 86;
    const groundNormalFarFlatShard =
      (clip === "stand_light" || clip === "stand_medium") &&
      x > 318 &&
      y > 64 &&
      y < 356 &&
      b > 30 &&
      b >= r + 8 &&
      b >= g + 8;
    const groundNormalDarkFlatShard =
      (clip === "stand_light" || clip === "stand_medium") &&
      x > 258 &&
      y > 80 &&
      y < 330 &&
      r <= 26 &&
      g <= 26 &&
      b >= 24 &&
      b >= r + 10 &&
      b >= g + 10;
    const neutralSpecialFarVfxZone =
      clip === "neutral_special_light" &&
      x > 270 &&
      y > 72 &&
      y < 330;
    const neutralSpecialFlatShardZone =
      clip === "neutral_special_light" &&
      x > 268 &&
      y > 96 &&
      y < 300 &&
      b > 42 &&
      b >= g &&
      r >= g * 0.72;
    if (
      saturatedFlatViolet ||
      paleFlatShard ||
      groundNormalFarFlatShard ||
      groundNormalDarkFlatShard ||
      groundNormalFarPlaceholderZone ||
      neutralSpecialFarVfxZone ||
      neutralSpecialFlatShardZone
    ) {
      data[offset] = 0;
      data[offset + 1] = 0;
      data[offset + 2] = 0;
      data[offset + 3] = 0;
      removed += 1;
    }
  }
  return removed;
}

function removeGroundNormalDetachedPlaceholders(data, width, height) {
  if (clip !== "stand_light" && clip !== "stand_medium") {
    return 0;
  }

  const visited = new Uint8Array(width * height);
  let removed = 0;
  for (let index = 0; index < width * height; index += 1) {
    if (visited[index] || (data[index * 4 + 3] ?? 0) === 0) {
      continue;
    }

    const stack = [index];
    const pixels = [];
    visited[index] = 1;
    let minX = width;
    let minY = height;
    let maxX = -1;
    let maxY = -1;

    while (stack.length > 0) {
      const current = stack.pop();
      pixels.push(current);
      const x = current % width;
      const y = Math.floor(current / width);
      minX = Math.min(minX, x);
      minY = Math.min(minY, y);
      maxX = Math.max(maxX, x);
      maxY = Math.max(maxY, y);

      for (const neighbor of [current - 1, current + 1, current - width, current + width]) {
        if (neighbor < 0 || neighbor >= width * height || visited[neighbor]) {
          continue;
        }
        const nx = neighbor % width;
        const ny = Math.floor(neighbor / width);
        if (Math.abs(nx - x) + Math.abs(ny - y) !== 1) {
          continue;
        }
        if ((data[neighbor * 4 + 3] ?? 0) > 0) {
          visited[neighbor] = 1;
          stack.push(neighbor);
        }
      }
    }

    const detachedFarAttackShard =
      pixels.length > 80 &&
      minX > 274 &&
      maxX > 290 &&
      maxY - minY > 24;
    const detachedLowerGhost =
      pixels.length > 500 &&
      minX > 210 &&
      minY > 220 &&
      maxX > 250 &&
      maxY > 340;
    if (!detachedFarAttackShard && !detachedLowerGhost) {
      continue;
    }

    for (const pixel of pixels) {
      const offset = pixel * 4;
      data[offset] = 0;
      data[offset + 1] = 0;
      data[offset + 2] = 0;
      data[offset + 3] = 0;
      removed += 1;
    }
  }
  return removed;
}

function vfxOverlayFor(clipId, frameIndex, width, height) {
  if (clipId !== "neutral_special_light") {
    return null;
  }
  const keyframes = [
    [],
    [{ x: 272, y: 168, s: 0.22, a: 0.32 }],
    [{ x: 278, y: 164, s: 0.28, a: 0.42 }, { x: 290, y: 176, s: 0.16, a: 0.26 }],
    [{ x: 284, y: 162, s: 0.34, a: 0.5 }, { x: 296, y: 151, s: 0.18, a: 0.32 }, { x: 298, y: 184, s: 0.16, a: 0.28 }],
    [{ x: 288, y: 160, s: 0.38, a: 0.52 }, { x: 302, y: 174, s: 0.2, a: 0.32 }, { x: 278, y: 181, s: 0.16, a: 0.28 }],
    [{ x: 286, y: 169, s: 0.25, a: 0.36 }, { x: 298, y: 159, s: 0.14, a: 0.24 }],
    [{ x: 278, y: 171, s: 0.14, a: 0.22 }],
    [{ x: 286, y: 172, s: 0.24, a: 0.28 }, { x: 304, y: 160, s: 0.16, a: 0.2 }]
  ];
  const shards = keyframes[frameIndex] ?? [];
  if (shards.length === 0) {
    return null;
  }
  const pieces = shards.map((shard, index) => shardPolygon(shard, index)).join("\n");
  return Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}">
    <g opacity="0.92">${pieces}</g>
  </svg>`);
}

function shardPolygon({ x, y, s, a }, index) {
  const w = 14 * s;
  const h = 32 * s;
  const lean = index % 2 === 0 ? 5 * s : -4 * s;
  const points = [
    `${x},${y - h}`,
    `${x + w + lean},${y}`,
    `${x},${y + h}`,
    `${x - w + lean},${y}`
  ].join(" ");
  return `<polygon points="${points}" fill="#17192a" fill-opacity="${a}"/>
  <polyline points="${x},${y - h * 0.82} ${x + lean * 0.35},${y} ${x},${y + h * 0.82}" fill="none" stroke="#b9bcff" stroke-opacity="${Math.min(0.62, a + 0.08)}" stroke-width="${Math.max(0.7, s * 1.4)}"/>
  <polyline points="${x - w * 0.62},${y} ${x + w * 0.5},${y - h * 0.2}" fill="none" stroke="#776dff" stroke-opacity="${Math.min(0.45, a)}" stroke-width="${Math.max(0.55, s)}"/>`;
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

function required(values, key) {
  const value = values[key];
  if (!value) {
    throw new Error(`Missing --${key}`);
  }
  return value;
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
