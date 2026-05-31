$ErrorActionPreference = "Stop"

$projectRoot = Resolve-Path (Join-Path $PSScriptRoot "..")
Push-Location $projectRoot
try {
  python ".\scripts\normalize_sprite_atlases.py"
} finally {
  Pop-Location
}
