# VANTA REIGN — Animation Map

All Vanta sprite sheets use:

- 6 rows
- 6 frames per row
- solid #ff00ff magenta background
- rows read top to bottom
- frames read left to right

Default slicing:

```js
rows = 6;
columns = 6;
frameWidth = image.width / columns;
frameHeight = image.height / rows;
```

## vanta_basic_movement.png

```txt
Row 0 = idle
Row 1 = walk_forward
Row 2 = walk_back
Row 3 = dash
Row 4 = crouch
Row 5 = block
```

## vanta_core_attacks.png

```txt
Row 0 = neutral_light
Row 1 = neutral_medium
Row 2 = neutral_heavy
Row 3 = forward_light
Row 4 = forward_medium
Row 5 = forward_heavy
```

## vanta_back_low_attacks.png

```txt
Row 0 = back_light
Row 1 = back_medium
Row 2 = back_heavy
Row 3 = down_light
Row 4 = down_medium
Row 5 = down_heavy
```

## vanta_air_specials.png

```txt
Row 0 = jump_light
Row 1 = jump_medium
Row 2 = jump_heavy
Row 3 = special_1
Row 4 = special_2
Row 5 = special_3
```

## vanta_states_ultimate.png

```txt
Row 0 = damaged
Row 1 = death
Row 2 = level_up
Row 3 = ultimate
Row 4 = taunt
Row 5 = victory
```
