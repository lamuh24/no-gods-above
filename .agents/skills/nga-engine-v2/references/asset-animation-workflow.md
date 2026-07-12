# Asset and Animation Workflow

## Source-to-runtime sequence

1. Capture source provenance: generated sheet, 3D import, artist pack, or tool export.
2. Normalize to the runtime contract: exact grid, exact cell size, transparent alpha, clean baseline, stable body scale, and intended aliases only.
3. Save preview/contact sheets and a validation report beside the runtime output.
4. Wire manifests and aliases only after normalization succeeds.
5. Run focused smoke coverage and keep old runtime assets as fallback until confidence is high.

## 3D / NGA Forge handoff

- Use 3D and Forge outputs as preparation artifacts, not direct game-runtime dependencies.
- Export manifests should describe placeholder status, dimensions, presets, source path, and warnings.
- Blender-dependent steps must have honest fallback status when Blender is unavailable.

## Animation rules

- Prefer coverage of missing/idle-only rows before micro-polishing working rows.
- Keep row-specific frame counts and fixed source-cell mappings when a character relies on them.
- Do not introduce detached VFX into body sheets unless the character manifest explicitly allows it.
