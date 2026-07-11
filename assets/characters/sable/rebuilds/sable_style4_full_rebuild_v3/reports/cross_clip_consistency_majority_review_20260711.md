# Sable Majority-Canon Consistency Review

Status: review candidate only. The new idle has not replaced the approved preview strip or gated runtime copy.

## Corrected Canon

- Derivation: median of roster-valid standing-start majority cluster
- Sable standing canon: 352 px in a 448 px cell
- Roster standing convention: 350-380 px
- LAMUH source standing height: 373 px
- Kairo source standing height: 382 px
- Palette canon remains from the approved idle: suit hue 249.3 degrees, lattice hue 24.3 degrees, hair-fleck density 7.24 percent

## Rejected Work Removed

The 18 candidates from commit `517e60e` that downscaled correct 348-352 px strips to 257 px were discarded. Downscaling was the wrong direction and risked permanent pixel-detail loss.

## True Offenders

| Clip | Sample | Height | Deviation from 352 px |
| --- | ---: | ---: | ---: |
| idle | frame 1 | 257 px | -27.0% |
| getup | final frame | 260 px | -26.1% |
| back_special_light | frame 1 | 255 px | -27.6% |
| back_special_medium | frame 1 | 260 px | -26.1% |
| back_special_heavy | frame 1 | 260 px | -26.1% |

## New Idle Candidate

- Actual Sable reference image supplied to generation
- Four-frame side-on fists-up breathing loop
- Normalized heights: 350, 350, 349, 349 px
- All frame bottoms: y=381
- Identity/palette: on-model dark navy, gold lattice, coily silver-flecked afro, crystal wraps
- Near-duplicate hashes are intentional for a subtle idle and require loop playback review

Candidate strip: `assets/characters/sable/rebuilds/sable_style4_full_rebuild_v3/generated/prepared/idle/v20260711-111338-majority-canon-reference-idle/zz_sable_idle_majority-canon-reference_prepared_4x1_448.png`

Numbered sheet: `assets/characters/sable/rebuilds/sable_style4_full_rebuild_v3/reports/frame_scrub/idle/majority_canon_reference4/idle_numbered_contact_sheet.png`

## Runtime Scale Audit

- Current Sable rebuild multiplier: 0.98
- LAMUH multiplier: 0.82
- Old relationship: 350 x 0.98 = 343 px; LAMUH 373 x 0.82 = 306 px. This caused Sable to tower over LAMUH.
- Corrected Sable rebuild multiplier: 0.86
- Corrected relationship: 350 x 0.86 = 301 px, just under LAMUH's approximately 306 px.
- No combat, movement, hitbox, damage, or input values changed.

## Shared Gate

`cross_clip_consistency` now derives body-height canon from the standing majority, rejects a canon outside the shared 350-380 px roster band, uses getup's final frame as its standing sample, and keeps posture-specific clips from false height comparisons. This roster-relative rule is character-agnostic and must be used before a new fighter's first idle becomes canon.

Promotion remains blocked pending Claude review of the idle loop and runtime scale result. The other four sub-canon clips remain listed for regeneration after that review.
