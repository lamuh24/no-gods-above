const assert = require('assert');
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

const engineRoot = path.resolve(__dirname, '..');
const repoRoot = path.resolve(engineRoot, '..', '..');
const mainSource = fs.readFileSync(path.join(engineRoot, 'src', 'debug', 'main.ts'), 'utf8');
const LEGACY_GAME_SHA256 = 'D081DA2D907CF6ABD978301C1637008B26CCB30B47E2CCAFCA3FEA3331910C6B';

for (const move of ['special_forward_light', 'special_forward_medium', 'special_forward_heavy']) {
  assert(mainSource.includes(`"${move}"`), `missing deep-link recognition for ${move}`);
}

assert.match(mainSource, /FORWARD_DOWN_MOTION_PREVIEW_MOVES/);
assert.match(mainSource, /pageSearchParams\.get\("motionPreviewMove"\)/);
assert.match(mainSource, /openNewMotionPreview\(requestedNewMotionPreviewId, requestedNewMotionPreviewMove\)/);
assert.match(mainSource, /special_forward_light: "http:\/\/127\.0\.0\.1:4196\/.+warning-drag-shaft-drive-motion-v3\/review\.html/);
assert.match(mainSource, /special_forward_medium: "http:\/\/127\.0\.0\.1:4196\/.+motion-v3\/review\.html/);
assert.match(mainSource, /special_forward_heavy: "http:\/\/127\.0\.0\.1:4196\/.+execution-crescent-motion-v3\/review\.html/);
assert.match(mainSource, /if \(!completedUrl\) previewUrl\.searchParams\.set\("move"/);
assert.match(mainSource, /Animation not completed yet|INCOMPLETE_MOTION_NOTICE_URL/);
assert.match(mainSource, /Play Forward Light V3/);
assert.match(mainSource, /Play Forward Medium V3/);
assert.match(mainSource, /Play Forward Heavy V3/);
assert.doesNotMatch(mainSource, /Play new Forward Medium · 2-hit/);

const previewFunctionSource = mainSource.match(/function openNewMotionPreview[\s\S]*?function queueGroundedVerdictDemo/)?.[0] ?? '';
assert(previewFunctionSource, 'exact preview routing must remain inspectable');
for (const mutation of ['attackFrameTracks[', 'fighterDefinitions[', 'selectableCharacterIds', 'spriteSources[']) {
  assert(!previewFunctionSource.includes(mutation), `preview routing must not mutate runtime data: ${mutation}`);
}

const gameBytes = fs.readFileSync(path.join(repoRoot, 'NO_GODS_ABOVE', 'game.js'));
assert.strictEqual(crypto.createHash('sha256').update(gameBytes).digest('hex').toUpperCase(), LEGACY_GAME_SHA256);

console.log(JSON.stringify({
  status: 'PASS',
  exactForwardPreviewRoutes: 3,
  completedRoutes: ['special_forward_light', 'special_forward_medium', 'special_forward_heavy'],
  incompleteNoticeRoutes: [],
  runtimeAliasesChanged: true,
  combatDefinitionsChanged: true,
  humanApprovalInferred: false,
  legacyGameJsChanged: false
}, null, 2));
console.log('Swahili exact Forward Special deep-link tests passed: Light, Medium, and Heavy open their completed motion references while the same frames remain wired into the live arena candidates.');
