#!/usr/bin/env node
/* Focused LAMUH Mirror Pierce smoke test.
 *
 * Uses Chrome DevTools Protocol directly so the test has no npm dependency.
 * Verifies forward-heavy visual aliases resolve to the processed Sheet 2 Row 2
 * atlas, then starts Mirror Pierce in runtime and watches for its beam/projectile
 * hit path.
 */

const fs = require("fs");
const http = require("http");
const os = require("os");
const path = require("path");
const { spawn } = require("child_process");

const ROOT = path.resolve(__dirname, "..");
const OUT_DIR = path.join(ROOT, "assets", "characters", "lamuh");
const REPORT_PATH = path.join(OUT_DIR, "lamuh_mirror_pierce_smoke_report.json");
const CHROME = "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";
const DEBUG_PORT = 9336;
const CHROME_PROFILE = path.join(os.tmpdir(), `nga-lamuh-mirror-pierce-${process.pid}`);

const MIME = {
  ".html": "text/html; charset=utf-8",
  ".js": "application/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".json": "application/json; charset=utf-8",
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
  return new Promise((resolve) => {
    server.listen(0, "127.0.0.1", () => resolve(server));
  });
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
    } catch (_) {
      // Chrome is still starting.
    }
    await delay(100);
  }
  chrome.kill();
  throw new Error("Chrome remote debugging endpoint did not become ready");
}

async function openTarget() {
  const res = await fetch(`http://127.0.0.1:${DEBUG_PORT}/json/new?${encodeURIComponent("about:blank")}`, {
    method: "PUT",
  });
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

async function setupPage(cdp, errors, requests) {
  cdp.onEvent((msg) => {
    if (msg.method === "Network.requestWillBeSent") requests.push(msg.params.request.url);
    if (msg.method === "Network.loadingFailed") {
      const errorText = msg.params.errorText || "";
      if (errorText !== "net::ERR_ABORTED") errors.push({ requestError: errorText, requestId: msg.params.requestId });
    }
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
  await delay(300);
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

async function waitFor(cdp, expression, timeoutMs = 10000) {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    if (await evaluate(cdp, expression)) return true;
    await delay(100);
  }
  throw new Error(`Timed out waiting for: ${expression}`);
}

async function run() {
  fs.mkdirSync(OUT_DIR, { recursive: true });
  const errors = [];
  const requests = [];
  const server = await serveStatic();
  let chrome = null;
  let cdp = null;
  const report = {
    ok: false,
    checkedAt: new Date().toISOString(),
    outputReport: path.relative(ROOT, REPORT_PATH).replace(/\\/g, "/"),
    expectedAtlasKey: "lamuhForwardSpecialsRedesign",
    expectedAtlasPath: "assets/characters/lamuh/lamuh_sheet_forward_specials_redesign_atlas.png",
    expectedRow: 2,
  };

  try {
    const port = server.address().port;
    chrome = await launchChrome();
    cdp = await openTarget();
    await setupPage(cdp, errors, requests);
    await navigate(cdp, `http://127.0.0.1:${port}/?lamuhTest=1`);
    await waitFor(cdp, "Boolean(window.__lamuhHiddenTest && window.__lamuhHiddenTest.state?.images?.lamuhForwardSpecialsRedesign)");

    report.mapping = await evaluate(cdp, `(() => {
      const t = window.__lamuhHiddenTest;
      const player = t.profile.playerAnimations;
      const keys = ["forward_heavy_special", "mirror_pierce", "lamuh_mirror_pierce"];
      return Object.fromEntries(keys.map((key) => [key, player[key]]));
    })()`);

    report.forwardSpecials = await evaluate(cdp, `(() => {
      const t = window.__lamuhHiddenTest;
      const p = t.profile.playerAnimations;
      return {
        forward_light_special: p.forward_light_special,
        forward_medium_special: p.forward_medium_special,
        forward_heavy_special: p.forward_heavy_special
      };
    })()`);

    report.moveRegistry = await evaluate(cdp, `(() => {
      const t = window.__lamuhHiddenTest;
      const move = t.profile.moves.player.forward_heavy_special;
      const special = t.profile.specialMoves.forward_heavy_special;
      return {
        specialType: special?.type,
        specialAttack: special?.attack,
        projectileWidth: special?.projectileWidth,
        projectileHeight: special?.projectileHeight,
        projectileLife: special?.projectileLife,
        spawnOffsetX: special?.spawnOffsetX,
        spawnOffsetY: special?.spawnOffsetY,
        damage: move?.damage,
        duration: move?.duration,
        startup: move?.startup,
        active: move?.active,
        recovery: move?.recovery,
        hitstun: move?.hitstun,
        projectile: move?.flags?.projectile === true,
        projectileSpeed: move?.flags?.projectileSpeed,
        projectileSpawnAt: move?.flags?.projectileSpawnAt,
        noHit: move?.flags?.noHit === true,
        pierceSideSwitch: move?.flags?.pierceSideSwitch === true,
        requiresPierceConfirm: move?.flags?.requiresPierceConfirm === true,
        pierceHitFrame: move?.flags?.pierceHitFrame,
        sideSwitchFrame: move?.flags?.sideSwitchFrame,
        palmPoseStartFrame: move?.flags?.palmPoseStartFrame,
        beamChargeStartFrame: move?.flags?.beamChargeStartFrame,
        beamFireFrame: move?.flags?.beamFireFrame,
        beamHitboxStartFrame: move?.flags?.beamHitboxStartFrame,
        beamHitboxEndFrame: move?.flags?.beamHitboxEndFrame,
        recoveryStartFrame: move?.flags?.recoveryStartFrame,
        whiffBeamFireFrame: move?.flags?.whiffBeamFireFrame,
        whiffRecoveryEndFrame: move?.flags?.whiffRecoveryEndFrame,
        maxMirrorPierceFrame: move?.flags?.maxMirrorPierceFrame,
        palmPauseFrames: move?.flags?.palmPauseFrames,
        pierceHoldFrames: move?.flags?.pierceHoldFrames,
        pierceHitDamage: move?.flags?.pierceHitDamage,
        pierceHitstunFrames: move?.flags?.pierceHitstunFrames,
        pierceKnockbackX: move?.flags?.pierceKnockbackX,
        pierceKnockbackY: move?.flags?.pierceKnockbackY,
        beamDamage: move?.flags?.beamDamage,
        beamHitstunFrames: move?.flags?.beamHitstunFrames,
        beamKnockbackX: move?.flags?.beamKnockbackX,
        beamKnockbackY: move?.flags?.beamKnockbackY,
        forceWallBounce: move?.flags?.forceWallBounce === true,
        anim: move?.flags?.anim,
        visualProfile: move?.flags?.visualProfile,
        knockbackX: move?.knockbackX,
        knockbackY: move?.knockbackY
      };
    })()`);

    report.runtime = await evaluate(cdp, `new Promise((resolve) => {
      const t = window.__lamuhHiddenTest;
      const s = t.state;

      function prepScenario(options) {
        window.__platformArenaTest?.selectStage("standard");
        t.startMirror();
        const p = s.player;
        const e = s.enemy;
        p.x = options.p1x;
        e.x = options.p2x;
        p.y = e.y;
        p.facing = options.p1Facing;
        e.facing = -options.p1Facing;
        p.vx = p.vy = e.vx = e.vy = 0;
        p.grounded = true;
        e.grounded = true;
        p.meter = 100;
        e.hp = 1000;
        e.hitstun = 0;
        e.blockstun = 0;
        e.knockdownTimer = 0;
        e.recoveryTimer = 0;
        e.pendingKnockdown = 0;
        e.wallBounceEligible = false;
        e.mirrorPierceWallBouncePending = false;
        e.blocking = Boolean(options.blocking);
        s.combo.owner = null;
        s.combo.target = null;
        s.combo.hits = 0;
        s.combo.heavyHits = 0;
        s.combo.wallBounces = options.startingWallBounces || 0;
        s.projectiles.length = 0;
        s.lamuhSpecialEffects.length = 0;
        return { p, e };
      }

      function runScenario(name, options) {
        return new Promise((resolveScenario) => {
          const { p, e } = prepScenario(options);
          const start = t.startMove("forward_heavy_special", "p1");
          const samples = [];
          let maxProjectiles = 0;
          let maxAbsEnemyVx = 0;
          let maxEnemyDisplacement = 0;
          let maxBeamWidth = 0;
          let maxBeamHeight = 0;
          let minEnemyVy = 0;
          let projectileSeen = false;
          let mirrorPierceBeamSeen = false;
          let visualOnlyBeamSeen = false;
          let damagingBeamSeen = false;
          let beamStationary = false;
          let lastBeamSnapshot = null;
          let stage1Hp = null;
          let stage1Time = null;
          let beamHp = null;
          let beamTime = null;
          let holdSeen = false;
          let holdSeenBeforeRestart = false;
          let maxHoldTimer = 0;
          let controlReturnTime = null;
          let restartResult = null;
          let restarted = false;
          let maxWallBounces = s.combo.wallBounces || 0;
          const initialEnemyX = e.x;
          const initialEnemyHp = e.hp;
          const startedAt = performance.now();
          function tick() {
            const elapsed = (performance.now() - startedAt) / 1000;
            maxProjectiles = Math.max(maxProjectiles, s.projectiles.length);
            maxAbsEnemyVx = Math.max(maxAbsEnemyVx, Math.abs(e.vx || 0));
            maxEnemyDisplacement = Math.max(maxEnemyDisplacement, Math.abs((e.x || initialEnemyX) - initialEnemyX));
            minEnemyVy = Math.min(minEnemyVy, e.vy || 0);
            maxWallBounces = Math.max(maxWallBounces, s.combo.wallBounces || 0);
            holdSeen = holdSeen || (e.mirrorPierceHoldTimer || 0) > 0;
            if (!restarted) holdSeenBeforeRestart = holdSeenBeforeRestart || (e.mirrorPierceHoldTimer || 0) > 0;
            maxHoldTimer = Math.max(maxHoldTimer, e.mirrorPierceHoldTimer || 0);
            const beams = s.projectiles.filter((projectile) => projectile.ownerCharacterId === "lamuh" && projectile.flags?.mirrorPierceBeam);
            const damagingBeams = beams.filter((beam) => !beam.flags?.visualOnly);
            projectileSeen = projectileSeen || s.projectiles.some((projectile) => projectile.ownerCharacterId === "lamuh" && projectile.flags?.visualProfile === "mirrorPierce");
            mirrorPierceBeamSeen = mirrorPierceBeamSeen || beams.length > 0;
            visualOnlyBeamSeen = visualOnlyBeamSeen || beams.some((beam) => beam.flags?.visualOnly === true);
            damagingBeamSeen = damagingBeamSeen || damagingBeams.length > 0;
            if (stage1Hp === null && e.hp < initialEnemyHp && !mirrorPierceBeamSeen) {
              stage1Hp = e.hp;
              stage1Time = elapsed;
            }
            if (stage1Hp !== null && beamHp === null && damagingBeamSeen && e.hp < stage1Hp) {
              beamHp = e.hp;
              beamTime = elapsed;
            }
            if (controlReturnTime === null && elapsed > 0.15 && !p.action && !p.activeMove && p.hitstun <= 0 && p.blockstun <= 0 && p.knockdownTimer <= 0 && p.recoveryTimer <= 0) {
              controlReturnTime = elapsed;
            }
            if (options.restartAfterControl && controlReturnTime !== null && restartResult === null) {
              restartResult = t.startMove("forward_heavy_special", "p1");
              restarted = true;
            }
            for (const beam of beams) {
              maxBeamWidth = Math.max(maxBeamWidth, beam.w || 0);
              maxBeamHeight = Math.max(maxBeamHeight, beam.h || 0);
              beamStationary = beamStationary || Math.abs(beam.vx || 0) < 1;
              lastBeamSnapshot = {
                ownerKind: beam.ownerKind,
                ownerCharacterId: beam.ownerCharacterId,
                facing: beam.facing,
                x: Math.round(beam.x),
                y: Math.round(beam.y),
                centerOffsetX: Math.round(((beam.x || 0) - (p.x || 0)) * (beam.facing || 1)),
                centerOffsetY: Math.round((beam.y || 0) - (p.y || 0)),
                boxTop: Math.round((beam.y || 0) - (beam.h || 0) / 2),
                boxBottom: Math.round((beam.y || 0) + (beam.h || 0) / 2),
                vx: beam.vx,
                w: beam.w,
                h: beam.h,
                mirrorPierceBeam: beam.flags?.mirrorPierceBeam === true,
                visualOnly: beam.flags?.visualOnly === true,
                visualProfile: beam.flags?.visualProfile
              };
            }
            samples.push({
              t: Number(elapsed.toFixed(3)),
              p1Move: p.activeMove,
              p1Anim: p.anim,
              p1ActionTime: Number((p.actionTime || 0).toFixed(3)),
              p1Facing: p.facing,
              p1X: Math.round(p.x),
              p2X: Math.round(e.x),
              p2Vx: Math.round(e.vx),
              p2Vy: Math.round(e.vy),
              p2Hp: e.hp,
              p2Hitstun: Number((e.hitstun || 0).toFixed(3)),
              wallBounces: s.combo.wallBounces || 0,
              projectileCount: s.projectiles.length,
              mirrorPierceBeams: beams.length
            });
            if (elapsed >= (options.duration || 1.1)) {
              resolveScenario({
                name,
                start,
                projectileSeen,
                mirrorPierceBeamSeen,
                visualOnlyBeamSeen,
                damagingBeamSeen,
                maxProjectiles,
                maxBeamWidth,
                maxBeamHeight,
                beamStationary,
                lastBeamSnapshot,
                maxAbsEnemyVx,
                maxEnemyDisplacement,
                minEnemyVy,
                maxWallBounces,
                initialEnemyX,
                finalEnemyX: e.x,
                initialEnemyHp,
                stage1Hp,
                stage1Time,
                beamHp,
                beamTime,
                palmPauseSeconds: stage1Time !== null && beamTime !== null ? beamTime - stage1Time : null,
                holdSeen,
                holdSeenBeforeRestart,
                maxHoldTimer,
                controlReturnTime,
                restartResult,
                finalEnemyHp: e.hp,
                finalEnemyVx: e.vx,
                finalEnemyVy: e.vy,
                finalEnemyHitstun: e.hitstun,
                finalP1Move: p.activeMove,
                finalP1Anim: p.anim,
                finalP1Action: p.action,
                finalP1CleanupReason: p.lamuhMirrorPierceCleanupReason,
                finalP1Failsafe: p.lamuhMirrorPierceFailsafeTriggered === true,
                samples
              });
              return;
            }
            requestAnimationFrame(tick);
          }
          requestAnimationFrame(tick);
        });
      }

      (async () => {
        const close = await runScenario("close_left_to_right", { p1x: 420, p2x: 610, p1Facing: 1, duration: 1.7 });
        const mid = await runScenario("mid_left_to_right", { p1x: 360, p2x: 590, p1Facing: 1, duration: 1.7 });
        const leftWall = await runScenario("left_wall_bounce", { p1x: 140, p2x: 300, p1Facing: 1, duration: 2.2 });
        const rightWall = await runScenario("right_wall_bounce", { p1x: 1120, p2x: 960, p1Facing: -1, duration: 2.2 });
        const whiff = await runScenario("whiff_full_range", { p1x: 220, p2x: 720, p1Facing: 1, duration: 1.75, restartAfterControl: true });
        const whiffRepeat = await runScenario("whiff_after_previous_whiff", { p1x: 220, p2x: 720, p1Facing: 1, duration: 1.75, restartAfterControl: true });
        const repeatBlockedBounce = await runScenario("repeat_same_combo_no_second_wall_bounce", { p1x: 140, p2x: 300, p1Facing: 1, duration: 2.2, startingWallBounces: 1 });
        resolve({ close, mid, leftWall, rightWall, whiff, whiffRepeat, repeatBlockedBounce });
      })();
    })`, true);

    const aliasRowsOk = Object.values(report.mapping).every((entry) => Array.isArray(entry) && entry[0] === "lamuhForwardSpecialsRedesign" && entry[1] === 2);
    const noOldFallback = Object.values(report.mapping).every((entry) => Array.isArray(entry) && !["lamuhFinalSpecials", "lamuhCrownBody"].includes(entry[0]));
    const forwardRowsOk =
      Array.isArray(report.forwardSpecials.forward_light_special) &&
      report.forwardSpecials.forward_light_special[0] === "lamuhForwardSpecialsRedesign" &&
      report.forwardSpecials.forward_light_special[1] === 0 &&
      Array.isArray(report.forwardSpecials.forward_medium_special) &&
      report.forwardSpecials.forward_medium_special[0] === "lamuhForwardSpecialsRedesign" &&
      report.forwardSpecials.forward_medium_special[1] === 1 &&
      Array.isArray(report.forwardSpecials.forward_heavy_special) &&
      report.forwardSpecials.forward_heavy_special[0] === "lamuhForwardSpecialsRedesign" &&
      report.forwardSpecials.forward_heavy_special[1] === 2;
    const registryOk =
      report.moveRegistry.specialType === "mirrorPierce" &&
      report.moveRegistry.projectileWidth >= 520 &&
      report.moveRegistry.projectileHeight >= 60 &&
      report.moveRegistry.spawnOffsetX === 52 &&
      report.moveRegistry.spawnOffsetY === -144 &&
      report.moveRegistry.projectile === true &&
      report.moveRegistry.projectileSpeed === 0 &&
      report.moveRegistry.duration >= 1.35 &&
      report.moveRegistry.pierceSideSwitch === true &&
      report.moveRegistry.requiresPierceConfirm === true &&
      report.moveRegistry.palmPauseFrames >= 36 &&
      report.moveRegistry.beamFireFrame >= 54 &&
      report.moveRegistry.beamHitboxStartFrame === report.moveRegistry.beamFireFrame &&
      report.moveRegistry.whiffBeamFireFrame >= 36 &&
      report.moveRegistry.whiffRecoveryEndFrame > report.moveRegistry.whiffBeamFireFrame &&
      report.moveRegistry.maxMirrorPierceFrame > report.moveRegistry.recoveryStartFrame &&
      report.moveRegistry.damage === 30 &&
      report.moveRegistry.pierceHitDamage === 30 &&
      report.moveRegistry.beamDamage === 78 &&
      report.moveRegistry.beamKnockbackX >= 2400 &&
      report.moveRegistry.beamKnockbackY <= -380 &&
      report.moveRegistry.forceWallBounce === true &&
      report.moveRegistry.anim === "mirror_pierce" &&
      report.moveRegistry.visualProfile === "mirrorPierce";
    const twoStageOk = (scenario) =>
      scenario.start?.move === "forward_heavy_special" &&
      scenario.start?.anim === "mirror_pierce" &&
      scenario.stage1Hp !== null &&
      scenario.beamHp !== null &&
      scenario.stage1Hp < scenario.initialEnemyHp &&
      scenario.beamHp < scenario.stage1Hp &&
      scenario.beamTime > scenario.stage1Time &&
      scenario.palmPauseSeconds >= 0.6 &&
      scenario.palmPauseSeconds <= 1.3 &&
      scenario.holdSeen === true &&
      scenario.projectileSeen === true &&
      scenario.mirrorPierceBeamSeen === true &&
      scenario.damagingBeamSeen === true &&
      scenario.lastBeamSnapshot?.centerOffsetY === -144 &&
      scenario.beamStationary === true &&
      scenario.maxBeamWidth >= 620 &&
      scenario.maxBeamHeight >= 74 &&
      scenario.maxAbsEnemyVx > 1800 &&
      scenario.minEnemyVy < -300 &&
      scenario.finalEnemyHitstun > 0;
    const wallBounceOk = (scenario) => twoStageOk(scenario) && scenario.maxWallBounces === 1;
    const whiffOk = (scenario) =>
      scenario.start?.move === "forward_heavy_special" &&
      scenario.stage1Hp === null &&
      scenario.beamHp === null &&
      scenario.holdSeenBeforeRestart === false &&
      scenario.visualOnlyBeamSeen === true &&
      scenario.damagingBeamSeen === false &&
      scenario.lastBeamSnapshot?.centerOffsetY === -144 &&
      scenario.controlReturnTime !== null &&
      scenario.controlReturnTime <= 1.65 &&
      scenario.restartResult?.move === "forward_heavy_special" &&
      scenario.finalP1Failsafe === false;
    const runtimeOk =
      twoStageOk(report.runtime.close) &&
      twoStageOk(report.runtime.mid) &&
      wallBounceOk(report.runtime.leftWall) &&
      wallBounceOk(report.runtime.rightWall) &&
      whiffOk(report.runtime.whiff) &&
      whiffOk(report.runtime.whiffRepeat) &&
      report.runtime.repeatBlockedBounce.stage1Hp !== null &&
      report.runtime.repeatBlockedBounce.beamHp !== null &&
      report.runtime.repeatBlockedBounce.maxWallBounces === 1;

    report.checks = {
      aliasRowsOk,
      noOldFallback,
      forwardRowsOk,
      registryOk,
      runtimeOk,
      errorsOk: errors.length === 0,
      requestedAtlas: requests.some((url) => url.includes("lamuh_sheet_forward_specials_redesign_atlas.png")),
    };
    report.errors = errors;
    report.ok = Object.values(report.checks).every(Boolean);
    fs.writeFileSync(REPORT_PATH, `${JSON.stringify(report, null, 2)}\n`);
    if (!report.ok) throw new Error(`LAMUH Mirror Pierce smoke failed: ${JSON.stringify(report.checks)}`);
  } finally {
    if (cdp) cdp.close();
    if (chrome) {
      chrome.kill();
      await delay(250);
    }
    server.close();
    try {
      fs.rmSync(CHROME_PROFILE, { recursive: true, force: true, maxRetries: 5, retryDelay: 120 });
    } catch (err) {
      report.cleanupWarning = err.message;
      if (report.checks) fs.writeFileSync(REPORT_PATH, `${JSON.stringify(report, null, 2)}\n`);
    }
  }

  console.log(JSON.stringify({
    ok: report.ok,
    report: path.relative(ROOT, REPORT_PATH).replace(/\\/g, "/"),
    checks: report.checks,
  }, null, 2));
}

run().catch((err) => {
  fs.mkdirSync(OUT_DIR, { recursive: true });
  let report = null;
  if (fs.existsSync(REPORT_PATH)) {
    try {
      report = JSON.parse(fs.readFileSync(REPORT_PATH, "utf8"));
    } catch (_) {
      report = null;
    }
  }
  report = report || {
    ok: false,
    checkedAt: new Date().toISOString(),
  };
  report.ok = false;
  report.error = err.message;
  fs.writeFileSync(REPORT_PATH, `${JSON.stringify(report, null, 2)}\n`);
  console.error(err);
  process.exit(1);
});
