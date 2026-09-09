param([string]$RepoRoot=(Resolve-Path (Join-Path $PSScriptRoot '../../..')).Path,[switch]$BodyOnly)
$ErrorActionPreference='Stop'
. (Join-Path $PSScriptRoot 'normalize_lamuh_dash_block_modernization_v1.ps1') -RepoRoot $RepoRoot -LibraryOnly
$review=Join-Path $RepoRoot 'tools/nga-forge/review/lamuh-legacy-v2-radiant-dive-v1'
$base=Join-Path $RepoRoot 'NO_GODS_ABOVE/engine_v2/content-source/characters/lamuh-legacy-v2'
$public=Join-Path $RepoRoot 'NO_GODS_ABOVE/engine_v2/public/lamuh-legacy-v2/radiant-dive-v1'
$source=Join-Path $base 'radiant-dive-frames-v1'
$extract=Join-Path $review 'extracted'
New-Item -ItemType Directory -Force -Path $public,$source,$extract | Out-Null
Add-Type -ReferencedAssemblies System.Drawing -TypeDefinition @'
using System;using System.Drawing;using System.Drawing.Imaging;
public static class RadiantCutout {
 public static void Normalize(string input,string output,double rx,double ry,double scale){
  using(var source=new Bitmap(input))using(var outputImage=new Bitmap(2048,1536,PixelFormat.Format32bppArgb)){
   using(var g=Graphics.FromImage(outputImage)){
    g.Clear(Color.Transparent);g.CompositingMode=System.Drawing.Drawing2D.CompositingMode.SourceCopy;
    g.InterpolationMode=System.Drawing.Drawing2D.InterpolationMode.HighQualityBicubic;
    g.PixelOffsetMode=System.Drawing.Drawing2D.PixelOffsetMode.HighQuality;
    g.DrawImage(source,(float)(768-rx*scale),(float)(1360-ry*scale),(float)(source.Width*scale),(float)(source.Height*scale));
   }
   var rect=new Rectangle(0,0,2048,1536);var data=outputImage.LockBits(rect,ImageLockMode.ReadWrite,PixelFormat.Format32bppArgb);
   byte[] bytes=new byte[data.Stride*1536];System.Runtime.InteropServices.Marshal.Copy(data.Scan0,bytes,0,bytes.Length);
   for(int y=0;y<1536;y++)for(int x=0;x<2048;x++){
    int o=y*data.Stride+x*4;
    if(bytes[o+3]<=12){bytes[o]=bytes[o+1]=bytes[o+2]=bytes[o+3]=0;continue;}
    byte b=bytes[o],g=bytes[o+1],r=bytes[o+2];
    // Remove residual magenta matte contamination only. Never key neutral white
    // fabric or the bright orange/gold skin and jewelry used by this character.
    if(r>38&&b>38&&r>g*1.10&&b>g*1.10){byte ink=(byte)Math.Min(34,Math.Round(r*.08+g*.18+b*.05));bytes[o]=bytes[o+1]=bytes[o+2]=ink;}
   }
   System.Runtime.InteropServices.Marshal.Copy(bytes,0,data.Scan0,bytes.Length);outputImage.UnlockBits(data);outputImage.Save(output,ImageFormat.Png);
  }
 }
 public static void Extract(string input,string output,int x,int y,int w,int h){
  using(var raw=new Bitmap(input))using(var b=raw.Clone(new Rectangle(x,y,w,h),PixelFormat.Format32bppArgb)){
   for(int py=0;py<h;py++)for(int px=0;px<w;px++){
    var c=b.GetPixel(px,py);
    if(c.R>120&&c.B>120&&c.G<40){b.SetPixel(px,py,Color.Transparent);continue;}
    double spill=Math.Max(0,Math.Min(c.R,c.B)-c.G),a=1-spill/255.0;
    if(a<.07){b.SetPixel(px,py,Color.Transparent);continue;}
    if(spill>3){int r=(int)Math.Round((c.R-255*(1-a))/a),g=(int)Math.Round(c.G/a),bl=(int)Math.Round((c.B-255*(1-a))/a);
     b.SetPixel(px,py,Color.FromArgb((int)Math.Round(255*a),Math.Max(0,Math.Min(255,r)),Math.Max(0,Math.Min(255,g)),Math.Max(0,Math.Min(255,bl))));}
   }
   b.Save(output,ImageFormat.Png);
  }
 }
}
'@
$cutsX=@(0,313,627,941,1254);$cutsY=@(0,430,779,1254)
# Explicit pelvis registration in source-sheet pixels; never scale from pose or aura bounds.
$pelvis=@(@(176,226),@(453,247),@(734,281),@(1091,264),@(161,589),@(430,642),@(738,645),@(1086,652),@(151,968),@(465,981),@(773,981),@(1085,1059))
$scale=2.75;$targetPelvisX=800;$targetPelvisY=930
$frames=@();$paths=@();$labels=@()
for($i=0;$i -lt $(if($BodyOnly){8}else{12});$i++){
 $row=[math]::Floor($i/4);$col=$i%4;$strength=@('light','medium','heavy')[$row]
 $raw=Join-Path $review $(if($row -eq 2){'raw-heavy-aura-v3.png'}else{'raw-family-repair-v2.png'})
 $rawImage=[Drawing.Bitmap]::new($raw)
 try{if($rawImage.Width -ne 1254 -or $rawImage.Height -ne 1254){throw 'Source-sheet camera/grid changed; re-audit before slicing'}}finally{$rawImage.Dispose()}
 $cut=Join-Path $extract ("{0}-{1:D2}.png" -f $strength,$col)
 [RadiantCutout]::Extract($raw,$cut,$cutsX[$col],$cutsY[$row],$cutsX[$col+1]-$cutsX[$col],$cutsY[$row+1]-$cutsY[$row])
 $rootX=$pelvis[$i][0]-$cutsX[$col]-($targetPelvisX-768)/$scale
 $rootY=$pelvis[$i][1]-$cutsY[$row]+(1360-$targetPelvisY)/$scale
 $file=Join-Path $source ("{0}-{1:D2}.png" -f $strength,$col)
 $frameScale=$scale
 if($i -eq 9){
  # One-cell repairs lost a leg or switched arms; this complete single-pose edit
  # derives from normalized Heavy contact. Its only resize restores4:3 resolution.
  $single=Join-Path $review 'raw-heavy-connector-single-v5.png'
  $b=[Drawing.Bitmap]::new($single)
  try{$w=$b.Width;$h=$b.Height}finally{$b.Dispose()}
  if($w -ne 1448 -or $h -ne 1086){throw 'Single connector camera changed; inspect before normalization'}
  [RadiantCutout]::Extract($single,$cut,0,0,$w,$h)
  $frameScale=2048.0/$w;$rootX=768.0/$frameScale;$rootY=1360.0/$frameScale
 }
 [RadiantCutout]::Normalize($cut,$file,$rootX,$rootY,$frameScale)
 $m=[LamuhDashBlockFrameTools]::Measure($file)
 if($m.TouchesEdge -or $m.VisiblePixels -lt 1000 -or $m.MeaningfulMagentaPixelsRemaining -gt 0){throw "Invalid Radiant frame$i $($m | ConvertTo-Json -Compress)"}
 Copy-Item -LiteralPath $file -Destination (Join-Path $public ([IO.Path]::GetFileName($file)))
 $role=@('near-arm airborne chamber','same-arm descending connector','ONE descending palm CONTACT','airborne knee gather')[$col]
 $frames+=@{index=$i;strength=$strength;role=$role;publicPath=("/lamuh-legacy-v2/radiant-dive-v1/{0}-{1:D2}.png" -f $strength,$col);sha256=(Get-Sha256 $file);sourceSha256=(Get-Sha256 $cut);root=@{x=768;y=1360};sourceRegistration=@{x=$rootX;y=$rootY};sourcePelvis=@{x=$pelvis[$i][0];y=$pelvis[$i][1]};bodyCenter=@{x=$m.CentroidX;y=$m.CentroidY};sourceScale=$scale;auraBaked=($row -eq 2);visibleBounds=@{minX=$m.MinX;minY=$m.MinY;maxX=$m.MaxX;maxY=$m.MaxY};magentaRemaining=$m.MeaningfulMagentaPixelsRemaining;edgeContact=$m.TouchesEdge}
 $paths+=$file;$labels+=("{0} {1:D2} {2}" -f $strength,$col,$role)
 if($i -eq 9){$frames[-1].sourceScale=$frameScale;$frames[-1].sourcePelvis=@{x=$targetPelvisX/$frameScale;y=$targetPelvisY/$frameScale};$frames[-1].cameraPolicy='normalized_contact_reference_resolution_restore_not_pose_bbox_scale'}
}
$sheet=Join-Path $public 'radiant-dive-numbered-contact-sheet.png'
[LamuhDashBlockFrameTools]::MakeContactSheet($paths,$labels,$sheet,4)
Copy-Item -LiteralPath $sheet -Destination $review
$v1Frames=@();$legacy=[Drawing.Bitmap]::new((Join-Path $review 'protected-v1-radiant-dive-strip.png'))
try { for($i=0;$i -lt 7;$i++) {
 $p=Join-Path $extract ("protected-v1-{0:D2}.png" -f $i)
 $cell=$legacy.Clone([Drawing.Rectangle]::new($i*448,0,448,448),[Drawing.Imaging.PixelFormat]::Format32bppArgb)
 try{$cell.Save($p,[Drawing.Imaging.ImageFormat]::Png)}finally{$cell.Dispose()}
 $m=[LamuhDashBlockFrameTools]::Measure($p)
 $v1Frames+=@{index=$i;visibleBounds=@{minX=$m.MinX;minY=$m.MinY;maxX=$m.MaxX;maxY=$m.MaxY};bodyCenter=@{x=$m.CentroidX;y=$m.CentroidY};sha256=(Get-Sha256 $p)}
}}finally{$legacy.Dispose()}
$r=@{schemaVersion='1.0.0';candidateOnly=$true;deployable=$false;canvas=@{width=2048;height=1536};root=@{x=768;y=1360};scale=$scale;perFrameRescale=$false;registration='manual_pelvis_registered_virtual_ground_not_foot_plant';bodySourceSha256=(Get-Sha256 (Join-Path $review 'raw-family-repair-v2.png'));heavyAuraSourceSha256=$(if($BodyOnly){$null}else{Get-Sha256 (Join-Path $review 'raw-heavy-aura-v3.png')});frames=$frames;contactSheetPublicPath='/lamuh-legacy-v2/radiant-dive-v1/radiant-dive-numbered-contact-sheet.png';sourceArtStatus='candidate';alphaPolicy='magenta_unmix_no_neutral_white_key';bodyScaleBoundary='constant source camera; anatomical judgment requires visual review'}
[IO.File]::WriteAllText((Join-Path $review 'normalization.report.json'),($r | ConvertTo-Json -Depth 24),[Text.UTF8Encoding]::new($false))
$r.v1Frames=$v1Frames
$r.heavyConnectorSourceSha256=$(if($BodyOnly){$null}else{Get-Sha256 (Join-Path $review 'raw-heavy-connector-single-v5.png')})
$r.sourceArtStatus=$(if($BodyOnly){'incomplete_heavy_connector'}else{'candidate_ready_for_human_review'})
$r.releaseSockets=@{light=@{x=1056;y=1189};medium=@{x=1045;y=1220};heavy=@{x=946;y=1354}}
$r.releaseSocketMethod='manual_center_of_visible_open_palm_on_normalized_contact; source pixels, not simulation root'
$r.heavyConnectorCamera='1448x1086 render of2048x1536 normalized reference; exact4:3 resolution restoration only; no anatomical bbox scaling'
[IO.File]::WriteAllText((Join-Path $review 'normalization.report.json'),($r | ConvertTo-Json -Depth 24),[Text.UTF8Encoding]::new($false))
Write-Output "Normalized $($frames.Count) Radiant poses with fixed camera, explicit pelvis roots and preserved white fabric."
