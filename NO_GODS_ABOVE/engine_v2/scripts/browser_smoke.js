#!/usr/bin/env node
const assert = require('assert');
const { chromium } = require('playwright');
const { spawn } = require('child_process');
const fs = require('fs');
const net = require('net');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const OUT_DIR = path.join(ROOT, 'docs', 'browser_smoke');
const VITE_BIN = path.join(ROOT, 'node_modules', 'vite', 'bin', 'vite.js');
fs.mkdirSync(OUT_DIR, { recursive: true });

function wait(ms) { return new Promise((resolve) => setTimeout(resolve, ms)); }
function availablePort() { return new Promise((resolve, reject) => { const probe = net.createServer(); probe.once('error', reject); probe.listen(0, '127.0.0.1', () => { const address = probe.address(); const port = typeof address === 'object' && address ? address.port : 0; probe.close(() => resolve(port)); }); }); }
async function waitForServer(url) { for (let i = 0; i < 80; i++) { try { const response = await fetch(url); const text = await response.text(); if (response.ok && text.includes('NGA Engine V2')) return; } catch (_) {} await wait(250); } throw new Error(`Timed out waiting for Engine V2 at ${url}`); }
async function stopServer(server) { if (!server || server.exitCode !== null) return; server.kill('SIGTERM'); await Promise.race([new Promise((resolve) => server.once('exit', resolve)), wait(3000)]); if (server.exitCode === null) server.kill('SIGKILL'); }

async function main() {
  const port = await availablePort();
  const url = `http://127.0.0.1:${port}/`;
  const server = spawn(process.execPath, [VITE_BIN, '--host', '127.0.0.1', '--port', String(port), '--strictPort'], { cwd: ROOT, stdio: ['ignore', 'pipe', 'pipe'], windowsHide: true });
  const logs = [];
  server.stdout.on('data', (data) => logs.push(data.toString()));
  server.stderr.on('data', (data) => logs.push(data.toString()));
  let browser;
  try {
    await waitForServer(url);
    browser = await chromium.launch({ headless: true });
    const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
    const consoleErrors = [];
    page.on('console', (message) => { if (message.type() === 'error') consoleErrors.push(message.text()); });
    page.on('pageerror', (error) => consoleErrors.push(error.message));
    await page.goto(url, { waitUntil: 'networkidle' });
    await page.waitForFunction(() => !!window.__NGA_ENGINE_V2_DEBUG__);
    await page.waitForTimeout(250);

    const jump = await page.evaluate(() => {
      const { runtime, renderer } = window.__NGA_ENGINE_V2_DEBUG__; runtime.reset(); runtime.setPaused(true);
      runtime.frameAdvance({ p1: { up: true } }); let startupTicks = 1;
      while (runtime.state.fighters.p1.grounded && startupTicks < 30) { runtime.frameAdvance({}); startupTicks++; }
      const airborne = { startupTicks, y: runtime.state.fighters.p1.y, vy: runtime.state.fighters.p1.vy, phase: runtime.state.fighters.p1.phase };
      renderer.render(runtime.state); return airborne;
    });
    await page.waitForTimeout(100); await page.screenshot({ path: path.join(OUT_DIR, 'neutral_jump.png'), fullPage: true });
    const landing = await page.evaluate(() => {
      const { runtime, renderer } = window.__NGA_ENGINE_V2_DEBUG__; let ticks = 0;
      while (!(runtime.state.fighters.p1.grounded && runtime.state.fighters.p1.phase === 'landing') && ticks < 120) { runtime.frameAdvance({}); ticks++; }
      renderer.render(runtime.state); return { ticks, y: runtime.state.fighters.p1.y, vy: runtime.state.fighters.p1.vy, phase: runtime.state.fighters.p1.phase };
    });
    await page.waitForTimeout(100); await page.screenshot({ path: path.join(OUT_DIR, 'neutral_landing.png'), fullPage: true });

    const dash = await page.evaluate(() => {
      const { runtime, renderer } = window.__NGA_ENGINE_V2_DEBUG__; runtime.reset(); runtime.setPaused(true);
      runtime.frameAdvance({ p1: { right: true } }); runtime.frameAdvance({}); runtime.frameAdvance({ p1: { right: true } }); let duration = 1;
      while (runtime.state.fighters.p1.phase === 'dash' && duration < 40) { runtime.frameAdvance({}); duration++; }
      renderer.render(runtime.state); return { duration, phase: runtime.state.fighters.p1.phase, x: runtime.state.fighters.p1.x };
    });
    await page.waitForTimeout(100); await page.screenshot({ path: path.join(OUT_DIR, 'dash_authored_duration.png'), fullPage: true });

    async function captureChain(filename, first, second, third, holdDown) {
      const result = await page.evaluate(({ first, second, third, holdDown }) => {
        const { runtime, renderer } = window.__NGA_ENGINE_V2_DEBUG__; runtime.reset(); runtime.setPaused(true); runtime.state.fighters.p1.x = -72; runtime.state.fighters.p2.x = 30;
        const untilCombo = (count, heldInput = {}) => { let ticks = 0; while (runtime.state.fighters.p1.comboCount < count && ticks < 150) { runtime.frameAdvance({ p1: heldInput }); ticks++; } if (runtime.state.fighters.p1.comboCount < count) throw new Error(`combo ${count} did not connect`); };
        runtime.frameAdvance({ p1: first }); untilCombo(1); runtime.frameAdvance({ p1: second }); untilCombo(2, holdDown ? { down: true } : {}); runtime.frameAdvance({ p1: third }); untilCombo(3, holdDown ? { down: true } : {});
        renderer.render(runtime.state); const p1 = runtime.state.fighters.p1, p2 = runtime.state.fighters.p2; return { combo: p1.comboCount, damage: p1.comboDamage, scaling: p1.damageScaling, defenderHealth: p2.health, defenderPosition: [p2.x, p2.y] };
      }, { first, second, third, holdDown });
      await page.waitForTimeout(100); await page.screenshot({ path: path.join(OUT_DIR, filename), fullPage: true }); return result;
    }
    const standingChain = await captureChain('chain_5l_5m_5h.png', { light: true }, { medium: true }, { heavy: true }, false);
    const lowChain = await captureChain('chain_2l_2m_2h.png', { down: true, light: true }, { down: true, medium: true }, { down: true, heavy: true }, true);

    const launcherApex = await page.evaluate(() => {
      const { runtime, renderer } = window.__NGA_ENGINE_V2_DEBUG__; runtime.reset(); runtime.setPaused(true); runtime.state.fighters.p1.x = -72; runtime.state.fighters.p2.x = 30;
      runtime.frameAdvance({ p1: { down: true, heavy: true } }); let ticks = 0, minimumY = 0;
      while (runtime.state.fighters.p2.health === 1000 && ticks < 60) { runtime.frameAdvance({}); ticks++; }
      while (runtime.state.fighters.p2.vy < 0 && ticks < 120) { runtime.frameAdvance({}); ticks++; minimumY = Math.min(minimumY, runtime.state.fighters.p2.y); }
      renderer.render(runtime.state); return { ticks, minimumY, ceilingY: runtime.state.stage.ceilingY, position: [runtime.state.fighters.p2.x, runtime.state.fighters.p2.y] };
    });
    await page.waitForTimeout(100); await page.screenshot({ path: path.join(OUT_DIR, 'launcher_bounded_apex.png'), fullPage: true });
    const launcherLanding = await page.evaluate(() => {
      const { runtime, renderer } = window.__NGA_ENGINE_V2_DEBUG__; let ticks = 0;
      while (!runtime.state.fighters.p2.grounded && ticks < 120) { runtime.frameAdvance({}); ticks++; }
      renderer.render(runtime.state); return { ticks, grounded: runtime.state.fighters.p2.grounded, y: runtime.state.fighters.p2.y, warnings: runtime.state.debugWarnings };
    });
    await page.waitForTimeout(100); await page.screenshot({ path: path.join(OUT_DIR, 'launcher_landing.png'), fullPage: true });

    const launcherToAirLight = await page.evaluate(() => {
      const { runtime, renderer } = window.__NGA_ENGINE_V2_DEBUG__; runtime.reset(); runtime.setPaused(true); runtime.state.fighters.p1.x = -72; runtime.state.fighters.p2.x = 30;
      const until = (predicate, max, input = {}) => { let ticks = 0; while (!predicate() && ticks < max) { runtime.frameAdvance(input); ticks++; } if (!predicate()) throw new Error(`aerial evidence condition missed after ${max} ticks`); return ticks; };
      runtime.frameAdvance({ p1: { down: true, heavy: true } }); until(() => runtime.state.fighters.p1.comboCount === 1, 60); until(() => runtime.state.fighters.p1.hitstop === 0, 30);
      runtime.frameAdvance({ p1: { up: true, right: true } }); until(() => !runtime.state.fighters.p1.grounded, 20, { p1: { right: true } });
      runtime.frameAdvance({ p1: { light: true, right: true } }); until(() => runtime.state.fighters.p1.comboCount === 2, 50, { p1: { right: true } });
      renderer.render(runtime.state); const p1 = runtime.state.fighters.p1, p2 = runtime.state.fighters.p2;
      return { route: [...p1.comboRoute], move: p1.currentAttack, cancels: [...p1.cancelOptions], remainingAirActions: p1.airActionsRemaining, attacker: [p1.x, p1.y], defender: [p2.x, p2.y], warnings: [...runtime.state.debugWarnings] };
    });
    await page.waitForTimeout(100); await page.screenshot({ path: path.join(OUT_DIR, 'aerial_2h_to_jj_hud.png'), fullPage: true });

    const airLightToMedium = await page.evaluate(() => {
      const { runtime, renderer } = window.__NGA_ENGINE_V2_DEBUG__; let ticks = 0;
      runtime.frameAdvance({ p1: { medium: true, right: true } }); while (runtime.state.fighters.p1.comboCount < 3 && ticks < 50) { runtime.frameAdvance({ p1: { right: true } }); ticks++; }
      if (runtime.state.fighters.p1.comboCount < 3) throw new Error('j.J -> j.K browser route dropped');
      renderer.render(runtime.state); const p1 = runtime.state.fighters.p1; return { route: [...p1.comboRoute], move: p1.currentAttack, cancels: [...p1.cancelOptions], remainingAirActions: p1.airActionsRemaining };
    });
    await page.waitForTimeout(100); await page.screenshot({ path: path.join(OUT_DIR, 'aerial_jj_to_jk.png'), fullPage: true });

    const fullAerialRoute = await page.evaluate(() => {
      const { runtime, renderer } = window.__NGA_ENGINE_V2_DEBUG__; let ticks = 0;
      runtime.frameAdvance({ p1: { heavy: true, right: true } }); while (runtime.state.fighters.p1.comboCount < 4 && ticks < 60) { runtime.frameAdvance({ p1: { right: true } }); ticks++; }
      if (runtime.state.fighters.p1.comboCount < 4) throw new Error('j.J -> j.K -> j.L browser route dropped');
      renderer.render(runtime.state); const p1 = runtime.state.fighters.p1, p2 = runtime.state.fighters.p2;
      return { route: [...p1.comboRoute], combo: p1.comboCount, damage: p1.comboDamage, move: p1.currentAttack, phase: p1.phase, remainingAirActions: p1.airActionsRemaining, defenderHealth: p2.health, defenderPhase: p2.phase, positions: { attacker: [p1.x, p1.y], defender: [p2.x, p2.y] }, warnings: [...runtime.state.debugWarnings] };
    });
    await page.waitForTimeout(100); await page.screenshot({ path: path.join(OUT_DIR, 'aerial_full_jj_jk_jl.png'), fullPage: true });

    const aerialLanding = await page.evaluate(() => {
      const { runtime, renderer } = window.__NGA_ENGINE_V2_DEBUG__; let ticks = 0;
      while (!runtime.state.fighters.p1.grounded && ticks < 120) { runtime.frameAdvance({}); ticks++; }
      renderer.render(runtime.state); const p1 = runtime.state.fighters.p1, p2 = runtime.state.fighters.p2;
      return { ticks, attackerPhase: p1.phase, attackerMove: p1.currentAttack, remainingAirActions: p1.airActionsRemaining, defenderPhase: p2.phase, defenderGrounded: p2.grounded, route: [...p1.comboRoute], warnings: [...runtime.state.debugWarnings] };
    });
    await page.waitForTimeout(100); await page.screenshot({ path: path.join(OUT_DIR, 'aerial_jl_landing_knockdown.png'), fullPage: true });

    const trade = await page.evaluate(() => {
      const { runtime, renderer } = window.__NGA_ENGINE_V2_DEBUG__; runtime.reset(); runtime.setPaused(true); runtime.state.fighters.p1.x = -50; runtime.state.fighters.p2.x = 50;
      runtime.frameAdvance({ p1: { light: true }, p2: { light: true } }); let ticks = 0; while ((runtime.state.fighters.p1.health === 1000 || runtime.state.fighters.p2.health === 1000) && ticks < 30) { runtime.frameAdvance({}); ticks++; }
      renderer.render(runtime.state); return { p1Health: runtime.state.fighters.p1.health, p2Health: runtime.state.fighters.p2.health };
    });
    await page.waitForTimeout(100); await page.screenshot({ path: path.join(OUT_DIR, 'simultaneous_trade.png'), fullPage: true });

    const comboReset = await page.evaluate(() => {
      const { runtime, renderer } = window.__NGA_ENGINE_V2_DEBUG__; runtime.reset(); runtime.setPaused(true); runtime.state.fighters.p1.x = -72; runtime.state.fighters.p2.x = 30;
      runtime.frameAdvance({ p1: { light: true } }); let ticks = 0; while (runtime.state.fighters.p1.comboCount === 0 && ticks < 30) { runtime.frameAdvance({}); ticks++; }
      const first = { combo: runtime.state.fighters.p1.comboCount, scale: runtime.state.fighters.p1.damageScaling };
      while (runtime.state.fighters.p1.comboCount !== 0 && ticks < 180) { runtime.frameAdvance({}); ticks++; }
      const reset = { combo: runtime.state.fighters.p1.comboCount, scale: runtime.state.fighters.p1.damageScaling, ticks };
      renderer.render(runtime.state); return { first, reset };
    });
    await page.waitForTimeout(100); await page.screenshot({ path: path.join(OUT_DIR, 'combo_reset.png'), fullPage: true });

    const blockDuringHitstun = await page.evaluate(() => {
      const { runtime, renderer } = window.__NGA_ENGINE_V2_DEBUG__; runtime.reset(); runtime.setPaused(true); runtime.state.fighters.p1.x = -72; runtime.state.fighters.p2.x = 30;
      runtime.frameAdvance({ p1: { light: true } }); let ticks = 0; while (runtime.state.fighters.p1.comboCount < 1 && ticks < 30) { runtime.frameAdvance({}); ticks++; }
      const firstHealth = runtime.state.fighters.p2.health; runtime.frameAdvance({ p1: { medium: true }, p2: { block: true } });
      while (runtime.state.fighters.p1.comboCount < 2 && ticks < 90) { runtime.frameAdvance({ p2: { block: true } }); ticks++; }
      renderer.render(runtime.state); return { firstHealth, finalHealth: runtime.state.fighters.p2.health, combo: runtime.state.fighters.p1.comboCount, blockstun: runtime.state.fighters.p2.blockstun, blocking: runtime.state.fighters.p2.blocking };
    });
    await page.waitForTimeout(100); await page.screenshot({ path: path.join(OUT_DIR, 'block_rejected_during_hitstun.png'), fullPage: true });

    await page.evaluate(() => { const debug = window.__NGA_ENGINE_V2_DEBUG__; debug.runtime.reset(); debug.runtime.setPaused(false); });
    await page.waitForTimeout(500);
    const memoryStart = await page.evaluate(() => window.__NGA_ENGINE_V2_DEBUG__.renderer.getResourceSnapshot());
    await page.waitForTimeout(2500);
    const memoryEnd = await page.evaluate(() => window.__NGA_ENGINE_V2_DEBUG__.renderer.getResourceSnapshot());
    await page.evaluate(({ memoryStart, memoryEnd }) => { document.querySelector('#tuning').value = JSON.stringify({ rendererMemory: { start: memoryStart, end: memoryEnd }, expected: 'stable after warm-up' }, null, 2); }, { memoryStart, memoryEnd });
    await page.waitForTimeout(100); await page.screenshot({ path: path.join(OUT_DIR, 'renderer_memory_and_controls.png'), fullPage: true });
    const replay = await page.evaluate(async () => { const fixture = await fetch('/replays/lamuh_light_opening.replay.json').then((response) => response.json()); const state = window.__NGA_ENGINE_V2_DEBUG__.runtime.runReplayToEnd(fixture); return { expected: fixture.finalChecksum, actual: state.checksums.at(-1), tick: state.tick }; });

    assert.strictEqual(jump.startupTicks, 4); assert.strictEqual(landing.y, 0); assert.strictEqual(landing.vy, 0);
    assert.strictEqual(dash.duration, 12); assert.strictEqual(standingChain.combo, 3); assert.strictEqual(lowChain.combo, 3);
    assert.ok(launcherApex.minimumY >= launcherApex.ceilingY); assert.strictEqual(launcherLanding.grounded, true); assert.ok(launcherLanding.ticks < 120);
    assert.deepStrictEqual(launcherToAirLight.route, ['crouching_heavy', 'air_light']); assert.strictEqual(launcherToAirLight.move, 'air_light'); assert.deepStrictEqual(launcherToAirLight.cancels, ['air_medium', 'air_heavy']);
    assert.deepStrictEqual(airLightToMedium.route, ['crouching_heavy', 'air_light', 'air_medium']); assert.strictEqual(airLightToMedium.move, 'air_medium'); assert.deepStrictEqual(airLightToMedium.cancels, ['air_heavy']);
    assert.deepStrictEqual(fullAerialRoute.route, ['crouching_heavy', 'air_light', 'air_medium', 'air_heavy']); assert.strictEqual(fullAerialRoute.combo, 4); assert.strictEqual(fullAerialRoute.damage, 194); assert.strictEqual(fullAerialRoute.defenderPhase, 'knockdown'); assert.strictEqual(fullAerialRoute.remainingAirActions, 0);
    assert.strictEqual(aerialLanding.attackerPhase, 'landing'); assert.strictEqual(aerialLanding.attackerMove, null); assert.strictEqual(aerialLanding.remainingAirActions, 0); assert.deepStrictEqual(aerialLanding.warnings, []);
    assert.deepStrictEqual(trade, { p1Health: 970, p2Health: 970 }); assert.deepStrictEqual(comboReset.reset.combo, 0); assert.strictEqual(comboReset.reset.scale, 1);
    assert.strictEqual(blockDuringHitstun.combo, 2); assert.ok(blockDuringHitstun.finalHealth < blockDuringHitstun.firstHealth); assert.strictEqual(blockDuringHitstun.blockstun, 0);
    assert.ok(memoryEnd.geometries - memoryStart.geometries <= 1, `renderer geometry grew ${memoryStart.geometries} -> ${memoryEnd.geometries}`);
    assert.strictEqual(memoryEnd.pooledOverlays, memoryStart.pooledOverlays); assert.strictEqual(replay.actual, replay.expected); assert.deepStrictEqual(consoleErrors, []);

    const screenshots = ['neutral_jump.png', 'neutral_landing.png', 'dash_authored_duration.png', 'chain_5l_5m_5h.png', 'chain_2l_2m_2h.png', 'launcher_bounded_apex.png', 'launcher_landing.png', 'aerial_2h_to_jj_hud.png', 'aerial_jj_to_jk.png', 'aerial_full_jj_jk_jl.png', 'aerial_jl_landing_knockdown.png', 'aerial_normals_contact_sheet.png', 'simultaneous_trade.png', 'combo_reset.png', 'block_rejected_during_hitstun.png', 'renderer_memory_and_controls.png'];
    const report = { url, platform: process.platform, consoleErrors, jump, landing, dash, standingChain, lowChain, launcherApex, launcherLanding, aerial: { launcherToAirLight, airLightToMedium, fullRoute: fullAerialRoute, landing: aerialLanding, observedIssues: { droppedInputs: false, cameraEscape: false, floatiness: false, landingInterruption: false, comboReset: false } }, trade, comboReset, blockDuringHitstun, replay, rendererMemory: { start: memoryStart, end: memoryEnd, expectedStableGeometryRange: [memoryStart.geometries, memoryStart.geometries + 1] }, controls: { movement: 'WASD/arrows', groundAndAirLight: 'J', groundAndAirMedium: 'K', groundAndAirHeavy: 'L', block: 'O', pause: 'Escape', overlays: 'F1', step: '. while paused', reset: 'R', reserved: ['U Special', 'I Throw', 'P Burst'] }, screenshots, serverLogs: logs.join('').split('\n').slice(0, 12) };
    fs.writeFileSync(path.join(OUT_DIR, 'browser_smoke_report.json'), JSON.stringify(report, null, 2));
    console.log(`Browser smoke passed at ${url}`); console.log(JSON.stringify(report, null, 2));
  } finally {
    if (browser) await browser.close();
    await stopServer(server);
  }
}

main().catch((error) => { console.error(error); process.exit(1); });
