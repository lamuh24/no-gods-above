# VANTA REIGN — Sprite Handling Rules

## Facing Direction

Vanta starts on the right side of the screen.

The sprite sheets are drawn facing right by default.

Do not create separate left-facing sprite sheets.

Instead, mirror the sprite in code when Vanta is on the right side.

## Required Behavior

```txt
fighter on left side = render normally
fighter on right side = mirror horizontally
```

Use bottom-center anchoring before and after mirroring.

## Hitbox Mirroring Rule

When Vanta faces left:

- flip hitbox offsetX
- flip projectile velocity
- flip dash direction
- flip knockback direction
- flip special movement direction

## Grounded Animation Stability

For all grounded rows:

- use a stable bottom-center pivot
- keep feet aligned to the same ground baseline
- do not treat pose movement inside sprite frames as world movement
- dash and special travel should be handled in code
- crop or pad frames to consistent dimensions if needed

## Priority

Make Vanta stable and playable first. Perfect polish can happen later.
