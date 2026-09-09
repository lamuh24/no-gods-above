#!/usr/bin/env node
const assert = require('assert');
const crypto = require('crypto');
const { chromium } = require('playwright');
const { spawn } = require('child_process');
const fs = require('fs');
const net = require('net');
const os = require('os');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const REPO_ROOT = path.resolve(ROOT, '..', '..');
const OUT_DIR = path.join(ROOT, 'docs', 'swahili_sandbox', 'command-grab-finisher-v1');
const FRAME_DIR = fs.mkdtempSync(path.join(os.tmpdir(), 'nga-swahili-command-grab-finisher-v1-'));
const MIRRORED_FRAME_DIR = fs.mkdtempSync(path.join(os.tmpdir(), 'nga-swahili-command-grab-finisher-v1-mirrored-'));
const VITE_BIN = path.join(ROOT, 'node_modules', 'vite', 'bin', 'vite.js');
const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
const sha256 = (file) => crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex').toUpperCase();

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
    try { const response = await fetch(url); if (response.ok) return; } catch (_) {}
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

async function main() {
  fs.mkdirSync(OUT_DIR, { recursive: true });
  const port = await availablePort();
  const url = `http://127.0.0.1:${port}/sandbox.html?capture=1`;
  const server = spawn(process.execPath, [VITE_BIN, '--host', '127.0.0.1', '--port', String(port), '--strictPort'], { cwd: ROOT, stdio: ['ignore', 'pipe', 'pipe'], windowsHide: true });
  const logs = [];
  server.stdout.on('data', (data) => logs.push(data.toString()));
  server.stderr.on('data', (data) => logs.push(data.toString()));
  let browser;
  try {
    await waitForServer(url);
    browser = await chromium.launch({ headless: true });
    const page = await browser.newPage({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1 });
    const consoleErrors = [];
    page.on('console', (message) => { if (message.type() === 'error') consoleErrors.push(message.text()); });
    page.on('pageerror', (error) => consoleErrors.push(error.message));
    await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 60000 });
    await page.waitForFunction(() => !!window.__NGA_SWAHILI_SANDBOX__, null, { timeout: 60000 });
    await page.evaluate(() => window.__NGA_SWAHILI_SANDBOX__.ready);
    await page.evaluate(() => window.__NGA_SWAHILI_SANDBOX__.setDiagnostics(false));
    const viewport = page.locator('#viewport');

    await page.evaluate(() => window.__NGA_SWAHILI_SANDBOX__.runScenario('command_grab_hit'));
    const rootPath = [];
    const moments = new Map([
      [52, '01_release_impulse.png'],
      [59, '02_far_airborne_launch.png'],
      [64, '03_visual_hit.png'],
      [69, '04_post_shot_descent.png'],
      [73, '05_grounded_finish.png']
    ]);
    const capturedMoments = {};
    let lastSourceTick = -1;
    let frameNumber = 0;
    while (await page.evaluate(() => window.__NGA_SWAHILI_SANDBOX__.state.commandGrab.active)) {
      const snapshot = await page.evaluate(() => window.__NGA_SWAHILI_SANDBOX__.snapshot());
      const sourceTick = snapshot.commandGrabMotionV1.runtime.sourceTick;
      if (sourceTick !== lastSourceTick) {
        rootPath.push({
          sourceTick,
          frameIndex: snapshot.commandGrabMotionV1.runtime.frameIndex,
          phase: snapshot.commandGrabFinisherReviewV1.runtime.launchPhase,
          attacker: snapshot.fighters.p1.rootPosition,
          victim: snapshot.fighters.p2.rootPosition,
          separation: snapshot.commandGrabFinisherReviewV1.runtime.launchDistance,
          vfx: snapshot.commandGrabFinisherReviewV1.vfx
        });
        lastSourceTick = sourceTick;
      }
      const framePath = path.join(FRAME_DIR, `${String(frameNumber).padStart(3, '0')}.png`);
      await viewport.screenshot({ path: framePath });
      frameNumber++;
      if (moments.has(sourceTick) && !capturedMoments[sourceTick]) {
        const filename = moments.get(sourceTick);
        await viewport.screenshot({ path: path.join(OUT_DIR, filename) });
        capturedMoments[sourceTick] = { filename, snapshot };
        if (sourceTick === 64) {
          await page.evaluate(() => window.__NGA_SWAHILI_SANDBOX__.setCommandGrabFinisherVfx(false));
          await viewport.screenshot({ path: path.join(OUT_DIR, '03b_visual_hit_vfx_off.png') });
          await page.evaluate(() => window.__NGA_SWAHILI_SANDBOX__.setCommandGrabFinisherVfx(true));
        }
      }
      await page.evaluate(() => window.__NGA_SWAHILI_SANDBOX__.step({}, 1));
    }

    await page.evaluate(() => window.__NGA_SWAHILI_SANDBOX__.runScenario('command_grab_mirrored'));
    let mirroredShot = null;
    let mirroredFrameNumber = 0;
    while (await page.evaluate(() => window.__NGA_SWAHILI_SANDBOX__.state.commandGrab.active)) {
      const snapshot = await page.evaluate(() => window.__NGA_SWAHILI_SANDBOX__.snapshot());
      await viewport.screenshot({ path: path.join(MIRRORED_FRAME_DIR, `${String(mirroredFrameNumber).padStart(3, '0')}.png`) });
      mirroredFrameNumber++;
      if (snapshot.commandGrabMotionV1.runtime.sourceTick === 64) {
        mirroredShot = snapshot;
        await viewport.screenshot({ path: path.join(OUT_DIR, '06_visual_hit_mirrored.png') });
      }
      await page.evaluate(() => window.__NGA_SWAHILI_SANDBOX__.step({}, 1));
    }

    const cornerShot = await page.evaluate(() => {
      const api = window.__NGA_SWAHILI_SANDBOX__;
      api.reset();
      api.state.fighters.p1.x = -300;
      api.state.fighters.p2.x = -176;
      api.step({}, 1);
      api.playCommandGrab();
      while (api.state.commandGrab.active && api.state.commandGrab.sourceTick < 64) api.step({}, 1);
      return api.snapshot();
    });
    await viewport.screenshot({ path: path.join(OUT_DIR, '07_visual_hit_corner_clamped.png') });

    const shot = capturedMoments[64]?.snapshot;
    assert.ok(shot, 'authored shot capture missing');
    assert.ok(mirroredShot, 'mirrored shot capture missing');
    assert.strictEqual(shot.commandGrabFinisherReviewV1.vfx.showMuzzleFlash, true);
    assert.strictEqual(shot.commandGrabFinisherReviewV1.vfx.showTracer, true);
    assert.strictEqual(shot.commandGrabFinisherReviewV1.vfx.showImpact, true);
    assert.strictEqual(shot.commandGrabFinisherReviewV1.vfx.visibleImpactCount, 1);
    assert.ok(shot.commandGrabFinisherReviewV1.vfx.impact[0] < shot.commandGrabFinisherReviewV1.vfx.muzzle[0]);
    assert.ok(mirroredShot.commandGrabFinisherReviewV1.vfx.impact[0] > mirroredShot.commandGrabFinisherReviewV1.vfx.muzzle[0]);
    assert.strictEqual(cornerShot.commandGrabFinisherReviewV1.runtime.launchClippedByStage, true);
    assert.strictEqual(cornerShot.commandGrabFinisherReviewV1.vfx.visibleImpactCount, 1);
    assert.ok(shot.commandGrabFinisherReviewV1.runtime.launchDistance >= 300);
    assert.strictEqual(shot.commandGrabFinisherReviewV1.runtime.shotVisualHitCount, 1);
    assert.deepStrictEqual(consoleErrors, []);

    const approvedSync = JSON.parse(fs.readFileSync(path.join(REPO_ROOT, 'tools', 'nga-forge', 'production', 'characters', 'swahili', 'motion', 'command-grab-motion-v1.approved.synchronization.json'), 'utf8'));
    const attackerHashAudit = approvedSync.frames.map((frame) => ({
      index: frame.index,
      sourceId: frame.frameId,
      expected: frame.approvedSha256,
      actual: sha256(path.join(REPO_ROOT, ...frame.approvedPath.split('/')))
    }));
    assert.ok(attackerHashAudit.every((item) => item.actual === item.expected));

    const report = {
      schemaVersion: '1.0.0-swahili-command-grab-finisher-review',
      record: 'SWAHILI_COMMAND_GRAB_FAR_LAUNCH_VISUAL_HIT_V1',
      status: 'candidate-only',
      deployable: false,
      productionRoster: false,
      approval: shot.commandGrabFinisherReviewV1.approval,
      sourceUrl: url,
      capturedAt: new Date().toISOString(),
      frameDirectory: FRAME_DIR,
      frameCount: frameNumber,
      mirroredFrameDirectory: MIRRORED_FRAME_DIR,
      mirroredFrameCount: mirroredFrameNumber,
      currentPlaybackRate: shot.commandGrabMotionV1.playbackRate,
      shot: {
        sourceTick: 64,
        attackerRoot: shot.fighters.p1.rootPosition,
        victimRoot: shot.fighters.p2.rootPosition,
        separation: shot.commandGrabFinisherReviewV1.runtime.launchDistance,
        muzzle: shot.commandGrabFinisherReviewV1.vfx.muzzle,
        impact: shot.commandGrabFinisherReviewV1.vfx.impact,
        visibleImpactCount: shot.commandGrabFinisherReviewV1.vfx.visibleImpactCount,
        registeredVisualHitCount: shot.commandGrabFinisherReviewV1.runtime.shotVisualHitCount
      },
      mirroredShot: {
        muzzle: mirroredShot.commandGrabFinisherReviewV1.vfx.muzzle,
        impact: mirroredShot.commandGrabFinisherReviewV1.vfx.impact,
        visibleImpactCount: mirroredShot.commandGrabFinisherReviewV1.vfx.visibleImpactCount
      },
      cornerShot: {
        victimRoot: cornerShot.fighters.p2.rootPosition,
        separation: cornerShot.commandGrabFinisherReviewV1.runtime.launchDistance,
        launchClippedByStage: cornerShot.commandGrabFinisherReviewV1.runtime.launchClippedByStage,
        visibleImpactCount: cornerShot.commandGrabFinisherReviewV1.vfx.visibleImpactCount
      },
      maxLaunchDistance: Math.max(...rootPath.map((item) => item.separation)),
      rootPath,
      attackerHashAudit,
      captures: [...Object.values(capturedMoments).map((item) => item.filename), '03b_visual_hit_vfx_off.png', '06_visual_hit_mirrored.png', '07_visual_hit_corner_clamped.png'],
      consoleErrors,
      serverLogs: logs.join('').split('\n').slice(0, 20)
    };
    fs.writeFileSync(path.join(OUT_DIR, 'command-grab-finisher-v1.browser-report.json'), `${JSON.stringify(report, null, 2)}\n`);
    console.log(JSON.stringify({ outDir: OUT_DIR, frameDir: FRAME_DIR, frameCount: frameNumber, mirroredFrameDir: MIRRORED_FRAME_DIR, mirroredFrameCount: mirroredFrameNumber, shot: report.shot, mirroredShot: report.mirroredShot, cornerShot: report.cornerShot, maxLaunchDistance: report.maxLaunchDistance }, null, 2));
  } finally {
    if (browser) await browser.close();
    await stopServer(server);
  }
}

main().catch((error) => { console.error(error); process.exit(1); });
