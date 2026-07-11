# Engine Architecture

Recommended boundaries:
- `sim`: fixed-step deterministic match state.
- `input`: device sampling and command buffer.
- `combat`: states, collision, hits, throws, scaling, meter, recovery.
- `content-schema`: versioned character and stage manifests.
- `renderer-three`: replaceable Three.js presentation adapter.
- `animation`, `camera`, `vfx`, `audio`, `stages`, `training`, `replay`, `netcode`, `platform`, `ui`.

Rules:
- Authoritative combat tick is 60 Hz; rendering may interpolate only presentation.
- No wall-clock combat logic or unseeded gameplay randomness.
- Match state must serialize/restore, including fighter states, timers, inputs, active entities, combo state, resources, stage zone, and random seed.
- Use authored pushboxes, hurtboxes, strike boxes, throw boxes, projectile boxes, and stage boundaries. Never use visual mesh triangles as authoritative combat collision.
- Imported root motion is disabled by default. Engine motion is authoritative; explicit extracted motion curves require validation.
- Animation blending must never alter hitbox or state timing.
- Camera timelines require hit/block/whiff, interruption, KO, pause, cancel, reduced-motion, and guaranteed restoration behavior.
- Rendering, audio, input devices, storage, Steam, cloud saves, and networking sit behind adapters.
- Preserve replay/checksum support from the beginning so rollback can be added without replacing the simulation.
