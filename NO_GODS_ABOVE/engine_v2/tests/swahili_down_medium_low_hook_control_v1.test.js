const assert = require('assert');
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const { createMatch, executeReplay, recordReplay, tick } = require('../dist');
const { fighterDefinitions } = require('../dist/data/fighters');
const { attackFrameTracks } = require('../dist/stage/attackFrameTracks');
const { stageFrameFor } = require('../dist/stage/fighterFrameSelector');

const LEGACY_GAME_SHA256 = 'D081DA2D907CF6ABD978301C1637008B26CCB30B47E2CCAFCA3FEA3331910C6B';
const MOVE_ID = 'special_down_medium';

function run(name, test) {
  test();
  console.log(`PASS ${name}`);
}

function stepUntil(state, predicate, maxTicks = 180) {
  while (!predicate(state) && state.tick < maxTicks) tick(state, {});
  assert.ok(predicate(state), `condition was not reached by tick ${maxTicks}`);
  return state;
}

function startDownMedium(state, input) {
  tick(state, { p1: input || { down: true, special: true, medium: true } });
  assert.strictEqual(state.fighters.p1.currentAttack, MOVE_ID);
  return state;
}

run('candidate definition is a planted one-hit horizontal low-control Medium', () => {
  const definition = fighterDefinitions.lamuh_proto.attacks[MOVE_ID];
  assert.strictEqual(definition.command, '2S+M');
  assert.deepStrictEqual(
    { startup: definition.startup, active: definition.active, recovery: definition.recovery },
    { startup: 21, active: 5, recovery: 18 }
  );
  assert.strictEqual(definition.startup + definition.active + definition.recovery, 44);
  assert.strictEqual(definition.rootMotion, undefined);
  assert.deepStrictEqual(definition.hitboxes[0], {
    id: 'low_hook_control', start: 21, end: 25, rect: { x: 40, y: -64, w: 142, h: 54 },
    damage: 72, hitstop: 7, hitstun: 17, blockstun: 13, knockbackX: 6.2, knockbackY: 0,
    maxHits: 1, level: 'low', blockHitstop: 6
  });
  assert.strictEqual(definition.cancel, undefined);
});

run('Down plus Special plus Medium starts without stealing crouching Medium or Grave Furrow', () => {
  startDownMedium(createMatch(1901));

  const mirrored = createMatch(1902, { p1X: 160, p2X: -160 });
  tick(mirrored, {});
  assert.strictEqual(mirrored.fighters.p1.facing, -1);
  startDownMedium(mirrored);

  const crouchingMedium = createMatch(1903);
  tick(crouchingMedium, { p1: { down: true, medium: true } });
  assert.strictEqual(crouchingMedium.fighters.p1.currentAttack, 'crouching_medium');

  const unbound = createMatch(1904);
  tick(unbound, { p1: { special: true } });
  assert.strictEqual(unbound.fighters.p1.currentAttack, null);
});

run('eight poses read as planted load one low contact carry and controlled restow', () => {
  const state = createMatch(1905);
  const fighter = state.fighters.p1;
  Object.assign(fighter, { phase: 'attack', currentAttack: MOVE_ID, attackFacing: 1, grounded: true });
  const track = attackFrameTracks[MOVE_ID];
  assert.deepStrictEqual([track.startup.length, track.active.length, track.recovery.length], [4, 1, 3]);
  const ordered = [...track.startup, ...track.active, ...track.recovery];
  assert.strictEqual(new Set(ordered).size, 8);
  assert.ok(ordered.every((sourceId) => !sourceId.includes('command_grab')));
  const samples = [0, 6, 11, 16, 21, 26, 32, 38].map((phaseTick) => {
    fighter.phaseTick = phaseTick;
    return stageFrameFor(fighter, state);
  });
  assert.deepStrictEqual(samples, ordered);
  assert.strictEqual(samples[4], 'special_down_medium_low_hook_control_contact');
  assert.strictEqual(samples[5], 'special_down_medium_low_carry_follow_through');
  assert.strictEqual(samples.at(-1), 'special_down_medium_low_ready_recovery');
});

run('one low hook registers one 72-damage grounded hit with separate 7-tick hitstop and 17-tick hitstun', () => {
  const state = createMatch(1906);
  startDownMedium(state);
  stepUntil(state, (current) => current.lastCombatEvent?.attackId === MOVE_ID && current.lastCombatEvent.outcome === 'hit');
  assert.strictEqual(state.fighters.p2.health, 928);
  assert.strictEqual(state.fighters.p1.hitstop, 7);
  assert.strictEqual(state.fighters.p2.hitstop, 7);
  assert.strictEqual(state.lastCombatEvent.baseHitstun, 17);
  assert.strictEqual(state.lastCombatEvent.effectiveHitstun, 17);
  assert.strictEqual(state.fighters.p2.knockdownKind, 'none');
  assert.strictEqual(state.fighters.p2.grounded, true);
  for (let index = 0; index < 90; index++) tick(state, {});
  assert.strictEqual(state.fighters.p2.health, 928);
  assert.strictEqual(state.fighters.p2.hitCountTaken, 1);
});

run('crouch block uses 6-tick block freeze while standing guard is opened by the low', () => {
  const blocked = createMatch(1907);
  blocked.fighters.p2.dummyMode = 'crouch_block';
  startDownMedium(blocked);
  stepUntil(blocked, (current) => current.lastCombatEvent?.attackId === MOVE_ID && current.lastCombatEvent.outcome === 'block');
  assert.strictEqual(blocked.fighters.p2.health, 1000);
  assert.strictEqual(blocked.fighters.p1.hitstop, 6);
  assert.strictEqual(blocked.fighters.p2.hitstop, 6);
  assert.strictEqual(blocked.fighters.p2.blockstun, 13);

  const standing = createMatch(1908);
  standing.fighters.p2.dummyMode = 'stand_block';
  startDownMedium(standing);
  stepUntil(standing, (current) => current.lastCombatEvent?.attackId === MOVE_ID);
  assert.strictEqual(standing.lastCombatEvent.outcome, 'hit');
  assert.strictEqual(standing.fighters.p2.health, 928);
});

run('low horizontal lane misses an elevated target and never moves Swahili', () => {
  const state = createMatch(1909);
  const startX = state.fighters.p1.x;
  startDownMedium(state);
  for (let index = 0; index < 70; index++) {
    Object.assign(state.fighters.p2, { y: -160, grounded: false, phase: 'jump', vy: 0 });
    tick(state, {});
  }
  assert.strictEqual(state.fighters.p1.x, startX);
  assert.strictEqual(state.fighters.p2.health, 1000);
  assert.notStrictEqual(state.lastCombatEvent?.attackId, MOVE_ID);
});

run('medium role stays between crouching Medium and Down Heavy without launch or knockdown', () => {
  const definition = fighterDefinitions.lamuh_proto.attacks[MOVE_ID];
  const crouchingMedium = fighterDefinitions.lamuh_proto.attacks.crouching_medium;
  const downHeavy = fighterDefinitions.lamuh_proto.attacks.special_down_heavy;
  assert.ok(definition.startup > crouchingMedium.startup);
  assert.ok(definition.hitboxes[0].rect.w > crouchingMedium.hitboxes[0].rect.w);
  assert.ok(definition.hitboxes[0].damage > crouchingMedium.hitboxes[0].damage);
  assert.ok(definition.hitboxes[0].damage < downHeavy.hitboxes.reduce((total, hitbox) => total + hitbox.damage, 0));
  assert.strictEqual(definition.hitboxes[0].launches, undefined);
  assert.strictEqual(definition.hitboxes[0].knockdown, undefined);
});

run('whiff has no capture side switch rotation shot cancel or hidden root travel', () => {
  const state = createMatch(1910, { p1X: -300, p2X: 300 });
  const p1Start = state.fighters.p1.x;
  const p2Start = state.fighters.p2.x;
  startDownMedium(state);
  for (let index = 0; index < 70; index++) tick(state, {});
  assert.strictEqual(state.fighters.p1.x, p1Start);
  assert.strictEqual(state.fighters.p2.x, p2Start);
  assert.strictEqual(state.fighters.p2.health, 1000);
  assert.strictEqual(state.throwInteraction, null);
  assert.strictEqual(state.lastThrowEvent, null);
  assert.strictEqual(state.fighters.p1.throwRotation, 0);
  assert.strictEqual(state.fighters.p2.throwRotation, 0);
  assert.deepStrictEqual(state.fighters.p1.cancelOptions, []);
  assert.strictEqual(state.fighters.p1.phase, 'idle');
});

run('rollback replay remains deterministic for the Down Medium chord', () => {
  const state = createMatch(1911);
  for (let index = 0; index < 100; index++) {
    tick(state, index === 0 ? { p1: { down: true, special: true, medium: true } } : {});
  }
  const replay = recordReplay(state);
  const reproduced = executeReplay(replay);
  assert.deepStrictEqual(reproduced.checksums, state.checksums);
  assert.strictEqual(reproduced.checksums.at(-1), replay.finalChecksum);
});

run('candidate gate and protected legacy runtime remain intact', () => {
  const statusPath = path.join(
    __dirname, '..', '..', '..', 'tools', 'nga-forge', 'production', 'characters', 'swahili',
    'status', 'special-down-medium-low-hook-control-v1.status.json'
  );
  const status = JSON.parse(fs.readFileSync(statusPath, 'utf8'));
  assert.strictEqual(status.candidateOnly, true);
  assert.strictEqual(status.deployable, false);
  assert.strictEqual(status.motionApproved, false);
  assert.strictEqual(status.runtimeIntegrated, true);
  assert.strictEqual(status.runtimeScope, 'local Engine V2 debug playtest only');
  assert.strictEqual(status.gate, 'awaiting_human_special_down_medium_low_hook_control_gameplay_review');
  const bytes = fs.readFileSync(path.join(__dirname, '..', '..', 'game.js'));
  assert.strictEqual(crypto.createHash('sha256').update(bytes).digest('hex').toUpperCase(), LEGACY_GAME_SHA256);
});

console.log('Swahili Down Medium Low Hook Control V1 tests passed: input separation, 44-tick eight-pose presentation, one-hit low control, block, ground-lane whiff, family separation, replay, and release gate.');
