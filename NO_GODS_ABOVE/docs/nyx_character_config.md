# Nyx Character Config

Nyx is the third playable fighter and the first new-generation character standard for NO GODS ABOVE. She is implemented through the reusable character architecture in `game.js`.

## Gameplay Identity

Nyx is a fast rushdown / aerial pressure fighter:

- Lower health than Kairo and Vanta: `860`.
- Faster ground movement, ground dash, air dash, and Super Dash.
- Medium-high jump with slightly lighter aerial gravity.
- Smaller hurtboxes to communicate a lighter defensive profile.
- Lower damage per hit than the baseline fighters.
- Higher combo potential through fast cancels, launcher access, aerial routes, Shadow Step, Dive Kick, and Rapid Flurry.
- Purple/magenta shadow assassin visual identity.

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

## Current Runtime Art Mapping

Nyx now uses dedicated final runtime atlases and a Nyx select portrait. Kairo and Vanta should not be edited as part of Nyx work.

| Nyx Sheet Slot | Runtime Asset Key |
|---|---|
| `coreMovement` | `nyxFinalCoreMovement` |
| `airMovement` | `nyxFinalAirMovement` |
| `groundNormals` | `nyxFinalGroundNormals` |
| `airNormals` | `nyxFinalAirNormals` |
| `specials` | `nyxFinalSpecials` |
| `defense` | `nyxFinalDefense` |
| `endStates` | `nyxFinalEndStates` |
| Select portrait | `assets/sprites/portraits/nyx_select.png` |

The atlas manifest lives at `assets/sprites/nyx_final/nyx_final_atlas_manifest.json`.

## Nyx Production Standard

Future new-generation characters should use Nyx's process as the template:

- Clear gameplay archetype before sprite generation.
- Full move identity before sprite generation.
- Dragon Ball FighterZ-inspired pacing.
- Ground combos.
- Air combos.
- Launcher routes.
- Jump-cancel routes.
- Air-dash compatibility.
- Special moves with clear visual identity.
- At least one flashy signature / ultimate-style move.
- Dedicated sprite sheet pipeline.
- Clean atlas extraction.
- Character select portrait/card art.
- Focused playtest pass after import.

Nyx's remaining production focus is final QA: visual animation mapping audit, signature / ultimate visual upgrade if needed, and normal matchup playtest confirmation.

Keep Nyx's combat config untouched unless a real tuning pass is requested.

For the full production roadmap and new-character planning template, see `docs/character_production_roadmap.md`.
For Nyx's sprite import/atlas structure and audit checklist, see `docs/nyx_sprite_import.md`.
