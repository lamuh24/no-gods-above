param(
    [string]$RepoRoot = (Resolve-Path (Join-Path $PSScriptRoot '..\..\..')).Path
)

$ErrorActionPreference = 'Stop'
Add-Type -AssemblyName System.Drawing

function Get-Sha256 {
    param([Parameter(Mandatory = $true)][string]$LiteralPath)
    $stream = [System.IO.File]::OpenRead((Resolve-Path -LiteralPath $LiteralPath).Path)
    try {
        $algorithm = [System.Security.Cryptography.SHA256]::Create()
        try { return ([System.BitConverter]::ToString($algorithm.ComputeHash($stream))).Replace('-', '') }
        finally { $algorithm.Dispose() }
    }
    finally { $stream.Dispose() }
}

. (Join-Path $PSScriptRoot 'normalize_lamuh_dash_block_modernization_v1.ps1') -RepoRoot $RepoRoot -LibraryOnly

$reviewRoot = Join-Path $RepoRoot 'tools\nga-forge\review\lamuh-legacy-v2-ascend-step-modernization-v1'
$rawPath = Join-Path $reviewRoot 'raw\ascend-step-strip-v1.png'
$extractedRoot = Join-Path $reviewRoot 'extracted'
$normalizedRoot = Join-Path $reviewRoot 'normalized'
New-Item -ItemType Directory -Force -Path $extractedRoot, $normalizedRoot | Out-Null

if (-not (Test-Path -LiteralPath $rawPath)) { throw "Missing Ascend Step generated strip: $rawPath" }

$roles = @(
    'low_forward_coil',
    'stronger_forward_drive',
    'fast_horizontal_burst',
    'compact_rising_contact',
    'airborne_palm_follow_through',
    'extended_airborne_strike',
    'controlled_grounded_recovery'
)
$legacyFramePaths = @(0..6 | ForEach-Object {
    Join-Path $RepoRoot ('NO_GODS_ABOVE\engine_v2\content-source\characters\lamuh-legacy-v2\source-frames\ascend_step\ascend_step_{0:d2}.png' -f $_)
})
$exposureTicks = @(3, 2, 1, 6, 5, 6, 7)
$targetRoot = [ordered]@{ x = 768; y = 1360 }
$sequenceScale = 2.92
$sourceRootY = 535
$frames = @()

for ($index = 0; $index -lt 7; $index++) {
    $extractedPath = Join-Path $extractedRoot ('ascend-step-cell-{0:d2}.png' -f $index)
    $extractMetrics = [LamuhDashBlockFrameTools]::ExtractCell($rawPath, $extractedPath, $index, 7)
    $extractedImage = [System.Drawing.Image]::FromFile($extractedPath)
    try { $sourceRootX = $extractedImage.Width / 2.0 }
    finally { $extractedImage.Dispose() }

    $normalizedPath = Join-Path $normalizedRoot ('ascend-step-{0:d2}.png' -f $index)
    $metrics = [LamuhDashBlockFrameTools]::NormalizeFrame($extractedPath, $normalizedPath, $sourceRootX, $sourceRootY, $targetRoot.x, $targetRoot.y, 2048, 1536, $sequenceScale, $false)
    if ($metrics.VisiblePixels -le 0) { throw "Ascend Step frame $index is empty after normalization." }
    if ($metrics.TouchesEdge) { throw "Ascend Step frame $index touches the 2048 x 1536 canvas edge." }
    if ($metrics.MeaningfulMagentaPixelsRemaining -ne 0) { throw "Ascend Step frame $index retains purple/magenta outline pixels." }
    if ($metrics.RedArtifactPixelsRemaining -ne 0) { throw "Ascend Step frame $index retains bright red artifact pixels." }

    $frames += [ordered]@{
        index = $index
        role = $roles[$index]
        legacySourcePath = (Resolve-Path -LiteralPath $legacyFramePaths[$index]).Path.Substring($RepoRoot.Length + 1).Replace('\', '/')
        legacySourceSha256 = Get-Sha256 -LiteralPath $legacyFramePaths[$index]
        rawPath = (Resolve-Path -LiteralPath $rawPath).Path.Substring($RepoRoot.Length + 1).Replace('\', '/')
        rawSha256 = Get-Sha256 -LiteralPath $rawPath
        extractedPath = (Resolve-Path -LiteralPath $extractedPath).Path.Substring($RepoRoot.Length + 1).Replace('\', '/')
        extractedSha256 = Get-Sha256 -LiteralPath $extractedPath
        normalizedPath = (Resolve-Path -LiteralPath $normalizedPath).Path.Substring($RepoRoot.Length + 1).Replace('\', '/')
        normalizedSha256 = Get-Sha256 -LiteralPath $normalizedPath
        authoredSourceRoot = [ordered]@{ x = [math]::Round($sourceRootX, 2); y = $sourceRootY }
        normalizedRoot = $targetRoot
        visibleBounds = [ordered]@{ minX = $metrics.MinX; minY = $metrics.MinY; maxX = $metrics.MaxX; maxY = $metrics.MaxY }
        visualCentroid = [ordered]@{ x = [math]::Round($metrics.CentroidX, 2); y = [math]::Round($metrics.CentroidY, 2) }
        visiblePixels = $metrics.VisiblePixels
        backgroundPixelsRemoved = $extractMetrics.BackgroundPixelsRemoved
        distantComponentPixelsRemoved = $extractMetrics.DistantComponentPixelsRemoved + $metrics.DistantComponentPixelsRemoved
        magentaPixelsNeutralized = $extractMetrics.MagentaPixelsNeutralized + $metrics.MagentaPixelsNeutralized
        redArtifactPixelsRemoved = $extractMetrics.RedArtifactPixelsRemoved + $metrics.RedArtifactPixelsRemoved
        meaningfulMagentaPixelsRemaining = $metrics.MeaningfulMagentaPixelsRemaining
        redArtifactPixelsRemaining = $metrics.RedArtifactPixelsRemaining
        touchesEdge = $metrics.TouchesEdge
    }
}

if (($frames.normalizedSha256 | Select-Object -Unique).Count -ne 7) { throw 'Ascend Step contains duplicate normalized frames.' }
if (($exposureTicks | Measure-Object -Sum).Sum -ne 30) { throw 'Ascend Step recommended exposure total drifted from 30 ticks.' }

$contactSheetPath = Join-Path $reviewRoot 'ascend-step-numbered-contact-sheet.png'
$board = New-Object System.Drawing.Bitmap 2470, 590
$graphics = [System.Drawing.Graphics]::FromImage($board)
$titleFont = New-Object System.Drawing.Font('Segoe UI', 18, [System.Drawing.FontStyle]::Bold)
$labelFont = New-Object System.Drawing.Font('Segoe UI', 9, [System.Drawing.FontStyle]::Bold)
$noteFont = New-Object System.Drawing.Font('Segoe UI', 9, [System.Drawing.FontStyle]::Regular)
$panelPen = New-Object System.Drawing.Pen([System.Drawing.Color]::FromArgb(110, 255, 255, 255), 1)
$rootPen = New-Object System.Drawing.Pen([System.Drawing.Color]::FromArgb(230, 255, 224, 138), 2)
try {
    $graphics.Clear([System.Drawing.Color]::FromArgb(255, 6, 11, 17))
    $graphics.DrawString('LAMUH LEGACY V2 - ASCEND STEP - PRESERVED MOTION / MODERN STYLE', $titleFont, [System.Drawing.Brushes]::Goldenrod, 20, 14)
    $graphics.DrawString('Seven distinct poses - one sequence scale - fixed authored root - V1 order preserved - candidate only', $noteFont, [System.Drawing.Brushes]::LightGray, 22, 48)
    foreach ($frame in $frames) {
        $panelX = 14 + $frame.index * 350
        $panelY = 74
        $panelRectangle = New-Object System.Drawing.Rectangle $panelX, $panelY, 338, 500
        $graphics.DrawRectangle($panelPen, $panelRectangle)
        $image = [System.Drawing.Image]::FromFile((Join-Path $RepoRoot $frame.normalizedPath.Replace('/', '\')))
        try { $graphics.DrawImage($image, $panelX + 7, $panelY + 32, 324, 456) }
        finally { $image.Dispose() }
        $graphics.DrawString(('{0:d2} {1} | {2} ticks' -f $frame.index, $frame.role.Replace('_', ' '), $exposureTicks[$frame.index]), $labelFont, [System.Drawing.Brushes]::White, $panelX + 8, $panelY + 8)
        $rootX = $panelX + 7 + [math]::Round(($targetRoot.x / 2048) * 324)
        $rootY = $panelY + 32 + [math]::Round(($targetRoot.y / 1536) * 456)
        $graphics.DrawLine($rootPen, $rootX - 5, $rootY, $rootX + 5, $rootY)
        $graphics.DrawLine($rootPen, $rootX, $rootY - 5, $rootX, $rootY + 5)
    }
    $board.Save($contactSheetPath, [System.Drawing.Imaging.ImageFormat]::Png)
}
finally {
    $rootPen.Dispose(); $panelPen.Dispose(); $noteFont.Dispose(); $labelFont.Dispose(); $titleFont.Dispose(); $graphics.Dispose(); $board.Dispose()
}

$recoveryHeight = $frames[6].visibleBounds.maxY - $frames[6].visibleBounds.minY + 1
$report = [ordered]@{
    schemaVersion = '1.0.0'
    subject = 'lamuh_legacy_v2.ascend_step.motion_preserved_modern_style.candidate.v1'
    status = 'awaiting_human_ascend_step_motion_timing_transition_and_combat_profile_review'
    candidateOnly = $true
    deployable = $false
    generatedWith = 'OpenAI built-in image generation style-transfer from protected V1 motion and approved Lamuh V2 identity references'
    sourceFrameCount = 7
    authoredFrameCount = 7
    contactFrame = 3
    visibleImpactCount = 1
    timing = [ordered]@{ recommendedCandidate = 'B'; exposureTicks = $exposureTicks; totalTicks = 30; gameplayAligned = $true }
    normalization = [ordered]@{
        canvas = [ordered]@{ width = 2048; height = 1536 }
        normalizedRoot = $targetRoot
        sequenceWideScale = $sequenceScale
        sourceRootY = $sourceRootY
        perFrameRendererScale = $false
        visualRecentering = $false
        placementPolicy = 'fixed_cell_center_and_shared_semantic_root_preserving_in_pose_momentum_while_simulation_owns_travel'
        backgroundRemoval = 'edge_connected_neutral_checkerboard_to_alpha'
        purpleOutlinePolicy = 'no_meaningful_magenta_pixels'
        alphaZeroRgbCleared = $true
    }
    identityLock = [ordered]@{
        matureAdultProportions = $true
        noChibiProportions = $true
        boxedBeardAndMustache = $true
        longBlackLocs = $true
        whiteGoldCoatBlackClothingCyanSash = $true
        noPurpleOutline = $true
        sameSequenceScale = $true
    }
    motionPreservation = [ordered]@{
        protectedLegacyFramesModified = $false
        sourceOrderPreserved = $true
        strikingActionPreserved = $true
        poseProgression = @('low forward coil', 'stronger forward drive', 'fast horizontal burst', 'compact rising contact', 'airborne palm follow-through', 'extended airborne strike', 'controlled grounded recovery')
        explicitRootMotionOwner = 'deterministic simulation legacy_ascend_step rootMotion ticks 4-15 at velocity 9.2'
    }
    vfxBoundary = [ordered]@{
        inherentAttackAuraInBodyFrames = $true
        separateHitSparkAuthored = $false
        layerSeparationStatus = 'DEFERRED_NOT_BLOCKING_FOR_MOTION_REVIEW'
    }
    frames = $frames
    contactSheet = [ordered]@{ path = (Resolve-Path -LiteralPath $contactSheetPath).Path.Substring($RepoRoot.Length + 1).Replace('\', '/'); sha256 = Get-Sha256 -LiteralPath $contactSheetPath }
    validation = [ordered]@{
        exactFrameCount = $frames.Count -eq 7
        distinctFrameHashes = ($frames.normalizedSha256 | Select-Object -Unique).Count -eq 7
        fixedRoot = $targetRoot
        singleSequenceScale = $sequenceScale
        idleReferenceHeight = 800
        groundedRecoveryHeight = $recoveryHeight
        groundedRecoveryHeightDeltaPct = [math]::Round(([math]::Abs($recoveryHeight - 800) / 800) * 100, 2)
        meaningfulMagentaPixelsRemaining = ($frames.meaningfulMagentaPixelsRemaining | Measure-Object -Sum).Sum
        redArtifactPixelsRemaining = ($frames.redArtifactPixelsRemaining | Measure-Object -Sum).Sum
        touchesEdge = $frames.touchesEdge -contains $true
        exposureCoverageTicks = ($exposureTicks | Measure-Object -Sum).Sum
        runtimeTravelChanged = $false
        combatValuesChanged = $false
        adultProportionVisualAudit = 'PASS_CANDIDATE_INTERNAL_REVIEW'
        compactFramesUsePoseCompressionNotPerFrameScale = $true
    }
    approvalBoundary = [ordered]@{
        throwFamilyApproved = $true
        adultProportionHumanReviewRequired = $true
        ascendStepMotionApproved = $false
        ascendStepTimingApproved = $false
        ascendStepCombatProfileApproved = $false
        runtimeArtPromotionApproved = $false
        productionApproved = $false
        deployable = $false
    }
}

$reportPath = Join-Path $reviewRoot 'normalization.report.json'
$report | ConvertTo-Json -Depth 14 | Set-Content -LiteralPath $reportPath -Encoding utf8
Write-Output "Normalized $($frames.Count) Ascend Step candidate frames at one sequence scale."
Write-Output "Report: $reportPath"
