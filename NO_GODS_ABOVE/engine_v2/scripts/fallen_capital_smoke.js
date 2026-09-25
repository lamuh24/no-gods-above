#!/usr/bin/env node
// Existing local server required. No installs, network uploads or source changes.
// Actual input checks and explicitly labeled synthetic stress are reported separately.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { chromium } = require('playwright');
const root = path.resolve(__dirname, '..');
const out = path.join(root, 'docs/fallen-capital-v1/captures');
fs.mkdirSync(out, { recursive: true });
const origin = process.env.FALLEN_CAPITAL_ORIGIN || 'http://127.0.0.1:4175';
const report = { timestamp: new Date().toISOString(), origin, checks: [], errors: [], failedRequests: [], actualInput: {}, syntheticStress: {} };
function check(value, label) { assert.ok(value, label); report.checks.push(label); console.log(`ok ${label}`); }
(async () => {
  const chrome = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
  const browser = await chromium.launch({ headless: true, ...(fs.existsSync(chrome) ? { executablePath: chrome } : {}) });
  try {
    const page = await browser.newPage({ viewport: { width: 1660, height: 1100 }, deviceScaleFactor: 1 });
    page.setDefaultTimeout(180000);
    page.on('pageerror', e => report.errors.push(e.message));
    page.on('console', e => { if (e.type() === 'error') report.errors.push(e.text()); });
    page.on('requestfailed', r => report.failedRequests.push(r.url()));
    page.on('response', r => { if (r.status() >= 400) report.failedRequests.push(`${r.status()} ${r.url()}`); });
    await page.goto(`${origin}/versus-playtest.html?arena=fallen-capital&autostart=1`, { waitUntil: 'domcontentloaded' });
    await page.waitForFunction(() => window.__versus?.arena?.stageLoaded === true);
    await page.evaluate(() => { window.__versus.pause(false); document.querySelector('#aiToggle').checked = false; document.querySelector('#boxes').checked = false; });
    const capture = async name => { await page.locator('#tribunalStage').screenshot({ path: path.join(out, `${name}.png`) }); };
    report.initial = await page.evaluate(() => ({ chosen: window.__versus.chosen, arena: window.__versus.arena, stage: window.__versus.state.stage }));
    check(report.initial.chosen.p1 === 'lamuh' && report.initial.chosen.p2 === 'swahili', 'actual Lamuh and Swahili presenters loaded');
    check(report.initial.arena.cameraFov === 28 && report.initial.arena.fixedCombatPlane, '28 degree camera and fixed combat plane');
    await capture('01-center');
    // Verify renderer itself against serialized real match state, without ticking core.
    report.renderPurity = await page.evaluate(async () => {
      const { FallenCapitalArena } = await import('/src/stage/fallenCapital/fallenCapitalArena.ts');
      const host = document.createElement('div');
      const arena = new FallenCapitalArena(host); await arena.ready;
      const state = window.__versus.state, before = JSON.stringify(state);
      for (let i = 0; i < 4; i++) arena.render(state, document.querySelector('#stage'));
      const unchanged = JSON.stringify(state) === before;
      const diagnostics = arena.diagnostics(); arena.dispose(); arena.dispose();
      return { unchanged, diagnostics, disposed: arena.diagnostics().disposed, remainingCanvas: host.querySelectorAll('canvas').length };
    });
    check(report.renderPurity.unchanged, 'repeated renderer calls leave complete serialized match state untouched');
    check(report.renderPurity.disposed && report.renderPurity.remainingCanvas === 0, 'renderer dispose is idempotent and removes owned canvas');
    const reset = async () => { await page.click('#reset'); await page.evaluate(() => { window.__versus.pause(false); document.querySelector('#aiToggle').checked = false; }); };
    report.actualInput.exchange = await page.evaluate(() => {
      const v = window.__versus; document.querySelector('#infiniteHealth').checked = false;
      const events = []; const run = n => { for (let i = 0; i < n; i++) { v.step(); const e = v.state.lastCombatEvent; if (e && e.tick === v.state.tick - 1) events.push({ attacker: e.attacker, outcome: e.outcome, damage: e.damage }); } };
      for (let i = 0; i < 60; i++) { v.queue('p1', { right: true }); v.queue('p2', { left: true }); } run(60);
      v.queue('p1', { heavy: true }); run(60);
      for (let i = 0; i < 90; i++) { v.queue('p1', { right: true }); v.queue('p2', { left: true }); } run(90);
      v.queue('p2', { heavy: true }); run(60);
      return { events, health: Object.values(v.state.fighters).map(f => f.health) };
    });
    check(['p1', 'p2'].every(id => report.actualInput.exchange.events.some(e => e.attacker === id && e.outcome === 'hit')), 'both players deal damage via real heavy input');
    await reset();
    report.actualInput.jump = await page.evaluate(() => {
      const v = window.__versus; v.queue('p1', { up: true }); let minY = 0, minHead = 900, maxFeet = 0;
      for (let i = 0; i < 24; i++) { v.step(); const f = v.state.fighters.p1; minY = Math.min(minY, f.y); minHead = Math.min(minHead, v.project(f.x, f.y - 182).y); maxFeet = Math.max(maxFeet, v.project(f.x, f.y).y); }
      return { minY, minHead, maxFeet, arena: v.arena };
    });
    check(report.actualInput.jump.minY < -50 && report.actualInput.jump.minHead > 0 && report.actualInput.jump.maxFeet < 900, 'actual jump stays visible head to foot');
    await capture('02-actual-jump');
    await reset();
    report.actualInput.projectile = await page.evaluate(() => {
      const v = window.__versus; for (let i = 0; i < 6; i++) v.queue('p1', { special: true, heavy: true });
      for (let i = 0; i < 50; i++) { v.step(); const p = v.state.projectiles?.[0]; if (p) return { spawned: true, attackId: p.attackId, point: v.project(p.x, p.y), drawn: v.presenters[p.owner].drawProjectile(document.querySelector('#stage').getContext('2d'), p, { x: n => n, y: n => n }, 1.3) }; } return { spawned: false };
    });
    check(report.actualInput.projectile.spawned && report.actualInput.projectile.drawn, 'actual projectile spawns and character presenter draws it');
    await capture('03-actual-projectile');
    await reset();
    await page.evaluate(() => {
      const v = window.__versus; for (const id of ['infiniteMeter', 'infiniteHealth']) { const el = document.querySelector('#' + id); el.checked = true; el.dispatchEvent(new Event('change', { bubbles: true })); }
      for (let i = 0; i < 80; i++) { v.queue('p1', { right: true }); v.queue('p2', { left: true }); v.step(); } v.queue('p1', { ultimate: true });
    });
    const phases = new Set(); let cinematicCapture = false;
    for (let block = 0; block < 32; block++) {
      const result = await page.evaluate(() => { const v = window.__versus, phases = []; for (let i = 0; i < 10; i++) { v.step(); if (v.state.ultimateInteraction) phases.push(v.state.ultimateInteraction.phase); } return { phases, phase: v.arena.phase, bars: !!document.querySelector('.cinematic-bars'), orbit: v.arena.orbitDegrees }; });
      result.phases.forEach(p => phases.add(p));
      if (result.phase === 'beam' && !cinematicCapture) { await capture('04-actual-cinematic-beam'); cinematicCapture = true; report.actualInput.cinematicFrame = result; }
    }
    report.actualInput.ultimatePhases = [...phases];
    check(phases.has('charge') && phases.has('beam') && cinematicCapture, 'actual hit-confirmed ultimate reaches charge and beam with screenshot');
    check(report.actualInput.cinematicFrame.bars && Math.abs(report.actualInput.cinematicFrame.orbit) <= 4.01, 'cinematic uses screen-space bars and bounded orbit');
    // Explicitly synthetic camera envelope stress. Real input behavior above is separate.
    for (const [name, x1, x2, y1, y2] of [['left-corner', -405, -290, 0, 0], ['right-corner', 290, 405, 0, 0], ['max-width-ceiling', -405, 405, -180, 0]]) {
      await reset();
      report.syntheticStress[name] = await page.evaluate(({ x1, x2, y1, y2 }) => {
        const v = window.__versus;
        Object.assign(v.state.fighters.p1, { x: x1, y: y1, grounded: y1 === 0, phase: y1 ? 'jump' : 'idle' });
        Object.assign(v.state.fighters.p2, { x: x2, y: y2, grounded: y2 === 0, phase: y2 ? 'jump' : 'idle' });
        v.step();
        return { points: Object.values(v.state.fighters).flatMap(f => [-40, 40].flatMap(dx => [0, -182].map(dy => v.project(f.x + dx, f.y + dy)))), arena: v.arena };
      }, { x1, x2, y1, y2 });
      check(report.syntheticStress[name].points.every(p => p.x > 0 && p.x < 1600 && p.y > 0 && p.y < 900), `synthetic ${name} body containment`);
      await capture(`05-synthetic-${name}`);
    }
    await page.click('#back');
    check(await page.locator('#tribunalStage canvas').count() === 0, 'return to select disposes stage canvas');
    await page.click('.card[data-side="p1"][data-pick="swahili"]');
    await page.click('.card[data-side="p2"][data-pick="lamuh"]');
    await page.click('#fight'); await page.waitForFunction(() => window.__versus?.arena?.stageLoaded);
    const swapped = await page.evaluate(() => { window.__versus.pause(false); return { chosen: window.__versus.chosen, count: document.querySelectorAll('#tribunalStage canvas').length }; });
    report.reentry = swapped;
    check(swapped.chosen.p1 === 'swahili' && swapped.chosen.p2 === 'lamuh' && swapped.count === 1, `reentry supports swapped fighters with one arena canvas (${JSON.stringify(swapped)})`);
    await capture('06-swapped-fighters');
    await page.click('#back'); await page.selectOption('#arenaChoice', 'flat'); await page.click('#fight');
    await page.waitForFunction(() => window.__versus?.arena?.arenaId === 'flat');
    check(await page.locator('#stage').isVisible(), 'training grid remains selectable fallback');
    check(report.errors.length === 0, 'no browser console or page errors');
    check(report.failedRequests.length === 0, 'no failed HTTP or asset requests');
    // Failure injection uses a separate page so its expected blocked asset is not
    // confused with an accidental asset failure in the ordinary gameplay run.
    const faultPage = await browser.newPage({ viewport: { width: 1400, height: 1000 } });
    const faultErrors = []; faultPage.on('pageerror', e => faultErrors.push(e.message));
    await faultPage.route('**/stages/fallen-capital/background.png', route => route.abort('failed'));
    await faultPage.goto(`${origin}/versus-playtest.html?arena=fallen-capital&autostart=1`, { waitUntil: 'domcontentloaded' });
    await faultPage.waitForFunction(() => window.__versus?.arena?.arenaId === 'flat', null, { timeout: 180000 });
    report.syntheticStress.missingBackground = await faultPage.evaluate(() => {
      const v = window.__versus; v.pause(false); const before = v.state.tick; v.queue('p1', { right: true }); v.step();
      return { tickAdvanced: v.state.tick > before, stageVisible: document.querySelector('#stage').style.display !== 'none', remainingArena: !!document.querySelector('#tribunalStage'), label: document.querySelector('#arenaLabel').textContent };
    });
    check(report.syntheticStress.missingBackground.tickAdvanced && report.syntheticStress.missingBackground.stageVisible && !report.syntheticStress.missingBackground.remainingArena && faultErrors.length === 0, 'synthetic missing background degrades to playable grid without an uncaught error');
    await faultPage.close();
    report.passed = true;
  } catch (error) { report.passed = false; report.failure = error.stack; throw error; }
  finally { fs.writeFileSync(path.join(out, 'smoke-report.json'), JSON.stringify(report, null, 2)); await browser.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
