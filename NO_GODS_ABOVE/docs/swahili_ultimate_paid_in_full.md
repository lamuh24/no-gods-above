# Swahili Ultimate Preproduction: Paid in Full

Tracking: GitHub Issue #1.

## Status

Preproduction contract only. Do not implement runtime, generate final assets, spend meter, or alter an existing ultimate from this document alone.

## Gameplay Intent

`Paid in Full` is a high-damage, full-meter, punishable-on-block-or-whiff cinematic cashout. It captures and consumes all Debt Marks once at confirmed cinematic start. Each captured mark adds bounded bonus damage and one additional gold seal impact accent. Five marks select the `Defaulted` presentation without changing the core hit count or extending the cinematic past five seconds.

Target startup is 10 frames after super flash with invulnerability on frames 1-12. Final numbers require implementation evidence and human playtest.

## Hit, Block, Whiff, And Meter

- Spend meter according to the existing universal ultimate convention.
- Startup shadow shot is the confirm hitbox.
- On hit: capture mark count, consume the marks, lock both fighters, and enter the cinematic.
- On block: do not enter the cinematic; play blocked recovery and leave Swahili punishable.
- On whiff: do not enter the cinematic; play whiff recovery and leave Swahili punishable.
- Damage is applied through explicit cinematic beats and exactly once per registered hit; do not double-apply at the final impact.
- If interrupted before the confirm under existing engine rules, do not consume Debt Marks.

## Four-To-Five-Second Phase Sequence

1. Super flash and controlled pistol draw.
2. Swahili shoots the opponent's shadow with both pistols; this is the confirm check.
3. Gold contract seals pin the confirmed opponent while a black-and-gold ledger opens behind Swahili.
4. Swahili calmly fixes his long patterned tie and says, "Your account is closed."
5. One heavy, readable scythe swing crosses the opponent.
6. Brief black/gold slash cut.
7. `PAID IN FULL` appears only as a separate cinematic overlay/VFX, never inside a body atlas.
8. Gold-black impact shockwave launches the opponent into hard knockdown; Swahili settles into controlled recovery.

At five marks, increase seal density, ledger intensity, impact weight, and the final vocal emphasis. Do not add extra scythe swings or unregistered impacts.

## Victim Choreography

- Confirm: existing heavy hit or stagger reaction.
- Seal pin: controlled suspended/staggered pose at a fixed target anchor.
- Ledger/tie beat: hold the victim in readable restraint; never leave them idling.
- Scythe contact: strongest available heavy/air hit reaction.
- Finish: launch/fall into hard knockdown using existing fighter-specific fallbacks.
- Mirror positions and all anchors for left-facing P1/P2 cases.

Legacy fighters without every reaction key must fall back safely to heavy hit, airborne hit, knockdown, and getup states.

## Body Asset Contract

`swahili_sheet_12_ultimate_body_atlas.png` follows the Swahili 448-cell, 6 x 5, transparent-RGBA contract. Body rows contain Swahili's performance only: pistol draw/shot, ledger reaction pose, tie adjustment, scythe anticipation/contact/follow-through, and recovery.

The scythe contact clip must show one continuous action with one held contact pose and one visible impact. The long tie, coat tails, pistols, and scythe retain locked handedness and secondary-motion continuity.

## Detached VFX Contract

Separate transparent assets under `NO_GODS_ABOVE/assets/effects/swahili/`:

- shadow-shot impact and twin muzzle flash;
- gold contract-seal pin sequence;
- ledger open/idle/close sequence;
- black-gold slash cut;
- `PAID IN FULL` overlay;
- final gold-black shockwave;
- optional Defaulted intensity variant.

Every effect records spawn frame, anchor, scale, duration, facing behavior, follow/world behavior, and cleanup rule. Text exists only in the short cinematic overlay and is localized/replaceable; it is never baked into body sprites.

## Camera, Hitstop, And Audio Direction

- Short super freeze; no prolonged white flash.
- Camera pushes in only after confirm and returns before control is restored.
- One decisive shake on scythe contact and a heavier bounded shake on final impact.
- Hold the scythe contact money pose with strong hitstop; do not scatter hitstop across the tie-adjust beat.
- Audio hooks: suppressed twin pistol cracks, paper seals, vault/ledger opening, pen scratch, calm voice start, heavy metallic scythe arc, gold stamp, and final impact.
- Voice hooks: start "Your account is closed." and finish "Paid. In. Full."

## Runtime Risks

- Mark capture/consumption occurring twice.
- Cinematic starting on block or whiff.
- Damage applying both at scythe contact and again during cleanup.
- Victim remaining idle or escaping the lock.
- Facing inversion placing seals/ledger on the wrong side.
- Scythe or coat clipping outside camera framing.
- `PAID IN FULL` text being baked into a body atlas.
- Full ledger/VFX hiding Swahili's contact pose.
- Cinematic exceeding five seconds or leaving control locked.

## Safe Implementation Order

1. Character-only hidden flag and fallback-safe asset keys.
2. Startup and confirm hitbox with whiff/block recovery.
3. Mark snapshot and one-time consumption on confirmed start.
4. Fighter lock, victim anchors, and reaction choreography.
5. Body sequence without detached VFX.
6. Seal, ledger, slash, overlay, and impact VFX with move-specific anchors.
7. Damage and knockdown, then deterministic cleanup/control restore.
8. P1/P2 and both-facing smoke for hit, block, whiff, interruption, and five-mark variants.
9. Existing-roster ultimate regression smoke.

## Acceptance Checklist

- Whiff and block never start the cinematic.
- Meter and marks are consumed exactly once under the agreed convention.
- Base and five-mark variants complete within four to five seconds.
- Registered hit count equals visible impacts.
- Victim moves and reacts at every beat.
- P1/P2 and left/right facing work.
- Damage applies once per intended hit and control always restores.
- No failed asset requests, console errors, stuck camera, or stuck fighter lock.
- Existing fighters' ultimates are unchanged.
