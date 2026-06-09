# Character Sprite Pipeline

## Purpose

This document is the reusable workflow for generated character sprite sheets in NO GODS ABOVE. It exists so every agent treats generated art, normalized runtime atlases, animation mappings, validation, and handoff notes the same way.

The goal is simple: make characters visually consistent without accidentally changing gameplay.

## Required Skill Docs For Character Sprite Work

The sprite pipeline doc describes the workflow, but the repo-local skills define specialized standards. Agents must use both.

Before character sprite work, read:

- `NO_GODS_ABOVE/skills/playable_character_production_skill.md`
- `NO_GODS_ABOVE/skills/sprite_sheet_validation_skill.md`
- `NO_GODS_ABOVE/skills/character_visual_consistency_skill.md`

For VFX-heavy moves, also read:

- `NO_GODS_ABOVE/skills/vfx_integration_audit_skill.md`

For cinematic/super/ultimate animations, also read:

- `NO_GODS_ABOVE/skills/cinematic_ultimate_production_skill.md`

For balance-affecting animation timing, also read:

- `NO_GODS_ABOVE/skills/fighting_game_balance_pass_skill.md`

For any risky integration or large file change, also read:

- `NO_GODS_ABOVE/skills/git_checkpoint_safety_skill.md`

## Core Rule

Generated sprite sheets are source or candidate art. They are not runtime-ready unless they already satisfy the full runtime atlas contract.

Do not raw-integrate generated images into `assetPaths`, `sheetMeta`, character animation tables, or gameplay mappings just because the art direction looks good. First normalize, validate, and preserve the old atlas as fallback.

## Runtime Atlas Contract

Unless a character-specific manifest explicitly says otherwise:

- Runtime character cells are `448 x 448`.
- 8 columns are preferred for generated sheets when the move has 8 frames.
- Output dimensions must exactly equal `columns * 448` by `rows * 448`.
- The PNG must have real alpha transparency.
- Checkerboard, green screen, solid-color, or fake transparent backgrounds must be removed.
- The character body must stay at the approved scale for that character.
- Grounded feet should align to the tracked baseline. LAMUH uses `baselineY: 382`.
- Large effects must not delete, hide, or shrink the character body.
- Old atlases remain available as fallback/history until validation and smoke coverage prove the replacement is safe.

## Character Design Lock

Every character sheet must preserve the approved identity:

- Face, skin tone, hair shape, body proportions, and expression family.
- Outfit structure, color palette, silhouette, and scale.
- Character-specific accents, weapons, energy motifs, and stance language.
- Super or ascended forms must still read as the same character powered up, not a redesign.

For LAMUH specifically, preserve the locked Black male fighter identity, dark locs/dreads, white battle coat, black outfit, gold trim, cyan/blue accent, athletic rushdown build, confident focused face, and mirror-energy main-character style.

## One Sheet At A Time Workflow

Work one sheet or sheet family at a time:

1. Generate or receive source art.
2. Audit the source image dimensions, visual grid, frame count, background type, and obvious art problems.
3. Normalize the source into the runtime atlas contract.
4. Save a preview/contact sheet and validation report.
5. Integrate only the intended aliases after validation passes.
6. Preserve old atlas mappings as fallback/history.
7. Run focused smoke tests and relevant regression smokes.
8. Do manual gameplay QA when the visual risk is high.
9. Update the character manifest and `SESSION_CONTEXT.md`.

Coverage comes before polish. Replace missing, old-art, idle-only, VFX-only, or mismatched animations before micro-tuning rows that already work.

## Normalization Workflow

A safe normalizer should:

- Load the generated source without modifying or deleting it.
- Detect or treat the source as the intended visual grid.
- Crop each visual source cell.
- Remove baked backgrounds without erasing white clothing, pale gold effects, cyan effects, black hair/outfits, or shadow accents.
- Preserve large intended VFX, afterimages, bursts, beams, trails, and ground effects.
- Place one sprite or intended effect frame into each `448 x 448` destination cell.
- Align grounded feet to the character baseline when possible.
- Preserve body scale against the approved core/reference sheet.
- Save the final atlas, preview/contact sheet, and validation report.
- Stop and report if background removal damages the sprite or important VFX.

Never destroy or overwrite the original generated source. Keep source, processed atlas, preview, report, and smoke report traceable.

## Mapping Workflow

After validation passes:

- Add the processed atlas to `assetPaths`.
- Add matching metadata in `sheetMeta`.
- Route only the intended animation aliases to the new sheet and row.
- Preserve old atlas keys and old rows as fallback/history.
- Verify player and enemy aliases resolve consistently when both exist.
- Update the character manifest with the row contract, source, output, tests, and known visual issues.
- Update `SESSION_CONTEXT.md` with a short handoff.

Avoid unrelated code churn. Do not touch neutral, forward, back, down, up, air, super, reaction, or other-character sheets unless the current task explicitly includes them.

## VFX Separation Rule

Large beams, projectiles, portals, shockwaves, and full-screen effects should usually be separate VFX or projectile layers.

Body rows should contain body animation: charge, aim, fire, recoil, recovery, stance shift, and readable silhouette. VFX rows or runtime projectile renderers should carry long beams, traveling projectiles, big bursts, or impact effects.

Do not bake a full long beam into body frames if it causes body clipping, shrinking, deletion, or detached-looking attacks.

## Coverage Vs Polish

Use audits to decide the next sheet. Prioritize:

- Old-style fallback rows.
- Idle-only or stand-only fallbacks.
- VFX-only moves that lost the character body.
- Missing reaction, knockdown, getup, block, air, crouch, or special rows.
- Player/enemy mismatches.

Polish timing, anchors, and small VFX alignment after the broad coverage gaps are closed, unless the current issue breaks gameplay readability.

## Validation Requirements

Use the narrowest useful validation set:

- `node --check NO_GODS_ABOVE/game.js` when code changes.
- `python -m py_compile <normalizer>` when Python scripts change.
- `git diff --check` on touched files when practical.
- Focused smoke tests for the sheet or move being integrated.
- Relevant regression smokes for nearby LAMUH systems.
- Manual browser/gameplay QA for high-risk visual changes such as beams, supers, reactions, or launcher states.

Validation should confirm:

- Output PNG exists.
- Output dimensions and grid are exact.
- Cell size is exact.
- Real alpha exists.
- Fake background is removed.
- White clothing and character body are preserved.
- Gold/cyan/black VFX are preserved when intended.
- All expected source components/occupied cells are present.
- Intended aliases resolve to the new atlas and row.
- Old atlases remain fallback.
- No unrelated characters, mechanics, input routing, or combat values changed.

## Delivery Format

When finishing sprite work, report:

- Files changed.
- Source image used.
- Output atlas path and dimensions.
- Transparency and background-removal status.
- Body scale and baseline status.
- Row mappings and aliases.
- Whether old atlases remain fallback.
- Tests and smoke results.
- Known visual issues.
- Confirmation that mechanics, input routing, damage, and unrelated characters were not changed.
