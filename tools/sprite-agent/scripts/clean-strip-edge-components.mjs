#!/usr/bin/env node
import fs from "node:fs/promises";
import path from "node:path";
import sharp from "../node_modules/sharp/lib/index.js";
const [input,output]=process.argv.slice(2);if(!output)throw new Error("Usage: clean-strip-edge-components.mjs <input> <output>");
const meta=await sharp(input).metadata();if(!meta.width||!meta.height||meta.height!==448||meta.width%448)throw new Error("Expected 448px horizontal strip.");
const count=meta.width/448,frames=[],removed=[];
for(let i=0;i<count;i++){
 const {data,info}=await sharp(input).extract({left:i*448,top:0,width:448,height:448}).ensureAlpha().raw().toBuffer({resolveWithObject:true});
 const seen=new Uint8Array(448*448);let removedPixels=0,removedComponents=0;
 for(let y=0;y<448;y++)for(let x=0;x<448;x++){const start=y*448+x;if(seen[start]||(data[start*info.channels+3]??0)<=1)continue;const q=[start],pixels=[];seen[start]=1;let minX=x,maxX=x,minY=y,maxY=y;for(let h=0;h<q.length;h++){const p=q[h],px=p%448,py=Math.floor(p/448);pixels.push(p);minX=Math.min(minX,px);maxX=Math.max(maxX,px);minY=Math.min(minY,py);maxY=Math.max(maxY,py);for(let dy=-1;dy<=1;dy++)for(let dx=-1;dx<=1;dx++){if(!dx&&!dy)continue;const nx=px+dx,ny=py+dy;if(nx<0||nx>=448||ny<0||ny>=448)continue;const n=ny*448+nx;if(!seen[n]&&(data[n*info.channels+3]??0)>1){seen[n]=1;q.push(n);}}}
   const width=maxX-minX+1,touchesEdge=minX<=18||maxX>=429,isArtifact=touchesEdge&&pixels.length<5000&&width<80;
   if(isArtifact){removedComponents++;removedPixels+=pixels.length;for(const p of pixels)data[p*info.channels+3]=0;}
 }
 removed.push({frame:i,removedComponents,removedPixels});frames.push({input:await sharp(data,{raw:info}).png().toBuffer(),left:i*448,top:0});
}
await fs.mkdir(path.dirname(output),{recursive:true});await sharp({create:{width:count*448,height:448,channels:4,background:{r:0,g:0,b:0,alpha:0}}}).composite(frames).png().toFile(output);console.log(JSON.stringify({output,removed},null,2));
