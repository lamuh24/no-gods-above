# Deployment Readiness Skill

Purpose: prepare No Gods Above for public/demo deployment and verify the live build.

Use this before deploying to Netlify or any static host.

## Public Mode Audit

Confirm normal public URL:

- does not expose `window.__lamuhHiddenTest`
- does not expose `window.__serisHiddenTest`
- does not request hidden-only assets
- does not request Seris Sheet 8/effects assets
- does not log unnecessary debug spam
- has no console errors
- has no failed requests

## Asset Path Audit

Search runtime files for:

- `C:/`
- `OneDrive`
- `Downloads`
- `file://`
- absolute Windows paths
- stale generated folders
- missing PNGs
- query strings whose base file does not exist

Runtime paths should be relative, such as `assets/sprites/...`.

## Core Flow Smoke

Test:

- title/start loads
- character select loads
- all public cards appear
- portraits load
- P1/P2 select works
- match starts
- P1 damages P2
- P2 damages P1
- KO/win overlay works
- rematch works
- return to select works
- pause/help works
- all playable fighters load
- LAMUH works
- Seris works
- existing roster sanity match starts

## Validation Commands

```powershell
node --check NO_GODS_ABOVE/game.js
git diff --check
```

If deploying from a dirty local workspace, deploy from a clean commit/worktree instead of copying the whole dirty folder.

## Deployment Checklist Document

Maintain:

```text
NO_GODS_ABOVE/docs/deployment_checklist.md
```

Include:

- local run command
- pre-deploy validation
- required deploy folders
- runtime asset rules
- known acceptable demo issues
- deferred features

## Smoke Report

Save or update:

```text
NO_GODS_ABOVE/docs/deployment_smoke_report.json
```

Include:

- URL tested
- timestamp
- pass/fail
- card list
- portrait status
- failed requests
- bad responses
- console errors
- forbidden requests
- local path requests
- hidden helper exposure status

## Known Acceptable Demo Issues

Document accepted demo issues instead of hiding them:

- controller support not started
- online multiplayer not started
- full Crown of No Gods polish deferred
- transformation/install mode deferred
- deeper UI polish deferred
- some VFX intentionally disabled

## Live Verification

After deployment:

- fetch live `index.html`
- confirm title
- confirm script cache key if relevant
- open the live site in a browser/CDP if available
- verify title/select/match path
- capture console/network failures
- do not treat HTTP 200 alone as success

## Prompt Template

```text
Prepare No Gods Above for public demo deployment.
Audit public mode, asset paths, hidden helpers, stale requests, console errors, and core title-select-match flow.
Create/update deployment checklist and smoke report.
Do not add features.
```

