# Visual QA Checklist Prompt

Review this generated sprite sheet against the locked character spec and No Gods Above Style 4 standard.

## Inputs

- Character: `sable`
- Clip: `stand_heavy`
- Sheet: `assets/characters/sable/rebuilds/sable_style4_full_rebuild_v3/generated/inbox/stand_heavy/v20260709-zzzz-fluidity-redraw-01/sable_stand_heavy_fluidity_redraw01_component_isolated_12x1_448.png`

## Checklist

- Same character identity: face, skin tone, hair, outfit, silhouette, palette.
- Correct mature HD pixel anime fighter style.
- Correct pose/action for the clip.
- Character faces right unless the clip explicitly says otherwise.
- No text, labels, borders, background, floor, watermark, UI marks, or grid lines.
- No cropped body parts or clipped VFX.
- No duplicated body fragments.
- Body remains readable in every frame.
- VFX supports the move and does not replace the body.
- Scale, center, and baseline are stable across frames.

Return a structured result with `approved`, `fixable`, `rejected`, `issues`, and `retryGuidance`.
