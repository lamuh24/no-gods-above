# NO GODS ABOVE

Playable browser fighting-game prototype for a 2D dark-fantasy arena fighter.

Built with plain HTML, CSS, and JavaScript Canvas only. No Godot, Unity, Unreal, Phaser, external engines, or external game frameworks are used.

Current local dev server: `http://localhost:8010`.


## Access Across Devices

- Public URL for phones, tablets, laptops, and desktops: https://no-gods-above.netlify.app/
- The game is a static browser build, so no native install is required for normal playtesting.
- For same-network local testing before deployment, run `python -m http.server 8000 --bind 0.0.0.0` from `NO_GODS_ABOVE/`, then open `http://<host-lan-ip>:8000/index.html` on the other device.
- Do not share `127.0.0.1` or `localhost` links across devices; those only point back to the device that opens them.
- Online Versus still depends on PeerJS/WebRTC reachability, so restrictive school/work/mobile networks may block P2P connections even when the site itself loads.

## Game Flow

The public setup flow is sequential:

1. Mode selection: Local Versus or Training Dummy.
2. Character selection: choose the player fighter, or lock P1 then P2 for versus.
3. Arena selection: choose Platform Arena or Standard Arena, then start.

Online Versus enters after host/join setup and skips straight to character selection. The host chooses the arena and starts the online match.

## Character Direction

Kairo Final and Vanta Reign are stable legacy fighters. Keep them playable and do not spend production time converting them into the new-generation pipeline unless they break gameplay or are specifically requested.

Nyx is the first new-generation fighter standard. After Nyx is fully complete, build exactly one fresh new-generation fighter from the Nyx planning, sprite, atlas, character-select, and playtest pipeline: Seris, the Halo Chain. After Seris is playable and tested, shift focus to controller support.

See `docs/character_production_roadmap.md` for the current roadmap and new-character planning template.
See `docs/seris_preproduction.md` for the selected next new-generation fighter concept.

## Active Legacy Kairo

Visual identity:

- Male cyber ninja
- White/silver hair
- Black tactical armor
- Cyan energy forearm blades
- Compact readable fighting-game silhouette

Do not use older Kairo sheets, Veyra sheets, Seraphine sheets, chain-whip sheets, or chibi test sheets as the active player.

## Active Kairo Final Assets

- `assets/sprites/kairo_final/kairo_sheet_1_basic_movement.png`
- `assets/sprites/kairo_final/kairo_sheet_2_defense_recovery.png`
- `assets/sprites/kairo_final/kairo_sheet_3_core_attacks_a.png`
- `assets/sprites/kairo_final/kairo_sheet_4_core_attacks_b.png`
- `assets/sprites/kairo_final/kairo_sheet_5_low_air.png`
- `assets/sprites/kairo_final/kairo_sheet_6_specials_ultimate.png`
- `assets/sprites/kairo_final/kairo_sheet_7_end_states_extras.png`

## Active Vanta Final Assets

- `assets/sprites/vanta_final/vanta_sheet_1_basic_movement.png`
- `assets/sprites/vanta_final/vanta_sheet_2_defense_recovery.png`
- `assets/sprites/vanta_final/vanta_sheet_3_core_attacks_a.png`
- `assets/sprites/vanta_final/vanta_sheet_4_core_attacks_b.png`
- `assets/sprites/vanta_final/vanta_sheet_5_low_air.png`
- `assets/sprites/vanta_final/vanta_sheet_6_specials_ultimate.png`
- `assets/sprites/vanta_final/vanta_sheet_7_end_states_extras.png`

## Active Nyx Final Assets

- `assets/sprites/nyx_final/nyx_sheet_1_core_movement_atlas.png`
- `assets/sprites/nyx_final/nyx_sheet_2_air_movement_atlas.png`
- `assets/sprites/nyx_final/nyx_sheet_3_ground_normals_atlas.png`
- `assets/sprites/nyx_final/nyx_sheet_4_air_normals_atlas.png`
- `assets/sprites/nyx_final/nyx_sheet_5_specials_atlas.png`
- `assets/sprites/nyx_final/nyx_sheet_6_defense_hit_reactions_atlas.png`
- `assets/sprites/nyx_final/nyx_sheet_7_knockdown_recovery_flavor_atlas.png`

## Online Versus (Phase 1)

- Title screen has an Online Versus option: one player hosts and shares a 5-character room code, the other joins with it.
- Peer-to-peer over WebRTC via PeerJS (CDN script + free PeerJS cloud signaling); no game server.
- Host-authoritative netcode: the host simulates the match, the guest sends inputs, predicts locally, and is corrected by host snapshots ~15x/second.
- The guest plays P2 using the P1 keyboard layout (WASD + JKL + U specials + I+O ultimate).
- Both players pick their own fighter on the select screen; the host picks the stage and starts the match. Pause, rematch, and return-to-select stay in sync.
- Validated by `scripts/smoke_online_versus.js` (two headless Chrome instances over a real PeerJS connection; pass a URL argument to smoke the live deployment).
- Phase 2 (planned): fixed-timestep + seeded RNG refactor, then input-delay lockstep for tighter feel.

## Prototype Features

- Title screen, sequential mode/character/arena setup, Training Mode, Local Versus, and Online Versus.
- Kairo Final, Vanta Reign, Nyx, Sol Raze, Seris, LAMUH, LAMUH Legacy, and Celeste selectable player characters.
- Platform Arena as the primary stage, with Standard Arena as a fallback.
- Movement, jump, dash, crouch, hold-back block, light/medium/heavy attacks, directional attacks, jump attacks, three specials, and full-meter ultimate.
- Enemy health, player health, passively growing ultimate meter, hit detection, hitboxes/hurtboxes, hit pause, knockback, VFX particles, enemy death, `R` reset, `H` hitbox debug, and `N` rival AI toggle.

See `docs/game_flow_workflow.md` for the current UI/state workflow, multiplayer flow, breaking UI changes, and dependencies.

## Controls

| Key | Action |
|---|---|
| A / D | Move left / right |
| W | Jump |
| S | Crouch |
| Shift | Dash |
| Hold Back | Block / retreat |
| J / K / L | Light / medium / heavy |
| Forward + J/K/L | Forward attacks |
| Back + J/K/L | Back attacks |
| Down + J/K/L | Low attacks |
| Air + J/K/L | Jump attacks |
| U + J | Special 1, fast forward blade rush |
| U + K | Special 2, cyan projectile / burst shot |
| U + L | Special 3, spinning energy slash / area strike |
| I + O | Ultimate, requires full meter |
| R | Reset round |
| H | Toggle hitbox debug |
| N | Toggle rival AI |
| P | Pause |

## Sprite Handling

- Kairo Final runtime sheets are normalized to 6 columns x 5 rows with 320x320 cells.
- Vanta Final runtime sheets are clean 6 columns x 5 rows sheets. Each Vanta sheet is sliced from its own image size with `frameWidth = image.width / 6` and `frameHeight = image.height / 5`.
- Nyx Final runtime atlases use dedicated move-family sheets under `assets/sprites/nyx_final/`; see `assets/sprites/nyx_final/nyx_final_atlas_manifest.json`.
- The renderer uses cleaned per-frame source rectangles with a locked bottom-center row anchor.
- The original imported Kairo Final pack images are preserved in `assets/sprites/kairo_final_source/`.
- Feet stay aligned to one ground baseline while blade effects can extend visually from the stable fighter root.
- Pose shifts inside a sprite frame remain pose animation only and are not converted into arena travel.
- Dash and special travel happen in code, not through baked sprite displacement.
- Frames are cropped/padded as needed, with magenta/purple artifacts stripped at runtime.

## Implementation Notes

Combat is driven by frame-data timers and explicit hitboxes, not exact sprite pixels. This keeps the prototype playable even when AI-generated sheets have inconsistent spacing.
