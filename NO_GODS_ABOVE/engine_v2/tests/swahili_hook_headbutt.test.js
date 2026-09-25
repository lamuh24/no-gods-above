const assert=require('node:assert/strict');
const {createMatch,tick}=require('../dist');
const {tickWithFighterOrder,saveSnapshot,restoreSnapshot}=require('../dist/core/engine');
const make=(extra={})=>createMatch(941,{p1Kind:'lamuh_proto',p2Kind:'lamuh_proto',p1X:-75,p2X:75,swahiliAirSpecialsV1:true,...extra});
for(const side of ['p1','p2']){
 const target=side==='p1'?'p2':'p1',s=make();
 tick(s,{[side]:{special:true,medium:true}});
 assert.equal(s.throwInteraction.throwId,'swahili_hook_headbutt');
 for(let i=0;i<30;i++)tick(s,{});
 assert.equal(s.throwInteraction.result,'connected');
 assert.ok(Math.abs(s.fighters.p1.x-s.fighters.p2.x)<=75,'victim pulled close');
 const a=saveSnapshot(s),b=restoreSnapshot(a);
 for(let i=0;i<90;i++){tick(a,{});tickWithFighterOrder(b,{},['p2','p1']);}
 assert.deepEqual(a.fighters,b.fighters,'fighter iteration parity');
 assert.equal(a.fighters[target].health,935);
 assert.equal(a.fighters[target].hitCountTaken,1);
 assert.equal(a.throwInteraction,null);
 assert.notEqual(a.fighters[target].phase,'thrown');
}
for(const mode of ['far','jump','u-alone','disabled']){
 const s=make(mode==='far'?{p1X:-250,p2X:250}:mode==='disabled'?{swahiliAirSpecialsV1:false}:{});
 tick(s,{p1:mode==='u-alone'?{special:true}:{special:true,medium:true},p2:mode==='jump'?{up:true}:{}});
 if(mode==='disabled') {
   assert.equal(s.throwInteraction,null,'disabled retains old strike, not grab');
   assert.equal(s.fighters.p1.currentAttack,'special_neutral_medium');
 }
 for(let i=0;i<100;i++)tick(s,{});
 assert.equal(s.fighters.p2.health,mode==='disabled'?935:1000,mode+' expected damage');
 assert.equal(s.throwInteraction,null,mode+' no stuck interaction');
}
for(const edge of [-410,260]){
 const s=make({p1X:edge,p2X:edge+150});
 tick(s,{p1:{special:true,medium:true},p2:{block:true}});
 for(let i=0;i<100;i++)tick(s,{});
 assert.equal(s.fighters.p2.hitCountTaken,1,'command grab catches guard');
 for(const f of Object.values(s.fighters))assert.ok(f.x>=s.stage.left&&f.x<=s.stage.right,'wall bounds');
}
{
 const s=make({p1X:-40,p2X:40});
 tick(s,{p1:{special:true,medium:true},p2:{light:true}});
 for(let i=0;i<25;i++)tick(s,{});
 assert.ok(s.fighters.p1.health<1000,'startup is strike punishable');
 assert.equal(s.throwInteraction,null,'interrupted hook releases interaction');
 assert.equal(s.fighters.p2.hitCountTaken,0,'no phantom headbutt after interruption');
}
console.log('PASS hook headbutt: P1/P2, one hit, pull, whiff, jump escape, guard, walls, interruption, recovery and iteration parity');
