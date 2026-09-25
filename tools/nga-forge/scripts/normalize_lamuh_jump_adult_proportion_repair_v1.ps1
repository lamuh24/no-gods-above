param(
    [string]$RepoRoot = (Resolve-Path (Join-Path $PSScriptRoot '..\..\..')).Path
)

$ErrorActionPreference = 'Stop'
Add-Type -AssemblyName System.Drawing
. (Join-Path $PSScriptRoot 'normalize_lamuh_dash_block_modernization_v1.ps1') -RepoRoot $RepoRoot -LibraryOnly

function Get-JumpSha256 {
    param([Parameter(Mandatory = $true)][string]$LiteralPath)
    return (Get-FileHash -Algorithm SHA256 -LiteralPath $LiteralPath).Hash
}

$reviewRoot = Join-Path $RepoRoot 'tools\nga-forge\review\lamuh-legacy-v2-jump-adult-proportion-repair-v1'
$rawSheet = Join-Path $reviewRoot 'raw\jump-source-sheet-adult-proportion-repair.png'
$sourceRoot = Join-Path $reviewRoot 'source-frames'
$normalizedRoot = Join-Path $reviewRoot 'normalized'
$supersededRoot = Join-Path $reviewRoot 'superseded-candidate-frames'
$currentMovementRoot = Join-Path $RepoRoot 'NO_GODS_ABOVE\engine_v2\public\lamuh-legacy-v2\movement-v2'
$protectedLegacyRoot = Join-Path $RepoRoot 'NO_GODS_ABOVE\engine_v2\content-source\characters\lamuh-legacy-v2\source-frames\jump'
$idleReference = Join-Path $currentMovementRoot 'idle-00.png'
$targetRoot = [ordered]@{ x = 768; y = 1360 }
$roles = @('jump_anticipation', 'takeoff_extension', 'rising_knee_tuck', 'apex_knee_tuck', 'falling_connector', 'soft_landing_compression', 'guarded_recovery')
$legacyIndices = @(0, 0, 1, 2, 3, 3, 0)
$exposureTicks = @(4, 3, 5, 4, 5, 4, 3)

foreach ($path in @($rawSheet, $idleReference)) {
    if (-not (Test-Path -LiteralPath $path)) { throw "Missing Jump adult-proportion repair prerequisite: $path" }
}
New-Item -ItemType Directory -Force -Path $sourceRoot, $normalizedRoot, $supersededRoot | Out-Null

$idleBounds = [LamuhDashBlockFrameTools]::AlphaBounds($idleReference)
if ($idleBounds.Height -le 0) { throw 'Modern Idle reference contains no visible pixels.' }

$probes = @()
for ($index = 0; $index -lt 7; $index++) {
    $sourcePath = Join-Path $sourceRoot ("jump-{0:D2}.png" -f $index)
    $extractMetrics = [LamuhDashBlockFrameTools]::ExtractCell($rawSheet, $sourcePath, $index, 7)
    $sourceBounds = [LamuhDashBlockFrameTools]::AlphaBounds($sourcePath)
    if ($sourceBounds.Height -le 0) { throw "Empty Jump repair source frame at index $index." }
    $probes += [ordered]@{ index = $index; sourcePath = $sourcePath; sourceBounds = $sourceBounds; extractMetrics = $extractMetrics }
}

$recoveryBounds = $probes[6].sourceBounds
$sequenceScale = [math]::Round($idleBounds.Height / [double]$recoveryBounds.Height, 8)
$frames = @()
$contactPaths = @()
$contactLabels = @()

foreach ($probe in $probes) {
    $rawRootX = ($probe.sourceBounds.MinX + $probe.sourceBounds.MaxX) / 2.0
    $rawRootY = $probe.sourceBounds.MaxY
    $normalizedPath = Join-Path $normalizedRoot ("jump-{0:D2}.png" -f $probe.index)
    $metrics = [LamuhDashBlockFrameTools]::NormalizeFrame($probe.sourcePath, $normalizedPath, $rawRootX, $rawRootY, $targetRoot.x, $targetRoot.y, 2048, 1536, $sequenceScale, $false)
    $legacyPath = Join-Path $protectedLegacyRoot ("jump_{0:D2}.png" -f $legacyIndices[$probe.index])
    if (-not (Test-Path -LiteralPath $legacyPath)) { throw "Missing protected V1 Jump reference: $legacyPath" }
    $supersededPath = Join-Path $supersededRoot ("jump-{0:D2}.png" -f $probe.index)
    $currentPath = Join-Path $currentMovementRoot ("jump-{0:D2}.png" -f $probe.index)
    Copy-Item -LiteralPath $currentPath -Destination $supersededPath -Force
    $frames += [ordered]@{
        index = $probe.index
        role = $roles[$probe.index]
        legacyIndex = $legacyIndices[$probe.index]
        legacyPath = (Resolve-Path $legacyPath).Path.Substring($RepoRoot.Length + 1).Replace('\', '/')
        legacySha256 = Get-JumpSha256 $legacyPath
        supersededCandidatePath = (Resolve-Path $supersededPath).Path.Substring($RepoRoot.Length + 1).Replace('\', '/')
        supersededCandidateSha256 = Get-JumpSha256 $supersededPath
        sourcePath = (Resolve-Path $probe.sourcePath).Path.Substring($RepoRoot.Length + 1).Replace('\', '/')
        sourceSha256 = Get-JumpSha256 $probe.sourcePath
        normalizedPath = (Resolve-Path $normalizedPath).Path.Substring($RepoRoot.Length + 1).Replace('\', '/')
        normalizedSha256 = Get-JumpSha256 $normalizedPath
        normalizedRoot = $targetRoot
        authoredRawRoot = [ordered]@{ x = [math]::Round($rawRootX, 2); y = [math]::Round($rawRootY, 2) }
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
    $contactLabels += ("jump {0:D2}|{1}" -f $probe.index, $roles[$probe.index].Replace('_', ' '))
}

if (($frames.normalizedSha256 | Select-Object -Unique).Count -ne 7) { throw 'Jump repair contains an undeclared duplicate frame.' }
if ($frames.touchesEdge -contains $true) { throw 'A normalized Jump repair frame touches the canvas edge.' }
if (($frames.meaningfulMagentaPixelsRemaining | Measure-Object -Sum).Sum -ne 0) { throw 'Meaningful purple/magenta pixels remain in Jump repair frames.' }
if (($frames.redArtifactPixelsRemaining | Measure-Object -Sum).Sum -ne 0) { throw 'Bright red generation fringe remains in Jump repair frames.' }

$recoveryFrame = $frames[6]
$recoveryHeight = $recoveryFrame.visibleBounds.maxY - $recoveryFrame.visibleBounds.minY + 1
$idleHeightDeltaRatio = [math]::Round([math]::Abs($recoveryHeight - $idleBounds.Height) / [double]$idleBounds.Height, 4)
if ($idleHeightDeltaRatio -gt 0.03) { throw "Jump recovery no longer matches Idle height within 3%: $idleHeightDeltaRatio" }

$contactSheet = Join-Path $reviewRoot 'jump-adult-proportion-numbered-contact-sheet.png'
[LamuhDashBlockFrameTools]::MakeContactSheet($contactPaths, $contactLabels, $contactSheet, 7)
$report = [ordered]@{
    schemaVersion = '1.0.0'
    subject = 'lamuh_legacy_v2.jump.adult_proportion_repair.candidate.v1'
    status = 'candidate-only'
    candidateOnly = $true
    deployable = $false
    sourceSheet = [ordered]@{ path = (Resolve-Path $rawSheet).Path.Substring($RepoRoot.Length + 1).Replace('\', '/'); sha256 = Get-JumpSha256 $rawSheet; generationMode = 'OpenAI built-in image generation reference edit mode'; cells = 7 }
    canvas = [ordered]@{ width = 2048; height = 1536 }
    fixedRoot = $targetRoot
    sequenceScale = $sequenceScale
    idleVisibleHeight = $idleBounds.Height
    recoveryVisibleHeight = $recoveryHeight
    idleHeightDeltaRatio = $idleHeightDeltaRatio
    state = [ordered]@{ id = 'jump'; authoredFrameCount = 7; exposureTicks = $exposureTicks; durationTicks = 28; loop = $false }
    validation = [ordered]@{ sequenceWideScale = $true; perFrameRendererScale = $false; visualRecentering = $false; simulationOwnsTravel = $true; edgeTouches = 0; meaningfulMagentaPixelsRemaining = 0; redArtifactPixelsRemaining = 0; uniqueFrames = 7; adultProportionAnchor = 'movement-v2/idle-00.png' }
    sourceRepairReason = 'Preserve the approved seven-pose Jump motion arc while correcting the user-rejected chibi head-to-body ratio, missing beard continuity, and compressed adult anatomy. Timing and simulation-owned travel remain unchanged.'
    contactSheet = [ordered]@{ path = (Resolve-Path $contactSheet).Path.Substring($RepoRoot.Length + 1).Replace('\', '/'); sha256 = Get-JumpSha256 $contactSheet; numbered = $true; fixedRoot = $true }
    frames = $frames
}
$report | ConvertTo-Json -Depth 16 | Set-Content -LiteralPath (Join-Path $reviewRoot 'normalization.report.json') -Encoding utf8
Write-Output "Normalized 7 adult-proportion Jump frames at sequence scale $sequenceScale; Idle recovery delta $idleHeightDeltaRatio."
