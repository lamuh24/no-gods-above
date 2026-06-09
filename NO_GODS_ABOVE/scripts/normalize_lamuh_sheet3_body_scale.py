#!/usr/bin/env python3
"""Rebuild LAMUH Sheet 3 with body-scale priority over full VFX containment."""

from __future__ import annotations

import argparse
import json
from pathlib import Path

from PIL import Image, ImageDraw

from normalize_lamuh_sheet3a_down_specials_patch import (
    BASELINE_Y,
    COLS,
    DEST_CELL,
    clean_cell,
    count_pixels,
    source_cell_bounds,
)
from normalize_lamuh_sheet3b_up_specials import (
    FINAL_ROW_MAPPING,
    remove_top_crop_artifacts,
)


ROWS_3A = 3
ROWS_FINAL = 6
DEST_WIDTH = COLS * DEST_CELL
DEST_HEIGHT_3A = ROWS_3A * DEST_CELL
DEST_HEIGHT_FINAL = ROWS_FINAL * DEST_CELL

# These scales deliberately ignore far VFX extents. The earlier normalizer capped
# source crops at 1.0, which kept LAMUH much smaller than the approved Sheet 1 body.
ROW_SCALE = {
    0: 1.8,   # Low Mirror Cut crouches low, but should not become miniature.
    1: 1.75,  # Ground Breaker keeps a larger planted body.
    2: 1.45,  # Crown Rupture has the largest ground burst, so allow mild VFX crop.
    3: 1.55,  # Crown Pop is mostly grounded/upright.
    4: 1.45,  # Rising Crown has tall vertical trails.
    5: 1.55,  # Ascendant Break needs a strong body read even with the burst.
}


def is_white_body(pixel: tuple[int, int, int, int]) -> bool:
    r, g, b, a = pixel
    return a > 0 and r >= 140 and g >= 135 and b >= 125 and max(r, g, b) - min(r, g, b) <= 95


def is_skin_body(pixel: tuple[int, int, int, int]) -> bool:
    r, g, b, a = pixel
    return a > 0 and 65 <= r <= 175 and 30 <= g <= 120 and 10 <= b <= 90 and r > g and g >= b - 8


def is_dark_body(pixel: tuple[int, int, int, int]) -> bool:
    r, g, b, a = pixel
    return a > 0 and r <= 86 and g <= 82 and b <= 92


def is_gold_body(pixel: tuple[int, int, int, int]) -> bool:
    r, g, b, a = pixel
    return a > 0 and r >= 120 and 65 <= g <= 175 and b <= 105 and r - b >= 40


def is_cyan_vfx(pixel: tuple[int, int, int, int]) -> bool:
    r, g, b, a = pixel
    return a > 0 and b >= 130 and g >= 110 and b - r >= 30


def mask_bbox(img: Image.Image, predicate) -> tuple[int, int, int, int] | None:
    pix = img.load()
    xs: list[int] = []
    ys: list[int] = []
    for y in range(img.height):
        for x in range(img.width):
            if predicate(pix[x, y]):
                xs.append(x)
                ys.append(y)
    if not xs:
        return None
    return min(xs), min(ys), max(xs) + 1, max(ys) + 1


def body_bbox(img: Image.Image) -> tuple[int, int, int, int] | None:
    pix = img.load()
    skin_xs: list[int] = []
    skin_ys: list[int] = []
    cand_xs: list[int] = []
    cand_ys: list[int] = []
    for y in range(img.height):
        for x in range(img.width):
            p = pix[x, y]
            if p[3] <= 0 or is_cyan_vfx(p):
                continue
            is_skin = is_skin_body(p)
            if is_skin:
                skin_xs.append(x)
                skin_ys.append(y)
            if is_skin or is_white_body(p) or is_dark_body(p) or is_gold_body(p):
                cand_xs.append(x)
                cand_ys.append(y)
    if not cand_xs:
        return None
    if not skin_xs:
        return mask_bbox(img, lambda p: (is_white_body(p) or is_dark_body(p) or is_gold_body(p)) and not is_cyan_vfx(p))

    sx1, sx2 = min(skin_xs), max(skin_xs) + 1
    sy1, sy2 = min(skin_ys), max(skin_ys) + 1
    # Keep the body window tied to face/hands. This catches coat, hair, pants,
    # and feet while dropping far ground cracks and vertical crown effects.
    wx1 = max(0, sx1 - 170)
    wx2 = min(img.width, sx2 + 170)
    wy1 = max(0, sy1 - 90)
    wy2 = min(img.height, sy2 + 330)
    xs = [x for x, y in zip(cand_xs, cand_ys) if wx1 <= x < wx2 and wy1 <= y < wy2]
    ys = [y for x, y in zip(cand_xs, cand_ys) if wx1 <= x < wx2 and wy1 <= y < wy2]
    if not xs:
        return sx1, sy1, sx2, sy2
    return min(xs), min(ys), max(xs) + 1, max(ys) + 1


def bbox_size(bbox: tuple[int, int, int, int] | list[int] | None) -> tuple[int, int]:
    if not bbox:
        return 0, 0
    return int(bbox[2] - bbox[0]), int(bbox[3] - bbox[1])


def paste_scaled(out: Image.Image, scaled: Image.Image, dx: int, dy: int) -> None:
    out.paste(scaled, (dx, dy), scaled)


def align_body_scale(cleaned: Image.Image, row: int) -> tuple[Image.Image, dict[str, int | float | list[int] | None]]:
    alpha_bbox = cleaned.getchannel("A").getbbox()
    if not alpha_bbox:
        return Image.new("RGBA", (DEST_CELL, DEST_CELL), (0, 0, 0, 0)), {
            "bbox": None,
            "body_bbox": None,
            "scale": ROW_SCALE[row],
            "foot_bottom": None,
            "alpha_pixels": 0,
        }

    crop = cleaned.crop(alpha_bbox)
    scale = ROW_SCALE[row]
    scaled = crop.resize(
        (max(1, round(crop.width * scale)), max(1, round(crop.height * scale))),
        Image.Resampling.LANCZOS,
    )
    scaled_alpha_bbox = scaled.getchannel("A").getbbox()
    scaled_body_bbox = body_bbox(scaled) or scaled_alpha_bbox
    if not scaled_alpha_bbox or not scaled_body_bbox:
        return Image.new("RGBA", (DEST_CELL, DEST_CELL), (0, 0, 0, 0)), {
            "bbox": None,
            "body_bbox": None,
            "scale": scale,
            "foot_bottom": None,
            "alpha_pixels": 0,
        }

    body_center_x = (scaled_body_bbox[0] + scaled_body_bbox[2]) // 2
    # Ground effects can extend below the feet; anchoring alpha bottom keeps the floor lane stable.
    bottom = scaled_alpha_bbox[3] - 1
    dx = DEST_CELL // 2 - body_center_x
    dy = BASELINE_Y - bottom

    # Protect the body from being cropped, while allowing far VFX edges to clip first.
    if dx + scaled_body_bbox[0] < 4:
        dx += 4 - (dx + scaled_body_bbox[0])
    if dx + scaled_body_bbox[2] > DEST_CELL - 4:
        dx -= (dx + scaled_body_bbox[2]) - (DEST_CELL - 4)

    out = Image.new("RGBA", (DEST_CELL, DEST_CELL), (0, 0, 0, 0))
    paste_scaled(out, scaled, dx, dy)
    out_bbox = out.getchannel("A").getbbox()
    out_body_bbox = body_bbox(out)
    counts = count_pixels(out)
    return out, {
        "bbox": list(out_bbox) if out_bbox else None,
        "body_bbox": list(out_body_bbox) if out_body_bbox else None,
        "scale": scale,
        "foot_bottom": out_bbox[3] - 1 if out_bbox else None,
        "alpha_pixels": counts["alpha"],
        "white_pixels": counts["white"],
        "gold_pixels": counts["gold"],
        "cyan_pixels": counts["cyan"],
        "black_pixels": counts["black"],
    }


def extract_grid_cell(sheet: Image.Image, cols: int, rows: int, col: int, row: int) -> Image.Image:
    return sheet.crop(source_cell_bounds(sheet.width, sheet.height, cols, rows, col, row))


def build_preview(atlas: Image.Image, output: Path, rows: int) -> None:
    preview = Image.new("RGBA", atlas.size, (45, 48, 53, 255))
    preview.alpha_composite(atlas)
    draw = ImageDraw.Draw(preview)
    for x in range(0, atlas.width + 1, DEST_CELL):
        draw.line([(x, 0), (x, atlas.height)], fill=(100, 160, 255, 160), width=2)
    for y in range(0, atlas.height + 1, DEST_CELL):
        draw.line([(0, y), (atlas.width, y)], fill=(100, 160, 255, 160), width=2)
    for row in range(rows):
        y = row * DEST_CELL + BASELINE_Y
        draw.line([(0, y), (atlas.width, y)], fill=(255, 210, 60, 190), width=2)
    output.parent.mkdir(parents=True, exist_ok=True)
    preview.save(output)


def atlas_cells(atlas: Image.Image, rows: int) -> list[dict[str, int | float | list[int] | None]]:
    cells = []
    for row in range(rows):
        for col in range(COLS):
            cell = atlas.crop((col * DEST_CELL, row * DEST_CELL, (col + 1) * DEST_CELL, (row + 1) * DEST_CELL))
            alpha = cell.getchannel("A").getbbox()
            body = body_bbox(cell)
            counts = count_pixels(cell)
            cells.append({
                "row": row,
                "col": col,
                "bbox": list(alpha) if alpha else None,
                "body_bbox": list(body) if body else None,
                "alpha_pixels": counts["alpha"],
                "white_pixels": counts["white"],
                "gold_pixels": counts["gold"],
                "cyan_pixels": counts["cyan"],
                "black_pixels": counts["black"],
                "foot_bottom": alpha[3] - 1 if alpha else None,
            })
    return cells


def row_scale_summary(cells: list[dict[str, int | float | list[int] | None]]) -> list[dict[str, object]]:
    rows = []
    for row in range(ROWS_FINAL):
        row_cells = [c for c in cells if c["row"] == row]
        heights = [bbox_size(c.get("body_bbox"))[1] for c in row_cells if bbox_size(c.get("body_bbox"))[1] > 0]
        alpha_heights = [bbox_size(c.get("bbox"))[1] for c in row_cells if bbox_size(c.get("bbox"))[1] > 0]
        rows.append({
            "row": row,
            "min_body_height": min(heights) if heights else 0,
            "median_body_height": sorted(heights)[len(heights) // 2] if heights else 0,
            "max_body_height": max(heights) if heights else 0,
            "max_alpha_height": max(alpha_heights) if alpha_heights else 0,
            "smallest_frames": sorted(
                [(int(c["col"]), bbox_size(c.get("body_bbox"))[1], bbox_size(c.get("bbox"))[1]) for c in row_cells],
                key=lambda item: item[1],
            )[:3],
        })
    return rows


def audit_against_sheet1(sheet1: Path, before: Path | None, after: Path) -> dict[str, object]:
    def collect(path: Path, rows: int) -> list[dict[str, int | float | list[int] | None]]:
        return atlas_cells(Image.open(path).convert("RGBA"), rows)

    ref_cells = collect(sheet1, 6)
    ref_heights = [
        bbox_size(c.get("body_bbox"))[1]
        for c in ref_cells
        if int(c["row"]) in (0, 3, 4, 5) and bbox_size(c.get("body_bbox"))[1] > 0
    ]
    ref_heights.sort()
    reference_body_height = ref_heights[len(ref_heights) // 2] if ref_heights else 0
    result: dict[str, object] = {
        "sheet1_reference": str(sheet1),
        "sheet1_reference_body_height_median": reference_body_height,
        "after": row_scale_summary(collect(after, ROWS_FINAL)),
    }
    if before and before.exists():
        result["before"] = row_scale_summary(collect(before, ROWS_FINAL))
    return result


def validate(atlas: Image.Image, cells: list[dict[str, int | float | list[int] | None]]) -> dict[str, object]:
    alpha = atlas.getchannel("A")
    alpha_hist = alpha.histogram()
    counts = count_pixels(atlas)
    occupied = sum(1 for cell in cells if int(cell.get("alpha_pixels") or 0) > 800)
    foots = [int(cell["foot_bottom"]) for cell in cells if isinstance(cell.get("foot_bottom"), int)]
    body_heights = [bbox_size(cell.get("body_bbox"))[1] for cell in cells if bbox_size(cell.get("body_bbox"))[1] > 0]
    return {
        "output_size": [atlas.width, atlas.height],
        "grid": {"cols": COLS, "rows": ROWS_FINAL, "cell": DEST_CELL, "baselineY": BASELINE_Y},
        "has_real_transparency": alpha.getextrema()[0] == 0 and alpha_hist[0] > 0,
        "checkerboard_removed": alpha_hist[0] > atlas.width * atlas.height * 0.45,
        "occupied_cells": occupied,
        "white_coat_preserved": counts["white"] >= 18000 and all(int(cell.get("white_pixels") or 0) > 80 for cell in cells),
        "gold_vfx_preserved": counts["gold"] >= 15000,
        "cyan_vfx_preserved": counts["cyan"] >= 450,
        "black_vfx_preserved": counts["black"] >= 18000,
        "vfx_preserved": counts["gold"] >= 15000 and counts["cyan"] >= 450 and counts["black"] >= 18000,
        "baseline_max_deviation": max((abs(y - BASELINE_Y) for y in foots), default=None),
        "min_body_height": min(body_heights) if body_heights else 0,
        "median_body_height": sorted(body_heights)[len(body_heights) // 2] if body_heights else 0,
        "total_counts": counts,
    }


def rebuild(sheet3a_source: Path, crown_strip: Path, sheet3b_source: Path, output: Path, report: Path, preview: Path, sheet1_reference: Path, before_atlas: Path | None) -> dict[str, object]:
    sheet3a = Image.open(sheet3a_source).convert("RGBA")
    crown = Image.open(crown_strip).convert("RGBA")
    sheet3b = Image.open(sheet3b_source).convert("RGBA")
    atlas = Image.new("RGBA", (DEST_WIDTH, DEST_HEIGHT_FINAL), (0, 0, 0, 0))
    cells = []

    for row in range(ROWS_FINAL):
        for col in range(COLS):
            if row < 2:
                raw = extract_grid_cell(sheet3a, COLS, ROWS_3A, col, row)
                source = "sheet3a_down_rows_0_1"
            elif row == 2:
                raw = extract_grid_cell(crown, COLS, 1, col, 0)
                source = "corrected_crown_rupture_strip"
            else:
                raw = extract_grid_cell(sheet3b, COLS, ROWS_3A, col, row - 3)
                source = "sheet3b_up_specials"
            cleaned, source_metrics = clean_cell(raw)
            cleaned = remove_top_crop_artifacts(cleaned)
            aligned, metrics = align_body_scale(cleaned, row)
            atlas.alpha_composite(aligned, (col * DEST_CELL, row * DEST_CELL))
            cells.append({"row": row, "col": col, "source": source, **source_metrics, **metrics})

    output.parent.mkdir(parents=True, exist_ok=True)
    atlas.save(output)
    build_preview(atlas, preview, ROWS_FINAL)
    validation = validate(atlas, cells)
    scale_audit = audit_against_sheet1(sheet1_reference, before_atlas, output)
    out_report = {
        "sheet3a_source": str(sheet3a_source),
        "crown_rupture_strip": str(crown_strip),
        "sheet3b_source": str(sheet3b_source),
        "output": str(output),
        "preview": str(preview),
        "row_mapping": FINAL_ROW_MAPPING,
        "row_scale": ROW_SCALE,
        **validation,
        "scale_audit": scale_audit,
        "cells": cells,
    }
    report.parent.mkdir(parents=True, exist_ok=True)
    report.write_text(json.dumps(out_report, indent=2), encoding="utf-8")
    return out_report


def require_valid(report: dict[str, object]) -> None:
    failures = []
    if report["output_size"] != [DEST_WIDTH, DEST_HEIGHT_FINAL]:
        failures.append("bad output size")
    if report["occupied_cells"] != COLS * ROWS_FINAL:
        failures.append("bad occupied-cell count")
    for key in ("has_real_transparency", "checkerboard_removed", "white_coat_preserved", "vfx_preserved"):
        if not report[key]:
            failures.append(f"{key} failed")
    if report["baseline_max_deviation"] is not None and int(report["baseline_max_deviation"]) > 28:
        failures.append("baseline deviation too high")
    if int(report["median_body_height"]) < 250:
        failures.append("median body height still too small")
    if failures:
        raise RuntimeError("; ".join(failures))


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--sheet3a-source", required=True, type=Path)
    parser.add_argument("--crown-strip", required=True, type=Path)
    parser.add_argument("--sheet3b-source", required=True, type=Path)
    parser.add_argument(
        "--sheet1-reference",
        default=Path("assets/characters/lamuh/lamuh_sheet_1_core_movement_redesign_atlas.png"),
        type=Path,
    )
    parser.add_argument(
        "--before-atlas",
        default=Path("assets/characters/lamuh/lamuh_sheet_3_down_up_specials_redesign_atlas.png"),
        type=Path,
    )
    parser.add_argument(
        "--output",
        default=Path("assets/characters/lamuh/lamuh_sheet_3_down_up_specials_body_scale_atlas.png"),
        type=Path,
    )
    parser.add_argument(
        "--report",
        default=Path("assets/characters/lamuh/lamuh_sheet_3_down_up_specials_body_scale_report.json"),
        type=Path,
    )
    parser.add_argument(
        "--preview",
        default=Path("assets/characters/lamuh/lamuh_sheet_3_down_up_specials_body_scale_preview.png"),
        type=Path,
    )
    args = parser.parse_args()

    report = rebuild(
        args.sheet3a_source,
        args.crown_strip,
        args.sheet3b_source,
        args.output,
        args.report,
        args.preview,
        args.sheet1_reference,
        args.before_atlas,
    )
    require_valid(report)
    print(json.dumps({
        "output": report["output"],
        "output_size": report["output_size"],
        "occupied_cells": report["occupied_cells"],
        "has_real_transparency": report["has_real_transparency"],
        "checkerboard_removed": report["checkerboard_removed"],
        "white_coat_preserved": report["white_coat_preserved"],
        "vfx_preserved": report["vfx_preserved"],
        "median_body_height": report["median_body_height"],
        "scale_audit": report["scale_audit"],
    }, indent=2))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
