const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const root=path.resolve(__dirname,'../../..');
const base=path.join(root,'tools/nga-forge/production/characters/swahili/reviews/special-neutral-medium-hook-headbutt-v2/runtime-flow-v2');
const m=JSON.parse(fs.readFileSync(path.join(base,'manifest.json'),'utf8'));
assert.equal(m.frames.length,12);assert.equal(m.frameStarts[9],32);
for(let i=1;i<=12;i++){
 const png=fs.readFileSync(path.join(base,String(i).padStart(2,'0')+'.png'));
 assert.equal(png.readUInt32BE(16),448);assert.equal(png.readUInt32BE(20),448);assert.equal(png[25],6);
 assert.ok(m.frames[i-1].alphaZeroPixels>90000);
}
const src=fs.readFileSync(path.join(root,'NO_GODS_ABOVE/engine_v2/src/versus/presentation.ts'),'utf8');
assert.ok(src.includes("hookFlowFrames as hookHeadbuttFrames"));
assert.ok(src.includes('frameStarts: [0,4,7,11,14,18,22,26,30,32,38,45]'));
console.log('PASS12 hook flow RGBA cells, correct presenter source and unchanged headbutt contact tick');
