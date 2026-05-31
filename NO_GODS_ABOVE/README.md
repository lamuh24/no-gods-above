# NO GODS ABOVE

Playable browser Training Mode prototype for a 2D dark-fantasy fighting game.

Built with plain HTML, CSS, and JavaScript Canvas only. No Godot, Unity, Unreal, Phaser, external engines, or external game frameworks are used.

Current local dev server: `http://localhost:8010`.

## Active Player

Kairo Final is the active playable Kairo character.

Visual identity:

- Male cyber ninja
- White/silver hair
- Black tactical armor
- Cyan energy forearm blades
- Compact readable fighting-game silhouette

Do not use older Kairo sheets, Veyra sheets, Seraphine sheets, chain-whip sheets, or chibi test sheets as the active player.

## Active Kairo Final Assets

- `assets/sprites/kairo_final/kairo_sheet_1_basic_movement.png`
- `assets/sprites/kairo_final/kairo_sheet_2_defense_recovery.png`
- `assets/sprites/kairo_final/kairo_sheet_3_core_attacks_a.png`
- `assets/sprites/kairo_final/kairo_sheet_4_core_attacks_b.png`
- `assets/sprites/kairo_final/kairo_sheet_5_low_air.png`
- `assets/sprites/kairo_final/kairo_sheet_6_specials_ultimate.png`
- `assets/sprites/kairo_final/kairo_sheet_7_end_states_extras.png`

## Active Vanta Final Assets

- `assets/sprites/vanta_final/vanta_sheet_1_basic_movement.png`
- `assets/sprites/vanta_final/vanta_sheet_2_defense_recovery.png`
- `assets/sprites/vanta_final/vanta_sheet_3_core_attacks_a.png`
- `assets/sprites/vanta_final/vanta_sheet_4_core_attacks_b.png`
- `assets/sprites/vanta_final/vanta_sheet_5_low_air.png`
- `assets/sprites/vanta_final/vanta_sheet_6_specials_ultimate.png`
- `assets/sprites/vanta_final/vanta_sheet_7_end_states_extras.png`

## Prototype Features

- Title screen, character select, and Training Mode.
- Kairo Final and Vanta Final selectable player characters.
- Forsaken Courtyard background.
- Movement, jump, dash, crouch, hold-back block, light/medium/heavy attacks, directional attacks, jump attacks, three specials, and full-meter ultimate.
- Enemy health, player health, passively growing ultimate meter, hit detection, hitboxes/hurtboxes, hit pause, knockback, VFX particles, enemy death, `R` reset, `H` hitbox debug, and `N` rival AI toggle.

## Controls

| Key | Action |
|---|---|
| A / D | Move left / right |
| W | Jump |
| S | Crouch |
| Shift | Dash |
| Hold Back | Block / retreat |
| J / K / L | Light / medium / heavy |
| Forward + J/K/L | Forward attacks |
| Back + J/K/L | Back attacks |
| Down + J/K/L | Low attacks |
| Air + J/K/L | Jump attacks |
| U + J | Special 1, fast forward blade rush |
| U + K | Special 2, cyan projectile / burst shot |
| U + L | Special 3, spinning energy slash / area strike |
| I + O | Ultimate, requires full meter |
| R | Reset round |
| H | Toggle hitbox debug |
| N | Toggle rival AI |
| P | Pause |

## Sprite Handling

- Kairo Final runtime sheets are normalized to 6 columns x 5 rows with 320x320 cells.
- Vanta Final runtime sheets are clean 6 columns x 5 rows sheets. Each Vanta sheet is sliced from its own image size with `frameWidth = image.width / 6` and `frameHeight = image.height / 5`.
- The renderer uses cleaned per-frame source rectangles with a locked bottom-center row anchor.
- The original imported Kairo Final pack images are preserved in `assets/sprites/kairo_final_source/`.
- Feet stay aligned to one ground baseline while blade effects can extend visually from the stable fighter root.
- Pose shifts inside a sprite frame remain pose animation only and are not converted into arena travel.
- Dash and special travel happen in code, not through baked sprite displacement.
- Frames are cropped/padded as needed, with magenta/purple artifacts stripped at runtime.

## Implementation Notes

Combat is driven by frame-data timers and explicit hitboxes, not exact sprite pixels. This keeps the prototype playable even when AI-generated sheets have inconsistent spacing.
