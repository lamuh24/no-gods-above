# Swahili Moveset Goal V1 — Final Production Report

Date: 2026-07-26

Branch: `codex/swahili-moveset-goal-v1`

Status: **Complete as a candidate-only production package with explicit human and manual gates**

Swahili remains outside the production roster. The bundle is `candidateOnly: true`, `deployable: false`, and not a final shipping atlas. Nothing was pushed, published, deployed, merged, or promoted.

## Final coverage

All 84 required states have an explicit final-stop classification. Silent missing count is zero.

| Classification | Count |
| --- | ---: |
| Approved production baseline | 33 |
| Human-review-ready existing candidate | 10 |
| Human-review-ready combat-design candidate | 32 |
| Manual-art blocker with complete kit | 3 |
| Not applicable | 6 |

The grouped human-review queue contains 45 decisions: the 42 review-ready candidates plus the three manual-art blockers.

## Completed families

- Universal movement, air movement, stance transitions, and turn/side-switch compatibility
- Ground normals, defense, reactions/recovery, universal grabs/throws, and Command Grab V2
- Five core special families with intentional Light/Medium/Heavy concept variants
- 25 schema-valid candidate packages: 18 new Goal V1 packages and seven byte-identical reused packages
- Six candidate atlas families on 13 pages, covering 131 unique source assets
- Pixel-exact atlas reconstruction, explicit source bounds, preserved anchors, one-pixel extrusion, and zero alpha-audit failures

The stale Command Grab package is excluded. Command Grab V2 compiles at 107 simulation ticks with 24 attacker exposures and six victim frames.

## Manual blockers

- `walk_backward`
- `forward_to_backward_reversal`
- `backward_to_forward_reversal`

Each blocker has a complete manual dependency kit. Automated generation retries remain disabled.

## Validation

- Forge top-level: **51/51 passed**
- Forge backend: **83/83 passed**
- Focused candidate-package suite: **8/8 passed**
- Engine V2 `validate`: **passed**
- Engine V2 production build: **passed**
- Forge frontend production build: **passed**
- Candidate manifest freshness check: **passed**
- Browser sandbox smoke: **55/55 scenarios, zero console errors**
- Deterministic replay/snapshot, authored/mirrored parity, and rollback presentation deduplication: **passed**
- Source hashes, 263-file protected lock, and legacy `game.js` hash: **unchanged**

Browser evidence used Chromium WebGL2 through SwiftShader and the smoke harness stopped its temporary server in `finally`.

## Hash and commit receipts

- Legacy `game.js` SHA-256: `D081DA2D907CF6ABD978301C1637008B26CCB30B47E2CCAFCA3FEA3331910C6B`
- Protected digest SHA-256: `1026F275B478F1505FDD5A992C5FC6923CE4567007B9439FDA19840DE4313E10`
- Baseline/review milestone: `fc4c46ed`
- Candidate package/atlas milestone: `05d76ae7`

## Human review and polish debt

Human review is still required for candidate motion quality, rigid scythe and pistol identity, game feel, timing, and combat balance. Combat-design candidates do not yet have generated artwork, authoritative timing, balance approval, or sandbox integration. The manual Walk Backward and reversal paintovers must be completed before those states can become package candidates.

Review must reject identity, costume, anatomy, prop, scale, camera, alpha, limb-swap, mirrored-frame, or hit-count drift. A final shipping atlas may be built only after explicit visual and production promotion approval.

## Risks

- Browser performance was validated on SwiftShader, not a hardware GPU.
- The Engine V2 build retains its existing Vite large-chunk warning.
- Git automatic geometric repack exhausted disk space after the second commit. The exact incomplete 2.218 GB temporary pack was removed; the commits are intact, but future repository maintenance needs more free disk space.

## Key artifacts

- [Final 84-state matrix](../../coverage/swahili-moveset-goal-v1.final.matrix.json)
- [Grouped human-review queue](../../reviews/swahili-moveset-goal-v1/HUMAN_REVIEW_QUEUE.md)
- [Combat concept contracts](../../design/swahili-moveset-goal-v1.combat-concepts.md)
- [Manual reversal action kit](../../manual-paintover-kits/moveset-goal-v1-reversals/README.md)
- [Candidate package operation receipt](../../packages/moveset-goal-v1/operation-status.json)
- [Candidate character bundle](../../../../../../../NO_GODS_ABOVE/engine_v2/content-source/characters/swahili-goal-v1/character.bundle.json)
- [Browser smoke report](../../../../../../../NO_GODS_ABOVE/engine_v2/docs/swahili_sandbox/captures/sandbox_browser_report.json)

## Recommended next Goal

**Swahili Moveset V1 Human Review and Manual Reversal Paintover**

Start with the 10 existing motion candidates in the 45-item grouped queue, then review the 32 combat-design candidates, and finally execute the three manual-art kits. This report does not authorize roster promotion, deployment, publishing, or final-atlas production.
