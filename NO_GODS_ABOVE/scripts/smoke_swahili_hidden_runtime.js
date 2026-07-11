#!/usr/bin/env node
"use strict";

const fs = require("fs");
const http = require("http");
const os = require("os");
const path = require("path");
const { spawn } = require("child_process");

const ROOT = path.resolve(__dirname, "..");
const CHROME = "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";
const DEBUG_PORT = 9341;
const PROFILE = path.join(os.tmpdir(), `nga-swahili-smoke-${process.pid}`);
const SCREENSHOT = path.join(ROOT, "docs", "swahili_hidden_runtime_preview.png");
const MIME = {
  ".html": "text/html; charset=utf-8",
  ".js": "application/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".png": "image/png",
  ".json": "application/json; charset=utf-8"
};

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

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
  fs.rmSync(PROFILE, { recursive: true, force: true });
  fs.mkdirSync(PROFILE, { recursive: true });
  const chrome = spawn(CHROME, [
    `--remote-debugging-port=${DEBUG_PORT}`,
    `--user-data-dir=${PROFILE}`,
    "--headless=new",
    "--disable-gpu",
    "--no-first-run",
    "--no-default-browser-check",
    "about:blank"
  ], { stdio: "ignore" });
  for (let i = 0; i < 100; i += 1) {
    try {
      const response = await fetch(`http://127.0.0.1:${DEBUG_PORT}/json/version`);
      if (response.ok) return chrome;
    } catch {
      // Chrome is still starting.
    }
    await delay(100);
  }
  chrome.kill();
  throw new Error("Chrome remote debugging endpoint did not start.");
}

function connectCdp(url) {
  return new Promise((resolve, reject) => {
    const socket = new WebSocket(url);
    let nextId = 1;
    const pending = new Map();
    const listeners = [];
    socket.onopen = () => resolve({
      send(method, params = {}) {
        const id = nextId++;
        socket.send(JSON.stringify({ id, method, params }));
        return new Promise((res, rej) => pending.set(id, { res, rej, method }));
      },
      onEvent(listener) { listeners.push(listener); },
      close() { socket.close(); }
    });
    socket.onerror = (event) => reject(event.error || new Error("CDP websocket error"));
    socket.onmessage = (event) => {
      const message = JSON.parse(event.data);
      if (message.id && pending.has(message.id)) {
        const item = pending.get(message.id);
        pending.delete(message.id);
        if (message.error) item.rej(new Error(`${item.method}: ${message.error.message}`));
        else item.res(message.result || {});
        return;
      }
      listeners.forEach((listener) => listener(message));
    };
  });
}

async function openTarget() {
  const response = await fetch(`http://127.0.0.1:${DEBUG_PORT}/json/new?${encodeURIComponent("about:blank")}`, { method: "PUT" });
  if (!response.ok) throw new Error(`Failed to create Chrome target: ${response.status}`);
  const target = await response.json();
  return connectCdp(target.webSocketDebuggerUrl);
}

async function evaluate(cdp, expression) {
  const response = await cdp.send("Runtime.evaluate", { expression, awaitPromise: true, returnByValue: true, userGesture: true });
  if (response.exceptionDetails) throw new Error(response.exceptionDetails.text || "Runtime evaluation failed.");
  return response.result?.value;
}

async function navigate(cdp, url) {
  let loaded = false;
  const marker = () => { loaded = true; };
  cdp.onEvent((message) => { if (message.method === "Page.loadEventFired") marker(); });
  await cdp.send("Page.navigate", { url });
  for (let i = 0; i < 150 && !loaded; i += 1) await delay(100);
  await delay(500);
}

async function waitFor(cdp, expression, timeoutMs = 12000) {
  const started = Date.now();
  while (Date.now() - started < timeoutMs) {
    if (await evaluate(cdp, expression)) return;
    await delay(100);
  }
  throw new Error(`Timed out waiting for ${expression}`);
}

async function main() {
  if (!fs.existsSync(CHROME)) throw new Error(`Chrome not found at ${CHROME}`);
  const server = await serveStatic();
  const port = server.address().port;
  let chrome;
  let cdp;
  const pageErrors = [];
  const requests = [];
  try {
    chrome = await launchChrome();
    cdp = await openTarget();
    cdp.onEvent((message) => {
      if (message.method === "Network.requestWillBeSent") requests.push(message.params.request.url);
      if (message.method === "Runtime.exceptionThrown") pageErrors.push(message.params.exceptionDetails?.text || "Runtime exception");
      if (message.method === "Runtime.consoleAPICalled" && message.params.type === "error") {
        pageErrors.push(message.params.args.map((arg) => arg.value || arg.description || "").join(" "));
      }
    });
    await cdp.send("Page.enable");
    await cdp.send("Runtime.enable");
    await cdp.send("Network.enable");

    const publicUrl = `http://127.0.0.1:${port}/index.html`;
    await navigate(cdp, publicUrl);
    await waitFor(cdp, "Boolean(window.__platformArenaTest)");
    const publicSnapshot = await evaluate(cdp, `({
      selectable: window.__platformArenaTest.selectableCharacterIds,
      swahiliHook: typeof window.__swahiliTest,
      swahiliData: typeof window.SWAHILI_CHARACTER_DATA
    })`);
    const publicRequestedSwahiliData = requests.some((url) => url.includes("data/characters/swahili.js"));

    requests.length = 0;
    await navigate(cdp, `${publicUrl}?swahiliTest=1`);
    await waitFor(cdp, "Boolean(window.__swahiliTest)");
    const validation = await evaluate(cdp, "window.__swahiliTest.validation()");
    const p1Start = await evaluate(cdp, "window.__swahiliTest.startP1()");
    const normalStart = await evaluate(cdp, "window.__swahiliTest.startMove('neutral_heavy')");
    const projectileStart = await evaluate(cdp, "window.__swahiliTest.startMove('neutral_light_special')");
    await delay(420);
    const projectileSnapshot = await evaluate(cdp, "window.__swahiliTest.snapshot()");
    const trapStart = await evaluate(cdp, "window.__swahiliTest.startMove('back_light_special')");
    await waitFor(cdp, "window.__swahiliTest.snapshot().contracts >= 1", 2500);
    const trapSnapshot = await evaluate(cdp, "window.__swahiliTest.snapshot()");
    const debt = await evaluate(cdp, "window.__swahiliTest.addDebt(5)");
    const debtSnapshot = await evaluate(cdp, "window.__swahiliTest.snapshot()");
    await evaluate(cdp, "window.__swahiliTest.setDebug(true)");
    await delay(120);
    const screenshot = await cdp.send("Page.captureScreenshot", { format: "png", fromSurface: true });
    fs.writeFileSync(SCREENSHOT, Buffer.from(screenshot.data, "base64"));
    await evaluate(cdp, `(() => {
      const hook = window.__swahiliTest;
      hook.startMirror();
      hook.state.player.x = 420;
      hook.state.enemy.x = 500;
      hook.state.player.facing = 1;
      hook.state.enemy.facing = -1;
      hook.startMove('back_heavy_special', 'p1');
      hook.startMove('light_attack', 'p2');
      return true;
    })()`);
    await delay(280);
    const counterSnapshot = await evaluate(cdp, "window.__swahiliTest.snapshot()");
    const p2Start = await evaluate(cdp, "window.__swahiliTest.startP2()");
    const p2Move = await evaluate(cdp, "window.__swahiliTest.startMove('neutral_light_special', 'p2')");
    const hiddenRequestedSprite = requests.some((url) => /assets\/sprites\/swahili/i.test(url));

    const assertions = {
      publicRosterUnchanged: !publicSnapshot.selectable.includes("swahili"),
      publicHookAbsent: publicSnapshot.swahiliHook === "undefined",
      publicDataAbsent: publicSnapshot.swahiliData === "undefined",
      publicDidNotRequestSwahiliData: !publicRequestedSwahiliData,
      hiddenLaunchable: validation.hiddenLaunchable === true && validation.publicSelectable === false,
      definitionsComplete: validation.canonicalNormals === 15 && validation.canonicalSpecials === 15 && validation.ultimateDefinitions === 1 && validation.missingRuntimeNormals.length === 0 && validation.missingRuntimeSpecials.length === 0 && validation.runtimeUltimatePresent === true,
      noProductionRuntimeAssets: validation.runtimeAssetsRequested.length === 0 && !hiddenRequestedSprite,
      p1Starts: p1Start.p1 === "swahili",
      normalStarts: normalStart.move === "neutral_heavy",
      projectileStarts: projectileStart.move === "neutral_light_special" && projectileSnapshot.projectiles >= 1,
      trapStarts: trapStart.move === "back_light_special" && trapSnapshot.contracts >= 1,
      debtDefaults: debt.marks === 5 && debt.defaultedTimer > 0 && debtSnapshot.p2.debtMarks.length === 5,
      counterStubWorks: counterSnapshot.p2.debtMarks.length >= 2 && counterSnapshot.p2.hp < 1050,
      p2Starts: p2Start.p2 === "swahili" && p2Move.move === "enemy_neutral_light_special",
      noRuntimeExceptions: pageErrors.length === 0
    };
    const failed = Object.entries(assertions).filter(([, passed]) => !passed).map(([name]) => name);
    const report = {
      ok: failed.length === 0,
      assertions,
      failed,
      pageErrors,
      publicSnapshot,
      validation,
      p1Start,
      p2Start,
      projectileCount: projectileSnapshot.projectiles,
      contractCount: trapSnapshot.contracts,
      debt,
      counterSnapshot,
      screenshot: path.relative(ROOT, SCREENSHOT).replace(/\\/g, "/")
    };
    process.stdout.write(`${JSON.stringify(report, null, 2)}\n`);
    if (!report.ok) process.exitCode = 1;
  } finally {
    cdp?.close();
    if (chrome) {
      chrome.kill();
      for (let i = 0; i < 20 && chrome.exitCode === null; i += 1) await delay(100);
    }
    await new Promise((resolve) => server.close(resolve));
    for (let i = 0; i < 8 && fs.existsSync(PROFILE); i += 1) {
      try {
        fs.rmSync(PROFILE, { recursive: true, force: true });
      } catch (error) {
        if (i === 7) console.warn(`Smoke passed but temporary Chrome profile cleanup was deferred: ${error.message}`);
        else await delay(250);
      }
    }
  }
}

main().catch((error) => {
  console.error(error.stack || error.message || error);
  process.exitCode = 1;
});
