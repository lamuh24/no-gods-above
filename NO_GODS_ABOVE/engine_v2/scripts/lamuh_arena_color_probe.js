#!/usr/bin/env node
// Dumps a deterministic sample of the rendered 3D arena so a presentation change can be
// proven pixel-equivalent instead of eyeballed. Usage: node scripts/lamuh_arena_color_probe.js out.json
const fs = require('fs');
const http = require('http');
const net = require('net');
const path = require('path');
const { spawn } = require('child_process');
const { chromium } = require('playwright');

const root = path.resolve(__dirname, '..');
const outFile = process.argv[2] || path.join(root, 'artifacts', 'lamuh-arena-color.json');
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
    let launchError;
    for (const channel of ['chrome', 'msedge', undefined]) {
      try { browser = await chromium.launch(channel ? { channel } : {}); break; } catch (error) { launchError = error; }
    }
    if (!browser) throw launchError;
    const page = await browser.newPage({ viewport: { width: 1400, height: 900 } });
    page.on('pageerror', (error) => console.log('PAGE ERROR', error.message));
    await page.goto(`${origin}/lamuh-legacy-sandbox.html`, { waitUntil: 'load' });
    await page.waitForFunction(() => !!window.lamuhSandbox, null, { timeout: 300000 });

    const sample = await page.evaluate(async () => {
      const sandbox = window.lamuhSandbox;
      sandbox.pause();
      sandbox.reset(4242);
      // A fixed pose with the actor mid-attack, so sprites, VFX and backdrop all contribute.
      sandbox.queue({ light: true });
      for (let index = 0; index < 6; index++) await sandbox.step();
      await sandbox.render();
      await new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)));
      const webgl = [...document.querySelectorAll('canvas')].find((canvas) => {
        try { return !!canvas.getContext('webgl2'); } catch (error) { return false; }
      });
      const probe = document.createElement('canvas');
      probe.width = 140; probe.height = 78;
      const context = probe.getContext('2d');
      context.drawImage(webgl, 0, 0, probe.width, probe.height);
      const pixels = [...context.getImageData(0, 0, probe.width, probe.height).data];
      return { width: probe.width, height: probe.height, pixels, tick: sandbox.getState().tick };
    });
    fs.mkdirSync(path.dirname(outFile), { recursive: true });
    fs.writeFileSync(outFile, JSON.stringify(sample));
    const nonBlack = sample.pixels.filter((value, index) => index % 4 !== 3 && value > 8).length;
    console.log(`wrote ${outFile} tick=${sample.tick} samples=${sample.pixels.length / 4} litChannels=${nonBlack}`);
  } finally {
    if (browser) await browser.close();
    server.kill();
  }
})();
