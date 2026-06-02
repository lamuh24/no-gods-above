# LAMUH Post-Fix Runtime Scale Report
- Recommendation: keep 0.82 for LAMUH body sheets; use targeted Sheet 4 air-normal visual scale 1.55

## Fixes Applied
- `lamuhFinalAirNormals` `scale`: 0.82 -> 1.55. Sheet 4 air normal source sprites were visibly under-scaled compared with idle/jump/movement.

## Post-Fix Row Classifications
- **PASS** `sheet1_core_movement` row 0 `idle_select_idle`: rendered 173.8-190.2w / 308.3-311.6h at scale 0.82. within tolerance
- **PASS** `sheet1_core_movement` row 1 `walk_forward`: rendered 210.7-278.0w / 294.4-311.6h at scale 0.82. within tolerance
- **PASS** `sheet1_core_movement` row 2 `walk_back`: rendered 195.2-247.6w / 282.1-290.3h at scale 0.82. within tolerance
- **PASS** `sheet1_core_movement` row 3 `dash_forward`: rendered 268.1-291.9w / 243.5-259.9h at scale 0.82. within tolerance
- **PASS** `sheet1_core_movement` row 4 `dash_back`: rendered 227.1-259.9w / 261.6-265.7h at scale 0.82. within tolerance
- **PASS** `sheet1_core_movement` row 5 `crouch_low_stance`: rendered 225.5-257.5w / 231.2-253.4h at scale 0.82. within tolerance
- **PASS** `sheet2_air_movement` row 0 `jump_up_rising`: rendered 181.2-187.8w / 311.6-311.6h at scale 0.82. within tolerance
- **PASS** `sheet2_air_movement` row 1 `jump_forward`: rendered 247.6-267.3w / 255.0-282.9h at scale 0.82. within tolerance
- **PASS** `sheet2_air_movement` row 2 `jump_back`: rendered 204.2-237.0w / 290.3-304.2h at scale 0.82. within tolerance
- **PASS** `sheet2_air_movement` row 3 `fall_neutral_air_drift`: rendered 223.0-235.3w / 293.6-302.6h at scale 0.82. within tolerance
- **PASS** `sheet2_air_movement` row 4 `air_dash_forward`: rendered 265.7-273.9w / 182.9-196.8h at scale 0.82. within tolerance
- **PASS** `sheet2_air_movement` row 5 `air_dash_back`: rendered 264.0-284.5w / 210.7-212.4h at scale 0.82. within tolerance
- **OFFSET_FIX** `sheet3_ground_normals` row 0 `light_attack`: rendered 190.2-278.0w / 284.5-305.9h at scale 0.82. visible width range 107px
- **OFFSET_FIX** `sheet3_ground_normals` row 1 `medium_attack`: rendered 193.5-302.6w / 239.4-286.2h at scale 0.82. visible width range 133px
- **OFFSET_FIX** `sheet3_ground_normals` row 2 `heavy_attack`: rendered 207.5-344.4w / 234.5-269.0h at scale 0.82. visible width range 167px, likely cloak/pose expansion
- **PASS** `sheet3_ground_normals` row 3 `launcher`: rendered 157.4-212.4w / 265.7-311.6h at scale 0.82. within tolerance
- **PASS** `sheet4_air_normals` row 0 `air_light`: rendered 182.9-246.5w / 261.9-303.8h at scale 1.55. runtime visual scale corrected from 0.82 to 1.55; no atlas repack needed
- **PASS** `sheet4_air_normals` row 1 `air_medium`: rendered 187.6-297.6w / 252.7-288.3h at scale 1.55. runtime visual scale corrected from 0.82 to 1.55; no atlas repack needed
- **PASS** `sheet4_air_normals` row 2 `air_heavy`: rendered 176.7-325.5w / 238.7-296.1h at scale 1.55. runtime visual scale corrected from 0.82 to 1.55; no atlas repack needed
- **PASS** `sheet4_air_normals` row 3 `air_recovery`: rendered 144.2-249.6w / 251.1-289.9h at scale 1.55. runtime visual scale corrected from 0.82 to 1.55; no atlas repack needed
- **OFFSET_FIX** `sheet5_specials` row 0 `celestial_palm_neutral_special`: rendered 136.1-305.0w / 252.6-254.2h at scale 0.82. wide silhouette is embedded special/VFX pose language; monitor in playtest, no atlas repack applied
- **OFFSET_FIX** `sheet5_specials` row 1 `ascend_step_forward_special`: rendered 202.5-341.9w / 205.0-254.2h at scale 0.82. visible width range 170px, likely cloak/pose expansion
- **OFFSET_FIX** `sheet5_specials` row 2 `heaven_splitter_down_special`: rendered 116.4-209.9w / 240.3-270.6h at scale 0.82. visible width range 114px
- **OFFSET_FIX** `sheet5_specials` row 3 `divine_vanish_back_special`: rendered 158.3-334.6w / 249.3-254.2h at scale 0.82. wide silhouette is embedded special/VFX pose language; monitor in playtest, no atlas repack applied
- **OFFSET_FIX** `sheet5_specials` row 4 `radiant_dive_air_special`: rendered 143.5-308.3w / 264.9-270.6h at scale 0.82. wide silhouette is embedded special/VFX pose language; monitor in playtest, no atlas repack applied
- **OFFSET_FIX** `sheet5_specials` row 5 `special_recovery`: rendered 123.8-341.9w / 195.2-246.0h at scale 0.82. wide silhouette is embedded special/VFX pose language; monitor in playtest, no atlas repack applied
- **PASS** `sheet6_defense_hit_reactions` row 0 `stand_block`: rendered 147.6-158.3w / 244.4-246.0h at scale 0.82. within tolerance
- **PASS** `sheet6_defense_hit_reactions` row 1 `crouch_block`: rendered 202.5-246.8w / 232.1-233.7h at scale 0.82. within tolerance
- **PASS** `sheet6_defense_hit_reactions` row 2 `air_block`: rendered 178.8-201.7w / 256.7-258.3h at scale 0.82. within tolerance
- **PASS** `sheet6_defense_hit_reactions` row 3 `light_hit_reaction`: rendered 182.0-205.8w / 256.7-258.3h at scale 0.82. within tolerance
- **PASS** `sheet6_defense_hit_reactions` row 4 `medium_hit_reaction`: rendered 305.9-344.4w / 221.4-258.3h at scale 0.82. within tolerance
- **OFFSET_FIX** `sheet6_defense_hit_reactions` row 5 `heavy_hit_reaction_crumple`: rendered 278.0-344.4w / 196.8-258.3h at scale 0.82. visible height range 75px
- **PASS** `sheet7_knockdown_recovery_flavor` row 0 `knockdown_fall_grounded_drop`: rendered 319.0-328.8w / 90.2-296.0h at scale 0.82. intentional knockdown/get-up/KO vertical pose progression; no scale fix applied
- **OFFSET_FIX** `sheet7_knockdown_recovery_flavor` row 1 `grounded_downed_idle`: rendered 328.8-330.5w / 89.4-164.0h at scale 0.82. visible height range 91px
- **PASS** `sheet7_knockdown_recovery_flavor` row 2 `get_up_recovery`: rendered 202.5-296.0w / 179.6-293.6h at scale 0.82. intentional knockdown/get-up/KO vertical pose progression; no scale fix applied
- **PASS** `sheet7_knockdown_recovery_flavor` row 3 `ko_strong_defeat_finish_state`: rendered 290.3-331.3w / 77.9-267.3h at scale 0.82. intentional knockdown/get-up/KO vertical pose progression; no scale fix applied
- **PASS** `sheet7_knockdown_recovery_flavor` row 4 `intro_entrance`: rendered 151.7-204.2w / 287.8-289.5h at scale 0.82. within tolerance
- **OFFSET_FIX** `sheet7_knockdown_recovery_flavor` row 5 `victory_win_pose`: rendered 147.6-254.2w / 287.8-287.8h at scale 0.82. visible width range 130px
- **PASS** `sheet7_knockdown_recovery_flavor` row 6 `taunt_flavor_pose`: rendered 177.9-255.8w / 291.9-291.9h at scale 0.82. within tolerance
