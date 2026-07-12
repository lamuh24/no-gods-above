# Import, Cleanup, Rig, and Export Contract

## Mesh acceptance before rigging

- Owner approves front, side, back, and three-quarter renders against the primary turnaround.
- Face, skin tone, outward loc silhouette, coat length, teal sash, pendant, loose pants, and sandals match the lock.
- Body, coat, inner clothes/pants, sash, hair, sandals, and pendant remain separate named objects.
- No self-intersections at shoulders, hips, knees, coat split, hands, or locs in neutral A-pose.
- Apply transforms; forward is +X, up is +Y, feet rest at Y=0; character height is approximately 2.0 Three.js units after import.
- Remove hidden duplicate faces, isolated vertices, internal shells, floor/base geometry, cameras, and lights.
- Preserve UVs; embed textures; use web-safe PBR inputs and 2K maximum texture size.

## Required rig

Use the exact bone and anchor names in `manifests/lamuh_prototype_v0.model.json`. Add clean deformation loops at shoulders, elbows, wrists, hips, knees, ankles, neck, and coat splits. Keep coat-tail and loc secondary bones optional and presentation-only. Every vertex must have normalized weights; cap influences at four.

## Animation and root-motion rules

- Supply every required clip named in the model manifest.
- Root translation and root rotation remain constant in every clip. Engine V2 owns world X/Y, facing, gravity, landing, throw pairing, and collision.
- Animate in place. Do not key grab, victim, release, camera, VFX, or ground anchors away from their authored bones.
- Export one GLB with named skeleton and clips. Preserve a source `.blend`, clean `.blend`, exported `.glb`, preview contact sheet, provenance record, and license note.
- Preview at 15 fps stepped presentation while the deterministic simulation remains 60 Hz.

## Swap and validation

1. Replace `public/models/lamuh_prototype_v0.glb` only after mesh approval and backup the adapter-proof file.
2. Run `npm run validate:model`; missing nodes/clips or root translation are hard failures.
3. Run `npm run validate`, `npm run build`, and `npm run smoke:browser`.
4. Capture idle, walk, jump, all ground/air normals, block, hit, knockdown/get-up, throw capture/release/whiff/tech, and the HUD clip status.
5. Confirm the capsule never reappears, the dummy remains valid debug geometry, stage/camera bounds hold, and renderer memory stays stable.
