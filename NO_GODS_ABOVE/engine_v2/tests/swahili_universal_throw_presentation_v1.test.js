const assert = require('assert');
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const { createMatch, executeReplay, recordReplay, tick } = require('../dist');
const { stageFrameFor } = require('../dist/stage/fighterFrameSelector');

const LEGACY_GAME_SHA256 = 'D081DA2D907CF6ABD978301C1637008B26CCB30B47E2CCAFCA3FEA3331910C6B';

function run(name, test) {
  test();
  console.log(`PASS ${name}`);
}

function throwMatch(seed, p1X = -30, p2X = 30) {
  return createMatch(seed, { matchId: `swahili-throw-${seed}`, p1X, p2X });
}

function collectThrowPresentation(state, firstInput) {
  tick(state, { p1: firstInput });
  const attackerFrames = [];
  const victimFrames = [];
  const victimRotations = [];
  while (state.throwInteraction) {
    const attackerFrame = stageFrameFor(state.fighters.p1, state);
    const victimFrame = stageFrameFor(state.fighters.p2, state);
    if (attackerFrames.at(-1) !== attackerFrame) attackerFrames.push(attackerFrame);
    if (victimFrames.at(-1) !== victimFrame) victimFrames.push(victimFrame);
    victimRotations.push(state.fighters.p2.throwRotation);
    tick(state, {});
  }
  return { attackerFrames, victimFrames, victimRotations };
}

run('forward throw exposes approved reach capture preparation commitment and recovery in order', () => {
  const state = throwMatch(2201);
  const presentation = collectThrowPresentation(state, { throw: true });
  assert.deepStrictEqual(presentation.attackerFrames, [
    'universal_grab_reach',
    'universal_grab_capture',
    'universal_forward_throw_preparation',
    'universal_forward_throw_commitment',
    'universal_grab_recovery'
  ]);
  assert.deepStrictEqual(presentation.victimFrames, ['idle_00', 'airborne_launch_reaction', 'airborne_tumble']);
  assert.ok(presentation.victimFrames.every((frame) => !frame.startsWith('universal_')), 'victim must never borrow attacker throw art');
  assert.ok(Math.min(...presentation.victimRotations) <= -80, 'forward throw must expose the authored victim rotation');
  assert.strictEqual(state.fighters.p2.health, 930);
  assert.strictEqual(state.fighters.p2.phase, 'knockdown');
});

run('back throw uses its distinct preparation and commitment while side switching', () => {
  const state = throwMatch(2202);
  const presentation = collectThrowPresentation(state, { left: true, throw: true });
  assert.deepStrictEqual(presentation.attackerFrames, [
    'universal_grab_reach',
    'universal_grab_capture',
    'universal_backward_throw_preparation',
    'universal_backward_throw_commitment',
    'universal_grab_recovery'
  ]);
  assert.ok(Math.max(...presentation.victimRotations) >= 180, 'back throw must expose its rotational carry');
  assert.strictEqual(state.fighters.p2.health, 925);
  assert.ok(state.fighters.p2.x < state.fighters.p1.x, 'back throw must finish behind the attacker');
});

run('throw whiff presents reach then recovery without moving or damaging the victim', () => {
  const state = throwMatch(2203, -160, 160);
  const presentation = collectThrowPresentation(state, { throw: true });
  assert.deepStrictEqual(presentation.attackerFrames, ['universal_grab_reach', 'universal_grab_recovery']);
  assert.strictEqual(state.fighters.p2.health, 1000);
  assert.strictEqual(state.fighters.p2.x, 160);
  assert.strictEqual(state.fighters.p2.phase, 'idle');
});

run('mirrored throw keeps the same semantic frame order and selector remains render-only', () => {
  const authored = throwMatch(2204, -30, 30);
  const authoredPresentation = collectThrowPresentation(authored, { throw: true });
  const mirrored = throwMatch(2204, 30, -30);
  tick(mirrored, {});
  assert.strictEqual(mirrored.fighters.p1.facing, -1);
  tick(mirrored, { p1: { throw: true } });
  const before = JSON.stringify(mirrored);
  stageFrameFor(mirrored.fighters.p1, mirrored);
  stageFrameFor(mirrored.fighters.p2, mirrored);
  assert.strictEqual(JSON.stringify(mirrored), before, 'presentation selection must not mutate simulation state');
  const mirroredFrames = [];
  while (mirrored.throwInteraction) {
    const frame = stageFrameFor(mirrored.fighters.p1, mirrored);
    if (mirroredFrames.at(-1) !== frame) mirroredFrames.push(frame);
    tick(mirrored, {});
  }
  assert.deepStrictEqual(mirroredFrames, authoredPresentation.attackerFrames);
});

run('throw replay remains deterministic with presentation coverage enabled', () => {
  const state = throwMatch(2205);
  for (let frame = 0; frame < 90; frame++) tick(state, frame === 0 ? { p1: { throw: true } } : {});
  const replay = recordReplay(state);
  const reproduced = executeReplay(replay);
  assert.deepStrictEqual(reproduced.checksums, state.checksums);
  assert.strictEqual(reproduced.checksums.at(-1), replay.finalChecksum);
});

run('stage presentation consumes deterministic victim rotation and protected legacy runtime stays locked', () => {
  const presentationSource = fs.readFileSync(path.join(__dirname, '..', 'src', 'stage', 'stagePresentation.ts'), 'utf8');
  assert.match(presentationSource, /view\.sprite\.rotation\.z\s*=\s*THREE\.MathUtils\.degToRad\(fighter\.throwRotation\)/);
  const bytes = fs.readFileSync(path.join(__dirname, '..', '..', 'game.js'));
  assert.strictEqual(crypto.createHash('sha256').update(bytes).digest('hex').toUpperCase(), LEGACY_GAME_SHA256);
});

console.log('Swahili universal throw presentation V1 tests passed: route art, victim separation, whiff recovery, mirroring, deterministic replay, rotation, and legacy lock.');
