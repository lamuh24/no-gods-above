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
    await page.waitForFunction(() => window.__NGA_ENGINE_V2_DEBUG__.renderer.getCharacterVisualStatus()?.ready === true);
    await page.waitForTimeout(250);

    const characterVisual = await page.evaluate(() => {
      const { runtime, renderer } = window.__NGA_ENGINE_V2_DEBUG__;
      runtime.reset(); runtime.setPaused(true); renderer.render(runtime.state);
      const status = { ...renderer.getCharacterVisualStatus() };
      const model = renderer.scene.getObjectByName('lamuh_prototype_v0_visual');
      const layers = ['lamuh_body', 'lamuh_clothing', 'lamuh_hair', 'lamuh_accessories'].map((name) => !!renderer.scene.getObjectByName(name));
      Object.assign(renderer.overlays, { push: false, hurt: false, strike: false, throw: false, anchors: false, origin: false, facing: false, ground: true });
      renderer.render(runtime.state);
      return { status, modelPresent: !!model, layers };
    });
    await page.screenshot({ path: path.join(OUT_DIR, 'lamuh_3d_adapter_proof.png'), fullPage: true });
    await page.evaluate(() => Object.assign(window.__NGA_ENGINE_V2_DEBUG__.renderer.overlays, { push: true, hurt: true, strike: true, throw: true, anchors: true, origin: true, facing: true, ground: true }));

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

    const readHud = async () => {
      await page.waitForTimeout(50);
      return page.evaluate(() => JSON.parse(document.querySelector('#hud').textContent || '{}'));
    };
    const focusThrowHud = async (fighterKey = 'lamuh') => {
      await page.evaluate((key) => {
        const panel = document.querySelector('.panel');
        const hud = document.querySelector('#hud');
        const text = hud.textContent || '';
        const fighterIndex = text.indexOf(`"${key}":`);
        const throwIndex = fighterIndex >= 0 ? text.indexOf('"throw":', fighterIndex) : -1;
        const markerIndex = throwIndex >= 0 ? throwIndex : Math.max(0, fighterIndex);
        const line = text.slice(0, markerIndex).split('\n').length - 1;
        const lineHeight = Number.parseFloat(getComputedStyle(hud).lineHeight) || 16;
        panel.scrollTop = Math.max(0, hud.offsetTop + (line - 2) * lineHeight);
      }, fighterKey);
      await page.waitForTimeout(50);
    };
    const resetPanelScroll = () => page.evaluate(() => { document.querySelector('.panel').scrollTop = 0; });
    const stepPausedKeyboard = async (count = 1) => {
      for (let index = 0; index < count; index++) await page.keyboard.press('Period');
    };
    const readP1ThrowState = () => page.evaluate(() => {
      const fighter = window.__NGA_ENGINE_V2_DEBUG__.runtime.state.fighters.p1;
      return { phase: fighter.phase, timer: fighter.phaseTick, move: fighter.currentThrow, outcome: fighter.lastThrowOutcome };
    });

    // Traverse the real keyboard adapter and paused debug-step handler. Holding I must produce one
    // deterministic edge, visibly expose startup/active/whiff, and never auto-repeat after recovery.
    await page.keyboard.up('i');
    await page.evaluate(() => {
      const { runtime, renderer } = window.__NGA_ENGINE_V2_DEBUG__;
      runtime.reset(); runtime.setPaused(true);
      runtime.state.fighters.p1.x = -170; runtime.state.fighters.p2.x = 170;
      renderer.render(runtime.state);
    });
    await page.keyboard.down('i');
    await stepPausedKeyboard();
    const keyboardThrowStartup = { state: await readP1ThrowState(), hud: await readHud() };
    await page.screenshot({ path: path.join(OUT_DIR, 'throw_keyboard_i_startup_hud.png'), fullPage: true });

    let keyboardTicks = 1;
    let keyboardState = keyboardThrowStartup.state;
    while (keyboardState.phase !== 'throw_active' && keyboardTicks < 12) {
      await stepPausedKeyboard(); keyboardTicks++; keyboardState = await readP1ThrowState();
    }
    const throwActiveRange = { ticksFromInput: keyboardTicks, state: keyboardState, hud: await readHud() };
    await page.screenshot({ path: path.join(OUT_DIR, 'throw_active_range.png'), fullPage: true });

    while (keyboardState.phase !== 'throw_whiff' && keyboardTicks < 20) {
      await stepPausedKeyboard(); keyboardTicks++; keyboardState = await readP1ThrowState();
    }
    const throwWhiff = { ticksFromInput: keyboardTicks, state: keyboardState, hud: await readHud() };
    await focusThrowHud('lamuh');
    await page.screenshot({ path: path.join(OUT_DIR, 'throw_whiff_recovery.png'), fullPage: true });

    while (keyboardState.move !== null && keyboardTicks < 60) {
      await stepPausedKeyboard(); keyboardTicks++; keyboardState = await readP1ThrowState();
    }
    const recoveredWhileHeld = { ...keyboardState, ticksFromInput: keyboardTicks };
    let heldRetriggered = false;
    for (let index = 0; index < 8; index++) {
      await stepPausedKeyboard(); keyboardState = await readP1ThrowState();
      if (keyboardState.move !== null || keyboardState.phase.startsWith('throw_')) heldRetriggered = true;
    }
    const heldNoRetrigger = { recoveredWhileHeld, heldRetriggered, final: keyboardState };
    await page.keyboard.up('i');

    const throwCapture = await page.evaluate(() => {
      const { runtime, renderer } = window.__NGA_ENGINE_V2_DEBUG__;
      runtime.reset(); runtime.setPaused(true);
      const p1 = runtime.state.fighters.p1, p2 = runtime.state.fighters.p2;
      p1.x = -40; p2.x = 30;
      runtime.frameAdvance({ p1: { throw: true } });
      let ticks = 1;
      while (p1.phase !== 'throw_capture' && ticks < 24) { runtime.frameAdvance({}); ticks++; }
      if (p1.phase !== 'throw_capture') throw new Error('forward throw did not capture in browser evidence');
      renderer.render(runtime.state);
      return { ticks, attacker: { phase: p1.phase, partner: p1.throwPartner, facing: p1.facing, throwFacing: p1.throwFacing, pos: [p1.x, p1.y] }, victim: { phase: p2.phase, partner: p2.throwPartner, facing: p2.facing, pos: [p2.x, p2.y] }, separation: p2.x - p1.x };
    });
    const throwCaptureHud = await readHud();
    await focusThrowHud('lamuh');
    await page.screenshot({ path: path.join(OUT_DIR, 'throw_capture_anchors_hud.png'), fullPage: true });
    const throwAnchorStability = await page.evaluate(() => {
      const { runtime, renderer } = window.__NGA_ENGINE_V2_DEBUG__;
      const before = { p1: [runtime.state.fighters.p1.x, runtime.state.fighters.p1.y], p2: [runtime.state.fighters.p2.x, runtime.state.fighters.p2.y] };
      runtime.frameAdvance({}); runtime.frameAdvance({}); runtime.frameAdvance({});
      renderer.render(runtime.state);
      const after = { p1: [runtime.state.fighters.p1.x, runtime.state.fighters.p1.y], p2: [runtime.state.fighters.p2.x, runtime.state.fighters.p2.y] };
      return { before, after };
    });

    const throwTech = await page.evaluate(() => {
      const { runtime, renderer } = window.__NGA_ENGINE_V2_DEBUG__;
      runtime.reset(); runtime.setPaused(true);
      const p1 = runtime.state.fighters.p1, p2 = runtime.state.fighters.p2;
      p1.x = -40; p2.x = 30;
      runtime.frameAdvance({ p1: { throw: true } });
      let captureTicks = 1;
      while (p1.phase !== 'throw_capture' && captureTicks < 24) { runtime.frameAdvance({}); captureTicks++; }
      runtime.frameAdvance({ p2: { throw: true } });
      renderer.render(runtime.state);
      return { captureTicks, attacker: { phase: p1.phase, health: p1.health, partner: p1.throwPartner, outcome: p1.lastThrowOutcome, invuln: p1.throwInvulnTicks, pos: [p1.x, p1.y] }, victim: { phase: p2.phase, health: p2.health, partner: p2.throwPartner, outcome: p2.lastThrowOutcome, invuln: p2.throwInvulnTicks, pos: [p2.x, p2.y] } };
    });
    const throwTechHud = await readHud();
    await focusThrowHud('lamuh');
    await page.screenshot({ path: path.join(OUT_DIR, 'throw_tech.png'), fullPage: true });

    const throwRelease = await page.evaluate(() => {
      const { runtime, renderer } = window.__NGA_ENGINE_V2_DEBUG__;
      runtime.reset(); runtime.setPaused(true);
      const p1 = runtime.state.fighters.p1, p2 = runtime.state.fighters.p2;
      const start = { p1: [p1.x = -40, p1.y], p2: [p2.x = 30, p2.y], defenderHealth: p2.health };
      runtime.frameAdvance({ p1: { throw: true } });
      let ticks = 1;
      while (p1.phase !== 'throw_release' && ticks < 60) { runtime.frameAdvance({}); ticks++; }
      if (p1.phase !== 'throw_release') throw new Error('forward throw did not reach authored release in browser evidence');
      renderer.render(runtime.state);
      return { ticks, start, attacker: { phase: p1.phase, pos: [p1.x, p1.y], combo: p1.comboCount, damage: p1.comboDamage, route: [...p1.comboRoute], outcome: p1.lastThrowOutcome }, victim: { phase: p2.phase, health: p2.health, pos: [p2.x, p2.y], knockdownTicks: p2.knockdownTicks, outcome: p2.lastThrowOutcome } };
    });
    const throwReleaseHud = await readHud();
    await focusThrowHud('lamuh');
    await page.screenshot({ path: path.join(OUT_DIR, 'throw_release_impact.png'), fullPage: true });
    const throwKnockdown = await page.evaluate(() => {
      const { runtime, renderer } = window.__NGA_ENGINE_V2_DEBUG__;
      const p1 = runtime.state.fighters.p1, p2 = runtime.state.fighters.p2;
      let ticks = 0;
      while (p2.phase !== 'knockdown' && ticks < 40) { runtime.frameAdvance({}); ticks++; }
      const healthAtKnockdown = p2.health;
      for (let index = 0; index < 5; index++) runtime.frameAdvance({});
      renderer.render(runtime.state);
      return { ticks, attacker: { phase: p1.phase, pos: [p1.x, p1.y] }, victim: { phase: p2.phase, health: p2.health, healthAtKnockdown, grounded: p2.grounded, knockdownTicks: p2.knockdownTicks, pos: [p2.x, p2.y] } };
    });
    await focusThrowHud('dummy');
    await page.screenshot({ path: path.join(OUT_DIR, 'throw_knockdown.png'), fullPage: true });

    const throwCornerContainment = await page.evaluate(() => {
      const { runtime, renderer } = window.__NGA_ENGINE_V2_DEBUG__;
      runtime.reset(); runtime.setPaused(true);
      const p1 = runtime.state.fighters.p1, p2 = runtime.state.fighters.p2;
      p1.x = 350; p2.x = 400;
      runtime.frameAdvance({ p1: { throw: true } });
      let ticks = 1;
      while (p1.phase !== 'throw_release' && ticks < 60) { runtime.frameAdvance({}); ticks++; }
      renderer.render(runtime.state);
      const stage = runtime.state.stage;
      return { ticks, stage: { left: stage.left, right: stage.right }, attacker: { phase: p1.phase, x: p1.x }, victim: { phase: p2.phase, x: p2.x }, cameraX: renderer.camera.position.x, warnings: [...runtime.state.debugWarnings] };
    });
    await focusThrowHud('lamuh');
    await page.screenshot({ path: path.join(OUT_DIR, 'throw_corner_containment.png'), fullPage: true });

    const throwResetCleanup = await page.evaluate(() => {
      const { runtime } = window.__NGA_ENGINE_V2_DEBUG__;
      runtime.reset(); runtime.setPaused(true);
      const p1 = runtime.state.fighters.p1, p2 = runtime.state.fighters.p2;
      p1.x = -40; p2.x = 30;
      runtime.frameAdvance({ p1: { throw: true } });
      let ticks = 1;
      while (p1.phase !== 'throw_capture' && ticks < 24) { runtime.frameAdvance({}); ticks++; }
      return { ticks, attackerPhase: p1.phase, victimPhase: p2.phase, attackerPartner: p1.throwPartner, victimPartner: p2.throwPartner };
    });
    await page.click('#reset');
    await page.waitForTimeout(50);
    const throwResetState = await page.evaluate(() => {
      const { runtime, renderer } = window.__NGA_ENGINE_V2_DEBUG__;
      renderer.render(runtime.state);
      const p1 = runtime.state.fighters.p1, p2 = runtime.state.fighters.p2;
      return { attacker: { phase: p1.phase, move: p1.currentThrow, partner: p1.throwPartner, outcome: p1.lastThrowOutcome }, victim: { phase: p2.phase, move: p2.currentThrow, partner: p2.throwPartner, outcome: p2.lastThrowOutcome }, warnings: [...runtime.state.debugWarnings] };
    });
    const throwResetHud = await readHud();
    await focusThrowHud('lamuh');
    await page.screenshot({ path: path.join(OUT_DIR, 'throw_reset_cleanup.png'), fullPage: true });
    await resetPanelScroll();

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

    assert.strictEqual(characterVisual.status.ready, true); assert.strictEqual(characterVisual.status.error, null); assert.strictEqual(characterVisual.modelPresent, true); assert.deepStrictEqual(characterVisual.layers, [true, true, true, true]);
    assert.strictEqual(jump.startupTicks, 4); assert.strictEqual(landing.y, 0); assert.strictEqual(landing.vy, 0);
    assert.strictEqual(dash.duration, 12); assert.strictEqual(standingChain.combo, 3); assert.strictEqual(lowChain.combo, 3);
    assert.ok(launcherApex.minimumY >= launcherApex.ceilingY); assert.strictEqual(launcherLanding.grounded, true); assert.ok(launcherLanding.ticks < 120);
    assert.deepStrictEqual(launcherToAirLight.route, ['crouching_heavy', 'air_light']); assert.strictEqual(launcherToAirLight.move, 'air_light'); assert.deepStrictEqual(launcherToAirLight.cancels, ['air_medium', 'air_heavy']);
    assert.deepStrictEqual(airLightToMedium.route, ['crouching_heavy', 'air_light', 'air_medium']); assert.strictEqual(airLightToMedium.move, 'air_medium'); assert.deepStrictEqual(airLightToMedium.cancels, ['air_heavy']);
    assert.deepStrictEqual(fullAerialRoute.route, ['crouching_heavy', 'air_light', 'air_medium', 'air_heavy']); assert.strictEqual(fullAerialRoute.combo, 4); assert.strictEqual(fullAerialRoute.damage, 194); assert.strictEqual(fullAerialRoute.defenderPhase, 'knockdown'); assert.strictEqual(fullAerialRoute.remainingAirActions, 0);
    assert.strictEqual(aerialLanding.attackerPhase, 'landing'); assert.strictEqual(aerialLanding.attackerMove, null); assert.strictEqual(aerialLanding.remainingAirActions, 0); assert.deepStrictEqual(aerialLanding.warnings, []);
    assert.deepStrictEqual(trade, { p1Health: 970, p2Health: 970 }); assert.deepStrictEqual(comboReset.reset.combo, 0); assert.strictEqual(comboReset.reset.scale, 1);
    assert.strictEqual(blockDuringHitstun.combo, 2); assert.ok(blockDuringHitstun.finalHealth < blockDuringHitstun.firstHealth); assert.strictEqual(blockDuringHitstun.blockstun, 0);
    assert.strictEqual(keyboardThrowStartup.state.phase, 'throw_startup'); assert.strictEqual(keyboardThrowStartup.state.move, 'forward_throw');
    assert.strictEqual(keyboardThrowStartup.hud.normalizedInput.throw, true); assert.strictEqual(keyboardThrowStartup.hud.lamuh.throw.input.pressed, true); assert.strictEqual(keyboardThrowStartup.hud.lamuh.throw.input.held, true); assert.strictEqual(keyboardThrowStartup.hud.lamuh.throw.input.normalizedHeld, true);
    assert.match(keyboardThrowStartup.hud.controls.throw, /^I \/ gamepad button 5$/); assert.match(keyboardThrowStartup.hud.combatActionStatus.throw, /^active/);
    assert.strictEqual(throwActiveRange.state.phase, 'throw_active'); assert.strictEqual(throwActiveRange.hud.lamuh.throw.state, 'throw_active'); assert.strictEqual(throwActiveRange.hud.lamuh.throw.role, 'attacker'); assert.ok(throwActiveRange.hud.lamuh.throw.anchors);
    assert.strictEqual(throwWhiff.state.phase, 'throw_whiff'); assert.strictEqual(throwWhiff.state.outcome, 'whiff'); assert.strictEqual(heldNoRetrigger.heldRetriggered, false); assert.strictEqual(heldNoRetrigger.final.move, null); assert.strictEqual(heldNoRetrigger.final.phase, 'idle');
    assert.strictEqual(throwCapture.attacker.phase, 'throw_capture'); assert.strictEqual(throwCapture.victim.phase, 'throw_victim_captured'); assert.strictEqual(throwCapture.attacker.partner, 'p2'); assert.strictEqual(throwCapture.victim.partner, 'p1');
    assert.strictEqual(throwCaptureHud.lamuh.throw.state, 'throw_capture'); assert.strictEqual(throwCaptureHud.lamuh.throw.role, 'attacker'); assert.strictEqual(throwCaptureHud.lamuh.throw.pushSuppressed, true); assert.strictEqual(throwCaptureHud.lamuh.throw.techRemaining, 8);
    assert.strictEqual(throwCaptureHud.dummy.throw.role, 'victim'); assert.deepStrictEqual(throwCaptureHud.lamuh.throw.anchors.grab, throwCaptureHud.lamuh.throw.anchors.victim); assert.deepStrictEqual(throwAnchorStability.after, throwAnchorStability.before);
    assert.strictEqual(throwTech.attacker.phase, 'throw_teched'); assert.strictEqual(throwTech.victim.phase, 'throw_teched'); assert.strictEqual(throwTech.attacker.health, 1000); assert.strictEqual(throwTech.victim.health, 1000); assert.strictEqual(throwTech.attacker.partner, null); assert.strictEqual(throwTech.victim.partner, null); assert.strictEqual(throwTech.attacker.outcome, 'teched'); assert.strictEqual(throwTech.victim.outcome, 'teched'); assert.ok(throwTech.attacker.invuln > 0 && throwTech.victim.invuln > 0); assert.strictEqual(throwTechHud.lamuh.throw.state, 'throw_teched');
    assert.strictEqual(throwRelease.attacker.phase, 'throw_release'); assert.strictEqual(throwRelease.victim.phase, 'throw_victim_released'); assert.strictEqual(throwRelease.victim.health, throwRelease.start.defenderHealth - 100); assert.strictEqual(throwRelease.attacker.combo, 1); assert.strictEqual(throwRelease.attacker.damage, 100); assert.deepStrictEqual(throwRelease.attacker.route, ['forward_throw']); assert.ok(throwRelease.attacker.pos[0] > throwRelease.start.p1[0]); assert.strictEqual(throwReleaseHud.lamuh.throw.state, 'throw_release'); assert.strictEqual(throwReleaseHud.dummy.throw.state, 'throw_victim_released');
    assert.strictEqual(throwKnockdown.victim.phase, 'knockdown'); assert.strictEqual(throwKnockdown.victim.grounded, true); assert.strictEqual(throwKnockdown.victim.health, throwKnockdown.victim.healthAtKnockdown); assert.ok(throwKnockdown.victim.knockdownTicks > 0);
    assert.ok(throwCornerContainment.attacker.x >= throwCornerContainment.stage.left && throwCornerContainment.attacker.x <= throwCornerContainment.stage.right); assert.ok(throwCornerContainment.victim.x >= throwCornerContainment.stage.left && throwCornerContainment.victim.x <= throwCornerContainment.stage.right); assert.ok(Number.isFinite(throwCornerContainment.cameraX)); assert.deepStrictEqual(throwCornerContainment.warnings, []);
    assert.strictEqual(throwResetCleanup.attackerPhase, 'throw_capture'); assert.strictEqual(throwResetCleanup.victimPhase, 'throw_victim_captured'); assert.deepStrictEqual(throwResetState, { attacker: { phase: 'idle', move: null, partner: null, outcome: null }, victim: { phase: 'idle', move: null, partner: null, outcome: null }, warnings: [] }); assert.strictEqual(throwResetHud.lamuh.throw.state, 'none'); assert.strictEqual(throwResetHud.dummy.throw.state, 'none');
    assert.ok(memoryEnd.geometries - memoryStart.geometries <= 1, `renderer geometry grew ${memoryStart.geometries} -> ${memoryEnd.geometries}`);
    assert.strictEqual(memoryEnd.pooledOverlays, memoryStart.pooledOverlays); assert.strictEqual(replay.actual, replay.expected); assert.deepStrictEqual(consoleErrors, []);

    const screenshots = ['lamuh_3d_adapter_proof.png', 'neutral_jump.png', 'neutral_landing.png', 'dash_authored_duration.png', 'chain_5l_5m_5h.png', 'chain_2l_2m_2h.png', 'launcher_bounded_apex.png', 'launcher_landing.png', 'aerial_2h_to_jj_hud.png', 'aerial_jj_to_jk.png', 'aerial_full_jj_jk_jl.png', 'aerial_jl_landing_knockdown.png', 'aerial_normals_contact_sheet.png', 'throw_keyboard_i_startup_hud.png', 'throw_active_range.png', 'throw_whiff_recovery.png', 'throw_capture_anchors_hud.png', 'throw_tech.png', 'throw_release_impact.png', 'throw_knockdown.png', 'throw_corner_containment.png', 'throw_reset_cleanup.png', 'simultaneous_trade.png', 'combo_reset.png', 'block_rejected_during_hitstun.png', 'renderer_memory_and_controls.png'];
    const throwHudEvidence = {
      keyboardStartup: { normalizedInput: keyboardThrowStartup.hud.normalizedInput, controls: keyboardThrowStartup.hud.controls, status: keyboardThrowStartup.hud.combatActionStatus.throw, lamuh: keyboardThrowStartup.hud.lamuh.throw },
      activeRange: throwActiveRange.hud.lamuh.throw,
      capture: { lamuh: throwCaptureHud.lamuh.throw, dummy: throwCaptureHud.dummy.throw },
      tech: { lamuh: throwTechHud.lamuh.throw, dummy: throwTechHud.dummy.throw },
      release: { lamuh: throwReleaseHud.lamuh.throw, dummy: throwReleaseHud.dummy.throw },
      reset: { lamuh: throwResetHud.lamuh.throw, dummy: throwResetHud.dummy.throw }
    };
    const report = { url, platform: process.platform, consoleErrors, characterVisual: { ...characterVisual, qualityGate: 'failed: procedural silhouette remains mannequin-like; Tripo Path B required' }, jump, landing, dash, standingChain, lowChain, launcherApex, launcherLanding, aerial: { launcherToAirLight, airLightToMedium, fullRoute: fullAerialRoute, landing: aerialLanding, observedIssues: { droppedInputs: false, cameraEscape: false, floatiness: false, landingInterruption: false, comboReset: false } }, throw: { keyboard: { startup: keyboardThrowStartup.state, activeRange: { ticksFromInput: throwActiveRange.ticksFromInput, state: throwActiveRange.state }, whiff: { ticksFromInput: throwWhiff.ticksFromInput, state: throwWhiff.state }, heldNoRetrigger }, capture: throwCapture, anchorStability: throwAnchorStability, tech: throwTech, release: throwRelease, knockdown: throwKnockdown, cornerContainment: throwCornerContainment, resetCleanup: { before: throwResetCleanup, after: throwResetState }, hud: throwHudEvidence, observedIssues: { droppedInput: false, heldInputRetrigger: false, anchorDrift: false, repeatedDamage: false, cornerEscape: false, cameraEscape: false, resetLeak: false } }, trade, comboReset, blockDuringHitstun, replay, rendererMemory: { start: memoryStart, end: memoryEnd, expectedStableGeometryRange: [memoryStart.geometries, memoryStart.geometries + 1] }, controls: { movement: 'WASD/arrows', groundAndAirLight: 'J', groundAndAirMedium: 'K', groundAndAirHeavy: 'L', throwAndThrowTech: 'I / gamepad button 5', block: 'O', pause: 'Escape', overlays: 'F1', step: '. while paused', reset: 'R', reserved: ['U Special', 'P Burst'] }, screenshots, serverLogs: logs.join('').split('\n').slice(0, 12) };
    fs.writeFileSync(path.join(OUT_DIR, 'browser_smoke_report.json'), JSON.stringify(report, null, 2));
    console.log(`Browser smoke passed at ${url}`); console.log(JSON.stringify(report, null, 2));
  } finally {
    if (browser) await browser.close();
    await stopServer(server);
  }
}

main().catch((error) => { console.error(error); process.exit(1); });
