const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const root=path.resolve(__dirname,'..');
const m=JSON.parse(fs.readFileSync(path.join(root,'public/lamuh-legacy-v2/down-specials-v1/manifest.json')));
const {fighterDefinitions}=require('../dist/data/fighters');
const {compileFromPath}=require('../scripts/production_contracts');
assert.equal(m.humanApproval,null);assert.equal(m.deployable,false);
for(const [strength,s]of Object.entries(m.variants)){
 const d=fighterDefinitions.lamuh_legacy_v2.attacks['legacy_aura_sweep_'+strength];
 assert.deepEqual(s.combatProfile,d);assert.equal(s.exposureTicks.reduce((a,b)=>a+b,0),d.startup+d.active+d.recovery);
 assert.equal(s.exposureTicks.slice(0,s.contactFrame).reduce((a,b)=>a+b,0),d.startup);
 assert.equal(s.frames.at(-1).publicPath,'/lamuh-legacy-v2/movement-v2/idle-00.png');
}
for(const f of [...Object.values(m.variants).flatMap(s=>s.frames),...m.projectileFrames]){
 const bytes=fs.readFileSync(path.join(root,'public',f.publicPath));
 assert.equal(crypto.createHash('sha256').update(bytes).digest('hex').toUpperCase(),f.sha256);
 assert.equal(bytes.readUInt32BE(16),2048);assert.equal(bytes.readUInt32BE(20),1536);assert.equal(bytes[25],6,'real RGBA required');
 assert.deepEqual(f.root,{x:768,y:1360});
}
compileFromPath(path.join(root,'content-source/characters/lamuh-legacy-v2/down-special-packages-v1/down-specials.bundle.json'));
console.log('PASS down-special source hashes/RGBA, authored contact timing, idle endpoints, core parity and Forge compile');
