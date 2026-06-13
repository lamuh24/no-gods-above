#!/usr/bin/env python3
"""Normalize the LAMUH 2.5D Sheet 1 preview into 448px runtime cells."""

from __future__ import annotations

import argparse
import json
import shutil
from collections import deque
from pathlib import Path

from PIL import Image, ImageFilter


COLS = 8
ROWS = 6
DEST_CELL = 448
DEST_WIDTH = COLS * DEST_CELL
DEST_HEIGHT = ROWS * DEST_CELL
BASELINE_Y = 382


ROW_MAPPING = {
    "0": ["lamuh_idle"],
    "1": ["lamuh_walk_forward"],
    "2": ["lamuh_walk_back_preview"],
    "3": ["lamuh_jump_land_preview"],
    "4": ["lamuh_crouch_to_ready_preview"],
    "5": ["lamuh_run_dash_preview"],
}


def is_gray_background(pixel: tuple[int, int, int, int]) -> bool:
    r, g, b, a = pixel
    if a == 0:
        return True
    spread = max(r, g, b) - min(r, g, b)
    brightness = (r + g + b) / 3
    return spread <= 18 and 125 <= brightness <= 235


def bg_distance(pixel: tuple[int, int, int, int], bg: tuple[int, int, int]) -> float:
    r, g, b, _ = pixel
    return ((r - bg[0]) ** 2 + (g - bg[1]) ** 2 + (b - bg[2]) ** 2) ** 0.5


def is_white_coat_candidate(pixel: tuple[int, int, int, int]) -> bool:
    r, g, b, a = pixel
    if a == 0:
        return False
    return r >= 165 and g >= 158 and b >= 145 and max(r, g, b) - min(r, g, b) <= 85


def remove_edge_connected_gray(cell: Image.Image) -> Image.Image:
    out = cell.convert("RGBA")
    pix = out.load()
    width, height = out.size
    corners = [pix[0, 0], pix[width - 1, 0], pix[0, height - 1], pix[width - 1, height - 1]]
    bg = tuple(round(sum(c[i] for c in corners) / len(corners)) for i in range(3))
    visited: set[tuple[int, int]] = set()
    queue: deque[tuple[int, int]] = deque()

    def enqueue_if_bg(x: int, y: int) -> None:
        if (x, y) in visited:
            return
        if is_gray_background(pix[x, y]) and bg_distance(pix[x, y], bg) <= 34:
            visited.add((x, y))
            queue.append((x, y))

    for x in range(width):
        enqueue_if_bg(x, 0)
        enqueue_if_bg(x, height - 1)
    for y in range(height):
        enqueue_if_bg(0, y)
        enqueue_if_bg(width - 1, y)

    while queue:
        x, y = queue.popleft()
        for nx, ny in ((x + 1, y), (x - 1, y), (x, y + 1), (x, y - 1)):
            if nx < 0 or ny < 0 or nx >= width or ny >= height or (nx, ny) in visited:
                continue
            if is_gray_background(pix[nx, ny]) and bg_distance(pix[nx, ny], bg) <= 38:
                visited.add((nx, ny))
                queue.append((nx, ny))

    for x, y in visited:
        r, g, b, _ = pix[x, y]
        pix[x, y] = (r, g, b, 0)
    return out


def remove_tiny_alpha_islands(img: Image.Image, min_area: int = 72) -> tuple[Image.Image, int]:
    out = img.convert("RGBA")
    alpha = out.getchannel("A")
    alpha_pix = alpha.load()
    pix = out.load()
    width, height = out.size
    visited: set[tuple[int, int]] = set()
    removed = 0
    for y in range(height):
        for x in range(width):
            if (x, y) in visited or alpha_pix[x, y] <= 0:
                continue
            queue: deque[tuple[int, int]] = deque([(x, y)])
            visited.add((x, y))
            pts: list[tuple[int, int]] = []
            while queue:
                cx, cy = queue.popleft()
                pts.append((cx, cy))
                for nx, ny in ((cx + 1, cy), (cx - 1, cy), (cx, cy + 1), (cx, cy - 1)):
                    if nx < 0 or ny < 0 or nx >= width or ny >= height or (nx, ny) in visited:
                        continue
                    if alpha_pix[nx, ny] > 0:
                        visited.add((nx, ny))
                        queue.append((nx, ny))
            if len(pts) >= min_area:
                continue
            for px, py in pts:
                r, g, b, _ = pix[px, py]
                pix[px, py] = (r, g, b, 0)
            removed += len(pts)
    return out, removed


def keep_main_alpha_component(img: Image.Image) -> tuple[Image.Image, int]:
    out = img.convert("RGBA")
    alpha = out.getchannel("A")
    alpha_pix = alpha.load()
    pix = out.load()
    width, height = out.size
    visited: set[tuple[int, int]] = set()
    comps: list[list[tuple[int, int]]] = []
    for y in range(height):
        for x in range(width):
            if (x, y) in visited or alpha_pix[x, y] <= 0:
                continue
            queue: deque[tuple[int, int]] = deque([(x, y)])
            visited.add((x, y))
            pts: list[tuple[int, int]] = []
            while queue:
                cx, cy = queue.popleft()
                pts.append((cx, cy))
                for nx, ny in ((cx + 1, cy), (cx - 1, cy), (cx, cy + 1), (cx, cy - 1)):
                    if nx < 0 or ny < 0 or nx >= width or ny >= height or (nx, ny) in visited:
                        continue
                    if alpha_pix[nx, ny] > 0:
                        visited.add((nx, ny))
                        queue.append((nx, ny))
            comps.append(pts)
    if not comps:
        return out, 0

    main = max(comps, key=len)
    keep = set(main)
    removed = 0
    for comp in comps:
        if comp is main:
            continue
        for px, py in comp:
            r, g, b, _ = pix[px, py]
            pix[px, py] = (r, g, b, 0)
            removed += 1
    return out, removed


def is_neutral_line_pixel(pixel: tuple[int, int, int, int]) -> bool:
    r, g, b, a = pixel
    if a == 0:
        return False
    spread = max(r, g, b) - min(r, g, b)
    brightness = (r + g + b) / 3
    return spread <= 45 and 45 <= brightness <= 235


def remove_horizontal_guide_lines(img: Image.Image, min_run: int = 12) -> tuple[Image.Image, int]:
    out = img.convert("RGBA")
    pix = out.load()
    removed = 0
    for y in range(out.height):
        run: list[int] = []
        for x in range(out.width + 1):
            near_cell_edge = y < 110 or y > 346
            if x < out.width and near_cell_edge and is_neutral_line_pixel(pix[x, y]):
                run.append(x)
                continue
            if len(run) >= min_run:
                for px in run:
                    r, g, b, _ = pix[px, y]
                    pix[px, y] = (r, g, b, 0)
                    removed += 1
            run = []
    return out, removed


def fill_alpha_holes(img: Image.Image) -> tuple[Image.Image, int]:
    """Fill enclosed transparency inside the character mask while keeping outside background transparent."""
    out = img.convert("RGBA")
    alpha = out.getchannel("A")
    # Close pinholes first so tiny antialias cracks do not connect coat interiors to the outside background.
    closed = alpha.filter(ImageFilter.MaxFilter(7)).filter(ImageFilter.MinFilter(7))
    closed_pix = closed.load()
    width, height = out.size
    reachable: set[tuple[int, int]] = set()
    queue: deque[tuple[int, int]] = deque()

    def enqueue_if_bg(x: int, y: int) -> None:
        if (x, y) in reachable:
            return
        if closed_pix[x, y] <= 0:
            reachable.add((x, y))
            queue.append((x, y))

    for x in range(width):
        enqueue_if_bg(x, 0)
        enqueue_if_bg(x, height - 1)
    for y in range(height):
        enqueue_if_bg(0, y)
        enqueue_if_bg(width - 1, y)

    while queue:
        x, y = queue.popleft()
        for nx, ny in ((x + 1, y), (x - 1, y), (x, y + 1), (x, y - 1)):
            if nx < 0 or ny < 0 or nx >= width or ny >= height or (nx, ny) in reachable:
                continue
            if closed_pix[nx, ny] <= 0:
                reachable.add((nx, ny))
                queue.append((nx, ny))

    pix = out.load()
    alpha_pix = alpha.load()
    repaired = 0
    for y in range(height):
        for x in range(width):
            if alpha_pix[x, y] > 0 or (x, y) in reachable or closed_pix[x, y] <= 0:
                continue
            r, g, b, _ = pix[x, y]
            # Keep restored pixels slightly soft when they are neutral source shading, but never transparent.
            pix[x, y] = (r, g, b, 255)
            repaired += 1
    return out, repaired


def cell_bounds(width: int, height: int, row: int, col: int) -> tuple[int, int, int, int]:
    left = round(col * width / COLS)
    right = round((col + 1) * width / COLS)
    top = round(row * height / ROWS)
    bottom = round((row + 1) * height / ROWS)
    return left, top, right, bottom


def connected_components(img: Image.Image) -> list[dict[str, object]]:
    alpha = img.getchannel("A")
    grouped = alpha.filter(ImageFilter.MaxFilter(13))
    alpha_pix = alpha.load()
    grouped_pix = grouped.load()
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
            xs: list[int] = []
            ys: list[int] = []
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
            real_xs: list[int] = []
            real_ys: list[int] = []
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
            if area < 40:
                continue
            bbox = (min(real_xs), min(real_ys), max(real_xs) + 1, max(real_ys) + 1)
            bbox_w = bbox[2] - bbox[0]
            bbox_h = bbox[3] - bbox[1]
            if bbox_w <= 4 or bbox_h <= 4:
                continue
            comps.append({
                "area": area,
                "bbox": bbox,
                "centroid": (sum(real_xs) / area, sum(real_ys) / area),
                "white_like": white_like,
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


def measure_white_like(img: Image.Image) -> int:
    pix = img.load()
    count = 0
    for y in range(img.height):
        for x in range(img.width):
            if is_white_coat_candidate(pix[x, y]):
                count += 1
    return count


def normalize_cell(source_cell: Image.Image) -> tuple[Image.Image, dict[str, object]]:
    cleaned = remove_edge_connected_gray(source_cell)
    cleaned, repaired_source_holes = fill_alpha_holes(cleaned)
    source_white = measure_white_like(cleaned)
    bbox = cleaned.getchannel("A").getbbox()
    if not bbox:
        return Image.new("RGBA", (DEST_CELL, DEST_CELL), (0, 0, 0, 0)), {
            "bbox": None,
            "alpha_pixels": 0,
            "source_white_like_pixels": source_white,
            "output_white_like_pixels": 0,
            "foot_bottom": None,
            "baseline_delta": None,
            "repaired_source_holes": repaired_source_holes,
        }

    crop = cleaned.crop(bbox)
    fit_scale = min((DEST_CELL - 10) / crop.width, (BASELINE_Y - 4) / crop.height)
    scaled_w = max(1, round(crop.width * fit_scale))
    scaled_h = max(1, round(crop.height * fit_scale))
    scaled = crop.resize((scaled_w, scaled_h), Image.Resampling.LANCZOS)
    alpha = scaled.getchannel("A")
    scaled_bbox = alpha.getbbox()
    if not scaled_bbox:
        return Image.new("RGBA", (DEST_CELL, DEST_CELL), (0, 0, 0, 0)), {
            "bbox": None,
            "alpha_pixels": 0,
            "source_white_like_pixels": source_white,
            "output_white_like_pixels": 0,
            "foot_bottom": None,
            "baseline_delta": None,
        }

    alpha_pix = alpha.load()
    bottom = scaled_bbox[3] - 1
    foot_xs: list[int] = []
    for y in range(max(scaled_bbox[1], bottom - 24), bottom + 1):
        foot_xs.extend(x for x in range(scaled_bbox[0], scaled_bbox[2]) if alpha_pix[x, y] > 24)
    if foot_xs:
        x_anchor = round(sum(foot_xs) / len(foot_xs))
    else:
        x_anchor = round((scaled_bbox[0] + scaled_bbox[2]) / 2)

    dx = DEST_CELL // 2 - x_anchor
    dy = BASELINE_Y - bottom
    if dx + scaled_bbox[0] < 2:
        dx += 2 - (dx + scaled_bbox[0])
    if dx + scaled_bbox[2] > DEST_CELL - 2:
        dx -= (dx + scaled_bbox[2]) - (DEST_CELL - 2)

    out = Image.new("RGBA", (DEST_CELL, DEST_CELL), (0, 0, 0, 0))
    out.alpha_composite(scaled, (dx, dy))
    out, repaired_output_holes = fill_alpha_holes(out)
    out, removed_guide_line_pixels = remove_horizontal_guide_lines(out)
    out, removed_tiny_islands = remove_tiny_alpha_islands(out)
    out, removed_detached_pixels = keep_main_alpha_component(out)
    out_alpha = out.getchannel("A")
    out_bbox = out_alpha.getbbox()
    alpha_pixels = sum(1 for value in out_alpha.getdata() if value > 0)
    output_white = measure_white_like(out)
    foot_bottom = out_bbox[3] - 1 if out_bbox else None
    return out, {
        "bbox": list(out_bbox) if out_bbox else None,
        "alpha_pixels": alpha_pixels,
        "source_white_like_pixels": source_white,
        "output_white_like_pixels": output_white,
        "foot_bottom": foot_bottom,
        "baseline_delta": (foot_bottom - BASELINE_Y) if isinstance(foot_bottom, int) else None,
        "repaired_source_holes": repaired_source_holes,
        "repaired_output_holes": repaired_output_holes,
        "removed_tiny_island_pixels": removed_tiny_islands,
        "removed_detached_pixels": removed_detached_pixels,
        "removed_guide_line_pixels": removed_guide_line_pixels,
    }


def normalize_slot_from_components(cleaned: Image.Image, comps: list[dict[str, object]]) -> tuple[Image.Image, dict[str, object]]:
    if not comps:
        return Image.new("RGBA", (DEST_CELL, DEST_CELL), (0, 0, 0, 0)), {
            "bbox": None,
            "alpha_pixels": 0,
            "source_white_like_pixels": 0,
            "output_white_like_pixels": 0,
            "foot_bottom": None,
            "baseline_delta": None,
            "component_count": 0,
        }

    left = min(comp["bbox"][0] for comp in comps)  # type: ignore[index]
    top = min(comp["bbox"][1] for comp in comps)  # type: ignore[index]
    right = max(comp["bbox"][2] for comp in comps)  # type: ignore[index]
    bottom = max(comp["bbox"][3] for comp in comps)  # type: ignore[index]
    pad = 3
    left = max(0, left - pad)
    top = max(0, top - pad)
    right = min(cleaned.width, right + pad)
    bottom = min(cleaned.height, bottom + pad)
    crop = cleaned.crop((left, top, right, bottom))
    bbox = crop.getchannel("A").getbbox()
    if not bbox:
        return Image.new("RGBA", (DEST_CELL, DEST_CELL), (0, 0, 0, 0)), {
            "bbox": None,
            "alpha_pixels": 0,
            "source_white_like_pixels": sum(int(comp["white_like"]) for comp in comps),
            "output_white_like_pixels": 0,
            "foot_bottom": None,
            "baseline_delta": None,
            "component_count": len(comps),
        }

    crop = crop.crop(bbox)
    fit_scale = min((DEST_CELL - 10) / crop.width, (BASELINE_Y - 4) / crop.height, 448 / (cleaned.width / COLS))
    scaled_w = max(1, round(crop.width * fit_scale))
    scaled_h = max(1, round(crop.height * fit_scale))
    scaled = crop.resize((scaled_w, scaled_h), Image.Resampling.LANCZOS)
    alpha = scaled.getchannel("A")
    scaled_bbox = alpha.getbbox()
    if not scaled_bbox:
        return Image.new("RGBA", (DEST_CELL, DEST_CELL), (0, 0, 0, 0)), {
            "bbox": None,
            "alpha_pixels": 0,
            "source_white_like_pixels": sum(int(comp["white_like"]) for comp in comps),
            "output_white_like_pixels": 0,
            "foot_bottom": None,
            "baseline_delta": None,
            "component_count": len(comps),
        }

    alpha_pix = alpha.load()
    bottom_px = scaled_bbox[3] - 1
    foot_xs: list[int] = []
    for y in range(max(scaled_bbox[1], bottom_px - 24), bottom_px + 1):
        foot_xs.extend(x for x in range(scaled_bbox[0], scaled_bbox[2]) if alpha_pix[x, y] > 24)
    if foot_xs:
        x_anchor = round(sum(foot_xs) / len(foot_xs))
    else:
        x_anchor = round((scaled_bbox[0] + scaled_bbox[2]) / 2)

    dx = DEST_CELL // 2 - x_anchor
    dy = BASELINE_Y - bottom_px
    if dx + scaled_bbox[0] < 2:
        dx += 2 - (dx + scaled_bbox[0])
    if dx + scaled_bbox[2] > DEST_CELL - 2:
        dx -= (dx + scaled_bbox[2]) - (DEST_CELL - 2)

    out = Image.new("RGBA", (DEST_CELL, DEST_CELL), (0, 0, 0, 0))
    out.alpha_composite(scaled, (dx, dy))
    out_alpha = out.getchannel("A")
    out_bbox = out_alpha.getbbox()
    alpha_pixels = sum(1 for value in out_alpha.getdata() if value > 0)
    output_white = measure_white_like(out)
    foot_bottom = out_bbox[3] - 1 if out_bbox else None
    return out, {
        "bbox": list(out_bbox) if out_bbox else None,
        "alpha_pixels": alpha_pixels,
        "source_white_like_pixels": sum(int(comp["white_like"]) for comp in comps),
        "output_white_like_pixels": output_white,
        "foot_bottom": foot_bottom,
        "baseline_delta": (foot_bottom - BASELINE_Y) if isinstance(foot_bottom, int) else None,
        "component_count": len(comps),
    }


def normalize(source: Path, source_copy: Path, output: Path, preview: Path, report_path: Path) -> dict[str, object]:
    src = Image.open(source).convert("RGBA")
    source_copy.parent.mkdir(parents=True, exist_ok=True)
    if source.resolve() != source_copy.resolve():
        shutil.copy2(source, source_copy)

    atlas = Image.new("RGBA", (DEST_WIDTH, DEST_HEIGHT), (0, 0, 0, 0))
    cells = []
    for row in range(ROWS):
        for col in range(COLS):
            bounds = cell_bounds(src.width, src.height, row, col)
            normalized, metrics = normalize_cell(src.crop(bounds))
            atlas.alpha_composite(normalized, (col * DEST_CELL, row * DEST_CELL))
            cells.append({"row": row, "col": col, "source_bounds": list(bounds), **metrics})

    output.parent.mkdir(parents=True, exist_ok=True)
    atlas.save(output)
    atlas.save(preview)

    alpha = atlas.getchannel("A")
    alpha_extrema = alpha.getextrema()
    alpha_hist = alpha.histogram()
    baseline_deltas = [c["baseline_delta"] for c in cells if isinstance(c["baseline_delta"], int)]
    white_failures = [
        {"row": c["row"], "col": c["col"], "output_white_like_pixels": c["output_white_like_pixels"]}
        for c in cells
        if int(c["output_white_like_pixels"]) < 150
    ]
    report = {
        "source": str(source),
        "source_copy": str(source_copy),
        "source_size": [src.width, src.height],
        "source_mode": Image.open(source).mode,
        "source_components": None,
        "output": str(output),
        "preview": str(preview),
        "output_size": [DEST_WIDTH, DEST_HEIGHT],
        "grid": {"cols": COLS, "rows": ROWS, "cell": DEST_CELL, "baselineY": BASELINE_Y},
        "row_mapping": ROW_MAPPING,
        "alpha_extrema": list(alpha_extrema),
        "transparent_pixels": alpha_hist[0],
        "opaque_or_semi_pixels": sum(alpha_hist[1:]),
        "has_real_transparency": alpha_extrema[0] == 0 and alpha_hist[0] > 0,
        "baseline_max_deviation": max((abs(v) for v in baseline_deltas), default=None),
        "white_coat_preserved": not white_failures,
        "white_failures": white_failures,
        "classification": "PREVIEW_ONLY",
        "notes": [
            "Opaquely rendered gray source was alpha-cleaned by edge-connected gray flood fill.",
            "This preview atlas is intended for in-game visual review before final acceptance.",
            "Runtime wiring should remain branch-only until the user approves the style.",
        ],
        "cells": cells,
    }
    report_path.parent.mkdir(parents=True, exist_ok=True)
    report_path.write_text(json.dumps(report, indent=2), encoding="utf-8")
    return report


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--source", required=True, type=Path)
    parser.add_argument(
        "--source-copy",
        default=Path("assets/characters/lamuh/2p5d/sheet1/lamuh_sheet_1_2p5d_source.png"),
        type=Path,
    )
    parser.add_argument(
        "--output",
        default=Path("assets/characters/lamuh/lamuh_sheet_1_2p5d_preview_atlas.png"),
        type=Path,
    )
    parser.add_argument(
        "--preview",
        default=Path("assets/characters/lamuh/lamuh_sheet_1_2p5d_preview_contact.png"),
        type=Path,
    )
    parser.add_argument(
        "--report",
        default=Path("assets/characters/lamuh/lamuh_sheet_1_2p5d_preview_report.json"),
        type=Path,
    )
    args = parser.parse_args()

    report = normalize(args.source, args.source_copy, args.output, args.preview, args.report)
    summary = {
        "source": report["source"],
        "source_size": report["source_size"],
        "output": report["output"],
        "output_size": report["output_size"],
        "has_real_transparency": report["has_real_transparency"],
        "white_coat_preserved": report["white_coat_preserved"],
        "baseline_max_deviation": report["baseline_max_deviation"],
        "classification": report["classification"],
    }
    print(json.dumps(summary, indent=2))
    return 0 if report["has_real_transparency"] else 2


if __name__ == "__main__":
    raise SystemExit(main())
