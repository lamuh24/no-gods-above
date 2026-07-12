# Stage Pipeline

## Stage contract

Each stage needs:

- Stable id, display name, stage-select card, and asset manifest.
- World width, camera bounds, spawn points, ground plane, and death/fall limits.
- Collision surfaces aligned to visible art, including side platforms.
- Layered render plan: background, midground, gameplay platforms, foreground framing, parallax, opacity, and active-gameplay occlusion rules.
- Focused QA report and screenshot when visuals or collision are changed.

## Integration rules

- Keep visual art and collision values synchronized in the same change.
- Avoid foreground layers that hide fighters, hit sparks, projectiles, or readable combat silhouettes during active gameplay.
- Preserve existing stages unless the task explicitly requests a shared renderer refactor.
- Validate local asset URLs and run at least a focused stage smoke after changes.
