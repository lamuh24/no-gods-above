# VANTA REIGN PATCH

This patch adds **Vanta Reign** as the new enemy/rival character.

Vanta is designed to replace the old Hollow Saint dummy and eventually become playable in local versus or multiplayer.

## Included Sprite Sheets

```txt
assets/sprites/vanta/vanta_basic_movement.png
assets/sprites/vanta/vanta_core_attacks.png
assets/sprites/vanta/vanta_back_low_attacks.png
assets/sprites/vanta/vanta_air_specials.png
assets/sprites/vanta/vanta_states_ultimate.png
```

## Important

Vanta starts on the right side of the screen and should face left toward Kairo.

The sprite sheets are drawn facing right. Codex should mirror Vanta horizontally in code instead of generating left-facing assets.

## Integration Goal

First:

```txt
Kairo = active player
Vanta = right-side training enemy
```

Later:

```txt
Kairo = Player 1
Vanta = Player 2
```
