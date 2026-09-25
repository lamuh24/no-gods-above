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

function startDownHeavy(state) {
  tick(state, { p1: { down: true, special: true, heavy: true } });
  assert.strictEqual(state.fighters.p1.currentAttack, MOVE_ID);
}

function playToIdle(state, ticks = 160) {
  const events = [];
  let previousEventTick = state.lastCombatEvent?.tick;
  for (let index = 0; index < ticks; index += 1) {
    tick(state, {});
    if (state.lastCombatEvent && state.lastCombatEvent.tick !== previousEventTick) {
      events.push({ ...state.lastCombatEvent });
      previousEventTick = state.lastCombatEvent.tick;
    }
  }
  return events;
}

run('Grounded Verdict is a stationary 80-tick two-contact Heavy process', () => {
  const definition = fighterDefinitions.lamuh_proto.attacks[MOVE_ID];
  assert.strictEqual(definition.command, '2S+H');
  assert.deepStrictEqual(
    { startup: definition.startup, active: definition.active, recovery: definition.recovery },
    { startup: 28, active: 24, recovery: 28 }
  );
  assert.strictEqual(definition.startup + definition.active + definition.recovery, 80);
  assert.strictEqual(definition.rootMotion, undefined);
  assert.strictEqual(definition.cancel, undefined);
  assert.deepStrictEqual(definition.hitboxes.map(({ id, start, end, damage, hitstop, hitstun, blockstun, level, knockdown }) => (
    { id, start, end, damage, hitstop, hitstun, blockstun, level, knockdown: knockdown || null }
  )), [
    { id: 'grounded_verdict_staff_plant', start: 28, end: 31, damage: 40, hitstop: 8, hitstun: 22, blockstun: 18, level: 'low', knockdown: null },
    { id: 'grounded_verdict_contract_blast', start: 49, end: 51, damage: 70, hitstop: 11, hitstun: 18, blockstun: 16, level: 'mid', knockdown: 'soft' }
  ]);
});

run('five startup seven process and six recovery poses expose the full authored sequence', () => {
  const state = createMatch(2601);
  const fighter = state.fighters.p1;
  Object.assign(fighter, { phase: 'attack', currentAttack: MOVE_ID, attackFacing: 1, grounded: true });
  const track = attackFrameTracks[MOVE_ID];
  assert.deepStrictEqual([track.startup.length, track.active.length, track.recovery.length], [5, 7, 6]);
  const ordered = [...track.startup, ...track.active, ...track.recovery];
  assert.strictEqual(ordered.length, 18);
  assert.strictEqual(new Set(ordered).size, 18);
  assert.ok(ordered.every((sourceId) => !sourceId.includes('command_grab')));
  const phaseTicks = [0, 6, 12, 17, 23, 28, 32, 35, 39, 42, 46, 49, 52, 57, 62, 66, 71, 76];
  const samples = phaseTicks.map((phaseTick) => {
    fighter.phaseTick = phaseTick;
    return stageFrameFor(fighter, state);
  });
  assert.deepStrictEqual(samples, ordered);
  assert.strictEqual(samples[5], 'special_down_heavy_staff_plant_contact');
  assert.strictEqual(samples[11], 'special_down_heavy_contract_blast_contact');
  assert.strictEqual(samples[15], 'special_down_heavy_scythe_reclaim');
});

run('staff plant and simultaneous dual blast register exactly two escalating hits', () => {
  const state = createMatch(2602);
  startDownHeavy(state);
  const events = playToIdle(state).filter((event) => event.attackId === MOVE_ID);
  assert.deepStrictEqual(events.map((event) => event.outcome), ['hit', 'hit']);
  assert.deepStrictEqual(events.map((event) => event.hitOrdinal), [1, 2]);
  assert.deepStrictEqual(events.map((event) => event.damage), [40, 64]);
  assert.deepStrictEqual(events.map((event) => event.baseHitstun), [22, 18]);
  assert.strictEqual(state.fighters.p2.health, 896);
  assert.strictEqual(state.fighters.p2.hitCountTaken, 2);
  assert.strictEqual(state.fighters.p2.knockdownKind, 'none');
  assert.strictEqual(state.fighters.p1.phase, 'idle');
});

run('crouch guard blocks both contacts while standing guard is opened by the low plant', () => {
  const crouch = createMatch(2603);
  crouch.fighters.p2.dummyMode = 'crouch_block';
  startDownHeavy(crouch);
  const blockedEvents = playToIdle(crouch).filter((event) => event.attackId === MOVE_ID);
  assert.deepStrictEqual(blockedEvents.map((event) => event.outcome), ['block', 'block']);
  assert.strictEqual(crouch.fighters.p2.health, 1000);

  const standing = createMatch(2604);
  standing.fighters.p2.dummyMode = 'stand_block';
  startDownHeavy(standing);
  const hitEvents = playToIdle(standing).filter((event) => event.attackId === MOVE_ID);
  assert.deepStrictEqual(hitEvents.map((event) => event.outcome), ['hit', 'hit']);
  assert.strictEqual(standing.fighters.p2.health, 896);
});

run('input remains isolated from crouching Heavy, Grave Furrow, and Command Grab', () => {
  startDownHeavy(createMatch(2605));

  const crouchingHeavy = createMatch(2606);
  tick(crouchingHeavy, { p1: { down: true, heavy: true } });
  assert.strictEqual(crouchingHeavy.fighters.p1.currentAttack, 'crouching_heavy');

  const unbound = createMatch(2607);
  tick(unbound, { p1: { special: true } });
  assert.strictEqual(unbound.fighters.p1.currentAttack, null);

  const commandGrab = createMatch(2608);
  tick(commandGrab, { p1: { special: true, throw: true } });
  assert.strictEqual(commandGrab.throwInteraction?.throwId, 'command_grab');
});

run('whiff has no travel capture side switch victim rotation shot or projectile state', () => {
  const state = createMatch(2609, { p1X: -300, p2X: 300 });
  const p1Start = state.fighters.p1.x;
  const p2Start = state.fighters.p2.x;
  startDownHeavy(state);
  playToIdle(state);
  assert.strictEqual(state.fighters.p1.x, p1Start);
  assert.strictEqual(state.fighters.p2.x, p2Start);
  assert.strictEqual(state.fighters.p2.health, 1000);
  assert.strictEqual(state.throwInteraction, null);
  assert.strictEqual(state.lastThrowEvent, null);
  assert.strictEqual(state.fighters.p1.throwRotation, 0);
  assert.strictEqual(state.fighters.p2.throwRotation, 0);
  assert.strictEqual(fighterDefinitions.lamuh_proto.attacks[MOVE_ID].projectile, undefined);
});

run('rollback replay remains deterministic for the full two-hit chord', () => {
  const state = createMatch(2610);
  for (let index = 0; index < 160; index += 1) {
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
    'status', 'special-down-heavy-grounded-verdict-v2.status.json'
  );
  const status = JSON.parse(fs.readFileSync(statusPath, 'utf8'));
  assert.strictEqual(status.candidateOnly, true);
  assert.strictEqual(status.deployable, false);
  assert.strictEqual(status.motionApproved, false);
  assert.strictEqual(status.runtimeIntegrated, true);
  assert.strictEqual(status.runtimeScope, 'local Engine V2 debug playtest only');
  assert.strictEqual(status.gate, 'awaiting_human_special_down_heavy_grounded_verdict_v2_gameplay_review');
  const bytes = fs.readFileSync(path.join(__dirname, '..', '..', 'game.js'));
  assert.strictEqual(crypto.createHash('sha256').update(bytes).digest('hex').toUpperCase(), LEGACY_GAME_SHA256);
});

console.log('Swahili Down Heavy Grounded Verdict V2 tests passed: 80-tick presentation, two-hit parity, guard behavior, input isolation, no capture/travel/projectile leakage, replay, and release gate.');
