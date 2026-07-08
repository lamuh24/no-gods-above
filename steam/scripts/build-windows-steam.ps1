$ErrorActionPreference = "Stop"

$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$repoRoot = (Resolve-Path (Join-Path $scriptDir "..\..")).Path
$desktopRoot = Join-Path $repoRoot "steam\desktop"
$stageReleaseScript = Join-Path $scriptDir "stage-steam-release.ps1"

if (-not (Test-Path -LiteralPath (Join-Path $desktopRoot "package.json"))) {
    throw "Missing Steam desktop package.json: $desktopRoot"
}

if (-not (Test-Path -LiteralPath $stageReleaseScript)) {
    throw "Missing Steam release staging script: $stageReleaseScript"
}

function Invoke-NpmChecked([string[]]$NpmArgs) {
    $npmCommand = if ($IsWindows -or $env:OS -eq "Windows_NT") { "npm.cmd" } else { "npm" }
    & $npmCommand @NpmArgs
    if ($LASTEXITCODE -ne 0) {
        throw "npm $($NpmArgs -join ' ') failed with exit code $LASTEXITCODE"
    }
}

Push-Location $desktopRoot
try {
    if (Test-Path -LiteralPath "package-lock.json") {
        Invoke-NpmChecked @("ci")
    } else {
        Invoke-NpmChecked @("install")
    }

    Invoke-NpmChecked @("run", "package:win")
} finally {
    Pop-Location
}

& $stageReleaseScript
