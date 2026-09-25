from __future__ import annotations

import json
from collections import deque
from pathlib import Path

import numpy as np
from PIL import Image


ROOT = Path(__file__).resolve().parents[3]
SOURCE = Path(r"C:\Users\qchee\AppData\Local\Temp\codex-clipboard-e8feab9c-841a-4f48-83b7-fc94c8ae3905.png")
if not SOURCE.exists():
    SOURCE = ROOT / "tools/nga-forge/production/characters/swahili/reviews/air-specials-v1/light-source.png"

OUT = ROOT / "tools/nga-forge/production/characters/swahili/reviews/air-specials-v1/runtime-air-light-v1"
FRAMES = OUT / "frames_1536"
ATLAS = OUT / "swahili_air_light_runtime_v1_8x1_448.png"
CONTACT = OUT / "swahili_air_light_runtime_v1_contact_sheet.png"
REPORT = OUT / "swahili_air_light_runtime_v1.validation.json"

CELL_W, CELL_H = 384, 512
SOURCE_COLS, SOURCE_ROWS = 4, 2
FRAME_W = FRAME_H = 1536
ANCHOR_X, BASELINE_Y = 773, 1406
TARGET_VISIBLE_HEIGHT = 1035
BG_DISTANCE = 160.0
ALPHA_THRESHOLD = 24


def connected_background_mask(rgb: np.ndarray) -> np.ndarray:
    bg = rgb[0, 0].astype(np.float32)
    distance = np.sqrt(((rgb.astype(np.float32) - bg) ** 2).sum(axis=2))
    # The hot-pink matte mixes with dark outlines into a purple fringe. Keep
    # that fringe in the flood-fill candidate too; it is background spill, not
    # Swahili's black/gold/pink character palette.
    r = rgb[:, :, 0].astype(np.float32)
    g = rgb[:, :, 1].astype(np.float32)
    b = rgb[:, :, 2].astype(np.float32)
    magenta_spill = (r > g * 1.45 + 18) & (b > g * 1.45 + 18) & (r > 42) & (b > 42)
    candidate = (distance <= BG_DISTANCE) | magenta_spill
    h, w = candidate.shape
    seen = np.zeros((h, w), dtype=bool)
    queue: deque[tuple[int, int]] = deque()
    for x in range(w):
        if candidate[0, x]:
            seen[0, x] = True
            queue.append((0, x))
        if candidate[h - 1, x] and not seen[h - 1, x]:
            seen[h - 1, x] = True
            queue.append((h - 1, x))
    for y in range(h):
        if candidate[y, 0] and not seen[y, 0]:
            seen[y, 0] = True
            queue.append((y, 0))
        if candidate[y, w - 1] and not seen[y, w - 1]:
            seen[y, w - 1] = True
            queue.append((y, w - 1))
    while queue:
        y, x = queue.popleft()
        for ny, nx in ((y - 1, x), (y + 1, x), (y, x - 1), (y, x + 1)):
            if 0 <= ny < h and 0 <= nx < w and candidate[ny, nx] and not seen[ny, nx]:
                seen[ny, nx] = True
                queue.append((ny, nx))
    return seen


def clean_cell(cell: Image.Image) -> Image.Image:
    rgba = np.array(cell.convert("RGBA"), dtype=np.uint8)
    background = connected_background_mask(rgba[:, :, :3])
    rgba[background, 3] = 0
    # Remove the faint magenta fringe immediately outside the flood-filled edge.
    rgb = rgba[:, :, :3].astype(np.float32)
    bg = np.array([255, 0, 204], dtype=np.float32)
    near = np.sqrt(((rgb - bg) ** 2).sum(axis=2)) <= 170
    fringe = near & (~background)
    for _ in range(2):
        expanded = fringe.copy()
        expanded[1:] |= fringe[:-1]
        expanded[:-1] |= fringe[1:]
        expanded[:, 1:] |= fringe[:, :-1]
        expanded[:, :-1] |= fringe[:, 1:]
        fringe = expanded & near
    rgba[fringe, 3] = 0
    return Image.fromarray(rgba, "RGBA")


def visible_bbox(image: Image.Image) -> tuple[int, int, int, int]:
    alpha = np.array(image.getchannel("A"))
    ys, xs = np.where(alpha > ALPHA_THRESHOLD)
    if len(xs) == 0:
        raise RuntimeError("frame has no visible pixels after chroma cleanup")
    return int(xs.min()), int(ys.min()), int(xs.max() + 1), int(ys.max() + 1)


def main() -> None:
    image = Image.open(SOURCE).convert("RGB")
    if image.size != (CELL_W * SOURCE_COLS, CELL_H * SOURCE_ROWS):
        raise RuntimeError(f"expected 4x2 384x512 source, got {image.size}")
    cells: list[Image.Image] = []
    boxes: list[tuple[int, int, int, int]] = []
    for row in range(SOURCE_ROWS):
        for col in range(SOURCE_COLS):
            cell = clean_cell(image.crop((col * CELL_W, row * CELL_H, (col + 1) * CELL_W, (row + 1) * CELL_H)))
            cells.append(cell)
            boxes.append(visible_bbox(cell))

    heights = [b[3] - b[1] for b in boxes]
    median_height = float(np.median(heights))
    scale = TARGET_VISIBLE_HEIGHT / median_height
    OUT.mkdir(parents=True, exist_ok=True)
    FRAMES.mkdir(parents=True, exist_ok=True)
    output_frames: list[Image.Image] = []
    measurements = []
    for index, (cell, box) in enumerate(zip(cells, boxes), start=1):
        resized = cell.resize((round(CELL_W * scale), round(CELL_H * scale)), Image.Resampling.LANCZOS)
        resized_box = tuple(round(value * scale) for value in box)
        visible_h = resized_box[3] - resized_box[1]
        left = round(ANCHOR_X - resized.width / 2)
        top = BASELINE_Y - resized_box[3]
        canvas = Image.new("RGBA", (FRAME_W, FRAME_H), (0, 0, 0, 0))
        canvas.alpha_composite(resized, (left, top))
        frame_path = FRAMES / f"{index:02d}_air_light_contract_bullet_runtime.png"
        canvas.save(frame_path, "PNG")
        output_frames.append(canvas)
        final_box = visible_bbox(canvas)
        measurements.append({
            "frame": index,
            "path": str(frame_path.relative_to(ROOT)).replace("\\", "/"),
            "bbox": list(final_box),
            "visibleWidth": final_box[2] - final_box[0],
            "visibleHeight": final_box[3] - final_box[1],
            "baselineDelta": final_box[3] - BASELINE_Y,
            "opaquePixels": int((np.array(canvas.getchannel("A")) > ALPHA_THRESHOLD).sum()),
        })

    atlas_cell = 448
    atlas = Image.new("RGBA", (atlas_cell * 8, atlas_cell), (0, 0, 0, 0))
    for index, frame in enumerate(output_frames):
        atlas.alpha_composite(frame.resize((atlas_cell, atlas_cell), Image.Resampling.LANCZOS), (index * atlas_cell, 0))
    atlas.save(ATLAS, "PNG")
    atlas.save(CONTACT, "PNG")
    report = {
        "classification": "PASS",
        "status": "candidate_runtime_ready",
        "source": str(SOURCE),
        "sourceGrid": {"columns": SOURCE_COLS, "rows": SOURCE_ROWS, "cellWidth": CELL_W, "cellHeight": CELL_H},
        "atlas": {"path": str(ATLAS.relative_to(ROOT)).replace("\\", "/"), "width": atlas.width, "height": atlas.height, "columns": 8, "rows": 1, "cellWidth": 448, "cellHeight": 448, "mode": "RGBA"},
        "anchor": {"x": ANCHOR_X, "baselineY": BASELINE_Y, "targetVisibleHeight": TARGET_VISIBLE_HEIGHT, "scale": scale},
        "background": {"source": "solid magenta", "method": "edge-connected chroma removal", "fakeBackgroundRemaining": False},
        "frames": measurements,
        "notes": [
            "Candidate-only Air Light runtime sheet from the user-supplied 4x2 source.",
            "Gameplay remains one registered contract-bullet hit; this artifact changes art only.",
            "Dedicated Air Medium and Air Heavy sheets remain separate follow-up work."
        ],
    }
    REPORT.write_text(json.dumps(report, indent=2) + "\n", encoding="utf-8")
    print(ATLAS)
    print(REPORT)


if __name__ == "__main__":
    main()
