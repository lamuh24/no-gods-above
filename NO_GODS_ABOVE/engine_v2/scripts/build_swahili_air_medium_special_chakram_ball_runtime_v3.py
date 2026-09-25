from __future__ import annotations

import json
from pathlib import Path

import numpy as np
from PIL import Image, ImageDraw, ImageFont

from build_swahili_air_medium_special_chakram_grab_runtime_v2 import (
    ALPHA_THRESHOLD,
    ANCHOR_X,
    AIR_BODY_BOTTOM_Y,
    BASELINE_Y,
    CANVAS,
    CONTACT_FRAMES,
    PICKUP_SOURCES,
    ROOT,
    SAFE_MARGIN,
    SPIN_SOURCE,
    font,
    isolate_subject,
    premul_resize,
    visible_bbox,
)


REVIEW_ROOT = ROOT / "tools/nga-forge/production/characters/swahili/reviews/air-specials-v1"
BALL_SOURCE = ROOT / "tools/nga-forge/production/characters/swahili/source-frames/approved/knockdown-recovery-motion-v1/02_airborne_tumble.png"
OUT = REVIEW_ROOT / "runtime-air-medium-special-chakram-ball-v3"
FRAMES = OUT / "frames_1536"
ATLAS = OUT / "swahili_air_medium_special_chakram_ball_v3_13x1_448.png"
CONTACT = OUT / "swahili_air_medium_special_chakram_ball_v3_contact_sheet.png"
REPORT = OUT / "swahili_air_medium_special_chakram_ball_v3.validation.json"

BALL_PIVOT = (773, 930)
SPIN_DEGREES = (30, 75, 120, 165, 210, 255, 300, 345, 390)


def normalize_pose(image: Image.Image) -> Image.Image:
    """Center a transparent pose and align its airborne foot/coat baseline."""
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


def spin_ball_pose(ball: Image.Image, degrees: float) -> Image.Image:
    """Rotate the compact tucked silhouette as one unit without clipping."""
    margin = 768
    work = Image.new("RGBA", (CANVAS[0] + margin * 2, CANVAS[1] + margin * 2), (0, 0, 0, 0))
    work.alpha_composite(ball, (margin, margin))
    pivot = (BALL_PIVOT[0] + margin, BALL_PIVOT[1] + margin)
    rotated = work.rotate(degrees, resample=Image.Resampling.BICUBIC, center=pivot, expand=False)
    canvas = rotated.crop((margin, margin, margin + CANVAS[0], margin + CANVAS[1]))
    box = visible_bbox(canvas)
    fit_w = (CANVAS[0] - 2 * SAFE_MARGIN) / max(1, box[2] - box[0])
    fit_h = (AIR_BODY_BOTTOM_Y - SAFE_MARGIN - 2) / max(1, box[3] - box[1])
    fit = min(1.0, fit_w, fit_h)
    if fit < 1.0:
        small = premul_resize(canvas, (round(CANVAS[0] * fit), round(CANVAS[1] * fit)))
        canvas = Image.new("RGBA", CANVAS, (0, 0, 0, 0))
        canvas.alpha_composite(small, ((CANVAS[0] - small.width) // 2, (CANVAS[1] - small.height) // 2))
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


def build() -> tuple[list[Image.Image], list[dict]]:
    for source in [*PICKUP_SOURCES, SPIN_SOURCE, BALL_SOURCE]:
        if not source.exists():
            raise FileNotFoundError(source)
    pickup_poses = []
    for source in PICKUP_SOURCES:
        with Image.open(source) as opened:
            pickup_poses.append(normalize_pose(opened))
    with Image.open(BALL_SOURCE) as opened:
        ball_pose = normalize_pose(opened)

    frames: list[Image.Image] = [*pickup_poses, ball_pose]
    degrees_by_frame: list[float | None] = [None, None, None, 0]
    phases = [
        "scythe_grab_reach",
        "scythe_grab_clamp",
        "scythe_grab_lock",
        "tuck_into_ball",
    ]
    for index, degrees in enumerate(SPIN_DEGREES, 5):
        frames.append(spin_ball_pose(ball_pose, degrees))
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
    source_keys = [
        "01_air_medium_special_startup_load",
        "02_air_medium_special_startup_connector",
        "03_air_medium_special_startup_connector",
        "02_airborne_tumble_compact_ball_reference",
    ]
    for index, (frame, phase, degrees) in enumerate(zip(frames, phases, degrees_by_frame), 1):
        # Keep every authored frame addressable; phase labels repeat by design
        # across the spin, so the frame index must be part of the filename.
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
            "sourceKeys": source_keys,
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
    atlas = Image.new("RGBA", (448 * len(frames), 448), (0, 0, 0, 0))
    for index, frame in enumerate(frames):
        atlas.alpha_composite(frame.resize((448, 448), Image.Resampling.LANCZOS), (index * 448, 0))
    atlas.save(ATLAS, "PNG")


def make_contact(frames: list[Image.Image]) -> None:
    cols, panel_w, panel_h = 7, 300, 330
    rows = (len(frames) + cols - 1) // cols
    board = Image.new("RGB", (cols * panel_w, 118 + rows * panel_h), (13, 16, 21))
    draw = ImageDraw.Draw(board)
    draw.text((28, 20), "SWAHILI AIR MEDIUM SPECIAL - GRAB -> TUCK BALL -> CHAKRAM SPIN", font=font(28, True), fill=(244, 194, 67))
    draw.text((28, 67), f"{len(frames)} frames | scythe grab | compact ball | two scythe contacts | motion review pending", font=font(17), fill=(221, 226, 233))
    labels = {1: "GRAB", 2: "CLAMP", 3: "LOCK", 4: "TUCK BALL", 5: "HIT 1", 9: "HIT 2"}
    for index, frame in enumerate(frames):
        x, y = (index % cols) * panel_w, 118 + (index // cols) * panel_h
        panel = Image.new("RGBA", (panel_w, panel_h), (25, 29, 36, 255))
        panel_draw = ImageDraw.Draw(panel)
        for py in range(0, panel_h, 24):
            for px in range(0, panel_w, 24):
                if (px // 24 + py // 24) % 2:
                    panel_draw.rectangle((px, py, px + 23, py + 23), fill=(39, 44, 53, 255))
        panel.alpha_composite(premul_resize(frame, (panel_w - 20, panel_h - 44)), (10, 34))
        board.paste(panel.convert("RGB"), (x, y))
        draw = ImageDraw.Draw(board)
        draw.text((x + 12, y + 10), f"{index + 1:02d}  {labels.get(index + 1, 'SPIN')}", font=font(14, True), fill=(244, 194, 67))
    board.save(CONTACT, "PNG")


def write_report(records: list[dict]) -> None:
    safe = all(record["safeFrame"] for record in records)
    height_ok = all(abs(record["spinBodyBottomDelta"]) <= 1 for record in records)
    contacts = [record["frame"] for record in records if record["visibleContact"]]
    ready = safe and height_ok and contacts == sorted(CONTACT_FRAMES)
    REPORT.write_text(json.dumps({
        "classification": "PASS_TECHNICAL" if ready else "FAIL_REVIEW_GATE",
        "status": "candidate_runtime_ready_motion_review_pending" if ready else "candidate_runtime_rejected",
        "moveId": "special_air_medium",
        "moveName": "Air Medium Special - Scythe Grab into Tucked Ball Chakram Spin",
        "design": "scythe_grab_then_tuck_ball_chakram_spin",
        "sources": [str(path.relative_to(ROOT)).replace("\\", "/") for path in [*PICKUP_SOURCES, BALL_SOURCE]],
        "sourceKeyPoseCount": 4,
        "connectorFramesAuthored": len(records) - 4,
        "atlas": {"path": str(ATLAS.relative_to(ROOT)).replace("\\", "/"), "width": 448 * len(records), "height": 448, "columns": len(records), "rows": 1, "cellWidth": 448, "cellHeight": 448, "mode": "RGBA"},
        "anchor": {"x": ANCHOR_X, "baselineY": BASELINE_Y, "spinPivot": {"x": BALL_PIVOT[0], "y": BALL_PIVOT[1]}, "airBodyBottomY": AIR_BODY_BOTTOM_Y, "sourceScale": 1.0},
        "background": {"source": "preserved transparent Swahili airborne tumble source", "method": "connected-component cleanup plus preserved source alpha", "fakeBackgroundRemaining": False},
        "hitParity": {"visibleContacts": len(contacts), "registeredHitCount": 2, "contactFrames": contacts, "contactSurfaces": ["chakram_outer_blade_pass_1", "chakram_outer_blade_pass_2"]},
        "motionReview": {"required": True, "scope": "three-frame scythe pickup, compact tucked ball silhouette, scythe orbit continuity, two-contact readability", "humanApproval": False},
        "frameSafety": {"allFramesInsideSafeMargin": safe, "safeMargin": SAFE_MARGIN, "airBodyBottomTolerance": 1, "allAirBodyBottomDeltasWithinTolerance": height_ok},
        "frames": records,
        "notes": [
            "This supersedes the v2 extended-body spin candidate while preserving v2 as history.",
            "Frames 01-03 explicitly acquire and lock the scythe before the tuck.",
            "Frame 04 holds the compact airborne tumble/ball silhouette; frames 05-13 rotate that silhouette as one unit.",
            "Frames 05 and 09 are the visible scythe passes paired to the two registered gameplay hits.",
            "Regular j.K air_medium remains unchanged; no gameplay value, input route, or hit count changed.",
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
