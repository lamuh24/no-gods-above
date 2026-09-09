const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const assert = require('node:assert/strict');
const { compileFromPath, stableJson } = require('./production_contracts');
const root = path.resolve(__dirname, '..'), repo = path.resolve(root, '../..');
const base = path.join(root, 'content-source/characters/lamuh-legacy-v2');
const out = path.join(base, 'divine-vanish-counter-packages-v3');
const read = p => JSON.parse(fs.readFileSync(p, 'utf8'));
const hash = p => crypto.createHash('sha256').update(fs.readFileSync(p)).digest('hex').toUpperCase();
const uri = p => 'repo://' + path.relative(repo, p).replaceAll('\\', '/');
function build({ check = false } = {}) {
  const { fighterDefinitions } = require('../dist/data/fighters');
  const attack = fighterDefinitions.lamuh_legacy_v2.attacks.legacy_divine_vanish_heavy;
  const response = attack.strikeCounter?.response;
  assert(response, 'Build the nested Divine counter core before packaging');
  assert.deepEqual([attack.startup, attack.active, attack.recovery], [6, 0, 34]);
  assert.deepEqual([response.startup, response.active, response.recovery], [8, 3, 25]);
  const reviewPath = path.join(root, 'public/lamuh-legacy-v2/review-data.json');
  const reviewHash = hash(reviewPath), review = read(reviewPath);
  const oldPath = path.join(base, 'divine-vanish-family.candidate.v1.json'), oldHash = hash(oldPath), old = read(oldPath);
  const idle = old.variants.light.v2.frames[0], pose = old.variants.light.v2.frames.slice(1, 7);
  const aura = old.variants.medium.v2.frames[4], ascend = review.ascendStepFamily.variants.heavy.v2.frames;
  const sequence = (frames, exposureTicks, contact) => ({ frames: frames.map((f, index) => ({ ...structuredClone(f), index, contact: index === contact, visibleImpact: index === contact })), exposureTicks, durationTicks: exposureTicks.reduce((a, b) => a + b, 0), contactFrame: contact, visibleImpactCount: contact === null ? 0 : 1 });
  const counterTrack = { owner: 'deterministic_simulation', attackId: attack.id, hitstopFreezes: true, trigger: 'incoming_body_strike', responseMode: 'nested_definition_same_attack_id', start: attack.strikeCounter.start, end: attack.strikeCounter.end, responseStartup: response.startup, responseActive: response.active, responseRecovery: response.recovery, responseStrikeInvulnThrough: response.responseStrikeInvulnThrough };
  const manifest = { schemaVersion: '1.0.0', status: 'awaiting_human_divine_vanish_heavy_counter_review', candidateOnly: true, deployable: false, light: old.variants.light, medium: old.variants.medium, lightMotionApproval: old.lightMotionApproval,
    stance: sequence([idle, pose[0], pose[4], pose[5], idle], [2, 16, 8, 6, 8], null),
    response: sequence([aura, ascend[5], ascend[6], ascend[7], ascend[8], pose[4], pose[5], idle], [5, 2, 1, 3, 6, 7, 6, 6], 3), counterTrack,
    approval: { heavy: null, combat: null, character: null }, notes: ['Light and Medium source/timing unchanged; Heavy V1 retreat is preserved history, not the new playable Heavy.', 'Heavy stance is stationary and responds only to a genuine incoming body strike during ticks6-17.', 'Triggered response uses nested simulation mode, not a second input move. One72-damage soft-knockdown blast at ticks8-10.', 'Response body-strike protection is authored through tick4 only; projectiles and throws remain separate counterplay.', 'Reused source artwork remains candidate for this new sequence; acceptance of the original move does not approve the counter composition.'] };
  const approvalPath = path.join(out, 'records/human-review.pending.json'), provenancePath = path.join(out, 'records/provenance.json'), metadataPath = path.join(out, 'records/registration.json');
  manifest.response.combatProfile = structuredClone(response);
  const template = read(path.join(base, 'divine-vanish-packages/light/animation.package.json'));
  const bundle = read(path.join(base, 'character.bundle.json'));
  const provenance = { ...template.provenance, references: [uri(oldPath), uri(reviewPath)], revisionChain: ['DIVINE_VANISH_RETREAT_V1_PRESERVED', 'HEAVY_GENUINE_STRIKE_COUNTER_V3_CANDIDATE'], humanApproval: { state: 'pending', approvedAt: null, approvedBy: null } };
  const outputs = new Map();
  outputs.set(approvalPath, { state: 'pending', approvedAt: null, approvedBy: null, candidateOnly: true, deployable: false, remainingReview: manifest.notes });
  outputs.set(provenancePath, provenance); outputs.set(metadataPath, { candidateOnly: true, deployable: false, stance: manifest.stance, response: manifest.response });
  for (const mode of ['stance', 'response']) {
    const clip = manifest[mode], definition = mode === 'stance' ? attack : response;
    const id = `divine_vanish_heavy_${mode}`, p = structuredClone(template);
    let cursor = 0;
    p.id = id; p.simulationLength = clip.durationTicks; p.provenance = provenance;
    p.sourceFrames = clip.frames.map((f, i) => {
      const file = path.join(root, 'public', f.publicPath); assert.equal(hash(file), f.sha256);
      return { id: `${id}_frame_${i}`, sourceUri: uri(file), width: 2048, height: 1536, sha256: f.sha256, approvalUri: uri(approvalPath), provenanceUri: uri(provenancePath), metadataUri: uri(metadataPath) };
    });
    p.exposures = clip.exposureTicks.map((duration, i) => { const e = { sourceFrameId: p.sourceFrames[i].id, start: cursor, duration }; cursor += duration; return e; });
    p.phases = { anticipation: [], startup: [{ start: 0, end: definition.startup - 1 }], active: mode === 'response' ? [{ start: 8, end: 10 }] : [], impact: [], followThrough: [], recovery: [{ start: definition.startup + definition.active, end: clip.durationTicks - 1 }] };
    p.anchors = p.exposures.map(e => ({ frame: e.start, sourceFrameId: e.sourceFrameId, root: { x: 768, y: 1360 }, feet: { x: 768, y: 1360 }, effect: { x: 768, y: 1360 } }));
    p.groundingTrack = p.sourceFrames.map(f => ({ sourceFrameId: f.id, root: { x: 768, y: 1360 }, nearFoot: { x: 768, y: 1360 }, farFoot: { x: 768, y: 1360 }, nearFootRole: 'fixed_registration_not_foot_measurement', farFootRole: 'fixed_registration_not_foot_measurement', projectedGroundPlaneY: 1360, contractVersion: 'fixed_root_candidate_v1' }));
    const h = response.hitboxes[0];
    p.combatTrack = { startup: definition.startup, active: definition.active, recovery: definition.recovery, damage: mode === 'response' ? h.damage : 0, hitstop: mode === 'response' ? h.hitstop : 0, hitstun: mode === 'response' ? h.hitstun : 0, blockstun: mode === 'response' ? h.blockstun : 0, boxes: mode === 'response' ? [8, 9, 10].map(frame => ({ frame, kind: 'hit', x: h.rect.x, y: h.rect.y, width: h.rect.w, height: h.rect.h })) : [], cancelWindows: [], timingAuthorship: { ...template.combatTrack.timingAuthorship, authoredTotalDuration: clip.durationTicks } };
    if (mode === 'stance') p.combatTrack.counterTrack = counterTrack;
    p.transitionCompatibility = [{ fromStates: mode === 'stance' ? ['idle', 'walk_backward', 'crouch'] : ['divine_vanish_heavy_stance'], toState: id, condition: mode === 'stance' ? 'grounded_back_special_heavy_input' : 'simulation_confirmed_body_strike_counter', addsGameplayFrames: false }];
    p.approvalRecords = [uri(approvalPath)]; p.validation.creativeWarnings = manifest.notes;
    p.gameplayTimingStatus = { owner: 'simulation', state: 'sandbox_candidate_awaiting_combat_approval', authoritative: false, candidateValues: { startup: definition.startup, active: definition.active, recovery: definition.recovery, damage: p.combatTrack.damage }, notes: manifest.notes };
    outputs.set(path.join(out, mode, 'animation.package.json'), p);
  }
  const bundlePath = path.join(out, 'divine-counter.bundle.json');
  outputs.set(bundlePath, { ...bundle, id: 'lamuh_divine_counter_v3', displayName: 'Lamuh Heavy counter candidate', animationPackages: ['stance/animation.package.json', 'response/animation.package.json'], packageGroups: { conditional_heavy_counter: ['divine_vanish_heavy_stance', 'divine_vanish_heavy_response'] } });
  const publish = (p, v) => { if (check) assert.equal(stableJson(read(p)), stableJson(v), `Stale ${p}`); else { fs.mkdirSync(path.dirname(p), { recursive: true }); fs.writeFileSync(p, JSON.stringify(v, null, 2) + '\n'); } };
  for (const [p, v] of outputs) publish(p, v);
  publish(path.join(root, 'generated/manifests/lamuh_divine_counter_v3.candidate.runtime.json'), compileFromPath(bundlePath));
  publish(path.join(root, 'public/lamuh-legacy-v2/divine-vanish-v3/manifest.json'), manifest);
  publish(path.join(base, 'divine-vanish-counter.candidate.v3.json'), manifest);
  assert.equal(hash(oldPath), oldHash); assert.equal(hash(reviewPath), reviewHash);
  console.log(`${check ? 'CHECKED' : 'BUILT'} Divine counter V3 additive candidate; Light/Medium and shared review preserved.`);
}
if (require.main === module) build({ check: process.argv.includes('--check') });
module.exports = { build };
