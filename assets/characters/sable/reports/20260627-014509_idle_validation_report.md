# SpriteForge Validation Report

Character: `sable`
Clip: `idle`
Source: `assets/characters/sable/generated/inbox/idle/sable_idle_style4_generated_20260627-014254.png`
Generated: 2026-06-27T05:45:09.737Z

Overall status: **manual_review_required**
Technical status: **warn**
Visual status: **manual_review_required**
Approved for live roster: **no**

## Issues

- WARN BODY_TOO_LARGE frame=1: Body bbox 149x354 exceeds safe box 336x352.
- WARN BODY_TOO_LARGE frame=2: Body bbox 149x353 exceeds safe box 336x352.
- WARN BODY_TOO_LARGE frame=3: Body bbox 151x354 exceeds safe box 336x352.
- WARN BODY_TOO_LARGE frame=4: Body bbox 148x353 exceeds safe box 336x352.
- WARN BODY_TOO_LARGE frame=7: Body bbox 133x353 exceeds safe box 336x352.
- WARN POSSIBLE_DUPLICATE_FRAMES: 2 near-duplicate frame pair(s) detected. Held frames can be okay, but review the motion.

## Duplicate Frame Check

- frame 0 and 5: hash distance 2
- frame 6 and 7: hash distance 0

## Frame Measurements

| Frame | Empty | Opaque Pixels | BBox | Baseline Delta | Center Delta |
| --- | --- | ---: | --- | ---: | ---: |
| 0 | no | 21890 | 161,26 129x352 | -5 | 2 |
| 1 | no | 22042 | 150,25 149x354 | -4 | 1 |
| 2 | no | 21674 | 150,25 149x353 | -5 | 1 |
| 3 | no | 21675 | 149,25 151x354 | -4 | 1 |
| 4 | no | 21792 | 150,25 148x353 | -5 | 0 |
| 5 | no | 21968 | 152,26 141x352 | -5 | -1 |
| 6 | no | 21725 | 155,26 141x352 | -5 | 2 |
| 7 | no | 21966 | 156,25 133x353 | -5 | -1 |
