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

if (-not ('LamuhStandingLightNormalizer' -as [type])) {
    Add-Type -TypeDefinition @'
using System;
using System.Collections.Generic;
using System.Drawing;
using System.Drawing.Imaging;
using System.IO;
using System.Runtime.InteropServices;

public sealed class LamuhStandingLightMetrics
{
    public int MinX { get; set; }
    public int MinY { get; set; }
    public int MaxX { get; set; }
    public int MaxY { get; set; }
    public double CentroidX { get; set; }
    public double CentroidY { get; set; }
    public long VisiblePixels { get; set; }
    public long TransparentPixels { get; set; }
    public long BackgroundPixelsRemoved { get; set; }
    public long MagentaPixelsNeutralized { get; set; }
    public bool TouchesEdge { get; set; }
}

public static class LamuhStandingLightNormalizer
{
    private static bool IsGreenScreen(byte red, byte green, byte blue)
    {
        return green > 110 && green > red * 1.45 && green > blue * 1.45;
    }

    private static bool IsNeutralBackdrop(byte red, byte green, byte blue)
    {
        int min = Math.Min(red, Math.Min(green, blue));
        int max = Math.Max(red, Math.Max(green, blue));
        return (min >= 188 && max - min <= 36) || IsGreenScreen(red, green, blue);
    }

    private static bool IsMeaningfulMagenta(byte red, byte green, byte blue)
    {
        return red > 45 && blue > 45 && red > green * 1.18 && blue > green * 1.18;
    }

    public static LamuhStandingLightMetrics Normalize(
        string inputPath,
        string outputPath,
        int rawRootX,
        int rawRootY,
        int targetRootX,
        int targetRootY,
        int outputWidth,
        int outputHeight,
        double sequenceWideScale)
    {
        using (var loaded = new Bitmap(inputPath))
        using (var source = new Bitmap(loaded.Width, loaded.Height, PixelFormat.Format32bppArgb))
        {
            using (var graphics = Graphics.FromImage(source))
            {
                graphics.CompositingMode = System.Drawing.Drawing2D.CompositingMode.SourceCopy;
                graphics.DrawImage(loaded, 0, 0, loaded.Width, loaded.Height);
            }

            var rectangle = new Rectangle(0, 0, source.Width, source.Height);
            var sourceData = source.LockBits(rectangle, ImageLockMode.ReadOnly, PixelFormat.Format32bppArgb);
            int sourceStride = sourceData.Stride;
            byte[] sourceBytes = new byte[sourceStride * source.Height];
            Marshal.Copy(sourceData.Scan0, sourceBytes, 0, sourceBytes.Length);
            source.UnlockBits(sourceData);

            int pixelCount = source.Width * source.Height;
            bool[] background = new bool[pixelCount];
            int[] queue = new int[pixelCount];
            int head = 0;
            int tail = 0;

            Action<int, int> enqueue = (x, y) => {
                int linear = y * source.Width + x;
                if (background[linear]) return;
                int offset = y * sourceStride + x * 4;
                byte blue = sourceBytes[offset];
                byte green = sourceBytes[offset + 1];
                byte red = sourceBytes[offset + 2];
                byte alpha = sourceBytes[offset + 3];
                if (alpha <= 8 || IsNeutralBackdrop(red, green, blue))
                {
                    background[linear] = true;
                    queue[tail++] = linear;
                }
            };

            for (int x = 0; x < source.Width; x++) { enqueue(x, 0); enqueue(x, source.Height - 1); }
            for (int y = 1; y < source.Height - 1; y++) { enqueue(0, y); enqueue(source.Width - 1, y); }

            while (head < tail)
            {
                int linear = queue[head++];
                int x = linear % source.Width;
                int y = linear / source.Width;
                if (x > 0) enqueue(x - 1, y);
                if (x + 1 < source.Width) enqueue(x + 1, y);
                if (y > 0) enqueue(x, y - 1);
                if (y + 1 < source.Height) enqueue(x, y + 1);
            }

            using (var output = new Bitmap(outputWidth, outputHeight, PixelFormat.Format32bppArgb))
            {
                var outputRectangle = new Rectangle(0, 0, outputWidth, outputHeight);
                var outputData = output.LockBits(outputRectangle, ImageLockMode.WriteOnly, PixelFormat.Format32bppArgb);
                int outputStride = outputData.Stride;
                byte[] outputBytes = new byte[outputStride * outputHeight];
                long visible = 0;
                long removed = 0;
                long magenta = 0;
                double weightedX = 0;
                double weightedY = 0;
                int minX = outputWidth;
                int minY = outputHeight;
                int maxX = -1;
                int maxY = -1;

                for (int sourceIndex = 0; sourceIndex < background.Length; sourceIndex++)
                {
                    if (background[sourceIndex]) removed++;
                }

                for (int destinationY = 0; destinationY < outputHeight; destinationY++)
                {
                    int sourceY = rawRootY + (int)Math.Round((destinationY - targetRootY) / sequenceWideScale);
                    if (sourceY < 0 || sourceY >= source.Height) continue;
                    for (int destinationX = 0; destinationX < outputWidth; destinationX++)
                    {
                        int sourceX = rawRootX + (int)Math.Round((destinationX - targetRootX) / sequenceWideScale);
                        if (sourceX < 0 || sourceX >= source.Width) continue;
                        int linear = sourceY * source.Width + sourceX;
                        if (background[linear]) continue;
                        int sourceOffset = sourceY * sourceStride + sourceX * 4;
                        byte blue = sourceBytes[sourceOffset];
                        byte green = sourceBytes[sourceOffset + 1];
                        byte red = sourceBytes[sourceOffset + 2];
                        byte alpha = sourceBytes[sourceOffset + 3];
                        if (alpha <= 8) continue;
                        if (IsGreenScreen(red, green, blue)) continue;
                        if (IsMeaningfulMagenta(red, green, blue))
                        {
                            byte ink = (byte)Math.Min(34, Math.Round(red * .08 + green * .18 + blue * .05));
                            red = ink; green = ink; blue = ink; magenta++;
                        }

                        int destinationOffset = destinationY * outputStride + destinationX * 4;
                        outputBytes[destinationOffset] = blue;
                        outputBytes[destinationOffset + 1] = green;
                        outputBytes[destinationOffset + 2] = red;
                        outputBytes[destinationOffset + 3] = alpha;
                        visible++;
                        weightedX += destinationX;
                        weightedY += destinationY;
                        minX = Math.Min(minX, destinationX);
                        minY = Math.Min(minY, destinationY);
                        maxX = Math.Max(maxX, destinationX);
                        maxY = Math.Max(maxY, destinationY);
                    }
                }

                Marshal.Copy(outputBytes, 0, outputData.Scan0, outputBytes.Length);
                output.UnlockBits(outputData);
                Directory.CreateDirectory(Path.GetDirectoryName(outputPath));
                output.Save(outputPath, ImageFormat.Png);

                return new LamuhStandingLightMetrics {
                    MinX = minX,
                    MinY = minY,
                    MaxX = maxX,
                    MaxY = maxY,
                    CentroidX = visible == 0 ? 0 : weightedX / visible,
                    CentroidY = visible == 0 ? 0 : weightedY / visible,
                    VisiblePixels = visible,
                    TransparentPixels = (long)outputWidth * outputHeight - visible,
                    BackgroundPixelsRemoved = removed,
                    MagentaPixelsNeutralized = magenta,
                    TouchesEdge = minX <= 0 || minY <= 0 || maxX >= outputWidth - 1 || maxY >= outputHeight - 1
                };
            }
        }
    }
}
'@ -ReferencedAssemblies @('System.Drawing.dll', 'System.dll', 'System.Core.dll')
}

$reviewRoot = Join-Path $RepoRoot 'tools\nga-forge\review\lamuh-legacy-v2-crouching-light-v1'
$rawRoot = Join-Path $reviewRoot 'raw'
$normalizedRoot = Join-Path $reviewRoot 'normalized'
New-Item -ItemType Directory -Force -Path $normalizedRoot | Out-Null

$frames = @(
    [ordered]@{ index = 0; role = 'guarded_crouch_entry'; raw = 'crouching-light-00-guarded-entry-v1.png'; rawRootX = 610; rawRootY = 1190; sourceScaleCorrection = 0.98; bodyScaleCorrection = 0.64 },
    [ordered]@{ index = 1; role = 'lead_palm_low_chamber'; raw = 'crouching-light-01-low-chamber-v1.png'; rawRootX = 610; rawRootY = 1185; sourceScaleCorrection = 1.0; bodyScaleCorrection = 0.64 },
    [ordered]@{ index = 2; role = 'low_palm_acceleration'; raw = 'crouching-light-02-low-acceleration-v1.png'; rawRootX = 610; rawRootY = 1189; sourceScaleCorrection = 1.01; bodyScaleCorrection = 0.61 },
    [ordered]@{ index = 3; role = 'single_low_palm_contact'; raw = 'crouching-light-03-low-contact-body-v1.png'; rawRootX = 615; rawRootY = 1173; sourceScaleCorrection = 1.03; bodyScaleCorrection = 0.64 },
    [ordered]@{ index = 4; role = 'same_arm_low_follow_through'; raw = 'crouching-light-04-low-follow-through-v1.png'; rawRootX = 615; rawRootY = 1172; sourceScaleCorrection = 1.03; bodyScaleCorrection = 0.65 },
    [ordered]@{ index = 5; role = 'lead_arm_crouched_recoil'; raw = 'crouching-light-05-crouched-recoil-v1.png'; rawRootX = 610; rawRootY = 1176; sourceScaleCorrection = 1.03; bodyScaleCorrection = 0.61 },
    [ordered]@{ index = 6; role = 'connected_crouch_recovery'; raw = 'crouching-light-06-connected-recovery-v1.png'; rawRootX = 610; rawRootY = 1181; sourceScaleCorrection = 1.02; bodyScaleCorrection = 0.60 }
)

$targetRoot = [ordered]@{ x = 768; y = 1360 }
$sequenceWideScale = 1.0
$reportFrames = @()
foreach ($frame in $frames) {
    $sourcePath = Join-Path $rawRoot $frame.raw
    if (-not (Test-Path -LiteralPath $sourcePath)) { throw "Missing Crouching Light raw candidate: $sourcePath" }
    $outputName = ('crouching-light-{0:d2}.png' -f $frame.index)
    $outputPath = Join-Path $normalizedRoot $outputName
    $authoredScale = $sequenceWideScale * $frame.sourceScaleCorrection * $frame.bodyScaleCorrection
    $metrics = [LamuhStandingLightNormalizer]::Normalize($sourcePath, $outputPath, $frame.rawRootX, $frame.rawRootY, $targetRoot.x, $targetRoot.y, 2048, 1536, $authoredScale)
    $reportFrames += [ordered]@{
        index = $frame.index
        role = $frame.role
        rawPath = (Resolve-Path -LiteralPath $sourcePath).Path.Substring($RepoRoot.Length + 1).Replace('\', '/')
        rawSha256 = Get-Sha256 -LiteralPath $sourcePath
        normalizedPath = (Resolve-Path -LiteralPath $outputPath).Path.Substring($RepoRoot.Length + 1).Replace('\', '/')
        normalizedSha256 = Get-Sha256 -LiteralPath $outputPath
        authoredRawRoot = [ordered]@{ x = $frame.rawRootX; y = $frame.rawRootY }
        sourceScaleCorrection = $frame.sourceScaleCorrection
        bodyScaleCorrection = $frame.bodyScaleCorrection
        authoredScale = [math]::Round($authoredScale, 5)
        normalizedRoot = $targetRoot
        visibleBounds = [ordered]@{ minX = $metrics.MinX; minY = $metrics.MinY; maxX = $metrics.MaxX; maxY = $metrics.MaxY }
        visualCentroid = [ordered]@{ x = [math]::Round($metrics.CentroidX, 2); y = [math]::Round($metrics.CentroidY, 2) }
        visiblePixels = $metrics.VisiblePixels
        transparentPixels = $metrics.TransparentPixels
        backgroundPixelsRemoved = $metrics.BackgroundPixelsRemoved
        magentaPixelsNeutralized = $metrics.MagentaPixelsNeutralized
        meaningfulMagentaPixelsRemaining = 0
        touchesEdge = $metrics.TouchesEdge
    }
}

$contactSource = Join-Path $rawRoot 'crouching-light-03-low-contact-hit-v1.png'
$contactOutput = Join-Path $normalizedRoot 'crouching-light-03-hit-composite.png'
$contactScale = $sequenceWideScale * $frames[3].sourceScaleCorrection * $frames[3].bodyScaleCorrection
$contactMetrics = [LamuhStandingLightNormalizer]::Normalize($contactSource, $contactOutput, 615, 1173, $targetRoot.x, $targetRoot.y, 2048, 1536, $contactScale)
$contactPresentation = [ordered]@{
    path = (Resolve-Path -LiteralPath $contactOutput).Path.Substring($RepoRoot.Length + 1).Replace('\', '/')
    sha256 = Get-Sha256 -LiteralPath $contactOutput
    sourcePath = (Resolve-Path -LiteralPath $contactSource).Path.Substring($RepoRoot.Length + 1).Replace('\', '/')
    sourceSha256 = Get-Sha256 -LiteralPath $contactSource
    visibleBounds = [ordered]@{ minX = $contactMetrics.MinX; minY = $contactMetrics.MinY; maxX = $contactMetrics.MaxX; maxY = $contactMetrics.MaxY }
    touchesEdge = $contactMetrics.TouchesEdge
    intendedOutcomes = @('hit', 'block')
    prohibitedOutcome = 'whiff'
    note = 'Outcome-routed single contact accent; body-only frame remains authoritative on whiff.'
}

$heights = @($reportFrames | ForEach-Object { $_.visibleBounds.maxY - $_.visibleBounds.minY + 1 })
$minHeight = ($heights | Measure-Object -Minimum).Minimum
$maxHeight = ($heights | Measure-Object -Maximum).Maximum
$heightDrift = if ($maxHeight -gt 0) { [math]::Round(($maxHeight - $minHeight) / $maxHeight, 4) } else { 1 }

$contactSheetPath = Join-Path $reviewRoot 'crouching-light-numbered-contact-sheet.png'
$board = New-Object System.Drawing.Bitmap 1660, 940
$boardGraphics = [System.Drawing.Graphics]::FromImage($board)
$titleFont = New-Object System.Drawing.Font('Segoe UI', 20, [System.Drawing.FontStyle]::Bold)
$labelFont = New-Object System.Drawing.Font('Segoe UI', 13, [System.Drawing.FontStyle]::Bold)
$noteFont = New-Object System.Drawing.Font('Segoe UI', 10, [System.Drawing.FontStyle]::Regular)
$goldPen = New-Object System.Drawing.Pen([System.Drawing.Color]::FromArgb(255, 214, 166, 56), 4)
$panelPen = New-Object System.Drawing.Pen([System.Drawing.Color]::FromArgb(110, 255, 255, 255), 1)
$rootPen = New-Object System.Drawing.Pen([System.Drawing.Color]::FromArgb(210, 255, 224, 138), 2)
try {
    $boardGraphics.Clear([System.Drawing.Color]::FromArgb(255, 6, 11, 17))
    $boardGraphics.DrawString('LAMUH LEGACY V2 - CROUCHING LIGHT - NUMBERED FRAME SCRUB', $titleFont, [System.Drawing.Brushes]::Goldenrod, 26, 18)
    $boardGraphics.DrawString('Authored facing - fixed root - frame 03 is the only visible contact - candidate only', $noteFont, [System.Drawing.Brushes]::LightGray, 28, 53)
    foreach ($frame in $reportFrames) {
        $column = $frame.index % 4
        $row = [math]::Floor($frame.index / 4)
        $panelX = 18 + $column * 410
        $panelY = 88 + $row * 416
        $panelRectangle = New-Object System.Drawing.Rectangle $panelX, $panelY, 394, 394
        $boardGraphics.DrawRectangle($panelPen, $panelRectangle)
        if ($frame.index -eq 3) { $boardGraphics.DrawRectangle($goldPen, $panelRectangle) }
        $image = [System.Drawing.Image]::FromFile((Join-Path $normalizedRoot ('crouching-light-{0:d2}.png' -f $frame.index)))
        try { $boardGraphics.DrawImage($image, $panelX + 10, $panelY + 36, 374, 350) }
        finally { $image.Dispose() }
        $boardGraphics.DrawString(('{0:d2}  {1}' -f $frame.index, $frame.role.Replace('_', ' ')), $labelFont, [System.Drawing.Brushes]::White, $panelX + 12, $panelY + 8)
        $rootX = $panelX + 10 + [math]::Round(($targetRoot.x / 2048) * 374)
        $rootY = $panelY + 36 + [math]::Round(($targetRoot.y / 1536) * 350)
        $boardGraphics.DrawLine($rootPen, $rootX - 6, $rootY, $rootX + 6, $rootY)
        $boardGraphics.DrawLine($rootPen, $rootX, $rootY - 6, $rootX, $rootY + 6)
    }
    $board.Save($contactSheetPath, [System.Drawing.Imaging.ImageFormat]::Png)
}
finally {
    $rootPen.Dispose(); $panelPen.Dispose(); $goldPen.Dispose(); $noteFont.Dispose(); $labelFont.Dispose(); $titleFont.Dispose(); $boardGraphics.Dispose(); $board.Dispose()
}

$report = [ordered]@{
    schemaVersion = '1.0.0'
    subject = 'lamuh_legacy_v2.crouching_light.distinct_low_single_hit_sequence.candidate.v1'
    status = 'candidate-only'
    deployable = $false
    sourceFrameCount = 4
    authoredFrameCount = 7
    contactFrame = 3
    visibleImpactCount = 1
    contactPresentation = $contactPresentation
    normalization = [ordered]@{
        canvas = [ordered]@{ width = 2048; height = 1536 }
        sequenceWideScale = $sequenceWideScale
        scalePolicy = 'fixed_runtime_scale_after_recorded_source_art_camera_correction'
        perFrameRendererScale = $false
        sourceArtCameraCorrection = 'recorded_per_frame_source_art_camera_corrections_only_when_required_to_match_neighboring_anatomical_scale'
        placementPolicy = 'authored_root_landmark_alignment_not_visual_recentering'
        normalizedRoot = $targetRoot
        runtimeMirrorAxisX = $targetRoot.x
        transparentPaddingRequired = $true
        alphaZeroRgbCleared = $true
        backgroundRemoval = 'preserve_alpha_or_edge_connected_neutral_backdrop_flood_fill_v1'
        magentaPolicy = 'legacy_magenta_dark_ink_replacement'
        chromaCleanup = 'edge_connected_neutral_or_green_background_plus_strong_green_spill_alpha_removal'
        measuredVisibleHeightDrift = $heightDrift
    }
    sourceRepairReason = 'V1 Crouching Light aliases Standing Light artwork and has no distinct low animation. V2 modernization preserves the compact lead-arm rhythm, planted base, fast acceleration, body momentum, coat and loc lag, and guard-return direction while authoring a true low palm-check silhouette with one-visible-impact parity.'
    visualValidation = [ordered]@{
        purpleOutlineRemoved = $true
        meaningfulMagentaPixelsRemaining = 0
        note = 'Every visible source pixel matching the legacy magenta-outline predicate is replaced with neutral dark ink before the normalized PNG is written.'
    }
    reviewArtifacts = [ordered]@{
        numberedContactSheet = [ordered]@{
            path = (Resolve-Path -LiteralPath $contactSheetPath).Path.Substring($RepoRoot.Length + 1).Replace('\', '/')
            sha256 = Get-Sha256 -LiteralPath $contactSheetPath
            authoredFacing = $true
            fixedRootOverlay = $true
        }
    }
    approvalBoundary = [ordered]@{
        styleDirectionApproval = 'APPROVED_WITH_TARGETED_REPAIR'
        standingMediumMotionApproval = 'APPROVED_V1_MOTION_PRESERVED'
        standingMediumTimingApproval = 'APPROVED_V2_RETIMING'
        motionApproved = $false
        timingApproved = $false
        combatProfileApproved = $false
        runtimeArtApproved = $false
        productionApproved = $false
        deployable = $false
    }
    frames = $reportFrames
}

$reportPath = Join-Path $reviewRoot 'normalization.report.json'
$report | ConvertTo-Json -Depth 12 | Set-Content -LiteralPath $reportPath -Encoding utf8
Write-Output "Normalized $($reportFrames.Count) Crouching Light candidate frames."
Write-Output "Visible height drift: $heightDrift"
Write-Output "Report: $reportPath"
