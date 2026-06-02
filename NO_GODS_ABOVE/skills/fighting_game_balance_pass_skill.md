# Fighting Game Balance Pass Skill

Purpose: tune gameplay without killing fun, readability, or the accepted character identity.

Use this only when the user explicitly asks for balance, feel, combo, damage, spam, or matchup tuning.

## Guardrails

- Do not tune numbers before observing real play.
- Do not rewrite combat architecture for a small balance issue.
- Do not change character art.
- Do not change multiple characters when one character is the issue.
- Do not erase fun tech just because it is strong; confirm whether it is degenerate.
- Keep accepted baselines unless a specific issue is identified.

## Before Tuning

Record:

- current commit/baseline
- character and matchup
- exact issue
- reproduction steps
- human playtest notes
- automated smoke evidence if available
- current damage route
- current meter gain/spend
- whether issue is visual, input, hitbox, or actual balance

## Tuning Tools

Combo damage scaling:

- Reduce long-route damage without weakening single hits too much.
- Keep scaling floor explicit.

Hitstun decay:

- Shorten follow-up windows as combo length grows.
- Prevent infinite routes while preserving early combo feel.

Knockback growth:

- Increase separation later in combos.
- Use for routes that stay glued together too long.

Heavy blowback:

- Heavy attacks should create stronger visible displacement.
- Do not make every heavy a full knockdown unless intended.

Wall bounce:

- Use sparingly.
- Add limits per combo.

Juggle control:

- Limit repeated airborne hits.
- Track juggle count and decay.

Forced knockdown:

- Use after finishers, ultimates, or route-ending attacks.
- Prevent immediate standing reset after big hits.

Recovery timing:

- Tune whiff recovery separately from hit flow.
- Spam prevention often needs recovery/cooldown, not damage nerfs.

Anti-TOD protection:

- Check maximum practical route damage.
- Use scaling, hitstun decay, meter rules, and knockdown limits before hard caps.

## Test Matrix

- Close-range combo.
- Mid-range whiff/punish.
- Jump-in route.
- Launcher route.
- Air combo route.
- Corner/wall route if applicable.
- Repeated special spam.
- P1 and P2 versions.
- Existing roster sanity.

## Reporting

Always report:

- before behavior
- after behavior
- exact values changed
- why those values
- remaining risk
- whether manual playtest is still needed

## Do Not

- Do not judge final feel from browser automation alone.
- Do not tune shared values for a character-specific issue unless required.
- Do not nerf a character because animation/VFX makes a move look stronger than it is.
- Do not hide a broken infinite by making the whole game sluggish.

## Prompt Template

```text
Audit [CHARACTER/MOVE/ROUTE] balance before changing values.
Report current route damage, hitstun, knockback, recovery, spam risk, and recommend the smallest tuning change.
Do not change art or combat architecture.
```

