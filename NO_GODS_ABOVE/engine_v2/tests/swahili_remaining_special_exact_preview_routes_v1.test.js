const assert = require('assert');
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

const engineRoot = path.resolve(__dirname, '..');
const repoRoot = path.resolve(engineRoot, '..', '..');
const mainSource = fs.readFileSync(path.join(engineRoot, 'src', 'debug', 'main.ts'), 'utf8');
const samplerPath = path.join(repoRoot, 'tools', 'nga-forge', 'production', 'characters', 'swahili', 'reviews', 'swahili-remaining-special-review-sampler-v1', 'review.html');
const samplerSource = fs.readFileSync(samplerPath, 'utf8');
const LEGACY_GAME_SHA256 = 'D081DA2D907CF6ABD978301C1637008B26CCB30B47E2CCAFCA3FEA3331910C6B';

const remainingMoves = [
  'special_neutral_light',
  'special_neutral_heavy',
  'special_backward_light',
  'special_backward_medium',
  'special_backward_heavy',
  'special_up_light'
];

for (const move of remainingMoves) {
  assert.match(mainSource, new RegExp(`data-motion-preview-move="${move}"`));
  assert.match(mainSource, new RegExp(`newMotionPreviewHref\\("neutralBackUp", "${move}"\\)`));
}

assert.match(mainSource, /REMAINING_MOTION_PREVIEW_MOVES/);
assert.match(mainSource, /isRemainingMotionPreviewMove/);
assert.match(mainSource, /isMotionPreviewMoveForGroup/);
assert.match(mainSource, /Play new Neutral Heavy · 2-hit/);
assert.match(mainSource, /requestedNewMotionPreviewMove/);
assert.match(mainSource, /previewUrl\.searchParams\.set\("move", previewMove\)/);
assert.match(samplerSource, /const samplerSearchParams=new URLSearchParams\(location\.search\)/);
assert.match(samplerSource, /samplerSearchParams\.get\('move'\)/);
assert.match(samplerSource, /if\(!moves\[id\]\)return/);
assert.match(samplerSource, /document\.body\.classList\.add\('embedded-playtest'\)/);
assert.match(samplerSource, /\.embedded-playtest \.gif-stage img\{width:auto;max-width:100%;max-height:360px\}/);

const previewFunctionSource = mainSource.match(/function openNewMotionPreview[\s\S]*?function queueGroundedVerdictDemo/)?.[0] ?? '';
assert(previewFunctionSource, 'remaining-special exact preview routing must remain inspectable');
for (const mutation of ['attackFrameTracks[', 'fighterDefinitions[', 'selectableCharacterIds', 'spriteSources[']) {
  assert(!previewFunctionSource.includes(mutation), `review visibility must not mutate runtime data: ${mutation}`);
}

const gameBytes = fs.readFileSync(path.join(repoRoot, 'NO_GODS_ABOVE', 'game.js'));
assert.strictEqual(crypto.createHash('sha256').update(gameBytes).digest('hex').toUpperCase(), LEGACY_GAME_SHA256);

console.log(JSON.stringify({
  status: 'PASS',
  exactRemainingPreviewRoutes: remainingMoves.length,
  highlightedCandidate: 'special_neutral_heavy',
  proposedVisibleHits: 2,
  runtimeAliasesChanged: false,
  combatDefinitionsChanged: false,
  humanApprovalInferred: false,
  legacyGameJsChanged: false
}, null, 2));
console.log('Swahili exact remaining-special preview-route tests passed: all six Neutral/Back/Up candidates open directly while source, runtime, combat, and approval boundaries remain unchanged.');
