# NO GODS ABOVE — Codex Build Prompt

Build a complete browser-based 2D fighting game prototype.

Use HTML, CSS, and JavaScript Canvas only. Do not use Godot, Unity, Unreal, Phaser, or external game engines/frameworks.

## Project Goal

Create a playable Training Mode prototype where the player controls Veyra the Unclaimed and fights The Hollow Saint.

## Required Files

Create index.html, style.css, game.js, and README.md. Optional: split JS into src modules.

## Required Gameplay

Veyra can idle, walk, jump, crouch, dash, block, use light/medium/heavy attacks, directional attacks, jump attacks, 3 specials, ultimate, take damage, die, and win.

Enemy can idle, take damage, die, and optionally block/attack.

Combat must include hurtboxes, hitboxes, collision detection, damage, knockback, hit pause, health bars, ultimate meter, VFX, and debug hitbox toggle.

## Controls

A/D move, W jump, S crouch, Shift dash, J/K/L attacks, U+J/K/L specials, I+O ultimate, T taunt, P pause, H debug, R reset.

## Build Order

1. Canvas shell
2. Title menu
3. Training mode
4. Background rendering
5. Player placeholder movement
6. Enemy placeholder
7. Health bars
8. Sprite animation loading
9. Veyra basic movement
10. Attacks/hit detection
11. Enemy damage/death
12. Specials
13. Ultimate
14. VFX
15. Debug hitboxes
16. README updates

At every step, keep the game runnable.

## Asset Issues

AI assets may have labels, headers, uneven frame spacing, or decorative borders. Crop, approximate, placeholder, document, and keep moving.
