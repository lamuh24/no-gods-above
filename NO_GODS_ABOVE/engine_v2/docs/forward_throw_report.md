# Engine V2 Universal Forward-Throw Report

Date: 2026-07-11
Branch: `codex/engine-v2-checkpoint`

## Scope and preservation boundary

This slice adds the first reusable standard forward-throw architecture for the Lamuh prototype and training dummy. It uses simulation-owned debug geometry only. The legacy `NO_GODS_ABOVE/game.js` runtime remains unchanged, and no back throw, air throw, command grab, hit-grab, special, character, production model, animation, Blender/Tripo asset, or cinematic work is included.

## Authored prototype contract

| Property | Temporary value |
| --- | ---: |
| Startup | 6 ticks |
| Active capture window | 2 ticks |
| Tech window | 8 displayed capture ticks |
| Impact | Capture tick 10 |
| Release | 2 non-hitstop ticks |
| Attacker recovery | 14 ticks |
| Whiff recovery | 18 ticks |
| Tech recovery | 12 ticks |
| Damage | 100 fixed damage |
| Impact hitstop | 6 ticks |
| Forward displacement | 24 units plus authored release anchor |
| Victim release velocity | 7 units/tick, corner-contained |
| Knockdown | 42-tick temporary hard knockdown |
| Tech separation | 20 units per fighter |
| Tech throw invulnerability | 18 ticks |
| Released-victim throw invulnerability | 18 ticks |

The throw owns a distinct `ThrowCollisionBox`, a distinct per-fighter throw hurtbox, and data-authored `grabAnchor`, `victimAnchor`, `releaseAnchor`, and optional `cameraTarget`. Strike hitboxes, throw boxes, hurtboxes, and pushboxes remain separate primitives.

## Deterministic state and priority policy

The explicit flow is:

```text
throw_startup -> throw_active -> throw_capture -> throw_release -> throw_recovery
                     |                 |               |
                     |                 |               +-> throw_victim_released -> knockdown
                     |                 +-> throw_teched
                     +-> throw_whiff
```

- Throw/tech uses the normalized Throw action: keyboard `I` or standard gamepad button `5`. Only a fresh pressed edge is consumed; holding Throw cannot repeat an attempt or tech.
- Standard forward throw is grounded and close-range only. It rejects airborne, hitstunned, blockstunned, knocked-down, getting-up, captured, throw-invulnerable, KO, invalid-round, landing-recovery, and throw-recovery targets. Ordinary blocking remains throwable.
- Damage is deferred until the authored impact tick. A successful throw applies damage exactly once and records a standalone `forward_throw` combo route at scale `1`; it does not inherit or extend stale strike scaling.
- A defender techs by just-pressing the same Throw action while the HUD tech timer is live. Capture-frame, ordinary, final-window, and mutual-throw tech paths all enter `throw_teched` at timer `0`, deal no damage, and use the same 12-tick recovery.
- A connecting strike beats an unconfirmed throw on the same simulation tick. Simultaneous eligible forward throws resolve as an order-independent mutual tech.
- Capture stores the attacker's facing, creates reciprocal partner IDs, aligns the victim from authored anchors every simulation tick, zeroes independent captured movement, and suppresses only the paired pushbox interaction. Alignment remains stable during hitstop.
- Release translates the authored attacker/victim pair together when a corner correction is needed, preserving facing, side order, anchor spacing, and legal stage bounds. Release, tech, strike interruption, KO, reset, and invalid-pair cleanup clear reciprocal links atomically.

This milestone is intentionally grounded-only. Current anchor Y offsets match and release Y velocity is zero. A future lifting throw must add an explicit captured-airborne policy instead of reusing this grounded invariant implicitly.

## Automated validation

- Manifest validation: 8 character contracts and 3 stage contracts passed.
- Legacy roster/stage static parity passed.
- Full automated suite: 86/86 tests passed, including 24 forward-throw regressions.
- Replay fixture expected/actual checksum: `0f5b884d`.
- Snapshot continuation, replay determinism, and reversed fighter iteration order passed.
- A 200-seed randomized reversed-order audit completed without checksum divergence during read-only review.
- Production TypeScript/Vite build passed. The existing non-blocking bundle-size warning remains.
- Legacy `NO_GODS_ABOVE/game.js` SHA-256 remained `401E262330F74AB9A2673C12C98AA0405F37F04ACC5BA2D773B5F9B531B7E5F1`.

## Windows browser evidence

The browser smoke used the real keyboard adapter for `I` and retained every earlier grounded, aerial, trade, blocking, hitstop, replay, bounds, and renderer assertion. It completed with zero console errors, expected/actual replay checksum `0f5b884d`, 8 stable geometries, and 22 stable pooled overlays.

New evidence under `docs/browser_smoke/`:

- `throw_keyboard_i_startup_hud.png`
- `throw_active_range.png`
- `throw_whiff_recovery.png`
- `throw_capture_anchors_hud.png`
- `throw_tech.png`
- `throw_release_impact.png`
- `throw_knockdown.png`
- `throw_corner_containment.png`
- `throw_reset_cleanup.png`

Observed automated issues: no dropped Throw input, held-input retrigger, anchor drift, repeated damage, corner escape, camera escape, reset leak, or renderer-pool growth. Physical gamepad button `5` remains an owner hardware check; its standard mapping is covered with normalized mocked-gamepad data.

## Owner manual gate

Manually playtest close-range forward throw on both facings, an out-of-range whiff, early and late same-button techs, release/knockdown, and both corners. If those feel and read correctly, temporary rigged Lamuh integration may be planned as a separate task. Do not fold back throws, air throws, command grabs, specials, or production animation work into this milestone.
