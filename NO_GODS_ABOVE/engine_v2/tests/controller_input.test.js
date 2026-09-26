const assert = require('node:assert/strict');
const { mapController } = require('../dist/versus/controller');
const { createMatch, tick } = require('../dist');
function pad(buttons=[],axes=[0,0]) { return {axes,buttons:Array.from({length:17},(_,i)=>({pressed:buttons.includes(i)}))}; }
assert.deepEqual(mapController(pad([], [0.2,-0.2])), {}, 'stick drift is ignored');
assert.deepEqual(mapController(pad([14,13])), {left:true,down:true});
for (const [button,action] of [[0,'up'],[2,'light'],[3,'medium'],[1,'heavy'],[7,'special'],[5,'block'],[6,'throw'],[8,'ultimate'],[10,'burst'],[11,'romanCancel']]) assert.equal(mapController(pad([button]))[action],true);
for (const [kind,expected] of [['lamuh_legacy_v2','legacy_radiant_dive_medium'],['lamuh_proto','special_air_medium'],['celeste_proto','ovation_descant']]) {
  const state=createMatch(17,{p1Kind:kind,p2Kind:'training_dummy',swahiliAirSpecialsV1:true});
  tick(state,{p1:mapController(pad([0]))});
  for(let i=0;i<20 && state.fighters.p1.grounded;i++) tick(state,{});
  assert.equal(state.fighters.p1.grounded,false);
  for(let i=0;i<8;i++) tick(state,{});
  tick(state,{p1:mapController(pad([7,3]))});
  assert.equal(state.fighters.p1.currentAttack,expected,`${kind} controller air special`);
}
console.log('Controller deadzone, action mapping, and all three fighter air specials passed.');
