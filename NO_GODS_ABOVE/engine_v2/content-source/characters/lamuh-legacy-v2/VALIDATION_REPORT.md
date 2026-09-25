# Lamuh Legacy V2 first-playable validation

> [!important] Superseded closure state
> This report records the earlier rebuild/style checkpoint. The completed Standing Heavy and first-playable closure is documented in `FIRST_PLAYABLE_CLOSURE_VALIDATION.md`; current status is `awaiting_human_lamuh_v2_first_playable_closure_review`. Do not use the older “next unlocked work” text below as current scope.

Date: 2026-08-26  
Branch: `codex/lamuh-legacy-v2-rebuild-v1`  
Base commit: `b056b9d5a76564b931a9233c2c4527958da72716`

## Gate state

- Technical status: `TECHNICALLY_VALIDATED_LOCAL_CANDIDATE`
- First-playable human review status: unset
- Standing Heavy visual style direction: `APPROVED_WITH_TARGETED_REPAIR`
- Candidate only: true
- Deployable: false
- Production approved: false
- Standard grab / forward throw / back throw mechanics: implemented and deterministic
- Dedicated grab and throw artwork: `BLOCKED_MANUAL_ART`
- High-resolution new-game art: one Standing Heavy style direction approved with targeted repair; the single image is not runtime art and the full sequence/first-playable set remain human-gated

This milestone is technically complete for local human review. It is not a production approval.

## Protected-source receipt

- 22 V1 source/runtime artifacts are hash-locked.
- 86 protected atlas cells were extracted into additive candidate source-frame folders.
- Normal builds validate the existing immutable lock; only the explicit one-time bootstrap command may create a missing lock.
- Legacy `game.js` SHA-256 remains `D081DA2D907CF6ABD978301C1637008B26CCB30B47E2CCAFCA3FEA3331910C6B`.
- `source-lock.v1.json` SHA-256: `77807450A6022B4D6798264801580BBB294E34B2F1C77C1D84C6C5415804726B`.

## Focused validation — pass

- `npm.cmd run build:lamuh-legacy-v2`
  - 47 canonical animations audited
  - 22 protected artifacts validated
  - 10 independently authored A/B/C timing candidate sets
  - 20 non-deployable Forge packages compiled
- `npm.cmd run test:lamuh-legacy-v2`
  - 15 core/determinism/throw/transition tests pass
  - 8 content/source-lock/timing/Forge tests pass
- `npm.cmd run check:content`
  - 13 production schemas pass
  - Lamuh's 20 packages remain `deployable: false`
- `npm.cmd run build`
  - TypeScript and Vite build pass; only the existing chunk-size advisory is emitted
- `npm.cmd run smoke:lamuh-legacy-v2`
  - review and sandbox routes pass with no page errors or failed asset requests
  - Standing Heavy candidate B reaches visual and gameplay contact on tick 11
  - forward throw, back throw side switch and whiff paths pass
  - browser purple-fringe audit: V1 evidence panel 3,398 matching pixels; cleaned V2 panel 16 interpolation/VFX pixels, a greater than 99.5% reduction with no visible contour

## Visual modernization checkpoint

- Technically valid candidate: `tools/nga-forge/review/lamuh-legacy-v2-style-modernization-v1/standing-heavy-contact-style-candidate-v2.png`
- Candidate/public-copy SHA-256: `80A54F33C9AF405ACC42AF0439AD025E950CE769D34A8801FC2725FF455D85AE`
- Dimensions: 1536 × 1024
- Genuine alpha: confirmed
- Sampled magenta-family pixels: 0%
- Visual critic verdict: safe as a clearly labeled human-review style checkpoint; revise before runtime or production use.
- Human decision: `APPROVED_WITH_TARGETED_REPAIR` on 2026-08-26, hash-bound in `records/style-checkpoint-v1.approval.json`.
- Preserved direction: Lamuh identity, costume family, striking side, high-kick contact intent, body-driven silhouette and cyan/white celestial impact.
- Targeted repair debt: top padding, runtime pivot/baseline/scale, separate body/VFX contract and full-sequence cross-frame consistency.
- Two padding repairs were rejected and preserved because both outputs were opaque RGB, not genuine transparency.

The approved scope is visual identity and new-game style direction only. Runtime use, the completed Standing Heavy sequence, first-playable approval, production approval, deployability and roster promotion remain false. The next unlocked candidate work is targeted padding repair followed by a complete preservation-first Standing Heavy sequence and frame-scrub review.

## Full-suite external failure

The repository-wide `npm.cmd test` reaches and passes the Lamuh-adjacent core, combat, production, stage and current Swahili feature tests, then stops at an unrelated pre-existing Swahili sandbox approval-hash mismatch:

- actual `swahiliSandboxSimulation.ts`: `A78973E5097305A09F99BF7BA19C8DAD4BD2675E2D2208F1D81C2EDC273F7E3E`
- expected by `tests/swahili_sandbox.test.js`: `9983530AF0AEA032ECBEAE009A7843AA81953E211DB40572C936E90BA3270B4A`

No Swahili source or approval receipt was changed to hide this external failure.

## Human review gate

The graphics-direction gate has passed with targeted repair. Next, build and review a complete preservation-first Standing Heavy sequence before extending the approved style to the rest of the first-playable art. V1-flow, per-move timing, transitions, grab and throw feel, the completed Standing Heavy motion, and the full first-playable fighter still require their own human decisions.
