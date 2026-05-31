# Nyx Real Sprite Import Guide

Use this guide when Nyx's final artwork is ready. This is a visual-swap workflow only. Keep Nyx's gameplay config, hitboxes, movement, cancels, damage, hitstun, blockstun, launch values, knockback, combo routes, and special flags unchanged unless a separate tuning pass is explicitly requested.

## Current Baseline

- Stable gameplay checkpoint: `nyx-gameplay-placeholder-v1`.
- Nyx is playable now through `characterProfiles.nyx` in `game.js`.
- Nyx currently points at Kairo Final sheets as temporary placeholder art.
- Real Nyx sprites should replace only the sheet keys, asset paths, sheet metadata, and select portrait.

## Runtime Folder

Place final Nyx runtime sheets here:

```text
NO_GODS_ABOVE/assets/sprites/nyx_final/
```

Use these filenames:

```text
nyx_sheet_1_basic_movement.png
nyx_sheet_2_defense_recovery.png
nyx_sheet_3_core_attacks_a.png
nyx_sheet_4_core_attacks_b.png
nyx_sheet_5_low_air.png
nyx_sheet_6_specials_ultimate.png
nyx_sheet_7_end_states_extras.png
```

Place the character select portrait here:

```text
NO_GODS_ABOVE/assets/sprites/portraits/nyx_select.png
```

## Sprite Sheet Format

Each clean runtime sheet should be:

- 6 columns x 5 rows.
- 6 frames per animation row.
- 5 animation rows per sheet.
- 320x320 cells.
- 1920x1600 total image size.
- Solid `#ff00ff` magenta background.
- No text, labels, debug baselines, grid lines, UI, or title graphics.
- Bottom-center anchored, with grounded feet aligned to the same invisible baseline.
- Character motion contained inside cells; dash, projectile, teleport, and special travel remain code-driven.

Debug or baseline reference sheets are optional diagnostics only. Do not wire debug sheets into runtime.

## Sheet Row Map

The existing final-fighter animation mapper expects this seven-sheet layout.

| Sheet | Row 1 | Row 2 | Row 3 | Row 4 | Row 5 |
|---|---|---|---|---|---|
| Sheet 1 - Basic Movement | `idle` | `walk_forward` | `walk_back` | `dash` | `crouch` |
| Sheet 2 - Defense / Recovery | `stand_up` | `guard_idle` | `hurt` | `knockback` | `get_up` |
| Sheet 3 - Core Attacks A | `neutral_light` | `neutral_medium` | `neutral_heavy` | `forward_light` | `forward_medium` |
| Sheet 4 - Core Attacks B | `forward_heavy` | `back_light` | `back_medium` | `back_heavy` | `taunt` |
| Sheet 5 - Low / Air | `down_light` | `down_medium` | `down_heavy` | `jump_light` | `jump_medium` |
| Sheet 6 - Specials / Ultimate | `jump_heavy` | `special_1` | `special_2` | `special_3` | `ultimate` |
| Sheet 7 - End States / Extras | `death` | `victory` | `level_up` | `intro_pose` | `select_idle` |

Rows are one-based in this document. Runtime animation objects use zero-based row indexes internally through the shared final-fighter mapper.

## Frame Counts

Keep every row at 6 frames.

If an animation only needs 2 or 3 unique poses, duplicate held poses inside the 6-frame row. Do not change gameplay timing to match the art. Attack timing comes from Nyx's `attackDef()` values, not from the number of unique drawn frames.

If a future sheet absolutely must use a different frame count, update the animation references and mapper deliberately, then test all three existing fighters. The preferred path is still to normalize Nyx art into the current 6-frame row format.

## Code Updates For Real Nyx Art

Make visual-only edits in `game.js`.

1. Add Nyx final sheet paths to `assetPaths`:

```js
nyxFinalBasic: "assets/sprites/nyx_final/nyx_sheet_1_basic_movement.png",
nyxFinalDefense: "assets/sprites/nyx_final/nyx_sheet_2_defense_recovery.png",
nyxFinalCoreA: "assets/sprites/nyx_final/nyx_sheet_3_core_attacks_a.png",
nyxFinalCoreB: "assets/sprites/nyx_final/nyx_sheet_4_core_attacks_b.png",
nyxFinalLowAir: "assets/sprites/nyx_final/nyx_sheet_5_low_air.png",
nyxFinalSpecials: "assets/sprites/nyx_final/nyx_sheet_6_specials_ultimate.png",
nyxFinalEnd: "assets/sprites/nyx_final/nyx_sheet_7_end_states_extras.png",
```

2. Add Nyx metadata to `sheetMeta`. Start from the Kairo Final metadata when Nyx sheets are 1920x1600 with 320x320 cells:

```js
nyxFinalBasic: { cols: 6, rows: 5, cellSize: 320, baselineY: 300, scale: 1.38, framePad: 2, anchorMode: "lockedFrameBottomCenter" },
nyxFinalDefense: { cols: 6, rows: 5, cellSize: 320, baselineY: 300, scale: 1.38, framePad: 2, anchorMode: "lockedFrameBottomCenter" },
nyxFinalCoreA: { cols: 6, rows: 5, cellSize: 320, baselineY: 300, scale: 1.38, framePad: 2, anchorMode: "lockedFrameBottomCenter", allowDetachedEffects: true },
nyxFinalCoreB: { cols: 6, rows: 5, cellSize: 320, baselineY: 300, scale: 1.38, framePad: 2, anchorMode: "lockedFrameBottomCenter", allowDetachedEffects: true },
nyxFinalLowAir: { cols: 6, rows: 5, cellSize: 320, baselineY: 300, scale: 1.42, framePad: 2, anchorMode: "lockedFrameBottomCenter", allowDetachedEffects: true },
nyxFinalSpecials: { cols: 6, rows: 5, cellSize: 320, baselineY: 300, scale: 1.42, framePad: 2, anchorMode: "lockedFrameBottomCenter", allowDetachedEffects: true },
nyxFinalEnd: { cols: 6, rows: 5, cellSize: 320, baselineY: 300, scale: 1.38, framePad: 2, anchorMode: "lockedFrameBottomCenter" },
```

Only use `allowDetachedEffects` on attack, air, and special sheets where detached effects are intentional and contained in the cell. Movement, defense, and end-state sheets should stay body-only.

3. Update `characterProfiles.nyx.sheets`:

```js
sheets: {
  basic: "nyxFinalBasic",
  defense: "nyxFinalDefense",
  coreA: "nyxFinalCoreA",
  coreB: "nyxFinalCoreB",
  lowAir: "nyxFinalLowAir",
  specials: "nyxFinalSpecials",
  end: "nyxFinalEnd"
}
```

4. Remove or update `placeholderArt: "kairoFinal"` so future agents do not mistake the real art for a placeholder.

5. In `index.html`, update Nyx's select-card image from `assets/sprites/portraits/kairo_select.png` to:

```html
assets/sprites/portraits/nyx_select.png
```

Do not edit Kairo or Vanta sheet mappings during this pass.

## Animation References

Nyx currently uses the same final-fighter animation map as Kairo and Vanta. The shared mapper is built in `game.js` and hydrates each profile into:

- `profile.playerAnimations`
- `profile.enemyAnimations`
- `profile.animationReferences`

If Nyx follows the seven-sheet row map above, no custom animation mapper is needed. Updating `characterProfiles.nyx.sheets` is enough for the existing animation references to point at Nyx's real sheets.

Only create a Nyx-specific mapper if the real art intentionally uses different row meanings. If that happens, keep the move names the same so combat logic still resolves actions such as `neutral_light`, `down_heavy`, `jump_medium`, `special_1`, `special_2`, and `special_3`.

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
