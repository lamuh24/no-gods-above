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

if (-not ('LamuhStandingHeavyNormalizer' -as [type])) {
    Add-Type -TypeDefinition @'
using System;
using System.Collections.Generic;
using System.Drawing;
using System.Drawing.Imaging;
using System.IO;
using System.Runtime.InteropServices;

public sealed class LamuhStandingHeavyMetrics
{
    public int Width { get; set; }
    public int Height { get; set; }
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

public static class LamuhStandingHeavyNormalizer
{
    private static bool IsNeutralBackdrop(byte red, byte green, byte blue)
    {
        int min = Math.Min(red, Math.Min(green, blue));
        int max = Math.Max(red, Math.Max(green, blue));
        return min >= 198 && max - min <= 20;
    }

    private static bool IsMeaningfulMagenta(byte red, byte green, byte blue)
    {
        return red > 45 && blue > 45 && red > green * 1.18 && blue > green * 1.18;
    }

    public static LamuhStandingHeavyMetrics Normalize(
        string inputPath,
        string outputPath,
        int rawRootX,
        int rawRootY,
        int targetRootX,
        int targetRootY,
        int outputWidth,
        int outputHeight,
        double sourceScaleCorrection)
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
                if (alpha == 0 || IsNeutralBackdrop(red, green, blue))
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

            // Peel a narrow connected gray halo without touching the outlined white costume.
            for (int pass = 0; pass < 2; pass++)
            {
                var additions = new List<int>();
                for (int y = 1; y < source.Height - 1; y++)
                {
                    for (int x = 1; x < source.Width - 1; x++)
                    {
                        int linear = y * source.Width + x;
                        if (background[linear]) continue;
                        int offset = y * sourceStride + x * 4;
                        byte blue = sourceBytes[offset];
                        byte green = sourceBytes[offset + 1];
                        byte red = sourceBytes[offset + 2];
                        int min = Math.Min(red, Math.Min(green, blue));
                        int max = Math.Max(red, Math.Max(green, blue));
                        if (min < 168 || max - min > 24) continue;
                        if (background[linear - 1] || background[linear + 1] || background[linear - source.Width] || background[linear + source.Width]) additions.Add(linear);
                    }
                }
                foreach (int linear in additions) background[linear] = true;
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

                for (int i = 0; i < background.Length; i++) if (background[i]) removed++;

                for (int destinationY = 0; destinationY < outputHeight; destinationY++)
                {
                    int sourceY = rawRootY + (int)Math.Round((destinationY - targetRootY) / sourceScaleCorrection);
                    if (sourceY < 0 || sourceY >= source.Height) continue;
                    for (int destinationX = 0; destinationX < outputWidth; destinationX++)
                    {
                        int sourceX = rawRootX + (int)Math.Round((destinationX - targetRootX) / sourceScaleCorrection);
                        if (sourceX < 0 || sourceX >= source.Width) continue;
                        int linear = sourceY * source.Width + sourceX;
                        if (background[linear]) continue;
                        int sourceOffset = sourceY * sourceStride + sourceX * 4;
                        byte blue = sourceBytes[sourceOffset];
                        byte green = sourceBytes[sourceOffset + 1];
                        byte red = sourceBytes[sourceOffset + 2];
                        byte alpha = sourceBytes[sourceOffset + 3];
                        if (alpha <= 96) continue;
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
                        if (alpha > 8)
                        {
                            visible++;
                            weightedX += destinationX;
                            weightedY += destinationY;
                            minX = Math.Min(minX, destinationX);
                            minY = Math.Min(minY, destinationY);
                            maxX = Math.Max(maxX, destinationX);
                            maxY = Math.Max(maxY, destinationY);
                        }
                    }
                }

                Marshal.Copy(outputBytes, 0, outputData.Scan0, outputBytes.Length);
                output.UnlockBits(outputData);
                Directory.CreateDirectory(Path.GetDirectoryName(outputPath));
                output.Save(outputPath, ImageFormat.Png);

                return new LamuhStandingHeavyMetrics {
                    Width = outputWidth,
                    Height = outputHeight,
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

$reviewRoot = Join-Path $RepoRoot 'tools\nga-forge\review\lamuh-legacy-v2-standing-heavy-closure-v1'
$rawRoot = Join-Path $reviewRoot 'raw'
$normalizedRoot = Join-Path $reviewRoot 'normalized'
New-Item -ItemType Directory -Force -Path $normalizedRoot | Out-Null

$frames = @(
    [ordered]@{ index = 0; role = 'loaded_anticipation'; raw = 'standing-heavy-00-v1.png'; rawRootX = 748; rawRootY = 928; bodyScaleCorrection = 0.72 },
    [ordered]@{ index = 1; role = 'guarded_hip_coil'; raw = 'standing-heavy-01-guarded-coil-v2.png'; rawRootX = 787; rawRootY = 871; bodyScaleCorrection = 0.90 },
    [ordered]@{ index = 2; role = 'right_leg_launch'; raw = 'standing-heavy-02-v1.png'; rawRootX = 414; rawRootY = 919; bodyScaleCorrection = 0.80 },
    [ordered]@{ index = 3; role = 'single_high_kick_contact_body_scale_repaired'; raw = 'standing-heavy-03-scale-repair-body-v2.png'; rawRootX = 454; rawRootY = 950; bodyScaleCorrection = 0.80 },
    [ordered]@{ index = 4; role = 'post_contact_overshoot'; raw = 'standing-heavy-04-v1.png'; rawRootX = 420; rawRootY = 950; bodyScaleCorrection = 0.80 },
    [ordered]@{ index = 5; role = 'same_leg_recoil'; raw = 'standing-heavy-05-v1.png'; rawRootX = 525; rawRootY = 954; bodyScaleCorrection = 0.84 },
    [ordered]@{ index = 6; role = 'low_rotational_recovery'; raw = 'standing-heavy-06-v1.png'; rawRootX = 720; rawRootY = 913; bodyScaleCorrection = 0.86 }
)

$targetRoot = [ordered]@{ x = 768; y = 1360 }
$reportFrames = @()
foreach ($frame in $frames) {
    $sourcePath = Join-Path $rawRoot $frame.raw
    if (-not (Test-Path -LiteralPath $sourcePath)) { throw "Missing Standing Heavy raw candidate: $sourcePath" }
    $outputName = ('standing-heavy-{0:d2}.png' -f $frame.index)
    $outputPath = Join-Path $normalizedRoot $outputName
    $metrics = [LamuhStandingHeavyNormalizer]::Normalize($sourcePath, $outputPath, $frame.rawRootX, $frame.rawRootY, $targetRoot.x, $targetRoot.y, 2048, 1536, $frame.bodyScaleCorrection)
    $hash = Get-Sha256 -LiteralPath $outputPath
    $reportFrames += [ordered]@{
        index = $frame.index
        role = $frame.role
        rawPath = (Resolve-Path -LiteralPath $sourcePath).Path.Substring($RepoRoot.Length + 1).Replace('\', '/')
        rawSha256 = Get-Sha256 -LiteralPath $sourcePath
        normalizedPath = (Resolve-Path -LiteralPath $outputPath).Path.Substring($RepoRoot.Length + 1).Replace('\', '/')
        normalizedSha256 = $hash
        authoredRawRoot = [ordered]@{ x = $frame.rawRootX; y = $frame.rawRootY }
        bodyScaleCorrection = $frame.bodyScaleCorrection
        authoredScale = $frame.bodyScaleCorrection
        normalizedRoot = $targetRoot
        visibleBounds = [ordered]@{ minX = $metrics.MinX; minY = $metrics.MinY; maxX = $metrics.MaxX; maxY = $metrics.MaxY }
        visualCentroid = [ordered]@{ x = [math]::Round($metrics.CentroidX, 2); y = [math]::Round($metrics.CentroidY, 2) }
        visiblePixels = $metrics.VisiblePixels
        transparentPixels = $metrics.TransparentPixels
        backgroundPixelsRemoved = $metrics.BackgroundPixelsRemoved
        magentaPixelsNeutralized = $metrics.MagentaPixelsNeutralized
        touchesEdge = $metrics.TouchesEdge
    }
}

$contactCompositeSource = Join-Path $rawRoot 'standing-heavy-03-scale-repair-hit-v2.png'
$contactCompositeOutput = Join-Path $normalizedRoot 'standing-heavy-03-hit-composite.png'
$contactCompositeMetrics = [LamuhStandingHeavyNormalizer]::Normalize($contactCompositeSource, $contactCompositeOutput, 454, 950, $targetRoot.x, $targetRoot.y, 2048, 1536, $frames[3].bodyScaleCorrection)
$contactCompositeRecord = [ordered]@{
    path = (Resolve-Path -LiteralPath $contactCompositeOutput).Path.Substring($RepoRoot.Length + 1).Replace('\', '/')
    sha256 = Get-Sha256 -LiteralPath $contactCompositeOutput
    sourcePath = (Resolve-Path -LiteralPath $contactCompositeSource).Path.Substring($RepoRoot.Length + 1).Replace('\', '/')
    sourceSha256 = Get-Sha256 -LiteralPath $contactCompositeSource
    visibleBounds = [ordered]@{ minX = $contactCompositeMetrics.MinX; minY = $contactCompositeMetrics.MinY; maxX = $contactCompositeMetrics.MaxX; maxY = $contactCompositeMetrics.MaxY }
    touchesEdge = $contactCompositeMetrics.TouchesEdge
    intendedOutcomes = @('hit', 'block')
    prohibitedOutcome = 'whiff'
    note = 'Outcome-routed contact composite. The body-only frame is authoritative for silhouette and whiff; a fully independent VFX layer remains polish debt.'
}

$report = [ordered]@{
    schemaVersion = '1.0.0'
    subject = 'lamuh_legacy_v2.standing_heavy.full_sequence.candidate.v1'
    status = 'candidate-only'
    deployable = $false
    sourceFrameCount = 7
    contactFrame = 3
    visibleImpactCount = 1
    contactPresentation = $contactCompositeRecord
    normalization = [ordered]@{
        canvas = [ordered]@{ width = 2048; height = 1536 }
        sequenceWideScale = 1
        scalePolicy = 'fixed_runtime_scale_after_recorded_source_art_body_scale_correction'
        perFrameRendererScale = $false
        placementPolicy = 'authored_root_landmark_alignment_not_visual_recentering'
        normalizedRoot = $targetRoot
        runtimeMirrorAxisX = $targetRoot.x
        transparentPaddingRequired = $true
        alphaZeroRgbCleared = $true
        backgroundRemoval = 'edge_connected_neutral_backdrop_flood_fill_v1'
        magentaPolicy = 'neutral_dark_ink_replacement'
    }
    approvalBoundary = [ordered]@{
        styleDirectionApproval = 'APPROVED_WITH_TARGETED_REPAIR'
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
Write-Output "Normalized $($reportFrames.Count) Standing Heavy candidate frames."
Write-Output "Report: $reportPath"
