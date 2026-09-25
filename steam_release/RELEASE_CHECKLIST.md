# No Gods Above Release Checklist

Build target: Windows Steam Demo / Playtest `0.1.0-steam-demo`

## Packaging

- [ ] `npm install --prefix steam/desktop` completed.
- [ ] `npm run build` stages `steam/desktop/dist/game/`.
- [ ] `npm run package:win` creates `steam/desktop/release/win-unpacked/`.
- [ ] `npm run steam:stage` creates `steam_release/content/NoGodsAbove/`.
- [ ] `steam_release/content/NoGodsAbove/NoGodsAbove.exe` exists.
- [ ] `steam_release/BUILD_METADATA.json` has game name, build type, version, date, and commit hash.
- [ ] `resources/app.asar` exists in the staged package.
- [ ] `resources/game/` exists in the staged package.
- [ ] `resources/app/node_modules/` is not present in the staged package.
- [ ] `NoGodsAbove.exe` uses `steam/desktop/build/icon.ico`, not the default Electron icon.
- [ ] Final brand `.ico` has replaced the placeholder icon before Steam review.

## Launch QA

- [ ] Launches from packaged exe.
- [ ] No missing assets.
- [ ] No console-breaking errors.
- [ ] Main menu works.
- [ ] Local Versus works.
- [ ] Player 1 controls work.
- [ ] Player 2 controls work.
- [ ] Lamuh loads correctly.
- [ ] Sable loads if included in the build.
- [ ] Stage loads.
- [ ] Audio works if audio assets are enabled.
- [ ] Fullscreen works with `F11`.
- [ ] `Esc` exits fullscreen.
- [ ] Windowed mode works.
- [ ] Restart match works.
- [ ] Quit game works.
- [ ] Build version is documented in `BUILD_METADATA.json` and packaged `game/build_info.json`.
- [ ] Clean install test works on a Windows machine without repo files.
- [ ] Steam folder does not contain source scripts, credentials, private notes, or generated VDF smoke files.
- [ ] `npm audit --prefix steam/desktop` reports no vulnerabilities.

## Steam TODOs

- [ ] Replace Steam App ID placeholder.
- [ ] Replace Steam Depot ID placeholder.
- [ ] Replace Steam username placeholder in local upload command only.
- [ ] Steam overlay test.
- [ ] Achievements design and implementation.
- [ ] Steam Cloud save plan.
- [ ] Controller glyphs and Steam Input action set.
- [ ] Store capsule art.
- [ ] Trailer.
- [ ] Screenshots.
- [ ] Steam review branch smoke.
