# Validation Gates

## Documentation or skill-only changes

- `git diff --check -- <paths>`
- Validate YAML frontmatter for `SKILL.md` files when possible.

## JavaScript runtime changes

- `node --check NO_GODS_ABOVE/game.js`
- Relevant smoke script under `NO_GODS_ABOVE/scripts/`
- Browser screenshot if visual behavior changed.

## Python/tooling changes

- `python -m py_compile <files>` or project compile command.
- Focused HTTP/script smoke for changed tool endpoints.

## Asset/manifest changes

- Manifest parse check.
- Runtime asset URL existence check when served locally.
- Preview/contact sheet and focused smoke report.

## Deployment changes

- Deployment checklist updates.
- Staging script or production build command.
- Public cache key / asset path verification when applicable.
