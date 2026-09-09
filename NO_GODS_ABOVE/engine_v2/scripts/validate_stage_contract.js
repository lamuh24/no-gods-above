#!/usr/bin/env node
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const REPO_ROOT = path.resolve(ROOT, '..', '..');
const CONTRACT_PATH = path.join(ROOT, 'src', 'stage', 'stage_vertical_slice_v1.json');
const SCHEMA_PATH = path.join(ROOT, 'schemas', 'production', 'stage-production.schema.json');

const expectedHashes = {
  idle_00: 'A33A3C81F8C554A9E0A750B91EB875A17F7513A70DE646D8E2DBC2956BF2E077',
  idle_01: '2CDC0ECF24C9595CCA414541DEF6ADDC881E750A45674564168117E2B17487E8',
  idle_02: 'B109A3A3D6E402EA4E52DFAEBBFF155CCA26099A6FE8810A82E1EAB99C5BC3ED',
  idle_03: '1557F85ECD1E10B2B7D12556A6948B9410A6FB3B77B70FD50B4544CC62FE2D08',
  walk_forward_contact: 'C131729BB0A15E1FC578C34E0EE9DAF617FDF9C935AE13B5516C2356B4E6707F',
  walk_backward_rearward_contact: 'D4D59E72036EC4F015EFFD40097DEC74CC8286BAE2A4FF7F4D71C169D40FB2C2',
  light_hit_entry: '1728C8728D43929080A0D08DB38DF56CAE0B86F5C9AFB82F8E98D428C8808ED3',
  light_hit_reaction: '50D7F88C80C71414CA0474E7DECF8EC7612924149F5FEC5381B95370CFFCB6F7',
  light_hit_recovery: 'FF44928AB1F4BE560769D1BA76DD671876DBF2F07128506C799C61732B65DEC7',
  heavy_hit_entry: 'C4048FB7106AAB0A6E365367CEB6C1B6B64B922DF56EB4F628531272A10662A7',
  heavy_hit_reaction: '2EBA6C233687CE3426B9439DFF334F82811292952E9276DF9F26140CDBAC9096',
  heavy_hit_recovery: 'F612EE1A43B87D6A6F2C321EF77BA2B82E6031C5E4A22652FDB1A82330AF79EB',
  airborne_launch_reaction: '7B0212226FD30A878901FC15F5586EF809E07BBA0BFFD6E88DFED369DF4A7C73',
  airborne_tumble: '1574E722E395A86A9508713786E55FC8DA048E7514AF80585D1E8D94842F40A1',
  knockdown_ground_impact: 'DBE082B7386C35AE7EA60387F6B97CE34F0095340D6174B1926C4678E6AA2874',
  knockdown_impact_settle: 'FC73B12790CC069B4645A8D43620BCF34787A3EEAD4EDE06DEE09FCC9FC1EBB9',
  knockdown_face_up: '5C3F8993BC3D8C2588E75ABDA754B45313134857CE8D9426861AE283E3D31A31',
  getup_shoulder_roll: 'E5B0B19C233D7599BF91CF2478D22425B759150ECB25A0332551A4C24FA1E8F2',
  getup_roll_brace: 'E12DCE0E7CAB12F4B0E03C4F686DC11A2C2CB3BC59499CEACDF44B58F4E164DD',
  getup_push_to_kneel: 'C5A6C7F05BD01CCCE0B275F35C3BC5F971C9FDF56B75A61BD745F45FD082AC20',
  getup_neutral: '01E5A9544C3CEAA47F137608AE66DCD8B96DB96C7643C69C28CC75A9D3A866A6',
  getup_rise_to_stand: '8C81C0B7423733B42FBE5B5812A052C460F279165FA6056DE35D0440D46A060D'
};

const expectedApprovals = {
  idle_00: 'approved_idle_foundation_v1', idle_01: 'approved_idle_foundation_v1', idle_02: 'approved_idle_foundation_v1', idle_03: 'approved_idle_foundation_v1',
  walk_forward_contact: 'candidate_acceptable_preview_only', walk_backward_rearward_contact: 'candidate_acceptable_preview_only',
  light_hit_entry: 'approved_defense_reaction_motion_v1', light_hit_reaction: 'approved_defense_reaction_motion_v1', light_hit_recovery: 'approved_defense_reaction_motion_v1',
  heavy_hit_entry: 'approved_defense_reaction_motion_v1', heavy_hit_reaction: 'approved_defense_reaction_motion_v1', heavy_hit_recovery: 'approved_defense_reaction_motion_v1',
  airborne_launch_reaction: 'approved_knockdown_recovery_motion_v1', airborne_tumble: 'approved_knockdown_recovery_motion_v1',
  knockdown_ground_impact: 'approved_knockdown_recovery_motion_v1', knockdown_impact_settle: 'approved_knockdown_recovery_motion_v1', knockdown_face_up: 'approved_knockdown_recovery_motion_v1',
  getup_shoulder_roll: 'approved_knockdown_recovery_motion_v1', getup_roll_brace: 'approved_knockdown_recovery_motion_v1', getup_push_to_kneel: 'approved_knockdown_recovery_motion_v1', getup_neutral: 'approved_knockdown_recovery_motion_v1', getup_rise_to_stand: 'approved_knockdown_recovery_motion_v1'
};

function assert(condition, message) { if (!condition) throw new Error(message); }
function readJson(file) { return JSON.parse(fs.readFileSync(file, 'utf8')); }
function sha256(file) { return crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex').toUpperCase(); }

function main() {
  const schema = readJson(SCHEMA_PATH);
  const contract = readJson(CONTRACT_PATH);
  assert(schema.title === 'NGA Stage Production Contract', 'stage schema title mismatch');
  for (const key of schema.required) assert(Object.prototype.hasOwnProperty.call(contract, key), `stage contract missing ${key}`);
  assert(contract.schemaVersion === '2.2.0-stage-contract', 'stage contract version mismatch');
  assert(contract.authority.gameplayPlane === 'deterministic_2d', '2D combat plane is not authoritative');
  assert(contract.authority.renderingMayAffectGameplay === false, 'rendering authority must be false');
  assert(contract.authority.prohibitedDependencies.length >= 7, 'prohibited gameplay dependencies incomplete');
  const plane = contract.combatPlane;
  assert(plane.worldBounds.left === plane.simulationBounds.left * plane.simulationPixelsToWorldUnits, 'left combat bound mapping mismatch');
  assert(plane.worldBounds.right === plane.simulationBounds.right * plane.simulationPixelsToWorldUnits, 'right combat bound mapping mismatch');
  assert(contract.collision.leftWall === plane.simulationBounds.left && contract.collision.rightWall === plane.simulationBounds.right, 'collision and combat-plane walls diverge');
  assert(contract.collision.renderGeometryAuthoritative === false, 'render geometry cannot be authoritative');
  assert(contract.collision.hazards === 'prohibited', 'vertical slice must prohibit hazards');
  assert(contract.camera.strategy === 'constrained_perspective', 'camera strategy mismatch');
  assert(contract.camera.zoom.minDistance < contract.camera.zoom.maxDistance, 'camera zoom limits invalid');
  assert(contract.cinematicCameras.allowedContexts.every((id) => contract.cinematicCameras.shots[id]), 'cinematic context missing shot');
  assert(contract.validation.checks.length >= 16, 'validation matrix incomplete');
  assert(contract.validation.captureIds.length >= 9, 'visual capture matrix incomplete');
  assert(contract.validation.deterministicReplayRequired === true, 'deterministic replay gate missing');

  for (const asset of contract.assets.fighters) {
    const absolute = path.join(REPO_ROOT, asset.path);
    assert(fs.existsSync(absolute), `missing stage sprite source ${asset.path}`);
    assert(expectedHashes[asset.id], `unreviewed sprite id ${asset.id}`);
    assert(sha256(absolute) === expectedHashes[asset.id], `sprite hash drift for ${asset.id}`);
    assert(asset.approval === expectedApprovals[asset.id], `${asset.id} approval mismatch`);
  }
  console.log(`Validated ${contract.id}: authoritative 2D plane, constrained camera, ${contract.assets.fighters.length} hash-locked sprite sources, and ${contract.validation.checks.length} validation gates.`);
}

try { main(); } catch (error) { console.error(error.message); process.exit(1); }
