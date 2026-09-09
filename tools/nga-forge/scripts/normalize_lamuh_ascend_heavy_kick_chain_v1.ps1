param([string]$RepoRoot=(Resolve-Path (Join-Path $PSScriptRoot '../../..')).Path,
 [string]$RawSource='C:/Users/qchee/.codex/generated_images/01a07e98-9d72-7110-93cb-5997c49918ce/exec-e88fbc69-211b-4edc-a575-ae5200dd996a.png')
$ErrorActionPreference='Stop'
Add-Type -AssemblyName System.Drawing
$review=Join-Path $RepoRoot 'tools/nga-forge/review/lamuh-legacy-v2-ascend-heavy-kick-chain-v1'
$source=Join-Path $RepoRoot 'NO_GODS_ABOVE/engine_v2/content-source/characters/lamuh-legacy-v2/ascend-heavy-kick-chain-v1'
$public=Join-Path $RepoRoot 'NO_GODS_ABOVE/engine_v2/public/lamuh-legacy-v2/ascend-heavy-kick-chain-v1'
$extract=Join-Path $review 'extracted'
New-Item -ItemType Directory -Force -Path $review,$source,$public,$extract | Out-Null
$raw=Join-Path $review 'raw-kick-chain-v1.png'
Copy-Item -LiteralPath $RawSource -Destination $raw
function Get-Hash([string]$p){(Get-FileHash -LiteralPath $p -Algorithm SHA256).Hash}
# Reuse only the existing C# extraction/normalization methods. Do not execute
# the old script's entrypoint or write any Divine artwork.
$helper=Join-Path $PSScriptRoot 'normalize_lamuh_divine_vanish_v1.ps1'
$helperText=Get-Content -LiteralPath $helper -Raw
$match=[regex]::Match($helperText,"Add-Type -ReferencedAssemblies System.Drawing -TypeDefinition @'\r?\n([\s\S]*?)\r?\n'@")
if(!$match.Success){throw 'Expected existing normalization helpers not found'}
Add-Type -ReferencedAssemblies System.Drawing -TypeDefinition $match.Groups[1].Value
$reviewData=Get-Content -LiteralPath (Join-Path $RepoRoot 'NO_GODS_ABOVE/engine_v2/public/lamuh-legacy-v2/review-data.json') -Raw | ConvertFrom-Json
$preserved=@($reviewData.ascendStepFamily.variants.heavy.v2.frames | ForEach-Object {
 $p=Join-Path $RepoRoot ('NO_GODS_ABOVE/engine_v2/public'+$_.publicPath)
 @{path=$p;sha256=(Get-Hash $p)}
})
$cuts=@(@(0,0,512,512),@(512,0,512,512),@(1024,0,512,512),@(0,512,512,512),@(512,512,512,512),@(1024,512,512,512))
$registrations=@(@(235,450),@(650,454),@(1123,454),@(240,943),@(643,945),@(1131,945))
$roles=@('near knee chamber, far foot planted','same leg unfolding','single side kick full extension','same knee recoil and retract','kicking foot planted, balance restored','grounded open palm preparation')
$scale=2.0;$frames=@();$paths=@();$labels=@()
for($i=0;$i-lt6;$i++){
 $c=$cuts[$i];$name=('pose-{0:D2}.png'-f$i);$cut=Join-Path $extract $name;$file=Join-Path $source $name
 [DivineNormalize]::Extract($raw,$cut,$c[0],$c[1],$c[2],$c[3])
 [DivineNormalize]::Normalize($cut,$file,($registrations[$i][0]-$c[0]),($registrations[$i][1]-$c[1]),$scale)
 Copy-Item -LiteralPath $file -Destination (Join-Path $public $name)
 $m=[DivineNormalize]::Measure($file)
 if($m[7]-ne0 -or $m[0]-le0 -or $m[1]-le0 -or $m[2]-ge2047 -or $m[3]-ge1535){throw "Failed alpha/edge validation for pose$i"}
 $frames+=@{index=$i;role=$roles[$i];publicPath="/lamuh-legacy-v2/ascend-heavy-kick-chain-v1/$name";sourcePath="NO_GODS_ABOVE/engine_v2/content-source/characters/lamuh-legacy-v2/ascend-heavy-kick-chain-v1/$name";sha256=(Get-Hash $file);sourceSha256=(Get-Hash $cut);root=@{x=768;y=1360};visibleBounds=@{minX=$m[0];minY=$m[1];maxX=$m[2];maxY=$m[3]};bodyCenter=@{x=$m[5];y=$m[6]};edgeContact=$false;greenRemaining=$m[7];opaqueWhitePixels=$m[8];transparentPixels=$m[10];auraBaked=$true;contact=($i-eq2);visibleImpact=($i-eq2);sourceScale=$scale;sourceRegistration=@{x=$registrations[$i][0];y=$registrations[$i][1]}}
 $paths+=$file;$labels+=('{0:D2} {1}'-f$i,$roles[$i])
}
$sheet=Join-Path $review 'new-six-poses-numbered.png'
[DivineNormalize]::Contact([string[]]$paths,[string[]]$labels,$sheet)
Copy-Item -LiteralPath $sheet -Destination (Join-Path $public 'new-six-poses-numbered.png')
foreach($p in $preserved){if((Get-Hash $p.path)-ne$p.sha256){throw 'Protected old Ascend/Divine shared source changed'}}
$report=@{schemaVersion='1.0.0';sourceArtStatus='candidate_ready_for_human_review';candidateOnly=$true;deployable=$false;humanApproval=$false;canvas=@{width=2048;height=1536};root=@{x=768;y=1360};scale=$scale;perFrameRescale=$false;registration='single_camera_2x_with_manual_far_support_sandal_and_ground_baseline_registration';frames=$frames;rawSources=@(@{file='raw-kick-chain-v1.png';sha256=(Get-Hash $raw)});normalizationHelperSha256=(Get-Hash $helper);contactSheetPublicPath='/lamuh-legacy-v2/ascend-heavy-kick-chain-v1/new-six-poses-numbered.png';preservedOldHeavy=$preserved;contactSocket=@{x=(768+(1444-1123)*2);y=(1360+(187-454)*2)};contactSocketEvidence='manual extended sidekick heel raw1444,187; supportsole1123,454; camera2.0; engine world conversion owned by main';notes=@('New sources only; old Heavy05-08 preserved for Divinecounter','Six art poses only; main owns new authorized combo timing and hitbox; no core changes','Flowing cyan-white-gold aura matching new forward Heavy reference; no purple','Fixed registration is not human motion approval')}
$report | ConvertTo-Json -Depth 20 | Set-Content -LiteralPath (Join-Path $review 'normalization.report.json') -Encoding UTF8
Write-Output 'Normalized six Heavy kick-chain candidate frames; source/public hashes preserved and old assets unchanged.'


