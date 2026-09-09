const assert = require('assert');
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const { createMatch, executeReplay, recordReplay, tick } = require('../dist');
const { fighterDefinitions } = require('../dist/data/fighters');
const { attackFrameTracks } = require('../dist/stage/attackFrameTracks');
const { stageFrameFor } = require('../dist/stage/fighterFrameSelector');

const LEGACY_GAME_SHA256 = 'D081DA2D907CF6ABD978301C1637008B26CCB30B47E2CCAFCA3FEA3331910C6B';
const MOVE_ID = 'special_up_heavy';

function run(name, test) {
  test();
  console.log(`PASS ${name}`);
}

function stepUntil(state, predicate, maxTicks = 180) {
  while (!predicate(state) && state.tick < maxTicks) tick(state, {});
  assert.ok(predicate(state), `condition was not reached by tick ${maxTicks}`);
  return state;
}

function startGraveFurrow(state, input = { up: true, heavy: true }) {
  tick(state, { p1: input });
  assert.strictEqual(state.fighters.p1.currentAttack, MOVE_ID);
  return state;
}

run('candidate definition keeps the isolated Grave Furrow timing and one-contact contract', () => {
  const definition = fighterDefinitions.lamuh_proto.attacks[MOVE_ID];
  assert.strictEqual(definition.command, '8H');
  assert.deepStrictEqual({ startup: definition.startup, active: definition.active, recovery: definition.recovery }, { startup: 34, active: 5, recovery: 25 });
  assert.strictEqual(definition.startup + definition.active + definition.recovery, 64);
  assert.deepStrictEqual(definition.rootMotion, { start: 20, end: 34, velocity: 0.7 });
  assert.strictEqual(definition.hitboxes.length, 1);
  assert.deepStrictEqual(definition.hitboxes[0], {
    id: 'grave_furrow', start: 34, end: 38, rect: { x: 52, y: -132, w: 150, h: 100 },
    damage: 120, hitstop: 12, hitstun: 22, blockstun: 20, knockbackX: 8.2, knockbackY: -7.4,
    maxHits: 1, level: 'launcher', blockHitstop: 9, launches: true, juggleCost: 1
  });
});

run('standalone U is inert while same-tick Up plus Heavy starts Grave Furrow', () => {
  const unbound = createMatch(1501);
  tick(unbound, { p1: { special: true } });
  assert.strictEqual(unbound.fighters.p1.currentAttack, null);
  startGraveFurrow(createMatch(1502));
});

run('completed sixteen-frame V7 covers startup contact follow-through running recovery and remount', () => {
  const state = createMatch(1503);
  const fighter = state.fighters.p1;
  Object.assign(fighter, { phase: 'attack', currentAttack: MOVE_ID, attackFacing: 1, grounded: true });
  const track = attackFrameTracks[MOVE_ID];
  assert.deepStrictEqual([track.startup.length, track.active.length, track.recovery.length], [9, 1, 6]);
  const ordered = [...track.startup, ...track.active, ...track.recovery];
  assert.strictEqual(new Set(ordered).size, 16);
  const samples = [];
  for (let phaseTick = 0; phaseTick < 64; phaseTick += 1) {
    fighter.phaseTick = phaseTick;
    const frame = stageFrameFor(fighter, state);
    if (samples.at(-1) !== frame) samples.push(frame);
  }
  assert.deepStrictEqual(samples, ordered);
  assert.strictEqual(samples[9], 'special_up_heavy_grave_furrow_motion_10');
  assert.strictEqual(samples.at(-1), 'special_up_heavy_grave_furrow_motion_16');
});

run('normal hit applies one 120-damage contact with separate 12-tick hit freeze', () => {
  const state = createMatch(1504);
  startGraveFurrow(state);
  stepUntil(state, (current) => current.lastCombatEvent?.attackId === MOVE_ID && current.lastCombatEvent.outcome === 'hit');
  assert.strictEqual(state.fighters.p2.health, 880);
  assert.strictEqual(state.fighters.p1.hitstop, 12);
  assert.strictEqual(state.fighters.p2.hitstop, 12);
  assert.strictEqual(state.lastCombatEvent.baseHitstun, 22);
  assert.strictEqual(state.lastCombatEvent.effectiveHitstun, 30);
  assert.deepStrictEqual(state.fighters.p1.comboRoute, [MOVE_ID]);
  for (let index = 0; index < 140; index++) tick(state, {});
  assert.strictEqual(state.fighters.p2.health, 880, 'the single rising slash must never register a second hit');
  assert.strictEqual(state.fighters.p2.hitCountTaken, 1);
});

run('block uses the authored 9-tick freeze and no chip damage', () => {
  const state = createMatch(1505);
  state.fighters.p2.dummyMode = 'stand_block';
  startGraveFurrow(state);
  stepUntil(state, (current) => current.lastCombatEvent?.attackId === MOVE_ID && current.lastCombatEvent.outcome === 'block');
  assert.strictEqual(state.fighters.p2.health, 1000);
  assert.strictEqual(state.fighters.p1.hitstop, 9);
  assert.strictEqual(state.fighters.p2.hitstop, 9);
  assert.strictEqual(state.fighters.p2.blockstun, 20);
});

run('ground drag advances 10.5 units and mirrors without changing the move', () => {
  const authored = createMatch(1506, { p1X: -200, p2X: 350 });
  const authoredStart = authored.fighters.p1.x;
  startGraveFurrow(authored);
  for (let index = 0; index < 70; index++) tick(authored, {});
  assert.ok(Math.abs(authored.fighters.p1.x - authoredStart - 10.5) < 0.0001);

  const mirrored = createMatch(1506, { p1X: 200, p2X: -350 });
  const mirroredStart = mirrored.fighters.p1.x;
  startGraveFurrow(mirrored);
  for (let index = 0; index < 70; index++) tick(mirrored, {});
  assert.strictEqual(mirrored.fighters.p1.facing, -1);
  assert.ok(Math.abs(mirrored.fighters.p1.x - mirroredStart + 10.5) < 0.0001);
});

run('victim trajectory is backward-dominant with moderate lift and soft landing knockdown', () => {
  const state = createMatch(1507);
  startGraveFurrow(state);
  stepUntil(state, (current) => current.lastCombatEvent?.attackId === MOVE_ID && current.lastCombatEvent.outcome === 'hit');
  const defender = state.fighters.p2;
  const hitX = defender.x;
  let peakY = defender.y;
  let becameAirborne = !defender.grounded;
  while (!(becameAirborne && defender.grounded) && state.tick < 180) {
    tick(state, {});
    becameAirborne ||= !defender.grounded;
    peakY = Math.min(peakY, defender.y);
  }
  const horizontalTravel = Math.abs(defender.x - hitX);
  const lift = Math.abs(peakY);
  assert.ok(horizontalTravel > lift * 2, `expected backward-dominant travel, saw horizontal ${horizontalTravel} and lift ${lift}`);
  assert.ok(lift >= 18 && lift <= 40, `expected moderate lift, saw ${lift}`);
  assert.strictEqual(defender.knockdownKind, 'soft');
});

run('rollback replay remains deterministic with Grave Furrow in the input log', () => {
  const state = createMatch(1508);
  for (let index = 0; index < 120; index++) tick(state, index === 0 ? { p1: { up: true, heavy: true } } : {});
  const replay = recordReplay(state);
  const reproduced = executeReplay(replay);
  assert.deepStrictEqual(reproduced.checksums, state.checksums);
  assert.strictEqual(reproduced.checksums.at(-1), replay.finalChecksum);
});

run('protected legacy runtime remains byte-identical', () => {
  const bytes = fs.readFileSync(path.join(__dirname, '..', '..', 'game.js'));
  assert.strictEqual(crypto.createHash('sha256').update(bytes).digest('hex').toUpperCase(), LEGACY_GAME_SHA256);
});

console.log('Swahili Grave Furrow core V1 tests passed: preserved input/combat timing, connected sixteen-frame V7 presentation, hit/block feel, trajectory, mirroring, replay, and legacy lock.');
