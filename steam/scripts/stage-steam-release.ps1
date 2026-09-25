$ErrorActionPreference = "Stop"

$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$repoRoot = (Resolve-Path (Join-Path $scriptDir "..\..")).Path
$desktopRoot = Join-Path $repoRoot "steam\desktop"
$unpacked = Join-Path $desktopRoot "release\win-unpacked"
$steamReleaseRoot = Join-Path $repoRoot "steam_release"
$contentRoot = Join-Path $steamReleaseRoot "content\NoGodsAbove"
$exePath = Join-Path $contentRoot "NoGodsAbove.exe"

if (-not (Test-Path -LiteralPath $unpacked)) {
    throw "Missing Electron unpacked Windows build. Run npm run package:win first: $unpacked"
}

New-Item -ItemType Directory -Force -Path $steamReleaseRoot | Out-Null

$contentParent = Split-Path -Parent $contentRoot
New-Item -ItemType Directory -Force -Path $contentParent | Out-Null

$contentParentFull = [System.IO.Path]::GetFullPath($contentParent)
$contentRootFull = [System.IO.Path]::GetFullPath($contentRoot)
if (-not $contentRootFull.StartsWith($contentParentFull, [System.StringComparison]::OrdinalIgnoreCase)) {
    throw "Refusing to clear content outside Steam release content folder: $contentRootFull"
}

if (Test-Path -LiteralPath $contentRoot) {
    Remove-Item -LiteralPath $contentRoot -Recurse -Force -Confirm:$false
}
New-Item -ItemType Directory -Force -Path $contentRoot | Out-Null

Get-ChildItem -LiteralPath $unpacked -Force | Copy-Item -Destination $contentRoot -Recurse -Force

if (-not (Test-Path -LiteralPath $exePath)) {
    throw "Steam content is missing launch executable: $exePath"
}

$fileCount = (Get-ChildItem -LiteralPath $contentRoot -Recurse -File | Measure-Object).Count
$sizeMb = (Get-ChildItem -LiteralPath $contentRoot -Recurse -File | Measure-Object Length -Sum).Sum / 1MB

Write-Output ("Steam release content ready: {0} files, {1:N1} MB -> {2}" -f $fileCount, $sizeMb, $contentRoot)
Write-Output "Steam launch executable: NoGodsAbove.exe"
