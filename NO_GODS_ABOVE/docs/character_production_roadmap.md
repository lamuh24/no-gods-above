# Character Production Roadmap

This document is the current development direction for NO GODS ABOVE character production.

## Strategic Direction

Kairo and Vanta are stable legacy fighters for now. Keep them playable, keep their current movesets and art style, and only fix them if they break gameplay or are specifically requested later.

Nyx is the first new-generation fighter standard. After Nyx is complete, build exactly one more new-generation fighter from the Nyx production pipeline: Seris, the Halo Chain. After Seris is playable and tested, shift focus to controller support.

Do not rebuild the game, redesign the combat system, force legacy characters into the new pipeline, rework Kairo, rework Vanta, or change working Kairo/Vanta gameplay while adding new-character support.

## Character Classes

Legacy characters:

- Kairo
- Vanta

Legacy policy:

- Keep them playable.
- Keep their current movesets and art style.
- Fix gameplay-breaking bugs only.
- Do not spend production time fully converting them to the new-generation pipeline unless requested.

New-generation standard:

- Nyx
- Seris, the Halo Chain: the selected next fresh new-generation fighter after Nyx, before controller support

## Nyx Standard

Nyx defines the current production target for future fighters:

- Fast rushdown fighter.
- Aerial pressure specialist.
- Lower health.
- Lower damage per hit.
- High combo potential.
- Fast movement.
- Strong launcher and air-combo routes.
- Jump-cancel and air-dash compatible routing.
- Purple/magenta shadow assassin visual identity.
- Dedicated sprite-sheet pipeline.
- Clean atlas extraction.
- Character select portrait/card art.
- Focused playtest pass after import.

Nyx's signature / ultimate-style visual now uses the corrected large slash-wave VFX profile. Future Nyx VFX work should preserve the large ultimate/super scale and avoid projectile-style trimming.

## Current Roadmap

### Phase 1 - Finish Nyx Completely

Complete all remaining Nyx-only polish:

- Corrected large Nyx ultimate slash-wave VFX.
- Hook the corrected VFX into Nyx's signature / ultimate move.
- Verify the effect is large, readable, and not a tiny projectile line.
- Confirm Nyx's final sprites display correctly.
- Confirm Nyx character select image displays correctly.
- Confirm Nyx works in normal matchup playtests.
- Confirm no combat mechanics were unintentionally changed.

Nyx is complete when:

- Final sprite sheets are imported.
- Final animation mapping works.
- Character select art works.
- Normal matchup works.
- Signature / ultimate visual feels flashy and visible.
- No pink chroma background appears.
- No major atlas issues remain.

### Phase 2 - Create One More New-Generation Character

After Nyx is complete, create exactly one more new-generation fighter using the Nyx pipeline as the template: Seris, the Halo Chain.

Do not start controller support until Seris is at least playable.

Seris is a fresh fighter. She is not a Kairo rework or a Vanta rework.

Seris pre-production is recorded in `docs/seris_preproduction.md`.

Seris production identity:

- Mid-range chain / whip fighter.
- Health target: 960.
- Medium damage, medium speed.
- Precise measured movement.
- Ground poke confirms into chain pull or launcher.
- Jump-cancel and air-combo compatible routes.
- Ivory, black, turquoise, and pale gold visual identity.
- Signature / ultimate: Heaven's Guillotine, a large luminous chain-halo crescent slash.

New character production order:

1. Defined gameplay archetype first.
2. Defined move list second.
3. Defined visual identity third.
4. Sprite sheet production plan fourth.
5. Sprite sheet generation fifth.
6. Final audit sixth.
7. Atlas extraction/import seventh.
8. Character select image eighth.
9. Focused playtest ninth.
10. Normal matchup test tenth.

New-generation fighter requirements:

- Clear archetype.
- Clear health/damage/speed profile.
- Ground combo route.
- Launcher route.
- Air combo route.
- Jump cancel compatibility.
- Air dash compatibility.
- At least 3 specials.
- At least 1 flashy signature / ultimate visual.
- Full sprite sheet set.
- Character select portrait/card art.
- Final playtest pass.

Rejected / deferred archetype options from pre-production:

- Bront: armored pressure bruiser / close-range brawler. Strong idea, but risks visual and gameplay overlap with Vanta.
- Ivara: gravity / space manipulator. Strong identity, but more likely to strain the current system.
- Other ideas such as stance-switch, puppet/clone, projectile trap, boxer/brawler, teleport counter, or beast/feral mauler are deferred until after Seris and controller support.

Do not start sprite generation, runtime code, or gameplay implementation for Seris until explicitly instructed.

### Phase 3 - Controller Support

After Nyx and Seris are playable, begin controller support.

Controller support should include:

- Gamepad detection.
- Xbox-style controller mapping.
- PlayStation-style controller mapping if browser supports it.
- D-pad movement.
- Left stick movement.
- Jump.
- Light attack.
- Medium attack.
- Heavy attack.
- Special.
- Dash / air dash.
- Block.
- Pause.
- Character select navigation.
- Menu confirm / back.
- Remapping support if feasible.
- Keyboard controls must remain working.

Controller support rules:

- Do not break keyboard controls.
- Do not change combat mechanics.
- Do not change character balance.
- Do not rebuild input architecture unless necessary.
- Add controller support cleanly on top of the existing input system.
- Keep player 1 controls stable.
- Prepare for player 2 controller support later if feasible.

The goal is not to make every fighter identical. The goal is to make every new fighter production-ready through a repeatable modern pipeline.

## Updated Production Order

1. Finish Nyx slash VFX and final Nyx polish.
2. Lock Nyx as the first new-generation character standard.
3. Use the Seris pre-production brief as the selected new-generation character plan.
4. Build Seris using the Nyx pipeline when explicitly instructed.
5. Playtest Nyx vs Seris, plus legacy matchups.
6. Add controller support.
7. Run full keyboard + controller regression testing.

## New-Character Planning Template

Use this template before generating sprites or touching runtime code:

```markdown
# New Fighter Plan - <character name>

## Character Name
-

## Gameplay Archetype
-

## Health / Damage / Speed Profile
- Health:
- Damage per hit:
- Movement speed:
- Defensive profile:

## Movement Style
- Ground movement:
- Dash:
- Air dash:
- Jump:
- Super Dash interaction:

## Ground Moves
- Light:
- Medium:
- Heavy:
- Launcher:
- Low / directional normals:

## Air Moves
- Air light:
- Air medium:
- Air heavy:
- Air route purpose:

## Specials
- Special 1:
- Special 2:
- Special 3:

## Signature / Ultimate Move
- Name:
- Gameplay purpose:
- Visual/VFX identity:

## Visual Theme
- Silhouette:
- Costume/armor:
- Energy/magic motif:
- Personality read:

## Color Identity
- Primary:
- Secondary:
- VFX:
- UI/card accent:

## Sprite Sheet Requirements
- Movement rows:
- Air movement rows:
- Ground normals:
- Air normals:
- Specials:
- Defense / hit reactions:
- Knockdown / recovery / flavor:

## Character Select Card Direction
- Portrait pose:
- Background/VFX:
- Role label:
- Card accent:

## Playtest Checklist
- Ground combo:
- Launcher route:
- Jump cancel:
- Air combo:
- Air dash compatibility:
- Specials:
- Signature / ultimate:
- Matchups:
```

## Hard Constraints

- Kairo and Vanta remain legacy fighters unless explicitly requested.
- Nyx is the first real new-generation fighter.
- After Nyx, build Seris as exactly one fresh new-generation fighter before controller support.
- Seris is picked for pre-production, but do not build her until explicitly instructed.
- Controller support comes third, after Nyx and the next new-generation fighter are playable.
- New characters may have unique archetypes, stats, silhouettes, moves, and VFX, but should use the repeatable Nyx-style planning, atlas, import, select-card, and playtest process.
