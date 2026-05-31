# KAIRO NULL — Animation Map

All Kairo sprite sheets are intended to be:

- 6 rows
- 6 frames per row
- read rows top-to-bottom
- read frames left-to-right
- solid #ff00ff magenta background
- no text or labels inside the gameplay area

Default slicing:

```js
rows = 6;
columns = 6;
frameWidth = image.width / columns;
frameHeight = image.height / rows;
```

If any sheet has uneven spacing, crop/approximate or use placeholder frames temporarily. Keep the game playable.

---

## assets/sprites/kairo/kairo_basic_movement.png

| Row | Animation Key | Description |
|---:|---|---|
| 0 | idle | standing ready stance |
| 1 | walk_forward | walking toward opponent |
| 2 | walk_back | walking away from opponent |
| 3 | dash | fast forward cyber dash |
| 4 | crouch | low crouching guard stance |
| 5 | block | cyan blade guard / energy block |

---

## assets/sprites/kairo/kairo_core_attacks.png

| Row | Animation Key | Description |
|---:|---|---|
| 0 | neutral_light | quick standing blade jab |
| 1 | neutral_medium | medium horizontal blade slash |
| 2 | neutral_heavy | heavy standing power slash |
| 3 | forward_light | advancing quick stab/slash |
| 4 | forward_medium | forward lunging blade strike |
| 5 | forward_heavy | heavy advancing cyber slash |

---

## assets/sprites/kairo/kairo_back_low_attacks.png

| Row | Animation Key | Description |
|---:|---|---|
| 0 | back_light | quick retreating slash |
| 1 | back_medium | defensive backward blade swipe |
| 2 | back_heavy | powerful reverse counter slash |
| 3 | down_light | fast low crouching blade poke |
| 4 | down_medium | low sweeping cyan blade slash |
| 5 | down_heavy | heavy low sweep with energy arc |

---

## assets/sprites/kairo/kairo_air_specials.png

| Row | Animation Key | Description |
|---:|---|---|
| 0 | jump_light | quick aerial blade slash |
| 1 | jump_medium | midair cross slash |
| 2 | jump_heavy | diving heavy slash / slam |
| 3 | special_1 | Photon Dash Cut |
| 4 | special_2 | Null Pulse Shot |
| 5 | special_3 | Rising Prism Slash |

---

## assets/sprites/kairo/kairo_states_ultimate.png

| Row | Animation Key | Description |
|---:|---|---|
| 0 | damaged | hit reaction / stagger |
| 1 | death | collapse / defeat |
| 2 | level_up | cyan power-up aura |
| 3 | ultimate | Overclock: Zero Dawn |
| 4 | taunt | confident cyber-ninja taunt |
| 5 | victory | win pose |
