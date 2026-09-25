const assert = require('assert');
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const { createMatch, executeReplay, recordReplay, tick } = require('../dist');
const { fighterDefinitions } = require('../dist/data/fighters');
const { attackFrameTracks } = require('../dist/stage/attackFrameTracks');
const { stageFrameFor } = require('../dist/stage/fighterFrameSelector');

const LEGACY_GAME_SHA256 = 'D081DA2D907CF6ABD978301C1637008B26CCB30B47E2CCAFCA3FEA3331910C6B';
const MOVE_ID = 'special_down_light';

function run(name, test) {
  test();
  console.log(`PASS ${name}`);
}

function stepUntil(state, predicate, maxTicks = 180) {
  while (!predicate(state) && state.tick < maxTicks) tick(state, {});
  assert.ok(predicate(state), `condition was not reached by tick ${maxTicks}`);
  return state;
}

function startDownLight(state, input) {
  tick(state, { p1: input || { down: true, special: true, light: true } });
  assert.strictEqual(state.fighters.p1.currentAttack, MOVE_ID);
  return state;
}

run('candidate definition is a fast planted one-hit low shaft check', () => {
  const definition = fighterDefinitions.lamuh_proto.attacks[MOVE_ID];
  assert.strictEqual(definition.command, '2S+L');
  assert.deepStrictEqual(
    { startup: definition.startup, active: definition.active, recovery: definition.recovery },
    { startup: 11, active: 3, recovery: 9 }
  );
  assert.strictEqual(definition.startup + definition.active + definition.recovery, 23);
  assert.strictEqual(definition.rootMotion, undefined);
  assert.deepStrictEqual(definition.hitboxes[0], {
    id: 'fast_low_shaft_check', start: 11, end: 13, rect: { x: 38, y: -60, w: 116, h: 48 },
    damage: 45, hitstop: 5, hitstun: 13, blockstun: 9, knockbackX: 3.8, knockbackY: 0,
    maxHits: 1, level: 'low', blockHitstop: 4
  });
  assert.strictEqual(definition.cancel, undefined);
});

run('Down plus Special plus Light starts without stealing crouching Light or Grave Furrow', () => {
  startDownLight(createMatch(2001));

  const mirrored = createMatch(2002, { p1X: 160, p2X: -160 });
  tick(mirrored, {});
  assert.strictEqual(mirrored.fighters.p1.facing, -1);
  startDownLight(mirrored);

  const crouchingLight = createMatch(2003);
  tick(crouchingLight, { p1: { down: true, light: true } });
  assert.strictEqual(crouchingLight.fighters.p1.currentAttack, 'crouching_light');

  const unbound = createMatch(2004);
  tick(unbound, { p1: { special: true } });
  assert.strictEqual(unbound.fighters.p1.currentAttack, null);
});

run('seven poses read as quick take plant acceleration one check and immediate restow', () => {
  const state = createMatch(2005);
  const fighter = state.fighters.p1;
  Object.assign(fighter, { phase: 'attack', currentAttack: MOVE_ID, attackFacing: 1, grounded: true });
  const track = attackFrameTracks[MOVE_ID];
  assert.deepStrictEqual([track.startup.length, track.active.length, track.recovery.length], [4, 1, 2]);
  const ordered = [...track.startup, ...track.active, ...track.recovery];
  assert.strictEqual(new Set(ordered).size, 7);
  assert.ok(ordered.every((sourceId) => !sourceId.includes('command_grab')));
  const samples = [0, 3, 6, 9, 11, 14, 19].map((phaseTick) => {
    fighter.phaseTick = phaseTick;
    return stageFrameFor(fighter, state);
  });
  assert.deepStrictEqual(samples, ordered);
  assert.strictEqual(samples[4], 'special_down_light_fast_low_shaft_check_contact');
  assert.strictEqual(samples[5], 'special_down_light_weapon_restow');
  assert.strictEqual(samples.at(-1), 'special_down_light_low_ready_recovery');
});

run('one shaft check registers one 45-damage grounded hit with separate 5-tick hitstop and 13-tick hitstun', () => {
  const state = createMatch(2006);
  startDownLight(state);
  stepUntil(state, (current) => current.lastCombatEvent?.attackId === MOVE_ID && current.lastCombatEvent.outcome === 'hit');
  assert.strictEqual(state.fighters.p2.health, 955);
  assert.strictEqual(state.fighters.p1.hitstop, 5);
  assert.strictEqual(state.fighters.p2.hitstop, 5);
  assert.strictEqual(state.lastCombatEvent.baseHitstun, 13);
  assert.strictEqual(state.lastCombatEvent.effectiveHitstun, 13);
  assert.strictEqual(state.fighters.p2.knockdownKind, 'none');
  assert.strictEqual(state.fighters.p2.grounded, true);
  for (let index = 0; index < 60; index++) tick(state, {});
  assert.strictEqual(state.fighters.p2.health, 955);
  assert.strictEqual(state.fighters.p2.hitCountTaken, 1);
});

run('crouch block uses 4-tick block freeze while standing guard is opened by the low', () => {
  const blocked = createMatch(2007);
  blocked.fighters.p2.dummyMode = 'crouch_block';
  startDownLight(blocked);
  stepUntil(blocked, (current) => current.lastCombatEvent?.attackId === MOVE_ID && current.lastCombatEvent.outcome === 'block');
  assert.strictEqual(blocked.fighters.p2.health, 1000);
  assert.strictEqual(blocked.fighters.p1.hitstop, 4);
  assert.strictEqual(blocked.fighters.p2.hitstop, 4);
  assert.strictEqual(blocked.fighters.p2.blockstun, 9);

  const standing = createMatch(2008);
  standing.fighters.p2.dummyMode = 'stand_block';
  startDownLight(standing);
  stepUntil(standing, (current) => current.lastCombatEvent?.attackId === MOVE_ID);
  assert.strictEqual(standing.lastCombatEvent.outcome, 'hit');
  assert.strictEqual(standing.fighters.p2.health, 955);
});

run('low shaft lane misses an elevated target and never moves Swahili', () => {
  const state = createMatch(2009);
  const startX = state.fighters.p1.x;
  startDownLight(state);
  for (let index = 0; index < 50; index++) {
    Object.assign(state.fighters.p2, { y: -150, grounded: false, phase: 'jump', vy: 0 });
    tick(state, {});
  }
  assert.strictEqual(state.fighters.p1.x, startX);
  assert.strictEqual(state.fighters.p2.health, 1000);
  assert.notStrictEqual(state.lastCombatEvent?.attackId, MOVE_ID);
});

run('Light role is shorter faster and less rewarding than Down Medium without becoming Crouching Light', () => {
  const definition = fighterDefinitions.lamuh_proto.attacks[MOVE_ID];
  const crouchingLight = fighterDefinitions.lamuh_proto.attacks.crouching_light;
  const downMedium = fighterDefinitions.lamuh_proto.attacks.special_down_medium;
  assert.ok(definition.startup > crouchingLight.startup);
  assert.ok(definition.hitboxes[0].rect.w > crouchingLight.hitboxes[0].rect.w);
  assert.ok(definition.hitboxes[0].damage > crouchingLight.hitboxes[0].damage);
  assert.ok(definition.startup < downMedium.startup);
  assert.ok(definition.recovery < downMedium.recovery);
  assert.ok(definition.hitboxes[0].rect.w < downMedium.hitboxes[0].rect.w);
  assert.ok(definition.hitboxes[0].damage < downMedium.hitboxes[0].damage);
  assert.strictEqual(definition.hitboxes[0].launches, undefined);
  assert.strictEqual(definition.hitboxes[0].knockdown, undefined);
});

run('repeating the check leaves a real defensive gap before the second contact', () => {
  const state = createMatch(2010);
  startDownLight(state);
  stepUntil(state, (current) => current.lastCombatEvent?.attackId === MOVE_ID && current.lastCombatEvent.outcome === 'hit');
  stepUntil(state, (current) => current.fighters.p1.phase === 'idle');
  startDownLight(state);
  let defenderRecoveredDuringStartup = false;
  while (state.fighters.p1.currentAttack === MOVE_ID && state.fighters.p1.phaseTick < 11) {
    if (state.fighters.p2.hitstun === 0) defenderRecoveredDuringStartup = true;
    tick(state, {});
  }
  assert.strictEqual(defenderRecoveredDuringStartup, true);
});

run('whiff has no capture side switch rotation shot cancel or hidden root travel', () => {
  const state = createMatch(2011, { p1X: -300, p2X: 300 });
  const p1Start = state.fighters.p1.x;
  const p2Start = state.fighters.p2.x;
  startDownLight(state);
  for (let index = 0; index < 50; index++) tick(state, {});
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

run('rollback replay remains deterministic for the Down Light chord', () => {
  const state = createMatch(2012);
  for (let index = 0; index < 90; index++) {
    tick(state, index === 0 ? { p1: { down: true, special: true, light: true } } : {});
  }
  const replay = recordReplay(state);
  const reproduced = executeReplay(replay);
  assert.deepStrictEqual(reproduced.checksums, state.checksums);
  assert.strictEqual(reproduced.checksums.at(-1), replay.finalChecksum);
});

run('candidate gate and protected legacy runtime remain intact', () => {
  const statusPath = path.join(
    __dirname, '..', '..', '..', 'tools', 'nga-forge', 'production', 'characters', 'swahili',
    'status', 'special-down-light-fast-shaft-check-v1.status.json'
  );
  const status = JSON.parse(fs.readFileSync(statusPath, 'utf8'));
  assert.strictEqual(status.candidateOnly, true);
  assert.strictEqual(status.deployable, false);
  assert.strictEqual(status.motionApproved, false);
  assert.strictEqual(status.runtimeIntegrated, true);
  assert.strictEqual(status.runtimeScope, 'local Engine V2 debug playtest only');
  assert.strictEqual(status.gate, 'awaiting_human_special_down_light_fast_shaft_check_gameplay_review');
  const bytes = fs.readFileSync(path.join(__dirname, '..', '..', 'game.js'));
  assert.strictEqual(crypto.createHash('sha256').update(bytes).digest('hex').toUpperCase(), LEGACY_GAME_SHA256);
});

console.log('Swahili Down Light Fast Shaft Check V1 tests passed: input separation, 23-tick seven-pose presentation, one-hit low check, block, ground-lane whiff, strength-family separation, anti-loop gap, replay, and release gate.');
