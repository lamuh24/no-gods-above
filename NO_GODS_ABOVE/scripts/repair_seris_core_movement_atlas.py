from __future__ import annotations

import json
import shutil
from collections import deque
from pathlib import Path

from PIL import Image


ROOT = Path(__file__).resolve().parents[1]
SERIS_FINAL = ROOT / "assets" / "sprites" / "seris_final"
ATLAS_PATH = SERIS_FINAL / "seris_sheet_1_core_movement_atlas.png"
BACKUP_PATH = SERIS_FINAL / "visual_integrity_source" / "seris_sheet_1_core_movement_atlas_source.png"
FRAMES_DIR = SERIS_FINAL / "frames" / "sheet_1_core_movement"
MANIFEST_PATH = SERIS_FINAL / "seris_core_movement_visual_integrity_manifest.json"

CHROMA = (255, 0, 255)
ALPHA_THRESHOLD = 22
COLS = 8
ROWS = [
    ("idle", 8),
    ("walk_forward", 6),
    ("walk_back", 6),
    ("dash_forward", 6),
    ("dash_back", 6),
    ("crouch", 4),
]


def is_opaque(pixel: tuple[int, int, int, int]) -> bool:
    r, g, b, a = pixel
    return a > ALPHA_THRESHOLD and (r, g, b) != CHROMA


def transparentize(image: Image.Image) -> Image.Image:
    rgba = image.convert("RGBA")
    pixels = rgba.load()
    for y in range(rgba.height):
        for x in range(rgba.width):
            r, g, b, a = pixels[x, y]
            if a <= ALPHA_THRESHOLD or (r, g, b) == CHROMA:
                pixels[x, y] = (0, 0, 0, 0)
    return rgba


def components(image: Image.Image) -> list[dict]:
    pixels = image.load()
    width, height = image.size
    seen = bytearray(width * height)
    found = []
    for sy in range(height):
        for sx in range(width):
            idx = sy * width + sx
            if seen[idx] or not is_opaque(pixels[sx, sy]):
                continue
            queue = deque([(sx, sy)])
            seen[idx] = 1
            points = []
            min_x = max_x = sx
            min_y = max_y = sy
            while queue:
                x, y = queue.popleft()
                points.append((x, y))
                min_x = min(min_x, x)
                max_x = max(max_x, x)
                min_y = min(min_y, y)
                max_y = max(max_y, y)
                for nx in (x - 1, x, x + 1):
                    for ny in (y - 1, y, y + 1):
                        if nx < 0 or ny < 0 or nx >= width or ny >= height:
                            continue
                        nidx = ny * width + nx
                        if seen[nidx] or not is_opaque(pixels[nx, ny]):
                            continue
                        seen[nidx] = 1
                        queue.append((nx, ny))
            found.append(
                {
                    "area": len(points),
                    "bbox": (min_x, min_y, max_x + 1, max_y + 1),
                    "points": points,
                    "cx": (min_x + max_x + 1) / 2,
                    "cy": (min_y + max_y + 1) / 2,
                }
            )
    return sorted(found, key=lambda item: item["area"], reverse=True)


def bbox_gap(a: tuple[int, int, int, int], b: tuple[int, int, int, int]) -> int:
    ax0, ay0, ax1, ay1 = a
    bx0, by0, bx1, by1 = b
    dx = max(bx0 - ax1, ax0 - bx1, 0)
    dy = max(by0 - ay1, ay0 - by1, 0)
    return max(dx, dy)


def clean_cell(cell: Image.Image) -> tuple[Image.Image, dict]:
    src = transparentize(cell)
    comps = components(src)
    if not comps:
        return src, {"components": 0, "removed": 0}

    primary = comps[0]
    primary_bbox = primary["bbox"]
    keep = Image.new("RGBA", src.size, (0, 0, 0, 0))
    src_pixels = src.load()
    dst_pixels = keep.load()
    kept = 0
    removed = 0

    for comp in comps:
        gap = bbox_gap(primary_bbox, comp["bbox"])
        above_body = comp["bbox"][3] < primary_bbox[1]
        comp_height = comp["bbox"][3] - comp["bbox"][1]
        top_sliver = above_body and comp_height < 36
        keep_component = comp is primary or ((not top_sliver) and ((not above_body or comp["area"] >= 420) and gap <= 22)) or ((not top_sliver) and comp["area"] >= 420 and gap <= 36)
        if keep_component:
            kept += 1
            for x, y in comp["points"]:
                dst_pixels[x, y] = src_pixels[x, y]
        else:
            removed += 1

    return keep, {"components": len(comps), "kept": kept, "removed": removed}


def edge_opaque_count(image: Image.Image) -> int:
    pixels = image.load()
    count = 0
    for x in range(image.width):
        count += int(is_opaque(pixels[x, 0])) + int(is_opaque(pixels[x, image.height - 1]))
    for y in range(image.height):
        count += int(is_opaque(pixels[0, y])) + int(is_opaque(pixels[image.width - 1, y]))
    return count


def main() -> None:
    if not ATLAS_PATH.exists():
        raise FileNotFoundError(ATLAS_PATH)
    BACKUP_PATH.parent.mkdir(parents=True, exist_ok=True)
    if not BACKUP_PATH.exists():
        shutil.copy2(ATLAS_PATH, BACKUP_PATH)

    atlas = Image.open(BACKUP_PATH).convert("RGBA")
    cell_w = atlas.width // COLS
    cell_h = atlas.height // len(ROWS)
    out = Image.new("RGBA", atlas.size, (0, 0, 0, 0))
    row_reports = []

    for row_index, (key, display_frames) in enumerate(ROWS):
        row_dir = FRAMES_DIR / key
        row_dir.mkdir(parents=True, exist_ok=True)
        frame_reports = []
        last_clean = None
        for col in range(COLS):
            cell = atlas.crop((col * cell_w, row_index * cell_h, (col + 1) * cell_w, (row_index + 1) * cell_h))
            clean, report = clean_cell(cell)
            if col >= display_frames and last_clean is not None:
                clean = last_clean.copy()
                report["heldPaddingCell"] = True
            else:
                last_clean = clean.copy()
            out.alpha_composite(clean, (col * cell_w, row_index * cell_h))
            if col < display_frames:
                frame_path = row_dir / f"{key}_{col + 1:02d}.png"
                clean.save(frame_path)
                report["file"] = frame_path.relative_to(ROOT).as_posix()
            frame_reports.append({"frame": col + 1, **report})
        row_reports.append({"row": row_index + 1, "animation": key, "displayFrames": display_frames, "frames": frame_reports})

    out.save(ATLAS_PATH)
    manifest = {
        "character": "Seris",
        "sheet": "sheet_1_core_movement",
        "purpose": "Visual integrity repair for detached movement debris. No gameplay data changed.",
        "source": BACKUP_PATH.relative_to(ROOT).as_posix(),
        "output": ATLAS_PATH.relative_to(ROOT).as_posix(),
        "cols": COLS,
        "rows": len(ROWS),
        "cell": [cell_w, cell_h],
        "edgeOpaquePixels": edge_opaque_count(out),
        "rowMap": row_reports,
    }
    MANIFEST_PATH.write_text(json.dumps(manifest, indent=2) + "\n", encoding="utf-8")
    print(json.dumps({"output": manifest["output"], "edgeOpaquePixels": manifest["edgeOpaquePixels"]}, indent=2))


if __name__ == "__main__":
    main()
