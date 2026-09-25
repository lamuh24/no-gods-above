const assert = require('node:assert/strict');
const { drawCelestialProjectiles } = require('../dist/lamuhlegacy/celestialPalm');
// The dedicated sprite renderer replaces, rather than overlays, the generic orb.
for (const facing of [1, -1]) for (const effects of [true, false]) {
  const projectiles = ['light', 'medium', 'heavy'].map((strength, i) => ({
    attackId: `legacy_celestial_palm_${strength}`, facing, ageTicks: i * 3,
    x: 100 * facing, y: -95, hitbox: {rect: {h: 26 + i * 8}}
  }));
  const state = {tick: 50, projectiles};
  const before = JSON.stringify(state), drawn = [];
  const forbiddenCanvas = new Proxy({}, {get() {throw Error('Unexpected generic orb drawing');}});
  drawCelestialProjectiles(forbiddenCanvas, state, x => x, y => y, 1.3, [], effects, p => drawn.push(p));
  assert.deepEqual(drawn, projectiles);
  assert.equal(JSON.stringify(state), before, 'Presentation must not mutate combat');
}
console.log('PASS neutral L/M/H aura renderer: both facings, effects on/off, no duplicate orb, no simulation mutation');
