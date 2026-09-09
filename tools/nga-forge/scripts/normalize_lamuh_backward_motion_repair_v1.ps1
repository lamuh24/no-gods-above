param(
    [string]$RepoRoot = (Resolve-Path (Join-Path $PSScriptRoot '..\..\..')).Path
)

$ErrorActionPreference = 'Stop'
. (Join-Path $PSScriptRoot 'normalize_lamuh_dash_block_modernization_v1.ps1') -RepoRoot $RepoRoot -LibraryOnly

function Get-Sha256 {
    param([Parameter(Mandatory = $true)][string]$LiteralPath)
    return (Get-FileHash -LiteralPath $LiteralPath -Algorithm SHA256).Hash
}

function Get-Median {
    param([double[]]$Values)
    $ordered = @($Values | Sort-Object)
    if ($ordered.Count -eq 0) { throw 'Cannot calculate a median from an empty set.' }
    $middle = [math]::Floor($ordered.Count / 2)
    if ($ordered.Count % 2 -eq 1) { return [double]$ordered[$middle] }
    return ([double]$ordered[$middle - 1] + [double]$ordered[$middle]) / 2.0
}

$reviewRoot = Join-Path $RepoRoot 'tools\nga-forge\review\lamuh-legacy-v2-backward-motion-repair-v1'
$rawRoot = Join-Path $reviewRoot 'raw'
$sourceFrameRoot = Join-Path $reviewRoot 'source-frames'
$normalizedRoot = Join-Path $reviewRoot 'normalized'
$legacyRoot = Join-Path $RepoRoot 'NO_GODS_ABOVE\engine_v2\content-source\characters\lamuh-legacy-v2\source-frames'
$legacyIdle = Join-Path $legacyRoot 'idle\idle_00.png'
$modernIdle = Join-Path $RepoRoot 'NO_GODS_ABOVE\engine_v2\public\lamuh-legacy-v2\movement-v2\idle-00.png'
$targetRoot = [ordered]@{ x = 768; y = 1360 }
$targetIdleHeight = 800.0

New-Item -ItemType Directory -Force -Path $sourceFrameRoot, $normalizedRoot | Out-Null

$clips = @(
    [ordered]@{
        state = 'walk_backward'
        raw = 'walk-backward-source-sheet.png'
        frameCount = 6
        roles = @('guarded_retreat_reach','rear_foot_plant','passing_step','opposite_retreat_reach','opposite_foot_plant','guarded_cycle_close')
        exposure = @(3,3,3,3,3,3)
        loop = $true
        motionDirection = 'faces right while stepping left; hips retreat and coat/locs trail right'
    },
    [ordered]@{
        state = 'dash_backward'
        raw = 'dash-backward-source-sheet.png'
        frameCount = 5
        roles = @('guarded_recoil_load','backward_takeoff','airborne_maximum_retreat','landing_catch','planted_brake')
        exposure = @(4,4,4,4,4)
        loop = $false
        motionDirection = 'faces right while recoiling and hopping left; landing catches leftward travel'
    }
)

$legacyIdleBounds = [LamuhDashBlockFrameTools]::AlphaBounds($legacyIdle)
$modernIdleBounds = [LamuhDashBlockFrameTools]::AlphaBounds($modernIdle)
if ($legacyIdleBounds.Height -le 0 -or $modernIdleBounds.Height -le 0) { throw 'Lamuh idle scale references are empty.' }

$frames = @()
$states = [ordered]@{}
$sourceSheets = [ordered]@{}
$contactSheets = [ordered]@{}

foreach ($clip in $clips) {
    $sheetPath = Join-Path $rawRoot $clip.raw
    if (-not (Test-Path -LiteralPath $sheetPath)) { throw "Missing backward-motion source sheet: $sheetPath" }
    $sourceSheets[$clip.state] = [ordered]@{
        path = (Resolve-Path -LiteralPath $sheetPath).Path.Substring($RepoRoot.Length + 1).Replace('\','/')
        sha256 = Get-Sha256 -LiteralPath $sheetPath
        authoredFrameCount = $clip.frameCount
        generationMode = 'OpenAI built-in image generation reference edit mode'
    }

    $probes = @()
    $scaleSamples = @()
    for ($index = 0; $index -lt $clip.frameCount; $index++) {
        $stateSourceRoot = Join-Path $sourceFrameRoot $clip.state
        $sourcePath = Join-Path $stateSourceRoot ("{0}-{1:D2}.png" -f $clip.state.Replace('_','-'), $index)
        $extractMetrics = [LamuhDashBlockFrameTools]::ExtractCell($sheetPath, $sourcePath, $index, $clip.frameCount)
        $sourceBounds = [LamuhDashBlockFrameTools]::AlphaBounds($sourcePath)
        $legacyPath = Join-Path (Join-Path $legacyRoot $clip.state) ("{0}_{1:D2}.png" -f $clip.state, $index)
        if (-not (Test-Path -LiteralPath $legacyPath)) { throw "Missing protected V1 frame: $legacyPath" }
        $legacyBounds = [LamuhDashBlockFrameTools]::AlphaBounds($legacyPath)
        if ($sourceBounds.Height -le 0 -or $legacyBounds.Height -le 0) { throw "Empty backward-motion frame: $($clip.state) $index" }
        $desiredHeight = $targetIdleHeight * ($legacyBounds.Height / [math]::Max(1, $legacyIdleBounds.Height))
        $scaleSamples += $desiredHeight / $sourceBounds.Height
        $probes += [ordered]@{
            index = $index
            sourcePath = $sourcePath
            sourceBounds = $sourceBounds
            extractMetrics = $extractMetrics
            legacyPath = $legacyPath
            legacyBounds = $legacyBounds
            desiredHeight = $desiredHeight
        }
    }

    $sequenceScale = [math]::Round((Get-Median -Values $scaleSamples), 8)
    $commonSourceBaseline = ($probes.sourceBounds.MaxY | Measure-Object -Maximum).Maximum
    foreach ($probe in $probes) {
        $sourceBitmap = New-Object System.Drawing.Bitmap($probe.sourcePath)
        try { $fixedSourceRootX = $sourceBitmap.Width / 2.0 }
        finally { $sourceBitmap.Dispose() }
        $normalizedPath = Join-Path $normalizedRoot ("{0}-{1:D2}.png" -f $clip.state.Replace('_','-'), $probe.index)
        $metrics = [LamuhDashBlockFrameTools]::NormalizeFrame(
            $probe.sourcePath,
            $normalizedPath,
            $fixedSourceRootX,
            $commonSourceBaseline,
            $targetRoot.x,
            $targetRoot.y,
            2048,
            1536,
            $sequenceScale,
            $false
        )
        $frames += [ordered]@{
            state = $clip.state
            index = $probe.index
            role = $clip.roles[$probe.index]
            legacyIndex = $probe.index
            legacyPath = (Resolve-Path -LiteralPath $probe.legacyPath).Path.Substring($RepoRoot.Length + 1).Replace('\','/')
            legacySha256 = Get-Sha256 -LiteralPath $probe.legacyPath
            sourcePath = (Resolve-Path -LiteralPath $probe.sourcePath).Path.Substring($RepoRoot.Length + 1).Replace('\','/')
            sourceSha256 = Get-Sha256 -LiteralPath $probe.sourcePath
            normalizedPath = (Resolve-Path -LiteralPath $normalizedPath).Path.Substring($RepoRoot.Length + 1).Replace('\','/')
            normalizedSha256 = Get-Sha256 -LiteralPath $normalizedPath
            sourceScaleCorrection = $sequenceScale
            sourceRoot = [ordered]@{ x = [math]::Round($fixedSourceRootX,2); y = $commonSourceBaseline }
            normalizedRoot = $targetRoot
            rootMapping = 'fixed source-cell root and common sequence baseline to fixed authored runtime root'
            desiredVisibleHeight = [math]::Round($probe.desiredHeight,2)
            visibleBounds = [ordered]@{ minX=$metrics.MinX; minY=$metrics.MinY; maxX=$metrics.MaxX; maxY=$metrics.MaxY }
            bodyCenter = [ordered]@{ x=[math]::Round($metrics.CentroidX,2); y=[math]::Round($metrics.CentroidY,2) }
            visiblePixels = $metrics.VisiblePixels
            backgroundPixelsRemoved = $probe.extractMetrics.BackgroundPixelsRemoved
            magentaPixelsNeutralized = $probe.extractMetrics.MagentaPixelsNeutralized + $metrics.MagentaPixelsNeutralized
            redArtifactPixelsRemoved = $probe.extractMetrics.RedArtifactPixelsRemoved + $metrics.RedArtifactPixelsRemoved
            distantComponentPixelsRemoved = $probe.extractMetrics.DistantComponentPixelsRemoved + $metrics.DistantComponentPixelsRemoved
            meaningfulMagentaPixelsRemaining = $metrics.MeaningfulMagentaPixelsRemaining
            redArtifactPixelsRemaining = $metrics.RedArtifactPixelsRemaining
            touchesEdge = $metrics.TouchesEdge
        }
    }

    $clipFrames = @($frames | Where-Object { $_['state'] -eq $clip.state } | Sort-Object { $_['index'] })
    $contactSheetPath = Join-Path $reviewRoot ("{0}-numbered-contact-sheet.png" -f $clip.state.Replace('_','-'))
    [LamuhDashBlockFrameTools]::MakeContactSheet(
        @($clipFrames | ForEach-Object { Join-Path $RepoRoot $_.normalizedPath }),
        @($clipFrames | ForEach-Object { "{0} {1:D2} | {2}" -f $_.state.Replace('_',' '), $_.index, $_.role.Replace('_',' ') }),
        $contactSheetPath,
        $clip.frameCount
    )
    $contactSheets[$clip.state] = [ordered]@{
        path = (Resolve-Path -LiteralPath $contactSheetPath).Path.Substring($RepoRoot.Length + 1).Replace('\','/')
        sha256 = Get-Sha256 -LiteralPath $contactSheetPath
        fixedRoot = $true
        numbered = $true
    }
    $states[$clip.state] = [ordered]@{
        sourceFrameCount = $clip.frameCount
        authoredFrameCount = $clip.frameCount
        selectedLegacyFrames = @(0..($clip.frameCount - 1))
        exposureTicks = $clip.exposure
        durationTicks = ($clip.exposure | Measure-Object -Sum).Sum
        loop = $clip.loop
        sourceScaleCorrection = $sequenceScale
        commonSourceBaseline = $commonSourceBaseline
        motionDirection = $clip.motionDirection
    }
}

if ($frames.Count -ne 11) { throw "Expected 11 backward-motion repair frames, found $($frames.Count)." }
if (($frames.normalizedSha256 | Select-Object -Unique).Count -ne 11) { throw 'Backward-motion repair contains an undeclared duplicate.' }
if ($frames.touchesEdge -contains $true) { throw 'A normalized backward-motion repair frame touches the runtime canvas edge.' }
$remainingMagenta = ($frames.meaningfulMagentaPixelsRemaining | Measure-Object -Sum).Sum
$remainingRed = ($frames.redArtifactPixelsRemaining | Measure-Object -Sum).Sum
if ($remainingMagenta -ne 0) { throw "Meaningful magenta remains in backward-motion repair: $remainingMagenta pixels." }
if ($remainingRed -ne 0) { throw "Bright red fringe remains in backward-motion repair: $remainingRed pixels." }

$report = [ordered]@{
    schemaVersion = '1.0.0'
    subject = 'lamuh_legacy_v2.walk_backward_dash_backward.directional_motion_repair.candidate.v1'
    status = 'candidate-only'
    candidateOnly = $true
    deployable = $false
    productionApproved = $false
    authoredFrameCount = $frames.Count
    canvas = [ordered]@{ width=2048; height=1536 }
    fixedRoot = $targetRoot
    targetModernIdleVisibleHeight = $targetIdleHeight
    measuredModernIdleVisibleHeight = $modernIdleBounds.Height
    sourceSheets = $sourceSheets
    states = $states
    normalization = [ordered]@{
        sequenceWideScalePerSourceSheet = $true
        perFrameRendererScale = $false
        visualRecentering = $false
        rootPolicy = 'fixed source-cell root and common sequence baseline to fixed authored runtime root'
        backgroundRemoval = 'edge-connected chroma green or neutral checkerboard to alpha'
        purplePolicy = 'replace meaningful magenta with neutral dark ink'
        alphaZeroRgbCleared = $true
    }
    visualValidation = [ordered]@{
        meaningfulMagentaPixelsRemaining = $remainingMagenta
        redArtifactPixelsRemaining = $remainingRed
        edgeTouches = ($frames.touchesEdge | Where-Object { $_ }).Count
        fixedRoot = $true
        fixedRendererScale = $true
        distinctFrameCount = ($frames.normalizedSha256 | Select-Object -Unique).Count
    }
    sourceRepairReason = 'Walk Back now shows guarded rearward stepping and weight transfer; Back Dash now shows recoil, backward takeoff, airborne retreat, landing catch, and planted brake. Simulation timing and world travel remain unchanged.'
    reviewArtifacts = [ordered]@{ numberedContactSheets = $contactSheets }
    frames = $frames
}

$reportPath = Join-Path $reviewRoot 'normalization.report.json'
$report | ConvertTo-Json -Depth 16 | Set-Content -LiteralPath $reportPath -Encoding utf8
Write-Output "Normalized $($frames.Count) Lamuh Walk Back and Back Dash directional repair frames."
