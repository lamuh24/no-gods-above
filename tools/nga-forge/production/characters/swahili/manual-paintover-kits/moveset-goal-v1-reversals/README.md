# Swahili Moveset Goal V1 - Reversal Manual Action Kit

Status: `BLOCKED_MANUAL_ART_COMPLETE_DEPENDENCY_KIT`  
Automated retries: `prohibited`  

Both reversal directions depend on the same three unresolved Backward Walk V2 paintovers. This kit closes the prior silent `missing` classification without fabricating connector art.

## Required manual inputs

- `walk_backward_first_passing`
- `walk_backward_first_up`
- `walk_backward_opposite_down`

Authoritative paintover manifest: `tools/nga-forge/production/characters/swahili/manual-paintover-kits/walk-backward-motion-v2/manual-paintover-kits.manifest.json`
Verified referenced files: `54`

## forward_to_backward_reversal

- complete and validate the three existing Backward Walk V2 paintovers
- select the nearest valid forward support phase and backward support phase
- author the minimum transition connector only after both boundary phases are approved
- validate support-foot continuity, root velocity sign change, weapon continuity, authored/mirrored parity, and deterministic replay

## backward_to_forward_reversal

- complete and validate the three existing Backward Walk V2 paintovers
- select the nearest valid backward support phase and forward support phase
- author the minimum transition connector only after both boundary phases are approved
- validate support-foot continuity, root velocity sign change, weapon continuity, authored/mirrored parity, and deterministic replay

## Post-manual gate

- 1536x1536 clean RGBA with transparent corners and no colored alpha fringe
- character lock, pistols, and rigid scythe unchanged
- no floating feet, foot skating, root jump, scale pumping, or camera-distance drift
- no mirrored-source splice; P2 is a lossless runtime mirror
- forward-to-backward and backward-to-forward direction changes are monotonic and deterministic
- legacy game.js remains byte-identical
