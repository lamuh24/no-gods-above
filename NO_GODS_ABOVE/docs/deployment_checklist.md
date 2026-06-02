# No Gods Above Deployment Checklist

## Local Run

From the repository root:

```powershell
cd NO_GODS_ABOVE
python -m http.server 8000
```

Open:

```text
http://127.0.0.1:8000/index.html
```

The game is a static browser build. A simple static host is enough as long as all folders below are deployed with the HTML/CSS/JS files.

## Pre-Deploy Validation

Run these checks before uploading a public/demo build:

```powershell
node --check NO_GODS_ABOVE/game.js
git diff --check
```

Then smoke test public mode without `?lamuhTest` or `?serisTest`:

- Title screen loads with the title background.
- Character select opens.
- Six character cards appear: Kairo, Vanta, Nyx, Sol, Seris, and LAMUH.
- Portraits load for every public character.
- P1/P2 local versus selection works.
- Match starts.
- P1 can damage P2.
- P2 can damage P1.
- KO/win overlay appears.
- Rematch works.
- Return to select works.
- Pause/help overlay works.
- LAMUH loads and can use directional specials.
- Seris loads.
- No console errors.
- No failed asset requests.
- No Seris Sheet 8 or Seris regular gameplay effects requests.
- Public mode does not expose `window.__lamuhHiddenTest` or `window.__serisHiddenTest`.

## Required Deploy Files

Deploy the full `NO_GODS_ABOVE` folder contents, including:

- `index.html`
- `style.css`
- `game.js`
- `assets/backgrounds/`
- `assets/effects/`
- `assets/sprites/`
- `assets/ui/`
- `docs/` if public documentation should travel with the build

Do not deploy only the HTML/CSS/JS files; the game depends on relative asset paths.

## Runtime Asset Rules

- Runtime paths must remain relative, such as `assets/sprites/...`.
- Do not use local `C:/`, OneDrive, Downloads, `file://`, or machine-specific paths.
- Missing/future planning assets should not be wired into runtime.
- Query strings are acceptable for cache busting, but the target file before `?` must exist.
- Seris Sheet 8 regular gameplay VFX must remain disabled unless a later pass explicitly approves it.

## Known Acceptable Demo Issues

- LAMUH's Crown of No Gods ultimate is playable but still prototype/cinematic-in-progress.
- Some LAMUH regular gold/cyan VFX are intentionally disabled because they looked pasted on; Celestial Palm remains active and Divine Vanish keeps its purple phase identity.
- The UI is custom-asset-enabled but still has room for deeper polish.
- Balance is accepted for demo, not final competitive tuning.

## Not Yet Done

- Controller support.
- Online multiplayer.
- Full Crown of No Gods cinematic polish.
- LAMUH transformation/install mode.
- Deeper UI polish and final UI art pass.
- Final VFX replacement for Ascend Step, Heaven Splitter, and Radiant Dive.
