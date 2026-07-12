#!/usr/bin/env node
const assert = require('assert');
const { selectCharacterClip } = require('../dist/debug/characterVisualAdapter.js');

function fighter(overrides = {}) {
  return { id: 'p1', phase: 'idle', currentAttack: null, crouchBlocking: false, hitstun: 0, phaseTick: 0, ...overrides };
}
assert.strictEqual(selectCharacterClip(fighter()), 'idle');
assert.strictEqual(selectCharacterClip(fighter({ phase: 'attack', currentAttack: 'air_light' })), 'air_light');
assert.strictEqual(selectCharacterClip(fighter({ phase: 'attack', currentAttack: 'standing_heavy' })), 'standing_heavy');
assert.strictEqual(selectCharacterClip(fighter({ phase: 'jump' })), 'jump_air');
assert.strictEqual(selectCharacterClip(fighter({ phase: 'dash' })), 'dash_forward');
assert.strictEqual(selectCharacterClip(fighter({ phase: 'block', crouchBlocking: true })), 'crouching_block');
assert.strictEqual(selectCharacterClip(fighter({ phase: 'hit_reaction', hitstun: 24 })), 'heavy_hit');
assert.strictEqual(selectCharacterClip(fighter({ phase: 'throw_capture' })), 'forward_throw_attacker');
assert.strictEqual(selectCharacterClip(fighter({ phase: 'throw_whiff' })), 'forward_throw_whiff');
assert.strictEqual(selectCharacterClip(fighter({ phase: 'throw_teched' })), 'throw_tech_attacker');
assert.strictEqual(selectCharacterClip(fighter({ id: 'p2', phase: 'throw_teched' })), 'throw_tech_victim');
console.log('Character visual adapter mapping tests passed.');
