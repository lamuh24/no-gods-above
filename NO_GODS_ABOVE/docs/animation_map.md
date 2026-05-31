# NO GODS ABOVE - Kairo Final Animation Map

Active Kairo runtime sheets are under `assets/sprites/kairo_final/`.
The pack source copies are kept under `assets/sprites/kairo_final_source/`.

Every active Kairo Final runtime sheet is normalized to a 6 column x 5 row grid
with 320x320 cells, bottom-center anchoring, and a shared ground baseline.

## Sheet 1 - Basic Movement

- Row 0 = idle
- Row 1 = walk_forward
- Row 2 = walk_back
- Row 3 = dash
- Row 4 = crouch

## Sheet 2 - Defense / Recovery

- Row 0 = stand_up
- Row 1 = guard_idle / block
- Row 2 = damaged / hurt
- Row 3 = knockback
- Row 4 = get_up

## Sheet 3 - Core Attacks A

- Row 0 = neutral_light
- Row 1 = neutral_medium
- Row 2 = neutral_heavy
- Row 3 = forward_light
- Row 4 = forward_medium

## Sheet 4 - Core Attacks B

- Row 0 = forward_heavy
- Row 1 = back_light
- Row 2 = back_medium
- Row 3 = back_heavy
- Row 4 = taunt

## Sheet 5 - Low / Air

- Row 0 = down_light
- Row 1 = down_medium
- Row 2 = down_heavy
- Row 3 = jump_light
- Row 4 = jump_medium

## Sheet 6 - Specials / Ultimate

- Row 0 = jump_heavy
- Row 1 = special_1
- Row 2 = special_2
- Row 3 = special_3
- Row 4 = ultimate

## Sheet 7 - End States / Extras

- Row 0 = death
- Row 1 = victory
- Row 2 = level_up
- Row 3 = intro_pose
- Row 4 = select_idle

## Sprite Handling

Use bottom-center anchoring. Keep grounded feet aligned to one ground baseline.
Dash, projectile, and special travel are code-driven, not baked sprite movement.
