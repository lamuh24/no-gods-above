# NO GODS ABOVE — Frame Data

Assume 60 FPS.

## Global Values

| Property | Value |
|---|---:|
| Player Max HP | 1000 |
| Enemy Max HP | 1000 |
| Ultimate Meter Max | 100 |
| Gravity | 1800 px/sec² |
| Juggle Gravity | 1260 px/sec^2 |
| Air Recovery Gravity | 1660 px/sec^2 |
| Jump Velocity | -720 px/sec |
| Walk Forward Speed | 220 px/sec |
| Walk Back Speed | 170 px/sec |
| Dash Distance | 220 px |
| Dash Duration | 16 frames |
| Dash Cooldown | 20 frames |
| Air Dash Duration | 13 frames |
| Super Dash Cooldown | 28 frames |
| Combo Scaling | -5% per hit, minimum 20% |
| Hitstun Decay | -3.5% per hit, minimum 58%; launchers minimum 70% |
| Ground Push Separation | 116 px |
| Ground Hit Separation | 108 px |
| Air Hit Separation | 82 px, max 128 px before air-hit pull-in |

## Core Move Data

| Animation Key | Damage | Startup | Active | Recovery | Hitstun | Blockstun | Knockback X | Knockback Y |
|---|---:|---:|---:|---:|---:|---:|---:|---:|
| neutral_light | 32 | 3 | 7 | 5 | 20 | 12 | 10 | -20 |
| neutral_medium | 58 | 5 | 7 | 9 | 31 | 18 | 22 | -80 |
| neutral_heavy | 88 | 9 | 5 | 17 | 50 | 29 | 74 | -535 |
| forward_light | 38 | 4 | 4 | 8 | 22 | 13 | 44 | -18 |
| forward_medium | 66 | 6 | 4 | 11 | 32 | 19 | 78 | -68 |
| forward_heavy | 104 | 10 | 5 | 18 | 47 | 27 | 104 | -430 |
| back_light | 34 | 4 | 4 | 8 | 21 | 12 | 38 | -18 |
| back_medium | 62 | 6 | 4 | 11 | 31 | 18 | 66 | -72 |
| back_heavy | 92 | 9 | 5 | 18 | 50 | 29 | 60 | -545 |
| down_light | 28 | 3 | 4 | 7 | 19 | 11 | 38 | 0 |
| down_medium | 54 | 5 | 4 | 10 | 30 | 17 | 58 | -38 |
| down_heavy | 78 | 8 | 5 | 18 | 50 | 29 | 64 | -565 |
| jump_light | 30 | 3 | 5 | 4 | 24 | 14 | 32 | -16 |
| jump_medium | 56 | 5 | 6 | 8 | 34 | 20 | 48 | -32 |
| jump_heavy | 82 | 7 | 6 | 13 | 42 | 24 | 56 | 220 |
| special_1 | 102 | 7 | 7 | 15 | 36 | 21 | 118 | -150 |
| special_2 | 78 | 8 | 10 | 14 | 34 | 20 | 125 | -70 |
| special_3 | 116 | 7 | 7 | 22 | 50 | 29 | 76 | -555 |
| super_dash | 68 | 2 | 24 | 8 | 34 | 22 | 120 | -260 |
| ultimate | 260 | 10 | 20 | 32 | 56 | 32 | 330 | -260 |

## Hitbox Defaults

Light: 86x58 offset 42,-76. Medium: 112x64 offset 50,-82. Heavy: 142x88 offset 58,-96. Low: 104x42 offset 42,-42. Jump: 106x70 offset 42,-88. Chain: 185x58 offset 58,-84. Ultimate: 320x150 offset 90,-115.

## Anime Fighter Combat Notes

- Light auto combo routes are data-driven in `autoCombos`.
- Air combo routes are data-driven in `airComboRoutes`.
- Move flags control launchers, soft/hard knockdowns, jump cancels, dash cancels, super dash, projectile behavior, and cancel-on-hit routes.
- Blocking now uses blockstun and prevents damage.
- Combo count and scaling are tracked globally per current attacker/target pair.
- Hit stop, camera shake, and hit sparks are derived from move strength: light hits are quick and clean, medium hits get modest shake, heavy/launcher/special hits get stronger freeze and sparks.
- Airborne hitstun uses lower juggle gravity and capped horizontal knockback so launched opponents float long enough for readable air follow-ups.
- Hitstun decay applies across longer combos to reduce infinite routes while preserving launcher usefulness.
- Hit separation nudges fighters apart on contact, with smaller air separation to keep juggles close but readable.
- Basic chain cancels open earlier in the active window, while hit-confirm cancels stay slightly gated so pressure does not become pure mashing.
- Knockdown landings damp horizontal velocity and spawn a small code-driven dust puff for clearer recovery timing.
- Combo counters reset as soon as recovery/landing recovery begins, while active hitstun and the brief airborne juggle window still preserve valid combos.
