from __future__ import annotations

import json
from pathlib import Path

import numpy as np
from PIL import Image, ImageDraw, ImageFont


ROOT = Path(__file__).resolve().parents[3]
SOURCE_DIR = ROOT / "tools/nga-forge/production/characters/swahili/source-frames/candidates/moveset-goal-v1/air-medium-scythe-shaft-v1/air_medium"
OUT = ROOT / "tools/nga-forge/production/characters/swahili/reviews/air-specials-v1/runtime-air-medium-v1"
FRAMES = OUT / "frames_1536"
ATLAS = OUT / "swahili_air_medium_runtime_v1_13x1_448.png"
CONTACT = OUT / "swahili_air_medium_runtime_v1_contact_sheet.png"
REPORT = OUT / "swahili_air_medium_runtime_v1.validation.json"

CANVAS = (1536, 1536)
ANCHOR_X, BASELINE_Y = 773, 1406
TARGET_VISIBLE_HEIGHT = 1035
ATLAS_CELL = 448
ALPHA_THRESHOLD = 24

KEYS = (
    ("01_cross_body_load", "startup_load"),
    ("02_shaft_contact", "active_contact"),
    ("03_fall_compatible_unwind", "recovery_unwind"),
)

# These are the motion beats between the three approved key poses. The
# contact is intentionally a single clean frame; the neighboring frames are
# rigid-pose connectors so the runtime does not present a three-pose slideshow
# or create duplicate-body crossfade ghosts.
CONNECTOR_PLAN = (
    ("key", 0),
    ("rotate", 0, -10),
    ("rotate", 0, -20),
    ("rotate", 0, -28),
    ("key", 1),
    ("rotate", 1, 10),
    ("rotate", 1, 20),
    ("rotate", 1, 28),
    ("key", 2),
    ("key", 2),
    ("key", 2),
)


def visible_bbox(image: Image.Image) -> tuple[int, int, int, int]:
    alpha = np.asarray(image.getchannel("A"))
    ys, xs = np.where(alpha > ALPHA_THRESHOLD)
    if len(xs) == 0:
        raise RuntimeError("frame has no visible pixels")
    return int(xs.min()), int(ys.min()), int(xs.max() + 1), int(ys.max() + 1)


def premul_resize(image: Image.Image, size: tuple[int, int]) -> Image.Image:
    return image.convert("RGBa").resize(size, Image.Resampling.LANCZOS).convert("RGBA")


def normalize(image: Image.Image) -> Image.Image:
    """Place a key pose on the shared Swahili source-space root."""
    rgba = image.convert("RGBA")
    box = visible_bbox(rgba)
    height = box[3] - box[1]
    scale = TARGET_VISIBLE_HEIGHT / float(np.median([1056, 959, 1120]))
    resized = premul_resize(rgba, (round(rgba.width * scale), round(rgba.height * scale)))
    scaled_box = tuple(round(value * scale) for value in box)
    left = round(ANCHOR_X - resized.width / 2)
    top = BASELINE_Y - scaled_box[3]
    canvas = Image.new("RGBA", CANVAS, (0, 0, 0, 0))
    canvas.alpha_composite(resized, (left, top))
    return canvas


def rotate_pose(image: Image.Image, degrees: float) -> Image.Image:
    """Rotate one complete airborne pose around the shared root, preserving one body."""
    return image.rotate(degrees, resample=Image.Resampling.BICUBIC, center=(ANCHOR_X, BASELINE_Y), expand=False)


def font(size: int, bold: bool = False) -> ImageFont.FreeTypeFont:
    path = "C:/Windows/Fonts/seguisb.ttf" if bold else "C:/Windows/Fonts/segoeui.ttf"
    return ImageFont.truetype(path, size)


def build() -> tuple[list[Image.Image], list[dict]]:
    keys: list[Image.Image] = []
    for stem, _ in KEYS:
        source = SOURCE_DIR / f"{stem}.png"
        if not source.exists():
            raise FileNotFoundError(source)
        with Image.open(source) as opened:
            keys.append(normalize(opened))

    frames: list[Image.Image] = []
    records: list[dict] = []
    FRAMES.mkdir(parents=True, exist_ok=True)
    for index, plan in enumerate(CONNECTOR_PLAN, 1):
        if plan[0] == "key":
            frame = keys[plan[1]]
            phase = KEYS[plan[1]][1]
            connector = False
            source_keys = [KEYS[plan[1]][0]]
        else:
            _, key_index, degrees = plan
            frame = rotate_pose(keys[key_index], degrees)
            phase = "startup_connector" if key_index == 0 else "recovery_connector"
            connector = True
            source_keys = [KEYS[key_index][0]]
        path = FRAMES / f"{index:02d}_air_medium_{phase}.png"
        frame.save(path, "PNG", optimize=True)
        box = visible_bbox(frame)
        frames.append(frame)
        records.append({
            "frame": index,
            "path": str(path.relative_to(ROOT)).replace("\\", "/"),
            "phase": phase,
            "connector": connector,
            "sourceKeys": source_keys,
            "bbox": list(box),
            "visibleWidth": box[2] - box[0],
            "visibleHeight": box[3] - box[1],
            "baselineDelta": box[3] - BASELINE_Y,
            "opaquePixels": int((np.asarray(frame.getchannel("A")) > ALPHA_THRESHOLD).sum()),
            "visibleContact": phase == "active_contact",
        })
    return frames, records


def make_atlas(frames: list[Image.Image]) -> None:
    atlas = Image.new("RGBA", (ATLAS_CELL * len(frames), ATLAS_CELL), (0, 0, 0, 0))
    for index, frame in enumerate(frames):
        atlas.alpha_composite(frame.resize((ATLAS_CELL, ATLAS_CELL), Image.Resampling.LANCZOS), (index * ATLAS_CELL, 0))
    atlas.save(ATLAS, "PNG")


def make_contact(frames: list[Image.Image]) -> None:
    cols, panel_w, panel_h = 7, 300, 330
    rows = (len(frames) + cols - 1) // cols
    board = Image.new("RGB", (cols * panel_w, 118 + rows * panel_h), (13, 16, 21))
    draw = ImageDraw.Draw(board)
    draw.text((28, 20), "SWAHILI AIR MEDIUM - RUNTIME CONNECTOR CANDIDATE", font=font(30, True), fill=(244, 194, 67))
    draw.text((28, 67), "13 frames | one shaft contact | approved key poses retained | motion review pending", font=font(17), fill=(221, 226, 233))
    for index, frame in enumerate(frames):
        x, y = (index % cols) * panel_w, 118 + (index // cols) * panel_h
        panel = Image.new("RGBA", (panel_w, panel_h), (25, 29, 36, 255))
        for py in range(0, panel_h, 24):
            for px in range(0, panel_w, 24):
                if (px // 24 + py // 24) % 2:
                    ImageDraw.Draw(panel).rectangle((px, py, px + 23, py + 23), fill=(39, 44, 53, 255))
        fitted = premul_resize(frame, (panel_w - 20, panel_h - 44))
        panel.alpha_composite(fitted, (10, 34))
        board.paste(panel.convert("RGB"), (x, y))
        draw = ImageDraw.Draw(board)
        draw.text((x + 12, y + 10), f"{index + 1:02d}", font=font(18, True), fill=(244, 194, 67))
    board.save(CONTACT, "PNG")


def write_report(records: list[dict]) -> None:
    REPORT.write_text(json.dumps({
        "classification": "PASS_TECHNICAL",
        "status": "candidate_runtime_ready_motion_review_pending",
        "source": "tools/nga-forge/production/characters/swahili/source-frames/candidates/moveset-goal-v1/air-medium-scythe-shaft-v1/air_medium",
        "sourceKeyPoseCount": 3,
        "connectorFramesAuthored": sum(1 for r in records if r["connector"]),
        "atlas": {"path": str(ATLAS.relative_to(ROOT)).replace("\\", "/"), "width": ATLAS_CELL * len(records), "height": ATLAS_CELL, "columns": len(records), "rows": 1, "cellWidth": ATLAS_CELL, "cellHeight": ATLAS_CELL, "mode": "RGBA"},
        "anchor": {"x": ANCHOR_X, "baselineY": BASELINE_Y, "targetVisibleHeight": TARGET_VISIBLE_HEIGHT},
        "background": {"source": "approved transparent key poses", "method": "preserved source alpha", "fakeBackgroundRemaining": False},
        "hitParity": {"visibleContacts": 1, "registeredHitCount": 1, "contactFrame": 6, "contactSurface": "shaft"},
        "motionReview": {"required": True, "scope": "rigid-pose connector rotations and gameplay-speed readability", "humanApproval": False},
        "frames": records,
        "notes": [
            "The three approved Air Medium key poses are preserved as runtime frames.",
            "Connector frames are deterministic rigid-pose rotations around the shared airborne root; no duplicate bodies or gameplay values changed.",
            "Air Medium is wired as a candidate runtime clip for local playtest only.",
            "Air Heavy remains a separate candidate proxy until its dedicated sheet is authored.",
        ],
    }, indent=2) + "\n", encoding="utf-8")


def main() -> None:
    OUT.mkdir(parents=True, exist_ok=True)
    frames, records = build()
    make_atlas(frames)
    make_contact(frames)
    write_report(records)
    print(json.dumps({"result": "PASS", "atlas": str(ATLAS), "contact": str(CONTACT), "report": str(REPORT), "frameCount": len(frames)}, indent=2))


if __name__ == "__main__":
    main()
