# Lamuh Legacy V2 — combat audit against Arc System Works design, 2026-09-08

Scope: `lamuh_legacy_v2` only. No art, no roster, no deploy, no approved-move edits.
Measured from `src/data/fighters.ts` + `src/core/engine.ts` at 60 Hz; advantage is
`blockstun/hitstun − (total − contact tick)`, computed per move rather than estimated.

## Before: what the character actually had

| Move | cmd | s/a/r | on block | on hit | routes out |
|---|---|---|---|---|---|
| 5L | 5L | 3/5/6 | −1 | +7 | 5M, 2M |
| 5M | 5M | 6/6/11 | 0 | +12 | 5H, 2H, Ascend Step M |
| 5H | 5H | 11/5/21 | −2 | soft KD | none |
| 2L | 2L | 3/4/7 | −1 | +7 | 2M |
| 2M | 2M | 6/5/11 | 0 | +11 | 2H |
| 2H | 2H | 10/5/22 | −3 | launcher | jump cancel only |
| j.L / j.M / j.H | | 3/5/5, 6/4/11, 8/5/17 | +2 / 0 / −4 | +10 / +10 / KD | air normals only |
| Specials (15) | | — | −8 to −34 | — | none |

Findings, in order of how much they cost the character:

1. **No normal → special cancels anywhere.** This is the single biggest gap. Every ASW
   character's core loop is *poke → confirm → special → knockdown/oki*. Lamuh had a
   chain ladder that dead-ended on the heavy, and 15 specials reachable only as raw,
   uncancelled guesses. Every special is −8 to −34 on block, so a raw special was
   never a correct button. The kit existed; the grammar to use it did not.
2. **No payoff on a confirm.** Nothing was plus on block anywhere in the kit (best: j.L
   at +2), and no route converted a light into real damage. Blockstrings ended with
   Lamuh at neutral-or-worse and no follow-up threat.
3. **No counter hit system at all.** Whiff punishing and preemptive pokes paid exactly
   the same as a hit out of neutral. ASW leans on CH for its entire risk/reward layer.
   The sandbox itself documented this: *"Counter hit: UNSUPPORTED — not invented."*
4. **Ground dash was a 18-tick locked commitment.** `processInput` refused every input
   during `dash`, so dash → 5L — the standard ASW approach — was impossible. Movement
   could close distance but could not convert it.
5. **Backdash had no invulnerability.** It was pure distance, so it lost to anything
   with reach and Lamuh had no defensive escape besides blocking and burst.
6. **No invulnerable reversal.** Heaven Splitter is a hop-based launcher with an
   *extended* (larger) hurtbox and zero invulnerable frames. On wakeup, block or burst
   were the only options. See "Not changed" — this one is deliberately left alone.
7. **The ultimate could not be comboed into.** `canStartAttack` rejected it outright
   during any attack, so 100 meter could only be spent on a raw 18-frame startup.

## After: what changed

All Lamuh-scoped. Other fighters, all approved move receipts, and every throw are byte-identical.

**1. ASW gatling ladder** (`src/data/fighters.ts`)

Every ground normal now cancels into all four grounded special families and the ultimate,
on hit *and* on block. Air normals cancel into Radiant Dive. Routes are the same on hit
and block, so a blockstring and a confirm are the same execution — you decide with your eyes.

The graph is **strictly increasing** (light → medium → heavy → special → super), so no
chain can loop or repeat a button rank; light chains cannot become an infinite. Divine
Vanish is deliberately excluded as a cancel target: cancelling a blocked normal into a
retreat would make every blockstring risk-free.

| Move | routes out (was → now) |
|---|---|
| 5L / 2L | 2 → 15 |
| 5M / 2M | 3 → 15 |
| 5H / 2H | 0 → 13 |
| j.L / j.M / j.H | 2 / 1 / 0 → 5 / 4 / 3 |

Frame data itself is untouched: no startup, active, recovery, damage, hitstun, blockstun,
knockback, or hitbox changed. The character's numbers are the approved ones; only what
they connect to is new.

**2. Counter hit** (`src/core/engine.ts`)

Striking an opponent who is committed to their own action (attack phase, or throw
startup/whiff) now pays: **×1.2 damage, +6 hitstun, +3 hitstop**, a forced heavy hit
reaction, and `counterHit: true` on the combat event for presentation. Hitstop stays
symmetric, so frame advantage is unchanged by design. Gated to `lamuh_legacy_v2` as the
attacker, and the cinematic ultimate is excluded on both sides so its authored damage
ledger and its approved trade behaviour are preserved exactly.

**3. Dash cancel** (`dashCancelTick: 5`)

From tick 5 the forward run can be taken over by any attack or a jump. Holding forward
never decays the run into a walk, and the first four frames stay committed so a dash is
still a read, not a free approach. Backdash stays fully committed — that is the price of
its new invulnerability.

**4. Backdash invulnerability** (`backdashInvulnTicks: 7`)

Ticks 1–7 of the backdash ignore strikes, projectiles *and* throw capture; the remaining
13 frames of the 20-tick backdash are fully vulnerable recovery. Lamuh finally has a
defensive option that beats a mixup and loses to a delayed punish — the ASW trade.

**5. Super cancel**

The ultimate can now be taken as an authored cancel from any normal that lists it. It
still cannot interrupt an arbitrary move: `canStartAttack` only permits it when the
current move actually offers the route.

**6. Enabling mechanism: authored strike invulnerability**

`AttackDefinition.invulnerable = { start, end, kind: "strike" | "full" }` is implemented
and honoured by strikes, projectiles and throws. **No attack declares a window** — see below.

## Deliberately not changed

- **Heaven Splitter reversal invulnerability.** Proposed and then reverted. The V4 combat
  definition is pinned by a human approval receipt (`records/heaven-splitter-v4.approval.json`,
  asserted in `lamuh_heaven_heavy_presentation.test.js`), and `lamuh_heaven_splitter.test.js`
  explicitly asserts *"Startup is vulnerable to an ordinary normal"*. Giving Lamuh a real
  reversal is the highest-value remaining upgrade, but it changes an approved move's
  identity and needs a human decision. The mechanism is in place; it is one field away:
  `invulnerable: { start: 0, end: 13, kind: "full" }` on Heaven Splitter Heavy (14f startup,
  −20 on block, 33f recovery — a textbook ASW risk/reward reversal), and
  `{ start: 0, end: 9, kind: "strike" }` on Medium so it beats strikes and loses to throws.
- **Ultimate startup invulnerability.** Same reason: its combat definition is pinned by the
  content contract.
- **Impact weight (hitstop).** Heavies sit at 7–9 frames of hitstop where ASW heavies land
  around 12–16. Raising it would not change frame advantage (hitstop is symmetric), but
  Lamuh's impact values are governed by the review-profile pipeline with its own human gate
  (`lamuh_legacy_v2_closure.test.js` pins the candidate sets), so it belongs in that pipeline.
- **Throws.** Untouched; the command-grab motion work is mid-approval.

## Also worth a look

- **Chord leniency vs hitstop.** A special cancel chorded on the freeze frame of an 8-frame
  hitstop can be dropped: `requestAttack` uses a 6-frame leniency and requires `special` to
  still be held when input resumes. Holding the special button through hitstop works, which
  is how it is played, but raising the leniency to ~10 would match ASW buffering. It touches
  shared Swahili input routing, so it wants its own pass.
- **Sandbox frame decoding (fixed here).** The playtest was failing to load with
  *"The source image cannot be decoded"* on `movement-v2/walk-backward-0{1,2,3}.png`. Those
  files are valid — they decode correctly in isolation. The cause is 313 frames of
  2048×1536 source art (~12.6 MB decoded each) saturating the renderer's decoded-image
  cache; an `HTMLImageElement` never releases its decode on demand, so once saturated every
  later frame fails. `PreparedFrames.load` now decodes through an `ImageBitmap` and closes
  it right after the 0.3 downscale, which frees that memory deterministically. Prepared
  pixels are unchanged. The real fix is upstream: export the movement frames at presentation
  resolution instead of 2048×1536.

## Playtest performance (same day, after first playtest feedback)

The playtest ran at **21 fps with 47 ms frames** in the 3D Tribunal arena. Measured, not guessed,
with `scripts/lamuh_frame_pacing_probe.js` (drives a real browser, reports animation-frame
deltas and how many simulation ticks actually advance per second). Three causes, in order:

1. **The sRGB canvas texture was the whole cost.** The sprite plane is a 1120x620 2D canvas
   uploaded into the 3D scene every frame. Tagging it `SRGBColorSpace` asks for an
   `SRGB8_ALPHA8` texture, which this GL backend cannot fill from a canvas without a per-pixel
   CPU conversion: ~40 ms per frame on its own. Isolation: skipping the upload took the same
   build from 21 to 133 fps; flat mode (no 3D) ran at 142 fps. Antialiasing,
   `preserveDrawingBuffer`, `flipY`/`premultiplyAlpha` and a CPU-resident canvas were each
   tested and each changed nothing. Fixed by uploading plain RGBA8 and doing the sRGB decode
   in the material's shader, where the texture format was doing the same maths.
   Pixel check (`scripts/lamuh_arena_color_probe.js`, deterministic pose, before vs after):
   **2.56% of channels differ, max delta 19/255, mean 0.07** — antialiased sprite edges only,
   because filtering now happens before the decode instead of after.
2. **`setInterval` drove the loop.** A free-running 16.67 ms timer is not aligned to the
   display, so even cheap frames landed unevenly. Now an animation-frame loop with a
   fixed-timestep accumulator: the simulation still advances in whole deterministic 60 Hz
   ticks in the same order, and each animation frame renders once after the ticks it owns.
   Long stalls are clamped rather than replayed as a burst of catch-up ticks.
3. **The 3D view rendered only every other tick** (a 30 fps cap added for laptop load). With
   the upload fixed there is no reason for it; sprites now present at the refresh rate.

Result: **21 fps -> 143 fps**, worst frame 70.6 ms -> 12.5 ms, simulation locked at 60.2 Hz.
Also cached the toggle lookups `render()` was doing ~20 `querySelector` calls per frame for.

One behaviour note: an animation-frame clock stops when the host suspends animation frames,
which the desktop preview pane does while it is not compositing even though the document still
reports itself visible. The old timer kept running there. A 100 ms watchdog now takes over only
after animation frames have actually stopped arriving, so the sandbox degrades to ~40 Hz
off-screen instead of freezing, and hands back to the animation-frame clock when it returns.

## Verification

- New: `tests/lamuh_combat_modernization_v1.test.js` — 9 contract tests covering the gatling
  ladder and its no-loop property, approved families staying cancel-free, a live
  5L→5M→5H→special route, authored-only super cancel, counter-hit numbers and scoping, the
  dash-cancel window, backdash strike/throw invulnerability and its commitment cost, and
  unchanged checksums for untouched fixtures. All pass.
- Regression: every test file was run individually before and after. The branch had **14
  failing files before this work**; it now has **13** — the same set minus `combat_kernel`,
  which this pass repaired (a pre-existing `const window` local in `currentDivineCounter`
  tripped the headless-determinism gate). No test that passed before fails now.
- Still failing, all pre-existing and unrelated (verified by reverting this work and
  re-running): the `awaiting_human_radiant_dive_family_review` content-status mismatch
  (3 files), `lamuh_divine_counter_content` manifest drift, `lamuh_ascend_heavy_clean_v2`
  historical timings, 5 Swahili content/preview files, and the two aggregate Lamuh data
  hashes in `lamuh_divine_vanish.test.js` / `lamuh_radiant_dive.test.js`. Those two hashes
  had already drifted from their pinned values before this change; this work adds to that
  drift and they should be re-pinned deliberately by a human, together with the earlier
  divergence, rather than quietly by an agent.
