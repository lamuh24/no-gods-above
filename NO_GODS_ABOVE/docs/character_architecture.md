# NO GODS ABOVE - Character Config Architecture

This project treats fighters as data-driven character configs in `game.js`.
The refactor preserves the `fighterz-combat-baseline-v1` combat feel: do not redesign combat, rebuild the game, or change working Kairo/Vanta gameplay while adding new-character support.

## Current Production Direction

Kairo and Vanta are stable legacy fighters. Keep them playable, keep their current movesets and art style, and only fix them if they break gameplay or are specifically requested later.

Nyx is the first new-generation fighter standard. After Nyx is complete, plan and build exactly one fresh new-generation fighter through the Nyx-style pipeline instead of retrofitting Kairo or Vanta. That fighter is Seris, the Halo Chain. After Seris is playable and tested, shift focus to controller support.

For the full roadmap and new-character planning template, see `docs/character_production_roadmap.md`.
For Seris pre-production, see `docs/seris_preproduction.md`.

## Config Location

Character configs live in `characterProfiles`.

Current playable configs:

- `kairo`: Kairo Final, stable legacy fighter, canonical runtime art.
- `vanta`: Vanta Reign, stable legacy fighter, canonical runtime art.
- `nyx`: fast rushdown / aerial pressure fighter, first new-generation fighter standard, using Nyx final atlases and Nyx select portrait.

Planned new-generation config:

- `seris`: planned mid-range chain / whip fighter, not yet implemented. Do not add runtime config, sprites, select-card data, or controller work until explicitly requested.

For Nyx-specific stats, moves, final atlas mappings, and remaining visual QA items, see `docs/nyx_character_config.md`.
For Nyx's atlas/import structure and audit checklist, see `docs/nyx_sprite_import.md`.

Each entry owns:

- `id`, `name`, `shortName`
- `health`
- `movement`
- `jump`
- `airDash`
- `attacks.player`
- `attacks.enemy`
- `damageValues`
- `hitstunValues`
- `blockstunValues`
- `launchProperties`
- `knockbackValues`
- `cancelWindows`
- `comboRoutes`
- `sheets`
- `animationReferences`
- `hitboxes`
- `hurtboxes`
- `specialMoves`
- `ai`
- `effects`
- `projectileColor`, `trailColor`

`hydrateCharacterProfile(profile)` compiles each raw config into runtime-ready data:

- `profile.moves.player`
- `profile.moves.enemy`
- `profile.playerAnimations`
- `profile.enemyAnimations`
- `profile.animationReferences`

The game now reads active combat data through helper functions such as `getMove(fighter)`, `getMovementStats(fighter)`, `getJumpStats(fighter)`, `getAirDashStats(fighter)`, `getComboRoutes(fighter)`, and `getHitboxDefinition(fighter, boxType)`.

## Attack Definitions

Use `attackDef()` for every move:

```js
attackDef(damage, startup, active, recovery, hitstun, knockbackX, knockbackY, boxType, flags)
```

All frame values are authored in frames at 60 FPS. Runtime compilation converts them to seconds.

Important fields:

- `damage`: raw damage before combo scaling.
- `startup`, `active`, `recovery`: move timing.
- `hitstun`: defender stun on hit.
- `blockstun`: generated from hitstun unless `flags.blockstun` is set.
- `knockbackX`, `knockbackY`: defender push and launch velocity.
- `boxType`: key into the character's `hitboxes`.
- `flags.cancelOnHit`: valid hit-confirm routes.
- `flags.jumpCancel`: allows jump cancel.
- `flags.dashCancel`: allows dash or Super Dash cancel.
- `flags.launcher`: makes the move launch.
- `flags.softKnockdown` / `flags.hardKnockdown`: landing recovery result.
- `flags.projectile`: spawns a projectile using `specialMoves`.
- `flags.noHit`: animation/action only, no direct hitbox.

## Adding A New Character

Before generating sprites or touching runtime code, fill out the planning template in `docs/character_production_roadmap.md`.

New-generation fighters should follow this order:

1. Define gameplay identity.
2. Define move list.
3. Define visual identity.
4. Generate sprite sheets.
5. Audit and fix sheets.
6. Import atlases.
7. Make character select image.
8. Playtest.

Do not use this process to force Kairo or Vanta into the new pipeline. They are legacy fighters unless specifically requested.

Seris-specific starting direction:

- Name: Seris, the Halo Chain.
- Archetype: mid-range chain / whip fighter.
- Health target: 960.
- Profile: medium damage, medium speed, precise measured movement.
- Visual identity: ivory, black, turquoise, and pale gold celestial chain duelist.
- Signature / ultimate: Heaven's Guillotine.

1. Add sprite assets to a new folder under `assets/sprites/<character_id>/`.
2. Add each new sprite sheet to `assetPaths`.
3. Add matching sheet metadata to `sheetMeta`.
4. Add a new `characterProfiles.<id>` entry.
5. Set identity fields:

```js
id: "new_character",
name: "NEW CHARACTER",
shortName: "NEW",
health: 1000
```

6. Copy baseline movement unless the character intentionally differs:

```js
movement: cloneData(baselineMovementStats),
jump: cloneData(baselineJumpStats),
airDash: cloneData(baselineAirDashStats)
```

7. Define attacks. To match the current baseline exactly, copy:

```js
attacks: {
  player: cloneData(baselinePlayerAttacks),
  enemy: cloneData(baselineEnemyAttacks)
}
```

8. Define combo routes:

```js
comboRoutes: cloneData(baselineComboRoutes)
```

9. Define hitboxes and hurtboxes:

```js
hitboxes: cloneData(baselineHitboxes),
hurtboxes: {
  standing: { w: 66, h: 164 },
  crouching: { w: 66, h: 94 },
  dead: { w: 66, h: 62 }
}
```

10. Define special move behavior:

```js
specialMoves: cloneData(baselineSpecialMoves)
```

11. Point the config at sheet keys:

```js
sheets: {
  basic: "newCharacterBasic",
  defense: "newCharacterDefense",
  coreA: "newCharacterCoreA",
  coreB: "newCharacterCoreB",
  lowAir: "newCharacterLowAir",
  specials: "newCharacterSpecials",
  end: "newCharacterEnd"
}
```

12. Use the final-fighter animation mappers if the sheets follow the current 6x5 layout:

```js
buildPlayerAnimations: buildFinalFighterPlayerAnimations,
buildEnemyAnimations: buildFinalFighterEnemyAnimations
```

13. Set visual effect colors:

```js
projectileColor: "#7fd6ff",
trailColor: "#8c3aa8",
effects: { dashTrail: true }
```

14. Add the character to character select only after the runtime config works. This current refactor does not change the UI layout.

15. Add the character id to `selectableCharacterIds` and add/update `getOpponentId()` so Training Mode chooses a valid default matchup.

16. Add a select-card in `index.html` and a matching card accent in `style.css`. If the character has no final art yet, point the portrait and sheet keys at an existing placeholder and mark that clearly in the config.

## Baseline Rule

Kairo and Vanta are legacy fighters and should remain stable. If a future new-generation character needs unique timing, damage, hitstun, launch height, knockback, cancel windows, hitboxes, or special behavior, change only that character's config instead of editing global combat logic.
