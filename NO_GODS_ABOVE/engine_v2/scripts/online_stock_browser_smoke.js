#!/usr/bin/env node
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { chromium } = require('playwright');

const origin = process.env.NGA_TEST_ORIGIN || 'http://127.0.0.1:4188';
const onlineMode = process.env.NGA_ONLINE_MODE === 'rounds' ? 'rounds' : 'stocks';
const shots = path.resolve(__dirname, `../docs/versus_playtest/captures/online-${onlineMode}-v1`);
fs.mkdirSync(shots, { recursive: true });
const chrome = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';

(async () => {
  const browser = await chromium.launch({ headless: true, ...(fs.existsSync(chrome) ? { executablePath: chrome } : {}) });
  const errors = [];
  const attach = page => page.on('pageerror', error => errors.push(error.message));
  try {
    const host = await browser.newPage({ viewport: { width: 1440, height: 900 } });
    attach(host);
    await host.goto(`${origin}/versus-playtest.html?screen=modes`, { waitUntil: 'domcontentloaded' });
    await host.locator('#modeStocks').waitFor();
    if (!process.env.NGA_ONLINE_ONLY) {
    await host.screenshot({ path: path.join(shots, 'modes.png') });
    await host.locator('#modeStocks').click();
    assert.equal(await host.locator('#stockCount').inputValue(), '3');
    await host.screenshot({ path: path.join(shots, 'stock-select.png') });
    await host.locator('#fight').click();
    await host.waitForFunction(() => !!window.__versus, null, { timeout: 180000 });
    await host.waitForFunction(() => window.__versus.arena.stageLoaded === true || window.__versus.arena.arenaId === 'flat', null, { timeout: 120000 });
    assert.equal(await host.evaluate(() => window.__versus.options.mode), 'stocks');
    await host.screenshot({ path: path.join(shots, 'stock-match.png') });
    const elevated = await host.evaluate(() => {
      window.__versus.pause(true);
      const f = window.__versus.state.fighters.p1;
      f.x = -240; f.y = -115; f.vx = 0; f.vy = 2; f.grounded = false; f.phase = 'jump';
      for (let i = 0; i < 25; i++) window.__versus.step();
      return { y: f.y, grounded: f.grounded };
    });
    assert.deepEqual(elevated, { y: -72, grounded: true }, 'left raised platform is playable');
    await host.screenshot({ path: path.join(shots, 'stock-upper-platform.png') });
    await host.evaluate(() => {
      const f = window.__versus.state.fighters.p1;
      f.x = window.__versus.state.matchConfig.versusRules.openPlatform.right + 2; f.grounded = false; f.vy = 5;
      for (let i = 0; i < 80; i++) window.__versus.step();
    });
    assert.equal(await host.evaluate(() => window.__versus.stockDirector.lives.p1), 2, 'fall removes one stock');
    await host.locator('#hudSelect').click();
    await host.locator('#backModes').click();
    }

    await host.locator('#modeOnline').click();
    await host.locator('#onlineHost').click();
    await host.waitForFunction(() => document.querySelector('#onlineStatus')?.textContent?.includes('ROOM OPEN'), null, { timeout: 30000 });
    const code = await host.locator('.online-room-code strong').textContent();
    assert.match(code, /^[A-Z2-9]{6}$/);
    await host.screenshot({ path: path.join(shots, 'online-host.png') });
    const guest = await browser.newPage({ viewport: { width: 1440, height: 900 } });
    attach(guest);
    await guest.goto(`${origin}/versus-playtest.html?online=${code}`, { waitUntil: 'domcontentloaded' });
    await Promise.all([
      host.waitForFunction(() => document.querySelector('#onlineStatus')?.textContent?.includes('RIVAL CONNECTED'), null, { timeout: 45000 }),
      guest.waitForFunction(() => document.querySelector('#onlineStatus')?.textContent?.includes('RIVAL CONNECTED'), null, { timeout: 45000 })
    ]).catch(async error => { throw new Error(`${error.message}; host=${await host.locator('#onlineStatus').textContent()}; guest=${await guest.locator('#onlineStatus').textContent()}; errors=${JSON.stringify(errors)}`); });
    if (onlineMode === 'rounds') {
      await host.locator('#onlineMode').selectOption('rounds');
      await guest.waitForFunction(() => document.querySelector('.online-rules-readout')?.textContent?.includes('ROUNDS'), null, { timeout: 15000 });
    }
    await guest.locator('[data-side="p2"][data-online-pick="celeste"]').click();
    await guest.locator('#onlineReady').click();
    await host.locator('#onlineStart:not([disabled])').waitFor({ timeout: 15000 });
    assert.equal(await host.locator('.online-fighter.p2 strong').textContent(), 'CELESTE');
    await guest.screenshot({ path: path.join(shots, 'online-guest-ready.png') });
    await host.locator('#onlineStart').click();
    await Promise.all([
      host.waitForFunction(() => !!window.__versus, null, { timeout: 180000 }),
      guest.waitForFunction(() => !!window.__versus, null, { timeout: 180000 })
    ]);
    await Promise.all([
      host.waitForFunction(() => window.__versus.arena.stageLoaded === true || window.__versus.arena.arenaId === 'flat', null, { timeout: 120000 }),
      guest.waitForFunction(() => window.__versus.arena.stageLoaded === true || window.__versus.arena.arenaId === 'flat', null, { timeout: 120000 })
    ]);
    await host.waitForFunction(() => window.__versus.state.tick > 30, null, { timeout: 30000 });
    await guest.waitForFunction(() => window.__versus.state.tick > 30, null, { timeout: 30000 });
    assert.equal(await host.evaluate(() => window.__versus.options.mode), onlineMode);
    assert.equal(await guest.evaluate(() => window.__versus.options.mode), onlineMode);
    assert.equal(await host.evaluate(() => window.__versus.chosen.p2), 'celeste');
    assert.equal(await guest.evaluate(() => window.__versus.chosen.p2), 'celeste');
    await host.waitForFunction(() => (window.__versus.stockDirector || window.__versus.director).phase === 'fight', null, { timeout: 30000 });
    const beforeX = await host.evaluate(() => window.__versus.state.fighters.p2.x);
    await guest.keyboard.down('d');
    await guest.waitForTimeout(300);
    await guest.keyboard.up('d');
    const afterX = await host.evaluate(() => window.__versus.state.fighters.p2.x);
    assert(afterX > beforeX + 2, `guest movement reached the host simulation: ${beforeX} -> ${afterX}; host ${JSON.stringify(await host.evaluate(() => [window.__versus.online, window.__versus.onlineInput]))}; guest ${JSON.stringify(await guest.evaluate(() => [window.__versus.online, window.__versus.onlineInput]))}; phase ${await host.evaluate(() => (window.__versus.stockDirector || window.__versus.director).phase)}`);
    const beforeMove = await host.evaluate(() => window.__versus.state.fighters.p2.currentMoveInstance);
    await guest.keyboard.press('j', { delay: 50 });
    await host.waitForFunction(before => window.__versus.state.fighters.p2.currentMoveInstance > before, beforeMove, { timeout: 5000 });
    const ticks = await Promise.all([host.evaluate(() => window.__versus.state.tick), guest.evaluate(() => window.__versus.state.tick)]);
    assert(Math.abs(ticks[0] - ticks[1]) < 15, `host/guest simulation is synchronized: ${ticks}`);
    await host.screenshot({ path: path.join(shots, 'online-match-host.png') });
    await guest.screenshot({ path: path.join(shots, 'online-match-guest.png') });
    assert.deepEqual(errors, []);
    console.log('online stock browser smoke passed', { code, ticks, guestMovement: [beforeX, afterX], screenshots: shots });
  } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
