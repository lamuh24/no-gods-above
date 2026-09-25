# LAMUH Animation Manifest and Sprite-Sheet Remake Plan

## 2026-09-08 — New Legacy V2 down-special family

User-approved new concept, now local candidate: Light low aura sweep; Medium advancing turning sweep; Heavy heel slam with independent short low groundwave. Inputs S+U+J/K/L. Source/public `down-specials-v1`, Forge `down-special-packages-v1`; durations28/42/56 with one hit each. Runtime source sequences8/10/9 include repaired turning/heel connectors and approved idle endpoints. Existing artwork/specials unchanged. Core/replay/blocking/one-hit and Forge/source checks plus full build pass; browser confirms32/48/66damage. Human motion approval remains pending, especially Medium pivot height and turn spacing. Provenance/normalization/critique: `tools/nga-forge/review/lamuh-down-specials-v1/README.md`.

Last updated: 2026-06-06
Agent: Codex

## 2026-09-08 — Legacy V2 Divine counter launch candidate

Neutral projectile follow-up: Neutral Celestial Palm L/M/H now reuse existing counter/forward cyan-white-gold aura-ball sprites in the sandbox, with size ratios26/48,34/48,42/48 to retain strength readability. Only renderer mapping changed; body art, source images, damage, timing, speed, hitboxes and other moves preserved. Full build, 12 Palm gameplay groups and new aura-render routing tests pass; browser screenshots verified Light/Heavy right and Medium mirrored left. Existing content test fails on stale next-review label (Heaven expected, Radiant actual), unrelated and not rewritten. Candidate visual review pending; no deploy/push/promotion.

Latest far-launch retiming: response55, kick12–14, ball32 after a longer charge. Standard live test has308-unit separation at release and two contacts/68damage. Art unchanged; human approval pending. This supersedes48/release25 below.

Newest counter-only request supersedes the historical single-blast response: triggered aura vanish → same-leg rising kick → planted diagonal aura-ball shot. Stance40ticks/window6–17 remains; response48ticks, kick12–14 and ballrelease25. Damage28+44nominal/68scaled standard route, fixed launch/projectile velocity, no victim teleport or homing. Other special families and original sources remain preserved.

Eight new adult-bearded source poses use2048x1536/root(768,1360), uniform2.45camera calibration, realalpha and green0. Counter-only stance reuses the new matching cyan-white-gold guard. Individual source folder `engine_v2/content-source/characters/lamuh-legacy-v2/counter-launch-frames-v4`; additive Forge bundle `counter-launch-packages-v4`; public manifest and animation-only preview under `counter-launch-v4`. Sandbox `Heavy counter SUCCESS` uses this candidate. OldV3 is historical, not deleted.

Build, focused simulation/replay/mirrored/corner checks, physical heel/palm alignment, source hashes and Forge validation pass. Independent static review found no hard limb/anatomy or duplicated-ball failure; contact/recovery spacing awaits human1x/.5x judgment. Browser attachment failed this session, so live visual approval is not claimed. Source prompts and complete evidence: `tools/nga-forge/review/lamuh-counter-launch-v4/README.md` from repository root. Candidate-only; no production promotion or deployment.

## Scope Lock

This document starts the LAMUH sprite-sheet redesign pipeline. LAMUH's current moveset and input routing are frozen for this pass:

- No new attacks.
- No removed attacks.
- No renamed gameplay move keys.
- No combat-system redesign.
- No rebalance pass.
- No intentional changes to Celeste, Sol, Seris, Nyx, Vanta, Kairo, controller routing, or shared combat mechanics.

The accepted problem is visual: sprite identity, animation readability, row reuse, fallback consistency, and ascended-form continuity.

Before any further LAMUH sprite, atlas, VFX, or animation-mapping work, read `NO_GODS_ABOVE/docs/CHARACTER_SPRITE_PIPELINE.md` and this manifest. Generated LAMUH sheets are source/candidate art until normalized into the exact runtime atlas contract and validated.

For LAMUH sprite/animation work, also follow:

- `NO_GODS_ABOVE/skills/playable_character_production_skill.md`
- `NO_GODS_ABOVE/skills/sprite_sheet_validation_skill.md`
- `NO_GODS_ABOVE/skills/character_visual_consistency_skill.md`
- `NO_GODS_ABOVE/skills/vfx_integration_audit_skill.md` when VFX is involved
- `NO_GODS_ABOVE/skills/fighting_game_balance_pass_skill.md` when timing, knockback, hitstun, or juggle behavior is involved

## LAMUH / LAMUH Legacy Split

As of 2026-06-06, the redesigned LAMUH and the old LAMUH art are separate playable character identities:

- `lamuh` / display `LAMUH`: coverage-mode redesigned LAMUH only. Its profile sheet map contains only redesigned atlas keys, and `buildLamuhFinalPlayerAnimations()` must not reference `sheets.coreMovement`, `sheets.airMovement`, `sheets.groundNormals`, `sheets.airNormals`, `sheets.specials`, `sheets.defense`, `sheets.endStates`, `sheets.crownBody`, or `LAMUH_ASCENDED_BODY_ATLAS_ENABLED`.
- `lamuh_legacy` / display `LAMUH Legacy`: old LAMUH visual identity using the original `lamuhFinal*` / `lamuhCrownBody` atlases and a simple classic kit. This is the intentional home for old LAMUH art.

Old LAMUH atlases remain loaded for `lamuh_legacy` and asset history, not as active fallback rows for redesigned `lamuh`. If redesigned `lamuh` appears to revert to old art in gameplay, treat that as a wiring bug and check the profile sheet map, `buildLamuhFinalPlayerAnimations()`, enemy mirror aliases, and any direct `sheets.*` fallback added after this split.

Validation added for the split:

- `NO_GODS_ABOVE/scripts/smoke_lamuh_legacy_separation.js`
- `NO_GODS_ABOVE/assets/characters/lamuh/lamuh_legacy_separation_smoke_report.json`

The focused smoke verifies both select identities exist, redesigned `lamuh` has no old LAMUH sheet keys or old builder references, `lamuh_legacy` keeps the old atlases, forward heavy / Mirror Pierce uses Sheet 2 Row 2, and neutral heavy / Crown Beam uses the neutral body/VFX atlas Row 2.

## Current Sprite System

Runtime atlas paths are defined in `NO_GODS_ABOVE/game.js` in `assetPaths`. Slice metadata is defined in `sheetMeta`. LAMUH's move data is defined in `buildLamuhPlayerAttacks()` and `buildLamuhEnemyAttacks()`. Redesigned LAMUH's active animation rows are defined in `buildLamuhFinalPlayerAnimations(sheets)`, and enemy aliases are built from that map in `buildLamuhFinalEnemyAnimations(sheets)`. Legacy LAMUH has its own `buildLamuhLegacyPlayerAnimations(sheets)` / `buildLamuhLegacyEnemyAnimations(sheets)` path for the old atlases. Special input routing is in `chooseSpecialMove()`.

All current LAMUH runtime sheets use fixed 448 x 448 cells, locked bottom-center anchoring, and `baselineY: 382`.

| Runtime sheet key | Filename | Format | Frame counts | Current role |
| --- | --- | --- | --- | --- |
| `lamuhFinalCoreMovement` | `assets/sprites/lamuh_final/lamuh_sheet_1_core_movement_atlas.png` | 8 cols x 6 rows | 8, 6, 6, 6, 6, 4 | idle, walk, dash, crouch, temporary landing |
| `lamuhFinalAirMovement` | `assets/sprites/lamuh_final/lamuh_sheet_2_air_movement_atlas.png` | 6 cols x 6 rows | 4, 4, 4, 4, 6, 6 | jump, air drift, fall, air dash |
| `lamuhFinalGroundNormals` | `assets/sprites/lamuh_final/lamuh_sheet_3_ground_normals_atlas.png` | 8 cols x 4 rows | 4, 8, 7, 7 | standing/crouching normals and launcher-like fallbacks |
| `lamuhFinalAirNormals` | `assets/sprites/lamuh_final/lamuh_sheet_4_air_normals_atlas.png` | 7 cols x 4 rows | 4, 6, 7, 4 | air normals and air heavy fallback |
| `lamuhFinalSpecials` | `assets/sprites/lamuh_final/lamuh_sheet_5_specials_atlas.png` | 8 cols x 6 rows | 6, 7, 7, 6, 7, 4 | legacy specials and preserved fallback/history for pre-coverage super charge/fire |
| `lamuhFinalDefense` | `assets/sprites/lamuh_final/lamuh_sheet_6_defense_hit_reactions_atlas.png` | 8 cols x 6 rows | 4, 4, 4, 5, 6, 6 | block, hitstun, knockback |
| `lamuhFinalEndStates` | `assets/sprites/lamuh_final/lamuh_sheet_7_knockdown_recovery_flavor_atlas.png` | 8 cols x 7 rows | 6, 1, 6, 8, 8, 8, 8 | knockdown, grounded, get up, intro, victory, taunt |
| `lamuhCrownBody` | `assets/sprites/lamuh_final/lamuh_sheet_8_crown_of_no_gods_body_atlas.png` | 8 cols x 8 rows | 6, 7, 8, 8, 7, 8, 8, 6 | Crown startup/rush/combo/launch body rows; later rows currently art-gated |
| `lamuhCrownBeamVfx` | `assets/effects/lamuh/lamuh_crown_of_no_gods_beam_vfx_atlas.png` | VFX atlas | runtime effect-driven | beam effect overlay |

Processed Sheet 1 redesign candidate:

| Runtime sheet key | Filename | Format | Frame counts | Current role |
| --- | --- | --- | --- | --- |
| `lamuhSheet1CoreNormalsRedesign` | `assets/characters/lamuh/lamuh_sheet_1_core_movement_redesign_atlas.png` | 8 cols x 6 rows, 448 x 448 cells | 8, 8, 8, 8, 8, 8 | processed transparent remake atlas for idle, walk, run/dash, standing light, standing medium, standing heavy |
| `lamuhForwardSpecialsRedesign` | `assets/characters/lamuh/lamuh_sheet_forward_specials_redesign_atlas.png` | 8 cols x 3 rows, 448 x 448 cells | 8, 8, 8 | processed transparent remake atlas for Dash Strike, Mirror Break, Mirror Pierce |
| `lamuhDownUpSpecialsRedesign` | `assets/characters/lamuh/lamuh_sheet_3_down_up_specials_body_scale_atlas.png` | 8 cols x 6 rows, 448 x 448 cells | 8, 8, 8, 8, 8, 8 | body-scale-corrected transparent remake atlas for Low Mirror Cut, Ground Breaker, Crown Rupture, Crown Pop, Rising Crown, Ascendant Break |
| `lamuhBackNeutralSpecialsRedesign` | `assets/characters/lamuh/lamuh_sheet_4_back_neutral_specials_redesign_atlas.png` | 8 cols x 6 rows, 448 x 448 cells | 8, 8, 8, 8, 8, 8 | transparent remake atlas for Mirror Slip, Rebound Strike, Mirror Reversal; neutral rows are preserved for `lamuh_legacy`/history only |
| `lamuhNeutralSpecialsBodyVfxRedesign` | `assets/characters/lamuh/lamuh_sheet_neutral_specials_body_vfx_atlas.png` | 8 cols x 6 rows, 448 x 448 cells | 8, 8, 8, 8, 8, 8 | dedicated transparent body/VFX-separated neutral-special atlas: body rows 0-2, VFX rows 3-5 |
| `lamuhReactionsDefenseRedesign` | `assets/characters/lamuh/lamuh_sheet_reactions_defense_redesign_atlas.png` | 8 cols x 6 rows, 448 x 448 cells | 8, 8, 8, 8, 8, 8 | transparent remake atlas for light/heavy hit, launch/air hit, wall-bounce/hard knockback, knockdown/downed, getup, and high/low block |
| `lamuhAirCrouchJumpRedesign` | `assets/characters/lamuh/lamuh_sheet_air_crouch_jump_redesign_atlas_v2.png` | 8 cols x 6 rows, 448 x 448 cells | 8, 8, 8, 8, 8, 8 | transparent remake atlas for jump/fall/land, crouch normals, air normals, and air specials coverage |
| `lamuhSuperAscendedGoldenLocs` | `assets/characters/lamuh/lamuh_sheet_super_ascended_golden_locs_atlas.png` | 8 cols x 6 rows, 448 x 448 cells | 8, 8, 8, 8, 8, 8 | transparent golden-locs ascended atlas for super idle/recovery, activation/charge, Crown Rush, Crown Combo A, Crown Combo B/Launch, and Crown Fire/body overlay |
| `lamuhSecondaryMovementDirectionalNormalsRedesign` | `assets/characters/lamuh/lamuh_sheet_secondary_movement_directional_normals_atlas.png` | 8 cols x 6 rows, 448 x 448 cells | 8, 8, 8, 8, 8, 8 | coverage cleanup atlas for walk back, dash back, crouch/low stance hold, forward directional normals, back directional normals, and air dash/recovery/fall-transition states |

The processed Sheet 1 source was normalized from the generated image at `C:\Users\qchee\.codex\generated_images\019e9326-87c6-7a31-a11e-59fd05b1b81a\ig_04531724a64ae60f016a21bbfa4e10819bb94e64e5d2c7cecc.png` using `NO_GODS_ABOVE/scripts/normalize_lamuh_sheet1_redesign.py`. The script converts the opaque 1448 x 1086 generated sheet into a true-alpha 3584 x 2688 atlas, groups 48 visible sprites by the 8 x 6 visual grid, removes edge-connected checkerboard background, preserves white coat pixels, and aligns grounded feet to baselineY 382.

The processed forward-special source was normalized from the generated image at `C:\Users\qchee\.codex\generated_images\019e9326-87c6-7a31-a11e-59fd05b1b81a\ig_04531724a64ae60f016a21fc7ac9c0819ba7bbba29d3b8381c.png` using `NO_GODS_ABOVE/scripts/normalize_lamuh_forward_specials_redesign.py`. The script converts the opaque 2048 x 768 generated sheet into a true-alpha 3584 x 1344 atlas, groups the full dash/effect silhouettes into 24 occupied 8 x 3 slots, removes edge-connected checkerboard background, preserves white coat plus gold/cyan VFX pixels, keeps Mirror Pierce afterimage/blast elements, and aligns grounded feet to baselineY 382.

The processed down/up-special final Sheet 3 combines validated Sheet 3A Down Specials and normalized Sheet 3B Up Specials. Sheet 3A was produced from `C:\Users\qchee\.codex\generated_images\019e9326-87c6-7a31-a11e-59fd05b1b81a\ig_0c3ec58fb5cb1bc9016a224cf114788195a221ee583e346280.png` plus corrected Crown Rupture strip `C:\Users\qchee\.codex\generated_images\019e9326-87c6-7a31-a11e-59fd05b1b81a\ig_0c3ec58fb5cb1bc9016a22530015688195a8eb52a93533ebd3.png` using `NO_GODS_ABOVE/scripts/normalize_lamuh_sheet3a_down_specials_patch.py`. Sheet 3B was normalized from `C:\Users\qchee\.codex\generated_images\019e9326-87c6-7a31-a11e-59fd05b1b81a\ig_0c3ec58fb5cb1bc9016a225607054481959b266f7bc8c8451b.png` using `NO_GODS_ABOVE/scripts/normalize_lamuh_sheet3b_up_specials.py`. The first integrated combined atlas is preserved at `assets/characters/lamuh/lamuh_sheet_3_down_up_specials_redesign_atlas.png`, but gameplay QA showed LAMUH shrinking because the normalizer capped frame scale at `1.0` and preserved full VFX extents before body scale.

The active corrected Sheet 3 atlas is `assets/characters/lamuh/lamuh_sheet_3_down_up_specials_body_scale_atlas.png`, rebuilt by `NO_GODS_ABOVE/scripts/normalize_lamuh_sheet3_body_scale.py`. This body-scale pass uses the same source art and row mapping, but applies row-specific body-priority scale factors before placement, keeps feet/floor effects anchored to baselineY 382, and allows only less-important top/far VFX extremities to crop when a burst is too large for a 448 x 448 cell. Validation report: `assets/characters/lamuh/lamuh_sheet_3_down_up_specials_body_scale_report.json`; preview: `assets/characters/lamuh/lamuh_sheet_3_down_up_specials_body_scale_preview.png`; browser/runtime smoke: `assets/characters/lamuh/lamuh_sheet3_scale_smoke_report.json` via `NO_GODS_ABOVE/scripts/smoke_lamuh_sheet3_scale.js`. The report measured median body-height improvement versus the first integrated atlas: row 0 `112 -> 202`, row 1 `165 -> 289`, row 2 `207 -> 300`, row 3 `202 -> 313`, row 4 `253 -> 367`, row 5 `255 -> 383`, with the Sheet 1 reference median at `371`.

The processed Sheet 4 Back Specials atlas is `assets/characters/lamuh/lamuh_sheet_4_back_neutral_specials_redesign_atlas.png`, normalized from the green-screen source `NO_GODS_ABOVE/assets/characters/lamuh/sheet4_back_neutral_specials/lamuh_sheet_4_back_neutral_specials_generated_source.png` using `NO_GODS_ABOVE/scripts/normalize_lamuh_sheet4_back_neutral_specials.py`. Runtime now uses only rows 0-2 from this atlas for Mirror Slip, Rebound Strike, and Mirror Reversal. Rows 3-5 remain preserved as neutral fallback/history but are no longer the active neutral-special body source.

The active neutral-special body/VFX atlas is `assets/characters/lamuh/lamuh_sheet_neutral_specials_body_vfx_atlas.png`, normalized from `NO_GODS_ABOVE/assets/characters/lamuh/neutral_specials/lamuh_neutral_specials_body_vfx_source.png` using `NO_GODS_ABOVE/scripts/normalize_lamuh_neutral_specials_body_vfx.py`. The source was a 1448 x 1086 opaque/checkerboard 8 x 6 generated sheet; the processed atlas is exact 3584 x 2688, RGBA, 8 x 6, 448 x 448 cells with real transparency. Validation report: `assets/characters/lamuh/lamuh_sheet_neutral_specials_body_vfx_report.json`; preview: `assets/characters/lamuh/lamuh_sheet_neutral_specials_body_vfx_preview.png`; static smoke: `assets/characters/lamuh/lamuh_neutral_specials_body_vfx_smoke_report.json` via `NO_GODS_ABOVE/scripts/smoke_lamuh_neutral_specials_body_vfx.js`. Validation measured 48 occupied cells, checkerboard removed, white coat preserved, black outfit/locs preserved, gold/cyan/white VFX preserved, body rows at `0.981` of the Sheet 1 reference body scale, and body baseline max deviation `0`. The generated source had partial body recovery slots in row0/1/2 col6; the normalizer repaired those slots by holding row col7 recovery frames.

The active reactions/defense atlas is `assets/characters/lamuh/lamuh_sheet_reactions_defense_redesign_atlas.png`, normalized from `NO_GODS_ABOVE/assets/characters/lamuh/reactions_defense/lamuh_reactions_defense_source.png` using `NO_GODS_ABOVE/scripts/normalize_lamuh_reactions_defense.py`. The source was the generated 1448 x 1086 opaque/checkerboard 8 x 6 LAMUH reaction sheet; the processed atlas is exact 3584 x 2688, RGBA, 8 x 6, 448 x 448 cells with real transparency. Validation report: `assets/characters/lamuh/lamuh_sheet_reactions_defense_redesign_report.json`; preview: `assets/characters/lamuh/lamuh_sheet_reactions_defense_redesign_preview.png`; static smoke: `assets/characters/lamuh/lamuh_reactions_defense_smoke_report.json` via `NO_GODS_ABOVE/scripts/smoke_lamuh_reactions_defense.js`. Validation measured 48 occupied cells, checkerboard removed, white coat preserved, black outfit/locs preserved, gold/cyan accents preserved, standing/guard body scale at `1.017` of the Sheet 1 reference, and Row 5 frame splits of getup `0-3`, high block `4-5`, and low block `6-7`. The generated source's Row 2 frame 7 was only a shoe fragment, so the normalizer repairs that slot by holding Row 2 frame 6 as same-move launch/air-hit recovery. Wide lying rows still show minor edge slivers from the generated source and can be polished by a future art regeneration.

The active air/crouch/jump coverage atlas is `assets/characters/lamuh/lamuh_sheet_air_crouch_jump_redesign_atlas_v2.png`, normalized from `NO_GODS_ABOVE/assets/characters/lamuh/air_crouch_jump/lamuh_air_crouch_jump_regen_v2_source_alpha.png` using `NO_GODS_ABOVE/scripts/normalize_lamuh_air_crouch_jump.py`. The generated source is an alpha-clean 1448 x 1086 8 x 6 LAMUH coverage sheet. The processed atlas is exact 3584 x 2688, RGBA, 8 x 6, 448 x 448 cells with real transparency. Validation report: `assets/characters/lamuh/lamuh_sheet_air_crouch_jump_redesign_report_v2.json`; preview: `assets/characters/lamuh/lamuh_sheet_air_crouch_jump_redesign_preview_v2.png`; static smoke: `assets/characters/lamuh/lamuh_air_crouch_jump_smoke_report.json` via `NO_GODS_ABOVE/scripts/smoke_lamuh_air_crouch_jump.js`. Validation measured 48 occupied cells, 48 source sprite slots, 48 source body slots, no weak/fragment slots, checkerboard removed, white coat preserved, black outfit/locs preserved, gold/cyan accents preserved, grounded crouch baseline max deviation `0`, airborne center max deviation `20`, and body scale ratio `0.931` against the Sheet 1 reference. Raw body component count is `49` because one Air Crown Drop slot includes an extra same-move impact/body component; slot-level coverage remains `48`. Row 0 uses frame splits for jump `0-2`, fall `3-5`, and land `6-7`; Row 4 uses air light `0-2`, air medium `3-5`, and air heavy `6-7`; Row 5 uses Air Mirror Spark `0-2`, Air Dash Strike `3-5`, and Air Crown Drop `6-7`.

The active super/ascended continuity atlas is `assets/characters/lamuh/lamuh_sheet_super_ascended_golden_locs_atlas.png`, normalized from `NO_GODS_ABOVE/assets/characters/lamuh/super_ascended/lamuh_super_ascended_golden_locs_source.png` using `NO_GODS_ABOVE/scripts/normalize_lamuh_super_ascended_golden_locs.py`. The source was copied from generated image `C:\Users\qchee\.codex\generated_images\019e9326-87c6-7a31-a11e-59fd05b1b81a\ig_083fcfcf6623eef0016a238a6537d081978a5cb0af51aef3bf.png` (`1448x1086`, RGB/opaque checkerboard visual 8 x 6). The processed atlas is exact `3584x2688`, RGBA, 8 x 6, 448 x 448 cells with real transparency. Validation report: `assets/characters/lamuh/lamuh_sheet_super_ascended_golden_locs_report.json`; preview: `assets/characters/lamuh/lamuh_sheet_super_ascended_golden_locs_preview.png`; static smoke: `assets/characters/lamuh/lamuh_super_ascended_golden_locs_smoke_report.json` via `NO_GODS_ABOVE/scripts/smoke_lamuh_super_ascended_golden_locs.js`. Validation measured 48 occupied cells, 48 output/body slots, checkerboard removed, white coat preserved, black outfit preserved, golden locs preserved, gold/cyan accents preserved, super baseline max deviation `0`, and body scale ratio `1.003` against the Sheet 1 reference. The raw source contained `47` full body components: Row 0 col 3 and Row 1 col 3 were repaired by holding the adjacent same-row frame (`0,2` and `1,2`) so runtime still has 48 complete Ascended LAMUH body frames. This is coverage-ready, not final polish.

The active secondary movement / directional normals cleanup atlas is `assets/characters/lamuh/lamuh_sheet_secondary_movement_directional_normals_atlas.png`, normalized from `NO_GODS_ABOVE/assets/characters/lamuh/secondary_movement_directional_normals/lamuh_secondary_movement_directional_normals_source.png` using `NO_GODS_ABOVE/scripts/normalize_lamuh_secondary_movement_directional_normals.py`. The source was copied from generated image `C:\Users\qchee\.codex\generated_images\019e9326-87c6-7a31-a11e-59fd05b1b81a\ig_0cb1cb81ff9e817d016a23bc8bd6d48194907e6b6b290fb335.png` (`1448x1086`, opaque green/chroma 8 x 6). The processed atlas is exact `3584x2688`, RGBA, 8 x 6, 448 x 448 cells with real transparency. Validation report: `assets/characters/lamuh/lamuh_sheet_secondary_movement_directional_normals_report.json`; preview: `assets/characters/lamuh/lamuh_sheet_secondary_movement_directional_normals_preview.png`; static smoke: `assets/characters/lamuh/lamuh_secondary_movement_directional_normals_smoke_report.json` via `NO_GODS_ABOVE/scripts/smoke_lamuh_secondary_movement_directional_normals.js`. Validation measured 48 occupied cells, 48 source slots, background removed, white coat preserved, black outfit/locs preserved, gold/cyan accents preserved, body scale ratio `0.97` against the Sheet 1 reference, and grounded baseline max deviation `0`. Coverage-mode note: the generated source leaves minor residual green/chroma edge noise on some outlines; this is acceptable for replacing old-art fallback rows now and can be cleaned in final polish.

Neutral-special runtime note: body rows are now separated from large VFX. Mirror Spark uses Row 0 body plus Row 3 spark VFX. Mirror Pulse uses Row 1 body plus Row 4 pulse VFX. Crown Beam uses Row 2 body plus Row 5 beam-strip VFX anchored to the same palm/chest projectile origin; Row 5 is never used as a LAMUH body row. `special_2` now maps to Mirror Pulse Row 1, and `special_3` / `neutral_heavy_special` / `crown_beam*` map to Crown Beam Row 2. Player and enemy aliases are mirrored through the same animation table. The old directional-special overlay branch still does not treat neutral `special_2` as Ascend Step or neutral `special_3` as Heaven Splitter.

Neutral-special polish lock: gameplay hitbox spawn offsets stay unchanged, but visual VFX anchors are now pulled back to the palm/chest focus point. Mirror Spark spawns its hitbox at `86/-86` and draws from visual anchor `72/-92`; Mirror Pulse spawns at `104/-88` and draws from `78/-96`; Crown Beam spawns at `118/-92` and draws from `82/-104`. The VFX renderer adds only a small white/gold/cyan origin flare at the local palm point and draws the neutral VFX rows slightly behind that anchor to avoid a detached look. `getLamuhNeutralSpecialFrameOverride()` holds neutral body frames by phase: Spark remains fast, Pulse holds the planted palm/active/recovery poses, and Crown Beam holds charge, firing, recoil, and recovery poses. Mirror Spark and Mirror Pulse no longer fall through to old `special_recovery` during their final recovery sliver.

Super/powered-up body continuity now uses the golden-locs ascended atlas when `lamuhSuperAscendedGoldenLocs` is loaded. `crown_startup`, `crown_charge`, `lamuh_super_activation`, and `ultimate` use Row 1; `crown_rush` uses Row 2; `crown_combo_a` uses Row 3; `crown_combo_b` and `crown_launch` use Row 4; `crown_fire` and `lamuh_super_attack_overlay` use Row 5; `crown_recovery` and `lamuh_super_idle` use Row 0. `LAMUH_ASCENDED_BODY_ATLAS_ENABLED` remains `false` for the older Sheet 8 late rows, which are preserved for `lamuh_legacy`/history only. Regular Heavy Neutral / Crown Beam must not use the global super phase aliases; it still uses `crown_beam_charge`, `crown_beam_fire`, and `crown_beam_recovery`, all mapped to neutral-special Row 2.

## Current Mapping Summary

Standing normals are not allowed to fall back to idle:

- `neutral_light`, `light_attack`, `quick_palm`, `lamuh_stand_light` -> processed Sheet 1 Row 3, old Sheet 3 Row 0 preserved for `lamuh_legacy`/history only.
- `neutral_medium`, `medium_attack`, `mirror_knuckle`, `lamuh_stand_medium` -> processed Sheet 1 Row 4, old Sheet 3 Row 1 preserved for `lamuh_legacy`/history only.
- `neutral_heavy`, `heavy_attack`, `crown_breaker`, `lamuh_stand_heavy` -> processed Sheet 1 Row 5, old Sheet 3 Row 2 preserved for `lamuh_legacy`/history only.

The special tree remains 5 directions x 3 grounded strengths plus 3 air strengths:

- Neutral: Mirror Spark, Mirror Pulse, Crown Beam.
- Forward: Dash Strike, Mirror Break, Mirror Pierce.
- Back: Mirror Slip, Rebound Strike, Mirror Reversal.
- Down: Low Mirror Cut, Ground Breaker, Crown Rupture.
- Up: Crown Pop, Rising Crown, Ascendant Break.
- Air: Air Mirror Spark, Air Dash Strike, Air Crown Drop.

Aliases are now present for the manifest's canonical `lamuh_*` keys so future sheets can be wired by replacing row targets rather than searching for ad hoc move names.

Processed forward-special mappings:

- `forward_light_special`, `dash_strike`, `lamuh_dash_strike` -> processed forward-special Sheet Row 0, old Sheet 5 Row 1 preserved for `lamuh_legacy`/history only.
- `forward_medium_special`, `mirror_break`, `lamuh_mirror_break` -> processed forward-special Sheet Row 1, old Sheet 5 Row 1 preserved for `lamuh_legacy`/history only.
- `forward_heavy_special`, `mirror_pierce`, `lamuh_mirror_pierce` -> processed forward-special Sheet Row 2, old Sheet 8 Row 1 preserved for `lamuh_legacy`/history only.

Processed down/up-special mappings:

- `down_special`, `down_light_special`, `low_mirror_cut`, `lamuh_low_mirror_cut` -> processed Sheet 3 Row 0, old Sheet 3 Row 0 preserved for `lamuh_legacy`/history only.
- `down_medium_special`, `ground_breaker`, `lamuh_ground_breaker` -> processed Sheet 3 Row 1, old Sheet 5 Row 2 preserved for `lamuh_legacy`/history only.
- `down_heavy_special`, `crown_rupture`, `lamuh_crown_rupture` -> processed Sheet 3 Row 2, old Sheet 5 Row 2 preserved for `lamuh_legacy`/history only.
- `up_light_special`, `crown_pop`, `lamuh_crown_pop` -> processed Sheet 3 Row 3, old Sheet 3 Row 3 preserved for `lamuh_legacy`/history only.
- `up_medium_special`, `rising_crown`, `lamuh_rising_crown` -> processed Sheet 3 Row 4, old Sheet 5 Row 2 preserved for `lamuh_legacy`/history only.
- `up_heavy_special`, `ascendant_break`, `lamuh_ascendant_break` -> processed Sheet 3 Row 5, old Sheet 8 Row 4 preserved for `lamuh_legacy`/history only.

Processed neutral-special mappings:

- `special_1`, `neutral_special`, `neutral_light_special`, `mirror_spark`, `lamuh_mirror_spark`, `lamuh_mirror_spark_body` -> neutral-special body/VFX atlas Row 0 body, with Row 3 small spark VFX anchored to the palm. Old Sheet 4 Row 3 and Sheet 5 Row 0 remain `lamuh_legacy`/history sources only.
- `special_2`, `neutral_medium_special`, `mirror_pulse`, `lamuh_mirror_pulse`, `lamuh_mirror_pulse_body` -> neutral-special body/VFX atlas Row 1 body, with Row 4 pulse VFX anchored to the palm/chest projectile origin. Old Sheet 4 Row 4 and Sheet 5 Row 0 remain `lamuh_legacy`/history sources only.
- `special_3`, `neutral_heavy_special`, `crown_beam`, `lamuh_crown_beam`, `lamuh_crown_beam_body`, `crown_beam_charge`, `crown_beam_fire`, `crown_beam_recovery` -> neutral-special body/VFX atlas Row 2 body, with Row 5 Crown Beam VFX drawn separately from the palm/chest projectile origin. Root-cause note: previous fallback bugs came from legacy/direct aliases and phase aliases reaching old Sheet 5 or Sheet 4 neutral rows; regular Crown Beam now stays on Row 2 for all body phases. Old global `crown_charge/fire/recovery` remain ultimate-only fallbacks and were not repurposed for regular neutral heavy.

Processed back-special mappings:

- `back_special`, `back_light_special`, `mirror_slip`, `lamuh_mirror_slip` -> processed Sheet 4 Row 0, old Sheet 5 Row 3 preserved for `lamuh_legacy`/history only.
- `back_medium_special`, `rebound_strike`, `lamuh_rebound_strike` -> processed Sheet 4 Row 1, old Sheet 5 Row 3 preserved for `lamuh_legacy`/history only.
- `back_heavy_special`, `mirror_reversal`, `lamuh_mirror_reversal` -> processed Sheet 4 Row 2, old Sheet 5 Row 3 preserved for `lamuh_legacy`/history only.

Processed reactions/defense mappings:

- `damaged`, `light_hitstun`, `hit_light`, `lamuh_hit_light` -> reactions/defense atlas Row 0, old Sheet 6 Row 3 preserved for `lamuh_legacy`/history only.
- `medium_hitstun`, `heavy_hitstun`, `hit_heavy`, `lamuh_hit_heavy`, `lamuh_super_hit_reaction` -> reactions/defense atlas Row 1, old Sheet 6 Row 5 preserved for `lamuh_legacy`/history only.
- `launch_hitstun`, `air_hitstun`, `air_block`, `launch_hit`, `lamuh_launch_hit`, `lamuh_air_hit` -> reactions/defense atlas Row 2, old Sheet 6 Row 5/4 preserved for `lamuh_legacy`/history only.
- `knockback`, `wall_bounce`, `lamuh_wall_bounce`, `lamuh_hard_knockback` -> reactions/defense atlas Row 3, old Sheet 6 Row 5 preserved for `lamuh_legacy`/history only.
- `knockdown_fall`, `lamuh_knockdown`, `lamuh_down`, `knockdown`, `grounded`, `downed` -> reactions/defense atlas Row 4, old Sheet 7 Row 0/1 preserved for `lamuh_legacy`/history only.
- `get_up`, `lamuh_getup`, `recovery`, `recovery_get_up`, `stand_up`, `block`, `guard_idle`, `stand_block`, `lamuh_block_high`, `crouch_block`, `lamuh_block_low` -> reactions/defense atlas Row 5. Runtime frame override uses frames `0-3` for getup/recovery, `4-5` for high block, and `6-7` for low block.

Processed air/crouch/jump mappings:

- `jump_up`, `lamuh_jump`, `rising`, `jump_forward`, `jump_back` -> air/crouch/jump atlas Row 0 frames `0-2`, old Sheet 2 air movement rows preserved for `lamuh_legacy`/history onlys.
- `fall`, `lamuh_fall`, `neutral_air_drift` -> air/crouch/jump atlas Row 0 frames `3-5`, old Sheet 2 Row 3 preserved for `lamuh_legacy`/history only.
- `land`, `landing`, `lamuh_land` -> air/crouch/jump atlas Row 0 frames `6-7`, old Sheet 1 idle row preserved for `lamuh_legacy`/history only.
- `down_light`, `low_check`, `crouch_light`, `lamuh_crouch_light` -> air/crouch/jump atlas Row 1, old Sheet 3 Row 0 preserved for `lamuh_legacy`/history only.
- `down_medium`, `sweep_line`, `crouch_medium`, `lamuh_crouch_medium` -> air/crouch/jump atlas Row 2, old Sheet 3 Row 1 preserved for `lamuh_legacy`/history only.
- `down_heavy`, `crown_riser`, `lamuh_crown_riser`, `crouch_heavy`, `lamuh_crouch_heavy` -> air/crouch/jump atlas Row 3, old Sheet 3 Row 3 preserved for `lamuh_legacy`/history only.
- `jump_light`, `air_light`, `air_tap`, `lamuh_air_light` -> air/crouch/jump atlas Row 4 frames `0-2`, old Sheet 4 Row 0 preserved for `lamuh_legacy`/history only.
- `jump_medium`, `air_medium`, `sky_knuckle`, `lamuh_air_medium` -> air/crouch/jump atlas Row 4 frames `3-5`, old Sheet 4 Row 1 preserved for `lamuh_legacy`/history only.
- `jump_heavy`, `air_heavy`, `crown_drop`, `lamuh_air_heavy` -> air/crouch/jump atlas Row 4 frames `6-7`, old Sheet 4 Row 2 preserved for `lamuh_legacy`/history only.
- `air_special`, `air_light_special`, `air_mirror_spark`, `lamuh_air_mirror_spark` -> air/crouch/jump atlas Row 5 frames `0-2`, old Sheet 5 Row 0 preserved for `lamuh_legacy`/history only.
- `radiant_dive`, `air_medium_special`, `air_dash_strike`, `lamuh_air_dash_strike` -> air/crouch/jump atlas Row 5 frames `3-5`, old Sheet 5 Row 4 preserved for `lamuh_legacy`/history only.
- `air_heavy_special`, `air_crown_drop`, `lamuh_air_crown_drop` -> air/crouch/jump atlas Row 5 frames `6-7`, old Sheet 4 Row 2 preserved for `lamuh_legacy`/history only.

Processed secondary movement / directional normal cleanup mappings:

- `walk_back`, `lamuh_walk_back` -> secondary cleanup atlas Row 0, old Sheet 1/core movement rows preserved for `lamuh_legacy`/history onlys.
- `dash_back`, `lamuh_dash_back` -> secondary cleanup atlas Row 1, old Sheet 1/core movement rows preserved for `lamuh_legacy`/history onlys.
- `crouch`, `lamuh_crouch`, `low_stance` -> secondary cleanup atlas Row 2, old Sheet 1/core movement rows preserved for `lamuh_legacy`/history onlys.
- `launcher`, `forward_light`, `forward_medium`, `forward_heavy` -> secondary cleanup atlas Row 3 with runtime frame splits: forward light `0-2`, forward medium `3-5`, forward heavy/launcher `6-7`. This is coverage-mode cleanup for directional-normal aliases that previously reached old ground-normal rows; dedicated per-move polish can replace these split ranges later.
- `back_light`, `back_medium`, `back_heavy` -> secondary cleanup atlas Row 4 with runtime frame splits: back light `0-2`, back medium `3-5`, back heavy `6-7`.
- `air_dash_forward`, `air_dash_back`, `air_recovery`, `fall_transition` -> secondary cleanup atlas Row 5 with runtime frame splits: air dash forward `0-2`, air dash back `3-5`, air recovery/fall transition `6-7`.
- The public `index.html` script cache key is bumped to `game.js?v=lamuh-secondary-movement-directional-1` so browsers do not keep running a stale `game.js` that still points these aliases at old atlases.

Processed super/ascended mappings:

- `lamuh_super_idle`, `crown_recovery` -> super/ascended golden-locs atlas Row 0, old base idle / Sheet 8 recovery preserved for `lamuh_legacy`/history only.
- `crown_startup`, `crown_charge`, `lamuh_super_activation`, `ultimate` -> super/ascended golden-locs atlas Row 1, old Sheet 8 startup / Sheet 5 Row 5 preserved for `lamuh_legacy`/history only.
- `crown_rush` -> super/ascended golden-locs atlas Row 2, old Sheet 8 Row 1 preserved for `lamuh_legacy`/history only.
- `crown_combo_a` -> super/ascended golden-locs atlas Row 3, old Sheet 8 Row 2 preserved for `lamuh_legacy`/history only.
- `crown_combo_b`, `crown_launch` -> super/ascended golden-locs atlas Row 4, old Sheet 8 Rows 3-4 preserved for `lamuh_legacy`/history only.
- `crown_fire`, `lamuh_super_attack_overlay` -> super/ascended golden-locs atlas Row 5, old Sheet 5 Row 5 / Sheet 8 fire row preserved for `lamuh_legacy`/history only; beam VFX remains the existing separate `lamuhCrownBeamVfx` layer.

Mirror Pierce runtime note:

- `forward_heavy_special` must stay on `mirror_pierce` for the full active/recovery action; do not phase it through `crown_rush`, `crown_fire`, or `crown_recovery`.
- Mirror Pierce is a delayed two-stage hit. Stage 1 is the pass-through pierce confirm during the side-switch beat: `30` damage, short hitstun, and tiny knockback to keep the opponent in range. The target then gets a Mirror-Pierce-only hold while LAMUH stays on the palm-ready frame; the beam must not appear during this palm pause. Stage 2 fires at frame `57` (`0.95s`) after about a `40f` palm pause: a stationary `640x82`, `0.24s` beam hitbox/VFX with `projectileSpeed: 0`, `spawnOffsetX: 52`, `spawnOffsetY: -144`, `78` damage, high hitstun, heavy `2600/-420` launch, soft knockdown, and one wall-bounce opportunity through the existing wall-bounce cap. Keep `??` fallback semantics for projectile speed so zero remains valid. The beam must be confirm-gated by the pierce hit and must preserve the processed Row 2 body animation. The beam was centered at `spawnOffsetY: -96`, then `-132`; the latest screenshot-driven fine tune raises it slightly again to `-144`. Keep the X lane unchanged and only tune Y if future art alignment needs refinement.
- Mirror Pierce also has an explicit whiff branch. If the pierce stage finds no target, is out of range, misses the hurtbox, or is blocked, it marks `lamuhPierceWhiffed`, clears any Mirror-Pierce-only target hold, plays a short visual-only palm/blast beam at frame `38`, never spawns a damaging beam or target hold, and returns control after whiff recovery frame `52`. The max-duration failsafe is frame `96` and exists only to clear unexpected stuck states; focused smoke expects normal whiffs to recover without tripping it.
- `drawLamuhMirrorPierceBeam()` is the runtime visual path for this move. Do not route Mirror Pierce through the compact Celestial Palm projectile atlas, because that reads like a small orb/fireball instead of a piercing beam.
- Focused validation lives at `scripts/smoke_lamuh_mirror_pierce.js` and writes `assets/characters/lamuh/lamuh_mirror_pierce_smoke_report.json`.

## Design Bible

Base LAMUH must remain a Black male rushdown fighter with dark black locs/dreads, a confident focused expression, a white long coat or short battle coat, a black outfit underneath, gold trim/accent details, subtle blue/cyan jewel or energy accents, an athletic fighter build, a clean readable silhouette, a sharp grounded rushdown stance, and mirror/afterimage energy identity.

Do not change his race, face identity, skin tone, loc silhouette, body proportions, outfit structure, or grounded silhouette. Do not replace his locs with generic anime hair. Do not make him bulky, heavily armored, helmeted, masked, or visually unrelated to the accepted base character.

Ascended LAMUH must look like the same exact person powered up. Keep the same face, skin tone, loc/dread silhouette, proportions, coat silhouette, and outfit structure. Add only gold/white rim light, glowing eyes, glowing loc tips, brighter gold trim, stronger cyan/gold chest energy glow, subtle black shadow aura, white/gold mirror energy, and slightly lifted coat edges from power. Do not turn him blond, change his face, change his proportions, muddy him with purple wash, or ship a mismatched super atlas that reads as another fighter.

## Animation Manifest

Legend: "Works" means a runtime alias resolves to a non-missing row. "Acceptable" means visually acceptable as final art. Many rows work only as temporary fallback art.

Engine V2 rebuild gate (candidate-only, nondeployable):

- Standing Light: V1 motion preserved and human-approved with timing candidate B (`18` ticks). This approves only that clip's motion and visual retiming; combat profile, runtime promotion, production baseline, and first-playable closure remain unapproved.
- Standing Medium: V1 motion and the outline-free eight-pose modernization are human-approved with timing candidate B (`24` ticks). This approves only that clip's motion and visual retiming; impact profile, combat profile, runtime promotion, production baseline, and first-playable closure remain unapproved.
- Crouching Light: legacy source truth is a four-frame Standing Light artwork alias rather than a distinct crouching row. The seven-pose outline-free V2 modernization is human-approved for preserved motion and timing candidate B (`16` ticks): a body-driven low palm check with fixed root, one visible impact, same-arm follow-through, and connected crouch recovery. This approval is limited to motion and visual retiming; impact profile, combat profile, runtime promotion, production baseline, and first-playable closure remain unapproved.
- Crouching Medium: legacy source truth is an eight-frame Standing Medium artwork alias rather than a distinct crouching row. The eight-pose outline-free `Sweep Line` V2 modernization is now a human-review candidate: fixed authored root, same lead leg through load/contact/follow-through/retraction, frame `03` as the only visible impact, and independent timing candidates A/B/C at `19`/`22`/`25` ticks. Motion, timing, impact, combat profile, runtime promotion, production baseline, and first-playable closure remain unapproved.
- Standing Heavy: the prior contact-scale repair remains the only approved Heavy repair; broader Heavy motion/timing and first-playable approval remain separate gates.

| Key | Move name | Purpose | Current fallback/source | Works | Acceptable | Bespoke art | Frames | Visual direction | Form |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| `lamuh_idle` | Idle | Neutral stance | Processed Sheet 1 Row 0 | Yes | Candidate | Must-have | 8 | Grounded, coiled, coat readable, mirror hand ready | Shared |
| `lamuh_walk` | Walk | Ground movement | Processed Sheet 1 Row 1 | Yes | Candidate | Must-have | 8 | Controlled forward step, coat sway, no sliding | Shared |
| `lamuh_run` | Run | Fast movement read | Processed Sheet 1 Row 2 | Yes | Candidate | Must-have | 8 | Leaning rushdown run distinct from dash | Shared |
| `lamuh_dash` | Dash | Burst movement | Processed Sheet 1 Row 2 | Yes | Candidate | Must-have | 8 | Sharp mirror-step, afterimage-friendly pose | Shared |
| `lamuh_jump` | Jump | Takeoff/rise | Air/Crouch/Jump Row 0 frames 0-2 | Yes | Candidate | Must-have | 3 | Clear upward compression and lift | Shared |
| `lamuh_fall` | Fall | Air descent | Air/Crouch/Jump Row 0 frames 3-5 | Yes | Candidate | Must-have | 3 | Falling guard, coat lifted, readable legs | Shared |
| `lamuh_land` | Land | Ground re-entry | Air/Crouch/Jump Row 0 frames 6-7 | Yes | Candidate | Must-have | 2 | Soft impact crouch-to-stance, no idle snap | Shared |
| `lamuh_stand_light` | Quick Palm | Standing light | Processed Sheet 1 Row 3 | Yes | Candidate | Must-have | 8 | Compact fast jab/palm, minimal commitment | Shared |
| `lamuh_stand_medium` | Mirror Knuckle | Standing medium | Processed Sheet 1 Row 4 | Yes | Candidate | Must-have | 8 | More reach and torso turn than light | Shared |
| `lamuh_stand_heavy` | Crown Breaker | Standing heavy | Processed Sheet 1 Row 5 | Yes | Candidate | Must-have | 8 | Wind-up, strong active pose, clear recovery | Shared |
| `lamuh_crouch_light` | Low Check | Crouch light | Air/Crouch/Jump Row 1 | Yes | Candidate | Must-have | 8 | Distinct low poke, not standing light reused | Shared |
| `lamuh_crouch_medium` | Sweep Line | Crouch medium | Air/Crouch/Jump Row 2 | Yes | Candidate | Must-have | 8 | Low reach, hip rotation, sweep silhouette | Shared |
| `lamuh_crouch_heavy` | Crown Riser | Crouch heavy/launcher | Air/Crouch/Jump Row 3 | Yes | Candidate | Must-have | 8 | Low-to-up launcher, clear anti-air finish | Shared |
| `lamuh_air_light` | Air Tap | Air light | Air/Crouch/Jump Row 4 frames 0-2 | Yes | Candidate | Must-have | 3 | Small fast airborne check | Shared |
| `lamuh_air_medium` | Sky Knuckle | Air medium | Air/Crouch/Jump Row 4 frames 3-5 | Yes | Candidate | Must-have | 3 | Wider air reach, twist, controlled legs | Shared |
| `lamuh_air_heavy` | Crown Drop | Air heavy | Air/Crouch/Jump Row 4 frames 6-7 | Yes | Candidate | Must-have | 2 | Strong downward body commitment | Shared |
| `lamuh_mirror_spark` | Mirror Spark | Light neutral special | Neutral body/VFX atlas Row 0 body + Row 3 VFX | Yes | Candidate | Recommended | 8 | Planted quick mirror spark, small pose | Shared |
| `lamuh_mirror_pulse` | Mirror Pulse | Medium neutral special | Neutral body/VFX atlas Row 1 body + Row 4 VFX | Yes | Candidate | Recommended | 8 | Wider chest/hand pulse, not same palm as spark | Shared |
| `lamuh_crown_beam` | Crown Beam | Heavy neutral blast | Neutral body/VFX atlas Row 2 body + Row 5 VFX | Yes | Candidate | Must-have | 8 | Charge, fire, recovery, committed heavy blast | Shared |
| `lamuh_dash_strike` | Dash Strike | Light forward special | Processed forward-special Row 0 | Yes | Candidate | Recommended | 8 | Horizontal dash hit, low commitment | Shared |
| `lamuh_mirror_break` | Mirror Break | Medium forward special | Processed forward-special Row 1 | Yes | Candidate | Must-have | 8 | Strong rush impact, more force than Dash Strike | Shared |
| `lamuh_mirror_pierce` | Mirror Pierce | Heavy rush-through / beam blast | Processed forward-special Row 2 | Yes | Candidate | Must-have | 8 | Pass-through pose, turn/back-palm, late mirror beam blast | Shared |
| `lamuh_mirror_slip` | Mirror Slip | Light back special | Processed Sheet 4 Row 0 | Yes | Candidate | Recommended | 8 | Backward slip, defensive posture first | Shared |
| `lamuh_rebound_strike` | Rebound Strike | Medium back special | Processed Sheet 4 Row 1 | Yes | Candidate | Must-have | 8 | Retreat first, snap forward second | Shared |
| `lamuh_mirror_reversal` | Mirror Reversal | Heavy back fallback | Processed Sheet 4 Row 2 | Yes | Candidate | Recommended | 8 | Brace/reversal rhythm, not a true parry yet | Shared |
| `lamuh_low_mirror_cut` | Low Mirror Cut | Light down special | Processed Sheet 3 Row 0 | Yes | Candidate | Recommended | 8 | Low horizontal cut, grounded hand/leg line | Shared |
| `lamuh_ground_breaker` | Ground Breaker | Medium down special | Processed Sheet 3 Row 1 | Yes | Candidate | Must-have | 8 | Ground stomp/slam, readable floor impact | Shared |
| `lamuh_crown_rupture` | Crown Rupture | Heavy down launcher | Processed Sheet 3 Row 2 | Yes | Candidate | Must-have | 8 | Heavy rupture, larger grounded commitment than Ground Breaker | Shared |
| `lamuh_crown_pop` | Crown Pop | Light up special | Processed Sheet 3 Row 3 | Yes | Candidate | Recommended | 8 | Quick vertical pop, instant anti-air read | Shared |
| `lamuh_rising_crown` | Rising Crown | Medium up special | Processed Sheet 3 Row 4 | Yes | Candidate | Must-have | 8 | Rising launcher, vertical body silhouette | Shared |
| `lamuh_ascendant_break` | Ascendant Break | Heavy up finisher | Processed Sheet 3 Row 5 | Yes | Candidate | Must-have | 8 | Heavy vertical finisher, distinct from Rising Crown | Shared |
| `lamuh_air_mirror_spark` | Air Mirror Spark | Air light special | Air/Crouch/Jump Row 5 frames 0-2 | Yes | Candidate | Recommended | 3 | Airborne planted spark with hand aim | Shared |
| `lamuh_air_dash_strike` | Air Dash Strike | Air medium special | Air/Crouch/Jump Row 5 frames 3-5 | Yes | Candidate | Recommended | 3 | Diagonal air rush, code-driven travel | Shared |
| `lamuh_air_crown_drop` | Air Crown Drop | Air heavy special | Air/Crouch/Jump Row 5 frames 6-7 | Yes | Candidate | Must-have | 2 | Unique dive/drop pose, not air heavy reused | Shared |
| `lamuh_hit_light` | Light hit reaction | Light damage read | Reactions/Defense Row 0 | Yes | Candidate | Must-have | 8 | Small recoil, head/torso snap | Shared |
| `lamuh_hit_heavy` | Heavy hit reaction | Heavy damage read | Reactions/Defense Row 1 | Yes | Candidate | Must-have | 8 | Big recoil, coat and shoulders thrown | Shared |
| `lamuh_launch_hit` | Launch hit reaction | Launcher damage read | Reactions/Defense Row 2 | Yes | Candidate | Must-have | 8 | Upward launch posture, feet leaving baseline | Shared |
| `lamuh_knockdown` | Knockdown fall | Knockdown state | Reactions/Defense Row 4 | Yes | Candidate | Must-have | 8 | Collapse/fall with readable body path | Shared |
| `lamuh_getup` | Get up | Recovery from ground | Reactions/Defense Row 5 frames 0-3 | Yes | Candidate | Must-have | 4 | Roll/push to stance, same silhouette | Shared |
| `lamuh_block_high` | High block | Standing guard | Reactions/Defense Row 5 frames 4-5 | Yes | Candidate | Optional/Must if blocks are animated | 2 | Braced high guard, coat stable | Shared |
| `lamuh_block_low` | Low block | Crouch guard | Reactions/Defense Row 5 frames 6-7 | Yes | Candidate | Optional/Must if blocks are animated | 2 | Crouched braced guard | Shared |
| `lamuh_super_idle` | Ascended idle | Powered-up hold | Super/Ascended golden-locs Row 0 | Yes | Candidate | Must-have | 8 | Same person, golden locs, glowing trim/eyes/chest, controlled aura | Super-only |
| `lamuh_super_activation` | Crown activation | Super startup | Super/Ascended golden-locs Row 1 | Yes | Candidate | Must-have | 8 | Power-up pose, chest glow, coat lift, golden locs | Super-only |
| `lamuh_super_attack_overlay` | Crown attack overlay | Super fire/body support | Super/Ascended golden-locs Row 5 plus beam VFX | Yes | Candidate | Recommended if supported | 8 | Same body firing beam, no identity swap, full body visible | Super-only |
| `lamuh_super_hit_reaction` | Ascended hit reaction | Powered-up damage read | Sheet 6 Row 5 | Yes | Temporary only | Recommended if supported | 5-6 | Same LAMUH hurt with ascended glow retained | Super-only |

## Must-Have Bespoke Rows

Core: `lamuh_idle`, `lamuh_walk`, `lamuh_run`, `lamuh_jump`, `lamuh_fall`, `lamuh_land`.

Basic attacks: `lamuh_stand_light`, `lamuh_stand_medium`, `lamuh_stand_heavy`, `lamuh_crouch_light`, `lamuh_crouch_medium`, `lamuh_crouch_heavy`, `lamuh_air_light`, `lamuh_air_medium`, `lamuh_air_heavy`.

Key specials: `lamuh_mirror_break`, `lamuh_mirror_pierce`, `lamuh_crown_beam`, `lamuh_rebound_strike`, `lamuh_ground_breaker`, `lamuh_crown_rupture`, `lamuh_rising_crown`, `lamuh_ascendant_break`, `lamuh_air_crown_drop`.

Reactions: `lamuh_hit_light`, `lamuh_hit_heavy`, `lamuh_launch_hit`, `lamuh_knockdown`, `lamuh_getup`.

Super: `lamuh_super_idle`, `lamuh_super_activation`.

Strongly recommended rows: `lamuh_mirror_spark`, `lamuh_mirror_pulse`, `lamuh_dash_strike`, `lamuh_mirror_slip`, `lamuh_mirror_reversal`, `lamuh_low_mirror_cut`, `lamuh_crown_pop`, `lamuh_air_mirror_spark`, `lamuh_air_dash_strike`.

## Animation Language

Light attacks should be compact, fast, minimally committed, and return quickly to stance. Medium attacks need more reach, more torso rotation, and clearer commitment. Heavy attacks need visible wind-up, a strong active pose, readable recovery, and must never be identical to medium.

Forward specials are horizontal movement, dash, rush, or pierce actions. Back specials must retreat, slip, guard, or reverse, with a backward/bracing rhythm before any snap. Down specials are low cuts, stomps, slams, and ground ruptures. Up specials use vertical silhouettes and instantly read as launcher/anti-air actions. Neutral specials are planted energy-control poses and must not all use the same palm pose.

Mirror Pierce must be a signature rush-through and blast move with unique body poses: pass-through, turn/back-palm, and blast. Crown Beam must have charge, fire, and recovery. Crown Rupture must be heavier and more destructive than Ground Breaker. Ascendant Break must be a heavier vertical finisher than Rising Crown. Rebound Strike must visibly retreat first and snap forward second.

## Integration Notes

### Engine V2 Legacy air-normal smooth single-hit candidate — 2026-08-29

- `air_light` / Jump Light is now a five-frame authored V2 reconstruction: compact same-arm palm chamber, extension connector, one open-palm contact, held same-arm follow-through, and guarded recovery. Its protected V1 motion references are `1, 1, 2, 2, 3`; the connector strip is explicitly targeted V2 reconstruction art rather than falsely labeled pixel-identical V1 source. The ambiguous fist-looking source index `0` remains hash-protected but excluded. Visible impacts: `1`; registered hits: `1`; recommended B exposure: `2, 1, 5, 2, 3` ticks (`13` total).
- `air_medium` / Jump Medium is now a six-frame authored V2 reconstruction: same-leg compact chamber, extension connector, one side-kick contact, retraction connector, knee recoil, and guarded recovery. Its protected V1 motion references are `1, 1, 2, 4, 4, 5`; the fist entry and cross-punch remain hash-protected source history but are excluded from playback. Visible impacts: `1`; registered hits: `1`; recommended B exposure: `3, 3, 4, 3, 4, 4` ticks (`21` total).
- Jump Medium deals its existing `44` damage in the single kick hit and retains a total juggle cost of `2`.
- Both moves use one fixed sequence scale and the shared authored root. First-frame cross-move scale delta is `1.34%`; contact presentation is body-only with contact VFX disabled. These are local review candidates only: human motion, timing, transition, and combat-profile approval remain unset.
- Review controls: `j.L one-hit check` and `j.M one-hit check` in `lamuh-legacy-sandbox.html`; side-by-side timing/contact review remains in `lamuh-v1-v2-review.html`.

Place replacement base runtime sheets under `NO_GODS_ABOVE/assets/sprites/lamuh_final/` unless a new staging folder is intentionally introduced. Place replacement ascended body sheets in the same LAMUH final folder, but keep them separate from base sheets until they pass identity review.

Preferred future wiring path:

1. Generate and validate one clean sheet at a time.
2. Preserve 448 x 448 cells if replacing the current runtime directly, or update `sheetMeta` in one deliberate pass if moving LAMUH to a new 6 x 5 standard.
3. Keep each row mapped by canonical `lamuh_*` key.
4. Replace temporary reused row targets in `buildLamuhFinalPlayerAnimations(sheets)` with bespoke rows.
5. Let `buildLamuhFinalEnemyAnimations(sheets)` mirror the player map into `enemy_*` aliases.
6. Keep special travel, dash distance, projectile motion, hitboxes, and input routing in code, not baked into sprite frame offsets.
7. Keep old mismatched super body rows disabled by `LAMUH_ASCENDED_BODY_ATLAS_ENABLED = false`; use the approved golden-locs ascended sheet for active super coverage.

Temporary fallback rules:

- Standing light/medium/heavy must never resolve to idle or stand. They now have explicit `lamuh_stand_light`, `lamuh_stand_medium`, and `lamuh_stand_heavy` aliases to processed Sheet 1 rows 3-5.
- Super charge/fire/recovery must not use the mismatched late Crown body rows while `LAMUH_ASCENDED_BODY_ATLAS_ENABLED` is false.
- Old assets are deprecated, not deleted.

## Debug and Presentation

Hitboxes/debug boxes are not forced on by default. `state.debug` initializes false, and `H` toggles debug rendering. Presentation recording can stay clean in default mode, while dev/debug mode remains available for testing.

## Current Known Issues

- `lamuh_run` currently reuses the dash row and needs a true run row.
- Secondary movement and directional-normal cleanup aliases now have coverage-mode rows, but split rows such as forward/back directional normals and air dash/recovery still need dedicated per-move polish if the final animation pass wants more unique frames.
- The air/crouch/jump atlas is coverage-ready but not polish-final: Row 5 Air Crown Drop includes a large impact/read component in one slot, and Row 0/4/5 split rows have fewer unique frames per individual state than a future dedicated sheet could provide.
- Crown Beam now uses the dedicated neutral-special atlas Row 2 body frames plus separate Row 5/runtime beam VFX; future art can still improve the bespoke body pose, but it should preserve the body/VFX separation.
- The reactions/defense atlas is coverage-ready but not polish-final: the source's wide wall-bounce/knockdown rows carry minor edge slivers, and Row 2 frame 7 is repaired by holding Row 2 frame 6 because the generated source cell was only a shoe fragment.
- Old Sheet 8 Rows 5-7 remain deprecated as final ascended body art and are preserved only as fallback/history; active super coverage uses the golden-locs ascended atlas.

## Engine V2 Targeted Air Medium Foot Repair - 2026-08-31

- The user-reported duplicate third foot was removed from the Air Medium extension/contact artwork. The repaired candidate preserves the approved same-leg chamber, extension, single contact, retraction, knee recoil, and guarded recovery flow.
- Gameplay remains unchanged at one registered hit, `44` damage, and the recommended `21`-tick visual duration. The protected V1 source, authored root, scale contract, inputs, hitbox timing, cancel rules, and unrelated moves were not changed.
- This is a targeted visual repair only. It does not promote the full air-normal set, first playable, or production baseline.

## Engine V2 Dedicated Standard Grab and Throw Animation Candidate - 2026-08-31

No usable V1 universal-grab, forward-throw, or back-throw attacker artwork was recoverable, so these clips are explicitly classified as new V2 missing-state authoring rather than preserved legacy motion. The previous Standing Medium placeholder has been removed from all three throw paths.

| Clip | Frames | Authored visual exposure | Gameplay alignment | Motion contract |
| --- | ---: | --- | --- | --- |
| Universal grab attempt / whiff | 6 | `3 / 2 / 3 / 3 / 4 / 5` (`20` visual ticks) | Pending reach and deterministic whiff recovery retain the existing gameplay contract | Guarded entry, body-driven reach, maximum reach, secure-ready hold, whiff recoil, connected recovery |
| Forward throw | 6 | `6 / 2 / 3 / 4 / 5 / 12` (`32` ticks) | Existing connect tick `4`, release tick `14`, total `32`, damage `70`, hitstop `6` | Secure, step-in load, hip drive, decisive forward release, follow-through, guarded recovery |
| Back throw | 6 | `6 / 2 / 4 / 4 / 6 / 14` (`36` ticks) | Existing connect tick `4`, release tick `16`, total `36`, damage `75`, hitstop `7` | Secure, draw close and plant, pivot load, controlled rear redirect, side-switch release, unwind/recovery |

Normalization and visual-integrity contract:

- `18` transparent modern-style Lamuh frames use a `2048 x 1536` canvas, fixed authored root `(768, 1360)`, and one sequence-wide `2.0` scale. There is no per-frame scaling or visual recentering.
- Component-aware silhouette extraction keeps extended limbs attached and removes neighboring-cell fragments. All sequence frames are distinct, no meaningful magenta remains, no frame touches a canvas edge, and the standing-pose height delta stays within `7.5%` of the `800 px` body-height reference.
- The standard-height victim track remains deterministic and body-driven. The victim is never globally scaled or arbitrarily teleported; forward and back trajectories remain authored from Lamuh's secure, drive, pivot, and release phases.
- The dedicated attacker art changes presentation only. Deterministic 60 Hz simulation ownership, damage, hitstop, throw connect/release ticks, side-switch behavior, replay/checksum behavior, inputs, and whiff safety remain unchanged.

Review artifacts:

- Numbered contact sheet: `tools/nga-forge/review/lamuh-legacy-v2-throws-v1/throw-family-numbered-contact-sheet.png`
- Normalization evidence: `tools/nga-forge/review/lamuh-legacy-v2-throws-v1/normalization.report.json`
- Local playtest: `http://127.0.0.1:4177/lamuh-legacy-sandbox.html`

Human gate: `awaiting_human_standard_grab_forward_throw_back_throw_review`. This is a local candidate only. Required review outcomes are `APPROVED_STANDARD_GRAB`, `APPROVED_FORWARD_THROW`, and `APPROVED_BACK_THROW`, or a targeted rejection/repair status. Small, large, non-humanoid, and extreme-proportion victim classes remain `DEFERRED_NOT_BLOCKING`. No deployment or production promotion is authorized by this package.

## Engine V2 Modern Crouch and Jump Candidate - 2026-09-01

The protected four-frame V1 crouch and four-frame V1 jump sources remain unchanged and hash-locked. Their low guarded crouch and raised-knee airborne silhouettes were retained as motion references, while the obsolete purple-edged artwork was rebuilt in the approved modern Lamuh style.

| Clip | Frames | Authored exposure | Live presentation mapping |
| --- | ---: | --- | --- |
| Crouch | 6 | `3 / 3 / 6 / 6 / 4 / 4` (`26` review ticks) | Lowering entry/connector play on crouch entry; Frames 02-03 form the held low loop. Rising connector/recovery are comparison-ready, but live crouch-to-stand integration remains targeted debt. |
| Jump / fall / landing | 7 | `4 / 3 / 5 / 4 / 5 / 4 / 3` (`28` review ticks) | Jump startup uses anticipation; vertical velocity selects takeoff, rise, apex, and fall; landing recovery uses compression then guarded recovery. Simulation owns all world travel. |

Normalization and identity contract:

- All `13` frames use the existing `2048 x 1536` movement canvas and fixed authored root `(768, 1360)`.
- Each generated source sheet receives one baked camera correction (`1.63934426` crouch, `2.17391304` jump) against the `800 px` modern idle reference. There is no per-frame or runtime rescaling and no renderer-driven travel.
- Fixed-scale standing bounds are `802 px` for crouch entry, `773 px` for crouch recovery, and `802 px` for jump recovery. Crouch compression and airborne tuck intentionally reduce silhouette height without changing anatomy scale.
- Dominant-green cleanup, distant-component rejection, alpha-zero RGB clearing, and magenta rejection pass. No frame touches an edge and no meaningful purple/magenta pixels remain. The frame scrub caught and removed one neighboring-cell coat fragment from the falling connector before integration.
- Lamuh retains the approved modern identity: same face, skin tone, athletic proportions, long dark locs, white/gold coat, black clothing, cyan accents, and neutral dark linework.

Review artifacts:

- Fixed-scale numbered sheet: `tools/nga-forge/review/lamuh-legacy-v2-crouch-jump-modernization-v1/crouch-jump-numbered-contact-sheet.png`
- Normalization report: `tools/nga-forge/review/lamuh-legacy-v2-crouch-jump-modernization-v1/normalization.report.json`
- Hash lock: `NO_GODS_ABOVE/engine_v2/content-source/characters/lamuh-legacy-v2/records/crouch-jump-modernization-v1.hash-lock.json`
- Side-by-side review: `http://127.0.0.1:4177/lamuh-v1-v2-review.html`
- Combined playtest: `http://127.0.0.1:4177/lamuh-legacy-sandbox.html` using `Crouch movement` and `Jump movement`.

Technical validation passes the Lamuh deterministic/content/closure suites, production build, live crouch/rise/apex/landing browser smoke, V1/V2 comparison smoke, fixed-root evidence, and zero-purple checks. Gameplay values, jump physics, landing recovery, input routing, hitboxes, attacks, throws, and the protected legacy `game.js` remain unchanged.

Human gate: `awaiting_human_crouch_jump_standard_grab_forward_throw_back_throw_and_combined_movement_review`. Crouch motion, jump motion, scale, transitions, standard grab, forward throw, and back throw remain move-specific candidate reviews. Nothing is production-approved or deployable.

## Engine V2 Modern Dash, Air Dash, and Standing Block Candidate - 2026-09-01

The protected V1 motion remains unchanged and hash-locked. Forward/back ground-dash momentum, air-dash body arcs, coat/loc drag, and the raised-knee standing guard were retained as motion references, while the obsolete purple-edged art was rebuilt in the approved modern Lamuh style.

| Clip | Frames | Authored exposure | Simulation ownership |
| --- | ---: | --- | --- |
| Dash Forward | 6 | `3 / 3 / 3 / 3 / 3 / 3` (`18` ticks) | Existing deterministic ground travel and collision remain unchanged. |
| Dash Backward | 5 | `4 / 4 / 4 / 4 / 4` (`20` ticks) | Existing deterministic retreat travel and collision remain unchanged; the generated upright sixth pose was retired to avoid a terminal size/pose pop. |
| Air Dash Forward | 6 | `2 / 2 / 2 / 3 / 3 / 2` (`14` ticks) | Existing deterministic air travel, duration, and one-use-per-airtime rule remain unchanged. |
| Air Dash Backward | 5 | `2 / 2 / 3 / 3 / 4` (`14` ticks) | Existing deterministic air travel, duration, and one-use-per-airtime rule remain unchanged. |
| Standing Block | 4 | `4 / 4 / 4 / 4` (`16`-tick loop) | Existing block input, guard rules, hurtboxes, and combat state remain unchanged. Crouching Block was not modified. |

Normalization and identity contract:

- All `26` frames use the shared `2048 x 1536` modern-movement canvas and fixed authored root `(768, 1360)`.
- Each source sequence receives one baked scale; there is no per-frame scale, runtime rescale, visual recentering, sprite-authored travel, or renderer-driven gameplay.
- Frame scrub removed a detached neighboring-cell foot from Dash Forward and connected grey ground dust from the final Dash Backward pose. All normalized frames are unique, no frame touches an edge, and meaningful purple/magenta and bright-red artifact counts are zero.
- Lamuh retains the approved identity lock: warm-brown skin, long black locs, white/gold coat, black clothing, cyan/gold details, athletic proportions, and neutral dark ink rather than the legacy purple outline.

Review and runtime evidence:

- Normalization report: `tools/nga-forge/review/lamuh-legacy-v2-dash-block-modernization-v1/normalization.report.json`
- Per-clip numbered sheets: `tools/nga-forge/review/lamuh-legacy-v2-dash-block-modernization-v1/*-numbered-contact-sheet.png`
- Candidate hash lock: `NO_GODS_ABOVE/engine_v2/content-source/characters/lamuh-legacy-v2/records/dash-block-modernization-v1.hash-lock.json`
- Side-by-side review: `http://127.0.0.1:4177/lamuh-v1-v2-review.html`, defaulting to Dash Forward.
- Combined playtest: `http://127.0.0.1:4177/lamuh-legacy-sandbox.html` with dedicated `Dash forward`, `Dash backward`, `Air dash forward`, `Air dash backward`, and `Standing block` scenarios. Shift remains a valid dash shortcut.

Validation passes the Lamuh deterministic/content/closure suite, TypeScript/Vite production build, live comparison and sandbox browser smoke, fixed-root/hash checks, and zero-purple checks. The browser receipt records all five states using the modern movement package with zero console errors and zero failed requests.

Human gate: `awaiting_human_dash_air_dash_standing_block_crouch_jump_grab_throw_and_combined_movement_review`. This is a local candidate only. Dash, air-dash, standing-block, scale, and transition approvals remain unset; no runtime production promotion or deployment is authorized.

## Walk Back and Back Dash Directional-Motion Repair - 2026-09-01

Human playtest found that the simulation moved Lamuh backward while the prior poses still read like forward travel. Only `walk_backward` and `dash_backward` artwork was repaired. Inputs, deterministic displacement, collision, and authored durations remain unchanged.

| Clip | Frames | Authored exposure | Directional read |
| --- | ---: | --- | --- |
| Walk Back | 6 | `3 / 3 / 3 / 3 / 3 / 3` (`18` ticks, loop) | Right-facing guard, rearward foot placement and leftward weight transfer; coat and locs trail right. |
| Back Dash | 5 | `4 / 4 / 4 / 4 / 4` (`20` ticks) | Guarded recoil, backward takeoff, airborne retreat, landing catch and planted brake; no forward-sprint silhouette. |

All `11` frames use one scale per sequence, the existing `2048 x 1536` canvas, and fixed authored root `(768, 1360)`. Normalized frames are distinct, touch no canvas edge, contain no meaningful purple/magenta pixels, and remain candidate-only.

- Normalization report: `tools/nga-forge/review/lamuh-legacy-v2-backward-motion-repair-v1/normalization.report.json`
- Numbered sheets: `tools/nga-forge/review/lamuh-legacy-v2-backward-motion-repair-v1/walk-backward-numbered-contact-sheet.png` and `dash-backward-numbered-contact-sheet.png`
- Candidate hash lock: `NO_GODS_ABOVE/engine_v2/content-source/characters/lamuh-legacy-v2/records/backward-motion-repair-v1.hash-lock.json`
- Side-by-side review: `http://127.0.0.1:4177/lamuh-v1-v2-review.html`
- Combined playtest: `http://127.0.0.1:4177/lamuh-legacy-sandbox.html` using dedicated `Walk backward` and `Dash backward` scenarios.

Human gate: `awaiting_human_walk_backward_and_dash_backward_directional_review`. Neither directional repair nor its transitions are production-approved or deployable.

## Walk Back Video-Derived Supersession - 2026-09-01

The generated six-frame Walk Back candidate above is superseded for active review by a cycle reconstructed exclusively from the user-supplied walking video. Back Dash remains unchanged.

| Clip | Video source frames | Authored exposure | Runtime contract |
| --- | --- | --- | --- |
| Walk Back | `72 / 60 / 48 / 36 / 24 / 12 / 0` | `3 / 3 / 2 / 3 / 2 / 2 / 3` (`18` ticks, loop) | The approved forward-walk gait is played in reverse chronological order while right-facing simulation movement remains leftward. Fixed root `(768, 1360)` and movement physics are unchanged. |

- Supplied video SHA-256: `C3D745562609834CEB3FF3DA63047874B0A068688A104EDBF39CB67CACAB0E40`
- Source copy: `tools/nga-forge/review/lamuh-legacy-v2-forward-walk-video-v1/source/lamuh-forward-walk-user-reference-20260827.mp4`
- Normalization report: `tools/nga-forge/review/lamuh-legacy-v2-walk-back-video-rebuild-v1/normalization.report.json`
- Numbered frame scrub: `tools/nga-forge/review/lamuh-legacy-v2-walk-back-video-rebuild-v1/walk-backward-video-numbered-contact-sheet.png`
- Candidate hash lock: `NO_GODS_ABOVE/engine_v2/content-source/characters/lamuh-legacy-v2/records/walk-back-video-rebuild-v1.hash-lock.json`
- Active mapping uses `7` video-derived frames with one sequence scale (`0.8658`), fixed authored root, zero runtime/per-frame scaling, and zero meaningful purple pixels in the live smoke receipt.
- The superseded generated Walk Back frames remain historical candidate evidence only and are not referenced by the active `walk_backward` state.

Human gate: `awaiting_human_walk_backward_video_rebuild_review`. This remains a local, nondeployable candidate. Approval is unset until the reversed video gait, leftward retreat read, and entry/exit transitions pass human playtest.

## Crouching Block and Adult-Proportion Jump Identity Repair - 2026-09-01

The first two generated Crouching Block strips were rejected and preserved as review evidence: one omitted Lamuh's boxed beard and used chibi head-to-body proportions; the second restored the beard but retained excessive torso/limb compression. The active candidate restores the mature angular face, connected beard and mustache, adult torso and limb proportions, and modern outline-free rendering while preserving the four V1 low-guard beats.

| Clip | Frames | Authored exposure | Runtime contract |
| --- | ---: | --- | --- |
| Crouching Block | 4 | `3 / 3 / 4 / 6` (`16` ticks, final-frame hold) | Existing block input, crouch-block flag, hurtboxes, and combat rules remain simulation-owned. |
| Jump / Fall / Landing | 7 | `4 / 3 / 5 / 4 / 5 / 4 / 3` (`28` review ticks) | Existing timing and physics-driven takeoff/rise/apex/fall/landing selection remain unchanged. |

Both sequences use the shared `2048 x 1536` movement canvas, fixed authored root `(768, 1360)`, and one baked scale per sequence. The Jump standing recovery matches the modern Idle visible height within `0.25%`; no per-frame or runtime scale correction is used. Normalization reports record zero edge touches, zero meaningful purple/magenta pixels, zero bright-red fringe, and unique frame hashes.

- Crouching Block numbered scrub: `tools/nga-forge/review/lamuh-legacy-v2-crouching-block-modernization-v1/crouching-block-numbered-contact-sheet.png`
- Jump numbered scrub: `tools/nga-forge/review/lamuh-legacy-v2-jump-adult-proportion-repair-v1/jump-adult-proportion-numbered-contact-sheet.png`
- Rejected Crouching Block evidence: `tools/nga-forge/review/lamuh-legacy-v2-crouching-block-modernization-v1/rejected-generations.candidate.v1.json`
- Crouching Block hash lock: `NO_GODS_ABOVE/engine_v2/content-source/characters/lamuh-legacy-v2/records/crouching-block-modernization-v1.hash-lock.json`
- Jump repair hash lock: `NO_GODS_ABOVE/engine_v2/content-source/characters/lamuh-legacy-v2/records/jump-adult-proportion-repair-v1.hash-lock.json`
- Readiness audit: `NO_GODS_ABOVE/engine_v2/content-source/characters/lamuh-legacy-v2/NORMALS_IDLE_TRANSITION_READINESS_AUDIT.md`

The comparison and sandbox browser smoke pass with both states using `modern_movement`, zero purple fallback, and unchanged deterministic combat authority. This remains a local candidate. Beard/adult identity, Crouching Block motion, Jump motion, and combined transitions require human approval before starting broader specials production.

## Engine V2 Live Crouch-to-Stand Transition Integration - 2026-09-02

The modern Crouch package already contained an authored rising connector and standing recovery at the approved fixed root and adult anatomy scale. Those two frames are now reused directly instead of generating replacement art.

| Clip | Frames | Authored exposure | Runtime contract |
| --- | ---: | --- | --- |
| Crouch to Stand | Crouch Frames `04-05` | `4 / 4` (`8` visible ticks) | Explicit deterministic `crouch_release` phase; standing gameplay boxes apply immediately; attack, jump, dash, crouch, walk, or block input interrupts without waiting for the visual recovery. |

- Canvas/root remain `2048 x 1536` and `(768, 1360)` with no per-frame or runtime rescaling.
- The renderer reads the simulation phase and never owns transition state.
- V1 had no dedicated crouch-release clip, so the comparison route labels the V1 side unavailable instead of disguising V2 missing-state work as preserved source art.
- Replay checksums reproduce exactly; the focused regression also proves Standing Light and Walk Forward preempt the release immediately.
- Browser evidence records `phase: crouch_release`, `visualPackage: modern_movement`, and zero meaningful purple pixels.

Review artifacts:

- Comparison capture: `NO_GODS_ABOVE/engine_v2/artifacts/lamuh-legacy-v2/v1-v2-crouch-release-live-transition-review.png`
- Sandbox capture: `NO_GODS_ABOVE/engine_v2/artifacts/lamuh-legacy-v2/crouch-release-live-transition.png`
- Candidate record: `NO_GODS_ABOVE/engine_v2/content-source/characters/lamuh-legacy-v2/moves/crouch/release-transition.candidate.v1.json`

Human decision (2026-09-02): `APPROVED_V1_MOTION_PRESERVED` for `crouch_to_stand_motion_and_transition_only`, recorded from the user's `passes` response in `records/crouch-release-v1.approval.json`. V1 had no dedicated release clip, so this status accepts the preservation-first V2 connector and flow rather than claiming a one-to-one legacy clip. The whole fighter, combined movement, combat profile, production baseline, and deployment remain unapproved. Dedicated turn/facing art is the next transition gate, and broader specials production remains stopped.

## Engine V2 Dedicated Turn / Facing Transition Candidate - 2026-09-02

The V1 audit found no dedicated Lamuh turn/facing clip. V2 therefore treats this as explicit missing-state authoring, not preserved legacy footage. The candidate keeps the approved adult Idle identity, boxed beard and mustache, long loc silhouette, white coat/gold trim/cyan sash design, and outline-free game style.

| Clip | Frames | Authored exposure | Runtime contract |
| --- | ---: | --- | --- |
| Turn / Facing | `ready entry / rear three-quarter pivot / weight transfer / settle` | `2 / 3 / 3 / 4` (`12` visible ticks) | Gameplay facing swaps on tick `0`; fixed-root presentation reads `turnStartingFacing`; the opposite direction mirrors the whole canonical sequence; every normal movement, defense, jump, dash, throw, or attack input may interrupt immediately. |

- All four frames use one sequence normalization scale, the shared `2048 x 1536` movement canvas, and fixed root `(768, 1360)`; there is no per-frame renderer scale or visual recentering.
- Normalized visible-height spread is `2%` and the Idle median-height delta is `0.12%`.
- Normalization found four unique frames and zero meaningful purple/magenta pixels.
- The first generation is retained as rejected evidence because it baked a checkerboard background and repeated the settle pose.
- Renderer state never drives gameplay facing, collision, input, replay, rollback, or checksums.
- Turn-only deterministic state joins the checksum projection while active; historical pre-turn checksum fixtures remain byte-compatible.

Review artifacts:

- Numbered contact sheet: `tools/nga-forge/review/lamuh-legacy-v2-turn-facing-modernization-v1/turn-facing-numbered-contact-sheet.png`
- Normalization report: `tools/nga-forge/review/lamuh-legacy-v2-turn-facing-modernization-v1/normalization.report.json`
- Hash lock: `NO_GODS_ABOVE/engine_v2/content-source/characters/lamuh-legacy-v2/records/turn-facing-modernization-v1.hash-lock.json`
- Candidate contract: `NO_GODS_ABOVE/engine_v2/content-source/characters/lamuh-legacy-v2/moves/turn-facing/visual-modernization.candidate.v1.json`

Human decision (2026-09-02): `APPROVED_FOR_CURRENT_PRODUCTION_BASELINE_WITH_POLISH_DEBT` for `turn_facing_motion_mirrored_parity_and_transition_only`, recorded from the user's `passes but star this one because we may come back to it` response in `records/turn-facing-v1.approval.json`. The clip is visibly marked `★ revisit`; this is not final production approval. No combined-fighter approval, combat-profile approval, runtime promotion, deployment, merge, push, or PR is implied. The current gate advances to independent Standard Grab, Forward Throw, and Back Throw review, and broader specials production remains stopped.

## Standard Grab / Throw Approval and Ascend Step L/M/H V2 Family - 2026-09-03

Human decision: `APPROVED_STANDARD_GRAB`, `APPROVED_FORWARD_THROW`, and `APPROVED_BACK_THROW` for the dedicated attacker motion, standard-height humanoid interaction, and neutral transitions. The scoped receipt is `NO_GODS_ABOVE/engine_v2/content-source/characters/lamuh-legacy-v2/records/standard-grab-throw-family-v1.approval.json`. This does not approve alternate victim classes, the throw combat profile, runtime art promotion, the whole first playable, production, or deployment.

Ascend Step is the first active special-family gate. Its seven protected V1 source poses remain hash-locked and unmodified. The earlier V2 rising-palm/airborne-strike, fixed-root backflip, and simultaneous double-leg handspring versions remain preserved as rejected or superseded evidence. Light keeps the movement-first dash-punch and Heavy keeps the approach/behind-switch/blast candidate. Medium now uses the targeted repair requested at the human gate: a traveling low slide kick retracts into a dedicated coil, both hands reach backward and plant, one heel becomes the clear asymmetric rising launcher while the other leg bends for counterbalance, then a separately authored tuck resolves into a compressed two-foot landing.

| Strength | Candidate A | Candidate B (recommended) | Candidate C | Gameplay role |
| --- | ---: | ---: | ---: | --- |
| Light | `18` ticks | `20` ticks | `23` ticks | Shortest travel, fastest recovery, lowest reward, no knockdown |
| Medium | `44` ticks | `48` ticks | `52` ticks | Traveling low slide contact into planted-hands back-handspring and one rising-heel launcher contact |
| Heavy | `38` ticks | `42` ticks | `46` ticks | Approach, legal behind-target side switch, one high-impact rear blast |

- Light retains six distinct poses assembled from approved `idle`, `dash_forward`, and `standing_light` runtime frames. Medium has sixteen distinct frames: seven exact approved slide/recovery frames plus nine animation frames derived from six bounded missing-state sources (coil, backward two-hand reach, plant, asymmetric rising heel, post-contact tuck, and landing). Three missing-state in-betweens use rigid rotation only. Heavy retains ten distinct frames: approved Idle aura load, two approved dash poses, VFX-only teleport streak, approved reappearance, pause, growing orb, one blast contact, approved recoil, and approved Idle recovery.
- Medium keeps one locked authored character scale with no per-frame body scaling. Its source-canvas anchor remains stable while deterministic simulation-owned root segments visibly carry Lamuh forward through the slide and redirect him backward through the handspring. Only Heavy's teleport-streak frame intentionally omits the body.
- The Heavy arm-continuity repair keeps both arms and the whole body readable. Charge and blast effects are isolated VFX-only sources composited over untouched approved body sprites, preventing body transparency and preserving the complete cyan-white/gold effect.
- All frames share the `2048 x 1536` canvas. Chibi scaling, generated face changes, purple outlines, arbitrary body cutouts, and off-canvas body cropping are forbidden.
- Adult identity remains a hard gate across every frame: mature face, boxed beard and mustache, long black locs, adult torso/limb proportions, white/gold coat, black clothing, and cyan sash.
- The deterministic simulation owns all travel and contacts. Light uses root motion on ticks `2-7`. Medium moves forward on ticks `2-11`, redirects on ticks `12-16`, continues the backward handspring on ticks `17-26`, and settles on ticks `27-33`; its slide hitbox is active on ticks `7-9` and its rising-heel launcher on ticks `26-28`. Heavy approaches on ticks `4-11`, switches on tick `14` only when legal and within `150` units, never moves the victim, and activates its only hit on ticks `24-28` after the authored pause and growth.
- Recommended combat candidates are Light `32` damage / `5` hitstop, Medium `70` base damage over two hits (`26` plus `44`, `66` expected after route scaling) with `5` then `8` hitstop, and Heavy `84` / `9`. Medium has exactly two visible contacts and exactly two registered hits; Light and Heavy remain one-hit. Renderer timing never drives gameplay, replay, rollback, or checksums.
- VFX-only sources are hash-locked: Light/Medium dash aura `EDD5B9DD5C0861010814DDCE061AC22FA29CDACC1F1EFB0A6E38F562B4D864DF`; Heavy charge/blast `03C12E1613BD5684FC3DB960D76AA23745A9D3D06B673A894CBA611304EED743`. Body identity is locked separately by the exact approved source-frame hashes in each normalization report.

Review artifacts:

- Light numbered sheet: `tools/nga-forge/review/lamuh-legacy-v2-ascend-step-dash-punch-v2/ascend-step-dash-punch-numbered-contact-sheet.png`
- Light normalization report: `tools/nga-forge/review/lamuh-legacy-v2-ascend-step-dash-punch-v2/normalization.report.json`
- Medium numbered sheet: `tools/nga-forge/review/lamuh-legacy-v2-ascend-step-medium-slide-flip-v1/ascend-step-medium-slide-flip-numbered-contact-sheet.png`
- Medium root-path overlay: `tools/nga-forge/review/lamuh-legacy-v2-ascend-step-medium-slide-flip-v1/ascend-step-medium-authored-root-path-overlay.png`
- Medium silhouette sheet: `tools/nga-forge/review/lamuh-legacy-v2-ascend-step-medium-slide-flip-v1/ascend-step-medium-silhouette-only-sheet.png`
- Medium slide/coil/plant close-up: `tools/nga-forge/review/lamuh-legacy-v2-ascend-step-medium-slide-flip-v1/ascend-step-medium-slide-coil-hand-plant-closeup.png`
- Medium handspring/rising-kick close-up: `tools/nga-forge/review/lamuh-legacy-v2-ascend-step-medium-slide-flip-v1/ascend-step-medium-handspring-rising-kick-closeup.png`
- Medium VFX-off sheet: `tools/nga-forge/review/lamuh-legacy-v2-ascend-step-medium-slide-flip-v1/ascend-step-medium-vfx-off-numbered-sheet.png`
- Medium old-vs-repaired sheet: `tools/nga-forge/review/lamuh-legacy-v2-ascend-step-medium-slide-flip-v1/ascend-step-medium-old-vs-repaired-comparison.png`
- Medium normalization report: `tools/nga-forge/review/lamuh-legacy-v2-ascend-step-medium-slide-flip-v1/normalization.report.json`
- Heavy numbered sheet: `tools/nga-forge/review/lamuh-legacy-v2-ascend-step-heavy-v1/ascend-step-heavy-numbered-contact-sheet.png`
- Heavy normalization report: `tools/nga-forge/review/lamuh-legacy-v2-ascend-step-heavy-v1/normalization.report.json`
- Candidate locks: `NO_GODS_ABOVE/engine_v2/content-source/characters/lamuh-legacy-v2/records/ascend-step-dash-punch-v2.hash-lock.json`, `ascend-step-medium-slide-flip-v1.hash-lock.json`, and `ascend-step-heavy-v1.hash-lock.json`
- Forge packages: `moves/ascend-step-light/animation.package.json`, `moves/ascend-step/animation.package.json`, and `moves/ascend-step-heavy/animation.package.json`
- Live playtest route: `http://127.0.0.1:4177/lamuh-legacy-sandbox.html` with the arena left open at full-body framing.

The focused Lamuh suite, TypeScript/Vite build, Forge compilation, and live browser smoke pass. Browser evidence confirms Lamuh-vs-Lamuh rendering, visible arena bounds `[-280, 280]`, the first grounded slide hit, the second upward launch hit, the authored post-contact tuck, `66` total scaled route damage, and two deterministic presentation events. Forge compilation produced all `27` first-playable packages. Protected `game.js` remains SHA-256 `D081DA2D907CF6ABD978301C1637008B26CCB30B47E2CCAFCA3FEA3331910C6B`. Current status is `awaiting_human_ascend_step_medium_targeted_motion_repair_review`; the full-body sandbox is open at 1x for human verification. No next special, promotion, deployment, merge, push, or PR is authorized.
# 2026-09-05 — Lamuh Legacy V2 quality candidate addendum

The Engine V2 sandbox now has a separate 12-frame adult-proportion reaction candidate for light/heavy response, launch/fall, ground state and get-up. It uses individual normalized source frames, one fixed sequence scale, simulation-state-selected one-shot playback, and an additive five-animation Forge bundle. Existing movement, normals, Ascend Step family and accepted throw body artwork is preserved: 185 current frames are hash-locked by `engine_v2/content-source/characters/lamuh-legacy-v2/quality-preserved-art.lock.json`.

Contact feedback is now an independently rendered, collision-triggered sprite-socket layer; it does not replace the body with a separately redrawn composite. Down Heavy's rejected decoration remains off. Legacy fallback/composites remain accessible only through the explicit previous-visual comparison. The sandbox preloads all frame sources before running and offers a clean full-body playtest.

Status: candidate-only, deployable false. New reactions and impact feedback have **not** received human approval. Support-foot registration through recoil/get-up and Ascend M heel-to-victim contact height remain starred review debt. A fixed canvas root is not proof of an anatomically planted foot. The prior scoped pushbox provisional pass is recorded without promoting animation or the character.

See [quality benchmark and current moveset audit](../engine_v2/content-source/characters/lamuh-legacy-v2/QUALITY_BENCHMARK_AUDIT_2026-09-05.md) for ArcSys reference sources, verified timing/roles, core cancel/placeholder/reaction fixes, evidence, applied NGA skills and the next human gate. Historical material below remains preserved and should not be mistaken for current implemented coverage.

# 2026-09-05 — special-family progress and distinct cinematic Heavy

Newest review state: forward Ascend L/M/H provisionally accepted/starred; Celestial Palm L/M/H passed the shown current-family baseline, not whole-character/art promotion. Both decisions retain exact frame/B-profile hashes. Palm projectiles are real simulation-owned detached shots, not body-hitbox stand-ins.

Heaven Splitter Up+Special L/M/H is the next pending family:36/43/53 ticks with one uppercut and explicit simulation-owned16/40/64-height hops. The legacy seven-pose rising arc remains available for comparison; its shrinking sprites and detached sandal were not reproduced. Adult near-arm performance is explicitly a modernization of the legacy far-arm motion, not falsely declared exact reuse.

At the user's request Heavy V2 now has14 separately authored active poses: idle→sink→wind-back→coil→rising connector→one uppercut→full extension→apex release→gather→landing approach→two-foot catch→settle→guard→idle. Light/Medium's11-pose performances stay unchanged. New H art uses documented per-source camera calibration, no per-frame height normalization. A narrow separate ki arc, background framing and a short confirmed-hit camera impulse strengthen Heavy without extra hits, body zoom, victim teleport or cinematic lock.

Individual normalized RGBA source folders: `heaven-splitter-frames-v1/` and `heaven-heavy-frames-v2/` under the Lamuh Engine V2 content source. Previous shared-Light H closure is retained in `records/heaven-heavy-v1.extended-light.rejection.json`. New sources remain candidates. See [special-family review checkpoint](../engine_v2/content-source/characters/lamuh-legacy-v2/SPECIAL_FAMILY_REVIEW_2026-09-05.md) for exact gameplay, source, validation and review-debt boundaries.

## Follow-up — Heavy authored aura V3

The user requested aura around the uppercut, then clarified it must be part of the animation itself. V3 uses composite individual PNG source frames in `heaven-heavy-aura-frames-v3/`: aura cels3–7 match coil, rising connector, contact, extension and apex fade. Body-only V2 frames and exact idle endpoints remain preserved. The existing editable aura was exported deterministically rather than redrawing the character; all fully opaque body pixels compare unchanged. Same14-pose/53-tick/one-hit motion and combat. The runtime and comparison consume the aura-bearing sprites directly and do not draw another aura overlay. VFX-off uses retained clean body sources. No new aura spawn event in the Heavy Forge package; hit-confirmed feedback remains separate. Candidate-only pending human review.

## Latest follow-up — proper surrounding aura redraw V4

### 2026-09-07 forward-family follow-up

Sandbox forward L/M/H now use separate `forward-clean-v1/manifest.json` candidates with flowing cyan-white-gold aura matching newer offensive moves. Light: nine slots/20 ticks/one contact at5; Medium: sixteen slots/48 ticks/contacts7 and26; Heavy: eleven slots/42 ticks/contact24. New individual source frames reside in `forward-light-clean-v2`, `forward-medium-connectors-v4`, and `ascend-heavy-clean-v2`; older art and Divine shared sources remain unchanged. Human motion review pending; Heavy old two-tick disappearance remains polish debt. This is sandbox-only candidate integration, not production or legacy comparison promotion.

User requested the sprite sheet itself be redone. Six newly illustrated release poses now carry flowing cyan/white/gold energy around the whole body and rising fist in `heaven-heavy-aura-redraw-frames-v4/`. These replace active slots3–8 only; other eight slots and the53-tick/one-hit/80-damage profile remain unchanged. Aura continues as contracting wisps through tick34 and is absent from landing approach at35. Corrected whitespace slicing and near-magenta unmix preserve the complete aura and white clothing, with one fixed original release scale and root; no body-height normalization. V3 remains protected history, not the active aura target.

VFX-off/silhouette now mean previous clean-pose comparison, not pixel-identical aura removal from the regenerated art. Runtime and Forge do not add a second aura. Six-frame and complete14-frame contact sheets, raw sources, exact prompts, alpha/crop/hash report: `tools/nga-forge/review/lamuh-legacy-v2-heaven-heavy-aura-redraw-v4/` from repository root. Static normalization/independent art review and focused content/build tests pass; current motion evidence and approval boundary are documented in the special-family checkpoint. Human review remains pending; no promotion or deployment.
