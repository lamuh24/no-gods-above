param(
    [string]$RepoRoot = (Resolve-Path (Join-Path $PSScriptRoot '..\..\..')).Path
)

$ErrorActionPreference = 'Stop'
Add-Type -AssemblyName System.Drawing

$rawRoot = Join-Path $RepoRoot 'tools\nga-forge\review\lamuh-legacy-v2-air-normals-v1\raw'
$basePath = Join-Path $rawRoot 'air-medium-strip-v3-smooth-single-hit.png'
$repairSourcePath = Join-Path $rawRoot 'air-medium-strip-v4-two-foot-repair.generated-full.png'
$outputPath = Join-Path $rawRoot 'air-medium-strip-v4-two-foot-repair.png'

foreach ($path in @($basePath, $repairSourcePath)) {
    if (-not (Test-Path -LiteralPath $path)) { throw "Missing required strip: $path" }
}

$base = [System.Drawing.Bitmap]::FromFile($basePath)
$repair = [System.Drawing.Bitmap]::FromFile($repairSourcePath)
try {
    if ($base.Width -ne $repair.Width -or $base.Height -ne $repair.Height) {
        throw "Repair strip dimensions must match the preserved strip."
    }
    if (($base.Width % 6) -ne 0) { throw "Expected a six-cell horizontal strip." }

    $cellWidth = [int]($base.Width / 6)
    $output = New-Object System.Drawing.Bitmap($base.Width, $base.Height, [System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
    try {
        $graphics = [System.Drawing.Graphics]::FromImage($output)
        try {
            $graphics.CompositingMode = [System.Drawing.Drawing2D.CompositingMode]::SourceCopy
            $graphics.DrawImageUnscaled($base, 0, 0)
            foreach ($frameIndex in @(1, 2)) {
                $rect = [System.Drawing.Rectangle]::new([int]($frameIndex * $cellWidth), 0, $cellWidth, $base.Height)
                $graphics.DrawImage($repair, $rect, $rect, [System.Drawing.GraphicsUnit]::Pixel)
            }
        }
        finally { $graphics.Dispose() }

        $tempPath = "$outputPath.tmp.png"
        $output.Save($tempPath, [System.Drawing.Imaging.ImageFormat]::Png)
        Move-Item -LiteralPath $tempPath -Destination $outputPath -Force
    }
    finally { $output.Dispose() }
}
finally {
    $repair.Dispose()
    $base.Dispose()
}

Write-Output "Composed targeted Jump Medium repair: $outputPath"
Write-Output 'Preserved source cells: 0, 3, 4, 5'
Write-Output 'Repaired source cells: 1, 2'
