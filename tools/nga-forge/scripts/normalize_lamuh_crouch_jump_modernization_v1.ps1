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

if (-not ('LamuhCrouchJumpNormalizer' -as [type])) {
    Add-Type -TypeDefinition @'
using System;
using System.Drawing;
using System.Drawing.Drawing2D;
using System.Drawing.Imaging;
using System.IO;
using System.Runtime.InteropServices;

public sealed class LamuhCrouchJumpBounds
{
    public int MinX { get; set; }
    public int MinY { get; set; }
    public int MaxX { get; set; }
    public int MaxY { get; set; }
    public int Width { get { return MaxX < MinX ? 0 : MaxX - MinX + 1; } }
    public int Height { get { return MaxY < MinY ? 0 : MaxY - MinY + 1; } }
}

public sealed class LamuhCrouchJumpMetrics
{
    public int MinX { get; set; }
    public int MinY { get; set; }
    public int MaxX { get; set; }
    public int MaxY { get; set; }
    public double CentroidX { get; set; }
    public double CentroidY { get; set; }
    public long VisiblePixels { get; set; }
    public long ChromaPixelsRemoved { get; set; }
    public long MagentaPixelsNeutralized { get; set; }
    public long MeaningfulMagentaPixelsRemaining { get; set; }
    public bool TouchesEdge { get; set; }
}

public static class LamuhCrouchJumpNormalizer
{
    private sealed class Component
    {
        public int Area;
        public int MinX = int.MaxValue;
        public int MinY = int.MaxValue;
        public int MaxX = -1;
        public int MaxY = -1;
    }

    private static bool IsChroma(byte red, byte green, byte blue, byte alpha)
    {
        if (alpha <= 8) return true;
        return green >= 80 && green > red * 1.08 && green > blue * 1.08 && green - red >= 16 && green - blue >= 16;
    }

    private static bool IsMeaningfulMagenta(byte red, byte green, byte blue)
    {
        return red > 45 && blue > 45 && red > green * 1.18 && blue > green * 1.18;
    }

    private static void RemoveDistantComponents(byte[] bytes, int stride, int width, int height)
    {
        int[] labels = new int[width * height];
        var components = new System.Collections.Generic.List<Component>();
        components.Add(new Component());
        int[] queue = new int[width * height];
        int nextLabel = 1;
        for (int startY = 0; startY < height; startY++) for (int startX = 0; startX < width; startX++)
        {
            int start = startY * width + startX;
            if (labels[start] != 0 || bytes[startY * stride + startX * 4 + 3] <= 12) continue;
            var component = new Component();
            int head = 0, tail = 0;
            queue[tail++] = start;
            labels[start] = nextLabel;
            while (head < tail)
            {
                int linear = queue[head++], x = linear % width, y = linear / width;
                component.Area++;
                component.MinX = Math.Min(component.MinX, x); component.MinY = Math.Min(component.MinY, y);
                component.MaxX = Math.Max(component.MaxX, x); component.MaxY = Math.Max(component.MaxY, y);
                int[] neighbors = { linear - 1, linear + 1, linear - width, linear + width };
                for (int index = 0; index < neighbors.Length; index++)
                {
                    int neighbor = neighbors[index];
                    if (neighbor < 0 || neighbor >= width * height || labels[neighbor] != 0) continue;
                    int nx = neighbor % width, ny = neighbor / width;
                    if (Math.Abs(nx - x) + Math.Abs(ny - y) != 1) continue;
                    if (bytes[ny * stride + nx * 4 + 3] <= 12) continue;
                    labels[neighbor] = nextLabel;
                    queue[tail++] = neighbor;
                }
            }
            components.Add(component);
            nextLabel++;
        }
        if (components.Count <= 2) return;
        int largestLabel = 1;
        for (int label = 2; label < components.Count; label++) if (components[label].Area > components[largestLabel].Area) largestLabel = label;
        var largest = components[largestLabel];
        const int allowance = 14;
        for (int y = 0; y < height; y++) for (int x = 0; x < width; x++)
        {
            int linear = y * width + x, label = labels[linear];
            if (label == 0 || label == largestLabel) continue;
            var component = components[label];
            bool insideMainEnvelope = component.MinX >= largest.MinX - allowance && component.MaxX <= largest.MaxX + allowance
                && component.MinY >= largest.MinY - allowance && component.MaxY <= largest.MaxY + allowance;
            if (insideMainEnvelope) continue;
            int offset = y * stride + x * 4;
            bytes[offset] = 0; bytes[offset + 1] = 0; bytes[offset + 2] = 0; bytes[offset + 3] = 0;
        }
    }

    public static LamuhCrouchJumpBounds AlphaBounds(string inputPath)
    {
        using (var loaded = new Bitmap(inputPath))
        using (var bitmap = new Bitmap(loaded.Width, loaded.Height, PixelFormat.Format32bppArgb))
        {
            using (var graphics = Graphics.FromImage(bitmap))
            {
                graphics.CompositingMode = CompositingMode.SourceCopy;
                graphics.DrawImage(loaded, 0, 0, loaded.Width, loaded.Height);
            }
            var rectangle = new Rectangle(0, 0, bitmap.Width, bitmap.Height);
            var data = bitmap.LockBits(rectangle, ImageLockMode.ReadOnly, PixelFormat.Format32bppArgb);
            byte[] bytes = new byte[data.Stride * bitmap.Height];
            Marshal.Copy(data.Scan0, bytes, 0, bytes.Length);
            bitmap.UnlockBits(data);
            int minX = bitmap.Width, minY = bitmap.Height, maxX = -1, maxY = -1;
            for (int y = 0; y < bitmap.Height; y++) for (int x = 0; x < bitmap.Width; x++)
            {
                if (bytes[y * data.Stride + x * 4 + 3] <= 12) continue;
                minX = Math.Min(minX, x); minY = Math.Min(minY, y); maxX = Math.Max(maxX, x); maxY = Math.Max(maxY, y);
            }
            return new LamuhCrouchJumpBounds { MinX = minX, MinY = minY, MaxX = maxX, MaxY = maxY };
        }
    }

    public static long ExtractCell(string sheetPath, string outputPath, int cellIndex, int cellCount)
    {
        using (var loaded = new Bitmap(sheetPath))
        using (var source = new Bitmap(loaded.Width, loaded.Height, PixelFormat.Format32bppArgb))
        {
            using (var graphics = Graphics.FromImage(source))
            {
                graphics.CompositingMode = CompositingMode.SourceCopy;
                graphics.DrawImage(loaded, 0, 0, loaded.Width, loaded.Height);
            }
            int startX = (int)Math.Round((double)cellIndex * source.Width / cellCount);
            int endX = (int)Math.Round((double)(cellIndex + 1) * source.Width / cellCount);
            int width = Math.Max(1, endX - startX);
            var sourceRectangle = new Rectangle(0, 0, source.Width, source.Height);
            var sourceData = source.LockBits(sourceRectangle, ImageLockMode.ReadOnly, PixelFormat.Format32bppArgb);
            byte[] sourceBytes = new byte[sourceData.Stride * source.Height];
            Marshal.Copy(sourceData.Scan0, sourceBytes, 0, sourceBytes.Length);
            source.UnlockBits(sourceData);
            using (var output = new Bitmap(width, source.Height, PixelFormat.Format32bppArgb))
            {
                var outputRectangle = new Rectangle(0, 0, width, source.Height);
                var outputData = output.LockBits(outputRectangle, ImageLockMode.WriteOnly, PixelFormat.Format32bppArgb);
                byte[] outputBytes = new byte[outputData.Stride * output.Height];
                long removed = 0;
                for (int y = 0; y < source.Height; y++) for (int x = 0; x < width; x++)
                {
                    int sourceOffset = y * sourceData.Stride + (startX + x) * 4;
                    byte blue = sourceBytes[sourceOffset];
                    byte green = sourceBytes[sourceOffset + 1];
                    byte red = sourceBytes[sourceOffset + 2];
                    byte alpha = sourceBytes[sourceOffset + 3];
                    if (IsChroma(red, green, blue, alpha)) { removed++; continue; }
                    if (IsMeaningfulMagenta(red, green, blue))
                    {
                        byte ink = (byte)Math.Min(34, Math.Round(red * .08 + green * .18 + blue * .05));
                        red = ink; green = ink; blue = ink;
                    }
                    int outputOffset = y * outputData.Stride + x * 4;
                    outputBytes[outputOffset] = blue;
                    outputBytes[outputOffset + 1] = green;
                    outputBytes[outputOffset + 2] = red;
                    outputBytes[outputOffset + 3] = alpha;
                }
                RemoveDistantComponents(outputBytes, outputData.Stride, width, output.Height);
                Marshal.Copy(outputBytes, 0, outputData.Scan0, outputBytes.Length);
                output.UnlockBits(outputData);
                Directory.CreateDirectory(Path.GetDirectoryName(outputPath));
                output.Save(outputPath, ImageFormat.Png);
                return removed;
            }
        }
    }

    public static LamuhCrouchJumpMetrics NormalizeFrame(
        string inputPath,
        string outputPath,
        int targetRootX,
        int targetRootY,
        int outputWidth,
        int outputHeight,
        double scale,
        long chromaPixelsRemoved)
    {
        var sourceBounds = AlphaBounds(inputPath);
        if (sourceBounds.Width <= 0 || sourceBounds.Height <= 0) throw new InvalidOperationException("No visible pixels in " + inputPath);
        double sourceRootX = (sourceBounds.MinX + sourceBounds.MaxX) / 2.0;
        double sourceRootY = sourceBounds.MaxY;
        using (var source = new Bitmap(inputPath))
        using (var output = new Bitmap(outputWidth, outputHeight, PixelFormat.Format32bppArgb))
        {
            using (var graphics = Graphics.FromImage(output))
            {
                graphics.Clear(Color.Transparent);
                graphics.CompositingMode = CompositingMode.SourceOver;
                graphics.InterpolationMode = InterpolationMode.HighQualityBicubic;
                graphics.PixelOffsetMode = PixelOffsetMode.HighQuality;
                graphics.SmoothingMode = SmoothingMode.HighQuality;
                float destinationX = (float)(targetRootX - sourceRootX * scale);
                float destinationY = (float)(targetRootY - sourceRootY * scale);
                graphics.DrawImage(source, destinationX, destinationY, (float)(source.Width * scale), (float)(source.Height * scale));
            }
            var rectangle = new Rectangle(0, 0, output.Width, output.Height);
            var data = output.LockBits(rectangle, ImageLockMode.ReadWrite, PixelFormat.Format32bppArgb);
            byte[] bytes = new byte[data.Stride * output.Height];
            Marshal.Copy(data.Scan0, bytes, 0, bytes.Length);
            int minX = output.Width, minY = output.Height, maxX = -1, maxY = -1;
            long visible = 0, magenta = 0, remaining = 0;
            double weightedX = 0, weightedY = 0;
            for (int y = 0; y < output.Height; y++) for (int x = 0; x < output.Width; x++)
            {
                int offset = y * data.Stride + x * 4;
                byte alpha = bytes[offset + 3];
                if (alpha <= 12) { bytes[offset] = 0; bytes[offset + 1] = 0; bytes[offset + 2] = 0; bytes[offset + 3] = 0; continue; }
                byte blue = bytes[offset], green = bytes[offset + 1], red = bytes[offset + 2];
                if (IsMeaningfulMagenta(red, green, blue))
                {
                    byte ink = (byte)Math.Min(34, Math.Round(red * .08 + green * .18 + blue * .05));
                    bytes[offset] = ink; bytes[offset + 1] = ink; bytes[offset + 2] = ink; magenta++;
                    blue = ink; green = ink; red = ink;
                }
                if (IsMeaningfulMagenta(red, green, blue)) remaining++;
                visible++; weightedX += x; weightedY += y;
                minX = Math.Min(minX, x); minY = Math.Min(minY, y); maxX = Math.Max(maxX, x); maxY = Math.Max(maxY, y);
            }
            Marshal.Copy(bytes, 0, data.Scan0, bytes.Length);
            output.UnlockBits(data);
            Directory.CreateDirectory(Path.GetDirectoryName(outputPath));
            output.Save(outputPath, ImageFormat.Png);
            return new LamuhCrouchJumpMetrics {
                MinX = minX, MinY = minY, MaxX = maxX, MaxY = maxY,
                CentroidX = visible == 0 ? 0 : weightedX / visible,
                CentroidY = visible == 0 ? 0 : weightedY / visible,
                VisiblePixels = visible,
                ChromaPixelsRemoved = chromaPixelsRemoved,
                MagentaPixelsNeutralized = magenta,
                MeaningfulMagentaPixelsRemaining = remaining,
                TouchesEdge = minX <= 0 || minY <= 0 || maxX >= outputWidth - 1 || maxY >= outputHeight - 1
            };
        }
    }

    public static void MakeContactSheet(string[] paths, string[] labels, string outputPath, int columns)
    {
        int cellWidth = 320, cellHeight = 250;
        int rows = (int)Math.Ceiling((double)paths.Length / columns);
        using (var sheet = new Bitmap(columns * cellWidth, rows * cellHeight, PixelFormat.Format32bppArgb))
        using (var graphics = Graphics.FromImage(sheet))
        using (var labelFont = new Font("Segoe UI", 11, FontStyle.Bold))
        using (var smallFont = new Font("Segoe UI", 9, FontStyle.Regular))
        {
            graphics.Clear(Color.FromArgb(8, 13, 19));
            graphics.InterpolationMode = InterpolationMode.HighQualityBicubic;
            for (int index = 0; index < paths.Length; index++)
            {
                int column = index % columns, row = index / columns;
                int left = column * cellWidth, top = row * cellHeight;
                using (var image = new Bitmap(paths[index]))
                {
                    const double fixedScale = .145;
                    int screenRootX = left + cellWidth / 2, screenRootY = top + 230;
                    int drawX = screenRootX - (int)Math.Round(768 * fixedScale);
                    int drawY = screenRootY - (int)Math.Round(1360 * fixedScale);
                    int drawWidth = (int)Math.Round(image.Width * fixedScale), drawHeight = (int)Math.Round(image.Height * fixedScale);
                    graphics.DrawImage(image, new Rectangle(drawX, drawY, drawWidth, drawHeight), new Rectangle(0, 0, image.Width, image.Height), GraphicsUnit.Pixel);
                }
                graphics.DrawRectangle(Pens.DimGray, left + 1, top + 1, cellWidth - 3, cellHeight - 3);
                string[] parts = labels[index].Split('|');
                graphics.DrawString(parts[0], labelFont, Brushes.White, left + 8, top + 7);
                if (parts.Length > 1) graphics.DrawString(parts[1], smallFont, Brushes.LightGray, left + 8, top + 26);
                graphics.DrawString("fixed root (768,1360)", smallFont, Brushes.Goldenrod, left + 8, top + cellHeight - 20);
            }
            Directory.CreateDirectory(Path.GetDirectoryName(outputPath));
            sheet.Save(outputPath, ImageFormat.Png);
        }
    }
}
'@ -ReferencedAssemblies @('System.Drawing.dll', 'System.dll', 'System.Core.dll')
}

$reviewRoot = Join-Path $RepoRoot 'tools\nga-forge\review\lamuh-legacy-v2-crouch-jump-modernization-v1'
$rawRoot = Join-Path $reviewRoot 'raw'
$sourceFrameRoot = Join-Path $reviewRoot 'source-frames'
$normalizedRoot = Join-Path $reviewRoot 'normalized'
$legacyRoot = Join-Path $RepoRoot 'NO_GODS_ABOVE\engine_v2\content-source\characters\lamuh-legacy-v2\source-frames'
$idleReference = Join-Path $RepoRoot 'NO_GODS_ABOVE\engine_v2\public\lamuh-legacy-v2\movement-v2\idle-00.png'
$crouchSheet = Join-Path $rawRoot 'crouch-source-sheet.png'
$jumpSheet = Join-Path $rawRoot 'jump-source-sheet.png'
foreach ($path in @($idleReference, $crouchSheet, $jumpSheet)) { if (-not (Test-Path -LiteralPath $path)) { throw "Missing crouch/jump prerequisite: $path" } }
New-Item -ItemType Directory -Force -Path $sourceFrameRoot, $normalizedRoot | Out-Null

$states = [ordered]@{
    crouch = [ordered]@{
        sheet = $crouchSheet; count = 6; legacyFolder = 'crouch'; legacyCount = 4; standingReferenceFrame = 0
        roles = @('lowering_entry', 'lowering_connector', 'deep_guarded_crouch', 'crouch_hold_settle', 'rising_connector', 'standing_recovery')
        legacyIndices = @(0, 1, 2, 3, 3, 0); exposureTicks = @(3, 3, 6, 6, 4, 4); loop = $false
    }
    jump = [ordered]@{
        sheet = $jumpSheet; count = 7; legacyFolder = 'jump'; legacyCount = 4; standingReferenceFrame = 6
        roles = @('jump_anticipation', 'takeoff_extension', 'rising_knee_tuck', 'apex_knee_tuck', 'falling_connector', 'soft_landing_compression', 'guarded_recovery')
        legacyIndices = @(0, 0, 1, 2, 3, 3, 0); exposureTicks = @(4, 3, 5, 4, 5, 4, 3); loop = $false
    }
}

$idleBounds = [LamuhCrouchJumpNormalizer]::AlphaBounds($idleReference)
if ($idleBounds.Height -le 0) { throw 'Modern idle reference has no visible pixels.' }
$removedByFrame = @{}
foreach ($stateId in $states.Keys) {
    $state = $states[$stateId]
    for ($index = 0; $index -lt $state.count; $index++) {
        $sourcePath = Join-Path $sourceFrameRoot ("{0}-{1:D2}.png" -f $stateId, $index)
        $removedByFrame["$stateId-$index"] = [LamuhCrouchJumpNormalizer]::ExtractCell($state.sheet, $sourcePath, $index, $state.count)
    }
    $standingPath = Join-Path $sourceFrameRoot ("{0}-{1:D2}.png" -f $stateId, $state.standingReferenceFrame)
    $standingBounds = [LamuhCrouchJumpNormalizer]::AlphaBounds($standingPath)
    $state.scaleCorrection = [Math]::Round($idleBounds.Height / [double]$standingBounds.Height, 8)
}

$frames = @()
$contactSheetPaths = @()
$contactSheetLabels = @()
foreach ($stateId in $states.Keys) {
    $state = $states[$stateId]
    for ($index = 0; $index -lt $state.count; $index++) {
        $sourcePath = Join-Path $sourceFrameRoot ("{0}-{1:D2}.png" -f $stateId, $index)
        $normalizedPath = Join-Path $normalizedRoot ("{0}-{1:D2}.png" -f $stateId, $index)
        $metrics = [LamuhCrouchJumpNormalizer]::NormalizeFrame($sourcePath, $normalizedPath, 768, 1360, 2048, 1536, $state.scaleCorrection, $removedByFrame["$stateId-$index"])
        if ($metrics.TouchesEdge) { throw "Normalized frame touches an edge: $stateId $index" }
        if ($metrics.MeaningfulMagentaPixelsRemaining -ne 0) { throw "Purple/magenta pixels remain: $stateId $index" }
        $legacyPath = Join-Path $legacyRoot (Join-Path $state.legacyFolder ("{0}_{1:D2}.png" -f $state.legacyFolder, $state.legacyIndices[$index]))
        if (-not (Test-Path -LiteralPath $legacyPath)) { throw "Missing protected legacy reference: $legacyPath" }
        $frames += [ordered]@{
            state = $stateId; index = $index; role = $state.roles[$index]
            legacyIndex = $state.legacyIndices[$index]
            legacyPath = $legacyPath.Substring($RepoRoot.Length + 1).Replace('\', '/')
            legacySha256 = Get-Sha256 -LiteralPath $legacyPath
            sourcePath = $sourcePath.Substring($RepoRoot.Length + 1).Replace('\', '/')
            sourceSha256 = Get-Sha256 -LiteralPath $sourcePath
            normalizedPath = $normalizedPath.Substring($RepoRoot.Length + 1).Replace('\', '/')
            normalizedSha256 = Get-Sha256 -LiteralPath $normalizedPath
            sourceScaleCorrection = $state.scaleCorrection
            normalizedRoot = [ordered]@{ x = 768; y = 1360 }
            visibleBounds = [ordered]@{ minX = $metrics.MinX; minY = $metrics.MinY; maxX = $metrics.MaxX; maxY = $metrics.MaxY }
            bodyCenter = [ordered]@{ x = [Math]::Round($metrics.CentroidX, 3); y = [Math]::Round($metrics.CentroidY, 3) }
            visiblePixels = $metrics.VisiblePixels
            chromaPixelsRemoved = $metrics.ChromaPixelsRemoved
            magentaPixelsNeutralized = $metrics.MagentaPixelsNeutralized
            meaningfulMagentaPixelsRemaining = $metrics.MeaningfulMagentaPixelsRemaining
            touchesEdge = $metrics.TouchesEdge
        }
        $contactSheetPaths += $normalizedPath
        $contactSheetLabels += ("{0} {1:D2}|{2}" -f $stateId, $index, $state.roles[$index].Replace('_', ' '))
    }
}

$contactSheetPath = Join-Path $reviewRoot 'crouch-jump-numbered-contact-sheet.png'
[LamuhCrouchJumpNormalizer]::MakeContactSheet($contactSheetPaths, $contactSheetLabels, $contactSheetPath, 7)
$stateReport = [ordered]@{}
foreach ($stateId in $states.Keys) {
    $state = $states[$stateId]
    $stateReport[$stateId] = [ordered]@{
        sourceFrameCount = $state.legacyCount
        authoredFrameCount = $state.count
        selectedLegacyFrames = $state.legacyIndices
        exposureTicks = $state.exposureTicks
        durationTicks = ($state.exposureTicks | Measure-Object -Sum).Sum
        loop = $state.loop
        sourceScaleCorrection = $state.scaleCorrection
    }
}

$report = [ordered]@{
    schemaVersion = '1.0.0'
    subject = 'lamuh_legacy_v2.crouch_jump.modern_style.candidate.v1'
    status = 'candidate-only'
    deployable = $false
    authoredFrameCount = $frames.Count
    protectedLegacyFrameCount = 8
    sourceSheets = [ordered]@{
        crouch = [ordered]@{ path = $crouchSheet.Substring($RepoRoot.Length + 1).Replace('\', '/'); sha256 = Get-Sha256 -LiteralPath $crouchSheet; generationMode = 'imagegen_reference_edit' }
        jump = [ordered]@{ path = $jumpSheet.Substring($RepoRoot.Length + 1).Replace('\', '/'); sha256 = Get-Sha256 -LiteralPath $jumpSheet; generationMode = 'imagegen_reference_edit' }
    }
    states = $stateReport
    normalization = [ordered]@{
        canvas = [ordered]@{ width = 2048; height = 1536 }
        normalizedRoot = [ordered]@{ x = 768; y = 1360 }
        runtimeMirrorAxisX = 768
        targetStandingHeightPixels = $idleBounds.Height
        sourceSheetCameraCorrections = [ordered]@{ crouch = $states.crouch.scaleCorrection; jump = $states.jump.scaleCorrection }
        scalePolicy = 'one_baked_camera_correction_per_generated_source_sheet; no_per_frame_or_runtime_rescale'
        perFrameRendererScale = $false
        visualRecentering = $false
        placementPolicy = 'baked_body_axis_and_lowest_support_foot_root_landmark; simulation_owns_world_travel'
        transparentPaddingRequired = $true
        alphaZeroRgbCleared = $true
        backgroundRemoval = 'dominant_green_chroma_cleanup_v1'
        magentaPolicy = 'reject_or_replace_with_neutral_dark_ink'
    }
    sourceRepairReason = 'Preserve the legacy low crouch and airborne knee-tuck silhouettes while rebuilding obsolete purple-outlined artwork in the approved modern Lamuh style and adding authored entry, exit, takeoff, fall, and landing connectors.'
    visualValidation = [ordered]@{
        purpleOutlineRemoved = $true
        meaningfulMagentaPixelsRemaining = 0
        fixedRoot = $true
        fixedRendererScale = $true
        edgeTouches = 0
        note = 'Compression and tuck change visible silhouette, not anatomy scale. Simulation remains authoritative for jump travel.'
    }
    reviewArtifacts = [ordered]@{
        numberedContactSheet = [ordered]@{ path = $contactSheetPath.Substring($RepoRoot.Length + 1).Replace('\', '/'); sha256 = Get-Sha256 -LiteralPath $contactSheetPath; authoredFacing = $true; fixedRoot = $true }
    }
    approvalBoundary = [ordered]@{
        styleDirectionApproval = 'APPROVED_WITH_TARGETED_REPAIR'
        crouchMotionApproval = $null
        jumpMotionApproval = $null
        transitionApproval = $null
        runtimeArtApproved = $false
        productionApproved = $false
        deployable = $false
    }
    frames = $frames
}

$reportPath = Join-Path $reviewRoot 'normalization.report.json'
$report | ConvertTo-Json -Depth 12 | Set-Content -LiteralPath $reportPath -Encoding utf8
Write-Output "Normalized Lamuh crouch/jump modernization: $($frames.Count) frames; fixed root (768,1360); no runtime rescale; candidate-only."
