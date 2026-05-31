# Vanta Final Rebuild Report

Runtime sheets were rebuilt from `assets/sprites/vanta_final_source` into `assets/sprites/vanta_final`.

- Output standard: 6 columns x 5 rows
- Output cell size: 320x320
- Output sheet size: 1920x1600
- Background: solid #ff00ff
- Anchor: bottom-center, baseline Y=300
- Dash row is held stable because travel is code-driven.
- Special_1 row is held as a clean body pose because dash slash travel/VFX is code-driven.
- Special_2 row is held from idle because projectile/VFX travel is code-driven.
- Sheet 1 row 4 is replaced from assets/sprites/vanta_final_fixes/slide_fix.png.
- Sheet 6 row 2 is replaced from assets/sprites/vanta_final_fixes/uj_fix.png.
- Fixed replacement strips are normalized into 320x320 cells with solid #ff00ff backgrounds.
- Fixed replacement strips are clamped to max body size 220x196 to match Vanta's existing runtime scale.
- No procedural speed streaks or slash sweeps are added by this script.

## vanta_sheet_1_basic_movement.png

- Source size: 1374x1145
- Source frame size: 229.00x229.00
- Rebuilt runtime size: 1920x1600

| Row | Dropped Components | Replaced Frames | Held |
|---|---:|---:|---|
| 1 | 10 | 0 | no |
| 2 | 26 | 0 | no |
| 3 | 19 | 0 | no |
| 4 | 42 | 0 | yes |
| 5 | 23 | 0 | no |

## vanta_sheet_2_defense_recovery.png

- Source size: 1254x1254
- Source frame size: 209.00x250.80
- Rebuilt runtime size: 1920x1600

| Row | Dropped Components | Replaced Frames | Held |
|---|---:|---:|---|
| 1 | 3 | 0 | no |
| 2 | 2 | 0 | no |
| 3 | 4 | 0 | no |
| 4 | 5 | 0 | no |
| 5 | 2 | 0 | no |

## vanta_sheet_3_core_attacks_a.png

- Source size: 1254x1254
- Source frame size: 209.00x250.80
- Rebuilt runtime size: 1920x1600

| Row | Dropped Components | Replaced Frames | Held |
|---|---:|---:|---|
| 1 | 2 | 0 | no |
| 2 | 17 | 0 | no |
| 3 | 15 | 0 | no |
| 4 | 15 | 0 | no |
| 5 | 4 | 0 | no |

## vanta_sheet_4_core_attacks_b.png

- Source size: 1254x1254
- Source frame size: 209.00x250.80
- Rebuilt runtime size: 1920x1600

| Row | Dropped Components | Replaced Frames | Held |
|---|---:|---:|---|
| 1 | 5 | 0 | no |
| 2 | 22 | 0 | no |
| 3 | 25 | 0 | no |
| 4 | 21 | 0 | no |
| 5 | 2 | 0 | no |

## vanta_sheet_5_low_air.png

- Source size: 1254x1254
- Source frame size: 209.00x250.80
- Rebuilt runtime size: 1920x1600

| Row | Dropped Components | Replaced Frames | Held |
|---|---:|---:|---|
| 1 | 5 | 0 | no |
| 2 | 22 | 0 | no |
| 3 | 11 | 0 | no |
| 4 | 9 | 0 | no |
| 5 | 4 | 0 | no |

## vanta_sheet_6_specials_ultimate.png

- Source size: 1374x1145
- Source frame size: 229.00x229.00
- Rebuilt runtime size: 1920x1600

| Row | Dropped Components | Replaced Frames | Held |
|---|---:|---:|---|
| 1 | 0 | 0 | no |
| 2 | 63 | 0 | yes |
| 3 | 47 | 0 | yes |
| 4 | 8 | 0 | no |
| 5 | 6 | 0 | no |

## vanta_sheet_7_end_states_extras.png

- Source size: 1374x1145
- Source frame size: 229.00x229.00
- Rebuilt runtime size: 1920x1600

| Row | Dropped Components | Replaced Frames | Held |
|---|---:|---:|---|
| 1 | 12 | 0 | no |
| 2 | 72 | 0 | no |
| 3 | 124 | 0 | no |
| 4 | 98 | 0 | no |
| 5 | 36 | 0 | no |
