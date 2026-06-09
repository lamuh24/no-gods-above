# Seris Animation Mapping Notes

Asset-only import prep. Seris is not wired into runtime gameplay yet.

## Body Animation Keys

### sheet_1_core_movement

- `idle`: source row 1, 8 source frames, 8 atlas cells, ground pivot `bottom_center`.
- `walk_forward`: source row 2, 6 source frames, 8 atlas cells, ground pivot `bottom_center`.
- `walk_back`: source row 3, 6 source frames, 8 atlas cells, ground pivot `bottom_center`.
- `dash_forward`: source row 4, 6 source frames, 8 atlas cells, ground pivot `bottom_center`.
- `dash_back`: source row 5, 6 source frames, 8 atlas cells, ground pivot `bottom_center`.
- `crouch`: source row 6, 4 source frames, 8 atlas cells, ground pivot `bottom_center`.

### sheet_2_air_movement

- `jump_up`: source row 1, 4 source frames, 6 atlas cells, air pivot `cell_center`.
- `jump_forward`: source row 2, 4 source frames, 6 atlas cells, air pivot `cell_center`.
- `jump_back`: source row 3, 4 source frames, 6 atlas cells, air pivot `cell_center`.
- `fall`: source row 4, 4 source frames, 6 atlas cells, air pivot `cell_center`.
- `air_dash_forward`: source row 5, 6 source frames, 6 atlas cells, air pivot `cell_center`.
- `air_dash_back`: source row 6, 6 source frames, 6 atlas cells, air pivot `cell_center`.

### sheet_3_ground_normals

- `light_attack`: source row 1, 4 source frames, 8 atlas cells, ground pivot `bottom_center`.
- `medium_attack`: source row 2, 8 source frames, 8 atlas cells, ground pivot `bottom_center`.
- `heavy_attack`: source row 3, 7 source frames, 8 atlas cells, ground pivot `bottom_center`.
- `launcher`: source row 4, 7 source frames, 8 atlas cells, ground pivot `bottom_center`.

### sheet_4_air_normals

- `air_light`: source row 1, 4 source frames, 7 atlas cells, air pivot `cell_center`.
- `air_medium`: source row 2, 6 source frames, 7 atlas cells, air pivot `cell_center`.
- `air_heavy`: source row 3, 7 source frames, 7 atlas cells, air pivot `cell_center`.
- `air_recovery`: source row 4, 4 source frames, 7 atlas cells, air pivot `cell_center`.

### sheet_5_specials_body

- `chain_snare_start`: source row 1, 4 source frames, 8 atlas cells, ground pivot `bottom_center`.
- `chain_snare_active`: source row 2, 6 source frames, 8 atlas cells, ground pivot `bottom_center`.
- `chain_snare_recovery`: source row 3, 4 source frames, 8 atlas cells, ground pivot `bottom_center`.
- `sanctum_sweep`: source row 4, 8 source frames, 8 atlas cells, ground pivot `bottom_center`.
- `divine_recoil`: source row 5, 8 source frames, 8 atlas cells, ground pivot `bottom_center`.
- `special_recovery`: source row 6, 4 source frames, 8 atlas cells, ground pivot `bottom_center`.

### sheet_6_defense_hit_reactions

- `stand_block`: source row 1, 4 source frames, 6 atlas cells, ground pivot `bottom_center`.
- `crouch_block`: source row 2, 4 source frames, 6 atlas cells, ground pivot `bottom_center`.
- `air_block`: source row 3, 4 source frames, 6 atlas cells, air pivot `cell_center`.
- `light_hitstun`: source row 4, 3 source frames, 6 atlas cells, ground pivot `bottom_center`.
- `medium_hitstun`: source row 5, 4 source frames, 6 atlas cells, ground pivot `bottom_center`.
- `heavy_hitstun`: source row 6, 6 source frames, 6 atlas cells, ground pivot `bottom_center`.
- `launch_hitstun`: source row 7, 5 source frames, 6 atlas cells, air pivot `cell_center`.
- `air_hitstun`: source row 8, 5 source frames, 6 atlas cells, air pivot `cell_center`.

### sheet_7_knockdown_recovery_flavor

- `knockdown_fall`: source row 1, 6 source frames, 8 atlas cells, air pivot `cell_center`.
- `grounded`: source row 2, 3 source frames, 8 atlas cells, ground pivot `bottom_center`.
- `recovery_get_up`: source row 3, 6 source frames, 8 atlas cells, ground pivot `bottom_center`.
- `ko_defeat`: source row 4, 8 source frames, 8 atlas cells, ground pivot `bottom_center`.
- `intro_pose`: source row 5, 8 source frames, 8 atlas cells, ground pivot `bottom_center`.
- `victory`: source row 6, 8 source frames, 8 atlas cells, ground pivot `bottom_center`.
- `taunt`: source row 7, 8 source frames, 8 atlas cells, ground pivot `bottom_center`.

## Chain / Whip VFX Keys

- `vfx_quick_chain_flick`: Sheet 8 source row 1, 5 frames, pivot `left_center_overlay` at [0, 110].
- `vfx_horizontal_chain_snare`: Sheet 8 source row 2, 7 frames, pivot `left_center_overlay` at [0, 110].
- `vfx_low_sweep_chain_arc`: Sheet 8 source row 3, 7 frames, pivot `left_center_overlay` at [0, 110].
- `vfx_rising_launcher_chain_arc`: Sheet 8 source row 4, 7 frames, pivot `left_center_overlay` at [0, 110].
- `vfx_aerial_forward_chain_arc`: Sheet 8 source row 5, 6 frames, pivot `left_center_overlay` at [0, 110].
- `vfx_aerial_downward_finisher_arc`: Sheet 8 source row 6, 6 frames, pivot `left_center_overlay` at [0, 110].
- `vfx_divine_recoil_tether_pull`: Sheet 8 source row 7, 8 frames, pivot `left_center_overlay` at [0, 110].

## Runtime Safety Notes

- These files are prepared assets and manifests only.
- Do not add Seris to character select or gameplay until the next approved implementation step.
- Sheet 8 VFX is a separate overlay layer and should not replace body animation frames.
- Kairo, Vanta, Nyx, combat logic, stage files, UI files, and controller support were not touched by this extraction script.
