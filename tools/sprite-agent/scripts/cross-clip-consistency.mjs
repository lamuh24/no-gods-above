#!/usr/bin/env node

import fs from "node:fs/promises";
import path from "node:path";
import sharp from "../node_modules/sharp/lib/index.js";

const args = parseArgs(process.argv.slice(2));
const manifestPath = required(args, "manifest");
const outputPath = required(args, "output");
const writeManifest = args["write-manifest"] ?? null;
const manifest = JSON.parse(await fs.readFile(manifestPath, "utf8"));
const root = path.resolve(args["repo-root"] ?? process.cwd());
const alphaThreshold = 24;
const standing = new Set([
  "idle", "walk_forward", "walk_backward", "block", "hit_stun",
  "stand_light", "stand_medium", "stand_heavy", "forward_medium", "forward_heavy",
  "back_light", "back_medium", "back_heavy", "neutral_special_light", "neutral_special_medium",
  "neutral_special_heavy", "forward_special_light", "forward_special_medium", "forward_special_heavy",
  "back_special_light", "back_special_medium", "back_special_heavy"
]);

const idle = manifest.clips.find((clip) => clip.clipId === "idle");
if (!idle) throw new Error("Manifest has no idle clip.");
const canonical = await measureClip(idle, 0);
const heightTolerancePct = 8;
const suitHueToleranceDeg = 18;
const results = [];

for (const clip of manifest.clips) {
  const sampleFrame = Number(clip.crossClipConsistency?.sampleFrame ?? 0);
  const metric = await measureClip(clip, sampleFrame);
  const heightDeviationPct = round((metric.bodyHeight - canonical.bodyHeight) / canonical.bodyHeight * 100, 1);
  const suitHueDeviationDeg = round(angleDistance(metric.suitHueDeg, canonical.suitHueDeg), 1);
  const standingComparable = standing.has(clip.clipId);
  const issues = [];
  if (standingComparable && Math.abs(heightDeviationPct) > heightTolerancePct) issues.push("body_height");
  if (standingComparable && suitHueDeviationDeg > suitHueToleranceDeg) issues.push("suit_hue");
  results.push({
    clipId: clip.clipId,
    sampleFrame,
    postureClass: standingComparable ? "standing_start" : "posture_specific",
    ...metric,
    heightDeviationPct,
    suitHueDeviationDeg,
    status: issues.length ? "fail" : "pass",
    issues
  });
}

const report = {
  schemaVersion: "1.0.0",
  reportKind: "cross_clip_consistency",
  generatedAt: new Date().toISOString(),
  manifest: manifestPath.replaceAll("\\", "/"),
  approvedForLiveRoster: false,
  canonical: {
    sourceClip: "idle",
    sampleFrame: 0,
    bodyHeightPx: canonical.bodyHeight,
    baselineY: canonical.bodyBottom,
    suitHueDeg: canonical.suitHueDeg,
    suitHueBandDeg: [round(canonical.suitHueDeg - suitHueToleranceDeg, 1), round(canonical.suitHueDeg + suitHueToleranceDeg, 1)],
    latticeHueDeg: canonical.latticeHueDeg,
    hairFleckDensityPct: canonical.hairFleckDensityPct,
    heightTolerancePct,
    suitHueToleranceDeg
  },
  summary: {
    clipCount: results.length,
    passed: results.filter((item) => item.status === "pass").length,
    failed: results.filter((item) => item.status === "fail").length,
    offenders: results.filter((item) => item.status === "fail").map((item) => item.clipId)
  },
  clips: results
};

await fs.mkdir(path.dirname(outputPath), { recursive: true });
await fs.writeFile(outputPath, `${JSON.stringify(report, null, 2)}\n`);

if (writeManifest) {
  manifest.crossClipConsistency = {
    gate: "cross_clip_consistency",
    status: report.summary.failed ? "fail" : "pass",
    canonical: report.canonical,
    report: path.relative(root, outputPath).replaceAll("\\", "/")
  };
  for (const clip of manifest.clips) {
    const result = results.find((item) => item.clipId === clip.clipId);
    clip.crossClipConsistency = {
      sampleFrame: result.sampleFrame,
      postureClass: result.postureClass,
      bodyHeightPx: result.bodyHeight,
      heightDeviationPct: result.heightDeviationPct,
      suitHueDeg: result.suitHueDeg,
      suitHueDeviationDeg: result.suitHueDeviationDeg,
      latticeHueDeg: result.latticeHueDeg,
      hairFleckDensityPct: result.hairFleckDensityPct,
      status: result.status
    };
  }
  await fs.writeFile(writeManifest, `${JSON.stringify(manifest, null, 2)}\n`);
}

console.log(JSON.stringify(report.summary));
if (report.summary.failed) process.exitCode = 2;

async function measureClip(clip, frameIndex) {
  const source = path.resolve(root, clip.normalizedSheet);
  const frame = await sharp(source).extract({ left: frameIndex * clip.frameWidth, top: 0, width: clip.frameWidth, height: clip.frameHeight }).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  const { data, info } = frame;
  let minY = info.height, maxY = -1;
  const suitHues = [], latticeHues = [];
  let hairOpaque = 0, hairFlecks = 0;
  for (let y = 0; y < info.height; y++) for (let x = 0; x < info.width; x++) {
    const o = (y * info.width + x) * info.channels;
    if ((data[o + 3] ?? 0) <= alphaThreshold) continue;
    minY = Math.min(minY, y); maxY = Math.max(maxY, y);
  }
  const bodyHeight = maxY - minY + 1;
  const hairLimit = minY + Math.round(bodyHeight * 0.22);
  for (let y = minY; y <= maxY; y++) for (let x = 0; x < info.width; x++) {
    const o = (y * info.width + x) * info.channels;
    if ((data[o + 3] ?? 0) <= alphaThreshold) continue;
    const hsv = rgbToHsv(data[o], data[o + 1], data[o + 2]);
    if (hsv.v < .48 && hsv.s > .18 && hsv.h >= 190 && hsv.h <= 300) suitHues.push(hsv.h);
    if (hsv.v > .46 && hsv.s > .25 && (hsv.h <= 70 || hsv.h >= 340)) latticeHues.push(hsv.h > 180 ? hsv.h - 360 : hsv.h);
    if (y <= hairLimit) {
      hairOpaque++;
      if (hsv.v > .62 && hsv.s < .38) hairFlecks++;
    }
  }
  return {
    bodyTop: minY,
    bodyBottom: maxY,
    bodyHeight,
    suitHueDeg: round(circularMean(suitHues), 1),
    latticeHueDeg: round(mean(latticeHues), 1),
    hairFleckDensityPct: round(hairOpaque ? hairFlecks / hairOpaque * 100 : 0, 2),
    suitSamplePixels: suitHues.length,
    latticeSamplePixels: latticeHues.length
  };
}

function rgbToHsv(r, g, b) { r/=255; g/=255; b/=255; const max=Math.max(r,g,b), min=Math.min(r,g,b), d=max-min; let h=0; if(d) h=max===r?60*(((g-b)/d)%6):max===g?60*((b-r)/d+2):60*((r-g)/d+4); if(h<0)h+=360; return {h,s:max?d/max:0,v:max}; }
function circularMean(values) { if (!values.length) return 0; const x=values.reduce((s,h)=>s+Math.cos(h*Math.PI/180),0); const y=values.reduce((s,h)=>s+Math.sin(h*Math.PI/180),0); return (Math.atan2(y,x)*180/Math.PI+360)%360; }
function mean(values) { return values.length ? values.reduce((a,b)=>a+b,0)/values.length : 0; }
function angleDistance(a,b) { const d=Math.abs(a-b)%360; return Math.min(d,360-d); }
function round(n,d) { const p=10**d; return Math.round(n*p)/p; }
function parseArgs(tokens) { const out={}; for(let i=0;i<tokens.length;i++){ if(!tokens[i].startsWith("--"))continue; const k=tokens[i].slice(2); const n=tokens[i+1]; out[k]=n&&!n.startsWith("--")?(i++,n):true; } return out; }
function required(obj,key) { if(!obj[key]||obj[key]===true) throw new Error(`Missing --${key}`); return obj[key]; }
