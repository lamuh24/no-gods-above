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

if (-not ('LamuhMovementNormalizer' -as [type])) {
    Add-Type -TypeDefinition @'
using System;
using System.Drawing;
using System.Drawing.Imaging;
using System.IO;
using System.Runtime.InteropServices;

public sealed class LamuhMovementMetrics
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

public static class LamuhMovementNormalizer
{
    private static bool IsNeutralBackdrop(byte red, byte green, byte blue)
    {
        int min = Math.Min(red, Math.Min(green, blue));
        int max = Math.Max(red, Math.Max(green, blue));
        return min >= 188 && max - min <= 38;
    }

    private static bool IsSoftGeneratedBackdrop(byte red, byte green, byte blue, byte alpha)
    {
        int min = Math.Min(red, Math.Min(green, blue));
        int max = Math.Max(red, Math.Max(green, blue));
        bool darkNeutral = max < 88 && max - min < 26 && alpha < 232;
        bool softAmber = red < 150 && red > green * 1.08 && green > blue * 1.04 && alpha < 218;
        return alpha <= 96 || darkNeutral || softAmber;
    }

    private static bool IsMeaningfulMagenta(byte red, byte green, byte blue)
    {
        return red > 45 && blue > 45 && red > green * 1.18 && blue > green * 1.18;
    }

    public static LamuhMovementMetrics Normalize(
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
                if (alpha <= 8 || IsNeutralBackdrop(red, green, blue) || IsSoftGeneratedBackdrop(red, green, blue, alpha))
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

                return new LamuhMovementMetrics {
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

$reviewRoot = Join-Path $RepoRoot 'tools\nga-forge\review\lamuh-legacy-v2-movement-modernization-v1'
$rawRoot = Join-Path $reviewRoot 'raw'
$normalizedRoot = Join-Path $reviewRoot 'normalized'
$probeRoot = Join-Path ([System.IO.Path]::GetTempPath()) 'lamuh-movement-probes-v1'
$legacyRoot = Join-Path $RepoRoot 'NO_GODS_ABOVE\engine_v2\content-source\characters\lamuh-legacy-v2\source-frames'
$videoReviewRoot = Join-Path $RepoRoot 'tools\nga-forge\review\lamuh-legacy-v2-forward-walk-video-v1'
$videoWalkRoot = Join-Path $videoReviewRoot 'selected-full-resolution'
$videoSourcePath = Join-Path $videoReviewRoot 'source\lamuh-forward-walk-user-reference-20260827.mp4'
New-Item -ItemType Directory -Force -Path $normalizedRoot, $probeRoot | Out-Null

$frames = @(
    [ordered]@{ state = 'idle'; index = 0; role = 'base_ready'; raw = 'idle-00-base-v1.png'; legacyFolder = 'idle'; legacyIndex = 0; bodyScaleCorrection = 1.00 },
    [ordered]@{ state = 'idle'; index = 1; role = 'inhale_rise'; raw = 'idle-01-inhale-v1.png'; legacyFolder = 'idle'; legacyIndex = 2; bodyScaleCorrection = 1.00 },
    [ordered]@{ state = 'idle'; index = 2; role = 'exhale_settle'; raw = 'idle-02-settle-v1.png'; legacyFolder = 'idle'; legacyIndex = 4; bodyScaleCorrection = 1.00 },
    [ordered]@{ state = 'idle'; index = 3; role = 'return_weight_shift'; raw = 'idle-03-return-v1.png'; legacyFolder = 'idle'; legacyIndex = 6; bodyScaleCorrection = 1.00 },
    [ordered]@{ state = 'walk_forward'; index = 0; role = 'grounded_entry'; raw = 'walk-forward-video-00.png'; sourceType = 'user_video'; sourceFrameIndex = 0; legacyFolder = 'walk_forward'; legacyIndex = 0; bodyScaleCorrection = 1.00 },
    [ordered]@{ state = 'walk_forward'; index = 1; role = 'first_step_departure'; raw = 'walk-forward-video-01.png'; sourceType = 'user_video'; sourceFrameIndex = 12; legacyFolder = 'walk_forward'; legacyIndex = 1; bodyScaleCorrection = 1.00 },
    [ordered]@{ state = 'walk_forward'; index = 2; role = 'first_step_passing'; raw = 'walk-forward-video-02.png'; sourceType = 'user_video'; sourceFrameIndex = 24; legacyFolder = 'walk_forward'; legacyIndex = 2; bodyScaleCorrection = 1.00 },
    [ordered]@{ state = 'walk_forward'; index = 3; role = 'first_step_contact'; raw = 'walk-forward-video-03.png'; sourceType = 'user_video'; sourceFrameIndex = 36; legacyFolder = 'walk_forward'; legacyIndex = 3; bodyScaleCorrection = 1.00 },
    [ordered]@{ state = 'walk_forward'; index = 4; role = 'first_weight_transfer'; raw = 'walk-forward-video-04.png'; sourceType = 'user_video'; sourceFrameIndex = 48; legacyFolder = 'walk_forward'; legacyIndex = 4; bodyScaleCorrection = 1.00 },
    [ordered]@{ state = 'walk_forward'; index = 5; role = 'second_step_departure'; raw = 'walk-forward-video-05.png'; sourceType = 'user_video'; sourceFrameIndex = 60; legacyFolder = 'walk_forward'; legacyIndex = 5; bodyScaleCorrection = 1.00 },
    [ordered]@{ state = 'walk_forward'; index = 6; role = 'second_step_passing'; raw = 'walk-forward-video-06.png'; sourceType = 'user_video'; sourceFrameIndex = 72; legacyFolder = 'walk_forward'; legacyIndex = 0; bodyScaleCorrection = 1.00 },
    [ordered]@{ state = 'walk_forward'; index = 7; role = 'second_step_contact'; raw = 'walk-forward-video-07.png'; sourceType = 'user_video'; sourceFrameIndex = 84; legacyFolder = 'walk_forward'; legacyIndex = 1; bodyScaleCorrection = 1.00 },
    [ordered]@{ state = 'walk_forward'; index = 8; role = 'second_weight_transfer'; raw = 'walk-forward-video-08.png'; sourceType = 'user_video'; sourceFrameIndex = 96; legacyFolder = 'walk_forward'; legacyIndex = 2; bodyScaleCorrection = 1.00 },
    [ordered]@{ state = 'walk_forward'; index = 9; role = 'third_step_departure'; raw = 'walk-forward-video-09.png'; sourceType = 'user_video'; sourceFrameIndex = 108; legacyFolder = 'walk_forward'; legacyIndex = 3; bodyScaleCorrection = 1.00 },
    [ordered]@{ state = 'walk_forward'; index = 10; role = 'third_step_passing'; raw = 'walk-forward-video-10.png'; sourceType = 'user_video'; sourceFrameIndex = 120; legacyFolder = 'walk_forward'; legacyIndex = 4; bodyScaleCorrection = 1.00 },
    [ordered]@{ state = 'walk_forward'; index = 11; role = 'third_step_contact'; raw = 'walk-forward-video-11.png'; sourceType = 'user_video'; sourceFrameIndex = 132; legacyFolder = 'walk_forward'; legacyIndex = 5; bodyScaleCorrection = 1.00 },
    [ordered]@{ state = 'walk_forward'; index = 12; role = 'settle_transfer'; raw = 'walk-forward-video-12.png'; sourceType = 'user_video'; sourceFrameIndex = 144; legacyFolder = 'walk_forward'; legacyIndex = 0; bodyScaleCorrection = 1.00 },
    [ordered]@{ state = 'walk_forward'; index = 13; role = 'stride_close'; raw = 'walk-forward-video-13.png'; sourceType = 'user_video'; sourceFrameIndex = 156; legacyFolder = 'walk_forward'; legacyIndex = 1; bodyScaleCorrection = 1.00 },
    [ordered]@{ state = 'walk_forward'; index = 14; role = 'planted_recovery'; raw = 'walk-forward-video-14.png'; sourceType = 'user_video'; sourceFrameIndex = 168; legacyFolder = 'walk_forward'; legacyIndex = 4; bodyScaleCorrection = 1.00 },
    [ordered]@{ state = 'walk_forward'; index = 15; role = 'loop_close'; raw = 'walk-forward-video-15.png'; sourceType = 'user_video'; sourceFrameIndex = 180; legacyFolder = 'walk_forward'; legacyIndex = 5; bodyScaleCorrection = 1.00 },
    [ordered]@{ state = 'walk_backward'; index = 0; role = 'retreat_reach'; raw = 'walk-backward-00-v1.png'; legacyFolder = 'walk_backward'; legacyIndex = 0; bodyScaleCorrection = 1.00 },
    [ordered]@{ state = 'walk_backward'; index = 1; role = 'retreat_plant'; raw = 'walk-backward-01-v1.png'; legacyFolder = 'walk_backward'; legacyIndex = 1; bodyScaleCorrection = 1.00 },
    [ordered]@{ state = 'walk_backward'; index = 2; role = 'forward_foot_pass'; raw = 'walk-backward-02-v1.png'; legacyFolder = 'walk_backward'; legacyIndex = 2; bodyScaleCorrection = 1.00 },
    [ordered]@{ state = 'walk_backward'; index = 3; role = 'opposite_retreat_stride'; raw = 'walk-backward-03-v1.png'; legacyFolder = 'walk_backward'; legacyIndex = 3; bodyScaleCorrection = 1.00 },
    [ordered]@{ state = 'walk_backward'; index = 4; role = 'opposite_retreat_reach'; raw = 'walk-backward-04-v1.png'; legacyFolder = 'walk_backward'; legacyIndex = 4; bodyScaleCorrection = 1.00 },
    [ordered]@{ state = 'walk_backward'; index = 5; role = 'retreat_cycle_close'; raw = 'walk-backward-05-v1.png'; legacyFolder = 'walk_backward'; legacyIndex = 5; bodyScaleCorrection = 1.00 },
    [ordered]@{ state = 'air_dash_forward'; index = 0; role = 'airborne_entry'; sourceType = 'legacy_preserved_v2_outline_repair'; legacyFolder = 'air_dash_forward'; legacyIndex = 0; bodyScaleCorrection = 1.00 },
    [ordered]@{ state = 'air_dash_forward'; index = 1; role = 'forward_commit'; sourceType = 'legacy_preserved_v2_outline_repair'; legacyFolder = 'air_dash_forward'; legacyIndex = 1; bodyScaleCorrection = 1.00 },
    [ordered]@{ state = 'air_dash_forward'; index = 2; role = 'forward_burst'; sourceType = 'legacy_preserved_v2_outline_repair'; legacyFolder = 'air_dash_forward'; legacyIndex = 2; bodyScaleCorrection = 1.00 },
    [ordered]@{ state = 'air_dash_forward'; index = 3; role = 'forward_travel'; sourceType = 'legacy_preserved_v2_outline_repair'; legacyFolder = 'air_dash_forward'; legacyIndex = 3; bodyScaleCorrection = 1.00 },
    [ordered]@{ state = 'air_dash_forward'; index = 4; role = 'forward_carry'; sourceType = 'legacy_preserved_v2_outline_repair'; legacyFolder = 'air_dash_forward'; legacyIndex = 4; bodyScaleCorrection = 1.00 },
    [ordered]@{ state = 'air_dash_forward'; index = 5; role = 'air_brake'; sourceType = 'legacy_preserved_v2_outline_repair'; legacyFolder = 'air_dash_forward'; legacyIndex = 5; bodyScaleCorrection = 1.00 },
    [ordered]@{ state = 'air_dash_backward'; index = 0; role = 'guarded_entry'; sourceType = 'legacy_preserved_v2_outline_repair'; legacyFolder = 'air_dash_backward'; legacyIndex = 0; bodyScaleCorrection = 1.00 },
    [ordered]@{ state = 'air_dash_backward'; index = 1; role = 'backward_commit'; sourceType = 'legacy_preserved_v2_outline_repair'; legacyFolder = 'air_dash_backward'; legacyIndex = 1; bodyScaleCorrection = 1.00 },
    [ordered]@{ state = 'air_dash_backward'; index = 2; role = 'backward_burst'; sourceType = 'legacy_preserved_v2_outline_repair'; legacyFolder = 'air_dash_backward'; legacyIndex = 2; bodyScaleCorrection = 1.00 },
    [ordered]@{ state = 'air_dash_backward'; index = 3; role = 'maximum_retreat'; sourceType = 'legacy_preserved_v2_outline_repair'; legacyFolder = 'air_dash_backward'; legacyIndex = 3; bodyScaleCorrection = 1.00 },
    [ordered]@{ state = 'air_dash_backward'; index = 4; role = 'air_brake'; sourceType = 'legacy_preserved_v2_outline_repair'; legacyFolder = 'air_dash_backward'; legacyIndex = 4; bodyScaleCorrection = 1.00 }
)

function Get-Probe {
    param([string]$SourcePath, [string]$ProbeName)
    $bitmap = [System.Drawing.Bitmap]::FromFile($SourcePath)
    try { $width = $bitmap.Width; $height = $bitmap.Height }
    finally { $bitmap.Dispose() }
    $probePath = Join-Path $probeRoot $ProbeName
    $metrics = [LamuhMovementNormalizer]::Normalize($SourcePath, $probePath, 0, 0, 0, 0, $width, $height, 1.0)
    return [ordered]@{ metrics = $metrics; width = $width; height = $height; path = $probePath }
}

$legacyIdleBasePath = Join-Path $legacyRoot 'idle\idle_00.png'
$legacyIdleBaseProbe = Get-Probe -SourcePath $legacyIdleBasePath -ProbeName 'legacy-idle-00.png'
$legacyIdleBaseHeight = $legacyIdleBaseProbe.metrics.MaxY - $legacyIdleBaseProbe.metrics.MinY + 1
$targetIdleHeight = 800.0
$targetRoot = [ordered]@{ x = 768; y = 1360 }
$videoBasePath = Join-Path $videoWalkRoot 'walk-forward-video-00.png'
if (-not (Test-Path -LiteralPath $videoBasePath)) { throw "Missing user-supplied forward-walk video frame: $videoBasePath" }
if (-not (Test-Path -LiteralPath $videoSourcePath)) { throw "Missing hash-locked user-supplied forward-walk video: $videoSourcePath" }
$videoBaseProbe = Get-Probe -SourcePath $videoBasePath -ProbeName 'video-walk-base-00.png'
$videoBaseVisibleHeight = $videoBaseProbe.metrics.MaxY - $videoBaseProbe.metrics.MinY + 1
$videoWalkSourceScale = [math]::Round($targetIdleHeight / [math]::Max(1, $videoBaseVisibleHeight), 5)
$reportFrames = @()

foreach ($frame in $frames) {
    $legacyPath = Join-Path $legacyRoot (('{0}\{0}_{1:d2}.png' -f $frame.legacyFolder, $frame.legacyIndex))
    $sourcePath = if ($frame.sourceType -eq 'user_video') { Join-Path $videoWalkRoot $frame.raw } elseif ($frame.sourceType -eq 'legacy_preserved_v2_outline_repair') { $legacyPath } else { Join-Path $rawRoot $frame.raw }
    if (-not (Test-Path -LiteralPath $sourcePath)) { throw "Missing movement raw candidate: $sourcePath" }
    if (-not (Test-Path -LiteralPath $legacyPath)) { throw "Missing protected V1 movement frame: $legacyPath" }
    $rawProbe = Get-Probe -SourcePath $sourcePath -ProbeName ("raw-{0}-{1:d2}.png" -f $frame.state, $frame.index)
    $legacyProbe = Get-Probe -SourcePath $legacyPath -ProbeName ("legacy-{0}-{1:d2}.png" -f $frame.state, $frame.index)
    $rawVisibleWidth = $rawProbe.metrics.MaxX - $rawProbe.metrics.MinX + 1
    $rawVisibleHeight = $rawProbe.metrics.MaxY - $rawProbe.metrics.MinY + 1
    $legacyVisibleWidth = $legacyProbe.metrics.MaxX - $legacyProbe.metrics.MinX + 1
    $legacyVisibleHeight = $legacyProbe.metrics.MaxY - $legacyProbe.metrics.MinY + 1
    if ($frame.sourceType -eq 'user_video') {
        $authoredRawRootX = 360
        $authoredRawRootY = $rawProbe.metrics.MaxY
        $desiredVisibleHeight = $rawVisibleHeight * $videoWalkSourceScale
        $legacyMotionHeightScale = $videoWalkSourceScale
        $rootMapping = 'user_video_fixed_camera_center_and_support_baseline'
    }
    else {
        $legacyRootRatioX = (224.0 - $legacyProbe.metrics.MinX) / [math]::Max(1, $legacyVisibleWidth)
        $legacyRootRatioY = (382.0 - $legacyProbe.metrics.MinY) / [math]::Max(1, $legacyVisibleHeight)
        $authoredRawRootX = [math]::Round($rawProbe.metrics.MinX + $legacyRootRatioX * $rawVisibleWidth)
        $authoredRawRootY = [math]::Round($rawProbe.metrics.MinY + $legacyRootRatioY * $rawVisibleHeight)
        $desiredVisibleHeight = $targetIdleHeight * ($legacyVisibleHeight / [math]::Max(1, $legacyIdleBaseHeight))
        $legacyMotionHeightScale = [math]::Round($desiredVisibleHeight / [math]::Max(1, $rawVisibleHeight), 5)
        $rootMapping = 'legacy_root_ratio_mapped_to_generated_visible_bounds'
    }
    $sourceScaleCorrection = [math]::Round($legacyMotionHeightScale * $frame.bodyScaleCorrection, 5)
    $outputName = ('{0}-{1:d2}.png' -f $frame.state.Replace('_', '-'), $frame.index)
    $outputPath = Join-Path $normalizedRoot $outputName
    $metrics = [LamuhMovementNormalizer]::Normalize($sourcePath, $outputPath, $authoredRawRootX, $authoredRawRootY, $targetRoot.x, $targetRoot.y, 2048, 1536, $sourceScaleCorrection)
    $reportFrames += [ordered]@{
        state = $frame.state
        index = $frame.index
        role = $frame.role
        sourceType = if ($frame.sourceType) { $frame.sourceType } else { 'modernized_still_candidate' }
        sourceFrameIndex = $frame.sourceFrameIndex
        legacyIndex = $frame.legacyIndex
        legacyPath = (Resolve-Path -LiteralPath $legacyPath).Path.Substring($RepoRoot.Length + 1).Replace('\', '/')
        legacySha256 = Get-Sha256 -LiteralPath $legacyPath
        rawPath = (Resolve-Path -LiteralPath $sourcePath).Path.Substring($RepoRoot.Length + 1).Replace('\', '/')
        rawSha256 = Get-Sha256 -LiteralPath $sourcePath
        normalizedPath = (Resolve-Path -LiteralPath $outputPath).Path.Substring($RepoRoot.Length + 1).Replace('\', '/')
        normalizedSha256 = Get-Sha256 -LiteralPath $outputPath
        authoredRawRoot = [ordered]@{ x = $authoredRawRootX; y = $authoredRawRootY }
        rootMapping = $rootMapping
        legacyMotionHeightScale = $legacyMotionHeightScale
        bodyScaleCorrection = $frame.bodyScaleCorrection
        sourceScaleCorrection = $sourceScaleCorrection
        desiredVisibleHeight = [math]::Round($desiredVisibleHeight, 2)
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

if (($reportFrames.normalizedSha256 | Select-Object -Unique).Count -ne 37) { throw 'Movement modernization frames must all be unique.' }
if ($reportFrames.touchesEdge -contains $true) { throw 'A normalized movement frame touches the canvas edge.' }

$contactSheetPath = Join-Path $reviewRoot 'movement-modernization-numbered-contact-sheet.png'
$board = New-Object System.Drawing.Bitmap 1660, 4300
$boardGraphics = [System.Drawing.Graphics]::FromImage($board)
$titleFont = New-Object System.Drawing.Font('Segoe UI', 20, [System.Drawing.FontStyle]::Bold)
$labelFont = New-Object System.Drawing.Font('Segoe UI', 12, [System.Drawing.FontStyle]::Bold)
$noteFont = New-Object System.Drawing.Font('Segoe UI', 10, [System.Drawing.FontStyle]::Regular)
$goldPen = New-Object System.Drawing.Pen([System.Drawing.Color]::FromArgb(255, 214, 166, 56), 4)
$panelPen = New-Object System.Drawing.Pen([System.Drawing.Color]::FromArgb(110, 255, 255, 255), 1)
$rootPen = New-Object System.Drawing.Pen([System.Drawing.Color]::FromArgb(210, 255, 224, 138), 2)
try {
    $boardGraphics.Clear([System.Drawing.Color]::FromArgb(255, 6, 11, 17))
    $boardGraphics.DrawString('LAMUH LEGACY V2 - MODERN MOVEMENT - NUMBERED FRAME SCRUB', $titleFont, [System.Drawing.Brushes]::Goldenrod, 26, 18)
    $boardGraphics.DrawString('fixed root - preserved V1 motion - outline free - deterministic air dashes - combined playtest candidate', $noteFont, [System.Drawing.Brushes]::LightGray, 28, 53)
    for ($ordinal = 0; $ordinal -lt $reportFrames.Count; $ordinal++) {
        $frame = $reportFrames[$ordinal]
        $column = $ordinal % 4
        $row = [math]::Floor($ordinal / 4)
        $panelX = 18 + $column * 410
        $panelY = 88 + $row * 416
        $panelRectangle = New-Object System.Drawing.Rectangle $panelX, $panelY, 394, 394
        $boardGraphics.DrawRectangle($panelPen, $panelRectangle)
        if ($frame.index -eq 0) { $boardGraphics.DrawRectangle($goldPen, $panelRectangle) }
        $image = [System.Drawing.Image]::FromFile((Join-Path $RepoRoot $frame.normalizedPath))
        try { $boardGraphics.DrawImage($image, $panelX + 10, $panelY + 36, 374, 350) }
        finally { $image.Dispose() }
        $boardGraphics.DrawString(('{0} {1:d2}  {2}' -f $frame.state.Replace('_', ' '), $frame.index, $frame.role.Replace('_', ' ')), $labelFont, [System.Drawing.Brushes]::White, $panelX + 12, $panelY + 8)
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
    subject = 'lamuh_legacy_v2.movement_modernization.combined_playtest.candidate.v1'
    status = 'candidate-only'
    deployable = $false
    sourceFrameCount = 218
    authoredFrameCount = 37
    sourceVideo = [ordered]@{
        path = (Resolve-Path -LiteralPath $videoSourcePath).Path.Substring($RepoRoot.Length + 1).Replace('\', '/')
        sha256 = Get-Sha256 -LiteralPath $videoSourcePath
        frameRate = 24
        durationSeconds = 8
        sourceFrameCount = 192
        selectedSourceFrames = @(0, 12, 24, 36, 48, 60, 72, 84, 96, 108, 120, 132, 144, 156, 168, 180)
        selectionPolicy = 'uniform_pose_sampling_every_12_source_frames_from_user_supplied_motion_reference'
    }
    states = [ordered]@{
        idle = [ordered]@{ sourceFrameCount = 8; authoredFrameCount = 4; selectedLegacyFrames = @(0, 2, 4, 6); exposureTicks = @(15, 15, 15, 15); durationTicks = 60; loop = $true }
        walk_forward = [ordered]@{ sourceFrameCount = 192; authoredFrameCount = 16; selectedSourceFrames = @(0, 12, 24, 36, 48, 60, 72, 84, 96, 108, 120, 132, 144, 156, 168, 180); selectedLegacyFrames = @(0, 1, 2, 3, 4, 5); exposureTicks = @(2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2); durationTicks = 32; loop = $true }
        walk_backward = [ordered]@{ sourceFrameCount = 6; authoredFrameCount = 6; selectedLegacyFrames = @(0, 1, 2, 3, 4, 5); exposureTicks = @(3, 3, 3, 3, 3, 3); durationTicks = 18; loop = $true }
        air_dash_forward = [ordered]@{ sourceFrameCount = 6; authoredFrameCount = 6; selectedLegacyFrames = @(0, 1, 2, 3, 4, 5); exposureTicks = @(2, 2, 2, 3, 3, 2); durationTicks = 14; loop = $false }
        air_dash_backward = [ordered]@{ sourceFrameCount = 6; authoredFrameCount = 5; selectedLegacyFrames = @(0, 1, 2, 3, 4); retiredExactDuplicateLegacyFrame = 5; exposureTicks = @(2, 2, 3, 3, 4); durationTicks = 14; loop = $false }
    }
    normalization = [ordered]@{
        canvas = [ordered]@{ width = 2048; height = 1536 }
        sequenceWideScale = 1.0
        scalePolicy = 'fixed_runtime_scale_after_recorded_source_art_camera_correction'
        perFrameRendererScale = $false
        sourceArtCameraCorrection = 'recorded_source_root_landmark_correction_only; no runtime recentering or scale animation'
        placementPolicy = 'authored_hip_and_support-foot_root_landmark_alignment_not_visual_recentering'
        normalizedRoot = $targetRoot
        runtimeMirrorAxisX = $targetRoot.x
        transparentPaddingRequired = $true
        alphaZeroRgbCleared = $true
        backgroundRemoval = 'preserve_alpha_or_edge_connected_neutral_and_soft_generated_backdrop_flood_fill_v1'
        magentaPolicy = 'legacy_magenta_dark_ink_replacement'
        chromaCleanup = 'edge_connected_generated_backdrop_removal_plus_low_alpha_cleanup'
    }
    sourceRepairReason = 'V1 idle, backward-walk, and both six-frame air-dash arcs remain preserved while the user-supplied 192-frame forward-walk video becomes the forward locomotion source. Air-dash art receives only deterministic fixed-scale normalization and purple-fringe replacement; simulation owns all travel.'
    visualValidation = [ordered]@{
        purpleOutlineRemoved = $true
        meaningfulMagentaPixelsRemaining = 0
        fixedRoot = $true
        fixedRendererScale = $true
        note = 'Generated source-camera differences are recorded and baked once; legacy air-dash cells share one anatomy scale and receive no runtime rescaling.'
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
        crouchingHeavyMotionApproval = $null
        movementMotionApproval = $null
        combinedPlaytestApproval = $null
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
Write-Output "Normalized $($reportFrames.Count) modern movement candidate frames, including forward and backward air dashes."
Write-Output "Report: $reportPath"
