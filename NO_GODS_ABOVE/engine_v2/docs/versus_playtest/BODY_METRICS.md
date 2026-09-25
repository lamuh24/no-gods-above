# Versus playtest — body metrics and hitbox envelope

Candidate playtest. Not a release, not a roster promotion, and not an approval of
any Swahili animation.

Page: `versus-playtest.html` · module: `src/versus/` · run with `npm run playtest:versus`

Training controls, Lamuh's full move set, and a pre-existing corner-throw engine bug
found while testing are documented in [TRAINING_MODE.md](./TRAINING_MODE.md).

## What this playtest is for

Putting Lamuh and Swahili in one room, both player-controlled, chosen from a
select screen, so they can be compared directly while Swahili's animation set is
still being finished.

## The two defects it fixes

### 1. The fighters were not the same height

Before this work, Swahili was drawn by squeezing his whole 1536px source canvas
into a 448-unit box at a hand-tuned `0.64` scale, while Lamuh was drawn at his
approved `0.3`. Measured from the alpha masks of the two idle frames:

| | source canvas | body (head-top to feet) | drawn height | feet |
|---|---|---|---|---|
| Lamuh | 2048×1536 | 788 px | 236.4 canvas px | on the floor |
| Swahili (before) | 1536×1536 | 1035 px | 193.2 canvas px | **24 px above the floor** |

Swahili rendered **18% shorter than Lamuh and hovering**, because his root was
taken as the canvas bottom edge (y=1536) rather than his actual foot line
(y=1406).

**Fix.** Both fighters are now scaled to one shared body height,
`TARGET_BODY_UNITS = 182` simulation units, and rooted at their measured foot
line. The scale is derived, never hand-set:

```
drawScale = TARGET_BODY_UNITS * WORLD_SCALE / bodyHeightPx
```

| | body px | draw scale | drawn height | root (source space) |
|---|---|---|---|---|
| Lamuh | 788 | 0.34645 | 182.00u | (768, 1359) — authored manifest root |
| Swahili | 1035 | 0.26377 | 182.00u | (773, 1406) — measured foot centre |

182u was chosen because it is Lamuh's existing drawn height at his approved
presentation scale, so his art is unchanged in proportion and Swahili is the one
that moves to meet him.

### 2. Hitboxes did not cover the body

Both fighters' authored hurtboxes were sized against a much shorter silhouette
than the adult bodies now drawn:

| | authored standing hurtboxes | drawn body |
|---|---|---|
| Lamuh (`lamuh_legacy_v2`) | y −98 → 0 | 182u |
| Swahili (`lamuh_proto`) | y −96 → 0 | 182u |

Roughly the **top half of each character was not a hurtbox**. Anything aimed at
the head or upper chest passed straight through. Lamuh already had a taller
`extendedHurtboxes` profile (−172 → 0), but only moves that explicitly opted in
ever used it, and Swahili had no equivalent at all.

**Fix.** A `BodyEnvelope` — three stacked bands (head, torso, legs) spanning the
full 182u, plus a matching pushbox and a compressed crouch profile.

```
head   y −182 → −138
torso  y −138 →  −74
legs   y  −74 →    0
```

The bands are contiguous by test, so no strike can slip between them.

**On widths.** Height is measured; width is a deliberate review choice. The raw
alpha silhouette runs 90+ units wide at the hips because it includes Lamuh's robe
flare and Swahili's coat tails and scythe. Making cloth and a weapon into
hurtboxes would be worse than the bug being fixed, so the bands track each
character's torso core and keep the width identity their approved pushboxes
already established (Lamuh 68 wide, Swahili 60). **This is the part most worth a
human look.** Per-frame silhouette tracing is the next step if you want it.

## How this stays additive

The envelope is opt-in and off by default:

- `MatchConfig.p1BodyEnvelope` / `p2BodyEnvelope` → `FighterState.bodyEnvelope`.
- `fighterPushbox`, `hurtboxes` and `fighterProjectileHurtboxes` prefer the
  envelope when present and otherwise behave exactly as before.
- No approved move data, no `fighterDefinitions` entry, and neither existing
  sandbox was modified.

Swahili's gameplay still runs on the `lamuh_proto` fighter kind. That name is
legacy; the kind carries **his** moveset (Grave Furrow, Grounded Verdict,
Crossdraw shots) and the engine gates his air specials on it. Using it unchanged
means the playtest inherits his real, tested combat data rather than a copy.

## Reproducing the numbers

```bash
node scripts/measure_versus_body_metrics.mjs
```

Re-derives every constant from the shipped art and fails if `src/versus/roster.ts`
has drifted.

```bash
npm run test:versus
```

Asserts the shared height, the contiguous full-body stack, that a head-height
strike **connects with the envelope and misses without it**, that both characters
can damage each other in a shared match, and that a match with no envelope keeps
its original geometry.

## Known gaps

- **Swahili's crouch art is not lower than his standing art** (both ~1035px of
  body). The crouch *hitbox* compresses correctly, so lows and overheads behave,
  but the pose does not read as a crouch. Worth a look when his animation set is
  finished.
- **Twelve of Swahili's specials have no drawn motion.** They hold his heavy
  contact pose and are flagged red in the in-match coverage panel. Lamuh's set is
  now complete — see [TRAINING_MODE.md](./TRAINING_MODE.md).
- **Lamuh's Crown ultimate plays its body sequences here, but not its cinematic
  camera, aura or beam compositing** — that stays in the Lamuh sandbox.
- Hurtboxes are state-driven, not per-frame. A hit-reaction or attack pose keeps
  the standing envelope; crouching, knocked-down and rising states drop to the low
  profile.
- The arena is a flat 2D stand-in, not the 3D Last Tribunal renderer.
