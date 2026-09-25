#!/usr/bin/env node
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, "..", "..", "..");
const runtimeDir = path.join(repoRoot, "NO_GODS_ABOVE", "assets", "sprites", "sable_rebuild_v2");
const reportPath = path.join(repoRoot, "NO_GODS_ABOVE", "docs", "sable_runtime_motion_repair_report.json");
const backupDir = path.join(repoRoot, "NO_GODS_ABOVE", "assets", "sprites", "sable_rebuild_v2_static_backup_20260703");

const FRAME_W = 448;
const FRAME_H = 448;
const BASELINE_Y = 382;

const CLIPS = {
  idle: 8,
  walk_forward: 12,
  walk_backward: 12,
  jump: 12,
  crouch: 8,
  block: 8,
  hit_stun: 8,
  knockdown: 8,
  getup: 8,
  stand_light: 8,
  stand_medium: 10,
  stand_heavy: 12,
  crouch_light: 8,
  crouch_medium: 10,
  crouch_heavy: 12,
  jump_light: 8,
  jump_medium: 10,
  jump_heavy: 12,
  forward_light: 8,
  forward_medium: 10,
  forward_heavy: 12,
  back_light: 8,
  back_medium: 10,
  back_heavy: 12,
  neutral_special_light: 14,
  neutral_special_medium: 16,
  neutral_special_heavy: 18,
  forward_special_light: 14,
  forward_special_medium: 16,
  forward_special_heavy: 18,
  back_special_light: 14,
  back_special_medium: 16,
  back_special_heavy: 18,
  down_special_light: 14,
  down_special_medium: 16,
  down_special_heavy: 18,
  up_special_light: 14,
  up_special_medium: 16,
  up_special_heavy: 18
};

const PRESERVE = new Set(["idle", "walk_forward", "walk_backward", "jump"]);
const sourceFiles = {
  stand: path.join(runtimeDir, "walk_forward.png"),
  back: path.join(runtimeDir, "walk_backward.png"),
  air: path.join(runtimeDir, "jump.png")
};

await assertSourceFiles();
await backupRuntimeStrips();

const written = [];
for (const [clip, frameCount] of Object.entries(CLIPS)) {
  if (PRESERVE.has(clip)) continue;
  const strip = await buildClipStrip(clip, frameCount);
  const outPath = path.join(runtimeDir, `${clip}.png`);
  await fs.writeFile(outPath, strip);
  written.push({ clip, frames: frameCount, output: path.relative(repoRoot, outPath).replaceAll("\\", "/") });
}

await fs.mkdir(path.dirname(reportPath), { recursive: true });
await fs.writeFile(reportPath, `${JSON.stringify({
  schemaVersion: "1.0.0",
  createdAt: new Date().toISOString(),
  purpose: "Repair Sable runtime test animations that were exact idle/walk stand-ins. This is a visual-only local playable test pass, not final hand-drawn animation.",
  runtimeDir: path.relative(repoRoot, runtimeDir).replaceAll("\\", "/"),
  backupDir: path.relative(repoRoot, backupDir).replaceAll("\\", "/"),
  preserved: [...PRESERVE],
  regenerated: written
}, null, 2)}\n`);

console.log(`Regenerated ${written.length} Sable runtime motion strips.`);
console.log(`Backup: ${path.relative(repoRoot, backupDir)}`);
console.log(`Report: ${path.relative(repoRoot, reportPath)}`);

async function assertSourceFiles() {
  for (const file of Object.values(sourceFiles)) {
    const meta = await sharp(file, { failOn: "none" }).metadata();
    if (meta.height !== FRAME_H || meta.width % FRAME_W !== 0) {
      throw new Error(`Invalid source strip ${file}: ${meta.width}x${meta.height}`);
    }
  }
}

async function backupRuntimeStrips() {
  await fs.mkdir(backupDir, { recursive: true });
  const marker = path.join(backupDir, "README.txt");
  try {
    await fs.access(marker);
    return;
  } catch {
    // First run: create the backup snapshot.
  }
  for (const clip of Object.keys(CLIPS)) {
    await fs.copyFile(path.join(runtimeDir, `${clip}.png`), path.join(backupDir, `${clip}.png`));
  }
  await fs.writeFile(marker, [
    "Backup of Sable runtime rebuild-v2 strips before the 2026-07-03 motion repair pass.",
    "The backed-up set loaded in-game but many action clips were exact idle/walk stand-ins.",
    ""
  ].join("\n"));
}

async function buildClipStrip(clip, frameCount) {
  const frames = [];
  for (let frame = 0; frame < frameCount; frame += 1) {
    const pose = poseFor(clip, frame, frameCount);
    const source = sourceFiles[pose.source];
    const sourceFrames = Math.round((await sharp(source, { failOn: "none" }).metadata()).width / FRAME_W);
    const sourceIndex = sourceFrameIndex(pose, frame, frameCount, sourceFrames);
    const frameBuffer = await sharp(source, { failOn: "none" })
      .extract({ left: sourceIndex * FRAME_W, top: 0, width: FRAME_W, height: FRAME_H })
      .ensureAlpha()
      .png()
      .toBuffer();
    const body = await transformBody(frameBuffer, pose);
    const overlays = overlayFor(clip, frame, frameCount, pose);
    const composited = await sharp(body).composite(overlays).png().toBuffer();
    frames.push(composited);
  }
  return sharp({
    create: {
      width: FRAME_W * frameCount,
      height: FRAME_H,
      channels: 4,
      background: { r: 0, g: 0, b: 0, alpha: 0 }
    }
  })
    .composite(frames.map((input, index) => ({ input, left: index * FRAME_W, top: 0 })))
    .png()
    .toBuffer();
}

function sourceFrameIndex(pose, frame, frameCount, sourceFrames) {
  if (pose.reverse) return Math.max(0, sourceFrames - 1 - (frame % sourceFrames));
  if (pose.holdFirst) return 0;
  const t = frameCount <= 1 ? 0 : frame / (frameCount - 1);
  if (pose.burstHold) {
    const peak = Math.min(sourceFrames - 1, Math.round((0.2 + Math.sin(Math.PI * t) * 0.7) * (sourceFrames - 1)));
    return Math.max(0, peak);
  }
  return frame % sourceFrames;
}

function poseFor(clip, frame, frameCount) {
  const t = frameCount <= 1 ? 0 : frame / (frameCount - 1);
  const wave = Math.sin(Math.PI * t);
  const strength = clip.includes("heavy") ? 1.25 : clip.includes("medium") ? 1.0 : 0.78;
  const pose = {
    source: "stand",
    scaleX: 1,
    scaleY: 1,
    dx: 0,
    dy: 0,
    reverse: false,
    holdFirst: false,
    burstHold: false,
    overlay: null,
    strength
  };

  if (clip === "crouch") return { ...pose, scaleX: 1.08, scaleY: 0.68, dy: 120, dx: -4 };
  if (clip === "block") return { ...pose, scaleX: 0.94, scaleY: 1.02, dx: -22, dy: -4, overlay: "shield" };
  if (clip === "hit_stun") return { ...pose, source: "air", scaleX: 1.04, scaleY: 0.98, dx: -24 * wave, dy: -22 * wave, reverse: true, overlay: "hit" };
  if (clip === "knockdown") return { ...pose, source: "air", scaleX: 1.18, scaleY: 0.44, dx: -20 + 32 * t, dy: 206, reverse: true, overlay: "impactDust" };
  if (clip === "getup") return { ...pose, scaleX: 1.08 - 0.08 * t, scaleY: 0.55 + 0.45 * t, dx: -14 + 14 * t, dy: 176 * (1 - t), holdFirst: frame < 2 };

  if (clip.startsWith("crouch_")) {
    return { ...pose, scaleX: 1.1 + 0.05 * wave, scaleY: 0.68, dx: 4 + 28 * wave * strength, dy: 120, overlay: "lowSlash" };
  }
  if (clip.startsWith("jump_")) {
    return { ...pose, source: "air", scaleX: 1.04 + 0.08 * wave, scaleY: 0.94, dx: 18 * wave * strength, dy: -48 * wave, overlay: "airSlash", burstHold: true };
  }
  if (clip.startsWith("forward_") && !clip.startsWith("forward_special")) {
    return { ...pose, scaleX: 1.04 + 0.08 * wave, scaleY: 0.98, dx: 14 + 48 * wave * strength, dy: -4 * wave, overlay: "slash", burstHold: true };
  }
  if (clip.startsWith("back_") && !clip.startsWith("back_special")) {
    return { ...pose, source: "back", scaleX: 1.04 + 0.06 * wave, scaleY: 0.98, dx: -18 - 26 * wave * strength, dy: -2 * wave, reverse: true, overlay: "backSlash" };
  }
  if (clip.startsWith("stand_")) {
    return { ...pose, scaleX: 1.04 + 0.08 * wave, scaleY: 0.98, dx: 10 + 36 * wave * strength, dy: -3 * wave, overlay: "slash", burstHold: true };
  }

  if (clip.startsWith("neutral_special")) return { ...pose, scaleX: 1.02, scaleY: 1.0, dx: 4 + 12 * wave, dy: -4 * wave, overlay: "orb", burstHold: true };
  if (clip.startsWith("forward_special")) return { ...pose, scaleX: 1.08 + 0.1 * wave, scaleY: 0.96, dx: 28 + 76 * wave * strength, dy: -8 * wave, overlay: "phaseTrail", burstHold: true };
  if (clip.startsWith("back_special")) return { ...pose, source: "back", scaleX: 1.02, scaleY: 1.0, dx: -26 - 28 * wave, dy: -4 * wave, reverse: true, overlay: "anchor" };
  if (clip.startsWith("down_special")) return { ...pose, scaleX: 1.1, scaleY: 0.72, dx: 8 + 22 * wave, dy: 110, overlay: "rift" };
  if (clip.startsWith("up_special")) return { ...pose, source: "air", scaleX: 1.02, scaleY: 1.06, dx: 8 + 18 * wave, dy: -78 * wave, overlay: "upTrail", burstHold: true };

  return pose;
}

async function transformBody(frameBuffer, pose) {
  const raw = await sharp(frameBuffer, { failOn: "none" }).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  const bounds = alphaBounds(raw.data, raw.info.width, raw.info.height);
  const crop = await sharp(frameBuffer, { failOn: "none" })
    .extract(bounds)
    .png()
    .toBuffer();
  const resizedWidth = Math.max(1, Math.round(bounds.width * pose.scaleX));
  const resizedHeight = Math.max(1, Math.round(bounds.height * pose.scaleY));
  const resized = await sharp(crop)
    .resize({ width: resizedWidth, height: resizedHeight, kernel: sharp.kernel.nearest })
    .png()
    .toBuffer();
  const left = Math.round(FRAME_W / 2 - resizedWidth / 2 + pose.dx);
  const top = Math.round(BASELINE_Y - resizedHeight + pose.dy);
  return sharp({
    create: {
      width: FRAME_W,
      height: FRAME_H,
      channels: 4,
      background: { r: 0, g: 0, b: 0, alpha: 0 }
    }
  })
    .composite([{ input: resized, left: clamp(left, -120, FRAME_W - 1), top: clamp(top, -120, FRAME_H - 1) }])
    .png()
    .toBuffer();
}

function alphaBounds(data, width, height) {
  let minX = width;
  let minY = height;
  let maxX = -1;
  let maxY = -1;
  for (let offset = 0; offset < data.length; offset += 4) {
    if ((data[offset + 3] ?? 0) <= 24) continue;
    const pixel = offset / 4;
    const x = pixel % width;
    const y = Math.floor(pixel / width);
    minX = Math.min(minX, x);
    minY = Math.min(minY, y);
    maxX = Math.max(maxX, x);
    maxY = Math.max(maxY, y);
  }
  if (maxX < minX || maxY < minY) return { left: 0, top: 0, width, height };
  const pad = 3;
  const left = clamp(minX - pad, 0, width - 1);
  const top = clamp(minY - pad, 0, height - 1);
  const right = clamp(maxX + pad, left + 1, width - 1);
  const bottom = clamp(maxY + pad, top + 1, height - 1);
  return { left, top, width: right - left + 1, height: bottom - top + 1 };
}

function overlayFor(clip, frame, frameCount, pose) {
  const t = frameCount <= 1 ? 0 : frame / (frameCount - 1);
  const wave = Math.sin(Math.PI * t);
  const overlays = [];
  const overlay = pose.overlay;
  if (!overlay || wave <= 0.05) return overlays;

  const opacity = Math.min(0.82, 0.22 + wave * 0.62);
  if (overlay === "slash" || overlay === "airSlash" || overlay === "backSlash" || overlay === "lowSlash") {
    const low = overlay === "lowSlash";
    const air = overlay === "airSlash";
    const back = overlay === "backSlash";
    overlays.push(svgComposite(`
      <path d="${back ? "M178 132 C118 184 112 242 188 306" : low ? "M216 310 C292 342 370 330 410 286" : air ? "M230 116 C314 132 392 190 418 258" : "M224 130 C316 166 390 214 420 284"}"
        fill="none" stroke="#b8a5ff" stroke-width="${12 + pose.strength * 4}" stroke-linecap="round" opacity="${opacity}"/>
      <path d="${back ? "M182 142 C132 188 126 238 190 292" : low ? "M230 318 C304 334 366 318 396 290" : air ? "M238 126 C318 146 374 192 398 246" : "M236 142 C308 172 366 220 394 270"}"
        fill="none" stroke="#f4efff" stroke-width="4" stroke-linecap="round" opacity="${opacity * 0.8}"/>
    `));
  }
  if (overlay === "shield") {
    overlays.push(svgComposite(`
      <ellipse cx="262" cy="210" rx="${46 + 8 * wave}" ry="${112 + 10 * wave}" fill="none" stroke="#b8a5ff" stroke-width="8" opacity="${opacity}"/>
      <ellipse cx="262" cy="210" rx="${28 + 6 * wave}" ry="${82 + 8 * wave}" fill="none" stroke="#ffffff" stroke-width="2" opacity="${opacity * 0.62}"/>
    `));
  }
  if (overlay === "orb") {
    overlays.push(svgComposite(`
      <circle cx="${286 + 24 * wave}" cy="${176 - 10 * wave}" r="${14 + 20 * wave}" fill="#15122f" opacity="${opacity * 0.72}"/>
      <circle cx="${286 + 24 * wave}" cy="${176 - 10 * wave}" r="${10 + 16 * wave}" fill="none" stroke="#d8ceff" stroke-width="5" opacity="${opacity}"/>
      <path d="M250 178 C278 ${144 - 18 * wave} 332 ${144 - 28 * wave} 366 180" fill="none" stroke="#6f5cff" stroke-width="3" opacity="${opacity * 0.78}"/>
    `));
  }
  if (overlay === "phaseTrail") {
    overlays.push(svgComposite(`
      <path d="M92 286 C154 250 226 218 348 184" fill="none" stroke="#6f5cff" stroke-width="${20 + 12 * wave}" stroke-linecap="round" opacity="${opacity * 0.38}"/>
      <path d="M156 320 C230 272 312 230 426 210" fill="none" stroke="#d8ceff" stroke-width="5" stroke-linecap="round" opacity="${opacity * 0.78}"/>
    `));
  }
  if (overlay === "anchor") {
    overlays.push(svgComposite(`
      <circle cx="160" cy="258" r="${22 + 28 * wave}" fill="none" stroke="#b8a5ff" stroke-width="7" opacity="${opacity}"/>
      <path d="M160 ${222 - 12 * wave} L160 ${300 + 12 * wave} M124 258 L196 258" stroke="#ffffff" stroke-width="4" stroke-linecap="round" opacity="${opacity * 0.78}"/>
    `));
  }
  if (overlay === "rift") {
    overlays.push(svgComposite(`
      <path d="M108 366 C178 344 258 386 346 352 C384 338 414 342 430 352" fill="none" stroke="#b8a5ff" stroke-width="${8 + 8 * wave}" stroke-linecap="round" opacity="${opacity}"/>
      <path d="M116 374 C204 358 292 380 420 366" fill="none" stroke="#ffffff" stroke-width="3" stroke-linecap="round" opacity="${opacity * 0.68}"/>
    `));
  }
  if (overlay === "upTrail") {
    overlays.push(svgComposite(`
      <path d="M214 344 C196 286 212 216 266 128 C286 94 300 72 300 54" fill="none" stroke="#6f5cff" stroke-width="${14 + 10 * wave}" stroke-linecap="round" opacity="${opacity * 0.42}"/>
      <path d="M244 342 C238 272 266 192 330 96" fill="none" stroke="#e8e1ff" stroke-width="5" stroke-linecap="round" opacity="${opacity * 0.72}"/>
    `));
  }
  if (overlay === "hit") {
    overlays.push(svgComposite(`
      <path d="M188 142 L150 112 M176 202 L124 198 M198 264 L152 304" stroke="#ff7e9e" stroke-width="6" stroke-linecap="round" opacity="${opacity}"/>
    `));
  }
  if (overlay === "impactDust") {
    overlays.push(svgComposite(`
      <ellipse cx="224" cy="388" rx="${84 + 28 * wave}" ry="${10 + 8 * wave}" fill="#b8a5ff" opacity="${opacity * 0.25}"/>
    `));
  }
  return overlays;
}

function svgComposite(inner) {
  const svg = Buffer.from(`<svg width="${FRAME_W}" height="${FRAME_H}" viewBox="0 0 ${FRAME_W} ${FRAME_H}" xmlns="http://www.w3.org/2000/svg">${inner}</svg>`);
  return { input: svg, left: 0, top: 0 };
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}
