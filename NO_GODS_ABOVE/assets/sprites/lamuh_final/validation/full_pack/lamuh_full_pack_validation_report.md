# LAMUH Full Pack Validation Report

Status: **PASS_WITH_REVIEW_NOTES**

## Runtime Contract
- pipeline: `new-generation Sol-style fighter format`
- cellSize: `[448, 448]`
- baselineY: `382`
- baselineTolerancePx: `3`
- fixedSourceCells: `True`
- anchorMode: `lockedFrameBottomCenter`
- rightFacingSourceArt: `True`
- runtimeMirrorsFacing: `True`
- transparentRuntimePngs: `True`
- noTrimming: `True`

## Sheet Results
- Sheet 1 `core_movement`: PASS; size `[3584, 2688]`, frames `[8, 6, 6, 6, 6, 4]`, max baseline deviation `0px`
- Sheet 2 `air_movement`: PASS; size `[2688, 2688]`, frames `[4, 4, 4, 4, 6, 6]`, max baseline deviation `0px`
  - Review note: Row 5 air_dash_back: final slot is a held/recovery duplicate from prior packaging; review smoothness before runtime timing lock.
- Sheet 3 `ground_normals`: PASS; size `[3584, 1792]`, frames `[4, 8, 7, 7]`, max baseline deviation `0px`
  - Review note: Rows 2-3 heavy/launcher: each has one held/recovery duplicate from prior packaging; review animation smoothness before final frame timing.
- Sheet 4 `air_normals`: PASS; size `[3136, 1792]`, frames `[4, 6, 7, 4]`, max baseline deviation `0px`
  - Review note: Row 2 air_heavy: powerful but slightly two-beat; acceptable, review motion if runtime wants one clean strike arc.
- Sheet 5 `specials`: PASS; size `[3584, 2688]`, frames `[6, 7, 7, 6, 7, 4]`, max baseline deviation `39px`
  - Baseline note: Ascend Step and Heaven Splitter include intentional in-motion/rising special frames; baseline confirmation applies to neutral/recovery grounded frames, not every special-pose alpha bottom.
  - Review note: Row 3 Divine Vanish: phase/afterimage frames are visually busy; correction candidate if runtime readability feels confusing.
  - Review note: Rows 1-2 specials contain intentional off-baseline motion; expected for rush/rising special animation, but tune runtime anchors carefully.
- Sheet 6 `defense_hit_reactions`: PASS; size `[3584, 2688]`, frames `[4, 4, 4, 5, 6, 6]`, max baseline deviation `3px`
  - Review note: Row 5 heavy_hit_reaction: strong and close to knockdown/crumple; review motion before pairing with Sheet 7 knockdown transitions.
- Sheet 7 `knockdown_recovery_flavor`: PASS; size `[3584, 3136]`, frames `[6, 3, 6, 8, 8, 8, 8]`, max baseline deviation `2px`
  - Review note: Row 3 KO: frame 8 holds the final finish-state pose because source produced 7 unique poses; acceptable for finish-state timing.
  - Review note: Row 1 downed_idle: third frame is slightly propped/recovering; review if a flatter downed loop is desired.

## Scale Comparison
- LAMUH: first idle `[214, 380]`, cell `448`, bottom `382`
- Sol: first idle `[222, 293]`, cell `448`, bottom `382`
- Nyx: first idle `[137, 189]`, cell `384`, bottom `290`
- Seris: first idle `[253, 290]`, cell `384`, bottom `350`

## Generated Artifacts
- contactsDir: `NO_GODS_ABOVE/assets/sprites/lamuh_final/validation/full_pack/contacts`
- combinedOverviewPath: `NO_GODS_ABOVE/assets/sprites/lamuh_final/validation/full_pack/lamuh_sheets_1_7_overview_contact.png`
- scaleComparisonPath: `NO_GODS_ABOVE/assets/sprites/lamuh_final/validation/full_pack/lamuh_scale_compare_sol_nyx_seris.png`
- validationJsonPath: `NO_GODS_ABOVE/assets/sprites/lamuh_final/validation/full_pack/lamuh_full_pack_validation_report.json`
- validationMarkdownPath: `NO_GODS_ABOVE/assets/sprites/lamuh_final/validation/full_pack/lamuh_full_pack_validation_report.md`

## Runtime Readiness
Ready for hidden runtime implementation: **True**
Technical atlas contract passed for all approved sheets; review notes are animation-timing/readability polish items, not packaging blockers.