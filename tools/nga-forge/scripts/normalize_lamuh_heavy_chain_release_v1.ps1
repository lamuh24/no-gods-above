param([string]$RepoRoot=(Resolve-Path (Join-Path $PSScriptRoot '../../..')).Path)
$ErrorActionPreference='Stop';Add-Type -AssemblyName System.Drawing
$helper=Get-Content (Join-Path $PSScriptRoot 'normalize_lamuh_divine_vanish_v1.ps1') -Raw
$match=[regex]::Match($helper,"(?s)Add-Type -ReferencedAssemblies System.Drawing -TypeDefinition @'\r?\n(.*?)\r?\n'@")
Add-Type -ReferencedAssemblies System.Drawing -TypeDefinition $match.Groups[1].Value
$review=Join-Path $RepoRoot 'tools/nga-forge/review/lamuh-heavy-chain-release-v1'
$source=Join-Path $RepoRoot 'NO_GODS_ABOVE/engine_v2/content-source/characters/lamuh-legacy-v2/heavy-chain-release-v1'
$public=Join-Path $RepoRoot 'NO_GODS_ABOVE/engine_v2/public/lamuh-legacy-v2/heavy-chain-release-v1'
New-Item -ItemType Directory -Force -Path $review,$source,$public|Out-Null
$raw=Join-Path $review 'raw-green-v1.png';Copy-Item -LiteralPath 'C:/Users/qchee/.codex/generated_images/01a03e8b-8571-7a70-9c5b-8707edfb06d7/exec-a0652aed-3399-4a44-9991-88649f20bc54.png' -Destination $raw
$cut=Join-Path $review 'cut.png';$file=Join-Path $source 'release-empty-palm.png'
[DivineNormalize]::Extract($raw,$cut,0,0,1448,1086)
[DivineNormalize]::Normalize($cut,$file,543,961.5625,(2048/1448))
$m=[DivineNormalize]::Measure($file);if($m[0]-le0-or$m[1]-le0-or$m[2]-ge2047-or$m[3]-ge1535-or$m[7]-ne0){throw 'Release alpha/bounds failure'}
Copy-Item -LiteralPath $file -Destination (Join-Path $public 'release-empty-palm.png')
$f=@{index=0;role='empty-palm release after detached aura ball';publicPath='/lamuh-legacy-v2/heavy-chain-release-v1/release-empty-palm.png';sha256=(Get-FileHash $file).Hash;root=@{x=768;y=1360};visibleBounds=@{minX=$m[0];minY=$m[1];maxX=$m[2];maxY=$m[3]};bodyCenter=@{x=$m[5];y=$m[6]};auraBaked=$true;contact=$false;visibleImpact=$false}
[IO.File]::WriteAllText((Join-Path $review 'normalization.report.json'),(@{candidateOnly=$true;humanApproval=$null;frames=@($f);rawSha256=(Get-FileHash $raw).Hash;sourceCameraCalibration=(2048/1448);note='Source edit preserves firing pose; orb removed so detached projectile is sole traveling ball'}|ConvertTo-Json -Depth 10),[Text.UTF8Encoding]::new($false))
