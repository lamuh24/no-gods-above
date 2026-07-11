#!/usr/bin/env node
import fs from "node:fs/promises";
import path from "node:path";
import sharp from "../node_modules/sharp/lib/index.js";

const args=parseArgs(process.argv.slice(2));
const source=req("source"), output=req("output"), frameCount=Number(req("frames"));
const referenceFrame=Number(args["reference-frame"]??0), targetHeight=Number(args["target-height"]??352);
const holds=new Map(String(args.holds??"").split(",").filter(Boolean).map(x=>x.split(":").map(Number)));
const meta=await sharp(source).metadata(); if(!meta.width||!meta.height)throw new Error("Unreadable source.");
const rawFrames=[];
for(let i=0;i<frameCount;i++){
  const left=Math.round(i*meta.width/frameCount),right=Math.round((i+1)*meta.width/frameCount);
  rawFrames.push(await sharp(source).extract({left,top:0,width:right-left,height:meta.height}).png().toBuffer());
}
const referenceBox=await alphaBox(rawFrames[referenceFrame]);
const scale=targetHeight/referenceBox.height, prepared=[];
for(let i=0;i<frameCount;i++){
  let frame=rawFrames[i];
  if(holds.has(i)){
    const base=rawFrames[holds.get(i)];
    const bm=await sharp(base).metadata();
    const overlay=await sharp(frame).resize({width:bm.width,height:bm.height,fit:"fill",kernel:"nearest"}).png().toBuffer();
    frame=await sharp(base).composite([{input:overlay,left:0,top:0}]).png().toBuffer();
  }
  const resized=await sharp(frame).resize({width:Math.round((await sharp(frame).metadata()).width*scale),height:Math.round(meta.height*scale),kernel:"nearest"}).png().toBuffer();
  const box=await alphaBox(resized), rm=await sharp(resized).metadata();
  const left=Math.round(224-(rm.width??1)/2), top=Math.round(381-box.bottom);
  const canvas=await placeClipped(resized,left,top,448,448);
  prepared.push({input:canvas,left:i*448,top:0});
}
await fs.mkdir(path.dirname(output),{recursive:true});
await sharp({create:{width:448*frameCount,height:448,channels:4,background:{r:0,g:0,b:0,alpha:0}}}).composite(prepared).png().toFile(output);
console.log(JSON.stringify({output,frameCount,referenceFrame,referenceHeight:referenceBox.height,targetHeight,scale:Number(scale.toFixed(4)),holds:Object.fromEntries(holds)},null,2));

async function alphaBox(input){const{data,info}=await sharp(input).ensureAlpha().raw().toBuffer({resolveWithObject:true});let minX=info.width,minY=info.height,maxX=-1,maxY=-1;for(let y=0;y<info.height;y++)for(let x=0;x<info.width;x++){if((data[(y*info.width+x)*info.channels+3]??0)>24){minX=Math.min(minX,x);minY=Math.min(minY,y);maxX=Math.max(maxX,x);maxY=Math.max(maxY,y);}}return{x:minX,y:minY,right:maxX,bottom:maxY,width:maxX-minX+1,height:maxY-minY+1};}
async function placeClipped(input,left,top,w,h){const m=await sharp(input).metadata(),iw=m.width??1,ih=m.height??1;const sx=Math.max(0,-left),sy=Math.max(0,-top),dx=Math.max(0,left),dy=Math.max(0,top),cw=Math.min(iw-sx,w-dx),ch=Math.min(ih-sy,h-dy);if(cw<=0||ch<=0)throw new Error("Frame lies outside canvas.");const crop=await sharp(input).extract({left:sx,top:sy,width:cw,height:ch}).png().toBuffer();return sharp({create:{width:w,height:h,channels:4,background:{r:0,g:0,b:0,alpha:0}}}).composite([{input:crop,left:dx,top:dy}]).png().toBuffer();}
function parseArgs(t){const o={};for(let i=0;i<t.length;i++){if(!t[i].startsWith("--"))continue;const k=t[i].slice(2),n=t[i+1];o[k]=n&&!n.startsWith("--")?(i++,n):true;}return o;}function req(k){if(!args[k]||args[k]===true)throw new Error(`Missing --${k}`);return args[k];}
