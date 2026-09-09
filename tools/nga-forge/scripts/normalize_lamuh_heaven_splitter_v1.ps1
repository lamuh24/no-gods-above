param([string]$RepoRoot=(Resolve-Path (Join-Path $PSScriptRoot '../../..')).Path,[switch]$LibraryOnly)
$ErrorActionPreference='Stop'
. (Join-Path $PSScriptRoot 'normalize_lamuh_dash_block_modernization_v1.ps1') -RepoRoot $RepoRoot -LibraryOnly
$review=Join-Path $RepoRoot 'tools/nga-forge/review/lamuh-legacy-v2-heaven-splitter-v1'
$base=Join-Path $RepoRoot 'NO_GODS_ABOVE/engine_v2/content-source/characters/lamuh-legacy-v2'
$public=Join-Path $RepoRoot 'NO_GODS_ABOVE/engine_v2/public/lamuh-legacy-v2/heaven-splitter-v1'
$frames=Join-Path $base 'heaven-splitter-frames-v1'
$extracted=Join-Path $review 'extracted'
New-Item -ItemType Directory -Force -Path $public,$frames,$extracted | Out-Null
Add-Type -ReferencedAssemblies System.Drawing -TypeDefinition @'
using System; using System.Drawing; using System.Drawing.Imaging; using System.Collections.Generic;
public static class HeavenCutout {
 public static void Extract(string file,string output,int index){
  ExtractRect(file,output,(index%4)*362,(index/4)*362,362,362);
 }
 public static void ExtractRect(string file,string output,int left,int top,int width,int height){
  using(var src=new Bitmap(file))using(var b=src.Clone(new Rectangle(left,top,width,height),PixelFormat.Format32bppArgb)){
   int w=b.Width,h=b.Height;var bg=new bool[w*h];var q=new Queue<int>();
   Action<int,int> add=(x,y)=>{int n=y*w+x;if(bg[n])return;var c=b.GetPixel(x,y);int lo=Math.Min(c.R,Math.Min(c.G,c.B)),hi=Math.Max(c.R,Math.Max(c.G,c.B));if(c.A<12||(lo>=218&&hi-lo<=12)){bg[n]=true;q.Enqueue(n);}};
   for(int x=0;x<w;x++){add(x,0);add(x,h-1);}for(int y=0;y<h;y++){add(0,y);add(w-1,y);}
   while(q.Count>0){int n=q.Dequeue(),x=n%w,y=n/w;if(x>0)add(x-1,y);if(x<w-1)add(x+1,y);if(y>0)add(x,y-1);if(y<h-1)add(x,y+1);}
   for(int y=0;y<h;y++)for(int x=0;x<w;x++)if(bg[y*w+x])b.SetPixel(x,y,Color.Transparent);
   using(var s=(Bitmap)b.Clone())for(int y=1;y<h-1;y++)for(int x=1;x<w-1;x++){
    var c=s.GetPixel(x,y);if(c.A==0)continue;int lo=Math.Min(c.R,Math.Min(c.G,c.B)),hi=Math.Max(c.R,Math.Max(c.G,c.B));if(lo<130||hi-lo>28)continue;
    bool edge=false;for(int dy=-1;dy<=1;dy++)for(int dx=-1;dx<=1;dx++)if(s.GetPixel(x+dx,y+dy).A==0)edge=true;if(!edge)continue;
    Color inside=c;int best=lo;for(int dy=-2;dy<=2;dy++)for(int dx=-2;dx<=2;dx++){int nx=x+dx,ny=y+dy;if(nx<0||ny<0||nx>=w||ny>=h)continue;var n=s.GetPixel(nx,ny);int l=(n.R+n.G+n.B)/3;if(n.A>240&&l<best){best=l;inside=n;}}
    if(best>96||lo-best<40)continue;int alpha=(int)Math.Round(255.0*(255-(c.R+c.G+c.B)/3.0)/(255-best));b.SetPixel(x,y,Color.FromArgb(Math.Max(1,Math.Min(255,alpha)),inside.R,inside.G,inside.B));
   }
   b.Save(output,ImageFormat.Png);
  }
 }
}
'@
if($LibraryOnly){return}
$raw=Join-Path $review 'raw/heaven.png'
for($i=0;$i -lt 12;$i++){[HeavenCutout]::Extract($raw,(Join-Path $extracted "$i.png"),$i)}
$bounds0=[LamuhDashBlockFrameTools]::AlphaBounds((Join-Path $extracted '0.png'))
$scale=[math]::Round(800.0/$bounds0.Height,8)
# Hand-audited waist/pelvis landmarks. Air poses share a virtual ground reference;
# knee gathering must not be undone by bottom-aligning every airborne sandal.
$pelvis=@(@(192,211),@(162,247),@(134,219),@(128,204),@(197,192),@(168,186),@(133,219),@(100,212),@(187,141),@(158,185),@(131,151),@(111,150))
$virtualLegLength=148 # Longest visible unbent leg in this sheet; no airborne sole below virtual ground.
$roles=@('generated guard reference','low loaded near-arm coil','knee gather with near fist chambered','single near-arm uppercut extension','same fist rising carry','same fist apex carry','elbow release and gather','guarded tucked descent','legs unfold for landing','soft two-foot catch','guard recovery','generated guard reference')
$records=@();$paths=@();$labels=@()
for($i=0;$i -lt 12;$i++){
 $inputPath=Join-Path $extracted "$i.png";$b=[LamuhDashBlockFrameTools]::AlphaBounds($inputPath)
 $airPose=$i -ge 3 -and $i -le 8
 $rootX=$pelvis[$i][0];$rootY=if($airPose){$pelvis[$i][1]+$virtualLegLength}else{$b.MaxY}
 $file=Join-Path $frames ("heaven-{0:D2}.png" -f $i)
 $m=[LamuhDashBlockFrameTools]::NormalizeFramePreserveDetails($inputPath,$file,$rootX,$rootY,768,1360,2048,1536,$scale,$false)
 if($m.TouchesEdge -or $m.VisiblePixels -lt 1000 -or $m.MeaningfulMagentaPixelsRemaining -gt 0){throw "Invalid Heaven frame $i"}
 Copy-Item -LiteralPath $file -Destination (Join-Path $public ([IO.Path]::GetFileName($file)))
 $records+=@{index=$i;role=$roles[$i];publicPath=("/lamuh-legacy-v2/heaven-splitter-v1/heaven-{0:D2}.png" -f $i);sha256=(Get-Sha256 $file);sourceSha256=(Get-Sha256 $inputPath);root=@{x=768;y=1360};sourcePelvis=@{x=$pelvis[$i][0];y=$pelvis[$i][1]};sourceRegistration=@{x=$rootX;y=$rootY};registration=if($airPose){'pelvis_to_virtual_ground'}else{'pelvis_x_grounded_sandal_y'};visibleBounds=@{minX=$m.MinX;minY=$m.MinY;maxX=$m.MaxX;maxY=$m.MaxY};bodyCenter=@{x=$m.CentroidX;y=$m.CentroidY};contact=($i -eq 3);visibleImpact=($i -eq 3)}
 $paths+=$file;$labels+=("{0:D2} {1}" -f $i,$roles[$i])
}
$sheetPath=Join-Path $review 'heaven-numbered-contact-sheet.png'
[LamuhDashBlockFrameTools]::MakeContactSheet($paths,$labels,$sheetPath,4)
Copy-Item -LiteralPath $sheetPath -Destination $public
$v1=@();$v1Dir=Join-Path $review 'protected-v1-derived';New-Item -ItemType Directory -Force -Path $v1Dir | Out-Null
$atlas=[Drawing.Bitmap]::FromFile((Join-Path $RepoRoot 'NO_GODS_ABOVE/engine_v2/public/lamuh-legacy-v2/atlases/lamuh_sheet_5_specials_atlas.png'))
try{for($i=0;$i -lt 7;$i++){$frame=$atlas.Clone([Drawing.Rectangle]::new($i*448,896,448,448),[Drawing.Imaging.PixelFormat]::Format32bppArgb);$file=Join-Path $v1Dir "$i.png";try{$frame.Save($file,[Drawing.Imaging.ImageFormat]::Png)}finally{$frame.Dispose()};$b=[LamuhDashBlockFrameTools]::AlphaBounds($file);$v1+=@{sha256=(Get-Sha256 $file);visibleBounds=@{minX=$b.MinX;minY=$b.MinY;maxX=$b.MaxX;maxY=$b.MaxY};bodyCenter=@{x=($b.MinX+$b.MaxX)/2;y=($b.MinY+$b.MaxY)/2};centerEvidence='visible bounds midpoint, not anatomical center'}}}finally{$atlas.Dispose()}
$report=@{schemaVersion='1.0.0';candidateOnly=$true;deployable=$false;canvas=@{width=2048;height=1536};root=@{x=768;y=1360};scale=$scale;perFrameRescale=$false;sourceSha256=(Get-Sha256 $raw);frames=$records;v1Frames=$v1;contactSheetPublicPath='/lamuh-legacy-v2/heaven-splitter-v1/heaven-numbered-contact-sheet.png';registration='manually audited pelvis x; standing sandal baseline and pelvis-relative virtual ground for airborne poses';motionDisposition='MODERNIZE: legacy rising arc preserved; V2 near-arm uppercut is explicit rather than claiming exact legacy far-arm reuse'}
[IO.File]::WriteAllText((Join-Path $review 'normalization.report.json'),($report | ConvertTo-Json -Depth 20),[Text.UTF8Encoding]::new($false))
Write-Output 'Normalized 12 Heaven source candidates with one scale and explicit grounded/airborne registration.'
