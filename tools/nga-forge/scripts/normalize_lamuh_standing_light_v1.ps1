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
    private static bool IsNeutralBackdrop(byte red, byte green, byte blue)
    {
        int min = Math.Min(red, Math.Min(green, blue));
        int max = Math.Max(red, Math.Max(green, blue));
        return min >= 188 && max - min <= 36;
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

                for (int sourceY = 0; sourceY < source.Height; sourceY++)
                {
                    for (int sourceX = 0; sourceX < source.Width; sourceX++)
                    {
                        int linear = sourceY * source.Width + sourceX;
                        if (background[linear]) { removed++; continue; }
                        int sourceOffset = sourceY * sourceStride + sourceX * 4;
                        byte blue = sourceBytes[sourceOffset];
                        byte green = sourceBytes[sourceOffset + 1];
                        byte red = sourceBytes[sourceOffset + 2];
                        byte alpha = sourceBytes[sourceOffset + 3];
                        if (alpha <= 8) continue;
                        if (IsMeaningfulMagenta(red, green, blue))
                        {
                            byte ink = (byte)Math.Min(34, Math.Round(red * .08 + green * .18 + blue * .05));
                            red = ink; green = ink; blue = ink; magenta++;
                        }

                        int destinationX = targetRootX + (int)Math.Round((sourceX - rawRootX) * sequenceWideScale);
                        int destinationY = targetRootY + (int)Math.Round((sourceY - rawRootY) * sequenceWideScale);
                        if (destinationX < 0 || destinationX >= outputWidth || destinationY < 0 || destinationY >= outputHeight) continue;
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

$reviewRoot = Join-Path $RepoRoot 'tools\nga-forge\review\lamuh-legacy-v2-standing-light-v1'
$rawRoot = Join-Path $reviewRoot 'raw'
$normalizedRoot = Join-Path $reviewRoot 'normalized'
New-Item -ItemType Directory -Force -Path $normalizedRoot | Out-Null

$frames = @(
    [ordered]@{ index = 0; role = 'compact_ready_entry'; raw = 'standing-light-00-ready-v1.png'; rawRootX = 556; rawRootY = 1218; sourceScaleCorrection = 0.94; bodyScaleCorrection = 0.88 },
    [ordered]@{ index = 1; role = 'lead_fist_chamber'; raw = 'standing-light-01-compact-chamber-v1.png'; rawRootX = 512; rawRootY = 1394; sourceScaleCorrection = 0.975; bodyScaleCorrection = 0.85 },
    [ordered]@{ index = 2; role = 'single_straight_contact_body'; raw = 'standing-light-02-contact-body-v1.png'; rawRootX = 585; rawRootY = 1045; sourceScaleCorrection = 1.0; bodyScaleCorrection = 0.83 },
    [ordered]@{ index = 3; role = 'same_arm_follow_through'; raw = 'standing-light-03-follow-through-v1.png'; rawRootX = 585; rawRootY = 1045; sourceScaleCorrection = 1.0; bodyScaleCorrection = 0.83 },
    [ordered]@{ index = 4; role = 'lead_arm_recoil'; raw = 'standing-light-04-recoil-v1.png'; rawRootX = 548; rawRootY = 1046; sourceScaleCorrection = 1.0; bodyScaleCorrection = 0.83 },
    [ordered]@{ index = 5; role = 'connected_guard_recovery'; raw = 'standing-light-05-recovery-v1.png'; rawRootX = 574; rawRootY = 1047; sourceScaleCorrection = 1.0; bodyScaleCorrection = 0.83 }
)

$targetRoot = [ordered]@{ x = 768; y = 1360 }
$sequenceWideScale = 1.0
$reportFrames = @()
foreach ($frame in $frames) {
    $sourcePath = Join-Path $rawRoot $frame.raw
    if (-not (Test-Path -LiteralPath $sourcePath)) { throw "Missing Standing Light raw candidate: $sourcePath" }
    $outputName = ('standing-light-{0:d2}.png' -f $frame.index)
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

$contactSource = Join-Path $rawRoot 'standing-light-02-contact-hit-v1.png'
$contactOutput = Join-Path $normalizedRoot 'standing-light-02-hit-composite.png'
$contactScale = $sequenceWideScale * $frames[2].sourceScaleCorrection * $frames[2].bodyScaleCorrection
$contactMetrics = [LamuhStandingLightNormalizer]::Normalize($contactSource, $contactOutput, 585, 1045, $targetRoot.x, $targetRoot.y, 2048, 1536, $contactScale)
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

$contactSheetPath = Join-Path $reviewRoot 'standing-light-numbered-contact-sheet.png'
$board = New-Object System.Drawing.Bitmap 1500, 860
$boardGraphics = [System.Drawing.Graphics]::FromImage($board)
$titleFont = New-Object System.Drawing.Font('Segoe UI', 20, [System.Drawing.FontStyle]::Bold)
$labelFont = New-Object System.Drawing.Font('Segoe UI', 13, [System.Drawing.FontStyle]::Bold)
$noteFont = New-Object System.Drawing.Font('Segoe UI', 10, [System.Drawing.FontStyle]::Regular)
$goldPen = New-Object System.Drawing.Pen([System.Drawing.Color]::FromArgb(255, 214, 166, 56), 4)
$panelPen = New-Object System.Drawing.Pen([System.Drawing.Color]::FromArgb(110, 255, 255, 255), 1)
$rootPen = New-Object System.Drawing.Pen([System.Drawing.Color]::FromArgb(210, 255, 224, 138), 2)
try {
    $boardGraphics.Clear([System.Drawing.Color]::FromArgb(255, 6, 11, 17))
    $boardGraphics.DrawString('LAMUH LEGACY V2 - STANDING LIGHT - NUMBERED FRAME SCRUB', $titleFont, [System.Drawing.Brushes]::Goldenrod, 26, 18)
    $boardGraphics.DrawString('Authored facing - fixed root - frame 02 is the only visible contact - candidate only', $noteFont, [System.Drawing.Brushes]::LightGray, 28, 53)
    foreach ($frame in $reportFrames) {
        $column = $frame.index % 3
        $row = [math]::Floor($frame.index / 3)
        $panelX = 22 + $column * 492
        $panelY = 88 + $row * 374
        $panelRectangle = New-Object System.Drawing.Rectangle $panelX, $panelY, 468, 350
        $boardGraphics.DrawRectangle($panelPen, $panelRectangle)
        if ($frame.index -eq 2) { $boardGraphics.DrawRectangle($goldPen, $panelRectangle) }
        $image = [System.Drawing.Image]::FromFile((Join-Path $normalizedRoot ('standing-light-{0:d2}.png' -f $frame.index)))
        try { $boardGraphics.DrawImage($image, $panelX + 14, $panelY + 36, 440, 330) }
        finally { $image.Dispose() }
        $boardGraphics.DrawString(('{0:d2}  {1}' -f $frame.index, $frame.role.Replace('_', ' ')), $labelFont, [System.Drawing.Brushes]::White, $panelX + 12, $panelY + 8)
        $rootX = $panelX + 14 + [math]::Round(($targetRoot.x / 2048) * 440)
        $rootY = $panelY + 36 + [math]::Round(($targetRoot.y / 1536) * 330)
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
    subject = 'lamuh_legacy_v2.standing_light.single_hit_sequence.candidate.v1'
    status = 'candidate-only'
    deployable = $false
    sourceFrameCount = 4
    authoredFrameCount = 6
    contactFrame = 2
    visibleImpactCount = 1
    contactPresentation = $contactPresentation
    normalization = [ordered]@{
        canvas = [ordered]@{ width = 2048; height = 1536 }
        sequenceWideScale = $sequenceWideScale
        scalePolicy = 'fixed_runtime_scale_after_recorded_source_art_camera_correction'
        perFrameRendererScale = $false
        sourceArtCameraCorrection = 'frames_00_01_only_to_match_neighboring_anatomical_scale'
        placementPolicy = 'authored_root_landmark_alignment_not_visual_recentering'
        normalizedRoot = $targetRoot
        runtimeMirrorAxisX = $targetRoot.x
        transparentPaddingRequired = $true
        alphaZeroRgbCleared = $true
        backgroundRemoval = 'preserve_alpha_or_edge_connected_neutral_backdrop_flood_fill_v1'
        magentaPolicy = 'neutral_dark_ink_replacement'
        measuredVisibleHeightDrift = $heightDrift
    }
    sourceRepairReason = 'V1 one-hit row contains two full-extension silhouettes; V2 rebuild keeps the stance, chamber, lead-fist arc, lag and recovery direction while restoring one-visible-impact parity.'
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
        contactScaleRepairApproval = 'APPROVED_FOR_STANDING_HEAVY_ONLY'
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
Write-Output "Normalized $($reportFrames.Count) Standing Light candidate frames."
Write-Output "Visible height drift: $heightDrift"
Write-Output "Report: $reportPath"
