---
name: nga-engine-v2
description: Preserve-first implementation guide for the custom No Gods Above Engine V2. Use when Codex is asked to audit, migrate, extend, or build NGA Engine V2 systems, including character architecture, stage pipelines, animation manifests, 3D-to-2.5D asset workflow, validation gates, and repo-preserving modernization work.
---

# NGA Engine V2

## Prime directive

Preserve the existing playable game and art pipeline while moving toward a modular NGA Engine V2. Do not rewrite broad runtime systems, delete legacy content, or replace validated assets unless the task explicitly calls for that scope.

## Required startup

1. Read root `SESSION_CONTEXT.md` and root `AGENTS.md` before touching files.
2. Check `NO_GODS_ABOVE/skills/` and read every repo-local NGA skill matching the task area.
3. For character, sprite, atlas, VFX, or animation work, also read `NO_GODS_ABOVE/docs/CHARACTER_SPRITE_PIPELINE.md` and the character manifest being touched.
4. Run `git status --short` and identify unrelated dirty files before editing.

## Preservation rules

- Keep the currently playable HTML/JS game functional during every step.
- Prefer additive seams, manifests, adapters, and tests over destructive rewrites.
- Leave legacy assets in place as fallbacks until runtime coverage and validation prove replacements safe.
- Do not change combat tuning, input routing, networking, or deployment behavior while doing engine documentation or asset-pipeline work unless requested.
- Treat raw generated art, imported 3D models, and candidate sheets as source material only until normalized and validated.

## Engine V2 target architecture

Use these boundaries when adding or auditing V2 work:

- **Runtime core:** deterministic match state, fighter state machines, collision/hit resolution, camera, input, and replay-safe timing.
- **Character contract:** profile metadata, move definitions, animation aliases, atlas manifests, frame data, VFX hooks, audio hooks, AI flags, and select-screen assets.
- **Stage contract:** world bounds, spawn points, collision surfaces, layered render assets, parallax/camera tuning, stage card, and focused QA report.
- **Asset pipeline:** source art/imports -> normalization -> validation report -> runtime-ready transparent atlases/manifests -> focused smoke.
- **Tooling:** NGA Forge and scripts may prepare assets, but the game runtime consumes only validated runtime outputs.
- **Validation:** syntax checks, manifest validation, focused smoke scripts, visual screenshots when perceptible UI/gameplay changes are made, and deployment checks when public delivery changes.

## Migration workflow

1. Audit the existing implementation and document the seam to preserve.
2. Add or update a manifest/schema before wiring new runtime behavior when feasible.
3. Build the smallest vertical slice that keeps fallbacks available.
4. Run focused validation for the touched area plus a lightweight regression check.
5. Update `SESSION_CONTEXT.md` with changed files, decisions, next steps, and gotchas.
6. Commit only scoped files with an explicit message.

## Reference files

Read only what applies:

- `references/universal-character-contract.md` for character/profile/move/animation manifest expectations.
- `references/stage-pipeline.md` for stage assets, camera/collision alignment, and QA outputs.
- `references/asset-animation-workflow.md` for 3D/source art, sprite normalization, atlas validation, and runtime handoff.
- `references/validation-gates.md` for recommended checks by task type.
- `references/bootstrap-prompts.md` for reusable Codex prompts that preserve the current repo while starting V2 work.
