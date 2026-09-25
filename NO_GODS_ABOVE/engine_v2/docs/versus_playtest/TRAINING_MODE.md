# Versus playtest — training mode

Candidate playtest. Not a release, not a roster promotion, not an approval of any
Swahili animation or of Lamuh's ultimate candidate art.

```bash
npm --prefix NO_GODS_ABOVE/engine_v2 run playtest:versus
```

Page `versus-playtest.html` · module `src/versus/` · body/hitbox rationale in
[BODY_METRICS.md](./BODY_METRICS.md).

## Lamuh's complete move set

The first build of this page only had art for 21 of Lamuh's 28 playable moves, so
Divine Vanish, Aura Sweep, the Ascend Heavy chain and the ultimate silently fell back
to a held standing-heavy pose — the moves fired in the simulation but were invisible.
All of them are now wired to their real manifests:

| Command | Move | Source package |
|---|---|---|
| `5L / 5M / 5H` | Standing normals | `standing-light/medium/heavy-v2` |
| `2L / 2M / 2H` | Crouching normals | `crouching-light/medium/heavy-v2` |
| `j.L / j.M / j.H` | Air normals | `air-normals-v2` |
| `U + L/M/H` | Celestial Palm (+ orbs) | `celestial-palm-v1` |
| `→ + U + L/M/H` | Ascend Step; Heavy confirms into kick + aura ball | `forward-clean-v1`, `heavy-chain-v1` |
| `← + U + L/M/H` | Divine Vanish; Heavy is a counter stance with a launch response | `divine-vanish-v1`, `divine-vanish-medium-v4`, `counter-launch-v4` |
| `↓ + U + L/M/H` | Aura Sweep; Heavy releases a ground wave | `down-specials-v1` |
| `U` then `↑ + L/M/H` | Heaven Splitter | `heaven-splitter-v1` |
| air `U + L/M/H` | Radiant Dive (stage-driven, never art-timed) | `radiant-dive-v1` |
| `I` / `← + I` | Forward / back throw | `throw-family-v2` |
| `P` at 100 tension | Crown of No Gods | `ultimate-v1` |

Projectiles now draw their authored art (palm orbs, the Aura Sweep ground wave, the
counter and Ascend Heavy aura balls) instead of a placeholder rectangle.

The ultimate plays its **body sequences** here. Its cinematic camera, aura and beam
compositing stay in the Lamuh sandbox — that path re-uploads the whole combat plane
as a texture each frame and is deliberately not brought into this page.

`PreparedFrames` gained an optional scale argument (default `0.3`, unchanged) so the
versus page can reuse the sandbox's real Lamuh drawing at the shared body height
instead of maintaining a parallel copy.

## Training controls

| Control | Effect |
|---|---|
| **AI opponent** | Toggles P2 between a passive dummy and a live opponent |
| **AI** level | Easy / Normal / Aggressive — changes engage distance, decision cadence and how often it guards |
| **Dummy** | Stand · Crouch · Jump · Block all · Block after first hit |
| **Infinite health** | On by default; refills only once the fighter leaves hitstun so damage still reads |
| **Infinite meter** | Pins both fighters to 100 tension, for practising the ultimate |
| **Reset positions** | Returns both fighters to neutral spacing |
| **Swap sides** | Puts the character you were practising on P2 |
| **boxes** / **full-body hitboxes** / **0.5×** / **+1 tick** | Inspection |

A second player can take over P2 at any time simply by pressing their keys — a human
input wins over the dummy or AI for that frame, so training and versus are the same
screen.

The AI is deterministic: it derives its choices from a hash of the match tick, never
`Math.random`, so a run replays identically. It only acts out of neutral, so it never
ignores its own recovery, and it does not read inputs the player has not committed to.

## Engine bug found while testing this (NOT fixed here)

**A throw that pins the victim in a corner crashes the match.**

`tickWithFighterOrder` skips `resolvePush` on any tick where a throw interaction is
in progress. When that throw ends with the victim pressed against a stage wall, the
two pushboxes are still overlapping, `state.throwInteraction` is now null, and the
end-of-tick invariant throws:

```
fighter pushboxes overlap outside an authored throw interaction
```

Reproduced deterministically at tick 317 of a seed-1 Lamuh vs Swahili match with the
AI throwing into the left corner. **It reproduces identically with the body envelope
disabled**, so it is pre-existing and not caused by the versus work.

It is deliberately **not patched**: the fix would change post-throw corner positioning,
which is approved gameplay with pinned tests, and that is a human call. Instead this
page catches the fault, separates the fighters the way `resolvePush` would have, and
reports it in the training readout in red rather than dying silently.

The likely one-line fix, for whoever takes the call: also resolve the push on the tick
a throw interaction ends, before the invariant is asserted.

## Verification

```bash
npm run test:versus            # simulation contracts
npm run smoke:versus-playtest  # real browser, writes captures/
node scripts/measure_versus_body_metrics.mjs
```

The smoke asserts each of Lamuh's specials both activates from input **and animates
through several distinct sprites** — the precise failure that made them look missing.
