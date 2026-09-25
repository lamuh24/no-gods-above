const assert = require('assert');
const fs = require('fs');
const path = require('path');
const { chromium } = require('playwright');
const root = path.resolve(__dirname, '../../..');
const out = path.join(root, 'tools/nga-forge/production/characters/swahili/reviews/special-down-medium-crossdraw-reprisal-v6/runtime-qa');
const url = 'http://127.0.0.1:4175/index.html?crossdraw-v6=1';
async function main() {
  fs.mkdirSync(out, { recursive: true });
  const browser = await chromium.launch({ headless: true, channel: 'chrome' });
  try {
    const context = await browser.newContext({ viewport: { width: 1440, height: 1000 } });
    const page = await context.newPage(), errors = [], failedRequests = [];
    page.on('pageerror', error => errors.push(error.message));
    page.on('response', response => { if (response.status() >= 400) failedRequests.push({ status: response.status(), url: response.url() }); });
    await page.goto(url, { waitUntil: 'networkidle' });
    await page.evaluate(() => window.__NGA_ENGINE_V2_DEBUG__.stageReady);
    await page.evaluate(() => Object.assign(window.__NGA_ENGINE_V2_DEBUG__.renderer.overlays, { push:false, hurt:false, strike:false, origin:false, facing:false }));
    assert.ok(await page.getByText('SWAHILI MOVESET PLAYTEST · CROSSDRAW REPRISAL V6', { exact: false }).count());
    const mirrored = [];
    for (const actor of ['p1', 'p2']) {
      const trace = await page.evaluate(actor => {
        const { runtime, renderer } = window.__NGA_ENGINE_V2_DEBUG__;
        runtime.reset(); runtime.setPaused(true);
        const victim = actor === 'p1' ? 'p2' : 'p1';
        runtime.state.fighters.p1.x = -70; runtime.state.fighters.p2.x = 70;
        runtime.frameAdvance({ [actor]: { down: true, special: true, medium: true } });
        const seen = new Set(), contacts = [];
        let previousHits = 0;
        for (let i = 0; i < 128; i++) {
          const fighter = runtime.state.fighters[actor];
          renderer.render(runtime.state);
          const frame = renderer.getFighterPresentationSnapshots()[actor].frame;
          if (fighter.currentAttack === 'special_down_medium') seen.add(frame);
          const hits = runtime.state.fighters[victim].hitCountTaken;
          if (hits > previousHits) contacts.push({ frame, moveTick: fighter.phaseTick, hits });
          previousHits = hits;
          runtime.frameAdvance({});
        }
        return { actor, frames: [...seen], contacts, damage: 1000-runtime.state.fighters[victim].health, finalPhase: runtime.state.fighters[actor].phase };
      }, actor);
      assert.strictEqual(trace.frames.length, 12);
      assert.deepStrictEqual(trace.contacts.map(c => c.frame), ['special_down_medium_motion_05', 'special_down_medium_motion_08']);
      assert.strictEqual(trace.damage, 69); assert.strictEqual(trace.finalPhase, 'idle'); mirrored.push(trace);
    }
    const lightRecovery = await page.evaluate(() => {
      const { runtime, renderer } = window.__NGA_ENGINE_V2_DEBUG__;
      runtime.reset();runtime.setPaused(true);
      runtime.state.fighters.p1.phase='attack';runtime.state.fighters.p1.currentAttack='standing_light';runtime.state.fighters.p1.phaseTick=12;
      renderer.render(runtime.state);
      return renderer.getFighterPresentationSnapshots().p1;
    });
    assert.strictEqual(lightRecovery.frame, 'standing_light_recovery');
    assert.strictEqual(lightRecovery.rootAlignmentError, 0);
    const sources = fs.readFileSync(path.join(root,'NO_GODS_ABOVE/engine_v2/src/stage/spriteSources.ts'),'utf8');
    assert.ok(sources.includes('standing_light_recovery: idle00Url'));
    await page.locator('canvas').first().screenshot({ path:path.join(out,'standing-light-complete-recovery.png') });
    for (const combatTick of [0, 25, 40, 63]) {
      await page.evaluate(combatTick => {
        const { runtime, renderer } = window.__NGA_ENGINE_V2_DEBUG__;
        runtime.reset(); runtime.setPaused(true);
        runtime.state.fighters.p1.phase = 'attack'; runtime.state.fighters.p1.currentAttack = 'special_down_medium'; runtime.state.fighters.p1.phaseTick = combatTick;
        renderer.render(runtime.state);
      }, combatTick);
      await page.locator('canvas').first().screenshot({ path: path.join(out, `arena-tick-${String(combatTick).padStart(2, '0')}.png`) });
    }
    const playback = [];
    for (const speed of [1, 0.5]) {
      if (speed === 0.5) await page.locator('#review-speed').click();
      await page.getByRole('button', { name: 'Test Crossdraw V6', exact: true }).click();
      await page.locator('canvas').first().scrollIntoViewIfNeeded();
      await page.waitForTimeout(speed === 1 ? 1800 : 3500);
      const state = await page.evaluate(() => { const d=window.__NGA_ENGINE_V2_DEBUG__; return { speed:d.getReviewSpeed(), hits:d.runtime.state.fighters.p2.hitCountTaken, phase:d.runtime.state.fighters.p1.phase, damage:1000-d.runtime.state.fighters.p2.health }; });
      assert.strictEqual(state.speed, speed); assert.strictEqual(state.hits, 2); assert.strictEqual(state.damage, 69); assert.strictEqual(state.phase, 'idle'); playback.push(state);
    }
    await context.close();
    const viewer = await browser.newPage();
    await viewer.goto('http://127.0.0.1:4196/tools/nga-forge/production/characters/swahili/reviews/special-down-medium-crossdraw-reprisal-v6/review.html');
    await viewer.waitForFunction(() => !!document.querySelector('canvas').dataset.pose);
    await viewer.locator('#play').click();
    for (const [tick, pose] of [[25, '5'], [40, '8']]) {
      await viewer.locator('#scrub').evaluate((slider,tick) => { slider.value=String(tick);slider.dispatchEvent(new Event('input')); }, tick);
      assert.strictEqual(await viewer.locator('canvas').getAttribute('data-pose'), pose);
    }
    await viewer.screenshot({ path:path.join(out,'connected-player.png'),fullPage:true });
    assert.deepStrictEqual(errors, []); assert.deepStrictEqual(failedRequests, []);
    const report = { status:'PASS', candidateOnly:true, humanApproval:false, blenderUsed:false, mirrored, playback, lightRecovery, browserErrors:errors, failedRequests, actualAnimationUsed:true, video:null, videoNote:'No local Playwright ffmpeg available; captured arena contact screenshots and verified real-time playback state instead.' };
    fs.writeFileSync(path.join(out,'browser-smoke.json'),JSON.stringify(report,null,2)+'\n');
    console.log(JSON.stringify(report,null,2));
  } finally { await browser.close(); }
}
main().catch(error => { console.error(error); process.exitCode=1; });
