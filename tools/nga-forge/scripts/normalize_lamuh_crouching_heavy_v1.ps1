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

if (-not ('LamuhCrouchingHeavyNormalizer' -as [type])) {
    Add-Type -TypeDefinition @'
using System;
using System.Drawing;
using System.Drawing.Imaging;
using System.IO;
using System.Runtime.InteropServices;

public sealed class LamuhCrouchingHeavyMetrics
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

public static class LamuhCrouchingHeavyNormalizer
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

    public static LamuhCrouchingHeavyMetrics Normalize(
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

                return new LamuhCrouchingHeavyMetrics {
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

$reviewRoot = Join-Path $RepoRoot 'tools\nga-forge\review\lamuh-legacy-v2-crouching-heavy-v1'
$rawRoot = Join-Path $reviewRoot 'raw'
$normalizedRoot = Join-Path $reviewRoot 'normalized'
New-Item -ItemType Directory -Force -Path $normalizedRoot | Out-Null

$sequenceWideScale = 0.95

$frames = @(
    [ordered]@{ index = 0; role = 'low_guarded_coil'; raw = 'crouching-heavy-00-low-guard-v1.png'; rawRootX = 770; rawRootY = 893; sourceScaleCorrection = 1.00; bodyScaleCorrection = 0.83 },
    [ordered]@{ index = 1; role = 'lead_knee_drive'; raw = 'crouching-heavy-01-knee-drive-v1.png'; rawRootX = 310; rawRootY = 1438; sourceScaleCorrection = 0.55; bodyScaleCorrection = 1.25 },
    [ordered]@{ index = 2; role = 'rear_hand_rising_acceleration'; raw = 'crouching-heavy-02-rising-acceleration-v1.png'; rawRootX = 500; rawRootY = 1172; sourceScaleCorrection = 0.70; bodyScaleCorrection = 1.20 },
    [ordered]@{ index = 3; role = 'single_rising_contact'; raw = 'crouching-heavy-03-rising-contact-body-v1.png'; rawRootX = 520; rawRootY = 1190; sourceScaleCorrection = 0.70; bodyScaleCorrection = 1.36 },
    [ordered]@{ index = 4; role = 'same_arm_rising_follow_through'; raw = 'crouching-heavy-04-same-arm-follow-through-v1.png'; rawRootX = 515; rawRootY = 1175; sourceScaleCorrection = 0.70; bodyScaleCorrection = 1.30 },
    [ordered]@{ index = 5; role = 'authored_recovery_connector'; raw = 'crouching-heavy-05-recovery-connector-v1.png'; rawRootX = 315; rawRootY = 1362; sourceScaleCorrection = 0.68; bodyScaleCorrection = 1.20 },
    [ordered]@{ index = 6; role = 'connected_guarded_crouch_exit'; raw = 'crouching-heavy-06-guarded-exit-v1.png'; rawRootX = 770; rawRootY = 910; sourceScaleCorrection = 1.00; bodyScaleCorrection = 1.00 }
)

$targetRoot = [ordered]@{ x = 768; y = 1360 }
$reportFrames = @()
foreach ($frame in $frames) {
    $sourcePath = Join-Path $rawRoot $frame.raw
    if (-not (Test-Path -LiteralPath $sourcePath)) { throw "Missing Crouching Heavy raw candidate: $sourcePath" }
    $outputName = ('crouching-heavy-{0:d2}.png' -f $frame.index)
    $outputPath = Join-Path $normalizedRoot $outputName
    $authoredScale = $frame.sourceScaleCorrection * $frame.bodyScaleCorrection * $sequenceWideScale
    $metrics = [LamuhCrouchingHeavyNormalizer]::Normalize($sourcePath, $outputPath, $frame.rawRootX, $frame.rawRootY, $targetRoot.x, $targetRoot.y, 2048, 1536, $authoredScale)
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

$contactBody = Join-Path $normalizedRoot 'crouching-heavy-03.png'
$contactPresentation = [ordered]@{
    path = (Resolve-Path -LiteralPath $contactBody).Path.Substring($RepoRoot.Length + 1).Replace('\', '/')
    sha256 = Get-Sha256 -LiteralPath $contactBody
    bodyPath = (Resolve-Path -LiteralPath $contactBody).Path.Substring($RepoRoot.Length + 1).Replace('\', '/')
    bodySha256 = Get-Sha256 -LiteralPath $contactBody
    vfxEnabled = $false
    classification = 'DISABLE_FOR_NOW'
    disabledByHumanFeedback = $true
    bodyOnlyForAllOutcomes = $true
    socket = $null
    effectBounds = $null
    touchesEdge = $false
    intendedOutcomes = @()
    prohibitedOutcome = $null
    note = 'Human feedback disabled the Down Heavy contact VFX. The exact body-only frame is authoritative on hit, block, and whiff at one fixed renderer scale.'
}

$contactSheetPath = Join-Path $reviewRoot 'crouching-heavy-numbered-contact-sheet.png'
$board = New-Object System.Drawing.Bitmap 1660, 940
$boardGraphics = [System.Drawing.Graphics]::FromImage($board)
$titleFont = New-Object System.Drawing.Font('Segoe UI', 20, [System.Drawing.FontStyle]::Bold)
$labelFont = New-Object System.Drawing.Font('Segoe UI', 12, [System.Drawing.FontStyle]::Bold)
$noteFont = New-Object System.Drawing.Font('Segoe UI', 10, [System.Drawing.FontStyle]::Regular)
$goldPen = New-Object System.Drawing.Pen([System.Drawing.Color]::FromArgb(255, 214, 166, 56), 4)
$panelPen = New-Object System.Drawing.Pen([System.Drawing.Color]::FromArgb(110, 255, 255, 255), 1)
$rootPen = New-Object System.Drawing.Pen([System.Drawing.Color]::FromArgb(210, 255, 224, 138), 2)
try {
    $boardGraphics.Clear([System.Drawing.Color]::FromArgb(255, 6, 11, 17))
    $boardGraphics.DrawString('LAMUH LEGACY V2 - CROUCHING HEAVY - NUMBERED FRAME SCRUB', $titleFont, [System.Drawing.Brushes]::Goldenrod, 26, 18)
    $boardGraphics.DrawString('Crown Riser - fixed root - same rear hand - frame 03 only contact - candidate only', $noteFont, [System.Drawing.Brushes]::LightGray, 28, 53)
    foreach ($frame in $reportFrames) {
        $column = $frame.index % 4
        $row = [math]::Floor($frame.index / 4)
        $panelX = 18 + $column * 410
        $panelY = 88 + $row * 416
        $panelRectangle = New-Object System.Drawing.Rectangle $panelX, $panelY, 394, 394
        $boardGraphics.DrawRectangle($panelPen, $panelRectangle)
        if ($frame.index -eq 3) { $boardGraphics.DrawRectangle($goldPen, $panelRectangle) }
        $image = [System.Drawing.Image]::FromFile((Join-Path $normalizedRoot ('crouching-heavy-{0:d2}.png' -f $frame.index)))
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

$neighborScaleDeltas = @()
foreach ($neighborIndex in @(2, 4)) {
    $contactHeight = $reportFrames[3].visibleBounds.maxY - $reportFrames[3].visibleBounds.minY + 1
    $neighborHeight = $reportFrames[$neighborIndex].visibleBounds.maxY - $reportFrames[$neighborIndex].visibleBounds.minY + 1
    $neighborScaleDeltas += [math]::Round(([math]::Abs($contactHeight - $neighborHeight) / [math]::Max(1, $neighborHeight)) * 100, 2)
}
$maxContactNeighborSilhouetteHeightDeltaPct = ($neighborScaleDeltas | Measure-Object -Maximum).Maximum
if ($maxContactNeighborSilhouetteHeightDeltaPct -gt 16) { throw "Crouching Heavy contact silhouette-height transition exceeds 16%: $maxContactNeighborSilhouetteHeightDeltaPct%" }
if (($reportFrames.normalizedSha256 | Select-Object -Unique).Count -ne 7) { throw 'Crouching Heavy authored frames must be visually unique; V1 duplicate holds belong in exposure metadata.' }
if ($reportFrames.touchesEdge -contains $true) { throw 'Crouching Heavy normalized frame touches the canvas edge.' }

$report = [ordered]@{
    schemaVersion = '1.0.0'
    subject = 'lamuh_legacy_v2.crouching_heavy.crown_riser.candidate.v1'
    status = 'candidate-only'
    deployable = $false
    sourceFrameCount = 7
    authoredFrameCount = 7
    contactFrame = 3
    visibleImpactCount = 1
    contactPresentation = $contactPresentation
    normalization = [ordered]@{
        canvas = [ordered]@{ width = 2048; height = 1536 }
        sequenceWideScale = $sequenceWideScale
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
    sourceRepairReason = 'V1 Crouching Heavy provides a reusable seven-cell launcher arc but cells 04 and 05 are byte-identical and all legacy art carries the obsolete magenta outline. V2 preserves the low coil, lead-knee drive, same rear-hand rise, held follow-through and guarded recovery direction, replaces only the duplicate drawing with one connected recovery pose, and carries the hold through authored exposure metadata.'
    visualValidation = [ordered]@{
        purpleOutlineRemoved = $true
        meaningfulMagentaPixelsRemaining = 0
        userRequestedDownHeavyScaleCorrection = $sequenceWideScale
        sequenceWideCorrectionOnly = $true
        contactBodyScaleInvariant = $true
        maxContactNeighborSilhouetteHeightDeltaPct = $maxContactNeighborSilhouetteHeightDeltaPct
        contactSilhouetteHeightRegressionThresholdPct = 16
        note = 'Human playtest feedback identified Down Heavy as slightly large. The entire sequence and its contact accent are reduced to 95% around the fixed authored root; no renderer-driven or per-frame scaling exists.'
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
        crouchingMediumMotionApproval = 'APPROVED_V1_MOTION_PRESERVED'
        crouchingMediumTimingApproval = 'APPROVED_V2_RETIMING'
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
Write-Output "Normalized $($reportFrames.Count) Crouching Heavy Crown Riser candidate frames."
Write-Output "Report: $reportPath"
