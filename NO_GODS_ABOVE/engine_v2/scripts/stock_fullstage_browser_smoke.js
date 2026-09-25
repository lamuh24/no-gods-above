#!/usr/bin/env node
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { chromium } = require('playwright');

const origin = process.env.NGA_TEST_ORIGIN || 'http://127.0.0.1:4188';
const shots = path.resolve(__dirname, '../docs/versus_playtest/captures/stock-fullstage-v2');
const chrome = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
fs.mkdirSync(shots, { recursive: true });

(async () => {
  const browser = await chromium.launch({ headless: true, ...(fs.existsSync(chrome) ? { executablePath: chrome } : {}) });
  const errors = [];
  try {
    const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
    page.on('pageerror', error => errors.push(error.message));
    async function open(mode) {
      await page.goto(`${origin}/versus-playtest.html?mode=${mode}&autostart=1&p2=human`, { waitUntil: 'domcontentloaded' });
      await page.waitForFunction(() => !!window.__versus && window.__versus.arena.stageLoaded === true, null, { timeout: 180000 });
      return page.evaluate(() => {
        window.__versus.pause(false);
        const { p1, p2 } = window.__versus.state.fighters;
        for (const [fighter, x] of [[p1, -110], [p2, 110]]) {
          fighter.x = x; fighter.y = 0; fighter.vx = 0; fighter.vy = 0; fighter.grounded = true;
          fighter.phase = 'idle'; fighter.currentAttack = null;
        }
        for (let i = 0; i < 95; i++) window.__versus.step();
        window.__versus.pause(true);
        return { arena: window.__versus.arena, canvasWidth: document.querySelector('#stage').width };
      });
    }
    const rounds = await open('rounds');
    await page.screenshot({ path: path.join(shots, 'rounds-reference.png') });
    const stock = await open('stocks');
    await page.screenshot({ path: path.join(shots, 'stock-center.png') });
    assert.equal(rounds.arena.cameraDistance, stock.arena.cameraDistance, 'center camera matches regular 1v1');
    assert.equal(stock.arena.bounds.left, -900);
    assert.equal(stock.arena.bounds.right, 900);
    assert.equal(stock.canvasWidth, 2700, 'full stage combat texture covers both ends');

    const right = await page.evaluate(() => {
      const { p1, p2 } = window.__versus.state.fighters;
      p1.x = 860; p2.x = 790;
      window.__versus.step();
      return window.__versus.arena;
    });
    assert(right.cameraTarget[0] > 13, 'camera follows the far right edge');
    await page.screenshot({ path: path.join(shots, 'stock-right-dropoff.png') });

    const left = await page.evaluate(() => {
      const { p1, p2 } = window.__versus.state.fighters;
      p1.x = -860; p2.x = -790;
      window.__versus.step();
      return window.__versus.arena;
    });
    assert(left.cameraTarget[0] < -13, 'camera follows the far left edge');
    await page.screenshot({ path: path.join(shots, 'stock-left-dropoff.png') });

    const wide = await page.evaluate(() => {
      const { p1, p2 } = window.__versus.state.fighters;
      p1.x = -850; p2.x = 850;
      window.__versus.step();
      return { arena: window.__versus.arena, p1: window.__versus.project(p1.x, p1.y), p2: window.__versus.project(p2.x, p2.y) };
    });
    assert(wide.arena.cameraDistance > 35, 'camera zooms out when fighters split across the full stage');
    assert(wide.p1.x > 0 && wide.p1.x < 1600 && wide.p2.x > 0 && wide.p2.x < 1600, 'both far-end fighters remain on screen');
    await page.screenshot({ path: path.join(shots, 'stock-full-zoom.png') });

    await page.evaluate(() => {
      const f = window.__versus.state.fighters.p1;
      f.x = 902; f.y = 0; f.vx = 0; f.vy = 5; f.grounded = false; f.phase = 'jump';
      for (let i = 0; i < 80; i++) window.__versus.step();
    });
    assert.equal(await page.evaluate(() => window.__versus.stockDirector.lives.p1), 2, 'falling beyond the full slab removes a stock');
    assert.deepEqual(errors, []);
    console.log('full-size stock stage browser smoke passed', { origin, roundsDistance: rounds.arena.cameraDistance, stockDistance: stock.arena.cameraDistance, rightTargetX: right.cameraTarget[0], wideDistance: wide.arena.cameraDistance, screenshots: shots });
  } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
