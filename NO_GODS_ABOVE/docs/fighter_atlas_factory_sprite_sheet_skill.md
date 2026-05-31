# Fighter Atlas Factory - Sprite Sheet Skill

## Purpose

Create clean, Codex-ready 2D fighting game sprite sheets for NO GODS ABOVE.

## Core Rule

Every character must use the same clean sprite sheet structure:

```text
6 columns x 5 rows
6 frames per animation
5 animations per sheet
solid #ff00ff magenta background
clean runtime sheet has no text or grid
```

## Character Lock Template

```text
Character name:
Gender/body type:
Theme:
Hair:
Armor/clothing:
Weapon:
Energy color:
Forbidden design elements:
Silhouette notes:
```

## Runtime Sheet Rules

- Generate exactly one sprite sheet image at a time.
- Each sheet has exactly 5 rows and each row has exactly 6 frames.
- All frame boxes and row heights are equal.
- Clean runtime sheets use only solid `#ff00ff` magenta background.
- Clean runtime sheets have no text, labels, numbers, grid lines, debug lines, UI, title, frame labels, or row labels.
- Character and effects must stay inside each frame.
- No body parts or effects may overlap into neighboring frames.
- Grounded feet should touch the same invisible baseline and the body should stay above it.
- Keep the same character scale and camera distance across all frames.

## Debug vs Clean

Debug sheets are optional. Use clean sheets as runtime assets. Only use debug/baseline references if a sheet has slicing, alignment, spacing, or grounding issues.

When needed, debug sheets may include cyan frame lines, yellow baseline, yellow anchor dots, row labels, and frame labels for checking only.

Clean sheets are runtime assets and must include sprites only on solid `#ff00ff` background.

## Sheet Map

```text
Sheet 1 - Basic Movement
Row 1 = idle
Row 2 = walk_forward
Row 3 = walk_back
Row 4 = dash
Row 5 = crouch

Sheet 2 - Defense / Recovery
Row 1 = stand_up
Row 2 = guard_idle
Row 3 = hurt
Row 4 = knockback
Row 5 = get_up

Sheet 3 - Core Attacks A
Row 1 = neutral_light
Row 2 = neutral_medium
Row 3 = neutral_heavy
Row 4 = forward_light
Row 5 = forward_medium

Sheet 4 - Core Attacks B
Row 1 = forward_heavy
Row 2 = back_light
Row 3 = back_medium
Row 4 = back_heavy
Row 5 = taunt

Sheet 5 - Low / Air
Row 1 = down_light
Row 2 = down_medium
Row 3 = down_heavy
Row 4 = jump_light
Row 5 = jump_medium

Sheet 6 - Specials / Ultimate
Row 1 = jump_heavy
Row 2 = special_1
Row 3 = special_2
Row 4 = special_3
Row 5 = ultimate

Sheet 7 - End States / Extras
Row 1 = death
Row 2 = victory
Row 3 = level_up
Row 4 = intro_pose
Row 5 = select_idle
```

## Codex Import Rules

- Use clean sprite sheets as runtime assets.
- Use debug/baseline reference sheets only when diagnosing slicing, alignment, spacing, or grounding issues.
- Slice each sheet uniformly as 6 columns x 5 rows.
- Use bottom-center anchoring.
- Align grounded animations to a shared ground baseline.
- Do not treat sprite-internal pose shifts as world movement.
- Keep dash, projectile, and special travel in code.
- Do not use old character assets unless explicitly instructed.

## Packaging Structure

```text
CHARACTER_FINAL_PACK/
  CHARACTER_LOCK.md
  CODEX_IMPORT_MESSAGE.txt
  README.md
  docs/
    animation_map.md
    sprite_rules.md
    moveset.md
    asset_manifest.md
  assets/
    sprites/
      character_name/
        sheet_1_basic_movement.png
        sheet_2_defense_recovery.png
        sheet_3_core_attacks_a.png
        sheet_4_core_attacks_b.png
        sheet_5_low_air.png
        sheet_6_specials_ultimate.png
        sheet_7_end_states_extras.png
```

## Never Do Again

- Do not generate giant mixed sheets with random row counts.
- Do not use 7-frame sheets unless the whole project standard changes.
- Do not use sheets with baked labels as runtime assets.
- Do not let Codex guess row meanings.
- Do not mix old character versions into the active asset folder.
- Do not allow chain or whip weapons unless the whole pipeline is redesigned for long effects.
