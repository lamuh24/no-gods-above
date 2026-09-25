const assert = require('assert');
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const { createMatch, tick } = require('../dist');
const { reservedCombatActions } = require('../dist/debug/inputMap');

const LEGACY_GAME_SHA256 = 'D081DA2D907CF6ABD978301C1637008B26CCB30B47E2CCAFCA3FEA3331910C6B';

function run(name, test) {
  test();
  console.log(`PASS ${name}`);
}

run('standalone U does nothing while grounded', () => {
  const state = createMatch(2701, { p1X: -180, p2X: 180 });
  const start = {
    x: state.fighters.p1.x,
    health: state.fighters.p1.health,
    opponentHealth: state.fighters.p2.health
  };

  tick(state, { p1: { special: true } });
  for (let index = 0; index < 19; index += 1) tick(state, {});

  assert.strictEqual(state.fighters.p1.currentAttack, null);
  assert.strictEqual(state.fighters.p1.phase, 'idle');
  assert.strictEqual(state.fighters.p1.x, start.x);
  assert.strictEqual(state.fighters.p1.health, start.health);
  assert.strictEqual(state.fighters.p2.health, start.opponentHealth);
  assert.strictEqual(state.throwInteraction, null);
  assert.strictEqual(state.lastCombatEvent, null);
});

run('standalone U does nothing while airborne', () => {
  const state = createMatch(2702, { p1X: -80, p2X: 80 });
  Object.assign(state.fighters.p1, { y: -150, vy: -2, grounded: false, phase: 'jump', currentAttack: null });

  tick(state, { p1: { special: true } });
  for (let index = 0; index < 5; index += 1) tick(state, {});

  assert.strictEqual(state.fighters.p1.currentAttack, null);
  assert.strictEqual(state.fighters.p1.phase, 'jump');
  assert.strictEqual(state.fighters.p2.health, 1000);
  assert.strictEqual(state.throwInteraction, null);
  assert.strictEqual(state.lastCombatEvent, null);
});

run('explicit Swahili special chords remain routed', () => {
  const neutralMedium = createMatch(2703);
  tick(neutralMedium, { p1: { special: true, medium: true } });
  assert.strictEqual(neutralMedium.fighters.p1.currentAttack, 'special_neutral_medium');

  const graveFurrow = createMatch(2704);
  tick(graveFurrow, { p1: { up: true, heavy: true } });
  assert.strictEqual(graveFurrow.fighters.p1.currentAttack, 'special_up_heavy');

  const commandGrab = createMatch(2705, { p1X: -70, p2X: 70 });
  tick(commandGrab, { p1: { special: true, throw: true } });
  assert.strictEqual(commandGrab.throwInteraction?.throwId, 'command_grab');
  assert.strictEqual(commandGrab.fighters.p1.currentAttack, null);
});

run('debug contract documents U as an unbound standalone modifier', () => {
  assert.ok(reservedCombatActions.special.startsWith('U alone / no action'));
  assert.ok(reservedCombatActions.special.includes('W+L / Grave Furrow'));
  assert.ok(reservedCombatActions.special.includes('U+L / airborne ender'));
  assert.ok(reservedCombatActions.special.includes('U+I Command Grab'));
});

run('legacy game.js remains byte-locked', () => {
  const gamePath = path.resolve(__dirname, '../../game.js');
  const bytes = fs.readFileSync(gamePath);
  assert.strictEqual(crypto.createHash('sha256').update(bytes).digest('hex').toUpperCase(), LEGACY_GAME_SHA256);
});

console.log('Swahili standalone Special modifier V1 tests passed: grounded no-op, airborne no-op, explicit chords, debug contract, and legacy lock.');
