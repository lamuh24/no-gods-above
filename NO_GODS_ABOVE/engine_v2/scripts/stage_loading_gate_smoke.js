const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { chromium } = require('playwright');

const origin = process.argv[2] || 'http://127.0.0.1:4221';
const output = path.resolve(__dirname, '../docs/stage-loading-gate');
fs.mkdirSync(output, { recursive: true });

async function within(promise, ms, message) {
  let timer;
  try {
    return await Promise.race([promise, new Promise((_, reject) => { timer = setTimeout(() => reject(new Error(message)), ms); })]);
  } finally {
    clearTimeout(timer);
  }
}

async function main() {
  const browser = await chromium.launch({
    headless: true,
    executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe'
  });
  const errors = [];
  try {
    const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
    page.setDefaultTimeout(180000);
    page.on('pageerror', error => errors.push(error.message));
    let releaseStage;
    let stageRequested;
    const heldStage = new Promise(resolve => { stageRequested = resolve; });
    const stageGate = new Promise(resolve => { releaseStage = resolve; });
    await page.route('**/stages/fallen-capital/background.png', async route => {
      stageRequested();
      await stageGate;
      await route.continue();
    });
    await page.goto(`${origin}/versus-playtest.html?arena=fallen-capital&autostart=1`, { waitUntil: 'domcontentloaded' });
    await within(heldStage, 180000, 'Stage art was never requested');
    await page.locator('.match.stage-loading').waitFor();
    assert.equal(await page.locator('.match').getAttribute('data-stage-ready'), null);
    assert.equal(await page.locator('#stageLoading').isVisible(), true);
    assert.equal(await page.locator('.gameplay-viewport').evaluate(el => getComputedStyle(el).visibility), 'hidden');
    await page.waitForTimeout(500);
    assert.equal(await page.evaluate(() => window.__versus.state.tick), 0, 'simulation must wait for stage art');
    await page.screenshot({ path: path.join(output, 'stage-loading.png') });

    releaseStage();
    await page.locator('.match[data-stage-ready="true"]').waitFor();
    assert.equal(await page.locator('#stageLoading').count(), 0);
    assert.equal(await page.locator('#tribunalStage').getAttribute('data-arena-ready'), 'true');
    assert.equal(await page.locator('.gameplay-viewport').evaluate(el => getComputedStyle(el).visibility), 'visible');
    await page.waitForFunction(() => window.__versus.state.tick > 0);
    await page.screenshot({ path: path.join(output, 'stage-ready.png') });
    await page.close();

    const tutorial = await browser.newPage({ viewport: { width: 1440, height: 900 } });
    tutorial.setDefaultTimeout(180000);
    tutorial.on('pageerror', error => errors.push(error.message));
    let releaseTutorialStage;
    const tutorialGate = new Promise(resolve => { releaseTutorialStage = resolve; });
    await tutorial.route('**/stages/fallen-capital/background.png', async route => {
      await tutorialGate;
      await route.continue();
    });
    await tutorial.goto(`${origin}/versus-playtest.html?arena=fallen-capital`, { waitUntil: 'domcontentloaded' });
    await tutorial.locator('#enterGame').click();
    await tutorial.locator('#modeCombos').click();
    await tutorial.locator('.match.stage-loading').waitFor();
    assert.equal(await tutorial.locator('.gameplay-viewport').evaluate(el => getComputedStyle(el).visibility), 'hidden');
    releaseTutorialStage();
    await tutorial.locator('.match[data-stage-ready="true"]').waitFor();
    assert.equal(await tutorial.locator('#tutorialProgress').textContent(), '1 / 10');
    await tutorial.close();

    const fallback = await browser.newPage();
    fallback.setDefaultTimeout(180000);
    fallback.on('pageerror', error => errors.push(error.message));
    await fallback.route('**/stages/fallen-capital/background.png', route => route.abort());
    await fallback.goto(`${origin}/versus-playtest.html?arena=fallen-capital&autostart=1`, { waitUntil: 'domcontentloaded' });
    await fallback.locator('.match[data-stage-ready="true"]').waitFor();
    assert.match(await fallback.locator('#arenaLabel').textContent(), /stage unavailable/);
    assert.equal(await fallback.locator('#stageLoading').count(), 0);
    assert.equal(await fallback.locator('#stage').isVisible(), true);
    await fallback.close();

    const flat = await browser.newPage();
    flat.setDefaultTimeout(180000);
    flat.on('pageerror', error => errors.push(error.message));
    await flat.goto(`${origin}/versus-playtest.html?arena=flat&autostart=1`, { waitUntil: 'domcontentloaded' });
    await flat.locator('.match[data-stage-ready="true"]').waitFor();
    assert.equal(await flat.locator('#stageLoading').count(), 0);
    assert.equal(await flat.locator('#stage').isVisible(), true);
    await flat.close();

    assert.deepEqual(errors, [], 'browser page errors');
    console.log(JSON.stringify({ delayedStage: 'pass', comboTutorial: 'pass', failedStageFallback: 'pass', flatArena: 'pass', screenshots: output, pageErrors: errors.length }));
  } finally {
    await browser.close();
  }
}

main().catch(error => { console.error(error); process.exitCode = 1; });
