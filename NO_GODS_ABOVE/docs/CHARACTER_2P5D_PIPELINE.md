# Character 2.5D Pipeline

## Purpose

This branch, `feature/nga-2p5d-character-style`, is a safe workspace for the new 2.5D / 3D-inspired No Gods Above character style.

The branch should support character art experiments, animation-sheet tests, NGA Forge pipeline work, and future roster conversion without destabilizing `master`.

## Branch Scope

Preferred work areas:

- `tools/nga-forge/`
- `NO_GODS_ABOVE/docs/`
- character pipeline manifests and validation reports
- non-destructive source, candidate, preview, and test-output folders

Avoid changing gameplay systems, combat values, input routing, stage logic, netcode, or existing roster behavior unless a later task explicitly requires it.

## Style Goals

The target style is 2.5D: characters should read like dimensional, lit, sculpted fighters while still exporting into sprite-friendly runtime assets.

Core goals:

- stronger body volume, lighting, and readable silhouettes
- consistent face, body scale, palette, and outfit identity across every generated sheet
- animation frames that can be normalized into transparent runtime atlases
- body-first action poses, with large beams, portals, shockwaves, and bursts separated into VFX layers when needed
- no raw generated sheets wired directly into runtime

## Lamuh Anchor

Lamuh is the anchor character for this style exploration.

All Lamuh 2.5D work must preserve the existing identity lock:

- Black male rushdown fighter
- dark locs / dreads as hair, not attack limbs
- white battle coat, black outfit, gold trim, and cyan / blue mirror-energy accents
- athletic build, grounded stance, confident focused face
- mirror-energy main-character style

Lamuh Legacy remains the home for old Lamuh art. New 2.5D work should not collapse the redesigned `lamuh` and `lamuh_legacy` split.

## Expected Outputs

This branch may produce:

- Forge source imports, model tests, and render-preset experiments
- transparent atlas candidates with exact grid and cell contracts
- contact sheets, row previews, validation reports, and smoke reports
- updated character manifests and character-lock docs
- planned migration notes for future roster conversion

Generated art is candidate or source material until it passes the repo sprite pipeline contract:

- exact atlas dimensions and cell size
- real alpha transparency
- no baked background, grid, text, or row bleed
- stable baseline and body scale
- preserved identity against the approved anchor
- focused smoke coverage before runtime wiring

## NGA Forge Path

NGA Forge should remain the main lab for 2.5D source-to-sprite workflow work.

Near-term Forge priorities:

- preserve character-centric project data and labeled references
- support imported 3D/2.5D sources without assuming CUDA-only tooling
- render repeatable orthographic / fighting-game camera presets
- export traceable manifests with source, render, validation, and placeholder flags
- keep Blender optional but honest when unavailable

## Future Roster Path

After Lamuh proves the style, the roster conversion path should be deliberate:

1. Lock Lamuh's 2.5D Sheet 1 identity and validation standards.
2. Prove one complete Lamuh sheet family through Forge, normalization, preview, and smoke testing.
3. Document any new atlas contract or render preset changes.
4. Convert one additional new-generation fighter as a comparison pass.
5. Only then plan broader roster migration.

Do not bulk-convert the roster before the Lamuh anchor pass proves the workflow.

## Guardrails

- Keep `master` stable; branch work should remain reviewable and easy to abandon.
- Preserve old atlases and manifests as fallback/history until replacements are validated.
- Keep gameplay mechanics, damage, hitboxes, input routing, and existing character configs unchanged during art-pipeline experiments.
- Stage and commit only scoped branch files when creating checkpoints.
- Update `SESSION_CONTEXT.md` after meaningful branch work.
