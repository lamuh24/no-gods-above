# Universal Character Contract

A V2 character should be represented by data first and runtime hooks second.

## Required fields

- Stable id/slug, display name, archetype, portrait/select metadata.
- Runtime profile values: health, movement, jump, gravity modifiers, scale, AI flags.
- Move catalog with command, startup, active, recovery, damage, hitstun, blockstun, knockback, cancel rules, resource costs, and spam/juggle protections.
- Animation aliases mapped to validated atlas rows/cells, with player/enemy parity.
- VFX/audio hooks that reference assets by alias rather than hard-coded paths.
- Validation notes: source assets, normalization report, smoke coverage, known fallbacks.

## Rules

- Hydrate runtime move data from raw profile config; do not patch hydrated structures directly.
- Keep character-specific overrides local to the character unless a global balance pass is requested.
- Do not mix raw generated sheets with runtime-ready atlases.
- Maintain fallback/history assets until a replacement has manifest coverage and smoke evidence.
