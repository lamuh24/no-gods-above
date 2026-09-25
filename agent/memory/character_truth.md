# No Gods Above Character Truth

This is the source-grounded anti-hallucination roster file for agent work.

Top-level rule: This list is closed. No agent may add, rename, redesign, replace, or generate art for a character not listed here. Any unlisted character appearing in a prompt, PR, asset request, generated image, or marketing asset is an error.

Current public playable roster: Kairo Final, Vanta Reign, Nyx, Sol Raze, Seris, LAMUH, LAMUH Legacy, and Celeste. Sable exists in repo files but is gated/not-current-playable and must not be added to the public roster without an explicit approved task.

Note on paths: where a listed path includes a `?v=...` suffix, that suffix is a runtime cache-busting query string, not part of the file path on disk. Resolve the path up to the `?` when checking the file against the repo.

## Sources Checked

- `SESSION_CONTEXT.md`
- `AGENTS.md`
- `NO_GODS_ABOVE/index.html`
- `NO_GODS_ABOVE/game.js`
- `NO_GODS_ABOVE/assets/sprites/portraits/`
- `NO_GODS_ABOVE/KAIRO_FINAL_CHARACTER_LOCK.md`
- `NO_GODS_ABOVE/KAIRO_CHARACTER_LOCK.md`
- `NO_GODS_ABOVE/KAIRO_V2_CHARACTER_LOCK.md`
- `NO_GODS_ABOVE/KAIRO_NULL_CHARACTER_PATCH/KAIRO_CHARACTER_LOCK.md`
- `NO_GODS_ABOVE/KAIRO_V2_CHARACTER_PATCH/KAIRO_V2_CHARACTER_LOCK.md`
- `NO_GODS_ABOVE/VANTA_FINAL_CHARACTER_LOCK.md`
- `NO_GODS_ABOVE/VANTA_CHARACTER_LOCK.md`
- `NO_GODS_ABOVE/docs/lamuh_character_lock.md`
- `NO_GODS_ABOVE/docs/SABLE_CHARACTER_LOCK.md`

## Public Playable Characters

### Kairo Final

- Canonical name: KAIRO FINAL
- Accepted aliases/runtime IDs: `kairo`, Kairo, Kairo Final; historical lock names include Kairo Null and Kairo V2, but current runtime ID is `kairo`.
- Status: current public playable.
- Archetype/title: Cyber Blade Striker.
- Gameplay role: fast sword pressure, footsies, fast pokes, and clean confirms.
- Current portrait path: `NO_GODS_ABOVE/assets/sprites/portraits/kairo_select.png`
- Current runtime sprite paths:
  - `NO_GODS_ABOVE/assets/sprites/kairo_final/kairo_sheet_1_basic_movement.png`
  - `NO_GODS_ABOVE/assets/sprites/kairo_final/kairo_sheet_2_defense_recovery.png`
  - `NO_GODS_ABOVE/assets/sprites/kairo_final/kairo_sheet_3_core_attacks_a.png`
  - `NO_GODS_ABOVE/assets/sprites/kairo_final/kairo_sheet_4_core_attacks_b.png`
  - `NO_GODS_ABOVE/assets/sprites/kairo_final/kairo_sheet_5_low_air.png`
  - `NO_GODS_ABOVE/assets/sprites/kairo_final/kairo_sheet_6_specials_ultimate.png`
  - `NO_GODS_ABOVE/assets/sprites/kairo_final/kairo_sheet_7_end_states_extras.png`
- Visual lock: male cyber ninja; white/silver spiky hair; black tactical armor; black face mask or masked lower face; cyan glowing accents and cyan forearm energy blades; compact readable fighting-game silhouette.
- Signature colors/motifs: black armor, white/silver hair, cyan energy blades.
- NOT rules: no chains, no whip weapons, no cape-heavy silhouette, no old Veyra/Seraphine/chibi/chain-whip sheets, no letters/labels/headers/UI baked into sprite sheets.
- Runtime notes: clean sheets only; 6 columns x 5 rows; uniform slicing; bottom-center anchoring; feet aligned to shared baseline; movement travel stays code-driven.

### Vanta Reign

- Canonical name: VANTA REIGN
- Accepted aliases/runtime IDs: `vanta`, Vanta, Vanta Reign.
- Status: current public playable.
- Archetype/title: Crimson Rival.
- Gameplay role: midrange bully with committed strikes, reach, heavy whiff punishes, and solid defense.
- Current portrait path: `NO_GODS_ABOVE/assets/sprites/portraits/vanta_select.png`
- Current runtime sprite paths:
  - `NO_GODS_ABOVE/assets/sprites/vanta_final/vanta_sheet_1_basic_movement.png?v=vanta-row-fix-1`
  - `NO_GODS_ABOVE/assets/sprites/vanta_final/vanta_sheet_2_defense_recovery.png`
  - `NO_GODS_ABOVE/assets/sprites/vanta_final/vanta_sheet_3_core_attacks_a.png`
  - `NO_GODS_ABOVE/assets/sprites/vanta_final/vanta_sheet_4_core_attacks_b.png`
  - `NO_GODS_ABOVE/assets/sprites/vanta_final/vanta_sheet_5_low_air.png`
  - `NO_GODS_ABOVE/assets/sprites/vanta_final/vanta_sheet_6_specials_ultimate.png?v=vanta-row-fix-1`
  - `NO_GODS_ABOVE/assets/sprites/vanta_final/vanta_sheet_7_end_states_extras.png`
- Visual lock: male dark cyber samurai/cyber ninja; black armor; crimson/dark red energy forearm blades; red visor; compact readable fighting-game silhouette; slightly heavier and more aggressive than Kairo.
- Signature colors/motifs: black armor, crimson/dark red energy, red visor.
- NOT rules: no chains, no whip weapons, no cape, no long cloth trails, no old Hollow Saint style.
- Runtime notes: clean sheets only; 6 columns x 5 rows; uniform slicing; bottom-center anchoring; grounded feet aligned to shared baseline; travel handled in code.

### Nyx

- Canonical name: NYX
- Accepted aliases/runtime IDs: `nyx`, Nyx.
- Status: current public playable.
- Archetype/title: Aerial Rushdown.
- Gameplay role: air routes, speed, mixups, slippery angles, and odd-angle pressure.
- Current portrait path: `NO_GODS_ABOVE/assets/sprites/portraits/nyx_select.png`
- Current runtime sprite/effect paths:
  - `NO_GODS_ABOVE/assets/sprites/nyx_final/nyx_sheet_1_core_movement_atlas.png`
  - `NO_GODS_ABOVE/assets/sprites/nyx_final/nyx_sheet_2_air_movement_atlas.png`
  - `NO_GODS_ABOVE/assets/sprites/nyx_final/nyx_sheet_3_ground_normals_atlas.png`
  - `NO_GODS_ABOVE/assets/sprites/nyx_final/nyx_sheet_4_air_normals_atlas.png`
  - `NO_GODS_ABOVE/assets/sprites/nyx_final/nyx_sheet_5_specials_atlas.png`
  - `NO_GODS_ABOVE/assets/sprites/nyx_final/nyx_sheet_6_defense_hit_reactions_atlas.png`
  - `NO_GODS_ABOVE/assets/sprites/nyx_final/nyx_sheet_7_knockdown_recovery_flavor_atlas.png`
  - `NO_GODS_ABOVE/assets/effects/nyx/nyx_phantom_slash_wave_anim.png`
- Visual lock: use the active `nyx_final` runtime atlases and dedicated slash-wave effect.
- Signature colors/motifs: violet/purple energy, phantom slash wave, aerial pressure.
- NOT rules: do not restore removed procedural Nyx stroke lines unless explicitly requested; do not run ultimate slash-wave VFX through projectile sizing or tiny-frame extraction.
- Runtime notes: final atlas metadata varies by sheet; source art is runtime-ready atlas art, not prompt-only concept art.

### Sol Raze

- Canonical name: SOL RAZE
- Accepted aliases/runtime IDs: `sol`, Sol, Sol Raze.
- Status: current public playable.
- Archetype/title: Iron Sun.
- Gameplay role: armor-flavored pressure, radiant reach, durable offense, and meter threat.
- Current portrait path: `NO_GODS_ABOVE/assets/sprites/portraits/sol_select.png`
- Current runtime sprite paths:
  - `NO_GODS_ABOVE/assets/sprites/sol_final/sol_sheet_1_core_movement_atlas.png?v=sol-runtime-1`
  - `NO_GODS_ABOVE/assets/sprites/sol_final/sol_sheet_2_air_movement_atlas.png?v=sol-runtime-1`
  - `NO_GODS_ABOVE/assets/sprites/sol_final/sol_sheet_3_ground_normals_atlas.png?v=sol-runtime-1`
  - `NO_GODS_ABOVE/assets/sprites/sol_final/sol_sheet_4_air_normals_atlas.png?v=sol-runtime-1`
  - `NO_GODS_ABOVE/assets/sprites/sol_final/sol_sheet_5_specials_atlas.png?v=sol-runtime-1`
  - `NO_GODS_ABOVE/assets/sprites/sol_final/sol_sheet_6_defense_hit_reactions_atlas.png?v=sol-runtime-1`
  - `NO_GODS_ABOVE/assets/sprites/sol_final/sol_sheet_7_knockdown_recovery_flavor_atlas.png?v=sol-runtime-1`
  - `NO_GODS_ABOVE/assets/sprites/sol_final/sol_sheet_8_directional_normals_atlas.png?v=sol-directional-normals-1`
- Visual lock: use the active `sol_final` profile, portrait, and sheet metadata.
- Signature colors/motifs: iron sun, radiant gold/yellow solar pressure.
- NOT rules: no Seris-style chains, whips, tethers, long detached overlays, projectile weapon bodies, or duplicated VFX fragments.
- Runtime notes: prepared cells use 448px, `baselineY: 382`, fixed source cells, and row-specific frame counts.

### Seris

- Canonical name: SERIS
- Accepted aliases/runtime IDs: `seris`, Seris.
- Status: current public playable.
- Archetype/title: Halo Chain.
- Gameplay role: mid-range chain control, traps, delayed threat, lane control, and special pressure.
- Current portrait path: `NO_GODS_ABOVE/assets/sprites/portraits/seris_select.png?v=seris-revamp-final-1`
- Current runtime sprite paths:
  - `NO_GODS_ABOVE/assets/sprites/seris_revamp_final/seris_revamp_final_sheet_1_core_movement_atlas.png?v=seris-revamp-final-1`
  - `NO_GODS_ABOVE/assets/sprites/seris_revamp_final/seris_revamp_final_sheet_2_air_movement_atlas.png?v=seris-revamp-final-1`
  - `NO_GODS_ABOVE/assets/sprites/seris_revamp_final/seris_revamp_final_sheet_3_ground_normals_atlas.png?v=seris-revamp-final-1`
  - `NO_GODS_ABOVE/assets/sprites/seris_revamp_final/seris_revamp_final_sheet_4_air_normals_atlas.png?v=seris-revamp-final-1`
  - `NO_GODS_ABOVE/assets/sprites/seris_revamp_final/seris_revamp_final_sheet_5_specials_body_atlas.png?v=seris-revamp-final-1`
  - `NO_GODS_ABOVE/assets/sprites/seris_revamp_final/seris_revamp_final_sheet_6_defense_hit_reactions_atlas.png?v=seris-revamp-final-1`
  - `NO_GODS_ABOVE/assets/sprites/seris_revamp_final/seris_revamp_final_sheet_7_knockdown_recovery_flavor_atlas.png?v=seris-revamp-final-1`
- Prepared but disabled VFX path: `NO_GODS_ABOVE/assets/effects/seris/seris_chain_whip_vfx_atlas.png?v=seris-visual-integrity-1`
- Visual lock: active Seris body atlas source is `seris_revamp_final`.
- Signature colors/motifs: halo chain, cyan/gold accents, delayed lane control.
- NOT rules: do not swap back to `seris_generated`, old `seris_final`, no-green-chain, or stale manifest sources; do not restore Sheet 8 detached chain VFX for regular gameplay; keep `SERIS_CHAIN_VFX_RUNTIME_ENABLED` false unless explicitly approved.
- Runtime notes: runtime drawing depends on fixed source cells and row-specific display frame counts.

### LAMUH

- Canonical name: LAMUH
- Accepted aliases/runtime IDs: `lamuh`, LAMUH.
- Status: current public playable.
- Archetype/title: Celestial Ki.
- Gameplay role: high-commitment divine pressure, burst damage, beams, and high-ceiling ki rush.
- Current portrait path: `NO_GODS_ABOVE/assets/sprites/portraits/lamuh_select.png`
- Current runtime sprite/effect paths:
  - `NO_GODS_ABOVE/assets/characters/lamuh/lamuh_sheet_1_core_movement_redesign_atlas.png?v=lamuh-sheet1-redesign-1`
  - `NO_GODS_ABOVE/assets/characters/lamuh/lamuh_sheet_forward_specials_redesign_atlas.png?v=lamuh-forward-specials-redesign-1`
  - `NO_GODS_ABOVE/assets/characters/lamuh/lamuh_sheet_3_down_up_specials_body_scale_atlas.png?v=lamuh-down-up-specials-body-scale-1`
  - `NO_GODS_ABOVE/assets/characters/lamuh/lamuh_sheet_4_back_neutral_specials_redesign_atlas.png?v=lamuh-back-neutral-specials-redesign-1`
  - `NO_GODS_ABOVE/assets/characters/lamuh/lamuh_sheet_neutral_specials_body_vfx_atlas.png?v=lamuh-neutral-specials-body-vfx-1`
  - `NO_GODS_ABOVE/assets/characters/lamuh/lamuh_sheet_reactions_defense_redesign_atlas.png?v=lamuh-reactions-defense-redesign-1`
  - `NO_GODS_ABOVE/assets/characters/lamuh/lamuh_sheet_air_crouch_jump_redesign_atlas_v2.png?v=lamuh-air-crouch-jump-redesign-1`
  - `NO_GODS_ABOVE/assets/characters/lamuh/lamuh_sheet_secondary_movement_directional_normals_atlas.png?v=lamuh-secondary-movement-directional-1`
  - `NO_GODS_ABOVE/assets/characters/lamuh/lamuh_sheet_super_ascended_golden_locs_atlas.png?v=lamuh-super-ascended-golden-locs-1`
  - `NO_GODS_ABOVE/assets/effects/lamuh/lamuh_crown_of_no_gods_beam_vfx_atlas.png?v=approved-chat-beam-1`
  - `NO_GODS_ABOVE/assets/effects/lamuh/lamuh_vfx_celestial_palm_projectile.png?v=lamuh-vfx-pack-01`
- Visual lock: Black male anime fighter; medium-length chunky locs; white knee-length captain-style haori/cloak; dark combat outfit; gold and cyan accents; sandals; athletic martial artist body language; no weapon silhouette.
- Signature colors/motifs: white haori, dark outfit, warm gold trim, cyan celestial ki, warm brown skin tones, natural dark hair.
- NOT rules: locs are hair only and must not become limbs, tentacles, whips, ropes, chains, grab tools, projectile bodies, or strikes; cloak must not become a strike effect, wing, tendril, rope, chain, or weapon; no text, labels, debug marks, duplicate ghosts, or neighboring-frame bleed.
- Runtime notes: current public movement, normals, directional specials, and balance are accepted; do not rewrite or retune core kit unless a specific later playtest issue is approved.

### LAMUH Legacy

- Canonical name: LAMUH LEGACY
- Accepted aliases/runtime IDs: `lamuh_legacy`, LAMUH Legacy, Legacy LAMUH.
- Status: current public playable legacy variant.
- Archetype/title: Classic Ki.
- Gameplay role: accessible legacy kit with stable, simple classic routes and familiar spacing.
- Current portrait path: `NO_GODS_ABOVE/assets/sprites/portraits/lamuh_legacy_select.png`
- Current runtime sprite/effect paths:
  - `NO_GODS_ABOVE/assets/sprites/lamuh_final/lamuh_sheet_1_core_movement_atlas.png?v=lamuh-public-1`
  - `NO_GODS_ABOVE/assets/sprites/lamuh_final/lamuh_sheet_2_air_movement_atlas.png?v=lamuh-public-1`
  - `NO_GODS_ABOVE/assets/sprites/lamuh_final/lamuh_sheet_3_ground_normals_atlas.png?v=lamuh-public-1`
  - `NO_GODS_ABOVE/assets/sprites/lamuh_final/lamuh_sheet_4_air_normals_atlas.png?v=lamuh-public-1`
  - `NO_GODS_ABOVE/assets/sprites/lamuh_final/lamuh_sheet_5_specials_atlas.png?v=lamuh-public-1`
  - `NO_GODS_ABOVE/assets/sprites/lamuh_final/lamuh_sheet_6_defense_hit_reactions_atlas.png?v=lamuh-public-1`
  - `NO_GODS_ABOVE/assets/sprites/lamuh_final/lamuh_sheet_7_knockdown_recovery_flavor_atlas.png?v=lamuh-public-1`
  - `NO_GODS_ABOVE/assets/sprites/lamuh_final/lamuh_sheet_8_crown_of_no_gods_body_atlas.png?v=lamuh-crown-body-1`
- Visual lock: legacy variant of LAMUH; preserve LAMUH identity and do not use it as a back door to redesign current LAMUH.
- Signature colors/motifs: classic celestial ki, gold/cyan beam energy.
- NOT rules: do not retune LAMUH Legacy core kit through documentation/process work; do not confuse legacy atlas paths with current redesigned LAMUH sheets.
- Runtime notes: `legacyCharacterOf: "lamuh"` and `specialRouting: "lamuh_legacy_simple"` in `game.js`.

### Celeste

- Canonical name: CELESTE
- Accepted aliases/runtime IDs: `celeste`, Celeste.
- Status: current public playable.
- Archetype/title: Seven Spirits.
- Gameplay role: trickster rushdown with spirit-inflected attacks, unusual angles, and creative routes.
- Current portrait path: `NO_GODS_ABOVE/assets/sprites/portraits/celeste_select.png`
- Current runtime sprite/VFX paths:
  - `NO_GODS_ABOVE/assets/sprites/celeste_final/celeste_sheet_1_body_basics_atlas.png?v=celeste-phase5-4-1`
  - `NO_GODS_ABOVE/assets/sprites/celeste_final/celeste_sheet_2_ground_normals_atlas.png?v=celeste-phase5-4-1`
  - `NO_GODS_ABOVE/assets/sprites/celeste_final/celeste_sheet_3_up_air_attacks_atlas.png?v=celeste-phase5-4-1`
  - `NO_GODS_ABOVE/assets/sprites/celeste_final/celeste_sheet_4_specials_atlas.png?v=celeste-phase5-4-1`
  - `NO_GODS_ABOVE/assets/sprites/celeste_final/celeste_sheet_5_defense_reactions_atlas.png?v=celeste-phase5-4-1`
  - `NO_GODS_ABOVE/assets/sprites/celeste_final/celeste_sheet_6_octava_body_atlas.png?v=celeste-phase5-4-1`
  - `NO_GODS_ABOVE/assets/sprites/celeste_final/celeste_sheet_7_detached_vfx_runtime_atlas.png?v=celeste-phase5-4-1`
- Visual lock: use active `celeste_final` production sheets and socket-based render layer.
- Signature colors/motifs: seven spirits, conductor language, spirit colors, trickster pressure.
- NOT rules: do not use largest-component-only cleanup on body sheets; do not widen fixed runtime cells to recover art; use sockets/layer-aware VFX rather than hardcoded offsets for future visual work.
- Runtime notes: detached VFX are valid only through the current Celeste VFX/sockets system.

## Gated / Not Current Playable

### Sable

- Canonical name: SABLE
- Accepted aliases/runtime IDs: `sable`, Sable.
- Status: repo-established, gated hidden test character; not in the current public select grid and not in `selectableCharacterIds`.
- Archetype/title: The Void Cartographer / Void Space Control.
- Gameplay role: void spacing, traps, evasive punishment, lower direct damage than LAMUH.
- Current portrait path: `NO_GODS_ABOVE/assets/sprites/portraits/sable_select.png`
- Current gated sprite paths:
  - `NO_GODS_ABOVE/assets/sprites/sable_placeholder/sable_mvp_placeholder_atlas.png?v=sable-mvp-1`
  - `NO_GODS_ABOVE/assets/sprites/sable_rebuild_v2/<clip>.png?v=sable-rb-v2-preview-pack-1` when `?sableTest` is enabled
  - `NO_GODS_ABOVE/assets/sprites/sable_mvp_runtime/<clip>.png?v=sable-mvp-strong-anim-1` when `?sableTest` is enabled
- Visual lock: Sable contrasts LAMUH; void/space-control fighter; current runtime art is temporary/placeholder.
- Signature colors/motifs: void, space control, anchors, traps, purple/violet energy.
- NOT rules: do not add Sable to the current public playable roster without explicit approval; do not treat placeholder art as final; do not replace placeholder assets directly with unvalidated generated art; do not generate final Sable art without exact repo references and review.
- Runtime notes: `SABLE_HIDDEN_TEST_ENABLED` is gated by `?sableTest`; current public select roster excludes `sable`.
