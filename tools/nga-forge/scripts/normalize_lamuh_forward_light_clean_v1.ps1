param([string]$RepoRoot=(Resolve-Path (Join-Path $PSScriptRoot '../../..')).Path,[string]$Version='v2',[string]$RawPath='C:/Users/qchee/.codex/generated_images/01a03e8b-8571-7a70-9c5b-8707edfb06d7/exec-26ecc1eb-27e0-45ce-8ae9-2c2f489bae31.png')
$ErrorActionPreference='Stop'
Add-Type -AssemblyName System.Drawing
$helper=Get-Content (Join-Path $PSScriptRoot 'normalize_lamuh_divine_vanish_v1.ps1') -Raw
$match=[regex]::Match($helper,"(?s)Add-Type -ReferencedAssemblies System.Drawing -TypeDefinition @'\r?\n(.*?)\r?\n'@")
if(-not$match.Success){throw 'Helper declaration not found'}
Add-Type -ReferencedAssemblies System.Drawing -TypeDefinition $match.Groups[1].Value
$review=Join-Path $RepoRoot "tools/nga-forge/review/lamuh-forward-light-clean-$Version"
$source=Join-Path $RepoRoot "NO_GODS_ABOVE/engine_v2/content-source/characters/lamuh-legacy-v2/forward-light-clean-$Version"
$public=Join-Path $RepoRoot "NO_GODS_ABOVE/engine_v2/public/lamuh-legacy-v2/forward-light-clean-$Version"
New-Item -ItemType Directory -Force -Path $review,$source,$public | Out-Null
$raw=Join-Path $review 'raw-sequence-v1.png'
Copy-Item -LiteralPath $RawPath -Destination $raw
# Explicit gutters and pelvis-X / sandal baseline registration. One camera scale;
# lower dash height comes from pose compression, never independent bbox scaling.
$cuts=@(@(0,0,360,510),@(360,0,356,510),@(716,0,384,510),@(1100,0,436,510),@(0,510,430,514),@(430,510,320,514),@(750,510,350,514))
$anchors=@(@(200,453),@(589,455),@(936,452),@(1320,454),@(251,870),@(605,873),@(939,895))
$roles=@('loaded anticipation','committed low forward dash','same-arm extension connector','single straight punch contact','forward-weight follow through','same-arm retraction','settling toward idle')
$scale=2.3;$frames=@();$paths=@();$labels=@()
for($i=0;$i-lt7;$i++){
 $c=$cuts[$i];$name=('pose-{0:D2}.png'-f$i);$cut=Join-Path $review ('cut-'+$name);$file=Join-Path $source $name
 [DivineNormalize]::Extract($raw,$cut,$c[0],$c[1],$c[2],$c[3])
 [DivineNormalize]::Normalize($cut,$file,($anchors[$i][0]-$c[0]),($anchors[$i][1]-$c[1]),$scale)
 $m=[DivineNormalize]::Measure($file)
 if($m[0]-le0-or$m[1]-le0-or$m[2]-ge2047-or$m[3]-ge1535-or$m[7]-ne0){throw "Bounds/alpha failure $i"}
 Copy-Item -LiteralPath $file -Destination (Join-Path $public $name)
 $frames+=@{index=$i;role=$roles[$i];publicPath="/lamuh-legacy-v2/forward-light-clean-$Version/$name";sha256=(Get-FileHash $file).Hash;root=@{x=768;y=1360};bodyCenter=@{x=$m[5];y=$m[6]};visibleBounds=@{minX=$m[0];minY=$m[1];maxX=$m[2];maxY=$m[3]};contact=($i-eq3);visibleImpact=($i-eq3);auraBaked=($i-ge1-and$i-le4);sourceScale=$scale;greenRemaining=$m[7];edgeContact=$false}
 $paths+=$file;$labels+=("$i $($roles[$i])")
}
# Seven poses require three rows; contact preview uses an explicit larger canvas.
$sheet=Join-Path $public 'contact-sheet.png'
$b=[Drawing.Bitmap]::new(1792,768);$g=[Drawing.Graphics]::FromImage($b);$g.Clear([Drawing.Color]::FromArgb(15,23,32))
for($i=0;$i-lt7;$i++){$f=[Drawing.Bitmap]::new($paths[$i]);$x=($i%4)*448;$y=[math]::Floor($i/4)*384;$g.DrawImage($f,[Drawing.Rectangle]::new($x,$y,448,336));$g.DrawString($labels[$i],[Drawing.Font]::new('Arial',10),[Drawing.Brushes]::White,$x+4,$y+342);$f.Dispose()}
$b.Save($sheet,[Drawing.Imaging.ImageFormat]::Png);$g.Dispose();$b.Dispose()
$report=@{candidateOnly=$true;deployable=$false;frames=$frames;canvas=@{width=2048;height=1536};root=@{x=768;y=1360};singleSequenceScale=$scale;perFrameRescale=$false;rawSha256=(Get-FileHash $raw).Hash;contactSheetPublicPath="/lamuh-legacy-v2/forward-light-clean-$Version/contact-sheet.png";humanApproval=$false;unusedRawCell=7;notes=@('Core unchanged; exact idle used at both sequence endpoints','Old source/Divine shared art not overwritten','Green-only extraction preserves opaque white sleeves and cyan dash aura')}
[IO.File]::WriteAllText((Join-Path $review 'normalization.report.json'),($report|ConvertTo-Json -Depth 20),[Text.UTF8Encoding]::new($false))
Write-Output 'Seven Light candidate source frames normalized'
