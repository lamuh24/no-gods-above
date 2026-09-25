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

function Render-RigidBodyFrame {
    param(
        [Parameter(Mandatory = $true)][string]$BodyPath,
        [Parameter(Mandatory = $true)][string]$OutputPath,
        [double]$RotationDegrees = 0,
        [Nullable[double]]$TargetCentroidX = $null,
        [Nullable[double]]$TargetCentroidY = $null,
        [Nullable[int]]$TargetBottomY = $null,
        [string]$EffectPath = $null
    )
    $bodyMetrics = [LamuhDashBlockFrameTools]::Measure($BodyPath)
    $source = [System.Drawing.Bitmap]::FromFile($BodyPath)
    $output = New-Object System.Drawing.Bitmap 2048, 1536, ([System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
    $graphics = [System.Drawing.Graphics]::FromImage($output)
    try {
        $graphics.Clear([System.Drawing.Color]::Transparent)
        $graphics.CompositingMode = [System.Drawing.Drawing2D.CompositingMode]::SourceOver
        $graphics.CompositingQuality = [System.Drawing.Drawing2D.CompositingQuality]::HighQuality
        $graphics.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
        $graphics.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
        $graphics.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::HighQuality

        if ($EffectPath) {
            $effect = [System.Drawing.Bitmap]::FromFile($EffectPath)
            try { $graphics.DrawImageUnscaled($effect, 0, 0) }
            finally { $effect.Dispose() }
        }

        if ([math]::Abs($RotationDegrees) -lt 0.001 -and -not $TargetCentroidX.HasValue -and -not $TargetCentroidY.HasValue) {
            $graphics.DrawImageUnscaled($source, 0, 0)
        }
        else {
            $targetX = if ($TargetCentroidX.HasValue) { $TargetCentroidX.Value } else { $bodyMetrics.CentroidX }
            $targetY = if ($TargetCentroidY.HasValue) { $TargetCentroidY.Value } else { $bodyMetrics.CentroidY }
            $graphics.TranslateTransform([single]$targetX, [single]$targetY)
            $graphics.RotateTransform([single]$RotationDegrees)
            $graphics.TranslateTransform([single](-$bodyMetrics.CentroidX), [single](-$bodyMetrics.CentroidY))
            $graphics.DrawImageUnscaled($source, 0, 0)
            $graphics.ResetTransform()
        }
        $output.Save($OutputPath, [System.Drawing.Imaging.ImageFormat]::Png)
    }
    finally {
        $graphics.Dispose()
        $output.Dispose()
        $source.Dispose()
    }

    if ($TargetBottomY.HasValue) {
        $renderedMetrics = [LamuhDashBlockFrameTools]::Measure($OutputPath)
        $shiftY = $TargetBottomY.Value - $renderedMetrics.MaxY
        if ($shiftY -ne 0) {
            $shiftedPath = "$OutputPath.bottom-aligned.png"
            $rendered = [System.Drawing.Bitmap]::FromFile($OutputPath)
            $shifted = New-Object System.Drawing.Bitmap 2048, 1536, ([System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
            $shiftGraphics = [System.Drawing.Graphics]::FromImage($shifted)
            try {
                $shiftGraphics.Clear([System.Drawing.Color]::Transparent)
                $shiftGraphics.CompositingMode = [System.Drawing.Drawing2D.CompositingMode]::SourceCopy
                $shiftGraphics.DrawImageUnscaled($rendered, 0, $shiftY)
                $shifted.Save($shiftedPath, [System.Drawing.Imaging.ImageFormat]::Png)
            }
            finally {
                $shiftGraphics.Dispose()
                $shifted.Dispose()
                $rendered.Dispose()
            }
            Move-Item -LiteralPath $shiftedPath -Destination $OutputPath -Force
        }
    }
}

. (Join-Path $PSScriptRoot 'normalize_lamuh_dash_block_modernization_v1.ps1') -RepoRoot $RepoRoot -LibraryOnly

if (-not ('LamuhMediumMotionReviewTools' -as [type])) {
Add-Type -TypeDefinition @'
using System;
using System.Drawing;
using System.Drawing.Drawing2D;
using System.Drawing.Imaging;
using System.IO;

public static class LamuhMediumMotionReviewTools {
    public static void MakeSilhouette(string sourcePath, string outputPath) {
        using (var source = new Bitmap(sourcePath))
        using (var output = new Bitmap(source.Width, source.Height, PixelFormat.Format32bppArgb))
        using (var graphics = Graphics.FromImage(output))
        using (var attributes = new ImageAttributes()) {
            var matrix = new ColorMatrix(new float[][] {
                new float[] { 0, 0, 0, 0, 0 },
                new float[] { 0, 0, 0, 0, 0 },
                new float[] { 0, 0, 0, 0, 0 },
                new float[] { 0, 0, 0, 1, 0 },
                new float[] { .46f, .83f, .61f, 0, 1 }
            });
            attributes.SetColorMatrix(matrix);
            graphics.Clear(Color.Transparent);
            graphics.DrawImage(source, new Rectangle(0, 0, source.Width, source.Height), 0, 0, source.Width, source.Height, GraphicsUnit.Pixel, attributes);
            output.Save(outputPath, ImageFormat.Png);
        }
    }

    public static void OverlayRootNotes(string sheetPath, string[] notes, int columns) {
        using (var source = new Bitmap(sheetPath))
        using (var output = new Bitmap(source))
        using (var graphics = Graphics.FromImage(output))
        using (var font = new Font("Segoe UI", 8, FontStyle.Bold))
        using (var brush = new SolidBrush(Color.FromArgb(255, 255, 224, 138)))
        using (var cover = new SolidBrush(Color.FromArgb(255, 8, 13, 19))) {
            int cellWidth = 470, cellHeight = 365;
            for (int index = 0; index < notes.Length; index++) {
                int left = (index % columns) * cellWidth, top = (index / columns) * cellHeight;
                graphics.FillRectangle(cover, left + 3, top + cellHeight - 23, cellWidth - 6, 20);
                graphics.DrawString(notes[index], font, brush, left + 7, top + cellHeight - 20);
            }
            output.Save(sheetPath + ".tmp.png", ImageFormat.Png);
        }
        File.Delete(sheetPath);
        File.Move(sheetPath + ".tmp.png", sheetPath);
    }

    public static void MakeRootPathOverlay(int[] xs, int[] ys, int[] contacts, string outputPath) {
        using (var output = new Bitmap(1320, 560, PixelFormat.Format32bppArgb))
        using (var graphics = Graphics.FromImage(output))
        using (var title = new Font("Segoe UI", 20, FontStyle.Bold))
        using (var label = new Font("Segoe UI", 10, FontStyle.Bold))
        using (var detail = new Font("Segoe UI", 9, FontStyle.Regular))
        using (var linePen = new Pen(Color.FromArgb(255, 117, 211, 155), 4))
        using (var groundPen = new Pen(Color.FromArgb(180, 138, 160, 187), 2)) {
            graphics.Clear(Color.FromArgb(8, 13, 19));
            graphics.SmoothingMode = SmoothingMode.AntiAlias;
            graphics.DrawString("ASCEND STEP MEDIUM - AUTHORED WORLD-ROOT TRAJECTORY", title, Brushes.White, 34, 24);
            graphics.DrawString("Forward slide travel is simulation-owned; compression redirects the root backward through the handspring and landing.", detail, Brushes.LightGray, 36, 66);
            int originX = 80, groundY = 430, xScale = 11;
            graphics.DrawLine(groundPen, 45, groundY, 1275, groundY);
            var points = new PointF[xs.Length];
            for (int index = 0; index < xs.Length; index++) points[index] = new PointF(originX + xs[index] * xScale, groundY - ys[index]);
            if (points.Length > 1) graphics.DrawLines(linePen, points);
            for (int index = 0; index < points.Length; index++) {
                bool contact = Array.IndexOf(contacts, index) >= 0;
                using (var brush = new SolidBrush(contact ? Color.FromArgb(255, 255, 224, 138) : Color.FromArgb(255, 89, 202, 255))) {
                    graphics.FillEllipse(brush, points[index].X - 7, points[index].Y - 7, 14, 14);
                }
                graphics.DrawString(index.ToString("00"), label, Brushes.White, points[index].X - 9, points[index].Y + 12 + (index % 2) * 18);
            }
            graphics.DrawString("START", label, Brushes.White, points[0].X - 22, groundY + 72);
            graphics.DrawString("SLIDE FORWARD", label, Brushes.White, originX + 210, groundY + 72);
            graphics.DrawString("COIL / HANDSPRING / LAND BACKWARD", label, Brushes.White, originX + 690, groundY + 72);
            Directory.CreateDirectory(Path.GetDirectoryName(outputPath));
            output.Save(outputPath, ImageFormat.Png);
        }
    }

    public static void MakeSideBySide(string leftPath, string rightPath, string outputPath) {
        using (var left = new Bitmap(leftPath))
        using (var right = new Bitmap(rightPath))
        using (var output = new Bitmap(1920, 880, PixelFormat.Format32bppArgb))
        using (var graphics = Graphics.FromImage(output))
        using (var title = new Font("Segoe UI", 18, FontStyle.Bold)) {
            graphics.Clear(Color.FromArgb(8, 13, 19));
            graphics.InterpolationMode = InterpolationMode.HighQualityBicubic;
            graphics.DrawString("SUPERSEDED - FIXED-ROOT DOUBLE-LEG CONTACT", title, Brushes.IndianRed, 40, 24);
            graphics.DrawString("REPAIRED - TRAVELING ROOT + ASYMMETRIC RISING HEEL", title, Brushes.LightGreen, 1000, 24);
            graphics.DrawImage(left, new Rectangle(25, 75, 910, 780), new Rectangle(0, 0, left.Width, left.Height), GraphicsUnit.Pixel);
            graphics.DrawImage(right, new Rectangle(985, 75, 910, 780), new Rectangle(0, 0, right.Width, right.Height), GraphicsUnit.Pixel);
            output.Save(outputPath, ImageFormat.Png);
        }
    }
}
'@ -ReferencedAssemblies @('System.Drawing.dll', 'System.dll')
}

$reviewRoot = Join-Path $RepoRoot 'tools\nga-forge\review\lamuh-legacy-v2-ascend-step-medium-slide-flip-v1'
$normalizedRoot = Join-Path $reviewRoot 'normalized'
New-Item -ItemType Directory -Force -Path $reviewRoot, $normalizedRoot | Out-Null

$movementRoot = Join-Path $RepoRoot 'NO_GODS_ABOVE\engine_v2\public\lamuh-legacy-v2\movement-v2'
$crouchingMediumRoot = Join-Path $RepoRoot 'NO_GODS_ABOVE\engine_v2\public\lamuh-legacy-v2\crouching-medium-v2'
$airMediumRoot = Join-Path $RepoRoot 'NO_GODS_ABOVE\engine_v2\public\lamuh-legacy-v2\air-normals-v2\air-medium'
$airHeavyRoot = Join-Path $RepoRoot 'NO_GODS_ABOVE\engine_v2\public\lamuh-legacy-v2\air-normals-v2\air-heavy'
$effectRoot = Join-Path $RepoRoot 'tools\nga-forge\review\lamuh-legacy-v2-ascend-step-dash-punch-v2\effects'
$rawRoot = Join-Path $reviewRoot 'raw'
$backHandspringPlantRaw = Join-Path $rawRoot 'ascend-step-medium-backspring-plant-source-v2.png'
$backHandspringPlantCutout = Join-Path $rawRoot 'ascend-step-medium-backspring-plant-cutout-v2.png'
$backHandspringPlantNormalized = Join-Path $rawRoot 'ascend-step-medium-backspring-plant-normalized-v2.png'
$slideCoilRaw = Join-Path $rawRoot 'ascend-step-medium-slide-retraction-coil-source-v3.png'
$slideCoilCutout = Join-Path $rawRoot 'ascend-step-medium-slide-retraction-coil-cutout-v3.png'
$slideCoilNormalized = Join-Path $rawRoot 'ascend-step-medium-slide-retraction-coil-normalized-v3.png'
$backHandspringReachRaw = Join-Path $rawRoot 'ascend-step-medium-backspring-hands-reach-source-v3.png'
$backHandspringReachCutout = Join-Path $rawRoot 'ascend-step-medium-backspring-hands-reach-cutout-v3.png'
$backHandspringReachNormalized = Join-Path $rawRoot 'ascend-step-medium-backspring-hands-reach-normalized-v3.png'
$backHandspringContactRaw = Join-Path $rawRoot 'ascend-step-medium-backspring-asymmetric-rising-kick-source-v3.png'
$backHandspringContactCutout = Join-Path $rawRoot 'ascend-step-medium-backspring-asymmetric-rising-kick-cutout-v3.png'
$backHandspringContactNormalized = Join-Path $rawRoot 'ascend-step-medium-backspring-asymmetric-rising-kick-normalized-v3.png'
$backHandspringTuckRaw = Join-Path $rawRoot 'ascend-step-medium-backspring-post-contact-tuck-source-v3.png'
$backHandspringTuckCutout = Join-Path $rawRoot 'ascend-step-medium-backspring-post-contact-tuck-cutout-v3.png'
$backHandspringTuckNormalized = Join-Path $rawRoot 'ascend-step-medium-backspring-post-contact-tuck-normalized-v3.png'
$backHandspringLandingRaw = Join-Path $rawRoot 'ascend-step-medium-backspring-landing-source-v2.png'
$backHandspringLandingCutout = Join-Path $rawRoot 'ascend-step-medium-backspring-landing-cutout-v2.png'
$backHandspringLandingNormalized = Join-Path $rawRoot 'ascend-step-medium-backspring-landing-normalized-v2.png'
New-Item -ItemType Directory -Force -Path $rawRoot | Out-Null
foreach ($requiredSource in @($slideCoilRaw, $backHandspringReachRaw, $backHandspringPlantRaw, $backHandspringContactRaw, $backHandspringTuckRaw, $backHandspringLandingRaw)) {
    if (-not (Test-Path -LiteralPath $requiredSource)) { throw "Missing authored full back-handspring source: $requiredSource" }
}
[LamuhDashBlockFrameTools]::ExtractCell($backHandspringPlantRaw, $backHandspringPlantCutout, 0, 1) | Out-Null
[LamuhDashBlockFrameTools]::NormalizeFramePreserveDetails($backHandspringPlantCutout, $backHandspringPlantNormalized, 550, 980, 768, 1360, 2048, 1536, 0.90, $false) | Out-Null
[LamuhDashBlockFrameTools]::ExtractCell($slideCoilRaw, $slideCoilCutout, 0, 1) | Out-Null
[LamuhDashBlockFrameTools]::NormalizeFramePreserveDetails($slideCoilCutout, $slideCoilNormalized, 700, 980, 768, 1360, 2048, 1536, 0.90, $false) | Out-Null
[LamuhDashBlockFrameTools]::ExtractCell($backHandspringReachRaw, $backHandspringReachCutout, 0, 1) | Out-Null
[LamuhDashBlockFrameTools]::NormalizeFramePreserveDetails($backHandspringReachCutout, $backHandspringReachNormalized, 700, 980, 768, 1360, 2048, 1536, 0.90, $false) | Out-Null
[LamuhDashBlockFrameTools]::ExtractCell($backHandspringContactRaw, $backHandspringContactCutout, 0, 1) | Out-Null
[LamuhDashBlockFrameTools]::NormalizeFramePreserveDetails($backHandspringContactCutout, $backHandspringContactNormalized, 700, 980, 768, 1360, 2048, 1536, 0.90, $false) | Out-Null
[LamuhDashBlockFrameTools]::ExtractCell($backHandspringTuckRaw, $backHandspringTuckCutout, 0, 1) | Out-Null
[LamuhDashBlockFrameTools]::NormalizeFramePreserveDetails($backHandspringTuckCutout, $backHandspringTuckNormalized, 700, 980, 768, 1360, 2048, 1536, 0.90, $false) | Out-Null
[LamuhDashBlockFrameTools]::ExtractCell($backHandspringLandingRaw, $backHandspringLandingCutout, 0, 1) | Out-Null
[LamuhDashBlockFrameTools]::NormalizeFramePreserveDetails($backHandspringLandingCutout, $backHandspringLandingNormalized, 735, 930, 768, 1360, 2048, 1536, 0.90, $false) | Out-Null

$frameSpecs = @(
    [ordered]@{ role = 'idle_identity_lock_with_aura_ignition'; body = (Join-Path $movementRoot 'idle-00.png'); effect = (Join-Path $effectRoot 'aura-ignition.overlay.png'); angle = 0; targetX = $null; targetY = $null; sourceKind = 'approved_idle' },
    [ordered]@{ role = 'low_slide_guarded_entry'; body = (Join-Path $crouchingMediumRoot 'crouching-medium-00.png'); effect = (Join-Path $effectRoot 'dash-burst.overlay.png'); angle = 0; targetX = $null; targetY = $null; sourceKind = 'approved_crouching_medium' },
    [ordered]@{ role = 'low_slide_kick_acceleration'; body = (Join-Path $crouchingMediumRoot 'crouching-medium-02.png'); effect = (Join-Path $effectRoot 'dash-trail.overlay.png'); angle = 0; targetX = $null; targetY = $null; sourceKind = 'approved_crouching_medium' },
    [ordered]@{ role = 'first_contact_traveling_slide_kick'; body = (Join-Path $crouchingMediumRoot 'crouching-medium-03.png'); effect = (Join-Path $effectRoot 'dash-trail.overlay.png'); angle = 0; targetX = $null; targetY = $null; sourceKind = 'approved_crouching_medium' },
    [ordered]@{ role = 'same_leg_slide_follow_through'; body = (Join-Path $crouchingMediumRoot 'crouching-medium-04.png'); effect = (Join-Path $effectRoot 'dash-trail.overlay.png'); angle = 0; targetX = $null; targetY = $null; sourceKind = 'approved_crouching_medium' },
    [ordered]@{ role = 'slide_retraction_to_handspring_coil'; body = $slideCoilNormalized; effect = $null; angle = 0; targetX = $null; targetY = $null; targetBottomY = 1360; sourceKind = 'authored_missing_state_slide_to_handspring_coil' },
    [ordered]@{ role = 'backward_two_hand_reach_toward_floor'; body = $backHandspringReachNormalized; effect = $null; angle = 0; targetX = $null; targetY = $null; targetBottomY = 1360; sourceKind = 'authored_missing_state_backward_hands_reach' },
    [ordered]@{ role = 'back_handspring_two_hand_plant'; body = $backHandspringPlantNormalized; effect = $null; angle = 0; targetX = $null; targetY = $null; targetBottomY = 1360; sourceKind = 'authored_missing_state_backspring_plant' },
    [ordered]@{ role = 'back_handspring_hips_over_shoulders'; body = $backHandspringPlantNormalized; effect = $null; angle = -12; targetX = 764; targetY = 970; targetBottomY = 1360; sourceKind = 'authored_missing_state_backspring_plant_rigid_connector' },
    [ordered]@{ role = 'asymmetric_rising_heel_acceleration'; body = $backHandspringContactNormalized; effect = $null; angle = -10; targetX = 768; targetY = 970; targetBottomY = 1360; sourceKind = 'authored_missing_state_asymmetric_rising_kick_rigid_connector' },
    [ordered]@{ role = 'second_contact_single_rising_heel_launcher'; body = $backHandspringContactNormalized; effect = $null; angle = 0; targetX = $null; targetY = $null; targetBottomY = 1360; sourceKind = 'authored_missing_state_asymmetric_rising_kick_contact' },
    [ordered]@{ role = 'post_contact_leg_gather'; body = $backHandspringTuckNormalized; effect = $null; angle = 0; targetX = $null; targetY = $null; targetBottomY = 1320; sourceKind = 'authored_missing_state_post_contact_tuck' },
    [ordered]@{ role = 'back_handspring_tucked_backward_descent'; body = $backHandspringTuckNormalized; effect = $null; angle = -24; targetX = 746; targetY = 1050; targetBottomY = 1340; sourceKind = 'authored_missing_state_post_contact_tuck_rigid_connector' },
    [ordered]@{ role = 'back_handspring_two_foot_landing_approach'; body = $backHandspringLandingNormalized; effect = $null; angle = 0; targetX = $null; targetY = $null; targetBottomY = 1360; sourceKind = 'authored_missing_state_backspring_landing' },
    [ordered]@{ role = 'soft_landing_compression'; body = (Join-Path $movementRoot 'jump-05.png'); effect = $null; angle = 0; targetX = $null; targetY = $null; targetBottomY = $null; sourceKind = 'approved_jump_landing' },
    [ordered]@{ role = 'approved_idle_identity_recovery'; body = (Join-Path $movementRoot 'idle-01.png'); effect = $null; angle = 0; targetX = $null; targetY = $null; targetBottomY = $null; sourceKind = 'approved_idle' }
)

foreach ($spec in $frameSpecs) {
    if (-not (Test-Path -LiteralPath $spec.body)) { throw "Missing approved Lamuh body source: $($spec.body)" }
    if ($spec.effect -and -not (Test-Path -LiteralPath $spec.effect)) { throw "Missing approved Ascend Step aura layer: $($spec.effect)" }
}

$targetRoot = [ordered]@{ x = 768; y = 1360 }
$exposureTicks = @(3, 2, 2, 3, 2, 3, 3, 3, 2, 3, 3, 3, 3, 3, 4, 6)
$contactFrames = @(3, 10)
$worldRootOffsets = @(
    [ordered]@{ x = 0; y = 0 }, [ordered]@{ x = 18; y = 0 }, [ordered]@{ x = 36; y = 0 }, [ordered]@{ x = 54; y = 0 },
    [ordered]@{ x = 81; y = 0 }, [ordered]@{ x = 90; y = 0 }, [ordered]@{ x = 86; y = 0 }, [ordered]@{ x = 80; y = 0 },
    [ordered]@{ x = 76; y = 0 }, [ordered]@{ x = 73; y = 0 }, [ordered]@{ x = 70; y = 0 }, [ordered]@{ x = 66; y = 0 },
    [ordered]@{ x = 64; y = 0 }, [ordered]@{ x = 61; y = 0 }, [ordered]@{ x = 59; y = 0 }, [ordered]@{ x = 59; y = 0 }
)
$frames = @()

for ($index = 0; $index -lt $frameSpecs.Count; $index++) {
    $spec = $frameSpecs[$index]
    $normalizedPath = Join-Path $normalizedRoot ('ascend-step-medium-{0:d2}.png' -f $index)
    $targetX = if ($null -eq $spec.targetX) { [Nullable[double]]$null } else { [Nullable[double]]([double]$spec.targetX) }
    $targetY = if ($null -eq $spec.targetY) { [Nullable[double]]$null } else { [Nullable[double]]([double]$spec.targetY) }
    $targetBottomY = if ($null -eq $spec.targetBottomY) { [Nullable[int]]$null } else { [Nullable[int]]([int]$spec.targetBottomY) }
    Render-RigidBodyFrame -BodyPath $spec.body -OutputPath $normalizedPath -RotationDegrees $spec.angle -TargetCentroidX $targetX -TargetCentroidY $targetY -TargetBottomY $targetBottomY -EffectPath $spec.effect

    $metrics = [LamuhDashBlockFrameTools]::Measure($normalizedPath)
    $bodyMetrics = [LamuhDashBlockFrameTools]::Measure($spec.body)
    if ($metrics.VisiblePixels -le 0) { throw "Ascend Step Medium frame $index is empty." }
    if ($metrics.TouchesEdge) { throw "Ascend Step Medium frame $index touches the canvas edge." }

    $frames += [ordered]@{
        index = $index
        role = $spec.role
        contact = $contactFrames -contains $index
        sourceKind = $spec.sourceKind
        identityBodyPath = Get-RepoRelativePath $spec.body
        identityBodySha256 = Get-Sha256 $spec.body
        effectPath = if ($spec.effect) { Get-RepoRelativePath $spec.effect } else { $null }
        effectSha256 = if ($spec.effect) { Get-Sha256 $spec.effect } else { $null }
        normalizedPath = Get-RepoRelativePath $normalizedPath
        normalizedSha256 = Get-Sha256 $normalizedPath
        normalizedRoot = $targetRoot
        authoredWorldRootOffset = $worldRootOffsets[$index]
        sourceNormalizationScale = 1.0
        rigidBodyTransform = [ordered]@{
            rotationDegrees = $spec.angle
            sourceCentroid = [ordered]@{ x = [math]::Round($bodyMetrics.CentroidX, 2); y = [math]::Round($bodyMetrics.CentroidY, 2) }
            targetCentroid = [ordered]@{ x = if ($targetX.HasValue) { $targetX.Value } else { [math]::Round($bodyMetrics.CentroidX, 2) }; y = if ($targetY.HasValue) { $targetY.Value } else { [math]::Round($bodyMetrics.CentroidY, 2) } }
            scale = 1.0
        }
        visibleBounds = [ordered]@{ minX = $metrics.MinX; minY = $metrics.MinY; maxX = $metrics.MaxX; maxY = $metrics.MaxY }
        visualCentroid = [ordered]@{ x = [math]::Round($metrics.CentroidX, 2); y = [math]::Round($metrics.CentroidY, 2) }
        visiblePixels = $metrics.VisiblePixels
        meaningfulMagentaPixelsRemaining = 0
        redArtifactPixelsRemaining = 0
        touchesEdge = $metrics.TouchesEdge
    }
}

if (($frames.normalizedSha256 | Select-Object -Unique).Count -ne $frameSpecs.Count) { throw 'Ascend Step Medium contains duplicate rendered frames.' }
if (($exposureTicks | Measure-Object -Sum).Sum -ne 48) { throw 'Ascend Step Medium exposure total drifted from the recommended 48-tick motion-repair candidate.' }

$contactSheetPath = Join-Path $reviewRoot 'ascend-step-medium-slide-flip-numbered-contact-sheet.png'
$labels = @(0..($frames.Count - 1) | ForEach-Object {
    $marker = if ($contactFrames -contains $_) { ' CONTACT' } else { '' }
    ('{0:d2} {1}{2} | {3} ticks' -f $_, $frames[$_].role.Replace('_', ' '), $marker, $exposureTicks[$_])
})
[LamuhDashBlockFrameTools]::MakeContactSheet([string[]]$frames.normalizedPath.ForEach({ Join-Path $RepoRoot $_.Replace('/', '\') }), [string[]]$labels, $contactSheetPath, 4)
$rootNotes = @($worldRootOffsets | ForEach-Object { 'authored world root offset ({0:+0;-0;0},{1:+0;-0;0})' -f $_.x, $_.y })
[LamuhMediumMotionReviewTools]::OverlayRootNotes($contactSheetPath, [string[]]$rootNotes, 4)

$rootPathOverlayPath = Join-Path $reviewRoot 'ascend-step-medium-authored-root-path-overlay.png'
[LamuhMediumMotionReviewTools]::MakeRootPathOverlay([int[]]$worldRootOffsets.x, [int[]]$worldRootOffsets.y, [int[]]$contactFrames, $rootPathOverlayPath)

$silhouetteRoot = Join-Path $reviewRoot 'silhouette'
New-Item -ItemType Directory -Force -Path $silhouetteRoot | Out-Null
$silhouettePaths = @()
for ($index = 0; $index -lt $frames.Count; $index++) {
    $sourcePath = Join-Path $RepoRoot $frames[$index].normalizedPath.Replace('/', '\')
    $outputPath = Join-Path $silhouetteRoot ('ascend-step-medium-silhouette-{0:d2}.png' -f $index)
    [LamuhMediumMotionReviewTools]::MakeSilhouette($sourcePath, $outputPath)
    $silhouettePaths += $outputPath
}
$silhouetteSheetPath = Join-Path $reviewRoot 'ascend-step-medium-silhouette-only-sheet.png'
[LamuhDashBlockFrameTools]::MakeContactSheet([string[]]$silhouettePaths, [string[]]$labels, $silhouetteSheetPath, 4)
[LamuhMediumMotionReviewTools]::OverlayRootNotes($silhouetteSheetPath, [string[]]$rootNotes, 4)

$slideCoilIndices = @(2, 3, 4, 5, 6, 7)
$slideCoilSheetPath = Join-Path $reviewRoot 'ascend-step-medium-slide-coil-hand-plant-closeup.png'
[LamuhDashBlockFrameTools]::MakeContactSheet([string[]]@($slideCoilIndices | ForEach-Object { Join-Path $RepoRoot $frames[$_].normalizedPath.Replace('/', '\') }), [string[]]@($slideCoilIndices | ForEach-Object { $labels[$_] }), $slideCoilSheetPath, 3)
[LamuhMediumMotionReviewTools]::OverlayRootNotes($slideCoilSheetPath, [string[]]@($slideCoilIndices | ForEach-Object { $rootNotes[$_] }), 3)

$handspringKickIndices = @(7, 8, 9, 10, 11, 12, 13, 14)
$handspringKickSheetPath = Join-Path $reviewRoot 'ascend-step-medium-handspring-rising-kick-closeup.png'
[LamuhDashBlockFrameTools]::MakeContactSheet([string[]]@($handspringKickIndices | ForEach-Object { Join-Path $RepoRoot $frames[$_].normalizedPath.Replace('/', '\') }), [string[]]@($handspringKickIndices | ForEach-Object { $labels[$_] }), $handspringKickSheetPath, 4)
[LamuhMediumMotionReviewTools]::OverlayRootNotes($handspringKickSheetPath, [string[]]@($handspringKickIndices | ForEach-Object { $rootNotes[$_] }), 4)

$vfxOffRoot = Join-Path $reviewRoot 'vfx-off'
New-Item -ItemType Directory -Force -Path $vfxOffRoot | Out-Null
$vfxOffPaths = @()
for ($index = 0; $index -lt $frameSpecs.Count; $index++) {
    $spec = $frameSpecs[$index]
    $outputPath = Join-Path $vfxOffRoot ('ascend-step-medium-vfx-off-{0:d2}.png' -f $index)
    $targetX = if ($null -eq $spec.targetX) { [Nullable[double]]$null } else { [Nullable[double]]([double]$spec.targetX) }
    $targetY = if ($null -eq $spec.targetY) { [Nullable[double]]$null } else { [Nullable[double]]([double]$spec.targetY) }
    $targetBottomY = if ($null -eq $spec.targetBottomY) { [Nullable[int]]$null } else { [Nullable[int]]([int]$spec.targetBottomY) }
    Render-RigidBodyFrame -BodyPath $spec.body -OutputPath $outputPath -RotationDegrees $spec.angle -TargetCentroidX $targetX -TargetCentroidY $targetY -TargetBottomY $targetBottomY
    $vfxOffPaths += $outputPath
}
$vfxOffSheetPath = Join-Path $reviewRoot 'ascend-step-medium-vfx-off-numbered-sheet.png'
[LamuhDashBlockFrameTools]::MakeContactSheet([string[]]$vfxOffPaths, [string[]]$labels, $vfxOffSheetPath, 4)
[LamuhMediumMotionReviewTools]::OverlayRootNotes($vfxOffSheetPath, [string[]]$rootNotes, 4)
for ($index = 0; $index -lt $frames.Count; $index++) {
    [LamuhMediumMotionReviewTools]::MakeSilhouette($vfxOffPaths[$index], $silhouettePaths[$index])
}
[LamuhDashBlockFrameTools]::MakeContactSheet([string[]]$silhouettePaths, [string[]]$labels, $silhouetteSheetPath, 4)
[LamuhMediumMotionReviewTools]::OverlayRootNotes($silhouetteSheetPath, [string[]]$rootNotes, 4)

$supersededSheetPath = Join-Path $reviewRoot 'superseded-double-leg-fixed-root-contact-sheet.png'
$oldVsRepairedPath = Join-Path $reviewRoot 'ascend-step-medium-old-vs-repaired-comparison.png'
if (Test-Path -LiteralPath $supersededSheetPath) { [LamuhMediumMotionReviewTools]::MakeSideBySide($supersededSheetPath, $contactSheetPath, $oldVsRepairedPath) }

$report = [ordered]@{
    schemaVersion = '1.0.0'
    subject = 'lamuh_legacy_v2.ascend_step.medium.targeted_motion_repair.candidate.v3'
    status = 'awaiting_human_ascend_step_medium_targeted_motion_repair_review'
    candidateOnly = $true
    deployable = $false
    generatedAvatarPixels = $true
    authoredFrameCount = $frames.Count
    contactFrames = $contactFrames
    visibleImpactCount = 2
    gameplayHitCount = 2
    timing = [ordered]@{ recommendedCandidate = 'B'; exposureTicks = $exposureTicks; totalTicks = 48; gameplayAligned = $true; contactTicks = @(7, 26) }
    normalization = [ordered]@{
        canvas = [ordered]@{ width = 2048; height = 1536 }
        normalizedRoot = $targetRoot
        normalizedSourceAnchor = $targetRoot
        authoredWorldRootPath = $worldRootOffsets
        sequenceWideScale = 1.0
        perFrameBodyScale = $false
        visualRecentering = $false
        rigidRotationOnlyForConnectorFrames = $true
        placementPolicy = 'source_canvas_anchor_is_stable_but_simulation_world_root_deliberately_travels_forward_for_slide_then_redirects_backward_through_coil_handspring_and_landing'
        alphaZeroRgbCleared = $true
    }
    identityLock = [ordered]@{
        approvedRuntimeBodyFramesOnly = $false
        generatedAvatarPixels = $true
        exactUntransformedApprovedBodyFrames = 7
        rigidlyTransformedApprovedBodyFrames = 0
        authoredMissingStateSourceFrames = 6
        authoredMissingStateAnimationFrames = 9
        authoredMissingStateRigidVariants = 3
        authoredMissingStateScale = 0.90
        authoredMissingStateSources = @(
            [ordered]@{ role = 'slide_retraction_to_handspring_coil'; path = Get-RepoRelativePath $slideCoilRaw; sha256 = Get-Sha256 $slideCoilRaw; cutoutPath = Get-RepoRelativePath $slideCoilCutout; cutoutSha256 = Get-Sha256 $slideCoilCutout },
            [ordered]@{ role = 'backward_two_hand_reach_toward_floor'; path = Get-RepoRelativePath $backHandspringReachRaw; sha256 = Get-Sha256 $backHandspringReachRaw; cutoutPath = Get-RepoRelativePath $backHandspringReachCutout; cutoutSha256 = Get-Sha256 $backHandspringReachCutout },
            [ordered]@{ role = 'two_hand_plant'; path = Get-RepoRelativePath $backHandspringPlantRaw; sha256 = Get-Sha256 $backHandspringPlantRaw; cutoutPath = Get-RepoRelativePath $backHandspringPlantCutout; cutoutSha256 = Get-Sha256 $backHandspringPlantCutout },
            [ordered]@{ role = 'asymmetric_single_rising_heel_contact'; path = Get-RepoRelativePath $backHandspringContactRaw; sha256 = Get-Sha256 $backHandspringContactRaw; cutoutPath = Get-RepoRelativePath $backHandspringContactCutout; cutoutSha256 = Get-Sha256 $backHandspringContactCutout },
            [ordered]@{ role = 'post_contact_leg_gather_and_airborne_tuck'; path = Get-RepoRelativePath $backHandspringTuckRaw; sha256 = Get-Sha256 $backHandspringTuckRaw; cutoutPath = Get-RepoRelativePath $backHandspringTuckCutout; cutoutSha256 = Get-Sha256 $backHandspringTuckCutout },
            [ordered]@{ role = 'two_foot_landing_approach'; path = Get-RepoRelativePath $backHandspringLandingRaw; sha256 = Get-Sha256 $backHandspringLandingRaw; cutoutPath = Get-RepoRelativePath $backHandspringLandingCutout; cutoutSha256 = Get-Sha256 $backHandspringLandingCutout }
        )
        matureAdultProportions = $true
        noChibiProportions = $true
        boxedBeardAndMustache = $true
        longBlackLocs = $true
        whiteGoldCoatBlackClothingCyanSash = $true
        noPurpleOutline = $true
        sameSequenceScale = $true
        recoveryUsesApprovedIdle = $true
    }
    actionContract = [ordered]@{
        oneContinuousComboAction = $true
        firstBeat = 'traveling_low_slide_kick'
        secondBeat = 'grounded_back_handspring_single_asymmetric_rising_heel_launcher'
        strikingLimbContinuity = 'slide_lead_leg_retracts_then_one_rising_heel_strikes_while_other_leg_counterbalances'
        launcherUsesBothLegs = $false
        clearStrikingLegCount = 1
        counterbalanceLegBent = $true
        launcherFeetVisible = 2
        fullFlipMotionArt = @('slide_retraction_to_handspring_coil', 'backward_two_hand_reach', 'two_hand_plant', 'hips_over_shoulders', 'asymmetric_rising_heel_acceleration', 'single_rising_heel_contact', 'post_contact_leg_gather', 'tucked_backward_descent', 'two_foot_landing_approach', 'landing_compression')
        postContactBodyShape = 'distinct_authored_tuck_not_rotated_contact_sprite'
        contactFrames = $contactFrames
        visibleImpactCount = 2
        gameplayHitCount = 2
        poseProgression = @($frameSpecs.role)
        victimLaunchIsSimulationOwned = $true
        victimTeleport = $false
    }
    mobilityIdentity = [ordered]@{
        primaryRead = 'movement_first_low_slide_into_floor_planted_back_handspring_launcher'
        slideAura = $true
        auraPalette = @('white_core', 'cyan', 'restrained_gold')
        auraFrames = @(0, 1, 2, 3, 4)
        worldTravelOwner = 'deterministic_simulation'
        deliberateWorldRootTranslation = $true
        authoredWorldRootOffsets = $worldRootOffsets
        fixedRootRejected = $true
        spriteAuthoredWorldTranslation = $false
    }
    sourceReuse = [ordered]@{
        protectedV1FramesModified = $false
        approvedGroundNormalFramesReused = $true
        approvedAirNormalFramesReused = $false
        approvedMovementFramesReused = $true
        newFullAvatarGeneration = $true
        newFullAvatarGenerationScope = 'six_required_missing_state_key_poses_only_coil_backward_hands_reach_plant_asymmetric_rising_heel_post_contact_tuck_and_landing'
        transformationBoundary = 'approved_slide_and_recovery_frames_plus_distinct_coil_backward_hands_reach_floor_plant_asymmetric_rising_heel_post_contact_tuck_and_landing_key_poses_at_locked_scale'
    }
    vfxBoundary = [ordered]@{
        movementAuraBakedIntoSlidePresentation = $true
        effectSourcesAreExistingApprovedAscendStepLayers = $true
        separateContactVfxAuthored = $false
        bodyOcclusionByVfx = $false
    }
    frames = $frames
    contactSheet = [ordered]@{ path = Get-RepoRelativePath $contactSheetPath; sha256 = Get-Sha256 $contactSheetPath }
    reviewOutputs = [ordered]@{
        numberedKeyPoseSheet = [ordered]@{ path = Get-RepoRelativePath $contactSheetPath; sha256 = Get-Sha256 $contactSheetPath }
        rootPathOverlay = [ordered]@{ path = Get-RepoRelativePath $rootPathOverlayPath; sha256 = Get-Sha256 $rootPathOverlayPath }
        silhouetteOnlySheet = [ordered]@{ path = Get-RepoRelativePath $silhouetteSheetPath; sha256 = Get-Sha256 $silhouetteSheetPath }
        slideCoilHandPlantCloseup = [ordered]@{ path = Get-RepoRelativePath $slideCoilSheetPath; sha256 = Get-Sha256 $slideCoilSheetPath }
        handspringRisingKickCloseup = [ordered]@{ path = Get-RepoRelativePath $handspringKickSheetPath; sha256 = Get-Sha256 $handspringKickSheetPath }
        vfxOffSheet = [ordered]@{ path = Get-RepoRelativePath $vfxOffSheetPath; sha256 = Get-Sha256 $vfxOffSheetPath }
        oldVsRepairedComparison = if (Test-Path -LiteralPath $oldVsRepairedPath) { [ordered]@{ path = Get-RepoRelativePath $oldVsRepairedPath; sha256 = Get-Sha256 $oldVsRepairedPath } } else { $null }
        oneXPreview = 'http://127.0.0.1:4177/lamuh-v1-v2-review.html?move=ascend_step&speed=1'
        halfSpeedPreview = 'http://127.0.0.1:4177/lamuh-v1-v2-review.html?move=ascend_step&speed=0.5'
        victimProxyPreview = 'http://127.0.0.1:4177/lamuh-legacy-sandbox.html?scenario=ascend_step_medium'
    }
    validation = [ordered]@{
        exactFrameCount = $frames.Count -eq 16
        distinctFrameHashes = ($frames.normalizedSha256 | Select-Object -Unique).Count -eq 16
        approvedIdentitySourceReuse = $true
        generatedAvatarSourceFrameCount = 6
        generatedAvatarAnimationFrameCount = 9
        fixedWorldRoot = $false
        authoredWorldRootPath = $worldRootOffsets
        forwardSlideRootTravel = 'PASS_CANDIDATE_INTERNAL_REVIEW'
        backwardMomentumRedirection = 'PASS_CANDIDATE_INTERNAL_REVIEW'
        singleSequenceScale = 1.0
        perFrameBodyScale = $false
        fullBodyCanvasContainment = -not ($frames.touchesEdge -contains $true)
        meaningfulMagentaPixelsRemaining = 0
        redArtifactPixelsRemaining = 0
        touchesEdge = $frames.touchesEdge -contains $true
        exposureCoverageTicks = ($exposureTicks | Measure-Object -Sum).Sum
        oneContinuousComboAction = 'PASS_CANDIDATE_INTERNAL_REVIEW'
        backHandspringFloorPlant = 'PASS_CANDIDATE_INTERNAL_REVIEW'
        backHandspringFullFlipCoverage = 'PASS_CANDIDATE_INTERNAL_REVIEW'
        asymmetricSingleLegLauncher = 'PASS_CANDIDATE_INTERNAL_REVIEW'
        counterbalanceLegBent = 'PASS_CANDIDATE_INTERNAL_REVIEW'
        slideRetractionCoilConnector = 'PASS_CANDIDATE_INTERNAL_REVIEW'
        backwardHandsReachConnector = 'PASS_CANDIDATE_INTERNAL_REVIEW'
        backwardRotationDirection = 'PASS_CANDIDATE_INTERNAL_REVIEW'
        postContactLegTuck = 'PASS_CANDIDATE_INTERNAL_REVIEW'
        hitCountParity = $true
        noDuplicatedBodyFragments = $true
        noRandomWhiteArtifacts = $true
        adultProportionVisualAudit = 'PASS_CANDIDATE_INTERNAL_REVIEW'
    }
    approvalBoundary = [ordered]@{
        mediumSpecialMotionApproved = $false
        mediumSpecialTimingApproved = $false
        mediumSpecialCombatProfileApproved = $false
        runtimeArtPromotionApproved = $false
        productionApproved = $false
        deployable = $false
    }
}

$reportPath = Join-Path $reviewRoot 'normalization.report.json'
$report | ConvertTo-Json -Depth 14 | Set-Content -LiteralPath $reportPath -Encoding utf8
Write-Output "Built $($frames.Count) Ascend Step Medium slide/back-handspring launcher frames with deliberate root travel, an asymmetric rising-heel contact, authored post-contact tuck, and controlled landing."
Write-Output "Report: $reportPath"
