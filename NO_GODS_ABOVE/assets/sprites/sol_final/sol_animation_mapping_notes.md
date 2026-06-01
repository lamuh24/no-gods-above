# Sol Raze Animation Mapping Notes

Sol Raze, the Iron Sun, uses fixed 448x448 transparent frame slots prepared from 384x384 chroma source cells.
This is import prep only: Sol is not wired into runtime by this file.

## Runtime Sheet Keys

### sheet_1_core_movement

- Atlas: `assets/sprites/sol_final/sol_sheet_1_core_movement_atlas.png`
- Grid: 8 columns x 6 rows
- Cell size: 448x448 prepared from 384x384 source cells

- Row 1: `idle` (Idle), 8 source frames, 8 atlas slots, ground pivot `lockedFrameBottomCenter`
- Row 2: `walk_forward` (Walk Forward), 6 source frames, 8 atlas slots, ground pivot `lockedFrameBottomCenter`
- Row 3: `walk_back` (Walk Back), 6 source frames, 8 atlas slots, ground pivot `lockedFrameBottomCenter`
- Row 4: `dash_forward` (Dash Forward), 6 source frames, 8 atlas slots, ground pivot `lockedFrameBottomCenter`
- Row 5: `dash_back` (Dash Back), 6 source frames, 8 atlas slots, ground pivot `lockedFrameBottomCenter`
- Row 6: `crouch` (Crouch / Low Stance), 4 source frames, 8 atlas slots, ground pivot `lockedFrameBottomCenter` aliases: low_stance

### sheet_2_air_movement

- Atlas: `assets/sprites/sol_final/sol_sheet_2_air_movement_atlas.png`
- Grid: 6 columns x 6 rows
- Cell size: 448x448 prepared from 384x384 source cells

- Row 1: `jump_up` (Jump Up / Rising), 4 source frames, 6 atlas slots, air pivot `lockedFrameCenter` aliases: rising
- Row 2: `jump_forward` (Jump Forward), 4 source frames, 6 atlas slots, air pivot `lockedFrameCenter`
- Row 3: `jump_back` (Jump Back), 4 source frames, 6 atlas slots, air pivot `lockedFrameCenter`
- Row 4: `fall` (Fall / Neutral Air Drift), 4 source frames, 6 atlas slots, air pivot `lockedFrameCenter` aliases: neutral_air_drift
- Row 5: `air_dash_forward` (Air Dash Forward), 6 source frames, 6 atlas slots, air pivot `lockedFrameCenter`
- Row 6: `air_dash_back` (Air Dash Back), 6 source frames, 6 atlas slots, air pivot `lockedFrameCenter`

### sheet_3_ground_normals

- Atlas: `assets/sprites/sol_final/sol_sheet_3_ground_normals_atlas.png`
- Grid: 7 columns x 4 rows
- Cell size: 448x448 prepared from 384x384 source cells

- Row 1: `light_attack` (Light Attack / Sun Jab), 4 source frames, 7 atlas slots, ground pivot `lockedFrameBottomCenter` aliases: sun_jab
- Row 2: `medium_attack` (Medium Attack / Iron Palm), 6 source frames, 7 atlas slots, ground pivot `lockedFrameBottomCenter` aliases: iron_palm
- Row 3: `heavy_attack` (Heavy Attack / Furnace Hook), 7 source frames, 7 atlas slots, ground pivot `lockedFrameBottomCenter` aliases: furnace_hook
- Row 4: `launcher` (Launcher / Dawn Upper), 7 source frames, 7 atlas slots, ground pivot `lockedFrameBottomCenter` aliases: dawn_upper

### sheet_4_air_normals

- Atlas: `assets/sprites/sol_final/sol_sheet_4_air_normals_atlas.png`
- Grid: 7 columns x 4 rows
- Cell size: 448x448 prepared from 384x384 source cells

- Row 1: `air_light` (Air Light / Falling Tap), 4 source frames, 7 atlas slots, air pivot `lockedFrameCenter` aliases: falling_tap
- Row 2: `air_medium` (Air Medium / Comet Knee), 6 source frames, 7 atlas slots, air pivot `lockedFrameCenter` aliases: comet_knee
- Row 3: `air_heavy` (Air Heavy / Sunfall Axe), 7 source frames, 7 atlas slots, air pivot `lockedFrameCenter` aliases: sunfall_axe
- Row 4: `air_recovery` (Air Recovery / Fall Transition), 4 source frames, 7 atlas slots, air pivot `lockedFrameCenter` aliases: fall_transition

### sheet_5_specials

- Atlas: `assets/sprites/sol_final/sol_sheet_5_specials_atlas.png`
- Grid: 8 columns x 5 rows
- Cell size: 448x448 prepared from 384x384 source cells

- Row 1: `solar_step` (Solar Step), 8 source frames, 8 atlas slots, ground pivot `lockedFrameBottomCenter`
- Row 2: `radiant_break` (Radiant Break), 8 source frames, 8 atlas slots, ground pivot `lockedFrameBottomCenter`
- Row 3: `rising_halo` (Rising Halo), 8 source frames, 8 atlas slots, ground pivot `lockedFrameBottomCenter`
- Row 4: `solar_verdict_startup` (Solar Verdict Startup), 6 source frames, 8 atlas slots, ground pivot `lockedFrameBottomCenter`
- Row 5: `solar_verdict_finish` (Solar Verdict Finish), 8 source frames, 8 atlas slots, ground pivot `lockedFrameBottomCenter`

### sheet_6_defense_hit_reactions

- Atlas: `assets/sprites/sol_final/sol_sheet_6_defense_hit_reactions_atlas.png`
- Grid: 6 columns x 8 rows
- Cell size: 448x448 prepared from 384x384 source cells

- Row 1: `stand_block` (Stand Block), 4 source frames, 6 atlas slots, ground pivot `lockedFrameBottomCenter`
- Row 2: `crouch_block` (Crouch Block), 4 source frames, 6 atlas slots, ground pivot `lockedFrameBottomCenter`
- Row 3: `air_block` (Air Block), 4 source frames, 6 atlas slots, air pivot `lockedFrameCenter`
- Row 4: `light_hitstun` (Light Hitstun), 3 source frames, 6 atlas slots, ground pivot `lockedFrameBottomCenter`
- Row 5: `medium_hitstun` (Medium Hitstun), 4 source frames, 6 atlas slots, ground pivot `lockedFrameBottomCenter`
- Row 6: `heavy_hitstun` (Heavy Hitstun), 6 source frames, 6 atlas slots, ground pivot `lockedFrameBottomCenter`
- Row 7: `launch_hitstun` (Launch Hitstun), 5 source frames, 6 atlas slots, air pivot `lockedFrameCenter`
- Row 8: `air_hitstun` (Air Hitstun), 5 source frames, 6 atlas slots, air pivot `lockedFrameCenter`

### sheet_7_knockdown_recovery_flavor

- Atlas: `assets/sprites/sol_final/sol_sheet_7_knockdown_recovery_flavor_atlas.png`
- Grid: 8 columns x 7 rows
- Cell size: 448x448 prepared from 384x384 source cells

- Row 1: `knockdown_fall` (Knockdown Fall), 6 source frames, 8 atlas slots, air pivot `lockedFrameCenter`
- Row 2: `grounded` (Grounded / Downed), 3 source frames, 8 atlas slots, ground pivot `lockedFrameBottomCenter` aliases: downed
- Row 3: `recovery_get_up` (Recovery / Get Up), 6 source frames, 8 atlas slots, ground pivot `lockedFrameBottomCenter` aliases: get_up
- Row 4: `ko_defeat` (KO / Defeat), 8 source frames, 8 atlas slots, ground pivot `lockedFrameBottomCenter` aliases: defeat
- Row 5: `intro_pose` (Intro Pose), 8 source frames, 8 atlas slots, ground pivot `lockedFrameBottomCenter`
- Row 6: `victory_pose` (Victory Pose), 8 source frames, 8 atlas slots, ground pivot `lockedFrameBottomCenter`
- Row 7: `taunt` (Taunt), 8 source frames, 8 atlas slots, ground pivot `lockedFrameBottomCenter`

## Import Cautions

- Keep Sol disabled until runtime config and character select are intentionally added later.
- Use row-specific frame counts from `sol_final_atlas_manifest.json`; do not animate held padding cells as unique poses.
- Grounded rows use bottom-center style alignment with baselineY 382 inside each 448px prepared cell.
- Airborne rows use centered alignment in fixed cells.
- Do not add chain, whip, tether, detached weapon, or Nyx-style shadow VFX behavior to Sol.