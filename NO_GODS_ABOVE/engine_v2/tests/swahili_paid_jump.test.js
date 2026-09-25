const assert=require('node:assert/strict');
const {paidJumpMotion,paidBodyPlacement}=require('../dist/versus/swahiliPaidRehearsal');
for(const t of [0,3330,3500,3640,3679,3680])assert.deepEqual(paidJumpMotion(t),{x:0,y:0});
const heights=[3740,3840,3940,4040,4140].map(t=>paidJumpMotion(t).y);
for(let i=1;i<heights.length;i++)assert(heights[i]<heights[i-1],'rises after takeoff');
assert(Math.abs(heights[1]-heights[0])>Math.abs(heights[4]-heights[3]),'gravity slows ascent, not linear floating');
assert.deepEqual(paidJumpMotion(4315),paidJumpMotion(4800),'POV cut retains takeoff endpoint');
assert(paidJumpMotion(4315).x>0,'jump travels forward');
assert(paidJumpMotion(4315).y < -130,'clear airborne height');
console.log('Paid jump: grounded preparation, fast takeoff, decelerating ascent, forward travel, continuous POV endpoint passed.');
const scale=400/448,gun=paidBodyPlacement(1,15,448,448);
assert.equal(gun.y+416*scale,0);
for(const [index,sole,toe] of [[0,390,354],[1,392,354],[2,388,340]]){
 const p=paidBodyPlacement(2,index,512,512);
 assert.equal(p.y+sole*scale,0,'loaded boot must touch floor');
 assert(Math.abs((p.x+toe*scale)-(gun.x+344*scale))<1e-9,'front foot does not teleport at clip seam');
 assert.equal(p.width/512,gun.width/448,'constant source body scale');
}
console.log('Paid feet: shooting/holster/load sole baseline, planted front toe and body-scale parity passed.');
