#!/usr/bin/env python3
"""Package a generated Seris Sheet 2 draft into the runtime-compatible atlas.

This is an asset-prep helper only. It removes the chroma/grid preview and writes
the exact 2304x2304 transparent Sheet 2 atlas. It does not change runtime code.
"""

from __future__ import annotations

import argparse
import json
from pathlib import Path

import numpy as np
from PIL import Image


ATLAS_W = 2304
ATLAS_H = 2304
COLS = 6
ROWS = 6
CELL = 384
BASELINE_Y = 350
FRAME_COUNTS = [4, 4, 4, 4, 6, 6]
ROW_NAMES = [
    "jump_up_rising",
    "jump_forward",
    "jump_back",
    "fall_neutral_air_drift",
    "air_dash_forward",
    "air_dash_back",
]


def foreground_mask(rgb: np.ndarray) -> np.ndarray:
    rgb_i = rgb.astype(np.int16)
    r = rgb_i[:, :, 0]
    g = rgb_i[:, :, 1]
    b = rgb_i[:, :, 2]
    green_key = (g > 135) & (g - r > 60) & (g - b > 45)
    white_grid = (r > 220) & (g > 220) & (b > 220) & (np.abs(r - g) < 18) & (np.abs(g - b) < 18)
    near_green_shadow = (g > 50) & (r < 150) & (b < 150) & (g - r > 15) & (g - b > 15)
    return ~(green_key | white_grid | near_green_shadow)


def alpha_bbox(image: Image.Image) -> tuple[int, int, int, int] | None:
    alpha = np.asarray(image)[:, :, 3]
    ys, xs = np.nonzero(alpha > 0)
    if len(xs) == 0:
        return None
    return int(xs.min()), int(ys.min()), int(xs.max()) + 1, int(ys.max()) + 1


def foot_anchor_x(image: Image.Image) -> float:
    alpha = np.asarray(image)[:, :, 3]
    ys, xs = np.nonzero(alpha > 0)
    if len(xs) == 0:
        return image.width / 2
    bottom = ys.max()
    band = ys >= max(0, bottom - 24)
    if band.any():
        return float(np.median(xs[band]))
    return float(np.median(xs))


def clean_cell(cell: Image.Image) -> Image.Image:
    rgba = cell.convert("RGBA")
    arr = np.asarray(rgba).copy()
    mask = foreground_mask(arr[:, :, :3])
    arr[:, :, 3] = np.where(mask, 255, 0).astype(np.uint8)
    return Image.fromarray(arr, "RGBA")


def package(input_path: Path, output_path: Path, report_path: Path) -> dict:
    source = Image.open(input_path).convert("RGBA")
    src_cell_w = source.width / COLS
    src_cell_h = source.height / ROWS
    atlas = Image.new("RGBA", (ATLAS_W, ATLAS_H), (0, 0, 0, 0))
    placements = []
    warnings = []

    if abs(src_cell_w - round(src_cell_w)) > 0.01 or abs(src_cell_h - round(src_cell_h)) > 0.01:
        warnings.append(f"Source does not divide cleanly into 6x6: cell approx {src_cell_w:.3f}x{src_cell_h:.3f}")

    for row in range(ROWS):
        for col in range(COLS):
            active = col < FRAME_COUNTS[row]
            if not active:
                placements.append({"row": row, "rowName": ROW_NAMES[row], "col": col, "active": False})
                continue

            x0 = int(round(col * src_cell_w))
            y0 = int(round(row * src_cell_h))
            x1 = int(round((col + 1) * src_cell_w))
            y1 = int(round((row + 1) * src_cell_h))
            trim = 2
            raw_cell = source.crop((x0 + trim, y0 + trim, max(x0 + trim + 1, x1 - trim), max(y0 + trim + 1, y1 - trim)))
            cleaned = clean_cell(raw_cell)
            bbox = alpha_bbox(cleaned)
            if bbox is None:
                warnings.append(f"Active row {row} col {col} produced an empty cleaned cell.")
                placements.append({"row": row, "rowName": ROW_NAMES[row], "col": col, "active": True, "empty": True})
                continue

            trimmed = cleaned.crop(bbox)
            max_w = CELL - 36
            max_h = 310
            scale = min(1.92, max_w / trimmed.width, max_h / trimmed.height)
            scaled_w = max(1, int(round(trimmed.width * scale)))
            scaled_h = max(1, int(round(trimmed.height * scale)))
            scaled = trimmed.resize((scaled_w, scaled_h), Image.Resampling.NEAREST)

            anchor_x = foot_anchor_x(trimmed) * scale
            paste_x = int(round(col * CELL + CELL / 2 - anchor_x))
            paste_y = int(round(row * CELL + BASELINE_Y - scaled_h))
            paste_x = max(col * CELL + 14, min(paste_x, (col + 1) * CELL - scaled_w - 14))
            paste_y = max(row * CELL + 12, min(paste_y, (row + 1) * CELL - scaled_h - 12))
            atlas.alpha_composite(scaled, (paste_x, paste_y))

            placements.append(
                {
                    "row": row,
                    "rowName": ROW_NAMES[row],
                    "col": col,
                    "active": True,
                    "sourceCell": [x0, y0, x1, y1],
                    "sourceBbox": list(bbox),
                    "paste": [paste_x, paste_y, scaled_w, scaled_h],
                    "scale": round(scale, 4),
                }
            )

    output_path.parent.mkdir(parents=True, exist_ok=True)
    atlas.save(output_path)
    report = {
        "input": str(input_path),
        "output": str(output_path),
        "sourceSize": [source.width, source.height],
        "sourceCellApprox": [src_cell_w, src_cell_h],
        "outputSize": [ATLAS_W, ATLAS_H],
        "cellSize": [CELL, CELL],
        "grid": [COLS, ROWS],
        "baselineY": BASELINE_Y,
        "frameCounts": FRAME_COUNTS,
        "placements": placements,
        "warnings": warnings,
    }
    report_path.parent.mkdir(parents=True, exist_ok=True)
    report_path.write_text(json.dumps(report, indent=2), encoding="utf-8")
    return report


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("input", type=Path)
    parser.add_argument(
        "--output",
        type=Path,
        default=Path("assets/sprites/seris_revamp/seris_sheet_2_air_movement_revamp_atlas.png"),
    )
    parser.add_argument(
        "--report",
        type=Path,
        default=Path("assets/sprites/seris_revamp/seris_sheet_2_air_movement_revamp_pack_report.json"),
    )
    args = parser.parse_args()
    report = package(args.input, args.output, args.report)
    print(json.dumps({"output": str(args.output), "report": str(args.report), "warnings": report["warnings"]}, indent=2))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
