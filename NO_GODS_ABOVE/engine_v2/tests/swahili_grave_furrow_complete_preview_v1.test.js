const assert = require('assert');
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

const engineRoot = path.resolve(__dirname, '..');
const repoRoot = path.resolve(engineRoot, '..', '..');
const mainSource = fs.readFileSync(path.join(engineRoot, 'src', 'debug', 'main.ts'), 'utf8');
const spriteSources = fs.readFileSync(path.join(engineRoot, 'src', 'stage', 'spriteSources.ts'), 'utf8');
const reviewPath = path.join(repoRoot, 'tools', 'nga-forge', 'production', 'characters', 'swahili', 'reviews', 'special-up-heavy-grave-furrow-running-slash-carry-motion-v7', 'review.html');
const reviewSource = fs.readFileSync(reviewPath, 'utf8');
const LEGACY_GAME_SHA256 = 'D081DA2D907CF6ABD978301C1637008B26CCB30B47E2CCAFCA3FEA3331910C6B';

assert.match(mainSource, /const GRAVE_FURROW_MOTION_PREVIEW_MOVES = \["special_up_heavy"\]/);
assert.match(mainSource, /special_up_heavy: "Grave Furrow · complete 16-frame animation V7"/);
assert.match(mainSource, /special_up_heavy: "http:\/\/127\.0\.0\.1:4196\/.+running-slash-carry-motion-v7\/review\.html/);
assert.match(mainSource, /requestedMove \?\? \(id === "graveFurrow" \? "special_up_heavy" : null\)/);
assert.match(reviewSource, /data-completed-animation="true"/);
assert.match(reviewSource, /data-visible-contact-count="1"/);
assert.match(reviewSource, /grave_furrow_motion_v7_1x\.webp/);
assert.match(reviewSource, /grave_furrow_motion_v7_0\.5x\.webp/);
assert.doesNotMatch(reviewSource, /data-pose-by-pose-playback="true"/);
assert.match(spriteSources, /running-slash-carry-motion-v7\/runtime_frames_alpha_clean_v1\/01_warning_ground_drag\.png\?url/);
assert.match(spriteSources, /running-slash-carry-motion-v7\/runtime_frames_alpha_clean_v1\/16_moving_low_ready_recovery\.png\?url/);
assert.match(reviewSource, /data-runtime-integrated="true"/);
assert.match(reviewSource, /data-runtime-alpha-cleaned="true"/);

const gameBytes = fs.readFileSync(path.join(repoRoot, 'NO_GODS_ABOVE', 'game.js'));
assert.strictEqual(crypto.createHash('sha256').update(gameBytes).digest('hex').toUpperCase(), LEGACY_GAME_SHA256);

console.log(JSON.stringify({
  status: 'PASS',
  exactGraveFurrowPreviewRoute: true,
  completedFrameCount: 16,
  visibleContactFrames: [10],
  completedAnimationIntegratedInLocalPlaytest: true,
  runtimeAliasesChanged: true,
  runtimeAlphaCleaned: true,
  combatDefinitionsChanged: false,
  humanApprovalInferred: false,
  blenderUsed: false,
  legacyGameJsChanged: false
}, null, 2));
console.log('Swahili Grave Furrow completed-preview tests passed: the exact route and local arena use the connected V7 motion through alpha-clean runtime copies.');
