#!/usr/bin/env python3
"""Validate the Seris Sheet 2 Air Movement revamp atlas before runtime use."""

from __future__ import annotations

import argparse
import json
from pathlib import Path

import numpy as np
from PIL import Image, ImageDraw
from scipy import ndimage


ATLAS_W = 2304
ATLAS_H = 2304
CELL = 384
COLS = 6
ROWS = 6
FRAME_COUNTS = [4, 4, 4, 4, 6, 6]
ROW_NAMES = [
    "jump_up_rising",
    "jump_forward",
    "jump_back",
    "fall_neutral_air_drift",
    "air_dash_forward",
    "air_dash_back",
]


def top_bottom_fragments(alpha: np.ndarray) -> list[dict]:
    edge = np.zeros_like(alpha, dtype=bool)
    edge[:8, :] = alpha[:8, :] > 0
    edge[-8:, :] = alpha[-8:, :] > 0
    labels, _ = ndimage.label(edge)
    out = []
    for label_index, sli in enumerate(ndimage.find_objects(labels), start=1):
        if sli is None:
            continue
        area = int((labels[sli] == label_index).sum())
        if area < 12:
            continue
        y, x = sli
        out.append({"area": area, "minX": x.start, "minY": y.start, "maxX": x.stop - 1, "maxY": y.stop - 1})
    return out


def make_contact_sheet(image: Image.Image, out_path: Path) -> None:
    scale = 0.5
    cell_w = int(CELL * scale)
    label_w = 170
    header_h = 24
    row_h = int(CELL * scale) + header_h
    preview = Image.new("RGBA", (label_w + COLS * cell_w, ROWS * row_h), (31, 30, 39, 255))
    draw = ImageDraw.Draw(preview)
    for row in range(ROWS):
        y = row * row_h
        draw.text((4, y + 6), f"{row}: {ROW_NAMES[row]} ({FRAME_COUNTS[row]})", fill=(235, 235, 235, 255))
        for col in range(COLS):
            x = label_w + col * cell_w
            draw.text((x + 3, y + 4), str(col), fill=(235, 235, 235, 255))
            cell = image.crop((col * CELL, row * CELL, (col + 1) * CELL, (row + 1) * CELL))
            checker = Image.new("RGBA", (CELL, CELL), (46, 44, 55, 255))
            cell_comp = Image.alpha_composite(checker, cell)
            preview_cell = cell_comp.resize((cell_w, cell_w), Image.Resampling.NEAREST)
            preview.alpha_composite(preview_cell, (x, y + header_h))
            color = (110, 105, 128, 255) if col < FRAME_COUNTS[row] else (190, 110, 55, 255)
            draw.rectangle((x, y + header_h, x + cell_w - 1, y + header_h + cell_w - 1), outline=color)
    out_path.parent.mkdir(parents=True, exist_ok=True)
    preview.save(out_path)


def validate(path: Path, report_path: Path, contact_path: Path) -> dict:
    failures = []
    warnings = []
    image = Image.open(path).convert("RGBA")
    arr = np.asarray(image)
    alpha = arr[:, :, 3]
    rgb = arr[:, :, :3]

    if image.size != (ATLAS_W, ATLAS_H):
        failures.append(f"PNG dimensions must be {ATLAS_W}x{ATLAS_H}; got {image.width}x{image.height}")

    transparent = int((alpha == 0).sum())
    opaque = int((alpha > 0).sum())
    edge = np.concatenate([alpha[0, :], alpha[-1, :], alpha[:, 0], alpha[:, -1]])
    outer_edge_opaque = int((edge > 0).sum())
    if transparent == 0:
        failures.append("Transparent background is required")
    if outer_edge_opaque:
        failures.append(f"Atlas outer edge has {outer_edge_opaque} opaque pixels")

    rgb_i = rgb.astype(np.int16)
    r = rgb_i[:, :, 0]
    g = rgb_i[:, :, 1]
    b = rgb_i[:, :, 2]
    opaque_green = int(((alpha > 0) & (g > 50) & (r < 150) & (b < 150) & (g - r > 15) & (g - b > 15)).sum())
    opaque_magenta = int(((alpha > 0) & (r > 220) & (g < 40) & (b > 220)).sum())
    if opaque_green:
        failures.append(f"Opaque chroma/green-spill pixels remain: {opaque_green}")
    if opaque_magenta:
        failures.append(f"Opaque magenta pixels remain: {opaque_magenta}")

    cells = []
    if image.size == (ATLAS_W, ATLAS_H):
        for row in range(ROWS):
            for col in range(COLS):
                active = col < FRAME_COUNTS[row]
                cell_alpha = alpha[row * CELL : (row + 1) * CELL, col * CELL : (col + 1) * CELL]
                count = int((cell_alpha > 0).sum())
                margin = np.zeros_like(cell_alpha, dtype=bool)
                margin[:4, :] = True
                margin[-4:, :] = True
                margin[:, :4] = True
                margin[:, -4:] = True
                edge_count = int(((cell_alpha > 0) & margin).sum())
                frags = top_bottom_fragments(cell_alpha)
                if active and count == 0:
                    failures.append(f"row {row} {ROW_NAMES[row]} col {col}: active frame is empty")
                if not active and count > 0:
                    warnings.append(f"row {row} {ROW_NAMES[row]} col {col}: trailing cell contains held pose ({count} opaque pixels)")
                if edge_count:
                    failures.append(f"row {row} {ROW_NAMES[row]} col {col}: {edge_count} opaque pixels touch the 4px cell edge margin")
                if frags:
                    failures.append(f"row {row} {ROW_NAMES[row]} col {col}: top/bottom edge fragments detected: {frags}")
                cells.append(
                    {
                        "row": row,
                        "rowName": ROW_NAMES[row],
                        "col": col,
                        "activeFrame": active,
                        "opaquePixels": count,
                        "cellEdgeOpaquePixels": edge_count,
                        "topBottomFragments": frags,
                    }
                )

    make_contact_sheet(image, contact_path)
    report = {
        "input": str(path),
        "status": "fail" if failures else "pass",
        "contract": {
            "sheet": "Seris Sheet 2 - Air Movement",
            "atlas": [ATLAS_W, ATLAS_H],
            "cell": [CELL, CELL],
            "grid": [COLS, ROWS],
            "frameCounts": FRAME_COUNTS,
            "runtime": {"fixedSourceCells": True, "skipSanitize": True, "baselineY": 350},
        },
        "checks": {
            "actualSize": [image.width, image.height],
            "transparentPixels": transparent,
            "opaquePixels": opaque,
            "outerEdgeOpaquePixels": outer_edge_opaque,
            "opaqueChromaGreenPixels": opaque_green,
            "opaqueMagentaPixels": opaque_magenta,
        },
        "failures": failures,
        "warnings": warnings,
        "cells": cells,
        "contactSheet": str(contact_path),
    }
    report_path.parent.mkdir(parents=True, exist_ok=True)
    report_path.write_text(json.dumps(report, indent=2), encoding="utf-8")
    return report


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("input", type=Path)
    parser.add_argument("--report", type=Path)
    parser.add_argument("--contact-sheet", type=Path)
    args = parser.parse_args()
    stem = args.input.stem
    report = args.report or Path("assets/sprites/seris_revamp/validation") / f"{stem}_validation_report.json"
    contact = args.contact_sheet or Path("assets/sprites/seris_revamp/validation") / f"{stem}_contact.png"
    result = validate(args.input, report, contact)
    print(json.dumps({"status": result["status"], "report": str(report), "contactSheet": str(contact)}, indent=2))
    return 1 if result["status"] == "fail" else 0


if __name__ == "__main__":
    raise SystemExit(main())
