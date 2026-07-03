# Sable Release Delay Decision

Date: 2026-07-03
Character: Sable
Stage reviewed: animator-rebuild-v2
Decision: Delay Sable from the next public Steam/demo roster.

## Decision

Do not ship the current Sable Style 4 animator-rebuild-v2 animation pack. Archive it as a failed animation-quality candidate, not as a production candidate.

Sable is not deleted. Her reference art, lore, visual lock, prompts, reports, manifests, generated and quarantined files, previous preview packs, and playable MVP data remain preserved.

## Status

- `releaseStatus`: `wip_delayed`
- `previewStatus`: `animation_rebuild_required`
- `approvedForLiveRoster`: `false`
- `candidateArchiveStatus`: `failed_animation_quality_candidate`
- `productionCandidate`: `false`

## Approved Scope

- Sable visual design is still approved.
- Sable gameplay concept is still approved.
- Sable's existing playable/dev-preview data remains available for internal testing.

## Not Release Ready

The current animation packs are not release-ready. The current rebuild-v2 should not be promoted live.

Reason: missing, choppy, and inconsistent animations with insufficient fighting-game readability. The rebuild proved the pipeline, but it does not meet the Steam/demo release quality bar.

## Public Roster Rule

Exclude Sable from the next public Steam/demo roster unless explicitly overridden by the user.

Current implementation note: Sable is removed from normal public fighter selection in `NO_GODS_ABOVE/index.html` and `NO_GODS_ABOVE/game.js`. Internal/dev access remains available through the `?sableTest` hidden-test gate and direct test hooks. This does not delete existing playable MVP data.

## Recommended Restart Method

Restart Sable animation production with a key-pose-first pipeline:

1. Key poses.
2. In-betweens.
3. Assembled spritesheet.
4. SpriteForge validation.
5. Preview approval.

No live promotion until the future pack reaches `GAME_READY`.
