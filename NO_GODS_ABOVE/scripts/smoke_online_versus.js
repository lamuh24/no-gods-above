#!/usr/bin/env node
/* Focused smoke for Online Versus (Phase 1 PeerJS host-authoritative netplay).
 * Opens two headless Chrome tabs, hosts a room in one, joins from the other,
 * locks fighters on both sides, starts the match from the host, and verifies
 * input relay + snapshot sync in both directions over a real PeerJS connection.
 * Uses Chrome DevTools Protocol directly so it does not add test dependencies.
 * Requires internet access for the PeerJS public signaling cloud.
 */

const fs = require("fs");
const http = require("http");
const os = require("os");
const path = require("path");
const { spawn } = require("child_process");

const ROOT = path.resolve(__dirname, "..");
const OUT_DIR = path.join(ROOT, "docs");
const REPORT_PATH = path.join(OUT_DIR, "online_versus_smoke_report.json");
const CHROME = "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";
// Two separate Chrome instances: a backgrounded tab gets its requestAnimationFrame
// throttled, which freezes the game loop, so each player needs their own browser.
const HOST_DEBUG_PORT = 9347;
const GUEST_DEBUG_PORT = 9348;
const CHROME_PROFILE_BASE = path.join(os.tmpdir(), `nga-online-smoke-${process.pid}`);

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

async function launchChrome(port, profileSuffix) {
  const profile = `${CHROME_PROFILE_BASE}-${profileSuffix}`;
  fs.rmSync(profile, { recursive: true, force: true });
  fs.mkdirSync(profile, { recursive: true });
  const chrome = spawn(CHROME, [
    `--remote-debugging-port=${port}`,
    `--user-data-dir=${profile}`,
    "--headless=new",
    "--disable-gpu",
    "--no-first-run",
    "--no-default-browser-check",
    "--disable-background-timer-throttling",
    "--disable-backgrounding-occluded-windows",
    "--disable-renderer-backgrounding",
    "about:blank",
  ], { stdio: "ignore" });
  for (let i = 0; i < 80; i += 1) {
    try {
      const res = await fetch(`http://127.0.0.1:${port}/json/version`);
      if (res.ok) return chrome;
    } catch {
      // Chrome is still booting.
    }
    await delay(100);
  }
  chrome.kill();
  throw new Error(`Chrome remote debugging endpoint did not start on port ${port}.`);
}

async function openTarget(port) {
  const res = await fetch(`http://127.0.0.1:${port}/json/new?${encodeURIComponent("about:blank")}`, { method: "PUT" });
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
          return new Promise((res2, rej2) => pending.set(id, { res: res2, rej: rej2, method }));
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
    if (msg.method === "Runtime.consoleAPICalled" && ["error"].includes(msg.params.type)) {
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

function pressKey(cdp, code, holdMs = 60) {
  return evaluate(cdp, `(async () => {
    window.dispatchEvent(new KeyboardEvent("keydown", { code: ${JSON.stringify(code)}, bubbles: true }));
    await new Promise((r) => setTimeout(r, ${holdMs}));
    window.dispatchEvent(new KeyboardEvent("keyup", { code: ${JSON.stringify(code)}, bubbles: true }));
    return true;
  })()`, true);
}

async function run() {
  const report = { ok: false, checks: {}, failures: [], hostErrors: [], guestErrors: [] };
  const server = await serveStatic();
  // Pass a URL argument to smoke the live deployment instead of the local files.
  const baseUrl = process.argv[2] || `http://127.0.0.1:${server.address().port}/index.html`;
  if (process.argv[2]) console.log(`Smoking remote URL: ${baseUrl}`);
  let hostChrome = null;
  let guestChrome = null;
  let host = null;
  let guest = null;

  try {
    hostChrome = await launchChrome(HOST_DEBUG_PORT, "host");
    guestChrome = await launchChrome(GUEST_DEBUG_PORT, "guest");
    host = await openTarget(HOST_DEBUG_PORT);
    guest = await openTarget(GUEST_DEBUG_PORT);
    await setupPage(host, report.hostErrors);
    await setupPage(guest, report.guestErrors);
    await navigate(host, baseUrl);
    await navigate(guest, baseUrl);

    report.checks.pagesBooted =
      (await waitFor(host, "Boolean(window.__platformArenaTest && window.__platformArenaTest.state.mode !== 'loading')", 30000)) &&
      (await waitFor(guest, "Boolean(window.__platformArenaTest && window.__platformArenaTest.state.mode !== 'loading')", 30000));
    if (!report.checks.pagesBooted) throw new Error("Game did not boot in one of the tabs.");

    report.checks.peerJsLoaded =
      (await evaluate(host, "typeof Peer !== 'undefined'")) &&
      (await evaluate(guest, "typeof Peer !== 'undefined'"));
    if (!report.checks.peerJsLoaded) throw new Error("PeerJS script did not load.");

    // Host opens a room from the Online mode detail screen.
    await evaluate(host, "document.getElementById('online-button').click(); true");
    await evaluate(host, "[...document.querySelectorAll('#mode-detail-actions button')].find((button) => button.textContent.trim() === 'Host Match').click(); true");
    const roomReady = await waitFor(host, "/^[A-Z0-9]{5}$/.test(document.getElementById('online-room-code').textContent) && document.getElementById('online-status').classList.contains('good')", 25000);
    report.checks.roomReady = roomReady;
    if (!roomReady) throw new Error("Host room did not become ready (PeerJS signaling unreachable?).");
    const roomCode = await evaluate(host, "document.getElementById('online-room-code').textContent");
    report.checks.roomCode = roomCode;

    // Guest joins it.
    await evaluate(guest, "document.getElementById('online-button').click(); true");
    await evaluate(guest, "[...document.querySelectorAll('#mode-detail-actions button')].find((button) => button.textContent.trim() === 'Join Match').click(); true");
    await evaluate(guest, `document.getElementById('online-code-input').value = ${JSON.stringify(roomCode)}; true`);
    await evaluate(guest, "document.getElementById('online-connect-button').click(); true");

    report.checks.bothInSelect =
      (await waitFor(host, "window.__platformArenaTest.state.mode === 'select'", 25000)) &&
      (await waitFor(guest, "window.__platformArenaTest.state.mode === 'select'", 25000));
    if (!report.checks.bothInSelect) throw new Error("Both tabs did not reach online character select.");

    // Host reviews/locks Kairo as P1, guest reviews/locks Vanta as P2.
    await evaluate(host, "document.querySelector('[data-character=\"kairo\"]').click(); true");
    await evaluate(host, "document.getElementById('showcase-confirm-button').click(); true");
    await evaluate(guest, "document.querySelector('[data-character=\"vanta\"]').click(); true");
    await evaluate(guest, "document.getElementById('showcase-confirm-button').click(); true");
    report.checks.locksSynced =
      (await waitFor(host, "window.__platformArenaTest.state.p1Ready && window.__platformArenaTest.state.p2Ready", 15000)) &&
      (await waitFor(guest, "window.__platformArenaTest.state.p1Ready && window.__platformArenaTest.state.p2Ready", 15000));
    if (!report.checks.locksSynced) throw new Error("Character locks did not sync to both sides.");

    report.checks.bothInArenaStep =
      (await waitFor(host, "!document.getElementById('stage-select-screen').classList.contains('hidden')", 10000)) &&
      (await waitFor(guest, "!document.getElementById('stage-select-screen').classList.contains('hidden')", 10000));
    if (!report.checks.bothInArenaStep) throw new Error("Both tabs did not reach arena selection after fighter locks.");

    // Host confirms the arena, both players see match intro, then host starts the match.
    await evaluate(host, "document.getElementById('stage-confirm-button').click(); true");
    report.checks.bothInMatchIntro =
      (await waitFor(host, "!document.getElementById('match-intro-screen').classList.contains('hidden')", 10000)) &&
      (await waitFor(guest, "!document.getElementById('match-intro-screen').classList.contains('hidden')", 10000));
    if (!report.checks.bothInMatchIntro) throw new Error("Both tabs did not reach match intro after arena confirmation.");
    await evaluate(host, "document.getElementById('intro-start-button').click(); true");
    report.checks.bothInMatch =
      (await waitFor(host, "window.__platformArenaTest.state.mode === 'versus'", 15000)) &&
      (await waitFor(guest, "window.__platformArenaTest.state.mode === 'versus'", 15000));
    if (!report.checks.bothInMatch) throw new Error("Match did not start on both sides.");

    report.checks.matchup = await evaluate(host, "(() => { const s = window.__platformArenaTest.state; return { p1: s.player.characterId, p2: s.enemy.characterId }; })()");

    // Pull fighters into range on the host (authoritative), let a snapshot propagate.
    await evaluate(host, "(() => { const s = window.__platformArenaTest.state; s.enemy.x = s.player.x + 130; return true; })()");
    await delay(400);

    // Guest attacks: J (light) should reach the host as a P2 attack and damage P1.
    const hostP1HpBefore = await evaluate(host, "window.__platformArenaTest.state.player.hp");
    for (let i = 0; i < 6; i += 1) {
      await pressKey(guest, "KeyJ");
      await delay(450);
    }
    const guestDamagedHost = await waitFor(host, `window.__platformArenaTest.state.player.hp < ${hostP1HpBefore}`, 8000);
    report.checks.guestInputDamagesHostP1 = guestDamagedHost;
    if (!guestDamagedHost) report.failures.push("Guest attacks never damaged P1 on the host.");

    // Snapshot sync: the guest should see the same P1 damage.
    const guestSeesP1Damage = await waitFor(guest, `window.__platformArenaTest.state.player.hp < ${hostP1HpBefore}`, 8000);
    report.checks.guestSeesP1DamageViaSnapshot = guestSeesP1Damage;
    if (!guestSeesP1Damage) report.failures.push("Guest never saw P1 damage through snapshots.");

    // Host attacks: P1 light should damage P2 and the guest should see it.
    const hostP2HpBefore = await evaluate(host, "window.__platformArenaTest.state.enemy.hp");
    for (let i = 0; i < 6; i += 1) {
      await pressKey(host, "KeyJ");
      await delay(450);
    }
    const hostDamagedP2 = await waitFor(host, `window.__platformArenaTest.state.enemy.hp < ${hostP2HpBefore}`, 8000);
    report.checks.hostInputDamagesP2 = hostDamagedP2;
    if (!hostDamagedP2) report.failures.push("Host attacks never damaged P2 on the host.");
    const guestSeesP2Damage = await waitFor(guest, `window.__platformArenaTest.state.enemy.hp < ${hostP2HpBefore}`, 8000);
    report.checks.guestSeesP2DamageViaSnapshot = guestSeesP2Damage;
    if (!guestSeesP2Damage) report.failures.push("Guest never saw P2 damage through snapshots.");

    // Pause sync both ways.
    await pressKey(host, "KeyP");
    report.checks.pauseSyncsToGuest = await waitFor(guest, "window.__platformArenaTest.state.paused === true", 6000);
    if (!report.checks.pauseSyncsToGuest) report.failures.push("Host pause did not sync to the guest.");
    await pressKey(host, "KeyP");
    report.checks.unpauseSyncsToGuest = await waitFor(guest, "window.__platformArenaTest.state.paused === false", 6000);
    if (!report.checks.unpauseSyncsToGuest) report.failures.push("Host unpause did not sync to the guest.");

    // Rematch sync.
    await pressKey(host, "KeyR");
    report.checks.rematchSyncs =
      (await waitFor(host, "window.__platformArenaTest.state.player.hp === window.__platformArenaTest.state.player.maxHp", 6000)) &&
      (await waitFor(guest, "window.__platformArenaTest.state.player.hp === window.__platformArenaTest.state.player.maxHp", 6000));
    if (!report.checks.rematchSyncs) report.failures.push("Rematch did not reset both sides.");

    report.ok = report.failures.length === 0;
  } catch (error) {
    report.failures.push(error.message);
  } finally {
    try { host?.close(); } catch { /* closed */ }
    try { guest?.close(); } catch { /* closed */ }
    try { hostChrome?.kill(); } catch { /* gone */ }
    try { guestChrome?.kill(); } catch { /* gone */ }
    server.close();
    await delay(800);
    try { fs.rmSync(`${CHROME_PROFILE_BASE}-host`, { recursive: true, force: true }); } catch { /* Chrome may still hold the profile briefly */ }
    try { fs.rmSync(`${CHROME_PROFILE_BASE}-guest`, { recursive: true, force: true }); } catch { /* Chrome may still hold the profile briefly */ }
  }

  fs.mkdirSync(OUT_DIR, { recursive: true });
  fs.writeFileSync(REPORT_PATH, JSON.stringify(report, null, 2));
  console.log(JSON.stringify(report, null, 2));
  process.exit(report.ok ? 0 : 1);
}

run();
