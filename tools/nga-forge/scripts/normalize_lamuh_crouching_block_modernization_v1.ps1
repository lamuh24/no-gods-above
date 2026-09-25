param(
    [string]$RepoRoot = (Resolve-Path (Join-Path $PSScriptRoot '..\..\..')).Path
)

$ErrorActionPreference = 'Stop'
Add-Type -AssemblyName System.Drawing
. (Join-Path $PSScriptRoot 'normalize_lamuh_dash_block_modernization_v1.ps1') -RepoRoot $RepoRoot -LibraryOnly

function Get-Sha256 {
    param([Parameter(Mandatory = $true)][string]$LiteralPath)
    return (Get-FileHash -Algorithm SHA256 -LiteralPath $LiteralPath).Hash
}

function Get-MedianValue {
    param([double[]]$Values)
    $ordered = @($Values | Sort-Object)
    if ($ordered.Count -eq 0) { throw 'Cannot calculate a median from an empty set.' }
    $middle = [math]::Floor($ordered.Count / 2)
    if ($ordered.Count % 2 -eq 1) { return [double]$ordered[$middle] }
    return ([double]$ordered[$middle - 1] + [double]$ordered[$middle]) / 2.0
}

function Export-LegacyFrame {
    param([string]$AtlasPath, [string]$OutputPath, [int]$Index)
    $atlas = [System.Drawing.Bitmap]::FromFile($AtlasPath)
    try {
        $frame = New-Object System.Drawing.Bitmap 448, 448, ([System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
        try {
            $graphics = [System.Drawing.Graphics]::FromImage($frame)
            try {
                $graphics.Clear([System.Drawing.Color]::Transparent)
                $graphics.CompositingMode = [System.Drawing.Drawing2D.CompositingMode]::SourceCopy
                $source = New-Object System.Drawing.Rectangle ($Index * 448), 448, 448, 448
                $target = New-Object System.Drawing.Rectangle 0, 0, 448, 448
                $graphics.DrawImage($atlas, $target, $source, [System.Drawing.GraphicsUnit]::Pixel)
            }
            finally { $graphics.Dispose() }
            $frame.Save($OutputPath, [System.Drawing.Imaging.ImageFormat]::Png)
        }
        finally { $frame.Dispose() }
    }
    finally { $atlas.Dispose() }
}

$reviewRoot = Join-Path $RepoRoot 'tools\nga-forge\review\lamuh-legacy-v2-crouching-block-modernization-v1'
$rawSheet = Join-Path $reviewRoot 'raw\crouching-block-source-sheet.png'
$sourceRoot = Join-Path $reviewRoot 'source-frames'
$normalizedRoot = Join-Path $reviewRoot 'normalized'
$legacyRoot = Join-Path $reviewRoot 'protected-v1-frames'
$legacyAtlas = Join-Path $RepoRoot 'NO_GODS_ABOVE\assets\sprites\lamuh_final\lamuh_sheet_6_defense_hit_reactions_atlas.png'
$modernCrouchRoot = Join-Path $RepoRoot 'NO_GODS_ABOVE\engine_v2\public\lamuh-legacy-v2\movement-v2'
$targetRoot = [ordered]@{ x = 768; y = 1360 }
$roles = @('lower_guard_entry', 'compact_forearm_cover', 'braced_defensive_compression', 'stable_low_guard_hold')
$exposureTicks = @(3, 3, 4, 6)

if (-not (Test-Path -LiteralPath $rawSheet)) { throw "Missing generated crouching-block source sheet: $rawSheet" }
if (-not (Test-Path -LiteralPath $legacyAtlas)) { throw "Missing protected Lamuh V1 defense atlas: $legacyAtlas" }
New-Item -ItemType Directory -Force -Path $sourceRoot, $normalizedRoot, $legacyRoot | Out-Null

$targetHeights = @()
foreach ($index in 2, 3) {
    $reference = Join-Path $modernCrouchRoot ("crouch-{0:D2}.png" -f $index)
    $bounds = [LamuhDashBlockFrameTools]::AlphaBounds($reference)
    if ($bounds.Height -le 0) { throw "Modern crouch reference is empty: $reference" }
    $targetHeights += $bounds.Height
}
$targetVisibleHeight = Get-MedianValue -Values $targetHeights

$probes = @()
for ($index = 0; $index -lt 4; $index++) {
    $sourcePath = Join-Path $sourceRoot ("crouching-block-{0:D2}.png" -f $index)
    $legacyPath = Join-Path $legacyRoot ("crouching-block-v1-{0:D2}.png" -f $index)
    $extractMetrics = [LamuhDashBlockFrameTools]::ExtractCell($rawSheet, $sourcePath, $index, 4)
    Export-LegacyFrame -AtlasPath $legacyAtlas -OutputPath $legacyPath -Index $index
    $sourceBounds = [LamuhDashBlockFrameTools]::AlphaBounds($sourcePath)
    $legacyBounds = [LamuhDashBlockFrameTools]::AlphaBounds($legacyPath)
    if ($sourceBounds.Height -le 0 -or $legacyBounds.Height -le 0) { throw "Empty crouching-block frame encountered at index $index." }
    $probes += [ordered]@{ index=$index; sourcePath=$sourcePath; legacyPath=$legacyPath; sourceBounds=$sourceBounds; legacyBounds=$legacyBounds; extractMetrics=$extractMetrics }
}

$medianRawHeight = Get-MedianValue -Values @($probes | ForEach-Object { [double]$_.sourceBounds.Height })
$sequenceScale = [math]::Round($targetVisibleHeight / $medianRawHeight, 8)
$frames = @()
$contactPaths = @()
$contactLabels = @()

foreach ($probe in $probes) {
    $legacyWidth = [math]::Max(1, $probe.legacyBounds.Width)
    $legacyHeight = [math]::Max(1, $probe.legacyBounds.Height)
    $rootRatioX = (224.0 - $probe.legacyBounds.MinX) / $legacyWidth
    $rootRatioY = (382.0 - $probe.legacyBounds.MinY) / $legacyHeight
    $rawRootX = $probe.sourceBounds.MinX + $rootRatioX * $probe.sourceBounds.Width
    $rawRootY = $probe.sourceBounds.MinY + $rootRatioY * $probe.sourceBounds.Height
    $normalizedPath = Join-Path $normalizedRoot ("crouching-block-{0:D2}.png" -f $probe.index)
    $metrics = [LamuhDashBlockFrameTools]::NormalizeFrame($probe.sourcePath, $normalizedPath, $rawRootX, $rawRootY, $targetRoot.x, $targetRoot.y, 2048, 1536, $sequenceScale, $false)
    $frames += [ordered]@{
        index=$probe.index; role=$roles[$probe.index]
        legacyPath=(Resolve-Path $probe.legacyPath).Path.Substring($RepoRoot.Length + 1).Replace('\','/'); legacySha256=Get-Sha256 $probe.legacyPath
        sourcePath=(Resolve-Path $probe.sourcePath).Path.Substring($RepoRoot.Length + 1).Replace('\','/'); sourceSha256=Get-Sha256 $probe.sourcePath
        normalizedPath=(Resolve-Path $normalizedPath).Path.Substring($RepoRoot.Length + 1).Replace('\','/'); normalizedSha256=Get-Sha256 $normalizedPath
        root=[ordered]@{x=$targetRoot.x;y=$targetRoot.y}; authoredRawRoot=[ordered]@{x=[math]::Round($rawRootX,2);y=[math]::Round($rawRootY,2)}
        visibleBounds=[ordered]@{minX=$metrics.MinX;minY=$metrics.MinY;maxX=$metrics.MaxX;maxY=$metrics.MaxY}
        bodyCenter=[ordered]@{x=[math]::Round($metrics.CentroidX,2);y=[math]::Round($metrics.CentroidY,2)}
        visiblePixels=$metrics.VisiblePixels; sequenceScale=$sequenceScale
        backgroundPixelsRemoved=$probe.extractMetrics.BackgroundPixelsRemoved
        magentaPixelsNeutralized=($probe.extractMetrics.MagentaPixelsNeutralized + $metrics.MagentaPixelsNeutralized)
        meaningfulMagentaPixelsRemaining=$metrics.MeaningfulMagentaPixelsRemaining
        redArtifactPixelsRemaining=$metrics.RedArtifactPixelsRemaining; touchesEdge=$metrics.TouchesEdge
    }
    $contactPaths += $normalizedPath
    $contactLabels += ("crouching block {0:D2} | {1}" -f $probe.index, $roles[$probe.index].Replace('_',' '))
}

if (($frames.normalizedSha256 | Select-Object -Unique).Count -ne 4) { throw 'Crouching-block frames contain an undeclared duplicate.' }
if ($frames.touchesEdge -contains $true) { throw 'A normalized crouching-block frame touches the canvas edge.' }
if (($frames.meaningfulMagentaPixelsRemaining | Measure-Object -Sum).Sum -ne 0) { throw 'Meaningful purple/magenta pixels remain in crouching-block frames.' }
if (($frames.redArtifactPixelsRemaining | Measure-Object -Sum).Sum -ne 0) { throw 'Bright red generation fringe remains in crouching-block frames.' }
$normalizedHeights = @($frames | ForEach-Object { [double]($_.visibleBounds.maxY - $_.visibleBounds.minY + 1) })
$heightSpread = [math]::Round((($normalizedHeights | Measure-Object -Maximum).Maximum - ($normalizedHeights | Measure-Object -Minimum).Minimum) / (Get-MedianValue $normalizedHeights), 4)
if ($heightSpread -gt 0.12) { throw "Crouching-block height spread exceeds 12%: $heightSpread" }

$contactSheet = Join-Path $reviewRoot 'crouching-block-numbered-contact-sheet.png'
[LamuhDashBlockFrameTools]::MakeContactSheet($contactPaths, $contactLabels, $contactSheet, 4)
$report = [ordered]@{
    schemaVersion='1.0.0'; subject='lamuh_legacy_v2.crouching_block.modernization.candidate.v1'; status='candidate-only'; candidateOnly=$true; deployable=$false
    sourceSheet=[ordered]@{path=(Resolve-Path $rawSheet).Path.Substring($RepoRoot.Length + 1).Replace('\','/');sha256=Get-Sha256 $rawSheet;generationMode='OpenAI built-in image generation reference edit mode';cells=4}
    protectedLegacyAtlas=[ordered]@{path=(Resolve-Path $legacyAtlas).Path.Substring($RepoRoot.Length + 1).Replace('\','/');sha256=Get-Sha256 $legacyAtlas;row=1;frames=4}
    canvas=[ordered]@{width=2048;height=1536};fixedRoot=$targetRoot;sequenceScale=$sequenceScale;targetDeepCrouchVisibleHeight=$targetVisibleHeight;normalizedHeightSpread=$heightSpread
    state=[ordered]@{id='crouching_block';authoredFrameCount=4;exposureTicks=$exposureTicks;durationTicks=16;loop=$false;holdLastFrame=$true}
    validation=[ordered]@{sequenceWideScale=$true;perFrameRendererScale=$false;visualRecentering=$false;edgeTouches=0;meaningfulMagentaPixelsRemaining=0;redArtifactPixelsRemaining=0;uniqueFrames=4}
    sourceRepairReason='Preserve the V1 crouching-block body progression while rebuilding its obsolete purple-outlined art in the approved modern Lamuh style. The first pose lowers from neutral, the last pose is a stable low guard hold, and gameplay blocking remains simulation-owned.'
    contactSheet=[ordered]@{path=(Resolve-Path $contactSheet).Path.Substring($RepoRoot.Length + 1).Replace('\','/');sha256=Get-Sha256 $contactSheet;numbered=$true;fixedRoot=$true}
    frames=$frames
}
$report | ConvertTo-Json -Depth 16 | Set-Content -LiteralPath (Join-Path $reviewRoot 'normalization.report.json') -Encoding utf8
Write-Output "Normalized 4 Lamuh crouching-block frames at sequence scale $sequenceScale with height spread $heightSpread."
