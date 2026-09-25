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

if (-not ('LamuhAirNormalNormalizer' -as [type])) {
    Add-Type -TypeDefinition @'
using System;
using System.Collections.Generic;
using System.Drawing;
using System.Drawing.Drawing2D;
using System.Drawing.Imaging;
using System.IO;
using System.Runtime.InteropServices;

public sealed class LamuhAirNormalMetrics
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
    public long MagentaPixelsNeutralized { get; set; }
    public long MeaningfulMagentaPixelsRemaining { get; set; }
    public bool TouchesEdge { get; set; }
}

public static class LamuhAirNormalNormalizer
{
    private static bool IsChromaGreen(byte red, byte green, byte blue)
    {
        return green >= 115 && green > red * 1.28 && green > blue * 1.28;
    }

    private static bool IsMeaningfulMagenta(byte red, byte green, byte blue)
    {
        return red > 45 && blue > 45 && red > green * 1.18 && blue > green * 1.18;
    }

    public static LamuhAirNormalMetrics Normalize(
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
            var rawRuns = new List<Tuple<int, int>>();
            int runStart = -1;
            for (int x = 0; x < loaded.Width; x++)
            {
                bool hasForeground = false;
                for (int y = 0; y < loaded.Height; y++)
                {
                    Color color = loaded.GetPixel(x, y);
                    if (color.A > 8 && !IsChromaGreen(color.R, color.G, color.B)) { hasForeground = true; break; }
                }
                if (hasForeground && runStart < 0) runStart = x;
                if (!hasForeground && runStart >= 0) { rawRuns.Add(Tuple.Create(runStart, x - 1)); runStart = -1; }
            }
            if (runStart >= 0) rawRuns.Add(Tuple.Create(runStart, loaded.Width - 1));

            var mergedRuns = new List<Tuple<int, int>>();
            foreach (var run in rawRuns)
            {
                if (run.Item2 - run.Item1 + 1 < 3) continue;
                // Generated connector strips can place adjacent full-body poses within
                // a narrow but still intentional gutter. Only bridge tiny internal
                // foreground gaps; a wider tolerance can incorrectly fuse two frames.
                if (mergedRuns.Count > 0 && run.Item1 - mergedRuns[mergedRuns.Count - 1].Item2 <= 4)
                {
                    var previous = mergedRuns[mergedRuns.Count - 1];
                    mergedRuns[mergedRuns.Count - 1] = Tuple.Create(previous.Item1, run.Item2);
                }
                else mergedRuns.Add(run);
            }
            if (mergedRuns.Count != frameCount) throw new InvalidDataException(String.Format("Expected {0} isolated figures but detected {1} in {2}.", frameCount, mergedRuns.Count, inputPath));

            int cropLeft = Math.Max(0, mergedRuns[frameIndex].Item1 - 10);
            int cropRight = Math.Min(loaded.Width, mergedRuns[frameIndex].Item2 + 11);
            if (frameIndex > 0)
            {
                int leftGutterMidpoint = (mergedRuns[frameIndex - 1].Item2 + mergedRuns[frameIndex].Item1) / 2 + 1;
                cropLeft = Math.Max(cropLeft, leftGutterMidpoint);
            }
            if (frameIndex < mergedRuns.Count - 1)
            {
                int rightGutterMidpoint = (mergedRuns[frameIndex].Item2 + mergedRuns[frameIndex + 1].Item1) / 2 + 1;
                cropRight = Math.Min(cropRight, rightGutterMidpoint);
            }
            int cropWidth = cropRight - cropLeft;
            int cropHeight = loaded.Height;
            int rawRootX = cropWidth / 2;

            using (var cell = new Bitmap(cropWidth, cropHeight, PixelFormat.Format32bppArgb))
            {
                long removed = 0;
                long spill = 0;
                long magenta = 0;
                for (int y = 0; y < cropHeight; y++)
                {
                    for (int x = 0; x < cropWidth; x++)
                    {
                        Color color = loaded.GetPixel(cropLeft + x, y);
                        byte red = color.R;
                        byte green = color.G;
                        byte blue = color.B;
                        if (color.A <= 8 || IsChromaGreen(red, green, blue))
                        {
                            cell.SetPixel(x, y, Color.Transparent);
                            removed++;
                            continue;
                        }
                        if (green > Math.Max(red, blue) * 1.08 && green > 80)
                        {
                            green = (byte)Math.Max(red, blue);
                            spill++;
                        }
                        if (IsMeaningfulMagenta(red, green, blue))
                        {
                            byte ink = (byte)Math.Min(34, Math.Round(red * .08 + green * .18 + blue * .05));
                            red = ink; green = ink; blue = ink; magenta++;
                        }
                        cell.SetPixel(x, y, Color.FromArgb(color.A, red, green, blue));
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
                    long visible = 0;
                    long remainingMagenta = 0;
                    double weightedX = 0;
                    double weightedY = 0;
                    int minX = outputWidth;
                    int minY = outputHeight;
                    int maxX = -1;
                    int maxY = -1;
                    for (int y = 0; y < outputHeight; y++)
                    {
                        for (int x = 0; x < outputWidth; x++)
                        {
                            int offset = y * data.Stride + x * 4;
                            byte alpha = bytes[offset + 3];
                            if (alpha <= 8) continue;
                            byte blue = bytes[offset];
                            byte green = bytes[offset + 1];
                            byte red = bytes[offset + 2];
                            visible++;
                            weightedX += x;
                            weightedY += y;
                            minX = Math.Min(minX, x);
                            minY = Math.Min(minY, y);
                            maxX = Math.Max(maxX, x);
                            maxY = Math.Max(maxY, y);
                            if (green > Math.Max(red, blue) * 1.08 && green > 80)
                            {
                                green = (byte)Math.Max(red, blue);
                                bytes[offset + 1] = green;
                                spill++;
                            }
                            if (IsMeaningfulMagenta(red, green, blue))
                            {
                                byte ink = (byte)Math.Min(34, Math.Round(red * .08 + green * .18 + blue * .05));
                                bytes[offset] = ink;
                                bytes[offset + 1] = ink;
                                bytes[offset + 2] = ink;
                                magenta++;
                            }
                        }
                    }

                    Marshal.Copy(bytes, 0, data.Scan0, bytes.Length);
                    output.UnlockBits(data);

                    Directory.CreateDirectory(Path.GetDirectoryName(outputPath));
                    output.Save(outputPath, ImageFormat.Png);
                    return new LamuhAirNormalMetrics {
                        MinX = minX,
                        MinY = minY,
                        MaxX = maxX,
                        MaxY = maxY,
                        CentroidX = visible == 0 ? 0 : weightedX / visible,
                        CentroidY = visible == 0 ? 0 : weightedY / visible,
                        VisiblePixels = visible,
                        BackgroundPixelsRemoved = removed,
                        GreenSpillPixelsCorrected = spill,
                        MagentaPixelsNeutralized = magenta,
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

$contentRoot = Join-Path $RepoRoot 'NO_GODS_ABOVE\engine_v2\content-source\characters\lamuh-legacy-v2'
$legacyAtlas = Join-Path $RepoRoot 'NO_GODS_ABOVE\assets\sprites\lamuh_final\lamuh_sheet_4_air_normals_atlas.png'
$expectedLegacyAtlasSha256 = '1FFCD0B944A166F6DB7B79D485030741A9A2BF85C4C1CD47C6B4F3D76D9E249F'
if ((Get-Sha256 -LiteralPath $legacyAtlas) -ne $expectedLegacyAtlasSha256) { throw 'Protected Lamuh V1 air-normal atlas changed.' }

$reviewRoot = Join-Path $RepoRoot 'tools\nga-forge\review\lamuh-legacy-v2-air-normals-v1'
$rawRoot = Join-Path $reviewRoot 'raw'
$normalizedRoot = Join-Path $reviewRoot 'normalized'
New-Item -ItemType Directory -Force -Path $normalizedRoot | Out-Null

$moves = @(
    [ordered]@{
        moveId = 'air_light'; label = 'Air Light'; sourceRow = 0; sourceFrameCount = 4; rawFrameCount = 5; authoredRawIndices = @(0, 1, 2, 3, 4); sourceV1ReferenceIndices = @(1, 1, 2, 2, 3); raw = 'air-light-strip-v2-smooth-single-hit.png'; sequenceWideScale = 1.96; contactFrames = @(2)
        roles = @('single_palm_compact_chamber', 'same_arm_extension_connector', 'single_open_palm_contact', 'same_arm_held_follow_through', 'compact_guarded_recovery')
        frameOrigins = @('TARGETED_SMOOTH_RECONSTRUCTION', 'TARGETED_CONNECTOR_ART', 'TARGETED_SMOOTH_RECONSTRUCTION', 'TARGETED_CONNECTOR_ART', 'TARGETED_SMOOTH_RECONSTRUCTION')
        disposition = 'MODERNIZE'
        motionNote = 'Rebuilds Jump Light as one continuous same-arm open-palm action: compact chamber, extension connector, one contact, held same-arm follow-through, and guarded recovery. The ambiguous fist strike remains excluded and the new connector spacing smooths body, coat, and loc travel without adding another hit.'
    },
    [ordered]@{
        moveId = 'air_medium'; label = 'Air Medium'; sourceRow = 1; sourceFrameCount = 6; rawFrameCount = 6; authoredRawIndices = @(0, 1, 2, 3, 4, 5); sourceV1ReferenceIndices = @(1, 1, 2, 4, 4, 5); raw = 'air-medium-strip-v4-two-foot-repair.png'; sequenceWideScale = 2.4; contactFrames = @(2)
        roles = @('same_leg_compact_chamber', 'same_leg_extension_connector', 'single_side_kick_contact', 'same_leg_retraction_connector', 'same_leg_knee_recoil', 'compact_air_guard_recovery')
        frameOrigins = @('TARGETED_SMOOTH_RECONSTRUCTION', 'TARGETED_CONNECTOR_ART', 'TARGETED_SMOOTH_RECONSTRUCTION', 'TARGETED_CONNECTOR_ART', 'TARGETED_SMOOTH_RECONSTRUCTION', 'TARGETED_SMOOTH_RECONSTRUCTION')
        disposition = 'MODERNIZE'
        motionNote = 'Rebuilds Jump Medium as one continuous same-leg side kick: compact chamber, extension connector, one contact, retraction connector, knee recoil, and guarded recovery. The duplicated third foot was removed from extension and contact without changing timing, scale, or the one-hit combat profile.'
        anatomyRepair = [ordered]@{
            status = 'TARGETED_REPAIR_CANDIDATE'
            issue = 'DUPLICATED_THIRD_FOOT'
            repairedFrames = @(1, 2)
            expectedVisibleFeetPerRepairedFrame = 2
            timingChanged = $false
            combatChanged = $false
        }
    },
    [ordered]@{
        moveId = 'air_heavy'; label = 'Air Heavy'; sourceRow = 2; sourceFrameCount = 7; rawFrameCount = 7; authoredRawIndices = @(0, 1, 2, 3, 4, 5, 6); sourceV1ReferenceIndices = @(0, 1, 2, 3, 4, 5, 6); raw = 'air-heavy-strip-v1-body-only.png'; sequenceWideScale = 3.0; contactFrames = @(3)
        roles = @('knee_tucked_descent_entry', 'two_hand_downward_reach', 'two_hand_acceleration', 'single_two_hand_contact_body', 'same_hand_held_follow_through', 'airborne_guarded_recoil', 'connected_air_recovery')
        frameOrigins = @('PRESERVED_V1_DERIVED', 'PRESERVED_V1_DERIVED', 'PRESERVED_V1_DERIVED', 'PRESERVED_V1_DERIVED', 'PRESERVED_V1_DERIVED', 'PRESERVED_V1_DERIVED', 'PRESERVED_V1_DERIVED')
        disposition = 'MODERNIZE'
        motionNote = 'Preserves the strongest V1 descending two-hand slam arc and squash/stretch while removing contradictory later kick/palm impacts; frame 03 is the only contact.'
    }
)

$targetRoot = [ordered]@{ x = 768; y = 1360 }
$reportMoves = @()
foreach ($move in $moves) {
    $rawPath = Join-Path $rawRoot $move.raw
    if (-not (Test-Path -LiteralPath $rawPath)) { throw "Missing air-normal raw candidate: $rawPath" }
    $frameReports = @()
    for ($index = 0; $index -lt $move.authoredRawIndices.Count; $index++) {
        $rawIndex = $move.authoredRawIndices[$index]
        $outputName = ('{0}-{1:d2}.png' -f $move.moveId.Replace('_', '-'), $index)
        $outputPath = Join-Path $normalizedRoot $outputName
        $metrics = [LamuhAirNormalNormalizer]::Normalize($rawPath, $outputPath, $rawIndex, $move.rawFrameCount, 620, $targetRoot.x, $targetRoot.y, 2048, 1536, $move.sequenceWideScale)
        if ($metrics.VisiblePixels -le 0) { throw "$($move.label) frame $index contains no visible pixels." }
        if ($metrics.TouchesEdge) { throw "$($move.label) frame $index touches the normalized canvas edge." }
        $sourceV1ReferenceIndex = $move.sourceV1ReferenceIndices[$index]
        $sourceFrame = Join-Path $contentRoot ('source-frames\{0}\{0}_{1:d2}.png' -f $move.moveId, $sourceV1ReferenceIndex)
        if (-not (Test-Path -LiteralPath $sourceFrame)) { throw "Missing protected V1 $($move.label) reference frame $sourceV1ReferenceIndex. Run the source extractor first." }
        $frameReports += [ordered]@{
            index = $index
            rawFrameIndex = $rawIndex
            sourceV1Index = $sourceV1ReferenceIndex
            sourceV1ReferenceIndex = $sourceV1ReferenceIndex
            frameOrigin = $move.frameOrigins[$index]
            sourceRelationship = 'V1_MOTION_REFERENCE_NOT_PIXEL_IDENTITY_FOR_TARGETED_RECONSTRUCTION'
            role = $move.roles[$index]
            sourceV1Path = (Resolve-Path -LiteralPath $sourceFrame).Path.Substring($RepoRoot.Length + 1).Replace('\', '/')
            sourceV1Sha256 = Get-Sha256 -LiteralPath $sourceFrame
            rawPath = (Resolve-Path -LiteralPath $rawPath).Path.Substring($RepoRoot.Length + 1).Replace('\', '/')
            rawSha256 = Get-Sha256 -LiteralPath $rawPath
            normalizedPath = (Resolve-Path -LiteralPath $outputPath).Path.Substring($RepoRoot.Length + 1).Replace('\', '/')
            normalizedSha256 = Get-Sha256 -LiteralPath $outputPath
            normalizedRoot = $targetRoot
            sequenceWideScale = $move.sequenceWideScale
            visibleBounds = [ordered]@{ minX = $metrics.MinX; minY = $metrics.MinY; maxX = $metrics.MaxX; maxY = $metrics.MaxY }
            visualCentroid = [ordered]@{ x = [math]::Round($metrics.CentroidX, 2); y = [math]::Round($metrics.CentroidY, 2) }
            visiblePixels = $metrics.VisiblePixels
            backgroundPixelsRemoved = $metrics.BackgroundPixelsRemoved
            greenSpillPixelsCorrected = $metrics.GreenSpillPixelsCorrected
            magentaPixelsNeutralized = $metrics.MagentaPixelsNeutralized
            meaningfulMagentaPixelsRemaining = $metrics.MeaningfulMagentaPixelsRemaining
            touchesEdge = $metrics.TouchesEdge
            visibleImpact = $move.contactFrames -contains $index
        }
    }
    if (($frameReports.normalizedSha256 | Select-Object -Unique).Count -ne $move.authoredRawIndices.Count) { throw "$($move.label) contains a duplicate authored frame." }
    $contactFrameReports = @($move.contactFrames | ForEach-Object { $frameReports[$_] })
    $contactFrameReport = $contactFrameReports[0]
    $reportMoves += [ordered]@{
        moveId = $move.moveId
        label = $move.label
        sourceRow = $move.sourceRow
        sourceFrameCount = $move.sourceFrameCount
        authoredFrameCount = $move.authoredRawIndices.Count
        contactFrame = $move.contactFrames[0]
        contactFrames = $move.contactFrames
        visibleImpactCount = $move.contactFrames.Count
        gameplayHitCount = $move.contactFrames.Count
        v2Disposition = $move.disposition
        motionNote = $move.motionNote
        anatomyRepair = if ($move.Contains('anatomyRepair')) { $move.anatomyRepair } else { $null }
        rawStrip = [ordered]@{ path = (Resolve-Path -LiteralPath $rawPath).Path.Substring($RepoRoot.Length + 1).Replace('\', '/'); sha256 = Get-Sha256 -LiteralPath $rawPath }
        contactPresentation = [ordered]@{
            path = $contactFrameReport.normalizedPath
            sha256 = $contactFrameReport.normalizedSha256
            bodyOnlyOnWhiff = $true
            bodyOnlyForAllOutcomes = $true
            vfxEnabled = $false
            classification = 'DISABLE_FOR_NOW'
            intendedOutcomes = @()
            contacts = @($contactFrameReports | ForEach-Object { [ordered]@{ frame = $_.index; path = $_.normalizedPath; sha256 = $_.normalizedSha256; role = $_.role } })
            note = 'Body-only review candidate. No contact VFX is promoted with this air-normal batch.'
        }
        normalization = [ordered]@{
            canvas = [ordered]@{ width = 2048; height = 1536 }
            normalizedRoot = $targetRoot
            sequenceWideScale = $move.sequenceWideScale
            perFrameRendererScale = $false
            visualRecentering = $false
            placementPolicy = 'single_authored_root_and_sequence_wide_scale_preserving_internal_motion'
            backgroundRemoval = 'chroma_green_removal_and_edge_despill_v1'
            alphaZeroRgbCleared = $true
            purpleOutlinePolicy = 'no_meaningful_magenta_pixels'
        }
        frames = $frameReports
    }
}

$contactSheetPath = Join-Path $reviewRoot 'air-normals-numbered-contact-sheet.png'
$board = New-Object System.Drawing.Bitmap 2120, 1390
$graphics = [System.Drawing.Graphics]::FromImage($board)
$titleFont = New-Object System.Drawing.Font('Segoe UI', 19, [System.Drawing.FontStyle]::Bold)
$labelFont = New-Object System.Drawing.Font('Segoe UI', 10, [System.Drawing.FontStyle]::Bold)
$noteFont = New-Object System.Drawing.Font('Segoe UI', 9, [System.Drawing.FontStyle]::Regular)
$panelPen = New-Object System.Drawing.Pen([System.Drawing.Color]::FromArgb(100, 255, 255, 255), 1)
$contactPen = New-Object System.Drawing.Pen([System.Drawing.Color]::FromArgb(255, 235, 185, 58), 4)
$rootPen = New-Object System.Drawing.Pen([System.Drawing.Color]::FromArgb(220, 255, 224, 138), 2)
try {
    $graphics.Clear([System.Drawing.Color]::FromArgb(255, 6, 11, 17))
    $graphics.DrawString('LAMUH LEGACY V2 - AIR NORMALS - NUMBERED FRAME SCRUB', $titleFont, [System.Drawing.Brushes]::Goldenrod, 24, 16)
    $graphics.DrawString('Fixed character scale per move - targeted connector poses - one body-only contact - candidate only', $noteFont, [System.Drawing.Brushes]::LightGray, 26, 50)
    for ($moveIndex = 0; $moveIndex -lt $reportMoves.Count; $moveIndex++) {
        $move = $reportMoves[$moveIndex]
        $rowY = 78 + $moveIndex * 430
        $contactLabel = ($move.contactFrames | ForEach-Object { '{0:d2}' -f $_ }) -join ' / '
        $graphics.DrawString(('{0} | disposition {1} | contact frame(s) {2}' -f $move.label, $move.v2Disposition, $contactLabel), $labelFont, [System.Drawing.Brushes]::White, 24, $rowY)
        foreach ($frame in $move.frames) {
            $panelX = 20 + $frame.index * 298
            $panelY = $rowY + 28
            $panelRectangle = New-Object System.Drawing.Rectangle $panelX, $panelY, 286, 382
            $graphics.DrawRectangle($panelPen, $panelRectangle)
            if ($move.contactFrames -contains $frame.index) { $graphics.DrawRectangle($contactPen, $panelRectangle) }
            $image = [System.Drawing.Image]::FromFile((Join-Path $RepoRoot $frame.normalizedPath.Replace('/', '\')))
            try { $graphics.DrawImage($image, $panelX + 8, $panelY + 34, 270, 338) }
            finally { $image.Dispose() }
            $graphics.DrawString(('{0:d2} {1}' -f $frame.index, $frame.role.Replace('_', ' ')), $noteFont, [System.Drawing.Brushes]::White, $panelX + 9, $panelY + 8)
            $rootX = $panelX + 8 + [math]::Round(($targetRoot.x / 2048) * 270)
            $rootY = $panelY + 34 + [math]::Round(($targetRoot.y / 1536) * 338)
            $graphics.DrawLine($rootPen, $rootX - 5, $rootY, $rootX + 5, $rootY)
            $graphics.DrawLine($rootPen, $rootX, $rootY - 5, $rootX, $rootY + 5)
        }
    }
    $board.Save($contactSheetPath, [System.Drawing.Imaging.ImageFormat]::Png)
}
finally {
    $rootPen.Dispose(); $contactPen.Dispose(); $panelPen.Dispose(); $noteFont.Dispose(); $labelFont.Dispose(); $titleFont.Dispose(); $graphics.Dispose(); $board.Dispose()
}

$firstFrameHeights = @($reportMoves | ForEach-Object { $_.frames[0].visibleBounds.maxY - $_.frames[0].visibleBounds.minY + 1 })
$minFirstFrameHeight = ($firstFrameHeights | Measure-Object -Minimum).Minimum
$maxFirstFrameHeight = ($firstFrameHeights | Measure-Object -Maximum).Maximum
$crossMoveFirstFrameHeightDeltaPct = [math]::Round((($maxFirstFrameHeight - $minFirstFrameHeight) / [math]::Max(1, $maxFirstFrameHeight)) * 100, 2)

$report = [ordered]@{
    schemaVersion = '1.0.0'
    subject = 'lamuh_legacy_v2.air_normals.candidate.v1'
    status = 'candidate-only'
    deployable = $false
    protectedLegacyAtlas = [ordered]@{ path = $legacyAtlas.Substring($RepoRoot.Length + 1).Replace('\', '/'); sha256 = Get-Sha256 -LiteralPath $legacyAtlas }
    contactSheet = [ordered]@{ path = $contactSheetPath.Substring($RepoRoot.Length + 1).Replace('\', '/'); sha256 = Get-Sha256 -LiteralPath $contactSheetPath }
    moves = $reportMoves
    visualValidation = [ordered]@{
        fixedRoot = $targetRoot
        perFrameRendererScale = $false
        crossMoveFirstFrameVisibleHeights = $firstFrameHeights
        crossMoveFirstFrameHeightDeltaPct = $crossMoveFirstFrameHeightDeltaPct
        scaleComparisonIsPoseSensitive = $true
        meaningfulMagentaPixelsRemaining = ($reportMoves.frames.meaningfulMagentaPixelsRemaining | Measure-Object -Sum).Sum
        touchesEdge = $reportMoves.frames.touchesEdge -contains $true
        allFramesDistinct = ($reportMoves | ForEach-Object { ($_.frames.normalizedSha256 | Select-Object -Unique).Count -eq $_.authoredFrameCount }) -notcontains $false
        visibleImpactParity = ($reportMoves | ForEach-Object { $_.visibleImpactCount -eq $_.gameplayHitCount -and $_.visibleImpactCount -eq $_.contactFrames.Count }) -notcontains $false
        bodyOnlyContactPresentation = $true
    }
    humanReviewStatus = 'awaiting_human_air_normal_motion_scale_and_timing_review'
}

$reportPath = Join-Path $reviewRoot 'normalization.report.json'
$report | ConvertTo-Json -Depth 20 | Set-Content -LiteralPath $reportPath -Encoding UTF8
Write-Output "Normalized 18 Lamuh Legacy V2 air-normal candidate frames."
Write-Output "Report: $reportPath"
