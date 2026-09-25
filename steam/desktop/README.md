# No Gods Above Steam Desktop Shell

This folder packages the existing static `NO_GODS_ABOVE` browser game as a
Windows desktop executable for Steam. It does not fork gameplay or asset logic.

## Local Smoke

```powershell
cd steam\desktop
npm install
npm run dev
```

## Windows Steam Build

```powershell
npm run package:win
npm run steam:stage
```

The Steam-ready Windows content is written to:

```text
steam_release\content\NoGodsAbove\
```

Use `NoGodsAbove.exe` as the Steam launch executable.
