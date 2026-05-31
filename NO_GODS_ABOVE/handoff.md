# NO GODS ABOVE — Codex Handoff

## Project Summary

NO GODS ABOVE is a browser-based 2D fighting game prototype built entirely with AI-generated assets and AI-generated code.

Use HTML, CSS, and JavaScript Canvas only. Do not use Godot, Unity, Unreal, Phaser, or any external game engine/framework.

## Core Concept

In a ruined dark-fantasy world abandoned by gods, a godless warrior named Veyra the Unclaimed fights corrupted divine beings.

The first playable prototype is Training Mode where Veyra fights The Hollow Saint in a gothic ruined courtyard.

## Main Character

Veyra the Unclaimed is a fast dark-fantasy chain-blade fighter.

Visual identity: gothic armor, dark cloak, long dark hair, chain-blade weapon, purple/red dark energy, serious anime fighting-game silhouette.

Gameplay identity: fast movement, mid-range chain attacks, light/medium/heavy attack system, directional attacks, jump attacks, three special moves, ultimate attack, dash-focused pressure.

## Enemy Character

The Hollow Saint is the prototype enemy/training dummy.

Visual identity: corrupted divine soldier, hooded black robe, cracked gold/bone-white armor, broken halo, glowing orange eyes, holy but ruined.

## Main Stage

The Forsaken Courtyard is a gothic ruined cathedral courtyard under a red eclipse.

## Build Goal

Create a playable browser fighting game prototype where:

1. The player starts at a title screen.
2. The player enters Training Mode.
3. Veyra spawns on the left.
4. The Hollow Saint spawns on the right.
5. The player can move, jump, dash, crouch, block, attack, use specials, and use ultimate.
6. The enemy takes damage.
7. Health bars update.
8. Ultimate meter fills.
9. Hit sparks and basic VFX appear.
10. Enemy dies at 0 HP.
11. The game can reset the round.
12. Debug hitboxes can be toggled.

## Asset Handling Philosophy

The assets are AI-generated and may include labels, headers, uneven rows, imperfect spacing, magenta backgrounds, decorative borders, or slight character inconsistencies.

Do not let imperfect assets block the prototype. Crop, approximate, placeholder, document, and keep moving.

## Controls

A/D move, W jump, S crouch, Shift dash, J/K/L attacks, U+J/K/L specials, I+O ultimate, T taunt, P pause, H debug, R reset, hold back to block.

For MVP, Veyra starts left, Hollow Saint starts right, D is forward, A is back/block.

## Success Criteria

index.html opens and runs the game. Menu appears. Training Mode starts. Veyra is controllable. Hollow Saint takes damage. Health bars update. Ultimate meter fills. Specials and ultimate work. Enemy death triggers at 0 HP. Round reset works. Debug hitboxes work. Missing audio does not crash.
