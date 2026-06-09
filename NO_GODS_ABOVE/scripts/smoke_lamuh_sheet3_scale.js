#!/usr/bin/env node
/* Focused LAMUH Sheet 3 scale/wiring smoke.
 * Loads the hidden LAMUH test hook, verifies the body-scale atlas is active,
 * and confirms down/up specials still resolve to Sheet 3 rows 0-5.
 */

const fs = require("fs");
const http = require("http");
const os = require("os");
const path = require("path");
const { spawn } = require("child_process");

const ROOT = path.resolve(__dirname, "..");
const OUT_DIR = path.join(ROOT, "assets", "characters", "lamuh");
const REPORT_PATH = path.join(OUT_DIR, "lamuh_sheet3_scale_smoke_report.json");
const CHROME = "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";
const DEBUG_PORT = 9338;
const CHROME_PROFILE = path.join(os.tmpdir(), `nga-lamuh-sheet3-scale-${process.pid}`);
const EXPECTED_ATLAS = "lamuh_sheet_3_down_up_specials_body_scale_atlas.png";

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
    // Chrome can keep a temp profile locked for a beat on Windows.
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
    await waitFor(cdp, "Boolean(window.__lamuhHiddenTest && window.__lamuhHiddenTest.state?.images?.lamuhDownUpSpecialsRedesign)");

    report.asset = await evaluate(cdp, `(() => {
      const t = window.__lamuhHiddenTest;
      return {
        path: t.assetPaths.lamuhDownUpSpecialsRedesign,
        loaded: Boolean(t.state.images.lamuhDownUpSpecialsRedesign),
        width: t.state.images.lamuhDownUpSpecialsRedesign?.naturalWidth || t.state.images.lamuhDownUpSpecialsRedesign?.width,
        height: t.state.images.lamuhDownUpSpecialsRedesign?.naturalHeight || t.state.images.lamuhDownUpSpecialsRedesign?.height,
        meta: t.sheetMeta.lamuhDownUpSpecialsRedesign,
      };
    })()`);

    report.mappings = await evaluate(cdp, `(() => {
      const p = window.__lamuhHiddenTest.profile.playerAnimations;
      const keys = [
        "down_special", "down_light_special", "low_mirror_cut", "lamuh_low_mirror_cut",
        "down_medium_special", "ground_breaker", "lamuh_ground_breaker",
        "down_heavy_special", "crown_rupture", "lamuh_crown_rupture",
        "up_light_special", "crown_pop", "lamuh_crown_pop",
        "up_medium_special", "rising_crown", "lamuh_rising_crown",
        "up_heavy_special", "ascendant_break", "lamuh_ascendant_break"
      ];
      return Object.fromEntries(keys.map((key) => [key, p[key]]));
    })()`);

    report.runtimeMoves = await evaluate(cdp, `(() => {
      const t = window.__lamuhHiddenTest;
      const moves = ["down_light_special", "down_medium_special", "down_heavy_special", "up_light_special", "up_medium_special", "up_heavy_special"];
      return Object.fromEntries(moves.map((move) => {
        const started = t.startMove(move, "p1", { grounded: true });
        return [move, { started, playerAnim: t.state.player.anim, activeMove: t.state.player.activeMove }];
      }));
    })()`);

    const expectedRows = {
      down_special: 0,
      down_light_special: 0,
      low_mirror_cut: 0,
      lamuh_low_mirror_cut: 0,
      down_medium_special: 1,
      ground_breaker: 1,
      lamuh_ground_breaker: 1,
      down_heavy_special: 2,
      crown_rupture: 2,
      lamuh_crown_rupture: 2,
      up_light_special: 3,
      crown_pop: 3,
      lamuh_crown_pop: 3,
      up_medium_special: 4,
      rising_crown: 4,
      lamuh_rising_crown: 4,
      up_heavy_special: 5,
      ascendant_break: 5,
      lamuh_ascendant_break: 5,
    };
    const mappingOk = Object.entries(expectedRows).every(([key, row]) => {
      const entry = report.mappings[key];
      return Array.isArray(entry) && entry[0] === "lamuhDownUpSpecialsRedesign" && entry[1] === row;
    });
    const assetOk =
      report.asset.loaded &&
      report.asset.path.includes(EXPECTED_ATLAS) &&
      report.asset.width === 3584 &&
      report.asset.height === 2688 &&
      report.asset.meta?.rows === 6 &&
      report.asset.meta?.cols === 8 &&
      report.asset.meta?.cellSize === 448;
    const runtimeOk = Object.entries(report.runtimeMoves).every(([move, data]) => data.activeMove === move && data.started?.move === move);
    report.checks = { assetOk, mappingOk, runtimeOk };
    report.ok = assetOk && mappingOk && runtimeOk;
  } finally {
    if (cdp?.socket) cdp.socket.close();
    if (chrome) chrome.kill();
    server.close();
    rmProfile();
    fs.mkdirSync(OUT_DIR, { recursive: true });
    fs.writeFileSync(REPORT_PATH, JSON.stringify(report, null, 2));
  }
  console.log(JSON.stringify({ ok: report.ok, report: path.relative(ROOT, REPORT_PATH), checks: report.checks }, null, 2));
  if (!report.ok) process.exit(1);
}

main().catch((err) => {
  fs.mkdirSync(OUT_DIR, { recursive: true });
  fs.writeFileSync(REPORT_PATH, JSON.stringify({ ok: false, error: err.stack || String(err) }, null, 2));
  console.error(err);
  process.exit(1);
});
