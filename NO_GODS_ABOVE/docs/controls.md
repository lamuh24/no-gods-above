# NO GODS ABOVE — Controls

## Keyboard Layout

| Key | Action |
|---|---|
| A | Move Left |
| D | Move Right |
| W | Jump |
| S | Crouch |
| Shift | Ground Dash / Air Dash |
| U + Shift | Super Dash |
| J | Light Attack / Auto Combo |
| K | Medium Attack |
| L | Heavy Attack |
| U | Special Modifier |
| U + J | Special 1 — Godless Dash Cut |
| U + K | Special 2 — Chain Heretic Pull |
| U + L | Special 3 — Anti-Halo Rising Slash |
| I + O | Ultimate — No Gods Above Me |
| T | Taunt |
| P | Pause |
| H | Toggle Hitbox Debug |
| R | Reset Round |
| Hold Back | Block |

## Anime Fighter Additions

- Tap J repeatedly for the basic auto combo: neutral_light -> neutral_medium -> neutral_heavy.
- W can jump-cancel selected medium/heavy attacks after the cancel window or on hit.
- Shift can dash-cancel selected attacks after the cancel window or on hit.
- Shift while airborne performs a forward or backward air dash based on the held direction.
- U + Shift performs a homing Super Dash toward the opponent.

## Directional Attack Logic

Light: neutral_light, forward_light, back_light, down_light, jump_light.

Medium: neutral_medium, forward_medium, back_medium, down_medium, jump_medium.

Heavy: neutral_heavy, forward_heavy, back_heavy, down_heavy, jump_heavy.

## Input Priority

Death, Ultimate, Damaged, Special, Attack, Dash, Jump, Block, Crouch, Walk, Idle.
