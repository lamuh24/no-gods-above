// Export the existing editable aura into individual animation source PNGs.
// This is deterministic native-art rasterization, not a character redraw.
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto'),assert=require('node:assert');
const {chromium}=require('playwright');
const root=path.resolve(__dirname,'..'),repo=path.resolve(root,'../..');
const base=path.join(root,'content-source/characters/lamuh-legacy-v2');
const review=path.join(repo,'tools/nga-forge/review/lamuh-legacy-v2-heaven-splitter-v1');
const source=path.join(base,'heaven-heavy-aura-frames-v3'),publicDir=path.join(root,'public/lamuh-legacy-v2/heaven-heavy-aura-v3');
const hash=p=>crypto.createHash('sha256').update(fs.readFileSync(p)).digest('hex').toUpperCase();
const h=JSON.parse(fs.readFileSync(path.join(base,'heaven-splitter-family.candidate.v1.json'))).variants.heavy;
const frames=h.v2.frames.map(f=>({...f,publicPath:f.bodyOnlyPublicPath||f.publicPath,sha256:f.bodyOnlySha256||f.sha256}));
for(const frame of frames)assert.strictEqual(hash(path.join(root,'public',frame.publicPath)),frame.sha256,'Body source changed');
fs.mkdirSync(source,{recursive:true});fs.mkdirSync(publicDir,{recursive:true});
(async()=>{
 const browser=await chromium.launch({headless:true,executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe'});
 try{
  const page=await browser.newPage();await page.goto('http://127.0.0.1:4177/lamuh-legacy-sandbox.html');
  const result=await page.evaluate(async({frames,exposures})=>{
   const {drawHeavenArc}=await import('/src/lamuhlegacy/heavenSplitter.ts');
   const images=await Promise.all(frames.map(f=>new Promise((resolve,reject)=>{const im=new Image();im.onload=()=>resolve(im);im.onerror=reject;im.src=f.publicPath;})));
   const bounds=data=>{const b={minX:2048,minY:1536,maxX:-1,maxY:-1};for(let y=0;y<1536;y++)for(let x=0;x<2048;x++)if(data[(y*2048+x)*4+3]){b.minX=Math.min(b.minX,x);b.maxX=Math.max(b.maxX,x);b.minY=Math.min(b.minY,y);b.maxY=Math.max(b.maxY,y);}return b;};
   const output=[];let tick=0;
   for(let i=0;i<frames.length;i++){
    const c=document.createElement('canvas');c.width=2048;c.height=1536;
    const ctx=c.getContext('2d',{willReadFrequently:true});
    // One authored exposure per body pose; no animated runtime aura remains.
    if(i>=3&&i<=7){ctx.save();ctx.translate(768,1360);ctx.scale(1/.30,1/.30);drawHeavenArc(ctx,{kind:'lamuh_legacy_v2',currentAttack:'legacy_heaven_splitter_heavy',phaseTick:tick,attackFacing:1},0,0);ctx.restore();}
    const aura=c.toDataURL('image/png').split(',')[1];
    const auraData=ctx.getImageData(0,0,2048,1536).data;
    ctx.drawImage(images[i],0,0);const composed=ctx.getImageData(0,0,2048,1536).data;
    const composite=c.toDataURL('image/png').split(',')[1];
    const body=document.createElement('canvas');body.width=2048;body.height=1536;const bodyCtx=body.getContext('2d',{willReadFrequently:true});bodyCtx.drawImage(images[i],0,0);const raw=bodyCtx.getImageData(0,0,2048,1536).data;
    let opaqueBodyPixels=0,changedOpaqueBodyPixels=0,auraPixels=0;
    for(let p=0;p<raw.length;p+=4){
     if(auraData[p+3]>0)auraPixels++;
     if(raw[p+3]===255){opaqueBodyPixels++;if(raw[p]!==composed[p]||raw[p+1]!==composed[p+1]||raw[p+2]!==composed[p+2]||composed[p+3]!==255)changedOpaqueBodyPixels++;}
    }
    output.push({index:i,tick,composite,aura,opaqueBodyPixels,changedOpaqueBodyPixels,auraPixels,visibleBounds:bounds(composed),bodyVisibleBounds:bounds(raw)});tick+=exposures[i];
   }
   // Numbered source review from the exact baked sprites, no preview-only glow.
   const sheet=document.createElement('canvas');sheet.width=1880;sheet.height=1460;const s=sheet.getContext('2d');s.fillStyle='#080f14';s.fillRect(0,0,sheet.width,sheet.height);
   for(let i=0;i<output.length;i++){
    const im=await new Promise(resolve=>{const image=new Image();image.onload=()=>resolve(image);image.src='data:image/png;base64,'+output[i].composite;});
    const x=(i%4)*470,y=Math.floor(i/4)*365;s.strokeStyle='#79858b';s.strokeRect(x,y,469,364);s.fillStyle='#e6f6ff';s.font='bold 12px sans-serif';s.fillText(`${String(i).padStart(2,'0')} ${frames[i].role} | ${exposures[i]} ticks`,x+9,y+21);
    s.drawImage(im,x+235-768*.235,y+340-1360*.235,2048*.235,1536*.235);
   }
   return {frames:output,sheet:sheet.toDataURL('image/png').split(',')[1]};
  },{frames,exposures:h.timingCandidates.B.exposureTicks});
  const records=[];
  for(const f of result.frames){
   assert.strictEqual(f.changedOpaqueBodyPixels,0,'Aura damaged an opaque body pixel');
   assert(f.visibleBounds.minX>0&&f.visibleBounds.minY>0&&f.visibleBounds.maxX<2047&&f.visibleBounds.maxY<1535,'Composite touches canvas edge');
   const name=`heavy-aura-${String(f.index).padStart(2,'0')}.png`,file=path.join(source,name);
   fs.writeFileSync(file,Buffer.from(f.composite,'base64'));fs.copyFileSync(file,path.join(publicDir,name));
   const layer=path.join(source,`aura-only-${String(f.index).padStart(2,'0')}.png`);fs.writeFileSync(layer,Buffer.from(f.aura,'base64'));
   records.push({index:f.index,role:frames[f.index].role,publicPath:`/lamuh-legacy-v2/heaven-heavy-aura-v3/${name}`,sha256:hash(file),bodyOnlyPublicPath:frames[f.index].publicPath,bodyOnlySha256:frames[f.index].sha256,bodyVisibleBounds:f.bodyVisibleBounds,visibleBounds:f.visibleBounds,root:{x:768,y:1360},bodyCenter:frames[f.index].bodyCenter,contact:frames[f.index].contact,visibleImpact:frames[f.index].visibleImpact,auraBaked:true,auraSourceFrame:path.basename(layer),auraSourceSha256:hash(layer),authoredAuraTick:f.tick,auraPixels:f.auraPixels,opaqueBodyPixels:f.opaqueBodyPixels,changedOpaqueBodyPixels:f.changedOpaqueBodyPixels});
  }
  const sheet=path.join(publicDir,'heavy-authored-aura-numbered-contact-sheet.png');fs.writeFileSync(sheet,Buffer.from(result.sheet,'base64'));fs.copyFileSync(sheet,path.join(review,path.basename(sheet)));
  const report={schemaVersion:'1.0.0',version:3,candidateOnly:true,deployable:false,authoring:'Existing editable native aura exported into pose-aligned source PNGs; no AI redraw of body',userInput:'make the aura apart of the animation itself',sourceCodeSha256:hash(path.join(root,'src/lamuhlegacy/heavenSplitter.ts')),frames:records,exposureTicks:h.timingCandidates.B.exposureTicks,bodyScaleUnchanged:true,runtimeAuraOverlay:false,contactSheetPublicPath:'/lamuh-legacy-v2/heaven-heavy-aura-v3/'+path.basename(sheet)};
  fs.writeFileSync(path.join(review,'heavy-authored-aura-v3.report.json'),JSON.stringify(report,null,2)+'\n');
  console.log(`Baked ${records.length} fixed-root Heavy source frames; ${records.filter(f=>f.auraPixels>0).length} authored aura poses; zero changed opaque body pixels.`);
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
