# Sable crouch-heavy scale and special variant fix

- Crouch-heavy was uniformly enlarged `1.2915x` with nearest-neighbor sampling about the bottom-center baseline.
- Opening crouch height changed from `199px` to `257px`, matching crouch-light's approved opening posture.
- All eight frames remain inside `448x448` cells at baseline `y=381`; the widest contact frame spans `x=8..441`.
- Frame scrub reports no duplicate frames. Motion, hit frame (`index 5`), cancel frame (`index 7`), anatomy, and palette are unchanged.
- Sable special input routing now preserves light/medium/heavy for neutral, forward, back, down, up, and airborne-neutral selection.
- Combat values, hitboxes, move timing, public roster visibility, and `approvedForLiveRoster: false` are unchanged.
