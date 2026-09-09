param([string]$RepoRoot=(Resolve-Path (Join-Path $PSScriptRoot '../../..')).Path)
$ErrorActionPreference='Stop'
. (Join-Path $PSScriptRoot 'normalize_lamuh_dash_block_modernization_v1.ps1') -RepoRoot $RepoRoot -LibraryOnly
$review=Join-Path $RepoRoot 'tools/nga-forge/review/lamuh-legacy-v2-heaven-heavy-aura-redraw-v4'
$oldReview=Join-Path $RepoRoot 'tools/nga-forge/review/lamuh-legacy-v2-heaven-splitter-v1'
$base=Join-Path $RepoRoot 'NO_GODS_ABOVE/engine_v2/content-source/characters/lamuh-legacy-v2'
$public=Join-Path $RepoRoot 'NO_GODS_ABOVE/engine_v2/public/lamuh-legacy-v2/heaven-heavy-aura-redraw-v4'
$source=Join-Path $base 'heaven-heavy-aura-redraw-frames-v4'
$extract=Join-Path $review 'extracted'
New-Item -ItemType Directory -Force -Path $public,$source,$extract | Out-Null
Add-Type -ReferencedAssemblies System.Drawing -TypeDefinition @'
using System; using System.Drawing; using System.Drawing.Imaging;
public static class HeavyAuraMagenta {
 public static void Extract(string input,string output,int x,int y,int w,int h){
  using(var raw=new Bitmap(input))using(var b=raw.Clone(new Rectangle(x,y,w,h),PixelFormat.Format32bppArgb)){
   for(int py=0;py<h;py++)for(int px=0;px<w;px++){
    var c=b.GetPixel(px,py);
    // Generated matte is near-magenta, not mathematically uniform255/0/255.
    // This low-green chroma cannot be part of Lamuh's cyan/gold/white palette.
    if(c.R>120&&c.B>120&&c.G<40){b.SetPixel(px,py,Color.Transparent);continue;}
    double spill=Math.Max(0,Math.Min(c.R,c.B)-c.G),a=1-spill/255.0;
    if(a<.07){b.SetPixel(px,py,Color.Transparent);continue;}
    if(spill>3){
     int r=(int)Math.Round((c.R-255*(1-a))/a),g=(int)Math.Round(c.G/a),bl=(int)Math.Round((c.B-255*(1-a))/a);
     b.SetPixel(px,py,Color.FromArgb((int)Math.Round(255*a),Math.Max(0,Math.Min(255,r)),Math.Max(0,Math.Min(255,g)),Math.Max(0,Math.Min(255,bl))));
    }
   }
   b.Save(output,ImageFormat.Png);
  }
 }
}
'@
$old=Get-Content -Raw -LiteralPath (Join-Path $oldReview 'heavy-v2.normalization.report.json') | ConvertFrom-Json
$raw=Join-Path $review 'raw-aura-magenta.png'
$cuts=@(0,490,890,1448);$oldCuts=@(0,483,932,1448)
$frames=@();$paths=@();$labels=@()
for($i=0;$i -lt 6;$i++){
 $ref=$old.families.release.frames[$i]
 $cut=Join-Path $extract ("release-{0:D2}.png" -f $i)
 # Lower-row aura crosses the nominal543 line. Actual clear gutter is y500;
 # registration compensates the43px crop-origin shift without moving the body.
 $top=if($i -lt 3){0}else{500};$height=if($i -lt 3){500}else{586}
 $rootY=$ref.sourceRegistration.y+$(if($i -lt 3){0}else{43})
 $rootX=$ref.sourceRegistration.x+$oldCuts[$i%3]-$cuts[$i%3]
 [HeavyAuraMagenta]::Extract($raw,$cut,$cuts[$i%3],$top,$cuts[($i%3)+1]-$cuts[$i%3],$height)
 $file=Join-Path $source ("release-{0:D2}.png" -f $i)
 # Exact previous source-camera calibration and anatomical registration. Aura
 # extent never determines fighter scale or grounded sandal/virtual-ground root.
 $m=[LamuhDashBlockFrameTools]::NormalizeFramePreserveDetails($cut,$file,$rootX,$rootY,768,1360,2048,1536,2.490272376,$false)
 if($m.TouchesEdge -or $m.VisiblePixels -lt 1000 -or $m.MeaningfulMagentaPixelsRemaining -gt 0){throw "Invalid aura redraw source$i $($m | ConvertTo-Json -Compress)"}
 Copy-Item -LiteralPath $file -Destination (Join-Path $public ([IO.Path]::GetFileName($file)))
 $frames+=@{index=$i;publicPath=("/lamuh-legacy-v2/heaven-heavy-aura-redraw-v4/release-{0:D2}.png" -f $i);sha256=(Get-Sha256 $file);sourceSha256=(Get-Sha256 $cut);root=@{x=768;y=1360};bodyOnlyPublicPath=$ref.publicPath;bodyOnlySha256=$ref.sha256;bodyOnlyComparison='previous clean pose, not a pixel-identical VFX extraction';bodyVisibleBounds=$ref.visibleBounds;bodyCenter=$ref.bodyCenter;sourceRegistration=$ref.sourceRegistration;sourceScale=2.490272376;auraBaked=$true;artRedrawn=$true;visibleBounds=@{minX=$m.MinX;minY=$m.MinY;maxX=$m.MaxX;maxY=$m.MaxY};magentaRemaining=$m.MeaningfulMagentaPixelsRemaining;edgeContact=$m.TouchesEdge}
 $paths+=$file;$labels+=("{0:D2} redrawn surrounding aura" -f $i)
 $frames[-1].sourceRegistration=@{x=$rootX;y=$rootY}
 $frames[-1].sourceCrop=@{x=$cuts[$i%3];y=$top;width=$cuts[($i%3)+1]-$cuts[$i%3];height=$height}
}
$sheet=Join-Path $public 'redrawn-aura-release-contact-sheet.png'
[LamuhDashBlockFrameTools]::MakeContactSheet($paths,$labels,$sheet,3)
Copy-Item -LiteralPath $sheet -Destination $review
$idle=Join-Path $RepoRoot 'NO_GODS_ABOVE/engine_v2/public/lamuh-legacy-v2/movement-v2/idle-00.png'
$active=@($idle)
foreach($i in @(1,2)){$active+=Join-Path $base ("heaven-heavy-frames-v2/heavy-windup-{0:D2}.png" -f $i)}
$active+=$paths
foreach($i in @(8,9,10,11)){$active+=Join-Path $base ("heaven-heavy-frames-v2/heavy-windup-{0:D2}.png" -f $i)}
$active+=$idle
$roles=@('idle','weight sink','wind back','aura coil','rising connector','ONE UPPERCUT CONTACT','full extension','apex release','gather / dying wisps','landing approach','two-foot catch','settle','guard','idle')
$exp=@(2,3,4,3,2,6,7,3,5,8,4,3,2,1);$activeLabels=@();for($i=0;$i -lt 14;$i++){$activeLabels+=("{0:D2} {1} | {2} ticks" -f $i,$roles[$i],$exp[$i])}
$activeSheet=Join-Path $public 'heavy-redrawn-aura-active-contact-sheet.png'
[LamuhDashBlockFrameTools]::MakeContactSheet($active,$activeLabels,$activeSheet,4)
Copy-Item -LiteralPath $activeSheet -Destination $review
$r=@{schemaVersion='1.0.0';version=4;candidateOnly=$true;deployable=$false;artRedrawn=$true;runtimeAuraOverlay=$false;sourceScale=2.490272376;perFrameRescale=$false;canvas=@{width=2048;height=1536};root=@{x=768;y=1360};sourceSha256=(Get-Sha256 $raw);rawIllustrationSha256=(Get-Sha256 (Join-Path $review 'raw-aura-redraw.png'));promptPath='tools/nga-forge/review/lamuh-legacy-v2-heaven-heavy-aura-redraw-v4/prompt.md';mode='built_in_imagegen_identity_edit_then_matte_only_edit';userRequest='redo the spritesheet with the proper surrounding aura';frames=$frames;contactSheetPublicPath='/lamuh-legacy-v2/heaven-heavy-aura-redraw-v4/redrawn-aura-release-contact-sheet.png';comparisonBoundary='clean body fallback is prior art, not exact body layer from newly generated PNG';validation=@{magentaRemaining=0;alpha='magenta unmix, no neutral-white key';bodyScale='old fixed source-camera and pelvis/root calibration retained; human anatomy review still required'}}
[IO.File]::WriteAllText((Join-Path $review 'normalization.report.json'),($r | ConvertTo-Json -Depth 24),[Text.UTF8Encoding]::new($false))
Write-Output 'Normalized6 redrawn Heavy aura poses: true RGBA, fixed existing scale/root, no magenta or source edge contact.'
