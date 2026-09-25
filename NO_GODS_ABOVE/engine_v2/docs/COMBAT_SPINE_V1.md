# Engine V2 Combat Spine V1

Status: `candidate-only`

Production balance authority: `false`

Human timing review: accepted for the candidate baseline on `2026-08-15`.

Purpose: prove the deterministic rules needed before character-specific special attacks are authored.

## Acceptance route

`5L -> 5M -> 2H -> jump cancel -> j.L -> j.M -> j.H -> j.S`

Hold `D` until the fighters are in hit range. The debug-runtime route is `J -> K -> S+L -> W -> J -> K -> L -> U`.

`j.S` is a clearly labeled system-test ender. It validates the combat contract only; it is not Swahili special-attack art, identity, or production tuning.

## Temporary system values

- Three normal air actions per jump. The cancel-only system-test ender costs zero normal air actions and cannot start raw.
- Juggle limit: `8` points.
- Juggle costs: launcher `0`, Air Light `1`, Air Medium `2`, Air Heavy `2`, system-test ender `3`.
- Airborne targets receive `8` extra hitstun ticks so launch confirms and air chains retain the longer opponent-control window requested in playtest. Grounded hitstun is unchanged.
- Hitstun decay begins on combo hit `4`, removes `2` ticks per additional hit, and never reduces airborne hitstun below `12` ticks.
- Damage scaling loses `0.08` per connected hit and stops at `0.50`.
- Recoverable airborne hitstun enters a `6`-tick air-recovery phase. A fresh direction, attack, special, or block input can recover early; otherwise recovery is automatic.
- The system-test ender causes hard knockdown and ends the route.
- Ordinary strikes cannot hit a grounded knockdown target; future OTG moves must opt in explicitly per hitbox.

## Required validation

- Exact route and damage accounting.
- Hit/block cancel legality and reverse-gatling rejection.
- Juggle-limit rejection without damage, hitstop, or defender-state corruption.
- Hitstun-decay floor and explicit air recovery.
- Mid-screen, corner, authored, and mirrored bounds.
- Snapshot and replay determinism.
- Legacy `NO_GODS_ABOVE/game.js` hash preservation.

## Boundaries

This slice does not add Roman Cancel, Burst, Tension, character-specific specials, EX moves, supers, wall-break, production frame data, roster promotion, or deployment. Those remain later milestones after this spine passes human playtest.

## Validation receipt — 2026-08-14

- `npm.cmd run test:combat-spine`: PASS, `10/10` focused tests.
- `npm.cmd run validate`: PASS, including deterministic core, replay, input, stage, production-contract, Swahili sandbox, and existing balance regressions.
- `npm.cmd run build`: PASS. Vite emitted only the existing large-chunk advisory.
- Stored replay checksum independently reproduced twice as `6b8689fd` after the authoritative state schema gained Combat Spine V1 counters.
- Local debug playtest: `http://127.0.0.1:4194/`, HTTP `200`, current Combat Spine V1 source and route instructions served.
- Protected legacy `NO_GODS_ABOVE/game.js`: SHA-256 `D081DA2D907CF6ABD978301C1637008B26CCB30B47E2CCAFCA3FEA3331910C6B`.
