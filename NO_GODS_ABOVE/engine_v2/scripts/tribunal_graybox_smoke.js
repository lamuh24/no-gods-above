#!/usr/bin/env node
const assert = require('assert');
const { chromium } = require('playwright');
const { spawn } = require('child_process');
const fs = require('fs');
const net = require('net');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const ARENA_ROOT = path.join(ROOT, 'stage-production', 'arenas', 'the_last_tribunal');
const OUT_DIR = path.join(ARENA_ROOT, 'graybox', 'captures');
const VITE_BIN = path.join(ROOT, 'node_modules', 'vite', 'bin', 'vite.js');
fs.mkdirSync(OUT_DIR, { recursive: true });

const STATIC_SCENARIOS = [
  'center_stage', 'left_corner', 'right_corner', 'p1_p2_spawn', 'side_switch', 'high_jump', 'crouch', 'knockdown',
  'swahili_idle', 'swahili_walk_forward', 'swahili_walk_backward', 'standing_heavy', 'standing_block',
  'light_hit_reaction', 'heavy_hit_reaction', 'large_beam', 'projectile', 'hit_sparks', 'bright_costume',
  'dark_costume', 'mirrored_fighters', 'contrast_study'
];
const CINEMATICS = [
  { id: 'command_grab_camera', context: 'command_grab', elapsed: 12, duration: 32 },
  { id: 'super_camera_move_authored_73', context: 'super', elapsed: 18, duration: 73 },
  { id: 'ultimate_camera', context: 'ultimate', elapsed: 20, duration: 60 },
  { id: 'round_finisher', context: 'round_finisher', elapsed: 16, duration: 48 },
  { id: 'intro_camera_move_authored_96', context: 'intro', elapsed: 22, duration: 96 },
  { id: 'victory_camera_move_authored_105', context: 'victory', elapsed: 28, duration: 105 }
];

function wait(ms) { return new Promise((resolve) => setTimeout(resolve, ms)); }
function availablePort() { return new Promise((resolve, reject) => { const probe = net.createServer(); probe.once('error', reject); probe.listen(0, '127.0.0.1', () => { const address = probe.address(); const port = typeof address === 'object' && address ? address.port : 0; probe.close(() => resolve(port)); }); }); }
async function waitForServer(url) { for (let index = 0; index < 80; index++) { try { const response = await fetch(url); if (response.ok && (await response.text()).includes('The Last Tribunal')) return; } catch (_) {} await wait(250); } throw new Error(`Timed out waiting for ${url}`); }
async function stopServer(server) { if (!server || server.exitCode !== null) return; server.kill('SIGTERM'); await Promise.race([new Promise((resolve) => server.once('exit', resolve)), wait(3000)]); if (server.exitCode === null) server.kill('SIGKILL'); }

function captureIndex(captures) {
  const cards = captures.map(({ id, clean, diagnostic }) => `<section><h2>${id}</h2><figure><img src="${clean}"><figcaption>clean</figcaption></figure><figure><img src="${diagnostic}"><figcaption>diagnostic</figcaption></figure></section>`).join('\n');
  return `<!doctype html><html><head><meta charset="utf-8"><title>The Last Tribunal Graybox Captures</title><style>body{margin:0;background:#090a0f;color:#eee;font-family:system-ui;padding:20px}h1{margin:0 0 8px}p{color:#bbb}section{margin:24px 0;padding-top:18px;border-top:1px solid #333}h2{font-size:18px}figure{display:inline-block;width:49%;margin:0 .5% 12px 0;vertical-align:top}img{display:block;width:100%;height:auto;background:#111}figcaption{padding:6px;color:#c8a86b}@media(max-width:900px){figure{width:100%}}</style></head><body><h1>The Last Tribunal — Graybox Review</h1><p>production_arena_graybox_candidate · deployable false · clean and diagnostic pairs</p>${cards}</body></html>`;
}

async function main() {
  const port = await availablePort();
  const baseUrl = `http://127.0.0.1:${port}`;
  const url = `${baseUrl}/graybox.html?capture=1`;
  const server = spawn(process.execPath, [VITE_BIN, '--host', '127.0.0.1', '--port', String(port), '--strictPort'], { cwd: ROOT, stdio: ['ignore', 'pipe', 'pipe'], windowsHide: true });
  const serverLogs = [];
  server.stdout.on('data', (data) => serverLogs.push(data.toString()));
  server.stderr.on('data', (data) => serverLogs.push(data.toString()));
  let browser;
  try {
    await waitForServer(url);
    browser = await chromium.launch({ headless: true });
    const page = await browser.newPage({ viewport: { width: 1280, height: 720 }, deviceScaleFactor: 1 });
    const consoleErrors = [];
    page.on('console', (message) => { if (message.type() === 'error') consoleErrors.push(message.text()); });
    page.on('pageerror', (error) => consoleErrors.push(error.message));
    await page.goto(url, { waitUntil: 'networkidle' });
    await page.waitForFunction(() => !!window.__NGA_TRIBUNAL_GRAYBOX__);
    await page.evaluate(() => window.__NGA_TRIBUNAL_GRAYBOX__.ready);
    const viewport = page.locator('#viewport');

    async function captureStatic(id, diagnostic) {
      const snapshot = await page.evaluate(({ id, diagnostic }) => {
        const api = window.__NGA_TRIBUNAL_GRAYBOX__;
        api.setScenario(id, diagnostic);
        for (let index = 0; index < 3; index++) api.render();
        return api.snapshot();
      }, { id, diagnostic });
      await page.waitForTimeout(20);
      const suffix = diagnostic ? 'diagnostic' : 'clean';
      const filename = `${id}_${suffix}.png`;
      await viewport.screenshot({ path: path.join(OUT_DIR, filename) });
      return { snapshot, filename };
    }

    async function captureCinematic(definition, diagnostic) {
      const snapshot = await page.evaluate(({ definition, diagnostic }) => {
        const api = window.__NGA_TRIBUNAL_GRAYBOX__;
        const scene = definition.context === 'round_finisher' ? 'round_finisher' : definition.context === 'command_grab' ? 'command_grab' : definition.context === 'super' ? 'super' : definition.context === 'ultimate' ? 'ultimate' : 'center_stage';
        api.setScenario(scene, diagnostic);
        api.startCinematic(definition.context, definition.elapsed, definition.duration);
        for (let index = 0; index < 3; index++) api.render();
        return api.snapshot();
      }, { definition, diagnostic });
      await page.waitForTimeout(20);
      const suffix = diagnostic ? 'diagnostic' : 'clean';
      const filename = `${definition.id}_${suffix}.png`;
      await viewport.screenshot({ path: path.join(OUT_DIR, filename) });
      return { snapshot, filename };
    }

    const records = [];
    for (const id of STATIC_SCENARIOS) {
      const clean = await captureStatic(id, false);
      const diagnostic = await captureStatic(id, true);
      records.push({ id, clean: clean.filename, diagnostic: diagnostic.filename, cleanSnapshot: clean.snapshot, diagnosticSnapshot: diagnostic.snapshot });
    }
    for (const definition of CINEMATICS) {
      const clean = await captureCinematic(definition, false);
      const diagnostic = await captureCinematic(definition, true);
      records.push({ id: definition.id, clean: clean.filename, diagnostic: diagnostic.filename, cleanSnapshot: clean.snapshot, diagnosticSnapshot: diagnostic.snapshot });
    }

    const benchmark = await page.evaluate(() => {
      const api = window.__NGA_TRIBUNAL_GRAYBOX__;
      api.setScenario('center_stage', false);
      return api.benchmark(180);
    });
    const gpu = await page.evaluate(() => {
      const gl = window.__NGA_TRIBUNAL_GRAYBOX__.renderer.renderer.getContext();
      const extension = gl.getExtension('WEBGL_debug_renderer_info');
      return {
        vendor: extension ? gl.getParameter(extension.UNMASKED_VENDOR_WEBGL) : gl.getParameter(gl.VENDOR),
        renderer: extension ? gl.getParameter(extension.UNMASKED_RENDERER_WEBGL) : gl.getParameter(gl.RENDERER),
        version: gl.getParameter(gl.VERSION)
      };
    });

    for (const record of records) {
      for (const snapshot of [record.cleanSnapshot, record.diagnosticSnapshot]) {
        assert.strictEqual(snapshot.status, 'production_arena_graybox_candidate');
        assert.strictEqual(snapshot.deployable, false);
        assert.strictEqual(snapshot.authority.gameplayPlane, 'deterministic_2d');
        assert.strictEqual(snapshot.authority.renderingMayAffectGameplay, false);
        assert.strictEqual(snapshot.resources.webgl2, true);
        assert.strictEqual(snapshot.resources.loadedSpriteTextures, 8);
        assert.strictEqual(snapshot.resources.estimatedSpriteTextureMemoryMb, 72);
        assert.strictEqual(snapshot.resources.realTimeShadowCasters, 0);
        assert.strictEqual(snapshot.resources.loadError, null);
        for (const fighter of Object.values(snapshot.fighters)) {
          assert.ok(fighter.rootAlignmentError <= 1e-9, `${record.id} root alignment drift ${fighter.rootAlignmentError}`);
          assert.ok(fighter.shadowXError <= 1e-9, `${record.id} shadow alignment drift ${fighter.shadowXError}`);
          assert.strictEqual(fighter.root[2], 0, `${record.id} fighter escaped Z=0 plane`);
        }
      }
      assert.ok(record.cleanSnapshot.resources.drawCalls <= 80, `${record.id} clean draw calls exceeded 80`);
      assert.ok(record.cleanSnapshot.resources.triangles <= 35000, `${record.id} clean triangles exceeded 35000`);
      assert.ok(record.cleanSnapshot.diagnostics.foregroundOcclusionPercent <= 4, `${record.id} foreground occlusion exceeded four percent`);
    }
    for (const id of ['command_grab_camera', 'super_camera_move_authored_73', 'ultimate_camera', 'round_finisher', 'intro_camera_move_authored_96', 'victory_camera_move_authored_105']) {
      const record = records.find((entry) => entry.id === id);
      assert.strictEqual(record.cleanSnapshot.camera.pose.mode, 'cinematic', `${id} did not retain cinematic pose`);
      for (const [fighterId, fighter] of Object.entries(record.cleanSnapshot.fighters)) {
        const bounds = fighter.readabilityNdc;
        assert.ok(bounds.left > -0.99 && bounds.right < 0.99, `${id} ${fighterId} escaped horizontal readable frame`);
        assert.ok(bounds.bottom > -1.03 && bounds.top < 0.99, `${id} ${fighterId} escaped vertical identity frame`);
      }
    }
    const superRecord = records.find((entry) => entry.id === 'super_camera_move_authored_73');
    assert.strictEqual(superRecord.cleanSnapshot.camera.active.durationTicks, 73, 'move-authored cinematic length was not preserved');
    const contrastRecord = records.find((entry) => entry.id === 'contrast_study');
    assert.strictEqual(contrastRecord.cleanSnapshot.effects.darkSilhouettePlaceholder, true, 'contrast study must include the dark silhouette placeholder');
    assert.ok(Object.values(contrastRecord.cleanSnapshot.effects).every(Boolean), 'contrast study must include every VFX proxy');
    assert.deepStrictEqual(consoleErrors, []);

    const cleanDrawCalls = records.map((record) => record.cleanSnapshot.resources.drawCalls);
    const cleanTriangles = records.map((record) => record.cleanSnapshot.resources.triangles);
    const report = {
      schemaVersion: '1.0.0-graybox-browser-report',
      arenaId: 'the_last_tribunal',
      status: 'production_arena_graybox_candidate',
      deployable: false,
      approvalState: 'awaiting_human_graybox_and_concept_approval',
      capturedAt: new Date().toISOString(),
      browser: { name: 'Chromium', version: await browser.version(), gpu, viewport: [1280, 720], deviceScaleFactor: 1 },
      authority: { gameplayPlane: 'deterministic_2d', renderingMayAffectGameplay: false },
      performance: {
        cleanDrawCalls: { min: Math.min(...cleanDrawCalls), max: Math.max(...cleanDrawCalls) },
        cleanTriangles: { min: Math.min(...cleanTriangles), max: Math.max(...cleanTriangles) },
        browserTextureObjects: records[0].cleanSnapshot.resources.textures,
        loadedSpriteTextures: 8,
        estimatedUncompressedSpriteTextureMemoryMb: 72,
        memoryQualification: 'RGBA upload estimate; WebGL2 does not expose exact driver VRAM allocation',
        benchmark
      },
      durationProof: { arenaSuperDefaultTicks: 42, testedMoveAuthoredSuperTicks: 73, preservedByCameraRig: true },
      captures: records.map(({ id, clean, diagnostic, cleanSnapshot, diagnosticSnapshot }) => ({ id, clean, diagnostic, cleanSnapshot, diagnosticSnapshot })),
      consoleErrors,
      serverLogs: serverLogs.join('').split('\n').slice(0, 20)
    };
    fs.writeFileSync(path.join(OUT_DIR, 'graybox_browser_report.json'), `${JSON.stringify(report, null, 2)}\n`);
    fs.writeFileSync(path.join(OUT_DIR, 'capture_index.html'), captureIndex(records));
    console.log(`The Last Tribunal graybox smoke passed at ${url}`);
    console.log(JSON.stringify({ captures: records.length * 2, performance: report.performance, gpu, consoleErrors }, null, 2));
  } finally {
    if (browser) await browser.close();
    await stopServer(server);
  }
}

main().catch((error) => { console.error(error); process.exit(1); });
