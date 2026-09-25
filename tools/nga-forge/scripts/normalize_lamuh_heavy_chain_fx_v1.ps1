param([string]$RepoRoot=(Resolve-Path (Join-Path $PSScriptRoot '../../..')).Path)
$ErrorActionPreference='Stop'
Add-Type -AssemblyName System.Drawing
$helper=Get-Content (Join-Path $PSScriptRoot 'normalize_lamuh_divine_vanish_v1.ps1') -Raw
$match=[regex]::Match($helper,"(?s)Add-Type -ReferencedAssemblies System.Drawing -TypeDefinition @'\r?\n(.*?)\r?\n'@")
Add-Type -ReferencedAssemblies System.Drawing -TypeDefinition $match.Groups[1].Value
$review=Join-Path $RepoRoot 'tools/nga-forge/review/lamuh-heavy-chain-fx-v1'
$source=Join-Path $RepoRoot 'NO_GODS_ABOVE/engine_v2/content-source/characters/lamuh-legacy-v2/heavy-chain-fx-v1'
$public=Join-Path $RepoRoot 'NO_GODS_ABOVE/engine_v2/public/lamuh-legacy-v2/heavy-chain-fx-v1'
New-Item -ItemType Directory -Force -Path $review,$source,$public|Out-Null
$raw=Join-Path $review 'raw-green-v1.png'
Copy-Item -LiteralPath 'C:/Users/qchee/.codex/generated_images/01a03e8b-8571-7a70-9c5b-8707edfb06d7/exec-6aef548e-6712-4052-a5f1-bbbe2aca5913.png' -Destination $raw
$cuts=@(@(0,0,627,760),@(627,0,627,760),@(0,760,627,494),@(627,760,627,494))
$anchors=@(@(370,710),@(265,700),@(447,227),@(398,227))
$names=@('vanish-shell','vanish-wisp','aura-ball-00','aura-ball-01');$records=@()
for($i=0;$i-lt4;$i++){
 $c=$cuts[$i];$cut=Join-Path $review ($names[$i]+'-cut.png');$file=Join-Path $source ($names[$i]+'.png')
 [DivineNormalize]::Extract($raw,$cut,$c[0],$c[1],$c[2],$c[3])
 if($i-lt2){[DivineNormalize]::Normalize($cut,$file,$anchors[$i][0],$anchors[$i][1],1.2);$root=@{x=768;y=1360};$canvas=@{width=2048;height=1536}}
 else{
  $b=[Drawing.Bitmap]::new(512,512);$g=[Drawing.Graphics]::FromImage($b);$g.Clear([Drawing.Color]::Transparent);$im=[Drawing.Bitmap]::new($cut)
  $g.InterpolationMode=[Drawing.Drawing2D.InterpolationMode]::NearestNeighbor
  $g.DrawImage($im,[single](320-$anchors[$i][0]*.6),[single](256-$anchors[$i][1]*.6),[single]($im.Width*.6),[single]($im.Height*.6))
  $b.Save($file,[Drawing.Imaging.ImageFormat]::Png);$g.Dispose();$b.Dispose();$im.Dispose();$root=@{x=320;y=256};$canvas=@{width=512;height=512}
 }
 $m=[DivineNormalize]::Measure($file)
 if($m[0]-le0-or$m[1]-le0-or$m[2]-ge($canvas.width-1)-or$m[3]-ge($canvas.height-1)-or$m[7]-ne0){throw "FX bounds/green failure $i"}
 Copy-Item -LiteralPath $file -Destination (Join-Path $public ($names[$i]+'.png'))
 $records+=@{index=$i;role=$names[$i];publicPath="/lamuh-legacy-v2/heavy-chain-fx-v1/$($names[$i]).png";sha256=(Get-FileHash $file).Hash;root=$root;canvas=$canvas;bodyCenter=@{x=$m[5];y=$m[6]};visibleBounds=@{minX=$m[0];minY=$m[1];maxX=$m[2];maxY=$m[3]};greenRemaining=$m[7];contact=$false;visibleImpact=$false;auraBaked=$true;bodyAbsent=$true}
}
$report=@{candidateOnly=$true;deployable=$false;humanApproval=$null;frames=$records;rawSha256=(Get-FileHash $raw).Hash;palette='flowing cyan-white-gold matching body aura';method='green matte extraction; all white cores preserved; no body artwork'}
[IO.File]::WriteAllText((Join-Path $review 'normalization.report.json'),($report|ConvertTo-Json -Depth 12),[Text.UTF8Encoding]::new($false))
Write-Output 'Four matching aura FX normalized and checked'
