# NGA Forge

NGA Forge is the internal character production studio for **No Gods Above**. It is not part
of the main game runtime and never writes into `NO_GODS_ABOVE/`.

Each character moves through an 8-step pipeline:

1. **Profile** — identity + full lore bible (power source, fighting style, motifs, palette, trailer hook, series notes). Saving regenerates `lore.md`.
2. **References** — labeled concept-art gallery (main design, front/side/back, expression, outfit, weapon, trailer style, lore/world).
3. **Model Source** — Placeholder mannequin, Import GLB/GLTF/FBX/OBJ, or future AI adapters (External API / Local AI / Custom NGA — visible but not selectable until real adapters land).
4. **Cleanup** — Blender pass: center, feet at origin, normalize height, apply scale/rotation, optional toon material, clean GLB export. Honest passthrough fallback when Blender is missing.
5. **Preview** — Three.js GLB viewer (source vs clean).
6. **2.5D Render** — preset renders with a shared fixed camera/floor/light rig: 448x448 sprite frame, 1024 turntables, 460x520 select portrait, 1920x1080 splash.
7. **Animation Prep** — fighting-game animation slots with frame data (startup/active/recovery), sources (Mixamo, AI mocap, video-to-anim, Cascadeur, Blender, custom), root motion, sprite export ranges.
8. **Export** — writes `export/no-gods-above-export/characters/{slug}/` with model, renders, animations.json, lore, and `manifest.json` (including a `placeholder` flag the game side can trust).

Design document: [REDESIGN.md](REDESIGN.md).

## Run It

Backend (port 8765):

```powershell
cd tools\nga-forge\backend
python -m venv .venv            # first time only
.\.venv\Scripts\python -m pip install -r requirements.txt
.\.venv\Scripts\python -m uvicorn app.main:app --host 127.0.0.1 --port 8765
```

Frontend (port 5175):

```powershell
cd tools\nga-forge\frontend
npm install                     # first time only
npm run dev
```

Open `http://127.0.0.1:5175`. The frontend talks to `http://127.0.0.1:8765`
(override with `VITE_NGA_FORGE_API`).

On first run the backend seeds the roster: Lamuh, Celeste, Sol, Seris, Nyx, Kairo, Vanta Reign.

## Blender (optional but recommended)

Set the Blender path in **Settings** inside the app, or set `NGA_FORGE_BLENDER`, or have
`blender` on PATH. Without it, cleanup and renders fall back to clearly-flagged stand-ins
(pipeline status `placeholder`, warnings everywhere). With it, you get real normalization
and the shared-rig preset renders from `backend/blender/`.

## Data Layout

```text
backend/data/                      gitignored runtime data
  project/project.json             settings (export root, blender path)
  project/characters/{slug}/       character.json, lore.md, references/, model/, renders/, animations metadata, export history
  jobs/                            job records
export/                            gitignored default export root
  no-gods-above-export/characters/{slug}/  model/ renders/ spritesheets/ animations/ lore/ manifest.json
```

## API Summary

- `GET /health`, `GET /settings`, `PATCH /settings`
- `GET /model-sources`, `GET /render-presets`
- `GET|POST /characters`, `GET|PATCH|DELETE /characters/{slug}`
- `POST|PATCH|DELETE /characters/{slug}/references[...]`
- `PUT /characters/{slug}/animations`
- `GET /characters/{slug}/files/{relpath}` (path-safe file serving)
- `POST /characters/{slug}/model/generate` (placeholder only for now)
- `POST /characters/{slug}/model/import` (GLB/GLTF/FBX/OBJ)
- `POST /characters/{slug}/pipeline/cleanup|render|export`
- `GET /jobs`, `GET /jobs/{id}`

## Plugging In Real Generators Later

Future adapters live in `backend/app/sources/` (`external_api.py`, `local_ai.py`,
`custom_nga.py`). Each must expose `available() -> (bool, reason)` and
`generate(record, progress) -> SourceResult`, and must keep working when its dependencies
are missing. No CUDA assumptions — the target machine runs a Radeon RX 9070 XT.

## Fighting Game Limitations (unchanged and still true)

- A single image misses back/side/hands/feet/costume continuity; generated topology may rig poorly.
- 2.5D sprite renders still need the existing No Gods Above atlas validation (cell size, alpha, baseline, no detached artifacts) before any runtime import.
- Exports flagged `placeholder: true` in `manifest.json` must never ship in the game.
