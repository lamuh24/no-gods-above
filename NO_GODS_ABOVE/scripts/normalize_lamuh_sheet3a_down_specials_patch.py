#!/usr/bin/env python3
"""Patch LAMUH Sheet 3A with a corrected Crown Rupture strip."""

from __future__ import annotations

import argparse
import json
from collections import deque
from pathlib import Path

from PIL import Image, ImageDraw


COLS = 8
ROWS = 3
DEST_CELL = 448
DEST_WIDTH = COLS * DEST_CELL
DEST_HEIGHT = ROWS * DEST_CELL
BASELINE_Y = 382

ROW_MAPPING = {
    "0": ["lamuh_low_mirror_cut", "low_mirror_cut"],
    "1": ["lamuh_ground_breaker", "ground_breaker"],
    "2": ["lamuh_crown_rupture", "crown_rupture"],
}


def is_checker_candidate(pixel: tuple[int, int, int, int]) -> bool:
    r, g, b, a = pixel
    if a <= 0:
        return True
    low_saturation = max(r, g, b) - min(r, g, b) <= 20
    return low_saturation and r >= 218 and g >= 218 and b >= 218


def is_white_coat_candidate(pixel: tuple[int, int, int, int]) -> bool:
    r, g, b, a = pixel
    return a > 0 and r >= 168 and g >= 162 and b >= 150 and max(r, g, b) - min(r, g, b) <= 82


def is_gold_candidate(pixel: tuple[int, int, int, int]) -> bool:
    r, g, b, a = pixel
    return a > 0 and r >= 165 and g >= 105 and b <= 135 and r - b >= 48


def is_cyan_candidate(pixel: tuple[int, int, int, int]) -> bool:
    r, g, b, a = pixel
    return a > 0 and b >= 128 and g >= 115 and b - r >= 28


def is_black_vfx_candidate(pixel: tuple[int, int, int, int]) -> bool:
    r, g, b, a = pixel
    return a > 0 and r <= 82 and g <= 78 and b <= 92


def source_cell_bounds(width: int, height: int, cols: int, rows: int, col: int, row: int) -> tuple[int, int, int, int]:
    return (
        round(col * width / cols),
        round(row * height / rows),
        round((col + 1) * width / cols),
        round((row + 1) * height / rows),
    )


def edge_connected_background(cell: Image.Image) -> set[tuple[int, int]]:
    width, height = cell.size
    pix = cell.load()
    seen: set[tuple[int, int]] = set()
    queue: deque[tuple[int, int]] = deque()

    def add(x: int, y: int) -> None:
        if (x, y) in seen:
            return
        if is_checker_candidate(pix[x, y]):
            seen.add((x, y))
            queue.append((x, y))

    for x in range(width):
        add(x, 0)
        add(x, height - 1)
    for y in range(height):
        add(0, y)
        add(width - 1, y)

    while queue:
        x, y = queue.popleft()
        for nx, ny in ((x + 1, y), (x - 1, y), (x, y + 1), (x, y - 1)):
            if nx < 0 or ny < 0 or nx >= width or ny >= height or (nx, ny) in seen:
                continue
            if is_checker_candidate(pix[nx, ny]):
                seen.add((nx, ny))
                queue.append((nx, ny))
    return seen


def clean_cell(cell: Image.Image) -> tuple[Image.Image, dict[str, int | list[int] | None]]:
    rgba = cell.convert("RGBA")
    pix = rgba.load()
    bg = edge_connected_background(rgba)
    for x, y in bg:
        pix[x, y] = (255, 255, 255, 0)

    # Remove any isolated checker remnants that were not edge-connected after slicing.
    for y in range(rgba.height):
        for x in range(rgba.width):
            if is_checker_candidate(pix[x, y]):
                pix[x, y] = (255, 255, 255, 0)

    bbox = rgba.getchannel("A").getbbox()
    return rgba, {"source_bbox": list(bbox) if bbox else None}


def count_pixels(img: Image.Image) -> dict[str, int]:
    rgba = img.convert("RGBA")
    pix = rgba.load()
    counts = {"alpha": 0, "white": 0, "gold": 0, "cyan": 0, "black": 0}
    for y in range(rgba.height):
        for x in range(rgba.width):
            pixel = pix[x, y]
            if pixel[3] <= 0:
                continue
            counts["alpha"] += 1
            if is_white_coat_candidate(pixel):
                counts["white"] += 1
            if is_gold_candidate(pixel):
                counts["gold"] += 1
            if is_cyan_candidate(pixel):
                counts["cyan"] += 1
            if is_black_vfx_candidate(pixel):
                counts["black"] += 1
    return counts


def align_to_cell(cleaned: Image.Image) -> tuple[Image.Image, dict[str, int | float | list[int] | None]]:
    alpha = cleaned.getchannel("A")
    bbox = alpha.getbbox()
    if not bbox:
        empty = Image.new("RGBA", (DEST_CELL, DEST_CELL), (0, 0, 0, 0))
        return empty, {"bbox": None, "foot_bottom": None, "alpha_pixels": 0}

    crop = cleaned.crop(bbox)
    fit = min((DEST_CELL - 8) / crop.width, (BASELINE_Y - 4) / crop.height, 1.0)
    if fit < 0.999:
        crop = crop.resize((max(1, round(crop.width * fit)), max(1, round(crop.height * fit))), Image.Resampling.LANCZOS)

    alpha = crop.getchannel("A")
    bbox2 = alpha.getbbox()
    if not bbox2:
        empty = Image.new("RGBA", (DEST_CELL, DEST_CELL), (0, 0, 0, 0))
        return empty, {"bbox": None, "foot_bottom": None, "alpha_pixels": 0}

    alpha_pix = alpha.load()
    bottom = bbox2[3] - 1
    foot_xs = []
    for y in range(max(bbox2[1], bottom - 24), bottom + 1):
        foot_xs.extend([x for x in range(bbox2[0], bbox2[2]) if alpha_pix[x, y] > 24])
    x_anchor = int(round(sum(foot_xs) / len(foot_xs))) if foot_xs else int(round((bbox2[0] + bbox2[2]) / 2))
    dx = DEST_CELL // 2 - x_anchor
    dy = BASELINE_Y - bottom
    if dx + bbox2[0] < 2:
        dx += 2 - (dx + bbox2[0])
    if dx + bbox2[2] > DEST_CELL - 2:
        dx -= (dx + bbox2[2]) - (DEST_CELL - 2)

    out = Image.new("RGBA", (DEST_CELL, DEST_CELL), (0, 0, 0, 0))
    out.alpha_composite(crop, (dx, dy))
    out_bbox = out.getchannel("A").getbbox()
    counts = count_pixels(out)
    return out, {
        "bbox": list(out_bbox) if out_bbox else None,
        "foot_bottom": out_bbox[3] - 1 if out_bbox else None,
        "alpha_pixels": counts["alpha"],
        "white_pixels": counts["white"],
        "gold_pixels": counts["gold"],
        "cyan_pixels": counts["cyan"],
        "black_pixels": counts["black"],
    }


def build_preview(atlas: Image.Image, output: Path) -> None:
    preview = Image.new("RGBA", atlas.size, (45, 48, 53, 255))
    preview.alpha_composite(atlas)
    draw = ImageDraw.Draw(preview)
    for x in range(0, atlas.width + 1, DEST_CELL):
        draw.line([(x, 0), (x, atlas.height)], fill=(100, 160, 255, 160), width=2)
    for y in range(0, atlas.height + 1, DEST_CELL):
        draw.line([(0, y), (atlas.width, y)], fill=(100, 160, 255, 160), width=2)
    for row in range(ROWS):
        y = row * DEST_CELL + BASELINE_Y
        draw.line([(0, y), (atlas.width, y)], fill=(255, 210, 60, 190), width=2)
    preview.save(output)


def extract_frame(sheet: Image.Image, cols: int, rows: int, col: int, row: int) -> Image.Image:
    return sheet.crop(source_cell_bounds(sheet.width, sheet.height, cols, rows, col, row))


def normalize(sheet3a_source: Path, crown_strip: Path, output: Path, report_path: Path, preview_path: Path) -> dict[str, object]:
    sheet = Image.open(sheet3a_source).convert("RGBA")
    strip = Image.open(crown_strip).convert("RGBA")
    atlas = Image.new("RGBA", (DEST_WIDTH, DEST_HEIGHT), (0, 0, 0, 0))
    cells = []

    for row in range(ROWS):
        for col in range(COLS):
            source_name = "sheet3a_rows_0_1" if row < 2 else "crown_rupture_strip"
            source_cell = extract_frame(sheet, 8, 3, col, row) if row < 2 else extract_frame(strip, 8, 1, col, 0)
            cleaned, source_metrics = clean_cell(source_cell)
            aligned, metrics = align_to_cell(cleaned)
            atlas.alpha_composite(aligned, (col * DEST_CELL, row * DEST_CELL))
            cells.append({"row": row, "col": col, "source": source_name, **source_metrics, **metrics})

    output.parent.mkdir(parents=True, exist_ok=True)
    atlas.save(output)
    build_preview(atlas, preview_path)

    alpha = atlas.getchannel("A")
    alpha_hist = alpha.histogram()
    foot_bottoms = [int(cell["foot_bottom"]) for cell in cells if isinstance(cell.get("foot_bottom"), int)]
    counts = count_pixels(atlas)
    occupied = sum(1 for cell in cells if int(cell.get("alpha_pixels") or 0) > 800)
    row2_bboxes = [cell["bbox"] for cell in cells if cell["row"] == 2 and isinstance(cell.get("bbox"), list)]
    row2_max_h = max((bbox[3] - bbox[1] for bbox in row2_bboxes), default=0)  # type: ignore[index]
    row2_max_w = max((bbox[2] - bbox[0] for bbox in row2_bboxes), default=0)  # type: ignore[index]

    report = {
        "sheet3a_source": str(sheet3a_source),
        "crown_rupture_strip": str(crown_strip),
        "sheet3a_source_size": [sheet.width, sheet.height],
        "crown_rupture_strip_size": [strip.width, strip.height],
        "output": str(output),
        "preview": str(preview_path),
        "output_size": [DEST_WIDTH, DEST_HEIGHT],
        "grid": {"cols": COLS, "rows": ROWS, "cell": DEST_CELL, "baselineY": BASELINE_Y},
        "row_mapping": ROW_MAPPING,
        "has_real_transparency": alpha.getextrema()[0] == 0 and alpha_hist[0] > 0,
        "transparent_pixels": alpha_hist[0],
        "opaque_or_semi_pixels": sum(alpha_hist[1:]),
        "occupied_cells": occupied,
        "white_coat_preserved": counts["white"] >= 6000 and all(int(cell.get("white_pixels") or 0) > 80 for cell in cells),
        "gold_vfx_preserved": counts["gold"] >= 5000,
        "cyan_vfx_preserved": counts["cyan"] >= 180,
        "black_vfx_preserved": counts["black"] >= 8000,
        "vfx_preserved": counts["gold"] >= 5000 and counts["cyan"] >= 180 and counts["black"] >= 8000,
        "large_crown_rupture_burst_preserved": row2_max_h >= 250 and row2_max_w >= 210,
        "total_counts": counts,
        "baseline_max_deviation": max((abs(y - BASELINE_Y) for y in foot_bottoms), default=None),
        "cells": cells,
    }
    report_path.parent.mkdir(parents=True, exist_ok=True)
    report_path.write_text(json.dumps(report, indent=2), encoding="utf-8")
    return report


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--sheet3a-source", required=True, type=Path)
    parser.add_argument("--crown-strip", required=True, type=Path)
    parser.add_argument(
        "--output",
        default=Path("assets/characters/lamuh/lamuh_sheet_3a_down_specials_patched_atlas.png"),
        type=Path,
    )
    parser.add_argument(
        "--report",
        default=Path("assets/characters/lamuh/lamuh_sheet_3a_down_specials_patched_report.json"),
        type=Path,
    )
    parser.add_argument(
        "--preview",
        default=Path("assets/characters/lamuh/lamuh_sheet_3a_down_specials_patched_preview.png"),
        type=Path,
    )
    args = parser.parse_args()

    report = normalize(args.sheet3a_source, args.crown_strip, args.output, args.report, args.preview)
    summary = {
        "sheet3a_source": report["sheet3a_source"],
        "crown_rupture_strip": report["crown_rupture_strip"],
        "output": report["output"],
        "output_size": report["output_size"],
        "has_real_transparency": report["has_real_transparency"],
        "occupied_cells": report["occupied_cells"],
        "white_coat_preserved": report["white_coat_preserved"],
        "vfx_preserved": report["vfx_preserved"],
        "large_crown_rupture_burst_preserved": report["large_crown_rupture_burst_preserved"],
        "baseline_max_deviation": report["baseline_max_deviation"],
    }
    print(json.dumps(summary, indent=2))

    if report["output_size"] != [DEST_WIDTH, DEST_HEIGHT]:
        return 2
    if not report["has_real_transparency"]:
        return 3
    if report["occupied_cells"] != COLS * ROWS:
        return 4
    if not report["white_coat_preserved"]:
        return 5
    if not report["vfx_preserved"]:
        return 6
    if not report["large_crown_rupture_burst_preserved"]:
        return 7
    if report["baseline_max_deviation"] is not None and report["baseline_max_deviation"] > 6:
        return 8
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
