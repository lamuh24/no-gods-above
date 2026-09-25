$ErrorActionPreference = "Stop"

$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$repoRoot = (Resolve-Path (Join-Path $scriptDir "..\..")).Path
$stageScript = Join-Path $repoRoot "_stage_deploy.ps1"
$webStage = Join-Path $env:TEMP "nga_deploy"
$desktopRoot = Join-Path $repoRoot "steam\desktop"
$distRoot = Join-Path $desktopRoot "dist"
$target = Join-Path $distRoot "game"
$steamReleaseRoot = Join-Path $repoRoot "steam_release"
$metadataPath = Join-Path $steamReleaseRoot "BUILD_METADATA.json"

if (-not (Test-Path -LiteralPath $stageScript)) {
    throw "Missing staging script: $stageScript"
}

& $stageScript

if (-not (Test-Path -LiteralPath $webStage)) {
    throw "Expected web stage folder was not created: $webStage"
}

New-Item -ItemType Directory -Force -Path $distRoot | Out-Null

$distRootFull = [System.IO.Path]::GetFullPath($distRoot)
$targetFull = [System.IO.Path]::GetFullPath($target)
if (-not $targetFull.StartsWith($distRootFull, [System.StringComparison]::OrdinalIgnoreCase)) {
    throw "Refusing to clear target outside Steam desktop dist: $targetFull"
}

if (Test-Path -LiteralPath $target) {
    Remove-Item -LiteralPath $target -Recurse -Force -Confirm:$false
}
New-Item -ItemType Directory -Force -Path $target | Out-Null

Get-ChildItem -LiteralPath $webStage -Force | Copy-Item -Destination $target -Recurse -Force

$peerSource = Join-Path $desktopRoot "node_modules\peerjs\dist\peerjs.min.js"
if (Test-Path -LiteralPath $peerSource) {
    $vendorRoot = Join-Path $target "vendor"
    New-Item -ItemType Directory -Force -Path $vendorRoot | Out-Null
    Copy-Item -LiteralPath $peerSource -Destination (Join-Path $vendorRoot "peerjs.min.js") -Force

    @("index.html", "controller.html") | ForEach-Object {
        $htmlPath = Join-Path $target $_
        if (Test-Path -LiteralPath $htmlPath) {
            $html = Get-Content -LiteralPath $htmlPath -Raw
            $html = $html.Replace("https://unpkg.com/peerjs@1.5.4/dist/peerjs.min.js", "vendor/peerjs.min.js")
            Set-Content -LiteralPath $htmlPath -Value $html -Encoding ASCII
        }
    }
} else {
    Write-Warning "PeerJS package was not found. Run npm install in steam\desktop before packaging to use the offline Electron script copy."
}

function Get-GitValue([string[]]$GitArgs, [string]$Fallback) {
    try {
        $value = (& git -C $repoRoot @GitArgs 2>$null)
        if ($LASTEXITCODE -eq 0 -and $value) {
            return (($value | Select-Object -First 1).ToString().Trim())
        }
    } catch {
    }
    return $Fallback
}

$commitHash = Get-GitValue @("rev-parse", "--short", "HEAD") "unknown"
$dirtyStatus = Get-GitValue @("status", "--short") ""
$generatedAt = Get-Date
$metadata = [ordered]@{
    gameName = "No Gods Above"
    buildType = "Steam Demo / Playtest"
    version = "0.1.0-steam-demo"
    dateGenerated = $generatedAt.ToString("yyyy-MM-dd")
    generatedAt = $generatedAt.ToString("yyyy-MM-ddTHH:mm:sszzz")
    commitHash = $commitHash
    workingTreeDirty = [bool]$dirtyStatus
    platform = "Windows"
    wrapper = "Electron"
    launchExecutable = "NoGodsAbove.exe"
}
$metadataJson = $metadata | ConvertTo-Json
Set-Content -LiteralPath (Join-Path $target "build_info.json") -Value $metadataJson -Encoding ASCII
New-Item -ItemType Directory -Force -Path $steamReleaseRoot | Out-Null
Set-Content -LiteralPath $metadataPath -Value $metadataJson -Encoding ASCII

$fileCount = (Get-ChildItem -LiteralPath $target -Recurse -File | Measure-Object).Count
$sizeMb = (Get-ChildItem -LiteralPath $target -Recurse -File | Measure-Object Length -Sum).Sum / 1MB

Write-Output ("Staged Steam web content: {0} files, {1:N1} MB -> {2}" -f $fileCount, $sizeMb, $target)
Write-Output "Wrote build metadata: $metadataPath"
