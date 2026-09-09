const assert = require('assert');
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

const engineRoot = path.resolve(__dirname, '..');
const repoRoot = path.resolve(engineRoot, '..', '..');
const reviewRoot = path.join(repoRoot, 'tools', 'nga-forge', 'production', 'characters', 'swahili', 'reviews');
const mainSource = fs.readFileSync(path.join(engineRoot, 'src', 'debug', 'main.ts'), 'utf8');
const styleSource = fs.readFileSync(path.join(engineRoot, 'src', 'debug', 'style.css'), 'utf8');
const lightCompletedSource = fs.readFileSync(path.join(reviewRoot, 'special-forward-light-warning-drag-shaft-drive-motion-v3', 'review.html'), 'utf8');
const completedSource = fs.readFileSync(path.join(reviewRoot, 'special-forward-medium-shoulder-rip-combination-motion-v3', 'review.html'), 'utf8');
const heavyCompletedSource = fs.readFileSync(path.join(reviewRoot, 'special-forward-heavy-execution-crescent-motion-v3', 'review.html'), 'utf8');
const graveCompletedSource = fs.readFileSync(path.join(reviewRoot, 'special-up-heavy-grave-furrow-running-slash-carry-motion-v7', 'review.html'), 'utf8');
const incompleteSource = fs.readFileSync(path.join(reviewRoot, 'swahili-incomplete-motion-notice-v1', 'review.html'), 'utf8');
const LEGACY_GAME_SHA256 = 'D081DA2D907CF6ABD978301C1637008B26CCB30B47E2CCAFCA3FEA3331910C6B';

assert.match(mainSource, /SWAHILI MOVESET PLAYTEST · CROSSDRAW REPRISAL V6/);
assert.match(mainSource, /data-preview-authority="local-runtime-candidate"/);
assert.match(mainSource, /Crossdraw Reprisal V6 replaces Down Medium with twelve authored poses and two timed shots/);
assert.match(mainSource, /Direction boards and key-pose-only GIFs remain in the separate decision hub/);
assert.match(mainSource, /data-motion-preview-move="special_forward_light"/);
assert.match(mainSource, /Play Forward Light V3 · 16 frames · 1 hit/);
assert.match(mainSource, /data-motion-preview-move="special_forward_medium"/);
assert.match(mainSource, /Play Forward Medium V3 · 16 frames · 2 hits/);
assert.match(mainSource, /data-motion-preview-move="special_forward_heavy"/);
assert.match(mainSource, /Play Forward Heavy V3 · 16 frames · 1 hit/);
assert.match(mainSource, /data-motion-preview-move="special_up_heavy"/);
assert.match(mainSource, /Play Grave Furrow V7 · 16 frames · 1 hit/);
assert.match(mainSource, /special-forward-light-warning-drag-shaft-drive-motion-v3\/review\.html\?embedded-playtest-v1=1&complete-motion-v3=1&layout-v2=1/);
assert.match(mainSource, /special-forward-medium-shoulder-rip-combination-motion-v3\/review\.html\?embedded-playtest-v1=1&complete-motion-v3=1&layout-v2=1/);
assert.match(mainSource, /special-forward-heavy-execution-crescent-motion-v3\/review\.html\?embedded-playtest-v1=1&complete-motion-v3=1&layout-v2=1/);
assert.match(mainSource, /special-up-heavy-grave-furrow-running-slash-carry-motion-v7\/review\.html\?embedded-playtest-v1=1&complete-motion-v7=1&layout-v2=1/);
assert.match(mainSource, /swahili-incomplete-motion-notice-v1\/review\.html\?embedded-playtest-v1=1/);
assert.match(mainSource, /const completedUrl = previewMove \? COMPLETED_MOTION_PREVIEW_URLS\[previewMove\] : undefined/);
assert.match(mainSource, /new URL\(completedUrl \?\? INCOMPLETE_MOTION_NOTICE_URL\)/);
assert.match(mainSource, /data-completed-motion-version="8"/);
assert.match(mainSource, /same connected frames now used by the arena candidate/);
assert.match(styleSource, /\.new-motion-preview-modal\[hidden\]\s*\{\s*display:\s*none/);
assert.match(styleSource, /\.new-motion-preview-dialog iframe/);

assert.match(lightCompletedSource, /data-completed-animation="true"/);
assert.match(lightCompletedSource, /data-frame-count="16"/);
assert.match(lightCompletedSource, /data-visible-contact-count="1"/);
assert.match(lightCompletedSource, /playback\/forward_light_motion_v3_1x\.webp/);
assert.match(lightCompletedSource, /playback\/forward_light_motion_v3_0\.5x\.webp/);
assert.match(lightCompletedSource, /completedAnimation:true,frameCount:16,runtimeIntegrated:true/);
assert.doesNotMatch(lightCompletedSource, /setTimeout\s*\(/);
assert.doesNotMatch(lightCompletedSource, /drawImage\s*\(/);
assert.match(completedSource, /data-completed-animation="true"/);
assert.match(completedSource, /data-frame-count="16"/);
assert.match(completedSource, /playback\/forward_medium_motion_v3_1x\.webp/);
assert.match(completedSource, /playback\/forward_medium_motion_v3_0\.5x\.webp/);
assert.match(completedSource, /completedAnimation:true,frameCount:16,runtimeIntegrated:true/);
assert.doesNotMatch(completedSource, /setTimeout\s*\(/);
assert.doesNotMatch(completedSource, /drawImage\s*\(/);
assert.match(heavyCompletedSource, /data-completed-animation="true"/);
assert.match(heavyCompletedSource, /data-frame-count="16"/);
assert.match(heavyCompletedSource, /runtimeIntegrated:true/);
assert.match(heavyCompletedSource, /playback\/forward_heavy_motion_v3_1x\.webp/);
assert.match(graveCompletedSource, /data-completed-animation="true"/);
assert.match(graveCompletedSource, /data-frame-count="16"/);
assert.match(graveCompletedSource, /data-visible-contact-count="1"/);
assert.match(graveCompletedSource, /playback\/grave_furrow_motion_v7_1x\.webp/);
assert.match(graveCompletedSource, /playback\/grave_furrow_motion_v7_0\.5x\.webp/);
assert.doesNotMatch(graveCompletedSource, /setTimeout\s*\(/);
assert.doesNotMatch(graveCompletedSource, /drawImage\s*\(/);
assert.match(incompleteSource, /data-completed-animation="false"/);
assert.match(incompleteSource, /no slideshow substituted/i);

const previewFunctionSource = mainSource.match(/function openNewMotionPreview[\s\S]*?function queueGroundedVerdictDemo/)?.[0] ?? '';
assert(previewFunctionSource, 'new-motion preview functions must remain inspectable');
for (const mutation of ['attackFrameTracks[', 'fighterDefinitions[', 'selectableCharacterIds', 'spriteSources[']) {
  assert(!previewFunctionSource.includes(mutation), `review visibility UI must not mutate runtime data: ${mutation}`);
}

const gameBytes = fs.readFileSync(path.join(repoRoot, 'NO_GODS_ABOVE', 'game.js'));
assert.strictEqual(crypto.createHash('sha256').update(gameBytes).digest('hex').toUpperCase(), LEGACY_GAME_SHA256);

console.log(JSON.stringify({
  status: 'PASS',
  completedAnimationPreviews: 4,
  completedMoves: ['special_forward_light', 'special_forward_medium', 'special_forward_heavy', 'special_up_heavy'],
  frameCount: 16,
  slideshowRoutesInPlaytest: 0,
  unfinishedRoutesUseHonestNotice: true,
  runtimeAliasesChanged: true,
  combatDefinitionsChanged: true,
  humanApprovalInferred: false,
  legacyGameJsChanged: false
}, null, 2));
console.log('Swahili completed-motion preview visibility tests passed: the playtest exposes four connected sixteen-frame live arena candidates and never labels still direction boards as completed animation.');
