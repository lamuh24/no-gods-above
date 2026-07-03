#!/usr/bin/env node
import fs from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";

const clips = [
  "walk_forward",
  "jump",
  "stand_light",
  "stand_medium",
  "stand_heavy",
  "jump_light",
  "jump_medium",
  "jump_heavy",
  "neutral_special_light",
  "forward_special_light",
  "forward_special_medium",
  "forward_special_heavy",
  "back_special_light",
  "down_special_light",
  "up_special_light"
];

const outDir = path.join("assets", "characters", "sable", "reports");
await fs.mkdir(outDir, { recursive: true });

const rows = [];
for (const clip of clips) {
  const source = await latestNormalizedStrip(clip);
  const metadata = await sharp(source, { failOn: "none" }).metadata();
  if (!metadata.width || !metadata.height) {
    throw new Error(`Could not read ${source}`);
  }
  const scale = 0.25;
  const stripWidth = Math.round(metadata.width * scale);
  const stripHeight = Math.round(metadata.height * scale);
  const strip = await sharp(source, { failOn: "none" })
    .resize({ width: stripWidth, height: stripHeight, kernel: sharp.kernel.nearest })
    .png()
    .toBuffer();
  const label = await labelSvg(clip, stripWidth, 28);
  const rowHeight = stripHeight + 34;
  const row = await sharp({
    create: {
      width: stripWidth,
      height: rowHeight,
      channels: 4,
      background: { r: 12, g: 12, b: 14, alpha: 1 }
    }
  })
    .composite([
      { input: label, left: 0, top: 0 },
      { input: strip, left: 0, top: 30 }
    ])
    .png()
    .toBuffer();
  rows.push({ clip, source, row, width: stripWidth, height: rowHeight });
}

const width = Math.max(...rows.map((row) => row.width));
const gap = 12;
const height = rows.reduce((sum, row) => sum + row.height, 0) + gap * (rows.length - 1);
let top = 0;
const composites = [];
for (const row of rows) {
  composites.push({ input: row.row, left: 0, top });
  top += row.height + gap;
}

const output = path.join(outDir, "sable_style4_redo_source_contact_sheet.png");
await sharp({
  create: {
    width,
    height,
    channels: 4,
    background: { r: 8, g: 8, b: 10, alpha: 1 }
  }
})
  .composite(composites)
  .png()
  .toFile(output);

await fs.writeFile(path.join(outDir, "sable_style4_redo_source_contact_sheet.json"), `${JSON.stringify({
  schemaVersion: "1.0.0",
  createdAt: new Date().toISOString(),
  output,
  clips: rows.map(({ clip, source }) => ({ clip, source }))
}, null, 2)}\n`);

console.log(output);

async function latestNormalizedStrip(clip) {
  const clipDir = path.join("assets", "characters", "sable", "normalized", clip);
  const versions = (await fs.readdir(clipDir, { withFileTypes: true }))
    .filter((entry) => entry.isDirectory() && entry.name.startsWith("v"))
    .map((entry) => entry.name)
    .sort()
    .reverse();
  for (const version of versions) {
    const dir = path.join(clipDir, version);
    const files = await fs.readdir(dir);
    const strip = files.find((file) => file.endsWith("_normalized_strip.png"));
    if (strip) {
      return path.join(dir, strip);
    }
  }
  throw new Error(`No normalized strip found for ${clip}`);
}

async function labelSvg(text, width, height) {
  const escaped = text.replace(/[&<>]/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;" }[char]));
  return Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}">
    <rect width="100%" height="100%" fill="#19191d"/>
    <text x="10" y="20" fill="#f4efe2" font-family="Consolas, monospace" font-size="18">${escaped}</text>
  </svg>`);
}
