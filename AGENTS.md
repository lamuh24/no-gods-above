# NO GODS ABOVE Agent Instructions

These rules apply to this repository and all agent sessions working in it.

## SESSION_CONTEXT.md

At the start of every session:

- Check whether `SESSION_CONTEXT.md` exists in the project root.
- If it exists, read it before reading or editing other project files.
- If it does not exist, create it with the standard session-context template before continuing.

At the end of every session or wrap-up:

- Update `SESSION_CONTEXT.md` with what changed, what remains in progress, decisions made, next steps, and gotchas.
- Keep updates brief, factual, and useful for another agent resuming the work.
- Attempt to sync important handoff notes to the central Obsidian memory base when available. If that bridge is unreachable, leave a repo/file fallback note and say so.

## Repo-Local NGA Skills

Before starting any task, check whether a repo-local NGA skill applies. The skill docs live in:

- `NO_GODS_ABOVE/skills/`

Read the relevant skill docs before editing files. If a task touches multiple areas, read all relevant skills. When delivering, report which NGA skill docs were read and applied. Do not claim a skill was used unless it was actually read.

Character creation / new playable fighter / moveset / animation integration:

- `NO_GODS_ABOVE/skills/playable_character_production_skill.md`
- `NO_GODS_ABOVE/skills/character_visual_consistency_skill.md`
- `NO_GODS_ABOVE/skills/sprite_sheet_validation_skill.md`
- `NO_GODS_ABOVE/docs/CHARACTER_SPRITE_PIPELINE.md`

Generated sprite sheet normalization / atlas slicing / transparency cleanup:

- `NO_GODS_ABOVE/skills/sprite_sheet_validation_skill.md`
- `NO_GODS_ABOVE/skills/character_visual_consistency_skill.md`
- `NO_GODS_ABOVE/docs/CHARACTER_SPRITE_PIPELINE.md`

VFX alignment / hitbox-VFX sync / beams / projectiles / aura:

- `NO_GODS_ABOVE/skills/vfx_integration_audit_skill.md`
- `NO_GODS_ABOVE/skills/character_visual_consistency_skill.md`

Cinematic ultimate / super / transformation / finisher:

- `NO_GODS_ABOVE/skills/cinematic_ultimate_production_skill.md`
- `NO_GODS_ABOVE/skills/vfx_integration_audit_skill.md`
- `NO_GODS_ABOVE/skills/character_visual_consistency_skill.md`

Local versus / controller / player select / match flow:

- `NO_GODS_ABOVE/skills/local_versus_feature_skill.md`

Balance / hitstun / knockback / juggle / spam prevention:

- `NO_GODS_ABOVE/skills/fighting_game_balance_pass_skill.md`

UI asset packs / menus / HUD / icons:

- `NO_GODS_ABOVE/skills/ui_asset_pack_integration_skill.md`

Deployment / release / hosting / final validation:

- `NO_GODS_ABOVE/skills/deployment_readiness_skill.md`

Git safety / checkpoints / rollback:

- `NO_GODS_ABOVE/skills/git_checkpoint_safety_skill.md`

## Codex / Claude Collaboration Safety

- One task = one branch = one PR.
- Use GitHub Issues as the task board.
- Declare file scope before editing.
- Do not push to master.
- Do not deploy without human instruction.
- Read `agent/memory/character_truth.md` before touching roster, portraits, sprites, marketing art, or asset prompts.
- Read `agent/memory/visual_rules.md` before touching UI, art, stage, VFX assets, or asset prompts.
- Do not edit `agent/memory/character_truth.md`, `agent/memory/visual_rules.md`, `AGENTS.md`, or `CLAUDE.md` except in explicit documentation/process PRs.
- Run validation before PR.
- Include screenshots for visual changes.
- Update `SESSION_CONTEXT.md` only according to the existing project convention. If it is too large, recommend a future cap/archive task instead of aggressively rewriting it.

## Character And Sprite Work

Before any character, sprite-sheet, atlas, VFX-sheet, animation mapping, or visual coverage work:

- Read `SESSION_CONTEXT.md`.
- Read `NO_GODS_ABOVE/docs/CHARACTER_SPRITE_PIPELINE.md`.
- For LAMUH work, also read `NO_GODS_ABOVE/docs/lamuh_animation_manifest.md`.

Generated sprite sheets are source or candidate art only unless they already match the runtime atlas contract exactly. Do not wire raw generated sheets directly into gameplay. Normalize them first into runtime-ready transparent atlases, then validate them.

Required sprite workflow:

- Preserve the character design lock: face, skin tone, proportions, outfit, silhouette, palette, scale, and identity.
- Normalize generated sheets before integration: exact grid, exact cell size, real alpha, background removed, baseline checked, body scale checked, preview saved, validation report saved.
- Preserve old atlases as fallback/history until validation and runtime coverage prove the replacement is safe.
- Integrate only the intended aliases for the sheet being worked on.
- Run focused smokes and relevant regression smokes before calling sprite work complete.
- Update the character manifest and `SESSION_CONTEXT.md` after integration.

Scope rules:

- Do not change gameplay mechanics, damage, input routing, move counts, or unrelated combat systems during sprite-pipeline work unless the user explicitly asks.
- Do not touch unrelated characters while working on one character, except to verify enemy/player mapping parity for that character.
- Do not overwrite fallback atlases globally.
- Prefer coverage first, polish later: replace missing, old-style, idle-only, or mismatched rows before micro-polishing already working animations.
