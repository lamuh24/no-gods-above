# Nyx Character Config

Nyx is the third playable fighter and is implemented through the reusable character architecture in `game.js`.

## Gameplay Identity

Nyx is a fast rushdown / aerial pressure fighter:

- Lower health than Kairo and Vanta: `860`.
- Faster ground movement, ground dash, air dash, and Super Dash.
- Medium-high jump with slightly lighter aerial gravity.
- Smaller hurtboxes to communicate a lighter defensive profile.
- Lower damage per hit than the baseline fighters.
- Higher combo potential through fast cancels, launcher access, aerial routes, Shadow Step, Dive Kick, and Rapid Flurry.

## Real Nyx Moves

Nyx has Nyx-specific combat data. She is not just a renamed Kairo/Vanta config.

- Light Attack: fast low-damage jab/slash that chains into Medium.
- Medium Attack: quick combo extender with moderate hitstun.
- Heavy Attack: stronger forward strike with higher knockback and routes into launcher.
- Launcher: `down_heavy`, fast upward slash with jump cancel and soft knockdown setup.
- Air Light: quick air starter.
- Air Medium: forward air slash that keeps juggles close.
- Air Heavy: stronger air finisher with soft knockdown.
- Special 1, Shadow Step: fast pressure dash/step toward or behind the opponent. It is not coded as invincible.
- Special 2, Falling Slash / Dive Kick: diagonal downward pressure and combo-ending attack.
- Special 3, Rapid Flurry: capped multi-hit rush attack with low per-hit damage. It still uses combo scaling and hitstun decay.

## Placeholder Sprite Mapping

Nyx does not have final artwork yet. For now, Nyx intentionally reuses Kairo Final runtime sheets and portrait as temporary placeholder visuals:

| Nyx Sheet Slot | Temporary Placeholder |
|---|---|
| `basic` | `kairoFinalBasic` |
| `defense` | `kairoFinalDefense` |
| `coreA` | `kairoFinalCoreA` |
| `coreB` | `kairoFinalCoreB` |
| `lowAir` | `kairoFinalLowAir` |
| `specials` | `kairoFinalSpecials` |
| `end` | `kairoFinalEnd` |
| Select portrait | `assets/sprites/portraits/kairo_select.png` |

This is temporary only. Do not edit Kairo art to make Nyx art.

## Real Nyx Sheets Needed Later

When final Nyx art exists, add the same seven-sheet runtime set used by Kairo Final and Vanta Final:

- `nyx_sheet_1_basic_movement.png`
- `nyx_sheet_2_defense_recovery.png`
- `nyx_sheet_3_core_attacks_a.png`
- `nyx_sheet_4_core_attacks_b.png`
- `nyx_sheet_5_low_air.png`
- `nyx_sheet_6_specials_ultimate.png`
- `nyx_sheet_7_end_states_extras.png`

The preferred runtime format is still:

- 6 columns x 5 rows.
- 320x320 cells.
- 1920x1600 total image size.
- Solid magenta chroma background.
- Bottom-center anchored body poses.
- Movement/projectile travel handled by code, not baked sprite displacement.

After adding real Nyx sheets, update only:

- `assetPaths`
- `sheetMeta`
- Nyx `sheets`
- Nyx select portrait path in `index.html`

Keep Nyx's combat config untouched unless a real tuning pass is requested.
