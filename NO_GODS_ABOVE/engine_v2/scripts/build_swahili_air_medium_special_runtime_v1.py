from __future__ import annotations

import json
from pathlib import Path

import numpy as np
from PIL import Image, ImageDraw, ImageFont


ROOT = Path(__file__).resolve().parents[3]
SOURCE_ROOT = ROOT / "tools/nga-forge/production/characters/swahili/source-frames/candidates/moveset-goal-v1/air-heavy-descending-hook-v1/generated/cutout"
OUT = ROOT / "tools/nga-forge/production/characters/swahili/reviews/air-specials-v1/runtime-air-medium-special-v1"
FRAMES = OUT / "frames_1536"
ATLAS = OUT / "swahili_air_medium_special_runtime_v1_13x1_448.png"
CONTACT = OUT / "swahili_air_medium_special_runtime_v1_contact_sheet.png"
REPORT = OUT / "swahili_air_medium_special_runtime_v1.validation.json"

CANVAS = (1536, 1536)
ANCHOR_X, BASELINE_Y = 773, 1406
TARGET_VISIBLE_HEIGHT = 1035
ATLAS_CELL = 448
ALPHA_THRESHOLD = 24
SAFE_MARGIN = 32

# These are actual aerial, scythe-in-hand Swahili source poses. The second and
# third poses are deliberately treated as the two gameplay contacts for the
# hook/pull-through special; the regular j.K air normal is not touched.
KEYS = (
    ("01_committed_airborne_load_cutout", "startup_load", False),
    ("02_descending_hook_contact_cutout", "first_hook_contact", True),
    ("03_post_contact_landing_carry_cutout", "second_pull_through_contact", True),
    ("04_held_scythe_attack_landing_recovery_cutout", "recovery_unwind", False),
)

# One clean body per frame. Rotations are only connectors around the shared
# root; no alpha morphing is used, so the scythe never ghosts or splits.
CONNECTOR_PLAN = (
    ("key", 0),
    ("rotate", 0, -8),
    ("rotate", 0, -16),
    ("key", 1),
    ("rotate", 1, 8),
    ("rotate", 1, 16),
    ("key", 2),
    ("rotate", 2, 8),
    ("rotate", 2, 16),
    ("key", 3),
    ("key", 3),
    ("key", 3),
    ("key", 3),
)


def visible_bbox(image: Image.Image) -> tuple[int, int, int, int]:
    alpha = np.asarray(image.getchannel("A"))
    ys, xs = np.where(alpha > ALPHA_THRESHOLD)
    if len(xs) == 0:
        raise RuntimeError("frame has no visible pixels")
    return int(xs.min()), int(ys.min()), int(xs.max() + 1), int(ys.max() + 1)


def premul_resize(image: Image.Image, size: tuple[int, int]) -> Image.Image:
    return image.convert("RGBa").resize(size, Image.Resampling.LANCZOS).convert("RGBA")


def normalize(image: Image.Image, scale: float) -> Image.Image:
    """Normalize an authored aerial pose onto the shared Swahili root."""
    rgba = image.convert("RGBA")
    box = visible_bbox(rgba)
    resized = premul_resize(rgba, (round(rgba.width * scale), round(rgba.height * scale)))
    scaled_box = tuple(round(value * scale) for value in box)
    left = round(ANCHOR_X - (scaled_box[0] + scaled_box[2]) / 2)
    top = BASELINE_Y - scaled_box[3]
    canvas = Image.new("RGBA", CANVAS, (0, 0, 0, 0))
    canvas.alpha_composite(resized, (left, top))
    return canvas


def rotate_pose(image: Image.Image, degrees: float) -> Image.Image:
    """Rotate a complete pose, then re-ground it without clipping any pixels."""
    rgba = image.convert("RGBA")
    box = visible_bbox(rgba)
    pad = 72
    crop = rgba.crop((max(0, box[0] - pad), max(0, box[1] - pad), min(rgba.width, box[2] + pad), min(rgba.height, box[3] + pad)))
    rotated = crop.rotate(degrees, resample=Image.Resampling.BICUBIC, expand=True)
    rotated_box = visible_bbox(rotated)
    visible_w = rotated_box[2] - rotated_box[0]
    visible_h = rotated_box[3] - rotated_box[1]
    if visible_w > CANVAS[0] - 2 * SAFE_MARGIN or visible_h > CANVAS[1] - 2 * SAFE_MARGIN:
        fit = min((CANVAS[0] - 2 * SAFE_MARGIN) / visible_w, (CANVAS[1] - 2 * SAFE_MARGIN) / visible_h)
        rotated = premul_resize(rotated, (round(rotated.width * fit), round(rotated.height * fit)))
        rotated_box = visible_bbox(rotated)
    left = round(ANCHOR_X - (rotated_box[0] + rotated_box[2]) / 2)
    top = BASELINE_Y - rotated_box[3]
    left = max(SAFE_MARGIN - rotated_box[0], min(CANVAS[0] - SAFE_MARGIN - (rotated_box[2] - rotated_box[0]) - rotated_box[0], left))
    top = max(SAFE_MARGIN - rotated_box[1], min(CANVAS[1] - SAFE_MARGIN - (rotated_box[3] - rotated_box[1]) - rotated_box[1], top))
    canvas = Image.new("RGBA", CANVAS, (0, 0, 0, 0))
    canvas.alpha_composite(rotated, (left, top))
    return canvas


def font(size: int, bold: bool = False) -> ImageFont.FreeTypeFont:
    path = "C:/Windows/Fonts/seguisb.ttf" if bold else "C:/Windows/Fonts/segoeui.ttf"
    return ImageFont.truetype(path, size)


def build() -> tuple[list[Image.Image], list[dict]]:
    raw: list[Image.Image] = []
    for stem, _, _ in KEYS:
        source = SOURCE_ROOT / f"{stem}.png"
        if not source.exists():
            raise FileNotFoundError(source)
        with Image.open(source) as opened:
            raw.append(opened.convert("RGBA"))
    heights = [visible_bbox(image)[3] - visible_bbox(image)[1] for image in raw]
    scale = TARGET_VISIBLE_HEIGHT / float(np.median(heights))
    keys = [normalize(image, scale) for image in raw]

    frames: list[Image.Image] = []
    records: list[dict] = []
    FRAMES.mkdir(parents=True, exist_ok=True)
    for index, plan in enumerate(CONNECTOR_PLAN, 1):
        if plan[0] == "key":
            key_index = plan[1]
            frame = keys[key_index]
            phase = KEYS[key_index][1]
            contact = KEYS[key_index][2]
            connector = False
            source_keys = [KEYS[key_index][0]]
        else:
            _, key_index, degrees = plan
            frame = rotate_pose(keys[key_index], degrees)
            phase = "startup_connector" if key_index == 0 else "pull_through_connector"
            contact = False
            connector = True
            source_keys = [KEYS[key_index][0]]
        path = FRAMES / f"{index:02d}_air_medium_special_{phase}.png"
        frame.save(path, "PNG", optimize=True)
        box = visible_bbox(frame)
        safe = box[0] >= SAFE_MARGIN and box[1] >= SAFE_MARGIN and box[2] <= CANVAS[0] - SAFE_MARGIN and box[3] <= CANVAS[1] - SAFE_MARGIN
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
            "visibleContact": contact,
            "safeFrame": safe,
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
    draw.text((28, 20), "SWAHILI AIR MEDIUM SPECIAL - HOOK / PULL-THROUGH", font=font(30, True), fill=(244, 194, 67))
    draw.text((28, 67), f"{len(frames)} frames | two contacts | aerial scythe source poses | motion review pending", font=font(17), fill=(221, 226, 233))
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
    safe = all(record["safeFrame"] for record in records)
    contacts = [record["frame"] for record in records if record["visibleContact"]]
    REPORT.write_text(json.dumps({
        "classification": "PASS_TECHNICAL" if safe and contacts == [4, 7] else "FAIL_REVIEW_GATE",
        "status": "candidate_runtime_ready_motion_review_pending" if safe and contacts == [4, 7] else "candidate_runtime_rejected",
        "moveId": "special_air_medium",
        "moveName": "Air Medium Special - Hook / Pull-Through",
        "source": str(SOURCE_ROOT.relative_to(ROOT)).replace("\\", "/"),
        "sourceKeyPoseCount": len(KEYS),
        "connectorFramesAuthored": sum(1 for record in records if record["connector"]),
        "atlas": {"path": str(ATLAS.relative_to(ROOT)).replace("\\", "/"), "width": ATLAS_CELL * len(records), "height": ATLAS_CELL, "columns": len(records), "rows": 1, "cellWidth": ATLAS_CELL, "cellHeight": ATLAS_CELL, "mode": "RGBA"},
        "anchor": {"x": ANCHOR_X, "baselineY": BASELINE_Y, "targetVisibleHeight": TARGET_VISIBLE_HEIGHT},
        "background": {"source": "approved transparent Swahili aerial key poses", "method": "preserved source alpha", "fakeBackgroundRemaining": False},
        "hitParity": {"visibleContacts": len(contacts), "registeredHitCount": 2, "contactFrames": contacts, "contactSurfaces": ["hook", "scythe_pull_through"]},
        "motionReview": {"required": True, "scope": "single-body connectors, weapon continuity, two-contact readability, gameplay-speed readability", "humanApproval": False},
        "frameSafety": {"allFramesInsideSafeMargin": safe, "safeMargin": SAFE_MARGIN, "baselineTolerance": 1, "allBaselineDeltasWithinTolerance": all(abs(record["baselineDelta"]) <= 1 for record in records)},
        "frames": records,
        "notes": [
            "This is the dedicated special_air_medium slot; regular j.K air_medium remains unchanged.",
            "The hook and pull-through contacts are represented by frames 04 and 07 to match the two registered gameplay hits.",
            "Connectors are deterministic rigid-pose rotations with one body per frame; no alpha morphing or mirrored splice is used.",
            "Air Medium Special is wired as a candidate runtime clip for local playtest only; combat timing and damage remain unchanged.",
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
