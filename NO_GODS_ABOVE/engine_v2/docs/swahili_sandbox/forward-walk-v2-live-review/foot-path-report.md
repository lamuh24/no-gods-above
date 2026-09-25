# Forward Walk V2 Foot-Path Report

The diagnostic uses landmarks on the exact locked 1536 x 1536 V2 candidate PNGs. Measurement metadata does not modify pixels, source roots, grounding, collision, or gameplay displacement.

Selected profile: `contact_weighted_40_ticks`  
Root curve: `contact_aware_smoothstep_v2`

- Full-cycle root displacement: `144.000` simulation units, exactly `40 x 3.6` gameplay-authored units.
- Root velocity range: `2.066` to `5.548` units per tick.
- Maximum tick-to-tick velocity change: `1.007`, down from the rejected curve's `6.581`.
- Mean same-support foot drift: `4.616` simulation units per measured tick.
- Peak same-support foot drift: `31.490` simulation units.

The root skip reported by human review came from the rejected velocity curve, which nearly stopped at contact and lunged during swing. Smoothstep blending removes that discontinuous whole-fighter motion.

The remaining peak is art-side: frame `06 opposite_foot_down_compression` declares a screen-left support landmark at canvas X `486`, while frame `07 opposite_passing` declares the same support at X `650`. Because approved candidate pixels are unchanged, this can still read as a foot-placement pop even though root velocity is now smooth. Any further correction would require a separately authorized targeted art/landmark review.
