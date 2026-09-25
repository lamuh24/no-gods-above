#!/usr/bin/env node
/* Focused smoke for Local Phone Controller.
 * Opens a host game tab and a phone-controller tab, pairs them through PeerJS,
 * verifies P2 phone direction reaches the host, starts a local match, and
 * verifies the phone light attack starts a P2 action.
 */

const fs = require("fs");
const http = require("http");
const os = require("os");
const path = require("path");
const { spawn } = require("child_process");

const ROOT = path.resolve(__dirname, "..");
const OUT_DIR = path.join(ROOT, "docs");
const REPORT_PATH = path.join(OUT_DIR, "phone_controller_smoke_report.json");
const CHROME = "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";
const HOST_DEBUG_PORT = 9351;
const PHONE_DEBUG_PORT = 9352;
const CHROME_PROFILE_BASE = path.join(os.tmpdir(), `nga-phone-controller-smoke-${process.pid}`);

const MIME = {
  ".html": "text/html; charset=utf-8",
  ".js": "application/javascript; charset=utf-8",
  ".css": "text/css",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".json": "application/json; charset=utf-8",
  ".wav": "audio/wav",
  ".ogg": "audio/ogg",
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
    if (msg.method === "Runtime.consoleAPICalled" && msg.params.type === "error") {
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
  if (result.exceptionDetails) {
    const detail = result.exceptionDetails.exception?.description || result.exceptionDetails.text || "Evaluation failed";
    throw new Error(detail);
  }
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

async function tap(cdp, selector) {
  return evaluate(cdp, `(() => {
    const el = document.querySelector(${JSON.stringify(selector)});
    if (!el) throw new Error("Missing selector: ${selector}");
    el.dispatchEvent(new PointerEvent("pointerdown", { bubbles: true, pointerId: 1 }));
    el.dispatchEvent(new PointerEvent("pointerup", { bubbles: true, pointerId: 1 }));
    return true;
  })()`);
}

async function touchTap(cdp, selector) {
  const point = await evaluate(cdp, `(() => {
    const el = document.querySelector(${JSON.stringify(selector)});
    if (!el) throw new Error("Missing selector: ${selector}");
    const rect = el.getBoundingClientRect();
    const x = rect.left + rect.width / 2;
    const y = rect.top + rect.height / 2;
    const hit = document.elementFromPoint(x, y);
    return {
      x,
      y,
      text: el.textContent.trim(),
      hitText: hit?.textContent?.trim() || "",
      hitStrike: hit?.dataset?.strike || "",
      hitAction: hit?.dataset?.action || "",
      hitSpecial: hit?.hasAttribute?.("data-special") || false
    };
  })()`);
  await cdp.send("Input.dispatchTouchEvent", {
    type: "touchStart",
    touchPoints: [{ x: point.x, y: point.y, radiusX: 8, radiusY: 8, id: 7 }]
  });
  await delay(90);
  await cdp.send("Input.dispatchTouchEvent", {
    type: "touchEnd",
    touchPoints: []
  });
  await delay(120);
  return point;
}

async function resetP2Action(cdp) {
  return evaluate(cdp, `(() => {
    const s = window.__platformArenaTest.state;
    const p2 = s.enemy;
    p2.action = null;
    p2.activeMove = null;
    p2.actionTime = 0;
    p2.recovery = 0;
    p2.hasHit = false;
    p2.hitCount = 0;
    p2.grounded = true;
    p2.dead = false;
    return true;
  })()`);
}

async function expectPhoneMove(host, phone, selector, checkName, expectedPattern, failureText) {
  await resetP2Action(host);
  const touchPoint = await touchTap(phone, selector);
  const expression = `(() => {
    const move = window.__platformArenaTest.state.enemy.activeMove || "";
    return ${expectedPattern}.test(move);
  })()`;
  const passed = await waitFor(host, expression, 4000);
  const move = await evaluate(host, "window.__platformArenaTest.state.enemy.activeMove || ''");
  return { passed, move, checkName, failureText, touchPoint };
}

async function pointer(cdp, selector, type, pointerId = 2) {
  return evaluate(cdp, `(() => {
    const el = document.querySelector(${JSON.stringify(selector)});
    if (!el) throw new Error("Missing selector: ${selector}");
    el.dispatchEvent(new PointerEvent(${JSON.stringify(type)}, { bubbles: true, pointerId: ${pointerId} }));
    return true;
  })()`);
}

async function run() {
  const report = { ok: false, checks: {}, failures: [], hostErrors: [], phoneErrors: [] };
  const server = await serveStatic();
  const baseUrl = process.argv[2] || `http://127.0.0.1:${server.address().port}/index.html`;
  let hostChrome = null;
  let phoneChrome = null;
  let host = null;
  let phone = null;

  try {
    hostChrome = await launchChrome(HOST_DEBUG_PORT, "host");
    phoneChrome = await launchChrome(PHONE_DEBUG_PORT, "phone");
    host = await openTarget(HOST_DEBUG_PORT);
    phone = await openTarget(PHONE_DEBUG_PORT);
    await setupPage(host, report.hostErrors);
    await setupPage(phone, report.phoneErrors);
    await phone.send("Emulation.setDeviceMetricsOverride", {
      width: 844,
      height: 390,
      deviceScaleFactor: 2,
      mobile: true,
      screenOrientation: { type: "landscapePrimary", angle: 90 }
    });
    await phone.send("Emulation.setTouchEmulationEnabled", { enabled: true, maxTouchPoints: 5 });
    await navigate(host, baseUrl);

    report.checks.hostBooted = await waitFor(host, "Boolean(window.__platformArenaTest && window.__platformArenaTest.state.mode !== 'loading')", 30000);
    if (!report.checks.hostBooted) throw new Error("Host game did not boot.");
    report.checks.peerJsLoaded = await evaluate(host, "typeof Peer !== 'undefined'");
    if (!report.checks.peerJsLoaded) throw new Error("PeerJS did not load in host.");

    await evaluate(host, "document.getElementById('start-button').click(); true");
    await evaluate(host, "[...document.querySelectorAll('#mode-detail-actions button')].find((button) => button.textContent.trim() === 'Pair Phone').click(); true");
    report.checks.phoneRoomReady = await waitFor(host, "/^[A-Z0-9]{5}$/.test(document.getElementById('phone-controller-code').textContent)", 25000);
    if (!report.checks.phoneRoomReady) throw new Error("Phone controller room did not become ready.");
    const roomCode = await evaluate(host, "document.getElementById('phone-controller-code').textContent");
    report.checks.roomCode = roomCode;

    const controllerUrl = new URL(process.env.NGA_PHONE_CONTROLLER_URL || "controller.html", baseUrl);
    controllerUrl.searchParams.set("room", roomCode);
    report.checks.controllerUrl = controllerUrl.href;
    await navigate(phone, controllerUrl.href);
    report.checks.phoneLoaded = await waitFor(phone, "document.getElementById('status')?.textContent.length > 0", 10000);
    if (!report.checks.phoneLoaded) throw new Error("Phone controller page did not load.");
    report.checks.phoneConnected =
      (await waitFor(host, "document.getElementById('phone-controller-status').textContent.includes('connected')", 25000)) &&
      (await waitFor(phone, "document.getElementById('status').textContent.includes('ready') || document.getElementById('status').textContent.includes('Connected')", 10000));
    if (!report.checks.phoneConnected) throw new Error("Phone controller did not connect.");

    await pointer(phone, "[data-dir='2']", "pointerdown", 3);
    report.checks.directionReachedHost = await waitFor(host, "window.__platformArenaTest.state.phoneKeys.has('ArrowRight') && window.__platformArenaTest.state.keys.has('ArrowRight')", 5000);
    await pointer(phone, "[data-dir='2']", "pointerup", 3);
    report.checks.directionMaskCleared = await waitFor(host, "window.__platformArenaTest.state.phoneKeys.size === 0 && !window.__platformArenaTest.state.keys.has('ArrowRight')", 5000);
    if (!report.checks.directionReachedHost) report.failures.push("Phone direction key never reached host while held.");
    if (!report.checks.directionMaskCleared) report.failures.push("Phone direction key did not clear after release.");

    await evaluate(host, "window.__platformArenaTest.startMatch('kairo', 'vanta', 'platform_test'); true");
    report.checks.localMatchStarted = await waitFor(host, "window.__platformArenaTest.state.mode === 'versus' && window.__platformArenaTest.state.enemy?.profile?.id === 'vanta'", 12000);
    if (!report.checks.localMatchStarted) throw new Error("Local versus match did not start.");
    await evaluate(host, "(() => { const api = window.__platformArenaTest; api.setPosition('p1', 620, 590, true); api.setPosition('p2', 735, 590, true); const s = api.state; s.enemy.facing = -1; s.enemy.action = null; s.enemy.activeMove = null; return true; })()");
    const buttonChecks = [
      await expectPhoneMove(host, phone, "[data-strike='light']", "phoneLightStartedP2", /light/, "Phone light button did not start a P2 light action."),
      await expectPhoneMove(host, phone, "[data-strike='medium']", "phoneMediumStartedP2", /medium/, "Phone medium button did not start a P2 medium action."),
      await expectPhoneMove(host, phone, "[data-strike='heavy']", "phoneHeavyStartedP2", /heavy|forward_heavy/, "Phone heavy button did not start a P2 heavy action."),
      await expectPhoneMove(host, phone, "[data-special]", "phoneSpecialStartedP2", /special/, "Phone special button did not start a P2 special action.")
    ];
    for (const check of buttonChecks) {
      report.checks[check.checkName] = check.passed;
      report.checks[`${check.checkName}Move`] = check.move;
      report.checks[`${check.checkName}TouchPoint`] = check.touchPoint;
      if (!check.passed) report.failures.push(`${check.failureText} Last move: ${check.move || "(none)"}`);
    }
    report.checks.phoneAttackStartedP2 = buttonChecks.every((check) => check.passed);

    report.ok = report.failures.length === 0;
  } catch (error) {
    report.failures.push(error.message);
  } finally {
    try { host?.close(); } catch { /* closed */ }
    try { phone?.close(); } catch { /* closed */ }
    try { hostChrome?.kill(); } catch { /* gone */ }
    try { phoneChrome?.kill(); } catch { /* gone */ }
    server.close();
    await delay(800);
    try { fs.rmSync(`${CHROME_PROFILE_BASE}-host`, { recursive: true, force: true }); } catch { /* Chrome may still hold profile */ }
    try { fs.rmSync(`${CHROME_PROFILE_BASE}-phone`, { recursive: true, force: true }); } catch { /* Chrome may still hold profile */ }
  }

  fs.mkdirSync(OUT_DIR, { recursive: true });
  fs.writeFileSync(REPORT_PATH, JSON.stringify(report, null, 2));
  console.log(JSON.stringify(report, null, 2));
  process.exit(report.ok ? 0 : 1);
}

run();
