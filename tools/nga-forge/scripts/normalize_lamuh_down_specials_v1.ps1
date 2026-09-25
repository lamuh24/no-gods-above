param([Parameter(Mandatory=$true)][string]$ConfigPath,[string]$RepoRoot=(Resolve-Path (Join-Path $PSScriptRoot '../../..')).Path)
$ErrorActionPreference='Stop'
Add-Type -AssemblyName System.Drawing
$helper=Get-Content (Join-Path $PSScriptRoot 'normalize_lamuh_divine_vanish_v1.ps1') -Raw
$match=[regex]::Match($helper,"(?s)Add-Type -ReferencedAssemblies System.Drawing -TypeDefinition @'\r?\n(.*?)\r?\n'@")
Add-Type -ReferencedAssemblies System.Drawing -TypeDefinition $match.Groups[1].Value
$cfg=Get-Content $ConfigPath -Raw | ConvertFrom-Json
$review=Join-Path $RepoRoot 'tools/nga-forge/review/lamuh-down-specials-v1'
$source=Join-Path $RepoRoot 'NO_GODS_ABOVE/engine_v2/content-source/characters/lamuh-legacy-v2/down-special-frames-v1'
$public=Join-Path $RepoRoot 'NO_GODS_ABOVE/engine_v2/public/lamuh-legacy-v2/down-specials-v1'
New-Item -ItemType Directory -Force -Path $review,$source,$public | Out-Null
$raw=Join-Path $review ($cfg.strength+'-raw.png');Copy-Item -LiteralPath $cfg.raw -Destination $raw
$frames=@();$paths=@();$labels=@()
for($i=0;$i-lt$cfg.cuts.Count;$i++){
 $c=$cfg.cuts[$i];$name=('{0}-{1:D2}.png'-f$cfg.strength,$i);$cut=Join-Path $review ('cut-'+$name);$file=Join-Path $source $name
 if($cfg.preserveAlpha){$b=[Drawing.Bitmap]::new($raw);try{$part=$b.Clone([Drawing.Rectangle]::new($c[0],$c[1],$c[2],$c[3]),[Drawing.Imaging.PixelFormat]::Format32bppArgb);try{$part.Save($cut,[Drawing.Imaging.ImageFormat]::Png)}finally{$part.Dispose()}}finally{$b.Dispose()}}
 else{[DivineNormalize]::Extract($raw,$cut,$c[0],$c[1],$c[2],$c[3])}
 $rx=$cfg.roots[$i][0]-$c[0];$ry=$cfg.roots[$i][1]-$c[1]
 [DivineNormalize]::Normalize($cut,$file,$rx,$ry,$cfg.scale)
 $m=[DivineNormalize]::Measure($file);$cm=[DivineNormalize]::Measure($cut)
 if($m[0]-le0-or$m[1]-le0-or$m[2]-ge2047-or$m[3]-ge1535-or$m[7]-ne0){throw "Unsafe normalized $name"}
 if($cm[0]-le0-or$cm[1]-le0-or$cm[2]-ge($c[2]-1)-or$cm[3]-ge($c[3]-1)){throw "Clipped source $name"}
 Copy-Item -LiteralPath $file -Destination (Join-Path $public $name)
 $frames+=@{index=$i;role=$cfg.roles[$i];publicPath="/lamuh-legacy-v2/down-specials-v1/$name";sha256=(Get-FileHash $file).Hash;root=@{x=768;y=1360};sourceCrop=$c;sourceRegistration=@{x=$rx;y=$ry};sourceScale=$cfg.scale;visibleBounds=@{minX=$m[0];minY=$m[1];maxX=$m[2];maxY=$m[3]};greenRemaining=$m[7];opaqueWhitePixels=$m[8];transparentPixels=$m[10];auraBaked=$true}
 $paths+=$file;$labels+=("{0:D2} {1}"-f$i,$cfg.roles[$i])
}
$sheet=[Drawing.Bitmap]::new(1536,([int][math]::Ceiling($paths.Count/3.0)*425));$g=[Drawing.Graphics]::FromImage($sheet);$font=[Drawing.Font]::new('Arial',15)
try{
 $g.Clear([Drawing.Color]::FromArgb(18,23,32))
 for($i=0;$i-lt$paths.Count;$i++){$x=($i%3)*512;$y=[int][math]::Floor($i/3)*425;$img=[Drawing.Bitmap]::new($paths[$i]);try{$g.DrawImage($img,[Drawing.Rectangle]::new($x,$y+25,512,384));$g.DrawString($labels[$i],$font,[Drawing.Brushes]::White,$x+4,$y+4);$g.DrawLine([Drawing.Pens]::DimGray,$x,$y+365,$x+512,$y+365)}finally{$img.Dispose()}}
 $sheet.Save((Join-Path $public ($cfg.strength+'-contact-sheet.png')),[Drawing.Imaging.ImageFormat]::Png)
}finally{$g.Dispose();$font.Dispose();$sheet.Dispose()}
$report=@{candidateOnly=$true;deployable=$false;humanApproval=$null;frames=$frames;rawSha256=(Get-FileHash $raw).Hash;canvas=@{width=2048;height=1536};root=@{x=768;y=1360};sourceScale=$cfg.scale;perPoseScale=$false;alphaPolicy='green-only no white removal no component deletion';sourceImage=$cfg.raw}
[IO.File]::WriteAllText((Join-Path $review ($cfg.strength+'-normalization.json')),($report|ConvertTo-Json -Depth 15),[Text.UTF8Encoding]::new($false))
$frames|ForEach-Object{"$($_.role): green=$($_.greenRemaining), alpha=$($_.transparentPixels)"}
