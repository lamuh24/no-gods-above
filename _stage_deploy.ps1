$root = "C:\Users\qchee\no-gods-above\NO_GODS_ABOVE"
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

$all = @($paths) + @($cssPaths) + @($portraits) | Sort-Object -Unique
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

Copy-Item "$root\index.html", "$root\game.js", "$root\style.css" $stage

$size = (Get-ChildItem $stage -Recurse -File | Measure-Object Length -Sum).Sum / 1MB
Write-Output "Copied: $copied assets. Missing referenced files: $($missing.Count)"
$missing | ForEach-Object { Write-Output "MISSING: $_" }
Write-Output ("Stage size: {0:N1} MB" -f $size)
