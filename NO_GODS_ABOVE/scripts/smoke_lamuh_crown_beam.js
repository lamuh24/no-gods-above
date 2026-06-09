#!/usr/bin/env node
/* Runtime smoke for LAMUH Heavy Neutral / Crown Beam visual phase routing. */

const fs = require("fs");
const http = require("http");
const os = require("os");
const path = require("path");
const { spawn } = require("child_process");

const ROOT = path.resolve(__dirname, "..");
const OUT_DIR = path.join(ROOT, "assets", "characters", "lamuh");
const REPORT_PATH = path.join(OUT_DIR, "lamuh_crown_beam_smoke_report.json");
const CHROME = "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";
const DEBUG_PORT = 9341;
const CHROME_PROFILE = path.join(os.tmpdir(), `nga-lamuh-crown-beam-${process.pid}`);
const EXPECTED_SHEET = "lamuhNeutralSpecialsBodyVfxRedesign";

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

function rmProfile() {
  try {
    fs.rmSync(CHROME_PROFILE, { recursive: true, force: true });
  } catch (_) {
    // Windows can hold Chrome profile handles briefly.
  }
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
  rmProfile();
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
  const res = await fetch(`http://127.0.0.1:${DEBUG_PORT}/json/new?${encodeURIComponent("about:blank")}`, { method: "PUT" });
  const target = await res.json();
  const ws = target.webSocketDebuggerUrl;
  const WebSocket = global.WebSocket || require("ws");
  return new Promise((resolve, reject) => {
    const socket = new WebSocket(ws);
    const callbacks = new Map();
    let seq = 0;
    socket.onmessage = (event) => {
      const msg = JSON.parse(event.data);
      if (msg.id && callbacks.has(msg.id)) {
        const { resolve: cbResolve, reject: cbReject } = callbacks.get(msg.id);
        callbacks.delete(msg.id);
        if (msg.error) cbReject(new Error(msg.error.message));
        else cbResolve(msg.result);
      }
    };
    socket.onerror = reject;
    socket.onopen = () => resolve({
      socket,
      send(method, params = {}) {
        const id = ++seq;
        socket.send(JSON.stringify({ id, method, params }));
        return new Promise((cbResolve, cbReject) => callbacks.set(id, { resolve: cbResolve, reject: cbReject }));
      },
    });
  });
}

async function evaluate(cdp, expression, awaitPromise = false) {
  const result = await cdp.send("Runtime.evaluate", {
    expression,
    awaitPromise,
    returnByValue: true,
    userGesture: true,
  });
  if (result.exceptionDetails) throw new Error(result.exceptionDetails.text || "Runtime.evaluate failed");
  return result.result.value;
}

async function waitFor(cdp, expression, timeoutMs = 10000) {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    if (await evaluate(cdp, expression)) return true;
    await delay(100);
  }
  throw new Error(`Timed out waiting for: ${expression}`);
}

async function main() {
  const report = { ok: false };
  const server = await serveStatic();
  const port = server.address().port;
  let chrome;
  let cdp;
  try {
    chrome = await launchChrome();
    cdp = await openTarget();
    await cdp.send("Page.enable");
    await cdp.send("Runtime.enable");
    await cdp.send("Page.navigate", { url: `http://127.0.0.1:${port}/?lamuhTest=1` });
    await waitFor(cdp, "Boolean(window.__lamuhHiddenTest && window.__lamuhHiddenTest.state?.images?.lamuhNeutralSpecialsBodyVfxRedesign)");

    report.mappings = await evaluate(cdp, `(() => {
      const t = window.__lamuhHiddenTest;
      const p = t.profile.playerAnimations;
      const e = t.profile.enemyAnimations;
      const keys = [
        "neutral_heavy",
        "heavy_attack",
        "crown_breaker",
        "lamuh_stand_heavy",
        "special_3",
        "neutral_heavy_special",
        "crown_beam",
        "lamuh_crown_beam",
        "crown_beam_charge",
        "crown_beam_fire",
        "crown_beam_recovery"
      ];
      return {
        assetPath: t.assetPaths.lamuhNeutralSpecialsBodyVfxRedesign,
        sheet1AssetPath: t.assetPaths.lamuhSheet1CoreNormalsRedesign,
        loaded: Boolean(t.state.images.lamuhNeutralSpecialsBodyVfxRedesign),
        sheet1Loaded: Boolean(t.state.images.lamuhSheet1CoreNormalsRedesign),
        player: Object.fromEntries(keys.map((key) => [key, p[key]])),
        enemy: Object.fromEntries(keys.map((key) => [\`enemy_\${key}\`, e[\`enemy_\${key}\`]])),
        oldPhaseAliases: {
          crown_charge: p.crown_charge,
          crown_fire: p.crown_fire,
          crown_recovery: p.crown_recovery
        },
        auraKeysStillSuperOnly: ["crown_charge", "crown_fire", "crown_recovery"]
      };
    })()`);

    report.runtime = await evaluate(cdp, `(async () => {
      const t = window.__lamuhHiddenTest;
      const s = t.state;
      const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
      const phaseKeys = new Set(["crown_beam_charge", "crown_beam_fire", "crown_beam_recovery"]);
      const oldKeys = new Set(["crown_charge", "crown_fire", "crown_recovery"]);
      const legacyNeutralOverlayMoves = new Set(["ascendStep", "heavenSplitter"]);

      async function runCase(name, side, facing, hit, move = "neutral_heavy_special") {
        t.startMirror();
        const p1 = s.player;
        const p2 = s.enemy;
        const needsProjectileSpacing = move.includes("medium") || move.includes("heavy") || move === "special_2" || move === "special_3";
        const hitX = needsProjectileSpacing
          ? (facing === 1 ? 700 : 420)
          : (facing === 1 ? 520 : 600);
        p1.x = facing === 1 ? 360 : 760;
        p2.x = hit ? hitX : (facing === 1 ? 1040 : 80);
        p1.y = 576;
        p2.y = 576;
        p1.facing = facing;
        p2.facing = -facing;
        p1.grounded = true;
        p2.grounded = true;
        p1.hp = 1000;
        p2.hp = 1000;
        p1.vx = p1.vy = p2.vx = p2.vy = 0;
        p1.blocking = false;
        p2.blocking = false;
        s.projectiles.length = 0;

        const target = side === "p2" ? p2 : p1;
        const victim = side === "p2" ? p1 : p2;
        target.facing = facing;
        victim.facing = -facing;
        if (side === "p2") {
          p2.x = facing === 1 ? 360 : 760;
          p1.x = hit ? hitX : (facing === 1 ? 1040 : 80);
        }

        const started = t.startMove(move, side, { grounded: true });
        const samples = [];
        for (const ms of [60, 150, 260, 420, 620, 860, 1120]) {
          await wait(ms - (samples.at(-1)?.ms || 0));
          samples.push({
            ms,
            anim: target.anim,
            activeMove: target.activeMove,
            actionTime: Number(target.actionTime.toFixed(3)),
            projectiles: s.projectiles.length,
            lamuhProjectiles: s.projectiles
              .filter((projectile) => projectile.ownerCharacterId === "lamuh")
              .map((projectile) => ({
                profile: projectile.flags?.visualProfile || null,
                x: Math.round(projectile.x),
                y: Math.round(projectile.y),
                w: projectile.w,
                h: projectile.h,
                visualOriginX: Math.round(projectile.visualOriginX || 0),
                visualOriginY: Math.round(projectile.visualOriginY || 0),
                visualAnchorOffsetX: projectile.visualAnchorOffsetX,
                visualAnchorOffsetY: projectile.visualAnchorOffsetY
              })),
            lamuhSpecialEffects: s.lamuhSpecialEffects.map((effect) => ({
              move: effect.move,
              atlasKey: effect.atlasKey,
              row: effect.row
            })),
            victimHp: victim.hp,
          });
        }
        await wait(700);
        const expectedProfile = move.includes("medium") || move === "special_2"
          ? "mirrorPulse"
          : move.includes("heavy") || move === "special_3"
            ? "crownBeam"
            : null;
        return {
          name,
          requestedMove: move,
          side,
          facing,
          hit,
          started,
          samples,
          sawNewPhases: samples.some((sample) => phaseKeys.has(String(sample.anim).replace(/^enemy_/, ""))),
          sawOldPhase: samples.some((sample) => oldKeys.has(String(sample.anim).replace(/^enemy_/, ""))),
          expectedProfile,
          sawExpectedProjectileProfile: expectedProfile
            ? samples.some((sample) => sample.lamuhProjectiles.some((projectile) => projectile.profile === expectedProfile))
            : true,
          sawExpectedProjectileOrHit: expectedProfile
            ? samples.some((sample) => sample.lamuhProjectiles.some((projectile) => projectile.profile === expectedProfile)) || (hit && victim.hp < 1000)
            : true,
          sawLegacyNeutralOverlay: samples.some((sample) =>
            sample.lamuhSpecialEffects.some((effect) => legacyNeutralOverlayMoves.has(effect.move))
          ),
          projectileOriginsAnchored: expectedProfile
            ? samples
              .flatMap((sample) => sample.lamuhProjectiles)
              .filter((projectile) => projectile.profile === expectedProfile)
              .every((projectile) =>
                Number.isFinite(projectile.visualOriginX) &&
                Number.isFinite(projectile.visualOriginY) &&
                Number.isFinite(projectile.visualAnchorOffsetX) &&
                Number.isFinite(projectile.visualAnchorOffsetY)
              )
            : true,
          returnedCleanly: !target.action || !target.activeMove,
          damageLanded: victim.hp < 1000,
        };
      }

      return [
        await runCase("p1_neutral_heavy_special_facing_right_hit", "p1", 1, true, "neutral_heavy_special"),
        await runCase("p1_special_3_facing_right_hit", "p1", 1, true, "special_3"),
        await runCase("p1_neutral_heavy_special_facing_left_whiff", "p1", -1, false, "neutral_heavy_special"),
        await runCase("p1_neutral_medium_special_facing_right_hit", "p1", 1, true, "neutral_medium_special"),
        await runCase("p1_special_2_facing_left_whiff", "p1", -1, false, "special_2"),
        await runCase("p2_neutral_heavy_special_facing_right_hit", "p2", 1, true, "neutral_heavy_special"),
        await runCase("p2_special_3_facing_right_hit", "p2", 1, true, "special_3"),
        await runCase("p2_neutral_heavy_special_facing_left_whiff", "p2", -1, false, "neutral_heavy_special"),
        await runCase("p2_neutral_medium_special_facing_right_hit", "p2", 1, true, "neutral_medium_special")
      ];
    })()`, true);

    const crownBeamKeys = [
      "special_3",
      "neutral_heavy_special",
      "crown_beam",
      "lamuh_crown_beam",
      "crown_beam_charge",
      "crown_beam_fire",
      "crown_beam_recovery"
    ];
    const standingHeavyKeys = ["neutral_heavy", "heavy_attack", "crown_breaker", "lamuh_stand_heavy"];
    const crownBeamMappings = [
      ...crownBeamKeys.map((key) => report.mappings.player[key]),
      ...crownBeamKeys.map((key) => report.mappings.enemy[`enemy_${key}`]),
    ].every((entry) => Array.isArray(entry) && entry[0] === EXPECTED_SHEET && entry[1] === 2);
    const standingHeavyMappings = [
      ...standingHeavyKeys.map((key) => report.mappings.player[key]),
      ...standingHeavyKeys.map((key) => report.mappings.enemy[`enemy_${key}`]),
    ].every((entry) => Array.isArray(entry) && entry[0] === "lamuhSheet1CoreNormalsRedesign" && entry[1] === 5);
    const noOldNeutralHeavyMappings = [
      ...crownBeamKeys.map((key) => report.mappings.player[key]),
      ...crownBeamKeys.map((key) => report.mappings.enemy[`enemy_${key}`]),
    ].every((entry) => Array.isArray(entry) && entry[0] !== "lamuhFinalSpecials");
    const runtimeOk = report.runtime.every((item) =>
      (item.expectedProfile !== "crownBeam" || item.sawNewPhases) &&
      !item.sawOldPhase &&
      !item.sawLegacyNeutralOverlay &&
      item.sawExpectedProjectileOrHit &&
      item.projectileOriginsAnchored &&
      item.returnedCleanly &&
      (item.hit ? item.damageLanded : true)
    );
    report.checks = {
      assetLoaded: report.mappings.loaded && report.mappings.assetPath.includes("lamuh_sheet_neutral_specials_body_vfx_atlas.png"),
      sheet1Loaded: report.mappings.sheet1Loaded && report.mappings.sheet1AssetPath.includes("lamuh_sheet_1_core_movement_redesign_atlas.png"),
      crownBeamMappings,
      standingHeavyMappings,
      noOldNeutralHeavyMappings,
      runtimeOk,
    };
    report.ok = Object.values(report.checks).every(Boolean);
  } catch (error) {
    report.error = error.stack || String(error);
  } finally {
    fs.writeFileSync(REPORT_PATH, JSON.stringify(report, null, 2));
    if (cdp?.socket) cdp.socket.close();
    if (chrome) chrome.kill();
    server.close();
    rmProfile();
  }

  console.log(JSON.stringify({ ok: report.ok, report: path.relative(ROOT, REPORT_PATH), checks: report.checks }, null, 2));
  if (!report.ok) process.exit(1);
}

main();
