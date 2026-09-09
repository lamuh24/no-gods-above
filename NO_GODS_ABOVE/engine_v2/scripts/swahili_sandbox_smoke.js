#!/usr/bin/env node
const assert = require('assert');
const { chromium } = require('playwright');
const { spawn } = require('child_process');
const fs = require('fs');
const net = require('net');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const OUT_DIR = path.join(ROOT, 'docs', 'swahili_sandbox', 'captures');
const VITE_BIN = path.join(ROOT, 'node_modules', 'vite', 'bin', 'vite.js');
fs.mkdirSync(OUT_DIR, { recursive: true });

const SCENARIOS = [
  'idle_center', 'forward_walk', 'backward_walk', 'walk_reversal', 'crouch', 'standing_block',
  'crouching_block', 'standing_heavy_whiff', 'standing_heavy_hit', 'standing_heavy_block',
  'light_hit_reaction', 'heavy_hit_reaction', 'left_corner', 'right_corner', 'side_switch',
  'mirrored_facing', 'jump_camera_placeholder',
  'standing_block_entry', 'standing_block_hold', 'standing_block_release',
  'crouching_block_entry', 'crouching_block_hold', 'crouching_block_release',
  'light_hit_from_idle', 'light_hit_from_walk', 'light_hit_from_crouch', 'light_hit_from_block',
  'heavy_hit_from_idle', 'heavy_hit_from_walk', 'heavy_hit_from_crouch', 'heavy_hit_from_block',
  'defense_hitstop_freeze', 'defense_rapid_hits', 'defense_return_state',
  'heavy_first_active_hit', 'heavy_last_active_hit', 'heavy_counter_hit',
  'heavy_standing_block_v1', 'heavy_crouching_block_v1', 'heavy_whiff_complete',
  'heavy_corner_hit', 'heavy_max_range_standing', 'heavy_max_range_crouching', 'heavy_just_outside_range',
  'heavy_mirrored_p2', 'heavy_side_switch', 'heavy_repeated_use',
  'heavy_punish_after_block', 'heavy_punish_after_whiff',
  'heavy_normal_hit_pressure', 'heavy_counter_hit_pressure', 'heavy_rollback_replay',
  'command_grab_hit', 'command_grab_whiff', 'command_grab_mirrored'
];

const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
const availablePort = () => new Promise((resolve, reject) => { const server = net.createServer(); server.once('error', reject); server.listen(0, '127.0.0.1', () => { const address = server.address(); const port = typeof address === 'object' && address ? address.port : 0; server.close(() => resolve(port)); }); });
async function waitForServer(url) { for (let index = 0; index < 100; index++) { try { const response = await fetch(url); if (response.ok && (await response.text()).includes('Swahili Engine V2')) return; } catch (_) {} await wait(250); } throw new Error(`Timed out waiting for ${url}`); }
async function stopServer(server) { if (!server || server.exitCode !== null) return; server.kill('SIGTERM'); await Promise.race([new Promise((resolve) => server.once('exit', resolve)), wait(3000)]); if (server.exitCode === null) server.kill('SIGKILL'); }

function captureIndex(records) {
  const cards = records.map(({ id, filename }) => `<section><h2>${id}</h2><img src="${filename}" loading="lazy"></section>`).join('\n');
  return `<!doctype html><html><head><meta charset="utf-8"><title>Swahili Sandbox Captures</title><style>body{margin:0;padding:20px;background:#08090e;color:#eee;font-family:system-ui}p{color:#c8a86b}section{margin:22px 0;border-top:1px solid #333;padding-top:14px}img{display:block;width:100%;max-width:1280px;background:#111}</style></head><body><h1>Swahili Engine V2 Development Sandbox</h1><p>APPROVED_RECOMMENDED_PROFILE · authoritative V1 sandbox baseline · candidate-only · deployable false · not in production roster</p>${cards}</body></html>`;
}

async function main() {
  const port = await availablePort();
  const url = `http://127.0.0.1:${port}/sandbox.html?capture=1`;
  const server = spawn(process.execPath, [VITE_BIN, '--host', '127.0.0.1', '--port', String(port), '--strictPort'], { cwd: ROOT, stdio: ['ignore', 'pipe', 'pipe'], windowsHide: true });
  const logs = [];
  server.stdout.on('data', (data) => logs.push(data.toString()));
  server.stderr.on('data', (data) => logs.push(data.toString()));
  let browser;
  try {
    await waitForServer(url);
    browser = await chromium.launch({ headless: true });
    const page = await browser.newPage({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1 });
    const consoleErrors = [];
    page.on('console', (message) => { if (message.type() === 'error') consoleErrors.push(message.text()); });
    page.on('pageerror', (error) => consoleErrors.push(error.message));
    await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 60000 });
    await page.waitForFunction(() => !!window.__NGA_SWAHILI_SANDBOX__, null, { timeout: 60000 });
    await page.evaluate(() => window.__NGA_SWAHILI_SANDBOX__.ready);
    await page.evaluate((scenarios) => {
      const api = window.__NGA_SWAHILI_SANDBOX__;
      const gl = api.renderer.renderer.getContext();
      // Prewarm every scenario texture before evidence capture. Without this,
      // software WebGL can present a partially uploaded frame while a newly
      // selected 1536 source is being sampled into its runtime texture.
      for (const scenario of scenarios) {
        api.runScenario(scenario);
        api.snapshot();
        gl.finish();
      }
      api.reset();
    }, SCENARIOS);
    await page.waitForTimeout(100);
    const viewport = page.locator('#viewport');
    const records = [];

    for (const id of SCENARIOS) {
      const snapshot = await page.evaluate((scenario) => {
        const api = window.__NGA_SWAHILI_SANDBOX__;
        api.setDiagnostics(true);
        api.runScenario(scenario);
        let snapshot;
        // CanvasTextures are uploaded lazily. Render and flush several times so
        // evidence captures include WebGL content on software and discrete GPUs.
        for (let pass = 0; pass < 4; pass++) {
          snapshot = api.snapshot();
          api.renderer.renderer.getContext().finish();
        }
        return snapshot;
      }, id);
      await page.waitForTimeout(60);
      await page.evaluate(() => {
        const api = window.__NGA_SWAHILI_SANDBOX__;
        for (let pass = 0; pass < 3; pass++) api.snapshot();
        api.renderer.renderer.getContext().finish();
      });
      const filename = `${id}.png`;
      await viewport.screenshot({ path: path.join(OUT_DIR, filename) });
      records.push({ id, filename, snapshot });
    }

    const interaction = await page.evaluate(() => {
      const api = window.__NGA_SWAHILI_SANDBOX__;
      api.reset();
      const before = api.state.fighters.p1.x;
      api.step({ right: true }, 6);
      const after = api.state.fighters.p1.x;
      api.step({ command: 'switch_sides' });
      return { before, after, p1FacingAfterSwitch: api.state.fighters.p1.facing, p2FacingAfterSwitch: api.state.fighters.p2.facing };
    });

    const renderAuthority = await page.evaluate(() => {
      const api = window.__NGA_SWAHILI_SANDBOX__;
      api.reset();
      const before = api.snapshot().checksum;
      for (let index = 0; index < 12; index++) api.renderer.render(api.state);
      const afterRender = api.snapshot().checksum;
      const benchmark = api.renderer.benchmark(api.state, 90);
      const afterBenchmark = api.snapshot().checksum;
      return { before, afterRender, afterBenchmark, benchmark };
    });

    const rollbackPresentation = await page.evaluate(() => {
      const api = window.__NGA_SWAHILI_SANDBOX__;
      api.reset();
      const before = api.cloneState();
      api.forceReaction('p2', 'light');
      api.restoreState(before, true);
      api.forceReaction('p2', 'light');
      return {
        emitted: api.state.presentationEvents.filter((event) => !event.deduplicated).length,
        deduplicated: api.state.presentationEvents.filter((event) => event.deduplicated).length,
        ledgerSize: api.state.presentationEventLedger.length
      };
    });

    const commandGrabInteraction = await page.evaluate(() => {
      const api = window.__NGA_SWAHILI_SANDBOX__;
      api.runScenario('command_grab_hit');
      const frames = new Set();
      let shotWasAirborne = false;
      let landingAfterShot = false;
      let shotSeen = false;
      let shotVfx = null;
      let maxLaunchDistance = 0;
      while (api.state.commandGrab.active && api.state.tick < 180) {
        frames.add(api.state.commandGrab.frameIndex);
        maxLaunchDistance = Math.max(maxLaunchDistance, api.state.commandGrab.launchDistance);
        if (!shotSeen && api.state.commandGrab.sourceTick >= api.commandGrabReview.shotSourceTick) {
          shotSeen = true;
          shotWasAirborne = api.state.fighters.p2.y < 0;
          shotVfx = api.snapshot().commandGrabFinisherReviewV1.vfx;
        }
        if (shotSeen && api.state.commandGrab.sourceTick >= api.commandGrabReview.landingSourceTick && api.state.fighters.p2.y === 0) landingAfterShot = true;
        api.step({}, 1);
      }
      return {
        frameCount: frames.size,
        result: api.state.commandGrab.result,
        sideSwitchCompleted: api.state.commandGrab.sideSwitchCompleted,
        victimHealth: api.state.fighters.p2.health,
        shotWasAirborne,
        landingAfterShot,
        p1x: api.state.fighters.p1.x,
        p2x: api.state.fighters.p2.x,
        maxLaunchDistance,
        shotVisualHitCount: api.state.commandGrab.shotVisualHitCount,
        shotVfx
      };
    });

    for (const record of records) {
      const snapshot = record.snapshot;
      assert.strictEqual(snapshot.status, 'preview-only');
      assert.strictEqual(snapshot.candidateOnly, true);
      assert.strictEqual(snapshot.deployable, false);
      assert.strictEqual(snapshot.productionRoster, false);
      assert.strictEqual(snapshot.authority.simulation, 'deterministic_60hz');
      assert.strictEqual(snapshot.authority.renderingMayAffectGameplay, false);
      assert.strictEqual(snapshot.arena.authority.renderingMayAffectGameplay, false);
      assert.strictEqual(snapshot.arena.resources.webgl2, true);
      assert.strictEqual(snapshot.arena.resources.loadedSpriteTextures, snapshot.spriteRegistryCount, 'sandbox must load every declared sprite source, including all 24 immutable command-grab frames');
      assert.strictEqual(snapshot.arena.resources.textureMaxResolution, 768);
      assert.strictEqual(snapshot.arena.resources.loadError, null);
      assert.strictEqual(snapshot.arena.resources.realTimeShadowCasters, 0);
      assert.strictEqual(snapshot.missingAnimationStates.filter((item) => item.startsWith('walk_backward:')).length, 3);
      for (const fighter of Object.values(snapshot.arena.fighters)) {
        assert.ok(fighter.rootAlignmentError <= 1e-9, `${record.id} root alignment drift`);
        assert.ok(fighter.shadowXError <= 1e-9, `${record.id} shadow alignment drift`);
        assert.strictEqual(fighter.root[2], 0, `${record.id} fighter left Z=0`);
      }
      for (const fighter of Object.values(snapshot.fighters)) {
        assert.ok(fighter.hurtboxes.length >= 3 && fighter.hurtboxes.length <= 4, `${record.id} body-part hurtbox count drift`);
        for (const hurtbox of fighter.hurtboxes) {
          assert.ok(hurtbox.w <= 94 && hurtbox.h <= 74, `${record.id} contains an oversized hurtbox`);
          const localLeft = fighter.facing > 0
            ? hurtbox.x - fighter.rootPosition[0]
            : fighter.rootPosition[0] - hurtbox.x - hurtbox.w;
          assert.ok(localLeft >= -52, `${record.id} hurtbox reaches mounted-scythe space`);
          assert.ok(localLeft + hurtbox.w <= 80, `${record.id} hurtbox reaches pistol/canvas-only space`);
        }
      }
    }

    const byId = Object.fromEntries(records.map((record) => [record.id, record.snapshot]));
    assert.strictEqual(byId.backward_walk.backwardWalk.complete, false);
    assert.match(byId.backward_walk.fighters.p1.fallbackWarning, /MISSING walk_backward_first_up/);
    assert.strictEqual(byId.forward_walk.fighters.p1.fallbackWarning, null);
    assert.strictEqual(byId.jump_camera_placeholder.fighters.p1.animationFrame, 'jump_v1_anticipation');
    assert.strictEqual(byId.jump_camera_placeholder.fighters.p1.fallbackWarning, null);
    assert.strictEqual(byId.jump_camera_placeholder.jumpFallLandingV1.runtime.gameplayValues, 'EXISTING_SANDBOX_JUMP_PHYSICS_UNCHANGED');
    assert.strictEqual(byId.standing_heavy_whiff.lastEvent.outcome, 'whiff');
    assert.strictEqual(byId.standing_heavy_hit.lastEvent.outcome, 'hit');
    assert.strictEqual(byId.standing_heavy_hit.fighters.p2.health, 880);
    assert.strictEqual(byId.standing_heavy_block.lastEvent.outcome, 'block');
    assert.strictEqual(byId.standing_heavy_block.fighters.p2.health, 1000);
    assert.match(byId.crouching_block.fighters.p1.animationFrame, /^crouching_block_(entry|v2)$/);
    assert.strictEqual(byId.standing_block_entry.fighters.p1.animationFrame, 'standing_block_entry');
    assert.strictEqual(byId.standing_block_hold.fighters.p1.animationFrame, 'standing_block');
    assert.strictEqual(byId.standing_block_release.fighters.p1.animationFrame, 'standing_block_release');
    assert.strictEqual(byId.crouching_block_entry.fighters.p1.animationFrame, 'crouching_block_entry');
    assert.strictEqual(byId.crouching_block_hold.fighters.p1.animationFrame, 'crouching_block_v2');
    assert.strictEqual(byId.crouching_block_release.fighters.p1.animationFrame, 'crouching_block_release');
    for (const id of ['light_hit_from_idle', 'light_hit_from_walk', 'light_hit_from_crouch', 'light_hit_from_block']) assert.strictEqual(byId[id].fighters.p2.packageId, 'light_hit_reaction');
    for (const id of ['heavy_hit_from_idle', 'heavy_hit_from_walk', 'heavy_hit_from_crouch', 'heavy_hit_from_block']) assert.strictEqual(byId[id].fighters.p2.packageId, 'heavy_hit_reaction');
    assert.strictEqual(byId.defense_hitstop_freeze.fighters.p2.packageCursor, 0);
    assert.ok(byId.defense_hitstop_freeze.fighters.p2.hitstop > 0);
    assert.strictEqual(byId.defense_rapid_hits.fighters.p2.packageId, 'heavy_hit_reaction');
    assert.strictEqual(byId.defense_rapid_hits.fighters.p2.packageInstance, 2);
    assert.strictEqual(byId.defense_return_state.fighters.p2.fighterState, 'crouch');
    assert.deepStrictEqual([
      byId.heavy_first_active_hit.lastCombatDiagnostic.contactTick,
      byId.heavy_first_active_hit.lastCombatDiagnostic.resultingAdvantage
    ], [24, 5]);
    assert.deepStrictEqual([
      byId.heavy_last_active_hit.lastCombatDiagnostic.contactTick,
      byId.heavy_last_active_hit.lastCombatDiagnostic.resultingAdvantage
    ], [28, 9]);
    assert.deepStrictEqual([
      byId.heavy_counter_hit.lastCombatDiagnostic.outcome,
      byId.heavy_counter_hit.lastCombatDiagnostic.damageApplied,
      byId.heavy_counter_hit.lastCombatDiagnostic.resultingAdvantage
    ], ['counter_hit', 138, 13]);
    assert.strictEqual(byId.heavy_standing_block_v1.lastCombatDiagnostic.resultingAdvantage, -31);
    assert.strictEqual(byId.heavy_crouching_block_v1.lastCombatDiagnostic.outcome, 'block');
    assert.strictEqual(byId.heavy_whiff_complete.lastCombatDiagnostic.outcome, 'whiff');
    assert.strictEqual(byId.heavy_corner_hit.lastCombatDiagnostic.outcome, 'hit');
    assert.ok(byId.heavy_max_range_standing.lastCombatDiagnostic.rootSeparation < 200);
    assert.ok(byId.heavy_max_range_crouching.lastCombatDiagnostic.rootSeparation < 196);
    assert.strictEqual(byId.heavy_just_outside_range.lastEvent.outcome, 'whiff');
    assert.strictEqual(byId.heavy_mirrored_p2.fighters.p1.facing, -1);
    assert.strictEqual(byId.heavy_side_switch.fighters.p1.facing, -1);
    assert.strictEqual(byId.heavy_repeated_use.fighters.p2.health, 760);
    assert.strictEqual(byId.heavy_repeated_use.fighters.p1.meter, 24);
    assert.strictEqual(byId.heavy_punish_after_block.fighters.p1.moveCursor, 44);
    assert.strictEqual(byId.heavy_punish_after_whiff.fighters.p1.moveCursor, 29);
    assert.strictEqual(byId.heavy_normal_hit_pressure.lastCombatDiagnostic.resultingAdvantage, 5);
    assert.strictEqual(byId.heavy_counter_hit_pressure.lastCombatDiagnostic.resultingAdvantage, 13);
    assert.strictEqual(byId.heavy_rollback_replay.lastEvent.id, 'standing_heavy_rollback_replay_pass');
    assert.deepStrictEqual(byId.heavy_rollback_replay.warnings ?? [], []);
    for (const id of ['heavy_first_active_hit', 'heavy_last_active_hit', 'heavy_counter_hit', 'heavy_standing_block_v1', 'heavy_crouching_block_v1', 'heavy_corner_hit', 'heavy_max_range_standing', 'heavy_max_range_crouching', 'heavy_mirrored_p2', 'heavy_side_switch']) {
      assert.strictEqual(byId[id].lastCombatDiagnostic.profileId, 'SWAHILI_STANDING_HEAVY_COMBAT_PROFILE_V1');
      assert.strictEqual(byId[id].lastCombatDiagnostic.approval, 'APPROVED_RECOMMENDED_PROFILE');
      assert.ok(byId[id].lastCombatDiagnostic.hitbox);
      assert.ok(byId[id].lastCombatDiagnostic.defenderHurtboxes.length >= 3);
    }
    assert.deepStrictEqual(rollbackPresentation, { emitted: 5, deduplicated: 5, ledgerSize: 5 });
    assert.deepStrictEqual(commandGrabInteraction.frameCount, 24);
    assert.strictEqual(commandGrabInteraction.result, 'hit');
    assert.strictEqual(commandGrabInteraction.sideSwitchCompleted, true);
    assert.strictEqual(commandGrabInteraction.victimHealth, 780);
    assert.strictEqual(commandGrabInteraction.shotWasAirborne, true);
    assert.strictEqual(commandGrabInteraction.landingAfterShot, true);
    assert.ok(commandGrabInteraction.p2x < commandGrabInteraction.p1x);
    assert.ok(commandGrabInteraction.maxLaunchDistance >= 330);
    assert.strictEqual(commandGrabInteraction.shotVisualHitCount, 1);
    assert.strictEqual(commandGrabInteraction.shotVfx.showMuzzleFlash, true);
    assert.strictEqual(commandGrabInteraction.shotVfx.showTracer, true);
    assert.strictEqual(commandGrabInteraction.shotVfx.showImpact, true);
    assert.strictEqual(commandGrabInteraction.shotVfx.visibleImpactCount, 1);
    assert.ok(commandGrabInteraction.shotVfx.impact[0] < commandGrabInteraction.shotVfx.muzzle[0]);
    assert.strictEqual(byId.side_switch.fighters.p1.facing, -1);
    assert.strictEqual(byId.side_switch.fighters.p2.facing, 1);
    assert.ok(byId.left_corner.fighters.p1.rootPosition[0] < -400);
    assert.ok(byId.right_corner.fighters.p2.rootPosition[0] > 400);
    assert.ok(interaction.after > interaction.before, 'local movement input did not move P1');
    assert.deepStrictEqual([interaction.p1FacingAfterSwitch, interaction.p2FacingAfterSwitch], [-1, 1]);
    assert.strictEqual(renderAuthority.before, renderAuthority.afterRender, 'rendering mutated authoritative state');
    assert.strictEqual(renderAuthority.before, renderAuthority.afterBenchmark, 'presentation benchmark mutated authoritative state');
    assert.deepStrictEqual(consoleErrors, []);

    const first = records[0].snapshot;
    const gpu = await page.evaluate(() => {
      const gl = window.__NGA_SWAHILI_SANDBOX__.renderer.renderer.getContext();
      const ext = gl.getExtension('WEBGL_debug_renderer_info');
      return { vendor: ext ? gl.getParameter(ext.UNMASKED_VENDOR_WEBGL) : gl.getParameter(gl.VENDOR), renderer: ext ? gl.getParameter(ext.UNMASKED_RENDERER_WEBGL) : gl.getParameter(gl.RENDERER), version: gl.getParameter(gl.VERSION) };
    });
    const report = {
      schemaVersion: '1.0.0-swahili-sandbox-browser-report',
      status: 'preview-only',
      candidateOnly: true,
      deployable: false,
      productionRoster: false,
      capturedAt: new Date().toISOString(),
      browser: { name: 'Chromium', version: await browser.version(), gpu, viewport: [1440, 900] },
      authority: { simulation: 'deterministic_60hz', renderingMayAffectGameplay: false, renderAuthority },
      assets: { loadedSpriteTextures: first.arena.resources.loadedSpriteTextures, textureMaxResolution: first.arena.resources.textureMaxResolution, estimatedTextureMemoryMb: first.arena.resources.estimatedSpriteTextureMemoryMb },
      performance: { drawCalls: first.arena.resources.drawCalls, triangles: first.arena.resources.triangles, benchmark: renderAuthority.benchmark },
      scenarios: records,
      interaction,
      commandGrabInteraction,
      rollbackPresentation,
      consoleErrors,
      serverLogs: logs.join('').split('\n').slice(0, 20)
    };
    fs.writeFileSync(path.join(OUT_DIR, 'sandbox_browser_report.json'), `${JSON.stringify(report, null, 2)}\n`);
    fs.writeFileSync(path.join(OUT_DIR, 'capture_index.html'), captureIndex(records));
    console.log(`Swahili sandbox smoke passed at ${url}`);
    console.log(JSON.stringify({ captures: records.length, assets: report.assets, performance: report.performance, gpu, consoleErrors }, null, 2));
  } finally {
    if (browser) await browser.close();
    await stopServer(server);
  }
}

main().catch((error) => { console.error(error); process.exit(1); });
