const assert = require('assert');
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const { createMatch, executeReplay, recordReplay, tick } = require('../dist');
const { fighterDefinitions } = require('../dist/data/fighters');
const { attackFrameTracks } = require('../dist/stage/attackFrameTracks');
const { stageFrameFor } = require('../dist/stage/fighterFrameSelector');

const LEGACY_GAME_SHA256 = 'D081DA2D907CF6ABD978301C1637008B26CCB30B47E2CCAFCA3FEA3331910C6B';
const MOVE_ID = 'special_forward_heavy';

function run(name, test) {
  test();
  console.log(`PASS ${name}`);
}

function stepUntil(state, predicate, maxTicks = 180) {
  while (!predicate(state) && state.tick < maxTicks) tick(state, {});
  assert.ok(predicate(state), `condition was not reached by tick ${maxTicks}`);
  return state;
}

function startForwardHeavy(state, input) {
  tick(state, { p1: input || { right: true, special: true, heavy: true } });
  assert.strictEqual(state.fighters.p1.currentAttack, MOVE_ID);
  return state;
}

run('candidate definition separates startup active recovery and conservative impact feel', () => {
  const definition = fighterDefinitions.lamuh_proto.attacks[MOVE_ID];
  assert.strictEqual(definition.command, '6S+H');
  assert.deepStrictEqual(
    { startup: definition.startup, active: definition.active, recovery: definition.recovery },
    { startup: 26, active: 4, recovery: 32 }
  );
  assert.strictEqual(definition.startup + definition.active + definition.recovery, 62);
  assert.deepStrictEqual(definition.rootMotion, { start: 11, end: 26, velocity: 1.2 });
  assert.strictEqual(definition.hitboxes.length, 1);
  assert.deepStrictEqual(definition.hitboxes[0], {
    id: 'ground_drag_slice', start: 26, end: 29, rect: { x: 48, y: -62, w: 150, h: 58 },
    damage: 105, hitstop: 10, hitstun: 18, blockstun: 17, knockbackX: 9, knockbackY: -4.5,
    maxHits: 1, level: 'low', blockHitstop: 8, launches: true, juggleCost: 1
  });
});

run('toward plus Special plus Heavy starts the slice in authored and mirrored facing', () => {
  startForwardHeavy(createMatch(1601));

  const mirrored = createMatch(1602, { p1X: 160, p2X: -160 });
  tick(mirrored, {});
  assert.strictEqual(mirrored.fighters.p1.facing, -1);
  startForwardHeavy(mirrored, { left: true, special: true, heavy: true });

  const unbound = createMatch(1603);
  tick(unbound, { p1: { special: true } });
  assert.strictEqual(unbound.fighters.p1.currentAttack, null, 'grounded Special alone must remain inert');
});

run('completed sixteen-frame V3 reads as continuous load one contact carry-through and recovery', () => {
  const state = createMatch(1604);
  const fighter = state.fighters.p1;
  Object.assign(fighter, { phase: 'attack', currentAttack: MOVE_ID, attackFacing: 1, grounded: true });
  const track = attackFrameTracks[MOVE_ID];
  assert.deepStrictEqual([track.startup.length, track.active.length, track.recovery.length], [9, 1, 6]);
  const ordered = [...track.startup, ...track.active, ...track.recovery];
  assert.strictEqual(new Set(ordered).size, 16);
  assert.ok(ordered.every((sourceId) => !sourceId.includes('command_grab')));
  const samples = [];
  for (let phaseTick = 0; phaseTick < 62; phaseTick += 1) {
    fighter.phaseTick = phaseTick;
    const frame = stageFrameFor(fighter, state);
    if (samples.at(-1) !== frame) samples.push(frame);
  }
  assert.deepStrictEqual(samples, ordered);
  assert.strictEqual(samples[9], 'special_forward_heavy_motion_10');
  assert.strictEqual(samples.at(-1), 'special_forward_heavy_motion_16');
});

run('one low slice registers one 105-damage hit with 10-tick hitstop', () => {
  const state = createMatch(1605);
  startForwardHeavy(state);
  stepUntil(state, (current) => current.lastCombatEvent?.attackId === MOVE_ID && current.lastCombatEvent.outcome === 'hit');
  assert.strictEqual(state.fighters.p2.health, 895);
  assert.strictEqual(state.fighters.p1.hitstop, 10);
  assert.strictEqual(state.fighters.p2.hitstop, 10);
  assert.strictEqual(state.lastCombatEvent.baseHitstun, 18);
  assert.strictEqual(state.lastCombatEvent.effectiveHitstun, 26);
  for (let index = 0; index < 140; index++) tick(state, {});
  assert.strictEqual(state.fighters.p2.health, 895);
  assert.strictEqual(state.fighters.p2.hitCountTaken, 1);
});

run('crouch block uses separate 8-tick block freeze with no chip damage', () => {
  const state = createMatch(1606);
  state.fighters.p2.dummyMode = 'crouch_block';
  startForwardHeavy(state);
  stepUntil(state, (current) => current.lastCombatEvent?.attackId === MOVE_ID && current.lastCombatEvent.outcome === 'block');
  assert.strictEqual(state.fighters.p2.health, 1000);
  assert.strictEqual(state.fighters.p1.hitstop, 8);
  assert.strictEqual(state.fighters.p2.hitstop, 8);
  assert.strictEqual(state.fighters.p2.blockstun, 17);
});

run('root travel is committed but modest and mirrors exactly', () => {
  const authored = createMatch(1607, { p1X: -240, p2X: 350 });
  const authoredStart = authored.fighters.p1.x;
  startForwardHeavy(authored);
  for (let index = 0; index < 70; index++) tick(authored, {});
  assert.ok(Math.abs(authored.fighters.p1.x - authoredStart - 19.2) < 0.0001);

  const mirrored = createMatch(1607, { p1X: 240, p2X: -350 });
  tick(mirrored, {});
  const mirroredStart = mirrored.fighters.p1.x;
  startForwardHeavy(mirrored, { left: true, special: true, heavy: true });
  for (let index = 0; index < 70; index++) tick(mirrored, {});
  assert.ok(Math.abs(mirrored.fighters.p1.x - mirroredStart + 19.2) < 0.0001);
});

run('victim result is horizontal-dominant with a low lift and soft landing knockdown', () => {
  const state = createMatch(1608);
  startForwardHeavy(state);
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
  assert.ok(horizontalTravel > lift * 5, `expected horizontal-dominant send, saw horizontal ${horizontalTravel} and lift ${lift}`);
  assert.ok(lift >= 4 && lift <= 12, `expected low lift, saw ${lift}`);
  assert.strictEqual(defender.knockdownKind, 'soft');
});

run('whiff recovers without capture side switch rotation or shot behavior', () => {
  const state = createMatch(1609, { p1X: -300, p2X: 300 });
  const p2Start = state.fighters.p2.x;
  startForwardHeavy(state);
  for (let index = 0; index < 80; index++) tick(state, {});
  assert.strictEqual(state.fighters.p2.health, 1000);
  assert.strictEqual(state.fighters.p2.x, p2Start);
  assert.strictEqual(state.throwInteraction, null);
  assert.strictEqual(state.lastThrowEvent, null);
  assert.strictEqual(state.fighters.p1.throwRotation, 0);
  assert.strictEqual(state.fighters.p2.throwRotation, 0);
  assert.strictEqual(state.fighters.p1.phase, 'idle');
});

run('rollback replay remains deterministic for the Forward Heavy chord', () => {
  const state = createMatch(1610);
  for (let index = 0; index < 120; index++) {
    tick(state, index === 0 ? { p1: { right: true, special: true, heavy: true } } : {});
  }
  const replay = recordReplay(state);
  const reproduced = executeReplay(replay);
  assert.deepStrictEqual(reproduced.checksums, state.checksums);
  assert.strictEqual(reproduced.checksums.at(-1), replay.finalChecksum);
});

run('candidate gate and protected legacy runtime remain intact', () => {
  const statusPath = path.join(
    __dirname, '..', '..', '..', 'tools', 'nga-forge', 'production', 'characters', 'swahili',
    'status', 'special-forward-heavy-ground-drag-slice-v1.status.json'
  );
  const status = JSON.parse(fs.readFileSync(statusPath, 'utf8'));
  assert.strictEqual(status.candidateOnly, true);
  assert.strictEqual(status.deployable, false);
  assert.strictEqual(status.motionApproved, false);
  assert.strictEqual(status.gate, 'awaiting_human_special_forward_heavy_gameplay_review');
  const bytes = fs.readFileSync(path.join(__dirname, '..', '..', 'game.js'));
  assert.strictEqual(crypto.createHash('sha256').update(bytes).digest('hex').toUpperCase(), LEGACY_GAME_SHA256);
});

console.log('Swahili Forward Heavy Ground-Drag Slice V1 tests passed: preserved input/combat timing, connected sixteen-frame V3 presentation, one-hit parity, block, trajectory, replay, and release gate.');
