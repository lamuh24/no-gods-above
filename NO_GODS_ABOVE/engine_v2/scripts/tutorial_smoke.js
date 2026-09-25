const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { chromium } = require('playwright');

(async () => {
  const output = path.resolve(__dirname, '../docs/tutorial-v1');
  fs.mkdirSync(output, { recursive: true });
  const browser = await chromium.launch({ headless: true, executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe' });
  try {
    const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
    page.setDefaultTimeout(180000);
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    await page.goto('http://127.0.0.1:4175/versus-playtest.html?arena=flat');
    await page.locator('#startTutorial').waitFor();
    await page.screenshot({ path: path.join(output, 'title.png') });
    await page.locator('#startTutorial').click();
    await page.waitForFunction(() => !!window.__versus);
    assert.equal(await page.locator('#tutorialProgress').textContent(), '1 / 4');
    await page.screenshot({ path: path.join(output, 'basics.png') });

    await page.evaluate(() => {
      const game = window.__versus;
      game.pause(true);
      for (let i = 0; i < 8; i++) { game.queue('p1', { right: true }); game.step(); }
    });
    assert.equal(await page.locator('#tutorialProgress').textContent(), '2 / 4');
    await page.evaluate(() => { const game = window.__versus; game.queue('p1', { up: true }); for (let i = 0; i < 7; i++) game.step(); });
    assert.equal(await page.locator('#tutorialProgress').textContent(), '3 / 4');
    await page.evaluate(() => { const game = window.__versus; for (let i = 0; i < 70; i++) game.step(); });
    await page.keyboard.press('ShiftLeft');
    await page.evaluate(() => { const game = window.__versus; for (let i = 0; i < 8; i++) game.step(); });
    assert.equal(await page.locator('#tutorialProgress').textContent(), '4 / 4');

    await page.evaluate(() => {
      const game = window.__versus;
      game.state.fighters.p1.x = -45;
      game.state.fighters.p2.x = 45;
      game.queue('p1', { light: true });
      for (let i = 0; i < 10; i++) game.step();
    });
    assert.equal(await page.locator('#tutorialStatus').textContent(), 'Lesson complete');

    await page.locator('#tutorialCombos').click();
    await page.locator('#hudReset').click();
    await page.evaluate(() => {
      const game = window.__versus;
      game.pause(true);
      game.state.fighters.p1.x = -45;
      game.state.fighters.p2.x = 45;
      game.queue('p1', { light: true });
      for (let i = 0; i < 8; i++) game.step();
    });
    assert.equal(await page.locator('#tutorialProgress').textContent(), '2 / 10');
    await page.evaluate(() => { const game = window.__versus; game.queue('p1', { medium: true }); for (let i = 0; i < 10; i++) game.step(); });
    assert.equal(await page.locator('#tutorialProgress').textContent(), '3 / 10');
    await page.evaluate(() => { const game = window.__versus; game.queue('p1', { heavy: true }); for (let i = 0; i < 14; i++) game.step(); });
    assert.equal(await page.locator('#tutorialProgress').textContent(), '4 / 10');
    await page.locator('#hudReset').click();
    await page.evaluate(() => {
      const game = window.__versus;
      game.state.fighters.p1.x = -30;
      game.state.fighters.p2.x = 30;
      game.queue('p1', { down: true, heavy: true });
      for (let i = 0; i < 20; i++) game.step();
    });
    assert.equal(await page.locator('#tutorialProgress').textContent(), '5 / 10');
    await page.evaluate(() => {
      const game = window.__versus;
      const fighter = game.state.fighters.p1;
      const press = (frame, condition, max = 80) => {
        const previous = fighter.currentMoveInstance;
        for (let tick = 0; tick < max; tick++) {
          game.queue('p1', tick % 3 === 0 ? frame : { right: true });
          game.step();
          if (condition(previous)) return true;
        }
        return false;
      };
      if (!press({ up: true, right: true }, () => fighter.phase === 'jump' && !fighter.grounded)) throw new Error('Launcher jump chase failed');
      if (!press({ light: true, right: true }, previous => fighter.currentMoveInstance !== previous && fighter.attackConnected)) throw new Error('Air Light failed');
      if (!press({ medium: true, right: true }, previous => fighter.currentMoveInstance !== previous && fighter.attackConnected)) throw new Error('Air Medium failed');
      if (!press({ special: true, medium: true }, previous => fighter.currentMoveInstance !== previous && fighter.attackConnected)) throw new Error('Radiant Dive Medium failed');
      if (!press({ light: true, right: true }, previous => fighter.currentMoveInstance !== previous && fighter.attackConnected)) throw new Error('Rebound air Light failed');
      if (!press({ heavy: true, right: true }, previous => fighter.currentMoveInstance !== previous && fighter.attackConnected)) throw new Error('Finishing air Heavy failed');
    });
    assert.equal(await page.locator('#tutorialStatus').textContent(), 'Lesson complete');
    assert.deepEqual(await page.evaluate(() => window.__versus.state.fighters.p1.comboRoute.slice(-6)), ['crouching_heavy', 'air_light', 'air_medium', 'legacy_radiant_dive_medium', 'air_light', 'air_heavy']);
    await page.screenshot({ path: path.join(output, 'combos-complete.png') });

    await page.locator('#tutorialClose').click();
    assert.equal(await page.locator('#tutorialPanel').isVisible(), false);
    await page.locator('#hudTutorialBasics').click();
    assert.equal(await page.locator('#tutorialProgress').textContent(), '1 / 4');

    await page.locator('#hudSelect').click();
    await page.locator('#backModes').click();
    assert.equal(await page.locator('#modeBasics').count(), 1);
    assert.equal(await page.locator('#modeCombos').count(), 1);
    await page.setViewportSize({ width: 390, height: 844 });
    await page.screenshot({ path: path.join(output, 'modes-mobile.png'), fullPage: true });
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true);
    await page.locator('#modeCombos').click();
    await page.waitForFunction(() => !!window.__versus);
    assert.equal(await page.locator('#tutorialProgress').textContent(), '1 / 10');
    assert.deepEqual(errors, []);
    console.log('PASS tutorial basics, full ground-to-air combo with air special, entry points, mobile layout');
  } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exit(1); });
