#!/usr/bin/env node
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { chromium } = require('playwright');

const origin = process.argv[2] || process.env.NGA_TEST_ORIGIN || 'http://127.0.0.1:4194';
const shots = process.argv[3] || process.env.NGA_TEST_SHOTS || path.join(process.env.TEMP || '.', 'nga-swahili-paid-super-smoke');
const chrome = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
fs.mkdirSync(shots, { recursive: true });

(async () => {
  const browser = await chromium.launch({ headless: true, ...(fs.existsSync(chrome) ? { executablePath: chrome } : {}) });
  const errors = [], failed = [];
  try {
    const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
    page.on('pageerror', error => errors.push(error.message));
    page.on('requestfailed', request => failed.push(`${request.method()} ${request.url()} ${request.failure()?.errorText}`));
    for (const side of ['p1', 'p2']) {
      const query = side === 'p1' ? 'character=swahili&p2char=lamuh' : 'character=lamuh&p2char=swahili';
      await page.goto(`${origin}/versus-playtest.html?${query}&mode=stocks&autostart=1&p2=human`, { waitUntil: 'domcontentloaded' });
      await page.waitForFunction(() => window.__versus?.arena?.stageLoaded === true, null, { timeout: 180000 });
      await page.addStyleTag({ content: '.pause-banner { display: none !important; }' });
      await page.evaluate(side => {
        window.__versus.pause(false);
        for (let i = 0; i < 180 && window.__versus.stockDirector?.inputsLocked; i++) window.__versus.step();
        if (window.__versus.stockDirector?.inputsLocked) throw new Error('Stock intro did not unlock inputs');
        const a = window.__versus.state.fighters[side];
        const d = window.__versus.state.fighters[side === 'p1' ? 'p2' : 'p1'];
        Object.assign(a, { x: side === 'p1' ? -100 : 100, y: 0, vx: 0, vy: 0, facing: side === 'p1' ? 1 : -1, grounded: true, phase: 'idle', currentAttack: null, tension: 100 });
        Object.assign(d, { x: side === 'p1' ? 100 : -100, y: 0, vx: 0, vy: 0, facing: side === 'p1' ? -1 : 1, grounded: true, phase: 'idle', currentAttack: null, health: 1000 });
      }, side);
      const key = side === 'p1' ? 'p' : 'Numpad0';
      await page.keyboard.down(key);
      const start = await page.evaluate(side => {
        window.__versus.step();
        const f = window.__versus.state.fighters[side];
        return { attack: f.currentAttack, tension: f.tension, spent: f.tensionSpent };
      }, side);
      await page.keyboard.up(key);
      assert.equal(start.attack, 'swahili_paid_super', `${side}: keyboard super starts`);
      assert.equal(start.tension, 0, `${side}: full meter spent`);
      assert.equal(start.spent, 100, `${side}: meter spent once`);
      await page.evaluate(() => { for (let i = 0; i < 19; i++) window.__versus.step(); });
      await page.screenshot({ path: path.join(shots, `${side}-contract-token.png`) });
      const outcome = await page.evaluate(side => {
        for (let i = 0; i < 25; i++) window.__versus.step();
        const state = window.__versus.state;
        return { health: state.fighters[side === 'p1' ? 'p2' : 'p1'].health, event: state.lastCombatEvent?.attackId, faults: document.querySelector('#engineFaults')?.textContent };
      }, side);
      assert.equal(outcome.health, 820, `${side}: super damages opponent once`);
      assert.equal(outcome.event, 'swahili_paid_super', `${side}: combat event attributed to super`);
      await page.screenshot({ path: path.join(shots, `${side}-after-hit.png`) });
    }
    assert.deepEqual(errors, [], 'browser errors');
    assert.deepEqual(failed, [], 'failed asset requests');
    console.log(JSON.stringify({ result: 'PASS', origin, shots, errors, failed }));
  } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
