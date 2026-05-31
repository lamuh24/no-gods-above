# KAIRO NULL — Asset Manifest

## Active Gameplay Assets

```txt
assets/sprites/kairo/kairo_basic_movement.png
assets/sprites/kairo/kairo_core_attacks.png
assets/sprites/kairo/kairo_back_low_attacks.png
assets/sprites/kairo/kairo_air_specials.png
assets/sprites/kairo/kairo_states_ultimate.png
```

## Unused Reference Assets

```txt
assets/unused_reference/
```

These are not active gameplay files. Do not load them as player animations unless explicitly instructed later.

## Required Codex Update

Update player sprite loading paths from previous character to:

```js
const KAIRO_SHEETS = {
  basic: 'assets/sprites/kairo/kairo_basic_movement.png',
  core: 'assets/sprites/kairo/kairo_core_attacks.png',
  backLow: 'assets/sprites/kairo/kairo_back_low_attacks.png',
  airSpecials: 'assets/sprites/kairo/kairo_air_specials.png',
  statesUltimate: 'assets/sprites/kairo/kairo_states_ultimate.png'
};
```
