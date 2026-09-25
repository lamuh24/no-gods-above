# NGA Production Arena Packages

This directory contains approval-gated planning packages for production arenas. It does not contain combat authority or finished arena art.

Current package: `arenas/the_last_tribunal/arena.package.json`

Current milestone state:

- `production_arena_graybox_candidate`
- `deployable: false`
- `awaiting_human_graybox_and_concept_approval`

The Last Tribunal production brief is recorded as `APPROVED_AS_PRODUCTION_ARENA_BRIEF_V1`. That approval authorizes concept direction and deterministic graybox work only; it does not authorize final art, production textures, roster integration, or deployment.

The approved Stage Vertical Slice V1 remains the source of truth for combat-plane mapping, constrained gameplay-camera behavior, sprite presentation, and the 12-tick return from cinematic cameras. Arena art may consume those contracts but may not replace them.

Run `npm run validate:arena` from `NO_GODS_ABOVE/engine_v2` to validate the package and approval gates.
