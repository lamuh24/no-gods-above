const assert=require('assert');
const {createMatch,tick}=require('../dist');
for(const side of ['p1','p2'])for(const facing of [1,-1])for(const outcome of ['hit','block','miss']){
 const other=side==='p1'?'p2':'p1';
 const s=createMatch(991);
 Object.assign(s.fighters[side],{kind:'lamuh_proto',paidSealStarterTest:true,swahiliAirSpecialsV1:true,x:-100*facing,facing});
 Object.assign(s.fighters[other],{x:(outcome==='miss'?400:100)*facing,facing:-facing});
 const events=[];
 for(let i=0;i<110;i++){
  tick(s,{[side]:i===0?{ultimate:true}:{},[other]:outcome==='block'?{block:true}:{}});
  const e=s.lastProjectileEvent;if(e?.tick===s.tick-1)events.push(e.type);
 }
 assert(events.includes('spawn'),`${side}/${facing}: spawned`);
 assert(events.includes(outcome==='miss'?'expired':outcome),`${side}/${facing}/${outcome}: ${events}`);
 assert.equal(events.filter(x=>x==='hit').length,outcome==='hit'?1:0);
 assert.equal(s.fighters[other].health,1000);
 assert.equal(s.fighters[side].currentAttack,null);
}
for(const mode of ['off','air']){
 const s=createMatch(993);Object.assign(s.fighters.p1,{swahiliAirSpecialsV1:true});
 if(mode==='air')Object.assign(s.fighters.p1,{paidSealStarterTest:true,grounded:false,y:-150,phase:'jump'});
 tick(s,{p1:{ultimate:true}});assert.notEqual(s.fighters.p1.currentAttack,'swahili_paid_seal');
}
console.log('PASS Paid seal: P1/P2, both facings, hit/block/whiff, one confirm, zero damage, recovery, flag-off and air gates');
