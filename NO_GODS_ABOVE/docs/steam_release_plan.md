# No Gods Above Steam Release Plan

## Current Recommendation

Ship the first Steam build as a Windows desktop package around the existing
static Canvas game. Keep the Netlify/mobile build separate. This avoids a
runtime rewrite while giving Steam a real executable, launch option, and depot.

Repo support added for this path:

- `steam/desktop/` - Electron desktop shell.
- `steam/scripts/stage-steam-web-build.ps1` - stages the current web runtime into
  the desktop shell, vendors PeerJS into `vendor/peerjs.min.js`, and writes
  build metadata.
- `steam/scripts/build-windows-steam.ps1` - builds the unpacked Windows package
  and copies it to `steam_release/content/NoGodsAbove/`.
- `steam/scripts/write-steampipe-vdf.ps1` - writes SteamPipe VDF files after
  Steamworks App ID and Depot ID are known.

## Human Steamworks Requirements

These cannot be completed from the repo:

- Create or access the Steamworks partner account.
- Pay the per-app Steam Direct fee.
- Create the No Gods Above app and Windows depot.
- Configure Steam store metadata, capsule art, screenshots, trailer, pricing,
  release date, and required questionnaires.
- Add a launch option that starts `NoGodsAbove.exe`.
- Submit the store page and build for Steam review.
- Keep the Coming Soon page public for the required waiting period before
  release.

Official Steamworks references:

- Steam Direct app fee: `https://partner.steamgames.com/doc/gettingstarted/appfee`
- SteamPipe build upload: `https://partner.steamgames.com/doc/sdk/uploading`
- Store/build review process: `https://partner.steamgames.com/doc/store/review_process`
- Coming Soon requirements: `https://partner.steamgames.com/doc/store/coming_soon`

## Build Commands

From the repo root:

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File steam\scripts\build-windows-steam.ps1
```

Output:

```text
steam_release\content\NoGodsAbove\
```

Steam launch executable:

```text
NoGodsAbove.exe
```

After Steamworks IDs exist:

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File steam\scripts\write-steampipe-vdf.ps1 -AppId <APPID> -DepotId <DEPOTID>
```

Then run SteamCMD from the Steamworks SDK ContentBuilder builder folder:

```powershell
steamcmd.exe +login <steamworks-user> +run_app_build "C:\path\to\repo\steam_release\scripts\generated\app_build_<APPID>.vdf" +quit
```

## Steam Build Validation

Before uploading a build:

- Run `node --check NO_GODS_ABOVE/game.js`.
- Run `git diff --check`.
- Run `_stage_deploy.ps1` and confirm zero missing runtime files.
- Build `steam_release/content/NoGodsAbove/`.
- Launch `steam_release/content/NoGodsAbove/NoGodsAbove.exe`.
- Verify Title -> Local Versus -> P1 confirm -> P2 confirm -> Arena -> Start
  Match.
- Verify Training starts.
- Verify every public fighter can load into a match.
- Verify no console errors or failed local asset requests in the Electron shell.
- Verify controller/keyboard input in the Windows executable.
- Verify Alt+F4 exits cleanly and F11 toggles fullscreen.

## Known Steam-Specific Risks

- The normal web `index.html` loads PeerJS from unpkg for Online Versus. Steam
  staging rewrites that to local `vendor/peerjs.min.js`, but Online Versus still
  uses the public PeerJS signaling cloud rather than Steam networking.
- Electron is a wrapper, not a Steamworks SDK integration. Achievements,
  cloud saves, rich presence, overlay callbacks, and Steam Input actions are
  future work.
- The current runtime stage is about 233 MB before Electron. The Electron
  package will be larger, but still reasonable for a first Steam depot.
- Do not upload the full `NO_GODS_ABOVE` source folder; it contains generated
  candidates, screenshots, and validation artifacts that are not runtime files.

## Store Page Asset Checklist

Prepare these before store submission:

- Short description and long description.
- Header capsule, small capsule, main capsule, vertical capsule, and library
  capsule art.
- At least five current screenshots from the Steam executable.
- One trailer or gameplay clip.
- Controller/keyboard support statement.
- Language support statement.
- Early Access decision: either commit to Early Access honestly or wait for a
  fuller release build.
- Content questionnaire answers.
- Privacy policy/support links if needed.
