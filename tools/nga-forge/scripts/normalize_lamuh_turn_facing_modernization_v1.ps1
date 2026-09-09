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

$reviewRoot = Join-Path $RepoRoot 'tools\nga-forge\review\lamuh-legacy-v2-turn-facing-modernization-v1'
$sourceSheet = Join-Path $reviewRoot 'source\turn-facing-generation-v2-chroma-green.png'
$rejectedSource = Join-Path $reviewRoot 'rejected\turn-facing-generation-v1-checkerboard-duplicate-settle.png'
$sourceRoot = Join-Path $reviewRoot 'source-frames'
$normalizedRoot = Join-Path $reviewRoot 'normalized'
$idleReference = Join-Path $RepoRoot 'NO_GODS_ABOVE\engine_v2\public\lamuh-legacy-v2\movement-v2\idle-00.png'
$targetRoot = [ordered]@{ x = 768; y = 1360 }
$roles = @(
    'right_facing_planted_turn_entry',
    'rear_three_quarter_pivot',
    'left_facing_weight_transfer',
    'left_facing_guard_settle'
)
$exposureTicks = @(2, 3, 3, 4)

# These authored roots sit between the visible foot contacts in each source cell. They
# preserve the planted world root while allowing the feet, hips, coat and locs to rotate
# around it; they are not alpha-bound recentering values.
$authoredRawRootX = @(228.0, 213.0, 150.0, 128.0)

foreach ($required in @($sourceSheet, $rejectedSource, $idleReference)) {
    if (-not (Test-Path -LiteralPath $required)) { throw "Missing Lamuh Turn / Facing prerequisite: $required" }
}
New-Item -ItemType Directory -Force -Path $sourceRoot, $normalizedRoot | Out-Null

$idleBounds = [LamuhDashBlockFrameTools]::AlphaBounds($idleReference)
if ($idleBounds.Height -le 0) { throw 'Approved Idle reference is empty.' }
$targetVisibleHeight = [double]$idleBounds.Height

$probes = @()
for ($index = 0; $index -lt 4; $index++) {
    $sourcePath = Join-Path $sourceRoot ("turn-facing-{0:D2}.png" -f $index)
    $extractMetrics = [LamuhDashBlockFrameTools]::ExtractCell($sourceSheet, $sourcePath, $index, 4)
    $sourceBounds = [LamuhDashBlockFrameTools]::AlphaBounds($sourcePath)
    if ($sourceBounds.Height -le 0) { throw "Turn / Facing source frame $index is empty." }
    $probes += [ordered]@{
        index = $index
        sourcePath = $sourcePath
        sourceBounds = $sourceBounds
        extractMetrics = $extractMetrics
        authoredRawRootX = $authoredRawRootX[$index]
        authoredRawRootY = [double]$sourceBounds.MaxY
    }
}

$medianRawHeight = Get-MedianValue -Values @($probes | ForEach-Object { [double]$_.sourceBounds.Height })
$sequenceScale = [math]::Round($targetVisibleHeight / $medianRawHeight, 8)
$frames = @()
$contactPaths = @()
$contactLabels = @()

foreach ($probe in $probes) {
    $normalizedPath = Join-Path $normalizedRoot ("turn-facing-{0:D2}.png" -f $probe.index)
    $metrics = [LamuhDashBlockFrameTools]::NormalizeFrame(
        $probe.sourcePath,
        $normalizedPath,
        $probe.authoredRawRootX,
        $probe.authoredRawRootY,
        $targetRoot.x,
        $targetRoot.y,
        2048,
        1536,
        $sequenceScale,
        $false
    )
    $frames += [ordered]@{
        index = $probe.index
        role = $roles[$probe.index]
        sourcePath = (Resolve-Path $probe.sourcePath).Path.Substring($RepoRoot.Length + 1).Replace('\','/')
        sourceSha256 = Get-Sha256 $probe.sourcePath
        normalizedPath = (Resolve-Path $normalizedPath).Path.Substring($RepoRoot.Length + 1).Replace('\','/')
        normalizedSha256 = Get-Sha256 $normalizedPath
        root = $targetRoot
        authoredRawRoot = [ordered]@{ x = $probe.authoredRawRootX; y = $probe.authoredRawRootY }
        visibleBounds = [ordered]@{ minX = $metrics.MinX; minY = $metrics.MinY; maxX = $metrics.MaxX; maxY = $metrics.MaxY }
        bodyCenter = [ordered]@{ x = [math]::Round($metrics.CentroidX, 2); y = [math]::Round($metrics.CentroidY, 2) }
        visiblePixels = $metrics.VisiblePixels
        sequenceScale = $sequenceScale
        backgroundPixelsRemoved = $probe.extractMetrics.BackgroundPixelsRemoved
        magentaPixelsNeutralized = ($probe.extractMetrics.MagentaPixelsNeutralized + $metrics.MagentaPixelsNeutralized)
        meaningfulMagentaPixelsRemaining = $metrics.MeaningfulMagentaPixelsRemaining
        redArtifactPixelsRemaining = $metrics.RedArtifactPixelsRemaining
        touchesEdge = $metrics.TouchesEdge
    }
    $contactPaths += $normalizedPath
    $contactLabels += ("turn {0:D2} | {1}" -f $probe.index, $roles[$probe.index].Replace('_',' '))
}

if (($frames.normalizedSha256 | Select-Object -Unique).Count -ne 4) { throw 'Turn / Facing contains an undeclared duplicate frame.' }
if ($frames.touchesEdge -contains $true) { throw 'A normalized Turn / Facing frame touches the canvas edge.' }
if (($frames.meaningfulMagentaPixelsRemaining | Measure-Object -Sum).Sum -ne 0) { throw 'Meaningful purple/magenta pixels remain in Turn / Facing frames.' }
if (($frames.redArtifactPixelsRemaining | Measure-Object -Sum).Sum -ne 0) { throw 'Bright red generation fringe remains in Turn / Facing frames.' }

$normalizedHeights = @($frames | ForEach-Object { [double]($_.visibleBounds.maxY - $_.visibleBounds.minY + 1) })
$heightMedian = Get-MedianValue -Values $normalizedHeights
$heightSpread = [math]::Round((($normalizedHeights | Measure-Object -Maximum).Maximum - ($normalizedHeights | Measure-Object -Minimum).Minimum) / $heightMedian, 4)
$idleHeightDeltaRatio = [math]::Round([math]::Abs($heightMedian - $targetVisibleHeight) / $targetVisibleHeight, 4)
if ($heightSpread -gt 0.04) { throw "Turn / Facing height spread exceeds 4%: $heightSpread" }
if ($idleHeightDeltaRatio -gt 0.02) { throw "Turn / Facing median height no longer matches Idle within 2%: $idleHeightDeltaRatio" }

$contactSheet = Join-Path $reviewRoot 'turn-facing-numbered-contact-sheet.png'
[LamuhDashBlockFrameTools]::MakeContactSheet($contactPaths, $contactLabels, $contactSheet, 4)

$report = [ordered]@{
    schemaVersion = '1.0.0'
    subject = 'lamuh_legacy_v2.turn_facing.modernization.candidate.v1'
    status = 'candidate-only'
    candidateOnly = $true
    deployable = $false
    productionApproved = $false
    sourceMotionReusable = $false
    sourceArtworkReusable = $false
    missingStateAuthored = $true
    sourceSheet = [ordered]@{
        path = (Resolve-Path $sourceSheet).Path.Substring($RepoRoot.Length + 1).Replace('\','/')
        sha256 = Get-Sha256 $sourceSheet
        generationMode = 'OpenAI built-in image generation reference edit mode'
        cells = 4
    }
    rejectedGeneration = [ordered]@{
        path = (Resolve-Path $rejectedSource).Path.Substring($RepoRoot.Length + 1).Replace('\','/')
        sha256 = Get-Sha256 $rejectedSource
        reason = 'REJECTED_FOR_TARGETED_REPAIR: baked checkerboard background and insufficient distinction between pivot exit and settle'
    }
    identityReferences = @(
        [ordered]@{ path = 'NO_GODS_ABOVE/engine_v2/public/lamuh-legacy-v2/movement-v2/idle-00.png'; sha256 = Get-Sha256 $idleReference }
    )
    canvas = [ordered]@{ width = 2048; height = 1536 }
    fixedRoot = $targetRoot
    authoredRootMethod = 'manual_between_foot_contacts_preserving_planted_world_root'
    sequenceScale = $sequenceScale
    targetIdleVisibleHeight = $targetVisibleHeight
    normalizedHeightSpread = $heightSpread
    idleHeightDeltaRatio = $idleHeightDeltaRatio
    state = [ordered]@{
        id = 'turn_facing'
        authoredFrameCount = 4
        exposureTicks = $exposureTicks
        durationTicks = 12
        loop = $false
    }
    validation = [ordered]@{
        sequenceWideScale = $true
        perFrameRendererScale = $false
        visualRecentering = $false
        simulationOwnsFacing = $true
        simulationOwnsRoot = $true
        immediatelyInterruptible = $true
        edgeTouches = 0
        meaningfulMagentaPixelsRemaining = 0
        redArtifactPixelsRemaining = 0
        uniqueFrames = 4
    }
    sourceRepairReason = 'No dedicated Lamuh V1 turn clip was recoverable. Author four adult-proportion, outline-free bridge poses around a planted root while preserving the approved V2 Idle identity and leaving the facing swap, collision, input response, replay and rollback state simulation-owned.'
    contactSheet = [ordered]@{
        path = (Resolve-Path $contactSheet).Path.Substring($RepoRoot.Length + 1).Replace('\','/')
        sha256 = Get-Sha256 $contactSheet
        numbered = $true
        fixedRoot = $true
    }
    frames = $frames
}

$report | ConvertTo-Json -Depth 16 | Set-Content -LiteralPath (Join-Path $reviewRoot 'normalization.report.json') -Encoding utf8
Write-Output "Normalized 4 Lamuh Turn / Facing frames at sequence scale $sequenceScale with height spread $heightSpread and Idle delta $idleHeightDeltaRatio."
