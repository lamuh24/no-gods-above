#!/usr/bin/env node
const assert = require('assert');
const { chromium } = require('playwright');
const { spawn } = require('child_process');
const fs = require('fs');
const net = require('net');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const OUT_DIR = path.join(ROOT, 'docs', 'swahili_sandbox', 'forward-walk-v2-live-review');
const AUTHORED_DIR = path.join(OUT_DIR, 'authored-p1-frames');
const MIRRORED_DIR = path.join(OUT_DIR, 'mirrored-p2-frames');
const VITE_BIN = path.join(ROOT, 'node_modules', 'vite', 'bin', 'vite.js');
const PROFILES = ['candidate_current_58_ticks', 'even_40_ticks', 'contact_weighted_40_ticks'];
const TRANSITIONS = [
  'walk_v2_idle_to_forward', 'walk_v2_continuous', 'walk_v2_forward_to_idle', 'walk_v2_repeated_start_stop',
  'walk_v2_forward_to_backward', 'walk_v2_corner_approach', 'walk_v2_side_switch', 'walk_v2_mirrored_p2',
  'walk_v2_to_standing_heavy', 'walk_v2_to_universal_grab', 'walk_v2_to_command_grab', 'walk_v2_to_block', 'walk_v2_to_crouch'
];

for (const dir of [OUT_DIR, AUTHORED_DIR, MIRRORED_DIR]) fs.mkdirSync(dir, { recursive: true });
const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
const availablePort = () => new Promise((resolve, reject) => {
  const server = net.createServer();
  server.once('error', reject);
  server.listen(0, '127.0.0.1', () => {
    const address = server.address();
    server.close(() => resolve(typeof address === 'object' && address ? address.port : 0));
  });
});
async function waitForServer(url) {
  for (let attempt = 0; attempt < 100; attempt++) {
    try { const response = await fetch(url); if (response.ok) return; } catch (_) {}
    await wait(200);
  }
  throw new Error(`Timed out waiting for ${url}`);
}
async function stopServer(server) {
  if (!server || server.exitCode !== null) return;
  server.kill('SIGTERM');
  await Promise.race([new Promise((resolve) => server.once('exit', resolve)), wait(3000)]);
  if (server.exitCode === null) server.kill('SIGKILL');
}

async function setReviewStart(page, profile, mirrored = false) {
  return page.evaluate(({ profile, mirrored }) => {
    const api = window.__NGA_SWAHILI_SANDBOX__;
    api.reset();
    api.setForwardWalkTiming(profile);
    if (mirrored) {
      api.state.fighters.p1.x = 88;
      api.state.fighters.p2.x = -360;
      api.state.fighters.p1.facing = -1;
      api.state.fighters.p2.facing = 1;
    } else {
      api.state.fighters.p1.x = -300;
      api.state.fighters.p2.x = 360;
      api.state.fighters.p1.facing = 1;
      api.state.fighters.p2.facing = -1;
    }
    api.renderer.snapCamera(api.state);
    return api.snapshot();
  }, { profile, mirrored });
}

async function captureEightFrames(page, profile, mirrored, directory) {
  const timing = await page.evaluate((id) => window.__NGA_SWAHILI_SANDBOX__.timingProfiles[id], profile);
  await setReviewStart(page, profile, mirrored);
  const viewport = page.locator('#viewport');
  const records = [];
  for (let frameIndex = 0; frameIndex < 8; frameIndex++) {
    const input = mirrored ? { left: true } : { right: true };
    const snapshot = await page.evaluate((input) => window.__NGA_SWAHILI_SANDBOX__.step(input), input);
    await page.evaluate(() => window.__NGA_SWAHILI_SANDBOX__.renderer.renderer.getContext().finish());
    const filename = `${String(frameIndex + 1).padStart(2, '0')}.png`;
    await viewport.screenshot({ path: path.join(directory, filename) });
    records.push({ filename, durationTicks: timing.frameTicks[frameIndex], sourceId: snapshot.fighters.p1.animationFrame, role: snapshot.forwardWalkV2.diagnostic.gaitRole });
    const remaining = timing.frameTicks[frameIndex] - 1;
    if (remaining > 0) await page.evaluate(({ input, remaining }) => window.__NGA_SWAHILI_SANDBOX__.step(input, remaining), { input, remaining });
  }
  return records;
}

async function main() {
  const port = await availablePort();
  const url = `http://127.0.0.1:${port}/sandbox.html?capture=1&walkTiming=contact_weighted_40_ticks`;
  const server = spawn(process.execPath, [VITE_BIN, '--host', '127.0.0.1', '--port', String(port), '--strictPort'], { cwd: ROOT, stdio: ['ignore', 'pipe', 'pipe'], windowsHide: true });
  const logs = [];
  server.stdout.on('data', (chunk) => logs.push(chunk.toString()));
  server.stderr.on('data', (chunk) => logs.push(chunk.toString()));
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
    await page.evaluate(() => { const api = window.__NGA_SWAHILI_SANDBOX__; api.setDiagnostics(true); api.renderer.renderer.getContext().finish(); });

    const profileResults = {};
    for (const profile of PROFILES) {
      await setReviewStart(page, profile, false);
      const result = await page.evaluate((profile) => {
        const api = window.__NGA_SWAHILI_SANDBOX__;
        const timing = api.timingProfiles[profile];
        const samples = [];
        let previous = null;
        for (let tick = 0; tick < timing.cycleTicks; tick++) {
          const snapshot = api.step({ right: true });
          const diagnostic = snapshot.forwardWalkV2.diagnostic;
          samples.push({
            tick,
            frame: diagnostic.artworkFrame,
            role: diagnostic.gaitRole,
            delta: diagnostic.perTickDisplacement,
            accumulated: diagnostic.accumulatedDisplacement,
            plantedFootWorldPosition: diagnostic.plantedFootWorldPosition,
            footSkateEstimate: diagnostic.footSkateEstimate,
            deltaChange: previous === null ? 0 : Math.abs(diagnostic.perTickDisplacement - previous)
          });
          previous = diagnostic.perTickDisplacement;
        }
        const diagnostic = api.snapshot().forwardWalkV2.diagnostic;
        return {
          profile,
          cycleTicks: timing.cycleTicks,
          durationMs: timing.reviewDurationMs,
          exposureTicks: timing.frameTicks,
          totalDistance: diagnostic.accumulatedDisplacement,
          expectedGameplayDistance: timing.cycleTicks * 3.6,
          meanFootSkate: diagnostic.meanFootSkateEstimate,
          peakFootSkate: diagnostic.peakFootSkateEstimate,
          maxDeltaChange: Math.max(...samples.map((sample) => sample.deltaChange)),
          minDisplacement: Math.min(...samples.map((sample) => sample.delta)),
          maxDisplacement: Math.max(...samples.map((sample) => sample.delta)),
          motionCurveVersion: diagnostic.motionCurveVersion,
          frameCoverage: [...new Set(samples.map((sample) => sample.frame))],
          samples
        };
      }, profile);
      profileResults[profile] = result;
      await page.locator('#viewport').screenshot({ path: path.join(OUT_DIR, `timing-${profile}.png`) });
    }

    const transitionResults = {};
    for (const scenario of TRANSITIONS) {
      const snapshot = await page.evaluate((scenario) => window.__NGA_SWAHILI_SANDBOX__.runScenario(scenario), scenario);
      transitionResults[scenario] = {
        state: snapshot.fighters.p1.fighterState,
        artworkFrame: snapshot.fighters.p1.animationFrame,
        root: snapshot.fighters.p1.rootPosition,
        perTickDisplacement: snapshot.forwardWalkV2.diagnostic.perTickDisplacement,
        transitionState: snapshot.forwardWalkV2.diagnostic.transitionState,
        fallbackWarning: snapshot.fighters.p1.fallbackWarning
      };
    }

    await setReviewStart(page, 'contact_weighted_40_ticks', false);
    await page.evaluate(() => window.__NGA_SWAHILI_SANDBOX__.step({ right: true }, 14));
    await page.locator('#viewport').screenshot({ path: path.join(OUT_DIR, 'in-game-forward-walk-v2.png') });
    await page.locator('#locomotion-hud').scrollIntoViewIfNeeded();
    await page.screenshot({ path: path.join(OUT_DIR, 'root-motion-diagnostic.png'), fullPage: false });

    const authoredPlayback = await captureEightFrames(page, 'contact_weighted_40_ticks', false, AUTHORED_DIR);
    const mirroredPlayback = await captureEightFrames(page, 'contact_weighted_40_ticks', true, MIRRORED_DIR);
    await page.locator('#viewport').screenshot({ path: path.join(OUT_DIR, 'mirrored-p2-playback-capture.png') });

    const snapshot = await page.evaluate(() => window.__NGA_SWAHILI_SANDBOX__.snapshot());
    assert.strictEqual(snapshot.candidateOnly, true);
    assert.strictEqual(snapshot.deployable, false);
    assert.strictEqual(snapshot.productionRoster, false);
    assert.strictEqual(snapshot.forwardWalkV2.animationControlsCollision, false);
    assert.strictEqual(snapshot.forwardWalkV2.selectedTiming, 'contact_weighted_40_ticks');
    assert.strictEqual(snapshot.forwardWalkV2.diagnostic.motionCurveVersion, 'contact_aware_smoothstep_v2');
    assert.strictEqual(snapshot.arena.resources.loadedSpriteTextures, 38);
    assert.deepStrictEqual(consoleErrors, []);
    for (const result of Object.values(profileResults)) {
      assert.ok(Math.abs(result.totalDistance - result.expectedGameplayDistance) < 1e-6, `${result.profile} movement distance drift`);
      assert.deepStrictEqual(result.frameCoverage, [1, 2, 3, 4, 5, 6, 7, 8]);
      assert.ok(result.maxDeltaChange < 1.5, `${result.profile} still has a skipping root-velocity jump`);
      assert.ok(result.maxDisplacement / result.minDisplacement < 3, `${result.profile} still crawls and then lunges`);
    }

    const report = {
      schemaVersion: '1.1.0-forward-walk-v2-smooth-root-review',
      status: 'candidate-only',
      deployable: false,
      approval: 'awaiting_human_forward_walk_v2_smooth_root_review',
      capturedAt: new Date().toISOString(),
      browser: { name: 'Chromium', version: await browser.version(), viewport: [1440, 900] },
      sourceRoute: url,
      selectedTiming: 'contact_weighted_40_ticks',
      profileResults,
      transitionResults,
      playback: { authoredP1: authoredPlayback, mirroredP2: mirroredPlayback },
      backwardWalk: snapshot.backwardWalk,
      candidateBoundary: { artworkRegenerated: false, finalAtlasCreated: false, productionRoster: false, legacyGameJsModifiedByTask: false },
      consoleErrors,
      serverLogs: logs.join('').split('\n').slice(0, 20)
    };
    fs.writeFileSync(path.join(OUT_DIR, 'forward-walk-v2-browser-report.json'), `${JSON.stringify(report, null, 2)}\n`);
    fs.writeFileSync(path.join(OUT_DIR, 'playback-manifest.json'), `${JSON.stringify({ selectedTiming: 'contact_weighted_40_ticks', authoredP1: authoredPlayback, mirroredP2: mirroredPlayback }, null, 2)}\n`);
    console.log(`Forward Walk V2 browser review smoke passed at ${url}`);
    console.log(JSON.stringify({ selectedTiming: report.selectedTiming, profileResults: Object.fromEntries(Object.entries(profileResults).map(([id, value]) => [id, { cycleTicks: value.cycleTicks, totalDistance: value.totalDistance, meanFootSkate: value.meanFootSkate, peakFootSkate: value.peakFootSkate, maxDeltaChange: value.maxDeltaChange }])), transitions: transitionResults, consoleErrors }, null, 2));
  } finally {
    if (browser) await browser.close();
    await stopServer(server);
  }
}

main().catch((error) => { console.error(error); process.exit(1); });
