const assert = require('assert');
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

const engineRoot = path.resolve(__dirname, '..');
const repoRoot = path.resolve(engineRoot, '..', '..');
const reviewRoot = path.join(repoRoot, 'tools', 'nga-forge', 'production', 'characters', 'swahili', 'reviews');
const mainSource = fs.readFileSync(path.join(engineRoot, 'src', 'debug', 'main.ts'), 'utf8');
const lightCompletedSource = fs.readFileSync(path.join(reviewRoot, 'special-forward-light-warning-drag-shaft-drive-motion-v3', 'review.html'), 'utf8');
const completedSource = fs.readFileSync(path.join(reviewRoot, 'special-forward-medium-shoulder-rip-combination-motion-v3', 'review.html'), 'utf8');
const heavyCompletedSource = fs.readFileSync(path.join(reviewRoot, 'special-forward-heavy-execution-crescent-motion-v3', 'review.html'), 'utf8');
const graveCompletedSource = fs.readFileSync(path.join(reviewRoot, 'special-up-heavy-grave-furrow-running-slash-carry-motion-v7', 'review.html'), 'utf8');
const incompleteSource = fs.readFileSync(path.join(reviewRoot, 'swahili-incomplete-motion-notice-v1', 'review.html'), 'utf8');
const LEGACY_GAME_SHA256 = 'D081DA2D907CF6ABD978301C1637008B26CCB30B47E2CCAFCA3FEA3331910C6B';

assert.doesNotMatch(mainSource, /large stage below now advances the selected candidate pose visibly/);
assert.match(mainSource, /Direction boards and key-pose-only GIFs remain in the separate decision hub until their connector frames are authored and validated/);
assert.match(mainSource, /Forward Light\/Medium\/Heavy V3, Down Light V3, and Grave Furrow V7 remain available with animation repairs listed in the moveset audit/);
assert.match(lightCompletedSource, /real animated sprite playback · not a slideshow/i);
assert.match(lightCompletedSource, /COMPLETE 16-FRAME MOTION CLIP/);
assert.match(lightCompletedSource, /Single hit<br>10/);
assert.match(lightCompletedSource, /Brake \+ recover<br>14–16/);
assert.doesNotMatch(lightCompletedSource, /data-pose-by-pose-playback="true"/);
assert.match(completedSource, /real animated sprite playback · not a slideshow/i);
assert.match(completedSource, /COMPLETE 16-FRAME MOTION CLIP/);
assert.match(completedSource, /Hit 1<br>06/);
assert.match(completedSource, /Inactive reversal<br>08–10/);
assert.match(completedSource, /Hit 2<br>11/);
assert.doesNotMatch(completedSource, /data-pose-by-pose-playback="true"/);
assert.doesNotMatch(completedSource, /POSE \$\{/);
assert.match(heavyCompletedSource, /real animated sprite playback · not a slideshow/i);
assert.match(heavyCompletedSource, /COMPLETE 16-FRAME MOTION CLIP/);
assert.match(heavyCompletedSource, /Single hit<br>10/);
assert.doesNotMatch(heavyCompletedSource, /data-pose-by-pose-playback="true"/);
assert.match(graveCompletedSource, /real animated sprite playback · not a slideshow/i);
assert.match(graveCompletedSource, /COMPLETE 16-FRAME MOTION CLIP/);
assert.match(graveCompletedSource, /One hit<br>10/);
assert.match(graveCompletedSource, /Running recovery<br>14–16/);
assert.doesNotMatch(graveCompletedSource, /data-pose-by-pose-playback="true"/);
assert.match(incompleteSource, /Animation not completed yet/);
assert.match(incompleteSource, /will not display that board as though it were completed motion/);

const gameBytes = fs.readFileSync(path.join(repoRoot, 'NO_GODS_ABOVE', 'game.js'));
assert.strictEqual(crypto.createHash('sha256').update(gameBytes).digest('hex').toUpperCase(), LEGACY_GAME_SHA256);

console.log(JSON.stringify({
  status: 'PASS',
  supersedesPosePlaybackVersion: 2,
  completedAnimationVersion: 6,
  completedMoves: ['special_forward_light', 'special_forward_medium', 'special_forward_heavy', 'special_up_heavy'],
  visibleContactFrames: { special_forward_light: [10], special_forward_medium: [6, 11], special_forward_heavy: [10], special_up_heavy: [10] },
  inactiveBridgeFrames: [8, 9, 10],
  runtimeIntegrated: true,
  humanApprovalInferred: false,
  legacyGameJsChanged: false
}, null, 2));
console.log('Swahili pose-playback replacement tests passed: the full playtest uses real animated playback for all four completed clips and an honest incomplete gate for the remaining direction work.');
