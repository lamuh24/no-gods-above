# Suggested repository-root AGENTS.md section

## NGA Engine V2

- Invoke and follow the repo skill at `.agents/skills/nga-engine-v2/SKILL.md` for engine, combat, character, stage, animation, 3D asset, camera, cloud-development, browser, desktop, Steam, replay, or rollback work.
- Preserve the current playable implementation until V2 benchmark acceptance is explicit.
- Use dedicated branches/worktrees for V2 work.
- Never wire generated sprite sheets, models, animation, VFX, or audio directly into production without validation and approval.
- Combat is deterministic at 60 Hz and independent of render refresh.
- Rendering cannot determine hit outcomes.
- Character and stage manifests are versioned and validated.
- Standard fighters require 15 normals, 15 directional specials, forward/back/air throws, and one ultimate.
- Swahili is the first command-grab fighter; command grabs do not replace universal throws.
- Imported animation root motion is disabled by default; engine-authored displacement is authoritative.
- Grabs require paired attacker/victim animation tracks and alignment anchors.
- Keep code and manifests in Git. Store large binary sources through the approved LFS/object-storage workflow.
- Never commit secrets.
- Run the repository's documented typecheck, lint, unit, content-validation, determinism, and build commands before reporting completion.
- Return captures/reports for visual or gameplay changes; compilation alone is not approval.
