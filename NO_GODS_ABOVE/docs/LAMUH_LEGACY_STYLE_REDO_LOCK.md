# LAMUH Redo — Legacy Style Lock

Decision date: 2026-07-02 (user decision, recorded by Claude Code).

## Decision

The current LAMUH redesign art (the `assets/characters/lamuh/*_redesign` /
`*_body_vfx` / `*_body_scale` atlases) is to be **redone in the LAMUH LEGACY
visual style**. The user prefers Lamuh Legacy's look. Lamuh is on the Steam
launch roster (Nyx, Lamuh, Sol, Seris), so this redo is launch-critical.

## Style Anchor (locked)

The style target is the existing **Lamuh Legacy** sheet set:

- `assets/sprites/lamuh_final/lamuh_sheet_1_core_movement_atlas.png`
- `assets/sprites/lamuh_final/lamuh_sheet_2_air_movement_atlas.png`
- `assets/sprites/lamuh_final/lamuh_sheet_3_ground_normals_atlas.png`
- `assets/sprites/lamuh_final/lamuh_sheet_4_air_normals_atlas.png`
- `assets/sprites/lamuh_final/lamuh_sheet_5_specials_atlas.png`
- `assets/sprites/lamuh_final/lamuh_sheet_6_defense_hit_reactions_atlas.png`
- `assets/sprites/lamuh_final/lamuh_sheet_7_knockdown_recovery_flavor_atlas.png`
- `assets/sprites/lamuh_final/lamuh_sheet_8_crown_of_no_gods_body_atlas.png`

Match its identity, proportions, palette, outline weight, and rendering style
exactly. Do not carry over the redesign sheets' look.

## Production Requirements (per current pipeline standards)

1. **One locked identity/style anchor first, then the full pack in one pass** —
   per the settled 2026-06-29 workflow decision. No clip-by-clip style drift.
2. **448x448 cells, baseline 382, right-facing, real alpha** — the runtime
   atlas contract. Normalize before integration per
   `docs/CHARACTER_SPRITE_PIPELINE.md`.
3. **Animation quality bar (Dragon Ball motion, AI-generated):**
   - Every attack clip needs a clear **anticipation pose**, an **extreme/impact
     pose**, and **follow-through** — not evenly-spaced in-betweens.
   - Include at least one **smear frame** in every swing (stretched,
     exaggerated in-between on the fastest arc). This is the single biggest
     anime-motion multiplier at low frame counts.
   - Signature specials get **12–16 frames**; basics may stay at 6–8.
   - Stable silhouette and grounded feet across frames; no VFX-over-body
     smearing (VFX belongs in separate effect sheets or the engine layer).
4. **Phase metadata:** declare each attack clip's frame split so the runtime
   locks impact frames to the active window. Either populate `hitFrames` in
   the clip manifest or supply startup/active/recovery counts; the engine
   consumes `flags.phaseFrames = { startup, active, recovery }` (must sum to
   the clip frame count).
5. Preserve the existing Lamuh moveset, frame data, and runtime wiring —
   this is an art redo, not a gameplay change. The engine's Lamuh frame
   overrides can be retired only after the new sheets prove out in smokes.

## Scope Guardrails

- Preview/candidate stages first; no live roster overwrite until validated
  (smoke passes + user approval), same isolation pattern as the Sable
  animator-rebuild-v2.
- Keep the current redesign atlases in place as fallback/history until the
  legacy-style replacement fully covers runtime usage.
