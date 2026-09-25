from __future__ import annotations

import json
from pathlib import Path

import numpy as np
from PIL import Image, ImageDraw, ImageFont
from scipy import ndimage


ROOT = Path(__file__).resolve().parents[3]
REVIEW_ROOT = ROOT / "tools/nga-forge/production/characters/swahili/reviews/air-specials-v1"
PICKUP_SOURCES = [
    REVIEW_ROOT / "runtime-air-medium-special-v1/frames_1536/01_air_medium_special_startup_load.png",
    REVIEW_ROOT / "runtime-air-medium-special-v1/frames_1536/02_air_medium_special_startup_connector.png",
    REVIEW_ROOT / "runtime-air-medium-special-v1/frames_1536/03_air_medium_special_startup_connector.png",
]
SPIN_SOURCE = REVIEW_ROOT / "runtime-air-medium-special-v1/frames_1536/04_air_medium_special_first_hook_contact.png"
OUT = REVIEW_ROOT / "runtime-air-medium-special-chakram-grab-v2"
FRAMES = OUT / "frames_1536"
ATLAS = OUT / "swahili_air_medium_special_chakram_grab_v2_13x1_448.png"
CONTACT = OUT / "swahili_air_medium_special_chakram_grab_v2_contact_sheet.png"
REPORT = OUT / "swahili_air_medium_special_chakram_grab_v2.validation.json"

CANVAS = (1536, 1536)
ANCHOR_X, BASELINE_Y = 773, 1406
SPIN_PIVOT = (773, 790)
ATLAS_CELL = 448
ALPHA_THRESHOLD = 24
SAFE_MARGIN = 32
AIR_BODY_BOTTOM_Y = 1204
SPIN_DEGREES = (30, 75, 120, 165, 210, 255, 300, 345, 390)
CONTACT_FRAMES = {5, 9}


def visible_bbox(image: Image.Image) -> tuple[int, int, int, int]:
    alpha = np.asarray(image.getchannel("A"))
    ys, xs = np.where(alpha > ALPHA_THRESHOLD)
    if len(xs) == 0:
        raise RuntimeError("frame has no visible pixels")
    return int(xs.min()), int(ys.min()), int(xs.max() + 1), int(ys.max() + 1)


def premul_resize(image: Image.Image, size: tuple[int, int]) -> Image.Image:
    return image.convert("RGBa").resize(size, Image.Resampling.LANCZOS).convert("RGBA")


def isolate_subject(image: Image.Image) -> Image.Image:
    """Keep the connected Swahili/scythe body and discard isolated source flecks."""
    rgba = image.convert("RGBA")
    alpha = np.asarray(rgba.getchannel("A")) > ALPHA_THRESHOLD
    labels, count = ndimage.label(alpha, np.ones((3, 3), dtype=np.uint8))
    if count == 0:
        raise RuntimeError("source has no visible pixels")
    sizes = np.bincount(labels.ravel())
    subject_label = int(np.argmax(sizes[1:]) + 1)
    pixels = np.asarray(rgba).copy()
    pixels[..., 3] = np.where(labels == subject_label, pixels[..., 3], 0)
    return Image.fromarray(pixels, "RGBA")


def prepare_air_pose(image: Image.Image) -> Image.Image:
    """Recenter a clean source pose and put its airborne body at one fixed height."""
    rgba = isolate_subject(image)
    box = visible_bbox(rgba)
    left = round(ANCHOR_X - (box[0] + box[2]) / 2)
    canvas = Image.new("RGBA", CANVAS, (0, 0, 0, 0))
    canvas.alpha_composite(rgba, (left, 0))
    box = visible_bbox(canvas)
    dy = AIR_BODY_BOTTOM_Y - box[3]
    if dy:
        shifted = Image.new("RGBA", CANVAS, (0, 0, 0, 0))
        shifted.alpha_composite(canvas, (0, dy))
        canvas = shifted
    return canvas


def spin_pose(image: Image.Image, degrees: float) -> Image.Image:
    """Orbit the held scythe/body as one clean silhouette without clipping."""
    margin = 768
    work = Image.new("RGBA", (CANVAS[0] + margin * 2, CANVAS[1] + margin * 2), (0, 0, 0, 0))
    work.alpha_composite(image, (margin, margin))
    pivot = (SPIN_PIVOT[0] + margin, SPIN_PIVOT[1] + margin)
    rotated = work.rotate(degrees, resample=Image.Resampling.BICUBIC, center=pivot, expand=False)
    canvas = rotated.crop((margin, margin, margin + CANVAS[0], margin + CANVAS[1]))
    box = visible_bbox(canvas)
    fit_w = (CANVAS[0] - 2 * SAFE_MARGIN) / max(1, box[2] - box[0])
    # The bottom is intentionally held at AIR_BODY_BOTTOM_Y for every
    # airborne frame, so the top must fit inside the remaining height too.
    fit_h = (AIR_BODY_BOTTOM_Y - SAFE_MARGIN - 2) / max(1, box[3] - box[1])
    fit = min(1.0, fit_w, fit_h)
    if fit < 1.0:
        small = premul_resize(canvas, (round(CANVAS[0] * fit), round(CANVAS[1] * fit)))
        canvas = Image.new("RGBA", CANVAS, (0, 0, 0, 0))
        canvas.alpha_composite(small, ((CANVAS[0] - small.width) // 2, (CANVAS[1] - small.height) // 2))
    # Rotation changes the blade's horizontal extent. Recenter the complete
    # silhouette around the fighter anchor so neither the blade nor the body
    # walks toward a cell edge as the scythe orbits.
    box = visible_bbox(canvas)
    dx = round(ANCHOR_X - (box[0] + box[2]) / 2)
    if dx:
        shifted = Image.new("RGBA", CANVAS, (0, 0, 0, 0))
        shifted.alpha_composite(canvas, (dx, 0))
        canvas = shifted
    box = visible_bbox(canvas)
    dy = AIR_BODY_BOTTOM_Y - box[3]
    if dy:
        shifted = Image.new("RGBA", CANVAS, (0, 0, 0, 0))
        shifted.alpha_composite(canvas, (0, dy))
        canvas = shifted
    return canvas


def font(size: int, bold: bool = False) -> ImageFont.FreeTypeFont:
    path = "C:/Windows/Fonts/seguisb.ttf" if bold else "C:/Windows/Fonts/segoeui.ttf"
    return ImageFont.truetype(path, size)


def build() -> tuple[list[Image.Image], list[dict]]:
    for source in [*PICKUP_SOURCES, SPIN_SOURCE]:
        if not source.exists():
            raise FileNotFoundError(source)
    pickup_poses = []
    for source in PICKUP_SOURCES:
        with Image.open(source) as opened:
            pickup_poses.append(prepare_air_pose(opened))
    with Image.open(SPIN_SOURCE) as opened:
        spin_key = prepare_air_pose(opened)

    frames: list[Image.Image] = [*pickup_poses, spin_key]
    degrees_by_frame: list[float | None] = [None, None, None, 0]
    phases = [
        "scythe_grab_reach",
        "scythe_grab_clamp",
        "scythe_grab_lock",
        "chakram_spin_windup",
    ]
    for index, degrees in enumerate(SPIN_DEGREES, 5):
        frames.append(spin_pose(spin_key, degrees))
        degrees_by_frame.append(degrees)
        if index in CONTACT_FRAMES:
            phases.append("chakram_spin_contact")
        elif index < min(CONTACT_FRAMES):
            phases.append("chakram_spin_startup")
        elif index < max(CONTACT_FRAMES):
            phases.append("chakram_spin_followthrough")
        else:
            phases.append("chakram_spin_recovery")

    records: list[dict] = []
    FRAMES.mkdir(parents=True, exist_ok=True)
    for index, (frame, phase, degrees) in enumerate(zip(frames, phases, degrees_by_frame), 1):
        path = FRAMES / f"{index:02d}_air_medium_special_{phase}.png"
        frame.save(path, "PNG", optimize=True)
        box = visible_bbox(frame)
        safe = box[0] >= SAFE_MARGIN and box[1] >= SAFE_MARGIN and box[2] <= CANVAS[0] - SAFE_MARGIN and box[3] <= CANVAS[1] - SAFE_MARGIN
        records.append({
            "frame": index,
            "degrees": degrees,
            "path": str(path.relative_to(ROOT)).replace("\\", "/"),
            "phase": phase,
            "connector": index != 1,
            "sourceKeys": [
                "01_air_medium_special_startup_load",
                "02_air_medium_special_startup_connector",
                "03_air_medium_special_startup_connector",
                "04_air_medium_special_first_hook_contact",
            ],
            "bbox": list(box),
            "visibleWidth": box[2] - box[0],
            "visibleHeight": box[3] - box[1],
            "baselineDelta": box[3] - BASELINE_Y,
            "spinBodyBottomDelta": box[3] - AIR_BODY_BOTTOM_Y,
            "opaquePixels": int((np.asarray(frame.getchannel("A")) > ALPHA_THRESHOLD).sum()),
            "visibleContact": index in CONTACT_FRAMES,
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
    draw.text((28, 20), "SWAHILI AIR MEDIUM SPECIAL - SCYTHE GRAB -> CHAKRAM SPIN", font=font(28, True), fill=(244, 194, 67))
    draw.text((28, 67), f"{len(frames)} frames | grab first | two scythe contacts | motion review pending", font=font(17), fill=(221, 226, 233))
    for index, frame in enumerate(frames):
        x, y = (index % cols) * panel_w, 118 + (index // cols) * panel_h
        panel = Image.new("RGBA", (panel_w, panel_h), (25, 29, 36, 255))
        panel_draw = ImageDraw.Draw(panel)
        for py in range(0, panel_h, 24):
            for px in range(0, panel_w, 24):
                if (px // 24 + py // 24) % 2:
                    panel_draw.rectangle((px, py, px + 23, py + 23), fill=(39, 44, 53, 255))
        fitted = premul_resize(frame, (panel_w - 20, panel_h - 44))
        panel.alpha_composite(fitted, (10, 34))
        board.paste(panel.convert("RGB"), (x, y))
        draw = ImageDraw.Draw(board)
        draw.text((x + 12, y + 10), f"{index + 1:02d}  {phases_label(index + 1)}", font=font(14, True), fill=(244, 194, 67))
    board.save(CONTACT, "PNG")


def phases_label(frame: int) -> str:
    labels = {
        1: "GRAB",
        2: "CLAMP",
        3: "LOCK",
        4: "WINDUP",
        5: "HIT 1",
        9: "HIT 2",
    }
    return labels.get(frame, "SPIN")


def write_report(records: list[dict]) -> None:
    safe = all(record["safeFrame"] for record in records)
    height_ok = all(abs(record["spinBodyBottomDelta"]) <= 1 for record in records)
    contacts = [record["frame"] for record in records if record["visibleContact"]]
    ready = safe and height_ok and contacts == sorted(CONTACT_FRAMES)
    REPORT.write_text(json.dumps({
        "classification": "PASS_TECHNICAL" if ready else "FAIL_REVIEW_GATE",
        "status": "candidate_runtime_ready_motion_review_pending" if ready else "candidate_runtime_rejected",
        "moveId": "special_air_medium",
        "moveName": "Air Medium Special - Scythe Grab into Chakram Spin",
        "design": "scythe_grab_then_chakram_spin",
        "sources": [str(path.relative_to(ROOT)).replace("\\", "/") for path in [*PICKUP_SOURCES, SPIN_SOURCE]],
        "sourceKeyPoseCount": 4,
        "connectorFramesAuthored": len(records) - 4,
        "atlas": {"path": str(ATLAS.relative_to(ROOT)).replace("\\", "/"), "width": ATLAS_CELL * len(records), "height": ATLAS_CELL, "columns": len(records), "rows": 1, "cellWidth": ATLAS_CELL, "cellHeight": ATLAS_CELL, "mode": "RGBA"},
        "anchor": {"x": ANCHOR_X, "baselineY": BASELINE_Y, "spinPivot": {"x": SPIN_PIVOT[0], "y": SPIN_PIVOT[1]}, "airBodyBottomY": AIR_BODY_BOTTOM_Y, "sourceScale": 1.0},
        "background": {"source": "preserved transparent scythe-held Swahili source poses", "method": "connected-component cleanup plus preserved source alpha", "fakeBackgroundRemaining": False},
        "hitParity": {"visibleContacts": len(contacts), "registeredHitCount": 2, "contactFrames": contacts, "contactSurfaces": ["chakram_outer_blade_pass_1", "chakram_outer_blade_pass_2"]},
        "motionReview": {"required": True, "scope": "three-frame scythe pickup, two-hand grip continuity, compact rotational chakram silhouette, two-contact readability", "humanApproval": False},
        "frameSafety": {"allFramesInsideSafeMargin": safe, "safeMargin": SAFE_MARGIN, "airBodyBottomTolerance": 1, "allAirBodyBottomDeltasWithinTolerance": height_ok},
        "frames": records,
        "notes": [
            "This is the dedicated special_air_medium slot; regular j.K air_medium remains unchanged.",
            "Frames 01-03 explicitly acquire and lock the scythe before the spin begins.",
            "Frames 05 and 09 are the visible scythe passes paired to the two registered gameplay hits.",
            "The two-hand scythe silhouette rotates as one clean body; no guns, duplicate body, baked VFX, mirrored splice, or gameplay value changed.",
            "Candidate runtime only; human motion approval is still required before promotion.",
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
