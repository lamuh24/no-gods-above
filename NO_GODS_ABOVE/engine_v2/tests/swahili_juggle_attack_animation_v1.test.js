const assert = require('assert');
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const { createMatch, tick, currentAttackPhase } = require('../dist');
const { fighterDefinitions } = require('../dist/data/fighters');
const { stageFrameFor } = require('../dist/stage/fighterFrameSelector');
const { attackFrameTracks, frameAcrossWindow } = require('../dist/stage/attackFrameTracks');
const { JuggleRouteDriver } = require('../dist/jugglelab/driver');
const { juggleRoutes } = require('../dist/jugglelab/routes');

const LEGACY_GAME_SHA256 = 'D081DA2D907CF6ABD978301C1637008B26CCB30B47E2CCAFCA3FEA3331910C6B';
const MAX_ROUTE_TICKS = 900;

function declaredFrameIds() {
  const source = fs.readFileSync(path.join(__dirname, '..', 'src', 'stage', 'spriteSources.ts'), 'utf8');
  const table = source.slice(source.indexOf('export const swahiliStageSpriteSources'));
  return new Set([...table.matchAll(/^\s{2}([a-z0-9_]+):/gm)].map((match) => match[1]));
}

function route(id) {
  const found = juggleRoutes.find((candidate) => candidate.id === id);
  assert.ok(found, `unknown route ${id}`);
  return found;
}

/** Plays one scripted loop of a lab route and records what the presentation layer showed. */
function playRoute(routeId, seed = 1301) {
  const driver = new JuggleRouteDriver(route(routeId));
  const state = createMatch(seed);
  Object.assign(state.fighters.p1, { x: -50, facing: 1, attackFacing: 1 });
  Object.assign(state.fighters.p2, { x: 50, facing: -1, attackFacing: -1 });
  const log = [];
  for (let index = 0; index < MAX_ROUTE_TICKS; index++) {
    const input = driver.nextInput(state);
    if (driver.restartRequested) break;
    tick(state, { p1: input });
    const attacker = state.fighters.p1;
    log.push({
      tick: state.tick,
      phase: attacker.phase,
      attack: attacker.currentAttack,
      attackPhase: attacker.phase === 'attack' ? currentAttackPhase(attacker) : 'none',
      frame: stageFrameFor(attacker, state),
      defenderFrame: stageFrameFor(state.fighters.p2, state),
      defenderKnockdown: state.fighters.p2.knockdownKind,
      comboCount: attacker.comboCount,
      grounded: attacker.grounded
    });
  }
  assert.ok(log.length > 0 && log.length < MAX_ROUTE_TICKS, `route ${routeId} must finish inside ${MAX_ROUTE_TICKS} ticks`);
  return { state, driver, log };
}

function observedAttackOrder(log) {
  const order = [];
  for (const entry of log) {
    if (entry.phase !== 'attack' || !entry.attack) continue;
    if (order.at(-1) !== entry.attack) order.push(entry.attack);
  }
  return order;
}

function framesForAttack(log, attackId) {
  return new Set(log.filter((entry) => entry.phase === 'attack' && entry.attack === attackId).map((entry) => entry.frame));
}

function testEveryAttackTrackCoversEveryPhaseWithDistinctPoses() {
  const declared = declaredFrameIds();
  const swahiliAttacks = fighterDefinitions.lamuh_proto.attacks;
  for (const [attackId, track] of Object.entries(attackFrameTracks)) {
    if (swahiliAttacks[attackId]) continue;
    assert.ok(attackId.startsWith('legacy_') && fighterDefinitions.lamuh_legacy_v2.attacks[attackId],
      `${attackId} outside Swahili's kit must belong to the separate Lamuh presentation`);
    assert.deepStrictEqual([track.startup, track.active, track.recovery], [[], [], []],
      `${attackId} must not borrow Swahili sprite sources`);
  }
  for (const [attackId, definition] of Object.entries(swahiliAttacks)) {
    const track = attackFrameTracks[attackId];
    assert.ok(track, `${attackId} in Swahili's kit must have an authored track`);
    for (const window of ['startup', 'active', 'recovery']) {
      assert.ok(track[window].length > 0, `${attackId} ${window} needs at least one authored pose`);
      assert.ok(definition[window] >= track[window].length, `${attackId} ${window} authors more poses than the simulation window holds`);
      for (const frame of track[window]) assert.ok(declared.has(frame), `${attackId} ${window} pose ${frame} is not a declared stage sprite source`);
    }
    const all = [...track.startup, ...track.active, ...track.recovery];
    assert.strictEqual(new Set(all).size, all.length, `${attackId} must not repeat a pose across its own windows`);
  }
}

function testAuthoredPosesSpreadAcrossTheSimulationWindow() {
  assert.strictEqual(frameAcrossWindow(['a', 'b'], 0, 3), 'a');
  assert.strictEqual(frameAcrossWindow(['a', 'b'], 1, 3), 'a');
  assert.strictEqual(frameAcrossWindow(['a', 'b'], 2, 3), 'b');
  assert.strictEqual(frameAcrossWindow(['a'], 9, 3), 'a', 'an overrun cursor must clamp to the last pose');
  assert.strictEqual(frameAcrossWindow([], 0, 3), null);
  assert.strictEqual(frameAcrossWindow(['a'], 0, 0), null, 'a zero-length window has no artwork');
}

function testAttackerAnimatesThroughTheWholeJuggle() {
  const { state, driver, log } = playRoute('air_light_medium_heavy');
  assert.strictEqual(driver.desyncs, 0, driver.lastDesync ?? 'route must stay in sync');
  assert.deepStrictEqual(observedAttackOrder(log), [...route('air_light_medium_heavy').expectedRoute]);

  const airborneJuggle = log.filter((entry) => !entry.grounded);
  const airborneFrames = new Set(airborneJuggle.map((entry) => entry.frame));
  assert.ok(airborneFrames.size >= 8, `attacker must not hold one pose in the air, saw ${[...airborneFrames].join(', ')}`);

  // Cancelled links are cut short by the next attack, so only the uncancelled ender is required to
  // play startup, contact, and recovery artwork.
  const expected = route('air_light_medium_heavy').expectedRoute;
  expected.forEach((attackId, index) => {
    const frames = framesForAttack(log, attackId);
    const minimum = index === expected.length - 1 ? 3 : 2;
    assert.ok(frames.size >= minimum, `${attackId} must show at least ${minimum} poses, saw ${[...frames].join(', ')}`);
  });
  const enderFrames = framesForAttack(log, expected.at(-1));
  assert.ok(enderFrames.has(attackFrameTracks[expected.at(-1)].recovery[0]), 'the ender must play its authored recovery artwork');

  const attackFrames = new Set(log.filter((entry) => entry.phase === 'attack').map((entry) => entry.frame));
  assert.ok(attackFrames.size >= 10, `the juggle must play at least 10 distinct attacker poses, saw ${[...attackFrames].join(', ')}`);
  assert.ok(log.some((entry) => entry.defenderKnockdown === 'soft'), 'the ender must still produce a soft knockdown');
  assert.strictEqual(Math.max(...log.map((entry) => entry.comboCount)), expected.length, 'every scripted attack must connect');
  assert.ok(state.fighters.p1.grounded, 'the loop must end with the attacker back on the ground');
}

function testAttackingNeverFallsBackToIdleOrReactionArtwork() {
  for (const routeId of ['air_light_medium_heavy', 'air_five_action', 'air_heavy_only', 'ground_chain']) {
    const { log, driver } = playRoute(routeId, 1401);
    assert.strictEqual(driver.desyncs, 0, `${routeId} desynced: ${driver.lastDesync}`);
    assert.deepStrictEqual(observedAttackOrder(log), [...route(routeId).expectedRoute], `${routeId} did not play its declared attacks`);
    for (const entry of log) {
      if (entry.phase !== 'attack') continue;
      assert.ok(!entry.frame.startsWith('idle_'), `${routeId} showed idle artwork during ${entry.attack} at tick ${entry.tick}`);
      assert.ok(!entry.frame.includes('hit_'), `${routeId} showed reaction artwork during ${entry.attack} at tick ${entry.tick}`);
      assert.ok(entry.frame.startsWith(entry.attack), `${routeId} attack ${entry.attack} showed unrelated artwork ${entry.frame}`);
    }
  }
}

function testContactPoseIsShownOnTheActiveWindow() {
  const { log } = playRoute('air_five_action', 1402);
  const activeEntries = log.filter((entry) => entry.attackPhase === 'active');
  assert.ok(activeEntries.length > 0);
  for (const entry of activeEntries) {
    assert.strictEqual(entry.frame, attackFrameTracks[entry.attack].active[0], `${entry.attack} must show its authored contact pose while the hitbox is live`);
  }
  const startupEntries = log.filter((entry) => entry.attackPhase === 'startup');
  for (const entry of startupEntries) {
    assert.ok(attackFrameTracks[entry.attack].startup.includes(entry.frame), `${entry.attack} startup artwork must come from the startup window`);
  }
}

function testDefenderStillPlaysApprovedReactionMotion() {
  const { log } = playRoute('air_light_medium_heavy', 1403);
  const defenderFrames = new Set(log.map((entry) => entry.defenderFrame));
  assert.ok(defenderFrames.has('airborne_launch_reaction'));
  assert.ok(defenderFrames.has('airborne_tumble'));
  assert.ok(defenderFrames.has('knockdown_ground_impact'));
}

function testAirborneAndCrouchStatesLeaveTheIdleLoop() {
  const state = createMatch(1404);
  const fighter = state.fighters.p1;

  Object.assign(fighter, { phase: 'jump_startup', phaseTick: 1, grounded: true, vy: 0 });
  assert.strictEqual(stageFrameFor(fighter, state), 'jump_anticipation');
  Object.assign(fighter, { phase: 'jump', phaseTick: 0, grounded: false, vy: -18 });
  assert.strictEqual(stageFrameFor(fighter, state), 'jump_takeoff');
  Object.assign(fighter, { phaseTick: 6, vy: -12 });
  assert.strictEqual(stageFrameFor(fighter, state), 'jump_rising');
  fighter.vy = 0;
  assert.strictEqual(stageFrameFor(fighter, state), 'jump_apex');
  fighter.vy = 9;
  assert.strictEqual(stageFrameFor(fighter, state), 'jump_falling');
  Object.assign(fighter, { phase: 'landing', grounded: true, vy: 0, phaseTick: 1 });
  assert.strictEqual(stageFrameFor(fighter, state), 'jump_soft_landing');
  Object.assign(fighter, { phase: 'crouch', phaseTick: 3 });
  assert.strictEqual(stageFrameFor(fighter, state), 'crouch_stance');
}

function testFullRuntimeMovementAndDefenseUseAuthoredMotion() {
  const state = createMatch(1406);
  const fighter = state.fighters.p1;

  const uniqueFrames = (phase, ticks, extra = {}) => {
    const frames = new Set();
    for (let phaseTick = 0; phaseTick < ticks; phaseTick++) {
      Object.assign(fighter, { phase, phaseTick, grounded: true, currentAttack: null, ...extra });
      frames.add(stageFrameFor(fighter, state));
    }
    return frames;
  };

  const forwardWalk = uniqueFrames('walk_forward', 40);
  assert.strictEqual(forwardWalk.size, 8, `forward walk must play all eight video-repair frames across the contact-weighted 40-tick cycle, saw ${[...forwardWalk].join(', ')}`);
  const backwardWalk = uniqueFrames('walk_backward', 25);
  assert.strictEqual(backwardWalk.size, 5, `backward walk must play all five current frames, saw ${[...backwardWalk].join(', ')}`);
  const dash = uniqueFrames('dash', fighterDefinitions[fighter.kind].movement.dashDuration);
  assert.strictEqual(dash.size, 6, `dash must spread all six repaired poses, saw ${[...dash].join(', ')}`);
  const backdash = uniqueFrames('backdash', fighterDefinitions[fighter.kind].movement.backdashDuration);
  assert.strictEqual(backdash.size, 6, `backdash must spread all six repaired poses, saw ${[...backdash].join(', ')}`);

  Object.assign(fighter, { phase: 'block', phaseTick: 0, crouchBlocking: false });
  assert.strictEqual(stageFrameFor(fighter, state), 'standing_block_entry');
  fighter.phaseTick = 3;
  assert.strictEqual(stageFrameFor(fighter, state), 'standing_block');
  Object.assign(fighter, { phaseTick: 0, crouchBlocking: true });
  assert.strictEqual(stageFrameFor(fighter, state), 'crouching_block_entry');
  fighter.phaseTick = 3;
  assert.strictEqual(stageFrameFor(fighter, state), 'crouching_block');
}

function testEverySimulationPhaseHasAnIntentionalPresentationFrame() {
  const state = createMatch(1407);
  const fighter = state.fighters.p1;
  const phases = ['idle', 'walk_forward', 'walk_backward', 'crouch', 'jump_startup', 'jump', 'air_recovery', 'landing', 'dash', 'backdash', 'roman_cancel', 'burst', 'block', 'hit_reaction', 'knockdown', 'getup'];
  for (const phase of phases) {
    Object.assign(fighter, { phase, phaseTick: 3, grounded: phase !== 'jump' && phase !== 'air_recovery', currentAttack: null, hitstun: phase === 'hit_reaction' ? 4 : 0 });
    const frame = stageFrameFor(fighter, state);
    assert.ok(frame && declaredFrameIds().has(frame), `${phase} must resolve to a declared presentation frame, saw ${frame}`);
  }
}

function testPresentationSelectionCannotMutateSimulation() {
  const { state } = playRoute('air_heavy_only', 1405);
  const before = JSON.stringify(state);
  stageFrameFor(state.fighters.p1, state);
  stageFrameFor(state.fighters.p2, state);
  assert.strictEqual(JSON.stringify(state), before);
}

function testLegacyGameRemainsUntouched() {
  const bytes = fs.readFileSync(path.join(__dirname, '..', '..', 'game.js'));
  assert.strictEqual(crypto.createHash('sha256').update(bytes).digest('hex').toUpperCase(), LEGACY_GAME_SHA256);
}

for (const test of [
  testEveryAttackTrackCoversEveryPhaseWithDistinctPoses,
  testAuthoredPosesSpreadAcrossTheSimulationWindow,
  testAttackerAnimatesThroughTheWholeJuggle,
  testAttackingNeverFallsBackToIdleOrReactionArtwork,
  testContactPoseIsShownOnTheActiveWindow,
  testDefenderStillPlaysApprovedReactionMotion,
  testAirborneAndCrouchStatesLeaveTheIdleLoop,
  testFullRuntimeMovementAndDefenseUseAuthoredMotion,
  testEverySimulationPhaseHasAnIntentionalPresentationFrame,
  testPresentationSelectionCannotMutateSimulation,
  testLegacyGameRemainsUntouched
]) {
  test();
  console.log(`PASS ${test.name}`);
}
