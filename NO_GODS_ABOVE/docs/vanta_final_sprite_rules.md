# VANTA FINAL — Sprite Rules

## Runtime Standard

- clean sheets only for runtime
- every sheet uses a uniform 6 x 5 grid
- every row has exactly 6 frames
- every sheet has exactly 5 rows
- no text / no labels / no grid lines in runtime assets

## Slicing

Use:

```js
columns = 6;
rows = 5;
frameWidth = image.width / columns;
frameHeight = image.height / rows;
```

## Anchoring

Use bottom-center anchoring.

Grounded rows should align to one shared invisible ground baseline.

The character body should stay above the baseline.
The bottom of the shoes should touch the baseline.

## Motion

Do not treat sprite-internal pose shifts as world movement.

Dash travel should be handled in code.
Projectile travel should be handled in code.
Special move movement should be handled in code.

## Facing Direction

Vanta is drawn facing right by default.

If Vanta spawns on the right side of the arena, mirror him horizontally in code so he faces left toward Kairo.

When mirrored:
- flip hitbox X offsets
- flip projectile velocity
- flip dash direction
- flip special travel direction
- flip knockback direction
