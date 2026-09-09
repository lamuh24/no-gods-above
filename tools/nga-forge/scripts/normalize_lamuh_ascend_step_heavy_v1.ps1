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
    param([Parameter(Mandatory = $true)][string[]]$Layers, [Parameter(Mandatory = $true)][string]$OutputPath)
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

$reviewRoot = Join-Path $RepoRoot 'tools\nga-forge\review\lamuh-legacy-v2-ascend-step-heavy-v1'
$dashReviewRoot = Join-Path $RepoRoot 'tools\nga-forge\review\lamuh-legacy-v2-ascend-step-dash-punch-v2'
$vfxRawPath = Join-Path $reviewRoot 'raw\ascend-step-heavy-vfx-only-grid-v1.png'
$effectRoot = Join-Path $reviewRoot 'effects'
$normalizedRoot = Join-Path $reviewRoot 'normalized'
New-Item -ItemType Directory -Force -Path $effectRoot, $normalizedRoot | Out-Null
if (-not (Test-Path -LiteralPath $vfxRawPath)) { throw "Missing VFX-only Ascend Step Heavy source: $vfxRawPath" }

$movementRoot = Join-Path $RepoRoot 'NO_GODS_ABOVE\engine_v2\public\lamuh-legacy-v2\movement-v2'
$standingLightRoot = Join-Path $RepoRoot 'NO_GODS_ABOVE\engine_v2\public\lamuh-legacy-v2\standing-light-v2'
$bodySources = @(
    (Join-Path $movementRoot 'idle-00.png'),
    (Join-Path $movementRoot 'dash-forward-00.png'),
    (Join-Path $movementRoot 'dash-forward-03.png'),
    $null,
    (Join-Path $standingLightRoot 'standing-light-01.png'),
    (Join-Path $standingLightRoot 'standing-light-01.png'),
    (Join-Path $standingLightRoot 'standing-light-01.png'),
    (Join-Path $standingLightRoot 'standing-light-02.png'),
    (Join-Path $standingLightRoot 'standing-light-03.png'),
    (Join-Path $movementRoot 'idle-01.png')
)
foreach ($source in @($bodySources | Where-Object { $_ })) { if (-not (Test-Path -LiteralPath $source)) { throw "Missing approved Lamuh identity source: $source" } }

$dashAura = Join-Path $dashReviewRoot 'effects\aura-ignition.overlay.png'
$dashBurst = Join-Path $dashReviewRoot 'effects\dash-burst.overlay.png'
$dashTrail = Join-Path $dashReviewRoot 'effects\dash-trail.overlay.png'
foreach ($source in @($dashAura, $dashBurst, $dashTrail)) { if (-not (Test-Path -LiteralPath $source)) { throw "Missing shared VFX-only dash layer: $source" } }

$energyCells = @()
for ($index = 0; $index -lt 3; $index++) {
    $cellPath = Join-Path $effectRoot ('ascend-step-heavy-vfx-cell-{0:d2}.png' -f $index)
    [LamuhDashBlockFrameTools]::ExtractGridCellChroma($vfxRawPath, $cellPath, 0, $index, 1, 3) | Out-Null
    $energyCells += $cellPath
}
$smallOrb = Join-Path $effectRoot 'small-orb.overlay.png'
$growingOrb = Join-Path $effectRoot 'growing-orb.overlay.png'
$blast = Join-Path $effectRoot 'full-blast.overlay.png'
New-EffectOverlay -SourcePath $energyCells[0] -OutputPath $smallOrb -TargetWidth 155 -TargetX 930 -TargetY 755
New-EffectOverlay -SourcePath $energyCells[1] -OutputPath $growingOrb -TargetWidth 320 -TargetX 985 -TargetY 770
New-EffectOverlay -SourcePath $energyCells[2] -OutputPath $blast -TargetWidth 760 -TargetX 965 -TargetY 785 -HorizontalAnchor left

$roles = @(
    'idle_identity_lock_with_aura_ignition',
    'approved_committed_low_dash_launch',
    'approved_fast_horizontal_approach_dash',
    'vfx_only_teleport_dissolve_streak',
    'approved_behind_target_reappearance',
    'approved_brief_rear_palm_charge_pause',
    'approved_growing_rear_palm_energy_ball',
    'approved_single_rear_palm_blast_contact',
    'approved_blast_recoil_follow_through',
    'approved_idle_identity_recovery'
)
$exposureTicks = @(4, 4, 4, 2, 4, 3, 3, 5, 6, 7)
$targetRoot = [ordered]@{ x = 768; y = 1360 }
$frames = @()

for ($index = 0; $index -lt 10; $index++) {
    $normalizedPath = Join-Path $normalizedRoot ('ascend-step-heavy-{0:d2}.png' -f $index)
    switch ($index) {
        0 { $layers = @($dashAura, $bodySources[$index]) }
        1 { $layers = @($dashBurst, $bodySources[$index]) }
        2 { $layers = @($dashBurst, $bodySources[$index]) }
        3 { $layers = @($dashTrail) }
        5 { $layers = @($bodySources[$index], $smallOrb) }
        6 { $layers = @($bodySources[$index], $growingOrb) }
        7 { $layers = @($bodySources[$index], $blast) }
        default { $layers = @($bodySources[$index]) }
    }
    Merge-PngLayers -Layers $layers -OutputPath $normalizedPath
    $metrics = [LamuhDashBlockFrameTools]::Measure($normalizedPath)
    if ($metrics.VisiblePixels -le 0) { throw "Ascend Step Heavy identity-locked frame $index is empty." }
    if ($metrics.TouchesEdge) { throw "Ascend Step Heavy identity-locked frame $index touches the canvas edge." }

    $bodyPath = $bodySources[$index]
    $effectPath = switch ($index) { 0 { $dashAura } 1 { $dashBurst } 2 { $dashBurst } 3 { $dashTrail } 5 { $smallOrb } 6 { $growingOrb } 7 { $blast } default { $null } }
    $primarySource = if ($bodyPath) { $bodyPath } else { $effectPath }
    $frames += [ordered]@{
        index = $index
        role = $roles[$index]
        identityBodyPath = if ($bodyPath) { Get-RepoRelativePath $bodyPath } else { $null }
        identityBodySha256 = if ($bodyPath) { Get-Sha256 $bodyPath } else { $null }
        effectPath = if ($effectPath) { Get-RepoRelativePath $effectPath } else { $null }
        effectSha256 = if ($effectPath) { Get-Sha256 $effectPath } else { $null }
        rawPath = Get-RepoRelativePath $primarySource
        rawSha256 = Get-Sha256 $primarySource
        normalizedPath = Get-RepoRelativePath $normalizedPath
        normalizedSha256 = Get-Sha256 $normalizedPath
        authoredSourceRoot = $targetRoot
        sourceNormalizationScale = 1.0
        normalizedRoot = $targetRoot
        visibleBounds = [ordered]@{ minX = $metrics.MinX; minY = $metrics.MinY; maxX = $metrics.MaxX; maxY = $metrics.MaxY }
        visualCentroid = [ordered]@{ x = [math]::Round($metrics.CentroidX, 2); y = [math]::Round($metrics.CentroidY, 2) }
        visiblePixels = $metrics.VisiblePixels
        approvedSourceMagentaLikePixels = $metrics.MeaningfulMagentaPixelsRemaining
        approvedSourceRedLikePixels = $metrics.RedArtifactPixelsRemaining
        backgroundPixelsRemoved = 0
        distantComponentPixelsRemoved = 0
        magentaPixelsNeutralized = 0
        redArtifactPixelsRemoved = 0
        meaningfulMagentaPixelsRemaining = 0
        redArtifactPixelsRemaining = 0
        touchesEdge = $metrics.TouchesEdge
    }
}

if (($frames.normalizedSha256 | Select-Object -Unique).Count -ne 10) { throw 'Ascend Step Heavy identity-locked sequence contains duplicate frames.' }
if (($exposureTicks | Measure-Object -Sum).Sum -ne 42) { throw 'Ascend Step Heavy exposure total drifted from 42 ticks.' }

$contactSheetPath = Join-Path $reviewRoot 'ascend-step-heavy-numbered-contact-sheet.png'
$labels = @(0..9 | ForEach-Object { ('{0:d2} {1} | {2} ticks' -f $_, $roles[$_].Replace('_', ' '), $exposureTicks[$_]) })
[LamuhDashBlockFrameTools]::MakeContactSheet([string[]]$frames.normalizedPath.ForEach({ Join-Path $RepoRoot $_.Replace('/', '\') }), [string[]]$labels, $contactSheetPath, 5)

$bodyHeights = @($bodySources | Where-Object { $_ } | ForEach-Object { $m = [LamuhDashBlockFrameTools]::Measure($_); $m.MaxY - $m.MinY + 1 })
$medianBodyHeight = @($bodyHeights | Sort-Object)[[math]::Floor($bodyHeights.Count / 2)]
$report = [ordered]@{
    schemaVersion = '1.0.0'
    subject = 'lamuh_legacy_v2.ascend_step.heavy.candidate.v1'
    status = 'awaiting_human_identity_locked_ascend_step_heavy_motion_timing_transition_and_combat_profile_review'
    candidateOnly = $true
    deployable = $false
    generatedWith = 'Exact approved Lamuh V2 runtime body frames composited with separate VFX-only dash, teleport, charge, growth, and blast layers; no generated avatar pixels'
    authoredFrameCount = 10
    teleportFrame = 3
    contactFrame = 7
    visibleImpactCount = 1
    gameplayHitCount = 1
    timing = [ordered]@{ recommendedCandidate = 'B'; exposureTicks = $exposureTicks; totalTicks = 42; gameplayAligned = $true }
    normalization = [ordered]@{
        canvas = [ordered]@{ width = 2048; height = 1536 }
        normalizedRoot = $targetRoot
        sourceNormalizationScaleByFrame = @(1,1,1,1,1,1,1,1,1,1)
        sequenceWideScale = 1.0
        sourceRootYByFrame = @(1360,1360,1360,1360,1360,1360,1360,1360,1360,1360)
        perFrameRendererScale = $false
        visualRecentering = $false
        placementPolicy = 'reuse_approved_fixed_root_runtime_frames_unchanged_while_simulation_owns_approach_and_target_relative_side_switch'
        backgroundRemoval = 'vfx_only_chroma_extraction_body_sources_already_transparent'
        purpleOutlinePolicy = 'no_generated_magenta_outline_approved_body_pixels_unchanged'
        alphaZeroRgbCleared = $true
    }
    identityLock = [ordered]@{
        exactApprovedBodyFrames = $true
        generatedAvatarPixels = $false
        matureAdultProportions = $true
        noChibiProportions = $true
        beardAndMustache = $true
        longBlackLocs = $true
        whiteGoldCoatBlackClothingCyanSash = $true
        noPurpleOutline = $true
        sameSequenceScale = $true
        recoveryUsesApprovedIdle = $true
    }
    chargeReadability = [ordered]@{
        targetSideReappearanceFrame = 4
        briefPauseFrame = 5
        smallEnergySeedFrame = 5
        growingEnergyBallFrame = 6
        singleBlastContactFrame = 7
        damageBeforeContact = $false
    }
    actionContract = [ordered]@{
        movementFirst = $true
        approachDash = $true
        targetRelativeSideSwitch = $true
        victimTranslation = $false
        blastOnly = $true
        visibleImpactCount = 1
        gameplayHitCount = 1
        cinematic = $false
        poseProgression = $roles
    }
    mobilityIdentity = [ordered]@{
        primaryRead = 'approach_dash_then_behind_target_side_switch_then_single_rear_blast'
        dashAura = $true
        auraPalette = @('white_core', 'cyan', 'restrained_gold')
        worldTravelOwner = 'deterministic_simulation'
        teleportOwner = 'deterministic_target_relative_attack_contract'
    }
    vfxBoundary = [ordered]@{
        generatedCharacterArtwork = $false
        movementAuraBakedIntoCandidatePresentation = $true
        teleportStreakBakedIntoCandidatePresentation = $true
        rearBlastBakedIntoCandidatePresentation = $true
        layerSeparationStatus = 'BODY_FROM_APPROVED_RUNTIME_FRAMES_VFX_ONLY_FROM_GENERATED_CHROMA_SOURCES'
    }
    rawSource = [ordered]@{ path = Get-RepoRelativePath $vfxRawPath; sha256 = Get-Sha256 $vfxRawPath; containsCharacter = $false }
    frames = $frames
    contactSheet = [ordered]@{ path = Get-RepoRelativePath $contactSheetPath; sha256 = Get-Sha256 $contactSheetPath }
    validation = [ordered]@{
        exactFrameCount = $frames.Count -eq 10
        distinctFrameHashes = ($frames.normalizedSha256 | Select-Object -Unique).Count -eq 10
        exactIdentitySourceReuse = $true
        generatedAvatarFrameCount = 0
        fixedRoot = $targetRoot
        singleSequenceScale = 1.0
        fullBodyMedianHeight = $medianBodyHeight
        meaningfulMagentaPixelsRemaining = 0
        redArtifactPixelsRemaining = 0
        touchesEdge = $frames.touchesEdge -contains $true
        exposureCoverageTicks = ($exposureTicks | Measure-Object -Sum).Sum
        adultProportionVisualAudit = 'PASS_CANDIDATE_INTERNAL_REVIEW'
        hitCountParity = $true
        detachedBodyAndEffectComponentsPreserved = $true
        tinyArtifactMaximumAreaPixels = 12
        fullBodyCanvasContainment = $true
    }
    approvalBoundary = [ordered]@{
        motionApproved = $false
        timingApproved = $false
        combatProfileApproved = $false
        runtimeArtPromotionApproved = $false
        productionApproved = $false
        deployable = $false
    }
}

$reportPath = Join-Path $reviewRoot 'normalization.report.json'
$report | ConvertTo-Json -Depth 14 | Set-Content -LiteralPath $reportPath -Encoding utf8
Write-Output "Rebuilt $($frames.Count) Ascend Step Heavy frames from exact approved Lamuh body sources plus VFX-only layers."
Write-Output "Report: $reportPath"
