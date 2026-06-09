from __future__ import annotations

import json
import shutil
from datetime import datetime, timezone
from pathlib import Path

import numpy as np
from PIL import Image


ROOT = Path(__file__).resolve().parents[1]
SERIS_DIR = ROOT / "assets" / "sprites" / "seris_final"
BACKUP_DIR = SERIS_DIR / "no_green_chain_source"

ATLASES = [
    "seris_sheet_1_core_movement_atlas.png",
    "seris_sheet_2_air_movement_atlas.png",
    "seris_sheet_3_ground_normals_atlas.png",
    "seris_sheet_4_air_normals_atlas.png",
    "seris_sheet_5_specials_body_atlas.png",
    "seris_sheet_6_defense_hit_reactions_atlas.png",
    "seris_sheet_7_knockdown_recovery_flavor_atlas.png",
]


def rgb_to_hsv_np(rgb: np.ndarray) -> tuple[np.ndarray, np.ndarray, np.ndarray]:
    values = rgb.astype(np.float32) / 255.0
    r = values[..., 0]
    g = values[..., 1]
    b = values[..., 2]
    maxc = values.max(axis=-1)
    minc = values.min(axis=-1)
    delta = maxc - minc

    hue = np.zeros_like(maxc)
    nonzero = delta > 1e-6
    rmax = (maxc == r) & nonzero
    gmax = (maxc == g) & nonzero
    bmax = (maxc == b) & nonzero
    hue[rmax] = ((g[rmax] - b[rmax]) / delta[rmax]) % 6
    hue[gmax] = ((b[gmax] - r[gmax]) / delta[gmax]) + 2
    hue[bmax] = ((r[bmax] - g[bmax]) / delta[bmax]) + 4
    hue *= 60.0

    saturation = np.zeros_like(maxc)
    saturation[maxc > 1e-6] = delta[maxc > 1e-6] / maxc[maxc > 1e-6]
    return hue, saturation, maxc


def strip_green_chain(src: Path, dst: Path) -> dict[str, int | str]:
    image = Image.open(src).convert("RGBA")
    arr = np.array(image)
    rgb = arr[..., :3]
    alpha = arr[..., 3]
    hue, sat, val = rgb_to_hsv_np(rgb)

    visible = alpha > 8
    yellow_green_chain = (hue >= 34) & (hue <= 112) & (sat >= 0.22) & (val >= 0.24)
    cyan_chain = (hue >= 145) & (hue <= 205) & (sat >= 0.24) & (val >= 0.24)
    green_dominant = (rgb[..., 1] > 95) & (rgb[..., 1] >= rgb[..., 0] * 0.82) & (rgb[..., 1] >= rgb[..., 2] * 0.72)
    mask = visible & ((yellow_green_chain | cyan_chain) & green_dominant)
    mask = dilate_mask(mask, radius=4) & visible

    removed = int(mask.sum())
    arr[mask, 3] = 0
    Image.fromarray(arr, "RGBA").save(dst)
    return {
        "source": str(src.relative_to(ROOT)),
        "output": str(dst.relative_to(ROOT)),
        "removedPixels": removed,
    }


def dilate_mask(mask: np.ndarray, radius: int) -> np.ndarray:
    expanded = mask.copy()
    height, width = mask.shape
    for dy in range(-radius, radius + 1):
        for dx in range(-radius, radius + 1):
            if dx == 0 and dy == 0:
                continue
            if dx * dx + dy * dy > radius * radius:
                continue
            src_y0 = max(0, -dy)
            src_y1 = min(height, height - dy)
            src_x0 = max(0, -dx)
            src_x1 = min(width, width - dx)
            dst_y0 = max(0, dy)
            dst_y1 = min(height, height + dy)
            dst_x0 = max(0, dx)
            dst_x1 = min(width, width + dx)
            expanded[dst_y0:dst_y1, dst_x0:dst_x1] |= mask[src_y0:src_y1, src_x0:src_x1]
    return expanded


def main() -> None:
    BACKUP_DIR.mkdir(parents=True, exist_ok=True)
    records = []
    for atlas_name in ATLASES:
        src = SERIS_DIR / atlas_name
        if not src.exists():
            raise FileNotFoundError(src)
        backup = BACKUP_DIR / atlas_name
        if not backup.exists():
            shutil.copy2(src, backup)
        dst = SERIS_DIR / atlas_name.replace("_atlas.png", "_no_green_chain_atlas.png")
        records.append(strip_green_chain(src, dst))

    manifest = {
        "generatedAt": datetime.now(timezone.utc).isoformat(),
        "purpose": "Temporary Seris runtime baseline with all visible green/cyan/gold chain-color pixels removed from active body atlases.",
        "sourcePreservedIn": str(BACKUP_DIR.relative_to(ROOT)),
        "runtimeCacheVersion": "seris-no-green-chain-1",
        "vfxPolicy": "Sheet 8 remains on disk but runtime playback is disabled separately in game.js.",
        "records": records,
    }
    (SERIS_DIR / "seris_no_green_chain_runtime_manifest.json").write_text(json.dumps(manifest, indent=2), encoding="utf-8")
    for record in records:
        print(f"{record['output']}: removed {record['removedPixels']} pixels")


if __name__ == "__main__":
    main()
