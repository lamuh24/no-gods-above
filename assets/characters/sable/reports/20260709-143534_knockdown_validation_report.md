# SpriteForge Validation Report

Character: `sable`
Clip: `knockdown`
Source: `assets/characters/sable/rebuilds/sable_style4_full_rebuild_v3/normalized/knockdown/v20260709-143533/sable_knockdown_normalized_strip.png`
Generated: 2026-07-09T18:35:34.850Z

Overall status: **manual_review_required**
Technical status: **warn**
Visual status: **manual_review_required**
Approved for live roster: **no**

## Issues

- WARN BODY_TOO_SMALL frame=4: Body height 143px is below configured minimum 180px.
- WARN BODY_TOO_SMALL frame=5: Body height 130px is below configured minimum 180px.
- WARN DETACHED_COMPONENTS frame=5: 1 large detached opaque component(s) detected outside the main silhouette; largest is 1128 px. This often indicates sliced body parts or separated generated artifacts.
- WARN BODY_TOO_SMALL frame=6: Body height 85px is below configured minimum 180px.
- WARN BODY_TOO_SMALL frame=7: Body height 80px is below configured minimum 180px.
- WARN SCALE_DRIFT: Frame height drift is 272px (80px..352px); max is 180px. Clip-specific rationale: Knockdown intentionally transitions from standing recoil to low/grounded body poses; baseline, center, facing, and global normalization must still remain stable.

## Duplicate Frame Check

- frame 6 and 7: hash distance 3

## Frame Measurements

| Frame | Empty | Opaque Pixels | BBox | Baseline Delta | Center Delta |
| --- | --- | ---: | --- | ---: | ---: |
| 0 | no | 26838 | 113,30 222x352 | -1 | 0 |
| 1 | no | 20015 | 109,75 231x307 | -1 | 1 |
| 2 | no | 18148 | 110,188 229x194 | -1 | 1 |
| 3 | no | 17776 | 98,140 253x242 | -1 | 1 |
| 4 | no | 18383 | 91,239 267x143 | -1 | 1 |
| 5 | no | 18136 | 91,252 266x130 | -1 | 0 |
| 6 | no | 13557 | 97,297 255x85 | -1 | 1 |
| 7 | no | 12114 | 98,302 253x80 | -1 | 1 |
