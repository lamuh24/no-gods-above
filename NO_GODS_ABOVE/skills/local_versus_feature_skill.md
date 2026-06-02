# Local Versus Feature Skill

Purpose: safely implement and test P1/P2 local-versus features without breaking training, public select, or existing fighters.

Use this for select flow, P2 input, P2 meter, P2 ultimate, same-character mirror, or P1/P2 match behavior.

## Guardrails

- Do not start online multiplayer.
- Do not start controller support unless explicitly requested.
- Do not rewrite combat for a select-flow task.
- Do not break keyboard controls.
- Preserve hidden/dev flows unless the task says to remove them.
- Avoid touching unrelated character art or VFX.

## Select State Checklist

- P1 selected character.
- P2 selected character.
- active select side.
- P1 ready state.
- P2 ready state.
- training vs local-versus mode.
- same-character mirror behavior.
- return-to-select behavior.
- rematch behavior.

## P2 Runtime Checklist

- P2 profile hydrates from selected character.
- P2 animation map uses enemy-prefixed keys.
- P2 idle/walk/dash/jump/crouch work.
- P2 air dash forward/back use correct animation.
- P2 normals work.
- P2 specials work.
- P2 meter fills/spends.
- P2 ultimate works or is safely placeholder.
- P2 can hit P1.
- P2 can be hit by P1.

## P2 Input Layout

Document the current keyboard layout before changing it.

Validate:

- P2 left/right/down/up.
- P2 light/medium/heavy.
- P2 special inputs.
- P2 dash/air dash.
- P2 ultimate.
- P2 pause/shared controls if applicable.

## Same-Character Mirror

- Same character must load one asset set and mirror via facing, not duplicate left-facing sheets.
- Confirm P1 and P2 use separate state objects.
- Confirm meter, health, action, hitstun, and cooldowns do not leak between sides.

## Hidden Flow Preservation

- `?lamuhTest` and similar helpers must stay URL-gated.
- Public mode must not expose hidden helper globals.
- Hidden helper changes should not be required for normal select flow.

## Smoke Tests

- Title -> select.
- P1 picks each public character.
- P2 picks each public character where feasible.
- Same-character mirror starts.
- LAMUH vs Seris starts.
- Kairo vs Vanta sanity match starts.
- P1 damages P2.
- P2 damages P1.
- P2 air dash animation is correct.
- P2 ultimate works if supported.
- KO/win overlay appears.
- Rematch works.
- Return to select works.
- No console errors.
- No failed asset requests.

## Common Failure Patterns

- P2 uses player animation keys instead of enemy-prefixed keys.
- P2 air dash calls dash-forward animation for both directions.
- P2 meter UI is not wired.
- Same-character mirror shares cooldown/action state.
- Return-to-select resets only P1.
- Hidden helpers leak into public mode.

## Prompt Template

```text
Implement [LOCAL VERSUS FEATURE] only.
Preserve existing fighters and combat.
Run P1/P2 smoke including same-character mirror, P2 damage, P2 meter/ultimate, and return-to-select.
```

