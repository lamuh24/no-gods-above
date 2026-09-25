# No Gods Above Steam Upload README

This folder is the Steam release workspace for the Windows demo/playtest build.
It wraps the existing browser game in Electron and stages the packaged app for
SteamPipe. It does not replace or rewrite the core game.

## Current Project Shape

- Game entry point: `NO_GODS_ABOVE/index.html`
- Runtime code: `NO_GODS_ABOVE/game.js`
- Styles: `NO_GODS_ABOVE/style.css`
- Runtime assets: `NO_GODS_ABOVE/assets/`
- Static web staging: `_stage_deploy.ps1`
- Desktop wrapper: `steam/desktop/main.js`
- Electron package scripts: `steam/desktop/package.json`
- Steam release content output: `steam_release/content/NoGodsAbove/`

The game itself has no bundler. It is a static HTML/CSS/JavaScript Canvas game.
The Steam build uses Electron only as a desktop shell.

## First-Time Setup

From the repository root:

```powershell
npm install --prefix steam/desktop
```

This installs Electron, electron-builder, and a local PeerJS browser bundle for
the packaged desktop build.

## Electron Builder Configuration

The Electron Builder config lives in `steam/desktop/package.json` under the
`build` field.

- `appId`: `com.nogodsabove.game`
- `productName`: `No Gods Above`
- `executableName`: `NoGodsAbove`
- `directories.output`: `release`
- Windows target: unpacked `dir`
- App icon: `steam/desktop/build/icon.ico`
- NSIS installer, uninstaller, and one-click header icon: `steam/desktop/build/icon.ico`
- `asar`: enabled for the Electron shell
- Staged game files: copied loose as `extraResources/game/` so `index.html`,
  `game.js`, `style.css`, `assets/`, `vendor/peerjs.min.js`, and
  `build_info.json` stay normal files in the Steam package.

The current `.ico` is a documented placeholder. Replace it with final brand art
before Steam review.

## Local Desktop Smoke

```powershell
npm run dev
```

This stages the static web game into `steam/desktop/dist/game/` and opens it in
the Electron wrapper. Use `F11` to toggle fullscreen. `Esc` exits fullscreen.

## Build The Windows Demo

```powershell
npm run package:win
```

This command:

1. Installs desktop dependencies if needed.
2. Stages the existing web game.
3. Writes build metadata.
4. Builds a Windows unpacked Electron app.
5. Copies it to `steam_release/content/NoGodsAbove/`.

Steam launch executable:

```text
NoGodsAbove.exe
```

The staged package should contain Electron runtime files plus:

```text
resources/app.asar
resources/game/
```

It should not contain `resources/app/node_modules/`, build scripts, Steam
credentials, Steam Guard tokens, or private notes.

## Stage Existing Package Only

If the Electron package already exists and you only need to refresh the Steam
content folder:

```powershell
npm run steam:stage
```

## SteamPipe Upload

Replace all placeholder values in:

- `steam_release/scripts/app_build_PLACEHOLDER.vdf`
- `steam_release/scripts/depot_build_PLACEHOLDER.vdf`

Do not commit real Steam App IDs, Depot IDs, account names, passwords, or Steam
Guard tokens. Upload from the Steamworks SDK ContentBuilder tools, for example:

```powershell
steamcmd.exe +login <steamworks-user> +run_app_build "C:\path\to\repo\steam_release\scripts\app_build_PLACEHOLDER.vdf" +quit
```

Use Preview mode first in Steamworks before setting a build live.

Before upload:

1. Replace placeholder Steam App ID and Depot ID values.
2. Confirm Steam launch option points to `NoGodsAbove.exe`.
3. Run a clean packaged-exe QA pass on Windows.
4. Verify Steam overlay behavior from Steamworks.
5. Upload with Preview first, then assign the build to a branch only after QA.

## Offline Notes

Local Versus, Training, and the packaged local assets run from disk inside
Electron. The desktop staging script replaces the public CDN PeerJS script with a
local `vendor/peerjs.min.js` copy when dependencies are installed. Online Versus
still needs network access to PeerJS signaling and the opponent.
