const assert = require('node:assert/strict');
const fs = require('node:fs');
const { chromium } = require('playwright');
const chrome = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const origin = process.env.NGA_TEST_ORIGIN || 'http://127.0.0.1:4188';

(async () => {
  const browser = await chromium.launch({ headless: true, ...(fs.existsSync(chrome) ? { executablePath: chrome } : {}) });
  try {
    const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
    await page.route('**/stages/fallen-capital/*.png', async route => { await new Promise(resolve => setTimeout(resolve, 6000)); await route.continue(); });
    await page.goto(`${origin}/versus-playtest.html?autostart=1&mode=stocks`, { waitUntil: 'domcontentloaded' });
    await page.waitForFunction(() => !!window.__versus, null, { timeout: 180000 });
    const loading = await page.evaluate(() => ({ host: getComputedStyle(document.querySelector('#tribunalStage')).display, canvas: getComputedStyle(document.querySelector('#stage')).display }));
    assert.equal(loading.host, 'none');
    assert.notEqual(loading.canvas, 'none');
    await page.waitForFunction(() => window.__versus.arena.stageLoaded === true, null, { timeout: 120000 });
    const ready = await page.evaluate(() => ({ host: getComputedStyle(document.querySelector('#tribunalStage')).display, canvas: getComputedStyle(document.querySelector('#stage')).display }));
    assert.notEqual(ready.host, 'none');
    assert.equal(ready.canvas, 'none');
    console.log('arena loading fallback passed');
  } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
