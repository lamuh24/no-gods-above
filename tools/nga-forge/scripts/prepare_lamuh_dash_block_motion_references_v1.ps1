param(
    [string]$RepoRoot = (Resolve-Path (Join-Path $PSScriptRoot '..\..\..')).Path
)

$ErrorActionPreference = 'Stop'
Add-Type -AssemblyName System.Drawing

$sourceRoot = Join-Path $RepoRoot 'NO_GODS_ABOVE\engine_v2\content-source\characters\lamuh-legacy-v2\source-frames'
$outputRoot = Join-Path $RepoRoot 'tools\nga-forge\review\lamuh-legacy-v2-dash-block-modernization-v1\references'

$clips = [ordered]@{
    'dash_forward' = 6
    'dash_backward' = 6
    'air_dash_forward' = 6
    'air_dash_backward' = 6
    'standing_block' = 4
}

New-Item -ItemType Directory -Force -Path $outputRoot | Out-Null

foreach ($entry in $clips.GetEnumerator()) {
    $clip = $entry.Key
    $frameCount = [int]$entry.Value
    $cellSize = 448
    $outputPath = Join-Path $outputRoot "$clip-v1-motion-strip.png"
    $strip = New-Object System.Drawing.Bitmap ($cellSize * $frameCount), $cellSize, ([System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
    try {
        $graphics = [System.Drawing.Graphics]::FromImage($strip)
        try {
            $graphics.Clear([System.Drawing.Color]::Transparent)
            $graphics.CompositingMode = [System.Drawing.Drawing2D.CompositingMode]::SourceCopy
            $graphics.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::NearestNeighbor
            $graphics.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::Half
            for ($index = 0; $index -lt $frameCount; $index++) {
                $framePath = Join-Path (Join-Path $sourceRoot $clip) ("{0}_{1:D2}.png" -f $clip, $index)
                if (-not (Test-Path -LiteralPath $framePath)) { throw "Missing protected V1 frame: $framePath" }
                $frame = [System.Drawing.Bitmap]::FromFile($framePath)
                try {
                    $graphics.DrawImage($frame, $index * $cellSize, 0, $cellSize, $cellSize)
                }
                finally { $frame.Dispose() }
            }
        }
        finally { $graphics.Dispose() }
        $strip.Save($outputPath, [System.Drawing.Imaging.ImageFormat]::Png)
    }
    finally { $strip.Dispose() }
    Write-Output $outputPath
}
