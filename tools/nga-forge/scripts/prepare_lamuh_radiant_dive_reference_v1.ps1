$ErrorActionPreference='Stop'
Add-Type -AssemblyName System.Drawing
$repoRoot=[IO.Path]::GetFullPath((Join-Path $PSScriptRoot '../../..'))
$reviewDir=Join-Path $repoRoot 'tools/nga-forge/review/lamuh-legacy-v2-radiant-dive-v1'
New-Item -ItemType Directory -Path $reviewDir -Force | Out-Null
$source=Join-Path $repoRoot 'NO_GODS_ABOVE/engine_v2/public/lamuh-legacy-v2/atlases/lamuh_sheet_5_specials_atlas.png'
$bitmap=[Drawing.Bitmap]::FromFile($source)
try {
 $row=$bitmap.Clone([Drawing.Rectangle]::new(0,1792,3136,448),[Drawing.Imaging.PixelFormat]::Format32bppArgb)
 try {$row.Save((Join-Path $reviewDir 'protected-v1-radiant-dive-strip.png'),[Drawing.Imaging.ImageFormat]::Png)}finally{$row.Dispose()}
}finally{$bitmap.Dispose()}
Write-Output 'Read-only source extraction: seven protected V1 Radiant Dive poses; original atlas unchanged.'
