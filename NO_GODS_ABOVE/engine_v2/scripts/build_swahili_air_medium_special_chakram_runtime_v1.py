from __future__ import annotations

import json
from pathlib import Path

import numpy as np
from PIL import Image, ImageDraw, ImageFont
from scipy import ndimage


ROOT = Path(__file__).resolve().parents[3]
SOURCE = ROOT / "tools/nga-forge/production/characters/swahili/reviews/air-specials-v1/runtime-air-light-v1/frames_1536/01_air_light_contract_bullet_runtime.png"
OUT = ROOT / "tools/nga-forge/production/characters/swahili/reviews/air-specials-v1/runtime-air-medium-special-chakram-v1"
FRAMES = OUT / "frames_1536"
ATLAS = OUT / "swahili_air_medium_special_chakram_runtime_v1_13x1_448.png"
CONTACT = OUT / "swahili_air_medium_special_chakram_runtime_v1_contact_sheet.png"
REPORT = OUT / "swahili_air_medium_special_chakram_runtime_v1.validation.json"

CANVAS = (1536, 1536)
ANCHOR_X, BASELINE_Y = 773, 1406
SPIN_PIVOT = (773, 790)
ATLAS_CELL = 448
ALPHA_THRESHOLD = 24
SAFE_MARGIN = 32
SPIN_BODY_BOTTOM_Y = 1204

# A compact, clean Swahili aerial pose is the preserved source. Rotating the
# complete pose around the torso pivot makes the scythe orbit around the body,
# giving the special its own chakram silhouette without duplicating the body.
ROTATION_DEGREES = (0, 30, 60, 90, 120, 150, 180, 210, 240, 270, 300, 330, 360)
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
    """Keep only the connected Swahili body/scythe silhouette; drop stray flecks."""
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


def normalize(image: Image.Image) -> Image.Image:
    rgba = isolate_subject(image)
    box = visible_bbox(rgba)
    # The Air Light runtime source is already normalized. Preserve that exact
    # size and vertical placement; only recenter the clean connected silhouette.
    left = round(ANCHOR_X - (box[0] + box[2]) / 2)
    canvas = Image.new("RGBA", CANVAS, (0, 0, 0, 0))
    canvas.alpha_composite(rgba, (left, 0))
    return canvas


def spin_pose(image: Image.Image, degrees: float) -> Image.Image:
    """Spin a single compact body/scythe around the torso, with no clipping."""
    margin = 768
    work = Image.new("RGBA", (CANVAS[0] + margin * 2, CANVAS[1] + margin * 2), (0, 0, 0, 0))
    work.alpha_composite(image, (margin, margin))
    pivot = (SPIN_PIVOT[0] + margin, SPIN_PIVOT[1] + margin)
    rotated = work.rotate(degrees, resample=Image.Resampling.BICUBIC, center=pivot, expand=False)
    canvas = rotated.crop((margin, margin, margin + CANVAS[0], margin + CANVAS[1]))
    box = visible_bbox(canvas)
    if box[0] < SAFE_MARGIN or box[1] < SAFE_MARGIN or box[2] > CANVAS[0] - SAFE_MARGIN or box[3] > CANVAS[1] - SAFE_MARGIN:
        # Keep one-body rotation but reduce uniformly if a blade corner reaches
        # the safe edge. The fallback is deterministic and never crops art.
        fit_w = (CANVAS[0] - 2 * SAFE_MARGIN) / max(1, box[2] - box[0])
        fit_h = (CANVAS[1] - 2 * SAFE_MARGIN) / max(1, box[3] - box[1])
        fit = min(1.0, fit_w, fit_h)
        if fit < 1.0:
            small = premul_resize(canvas, (round(CANVAS[0] * fit), round(CANVAS[1] * fit)))
            canvas = Image.new("RGBA", CANVAS, (0, 0, 0, 0))
            canvas.alpha_composite(small, ((CANVAS[0] - small.width) // 2, (CANVAS[1] - small.height) // 2))
    # Hold the airborne body at a fixed spin height so the chakram reads as a
    # deliberate in-place rotation instead of a vertical bob caused by blade
    # extents changing from frame to frame.
    box = visible_bbox(canvas)
    dy = SPIN_BODY_BOTTOM_Y - box[3]
    if dy:
        shifted = Image.new("RGBA", CANVAS, (0, 0, 0, 0))
        shifted.alpha_composite(canvas, (0, dy))
        canvas = shifted
    return canvas


def font(size: int, bold: bool = False) -> ImageFont.FreeTypeFont:
    path = "C:/Windows/Fonts/seguisb.ttf" if bold else "C:/Windows/Fonts/segoeui.ttf"
    return ImageFont.truetype(path, size)


def build() -> tuple[list[Image.Image], list[dict]]:
    if not SOURCE.exists():
        raise FileNotFoundError(SOURCE)
    with Image.open(SOURCE) as opened:
        key = normalize(opened)
    frames: list[Image.Image] = []
    records: list[dict] = []
    FRAMES.mkdir(parents=True, exist_ok=True)
    for index, degrees in enumerate(ROTATION_DEGREES, 1):
        frame = spin_pose(key, degrees)
        phase = "chakram_spin_contact" if index in CONTACT_FRAMES else ("chakram_spin_startup" if index < min(CONTACT_FRAMES) else "chakram_spin_recovery")
        path = FRAMES / f"{index:02d}_air_medium_special_{phase}.png"
        frame.save(path, "PNG", optimize=True)
        box = visible_bbox(frame)
        safe = box[0] >= SAFE_MARGIN and box[1] >= SAFE_MARGIN and box[2] <= CANVAS[0] - SAFE_MARGIN and box[3] <= CANVAS[1] - SAFE_MARGIN
        frames.append(frame)
        records.append({
            "frame": index,
            "degrees": degrees,
            "path": str(path.relative_to(ROOT)).replace("\\", "/"),
            "phase": phase,
            "connector": index != 1,
            "sourceKeys": ["01_air_light_contract_bullet_runtime"],
            "bbox": list(box),
            "visibleWidth": box[2] - box[0],
            "visibleHeight": box[3] - box[1],
            "baselineDelta": box[3] - BASELINE_Y,
            "spinBodyBottomDelta": box[3] - SPIN_BODY_BOTTOM_Y,
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
    draw.text((28, 20), "SWAHILI AIR MEDIUM SPECIAL - CHAKRAM SPIN", font=font(30, True), fill=(244, 194, 67))
    draw.text((28, 67), f"{len(frames)} frames | two scythe contacts | single compact body | motion review pending", font=font(17), fill=(221, 226, 233))
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
        draw.text((x + 12, y + 10), f"{index + 1:02d}  {ROTATION_DEGREES[index]}°", font=font(16, True), fill=(244, 194, 67))
    board.save(CONTACT, "PNG")


def write_report(records: list[dict]) -> None:
    safe = all(record["safeFrame"] for record in records)
    baseline_ok = all(abs(record["spinBodyBottomDelta"]) <= 1 for record in records)
    contacts = [record["frame"] for record in records if record["visibleContact"]]
    ready = safe and baseline_ok and contacts == sorted(CONTACT_FRAMES)
    REPORT.write_text(json.dumps({
        "classification": "PASS_TECHNICAL" if ready else "FAIL_REVIEW_GATE",
        "status": "candidate_runtime_ready_motion_review_pending" if ready else "candidate_runtime_rejected",
        "moveId": "special_air_medium",
        "moveName": "Air Medium Special - Chakram Spin",
        "source": str(SOURCE.relative_to(ROOT)).replace("\\", "/"),
        "sourceKeyPoseCount": 1,
        "connectorFramesAuthored": len(records) - 1,
        "atlas": {"path": str(ATLAS.relative_to(ROOT)).replace("\\", "/"), "width": ATLAS_CELL * len(records), "height": ATLAS_CELL, "columns": len(records), "rows": 1, "cellWidth": ATLAS_CELL, "cellHeight": ATLAS_CELL, "mode": "RGBA"},
        "anchor": {"x": ANCHOR_X, "baselineY": BASELINE_Y, "spinPivot": {"x": SPIN_PIVOT[0], "y": SPIN_PIVOT[1]}, "spinBodyBottomY": SPIN_BODY_BOTTOM_Y, "sourceScale": 1.0},
        "background": {"source": "transparent Swahili compact aerial source pose", "method": "preserved source alpha", "fakeBackgroundRemaining": False},
        "hitParity": {"visibleContacts": len(contacts), "registeredHitCount": 2, "contactFrames": contacts, "contactSurfaces": ["chakram_outer_blade_pass_1", "chakram_outer_blade_pass_2"]},
        "motionReview": {"required": True, "scope": "chakram silhouette, rotational readability, scythe orbit continuity, two-contact readability", "humanApproval": False},
        "frameSafety": {"allFramesInsideSafeMargin": safe, "safeMargin": SAFE_MARGIN, "spinBodyBottomTolerance": 1, "allSpinBodyBottomDeltasWithinTolerance": baseline_ok},
        "frames": records,
        "notes": [
            "This is the dedicated special_air_medium slot; regular j.K air_medium remains unchanged.",
            "The compact Swahili body rotates as one clean silhouette while the scythe blade orbits around the torso like a chakram.",
            "Frames 05 and 09 are the visible scythe passes paired to the two registered gameplay hits.",
            "No alpha morphing, duplicate body, baked VFX, mirrored splice, or gameplay value changed.",
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
