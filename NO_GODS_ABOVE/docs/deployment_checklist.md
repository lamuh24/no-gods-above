# No Gods Above Deployment Checklist

## Live Hosting (Netlify)

First production deploy: 2026-06-09 (Claude Code session).

- Host: Netlify, team `lamuh24's team` (account nownotlaterinc@gmail.com)
- Site name: `no-gods-above`, project id `7954ab3d-7c2c-4533-ba61-3de081d568c3`
- Production URL: https://no-gods-above.netlify.app
- Admin dashboard: https://app.netlify.com/projects/no-gods-above

Deploy procedure (staged, NOT the full folder — see "Required Deploy Files"):

Cross-platform staging works anywhere Node is available:

```bash
# from repo root; rebuilds /tmp/nga_deploy unless a custom path is passed
node scripts/stage_deploy.js /tmp/nga_deploy
npx netlify deploy --prod --dir /tmp/nga_deploy --site 7954ab3d-7c2c-4533-ba61-3de081d568c3
```

Windows PowerShell staging is also kept for the owner's Windows workstation:

```powershell
# from repo root; rebuilds %TEMP%\nga_deploy with only runtime files
powershell -ExecutionPolicy Bypass -File .\_stage_deploy.ps1
npx netlify deploy --prod --dir "$env:TEMP\nga_deploy" --site 7954ab3d-7c2c-4533-ba61-3de081d568c3
```

Note: `--site` must be the project id; the site name is not accepted by the CLI. The CLI also requires a Netlify login/token with access to the project; if it says `Unauthorized: could not retrieve project`, log in as the owning Netlify account or export a valid `NETLIFY_AUTH_TOKEN`.

## Local Run

From the repository root:

```powershell
cd NO_GODS_ABOVE
python -m http.server 8000
```

Open locally on the same machine:

```text
http://127.0.0.1:8000/index.html
```

For same-Wi-Fi testing on another phone/tablet/computer, bind the server to all interfaces and use the host computer's LAN IP address:

```bash
cd NO_GODS_ABOVE
python -m http.server 8000 --bind 0.0.0.0
# then open http://<host-lan-ip>:8000/index.html from the other device
```

Public cross-device access should use the production Netlify URL, not a localhost URL:

```text
https://no-gods-above.netlify.app/
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
- Mode selection opens from the title screen.
- Character selection opens after choosing Local Versus or Training Dummy.
- Arena selection opens after fighter lock-in.
- Eight character cards appear: Kairo, Vanta, Nyx, Sol, Seris, LAMUH, LAMUH Legacy, and Celeste.
- Portraits load for every public character.
- P1/P2 local versus selection works through Mode -> Fighters -> Arena.
- Training selection works through Mode -> Fighter -> Arena.
- Online host/guest selection works through Host/Join -> Fighters -> Arena.
- Eclipse Rooftop appears in Stage Select.
- Eclipse Rooftop preview uses `assets/stages/eclipse_rooftop/07_stage_select_card_16x9.png`.
- Eclipse Rooftop match loads with far background, midground, main platform, side platforms, and foreground layer.
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
- All seven production Eclipse Rooftop stage assets:
  - `assets/stages/eclipse_rooftop/01_far_background_16x9.png`
  - `assets/stages/eclipse_rooftop/02_midground_layer_transparent.png`
  - `assets/stages/eclipse_rooftop/03_main_platform_transparent.png`
  - `assets/stages/eclipse_rooftop/04_side_platform_left_transparent.png`
  - `assets/stages/eclipse_rooftop/05_side_platform_right_transparent.png`
  - `assets/stages/eclipse_rooftop/06_foreground_layer_transparent.png`
  - `assets/stages/eclipse_rooftop/07_stage_select_card_16x9.png`

`scripts/stage_deploy.js` and `_stage_deploy.ps1` in the repo root automate this (114 assets + 3 root
files, ~220.2 MB as of 2026-07-11). `game.js` has no runtime `fetch()` calls,
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
- Eclipse Rooftop must use the supplied seven-file production asset pack. Do not restore the generated placeholder `eclipse_rooftop_background.png` or `eclipse_rooftop_preview.png`.

## Known Acceptable Demo Issues

- LAMUH's Crown of No Gods ultimate is playable but still prototype/cinematic-in-progress.
- Some LAMUH regular gold/cyan VFX are intentionally disabled because they looked pasted on; Celestial Palm remains active and Divine Vanish keeps its purple phase identity.
- Online multiplayer is Phase 1 host-authoritative PeerJS netplay; deeper rollback/lockstep netcode is deferred.
- The UI is custom-asset-enabled but still has room for deeper polish.
- Balance is accepted for demo, not final competitive tuning.

## Not Yet Done

- Full Crown of No Gods cinematic polish.
- LAMUH transformation/install mode.
- Deeper UI polish and final UI art pass.
- Final VFX replacement for Ascend Step, Heaven Splitter, and Radiant Dive.
