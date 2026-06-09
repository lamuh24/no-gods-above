from __future__ import annotations

import json
import math
import shutil
from collections import deque
from pathlib import Path

from PIL import Image, ImageDraw, ImageFilter


ROOT = Path(__file__).resolve().parents[1]
SERIS_FINAL = ROOT / "assets" / "sprites" / "seris_final"
FRAMES_DIR = SERIS_FINAL / "frames"
SOURCE_BACKUP = SERIS_FINAL / "chain_workaround_source_frames"
MANIFEST_PATH = SERIS_FINAL / "seris_chain_attack_workaround_manifest.json"

CHROMA = (255, 0, 255)
CELL_W = 832
CELL_H = 448
ANCHOR_X = 320
BASELINE_Y = 406
BODY_PAD = 10
ALPHA_THRESHOLD = 22


SHEETS = [
    {
        "id": "sheet_3_ground_normals",
        "output": "seris_sheet_3_ground_normals_atlas.png",
        "cols": 8,
        "mode": "ground",
        "rows": [
            ("light_attack", "Light Attack", 4, "ground_light"),
            ("medium_attack", "Medium Attack", 8, "ground_medium"),
            ("heavy_attack", "Heavy Attack", 7, "ground_heavy"),
            ("launcher", "Launcher", 7, "launcher"),
        ],
    },
    {
        "id": "sheet_4_air_normals",
        "output": "seris_sheet_4_air_normals_atlas.png",
        "cols": 7,
        "mode": "air",
        "rows": [
            ("air_light", "Air Light", 4, "air_light"),
            ("air_medium", "Air Medium", 6, "air_medium"),
            ("air_heavy", "Air Heavy", 7, "air_heavy"),
            ("air_recovery", "Air Recovery / Fall Transition", 4, "air_recovery"),
        ],
    },
    {
        "id": "sheet_5_specials_body",
        "output": "seris_sheet_5_specials_body_atlas.png",
        "cols": 8,
        "mode": "ground",
        "rows": [
            ("chain_snare_start", "Chain Snare Start", 4, "chain_snare_start"),
            ("chain_snare_active", "Chain Snare Active", 6, "chain_snare_active"),
            ("chain_snare_recovery", "Chain Snare Recovery", 4, "chain_snare_recovery"),
            ("sanctum_sweep", "Sanctum Sweep", 8, "sanctum_sweep"),
            ("divine_recoil", "Divine Recoil", 8, "divine_recoil"),
            ("special_recovery", "Special Recovery / Return to Stance", 4, "special_recovery"),
        ],
    },
]


def ensure_source_backup() -> None:
    SOURCE_BACKUP.mkdir(parents=True, exist_ok=True)
    for spec in SHEETS:
        src = FRAMES_DIR / spec["id"]
        dst = SOURCE_BACKUP / spec["id"]
        if dst.exists():
            continue
        if not src.exists():
            raise FileNotFoundError(f"Missing Seris source frames: {src}")
        shutil.copytree(src, dst)


def transparentize(image: Image.Image) -> Image.Image:
    rgba = image.convert("RGBA")
    pixels = rgba.load()
    for y in range(rgba.height):
        for x in range(rgba.width):
            r, g, b, a = pixels[x, y]
            if a <= ALPHA_THRESHOLD or (r, g, b) == CHROMA:
                pixels[x, y] = (0, 0, 0, 0)
    return rgba


def is_opaque(pixel: tuple[int, int, int, int]) -> bool:
    r, g, b, a = pixel
    return a > ALPHA_THRESHOLD and (r, g, b) != CHROMA


def find_components(image: Image.Image) -> list[dict]:
    pixels = image.load()
    width, height = image.size
    seen = bytearray(width * height)
    components: list[dict] = []

    for sy in range(height):
        for sx in range(width):
            idx = sy * width + sx
            if seen[idx] or not is_opaque(pixels[sx, sy]):
                continue

            queue = deque([(sx, sy)])
            seen[idx] = 1
            area = 0
            min_x = max_x = sx
            min_y = max_y = sy
            points: list[tuple[int, int]] = []

            while queue:
                x, y = queue.popleft()
                points.append((x, y))
                area += 1
                min_x = min(min_x, x)
                max_x = max(max_x, x)
                min_y = min(min_y, y)
                max_y = max(max_y, y)

                for nx in (x - 1, x, x + 1):
                    for ny in (y - 1, y, y + 1):
                        if nx == x and ny == y:
                            continue
                        if nx < 0 or ny < 0 or nx >= width or ny >= height:
                            continue
                        nidx = ny * width + nx
                        if seen[nidx] or not is_opaque(pixels[nx, ny]):
                            continue
                        seen[nidx] = 1
                        queue.append((nx, ny))

            components.append(
                {
                    "area": area,
                    "bbox": (min_x, min_y, max_x + 1, max_y + 1),
                    "points": points,
                    "cx": (min_x + max_x + 1) / 2,
                    "cy": (min_y + max_y + 1) / 2,
                }
            )
    return components


def body_core(image: Image.Image) -> Image.Image:
    rgba = transparentize(image)
    components = find_components(rgba)
    if not components:
        return rgba

    width, height = rgba.size
    center_x = width / 2

    def score(component: dict) -> float:
        centrality = max(0, width - abs(component["cx"] - center_x))
        bottom_weight = component["bbox"][3] * 2.2
        return component["area"] * 5 + centrality + bottom_weight

    primary = max(components, key=score)
    px0, py0, px1, py1 = primary["bbox"]
    keep = Image.new("RGBA", rgba.size, (0, 0, 0, 0))
    src = rgba.load()
    dst = keep.load()

    for component in components:
        x0, y0, x1, y1 = component["bbox"]
        close_to_body = not (x1 < px0 - 18 or x0 > px1 + 18 or y1 < py0 - 18 or y0 > py1 + 18)
        if component is primary or close_to_body:
            for x, y in component["points"]:
                dst[x, y] = src[x, y]

    return keep


def content_bbox(image: Image.Image, pad: int = BODY_PAD) -> tuple[int, int, int, int] | None:
    pixels = image.load()
    min_x = min_y = 10**9
    max_x = max_y = -1
    for y in range(image.height):
        for x in range(image.width):
            if is_opaque(pixels[x, y]):
                min_x = min(min_x, x)
                min_y = min(min_y, y)
                max_x = max(max_x, x)
                max_y = max(max_y, y)
    if max_x < min_x:
        return None
    return (
        max(0, min_x - pad),
        max(0, min_y - pad),
        min(image.width, max_x + pad + 1),
        min(image.height, max_y + pad + 1),
    )


def load_source_frame(sheet_id: str, key: str, frame_index: int) -> Image.Image | None:
    path = SOURCE_BACKUP / sheet_id / key / f"{key}_{frame_index + 1:02d}.png"
    if path.exists():
        return Image.open(path).convert("RGBA")
    return None


def place_body(source: Image.Image | None, mode: str, fallback: Image.Image | None) -> tuple[Image.Image, dict]:
    cell = Image.new("RGBA", (CELL_W, CELL_H), (0, 0, 0, 0))
    source = body_core(source) if source is not None else None
    bbox = content_bbox(source) if source is not None else None
    if bbox is None and fallback is not None:
        source = fallback.copy()
        bbox = content_bbox(source)
    if bbox is None or source is None:
        return cell, {"empty": True, "contentBbox": None}

    source_w = bbox[2] - bbox[0]
    source_h = bbox[3] - bbox[1]
    if fallback is not None and ((source_w > 240 and source_h < 110) or (source_w < 170 and source_h < 95)):
        source = fallback.copy()
        bbox = content_bbox(source)
        if bbox is None:
            return cell, {"empty": True, "contentBbox": None}
        source_w = bbox[2] - bbox[0]
        source_h = bbox[3] - bbox[1]
        used_fallback_for_fragments = True
    else:
        used_fallback_for_fragments = False

    cropped = source.crop(bbox)
    max_w = 245
    max_h = 255 if mode == "ground" else 245
    scale = min(1.0, max_w / max(cropped.width, 1), max_h / max(cropped.height, 1))
    if scale < 1.0:
        cropped = cropped.resize(
            (max(1, round(cropped.width * scale)), max(1, round(cropped.height * scale))),
            Image.Resampling.LANCZOS,
        )

    x = round(ANCHOR_X - cropped.width / 2)
    x = max(0, min(CELL_W - cropped.width, x))
    if mode == "air":
        y = round(CELL_H * 0.48 - cropped.height / 2)
    else:
        y = BASELINE_Y - cropped.height
    y = max(0, min(CELL_H - cropped.height, y))
    cell.alpha_composite(cropped, (x, y))
    return cell, {
        "empty": False,
        "scale": round(scale, 4),
        "sourceBbox": list(bbox),
        "sourceSize": [source_w, source_h],
        "usedFallbackForFragments": used_fallback_for_fragments,
        "placedBbox": [x, y, x + cropped.width, y + cropped.height],
    }


def cubic_point(p0: tuple[float, float], p1: tuple[float, float], p2: tuple[float, float], p3: tuple[float, float], t: float) -> tuple[float, float]:
    mt = 1 - t
    x = mt**3 * p0[0] + 3 * mt**2 * t * p1[0] + 3 * mt * t**2 * p2[0] + t**3 * p3[0]
    y = mt**3 * p0[1] + 3 * mt**2 * t * p1[1] + 3 * mt * t**2 * p2[1] + t**3 * p3[1]
    return x, y


def sample_curve(points: tuple[tuple[float, float], tuple[float, float], tuple[float, float], tuple[float, float]], samples: int = 44) -> list[tuple[float, float]]:
    return [cubic_point(*points, i / (samples - 1)) for i in range(samples)]


def curve_length(points: list[tuple[float, float]]) -> float:
    return sum(math.hypot(points[i][0] - points[i - 1][0], points[i][1] - points[i - 1][1]) for i in range(1, len(points)))


def point_at_distance(points: list[tuple[float, float]], target: float) -> tuple[float, float]:
    if not points:
        return (0, 0)
    if target <= 0:
        return points[0]
    covered = 0.0
    for i in range(1, len(points)):
        prev = points[i - 1]
        cur = points[i]
        seg = math.hypot(cur[0] - prev[0], cur[1] - prev[1])
        if covered + seg >= target:
            ratio = (target - covered) / max(seg, 0.001)
            return (prev[0] + (cur[0] - prev[0]) * ratio, prev[1] + (cur[1] - prev[1]) * ratio)
        covered += seg
    return points[-1]


def draw_chain(cell: Image.Image, curve: tuple[tuple[float, float], tuple[float, float], tuple[float, float], tuple[float, float]], active: float = 0.0, tip_size: int = 10) -> dict:
    points = sample_curve(curve)
    draw_points = [(round(x), round(y)) for x, y in points]
    glow = Image.new("RGBA", cell.size, (0, 0, 0, 0))
    gd = ImageDraw.Draw(glow)
    gd.line(draw_points, fill=(48, 236, 219, 74), width=13, joint="curve")
    gd.line(draw_points, fill=(255, 220, 111, 46), width=20, joint="curve")
    glow = glow.filter(ImageFilter.GaussianBlur(3.2))
    cell.alpha_composite(glow)

    d = ImageDraw.Draw(cell)
    d.line(draw_points, fill=(18, 14, 22, 245), width=9, joint="curve")
    d.line(draw_points, fill=(216, 181, 73, 245), width=5, joint="curve")
    d.line(draw_points, fill=(45, 229, 213, 230), width=2, joint="curve")

    total = curve_length(points)
    spacing = 20
    offset = 3
    distance = offset
    while distance < total:
        x, y = point_at_distance(points, distance)
        ring = 5 if distance < total - 18 else 7
        d.ellipse((x - ring, y - ring * 0.65, x + ring, y + ring * 0.65), outline=(16, 12, 20, 240), width=3)
        d.ellipse((x - ring + 2, y - ring * 0.65 + 2, x + ring - 2, y + ring * 0.65 - 2), outline=(244, 212, 103, 230), width=2)
        distance += spacing

    tip = points[-1]
    prev = points[-4]
    angle = math.atan2(tip[1] - prev[1], tip[0] - prev[0])
    forward = (math.cos(angle), math.sin(angle))
    side = (-forward[1], forward[0])
    p1 = (tip[0] + forward[0] * tip_size * 1.45, tip[1] + forward[1] * tip_size * 1.45)
    p2 = (tip[0] - forward[0] * tip_size * 0.8 + side[0] * tip_size * 0.78, tip[1] - forward[1] * tip_size * 0.8 + side[1] * tip_size * 0.78)
    p3 = (tip[0] - forward[0] * tip_size * 0.8 - side[0] * tip_size * 0.78, tip[1] - forward[1] * tip_size * 0.8 - side[1] * tip_size * 0.78)
    d.polygon([p1, p2, p3], fill=(18, 14, 22, 255))
    d.polygon(
        [
            (p1[0] - forward[0] * 2, p1[1] - forward[1] * 2),
            (p2[0] + forward[0] * 2, p2[1] + forward[1] * 2),
            (p3[0] + forward[0] * 2, p3[1] + forward[1] * 2),
        ],
        fill=(255, 238, 171, 245),
    )

    if active > 0:
        pulse = min(1.0, active)
        r = 9 + 8 * pulse
        tx, ty = tip
        d.arc((tx - r, ty - r, tx + r, ty + r), -35, 240, fill=(255, 250, 205, round(210 * pulse)), width=3)
        d.line((tx - r * 0.7, ty, tx + r * 0.65, ty), fill=(48, 236, 219, round(190 * pulse)), width=2)
        d.line((tx, ty - r * 0.65, tx, ty + r * 0.65), fill=(255, 223, 111, round(160 * pulse)), width=2)

    ox, oy = points[0]
    d.ellipse((ox - 8, oy - 8, ox + 8, oy + 8), outline=(18, 14, 22, 255), width=4)
    d.ellipse((ox - 5, oy - 5, ox + 5, oy + 5), outline=(48, 236, 219, 235), width=2)
    return {"origin": [round(points[0][0]), round(points[0][1])], "tip": [round(points[-1][0]), round(points[-1][1])]}


def profile_values(profile: str, frame: int, count: int) -> tuple[tuple[float, float], tuple[float, float], tuple[float, float], tuple[float, float], float]:
    center = ANCHOR_X
    ground_hand = (center + 24, BASELINE_Y - 118)
    low_hand = (center + 20, BASELINE_Y - 74)
    air_hand = (center + 26, CELL_H * 0.48 - 28)
    t = frame / max(count - 1, 1)
    pulse = max(0.0, 1 - abs(t - 0.52) / 0.18)

    length_tables = {
        "ground_light": [42, 138, 188, 74],
        "ground_medium": [50, 128, 226, 334, 374, 282, 154, 70],
        "ground_heavy": [60, 172, 322, 426, 384, 240, 92],
        "chain_snare_start": [42, 84, 126, 172],
        "chain_snare_active": [178, 286, 414, 448, 360, 218],
        "chain_snare_recovery": [278, 176, 86, 42],
        "special_recovery": [120, 86, 56, 34],
    }

    if profile in length_tables:
        table = length_tables[profile]
        length = table[min(frame, len(table) - 1)]
        o = ground_hand
        dip = -18 if profile != "ground_light" else -8
        p0 = o
        p1 = (o[0] + length * 0.3, o[1] + dip - 24 * math.sin(t * math.pi))
        p2 = (o[0] + length * 0.72, o[1] - dip * 0.2 + 14 * math.sin(t * math.pi))
        p3 = (o[0] + length, o[1] - 8 * math.sin(t * math.pi))
        return p0, p1, p2, p3, pulse

    if profile == "launcher":
        heights = [36, 90, 176, 256, 230, 154, 70]
        reach = [32, 70, 118, 178, 150, 92, 42]
        h = heights[min(frame, len(heights) - 1)]
        r = reach[min(frame, len(reach) - 1)]
        o = (center + 10, BASELINE_Y - 64)
        return o, (o[0] - 28, o[1] - h * 0.28), (o[0] + r * 0.5, o[1] - h * 0.88), (o[0] + r, o[1] - h), pulse

    if profile == "sanctum_sweep":
        table = [44, 112, 210, 330, 404, 334, 190, 70]
        length = table[min(frame, len(table) - 1)]
        o = low_hand
        return o, (o[0] + length * 0.22, BASELINE_Y - 28), (o[0] + length * 0.72, BASELINE_Y - 34), (o[0] + length, BASELINE_Y - 45), pulse

    if profile == "divine_recoil":
        table = [72, 170, 304, 426, 438, 314, 172, 64]
        length = table[min(frame, len(table) - 1)]
        o = (center + 10, BASELINE_Y - 104)
        sag = 28 if frame in (3, 4, 5) else 12
        return o, (o[0] + length * 0.32, o[1] - 18), (o[0] + length * 0.66, o[1] + sag), (o[0] + length, o[1] - 8), pulse

    if profile == "air_light":
        table = [42, 126, 176, 70]
        length = table[min(frame, len(table) - 1)]
        o = air_hand
        return o, (o[0] + length * 0.35, o[1] - 16), (o[0] + length * 0.78, o[1] - 4), (o[0] + length, o[1] + 8), pulse

    if profile == "air_medium":
        table = [54, 150, 260, 338, 245, 92]
        length = table[min(frame, len(table) - 1)]
        o = air_hand
        return o, (o[0] + length * 0.24, o[1] - 58), (o[0] + length * 0.72, o[1] - 36), (o[0] + length, o[1] - 6), pulse

    if profile == "air_heavy":
        table = [58, 150, 274, 356, 322, 190, 82]
        length = table[min(frame, len(table) - 1)]
        o = (center + 18, CELL_H * 0.48 - 38)
        return o, (o[0] + length * 0.24, o[1] + 30), (o[0] + length * 0.64, o[1] + 112), (o[0] + length, o[1] + 138), pulse

    o = air_hand if profile == "air_recovery" else ground_hand
    length = 72 * (1 - t)
    return o, (o[0] + length * 0.4, o[1] - 18), (o[0] + length * 0.8, o[1] - 2), (o[0] + length, o[1]), 0.0


def edge_opaque_count(image: Image.Image) -> int:
    pixels = image.load()
    count = 0
    for x in range(image.width):
        if is_opaque(pixels[x, 0]):
            count += 1
        if is_opaque(pixels[x, image.height - 1]):
            count += 1
    for y in range(image.height):
        if is_opaque(pixels[0, y]):
            count += 1
        if is_opaque(pixels[image.width - 1, y]):
            count += 1
    return count


def opaque_magenta_count(image: Image.Image) -> int:
    return sum(1 for pixel in image.getdata() if pixel[3] > ALPHA_THRESHOLD and pixel[:3] == CHROMA)


def scrub_exact_chroma(image: Image.Image) -> Image.Image:
    rgba = image.convert("RGBA")
    pixels = rgba.load()
    for y in range(rgba.height):
        for x in range(rgba.width):
            r, g, b, a = pixels[x, y]
            if a > ALPHA_THRESHOLD and (r, g, b) == CHROMA:
                pixels[x, y] = (0, 0, 0, 0)
    return rgba


def rebuild_sheet(spec: dict) -> dict:
    rows = spec["rows"]
    cols = spec["cols"]
    atlas = Image.new("RGBA", (cols * CELL_W, len(rows) * CELL_H), (0, 0, 0, 0))
    sheet_meta = []
    warnings = []

    for row_index, (key, label, frame_count, profile) in enumerate(rows):
        row_out = FRAMES_DIR / spec["id"] / key
        row_out.mkdir(parents=True, exist_ok=True)
        fallback: Image.Image | None = None
        frame_entries = []

        for frame_index in range(frame_count):
            source = load_source_frame(spec["id"], key, frame_index)
            mode = "air" if spec["mode"] == "air" else "ground"
            placed, body_meta = place_body(source, mode, fallback)
            if not body_meta.get("empty"):
                fallback = placed.copy()

            curve = profile_values(profile, frame_index, frame_count)
            chain_meta = draw_chain(placed, curve[:4], curve[4], tip_size=9 if "light" in profile else 12)
            placed = scrub_exact_chroma(placed)
            path = row_out / f"{key}_{frame_index + 1:02d}.png"
            placed.save(path)
            atlas.alpha_composite(placed, (frame_index * CELL_W, row_index * CELL_H))
            frame_entries.append(
                {
                    "frame": frame_index + 1,
                    "file": path.relative_to(ROOT).as_posix(),
                    "body": body_meta,
                    "chain": chain_meta,
                    "edgeOpaquePixels": edge_opaque_count(placed),
                    "opaqueMagentaPixels": opaque_magenta_count(placed),
                }
            )

        if fallback is not None:
            for frame_index in range(frame_count, cols):
                atlas.alpha_composite(fallback, (frame_index * CELL_W, row_index * CELL_H))

        sheet_meta.append(
            {
                "row": row_index + 1,
                "animation": key,
                "label": label,
                "requestedFrames": frame_count,
                "atlasCols": cols,
                "chainProfile": profile,
                "frames": frame_entries,
            }
        )

    output_path = SERIS_FINAL / spec["output"]
    atlas = scrub_exact_chroma(atlas)
    atlas.save(output_path)
    validation = {
        "size": list(atlas.size),
        "cols": cols,
        "rows": len(rows),
        "cell": [CELL_W, CELL_H],
        "baselineY": BASELINE_Y,
        "edgeOpaquePixels": edge_opaque_count(atlas),
        "opaqueMagentaPixels": opaque_magenta_count(atlas),
    }
    if validation["edgeOpaquePixels"]:
        warnings.append("Atlas has opaque pixels on outer canvas edge.")
    if validation["opaqueMagentaPixels"]:
        warnings.append("Atlas has remaining opaque #FF00FF pixels.")

    return {
        "sheet": spec["id"],
        "output": output_path.relative_to(ROOT).as_posix(),
        "rows": sheet_meta,
        "validation": validation,
        "warnings": warnings,
    }


def main() -> None:
    ensure_source_backup()
    manifest = {
        "character": "Seris",
        "purpose": "Large-cell offensive atlas workaround with embedded physical chain motion. Sheet 8 VFX remains support/accent only.",
        "cell": {"width": CELL_W, "height": CELL_H, "anchorX": ANCHOR_X, "baselineY": BASELINE_Y},
        "sourceBackup": SOURCE_BACKUP.relative_to(ROOT).as_posix(),
        "sheets": [],
    }
    for spec in SHEETS:
        manifest["sheets"].append(rebuild_sheet(spec))
    MANIFEST_PATH.write_text(json.dumps(manifest, indent=2) + "\n", encoding="utf-8")
    print(json.dumps({"manifest": MANIFEST_PATH.relative_to(ROOT).as_posix(), "sheets": [s["sheet"] for s in manifest["sheets"]]}, indent=2))


if __name__ == "__main__":
    main()
