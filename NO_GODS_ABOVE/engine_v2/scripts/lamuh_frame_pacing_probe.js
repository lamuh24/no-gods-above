#!/usr/bin/env node
// Measures real presentation pacing of the Lamuh playtest: animation-frame deltas and how
// many simulation ticks actually advance per wall-clock second, in a browser we control.
const http = require('http');
const net = require('net');
const path = require('path');
const { spawn } = require('child_process');
const { chromium } = require('playwright');

const root = path.resolve(__dirname, '..');
function availablePort() { return new Promise((resolve, reject) => { const server = net.createServer(); server.once('error', reject); server.listen(0, '127.0.0.1', () => { const address = server.address(); server.close(() => resolve(address.port)); }); }); }
function waitForHttp(url, attempts = 80) { return new Promise((resolve, reject) => { const poll = (remaining) => { http.get(url, (response) => { response.resume(); if (response.statusCode === 200) resolve(); else if (remaining) setTimeout(() => poll(remaining - 1), 100); else reject(new Error(`HTTP ${response.statusCode}`)); }).on('error', (error) => remaining ? setTimeout(() => poll(remaining - 1), 100) : reject(error)); }; poll(attempts); }); }

(async () => {
  const port = await availablePort();
  const viteBin = path.join(root, 'node_modules', 'vite', 'bin', 'vite.js');
  const server = spawn(process.execPath, [viteBin, '--host', '127.0.0.1', '--port', String(port), '--strictPort'], { cwd: root, stdio: ['ignore', 'pipe', 'pipe'], windowsHide: true });
  let browser;
  try {
    const origin = `http://127.0.0.1:${port}`;
    await waitForHttp(`${origin}/lamuh-legacy-sandbox.html`);
    // Use an installed Chrome/Edge rather than a downloaded bundle; either presents real frames.
    let launchError;
    for (const channel of ['chrome', 'msedge', undefined]) {
      try { browser = await chromium.launch(channel ? { channel } : {}); break; } catch (error) { launchError = error; }
    }
    if (!browser) throw launchError;
    const page = await browser.newPage({ viewport: { width: 1400, height: 900 } });
    page.on('pageerror', (error) => console.log('PAGE ERROR', error.message));
    await page.goto(`${origin}/lamuh-legacy-sandbox.html${process.argv[2] || ''}`, { waitUntil: 'load' });
    await page.waitForFunction(() => !!window.lamuhSandbox, null, { timeout: 300000 });
    await page.waitForTimeout(500);
    // The 3D arena view starts paused by design; press Play before measuring live pacing.
    await page.evaluate(() => { const button = document.querySelector('#pause'); if (button && button.textContent === 'Play') button.click(); });
    await page.waitForTimeout(300);
    if (process.env.UPLOAD_EVERY) await page.evaluate((n) => { globalThis.__uploadEvery = Number(n); }, process.env.UPLOAD_EVERY);

    const sample = await page.evaluate(async () => {
      const sandbox = window.lamuhSandbox;
      const startTick = sandbox.getState().tick;
      const deltas = [];
      let last = performance.now();
      const startedAt = last;
      await new Promise((resolve) => {
        function frame() {
          const now = performance.now();
          deltas.push(now - last);
          last = now;
          if (now - startedAt < 3000) requestAnimationFrame(frame); else resolve();
        }
        requestAnimationFrame(frame);
      });
      const elapsed = performance.now() - startedAt;
      const ticks = sandbox.getState().tick - startTick;
      const sorted = deltas.slice(1).sort((a, b) => a - b);
      const sum = sorted.reduce((a, b) => a + b, 0);
      return {
        frames: sorted.length,
        elapsedMs: Math.round(elapsed),
        avgFrameMs: +(sum / sorted.length).toFixed(2),
        medianFrameMs: +sorted[Math.floor(sorted.length / 2)].toFixed(2),
        p95FrameMs: +sorted[Math.floor(sorted.length * 0.95)].toFixed(2),
        worstFrameMs: +sorted[sorted.length - 1].toFixed(2),
        renderFps: +(1000 / (sum / sorted.length)).toFixed(1),
        simTicks: ticks,
        simHz: +(ticks / (elapsed / 1000)).toFixed(1)
      };
    });
    console.log(JSON.stringify(sample, null, 2));
    const drift = Math.abs(sample.simHz - 60);
    if (drift > 6) { console.log(`FAIL simulation ran at ${sample.simHz} Hz, expected ~60`); process.exitCode = 1; }
    else if (sample.renderFps < 45) { console.log(`FAIL presented ${sample.renderFps} fps`); process.exitCode = 1; }
    else console.log(`PASS ${sample.renderFps} fps presented, simulation ${sample.simHz} Hz`);
  } finally {
    if (browser) await browser.close();
    server.kill();
  }
})();
