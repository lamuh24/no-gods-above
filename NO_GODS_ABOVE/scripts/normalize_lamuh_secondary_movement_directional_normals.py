#!/usr/bin/env python3
"""Normalize LAMUH secondary movement/directional normals source into runtime cells."""

from __future__ import annotations

import json
from pathlib import Path
from statistics import median

from PIL import Image, ImageDraw


COLS = 8
ROWS = 6
CELL = 448
BASELINE_Y = 382
DEST_SIZE = (COLS * CELL, ROWS * CELL)

ROOT = Path(__file__).resolve().parents[1]
SOURCE = ROOT / "assets" / "characters" / "lamuh" / "secondary_movement_directional_normals" / "lamuh_secondary_movement_directional_normals_source.png"
OUTPUT = ROOT / "assets" / "characters" / "lamuh" / "lamuh_sheet_secondary_movement_directional_normals_atlas.png"
PREVIEW = ROOT / "assets" / "characters" / "lamuh" / "lamuh_sheet_secondary_movement_directional_normals_preview.png"
REPORT = ROOT / "assets" / "characters" / "lamuh" / "lamuh_sheet_secondary_movement_directional_normals_report.json"
SHEET1_REPORT = ROOT / "assets" / "characters" / "lamuh" / "lamuh_sheet_1_core_movement_redesign_report.json"

ROW_MAPPING = {
    "0": ["lamuh_walk_back", "walk_back"],
    "1": ["lamuh_dash_back", "dash_back"],
    "2": ["lamuh_crouch", "crouch", "low_stance"],
    "3": ["forward_light", "forward_medium", "forward_heavy"],
    "4": ["back_light", "back_medium", "back_heavy"],
    "5": ["air_dash_forward", "air_dash_back", "air_recovery", "fall_transition"],
}

FRAME_RANGES = {
    "forward_light": [0, 2],
    "forward_medium": [3, 5],
    "forward_heavy": [6, 7],
    "back_light": [0, 2],
    "back_medium": [3, 5],
    "back_heavy": [6, 7],
    "air_dash_forward": [0, 2],
    "air_dash_back": [3, 5],
    "air_recovery": [6, 7],
    "fall_transition": [6, 7],
}


def source_cell_bounds(width: int, height: int, col: int, row: int) -> tuple[int, int, int, int]:
    return (
        round(col * width / COLS),
        round(row * height / ROWS),
        round((col + 1) * width / COLS),
        round((row + 1) * height / ROWS),
    )


def is_green_key(pixel: tuple[int, int, int, int]) -> bool:
    r, g, b, a = pixel
    if a <= 0:
        return False
    cyan_or_blue_accent = b >= 135 and b >= g - 18
    return g >= 100 and r <= 145 and b <= 170 and g - r >= 28 and g - b >= 22 and not cyan_or_blue_accent


def remove_chroma(cell: Image.Image) -> Image.Image:
    rgba = cell.convert("RGBA")
    pix = rgba.load()
    for y in range(rgba.height):
        for x in range(rgba.width):
            r, g, b, a = pix[x, y]
            if is_green_key((r, g, b, a)):
                pix[x, y] = (255, 255, 255, 0)
            elif a > 0 and g >= max(r, b) + 8 and g >= 72 and not (b >= 110 and b >= g - 15):
                neutral_g = min(g, max(r, b))
                pix[x, y] = (r, neutral_g, b, a)
    return rgba


def bbox_alpha(img: Image.Image) -> tuple[int, int, int, int] | None:
    return img.getchannel("A").getbbox()


def count_pixels(img: Image.Image) -> dict[str, int]:
    counts = {"alpha": 0, "white": 0, "dark": 0, "gold": 0, "cyan": 0, "green": 0}
    for r, g, b, a in img.convert("RGBA").getdata():
        if a <= 8:
            continue
        counts["alpha"] += 1
        if r >= 150 and g >= 145 and b >= 130 and max(r, g, b) - min(r, g, b) <= 115:
            counts["white"] += 1
        if r <= 115 and g <= 115 and b <= 125:
            counts["dark"] += 1
        if r >= 125 and 55 <= g <= 225 and b <= 170 and r - b >= 18:
            counts["gold"] += 1
        if b >= 110 and g >= 90 and b - r >= 12:
            counts["cyan"] += 1
        if g >= 130 and r <= 120 and b <= 135 and g - max(r, b) >= 38:
            counts["green"] += 1
    return counts


def sheet1_reference_height() -> float:
    if not SHEET1_REPORT.exists():
        return 371.0
    report = json.loads(SHEET1_REPORT.read_text(encoding="utf-8"))
    heights = []
    for cell in report.get("cells", []):
        if cell.get("row") == 0 and cell.get("bbox"):
            left, top, right, bottom = cell["bbox"]
            heights.append(bottom - top)
    return float(median(heights)) if heights else 371.0


def place_frame(
    dest: Image.Image,
    cleaned_cell: Image.Image,
    src_bbox: tuple[int, int, int, int],
    row: int,
    col: int,
    global_scale: float,
) -> dict[str, object]:
    crop = cleaned_cell.crop(src_bbox)
    bbox_w = src_bbox[2] - src_bbox[0]
    bbox_h = src_bbox[3] - src_bbox[1]
    max_w = CELL - 6
    max_h = BASELINE_Y - 2
    scale = min(global_scale, max_w / max(1, bbox_w), max_h / max(1, bbox_h))
    out_w = max(1, round(crop.width * scale))
    out_h = max(1, round(crop.height * scale))
    resized = crop.resize((out_w, out_h), Image.Resampling.LANCZOS)
    cell_x = col * CELL
    cell_y = row * CELL
    x = cell_x + (CELL - out_w) // 2
    y = cell_y + BASELINE_Y - out_h
    x = max(cell_x + 1, min(cell_x + CELL - out_w - 1, x))
    y = max(cell_y + 1, min(cell_y + CELL - out_h - 1, y))
    dest.alpha_composite(resized, (x, y))
    placed_bbox = bbox_alpha(resized)
    if placed_bbox:
        left, top, right, bottom = placed_bbox
        final_bbox = [x - cell_x + left, y - cell_y + top, x - cell_x + right, y - cell_y + bottom]
    else:
        final_bbox = None
    counts = count_pixels(resized)
    return {
        "row": row,
        "col": col,
        "source_bbox": list(src_bbox),
        "source_body_height": bbox_h,
        "scale": scale,
        "bbox": final_bbox,
        "alpha_pixels": counts["alpha"],
        "white_pixels": counts["white"],
        "dark_pixels": counts["dark"],
        "gold_pixels": counts["gold"],
        "cyan_pixels": counts["cyan"],
        "green_pixels_after_cleanup": counts["green"],
        "baseline_delta": (final_bbox[3] - BASELINE_Y) if final_bbox else None,
    }


def make_preview(atlas: Image.Image) -> Image.Image:
    preview = atlas.copy()
    draw = ImageDraw.Draw(preview)
    for col in range(COLS + 1):
        x = col * CELL
        draw.line((x, 0, x, DEST_SIZE[1]), fill=(255, 255, 255, 96), width=2)
    for row in range(ROWS + 1):
        y = row * CELL
        draw.line((0, y, DEST_SIZE[0], y), fill=(255, 255, 255, 96), width=2)
    for row in range(ROWS):
        y = row * CELL + BASELINE_Y
        draw.line((0, y, DEST_SIZE[0], y), fill=(255, 96, 96, 130), width=1)
    return preview.resize((DEST_SIZE[0] // 2, DEST_SIZE[1] // 2), Image.Resampling.LANCZOS)


def main() -> None:
    if not SOURCE.exists():
        raise FileNotFoundError(SOURCE)
    src = Image.open(SOURCE).convert("RGBA")
    cleaned_cells: list[dict[str, object]] = []
    row0_heights: list[int] = []

    for row in range(ROWS):
        for col in range(COLS):
            bounds = source_cell_bounds(src.width, src.height, col, row)
            cleaned = remove_chroma(src.crop(bounds))
            bbox = bbox_alpha(cleaned)
            if not bbox:
                cleaned_cells.append({"row": row, "col": col, "bounds": bounds, "cleaned": cleaned, "bbox": None})
                continue
            if row == 0:
                row0_heights.append(bbox[3] - bbox[1])
            cleaned_cells.append({"row": row, "col": col, "bounds": bounds, "cleaned": cleaned, "bbox": bbox})

    reference_height = sheet1_reference_height()
    row0_source_height = float(median(row0_heights)) if row0_heights else 160.0
    global_scale = reference_height / max(1.0, row0_source_height)

    atlas = Image.new("RGBA", DEST_SIZE, (255, 255, 255, 0))
    cell_reports: list[dict[str, object]] = []
    for item in cleaned_cells:
        row = int(item["row"])
        col = int(item["col"])
        bbox = item["bbox"]
        if bbox is None:
            cell_reports.append({"row": row, "col": col, "bbox": None, "alpha_pixels": 0, "baseline_delta": None})
            continue
        cell_reports.append(place_frame(atlas, item["cleaned"], bbox, row, col, global_scale))

    OUTPUT.parent.mkdir(parents=True, exist_ok=True)
    atlas.save(OUTPUT)
    make_preview(atlas).save(PREVIEW)

    alpha_extrema = atlas.getchannel("A").getextrema()
    occupied = [cell for cell in cell_reports if cell.get("alpha_pixels", 0) > 0]
    baseline_deltas = [abs(int(cell["baseline_delta"])) for cell in occupied if cell.get("baseline_delta") is not None and int(cell["row"]) != 5]
    white_ok = all(int(cell.get("white_pixels", 0)) > 1000 for cell in occupied)
    dark_ok = all(int(cell.get("dark_pixels", 0)) > 1000 for cell in occupied)
    corner_alpha = [
        atlas.getpixel((0, 0))[3],
        atlas.getpixel((DEST_SIZE[0] - 1, 0))[3],
        atlas.getpixel((0, DEST_SIZE[1] - 1))[3],
        atlas.getpixel((DEST_SIZE[0] - 1, DEST_SIZE[1] - 1))[3],
    ]
    bg_removed = all(alpha == 0 for alpha in corner_alpha)
    body_heights = [cell["bbox"][3] - cell["bbox"][1] for cell in occupied if cell.get("bbox")]
    report = {
        "ok": False,
        "source": str(SOURCE),
        "source_size": [src.width, src.height],
        "output": str(OUTPUT.relative_to(ROOT)),
        "output_size": [DEST_SIZE[0], DEST_SIZE[1]],
        "preview": str(PREVIEW.relative_to(ROOT)),
        "grid": {"cols": COLS, "rows": ROWS, "cell": CELL, "baselineY": BASELINE_Y},
        "row_mapping": ROW_MAPPING,
        "frame_ranges": FRAME_RANGES,
        "alpha_extrema": list(alpha_extrema),
        "has_real_transparency": alpha_extrema[0] == 0 and alpha_extrema[1] > 0,
        "checkerboard_or_chroma_removed": bg_removed,
        "transparent_corner_alpha": corner_alpha,
        "green_like_pixels_preserved_after_cleanup": sum(int(cell.get("green_pixels_after_cleanup", 0)) for cell in occupied),
        "occupied_cells": len(occupied),
        "source_sprite_slots_detected": sum(1 for cell in cleaned_cells if cell.get("bbox") is not None),
        "white_coat_preserved": white_ok,
        "black_outfit_locs_preserved": dark_ok,
        "gold_cyan_accents_preserved": sum(int(cell.get("gold_pixels", 0)) + int(cell.get("cyan_pixels", 0)) for cell in occupied) > 4000,
        "sheet1_reference_body_height": reference_height,
        "source_row0_median_body_height": row0_source_height,
        "global_scale": global_scale,
        "output_body_height_median": float(median(body_heights)) if body_heights else 0,
        "body_scale_ratio_vs_sheet1": (float(median(body_heights)) / reference_height) if body_heights and reference_height else 0,
        "grounded_baseline_max_deviation": max(baseline_deltas) if baseline_deltas else None,
        "cells": cell_reports,
    }
    report["ok"] = (
        report["output_size"] == [3584, 2688]
        and report["grid"] == {"cols": 8, "rows": 6, "cell": 448, "baselineY": 382}
        and report["has_real_transparency"]
        and report["checkerboard_or_chroma_removed"]
        and report["occupied_cells"] == 48
        and report["source_sprite_slots_detected"] == 48
        and report["white_coat_preserved"]
        and report["black_outfit_locs_preserved"]
        and report["gold_cyan_accents_preserved"]
        and report["grounded_baseline_max_deviation"] == 0
        and 0.86 <= report["body_scale_ratio_vs_sheet1"] <= 1.12
    )
    REPORT.write_text(json.dumps(report, indent=2), encoding="utf-8")
    print(json.dumps({"ok": report["ok"], "output": report["output"], "report": str(REPORT.relative_to(ROOT))}, indent=2))
    if not report["ok"]:
        raise SystemExit(1)


if __name__ == "__main__":
    main()
