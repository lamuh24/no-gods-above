const assert = require('node:assert/strict');
const path = require('node:path');
const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: true, executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe' });
  try {
    const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
    page.setDefaultTimeout(180000);
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    for (const [character, length, special] of [
      ['swahili', 9, 'special_air_medium'],
      ['celeste', 8, 'ovation_descant']
    ]) {
      await page.goto(`http://127.0.0.1:4175/versus-playtest.html?arena=flat&screen=select&character=${character}&p2char=swahili`);
      await page.locator('#fight').click();
      await page.waitForFunction(() => !!window.__versus);
      await page.locator('#hudTutorialCombos').click();
      assert.equal(await page.locator('#tutorialProgress').textContent(), `1 / ${length}`);
      await page.evaluate(() => {
        const game = window.__versus;
        game.pause(true);
        game.state.fighters.p1.x = -30;
        game.state.fighters.p2.x = 30;
        const fighter = game.state.fighters.p1;
        const press = (frame, max = 80) => {
          const previous = fighter.currentMoveInstance;
          for (let tick = 0; tick < max; tick++) {
            game.queue('p1', tick % 3 === 0 ? frame : { right: true });
            game.step();
            if (fighter.currentMoveInstance !== previous && fighter.attackConnected) return true;
          }
          return false;
        };
        for (const frame of [{ light: true }, { medium: true }, { heavy: true }]) {
          if (!press(frame)) throw new Error(`Ground chain failed: ${fighter.comboRoute}`);
        }
      });
      assert.equal(await page.locator('#tutorialProgress').textContent(), `4 / ${length}`);
      await page.locator('#hudReset').click();
      const route = await page.evaluate(() => {
        const game = window.__versus;
        game.pause(true);
        game.state.fighters.p1.x = -30;
        game.state.fighters.p2.x = 30;
        const fighter = game.state.fighters.p1;
        const press = (frame, condition, max = 90) => {
          const previous = fighter.currentMoveInstance;
          for (let tick = 0; tick < max; tick++) {
            game.queue('p1', tick % 3 === 0 ? frame : { right: true });
            game.step();
            if (condition(previous)) return true;
          }
          return false;
        };
        if (!press({ down: true, heavy: true }, previous => fighter.currentMoveInstance !== previous && fighter.attackConnected)) throw new Error('Launcher failed');
        if (!press({ up: true, right: true }, () => fighter.phase === 'jump' && !fighter.grounded)) throw new Error('Jump chase failed');
        if (!press({ light: true, right: true }, previous => fighter.currentMoveInstance !== previous && fighter.attackConnected)) throw new Error('Air Light failed');
        if (!press({ medium: true, right: true }, previous => fighter.currentMoveInstance !== previous && fighter.attackConnected)) throw new Error('Air Medium failed');
        press({ special: true, medium: true }, () => document.querySelector('#tutorialStatus').textContent === 'Lesson complete');
        return [...fighter.comboRoute];
      });
      assert.equal(await page.locator('#tutorialStatus').textContent(), 'Lesson complete', `${character}: ${route}`);
      assert.ok(route.includes(special), `${character}: expected ${special} in ${route}`);
      await page.screenshot({ path: path.resolve(__dirname, `../docs/tutorial-v1/${character}-air-complete.png`) });
      console.log(`PASS ${character} full air combo: ${route.join(' → ')}`);
    }
    assert.deepEqual(errors, []);
  } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exit(1); });
