param([string]$RawSource,[string]$RepoRoot=(Resolve-Path (Join-Path $PSScriptRoot '../../..')).Path)
$ErrorActionPreference='Stop'
Add-Type -AssemblyName System.Drawing
$helper=Get-Content (Join-Path $PSScriptRoot 'normalize_lamuh_divine_vanish_v1.ps1') -Raw
$match=[regex]::Match($helper,"(?s)Add-Type -ReferencedAssemblies System.Drawing -TypeDefinition @'\r?\n(.*?)\r?\n'@")
Add-Type -ReferencedAssemblies System.Drawing -TypeDefinition $match.Groups[1].Value
$review=Join-Path $RepoRoot 'tools/nga-forge/review/lamuh-counter-launch-v4'
$source=Join-Path $RepoRoot 'NO_GODS_ABOVE/engine_v2/content-source/characters/lamuh-legacy-v2/counter-launch-frames-v4'
$public=Join-Path $RepoRoot 'NO_GODS_ABOVE/engine_v2/public/lamuh-legacy-v2/counter-launch-v4'
New-Item -ItemType Directory -Force -Path $review,$source,$public | Out-Null
$raw=Join-Path $review 'raw-green-v4.png'
Copy-Item -LiteralPath $RawSource -Destination $raw
$bitmap=[Drawing.Bitmap]::new($raw)
try {if($bitmap.Width-ne1672-or$bitmap.Height-ne941){throw "Unexpected source dimensions $($bitmap.Width)x$($bitmap.Height)"}}finally{$bitmap.Dispose()}
# Explicit whitespace cuts preserve full aura. One anatomical camera scale for all poses.
$cuts=@(@(0,0,418,445),@(418,0,418,445),@(836,0,450,445),@(1286,0,386,445),@(0,445,418,496),@(418,445,418,496),@(836,445,450,496),@(1286,445,386,496))
$roots=@(@(210,397),@(550,397),@(969,397),@(1435,388),@(239,830),@(616,830),@(1023,830),@(1458,830))
$roles=@('near-knee counter chamber','same-leg rising acceleration','rising kick CONTACT','same-knee retraction','two-foot plant and palm raise','diagonal aura-ball charge','empty-palm diagonal release','arm recoil toward guard')
$scale=2.45;$frames=@()
for($i=0;$i-lt8;$i++){
 $c=$cuts[$i];$name=('pose-{0:D2}.png'-f$i);$cut=Join-Path $review ('cut-'+$name);$file=Join-Path $source $name
 [DivineNormalize]::Extract($raw,$cut,$c[0],$c[1],$c[2],$c[3])
 $rx=$roots[$i][0]-$c[0];$ry=$roots[$i][1]-$c[1]
 [DivineNormalize]::Normalize($cut,$file,$rx,$ry,$scale)
 $m=[DivineNormalize]::Measure($file);$cm=[DivineNormalize]::Measure($cut)
 if($m[0]-le0-or$m[1]-le0-or$m[2]-ge2047-or$m[3]-ge1535-or$m[7]-ne0){throw "Unsafe output pose$i : $m"}
 if($cm[0]-le0-or$cm[1]-le0-or$cm[2]-ge($c[2]-1)-or$cm[3]-ge($c[3]-1)){throw "Unsafe source crop pose$i"}
 Copy-Item -LiteralPath $file -Destination (Join-Path $public $name)
 $frames+=@{index=$i;role=$roles[$i];publicPath="/lamuh-legacy-v2/counter-launch-v4/$name";sha256=(Get-FileHash $file).Hash;root=@{x=768;y=1360};sourceCrop=$c;sourceRegistration=@{x=$rx;y=$ry};sourceScale=$scale;visibleBounds=@{minX=$m[0];minY=$m[1];maxX=$m[2];maxY=$m[3]};bodyCenter=@{x=$m[5];y=$m[6]};greenRemaining=$m[7];opaqueWhitePixels=$m[8];transparentPixels=$m[10];auraBaked=$true;contact=($i-eq2);visibleImpact=($i-eq2)}
}
$sheet=[Drawing.Bitmap]::new(2048,820);$g=[Drawing.Graphics]::FromImage($sheet);$font=[Drawing.Font]::new('Arial',13)
try{$g.Clear([Drawing.Color]::FromArgb(18,23,32));for($i=0;$i-lt8;$i++){$x=($i%4)*512;$y=[math]::Floor($i/4)*410;$img=[Drawing.Bitmap]::new((Join-Path $source ('pose-{0:D2}.png'-f$i)));try{$g.DrawImage($img,[Drawing.Rectangle]::new($x,$y+20,512,384));$g.DrawString(("{0:D2} {1}"-f$i,$roles[$i]),$font,[Drawing.Brushes]::White,$x+4,$y+2)}finally{$img.Dispose()}};$sheet.Save((Join-Path $public 'numbered-contact-sheet.png'),[Drawing.Imaging.ImageFormat]::Png)}finally{$g.Dispose();$font.Dispose();$sheet.Dispose()}
$report=@{candidateOnly=$true;deployable=$false;humanApproval=$null;frames=$frames;rawSha256=(Get-FileHash $raw).Hash;canvas=@{width=2048;height=1536};root=@{x=768;y=1360};sourceScale=$scale;perPoseScale=$false;alphaPolicy='green-only removal and unmix; no white key and no component deletion';sourceImage=$RawSource;contactSheet='/lamuh-legacy-v2/counter-launch-v4/numbered-contact-sheet.png'}
[IO.File]::WriteAllText((Join-Path $review 'normalization.report.json'),($report|ConvertTo-Json -Depth 15),[Text.UTF8Encoding]::new($false))
$frames|ForEach-Object{"pose$($_.index): green=$($_.greenRemaining), white=$($_.opaqueWhitePixels), alpha=$($_.transparentPixels)"}
