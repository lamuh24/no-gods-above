# Swahili Standing Heavy V1 — Live Balance Validation

Status: `awaiting_human_standing_heavy_live_balance_review`  
Profile: `SWAHILI_STANDING_HEAVY_COMBAT_PROFILE_V1`  
Approval: `APPROVED_RECOMMENDED_PROFILE`  
Scope: candidate-only, non-deployable, preview sandbox only

## Measured Results

| Outcome | Tick 24 | Tick 28 |
|---|---:|---:|
| Normal hit advantage | +5 | +9 |
| Block advantage | -31 | -27 |
| Counter-hit advantage | +13 | +17 |

- Block punishment is severe: the defender exits blockstun 31–27 ticks before Swahili returns to idle.
- Whiff punishment is severe: 46 authored recovery ticks remain after the active window closes.
- Normal-hit reward is proportionate to the 24-tick startup, strict point-blank reach, no cancel, and full recovery commitment.
- Counter-hit reward is strong but did not appear excessive in isolated sandbox testing. Matchup and command-grab follow-up testing remain human balance decisions.
- Standing overlap is strict below 200 root units; crouching overlap is strict below 196. The move still reads as point-blank and never creates a projectile.

## Defect Found and Corrected

The extra attack-arm hurtbox was previously selected from visual preparation through impact hold (ticks 22–35). The authoritative combat contract requires it only during active extension, so it now exists only on ticks 24–28. No source pixels, artwork exposures, timing, hitbox geometry, or approved animations changed.

## Validation

- Full Engine V2 test command: passed.
- Focused Standing Heavy checks: 10 passed.
- Rendered Chromium capture scenarios: 52 passed.
- Agent-driven live browser scenarios: 17 passed.
- Rollback replay: exact checksum and combat diagnostic match.
- Browser console errors: none.
- Stale pixels, overlay overlap, scale pop, or camera pop: none detected.
- Legacy `game.js`: unchanged.
- Production roster: unchanged.

Evidence: [capture index](../captures/capture_index.html), [browser report](../captures/sandbox_browser_report.json).

The 81 MiB standalone-preview texture warning remains `PENDING_ATLAS_PACKING_OPTIMIZATION`; no source resolution or visual quality was reduced.
