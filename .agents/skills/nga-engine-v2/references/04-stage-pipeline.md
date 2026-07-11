# Stage Pipeline

Every stage has three layers:

1. Gameplay layer: engine-owned combat plane, ground, boundaries, spawns, corner zones, wall-bounce surfaces, air limits, camera limits, and transition zones. Use simple authored collision proxies only.
2. Visual layer: fully 3D modular environment, lighting, fog, particles, background/foreground assets, LODs, and quality profiles.
3. Cinematic layer: gameplay, intro, victory, corner-safe, throw, command-grab, and ultimate camera anchors/volumes plus reduced-motion and restoration targets.

Tripo may generate props; Blender assembles and optimizes; NGA Engine owns behavior.

Stage packages include versioned stage data, runtime GLB, lighting, cameras, audio, quality settings, textures/music, source `.blend`, and provenance.

Web and Steam profiles may differ visually but must share identical gameplay boundaries and collision.

The first benchmark stage is an upgraded Ruined Divine Arena validating fighter readability, Black Halo identity, corners, wall bounce, impact effects, camera safety, and browser/desktop performance. Postpone stage destruction and transitions.
