param(
    [Parameter(Mandatory = $true)]
    [string]$AppId,

    [Parameter(Mandatory = $true)]
    [string]$DepotId,

    [string]$Description = "No Gods Above Windows build",

    [string]$SetLive = ""
)

$ErrorActionPreference = "Stop"

$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$repoRoot = (Resolve-Path (Join-Path $scriptDir "..\..")).Path
$contentRoot = Join-Path $repoRoot "steam_release\content\NoGodsAbove"
$generatedRoot = Join-Path $repoRoot "steam_release\scripts\generated"
$outputRoot = Join-Path $repoRoot "steam_release\scripts\output"

if (-not (Test-Path -LiteralPath $contentRoot)) {
    throw "Missing Steam release content folder. Run npm run package:win first: $contentRoot"
}

New-Item -ItemType Directory -Force -Path $generatedRoot, $outputRoot | Out-Null

function Convert-ToSteamPath([string]$PathValue) {
    return ([System.IO.Path]::GetFullPath($PathValue) -replace "\\", "/")
}

$contentPath = Convert-ToSteamPath $contentRoot
$outputPath = Convert-ToSteamPath $outputRoot
$appBuildPath = Join-Path $generatedRoot "app_build_$AppId.vdf"
$depotBuildPath = Join-Path $generatedRoot "depot_build_$DepotId.vdf"

$appBuild = @"
"appbuild"
{
    "appid" "$AppId"
    "desc" "$Description"
    "buildoutput" "$outputPath"
    "contentroot" "$contentPath"
    "setlive" "$SetLive"
    "preview" "0"
    "depots"
    {
        "$DepotId" "depot_build_$DepotId.vdf"
    }
}
"@

$depotBuild = @"
"DepotBuildConfig"
{
    "DepotID" "$DepotId"
    "ContentRoot" "$contentPath"
    "FileMapping"
    {
        "LocalPath" "*"
        "DepotPath" "."
        "recursive" "1"
    }
}
"@

Set-Content -LiteralPath $appBuildPath -Value $appBuild -Encoding ASCII
Set-Content -LiteralPath $depotBuildPath -Value $depotBuild -Encoding ASCII

Write-Output "Wrote SteamPipe app build: $appBuildPath"
Write-Output "Wrote SteamPipe depot build: $depotBuildPath"
Write-Output "Run from Steamworks SDK ContentBuilder builder folder:"
Write-Output "steamcmd.exe +login <steamworks-user> +run_app_build `"$appBuildPath`" +quit"
