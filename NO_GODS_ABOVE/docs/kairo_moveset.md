# KAIRO NULL — Moveset

## Character Role

Kairo Null is a fast cyber ninja fighter using dual cyan forearm energy blades. He replaces the previous playable character.

## Controls

Keep the same controls:

| Input | Action |
|---|---|
| J | Light attack |
| K | Medium attack |
| L | Heavy attack |
| U + J | Special 1 |
| U + K | Special 2 |
| U + L | Special 3 |
| I + O | Ultimate |
| Shift | Dash |
| S | Crouch |
| Hold Back | Block |

## Normal Attacks

| Animation Key | Move Name | Input | Damage | Purpose |
|---|---|---|---:|---|
| neutral_light | Razor Tap | J | 35 | fast starter |
| neutral_medium | Cyan Cross | K | 65 | main poke |
| neutral_heavy | Split Circuit | L | 110 | heavy punish |
| forward_light | Needle Step | Forward + J | 45 | advancing poke |
| forward_medium | Vector Lunge | Forward + K | 75 | whiff punish |
| forward_heavy | Neon Breaker | Forward + L | 125 | knockback heavy |
| back_light | Ghost Cut | Back + J | 40 | defensive poke |
| back_medium | Reverse Edge | Back + K | 70 | anti-approach |
| back_heavy | Counter Surge | Back + L | 105 | launcher/counter |
| down_light | Low Spark | Down + J | 30 | quick low poke |
| down_medium | Sweep Vector | Down + K | 60 | low confirm |
| down_heavy | Circuit Sweep | Down + L | 90 | knockdown sweep |
| jump_light | Air Razor | Air + J | 35 | air-to-air |
| jump_medium | Sky Cross | Air + K | 70 | jump-in |
| jump_heavy | Comet Slice | Air + L | 105 | heavy jump-in |

## Specials

| Animation Key | Move Name | Input | Damage | Behavior |
|---|---|---|---:|---|
| special_1 | Photon Dash Cut | U + J | 120 | fast dash slash / gap closer |
| special_2 | Null Pulse Shot | U + K | 95 | ranged cyan energy burst |
| special_3 | Rising Prism Slash | U + L | 135 | rising anti-air slash |

## Ultimate

| Animation Key | Move Name | Input | Damage |
|---|---|---|---:|
| ultimate | Overclock: Zero Dawn | I + O | 300 |

Ultimate behavior:
- requires full meter
- spends all meter
- creates cinematic pause
- adds screen shake
- fires large cyan energy effect
- big knockback

## Implementation Note

This patch should preserve the existing game controls and combat architecture. Replace old animation keys with Kairo sheets mapped in `docs/kairo_animation_map.md`.
