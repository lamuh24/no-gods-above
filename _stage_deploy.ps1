$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$root = Join-Path $scriptDir "NO_GODS_ABOVE"
$stage = "C:\Users\qchee\AppData\Local\Temp\nga_deploy"
if (Test-Path $stage) { Remove-Item $stage -Recurse -Force -Confirm:$false }
New-Item -ItemType Directory -Force $stage | Out-Null

# Extract every assets/... literal from game.js and index.html, stripping ?v= cache keys
$pattern = '(assets/[^"''`\\?]+\.(?:png|jpg|jpeg|webp|gif|mp3|ogg|wav|json))'
$paths = Select-String -Path "$root\game.js", "$root\index.html" -Pattern $pattern -AllMatches |
    ForEach-Object { $_.Matches } |
    ForEach-Object { $_.Groups[1].Value } |
    Sort-Object -Unique

# CSS url(...) references (HUD frames, select screen, overlays, menu buttons)
$cssPattern = 'url\("(assets/[^"]+)"\)'
$cssPaths = Select-String -Path "$root\style.css" -Pattern $cssPattern -AllMatches |
    ForEach-Object { $_.Matches } |
    ForEach-Object { $_.Groups[1].Value } |
    Sort-Object -Unique

# Portraits are loaded via a dynamic template path, include the whole folder
$portraits = Get-ChildItem "$root\assets\sprites\portraits" -File |
    ForEach-Object { "assets/sprites/portraits/$($_.Name)" }

# App icons are referenced from manifest.webmanifest, which isn't scanned above
$appIcons = @()
if (Test-Path "$root\assets\ui\app") {
    $appIcons = Get-ChildItem "$root\assets\ui\app" -File |
        ForEach-Object { "assets/ui/app/$($_.Name)" }
}

$all = @($paths) + @($cssPaths) + @($portraits) + @($appIcons) |
    Where-Object { $_ -notmatch '\$\{' -and $_ -notmatch '[{}]' } |
    Sort-Object -Unique
$missing = @()
$copied = 0
foreach ($p in $all) {
    $srcF = Join-Path $root $p
    if (Test-Path $srcF) {
        $dest = Join-Path $stage $p
        New-Item -ItemType Directory -Force (Split-Path $dest) | Out-Null
        Copy-Item $srcF $dest
        $copied++
    } else {
        $missing += $p
    }
}

$rootRuntimeFiles = @("index.html", "controller.html", "game.js", "style.css", "sw.js", "manifest.webmanifest")
foreach ($file in $rootRuntimeFiles) {
    $src = Join-Path $root $file
    if (Test-Path $src) {
        Copy-Item $src $stage
    }
}

$size = (Get-ChildItem $stage -Recurse -File | Measure-Object Length -Sum).Sum / 1MB
Write-Output "Copied: $copied assets. Missing referenced files: $($missing.Count)"
$missing | ForEach-Object { Write-Output "MISSING: $_" }
Write-Output ("Stage size: {0:N1} MB" -f $size)
