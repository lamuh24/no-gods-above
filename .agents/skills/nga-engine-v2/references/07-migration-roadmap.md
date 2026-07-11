# Migration Roadmap

Phase 0: audit and preserve the current runtime, assets, tools, and a runnable legacy branch/tag.

Phase 1: build a headless deterministic kernel with fixed-step loop, serializable state, input buffer, fighter states, collision/hit resolution, and replay/checksum tests.

Phase 2: add the Three.js adapter, simple stage, training dummy, Lamuh model candidate, animation adapter, HUD, and debug overlays.

Phase 3: Lamuh universal combat slice: movement, representative normals, block/hit/knockdown/recovery, forward throw/victim pair, launcher/air follow-up, one special family, and one ultimate with full restoration paths.

Phase 4: add Sable for a real matchup, projectiles/zoning, counters, unusual VFX, local versus, and training.

Phase 5: add Swahili to validate weapons, heavy/creature proportions, universal throws, command grabs, paired victim tracks, grab interruption/whiff, and cinematic grab cameras.

Phase 6: Nyx validates advanced air economy; Celeste validates summons/multi-entity state.

Phase 7: desktop/Steam shell, Steam Input, saves/achievements adapters, packaging, and desktop quality profile.

Phase 8: implement rollback only after deterministic replay and snapshot/restore pass.

Never mass-port legacy attacks before their target engine capability is approved. Preserve unsuitable legacy art as design/timing reference rather than wiring it into V2.
