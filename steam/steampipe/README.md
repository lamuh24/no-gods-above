# SteamPipe Notes

Generated SteamPipe VDF files are written to
`steam_release\scripts\generated\` after the Windows content build exists at
`steam_release\content\NoGodsAbove\`:

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File steam\scripts\write-steampipe-vdf.ps1 -AppId <APPID> -DepotId <DEPOTID>
```

Then upload with SteamCMD from the Steamworks SDK ContentBuilder tools:

```powershell
steamcmd.exe +login <steamworks-user> +run_app_build "C:\path\to\repo\steam_release\scripts\generated\app_build_<APPID>.vdf" +quit
```

Steam launch executable:

```text
NoGodsAbove.exe
```

Do not commit generated VDFs, SteamPipe output, account names, passwords, or
Steam Guard tokens.
