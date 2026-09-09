param([string]$RepoRoot=(Resolve-Path (Join-Path $PSScriptRoot '../../..')).Path,
 [string]$RawSource='C:/Users/qchee/.codex/generated_images/01a03e8b-8571-7a70-9c5b-8707edfb06d7/exec-89a539e8-ab6f-48f5-94d7-2689b798559f.png')
$ErrorActionPreference='Stop'
Add-Type -AssemblyName System.Drawing
$review=Join-Path $RepoRoot 'tools/nga-forge/review/lamuh-legacy-v2-divine-vanish-v1'
$source=Join-Path $RepoRoot 'NO_GODS_ABOVE/engine_v2/content-source/characters/lamuh-legacy-v2/divine-vanish-frames-v1'
$public=Join-Path $RepoRoot 'NO_GODS_ABOVE/engine_v2/public/lamuh-legacy-v2/divine-vanish-v1'
$extract=Join-Path $review 'extracted'
New-Item -ItemType Directory -Force -Path $review,$source,$public,$extract | Out-Null
$raw=Join-Path $review 'raw-surrounding-aura-v1.png'
Copy-Item -LiteralPath $RawSource -Destination $raw
function Get-Hash([string]$p){(Get-FileHash -LiteralPath $p -Algorithm SHA256).Hash}
Add-Type -ReferencedAssemblies System.Drawing -TypeDefinition @'
using System;using System.Drawing;using System.Drawing.Imaging;using System.Drawing.Drawing2D;
public static class DivineNormalize {
 public static void Extract(string input,string output,int x,int y,int w,int h){
  using(var raw=new Bitmap(input))using(var b=raw.Clone(new Rectangle(x,y,w,h),PixelFormat.Format32bppArgb)){
   for(int py=0;py<h;py++)for(int px=0;px<w;px++){
    var c=b.GetPixel(px,py); int peak=Math.Max(c.R,c.B);
    // Only saturated green is the supplied matte. White cloth and violet aura
    // never satisfy this test; no neutral-white or purple key is used.
    if(c.G>70 && peak<65 && c.G>peak*3.5){b.SetPixel(px,py,Color.Transparent);continue;}
    if(c.G>peak+8){
     double spill=c.G-peak, a=Math.Max(0,1-spill/220.0);
     if(a<.06){b.SetPixel(px,py,Color.Transparent);continue;}
     int r=(int)Math.Round(c.R/a),g=(int)Math.Round((c.G-220*(1-a))/a),bl=(int)Math.Round(c.B/a);
     g=Math.Min(g,Math.Max(r,bl));
     b.SetPixel(px,py,Color.FromArgb((int)Math.Round(255*a),Math.Max(0,Math.Min(255,r)),Math.Max(0,Math.Min(255,g)),Math.Max(0,Math.Min(255,bl))));
    }
   }
   b.Save(output,ImageFormat.Png);
  }
 }
 public static void Normalize(string input,string output,double rx,double ry,double scale){
  using(var raw=new Bitmap(input))using(var b=new Bitmap(2048,1536,PixelFormat.Format32bppArgb)){
   using(var g=Graphics.FromImage(b)){
    g.Clear(Color.Transparent);g.CompositingMode=CompositingMode.SourceCopy;g.InterpolationMode=InterpolationMode.HighQualityBicubic;g.PixelOffsetMode=PixelOffsetMode.HighQuality;
    g.DrawImage(raw,(float)(768-rx*scale),(float)(1360-ry*scale),(float)(raw.Width*scale),(float)(raw.Height*scale));
   }
   // Bicubic reconstruction can reintroduce a handful of saturated green edge
   // pixels. Despill only that green dominance, preserving alpha and purple.
   var d=b.LockBits(new Rectangle(0,0,b.Width,b.Height),ImageLockMode.ReadWrite,PixelFormat.Format32bppArgb);
   byte[] bytes=new byte[d.Stride*b.Height];System.Runtime.InteropServices.Marshal.Copy(d.Scan0,bytes,0,bytes.Length);
   for(int y=0;y<b.Height;y++)for(int x=0;x<b.Width;x++){
    int o=y*d.Stride+x*4;int r=bytes[o+2],g=bytes[o+1],bl=bytes[o];
    if(g>100&&g>r*1.4&&g>bl*1.4)bytes[o+1]=(byte)Math.Max(r,bl);
   }
   System.Runtime.InteropServices.Marshal.Copy(bytes,0,d.Scan0,bytes.Length);b.UnlockBits(d);
   b.Save(output,ImageFormat.Png);
  }
 }
 public static double[] Measure(string path){
  using(var b=new Bitmap(path)){
   int minx=b.Width,miny=b.Height,maxx=-1,maxy=-1;long n=0,sx=0,sy=0,green=0,white=0,purple=0,transparent=0;
   var d=b.LockBits(new Rectangle(0,0,b.Width,b.Height),ImageLockMode.ReadOnly,PixelFormat.Format32bppArgb);
   byte[] bytes=new byte[d.Stride*b.Height];System.Runtime.InteropServices.Marshal.Copy(d.Scan0,bytes,0,bytes.Length);b.UnlockBits(d);
   for(int y=0;y<b.Height;y++)for(int x=0;x<b.Width;x++){
    int o=y*d.Stride+x*4;int a=bytes[o+3],r=bytes[o+2],g=bytes[o+1],bl=bytes[o];
    if(a==0)transparent++;if(a<=12)continue;n++;sx+=x;sy+=y;minx=Math.Min(minx,x);miny=Math.Min(miny,y);maxx=Math.Max(maxx,x);maxy=Math.Max(maxy,y);
    if(g>100&&g>r*1.4&&g>bl*1.4)green++;
    if(a>230&&r>190&&g>190&&bl>190)white++;
    if(a>100&&r>50&&bl>70&&bl>g*1.15&&r>g*1.1)purple++;
   }
   return new double[]{minx,miny,maxx,maxy,n,n>0?(double)sx/n:0,n>0?(double)sy/n:0,green,white,purple,transparent};
  }
 }
 public static void Contact(string[] paths,string[] labels,string output){
  using(var b=new Bitmap(1536,850,PixelFormat.Format32bppArgb))using(var g=Graphics.FromImage(b))using(var font=new Font("Arial",15)){
   g.Clear(Color.FromArgb(18,23,32));g.InterpolationMode=InterpolationMode.HighQualityBicubic;
   for(int i=0;i<paths.Length;i++)using(var frame=new Bitmap(paths[i])){
    int x=(i%3)*512,y=(i/3)*425;g.DrawImage(frame,new Rectangle(x,y+25,512,384));g.DrawString(labels[i],font,Brushes.White,x+12,y+4);
    g.DrawLine(Pens.DimGray,x,y+365,x+512,y+365);
   }
   b.Save(output,ImageFormat.Png);
  }
 }
 public static void Legacy(string input,string output,int index){
  using(var b=new Bitmap(input))using(var cell=b.Clone(new Rectangle(index*448,3*448,448,448),PixelFormat.Format32bppArgb))cell.Save(output,ImageFormat.Png);
 }
}
'@
$rawBitmap=[Drawing.Bitmap]::new($raw)
try {if($rawBitmap.Width-ne1536-or$rawBitmap.Height-ne1024){throw 'Unexpected raw camera dimensions'}}finally{$rawBitmap.Dispose()}
# Top-middle aura continues past nominal x1024 to1075. Audited gutter x1080
# preserves those wisps and precedes top-right aura x1090. Bottom cuts are separate.
$cuts=@(@(0,0,512,500),@(512,0,568,500),@(1080,0,456,500),@(0,500,520,524),@(520,500,504,524),@(1024,500,512,524))
# Source-sheet pelvis X and actual sandal baseline Y; rigid registration only.
# World retreat is simulation-owned, never baked into frame root offsets.
$registrations=@(@(298,477),@(795,466),@(1248,472),@(300,921),@(766,931),@(1247,931))
$roles=@('aura load','backward push','surrounding phase retreat','ground catch','aura dissipating settle','clear standing return')
$scale=2.05;$frames=@();$paths=@();$labels=@()
for($i=0;$i-lt6;$i++){
 $c=$cuts[$i];$name=('pose-{0:D2}.png'-f$i);$cut=Join-Path $extract $name;$file=Join-Path $source $name
 [DivineNormalize]::Extract($raw,$cut,$c[0],$c[1],$c[2],$c[3])
 $rx=$registrations[$i][0]-$c[0];$ry=$registrations[$i][1]-$c[1]
 [DivineNormalize]::Normalize($cut,$file,$rx,$ry,$scale)
 $m=[DivineNormalize]::Measure($file);$cm=[DivineNormalize]::Measure($cut)
 $edge=$m[0]-le0-or$m[1]-le0-or$m[2]-ge2047-or$m[3]-ge1535
 $cutEdge=$cm[0]-le0-or$cm[1]-le0-or$cm[2]-ge($c[2]-1)-or$cm[3]-ge($c[3]-1)
 if($edge-or$cutEdge-or$m[4]-lt1000-or$m[7]-gt0){throw "Unsafe normalized pose${i}: $($m -join ',') cutedge=$cutEdge"}
 Copy-Item -LiteralPath $file -Destination (Join-Path $public $name)
 $frames+=@{index=$i;role=$roles[$i];publicPath="/lamuh-legacy-v2/divine-vanish-v1/$name";sourcePath="NO_GODS_ABOVE/engine_v2/content-source/characters/lamuh-legacy-v2/divine-vanish-frames-v1/$name";sha256=(Get-Hash $file);sourceSha256=(Get-Hash $cut);root=@{x=768;y=1360};sourceRegistration=@{x=$rx;y=$ry};sourceScale=$scale;sourceCrop=@{x=$c[0];y=$c[1];width=$c[2];height=$c[3]};bodyCenter=@{x=$m[5];y=$m[6]};visibleBounds=@{minX=$m[0];minY=$m[1];maxX=$m[2];maxY=$m[3]};edgeContact=$edge;sourceCutEdgeContact=$cutEdge;greenRemaining=$m[7];opaqueWhitePixels=$m[8];purpleAuraPixels=$m[9];transparentPixels=$m[10];auraBaked=($i-lt5)}
 $paths+=$file;$labels+=("{0:D2} {1}"-f$i,$roles[$i])
}
$sheetName='divine-vanish-numbered-contact-sheet.png';$sheet=Join-Path $public $sheetName
[DivineNormalize]::Contact($paths,$labels,$sheet);Copy-Item -LiteralPath $sheet -Destination $review
$v1Frames=@();$legacy=Join-Path $RepoRoot 'NO_GODS_ABOVE/engine_v2/public/lamuh-legacy-v2/atlases/lamuh_sheet_5_specials_atlas.png'
for($i=0;$i-lt6;$i++){
 $p=Join-Path $extract ('protected-v1-{0:D2}.png'-f$i);[DivineNormalize]::Legacy($legacy,$p,$i);$m=[DivineNormalize]::Measure($p)
 $v1Frames+=@{index=$i;visibleBounds=@{minX=$m[0];minY=$m[1];maxX=$m[2];maxY=$m[3]};bodyCenter=@{x=$m[5];y=$m[6]};sha256=(Get-Hash $p)}
}
$report=@{schemaVersion='1.0.0';candidateOnly=$true;deployable=$false;sourceArtStatus='candidate_ready_for_human_review';canvas=@{width=2048;height=1536};root=@{x=768;y=1360};scale=$scale;perFrameRescale=$false;registration='manual_pelvis_x_and_sandal_baseline_y_rigid_camera_registration_not_verified_foot_plant';bodySourceSha256=(Get-Hash $raw);rawSourcePath='tools/nga-forge/review/lamuh-legacy-v2-divine-vanish-v1/raw-surrounding-aura-v1.png';sourceProvenance=@{generatedImagePath=$RawSource;rawSha256=(Get-Hash $raw);width=1536;height=1024;format='RGB';operation='green_matte_unmix_rigid_registration_uniform_camera_scale'};frames=$frames;v1Frames=$v1Frames;contactSheetPublicPath="/lamuh-legacy-v2/divine-vanish-v1/$sheetName";alphaPolicy='green_only_unmix_no_neutral_white_or_purple_key_no_component_deletion';bodyScaleBoundary='one2.05camera_scale_for_all_six; no_per_pose_height_scale; anatomical_and_motion_human_review_pending';visualApproval=$false;hitCountContract=@{visibleImpacts=0;gameplayHits=0};notes=@('Legacy row3sixposes preserved as comparison only','All authored aura stays inside PNGs; no runtime effect overlay implied','Whole-body transition and directional intent require 1x and0.5x human review')}
$report.rawSources=@(@{file='raw-surrounding-aura-v1.png';sha256=(Get-Hash $raw)})
[IO.File]::WriteAllText((Join-Path $review 'normalization.report.json'),($report|ConvertTo-Json -Depth 24),[Text.UTF8Encoding]::new($false))
Write-Output ($frames|ForEach-Object{"Pose$($_.index) green=$($_.greenRemaining) white=$($_.opaqueWhitePixels) aura=$($_.purpleAuraPixels) edge=$($_.edgeContact)"})
Write-Output "Report: $(Join-Path $review 'normalization.report.json')"
