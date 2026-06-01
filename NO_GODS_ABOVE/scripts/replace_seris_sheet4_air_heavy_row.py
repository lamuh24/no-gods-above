#!/usr/bin/env python3
"""Package and insert a replacement Seris Sheet 4 Air Heavy row only.

This writes a new Sheet 4 atlas sibling and preserves rows 0, 1, and 3 from the
base atlas. It does not alter runtime mappings or gameplay code.
"""

from __future__ import annotations

import argparse
import json
from pathlib import Path

import numpy as np
from PIL import Image
from scipy import ndimage


ATLAS_W = 5824
ATLAS_H = 1792
CELL_W = 832
CELL_H = 448
COLS = 7
ROW_INDEX = 2
ANCHOR_X = 320
BASELINE_Y = 406


def foreground_mask(rgb: np.ndarray) -> np.ndarray:
    rgb_i = rgb.astype(np.int16)
    r = rgb_i[:, :, 0]
    g = rgb_i[:, :, 1]
    b = rgb_i[:, :, 2]
    mx = np.maximum.reduce([r, g, b])
    mn = np.minimum.reduce([r, g, b])
    validator_green_spill = (g > 50) & (r < 150) & (b < 150) & (g - r > 15) & (g - b > 15)
    green_key = ((g > 120) & (g - r > 20) & (g - b > 20)) | (
        (g > 180) & (r < 220) & (b < 220) & (g - r > 10) & (g - b > 10)
    ) | validator_green_spill
    white_background = (r > 210) & (g > 210) & (b > 210) & ((mx - mn) < 60)
    return ~(green_key | white_background)


def clean_source(source: Image.Image) -> Image.Image:
    rgba = source.convert("RGBA")
    arr = np.asarray(rgba).copy()
    mask = foreground_mask(arr[:, :, :3])
    arr[:, :, 3] = np.where(mask, 255, 0).astype(np.uint8)
    return Image.fromarray(arr, "RGBA")


def find_pose_boxes(cleaned: Image.Image) -> list[tuple[int, int, int, int]]:
    alpha = np.asarray(cleaned)[:, :, 3] > 0
    labels, _ = ndimage.label(alpha)
    boxes: list[tuple[int, int, int, int, int]] = []
    for label_index, sli in enumerate(ndimage.find_objects(labels), start=1):
        if sli is None:
            continue
        ys, xs = sli
        area = int((labels[sli] == label_index).sum())
        if area < 1000:
            continue
        boxes.append((area, xs.start, ys.start, xs.stop, ys.stop))
    boxes = sorted(boxes, key=lambda item: item[1])
    if len(boxes) != COLS:
        raise ValueError(f"Expected {COLS} foreground pose groups, found {len(boxes)}")
    return [(x0, y0, x1, y1) for _, x0, y0, x1, y1 in boxes]


def foot_anchor_x(image: Image.Image) -> float:
    alpha = np.asarray(image)[:, :, 3] > 0
    ys, xs = np.nonzero(alpha)
    if len(xs) == 0:
        return image.width / 2
    bottom = int(ys.max())
    band = ys >= max(0, bottom - 24)
    if band.any():
        return float(np.median(xs[band]))
    return float(np.median(xs))


def remove_small_islands(image: Image.Image, *, keep_largest_only: bool = False) -> Image.Image:
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
    largest_label = max(components, key=lambda item: item[0])[1]
    remove = np.zeros(alpha.shape, dtype=bool)
    for area, label_index, sli in components:
        if keep_largest_only and label_index != largest_label:
            remove[sli] |= labels[sli] == label_index
        elif area < 80:
            remove[sli] |= labels[sli] == label_index
    arr[:, :, 3] = np.where(remove, 0, arr[:, :, 3]).astype(np.uint8)
    return Image.fromarray(arr, "RGBA")


def make_strip(source_path: Path, strip_path: Path) -> dict:
    source = Image.open(source_path).convert("RGBA")
    cleaned = clean_source(source)
    boxes = find_pose_boxes(cleaned)
    padded_boxes = []
    poses = []
    for x0, y0, x1, y1 in boxes:
        pad = 10
        px0 = max(0, x0 - pad)
        py0 = max(0, y0 - pad)
        px1 = min(cleaned.width, x1 + pad)
        py1 = min(cleaned.height, y1 + pad)
        pose = cleaned.crop((px0, py0, px1, py1))
        pose = remove_small_islands(pose, keep_largest_only=(len(poses) == 4))
        poses.append(pose)
        padded_boxes.append((px0, py0, px1, py1))

    max_w = max(p.width for p in poses)
    max_h = max(p.height for p in poses)
    scale = min(1.75, (CELL_W - 56) / max_w, 330 / max_h)
    strip = Image.new("RGBA", (ATLAS_W, CELL_H), (0, 0, 0, 0))
    placements = []

    for col, pose in enumerate(poses):
        scaled_w = max(1, int(round(pose.width * scale)))
        scaled_h = max(1, int(round(pose.height * scale)))
        scaled = pose.resize((scaled_w, scaled_h), Image.Resampling.NEAREST)
        scaled = remove_small_islands(scaled, keep_largest_only=(col == 4))
        anchor_x = foot_anchor_x(pose) * scale
        paste_x = int(round(col * CELL_W + ANCHOR_X - anchor_x))
        paste_y = int(round(BASELINE_Y - scaled_h))
        paste_x = max(col * CELL_W + 18, min(paste_x, (col + 1) * CELL_W - scaled_w - 18))
        paste_y = max(16, min(paste_y, CELL_H - scaled_h - 16))
        strip.alpha_composite(scaled, (paste_x, paste_y))
        placements.append(
            {
                "col": col,
                "sourceBox": list(boxes[col]),
                "paddedSourceBox": list(padded_boxes[col]),
                "paste": [paste_x, paste_y, scaled_w, scaled_h],
            }
        )

    strip_path.parent.mkdir(parents=True, exist_ok=True)
    strip.save(strip_path)
    return {
        "source": str(source_path),
        "strip": str(strip_path),
        "sourceSize": [source.width, source.height],
        "stripSize": [ATLAS_W, CELL_H],
        "cellSize": [CELL_W, CELL_H],
        "grid": [COLS, 1],
        "scale": round(scale, 4),
        "placements": placements,
    }


def insert_strip(base_path: Path, strip_path: Path, output_path: Path) -> dict:
    base = Image.open(base_path).convert("RGBA")
    strip = Image.open(strip_path).convert("RGBA")
    if base.size != (ATLAS_W, ATLAS_H):
        raise ValueError(f"Base atlas must be {ATLAS_W}x{ATLAS_H}, got {base.size}")
    if strip.size != (ATLAS_W, CELL_H):
        raise ValueError(f"Replacement strip must be {ATLAS_W}x{CELL_H}, got {strip.size}")

    output = base.copy()
    row_y = ROW_INDEX * CELL_H
    output.paste(Image.new("RGBA", (ATLAS_W, CELL_H), (0, 0, 0, 0)), (0, row_y))
    output.alpha_composite(strip, (0, row_y))
    output_path.parent.mkdir(parents=True, exist_ok=True)
    output.save(output_path)

    before = np.asarray(base)
    after = np.asarray(output)
    preserved = {}
    for row in (0, 1, 3):
        y0 = row * CELL_H
        y1 = y0 + CELL_H
        preserved[f"row{row}Unchanged"] = bool(np.array_equal(before[y0:y1, :, :], after[y0:y1, :, :]))

    return {
        "base": str(base_path),
        "strip": str(strip_path),
        "output": str(output_path),
        "replacedRow": ROW_INDEX,
        "outputSize": [ATLAS_W, ATLAS_H],
        "preservedRows": preserved,
    }


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("source", type=Path, help="Generated row-only source image.")
    parser.add_argument(
        "--base",
        type=Path,
        default=Path("assets/sprites/seris_revamp/seris_sheet_4_air_normals_revamp_atlas.png"),
    )
    parser.add_argument(
        "--strip-output",
        type=Path,
        default=Path("assets/sprites/seris_revamp/seris_sheet_4_air_heavy_row2_replacement_strip.png"),
    )
    parser.add_argument(
        "--output",
        type=Path,
        default=Path("assets/sprites/seris_revamp/seris_sheet_4_air_normals_revamp_atlas_row2fix.png"),
    )
    parser.add_argument(
        "--report",
        type=Path,
        default=Path("assets/sprites/seris_revamp/seris_sheet_4_air_heavy_row2_replacement_report.json"),
    )
    args = parser.parse_args()

    strip_report = make_strip(args.source, args.strip_output)
    insert_report = insert_strip(args.base, args.strip_output, args.output)
    report = {**strip_report, **insert_report}
    args.report.parent.mkdir(parents=True, exist_ok=True)
    args.report.write_text(json.dumps(report, indent=2), encoding="utf-8")
    print(json.dumps({"output": str(args.output), "strip": str(args.strip_output), "report": str(args.report)}, indent=2))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
