# NGA Engine V2 online playtest — 2026-09-23

Public playtest: https://nogodsabove.netlify.app/

This is a separate Netlify site named `nogodsabove` (site ID `4bc048d7-e9cc-4eba-96f5-59ce01bb5f90`, production deploy `6ab407653e9b19603be36912`). The existing `no-gods-above` production site remains on the older game. The earlier V2 preview alias was `https://nga-v2-playtest--no-gods-above.netlify.app/` (deploy `6ab3efbb012c8e4da67cd8e3`).

The preview opens on the V2 title screen. Training and rounds lead to the three-character selector (Lamuh, Swahili, Celeste), then the Fallen Capital, Tribunal, or flat arena. Training supports local two-player keyboard control and CPU. Stocks remains visibly disabled. This link is an online-hosted local playtest; it is not network multiplayer.

Build the exact deploy folder from `NO_GODS_ABOVE/engine_v2`:

```powershell
npm run build:online-playtest
netlify deploy --site 4bc048d7-e9cc-4eba-96f5-59ce01bb5f90 --dir playtest_public --prod --json
```

The build performs TypeScript validation, compiles only the V2 versus page, stages only its runtime assets, converts deploy copies of Lamuh/Swahili frames to high-quality WebP and Celeste sheets to lossless WebP, and gives the changed script a fresh cache-safe URL. Lamuh's `movement-v2/idle-00.png` remains in the release because the select screen and HUD request that public URL directly; its optimized gameplay WebP copy is also present. Original sprite files and Fallen Capital PNGs remain unchanged. The published folder is about 185 MB versus the initial 583.8 MB package.

Verification: the dedicated build passed; local static title → mode → select → Lamuh/Swahili match and Celeste mirror match loaded without console errors. `versus_rounds_v1`, `celeste_integration`, and `fallen_capital_camera` tests passed. On the final `nogodsabove` site, root, Lamuh PNG/WebP, and select art returned HTTP 200. The live select showed Lamuh as P1, both Lamuh roster thumbnails, and Swahili as P2; the training match reached Fallen Capital with Lamuh's HUD portrait visible and no browser warnings or errors. First uncached fighter loading can still take noticeable time on a slow connection.

New Netlify Free projects show a Powered by Netlify badge in the lower-right corner. It overlaps part of the lower-right HUD at a 1280×720 viewport. The project setting remained enabled because the dashboard required a separate browser login; a CLI update attempt did not change it. Netlify documents the toggle at Project configuration → General → Powered by Netlify badge. This is a site appearance issue, not a game-asset failure.

Focused live results are recorded in `docs/online_playtest_smoke_report_2026-09-23.json`.

Release scope is the current V2 playtest from a shared dirty workspace. No broad repository staging, reset, commit, push, or deploy to the older `no-gods-above` production site was done. Do not promote this playtest as final character art or final balance approval.
