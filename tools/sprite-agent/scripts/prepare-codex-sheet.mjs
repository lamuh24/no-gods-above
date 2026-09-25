#!/usr/bin/env node
import fs from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";

const args = parseArgs(process.argv.slice(2));
const source = required(args, "source");
const character = required(args, "character");
const clip = required(args, "clip");
const frameCount = Number(required(args, "frames"));
const sourceFrameCount = args["source-frames"] ? Number(args["source-frames"]) : frameCount;
const sourceIndexesArg = args["source-indexes"];
const tag = args.tag ?? "codex";
const inboxRoot = args["inbox-root"] ?? path.join("assets", "characters", character, "generated", "inbox");

if (!Number.isInteger(frameCount) || frameCount < 1) {
  throw new Error(`Invalid --frames value: ${args.frames}`);
}
if (!Number.isInteger(sourceFrameCount) || sourceFrameCount < frameCount) {
  throw new Error(`Invalid --source-frames value: ${args["source-frames"]}`);
}
const explicitSourceIndexes = sourceIndexesArg
  ? sourceIndexesArg.split(",").map((value) => Number(value.trim()))
  : null;
if (
  explicitSourceIndexes &&
  (
    explicitSourceIndexes.length !== frameCount ||
    explicitSourceIndexes.some((index) => !Number.isInteger(index) || index < 0 || index >= sourceFrameCount)
  )
) {
  throw new Error(`Invalid --source-indexes value: ${sourceIndexesArg}`);
}

const config = JSON.parse(await fs.readFile(path.join("tools", "sprite-agent", "agent.config.json"), "utf8"));
const frameWidth = config.sprite.frameWidth;
const frameHeight = config.sprite.frameHeight;
const baselineY = config.sprite.baselineY;
const anchorX = config.sprite.anchorX;
const maxWidth = args["max-width"] ? Number(args["max-width"]) : config.sprite.safeBox.maxWidth;
const maxHeight = args["max-height"] ? Number(args["max-height"]) : config.sprite.safeBox.maxHeight;
const mainComponentOnly = args["main-component-only"] === "true";
const componentSlices = args["component-slices"] === "true";
const componentStrategy = args["component-strategy"] ?? "largest";
if (!["largest", "x-spread", "x-bands"].includes(componentStrategy)) {
  throw new Error(`Invalid --component-strategy value: ${componentStrategy}`);
}
if (!Number.isFinite(maxWidth) || maxWidth < 1 || !Number.isFinite(maxHeight) || maxHeight < 1) {
  throw new Error(`Invalid --max-width/--max-height values: ${maxWidth}x${maxHeight}`);
}
const stamp = timestampId();
const safeClip = clip.replace(/[^a-z0-9_-]+/gi, "_");
const outDir = path.join(
  inboxRoot,
  clip,
  `v${stamp}-${tag}-${safeClip}`
);
await fs.mkdir(outDir, { recursive: true });
await fs.copyFile(source, path.join(outDir, `${character}_${safeClip}_${tag}_raw_chroma.png`));

const sourceMeta = await sharp(source, { failOn: "none" }).metadata();
if (!sourceMeta.width || !sourceMeta.height) {
  throw new Error(`Could not read source dimensions for ${source}`);
}

const frames = componentSlices
  ? await prepareComponentFrames({
      source,
      frameCount,
      frameWidth,
      frameHeight,
      baselineY,
      anchorX,
      maxWidth,
      maxHeight,
      componentStrategy
    })
  : [];

if (!componentSlices) {
  const sourceIndexes = explicitSourceIndexes ?? sampleIndexes(sourceFrameCount, frameCount);
  for (let index = 0; index < frameCount; index += 1) {
    const sourceIndex = sourceIndexes[index];
    const left = Math.round(sourceIndex * sourceMeta.width / sourceFrameCount);
    const right = Math.round((sourceIndex + 1) * sourceMeta.width / sourceFrameCount);
    const width = right - left;
    const frame = await prepareFrame({
      source,
      left,
      width,
      height: sourceMeta.height,
      frameWidth,
      frameHeight,
      baselineY,
      anchorX,
      maxWidth,
      maxHeight,
      mainComponentOnly
    });
    frames.push(frame);
  }
}

for (let index = 0; index < frames.length; index += 1) {
  await fs.writeFile(path.join(outDir, `frame_${String(index).padStart(3, "0")}.png`), frames[index]);
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

const outPath = path.join(outDir, `zz_${character}_${safeClip}_${tag}_prepared_${frameCount}x1_${frameWidth}.png`);
await fs.writeFile(outPath, strip);
console.log(outPath);

function sampleIndexes(sourceCount, outputCount) {
  if (sourceCount === outputCount) {
    return Array.from({ length: outputCount }, (_, index) => index);
  }
  return Array.from(
    { length: outputCount },
    (_, index) => Math.round(index * (sourceCount - 1) / (outputCount - 1))
  );
}

async function prepareFrame(options) {
  const { data, info } = await sharp(options.source, { failOn: "none" })
    .extract({ left: options.left, top: 0, width: options.width, height: options.height })
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });
  removeGreenBackground(data);
  let minX = info.width;
  let minY = info.height;
  let maxX = -1;
  let maxY = -1;

  for (let offset = 0; offset < data.length; offset += 4) {
    if ((data[offset + 3] ?? 0) > 24) {
      const pixel = offset / 4;
      const x = pixel % info.width;
      const y = Math.floor(pixel / info.width);
      minX = Math.min(minX, x);
      minY = Math.min(minY, y);
      maxX = Math.max(maxX, x);
      maxY = Math.max(maxY, y);
    }
  }

  if (options.mainComponentOnly) {
    keepMainComponentOnly(data, info.width, info.height);
    minX = info.width;
    minY = info.height;
    maxX = -1;
    maxY = -1;
    for (let offset = 0; offset < data.length; offset += 4) {
      if ((data[offset + 3] ?? 0) <= 24) {
        continue;
      }
      const pixel = offset / 4;
      const x = pixel % info.width;
      const y = Math.floor(pixel / info.width);
      minX = Math.min(minX, x);
      minY = Math.min(minY, y);
      maxX = Math.max(maxX, x);
      maxY = Math.max(maxY, y);
    }
  }

  if (maxX < minX || maxY < minY) {
    throw new Error(`Could not find visible pixels in frame crop starting at x=${options.left}`);
  }

  const cropWidth = maxX - minX + 1;
  const cropHeight = maxY - minY + 1;
  const cropped = await sharp(data, { raw: { width: info.width, height: info.height, channels: 4 } })
    .extract({ left: minX, top: minY, width: cropWidth, height: cropHeight })
    .png()
    .toBuffer();
  const scale = Math.min(options.maxWidth / cropWidth, options.maxHeight / cropHeight);
  const resizedWidth = Math.max(1, Math.round(cropWidth * scale));
  const resizedHeight = Math.max(1, Math.round(cropHeight * scale));
  const resized = await sharp(cropped)
    .resize({ width: resizedWidth, height: resizedHeight, kernel: sharp.kernel.nearest })
    .png()
    .toBuffer();
  return sharp({
    create: {
      width: options.frameWidth,
      height: options.frameHeight,
      channels: 4,
      background: { r: 0, g: 0, b: 0, alpha: 0 }
    }
  })
    .composite([{
      input: resized,
      left: clamp(Math.round(options.anchorX - resizedWidth / 2), 0, options.frameWidth - resizedWidth),
      top: clamp(Math.round(options.baselineY - resizedHeight), 0, options.frameHeight - resizedHeight)
    }])
    .png()
    .toBuffer();
}

async function prepareComponentFrames(options) {
  const { data, info } = await sharp(options.source, { failOn: "none" })
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });
  removeGreenBackground(data);

  const candidates = options.componentStrategy === "x-bands"
    ? findXBandComponents(data, info.width, info.height)
    : findComponents(data, info.width, info.height)
      .filter((component) => component.pixels.length >= 1200 && component.width >= 24 && component.height >= 80);
  const components = selectComponents(candidates, options.frameCount, options.componentStrategy);

  if (components.length !== options.frameCount) {
    throw new Error(`Detected ${components.length} pose components, expected ${options.frameCount}. Use equal slicing or regenerate with clearer pose spacing.`);
  }

  return Promise.all(components.map((component) => componentToFrame(data, info.width, component, options)));
}

function selectComponents(components, frameCount, strategy) {
  if (strategy === "x-spread" || strategy === "x-bands") {
    const ordered = [...components].sort((a, b) => a.minX - b.minX);
    if (ordered.length <= frameCount) {
      return ordered;
    }
    return Array.from({ length: frameCount }, (_, index) => {
      const selected = Math.round(index * (ordered.length - 1) / (frameCount - 1));
      return ordered[selected];
    });
  }

  return [...components]
    .sort((a, b) => b.pixels.length - a.pixels.length)
    .slice(0, frameCount)
    .sort((a, b) => a.minX - b.minX);
}

function findXBandComponents(data, width, height) {
  const columnCounts = new Uint16Array(width);
  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      if ((data[(y * width + x) * 4 + 3] ?? 0) > 24) {
        columnCounts[x] += 1;
      }
    }
  }

  const denseThreshold = Math.max(12, Math.round(height * 0.025));
  const bands = [];
  let start = -1;
  let lastDense = -1;
  const gapTolerance = 10;
  for (let x = 0; x < width; x += 1) {
    if (columnCounts[x] >= denseThreshold) {
      if (start < 0) {
        start = x;
      }
      lastDense = x;
      continue;
    }
    if (start >= 0 && x - lastDense > gapTolerance) {
      bands.push({ minX: start, maxX: lastDense });
      start = -1;
      lastDense = -1;
    }
  }
  if (start >= 0) {
    bands.push({ minX: start, maxX: lastDense });
  }

  return bands
    .map((band) => bandToComponent(data, width, height, band))
    .filter((component) => component.pixels.length >= 1200 && component.width >= 24 && component.height >= 80);
}

function bandToComponent(data, width, height, band) {
  let minX = width;
  let minY = height;
  let maxX = -1;
  let maxY = -1;
  const pixels = [];
  const pad = 18;
  const left = clamp(band.minX - pad, 0, width - 1);
  const right = clamp(band.maxX + pad, 0, width - 1);

  for (let y = 0; y < height; y += 1) {
    for (let x = left; x <= right; x += 1) {
      const pixel = y * width + x;
      if ((data[pixel * 4 + 3] ?? 0) <= 24) {
        continue;
      }
      pixels.push(pixel);
      minX = Math.min(minX, x);
      minY = Math.min(minY, y);
      maxX = Math.max(maxX, x);
      maxY = Math.max(maxY, y);
    }
  }

  return { pixels, minX, minY, maxX, maxY, width: maxX - minX + 1, height: maxY - minY + 1 };
}

async function componentToFrame(sourceData, sourceWidth, component, options) {
  const cropData = Buffer.alloc(component.width * component.height * 4);
  for (const pixel of component.pixels) {
    const sourceOffset = pixel * 4;
    const x = pixel % sourceWidth;
    const y = Math.floor(pixel / sourceWidth);
    const targetX = x - component.minX;
    const targetY = y - component.minY;
    const targetOffset = (targetY * component.width + targetX) * 4;
    cropData[targetOffset] = sourceData[sourceOffset];
    cropData[targetOffset + 1] = sourceData[sourceOffset + 1];
    cropData[targetOffset + 2] = sourceData[sourceOffset + 2];
    cropData[targetOffset + 3] = sourceData[sourceOffset + 3];
  }

  const cropped = await sharp(cropData, { raw: { width: component.width, height: component.height, channels: 4 } })
    .png()
    .toBuffer();
  const scale = Math.min(options.maxWidth / component.width, options.maxHeight / component.height);
  const resizedWidth = Math.max(1, Math.round(component.width * scale));
  const resizedHeight = Math.max(1, Math.round(component.height * scale));
  const resized = await sharp(cropped)
    .resize({ width: resizedWidth, height: resizedHeight, kernel: sharp.kernel.nearest })
    .png()
    .toBuffer();

  return sharp({
    create: {
      width: options.frameWidth,
      height: options.frameHeight,
      channels: 4,
      background: { r: 0, g: 0, b: 0, alpha: 0 }
    }
  })
    .composite([{
      input: resized,
      left: clamp(Math.round(options.anchorX - resizedWidth / 2), 0, options.frameWidth - resizedWidth),
      top: clamp(Math.round(options.baselineY - resizedHeight), 0, options.frameHeight - resizedHeight)
    }])
    .png()
    .toBuffer();
}

function removeGreenBackground(data) {
  for (let offset = 0; offset < data.length; offset += 4) {
    const r = data[offset] ?? 0;
    const g = data[offset + 1] ?? 0;
    const b = data[offset + 2] ?? 0;
    const green = g > 115 && g - r > 45 && g - b > 45 && g > r * 1.25 && g > b * 1.25;
    if (green) {
      data[offset + 3] = 0;
      continue;
    }
    if (g > r + 20 && g > b + 20) {
      data[offset + 1] = Math.max(r, b, Math.round(g * 0.45));
    }
  }
}

function findComponents(data, width, height) {
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

    let minX = width;
    let minY = height;
    let maxX = -1;
    let maxY = -1;
    const pixels = [];
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
        visited[neighbor] = 1;
        if ((data[neighbor * 4 + 3] ?? 0) > 24) {
          stack.push(neighbor);
        }
      }
    }
    components.push({ pixels, minX, minY, maxX, maxY, width: maxX - minX + 1, height: maxY - minY + 1 });
  }

  return components;
}

function keepMainComponentOnly(data, width, height) {
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
        if ((data[neighbor * 4 + 3] ?? 0) <= 24) {
          visited[neighbor] = 1;
          continue;
        }
        visited[neighbor] = 1;
        stack.push(neighbor);
      }
    }
    components.push(pixels);
  }

  components.sort((a, b) => b.length - a.length);
  const keep = new Set(components[0] ?? []);
  for (let pixel = 0; pixel < width * height; pixel += 1) {
    if (!keep.has(pixel)) {
      data[pixel * 4 + 3] = 0;
    }
  }
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

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}
