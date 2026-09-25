#!/usr/bin/env node
// Live browser smoke for the versus playtest.
//
//   node scripts/versus_playtest_smoke.js
//
// Boots a real Vite server, drives the select screen, runs a real match, and
// asserts in the live page what the unit test asserts in the simulation:
// matched body height, full-body hitboxes, and both characters landing hits on
// each other. Writes evidence captures to docs/versus_playtest/captures/.

const fs = require('fs');
const http = require('http');
const net = require('net');
const path = require('path');
const { spawn } = require('child_process');
const { chromium } = require('playwright');

const root = path.resolve(__dirname, '..');
const captureRoot = path.join(root, 'docs', 'versus_playtest', 'captures');
fs.mkdirSync(captureRoot, { recursive: true });

const availablePort = () => new Promise((resolve, reject) => {
  const server = net.createServer();
  server.once('error', reject);
  server.listen(0, '127.0.0.1', () => { const { port } = server.address(); server.close(() => resolve(port)); });
});

const waitForHttp = (url, attempts = 120) => new Promise((resolve, reject) => {
  const poll = (remaining) => {
    http.get(url, (response) => {
      response.resume();
      if (response.statusCode === 200) resolve();
      else if (remaining) setTimeout(() => poll(remaining - 1), 150);
      else reject(new Error(`HTTP ${response.statusCode}`));
    }).on('error', (error) => remaining ? setTimeout(() => poll(remaining - 1), 150) : reject(error));
  };
  poll(attempts);
});

function assert(condition, message) {
  if (!condition) throw new Error(`SMOKE FAILED: ${message}`);
  console.log(`  ok  ${message}`);
}

(async () => {
  const port = await availablePort();
  const viteBin = path.join(root, 'node_modules', 'vite', 'bin', 'vite.js');
  const server = spawn(process.execPath, [viteBin, '--host', '127.0.0.1', '--port', String(port), '--strictPort'],
    { cwd: root, stdio: ['ignore', 'pipe', 'pipe'], windowsHide: true });
  server.stdout.on('data', () => {});
  server.stderr.on('data', () => {});

  let browser;
  try {
    const origin = `http://127.0.0.1:${port}`;
    await waitForHttp(`${origin}/versus-playtest.html`);
    const systemChrome = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
    browser = await chromium.launch({ headless: true, ...(fs.existsSync(systemChrome) ? { executablePath: systemChrome } : {}) });
    const page = await browser.newPage({ viewport: { width: 1400, height: 1100 }, deviceScaleFactor: 1 });
    page.setDefaultTimeout(120000);

    const errors = [], failed = [];
    page.on('pageerror', (error) => errors.push(error.message));
    page.on('console', (message) => { if (message.type() === 'error') errors.push(message.text()); });
    page.on('requestfailed', (request) => failed.push(`${request.method()} ${request.url()}`));

    console.log('SMOKE character select');
    await page.goto(`${origin}/versus-playtest.html`, { waitUntil: 'domcontentloaded' });
    await page.waitForSelector('.card[data-side="p1"][data-pick="lamuh"]');
    assert(await page.locator('.card').count() === 4, 'both fighters are selectable for both players');
    await page.screenshot({ path: path.join(captureRoot, 'select-screen.png'), fullPage: true });

    console.log('SMOKE Lamuh vs Swahili');
    await page.click('.card[data-side="p1"][data-pick="lamuh"]');
    await page.click('.card[data-side="p2"][data-pick="swahili"]');
    await page.click('#fight');
    await page.waitForFunction(() => !!window.__versus, null, { timeout: 180000 });
    await page.waitForTimeout(400);

    const kinds = await page.evaluate(() => [window.__versus.state.fighters.p1.kind, window.__versus.state.fighters.p2.kind]);
    assert(kinds[0] === 'lamuh_legacy_v2', 'P1 runs on the Lamuh fighter kind');
    assert(kinds[1] === 'lamuh_proto', "P2 runs on Swahili's fighter kind");

    const bodyCheck = await page.locator('#bodyCheck').innerText();
    assert((bodyCheck.match(/standing 182u/g) || []).length === 2,
      'both fighters report a 182u standing full-body envelope');
    assert(bodyCheck.includes('✓'), 'the live body check confirms one shared body height');

    // Walk in and trade a heavy each way. Infinite health is a training default, so
    // it is turned off here to observe real damage.
    const exchange = await page.evaluate(async () => {
      const v = window.__versus;
      v.pause(false);
      document.querySelector('#infiniteHealth').checked = false;
      document.querySelector('#aiToggle').checked = false;
      const events = [];
      const run = (steps) => { for (let i = 0; i < steps; i += 1) { v.step(); const e = v.state.lastCombatEvent; if (e && e.tick === v.state.tick - 1) events.push({ attacker: e.attacker, attackId: e.attackId, outcome: e.outcome, damage: e.damage }); } };
      for (let i = 0; i < 60; i += 1) { v.queue('p1', { right: true }); v.queue('p2', { left: true }); }
      run(60);
      v.queue('p1', { heavy: true }); run(60);
      for (let i = 0; i < 90; i += 1) { v.queue('p1', { right: true }); v.queue('p2', { left: true }); }
      run(90);
      v.queue('p2', { heavy: true }); run(60);
      return { events, p1hp: v.state.fighters.p1.health, p2hp: v.state.fighters.p2.health };
    });
    assert(exchange.events.some((e) => e.attacker === 'p1' && e.outcome === 'hit'), 'Lamuh lands a hit on Swahili');
    assert(exchange.events.some((e) => e.attacker === 'p2' && e.outcome === 'hit'), 'Swahili lands a hit on Lamuh');
    assert(exchange.p1hp < 1000 && exchange.p2hp < 1000, `both fighters take real damage (${Math.round(exchange.p1hp)} / ${Math.round(exchange.p2hp)})`);

    console.log('SMOKE Lamuh full move set renders');
    // Each special must animate through real, distinct sprites. Before the move set
    // was wired up these all fell back to a single held pose, which is exactly the
    // failure this asserts against.
    const moveRender = await page.evaluate(async () => {
      const v = window.__versus;
      const ctx = document.querySelector('#stage').getContext('2d');
      const orig = ctx.drawImage.bind(ctx);
      const ids = new Map(); let next = 1; let seen = new Set();
      ctx.drawImage = function (img, ...rest) { if (img && img.width > 40) { if (!ids.has(img)) ids.set(img, next++); seen.add(ids.get(img)); } return orig(img, ...rest); };
      const hold = (n, f) => Array.from({ length: n }, () => ({ ...f }));
      const out = {};
      const run = (label, frames, steps) => {
        seen = new Set();
        for (const f of frames) v.queue('p1', f);
        let attack = null;
        for (let i = 0; i < steps; i += 1) { v.step(); if (v.state.fighters.p1.currentAttack) attack = v.state.fighters.p1.currentAttack; }
        out[label] = { attack, sprites: seen.size };
        for (let i = 0; i < 90; i += 1) v.step();
      };
      document.querySelector('#aiToggle').checked = false;
      run('Celestial Palm', hold(6, { special: true, light: true }), 40);
      run('Ascend Step', hold(6, { special: true, right: true, medium: true }), 55);
      run('Divine Vanish', hold(6, { special: true, left: true, light: true }), 32);
      run('Aura Sweep', hold(6, { special: true, down: true, heavy: true }), 62);
      run('Heaven Splitter', [...hold(3, { special: true }), ...hold(6, { special: true, up: true, medium: true })], 55);
      ctx.drawImage = orig;
      return out;
    });
    for (const [name, result] of Object.entries(moveRender)) {
      assert(!!result.attack, `${name} activates from input`);
      assert(result.sprites >= 4, `${name} animates through real frames (${result.sprites} distinct sprites)`);
    }

    console.log('SMOKE Last Tribunal arena');
    const arena = await page.evaluate(() => ({
      host: !!document.querySelector('#tribunalStage'),
      canvasHidden: document.querySelector('#stage').style.display === 'none',
      glCanvases: document.querySelectorAll('#tribunalStage canvas').length,
      canvasSize: [document.querySelector('#stage').width, document.querySelector('#stage').height]
    }));
    assert(arena.host && arena.glCanvases >= 1, 'the Last Tribunal 3D arena is mounted');
    assert(arena.canvasHidden, 'the 2D canvas is presented as the combat plane, not shown directly');
    assert(arena.canvasSize[0] === 1600 && arena.canvasSize[1] === 900,
      'the combat canvas matches the Tribunal plane geometry (1600x900)');

    console.log('SMOKE Celestial Palm blast');
    const blast = await page.evaluate(async () => {
      const v = window.__versus;
      document.querySelector('#aiToggle').checked = false;
      for (let i = 0; i < 150; i += 1) v.step();
      for (let i = 0; i < 6; i += 1) v.queue('p1', { special: true, heavy: true });
      let projectile = null;
      for (let i = 0; i < 45 && !projectile; i += 1) { v.step(); const list = v.state.projectiles; if (list && list.length) projectile = list[0]; }
      if (!projectile) return { spawned: false };
      const ctx = document.querySelector('#stage').getContext('2d');
      const drew = v.presenters[projectile.owner].drawProjectile(ctx, projectile, { x: (n) => n, y: (n) => n }, 1.3);
      for (let i = 0; i < 6; i += 1) v.step();
      return { spawned: true, owner: projectile.owner, attackId: projectile.attackId, drew };
    });
    assert(blast.spawned, 'Celestial Palm spawns a projectile');
    assert(blast.drew === true, 'the palm blast is drawn by the character presenter, not as a placeholder box');

    console.log('SMOKE Crown of No Gods');
    const crown = await page.evaluate(async () => {
      const v = window.__versus;
      const set = (id, value) => { const el = document.querySelector('#' + id); el.checked = value; el.dispatchEvent(new Event('change', { bubbles: true })); };
      set('infiniteMeter', true); set('infiniteHealth', true); set('aiToggle', false);
      for (let i = 0; i < 200; i += 1) v.step();
      for (let i = 0; i < 80; i += 1) { v.queue('p1', { right: true }); v.queue('p2', { left: true }); v.step(); }
      v.queue('p1', { ultimate: true });
      const phases = new Set();
      let bars = false;
      for (let i = 0; i < 300; i += 1) {
        v.step();
        const shot = v.state.ultimateInteraction;
        if (shot) { phases.add(shot.phase); if (document.querySelector('.cinematic-bars')) bars = true; }
      }
      return { phases: [...phases], bars };
    });
    assert(crown.phases.length > 0, 'the ultimate enters its cinematic on a confirmed hit');
    for (const phase of ['charge', 'beam']) {
      assert(crown.phases.includes(phase), `the ultimate reaches its "${phase}" phase`);
    }
    assert(crown.bars, 'the ultimate shows screen-space cinematic bars');

    console.log('SMOKE training mode');
    await page.click('#reset');   // start from neutral, not from the ultimate's aftermath
    const training = await page.evaluate(async () => {
      const v = window.__versus;
      const set = (id, value) => { const el = document.querySelector('#' + id); if (el.type === 'checkbox') el.checked = value; else el.value = value; el.dispatchEvent(new Event('change', { bubbles: true })); };
      const observe = (steps) => { const phases = new Set(); const moves = new Set();
        for (let i = 0; i < steps; i += 1) { v.step(); const p2 = v.state.fighters.p2; phases.add(p2.phase); if (p2.currentAttack) moves.add(p2.currentAttack); }
        return { phases: [...phases], moves: [...moves] }; };
      const out = {};
      set('aiToggle', false); set('infiniteMeter', false);
      set('dummy', 'stand'); out.stand = observe(150);
      set('dummy', 'crouch'); out.crouch = observe(120);
      set('dummy', 'block_all'); out.block = observe(120);
      set('dummy', 'stand'); set('aiToggle', true); set('aiLevel', 'aggressive'); out.ai = observe(700);
      set('aiToggle', false);
      out.infiniteHealth = (() => { set('infiniteHealth', true); v.state.fighters.p1.health = 400; for (let i = 0; i < 40; i += 1) v.step(); return v.state.fighters.p1.health; })();
      out.faults = document.querySelector('#readout').innerText.includes('engine fault');
      return out;
    });
    assert(training.stand.phases.join() === 'idle', 'dummy "stand" holds neutral');
    assert(training.crouch.phases.includes('crouch'), 'dummy "crouch" crouches');
    assert(training.block.phases.includes('block'), 'dummy "block all" guards');
    assert(training.ai.moves.length >= 3, `AI opponent uses a varied offence (${training.ai.moves.length} moves)`);
    assert(training.infiniteHealth === 1000, 'infinite health refills the fighter');

    assert((await page.locator('#moveList').innerText()).includes('Celestial Palm'), 'the move list names Lamuh specials');

    // Freeze on an active frame so the capture shows a hitbox against a hurtbox,
    // from a clean centre-stage reset rather than wherever the AI run finished.
    await page.click('#reset');
    await page.evaluate(async () => {
      const v = window.__versus;
      document.querySelector('#aiToggle').checked = false;
      document.querySelector('#dummy').value = 'stand';
      for (let i = 0; i < 60; i += 1) { v.queue('p1', { right: true }); v.queue('p2', { left: true }); v.step(); }
      v.queue('p1', { special: true, down: true, heavy: true });
      for (let i = 0; i < 30; i += 1) v.step();
    });
    await page.waitForTimeout(200);
    await page.screenshot({ path: path.join(captureRoot, 'lamuh-vs-swahili.png'), fullPage: true });

    console.log('SMOKE Swahili mirror');
    await page.click('#back');
    await page.click('.card[data-side="p1"][data-pick="swahili"]');
    await page.click('.card[data-side="p2"][data-pick="swahili"]');
    await page.click('#fight');
    await page.waitForFunction(() => !!window.__versus, null, { timeout: 180000 });
    await page.waitForTimeout(400);
    const mirror = await page.evaluate(() => [window.__versus.chosen.p1, window.__versus.chosen.p2]);
    assert(mirror[0] === 'swahili' && mirror[1] === 'swahili', 'Swahili is playable on both sides');
    await page.screenshot({ path: path.join(captureRoot, 'swahili-mirror.png'), fullPage: true });

    // The known pre-existing corner-throw pushbox assertion is caught and reported by
    // the page rather than thrown, so it must not appear here either.
    assert(errors.length === 0, `no page errors (saw ${errors.length}${errors.length ? `: ${errors[0]}` : ''})`);
    assert(failed.length === 0, `no failed requests (saw ${failed.length}${failed.length ? `: ${failed[0]}` : ''})`);

    console.log(`\nversus playtest smoke passed. Captures in ${path.relative(root, captureRoot)}`);
  } finally {
    if (browser) await browser.close();
    server.kill();
  }
})().catch((error) => { console.error(error.message); process.exit(1); });
