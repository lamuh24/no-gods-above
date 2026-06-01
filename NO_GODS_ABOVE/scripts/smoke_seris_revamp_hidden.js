#!/usr/bin/env node
/* Public Seris revamp smoke test using Chrome DevTools Protocol directly.
 *
 * The bundled Playwright package on this machine is missing playwright-core, so
 * this script uses system Chrome's remote-debugging endpoint without adding any
 * project dependency. It starts a local static server, verifies Seris is public
 * selectable, then opens ?serisTest=1 and exercises Seris through the test hook.
 */

const fs = require("fs");
const http = require("http");
const os = require("os");
const path = require("path");
const { spawn } = require("child_process");

const ROOT = path.resolve(__dirname, "..");
const OUT_DIR = path.join(ROOT, "assets", "sprites", "seris_revamp_final", "validation", "smoke_public");
const CHROME = "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";
const DEBUG_PORT = 9334;
const CHROME_PROFILE = path.join(os.tmpdir(), `nga-seris-smoke-${process.pid}`);

const MIME = {
  ".html": "text/html; charset=utf-8",
  ".js": "application/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".json": "application/json; charset=utf-8",
};

function rel(p) {
  return path.relative(ROOT, p).replace(/\\/g, "/");
}

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
    } catch {
      // Chrome is still booting.
    }
    await delay(100);
  }
  chrome.kill();
  throw new Error("Chrome remote debugging endpoint did not start.");
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

async function canvasStats(cdp) {
  return evaluate(cdp, `(() => {
    const canvas = document.getElementById("game");
    const ctx = canvas.getContext("2d", { willReadFrequently: true });
    const { data, width, height } = ctx.getImageData(0, 0, canvas.width, canvas.height);
    let magenta = 0, green = 0, opaqueish = 0;
    for (let i = 0; i < data.length; i += 4) {
      const r = data[i], g = data[i + 1], b = data[i + 2], a = data[i + 3];
      if (a > 20) opaqueish += 1;
      if (r > 220 && g < 40 && b > 220 && a > 20) magenta += 1;
      if (g > 180 && r < 80 && b < 100 && a > 20) green += 1;
    }
    return { width, height, opaqueish, magentaPixels: magenta, greenPixels: green };
  })()`);
}

async function saveCanvas(cdp, outputPath) {
  const dataUrl = await evaluate(cdp, `document.getElementById("game").toDataURL("image/png")`);
  fs.writeFileSync(outputPath, Buffer.from(dataUrl.split(",")[1], "base64"));
}

async function cdpScreenshot(cdp, outputPath) {
  const shot = await cdp.send("Page.captureScreenshot", { format: "png", captureBeyondViewport: false });
  fs.writeFileSync(outputPath, Buffer.from(shot.data, "base64"));
}

async function captureState(cdp, name, expression, screenshots) {
  const result = await evaluate(cdp, expression);
  await delay(160);
  const stats = await canvasStats(cdp);
  const screenshotPath = path.join(OUT_DIR, `${name}.png`);
  if (screenshots) await saveCanvas(cdp, screenshotPath);
  return { name, result, stats, screenshot: screenshots ? rel(screenshotPath) : null };
}

async function run() {
  fs.mkdirSync(OUT_DIR, { recursive: true });
  const server = await serveStatic();
  const chrome = await launchChrome();
  const port = server.address().port;
  const base = `http://127.0.0.1:${port}`;
  const report = { status: "pass", baseUrl: base, public: {}, hidden: {}, failures: [] };

  try {
    const publicErrors = [];
    const publicRequests = [];
    const publicCdp = await openTarget();
    await setupPage(publicCdp, publicErrors, publicRequests);
    await navigate(publicCdp, `${base}/index.html?smoke=public`);
    const publicInfo = await evaluate(publicCdp, `({
      cards: Array.from(document.querySelectorAll("[data-character]")).map((el) => el.dataset.character),
      hasSerisCard: Boolean(document.querySelector('[data-character="seris"]')),
      helperExists: Boolean(window.__serisRevampTest)
    })`);
    await evaluate(publicCdp, `document.getElementById("start-button").click()`);
    await delay(200);
    const publicSelectScreenshot = path.join(OUT_DIR, "public_character_select.png");
    await cdpScreenshot(publicCdp, publicSelectScreenshot);
    const publicFighterSmokes = [];
    for (const characterId of publicInfo.cards) {
      await navigate(publicCdp, `${base}/index.html?smoke=public-${characterId}`);
      await evaluate(publicCdp, `document.querySelector('[data-character="${characterId}"]').click()`);
      await delay(260);
      const publicScreenshot = characterId === "seris" ? path.join(OUT_DIR, "public_seris_selected.png") : null;
      if (publicScreenshot) await saveCanvas(publicCdp, publicScreenshot);
      publicFighterSmokes.push({
        characterId,
        playerName: await evaluate(publicCdp, `document.getElementById("player-name").textContent`),
        roundStatus: await evaluate(publicCdp, `document.getElementById("round-status").textContent`),
        stats: await canvasStats(publicCdp),
        screenshot: publicScreenshot ? rel(publicScreenshot) : null,
      });
    }
    const publicSerisFinalRequests = publicRequests.filter((url) => /seris_revamp_final/i.test(url));
    const publicSerisSheet8Requests = publicRequests.filter((url) => /seris_chain_whip|assets\/effects\/seris/i.test(url));
    const expectedCards = ["kairo", "vanta", "nyx", "sol", "seris"];
    report.public = {
      ...publicInfo,
      expectedCards,
      selectScreenshot: rel(publicSelectScreenshot),
      fighterSmokes: publicFighterSmokes,
      serisFinalRequests: publicSerisFinalRequests,
      sheet8Requests: publicSerisSheet8Requests,
      failedOrConsoleErrors: publicErrors
    };
    if (expectedCards.some((id) => !publicInfo.cards.includes(id))) report.failures.push("Public character select is missing at least one expected roster card.");
    if (!publicInfo.hasSerisCard) report.failures.push("Public character select does not expose Seris.");
    if (publicInfo.helperExists) report.failures.push("Hidden Seris test helper exists on public URL.");
    if (publicSerisFinalRequests.length < 7) report.failures.push("Public URL did not request all seven final Seris body sheets.");
    if (publicSerisSheet8Requests.length) report.failures.push("Public URL requested Sheet 8 / Seris VFX assets.");
    if (publicErrors.length) report.failures.push("Public URL had console/request errors.");
    const serisPublicSmoke = publicFighterSmokes.find((item) => item.characterId === "seris");
    if (!serisPublicSmoke || !/SERIS/.test(serisPublicSmoke.playerName)) report.failures.push("Public Seris card did not launch Seris as Player 1.");
    if (publicFighterSmokes.some((item) => item.stats.magentaPixels > 0 || item.stats.greenPixels > 0 || item.stats.opaqueish < 1000)) {
      report.failures.push("A public fighter smoke produced chroma/magenta pixels or a blank canvas.");
    }
    publicCdp.close();

    const hiddenErrors = [];
    const hiddenRequests = [];
    const hiddenCdp = await openTarget();
    await setupPage(hiddenCdp, hiddenErrors, hiddenRequests);
    await navigate(hiddenCdp, `${base}/index.html?serisTest=1`);
    await waitFor(hiddenCdp, `Boolean(window.__serisRevampTest && window.__serisRevampTest.state?.player?.profile?.id === "seris")`);
    await delay(250);
    const hiddenInfo = await evaluate(hiddenCdp, `({
      mode: window.__serisRevampTest.state.mode,
      playerId: window.__serisRevampTest.state.player.profile.id,
      enemyId: window.__serisRevampTest.state.enemy.profile.id,
      publicSelectable: window.__serisRevampTest.selectableCharacterIds,
      hiddenSelectable: window.__serisRevampTest.hiddenTestCharacterIds,
      chainVfxEnabled: window.__serisRevampTest.chainVfxEnabled,
      loadedSerisAssets: window.__serisRevampTest.loadedSerisAssets(),
      hasSerisCard: Boolean(document.querySelector('[data-character="seris"]'))
    })`);

    const directStates = [
      ["idle", "idle", { facing: 1 }],
      ["walk_forward", "walk_forward", { facing: 1 }],
      ["walk_back", "walk_back", { facing: 1 }],
      ["dash_forward", "dash_forward", { facing: 1 }],
      ["dash_back", "dash_back", { facing: 1 }],
      ["crouch", "crouch", { facing: 1 }],
      ["jump_up", "jump_up", { grounded: false, y: 455 }],
      ["jump_forward", "jump_forward", { grounded: false, y: 455 }],
      ["jump_back", "jump_back", { grounded: false, y: 455 }],
      ["fall", "fall", { grounded: false, y: 455 }],
      ["air_dash_forward", "air_dash_forward", { grounded: false, y: 455 }],
      ["air_dash_back", "air_dash_back", { grounded: false, y: 455 }],
      ["block", "stand_block", {}],
      ["crouch_block", "crouch_block", {}],
      ["air_block", "air_block", { grounded: false, y: 455 }],
      ["light_hitstun", "light_hitstun", { hitstun: 1 }],
      ["medium_hitstun", "medium_hitstun", { hitstun: 1 }],
      ["heavy_hitstun", "heavy_hitstun", { hitstun: 1 }],
      ["launch_hitstun", "launch_hitstun", { grounded: false, y: 455, hitstun: 1 }],
      ["air_hitstun", "air_hitstun", { grounded: false, y: 455, hitstun: 1 }],
      ["knockdown_fall", "knockdown_fall", { grounded: false, y: 500 }],
      ["grounded_downed", "grounded", {}],
      ["get_up", "get_up", {}],
      ["intro", "intro", {}],
      ["victory", "victory", {}],
      ["taunt", "taunt", {}],
      ["left_facing_idle", "idle", { facing: -1 }],
      ["right_facing_idle", "idle", { facing: 1 }],
    ];
    const moveStates = [
      ["neutral_light", "neutral_light", {}],
      ["forward_light", "forward_light", {}],
      ["back_light", "back_light", {}],
      ["down_light", "down_light", {}],
      ["neutral_medium", "neutral_medium", {}],
      ["forward_medium", "forward_medium", {}],
      ["back_medium", "back_medium", {}],
      ["down_medium", "down_medium", {}],
      ["neutral_heavy", "neutral_heavy", {}],
      ["forward_heavy", "forward_heavy", {}],
      ["back_heavy", "back_heavy", {}],
      ["launcher", "launcher", {}],
      ["down_heavy", "down_heavy", {}],
      ["jump_light", "jump_light", { grounded: false, y: 455 }],
      ["jump_medium", "jump_medium", { grounded: false, y: 455 }],
      ["jump_heavy", "jump_heavy", { grounded: false, y: 455 }],
      ["special_1", "special_1", {}],
      ["special_2", "special_2", {}],
      ["special_3", "special_3", {}],
      ["ultimate", "ultimate", {}],
    ];
    const screenshotNames = new Set([
      "idle", "walk_forward", "dash_forward", "jump_up", "air_dash_forward",
      "neutral_light", "neutral_medium", "neutral_heavy", "launcher", "jump_medium", "jump_heavy",
      "special_1", "special_2", "ultimate", "block", "heavy_hitstun",
      "knockdown_fall", "get_up", "intro", "victory", "taunt", "left_facing_idle", "right_facing_idle",
    ]);

    const stateResults = [];
    for (const [name, anim, options] of directStates) {
      stateResults.push(await captureState(hiddenCdp, name, `window.__serisRevampTest.setPlayerAnim(${JSON.stringify(anim)}, ${JSON.stringify(options)})`, screenshotNames.has(name)));
    }
    for (const [name, move, options] of moveStates) {
      stateResults.push(await captureState(hiddenCdp, name, `window.__serisRevampTest.startMove(${JSON.stringify(move)}, ${JSON.stringify(options)})`, screenshotNames.has(name)));
    }

    const badCanvasStates = stateResults.filter((r) => r.stats.magentaPixels > 0 || r.stats.greenPixels > 0 || r.stats.opaqueish < 1000);
    const serisFinalRequests = hiddenRequests.filter((url) => /seris_revamp_final/i.test(url));
    const sheet8Requests = hiddenRequests.filter((url) => /seris_chain_whip|assets\/effects\/seris/i.test(url));
    report.hidden = {
      ...hiddenInfo,
      serisFinalRequests,
      sheet8Requests,
      failedOrConsoleErrors: hiddenErrors,
      stateResults,
      badCanvasStates,
    };
    if (hiddenInfo.playerId !== "seris") report.failures.push("Hidden URL did not start Seris as player.");
    if (!hiddenInfo.hasSerisCard) report.failures.push("Seris card disappeared on the hidden test URL.");
    if (hiddenInfo.chainVfxEnabled) report.failures.push("Seris chain VFX flag is enabled.");
    if (sheet8Requests.length) report.failures.push("Hidden Seris smoke requested Sheet 8 / Seris VFX assets.");
    if (hiddenErrors.length) report.failures.push("Hidden Seris smoke had console/request errors.");
    if (badCanvasStates.length) report.failures.push("Hidden Seris smoke found chroma/magenta or blank canvas states.");
    const loaded = hiddenInfo.loadedSerisAssets || {};
    const missingBodyAssets = Object.entries(loaded).filter(([key, value]) => key !== "serisChainWhipVfx" && !value);
    if (missingBodyAssets.length) report.failures.push(`Missing Seris body assets: ${missingBodyAssets.map(([key]) => key).join(", ")}`);
    if (loaded.serisChainWhipVfx) report.failures.push("Seris Sheet 8/VFX atlas loaded unexpectedly.");
    hiddenCdp.close();
  } finally {
    try {
      await fetch(`http://127.0.0.1:${DEBUG_PORT}/json/close`, { method: "PUT" });
    } catch {
      // Ignore close endpoint quirks; kill below.
    }
    chrome.kill();
    server.close();
    try {
      fs.rmSync(CHROME_PROFILE, { recursive: true, force: true });
    } catch {
      // Chrome can hold temp profile handles briefly after process shutdown.
    }
  }

  report.status = report.failures.length ? "fail" : "pass";
  const reportPath = path.join(OUT_DIR, "seris_revamp_public_smoke_report.json");
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
  console.log(JSON.stringify({ status: report.status, report: rel(reportPath), failures: report.failures }, null, 2));
  process.exit(report.status === "pass" ? 0 : 1);
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
