param(
  [string]$EngineRoot = (Split-Path -Parent $PSScriptRoot)
)

$ErrorActionPreference = 'Stop'
Add-Type -AssemblyName System.Drawing

$gameRoot = Resolve-Path (Join-Path $EngineRoot '..')
$outputRoot = Join-Path $EngineRoot 'content-source\characters\lamuh-legacy-v2\source-frames'

$plans = @(
  @{ Atlas='assets\sprites\lamuh_final\lamuh_sheet_1_core_movement_atlas.png'; Columns=8; Rows=@(
    @{ Name='idle'; Row=0; Count=8 }, @{ Name='walk_forward'; Row=1; Count=6 }, @{ Name='walk_backward'; Row=2; Count=6 },
    @{ Name='dash_forward'; Row=3; Count=6 }, @{ Name='dash_backward'; Row=4; Count=6 }, @{ Name='crouch'; Row=5; Count=4 }) },
  @{ Atlas='assets\sprites\lamuh_final\lamuh_sheet_2_air_movement_atlas.png'; Columns=6; Rows=@(
    @{ Name='jump'; Row=0; Count=4 },
    @{ Name='air_dash_forward'; Row=4; Count=6 }, @{ Name='air_dash_backward'; Row=5; Count=6 }) },
  @{ Atlas='assets\sprites\lamuh_final\lamuh_sheet_3_ground_normals_atlas.png'; Columns=8; Rows=@(
    @{ Name='standing_light'; Row=0; Count=4 }, @{ Name='standing_medium'; Row=1; Count=8 }, @{ Name='standing_heavy'; Row=2; Count=7 }, @{ Name='crouching_heavy'; Row=3; Count=7 }) },
  @{ Atlas='assets\sprites\lamuh_final\lamuh_sheet_4_air_normals_atlas.png'; Columns=7; Rows=@(
    @{ Name='air_light'; Row=0; Count=4 }, @{ Name='air_medium'; Row=1; Count=6 }, @{ Name='air_heavy'; Row=2; Count=7 }) },
  @{ Atlas='assets\sprites\lamuh_final\lamuh_sheet_5_specials_atlas.png'; Columns=8; Rows=@(
    @{ Name='ascend_step'; Row=1; Count=7 }) },
  @{ Atlas='assets\sprites\lamuh_final\lamuh_sheet_6_defense_hit_reactions_atlas.png'; Columns=8; Rows=@(
    @{ Name='standing_block'; Row=0; Count=4 }, @{ Name='light_reaction'; Row=3; Count=5 }) }
)

$written = 0
foreach ($plan in $plans) {
  $atlasPath = Join-Path $gameRoot $plan.Atlas
  $atlas = [System.Drawing.Bitmap]::FromFile($atlasPath)
  try {
    foreach ($rowSpec in $plan.Rows) {
      $moveRoot = Join-Path $outputRoot $rowSpec.Name
      [System.IO.Directory]::CreateDirectory($moveRoot) | Out-Null
      for ($column = 0; $column -lt $rowSpec.Count; $column++) {
        $rect = [System.Drawing.Rectangle]::new($column * 448, $rowSpec.Row * 448, 448, 448)
        $frame = $atlas.Clone($rect, [System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
        try {
          $target = Join-Path $moveRoot ('{0}_{1:D2}.png' -f $rowSpec.Name, $column)
          $frame.Save($target, [System.Drawing.Imaging.ImageFormat]::Png)
          $written++
        } finally {
          $frame.Dispose()
        }
      }
    }
  } finally {
    $atlas.Dispose()
  }
}

Write-Output "Extracted $written protected Lamuh V1 atlas cells into candidate source frames."
