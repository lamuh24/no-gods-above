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

if (-not ('LamuhThrowFamilyNormalizer' -as [type])) {
    Add-Type -TypeDefinition @'
using System;
using System.Collections.Generic;
using System.Drawing;
using System.Drawing.Drawing2D;
using System.Drawing.Imaging;
using System.IO;
using System.Linq;
using System.Runtime.InteropServices;

public sealed class LamuhThrowFrameMetrics
{
    public int MinX { get; set; }
    public int MinY { get; set; }
    public int MaxX { get; set; }
    public int MaxY { get; set; }
    public double CentroidX { get; set; }
    public double CentroidY { get; set; }
    public long VisiblePixels { get; set; }
    public long BackgroundPixelsRemoved { get; set; }
    public long GreenSpillPixelsCorrected { get; set; }
    public long MeaningfulMagentaPixelsRemaining { get; set; }
    public bool TouchesEdge { get; set; }
}

public static class LamuhThrowFamilyNormalizer
{
    private sealed class Component
    {
        public int Label;
        public int Count;
        public int MinX = Int32.MaxValue;
        public int MinY = Int32.MaxValue;
        public int MaxX = -1;
        public int MaxY = -1;
        public long SumX;
        public long SumY;
        public double CenterX { get { return Count == 0 ? 0 : (double)SumX / Count; } }
        public double CenterY { get { return Count == 0 ? 0 : (double)SumY / Count; } }
    }

    private static bool IsChromaGreen(byte red, byte green, byte blue)
    {
        return green >= 105 && green > red * 1.25 && green > blue * 1.25;
    }

    private static bool IsMeaningfulMagenta(byte red, byte green, byte blue)
    {
        return red > 45 && blue > 45 && red > green * 1.18 && blue > green * 1.18;
    }

    public static LamuhThrowFrameMetrics Normalize(
        string inputPath,
        string outputPath,
        int frameIndex,
        int frameCount,
        int rawRootY,
        int targetRootX,
        int targetRootY,
        int outputWidth,
        int outputHeight,
        double sequenceWideScale)
    {
        using (var loaded = new Bitmap(inputPath))
        {
            var loadedRectangle = new Rectangle(0, 0, loaded.Width, loaded.Height);
            var loadedData = loaded.LockBits(loadedRectangle, ImageLockMode.ReadOnly, PixelFormat.Format32bppArgb);
            byte[] loadedBytes = new byte[loadedData.Stride * loaded.Height];
            Marshal.Copy(loadedData.Scan0, loadedBytes, 0, loadedBytes.Length);
            int loadedStride = loadedData.Stride;
            loaded.UnlockBits(loadedData);

            int pixelCount = loaded.Width * loaded.Height;
            int[] labels = new int[pixelCount];
            for (int y = 0; y < loaded.Height; y++)
            {
                for (int x = 0; x < loaded.Width; x++)
                {
                    int pixel = y * loaded.Width + x;
                    int offset = y * loadedStride + x * 4;
                    byte blue = loadedBytes[offset];
                    byte green = loadedBytes[offset + 1];
                    byte red = loadedBytes[offset + 2];
                    byte alpha = loadedBytes[offset + 3];
                    labels[pixel] = alpha > 8 && !IsChromaGreen(red, green, blue) ? -1 : -2;
                }
            }

            var components = new List<Component>();
            var queue = new Queue<int>();
            for (int start = 0; start < pixelCount; start++)
            {
                if (labels[start] != -1) continue;
                var component = new Component { Label = components.Count };
                labels[start] = component.Label;
                queue.Enqueue(start);
                while (queue.Count > 0)
                {
                    int pixel = queue.Dequeue();
                    int x = pixel % loaded.Width;
                    int y = pixel / loaded.Width;
                    component.Count++;
                    component.SumX += x;
                    component.SumY += y;
                    component.MinX = Math.Min(component.MinX, x);
                    component.MinY = Math.Min(component.MinY, y);
                    component.MaxX = Math.Max(component.MaxX, x);
                    component.MaxY = Math.Max(component.MaxY, y);
                    for (int dy = -1; dy <= 1; dy++)
                    {
                        for (int dx = -1; dx <= 1; dx++)
                        {
                            if (dx == 0 && dy == 0) continue;
                            int nextX = x + dx, nextY = y + dy;
                            if (nextX < 0 || nextX >= loaded.Width || nextY < 0 || nextY >= loaded.Height) continue;
                            int next = nextY * loaded.Width + nextX;
                            if (labels[next] != -1) continue;
                            labels[next] = component.Label;
                            queue.Enqueue(next);
                        }
                    }
                }
                components.Add(component);
            }

            var mainFigures = components.OrderByDescending(component => component.Count).Take(frameCount).OrderBy(component => component.CenterX).ToArray();
            if (mainFigures.Length != frameCount) throw new InvalidDataException(String.Format("Expected {0} principal figures but found {1} in {2}.", frameCount, mainFigures.Length, inputPath));
            int[] componentPose = new int[components.Count];
            foreach (var component in components)
            {
                int nearest = 0;
                double nearestDistance = Double.MaxValue;
                for (int pose = 0; pose < mainFigures.Length; pose++)
                {
                    double dx = component.CenterX - mainFigures[pose].CenterX;
                    double dy = (component.CenterY - mainFigures[pose].CenterY) * .35;
                    double distance = dx * dx + dy * dy;
                    if (distance < nearestDistance) { nearestDistance = distance; nearest = pose; }
                }
                componentPose[component.Label] = nearest;
            }

            var selectedComponents = components.Where(component => componentPose[component.Label] == frameIndex).ToArray();
            int selectedMinX = selectedComponents.Min(component => component.MinX);
            int selectedMaxX = selectedComponents.Max(component => component.MaxX);
            int selectedMaxY = selectedComponents.Max(component => component.MaxY);
            int cropLeft = Math.Max(0, selectedMinX - 10);
            int cropRight = Math.Min(loaded.Width, selectedMaxX + 11);
            int cropWidth = cropRight - cropLeft;
            int cropHeight = loaded.Height;
            int footMinX = Int32.MaxValue, footMaxX = -1;
            for (int y = Math.Max(0, selectedMaxY - 44); y <= selectedMaxY; y++)
            {
                for (int x = selectedMinX; x <= selectedMaxX; x++)
                {
                    int label = labels[y * loaded.Width + x];
                    if (label >= 0 && componentPose[label] == frameIndex)
                    {
                        footMinX = Math.Min(footMinX, x);
                        footMaxX = Math.Max(footMaxX, x);
                    }
                }
            }
            int rawRootX = ((footMinX == Int32.MaxValue ? selectedMinX : footMinX) + (footMaxX < 0 ? selectedMaxX : footMaxX)) / 2 - cropLeft;

            using (var cell = new Bitmap(cropWidth, cropHeight, PixelFormat.Format32bppArgb))
            {
                long removed = 0;
                long spill = 0;
                for (int y = 0; y < cropHeight; y++)
                {
                    for (int x = 0; x < cropWidth; x++)
                    {
                        int sourceX = cropLeft + x;
                        int pixel = y * loaded.Width + sourceX;
                        int label = labels[pixel];
                        int offset = y * loadedStride + sourceX * 4;
                        byte blue = loadedBytes[offset], green = loadedBytes[offset + 1], red = loadedBytes[offset + 2], alpha = loadedBytes[offset + 3];
                        if (label < 0 || componentPose[label] != frameIndex)
                        {
                            cell.SetPixel(x, y, Color.Transparent);
                            removed++;
                            continue;
                        }
                        if (green > Math.Max(red, blue) * 1.08 && green > 75)
                        {
                            green = (byte)Math.Max(red, blue);
                            spill++;
                        }
                        cell.SetPixel(x, y, Color.FromArgb(alpha, red, green, blue));
                    }
                }

                using (var output = new Bitmap(outputWidth, outputHeight, PixelFormat.Format32bppArgb))
                {
                    using (var graphics = Graphics.FromImage(output))
                    {
                        graphics.Clear(Color.Transparent);
                        graphics.CompositingMode = CompositingMode.SourceOver;
                        graphics.CompositingQuality = CompositingQuality.HighQuality;
                        graphics.InterpolationMode = InterpolationMode.HighQualityBicubic;
                        graphics.PixelOffsetMode = PixelOffsetMode.HighQuality;
                        graphics.SmoothingMode = SmoothingMode.HighQuality;
                        int destinationX = targetRootX - (int)Math.Round(rawRootX * sequenceWideScale);
                        int destinationY = targetRootY - (int)Math.Round(rawRootY * sequenceWideScale);
                        int destinationWidth = (int)Math.Round(cropWidth * sequenceWideScale);
                        int destinationHeight = (int)Math.Round(cropHeight * sequenceWideScale);
                        graphics.DrawImage(cell, new Rectangle(destinationX, destinationY, destinationWidth, destinationHeight), 0, 0, cropWidth, cropHeight, GraphicsUnit.Pixel);
                    }

                    var rectangle = new Rectangle(0, 0, outputWidth, outputHeight);
                    var data = output.LockBits(rectangle, ImageLockMode.ReadWrite, PixelFormat.Format32bppArgb);
                    byte[] bytes = new byte[data.Stride * outputHeight];
                    Marshal.Copy(data.Scan0, bytes, 0, bytes.Length);
                    long visible = 0, remainingMagenta = 0;
                    double weightedX = 0, weightedY = 0;
                    int minX = outputWidth, minY = outputHeight, maxX = -1, maxY = -1;
                    for (int y = 0; y < outputHeight; y++)
                    {
                        for (int x = 0; x < outputWidth; x++)
                        {
                            int offset = y * data.Stride + x * 4;
                            if (bytes[offset + 3] <= 8) continue;
                            byte blue = bytes[offset], green = bytes[offset + 1], red = bytes[offset + 2];
                            visible++;
                            weightedX += x; weightedY += y;
                            minX = Math.Min(minX, x); minY = Math.Min(minY, y);
                            maxX = Math.Max(maxX, x); maxY = Math.Max(maxY, y);
                            if (IsMeaningfulMagenta(red, green, blue))
                            {
                                byte ink = (byte)Math.Min(34, Math.Round(red * .08 + green * .18 + blue * .05));
                                bytes[offset] = ink;
                                bytes[offset + 1] = ink;
                                bytes[offset + 2] = ink;
                                red = ink; green = ink; blue = ink;
                            }
                            if (IsMeaningfulMagenta(red, green, blue)) remainingMagenta++;
                        }
                    }
                    Marshal.Copy(bytes, 0, data.Scan0, bytes.Length);
                    output.UnlockBits(data);
                    Directory.CreateDirectory(Path.GetDirectoryName(outputPath));
                    output.Save(outputPath, ImageFormat.Png);
                    return new LamuhThrowFrameMetrics {
                        MinX = minX, MinY = minY, MaxX = maxX, MaxY = maxY,
                        CentroidX = visible == 0 ? 0 : weightedX / visible,
                        CentroidY = visible == 0 ? 0 : weightedY / visible,
                        VisiblePixels = visible,
                        BackgroundPixelsRemoved = removed,
                        GreenSpillPixelsCorrected = spill,
                        MeaningfulMagentaPixelsRemaining = remainingMagenta,
                        TouchesEdge = minX <= 0 || minY <= 0 || maxX >= outputWidth - 1 || maxY >= outputHeight - 1
                    };
                }
            }
        }
    }
}
'@ -ReferencedAssemblies @('System.Drawing.dll', 'System.dll', 'System.Core.dll')
}

$reviewRoot = Join-Path $RepoRoot 'tools\nga-forge\review\lamuh-legacy-v2-throws-v1'
$rawRoot = Join-Path $reviewRoot 'raw'
$normalizedRoot = Join-Path $reviewRoot 'normalized'
New-Item -ItemType Directory -Force -Path $normalizedRoot | Out-Null

$sequences = @(
    [ordered]@{
        id = 'universal_grab_attempt'; label = 'Universal Grab Attempt / Whiff'; raw = 'universal-grab-attempt-strip-v1.png'; totalTicks = 20; exposureTicks = @(3, 2, 3, 3, 4, 5); connectTick = 4; releaseTick = $null
        roles = @('guarded_neutral_entry', 'body_driven_reach', 'maximum_reach', 'secure_ready', 'whiff_recoil', 'guarded_recovery')
    },
    [ordered]@{
        id = 'forward_throw'; label = 'Forward Throw'; raw = 'forward-throw-strip-v1.png'; totalTicks = 32; exposureTicks = @(6, 2, 3, 4, 5, 12); connectTick = 4; releaseTick = 14
        roles = @('secure_ready', 'step_in_load', 'hip_drive', 'decisive_forward_release', 'forward_follow_through', 'guarded_recovery')
    },
    [ordered]@{
        id = 'back_throw'; label = 'Back Throw'; raw = 'back-throw-strip-v1.png'; totalTicks = 36; exposureTicks = @(6, 2, 4, 4, 6, 14); connectTick = 4; releaseTick = 16
        roles = @('secure_ready', 'draw_close_and_plant', 'pivot_load', 'controlled_redirect', 'release_behind_side_switch', 'unwind_guarded_recovery')
    }
)

$targetRoot = [ordered]@{ x = 768; y = 1360 }
$sequenceScale = 2.0
$reportSequences = @()
foreach ($sequence in $sequences) {
    if (($sequence.exposureTicks | Measure-Object -Sum).Sum -ne $sequence.totalTicks) { throw "$($sequence.id) exposure total does not equal the unchanged runtime duration." }
    $rawPath = Join-Path $rawRoot $sequence.raw
    if (-not (Test-Path -LiteralPath $rawPath)) { throw "Missing throw raw strip: $rawPath" }
    $frames = @()
    for ($index = 0; $index -lt 6; $index++) {
        $outputName = ('{0}-{1:d2}.png' -f $sequence.id.Replace('_', '-'), $index)
        $outputPath = Join-Path $normalizedRoot $outputName
        $metrics = [LamuhThrowFamilyNormalizer]::Normalize($rawPath, $outputPath, $index, 6, 585, $targetRoot.x, $targetRoot.y, 2048, 1536, $sequenceScale)
        if ($metrics.VisiblePixels -le 0) { throw "$($sequence.label) frame $index is empty." }
        if ($metrics.TouchesEdge) { throw "$($sequence.label) frame $index touches the normalized canvas edge." }
        if ($metrics.MeaningfulMagentaPixelsRemaining -ne 0) { throw "$($sequence.label) frame $index contains a purple/magenta outline family." }
        $frames += [ordered]@{
            index = $index
            role = $sequence.roles[$index]
            rawPath = (Resolve-Path -LiteralPath $rawPath).Path.Substring($RepoRoot.Length + 1).Replace('\', '/')
            rawSha256 = Get-Sha256 -LiteralPath $rawPath
            normalizedPath = (Resolve-Path -LiteralPath $outputPath).Path.Substring($RepoRoot.Length + 1).Replace('\', '/')
            normalizedSha256 = Get-Sha256 -LiteralPath $outputPath
            normalizedRoot = $targetRoot
            visibleBounds = [ordered]@{ minX = $metrics.MinX; minY = $metrics.MinY; maxX = $metrics.MaxX; maxY = $metrics.MaxY }
            visualCentroid = [ordered]@{ x = [math]::Round($metrics.CentroidX, 2); y = [math]::Round($metrics.CentroidY, 2) }
            visiblePixels = $metrics.VisiblePixels
            backgroundPixelsRemoved = $metrics.BackgroundPixelsRemoved
            greenSpillPixelsCorrected = $metrics.GreenSpillPixelsCorrected
            meaningfulMagentaPixelsRemaining = $metrics.MeaningfulMagentaPixelsRemaining
            touchesEdge = $metrics.TouchesEdge
        }
    }
    if (($frames.normalizedSha256 | Select-Object -Unique).Count -ne 6) { throw "$($sequence.label) has duplicated output frames." }
    $reportSequences += [ordered]@{
        id = $sequence.id
        label = $sequence.label
        authoredFrameCount = 6
        totalTicks = $sequence.totalTicks
        exposureTicks = $sequence.exposureTicks
        connectTick = $sequence.connectTick
        releaseTick = $sequence.releaseTick
        rawStrip = [ordered]@{ path = $frames[0].rawPath; sha256 = $frames[0].rawSha256 }
        frames = $frames
    }
}

$contactSheetPath = Join-Path $reviewRoot 'throw-family-numbered-contact-sheet.png'
$board = New-Object System.Drawing.Bitmap 2120, 1390
$graphics = [System.Drawing.Graphics]::FromImage($board)
$titleFont = New-Object System.Drawing.Font('Segoe UI', 19, [System.Drawing.FontStyle]::Bold)
$labelFont = New-Object System.Drawing.Font('Segoe UI', 10, [System.Drawing.FontStyle]::Bold)
$noteFont = New-Object System.Drawing.Font('Segoe UI', 9, [System.Drawing.FontStyle]::Regular)
$panelPen = New-Object System.Drawing.Pen([System.Drawing.Color]::FromArgb(100, 255, 255, 255), 1)
$rootPen = New-Object System.Drawing.Pen([System.Drawing.Color]::FromArgb(220, 255, 224, 138), 2)
try {
    $graphics.Clear([System.Drawing.Color]::FromArgb(255, 6, 11, 17))
    $graphics.DrawString('LAMUH LEGACY V2 - STANDARD GRAB / THROW FAMILY - NUMBERED FRAME SCRUB', $titleFont, [System.Drawing.Brushes]::Goldenrod, 24, 16)
    $graphics.DrawString('Fixed root and one sequence-wide scale - deterministic gameplay timelines unchanged - candidate only', $noteFont, [System.Drawing.Brushes]::LightGray, 26, 50)
    for ($sequenceIndex = 0; $sequenceIndex -lt $reportSequences.Count; $sequenceIndex++) {
        $sequence = $reportSequences[$sequenceIndex]
        $rowY = 78 + $sequenceIndex * 430
        $graphics.DrawString(("{0} | {1} ticks | connect {2} | release {3}" -f $sequence.label, $sequence.totalTicks, $sequence.connectTick, $(if ($null -eq $sequence.releaseTick) { 'n/a' } else { $sequence.releaseTick })), $labelFont, [System.Drawing.Brushes]::White, 24, $rowY)
        foreach ($frame in $sequence.frames) {
            $panelX = 20 + $frame.index * 348
            $panelY = $rowY + 28
            $panelRectangle = New-Object System.Drawing.Rectangle $panelX, $panelY, 336, 382
            $graphics.DrawRectangle($panelPen, $panelRectangle)
            $image = [System.Drawing.Image]::FromFile((Join-Path $RepoRoot $frame.normalizedPath.Replace('/', '\')))
            try { $graphics.DrawImage($image, $panelX + 8, $panelY + 34, 320, 338) }
            finally { $image.Dispose() }
            $graphics.DrawString(('{0:d2} {1}' -f $frame.index, $frame.role.Replace('_', ' ')), $noteFont, [System.Drawing.Brushes]::White, $panelX + 9, $panelY + 8)
            $rootX = $panelX + 8 + [math]::Round(($targetRoot.x / 2048) * 320)
            $rootY = $panelY + 34 + [math]::Round(($targetRoot.y / 1536) * 338)
            $graphics.DrawLine($rootPen, $rootX - 5, $rootY, $rootX + 5, $rootY)
            $graphics.DrawLine($rootPen, $rootX, $rootY - 5, $rootX, $rootY + 5)
        }
    }
    $board.Save($contactSheetPath, [System.Drawing.Imaging.ImageFormat]::Png)
}
finally {
    $rootPen.Dispose(); $panelPen.Dispose(); $noteFont.Dispose(); $labelFont.Dispose(); $titleFont.Dispose(); $graphics.Dispose(); $board.Dispose()
}

$standingHeight = 800
$standingFrameHeights = @($reportSequences | ForEach-Object { @($_.frames | Where-Object { $_.role -notmatch 'load|drive|pivot|redirect|release|follow' } | ForEach-Object { $_.visibleBounds.maxY - $_.visibleBounds.minY + 1 }) })
$maxStandingHeightDeltaPct = [math]::Round((($standingFrameHeights | ForEach-Object { [math]::Abs($_ - $standingHeight) } | Measure-Object -Maximum).Maximum / $standingHeight) * 100, 2)
$report = [ordered]@{
    schemaVersion = '1.0.0'
    subject = 'lamuh_legacy_v2.standard_grab_throw_family.candidate.v1'
    status = 'awaiting_human_standard_grab_forward_throw_back_throw_review'
    candidateOnly = $true
    deployable = $false
    standardVictimClass = 'standard_humanoid'
    globalVictimScale = $false
    futureVictimClasses = @('small', 'large', 'non_humanoid', 'extreme_proportion')
    normalization = [ordered]@{
        canvas = [ordered]@{ width = 2048; height = 1536 }
        normalizedRoot = $targetRoot
        sequenceWideScale = $sequenceScale
        perFrameRendererScale = $false
        visualRecentering = $false
        placementPolicy = 'fixed_root_and_single_sequence_scale_preserving_body_rotation_and_pose_deformation'
        backgroundRemoval = 'chroma_green_removal_and_edge_despill_v1'
        purpleOutlinePolicy = 'no_meaningful_magenta_pixels'
    }
    sequences = $reportSequences
    contactSheet = [ordered]@{ path = $contactSheetPath.Substring($RepoRoot.Length + 1).Replace('\', '/'); sha256 = Get-Sha256 -LiteralPath $contactSheetPath }
    validation = [ordered]@{
        exactSequenceCount = $reportSequences.Count -eq 3
        exactFrameCountPerSequence = ($reportSequences | ForEach-Object { $_.frames.Count -eq 6 }) -notcontains $false
        deterministicDurationsPreserved = ($reportSequences | ForEach-Object { ($_.exposureTicks | Measure-Object -Sum).Sum -eq $_.totalTicks }) -notcontains $false
        allFramesDistinctPerSequence = ($reportSequences | ForEach-Object { ($_.frames.normalizedSha256 | Select-Object -Unique).Count -eq 6 }) -notcontains $false
        fixedRoot = $targetRoot
        perFrameRendererScale = $false
        meaningfulMagentaPixelsRemaining = ($reportSequences.frames.meaningfulMagentaPixelsRemaining | Measure-Object -Sum).Sum
        touchesEdge = $reportSequences.frames.touchesEdge -contains $true
        referenceStandingHeight = $standingHeight
        reviewedStandingFrameHeights = $standingFrameHeights
        maxStandingHeightDeltaPct = $maxStandingHeightDeltaPct
    }
}

$reportPath = Join-Path $reviewRoot 'normalization.report.json'
$report | ConvertTo-Json -Depth 20 | Set-Content -LiteralPath $reportPath -Encoding UTF8
Write-Output 'Normalized 18 Lamuh Legacy V2 standard-grab/throw candidate frames.'
Write-Output "Report: $reportPath"
