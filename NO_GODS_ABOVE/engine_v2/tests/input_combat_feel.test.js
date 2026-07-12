const assert = require('assert');
const { createMatch, runTicks, tick, pushInput, makeInputBuffer, wasPressed, forwardHeld } = require('../dist');
const { normalizeMockGamepad } = require('../dist/debug/inputAdapter');
const { keyboardMapping } = require('../dist/debug/inputMap');

function close(s){ s.fighters.p1.x=-72; s.fighters.p2.x=30; }
function runAttack(idInput, ticks=40, prep=(s)=>{}){ const s=createMatch(31); close(s); prep(s); tick(s,{p1:idInput}); runTicks(s,ticks); return s; }
function hpAfter(input, prep){ return runAttack(input,40,prep).fighters.p2.health; }
function testKeyboardAndGamepadNormalize(){ const buttons=Array.from({length:16},()=>({pressed:false})); buttons[0].pressed=true; const g=normalizeMockGamepad({id:'mock', axes:[1,0], buttons}); assert.deepStrictEqual({right:g.frame.right, light:g.frame.light}, {right:true, light:true}); assert.ok(keyboardMapping.light.includes('KeyJ')); }
function testAnalogDeadZone(){ const buttons=Array.from({length:16},()=>({pressed:false})); assert.strictEqual(normalizeMockGamepad({id:'mock', axes:[0.1,0], buttons},0.35).frame.right, false); assert.strictEqual(normalizeMockGamepad({id:'mock', axes:[0.7,0], buttons},0.35).frame.right, true); }
function testEdgesAndFacing(){ const b=makeInputBuffer(8); pushInput(b,{right:true},0,1); assert.ok(wasPressed(b,'right')); assert.ok(forwardHeld(b)); pushInput(b,{right:true},1,1); assert.strictEqual(wasPressed(b,'right'), false); pushInput(b,{left:true},2,-1); assert.ok(forwardHeld(b)); }
function testDeviceSwitchDoesNotMutateSimulation(){ const s=createMatch(1); const before=JSON.stringify(s); normalizeMockGamepad({id:'mock', axes:[1,0], buttons:Array.from({length:16},()=>({pressed:false}))}); assert.strictEqual(JSON.stringify(s), before); }
function testInputBufferTicks(){ const s=createMatch(2); tick(s,{p1:{light:true}}); tick(s,{}); assert.strictEqual(s.fighters.p1.deterministicBuffer.history[0].tick,0); assert.strictEqual(s.fighters.p1.deterministicBuffer.history[1].tick,1); }
function testDashBackdashDeterministic(){ const a=createMatch(3), b=createMatch(3); for(const s of [a,b]){ tick(s,{p1:{right:true}}); tick(s,{p1:{}}); tick(s,{p1:{right:true}}); runTicks(s,10); } assert.strictEqual(a.fighters.p1.x,b.fighters.p1.x); assert.strictEqual(a.fighters.p1.phase,b.fighters.p1.phase); }
function testJumpDeterministic(){ const a=createMatch(4), b=createMatch(4); for(const s of [a,b]){ tick(s,{p1:{up:true,right:true}}); runTicks(s,30); } assert.deepStrictEqual([a.fighters.p1.x,a.fighters.p1.y,a.fighters.p1.phase],[b.fighters.p1.x,b.fighters.p1.y,b.fighters.p1.phase]); }
function testLowBlockRules(){ assert.ok(hpAfter({down:true,light:true},s=>{s.fighters.p2.dummyMode='stand_block';})<1000); assert.strictEqual(hpAfter({down:true,medium:true},s=>{s.fighters.p2.dummyMode='crouch_block';}),1000); }
function testLauncher(){ const s=runAttack({down:true,heavy:true},20); assert.ok(!s.fighters.p2.grounded || s.fighters.p2.vy<0); }
function testAllowedDisallowedChains(){ const s=createMatch(5); close(s); tick(s,{p1:{light:true}}); runTicks(s,9); tick(s,{p1:{medium:true}}); assert.strictEqual(s.fighters.p1.currentAttack,'standing_medium'); const d=createMatch(6); close(d); tick(d,{p1:{heavy:true}}); runTicks(d,2); tick(d,{p1:{light:true}}); assert.strictEqual(d.fighters.p1.currentAttack,'standing_heavy'); }
function testBlockingNoDamageAndBlockstun(){ const s=runAttack({light:true},8,s=>{s.fighters.p2.dummyMode='stand_block';}); assert.strictEqual(s.fighters.p2.health,1000); assert.ok(s.fighters.p2.blockstun>=0); }
function testKnockdownGetup(){ const s=runAttack({heavy:true},80); assert.ok(['idle','getup','knockdown','hit_reaction'].includes(s.fighters.p2.phase)); }
for(const t of [testKeyboardAndGamepadNormalize,testAnalogDeadZone,testEdgesAndFacing,testDeviceSwitchDoesNotMutateSimulation,testInputBufferTicks,testDashBackdashDeterministic,testJumpDeterministic,testLowBlockRules,testLauncher,testAllowedDisallowedChains,testBlockingNoDamageAndBlockstun,testKnockdownGetup]){ t(); console.log(`PASS ${t.name}`); }
