const assert = require('assert');
const { createMatch, tick, tickWithFighterOrder, saveSnapshot, restoreSnapshot, currentAscendHeavyChain, resolveAttackDefinition } = require('../dist/core/engine');
const { checksumState } = require('../dist/core/checksum');
const { recordReplay, executeReplay } = require('../dist/core/replay');
const { fighterDefinitions, LAMUH_ASCEND_HEAVY_V1_HISTORICAL } = require('../dist/data/fighters');
const H = 'legacy_ascend_step_heavy', defs = fighterDefinitions.lamuh_legacy_v2.attacks;
const other = id => id === 'p1' ? 'p2' : 'p1';
const command = id => ({ [id === 'p1' ? 'right' : 'left']: true, special: true, heavy: true });
function match(gap = 74, offset = 0) { return createMatch(923, { matchId: 'ascend-confirm', p1Kind: 'lamuh_legacy_v2', p2Kind: 'lamuh_legacy_v2', p1X: offset-gap/2, p2X: offset+gap/2 }); }
function advance(s, n) { for (let i=0;i<n;i++) tick(s, {}); }
function until(s, predicate) { for(let i=0;i<160;i++) { if(predicate())return; tick(s,{}); } throw Error('timeout'); }
function trigger(id='p1', s=match()) { tick(s,{[id]:command(id)}); until(s,()=>!!s.fighters[id].ascendHeavyResponse); return s; }
function testDefinitions() {
 assert.deepStrictEqual([defs[H].startup,defs[H].active,defs[H].recovery],[10,3,17]);
 const r=defs[H].hitConfirm.response;
 assert.deepStrictEqual([r.startup,r.active,r.recovery],[22,3,39]);
 assert.strictEqual(defs[H].hitboxes[0].damage+r.hitboxes[0].damage+r.projectile.hitbox.damage,84);
 assert.deepStrictEqual(r.projectile.spawnOffset,{x:58,y:-95}); assert.strictEqual(r.projectile.releaseTick,36);
 assert.strictEqual(r.targetSideSwitch.behindDistance,140); assert.strictEqual(r.targetHurtboxProfile,'extended');
 assert.strictEqual(LAMUH_ASCEND_HEAVY_V1_HISTORICAL.hitboxes[0].damage,84);
 assert.ok(!defs[H].targetSideSwitch && !defs[H].projectile);
}
function testThreeRealContactsBothPlayers() {
 for(const id of ['p1','p2']) {
  const s=trigger(id), a=s.fighters[id], v=s.fighters[other(id)], originalX=v.x;
  assert.strictEqual(v.hitCountTaken,1);assert.strictEqual(v.health,976);
  until(s,()=>a.phaseTick===13); assert.strictEqual(v.x,originalX);
  tick(s,{}); assert.strictEqual(v.x,originalX); assert.strictEqual(Math.abs(a.x-v.x),140);
  assert.strictEqual(currentAscendHeavyChain(a).stage,'vanish');
  until(s,()=>a.phaseTick===16); assert.strictEqual(currentAscendHeavyChain(a).stage,'kick_load');
  until(s,()=>v.hitCountTaken===2); assert.strictEqual(a.phaseTick,22); assert.strictEqual(v.health,950);
  until(s,()=>s.projectiles?.length===1); assert.strictEqual(a.phaseTick,36);
  const ball=s.projectiles[0], firstX=ball.x; tick(s,{}); assert.notStrictEqual(ball.x,firstX);
  advance(s,100); assert.strictEqual(v.hitCountTaken,3); assert.strictEqual(v.health,923);
  assert.strictEqual(s.projectileSpawnLedger.length,1); assert.ok(!a.ascendHeavyResponse); assert.strictEqual(a.currentAttack,null);
  assert.ok(Math.abs(v.x-originalX)>300,'kick and traveling ball produce real stage travel');
 }
}
function testWhiffBlockAndConsumedContact() {
 for(const id of ['p1','p2']) {
  const far=match(600), x=far.fighters[id].x;tick(far,{[id]:command(id)});advance(far,45);
  assert.strictEqual(far.fighters[id].x,x);assert.strictEqual(far.fighters[other(id)].hitCountTaken,0);assert.ok(!far.projectileSpawnLedger);
  const s=match(), enemy=other(id), ex=s.fighters[enemy].x;
  for(let i=0;i<60;i++)tick(s,{...(i===0?{[id]:command(id)}:{}),[enemy]:{down:true,[enemy==='p1'?'left':'right']:true}});
  assert.strictEqual(s.fighters[enemy].health,1000);assert.strictEqual(s.fighters[enemy].x,ex);assert.ok(!s.projectileSpawnLedger);assert.ok(!s.fighters[id].ascendHeavyResponse);
  const used=match();tick(used,{[id]:command(id)});used.fighters[id].hitLedger[`${H}:${defs[H].hitboxes[0].id}`]=[enemy];advance(used,45);
  assert.strictEqual(used.fighters[enemy].hitCountTaken,0);assert.ok(!used.projectileSpawnLedger);
 }
}
function testInterruptionReleasesHoldAndStopsBall() {
 for(const id of ['p1','p2']) {
  const s=trigger(id), a=s.fighters[id],v=s.fighters[other(id)];
  until(s,()=>a.phaseTick===8);const before=v.hitstun;
  tick(s,{[other(id)]:{burst:true}});assert.ok(!a.ascendHeavyResponse);assert.strictEqual(a.currentAttack,null);
  advance(s,100);assert.ok(!s.projectileSpawnLedger);assert.ok(v.hitstun<before);
  const strike=trigger(id),f=strike.fighters[id],enemy=strike.fighters[other(id)];until(strike,()=>f.phaseTick===17);
  enemy.phase='attack';enemy.currentAttack='standing_light';enemy.phaseTick=defs.standing_light.startup-1;
  enemy.hitstun=0;enemy.hitstop=0;enemy.hitLedger={};enemy.attackFacing=-f.attackFacing;enemy.x=f.x+f.attackFacing*74;
  const hp=f.health;tick(strike,{});assert.ok(f.health<hp);assert.ok(!f.ascendHeavyResponse);advance(strike,80);assert.ok(!strike.projectileSpawnLedger);
 }
}
function testCornerFallbackAndNoVictimTeleport() {
 for(const id of ['p1','p2']) {
  const s=trigger(id,match(74,id==='p1'?370:-370)), a=s.fighters[id],v=s.fighters[other(id)],x=v.x;
  until(s,()=>a.phaseTick===14);assert.strictEqual(v.x,x);assert.strictEqual(Math.abs(a.x-v.x),140);
  assert.ok(a.x>=s.stage.left&&a.x<=s.stage.right);advance(s,120);assert.strictEqual(v.hitCountTaken,3);
 }
}
function testSnapshotReplayAndOrder() {
 for(const id of ['p1','p2']) {
  const s=trigger(id);until(s,()=>s.fighters[id].phaseTick===13);
  const restored=restoreSnapshot(saveSnapshot(s)); assert.strictEqual(checksumState(restored),checksumState(s));
  restored.fighters[id].ascendHeavyResponse.target=id;assert.notStrictEqual(checksumState(restored),checksumState(s));
  const resumed=restoreSnapshot(saveSnapshot(s));advance(s,110);advance(resumed,110);assert.deepStrictEqual(resumed,s);
  assert.deepStrictEqual(executeReplay(recordReplay(s)).checksums,s.checksums);
  const normal=match(),reverse=match();for(let i=0;i<150;i++){const input=i===0?{[id]:command(id)}:{};tickWithFighterOrder(normal,input,['p1','p2']);tickWithFighterOrder(reverse,input,['p2','p1']);}
  assert.deepStrictEqual(normal,reverse);
 }
}
function testReleasedBallIndependentAndThrowsWin() {
 for(const id of ['p1','p2']) {
  const s=trigger(id),a=s.fighters[id],v=s.fighters[other(id)];until(s,()=>a.phaseTick===36);
  const ballId=s.projectiles[0].id;
  tick(s,{[other(id)]:{burst:true}}); assert.ok(!a.ascendHeavyResponse);assert.strictEqual(a.currentAttack,null);
  assert.ok(s.projectiles.some(p=>p.id===ballId),'released entity survives owner interruption');advance(s,100);
  assert.ok(!s.projectiles.length,'independent entity expires or collides');assert.strictEqual(s.projectileSpawnLedger.length,1);
  const t=trigger(id),actor=t.fighters[id],enemy=t.fighters[other(id)];until(t,()=>actor.phaseTick===10);
  enemy.hitstun=0;enemy.hitstop=0;enemy.phase='idle';enemy.x=actor.x+actor.attackFacing*70;
  tick(t,{[other(id)]:{throw:true}});advance(t,5);
  assert.ok(!actor.ascendHeavyResponse,'ordinary throw can interrupt even the visually hidden phase');assert.ok(t.throwInteraction||t.lastThrowEvent);
 }
}
for(const test of [testDefinitions,testThreeRealContactsBothPlayers,testWhiffBlockAndConsumedContact,testInterruptionReleasesHoldAndStopsBall,testCornerFallbackAndNoVictimTeleport,testSnapshotReplayAndOrder,testReleasedBallIndependentAndThrowsWin]) {test();console.log(`PASS ${test.name}`);}
