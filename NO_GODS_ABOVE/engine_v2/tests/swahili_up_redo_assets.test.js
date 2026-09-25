const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const root=path.resolve(__dirname,'../../..');
const base=path.join(root,'tools/nga-forge/production/characters/swahili/reviews/up-specials-redo-drafts-v1/runtime-v1');
const manifest=JSON.parse(fs.readFileSync(path.join(base,'manifest.json'),'utf8'));
for(const key of ['special_up_medium','special_up_heavy']){
  assert.equal(manifest.clips[key].frames.length,12);
  for(let n=1;n<=12;n++){
    const file=fs.readFileSync(path.join(base,key,String(n).padStart(2,'0')+'.png'));
    assert.equal(file.readUInt32BE(16),448);assert.equal(file.readUInt32BE(20),448);
    assert.equal(file[25],6,'RGBA PNG required');
    assert.ok(manifest.clips[key].frames[n-1].alphaZeroPixels>10000);
  }
}
const source=fs.readFileSync(path.join(root,'NO_GODS_ABOVE/engine_v2/src/versus/presentation.ts'),'utf8');
assert.ok(source.includes('Object.assign(SWAHILI_ATTACK_CLIPS, UP_REDO_CLIPS)'));
assert.ok(source.includes('frameStarts: [0,3,7,11,13,15,18,21,24,27,30,33]'));
assert.ok(source.includes('frameStarts: [0,8,18,27,34,37,40,44,48,53,58,62]'));
console.log('PASS: 24 RGBA runtime cells, both overrides, preserved phase durations. Visual continuity is a separate flagged review.');
