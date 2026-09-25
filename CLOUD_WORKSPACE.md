# No Gods Above Cloud Workspace

Use GitHub Codespaces when you want to work from a phone, tablet, Chromebook, or any machine that can open a browser.

## Start

1. Open `https://github.com/lamuh24/no-gods-above`.
2. Select `Code`.
3. Select `Codespaces`.
4. Create or resume a codespace.
5. In the terminal, run:

```bash
npm run dev:game
```

Open the forwarded `5173` port. That is the playable game preview.

## Common Commands

```bash
npm run dev:game
npm run check:game
npm run dev:forge:backend
npm run dev:forge:frontend
npm run sprite-agent -- status --character sable
```

## Notes

- The game is still a static browser runtime under `NO_GODS_ABOVE/`.
- The devcontainer installs Sprite Agent, Forge frontend dependencies, and Forge backend Python dependencies.
- Runtime asset paths should stay relative, for example `assets/sprites/...`.
- Keep generated temp folders out of commits unless they are promoted into project assets or reports.
