#!/usr/bin/env node
/* Focused smoke for the primary Platform Arena stage.
 * Uses Chrome DevTools Protocol directly so it does not add test dependencies.
 */

const fs = require("fs");
const http = require("http");
const os = require("os");
const path = require("path");
const { spawn } = require("child_process");

const ROOT = path.resolve(__dirname, "..");
const OUT_DIR = path.join(ROOT, "docs");
const REPORT_PATH = path.join(OUT_DIR, "platform_arena_test_report.json");
const CHROME = "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";
const DEBUG_PORT = 9342;
const CHROME_PROFILE = path.join(os.tmpdir(), `nga-platform-smoke-${process.pid}`);

const MIME = {
  ".html": "text/html; charset=utf-8",
  ".js": "application/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".json": "application/json; charset=utf-8",
  ".svg": "image/svg+xml",
};

function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function serveStatic() {
  const server = http.createServer((req, res) => {
    const url = new URL(req.url, "http://127.0.0.1");
    const rawPath = decodeURIComponent(url.pathname === "/" ? "/index.html" : url.pathname);
    const filePath = path.resolve(ROOT, `.${rawPath}`);
    if (!filePath.startsWith(ROOT)) {
      res.writeHead(403);
      res.end("Forbidden");
      return;
    }
    fs.readFile(filePath, (err, data) => {
      if (err) {
        res.writeHead(404);
        res.end("Not found");
        return;
      }
      res.writeHead(200, { "Content-Type": MIME[path.extname(filePath).toLowerCase()] || "application/octet-stream" });
      res.end(data);
    });
  });
  return new Promise((resolve) => server.listen(0, "127.0.0.1", () => resolve(server)));
}

async function launchChrome() {
  fs.rmSync(CHROME_PROFILE, { recursive: true, force: true });
  fs.mkdirSync(CHROME_PROFILE, { recursive: true });
  const chrome = spawn(CHROME, [
    `--remote-debugging-port=${DEBUG_PORT}`,
    `--user-data-dir=${CHROME_PROFILE}`,
    "--headless=new",
    "--disable-gpu",
    "--no-first-run",
    "--no-default-browser-check",
    "about:blank",
  ], { stdio: "ignore" });
  for (let i = 0; i < 80; i += 1) {
    try {
      const res = await fetch(`http://127.0.0.1:${DEBUG_PORT}/json/version`);
      if (res.ok) return chrome;
    } catch {
      // Chrome is still booting.
    }
    await delay(100);
  }
  chrome.kill();
  throw new Error("Chrome remote debugging endpoint did not start.");
}

async function openTarget() {
  const res = await fetch(`http://127.0.0.1:${DEBUG_PORT}/json/new?${encodeURIComponent("about:blank")}`, { method: "PUT" });
  if (!res.ok) throw new Error(`Failed to open Chrome target: ${res.status}`);
  const target = await res.json();
  return connectCdp(target.webSocketDebuggerUrl);
}

function connectCdp(wsUrl) {
  return new Promise((resolve, reject) => {
    const ws = new WebSocket(wsUrl);
    let nextId = 1;
    const pending = new Map();
    const listeners = [];
    ws.onopen = () => {
      resolve({
        send(method, params = {}) {
          const id = nextId++;
          ws.send(JSON.stringify({ id, method, params }));
          return new Promise((res, rej) => pending.set(id, { res, rej, method }));
        },
        onEvent(fn) {
          listeners.push(fn);
        },
        close() {
          ws.close();
        },
      });
    };
    ws.onerror = (event) => reject(event.error || new Error("CDP websocket error"));
    ws.onmessage = (event) => {
      const msg = JSON.parse(event.data);
      if (msg.id && pending.has(msg.id)) {
        const item = pending.get(msg.id);
        pending.delete(msg.id);
        if (msg.error) item.rej(new Error(`${item.method}: ${msg.error.message}`));
        else item.res(msg.result || {});
        return;
      }
      for (const fn of listeners) fn(msg);
    };
  });
}

async function setupPage(cdp, errors) {
  cdp.onEvent((msg) => {
    if (msg.method === "Network.loadingFailed") errors.push({ requestError: msg.params.errorText, requestId: msg.params.requestId });
    if (msg.method === "Runtime.exceptionThrown") errors.push({ pageError: msg.params.exceptionDetails?.text || "Runtime exception" });
    if (msg.method === "Runtime.consoleAPICalled" && ["error", "warning"].includes(msg.params.type)) {
      errors.push({ console: msg.params.type, text: msg.params.args.map((arg) => arg.value || arg.description || "").join(" ") });
    }
  });
  await cdp.send("Page.enable");
  await cdp.send("Runtime.enable");
  await cdp.send("Network.enable");
}

async function navigate(cdp, url) {
  let loaded = false;
  cdp.onEvent((msg) => {
    if (msg.method === "Page.loadEventFired") loaded = true;
  });
  await cdp.send("Page.navigate", { url });
  for (let i = 0; i < 120 && !loaded; i += 1) await delay(100);
  await delay(350);
}

async function evaluate(cdp, expression, awaitPromise = false) {
  const result = await cdp.send("Runtime.evaluate", {
    expression,
    awaitPromise,
    returnByValue: true,
    userGesture: true,
  });
  if (result.exceptionDetails) throw new Error(result.exceptionDetails.text || "Evaluation failed");
  return result.result?.value;
}

async function waitFor(cdp, expression, timeoutMs = 15000) {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    if (await evaluate(cdp, expression)) return true;
    await delay(100);
  }
  return false;
}

async function runChecks(cdp) {
  const report = {
    ok: false,
    checks: {},
    failures: [],
    errors: [],
  };

  const hookReady = await waitFor(cdp, "Boolean(window.__platformArenaTest && window.__platformArenaTest.state.mode !== 'loading')");
  report.checks.hookReady = hookReady;
  if (!hookReady) report.failures.push("Platform arena test hook did not become ready.");

  const fighterIds = await evaluate(cdp, "window.__platformArenaTest.selectableCharacterIds");
  const required = ["sol", "lamuh", "celeste", "seris", "nyx", "vanta"];
  report.checks.requiredFightersSelectable = required.every((id) => fighterIds.includes(id));
  if (!report.checks.requiredFightersSelectable) report.failures.push("A required fighter was missing from selectableCharacterIds.");

  report.checks.platformArenaPreset = await evaluate(cdp, `(() => {
    const api = window.__platformArenaTest;
    const stage = api.stagePresets.platform_test;
    const canvasWidth = document.getElementById("game").width;
    const widthRatio = stage.worldWidth / canvasWidth;
    return {
      id: stage.id,
      label: stage.label,
      worldWidth: stage.worldWidth,
      canvasWidth,
      widthRatio,
      platformCount: stage.platforms.length,
      configValues: {
        camera: stage.camera,
        platformSpeedTuning: stage.platformSpeedTuning,
        background: stage.background,
        movement: stage.movement,
        combat: stage.combat
      },
      ok: stage.label === "Platform Arena" &&
        widthRatio >= 1.75 &&
        widthRatio <= 2 &&
        stage.platforms.length === 1 &&
        stage.camera.minScale === 0.7 &&
        stage.camera.paddingX === 320 &&
        stage.camera.damping === 8 &&
        stage.platformSpeedTuning.groundSpeedMultiplier === 2.36 &&
        stage.platformSpeedTuning.airDriftMultiplier === 2.5 &&
        stage.platformSpeedTuning.gravityMultiplier === 2.36 &&
        stage.platformSpeedTuning.fallSpeedMultiplier === 1.22 &&
        stage.platformSpeedTuning.jumpForceMultiplier === 1 &&
        stage.platformSpeedTuning.animationSpeedMultiplier === 1 &&
        stage.platformSpeedTuning.hitstopMultiplier === 0.425 &&
        stage.platformSpeedTuning.knockbackVelocityMultiplier === 2.24 &&
        stage.platformSpeedTuning.cameraSmoothing === 8 &&
        stage.background.overlayAlpha === 0.2 &&
        stage.movement.airRecoverySteer === 0.9 &&
        stage.combat.heavyRelaunchAirScale === 0.08
    };
  })()`);
  if (!report.checks.platformArenaPreset.ok) report.failures.push("Platform Arena preset does not match requested promoted config/name/width/platform shape.");

  const fighterLoads = {};
  const moveChecks = {};
  for (const id of fighterIds) {
    const opponent = id === "vanta" ? "nyx" : "vanta";
    fighterLoads[id] = await evaluate(cdp, `window.__platformArenaTest.startMatch(${JSON.stringify(id)}, ${JSON.stringify(opponent)}, "platform_test")`);
    moveChecks[id] = await evaluate(cdp, `(() => {
      const api = window.__platformArenaTest;
      const p = api.state.player;
      const moveKeys = Object.keys(p.profile.moves.player);
      const pick = (...keys) => keys.find((key) => moveKeys.includes(key));
      const wanted = [
        pick("neutral_light", "light_attack"),
        pick("neutral_medium", "medium_attack"),
        pick("neutral_heavy", "heavy_attack"),
        pick("down_light_special", "down_special", "special_3"),
        pick("up_light_special", "up_special", "launcher")
      ].filter(Boolean);
      const results = [];
      for (const move of wanted) {
        p.hitstun = 0; p.blockstun = 0; p.knockdownTimer = 0; p.recoveryTimer = 0; p.landingTimer = 0;
        p.action = null; p.activeMove = null; p.grounded = true; p.y = api.stagePresets.platform_test.groundY;
        const started = api.startMove(move, "p1");
        results.push({ requested: move, activeMove: started && started.move, ok: Boolean(started && started.move) });
      }
      return { wanted, results, ok: wanted.length >= 3 && results.every((item) => item.ok) };
    })()`);
  }
  report.checks.fighterLoads = fighterLoads;
  report.checks.moveChecks = moveChecks;
  if (!Object.values(moveChecks).every((entry) => entry.ok)) report.failures.push("At least one fighter failed basic attack/special start checks.");

  report.checks.platformPhysics = await evaluate(cdp, `(async () => {
    const api = window.__platformArenaTest;
    api.startMatch("sol", "lamuh", "platform_test");
    const stage = api.stagePresets.platform_test;
    const platform = stage.platforms[0];
    api.setPosition("p1", platform.x + platform.w * 0.5, stage.groundY, true);
    const p = api.state.player;
    p.vy = api.speedSnapshot("p1").jump.jumpVelocity;
    p.grounded = false;
    const jumpPath = { minY: p.y, platformSeen: false, platformSeenAt: null };
    const startedAt = performance.now();
    await new Promise((resolve) => {
      function sample() {
        const elapsed = (performance.now() - startedAt) / 1000;
        jumpPath.minY = Math.min(jumpPath.minY, p.y);
        if (!jumpPath.platformSeen && p.grounded && p.standingPlatformId === platform.id) {
          jumpPath.platformSeen = true;
          jumpPath.platformSeenAt = elapsed;
        }
        if (elapsed >= 1.25) resolve();
        else requestAnimationFrame(sample);
      }
      requestAnimationFrame(sample);
    });
    const landedOnPlatform = p.grounded && p.standingPlatformId === platform.id && Math.abs(p.y - platform.y) < 2;
    window.dispatchEvent(new KeyboardEvent("keydown", { code: "KeyS", bubbles: true }));
    window.dispatchEvent(new KeyboardEvent("keydown", { code: "KeyW", bubbles: true }));
    await new Promise((resolve) => setTimeout(resolve, 220));
    window.dispatchEvent(new KeyboardEvent("keyup", { code: "KeyS", bubbles: true }));
    window.dispatchEvent(new KeyboardEvent("keyup", { code: "KeyW", bubbles: true }));
    const droppedThrough = !p.grounded && p.y > platform.y + 4;
    await new Promise((resolve) => setTimeout(resolve, 1000));
    const floorSafe = p.grounded && Math.abs(p.y - stage.groundY) < 2;
    return { landedOnPlatform, droppedThrough, floorSafe, jumpPath, final: { x: p.x, y: p.y, grounded: p.grounded, platform: p.standingPlatformId } };
  })()`, true);
  if (!report.checks.platformPhysics.landedOnPlatform) report.failures.push("Player did not land on the elevated platform.");
  if (!report.checks.platformPhysics.droppedThrough) report.failures.push("Down+jump did not drop through the elevated platform.");
  if (!report.checks.platformPhysics.floorSafe) report.failures.push("Player did not land safely on the main floor after drop-through.");

  report.checks.camera = await evaluate(cdp, `(() => {
    const api = window.__platformArenaTest;
    api.startMatch("sol", "lamuh", "platform_test");
    const stage = api.stagePresets.platform_test;
    const canvasWidth = document.getElementById("game").width;
    api.setPosition("p1", stage.worldWidth * 0.5 - 900, stage.groundY, true);
    api.setPosition("p2", stage.worldWidth * 0.5 + 900, stage.groundY, true);
    const far = api.syncCamera();
    const farP1ScreenX = api.state.player.x * far.scale + far.x;
    const farP2ScreenX = api.state.enemy.x * far.scale + far.x;
    api.setPosition("p1", stage.worldWidth * 0.5 - 70, stage.groundY, true);
    api.setPosition("p2", stage.worldWidth * 0.5 + 70, stage.groundY, true);
    const close = api.syncCamera();
    return {
      far,
      close,
      farP1ScreenX,
      farP2ScreenX,
      minScale: stage.camera.minScale,
      paddingX: stage.camera.paddingX,
      damping: stage.camera.damping,
      ok: stage.camera.minScale === 0.7 &&
        stage.camera.paddingX === 320 &&
        stage.camera.damping === 8 &&
        far.scale >= stage.camera.minScale &&
        far.scale <= stage.camera.maxScale &&
        close.scale > far.scale &&
        close.scale <= stage.camera.maxScale &&
        farP1ScreenX >= -4 &&
        farP2ScreenX <= canvasWidth + 4
    };
  })()`);
  if (!report.checks.camera.ok) report.failures.push("Platform camera did not zoom/frame within expected bounds.");

  report.checks.platformSpeedTuning = await evaluate(cdp, `(() => {
    const api = window.__platformArenaTest;
    api.startMatch("sol", "lamuh", "platform_test");
    const platform = api.speedSnapshot("p1");
    api.startMatch("sol", "lamuh", "standard");
    const standard = api.speedSnapshot("p1");
    return {
      platform,
      standard,
      ok: platform.stagePresetId === "platform_test" &&
        standard.stagePresetId === "standard" &&
        platform.tuning.groundSpeedMultiplier === 2.36 &&
        platform.tuning.airDriftMultiplier === 2.5 &&
        platform.tuning.gravityMultiplier === 2.36 &&
        platform.tuning.fallSpeedMultiplier === 1.22 &&
        platform.tuning.jumpForceMultiplier === 1 &&
        platform.tuning.hitstopMultiplier === 0.425 &&
        platform.tuning.knockbackVelocityMultiplier === 2.24 &&
        standard.tuning.groundSpeedMultiplier === 1.18 &&
        standard.tuning.airDriftMultiplier === 1.25 &&
        standard.tuning.gravityMultiplier === 1.18 &&
        standard.tuning.fallSpeedMultiplier === platform.tuning.fallSpeedMultiplier &&
        standard.tuning.jumpForceMultiplier === platform.tuning.jumpForceMultiplier &&
        standard.tuning.hitstopMultiplier === 0.85 &&
        standard.tuning.knockbackVelocityMultiplier === 1.12 &&
        platform.stageTuning !== null &&
        standard.stageTuning === null &&
        platform.animationSpeedMultiplier === 1 &&
        standard.animationSpeedMultiplier === platform.animationSpeedMultiplier &&
        platform.knockbackVelocityMultiplier === standard.knockbackVelocityMultiplier * 2 &&
        platform.movement.walkForward === standard.movement.walkForward * 2 &&
        platform.movement.dashSpeed === standard.movement.dashSpeed * 2 &&
        platform.movement.superDashSpeed === standard.movement.superDashSpeed * 2 &&
        platform.airDash.speed === standard.airDash.speed * 2 &&
        platform.jump.gravity === standard.jump.gravity &&
        platform.jump.jumpVelocity === standard.jump.jumpVelocity &&
        platform.effectiveGravity.ascentMultiplier === standard.effectiveGravity.ascentMultiplier &&
        Math.abs(platform.effectiveGravity.fallMultiplier - standard.effectiveGravity.fallMultiplier * 2) < 0.0001 &&
        platform.effectiveGravity.reactionMultiplier === standard.effectiveGravity.reactionMultiplier * 2 &&
        platform.effectiveGravity.ascentMultiplier === 1 &&
        platform.effectiveGravity.fallMultiplier > 2.8 &&
        platform.effectiveGravity.reactionMultiplier === 2.36 &&
        Math.abs(platform.heavyHitstop - standard.heavyHitstop * 0.5) < 0.0001 &&
        platform.heavyHitstop < 0.04
    };
  })()`);
  if (!report.checks.platformSpeedTuning.ok) report.failures.push("Platform fighting speed did not double relative to Standard baseline.");

  report.checks.platformJuggleSafety = await evaluate(cdp, `(() => {
    const api = window.__platformArenaTest;
    api.startMatch("sol", "lamuh", "platform_test");
    const stage = api.stagePresets.platform_test;
    const p1 = api.state.player;
    const p2 = api.state.enemy;
    const combat = stage.combat;
    api.setPosition("p1", 1080, stage.groundY - 115, false);
    api.setPosition("p2", 1160, stage.groundY - 130, false);
    p1.facing = 1;
    p2.facing = -1;
    api.state.combo.owner = "player";
    api.state.combo.target = "enemy";
    api.state.combo.hits = 4;
    api.state.combo.heavyHits = 1;
    api.state.combo.timer = 0.6;
    const heavyMove = Object.keys(p1.profile.moves.player).find((key) => key === "jump_heavy" || key === "air_heavy" || key.endsWith("_heavy"));
    if (!heavyMove) return { ok: false, reason: "no heavy move found" };
    const started = api.startMove(heavyMove, "p1");
    const moveData = p1.profile.moves.player[p1.activeMove];
    if (!moveData) return { ok: false, reason: "heavy move did not start", started };
    p1.actionTime = moveData.startup + 0.01;
    const beforeVy = p2.vy;
    const hit = api.tryDirectHit("p1");
    return {
      started,
      hit,
      beforeVy,
      afterVy: p2.vy,
      queuedAirRecovery: p2.platformAirRecoveryTimer,
      hitstun: p2.hitstun,
      combat,
      ok: Boolean(hit?.hit) &&
        p2.platformAirRecoveryTimer >= combat.airRecoveryWindow &&
        p2.vy >= -80 &&
        combat.juggleHitstunScale.heavyLate === 0.5 &&
        combat.knockbackScale.heavyAirBase === 1.44 &&
        combat.airRecoveryWindow === 16 / 60
    };
  })()`);
  if (!report.checks.platformJuggleSafety.ok) report.failures.push("Platform juggle safety did not queue air recovery/reduced relaunch as expected.");

  report.checks.healthBars = await evaluate(cdp, `(() => {
    const api = window.__platformArenaTest;
    api.startMatch("lamuh", "celeste", "platform_test");
    const p1 = document.getElementById("player-hp");
    const p2 = document.getElementById("enemy-hp");
    return {
      p1Exists: Boolean(p1),
      p2Exists: Boolean(p2),
      p1Width: p1?.style.width || "",
      p2Width: p2?.style.width || "",
      p1Name: document.getElementById("player-name")?.textContent || "",
      p2Name: document.getElementById("enemy-name")?.textContent || "",
      ok: Boolean(p1 && p2) && p1.style.width === "100%" && p2.style.width === "100%"
    };
  })()`);
  if (!report.checks.healthBars.ok) report.failures.push("Health bar DOM/state check failed in Platform Arena.");

  report.checks.standardStage = await evaluate(cdp, `(() => {
    const api = window.__platformArenaTest;
    const snap = api.startMatch("sol", "lamuh", "standard");
    const canvasWidth = document.getElementById("game").width;
    return {
      stagePresetId: snap.stagePresetId,
      worldWidth: snap.stage.worldWidth,
      canvasWidth,
      platformCount: snap.stage.platforms.length,
      p1x: snap.p1.x,
      p2x: snap.p2.x,
      camera: snap.camera,
      ok: snap.stagePresetId === "standard" && snap.stage.worldWidth === canvasWidth && snap.stage.platforms.length === 0 && snap.p1.x === 330 && snap.p2.x === 720 && snap.camera.scale === 1
    };
  })()`);
  if (!report.checks.standardStage.ok) report.failures.push("Standard stage snapshot changed from expected default values.");

  report.ok = report.failures.length === 0;
  return report;
}

(async () => {
  fs.mkdirSync(OUT_DIR, { recursive: true });
  let server;
  let chrome;
  let cdp;
  const errors = [];
  try {
    server = await serveStatic();
    const { port } = server.address();
    chrome = await launchChrome();
    cdp = await openTarget();
    await setupPage(cdp, errors);
    await navigate(cdp, `http://127.0.0.1:${port}/index.html?platformTest=1`);
    const report = await runChecks(cdp);
    report.errors = errors;
    if (errors.length) report.failures.push("Browser console/request errors were observed.");
    report.ok = report.failures.length === 0;
    fs.writeFileSync(REPORT_PATH, `${JSON.stringify(report, null, 2)}\n`);
    if (!report.ok) throw new Error(`Platform arena smoke failed: ${JSON.stringify(report.failures)}`);
    console.log(`Platform arena smoke passed: ${REPORT_PATH}`);
  } finally {
    try { cdp?.close(); } catch {}
    try { chrome?.kill(); } catch {}
    await delay(400);
    try { server?.close(); } catch {}
    try { fs.rmSync(CHROME_PROFILE, { recursive: true, force: true }); } catch {}
  }
})().catch((err) => {
  console.error(err);
  process.exit(1);
});
