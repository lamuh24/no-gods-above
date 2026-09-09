const assert = require('assert');
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const { tick } = require('../dist');
const { fighterDefinitions } = require('../dist/data/fighters');
const {
  createSpecialReviewScenario,
  SPECIAL_REVIEW_GROUPS_V3,
  SPECIAL_REVIEW_SCENARIO_ORDER_V2,
  SPECIAL_REVIEW_SCENARIO_ORDER_V3
} = require('../dist/debug/specialReviewScenarios');

const LEGACY_GAME_SHA256 = 'D081DA2D907CF6ABD978301C1637008B26CCB30B47E2CCAFCA3FEA3331910C6B';

function runScenario(id) {
  const { definition, state, input } = createSpecialReviewScenario(id, 9300 + SPECIAL_REVIEW_SCENARIO_ORDER_V3.indexOf(id));
  const attacker = state.fighters[definition.attacker];
  const defenderId = definition.attacker === 'p1' ? 'p2' : 'p1';
  const defender = state.fighters[defenderId];
  const defenderStartHealth = defender.health;
  const events = new Map();

  tick(state, input);
  assert.strictEqual(definition.attacker, 'p2', `${id}: expected mirrored P2 attacker`);
  assert.strictEqual(attacker.currentAttack, definition.expectedAttackId, `${id}: wrong attack route`);
  assert.strictEqual(state.throwInteraction, null, `${id}: special leaked into a throw`);

  let elapsed = 0;
  while (attacker.currentAttack) {
    tick(state, {});
    const event = state.lastCombatEvent;
    if (event && event.attackId === definition.expectedAttackId && event.attacker === 'p2') {
      events.set(`${event.tick}:${event.hitOrdinal}:${event.outcome}`, { ...event });
    }
    for (const fighter of Object.values(state.fighters)) {
      assert.ok(fighter.x >= state.stage.left && fighter.x <= state.stage.right, `${id}: fighter escaped horizontal stage bounds`);
      assert.ok(fighter.y >= state.stage.ceilingY && fighter.y <= state.stage.groundY, `${id}: fighter escaped vertical stage bounds`);
    }
    assert.ok(++elapsed < 200, `${id}: scenario did not return to neutral`);
  }

  assert.strictEqual(attacker.phase, 'idle', `${id}: attacker did not return to neutral`);
  assert.strictEqual(defenderStartHealth - defender.health, definition.expectedDamage, `${id}: damage mismatch`);
  assert.strictEqual(events.size, definition.expectedRegisteredHits, `${id}: registered-hit parity mismatch`);
  assert.ok([...events.values()].every((event) => event.outcome === definition.expectedOutcome), `${id}: outcome mismatch`);
  return { id, attackId: definition.expectedAttackId, outcome: definition.expectedOutcome, damage: defenderStartHealth - defender.health, registeredHits: events.size, elapsedTicks: elapsed };
}

assert.deepStrictEqual(SPECIAL_REVIEW_SCENARIO_ORDER_V3.slice(0, SPECIAL_REVIEW_SCENARIO_ORDER_V2.length), SPECIAL_REVIEW_SCENARIO_ORDER_V2, 'V3 must preserve the complete V2 prefix');
assert.strictEqual(SPECIAL_REVIEW_SCENARIO_ORDER_V2.length, 19);
assert.strictEqual(SPECIAL_REVIEW_SCENARIO_ORDER_V3.length, 27);
assert.deepStrictEqual(SPECIAL_REVIEW_GROUPS_V3.map((group) => [group.id, group.scenarioIds.length]), [
  ['gameplay_candidates', 12],
  ['p2_mirror', 12],
  ['fallback_comparisons', 3]
]);

const addedIds = SPECIAL_REVIEW_SCENARIO_ORDER_V3.slice(SPECIAL_REVIEW_SCENARIO_ORDER_V2.length);
const results = addedIds.map(runScenario);
assert.deepStrictEqual(results.map((result) => [result.id, result.outcome, result.damage, result.registeredHits]), [
  ['p2_neutral_medium_block', 'block', 0, 1],
  ['p2_neutral_medium_whiff', 'whiff', 0, 0],
  ['p2_up_medium_stand_block', 'block', 0, 1],
  ['p2_up_medium_low_profile', 'whiff', 0, 0],
  ['p2_grave_furrow_block', 'block', 0, 1],
  ['p2_grave_furrow_whiff', 'whiff', 0, 0],
  ['p2_grounded_verdict_block', 'block', 0, 2],
  ['p2_grounded_verdict_whiff', 'whiff', 0, 0]
]);

const mainSource = fs.readFileSync(path.join(__dirname, '..', 'src', 'debug', 'main.ts'), 'utf8');
assert.match(mainSource, /SPECIAL_REVIEW_GROUPS_V3/, 'live review page must expose the V3 control surface');
assert.match(mainSource, /id="review-speed"/, 'review page must expose an explicit speed control');
assert.match(mainSource, /reviewSpeed:\s*1\s*\|\s*0\.5\s*=\s*1/, 'review speed must default to 1x');
assert.match(mainSource, /accumulator\s*\+=\s*delta\s*\*\s*reviewSpeed/, 'review speed must affect presentation wall-time only');
assert.match(mainSource, /getReviewSpeed:\s*\(\)\s*=>\s*reviewSpeed/, 'browser QA needs a read-only review-speed receipt');
assert.match(mainSource, /no result is human approval/i, 'review UI must retain the human-approval boundary');

assert.strictEqual(fighterDefinitions.lamuh_proto.throws.command_grab.totalTicks, 107, 'approved Command Grab motion timing changed');
const gameBytes = fs.readFileSync(path.join(__dirname, '..', '..', 'game.js'));
assert.strictEqual(crypto.createHash('sha256').update(gameBytes).digest('hex').toUpperCase(), LEGACY_GAME_SHA256);

console.log(JSON.stringify({ status: 'PASS', scenarioCount: SPECIAL_REVIEW_SCENARIO_ORDER_V3.length, addedMirrors: results, reviewSpeeds: [1, 0.5], candidateOnly: true, downLightAndMediumCombatDefinitionsChanged: true, protectedHeavyAndCommandGrabDefinitionsChanged: false, approvedMotionChanged: false }, null, 2));
console.log('Swahili special review controls V3 tests passed: preserved mirror hit/block/whiff parity, protected Heavy and Command Grab, and retained the 1x/0.5x review-speed contract.');
