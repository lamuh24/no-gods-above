const assert = require('assert');
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

const { tick } = require('../dist');
const { fighterDefinitions } = require('../dist/data/fighters');
const {
  createSpecialCadenceReviewScenario,
  observeSpecialCadenceReview,
  SPECIAL_CADENCE_SCENARIO_ORDER,
  SPECIAL_CADENCE_SCENARIOS
} = require('../dist/debug/specialCadenceScenarios');

const LEGACY_GAME_SHA256 = 'D081DA2D907CF6ABD978301C1637008B26CCB30B47E2CCAFCA3FEA3331910C6B';

function runCadence(id, seed) {
  const setup = createSpecialCadenceReviewScenario(id, seed);
  let input = setup.input;
  let guard = 0;
  while (setup.tracker.stage !== 'complete' && setup.tracker.stage !== 'failed') {
    tick(setup.state, input);
    input = observeSpecialCadenceReview(setup, setup.state) || {};
    for (const participant of Object.values(setup.state.fighters)) {
      assert.ok(participant.x >= setup.state.stage.left && participant.x <= setup.state.stage.right, `${id}: horizontal stage escape`);
      assert.ok(participant.y >= setup.state.stage.ceilingY && participant.y <= setup.state.stage.groundY, `${id}: vertical stage escape`);
    }
    assert.ok(++guard < 240, `${id}: cadence did not complete`);
  }
  assert.strictEqual(setup.tracker.stage, 'complete', `${id}: ${setup.tracker.failure || 'incomplete'}`);
  return { id, attacker: setup.definition.attacker, attackId: setup.definition.expectedAttackId, ...setup.tracker };
}

assert.strictEqual(SPECIAL_CADENCE_SCENARIO_ORDER.length, 8);
assert.strictEqual(new Set(SPECIAL_CADENCE_SCENARIO_ORDER).size, 8);
assert.deepStrictEqual(
  SPECIAL_CADENCE_SCENARIO_ORDER.map((id) => SPECIAL_CADENCE_SCENARIOS[id].attacker),
  ['p1', 'p1', 'p1', 'p1', 'p2', 'p2', 'p2', 'p2']
);

const results = SPECIAL_CADENCE_SCENARIO_ORDER.map((id, index) => runCadence(id, 22000 + index));
const expectedCommitments = {
  special_neutral_medium: 25,
  special_up_medium: 35,
  special_up_heavy: 64,
  special_down_heavy: 80
};

for (const result of results) {
  assert.strictEqual(result.startCount, 2, `${result.id}: expected exactly two starts`);
  assert.strictEqual(result.startToStartTicks, expectedCommitments[result.attackId], `${result.id}: repeat cadence drifted from authored whiff commitment`);
  assert.strictEqual(result.neutralVisualGapTicks, 1, `${result.id}: expected one visible neutral tick before fresh reuse`);
  assert.strictEqual(result.firstNeutralTick, result.repeatQueuedTick, `${result.id}: repeat was not queued on first neutral tick`);
  assert.ok(result.secondNeutralTick > result.secondStartTick, `${result.id}: second use did not complete`);
}

for (const attackId of Object.keys(expectedCommitments)) {
  const pair = results.filter((result) => result.attackId === attackId);
  assert.strictEqual(pair.length, 2, `${attackId}: missing P1/P2 pair`);
  assert.deepStrictEqual(pair.map((item) => item.attacker).sort(), ['p1', 'p2']);
  assert.strictEqual(pair[0].startToStartTicks, pair[1].startToStartTicks, `${attackId}: mirror cadence mismatch`);
}

const mainSource = fs.readFileSync(path.join(__dirname, '..', 'src', 'debug', 'main.ts'), 'utf8');
assert.match(mainSource, /Recovery \+ repeat cadence/);
assert.match(mainSource, /data-special-cadence-scenario/);
assert.match(mainSource, /cadenceScenario/);
assert.match(mainSource, /getSpecialCadenceReview/);
assert.match(mainSource, /without changing timing, damage, hitboxes, or input rules/i);

assert.strictEqual(fighterDefinitions.lamuh_proto.throws.command_grab.totalTicks, 107, 'approved Command Grab timing changed');
const gameBytes = fs.readFileSync(path.join(__dirname, '..', '..', 'game.js'));
assert.strictEqual(crypto.createHash('sha256').update(gameBytes).digest('hex').toUpperCase(), LEGACY_GAME_SHA256);

console.log(JSON.stringify({ status: 'PASS', scenarioCount: results.length, results, combatDefinitionsChanged: false, approvedMotionChanged: false, candidateOnly: true }, null, 2));
console.log('Swahili special cadence review V1 tests passed: two fresh whiff uses, exact authored commitment, one neutral tick, and P1/P2 parity.');
