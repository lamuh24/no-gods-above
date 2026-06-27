const { contextBridge } = require("electron");

contextBridge.exposeInMainWorld("ngaDesktop", {
  platform: "steam",
  shell: "electron",
  buildType: "Steam Demo / Playtest",
  version: "0.1.0-steam-demo",
  fullscreenToggle: "F11"
});
