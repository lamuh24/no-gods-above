#!/usr/bin/env python3
"""Normalize LAMUH Reactions + Defense source into a 448-cell runtime atlas."""

from __future__ import annotations

import argparse
import json
from collections import deque
from pathlib import Path
from statistics import median

from PIL import Image, ImageDraw, ImageFilter


COLS = 8
ROWS = 6
DEST_CELL = 448
BASELINE_Y = 382
DEST_SIZE = (COLS * DEST_CELL, ROWS * DEST_CELL)

ROW_MAPPING = {
    "0": ["lamuh_hit_light", "hit_light"],
    "1": ["lamuh_hit_heavy", "hit_heavy"],
    "2": ["lamuh_launch_hit", "lamuh_air_hit", "launch_hit"],
    "3": ["lamuh_wall_bounce", "lamuh_hard_knockback", "wall_bounce"],
    "4": ["lamuh_knockdown", "lamuh_down", "knockdown"],
    "5": ["lamuh_getup", "lamuh_block_high", "lamuh_block_low"],
}

ROW5_FRAME_RANGES = {
    "lamuh_getup": [0, 3],
    "lamuh_block_high": [4, 5],
    "lamuh_block_low": [6, 7],
}

REPAIR_SLOTS = {
    (2, 7): (2, 6),
}


def source_cell_bounds(width: int, height: int, col: int, row: int) -> tuple[int, int, int, int]:
    return (
        round(col * width / COLS),
        round(row * height / ROWS),
        round((col + 1) * width / COLS),
        round((row + 1) * height / ROWS),
    )


def is_checker_candidate(pixel: tuple[int, int, int, int]) -> bool:
    r, g, b, a = pixel
    if a <= 0:
        return True
    low_saturation = max(r, g, b) - min(r, g, b) <= 20
    return low_saturation and r >= 206 and g >= 206 and b >= 206


def is_opaque_checker_candidate(pixel: tuple[int, int, int, int]) -> bool:
    r, g, b, a = pixel
    if a <= 8:
        return False
    low_saturation = max(r, g, b) - min(r, g, b) <= 20
    return low_saturation and r >= 206 and g >= 206 and b >= 206


def is_white_candidate(pixel: tuple[int, int, int, int]) -> bool:
    r, g, b, a = pixel
    return a > 0 and r >= 150 and g >= 145 and b >= 130 and max(r, g, b) - min(r, g, b) <= 100


def is_skin_candidate(pixel: tuple[int, int, int, int]) -> bool:
    r, g, b, a = pixel
    return a > 0 and 45 <= r <= 190 and 18 <= g <= 135 and 5 <= b <= 105 and r > g and g >= b - 16


def is_dark_candidate(pixel: tuple[int, int, int, int]) -> bool:
    r, g, b, a = pixel
    return a > 0 and r <= 104 and g <= 104 and b <= 112


def is_gold_candidate(pixel: tuple[int, int, int, int]) -> bool:
    r, g, b, a = pixel
    return a > 0 and r >= 128 and 58 <= g <= 210 and b <= 150 and r - b >= 24


def is_cyan_candidate(pixel: tuple[int, int, int, int]) -> bool:
    r, g, b, a = pixel
    return a > 0 and b >= 112 and g >= 92 and b - r >= 18


def edge_connected_checker_mask(img: Image.Image) -> set[tuple[int, int]]:
    rgba = img.convert("RGBA")
    pix = rgba.load()
    width, height = rgba.size
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


def remove_checker(cell: Image.Image) -> Image.Image:
    rgba = cell.convert("RGBA")
    pix = rgba.load()
    for x, y in edge_connected_checker_mask(rgba):
        pix[x, y] = (255, 255, 255, 0)
    return rgba


def remove_global_checker_background(src: Image.Image) -> Image.Image:
    cleaned = src.convert("RGBA")
    pix = cleaned.load()
    for x, y in edge_connected_checker_mask(cleaned):
        pix[x, y] = (255, 255, 255, 0)
    return cleaned


def count_edge_connected_checker_pixels(img: Image.Image) -> int:
    rgba = img.convert("RGBA")
    pix = rgba.load()
    width, height = rgba.size
    visited: set[tuple[int, int]] = set()
    queue: deque[tuple[int, int]] = deque()

    def add_if_bg(x: int, y: int) -> None:
        if (x, y) in visited:
            return
        if is_opaque_checker_candidate(pix[x, y]):
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
            if is_opaque_checker_candidate(pix[nx, ny]):
                visited.add((nx, ny))
                queue.append((nx, ny))
    return len(visited)


def count_pixels(img: Image.Image) -> dict[str, int]:
    rgba = img.convert("RGBA")
    pix = rgba.load()
    counts = {"alpha": 0, "white": 0, "skin": 0, "dark": 0, "gold": 0, "cyan": 0, "checker": 0}
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
            if is_checker_candidate(pixel):
                counts["checker"] += 1
    return counts


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
            dark_like = 0
            for py in range(raw_top, raw_bottom):
                for px in range(raw_left, raw_right):
                    if alpha_pix[px, py] <= 18:
                        continue
                    real_xs.append(px)
                    real_ys.append(py)
                    pixel = pix[px, py]
                    if is_white_candidate(pixel):
                        white_like += 1
                    if is_dark_candidate(pixel):
                        dark_like += 1
            area = len(real_xs)
            if area < 12:
                continue
            bbox = (min(real_xs), min(real_ys), max(real_xs) + 1, max(real_ys) + 1)
            comps.append({
                "area": area,
                "bbox": bbox,
                "centroid": (sum(real_xs) / area, sum(real_ys) / area),
                "white_like": white_like,
                "dark_like": dark_like,
            })
    return comps


def assign_components_to_slots(components: list[dict[str, object]], width: int, height: int) -> dict[tuple[int, int], list[dict[str, object]]]:
    cell_w = width / COLS
    cell_h = height / ROWS
    centers = [
        (row, col, (col + 0.5) * cell_w, (row + 0.5) * cell_h)
        for row in range(ROWS)
        for col in range(COLS)
    ]
    slots = {(row, col): [] for row in range(ROWS) for col in range(COLS)}
    for comp in components:
        cx, cy = comp["centroid"]  # type: ignore[misc]
        row, col, _, _ = min(
            centers,
            key=lambda item: ((cx - item[2]) / cell_w) ** 2 + ((cy - item[3]) / cell_h) ** 2,
        )
        slots[(row, col)].append(comp)
    return slots


def content_bbox(img: Image.Image) -> tuple[int, int, int, int] | None:
    return img.getchannel("A").getbbox()


def body_bbox(img: Image.Image) -> tuple[int, int, int, int] | None:
    rgba = img.convert("RGBA")
    pix = rgba.load()
    xs: list[int] = []
    ys: list[int] = []
    for y in range(rgba.height):
        for x in range(rgba.width):
            pixel = pix[x, y]
            if pixel[3] <= 0:
                continue
            if is_white_candidate(pixel) or is_skin_candidate(pixel) or is_dark_candidate(pixel) or is_gold_candidate(pixel):
                xs.append(x)
                ys.append(y)
    if not xs:
        return content_bbox(rgba)
    return min(xs), min(ys), max(xs) + 1, max(ys) + 1


def alpha_components(img: Image.Image) -> list[dict[str, object]]:
    alpha = img.getchannel("A")
    alpha_pix = alpha.load()
    width, height = img.size
    visited: set[tuple[int, int]] = set()
    comps: list[dict[str, object]] = []
    for y in range(height):
        for x in range(width):
            if (x, y) in visited or alpha_pix[x, y] <= 18:
                continue
            queue: deque[tuple[int, int]] = deque([(x, y)])
            visited.add((x, y))
            pixels: list[tuple[int, int]] = []
            while queue:
                cx, cy = queue.popleft()
                pixels.append((cx, cy))
                for nx, ny in ((cx + 1, cy), (cx - 1, cy), (cx, cy + 1), (cx, cy - 1)):
                    if nx < 0 or ny < 0 or nx >= width or ny >= height or (nx, ny) in visited:
                        continue
                    if alpha_pix[nx, ny] > 18:
                        visited.add((nx, ny))
                        queue.append((nx, ny))
            xs = [px for px, _ in pixels]
            ys = [py for _, py in pixels]
            comps.append({
                "area": len(pixels),
                "bbox": (min(xs), min(ys), max(xs) + 1, max(ys) + 1),
                "pixels": pixels,
            })
    return comps


def remove_edge_strays(cell: Image.Image) -> Image.Image:
    rgba = cell.convert("RGBA")
    pix = rgba.load()
    width, height = rgba.size
    comps = alpha_components(rgba)
    if not comps:
        return rgba
    largest = max(comps, key=lambda item: int(item["area"]))
    largest_area = int(largest["area"])
    for comp in comps:
        if comp is largest:
            continue
        area = int(comp["area"])
        bbox = comp["bbox"]  # type: ignore[assignment]
        near_edge = int(bbox[1]) <= 5 or int(bbox[3]) >= height - 5 or int(bbox[0]) <= 3 or int(bbox[2]) >= width - 3
        small_next_to_main = area < max(450, int(largest_area * 0.35))
        if near_edge and small_next_to_main:
            for x, y in comp["pixels"]:  # type: ignore[assignment]
                pix[x, y] = (255, 255, 255, 0)
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


def compose_slot_cell(cleaned: Image.Image, comps: list[dict[str, object]], row: int, scale: float) -> tuple[Image.Image, dict[str, int | float | list[int] | None]]:
    if not comps:
        empty = Image.new("RGBA", (DEST_CELL, DEST_CELL), (0, 0, 0, 0))
        return empty, {
            "source_bbox": None,
            "bbox": None,
            "body_bbox": None,
            "body_height": 0,
            "bottom": None,
            "baseline_deviation": None,
            "dy": 0,
            "dx": 0,
            "fit_scale": 1.0,
            "source_white_pixels": 0,
            "alpha_pixels": 0,
            "white_pixels": 0,
            "skin_pixels": 0,
            "dark_pixels": 0,
            "gold_pixels": 0,
            "cyan_pixels": 0,
            "checker_pixels": 0,
        }

    pad = 2
    left = max(0, min(int(comp["bbox"][0]) for comp in comps) - pad)  # type: ignore[index]
    top = max(0, min(int(comp["bbox"][1]) for comp in comps) - pad)  # type: ignore[index]
    right = min(cleaned.width, max(int(comp["bbox"][2]) for comp in comps) + pad)  # type: ignore[index]
    bottom = min(cleaned.height, max(int(comp["bbox"][3]) for comp in comps) + pad)  # type: ignore[index]
    crop = cleaned.crop((left, top, right, bottom))
    scaled = crop.resize((max(1, round(crop.width * scale)), max(1, round(crop.height * scale))), Image.Resampling.LANCZOS)
    bbox = content_bbox(scaled)
    if not bbox:
        return Image.new("RGBA", (DEST_CELL, DEST_CELL), (0, 0, 0, 0)), {
            "source_bbox": [left, top, right, bottom],
            "bbox": None,
            "body_bbox": None,
            "body_height": 0,
            "bottom": None,
            "baseline_deviation": None,
            "dy": 0,
            "dx": 0,
            "fit_scale": 1.0,
            "source_white_pixels": sum(int(comp["white_like"]) for comp in comps),
            "alpha_pixels": 0,
            "white_pixels": 0,
            "skin_pixels": 0,
            "dark_pixels": 0,
            "gold_pixels": 0,
            "cyan_pixels": 0,
            "checker_pixels": 0,
        }

    fit = min((DEST_CELL - 4) / max(1, bbox[2] - bbox[0]), (BASELINE_Y - 4) / max(1, bbox[3] - bbox[1]), 1.0)
    if fit < 0.999:
        scaled = scaled.resize((max(1, round(scaled.width * fit)), max(1, round(scaled.height * fit))), Image.Resampling.LANCZOS)
        bbox = content_bbox(scaled)
    if not bbox:
        raise RuntimeError("Slot became empty after fit scaling")

    center_rows = {2, 3, 4}
    if row in center_rows:
        x_anchor = (bbox[0] + bbox[2]) // 2
    else:
        alpha = scaled.getchannel("A")
        alpha_pix = alpha.load()
        bottom_px = bbox[3] - 1
        foot_rows: list[int] = []
        for y in range(max(bbox[1], bottom_px - 24), bottom_px + 1):
            xs = [x for x in range(bbox[0], bbox[2]) if alpha_pix[x, y] > 24]
            if xs:
                foot_rows.extend(xs)
        x_anchor = int(round(sum(foot_rows) / len(foot_rows))) if foot_rows else (bbox[0] + bbox[2]) // 2

    dx = (DEST_CELL // 2) - x_anchor
    if dx + bbox[0] < 2:
        dx += 2 - (dx + bbox[0])
    if dx + bbox[2] > DEST_CELL - 2:
        dx -= (dx + bbox[2]) - (DEST_CELL - 2)
    dy = BASELINE_Y - (bbox[3] - 1)

    out = Image.new("RGBA", (DEST_CELL, DEST_CELL), (0, 0, 0, 0))
    paste_with_clip(out, scaled, dx, dy)
    out_bbox = content_bbox(out)
    out_body = body_bbox(out)
    out_counts = count_pixels(out)
    out_bottom = out_bbox[3] - 1 if out_bbox else None
    body_height = (out_body[3] - out_body[1]) if out_body else 0
    return out, {
        "source_bbox": [left, top, right, bottom],
        "bbox": list(out_bbox) if out_bbox else None,
        "body_bbox": list(out_body) if out_body else None,
        "body_height": body_height,
        "bottom": out_bottom,
        "baseline_deviation": abs(out_bottom - BASELINE_Y) if out_bottom is not None else None,
        "dy": dy,
        "dx": dx,
        "fit_scale": round(fit, 4),
        "source_white_pixels": sum(int(comp["white_like"]) for comp in comps),
        "alpha_pixels": out_counts["alpha"],
        "white_pixels": out_counts["white"],
        "skin_pixels": out_counts["skin"],
        "dark_pixels": out_counts["dark"],
        "gold_pixels": out_counts["gold"],
        "cyan_pixels": out_counts["cyan"],
        "checker_pixels": out_counts["checker"],
    }


def normalize_cell(cell: Image.Image, row: int) -> tuple[Image.Image, dict[str, int | float | list[int] | None]]:
    cleaned = remove_edge_strays(remove_checker(cell))
    source_bbox = content_bbox(cleaned)
    source_counts = count_pixels(cleaned)
    scaled = cleaned.resize((DEST_CELL, DEST_CELL), Image.Resampling.LANCZOS)
    bbox = content_bbox(scaled)
    if not bbox:
        empty = Image.new("RGBA", (DEST_CELL, DEST_CELL), (0, 0, 0, 0))
        return empty, {
            "source_bbox": None,
            "bbox": None,
            "body_bbox": None,
            "body_height": 0,
            "bottom": None,
            "baseline_deviation": None,
            "dy": 0,
            "fit_scale": 1.0,
            "source_white_pixels": source_counts["white"],
            "alpha_pixels": 0,
            "white_pixels": 0,
            "skin_pixels": 0,
            "dark_pixels": 0,
            "gold_pixels": 0,
            "cyan_pixels": 0,
            "checker_pixels": 0,
        }

    fit = min((DEST_CELL - 4) / max(1, bbox[2] - bbox[0]), (BASELINE_Y - 4) / max(1, bbox[3] - bbox[1]), 1.0)
    if fit < 0.999:
        scaled = scaled.resize((max(1, round(scaled.width * fit)), max(1, round(scaled.height * fit))), Image.Resampling.LANCZOS)
        bbox = content_bbox(scaled)
    if not bbox:
        raise RuntimeError("Cell became empty after fit scaling")

    dy = BASELINE_Y - (bbox[3] - 1)
    out = Image.new("RGBA", (DEST_CELL, DEST_CELL), (0, 0, 0, 0))
    paste_with_clip(out, scaled, 0, dy)
    out_bbox = content_bbox(out)
    out_body = body_bbox(out)
    out_counts = count_pixels(out)
    bottom = out_bbox[3] - 1 if out_bbox else None
    body_height = (out_body[3] - out_body[1]) if out_body else 0
    return out, {
        "source_bbox": list(source_bbox) if source_bbox else None,
        "bbox": list(out_bbox) if out_bbox else None,
        "body_bbox": list(out_body) if out_body else None,
        "body_height": body_height,
        "bottom": bottom,
        "baseline_deviation": abs(bottom - BASELINE_Y) if bottom is not None else None,
        "dy": dy,
        "fit_scale": round(fit, 4),
        "source_white_pixels": source_counts["white"],
        "alpha_pixels": out_counts["alpha"],
        "white_pixels": out_counts["white"],
        "skin_pixels": out_counts["skin"],
        "dark_pixels": out_counts["dark"],
        "gold_pixels": out_counts["gold"],
        "cyan_pixels": out_counts["cyan"],
        "checker_pixels": out_counts["checker"],
    }


def normalize_component_image(cleaned: Image.Image, source_bbox: tuple[int, int, int, int], row: int, source_white_pixels: int, scale: float) -> tuple[Image.Image, dict[str, int | float | list[int] | None]]:
    bbox = content_bbox(cleaned)
    if not bbox:
        empty = Image.new("RGBA", (DEST_CELL, DEST_CELL), (0, 0, 0, 0))
        return empty, {
            "source_bbox": list(source_bbox),
            "bbox": None,
            "body_bbox": None,
            "body_height": 0,
            "bottom": None,
            "baseline_deviation": None,
            "dy": 0,
            "fit_scale": 1.0,
            "source_white_pixels": source_white_pixels,
            "alpha_pixels": 0,
            "white_pixels": 0,
            "skin_pixels": 0,
            "dark_pixels": 0,
            "gold_pixels": 0,
            "cyan_pixels": 0,
            "checker_pixels": 0,
        }

    crop = cleaned.crop(bbox)
    scaled = crop.resize((max(1, round(crop.width * scale)), max(1, round(crop.height * scale))), Image.Resampling.LANCZOS)
    scaled_bbox = content_bbox(scaled)
    if not scaled_bbox:
        raise RuntimeError("Expanded slot became empty after scaling")
    fit = min((DEST_CELL - 4) / max(1, scaled_bbox[2] - scaled_bbox[0]), (BASELINE_Y - 4) / max(1, scaled_bbox[3] - scaled_bbox[1]), 1.0)
    if fit < 0.999:
        scaled = scaled.resize((max(1, round(scaled.width * fit)), max(1, round(scaled.height * fit))), Image.Resampling.LANCZOS)
        scaled_bbox = content_bbox(scaled)
    if not scaled_bbox:
        raise RuntimeError("Expanded slot became empty after fit scaling")

    dx = (DEST_CELL - scaled.width) // 2
    dy = BASELINE_Y - (scaled_bbox[3] - 1)
    out = Image.new("RGBA", (DEST_CELL, DEST_CELL), (0, 0, 0, 0))
    paste_with_clip(out, scaled, dx, dy)
    out_bbox = content_bbox(out)
    out_body = body_bbox(out)
    out_counts = count_pixels(out)
    bottom = out_bbox[3] - 1 if out_bbox else None
    body_height = (out_body[3] - out_body[1]) if out_body else 0
    return out, {
        "source_bbox": list(source_bbox),
        "bbox": list(out_bbox) if out_bbox else None,
        "body_bbox": list(out_body) if out_body else None,
        "body_height": body_height,
        "bottom": bottom,
        "baseline_deviation": abs(bottom - BASELINE_Y) if bottom is not None else None,
        "dy": dy,
        "fit_scale": round(fit, 4),
        "source_white_pixels": source_white_pixels,
        "alpha_pixels": out_counts["alpha"],
        "white_pixels": out_counts["white"],
        "skin_pixels": out_counts["skin"],
        "dark_pixels": out_counts["dark"],
        "gold_pixels": out_counts["gold"],
        "cyan_pixels": out_counts["cyan"],
        "checker_pixels": out_counts["checker"],
    }


def normalize_expanded_slot(src: Image.Image, row: int, col: int) -> tuple[Image.Image, dict[str, int | float | list[int] | None]]:
    cell_w = src.width / COLS
    cell_h = src.height / ROWS
    center_x = (col + 0.5) * cell_w
    center_y = (row + 0.5) * cell_h
    pad_x = int(round(cell_w * 0.42))
    pad_y = int(round(cell_h * 0.16))
    base = source_cell_bounds(src.width, src.height, col, row)
    bounds = (
        max(0, base[0] - pad_x),
        max(0, base[1] - pad_y),
        min(src.width, base[2] + pad_x),
        min(src.height, base[3] + pad_y),
    )
    cleaned = remove_checker(src.crop(bounds))
    comps = [comp for comp in alpha_components(cleaned) if int(comp["area"]) > 24]
    if not comps:
        return normalize_cell(src.crop(base), row)

    local_center = (center_x - bounds[0], center_y - bounds[1])

    def score(comp: dict[str, object]) -> float:
        bbox = comp["bbox"]  # type: ignore[assignment]
        cx = (int(bbox[0]) + int(bbox[2])) / 2
        cy = (int(bbox[1]) + int(bbox[3])) / 2
        distance = ((cx - local_center[0]) / cell_w) ** 2 + ((cy - local_center[1]) / cell_h) ** 2
        area_bonus = min(0.35, int(comp["area"]) / 12000)
        return distance - area_bonus

    main = min(comps, key=score)
    main_bbox = main["bbox"]  # type: ignore[assignment]
    keep: list[dict[str, object]] = [main]
    expanded_main = (
        max(0, int(main_bbox[0]) - 26),
        max(0, int(main_bbox[1]) - 26),
        min(cleaned.width, int(main_bbox[2]) + 26),
        min(cleaned.height, int(main_bbox[3]) + 26),
    )
    for comp in comps:
        if comp is main:
            continue
        bbox = comp["bbox"]  # type: ignore[assignment]
        intersects = not (
            int(bbox[2]) < expanded_main[0]
            or int(bbox[0]) > expanded_main[2]
            or int(bbox[3]) < expanded_main[1]
            or int(bbox[1]) > expanded_main[3]
        )
        if intersects and int(comp["area"]) < int(main["area"]) * 0.3:
            keep.append(comp)

    selected = Image.new("RGBA", cleaned.size, (0, 0, 0, 0))
    src_pix = cleaned.load()
    out_pix = selected.load()
    for comp in keep:
        for x, y in comp["pixels"]:  # type: ignore[assignment]
            out_pix[x, y] = src_pix[x, y]
    counts = count_pixels(selected)
    return normalize_component_image(selected, bounds, row, counts["white"], DEST_CELL / cell_w)


def build_preview(atlas: Image.Image, preview_path: Path) -> None:
    preview = Image.new("RGBA", atlas.size, (34, 37, 41, 255))
    preview.alpha_composite(atlas)
    draw = ImageDraw.Draw(preview)
    for x in range(0, atlas.width + 1, DEST_CELL):
        draw.line([(x, 0), (x, atlas.height)], fill=(92, 156, 255, 150), width=2)
    for y in range(0, atlas.height + 1, DEST_CELL):
        draw.line([(0, y), (atlas.width, y)], fill=(92, 156, 255, 150), width=2)
    for row in range(ROWS):
        y = row * DEST_CELL + BASELINE_Y
        draw.line([(0, y), (atlas.width, y)], fill=(255, 214, 72, 220), width=2)
    preview_path.parent.mkdir(parents=True, exist_ok=True)
    preview.save(preview_path)


def read_sheet1_reference_height(reference_report: Path) -> float | None:
    if not reference_report.exists():
        return None
    data = json.loads(reference_report.read_text(encoding="utf-8"))
    heights = []
    for cell in data.get("cells", []):
        bbox = cell.get("bbox")
        if cell.get("row") in (0, 1, 2) and bbox:
            heights.append(int(bbox[3]) - int(bbox[1]))
    return float(median(heights)) if heights else None


def normalize(source: Path, output: Path, preview: Path, report_path: Path, reference_report: Path) -> dict[str, object]:
    src = Image.open(source).convert("RGBA")
    atlas = Image.new("RGBA", DEST_SIZE, (0, 0, 0, 0))
    cells: list[dict[str, object]] = []
    normalized_slots: dict[tuple[int, int], tuple[Image.Image, dict[str, int | float | list[int] | None]]] = {}
    repaired_slots: list[dict[str, object]] = []

    for row in range(ROWS):
        for col in range(COLS):
            bounds = source_cell_bounds(src.width, src.height, col, row)
            if row in (3, 4):
                cell_img, metrics = normalize_expanded_slot(src, row, col)
            else:
                source_cell = src.crop(bounds)
                cell_img, metrics = normalize_cell(source_cell, row)
            repair_from = REPAIR_SLOTS.get((row, col))
            if repair_from and int(metrics.get("white_pixels") or 0) < 800:
                prior = normalized_slots.get(repair_from)
                if prior:
                    cell_img = prior[0].copy()
                    metrics = dict(prior[1])
                    metrics["repaired_from_row"] = repair_from[0]
                    metrics["repaired_from_col"] = repair_from[1]
                    repaired_slots.append({"row": row, "col": col, "from": [repair_from[0], repair_from[1]]})
            atlas.alpha_composite(cell_img, (col * DEST_CELL, row * DEST_CELL))
            normalized_slots[(row, col)] = (cell_img, metrics)
            cells.append({"row": row, "col": col, "source_bounds": list(bounds), "component_count": 1 if metrics.get("alpha_pixels") else 0, **metrics})

    output.parent.mkdir(parents=True, exist_ok=True)
    atlas.save(output)
    build_preview(atlas, preview)

    alpha = atlas.getchannel("A")
    alpha_extrema = alpha.getextrema()
    alpha_hist = alpha.histogram()
    transparent = alpha_hist[0]
    opaque_or_semi = sum(alpha_hist[1:])
    occupied_cells = sum(1 for cell in cells if cell.get("alpha_pixels", 0) and int(cell["alpha_pixels"]) > 120)
    standing_rows = [c for c in cells if int(c["row"]) in (0, 1, 5)]
    knockdown_rows = [c for c in cells if int(c["row"]) in (3, 4)]
    body_heights = [int(c["body_height"]) for c in cells if int(c.get("body_height") or 0) > 0 and int(c["row"]) in (0, 1, 5)]
    body_median = float(median(body_heights)) if body_heights else 0.0
    sheet1_reference = read_sheet1_reference_height(reference_report)
    body_ratio = (body_median / sheet1_reference) if sheet1_reference else None
    checker_pixels = count_edge_connected_checker_pixels(atlas)
    row_summary = []
    for row in range(ROWS):
        row_cells = [c for c in cells if int(c["row"]) == row]
        row_summary.append({
            "row": row,
            "occupied_cells": sum(1 for c in row_cells if int(c.get("alpha_pixels") or 0) > 120),
            "median_body_height": float(median([int(c["body_height"]) for c in row_cells if int(c.get("body_height") or 0) > 0])),
            "baseline_max_deviation": max((int(c["baseline_deviation"]) for c in row_cells if c.get("baseline_deviation") is not None), default=None),
            "white_pixels": sum(int(c.get("white_pixels") or 0) for c in row_cells),
            "dark_pixels": sum(int(c.get("dark_pixels") or 0) for c in row_cells),
            "gold_pixels": sum(int(c.get("gold_pixels") or 0) for c in row_cells),
            "cyan_pixels": sum(int(c.get("cyan_pixels") or 0) for c in row_cells),
        })

    white_ok = all(int(c.get("white_pixels") or 0) > 800 for c in cells)
    dark_ok = all(int(c.get("dark_pixels") or 0) > 1000 for c in cells)
    baseline_max = max((int(c["baseline_deviation"]) for c in standing_rows if c.get("baseline_deviation") is not None), default=None)
    knockdown_floor_max = max((int(c["baseline_deviation"]) for c in knockdown_rows if c.get("baseline_deviation") is not None), default=None)
    scale_passes = body_ratio is None or 0.82 <= body_ratio <= 1.12

    report = {
        "source": str(source),
        "source_size": [src.width, src.height],
        "source_components": occupied_cells,
        "source_sprite_slots_detected": occupied_cells,
        "output": str(output),
        "output_size": [atlas.width, atlas.height],
        "preview": str(preview),
        "grid": {"cols": COLS, "rows": ROWS, "cell": DEST_CELL, "baselineY": BASELINE_Y},
        "alpha_extrema": list(alpha_extrema),
        "transparent_pixels": transparent,
        "opaque_or_semi_pixels": opaque_or_semi,
        "has_real_transparency": alpha_extrema[0] == 0 and transparent > 0,
        "checkerboard_removed": checker_pixels == 0,
        "edge_connected_checker_pixels_remaining": checker_pixels,
        "white_coat_preserved": white_ok,
        "black_outfit_locs_preserved": dark_ok,
        "gold_cyan_accents_preserved": sum(int(c.get("gold_pixels") or 0) + int(c.get("cyan_pixels") or 0) for c in cells) > 1200,
        "occupied_cells": occupied_cells,
        "standing_guard_baseline_max_deviation": baseline_max,
        "knockdown_floor_max_deviation": knockdown_floor_max,
        "body_scale": {
            "sheet1_reference_median_height": sheet1_reference,
            "reaction_standing_guard_median_height": body_median,
            "ratio": body_ratio,
            "passes": scale_passes,
        },
        "row_mapping": ROW_MAPPING,
        "row5_frame_ranges": ROW5_FRAME_RANGES,
        "repaired_slots": repaired_slots,
        "row_summary": row_summary,
        "cells": cells,
    }
    report_path.parent.mkdir(parents=True, exist_ok=True)
    report_path.write_text(json.dumps(report, indent=2), encoding="utf-8")
    return report


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument(
        "--source",
        default=Path("assets/characters/lamuh/reactions_defense/lamuh_reactions_defense_source.png"),
        type=Path,
    )
    parser.add_argument(
        "--output",
        default=Path("assets/characters/lamuh/lamuh_sheet_reactions_defense_redesign_atlas.png"),
        type=Path,
    )
    parser.add_argument(
        "--preview",
        default=Path("assets/characters/lamuh/lamuh_sheet_reactions_defense_redesign_preview.png"),
        type=Path,
    )
    parser.add_argument(
        "--report",
        default=Path("assets/characters/lamuh/lamuh_sheet_reactions_defense_redesign_report.json"),
        type=Path,
    )
    parser.add_argument(
        "--sheet1-report",
        default=Path("assets/characters/lamuh/lamuh_sheet_1_core_movement_redesign_report.json"),
        type=Path,
    )
    args = parser.parse_args()

    report = normalize(args.source, args.output, args.preview, args.report, args.sheet1_report)
    print(json.dumps({
        "source": report["source"],
        "source_size": report["source_size"],
        "output": report["output"],
        "output_size": report["output_size"],
        "has_real_transparency": report["has_real_transparency"],
        "checkerboard_removed": report["checkerboard_removed"],
        "white_coat_preserved": report["white_coat_preserved"],
        "black_outfit_locs_preserved": report["black_outfit_locs_preserved"],
        "gold_cyan_accents_preserved": report["gold_cyan_accents_preserved"],
        "occupied_cells": report["occupied_cells"],
        "source_sprite_slots_detected": report["source_sprite_slots_detected"],
        "body_scale": report["body_scale"],
    }, indent=2))
    if report["output_size"] != [DEST_SIZE[0], DEST_SIZE[1]]:
        return 2
    if not report["has_real_transparency"]:
        return 3
    if not report["checkerboard_removed"]:
        return 4
    if not report["white_coat_preserved"] or not report["black_outfit_locs_preserved"]:
        return 5
    if report["occupied_cells"] != 48:
        return 6
    if not report["body_scale"]["passes"]:
        return 7
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
