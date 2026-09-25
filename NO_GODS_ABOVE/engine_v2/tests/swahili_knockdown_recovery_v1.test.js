const assert = require('assert');
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const recovery = require('../dist/sandbox/knockdownRecoveryV1');

function run(name, test) { test(); console.log(`PASS ${name}`); }

const EXPECTED = [
  ['01_launch_reaction.png', '7B0212226FD30A878901FC15F5586EF809E07BBA0BFFD6E88DFED369DF4A7C73'],
  ['02_airborne_tumble.png', '1574E722E395A86A9508713786E55FC8DA048E7514AF80585D1E8D94842F40A1'],
  ['03_ground_impact.png', 'DBE082B7386C35AE7EA60387F6B97CE34F0095340D6174B1926C4678E6AA2874'],
  ['04_impact_settle.png', 'FC73B12790CC069B4645A8D43620BCF34787A3EEAD4EDE06DEE09FCC9FC1EBB9'],
  ['05_face_up_knockdown.png', '5C3F8993BC3D8C2588E75ABDA754B45313134857CE8D9426861AE283E3D31A31'],
  ['06_shoulder_roll_knee_draw.png', 'E5B0B19C233D7599BF91CF2478D22425B759150ECB25A0332551A4C24FA1E8F2'],
  ['07_face_up_roll_brace.png', 'E12DCE0E7CAB12F4B0E03C4F686DC11A2C2CB3BC59499CEACDF44B58F4E164DD'],
  ['08_push_to_kneel.png', 'C5A6C7F05BD01CCCE0B275F35C3BC5F971C9FDF56B75A61BD745F45FD082AC20'],
  ['09_neutral_get_up.png', '01E5A9544C3CEAA47F137608AE66DCD8B96DB96C7643C69C28CC75A9D3A866A6'],
  ['10_rise_to_stand.png', '8C81C0B7423733B42FBE5B5812A052C460F279165FA6056DE35D0440D46A060D']
];

run('approved recovery promotion is byte-identical to reviewed candidates', () => {
  const root = path.join(__dirname, '..', '..', '..', 'tools', 'nga-forge', 'production', 'characters', 'swahili', 'source-frames', 'approved', 'knockdown-recovery-motion-v1');
  assert.strictEqual(recovery.KNOCKDOWN_RECOVERY_MOTION_V1_FRAMES.length, 10);
  for (const [file, expected] of EXPECTED) {
    const actual = crypto.createHash('sha256').update(fs.readFileSync(path.join(root, file))).digest('hex').toUpperCase();
    assert.strictEqual(actual, expected, file);
  }
});

run('command-grab knockdown sequence begins at impact and reaches rise without gaps', () => {
  const seen = [];
  for (let tick = 0; tick < recovery.KNOCKDOWN_RECOVERY_MOTION_V1_REVIEW.commandGrabKnockdownTicks; tick++) {
    seen.push(recovery.commandGrabKnockdownRecoveryFrameAtTick(tick).sourceId);
  }
  assert.deepStrictEqual([...new Set(seen)], recovery.KNOCKDOWN_RECOVERY_MOTION_V1_FRAMES.slice(2).map((frame) => frame.sourceId));
  assert.strictEqual(recovery.commandGrabKnockdownRecoveryFrameAtTick(recovery.KNOCKDOWN_RECOVERY_MOTION_V1_REVIEW.commandGrabKnockdownTicks), null);
  assert.strictEqual(recovery.KNOCKDOWN_RECOVERY_MOTION_V1_REVIEW.cursorOwner, 'sandbox_simulation');
  assert.strictEqual(recovery.KNOCKDOWN_RECOVERY_MOTION_V1_REVIEW.deployable, false);
});

console.log('Swahili Knockdown / Recovery Motion V1 validation passed: approved hashes, impact-to-rise continuity, simulation-owned timing, and candidate-only sandbox scope.');
