# Swahili Moveset Goal V1 - Milestone 0 Baseline

Status: `PASS_WITH_RECORDED_BASELINE_TEST_REPAIR`

## Safety outcome

- Dedicated branch: `codex/swahili-moveset-goal-v1` at baseline `81412231aa5fdfbd907d27bc6591b39dce7b43ca`.
- Preserved the pre-existing dirty worktree: 68 tracked modifications, 3061 untracked files, and no staged files at branch creation.
- No file was cleaned, reverted, staged, promoted, pushed, merged, deployed, or published.
- No artwork generation occurred during Milestone 0.

## Protected baseline

- Hash-locked 263 approved-source, VFX, candidate-package, approval-evidence, architecture, core-simulation, roster, and legacy-runtime files.
- Protected digest: `1026F275B478F1505FDD5A992C5FC6923CE4567007B9439FDA19840DE4313E10`.
- Legacy `NO_GODS_ABOVE/game.js`: `D081DA2D907CF6ABD978301C1637008B26CCB30B47E2CCAFCA3FEA3331910C6B`.
- Recorded hash mismatches: 0.
- Unresolved historical recorded paths: 0 (preserved as report evidence; these are historical relative-path records, not hash failures).

## Coverage outcome

- Matrix entries: 84.
- Status counts: `{"approved_key_poses": 1, "approved_motion": 32, "blocked_combat_design": 32, "blocked_manual_art": 2, "candidate_key_poses": 1, "candidate_motion": 9, "missing": 1, "not_applicable": 6}`.
- Explicitly missing: forward_to_backward_reversal.
- Manual-art blockers: walk_backward, backward_to_forward_reversal.
- Silent missing states: 0.
- Supers, ultimate, intro, victory, and round finisher are explicitly `not_applicable` for this Goal.

## Validation

- `python -m unittest discover -s tests -v` from `tools/nga-forge/backend`: **PASS_83_OF_83**.
  - Initial result `FAIL_79_OF_83` was traced to `stale_global_gif_allowlist_rejected_235_later_review_gifs` and repaired as `preserve_exact_original_review_counts_and_restrict_all_gifs_to_reports_review_or_reviews_roots`.
- `python -m unittest discover -s tools/nga-forge/tests -v` from `.`: **PASS_36_OF_36**.
- `npm.cmd run validate` from `NO_GODS_ABOVE/engine_v2`: **PASS**.
- `npm.cmd run build` from `NO_GODS_ABOVE/engine_v2`: **PASS**.
- `npm.cmd run build` from `tools/nga-forge/frontend`: **PASS**.
- `focused Swahili walk, dash, jump, turn, air, command-grab, and ground-normal suites` from `NO_GODS_ABOVE/engine_v2`: **PASS**.

## Current production gates

- Human review remains required for forward walk, stance transitions, planted turn/side-switch, Standing Medium V3 key poses, Crouching Medium motion, Crouching Heavy motion, throw gameplay, and Command Grab combat timing/victim results.
- Backward Walk remains `blocked_manual_art` with three complete paint-over kits; automated retries remain prohibited.
- Directional normals, air normals, five special-family concepts, throw tech, bounce results, and unsupported victim variants remain `blocked_combat_design`.
- The existing Command Grab candidate package predates the approved 24-frame Command Grab Motion V1 and must be rebuilt before it can evidence the current motion.

## Artifacts

- Coverage JSON: `tools/nga-forge/production/characters/swahili/coverage/swahili-moveset-goal-v1.matrix.json`
- Coverage CSV: `tools/nga-forge/production/characters/swahili/coverage/swahili-moveset-goal-v1.matrix.csv`
- Dependency backlog: `tools/nga-forge/production/characters/swahili/backlog/swahili-moveset-goal-v1.dependency-ordered.json`
- Hash lock: `tools/nga-forge/production/characters/swahili/freeze/swahili-moveset-goal-v1.baseline.hash-lock.json`
- Machine report: `tools/nga-forge/production/characters/swahili/reports/swahili-moveset-goal-v1/milestone-0-baseline-report.json`

Swahili remains candidate-only, outside the production roster, and `deployable: false`.
