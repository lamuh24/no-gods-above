# The Fallen Capital — NGA V2 implementation

The user approved the concept and requested the build on 2026-09-13. The stage is now implemented in the local V2 versus playtest and is the default arena in character select. Existing Tribunal and training-grid routes remain available. This is not deployed.

Open: http://127.0.0.1:4175/versus-playtest.html?arena=fallen-capital&autostart=1

## Edge finish follow-up — 2026-09-13

User requested the fully zoomed-out lower edge match the finished top. Replaced the plain dark slab/rib band with a new carved gothic masonry texture on all four vertical foundation faces, proportioned repeat mapping for side returns, and physical textured coping below floor zero. Peripheral rubble now uses the existing paving material. No camera, floor level, collision or combat changes. The new asset is `public/stages/fallen-capital/fascia.png`; prompt and source hash/dimensions are under `edge-polish/`.

Build and all288 camera projections pass. Independent extreme-view captures and review are in `edge-polish/QA.json` and `edge-polish/QA.md`; these supersede the original plain-edge/flat-rubble visual checkpoint below. No deployment.

## What was built

- A continuous textured 3D ash-stone floor at simulation ground zero with subdued brass inlay, physical recessed boundary piers at world X -8.4/+8.4, painted ornate pier facades, a separate fallen crowned head, and a distant capital/halo painting.
- Separate background, head, stone and pier textures, plus the approved stage-select image. Transparent head/pier PNGs retain real alpha. Dimensions and SHA256 hashes: `asset-inventory.json`.
- Ground contact shadows follow serialized fighter roots and fade with altitude. Near architecture remains behind the combat plane.
- A dedicated 28-degree perspective camera frames both fighters, corners, airborne routes and active projectiles. A restrained ultimate orbit preserves the fixed combat plane. Far-art coverage tracks camera excursions enough to prevent empty scenery edges.
- Existing 1600x900 combat canvas, 1.3 pixels per simulation unit, 0.02 world units per simulation unit, and source-height-minus-80 floor anchor are retained. Rendering does not modify state, moves, timing, damage, inputs or collision.
- Stage selection, resource disposal/reentry, and playable training-grid recovery on missing art or rendering failure.

The far city, leaning statue and halo share one painted layer. Floor and pier cores are physical geometry; head and detailed facades are separately positioned painted surfaces. This is a hybrid 2.5D environment, not a fully sculpted city.

## Verification

Final `npm run build` passed. Packaged output contains all stage assets. Manifest required fields, runtime bounds, camera FOV and packaged paths were checked.

`node tests/fallen_capital_camera.test.js` passed 288 body-corner projections across six spatial cases and gameplay plus five cinematic times; camera calculations are deterministic, nonmutating and invariant to player ordering.

`node tests/stage_pipeline.test.js` passed all nine existing groups.

`node scripts/fallen_capital_smoke.js` passed the actual browser at port 4175. Evidence: `captures/smoke-report.json` and the numbered captures. Real inputs verified damage in both directions, jump, projectile rendering and a hit-confirmed ultimate through charge and beam. Synthetic stress cases separately verified left/right corners and maximum separation plus ceiling height. Disposal, swapped-fighter reentry, training-grid selection and deliberate missing-background recovery passed. Normal run: no console/page errors and no failed asset requests.

Measured scene: 28 draw calls, 2,414 triangles, 27 geometries and six textures including the dynamic combat canvas. This is not a universal 60 FPS benchmark; target-device frame-time profiling remains separate.

## Gauntlet repairs and limits

The independent reviewer found a cropped halo, unfinished-looking piers and exposed gray backdrop strips at corner/cinematic extremes. Reframed the art, added detailed painted pier facades over physical cores, and repaired far-background coverage. Reviewer inspected the final center, beam and corner captures: no remaining visibility blocker. Small peripheral rubble remains simple dark geometry outside the lane.

The older `versus_playtest_body_envelope_v1.test.js` fails at line 85 because it expects the legacy defender to retain shorter hurtboxes. Its imports are core/fighter/roster modules, not the new stage. Current character work already changed that hurtbox expectation; no stage change alters those modules. This unrelated regression was retained and reported.

Celeste is not selectable in the current two-character V2 versus roster, so Celeste-specific spirit/ultimate checks await her integration. Swahili's unfinished Debt/wall-splat mechanics and earlier animation flags remain character work. A stage build does not implement or approve them. No claim that every future mechanic is verified.

## Scope and reproducibility

Implementation: `src/stage/fallenCapital/camera.ts`, `src/stage/fallenCapital/fallenCapitalArena.ts`; narrow stage-selection/lifecycle/diagnostic additions to `src/versus/main.ts`; new `public/stages/fallen-capital/` assets and manifest. Tests and evidence accompany this document. Pre-stage main snapshot is `versus-main.pre-stage.txt`; do not restore it over concurrent character work. Roll back only the stage-specific hunks if needed; selecting `?arena=tribunal` or `?arena=flat` remains the reversible runtime fallback.

NGA Engine V2, stage-pipeline and validation references, local-versus skill, imagegen and Three.js guidance informed the work. Git/deployment skill guidance was read for preservation/asset checks; no commit, branch switch, push or deployment was performed. Shared character work stayed on its active branch. Builder and independent QA had separate file scopes; both retired after passing the agreed checks. No persistent agent graph or instruction surface was changed.

Obsidian was not running. A readback-verified handoff remains in `.agent-sync-pending/2026-09-13-fallen-capital-v2-build.md`; central sync is not claimed.
