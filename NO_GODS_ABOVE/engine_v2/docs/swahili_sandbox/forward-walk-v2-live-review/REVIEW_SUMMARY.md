# Swahili Forward Walk V2 Smooth-Root Review

Final status: `candidate-only`  
Deployable: `false`  
Approval gate: `awaiting_human_forward_walk_v2_smooth_root_review`

Human review rejected the first contact-weighted root curve because Swahili visibly skipped forward. That curve used an extreme `0.581 -> 7.161` simulation-unit-per-tick range with a `6.581` maximum tick-to-tick velocity change. It is now recorded as rejected and is not eligible for promotion.

The replacement `contact_aware_smoothstep_v2` curve preserves the exact eight candidate PNGs, their hashes, the selected `6,5,4,5,6,5,4,5` exposures, and the gameplay-authored `144.000` units per 40-tick cycle. It changes only sandbox root spacing. Velocity now blends continuously from `2.066` to `5.548` units per tick with a measured maximum tick-to-tick change of `1.007`, an `84.7%` reduction from the rejected curve.

No artwork was regenerated. No atlas, production-roster, legacy `game.js`, command-grab, collision, combat, commit, push, PR, or deployment work occurred.

Selected live URL: `http://127.0.0.1:4173/sandbox.html?walkTiming=contact_weighted_40_ticks`

Assessment:

- The whole-fighter crawl-then-lunge root skip is removed in the new capture.
- Direct walk exits still measure `0.000` root displacement on entry.
- A separate frame `06 -> 07` support-foot landmark discontinuity remains in the locked artwork and can still read as a foot pop.
- The corrected cycle requires fresh human review and is not yet eligible for approval.
