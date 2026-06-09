#!/usr/bin/env python3
"""Normalize LAMUH Sheet 3B Up Specials and combine it with validated Sheet 3A."""

from __future__ import annotations

import argparse
import json
from collections import deque
from pathlib import Path

from PIL import Image, ImageDraw

from normalize_lamuh_sheet3a_down_specials_patch import (
    BASELINE_Y,
    COLS,
    DEST_CELL,
    clean_cell,
    count_pixels,
    extract_frame,
    source_cell_bounds,
)


ROWS_3B = 3
ROWS_FINAL = 6
DEST_WIDTH = COLS * DEST_CELL
DEST_HEIGHT_3B = ROWS_3B * DEST_CELL
DEST_HEIGHT_FINAL = ROWS_FINAL * DEST_CELL

SHEET3B_ROW_MAPPING = {
    "0": ["lamuh_crown_pop", "crown_pop"],
    "1": ["lamuh_rising_crown", "rising_crown"],
    "2": ["lamuh_ascendant_break", "ascendant_break"],
}

FINAL_ROW_MAPPING = {
    "0": ["lamuh_low_mirror_cut", "low_mirror_cut"],
    "1": ["lamuh_ground_breaker", "ground_breaker"],
    "2": ["lamuh_crown_rupture", "crown_rupture"],
    "3": ["lamuh_crown_pop", "crown_pop"],
    "4": ["lamuh_rising_crown", "rising_crown"],
    "5": ["lamuh_ascendant_break", "ascendant_break"],
}


def align_to_cell(cleaned: Image.Image) -> tuple[Image.Image, dict[str, int | float | list[int] | None]]:
    """Align a cleaned frame while allowing up-special vertical effects to keep their height."""
    alpha = cleaned.getchannel("A")
    bbox = alpha.getbbox()
    if not bbox:
        empty = Image.new("RGBA", (DEST_CELL, DEST_CELL), (0, 0, 0, 0))
        return empty, {"bbox": None, "foot_bottom": None, "alpha_pixels": 0}

    crop = cleaned.crop(bbox)
    fit = min((DEST_CELL - 8) / crop.width, (DEST_CELL - 12) / crop.height, 1.0)
    if fit < 0.999:
        crop = crop.resize(
            (max(1, round(crop.width * fit)), max(1, round(crop.height * fit))),
            Image.Resampling.LANCZOS,
        )

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
    if dy + bbox2[1] < 2:
        dy += 2 - (dy + bbox2[1])
    if dy + bbox2[3] > DEST_CELL - 2:
        dy -= (dy + bbox2[3]) - (DEST_CELL - 2)
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


def remove_top_crop_artifacts(cell: Image.Image) -> Image.Image:
    """Drop thin detached row-boundary shadows without touching vertical crown effects."""
    rgba = cell.copy()
    alpha = rgba.getchannel("A")
    alpha_pix = alpha.load()
    pix = rgba.load()
    seen: set[tuple[int, int]] = set()

    for start_y in range(alpha.height):
        for start_x in range(alpha.width):
            if (start_x, start_y) in seen or alpha_pix[start_x, start_y] <= 0:
                continue
            queue: deque[tuple[int, int]] = deque([(start_x, start_y)])
            seen.add((start_x, start_y))
            component: list[tuple[int, int]] = []
            min_x = max_x = start_x
            min_y = max_y = start_y
            while queue:
                x, y = queue.popleft()
                component.append((x, y))
                min_x = min(min_x, x)
                max_x = max(max_x, x)
                min_y = min(min_y, y)
                max_y = max(max_y, y)
                for nx, ny in ((x + 1, y), (x - 1, y), (x, y + 1), (x, y - 1)):
                    if nx < 0 or ny < 0 or nx >= alpha.width or ny >= alpha.height or (nx, ny) in seen:
                        continue
                    if alpha_pix[nx, ny] <= 0:
                        continue
                    seen.add((nx, ny))
                    queue.append((nx, ny))

            width = max_x - min_x + 1
            height = max_y - min_y + 1
            upper_band = min_y <= max(14, round(alpha.height * 0.4))
            thin_shadow = width >= 24 and height <= 14 and len(component) <= 700
            has_large_lower_component = any(
                alpha_pix[x, y] > 0
                for y in range(min(alpha.height - 1, max_y + 36), alpha.height)
                for x in range(alpha.width)
            )
            if upper_band and thin_shadow and has_large_lower_component:
                for x, y in component:
                    pix[x, y] = (255, 255, 255, 0)
    return rgba


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


def alpha_cell_metrics(atlas: Image.Image, rows: int) -> list[dict[str, int | list[int] | None]]:
    cells = []
    for row in range(rows):
        for col in range(COLS):
            cell = atlas.crop((col * DEST_CELL, row * DEST_CELL, (col + 1) * DEST_CELL, (row + 1) * DEST_CELL))
            bbox = cell.getchannel("A").getbbox()
            counts = count_pixels(cell)
            cells.append(
                {
                    "row": row,
                    "col": col,
                    "bbox": list(bbox) if bbox else None,
                    "alpha_pixels": counts["alpha"],
                    "white_pixels": counts["white"],
                    "gold_pixels": counts["gold"],
                    "cyan_pixels": counts["cyan"],
                    "black_pixels": counts["black"],
                    "foot_bottom": bbox[3] - 1 if bbox else None,
                }
            )
    return cells


def validate_atlas(
    atlas: Image.Image,
    rows: int,
    cells: list[dict[str, int | list[int] | None]],
    required_occupied: int,
) -> dict[str, object]:
    alpha = atlas.getchannel("A")
    alpha_hist = alpha.histogram()
    counts = count_pixels(atlas)
    occupied = sum(1 for cell in cells if int(cell.get("alpha_pixels") or 0) > 800)
    vertical_rows = [cell for cell in cells if int(cell["row"]) >= max(0, rows - 2) and isinstance(cell.get("bbox"), list)]
    max_vertical_h = max((cell["bbox"][3] - cell["bbox"][1] for cell in vertical_rows), default=0)  # type: ignore[index]
    foot_bottoms = [int(cell["foot_bottom"]) for cell in cells if isinstance(cell.get("foot_bottom"), int)]
    return {
        "output_size": [atlas.width, atlas.height],
        "grid": {"cols": COLS, "rows": rows, "cell": DEST_CELL, "baselineY": BASELINE_Y},
        "has_real_transparency": alpha.getextrema()[0] == 0 and alpha_hist[0] > 0,
        "transparent_pixels": alpha_hist[0],
        "opaque_or_semi_pixels": sum(alpha_hist[1:]),
        "occupied_cells": occupied,
        "occupied_cells_required": required_occupied,
        "white_coat_preserved": counts["white"] >= (6000 if rows == ROWS_3B else 12000)
        and all(int(cell.get("white_pixels") or 0) > 80 for cell in cells),
        "gold_vfx_preserved": counts["gold"] >= (4000 if rows == ROWS_3B else 9000),
        "cyan_vfx_preserved": counts["cyan"] >= (120 if rows == ROWS_3B else 300),
        "black_vfx_preserved": counts["black"] >= (8000 if rows == ROWS_3B else 16000),
        "vfx_preserved": counts["gold"] >= (4000 if rows == ROWS_3B else 9000)
        and counts["cyan"] >= (120 if rows == ROWS_3B else 300)
        and counts["black"] >= (8000 if rows == ROWS_3B else 16000),
        "vertical_crown_effects_preserved": max_vertical_h >= 240,
        "checkerboard_removed": alpha_hist[0] > atlas.width * atlas.height * 0.55,
        "baseline_max_deviation": max((abs(y - BASELINE_Y) for y in foot_bottoms), default=None),
        "total_counts": counts,
    }


def normalize_sheet3b(source: Path, output: Path, report_path: Path, preview_path: Path) -> dict[str, object]:
    sheet = Image.open(source).convert("RGBA")
    atlas = Image.new("RGBA", (DEST_WIDTH, DEST_HEIGHT_3B), (0, 0, 0, 0))
    cells = []

    for row in range(ROWS_3B):
        for col in range(COLS):
            source_cell = sheet.crop(source_cell_bounds(sheet.width, sheet.height, COLS, ROWS_3B, col, row))
            cleaned, source_metrics = clean_cell(source_cell)
            cleaned = remove_top_crop_artifacts(cleaned)
            aligned, metrics = align_to_cell(cleaned)
            atlas.alpha_composite(aligned, (col * DEST_CELL, row * DEST_CELL))
            cells.append({"row": row, "col": col, "source": "sheet3b_up_specials", **source_metrics, **metrics})

    output.parent.mkdir(parents=True, exist_ok=True)
    atlas.save(output)
    build_preview(atlas, preview_path, ROWS_3B)
    validation = validate_atlas(atlas, ROWS_3B, cells, COLS * ROWS_3B)
    report = {
        "sheet3b_source": str(source),
        "sheet3b_source_size": [sheet.width, sheet.height],
        "output": str(output),
        "preview": str(preview_path),
        "row_mapping": SHEET3B_ROW_MAPPING,
        **validation,
        "cells": cells,
    }
    report_path.parent.mkdir(parents=True, exist_ok=True)
    report_path.write_text(json.dumps(report, indent=2), encoding="utf-8")
    return report


def combine_sheet3(sheet3a: Path, sheet3b: Path, output: Path, report_path: Path, preview_path: Path) -> dict[str, object]:
    down = Image.open(sheet3a).convert("RGBA")
    up = Image.open(sheet3b).convert("RGBA")
    if down.size != (DEST_WIDTH, DEST_HEIGHT_3B):
        raise ValueError(f"Sheet 3A size must be {(DEST_WIDTH, DEST_HEIGHT_3B)}, got {down.size}")
    if up.size != (DEST_WIDTH, DEST_HEIGHT_3B):
        raise ValueError(f"Sheet 3B size must be {(DEST_WIDTH, DEST_HEIGHT_3B)}, got {up.size}")

    atlas = Image.new("RGBA", (DEST_WIDTH, DEST_HEIGHT_FINAL), (0, 0, 0, 0))
    atlas.alpha_composite(down, (0, 0))
    atlas.alpha_composite(up, (0, DEST_HEIGHT_3B))
    output.parent.mkdir(parents=True, exist_ok=True)
    atlas.save(output)
    build_preview(atlas, preview_path, ROWS_FINAL)

    cells = alpha_cell_metrics(atlas, ROWS_FINAL)
    validation = validate_atlas(atlas, ROWS_FINAL, cells, COLS * ROWS_FINAL)
    report = {
        "sheet3a_source": str(sheet3a),
        "sheet3b_source": str(sheet3b),
        "output": str(output),
        "preview": str(preview_path),
        "row_mapping": FINAL_ROW_MAPPING,
        **validation,
        "cells": cells,
    }
    report_path.parent.mkdir(parents=True, exist_ok=True)
    report_path.write_text(json.dumps(report, indent=2), encoding="utf-8")
    return report


def require_report(name: str, report: dict[str, object], expected_size: list[int], expected_occupied: int) -> None:
    failures = []
    if report["output_size"] != expected_size:
        failures.append(f"size {report['output_size']} != {expected_size}")
    if not report["has_real_transparency"]:
        failures.append("no real alpha transparency")
    if not report["checkerboard_removed"]:
        failures.append("checkerboard removal check failed")
    if report["occupied_cells"] != expected_occupied:
        failures.append(f"occupied cells {report['occupied_cells']} != {expected_occupied}")
    if not report["white_coat_preserved"]:
        failures.append("white coat preservation check failed")
    if not report["vfx_preserved"]:
        failures.append("VFX preservation check failed")
    if not report["vertical_crown_effects_preserved"]:
        failures.append("vertical crown effect preservation check failed")
    if failures:
        raise RuntimeError(f"{name} validation failed: " + "; ".join(failures))


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--sheet3b-source", required=True, type=Path)
    parser.add_argument(
        "--sheet3a-atlas",
        default=Path("assets/characters/lamuh/lamuh_sheet_3a_down_specials_patched_atlas.png"),
        type=Path,
    )
    parser.add_argument(
        "--sheet3b-output",
        default=Path("assets/characters/lamuh/lamuh_sheet_3b_up_specials_atlas.png"),
        type=Path,
    )
    parser.add_argument(
        "--sheet3b-report",
        default=Path("assets/characters/lamuh/lamuh_sheet_3b_up_specials_report.json"),
        type=Path,
    )
    parser.add_argument(
        "--sheet3b-preview",
        default=Path("assets/characters/lamuh/lamuh_sheet_3b_up_specials_preview.png"),
        type=Path,
    )
    parser.add_argument(
        "--final-output",
        default=Path("assets/characters/lamuh/lamuh_sheet_3_down_up_specials_redesign_atlas.png"),
        type=Path,
    )
    parser.add_argument(
        "--final-report",
        default=Path("assets/characters/lamuh/lamuh_sheet_3_down_up_specials_redesign_report.json"),
        type=Path,
    )
    parser.add_argument(
        "--final-preview",
        default=Path("assets/characters/lamuh/lamuh_sheet_3_down_up_specials_redesign_preview.png"),
        type=Path,
    )
    args = parser.parse_args()

    sheet3b_report = normalize_sheet3b(args.sheet3b_source, args.sheet3b_output, args.sheet3b_report, args.sheet3b_preview)
    require_report("Sheet 3B", sheet3b_report, [DEST_WIDTH, DEST_HEIGHT_3B], COLS * ROWS_3B)
    final_report = combine_sheet3(args.sheet3a_atlas, args.sheet3b_output, args.final_output, args.final_report, args.final_preview)
    require_report("Final Sheet 3", final_report, [DEST_WIDTH, DEST_HEIGHT_FINAL], COLS * ROWS_FINAL)

    print(
        json.dumps(
            {
                "sheet3b_source": sheet3b_report["sheet3b_source"],
                "sheet3b_output": sheet3b_report["output"],
                "sheet3b_size": sheet3b_report["output_size"],
                "sheet3b_occupied_cells": sheet3b_report["occupied_cells"],
                "final_output": final_report["output"],
                "final_size": final_report["output_size"],
                "final_occupied_cells": final_report["occupied_cells"],
                "has_real_transparency": final_report["has_real_transparency"],
                "checkerboard_removed": final_report["checkerboard_removed"],
                "white_coat_preserved": final_report["white_coat_preserved"],
                "vfx_preserved": final_report["vfx_preserved"],
                "vertical_crown_effects_preserved": final_report["vertical_crown_effects_preserved"],
            },
            indent=2,
        )
    )
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
