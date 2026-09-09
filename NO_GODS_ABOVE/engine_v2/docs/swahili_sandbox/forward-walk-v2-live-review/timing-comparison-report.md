# Forward Walk V2 Timing Comparison

Status: `candidate-only`  
Deployable: `false`  
Review gate: `awaiting_human_forward_walk_v2_smooth_root_review`

All profiles now use `contact_aware_smoothstep_v2`. Gameplay still authors `3.6` simulation units per nominal forward-walk tick; the animation redistributes that distance without moving collision or adding hidden time.

| Profile | Exposure ticks | Cycle | Distance | Mean foot skate | Peak foot skate | Max delta change |
| --- | --- | ---: | ---: | ---: | ---: | ---: |
| Current candidate | `7,7,7,8,7,7,7,8` | 58 ticks / 966.667 ms | 208.800 | 4.287 | 31.353 | 0.637 |
| Even 40 | `5,5,5,5,5,5,5,5` | 40 ticks / 666.667 ms | 144.000 | 4.638 | 31.335 | 0.971 |
| Contact-weighted 40 | `6,5,4,5,6,5,4,5` | 40 ticks / 666.667 ms | 144.000 | 4.616 | 31.490 | 1.007 |

Selected review timing remains `contact_weighted_40_ticks` because both contacts receive six ticks and no pose exceeds six ticks. The corrected selected profile ranges from `2.066` to `5.548` units per tick (`2.685x` peak/minimum), versus `0.581` to `7.161` (`12.326x`) in the human-rejected curve.

The selected timing and curve remain human-review candidates, not production timing approval.
