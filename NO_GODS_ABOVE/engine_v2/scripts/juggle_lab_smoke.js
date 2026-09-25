#!/usr/bin/env node
// Live browser evidence for the Juggle Animation Lab: plays every scripted route in a real
// WebGL2 page, proves the attacker changes pose while the opponent is juggled, and captures one
// screenshot per distinct attacker pose of the primary route.
const assert = require('assert');
const { chromium } = require('playwright');
const { spawn } = require('child_process');
const fs = require('fs');
const net = require('net');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const OUT_DIR = path.join(ROOT, 'docs', 'juggle_lab');
const VITE_BIN = path.join(ROOT, 'node_modules', 'vite', 'bin', 'vite.js');
const PRIMARY_ROUTE = 'air_light_medium_heavy';
const ROUTES = [PRIMARY_ROUTE, 'air_five_action', 'air_heavy_only', 'ground_chain'];
const MAX_TICKS = 400;

fs.mkdirSync(OUT_DIR, { recursive: true });

function wait(ms) { return new Promise((resolve) => setTimeout(resolve, ms)); }
function availablePort() { return new Promise((resolve, reject) => { const probe = net.createServer(); probe.once('error', reject); probe.listen(0, '127.0.0.1', () => { const address = probe.address(); const port = typeof address === 'object' && address ? address.port : 0; probe.close(() => resolve(port)); }); }); }
async function waitForServer(url) { for (let index = 0; index < 80; index++) { try { const response = await fetch(url); if (response.ok) return; } catch (_) {} await wait(250); } throw new Error(`Timed out waiting for ${url}`); }
async function stopServer(server) { if (!server || server.exitCode !== null) return; server.kill('SIGTERM'); await Promise.race([new Promise((resolve) => server.once('exit', resolve)), wait(3000)]); if (server.exitCode === null) server.kill('SIGKILL'); }

/** Prefers Playwright's bundled Chromium, then a locally installed Chrome or Edge. */
async function launchBrowser() {
  const attempts = [undefined, 'chrome', 'msedge'];
  const failures = [];
  for (const channel of attempts) {
    try {
      const browser = await chromium.launch({ headless: true, ...(channel ? { channel } : {}) });
      return { browser, channel: channel ?? 'bundled-chromium' };
    } catch (error) {
      failures.push(`${channel ?? 'bundled-chromium'}: ${error.message.split('\n')[0]}`);
    }
  }
  throw new Error(`No usable Chromium build found. ${failures.join(' | ')}`);
}

async function playRoute(page, routeId) {
  return page.evaluate(({ routeId, maxTicks }) => {
    const lab = window.__NGA_JUGGLE_LAB__;
    lab.setPaused(true);
    lab.selectRoute(routeId);
    lab.restart();
    for (let index = 0; index < maxTicks; index++) {
      lab.advance(1);
      if (lab.snapshot().status.loops > 0) break;
    }
    const snapshot = lab.snapshot();
    // The finished loop is preserved as lastLoop; the live counters already belong to the next one.
    return { ...snapshot.lastLoop, status: snapshot.status };
  }, { routeId, maxTicks: MAX_TICKS });
}

async function captureRoutePoses(page, routeId) {
  await page.evaluate((routeId) => {
    const lab = window.__NGA_JUGGLE_LAB__;
    lab.setPaused(true);
    lab.selectRoute(routeId);
    lab.restart();
  }, routeId);

  const captured = [];
  for (let index = 0; index < MAX_TICKS; index++) {
    const marker = await page.evaluate(() => {
      const lab = window.__NGA_JUGGLE_LAB__;
      lab.advance(1);
      const snapshot = lab.snapshot();
      const entry = snapshot.frameLog.at(-1);
      return { loops: snapshot.status.loops, entry };
    });
    if (marker.loops > 0) break;
    const entry = marker.entry;
    if (!entry || entry.phase === 'none' || entry.ticks !== 1) continue;
    if (captured.some((item) => item.frame === entry.frame)) continue;
    const name = `${String(captured.length + 1).padStart(2, '0')}_${entry.attack}_${entry.phase}_${entry.frame}.png`;
    await page.locator('#viewport').screenshot({ path: path.join(OUT_DIR, name) });
    captured.push({ ...entry, screenshot: name });
  }
  return captured;
}

async function main() {
  const port = await availablePort();
  const url = `http://127.0.0.1:${port}/juggle-lab.html`;
  const server = spawn(process.execPath, [VITE_BIN, '--host', '127.0.0.1', '--port', String(port), '--strictPort'], { cwd: ROOT, stdio: ['ignore', 'pipe', 'pipe'], windowsHide: true });
  server.stdout.on('data', () => {});
  server.stderr.on('data', () => {});
  let browser;
  try {
    await waitForServer(url);
    const launched = await launchBrowser();
    browser = launched.browser;
    const page = await browser.newPage({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1 });
    const consoleErrors = [];
    const consoleWarnings = [];
    page.on('console', (message) => {
      if (message.type() === 'error') consoleErrors.push(message.text());
      if (message.type() === 'warning') consoleWarnings.push(message.text());
    });
    page.on('pageerror', (error) => consoleErrors.push(error.message));
    const failedRequests = [];
    page.on('response', (response) => { if (response.status() >= 400) failedRequests.push(`${response.status()} ${response.url()}`); });

    await page.goto(url, { waitUntil: 'networkidle' });
    await page.waitForFunction(() => !!window.__NGA_JUGGLE_LAB__, null, { timeout: 60000 });
    await page.evaluate(() => window.__NGA_JUGGLE_LAB__.stageReady);

    const routes = {};
    for (const routeId of ROUTES) {
      const snapshot = await playRoute(page, routeId);
      assert.strictEqual(snapshot.status.desyncs, 0, `${routeId} desynced: ${snapshot.status.lastDesync}`);
      assert.deepStrictEqual(snapshot.observedAttacks, snapshot.expectedAttacks, `${routeId} did not play its declared attacks`);
      assert.ok(snapshot.attackFrames.length >= 6, `${routeId} showed only ${snapshot.attackFrames.length} attacker poses`);
      assert.ok(!snapshot.attackFrames.some((frame) => frame.startsWith('idle_')), `${routeId} held an idle pose during an attack`);
      routes[routeId] = {
        attackFrames: snapshot.attackFrames,
        distinctFrames: snapshot.distinctFrames.length,
        observedAttacks: snapshot.observedAttacks,
        peakComboCount: snapshot.peakComboCount,
        peakJuggleSpent: snapshot.peakJuggleSpent,
        knockdownSeen: snapshot.knockdownSeen
      };
    }

    const captures = await captureRoutePoses(page, PRIMARY_ROUTE);
    assert.ok(captures.length >= 8, `expected at least 8 captured attacker poses, got ${captures.length}`);

    const report = {
      contract: 'juggle_animation_lab_v1',
      status: 'candidate_only',
      deployable: false,
      page: '/juggle-lab.html',
      browser: launched.channel,
      viewport: { width: 1440, height: 900 },
      routes,
      primaryRoute: PRIMARY_ROUTE,
      captures,
      consoleErrors,
      consoleWarnings,
      failedRequests
    };
    fs.writeFileSync(path.join(OUT_DIR, 'juggle_lab_smoke_report.json'), `${JSON.stringify(report, null, 2)}\n`);

    assert.deepStrictEqual(consoleErrors, [], `browser console errors: ${consoleErrors.join(' | ')}`);
    console.log(`PASS juggle lab smoke: ${ROUTES.length} routes, ${captures.length} captured attacker poses in ${OUT_DIR}`);
  } finally {
    if (browser) await browser.close();
    await stopServer(server);
  }
}

main().catch((error) => { console.error(error); process.exit(1); });
