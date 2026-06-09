#!/usr/bin/env python3
"""Normalize generated LAMUH forward-special art into a 448-cell runtime atlas."""

from __future__ import annotations

import argparse
import json
from collections import deque
from pathlib import Path

from PIL import Image, ImageDraw, ImageFilter


COLS = 8
ROWS = 3
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
    return a > 0 and r >= 170 and g >= 165 and b >= 150 and max(r, g, b) - min(r, g, b) <= 76


def is_gold_candidate(pixel: tuple[int, int, int, int]) -> bool:
    r, g, b, a = pixel
    return a > 0 and r >= 170 and g >= 115 and b <= 115 and r - b >= 70


def is_cyan_candidate(pixel: tuple[int, int, int, int]) -> bool:
    r, g, b, a = pixel
    return a > 0 and b >= 130 and g >= 120 and b - r >= 35


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


def remove_global_checker_background(src: Image.Image) -> Image.Image:
    cleaned = src.convert("RGBA")
    pix = cleaned.load()
    bg = edge_connected_checker_mask(cleaned)
    for x, y in bg:
        pix[x, y] = (255, 255, 255, 0)
    return cleaned


def connected_components(img: Image.Image) -> list[dict[str, object]]:
    alpha = img.getchannel("A")
    grouped_alpha = alpha.filter(ImageFilter.MaxFilter(17))
    alpha_pix = alpha.load()
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
            gold = 0
            cyan = 0
            for py in range(raw_top, raw_bottom):
                for px in range(raw_left, raw_right):
                    if alpha_pix[px, py] <= 18:
                        continue
                    real_xs.append(px)
                    real_ys.append(py)
                    pixel = pix[px, py]
                    if is_white_coat_candidate(pixel):
                        white_like += 1
                    if is_gold_candidate(pixel):
                        gold += 1
                    if is_cyan_candidate(pixel):
                        cyan += 1
            area = len(real_xs)
            if area < 12:
                continue
            bbox = (min(real_xs), min(real_ys), max(real_xs) + 1, max(real_ys) + 1)
            comps.append({
                "area": area,
                "bbox": bbox,
                "centroid": (sum(real_xs) / area, sum(real_ys) / area),
                "white_like": white_like,
                "gold": gold,
                "cyan": cyan,
            })
    return comps


def assign_components_to_slots(components: list[dict[str, object]], width: int, height: int) -> dict[tuple[int, int], list[dict[str, object]]]:
    cell_w = width / COLS
    cell_h = height / ROWS
    slots = {(row, col): [] for row in range(ROWS) for col in range(COLS)}
    centers = [
        (row, col, (col + 0.5) * cell_w, (row + 0.5) * cell_h)
        for row in range(ROWS)
        for col in range(COLS)
    ]
    for comp in components:
        cx, cy = comp["centroid"]  # type: ignore[misc]
        row, col, _, _ = min(
            centers,
            key=lambda item: ((cx - item[2]) / cell_w) ** 2 + ((cy - item[3]) / cell_h) ** 2,
        )
        slots[(row, col)].append(comp)
    return slots


def count_pixels(img: Image.Image) -> dict[str, int]:
    pix = img.load()
    counts = {"white": 0, "gold": 0, "cyan": 0, "alpha": 0}
    for y in range(img.height):
        for x in range(img.width):
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
    return counts


def source_cell_bounds(width: int, height: int, col: int, row: int) -> tuple[int, int, int, int]:
    left = round(col * width / COLS)
    right = round((col + 1) * width / COLS)
    top = round(row * height / ROWS)
    bottom = round((row + 1) * height / ROWS)
    return left, top, right, bottom


def clean_source_cell(cell: Image.Image) -> tuple[Image.Image, dict[str, int | list[int] | None]]:
    cell = cell.convert("RGBA")
    source_counts = count_pixels(cell)
    pix = cell.load()
    bg = edge_connected_checker_mask(cell)
    for x, y in bg:
        pix[x, y] = (255, 255, 255, 0)
    cleaned_counts = count_pixels(cell)
    bbox = cell.getchannel("A").getbbox()
    return cell, {
        "source_white_like_pixels": source_counts["white"],
        "source_gold_pixels": source_counts["gold"],
        "source_cyan_pixels": source_counts["cyan"],
        "cleaned_white_like_pixels": cleaned_counts["white"],
        "cleaned_gold_pixels": cleaned_counts["gold"],
        "cleaned_cyan_pixels": cleaned_counts["cyan"],
        "source_bbox": list(bbox) if bbox else None,
    }


def align_to_runtime_cell(cleaned: Image.Image) -> tuple[Image.Image, dict[str, int | float | list[int] | None]]:
    scaled = cleaned.resize((DEST_CELL, DEST_CELL), Image.Resampling.LANCZOS)
    alpha = scaled.getchannel("A")
    bbox = alpha.getbbox()
    if not bbox:
        return scaled, {
            "bbox": None,
            "output_white_like_pixels": 0,
            "output_gold_pixels": 0,
            "output_cyan_pixels": 0,
            "alpha_pixels": 0,
            "foot_bottom": None,
        }

    bbox_w = bbox[2] - bbox[0]
    bbox_h = bbox[3] - bbox[1]
    fit = min((DEST_CELL - 4) / max(1, bbox_w), (BASELINE_Y - 2) / max(1, bbox_h), 1.0)
    if fit < 0.999:
      scaled = scaled.resize((max(1, round(DEST_CELL * fit)), max(1, round(DEST_CELL * fit))), Image.Resampling.LANCZOS)
      alpha = scaled.getchannel("A")
      bbox = alpha.getbbox()
      if not bbox:
          return Image.new("RGBA", (DEST_CELL, DEST_CELL), (0, 0, 0, 0)), {
              "bbox": None,
              "output_white_like_pixels": 0,
              "output_gold_pixels": 0,
              "output_cyan_pixels": 0,
              "alpha_pixels": 0,
              "foot_bottom": None,
          }

    alpha_pix = alpha.load()
    bottom = bbox[3] - 1
    foot_xs = []
    for y in range(max(bbox[1], bottom - 24), bottom + 1):
        xs = [x for x in range(bbox[0], bbox[2]) if alpha_pix[x, y] > 24]
        foot_xs.extend(xs)
    x_anchor = int(round(sum(foot_xs) / len(foot_xs))) if foot_xs else int(round((bbox[0] + bbox[2]) / 2))
    dx = (DEST_CELL // 2) - x_anchor
    dy = BASELINE_Y - bottom
    if dx + bbox[0] < 2:
        dx += 2 - (dx + bbox[0])
    if dx + bbox[2] > DEST_CELL - 2:
        dx -= (dx + bbox[2]) - (DEST_CELL - 2)

    aligned = Image.new("RGBA", (DEST_CELL, DEST_CELL), (0, 0, 0, 0))
    aligned.alpha_composite(scaled, (dx, dy))
    out_alpha = aligned.getchannel("A")
    out_bbox = out_alpha.getbbox()
    counts = count_pixels(aligned)
    return aligned, {
        "bbox": list(out_bbox) if out_bbox else None,
        "output_white_like_pixels": counts["white"],
        "output_gold_pixels": counts["gold"],
        "output_cyan_pixels": counts["cyan"],
        "alpha_pixels": counts["alpha"],
        "foot_bottom": out_bbox[3] - 1 if out_bbox else None,
    }


def compose_slot_cell(cleaned: Image.Image, comps: list[dict[str, object]], scale: float) -> tuple[Image.Image, dict[str, int | float | list[int] | None]]:
    if not comps:
        return Image.new("RGBA", (DEST_CELL, DEST_CELL), (0, 0, 0, 0)), {
            "source_white_like_pixels": 0,
            "source_gold_pixels": 0,
            "source_cyan_pixels": 0,
            "cleaned_white_like_pixels": 0,
            "cleaned_gold_pixels": 0,
            "cleaned_cyan_pixels": 0,
            "source_bbox": None,
            "bbox": None,
            "output_white_like_pixels": 0,
            "output_gold_pixels": 0,
            "output_cyan_pixels": 0,
            "alpha_pixels": 0,
            "foot_bottom": None,
        }

    left = min(comp["bbox"][0] for comp in comps)  # type: ignore[index]
    top = min(comp["bbox"][1] for comp in comps)  # type: ignore[index]
    right = max(comp["bbox"][2] for comp in comps)  # type: ignore[index]
    bottom = max(comp["bbox"][3] for comp in comps)  # type: ignore[index]
    crop = cleaned.crop((left, top, right, bottom))
    source_counts = {
        "white": sum(int(comp["white_like"]) for comp in comps),
        "gold": sum(int(comp["gold"]) for comp in comps),
        "cyan": sum(int(comp["cyan"]) for comp in comps),
    }
    scaled = crop.resize((max(1, round(crop.width * scale)), max(1, round(crop.height * scale))), Image.Resampling.LANCZOS)
    alpha = scaled.getchannel("A")
    bbox = alpha.getbbox()
    if not bbox:
        return Image.new("RGBA", (DEST_CELL, DEST_CELL), (0, 0, 0, 0)), {
            "source_white_like_pixels": source_counts["white"],
            "source_gold_pixels": source_counts["gold"],
            "source_cyan_pixels": source_counts["cyan"],
            "cleaned_white_like_pixels": source_counts["white"],
            "cleaned_gold_pixels": source_counts["gold"],
            "cleaned_cyan_pixels": source_counts["cyan"],
            "source_bbox": [left, top, right, bottom],
            "bbox": None,
            "output_white_like_pixels": 0,
            "output_gold_pixels": 0,
            "output_cyan_pixels": 0,
            "alpha_pixels": 0,
            "foot_bottom": None,
        }

    bbox_w = bbox[2] - bbox[0]
    bbox_h = bbox[3] - bbox[1]
    fit = min((DEST_CELL - 4) / max(1, bbox_w), (BASELINE_Y - 2) / max(1, bbox_h), 1.0)
    if fit < 0.999:
        scaled = scaled.resize((max(1, round(scaled.width * fit)), max(1, round(scaled.height * fit))), Image.Resampling.LANCZOS)
        alpha = scaled.getchannel("A")
        bbox = alpha.getbbox()
        if not bbox:
            return Image.new("RGBA", (DEST_CELL, DEST_CELL), (0, 0, 0, 0)), {
                "source_white_like_pixels": source_counts["white"],
                "source_gold_pixels": source_counts["gold"],
                "source_cyan_pixels": source_counts["cyan"],
                "cleaned_white_like_pixels": source_counts["white"],
                "cleaned_gold_pixels": source_counts["gold"],
                "cleaned_cyan_pixels": source_counts["cyan"],
                "source_bbox": [left, top, right, bottom],
                "bbox": None,
                "output_white_like_pixels": 0,
                "output_gold_pixels": 0,
                "output_cyan_pixels": 0,
                "alpha_pixels": 0,
                "foot_bottom": None,
            }

    alpha_pix = alpha.load()
    bottom_px = bbox[3] - 1
    foot_xs = []
    for y in range(max(bbox[1], bottom_px - 24), bottom_px + 1):
        xs = [x for x in range(bbox[0], bbox[2]) if alpha_pix[x, y] > 24]
        foot_xs.extend(xs)
    x_anchor = int(round(sum(foot_xs) / len(foot_xs))) if foot_xs else int(round((bbox[0] + bbox[2]) / 2))
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
    counts = count_pixels(aligned)
    return aligned, {
        "source_white_like_pixels": source_counts["white"],
        "source_gold_pixels": source_counts["gold"],
        "source_cyan_pixels": source_counts["cyan"],
        "cleaned_white_like_pixels": source_counts["white"],
        "cleaned_gold_pixels": source_counts["gold"],
        "cleaned_cyan_pixels": source_counts["cyan"],
        "source_bbox": [left, top, right, bottom],
        "bbox": list(out_bbox) if out_bbox else None,
        "output_white_like_pixels": counts["white"],
        "output_gold_pixels": counts["gold"],
        "output_cyan_pixels": counts["cyan"],
        "alpha_pixels": counts["alpha"],
        "foot_bottom": out_bbox[3] - 1 if out_bbox else None,
    }


def build_preview(atlas: Image.Image, output: Path) -> None:
    preview = Image.new("RGBA", atlas.size, (46, 49, 54, 255))
    preview.alpha_composite(atlas)
    draw = ImageDraw.Draw(preview)
    for x in range(0, atlas.width + 1, DEST_CELL):
        draw.line([(x, 0), (x, atlas.height)], fill=(100, 160, 255, 160), width=2)
    for y in range(0, atlas.height + 1, DEST_CELL):
        draw.line([(0, y), (atlas.width, y)], fill=(100, 160, 255, 160), width=2)
    for row in range(ROWS):
        y = row * DEST_CELL + BASELINE_Y
        draw.line([(0, y), (atlas.width, y)], fill=(255, 210, 60, 180), width=2)
    preview.save(output)


def normalize(source: Path, output: Path, report_path: Path, preview_path: Path) -> dict[str, object]:
    src = Image.open(source).convert("RGBA")
    cleaned = remove_global_checker_background(src)
    components = connected_components(cleaned)
    slots = assign_components_to_slots(components, src.width, src.height)
    scale = DEST_CELL / (src.width / COLS)
    atlas = Image.new("RGBA", (DEST_WIDTH, DEST_HEIGHT), (0, 0, 0, 0))
    cells = []

    for row in range(ROWS):
        for col in range(COLS):
            aligned, metrics = compose_slot_cell(cleaned, slots[(row, col)], scale)
            atlas.alpha_composite(aligned, (col * DEST_CELL, row * DEST_CELL))
            cells.append({"row": row, "col": col, "component_count": len(slots[(row, col)]), **metrics})

    output.parent.mkdir(parents=True, exist_ok=True)
    atlas.save(output)
    build_preview(atlas, preview_path)

    alpha = atlas.getchannel("A")
    alpha_hist = alpha.histogram()
    foot_bottoms = [int(c["foot_bottom"]) for c in cells if isinstance(c["foot_bottom"], int)]
    white_ok = all(int(c["output_white_like_pixels"]) > 200 for c in cells)
    gold_ok = sum(int(c["output_gold_pixels"]) for c in cells) >= 6000
    cyan_ok = sum(int(c["output_cyan_pixels"]) for c in cells) >= 120
    baseline_max_deviation = max((abs(y - BASELINE_Y) for y in foot_bottoms), default=None)

    report = {
        "source": str(source),
        "source_size": [src.width, src.height],
        "source_connected_components": len(components),
        "source_sprite_components": sum(1 for c in cells if int(c["alpha_pixels"]) > 0),
        "output": str(output),
        "preview": str(preview_path),
        "output_size": [DEST_WIDTH, DEST_HEIGHT],
        "grid": {"cols": COLS, "rows": ROWS, "cell": DEST_CELL, "baselineY": BASELINE_Y},
        "alpha_extrema": list(alpha.getextrema()),
        "transparent_pixels": alpha_hist[0],
        "opaque_or_semi_pixels": sum(alpha_hist[1:]),
        "has_real_transparency": alpha.getextrema()[0] == 0 and alpha_hist[0] > 0,
        "white_coat_preserved": white_ok,
        "gold_vfx_preserved": gold_ok,
        "cyan_vfx_preserved": cyan_ok,
        "total_output_gold_pixels": sum(int(c["output_gold_pixels"]) for c in cells),
        "total_output_cyan_pixels": sum(int(c["output_cyan_pixels"]) for c in cells),
        "baseline_max_deviation": baseline_max_deviation,
        "row_mapping": {
            "0": ["lamuh_dash_strike", "dash_strike"],
            "1": ["lamuh_mirror_break", "mirror_break"],
            "2": ["lamuh_mirror_pierce", "mirror_pierce"],
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
        default=Path("assets/characters/lamuh/lamuh_sheet_forward_specials_redesign_atlas.png"),
        type=Path,
    )
    parser.add_argument(
        "--report",
        default=Path("assets/characters/lamuh/lamuh_sheet_forward_specials_redesign_report.json"),
        type=Path,
    )
    parser.add_argument(
        "--preview",
        default=Path("assets/characters/lamuh/lamuh_sheet_forward_specials_redesign_preview.png"),
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
        "baseline_max_deviation": report["baseline_max_deviation"],
    }
    print(json.dumps(summary, indent=2))
    if report["output_size"] != [DEST_WIDTH, DEST_HEIGHT]:
        return 2
    if not report["has_real_transparency"]:
        return 3
    if not report["white_coat_preserved"]:
        return 4
    if not report["gold_vfx_preserved"] or not report["cyan_vfx_preserved"]:
        return 5
    if report["source_sprite_components"] != COLS * ROWS:
        return 6
    if report["baseline_max_deviation"] is not None and report["baseline_max_deviation"] > 6:
        return 7
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
