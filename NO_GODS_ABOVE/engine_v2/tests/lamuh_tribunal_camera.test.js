const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const THREE = require('three');

// Exercise the actual adapter with real Three camera/projection math. Only the
// WebGL arena constructor is stubbed, so this test requires no browser or GPU.
let scene;
class ArenaStub {
  constructor() {
    this.scene = scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera();
    this.renderer = {setPixelRatio(){},setSize(){},domElement:{style:{}},render(){}};
    this.ready = Promise.resolve();
  }
  presentationIdentity(){return {arenaId:'the_last_tribunal'};}
}
const compiled = fs.readFileSync(path.join(__dirname,'../dist/lamuhlegacy/tribunalArena.js'),'utf8');
const exportsObject = {};
vm.runInNewContext(compiled,{exports:exportsObject,require:id=>id==='three'?THREE:{ActualTribunalGrayboxRenderer:ArenaStub}});
const arena = new exportsObject.LamuhTribunalArena({});
const canvas = {width:1600,height:900};
const stateAt = (tick,facing=1)=>({fighters:{p1:{x:-70,y:0},p2:{x:190,y:-70}},ultimateInteraction:{attacker:'p1',defender:'p2',tick,facing,phase:tick<166?'charge':tick<202?'beam':'recovery'}});
const first=stateAt(92), before=JSON.stringify(first);
arena.render(first,canvas);
assert.equal(JSON.stringify(first),before,'presentation must not mutate simulation');
const camera92=JSON.stringify(arena.diagnostics());
const plane=scene.children.find(child=>child.isMesh);
assert.equal(Math.abs(plane.rotation.x)+Math.abs(plane.rotation.y)+Math.abs(plane.rotation.z),0,'combat plane does not spin');
const width=1600/1.3*.02,height=900/1.3*.02;
assert.ok(Math.abs(plane.geometry.parameters.width-width)<1e-9);
assert.ok(Math.abs(plane.geometry.parameters.height-height)<1e-9);
assert.ok(Math.abs(plane.position.y+(450-820)/1.3*.02)<1e-9,'source baseline maps to world floor');
arena.render(stateAt(165),canvas);
assert.equal(arena.diagnostics().orbitDegrees,25);
arena.render(first,canvas);
assert.equal(JSON.stringify(arena.diagnostics()),camera92,'scrubbing does not accumulate camera history');
arena.render(stateAt(92,-1),canvas);
assert.ok(arena.diagnostics().orbitDegrees>0,'mirrored presentation mirrors orbit');
for(let tick=66;tick<241;tick++) {
  arena.render(stateAt(tick),canvas);
  assert.ok(Math.abs(arena.diagnostics().orbitDegrees)<=25);
  assert.ok(arena.diagnostics().cameraPosition.every(Number.isFinite));
}
assert.equal(arena.diagnostics().orbitDegrees,0,'recovery restores non-orbit camera');
console.log('Lamuh Tribunal camera: fixed plane, baseline, mirrored real orbit, replay and no-state-mutation pass');
