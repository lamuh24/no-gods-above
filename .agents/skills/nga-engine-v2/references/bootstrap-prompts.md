# Bootstrap Prompts

## Preservation-first V2 audit

Use this when starting an engine modernization pass:

```text
Read SESSION_CONTEXT.md, AGENTS.md, and the repo-local NGA skills relevant to the touched area. Audit the current playable game before editing. Propose the smallest additive NGA Engine V2 seam that preserves current runtime behavior, fallbacks, assets, and validation coverage. Do not rewrite unrelated systems. After implementation, update SESSION_CONTEXT.md and commit only scoped files.
```

## Character V2 slice

```text
Create a data-first V2 character contract slice for [character] without changing global combat tuning. Normalize or reference only validated atlases, keep fallbacks, update manifests, run focused smokes, and document any missing coverage.
```

## Stage V2 slice

```text
Create or refine the V2 stage contract for [stage]. Keep collision aligned with visible art, avoid active-gameplay occlusion, run focused stage QA, save screenshot/report artifacts, and leave other stages untouched.
```
