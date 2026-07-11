# NGA Engine V2 Codex Skill

This package turns the No Gods Above engine decisions into a reusable Codex skill.

## Install in the NGA repository

Copy the entire `nga-engine-v2` folder to:

```text
<repo-root>/.agents/skills/nga-engine-v2/
```

Keep the folder intact. Codex should discover the `SKILL.md` automatically.

## Recommended repository additions

1. Merge the relevant rules from `assets/AGENTS_SNIPPET.md` into the repository root `AGENTS.md`.
2. Commit this skill with the repository so both cloud and local Codex sessions use the same contract.
3. Use `assets/CODEX_BOOTSTRAP_PROMPT.md` for the first V2 architecture/audit session.
4. Keep large `.blend`, texture, audio, and generated candidate files outside normal Git history or in Git LFS/object storage.
5. Preserve the current playable build on its existing branch while V2 is developed in parallel.

## Explicit invocation

In Codex, invoke:

```text
$nga-engine-v2
```

Then describe the current task.

## Package contents

- `SKILL.md`: Primary workflow and invariant rules.
- `references/`: Detailed engine, character, stage, cloud, and migration contracts.
- `assets/`: Prompt and schema templates.
- `scripts/validate_skill.py`: Lightweight package validation.
