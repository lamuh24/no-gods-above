# Sable Missing Assets

Sable is playable as an MVP with clearly temporary placeholder art. The following assets are still required before calling Sable art-complete.

## Required Character Atlas Rows

- Idle
- Walk forward and backward
- Dash or phase movement
- Crouch
- Jump start, jump, fall, and landing
- Block high and block low if separated by the final animation plan
- Hitstun
- Knockdown
- Getup
- Death or round loss
- Ground light
- Ground medium
- Ground heavy
- Air light
- Air medium
- Air heavy
- Neutral special: slow void shard / pressure pulse
- Forward light special: short phase lunge
- Forward medium special: far phase lunge
- Forward heavy special: heavy phase lunge / stronger punish
- Back special: void anchor placement
- Down special: ground rift snare
- Up special: vertical phase step / anti-air
- Ultimate, super, victory, intro, and select poses if Sable remains enabled in those flows

Sable does not require unique art rows for neutral medium/heavy, back medium/heavy, down medium/heavy, up medium/heavy, or air medium/heavy special variants in the MVP. Those are compatibility aliases unless a future design pass explicitly promotes them into real moves.

## Required VFX

- Slow void shard projectile
- Void Anchor arming state
- Void Anchor detonation state
- Ground rift snare
- Phase lunge trail
- Vertical phase step trail
- Block, hit, and counter-hit readability accents if the final kit needs unique effects

Only the three Forward Phase Lunge variants need distinct final readability if they remain separate practical moves.

## Required UI Art

- Final character select portrait
- HUD portrait framing fit check
- Any roster thumbnails used by Steam screenshots, press kits, or build notes

## Validation Requirements

- Transparent runtime atlas with real alpha, no baked background.
- Confirmed grid, cell size, row count, frame counts, baseline, and scale.
- Contact sheet or preview image for review.
- Runtime smoke with Sable as player one and player two.
- Check that placeholders are removed or renamed before final release builds.
