# Sable Full Rebuild V3 Progress

Updated: 2026-07-08
Status: full 39-clip animation restart queued, preview-only
Live roster approval: no

## What Changed

Sable's active rebuild target was widened from the special-only `specials-rebuild-v3` lane to the full `full-rebuild-v3` lane.

The full lane includes:

- 9 base/reaction clips
- 15 normal attack clips
- 15 special attack clips

This covers the user's instruction that all Sable attack animations are being redone and that movement animations should be redone too.

## Queue Status

SpriteForge queue:

- Stage: `full-rebuild-v3`
- Provider: `manual`
- Approval policy: `previewAuto`
- Overall status: `waiting_for_generation`
- Attempted clips: 39
- Approved preview clips: none
- Failed clips: none
- Waiting clips: all 39 full-rebuild clips
- Missing output: all 39 full-rebuild clips

## 2026-07-09 Stand Light Start

Started the first attack candidate for `stand_light`.

- Created two built-in imagegen candidates under `generated/inbox/stand_light/`.
- Removed chroma backgrounds and repacked candidates into exact `8x448` strips.
- Candidate 1 remained draft/reference only due detached-component warnings.
- Candidate 2 was body-only cleaned and normalized to `normalized/stand_light/v20260709-085150/sable_stand_light_normalized_strip.png`.
- Current `stand_light` status: `manual_review_required`.
- Remaining issue: possible duplicate frames, especially frame 0/7 and frame 4/5.
- Current preview manifest contains `stand_light` as a preview-only manual-review clip at `normalized/stand_light/v20260709-085641/sable_stand_light_normalized_strip.png`.
- Approval stayed safe: `stand_light` is not preview-approved and not live-approved.

## Production Order

Recommended production order:

1. Attack animations: 15 normals and 15 specials.
2. Movement/reaction animations: idle, walk forward/backward, jump, crouch, block, hit stun, knockdown, getup.
3. SpriteForge validation and preview harness checks after each generated candidate.

The production order does not reduce the target. All 39 clips are part of the same full-rebuild-v3 stage.

## Preserved Work

- Existing Sable MVP preview pack remains preserved.
- `animator-rebuild-v2` remains preserved as failed-quality candidate history.
- `specials-rebuild-v3` remains preserved as special-only restart history.
- The first `neutral_special_light` key-pose/draft strip remains a reference/draft only and is not production-approved.

## Boundary

No live gameplay/runtime files were touched. No public roster wiring changed. No live promotion happened. Nothing was staged or committed.
