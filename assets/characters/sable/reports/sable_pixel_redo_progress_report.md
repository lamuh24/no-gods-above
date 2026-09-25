# Sable Pixel Redo Progress Report

Status: `COMPLETE_PREVIEW_PIXEL_REFERENCE_REDO_PENDING_PLAYTEST`
Date: `2026-06-29`

## Approved Preview Clips

The current Sable MVP preview manifest contains all `19` required pixel-reference redo clips:

- `idle`
- `crouch`
- `block`
- `hit_stun`
- `walk_forward`
- `jump`
- `stand_light`
- `stand_medium`
- `stand_heavy`
- `jump_light`
- `jump_medium`
- `jump_heavy`
- `neutral_special_light`
- `forward_special_light`
- `forward_special_medium`
- `forward_special_heavy`
- `back_special_light`
- `down_special_light`
- `up_special_light`

These clips were generated from the exact Sable pixel reference style, prepared into SpriteForge's transparent `448x448` strip contract, validated technically, normalized, and approved for preview only.

## Remaining MVP Clips

There are `0` missing MVP clips in the current preview manifest.

## Current Contact Sheet

- `assets/characters/sable/reports/sable_pixel_redo_current_contact_sheet.png`
- `assets/characters/sable/reports/sable_pixel_redo_current_contact_sheet.json`

The contact sheet is manifest-driven and only includes currently approved preview clips, so rejected historical strips cannot leak into visual review.

## Quality Notes

- `idle`: strong identity seed; subtle loop allowed after validation was tightened for stable idle loops.
- `walk_forward`: no longer reads as a skip; alternating grounded walk is much better.
- `crouch`: no placeholder-effect debris; crystal guard is attached and readable.
- `block`: compact guard pose; one held guard pair is allowed by validation.
- `hit_stun`: readable non-graphic stagger; no detached body fragments.
- `jump`: fixes the old body-fragment/out-of-frame blocker; still a polish candidate after full pack completion.
- `stand_light`: clean compact forearm gesture; no oversized VFX.
- `stand_medium` / `stand_heavy`: compact body-first normal attacks, no oversized crystal mass.
- `jump_light` / `jump_medium` / `jump_heavy`: air normals keep Sable in-frame and avoid prior detached body debris.
- Specials: preview-approved with compact, body-first posing. Several special clips have held/recovery duplicate-frame warnings; those were accepted for preview-only review because there was no cropping, edge contact, live promotion, or detached VFX blocker.

## Rejected Candidate

A `stand_medium` generation attempt produced an oversized crystal-forearm mass. It was rejected visually before import, was not copied into `assets/characters/sable/generated/inbox/stand_medium/`, and is not referenced by the preview manifest.

## Safety

- No live roster promotion happened.
- `approvedForLiveRoster` remains `false`.
- Gameplay, balance, movesets, input routing, and runtime files were not intentionally changed by this art pass.
- Old rejected generated assets remain quarantined or outside the active inbox.
