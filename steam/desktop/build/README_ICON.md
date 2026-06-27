# No Gods Above Desktop Icon

`icon.ico` is a placeholder Windows icon for the Steam demo/playtest package.
Replace it before Steam review if final brand art is available.

Recommended final source:

- 1024x1024 or larger square PNG master.
- Clear silhouette or NGA mark that remains readable at 16x16.
- Transparent background or a deliberate dark square background.
- Export a multi-size `.ico` containing 256, 128, 64, 48, 32, and 16 pixel
  entries.

Electron Builder uses this file for:

- Windows application icon: `build.win.icon`
- NSIS installer icon: `build.nsis.installerIcon`
- NSIS uninstaller icon: `build.nsis.uninstallerIcon`
- NSIS one-click installer header icon: `build.nsis.installerHeaderIcon`

The current Steam target is an unpacked Windows `dir` build, so the NSIS icon
settings are configured for future installer builds but are not exercised by the
Steam depot package.
