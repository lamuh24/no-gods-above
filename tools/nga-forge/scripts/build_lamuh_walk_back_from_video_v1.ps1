param(
    [string]$RepoRoot = (Resolve-Path (Join-Path $PSScriptRoot '..\..\..')).Path
)

$ErrorActionPreference = 'Stop'
. (Join-Path $PSScriptRoot 'normalize_lamuh_dash_block_modernization_v1.ps1') -RepoRoot $RepoRoot -LibraryOnly

function Get-Sha256 {
    param([Parameter(Mandatory = $true)][string]$LiteralPath)
    return (Get-FileHash -LiteralPath $LiteralPath -Algorithm SHA256).Hash
}

$movementReviewRoot = Join-Path $RepoRoot 'tools\nga-forge\review\lamuh-legacy-v2-movement-modernization-v1'
$movementReportPath = Join-Path $movementReviewRoot 'normalization.report.json'
$reviewRoot = Join-Path $RepoRoot 'tools\nga-forge\review\lamuh-legacy-v2-walk-back-video-rebuild-v1'
$sourceRoot = Join-Path $reviewRoot 'source-frames'
$normalizedRoot = Join-Path $reviewRoot 'normalized'
$sourceVideoPath = Join-Path $RepoRoot 'tools\nga-forge\review\lamuh-legacy-v2-forward-walk-video-v1\source\lamuh-forward-walk-user-reference-20260827.mp4'
$expectedVideoSha256 = 'C3D745562609834CEB3FF3DA63047874B0A068688A104EDBF39CB67CACAB0E40'
$forwardIndices = @(6,5,4,3,2,1,0)
$roles = @('reverse_cycle_entry','rearward_step_commit','rearward_weight_transfer','rear_foot_contact','opposite_passing','opposite_departure','loop_close_grounded')
$exposures = @(3,3,2,3,2,2,3)

if (-not (Test-Path -LiteralPath $movementReportPath)) { throw "Missing movement normalization report: $movementReportPath" }
if (-not (Test-Path -LiteralPath $sourceVideoPath)) { throw "Missing protected user walking video: $sourceVideoPath" }
if ((Get-Sha256 -LiteralPath $sourceVideoPath) -ne $expectedVideoSha256) { throw 'Protected user walking video hash changed.' }

$movementReport = Get-Content -Raw -LiteralPath $movementReportPath | ConvertFrom-Json
if ($movementReport.sourceVideo.sha256 -ne $expectedVideoSha256) { throw 'Movement report video provenance drifted.' }
New-Item -ItemType Directory -Force -Path $sourceRoot, $normalizedRoot | Out-Null

$frames = @()
$contactPaths = @()
$contactLabels = @()
for ($index = 0; $index -lt $forwardIndices.Count; $index++) {
    $forwardIndex = $forwardIndices[$index]
    $forwardFrame = @($movementReport.frames | Where-Object { $_.state -eq 'walk_forward' -and $_.index -eq $forwardIndex })
    if ($forwardFrame.Count -ne 1) { throw "Expected one video-derived forward frame at index $forwardIndex, found $($forwardFrame.Count)." }
    $forwardFrame = $forwardFrame[0]
    if ($forwardFrame.sourceType -ne 'user_video') { throw "Forward frame $forwardIndex is not video-derived." }

    $rawSource = Join-Path $RepoRoot $forwardFrame.rawPath
    $normalizedSource = Join-Path $RepoRoot $forwardFrame.normalizedPath
    if ((Get-Sha256 -LiteralPath $rawSource) -ne $forwardFrame.rawSha256) { throw "Raw video frame hash changed: $forwardIndex" }
    if ((Get-Sha256 -LiteralPath $normalizedSource) -ne $forwardFrame.normalizedSha256) { throw "Normalized video frame hash changed: $forwardIndex" }

    $rawDestination = Join-Path $sourceRoot ("walk-backward-video-{0:D2}.png" -f $index)
    $normalizedDestination = Join-Path $normalizedRoot ("walk-backward-{0:D2}.png" -f $index)
    Copy-Item -LiteralPath $rawSource -Destination $rawDestination -Force
    Copy-Item -LiteralPath $normalizedSource -Destination $normalizedDestination -Force
    $metrics = [LamuhDashBlockFrameTools]::Measure($normalizedDestination)
    if ($metrics.TouchesEdge) { throw "Video-derived Walk Back frame touches an edge: $index" }
    if ($metrics.MeaningfulMagentaPixelsRemaining -ne 0) { throw "Video-derived Walk Back frame retains magenta: $index" }

    $frames += [ordered]@{
        state = 'walk_backward'
        index = $index
        role = $roles[$index]
        sourceType = 'user_video_reversed_cycle'
        sourceForwardIndex = $forwardIndex
        sourceFrameIndex = $forwardFrame.sourceFrameIndex
        sourceVideoPath = $movementReport.sourceVideo.path
        sourceVideoSha256 = $expectedVideoSha256
        rawPath = (Resolve-Path -LiteralPath $rawDestination).Path.Substring($RepoRoot.Length + 1).Replace('\','/')
        rawSha256 = Get-Sha256 -LiteralPath $rawDestination
        normalizedPath = (Resolve-Path -LiteralPath $normalizedDestination).Path.Substring($RepoRoot.Length + 1).Replace('\','/')
        normalizedSha256 = Get-Sha256 -LiteralPath $normalizedDestination
        root = [ordered]@{ x=768; y=1360 }
        sourceScaleCorrection = $forwardFrame.sourceScaleCorrection
        bodyScaleCorrection = 1
        visibleBounds = [ordered]@{ minX=$metrics.MinX; minY=$metrics.MinY; maxX=$metrics.MaxX; maxY=$metrics.MaxY }
        bodyCenter = [ordered]@{ x=[math]::Round($metrics.CentroidX,2); y=[math]::Round($metrics.CentroidY,2) }
        visiblePixels = $metrics.VisiblePixels
        meaningfulMagentaPixelsRemaining = $metrics.MeaningfulMagentaPixelsRemaining
        touchesEdge = $metrics.TouchesEdge
    }
    $contactPaths += $normalizedDestination
    $contactLabels += ("walk backward {0:D2} | video frame {1} | {2}" -f $index, $forwardFrame.sourceFrameIndex, $roles[$index].Replace('_',' '))
}

if (($frames.normalizedSha256 | Select-Object -Unique).Count -ne $frames.Count) { throw 'Video-derived Walk Back contains an undeclared duplicate.' }
if (($frames.sourceScaleCorrection | Select-Object -Unique).Count -ne 1) { throw 'Video-derived Walk Back lost its one-sequence scale.' }
if (($exposures | Measure-Object -Sum).Sum -ne 18) { throw 'Video-derived Walk Back timing no longer totals 18 ticks.' }

$contactSheetPath = Join-Path $reviewRoot 'walk-backward-video-numbered-contact-sheet.png'
[LamuhDashBlockFrameTools]::MakeContactSheet([string[]]$contactPaths, [string[]]$contactLabels, $contactSheetPath, $frames.Count)

$report = [ordered]@{
    schemaVersion = '1.0.0'
    subject = 'lamuh_legacy_v2.walk_backward.user_video_reversed_cycle.candidate.v1'
    status = 'candidate-only'
    candidateOnly = $true
    deployable = $false
    productionApproved = $false
    sourceVideo = [ordered]@{
        path = $movementReport.sourceVideo.path
        sha256 = $expectedVideoSha256
        frameRate = $movementReport.sourceVideo.frameRate
        durationSeconds = $movementReport.sourceVideo.durationSeconds
        sourceFrameCount = $movementReport.sourceVideo.sourceFrameCount
    }
    selection = [ordered]@{
        sourceForwardIndices = $forwardIndices
        sourceVideoFrames = @($frames.sourceFrameIndex)
        policy = 'reuse first complete video-derived forward gait cycle in reverse chronological order'
        reversedPlayback = $true
        generatedArtwork = $false
    }
    state = [ordered]@{
        sourceFrameCount = $movementReport.sourceVideo.sourceFrameCount
        authoredFrameCount = $frames.Count
        selectedSourceFrames = @($frames.sourceFrameIndex)
        exposureTicks = $exposures
        durationTicks = 18
        loop = $true
        simulationTravelChanged = $false
        gameplayTimingChanged = $false
    }
    canvas = [ordered]@{ width=2048; height=1536 }
    root = [ordered]@{ x=768; y=1360 }
    perFrameRescale = $false
    visualRecentering = $false
    oneSequenceScale = $true
    visualValidation = [ordered]@{
        distinctFrameCount = ($frames.normalizedSha256 | Select-Object -Unique).Count
        meaningfulMagentaPixelsRemaining = ($frames.meaningfulMagentaPixelsRemaining | Measure-Object -Sum).Sum
        edgeTouches = ($frames.touchesEdge | Where-Object { $_ }).Count
        fixedRoot = $true
    }
    contactSheet = [ordered]@{
        path = (Resolve-Path -LiteralPath $contactSheetPath).Path.Substring($RepoRoot.Length + 1).Replace('\','/')
        sha256 = Get-Sha256 -LiteralPath $contactSheetPath
        numbered = $true
        fixedRoot = $true
    }
    supersedes = 'generated Walk Back directional candidate only; Back Dash repair remains active'
    frames = $frames
}

$reportPath = Join-Path $reviewRoot 'normalization.report.json'
$report | ConvertTo-Json -Depth 16 | Set-Content -LiteralPath $reportPath -Encoding utf8
Write-Output "Built $($frames.Count)-frame Lamuh Walk Back directly from the user walking video cycle."
