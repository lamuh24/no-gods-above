const assert = require('assert');
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const sim = require('../dist/sandbox/swahiliSandboxSimulation');
const manifest = require('../dist/sandbox/defenseReactionPackages.generated.json');

function run(name, test) { test(); console.log(`PASS ${name}`); }
function advance(state, input, count) { for (let index = 0; index < count; index++) sim.tickSwahiliSandbox(state, index === 0 ? input : { ...input, command: undefined }); }

run('all four compiled packages are simulation-owned non-deployable timing candidates', () => {
  assert.strictEqual(manifest.deployable, false);
  assert.deepStrictEqual(manifest.animations.map((item) => item.id).sort(), ['crouching_block', 'heavy_hit_reaction', 'light_hit_reaction', 'standing_block']);
  for (const animation of manifest.animations) {
    assert.strictEqual(animation.playbackPolicy.cursorOwner, 'simulation');
    assert.strictEqual(animation.gameplayTimingStatus.authoritative, false);
    assert.strictEqual(animation.gameplayTimingStatus.state, 'sandbox_candidate_awaiting_combat_approval');
    assert.ok(animation.presentationTrack.length >= 4);
    assert.ok(animation.sourceFrames.every((frame) => /^[a-f0-9]{64}$/i.test(frame.sha256)));
  }
});

run('standing block enters, holds while input is held, and releases to idle', () => {
  const state = sim.createSwahiliSandbox();
  advance(state, { block: true }, 18);
  assert.strictEqual(state.fighters.p1.defenseCursor, 15);
  assert.strictEqual(sim.currentDefenseExposure(state.fighters.p1).sourceFrameId, 'standing_block');
  advance(state, {}, 5);
  assert.strictEqual(state.fighters.p1.state, 'idle');
  assert.strictEqual(state.fighters.p1.defensePackageId, null);
});

run('crouching block releases to crouch instead of standing idle', () => {
  const state = sim.createSwahiliSandbox();
  advance(state, { block: true, down: true }, 18);
  advance(state, { down: true }, 5);
  assert.strictEqual(state.fighters.p1.state, 'crouch');
  assert.strictEqual(state.fighters.p1.crouching, true);
});

run('candidate hitstop freezes exposure while gameplay hitstun owns return state', () => {
  for (const [weight, expectedHitstop, expectedHitstun, expectedLength] of [['light', 4, 12, 12], ['heavy', 7, 23, 23]]) {
    const state = sim.createSwahiliSandbox();
    state.fighters.p2.state = 'crouch';
    state.fighters.p2.crouching = true;
    sim.forceDefenseReaction(state, 'p2', weight);
    assert.strictEqual(state.fighters.p2.hitstop, expectedHitstop);
    assert.strictEqual(state.fighters.p2.hitstun, expectedHitstun);
    assert.strictEqual(sim.currentDefensePackage(state.fighters.p2).simulationLength, expectedLength);
    const cursor = state.fighters.p2.defenseCursor;
    advance(state, {}, expectedHitstop);
    assert.strictEqual(state.fighters.p2.defenseCursor, cursor, 'hitstop must freeze artwork exposure');
    advance(state, {}, expectedHitstun);
    assert.strictEqual(state.fighters.p2.state, 'crouch');
    assert.strictEqual(state.fighters.p2.defensePackageId, null);
  }
});

run('rapid hits restart reaction packages without automatic knockdown', () => {
  const state = sim.createSwahiliSandbox();
  sim.forceDefenseReaction(state, 'p2', 'light');
  advance(state, {}, 2);
  const firstInstance = state.fighters.p2.defensePackageInstance;
  sim.forceDefenseReaction(state, 'p2', 'heavy');
  assert.strictEqual(state.fighters.p2.defensePackageInstance, firstInstance + 1);
  assert.strictEqual(state.fighters.p2.defensePackageId, 'heavy_hit_reaction');
  assert.strictEqual(state.fighters.p2.defenseCursor, 0);
  assert.notStrictEqual(state.fighters.p2.state, 'knockdown');
});

run('presentation events are rollback-safe and deduplicated by stable event id', () => {
  const state = sim.createSwahiliSandbox();
  const before = JSON.parse(JSON.stringify(state));
  sim.forceDefenseReaction(state, 'p2', 'light');
  const ledger = [...state.presentationEventLedger];
  const events = [...state.presentationEvents];
  Object.assign(state, before);
  state.presentationEventLedger = ledger;
  state.presentationEvents = events;
  sim.forceDefenseReaction(state, 'p2', 'light');
  assert.strictEqual(state.presentationEvents.filter((event) => !event.deduplicated).length, 5);
  assert.strictEqual(state.presentationEvents.filter((event) => event.deduplicated).length, 5);
  assert.strictEqual(new Set(state.presentationEventLedger).size, 5);
});

run('approved connector bytes match package hashes and stay outside legacy runtime', () => {
  const root = path.resolve(__dirname, '..', '..', '..');
  for (const animation of manifest.animations) {
    for (const frame of animation.sourceFrames) {
      const file = path.join(root, frame.sourceUri.replace('repo://', '').replaceAll('/', path.sep));
      const digest = crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex').toUpperCase();
      assert.strictEqual(digest, frame.sha256);
    }
  }
  const bundle = fs.readFileSync(path.join(__dirname, '..', 'content-source', 'characters', 'swahili', 'character.bundle.json'), 'utf8');
  assert.ok(!bundle.includes('game.js'));
});

console.log('Swahili defense/reaction package tests passed.');
