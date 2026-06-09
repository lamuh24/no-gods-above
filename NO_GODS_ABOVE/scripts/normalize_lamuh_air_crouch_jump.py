#!/usr/bin/env python3
"""Normalize LAMUH Air + Crouch + Jump source into a 448-cell runtime atlas."""

from __future__ import annotations

import argparse
import json
import math
from collections import deque
from collections import defaultdict
from pathlib import Path
from statistics import median

from PIL import Image, ImageDraw, ImageFilter


COLS = 8
ROWS = 6
DEST_CELL = 448
BASELINE_Y = 382
DEST_SIZE = (COLS * DEST_CELL, ROWS * DEST_CELL)

ROW_MAPPING = {
    "0": ["lamuh_jump", "lamuh_fall", "lamuh_land"],
    "1": ["lamuh_crouch_light", "crouch_light"],
    "2": ["lamuh_crouch_medium", "crouch_medium"],
    "3": ["lamuh_crouch_heavy", "lamuh_crown_riser", "crown_riser"],
    "4": ["lamuh_air_light", "lamuh_air_medium", "lamuh_air_heavy", "lamuh_air_crown_drop"],
    "5": ["lamuh_air_mirror_spark", "lamuh_air_dash_strike", "lamuh_air_crown_drop"],
}

FRAME_RANGES = {
    "lamuh_jump": [0, 2],
    "lamuh_fall": [3, 5],
    "lamuh_land": [6, 7],
    "lamuh_air_light": [0, 2],
    "lamuh_air_medium": [3, 5],
    "lamuh_air_heavy": [6, 7],
    "lamuh_air_mirror_spark": [0, 2],
    "lamuh_air_dash_strike": [3, 5],
    "lamuh_air_crown_drop": [6, 7],
}

GROUNDED_SLOTS = {
    *[(1, col) for col in range(COLS)],
    *[(2, col) for col in range(COLS)],
    *[(3, col) for col in range(COLS)],
    (0, 0),
    (0, 6),
    (0, 7),
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
    return a > 0 and r >= 150 and g >= 145 and b >= 130 and max(r, g, b) - min(r, g, b) <= 105


def is_skin_candidate(pixel: tuple[int, int, int, int]) -> bool:
    r, g, b, a = pixel
    return a > 0 and 45 <= r <= 190 and 18 <= g <= 135 and 5 <= b <= 105 and r > g and g >= b - 16


def is_dark_candidate(pixel: tuple[int, int, int, int]) -> bool:
    r, g, b, a = pixel
    return a > 0 and r <= 112 and g <= 112 and b <= 122


def is_gold_candidate(pixel: tuple[int, int, int, int]) -> bool:
    r, g, b, a = pixel
    return a > 0 and r >= 128 and 58 <= g <= 220 and b <= 160 and r - b >= 20


def is_cyan_candidate(pixel: tuple[int, int, int, int]) -> bool:
    r, g, b, a = pixel
    return a > 0 and b >= 112 and g >= 88 and b - r >= 16


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


def is_green_background_candidate(pixel: tuple[int, int, int, int]) -> bool:
    r, g, b, a = pixel
    return a > 0 and g >= 115 and r <= 120 and b <= 120 and g - max(r, b) >= 35


def remove_flat_green_background(src: Image.Image) -> Image.Image:
    cleaned = src.convert("RGBA")
    pix = cleaned.load()
    for y in range(cleaned.height):
        for x in range(cleaned.width):
            if is_green_background_candidate(pix[x, y]):
                pix[x, y] = (255, 255, 255, 0)
    return cleaned


def connected_components(img: Image.Image) -> list[dict[str, object]]:
    alpha = img.getchannel("A")
    alpha_pix = alpha.load()
    width, height = img.size
    visited: set[tuple[int, int]] = set()
    comps: list[dict[str, object]] = []

    for y in range(height):
        for x in range(width):
            if (x, y) in visited or alpha_pix[x, y] <= 12:
                continue
            queue: deque[tuple[int, int]] = deque([(x, y)])
            visited.add((x, y))
            xs: list[int] = []
            ys: list[int] = []
            while queue:
                cx, cy = queue.popleft()
                xs.append(cx)
                ys.append(cy)
                for nx, ny in (
                    (cx + 1, cy),
                    (cx - 1, cy),
                    (cx, cy + 1),
                    (cx, cy - 1),
                    (cx + 1, cy + 1),
                    (cx - 1, cy - 1),
                    (cx + 1, cy - 1),
                    (cx - 1, cy + 1),
                ):
                    if nx < 0 or ny < 0 or nx >= width or ny >= height or (nx, ny) in visited:
                        continue
                    if alpha_pix[nx, ny] > 12:
                        visited.add((nx, ny))
                        queue.append((nx, ny))
            area = len(xs)
            if area < 4:
                continue
            bbox = (min(xs), min(ys), max(xs) + 1, max(ys) + 1)
            comps.append({
                "bbox": bbox,
                "area": area,
                "center": ((bbox[0] + bbox[2]) / 2, (bbox[1] + bbox[3]) / 2),
            })
    return comps


def component_counts(img: Image.Image, bbox: tuple[int, int, int, int]) -> dict[str, int]:
    return count_pixels(img.crop(bbox))


def is_body_component(img: Image.Image, comp: dict[str, object]) -> bool:
    area = int(comp["area"])
    if area < 3800:
        return False
    counts = component_counts(img, comp["bbox"])
    return counts["white"] > 450 and counts["dark"] > 700


def merge_box(boxes: list[tuple[int, int, int, int]], pad: int, width: int, height: int) -> tuple[int, int, int, int]:
    return (
        max(0, min(box[0] for box in boxes) - pad),
        max(0, min(box[1] for box in boxes) - pad),
        min(width, max(box[2] for box in boxes) + pad),
        min(height, max(box[3] for box in boxes) + pad),
    )


def cluster_by_axis(items: list[dict[str, object]], axis: int, threshold: float) -> list[list[dict[str, object]]]:
    clustered: list[list[dict[str, object]]] = []
    for item in sorted(items, key=lambda comp: comp["center"][axis]):
        if not clustered:
            clustered.append([item])
            continue
        current_center = median([float(comp["center"][axis]) for comp in clustered[-1]])
        if abs(float(item["center"][axis]) - current_center) <= threshold:
            clustered[-1].append(item)
        else:
            clustered.append([item])
    return clustered


def merge_closest_clusters(clusters: list[list[dict[str, object]]], target_count: int, axis: int) -> list[list[dict[str, object]]]:
    clusters = [list(cluster) for cluster in clusters]
    while len(clusters) > target_count:
        centers = [median([float(comp["center"][axis]) for comp in cluster]) for cluster in clusters]
        merge_at = min(range(len(centers) - 1), key=lambda idx: centers[idx + 1] - centers[idx])
        clusters[merge_at].extend(clusters.pop(merge_at + 1))
    return clusters


def build_clustered_slot_crops(src: Image.Image) -> tuple[dict[tuple[int, int], Image.Image], dict[str, object]]:
    cleaned = remove_flat_green_background(src)
    cleaned = remove_global_checker_background(cleaned)
    components = connected_components(cleaned)
    body_components = [comp for comp in components if is_body_component(cleaned, comp)]
    row_clusters = cluster_by_axis(body_components, axis=1, threshold=125)
    if len(row_clusters) != ROWS:
        raise RuntimeError(f"Expected {ROWS} visual body rows, detected {len(row_clusters)}")

    slot_defs: list[dict[str, object]] = []
    for row, row_cluster in enumerate(sorted(row_clusters, key=lambda cluster: median([float(comp["center"][1]) for comp in cluster]))):
        col_clusters = cluster_by_axis(row_cluster, axis=0, threshold=105)
        col_clusters = merge_closest_clusters(col_clusters, COLS, axis=0)
        if len(col_clusters) != COLS:
            raise RuntimeError(f"Expected {COLS} body slots in row {row}, detected {len(col_clusters)}")
        for col, cluster in enumerate(sorted(col_clusters, key=lambda group: median([float(comp["center"][0]) for comp in group]))):
            boxes = [comp["bbox"] for comp in cluster]
            slot_defs.append({
                "row": row,
                "col": col,
                "center": [
                    float(median([float(comp["center"][0]) for comp in cluster])),
                    float(median([float(comp["center"][1]) for comp in cluster])),
                ],
                "body_component_count": len(cluster),
                "body_bounds": list(merge_box(boxes, 0, cleaned.width, cleaned.height)),
            })

    slot_lookup = {(int(slot["row"]), int(slot["col"])): slot for slot in slot_defs}
    row_centers = [median([float(slot_lookup[(row, col)]["center"][1]) for col in range(COLS)]) for row in range(ROWS)]
    row_edges = [0.0]
    row_edges.extend((row_centers[idx] + row_centers[idx + 1]) / 2 for idx in range(ROWS - 1))
    row_edges.append(float(cleaned.height))

    assigned_boxes: dict[tuple[int, int], list[tuple[int, int, int, int]]] = defaultdict(list)
    assigned_areas: dict[tuple[int, int], list[int]] = defaultdict(list)
    for comp in components:
        if int(comp["area"]) < 12:
            continue
        cx, cy = comp["center"]
        row = min(ROWS - 1, max(0, next((idx for idx in range(ROWS) if row_edges[idx] <= cy < row_edges[idx + 1]), ROWS - 1)))
        col_centers = [float(slot_lookup[(row, col)]["center"][0]) for col in range(COLS)]
        col_edges = [0.0]
        col_edges.extend((col_centers[idx] + col_centers[idx + 1]) / 2 for idx in range(COLS - 1))
        col_edges.append(float(cleaned.width))
        col = min(COLS - 1, max(0, next((idx for idx in range(COLS) if col_edges[idx] <= cx < col_edges[idx + 1]), COLS - 1)))
        assigned_boxes[(row, col)].append(comp["bbox"])
        assigned_areas[(row, col)].append(int(comp["area"]))

    crops: dict[tuple[int, int], Image.Image] = {}
    slot_records: list[dict[str, object]] = []
    for row in range(ROWS):
        for col in range(COLS):
            boxes = assigned_boxes.get((row, col), [])
            if not boxes:
                raise RuntimeError(f"No source components assigned to row {row} col {col}")
            bounds = merge_box(boxes, 8, cleaned.width, cleaned.height)
            crops[(row, col)] = cleaned.crop(bounds)
            slot = slot_lookup[(row, col)]
            slot_records.append({
                "row": row,
                "col": col,
                "bounds": list(bounds),
                "component_count": len(boxes),
                "body_component_count": int(slot["body_component_count"]),
                "component_area_total": sum(assigned_areas.get((row, col), [])),
                "body_bounds": slot["body_bounds"],
            })

    return crops, {
        "component_count": len(components),
        "raw_body_component_count": len(body_components),
        "body_slot_count": len(slot_defs),
        "components": [
            {"bbox": list(comp["bbox"]), "area": int(comp["area"]), "center": [float(comp["center"][0]), float(comp["center"][1])]}
            for comp in components
        ],
        "slots": slot_records,
    }


def build_visual_slot_crops(src: Image.Image) -> tuple[dict[tuple[int, int], Image.Image], dict[str, object]]:
    cleaned = remove_global_checker_background(src)
    cell_w = cleaned.width / COLS
    cell_h = cleaned.height / ROWS
    grouped: dict[tuple[int, int], list[tuple[int, int, int, int]]] = defaultdict(list)
    grouped_areas: dict[tuple[int, int], list[int]] = defaultdict(list)
    component_records: list[dict[str, object]] = []

    for comp in connected_components(cleaned):
        bbox = comp["bbox"]
        area = int(comp["area"])
        cx, cy = comp["center"]
        col = int(max(0, min(COLS - 1, math.floor(cx / cell_w))))
        row = int(max(0, min(ROWS - 1, math.floor(cy / cell_h))))
        grouped[(row, col)].append(bbox)
        grouped_areas[(row, col)].append(area)
        component_records.append({
            "row": row,
            "col": col,
            "bbox": list(bbox),
            "area": area,
        })

    crops: dict[tuple[int, int], Image.Image] = {}
    slot_records: list[dict[str, object]] = []
    for row in range(ROWS):
        for col in range(COLS):
            boxes = grouped.get((row, col), [])
            if not boxes:
                bounds = source_cell_bounds(cleaned.width, cleaned.height, col, row)
            else:
                pad = 8
                bounds = (
                    max(0, min(box[0] for box in boxes) - pad),
                    max(0, min(box[1] for box in boxes) - pad),
                    min(cleaned.width, max(box[2] for box in boxes) + pad),
                    min(cleaned.height, max(box[3] for box in boxes) + pad),
                )
            crops[(row, col)] = cleaned.crop(bounds)
            slot_records.append({
                "row": row,
                "col": col,
                "bounds": list(bounds),
                "component_count": len(boxes),
                "main_component_count": sum(1 for area in grouped_areas.get((row, col), []) if area >= 500),
                "component_area_total": sum(grouped_areas.get((row, col), [])),
            })

    return crops, {
        "component_count": len(component_records),
        "main_component_count": sum(1 for comp in component_records if int(comp["area"]) >= 500),
        "components": component_records,
        "slots": slot_records,
    }


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


def paste_with_clip(out: Image.Image, img: Image.Image, dx: int, dy: int) -> bool:
    sx1 = max(0, -dx)
    sy1 = max(0, -dy)
    sx2 = min(img.width, out.width - dx)
    sy2 = min(img.height, out.height - dy)
    if sx1 >= sx2 or sy1 >= sy2:
        return True
    crop = img.crop((sx1, sy1, sx2, sy2))
    out.alpha_composite(crop, (max(0, dx), max(0, dy)))
    return sx1 > 0 or sy1 > 0 or sx2 < img.width or sy2 < img.height


def fit_scaled_crop(crop: Image.Image, source_cell_width: int, row: int, col: int) -> tuple[Image.Image, dict[str, object]]:
    bbox = content_bbox(crop)
    if not bbox:
        return Image.new("RGBA", (DEST_CELL, DEST_CELL), (0, 0, 0, 0)), {
            "bbox": None,
            "body_bbox": None,
            "body_height": 0,
            "bottom": None,
            "baseline_deviation": None,
            "source_bbox": None,
            "fit_scale": 1.0,
            "clipped": False,
            "airborne_center_deviation": None,
            **{f"{key}_pixels": 0 for key in ("alpha", "white", "skin", "dark", "gold", "cyan", "checker")},
        }

    content = crop.crop(bbox)
    # The regenerated v2 sheet intentionally uses generous source padding; apply
    # a modest body-scale correction so LAMUH stays close to the approved Sheet 1 size.
    base_scale = (DEST_CELL / source_cell_width) * 1.12
    scaled = content.resize(
        (max(1, round(content.width * base_scale)), max(1, round(content.height * base_scale))),
        Image.Resampling.LANCZOS,
    )
    scaled_bbox = content_bbox(scaled)
    if not scaled_bbox:
        raise RuntimeError(f"Row {row} col {col} became empty after scaling")

    margin = 4
    fit = min(
        (DEST_CELL - margin * 2) / max(1, scaled_bbox[2] - scaled_bbox[0]),
        (DEST_CELL - margin * 2) / max(1, scaled_bbox[3] - scaled_bbox[1]),
        1.0,
    )
    if fit < 0.999:
        scaled = scaled.resize(
            (max(1, round(scaled.width * fit)), max(1, round(scaled.height * fit))),
            Image.Resampling.LANCZOS,
        )
        scaled_bbox = content_bbox(scaled)
    if not scaled_bbox:
        raise RuntimeError(f"Row {row} col {col} became empty after fit")

    out = Image.new("RGBA", (DEST_CELL, DEST_CELL), (0, 0, 0, 0))
    dx = (DEST_CELL - scaled.width) // 2
    grounded = (row, col) in GROUNDED_SLOTS
    target_center_y = 218
    if row == 0 and col in (1, 2):
        target_center_y = 190
    elif row == 0 and col in (3, 4, 5):
        target_center_y = 210
    elif row == 4 and col in (6, 7):
        target_center_y = 235
    elif row == 5 and col in (6, 7):
        target_center_y = 244

    if grounded:
        dy = BASELINE_Y - (scaled_bbox[3] - 1)
    else:
        center_y = (scaled_bbox[1] + scaled_bbox[3]) / 2
        dy = round(target_center_y - center_y)
        if dy + scaled_bbox[1] < margin:
            dy += margin - (dy + scaled_bbox[1])
        if dy + scaled_bbox[3] > DEST_CELL - margin:
            dy -= (dy + scaled_bbox[3]) - (DEST_CELL - margin)

    clipped = paste_with_clip(out, scaled, dx, dy)
    out_bbox = content_bbox(out)
    out_body = body_bbox(out)
    counts = count_pixels(out)
    bottom = out_bbox[3] - 1 if out_bbox else None
    body_height = (out_body[3] - out_body[1]) if out_body else 0
    center_deviation = None
    if out_bbox and not grounded:
        center_deviation = abs(((out_bbox[1] + out_bbox[3]) / 2) - target_center_y)
    return out, {
        "source_bbox": list(bbox),
        "bbox": list(out_bbox) if out_bbox else None,
        "body_bbox": list(out_body) if out_body else None,
        "body_height": body_height,
        "bottom": bottom,
        "baseline_deviation": abs(bottom - BASELINE_Y) if grounded and bottom is not None else None,
        "airborne_center_deviation": round(center_deviation, 2) if center_deviation is not None else None,
        "dx": dx,
        "dy": dy,
        "fit_scale": round(fit, 4),
        "clipped": clipped,
        "alpha_pixels": counts["alpha"],
        "white_pixels": counts["white"],
        "skin_pixels": counts["skin"],
        "dark_pixels": counts["dark"],
        "gold_pixels": counts["gold"],
        "cyan_pixels": counts["cyan"],
        "checker_pixels": counts["checker"],
    }


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
        if cell.get("row") in (0, 1, 2, 3, 4, 5) and bbox:
            heights.append(int(bbox[3]) - int(bbox[1]))
    return float(median(heights)) if heights else None


def normalize(source: Path, output: Path, preview: Path, report_path: Path, reference_report: Path) -> dict[str, object]:
    src = Image.open(source).convert("RGBA")
    source_crops, source_assignment = build_clustered_slot_crops(src)
    atlas = Image.new("RGBA", DEST_SIZE, (0, 0, 0, 0))
    cells: list[dict[str, object]] = []
    source_cell_width = round(src.width / COLS)

    for row in range(ROWS):
        for col in range(COLS):
            slot_record = next(
                slot for slot in source_assignment["slots"] if slot["row"] == row and slot["col"] == col
            )
            bounds = tuple(slot_record["bounds"])
            cell = source_crops[(row, col)]
            out_cell, metrics = fit_scaled_crop(cell, source_cell_width, row, col)
            atlas.alpha_composite(out_cell, (col * DEST_CELL, row * DEST_CELL))
            cells.append({
                "row": row,
                "col": col,
                "source_bounds": list(bounds),
                "source_component_count": slot_record["component_count"],
                "source_body_component_count": slot_record["body_component_count"],
                "source_main_component_count": slot_record["body_component_count"],
                "source_component_area_total": slot_record["component_area_total"],
                **metrics,
            })

    output.parent.mkdir(parents=True, exist_ok=True)
    atlas.save(output)
    build_preview(atlas, preview)

    alpha = atlas.getchannel("A")
    alpha_extrema = alpha.getextrema()
    alpha_hist = alpha.histogram()
    transparent = alpha_hist[0]
    opaque_or_semi = sum(alpha_hist[1:])
    occupied_cells = sum(1 for cell in cells if int(cell.get("alpha_pixels") or 0) > 120)
    sheet1_reference = read_sheet1_reference_height(reference_report)
    body_heights = [
        int(c["body_height"])
        for c in cells
        if int(c.get("body_height") or 0) > 0 and int(c["row"]) in (0, 1, 2, 3, 4, 5)
    ]
    grounded_cells = [c for c in cells if (int(c["row"]), int(c["col"])) in GROUNDED_SLOTS]
    airborne_cells = [c for c in cells if (int(c["row"]), int(c["col"])) not in GROUNDED_SLOTS]
    body_median = float(median(body_heights)) if body_heights else 0.0
    body_ratio = (body_median / sheet1_reference) if sheet1_reference else None
    checker_pixels = count_edge_connected_checker_pixels(atlas)

    row_summary = []
    for row in range(ROWS):
        row_cells = [c for c in cells if int(c["row"]) == row]
        row_heights = [int(c["body_height"]) for c in row_cells if int(c.get("body_height") or 0) > 0]
        row_summary.append({
            "row": row,
            "occupied_cells": sum(1 for c in row_cells if int(c.get("alpha_pixels") or 0) > 120),
            "median_body_height": float(median(row_heights)) if row_heights else 0,
            "baseline_max_deviation": max((int(c["baseline_deviation"]) for c in row_cells if c.get("baseline_deviation") is not None), default=None),
            "airborne_center_max_deviation": max((float(c["airborne_center_deviation"]) for c in row_cells if c.get("airborne_center_deviation") is not None), default=None),
            "white_pixels": sum(int(c.get("white_pixels") or 0) for c in row_cells),
            "dark_pixels": sum(int(c.get("dark_pixels") or 0) for c in row_cells),
            "gold_pixels": sum(int(c.get("gold_pixels") or 0) for c in row_cells),
            "cyan_pixels": sum(int(c.get("cyan_pixels") or 0) for c in row_cells),
        })

    white_ok = all(int(c.get("white_pixels") or 0) > 550 for c in cells)
    dark_ok = all(int(c.get("dark_pixels") or 0) > 900 for c in cells)
    accent_ok = sum(int(c.get("gold_pixels") or 0) + int(c.get("cyan_pixels") or 0) for c in cells) > 1200
    baseline_max = max((int(c["baseline_deviation"]) for c in grounded_cells if c.get("baseline_deviation") is not None), default=None)
    airborne_center_max = max((float(c["airborne_center_deviation"]) for c in airborne_cells if c.get("airborne_center_deviation") is not None), default=None)
    no_important_clipping = all(not c.get("clipped") for c in cells if int(c["row"]) in (4, 5))
    scale_passes = body_ratio is None or 0.78 <= body_ratio <= 1.18
    weak_slots = [
        {
            "row": int(c["row"]),
            "col": int(c["col"]),
            "alpha_pixels": int(c.get("alpha_pixels") or 0),
            "white_pixels": int(c.get("white_pixels") or 0),
            "dark_pixels": int(c.get("dark_pixels") or 0),
            "source_main_component_count": int(c.get("source_main_component_count") or 0),
        }
        for c in cells
        if int(c.get("source_main_component_count") or 0) == 0
        or int(c.get("white_pixels") or 0) <= 550
        or int(c.get("dark_pixels") or 0) <= 900
    ]

    report = {
        "source": str(source),
        "source_size": [src.width, src.height],
        "source_component_assignment": source_assignment,
        "source_components": source_assignment["body_slot_count"],
        "source_body_slots_detected": source_assignment["body_slot_count"],
        "source_main_components_detected": source_assignment["body_slot_count"],
        "source_raw_body_components_detected": source_assignment["raw_body_component_count"],
        "source_sprite_slots_detected": occupied_cells,
        "weak_or_fragment_slots": weak_slots,
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
        "gold_cyan_accents_preserved": accent_ok,
        "occupied_cells": occupied_cells,
        "grounded_crouch_baseline_max_deviation": baseline_max,
        "airborne_center_max_deviation": airborne_center_max,
        "no_important_air_dash_crown_drop_clipping": no_important_clipping,
        "body_scale": {
            "sheet1_reference_median_height": sheet1_reference,
            "air_crouch_jump_median_body_height": body_median,
            "ratio": body_ratio,
            "passes": scale_passes,
        },
        "row_mapping": ROW_MAPPING,
        "frame_ranges": FRAME_RANGES,
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
        default=Path("assets/characters/lamuh/air_crouch_jump/lamuh_air_crouch_jump_regen_v2_source_alpha.png"),
        type=Path,
    )
    parser.add_argument(
        "--output",
        default=Path("assets/characters/lamuh/lamuh_sheet_air_crouch_jump_redesign_atlas_v2.png"),
        type=Path,
    )
    parser.add_argument(
        "--preview",
        default=Path("assets/characters/lamuh/lamuh_sheet_air_crouch_jump_redesign_preview_v2.png"),
        type=Path,
    )
    parser.add_argument(
        "--report",
        default=Path("assets/characters/lamuh/lamuh_sheet_air_crouch_jump_redesign_report_v2.json"),
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
        "source_body_slots_detected": report["source_body_slots_detected"],
        "source_main_components_detected": report["source_main_components_detected"],
        "source_raw_body_components_detected": report["source_raw_body_components_detected"],
        "weak_or_fragment_slots": report["weak_or_fragment_slots"],
        "grounded_crouch_baseline_max_deviation": report["grounded_crouch_baseline_max_deviation"],
        "airborne_center_max_deviation": report["airborne_center_max_deviation"],
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
    if not report["gold_cyan_accents_preserved"]:
        return 6
    if report["occupied_cells"] != COLS * ROWS:
        return 7
    if report["source_body_slots_detected"] != COLS * ROWS:
        return 10
    if report["weak_or_fragment_slots"]:
        return 11
    if not report["body_scale"]["passes"]:
        return 8
    if not report["no_important_air_dash_crown_drop_clipping"]:
        return 9
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
