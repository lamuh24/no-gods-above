---
name: nga-engine-v2
description: Plan, build, audit, migrate, or validate the custom No Gods Above cinematic 2.5D fighting-game engine. Use for NGA combat architecture, Three.js runtime work, official character integration, universal moves and throws, command grabs, 3D assets, Blender/Tripo pipelines, stages, camera cinematics, rollback readiness, browser/Steam builds, cloud development, and engine quality gates. Do not use for unrelated lore-only writing, anime episode scripting, marketing, or isolated concept art.
---

# NGA Engine V2

Build a private, custom fighting-game engine exclusively for **No Gods Above**. It is not a public character-modding platform. Its goal is to let the project owner add official canon fighters reliably without rewriting core combat systems.

## Mandatory first actions

1. Read the repository root `AGENTS.md`, current architecture, package scripts, character truth files, animation pipelines, and all references in this skill that apply to the task.
2. Audit before editing. State what already exists, what can be preserved, and what conflicts with the V2 contract.
3. Work on a dedicated branch or worktree. Do not destructively rewrite the current playable build.
4. Prefer a narrow vertical slice over broad partial implementation.
5. Keep the user informed with short, decision-level updates. Surface discovered risks early.
6. Never mark generated art, models, animation, or gameplay as production-approved without an explicit approval gate.

## Product definition

NGA Engine V2 is:

- A custom TypeScript fighting-game runtime.
- Rendered through Three.js or an equivalent replaceable rendering adapter.
- Mechanically 2D/2.5D with a deterministic 60 Hz combat plane.
- Visually capable of full 3D characters, stages, VFX, throws, command grabs, camera cuts, and cinematic ultimates.
- Built for browser deployment and a Steam desktop build from the same core code.
- Data-driven for internal official character production.
- Closed to unrestricted public character imports unless the owner changes that policy later.

External tools are asset suppliers, not runtime dependencies:

- Tripo or another generator may create starting meshes.
- Blender prepares, rigs, animates, validates, and exports assets.
- NGA Engine loads standard runtime formats and owns all gameplay behavior.
- No production character may depend on a proprietary cloud project remaining available.

## Non-negotiable engine boundaries

The custom engine owns:

- Fixed-step simulation and match state.
- Input buffering and command recognition.
- Fighter state machines.
- Movement, collision, hit resolution, throws, command grabs, and hit-grabs.
- Frame data, cancels, combo rules, damage scaling, meter, Burst, and recovery.
- Animation event timing.
- Camera direction and cinematic restoration.
- Stage gameplay boundaries.
- AI, replay, deterministic test, training, save, and platform behavior.
- Character and stage schemas plus migrations and validators.

The rendering layer owns only presentation. It must not decide combat outcomes.

Do not use detailed visual meshes as authoritative combat collision. Use engine-defined simple primitives and anchors.

## Required source references

Read as applicable:

- `references/00-decision-record.md`
- `references/01-engine-architecture.md`
- `references/02-universal-character-contract.md`
- `references/03-asset-animation-pipeline.md`
- `references/04-stage-pipeline.md`
- `references/05-cloud-development.md`
- `references/06-validation-acceptance.md`
- `references/07-migration-roadmap.md`
- `references/08-risks-non-goals.md`

Use templates in `assets/` when creating schemas or repository instructions.

## Implementation behavior

### Preserve before replacing

- Treat current sprites, move implementations, VFX, audio, timing, lore locks, and character documents as source material.
- Keep the legacy game runnable until the V2 benchmark passes its acceptance gates.
- Quarantine broken or unapproved assets rather than silently wiring them into gameplay.
- Avoid mass-porting all characters or all 31 attacks before the engine benchmark is approved.

### Build from the simulation outward

Order:

1. Deterministic fixed-step loop.
2. Serializable match state.
3. Input and command buffer.
4. Universal fighter state machine.
5. Hitboxes, hurtboxes, pushboxes, throws, and hit resolution.
6. Animation adapter and event timeline.
7. Camera director.
8. VFX/audio adapters.
9. Character and stage schemas.
10. Debug/training tools.
11. Web and desktop packaging.
12. Rollback networking after local determinism is proven, while maintaining rollback-ready constraints throughout.

### First benchmark roster

Use this implementation order unless the owner changes it:

1. Lamuh versus a training dummy.
2. Lamuh versus Sable.
3. Swahili, to validate standard throws, paired victim animations, weapons, command grabs, hit-grabs, and cinematic grab cameras.
4. Nyx, to validate advanced air actions.
5. Celeste, to validate summons and multi-entity character systems.

Do not port the full roster first.

### Canonical attack contract

Every standard fighter has:

- 15 normals.
- 15 directional specials: five families × Light/Medium/Heavy.
- Forward throw.
- Back throw.
- Air throw.
- Throw whiff and throw-tech support.
- One primary ultimate.
- Shared movement, defense, recovery, and system actions.

Swahili is the first official command-grab character. Command grabs are character-specific specials and do not replace standard universal throws.

### Approval discipline

For every meaningful visual or gameplay milestone, produce reviewable evidence:

- In-game capture.
- Frame-data report.
- Hitbox/hurtbox overlay.
- Animation preview.
- Camera sequence preview when applicable.
- Performance metrics.
- Validation output.
- Before/after comparison when replacing legacy behavior.

Do not claim success solely because the code compiles.

## Architecture rules

- TypeScript strict mode.
- Fixed 60 Hz combat ticks independent of render refresh.
- No gameplay randomness without an explicit seeded source.
- Simulation state must be serializable and restorable.
- Engine-driven displacement for combat; imported animation root motion is disabled or extracted into authored motion curves.
- Rendering, audio, input devices, storage, and platform APIs sit behind adapters.
- Content schemas are versioned and migrated; never silently reinterpret old manifests.
- Character code must use engine capabilities instead of modifying core rules per fighter.
- Character exceptions require explicit extension points and tests.
- No generic rigid-body physics for primary fighting-game combat.
- Camera cinematics must always have cancellation and restoration paths for hit, block, whiff, KO, interruption, pause, and scene transition.
- Grabs use synchronized attacker/victim tracks with anchors and deterministic target alignment.
- Desktop and browser builds share simulation/content packages.
- Secrets never enter source control.

## Definition of done

A task is complete only when:

1. Required tests and validators pass.
2. The affected behavior is demonstrated in the actual runtime.
3. Determinism is preserved.
4. Legacy behavior or assets were not destroyed without approval.
5. Performance remains inside the target profile.
6. Documentation and schemas match implementation.
7. Remaining risks and unsupported cases are stated honestly.
