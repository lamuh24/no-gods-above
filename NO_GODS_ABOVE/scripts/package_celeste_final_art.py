from collections import deque
import json
from pathlib import Path
import shutil
from statistics import median

import numpy as np
from scipy import ndimage
from PIL import Image, ImageDraw


ROOT = Path(__file__).resolve().parents[1]
OUT_DIR = ROOT / "assets" / "sprites" / "celeste_final"
PORTRAIT_DIR = ROOT / "assets" / "sprites" / "portraits"
GENERATED_DIR = ROOT / "assets" / "sprites" / "celeste_generated"
PRODUCTION_DIR = ROOT / "assets" / "sprites" / "celeste_production_sources"
PHASE = "phase5_4_1"


SHEETS = [
    {
        "name": "sheet_1_body_basics",
        "source": PRODUCTION_DIR / "celeste_production_sheet_1_locomotion_body_basics.png",
        "source_copy": "celeste_sheet_1_body_basics_source.png",
        "out": "celeste_sheet_1_body_basics_atlas.png",
        "rows": 7,
        "cols": 6,
        "frame_counts": [6, 6, 6, 3, 3, 3, 3],
        "cell": (768, 512),
        "baseline": 438,
        "content_x": 0,
        "trim_top": 0,
        "layout": "left_grid",
        "body": True,
        "targets": [315, 315, 315, 280, 280, 280, 305],
        "air_rows": [4, 5],
        "row_names": ["idle", "walk_forward", "walk_back", "crouch_jump_start", "jump_up", "fall", "landing"],
    },
    {
        "name": "sheet_2_ground_normals",
        "source": PRODUCTION_DIR / "celeste_production_sheet_2_ground_attacks.png",
        "source_copy": "celeste_sheet_2_ground_normals_source.png",
        "out": "celeste_sheet_2_ground_normals_atlas.png",
        "rows": 9,
        "cols": 4,
        "frame_counts": [4] * 9,
        "cell": (896, 544),
        "baseline": 462,
        "content_x": 0,
        "trim_top": 0,
        "layout": "left_grid",
        "body": True,
        "targets": [315] * 9,
        "air_rows": [],
        "row_names": ["neutral_light", "neutral_medium", "neutral_heavy", "forward_light", "forward_medium", "forward_heavy", "back_light", "back_medium", "back_heavy"],
    },
    {
        "name": "sheet_3_up_air_attacks",
        "source": PRODUCTION_DIR / "celeste_production_sheet_3_up_air_attacks.png",
        "source_copy": "celeste_sheet_3_up_air_attacks_source.png",
        "out": "celeste_sheet_3_up_air_attacks_atlas.png",
        "rows": 6,
        "cols": 4,
        "frame_counts": [4] * 6,
        "cell": (768, 576),
        "baseline": 488,
        "content_x": 0,
        "trim_top": 0,
        "layout": "left_grid",
        "body": True,
        "targets": [315, 320, 325, 300, 305, 315],
        "air_rows": [3, 4, 5],
        "row_names": ["up_light", "up_medium_down_heavy", "up_heavy", "jump_light", "jump_medium", "jump_heavy"],
    },
    {
        "name": "sheet_4_specials",
        "source": PRODUCTION_DIR / "celeste_production_sheet_4_special_moves.png",
        "source_copy": "celeste_sheet_4_specials_source.png",
        "out": "celeste_sheet_4_specials_atlas.png",
        "rows": 6,
        "cols": 4,
        "frame_counts": [4] * 6,
        "cell": (1280, 576),
        "baseline": 488,
        "content_x": 0,
        "trim_top": 0,
        "layout": "left_grid",
        "body": True,
        "targets": [315, 315, 318, 330, 318, 318],
        "air_rows": [0, 1],
        "row_names": ["fa_strobe_air_dash_forward", "air_dash_back", "sol_ovation", "la_seraph_waltz", "ti_encore", "special_recovery"],
    },
    {
        "name": "sheet_5_defense_reactions",
        "source": PRODUCTION_DIR / "celeste_production_sheet_5_reactions_defense_ko_victory.png",
        "source_copy": "celeste_sheet_5_defense_reactions_source.png",
        "out": "celeste_sheet_5_defense_reactions_atlas.png",
        "rows": 8,
        "cols": 5,
        "frame_counts": [4, 3, 4, 4, 4, 5, 4, 5],
        "cell": (1536, 544),
        "baseline": 438,
        "content_x": 0,
        "trim_top": 0,
        "layout": "left_grid",
        "body": True,
        "targets": [318, 305, 315, 290, 295, 315, 300, 318],
        "air_rows": [4],
        "row_names": ["block_guard", "damaged_light", "medium_heavy_hitstun", "knockback", "launch_air_hitstun", "knockdown_get_up", "ko_death", "victory"],
    },
    {
        "name": "sheet_6_octava_body",
        "source": PRODUCTION_DIR / "celeste_production_sheet_6_octava_body.png",
        "source_copy": "celeste_sheet_6_octava_body_source.png",
        "out": "celeste_sheet_6_octava_body_atlas.png",
        "rows": 2,
        "cols": 5,
        "frame_counts": [5, 5],
        "cell": (896, 768),
        "baseline": 690,
        "content_x": 0,
        "trim_top": 0,
        "layout": "spread_by_count",
        "body": True,
        "targets": [440, 540],
        "air_rows": [],
        "row_names": ["octava_startup", "octava_fire"],
    },
    {
        "name": "sheet_7_detached_vfx",
        "source": PRODUCTION_DIR / "celeste_production_sheet_7_detached_vfx_atlas.png",
        "source_copy": "celeste_sheet_7_detached_vfx_source.png",
        "out": "celeste_sheet_7_detached_vfx_runtime_atlas.png",
        "rows": 10,
        "cols": 7,
        "frame_counts": [5, 5, 5, 5, 6, 6, 5, 5, 7, 6],
        "cell": (768, 384),
        "baseline": 0,
        "content_x": 0,
        "trim_top": 0,
        "layout": "spread_by_count",
        "body": False,
        "targets": [150, 150, 155, 150, 145, 150, 135, 150, 120, 190],
        "row_names": ["DO_hand_impact", "RE_slash", "MI_resonance", "FA_afterimage", "SOL_projectile", "LA_barrier", "TI_trap_marker", "TI_detonation", "Octava_spirits", "Octava_beam"],
    },
]


def is_bg_candidate(r, g, b, a=255):
    if a <= 8:
        return True
    if r > 175 and b > 160 and g < 90:
        return True
    spread = max(r, g, b) - min(r, g, b)
    avg = (r + g + b) / 3
    if avg > 168 and spread < 26:
        return True
    if min(r, g, b) > 232 and spread < 42:
        return True
    return False


def flood_alpha(crop):
    img = crop.convert("RGBA")
    arr = np.array(img)
    rgb = arr[:, :, :3].astype(np.int16)
    alpha = arr[:, :, 3]
    mn = rgb.min(axis=2)
    mx = rgb.max(axis=2)
    spread = mx - mn
    avg = rgb.mean(axis=2)
    magenta = (rgb[:, :, 0] > 175) & (rgb[:, :, 1] < 90) & (rgb[:, :, 2] > 160)
    pale_checker = (avg > 168) & (spread < 26)
    near_white = (mn > 232) & (spread < 42)
    bg_mask = (alpha <= 8) | magenta | pale_checker | near_white

    seed = np.zeros(bg_mask.shape, dtype=bool)
    seed[0, :] = bg_mask[0, :]
    seed[-1, :] = bg_mask[-1, :]
    seed[:, 0] = bg_mask[:, 0]
    seed[:, -1] = bg_mask[:, -1]
    connected_bg = ndimage.binary_propagation(seed, mask=bg_mask)
    arr[connected_bg, 3] = 0
    return Image.fromarray(arr, "RGBA").copy()


def remove_small_text_specks(img, min_area=520):
    px = img.load()
    w, h = img.size
    seen = set()
    for y in range(h):
        for x in range(w):
            if (x, y) in seen or px[x, y][3] <= 8:
                continue
            stack = [(x, y)]
            comp = []
            seen.add((x, y))
            while stack:
                cx, cy = stack.pop()
                comp.append((cx, cy))
                for nx, ny in ((cx - 1, cy), (cx + 1, cy), (cx, cy - 1), (cx, cy + 1)):
                    if nx < 0 or ny < 0 or nx >= w or ny >= h or (nx, ny) in seen:
                        continue
                    if px[nx, ny][3] <= 8:
                        continue
                    seen.add((nx, ny))
                    stack.append((nx, ny))
            if len(comp) >= min_area:
                continue
            xs = [p[0] for p in comp]
            ys = [p[1] for p in comp]
            bw = max(xs) - min(xs) + 1
            bh = max(ys) - min(ys) + 1
            if bw <= 130 and bh <= 44:
                for cx, cy in comp:
                    r, g, b, _ = px[cx, cy]
                    px[cx, cy] = (r, g, b, 0)
    return img


def content_bbox(img):
    alpha = img.getchannel("A")
    return alpha.getbbox()


def fill_empty_row_frames(frames, audits):
    nonempty = [index for index, frame in enumerate(frames) if content_bbox(frame)]
    if not nonempty:
        return frames, audits
    fixed = list(frames)
    for index, frame in enumerate(frames):
        if content_bbox(frame):
            continue
        nearest = min(nonempty, key=lambda source_index: abs(source_index - index))
        fixed[index] = frames[nearest].copy()
        audits[index]["filledFromFrame"] = nearest
        audits[index]["emptyFrameRepair"] = "nearest_clean_frame_hold"
    return fixed, audits


def strengthen_body_alpha(img):
    """Make body sheets read as solid sprites after chroma extraction."""
    arr = np.array(img)
    alpha = arr[:, :, 3]
    arr[:, :, 3] = np.where(
        alpha <= 10,
        0,
        np.where(alpha >= 56, 255, np.minimum(220, (alpha.astype(np.float32) * 2.8).astype(np.uint8))),
    )
    return Image.fromarray(arr, "RGBA").copy()


def component_records(img, alpha_threshold=12, min_area=24):
    arr = np.array(img)
    mask = arr[:, :, 3] > alpha_threshold
    labeled, count = ndimage.label(mask)
    objects = ndimage.find_objects(labeled)
    records = []
    h, w = mask.shape
    for label, slices in enumerate(objects, start=1):
        if slices is None:
            continue
        ys, xs = slices
        area = int((labeled[slices] == label).sum())
        if area < min_area:
            continue
        x0, y0 = int(xs.start), int(ys.start)
        x1, y1 = int(xs.stop), int(ys.stop)
        comp_mask = labeled[slices] == label
        comp_pixels = arr[slices][comp_mask]
        comp_rgb = comp_pixels[:, :3].astype(np.int16)
        comp_alpha = comp_pixels[:, 3]
        brightness = comp_rgb.mean(axis=1)
        darkness_ratio = float(((brightness < 118) & (comp_alpha > alpha_threshold)).sum() / max(1, area))
        pale_ratio = float(((brightness > 190) & (comp_alpha > alpha_threshold)).sum() / max(1, area))
        records.append({
            "label": label,
            "area": area,
            "bbox": [x0, y0, x1 - x0, y1 - y0],
            "center": [(x0 + x1) / 2, (y0 + y1) / 2],
            "darknessRatio": darkness_ratio,
            "paleRatio": pale_ratio,
            "touchesEdge": x0 <= 1 or y0 <= 1 or x1 >= w - 1 or y1 >= h - 1,
        })
    records.sort(key=lambda item: item["area"], reverse=True)
    return arr, labeled, records


def rect_intersects(a, b):
    ax0, ay0, aw, ah = a
    bx0, by0, bw, bh = b
    ax1, ay1 = ax0 + aw, ay0 + ah
    bx1, by1 = bx0 + bw, by0 + bh
    return ax0 < bx1 and ax1 > bx0 and ay0 < by1 and ay1 > by0


def expand_bbox(bbox, pad_x, pad_y):
    x, y, w, h = bbox
    return [x - pad_x, y - pad_y, w + pad_x * 2, h + pad_y * 2]


def score_body_component(record, frame_w, frame_h, air=False):
    cx, cy = record["center"]
    _x0, _y0, bw, bh = record["bbox"]
    cx_mid = frame_w / 2
    cy_mid = frame_h * (0.50 if air else 0.56)
    center_x = 1 - min(1, abs(cx - cx_mid) / max(1, cx_mid))
    center_y = 1 - min(1, abs(cy - cy_mid) / max(1, frame_h * 0.62))
    lower = min(1, cy / max(1, frame_h))
    humanoid_height = min(1, bh / max(1, frame_h * 0.46))
    humanoid_width = 1 - min(1, max(0, bw - frame_w * 0.32) / max(1, frame_w * 0.34))
    left_body_bias = 1 - min(1, max(0, cx - frame_w * 0.58) / max(1, frame_w * 0.34))
    darkness = record.get("darknessRatio", 0)
    pale = record.get("paleRatio", 0)
    body_material = 0.72 + darkness * 1.05 - pale * 0.22
    edge_penalty = 0.28 if record["touchesEdge"] else 1
    return record["area"] * (0.44 + center_x * 0.34 + left_body_bias * 0.22) * (0.48 + center_y * 0.18 + lower * 0.12 + humanoid_height * 0.24 + humanoid_width * 0.16) * body_material * edge_penalty


def clean_components(img, spec, row, frame):
    arr, labeled, records = component_records(img)
    audit = {
        "componentsBefore": len(records),
        "componentsAfter": len(records),
        "removedComponents": [],
        "removedArea": 0,
        "bodySeed": None,
    }
    if not records:
        return img, audit

    h, w = arr.shape[:2]
    keep_labels = set()

    if spec.get("body"):
        air = row in set(spec.get("air_rows", []))
        seed = max(records, key=lambda record: score_body_component(record, w, h, air=air))
        keep_labels.add(seed["label"])
        audit["bodySeed"] = {
            "label": seed["label"],
            "area": seed["area"],
            "bbox": seed["bbox"],
            "center": seed["center"],
            "darknessRatio": seed.get("darknessRatio", 0),
            "paleRatio": seed.get("paleRatio", 0),
        }
        sx, sy = seed["center"]
        seed_area = seed["area"]
        halo_x = max(44, int(w * (0.22 if spec["name"] == "sheet_6_octava_body" else 0.16)))
        halo_y = max(40, int(h * (0.24 if spec["name"] == "sheet_6_octava_body" else 0.18)))
        halo = expand_bbox(seed["bbox"], halo_x, halo_y)
        central_band = [w * 0.18, h * 0.06, w * 0.64, h * 0.88]

        for record in records:
            if record["label"] in keep_labels:
                continue
            cx, cy = record["center"]
            dx = abs(cx - sx)
            dy = abs(cy - sy)
            close_to_body = rect_intersects(record["bbox"], halo) or (dx <= w * 0.23 and dy <= h * 0.25)
            central_large = record["area"] >= seed_area * 0.12 and rect_intersects(record["bbox"], central_band)
            likely_attack_effect = record.get("paleRatio", 0) > 0.48 and record.get("darknessRatio", 0) < 0.18
            attached_small = record["area"] >= max(70, seed_area * 0.006) and close_to_body
            meaningful_inside_cell = record["area"] >= max(120, seed_area * 0.02) and not record["touchesEdge"]
            if (attached_small or central_large or likely_attack_effect or meaningful_inside_cell) and not (record["touchesEdge"] and not close_to_body):
                keep_labels.add(record["label"])
    else:
        seed = max(records, key=lambda record: record["area"] * (0.35 if record["touchesEdge"] else 1))
        seed_area = seed["area"]
        keep_labels.add(seed["label"])
        for record in records:
            if record["label"] in keep_labels:
                continue
            big_enough = record["area"] >= max(50, seed_area * 0.018)
            edge_sliver = record["touchesEdge"] and record["area"] < seed_area * 0.22
            if big_enough and not edge_sliver:
                keep_labels.add(record["label"])

    for record in records:
        if record["label"] in keep_labels:
            continue
        mask = labeled == record["label"]
        arr[mask, 3] = 0
        audit["removedComponents"].append({
            "area": record["area"],
            "bbox": record["bbox"],
            "touchesEdge": record["touchesEdge"],
        })
        audit["removedArea"] += record["area"]

    audit["componentsAfter"] = len(keep_labels)
    return Image.fromarray(arr, "RGBA").copy(), audit


def extract_frame(src, spec, row, frame):
    w, h = src.size
    row_h = h / spec["rows"]
    y0 = int(row * row_h)
    y1 = int((row + 1) * row_h)
    content_x = spec["content_x"]
    if spec["layout"] == "spread_by_count":
        source_cols = spec["frame_counts"][row]
    else:
        source_cols = spec["cols"]
    col_w = (w - content_x) / source_cols
    x0 = int(content_x + frame * col_w)
    x1 = int(content_x + (frame + 1) * col_w)
    y0 = max(0, y0 + int(spec.get("trim_top", 0)))
    y1 = min(h, y1)
    source_rect = [x0, y0, x1 - x0, y1 - y0]
    cleaned = flood_alpha(src.crop((x0, y0, x1, y1)))
    cleaned = remove_small_text_specks(cleaned)
    if spec.get("body"):
        cleaned = strengthen_body_alpha(cleaned)
    cleaned, component_audit = clean_components(cleaned, spec, row, frame)
    component_audit["sourceRect"] = source_rect
    return cleaned, component_audit


def extract_source_cell_for_debug(src, spec, row, frame):
    w, h = src.size
    row_h = h / spec["rows"]
    y0 = int(row * row_h)
    y1 = int((row + 1) * row_h)
    content_x = spec["content_x"]
    source_cols = spec["frame_counts"][row] if spec["layout"] == "spread_by_count" else spec["cols"]
    col_w = (w - content_x) / source_cols
    x0 = int(content_x + frame * col_w)
    x1 = int(content_x + (frame + 1) * col_w)
    y0 = max(0, y0 + int(spec.get("trim_top", 0)))
    y1 = min(h, y1)
    raw = src.crop((x0, y0, x1, y1))
    cleaned = flood_alpha(raw)
    cleaned = remove_small_text_specks(cleaned)
    if spec.get("body"):
        cleaned = strengthen_body_alpha(cleaned)
    return cleaned


def body_anchor_metrics(cell):
    arr = np.array(cell)
    alpha = arr[:, :, 3]
    rgb = arr[:, :, :3].astype(np.int16)
    brightness = rgb.mean(axis=2)
    h, w = alpha.shape
    roi = np.zeros_like(alpha, dtype=bool)
    roi[int(h * 0.25):int(h * 0.96), int(w * 0.20):int(w * 0.78)] = True
    ink = (alpha > 20) & roi
    dark = ink & (brightness < 145)
    return {
        "bodyRegionInk": int(ink.sum()),
        "bodyRegionDarkInk": int(dark.sum()),
        "bodyRegionDarkRatio": float(dark.sum() / max(1, ink.sum())),
    }


def analyze_body_presence(cell, spec, row):
    arr, labeled, records = component_records(cell, min_area=80)
    metrics = body_anchor_metrics(cell)
    result = {
        **metrics,
        "componentCount": len(records),
        "bodyPresent": False,
        "bodyComponent": None,
        "vfxComponent": None,
        "warnings": [],
    }
    if not records:
        result["warnings"].append("no_nontransparent_components")
        return result

    air = row in set(spec.get("air_rows", []))
    body = max(records, key=lambda record: score_body_component(record, cell.width, cell.height, air=air))
    result["bodyComponent"] = {
        "area": body["area"],
        "bbox": body["bbox"],
        "center": body["center"],
        "darknessRatio": body.get("darknessRatio", 0),
        "paleRatio": body.get("paleRatio", 0),
        "score": score_body_component(body, cell.width, cell.height, air=air),
    }
    vfx_records = [record for record in records if record["label"] != body["label"]]
    if vfx_records:
        vfx = max(vfx_records, key=lambda record: record["area"])
        result["vfxComponent"] = {
            "area": vfx["area"],
            "bbox": vfx["bbox"],
            "center": vfx["center"],
            "darknessRatio": vfx.get("darknessRatio", 0),
            "paleRatio": vfx.get("paleRatio", 0),
        }

    _x, _y, bw, bh = body["bbox"]
    has_body_height = bh >= max(58, int(cell.height * 0.12))
    has_body_dark_ink = metrics["bodyRegionDarkInk"] >= 3200
    not_pale_only = body.get("darknessRatio", 0) >= 0.055 or metrics["bodyRegionDarkRatio"] >= 0.11
    result["bodyPresent"] = bool(has_body_height and has_body_dark_ink and not_pale_only)
    if not has_body_height:
        result["warnings"].append("body_component_too_short")
    if not has_body_dark_ink:
        result["warnings"].append("expected_body_region_has_low_dark_ink")
    if not not_pale_only:
        result["warnings"].append("selected_component_looks_vfx_or_pale_only")
    return result


def frame_anchor(frame, bbox, grounded=True):
    px = frame.load()
    left, top, right, bottom = bbox
    bw = right - left
    bh = bottom - top
    xs = []
    ys = []
    threshold = 42
    if grounded:
      band_top = max(top, bottom - max(22, int(bh * 0.25)))
      for y in range(band_top, bottom):
          for x in range(left, right):
              r, g, b, a = px[x, y]
              if a <= threshold:
                  continue
              if r + g + b > 730:
                  continue
              xs.append(x)
      if xs:
          return int(median(xs)), bottom
      return left + bw // 2, bottom

    for y in range(top, bottom, 2):
        for x in range(left, right, 2):
            if px[x, y][3] > threshold:
                xs.append(x)
                ys.append(y)
    if xs and ys:
        return int(median(xs)), int(median(ys))
    return left + bw // 2, top + bh // 2


def row_scale_for(frames, spec, row):
    cw, ch = spec["cell"]
    bboxes = [content_bbox(frame) for frame in frames]
    bboxes = [bbox for bbox in bboxes if bbox]
    if not bboxes:
        return 1.0
    max_bw = max(bbox[2] - bbox[0] for bbox in bboxes)
    max_bh = max(bbox[3] - bbox[1] for bbox in bboxes)
    if spec.get("body"):
        max_w = cw - 34
        max_h = min(spec["targets"][row], ch - 42)
    else:
        max_w = cw - 20
        max_h = spec["targets"][row]
    return min(max_w / max(1, max_bw), max_h / max(1, max_bh), 3.5)


def place_into_cell(frame, cell_size, baseline, scale, body=True, grounded=True):
    cw, ch = cell_size
    cell = Image.new("RGBA", (cw, ch), (0, 0, 0, 0))
    bbox = content_bbox(frame)
    if not bbox:
        return cell, None
    cut = frame.crop(bbox)
    bw, bh = cut.size
    nw = max(1, int(round(bw * scale)))
    nh = max(1, int(round(bh * scale)))
    cut = cut.resize((nw, nh), Image.LANCZOS)
    ax, ay = frame_anchor(frame, bbox, grounded=grounded)
    local_ax = (ax - bbox[0]) * scale
    local_ay = (ay - bbox[1]) * scale
    if body:
        if grounded:
            x = int(round(cw / 2 - local_ax))
            y = int(round(baseline - local_ay))
        else:
            x = int(round(cw / 2 - local_ax))
            y = int(round(ch * 0.52 - local_ay))
        y = max(6, min(ch - nh - 4, y))
    else:
        x = (cw - nw) // 2
        y = (ch - nh) // 2
    cell.alpha_composite(cut, (x, y))
    return cell, {"x": x, "y": y, "w": nw, "h": nh, "anchorX": ax, "anchorY": ay, "scale": scale}


def package_sheet(spec):
    OUT_DIR.mkdir(parents=True, exist_ok=True)
    src = Image.open(spec["source"]).convert("RGBA")
    shutil.copy2(spec["source"], OUT_DIR / spec["source_copy"])
    cw, ch = spec["cell"]
    atlas = Image.new("RGBA", (cw * spec["cols"], ch * spec["rows"]), (0, 0, 0, 0))
    boxes = []
    audits = []
    for row in range(spec["rows"]):
        row_boxes = []
        row_audits = []
        frames = []
        for frame in range(spec["frame_counts"][row]):
            extracted, audit = extract_frame(src, spec, row, frame)
            frames.append(extracted)
            row_audits.append(audit)
        if spec.get("body"):
            frames, row_audits = fill_empty_row_frames(frames, row_audits)
        scale = row_scale_for(frames, spec, row)
        grounded = row not in set(spec.get("air_rows", []))
        for frame in range(spec["cols"]):
            if frame >= spec["frame_counts"][row]:
                continue
            raw = frames[frame]
            cell, box = place_into_cell(raw, spec["cell"], spec["baseline"], scale, spec["body"], grounded=grounded)
            atlas.alpha_composite(cell, (frame * cw, row * ch))
            row_boxes.append(box)
            row_audits[frame]["runtimeBox"] = box
            row_audits[frame]["runtimeCell"] = [frame * cw, row * ch, cw, ch]
        boxes.append(row_boxes)
        audits.append(row_audits)
    clear_hot_magenta(atlas)
    atlas.save(OUT_DIR / spec["out"])
    return atlas, boxes, audits


def clear_hot_magenta(img):
    data = []
    for r, g, b, a in img.getdata():
        if a and r > 230 and g < 48 and b > 220:
            data.append((r, g, b, 0))
        else:
            data.append((r, g, b, a))
    img.putdata(data)


def make_contact(atlases):
    scale = 0.12
    thumbs = []
    for spec, atlas in atlases:
        thumb = atlas.copy()
        thumb.thumbnail((900, 360), Image.LANCZOS)
        panel = Image.new("RGBA", (thumb.width, thumb.height + 30), (255, 255, 255, 255))
        panel.alpha_composite(thumb, (0, 0))
        d = ImageDraw.Draw(panel)
        d.text((8, thumb.height + 8), spec["name"], fill=(0, 0, 0, 255))
        thumbs.append(panel.convert("RGB"))
    width = max(t.width for t in thumbs)
    height = sum(t.height + 14 for t in thumbs)
    contact = Image.new("RGB", (width, height), "white")
    y = 0
    for thumb in thumbs:
        contact.paste(thumb, (0, y))
        y += thumb.height + 14
    contact.save(OUT_DIR / "celeste_final_runtime_atlases_contact.png")


def make_frame_contact(atlases):
    panels = []
    for spec, atlas in atlases:
        cw, ch = spec["cell"]
        for row in range(spec["rows"]):
            row_name = spec.get("row_names", [])[row] if row < len(spec.get("row_names", [])) else f"row_{row}"
            for frame in range(spec["frame_counts"][row]):
                cell = atlas.crop((frame * cw, row * ch, (frame + 1) * cw, (row + 1) * ch))
                bg = Image.new("RGBA", cell.size, (28, 28, 30, 255))
                bg.alpha_composite(cell)
                bg.thumbnail((220, 150), Image.LANCZOS)
                panel = Image.new("RGB", (220, 184), "white")
                panel.paste(bg.convert("RGB"), ((220 - bg.width) // 2, 0))
                d = ImageDraw.Draw(panel)
                d.rectangle((0, 0, 219, 149), outline=(90, 90, 90), width=1)
                d.text((5, 153), f"{spec['name']} r{row} f{frame}", fill=(0, 0, 0))
                d.text((5, 167), row_name[:34], fill=(42, 42, 42))
                panels.append(panel)
    cols = 5
    pad = 8
    width = cols * 220 + (cols - 1) * pad
    rows = (len(panels) + cols - 1) // cols
    height = rows * 184 + max(0, rows - 1) * pad
    contact = Image.new("RGB", (width, height), "white")
    for index, panel in enumerate(panels):
        x = (index % cols) * (220 + pad)
        y = (index // cols) * (184 + pad)
        contact.paste(panel, (x, y))
    contact.save(OUT_DIR / f"celeste_{PHASE}_runtime_frame_contact.png")


def draw_component_box(draw, bbox, color, width=3):
    if not bbox:
        return
    x, y, w, h = bbox
    draw.rectangle((x, y, x + w, y + h), outline=color, width=width)


def make_body_debug_contact(atlases):
    atlas_by_name = {spec["name"]: atlas for spec, atlas in atlases}
    debug_sheet_names = {
        "sheet_2_ground_normals",
        "sheet_3_up_air_attacks",
        "sheet_4_specials",
        "sheet_5_defense_reactions",
        "sheet_6_octava_body",
    }
    panels = []
    for spec in SHEETS:
        if spec["name"] not in debug_sheet_names:
            continue
        src = Image.open(spec["source"]).convert("RGBA")
        atlas = atlas_by_name[spec["name"]]
        cw, ch = spec["cell"]
        for row in range(spec["rows"]):
            row_name = spec.get("row_names", [])[row] if row < len(spec.get("row_names", [])) else f"row_{row}"
            for frame in range(spec["frame_counts"][row]):
                source_cell = extract_source_cell_for_debug(src, spec, row, frame)
                runtime_cell = atlas.crop((frame * cw, row * ch, (frame + 1) * cw, (row + 1) * ch))
                source_analysis = analyze_body_presence(source_cell, spec, row)
                runtime_analysis = analyze_body_presence(runtime_cell, spec, row)

                source_bg = Image.new("RGBA", source_cell.size, (28, 28, 30, 255))
                source_bg.alpha_composite(source_cell)
                runtime_bg = Image.new("RGBA", runtime_cell.size, (28, 28, 30, 255))
                runtime_bg.alpha_composite(runtime_cell)
                source_draw = ImageDraw.Draw(source_bg)
                runtime_draw = ImageDraw.Draw(runtime_bg)
                source_body = source_analysis.get("bodyComponent") or {}
                source_vfx = source_analysis.get("vfxComponent") or {}
                runtime_body = runtime_analysis.get("bodyComponent") or {}
                runtime_vfx = runtime_analysis.get("vfxComponent") or {}
                draw_component_box(source_draw, source_body.get("bbox"), (95, 255, 112, 255), 3)
                draw_component_box(source_draw, source_vfx.get("bbox"), (75, 210, 255, 255), 3)
                draw_component_box(runtime_draw, runtime_body.get("bbox"), (95, 255, 112, 255), 4)
                draw_component_box(runtime_draw, runtime_vfx.get("bbox"), (75, 210, 255, 255), 3)

                source_bg.thumbnail((250, 130), Image.LANCZOS)
                runtime_bg.thumbnail((250, 130), Image.LANCZOS)
                panel = Image.new("RGB", (260, 298), "white")
                panel.paste(source_bg.convert("RGB"), ((260 - source_bg.width) // 2, 0))
                panel.paste(runtime_bg.convert("RGB"), ((260 - runtime_bg.width) // 2, 136))
                d = ImageDraw.Draw(panel)
                d.text((6, 262), f"{spec['name']} r{row} f{frame}", fill=(0, 0, 0))
                d.text((6, 276), row_name[:34], fill=(42, 42, 42))
                status = "BODY OK" if runtime_analysis["bodyPresent"] else "BODY WARN"
                d.text((158, 276), status, fill=(0, 110, 22) if runtime_analysis["bodyPresent"] else (180, 0, 0))
                panels.append(panel)

    cols = 4
    pad = 10
    width = cols * 260 + (cols - 1) * pad
    rows = (len(panels) + cols - 1) // cols
    height = rows * 298 + max(0, rows - 1) * pad
    contact = Image.new("RGB", (width, height), "white")
    for index, panel in enumerate(panels):
        x = (index % cols) * (260 + pad)
        y = (index // cols) * (298 + pad)
        contact.paste(panel, (x, y))
    contact.save(OUT_DIR / f"celeste_{PHASE}_body_source_runtime_debug_contact.png")


def make_body_presence_report(atlases):
    atlas_by_name = {spec["name"]: atlas for spec, atlas in atlases}
    report = {
        "phase": PHASE,
        "policy": "Sheets 1-6 are body sheets; body-like component must remain present after cleanup even when VFX is larger.",
        "framesChecked": 0,
        "missingBodyFrames": [],
        "suspectFrames": [],
        "sheets": {},
    }
    for spec in SHEETS:
        if not spec.get("body"):
            continue
        atlas = atlas_by_name[spec["name"]]
        cw, ch = spec["cell"]
        sheet_entries = []
        for row in range(spec["rows"]):
            row_name = spec.get("row_names", [])[row] if row < len(spec.get("row_names", [])) else f"row_{row}"
            for frame in range(spec["frame_counts"][row]):
                cell = atlas.crop((frame * cw, row * ch, (frame + 1) * cw, (row + 1) * ch))
                analysis = analyze_body_presence(cell, spec, row)
                entry = {
                    "row": row,
                    "rowName": row_name,
                    "frame": frame,
                    **analysis,
                }
                sheet_entries.append(entry)
                report["framesChecked"] += 1
                if not analysis["bodyPresent"]:
                    report["missingBodyFrames"].append({
                        "sheet": spec["name"],
                        "row": row,
                        "rowName": row_name,
                        "frame": frame,
                        "warnings": analysis["warnings"],
                        "bodyComponent": analysis["bodyComponent"],
                        "vfxComponent": analysis["vfxComponent"],
                        "bodyRegionDarkInk": analysis["bodyRegionDarkInk"],
                    })
                elif analysis["warnings"]:
                    report["suspectFrames"].append({
                        "sheet": spec["name"],
                        "row": row,
                        "rowName": row_name,
                        "frame": frame,
                        "warnings": analysis["warnings"],
                    })
        report["sheets"][spec["name"]] = sheet_entries
    (OUT_DIR / f"celeste_{PHASE}_body_presence_report.json").write_text(json.dumps(report, indent=2), encoding="utf-8")
    return report


def make_portrait():
    atlas = Image.open(OUT_DIR / "celeste_sheet_1_body_basics_atlas.png").convert("RGBA")
    cell_w, cell_h = SHEETS[0]["cell"]
    cell = atlas.crop((cell_w, 0, cell_w * 2, cell_h))
    bbox = content_bbox(cell)
    if not bbox:
        return
    cut = cell.crop(bbox)
    canvas = Image.new("RGBA", (460, 520), (0, 0, 0, 0))
    scale = min(360 / cut.width, 470 / cut.height)
    cut = cut.resize((int(cut.width * scale), int(cut.height * scale)), Image.LANCZOS)
    canvas.alpha_composite(cut, ((460 - cut.width) // 2, 42))
    PORTRAIT_DIR.mkdir(parents=True, exist_ok=True)
    canvas.save(PORTRAIT_DIR / "celeste_select.png")


def main():
    atlases = []
    manifest = {}
    isolation_report = {
        "phase": PHASE,
        "sourceRectPolicy": "exact source-cell rectangles; no neighbor-padding expansion",
        "bodyIsolationPolicy": "body sheets score and preserve the Celeste body component first, then keep meaningful attached or in-cell VFX companions; large VFX must not replace the body",
        "vfxIsolationPolicy": "Sheet 7 remains VFX-only and may keep VFX components without body fallback holds",
        "sheets": {},
        "bleedRemovedFrames": [],
    }
    for spec in SHEETS:
        atlas, boxes, audits = package_sheet(spec)
        atlases.append((spec, atlas))
        manifest[spec["out"]] = {
            "cell": spec["cell"],
            "rows": spec["rows"],
            "cols": spec["cols"],
            "frameCounts": spec["frame_counts"],
            "baseline": spec["baseline"],
            "boxes": boxes,
        }
        sheet_report = []
        for row, row_audits in enumerate(audits):
            row_name = spec.get("row_names", [])[row] if row < len(spec.get("row_names", [])) else f"row_{row}"
            for frame, audit in enumerate(row_audits):
                entry = {
                    "row": row,
                    "rowName": row_name,
                    "frame": frame,
                    **audit,
                }
                sheet_report.append(entry)
                if audit["removedArea"] > 500 or any(component["area"] > 500 for component in audit["removedComponents"]):
                    isolation_report["bleedRemovedFrames"].append({
                        "sheet": spec["name"],
                        "row": row,
                        "rowName": row_name,
                        "frame": frame,
                        "removedArea": audit["removedArea"],
                        "removedComponents": audit["removedComponents"],
                    })
        isolation_report["sheets"][spec["name"]] = sheet_report
        print(f"Wrote {spec['out']} {atlas.size}")
    make_contact(atlases)
    make_frame_contact(atlases)
    make_body_debug_contact(atlases)
    body_presence_report = make_body_presence_report(atlases)
    make_portrait()
    (OUT_DIR / "celeste_phase5_alignment_manifest.json").write_text(json.dumps(manifest, indent=2), encoding="utf-8")
    (OUT_DIR / f"celeste_{PHASE}_alignment_manifest.json").write_text(json.dumps(manifest, indent=2), encoding="utf-8")
    (OUT_DIR / f"celeste_{PHASE}_frame_isolation_report.json").write_text(json.dumps(isolation_report, indent=2), encoding="utf-8")
    print(f"Wrote {OUT_DIR / 'celeste_final_runtime_atlases_contact.png'}")
    print(f"Wrote {OUT_DIR / f'celeste_{PHASE}_runtime_frame_contact.png'}")
    print(f"Wrote {OUT_DIR / f'celeste_{PHASE}_body_source_runtime_debug_contact.png'}")
    print(f"Wrote {OUT_DIR / f'celeste_{PHASE}_body_presence_report.json'}")
    print(f"Wrote {PORTRAIT_DIR / 'celeste_select.png'}")
    print(f"Wrote {OUT_DIR / 'celeste_phase5_alignment_manifest.json'}")
    print(f"Wrote {OUT_DIR / f'celeste_{PHASE}_frame_isolation_report.json'}")
    if body_presence_report["missingBodyFrames"]:
        print(f"WARNING: {len(body_presence_report['missingBodyFrames'])} Celeste body frames failed body-presence validation")


if __name__ == "__main__":
    main()
