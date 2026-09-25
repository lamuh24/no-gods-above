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

if (-not ('LamuhCrouchingMediumNormalizer' -as [type])) {
    Add-Type -TypeDefinition @'
using System;
using System.Drawing;
using System.Drawing.Imaging;
using System.IO;
using System.Runtime.InteropServices;

public sealed class LamuhCrouchingMediumMetrics
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

public static class LamuhCrouchingMediumNormalizer
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

    public static LamuhCrouchingMediumMetrics Normalize(
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

                return new LamuhCrouchingMediumMetrics {
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

$reviewRoot = Join-Path $RepoRoot 'tools\nga-forge\review\lamuh-legacy-v2-crouching-medium-v1'
$rawRoot = Join-Path $reviewRoot 'raw'
$normalizedRoot = Join-Path $reviewRoot 'normalized'
New-Item -ItemType Directory -Force -Path $normalizedRoot | Out-Null

$frames = @(
    [ordered]@{ index = 0; role = 'guarded_crouch_entry'; raw = 'crouching-medium-00-guarded-entry-v1.png'; rawRootX = 770; rawRootY = 960; sourceScaleCorrection = 1.00; bodyScaleCorrection = 0.70 },
    [ordered]@{ index = 1; role = 'lead_leg_sweep_load'; raw = 'crouching-medium-01-lead-leg-sweep-load-v1.png'; rawRootX = 620; rawRootY = 960; sourceScaleCorrection = 1.00; bodyScaleCorrection = 0.88 },
    [ordered]@{ index = 2; role = 'low_sweep_acceleration'; raw = 'crouching-medium-02-low-sweep-acceleration-v1.png'; rawRootX = 610; rawRootY = 940; sourceScaleCorrection = 1.00; bodyScaleCorrection = 0.81 },
    [ordered]@{ index = 3; role = 'single_low_sweep_contact'; raw = 'crouching-medium-03-low-sweep-contact-body-v1.png'; rawRootX = 610; rawRootY = 930; sourceScaleCorrection = 1.00; bodyScaleCorrection = 0.83 },
    [ordered]@{ index = 4; role = 'same_leg_sweep_follow_through'; raw = 'crouching-medium-04-same-leg-follow-through-v1.png'; rawRootX = 730; rawRootY = 930; sourceScaleCorrection = 1.00; bodyScaleCorrection = 0.70 },
    [ordered]@{ index = 5; role = 'lead_leg_retraction'; raw = 'crouching-medium-05-lead-leg-retraction-v1.png'; rawRootX = 620; rawRootY = 960; sourceScaleCorrection = 1.00; bodyScaleCorrection = 0.79 },
    [ordered]@{ index = 6; role = 'crouched_balance_recovery'; raw = 'crouching-medium-06-crouched-balance-recovery-v1.png'; rawRootX = 620; rawRootY = 958; sourceScaleCorrection = 1.00; bodyScaleCorrection = 0.81 },
    [ordered]@{ index = 7; role = 'connected_guarded_crouch_exit'; raw = 'crouching-medium-07-connected-guard-exit-v1.png'; rawRootX = 790; rawRootY = 950; sourceScaleCorrection = 1.00; bodyScaleCorrection = 0.81 }
)

$targetRoot = [ordered]@{ x = 768; y = 1360 }
$reportFrames = @()
foreach ($frame in $frames) {
    $sourcePath = Join-Path $rawRoot $frame.raw
    if (-not (Test-Path -LiteralPath $sourcePath)) { throw "Missing Crouching Medium raw candidate: $sourcePath" }
    $outputName = ('crouching-medium-{0:d2}.png' -f $frame.index)
    $outputPath = Join-Path $normalizedRoot $outputName
    $authoredScale = $frame.sourceScaleCorrection * $frame.bodyScaleCorrection
    $metrics = [LamuhCrouchingMediumNormalizer]::Normalize($sourcePath, $outputPath, $frame.rawRootX, $frame.rawRootY, $targetRoot.x, $targetRoot.y, 2048, 1536, $authoredScale)
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

$contactSource = Join-Path $rawRoot 'crouching-medium-03-low-sweep-contact-hit-v1.png'
$contactOutput = Join-Path $normalizedRoot 'crouching-medium-03-hit-composite.png'
$contactScale = $frames[3].sourceScaleCorrection * $frames[3].bodyScaleCorrection
$contactMetrics = [LamuhCrouchingMediumNormalizer]::Normalize($contactSource, $contactOutput, 710, 930, $targetRoot.x, $targetRoot.y, 2048, 1536, $contactScale)
$contactPresentation = [ordered]@{
    path = (Resolve-Path -LiteralPath $contactOutput).Path.Substring($RepoRoot.Length + 1).Replace('\', '/')
    sha256 = Get-Sha256 -LiteralPath $contactOutput
    sourcePath = (Resolve-Path -LiteralPath $contactSource).Path.Substring($RepoRoot.Length + 1).Replace('\', '/')
    sourceSha256 = Get-Sha256 -LiteralPath $contactSource
    visibleBounds = [ordered]@{ minX = $contactMetrics.MinX; minY = $contactMetrics.MinY; maxX = $contactMetrics.MaxX; maxY = $contactMetrics.MaxY }
    touchesEdge = $contactMetrics.TouchesEdge
    intendedOutcomes = @('hit', 'block')
    prohibitedOutcome = 'whiff'
    note = 'Outcome-routed compact white/gold/cyan contact accent; body-only frame remains authoritative on whiff.'
}

$contactSheetPath = Join-Path $reviewRoot 'crouching-medium-numbered-contact-sheet.png'
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
    $boardGraphics.DrawString('LAMUH LEGACY V2 - CROUCHING MEDIUM - NUMBERED FRAME SCRUB', $titleFont, [System.Drawing.Brushes]::Goldenrod, 26, 18)
    $boardGraphics.DrawString('Sweep Line - authored facing - fixed root - frame 03 only contact - candidate only', $noteFont, [System.Drawing.Brushes]::LightGray, 28, 53)
    foreach ($frame in $reportFrames) {
        $column = $frame.index % 4
        $row = [math]::Floor($frame.index / 4)
        $panelX = 18 + $column * 410
        $panelY = 88 + $row * 416
        $panelRectangle = New-Object System.Drawing.Rectangle $panelX, $panelY, 394, 394
        $boardGraphics.DrawRectangle($panelPen, $panelRectangle)
        if ($frame.index -eq 3) { $boardGraphics.DrawRectangle($goldPen, $panelRectangle) }
        $image = [System.Drawing.Image]::FromFile((Join-Path $normalizedRoot ('crouching-medium-{0:d2}.png' -f $frame.index)))
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
    subject = 'lamuh_legacy_v2.crouching_medium.sweep_line.candidate.v1'
    status = 'candidate-only'
    deployable = $false
    sourceFrameCount = 8
    authoredFrameCount = 8
    contactFrame = 3
    visibleImpactCount = 1
    contactPresentation = $contactPresentation
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
    sourceRepairReason = 'V1 Crouching Medium aliases all eight Standing Medium frames and has no true low attack artwork. V2 modernization authors a distinct one-hit low sweep while preserving the legacy medium rhythm, hip-led torque, planted base, fast post-load acceleration, coat and loc follow-through, and guarded recovery direction.'
    visualValidation = [ordered]@{
        purpleOutlineRemoved = $true
        meaningfulMagentaPixelsRemaining = 0
        contactBodyScaleInvariant = $true
        note = 'No renderer-driven per-frame scaling exists; the body-only contact frame and outcome-only contact composite share the same fixed normalized root and runtime scale.'
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
        crouchingLightMotionApproval = 'APPROVED_V1_MOTION_PRESERVED'
        crouchingLightTimingApproval = 'APPROVED_V2_RETIMING'
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
Write-Output "Normalized $($reportFrames.Count) Crouching Medium candidate frames."
Write-Output "Report: $reportPath"
