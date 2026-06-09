# No Gods Above Deployment Checklist

## Live Hosting (Netlify)

First production deploy: 2026-06-09 (Claude Code session).

- Host: Netlify, team `lamuh24's team` (account nownotlaterinc@gmail.com)
- Site name: `no-gods-above`, project id `7954ab3d-7c2c-4533-ba61-3de081d568c3`
- Production URL: https://no-gods-above.netlify.app
- Admin dashboard: https://app.netlify.com/projects/no-gods-above

Deploy procedure (staged, NOT the full folder — see "Required Deploy Files"):

```powershell
# from repo root; rebuilds %TEMP%\nga_deploy with only runtime files
powershell -ExecutionPolicy Bypass -File .\_stage_deploy.ps1
npx netlify deploy --prod --dir "$env:TEMP\nga_deploy" --site 7954ab3d-7c2c-4533-ba61-3de081d568c3
```

Note: `--site` must be the project id; the site name is not accepted by the CLI.

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

The full `NO_GODS_ABOVE` folder is ~1.46 GB (source packs, references, generated
candidates, verify screenshots). Do NOT upload it wholesale. Deploy a staged
folder containing only runtime files:

- `index.html`, `style.css`, `game.js`
- Every `assets/...` string literal referenced in `game.js` and `index.html`
  (strip `?v=` cache keys when resolving files on disk)
- Every `url("assets/...")` referenced in `style.css` (HUD frames, select
  screen, overlays, menu buttons)
- All of `assets/sprites/portraits/` (loaded via dynamic
  `assets/sprites/portraits/${id}_select.png` template)

`_stage_deploy.ps1` in the repo root automates this (101 assets + 3 root
files, ~207 MB as of 2026-06-09). `game.js` has no runtime `fetch()` calls,
so string-literal extraction plus the portraits folder is complete coverage.

Do not deploy only the HTML/CSS/JS files; the game depends on relative asset paths.

## External Runtime Dependencies

- `index.html` loads PeerJS from `https://unpkg.com/peerjs@1.5.4/dist/peerjs.min.js` for Online Versus.
- Online Versus uses the free PeerJS public signaling cloud; no server-side deploy pieces are required.
- If unpkg or the PeerJS cloud is unreachable, local play is unaffected; the online menu shows an error status.

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
