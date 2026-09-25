const assert = require('assert');
const fs = require('fs');
const path = require('path');

const engineRoot = path.resolve(__dirname, '..');
const repoRoot = path.resolve(engineRoot, '..', '..');
const runtimeRoot = path.join(repoRoot, 'tools', 'nga-forge', 'production', 'characters', 'swahili', 'reviews', 'air-specials-v1', 'runtime-air-medium-special-chakram-held-mask-ball-v6');
const reportPath = path.join(runtimeRoot, 'swahili_air_medium_special_chakram_held_mask_ball_v6.validation.json');
const report = JSON.parse(fs.readFileSync(reportPath, 'utf8'));

assert.strictEqual(report.classification, 'PASS_TECHNICAL');
assert.strictEqual(report.status, 'candidate_runtime_ready_motion_review_pending');
assert.strictEqual(report.moveId, 'special_air_medium');
assert.strictEqual(report.design, 'scythe_grab_then_masked_held_scythe_tuck_ball_chakram_spin');
assert.strictEqual(report.sourceKeyPoseCount, 4);
assert.strictEqual(report.connectorFramesAuthored, 9);
assert.deepStrictEqual(report.hitParity, {
  visibleContacts: 2,
  registeredHitCount: 2,
  contactFrames: [5, 9],
  contactSurfaces: ['chakram_outer_blade_pass_1', 'chakram_outer_blade_pass_2']
});
assert.deepStrictEqual(report.atlas, {
  path: 'tools/nga-forge/production/characters/swahili/reviews/air-specials-v1/runtime-air-medium-special-chakram-held-mask-ball-v6/swahili_air_medium_special_chakram_held_mask_ball_v6_13x1_448.png',
  width: 5824,
  height: 448,
  columns: 13,
  rows: 1,
  cellWidth: 448,
  cellHeight: 448,
  mode: 'RGBA'
});
assert.strictEqual(report.frameSafety.allFramesInsideSafeMargin, true);
assert.strictEqual(report.frameSafety.allAirBodyBottomDeltasWithinTolerance, true);
assert.strictEqual(report.frames.length, 13);
assert.deepStrictEqual(report.frames.slice(0, 4).map((frame) => frame.phase), [
  'scythe_grab_reach',
  'scythe_grab_clamp',
  'scythe_grab_lock',
  'tuck_into_held_ball'
]);
for (const frame of report.frames) {
  assert.strictEqual(frame.safeFrame, true, `unsafe frame ${frame.frame}`);
  assert.ok(Math.abs(frame.spinBodyBottomDelta) <= 1, `spin height drift in frame ${frame.frame}`);
  assert.ok(fs.existsSync(path.join(repoRoot, frame.path)), `missing frame ${frame.path}`);
}

const presentation = fs.readFileSync(path.join(engineRoot, 'src', 'versus', 'presentation.ts'), 'utf8');
assert.match(presentation, /special_air_medium: clip\(\[\s*airMediumSpecialChakramRuntime01/);
assert.match(presentation, /airMediumSpecialChakramRuntime13/);
assert.ok(!presentation.includes('special_air_medium: clip(stagePoses(\n    "special_up_medium_grounded_ready'), 'special air medium must not reuse grounded Up Medium');
assert.match(presentation, /air_medium: clip\(poses\(\s*"air_medium_scythe_shaft_v1_01_cross_body_load/);

console.log(JSON.stringify({
  status: 'PASS',
  moveId: report.moveId,
  atlas: report.atlas,
  contactFrames: report.hitParity.contactFrames,
  regularAirMediumUntouched: true,
  design: 'scythe_grab_then_masked_held_scythe_tuck_ball_chakram_spin',
  candidateOnly: true,
  motionReviewPending: true
}, null, 2));
console.log('Swahili Air Medium Special runtime V6 passed: scythe grab leads into a held-scythe tucked-ball two-contact chakram candidate without changing regular j.K Air Medium.');
