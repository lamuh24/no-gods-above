# Validation and Acceptance

Engine gates:
- Fixed-step outcome is independent of render refresh.
- Recorded inputs reproduce identical checksums.
- Snapshot restore reproduces the same subsequent outcome.
- No wall-clock combat logic, unseeded randomness, renderer-owned hits, or undefined pause/hitstop/slow-motion behavior.

Character gates:
- Required files/clips exist.
- Schema/rig/scale/facing/ground contact pass.
- Startup/active/recovery, boxes, invulnerability, cancels, meter, projectile lifetime, recovery, camera restoration, throw compatibility, command-grab eligibility, AI reachability, and asset references validate.

Automated tests must cover hit, block, launcher, standard throw tech, command-grab no-tech, whiff recovery, interrupted grab cleanup, ultimate hit/block/whiff/KO restoration, Burst, Guard Cancel, air-action limits, and bounce-loop prevention.

Stage gates cover spawns, boundaries, collision proxies, cinematic clipping, readability, identical gameplay geometry across quality profiles, lighting, and performance.

Set measured budgets for simulation/render/GPU time, draw calls, triangles, bones, texture memory, particles, audio, load time, and heap growth after profiling the first benchmark.

Plan accessibility for remapping, reduced camera motion/flashing, subtitles, UI scale, color-safe indicators, and separate audio controls.

Compilation alone is not approval; provide runtime capture, debug overlays, test/performance reports, limitations, and explicit approval state.
