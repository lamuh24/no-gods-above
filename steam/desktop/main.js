const fs = require("fs");
const http = require("http");
const os = require("os");
const path = require("path");
const { app, BrowserWindow, Menu, shell } = require("electron");

let controllerServer = null;
let controllerUrl = null;
let controllerUrls = [];

function resolveGameRoot() {
  const appRoot = app.getAppPath();
  const candidates = [
    path.join(process.resourcesPath, "game"),
    path.join(appRoot, "game"),
    path.join(__dirname, "dist", "game"),
    path.join(__dirname, "game")
  ];

  const found = candidates.find((candidate) => fs.existsSync(path.join(candidate, "index.html")));
  if (!found) {
    throw new Error(
      "No staged game build found. Run `npm run stage:web` before launching the Steam shell."
    );
  }

  return found;
}

function resolveGameIndex(gameRoot) {
  return path.join(gameRoot || resolveGameRoot(), "index.html");
}

function getLanAddresses() {
  const interfaces = os.networkInterfaces();
  const candidates = [];
  for (const [name, entries] of Object.entries(interfaces)) {
    if (/virtual|vmware|vbox|docker|wsl|loopback|npcap|bluetooth/i.test(name)) continue;
    for (const entry of entries || []) {
      if (entry.family !== "IPv4" || entry.internal) continue;
      const address = entry.address;
      const privateLan = /^(192\.168\.|10\.|172\.(1[6-9]|2\d|3[0-1])\.)/.test(address);
      candidates.push({ address, score: privateLan ? 0 : 1 });
    }
  }
  return candidates
    .sort((a, b) => a.score - b.score || a.address.localeCompare(b.address))
    .map((entry) => entry.address);
}

function getMimeType(filePath) {
  const ext = path.extname(filePath).toLowerCase();
  return {
    ".css": "text/css; charset=utf-8",
    ".html": "text/html; charset=utf-8",
    ".js": "application/javascript; charset=utf-8",
    ".json": "application/json; charset=utf-8",
    ".png": "image/png",
    ".jpg": "image/jpeg",
    ".jpeg": "image/jpeg",
    ".webp": "image/webp",
    ".gif": "image/gif",
    ".wav": "audio/wav",
    ".ogg": "audio/ogg",
    ".mp3": "audio/mpeg"
  }[ext] || "application/octet-stream";
}

function startControllerServer(gameRoot) {
  return new Promise((resolve) => {
    const root = path.resolve(gameRoot);
    controllerServer = http.createServer((req, res) => {
      if (!["GET", "HEAD"].includes(req.method)) {
        res.writeHead(405);
        res.end();
        return;
      }

      let pathname = "controller.html";
      try {
        pathname = decodeURIComponent(new URL(req.url, "http://localhost").pathname.replace(/^\/+/, "")) || "controller.html";
      } catch {
        pathname = "controller.html";
      }

      const target = path.resolve(root, pathname);
      if (!target.startsWith(root + path.sep) && target !== root) {
        res.writeHead(403);
        res.end("Forbidden");
        return;
      }

      fs.readFile(target, (err, data) => {
        if (err) {
          res.writeHead(404);
          res.end("Not found");
          return;
        }
        res.writeHead(200, {
          "Content-Type": getMimeType(target),
          "Cache-Control": "no-store"
        });
        if (req.method === "HEAD") res.end();
        else res.end(data);
      });
    });

    controllerServer.on("error", () => {
      controllerServer = null;
      controllerUrl = null;
      controllerUrls = [];
      resolve(null);
    });
    controllerServer.listen(0, "0.0.0.0", () => {
      const address = controllerServer.address();
      const lanAddresses = getLanAddresses();
      controllerUrls = lanAddresses.map((lanAddress) => `http://${lanAddress}:${address.port}/controller.html`);
      controllerUrl = controllerUrls[0] || `http://127.0.0.1:${address.port}/controller.html`;
      resolve(controllerUrl);
    });
  });
}

async function createWindow() {
  Menu.setApplicationMenu(null);
  const isDevMode = !app.isPackaged || process.argv.includes("--dev");
  const gameRoot = resolveGameRoot();
  await startControllerServer(gameRoot);

  const win = new BrowserWindow({
    width: 1280,
    height: 720,
    minWidth: 960,
    minHeight: 540,
    fullscreenable: true,
    backgroundColor: "#050305",
    show: false,
    autoHideMenuBar: true,
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      additionalArguments: controllerUrl
        ? [
            `--nga-controller-url=${encodeURIComponent(controllerUrl)}`,
            `--nga-controller-urls=${encodeURIComponent(JSON.stringify(controllerUrls))}`
          ]
        : [],
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
      backgroundThrottling: false,
      devTools: isDevMode
    }
  });

  win.once("ready-to-show", () => {
    win.show();
  });

  win.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url);
    return { action: "deny" };
  });

  win.webContents.on("will-navigate", (event, url) => {
    if (!url.startsWith("file://")) {
      event.preventDefault();
      shell.openExternal(url);
    }
  });

  win.webContents.on("before-input-event", (event, input) => {
    const isKeyDown = input.type === "keyDown";
    if (isKeyDown && input.key === "F11") {
      win.setFullScreen(!win.isFullScreen());
      event.preventDefault();
      return;
    }

    if (isKeyDown && input.key === "Escape" && win.isFullScreen()) {
      win.setFullScreen(false);
      event.preventDefault();
      return;
    }

    if (!isDevMode && isKeyDown && (input.key === "F12" || (input.control && input.shift && input.key.toLowerCase() === "i"))) {
      event.preventDefault();
    }
  });

  if (!isDevMode) {
    win.webContents.on("devtools-opened", () => {
      win.webContents.closeDevTools();
    });
  }

  const loadOptions = controllerUrl
    ? { query: { ngaControllerUrl: controllerUrl, ngaControllerUrls: JSON.stringify(controllerUrls) } }
    : undefined;
  win.loadFile(resolveGameIndex(gameRoot), loadOptions);
}

app.whenReady().then(createWindow);

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});

app.on("activate", () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});

app.on("before-quit", () => {
  try {
    controllerServer?.close();
  } catch { /* already closed */ }
});
