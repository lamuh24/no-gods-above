# Sable Stand Light Full-Rebuild Start

Date: 2026-07-09
Stage: `full-rebuild-v3`
Clip: `stand_light`
Status: first generated candidates created; not preview-approved
Approved for live roster: no

## Summary

Started the Sable full animation rebuild with `stand_light`, the first body-first normal attack candidate.

Two built-in image-generation candidates were created from the approved Sable pixel reference sheet. Both were kept under the full-rebuild review/inbox path and processed through chroma removal, 8x448 repacking, and SpriteForge validation.

## Candidate 1

Folder:

`assets/characters/sable/rebuilds/sable_style4_full_rebuild_v3/generated/inbox/stand_light/v20260709-stand-light-codex-draft-01/`

Outputs:

- `sable_stand_light_codex_raw_chroma.png`
- `sable_stand_light_codex_alpha.png`
- `sable_stand_light_codex_packed_8x1_448.png`
- `sable_stand_light_codex_packed_8x1_448_cleaned.png`

Validation:

- Overall: `manual_review_required`
- Technical: `warn`
- Visual: `manual_review_required`
- Main issue: detached components in active/recovery frames.

Candidate 1 proved the motion direction but should remain draft/reference only.

## Candidate 2

Folder:

`assets/characters/sable/rebuilds/sable_style4_full_rebuild_v3/generated/inbox/stand_light/v20260709-z-stand-light-codex-draft-02/`

Outputs:

- `sable_stand_light_codex_draft02_raw_chroma.png`
- `sable_stand_light_codex_draft02_alpha.png`
- `sable_stand_light_codex_draft02_packed_8x1_448.png`
- `sable_stand_light_codex_draft02_bodyonly_cleaned_8x1_448.png`
- `sable_stand_light_codex_draft02_bodyonly_cleaned_8x1_448_report.json`

Normalized preview candidates:

`assets/characters/sable/rebuilds/sable_style4_full_rebuild_v3/normalized/stand_light/v20260709-085150/sable_stand_light_normalized_strip.png`

Current manifest-normalized candidate after the focused queue pass:

`assets/characters/sable/rebuilds/sable_style4_full_rebuild_v3/normalized/stand_light/v20260709-085641/sable_stand_light_normalized_strip.png`

Validation after body-only cleanup:

- Overall: `manual_review_required`
- Technical: `warn`
- Visual: `manual_review_required`
- Detached-component warning was fixed.
- Remaining issue after normalization: possible duplicate frames.
- Duplicate pairs: frame 0 and frame 7; frame 4 and frame 5.

Candidate 2 is the better first start point, but it is not release-ready and was not preview-approved.

## Export Result

`npm.cmd run sprite-agent -- export --character sable --stage full-rebuild-v3` initially exported 0 preview clips before the focused queue pass. After placing the cleaned candidate into a clean latest inbox folder and rerunning the queue, `preview_animation_clips_full_rebuild_v3.json` now contains `stand_light` as a preview-manifest clip with `validationStatus: manual_review_required`.

This is still not approval. Do not promote the candidate into gameplay or the public roster.

## Next Fix

Regenerate or edit `stand_light` with:

- no detached shards or loose particles,
- distinct frame 4 active pose and frame 5 follow-through,
- frame 7 recovery that returns toward ready stance without being pixel-identical to frame 0,
- body-first pose clarity,
- same Sable identity, scale, baseline, and pixel style.

## Boundary

No live gameplay/runtime files were touched. No public roster wiring changed. No combat balance changed. No live promotion happened.
