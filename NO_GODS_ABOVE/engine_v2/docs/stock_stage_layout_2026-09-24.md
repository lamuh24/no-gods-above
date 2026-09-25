# Fallen Capital stock-stage layout — 2026-09-24

The stock version of the Fallen Capital now uses the complete 36-world-unit floor from the regular 1v1 stage, with open ends at simulation x=-900 and x=900. Crossing the blast boundary (x=1170 or y=220) costs a stock. Rounds retain their original x=-420..420 walls and wall bounce.

Three semisolid raised stone landings use the same positions for combat and stage art: left (-335..-145, y=-72), center (-105..105, y=-122), and right (145..335, y=-72). Fighters can jump up through them, land while descending, jump from them, and walk off. Authored hop moves begin from the landing height in stock mode.

The 3D stage uses the exact same full-size paving, stone repeat density, and carved fascia as 1v1. Both modes use the same 18.4-world-unit camera distance at center. Stock camera tracking reaches either far ledge and zooms out when fighters split across the stage. The stock combat texture is 2700 pixels wide so fighters remain rendered at the far edges. The flat fallback draws the same three ledges. Original round-stage wall architecture, character assets, and animations were not replaced.

Verification: TypeScript build; `stock_mode_v1.test.js`, `versus_rounds_v1.test.js`, and `stage_pipeline.test.js` passed. Local and public browser smoke checks exercised raised landing, fall stock loss, and online host/guest movement and attack. Screenshots are in `docs/versus_playtest/captures/online-stocks-v1/`. The broader `validate_stage_contract.js` remains blocked by existing `sprite hash drift for walk_forward_contact`, unrelated to these stage edits.

The earlier 840-unit revision was published as deploy `6ab555ad07b647879559940a`. The full-size correction is live at `https://nogodsabove.netlify.app/` as deploy `6ab562814eee968a028b91ba` (stage-only bundle digest `9db3e56ac47a`). `scripts/patch_stock_fullstage_release.js` rebased the six stage changes onto the last verified public package, preserving unrelated unfinished character and wake-up work locally. File-hash comparison found 926 previous package files unchanged; only the two HTML entry points point to the new bundle.

The local and final public full-stage browser checks passed: 1v1/stock center camera distance both 18.4, both drop-off views, both far-end fighters visible at maximum zoom-out, stock loss after a fall, and no page errors. The final public two-browser online smoke also passed guest movement and attack. Review images are in `docs/versus_playtest/captures/stock-fullstage-v2/`.
