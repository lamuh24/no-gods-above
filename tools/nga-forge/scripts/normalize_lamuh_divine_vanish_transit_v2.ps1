param([string]$RepoRoot=(Resolve-Path (Join-Path $PSScriptRoot '../../..')).Path,
 [string]$RawSource='C:/Users/qchee/.codex/generated_images/01a03e8b-8571-7a70-9c5b-8707edfb06d7/exec-028ed143-49c4-4ca0-bfbb-e5a5156ae0fa.png')
$ErrorActionPreference='Stop'
Add-Type -AssemblyName System.Drawing
# Load only the previously audited C# helper declaration. Never execute the old
# normalization script or touch its accepted pose PNGs/report/contact sheet.
$helper=Get-Content -LiteralPath (Join-Path $PSScriptRoot 'normalize_lamuh_divine_vanish_v1.ps1') -Raw
$match=[regex]::Match($helper,"(?s)Add-Type -ReferencedAssemblies System.Drawing -TypeDefinition @'\r?\n(.*?)\r?\n'@")
if(-not$match.Success){throw 'Expected bounded C# helper declaration not found'}
Add-Type -ReferencedAssemblies System.Drawing -TypeDefinition $match.Groups[1].Value
function Get-Hash([string]$p){(Get-FileHash -LiteralPath $p -Algorithm SHA256).Hash}
$v1Source=Join-Path $RepoRoot 'NO_GODS_ABOVE/engine_v2/content-source/characters/lamuh-legacy-v2/divine-vanish-frames-v1'
$v1Public=Join-Path $RepoRoot 'NO_GODS_ABOVE/engine_v2/public/lamuh-legacy-v2/divine-vanish-v1'
$preserved=@();for($i=0;$i-lt6;$i++){foreach($dir in @($v1Source,$v1Public)){$p=Join-Path $dir ('pose-{0:D2}.png'-f$i);$preserved+=@{path=$p;sha256=(Get-Hash $p)}}}
$review=Join-Path $RepoRoot 'tools/nga-forge/review/lamuh-legacy-v2-divine-vanish-transit-v2'
$source=Join-Path $RepoRoot 'NO_GODS_ABOVE/engine_v2/content-source/characters/lamuh-legacy-v2/divine-vanish-v2'
$public=Join-Path $RepoRoot 'NO_GODS_ABOVE/engine_v2/public/lamuh-legacy-v2/divine-vanish-v2'
New-Item -ItemType Directory -Force -Path $review,$source,$public | Out-Null
$raw=Join-Path $review 'raw-aura-only-v2.png';Copy-Item -LiteralPath $RawSource -Destination $raw
$bitmap=[Drawing.Bitmap]::new($raw)
try{if($bitmap.Width-ne1448-or$bitmap.Height-ne1086){throw 'Unexpected aura-only reference resolution'}}finally{$bitmap.Dispose()}
$cut=Join-Path $review 'aura-only-cutout.png';$file=Join-Path $source 'aura-only-00.png'
[DivineNormalize]::Extract($raw,$cut,0,0,1448,1086)
$scale=2048.0/1448.0
[DivineNormalize]::Normalize($cut,$file,(768/$scale),(1360/$scale),$scale)
$m=[DivineNormalize]::Measure($file)
if($m[7]-ne0-or$m[0]-le0-or$m[1]-le0-or$m[2]-ge2047-or$m[3]-ge1535-or$m[9]-lt1000){throw 'Aura-only alpha/bounds/purple validation failed'}
Copy-Item -LiteralPath $file -Destination (Join-Path $public 'aura-only-00.png')
$preview=Join-Path $review 'aura-only-dark-preview.png'
[DivineNormalize]::Contact(@($file),@('Aura-only transit - no body'),$preview)
foreach($p in $preserved){if((Get-Hash $p.path)-ne$p.sha256){throw 'Accepted Light pose changed'}}
$frame=@{index=0;publicPath='/lamuh-legacy-v2/divine-vanish-v2/aura-only-00.png';sourcePath='NO_GODS_ABOVE/engine_v2/content-source/characters/lamuh-legacy-v2/divine-vanish-v2/aura-only-00.png';sha256=(Get-Hash $file);role='aura_only_disappearance_transit';auraBaked=$true;bodyVisible=$false;root=@{x=768;y=1360};sourceScale=$scale;visibleBounds=@{minX=$m[0];minY=$m[1];maxX=$m[2];maxY=$m[3]};bodyCenter=@{x=$m[5];y=$m[6]};centerMeasurement='alpha_centroid_of_aura_only_no_body';edgeContact=$false;greenRemaining=$m[7];purpleAuraPixels=$m[9];transparentPixels=$m[10]}
$report=@{schemaVersion='1.0.0';candidateOnly=$true;deployable=$false;sourceArtStatus='candidate_ready_for_human_review';canvas=@{width=2048;height=1536};root=@{x=768;y=1360};scale=$scale;perFrameRescale=$false;registration='exact_4_to_3_reference_resolution_restore_no_pose_bbox_scale_no_translation';alphaPolicy='green_only_unmix_no_neutral_white_or_purple_key';rawSources=@(@{file='raw-aura-only-v2.png';sha256=(Get-Hash $raw)});frames=@($frame);sourceProvenance=@{generatedImagePath=$RawSource;width=1448;height=1086;normalizedReferenceWidth=2048;normalizedReferenceHeight=1536;scale=$scale};preservedLightPoseHashes=$preserved;humanApproval=$false;notes=@('Single generated aura-only source has no visible character anatomy; disappearance is presentation only','Original twelve source/public Light posefiles hash verified unchanged','No simulation, vulnerability, timing or root-motion change')}
[IO.File]::WriteAllText((Join-Path $review 'normalization.report.json'),($report|ConvertTo-Json -Depth 20),[Text.UTF8Encoding]::new($false))
Write-Output "READY $file; green=$($m[7]); purple=$($m[9]); 12 Light hashes unchanged"
