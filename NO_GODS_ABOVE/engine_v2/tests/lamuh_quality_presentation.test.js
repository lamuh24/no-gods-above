const assert = require('assert');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { createMatch, tick } = require('../dist/core/engine');
const { contactCue, contactScreenAnchor, reactionFrameIndex, drawContactCue } = require('../dist/lamuhlegacy/quality');
const root = path.resolve(__dirname, '..');

function testActualContactParityAndPresentationPurity() {
  let checks=0;
  const moves = [
    ['5L',{light:true}],['5M',{medium:true}],['5H',{heavy:true}],
    ['2L',{down:true,light:true}],['2M',{down:true,medium:true}],['2H',{down:true,heavy:true}],
    ['j.L',{light:true},true],['j.M',{medium:true},true],['j.H',{heavy:true},true],
    ['Ascend L',{special:true,light:true}],['Ascend M',{special:true,medium:true}],['Ascend H',{special:true,heavy:true}]
  ];
  for(const side of ['p1','p2'])for(const outcome of ['hit','block','whiff'])for(const [label,keys,air] of moves){
    const state=createMatch(905,{matchId:`quality-${side}-${outcome}-${label}`,p1Kind:'lamuh_legacy_v2',p2Kind:'lamuh_legacy_v2',p1X:-34,p2X:outcome==='whiff'?250:34});
    const a=state.fighters[side],d=state.fighters[side==='p1'?'p2':'p1'];
    if(outcome==='block')d.dummyMode='stand_block';
    if(air){a.grounded=false;a.y=-35;a.vy=2;a.phase='jump';}
    const input=keys.special?{...keys,[side==='p1'?'right':'left']:true}:keys;
    let events=0;const ids=[];
    for(let i=0;i<135;i++){
      tick(state,i===0?{[side]:input}:{});
      const before=JSON.stringify(state),cue=contactCue(state);
      reactionFrameIndex(a);reactionFrameIndex(d);
      assert.strictEqual(JSON.stringify(state),before,'Presentation selectors cannot mutate rollback state');
      assert.deepStrictEqual(contactCue(state),cue,'Redraw must not change event identity or anchor');
      if(state.lastCombatEvent?.tick===state.tick-1 && state.lastCombatEvent.outcome!=='juggle_rejected'){
        events++;
        const projectile=state.lastProjectileEvent;
        if(projectile?.tick===state.tick-1 && projectile.attackId===state.lastCombatEvent.attackId && ['hit','block'].includes(projectile.type)){
          assert.strictEqual(cue,null,'Detached projectile feedback must not use a body socket');
          assert.ok(state.projectileEventLedger.includes(projectile.eventId));
          assert.strictEqual(projectile.type,state.lastCombatEvent.outcome);ids.push(projectile.eventId);continue;
        }
        assert.ok(cue,`${side} ${outcome} ${label} contact ${events} missing feedback at tick ${state.tick}`);
        assert.ok(Number.isFinite(cue.x)&&Number.isFinite(cue.y));
        assert.strictEqual(cue.kind,state.lastCombatEvent.outcome);ids.push(cue.id);
      }else assert.strictEqual(cue,null,'Whiffs and expired contacts cannot create feedback');
    }
    assert.strictEqual(new Set(ids).size,ids.length,`${label} repeated a deterministic event ID`);
    if(label==='j.L'||label==='j.M')assert.ok(events<=1,`${label} cannot regain a second contact`);
    checks++;
  }
  console.log(`PASS actual contact/whiff feedback and checksum purity (${checks} scenarios)`);
}

function testReactionOneShotSelectionAndDisabledDownHeavyEffect(){
  const f=createMatch().fighters.p1;f.phase='hit_reaction';f.grounded=true;f.hitReactionWeight='light';f.phaseTick=0;f.hitstun=20;
  assert.strictEqual(reactionFrameIndex(f),0);f.hitReactionWeight='heavy';assert.strictEqual(reactionFrameIndex(f),1);
  f.phaseTick=10;assert.strictEqual(reactionFrameIndex(f),2);f.hitstun=3;assert.strictEqual(reactionFrameIndex(f),3);
  f.grounded=false;for(const [vy,index]of [[-12,4],[0,5],[12,6]]){f.vy=vy;assert.strictEqual(reactionFrameIndex(f),index);}
  f.phase='knockdown';f.grounded=true;for(const phaseTick of [5,12,25,80]){f.phaseTick=phaseTick;assert.strictEqual(reactionFrameIndex(f),7,'Down pose must hold, never cycle');}
  f.phase='getup';f.phaseTick=0;assert.strictEqual(reactionFrameIndex(f),8);f.phaseTick=999;assert.strictEqual(reactionFrameIndex(f),11);
  f.phase='idle';assert.strictEqual(reactionFrameIndex(f),null);
  const ctx=new Proxy({}, {get(){throw new Error('Rejected 2H effect attempted drawing');}});
  drawContactCue(ctx,{attackId:'crouching_heavy'},0,0,0);
  console.log('PASS one-shot reactions and disabled crouching Heavy VFX');
}

function testReactionSourceIntegrity(){
  const pack=JSON.parse(fs.readFileSync(path.join(root,'content-source/characters/lamuh-legacy-v2/reactions-quality.v1.json'),'utf8'));
  const publicPack=JSON.parse(fs.readFileSync(path.join(root,'public/lamuh-legacy-v2/reactions-quality-v1/manifest.json'),'utf8'));
  assert.deepStrictEqual(pack,publicPack);assert.strictEqual(pack.candidateOnly,true);assert.strictEqual(pack.deployable,false);assert.strictEqual(pack.perFrameScale,false);
  assert.strictEqual(pack.frames.length,12);assert.strictEqual(new Set(pack.frames.map(f=>f.sha256)).size,12);
  for(const f of pack.frames){
    const bytes=fs.readFileSync(path.join(root,'public',f.publicPath));
    assert.strictEqual(crypto.createHash('sha256').update(bytes).digest('hex').toUpperCase(),f.sha256);
    assert.strictEqual(bytes.readUInt32BE(16),2048);assert.strictEqual(bytes.readUInt32BE(20),1536);
    const source=fs.readFileSync(path.join(root,'content-source/characters/lamuh-legacy-v2/reaction-frames-quality-v1',`reaction-${String(f.index).padStart(2,'0')}.png`));
    assert.deepStrictEqual(bytes,source);assert.strictEqual(f.touchesEdge,false);assert.deepStrictEqual(f.root,{x:768,y:1360});
  }
  console.log('PASS twelve unique, fixed-scale, hash-locked candidate reaction frames');
  const sockets=JSON.parse(fs.readFileSync(path.join(root,'content-source/characters/lamuh-legacy-v2/quality-contact-sockets.v1.json'),'utf8'));
  for(const entries of Object.values(sockets.attacks))for(const socket of entries){
    assert.strictEqual(crypto.createHash('sha256').update(fs.readFileSync(path.join(root,'public',socket.sourcePath))).digest('hex').toUpperCase(),socket.sha256);
    assert.ok(socket.x>=0&&socket.x<=2048&&socket.y>=0&&socket.y<=1536);
  }
  const cue={attackId:'standing_medium',hitOrdinal:1,attackerRoot:{x:0,y:0},facing:1};
  const right=contactScreenAnchor(cue,sockets,x=>x,y=>y),left=contactScreenAnchor({...cue,facing:-1},sockets,x=>x,y=>y);
  assert.strictEqual(left.x,-right.x);assert.strictEqual(left.y,right.y);
  const lock=JSON.parse(fs.readFileSync(path.join(root,'content-source/characters/lamuh-legacy-v2/quality-preserved-art.lock.json'),'utf8'));
  for(const asset of lock.assets)assert.strictEqual(crypto.createHash('sha256').update(fs.readFileSync(path.join(root,'public',asset.path))).digest('hex').toUpperCase(),asset.sha256);
  console.log(`PASS socket mirror parity and ${lock.assets.length} preserved body frames`);
}

testActualContactParityAndPresentationPurity();
testReactionOneShotSelectionAndDisabledDownHeavyEffect();
testReactionSourceIntegrity();
