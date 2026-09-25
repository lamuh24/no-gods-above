const fs = require('node:fs'), path = require('node:path'), crypto = require('node:crypto'), assert = require('node:assert/strict');
const { compileFromPath } = require('./production_contracts');
const root = path.resolve(__dirname, '..'), repo = path.resolve(root, '../..'), pub = path.join(root, 'public');
const base = path.join(root, 'content-source/characters/lamuh-legacy-v2');
const review = path.join(repo, 'tools/nga-forge/review/lamuh-down-specials-v1');
const read = p => JSON.parse(fs.readFileSync(p, 'utf8').replace(/^\uFEFF/, ''));
const hash = p => crypto.createHash('sha256').update(fs.readFileSync(p)).digest('hex').toUpperCase();
const uri = p => 'repo://' + path.relative(repo, p).replaceAll('\\', '/');
const write = (p, v) => { fs.mkdirSync(path.dirname(p), { recursive: true }); fs.writeFileSync(p, JSON.stringify(v, null, 2) + '\n'); };
const strengths = ['light', 'medium', 'heavy'];
const reportNames = [...strengths, 'wave', 'connector', 'front-connector', 'heel'];
const reports = Object.fromEntries(reportNames.map(s => [s, read(path.join(review, s + '-normalization.json'))]));
const attacks = require('../dist/data/fighters').fighterDefinitions.lamuh_legacy_v2.attacks;
const idlePath = '/lamuh-legacy-v2/movement-v2/idle-00.png';
const idle = { publicPath: idlePath, sha256: hash(path.join(pub, idlePath)), role: 'exact movement idle recovery', root: { x: 768, y: 1360 } };
const exposureMap = { light: [3, 3, 2, 4, 5, 3, 3, 5], medium: [4, 3, 2, 2, 2, 5, 6, 4, 6, 8], heavy: [6, 6, 7, 3, 1, 8, 10, 10, 5] };
assert.equal(reports.connector.frames.length, 1, 'Real passing connector required');
assert.equal(reports['front-connector'].frames.length, 1, 'Real front passing connector required');
assert.equal(reports.heel.frames.length, 1, 'Repaired Heavy heel-down connector required');
const frameOrigins = new Map(reportNames.flatMap(name => reports[name].frames.map(f => [f.publicPath, uri(path.join(review, name + '-normalization.json'))])));
const poseSequences = {
  light: [reports.light.frames[0], reports.light.frames[1], reports.light.frames[2], reports.light.frames[3], reports.light.frames[4], reports.light.frames[0], reports.light.frames[5], idle],
  medium: [reports.medium.frames[0], reports.medium.frames[1], reports.connector.frames[0], reports['front-connector'].frames[0], reports.medium.frames[2], reports.medium.frames[3], reports.medium.frames[4], reports.light.frames[0], reports.medium.frames[5], idle],
  heavy: [...reports.heavy.frames.slice(0, 3), reports.heel.frames[0], ...reports.heavy.frames.slice(4), idle]
};
const variants = {};
for (const strength of strengths) {
  const attack = attacks['legacy_aura_sweep_' + strength], report = reports[strength];
  const contactFrame = strength === 'light' ? 3 : strength === 'medium' ? 5 : 4;
  assert.equal(report.frames.length, strength === 'heavy' ? 8 : 6, strength + ': real normalized art frame count');
  const frames = poseSequences[strength].map((f, index) => ({ ...f, sourcePoseIndex: f.index ?? 0,
    sourceNormalizationUri: frameOrigins.get(f.publicPath) ?? null, sourceOrigin: frameOrigins.has(f.publicPath) ? 'normalized_candidate_art' : 'exact_existing_movement_idle',
    index, contact: index === contactFrame, visibleImpact: index === contactFrame }));
  const exposureTicks = exposureMap[strength], durationTicks = exposureTicks.reduce((a, b) => a + b, 0);
  assert.equal(durationTicks, attack.startup + attack.active + attack.recovery);
  assert.equal(exposureTicks.slice(0, contactFrame).reduce((a, b) => a + b, 0), attack.startup);
  variants[strength] = { attackId: attack.id, frames, exposureTicks, durationTicks, combatProfile: attack, contactFrame, visibleImpactCount: 1 };
}
assert.equal(reports.wave.frames.length, 2, 'Two normalized detached wave frames required');
const manifest = { schemaVersion: '1.0.0', candidateOnly: true, deployable: false, humanApproval: null,
  status: 'awaiting_human_down_special_family_review', variants, projectileFrames: reports.wave.frames, projectileExposureTicks: [3, 3],
  notes: ['New grounded down-special candidate family; legacy sources and other move profiles are preserved.',
    'One low contact each. Light and Medium use heel collision; Heavy releases only an independent ground wave.',
    'Deterministic 60 Hz authored timelines: Light28, Medium42, Heavy56; renderer never owns damage.',
    'Crouch block is counterplay; no new invulnerability, cancel privileges or automatic approval.',
    'Fixed root registration is not a claim of per-frame anatomical foot measurements.'],
  promptProvenance: uri(path.join(review, 'README.md')) };
for (const f of [...Object.values(variants).flatMap(v => v.frames), ...manifest.projectileFrames]) {
  assert.equal(hash(path.join(pub, f.publicPath)), f.sha256, 'Normalized source hash mismatch: ' + f.publicPath);
}
const out = path.join(base, 'down-special-packages-v1'), approval = path.join(out, 'records/human-review.pending.json');
const metadata = path.join(out, 'records/registration.json'), provPath = path.join(out, 'records/provenance.json');
const template = read(path.join(base, 'divine-vanish-packages/light/animation.package.json'));
const provenance = { ...template.provenance, references: reportNames.map(s => uri(path.join(review, s + '-normalization.json'))),
  promptProvenance: manifest.promptProvenance, revisionChain: ['USER_APPROVED_DOWN_AURA_SWEEP_FAMILY_V1'],
  humanApproval: { state: 'pending', approvedAt: null, approvedBy: null } };
write(approval, { state: 'pending', candidateOnly: true, deployable: false, approvedAt: null, approvedBy: null });
write(metadata, manifest); write(provPath, provenance);
for (const strength of strengths) {
  const s = variants[strength], d = s.combatProfile, h = d.projectile?.hitbox ?? d.hitboxes[0];
  const p = structuredClone(template), id = 'aura_sweep_' + strength;
  p.id = id; p.simulationLength = s.durationTicks; p.provenance = provenance;
  p.sourceFrames = s.frames.map((f, i) => ({ id: id + '_frame_' + i, sourceUri: uri(path.join(pub, f.publicPath)),
    width: 2048, height: 1536, sha256: f.sha256, approvalUri: uri(approval), metadataUri: uri(metadata), provenanceUri: uri(provPath) }));
  let cursor = 0;
  p.exposures = s.exposureTicks.map((duration, i) => { const e = { sourceFrameId: p.sourceFrames[i].id, start: cursor, duration }; cursor += duration; return e; });
  p.phases = { anticipation: [], startup: [{ start: 0, end: d.startup - 1 }], active: [{ start: d.startup, end: d.startup + d.active - 1 }],
    impact: [], followThrough: [], recovery: [{ start: d.startup + d.active, end: s.durationTicks - 1 }] };
  p.anchors = p.exposures.map(e => ({ frame: e.start, sourceFrameId: e.sourceFrameId, root: { x: 768, y: 1360 }, feet: { x: 768, y: 1360 }, effect: { x: 768, y: 1360 } }));
  p.groundingTrack = p.sourceFrames.map(f => ({ sourceFrameId: f.id, root: { x: 768, y: 1360 }, nearFoot: { x: 768, y: 1360 }, farFoot: { x: 768, y: 1360 },
    nearFootRole: 'fixed_registration_not_foot_measurement', farFootRole: 'fixed_registration_not_foot_measurement', projectedGroundPlaneY: 1360, contractVersion: 'fixed_root_candidate_v1' }));
  p.combatTrack = { startup: d.startup, active: d.active, recovery: d.recovery, damage: h.damage, hitstop: h.hitstop, hitstun: h.hitstun, blockstun: h.blockstun,
    boxes: d.hitboxes.flatMap(box => Array.from({ length: box.end - box.start + 1 }, (_, i) => ({ frame: box.start + i, kind: 'hit', x: box.rect.x, y: box.rect.y, width: box.rect.w, height: box.rect.h }))),
    cancelWindows: [], timingAuthorship: { ...template.combatTrack.timingAuthorship, authoredTotalDuration: s.durationTicks } };
  if (d.rootMotion) p.combatTrack.rootMotionTrack = { owner: 'deterministic_simulation', hitstopFreezes: true, attackId: d.id, segments: [d.rootMotion] };
  if (d.projectile) p.combatTrack.projectileTrack = { ...d.projectile, owner: 'deterministic_simulation', maxHits: 1, independentAfterRelease: true,
    bodyHitboxes: false, attackId: d.id, collisionRect: h.rect, damage: h.damage };
  p.transitionCompatibility = [{ fromStates: ['idle', 'walk_forward', 'walk_backward', 'crouch'], toState: id, condition: 'grounded_down_special_' + strength + '_input', addsGameplayFrames: false }];
  p.approvalRecords = [uri(approval)]; p.validation.creativeWarnings = manifest.notes;
  p.gameplayTimingStatus = { owner: 'simulation', state: 'sandbox_candidate_awaiting_combat_approval', authoritative: false,
    candidateValues: { startup: d.startup, active: d.active, recovery: d.recovery, damage: h.damage }, notes: manifest.notes };
  write(path.join(out, strength, 'animation.package.json'), p);
}
const bundlePath = path.join(out, 'down-specials.bundle.json');
write(bundlePath, { ...read(path.join(base, 'character.bundle.json')), id: 'lamuh_down_specials_v1', displayName: 'Lamuh ground aura sweep family candidate',
  animationPackages: strengths.map(s => s + '/animation.package.json'), packageGroups: { down_specials: strengths.map(s => 'aura_sweep_' + s) } });
write(path.join(root, 'generated/manifests/lamuh_down_specials_v1.candidate.runtime.json'), compileFromPath(bundlePath));
write(path.join(pub, 'lamuh-legacy-v2/down-specials-v1/manifest.json'), manifest);
write(path.join(base, 'down-specials-v1/manifest.json'), manifest);
console.log('Down special source hashes, independent 28/42/56-tick timelines and three Forge candidates compiled.');
