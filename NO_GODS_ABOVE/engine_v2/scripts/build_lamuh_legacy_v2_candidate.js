const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

const engineRoot = path.resolve(__dirname, '..');
const gameRoot = path.resolve(engineRoot, '..');
const contentRoot = path.join(engineRoot, 'content-source', 'characters', 'lamuh-legacy-v2');
const publicRoot = path.join(engineRoot, 'public', 'lamuh-legacy-v2');
const generatedRoot = path.join(engineRoot, 'generated', 'lamuh-legacy-v2');
const styleReviewRoot = path.resolve(gameRoot, '..', 'tools', 'nga-forge', 'review', 'lamuh-legacy-v2-style-modernization-v1');
const styleApprovalPath = path.join(contentRoot, 'records', 'style-checkpoint-v1.approval.json');

const relative = (absolutePath) => path.relative(gameRoot, absolutePath).replaceAll('\\', '/');
const sha256 = (absolutePath) => crypto.createHash('sha256').update(fs.readFileSync(absolutePath)).digest('hex').toUpperCase();
const writeJson = (absolutePath, value) => {
  fs.mkdirSync(path.dirname(absolutePath), { recursive: true });
  fs.writeFileSync(absolutePath, `${JSON.stringify(value, null, 2)}\n`, 'utf8');
};
const pngDimensions = (absolutePath) => {
  const header = fs.readFileSync(absolutePath).subarray(0, 24);
  if (header.toString('ascii', 1, 4) !== 'PNG') throw new Error(`${absolutePath} is not a PNG`);
  return { width: header.readUInt32BE(16), height: header.readUInt32BE(20) };
};

const sheets = [
  {
    id: 'core_movement', atlas: 'assets/sprites/lamuh_final/lamuh_sheet_1_core_movement_atlas.png', source: 'assets/sprites/lamuh_final/lamuh_sheet_1_core_movement_source_chroma.png',
    columns: 8, rows: 6, frameCounts: [8, 6, 6, 6, 6, 4], names: ['idle', 'walk_forward', 'walk_backward', 'dash_forward', 'dash_backward', 'crouch']
  },
  {
    id: 'air_movement', atlas: 'assets/sprites/lamuh_final/lamuh_sheet_2_air_movement_atlas.png', source: 'assets/sprites/lamuh_final/lamuh_sheet_2_air_movement_source_chroma.png',
    columns: 6, rows: 6, frameCounts: [4, 4, 4, 4, 6, 6], names: ['jump', 'forward_jump', 'backward_jump', 'fall', 'air_dash_forward', 'air_dash_backward']
  },
  {
    id: 'ground_normals', atlas: 'assets/sprites/lamuh_final/lamuh_sheet_3_ground_normals_atlas.png', source: 'assets/sprites/lamuh_final/lamuh_sheet_3_ground_normals_source_chroma.png',
    columns: 8, rows: 4, frameCounts: [4, 8, 7, 7], names: ['standing_light', 'standing_medium', 'standing_heavy', 'launcher_crouching_heavy']
  },
  {
    id: 'air_normals', atlas: 'assets/sprites/lamuh_final/lamuh_sheet_4_air_normals_atlas.png', source: 'assets/sprites/lamuh_final/lamuh_sheet_4_air_normals_source_chroma.png',
    columns: 7, rows: 4, frameCounts: [4, 6, 7, 4], names: ['air_light', 'air_medium', 'air_heavy', 'air_recovery']
  },
  {
    id: 'specials', atlas: 'assets/sprites/lamuh_final/lamuh_sheet_5_specials_atlas.png', source: 'assets/sprites/lamuh_final/lamuh_sheet_5_specials_source_chroma.png',
    columns: 8, rows: 6, frameCounts: [6, 7, 7, 6, 7, 4], names: ['celestial_palm', 'ascend_step', 'heaven_splitter', 'divine_vanish', 'radiant_dive', 'special_recovery']
  },
  {
    id: 'defense_reactions', atlas: 'assets/sprites/lamuh_final/lamuh_sheet_6_defense_hit_reactions_atlas.png', source: 'assets/sprites/lamuh_final/lamuh_sheet_6_defense_hit_reactions_source_chroma.png',
    columns: 8, rows: 6, frameCounts: [4, 4, 4, 5, 6, 6], names: ['standing_block', 'crouching_block', 'air_block', 'light_reaction', 'medium_reaction', 'heavy_launch_reaction']
  },
  {
    id: 'end_states', atlas: 'assets/sprites/lamuh_final/lamuh_sheet_7_knockdown_recovery_flavor_atlas.png', source: 'assets/sprites/lamuh_final/lamuh_sheet_7_knockdown_recovery_flavor_source_chroma.png',
    columns: 8, rows: 7, frameCounts: [6, 3, 6, 8, 8, 8, 8], runtimeFrameCounts: [6, 1, 6, 8, 8, 8, 8], names: ['knockdown_fall', 'ground_state', 'get_up', 'ko', 'intro', 'victory', 'taunt']
  },
  {
    id: 'crown_body', atlas: 'assets/sprites/lamuh_final/lamuh_sheet_8_crown_of_no_gods_body_atlas.png', source: 'assets/sprites/lamuh_final/lamuh_sheet_8_crown_of_no_gods_body_source_chroma.png',
    columns: 8, rows: 8, frameCounts: [6, 7, 8, 8, 7, 8, 8, 6], names: ['crown_startup', 'crown_rush', 'cinematic_string_a', 'cinematic_string_b', 'launch_setup', 'transformation_charge', 'ascended_beam_pose', 'ascended_recovery']
  }
];

const rootByName = (name) => {
  if (name.includes('walk') || name.includes('dash') || name.includes('jump')) return 'V1 code-driven travel; sprite cells are bottom-center anchored and contain no gameplay root curve.';
  if (['ascend_step', 'divine_vanish', 'radiant_dive', 'crown_rush'].includes(name)) return 'V1 code-driven special travel; re-author an explicit deterministic V2 root path.';
  return 'In-place bottom-center visual root; no recoverable per-frame gameplay root track.';
};
const roleByName = (name) => {
  if (name.includes('block') || name.includes('reaction') || name.includes('knockdown') || name === 'ground_state' || name === 'get_up') return 'defense';
  if (name.includes('light') || name.includes('medium') || name.includes('heavy') || name.includes('launcher')) return 'normal_attack';
  if (['celestial_palm', 'ascend_step', 'heaven_splitter', 'divine_vanish', 'radiant_dive', 'special_recovery'].includes(name)) return 'special';
  if (name.startsWith('crown_') || name.includes('cinematic') || name.includes('ascended') || name === 'launch_setup' || name === 'transformation_charge') return 'ultimate_source';
  if (['intro', 'victory', 'taunt', 'ko'].includes(name)) return 'flavor';
  return 'movement';
};
const dispositionByName = (name) => {
  if (['standing_medium', 'standing_heavy', 'divine_vanish'].includes(name)) return 'MODERNIZE';
  if (['idle', 'walk_forward', 'walk_backward', 'dash_forward', 'dash_backward', 'crouch', 'jump', 'forward_jump', 'backward_jump', 'fall', 'air_dash_forward', 'air_dash_backward'].includes(name)) return 'PRESERVE';
  if (['standing_light', 'air_light', 'air_medium', 'air_heavy', 'ascend_step', 'heaven_splitter'].includes(name)) return 'PRESERVE_WITH_RETIMING';
  if (roleByName(name) === 'ultimate_source') return 'DEFERRED_NOT_BLOCKING';
  return 'PRESERVE_WITH_V2_COMBAT_UPDATE';
};

const historicalCombat = {
  standing_light: { durationTicks: 15, damage: 32 }, standing_medium: { durationTicks: 21, damage: 58 }, standing_heavy: { durationTicks: 31, damage: 88 },
  crouching_light: { durationTicks: 14, damage: 28 }, crouching_medium: { durationTicks: 19, damage: 54 }, launcher_crouching_heavy: { durationTicks: 31, damage: 78 },
  air_light: { durationTicks: 12, damage: 30 }, air_medium: { durationTicks: 19, damage: 56 }, air_heavy: { durationTicks: 26, damage: 82 },
  celestial_palm: { durationTicks: 29, damage: 102 }, ascend_step: { durationTicks: 30, damage: 78 }, heaven_splitter: { durationTicks: 36, damage: 116 },
  crown_startup: { durationTicks: 62, damage: null }
};
const currentLegacyCombat = {
  standing_light: { phases: [2, 5, 5], damage: 24 }, standing_medium: { phases: [5, 6, 9], damage: 48 }, standing_heavy: { phases: [9, 5, 18], damage: 82 },
  crouching_light: { phases: [2, 4, 6], damage: 22 }, crouching_medium: { phases: [5, 5, 9], damage: 44 }, launcher_crouching_heavy: { phases: [8, 5, 19], damage: 70 },
  air_light: { phases: [2, 5, 4], damage: 22 }, air_medium: { phases: [5, 6, 8], damage: 44 }, air_heavy: { phases: [7, 5, 15], damage: 72 },
  celestial_palm: { phases: [3, 5, 9], damage: 38, projectile: true }, ascend_step: { phases: [5, 6, 15], damage: 62 },
  heaven_splitter: { phases: [7, 6, 22], damage: 72, launcher: true }, divine_vanish: { phases: [2, 0, 13], damage: 0 }, radiant_dive: { phases: [5, 6, 18], damage: 58 }
};

const animationAudit = [];
for (const sheet of sheets) {
  sheet.names.forEach((name, row) => {
    const role = roleByName(name);
    const historical = historicalCombat[name] || null;
    const current = currentLegacyCombat[name] || null;
    animationAudit.push({
      animationName: name,
      sheetId: sheet.id,
      row,
      sourceFrameCount: sheet.frameCounts[row],
      originalExposureTiming: historical
        ? { source: 'historical_v1_c032', durationTicks: historical.durationTicks, meanTicksPerSourceFrame: Number((historical.durationTicks / sheet.frameCounts[row]).toFixed(2)) }
        : { source: 'legacy_global_loop', framesPerSecond: 8, ticksPerSourceFrame: 7.5, note: 'Movement/reaction loops did not consistently reset on state entry.' },
      gameplayRole: role,
      historicalV1Combat: historical,
      currentLamuhLegacyCombat: current,
      originalHitBlockBehavior: historical ? 'Move-level V1 hit/block behavior only; no per-frame combat track.' : null,
      rootBehavior: rootByName(name),
      existingCollisionData: role === 'normal_attack' || role === 'special' ? 'Move-level generic/modern Lamuh box only; no frame-indexed collision data.' : 'No animation-local collision track recovered.',
      transitionBehavior: 'Legacy runtime enters/exits through generic action/state logic; no authored transition package.',
      vfxDependencies: name === 'celestial_palm' ? ['lamuh_vfx_celestial_palm_projectile'] : name === 'ascend_step' ? ['lamuh_vfx_ascend_radiant_trail'] : name === 'heaven_splitter' ? ['lamuh_vfx_heaven_splitter_vertical'] : name.startsWith('crown_') || name.includes('ascended') || name === 'transformation_charge' ? ['lamuh_crown_of_no_gods_beam_vfx'] : [],
      audioDependencies: role === 'normal_attack' || role === 'special' ? ['legacy_generic_attack_audio_routing'] : [],
      sourceMotionReusable: !['crown_startup', 'crown_rush', 'cinematic_string_a', 'cinematic_string_b', 'launch_setup', 'transformation_charge', 'ascended_beam_pose', 'ascended_recovery'].includes(name),
      visualArtworkReusable: role !== 'ultimate_source',
      v2Disposition: dispositionByName(name),
      needsV2Redesign: ['standing_medium', 'standing_heavy', 'divine_vanish'].includes(name),
      reviewNotes: name === 'standing_medium' ? 'Visible punch-to-kick sequence needs hit-count parity review.' : name === 'standing_heavy' ? 'Multiple impact-like moments and duplicated fill require frame scrub.' : name === 'ground_state' ? 'Atlas has three visible frames while current runtime exposes one.' : sheet.id === 'crown_body' ? 'Mixed provenance; rows 5-7 were rebuilt later and are not untouched V1 source.' : null
    });
  });
}

const sourceArtifacts = [];
for (const sheet of sheets) {
  for (const kind of ['source', 'atlas']) {
    const absolutePath = path.join(gameRoot, sheet[kind]);
    if (!fs.existsSync(absolutePath)) throw new Error(`Missing protected source: ${absolutePath}`);
    sourceArtifacts.push({ kind: kind === 'source' ? 'source_image' : 'runtime_atlas', sheetId: sheet.id, path: sheet[kind], sha256: sha256(absolutePath), ...pngDimensions(absolutePath) });
  }
}
const vfxFiles = [
  'assets/effects/lamuh/lamuh_crown_of_no_gods_beam_vfx_uploaded_chat_source.png',
  'assets/effects/lamuh/lamuh_crown_of_no_gods_beam_vfx_atlas.png',
  'assets/effects/lamuh/lamuh_vfx_celestial_palm_projectile.png',
  'assets/effects/lamuh/lamuh_vfx_ascend_radiant_trail.png',
  'assets/effects/lamuh/lamuh_vfx_heaven_splitter_vertical.png'
];
for (const assetPath of vfxFiles) {
  const absolutePath = path.join(gameRoot, assetPath);
  sourceArtifacts.push({ kind: 'vfx', path: assetPath, sha256: sha256(absolutePath), ...pngDimensions(absolutePath) });
}
const gamePath = path.join(gameRoot, 'game.js');
sourceArtifacts.push({ kind: 'legacy_gameplay_definition', path: 'game.js', sha256: sha256(gamePath), byteLength: fs.statSync(gamePath).size });

const computedSourceLock = {
  schemaVersion: '1.0.0', characterId: 'lamuh_legacy_v2', generatedAt: '2026-08-26T00:00:00.000Z',
  immutableSourcePolicy: true, legacyOriginalsModified: false,
  retiredFixtureExcluded: 'engine_v2/content-source/characters/lamuh',
  artifacts: sourceArtifacts
};
const sourceLockPath = path.join(contentRoot, 'source-lock.v1.json');
if (process.argv.includes('--bootstrap-source-lock')) {
  if (fs.existsSync(sourceLockPath)) throw new Error(`Refusing to overwrite existing immutable source lock: ${sourceLockPath}`);
  writeJson(sourceLockPath, computedSourceLock);
  console.log(`Bootstrapped immutable Lamuh Legacy V1 source lock with ${sourceArtifacts.length} artifacts.`);
  process.exit(0);
}
if (!fs.existsSync(sourceLockPath)) throw new Error('Immutable Lamuh source lock is missing. Run the explicit bootstrap:source-lock script once after human review.');
const sourceLock = JSON.parse(fs.readFileSync(sourceLockPath, 'utf8'));
if (sourceLock.characterId !== computedSourceLock.characterId || sourceLock.immutableSourcePolicy !== true) throw new Error('Existing Lamuh source lock has an invalid identity or policy.');
const lockedByPath = new Map(sourceLock.artifacts.map((artifact) => [artifact.path, artifact]));
for (const current of sourceArtifacts) {
  const locked = lockedByPath.get(current.path);
  if (!locked) throw new Error(`Protected artifact missing from immutable source lock: ${current.path}`);
  for (const key of ['kind', 'sheetId', 'sha256', 'width', 'height', 'byteLength']) {
    if ((locked[key] ?? null) !== (current[key] ?? null)) throw new Error(`IMMUTABLE SOURCE LOCK MISMATCH: ${current.path} (${key})`);
  }
}
if (lockedByPath.size !== sourceArtifacts.length) throw new Error('Immutable source lock artifact count does not match the protected source inventory.');

const sourceAudit = {
  schemaVersion: '1.0.0', characterId: 'lamuh_legacy_v2', technicalStatus: 'AUDIT_COMPLETE_CANDIDATE_ONLY', humanReviewStatus: null,
  auditBasis: {
    historicalOriginal: 'Git-introduced playable Lamuh inherited Sol/baseline combat; retained only as recoverable V1 evidence.',
    currentLegacyRuntime: 'Current lamuh_legacy clones modern Lamuh attacks, remaps five legacy specials, then filters the move set.',
    v2BalanceAuthority: 'Neither legacy column is V2 balance truth; candidate values are independently authored.'
  },
  fixedSimulationHz: 60,
  sourceAtlasContract: { cellWidth: 448, cellHeight: 448, baselineY: 382, sourceFacing: 'right', anchor: 'bottom_center' },
  sheets: sheets.map((sheet) => ({
    id: sheet.id, atlas: sheet.atlas, source: sheet.source, grid: { columns: sheet.columns, rows: sheet.rows },
    frameCounts: sheet.frameCounts, runtimeFrameCounts: sheet.runtimeFrameCounts || sheet.frameCounts,
    note: sheet.id === 'air_normals' ? 'Legacy runtime scale 1.55 is an atlas correction and is not portable physical metadata.' : sheet.id === 'end_states' ? 'Ground-state atlas count reconciled as three; runtime exposes one.' : null
  })),
  animations: animationAudit,
  missingV2Coverage: ['turn', 'stand_to_crouch', 'crouch_to_stand', 'landing_authored', 'launch_reaction_dedicated', 'grab_startup_art', 'grab_connect_art', 'grab_whiff_art', 'forward_throw_art', 'back_throw_art', 'victim_throw_rows', 'throw_recovery_art'],
  globalFindings: [
    'No per-frame V1 root or collision tracks were recovered.',
    'Legacy movement/reactions use a global 8 fps loop and do not consistently reset on state entry.',
    'Legacy grab snaps the victim and is not reusable as the V2 universal throw.',
    'Current retired Lamuh Engine V2 fixture is excluded from art, timing, and combat authority.'
  ]
};

const timingCandidateRows = {
  standing_light: { frames: 4, historicalTicks: 15, contact: [2], A: [[2, 5, 5], [1, 1, 5, 5]], B: [[3, 5, 6], [2, 1, 5, 6]], C: [[4, 6, 6], [3, 1, 6, 6]] },
  standing_medium: { frames: 8, historicalTicks: 21, contact: [3, 4], A: [[5, 6, 9], [2, 2, 1, 3, 3, 2, 3, 4]], B: [[6, 6, 11], [3, 2, 1, 3, 3, 3, 4, 4]], C: [[7, 7, 12], [4, 2, 1, 4, 3, 3, 4, 5]], note: 'Visible punch/kick parity blocks approval until human review.' },
  standing_heavy: { frames: 7, historicalTicks: 31, contact: [3], A: [[9, 5, 18], [4, 3, 2, 5, 4, 6, 8]], B: [[11, 5, 21], [5, 4, 2, 5, 5, 7, 9]], C: [[13, 6, 23], [6, 4, 3, 6, 6, 8, 9]], note: 'Heavy alternate preserves strike acceleration and exposes anticipation/recovery.' },
  crouching_light: { frames: 4, historicalTicks: 14, contact: [2], A: [[2, 4, 6], [1, 1, 4, 6]], B: [[3, 4, 7], [2, 1, 4, 7]], C: [[4, 5, 7], [3, 1, 5, 7]], note: 'V1 aliases standing-light artwork; dedicated crouch art remains manual debt.' },
  crouching_medium: { frames: 8, historicalTicks: 19, contact: [3, 4], A: [[5, 5, 9], [2, 2, 1, 3, 2, 2, 3, 4]], B: [[6, 5, 11], [3, 2, 1, 3, 2, 3, 4, 4]], C: [[7, 6, 12], [4, 2, 1, 3, 3, 3, 4, 5]], note: 'V1 aliases standing-medium artwork; dedicated crouch art remains manual debt.' },
  crouching_heavy: { frames: 7, historicalTicks: 31, contact: [3], A: [[8, 5, 19], [4, 2, 2, 5, 5, 6, 8]], B: [[10, 5, 22], [5, 3, 2, 5, 6, 7, 9]], C: [[12, 6, 25], [6, 4, 2, 6, 7, 8, 10]] },
  air_light: { frames: 4, historicalTicks: 12, contact: [2], A: [[2, 5, 4], [1, 1, 5, 4]], B: [[3, 5, 5], [2, 1, 5, 5]], C: [[4, 5, 6], [3, 1, 5, 6]] },
  air_medium: { frames: 6, historicalTicks: 19, contact: [2, 3], A: [[5, 6, 8], [3, 2, 3, 3, 3, 5]], B: [[6, 6, 9], [4, 2, 3, 3, 4, 5]], C: [[7, 7, 10], [5, 2, 4, 3, 4, 6]] },
  air_heavy: { frames: 7, historicalTicks: 26, contact: [3], A: [[7, 5, 15], [3, 2, 2, 5, 3, 5, 7]], B: [[8, 5, 17], [4, 2, 2, 5, 4, 6, 7]], C: [[10, 6, 19], [5, 3, 2, 6, 5, 7, 7]] },
  ascend_step: { frames: 7, historicalTicks: 30, contact: [3], A: [[5, 6, 15], [2, 2, 1, 6, 4, 5, 6]], B: [[6, 6, 18], [3, 2, 1, 6, 5, 6, 7]], C: [[8, 7, 19], [4, 3, 1, 7, 5, 7, 7]] }
};
const reconstructedHistoricalExposures = (durationTicks, frameCount) => {
  const counts = Array(frameCount).fill(0);
  for (let tick = 0; tick < durationTicks; tick++) counts[Math.min(frameCount - 1, Math.floor((tick * frameCount) / durationTicks))]++;
  return counts;
};
const timingMoves = Object.entries(timingCandidateRows).map(([moveId, row]) => ({
  moveId, sourceFrameCount: row.frames, contactSourceFrames: row.contact,
  v1Historical: {
    durationTicks: row.historicalTicks,
    exposureTicks: reconstructedHistoricalExposures(row.historicalTicks, row.frames),
    durationEvidence: 'RECOVERED_HISTORICAL_V1_GAMEPLAY_DEFINITION',
    exposureEvidence: 'DETERMINISTIC_RECONSTRUCTION_FROM_RECOVERED_DURATION_AND_SOURCE_FRAME_COUNT',
    contactTick: null,
    note: 'Per-pose V1 exposure and frame-indexed contact were not stored; the exact recovered total duration is shown with a clearly labeled linear frame-map reconstruction.'
  },
  candidates: Object.fromEntries(['A', 'B', 'C'].map((candidate) => {
    const [phaseTicks, exposureTicks] = row[candidate];
    const durationTicks = exposureTicks.reduce((sum, value) => sum + value, 0);
    if (durationTicks !== phaseTicks.reduce((sum, value) => sum + value, 0)) throw new Error(`${moveId} ${candidate} phase/exposure mismatch`);
    return [candidate, {
      label: candidate === 'A' ? 'CURRENT_LEGACY_RUNTIME_RHYTHM' : candidate === 'B' ? 'SLIGHTLY_SLOWER_RECOMMENDED' : 'HEAVIER_ALTERNATE',
      phaseTicks: { startup: phaseTicks[0], active: phaseTicks[1], recovery: phaseTicks[2] }, durationTicks,
      exposureTicks, preservesSourceFrameOrder: true, duplicateMeaninglessFrames: false
    }];
  })),
  recommendedCandidate: 'B', humanReviewStatus: null, note: row.note || null
}));
const timingCandidates = {
  schemaVersion: '1.0.0', simulationHz: 60, durationPolicy: 'INDEPENDENTLY_AUTHORED_PER_MOVE',
  defaultGameplayVisualAlignment: true, blanketDurationMultiplier: null, moves: timingMoves
};

const comparisonClips = [
  ['idle', [8, 7, 8, 7, 8, 7, 8, 7], [8, 8, 8, 8, 7, 7, 7, 7]],
  ['walk_forward', [8, 7, 8, 7, 8, 7], [3, 3, 3, 3, 3, 3]],
  ['walk_backward', [8, 7, 8, 7, 8, 7], [3, 3, 3, 3, 3, 3]],
  ['dash_forward', [8, 7, 8, 7, 8, 7], [3, 3, 3, 3, 3, 3]],
  ['dash_backward', [8, 7, 8, 7, 8, 7], [4, 4, 3, 3, 3, 3]],
  ['crouch', [8, 7, 8, 7], [2, 2, 2, 2]],
  ['jump', [8, 7, 8, 7], [3, 3, 3, 3]],
  ['air_dash_forward', [8, 7, 8, 7, 8, 7], [2, 2, 2, 3, 3, 2]],
  ['air_dash_backward', [8, 7, 8, 7, 8, 7], [2, 2, 3, 3, 4]],
  ['standing_block', [8, 7, 8, 7], [4, 4, 4, 4]],
  ['light_reaction', [8, 7, 8, 7, 8], [3, 3, 3, 3, 3]]
].map(([clipId, v1ExposureTicks, v2ExposureTicks]) => ({
  clipId,
  sourceFrameCount: v1ExposureTicks.length,
  v1Historical: {
    durationTicks: v1ExposureTicks.reduce((sum, value) => sum + value, 0), exposureTicks: v1ExposureTicks,
    durationEvidence: 'RECOVERED_LEGACY_GLOBAL_8_FPS_PRESENTATION_CLOCK', exposureEvidence: '60_HZ_INTEGER_EXPOSURE_RECONSTRUCTION_OF_8_FPS',
    contactTick: null, note: 'Legacy movement and reaction loops were clock-driven and did not consistently reset on state entry.'
  },
  v2Candidate: {
    label: 'V2_FIRST_PLAYABLE_AUTHORED_EXPOSURES', durationTicks: v2ExposureTicks.reduce((sum, value) => sum + value, 0), exposureTicks: v2ExposureTicks
  },
  humanReviewStatus: null
}));
const runtimeTimelines = Object.fromEntries([
  ...timingMoves.map((move) => [move.moveId, { exposureTicks: move.candidates.B.exposureTicks, durationTicks: move.candidates.B.durationTicks, contactSourceFrames: move.contactSourceFrames, contactTick: move.candidates.B.phaseTicks.startup }]),
  ...comparisonClips.map((clip) => [clip.clipId, { exposureTicks: clip.v2Candidate.exposureTicks, durationTicks: clip.v2Candidate.durationTicks, contactSourceFrames: [], contactTick: null }])
]);

const throws = {
  schemaVersion: '1.0.0', technicalStatus: 'DETERMINISTIC_MECHANICS_CANDIDATE', humanReviewStatus: null, artStatus: 'BLOCKED_MANUAL_ART', simulationHz: 60,
  victimClass: 'standard_humanoid', globalVictimScale: false,
  forwardThrow: { startup: 4, connectTick: 4, releaseTick: 14, totalTicks: 32, damage: 70, humanReviewStatus: null, physicalTrackRequired: true },
  backThrow: { startup: 4, connectTick: 4, releaseTick: 16, totalTicks: 36, damage: 75, humanReviewStatus: null, physicalTrackRequired: true },
  artTruth: 'No legacy grab/throw source art exists. The first-playable uses preserved Lamuh source poses plus a deterministic victim track only as a mechanics and timing candidate.',
  futureVictimClasses: ['small', 'large', 'non_humanoid', 'extreme_proportion']
};

const firstPlayable = {
  schemaVersion: '1.0.0', characterId: 'lamuh_legacy_v2', candidateOnly: true, deployable: false, selectableProductionRoster: false,
  technicalStatus: 'TECHNICALLY_VALIDATED_LOCAL_CANDIDATE', humanReviewStatus: null, productionApproved: false, simulationHz: 60, timingCandidate: 'B',
  coverage: {
    movement: ['idle', 'walk_forward', 'walk_backward', 'dash_forward', 'dash_backward', 'crouch', 'jump', 'air_dash_forward', 'air_dash_backward'],
    defense: ['standing_block', 'light_reaction'],
    groundNormals: ['standing_light', 'standing_medium', 'standing_heavy', 'crouching_light', 'crouching_medium', 'crouching_heavy'],
    airNormals: ['air_light'], specials: ['ascend_step'], grabs: ['universal_grab_startup', 'grab_connect', 'grab_whiff', 'forward_throw', 'back_throw', 'throw_recovery']
  },
  knownArtDebt: ['universal grab, connect/whiff, both throws, and throw recovery lack dedicated attacker art (BLOCKED_MANUAL_ART)', 'standard-height victim is procedural', 'turn, stand-to-crouch, crouch-to-stand, and landing lack dedicated authored rows', 'launch reaction lacks a dedicated authored row', 'all modern movement and ground-normal artwork remains candidate-only pending the combined human scale/motion gate', 'approved high-resolution style direction is represented by one non-runtime Standing Heavy checkpoint with targeted normalization and full-sequence debt'],
  reviewQuestions: ['Did V2 retain or improve V1 smoothness?', 'Are attacks still too fast?', 'Are state entries and exits natural?', 'Does the standard grab feel physical and readable?', 'Did Lamuh keep his animation identity?']
};

const styleCandidateSource = path.join(styleReviewRoot, 'standing-heavy-contact-style-candidate-v2.png');
if (!fs.existsSync(styleCandidateSource)) throw new Error(`Missing Lamuh style checkpoint: ${styleCandidateSource}`);
if (!fs.existsSync(styleApprovalPath)) throw new Error(`Missing human style approval receipt: ${styleApprovalPath}`);
const styleApproval = JSON.parse(fs.readFileSync(styleApprovalPath, 'utf8'));
if (styleApproval.decision !== 'APPROVED_WITH_TARGETED_REPAIR') throw new Error(`Unsupported Lamuh style approval decision: ${styleApproval.decision}`);
if (path.resolve(path.dirname(styleApprovalPath), styleApproval.approvedAsset.path) !== path.resolve(styleCandidateSource)) throw new Error('Style approval asset path mismatch');
if (styleApproval.approvedAsset.sha256 !== sha256(styleCandidateSource)) throw new Error('Style approval asset hash mismatch');
if (styleApproval.approvalBoundary.runtimeArtApproved || styleApproval.approvalBoundary.productionApproved || styleApproval.approvalBoundary.deployable) {
  throw new Error('Style approval receipt exceeds the human-approved checkpoint scope');
}
const styleCheckpoint = {
  schemaVersion: '1.0.0',
  title: 'Standing Heavy contact · new-game style checkpoint',
  candidateOnly: true, deployable: false, productionApproved: false, humanReviewStatus: styleApproval.decision,
  approvedAt: styleApproval.approvedAt, approvalScope: styleApproval.approvalScope,
  approvalReceipt: 'records/style-checkpoint-v1.approval.json',
  artStatus: 'APPROVED_WITH_TARGETED_REPAIR', sourceMove: 'standing_heavy', sourceFrame: 3,
  sourcePath: 'engine_v2/content-source/characters/lamuh-legacy-v2/source-frames/standing_heavy/standing_heavy_03.png',
  styleReferencePath: 'tools/nga-forge/production/characters/swahili/source-frames/approved/standing-heavy-key-poses/standing_heavy_impact_v2.png',
  reviewAssetPath: relative(styleCandidateSource), publicPath: '/lamuh-legacy-v2/style/standing-heavy-contact-style-candidate-v2.png',
  generatedWith: 'OpenAI image generation · edit/style transfer with protected Lamuh identity and pose references',
  sourceDimensions: { width: 448, height: 448 }, candidateDimensions: pngDimensions(styleCandidateSource),
  alphaAudit: { genuineTransparency: true, cornerAlpha: 0, fullyOpaquePixels: 0, partialAlphaPixels: 580384, alphaZeroRgbResiduePixels: 773832, topEdgeVisiblePixels: 6, backgroundResidueRequiresIsolation: true },
  purpleFringeAudit: { sourceMagentaPercent: 3.7161, candidateMagentaPercent: 0.000544, candidateMagentaPixels: 3, normalizedSequencePolicy: 'zero_meaningful_magenta_after_dark_ink_neutralization' },
  preservationIntent: ['same high-kick contact idea', 'same body-driven momentum', 'same skin tone, facial identity, hair, tunic, pants, wraps, shoes and gold accents', 'no purple outline'],
  knownDebt: ['approved original remains an immutable style-direction checkpoint, not runtime art', 'original carries partial-alpha backdrop residue and six top-edge pixels; the closure sequence uses a separate hash-bound isolation and padding repair', 'manual cross-frame identity, motion and silhouette review remains required']
};

fs.mkdirSync(contentRoot, { recursive: true });
writeJson(path.join(contentRoot, 'source-audit.v1.json'), sourceAudit);
writeJson(path.join(contentRoot, 'timing-candidates.v1.json'), timingCandidates);
writeJson(path.join(contentRoot, 'throws.standard-humanoid.v1.json'), throws);
writeJson(path.join(contentRoot, 'first-playable.bundle.json'), firstPlayable);
writeJson(path.join(contentRoot, 'style-checkpoint.v1.json'), styleCheckpoint);

const identityMarkdown = `# Lamuh Legacy V2 combat identity — candidate\n\nStatus: **PENDING HUMAN APPROVAL**. This proposal preserves the strongest identity supported by the legacy kit and does not redefine him as Swahili.\n\n- Preferred range: close-to-mid range, with a light projectile check and burst movement to enter.\n- Mobility: above-average grounded and air mobility; momentum is part of the character, not cosmetic drift.\n- Pressure style: short, readable strings into a small legacy-special family; deliberate recovery prevents unstructured spam.\n- Combo identity: body-driven normals into Ascend Step/Heaven Splitter routes, with launch and air follow-up rather than long autonomous sequences.\n- Defensive strengths: evasive repositioning and reliable air control.\n- Primary weaknesses: whiff recovery, linear committed movement, modest damage without confirmed routes, and limited long-range control.\n- Meter usage: movement extension, confirm conversion, and defensive reset; ultimate deferred until the core fighter passes review.\n- Signature movement: forward commitment, rising attack arcs, sharp directional redirection, and continuous coat/hair follow-through.\n- Signature attack qualities: readable anticipation, fast strike acceleration, exposed impact, connected recovery, restrained squash/stretch, and clean silhouettes.\n\n## Proposed concise V2 identity\n\nA mobile celestial rush fighter who wins by carrying body momentum through short confirms and legacy signature movement. He should feel quick and fluid, but not frictionless: the strike remains fast while anticipation, contact, follow-through, and recovery are readable.\n\n## Move classification\n\n- Celestial Palm — PRESERVE_WITH_V2_COMBAT_UPDATE\n- Ascend Step — PRESERVE_WITH_RETIMING and explicit V2 root/collision\n- Heaven Splitter — PRESERVE_WITH_RETIMING and launch-state update\n- Divine Vanish — MODERNIZE while preserving smear/afterimage language\n- Radiant Dive — PRESERVE_WITH_V2_COMBAT_UPDATE\n- Ground Light — PRESERVE_WITH_RETIMING\n- Ground Medium/Heavy — MODERNIZE from existing poses after hit-count-parity review\n- Air normals — PRESERVE_WITH_RETIMING after contact review\n- Blocks/reactions/knockdown — PRESERVE_WITH_V2_COMBAT_UPDATE\n- Crown/ultimate — DEFERRED_NOT_BLOCKING due to mixed provenance and incomplete routing\n`;
fs.writeFileSync(path.join(contentRoot, 'COMBAT_IDENTITY.md'), identityMarkdown, 'utf8');

const readme = `# Lamuh Legacy V2 candidate source\n\nThis is a non-deployable first-playable candidate. The protected V1 images remain byte-identical in their original locations. The retired \`characters/lamuh\` motion fixture is historical test data and is not a source for this rebuild.\n\nAuthoritative candidate records:\n\n- \`source-lock.v1.json\` — immutable V1 source, atlas, VFX, and legacy \`game.js\` hashes.\n- \`source-audit.v1.json\` — source-of-truth motion/gameplay inventory with historical and current-Legacy columns.\n- \`timing-candidates.v1.json\` — independent A/B/C exposure and phase candidates.\n- \`throws.standard-humanoid.v1.json\` — deterministic standard-height victim contract.\n- \`first-playable.bundle.json\` — current milestone coverage and known debt.\n- \`style-checkpoint.v1.json\` — hash-bound visual-direction checkpoint.\n- \`records/style-checkpoint-v1.approval.json\` — human approval of the style direction with targeted repair; it does not approve runtime art or production.\n- \`COMBAT_IDENTITY.md\` — human-review identity proposal.\n\nNo record in this folder is a production approval.\n`;
fs.writeFileSync(path.join(contentRoot, 'README.md'), readme, 'utf8');

for (const sheet of sheets) {
  const sourcePath = path.join(gameRoot, sheet.atlas);
  const targetPath = path.join(publicRoot, 'atlases', path.basename(sheet.atlas));
  fs.mkdirSync(path.dirname(targetPath), { recursive: true });
  fs.copyFileSync(sourcePath, targetPath);
  if (sha256(sourcePath) !== sha256(targetPath)) throw new Error(`Public copy hash mismatch: ${sheet.id}`);
}
const stylePublicTarget = path.join(publicRoot, 'style', path.basename(styleCandidateSource));
fs.mkdirSync(path.dirname(stylePublicTarget), { recursive: true });
fs.copyFileSync(styleCandidateSource, stylePublicTarget);
if (sha256(styleCandidateSource) !== sha256(stylePublicTarget)) throw new Error('Lamuh style checkpoint public copy hash mismatch');
writeJson(path.join(publicRoot, 'review-data.json'), { sourceLock, sourceAudit, timingCandidates, comparisonClips, runtimeTimelines, throws, firstPlayable, styleCheckpoint });
writeJson(path.join(generatedRoot, 'lamuh-legacy-v2.first-playable.runtime.json'), {
  generatedBy: 'build_lamuh_legacy_v2_candidate.js', sourceDigest: sha256(path.join(contentRoot, 'first-playable.bundle.json')),
  candidateOnly: true, deployable: false, characterId: 'lamuh_legacy_v2', simulationHz: 60,
  timingCandidate: 'B', assetNamespace: '/lamuh-legacy-v2/atlases', coverage: firstPlayable.coverage
});

console.log(`Built Lamuh Legacy V2 candidate audit: ${animationAudit.length} canonical animations, ${sourceArtifacts.length} protected artifacts, ${timingMoves.length} timing candidates.`);
