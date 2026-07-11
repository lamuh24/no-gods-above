# Sable Cross-Clip Consistency Review

Status: candidate-only; not promoted to the approved preview manifest or gated game assets.

## Canon

- Source: approved `idle`, frame 1 (index 0)
- Head-to-baseline height: 257 px
- Baseline: y=381 inside the 448 px frame
- Suit hue: 249.3 degrees; allowed band 231.3-267.3 degrees
- Gold lattice hue: 24.3 degrees
- Hair-fleck density: 7.24 percent in the measured head region
- Standing-height tolerance: +/-8 percent

## Result

- Before: 18 true standing-scale offenders at 348-352 px (+35.4 to +37.0 percent).
- Correction: nearest-neighbor uniform scale, factor 0.7301-0.7385, about bottom-center anchor x=224/y=381.
- After: all 39 clips pass the posture-aware `cross_clip_consistency` gate; corrected standing samples measure 256-257 px (-0.4 to 0.0 percent).
- Palette: every measured standing clip remains inside the canonical suit-hue band. No broad recolor was applied because it could alter skin, gold lattice, and violet VFX.
- Regeneration candidates: none identified by the automated pass. Claude must still judge pixel-detail loss from the 27 percent downscale.

## Corrected Candidates

`walk_forward`, `walk_backward`, `block`, `hit_stun`, `stand_light`, `stand_medium`, `stand_heavy`, `forward_medium`, `forward_heavy`, `back_light`, `back_medium`, `back_heavy`, `neutral_special_light`, `neutral_special_medium`, `neutral_special_heavy`, `forward_special_light`, `forward_special_medium`, `forward_special_heavy`.

Each candidate directory contains the corrected strip and a fresh `scrub/` bundle with a numbered contact sheet and JSON/Markdown frame-scrub report.

## Review Inputs

- Before metrics: `cross_clip_consistency_before_20260711.json`
- After metrics: `cross_clip_consistency_after_20260711.json`
- Candidate manifest: `assets/characters/sable/manifests/preview_animation_clips_full_rebuild_v3_consistency_candidate.json`
- Candidate root: `assets/characters/sable/rebuilds/sable_style4_full_rebuild_v3/consistency_candidates/20260711/`

Promotion remains blocked pending Claude review of cross-clip playback, pixel detail, palette, and hair density.
