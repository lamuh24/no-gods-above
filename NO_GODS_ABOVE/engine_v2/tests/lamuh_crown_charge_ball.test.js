const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const {crownBallGrowth}=require('../dist/lamuhlegacy/crownCharge');
const m=require('../public/lamuh-legacy-v2/ultimate-v1/manifest.json'),b=m.chargeBall;
assert.equal(crownBallGrowth(65),null);assert.equal(crownBallGrowth(174),null);
assert.equal(crownBallGrowth(66).diameter,24);assert.equal(crownBallGrowth(165).diameter,240);
for(let t=67;t<166;t++)assert.ok(crownBallGrowth(t).diameter>crownBallGrowth(t-1).diameter);
for(let t=167;t<174;t++)assert.ok(crownBallGrowth(t).diameter<crownBallGrowth(t-1).diameter);
for(const f of m.sequences.charge.frames)assert.ok(b.handSockets[path.basename(f.publicPath)],'per-angle hand socket');
for(const f of b.frames){const bytes=fs.readFileSync(path.join(__dirname,'../public',f.publicPath));assert.equal(crypto.createHash('sha256').update(bytes).digest('hex').toUpperCase(),f.sha256);}
assert.equal(b.startTick,66);assert.equal(b.releaseTick,166);assert.equal(m.confirmedInteraction.visibleImpactCount,4);
console.log('Crown charge ball: monotonic24→240 growth, release consumption, per-view sockets and preserved aura hashes pass');
