# NO GODS ABOVE — Combo System

Anime-fighter cancel system in the spirit of DBFZ / Guilty Gear / BlazBlue /
Street Fighter. All rules live in `canCancelInto` in `game.js`.

## Cancel Hierarchy (universal, every character)

Strength tiers: **Light (1) → Medium (2) → Heavy (3) → Special (4) → Super/Ultimate (5)**.
Tier comes from the move key (`*_light`, `*_medium`, `*_heavy`, `*special*`,
`flags.ultimate`), falling back to hitbox type. Unknown custom keys count as
specials.

On contact (hit **or** block — chains work as blocked pressure, like GG gatlings):

| From | Into | Window |
|---|---|---|
| Normal | Any higher-tier normal (cross-button: stand/crouch/forward/back/jump all mix) | basic chain window |
| Light | A *different* light (revolver action) | basic chain window |
| Any normal | Any special | hit-cancel window |
| Any normal / special | Super/Ultimate (meter gated) | hit-cancel window |
| Special | Super/Ultimate only | hit-cancel window |

**Revolver rule:** each move can appear only once per string (`f.chainUsed`),
so ladders are finite by construction. A string resets when a move starts from
neutral, or on dash cancel.

Explicit per-move routes still work and take priority: `autoCombos` /
`airCombos` (work without contact — mash-friendly openers), `flags.cancelOnHit`
lists, dash cancels (`flags.dashCancel`), and super dash cancels.

## Extenders

- **Launchers** (`flags.launcher`, all heavies) are jump-cancelable on hit →
  jump → air chain (air normals follow the same ladder + `airCombos` routes).
- **Double jump**: one air jump per airtime (94% velocity, resets on landing).
  Combined with jump cancels it extends air strings and covers landings.
- **Super dash** homes onto launched opponents and cancels into normals on hit
  (DBFZ-style pickup).
- **Wall bounce**: one per combo off qualifying heavies.
- Heavy relaunches, juggle gravity scaling, and platform air recovery shape
  the juggle ceiling.

## Anti-infinite / anti-spam safety rails (already active)

- Combo damage scaling: −5%/hit, floor 20%.
- Hitstun decay: −3.5%/hit, floor 58% (launchers 70%).
- Juggle gravity increases with combo length.
- Heavy force-knockdown thresholds end long juggles.
- **Stale moves:** repeating the same landed move within 7s decays damage
  (×0.82/repeat, floor 45%) and meter gain.
- Blocked grounded attacks push the attacker out (spacing loss on mashed
  pressure).
- **Grabs beat block**: grounded command grab (P1 `Space`, P2 `Numpad 7`, pad
  Light+Medium together). 7f startup, ~110px range, whiffs on airborne or
  hit-stunned targets with long whiff recovery, forward/back throw by held
  direction, soft knockdown toss that can start a juggle. 0.5s cooldown; the
  AI throws point-blank turtlers too — guarding forever is no longer safe.

## Example universal routes (any character)

- `down_light → neutral_medium → forward_heavy (launch) → jump → jump_light →
  jump_medium → jump_heavy (spike)`
- `neutral_light → back_light → down_medium → down_heavy (launch) → super dash
  → jump_medium → special`
- `forward_medium → special_1 → ultimate` (meter cash-out)
