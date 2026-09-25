## 2026-09-14 - Generated NGA V2 menu flow

- Built local title -> mode select -> character select -> training arena flow in new versus/frontEnd.ts and frontEnd.css; main.ts retains autostart and character review deep links and routes match return to new character select.
- Generated three text-free1672x941 backgrounds using built-in image_gen: title broken crown/capital, character cathedral hall, mode three-door chamber. Runtime copies: engine_v2/public/ui/front-end/{title,select,modes}-v1.png. Prompts, inventory/hashes and screenshots under engine_v2/docs/front-end-v1.
- Training works with current Lamuh/Swahili roster, mirrored selections, arena choice and CPU/debug options. Rounds and Stocks cards explicitly disabled/in development; their previously requested gameplay remains pending. No fabricated fighters or controller support; uses approved existing sprite art.
- Skills: imagegen, nga-engine-v2 and UI asset pack integration, with existing visual rules. Independent CSS review corrected title760layout, inherited blue names/yellow Fightbutton. Build passed; focused menu navigation/browser evidence recorded in docs/front-end-v1/qa.json after final run.
- Local preview only; no commit/push/deploy. Unrelated character animation/core work preserved. Obsidian note retained in .agent-sync-pending for later vault sync.


Preview: http://127.0.0.1:4175/versus-playtest.html

Sources classified DIRECT_USE as full-bleed opaque environment backgrounds; typography and controls are native HTML. Missing backgrounds leave a readable dark fallback. No alpha extraction required. Built-in generator outputs retained under Codex generated_images; final copies live in workspace.
