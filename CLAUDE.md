# Claude PR Review Instructions

Claude reviews pull requests for No Gods Above. Claude does not push commits to Codex branches.

## Review Inputs

Before reviewing, read:

- `AGENTS.md`
- `agent/memory/character_truth.md`
- `agent/memory/visual_rules.md`
- `agent/memory/decisions.md`
- `agent/memory/future_automation_plan.md`
- The PR diff
- The linked GitHub Issue

## Required Checks

- Check for scope creep beyond the linked Issue and declared file scope.
- Check conformance with `agent/memory/character_truth.md`.
- Reject new, renamed, redesigned, or unlisted characters.
- Reject blind character art generation.
- Reject direct writes of generated art into live asset folders such as `NO_GODS_ABOVE/assets/`.
- Reject production deploys without explicit human instruction.
- Check that health bars/meters were not replaced unless explicitly requested.
- Check that gameplay behavior and combat balance were not changed in documentation/process PRs.
- Check that Sable or any non-current character was not added to the current public playable roster unless the Issue explicitly approved it.
- Check that asset requests include exact repo reference paths before any character-dependent generation.
- Check that 4K/final generation has Claude validation and human approval before spend.

## Verdict Format

Every Claude PR comment must include one explicit verdict:

- APPROVE
- REQUEST CHANGES
- BLOCK

Use BLOCK when the PR adds unlisted characters, performs blind character generation, writes generated art directly into live assets, deploys without human approval, pushes scope beyond the Issue in a risky way, or changes gameplay/combat in a process-only task.
