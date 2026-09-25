const assert = require('assert');
const {createMatch,tick,tickWithFighterOrder,saveSnapshot,restoreSnapshot,currentDivineCounter,resolveAttackDefinition}=require('../dist/core/engine');
const {checksumState}=require('../dist/core/checksum');
const {recordReplay,executeReplay}=require('../dist/core/replay');
const {fighterDefinitions}=require('../dist/data/fighters');
const H='legacy_divine_vanish_heavy',defs=fighterDefinitions.lamuh_legacy_v2.attacks;
const other=id=>id==='p1'?'p2':'p1';
const cmd=id=>({special:true,heavy:true,[id==='p1'?'left':'right']:true});
function match(gap=74){return createMatch(910,{matchId:'counter',p1Kind:'lamuh_legacy_v2',p2Kind:'lamuh_legacy_v2',p1X:-gap/2,p2X:gap/2});}
function advance(s,n,input={}){for(let i=0;i<n;i++)tick(s,input);}
function start(s,id='p1'){tick(s,{[id]:cmd(id)});}
function enemyHitAt(s,id,stanceTick){
 const enemy=other(id),hitStart=defs.standing_light.hitboxes[0].start;
 while(s.fighters[id].phaseTick<stanceTick-hitStart)tick(s,{});
 tick(s,{[enemy]:{light:true}});
 while(s.fighters[id].phaseTick<stanceTick&&!s.fighters[id].divineCounterResponse&&s.fighters[id].currentAttack)tick(s,{});
}
function trigger(id='p1'){
 const s=match();start(s,id);enemyHitAt(s,id,8);assert.ok(s.fighters[id].divineCounterResponse);return s;
}
function testWindowAndTrigger(){
 const a=defs[H];assert.deepStrictEqual([a.startup,a.active,a.recovery],[6,0,34]);assert.ok(!a.rootMotion&&!a.rootMotionSegments);assert.deepStrictEqual(a.hitboxes,[]);
 assert.deepStrictEqual([a.strikeCounter.start,a.strikeCounter.end],[6,17]);
 for(const id of ['p1','p2'])for(const t of [6,8,17]){
  const s=match(),f=s.fighters[id],enemy=s.fighters[other(id)],hp=f.health,ex=enemy.x;
  start(s,id);enemyHitAt(s,id,t);
  assert.ok(f.divineCounterResponse,`counter ${id} tick${t}`);assert.strictEqual(f.health,hp);assert.strictEqual(enemy.x,ex);
  assert.strictEqual(f.divineCounterResponse.stanceTick,t);assert.strictEqual(f.divineCounterResponse.incomingAttackId,'standing_light');
  assert.strictEqual(f.phaseTick,0);assert.strictEqual(currentDivineCounter(f).stage,'vanish');
  assert.ok(Object.values(enemy.hitLedger).some(ids=>ids.includes(id)),'Intercepted contact is consumed');
  assert.strictEqual(enemy.attackConnected,false);assert.strictEqual(enemy.attackBlocked,false);assert.strictEqual(enemy.tensionEarned,0);
 }
}
function testStartupRecoveryWhiffAndNoAutoFire(){
 for(const id of ['p1','p2']){
  for(const t of [5,18,27]){
   const s=match(),f=s.fighters[id],hp=f.health;start(s,id);enemyHitAt(s,id,t);
   assert.ok(f.health<hp,`outside window${t} must take damage`);assert.ok(!f.divineCounterResponse);assert.strictEqual(f.currentAttack,null);
  }
  const s=match(),f=s.fighters[id],x=f.x,hp=s.fighters[other(id)].health;start(s,id);advance(s,39,{[id]:cmd(id)});
  assert.strictEqual(f.phase,'idle');assert.strictEqual(f.x,x);assert.strictEqual(s.fighters[other(id)].health,hp);assert.strictEqual(s.presentationEventLedger.length,0);
  assert.strictEqual(f.tensionEarned,0);advance(s,30,{[id]:cmd(id)});assert.strictEqual(f.moveInstanceCounter,1);
 }
}
function testKickBallAndExactResponse(){
 for(const id of ['p1','p2']){
  const s=trigger(id),f=s.fighters[id],victim=s.fighters[other(id)],hp=victim.health,startX=f.x;
  assert.deepStrictEqual([resolveAttackDefinition(f).startup,resolveAttackDefinition(f).active,resolveAttackDefinition(f).recovery],[12,3,40]);
  for(let i=0;i<85;i++)tick(s,{});
  assert.strictEqual(hp-victim.health,68);assert.strictEqual(victim.hitCountTaken,2);assert.strictEqual(f.x,startX);
  assert.strictEqual(s.projectileSpawnLedger.length,1);assert.ok(s.projectileEventLedger.some(id=>id.endsWith(':hit')));
  assert.strictEqual(f.phase,'idle');assert.ok(!f.divineCounterResponse);assert.strictEqual(f.currentAttack,null);
  assert.ok((victim.x-startX)*(id==='p1'?1:-1)>74,'Blast knocks victim away');
 }
}
function testStandardHumanoidVictimLaunches(){
 const s=createMatch(911,{matchId:'counter-proto-victim',p1Kind:'lamuh_legacy_v2',p2Kind:'lamuh_proto',p1X:-34,p2X:34});
 start(s,'p1');enemyHitAt(s,'p1',8);
 const f=s.fighters.p1,victim=s.fighters.p2;assert.ok(f.divineCounterResponse);
 let kickObserved=false,ballObserved=false,airborneBeforeBall=false;
 for(let i=0;i<90;i++){
  tick(s,{});
  if(victim.hitCountTaken===1&&!kickObserved){
   kickObserved=true;
   assert.strictEqual(victim.grounded,false,'counter kick must release the standard humanoid from the floor');
   assert.ok(victim.vy<0,'counter kick must assign upward velocity');
  }
  if(s.lastProjectileEvent?.attackId===H&&s.lastProjectileEvent.type==='hit'&&!ballObserved){
   ballObserved=true;airborneBeforeBall=true;
   assert.ok(victim.y<0&&!victim.grounded,'aura ball must connect while the victim is airborne');
  }
 }
 assert.ok(kickObserved,'standard humanoid must be hit by the rising kick');
 assert.ok(ballObserved&&airborneBeforeBall,'standard humanoid must receive the follow-up aura ball in the air');
 assert.strictEqual(victim.hitCountTaken,2);
}
function injectStrike(s,id,responseTick){
 const f=s.fighters[id],enemy=s.fighters[other(id)];
 while(f.phaseTick<responseTick-1)tick(s,{});
 enemy.phase='attack';enemy.currentAttack='standing_light';enemy.phaseTick=defs.standing_light.hitboxes[0].start-1;
 enemy.hitLedger={};enemy.hitstop=0;enemy.hitstun=0;enemy.blockstun=0;enemy.knockdownTicks=0;enemy.getupTicks=0;enemy.knockdownKind='none';enemy.vx=0;enemy.attackFacing=-f.attackFacing;enemy.x=f.x+f.attackFacing*74;
 const hp=f.health;tick(s,{});return hp;
}
function testBriefBodyImmunityThenVulnerability(){
 for(const id of ['p1','p2']){
  const hidden=trigger(id),f=hidden.fighters[id],hp=injectStrike(hidden,id,3);
  assert.strictEqual(f.health,hp);assert.ok(f.divineCounterResponse);
  for(const t of [5,7,12]){
   const s=trigger(id),cf=s.fighters[id],before=injectStrike(s,id,t);
   assert.ok(cf.health<before,`response${t} vulnerable`);assert.strictEqual(cf.currentAttack,null);assert.ok(!cf.divineCounterResponse);
  }
 }
}
function testThrowsBeatStanceAndResponse(){
 for(const id of ['p1','p2'])for(const response of [false,true]){
  const s=response?trigger(id):match(),f=s.fighters[id],enemy=s.fighters[other(id)];
  if(!response){start(s,id);advance(s,5);}
  enemy.currentAttack=null;enemy.phase='idle';enemy.hitLedger={};enemy.hitstop=0;enemy.x=f.x+f.attackFacing*70;
  tick(s,{[other(id)]:{throw:true}});advance(s,5);
  assert.strictEqual(s.throwInteraction?.result,'connected',`throw beats ${response?'vanish':'stance'}`);
  assert.strictEqual(f.phase,'thrown');assert.ok(!f.divineCounterResponse);
 }
}
function testProjectilesBypassCounter(){
 for(const id of ['p1','p2'])for(const response of [false,true]){
  const s=response?trigger(id):match(),f=s.fighters[id],enemy=s.fighters[other(id)];
  if(!response){start(s,id);advance(s,5);}
  const palm=defs.legacy_celestial_palm_light;
  enemy.phase='attack';enemy.currentAttack='legacy_celestial_palm_light';enemy.phaseTick=palm.projectile.releaseTick-1;enemy.hitLedger={};enemy.hitstop=0;enemy.x=f.x+f.attackFacing*74;
  const hp=f.health;tick(s,{});advance(s,2);
  assert.ok(f.health<hp,'projectile does not trigger or respect body-only immunity');assert.ok(!f.divineCounterResponse);
 }
}
function testHitstopSnapshotChecksumAndOrder(){
 for(const id of ['p1','p2']){
  const s=trigger(id),f=s.fighters[id];f.hitstop=3;const frozen=[f.x,f.phaseTick];advance(s,3);assert.deepStrictEqual([f.x,f.phaseTick],frozen);
  const restored=restoreSnapshot(saveSnapshot(s));advance(s,70);advance(restored,70);assert.deepStrictEqual(s.checksums,restored.checksums);
  const state=trigger(id);for(const field of ['triggerTick','stanceTick','incomingMoveInstance']){
   const changed=saveSnapshot(state);changed.fighters[id].divineCounterResponse[field]++;assert.notStrictEqual(checksumState(state),checksumState(changed));
  }
  const changed=saveSnapshot(state);changed.fighters[id].currentMoveInstance++;assert.notStrictEqual(checksumState(state),checksumState(changed));
 }
 const a=match(),b=saveSnapshot(a);
 for(let t=0;t<100;t++){
  const inputs=t===0?{p1:cmd('p1')}:t===4?{p2:{light:true}}:{};
  tickWithFighterOrder(a,inputs,['p1','p2']);tickWithFighterOrder(b,inputs,['p2','p1']);
 }
 assert.deepStrictEqual(a.checksums,b.checksums);assert.deepStrictEqual(executeReplay(recordReplay(a)).checksums,a.checksums);
}
function testWallAndWhiffResponse(){
 for(const id of ['p1','p2']){
  const s=match(),f=s.fighters[id],enemy=s.fighters[other(id)];f.x=id==='p1'?s.stage.left:s.stage.right;enemy.x=f.x+f.facing*74;
  start(s,id);enemyHitAt(s,id,8);advance(s,85);assert.ok(f.x>=s.stage.left&&f.x<=s.stage.right);assert.ok(enemy.x>=s.stage.left&&enemy.x<=s.stage.right);
  const far=trigger(id),target=far.fighters[other(id)],hp=target.health;target.x=id==='p1'?400:-400;advance(far,70);assert.strictEqual(target.health,hp,'No target suction or guaranteed hit after counter');
 }
}
function testOnlyFreshRealCollisionTriggers(){
 for(const id of ['p1','p2'])for(const consumed of [false,true]){
  const s=match(),f=s.fighters[id],enemy=s.fighters[other(id)];start(s,id);advance(s,5);
  enemy.phase='attack';enemy.currentAttack='standing_light';enemy.phaseTick=defs.standing_light.hitboxes[0].start-1;
  if(consumed)enemy.hitLedger[`standing_light:${defs.standing_light.hitboxes[0].id}`]=[id];
  else enemy.x=id==='p1'?400:-400;
  tick(s,{});assert.strictEqual(f.divineCounterResponse,undefined,consumed?'Already consumed strike cannot counter':'Far whiff cannot counter');
  assert.strictEqual(f.currentAttack,H);assert.strictEqual(currentDivineCounter(f).stage,'counter_window');
 }
}
const tests=[testWindowAndTrigger,testStartupRecoveryWhiffAndNoAutoFire,testKickBallAndExactResponse,testStandardHumanoidVictimLaunches,testBriefBodyImmunityThenVulnerability,testThrowsBeatStanceAndResponse,testProjectilesBypassCounter,testHitstopSnapshotChecksumAndOrder,testWallAndWhiffResponse,testOnlyFreshRealCollisionTriggers];
for(const test of tests){test();console.log(`PASS ${test.name}`);}console.log(`Counter ${tests.length} groups passed`);
