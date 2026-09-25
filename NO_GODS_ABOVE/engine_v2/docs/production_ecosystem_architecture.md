# NGA Engine V2 Production Ecosystem Decision

Status: accepted architecture, Milestone A implementation slice

Date: 2026-07-12

## Outcome

NGA Engine V2 remains a specialized fighting-game production system. It is not becoming a general-purpose engine.

The production ecosystem has five bounded products:

1. NGA Runtime owns deterministic match execution and presentation playback.
2. NGA Forge owns motion authoring, combat synchronization, transition review, validation, and publishing.
3. NGA Asset Factory owns offline generation, cleanup, pose conditioning, and provenance capture.
4. NGA Validation Lab owns deterministic, gameplay, transition, visual, and performance evidence.
5. NGA Automation Orchestrator queues repeatable work and escalates creative decisions to a human.

The binding source-of-truth rule is:

> Individual source frames plus authored metadata form an Animation Package. Atlases and sprite sheets are compiled deployment artifacts.

Existing validated 448 x 448 sheets remain supported as legacy runtime exports and fallbacks. They are not deleted, rewritten, or reclassified as production masters by this slice.

## Binding boundaries

- Gameplay remains sprite-based.
- Optional 3D models are offline pose and camera references only.
- Runtime character rigs, runtime skeletal fighters, gameplay motion capture, and runtime 3D-to-sprite conversion are removed from the Engine V2 roadmap.
- Simulation remains fixed-step, deterministic, serializable, renderer-independent, and authoritative for combat.
- Artwork exposure, transitions, VFX, audio, and camera requests never decide whether a hit occurs.
- Presentation events use stable rollback-reconcilable IDs.
- Visual transitions may replace existing artwork or hide a legal cut; they may not add gameplay frames.
- Variable-size source frames and integer world-space anchors are the production source. Fixed grids remain compiler export profiles.
- Generated content requires provenance, hard-gate validation, and explicit human approval before promotion.
- Generated output never overwrites source content.
- WebGL2 remains the shipping baseline; WebGPU, generic ECS, generic node scripting, and broad engine features are deferred.

## Binding move-timing authority

The fixed 60 Hz simulation rate defines the duration of one simulation tick. It does not define, imply, normalize, or cap the duration of a move.

Every move owns an independently authored integer duration in simulation ticks. Authors must choose that duration from the move's weight, readability, combat role, risk and reward, character identity, animation quality, and balance. A light, heavy, throw, special, and recovery are not normalized toward a shared duration, and one fighter's timing is never inherited merely because another move has the same category.

For every production Animation Package:

- `simulationLength` is the complete authoritative move-clock duration.
- `combatTrack.startup + combatTrack.active + combatTrack.recovery` must equal `simulationLength`.
- source-frame exposures must cover `simulationLength` exactly and contiguously.
- visual exposures and combat phases align by default.
- any intentional visual/gameplay timing difference must identify its exact range, visual state, gameplay state, reason, and explicit approval.
- hitstop is an authoritative simulation behavior. When it freezes the move cursor, the freeze does not silently consume authored move-clock frames; its effect on elapsed global ticks must be explicit.
- rendering remains non-authoritative. The simulation selects the move frame, combat state, and presentation events; the renderer only displays that selected state.

Forge may preview a timeline at alternate playback speeds, but a speed-scaled preview does not redefine combat timing. Promotion requires an authored move-clock timeline in integer simulation ticks. Retired technical fixtures may retain older metadata solely for deterministic regression coverage; their durations are not templates for production characters.

## Implemented Milestone A seam

The first additive contract slice lives entirely inside `NO_GODS_ABOVE/engine_v2/`:

- `schemas/production/character-bundle.schema.json`
- `schemas/production/animation-package.schema.json`
- `schemas/production/pose-token.schema.json`
- `schemas/production/transition.schema.json`
- `schemas/production/combat-track.schema.json`
- `schemas/production/presentation-event.schema.json`
- `schemas/production/provenance.schema.json`
- `schemas/production/compiled-runtime-manifest.schema.json`

`lamuh_legacy_motion_fixture` proves the contract shape for an `idle -> standing_heavy -> idle` motion loop without supplying or promoting gameplay art. Human review recorded `REJECTED_FOR_CHARACTER_ART_REVISION`; every package is `retired`, approval state is `rejected`, and the compiler must emit `deployable: false`.

The deterministic compiler:

- reads only from `content-source/`;
- validates exposure coverage, phase bounds, pose references, transition targets, combat timing, anchors, rollback event IDs, provenance, and promotion state;
- sorts compiled animations deterministically;
- derives a SHA-256 source digest from canonicalized source documents;
- writes only under `generated/`; and
- rejects output paths that could overwrite authored source.

## Reconciliation with the prior prototype roadmap

The existing headless kernel, input/replay work, gameplay repair, aerial normals, Three.js debug renderer, and browser evidence remain valid and preserved.

The prior recommendation to build a temporary rigged Lamuh as a runtime fighter is superseded. A mannequin or rig may still be used offline for difficult poses, throws, command grabs, foreshortening, and cinematic blocking, but its renders are conditioning material for sprite production.

The owner aerial-normal playtest remains useful for accepting the current combat prototype. It no longer authorizes runtime 3D character integration.

## Next gate

Do not restructure the repository into the proposed final monorepo yet. The rejected legacy fixture may validate technical contracts only; new character production remains blocked until the correct final reference is supplied.

Swahili's approved design-reference sheet now clears the character-design-reference gate. It does not clear the motion-source gate: the first real package still requires approved individual idle and standing-heavy/recovery frames, a locked weapon action, and Swahili-specific combat timing before `character.bundle.json` can be validly published or compiled.

```text
Idle -> Standing Heavy -> whiff recovery -> Idle
```

Then prove:

```text
Idle -> Standing Heavy -> hitstop -> cancel -> one special -> recovery -> Idle
Jump/Fall -> Landing -> Idle
```

That follow-up should connect Forge-authored source frames to the deterministic compiler while preserving legacy atlases as runtime fallbacks. Throws follow only after the motion/transition compiler seam is proven; runtime rigs do not.
