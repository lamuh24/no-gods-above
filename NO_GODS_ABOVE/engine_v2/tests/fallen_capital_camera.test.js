const assert = require('node:assert/strict');
const THREE = require('three');
const { createMatch } = require('../dist/core/engine');
const { calculateFallenCapitalCamera, FALLEN_CAPITAL_VIEW } = require('../dist/stage/fallenCapital/camera');

// Independent world projection tests cover the full legal body envelope, not
// values repeated from the framing formula. Synthetic extremes are intentional.
const state = createMatch(137, { p1Kind: 'lamuh_legacy_v2', p2Kind: 'lamuh_proto' });
const cases = [
  ['center', -76, 76, 0, 0], ['left corner', -410, -300, 0, 0],
  ['right corner', 300, 410, 0, 0], ['full width', -410, 410, 0, 0],
  ['ceiling', -100, 100, -180, 0], ['both ceiling', -410, 410, -180, -180],
];
let projections = 0;
for (const [name, x1, x2, y1, y2] of cases) {
  Object.assign(state.fighters.p1, { x: x1, y: y1 });
  Object.assign(state.fighters.p2, { x: x2, y: y2 });
  for (const tick of [0, 66, 106, 146, 186, 226]) {
    if (tick) state.ultimateInteraction = { tick, phase: 'beam', facing: 1 };
    else delete state.ultimateInteraction;
    const before = JSON.stringify(state);
    const shot = calculateFallenCapitalCamera(state);
    assert.equal(JSON.stringify(state), before, `${name}: framing mutated state`);
    assert.deepEqual(calculateFallenCapitalCamera(state), shot, `${name}: repeated framing differs`);
    const swapped = structuredClone(state);
    [swapped.fighters.p1, swapped.fighters.p2] = [swapped.fighters.p2, swapped.fighters.p1];
    assert.deepEqual(calculateFallenCapitalCamera(swapped), shot, `${name}: side order changes framing`);
    const camera = new THREE.PerspectiveCamera(FALLEN_CAPITAL_VIEW.fov, 16 / 9, .1, 220);
    const angle = shot.orbitDegrees * Math.PI / 180;
    camera.position.set(shot.targetX + Math.sin(angle) * shot.distance, shot.targetY + 1.75, Math.cos(angle) * shot.distance);
    camera.lookAt(shot.targetX, shot.targetY, 0); camera.updateMatrixWorld(true);
    for (const fighter of Object.values(state.fighters)) for (const dx of [-48, 48]) for (const dy of [-182, 0]) {
      const ndc = new THREE.Vector3((fighter.x + dx) * .02, -(fighter.y + dy) * .02, .025).project(camera);
      assert.ok(Math.abs(ndc.x) < .98 && Math.abs(ndc.y) < .96 && ndc.z < 1, `${name} tick ${tick}: body outside frame ${JSON.stringify(ndc)}`);
      projections++;
    }
  }
}
console.log(`Fallen Capital camera passed: ${cases.length} spatial cases, gameplay + 5 cinematic times, ${projections} body-corner projections; deterministic, nonmutating, side-order invariant.`);
