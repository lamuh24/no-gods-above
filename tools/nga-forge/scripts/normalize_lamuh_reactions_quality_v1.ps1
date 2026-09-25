param([string]$RepoRoot = (Resolve-Path (Join-Path $PSScriptRoot '../../..')).Path)
$ErrorActionPreference = 'Stop'
. (Join-Path $PSScriptRoot 'normalize_lamuh_dash_block_modernization_v1.ps1') -RepoRoot $RepoRoot -LibraryOnly
$review = Join-Path $RepoRoot 'tools/nga-forge/review/lamuh-legacy-v2-quality-v1'
$raw = Join-Path $review 'raw/reactions-source.png'
$source = Join-Path $review 'source-frames'
$normalized = Join-Path $RepoRoot 'NO_GODS_ABOVE/engine_v2/content-source/characters/lamuh-legacy-v2/reaction-frames-quality-v1'
$public = Join-Path $RepoRoot 'NO_GODS_ABOVE/engine_v2/public/lamuh-legacy-v2/reactions-quality-v1'
New-Item -ItemType Directory -Force -Path $source,$normalized,$public | Out-Null
$sheet = [System.Drawing.Bitmap]::FromFile($raw)
try {
  for ($row=0; $row -lt 3; $row++) {
    $top = [int][math]::Round($row*$sheet.Height/3)
    $bottom = [int][math]::Round(($row+1)*$sheet.Height/3)
    $rowPath = Join-Path $source "row-$row.png"
    $rect = [System.Drawing.Rectangle]::new(0,$top,$sheet.Width,$bottom-$top)
    $strip = $sheet.Clone($rect,[System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
    try { $strip.Save($rowPath,[System.Drawing.Imaging.ImageFormat]::Png) } finally { $strip.Dispose() }
    for ($col=0; $col -lt 4; $col++) {
      $index = $row*4+$col
      $output = Join-Path $source ('reaction-{0:D2}.png' -f $index)
      [LamuhDashBlockFrameTools]::ExtractCell($rowPath,$output,$col,4) | Out-Null
    }
  }
} finally { $sheet.Dispose() }
$idlePath = Join-Path $RepoRoot 'NO_GODS_ABOVE/engine_v2/public/lamuh-legacy-v2/movement-v2/idle-00.png'
$idleBounds = [LamuhDashBlockFrameTools]::AlphaBounds($idlePath)
$standingBounds = [LamuhDashBlockFrameTools]::AlphaBounds((Join-Path $source 'reaction-11.png'))
$scale = [math]::Round($idleBounds.Height/$standingBounds.Height,8)
$roles = @('light_impact_recoil','heavy_chest_recoil','weight_catch','guard_recovery','launch_extension','airborne_gather','falling_brace','grounded_settle','ground_push','kneeling_gather','low_guard_rise','upright_recovery')
$frames = @(); $paths=@(); $labels=@()
for ($i=0; $i -lt 12; $i++) {
  $inputPath=Join-Path $source ('reaction-{0:D2}.png' -f $i)
  $outPath=Join-Path $normalized ('reaction-{0:D2}.png' -f $i)
  $bounds=[LamuhDashBlockFrameTools]::AlphaBounds($inputPath)
  # One physical scale across every pose. Low poses retain compression; no height normalization.
  $rootX=($bounds.MinX+$bounds.MaxX)/2.0
  $rootY=$bounds.MaxY
  $m=[LamuhDashBlockFrameTools]::NormalizeFramePreserveDetails($inputPath,$outPath,$rootX,$rootY,768,1360,2048,1536,$scale,$false)
  if ($m.TouchesEdge -or $m.VisiblePixels -lt 1000 -or $m.MeaningfulMagentaPixelsRemaining -gt 0) { throw "Reaction $i failed normalization" }
  Copy-Item -LiteralPath $outPath -Destination (Join-Path $public ('reaction-{0:D2}.png' -f $i))
  $frames += [ordered]@{index=$i;role=$roles[$i];publicPath=('/lamuh-legacy-v2/reactions-quality-v1/reaction-{0:D2}.png' -f $i);sha256=(Get-Sha256 $outPath);sourceSha256=(Get-Sha256 $inputPath);root=@{x=768;y=1360};visibleBounds=@{minX=$m.MinX;minY=$m.MinY;maxX=$m.MaxX;maxY=$m.MaxY};bodyCenter=@{x=$m.CentroidX;y=$m.CentroidY};visiblePixels=$m.VisiblePixels;touchesEdge=$m.TouchesEdge}
  $paths += $outPath; $labels += ('{0:D2} {1}' -f $i,$roles[$i])
}
$sheetPath=Join-Path $review 'reactions-numbered-contact-sheet.png'
[LamuhDashBlockFrameTools]::MakeContactSheet($paths,$labels,$sheetPath,4)
Copy-Item -LiteralPath $sheetPath -Destination (Join-Path $public 'reactions-numbered-contact-sheet.png')
$report=[ordered]@{schemaVersion='1.0.0';candidateOnly=$true;deployable=$false;subject='lamuh_legacy_v2.reaction_quality_v1';sourceSheetSha256=(Get-Sha256 $raw);idleReferenceSha256=(Get-Sha256 $idlePath);canvas=@{width=2048;height=1536};root=@{x=768;y=1360};sequenceScale=$scale;perFrameScale=$false;bodyArtworkGenerated=$true;sourceMode='built_in_imagegen_identity_reference';contactSheetPublicPath='/lamuh-legacy-v2/reactions-quality-v1/reactions-numbered-contact-sheet.png';frames=$frames;sequences=@{light=@{indices=@(0,2,3);exposureTicks=@(4,4,6)};heavy=@{indices=@(1,2,3);exposureTicks=@(6,5,7)};launch=@{indices=@(4,5,6);exposureTicks=@(5,6,7)};knockdown=@{indices=@(6,7);exposureTicks=@(4,8)};getup=@{indices=@(8,9,10,11);exposureTicks=@(4,5,5,6)}}}
$json=$report | ConvertTo-Json -Depth 15
$utf8NoBom = [System.Text.UTF8Encoding]::new($false)
[System.IO.File]::WriteAllText((Join-Path $review 'normalization.report.json'), $json, $utf8NoBom)
[System.IO.File]::WriteAllText((Join-Path $RepoRoot 'NO_GODS_ABOVE/engine_v2/content-source/characters/lamuh-legacy-v2/reactions-quality.v1.json'), $json, $utf8NoBom)
[System.IO.File]::WriteAllText((Join-Path $public 'manifest.json'), $json, $utf8NoBom)
Write-Output "Normalized 12 unique Lamuh reactions, one scale $scale; no edge or purple pixels."
