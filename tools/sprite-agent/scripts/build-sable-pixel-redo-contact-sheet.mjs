#!/usr/bin/env node
import fs from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";

const manifestPath = path.join("assets", "characters", "sable", "manifests", "preview_animation_clips.json");
const manifest = JSON.parse(await fs.readFile(manifestPath, "utf8"));
const clips = Array.isArray(manifest.clips) ? manifest.clips : [];
const outDir = path.join("assets", "characters", "sable", "reports");
await fs.mkdir(outDir, { recursive: true });

if (clips.length === 0) {
  throw new Error(`No approved preview clips found in ${manifestPath}`);
}

const rows = [];
for (const clip of clips) {
  if (!clip.clipId || !clip.normalizedSheet) {
    continue;
  }
  const source = path.resolve(clip.normalizedSheet);
  const metadata = await sharp(source, { failOn: "none" }).metadata();
  if (!metadata.width || !metadata.height) {
    throw new Error(`Could not read ${clip.normalizedSheet}`);
  }
  const scale = 0.25;
  const stripWidth = Math.round(metadata.width * scale);
  const stripHeight = Math.round(metadata.height * scale);
  const strip = await sharp(source, { failOn: "none" })
    .resize({ width: stripWidth, height: stripHeight, kernel: sharp.kernel.nearest })
    .png()
    .toBuffer();
  const label = labelSvg(clip.clipId, stripWidth, 28);
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
  rows.push({ clipId: clip.clipId, source: clip.normalizedSheet, row, width: stripWidth, height: rowHeight });
}

const width = Math.max(...rows.map((row) => row.width));
const gap = 12;
const height = rows.reduce((sum, row) => sum + row.height, 0) + gap * (rows.length - 1);
const composites = [];
let top = 0;
for (const row of rows) {
  composites.push({ input: row.row, left: 0, top });
  top += row.height + gap;
}

const output = path.join(outDir, "sable_pixel_redo_current_contact_sheet.png");
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

const report = {
  schemaVersion: "1.0.0",
  createdAt: new Date().toISOString(),
  manifest: manifestPath,
  output,
  approvedPreviewClipCount: rows.length,
  missingClips: manifest.missingClips ?? [],
  clips: rows.map(({ clipId, source }) => ({ clipId, source }))
};

await fs.writeFile(
  path.join(outDir, "sable_pixel_redo_current_contact_sheet.json"),
  `${JSON.stringify(report, null, 2)}\n`
);

console.log(output);

function labelSvg(text, width, height) {
  const escaped = text.replace(/[&<>]/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;" }[char]));
  return Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}">
    <rect width="100%" height="100%" fill="#19191d"/>
    <text x="10" y="20" fill="#f4efe2" font-family="Consolas, monospace" font-size="18">${escaped}</text>
  </svg>`);
}
