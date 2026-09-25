# Visual QA Checklist Prompt

Review this generated sprite sheet against the locked character spec and No Gods Above Style 4 standard.

## Inputs

- Character: `sable`
- Clip: `crouch`
- Sheet: `assets/characters/sable/generated/inbox/crouch/v20260628-180430-codex-crouch-retry2c/zz_sable_crouch_codex_retry2c_prepared_8x1_448.png`

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
