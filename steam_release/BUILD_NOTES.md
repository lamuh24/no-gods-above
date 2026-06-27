# No Gods Above Steam Build Notes

## Build Identity

- Game name: No Gods Above
- Build type: Steam Demo / Playtest
- Version: `0.1.0-steam-demo`
- Target platform: Windows
- Desktop wrapper: Electron
- Launch executable: `NoGodsAbove.exe`
- Electron Builder config: `steam/desktop/package.json`

## Runtime Summary

No Gods Above is currently a browser-based fighting game built with plain
HTML, CSS, JavaScript, and Canvas. The active playable entry point is
`NO_GODS_ABOVE/index.html`, which loads `style.css`, `game.js`, and relative
assets from `NO_GODS_ABOVE/assets/`.

There is no game bundler in the active runtime. `tools/nga-forge/frontend` has a
separate Vite package for Forge tooling, but the playable game does not depend
on it.

## Desktop Wrapper

The Electron wrapper lives in `steam/desktop/`.

- Opens the staged local game file.
- Starts windowed at 1280x720.
- Supports fullscreen toggle with `F11`.
- Exits fullscreen with `Esc`.
- Removes browser menu chrome.
- Disables production DevTools shortcuts in packaged builds.
- Blocks non-file navigation from replacing the game window.
- Uses `process.resourcesPath/game/index.html` in packaged builds and
  `steam/desktop/dist/game/index.html` for local dev.

## Electron Builder Config

Current values:

- `appId`: `com.nogodsabove.game`
- `productName`: `No Gods Above`
- `executableName`: `NoGodsAbove`
- `directories.output`: `release`
- `win.target`: `dir`
- `win.icon`: `build/icon.ico`
- `nsis.installerIcon`: `build/icon.ico`
- `nsis.uninstallerIcon`: `build/icon.ico`
- `nsis.installerHeaderIcon`: `build/icon.ico`
- `asar`: `true`
- `files`: Electron shell only (`main.js`, `preload.js`, `package.json`)
- `extraResources`: staged web game copied as loose `resources/game/`

## Icon Requirements

The current `steam/desktop/build/icon.ico` is a placeholder NGA icon because no
real Windows `.ico` existed in the repo. Replace it before Steam review if final
brand art is available.

Recommended final icon:

- Square source art at 1024x1024 or larger.
- Readable silhouette or logo at 16x16.
- Multi-size `.ico` containing 256, 128, 64, 48, 32, and 16 pixel entries.
- Same icon may be reused for app, installer, uninstaller, and one-click
  installer header icon unless a final installer-specific design is produced.

## Asar Strategy

Asar is enabled for the small Electron shell to remove the previous
electron-builder warning and keep app code tidy. The game runtime is deliberately
not placed inside `app.asar`; it is copied as loose `extraResources` under
`resources/game/`.

Reason: `NO_GODS_ABOVE/index.html`, `game.js`, and `style.css` load many
relative `assets/...` files through browser file URLs. Keeping the staged web
runtime loose avoids introducing asar URL/path risk and makes Steam depot
inspection straightforward.

## Save And Settings Handling

The current runtime scan found no `localStorage`, `sessionStorage`, or IndexedDB
usage in `NO_GODS_ABOVE/game.js` or `NO_GODS_ABOVE/index.html`. There is no
persistent save/progress layer to migrate yet.

Electron will support browser storage APIs if they are added later. Steam Cloud
should wait until save data exists and a stable save path/schema is chosen.

## Input Readiness

Keyboard input is implemented for P1 and P2 local versus.

- P1: WASD movement, Shift dash, J/K/L attacks, U special modifier, I+O ultimate.
- P2: Arrow keys movement, double-tap dash, Numpad 1/2/3 attacks, Numpad 4/5/6 specials, Numpad 0 ultimate.

Gamepad support already exists through the browser Gamepad API and is documented
in `NO_GODS_ABOVE/docs/controller_support.md`. It supports local controller
assignment, menu navigation, attacks, specials, dash, and ultimate. Steam Input
action sets and glyphs are still TODO.

## Offline Readiness

The packaged Electron app runs local modes from disk using staged relative
assets. The desktop staging script copies PeerJS locally from the installed npm
package and rewrites the staged HTML to avoid a CDN dependency in Electron.
Online Versus still requires network access for signaling and peer connection.

## Warnings

Fixed in this cleanup:

- Default Electron icon warning: fixed by `build/icon.ico`.
- `asar` disabled warning: fixed by enabling asar for the Electron shell.
- Missing package author warning: fixed with package metadata.

Remaining expected warnings:

- npm may still print deprecation warnings from transitive Electron/electron-builder
  dependencies. These are upstream dependency notices; verify with `npm audit`.
- The icon is still placeholder art, not final Steam brand art.

## Known Release Prep Boundaries

- No gameplay mechanics were rewritten for this packaging layer.
- No character assets or animation manifests were removed.
- Steam App ID and Depot ID are placeholders until assigned in Steamworks.
- Steam Cloud, achievements, overlay validation, and Steam Input polish remain
release TODOs.
