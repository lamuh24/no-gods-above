#!/usr/bin/env python3
"""Normalize generated LAMUH down/up special art into a 448-cell runtime atlas."""

from __future__ import annotations

import argparse
import json
from pathlib import Path

from PIL import Image

import normalize_lamuh_forward_specials_redesign as base


COLS = 8
ROWS = 6
DEST_CELL = 448
DEST_WIDTH = COLS * DEST_CELL
DEST_HEIGHT = ROWS * DEST_CELL
BASELINE_Y = 382

ROW_MAPPING = {
    "0": ["lamuh_low_mirror_cut", "low_mirror_cut"],
    "1": ["lamuh_ground_breaker", "ground_breaker"],
    "2": ["lamuh_crown_rupture", "crown_rupture"],
    "3": ["lamuh_crown_pop", "crown_pop"],
    "4": ["lamuh_rising_crown", "rising_crown"],
    "5": ["lamuh_ascendant_break", "ascendant_break"],
}


def configure_base_grid() -> None:
    base.COLS = COLS
    base.ROWS = ROWS
    base.DEST_CELL = DEST_CELL
    base.DEST_WIDTH = DEST_WIDTH
    base.DEST_HEIGHT = DEST_HEIGHT
    base.BASELINE_Y = BASELINE_Y


def is_black_vfx_candidate(pixel: tuple[int, int, int, int]) -> bool:
    r, g, b, a = pixel
    return a > 0 and r <= 78 and g <= 74 and b <= 88 and max(r, g, b) - min(r, g, b) <= 42


def count_black_vfx(img: Image.Image) -> int:
    rgba = img.convert("RGBA")
    pix = rgba.load()
    total = 0
    for y in range(rgba.height):
        for x in range(rgba.width):
            if is_black_vfx_candidate(pix[x, y]):
                total += 1
    return total


def add_sheet3_checks(report: dict[str, object], atlas_path: Path) -> dict[str, object]:
    atlas = Image.open(atlas_path).convert("RGBA")
    black_pixels = count_black_vfx(atlas)
    cells = report.get("cells", [])
    row_bboxes: dict[str, list[list[int]]] = {}
    if isinstance(cells, list):
        for cell in cells:
            if not isinstance(cell, dict):
                continue
            row = str(cell.get("row"))
            bbox = cell.get("bbox")
            if isinstance(bbox, list):
                row_bboxes.setdefault(row, []).append([int(v) for v in bbox])

    large_ground_or_vertical_effects_preserved = True
    for row in ("2", "5"):
        bboxes = row_bboxes.get(row, [])
        if not bboxes:
            large_ground_or_vertical_effects_preserved = False
            continue
        max_h = max((bbox[3] - bbox[1] for bbox in bboxes), default=0)
        if max_h < 250:
            large_ground_or_vertical_effects_preserved = False

    report["row_mapping"] = ROW_MAPPING
    report["black_vfx_pixels"] = black_pixels
    report["black_vfx_preserved"] = black_pixels >= 500
    report["gold_cyan_black_vfx_preserved"] = bool(
        report.get("gold_vfx_preserved")
        and report.get("cyan_vfx_preserved")
        and report.get("black_vfx_preserved")
    )
    report["large_ground_or_vertical_effects_preserved"] = large_ground_or_vertical_effects_preserved
    report["expected_rows"] = {
        "0": "Low Mirror Cut",
        "1": "Ground Breaker",
        "2": "Crown Rupture",
        "3": "Crown Pop",
        "4": "Rising Crown",
        "5": "Ascendant Break",
    }
    return report


def normalize(source: Path, output: Path, report_path: Path, preview_path: Path) -> dict[str, object]:
    configure_base_grid()
    report = base.normalize(source, output, report_path, preview_path)
    report = add_sheet3_checks(report, output)
    report_path.write_text(json.dumps(report, indent=2), encoding="utf-8")
    return report


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--source", required=True, type=Path)
    parser.add_argument(
        "--output",
        default=Path("assets/characters/lamuh/lamuh_sheet_3_down_up_specials_redesign_atlas.png"),
        type=Path,
    )
    parser.add_argument(
        "--report",
        default=Path("assets/characters/lamuh/lamuh_sheet_3_down_up_specials_redesign_report.json"),
        type=Path,
    )
    parser.add_argument(
        "--preview",
        default=Path("assets/characters/lamuh/lamuh_sheet_3_down_up_specials_redesign_preview.png"),
        type=Path,
    )
    args = parser.parse_args()

    report = normalize(args.source, args.output, args.report, args.preview)
    summary = {
        "source": report["source"],
        "source_size": report["source_size"],
        "source_sprite_components": report["source_sprite_components"],
        "output": report["output"],
        "output_size": report["output_size"],
        "has_real_transparency": report["has_real_transparency"],
        "white_coat_preserved": report["white_coat_preserved"],
        "gold_vfx_preserved": report["gold_vfx_preserved"],
        "cyan_vfx_preserved": report["cyan_vfx_preserved"],
        "black_vfx_preserved": report["black_vfx_preserved"],
        "large_ground_or_vertical_effects_preserved": report["large_ground_or_vertical_effects_preserved"],
        "baseline_max_deviation": report["baseline_max_deviation"],
    }
    print(json.dumps(summary, indent=2))

    if report["output_size"] != [DEST_WIDTH, DEST_HEIGHT]:
        return 2
    if not report["has_real_transparency"]:
        return 3
    if not report["white_coat_preserved"]:
        return 4
    if not report["gold_cyan_black_vfx_preserved"]:
        return 5
    if report["source_sprite_components"] != COLS * ROWS:
        return 6
    if not report["large_ground_or_vertical_effects_preserved"]:
        return 7
    if report["baseline_max_deviation"] is not None and report["baseline_max_deviation"] > 6:
        return 8
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
