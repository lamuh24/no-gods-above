# Lamuh 3D Vertical Slice Report

Date: 2026-07-11
Branch: `codex/engine-v2-lamuh-3d-prototype`

## Outcome

The runtime vertical-slice infrastructure is working, but the locally generated character did not pass the Lamuh visual-quality gate. It is retained only as an adapter/rig proof and must not be represented as production character art.

The one bounded Path A attempt produced a 488,284-byte binary GLB with 24 named bones, 11 named anchors, four separately named skinned layers, and all 29 required clips. The browser replaces the P1 capsule after loading, applies toon shading plus an outline, selects clips from deterministic fighter state, and samples presentation at 15 fps without writing to simulation state.

Visual review found that the procedural primitive construction still reads like a mannequin and does not achieve Lamuh's distinctive face, loc volume, coat tailoring, or overall authored silhouette. Per the honesty gate, local model polishing stopped and Path B was prepared under `assets/characters/lamuh_prototype_v0/tripo_input/`.

## Preservation boundary

- No gameplay, collision, damage, movement, throw, combo, replay, snapshot, camera-limit, or stage-bound code changed.
- Engine state remains authoritative for position, facing, gravity, landing, hitboxes, hurtboxes, pushboxes, throw pairing, and anchors.
- The training dummy remains debug geometry.
- Root motion is absent and validator-enforced.
- Legacy `NO_GODS_ABOVE/game.js` was not edited.

## Runtime adapter

`src/debug/characterVisualAdapter.ts` maps state to named clips. Attack IDs map directly to their dedicated clips. Jump uses `jump_air`, dash uses `dash_forward`, crouch/standing block remain distinct, hit reaction selects light/heavy presentation, throw phases use the attacker clip, whiff uses its own clip, and tech selects attacker/victim clips by role. `phaseTick` is quantized to 15 fps; the 60 Hz deterministic tick is unchanged.

The GLB path is stable at `/models/lamuh_prototype_v0.glb`. A Tripo/Blender replacement can swap in after preserving the exact node and clip names in `manifests/lamuh_prototype_v0.model.json`.

## Validation evidence

- `npm run validate:model`: passed; 24 bones, 11 anchors, 29 clips, no root translation.
- `npm run build`: passed.
- `npm run smoke:browser`: passed on Windows/Chromium with no console errors.
- Browser replay checksum remained `0f5b884d`.
- Renderer geometry and texture counts remained stable during warm-up sampling.
- Existing aerial-normal, throw, trade, block, combo-reset, and camera/stage smoke evidence remained passing.

## Remaining owner gate

Generate/import the Tripo mesh from the locked package, approve its turnaround before rigging, then run the documented cleanup, rig, animation, and swap validation. The current adapter-proof model is deliberately marked `path_a_failed_visual_gate_adapter_proof` in its manifest.
