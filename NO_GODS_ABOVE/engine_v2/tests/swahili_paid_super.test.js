const assert = require('node:assert/strict');
const { createMatch, tick } = require('../dist');

for (const side of ['p1', 'p2']) for (const facing of [1, -1]) for (const outcome of ['hit', 'block', 'miss']) {
  const other = side === 'p1' ? 'p2' : 'p1';
  const state = createMatch(996, { p1Kind: 'lamuh_proto', p2Kind: 'lamuh_legacy_v2', swahiliAirSpecialsV1: true });
  Object.assign(state.fighters[side], { kind: 'lamuh_proto', swahiliAirSpecialsV1: true, x: -100 * facing, facing, tension: 100 });
  Object.assign(state.fighters[other], { kind: 'lamuh_legacy_v2', x: (outcome === 'miss' ? 400 : 100) * facing, facing: -facing });
  const events = [];
  for (let frame = 0; frame < 110; frame++) {
    tick(state, { [side]: frame === 0 ? { ultimate: true } : {}, [other]: outcome === 'block' ? { block: true } : {} });
    if (frame === 0) {
      assert.equal(state.fighters[side].currentAttack, 'swahili_paid_super', `${side}/${facing}: P starts super`);
      assert.equal(state.fighters[side].tension, 0, `${side}/${facing}: spends full meter once`);
      assert.equal(state.fighters[side].tensionSpent, 100);
    }
    const event = state.lastProjectileEvent;
    if (event?.tick === state.tick - 1) events.push(event.type);
  }
  assert(events.includes('spawn'), `${side}/${facing}: projectile spawned`);
  assert(events.includes(outcome === 'miss' ? 'expired' : outcome), `${side}/${facing}/${outcome}: ${events}`);
  assert.equal(events.filter(type => type === 'hit').length, outcome === 'hit' ? 1 : 0);
  assert.equal(state.fighters[other].health, outcome === 'hit' ? 820 : 1000, `${side}/${facing}: damage only on hit`);
  assert.equal(state.fighters[side].currentAttack, null, `${side}/${facing}: recovers`);
}

for (const setup of ['empty', 'airborne', 'wrong_fighter']) {
  const state = createMatch(997, { p1Kind: setup === 'wrong_fighter' ? 'lamuh_legacy_v2' : 'lamuh_proto', swahiliAirSpecialsV1: true });
  Object.assign(state.fighters.p1, { swahiliAirSpecialsV1: true, tension: setup === 'empty' ? 0 : 100 });
  if (setup === 'airborne') Object.assign(state.fighters.p1, { grounded: false, y: -150, phase: 'jump' });
  tick(state, { p1: { ultimate: true } });
  assert.notEqual(state.fighters.p1.currentAttack, 'swahili_paid_super', setup);
}

const rehearsal = createMatch(998, { p1Kind: 'lamuh_proto', swahiliAirSpecialsV1: true });
Object.assign(rehearsal.fighters.p1, { paidSealStarterTest: true, tension: 0 });
tick(rehearsal, { p1: { ultimate: true } });
assert.equal(rehearsal.fighters.p1.currentAttack, 'swahili_paid_seal', 'training rehearsal remains separate');
console.log('PASS Swahili paid super: P1/P2, both facings, meter gate/spend, hit/block/whiff, no damage on block, rehearsal preserved');
