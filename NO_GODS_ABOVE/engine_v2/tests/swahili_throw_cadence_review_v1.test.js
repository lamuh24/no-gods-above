const assert = require('assert');
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

const { tick } = require('../dist');
const { fighterDefinitions } = require('../dist/data/fighters');
const {
  createThrowCadenceReviewScenario,
  observeThrowCadenceReview,
  THROW_CADENCE_SCENARIO_ORDER,
  THROW_CADENCE_SCENARIOS
} = require('../dist/debug/throwCadenceScenarios');

const LEGACY_GAME_SHA256 = 'D081DA2D907CF6ABD978301C1637008B26CCB30B47E2CCAFCA3FEA3331910C6B';

function runCadence(id, seed) {
  const setup = createThrowCadenceReviewScenario(id, seed);
  const startingPositions = { p1: setup.state.fighters.p1.x, p2: setup.state.fighters.p2.x };
  let input = setup.input;
  let guard = 0;
  while (setup.tracker.stage !== 'complete' && setup.tracker.stage !== 'failed') {
    tick(setup.state, input);
    input = observeThrowCadenceReview(setup, setup.state) || {};
    for (const participant of Object.values(setup.state.fighters)) {
      assert.ok(participant.x >= setup.state.stage.left && participant.x <= setup.state.stage.right, `${id}: horizontal stage escape`);
      assert.ok(participant.y >= setup.state.stage.ceilingY && participant.y <= setup.state.stage.groundY, `${id}: vertical stage escape`);
    }
    assert.ok(++guard < 260, `${id}: cadence did not complete`);
  }
  assert.strictEqual(setup.tracker.stage, 'complete', `${id}: ${setup.tracker.failure || 'incomplete'}`);
  const attacker = setup.definition.attacker;
  const defender = attacker === 'p1' ? 'p2' : 'p1';
  assert.strictEqual(
    setup.state.fighters[defender].x,
    startingPositions[defender],
    `${id}: a whiff moved the defender`
  );
  return {
    id,
    attacker,
    throwId: setup.definition.expectedThrowId,
    attackerTravel: setup.state.fighters[attacker].x - startingPositions[attacker],
    defenderTravel: setup.state.fighters[defender].x - startingPositions[defender],
    ...setup.tracker
  };
}

assert.strictEqual(THROW_CADENCE_SCENARIO_ORDER.length, 6);
assert.strictEqual(new Set(THROW_CADENCE_SCENARIO_ORDER).size, 6);
assert.deepStrictEqual(
  THROW_CADENCE_SCENARIO_ORDER.map((id) => THROW_CADENCE_SCENARIOS[id].attacker),
  ['p1', 'p1', 'p1', 'p2', 'p2', 'p2']
);

const results = THROW_CADENCE_SCENARIO_ORDER.map((id, index) => runCadence(id, 24000 + index));
const expectedCommitments = {
  forward_throw: fighterDefinitions.lamuh_proto.throws.forward_throw.totalTicks,
  back_throw: fighterDefinitions.lamuh_proto.throws.back_throw.totalTicks,
  command_grab: 107
};

for (const result of results) {
  assert.strictEqual(result.startCount, 2, `${result.id}: expected exactly two starts`);
  assert.strictEqual(result.startToStartTicks, expectedCommitments[result.throwId], `${result.id}: cadence drifted from authored whiff duration`);
  assert.strictEqual(result.neutralVisualGapTicks, 1, `${result.id}: expected one visible neutral tick before fresh reuse`);
  assert.strictEqual(result.firstNeutralTick, result.repeatQueuedTick, `${result.id}: repeat was not queued on first neutral tick`);
  assert.ok(result.secondNeutralTick > result.secondStartTick, `${result.id}: second use did not complete`);
  assert.strictEqual(result.defenderTravel, 0, `${result.id}: far whiff displaced the defender`);
}

for (const throwId of Object.keys(expectedCommitments)) {
  const pair = results.filter((result) => result.throwId === throwId);
  assert.strictEqual(pair.length, 2, `${throwId}: missing P1/P2 pair`);
  assert.deepStrictEqual(pair.map((item) => item.attacker).sort(), ['p1', 'p2']);
  assert.strictEqual(pair[0].startToStartTicks, pair[1].startToStartTicks, `${throwId}: mirror cadence mismatch`);
}

const mainSource = fs.readFileSync(path.join(__dirname, '..', 'src', 'debug', 'main.ts'), 'utf8');
assert.match(mainSource, /Throw recovery \+ repeat cadence/);
assert.match(mainSource, /data-throw-cadence-scenario/);
assert.match(mainSource, /throwCadenceScenario/);
assert.match(mainSource, /getThrowCadenceReview/);
assert.match(mainSource, /without changing timing, range, damage, or choreography/i);

assert.strictEqual(fighterDefinitions.lamuh_proto.throws.command_grab.totalTicks, 107, 'approved Command Grab timing changed');
assert.strictEqual(fighterDefinitions.lamuh_proto.throws.command_grab.damage, 220, 'approved Command Grab damage changed');
const gameBytes = fs.readFileSync(path.join(__dirname, '..', '..', 'game.js'));
assert.strictEqual(crypto.createHash('sha256').update(gameBytes).digest('hex').toUpperCase(), LEGACY_GAME_SHA256);

console.log(JSON.stringify({ status: 'PASS', scenarioCount: results.length, commitments: expectedCommitments, results, combatDefinitionsChanged: false, approvedCommandGrabChanged: false, candidateOnly: true }, null, 2));
console.log('Swahili throw cadence review V1 tests passed: two fresh far-whiffs, exact authored commitment, one neutral tick, P1/P2 parity, and frozen Command Grab preservation.');
