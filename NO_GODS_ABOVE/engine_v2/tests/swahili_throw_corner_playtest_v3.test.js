const assert = require('assert');
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const { tick } = require('../dist');
const { fighterDefinitions } = require('../dist/data/fighters');
const {
  createThrowReviewScenario,
  THROW_REVIEW_SCENARIO_ORDER,
  THROW_REVIEW_SCENARIO_ORDER_V2,
  THROW_REVIEW_SCENARIO_ORDER_V3
} = require('../dist/debug/throwReviewScenarios');

const LEGACY_GAME_SHA256 = 'D081DA2D907CF6ABD978301C1637008B26CCB30B47E2CCAFCA3FEA3331910C6B';
const V3_IDS = [
  'p2_forward_throw_left_corner',
  'p1_command_grab_right_corner',
  'p2_command_grab_left_corner'
];

function rememberEvent(events, state) {
  if (state.lastThrowEvent && events.at(-1)?.eventId !== state.lastThrowEvent.eventId) {
    events.push({ ...state.lastThrowEvent });
  }
}

function runScenario(id, seed) {
  const { definition, state, input } = createThrowReviewScenario(id, seed);
  const attacker = state.fighters[definition.attacker];
  const defenderId = definition.attacker === 'p1' ? 'p2' : 'p1';
  const defender = state.fighters[defenderId];
  const defenderStartHealth = defender.health;
  const startFacing = attacker.facing;
  const events = [];
  let damageEvents = 0;
  let elapsedTicks = 1;

  tick(state, input);
  assert.strictEqual(state.throwInteraction?.throwId, definition.expectedThrowId, `${id}: wrong throw route`);
  assert.strictEqual(state.throwInteraction?.attacker, definition.attacker, `${id}: wrong attacker`);
  rememberEvent(events, state);

  while (state.throwInteraction) {
    const healthBefore = defender.health;
    tick(state, {});
    elapsedTicks += 1;
    if (defender.health < healthBefore) damageEvents += 1;
    rememberEvent(events, state);
    for (const fighter of Object.values(state.fighters)) {
      assert.ok(fighter.x >= state.stage.left && fighter.x <= state.stage.right, `${id}: fighter escaped horizontal bounds`);
      assert.ok(fighter.y >= state.stage.ceilingY && fighter.y <= state.stage.groundY, `${id}: fighter escaped vertical bounds`);
    }
    assert.ok(elapsedTicks < 200, `${id}: scenario did not terminate`);
  }
  rememberEvent(events, state);

  const sideSwitched = (defender.x - attacker.x) * startFacing < 0;
  assert.deepStrictEqual(events.map((event) => event.type), ['startup', 'connect', 'release', 'complete'], `${id}: lifecycle mismatch`);
  assert.strictEqual(defenderStartHealth - defender.health, definition.expectedDamage, `${id}: damage mismatch`);
  assert.strictEqual(damageEvents, 1, `${id}: connected throw must register exactly one damage event`);
  assert.strictEqual(sideSwitched, definition.expectedSideSwitch, `${id}: side-switch mismatch`);
  assert.strictEqual(attacker.phase, 'idle', `${id}: attacker did not return to idle`);

  return {
    id,
    elapsedTicks,
    damage: defenderStartHealth - defender.health,
    sideSwitched,
    eventTypes: events.map((event) => event.type),
    finalPositions: { p1: state.fighters.p1.x, p2: state.fighters.p2.x }
  };
}

function assertMirrored(p1Result, p2Result, label) {
  assert.strictEqual(p2Result.elapsedTicks, p1Result.elapsedTicks, `${label}: duration parity failed`);
  assert.strictEqual(p2Result.damage, p1Result.damage, `${label}: damage parity failed`);
  assert.strictEqual(p2Result.sideSwitched, p1Result.sideSwitched, `${label}: side-switch parity failed`);
  assert.deepStrictEqual(p2Result.eventTypes, p1Result.eventTypes, `${label}: lifecycle parity failed`);
  assert.ok(Math.abs(p2Result.finalPositions.p1 + p1Result.finalPositions.p2) < 1e-9, `${label}: mirrored P1 position mismatch`);
  assert.ok(Math.abs(p2Result.finalPositions.p2 + p1Result.finalPositions.p1) < 1e-9, `${label}: mirrored P2 position mismatch`);
}

assert.strictEqual(THROW_REVIEW_SCENARIO_ORDER.length, 9, 'V1 evidence surface changed');
assert.strictEqual(THROW_REVIEW_SCENARIO_ORDER_V2.length, 11, 'V2 evidence surface changed');
assert.strictEqual(THROW_REVIEW_SCENARIO_ORDER_V3.length, 14, 'V3 must expose all 14 scenarios');
assert.deepStrictEqual(THROW_REVIEW_SCENARIO_ORDER_V3.slice(0, 11), THROW_REVIEW_SCENARIO_ORDER_V2, 'V3 must preserve V2 order');
assert.deepStrictEqual(THROW_REVIEW_SCENARIO_ORDER_V3.slice(11), V3_IDS, 'V3 corner scenarios missing');
assert.strictEqual(new Set(THROW_REVIEW_SCENARIO_ORDER_V3).size, 14, 'V3 scenario IDs must be unique');

const p2ForwardSetup = createThrowReviewScenario('p2_forward_throw_left_corner', 5601);
assert.strictEqual(p2ForwardSetup.input.p1, undefined, 'P2 forward-corner scenario must not queue P1 input');
assert.deepStrictEqual(p2ForwardSetup.input.p2, { throw: true }, 'P2 forward-corner scenario must use normal throw input');
for (const id of ['p1_command_grab_right_corner', 'p2_command_grab_left_corner']) {
  const setup = createThrowReviewScenario(id, 5602);
  const inactive = setup.definition.attacker === 'p1' ? setup.input.p2 : setup.input.p1;
  const active = setup.definition.attacker === 'p1' ? setup.input.p1 : setup.input.p2;
  assert.strictEqual(inactive, undefined, `${id}: inactive fighter received input`);
  assert.deepStrictEqual(active, { special: true, throw: true }, `${id}: must use normal Command Grab chord`);
}

const forwardP1 = runScenario('p1_forward_throw_right_corner', 5701);
const forwardP2 = runScenario('p2_forward_throw_left_corner', 5701);
const backP1 = runScenario('p1_back_throw_right_corner', 5702);
const backP2 = runScenario('p2_back_throw_left_corner', 5702);
const commandP1 = runScenario('p1_command_grab_right_corner', 5703);
const commandP2 = runScenario('p2_command_grab_left_corner', 5703);

assertMirrored(forwardP1, forwardP2, 'forward corner');
assertMirrored(backP1, backP2, 'back corner');
assertMirrored(commandP1, commandP2, 'Command Grab corner');

const throws = fighterDefinitions.lamuh_proto.throws;
assert.deepStrictEqual(
  {
    forward: { totalTicks: throws.forward_throw.totalTicks, damage: throws.forward_throw.damage },
    back: { totalTicks: throws.back_throw.totalTicks, damage: throws.back_throw.damage },
    command: { totalTicks: throws.command_grab.totalTicks, damage: throws.command_grab.damage }
  },
  {
    forward: { totalTicks: 32, damage: 70 },
    back: { totalTicks: 36, damage: 75 },
    command: { totalTicks: 107, damage: 220 }
  },
  'approved throw timing or damage changed'
);

const mainSource = fs.readFileSync(path.join(__dirname, '..', 'src', 'debug', 'main.ts'), 'utf8');
assert.match(mainSource, /THROW_REVIEW_SCENARIO_ORDER_V3\.map/, 'full playtest must render the V3 throw scenario order');
assert.match(mainSource, /queuedP1Input\s*=\s*setup\.input\.p1\s*\?\?\s*\{\}/, 'P1 scenario must use the normal one-tick input queue');
assert.match(mainSource, /queuedP2Input\s*=\s*setup\.input\.p2\s*\?\?\s*\{\}/, 'P2 scenario must use the normal one-tick input queue');

const gameBytes = fs.readFileSync(path.join(__dirname, '..', '..', 'game.js'));
assert.strictEqual(crypto.createHash('sha256').update(gameBytes).digest('hex').toUpperCase(), LEGACY_GAME_SHA256);

console.log(JSON.stringify({
  status: 'PASS',
  scenarioCount: THROW_REVIEW_SCENARIO_ORDER_V3.length,
  preservedV1ScenarioCount: THROW_REVIEW_SCENARIO_ORDER.length,
  preservedV2ScenarioCount: THROW_REVIEW_SCENARIO_ORDER_V2.length,
  addedScenarios: V3_IDS,
  mirroredPairs: { forward: [forwardP1, forwardP2], back: [backP1, backP2], commandGrab: [commandP1, commandP2] },
  candidateOnly: true,
  approvedMotionChanged: false,
  combatDefinitionsChanged: false
}, null, 2));
console.log('Swahili throw corner playtest V3 tests passed: complete P1/P2 mirrored corner coverage, deterministic bounds/lifecycle/damage parity, normal input routing, preserved throw definitions, and legacy lock.');
