# Decision Record

No Gods Above Engine V2 is a private, story-driven, custom fighting-game engine for official canon characters. It is not a public M.U.G.E.N-compatible mod platform.

Runtime decisions:
- TypeScript custom combat/runtime engine.
- Three.js as the initial replaceable renderer.
- Deterministic 60 Hz 2D/2.5D combat plane.
- Fully 3D stages and preferably rigged stylized 3D fighters.
- Browser and Steam desktop builds share simulation and content packages.

Asset decisions:
- Tripo or replacements may supply starting meshes.
- Blender is the local source-of-truth DCC for cleanup, rigging, animation, and export.
- Runtime assets use standard formats and never depend on a cloud project remaining online.

Visual direction:
- Readable side-view gameplay.
- Cinematic cameras for throws, command grabs, counters, intros, victories, and ultimates.
- Selected ultimate shots may use pre-rendered Blender sequences while combat remains engine-authoritative.

Initial roster order: Lamuh, Sable, Swahili, Nyx, Celeste.

Every standard fighter has 15 normals, 15 directional specials, forward/back/air throws, and one primary ultimate. Swahili is the first command-grab fighter.
