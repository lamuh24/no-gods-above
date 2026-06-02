# Git Checkpoint Safety Skill

Purpose: create clean commits without swallowing junk from a dirty No Gods Above worktree.

Use this whenever the user asks for a checkpoint commit.

## First Checks

Run:

```powershell
git status --short
git diff --name-only
git diff --cached --name-only
```

Group files by purpose:

- accepted runtime/code changes
- docs/session notes
- imported runtime assets
- validation reports intended for commit
- unrelated dirty files
- caches/temp/debug artifacts
- rejected or reference-only art

## Scope Confirmation

Before staging, confirm changed files are only related to the accepted task.

If the user gives an allowed scope, stage only that scope. Leave everything else unstaged.

## Never Stage By Accident

Do not stage:

- `__pycache__/`
- Chrome profiles
- temporary browser profiles
- loose screenshots
- rejected old art
- source/reference candidate packs unless requested
- cache folders
- local logs
- unrelated UI leftovers
- unrelated debug scripts
- huge validation folders unless they are explicitly accepted artifacts

## Validation Before Commit

Run the validation requested by the user. Common checks:

```powershell
node --check NO_GODS_ABOVE/game.js
git diff --check
git diff --cached --check
```

For docs-only commits:

```powershell
git diff --check -- <doc paths>
```

For JSON:

```powershell
node -e "JSON.parse(require('fs').readFileSync('path.json','utf8'))"
```

## Staging Pattern

Prefer explicit paths:

```powershell
git add -- path/to/file1 path/to/file2
```

Avoid broad staging:

```powershell
git add .
git add -A
```

Use broad staging only when the user explicitly asks and the worktree has been audited.

## Commit Message Conventions

Use the exact message requested by the user.

Existing checkpoint style:

- `integrate first custom ui asset pack`
- `add lamuh playable baseline and scale review`
- `fix lamuh directional specials gameplay`
- `document accepted lamuh gameplay baseline`
- `prepare public demo deployment build`

## Final Report

Return:

- commit hash
- files included
- validation results
- files intentionally left unstaged
- remaining known issues

## Dirty Worktree Rule

Assume unrelated dirty files belong to the user or another agent. Do not revert them. Do not clean them. Do not include them unless the user explicitly accepts them.

## Prompt Template

```text
Create a clean checkpoint commit for [ACCEPTED STATUS].
Run git status, show changed files, validate, stage only scoped files, commit with message "[MESSAGE]", and report intentionally unstaged files.
```

