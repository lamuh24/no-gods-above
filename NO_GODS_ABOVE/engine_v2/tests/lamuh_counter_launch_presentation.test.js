const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const {createMatch,tick}=require('../dist/core/engine');
const {fighterDefinitions}=require('../dist/data/fighters');
const {contactCue,contactScreenAnchor}=require('../dist/lamuhlegacy/quality');
const {compileFromPath}=require('../scripts/production_contracts');
const root=path.join(__dirname,'..'),m=JSON.parse(fs.readFileSync(path.join(root,'public/lamuh-legacy-v2/counter-launch-v4/manifest.json')));
const H='legacy_divine_vanish_heavy',d=fighterDefinitions.lamuh_legacy_v2.attacks[H].strikeCounter.response;
assert.equal(m.response.exposureTicks.reduce((a,b)=>a+b,0),55);
assert.equal(m.stance.exposureTicks.reduce((a,b)=>a+b,0),40);
assert.equal(m.response.exposureTicks.slice(0,3).reduce((a,b)=>a+b,0),12);
assert.equal(m.response.exposureTicks.slice(0,7).reduce((a,b)=>a+b,0),32);
assert.equal(m.response.frames[0].bodyAbsent,true);
assert.match(m.response.frames[7].role,/empty-palm/);
assert.equal(m.response.frames.filter(f=>f.contact).length,1,'one body contact; second hit is real projectile');
assert.equal(m.humanApproval,null);assert.equal(m.deployable,false);
for(const f of [...m.stance.frames,...m.response.frames,...m.projectileFrames])assert.equal(crypto.createHash('sha256').update(fs.readFileSync(path.join(root,'public',f.publicPath))).digest('hex').toUpperCase(),f.sha256);
const units=.3/1.3;
const kick={x:(m.sockets.kick.x-768)*units,y:(m.sockets.kick.y-1360)*units};
const box=d.hitboxes[0].rect;assert.ok(kick.x>=box.x&&kick.x<=box.x+box.w&&kick.y>=box.y&&kick.y<=box.y+box.h,'authored heel inside registered kick');
const palm={x:(m.sockets.ball.x-768)*units,y:(m.sockets.ball.y-1360)*units};
assert.ok(Math.abs(palm.x-d.projectile.spawnOffset.x)<1&&Math.abs(palm.y-d.projectile.spawnOffset.y)<1,'ball starts on measured palm');
for(const side of ['p1','p2']){
 const vside=side==='p1'?'p2':'p1',s=createMatch(888,{p1Kind:'lamuh_legacy_v2',p2Kind:'lamuh_legacy_v2',p1X:-37,p2X:37});
 let kickCue=false,ballHit=false;
 for(let i=0;i<130;i++){
  tick(s,i===0?{[side]:{special:true,heavy:true,[side==='p1'?'left':'right']:true}}:i===4?{[vside]:{light:true}}:{});
  const cue=contactCue(s);
  if(cue?.attackId===H){kickCue=true;assert.equal(cue.contactSocketIndex,0);assert.ok(s.presentationEventLedger.includes(cue.id));
   const socket={...m.response.frames[3],...m.sockets.kick,sourcePath:m.response.frames[3].publicPath,frame:3};
   const anchor=contactScreenAnchor(cue,{attacks:{[H]:[socket]}},x=>x*1.3,y=>y*1.3);
   assert.equal(anchor.x,cue.attackerRoot.x*1.3+(socket.x-768)*.3*cue.facing);
  }
  if(s.lastProjectileEvent?.type==='hit'&&s.lastProjectileEvent.attackId===H)ballHit=true;
 }
 assert.ok(kickCue&&ballHit,'distinct registered kick feedback and ball collision both observed');
 assert.equal(s.fighters[vside].hitCountTaken,2);
}
compileFromPath(path.join(root,'content-source/characters/lamuh-legacy-v2/counter-launch-packages-v4/counter-launch.bundle.json'));
console.log('PASS counter V4 source hashes, timeline, physical foot/palm sockets, mirrored feedback and Forge');
