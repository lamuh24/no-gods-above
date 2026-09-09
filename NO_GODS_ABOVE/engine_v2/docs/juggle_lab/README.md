# Juggle Animation Lab

Candidate-only presentation review harness for watching Swahili's attack motion play out during a
juggle instead of holding a single pose. Simulation timing, hit detection, and combo state are
unchanged; this only decides which authored frame is shown.

## Run it

```bash
npm --prefix NO_GODS_ABOVE/engine_v2 run lab:juggle
```

Opens `http://127.0.0.1:4197/juggle-lab.html`.

- **Route** — pick the scripted combo. The launcher route `2H → j.J → j.K → j.L` is the default.
- **Speed** — 1x / 0.5x / 0.25x / 0.1x. The route replays on a loop.
- **Pause / Step frame / Restart** — `Space`, `.` and `R` do the same.
- **Show hitboxes** — the usual debug overlays.
- **Attacker frame log** — every pose P1 showed, with the tick it appeared on, how many ticks it
  held, and whether the simulation was in startup, active, or recovery.

## Evidence

```bash
npm --prefix NO_GODS_ABOVE/engine_v2 run test:juggle-animation   # deterministic, headless
npm --prefix NO_GODS_ABOVE/engine_v2 run smoke:juggle-lab        # live browser + screenshots
```

The smoke run writes `juggle_lab_smoke_report.json` and one screenshot per distinct attacker pose of
the primary route into this folder. It prefers Playwright's bundled Chromium and falls back to a
locally installed Chrome or Edge.

## Status

`candidate-only`, `deployable: false`. No combat value, package, atlas, roster, or deployment change.
