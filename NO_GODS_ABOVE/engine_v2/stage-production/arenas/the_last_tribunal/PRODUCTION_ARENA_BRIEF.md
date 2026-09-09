# The Last Tribunal — Approved Production Arena Brief V1

Brief result: `APPROVED_AS_PRODUCTION_ARENA_BRIEF_V1`  
Current milestone: `production_arena_graybox_candidate`  
Deployable: `false`  
Approval: `awaiting_human_graybox_and_concept_approval`

## Identity

The Last Tribunal is an abandoned celestial courthouse where mortals once petitioned absent gods. At eclipse dusk, its empty witness galleries and eclipsed judgment oculus frame sanctioned duels over who has the right to judge divine power. Its purpose is to establish NGA's central thesis—gods can be judged—without visually favoring a fighter or faction.

The mood is solemn, oppressive, ceremonial, and controlled. The palette uses ink blue-black, cathedral red, aged brass, ash gray, and restrained cool-violet haze.

## Composition

- Foreground: sparse broken brass rails and stone markers outside the gameplay-safe center; no moving foreground form crosses a fighter.
- Midground: the flat tribunal dais, quiet columns, and empty witness balconies with broad, low-detail value blocks behind combat.
- Background: deep nave, distant ruined city, and a central eclipse placed above normal fighter and jump silhouettes.
- Floor: perfectly flat matte basalt with a low-contrast brass judgment circle and boundary inlays. Rendered seams, slopes, and reflections have no gameplay meaning and are visually prohibited in the lane.
- Silhouette: central eclipse and apse, tall side columns beyond the walls, open low-frequency center, and visible dark-brass boundary pylons at world X `-8.4` and `8.4`.

The fighter body band stays dark, neutral, and low-detail across world X `-8.2..8.2`, Y `0.35..5.8`. The beam corridor (`-9.2..9.2`, Y `0.4..4.8`), projectile lane (Y `0.45..3.8`), and 2.2-unit hit-spark regions suppress competing emission. Corner backings remain calm ash values. The eclipse rim begins above Y `6.1` to preserve high-jump readability.

## Contract lock

This arena inherits Stage Vertical Slice V1 unchanged: origin `(0,0,0)`, floor Y `0`, simulation-to-world scale `0.02`, sprite scale `0.0033`, gameplay bounds `-420..420` / `-8.4..8.4`, spawns `-76/+76` / `-1.52/+1.52`, default perspective camera `(0,5.3,20)` at 28 degrees, zoom distance `20..32`, and 12 fixed ticks for cinematic return.

Art, lighting, shadows, presentation meshes, floor geometry, parallax, atmosphere, and event cameras remain downstream presentation. They cannot define collision, grounding, walls, movement, hits, spacing, or outcomes.

## Motion and camera

Permitted motion is slow banner drift outside contrast masks, sparse dust outside VFX corridors, a maximum two-percent eclipse-corona pulse, distant low-frequency silhouettes, and allow-listed deterministic reaction markers. Regression capture freezes or match-seeds all motion.

The package defines constrained volumes for throws/command grabs, supers, ultimates, finishers, intros, and victories. Tracks mirror lateral offsets from a captured facing sign, keep both fighters visible, dedupe by deterministic event ID, abort when rollback invalidates their trigger, and return through the approved gameplay framing.

## Art and performance bounds

No finished art is authorized. A future approved pack is limited to 48 stage draw calls, 35,000 visible / 60,000 loaded triangles, 12 stage textures, 72 MB stage texture memory within a 96 MB total-stage target, eight material variants, two dynamic lights, and zero real-time stage shadow casters. Fighter shadows use the approved flat contact receiver.

The pack must provide structural and presentation geometry, painted planes, foreground decals, background layers, materials, light maps, shadow receivers, atmosphere, optional emission/rim masks, thumbnails, and deterministic validation captures.

## Human approval required

Humans must approve the identity/name, lore, eclipse time-of-day, palette, oculus prominence, floor motif, light model, performance budget, cinematic volumes/durations, permitted motion, and concept-art authorization. Approval of this brief will not authorize final art, runtime integration, gameplay changes, deployment, commit, push, or release.
