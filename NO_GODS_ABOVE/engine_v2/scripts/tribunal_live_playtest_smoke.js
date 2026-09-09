#!/usr/bin/env node
const assert = require('assert');
const crypto = require('crypto');
const { chromium } = require('playwright');
const { spawn } = require('child_process');
const fs = require('fs');
const net = require('net');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const REPO_ROOT = path.resolve(ROOT, '..', '..');
const OUT_DIR = path.join(ROOT, 'docs', 'tribunal_live_playtest', 'captures');
const REPORT_PATH = path.join(ROOT, 'docs', 'tribunal_live_playtest', 'browser_report.json');
const VITE_BIN = path.join(ROOT, 'node_modules', 'vite', 'bin', 'vite.js');
const LEGACY_GAME_HASH = 'D081DA2D907CF6ABD978301C1637008B26CCB30B47E2CCAFCA3FEA3331910C6B';
const CAPTURES = [
  'idle_center', 'left_corner', 'right_corner', 'jump_camera_placeholder',
  'standing_heavy_hit', 'standing_block', 'heavy_hit_reaction'
];
const CAPTURE_FILENAMES = {
  idle_center: 'center_stage.png',
  left_corner: 'left_corner.png',
  right_corner: 'right_corner.png',
  jump_camera_placeholder: 'jump_framing.png',
  standing_heavy_hit: 'standing_heavy.png',
  standing_block: 'block_reaction.png',
  heavy_hit_reaction: 'hit_reaction.png'
};

fs.mkdirSync(OUT_DIR, { recursive: true });
const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
const availablePort = () => new Promise((resolve, reject) => {
  const server = net.createServer();
  server.once('error', reject);
  server.listen(0, '127.0.0.1', () => {
    const address = server.address();
    const port = typeof address === 'object' && address ? address.port : 0;
    server.close(() => resolve(port));
  });
});

async function waitForServer(url) {
  for (let index = 0; index < 100; index++) {
    try {
      const response = await fetch(url);
      if (response.ok && (await response.text()).includes('The Last Tribunal Actual Graybox')) return;
    } catch (_) {}
    await wait(250);
  }
  throw new Error(`Timed out waiting for ${url}`);
}

async function stopServer(server) {
  if (!server || server.exitCode !== null) return;
  server.kill('SIGTERM');
  await Promise.race([new Promise((resolve) => server.once('exit', resolve)), wait(3000)]);
  if (server.exitCode === null) server.kill('SIGKILL');
}

function assertStageSnapshot(snapshot, scenario) {
  assert.strictEqual(snapshot.routeIdentity, 'swahili_sandbox_x_the_last_tribunal_graybox');
  assert.strictEqual(snapshot.tribunalLivePlaytestRoute, true);
  assert.strictEqual(snapshot.stageStatus, 'production_arena_live_playtest_candidate');
  assert.strictEqual(snapshot.stageApprovalState, 'awaiting_actual_tribunal_graybox_integration');
  assert.strictEqual(snapshot.arena.status, 'production_arena_live_playtest_candidate');
  assert.strictEqual(snapshot.arena.deployable, false);
  assert.strictEqual(snapshot.arena.approvalState, 'awaiting_actual_tribunal_graybox_integration');
  assert.strictEqual(snapshot.arena.arenaId, 'the_last_tribunal');
  assert.strictEqual(snapshot.arena.presentation.presentationId, 'actual_graybox_v1');
  assert.strictEqual(snapshot.arena.presentation.sceneConfigPath, 'stage-production/arenas/the_last_tribunal/graybox/actual_graybox_v1.scene.json');
  assert.strictEqual(snapshot.arena.presentation.rendererEntryPoint, 'src/graybox/actualTribunalGrayboxRenderer.ts');
  assert.strictEqual(snapshot.arena.presentation.genericFallbackRendered, false);
  assert.strictEqual(snapshot.status, 'preview-only');
  assert.strictEqual(snapshot.candidateOnly, true);
  assert.strictEqual(snapshot.deployable, false);
  assert.strictEqual(snapshot.productionRoster, false);
  assert.strictEqual(snapshot.authority.simulation, 'deterministic_60hz');
  assert.strictEqual(snapshot.authority.renderingMayAffectGameplay, false);
  assert.strictEqual(snapshot.arena.authority.renderingMayAffectGameplay, false);
  assert.strictEqual(snapshot.arena.authority.fighterPlaneZ, 0);
  assert.strictEqual(snapshot.arena.diagnostics.enabled, true);
  assert.deepStrictEqual(snapshot.arena.diagnostics.worldBounds, [-8.4, 8.4]);
  assert.deepStrictEqual(snapshot.arena.diagnostics.cameraClampX, [-7.8, 7.8]);
  assert.deepStrictEqual(snapshot.arena.diagnostics.spawnWorldX, [-1.52, 1.52]);
  assert.deepStrictEqual(snapshot.arena.diagnostics.parallaxZ, { foreground: 3.2, fighter: 0, midground: -7, background: -15 });
  assert.strictEqual(snapshot.arena.diagnostics.actualTribunalGeometryLoaded, true);
  for (const role of ['matte_tribunal_floor', 'fighter_shadow_receiver', 'central_dais', 'courthouse_architectural_masses', 'rear_gallery_depth', 'foreground_architectural_frame', 'midground_court_structures', 'background_oculus_wall', 'eclipsed_sky_placeholder', 'cathedral_red_banner_masses', 'boundary_pylons']) {
    assert.ok(snapshot.arena.diagnostics.loadedGeometryRoles.includes(role), `${scenario} missing ${role}`);
  }
  assert.strictEqual(snapshot.arena.diagnostics.cinematicVolumes.length, 5);
  assert.strictEqual(snapshot.arena.resources.webgl2, true);
  assert.ok(snapshot.arena.resources.drawCalls > 0, `${scenario} reported no stage draw calls`);
  assert.strictEqual(snapshot.arena.resources.realTimeShadowCasters, 0);
  assert.strictEqual(snapshot.arena.resources.stageTextures, 0);
  assert.strictEqual(snapshot.arena.resources.conceptBoardRuntimeDependency, false);
  assert.strictEqual(snapshot.arena.resources.loadError, null);
  assert.strictEqual(snapshot.fighterScale, 0.0033);
  assert.strictEqual(snapshot.backwardWalk.complete, false);
  assert.strictEqual(snapshot.backwardWalk.missingRoles, 3);
  for (const fighter of Object.values(snapshot.arena.fighters)) {
    assert.ok(fighter.rootAlignmentError <= 1e-9, `${scenario} root alignment drift`);
    assert.ok(fighter.shadowXError <= 1e-9, `${scenario} shadow alignment drift`);
    assert.strictEqual(fighter.root[2], 0, `${scenario} fighter left Z=0 presentation plane`);
  }
}

async function main() {
  const port = await availablePort();
  const url = `http://127.0.0.1:${port}/tribunal-playtest.html?capture=1`;
  const server = spawn(process.execPath, [VITE_BIN, '--host', '127.0.0.1', '--port', String(port), '--strictPort'], {
    cwd: ROOT, stdio: ['ignore', 'pipe', 'pipe'], windowsHide: true
  });
  const serverLogs = [];
  server.stdout.on('data', (data) => serverLogs.push(data.toString()));
  server.stderr.on('data', (data) => serverLogs.push(data.toString()));
  let browser;
  try {
    await waitForServer(url);
    browser = await chromium.launch({ headless: true });
    const genericPage = await browser.newPage({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1 });
    await genericPage.goto(`http://127.0.0.1:${port}/sandbox.html?capture=1`, { waitUntil: 'domcontentloaded', timeout: 60000 });
    await genericPage.waitForFunction(() => !!window.__NGA_SWAHILI_SANDBOX__, null, { timeout: 60000 });
    await genericPage.evaluate(() => window.__NGA_SWAHILI_SANDBOX__.ready);
    const genericSnapshot = await genericPage.evaluate(() => {
      const api = window.__NGA_SWAHILI_SANDBOX__;
      api.setDiagnostics(false);
      api.runScenario('idle_center');
      api.renderer.renderer.getContext().finish();
      return api.snapshot();
    });
    assert.strictEqual(genericSnapshot.arena.presentation.presentationId, 'generic_sandbox_presentation_v1');
    assert.strictEqual(genericSnapshot.arena.presentation.genericFallbackRendered, true);
    await genericPage.locator('#viewport').screenshot({ path: path.join(OUT_DIR, 'comparison_generic_sandbox.png') });
    await genericPage.close();
    const page = await browser.newPage({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1 });
    const consoleErrors = [];
    page.on('console', (message) => { if (message.type() === 'error') consoleErrors.push(message.text()); });
    page.on('pageerror', (error) => consoleErrors.push(error.message));
    await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 60000 });
    await page.waitForFunction(() => !!window.__NGA_TRIBUNAL_PLAYTEST__, null, { timeout: 60000 });
    await page.evaluate(() => window.__NGA_TRIBUNAL_PLAYTEST__.ready);

    await page.evaluate(() => {
      const api = window.__NGA_TRIBUNAL_PLAYTEST__;
      api.setDiagnostics(false);
      api.runScenario('idle_center');
      api.renderer.renderer.getContext().finish();
    });
    await page.locator('#viewport').screenshot({ path: path.join(OUT_DIR, 'comparison_actual_tribunal_graybox.png') });
    await page.evaluate(() => {
      const api = window.__NGA_TRIBUNAL_PLAYTEST__;
      api.setDiagnostics(true);
      api.runScenario('idle_center');
      api.renderer.renderer.getContext().finish();
    });
    await page.locator('#viewport').screenshot({ path: path.join(OUT_DIR, 'diagnostics_active_arena_renderer.png') });

    await page.evaluate((scenarios) => {
      const api = window.__NGA_TRIBUNAL_PLAYTEST__;
      const gl = api.renderer.renderer.getContext();
      for (const scenario of scenarios) { api.runScenario(scenario); api.snapshot(); gl.finish(); }
      api.reset();
    }, CAPTURES);

    const snapshots = {};
    const viewport = page.locator('#viewport');
    for (const scenario of CAPTURES) {
      snapshots[scenario] = await page.evaluate((id) => {
        const api = window.__NGA_TRIBUNAL_PLAYTEST__;
        api.setDiagnostics(true);
        api.runScenario(id);
        for (let pass = 0; pass < 4; pass++) api.snapshot();
        api.renderer.renderer.getContext().finish();
        return api.snapshot();
      }, scenario);
      await page.evaluate(() => window.__NGA_TRIBUNAL_PLAYTEST__.setDiagnostics(false));
      await viewport.screenshot({ path: path.join(OUT_DIR, CAPTURE_FILENAMES[scenario]) });
      await page.evaluate(() => window.__NGA_TRIBUNAL_PLAYTEST__.setDiagnostics(true));
      assertStageSnapshot(snapshots[scenario], scenario);
    }

    const gameplayScenarios = await page.evaluate(() => {
      const api = window.__NGA_TRIBUNAL_PLAYTEST__;
      const ids = [
        'forward_walk', 'backward_walk', 'walk_reversal', 'crouch', 'standing_block', 'crouching_block',
        'standing_heavy_whiff', 'standing_heavy_block', 'light_hit_reaction', 'side_switch', 'mirrored_facing'
      ];
      return Object.fromEntries(ids.map((id) => [id, api.runScenario(id)]));
    });
    for (const [id, snapshot] of Object.entries(gameplayScenarios)) assertStageSnapshot(snapshot, id);

    assert.match(gameplayScenarios.backward_walk.fighters.p1.fallbackWarning, /MISSING walk_backward_first_up/);
    assert.strictEqual(snapshots.standing_heavy_hit.lastEvent.outcome, 'hit');
    assert.strictEqual(gameplayScenarios.standing_heavy_block.lastEvent.outcome, 'block');
    assert.strictEqual(gameplayScenarios.standing_heavy_whiff.lastEvent.outcome, 'whiff');
    assert.strictEqual(gameplayScenarios.standing_block.fighters.p1.fighterState, 'standing_block');
    assert.strictEqual(gameplayScenarios.crouching_block.fighters.p1.fighterState, 'crouching_block');
    assert.strictEqual(gameplayScenarios.light_hit_reaction.fighters.p2.fighterState, 'light_hit_reaction');
    assert.ok(snapshots.left_corner.fighters.p1.rootPosition[0] < -400);
    assert.ok(snapshots.right_corner.fighters.p2.rootPosition[0] > 400);
    assert.deepStrictEqual([gameplayScenarios.side_switch.fighters.p1.facing, gameplayScenarios.side_switch.fighters.p2.facing], [-1, 1]);
    assert.strictEqual(gameplayScenarios.mirrored_facing.fighters.p1.mirrored, true);
    assert.strictEqual(gameplayScenarios.mirrored_facing.fighters.p2.mirrored, false);

    const deterministicReplay = await page.evaluate(() => {
      const api = window.__NGA_TRIBUNAL_PLAYTEST__;
      const replay = () => {
        api.reset();
        api.step({ right: true }, 12);
        api.step({}, 1);
        api.step({ left: true }, 9);
        api.step({}, 1);
        api.step({ heavy: true }, 1);
        api.step({}, 90);
        return api.snapshot().checksum;
      };
      return [replay(), replay()];
    });
    assert.strictEqual(deterministicReplay[0], deterministicReplay[1]);

    const presentationAuthority = await page.evaluate(() => {
      const api = window.__NGA_TRIBUNAL_PLAYTEST__;
      api.reset();
      const before = api.snapshot().checksum;
      for (const mode of ['hit_sparks', 'projectile', 'large_beam', 'all', 'off']) api.setVfxStudy(mode);
      for (let frame = 0; frame < 30; frame++) api.renderer.render(api.state);
      const after = api.snapshot().checksum;
      api.setVfxStudy('all');
      const effects = api.snapshot().arena.effects;
      return { before, after, effects };
    });
    assert.strictEqual(presentationAuthority.before, presentationAuthority.after, 'presentation changed authoritative simulation');
    assert.deepStrictEqual(presentationAuthority.effects, {
      studyMode: 'all', beam: true, projectile: true, hitSparks: true, muzzleFlashes: true, darkSilhouettePlaceholder: false
    });
    assert.deepStrictEqual(consoleErrors, []);

    const geometryEvidence = await page.evaluate(() => {
      const api = window.__NGA_TRIBUNAL_PLAYTEST__;
      const names = ['matte_tribunal_floor', 'dais_front', 'judgment_bench', 'gallery_left_tier_1', 'gallery_right_tier_4', 'central_eclipse_void', 'cathedral_red_banner_1', 'foreground_left', 'boundary_pylon_left'];
      return Object.fromEntries(names.map((name) => [name, !!api.renderer.scene.getObjectByName(name)]));
    });
    assert.ok(Object.values(geometryEvidence).every(Boolean), `missing actual Tribunal objects: ${JSON.stringify(geometryEvidence)}`);

    const parallaxEvidence = await page.evaluate(() => {
      const api = window.__NGA_TRIBUNAL_PLAYTEST__;
      const sample = () => Object.fromEntries(['foreground', 'midground', 'background'].map((id) => {
        const object = api.renderer.scene.getObjectByName(`parallax_anchor_${id}`);
        const point = object.position.clone();
        return [id, point.project(api.renderer.camera).x];
      }));
      api.runScenario('idle_center');
      const center = sample();
      api.runScenario('left_corner');
      const corner = sample();
      return { center, corner, delta: Object.fromEntries(Object.keys(center).map((id) => [id, Math.abs(corner[id] - center[id])])) };
    });
    assert.ok(parallaxEvidence.delta.foreground > parallaxEvidence.delta.midground, 'foreground parallax did not exceed midground');
    assert.ok(parallaxEvidence.delta.midground > parallaxEvidence.delta.background, 'midground parallax did not exceed background');

    const cinematicEvidence = await page.evaluate(() => {
      const api = window.__NGA_TRIBUNAL_PLAYTEST__;
      api.reset();
      api.renderer.startCinematic('command_grab', 'p1', api.state, 37);
      api.step({}, 1);
      const snapshot = api.snapshot().arena;
      api.renderer.snapCamera(api.state);
      return { activeVolume: snapshot.activeCinematicVolume, activeContext: snapshot.camera.active.context, authoredDurationTicks: snapshot.camera.active.durationTicks };
    });
    assert.deepStrictEqual(cinematicEvidence, { activeVolume: 'close_combat', activeContext: 'command_grab', authoredDurationTicks: 37 });

    const performanceEvidence = await page.evaluate(() => {
      const api = window.__NGA_TRIBUNAL_PLAYTEST__;
      api.setDiagnostics(false);
      api.runScenario('idle_center');
      const clean = api.snapshot().arena.resources;
      const frameTiming = api.renderer.benchmark(api.state, 90);
      api.setDiagnostics(true);
      const diagnostic = api.snapshot().arena.resources;
      return { clean, diagnostic, frameTiming };
    });
    assert.ok(performanceEvidence.clean.drawCalls <= 80, `clean draw calls ${performanceEvidence.clean.drawCalls} exceed candidate total budget`);
    assert.ok(performanceEvidence.clean.triangles <= 35000, `clean triangles ${performanceEvidence.clean.triangles} exceed visible budget`);

    const legacyHash = crypto.createHash('sha256').update(fs.readFileSync(path.join(REPO_ROOT, 'NO_GODS_ABOVE', 'game.js'))).digest('hex').toUpperCase();
    assert.strictEqual(legacyHash, LEGACY_GAME_HASH);

    const report = {
      schemaVersion: '1.0.0-tribunal-live-playtest-report',
      status: 'production_arena_live_playtest_candidate',
      deployable: false,
      approvalState: 'awaiting_actual_tribunal_graybox_integration',
      automatedSmokeIsHumanApproval: false,
      route: '/tribunal-playtest.html',
      capturedAt: new Date().toISOString(),
      browser: { name: 'Chromium', version: await browser.version(), viewport: [1440, 900] },
      arenaId: 'the_last_tribunal',
      presentationId: 'actual_graybox_v1',
      sceneConfigPath: 'stage-production/arenas/the_last_tribunal/graybox/actual_graybox_v1.scene.json',
      rendererEntryPoint: 'src/graybox/actualTribunalGrayboxRenderer.ts',
      genericSandboxPresentationBypassed: true,
      scenarios: { captures: Object.keys(snapshots), gameplay: Object.keys(gameplayScenarios), comparison: ['comparison_generic_sandbox.png', 'comparison_actual_tribunal_graybox.png', 'diagnostics_active_arena_renderer.png'] },
      deterministicReplay,
      presentationAuthority,
      geometryEvidence,
      parallaxEvidence,
      cinematicEvidence,
      metrics: performanceEvidence.clean,
      diagnosticMetrics: performanceEvidence.diagnostic,
      frameTiming: performanceEvidence.frameTiming,
      diagnostics: snapshots.idle_center.arena.diagnostics,
      legacyGameSha256: legacyHash,
      consoleErrors,
      serverLogs: serverLogs.join('').split('\n').slice(0, 20)
    };
    fs.mkdirSync(path.dirname(REPORT_PATH), { recursive: true });
    fs.writeFileSync(REPORT_PATH, `${JSON.stringify(report, null, 2)}\n`);
    console.log(`The Last Tribunal live-playtest smoke passed at ${url}`);
    console.log(JSON.stringify({ status: report.status, approvalState: report.approvalState, captures: report.scenarios.captures.length, metrics: report.metrics, consoleErrors }, null, 2));
  } finally {
    if (browser) await browser.close();
    await stopServer(server);
  }
}

main().catch((error) => { console.error(error); process.exit(1); });
