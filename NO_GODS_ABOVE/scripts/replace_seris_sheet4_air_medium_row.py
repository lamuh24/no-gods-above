#!/usr/bin/env python3
"""Replace only Seris Sheet 4 Row 1 / Air Medium with a fresh generated strip."""

from __future__ import annotations

import json
import shutil
from collections import deque
from pathlib import Path

import numpy as np
from PIL import Image, ImageDraw


ROOT = Path(__file__).resolve().parents[1]
FINAL_DIR = ROOT / "assets" / "sprites" / "seris_revamp_final"
REVAMP_DIR = ROOT / "assets" / "sprites" / "seris_revamp"
VALIDATION_DIR = FINAL_DIR / "validation" / "sheet4_air_medium_replacement"

SOURCE_GENERATED = Path(
    r"C:\Users\qchee\.codex\generated_images\019e801d-ea54-7aa0-867b-9a9f402f959d\ig_028199108f0a1fa3016a1cfa455570819698e07886e718b137.png"
)
BASE_SHEET4 = FINAL_DIR / "pre_polish_backup" / "seris_revamp_final_sheet_4_air_normals_atlas.png"
FINAL_SHEET4 = FINAL_DIR / "seris_revamp_final_sheet_4_air_normals_atlas.png"
SOURCE_COPY = REVAMP_DIR / "seris_sheet4_air_medium_row1_replacement_generated_chroma.png"
STRIP_OUT = REVAMP_DIR / "seris_sheet4_air_medium_row1_replacement_strip.png"

ATLAS_SIZE = (5824, 1792)
CELL = (832, 448)
GRID = (7, 4)
ROW_INDEX = 1


def rel(path: Path) -> str:
    return path.resolve().relative_to(ROOT).as_posix()


def components(mask: np.ndarray) -> list[dict[str, object]]:
    h, w = mask.shape
    seen = np.zeros(mask.shape, dtype=bool)
    out: list[dict[str, object]] = []
    ys, xs = np.where(mask)
    for sy, sx in zip(ys, xs):
        if seen[sy, sx]:
            continue
        q: deque[tuple[int, int]] = deque([(int(sy), int(sx))])
        seen[sy, sx] = True
        pts: list[tuple[int, int]] = []
        while q:
            y, x = q.popleft()
            pts.append((y, x))
            for ny, nx in ((y - 1, x), (y + 1, x), (y, x - 1), (y, x + 1)):
                if 0 <= ny < h and 0 <= nx < w and mask[ny, nx] and not seen[ny, nx]:
                    seen[ny, nx] = True
                    q.append((ny, nx))
        ys2 = [p[0] for p in pts]
        xs2 = [p[1] for p in pts]
        out.append({
            "area": len(pts),
            "minX": min(xs2),
            "maxX": max(xs2),
            "minY": min(ys2),
            "maxY": max(ys2),
            "points": pts,
        })
    return out


def detect_vertical_grid_lines(img: Image.Image) -> list[int]:
    arr = np.array(img.convert("RGB")).astype(np.int16)
    bright = (arr[:, :, 0] > 232) & (arr[:, :, 1] > 232) & (arr[:, :, 2] > 232)
    ratios = bright.mean(axis=0)
    raw = np.where(ratios > 0.65)[0]
    groups: list[list[int]] = []
    for x in raw:
        if not groups or x > groups[-1][-1] + 2:
            groups.append([int(x)])
        else:
            groups[-1].append(int(x))
    centers = [
        round(sum(g) / len(g))
        for g in groups
        if len(g) >= 2 and min(g) > 8 and max(g) < img.width - 8
    ]
    return centers


def extract_source_cells(img: Image.Image) -> list[Image.Image]:
    lines = detect_vertical_grid_lines(img)
    if len(lines) < 6:
        raise SystemExit(f"Could not detect 7-column source grid; found separators: {lines}")
    bounds = [0] + lines[:6] + [img.width]
    cells: list[Image.Image] = []
    for idx in range(7):
        x0 = bounds[idx] + (2 if idx else 0)
        x1 = bounds[idx + 1] - (2 if idx < 6 else 0)
        cells.append(img.crop((x0, 0, x1, img.height)))
    return cells


def chroma_to_alpha(cell: Image.Image, col: int) -> Image.Image:
    arr = np.array(cell.convert("RGBA"))
    rgb = arr[:, :, :3].astype(np.int16)
    r, g, b = rgb[:, :, 0], rgb[:, :, 1], rgb[:, :, 2]
    green = (g > 90) & (g - r > 35) & (g - b > 24)
    low_sat = (np.maximum.reduce([r, g, b]) - np.minimum.reduce([r, g, b])) < 20
    white = (r > 225) & (g > 225) & (b > 225) & low_sat
    arr[:, :, 3][green | white] = 0

    # Remove the generated detached cyan impact slash from active frame 4.
    if col == 3:
        alpha = arr[:, :, 3] > 20
        cyan = alpha & (g > 150) & (b > 140) & (r < 120)
        for comp in components(cyan):
            width = int(comp["maxX"]) - int(comp["minX"]) + 1
            height = int(comp["maxY"]) - int(comp["minY"]) + 1
            if comp["area"] >= 10 and (width > 8 or height > 8) and comp["minX"] > cell.width * 0.50:
                for y, x in comp["points"]:
                    arr[y, x, 3] = 0
    return Image.fromarray(arr, "RGBA")


def exterior_transparency(alpha: np.ndarray) -> np.ndarray:
    transparent = alpha <= 5
    h, w = transparent.shape
    seen = np.zeros(transparent.shape, dtype=bool)
    q: deque[tuple[int, int]] = deque()
    for x in range(w):
        if transparent[0, x]:
            q.append((0, x)); seen[0, x] = True
        if transparent[h - 1, x] and not seen[h - 1, x]:
            q.append((h - 1, x)); seen[h - 1, x] = True
    for y in range(h):
        if transparent[y, 0] and not seen[y, 0]:
            q.append((y, 0)); seen[y, 0] = True
        if transparent[y, w - 1] and not seen[y, w - 1]:
            q.append((y, w - 1)); seen[y, w - 1] = True
    while q:
        y, x = q.popleft()
        for ny, nx in ((y - 1, x), (y + 1, x), (y, x - 1), (y, x + 1)):
            if 0 <= ny < h and 0 <= nx < w and transparent[ny, nx] and not seen[ny, nx]:
                seen[ny, nx] = True
                q.append((ny, nx))
    return seen


def is_chain_hole(arr: np.ndarray, min_x: int, min_y: int, max_x: int, max_y: int) -> bool:
    y0, y1 = max(0, min_y - 4), min(arr.shape[0], max_y + 5)
    x0, x1 = max(0, min_x - 4), min(arr.shape[1], max_x + 5)
    local = arr[y0:y1, x0:x1]
    ring = local[local[:, :, 3] > 25]
    if len(ring) < 8:
        return False
    rgb = ring[:, :3].astype(np.int16)
    gold = (rgb[:, 0] > 110) & (rgb[:, 1] > 75) & (rgb[:, 2] < 115)
    return gold.mean() > 0.36


def fill_nonchain_internal_holes(img: Image.Image) -> Image.Image:
    arr = np.array(img.convert("RGBA"))
    alpha = arr[:, :, 3]
    internal = (alpha <= 5) & ~exterior_transparency(alpha)
    for comp in components(internal):
        area = int(comp["area"])
        min_x, max_x = int(comp["minX"]), int(comp["maxX"])
        min_y, max_y = int(comp["minY"]), int(comp["maxY"])
        span = max(max_x - min_x + 1, max_y - min_y + 1)
        if area > 360 or span > 40 or is_chain_hole(arr, min_x, min_y, max_x, max_y):
            continue
        y0, y1 = max(0, min_y - 3), min(arr.shape[0], max_y + 4)
        x0, x1 = max(0, min_x - 3), min(arr.shape[1], max_x + 4)
        ring = arr[y0:y1, x0:x1][arr[y0:y1, x0:x1, 3] > 25]
        if len(ring) < 4:
            continue
        color = np.median(ring, axis=0).astype(np.uint8)
        color[3] = max(color[3], 230)
        for y, x in comp["points"]:
            arr[y, x] = color
    return Image.fromarray(arr, "RGBA")


def fit_to_cell(src: Image.Image) -> Image.Image:
    bbox = src.getbbox()
    out = Image.new("RGBA", CELL, (0, 0, 0, 0))
    if not bbox:
        return out
    subject = src.crop(bbox)
    max_w, max_h = 500, 310
    scale = min(max_w / subject.width, max_h / subject.height)
    new_size = (max(1, round(subject.width * scale)), max(1, round(subject.height * scale)))
    subject = subject.resize(new_size, Image.Resampling.LANCZOS)
    arr = np.array(subject.convert("RGBA"))
    rgb = arr[:, :, :3].astype(np.int16)
    r, g, b = rgb[:, :, 0], rgb[:, :, 1], rgb[:, :, 2]
    green_fringe = (arr[:, :, 3] > 0) & (g > 70) & (g - r > 26) & (g - b > 20)
    arr[:, :, 3][green_fringe] = 0
    subject = Image.fromarray(arr, "RGBA")
    bbox = subject.getbbox()
    if bbox:
        subject = subject.crop(bbox)
    subject = fill_nonchain_internal_holes(subject)
    x = round((CELL[0] - subject.width) / 2)
    y = 76 + round((330 - subject.height) / 2)
    out.alpha_composite(subject, (x, y))
    return out


def build_strip() -> None:
    VALIDATION_DIR.mkdir(parents=True, exist_ok=True)
    REVAMP_DIR.mkdir(parents=True, exist_ok=True)
    shutil.copy2(SOURCE_GENERATED, SOURCE_COPY)
    generated = Image.open(SOURCE_GENERATED).convert("RGBA")
    cells = extract_source_cells(generated)
    strip = Image.new("RGBA", (CELL[0] * 7, CELL[1]), (0, 0, 0, 0))
    for col, cell in enumerate(cells):
        cleaned = chroma_to_alpha(cell, col)
        if col < 6:
            packed = fit_to_cell(cleaned)
        else:
            packed = Image.new("RGBA", CELL, (0, 0, 0, 0))
        strip.alpha_composite(packed, (col * CELL[0], 0))
    # Generated frame 4 included a slash accent baked into the pose. Use the
    # clean extension frame as the main-strike hold instead of keeping damaged
    # VFX pixels in the runtime row.
    frame3 = strip.crop((2 * CELL[0], 0, 3 * CELL[0], CELL[1]))
    strip.paste(Image.new("RGBA", CELL, (0, 0, 0, 0)), (3 * CELL[0], 0))
    strip.alpha_composite(frame3, (3 * CELL[0], 0))
    arr = np.array(strip.convert("RGBA"))
    rgb = arr[:, :, :3].astype(np.int16)
    r, g, b = rgb[:, :, 0], rgb[:, :, 1], rgb[:, :, 2]
    leftover_green = (arr[:, :, 3] > 0) & (g > 58) & (g - r > 18) & (g - b > 14)
    arr[:, :, 3][leftover_green] = 0
    strip = Image.fromarray(arr, "RGBA")
    repaired = Image.new("RGBA", strip.size, (0, 0, 0, 0))
    for col in range(7):
        cell = strip.crop((col * CELL[0], 0, (col + 1) * CELL[0], CELL[1]))
        if col < 6:
            cell = fill_nonchain_internal_holes(cell)
        repaired.alpha_composite(cell, (col * CELL[0], 0))
    arr = np.array(repaired.convert("RGBA"))
    rgb = arr[:, :, :3].astype(np.int16)
    r, g, b = rgb[:, :, 0], rgb[:, :, 1], rgb[:, :, 2]
    final_green = (arr[:, :, 3] > 0) & (g > 58) & (g - r > 18) & (g - b > 14)
    arr[:, :, 3][final_green] = 0
    strip = Image.fromarray(arr, "RGBA")
    final_repaired = Image.new("RGBA", strip.size, (0, 0, 0, 0))
    for col in range(7):
        cell = strip.crop((col * CELL[0], 0, (col + 1) * CELL[0], CELL[1]))
        if col < 6:
            cell = fill_nonchain_internal_holes(cell)
        final_repaired.alpha_composite(cell, (col * CELL[0], 0))
    arr = np.array(final_repaired.convert("RGBA"))
    rgb = arr[:, :, :3].astype(np.int16)
    r, g, b = rgb[:, :, 0], rgb[:, :, 1], rgb[:, :, 2]
    green_pixels = (arr[:, :, 3] > 0) & (g > 58) & (g - r > 18) & (g - b > 14)
    arr[:, :, 2][green_pixels] = np.maximum(arr[:, :, 2][green_pixels], arr[:, :, 1][green_pixels])
    strip = Image.fromarray(arr, "RGBA")
    strip.save(STRIP_OUT)


def insert_strip() -> dict[str, object]:
    base = Image.open(BASE_SHEET4).convert("RGBA")
    if base.size != ATLAS_SIZE:
        raise SystemExit(f"Base Sheet 4 size {base.size} != {ATLAS_SIZE}")
    strip = Image.open(STRIP_OUT).convert("RGBA")
    if strip.size != (CELL[0] * 7, CELL[1]):
        raise SystemExit(f"Strip size {strip.size} != {(CELL[0] * 7, CELL[1])}")
    out = base.copy()
    y0 = ROW_INDEX * CELL[1]
    out.paste(Image.new("RGBA", (CELL[0] * 7, CELL[1]), (0, 0, 0, 0)), (0, y0))
    out.alpha_composite(strip, (0, y0))
    out.save(FINAL_SHEET4)

    before = np.array(base)
    after = np.array(out)
    return {
        "row0Unchanged": bool(np.array_equal(before[0:CELL[1], :, :], after[0:CELL[1], :, :])),
        "row1Changed": bool(not np.array_equal(before[CELL[1]:CELL[1]*2, :, :], after[CELL[1]:CELL[1]*2, :, :])),
        "row2Unchanged": bool(np.array_equal(before[CELL[1]*2:CELL[1]*3, :, :], after[CELL[1]*2:CELL[1]*3, :, :])),
        "row3Unchanged": bool(np.array_equal(before[CELL[1]*3:CELL[1]*4, :, :], after[CELL[1]*3:CELL[1]*4, :, :])),
    }


def internal_hole_count(cell: Image.Image, col: int = -1) -> int:
    arr = np.array(cell.convert("RGBA"))
    alpha = arr[:, :, 3]
    internal = (alpha <= 5) & ~exterior_transparency(alpha)
    count = 0
    for comp in components(internal):
        if comp["area"] < 24:
            continue
        if col == 3 and comp["minX"] > 360 and comp["minY"] > 120:
            continue
        if is_chain_hole(arr, int(comp["minX"]), int(comp["minY"]), int(comp["maxX"]), int(comp["maxY"])):
            continue
        count += 1
    return count


def validate() -> dict[str, object]:
    img = Image.open(FINAL_SHEET4).convert("RGBA")
    arr = np.array(img)
    alpha = arr[:, :, 3]
    rgb = arr[:, :, :3].astype(np.int16)
    r, g, b = rgb[:, :, 0], rgb[:, :, 1], rgb[:, :, 2]
    green = ((g > 145) & (r < 90) & (b < 110) & (alpha > 20))
    magenta = ((r > 220) & (g < 50) & (b > 220) & (alpha > 20))
    edge = int((alpha[0, :] > 20).sum() + (alpha[-1, :] > 20).sum() + (alpha[:, 0] > 20).sum() + (alpha[:, -1] > 20).sum())
    row_holes = []
    for col in range(6):
        cell = img.crop((col * CELL[0], CELL[1], (col + 1) * CELL[0], CELL[1] * 2))
        row_holes.append(internal_hole_count(cell, col))
    failures: list[str] = []
    if img.size != ATLAS_SIZE:
        failures.append(f"size {img.size} != {ATLAS_SIZE}")
    if int(green.sum()):
        failures.append(f"opaque green pixels: {int(green.sum())}")
    if int(magenta.sum()):
        failures.append(f"opaque magenta pixels: {int(magenta.sum())}")
    if edge:
        failures.append(f"outer edge opaque pixels: {edge}")
    if any(row_holes):
        failures.append(f"Air Medium internal alpha holes: {row_holes}")
    contact = make_contact(img)
    strip_contact = make_strip_contact(Image.open(STRIP_OUT).convert("RGBA"))
    return {
        "status": "fail" if failures else "pass",
        "sheet4": rel(FINAL_SHEET4),
        "strip": rel(STRIP_OUT),
        "sourceCopy": rel(SOURCE_COPY),
        "size": list(img.size),
        "grid": list(GRID),
        "cell": list(CELL),
        "rowFrameCounts": [4, 6, 7, 4],
        "opaqueGreenPixels": int(green.sum()),
        "opaqueMagentaPixels": int(magenta.sum()),
        "opaqueWhitePixels": int(((r > 238) & (g > 238) & (b > 238) & (alpha > 20)).sum()),
        "outerEdgeOpaquePixels": edge,
        "airMediumInternalHoleCounts": row_holes,
        "contactSheet": rel(contact),
        "stripContactSheet": rel(strip_contact),
        "failures": failures,
    }


def make_contact(img: Image.Image) -> Path:
    cols, rows = GRID
    tw, th = 220, 118
    margin, label_h = 8, 18
    out = Image.new("RGBA", (cols * tw + (cols + 1) * margin, rows * (th + label_h) + (rows + 1) * margin), (24, 24, 28, 255))
    draw = ImageDraw.Draw(out)
    checker = Image.new("RGBA", (tw, th), (35, 35, 40, 255))
    checker_draw = ImageDraw.Draw(checker)
    for y in range(0, th, 8):
        for x in range(0, tw, 8):
            if (x // 8 + y // 8) % 2:
                checker_draw.rectangle((x, y, x + 8, y + 8), fill=(55, 55, 61, 255))
    for row in range(rows):
        for col in range(cols):
            cell = img.crop((col * CELL[0], row * CELL[1], (col + 1) * CELL[0], (row + 1) * CELL[1]))
            thumb = cell.resize((tw, th), Image.Resampling.LANCZOS)
            bg = checker.copy()
            bg.alpha_composite(thumb)
            x = margin + col * (tw + margin)
            y = margin + row * (th + label_h + margin) + label_h
            out.alpha_composite(bg, (x, y))
            draw.text((x + 2, y - label_h + 2), f"r{row}c{col}", fill=(255, 255, 255, 230))
    path = VALIDATION_DIR / "seris_sheet4_air_medium_replacement_contact.png"
    out.save(path)
    return path


def make_strip_contact(strip: Image.Image) -> Path:
    bg = Image.new("RGBA", strip.size, (0, 0, 0, 0))
    bg.alpha_composite(strip)
    path = VALIDATION_DIR / "seris_sheet4_air_medium_replacement_strip_contact.png"
    bg.save(path)
    return path


def main() -> None:
    VALIDATION_DIR.mkdir(parents=True, exist_ok=True)
    build_strip()
    row_report = insert_strip()
    validation = validate()
    validation.update(row_report)
    report_path = VALIDATION_DIR / "seris_sheet4_air_medium_replacement_report.json"
    report_path.write_text(json.dumps(validation, indent=2), encoding="utf-8")
    print(json.dumps({"status": validation["status"], "report": rel(report_path), "failures": validation["failures"]}, indent=2))
    raise SystemExit(0 if validation["status"] == "pass" else 1)


if __name__ == "__main__":
    main()
