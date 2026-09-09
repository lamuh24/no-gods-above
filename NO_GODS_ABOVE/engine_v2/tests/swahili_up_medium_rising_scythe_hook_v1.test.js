const assert = require('assert');
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const { createMatch, executeReplay, recordReplay, tick } = require('../dist');
const { fighterDefinitions } = require('../dist/data/fighters');
const { attackFrameTracks } = require('../dist/stage/attackFrameTracks');
const { stageFrameFor } = require('../dist/stage/fighterFrameSelector');

const LEGACY_GAME_SHA256 = 'D081DA2D907CF6ABD978301C1637008B26CCB30B47E2CCAFCA3FEA3331910C6B';
const MOVE_ID = 'special_up_medium';

function run(name, test) {
  test();
  console.log(`PASS ${name}`);
}

function stepUntil(state, predicate, maxTicks = 180) {
  while (!predicate(state) && state.tick < maxTicks) tick(state, {});
  assert.ok(predicate(state), `condition was not reached by tick ${maxTicks}`);
  return state;
}

function startUpMedium(state, input) {
  tick(state, { p1: input || { up: true, special: true, medium: true } });
  assert.strictEqual(state.fighters.p1.currentAttack, MOVE_ID);
  return state;
}

run('candidate definition is a fast one-hit anti-air with medium impact feel', () => {
  const definition = fighterDefinitions.lamuh_proto.attacks[MOVE_ID];
  assert.strictEqual(definition.command, '8S+M');
  assert.deepStrictEqual(
    { startup: definition.startup, active: definition.active, recovery: definition.recovery },
    { startup: 11, active: 4, recovery: 20 }
  );
  assert.strictEqual(definition.startup + definition.active + definition.recovery, 35);
  assert.strictEqual(definition.rootMotion, undefined);
  assert.deepStrictEqual(definition.hitboxes[0], {
    id: 'rising_scythe_hook', start: 11, end: 14, rect: { x: 24, y: -170, w: 124, h: 98 },
    damage: 78, hitstop: 7, hitstun: 17, blockstun: 13, knockbackX: 4.8, knockbackY: -8.2,
    maxHits: 1, level: 'launcher', blockHitstop: 6, launches: true, juggleCost: 1
  });
});

run('Up plus Special plus Medium starts in authored and mirrored facing without stealing Grave Furrow', () => {
  startUpMedium(createMatch(1701));

  const mirrored = createMatch(1702, { p1X: 160, p2X: -160 });
  tick(mirrored, {});
  assert.strictEqual(mirrored.fighters.p1.facing, -1);
  startUpMedium(mirrored);

  const unbound = createMatch(1703);
  tick(unbound, { p1: { special: true } });
  assert.strictEqual(unbound.fighters.p1.currentAttack, null);
});

run('six poses read as load one contact recoil and controlled remount', () => {
  const state = createMatch(1704);
  const fighter = state.fighters.p1;
  Object.assign(fighter, { phase: 'attack', currentAttack: MOVE_ID, attackFacing: 1, grounded: true });
  const track = attackFrameTracks[MOVE_ID];
  assert.deepStrictEqual([track.startup.length, track.active.length, track.recovery.length], [2, 1, 3]);
  const ordered = [...track.startup, ...track.active, ...track.recovery];
  assert.strictEqual(new Set(ordered).size, 6);
  assert.ok(ordered.every((sourceId) => !sourceId.includes('command_grab')));
  const samples = [0, 6, 11, 15, 22, 29].map((phaseTick) => {
    fighter.phaseTick = phaseTick;
    return stageFrameFor(fighter, state);
  });
  assert.deepStrictEqual(samples, ordered);
  assert.strictEqual(samples[2], 'special_up_medium_rising_hook_contact');
  assert.strictEqual(samples.at(-1), 'special_up_medium_controlled_remount_start');
});

run('one rising hook registers one 78-damage hit with separate 7-tick hitstop', () => {
  const state = createMatch(1705);
  startUpMedium(state);
  stepUntil(state, (current) => current.lastCombatEvent?.attackId === MOVE_ID && current.lastCombatEvent.outcome === 'hit');
  assert.strictEqual(state.fighters.p2.health, 922);
  assert.strictEqual(state.fighters.p1.hitstop, 7);
  assert.strictEqual(state.fighters.p2.hitstop, 7);
  assert.strictEqual(state.lastCombatEvent.baseHitstun, 17);
  assert.strictEqual(state.lastCombatEvent.effectiveHitstun, 25);
  for (let index = 0; index < 100; index++) tick(state, {});
  assert.strictEqual(state.fighters.p2.health, 922);
  assert.strictEqual(state.fighters.p2.hitCountTaken, 1);
});

run('standing block uses 6-tick block freeze and crouching hurtbox can low-profile the upper hook', () => {
  const blocked = createMatch(1706);
  blocked.fighters.p2.dummyMode = 'stand_block';
  startUpMedium(blocked);
  stepUntil(blocked, (current) => current.lastCombatEvent?.attackId === MOVE_ID && current.lastCombatEvent.outcome === 'block');
  assert.strictEqual(blocked.fighters.p2.health, 1000);
  assert.strictEqual(blocked.fighters.p1.hitstop, 6);
  assert.strictEqual(blocked.fighters.p2.hitstop, 6);
  assert.strictEqual(blocked.fighters.p2.blockstun, 13);

  const crouched = createMatch(1707);
  crouched.fighters.p2.dummyMode = 'crouch_block';
  startUpMedium(crouched);
  for (let index = 0; index < 60; index++) tick(crouched, {});
  assert.strictEqual(crouched.fighters.p2.health, 1000);
  assert.notStrictEqual(crouched.lastCombatEvent?.attackId, MOVE_ID);
});

run('upper-region hitbox catches an airborne target without moving Swahili', () => {
  const state = createMatch(1708);
  const attackerStartX = state.fighters.p1.x;
  Object.assign(state.fighters.p2, { y: -48, grounded: false, phase: 'jump', vy: 0 });
  startUpMedium(state);
  stepUntil(state, (current) => current.lastCombatEvent?.attackId === MOVE_ID && current.lastCombatEvent.outcome === 'hit');
  assert.strictEqual(state.fighters.p1.x, attackerStartX);
  assert.strictEqual(state.fighters.p2.grounded, false);
  assert.ok(state.fighters.p2.vy < 0);
  assert.strictEqual(state.fighters.p1.juggleSpent, 1);
});

run('whiff recovers with no capture side switch rotation shot or hidden root travel', () => {
  const state = createMatch(1709, { p1X: -300, p2X: 300 });
  const p1Start = state.fighters.p1.x;
  const p2Start = state.fighters.p2.x;
  startUpMedium(state);
  for (let index = 0; index < 60; index++) tick(state, {});
  assert.strictEqual(state.fighters.p1.x, p1Start);
  assert.strictEqual(state.fighters.p2.x, p2Start);
  assert.strictEqual(state.fighters.p2.health, 1000);
  assert.strictEqual(state.throwInteraction, null);
  assert.strictEqual(state.lastThrowEvent, null);
  assert.strictEqual(state.fighters.p1.throwRotation, 0);
  assert.strictEqual(state.fighters.p2.throwRotation, 0);
  assert.strictEqual(state.fighters.p1.phase, 'idle');
});

run('rollback replay remains deterministic for the Up Medium chord', () => {
  const state = createMatch(1710);
  for (let index = 0; index < 100; index++) {
    tick(state, index === 0 ? { p1: { up: true, special: true, medium: true } } : {});
  }
  const replay = recordReplay(state);
  const reproduced = executeReplay(replay);
  assert.deepStrictEqual(reproduced.checksums, state.checksums);
  assert.strictEqual(reproduced.checksums.at(-1), replay.finalChecksum);
});

run('candidate gate and protected legacy runtime remain intact', () => {
  const statusPath = path.join(
    __dirname, '..', '..', '..', 'tools', 'nga-forge', 'production', 'characters', 'swahili',
    'status', 'special-up-medium-rising-scythe-hook-v1.status.json'
  );
  const status = JSON.parse(fs.readFileSync(statusPath, 'utf8'));
  assert.strictEqual(status.candidateOnly, true);
  assert.strictEqual(status.deployable, false);
  assert.strictEqual(status.motionApproved, false);
  assert.strictEqual(status.runtimeIntegrated, true);
  assert.strictEqual(status.runtimeScope, 'local Engine V2 debug playtest only');
  assert.strictEqual(status.gate, 'awaiting_human_special_up_medium_rising_scythe_hook_gameplay_review');
  const bytes = fs.readFileSync(path.join(__dirname, '..', '..', 'game.js'));
  assert.strictEqual(crypto.createHash('sha256').update(bytes).digest('hex').toUpperCase(), LEGACY_GAME_SHA256);
});

console.log('Swahili Up Medium Rising Scythe Hook V1 tests passed: input, 35-tick six-pose presentation, one-hit parity, block/low-profile, anti-air, no-capture separation, replay, and release gate.');
