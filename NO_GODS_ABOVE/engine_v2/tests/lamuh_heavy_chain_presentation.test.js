const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const {createMatch,tick}=require('../dist/core/engine');const {contactCue,contactScreenAnchor}=require('../dist/lamuhlegacy/quality');
const m=JSON.parse(fs.readFileSync(path.join(__dirname,'../public/lamuh-legacy-v2/heavy-chain-v1/manifest.json')));
for(const [mode,total,start]of [['opener',30,10],['response',64,22]]){const s=m[mode];assert.equal(s.exposureTicks.reduce((a,b)=>a+b,0),total);assert.equal(s.exposureTicks.slice(0,s.contactFrame).reduce((a,b)=>a+b,0),start);for(const f of s.frames){assert.equal(crypto.createHash('sha256').update(fs.readFileSync(path.join(__dirname,'../public',f.publicPath))).digest('hex').toUpperCase(),f.sha256);}}
let t=0;for(let i=0;i<m.response.frames.length;i++){if(t>=10&&t<16)assert.equal(m.response.frames[i].bodyAbsent,true);t+=m.response.exposureTicks[i];}
for(const side of ['p1','p2']){
 const s=createMatch(981,{p1Kind:'lamuh_legacy_v2',p2Kind:'lamuh_legacy_v2',p1X:-37,p2X:37});const a=s.fighters[side],v=s.fighters[side==='p1'?'p2':'p1'];
 // Overall combo ordinal must not determine which authored Heavy limb socket is used.
 a.comboCount=1;a.comboTarget=v.id;
 let opener=false,kick=false;for(let i=0;i<110;i++){
  tick(s,{[side]:i===0?{[side==='p1'?'right':'left']:true,special:true,heavy:true}:{}});
  const cue=contactCue(s);if(!cue||cue.attackId!=='legacy_ascend_step_heavy')continue;
  assert.ok(s.presentationEventLedger.includes(cue.id),'feedback uses actual ledger event');
  if(a.ascendHeavyResponse?.triggerTick===s.lastCombatEvent.tick){assert.equal(cue.contactSocketIndex,0);opener=true;}
  else {assert.equal(cue.contactSocketIndex,1);kick=true;}
 }
 assert.ok(opener&&kick,'both Heavy limb cues observed');
}
console.log('PASS Heavy chain source timelines, aura-only frames, mirrored combo-safe contact cues');
