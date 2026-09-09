# Forward Walk V2 Transition-Quality Report

All requested transitions were rerun with `contact_aware_smoothstep_v2` and the selected contact-weighted 40-tick timing.

| Transition | Result | Root behavior | Note |
| --- | --- | --- | --- |
| Idle -> forward | pass for review | `+2.066` | Smooth entry on first contact; no crawl-to-lunge jump. |
| Continuous forward | pass for review | continuous gait curve | Full eight-frame coverage. |
| Forward -> idle | pass for review | `0.000` on exit | No transition pop. |
| Repeated start/stop | pass for review | deterministic reset | No hidden movement after release. |
| Forward -> backward | blocked art warning | `-2.800` backward tick | Backward V2 still lacks three manually authored roles. |
| Corner approach | pass for review | simulation-clamped | Collision remains simulation-owned. |
| Side switch | pass for review | explicit root exchange | Large diagnostic delta is the requested side-switch command. |
| Mirrored P2-facing | pass for review | sign-reversed only | Runtime mirroring, not separately painted art. |
| Forward -> Standing Heavy | pass for review | `0.000` on entry | Source art unchanged. |
| Forward -> universal grab | pass for review | `0.000` on entry | Immutable review source unchanged. |
| Forward -> command grab | pass for review | `0.000` on entry | Frozen command-grab pixels and references unchanged. |
| Forward -> block | pass for review | `0.000` on entry | Clean entry. |
| Forward -> crouch | pass for review | `0.000` on entry | Clean entry. |

No direct walk-to-action exit pops. The corrected root curve addresses the rejected forward skip; the remaining frame `06 -> 07` concern is isolated to the source-art support-foot placement.
