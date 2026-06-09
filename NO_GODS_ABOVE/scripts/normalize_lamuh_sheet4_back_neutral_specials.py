#!/usr/bin/env python3
"""Normalize LAMUH Sheet 4 Back + Neutral Specials into runtime cells."""

from __future__ import annotations

import argparse
import json
from pathlib import Path

from PIL import Image, ImageDraw


COLS = 8
ROWS = 6
DEST_CELL = 448
BASELINE_Y = 382
DEST_SIZE = (COLS * DEST_CELL, ROWS * DEST_CELL)

ROW_MAPPING = {
    "0": ["lamuh_mirror_slip", "mirror_slip"],
    "1": ["lamuh_rebound_strike", "rebound_strike"],
    "2": ["lamuh_mirror_reversal", "mirror_reversal"],
    "3": ["lamuh_mirror_spark", "mirror_spark"],
    "4": ["lamuh_mirror_pulse", "mirror_pulse"],
    "5": ["lamuh_crown_beam", "crown_beam"],
}


def source_cell_bounds(width: int, height: int, col: int, row: int) -> tuple[int, int, int, int]:
    return (
        round(col * width / COLS),
        round(row * height / ROWS),
        round((col + 1) * width / COLS),
        round((row + 1) * height / ROWS),
    )


def is_green_bg(pixel: tuple[int, int, int, int]) -> bool:
    r, g, b, a = pixel
    if a <= 0:
        return True
    if g >= 135 and g - r >= 55 and g - b >= 45 and r <= 110 and b <= 130:
        return True
    return g >= 92 and g - r >= 24 and g - b >= 18 and r <= 145 and b <= 150


def is_white_candidate(pixel: tuple[int, int, int, int]) -> bool:
    r, g, b, a = pixel
    return a > 0 and r >= 150 and g >= 145 and b >= 132 and max(r, g, b) - min(r, g, b) <= 95


def is_skin_candidate(pixel: tuple[int, int, int, int]) -> bool:
    r, g, b, a = pixel
    return a > 0 and 55 <= r <= 190 and 24 <= g <= 130 and 5 <= b <= 95 and r > g and g >= b - 12


def is_dark_candidate(pixel: tuple[int, int, int, int]) -> bool:
    r, g, b, a = pixel
    return a > 0 and r <= 92 and g <= 90 and b <= 100


def is_gold_candidate(pixel: tuple[int, int, int, int]) -> bool:
    r, g, b, a = pixel
    return a > 0 and r >= 135 and 70 <= g <= 190 and b <= 130 and r - b >= 35


def is_cyan_candidate(pixel: tuple[int, int, int, int]) -> bool:
    r, g, b, a = pixel
    return a > 0 and b >= 125 and g >= 105 and b - r >= 25


def count_pixels(img: Image.Image) -> dict[str, int]:
    rgba = img.convert("RGBA")
    pix = rgba.load()
    counts = {"alpha": 0, "white": 0, "skin": 0, "dark": 0, "gold": 0, "cyan": 0, "green": 0}
    for y in range(rgba.height):
        for x in range(rgba.width):
            pixel = pix[x, y]
            if pixel[3] <= 0:
                continue
            counts["alpha"] += 1
            if is_white_candidate(pixel):
                counts["white"] += 1
            if is_skin_candidate(pixel):
                counts["skin"] += 1
            if is_dark_candidate(pixel):
                counts["dark"] += 1
            if is_gold_candidate(pixel):
                counts["gold"] += 1
            if is_cyan_candidate(pixel):
                counts["cyan"] += 1
            if is_green_bg(pixel):
                counts["green"] += 1
    return counts


def body_bbox(img: Image.Image) -> tuple[int, int, int, int] | None:
    rgba = img.convert("RGBA")
    pix = rgba.load()
    skin_x: list[int] = []
    skin_y: list[int] = []
    cand_x: list[int] = []
    cand_y: list[int] = []
    for y in range(rgba.height):
        for x in range(rgba.width):
            pixel = pix[x, y]
            if pixel[3] <= 0 or is_cyan_candidate(pixel):
                continue
            is_skin = is_skin_candidate(pixel)
            if is_skin:
                skin_x.append(x)
                skin_y.append(y)
            if is_skin or is_white_candidate(pixel) or is_dark_candidate(pixel) or is_gold_candidate(pixel):
                cand_x.append(x)
                cand_y.append(y)
    if not cand_x:
        return None
    if not skin_x:
        return min(cand_x), min(cand_y), max(cand_x) + 1, max(cand_y) + 1

    sx1, sx2 = min(skin_x), max(skin_x) + 1
    sy1, sy2 = min(skin_y), max(skin_y) + 1
    wx1 = max(0, sx1 - 170)
    wx2 = min(rgba.width, sx2 + 170)
    wy1 = max(0, sy1 - 90)
    wy2 = min(rgba.height, sy2 + 330)
    xs = [x for x, y in zip(cand_x, cand_y) if wx1 <= x < wx2 and wy1 <= y < wy2]
    ys = [y for x, y in zip(cand_x, cand_y) if wx1 <= x < wx2 and wy1 <= y < wy2]
    if not xs:
        return sx1, sy1, sx2, sy2
    return min(xs), min(ys), max(xs) + 1, max(ys) + 1


def bbox_size(bbox: tuple[int, int, int, int] | list[int] | None) -> tuple[int, int]:
    if not bbox:
        return 0, 0
    return int(bbox[2] - bbox[0]), int(bbox[3] - bbox[1])


def remove_green(cell: Image.Image) -> Image.Image:
    rgba = cell.convert("RGBA")
    pix = rgba.load()
    for y in range(rgba.height):
        for x in range(rgba.width):
            r, g, b, a = pix[x, y]
            if is_green_bg((r, g, b, a)):
                pix[x, y] = (r, g, b, 0)
            elif g > r + 6 and g > b + 6 and g >= 48:
                # Despill the edge without erasing cyan effects.
                pix[x, y] = (r, max(r, b), b, a)
    return rgba


def paste_with_clip(out: Image.Image, img: Image.Image, dx: int, dy: int) -> None:
    sx1 = max(0, -dx)
    sy1 = max(0, -dy)
    sx2 = min(img.width, out.width - dx)
    sy2 = min(img.height, out.height - dy)
    if sx1 >= sx2 or sy1 >= sy2:
        return
    crop = img.crop((sx1, sy1, sx2, sy2))
    out.alpha_composite(crop, (max(0, dx), max(0, dy)))


def normalize_cell(cell: Image.Image) -> tuple[Image.Image, dict[str, int | float | list[int] | None]]:
    cleaned = remove_green(cell)
    source_bbox = cleaned.getchannel("A").getbbox()
    scaled = cleaned.resize((DEST_CELL, DEST_CELL), Image.Resampling.NEAREST)

    anchor_bbox = body_bbox(scaled) or scaled.getchannel("A").getbbox()
    dy = 0
    if anchor_bbox:
        dy = BASELINE_Y - (anchor_bbox[3] - 1)

    out = Image.new("RGBA", (DEST_CELL, DEST_CELL), (0, 0, 0, 0))
    paste_with_clip(out, scaled, 0, dy)
    alpha_bbox = out.getchannel("A").getbbox()
    final_body = body_bbox(out)
    counts = count_pixels(out)
    return out, {
        "source_bbox": list(source_bbox) if source_bbox else None,
        "bbox": list(alpha_bbox) if alpha_bbox else None,
        "body_bbox": list(final_body) if final_body else None,
        "body_bottom": final_body[3] - 1 if final_body else None,
        "baseline_deviation": abs((final_body[3] - 1) - BASELINE_Y) if final_body else None,
        "dy": dy,
        "alpha_pixels": counts["alpha"],
        "white_pixels": counts["white"],
        "skin_pixels": counts["skin"],
        "dark_pixels": counts["dark"],
        "gold_pixels": counts["gold"],
        "cyan_pixels": counts["cyan"],
        "green_pixels": counts["green"],
    }


def build_preview(atlas: Image.Image, preview_path: Path) -> None:
    preview = Image.new("RGBA", atlas.size, (36, 39, 43, 255))
    preview.alpha_composite(atlas)
    draw = ImageDraw.Draw(preview)
    for x in range(0, atlas.width + 1, DEST_CELL):
        draw.line([(x, 0), (x, atlas.height)], fill=(94, 150, 255, 150), width=2)
    for y in range(0, atlas.height + 1, DEST_CELL):
        draw.line([(0, y), (atlas.width, y)], fill=(94, 150, 255, 150), width=2)
    for row in range(ROWS):
        y = row * DEST_CELL + BASELINE_Y
        draw.line([(0, y), (atlas.width, y)], fill=(255, 214, 72, 200), width=2)
    preview_path.parent.mkdir(parents=True, exist_ok=True)
    preview.save(preview_path)


def collect_cell_metrics(atlas: Image.Image) -> list[dict[str, int | list[int] | None]]:
    cells: list[dict[str, int | list[int] | None]] = []
    for row in range(ROWS):
        for col in range(COLS):
            cell = atlas.crop((col * DEST_CELL, row * DEST_CELL, (col + 1) * DEST_CELL, (row + 1) * DEST_CELL))
            alpha_bbox = cell.getchannel("A").getbbox()
            body = body_bbox(cell)
            counts = count_pixels(cell)
            cells.append({
                "row": row,
                "col": col,
                "bbox": list(alpha_bbox) if alpha_bbox else None,
                "body_bbox": list(body) if body else None,
                "body_bottom": body[3] - 1 if body else None,
                "baseline_deviation": abs((body[3] - 1) - BASELINE_Y) if body else None,
                "alpha_pixels": counts["alpha"],
                "white_pixels": counts["white"],
                "skin_pixels": counts["skin"],
                "dark_pixels": counts["dark"],
                "gold_pixels": counts["gold"],
                "cyan_pixels": counts["cyan"],
                "green_pixels": counts["green"],
            })
    return cells


def row_summary(cells: list[dict[str, int | list[int] | None]]) -> list[dict[str, object]]:
    rows: list[dict[str, object]] = []
    for row in range(ROWS):
        row_cells = [c for c in cells if c["row"] == row]
        body_heights = [bbox_size(c.get("body_bbox"))[1] for c in row_cells if bbox_size(c.get("body_bbox"))[1] > 0]
        rows.append({
            "row": row,
            "aliases": ROW_MAPPING[str(row)],
            "min_body_height": min(body_heights) if body_heights else 0,
            "median_body_height": sorted(body_heights)[len(body_heights) // 2] if body_heights else 0,
            "max_body_height": max(body_heights) if body_heights else 0,
        })
    return rows


def sheet1_reference(sheet1: Path) -> dict[str, object]:
    ref = Image.open(sheet1).convert("RGBA")
    heights: list[int] = []
    for row in (0, 3, 4, 5):
        for col in range(COLS):
            cell = ref.crop((col * DEST_CELL, row * DEST_CELL, (col + 1) * DEST_CELL, (row + 1) * DEST_CELL))
            h = bbox_size(body_bbox(cell))[1]
            if h:
                heights.append(h)
    return {
        "path": str(sheet1),
        "sample_rows": [0, 3, 4, 5],
        "median_body_height": sorted(heights)[len(heights) // 2] if heights else 0,
        "min_body_height": min(heights) if heights else 0,
        "max_body_height": max(heights) if heights else 0,
    }


def normalize(source: Path, output: Path, report_path: Path, preview_path: Path, sheet1: Path) -> dict[str, object]:
    src = Image.open(source).convert("RGBA")
    atlas = Image.new("RGBA", DEST_SIZE, (0, 0, 0, 0))
    cells: list[dict[str, int | float | list[int] | None]] = []
    for row in range(ROWS):
        for col in range(COLS):
            cell = src.crop(source_cell_bounds(src.width, src.height, col, row))
            normalized, metrics = normalize_cell(cell)
            atlas.alpha_composite(normalized, (col * DEST_CELL, row * DEST_CELL))
            cells.append({"row": row, "col": col, **metrics})

    output.parent.mkdir(parents=True, exist_ok=True)
    atlas.save(output)
    build_preview(atlas, preview_path)

    final_cells = collect_cell_metrics(atlas)
    counts = count_pixels(atlas)
    alpha = atlas.getchannel("A")
    hist = alpha.histogram()
    ref = sheet1_reference(sheet1)
    med = [bbox_size(c.get("body_bbox"))[1] for c in final_cells if bbox_size(c.get("body_bbox"))[1] > 0]
    final_median = sorted(med)[len(med) // 2] if med else 0
    ref_median = int(ref["median_body_height"] or 0)
    baseline_devs = [int(c["baseline_deviation"]) for c in final_cells if isinstance(c.get("baseline_deviation"), int)]

    report = {
        "source": str(source),
        "source_size": [src.width, src.height],
        "output": str(output),
        "preview": str(preview_path),
        "output_size": [atlas.width, atlas.height],
        "grid": {"cols": COLS, "rows": ROWS, "cell": DEST_CELL, "baselineY": BASELINE_Y},
        "row_mapping": ROW_MAPPING,
        "sheet1_reference": ref,
        "body_scale": {
            "final_median_body_height": final_median,
            "sheet1_median_body_height": ref_median,
            "ratio": round(final_median / ref_median, 3) if ref_median else None,
            "passes": bool(ref_median and final_median >= ref_median * 0.9),
        },
        "has_real_transparency": alpha.getextrema()[0] == 0 and hist[0] > 0,
        "transparent_pixels": hist[0],
        "opaque_or_semi_pixels": sum(hist[1:]),
        "green_background_removed": counts["green"] == 0,
        "green_pixels_remaining": counts["green"],
        "occupied_cells": sum(1 for c in final_cells if int(c.get("alpha_pixels") or 0) > 700),
        "source_sprite_components_detected": sum(1 for c in cells if int(c.get("alpha_pixels") or 0) > 700),
        "white_coat_preserved": counts["white"] >= 10000 and all(int(c.get("white_pixels") or 0) > 40 for c in final_cells),
        "black_outfit_locs_preserved": counts["dark"] >= 10000 and all(int(c.get("dark_pixels") or 0) > 50 for c in final_cells),
        "gold_cyan_white_vfx_preserved": counts["gold"] >= 5000 and counts["cyan"] >= 500 and counts["white"] >= 10000,
        "baseline_max_deviation": max(baseline_devs) if baseline_devs else None,
        "row_summary": row_summary(final_cells),
        "cells": final_cells,
    }
    report["validation_passed"] = (
        report["output_size"] == [DEST_SIZE[0], DEST_SIZE[1]]
        and report["has_real_transparency"]
        and report["green_background_removed"]
        and report["occupied_cells"] == 48
        and report["source_sprite_components_detected"] == 48
        and report["white_coat_preserved"]
        and report["black_outfit_locs_preserved"]
        and report["gold_cyan_white_vfx_preserved"]
        and report["body_scale"]["passes"]
        and isinstance(report["baseline_max_deviation"], int)
        and report["baseline_max_deviation"] <= 0
    )
    report_path.parent.mkdir(parents=True, exist_ok=True)
    report_path.write_text(json.dumps(report, indent=2), encoding="utf-8")
    return report


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument(
        "--source",
        type=Path,
        default=Path("NO_GODS_ABOVE/assets/characters/lamuh/sheet4_back_neutral_specials/lamuh_sheet_4_back_neutral_specials_generated_source.png"),
    )
    parser.add_argument(
        "--output",
        type=Path,
        default=Path("NO_GODS_ABOVE/assets/characters/lamuh/lamuh_sheet_4_back_neutral_specials_redesign_atlas.png"),
    )
    parser.add_argument(
        "--report",
        type=Path,
        default=Path("NO_GODS_ABOVE/assets/characters/lamuh/lamuh_sheet_4_back_neutral_specials_redesign_report.json"),
    )
    parser.add_argument(
        "--preview",
        type=Path,
        default=Path("NO_GODS_ABOVE/assets/characters/lamuh/lamuh_sheet_4_back_neutral_specials_redesign_preview.png"),
    )
    parser.add_argument(
        "--sheet1",
        type=Path,
        default=Path("NO_GODS_ABOVE/assets/characters/lamuh/lamuh_sheet_1_core_movement_redesign_atlas.png"),
    )
    args = parser.parse_args()
    report = normalize(args.source, args.output, args.report, args.preview, args.sheet1)
    print(json.dumps({
        "ok": report["validation_passed"],
        "output": report["output"],
        "output_size": report["output_size"],
        "occupied_cells": report["occupied_cells"],
        "source_sprite_components_detected": report["source_sprite_components_detected"],
        "body_scale": report["body_scale"],
        "baseline_max_deviation": report["baseline_max_deviation"],
        "report": str(args.report),
    }, indent=2))
    if not report["validation_passed"]:
        raise SystemExit(1)


if __name__ == "__main__":
    main()
