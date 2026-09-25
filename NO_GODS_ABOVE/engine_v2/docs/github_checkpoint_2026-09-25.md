# Engine V2 GitHub source checkpoint — 2026-09-25

This checkpoint brings the unpublished Engine V2 work onto a review branch. It includes the game source, the image files imported by that source, the added public assets, focused tests, build scripts, and visual QA evidence. It does not publish a new site build.

## Playable work represented

- Three selectable fighters: Lamuh, Swahili, and Celeste. Character animation and balance remain subject to human playtesting; Swahili's Paid in Full work is an opt-in training rehearsal, not a completed combat ultimate.
- Fallen Capital stage, rounds, stock mode with raised semisolid platforms, CPU play, local two-player controls, and the current online room flow.
- Updated title, mode select, character select, and match HUD.
- How to Play and Combo Tutorial in Training. The combo guide teaches a ground chain followed by launcher, jump chase, air normals, and each fighter's air special; Lamuh and Swahili have additional air follow-ups.
- Actionable wake-up protection and other combat changes represented by focused Engine V2 tests.

## Reproduce and review

From `NO_GODS_ABOVE/engine_v2`, run `npm ci`, then `npm run build`. For the guided lessons, run `node scripts/tutorial_smoke.js` and `node scripts/tutorial_air_roster_smoke.js` with the local playtest server available on port 4175. Review captures are under `docs/tutorial-v1/`; broader stage and menu captures are under `docs/fallen-capital-v1/`, `docs/front-end-v1/`, and `docs/versus_playtest/`.

The source checkpoint is separate from the currently hosted Netlify playtest. GitHub commit, GitHub review, site deployment, and human gameplay approval are distinct states.

## Scope and known limits

- The runtime imports a limited set of PNGs from `tools/nga-forge/production/characters/swahili/`. Those exact files are part of this source checkpoint so a fresh checkout can build; the surrounding candidate and rejected production folders are not promoted by their inclusion.
- Broad source-generation work, alternate drafts, local sync notes, logs, caches, and recovery archives remain outside this checkpoint. No character art or balance state is presented as final merely because it appears in GitHub.
- Human keyboard testing of tutorial wording and combo feel remains useful. The broader stage contract validator has an existing `walk_forward_contact` sprite-hash drift report; the stage layout tests and browser checks for the stock correction passed separately.
