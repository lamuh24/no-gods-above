const assert = require('assert');
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const { createMatch, executeReplay, recordReplay, tick } = require('../dist');
const { fighterDefinitions } = require('../dist/data/fighters');
const { attackFrameTracks } = require('../dist/stage/attackFrameTracks');
const { stageFrameFor } = require('../dist/stage/fighterFrameSelector');

const LEGACY_GAME_SHA256 = 'D081DA2D907CF6ABD978301C1637008B26CCB30B47E2CCAFCA3FEA3331910C6B';
const engineRoot = path.resolve(__dirname, '..');
const repoRoot = path.resolve(engineRoot, '..', '..');

const moves = [
  {
    id: 'special_forward_light', input: { right: true, special: true, light: true }, mirrorInput: { left: true, special: true, light: true },
    phases: [9, 1, 6], prefix: 'special_forward_light_motion_', contacts: [10], hitCount: 1, damage: 48,
    sourceFolder: 'special-forward-light-warning-drag-shaft-drive-motion-v3'
  },
  {
    id: 'special_forward_medium', input: { right: true, special: true, medium: true }, mirrorInput: { left: true, special: true, medium: true },
    phases: [5, 6, 5], prefix: 'special_forward_medium_motion_', contacts: [6, 11], hitCount: 2, damage: 82,
    sourceFolder: 'special-forward-medium-shoulder-rip-combination-motion-v3'
  },
  {
    id: 'special_forward_heavy', input: { right: true, special: true, heavy: true }, mirrorInput: { left: true, special: true, heavy: true },
    phases: [9, 1, 6], prefix: 'special_forward_heavy_motion_', contacts: [10], hitCount: 1, damage: 105,
    sourceFolder: 'special-forward-heavy-execution-crescent-motion-v3'
  },
  {
    id: 'special_up_heavy', input: { up: true, heavy: true }, mirrorInput: { up: true, heavy: true },
    phases: [9, 1, 6], prefix: 'special_up_heavy_grave_furrow_motion_', contacts: [10], hitCount: 1, damage: 120,
    sourceFolder: 'special-up-heavy-grave-furrow-running-slash-carry-motion-v7'
  }
];

function runScenario(move, seed, mirrored = false) {
  const state = mirrored
    ? createMatch(seed, { p1X: 76, p2X: -76 })
    : createMatch(seed, { p1X: -76, p2X: 76 });
  if (mirrored) tick(state, {});
  const input = mirrored ? move.mirrorInput : move.input;
  tick(state, { p1: input });
  assert.strictEqual(state.fighters.p1.currentAttack, move.id, `${move.id}: input route failed`);
  const events = new Map();
  for (let guard = 0; state.fighters.p1.currentAttack && guard < 180; guard += 1) {
    tick(state, {});
    const event = state.lastCombatEvent;
    if (event?.attackId === move.id && event.attacker === 'p1') events.set(`${event.tick}:${event.hitOrdinal}:${event.outcome}`, { ...event });
  }
  assert.strictEqual(state.fighters.p1.currentAttack, null, `${move.id}: failed to return to neutral`);
  assert.strictEqual(events.size, move.hitCount, `${move.id}: registered-hit parity failed`);
  assert.strictEqual(1000 - state.fighters.p2.health, move.damage, `${move.id}: playtest damage changed`);
  return { state, events: [...events.values()] };
}

for (const [index, move] of moves.entries()) {
  const definition = fighterDefinitions.lamuh_proto.attacks[move.id];
  const track = attackFrameTracks[move.id];
  assert.deepStrictEqual([track.startup.length, track.active.length, track.recovery.length], move.phases, `${move.id}: wrong phase partition`);
  const ordered = [...track.startup, ...track.active, ...track.recovery];
  assert.strictEqual(ordered.length, 16, `${move.id}: must expose all sixteen connected frames`);
  assert.strictEqual(new Set(ordered).size, 16, `${move.id}: repeated or missing authored frame`);
  assert.deepStrictEqual(ordered, Array.from({ length: 16 }, (_, frame) => `${move.prefix}${String(frame + 1).padStart(2, '0')}`));

  const state = createMatch(8100 + index);
  const fighter = state.fighters.p1;
  Object.assign(fighter, { phase: 'attack', currentAttack: move.id, grounded: true, attackFacing: 1 });
  const sequence = [];
  for (let phaseTick = 0; phaseTick < definition.startup + definition.active + definition.recovery; phaseTick += 1) {
    fighter.phaseTick = phaseTick;
    const frame = stageFrameFor(fighter, state);
    if (sequence.at(-1) !== frame) sequence.push(frame);
  }
  assert.deepStrictEqual(sequence, ordered, `${move.id}: runtime did not play the complete connected sequence in order`);
  for (const contact of move.contacts) assert.ok(ordered[contact - 1].endsWith(`_${String(contact).padStart(2, '0')}`));

  runScenario(move, 8200 + index, false);
  runScenario(move, 8300 + index, true);

  const replayState = createMatch(8400 + index);
  for (let tickIndex = 0; tickIndex < 150; tickIndex += 1) tick(replayState, tickIndex === 0 ? { p1: move.input } : {});
  const replay = recordReplay(replayState);
  assert.deepStrictEqual(executeReplay(replay).checksums, replayState.checksums, `${move.id}: rollback replay diverged`);
}

assert.deepStrictEqual(
  fighterDefinitions.lamuh_proto.attacks.special_forward_heavy,
  {
    id: 'special_forward_heavy', command: '6S+H', startup: 26, active: 4, recovery: 32, groundOnly: true,
    rootMotion: { start: 11, end: 26, velocity: 1.2 },
    hitboxes: [{ id: 'ground_drag_slice', start: 26, end: 29, rect: { x: 48, y: -62, w: 150, h: 58 }, damage: 105, hitstop: 10, hitstun: 18, blockstun: 17, knockbackX: 9, knockbackY: -4.5, maxHits: 1, level: 'low', blockHitstop: 8, launches: true, juggleCost: 1 }]
  },
  'Forward Heavy combat definition must remain unchanged while its presentation changes'
);
assert.deepStrictEqual(
  fighterDefinitions.lamuh_proto.attacks.special_up_heavy,
  {
    id: 'special_up_heavy', command: '8H', startup: 34, active: 5, recovery: 25, groundOnly: true,
    rootMotion: { start: 20, end: 34, velocity: 0.7 },
    hitboxes: [{ id: 'grave_furrow', start: 34, end: 38, rect: { x: 52, y: -132, w: 150, h: 100 }, damage: 120, hitstop: 12, hitstun: 22, blockstun: 20, knockbackX: 8.2, knockbackY: -7.4, maxHits: 1, level: 'launcher', blockHitstop: 9, launches: true, juggleCost: 1 }]
  },
  'Grave Furrow combat definition must remain unchanged while its presentation changes'
);

const unbound = createMatch(8500);
tick(unbound, { p1: { special: true } });
assert.strictEqual(unbound.fighters.p1.currentAttack, null, 'U alone must remain inert');

const spriteSource = fs.readFileSync(path.join(engineRoot, 'src', 'stage', 'spriteSources.ts'), 'utf8');
for (const move of moves) {
  assert(spriteSource.includes(`/reviews/${move.sourceFolder}/runtime_frames_alpha_clean_v1/`), `${move.id}: alpha-clean runtime frame folder not wired`);
}
assert.match(spriteSource, /01_warning_ground_drag\.png/);
assert.match(spriteSource, /16_moving_low_ready_recovery\.png/);

const integrationStatus = JSON.parse(fs.readFileSync(path.join(repoRoot, 'tools', 'nga-forge', 'production', 'characters', 'swahili', 'status', 'swahili-completed-motion-runtime-playtest-v1.status.json'), 'utf8'));
assert.strictEqual(integrationStatus.runtimeIntegrated, true);
assert.strictEqual(integrationStatus.candidateOnly, true);
assert.strictEqual(integrationStatus.deployable, false);
assert.strictEqual(integrationStatus.blenderUsed, false);
assert.deepStrictEqual(integrationStatus.integratedAnimations, moves.map((move) => move.id));
assert.strictEqual(integrationStatus.alphaCleanupApplied, true);

const alphaReport = JSON.parse(fs.readFileSync(path.join(repoRoot, 'tools', 'nga-forge', 'production', 'characters', 'swahili', 'reports', 'swahili-completed-motion-runtime-alpha-cleanup-v1.json'), 'utf8'));
assert.strictEqual(alphaReport.status, 'PASS');
assert.strictEqual(alphaReport.frameCount, 64);
assert.strictEqual(alphaReport.sourceFramesPreserved, true);
assert.strictEqual(alphaReport.whiteCheckerMatteRemoved, true);
assert.strictEqual(alphaReport.brightNeutralEdgeFringeRemoved, true);
assert.strictEqual(alphaReport.idleStyleExteriorEdgeTreatment, 'eight_pass_low_chroma_neutral_outline_removal');
assert.strictEqual(alphaReport.everyRuntimeFrameAtOrBelowIdleExteriorNeutralRatio, true);
assert.ok(alphaReport.maximumRuntimeExteriorNeutralRatio <= alphaReport.idleReferenceExteriorNeutralRatio);
assert.ok(alphaReport.totals.neutralMattePixelsRemoved > 0);
assert.ok(alphaReport.totals.edgeFringePixelsRemoved > 0);
for (const frame of alphaReport.frames) {
  assert.strictEqual(frame.width, 512);
  assert.strictEqual(frame.height, 512);
  assert.ok(frame.exteriorEdgePixelsAfter > 0);
  assert.ok(frame.exteriorNeutralRatioAfter <= alphaReport.idleReferenceExteriorNeutralRatio);
  assert.ok(fs.existsSync(path.join(repoRoot, frame.output)), `missing alpha-clean runtime frame ${frame.output}`);
}

const gameBytes = fs.readFileSync(path.join(repoRoot, 'NO_GODS_ABOVE', 'game.js'));
assert.strictEqual(crypto.createHash('sha256').update(gameBytes).digest('hex').toUpperCase(), LEGACY_GAME_SHA256);

console.log(JSON.stringify({
  status: 'PASS',
  integratedAnimations: moves.map((move) => move.id),
  connectedFrameCountEach: 16,
  visibleAndRegisteredContacts: Object.fromEntries(moves.map((move) => [move.id, move.contacts])),
  forwardMediumRegisteredHits: 2,
  uAloneInert: true,
  heavyAndGraveCombatPreserved: true,
  candidateOnly: true,
  alphaCleanupApplied: true,
  idleStyleOutlineParity: true,
  blenderUsed: false,
  legacyGameJsChanged: false
}, null, 2));
console.log('Swahili completed-motion runtime playtest V1 passed: all four sixteen-frame clips are live on the arena fighter with input, hit, mirror, replay, release-gate, and legacy locks.');
