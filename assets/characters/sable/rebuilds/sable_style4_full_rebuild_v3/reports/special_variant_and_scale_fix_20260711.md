# Sable Special Variant And Scale Fix

Status: wired to hidden `?sableTest` only. Public roster remains unchanged.

## Runtime Routing

The move definitions and action-phase resolver previously collapsed every strength into generic family aliases (`void_shard`, `phase_lunge`, `void_anchor`, `ground_rift`, `vertical_phase`). All strength-specific special keys now resolve to their matching L/M/H strips.

- Neutral: `neutral_light_special`, `neutral_medium_special`, `neutral_heavy_special`
- Forward: `forward_light_special`, `forward_medium_special`, `forward_heavy_special`
- Back: `back_light_special`, `back_medium_special`, `back_heavy_special`
- Down: `down_light_special`, `down_medium_special`, `down_heavy_special`
- Up: `up_light_special`, `up_medium_special`, `up_heavy_special`

Shared gameplay values remain shared where previously designed. This change affects animation selection only.

## Scale Corrections

| Clip | Old opening height | Corrected opening height |
| --- | ---: | ---: |
| forward_light | 221 px | 352 px |
| down_special_heavy | posture-specific small generation | 353 px guard |
| up_special_light | 214 px | 352 px |
| up_special_medium | 217 px | 352 px |
| up_special_heavy | 205 px | 352 px |

`forward_light` and `down_special_heavy` use new reference-input generations. Disconnected neighboring-cell fragments were removed only where the central anatomy was complete.

New up-special generations were rejected because airborne bodies crossed cell boundaries and were cropped. The previously Claude-approved, anatomically complete up-special strips were uniformly enlarged from their guard frames instead. Motion, frame count, identity, and hit timing were preserved.

## Verification

- Cross-clip candidate gate: 39 passed, 0 failed
- `npm.cmd run check:game`: pass
- `npm.cmd --prefix tools/sprite-agent run typecheck`: pass
- Fresh frame scrubs: `reports/frame_scrub/<clip>/consistency_352_v2_final/`
- Runtime cache keys: `sable-full-rebuild-v3-preview-3`, `game.js?v=sable-consistency-2`, `nga-cache-v14-sable-variants`
