param([string]$RepoRoot=(Resolve-Path (Join-Path $PSScriptRoot '../../..')).Path)
$ErrorActionPreference='Stop'
. (Join-Path $PSScriptRoot 'normalize_lamuh_heaven_splitter_v1.ps1') -RepoRoot $RepoRoot -LibraryOnly
$review=Join-Path $RepoRoot 'tools/nga-forge/review/lamuh-legacy-v2-heaven-splitter-v1'
$base=Join-Path $RepoRoot 'NO_GODS_ABOVE/engine_v2/content-source/characters/lamuh-legacy-v2'
$public=Join-Path $RepoRoot 'NO_GODS_ABOVE/engine_v2/public/lamuh-legacy-v2/heaven-heavy-v2'
$source=Join-Path $base 'heaven-heavy-frames-v2'
$extracted=Join-Path $review 'heavy-extracted'
New-Item -ItemType Directory -Force -Path $public,$source,$extracted | Out-Null
$windPelvis=@(@(200,225),@(131,272),@(114,279),@(104,231),@(201,192),@(143,218),@(106,216),@(97,211),@(197,147),@(131,163),@(95,160),@(119,155))
$releasePelvis=@(@(321,378),@(233,317),@(130,268),@(318,190),@(199,185),@(138,282))
$families=@{}
# Critic-audited enclosed background pockets only; never key white clothing.
Add-Type -ReferencedAssemblies System.Drawing -TypeDefinition @'
using System; using System.Drawing; using System.Drawing.Imaging;
public static class HeavyHairGapCleanup {
 public static void Clean(string input,string output,int x0,int y0,int x1,int y1){
  using(var b=new Bitmap(input)){
   for(int y=y0;y<=y1;y++)for(int x=x0;x<=x1;x++){
    var c=b.GetPixel(x,y);int lo=Math.Min(c.R,Math.Min(c.G,c.B)),hi=Math.Max(c.R,Math.Max(c.G,c.B));
    if(lo>=214&&hi-lo<=12)b.SetPixel(x,y,Color.Transparent);
   }
   b.Save(output,ImageFormat.Png);
  }
 }
}
'@
foreach($kind in @('windup','release')){
 $isWind=$kind -eq 'windup';$count=if($isWind){12}else{6};$raw=Join-Path $review $(if($isWind){'raw/heavy-windup-landing.png'}else{'raw/heavy-release.png'})
 # Per-source camera calibration, never per-frame. Larger 3-column release figures
 # use0.8 of the 4-column source scale, measured against head/upper-arm proportions.
 $scale=if($isWind){3.11284047}else{2.490272376};$pelvis=if($isWind){$windPelvis}else{$releasePelvis}
 $records=@();$paths=@();$labels=@()
 for($i=0;$i -lt $count;$i++){
  $cols=if($isWind){4}else{3};$rows=if($isWind){3}else{2};$left=[int][math]::Round(($i%$cols)*1448/$cols);$right=[int][math]::Round((($i%$cols)+1)*1448/$cols);$top=[int][math]::Round([math]::Floor($i/$cols)*1086/$rows);$bottom=[int][math]::Round(([math]::Floor($i/$cols)+1)*1086/$rows)
  # Wide coat tails in the third generated column cross the nominal965px grid.
  # Use audited whitespace cuts; shift source landmarks by the crop-origin delta.
  $rootX=$pelvis[$i][0]
  if(!$isWind){$cuts=@(0,483,932,1448);$nominalLeft=$left;$left=$cuts[$i%3];$right=$cuts[($i%3)+1];$rootX+=$nominalLeft-$left}
  $cut=Join-Path $extracted "$kind-$i.png";[HeavenCutout]::ExtractRect($raw,$cut,$left,$top,$right-$left,$bottom-$top)
  if(($isWind -and $i -eq 2) -or (!$isWind -and $i -eq 0)){
   $clean=Join-Path $extracted "$kind-$i.hair-clean.png"
   if($isWind){[HeavyHairGapCleanup]::Clean($cut,$clean,95,189,118,203)}else{[HeavyHairGapCleanup]::Clean($cut,$clean,281,261,315,272)}
   $cut=$clean
  }
  $b=[LamuhDashBlockFrameTools]::AlphaBounds($cut);$air=if($isWind){$i -eq 8}else{$i -ge 2};$rootY=if($air){$pelvis[$i][1]+$(if($isWind){148}else{200})}else{$b.MaxY}
  $file=Join-Path $source ("heavy-$kind-{0:D2}.png" -f $i)
  $m=[LamuhDashBlockFrameTools]::NormalizeFramePreserveDetails($cut,$file,$rootX,$rootY,768,1360,2048,1536,$scale,$false)
  if($m.TouchesEdge -or $m.VisiblePixels -lt 1000 -or $m.MeaningfulMagentaPixelsRemaining -gt 0){throw "Invalid Heavy $kind $i"}
  Copy-Item -LiteralPath $file -Destination (Join-Path $public ([IO.Path]::GetFileName($file)))
  $records+=@{index=$i;publicPath=("/lamuh-legacy-v2/heaven-heavy-v2/heavy-$kind-{0:D2}.png" -f $i);sha256=(Get-Sha256 $file);sourceSha256=(Get-Sha256 $cut);root=@{x=768;y=1360};sourcePelvis=@{x=$rootX;y=$pelvis[$i][1]};sourceRegistration=@{x=$rootX;y=$rootY};visibleBounds=@{minX=$m.MinX;minY=$m.MinY;maxX=$m.MaxX;maxY=$m.MaxY};bodyCenter=@{x=$m.CentroidX;y=$m.CentroidY};contact=$false;visibleImpact=$false}
  $paths+=$file;$labels+=("{0:D2} heavy {1}" -f $i,$kind)
 }
 $sheet=Join-Path $review "heavy-$kind-numbered-contact-sheet.png";[LamuhDashBlockFrameTools]::MakeContactSheet($paths,$labels,$sheet,$cols);Copy-Item -LiteralPath $sheet -Destination $public
 $families[$kind]=@{frames=$records;scale=$scale;sourceSha256=(Get-Sha256 $raw);contactSheetPublicPath="/lamuh-legacy-v2/heaven-heavy-v2/heavy-$kind-numbered-contact-sheet.png"}
}
$report=@{schemaVersion='1.0.0';candidateOnly=$true;deployable=$false;families=$families;canvas=@{width=2048;height=1536};root=@{x=768;y=1360};registration='hand-audited pelvis x, grounded sandal or pelvis-relative virtual ground';perFrameRescale=$false;sourceArtCameraCorrections=@(1,.8);reason='User requested a distinct cinematic Heavy, not extended Light. Light/Medium frames and all combat/hop clocks preserved.'}
$idle=Join-Path $RepoRoot 'NO_GODS_ABOVE/engine_v2/public/lamuh-legacy-v2/movement-v2/idle-00.png'
$active=@($idle)
foreach($i in @(1,2)){$active+=Join-Path $source ("heavy-windup-{0:D2}.png" -f $i)}
foreach($i in 0..5){$active+=Join-Path $source ("heavy-release-{0:D2}.png" -f $i)}
foreach($i in @(8,9,10,11)){$active+=Join-Path $source ("heavy-windup-{0:D2}.png" -f $i)}
$active+=$idle
$roles=@('idle','weight sink','wind back','coil','rising connector','ONE UPPERCUT CONTACT','full extension','apex release','gather','landing approach','two-foot catch','settle','coat-lag guard','idle')
$labels=@();for($i=0;$i -lt $roles.Count;$i++){$labels+=("{0:D2} {1}" -f $i,$roles[$i])}
$sheet=Join-Path $public 'heavy-active-numbered-contact-sheet.png';[LamuhDashBlockFrameTools]::MakeContactSheet($active,$labels,$sheet,4)
Copy-Item -LiteralPath $sheet -Destination $review
[IO.File]::WriteAllText((Join-Path $review 'heavy-v2.normalization.report.json'),($report | ConvertTo-Json -Depth 20),[Text.UTF8Encoding]::new($false))
Write-Output 'Normalized separate Heavy windup/release/landing sources; L/M untouched.'
