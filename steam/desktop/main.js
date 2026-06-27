const fs = require("fs");
const path = require("path");
const { app, BrowserWindow, Menu, shell } = require("electron");

function resolveGameIndex() {
  const appRoot = app.getAppPath();
  const candidates = [
    path.join(process.resourcesPath, "game", "index.html"),
    path.join(appRoot, "game", "index.html"),
    path.join(__dirname, "dist", "game", "index.html"),
    path.join(__dirname, "game", "index.html")
  ];

  const found = candidates.find((candidate) => fs.existsSync(candidate));
  if (!found) {
    throw new Error(
      "No staged game build found. Run `npm run stage:web` before launching the Steam shell."
    );
  }

  return found;
}

function createWindow() {
  Menu.setApplicationMenu(null);
  const isDevMode = !app.isPackaged || process.argv.includes("--dev");

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

  win.loadFile(resolveGameIndex());
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
