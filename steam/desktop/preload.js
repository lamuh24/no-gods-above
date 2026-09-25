const { contextBridge } = require("electron");

const controllerUrlArg = process.argv.find((arg) => arg.startsWith("--nga-controller-url="));
const controllerUrl = controllerUrlArg
  ? decodeURIComponent(controllerUrlArg.slice("--nga-controller-url=".length))
  : null;
const controllerUrlsArg = process.argv.find((arg) => arg.startsWith("--nga-controller-urls="));
let controllerUrls = controllerUrl ? [controllerUrl] : [];
if (controllerUrlsArg) {
  try {
    const parsed = JSON.parse(decodeURIComponent(controllerUrlsArg.slice("--nga-controller-urls=".length)));
    if (Array.isArray(parsed)) controllerUrls = parsed;
  } catch {
    controllerUrls = controllerUrl ? [controllerUrl] : [];
  }
}

contextBridge.exposeInMainWorld("ngaDesktop", {
  platform: "steam",
  shell: "electron",
  buildType: "Steam Demo / Playtest",
  version: "0.1.0-steam-demo",
  fullscreenToggle: "F11",
  controllerUrl,
  controllerUrls
});
