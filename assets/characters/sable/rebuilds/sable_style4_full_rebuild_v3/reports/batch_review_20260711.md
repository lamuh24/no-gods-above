# Sable Full Rebuild V3 - Six-Clip Batch Review

Date: 2026-07-11

Status: preview candidates only. The full-rebuild-v3 manifest contains 39/39 clips, `missingClips` is empty, and `approvedForLiveRoster` remains false for the manifest and every clip.

## Contact Sheets

1. `forward_light` - 5 frames, contact index 2
   - `reports/frame_scrub/forward_light/reference_retry2_attempt1_5f_componentclean/forward_light_numbered_contact_sheet.png`
   - Salvaged attempt 1 by removing isolated frame-2 and frame-4 fragments after confirming complete hands and boots.

2. `back_special_light` - 6 frames, contact index 3
   - `reports/frame_scrub/back_special_light/reference_canonical_grid6_final_componentclean/back_special_light_numbered_contact_sheet.png`
   - Canonical small obsidian shard and void-rift trap; no anchor iconography.

3. `down_special_heavy` - 8 frames, contact index 4
   - `reports/frame_scrub/down_special_heavy/reference_grid8_attempt2_final_componentclean/down_special_heavy_numbered_contact_sheet.png`
   - One heavy Ground Rift crest with dim aftermath and distinct half-rise recovery.

4. `up_special_light` - 6 frames, contact index 3
   - `reports/frame_scrub/up_special_light/reference_grid6_attempt2_boundaryfix_componentclean/up_special_light_numbered_contact_sheet.png`
   - Compact right-arm rise; non-centered generated row divider corrected during deterministic slicing.

5. `up_special_medium` - 7 frames, contact index 4
   - `reports/frame_scrub/up_special_medium/reference_grid8_attempt1_boundaryfix_trim8_7f_componentclean/up_special_medium_numbered_contact_sheet.png`
   - Redundant final guard trimmed; attached medium fracture shimmer retained and loose flecks removed.

6. `up_special_heavy` - 8 frames, contact index 5
   - `reports/frame_scrub/up_special_heavy/reference_grid8_attempt1_boundaryfix_componentclean/up_special_heavy_numbered_contact_sheet.png`
   - Long coil, single committed contact, bent-arm descent, and low landing recovery.

## Verification

- `verify-pack --character sable --stage full-rebuild-v3`: `COMPLETE_PREVIEW_PACK`
- Required clips: 39
- Missing clips: 0
- Manifest live approvals: 0
- `approvedForLiveRoster`: false
- Watch item: the pack report still repeats stale historical retry labels for `forward_light` and `getup` from queue status, although both clips are approved and present in the complete 39-clip manifest. Validator code was not changed.

