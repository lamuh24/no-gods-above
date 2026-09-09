const assert = require('node:assert/strict');
const {createMatch,tick,tickWithFighterOrder,saveSnapshot,restoreSnapshot}=require('../dist/core/engine');
const {checksumState}=require('../dist/core/checksum');
function setup(actor='p1', facing=1, gap=120) {
  const s=createMatch(918,{matchId:'crown-test',p1Kind:'lamuh_legacy_v2',p2Kind:'lamuh_legacy_v2',p1X:actor==='p1'?-gap/2*facing:gap/2*facing,p2X:actor==='p1'?gap/2*facing:-gap/2*facing});
  s.fighters[actor].tension=100; return s;
}
for(const actor of ['p1','p2']) for(const facing of [1,-1]) {
  const s=setup(actor,facing), victim=actor==='p1'?'p2':'p1';
  tick(s,{[actor]:{ultimate:true}});
  assert.equal(s.fighters[actor].tensionSpent,100);
  for(let n=0;n<50&&!s.ultimateInteraction;n++)tick(s);
  assert.ok(s.ultimateInteraction,'true hit enters cinematic');
  assert.deepEqual(s.ultimateInteraction.beamOrigin,{x:s.fighters[actor].x+s.ultimateInteraction.facing*57,y:s.stage.groundY-156},'authored double-palm beam socket');
  while(s.ultimateInteraction?.tick<90)tick(s);
  assert.ok(s.fighters[victim].y < -100,'knee launches before beam');
  const snapshot=saveSnapshot(s), restored=restoreSnapshot(snapshot);
  let releasedTarget;
  while(s.ultimateInteraction){
    tick(s);tickWithFighterOrder(restored,{},['p2','p1']);assert.equal(checksumState(s),checksumState(restored));
    if(s.ultimateInteraction?.tick===166)releasedTarget={...s.ultimateInteraction.beamTarget};
    if(s.ultimateInteraction?.tick>166&&s.ultimateInteraction.tick<=201)assert.deepEqual(s.ultimateInteraction.beamTarget,releasedTarget,'released beam does not track falling victim');
  }
  assert.equal(s.fighters[victim].health,720);
  assert.equal(s.fighters[victim].hitCountTaken,4);
  assert.equal(s.fighters[victim].knockdownKind,'hard');
  assert.equal(new Set(s.ultimateEventLedger).size,s.ultimateEventLedger.length);
}
for(const mode of ['whiff','block','meter']) {
  const s=setup('p1',1,mode==='whiff'?500:120);
  if(mode==='meter')s.fighters.p1.tension=99;
  for(let n=0;n<100;n++)tick(s,{p1:n===0?{ultimate:true}:{},p2:mode==='block'?{block:true}:{}});
  assert.equal(s.ultimateInteraction,undefined); assert.equal(s.fighters.p2.health,1000);
  assert.equal(s.fighters.p1.tensionSpent,mode==='meter'?0:100);
}
{
  const s=setup();tick(s,{p1:{ultimate:true}});while(!s.ultimateInteraction)tick(s);
  s.fighters.p2.health=1;while(s.ultimateInteraction)tick(s);
  assert.equal(s.fighters.p2.health,0);assert.equal(s.fighters.p1.currentAttack,null);
  assert.equal(createMatch(918).ultimateInteraction,undefined);
}
for(const facing of [1,-1]) {
  const s=setup('p1',facing);
  s.fighters.p2.x=facing===1?s.stage.right-34:s.stage.left+34;
  s.fighters.p1.x=s.fighters.p2.x-facing*120;
  tick(s,{p1:{ultimate:true}});
  for(let n=0;n<300;n++) {
    tick(s,{p1:{romanCancel:true,up:true},p2:{burst:true,throw:true}});
    for(const f of Object.values(s.fighters)) assert.ok(f.x>=s.stage.left&&f.x<=s.stage.right);
  }
  assert.equal(s.fighters.p2.health,720);
}
{
  const s=setup();const a=s.fighters.p1;
  a.comboCount=1;a.comboTarget='p2';a.damageScaling=.6;s.fighters.p2.hitstun=60;
  tick(s,{p1:{ultimate:true}});for(let i=0;i<280;i++)tick(s);
  assert.equal(s.fighters.p2.health,832,'280 applies existing 0.6 combo entry scaling');
}
{
  const s=setup();s.fighters.p2.tension=100;
  tick(s,{p1:{ultimate:true},p2:{ultimate:true}});
  for(let i=0;i<80;i++)tick(s);
  assert.equal(s.ultimateInteraction,undefined,'simultaneous palm trade cannot steal cinematic ownership');
  assert.equal(s.fighters.p1.tensionSpent,100);assert.equal(s.fighters.p2.tensionSpent,100);
  assert.equal(s.fighters.p1.health,960);assert.equal(s.fighters.p2.health,960);
}
{
  const s=setup('p1',1,65);
  tick(s,{p1:{ultimate:true},p2:{light:true}});
  for(let i=0;i<80;i++)tick(s);
  assert.equal(s.ultimateInteraction,undefined,'ordinary startup interruption releases ultimate');
  assert.equal(s.fighters.p1.currentAttack,null);
  assert.equal(s.fighters.p1.tensionSpent,100,'interruption does not refund cost');
}
console.log('Lamuh ultimate: mirror roles, launch, four beats, meter, whiff/block, corners, scaling, KO, trades, interruption and rollback pass');
