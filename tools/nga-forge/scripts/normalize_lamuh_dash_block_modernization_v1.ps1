param(
    [string]$RepoRoot = (Resolve-Path (Join-Path $PSScriptRoot '..\..\..')).Path,
    [switch]$LibraryOnly
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

function Get-Median {
    param([double[]]$Values)
    $ordered = @($Values | Sort-Object)
    if ($ordered.Count -eq 0) { throw 'Cannot calculate a median from an empty set.' }
    $middle = [math]::Floor($ordered.Count / 2)
    if ($ordered.Count % 2 -eq 1) { return [double]$ordered[$middle] }
    return ([double]$ordered[$middle - 1] + [double]$ordered[$middle]) / 2.0
}

if (-not ('LamuhDashBlockFrameTools' -as [type])) {
    Add-Type -TypeDefinition @'
using System;
using System.Drawing;
using System.Drawing.Drawing2D;
using System.Drawing.Imaging;
using System.IO;
using System.Runtime.InteropServices;

public sealed class LamuhDashBlockBounds
{
    public int MinX { get; set; }
    public int MinY { get; set; }
    public int MaxX { get; set; }
    public int MaxY { get; set; }
    public int Width { get { return MaxX < MinX ? 0 : MaxX - MinX + 1; } }
    public int Height { get { return MaxY < MinY ? 0 : MaxY - MinY + 1; } }
}

public sealed class LamuhDashBlockMetrics
{
    public int MinX { get; set; }
    public int MinY { get; set; }
    public int MaxX { get; set; }
    public int MaxY { get; set; }
    public double CentroidX { get; set; }
    public double CentroidY { get; set; }
    public long VisiblePixels { get; set; }
    public long BackgroundPixelsRemoved { get; set; }
    public long MagentaPixelsNeutralized { get; set; }
    public long RedArtifactPixelsRemoved { get; set; }
    public long DistantComponentPixelsRemoved { get; set; }
    public long MeaningfulMagentaPixelsRemaining { get; set; }
    public long RedArtifactPixelsRemaining { get; set; }
    public bool TouchesEdge { get; set; }
}

public static class LamuhDashBlockFrameTools
{
    private sealed class Component
    {
        public int Area;
        public int MinX = int.MaxValue;
        public int MinY = int.MaxValue;
        public int MaxX = -1;
        public int MaxY = -1;
    }

    private static bool IsNeutralBackdrop(byte red, byte green, byte blue)
    {
        int min = Math.Min(red, Math.Min(green, blue));
        int max = Math.Max(red, Math.Max(green, blue));
        bool neutralCheckerboard = min >= 176 && max - min <= 42;
        bool chromaGreen = green >= 150 && green >= red * 1.35 && green >= blue * 1.35;
        return neutralCheckerboard || chromaGreen;
    }

    private static bool IsMeaningfulMagenta(byte red, byte green, byte blue)
    {
        return red > 45 && blue > 45 && red > green * 1.18 && blue > green * 1.18;
    }

    private static bool IsMagentaCleanupCandidate(byte red, byte green, byte blue)
    {
        return red > 38 && blue > 38 && red > green * 1.10 && blue > green * 1.10;
    }

    private static bool IsGreenSpill(byte red, byte green, byte blue)
    {
        return green > 28 && green > red * 1.28 && green > blue * 1.18 && green - red > 18;
    }

    private static bool IsRedArtifact(byte red, byte green, byte blue)
    {
        return red >= 214 && green <= 92 && blue <= 82 && red - green >= 126 && red - blue >= 126;
    }

    private static bool IsRedCleanupCandidate(byte red, byte green, byte blue)
    {
        return red >= 208 && green <= 98 && blue <= 88 && red - green >= 118 && red - blue >= 118;
    }

    private static long RemoveDistantComponents(byte[] bytes, int stride, int width, int height)
    {
        int[] labels = new int[width * height];
        Component[] components = new Component[width * height + 1];
        components[0] = new Component();
        int componentCount = 0;
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
                for (int ny = Math.Max(0, y - 1); ny <= Math.Min(height - 1, y + 1); ny++)
                for (int nx = Math.Max(0, x - 1); nx <= Math.Min(width - 1, x + 1); nx++)
                {
                    if (nx == x && ny == y) continue;
                    int neighbor = ny * width + nx;
                    if (labels[neighbor] != 0 || bytes[ny * stride + nx * 4 + 3] <= 12) continue;
                    labels[neighbor] = nextLabel;
                    queue[tail++] = neighbor;
                }
            }
            components[nextLabel] = component;
            componentCount = nextLabel;
            nextLabel++;
        }
        if (componentCount <= 1) return 0;
        int largestLabel = 1;
        for (int label = 2; label <= componentCount; label++) if (components[label].Area > components[largestLabel].Area) largestLabel = label;
        long removed = 0;
        for (int label = 1; label <= componentCount; label++)
        {
            if (label == largestLabel) continue;
            Component component = components[label];
            bool keep = false;
            if (keep) continue;
            for (int y = component.MinY; y <= component.MaxY; y++) for (int x = component.MinX; x <= component.MaxX; x++)
            {
                int linear = y * width + x;
                if (labels[linear] != label) continue;
                int offset = y * stride + x * 4;
                bytes[offset] = 0; bytes[offset + 1] = 0; bytes[offset + 2] = 0; bytes[offset + 3] = 0;
                removed++;
            }
        }
        return removed;
    }

    private static long RemoveTinyComponents(byte[] bytes, int stride, int width, int height, int maximumArea)
    {
        int[] labels = new int[width * height];
        Component[] components = new Component[width * height + 1];
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
                for (int ny = Math.Max(0, y - 1); ny <= Math.Min(height - 1, y + 1); ny++)
                for (int nx = Math.Max(0, x - 1); nx <= Math.Min(width - 1, x + 1); nx++)
                {
                    if (nx == x && ny == y) continue;
                    int neighbor = ny * width + nx;
                    if (labels[neighbor] != 0 || bytes[ny * stride + nx * 4 + 3] <= 12) continue;
                    labels[neighbor] = nextLabel;
                    queue[tail++] = neighbor;
                }
            }
            components[nextLabel] = component;
            nextLabel++;
        }

        long removed = 0;
        for (int label = 1; label < nextLabel; label++)
        {
            Component component = components[label];
            if (component.Area > maximumArea) continue;
            for (int y = component.MinY; y <= component.MaxY; y++) for (int x = component.MinX; x <= component.MaxX; x++)
            {
                int linear = y * width + x;
                if (labels[linear] != label) continue;
                int offset = y * stride + x * 4;
                bytes[offset] = 0; bytes[offset + 1] = 0; bytes[offset + 2] = 0; bytes[offset + 3] = 0;
                removed++;
            }
        }
        return removed;
    }

    private static long RemoveForeignBoundaryFragments(byte[] bytes, int stride, int width, int height)
    {
        int[] labels = new int[width * height];
        Component[] components = new Component[width * height + 1];
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
                for (int ny = Math.Max(0, y - 1); ny <= Math.Min(height - 1, y + 1); ny++)
                for (int nx = Math.Max(0, x - 1); nx <= Math.Min(width - 1, x + 1); nx++)
                {
                    if (nx == x && ny == y) continue;
                    int neighbor = ny * width + nx;
                    if (labels[neighbor] != 0 || bytes[ny * stride + nx * 4 + 3] <= 12) continue;
                    labels[neighbor] = nextLabel;
                    queue[tail++] = neighbor;
                }
            }
            components[nextLabel] = component;
            nextLabel++;
        }
        if (nextLabel <= 2) return 0;
        int largestLabel = 1;
        for (int label = 2; label < nextLabel; label++) if (components[label].Area > components[largestLabel].Area) largestLabel = label;
        Component anchor = components[largestLabel];
        long removed = 0;
        for (int label = 1; label < nextLabel; label++)
        {
            if (label == largestLabel) continue;
            Component component = components[label];
            bool touchesBoundary = component.MinX <= 1 || component.MaxX >= width - 2 || component.MinY <= 1 || component.MaxY >= height - 2;
            int dx = component.MaxX < anchor.MinX ? anchor.MinX - component.MaxX : anchor.MaxX < component.MinX ? component.MinX - anchor.MaxX : 0;
            int dy = component.MaxY < anchor.MinY ? anchor.MinY - component.MaxY : anchor.MaxY < component.MinY ? component.MinY - anchor.MaxY : 0;
            if (!touchesBoundary || Math.Max(dx, dy) <= 12) continue;
            for (int y = component.MinY; y <= component.MaxY; y++) for (int x = component.MinX; x <= component.MaxX; x++)
            {
                int linear = y * width + x;
                if (labels[linear] != label) continue;
                int offset = y * stride + x * 4;
                bytes[offset] = 0; bytes[offset + 1] = 0; bytes[offset + 2] = 0; bytes[offset + 3] = 0;
                removed++;
            }
        }
        return removed;
    }

    private static byte ClampByte(double value)
    {
        return (byte)Math.Max(0, Math.Min(255, Math.Round(value)));
    }

    public static LamuhDashBlockMetrics ExtractGridCellChroma(string sheetPath, string outputPath, int row, int column, int rowCount, int columnCount)
    {
        using (var loaded = new Bitmap(sheetPath))
        using (var sheet = new Bitmap(loaded.Width, loaded.Height, PixelFormat.Format32bppArgb))
        {
            using (var graphics = Graphics.FromImage(sheet))
            {
                graphics.CompositingMode = CompositingMode.SourceCopy;
                graphics.DrawImage(loaded, 0, 0, loaded.Width, loaded.Height);
            }
            int startX = (int)Math.Round((double)column * sheet.Width / columnCount);
            int endX = (int)Math.Round((double)(column + 1) * sheet.Width / columnCount);
            int startY = (int)Math.Round((double)row * sheet.Height / rowCount);
            int endY = (int)Math.Round((double)(row + 1) * sheet.Height / rowCount);
            int width = Math.Max(1, endX - startX), height = Math.Max(1, endY - startY);
            var sheetRectangle = new Rectangle(0, 0, sheet.Width, sheet.Height);
            var sheetData = sheet.LockBits(sheetRectangle, ImageLockMode.ReadOnly, PixelFormat.Format32bppArgb);
            byte[] sheetBytes = new byte[sheetData.Stride * sheet.Height];
            Marshal.Copy(sheetData.Scan0, sheetBytes, 0, sheetBytes.Length);
            sheet.UnlockBits(sheetData);

            double bgRed = 0, bgGreen = 0, bgBlue = 0;
            int bgSamples = 0;
            int sampleSize = Math.Max(2, Math.Min(10, Math.Min(width, height) / 12));
            for (int y = 0; y < sampleSize; y++) for (int x = 0; x < sampleSize; x++)
            {
                int[] sampleXs = { startX + x, endX - 1 - x };
                int[] sampleYs = { startY + y, endY - 1 - y };
                foreach (int sampleY in sampleYs) foreach (int sampleX in sampleXs)
                {
                    int offset = sampleY * sheetData.Stride + sampleX * 4;
                    bgBlue += sheetBytes[offset]; bgGreen += sheetBytes[offset + 1]; bgRed += sheetBytes[offset + 2]; bgSamples++;
                }
            }
            bgRed /= bgSamples; bgGreen /= bgSamples; bgBlue /= bgSamples;
            double backgroundExcess = Math.Max(32.0, bgGreen - Math.Max(bgRed, bgBlue));

            using (var output = new Bitmap(width, height, PixelFormat.Format32bppArgb))
            {
                var outputRectangle = new Rectangle(0, 0, width, height);
                var outputData = output.LockBits(outputRectangle, ImageLockMode.WriteOnly, PixelFormat.Format32bppArgb);
                byte[] outputBytes = new byte[outputData.Stride * height];
                long backgroundRemoved = 0, magenta = 0, redArtifacts = 0;
                for (int y = 0; y < height; y++) for (int x = 0; x < width; x++)
                {
                    int sourceOffset = (startY + y) * sheetData.Stride + (startX + x) * 4;
                    int outputOffset = y * outputData.Stride + x * 4;
                    byte blue = sheetBytes[sourceOffset], green = sheetBytes[sourceOffset + 1], red = sheetBytes[sourceOffset + 2], sourceAlpha = sheetBytes[sourceOffset + 3];
                    if (sourceAlpha <= 12) { backgroundRemoved++; continue; }

                    double greenExcess = green - Math.Max(red, blue);
                    double foregroundAlpha = greenExcess <= 0 ? 1.0 : Math.Max(0.0, Math.Min(1.0, 1.0 - greenExcess / backgroundExcess));
                    if (foregroundAlpha <= 0.08) { backgroundRemoved++; continue; }

                    double inverse = 1.0 / foregroundAlpha;
                    red = ClampByte((red - bgRed * (1.0 - foregroundAlpha)) * inverse);
                    green = ClampByte((green - bgGreen * (1.0 - foregroundAlpha)) * inverse);
                    blue = ClampByte((blue - bgBlue * (1.0 - foregroundAlpha)) * inverse);
                    byte alpha = ClampByte(sourceAlpha * foregroundAlpha);
                    if (IsRedCleanupCandidate(red, green, blue)) { redArtifacts++; continue; }
                    if (IsMagentaCleanupCandidate(red, green, blue))
                    {
                        byte ink = (byte)Math.Min(34, Math.Round(red * .08 + green * .18 + blue * .05));
                        red = ink; green = ink; blue = ink; magenta++;
                    }
                    outputBytes[outputOffset] = blue; outputBytes[outputOffset + 1] = green; outputBytes[outputOffset + 2] = red; outputBytes[outputOffset + 3] = alpha;
                }
                long tinyComponentsRemoved = RemoveTinyComponents(outputBytes, outputData.Stride, width, height, 12);
                long boundaryFragmentsRemoved = RemoveForeignBoundaryFragments(outputBytes, outputData.Stride, width, height);
                Marshal.Copy(outputBytes, 0, outputData.Scan0, outputBytes.Length);
                output.UnlockBits(outputData);
                Directory.CreateDirectory(Path.GetDirectoryName(outputPath));
                output.Save(outputPath, ImageFormat.Png);
                LamuhDashBlockMetrics metrics = Measure(outputPath);
                metrics.BackgroundPixelsRemoved = backgroundRemoved;
                metrics.MagentaPixelsNeutralized = magenta;
                metrics.RedArtifactPixelsRemoved = redArtifacts;
                metrics.DistantComponentPixelsRemoved = tinyComponentsRemoved + boundaryFragmentsRemoved;
                return metrics;
            }
        }
    }

    private static long FinalizeSavedColors(string inputPath)
    {
        string temporaryPath = inputPath + ".color-clean.png";
        long repaired = 0;
        using (var loaded = new Bitmap(inputPath))
        using (var bitmap = new Bitmap(loaded.Width, loaded.Height, PixelFormat.Format32bppArgb))
        {
            using (var graphics = Graphics.FromImage(bitmap)) { graphics.CompositingMode = CompositingMode.SourceCopy; graphics.DrawImage(loaded, 0, 0, loaded.Width, loaded.Height); }
            var rectangle = new Rectangle(0, 0, bitmap.Width, bitmap.Height);
            var data = bitmap.LockBits(rectangle, ImageLockMode.ReadWrite, PixelFormat.Format32bppArgb);
            byte[] bytes = new byte[data.Stride * bitmap.Height]; Marshal.Copy(data.Scan0, bytes, 0, bytes.Length);
            for (int y = 0; y < bitmap.Height; y++) for (int x = 0; x < bitmap.Width; x++)
            {
                int offset = y * data.Stride + x * 4;
                byte alpha = bytes[offset + 3];
                if (alpha <= 12) { bytes[offset] = 0; bytes[offset + 1] = 0; bytes[offset + 2] = 0; bytes[offset + 3] = 0; continue; }
                byte blue = bytes[offset], green = bytes[offset + 1], red = bytes[offset + 2];
                if (IsRedArtifact(red, green, blue)) { bytes[offset] = 0; bytes[offset + 1] = 0; bytes[offset + 2] = 0; bytes[offset + 3] = 0; repaired++; continue; }
                if (IsMeaningfulMagenta(red, green, blue)) { bytes[offset] = 24; bytes[offset + 1] = 24; bytes[offset + 2] = 24; repaired++; }
            }
            Marshal.Copy(bytes, 0, data.Scan0, bytes.Length); bitmap.UnlockBits(data); bitmap.Save(temporaryPath, ImageFormat.Png);
        }
        File.Delete(inputPath); File.Move(temporaryPath, inputPath);
        return repaired;
    }

    public static LamuhDashBlockMetrics ExtractCell(string sheetPath, string outputPath, int cellIndex, int cellCount)
    {
        using (var loaded = new Bitmap(sheetPath))
        using (var sheet = new Bitmap(loaded.Width, loaded.Height, PixelFormat.Format32bppArgb))
        {
            using (var graphics = Graphics.FromImage(sheet))
            {
                graphics.CompositingMode = CompositingMode.SourceCopy;
                graphics.DrawImage(loaded, 0, 0, loaded.Width, loaded.Height);
            }
            int startX = (int)Math.Round((double)cellIndex * sheet.Width / cellCount);
            int endX = (int)Math.Round((double)(cellIndex + 1) * sheet.Width / cellCount);
            int width = Math.Max(1, endX - startX), height = sheet.Height;
            var sheetRectangle = new Rectangle(0, 0, sheet.Width, sheet.Height);
            var sheetData = sheet.LockBits(sheetRectangle, ImageLockMode.ReadOnly, PixelFormat.Format32bppArgb);
            byte[] sheetBytes = new byte[sheetData.Stride * sheet.Height];
            Marshal.Copy(sheetData.Scan0, sheetBytes, 0, sheetBytes.Length);
            sheet.UnlockBits(sheetData);

            using (var output = new Bitmap(width, height, PixelFormat.Format32bppArgb))
            {
                var outputRectangle = new Rectangle(0, 0, width, height);
                var outputData = output.LockBits(outputRectangle, ImageLockMode.WriteOnly, PixelFormat.Format32bppArgb);
                byte[] outputBytes = new byte[outputData.Stride * height];
                bool[] background = new bool[width * height];
                int[] queue = new int[width * height];
                int head = 0, tail = 0;
                Action<int, int> enqueue = (x, y) => {
                    int linear = y * width + x;
                    if (background[linear]) return;
                    int sourceOffset = y * sheetData.Stride + (startX + x) * 4;
                    byte blue = sheetBytes[sourceOffset], green = sheetBytes[sourceOffset + 1], red = sheetBytes[sourceOffset + 2], alpha = sheetBytes[sourceOffset + 3];
                    if (alpha <= 12 || IsNeutralBackdrop(red, green, blue)) { background[linear] = true; queue[tail++] = linear; }
                };
                for (int x = 0; x < width; x++) { enqueue(x, 0); enqueue(x, height - 1); }
                for (int y = 1; y < height - 1; y++) { enqueue(0, y); enqueue(width - 1, y); }
                while (head < tail)
                {
                    int linear = queue[head++], x = linear % width, y = linear / width;
                    if (x > 0) enqueue(x - 1, y); if (x + 1 < width) enqueue(x + 1, y);
                    if (y > 0) enqueue(x, y - 1); if (y + 1 < height) enqueue(x, y + 1);
                }

                long backgroundRemoved = 0, magenta = 0, redArtifacts = 0;
                for (int y = 0; y < height; y++) for (int x = 0; x < width; x++)
                {
                    int linear = y * width + x;
                    int sourceOffset = y * sheetData.Stride + (startX + x) * 4;
                    int outputOffset = y * outputData.Stride + x * 4;
                    byte blue = sheetBytes[sourceOffset], green = sheetBytes[sourceOffset + 1], red = sheetBytes[sourceOffset + 2], alpha = sheetBytes[sourceOffset + 3];
                    if (background[linear] || alpha <= 12) { backgroundRemoved++; continue; }
                    if (IsRedCleanupCandidate(red, green, blue)) { redArtifacts++; continue; }
                    if (IsGreenSpill(red, green, blue))
                    {
                        byte ink = (byte)Math.Min(38, Math.Round(red * .28 + green * .14 + blue * .20));
                        red = ink; green = ink; blue = ink;
                    }
                    if (IsMagentaCleanupCandidate(red, green, blue))
                    {
                        byte ink = (byte)Math.Min(34, Math.Round(red * .08 + green * .18 + blue * .05));
                        red = ink; green = ink; blue = ink; magenta++;
                    }
                    outputBytes[outputOffset] = blue; outputBytes[outputOffset + 1] = green; outputBytes[outputOffset + 2] = red; outputBytes[outputOffset + 3] = alpha;
                }
                long componentsRemoved = RemoveDistantComponents(outputBytes, outputData.Stride, width, height);
                Marshal.Copy(outputBytes, 0, outputData.Scan0, outputBytes.Length);
                output.UnlockBits(outputData);
                Directory.CreateDirectory(Path.GetDirectoryName(outputPath));
                output.Save(outputPath, ImageFormat.Png);
                LamuhDashBlockMetrics metrics = Measure(outputPath);
                metrics.BackgroundPixelsRemoved = backgroundRemoved;
                metrics.MagentaPixelsNeutralized = magenta;
                metrics.RedArtifactPixelsRemoved = redArtifacts;
                metrics.DistantComponentPixelsRemoved = componentsRemoved;
                return metrics;
            }
        }
    }

    public static LamuhDashBlockBounds AlphaBounds(string inputPath)
    {
        LamuhDashBlockMetrics metrics = Measure(inputPath);
        return new LamuhDashBlockBounds { MinX = metrics.MinX, MinY = metrics.MinY, MaxX = metrics.MaxX, MaxY = metrics.MaxY };
    }

    public static LamuhDashBlockMetrics NormalizeFrame(string inputPath, string outputPath, double sourceRootX, double sourceRootY, int targetRootX, int targetRootY, int outputWidth, int outputHeight, double scale, bool removeGroundDust)
    {
        long magenta = 0, redArtifacts = 0, componentsRemoved = 0;
        using (var source = new Bitmap(inputPath))
        using (var output = new Bitmap(outputWidth, outputHeight, PixelFormat.Format32bppArgb))
        {
            using (var graphics = Graphics.FromImage(output))
            {
                graphics.Clear(Color.Transparent);
                graphics.CompositingMode = CompositingMode.SourceCopy;
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
            for (int y = 0; y < output.Height; y++) for (int x = 0; x < output.Width; x++)
            {
                int offset = y * data.Stride + x * 4;
                byte alpha = bytes[offset + 3];
                if (alpha <= 12) { bytes[offset] = 0; bytes[offset + 1] = 0; bytes[offset + 2] = 0; bytes[offset + 3] = 0; continue; }
                byte blue = bytes[offset], green = bytes[offset + 1], red = bytes[offset + 2];
                int minimum = Math.Min(red, Math.Min(green, blue)), maximum = Math.Max(red, Math.Max(green, blue));
                if (removeGroundDust && y >= targetRootY - 72 && maximum >= 64 && maximum - minimum <= 38) { bytes[offset] = 0; bytes[offset + 1] = 0; bytes[offset + 2] = 0; bytes[offset + 3] = 0; continue; }
                if (IsRedCleanupCandidate(red, green, blue)) { bytes[offset] = 0; bytes[offset + 1] = 0; bytes[offset + 2] = 0; bytes[offset + 3] = 0; redArtifacts++; continue; }
                if (IsGreenSpill(red, green, blue))
                {
                    byte ink = (byte)Math.Min(38, Math.Round(red * .28 + green * .14 + blue * .20));
                    bytes[offset] = ink; bytes[offset + 1] = ink; bytes[offset + 2] = ink;
                    red = ink; green = ink; blue = ink;
                }
                if (IsMagentaCleanupCandidate(red, green, blue))
                {
                    byte ink = (byte)Math.Min(34, Math.Round(red * .08 + green * .18 + blue * .05));
                    bytes[offset] = ink; bytes[offset + 1] = ink; bytes[offset + 2] = ink; magenta++;
                }
            }
            componentsRemoved = RemoveDistantComponents(bytes, data.Stride, output.Width, output.Height);
            Marshal.Copy(bytes, 0, data.Scan0, bytes.Length);
            output.UnlockBits(data);
            Directory.CreateDirectory(Path.GetDirectoryName(outputPath));
            output.Save(outputPath, ImageFormat.Png);
        }
        LamuhDashBlockMetrics metrics = Measure(outputPath);
        metrics.MagentaPixelsNeutralized = magenta;
        metrics.RedArtifactPixelsRemoved = redArtifacts;
        metrics.DistantComponentPixelsRemoved = componentsRemoved;
        return metrics;
    }

    public static LamuhDashBlockMetrics NormalizeFramePreserveDetails(string inputPath, string outputPath, double sourceRootX, double sourceRootY, int targetRootX, int targetRootY, int outputWidth, int outputHeight, double scale, bool removeGroundDust)
    {
        long magenta = 0, redArtifacts = 0, tinyComponentsRemoved = 0;
        using (var source = new Bitmap(inputPath))
        using (var output = new Bitmap(outputWidth, outputHeight, PixelFormat.Format32bppArgb))
        {
            using (var graphics = Graphics.FromImage(output))
            {
                graphics.Clear(Color.Transparent);
                graphics.CompositingMode = CompositingMode.SourceCopy;
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
            for (int y = 0; y < output.Height; y++) for (int x = 0; x < output.Width; x++)
            {
                int offset = y * data.Stride + x * 4;
                byte alpha = bytes[offset + 3];
                if (alpha <= 12) { bytes[offset] = 0; bytes[offset + 1] = 0; bytes[offset + 2] = 0; bytes[offset + 3] = 0; continue; }
                byte blue = bytes[offset], green = bytes[offset + 1], red = bytes[offset + 2];
                int minimum = Math.Min(red, Math.Min(green, blue)), maximum = Math.Max(red, Math.Max(green, blue));
                if (removeGroundDust && y >= targetRootY - 72 && maximum >= 64 && maximum - minimum <= 38) { bytes[offset] = 0; bytes[offset + 1] = 0; bytes[offset + 2] = 0; bytes[offset + 3] = 0; continue; }
                if (IsRedCleanupCandidate(red, green, blue)) { bytes[offset] = 0; bytes[offset + 1] = 0; bytes[offset + 2] = 0; bytes[offset + 3] = 0; redArtifacts++; continue; }
                if (IsMagentaCleanupCandidate(red, green, blue))
                {
                    byte ink = (byte)Math.Min(34, Math.Round(red * .08 + green * .18 + blue * .05));
                    bytes[offset] = ink; bytes[offset + 1] = ink; bytes[offset + 2] = ink; magenta++;
                }
            }
            tinyComponentsRemoved = RemoveTinyComponents(bytes, data.Stride, output.Width, output.Height, 12);
            Marshal.Copy(bytes, 0, data.Scan0, bytes.Length);
            output.UnlockBits(data);
            Directory.CreateDirectory(Path.GetDirectoryName(outputPath));
            output.Save(outputPath, ImageFormat.Png);
        }
        LamuhDashBlockMetrics metrics = Measure(outputPath);
        metrics.MagentaPixelsNeutralized = magenta;
        metrics.RedArtifactPixelsRemoved = redArtifacts;
        metrics.DistantComponentPixelsRemoved = tinyComponentsRemoved;
        return metrics;
    }

    public static LamuhDashBlockMetrics Measure(string inputPath)
    {
        using (var loaded = new Bitmap(inputPath))
        using (var bitmap = new Bitmap(loaded.Width, loaded.Height, PixelFormat.Format32bppArgb))
        {
            using (var graphics = Graphics.FromImage(bitmap)) { graphics.CompositingMode = CompositingMode.SourceCopy; graphics.DrawImage(loaded, 0, 0, loaded.Width, loaded.Height); }
            var rectangle = new Rectangle(0, 0, bitmap.Width, bitmap.Height);
            var data = bitmap.LockBits(rectangle, ImageLockMode.ReadOnly, PixelFormat.Format32bppArgb);
            byte[] bytes = new byte[data.Stride * bitmap.Height]; Marshal.Copy(data.Scan0, bytes, 0, bytes.Length); bitmap.UnlockBits(data);
            int minX = bitmap.Width, minY = bitmap.Height, maxX = -1, maxY = -1;
            long visible = 0, remainingMagenta = 0, remainingRed = 0; double weightedX = 0, weightedY = 0;
            for (int y = 0; y < bitmap.Height; y++) for (int x = 0; x < bitmap.Width; x++)
            {
                int offset = y * data.Stride + x * 4; if (bytes[offset + 3] <= 12) continue;
                byte blue = bytes[offset], green = bytes[offset + 1], red = bytes[offset + 2];
                if (IsMeaningfulMagenta(red, green, blue)) remainingMagenta++;
                if (IsRedArtifact(red, green, blue)) remainingRed++;
                minX = Math.Min(minX, x); minY = Math.Min(minY, y); maxX = Math.Max(maxX, x); maxY = Math.Max(maxY, y);
                visible++; weightedX += x; weightedY += y;
            }
            return new LamuhDashBlockMetrics {
                MinX = minX, MinY = minY, MaxX = maxX, MaxY = maxY,
                CentroidX = visible == 0 ? 0 : weightedX / visible, CentroidY = visible == 0 ? 0 : weightedY / visible,
                VisiblePixels = visible, MeaningfulMagentaPixelsRemaining = remainingMagenta, RedArtifactPixelsRemaining = remainingRed,
                TouchesEdge = minX <= 0 || minY <= 0 || maxX >= bitmap.Width - 1 || maxY >= bitmap.Height - 1
            };
        }
    }

    public static void MakeContactSheet(string[] paths, string[] labels, string outputPath, int columns)
    {
        int cellWidth = 470, cellHeight = 365, rows = (int)Math.Ceiling((double)paths.Length / columns);
        using (var sheet = new Bitmap(columns * cellWidth, rows * cellHeight, PixelFormat.Format32bppArgb))
        using (var graphics = Graphics.FromImage(sheet))
        using (var labelFont = new Font("Segoe UI", 10, FontStyle.Bold))
        using (var noteFont = new Font("Segoe UI", 8, FontStyle.Regular))
        {
            graphics.Clear(Color.FromArgb(8, 13, 19)); graphics.InterpolationMode = InterpolationMode.HighQualityBicubic;
            for (int index = 0; index < paths.Length; index++)
            {
                int column = index % columns, row = index / columns, left = column * cellWidth, top = row * cellHeight;
                using (var image = new Bitmap(paths[index]))
                {
                    const double fixedScale = .205;
                    int screenRootX = left + cellWidth / 2, screenRootY = top + 338;
                    int drawX = screenRootX - (int)Math.Round(768 * fixedScale), drawY = screenRootY - (int)Math.Round(1360 * fixedScale);
                    int drawWidth = (int)Math.Round(image.Width * fixedScale), drawHeight = (int)Math.Round(image.Height * fixedScale);
                    graphics.DrawImage(image, new Rectangle(drawX, drawY, drawWidth, drawHeight), new Rectangle(0, 0, image.Width, image.Height), GraphicsUnit.Pixel);
                }
                graphics.DrawRectangle(Pens.DimGray, left + 1, top + 1, cellWidth - 3, cellHeight - 3);
                graphics.DrawString(labels[index], labelFont, Brushes.White, left + 7, top + 7);
                graphics.DrawString("fixed root (768,1360)", noteFont, Brushes.Goldenrod, left + 7, top + cellHeight - 17);
            }
            Directory.CreateDirectory(Path.GetDirectoryName(outputPath)); sheet.Save(outputPath, ImageFormat.Png);
        }
    }
}
'@ -ReferencedAssemblies @('System.Drawing.dll', 'System.dll', 'System.Core.dll')
}

if ($LibraryOnly) { return }

$reviewRoot = Join-Path $RepoRoot 'tools\nga-forge\review\lamuh-legacy-v2-dash-block-modernization-v1'
$rawRoot = Join-Path $reviewRoot 'raw'
$sourceFrameRoot = Join-Path $reviewRoot 'source-frames'
$normalizedRoot = Join-Path $reviewRoot 'normalized'
$legacyRoot = Join-Path $RepoRoot 'NO_GODS_ABOVE\engine_v2\content-source\characters\lamuh-legacy-v2\source-frames'
$idleReference = Join-Path $RepoRoot 'NO_GODS_ABOVE\engine_v2\public\lamuh-legacy-v2\movement-v2\idle-00.png'
$targetRoot = [ordered]@{ x = 768; y = 1360 }
$targetIdleHeight = 800.0
New-Item -ItemType Directory -Force -Path $sourceFrameRoot, $normalizedRoot | Out-Null

$clips = @(
    [ordered]@{ state='dash_forward'; raw='dash-forward-source-sheet.png'; sheetCells=6; authoredFrames=6; roles=@('forward_coil','first_drive','stride_extension','maximum_burst','carry_stride','shoulder_turn_brake'); exposure=@(3,3,3,3,3,3); loop=$false },
    [ordered]@{ state='dash_backward'; raw='dash-backward-source-sheet.png'; sheetCells=6; authoredFrames=5; roles=@('guarded_retreat_entry','backward_commit','retreat_drive','maximum_retreat','planted_brake'); exposure=@(4,4,4,4,4); loop=$false; retiredGeneratedFrame=5 },
    [ordered]@{ state='air_dash_forward'; raw='air-dash-forward-source-sheet.png'; sheetCells=6; authoredFrames=6; roles=@('airborne_entry','forward_commit','forward_burst','forward_travel','forward_carry','air_brake'); exposure=@(2,2,2,3,3,2); loop=$false },
    [ordered]@{ state='air_dash_backward'; raw='air-dash-backward-source-sheet.png'; sheetCells=6; authoredFrames=5; roles=@('guarded_entry','backward_commit','backward_burst','maximum_retreat','air_brake'); exposure=@(2,2,3,3,4); loop=$false; retiredGeneratedFrame=5 },
    [ordered]@{ state='standing_block'; raw='standing-block-source-sheet.png'; sheetCells=4; authoredFrames=4; roles=@('guard_entry','high_guard','braced_recoil','stable_guard_hold'); exposure=@(4,4,4,4); loop=$true }
)

$legacyIdle = Join-Path $legacyRoot 'idle\idle_00.png'
$legacyIdleBounds = [LamuhDashBlockFrameTools]::AlphaBounds($legacyIdle)
if ($legacyIdleBounds.Height -le 0) { throw 'Protected V1 idle reference has no visible pixels.' }
$idleBounds = [LamuhDashBlockFrameTools]::AlphaBounds($idleReference)
if ($idleBounds.Height -le 0) { throw 'Modern idle reference has no visible pixels.' }

$reportFrames = @()
$stateReports = [ordered]@{}
$sourceSheets = [ordered]@{}
$contactPaths = @()
$contactLabels = @()

foreach ($clip in $clips) {
    $sheetPath = Join-Path $rawRoot $clip.raw
    if (-not (Test-Path -LiteralPath $sheetPath)) { throw "Missing generated source sheet: $sheetPath" }
    $sourceSheets[$clip.state] = [ordered]@{ path = (Resolve-Path -LiteralPath $sheetPath).Path.Substring($RepoRoot.Length + 1).Replace('\','/'); sha256 = Get-Sha256 -LiteralPath $sheetPath; sheetCellCount = $clip.sheetCells; authoredFrameCount = $clip.authoredFrames; generationMode = 'OpenAI built-in image generation reference edit mode' }
    $scaleSamples = @()
    $frameProbes = @()
    for ($index = 0; $index -lt $clip.authoredFrames; $index++) {
        $sourcePath = Join-Path (Join-Path $sourceFrameRoot $clip.state) ("{0}-{1:D2}.png" -f $clip.state.Replace('_','-'), $index)
        $extractMetrics = [LamuhDashBlockFrameTools]::ExtractCell($sheetPath, $sourcePath, $index, $clip.sheetCells)
        $rawBounds = [LamuhDashBlockFrameTools]::AlphaBounds($sourcePath)
        $legacyPath = Join-Path (Join-Path $legacyRoot $clip.state) ("{0}_{1:D2}.png" -f $clip.state, $index)
        if (-not (Test-Path -LiteralPath $legacyPath)) { throw "Missing protected V1 frame: $legacyPath" }
        $legacyBounds = [LamuhDashBlockFrameTools]::AlphaBounds($legacyPath)
        if ($rawBounds.Height -le 0 -or $legacyBounds.Height -le 0) { throw "Empty frame encountered: $($clip.state) $index" }
        $desiredVisibleHeight = $targetIdleHeight * ($legacyBounds.Height / [math]::Max(1, $legacyIdleBounds.Height))
        $scaleSamples += $desiredVisibleHeight / $rawBounds.Height
        $frameProbes += [ordered]@{ index=$index; sourcePath=$sourcePath; extractMetrics=$extractMetrics; rawBounds=$rawBounds; legacyPath=$legacyPath; legacyBounds=$legacyBounds; desiredVisibleHeight=$desiredVisibleHeight }
    }
    $sequenceScale = [math]::Round((Get-Median -Values $scaleSamples), 8)
    foreach ($probe in $frameProbes) {
        $rawWidth = $probe.rawBounds.Width; $rawHeight = $probe.rawBounds.Height
        $legacyWidth = $probe.legacyBounds.Width; $legacyHeight = $probe.legacyBounds.Height
        $legacyRootRatioX = (224.0 - $probe.legacyBounds.MinX) / [math]::Max(1, $legacyWidth)
        $legacyRootRatioY = (382.0 - $probe.legacyBounds.MinY) / [math]::Max(1, $legacyHeight)
        $authoredRawRootX = $probe.rawBounds.MinX + $legacyRootRatioX * $rawWidth
        $authoredRawRootY = $probe.rawBounds.MinY + $legacyRootRatioY * $rawHeight
        $normalizedPath = Join-Path $normalizedRoot ("{0}-{1:D2}.png" -f $clip.state.Replace('_','-'), $probe.index)
        $removeGroundDust = $clip.state -eq 'dash_backward' -and $probe.index -eq 4
        $metrics = [LamuhDashBlockFrameTools]::NormalizeFrame($probe.sourcePath, $normalizedPath, $authoredRawRootX, $authoredRawRootY, $targetRoot.x, $targetRoot.y, 2048, 1536, $sequenceScale, $removeGroundDust)
        $reportFrames += [ordered]@{
            state=$clip.state; index=$probe.index; role=$clip.roles[$probe.index]; legacyIndex=$probe.index
            legacyPath=(Resolve-Path -LiteralPath $probe.legacyPath).Path.Substring($RepoRoot.Length + 1).Replace('\','/'); legacySha256=Get-Sha256 -LiteralPath $probe.legacyPath
            sourcePath=(Resolve-Path -LiteralPath $probe.sourcePath).Path.Substring($RepoRoot.Length + 1).Replace('\','/'); sourceSha256=Get-Sha256 -LiteralPath $probe.sourcePath
            normalizedPath=(Resolve-Path -LiteralPath $normalizedPath).Path.Substring($RepoRoot.Length + 1).Replace('\','/'); normalizedSha256=Get-Sha256 -LiteralPath $normalizedPath
            authoredRawRoot=[ordered]@{x=[math]::Round($authoredRawRootX,2);y=[math]::Round($authoredRawRootY,2)}; normalizedRoot=$targetRoot; rootMapping='legacy_semantic_root_ratio_mapped_to_modern_source'
            sourceScaleCorrection=$sequenceScale; sequenceWideScale=$sequenceScale; desiredVisibleHeight=[math]::Round($probe.desiredVisibleHeight,2)
            visibleBounds=[ordered]@{minX=$metrics.MinX;minY=$metrics.MinY;maxX=$metrics.MaxX;maxY=$metrics.MaxY}
            bodyCenter=[ordered]@{x=[math]::Round($metrics.CentroidX,2);y=[math]::Round($metrics.CentroidY,2)}; visiblePixels=$metrics.VisiblePixels
            backgroundPixelsRemoved=$probe.extractMetrics.BackgroundPixelsRemoved; magentaPixelsNeutralized=($probe.extractMetrics.MagentaPixelsNeutralized + $metrics.MagentaPixelsNeutralized)
            redArtifactPixelsRemoved=($probe.extractMetrics.RedArtifactPixelsRemoved + $metrics.RedArtifactPixelsRemoved); distantComponentPixelsRemoved=($probe.extractMetrics.DistantComponentPixelsRemoved + $metrics.DistantComponentPixelsRemoved); groundDustRemoved=$removeGroundDust
            meaningfulMagentaPixelsRemaining=$metrics.MeaningfulMagentaPixelsRemaining; redArtifactPixelsRemaining=$metrics.RedArtifactPixelsRemaining; touchesEdge=$metrics.TouchesEdge
        }
        $contactPaths += $normalizedPath
        $contactLabels += ("{0} {1:D2} | {2}" -f $clip.state.Replace('_',' '), $probe.index, $clip.roles[$probe.index].Replace('_',' '))
    }
    $stateReports[$clip.state] = [ordered]@{
        sourceFrameCount = $clip.sheetCells; authoredFrameCount = $clip.authoredFrames; selectedLegacyFrames = @(0..($clip.authoredFrames - 1)); retiredGeneratedFrame = $clip.retiredGeneratedFrame
        exposureTicks = $clip.exposure; durationTicks = ($clip.exposure | Measure-Object -Sum).Sum; loop = $clip.loop; sourceScaleCorrection = $sequenceScale
    }
}

if ($reportFrames.Count -ne 26) { throw "Expected 26 authored frames, found $($reportFrames.Count)." }
if (($reportFrames.normalizedSha256 | Select-Object -Unique).Count -ne 26) { throw 'Normalized dash/block frames contain an undeclared duplicate.' }
if ($reportFrames.touchesEdge -contains $true) { throw 'A normalized dash/block frame touches the canvas edge.' }
$remainingMagenta = ($reportFrames.meaningfulMagentaPixelsRemaining | Measure-Object -Sum).Sum
if ($remainingMagenta -ne 0) {
    $reportFrames | Where-Object meaningfulMagentaPixelsRemaining -gt 0 | ForEach-Object { Write-Output ("MAGENTA {0} {1:D2} {2}" -f $_.state, $_.index, $_.meaningfulMagentaPixelsRemaining) }
    throw "Meaningful magenta remains in normalized dash/block frames: $remainingMagenta pixels."
}
$remainingRedArtifacts = ($reportFrames.redArtifactPixelsRemaining | Measure-Object -Sum).Sum
if ($remainingRedArtifacts -ne 0) {
    $reportFrames | Where-Object redArtifactPixelsRemaining -gt 0 | ForEach-Object { Write-Output ("RED_ARTIFACT {0} {1:D2} {2}" -f $_.state, $_.index, $_.redArtifactPixelsRemaining) }
    throw "Bright red generation fringe remains in normalized dash/block frames: $remainingRedArtifacts pixels."
}

$contactSheets = [ordered]@{}
foreach ($clip in $clips) {
    $clipFrames = @($reportFrames | Where-Object state -eq $clip.state)
    $clipPaths = @($clipFrames | ForEach-Object { Join-Path $RepoRoot $_.normalizedPath })
    $clipLabels = @($clipFrames | ForEach-Object { "{0} {1:D2} | {2}" -f $_.state.Replace('_',' '), $_.index, $_.role.Replace('_',' ') })
    $contactSheetPath = Join-Path $reviewRoot ("{0}-numbered-contact-sheet.png" -f $clip.state.Replace('_','-'))
    [LamuhDashBlockFrameTools]::MakeContactSheet($clipPaths, $clipLabels, $contactSheetPath, $clip.authoredFrames)
    $contactSheets[$clip.state] = [ordered]@{ path=(Resolve-Path -LiteralPath $contactSheetPath).Path.Substring($RepoRoot.Length + 1).Replace('\','/');sha256=Get-Sha256 -LiteralPath $contactSheetPath;fixedRoot=$true;numbered=$true }
}

$report = [ordered]@{
    schemaVersion='1.0.0'; subject='lamuh_legacy_v2.dash_air_dash_standing_block.modernization.candidate.v1'; status='candidate-only'; candidateOnly=$true; deployable=$false; productionApproved=$false
    authoredFrameCount=$reportFrames.Count; canvas=[ordered]@{width=2048;height=1536}; fixedRoot=$targetRoot; targetModernIdleVisibleHeight=$targetIdleHeight; measuredModernIdleVisibleHeight=$idleBounds.Height
    sourceSheets=$sourceSheets; states=$stateReports
    normalization=[ordered]@{ sequenceWideScalePerSourceSheet=$true; perFrameRendererScale=$false; visualRecentering=$false; rootPolicy='legacy semantic root ratio to fixed authored root'; backgroundRemoval='preserve real alpha or remove edge-connected neutral checkerboard'; componentPolicy='keep main body and nearby or materially sized components'; purplePolicy='replace meaningful magenta with neutral dark ink'; generatedFringePolicy='remove bright red chroma artifacts'; alphaZeroRgbCleared=$true }
    visualValidation=[ordered]@{ meaningfulMagentaPixelsRemaining=($reportFrames.meaningfulMagentaPixelsRemaining | Measure-Object -Sum).Sum; redArtifactPixelsRemaining=($reportFrames.redArtifactPixelsRemaining | Measure-Object -Sum).Sum; edgeTouches=($reportFrames.touchesEdge | Where-Object { $_ }).Count; fixedRoot=$true; fixedRendererScale=$true }
    sourceRepairReason='Protected V1 pose progression, momentum, coat drag, loc drag, and defensive rhythm are reconstructed in the approved modern Lamuh style. Simulation continues to own dash and air-dash travel; gameplay timing and combat data remain unchanged.'
    reviewArtifacts=[ordered]@{ numberedContactSheets=$contactSheets }
    frames=$reportFrames
}
$reportPath = Join-Path $reviewRoot 'normalization.report.json'
$report | ConvertTo-Json -Depth 16 | Set-Content -LiteralPath $reportPath -Encoding utf8
Write-Output "Normalized $($reportFrames.Count) Lamuh dash/air-dash/standing-block frames to fixed-root candidate art."
