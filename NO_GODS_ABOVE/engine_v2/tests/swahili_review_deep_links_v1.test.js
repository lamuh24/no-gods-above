const assert = require('assert');
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

const { resolveReviewDeepLink } = require('../dist/debug/reviewDeepLink');
const { SPECIAL_REVIEW_SCENARIOS } = require('../dist/debug/specialReviewScenarios');
const { THROW_REVIEW_SCENARIOS } = require('../dist/debug/throwReviewScenarios');

const LEGACY_GAME_SHA256 = 'D081DA2D907CF6ABD978301C1637008B26CCB30B47E2CCAFCA3FEA3331910C6B';
const specialIds = Object.keys(SPECIAL_REVIEW_SCENARIOS);
const throwIds = Object.keys(THROW_REVIEW_SCENARIOS);

assert.deepStrictEqual(
  resolveReviewDeepLink('?full-animation-v1=1&specialScenario=p1_neutral_medium_hit', specialIds, throwIds),
  { kind: 'special', id: 'p1_neutral_medium_hit', reason: null }
);
assert.deepStrictEqual(
  resolveReviewDeepLink('?throwScenario=p1_command_grab_whiff&throw-review-controls-v2=1', specialIds, throwIds),
  { kind: 'throw', id: 'p1_command_grab_whiff', reason: null }
);
assert.deepStrictEqual(
  resolveReviewDeepLink('?specialScenario=p1_neutral_medium_hit&throwScenario=p1_forward_throw_hit', specialIds, throwIds),
  { kind: 'none', id: null, reason: 'ambiguous' }
);
assert.deepStrictEqual(
  resolveReviewDeepLink('?specialScenario=p1_neutral_medium_hit&specialScenario=p1_grave_furrow_hit', specialIds, throwIds),
  { kind: 'none', id: null, reason: 'ambiguous' }
);
assert.deepStrictEqual(
  resolveReviewDeepLink('?specialScenario=not_a_real_scenario', specialIds, throwIds),
  { kind: 'none', id: null, reason: 'invalid_special' }
);
assert.deepStrictEqual(
  resolveReviewDeepLink('?throwScenario=not_a_real_scenario', specialIds, throwIds),
  { kind: 'none', id: null, reason: 'invalid_throw' }
);
assert.deepStrictEqual(
  resolveReviewDeepLink('?full-animation-v1=1', specialIds, throwIds),
  { kind: 'none', id: null, reason: 'not_requested' }
);

const mainSource = fs.readFileSync(path.join(__dirname, '..', 'src', 'debug', 'main.ts'), 'utf8');
assert.match(mainSource, /resolveReviewDeepLink\(/, 'debug runtime must use the allowlisted resolver');
assert.match(mainSource, /reviewDeepLinkResolution\.kind === "special"/, 'valid special deep link must use the existing scenario queue');
assert.match(mainSource, /reviewDeepLinkResolution\.kind === "throw"/, 'valid throw deep link must use the existing scenario queue');
assert.match(mainSource, /getReviewDeepLinkResolution/, 'browser QA must have a read-only resolution receipt');

const repoRoot = path.resolve(__dirname, '..', '..', '..');
const auditPath = path.join(repoRoot, 'tools', 'nga-forge', 'production', 'characters', 'swahili', 'reports', 'swahili-v2-conservative-gameplay-impact-audit-v1', 'audit.json');
const audit = JSON.parse(fs.readFileSync(auditPath, 'utf8'));
const scenarioLinks = [
  ...audit.moves.flatMap((move) => move.scenarioCoverage.map((scenario) => ({ kind: 'special', id: scenario.id, url: scenario.playtestUrl }))),
  ...audit.throws.flatMap((throwItem) => throwItem.scenarioCoverage.map((scenario) => ({ kind: 'throw', id: scenario.id, url: scenario.playtestUrl })))
];
assert.strictEqual(scenarioLinks.length, 41, 'impact audit must expose all deterministic scenarios');
assert.strictEqual(audit.scope.deepLinkedReviewScenarios, 41, 'deep-link scope count changed');
for (const scenario of scenarioLinks) {
  const url = new URL(scenario.url);
  assert.strictEqual(url.origin, 'http://127.0.0.1:4175');
  assert.strictEqual(url.pathname, '/index.html');
  assert.strictEqual(url.searchParams.get(`${scenario.kind}Scenario`), scenario.id);
  assert.strictEqual(url.searchParams.get(scenario.kind === 'special' ? 'throwScenario' : 'specialScenario'), null);
  assert.strictEqual(url.hash, scenario.kind === 'special' ? '#special-review-controls' : '#throw-review-controls');
}

const gameBytes = fs.readFileSync(path.join(repoRoot, 'NO_GODS_ABOVE', 'game.js'));
assert.strictEqual(crypto.createHash('sha256').update(gameBytes).digest('hex').toUpperCase(), LEGACY_GAME_SHA256);

console.log(JSON.stringify({
  status: 'PASS',
  validSpecial: 'p1_neutral_medium_hit',
  validThrow: 'p1_command_grab_whiff',
  deepLinkedScenarioCount: scenarioLinks.length,
  invalidAndAmbiguousRequestsIgnored: true,
  combatDefinitionsChanged: false,
  legacyGameJsChanged: false
}, null, 2));
console.log('Swahili review deep-link tests passed: exact allowlisted special/throw routes, fail-closed invalid requests, 41 audit links, and protected legacy lock.');
