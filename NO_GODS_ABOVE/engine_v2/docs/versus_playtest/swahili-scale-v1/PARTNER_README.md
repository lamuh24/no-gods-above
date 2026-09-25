# Swahili — partner review package

Prepared 2026-09-12. This package contains the current Air Medium Special candidate and the latest playtest size-correction notes. It is an asset/review handoff; the full game is in the project checkout.

## Start here

1. Extract the ZIP.
2. Open `air-medium-special/swahili_air_medium_special_chakram_held_mask_ball_v6_contact_sheet.png` for the complete numbered sequence.
3. Read `size-review/SWAHILI_SIZE_REVIEW.md` and compare `size-review/calibrated-01.png` through `calibrated-12.png`.
4. Use the integration files with the existing `NO_GODS_ABOVE/engine_v2` checkout. Start its local server with `npm run dev -- --port 4175 --strictPort` and open `/versus-playtest.html?character=swahili&air-specials-v1=1`.

The local playtest URL on the sender's computer cannot be reached directly from another computer. A working checkout and its dependencies are needed for gameplay; all included PNG images can be viewed without the game.

## Air Medium Special

- Slot: `special_air_medium`, input: jump then `U + K`.
- Requested action: grab the scythe, hold it while tucking into a compact ball, then spin with the blade around him.
- Current V6 candidate: 13 transparent source frames and a 13×1 atlas with 448px cells. Frames 1–3 show the pickup, frame 4 the held-scythe tuck, and 5–13 the spin.
- Two existing registered contacts correspond to frames 5 and 9. Regular `j.K` remains on its own air-normal animation.
- Build and runtime checks passed. This is still a composite motion candidate awaiting visual feedback; inspect the pickup-to-tuck connection, grip, extra weapon/prop remnants in the tucked source, and recovery. Technical PASS does not certify clean final character art.

## Latest size fix

Some 512px special exports previously drew at one-third size because the presenter used 1536px source scaling and anchors. The presenter now converts each export into Swahili's idle reference space and respects its floor origin. Down Light additionally has one 0.81 scale correction across its entire 16-frame clip.

232 loaded images across 45 clips/held states were inventoried. Build, regression tests, versus smoke and player-side parity checks passed. Poses retain their natural bends and rotations; the report records the boundary between consistent runtime scale and remaining source-art/motion differences.

## Contents

- `air-medium-special/`: atlas, numbered contact sheet, validation JSON, all 13 transparent frames.
- `size-review/`: detailed report, measurements, browser result, 12 final comparison images.
- `integration/`: current presenter, scale helper, and calibration JSON. These files depend on the existing project and assets; they are not a standalone game.

No Blender build or deployment was used for this revision. Earlier versions remain in the source project for reference.
