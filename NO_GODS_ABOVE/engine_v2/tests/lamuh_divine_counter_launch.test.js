const assert=require('assert');
const {createMatch,tick,saveSnapshot,restoreSnapshot,tickWithFighterOrder}=require('../dist/core/engine');
const {fighterDefinitions}=require('../dist/data/fighters');
const H='legacy_divine_vanish_heavy', response=fighterDefinitions.lamuh_legacy_v2.attacks[H].strikeCounter.response;
const opposite=id=>id==='p1'?'p2':'p1';
function setup(id='p1',corner=false){
 const s=createMatch(921,{matchId:'counter-launch',p1Kind:'lamuh_legacy_v2',p2Kind:'lamuh_legacy_v2',p1X:-37,p2X:37});
 const f=s.fighters[id],v=s.fighters[opposite(id)];
 if(corner){v.x=id==='p1'?s.stage.right:s.stage.left;f.x=v.x-f.facing*74;}
 for(let t=0;t<8;t++)tick(s,t===0?{[id]:{special:true,heavy:true,[id==='p1'?'left':'right']:true}}:t===4?{[opposite(id)]:{light:true}}:{});
 assert.ok(f.divineCounterResponse);return s;
}
function advance(s,n){for(let i=0;i<n;i++)tick(s,{});}
function contactsAndTrajectory(){
 for(const id of ['p1','p2'])for(const corner of [false,true]){
  const s=setup(id,corner),f=s.fighters[id],v=s.fighters[opposite(id)],start=f.x;
  while(f.phaseTick<response.projectile.releaseTick)tick(s,{});
  assert.strictEqual(v.hitCountTaken,corner?2:1);assert.ok(v.y<0,'kick lifts victim before ball');
  const p=s.projectiles[0];if(!corner){assert.ok(Math.abs(v.x-f.x)>=300,'kick sends victim far away before shot');assert.ok(p,'real projectile release');
  assert.strictEqual(p.velocityX,f.attackFacing*response.projectile.speed);assert.strictEqual(p.velocityY,response.projectile.initialVelocityY);
  assert.strictEqual(p.y,f.y+response.projectile.spawnOffset.y);assert.strictEqual(p.previousX,p.x,'no phantom muzzle sweep');}
  const snapshot=saveSnapshot(s),restored=restoreSnapshot(snapshot);
  advance(s,100);advance(restored,100);assert.deepStrictEqual(s.checksums,restored.checksums);
  assert.strictEqual(v.hitCountTaken,2,`two contacts ${id} corner${corner}`);assert.strictEqual(v.health,932);assert.strictEqual(f.x,start);
  assert.strictEqual(s.projectileSpawnLedger.length,1);assert.ok(s.projectileEventLedger.some(x=>x.endsWith(':hit')));
 }
}
function interruptBeforeAndAfterRelease(){
 for(const id of ['p1','p2']){
  const before=setup(id),f=before.fighters[id];while(f.phaseTick<19)tick(before,{});
  tick(before,{[opposite(id)]:{burst:true}});advance(before,80);
  assert.ok(!before.projectileSpawnLedger?.length,'burst before release prevents delayed shot');assert.ok(!f.divineCounterResponse);
  const after=setup(id),a=after.fighters[id];while(a.phaseTick<response.projectile.releaseTick)tick(after,{});
  // Owner state interruption cannot delete an already independent entity.
  a.phase='hitstun';a.currentAttack=null;a.divineCounterResponse=undefined;a.hitstun=20;
  advance(after,80);assert.ok(after.projectileEventLedger.some(x=>x.endsWith(':hit')));
 }
}
function untriggeredNeverFires(){
 const s=createMatch(923,{p1Kind:'lamuh_legacy_v2',p2Kind:'lamuh_legacy_v2'});
 tick(s,{p1:{left:true,special:true,heavy:true}});advance(s,100);
 assert.ok(!s.projectileSpawnLedger?.length);assert.strictEqual(s.fighters.p2.hitCountTaken,0);
}
for(const test of [contactsAndTrajectory,interruptBeforeAndAfterRelease,untriggeredNeverFires]){test();console.log(`PASS ${test.name}`);}
