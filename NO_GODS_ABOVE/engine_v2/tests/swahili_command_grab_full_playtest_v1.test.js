const assert = require('assert');
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const { createMatch, executeReplay, recordReplay, tick } = require('../dist');
const { fighterDefinitions } = require('../dist/data/fighters');
const { stageFrameFor } = require('../dist/stage/fighterFrameSelector');
const {
  COMMAND_GRAB_MOTION_V1_APPROVAL,
  COMMAND_GRAB_MOTION_V1_FRAMES,
  COMMAND_GRAB_MOTION_V1_REVIEW
} = require('../dist/sandbox/commandGrabMotionV1');

const LEGACY_GAME_SHA256 = 'D081DA2D907CF6ABD978301C1637008B26CCB30B47E2CCAFCA3FEA3331910C6B';

function run(name, test) {
  test();
  console.log(`PASS ${name}`);
}

function commandGrabMatch(seed, p1X = -76, p2X = 76) {
  return createMatch(seed, { matchId: `swahili-command-grab-${seed}`, p1X, p2X });
}

function startCommandGrab(state) {
  tick(state, { p1: { special: true, throw: true } });
  assert.strictEqual(state.throwInteraction?.throwId, 'command_grab');
  assert.strictEqual(state.fighters.p1.currentAttack, null, 'command input must not also start Grave Furrow');
}

run('same-tick U plus I starts the frozen command grab contract', () => {
  const state = commandGrabMatch(2301);
  startCommandGrab(state);
  const definition = fighterDefinitions.lamuh_proto.throws.command_grab;
  assert.strictEqual(COMMAND_GRAB_MOTION_V1_APPROVAL, 'APPROVED_AS_COMMAND_GRAB_MOTION_V1_IMMUTABLE_REFERENCE');
  assert.deepStrictEqual({
    command: definition.command,
    startup: definition.startup,
    connectTick: definition.connectTick,
    releaseTick: definition.releaseTick,
    totalTicks: definition.totalTicks,
    range: definition.range,
    damage: definition.damage,
    hitstop: definition.hitstop
  }, {
    command: 'S+Throw', startup: 43, connectTick: 43, releaseTick: 80, totalTicks: 107,
    range: 165, damage: 220, hitstop: 12
  });
  assert.strictEqual(definition.totalTicks, COMMAND_GRAB_MOTION_V1_REVIEW.simulationTotalTicks);
});

run('all 24 immutable attacker poses play in source order at gameplay speed', () => {
  const state = commandGrabMatch(2302);
  startCommandGrab(state);
  const frames = [];
  while (state.throwInteraction) {
    const frame = stageFrameFor(state.fighters.p1, state);
    if (frames.at(-1) !== frame) frames.push(frame);
    tick(state, {});
  }
  assert.deepStrictEqual(frames, COMMAND_GRAB_MOTION_V1_FRAMES.map((frame) => frame.sourceId));
  assert.strictEqual(frames[9], 'command_grab_10_first_low_hook_contact');
  assert.strictEqual(frames[15], 'command_grab_16_airborne_release_v2');
  assert.strictEqual(frames[19], 'command_grab_20_midair_shot');
  assert.strictEqual(frames.at(-1), 'command_grab_24_recovery');
});

run('capture side switch release and shot produce one 220-damage hard-knockdown result', () => {
  const state = commandGrabMatch(2303);
  startCommandGrab(state);
  let connected = false;
  let sideSwitched = false;
  let damageEvents = 0;
  let maxRotation = 0;
  while (state.throwInteraction) {
    connected ||= state.throwInteraction.result === 'connected';
    sideSwitched ||= state.fighters.p2.x < state.fighters.p1.x;
    maxRotation = Math.max(maxRotation, Math.abs(state.fighters.p2.throwRotation));
    const healthBefore = state.fighters.p2.health;
    tick(state, {});
    if (state.fighters.p2.health < healthBefore) damageEvents++;
  }
  assert.ok(connected);
  assert.ok(sideSwitched, 'command grab must uniquely carry the victim through a side switch');
  assert.ok(maxRotation >= 170, 'command grab must visibly own the rotational carry');
  assert.strictEqual(damageEvents, 1, 'midair pistol shot must be the sole damage event');
  assert.strictEqual(state.fighters.p2.health, 780);
  assert.strictEqual(state.lastThrowEvent.type, 'complete');
  assert.strictEqual(state.fighters.p2.phase, 'knockdown');
  assert.strictEqual(state.fighters.p2.knockdownKind, 'hard');
});

run('victim uses generic approved reaction art and never attacker command-grab art', () => {
  const state = commandGrabMatch(2304);
  startCommandGrab(state);
  const victimFrames = [];
  while (state.throwInteraction) {
    const frame = stageFrameFor(state.fighters.p2, state);
    if (victimFrames.at(-1) !== frame) victimFrames.push(frame);
    tick(state, {});
  }
  assert.ok(victimFrames.includes('heavy_hit_reaction'));
  assert.ok(victimFrames.includes('airborne_launch_reaction'));
  assert.ok(victimFrames.includes('airborne_tumble'));
  assert.ok(victimFrames.includes('knockdown_ground_impact'));
  assert.ok(victimFrames.every((frame) => !frame.startsWith('command_grab_')));
});

run('command grab whiff completes the frozen motion without touching the victim', () => {
  const state = commandGrabMatch(2305, -220, 220);
  startCommandGrab(state);
  let whiffed = false;
  while (state.throwInteraction) {
    whiffed ||= state.throwInteraction.result === 'whiff';
    tick(state, {});
  }
  assert.ok(whiffed);
  assert.strictEqual(state.fighters.p2.health, 1000);
  assert.strictEqual(state.fighters.p2.x, 220);
  assert.strictEqual(state.fighters.p2.phase, 'idle');
});

run('mirrored command grab preserves frame order and crosses to the opposite side', () => {
  const state = commandGrabMatch(2306, 76, -76);
  tick(state, {});
  assert.strictEqual(state.fighters.p1.facing, -1);
  startCommandGrab(state);
  const frames = [];
  while (state.throwInteraction) {
    const frame = stageFrameFor(state.fighters.p1, state);
    if (frames.at(-1) !== frame) frames.push(frame);
    tick(state, {});
  }
  assert.deepStrictEqual(frames, COMMAND_GRAB_MOTION_V1_FRAMES.map((frame) => frame.sourceId));
  assert.ok(state.fighters.p2.x > state.fighters.p1.x, 'mirrored carry must cross behind the attacker');
});

run('command grab replay remains deterministic and legacy runtime remains byte-identical', () => {
  const state = commandGrabMatch(2307);
  for (let frame = 0; frame < 150; frame++) {
    tick(state, frame === 0 ? { p1: { special: true, throw: true } } : {});
  }
  const replay = recordReplay(state);
  const reproduced = executeReplay(replay);
  assert.deepStrictEqual(reproduced.checksums, state.checksums);
  assert.strictEqual(reproduced.checksums.at(-1), replay.finalChecksum);
  const bytes = fs.readFileSync(path.join(__dirname, '..', '..', 'game.js'));
  assert.strictEqual(crypto.createHash('sha256').update(bytes).digest('hex').toUpperCase(), LEGACY_GAME_SHA256);
});

console.log('Swahili Command Grab full-playtest V1 tests passed: immutable motion, input isolation, capture, side switch, rotational carry, shot parity, victim separation, whiff, mirroring, replay, and legacy lock.');
