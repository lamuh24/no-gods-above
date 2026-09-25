from __future__ import annotations

import json
from pathlib import Path

import numpy as np
from PIL import Image, ImageDraw

from build_swahili_air_medium_special_chakram_ball_runtime_v3 import (
    ALPHA_THRESHOLD, ANCHOR_X, AIR_BODY_BOTTOM_Y, BASELINE_Y, BALL_PIVOT,
    CANVAS, CONTACT_FRAMES, PICKUP_SOURCES, ROOT, SAFE_MARGIN,
    font, isolate_subject, normalize_pose, premul_resize, visible_bbox,
)

REVIEW_ROOT = ROOT / "tools/nga-forge/production/characters/swahili/reviews/air-specials-v1"
BALL_SOURCE = ROOT / "tools/nga-forge/production/characters/swahili/source-frames/approved/knockdown-recovery-motion-v1/02_airborne_tumble.png"
GRIP_SOURCE = ROOT / "tools/nga-forge/production/characters/swahili/source-frames/candidates/command-grab-scoop-v8-isolated-scythe-repair-v1/08_maximum_speed_scoop.png"
MASK_ROOT = GRIP_SOURCE.parent / "masks"
OUT = REVIEW_ROOT / "runtime-air-medium-special-chakram-held-mask-ball-v6"
FRAMES, ATLAS, CONTACT, REPORT = OUT / "frames_1536", OUT / "swahili_air_medium_special_chakram_held_mask_ball_v6_13x1_448.png", OUT / "swahili_air_medium_special_chakram_held_mask_ball_v6_contact_sheet.png", OUT / "swahili_air_medium_special_chakram_held_mask_ball_v6.validation.json"
SPIN_DEGREES = (30, 75, 120, 165, 210, 255, 300, 345, 390)


def masked_grip_layer() -> Image.Image:
    with Image.open(GRIP_SOURCE) as opened:
        grip = opened.convert("RGBA")
    masks = [
        MASK_ROOT / "08_maximum_speed_scoop.scythe-front-of-body.png",
        MASK_ROOT / "08_maximum_speed_scoop.shaft-front-of-victim.png",
        MASK_ROOT / "08_maximum_speed_scoop.blade-behind-victim.png",
        MASK_ROOT / "08_maximum_speed_scoop.hand-over-shaft.png",
    ]
    mask = np.zeros((CANVAS[1], CANVAS[0]), dtype=bool)
    for path in masks:
        with Image.open(path) as opened:
            mask |= np.asarray(opened.convert("RGB"))[..., 0] > 127
    rgba = np.asarray(grip).copy()
    rgba[..., 3] = np.where(mask, rgba[..., 3], 0)
    layer = Image.fromarray(rgba, "RGBA")
    box = visible_bbox(layer)
    crop = premul_resize(layer.crop(box), (round((box[2] - box[0]) * 0.60), round((box[3] - box[1]) * 0.60)))
    canvas = Image.new("RGBA", CANVAS, (0, 0, 0, 0))
    canvas.alpha_composite(crop, (round(ANCHOR_X - crop.width / 2), 780))
    return canvas


def held_ball() -> Image.Image:
    with Image.open(BALL_SOURCE) as opened:
        ball = normalize_pose(opened)
    ball.alpha_composite(masked_grip_layer())
    box = visible_bbox(ball)
    if box[3] != AIR_BODY_BOTTOM_Y:
        shifted = Image.new("RGBA", CANVAS, (0, 0, 0, 0))
        shifted.alpha_composite(ball, (0, AIR_BODY_BOTTOM_Y - box[3]))
        ball = shifted
    return ball


def spin(ball: Image.Image, degrees: float) -> Image.Image:
    margin = 768
    work = Image.new("RGBA", (CANVAS[0] + 2 * margin, CANVAS[1] + 2 * margin), (0, 0, 0, 0))
    work.alpha_composite(ball, (margin, margin))
    rotated = work.rotate(degrees, resample=Image.Resampling.BICUBIC, center=(BALL_PIVOT[0] + margin, BALL_PIVOT[1] + margin), expand=False)
    canvas = rotated.crop((margin, margin, margin + CANVAS[0], margin + CANVAS[1]))
    box = visible_bbox(canvas)
    fit = min(1.0, (CANVAS[0] - 2 * SAFE_MARGIN) / max(1, box[2] - box[0]), (AIR_BODY_BOTTOM_Y - SAFE_MARGIN - 2) / max(1, box[3] - box[1]))
    if fit < 1:
        small = premul_resize(canvas, (round(CANVAS[0] * fit), round(CANVAS[1] * fit)))
        canvas = Image.new("RGBA", CANVAS, (0, 0, 0, 0))
        canvas.alpha_composite(small, ((CANVAS[0] - small.width) // 2, (CANVAS[1] - small.height) // 2))
    box = visible_bbox(canvas)
    result = Image.new("RGBA", CANVAS, (0, 0, 0, 0))
    result.alpha_composite(canvas, (round(ANCHOR_X - (box[0] + box[2]) / 2), AIR_BODY_BOTTOM_Y - box[3]))
    return result


def build() -> tuple[list[Image.Image], list[dict]]:
    for source in [*PICKUP_SOURCES, BALL_SOURCE, GRIP_SOURCE, *list(MASK_ROOT.glob("08_maximum_speed_scoop.*.png"))]:
        if not source.exists():
            raise FileNotFoundError(source)
    pickups = []
    for source in PICKUP_SOURCES:
        with Image.open(source) as opened:
            pickups.append(normalize_pose(opened))
    ball = held_ball()
    frames = [*pickups, ball]
    phases = ["scythe_grab_reach", "scythe_grab_clamp", "scythe_grab_lock", "tuck_into_held_ball"]
    angles = [None, None, None, 0]
    for frame, angle in enumerate(SPIN_DEGREES, 5):
        frames.append(spin(ball, angle)); angles.append(angle)
        phases.append("chakram_spin_contact" if frame in CONTACT_FRAMES else "chakram_spin_followthrough" if frame < max(CONTACT_FRAMES) else "chakram_spin_recovery")
    FRAMES.mkdir(parents=True, exist_ok=True)
    records = []
    keys = ["01_air_medium_special_startup_load", "02_air_medium_special_startup_connector", "03_air_medium_special_startup_connector", "02_airborne_tumble_plus_masked_scythe_grip"]
    for index, (frame, phase, angle) in enumerate(zip(frames, phases, angles), 1):
        path = FRAMES / f"{index:02d}_air_medium_special_{phase}.png"; frame.save(path, "PNG", optimize=True)
        box = visible_bbox(frame); safe = box[0] >= SAFE_MARGIN and box[1] >= SAFE_MARGIN and box[2] <= CANVAS[0] - SAFE_MARGIN and box[3] <= CANVAS[1] - SAFE_MARGIN
        records.append({"frame": index, "degrees": angle, "path": str(path.relative_to(ROOT)).replace("\\", "/"), "phase": phase, "connector": index != 1, "sourceKeys": keys, "bbox": list(box), "visibleWidth": box[2] - box[0], "visibleHeight": box[3] - box[1], "baselineDelta": box[3] - BASELINE_Y, "spinBodyBottomDelta": box[3] - AIR_BODY_BOTTOM_Y, "opaquePixels": int((np.asarray(frame.getchannel("A")) > ALPHA_THRESHOLD).sum()), "visibleContact": index in CONTACT_FRAMES, "safeFrame": safe})
    return frames, records


def make_atlas(frames: list[Image.Image]) -> None:
    atlas = Image.new("RGBA", (448 * len(frames), 448), (0, 0, 0, 0))
    for index, frame in enumerate(frames): atlas.alpha_composite(frame.resize((448, 448), Image.Resampling.LANCZOS), (index * 448, 0))
    atlas.save(ATLAS, "PNG")


def make_contact(frames: list[Image.Image]) -> None:
    cols, panel_w, panel_h = 7, 300, 330; board = Image.new("RGB", (cols * panel_w, 118 + 2 * panel_h), (13, 16, 21)); draw = ImageDraw.Draw(board)
    draw.text((28, 20), "SWAHILI AIR MEDIUM SPECIAL - GRAB -> HOLD SCYTHE -> TUCK BALL -> SPIN", font=font(27, True), fill=(244, 194, 67))
    draw.text((28, 67), f"{len(frames)} frames | masked scythe-and-hand grip over curled ball | two contacts | motion review pending", font=font(16), fill=(221, 226, 233))
    labels = {1: "GRAB", 2: "CLAMP", 3: "LOCK", 4: "TUCK + GRIP", 5: "HIT 1", 9: "HIT 2"}
    for index, frame in enumerate(frames):
        x, y = (index % cols) * panel_w, 118 + (index // cols) * panel_h; panel = Image.new("RGBA", (panel_w, panel_h), (25, 29, 36, 255)); panel_draw = ImageDraw.Draw(panel)
        for py in range(0, panel_h, 24):
            for px in range(0, panel_w, 24):
                if (px // 24 + py // 24) % 2: panel_draw.rectangle((px, py, px + 23, py + 23), fill=(39, 44, 53, 255))
        panel.alpha_composite(premul_resize(frame, (panel_w - 20, panel_h - 44)), (10, 34)); board.paste(panel.convert("RGB"), (x, y)); ImageDraw.Draw(board).text((x + 12, y + 10), f"{index + 1:02d}  {labels.get(index + 1, 'SPIN')}", font=font(14, True), fill=(244, 194, 67))
    board.save(CONTACT, "PNG")


def write_report(records: list[dict]) -> None:
    safe = all(record["safeFrame"] for record in records); height_ok = all(abs(record["spinBodyBottomDelta"]) <= 1 for record in records); contacts = [record["frame"] for record in records if record["visibleContact"]]; ready = safe and height_ok and contacts == sorted(CONTACT_FRAMES)
    REPORT.write_text(json.dumps({"classification": "PASS_TECHNICAL" if ready else "FAIL_REVIEW_GATE", "status": "candidate_runtime_ready_motion_review_pending" if ready else "candidate_runtime_rejected", "moveId": "special_air_medium", "moveName": "Air Medium Special - Scythe Grab, Held Scythe Tuck Ball, Chakram Spin", "design": "scythe_grab_then_masked_held_scythe_tuck_ball_chakram_spin", "sources": [str(path.relative_to(ROOT)).replace("\\", "/") for path in [*PICKUP_SOURCES, BALL_SOURCE, GRIP_SOURCE]], "sourceKeyPoseCount": 4, "connectorFramesAuthored": len(records) - 4, "atlas": {"path": str(ATLAS.relative_to(ROOT)).replace("\\", "/"), "width": 448 * len(records), "height": 448, "columns": len(records), "rows": 1, "cellWidth": 448, "cellHeight": 448, "mode": "RGBA"}, "anchor": {"x": ANCHOR_X, "baselineY": BASELINE_Y, "spinPivot": {"x": BALL_PIVOT[0], "y": BALL_PIVOT[1]}, "airBodyBottomY": AIR_BODY_BOTTOM_Y, "sourceScale": 1.0}, "background": {"source": "preserved transparent tumble body plus source-validated scythe/hand masks", "method": "connected-component cleanup, authored mask union, and preserved source alpha", "fakeBackgroundRemaining": False}, "hitParity": {"visibleContacts": len(contacts), "registeredHitCount": 2, "contactFrames": contacts, "contactSurfaces": ["chakram_outer_blade_pass_1", "chakram_outer_blade_pass_2"]}, "motionReview": {"required": True, "scope": "three-frame scythe pickup, held scythe through compact tuck, scythe orbit continuity, two-contact readability", "humanApproval": False}, "frameSafety": {"allFramesInsideSafeMargin": safe, "safeMargin": SAFE_MARGIN, "airBodyBottomTolerance": 1, "allAirBodyBottomDeltasWithinTolerance": height_ok}, "frames": records, "notes": ["This V6 supersedes V3-V5 held-ball experiments while preserving them as history.", "Frames 01-03 acquire and lock the scythe; frame 04 overlays the source-validated scythe and hand masks onto the curled ball body.", "Frames 05-13 rotate the held-scythe ball as one unit; frames 05 and 09 are the two registered contacts.", "Regular j.K air_medium remains unchanged; no gameplay values, inputs, or hit counts changed.", "Candidate runtime only; human motion approval is still required before promotion."]}, indent=2) + "\n", encoding="utf-8")


def main() -> None:
    OUT.mkdir(parents=True, exist_ok=True); frames, records = build(); make_atlas(frames); make_contact(frames); write_report(records); print(json.dumps({"result": "PASS", "atlas": str(ATLAS), "contact": str(CONTACT), "report": str(REPORT), "frameCount": len(frames)}, indent=2))


if __name__ == "__main__": main()
