# Codex Bootstrap Prompt — NGA Engine V2

Invoke `$nga-engine-v2`, then use this prompt from the No Gods Above repository root.

---

We are beginning the No Gods Above Engine V2 program.

Treat the existing game as a valuable legacy implementation, not disposable code. Do not start by rewriting or deleting it. Your first task is an evidence-based architecture and migration audit, followed by the smallest safe scaffolding needed to begin V2 in parallel.

## Product target

Build a private custom cinematic 2.5D fighting-game engine exclusively for No Gods Above:

- TypeScript.
- Custom deterministic 60 Hz combat simulation.
- Three.js as the initial replaceable renderer.
- Browser and Steam desktop builds sharing the same core.
- Fully 3D stages and preferably rigged stylized 3D fighters.
- Normal side-view combat plus safe cinematic cameras for throws, command grabs, counters, intros, victories, and ultimates.
- Data-driven official character packages, not public arbitrary modding.
- Rollback-ready state architecture from the beginning.
- Tripo optional for source meshes; Blender for source cleanup/rigging/animation/export; no runtime dependency on either.
- Preserve legacy sprites and systems as design/timing/reference material where useful.

## Locked character rules

Every standard fighter has:

- 15 normals.
- 15 directional specials: Neutral/Forward/Back/Down/Up × Light/Medium/Heavy.
- Forward throw.
- Back throw.
- Air throw.
- Throw whiff and throw-tech behavior.
- One primary ultimate.
- Universal movement, defense, recovery, reaction, and presentation states.

Swahili is the first command-grab character. Command grabs are special moves and do not replace universal standard throws.

Initial production order:

1. Lamuh.
2. Sable.
3. Swahili.
4. Nyx.
5. Celeste.

## Required work for this task

1. Read all active `AGENTS.md` files and the `$nga-engine-v2` skill references.
2. Audit the repository:
   - Current runtime architecture.
   - Combat loop and timing.
   - Character data and move definitions.
   - Input, collision, animation, camera, VFX, audio, stages, UI, testing, build, and deployment.
   - SpriteForge/sprite-agent or other production tooling.
   - Existing web/desktop/Steam work.
   - Legacy assets that remain useful.
   - Tight coupling and migration risks.
3. Produce `docs/NGA_ENGINE_V2_AUDIT.md` with:
   - What exists.
   - What is reusable.
   - What must be replaced.
   - What must remain untouched during the benchmark.
   - Dependency and licensing inventory.
   - Major risks.
   - Recommended package boundaries.
4. Produce `docs/NGA_ENGINE_V2_ARCHITECTURE.md` with:
   - Simulation/render separation.
   - Fixed-step and serialization design.
   - Character/stage schema strategy.
   - Animation and root-motion policy.
   - Throw/command-grab architecture.
   - Camera director.
   - Browser/desktop adapters.
   - replay/rollback readiness.
   - cloud development and large-asset strategy.
5. Produce `docs/NGA_ENGINE_V2_MIGRATION_PLAN.md` with:
   - Phases and acceptance gates.
   - First Lamuh training-dummy vertical slice.
   - Sable matchup benchmark.
   - Swahili grab benchmark.
   - Explicit non-goals.
6. Add minimal V2 scaffolding only if it can be isolated cleanly:
   - Prefer a new workspace/package boundary.
   - Do not port characters yet.
   - Do not add speculative production dependencies without justification.
   - Do not replace the current game entrypoint.
7. Add or update tests only for the scaffolding you create.
8. Run existing and new validation commands.
9. Return:
   - Concise audit findings.
   - Files changed.
   - Commands run and results.
   - Exact next implementation task.
   - Any decisions that still require owner approval.

## Hard restrictions

- Do not mass-port all characters or attacks.
- Do not wire raw generated assets into production.
- Do not claim visual/gameplay approval from compilation.
- Do not use visual mesh collision for combat.
- Do not tie combat timing to render FPS.
- Do not introduce unseeded gameplay randomness.
- Do not put Tripo, Steam, cloud, or signing secrets in the repository.
- Do not break or remove the legacy playable build.
- Do not implement public mod support.
- Do not start rollback networking before deterministic replay and snapshot tests exist.

Work directly from repository evidence. If prior assumptions conflict with the actual code, document the conflict and choose the least destructive path.
