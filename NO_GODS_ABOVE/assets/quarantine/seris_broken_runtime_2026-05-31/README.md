# Seris Broken Runtime Quarantine - 2026-05-31

Seris runtime integration was disabled because the chain/whip implementation caused corrupted sprite fragments, duplicated body pieces, disconnected chain parts, and unstable runtime presentation.

The Seris concept is preserved for a future rebuild, but these runtime assets/config references should not be loaded by the game until a clean rebuild passes static atlas previews and gameplay smoke tests.

Runtime disabled in `game.js` with `SERIS_RUNTIME_ENABLED = false`; active roster is Kairo, Vanta, and Nyx only.

Preserved active broken/runtime-reference asset families for reference:
- `assets/sprites/seris_final/`
- `assets/sprites/seris_generated/`
- `assets/effects/seris/`
- `assets/sprites/portraits/seris_select.png`

These folders/files remain in place for now to avoid destructive churn, but they are quarantined by policy and no longer referenced by active runtime loading.
