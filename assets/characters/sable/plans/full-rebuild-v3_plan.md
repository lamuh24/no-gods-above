# SpriteForge Stage Plan - sable / full-rebuild-v3

Generated: 2026-07-08T18:17:18.263Z
Preview-only: yes
Live roster wiring: disabled

## Clips

- idle: 8 frames, 8 fps, movement
- walk_forward: 12 frames, 10 fps, movement
- walk_backward: 12 frames, 10 fps, movement
- jump: 12 frames, 12 fps, movement
- crouch: 8 frames, 8 fps, movement
- block: 8 frames, 10 fps, defense
- hit_stun: 8 frames, 10 fps, damage
- knockdown: 8 frames, 10 fps, damage
- getup: 8 frames, 10 fps, damage
- stand_light: 8 frames, 14 fps, normal
- stand_medium: 10 frames, 13 fps, normal
- stand_heavy: 12 frames, 12 fps, normal
- crouch_light: 8 frames, 14 fps, normal
- crouch_medium: 10 frames, 13 fps, normal
- crouch_heavy: 12 frames, 12 fps, normal
- jump_light: 8 frames, 14 fps, normal
- jump_medium: 10 frames, 13 fps, normal
- jump_heavy: 12 frames, 12 fps, normal
- forward_light: 8 frames, 14 fps, normal
- forward_medium: 10 frames, 13 fps, normal
- forward_heavy: 12 frames, 12 fps, normal
- back_light: 8 frames, 14 fps, normal
- back_medium: 10 frames, 13 fps, normal
- back_heavy: 12 frames, 12 fps, normal
- neutral_special_light: 12 frames, 12 fps, special
- neutral_special_medium: 14 frames, 12 fps, special
- neutral_special_heavy: 16 frames, 12 fps, special
- forward_special_light: 12 frames, 12 fps, special
- forward_special_medium: 14 frames, 12 fps, special
- forward_special_heavy: 16 frames, 12 fps, special
- back_special_light: 12 frames, 12 fps, special
- back_special_medium: 14 frames, 12 fps, special
- back_special_heavy: 16 frames, 12 fps, special
- down_special_light: 12 frames, 12 fps, special
- down_special_medium: 14 frames, 12 fps, special
- down_special_heavy: 16 frames, 12 fps, special
- up_special_light: 12 frames, 12 fps, special
- up_special_medium: 14 frames, 12 fps, special
- up_special_heavy: 16 frames, 12 fps, special

## Manual Loop

1. Generate prompts into prompts/outbox.
2. Use a manual image provider.
3. Drop generated PNG/WEBP sheets into generated/inbox/<clip>/.
4. Run validate, normalize, export, and test.
5. Keep results preview-only until explicitly approved.
