# NGA Forge Redesign — Internal Studio Pipeline for No Gods Above

Status: approved design document. This describes the rebuild of `tools/nga-forge/` from a
single-screen image-to-3D demo into the internal character production system for
No Gods Above (characters, lore, references, models, 2.5D renders, animation prep, exports).

Hard constraints (do not violate):
- Never modify anything under `NO_GODS_ABOVE/`. The Forge writes only inside
  `tools/nga-forge/` and the configurable export root.
- No required AI model. No TripoSR / Stable Fast 3D / Hunyuan3D / Meshy / Tripo dependency
  to run. Those are future adapters behind a stable interface.
- No CUDA assumption. Target machine is Windows with a Radeon RX 9070 XT.
- The app must be fully usable with only: the placeholder mannequin and imported
  GLB/GLTF/FBX/OBJ files. Blender is optional but recommended (set `NGA_FORGE_BLENDER`).

---

## 1. Audit of the Current Prototype

### Keep (it works and is the right foundation)
- **FastAPI backend + React/Vite/Three.js frontend.** Python is the right backend because the
  Blender bridge and any future local AI adapters are Python. Keep ports 8765 / 5175.
- **Generator adapter registry pattern** (`backend/app/generators/registry.py`) — the
  plug-in idea is correct; it gets generalized into "model sources".
- **Pure-Python placeholder GLB writer** (`generators/placeholder.py`) — zero-dependency,
  always works. Becomes the "Placeholder Model" source.
- **Blender script** (`scripts/blender_process_model.py`) — import, center, feet origin,
  height normalize, toon fallback material, clean GLB export, transparent renders. This is
  the core of the cleanup pipeline; it gets extended, not replaced.
- **Persistent JSON job records with polling** — fine for a local single-user tool.
- **Three.js GLB viewer** with auto-framing — keep, mount it per character.

### Remove
- **TripoSR / Stable Fast 3D / Hunyuan3D as selectable generators.** Today they appear as
  options and silently fall back to placeholder — that is misleading. They become greyed-out
  "Future Adapter" cards under the Local AI source mode, never selectable until a real
  adapter reports itself available.
- **Free-text `character_name` and `output_folder` preset fields.** Character identity must
  come from the character record, not a textbox you can typo. Output locations are derived
  from the character, never typed.
- **The single-screen "everything at once" layout.** Replaced by Dashboard + per-character
  step workspace.

### Rename
- "Generators" → **Model Sources** (placeholder / import / external API / local AI / custom NGA).
- "Stage Image" / Concept Input → part of the **References** step with labeled gallery.
- "NGA Export Preset" → **Render Presets** (a data-driven preset list, not one hardcoded form).

### Rebuild
- **Storage:** job-UUID-keyed outputs (`data/outputs/{uuid}/`) → character-centric project
  store (`data/project/characters/{slug}/...`). Jobs still exist but reference a character;
  their outputs land in the character's folders.
- **UI:** one page → Dashboard, Character Workspace (8-step pipeline), Jobs panel, Settings.
- **Export:** today files are trapped in `backend/data/outputs/`. New export pipeline writes
  the `no-gods-above-export/` tree with a `manifest.json` per character.

---

## 2. Product Vision

NGA Forge is the **single source of truth for every No Gods Above character**: who they are
(lore bible), what they look like (reference gallery), their 3D model (any source), their
game-ready 2.5D renders and sprite sheets, their animation/frame-data plan, and a clean,
versioned export the game (and future trailers/series content) consumes.

Pipeline-first, generator-agnostic: the value is the consistent path
`character → references → model → cleanup → 2.5D render → export`, with the image-to-3D step
swappable. Premium/cinematic consistency comes from the pipeline (fixed camera, fixed floor
baseline, consistent lighting, toon/stylized material pass, per-character palette stored in
the bible), not from whichever generator made the mesh.

## 3. MVP Scope (the golden path, nothing more)

1. Create the **Lamuh** character profile (+ bible fields, all optional except name).
2. Upload Lamuh reference images, label them (main design / front / side / back / etc.).
3. Choose model source: **Placeholder** or **Import Existing Model** (GLB/GLTF/FBX/OBJ).
4. Preview the model in the Three.js viewer.
5. Run **Blender cleanup/normalize** (graceful, clearly-labeled fallback if Blender missing).
6. Render the **transparent 2.5D preview** (448x448, 3/4 camera, floor baseline) + front/side/back/portrait renders.
7. **Export** to the No Gods Above export folder with `manifest.json` + lore files.

Explicitly NOT in MVP: real AI generation, sprite-sheet assembly from animation, rigging,
Mixamo/mocap import, hitbox editing UI, runtime integration with `NO_GODS_ABOVE/game.js`.
The data model reserves space for all of these (see §7, §9) so nothing needs migration later.

## 4. Folder Structure

```text
tools/nga-forge/
  REDESIGN.md                      this document
  README.md                        updated usage doc
  backend/
    requirements.txt               fastapi, uvicorn, pydantic, pillow (no AI deps)
    app/
      main.py                      app factory, CORS, router mounting
      core/
        config.py                  settings: ports, blender path, export root
        paths.py                   data-dir layout + path-safety helpers
        statuses.py                shared status enums (see §10)
      store/
        characters.py              JSON file store, one folder per character
        jobs.py                    JSON job store (evolved from current jobs.py)
      api/
        characters.py              CRUD + lore
        references.py              upload, label, list, delete
        model_sources.py           select source, import upload, generate
        pipeline.py                cleanup, render, export job triggers
        jobs.py                    job status/list
        files.py                   safe file serving for the frontend
      sources/                     model source adapters (was generators/)
        base.py                    ModelSource interface + SourceResult
        placeholder.py             pure-Python mannequin GLB (kept)
        import_file.py             validates + stores user GLB/GLTF/FBX/OBJ
        external_api.py            stub: Meshy/Tripo/Rodin adapter slot, reports unavailable
        local_ai.py                stub: TripoSR/SF3D/Hunyuan3D slot, reports unavailable
        custom_nga.py              stub: future NGA-specific generator
        registry.py                source discovery + availability reporting
      pipeline/
        blender_runner.py          subprocess wrapper (kept, extended)
        render_presets.py          data-driven presets (see §11)
        exporter.py                builds no-gods-above-export tree + manifest
    blender/
      process_model.py             import/center/feet-origin/normalize/toon/export (kept, moved)
      render_character.py          preset-driven renders: 2.5D, turntable, portrait, splash
    data/                          gitignored runtime data
      project/
        project.json               project-level settings + character index
        characters/{slug}/         see layout below
      jobs/                        job JSON records
      tmp/                         upload staging
  frontend/
    src/
      api/client.js                fetch wrapper + endpoints
      state/                       lightweight store (React context or zustand)
      pages/
        Dashboard.jsx              roster grid + create character
        CharacterWorkspace.jsx     stepper shell, routes step components
        Settings.jsx               blender path, export root, health checks
      steps/
        Step1Profile.jsx           identity + lore bible
        Step2References.jsx        labeled gallery
        Step3ModelSource.jsx       source mode cards + import/generate
        Step4Cleanup.jsx           blender normalize controls + before/after
        Step5Preview.jsx           Three.js viewer
        Step6Render25D.jsx         preset picker + render results grid
        Step7AnimationPrep.jsx     animation slot table (planning UI only in MVP)
        Step8Export.jsx            export target + manifest preview + run
      components/                  StatusBadge, JobTray, ModelViewer, RefCard, ...
```

Per-character data layout (`backend/data/project/characters/{slug}/`):

```text
character.json        full character record (§7)
lore.md               human-readable lore doc, regenerated from character.json lore fields
references/
  refs.json           reference index (id, label, notes, original filename)
  {refId}.png|jpg     stored images
model/
  source/             raw imported or generated model + textures
  clean/              Blender-processed GLB
renders/
  preview_25d.png     transparent 448x448 3/4 preview
  turntable_{front|side|back|three_quarter}.png
  portrait_select.png
  splash.png
spritesheets/         reserved (post-MVP)
animations/
  animations.json     animation slot records (§7), clips reserved for post-MVP
exports/              copies of past export manifests for history
```

## 5. Data Flow

```text
[Dashboard] create character ──> store/characters writes character.json
     │
[Step 1 Profile/Bible] PATCH /characters/{slug} ──> character.json + lore.md
     │
[Step 2 References] POST /characters/{slug}/references (multipart + label)
     │                       └─> references/{refId}.png + refs.json
     │
[Step 3 Model Source] choose mode:
     placeholder ─> job: sources/placeholder ─> model/source/{slug}_model.glb
     import      ─> upload ─> sources/import_file validates ─> model/source/...
     external/local AI ─> disabled cards, "Future Adapter" badge
     │
[Step 4 Cleanup] POST /characters/{slug}/pipeline/cleanup
     └─> job: blender_runner ─> blender/process_model.py
         ─> model/clean/{slug}_model.glb (+ explicit warning path if no Blender)
     │
[Step 5 Preview] GET file-serving endpoint ─> Three.js viewer (clean model if present, else source)
     │
[Step 6 2.5D Render] POST /characters/{slug}/pipeline/render?preset=...
     └─> job: blender/render_character.py ─> renders/*.png
     │
[Step 8 Export] POST /characters/{slug}/pipeline/export
     └─> exporter copies model/clean + renders + spritesheets + animations.json + lore
         ─> {export_root}/no-gods-above-export/characters/{slug}/... + manifest.json
```

Every long-running step is a **job**: created via API, executed in a worker thread, polled by
the frontend, recorded under `data/jobs/`, and stamped into the character's `pipeline` status
block on completion/failure.

## 6. UI Layout

**Global shell:** left sidebar (NGA Forge logo, Dashboard, character roster list with mini
status dots, Settings), persistent bottom **Job Tray** showing running/recent jobs.

**Dashboard:** grid of character cards — concept thumbnail (main-design reference), name,
title, faction color strip, and badge row: Model / Renders / Animations / Export, each with a
status badge (§10). "Create New Character" card opens name + title + faction form, creates
the record, and lands in Step 1. Seed roster: Lamuh, Celeste, Sol, Seris, Nyx, Kairo,
Vanta Reign (created as profile-only records, status "Needs Reference").

**Character Workspace:** header (name, title, palette chips, overall status) + horizontal
8-step stepper. Each step shows a completion badge. Steps never block navigation — you can
jump anywhere — but each step shows what is missing ("No clean model yet — run Step 4").

Step content:
1. **Profile** — identity fields + the full lore bible (§7 fields), autosaving form, palette
   editor (hex chips), "regenerate lore.md" happens automatically on save.
2. **References** — drag-drop upload, card gallery grouped by label, label picker
   (main design / front / side / back / expression / outfit / weapon / trailer style /
   lore-world), lightbox view, set-as-main toggle.
3. **Model Source** — five mode cards. Placeholder ("always available"), Import (drop a
   GLB/GLTF/FBX/OBJ), External AI API (Future Adapter badge), Local AI (Future Adapter badge,
   lists TripoSR/SF3D/Hunyuan3D as planned engines), Custom NGA (Future Adapter badge).
4. **Cleanup / Normalize** — target height, toon material toggle, run button, Blender
   availability indicator, warnings surfaced loudly, before/after file info.
5. **Preview** — Three.js viewer with grid floor, light rig, wireframe toggle,
   source-vs-clean model switch.
6. **2.5D Render** — preset checklist (§11) with thumbnails of last results, "Render selected"
   button, results grid with download.
7. **Animation Prep** — table of the standard fighting-game animation slots (§7) with status,
   intended source (Mixamo / mocap / video-to-anim / Cascadeur / Blender / custom), and frame
   data fields (startup/active/recovery, root motion, sprite range). Planning UI only in MVP —
   no clip playback.
8. **Export** — export root display, manifest preview (live JSON), included-files checklist,
   "Export to No Gods Above" button, history of past exports.

## 7. Character Data Model (`character.json`)

```json
{
  "schemaVersion": 1,
  "id": "lamuh",
  "name": "Lamuh",
  "title": "The Hand That Buried Heaven",
  "faction": "",
  "role": "protagonist",
  "lore": {
    "powerSource": "",
    "personality": "",
    "fightingStyle": "",
    "visualMotifs": "",
    "colorPalette": ["#0e1116", "#f5f0e6", "#d9a441", "#2ce4f0"],
    "loreSummary": "",
    "storyArcNotes": "",
    "trailerHook": "",
    "seriesNotes": ""
  },
  "references": [
    { "id": "ref_ab12", "file": "references/ref_ab12.png", "label": "main_design",
      "originalName": "lamuh_sheet.png", "notes": "", "addedAt": "2026-06-12T00:00:00Z" }
  ],
  "model": {
    "sourceMode": "placeholder | import | external_api | local_ai | custom_nga | null",
    "sourceFile": "model/source/lamuh_model.glb",
    "sourceFormat": "glb",
    "cleanFile": "model/clean/lamuh_model.glb",
    "targetHeight": 2.05,
    "toonMaterial": true,
    "lastCleanupJobId": null,
    "warnings": []
  },
  "renders": {
    "preview25d": "renders/preview_25d.png",
    "turntableFront": null, "turntableSide": null, "turntableBack": null,
    "turntableThreeQuarter": null,
    "portraitSelect": null, "splash": null,
    "lastRenderJobId": null
  },
  "animations": [
    { "name": "idle", "category": "movement", "status": "planned",
      "source": "unassigned", "clipFile": null,
      "frameData": { "startup": null, "active": null, "recovery": null },
      "hitboxEvents": [], "rootMotion": false,
      "spriteExportRange": { "start": null, "end": null }, "notes": "" }
  ],
  "pipeline": {
    "profile":   { "status": "ready",            "updatedAt": "..." },
    "references":{ "status": "needs_reference",  "updatedAt": "..." },
    "model":     { "status": "placeholder",      "updatedAt": "..." },
    "cleanup":   { "status": "not_started",      "updatedAt": "..." },
    "render25d": { "status": "not_started",      "updatedAt": "..." },
    "animation": { "status": "not_started",      "updatedAt": "..." },
    "export":    { "status": "not_started",      "updatedAt": "..." }
  },
  "createdAt": "2026-06-12T00:00:00Z",
  "updatedAt": "2026-06-12T00:00:00Z"
}
```

Default animation slots created with every character (all `"planned"`): idle, walk, run,
jump, fall, land, light_attack, medium_attack, heavy_attack, special_1, special_2, hitstun,
knockdown, ultimate_pose, trailer_pose_1. Categories: movement / attack / special / reaction /
cinematic. `source` values: unassigned / mixamo / ai_mocap / video_to_animation /
cascadeur / blender / custom.

## 8. Job Data Model (`data/jobs/{jobId}.json`)

```json
{
  "id": "job_9f3c...",
  "type": "generate_model | import_model | cleanup_model | render_character | export_character",
  "characterId": "lamuh",
  "status": "queued | running | completed | failed | cancelled",
  "progress": 0,
  "stage": "human-readable current stage",
  "params": { "preset": "sprite_frame_448", "sourceMode": "placeholder" },
  "outputs": { "files": ["model/clean/lamuh_model.glb"] },
  "warnings": [],
  "error": null,
  "createdAt": "...", "startedAt": "...", "finishedAt": "..."
}
```

Execution stays thread-based (single local user). The job store keeps the last N jobs and the
frontend Job Tray polls `/jobs?active=true` plus the specific job it started.

## 9. Export Manifest (`manifest.json`)

Output tree:

```text
{export_root}/no-gods-above-export/
  characters/
    lamuh/
      model/lamuh_model.glb
      renders/preview_25d.png, turntable_*.png, portrait_select.png, splash.png
      spritesheets/            (empty until sprite pipeline lands)
      animations/animations.json
      lore/lamuh_lore.md, lamuh_lore.json
      manifest.json
```

```json
{
  "schemaVersion": 1,
  "forgeVersion": "0.2.0",
  "exportedAt": "2026-06-12T00:00:00Z",
  "character": {
    "id": "lamuh", "name": "Lamuh", "title": "...", "faction": "...",
    "colorPalette": ["#..."]
  },
  "model": {
    "file": "model/lamuh_model.glb", "format": "glb",
    "targetHeight": 2.05, "originAtFeet": true,
    "processedBy": "blender | unprocessed_passthrough",
    "warnings": []
  },
  "renders": {
    "preview25d": { "file": "renders/preview_25d.png", "frameSize": 448,
                    "camera": "front_three_quarter", "transparent": true },
    "portraitSelect": { "file": "renders/portrait_select.png", "size": [460, 520] }
  },
  "spritesheets": [],
  "animations": { "file": "animations/animations.json", "clipCount": 0 },
  "lore": { "markdown": "lore/lamuh_lore.md", "json": "lore/lamuh_lore.json" },
  "sourceJobIds": ["job_..."],
  "placeholder": false
}
```

`placeholder: true` whenever the exported model came from the placeholder source or an
unprocessed passthrough — the game side must be able to trust this flag.

## 10. Status Vocabulary (one enum, used everywhere)

`not_started` · `needs_reference` · `placeholder` · `ready` · `processing` · `exported` ·
`failed` · `future_adapter`

Badge colors: grey / amber / purple / green / blue(animated) / teal / red / dark-grey.
Frontend has exactly one `StatusBadge` component; no ad-hoc status strings.

## 11. Render Presets (data, not code)

Defined in `pipeline/render_presets.py`, executed by `blender/render_character.py`:

| Preset id            | Output                  | Spec |
|----------------------|-------------------------|------|
| `sprite_frame_448`   | preview_25d.png         | 448x448, transparent, fixed 3/4 camera, fixed floor baseline, fixed 3-point light rig |
| `turntable_refs`     | turntable_{front,side,back,three_quarter}.png | 1024px, transparent |
| `portrait_select`    | portrait_select.png     | 460x520 RGBA, bust/three-quarter crop framing (matches existing NGA select portraits) |
| `splash_trailer`     | splash.png              | 1920x1080, gradient or transparent, hero pose camera |

The camera, floor Z, and light rig values for `sprite_frame_448` are **constants shared by
every character** — that is what makes the 2.5D set consistent across the roster. Sprite-sheet
batch rendering (animation → N frames → atlas) reuses this exact preset later; that is why it
is data-driven now.

## 12. Implementation Phases

**Phase 0 — Re-architecture (no new features).** New folder layout, character/json store,
status enums, job store keyed to characters, file-serving endpoints with path-safety. Old
endpoints deleted (tool is internal; no compat needed). Seed the 7 roster characters.
Validation: `py_compile` everything, CRUD smoke via HTTP, frontend builds.

**Phase 1 — Dashboard + Profile/Bible (Steps 1).** Roster grid, create flow, autosaving
bible form, lore.md generation. Validation: create/edit/reload Lamuh, lore.md matches.

**Phase 2 — References (Step 2).** Multipart upload, labels, gallery, main-design thumbnail
feeding the dashboard card. Validation: upload 3 labeled refs, reload persists, dashboard
thumbnail updates.

**Phase 3 — Model Source + Preview (Steps 3 & 5).** Source mode cards, placeholder
generation job, GLB/GLTF/FBX/OBJ import with validation (magic bytes + size cap), Three.js
viewer per character, future-adapter stubs reporting `future_adapter`. Validation: placeholder
job renders in viewer; an imported GLB renders; FBX/OBJ accepted and stored.

**Phase 4 — Cleanup + 2.5D Renders (Steps 4 & 6).** Extend Blender scripts to preset-driven
rendering; cleanup job wiring; explicit no-Blender fallback path (copy + warning, status stays
`placeholder`); render presets UI. Validation: with Blender configured, clean GLB + all four
presets produce correct-size transparent PNGs; without Blender, warnings are loud and status
is honest.

**Phase 5 — Export (Step 8).** Exporter, manifest, export history, settings page for export
root + Blender path. Validation: export Lamuh, verify tree + manifest fields, re-export
overwrites cleanly. **End of MVP — run the full golden path with Lamuh.**

**Phase 6 — Animation Prep (Step 7).** Slot table UI over the animations array, frame-data
editing, no playback. Validation: edit/save/reload frame data; exported animations.json matches.

**Phase 7 — Real adapters (post-MVP, separate effort).** External API adapter first (Meshy or
Tripo: simplest integration, no GPU constraints), then local AI (must be checked against
AMD/DirectML or ONNX paths — no CUDA assumption), then sprite-sheet batch rendering from
animation clips, then the custom NGA generator.

## 13. Real Now vs Placeholder Later

| Capability | MVP reality |
|---|---|
| Character store, bible, lore.md | **Real** |
| Reference gallery with labels | **Real** |
| Placeholder mannequin GLB | **Real** (pure Python, kept) |
| Import GLB/GLTF/FBX/OBJ | **Real** |
| Blender cleanup + preset renders | **Real when Blender configured**; honest fallback otherwise |
| Export tree + manifest | **Real** |
| External AI API / Local AI / Custom NGA sources | Stub adapters, `future_adapter` badge, never selectable |
| Sprite sheets from animation | Reserved folders + manifest field only |
| Animation clips/playback/retargeting | Data model + planning UI only |
| Hitbox/frame-data timeline editor | Plain number fields only |
| Game runtime integration | Never automatic; export folder is the handoff boundary |
