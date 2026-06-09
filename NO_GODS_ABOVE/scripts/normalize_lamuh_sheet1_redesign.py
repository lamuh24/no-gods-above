#!/usr/bin/env python3
"""Normalize generated LAMUH Sheet 1 art into a runtime-ready 448-cell atlas."""

from __future__ import annotations

import argparse
import json
from collections import deque
from pathlib import Path

from PIL import Image, ImageFilter


COLS = 8
ROWS = 6
DEST_CELL = 448
DEST_WIDTH = COLS * DEST_CELL
DEST_HEIGHT = ROWS * DEST_CELL
BASELINE_Y = 382


def is_checker_candidate(pixel: tuple[int, int, int, int]) -> bool:
    r, g, b, _ = pixel
    high = r >= 232 and g >= 232 and b >= 232
    low_saturation = max(r, g, b) - min(r, g, b) <= 18
    return high and low_saturation


def is_white_coat_candidate(pixel: tuple[int, int, int, int]) -> bool:
    r, g, b, a = pixel
    return a > 0 and r >= 170 and g >= 165 and b >= 150 and max(r, g, b) - min(r, g, b) <= 70


def edge_connected_checker_mask(cell: Image.Image) -> set[tuple[int, int]]:
    width, height = cell.size
    pix = cell.load()
    visited: set[tuple[int, int]] = set()
    queue: deque[tuple[int, int]] = deque()

    def add_if_bg(x: int, y: int) -> None:
        if (x, y) in visited:
            return
        if is_checker_candidate(pix[x, y]):
            visited.add((x, y))
            queue.append((x, y))

    for x in range(width):
        add_if_bg(x, 0)
        add_if_bg(x, height - 1)
    for y in range(height):
        add_if_bg(0, y)
        add_if_bg(width - 1, y)

    while queue:
        x, y = queue.popleft()
        for nx, ny in ((x + 1, y), (x - 1, y), (x, y + 1), (x, y - 1)):
            if nx < 0 or ny < 0 or nx >= width or ny >= height or (nx, ny) in visited:
                continue
            if is_checker_candidate(pix[nx, ny]):
                visited.add((nx, ny))
                queue.append((nx, ny))
    return visited


def clean_cell(cell: Image.Image) -> tuple[Image.Image, dict[str, int | float | list[int] | None]]:
    cell = cell.convert("RGBA")
    pix = cell.load()
    bg = edge_connected_checker_mask(cell)
    source_white = 0
    for y in range(cell.height):
        for x in range(cell.width):
            p = pix[x, y]
            if is_white_coat_candidate(p) and (x, y) not in bg:
                source_white += 1
            if (x, y) in bg:
                pix[x, y] = (255, 255, 255, 0)

    bbox = cell.getbbox()
    if not bbox:
        return cell, {
            "source_white_like_pixels": source_white,
            "output_white_like_pixels": 0,
            "bbox": None,
            "alpha_pixels": 0,
            "foot_bottom": None,
            "x_anchor": None,
        }

    # Scale the full source cell to destination size first, preserving relative animation spacing.
    scaled = cell.resize((DEST_CELL, DEST_CELL), Image.Resampling.LANCZOS)
    alpha = scaled.getchannel("A")
    bbox = alpha.getbbox()
    if not bbox:
        return scaled, {
            "source_white_like_pixels": source_white,
            "output_white_like_pixels": 0,
            "bbox": None,
            "alpha_pixels": 0,
            "foot_bottom": None,
            "x_anchor": None,
        }

    # Align by lower-body/feet anchor instead of whole bbox center so long attacks do not pull the body off center.
    alpha_pix = alpha.load()
    bottom = bbox[3] - 1
    foot_rows = []
    for y in range(max(bbox[1], bottom - 24), bottom + 1):
        xs = [x for x in range(bbox[0], bbox[2]) if alpha_pix[x, y] > 24]
        if xs:
            foot_rows.extend(xs)
    if foot_rows:
        x_anchor = int(round(sum(foot_rows) / len(foot_rows)))
    else:
        x_anchor = int(round((bbox[0] + bbox[2]) / 2))

    dx = (DEST_CELL // 2) - x_anchor
    dy = BASELINE_Y - bottom
    aligned = Image.new("RGBA", (DEST_CELL, DEST_CELL), (0, 0, 0, 0))
    aligned.alpha_composite(scaled, (dx, dy))
    out_alpha = aligned.getchannel("A")
    out_bbox = out_alpha.getbbox()

    output_white = 0
    out_pix = aligned.load()
    alpha_pixels = 0
    if out_bbox:
        for y in range(out_bbox[1], out_bbox[3]):
            for x in range(out_bbox[0], out_bbox[2]):
                if out_pix[x, y][3] > 0:
                    alpha_pixels += 1
                    if is_white_coat_candidate(out_pix[x, y]):
                        output_white += 1

    return aligned, {
        "source_white_like_pixels": source_white,
        "output_white_like_pixels": output_white,
        "bbox": list(out_bbox) if out_bbox else None,
        "alpha_pixels": alpha_pixels,
        "foot_bottom": out_bbox[3] - 1 if out_bbox else None,
        "x_anchor": x_anchor,
    }


def remove_global_checker_background(src: Image.Image) -> Image.Image:
    cleaned = src.convert("RGBA")
    pix = cleaned.load()
    bg = edge_connected_checker_mask(cleaned)
    for x, y in bg:
        pix[x, y] = (255, 255, 255, 0)
    return cleaned


def connected_components(img: Image.Image) -> list[dict[str, object]]:
    alpha = img.getchannel("A")
    alpha_pix = alpha.load()
    grouped_alpha = alpha.filter(ImageFilter.MaxFilter(17))
    grouped_pix = grouped_alpha.load()
    pix = img.load()
    width, height = img.size
    visited: set[tuple[int, int]] = set()
    comps: list[dict[str, object]] = []

    for y in range(height):
        for x in range(width):
            if (x, y) in visited or grouped_pix[x, y] <= 18:
                continue
            queue: deque[tuple[int, int]] = deque([(x, y)])
            visited.add((x, y))
            xs = []
            ys = []
            while queue:
                cx, cy = queue.popleft()
                xs.append(cx)
                ys.append(cy)
                for nx, ny in ((cx + 1, cy), (cx - 1, cy), (cx, cy + 1), (cx, cy - 1)):
                    if nx < 0 or ny < 0 or nx >= width or ny >= height or (nx, ny) in visited:
                        continue
                    if grouped_pix[nx, ny] > 18:
                        visited.add((nx, ny))
                        queue.append((nx, ny))
            raw_left = min(xs)
            raw_top = min(ys)
            raw_right = max(xs) + 1
            raw_bottom = max(ys) + 1
            real_xs = []
            real_ys = []
            white_like = 0
            for py in range(raw_top, raw_bottom):
                for px in range(raw_left, raw_right):
                    if alpha_pix[px, py] <= 18:
                        continue
                    real_xs.append(px)
                    real_ys.append(py)
                    if is_white_coat_candidate(pix[px, py]):
                        white_like += 1
            area = len(real_xs)
            if area < 12:
                continue
            bbox = (min(real_xs), min(real_ys), max(real_xs) + 1, max(real_ys) + 1)
            comps.append({
                "area": area,
                "bbox": bbox,
                "centroid": (sum(real_xs) / area, sum(real_ys) / area),
                "white_like": white_like,
            })
    return comps


def slot_centers(width: int, height: int) -> list[tuple[int, int, float, float]]:
    return [
        (row, col, (col + 0.5) * width / COLS, (row + 0.5) * height / ROWS)
        for row in range(ROWS)
        for col in range(COLS)
    ]


def assign_components_to_slots(components: list[dict[str, object]], width: int, height: int) -> dict[tuple[int, int], list[dict[str, object]]]:
    cell_w = width / COLS
    cell_h = height / ROWS
    slots = {(row, col): [] for row in range(ROWS) for col in range(COLS)}
    centers = slot_centers(width, height)
    for comp in components:
        cx, cy = comp["centroid"]  # type: ignore[misc]
        row, col, _, _ = min(
            centers,
            key=lambda item: ((cx - item[2]) / cell_w) ** 2 + ((cy - item[3]) / cell_h) ** 2,
        )
        slots[(row, col)].append(comp)
    return slots


def compose_slot_cell(cleaned: Image.Image, comps: list[dict[str, object]], scale: float) -> tuple[Image.Image, dict[str, int | float | list[int] | None]]:
    if not comps:
        empty = Image.new("RGBA", (DEST_CELL, DEST_CELL), (0, 0, 0, 0))
        return empty, {
            "source_white_like_pixels": 0,
            "output_white_like_pixels": 0,
            "bbox": None,
            "alpha_pixels": 0,
            "foot_bottom": None,
            "x_anchor": None,
        }

    left = min(comp["bbox"][0] for comp in comps)  # type: ignore[index]
    top = min(comp["bbox"][1] for comp in comps)  # type: ignore[index]
    right = max(comp["bbox"][2] for comp in comps)  # type: ignore[index]
    bottom = max(comp["bbox"][3] for comp in comps)  # type: ignore[index]
    crop = cleaned.crop((left, top, right, bottom))
    scaled_w = max(1, round(crop.width * scale))
    scaled_h = max(1, round(crop.height * scale))
    scaled = crop.resize((scaled_w, scaled_h), Image.Resampling.LANCZOS)
    alpha = scaled.getchannel("A")
    bbox = alpha.getbbox()
    if not bbox:
        return Image.new("RGBA", (DEST_CELL, DEST_CELL), (0, 0, 0, 0)), {
            "source_white_like_pixels": sum(int(comp["white_like"]) for comp in comps),
            "output_white_like_pixels": 0,
            "bbox": None,
            "alpha_pixels": 0,
            "foot_bottom": None,
            "x_anchor": None,
        }

    bbox_w = bbox[2] - bbox[0]
    bbox_h = bbox[3] - bbox[1]
    fit = min((DEST_CELL - 4) / max(1, bbox_w), (BASELINE_Y - 2) / max(1, bbox_h), 1.0)
    if fit < 0.999:
        scaled_w = max(1, round(scaled.width * fit))
        scaled_h = max(1, round(scaled.height * fit))
        scaled = scaled.resize((scaled_w, scaled_h), Image.Resampling.LANCZOS)
        alpha = scaled.getchannel("A")
        bbox = alpha.getbbox()
        if not bbox:
            return Image.new("RGBA", (DEST_CELL, DEST_CELL), (0, 0, 0, 0)), {
                "source_white_like_pixels": sum(int(comp["white_like"]) for comp in comps),
                "output_white_like_pixels": 0,
                "bbox": None,
                "alpha_pixels": 0,
                "foot_bottom": None,
                "x_anchor": None,
            }

    alpha_pix = alpha.load()
    bottom_px = bbox[3] - 1
    foot_rows = []
    for y in range(max(bbox[1], bottom_px - 24), bottom_px + 1):
        xs = [x for x in range(bbox[0], bbox[2]) if alpha_pix[x, y] > 24]
        if xs:
            foot_rows.extend(xs)
    if foot_rows:
        x_anchor = int(round(sum(foot_rows) / len(foot_rows)))
    else:
        x_anchor = int(round((bbox[0] + bbox[2]) / 2))

    dx = (DEST_CELL // 2) - x_anchor
    dy = BASELINE_Y - bottom_px
    if dx + bbox[0] < 2:
        dx += 2 - (dx + bbox[0])
    if dx + bbox[2] > DEST_CELL - 2:
        dx -= (dx + bbox[2]) - (DEST_CELL - 2)
    aligned = Image.new("RGBA", (DEST_CELL, DEST_CELL), (0, 0, 0, 0))
    aligned.alpha_composite(scaled, (dx, dy))

    out_alpha = aligned.getchannel("A")
    out_bbox = out_alpha.getbbox()
    out_pix = aligned.load()
    output_white = 0
    alpha_pixels = 0
    if out_bbox:
        for y in range(out_bbox[1], out_bbox[3]):
            for x in range(out_bbox[0], out_bbox[2]):
                if out_pix[x, y][3] > 0:
                    alpha_pixels += 1
                    if is_white_coat_candidate(out_pix[x, y]):
                        output_white += 1

    return aligned, {
        "source_white_like_pixels": sum(int(comp["white_like"]) for comp in comps),
        "output_white_like_pixels": output_white,
        "bbox": list(out_bbox) if out_bbox else None,
        "alpha_pixels": alpha_pixels,
        "foot_bottom": out_bbox[3] - 1 if out_bbox else None,
        "x_anchor": x_anchor,
    }


def source_cell_bounds(width: int, height: int, col: int, row: int) -> tuple[int, int, int, int]:
    left = round(col * width / COLS)
    right = round((col + 1) * width / COLS)
    top = round(row * height / ROWS)
    bottom = round((row + 1) * height / ROWS)
    return left, top, right, bottom


def normalize(source: Path, output: Path, report_path: Path) -> dict[str, object]:
    src = Image.open(source).convert("RGBA")
    cleaned = remove_global_checker_background(src)
    components = connected_components(cleaned)
    slots = assign_components_to_slots(components, src.width, src.height)
    scale = DEST_CELL / (src.width / COLS)
    atlas = Image.new("RGBA", (DEST_WIDTH, DEST_HEIGHT), (0, 0, 0, 0))
    cells = []

    for row in range(ROWS):
        for col in range(COLS):
            cell_img, metrics = compose_slot_cell(cleaned, slots[(row, col)], scale)
            atlas.alpha_composite(cell_img, (col * DEST_CELL, row * DEST_CELL))
            cells.append({"row": row, "col": col, "component_count": len(slots[(row, col)]), **metrics})

    output.parent.mkdir(parents=True, exist_ok=True)
    atlas.save(output)

    alpha = atlas.getchannel("A")
    alpha_extrema = alpha.getextrema()
    alpha_hist = alpha.histogram()
    transparent = alpha_hist[0]
    opaque_or_semi = sum(alpha_hist[1:])
    foot_bottoms = [c["foot_bottom"] for c in cells if isinstance(c["foot_bottom"], int)]
    white_ok = all(c["output_white_like_pixels"] and c["output_white_like_pixels"] > 200 for c in cells)
    baseline_max_deviation = max((abs(int(y) - BASELINE_Y) for y in foot_bottoms), default=None)

    report = {
        "source": str(source),
        "source_size": [src.width, src.height],
        "source_components": len(components),
        "output": str(output),
        "output_size": [DEST_WIDTH, DEST_HEIGHT],
        "grid": {"cols": COLS, "rows": ROWS, "cell": DEST_CELL, "baselineY": BASELINE_Y},
        "alpha_extrema": list(alpha_extrema),
        "transparent_pixels": transparent,
        "opaque_or_semi_pixels": opaque_or_semi,
        "has_real_transparency": alpha_extrema[0] == 0 and transparent > 0,
        "white_coat_preserved": white_ok,
        "baseline_max_deviation": baseline_max_deviation,
        "row_mapping": {
            "0": ["lamuh_idle"],
            "1": ["lamuh_walk"],
            "2": ["lamuh_run", "lamuh_dash"],
            "3": ["lamuh_stand_light"],
            "4": ["lamuh_stand_medium"],
            "5": ["lamuh_stand_heavy"],
        },
        "cells": cells,
    }
    report_path.parent.mkdir(parents=True, exist_ok=True)
    report_path.write_text(json.dumps(report, indent=2), encoding="utf-8")
    return report


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--source", required=True, type=Path)
    parser.add_argument(
        "--output",
        default=Path("assets/characters/lamuh/lamuh_sheet_1_core_movement_redesign_atlas.png"),
        type=Path,
    )
    parser.add_argument(
        "--report",
        default=Path("assets/characters/lamuh/lamuh_sheet_1_core_movement_redesign_report.json"),
        type=Path,
    )
    args = parser.parse_args()

    report = normalize(args.source, args.output, args.report)
    print(json.dumps({k: report[k] for k in (
        "source",
        "source_size",
        "output",
        "output_size",
        "has_real_transparency",
        "white_coat_preserved",
        "baseline_max_deviation",
    )}, indent=2))
    if not report["has_real_transparency"]:
        return 2
    if not report["white_coat_preserved"]:
        return 3
    if report["baseline_max_deviation"] is not None and report["baseline_max_deviation"] > 3:
        return 4
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
