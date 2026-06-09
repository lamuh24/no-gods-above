#!/usr/bin/env python3
"""Normalize LAMUH neutral-special body/VFX source into 448-cell runtime atlas."""

from __future__ import annotations

import argparse
import json
from collections import deque
from pathlib import Path

from PIL import Image, ImageDraw, ImageFilter


COLS = 8
ROWS = 6
DEST_CELL = 448
BASELINE_Y = 382
DEST_SIZE = (COLS * DEST_CELL, ROWS * DEST_CELL)

ROW_MAPPING = {
    "0": ["lamuh_mirror_spark_body", "lamuh_mirror_spark", "mirror_spark"],
    "1": ["lamuh_mirror_pulse_body", "lamuh_mirror_pulse", "mirror_pulse"],
    "2": ["lamuh_crown_beam_body", "lamuh_crown_beam", "crown_beam", "crown_beam_charge", "crown_beam_fire", "crown_beam_recovery"],
    "3": ["lamuh_mirror_spark_vfx", "mirror_spark_vfx"],
    "4": ["lamuh_mirror_pulse_vfx", "mirror_pulse_vfx"],
    "5": ["lamuh_crown_beam_vfx", "crown_beam_vfx"],
}

BODY_ROWS = {0, 1, 2}
VFX_ROWS = {3, 4, 5}
REPAIR_BODY_SLOTS = {
    (0, 6): (0, 7),
    (1, 6): (1, 7),
    (2, 6): (2, 7),
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
    low_saturation = max(r, g, b) - min(r, g, b) <= 18
    return low_saturation and r >= 218 and g >= 218 and b >= 218


def is_opaque_checker_candidate(pixel: tuple[int, int, int, int]) -> bool:
    r, g, b, a = pixel
    if a <= 8:
        return False
    low_saturation = max(r, g, b) - min(r, g, b) <= 18
    return low_saturation and r >= 218 and g >= 218 and b >= 218


def is_white_candidate(pixel: tuple[int, int, int, int]) -> bool:
    r, g, b, a = pixel
    return a > 0 and r >= 152 and g >= 148 and b >= 132 and max(r, g, b) - min(r, g, b) <= 95


def is_skin_candidate(pixel: tuple[int, int, int, int]) -> bool:
    r, g, b, a = pixel
    return a > 0 and 50 <= r <= 190 and 20 <= g <= 135 and 5 <= b <= 105 and r > g and g >= b - 14


def is_dark_candidate(pixel: tuple[int, int, int, int]) -> bool:
    r, g, b, a = pixel
    return a > 0 and r <= 98 and g <= 98 and b <= 106


def is_gold_candidate(pixel: tuple[int, int, int, int]) -> bool:
    r, g, b, a = pixel
    return a > 0 and r >= 132 and 64 <= g <= 205 and b <= 145 and r - b >= 28


def is_cyan_candidate(pixel: tuple[int, int, int, int]) -> bool:
    r, g, b, a = pixel
    return a > 0 and b >= 118 and g >= 100 and b - r >= 22


def background_mask_from_edges(img: Image.Image) -> set[tuple[int, int]]:
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


def remove_checker_global(src: Image.Image) -> Image.Image:
    cleaned = src.convert("RGBA")
    pix = cleaned.load()
    for x, y in background_mask_from_edges(cleaned):
        pix[x, y] = (255, 255, 255, 0)
    return cleaned


def edge_connected_checker_pixels(img: Image.Image) -> int:
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
    grouped_alpha = alpha.filter(ImageFilter.MaxFilter(9))
    grouped_pix = grouped_alpha.load()
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
            raw = (min(xs), min(ys), max(xs) + 1, max(ys) + 1)
            real_xs: list[int] = []
            real_ys: list[int] = []
            for py in range(raw[1], raw[3]):
                for px in range(raw[0], raw[2]):
                    if alpha_pix[px, py] > 18:
                        real_xs.append(px)
                        real_ys.append(py)
            area = len(real_xs)
            if area < 8:
                continue
            bbox = (min(real_xs), min(real_ys), max(real_xs) + 1, max(real_ys) + 1)
            comps.append({
                "area": area,
                "bbox": bbox,
                "centroid": (sum(real_xs) / area, sum(real_ys) / area),
            })
    return comps


def assign_body_components(cleaned: Image.Image) -> dict[tuple[int, int], list[dict[str, object]]]:
    slots = {(row, col): [] for row in BODY_ROWS for col in range(COLS)}
    cell_w = cleaned.width / COLS
    cell_h = cleaned.height / ROWS
    for comp in connected_components(cleaned):
        cx, cy = comp["centroid"]  # type: ignore[misc]
        row = int(cy // cell_h)
        col = int(cx // cell_w)
        if row in BODY_ROWS and 0 <= col < COLS:
            slots[(row, col)].append(comp)
    return slots


def union_bbox(comps: list[dict[str, object]], pad: int, width: int, height: int) -> tuple[int, int, int, int] | None:
    if not comps:
        return None
    lefts = []
    tops = []
    rights = []
    bottoms = []
    for comp in comps:
        bbox = comp["bbox"]  # type: ignore[assignment]
        lefts.append(int(bbox[0]))
        tops.append(int(bbox[1]))
        rights.append(int(bbox[2]))
        bottoms.append(int(bbox[3]))
    return (
        max(0, min(lefts) - pad),
        max(0, min(tops) - pad),
        min(width, max(rights) + pad),
        min(height, max(bottoms) + pad),
    )


def bbox_size(bbox: tuple[int, int, int, int] | list[int] | None) -> tuple[int, int]:
    if not bbox:
        return 0, 0
    return int(bbox[2] - bbox[0]), int(bbox[3] - bbox[1])


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
            if pixel[3] <= 0:
                continue
            is_skin = is_skin_candidate(pixel)
            if is_skin:
                skin_x.append(x)
                skin_y.append(y)
            # Keep the body detector biased toward LAMUH, not detached cyan/white beam cores.
            if is_skin or is_dark_candidate(pixel) or is_white_candidate(pixel) or is_gold_candidate(pixel):
                cand_x.append(x)
                cand_y.append(y)
    if not cand_x:
        return None
    if not skin_x:
        return min(cand_x), min(cand_y), max(cand_x) + 1, max(cand_y) + 1

    sx1, sx2 = min(skin_x), max(skin_x) + 1
    sy1, sy2 = min(skin_y), max(skin_y) + 1
    wx1 = max(0, sx1 - 180)
    wx2 = min(rgba.width, sx2 + 180)
    wy1 = max(0, sy1 - 120)
    wy2 = min(rgba.height, sy2 + 340)
    xs = [x for x, y in zip(cand_x, cand_y) if wx1 <= x < wx2 and wy1 <= y < wy2]
    ys = [y for x, y in zip(cand_x, cand_y) if wx1 <= x < wx2 and wy1 <= y < wy2]
    if not xs:
        return sx1, sy1, sx2, sy2
    return min(xs), min(ys), max(xs) + 1, max(ys) + 1


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


def source_body_reference(cleaned: Image.Image, slots: dict[tuple[int, int], list[dict[str, object]]]) -> dict[str, object]:
    heights: list[int] = []
    widths: list[int] = []
    for row in BODY_ROWS:
        for col in range(COLS):
            crop_box = union_bbox(slots.get((row, col), []), 6, cleaned.width, cleaned.height)
            if not crop_box:
                continue
            crop = cleaned.crop(crop_box)
            body = body_bbox(crop)
            if not body:
                continue
            w, h = bbox_size(body)
            if h:
                heights.append(h)
            if w:
                widths.append(w)
    return {
        "body_rows_median_source_height": sorted(heights)[len(heights) // 2] if heights else 0,
        "body_rows_median_source_width": sorted(widths)[len(widths) // 2] if widths else 0,
    }


def paste_with_clip(out: Image.Image, img: Image.Image, dx: int, dy: int) -> None:
    sx1 = max(0, -dx)
    sy1 = max(0, -dy)
    sx2 = min(img.width, out.width - dx)
    sy2 = min(img.height, out.height - dy)
    if sx1 >= sx2 or sy1 >= sy2:
        return
    crop = img.crop((sx1, sy1, sx2, sy2))
    out.alpha_composite(crop, (max(0, dx), max(0, dy)))


def normalize_body_cell(cell: Image.Image, body_scale: float | None = None) -> tuple[Image.Image, dict[str, int | list[int] | None]]:
    body = body_bbox(cell)
    alpha = cell.getchannel("A").getbbox()
    if body and body_scale:
        crop_w = max(1, cell.width)
        crop_h = max(1, cell.height)
        fit_scale = min(body_scale, (DEST_CELL - 18) / crop_w, (DEST_CELL - 18) / crop_h)
        scaled = cell.resize((max(1, round(crop_w * fit_scale)), max(1, round(crop_h * fit_scale))), Image.Resampling.NEAREST)
    elif alpha:
        scaled = cell.convert("RGBA").resize((DEST_CELL, DEST_CELL), Image.Resampling.NEAREST)
    else:
        scaled = Image.new("RGBA", (DEST_CELL, DEST_CELL), (0, 0, 0, 0))
    anchor = body_bbox(scaled) or scaled.getchannel("A").getbbox()
    dx = 0
    dy = 0
    if anchor:
        dx = DEST_CELL // 2 - round((anchor[0] + anchor[2]) / 2)
        dy = BASELINE_Y - (anchor[3] - 1)
    out = Image.new("RGBA", (DEST_CELL, DEST_CELL), (0, 0, 0, 0))
    paste_with_clip(out, scaled, dx, dy)
    return out, cell_metrics(out, {"dx": dx, "dy": dy})


def normalize_vfx_cell(cell: Image.Image) -> tuple[Image.Image, dict[str, int | list[int] | None]]:
    scaled = cell.convert("RGBA").resize((DEST_CELL, DEST_CELL), Image.Resampling.NEAREST)
    return scaled, cell_metrics(scaled, {"dx": 0, "dy": 0})


def cell_metrics(cell: Image.Image, extra: dict[str, int] | None = None) -> dict[str, int | list[int] | None]:
    alpha_bbox = cell.getchannel("A").getbbox()
    body = body_bbox(cell)
    counts = count_pixels(cell)
    metrics: dict[str, int | list[int] | None] = {
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
        "checker_pixels": counts["checker"],
    }
    if extra:
        metrics.update(extra)
    return metrics


def build_preview(atlas: Image.Image, preview_path: Path) -> None:
    preview = Image.new("RGBA", atlas.size, (34, 36, 42, 255))
    preview.alpha_composite(atlas)
    draw = ImageDraw.Draw(preview)
    for x in range(0, atlas.width + 1, DEST_CELL):
        draw.line([(x, 0), (x, atlas.height)], fill=(94, 150, 255, 150), width=2)
    for y in range(0, atlas.height + 1, DEST_CELL):
        draw.line([(0, y), (atlas.width, y)], fill=(94, 150, 255, 150), width=2)
    for row in BODY_ROWS:
        y = row * DEST_CELL + BASELINE_Y
        draw.line([(0, y), (atlas.width, y)], fill=(255, 214, 72, 210), width=2)
    preview_path.parent.mkdir(parents=True, exist_ok=True)
    preview.save(preview_path)


def collect_cell_metrics(atlas: Image.Image) -> list[dict[str, int | list[int] | None]]:
    cells: list[dict[str, int | list[int] | None]] = []
    for row in range(ROWS):
        for col in range(COLS):
            cell = atlas.crop((col * DEST_CELL, row * DEST_CELL, (col + 1) * DEST_CELL, (row + 1) * DEST_CELL))
            cells.append({"row": row, "col": col, **cell_metrics(cell)})
    return cells


def row_summary(cells: list[dict[str, int | list[int] | None]]) -> list[dict[str, object]]:
    rows: list[dict[str, object]] = []
    for row in range(ROWS):
        row_cells = [c for c in cells if c["row"] == row]
        body_heights = [bbox_size(c.get("body_bbox"))[1] for c in row_cells if bbox_size(c.get("body_bbox"))[1] > 0]
        alpha_cells = [int(c.get("alpha_pixels") or 0) for c in row_cells]
        rows.append({
            "row": row,
            "aliases": ROW_MAPPING[str(row)],
            "kind": "body" if row in BODY_ROWS else "vfx",
            "min_body_height": min(body_heights) if body_heights else 0,
            "median_body_height": sorted(body_heights)[len(body_heights) // 2] if body_heights else 0,
            "max_body_height": max(body_heights) if body_heights else 0,
            "min_alpha_pixels": min(alpha_cells) if alpha_cells else 0,
            "median_alpha_pixels": sorted(alpha_cells)[len(alpha_cells) // 2] if alpha_cells else 0,
            "max_alpha_pixels": max(alpha_cells) if alpha_cells else 0,
        })
    return rows


def normalize(source: Path, output: Path, report_path: Path, preview_path: Path, sheet1: Path) -> dict[str, object]:
    src = Image.open(source).convert("RGBA")
    cleaned = remove_checker_global(src)
    body_slots = assign_body_components(cleaned)
    source_ref = source_body_reference(cleaned, body_slots)
    sheet1_ref = sheet1_reference(sheet1)
    source_median_h = int(source_ref["body_rows_median_source_height"] or 0)
    sheet1_median_h = int(sheet1_ref["median_body_height"] or 0)
    body_scale = (sheet1_median_h * 0.98 / source_median_h) if source_median_h and sheet1_median_h else None
    atlas = Image.new("RGBA", DEST_SIZE, (0, 0, 0, 0))
    normalized_cells: dict[tuple[int, int], Image.Image] = {}
    source_metrics: dict[tuple[int, int], dict[str, int | list[int] | str | None]] = {}
    for row in range(ROWS):
        for col in range(COLS):
            if row in BODY_ROWS:
                crop_box = union_bbox(body_slots.get((row, col), []), 8, cleaned.width, cleaned.height)
                raw_cell = cleaned.crop(crop_box) if crop_box else cleaned.crop(source_cell_bounds(cleaned.width, cleaned.height, col, row))
                normalized, metrics = normalize_body_cell(raw_cell, body_scale)
            else:
                raw_cell = cleaned.crop(source_cell_bounds(cleaned.width, cleaned.height, col, row))
                normalized, metrics = normalize_vfx_cell(raw_cell)
            normalized_cells[(row, col)] = normalized
            source_metrics[(row, col)] = metrics

    for target, source_slot in REPAIR_BODY_SLOTS.items():
        if target in normalized_cells and source_slot in normalized_cells:
            normalized_cells[target] = normalized_cells[source_slot].copy()
            repaired_metrics = dict(cell_metrics(normalized_cells[target], {"dx": 0, "dy": 0}))
            repaired_metrics["repaired_from"] = f"row{source_slot[0]}_col{source_slot[1]}"
            source_metrics[target] = repaired_metrics

    source_cells: list[dict[str, int | list[int] | str | None]] = []
    for row in range(ROWS):
        for col in range(COLS):
            atlas.alpha_composite(normalized_cells[(row, col)], (col * DEST_CELL, row * DEST_CELL))
            source_cells.append({"row": row, "col": col, **source_metrics[(row, col)]})

    output.parent.mkdir(parents=True, exist_ok=True)
    atlas.save(output)
    build_preview(atlas, preview_path)

    final_cells = collect_cell_metrics(atlas)
    counts = count_pixels(atlas)
    edge_checker = edge_connected_checker_pixels(atlas)
    alpha = atlas.getchannel("A")
    hist = alpha.histogram()
    body_cells = [c for c in final_cells if int(c["row"]) in BODY_ROWS]
    vfx_cells = [c for c in final_cells if int(c["row"]) in VFX_ROWS]
    body_heights = [bbox_size(c.get("body_bbox"))[1] for c in body_cells if bbox_size(c.get("body_bbox"))[1] > 0]
    body_median = sorted(body_heights)[len(body_heights) // 2] if body_heights else 0
    ref_median = sheet1_median_h
    body_baseline_devs = [int(c["baseline_deviation"]) for c in body_cells if isinstance(c.get("baseline_deviation"), int)]

    report = {
        "source": str(source),
        "source_size": [src.width, src.height],
        "output": str(output),
        "preview": str(preview_path),
        "output_size": [atlas.width, atlas.height],
        "grid": {"cols": COLS, "rows": ROWS, "cell": DEST_CELL, "baselineY": BASELINE_Y},
        "row_mapping": ROW_MAPPING,
        "sheet1_reference": sheet1_ref,
        "source_body_reference": source_ref,
        "body_scale_factor": round(body_scale, 4) if body_scale else None,
        "body_scale": {
            "body_rows_median_height": body_median,
            "sheet1_median_body_height": ref_median,
            "ratio": round(body_median / ref_median, 3) if ref_median else None,
            "passes": bool(ref_median and body_median >= ref_median * 0.9),
        },
        "has_real_transparency": alpha.getextrema()[0] == 0 and hist[0] > 0,
        "transparent_pixels": hist[0],
        "opaque_or_semi_pixels": sum(hist[1:]),
        "checkerboard_removed": edge_checker == 0,
        "checker_pixels_remaining": edge_checker,
        "white_art_pixels_matching_checker_threshold": counts["checker"],
        "repaired_body_slots": {f"row{r}_col{c}": f"row{sr}_col{sc}" for (r, c), (sr, sc) in REPAIR_BODY_SLOTS.items()},
        "occupied_cells": sum(1 for c in final_cells if int(c.get("alpha_pixels") or 0) > 40),
        "source_sprite_slots_detected": sum(1 for c in source_cells if int(c.get("alpha_pixels") or 0) > 40),
        "white_coat_preserved": all(int(c.get("white_pixels") or 0) > 120 for c in body_cells),
        "black_outfit_locs_preserved": all(int(c.get("dark_pixels") or 0) > 170 for c in body_cells),
        "gold_cyan_white_vfx_preserved": (
            sum(int(c.get("gold_pixels") or 0) for c in vfx_cells) > 500
            and sum(int(c.get("cyan_pixels") or 0) for c in vfx_cells) > 150
            and sum(int(c.get("white_pixels") or 0) for c in vfx_cells) > 500
        ),
        "body_baseline_max_deviation": max(body_baseline_devs) if body_baseline_devs else None,
        "row_summary": row_summary(final_cells),
        "cells": final_cells,
    }
    report["validation_passed"] = (
        report["output_size"] == [DEST_SIZE[0], DEST_SIZE[1]]
        and report["has_real_transparency"]
        and report["checkerboard_removed"]
        and report["occupied_cells"] == 48
        and report["source_sprite_slots_detected"] == 48
        and report["white_coat_preserved"]
        and report["black_outfit_locs_preserved"]
        and report["gold_cyan_white_vfx_preserved"]
        and report["body_scale"]["passes"]
        and isinstance(report["body_baseline_max_deviation"], int)
        and report["body_baseline_max_deviation"] <= 0
    )
    report_path.parent.mkdir(parents=True, exist_ok=True)
    report_path.write_text(json.dumps(report, indent=2), encoding="utf-8")
    return report


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument(
        "--source",
        type=Path,
        default=Path("NO_GODS_ABOVE/assets/characters/lamuh/neutral_specials/lamuh_neutral_specials_body_vfx_source.png"),
    )
    parser.add_argument(
        "--output",
        type=Path,
        default=Path("NO_GODS_ABOVE/assets/characters/lamuh/lamuh_sheet_neutral_specials_body_vfx_atlas.png"),
    )
    parser.add_argument(
        "--report",
        type=Path,
        default=Path("NO_GODS_ABOVE/assets/characters/lamuh/lamuh_sheet_neutral_specials_body_vfx_report.json"),
    )
    parser.add_argument(
        "--preview",
        type=Path,
        default=Path("NO_GODS_ABOVE/assets/characters/lamuh/lamuh_sheet_neutral_specials_body_vfx_preview.png"),
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
        "source_sprite_slots_detected": report["source_sprite_slots_detected"],
        "body_scale": report["body_scale"],
        "body_baseline_max_deviation": report["body_baseline_max_deviation"],
        "checker_pixels_remaining": report["checker_pixels_remaining"],
        "report": str(args.report),
    }, indent=2))
    if not report["validation_passed"]:
        raise SystemExit(1)


if __name__ == "__main__":
    main()
