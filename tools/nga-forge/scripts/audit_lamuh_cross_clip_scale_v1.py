from __future__ import annotations

import json
import hashlib
from collections import deque
from pathlib import Path

import numpy as np
from PIL import Image, ImageDraw, ImageFont


ROOT = Path(__file__).resolve().parents[3]
OUTPUT_ROOT = ROOT / "tools/nga-forge/review/lamuh-legacy-v2-cross-clip-scale-v1"
REPORT_PATH = OUTPUT_ROOT / "cross-clip-scale.report.json"
CONTACT_SHEET_PATH = OUTPUT_ROOT / "lamuh-fixed-scale-representative-contact-sheet.png"
REFERENCE_MANIFEST_PATH = OUTPUT_ROOT / "reference_manifest.json"
SOURCE_ANALYSIS_PATH = OUTPUT_ROOT / "source_analysis/standing-scale-analysis.json"
VALIDATION_PATH = OUTPUT_ROOT / "validation/standing-scale-validation.json"
REFERENCE_OVERLAY_PATH = OUTPUT_ROOT / "validation/standing-scale-reference-overlay.png"
STANDING_LIGHT_REPORT = ROOT / "tools/nga-forge/review/lamuh-legacy-v2-standing-light-v1/normalization.report.json"
STANDING_MEDIUM_REPORT = ROOT / "tools/nga-forge/review/lamuh-legacy-v2-standing-medium-v1/normalization.report.json"
USER_MEDIUM_REFERENCE = Path(r"C:\Users\qchee\AppData\Local\Temp\codex-clipboard-b7ca2306-737a-4977-9498-98010158efde.png")

SAMPLES = {
    "idle": ROOT / "tools/nga-forge/review/lamuh-legacy-v2-movement-modernization-v1/normalized/idle-00.png",
    "walk_forward": ROOT / "tools/nga-forge/review/lamuh-legacy-v2-movement-modernization-v1/normalized/walk-forward-00.png",
    "walk_backward": ROOT / "tools/nga-forge/review/lamuh-legacy-v2-movement-modernization-v1/normalized/walk-backward-00.png",
    "standing_light": ROOT / "tools/nga-forge/review/lamuh-legacy-v2-standing-light-v1/normalized/standing-light-02.png",
    "standing_medium": ROOT / "tools/nga-forge/review/lamuh-legacy-v2-standing-medium-v1/normalized/standing-medium-04.png",
    "standing_heavy": ROOT / "tools/nga-forge/review/lamuh-legacy-v2-standing-heavy-closure-v1/normalized/standing-heavy-03.png",
    "crouching_light": ROOT / "tools/nga-forge/review/lamuh-legacy-v2-crouching-light-v1/normalized/crouching-light-03.png",
    "crouching_medium": ROOT / "tools/nga-forge/review/lamuh-legacy-v2-crouching-medium-v1/normalized/crouching-medium-03.png",
    "crouching_heavy": ROOT / "tools/nga-forge/review/lamuh-legacy-v2-crouching-heavy-v1/normalized/crouching-heavy-03.png",
}

for index in range(4):
    SAMPLES[f"idle_{index:02d}"] = ROOT / f"tools/nga-forge/review/lamuh-legacy-v2-movement-modernization-v1/normalized/idle-{index:02d}.png"
for index in range(16):
    SAMPLES[f"walk_forward_{index:02d}"] = ROOT / f"tools/nga-forge/review/lamuh-legacy-v2-movement-modernization-v1/normalized/walk-forward-{index:02d}.png"
for index in range(6):
    SAMPLES[f"walk_backward_{index:02d}"] = ROOT / f"tools/nga-forge/review/lamuh-legacy-v2-movement-modernization-v1/normalized/walk-backward-{index:02d}.png"
for index in range(7):
    SAMPLES[f"crouching_heavy_{index:02d}"] = ROOT / f"tools/nga-forge/review/lamuh-legacy-v2-crouching-heavy-v1/normalized/crouching-heavy-{index:02d}.png"
for state, count, review_folder in (
    ("standing_light", 6, "lamuh-legacy-v2-standing-light-v1"),
    ("standing_medium", 8, "lamuh-legacy-v2-standing-medium-v1"),
    ("standing_heavy", 7, "lamuh-legacy-v2-standing-heavy-closure-v1"),
    ("crouching_light", 7, "lamuh-legacy-v2-crouching-light-v1"),
    ("crouching_medium", 8, "lamuh-legacy-v2-crouching-medium-v1"),
):
    for index in range(count):
        SAMPLES[f"{state}_{index:02d}"] = ROOT / f"tools/nga-forge/review/{review_folder}/normalized/{state.replace('_', '-')}-{index:02d}.png"


def cyan_mask(image: Image.Image) -> tuple[int, int, bytearray]:
    rgba = image.convert("RGBA")
    width, height = rgba.size
    pixels = np.asarray(rgba, dtype=np.uint8)
    red = pixels[:, :, 0].astype(np.float32)
    green = pixels[:, :, 1].astype(np.float32)
    blue = pixels[:, :, 2].astype(np.float32)
    alpha = pixels[:, :, 3]
    mask = (alpha >= 160) & (blue >= 120) & (green >= 75) & (blue >= red * 1.35) & (green >= red * 1.05)
    return width, height, bytearray(mask.reshape(-1).astype(np.uint8).tobytes())


def skin_mask(image: Image.Image) -> tuple[int, int, bytearray]:
    rgba = image.convert("RGBA")
    width, height = rgba.size
    pixels = np.asarray(rgba, dtype=np.uint8)
    red = pixels[:, :, 0].astype(np.float32)
    green = pixels[:, :, 1].astype(np.float32)
    blue = pixels[:, :, 2].astype(np.float32)
    alpha = pixels[:, :, 3]
    mask = (
        (alpha >= 160)
        & (red >= 75)
        & (red <= 245)
        & (green >= 28)
        & (green <= 175)
        & (blue <= 125)
        & (red >= green * 1.22)
        & (green >= blue * 1.05)
    )
    return width, height, bytearray(mask.reshape(-1).astype(np.uint8).tobytes())


def components(width: int, height: int, mask: bytearray) -> list[dict[str, int | float]]:
    visited = bytearray(len(mask))
    found: list[dict[str, int | float]] = []
    for start, enabled in enumerate(mask):
        if not enabled or visited[start]:
            continue
        visited[start] = 1
        queue = deque([start])
        count = 0
        min_x = width
        min_y = height
        max_x = -1
        max_y = -1
        while queue:
            current = queue.popleft()
            y, x = divmod(current, width)
            count += 1
            min_x = min(min_x, x)
            min_y = min(min_y, y)
            max_x = max(max_x, x)
            max_y = max(max_y, y)
            for delta_x, delta_y in ((-1, -1), (0, -1), (1, -1), (-1, 0), (1, 0), (-1, 1), (0, 1), (1, 1)):
                neighbor_x = x + delta_x
                neighbor_y = y + delta_y
                if neighbor_x < 0 or neighbor_x >= width or neighbor_y < 0 or neighbor_y >= height:
                    continue
                neighbor = neighbor_y * width + neighbor_x
                if mask[neighbor] and not visited[neighbor]:
                    visited[neighbor] = 1
                    queue.append(neighbor)
        box_width = max_x - min_x + 1
        box_height = max_y - min_y + 1
        found.append(
            {
                "pixels": count,
                "minX": min_x,
                "minY": min_y,
                "maxX": max_x,
                "maxY": max_y,
                "width": box_width,
                "height": box_height,
                "aspect": round(box_width / max(1, box_height), 3),
            }
        )
    return found


def shoulder_jewel(path: Path) -> dict[str, int | float]:
    with Image.open(path) as image:
        width, height, mask = cyan_mask(image)
    candidates = [
        component
        for component in components(width, height, mask)
        if component["pixels"] >= 40
        and component["maxY"] < 980
        and 0.7 <= component["aspect"] <= 1.4
        and component["width"] >= 8
        and component["height"] >= 8
        and component["width"] <= 80
        and component["height"] <= 80
    ]
    if not candidates:
        raise RuntimeError(f"No upper-body cyan landmark found in {path}")
    return max(candidates, key=lambda component: (component["pixels"], component["width"] * component["height"]))


def sha256(path: Path) -> str:
    digest = hashlib.sha256()
    with path.open("rb") as stream:
        for chunk in iter(lambda: stream.read(1024 * 1024), b""):
            digest.update(chunk)
    return digest.hexdigest().upper()


def face_landmark(path: Path) -> dict[str, int | float]:
    with Image.open(path) as image:
        width, height, mask = skin_mask(image)
    candidates = [
        component
        for component in components(width, height, mask)
        if component["pixels"] >= 90
        and component["maxY"] < 1120
        and component["width"] >= 10
        and component["height"] >= 12
        and component["width"] <= 120
        and component["height"] <= 150
    ]
    if not candidates:
        raise RuntimeError(f"No face-scale landmark found in {path}")
    return max(candidates, key=lambda component: (component["pixels"], component["height"], component["width"]))


def make_contact_sheet() -> None:
    representatives = [
        ("idle 00", SAMPLES["idle_00"]),
        ("idle 01", SAMPLES["idle_01"]),
        ("walk fwd 00", SAMPLES["walk_forward_00"]),
        ("walk fwd 03", SAMPLES["walk_forward_03"]),
        ("walk fwd 07", SAMPLES["walk_forward_07"]),
        ("walk fwd 11", SAMPLES["walk_forward_11"]),
        ("walk fwd 15", SAMPLES["walk_forward_15"]),
        ("walk back 00", SAMPLES["walk_backward_00"]),
        ("walk back 03", SAMPLES["walk_backward_03"]),
        ("stand L 00", SAMPLES["standing_light_00"]),
        ("stand L 02 contact", SAMPLES["standing_light_02"]),
        ("stand M 00", SAMPLES["standing_medium_00"]),
        ("stand M 04 contact", SAMPLES["standing_medium_04"]),
        ("stand H 00", SAMPLES["standing_heavy_00"]),
        ("stand H 03 contact", SAMPLES["standing_heavy_03"]),
        ("stand H 06 recovery", SAMPLES["standing_heavy_06"]),
        ("crouch L 03", SAMPLES["crouching_light_03"]),
        ("crouch M 03", SAMPLES["crouching_medium_03"]),
        ("crouch H 00", SAMPLES["crouching_heavy_00"]),
        ("crouch H 03 contact", SAMPLES["crouching_heavy_03"]),
        ("crouch H 06 recovery", SAMPLES["crouching_heavy_06"]),
    ]
    columns = 5
    tile_width = 300
    tile_height = 310
    header_height = 90
    rows = (len(representatives) + columns - 1) // columns
    sheet = Image.new("RGB", (columns * tile_width, header_height + rows * tile_height), "#080d12")
    draw = ImageDraw.Draw(sheet)
    font = ImageFont.load_default()
    draw.text((18, 16), "LAMUH LEGACY V2 - FIXED-SCALE CROSS-CLIP REVIEW", fill="#f2b928", font=font)
    draw.text((18, 42), "Every tile uses the same 1280 x 1280 source viewport around the authored root. No per-frame fit-to-box scaling.", fill="#dbe5ee", font=font)
    source_viewport = (128, 180, 1408, 1460)
    for index, (label, path) in enumerate(representatives):
        column = index % columns
        row = index // columns
        x = column * tile_width
        y = header_height + row * tile_height
        draw.rectangle((x + 5, y + 5, x + tile_width - 5, y + tile_height - 5), outline="#55616d", width=2)
        draw.text((x + 14, y + 13), label, fill="#ffffff", font=font)
        with Image.open(path) as source:
            viewport = source.convert("RGBA").crop(source_viewport)
            viewport.thumbnail((270, 260), Image.Resampling.LANCZOS)
            panel = Image.new("RGBA", (270, 260), "#080d12")
            panel.alpha_composite(viewport, ((270 - viewport.width) // 2, 0))
            sheet.paste(panel.convert("RGB"), (x + 15, y + 40))
        root_x = x + 15 + round(((768 - source_viewport[0]) / (source_viewport[2] - source_viewport[0])) * 260)
        root_y = y + 40 + round(((1360 - source_viewport[1]) / (source_viewport[3] - source_viewport[1])) * 260)
        draw.line((root_x - 5, root_y, root_x + 5, root_y), fill="#f2b928", width=2)
        draw.line((root_x, root_y - 5, root_x, root_y + 5), fill="#f2b928", width=2)
    OUTPUT_ROOT.mkdir(parents=True, exist_ok=True)
    sheet.save(CONTACT_SHEET_PATH)


def visible_height(frame: dict) -> int:
    bounds = frame["visibleBounds"]
    return int(bounds["maxY"]) - int(bounds["minY"]) + 1


def make_standing_scale_overlay(light: dict, medium: dict) -> None:
    groups = [
        ("STANDING LIGHT - authored scale fixed to frame 00", light, "standing-light"),
        ("STANDING MEDIUM - frame 00 targeted; frames 01-07 preserved", medium, "standing-medium"),
    ]
    columns, tile_width, tile_height, header_height = 8, 250, 300, 110
    sheet = Image.new("RGB", (columns * tile_width, header_height + len(groups) * tile_height), "#080d12")
    draw = ImageDraw.Draw(sheet)
    font = ImageFont.load_default()
    draw.text((18, 16), "LAMUH LEGACY V2 - TARGETED STANDING SCALE VALIDATION", fill="#f2b928", font=font)
    draw.text((18, 42), "Same 1280 x 1280 source viewport and authored root in every tile; green bounds are measured alpha extents.", fill="#dbe5ee", font=font)
    draw.text((18, 66), "No runtime per-frame fit-to-box scaling. Medium frame 00 is the only corrected frame in that sequence.", fill="#dbe5ee", font=font)
    source_viewport = (128, 180, 1408, 1460)
    viewport_size = source_viewport[2] - source_viewport[0]
    panel_size = 220
    for group_index, (heading, report, prefix) in enumerate(groups):
        y0 = header_height + group_index * tile_height
        draw.text((18, y0 + 10), heading, fill="#ffffff", font=font)
        for frame in report["frames"]:
            index = int(frame["index"])
            x0 = index * tile_width
            draw.rectangle((x0 + 5, y0 + 32, x0 + tile_width - 5, y0 + tile_height - 5), outline="#d4a638" if index == 0 else "#55616d", width=3 if index == 0 else 1)
            height = visible_height(frame)
            draw.text((x0 + 14, y0 + 42), f"{index:02d}  scale {float(frame['authoredScale']):.4f}  visible H {height}", fill="#ffffff", font=font)
            path = ROOT / frame["normalizedPath"]
            with Image.open(path) as source:
                viewport = source.convert("RGBA").crop(source_viewport).resize((panel_size, panel_size), Image.Resampling.LANCZOS)
                sheet.paste(viewport.convert("RGB"), (x0 + 15, y0 + 66))
            bounds = frame["visibleBounds"]
            scale = panel_size / viewport_size
            bx0 = x0 + 15 + round((int(bounds["minX"]) - source_viewport[0]) * scale)
            by0 = y0 + 66 + round((int(bounds["minY"]) - source_viewport[1]) * scale)
            bx1 = x0 + 15 + round((int(bounds["maxX"]) - source_viewport[0]) * scale)
            by1 = y0 + 66 + round((int(bounds["maxY"]) - source_viewport[1]) * scale)
            draw.rectangle((bx0, by0, bx1, by1), outline="#5ad18a", width=2)
            root_x = x0 + 15 + round((768 - source_viewport[0]) * scale)
            root_y = y0 + 66 + round((1360 - source_viewport[1]) * scale)
            draw.line((root_x - 5, root_y, root_x + 5, root_y), fill="#f2b928", width=2)
            draw.line((root_x, root_y - 5, root_x, root_y + 5), fill="#f2b928", width=2)
    REFERENCE_OVERLAY_PATH.parent.mkdir(parents=True, exist_ok=True)
    sheet.save(REFERENCE_OVERLAY_PATH)


def build_targeted_scale_validation() -> dict:
    light = json.loads(STANDING_LIGHT_REPORT.read_text(encoding="utf-8-sig"))
    medium = json.loads(STANDING_MEDIUM_REPORT.read_text(encoding="utf-8-sig"))
    light_scales = [float(frame["authoredScale"]) for frame in light["frames"]]
    medium_heights = [visible_height(frame) for frame in medium["frames"]]
    medium_rest_median = float(np.median(medium_heights[1:]))
    medium_entry_delta = abs(float(medium_heights[0]) - medium_rest_median) / medium_rest_median
    checks = {
        "standingLightAuthoredScaleDriftAtMost0p005": round(max(light_scales) - min(light_scales), 6) <= 0.005,
        "standingLightUsesFixedRuntimeScale": light["normalization"]["perFrameRendererScale"] is False,
        "standingLightHasNoMeaningfulMagenta": all(int(frame["meaningfulMagentaPixelsRemaining"]) == 0 for frame in light["frames"]),
        "standingMediumWideEntryWithin3PercentOfPreservedFrames": medium_entry_delta <= 0.03,
        "standingMediumOnlyEntryHasTargetedBodyScaleCorrection": float(medium["frames"][0]["bodyScaleCorrection"]) == 0.69 and all(float(frame["bodyScaleCorrection"]) == 0.70 for frame in medium["frames"][1:]),
        "standingMediumUsesFixedRuntimeScale": medium["normalization"]["perFrameRendererScale"] is False,
        "standingMediumHasNoMeaningfulMagenta": all(int(frame["meaningfulMagentaPixelsRemaining"]) == 0 for frame in medium["frames"]),
    }
    make_standing_scale_overlay(light, medium)
    analysis = {
        "schemaVersion": "1.0.0",
        "subject": "lamuh_legacy_v2.targeted_standing_scale_analysis.v1",
        "standingLight": {
            "authoredScales": light_scales,
            "maximumAuthoredScaleDrift": round(max(light_scales) - min(light_scales), 6),
            "policy": "all frames match the first-frame authored anatomy scale within 0.005",
        },
        "standingMedium": {
            "visibleHeights": medium_heights,
            "wideEntryVisibleHeight": medium_heights[0],
            "preservedFramesMedianVisibleHeight": medium_rest_median,
            "wideEntryRelativeDelta": round(medium_entry_delta, 6),
            "entryBodyScaleCorrection": float(medium["frames"][0]["bodyScaleCorrection"]),
            "preservedBodyScaleCorrections": [float(frame["bodyScaleCorrection"]) for frame in medium["frames"][1:]],
            "policy": "repair frame 00 only; preserve frames 01-07",
        },
    }
    SOURCE_ANALYSIS_PATH.parent.mkdir(parents=True, exist_ok=True)
    SOURCE_ANALYSIS_PATH.write_text(json.dumps(analysis, indent=2) + "\n", encoding="utf-8")
    manifest = {
        "schemaVersion": "1.0.0",
        "subject": "lamuh_legacy_v2.user_scale_reference.v1",
        "referenceType": "user_screenshot_and_live_feedback",
        "feedback": "wide entry is bigger than the rest; the rest look good",
        "referencePath": str(USER_MEDIUM_REFERENCE),
        "referenceAvailableAtValidation": USER_MEDIUM_REFERENCE.exists(),
        "referenceSha256": sha256(USER_MEDIUM_REFERENCE) if USER_MEDIUM_REFERENCE.exists() else None,
        "derivedConstraint": "Standing Medium frame 00 must match the accepted scale of frames 01-07 without changing those accepted frames.",
        "candidateOnly": True,
    }
    REFERENCE_MANIFEST_PATH.write_text(json.dumps(manifest, indent=2) + "\n", encoding="utf-8")
    validation = {
        "schemaVersion": "1.0.0",
        "subject": "lamuh_legacy_v2.targeted_standing_scale_validation.v1",
        "status": "PASS" if all(checks.values()) else "FAIL",
        "candidateOnly": True,
        "deployable": False,
        "checks": checks,
        "evidence": {
            "referenceManifest": REFERENCE_MANIFEST_PATH.relative_to(ROOT).as_posix(),
            "sourceAnalysis": SOURCE_ANALYSIS_PATH.relative_to(ROOT).as_posix(),
            "referenceOverlay": REFERENCE_OVERLAY_PATH.relative_to(ROOT).as_posix(),
            "referenceOverlaySha256": sha256(REFERENCE_OVERLAY_PATH),
        },
        "humanReviewStatus": "AWAITING_TARGETED_STANDING_SCALE_REVIEW",
    }
    VALIDATION_PATH.write_text(json.dumps(validation, indent=2) + "\n", encoding="utf-8")
    if validation["status"] != "PASS":
        raise RuntimeError(f"Targeted standing scale validation failed: {checks}")
    return validation


def main() -> None:
    measurements = {}
    for name, path in SAMPLES.items():
        try:
            landmark = shoulder_jewel(path)
        except RuntimeError:
            measurements[name] = {"path": path.relative_to(ROOT).as_posix(), "frameSha256": sha256(path), "landmark": None, "status": "landmark_occluded_or_not_detected"}
            continue
        try:
            face = face_landmark(path)
        except RuntimeError:
            face = None
        measurements[name] = {"path": path.relative_to(ROOT).as_posix(), "frameSha256": sha256(path), "landmark": landmark, "faceLandmark": face, "status": "measured"}
    baseline = float(measurements["idle"]["landmark"]["height"])
    face_baseline = float(measurements["idle"]["faceLandmark"]["height"])
    for measurement in measurements.values():
        landmark = measurement["landmark"]
        if landmark is None:
            continue
        landmark["relativeToIdle"] = round(float(landmark["height"]) / baseline, 4)
        landmark["suggestedScaleToIdle"] = round(baseline / float(landmark["height"]), 4)
        face = measurement.get("faceLandmark")
        if face is not None:
            face["relativeToIdle"] = round(float(face["height"]) / face_baseline, 4)
            face["suggestedScaleToIdle"] = round(face_baseline / float(face["height"]), 4)
    reliable_prefixes = (
        "idle_",
        "walk_forward_",
        "walk_backward_",
        "standing_light_",
        "crouching_light_",
        "crouching_medium_",
        "crouching_heavy_",
    )
    reliable = {
        name: measurement
        for name, measurement in measurements.items()
        if name.startswith(reliable_prefixes) and measurement["landmark"] is not None
    }
    landmark_heights = [int(measurement["landmark"]["height"]) for measurement in reliable.values()]
    outliers = {
        name: int(measurement["landmark"]["height"])
        for name, measurement in reliable.items()
        if not 24 <= int(measurement["landmark"]["height"]) <= 38
    }
    make_contact_sheet()
    targeted_validation = build_targeted_scale_validation()
    report = {
        "schemaVersion": "1.0.0",
        "subject": "lamuh_legacy_v2.cross_clip_fixed_scale.candidate.v1",
        "status": "candidate-only",
        "deployable": False,
        "priorCombinedPlaytestStatus": "REJECTED_FOR_MOTION_REVISION",
        "scalePolicy": {
            "runtimeScale": "one fixed character scale",
            "perFrameRendererScale": False,
            "sourceNormalization": "pose-aware fixed-root normalization with recorded source-art camera correction only",
            "forwardWalkSource": "user-supplied 720x1280 24fps video; 16 evenly sampled full-resolution frames; one shared source-camera scale",
        },
        "validation": {
            "landmark": "cyan shoulder-jewel core height; perspective-aware range",
            "baselinePixels": baseline,
            "acceptedRangePixels": [24, 38],
            "reliableMeasuredFrameCount": len(reliable),
            "minimumPixels": min(landmark_heights),
            "maximumPixels": max(landmark_heights),
            "medianPixels": float(np.median(landmark_heights)),
            "outliers": outliers,
            "passed": not outliers,
            "occlusionPolicy": "Standing Medium and Standing Heavy include poses where the shoulder landmark is hidden; those clips require the same-viewport contact sheet review.",
        },
        "reviewArtifacts": {
            "sameViewportContactSheet": CONTACT_SHEET_PATH.relative_to(ROOT).as_posix(),
            "sameViewportContactSheetSha256": sha256(CONTACT_SHEET_PATH),
            "targetedStandingScaleValidation": VALIDATION_PATH.relative_to(ROOT).as_posix(),
            "targetedStandingScaleValidationStatus": targeted_validation["status"],
        },
        "measurements": measurements,
    }
    OUTPUT_ROOT.mkdir(parents=True, exist_ok=True)
    REPORT_PATH.write_text(json.dumps(report, indent=2) + "\n", encoding="utf-8")
    if outliers:
        raise RuntimeError(f"Cross-clip fixed-scale landmark audit failed: {outliers}")
    print(f"Cross-clip fixed-scale landmark audit passed: {len(reliable)} measured frames, {min(landmark_heights)}-{max(landmark_heights)} px.")
    print(f"Report: {REPORT_PATH}")
    print(f"Contact sheet: {CONTACT_SHEET_PATH}")
    print(f"Targeted standing scale validation: {VALIDATION_PATH}")


if __name__ == "__main__":
    main()
