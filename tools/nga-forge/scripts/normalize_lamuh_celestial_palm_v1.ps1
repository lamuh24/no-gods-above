param([string]$RepoRoot = (Resolve-Path (Join-Path $PSScriptRoot '../../..')).Path)
$ErrorActionPreference='Stop'
. (Join-Path $PSScriptRoot 'normalize_lamuh_dash_block_modernization_v1.ps1') -RepoRoot $RepoRoot -LibraryOnly
$review=Join-Path $RepoRoot 'tools/nga-forge/review/lamuh-legacy-v2-celestial-palm-v1'
$sourceRoot=Join-Path $RepoRoot 'NO_GODS_ABOVE/engine_v2/content-source/characters/lamuh-legacy-v2'
$public=Join-Path $RepoRoot 'NO_GODS_ABOVE/engine_v2/public/lamuh-legacy-v2/celestial-palm-v1'
$utf8=[System.Text.UTF8Encoding]::new($false)
# This source's pale checkerboard is much lighter than the older dash sheet.
# A broad neutral-color key eats white sleeves. Use a local, edge-connected tight key.
Add-Type -ReferencedAssemblies System.Drawing -TypeDefinition @'
using System; using System.Drawing; using System.Drawing.Imaging; using System.Collections.Generic;
public static class PalmCandidateCutout {
 public static void Extract(string file,string output,int startX,int endX){
  using(var src=new Bitmap(file))using(var b=new Bitmap(endX-startX,src.Height,PixelFormat.Format32bppArgb)){
   int w=b.Width,h=b.Height;var bg=new bool[w*h];var q=new Queue<int>();
   for(int y=0;y<h;y++)for(int x=0;x<w;x++)b.SetPixel(x,y,src.GetPixel(startX+x,y));
   Action<int,int> add=(x,y)=>{int n=y*w+x;if(bg[n])return;var c=b.GetPixel(x,y);int lo=Math.Min(c.R,Math.Min(c.G,c.B)),hi=Math.Max(c.R,Math.Max(c.G,c.B));if(c.A<12||(lo>=218&&hi-lo<=12)){bg[n]=true;q.Enqueue(n);}};
   for(int x=0;x<w;x++){add(x,0);add(x,h-1);}for(int y=0;y<h;y++){add(0,y);add(w-1,y);}
   while(q.Count>0){int n=q.Dequeue(),x=n%w,y=n/w;if(x>0)add(x-1,y);if(x<w-1)add(x+1,y);if(y>0)add(x,y-1);if(y<h-1)add(x,y+1);}
   for(int y=0;y<h;y++)for(int x=0;x<w;x++)if(bg[y*w+x])b.SetPixel(x,y,Color.Transparent);
   // Unmix pale checkerboard only at the exposed one-pixel matte. Never key interior white sleeves.
   using(var snapshot=(Bitmap)b.Clone())for(int y=1;y<h-1;y++)for(int x=1;x<w-1;x++){
    var c=snapshot.GetPixel(x,y);if(c.A==0)continue;int hi=Math.Max(c.R,Math.Max(c.G,c.B)),lo=Math.Min(c.R,Math.Min(c.G,c.B));if(lo<130||hi-lo>28)continue;
    bool edge=false;for(int dy=-1;dy<=1;dy++)for(int dx=-1;dx<=1;dx++)if(snapshot.GetPixel(x+dx,y+dy).A==0)edge=true;if(!edge)continue;
    Color inside=c;int best=lo;for(int dy=-2;dy<=2;dy++)for(int dx=-2;dx<=2;dx++){int nx=x+dx,ny=y+dy;if(nx<0||ny<0||nx>=w||ny>=h)continue;var n=snapshot.GetPixel(nx,ny);int l=(n.R+n.G+n.B)/3;if(n.A>240&&l<best){best=l;inside=n;}}
    if(best>96||lo-best<40)continue;int alpha=(int)Math.Round(255.0*(255-(c.R+c.G+c.B)/3.0)/(255-best));alpha=Math.Max(1,Math.Min(255,alpha));b.SetPixel(x,y,Color.FromArgb(alpha,inside.R,inside.G,inside.B));
   }
   b.Save(output,ImageFormat.Png);
  }
 }
}
'@
$all=@{}
foreach($family in @('palm','heavy')) {
  $raw=Join-Path $review "raw/$family.png"
  if(!(Test-Path -LiteralPath $raw)){continue}
  $extracted=Join-Path $review "extracted/$family"
  $normalized=Join-Path $sourceRoot "celestial-palm-frames-v1/$family"
  $output=Join-Path $public $family
  New-Item -ItemType Directory -Force -Path $extracted,$normalized,$output | Out-Null
  $sheet=[System.Drawing.Bitmap]::FromFile($raw)
  try {
    for($row=0;$row -lt 2;$row++){
      $top=[int][math]::Round($row*$sheet.Height/2)
      $bottom=[int][math]::Round(($row+1)*$sheet.Height/2)
      $strip=$sheet.Clone([System.Drawing.Rectangle]::new(0,$top,$sheet.Width,$bottom-$top),[System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
      $rowPath=Join-Path $extracted "row-$row.png"
      try{$strip.Save($rowPath,[System.Drawing.Imaging.ImageFormat]::Png)}finally{$strip.Dispose()}
      for($col=0;$col -lt 4;$col++){
        $i=$row*4+$col
        # Generated grid is a layout, not a runtime contract. Heavy's wide release
        # crosses the nominal 1152px divider; explicit audited cuts keep its foot.
        $cuts=if($family -eq 'heavy' -and $row -eq 0){@(0,384,768,1080,1536)}elseif($family -eq 'heavy'){@(0,410,768,1152,1536)}elseif($row -eq 0){@(0,384,768,1115,1536)}else{@(0,410,760,1100,1536)}
        [PalmCandidateCutout]::Extract($rowPath,(Join-Path $extracted "$i.png"),$cuts[$col],$cuts[$col+1])
      }
    }
  }finally{$sheet.Dispose()}
  $standing=[LamuhDashBlockFrameTools]::AlphaBounds((Join-Path $extracted '0.png'))
  $scale=[math]::Round(800.0/$standing.Height,8)
  $records=@();$paths=@();$labels=@()
  for($i=0;$i -lt 8;$i++){
    $inputPath=Join-Path $extracted "$i.png"
    $bounds=[LamuhDashBlockFrameTools]::AlphaBounds($inputPath)
    # Track the screen-left support sandal, not hair/coat/VFX bounds. The front sandal may widen the stance.
    $bitmap=[System.Drawing.Bitmap]::FromFile($inputPath)
    try{
      $footXs=@()
      for($x=0;$x -lt $bitmap.Width;$x++){
        $occupied=$false
        for($y=([int]$bounds.MaxY-9);$y -le $bounds.MaxY;$y++){if($bitmap.GetPixel($x,$y).A -gt 80){$occupied=$true;break}}
        if($occupied){$footXs+=$x}
      }
      $first=$footXs[0];$last=$first
      foreach($x in $footXs){if($x-$last -gt 3){break};$last=$x}
      $supportX=($first+$last)/2.0
    }finally{$bitmap.Dispose()}
    $sourceRootX=$supportX+104.0/$scale
    $outPath=Join-Path $normalized ("$family-{0:D2}.png" -f $i)
    $m=[LamuhDashBlockFrameTools]::NormalizeFramePreserveDetails($inputPath,$outPath,$sourceRootX,$bounds.MaxY,768,1360,2048,1536,$scale,$false)
    if($m.TouchesEdge -or $m.VisiblePixels -lt 1000 -or $m.MeaningfulMagentaPixelsRemaining -gt 0){throw "Invalid $family frame $i"}
    Copy-Item -LiteralPath $outPath -Destination (Join-Path $output ([IO.Path]::GetFileName($outPath)))
    $records += [ordered]@{index=$i;publicPath=("/lamuh-legacy-v2/celestial-palm-v1/$family/$family-{0:D2}.png" -f $i);sha256=(Get-Sha256 $outPath);sourceSha256=(Get-Sha256 $inputPath);root=@{x=768;y=1360};supportFoot=@{x=664;y=1360};sourceSupportFoot=@{x=$supportX;y=$bounds.MaxY};visibleBounds=@{minX=$m.MinX;minY=$m.MinY;maxX=$m.MaxX;maxY=$m.MaxY};bodyCenter=@{x=$m.CentroidX;y=$m.CentroidY};contact=$false;visibleImpact=$false}
    $paths+=$outPath;$labels+=("{0:D2} $family" -f $i)
  }
  $sheetPath=Join-Path $review "$family-numbered-contact-sheet.png"
  [LamuhDashBlockFrameTools]::MakeContactSheet($paths,$labels,$sheetPath,4)
  Copy-Item -LiteralPath $sheetPath -Destination (Join-Path $public ([IO.Path]::GetFileName($sheetPath)))
  $all[$family]=@{scale=$scale;sourceSha256=(Get-Sha256 $raw);frames=$records;contactSheetPublicPath="/lamuh-legacy-v2/celestial-palm-v1/$family-numbered-contact-sheet.png"}
}
$v1=@();$v1Dir=Join-Path $review 'protected-v1-derived'
New-Item -ItemType Directory -Force $v1Dir | Out-Null
$atlas=[System.Drawing.Bitmap]::FromFile((Join-Path $RepoRoot 'NO_GODS_ABOVE/engine_v2/public/lamuh-legacy-v2/atlases/lamuh_sheet_5_specials_atlas.png'))
try{for($i=0;$i -lt 6;$i++){
  $frame=$atlas.Clone([System.Drawing.Rectangle]::new($i*448,0,448,448),[System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
  $path=Join-Path $v1Dir "$i.png"
  try{$frame.Save($path,[System.Drawing.Imaging.ImageFormat]::Png)}finally{$frame.Dispose()}
  $b=[LamuhDashBlockFrameTools]::AlphaBounds($path)
  $v1+=@{sha256=(Get-Sha256 $path);visibleBounds=@{minX=$b.MinX;minY=$b.MinY;maxX=$b.MaxX;maxY=$b.MaxY};bodyCenter=@{x=($b.MinX+$b.MaxX)/2;y=($b.MinY+$b.MaxY)/2};centerEvidence='visible bounds midpoint, not anatomical center'}
}}finally{$atlas.Dispose()}
$report=@{schemaVersion='1.0.0';candidateOnly=$true;deployable=$false;canvas=@{width=2048;height=1536};root=@{x=768;y=1360};registration='measured_screen_left_support_sandal_bottom_band; front sandal widens stance';perFrameRescale=$false;families=$all;v1Frames=$v1}
[IO.File]::WriteAllText((Join-Path $review 'normalization.report.json'),($report | ConvertTo-Json -Depth 20),$utf8)
Write-Output ($all.Keys -join ', ')
