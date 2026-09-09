const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto'),assert=require('node:assert/strict');
const root=path.resolve(__dirname,'..'),read=p=>JSON.parse(fs.readFileSync(path.join(root,p),'utf8').replace(/^\uFEFF/,'')),hash=p=>crypto.createHash('sha256').update(fs.readFileSync(p)).digest('hex').toUpperCase();
const m=read('public/lamuh-legacy-v2/ultimate-v1/manifest.json');
assert.equal(m.candidateOnly,true);assert.equal(m.deployable,false);assert.equal(m.humanApproval,null);
const lengths={starter:52,confirm:18,elbow:24,knee:24,charge:100,beam:36,recovery:38};
for(const [key,length]of Object.entries(lengths)){
 const s=m.sequences[key];assert.equal(s.durationTicks,length);assert.equal(s.frames.length,s.exposureTicks.length);assert.equal(s.exposureTicks.reduce((a,b)=>a+b,0),length);
 const p=read('content-source/characters/lamuh-legacy-v2/ultimate-packages-v1/'+key+'/animation.package.json');
 assert.equal(p.simulationLength,length);assert.equal(p.combatTrack.damage,key==='starter'?40:0,'visual clips do not duplicate interaction damage');
 for(const f of s.frames){assert.equal(hash(path.join(root,'public',f.publicPath)),f.sha256);if(f.sourceOrigin==='normalized_candidate_art')assert.equal(hash(path.join(root,'content-source/characters/lamuh-legacy-v2/ultimate-frames-v1',path.basename(f.publicPath))),f.sha256);}
}
assert.equal(m.confirmedInteraction.contacts.length,4);assert.equal(m.confirmedInteraction.contacts.reduce((a,c)=>a+c.damage,0),280);
assert.deepEqual(m.confirmedInteraction.contacts.map(c=>c.tick),[18,24,50,178]);
assert.equal(m.auraFrames.length,2);assert.equal(m.beamFrames.length,2);
assert.equal(m.beamLengthPixels,900);
for(const f of [...m.auraFrames,...m.beamFrames]){assert.equal(hash(path.join(root,'public',f.publicPath)),f.sha256);assert.equal(hash(path.join(root,'content-source/characters/lamuh-legacy-v2/ultimate-frames-v1',path.basename(f.publicPath))),f.sha256);}
assert.deepEqual(m.beamFrames[0].root,{x:768,y:1124});
const a=require('../dist/data/fighters').fighterDefinitions.lamuh_legacy_v2.attacks.legacy_crown_of_no_gods;
assert.deepEqual(m.combatProfile,a);
assert.ok(fs.existsSync(path.join(root,'generated/manifests/lamuh_ultimate_v1.candidate.runtime.json')));
console.log('Crown content: source/public hashes, seven timelines, starter core parity, four contacts and pending review pass');
