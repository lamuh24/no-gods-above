# Nyx Sprite Import And Atlas Guide

Use this guide for Nyx final-art maintenance and for future new-generation character imports based on the Nyx pipeline. This is a visual/import workflow only. Keep gameplay config, hitboxes, movement, cancels, damage, hitstun, blockstun, launch values, knockback, combo routes, and special flags unchanged unless a separate tuning pass is explicitly requested.

## Current Baseline

- Stable gameplay checkpoint: `nyx-gameplay-placeholder-v1`.
- Nyx is playable now through `characterProfiles.nyx` in `game.js`.
- Nyx uses dedicated final atlases under `assets/sprites/nyx_final/`.
- Nyx uses `assets/sprites/portraits/nyx_select.png` for character select.
- Kairo and Vanta are legacy fighters and should not be modified during Nyx or future-character import work.
- If Nyx art is replaced later, update only Nyx asset paths, sheet metadata, sheet keys, custom animation mappings if needed, and select portrait.

## Runtime Folder

Place final Nyx runtime sheets here:

```text
NO_GODS_ABOVE/assets/sprites/nyx_final/
```

Current Nyx final atlas filenames:

```text
nyx_sheet_1_core_movement_atlas.png
nyx_sheet_2_air_movement_atlas.png
nyx_sheet_3_ground_normals_atlas.png
nyx_sheet_4_air_normals_atlas.png
nyx_sheet_5_specials_atlas.png
nyx_sheet_6_defense_hit_reactions_atlas.png
nyx_sheet_7_knockdown_recovery_flavor_atlas.png
```

Place the character select portrait here:

```text
NO_GODS_ABOVE/assets/sprites/portraits/nyx_select.png
```

## Sprite Sheet Format

Each clean runtime atlas should be:

- 320x320 cells.
- Transparent runtime background after extraction.
- No text, labels, debug baselines, grid lines, UI, or title graphics.
- Bottom-center anchored, with grounded feet aligned to the same invisible baseline.
- Character motion contained inside cells; dash, projectile, teleport, and special travel remain code-driven.
- Sheet dimensions may vary by move family, but must match `sheetMeta` and `nyx_final_atlas_manifest.json`.

Debug or baseline reference sheets are optional diagnostics only. Do not wire debug sheets into runtime.

## Sheet Row Map

Nyx uses a custom seven-sheet layout and custom animation builders in `game.js`: `buildNyxFinalPlayerAnimations()` and `buildNyxFinalEnemyAnimations()`.

| Sheet | Runtime Key | Rows |
|---|---|---|
| Sheet 1 - Core Movement | `nyxFinalCoreMovement` | `idle`, `walk_forward`, `walk_back`, `dash`, `dash_back`, `crouch` |
| Sheet 2 - Air Movement | `nyxFinalAirMovement` | `jump_up`, `jump_forward`, `jump_back`, `fall`, `air_dash_forward`, `air_dash_back` |
| Sheet 3 - Ground Normals | `nyxFinalGroundNormals` | `light_attack`, `medium_attack`, `heavy_attack`, `launcher` |
| Sheet 4 - Air Normals | `nyxFinalAirNormals` | `air_light`, `air_medium`, `air_heavy`, `air_recovery` |
| Sheet 5 - Specials | `nyxFinalSpecials` | `shadow_step_start`, `shadow_step_travel`, `shadow_step_end`, `falling_slash_start`, `falling_slash_active`, `falling_slash_land`, `rapid_flurry` |
| Sheet 6 - Defense / Hit Reactions | `nyxFinalDefense` | `stand_block`, `crouch_block`, `air_block`, `light_hitstun`, `medium_hitstun`, `heavy_hitstun`, `launch_hitstun`, `air_hitstun` |
| Sheet 7 - Knockdown / Recovery / Flavor | `nyxFinalEndStates` | `knockdown_fall`, `grounded`, `recovery_get_up`, `ko_defeat`, `intro`, `victory`, `taunt` |

Rows are named in this document. Runtime animation objects use zero-based row indexes internally.

## Frame Counts

Frame counts vary by sheet. Use the manifest and `sheetMeta` as the source of truth:

- Core Movement: 6 columns x 6 rows.
- Air Movement: 6 columns x 6 rows.
- Ground Normals: 8 columns x 4 rows.
- Air Normals: 6 columns x 4 rows.
- Specials: 10 columns x 7 rows.
- Defense / Hit Reactions: 6 columns x 8 rows.
- Knockdown / Recovery / Flavor: 8 columns x 7 rows.

If an animation has fewer unique poses than runtime cells, duplicate held poses inside the row. Do not change gameplay timing to match the art. Attack timing comes from Nyx's `attackDef()` values, not from the number of unique drawn frames.

## Code Updates For Real Nyx Art

Make visual-only edits in `game.js`.

1. Keep Nyx final sheet paths in `assetPaths`:

```js
nyxFinalCoreMovement: "assets/sprites/nyx_final/nyx_sheet_1_core_movement_atlas.png",
nyxFinalAirMovement: "assets/sprites/nyx_final/nyx_sheet_2_air_movement_atlas.png",
nyxFinalGroundNormals: "assets/sprites/nyx_final/nyx_sheet_3_ground_normals_atlas.png",
nyxFinalAirNormals: "assets/sprites/nyx_final/nyx_sheet_4_air_normals_atlas.png",
nyxFinalSpecials: "assets/sprites/nyx_final/nyx_sheet_5_specials_atlas.png",
nyxFinalDefense: "assets/sprites/nyx_final/nyx_sheet_6_defense_hit_reactions_atlas.png",
nyxFinalEndStates: "assets/sprites/nyx_final/nyx_sheet_7_knockdown_recovery_flavor_atlas.png",
```

2. Keep Nyx metadata in `sheetMeta` aligned with the actual atlas dimensions:

```js
nyxFinalCoreMovement: { cols: 6, rows: 6, cellSize: 320, baselineY: 300, scale: 1.0, framePad: 2, anchorMode: "lockedFrameBottomCenter" },
nyxFinalAirMovement: { cols: 6, rows: 6, cellSize: 320, baselineY: 300, scale: 1.0, framePad: 2, anchorMode: "lockedFrameBottomCenter" },
nyxFinalGroundNormals: { cols: 8, rows: 4, cellSize: 320, baselineY: 300, scale: 1.0, framePad: 2, anchorMode: "lockedFrameBottomCenter", allowDetachedEffects: true },
nyxFinalAirNormals: { cols: 6, rows: 4, cellSize: 320, baselineY: 300, scale: 1.0, framePad: 2, anchorMode: "lockedFrameBottomCenter", allowDetachedEffects: true },
nyxFinalSpecials: { cols: 10, rows: 7, cellSize: 320, baselineY: 300, scale: 1.0, framePad: 2, anchorMode: "lockedFrameBottomCenter", allowDetachedEffects: true },
nyxFinalDefense: { cols: 6, rows: 8, cellSize: 320, baselineY: 300, scale: 1.0, framePad: 2, anchorMode: "lockedFrameBottomCenter" },
nyxFinalEndStates: { cols: 8, rows: 7, cellSize: 320, baselineY: 300, scale: 1.0, framePad: 2, anchorMode: "lockedFrameBottomCenter" }
```

Only use `allowDetachedEffects` on attack, air, and special sheets where detached effects are intentional and contained in the cell. Movement, defense, and end-state sheets should stay body-only.

3. Keep `characterProfiles.nyx.sheets` pointed at Nyx keys:

```js
sheets: {
  coreMovement: "nyxFinalCoreMovement",
  airMovement: "nyxFinalAirMovement",
  groundNormals: "nyxFinalGroundNormals",
  airNormals: "nyxFinalAirNormals",
  defense: "nyxFinalDefense",
  specials: "nyxFinalSpecials",
  endStates: "nyxFinalEndStates"
}
```

4. Keep placeholder notes clear so future agents do not mistake Nyx final atlases for Kairo placeholder art.

5. In `index.html`, update Nyx's select-card image from `assets/sprites/portraits/kairo_select.png` to:

```html
assets/sprites/portraits/nyx_select.png
```

Do not edit Kairo or Vanta sheet mappings during this pass.

## Animation References

Nyx uses custom final animation mappers in `game.js` and hydrates into:

- `profile.playerAnimations`
- `profile.enemyAnimations`
- `profile.animationReferences`

Keep move/action names stable so combat logic still resolves actions such as `neutral_light`, `down_heavy`, `jump_medium`, `special_1`, `special_2`, and `special_3`.

## Preserve Gameplay Values

Do not touch these Nyx config sections for an art-only import:

- `health`
- `movement`
- `jump`
- `airDash`
- `attacks`
- `comboRoutes`
- `hitboxes`
- `hurtboxes`
- `specialMoves`
- `ai`
- `projectileColor`
- `trailColor`

Changing these sections is gameplay tuning, not sprite import.

## Import Test Checklist

After importing real Nyx sprites:

1. Run a syntax check:

```powershell
node --check NO_GODS_ABOVE\game.js
```

2. Start or reuse the local static server and open Training Mode.
3. Select Nyx from character select.
4. Confirm the HUD shows `NYX` and the select card uses `nyx_select.png`.
5. Confirm Nyx loads with real sheets in these states:
   - idle
   - walk forward/back
   - dash
   - crouch
   - block/hurt/knockback/get-up
   - light/medium/heavy
   - launcher
   - air light/medium/heavy
   - Shadow Step
   - Falling Slash / Dive Kick
   - Rapid Flurry
   - Super Dash
   - knockdown/death
6. Toggle hitbox debug and verify hurtboxes still roughly match Nyx's body.
7. Smoke test matchups:
   - Kairo vs Vanta still works.
   - Nyx vs Kairo works.
   - Vanta vs Nyx works.
   - Direct Kairo vs Nyx still works if a test harness or future opponent selector is available.
8. Confirm existing combat feedback still works:
   - combo counter
   - hit sparks
   - hit stop
   - camera shake
   - launchers
   - air combos
   - knockdown/recovery
   - damage scaling
   - hitstun decay

If the art appears too large, too small, cropped, or vertically offset, adjust only Nyx's `sheetMeta` scale/baseline/padding values. Do not compensate by changing Nyx hitboxes or combat movement unless a separate gameplay tuning pass is requested.
