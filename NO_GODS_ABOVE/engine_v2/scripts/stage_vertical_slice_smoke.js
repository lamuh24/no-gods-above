#!/usr/bin/env node
const assert = require('assert');
const { chromium } = require('playwright');
const { spawn } = require('child_process');
const fs = require('fs');
const net = require('net');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const OUT_DIR = path.join(ROOT, 'docs', 'stage_vertical_slice');
const VITE_BIN = path.join(ROOT, 'node_modules', 'vite', 'bin', 'vite.js');
fs.mkdirSync(OUT_DIR, { recursive: true });

function wait(ms) { return new Promise((resolve) => setTimeout(resolve, ms)); }
function availablePort() { return new Promise((resolve, reject) => { const probe = net.createServer(); probe.once('error', reject); probe.listen(0, '127.0.0.1', () => { const address = probe.address(); const port = typeof address === 'object' && address ? address.port : 0; probe.close(() => resolve(port)); }); }); }
async function waitForServer(url) { for (let index = 0; index < 80; index++) { try { const response = await fetch(url); if (response.ok && (await response.text()).includes('NGA Engine V2')) return; } catch (_) {} await wait(250); } throw new Error(`Timed out waiting for ${url}`); }
async function stopServer(server) { if (!server || server.exitCode !== null) return; server.kill('SIGTERM'); await Promise.race([new Promise((resolve) => server.once('exit', resolve)), wait(3000)]); if (server.exitCode === null) server.kill('SIGKILL'); }

async function main() {
  const port = await availablePort();
  const url = `http://127.0.0.1:${port}/`;
  const server = spawn(process.execPath, [VITE_BIN, '--host', '127.0.0.1', '--port', String(port), '--strictPort'], { cwd: ROOT, stdio: ['ignore', 'pipe', 'pipe'], windowsHide: true });
  const serverLogs = [];
  server.stdout.on('data', (data) => serverLogs.push(data.toString()));
  server.stderr.on('data', (data) => serverLogs.push(data.toString()));
  let browser;
  try {
    await waitForServer(url);
    browser = await chromium.launch({ headless: true });
    const page = await browser.newPage({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1 });
    const consoleErrors = [];
    page.on('console', (message) => { if (message.type() === 'error') consoleErrors.push(message.text()); });
    page.on('pageerror', (error) => consoleErrors.push(error.message));
    await page.goto(url, { waitUntil: 'networkidle' });
    await page.waitForFunction(() => !!window.__NGA_ENGINE_V2_DEBUG__);
    await page.evaluate(() => window.__NGA_ENGINE_V2_DEBUG__.stageReady);
    await page.evaluate(() => {
      const { runtime, renderer } = window.__NGA_ENGINE_V2_DEBUG__;
      runtime.setPaused(true);
      Object.assign(renderer.overlays, { push: false, hurt: false, strike: false, origin: false, facing: false, ground: false });
      for (let index = 0; index < 4; index++) renderer.render(runtime.state);
    });
    await page.waitForTimeout(500);
    const viewport = page.locator('#viewport');

    async function setScene(scene) {
      return page.evaluate((scene) => {
        const { runtime, renderer } = window.__NGA_ENGINE_V2_DEBUG__;
        runtime.reset();
        runtime.setPaused(true);
        Object.assign(runtime.state.fighters.p1, { x: scene.p1x, y: scene.p1y ?? 0, facing: scene.p1Facing ?? 1, attackFacing: scene.p1Facing ?? 1, phase: scene.p1Phase ?? 'idle', grounded: (scene.p1y ?? 0) === 0 });
        Object.assign(runtime.state.fighters.p2, { x: scene.p2x, y: scene.p2y ?? 0, facing: scene.p2Facing ?? -1, attackFacing: scene.p2Facing ?? -1, phase: scene.p2Phase ?? 'idle', grounded: (scene.p2y ?? 0) === 0 });
        Object.assign(runtime.state.fighters.p1, scene.p1State ?? {});
        Object.assign(runtime.state.fighters.p2, scene.p2State ?? {});
        runtime.state.tick = scene.tick ?? 0;
        Object.assign(renderer.overlays, { push: false, hurt: false, strike: false, origin: false, facing: false, ground: false });
        renderer.snapCamera(runtime.state);
        for (let index = 0; index < 3; index++) renderer.render(runtime.state);
        const fighters = renderer.getFighterPresentationSnapshots();
        const screen = Object.fromEntries(Object.entries(fighters).map(([id, fighter]) => [id, {
          root: renderer.projectWorldToNdc(fighter.rootPosition),
          spriteTop: renderer.projectWorldToNdc([fighter.rootPosition[0], fighter.rootPosition[1] + 3.6, fighter.rootPosition[2]])
        }]));
        return { camera: renderer.getCameraSnapshot(), fighters, screen, resources: renderer.getResourceSnapshot() };
      }, scene);
    }

    async function capture(name, scene) {
      const evidence = await setScene(scene);
      await page.waitForTimeout(250);
      await page.evaluate(() => { const { runtime, renderer } = window.__NGA_ENGINE_V2_DEBUG__; renderer.render(runtime.state); });
      await page.waitForTimeout(100);
      await viewport.screenshot({ path: path.join(OUT_DIR, `${name}.png`) });
      return evidence;
    }

    const captures = {};
    captures.center_stage = await capture('center_stage', { p1x: -76, p2x: 76, tick: 15 });
    captures.p1_authored = await capture('p1_authored', { p1x: -120, p2x: 160, p1Phase: 'walk_forward', tick: 18 });
    captures.p2_mirrored = await capture('p2_mirrored', { p1x: -160, p2x: 120, p2Phase: 'walk_backward', tick: 18 });
    captures.left_corner = await capture('left_corner', { p1x: -410, p2x: -285, tick: 30 });
    captures.right_corner = await capture('right_corner', { p1x: 285, p2x: 410, tick: 30 });
    captures.jump_framing = await capture('jump_framing', { p1x: -150, p2x: 150, p1y: -180, tick: 44 });
    captures.hit_reaction_light_entry = await capture('hit_reaction_light_entry', { p1x: -90, p2x: 70, p2State: { phase: 'hit_reaction', phaseTick: 0, hitstun: 12, hitReactionWeight: 'light' }, tick: 50 });
    captures.hit_reaction_light_recoil = await capture('hit_reaction_light_recoil', { p1x: -90, p2x: 70, p2State: { phase: 'hit_reaction', phaseTick: 2, hitstun: 10, hitReactionWeight: 'light' }, tick: 52 });
    captures.hit_reaction_heavy_recovery = await capture('hit_reaction_heavy_recovery', { p1x: -90, p2x: 70, p2State: { phase: 'hit_reaction', phaseTick: 11, hitstun: 8, hitReactionWeight: 'heavy' }, tick: 61 });
    captures.hit_reaction_airborne_tumble = await capture('hit_reaction_airborne_tumble', { p1x: -90, p2x: 70, p2y: -96, p2State: { phase: 'hit_reaction', phaseTick: 4, hitstun: 18, hitReactionWeight: 'heavy', grounded: false }, tick: 54 });
    captures.knockdown_ground_impact = await capture('knockdown_ground_impact', { p1x: -90, p2x: 70, p2State: { phase: 'knockdown', phaseTick: 0, knockdownKind: 'soft', knockdownTicks: 26 }, tick: 62 });
    captures.knockdown_face_up = await capture('knockdown_face_up', { p1x: -90, p2x: 70, p2State: { phase: 'knockdown', phaseTick: 7, knockdownKind: 'soft', knockdownTicks: 19 }, tick: 69 });
    captures.getup_roll_brace = await capture('getup_roll_brace', { p1x: -90, p2x: 70, p2State: { phase: 'getup', phaseTick: 4, knockdownKind: 'soft', knockdownTicks: 0, getupTicks: 14 }, tick: 90 });
    captures.getup_rise_to_stand = await capture('getup_rise_to_stand', { p1x: -90, p2x: 70, p2State: { phase: 'getup', phaseTick: 15, knockdownKind: 'soft', knockdownTicks: 0, getupTicks: 3 }, tick: 101 });

    async function captureCinematic(name, context, elapsed) {
      const evidence = await page.evaluate(({ context, elapsed }) => {
        const { runtime, renderer } = window.__NGA_ENGINE_V2_DEBUG__;
        runtime.reset(); runtime.setPaused(true);
        runtime.state.fighters.p1.x = -44; runtime.state.fighters.p2.x = 44;
        renderer.snapCamera(runtime.state);
        renderer.startCinematic(context, 'p1', runtime.state);
        for (let index = 0; index < elapsed; index++) runtime.frameAdvance({});
        for (let index = 0; index < 3; index++) renderer.render(runtime.state);
        return { camera: renderer.getCameraSnapshot(), fighters: renderer.getFighterPresentationSnapshots(), resources: renderer.getResourceSnapshot() };
      }, { context, elapsed });
      await page.waitForTimeout(250);
      await page.evaluate(() => { const { runtime, renderer } = window.__NGA_ENGINE_V2_DEBUG__; renderer.render(runtime.state); });
      await page.waitForTimeout(100);
      await viewport.screenshot({ path: path.join(OUT_DIR, `${name}.png`) });
      return evidence;
    }

    captures.cinematic_throw = await captureCinematic('cinematic_throw', 'throw', 8);
    captures.cinematic_ultimate = await captureCinematic('cinematic_ultimate', 'ultimate', 10);
    captures.cinematic_return = await page.evaluate(() => {
      const { runtime, renderer } = window.__NGA_ENGINE_V2_DEBUG__;
      runtime.reset(); runtime.setPaused(true); runtime.state.fighters.p1.x = -44; runtime.state.fighters.p2.x = 44;
      renderer.snapCamera(runtime.state); renderer.startCinematic('throw', 'p1', runtime.state);
      for (let index = 0; index < 8; index++) runtime.frameAdvance({});
      renderer.render(runtime.state); renderer.abortCinematic(runtime.state);
      for (let index = 0; index < 12; index++) runtime.frameAdvance({});
      for (let index = 0; index < 3; index++) renderer.render(runtime.state);
      return { camera: renderer.getCameraSnapshot(), fighters: renderer.getFighterPresentationSnapshots(), resources: renderer.getResourceSnapshot() };
    });
    await page.waitForTimeout(100);
    await viewport.screenshot({ path: path.join(OUT_DIR, 'cinematic_return.png') });

    const finalResources = captures.cinematic_return.resources;
    assert.strictEqual(finalResources.webgl2, true, 'WebGL2 context required');
    assert.strictEqual(finalResources.stage.loadedTextures, 22, 'all hash-locked Swahili test textures must load');
    assert.strictEqual(finalResources.stage.loadError, null, 'sprite texture load must be clean');
    assert.ok(finalResources.drawCalls <= 80, `draw calls ${finalResources.drawCalls} exceed budget`);
    assert.ok(finalResources.triangles <= 60000, `triangles ${finalResources.triangles} exceed budget`);
    assert.ok(finalResources.textures <= 24, `textures ${finalResources.textures} exceed budget`);
    assert.strictEqual(captures.p1_authored.fighters.p1.frame, 'walk_forward_contact');
    assert.strictEqual(captures.p2_mirrored.fighters.p2.frame, 'walk_backward_rearward_contact');
    assert.strictEqual(captures.hit_reaction_light_entry.fighters.p2.frame, 'light_hit_entry');
    assert.strictEqual(captures.hit_reaction_light_recoil.fighters.p2.frame, 'light_hit_reaction');
    assert.strictEqual(captures.hit_reaction_heavy_recovery.fighters.p2.frame, 'heavy_hit_recovery');
    assert.strictEqual(captures.hit_reaction_airborne_tumble.fighters.p2.frame, 'airborne_tumble');
    assert.strictEqual(captures.knockdown_ground_impact.fighters.p2.frame, 'knockdown_ground_impact');
    assert.strictEqual(captures.knockdown_face_up.fighters.p2.frame, 'knockdown_face_up');
    assert.strictEqual(captures.getup_roll_brace.fighters.p2.frame, 'getup_roll_brace');
    assert.strictEqual(captures.getup_rise_to_stand.fighters.p2.frame, 'getup_rise_to_stand');
    assert.strictEqual(captures.p1_authored.fighters.p1.mirrored, false);
    assert.strictEqual(captures.p2_mirrored.fighters.p2.mirrored, true);
    for (const evidence of Object.values(captures)) {
      for (const fighter of Object.values(evidence.fighters)) {
        assert.ok(fighter.rootAlignmentError <= 1e-9, `sprite root alignment drifted by ${fighter.rootAlignmentError}`);
        assert.ok(fighter.shadowXError <= 1e-9, `shadow X drifted by ${fighter.shadowXError}`);
      }
    }
    assert.ok(captures.jump_framing.camera.pose.target[1] > captures.center_stage.camera.pose.target[1], 'jump camera target did not rise');
    for (const captureId of ['center_stage', 'left_corner', 'right_corner', 'jump_framing']) {
      for (const [fighterId, projection] of Object.entries(captures[captureId].screen)) {
        assert.ok(Math.abs(projection.root[0]) < 0.86, `${captureId} ${fighterId} root escaped horizontal safe frame`);
        assert.ok(projection.root[1] > -0.92 && projection.root[1] < 0.92, `${captureId} ${fighterId} root escaped vertical safe frame`);
        assert.ok(projection.spriteTop[1] < 0.94, `${captureId} ${fighterId} sprite top escaped vertical safe frame`);
      }
    }
    assert.strictEqual(captures.cinematic_throw.camera.pose.mode, 'cinematic');
    assert.strictEqual(captures.cinematic_ultimate.camera.pose.mode, 'cinematic');
    assert.strictEqual(captures.cinematic_return.camera.pose.mode, 'gameplay');
    assert.deepStrictEqual(consoleErrors, []);

    const screenshots = Object.keys(captures).map((id) => `${id}.png`);
    const report = {
      contractId: 'stage_vertical_slice_v1',
      url,
      platform: process.platform,
      timestamp: new Date().toISOString(),
      consoleErrors,
      authority: { gameplayPlane: 'deterministic_2d', renderingMayAffectGameplay: false },
      assetStatus: finalResources.stage,
      performance: { drawCalls: finalResources.drawCalls, triangles: finalResources.triangles, textures: finalResources.textures, budgets: { maxDrawCalls: 80, maxTriangles: 60000, maxTextures: 24 } },
      captures,
      screenshots,
      blockers: [
        'Swahili walk motion V2 is incomplete and blocked on three manual paint-overs; only two candidate-acceptable single poses are shown.',
        'No approved production-stage art pack exists; environment geometry and painted planes are vertical-slice placeholders.',
        'Rim and emission masks are optional contract slots but no approved Swahili masks exist.',
        'Throw, super, ultimate, intro, victory, and finisher presentation events are not yet emitted by the combat kernel; this harness invokes the constrained camera API directly.'
      ],
      serverLogs: serverLogs.join('').split('\n').slice(0, 16)
    };
    fs.writeFileSync(path.join(OUT_DIR, 'stage_vertical_slice_report.json'), JSON.stringify(report, null, 2));
    console.log(`Stage vertical slice smoke passed at ${url}`);
    console.log(JSON.stringify({ screenshots, performance: report.performance, assetStatus: report.assetStatus }, null, 2));
  } finally {
    if (browser) await browser.close();
    await stopServer(server);
  }
}

main().catch((error) => { console.error(error); process.exit(1); });
