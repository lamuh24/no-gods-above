#!/usr/bin/env python3
"""Package a generated Seris Sheet 6 draft into the runtime-compatible atlas.

This is an asset-prep helper only. It removes the chroma/grid preview and writes
the exact 2304x3072 transparent Sheet 6 atlas. It does not change runtime code.
"""

from __future__ import annotations

import argparse
import json
from pathlib import Path

import numpy as np
from PIL import Image
from scipy import ndimage


ATLAS_W = 2304
ATLAS_H = 3072
CELL = 384
COLS = 6
ROWS = 8
BASELINE_Y = 350
FRAME_COUNTS = [4, 4, 4, 3, 4, 6, 5, 5]
ROW_NAMES = [
    "standing_block_guard",
    "crouch_block_low_guard",
    "air_block_air_guard",
    "light_hit_reaction",
    "medium_hit_reaction",
    "heavy_hitstun_stagger",
    "air_hitstun",
    "wall_knockback_strong_reaction",
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
    x_candidates = np.where(divider.sum(axis=0) > source.height * 0.35)[0]
    y_candidates = np.where(divider.sum(axis=1) > source.width * 0.35)[0]
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
    remove = np.zeros(alpha.shape, dtype=bool)
    for label_index, sli in enumerate(ndimage.find_objects(labels), start=1):
        if sli is None:
            continue
        area = int((labels[sli] == label_index).sum())
        if area < 50:
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
        if height >= 18 and width <= 3 and area >= 18:
            remove[sli] |= labels[sli] == label_index

    for row in range(ROWS):
        y0 = row * CELL
        lower_band = np.zeros(alpha.shape, dtype=bool)
        lower_band[y0 + 300 : y0 + CELL, :] = True
        labels, _ = ndimage.label(bright_low_sat & lower_band)
        for label_index, sli in enumerate(ndimage.find_objects(labels), start=1):
            if sli is None:
                continue
            ys, xs = sli
            width = xs.stop - xs.start
            height = ys.stop - ys.start
            area = int((labels[sli] == label_index).sum())
            local_y = ys.start - y0
            long_line = width >= 25 and height <= 8 and area >= 25
            baseline_sliver = local_y >= CELL - 55 and width >= 5 and height <= 3 and area >= 4
            if long_line or baseline_sliver:
                remove[sli] |= labels[sli] == label_index

    removed = int(remove.sum())
    arr[:, :, 3] = np.where(remove, 0, arr[:, :, 3]).astype(np.uint8)
    return Image.fromarray(arr, "RGBA"), removed


def package(input_path: Path, output_path: Path, report_path: Path) -> dict:
    source = Image.open(input_path).convert("RGBA")
    x_lines, y_lines = detect_source_grid(source)
    use_detected_grid = len(x_lines) == COLS + 1 and len(y_lines) == ROWS + 1
    if len(x_lines) == COLS + 1 and len(y_lines) != ROWS + 1:
        raise ValueError(
            f"Source preview appears to be {COLS}x{len(y_lines) - 1}, not {COLS}x{ROWS}; regenerate Sheet 6."
        )

    atlas = Image.new("RGBA", (ATLAS_W, ATLAS_H), (0, 0, 0, 0))
    placements = []
    warnings = []
    if use_detected_grid:
        warnings.append("Source preview used detected 6x8 grid-line boundaries.")
    else:
        warnings.append("Source grid not detected cleanly; using equal slicing fallback.")

    src_cell_w = source.width / COLS
    src_cell_h = source.height / ROWS

    for row in range(ROWS):
        previous_frame: tuple[Image.Image, int, int, int, int] | None = None
        for col in range(COLS):
            active = col < FRAME_COUNTS[row]
            if not active:
                placements.append({"row": row, "rowName": ROW_NAMES[row], "col": col, "active": False})
                continue

            if use_detected_grid:
                x0 = x_lines[col][1] + 1
                y0 = y_lines[row][1] + 1
                x1 = x_lines[col + 1][0]
                y1 = y_lines[row + 1][0]
            else:
                x0 = int(round(col * src_cell_w)) + 5
                y0 = int(round(row * src_cell_h)) + 5
                x1 = int(round((col + 1) * src_cell_w)) - 5
                y1 = int(round((row + 1) * src_cell_h)) - 5

            raw_cell = source.crop((x0, y0, max(x0 + 1, x1), max(y0 + 1, y1)))
            cleaned = remove_small_islands(clean_cell(raw_cell))
            bbox = alpha_bbox(cleaned)
            if bbox is None:
                if previous_frame is not None:
                    previous_scaled, rel_x, rel_y, scaled_w, scaled_h = previous_frame
                    paste_x = col * CELL + rel_x
                    paste_y = row * CELL + rel_y
                    atlas.alpha_composite(previous_scaled, (paste_x, paste_y))
                    warnings.append(
                        f"Active row {row} col {col} produced an empty cleaned cell; filled with previous held pose."
                    )
                    placements.append(
                        {
                            "row": row,
                            "rowName": ROW_NAMES[row],
                            "col": col,
                            "active": True,
                            "emptySource": True,
                            "heldPoseFallback": True,
                            "paste": [paste_x, paste_y, scaled_w, scaled_h],
                        }
                    )
                    continue
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
            scaled = remove_small_islands(scaled)

            anchor_x = foot_anchor_x(trimmed) * scale
            paste_x = int(round(col * CELL + CELL / 2 - anchor_x))
            paste_y = int(round(row * CELL + BASELINE_Y - scaled_h))
            paste_x = max(col * CELL + 14, min(paste_x, (col + 1) * CELL - scaled_w - 14))
            paste_y = max(row * CELL + 12, min(paste_y, (row + 1) * CELL - scaled_h - 12))
            atlas.alpha_composite(scaled, (paste_x, paste_y))
            previous_frame = (scaled, paste_x - col * CELL, paste_y - row * CELL, scaled_w, scaled_h)

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
        "detectedSourceGrid": [len(x_lines) - 1, len(y_lines) - 1],
        "outputSize": [ATLAS_W, ATLAS_H],
        "cellSize": [CELL, CELL],
        "grid": [COLS, ROWS],
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
        default=Path("assets/sprites/seris_revamp/seris_sheet_6_defense_hit_reactions_revamp_atlas.png"),
    )
    parser.add_argument(
        "--report",
        type=Path,
        default=Path("assets/sprites/seris_revamp/seris_sheet_6_defense_hit_reactions_revamp_pack_report.json"),
    )
    args = parser.parse_args()
    report = package(args.input, args.output, args.report)
    print(json.dumps({"output": str(args.output), "report": str(args.report), "warnings": report["warnings"]}, indent=2))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
