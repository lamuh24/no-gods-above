const assert = require('assert');
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const { createMatch, executeReplay, recordReplay, tick } = require('../dist');
const { fighterDefinitions } = require('../dist/data/fighters');
const { attackFrameTracks } = require('../dist/stage/attackFrameTracks');
const { stageFrameFor } = require('../dist/stage/fighterFrameSelector');

const LEGACY_GAME_SHA256 = 'D081DA2D907CF6ABD978301C1637008B26CCB30B47E2CCAFCA3FEA3331910C6B';
const MOVE_ID = 'special_down_heavy';

function run(name, test) {
  test();
  console.log(`PASS ${name}`);
}

function stepUntil(state, predicate, maxTicks = 180) {
  while (!predicate(state) && state.tick < maxTicks) tick(state, {});
  assert.ok(predicate(state), `condition was not reached by tick ${maxTicks}`);
  return state;
}

function startDownHeavy(state, input) {
  tick(state, { p1: input || { down: true, special: true, heavy: true } });
  assert.strictEqual(state.fighters.p1.currentAttack, MOVE_ID);
  return state;
}

run('candidate definition is a stationary one-hit low ground-denial Heavy', () => {
  const definition = fighterDefinitions.lamuh_proto.attacks[MOVE_ID];
  assert.strictEqual(definition.command, '2S+H');
  assert.deepStrictEqual(
    { startup: definition.startup, active: definition.active, recovery: definition.recovery },
    { startup: 27, active: 5, recovery: 32 }
  );
  assert.strictEqual(definition.startup + definition.active + definition.recovery, 64);
  assert.strictEqual(definition.rootMotion, undefined);
  assert.deepStrictEqual(definition.hitboxes[0], {
    id: 'vertical_shaft_plant', start: 27, end: 31, rect: { x: 38, y: -52, w: 102, h: 50 },
    damage: 95, hitstop: 11, hitstun: 18, blockstun: 16, knockbackX: 8.5, knockbackY: 0,
    maxHits: 1, level: 'low', blockHitstop: 8, knockdown: 'soft'
  });
  assert.strictEqual(definition.cancel, undefined);
});

run('Down plus Special plus Heavy starts without stealing crouching Heavy or Grave Furrow', () => {
  startDownHeavy(createMatch(1801));

  const mirrored = createMatch(1802, { p1X: 160, p2X: -160 });
  tick(mirrored, {});
  assert.strictEqual(mirrored.fighters.p1.facing, -1);
  startDownHeavy(mirrored);

  const crouchingHeavy = createMatch(1803);
  tick(crouchingHeavy, { p1: { down: true, heavy: true } });
  assert.strictEqual(crouchingHeavy.fighters.p1.currentAttack, 'crouching_heavy');

  const unbound = createMatch(1804);
  tick(unbound, { p1: { special: true } });
  assert.strictEqual(unbound.fighters.p1.currentAttack, null);
});

run('eleven poses read as coil one plant same-contact compression lift-off and remount', () => {
  const state = createMatch(1805);
  const fighter = state.fighters.p1;
  Object.assign(fighter, { phase: 'attack', currentAttack: MOVE_ID, attackFacing: 1, grounded: true });
  const track = attackFrameTracks[MOVE_ID];
  assert.deepStrictEqual([track.startup.length, track.active.length, track.recovery.length], [5, 1, 5]);
  const ordered = [...track.startup, ...track.active, ...track.recovery];
  assert.strictEqual(new Set(ordered).size, 11);
  assert.ok(ordered.every((sourceId) => !sourceId.includes('command_grab')));
  const samples = [0, 6, 11, 17, 22, 27, 32, 39, 45, 52, 58].map((phaseTick) => {
    fighter.phaseTick = phaseTick;
    return stageFrameFor(fighter, state);
  });
  assert.deepStrictEqual(samples, ordered);
  assert.strictEqual(samples[5], 'special_down_heavy_shaft_plant_contact');
  assert.strictEqual(samples[6], 'special_down_heavy_post_contact_compression');
  assert.strictEqual(samples[7], 'special_down_heavy_controlled_lift_off');
});

run('one shaft plant registers one 95-damage soft knockdown with separate 11-tick hitstop', () => {
  const state = createMatch(1806);
  startDownHeavy(state);
  stepUntil(state, (current) => current.lastCombatEvent?.attackId === MOVE_ID && current.lastCombatEvent.outcome === 'hit');
  assert.strictEqual(state.fighters.p2.health, 905);
  assert.strictEqual(state.fighters.p1.hitstop, 11);
  assert.strictEqual(state.fighters.p2.hitstop, 11);
  assert.strictEqual(state.lastCombatEvent.baseHitstun, 18);
  assert.strictEqual(state.lastCombatEvent.effectiveHitstun, 0);
  assert.strictEqual(state.fighters.p2.knockdownKind, 'soft');
  assert.strictEqual(state.fighters.p2.grounded, true);
  for (let index = 0; index < 120; index++) tick(state, {});
  assert.strictEqual(state.fighters.p2.health, 905);
  assert.strictEqual(state.fighters.p2.hitCountTaken, 1);
});

run('crouch block uses 8-tick block freeze while standing guard is opened by the low', () => {
  const blocked = createMatch(1807);
  blocked.fighters.p2.dummyMode = 'crouch_block';
  startDownHeavy(blocked);
  stepUntil(blocked, (current) => current.lastCombatEvent?.attackId === MOVE_ID && current.lastCombatEvent.outcome === 'block');
  assert.strictEqual(blocked.fighters.p2.health, 1000);
  assert.strictEqual(blocked.fighters.p1.hitstop, 8);
  assert.strictEqual(blocked.fighters.p2.hitstop, 8);
  assert.strictEqual(blocked.fighters.p2.blockstun, 16);

  const standing = createMatch(1808);
  standing.fighters.p2.dummyMode = 'stand_block';
  startDownHeavy(standing);
  stepUntil(standing, (current) => current.lastCombatEvent?.attackId === MOVE_ID);
  assert.strictEqual(standing.lastCombatEvent.outcome, 'hit');
  assert.strictEqual(standing.fighters.p2.health, 905);
});

run('ground lane misses an elevated target and never moves Swahili', () => {
  const state = createMatch(1809);
  const startX = state.fighters.p1.x;
  startDownHeavy(state);
  for (let index = 0; index < 90; index++) {
    Object.assign(state.fighters.p2, { y: -160, grounded: false, phase: 'jump', vy: 0 });
    tick(state, {});
  }
  assert.strictEqual(state.fighters.p1.x, startX);
  assert.strictEqual(state.fighters.p2.health, 1000);
  assert.notStrictEqual(state.lastCombatEvent?.attackId, MOVE_ID);
});

run('whiff has no capture side switch rotation shot or hidden root travel', () => {
  const state = createMatch(1810, { p1X: -300, p2X: 300 });
  const p1Start = state.fighters.p1.x;
  const p2Start = state.fighters.p2.x;
  startDownHeavy(state);
  for (let index = 0; index < 90; index++) tick(state, {});
  assert.strictEqual(state.fighters.p1.x, p1Start);
  assert.strictEqual(state.fighters.p2.x, p2Start);
  assert.strictEqual(state.fighters.p2.health, 1000);
  assert.strictEqual(state.throwInteraction, null);
  assert.strictEqual(state.lastThrowEvent, null);
  assert.strictEqual(state.fighters.p1.throwRotation, 0);
  assert.strictEqual(state.fighters.p2.throwRotation, 0);
  assert.strictEqual(state.fighters.p1.phase, 'idle');
});

run('rollback replay remains deterministic for the Down Heavy chord', () => {
  const state = createMatch(1811);
  for (let index = 0; index < 120; index++) {
    tick(state, index === 0 ? { p1: { down: true, special: true, heavy: true } } : {});
  }
  const replay = recordReplay(state);
  const reproduced = executeReplay(replay);
  assert.deepStrictEqual(reproduced.checksums, state.checksums);
  assert.strictEqual(reproduced.checksums.at(-1), replay.finalChecksum);
});

run('candidate gate and protected legacy runtime remain intact', () => {
  const statusPath = path.join(
    __dirname, '..', '..', '..', 'tools', 'nga-forge', 'production', 'characters', 'swahili',
    'status', 'special-down-heavy-vertical-shaft-plant-v1.status.json'
  );
  const status = JSON.parse(fs.readFileSync(statusPath, 'utf8'));
  assert.strictEqual(status.candidateOnly, true);
  assert.strictEqual(status.deployable, false);
  assert.strictEqual(status.motionApproved, false);
  assert.strictEqual(status.runtimeIntegrated, true);
  assert.strictEqual(status.runtimeScope, 'local Engine V2 debug playtest only');
  assert.strictEqual(status.gate, 'awaiting_human_special_down_heavy_vertical_shaft_plant_gameplay_review');
  const bytes = fs.readFileSync(path.join(__dirname, '..', '..', 'game.js'));
  assert.strictEqual(crypto.createHash('sha256').update(bytes).digest('hex').toUpperCase(), LEGACY_GAME_SHA256);
});

console.log('Swahili Down Heavy Vertical Shaft Plant V1 tests passed: input separation, 64-tick eleven-pose presentation, one-hit low knockdown, block, ground-lane whiff, no-capture separation, replay, and release gate.');
