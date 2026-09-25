const assert = require('node:assert/strict');
const { createMatch, tick } = require('../dist');
const { resolveAttackDefinition } = require('../dist/core/engine');
const { SWAHILI_GROUND_SPECIALS_V1: moves } = require('../dist/data/swahiliGroundSpecials');
function match(extra = {}) { return createMatch(9191, { p1Kind: 'lamuh_proto', p2Kind: 'lamuh_proto', p1X: -50, p2X: 50, swahiliAirSpecialsV1: true, ...extra }); }
function advance(s, n) { for (let i = 0; i < n; i++) tick(s, {}); }
for (const side of ['p1', 'p2']) {
  for (const [direction, button, expected] of [['up','light','special_up_light'], ['back','light','special_back_light'], ['back','medium','special_back_medium'], ['back','heavy','special_back_heavy'], ['neutral','heavy','special_neutral_heavy'], ['down','light','special_down_light']]) {
    const s = match(); const b = { special: true, [button]: true };
    if (direction === 'back') b[side === 'p1' ? 'left' : 'right'] = true;
    else if (direction !== 'neutral') b[direction] = true;
    tick(s, { [side]: b });
    assert.equal(s.fighters[side].currentAttack, expected, `${side} ${direction} ${button}`);
  }
  const s = match(); tick(s, { [side]: { special: true } }); advance(s, 20);
  assert.equal(s.fighters[side].currentAttack, null, 'U alone');
  for (const [button, expected] of [['light','special_neutral_light'], ['medium','special_neutral_medium']]) {
    const neutral = match(); tick(neutral, { [side]: { special: true, [button]: true } });
    if (button === 'medium') assert.equal(neutral.throwInteraction?.throwId, 'swahili_hook_headbutt', side + ' hook headbutt');
    else assert.equal(neutral.fighters[side].currentAttack, expected, side + ' neutral ' + button);
  }
  const switched = match({ p1X: 100, p2X: -100 });
  switched.fighters.p1.facing = -1; switched.fighters.p2.facing = 1;
  tick(switched, { [side]: { special: true, medium: true, [side === 'p1' ? 'right' : 'left']: true } });
  assert.equal(switched.fighters[side].currentAttack, 'special_back_medium', 'back is relative after side switch');
}
for (const side of ['p1', 'p2']) {
  const opponent = side === 'p1' ? 'p2' : 'p1';
  const s = match(); tick(s, { [side]: { up: true, special: true, light: true } });
  const events = []; let lastTick = -1; for (let i = 0; i < 150; i++) { tick(s, {}); if (s.lastCombatEvent && s.lastCombatEvent.tick !== lastTick) { events.push(s.lastCombatEvent); lastTick = s.lastCombatEvent.tick; } }
  assert.equal(s.fighters[opponent].hitCountTaken, 4, JSON.stringify(events));
  assert.equal(events.filter(e => e.outcome === 'hit').length, 4);
  assert.equal(new Set(Object.keys(s.fighters.p1.hitLedger)).size <= 4, true);
}
for (const [button, id, lifetime, distance] of [['light','special_back_light',240,85], ['medium','special_back_medium',300,200]]) {
  const s = match({ p1X: -300, p2X: 300 }); tick(s, { p1: { left: true, special: true, [button]: true } }); advance(s, 35);
  assert.equal(s.projectiles.length, 1); const seal = s.projectiles[0];
  assert.equal(seal.attackId, id); assert.equal(seal.x, -300 + distance); assert.equal(seal.lifeTicks, lifetime);
  const pos = seal.x; advance(s, 30); assert.equal(s.projectiles[0].x, pos, 'anchored after recovery');
  s.fighters.p2.x = pos; tick(s, {}); assert.equal(s.fighters.p2.hitCountTaken, 1); assert.equal(s.projectiles.length, 0);
  advance(s, 20); assert.equal(s.fighters.p2.hitCountTaken, 1, 'single-use trap');
  const expiry = match({ p1X: -300, p2X: 300 });
  tick(expiry, { p1: { left: true, special: true, [button]: true } }); advance(expiry, 35);
  advance(expiry, lifetime + 1); assert.equal(expiry.projectiles.length, 0, 'seal lifetime is bounded');
}
{
  const s = match(); tick(s, { p1: { left: true, special: true, heavy: true } }); advance(s, 6);
  tick(s, { p2: { light: true } }); advance(s, 5);
  assert.equal(s.fighters.p1.health, 1000, 'counter prevents incoming hit');
  assert.ok(s.fighters.p1.divineCounterResponse, 'counter response triggered');
  assert.equal(s.fighters.p1.currentAttack, 'special_back_heavy');
  assert.equal(resolveAttackDefinition(s.fighters.p1).hitboxes.length, 2);
  advance(s, 100); assert.equal(s.fighters.p2.hitCountTaken, 2, 'pistol then scythe');
}
assert.deepEqual(moves.special_up_light.hitboxes.map(h => h.start), [10,25,40,55]);
assert.deepEqual(moves.special_back_heavy.strikeCounter.response.hitboxes.map(h => h.start), [10,40]);
{
  const s = match({ swahiliAirSpecialsV1: false }); tick(s, { p1: { special: true, heavy: true } });
  assert.notEqual(s.fighters.p1.currentAttack, 'special_neutral_heavy', 'gate preserves old build');
}
console.log('PASS Swahili six-sheet ground special input, parity, counter and stationary seals');
