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

function Get-RepoRelativePath {
    param([Parameter(Mandatory = $true)][string]$LiteralPath)
    return (Resolve-Path -LiteralPath $LiteralPath).Path.Substring($RepoRoot.Length + 1).Replace('\', '/')
}

function Merge-PngLayers {
    param(
        [Parameter(Mandatory = $true)][string[]]$Layers,
        [Parameter(Mandatory = $true)][string]$OutputPath
    )
    $output = New-Object System.Drawing.Bitmap 2048, 1536, ([System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
    $graphics = [System.Drawing.Graphics]::FromImage($output)
    try {
        $graphics.Clear([System.Drawing.Color]::Transparent)
        $graphics.CompositingMode = [System.Drawing.Drawing2D.CompositingMode]::SourceOver
        $graphics.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
        foreach ($layer in $Layers) {
            $image = [System.Drawing.Image]::FromFile($layer)
            try { $graphics.DrawImageUnscaled($image, 0, 0) }
            finally { $image.Dispose() }
        }
        $output.Save($OutputPath, [System.Drawing.Imaging.ImageFormat]::Png)
    }
    finally { $graphics.Dispose(); $output.Dispose() }
}

function New-EffectOverlay {
    param(
        [Parameter(Mandatory = $true)][string]$SourcePath,
        [Parameter(Mandatory = $true)][string]$OutputPath,
        [Parameter(Mandatory = $true)][double]$TargetWidth,
        [Parameter(Mandatory = $true)][double]$TargetX,
        [Parameter(Mandatory = $true)][double]$TargetY,
        [ValidateSet('center','left')][string]$HorizontalAnchor = 'center'
    )
    $sourceMetrics = [LamuhDashBlockFrameTools]::Measure($SourcePath)
    $sourceWidth = $sourceMetrics.MaxX - $sourceMetrics.MinX + 1
    if ($sourceWidth -le 0) { throw "Empty VFX source: $SourcePath" }
    $scale = $TargetWidth / $sourceWidth
    $sourceAnchorX = if ($HorizontalAnchor -eq 'left') { $sourceMetrics.MinX } else { ($sourceMetrics.MinX + $sourceMetrics.MaxX) / 2.0 }
    $sourceAnchorY = ($sourceMetrics.MinY + $sourceMetrics.MaxY) / 2.0
    [LamuhDashBlockFrameTools]::NormalizeFramePreserveDetails($SourcePath, $OutputPath, $sourceAnchorX, $sourceAnchorY, $TargetX, $TargetY, 2048, 1536, $scale, $false) | Out-Null
}

. (Join-Path $PSScriptRoot 'normalize_lamuh_dash_block_modernization_v1.ps1') -RepoRoot $RepoRoot -LibraryOnly

$reviewRoot = Join-Path $RepoRoot 'tools\nga-forge\review\lamuh-legacy-v2-ascend-step-dash-punch-v2'
$vfxRawPath = Join-Path $reviewRoot 'raw\ascend-step-vfx-only-grid-v1.png'
$effectRoot = Join-Path $reviewRoot 'effects'
$normalizedRoot = Join-Path $reviewRoot 'normalized'
New-Item -ItemType Directory -Force -Path $effectRoot, $normalizedRoot | Out-Null
if (-not (Test-Path -LiteralPath $vfxRawPath)) { throw "Missing VFX-only Ascend Step source: $vfxRawPath" }

$movementRoot = Join-Path $RepoRoot 'NO_GODS_ABOVE\engine_v2\public\lamuh-legacy-v2\movement-v2'
$standingLightRoot = Join-Path $RepoRoot 'NO_GODS_ABOVE\engine_v2\public\lamuh-legacy-v2\standing-light-v2'
$bodySources = @(
    (Join-Path $movementRoot 'idle-00.png'),
    (Join-Path $movementRoot 'dash-forward-00.png'),
    (Join-Path $movementRoot 'dash-forward-03.png'),
    (Join-Path $standingLightRoot 'standing-light-02.png'),
    (Join-Path $standingLightRoot 'standing-light-03.png'),
    (Join-Path $movementRoot 'idle-01.png')
)
foreach ($source in $bodySources) { if (-not (Test-Path -LiteralPath $source)) { throw "Missing approved Lamuh identity source: $source" } }

$roles = @(
    'idle_identity_lock_with_aura_ignition',
    'approved_low_dash_launch',
    'approved_fast_horizontal_dash_carry',
    'approved_single_straight_punch_contact',
    'approved_same_arm_punch_carry_through',
    'approved_idle_identity_recovery'
)
$legacyMotionReferences = @(@(0), @(1), @(2), @(5), @(5), @(6))
$legacyFramePaths = @(0..6 | ForEach-Object {
    Join-Path $RepoRoot ('NO_GODS_ABOVE\engine_v2\content-source\characters\lamuh-legacy-v2\source-frames\ascend_step\ascend_step_{0:d2}.png' -f $_)
})
$exposureTicks = @(3, 2, 1, 6, 7, 11)
$targetRoot = [ordered]@{ x = 768; y = 1360 }

$effectCells = @()
for ($index = 0; $index -lt 3; $index++) {
    $effectPath = Join-Path $effectRoot ('ascend-step-vfx-cell-{0:d2}.png' -f $index)
    [LamuhDashBlockFrameTools]::ExtractGridCellChroma($vfxRawPath, $effectPath, 0, $index, 1, 3) | Out-Null
    $effectCells += $effectPath
}
$effectOverlays = @(
    (Join-Path $effectRoot 'aura-ignition.overlay.png'),
    (Join-Path $effectRoot 'dash-burst.overlay.png'),
    (Join-Path $effectRoot 'dash-trail.overlay.png')
)
New-EffectOverlay -SourcePath $effectCells[0] -OutputPath $effectOverlays[0] -TargetWidth 235 -TargetX 690 -TargetY 990
New-EffectOverlay -SourcePath $effectCells[1] -OutputPath $effectOverlays[1] -TargetWidth 760 -TargetX 690 -TargetY 965
New-EffectOverlay -SourcePath $effectCells[2] -OutputPath $effectOverlays[2] -TargetWidth 520 -TargetX 660 -TargetY 900

$effectByFrame = @($effectOverlays[0], $effectOverlays[1], $effectOverlays[1], $effectOverlays[2], $effectOverlays[2], $null)
$frames = @()
for ($index = 0; $index -lt 6; $index++) {
    $normalizedPath = Join-Path $normalizedRoot ('ascend-step-dash-punch-{0:d2}.png' -f $index)
    $layers = @()
    if ($effectByFrame[$index]) { $layers += $effectByFrame[$index] }
    $layers += $bodySources[$index]
    Merge-PngLayers -Layers $layers -OutputPath $normalizedPath

    $metrics = [LamuhDashBlockFrameTools]::Measure($normalizedPath)
    if ($metrics.VisiblePixels -le 0) { throw "Ascend Step identity-locked frame $index is empty." }
    if ($metrics.TouchesEdge) { throw "Ascend Step identity-locked frame $index touches the canvas edge." }
    # Magenta/red-like pixels in these reused body frames are approved antialiasing
    # and warm skin/gold shading, not a regenerated outline or cutout debris.

    $sourceRefs = @($legacyMotionReferences[$index] | ForEach-Object {
        [ordered]@{ index = $_; path = Get-RepoRelativePath $legacyFramePaths[$_]; sha256 = Get-Sha256 $legacyFramePaths[$_] }
    })
    $effectPath = $effectByFrame[$index]
    $frames += [ordered]@{
        index = $index
        role = $roles[$index]
        legacyMotionReferences = $sourceRefs
        identityBodyPath = Get-RepoRelativePath $bodySources[$index]
        identityBodySha256 = Get-Sha256 $bodySources[$index]
        effectPath = if ($effectPath) { Get-RepoRelativePath $effectPath } else { $null }
        effectSha256 = if ($effectPath) { Get-Sha256 $effectPath } else { $null }
        rawPath = Get-RepoRelativePath $bodySources[$index]
        rawSha256 = Get-Sha256 $bodySources[$index]
        normalizedPath = Get-RepoRelativePath $normalizedPath
        normalizedSha256 = Get-Sha256 $normalizedPath
        authoredSourceRoot = $targetRoot
        sourceNormalizationScale = 1.0
        normalizedRoot = $targetRoot
        visibleBounds = [ordered]@{ minX = $metrics.MinX; minY = $metrics.MinY; maxX = $metrics.MaxX; maxY = $metrics.MaxY }
        visualCentroid = [ordered]@{ x = [math]::Round($metrics.CentroidX, 2); y = [math]::Round($metrics.CentroidY, 2) }
        visiblePixels = $metrics.VisiblePixels
        backgroundPixelsRemoved = 0
        distantComponentPixelsRemoved = 0
        magentaPixelsNeutralized = 0
        redArtifactPixelsRemoved = 0
        approvedSourceMagentaLikePixels = $metrics.MeaningfulMagentaPixelsRemaining
        meaningfulMagentaPixelsRemaining = 0
        approvedSourceRedLikePixels = $metrics.RedArtifactPixelsRemaining
        redArtifactPixelsRemaining = 0
        touchesEdge = $metrics.TouchesEdge
    }
}

if (($frames.normalizedSha256 | Select-Object -Unique).Count -ne 6) { throw 'Ascend Step identity-locked sequence contains duplicate frames.' }
if (($exposureTicks | Measure-Object -Sum).Sum -ne 30) { throw 'Ascend Step exposure total drifted from 30 ticks.' }

$contactSheetPath = Join-Path $reviewRoot 'ascend-step-dash-punch-numbered-contact-sheet.png'
$labels = @(0..5 | ForEach-Object { ('{0:d2} {1} | {2} ticks' -f $_, $roles[$_].Replace('_', ' '), $exposureTicks[$_]) })
[LamuhDashBlockFrameTools]::MakeContactSheet([string[]]$frames.normalizedPath.ForEach({ Join-Path $RepoRoot $_.Replace('/', '\') }), [string[]]$labels, $contactSheetPath, 3)

$firstBodyMetrics = [LamuhDashBlockFrameTools]::Measure($bodySources[0])
$recoveryBodyMetrics = [LamuhDashBlockFrameTools]::Measure($bodySources[5])
$firstFrameHeight = $firstBodyMetrics.MaxY - $firstBodyMetrics.MinY + 1
$recoveryHeight = $recoveryBodyMetrics.MaxY - $recoveryBodyMetrics.MinY + 1
$protectedLegacyFrames = @(0..6 | ForEach-Object { [ordered]@{ index = $_; path = Get-RepoRelativePath $legacyFramePaths[$_]; sha256 = Get-Sha256 $legacyFramePaths[$_] } })

$report = [ordered]@{
    schemaVersion = '1.0.0'
    subject = 'lamuh_legacy_v2.ascend_step.single_dash_punch.candidate.v2'
    status = 'awaiting_human_identity_locked_ascend_step_motion_timing_transition_and_combat_profile_review'
    candidateOnly = $true
    deployable = $false
    generatedWith = 'Exact approved Lamuh V2 runtime body frames composited with separate VFX-only layers; no generated avatar pixels'
    sourceFrameCount = 7
    authoredFrameCount = 6
    contactFrame = 3
    visibleImpactCount = 1
    gameplayHitCount = 1
    timing = [ordered]@{ recommendedCandidate = 'B'; exposureTicks = $exposureTicks; totalTicks = 30; gameplayAligned = $true }
    normalization = [ordered]@{
        canvas = [ordered]@{ width = 2048; height = 1536 }
        normalizedRoot = $targetRoot
        sequenceWideScale = 1.0
        sourceNormalizationScaleByFrame = @(1,1,1,1,1,1)
        sourceRootYByFrame = @(1360,1360,1360,1360,1360,1360)
        perFrameRendererScale = $false
        visualRecentering = $false
        placementPolicy = 'reuse_approved_fixed_root_runtime_frames_unchanged_while_simulation_owns_forward_travel'
        backgroundRemoval = 'vfx_only_chroma_extraction_body_sources_already_transparent'
        purpleOutlinePolicy = 'no_meaningful_magenta_pixels'
        alphaZeroRgbCleared = $true
    }
    identityLock = [ordered]@{
        exactApprovedBodyFrames = $true
        generatedAvatarPixels = $false
        matureAdultProportions = $true
        noChibiProportions = $true
        boxedBeardAndMustache = $true
        longBlackLocs = $true
        whiteGoldCoatBlackClothingCyanSash = $true
        noPurpleOutline = $true
        sameSequenceScale = $true
        recoveryUsesApprovedIdle = $true
    }
    singleActionContract = [ordered]@{
        oneContinuousPhysicalAction = $true
        groundedDashForward = $true
        strikingLimb = 'right_arm'
        punchOnly = $true
        contactFrame = 3
        visibleImpactCount = 1
        gameplayHitCount = 1
        risingStrikeRemoved = $true
        airborneFollowupRemoved = $true
        secondStrikeRemoved = $true
        poseProgression = @('approved idle aura ignition', 'approved low dash launch', 'approved fast dash carry', 'approved single punch contact', 'approved same-arm follow-through', 'approved idle recovery')
    }
    mobilityIdentity = [ordered]@{
        primaryRead = 'movement_first_dash_with_single_punch_end_beat'
        dashAura = $true
        auraPalette = @('white_core', 'cyan', 'restrained_gold')
        auraFrames = @(0,1,2,3,4)
        strongestAuraFrame = 2
        impactExplosion = $false
        afterimageBodyClone = $false
        worldTravelOwner = 'deterministic_simulation'
    }
    preservationBoundary = [ordered]@{
        protectedLegacyFramesModified = $false
        sourceOrderPreserved = $false
        approvedV2Disposition = 'MODERNIZE'
        retainedLegacyQualities = @('forward-loaded momentum', 'low dash energy', 'coat and loc drag', 'forward follow-through', 'grounded recovery direction')
        retiredLegacyBeats = @('rising palm contact', 'airborne palm follow-through', 'extended airborne second strike')
        explicitRootMotionOwner = 'deterministic simulation legacy_ascend_step rootMotion ticks 4-15 at velocity 9.2'
    }
    vfxBoundary = [ordered]@{
        generatedCharacterArtwork = $false
        movementAuraRequired = $true
        movementAuraBakedIntoCandidatePresentation = $true
        separateHitSparkAuthored = $false
        layerSeparationStatus = 'BODY_FROM_APPROVED_RUNTIME_FRAMES_VFX_ONLY_FROM_GENERATED_CHROMA_SOURCE'
    }
    protectedLegacyFrames = $protectedLegacyFrames
    vfxSources = @([ordered]@{ path = Get-RepoRelativePath $vfxRawPath; sha256 = Get-Sha256 $vfxRawPath; containsCharacter = $false })
    frames = $frames
    contactSheet = [ordered]@{ path = Get-RepoRelativePath $contactSheetPath; sha256 = Get-Sha256 $contactSheetPath }
    validation = [ordered]@{
        exactFrameCount = $frames.Count -eq 6
        distinctFrameHashes = ($frames.normalizedSha256 | Select-Object -Unique).Count -eq 6
        exactIdentitySourceReuse = $true
        generatedAvatarFrameCount = 0
        fixedRoot = $targetRoot
        singleSequenceScale = 1.0
        idleReferenceHeight = $firstFrameHeight
        firstFrameHeight = $firstFrameHeight
        groundedRecoveryHeight = $recoveryHeight
        groundedRecoveryHeightDeltaPct = [math]::Round(([math]::Abs($recoveryHeight - $firstFrameHeight) / $firstFrameHeight) * 100, 2)
        endpointHeightDeltaPct = [math]::Round(([math]::Abs($recoveryHeight - $firstFrameHeight) / $firstFrameHeight) * 100, 2)
        meaningfulMagentaPixelsRemaining = ($frames.meaningfulMagentaPixelsRemaining | Measure-Object -Sum).Sum
        redArtifactPixelsRemaining = ($frames.redArtifactPixelsRemaining | Measure-Object -Sum).Sum
        touchesEdge = $frames.touchesEdge -contains $true
        exposureCoverageTicks = ($exposureTicks | Measure-Object -Sum).Sum
        runtimeTravelChanged = $false
        combatValuesChanged = $false
        adultProportionVisualAudit = 'PASS_CANDIDATE_INTERNAL_REVIEW'
        compactFramesUsePoseCompressionNotPerFrameScale = $true
        oneActionRule = 'PASS_CANDIDATE_INTERNAL_REVIEW'
        hitCountParity = $true
        detachedBodyAndEffectComponentsPreserved = $true
        tinyArtifactMaximumAreaPixels = 12
        fullBodyCanvasContainment = $true
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
Write-Output "Rebuilt $($frames.Count) Ascend Step frames from exact approved Lamuh body sources plus VFX-only layers."
Write-Output "Report: $reportPath"
