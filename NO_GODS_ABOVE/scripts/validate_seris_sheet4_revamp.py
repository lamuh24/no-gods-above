#!/usr/bin/env python3
"""Validate a clean Seris Sheet 4 revamp atlas before runtime wiring."""

from __future__ import annotations

import argparse
import json
from collections import deque
from pathlib import Path
from typing import Any

from PIL import Image, ImageDraw, ImageFont
import numpy as np


ATLAS_W = 5824
ATLAS_H = 1792
CELL_W = 832
CELL_H = 448
COLS = 7
ROWS = 4
FRAME_COUNTS = [4, 6, 7, 4]
ROW_NAMES = [
    "air_light",
    "air_medium",
    "air_heavy",
    "air_recovery",
]

MAGENTA = (255, 0, 255)
EDGE_MARGIN = 4
TOP_BOTTOM_FRAGMENT_MARGIN = 20
MIN_FRAGMENT_AREA = 30


def rel_to_root(path: Path, root: Path) -> str:
    try:
        return path.resolve().relative_to(root.resolve()).as_posix()
    except ValueError:
        return str(path.resolve())


def connected_components(mask: np.ndarray) -> list[dict[str, int]]:
    """Small pure-Python component finder for per-cell edge-fragment checks."""
    height, width = mask.shape
    seen = np.zeros(mask.shape, dtype=bool)
    components: list[dict[str, int]] = []

    ys, xs = np.where(mask)
    for start_y, start_x in zip(ys, xs):
        if seen[start_y, start_x]:
            continue
        q: deque[tuple[int, int]] = deque([(int(start_y), int(start_x))])
        seen[start_y, start_x] = True
        area = 0
        min_x = max_x = int(start_x)
        min_y = max_y = int(start_y)

        while q:
            y, x = q.popleft()
            area += 1
            min_x = min(min_x, x)
            max_x = max(max_x, x)
            min_y = min(min_y, y)
            max_y = max(max_y, y)
            for ny in (y - 1, y, y + 1):
                for nx in (x - 1, x, x + 1):
                    if ny == y and nx == x:
                        continue
                    if 0 <= ny < height and 0 <= nx < width and mask[ny, nx] and not seen[ny, nx]:
                        seen[ny, nx] = True
                        q.append((ny, nx))

        components.append(
            {
                "area": area,
                "minX": min_x,
                "minY": min_y,
                "maxX": max_x,
                "maxY": max_y,
            }
        )
    return components


def analyze_cells(arr: np.ndarray) -> tuple[list[dict[str, Any]], list[str], list[str]]:
    cells: list[dict[str, Any]] = []
    failures: list[str] = []
    warnings: list[str] = []

    for row in range(ROWS):
        for col in range(COLS):
            x0 = col * CELL_W
            y0 = row * CELL_H
            cell = arr[y0 : y0 + CELL_H, x0 : x0 + CELL_W, :]
            alpha = cell[:, :, 3] > 0
            opaque = int(alpha.sum())
            magenta = (
                (cell[:, :, 0] == MAGENTA[0])
                & (cell[:, :, 1] == MAGENTA[1])
                & (cell[:, :, 2] == MAGENTA[2])
                & alpha
            )
            magenta_count = int(magenta.sum())
            cell_i = cell.astype(np.int16)
            mx = np.maximum.reduce([cell_i[:, :, 0], cell_i[:, :, 1], cell_i[:, :, 2]])
            mn = np.minimum.reduce([cell_i[:, :, 0], cell_i[:, :, 1], cell_i[:, :, 2]])
            green = (
                (cell_i[:, :, 3] > 0)
                & (cell_i[:, :, 1] > 50)
                & (cell_i[:, :, 0] < 150)
                & (cell_i[:, :, 2] < 150)
                & (cell_i[:, :, 1] - cell_i[:, :, 0] > 15)
                & (cell_i[:, :, 1] - cell_i[:, :, 2] > 15)
            )
            green_count = int(green.sum())
            bright_low_sat = (
                alpha
                & (cell_i[:, :, 0] > 150)
                & (cell_i[:, :, 1] > 150)
                & (cell_i[:, :, 2] > 150)
                & ((mx - mn) < 80)
            )
            lower_band = np.zeros(alpha.shape, dtype=bool)
            lower_band[330:, :] = True
            lower_components = [
                c
                for c in connected_components(bright_low_sat & lower_band)
                if (
                    c["maxX"] - c["minX"] + 1 >= 40
                    and c["maxY"] - c["minY"] + 1 <= 8
                    and c["area"] >= 40
                )
                or (
                    c["minY"] >= CELL_H - 55
                    and c["maxX"] - c["minX"] + 1 >= 5
                    and c["maxY"] - c["minY"] + 1 <= 3
                    and c["area"] >= 4
                )
            ]
            vertical_components = [
                c
                for c in connected_components(bright_low_sat)
                if c["maxY"] - c["minY"] + 1 >= 20
                and c["maxX"] - c["minX"] + 1 <= 3
                and c["area"] >= 20
            ]
            grid_like_components = lower_components + vertical_components
            edge_mask = np.zeros(alpha.shape, dtype=bool)
            edge_mask[:EDGE_MARGIN, :] = True
            edge_mask[-EDGE_MARGIN:, :] = True
            edge_mask[:, :EDGE_MARGIN] = True
            edge_mask[:, -EDGE_MARGIN:] = True
            cell_edge_opaque = int((alpha & edge_mask).sum())

            top_bottom = np.zeros(alpha.shape, dtype=bool)
            top_bottom[:TOP_BOTTOM_FRAGMENT_MARGIN, :] = True
            top_bottom[-TOP_BOTTOM_FRAGMENT_MARGIN:, :] = True
            components = [
                c for c in connected_components(alpha & top_bottom) if c["area"] >= MIN_FRAGMENT_AREA
            ]

            is_trailing = col >= FRAME_COUNTS[row]
            record = {
                "row": row,
                "rowName": ROW_NAMES[row],
                "col": col,
                "activeFrame": not is_trailing,
                "opaquePixels": opaque,
                "opaqueMagentaPixels": magenta_count,
                "opaqueChromaGreenPixels": green_count,
                "previewGridFragments": grid_like_components,
                "cellEdgeOpaquePixels": cell_edge_opaque,
                "topBottomFragments": components,
            }
            cells.append(record)

            label = f"row {row} {ROW_NAMES[row]} col {col}"
            if magenta_count:
                failures.append(f"{label}: contains {magenta_count} opaque magenta pixels")
            if green_count:
                failures.append(f"{label}: contains {green_count} opaque chroma/green-spill pixels")
            if grid_like_components:
                failures.append(f"{label}: preview grid-line fragments detected: {grid_like_components}")
            if cell_edge_opaque:
                failures.append(f"{label}: {cell_edge_opaque} opaque pixels touch the {EDGE_MARGIN}px cell edge margin")
            if components:
                failures.append(f"{label}: top/bottom edge fragment components detected: {components}")
            if is_trailing and opaque and not components and not cell_edge_opaque:
                warnings.append(f"{label}: trailing cell is non-empty; visually confirm it is a clean held pose")

    return cells, failures, warnings


def make_contact_sheet(image: Image.Image, output_path: Path) -> None:
    scale = 0.22
    thumb_w = int(CELL_W * scale)
    thumb_h = int(CELL_H * scale)
    label_w = 160
    label_h = 20
    font = ImageFont.load_default()
    out = Image.new("RGBA", (label_w + COLS * thumb_w, ROWS * (thumb_h + label_h)), (28, 26, 34, 255))
    draw = ImageDraw.Draw(out)

    for row in range(ROWS):
        y = row * (thumb_h + label_h)
        draw.text((4, y + 4), f"{row}: {ROW_NAMES[row]} ({FRAME_COUNTS[row]})", fill=(232, 232, 238), font=font)
        for col in range(COLS):
            cell = image.crop((col * CELL_W, row * CELL_H, (col + 1) * CELL_W, (row + 1) * CELL_H))
            bg = Image.new("RGBA", cell.size, (42, 40, 50, 255))
            bg.alpha_composite(cell)
            thumb = bg.resize((thumb_w, thumb_h), Image.Resampling.NEAREST)
            x = label_w + col * thumb_w
            out.alpha_composite(thumb, (x, y + label_h))
            outline = (95, 92, 112, 255) if col < FRAME_COUNTS[row] else (170, 120, 80, 255)
            draw.rectangle((x, y + label_h, x + thumb_w - 1, y + label_h + thumb_h - 1), outline=outline)
            draw.text((x + 3, y + 4), str(col), fill=(210, 210, 218), font=font)

    output_path.parent.mkdir(parents=True, exist_ok=True)
    out.convert("RGB").save(output_path)


def validate(input_path: Path, out_dir: Path, root: Path) -> int:
    failures: list[str] = []
    warnings: list[str] = []
    if not input_path.exists():
        raise FileNotFoundError(input_path)

    image = Image.open(input_path)
    has_alpha = image.mode in ("RGBA", "LA") or "transparency" in image.info
    image_rgba = image.convert("RGBA")
    arr = np.array(image_rgba)
    alpha = arr[:, :, 3] > 0

    if image_rgba.size != (ATLAS_W, ATLAS_H):
        failures.append(f"PNG dimensions must be {ATLAS_W}x{ATLAS_H}; got {image_rgba.size[0]}x{image_rgba.size[1]}")
    if ATLAS_W // COLS != CELL_W or ATLAS_H // ROWS != CELL_H:
        failures.append("Internal contract error: atlas/cell/grid values do not divide cleanly")
    if not has_alpha:
        failures.append("PNG must include an alpha channel / transparent background")
    if not np.any(~alpha):
        failures.append("PNG has no transparent pixels; transparent background is required")

    edge = np.zeros(alpha.shape, dtype=bool)
    edge[0, :] = True
    edge[-1, :] = True
    edge[:, 0] = True
    edge[:, -1] = True
    outer_edge_opaque = int((alpha & edge).sum())
    if outer_edge_opaque:
        failures.append(f"Atlas outer edge has {outer_edge_opaque} opaque pixels")

    magenta = (
        (arr[:, :, 0] == MAGENTA[0])
        & (arr[:, :, 1] == MAGENTA[1])
        & (arr[:, :, 2] == MAGENTA[2])
        & alpha
    )
    magenta_count = int(magenta.sum())
    if magenta_count:
        failures.append(f"Atlas contains {magenta_count} opaque magenta pixels")
    arr_i = arr.astype(np.int16)
    green = (
        (arr_i[:, :, 3] > 0)
        & (arr_i[:, :, 1] > 50)
        & (arr_i[:, :, 0] < 150)
        & (arr_i[:, :, 2] < 150)
        & (arr_i[:, :, 1] - arr_i[:, :, 0] > 15)
        & (arr_i[:, :, 1] - arr_i[:, :, 2] > 15)
    )
    green_count = int(green.sum())
    if green_count:
        failures.append(f"Atlas contains {green_count} opaque chroma/green-spill pixels")

    cells, cell_failures, cell_warnings = analyze_cells(arr)
    failures.extend(cell_failures)
    warnings.extend(cell_warnings)

    out_dir.mkdir(parents=True, exist_ok=True)
    contact_path = out_dir / f"{input_path.stem}_contact.png"
    report_path = out_dir / f"{input_path.stem}_validation_report.json"
    make_contact_sheet(image_rgba, contact_path)

    report = {
        "input": rel_to_root(input_path, root),
        "status": "pass" if not failures else "fail",
        "contract": {
            "sheet": "Seris Sheet 4 - Air Normals",
            "atlas": [ATLAS_W, ATLAS_H],
            "cell": [CELL_W, CELL_H],
            "grid": [COLS, ROWS],
            "frameCounts": FRAME_COUNTS,
            "runtime": {
                "fixedSourceCells": True,
                "skipSanitize": True,
                "anchorX": 320,
                "baselineY": 406,
            },
        },
        "checks": {
            "actualSize": list(image_rgba.size),
            "hasAlpha": has_alpha,
            "transparentPixels": int((~alpha).sum()),
            "opaquePixels": int(alpha.sum()),
            "outerEdgeOpaquePixels": outer_edge_opaque,
            "opaqueChromaGreenPixels": green_count,
            "opaqueMagentaPixels": magenta_count,
        },
        "failures": failures,
        "warnings": warnings,
        "cells": cells,
        "contactSheet": rel_to_root(contact_path, root),
    }
    report_path.write_text(json.dumps(report, indent=2), encoding="utf-8")
    print(json.dumps({"status": report["status"], "report": str(report_path), "contactSheet": str(contact_path)}, indent=2))
    return 0 if not failures else 1


def main() -> int:
    parser = argparse.ArgumentParser(description="Validate Seris Sheet 4 revamp atlas.")
    parser.add_argument("input", type=Path, help="Path to generated Seris Sheet 4 PNG.")
    parser.add_argument(
        "--out-dir",
        type=Path,
        default=Path("assets/sprites/seris_revamp/validation"),
        help="Directory for validation report and contact sheet.",
    )
    args = parser.parse_args()
    root = Path(__file__).resolve().parents[1]
    return validate(args.input, args.out_dir, root)


if __name__ == "__main__":
    raise SystemExit(main())
