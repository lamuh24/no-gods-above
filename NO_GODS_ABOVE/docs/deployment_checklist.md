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

## Engine V2 guided tutorial release — 2026-09-25

This section applies to the separate Engine V2 site `nogodsabove` (`4bc048d7-e9cc-4eba-96f5-59ce01bb5f90`). The legacy `no-gods-above` site and its procedure above remain separate.

- Source: committed Engine V2 checkpoint `d556a847d508683b031de850e40eff67ad6f0d04`, which includes the guided tutorials and the later Paid in Full cinematic.
- Build from a clean worktree: `cd NO_GODS_ABOVE/engine_v2; npm.cmd run build:online-playtest`.
- Deploy folder: `NO_GODS_ABOVE/engine_v2/playtest_public` (928 staged files, about 185 MB). This contains `index.html`, `versus-playtest.html`, versioned CSS/JS, and referenced `assets/`, `celeste/`, `lamuh-legacy-v2/`, `stages/`, `swahili-paid-review/`, and `ui/` trees. Do not upload source or candidate art trees.
- Runtime paths stay relative to the site root. Staged text files were checked for local Windows paths, OneDrive, `file://`, and hidden test hook names. The CSS stock sigil resolves from staged `ui/online-stock/stock-sigil.webp`.
- Production command: `netlify.cmd deploy --site 4bc048d7-e9cc-4eba-96f5-59ce01bb5f90 --dir <absolute playtest_public path> --prod --json`.
- Production deploy: `6ab709bb4348cc43cbe751ec` at https://nogodsabove.netlify.app/. Live bundle: `playtest-index-B15KYYvF-optimized-4fe36694c38b.js`.
- Staged and live browser gates passed: Basics; ground chain, launcher, full air combo with air special for Lamuh, Swahili and Celeste; Swahili Paid cinematic for both players through natural completion and lethal stock timing; three public cards and loaded portraits; zero page errors, failed requests, local path requests, or hidden helper exposure.
- Known public issue: Netlify's new-site badge overlaps the lower-right HUD at 1280×720. Human keyboard feel review of tutorial wording/timing remains useful. This deployment did not merge draft GitHub PRs or change the legacy site.
- Detailed test receipt: `NO_GODS_ABOVE/docs/deployment_smoke_report.json`, key `engine_v2_tutorial_netlify_2026_09_25`.
