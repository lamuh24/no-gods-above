#!/usr/bin/env python3
"""Package a generated Seris Sheet 5 draft into the runtime-compatible atlas.

This is an asset-prep helper only. It removes the chroma/grid preview and writes
the exact 6656x2688 transparent Sheet 5 atlas. It does not change runtime code.
"""

from __future__ import annotations

import argparse
import json
from pathlib import Path

import numpy as np
from PIL import Image
from scipy import ndimage


ATLAS_W = 6656
ATLAS_H = 2688
CELL_W = 832
CELL_H = 448
COLS = 8
ROWS = 6
ANCHOR_X = 320
BASELINE_Y = 406
FRAME_COUNTS = [4, 6, 4, 8, 8, 4]
ROW_NAMES = [
    "chain_snare_start",
    "chain_snare_active",
    "chain_snare_recovery",
    "sanctum_sweep",
    "divine_recoil",
    "special_recovery",
]


def foreground_mask(rgb: np.ndarray) -> np.ndarray:
    rgb_i = rgb.astype(np.int16)
    r = rgb_i[:, :, 0]
    g = rgb_i[:, :, 1]
    b = rgb_i[:, :, 2]
    mx = np.maximum.reduce([r, g, b])
    mn = np.minimum.reduce([r, g, b])
    green_key = (g > 135) & (g - r > 45) & (g - b > 35)
    green_spill = (g > 50) & (r < 150) & (b < 150) & (g - r > 15) & (g - b > 15)
    white_grid = (r > 220) & (g > 220) & (b > 220) & ((mx - mn) < 70)
    return ~(green_key | green_spill | white_grid)


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
    bottom = int(ys.max())
    band = ys >= max(0, bottom - 24)
    if band.any():
        return float(np.median(xs[band]))
    return float(np.median(xs))


def line_groups(values: np.ndarray) -> list[tuple[int, int]]:
    groups: list[tuple[int, int]] = []
    if len(values) == 0:
        return groups
    start = prev = int(values[0])
    for value in values[1:]:
        value = int(value)
        if value == prev + 1:
            prev = value
        else:
            groups.append((start, prev))
            start = prev = value
    groups.append((start, prev))
    return groups


def detect_source_grid(source: Image.Image) -> tuple[list[tuple[int, int]], list[tuple[int, int]]]:
    rgb = np.asarray(source.convert("RGB")).astype(np.int16)
    r = rgb[:, :, 0]
    g = rgb[:, :, 1]
    b = rgb[:, :, 2]
    mx = np.maximum.reduce([r, g, b])
    mn = np.minimum.reduce([r, g, b])
    divider = (r > 180) & (g > 180) & (b > 180) & ((mx - mn) < 90)
    x_candidates = np.where(divider.sum(axis=0) > source.height * 0.45)[0]
    y_candidates = np.where(divider.sum(axis=1) > source.width * 0.45)[0]
    return line_groups(x_candidates), line_groups(y_candidates)


def clean_cell(cell: Image.Image) -> Image.Image:
    rgba = cell.convert("RGBA")
    arr = np.asarray(rgba).copy()
    mask = foreground_mask(arr[:, :, :3])
    arr[:, :, 3] = np.where(mask, 255, 0).astype(np.uint8)
    return Image.fromarray(arr, "RGBA")


def remove_small_islands(image: Image.Image) -> Image.Image:
    arr = np.asarray(image).copy()
    alpha = arr[:, :, 3] > 0
    labels, _ = ndimage.label(alpha)
    components = []
    for label_index, sli in enumerate(ndimage.find_objects(labels), start=1):
        if sli is None:
            continue
        area = int((labels[sli] == label_index).sum())
        components.append((area, label_index, sli))
    if not components:
        return image
    remove = np.zeros(alpha.shape, dtype=bool)
    for area, label_index, sli in components:
        if area < 60:
            remove[sli] |= labels[sli] == label_index
    arr[:, :, 3] = np.where(remove, 0, arr[:, :, 3]).astype(np.uint8)
    return Image.fromarray(arr, "RGBA")


def remove_preview_grid_fragments(atlas: Image.Image) -> tuple[Image.Image, int]:
    arr = np.asarray(atlas).copy()
    arr_i = arr.astype(np.int16)
    alpha = arr[:, :, 3] > 0
    r = arr_i[:, :, 0]
    g = arr_i[:, :, 1]
    b = arr_i[:, :, 2]
    mx = np.maximum.reduce([r, g, b])
    mn = np.minimum.reduce([r, g, b])
    bright_low_sat = alpha & (r > 150) & (g > 150) & (b > 150) & ((mx - mn) < 80)
    remove = np.zeros(alpha.shape, dtype=bool)

    labels, _ = ndimage.label(bright_low_sat)
    for label_index, sli in enumerate(ndimage.find_objects(labels), start=1):
        if sli is None:
            continue
        ys, xs = sli
        width = xs.stop - xs.start
        height = ys.stop - ys.start
        area = int((labels[sli] == label_index).sum())
        if height >= 20 and width <= 3 and area >= 20:
            remove[sli] |= labels[sli] == label_index

    for row in range(ROWS):
        y0 = row * CELL_H
        lower_band = np.zeros(alpha.shape, dtype=bool)
        lower_band[y0 + 330 : y0 + CELL_H, :] = True
        labels, _ = ndimage.label(bright_low_sat & lower_band)
        for label_index, sli in enumerate(ndimage.find_objects(labels), start=1):
            if sli is None:
                continue
            ys, xs = sli
            width = xs.stop - xs.start
            height = ys.stop - ys.start
            area = int((labels[sli] == label_index).sum())
            local_y = ys.start - y0
            long_grid_line = width >= 40 and height <= 8 and area >= 40
            baseline_sliver = local_y >= CELL_H - 55 and width >= 5 and height <= 3 and area >= 4
            tiny_baseline_speck = local_y >= CELL_H - 60 and height <= 5 and 2 <= area <= 50
            if long_grid_line or baseline_sliver or tiny_baseline_speck:
                remove[sli] |= labels[sli] == label_index

    removed = int(remove.sum())
    arr[:, :, 3] = np.where(remove, 0, arr[:, :, 3]).astype(np.uint8)
    return Image.fromarray(arr, "RGBA"), removed


def source_col_for(row: int, col: int, source_cols: int) -> int:
    if source_cols == COLS:
        return col
    if source_cols == 9:
        maps = {
            0: [0, 1, 2, 3],
            1: [0, 1, 2, 3, 4, 5],
            2: [0, 1, 2, 3],
            3: [0, 1, 2, 3, 4, 5, 6, 7],
            4: [0, 1, 2, 3, 4, 5, 6, 7],
            5: [0, 1, 2, 3],
        }
        return maps[row][col]
    return col


def package(input_path: Path, output_path: Path, report_path: Path) -> dict:
    source = Image.open(input_path).convert("RGBA")
    x_lines, y_lines = detect_source_grid(source)
    detected_source_cols = len(x_lines) - 1 if len(y_lines) == ROWS + 1 else 0
    use_detected_grid = detected_source_cols in (COLS, 9)
    atlas = Image.new("RGBA", (ATLAS_W, ATLAS_H), (0, 0, 0, 0))
    placements = []
    warnings = []

    if use_detected_grid:
        warnings.append(f"Source preview used detected {detected_source_cols}x{ROWS} grid-line boundaries.")
    else:
        warnings.append("Source grid not detected; using equal slicing fallback.")
    if detected_source_cols == 9:
        warnings.append("Nine-column source preview packaged into the 8-column runtime contract by ignoring extra preview columns.")

    src_cell_w = source.width / (detected_source_cols or COLS)
    src_cell_h = source.height / ROWS

    for row in range(ROWS):
        for col in range(COLS):
            active = col < FRAME_COUNTS[row]
            if not active:
                placements.append({"row": row, "rowName": ROW_NAMES[row], "col": col, "active": False})
                continue

            source_col = source_col_for(row, col, detected_source_cols)
            if use_detected_grid:
                x0 = x_lines[source_col][1] + 1
                y0 = y_lines[row][1] + 1
                x1 = x_lines[source_col + 1][0]
                y1 = y_lines[row + 1][0]
            else:
                x0 = int(round(source_col * src_cell_w)) + 6
                y0 = int(round(row * src_cell_h)) + 6
                x1 = int(round((source_col + 1) * src_cell_w)) - 6
                y1 = int(round((row + 1) * src_cell_h)) - 6

            raw_cell = source.crop((x0, y0, max(x0 + 1, x1), max(y0 + 1, y1)))
            cleaned = remove_small_islands(clean_cell(raw_cell))
            bbox = alpha_bbox(cleaned)
            if bbox is None:
                warnings.append(f"Active row {row} col {col} produced an empty cleaned cell.")
                placements.append({"row": row, "rowName": ROW_NAMES[row], "col": col, "active": True, "empty": True})
                continue

            trimmed = cleaned.crop(bbox)
            max_w = CELL_W - 48
            max_h = 330
            scale = min(1.75, max_w / trimmed.width, max_h / trimmed.height)
            scaled_w = max(1, int(round(trimmed.width * scale)))
            scaled_h = max(1, int(round(trimmed.height * scale)))
            scaled = trimmed.resize((scaled_w, scaled_h), Image.Resampling.NEAREST)
            scaled = remove_small_islands(scaled)

            anchor_x = foot_anchor_x(trimmed) * scale
            paste_x = int(round(col * CELL_W + ANCHOR_X - anchor_x))
            paste_y = int(round(row * CELL_H + BASELINE_Y - scaled_h))
            paste_x = max(col * CELL_W + 18, min(paste_x, (col + 1) * CELL_W - scaled_w - 18))
            paste_y = max(row * CELL_H + 16, min(paste_y, (row + 1) * CELL_H - scaled_h - 16))
            atlas.alpha_composite(scaled, (paste_x, paste_y))

            placements.append(
                {
                    "row": row,
                    "rowName": ROW_NAMES[row],
                    "col": col,
                    "active": True,
                    "sourceCol": source_col,
                    "sourceCell": [x0, y0, x1, y1],
                    "sourceBbox": list(bbox),
                    "paste": [paste_x, paste_y, scaled_w, scaled_h],
                    "scale": round(scale, 4),
                }
            )

    removed_grid_pixels = 0
    for _ in range(4):
        atlas, removed = remove_preview_grid_fragments(atlas)
        removed_grid_pixels += removed
        if removed == 0:
            break
    output_path.parent.mkdir(parents=True, exist_ok=True)
    atlas.save(output_path)
    report = {
        "input": str(input_path),
        "output": str(output_path),
        "sourceSize": [source.width, source.height],
        "detectedGridLines": {"x": x_lines, "y": y_lines, "used": use_detected_grid},
        "detectedSourceGrid": [detected_source_cols, ROWS],
        "outputSize": [ATLAS_W, ATLAS_H],
        "cellSize": [CELL_W, CELL_H],
        "grid": [COLS, ROWS],
        "anchorX": ANCHOR_X,
        "baselineY": BASELINE_Y,
        "frameCounts": FRAME_COUNTS,
        "placements": placements,
        "removedPreviewGridPixels": removed_grid_pixels,
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
        default=Path("assets/sprites/seris_revamp/seris_sheet_5_specials_body_revamp_atlas.png"),
    )
    parser.add_argument(
        "--report",
        type=Path,
        default=Path("assets/sprites/seris_revamp/seris_sheet_5_specials_body_revamp_pack_report.json"),
    )
    args = parser.parse_args()
    report = package(args.input, args.output, args.report)
    print(json.dumps({"output": str(args.output), "report": str(args.report), "warnings": report["warnings"]}, indent=2))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
