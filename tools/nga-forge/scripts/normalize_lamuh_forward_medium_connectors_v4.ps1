param([string]$RepoRoot=(Resolve-Path (Join-Path $PSScriptRoot '../../..')).Path)
$ErrorActionPreference='Stop';Add-Type -AssemblyName System.Drawing
$helper=Get-Content -LiteralPath (Join-Path $PSScriptRoot 'normalize_lamuh_divine_vanish_v1.ps1') -Raw
$code=[regex]::Match($helper,"(?s)Add-Type -ReferencedAssemblies System.Drawing -TypeDefinition @'\r?\n(.*?)\r?\n'@").Groups[1].Value
Add-Type -ReferencedAssemblies System.Drawing -TypeDefinition $code
function Get-Hash([string]$p){(Get-FileHash -LiteralPath $p -Algorithm SHA256).Hash}
$review=Join-Path $RepoRoot 'tools/nga-forge/review/lamuh-forward-medium-connectors-v4'
$source=Join-Path $RepoRoot 'NO_GODS_ABOVE/engine_v2/content-source/characters/lamuh-legacy-v2/forward-medium-connectors-v4'
$public=Join-Path $RepoRoot 'NO_GODS_ABOVE/engine_v2/public/lamuh-legacy-v2/forward-medium-connectors-v4'
$old=Join-Path $RepoRoot 'NO_GODS_ABOVE/engine_v2/public/lamuh-legacy-v2/ascend-step-medium-slide-flip-v1'
New-Item -ItemType Directory -Force -Path $review,$source,$public,(Join-Path $review 'extracted')|Out-Null
$raw=Join-Path $review 'raw-connectors-green-v4.png'
Copy-Item -LiteralPath 'C:/Users/qchee/.codex/generated_images/01a07e91-281c-7962-b66f-b7df7e8e87b8/exec-56bc617a-06bc-4a52-b844-fd62c0360531.png' -Destination $raw
Copy-Item -LiteralPath 'C:/Users/qchee/.codex/generated_images/01a07e91-281c-7962-b66f-b7df7e8e87b8/exec-b622f5c3-cd7d-4bfe-8124-80e15a051a0f.png' -Destination (Join-Path $review 'raw-connectors-body-green-v4.png')
Copy-Item -LiteralPath 'C:/Users/qchee/.codex/generated_images/01a07e91-281c-7962-b66f-b7df7e8e87b8/exec-1e7de259-f8d9-45d8-9b38-69d56cf4a544.png' -Destination (Join-Path $review 'raw-connectors-aura-top-margin-superseded.png')
$slideRaw=Join-Path $review 'raw-slide-contact-flowing-aura-v4.png'
Copy-Item -LiteralPath 'C:/Users/qchee/.codex/generated_images/01a07e91-281c-7962-b66f-b7df7e8e87b8/exec-b408c02f-1de2-4837-90b2-60c35a798611.png' -Destination $slideRaw
Copy-Item -LiteralPath 'C:/Users/qchee/.codex/generated_images/01a07e91-281c-7962-b66f-b7df7e8e87b8/exec-5b035c09-80c0-4fd1-8442-13ea4a665cc9.png' -Destination (Join-Path $review 'raw-connectors-initial-checker-v4.png')
$replace=@(6,7,8,9,11,12,13,14);$cutsX=@(0,443,887,1330,1774);$cutsY=@(0,443,887)
# Fixed camera calibrated against the retained handstand strike and adult Idle.
# Pelvis X registration is anatomical source measurement; no simulated travel is
# baked into sprites. Floor/virtual-floor anchor retains airborne body pose height.
$scale=2.2;$pelvisX=@(190,676,1127,1540,185,639,1110,1518)
$floorY=@(413,413,413,413,818,818,818,818)
$holds=@(3,2,2,3,2,3,3,3,2,3,3,3,3,3,4,6)
$roles=@('idle','slide entry','slide acceleration','slide CONTACT','slide follow-through','slide retract','backward shoulder load','two-hand planted takeoff','hips rise over planted shoulders','single heel unfolding','single heel CONTACT','inverted leg gather','released tucked rotation','two-foot landing approach','two-foot compression','idle recovery')
$frames=@();$paths=@();$preserved=@()
for($i=0;$i-lt16;$i++){
 $oldFile=Join-Path $old ('ascend-step-medium-{0:D2}.png'-f$i);$preserved+=@{path=$oldFile;sha256=(Get-Hash $oldFile)}
 $name=('frame-{0:D2}.png'-f$i);$file=Join-Path $source $name;$j=[array]::IndexOf($replace,$i);$sj=[array]::IndexOf(@(1,2,3,4,5,10),$i);$frameScale=1.0;$auraBaked=$false;$sourceEdge=$false
 if($j-ge0){
  $col=$j%4;$row=[math]::Floor($j/4);$x=$cutsX[$col];$y=$cutsY[$row];$w=$cutsX[$col+1]-$x;$h=$cutsY[$row+1]-$y
  $cut=Join-Path $review ('extracted/connector-{0:D2}.png'-f$i)
  [DivineNormalize]::Extract($raw,$cut,$x,$y,$w,$h)
  $rx=$pelvisX[$j]-$x-(820-768)/$scale;$ry=$floorY[$j]-$y
  [DivineNormalize]::Normalize($cut,$file,$rx,$ry,$scale)
  $frameScale=$scale;$auraBaked=($i-ne14)
  $cm=[DivineNormalize]::Measure($cut);$sourceEdge=$cm[0]-le0-or$cm[1]-le0-or$cm[2]-ge($w-1)-or$cm[3]-ge($h-1)
 }elseif($sj-ge0){
  $sx=@(0,591,1183,1774);$sy=@(0,443,887);$col=$sj%3;$row=[math]::Floor($sj/3);$x=$sx[$col];$y=$sy[$row];$w=$sx[$col+1]-$x;$h=$sy[$row+1]-$y
  $cut=Join-Path $review ('extracted/slide-aura-{0:D2}.png'-f$i);[DivineNormalize]::Extract($slideRaw,$cut,$x,$y,$w,$h)
  $frameScale=6144.0/1774.0
  # Restore the original3072x1536 sheet of half-sized normalized references.
  # Only contact10 gets a sibling49px upward registration to plant its hands.
  $rx=($col*1024+384)*1774/3072-$x;$ry=($row*768+680)*887/1536-$y
  if($i-eq10){$ry+=49/$frameScale}
  [DivineNormalize]::Normalize($cut,$file,$rx,$ry,$frameScale);$auraBaked=$true
  $cm=[DivineNormalize]::Measure($cut);$sourceEdge=$cm[0]-le0-or$cm[1]-le0-or$cm[2]-ge($w-1)-or$cm[3]-ge($h-1)
 }else{Copy-Item -LiteralPath $oldFile -Destination $file}
 $m=[DivineNormalize]::Measure($file);$edge=$m[0]-le0-or$m[1]-le0-or$m[2]-ge2047-or$m[3]-ge1535
 if($edge-or$sourceEdge-or$m[4]-lt1000-or(($j-ge0-or$sj-ge0)-and$m[7]-gt0)){throw "Invalid medium frame${i}: green=$($m[7]) sourceEdge=$sourceEdge"}
 Copy-Item -LiteralPath $file -Destination (Join-Path $public $name);$paths+=$file
 $frames+=@{index=$i;role=$roles[$i];publicPath="/lamuh-legacy-v2/forward-medium-connectors-v4/$name";sourcePath="NO_GODS_ABOVE/engine_v2/content-source/characters/lamuh-legacy-v2/forward-medium-connectors-v4/$name";sha256=(Get-Hash $file);root=@{x=768;y=1360};sourceScale=$frameScale;newDrawing=($j-ge0);auraBaked=$auraBaked;contact=($i-eq3-or$i-eq10);exposureTicks=$holds[$i];visibleBounds=@{minX=$m[0];minY=$m[1];maxX=$m[2];maxY=$m[3]};bodyCenter=@{x=$m[5];y=$m[6]};edgeContact=$edge;sourceEdgeContact=$sourceEdge;greenRemaining=$m[7];opaqueWhitePixels=$m[8];sourceOldPath=$oldFile;sourceOldSha256=(Get-Hash $oldFile)}
}
Add-Type -ReferencedAssemblies System.Drawing -TypeDefinition @'
using System.Drawing;using System.Drawing.Imaging;using System.Drawing.Drawing2D;
public static class MediumSheet{
 public static void Reference(string[] paths,string output){using(var b=new Bitmap(3072,1536,PixelFormat.Format32bppArgb))using(var g=Graphics.FromImage(b)){
  g.Clear(Color.FromArgb(0,255,0));g.InterpolationMode=InterpolationMode.HighQualityBicubic;
  for(int i=0;i<paths.Length;i++)using(var f=new Bitmap(paths[i]))g.DrawImage(f,new Rectangle(i%3*1024,i/3*768,1024,768));
  b.Save(output,ImageFormat.Png);
 }}
 public static void Make(string[] paths,string[] labels,string output){using(var b=new Bitmap(2048,1664,PixelFormat.Format32bppArgb))using(var g=Graphics.FromImage(b))using(var font=new Font("Arial",14)){
  g.Clear(Color.FromArgb(18,23,32));g.InterpolationMode=InterpolationMode.HighQualityBicubic;
  for(int i=0;i<paths.Length;i++)using(var f=new Bitmap(paths[i])){int x=i%4*512,y=i/4*416;g.DrawImage(f,new Rectangle(x,y+24,512,384));g.DrawString(i.ToString("D2")+" "+labels[i],font,Brushes.White,x+8,y+2);g.DrawLine(Pens.DimGray,x,y+364,x+512,y+364);}
  b.Save(output,ImageFormat.Png);
 }}
}
'@
$sheet=Join-Path $public 'medium-numbered-contact-sheet.png';[MediumSheet]::Make($paths,$roles,$sheet);Copy-Item -LiteralPath $sheet -Destination $review
[MediumSheet]::Reference(@(@(1,2,3,4,5,10)|ForEach-Object{Join-Path $old ('ascend-step-medium-{0:D2}.png'-f$_)}),(Join-Path $review 'slide-aura-reference.png'))
foreach($p in $preserved){if((Get-Hash $p.path)-ne$p.sha256){throw 'Old Medium frame changed'}}
$report=@{schemaVersion='1.0.0';candidateOnly=$true;deployable=$false;sourceArtStatus='body_connectors_ready_aura_pending';canvas=@{width=2048;height=1536};root=@{x=768;y=1360};scale=$scale;perFrameRescale=$false;registration='one_generated_camera_scale_manual_pelvis_x_and_ground_virtual_ground_y_no_rotated_pose_clones';frames=$frames;exposureTicks=$holds;totalTicks=48;contactFrames=@(3,10);contactTicks=@(7,26);newDrawingFrames=$replace;rawSources=@(@{file='raw-connectors-green-v4.png';sha256=(Get-Hash $raw)},@{file='raw-connectors-initial-checker-v4.png';sha256=(Get-Hash (Join-Path $review 'raw-connectors-initial-checker-v4.png'))});preservedOldFrames=$preserved;contactSheetPublicPath='/lamuh-legacy-v2/forward-medium-connectors-v4/medium-numbered-contact-sheet.png';approvalStatus='pending_human_motion_review';notes=@('Eight genuinely generated connectorposes; initial checkerboard source preserved, green matte edit used for safe whitecoat extraction','Frames0..5,10,15 exact unchanged copies; newdrawing6..9,11..14','No gameplay/root-track/timing/registered-contact modifications','Further flowing aura pass pending; retained slide frames still have previous speedline effect','Existing retainedcontact10 handfloor is49px belowroot; newgrounded connectors use rootfloor; requires runtime motionreview')}
[IO.File]::WriteAllText((Join-Path $review 'normalization.report.json'),($report|ConvertTo-Json -Depth 20),[Text.UTF8Encoding]::new($false))
$report.sourceArtStatus='candidate_ready_for_human_review'
$report.rawSources+=@{file='raw-slide-contact-flowing-aura-v4.png';sha256=(Get-Hash $slideRaw)}
$report.cameraScopes=@{connectors='one2.2camera_scale_all8sourceposes';slideAndContactAura='exact_restore3072x1536reference_contactsheet_with_halfsize_normalized_frames; same6144/1774scale_all6';contact10Registration='49px_up_in_new_sibling_only_to_align_planted_palms; sourcecontact_unmodified'}
$report.notes=@('Eight genuinely generated connectorposes plus six generated flowing aura edits; all prior source and runtime PNGs remain hash-preserved','Only idle0/15 are exact unmodified copies in this new candidate; fourteen interiorframes now reference newbody oraurasources','Cyan-white-palegold flowing aura replaces oldstraight speedlines; no separate runtime overlay','No gameplay/root-track/timing/registered-contact modifications; two contacts stay7/26 with same strikingleg','Handfloor normalization improvescontact10 alignment but exactmotion/anatomy require human1x/.5xreview','Input camera restoration is source-wide, never per-pose silhouette-size normalization')
[IO.File]::WriteAllText((Join-Path $review 'normalization.report.json'),($report|ConvertTo-Json -Depth 20),[Text.UTF8Encoding]::new($false))
Write-Output "Medium16frames normalized; eightnewconnectors; report $review"
