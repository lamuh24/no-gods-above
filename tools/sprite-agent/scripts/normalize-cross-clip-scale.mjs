#!/usr/bin/env node
import fs from "node:fs/promises";
import path from "node:path";
import sharp from "../node_modules/sharp/lib/index.js";

const [manifestFile, auditFile, outputRoot, candidateManifestFile] = process.argv.slice(2);
if (!candidateManifestFile) throw new Error("Usage: normalize-cross-clip-scale.mjs <manifest> <audit> <output-root> <candidate-manifest>");
const manifest = JSON.parse(await fs.readFile(manifestFile, "utf8"));
const audit = JSON.parse(await fs.readFile(auditFile, "utf8"));
const canonicalHeight = audit.canonical.bodyHeightPx;
const baselineY = manifest.spriteStandard.baselineY - 1;
const anchorX = manifest.spriteStandard.frameWidth / 2;
const modified = [];

for (const clip of manifest.clips) {
  const metric = audit.clips.find((item) => item.clipId === clip.clipId);
  if (!metric || metric.postureClass !== "standing_start" || metric.heightDeviationPct <= 8) continue;
  const scale = canonicalHeight / metric.bodyHeight;
  const input = path.resolve(clip.normalizedSheet);
  const outDir = path.join(outputRoot, clip.clipId);
  const output = path.join(outDir, `${clip.clipId}_consistency_candidate.png`);
  await fs.mkdir(outDir, { recursive: true });
  const frames = [];
  for (let index = 0; index < clip.frameCount; index++) {
    const frame = await sharp(input).extract({left:index*clip.frameWidth,top:0,width:clip.frameWidth,height:clip.frameHeight}).png().toBuffer();
    const meta = await sharp(frame).trim({background:{r:0,g:0,b:0,alpha:0}}).metadata();
    const left = meta.trimOffsetLeft ?? 0, top = meta.trimOffsetTop ?? 0;
    const trimmed = await sharp(frame).trim({background:{r:0,g:0,b:0,alpha:0}}).png().toBuffer();
    const tm = await sharp(trimmed).metadata();
    const width = Math.max(1, Math.round((tm.width ?? 1)*scale));
    const height = Math.max(1, Math.round((tm.height ?? 1)*scale));
    const originalCenterX = left + (tm.width ?? 1)/2;
    const originalBottom = top + (tm.height ?? 1)-1;
    const scaledCenterX = anchorX + (originalCenterX-anchorX)*scale;
    const scaledBottom = baselineY + (originalBottom-baselineY)*scale;
    const resized = await sharp(trimmed).resize(width,height,{kernel:"nearest"}).png().toBuffer();
    const canvas = await sharp({create:{width:clip.frameWidth,height:clip.frameHeight,channels:4,background:{r:0,g:0,b:0,alpha:0}}})
      .composite([{input:resized,left:Math.round(scaledCenterX-width/2),top:Math.round(scaledBottom-height+1)}]).png().toBuffer();
    frames.push({input:canvas,left:index*clip.frameWidth,top:0});
  }
  await sharp({create:{width:clip.frameWidth*clip.frameCount,height:clip.frameHeight,channels:4,background:{r:0,g:0,b:0,alpha:0}}}).composite(frames).png().toFile(output);
  clip.normalizedSheet = path.relative(process.cwd(), output).replaceAll("\\","/");
  clip.validationStatus = "cross_clip_review_required";
  clip.approvedForPreview = false;
  clip.crossClipConsistency = {...clip.crossClipConsistency, correction:"uniform_scale", scaleFactor:Number(scale.toFixed(4)), sourceBodyHeightPx:metric.bodyHeight, targetBodyHeightPx:canonicalHeight};
  modified.push({clipId:clip.clipId,scaleFactor:Number(scale.toFixed(4)),output:clip.normalizedSheet});
}
manifest.generatedAt = new Date().toISOString();
manifest.approvedForLiveRoster = false;
manifest.crossClipConsistency = {...manifest.crossClipConsistency,status:"review_required",candidateOnly:true};
await fs.mkdir(path.dirname(candidateManifestFile),{recursive:true});
await fs.writeFile(candidateManifestFile,`${JSON.stringify(manifest,null,2)}\n`);
console.log(JSON.stringify({modifiedCount:modified.length,modified},null,2));
