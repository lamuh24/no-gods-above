# LAMUH Animation Manifest and Sprite-Sheet Remake Plan

Last updated: 2026-06-06
Agent: Codex

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
