from collections import deque
from pathlib import Path

import numpy as np
from PIL import Image


PROJECT_ROOT = Path(__file__).resolve().parents[1]
SOURCE_DIR = PROJECT_ROOT / "assets" / "sprites" / "vanta_final_source"
TARGET_DIR = PROJECT_ROOT / "assets" / "sprites" / "vanta_final"
FIX_DIR = PROJECT_ROOT / "assets" / "sprites" / "vanta_final_fixes"
REPORT_PATH = PROJECT_ROOT / "docs" / "vanta_final_rebuild_report.md"

COLUMNS = 6
ROWS = 5
CELL_SIZE = 320
BASELINE_Y = 300
FIX_MAX_BODY_WIDTH = 220
FIX_MAX_BODY_HEIGHT = 196
MAGENTA = np.array([255, 0, 255, 255], dtype=np.uint8)

SHEETS = [
    ("vanta_sheet_1_basic_movement.png", {0, 1, 2, 3, 4}, {3}),
    ("vanta_sheet_2_defense_recovery.png", {0, 1, 2, 3, 4}, set()),
    ("vanta_sheet_3_core_attacks_a.png", set(), set()),
    ("vanta_sheet_4_core_attacks_b.png", set(), set()),
    ("vanta_sheet_5_low_air.png", set(), set()),
    ("vanta_sheet_6_specials_ultimate.png", {1, 2}, {1, 2}),
    ("vanta_sheet_7_end_states_extras.png", {0, 1, 2, 3, 4}, set()),
]

ROW_HOLDS = [
    ("vanta_sheet_1_basic_movement.png", 3, 0, "vanta_sheet_1_basic_movement.png", 3),
    ("vanta_sheet_1_basic_movement.png", 0, 0, "vanta_sheet_6_specials_ultimate.png", 2),
]

FIXED_STRIP_ROWS = [
    ("slide_fix.png", "vanta_sheet_1_basic_movement.png", 3, "slide"),
    ("uj_fix.png", "vanta_sheet_6_specials_ultimate.png", 1, "up+j"),
]


def foreground_mask(frame: np.ndarray) -> np.ndarray:
    r = frame[:, :, 0].astype(np.int16)
    g = frame[:, :, 1].astype(np.int16)
    b = frame[:, :, 2].astype(np.int16)
    a = frame[:, :, 3]
    hot_magenta = (r > 218) & (g < 105) & (b > 205) & (np.abs(r - b) < 74)
    magenta_shadow = (r > 170) & (g < 80) & (b > 190) & (np.abs(r - b) < 70)
    return (a > 18) & ~(hot_magenta | magenta_shadow)


def fix_strip_foreground_mask(frame: np.ndarray) -> np.ndarray:
    r = frame[:, :, 0].astype(np.int16)
    g = frame[:, :, 1].astype(np.int16)
    b = frame[:, :, 2].astype(np.int16)
    a = frame[:, :, 3]
    magenta_family = (
        (r > 118)
        & (g < 122)
        & (b > 118)
        & (np.abs(r - b) < 125)
        & ((r + b) > g * 3)
    )
    hot_magenta = (r > 218) & (g < 120) & (b > 205) & (np.abs(r - b) < 90)
    return (a > 18) & ~(magenta_family | hot_magenta)


def connected_components(mask: np.ndarray, frame: np.ndarray):
    h, w = mask.shape
    labels = np.zeros((h, w), dtype=np.int32)
    rgb_sum = frame[:, :, :3].astype(np.int16).sum(axis=2)
    components = []
    next_label = 1

    for start_y, start_x in zip(*np.nonzero(mask & (labels == 0))):
        if labels[start_y, start_x] != 0:
            continue
        label = next_label
        next_label += 1
        queue = deque([(int(start_y), int(start_x))])
        labels[start_y, start_x] = label
        xs = []
        ys = []
        dark_count = 0

        while queue:
            y, x = queue.pop()
            xs.append(x)
            ys.append(y)
            if rgb_sum[y, x] < 430:
                dark_count += 1
            for oy in (-1, 0, 1):
                for ox in (-1, 0, 1):
                    if ox == 0 and oy == 0:
                        continue
                    ny = y + oy
                    nx = x + ox
                    if ny < 0 or ny >= h or nx < 0 or nx >= w:
                        continue
                    if labels[ny, nx] != 0 or not mask[ny, nx]:
                        continue
                    labels[ny, nx] = label
                    queue.append((ny, nx))

        xs_arr = np.array(xs)
        ys_arr = np.array(ys)
        min_x = int(xs_arr.min())
        max_x = int(xs_arr.max())
        min_y = int(ys_arr.min())
        max_y = int(ys_arr.max())
        components.append(
            {
                "label": label,
                "count": len(xs),
                "dark_count": dark_count,
                "min_x": min_x,
                "max_x": max_x,
                "min_y": min_y,
                "max_y": max_y,
                "w": max_x - min_x + 1,
                "h": max_y - min_y + 1,
                "center_x": (min_x + max_x) / 2.0,
                "center_y": (min_y + max_y) / 2.0,
                "touches_left": min_x <= 1,
                "touches_right": max_x >= w - 2,
                "touches_top": min_y <= 1,
                "touches_bottom": max_y >= h - 2,
            }
        )

    return labels, components


def select_body(components, width: int):
    if not components:
        return None
    best = None
    best_score = -10**12
    for component in components:
        center_penalty = abs(component["center_x"] - width / 2.0) * 2.5
        edge_penalty = 0
        if component["touches_left"] or component["touches_right"] or component["touches_top"]:
            edge_penalty += component["count"] * 0.2
        score = (
            component["count"]
            + component["dark_count"] * 2.5
            + component["max_y"] * 12
            - center_penalty
            - edge_penalty
        )
        if score > best_score:
            best_score = score
            best = component
    return best


def should_keep_effect(component, body, frame_w: int, frame_h: int) -> bool:
    if component["label"] == body["label"]:
        return True

    expand_x = max(34, frame_w * 0.18)
    expand_y = max(26, frame_h * 0.16)
    primary_box = {
        "min_x": body["min_x"] - expand_x,
        "max_x": body["max_x"] + expand_x,
        "min_y": body["min_y"] - expand_y,
        "max_y": body["max_y"] + expand_y,
    }
    overlaps_body = (
        component["max_x"] >= primary_box["min_x"]
        and component["min_x"] <= primary_box["max_x"]
        and component["max_y"] >= primary_box["min_y"]
        and component["min_y"] <= primary_box["max_y"]
    )

    tiny = component["count"] < max(90, body["count"] * 0.018)
    edge_scrap = (
        component["touches_left"] or component["touches_right"] or component["touches_top"]
    ) and not overlaps_body
    partial_neighbor = (
        component["touches_left"] and component["center_x"] < frame_w * 0.18
    ) or (
        component["touches_right"] and component["center_x"] > frame_w * 0.82
    )
    meaningful_effect = (
        component["count"] >= max(450, body["count"] * 0.08)
        and component["w"] >= 12
        and component["h"] >= 12
    )
    meaningful_body_piece = component["dark_count"] >= max(120, body["dark_count"] * 0.1)

    if partial_neighbor or (edge_scrap and not meaningful_effect):
        return False
    if tiny and not overlaps_body:
        return False
    return overlaps_body or meaningful_effect or meaningful_body_piece


def normalize_frame(source: np.ndarray, box, body_only: bool):
    sx, sy, ex, ey = box
    frame = source[sy:ey, sx:ex]
    frame_h, frame_w = frame.shape[:2]
    mask = foreground_mask(frame)
    labels, components = connected_components(mask, frame)
    body = select_body(components, frame_w)
    if body is None or body["count"] < 750:
        return None, {"components": len(components), "kept": 0, "dropped": len(components), "fallback": True}

    keep_labels = {body["label"]}
    if not body_only:
        for component in components:
            if should_keep_effect(component, body, frame_w, frame_h):
                keep_labels.add(component["label"])

    keep_mask = np.isin(labels, list(keep_labels))
    output = np.zeros((CELL_SIZE, CELL_SIZE, 4), dtype=np.uint8)
    output[:, :] = MAGENTA
    offset_x = int(round(CELL_SIZE / 2 - body["center_x"]))
    offset_y = int(round(BASELINE_Y - body["max_y"]))

    ys, xs = np.nonzero(keep_mask)
    dx = offset_x + xs
    dy = offset_y + ys
    inside = (dx >= 0) & (dx < CELL_SIZE) & (dy >= 0) & (dy < CELL_SIZE)
    if not inside.any():
        return None, {"components": len(components), "kept": 0, "dropped": len(components), "fallback": True}

    output[dy[inside], dx[inside]] = frame[ys[inside], xs[inside]]
    return output, {
        "components": len(components),
        "kept": len(keep_labels),
        "dropped": max(0, len(components) - len(keep_labels)),
        "body_count": body["count"],
        "body_bottom": body["max_y"],
        "fallback": False,
    }


def sheet_bounds(width: int, height: int):
    x_bounds = [round(i * width / COLUMNS) for i in range(COLUMNS + 1)]
    y_bounds = [round(i * height / ROWS) for i in range(ROWS + 1)]
    return x_bounds, y_bounds


def rebuild_sheet(filename: str, body_only_rows, hold_rows):
    source_path = SOURCE_DIR / filename
    source = np.array(Image.open(source_path).convert("RGBA"))
    h, w = source.shape[:2]
    x_bounds, y_bounds = sheet_bounds(w, h)
    output = np.zeros((ROWS * CELL_SIZE, COLUMNS * CELL_SIZE, 4), dtype=np.uint8)
    output[:, :] = MAGENTA
    report_rows = []

    for row in range(ROWS):
        row_frames = []
        row_report = []
        fallback = None
        for col in range(COLUMNS):
            frame, info = normalize_frame(
                source,
                (x_bounds[col], y_bounds[row], x_bounds[col + 1], y_bounds[row + 1]),
                row in body_only_rows,
            )
            if frame is None:
                row_frames.append(None)
                row_report.append({**info, "col": col, "replaced": True})
                continue
            if fallback is None:
                fallback = frame
            row_frames.append(frame)
            row_report.append({**info, "col": col, "replaced": False})

        if fallback is None:
            fallback = np.zeros((CELL_SIZE, CELL_SIZE, 4), dtype=np.uint8)
            fallback[:, :] = MAGENTA

        if row in hold_rows:
            row_frames = [fallback.copy() for _ in range(COLUMNS)]
            for info in row_report:
                info["held_row"] = True

        for col in range(COLUMNS):
            if row_frames[col] is None:
                replacement = row_frames[col - 1] if col > 0 and row_frames[col - 1] is not None else fallback
                row_frames[col] = replacement.copy()
                row_report[col]["replaced"] = True
            y0 = row * CELL_SIZE
            x0 = col * CELL_SIZE
            output[y0 : y0 + CELL_SIZE, x0 : x0 + CELL_SIZE] = row_frames[col]

        report_rows.append(row_report)

    TARGET_DIR.mkdir(parents=True, exist_ok=True)
    Image.fromarray(output, "RGBA").save(TARGET_DIR / filename)
    return {
        "filename": filename,
        "source_size": f"{w}x{h}",
        "source_frame": f"{w / COLUMNS:.2f}x{h / ROWS:.2f}",
        "target_size": f"{COLUMNS * CELL_SIZE}x{ROWS * CELL_SIZE}",
        "rows": report_rows,
    }


def apply_row_holds():
    for source_file, source_row, source_col, target_file, target_row in ROW_HOLDS:
        source = np.array(Image.open(TARGET_DIR / source_file).convert("RGBA"))
        target = np.array(Image.open(TARGET_DIR / target_file).convert("RGBA"))
        held = source[
            source_row * CELL_SIZE : (source_row + 1) * CELL_SIZE,
            source_col * CELL_SIZE : (source_col + 1) * CELL_SIZE,
        ]
        for col in range(COLUMNS):
            target[
                target_row * CELL_SIZE : (target_row + 1) * CELL_SIZE,
                col * CELL_SIZE : (col + 1) * CELL_SIZE,
            ] = held
        Image.fromarray(target, "RGBA").save(TARGET_DIR / target_file)


def normalize_fix_frame(frame: np.ndarray, target_bottom: int):
    mask = fix_strip_foreground_mask(frame)
    labels, components = connected_components(mask, frame)
    body = select_body(components, frame.shape[1])
    output = np.zeros((CELL_SIZE, CELL_SIZE, 4), dtype=np.uint8)
    output[:, :] = MAGENTA
    if body is None:
        return output

    keep_labels = {body["label"]}
    expand_x = 46
    expand_y = 34
    for component in components:
        if component["label"] == body["label"]:
            continue
        overlaps_body = (
            component["max_x"] >= body["min_x"] - expand_x
            and component["min_x"] <= body["max_x"] + expand_x
            and component["max_y"] >= body["min_y"] - expand_y
            and component["min_y"] <= body["max_y"] + expand_y
        )
        meaningful_near_piece = component["count"] >= 80 or component["dark_count"] >= 35
        if overlaps_body and meaningful_near_piece:
            keep_labels.add(component["label"])

    keep_mask = np.isin(labels, list(keep_labels))
    ys, xs = np.nonzero(keep_mask)
    if len(xs) == 0:
        return output

    min_x = int(xs.min())
    max_x = int(xs.max())
    min_y = int(ys.min())
    max_y = int(ys.max())
    subject = frame[min_y : max_y + 1, min_x : max_x + 1]
    subject_mask = keep_mask[min_y : max_y + 1, min_x : max_x + 1]
    subject = subject.copy()
    subject[~subject_mask] = MAGENTA

    subject_image = Image.fromarray(subject, "RGBA")
    scale = min(
        FIX_MAX_BODY_WIDTH / max(1, subject_image.width),
        FIX_MAX_BODY_HEIGHT / max(1, subject_image.height),
        1.0,
    )
    resample = getattr(Image, "Resampling", Image).LANCZOS
    new_size = (max(1, round(subject_image.width * scale)), max(1, round(subject_image.height * scale)))
    subject_image = subject_image.resize(new_size, resample)
    subject = np.array(subject_image)
    subject_mask = fix_strip_foreground_mask(subject)

    x0 = int(round(CELL_SIZE / 2 - subject.shape[1] / 2))
    y0 = int(round(target_bottom - subject.shape[0]))
    x0 = max(0, min(CELL_SIZE - subject.shape[1], x0))
    y0 = max(0, min(CELL_SIZE - subject.shape[0], y0))

    target_region = output[y0 : y0 + subject.shape[0], x0 : x0 + subject.shape[1]]
    target_region[subject_mask] = subject[subject_mask]
    return output


def normalize_fix_strip(strip_path: Path, row_kind: str):
    source = np.array(Image.open(strip_path).convert("RGBA"))
    h, w = source.shape[:2]
    x_bounds = [round(i * w / COLUMNS) for i in range(COLUMNS + 1)]
    if row_kind == "up+j":
        bottoms = [BASELINE_Y, BASELINE_Y, 284, 258, 238, 260]
    else:
        bottoms = [BASELINE_Y] * COLUMNS

    row = np.zeros((CELL_SIZE, COLUMNS * CELL_SIZE, 4), dtype=np.uint8)
    row[:, :] = MAGENTA
    for col in range(COLUMNS):
        frame = source[:, x_bounds[col] : x_bounds[col + 1]]
        normalized = normalize_fix_frame(frame, bottoms[col])
        x0 = col * CELL_SIZE
        row[:, x0 : x0 + CELL_SIZE] = normalized
    return Image.fromarray(row, "RGBA")


def apply_fixed_strips():
    for strip_name, target_file, target_row, row_kind in FIXED_STRIP_ROWS:
        strip_path = FIX_DIR / strip_name
        if not strip_path.exists():
            raise FileNotFoundError(f"Missing fixed animation strip: {strip_path}")
        sheet_path = TARGET_DIR / target_file
        sheet = Image.open(sheet_path).convert("RGBA")
        row = normalize_fix_strip(strip_path, row_kind)
        sheet.paste(row, (0, target_row * CELL_SIZE))
        sheet.save(sheet_path)


def regenerate_portrait():
    sheet = Image.open(TARGET_DIR / "vanta_sheet_1_basic_movement.png").convert("RGBA")
    frame = sheet.crop((0, 0, CELL_SIZE, CELL_SIZE))
    keyed = np.array(frame)
    mask = foreground_mask(keyed)
    keyed[~mask] = np.array([0, 0, 0, 0], dtype=np.uint8)
    frame = Image.fromarray(keyed, "RGBA")
    ys, xs = np.nonzero(mask)
    if len(xs) == 0:
        bounds = None
    else:
        bounds = (int(xs.min()), int(ys.min()), int(xs.max()) + 1, int(ys.max()) + 1)
    if bounds is None:
        return
    subject = frame.crop(bounds)
    canvas = Image.new("RGBA", (460, 520), (0, 0, 0, 0))
    scale = min(360 / subject.width, 450 / subject.height)
    resample = getattr(Image, "Resampling", Image).LANCZOS
    subject = subject.resize((max(1, round(subject.width * scale)), max(1, round(subject.height * scale))), resample)
    canvas.alpha_composite(subject, ((canvas.width - subject.width) // 2, canvas.height - subject.height - 18))
    out = PROJECT_ROOT / "assets" / "sprites" / "portraits" / "vanta_select.png"
    out.parent.mkdir(parents=True, exist_ok=True)
    canvas.save(out)


def write_report(reports):
    lines = [
        "# Vanta Final Rebuild Report",
        "",
        "Runtime sheets were rebuilt from `assets/sprites/vanta_final_source` into `assets/sprites/vanta_final`.",
        "",
        "- Output standard: 6 columns x 5 rows",
        "- Output cell size: 320x320",
        "- Output sheet size: 1920x1600",
        "- Background: solid #ff00ff",
        "- Anchor: bottom-center, baseline Y=300",
        "- Dash row is held stable because travel is code-driven.",
        "- Special_1 row is held as a clean body pose because dash slash travel/VFX is code-driven.",
        "- Special_2 row is held from idle because projectile/VFX travel is code-driven.",
        "- Sheet 1 row 4 is replaced from assets/sprites/vanta_final_fixes/slide_fix.png.",
        "- Sheet 6 row 2 is replaced from assets/sprites/vanta_final_fixes/uj_fix.png.",
        "- Fixed replacement strips are normalized into 320x320 cells with solid #ff00ff backgrounds.",
        f"- Fixed replacement strips are clamped to max body size {FIX_MAX_BODY_WIDTH}x{FIX_MAX_BODY_HEIGHT} to match Vanta's existing runtime scale.",
        "- No procedural speed streaks or slash sweeps are added by this script.",
        "",
    ]
    for report in reports:
        lines.extend(
            [
                f"## {report['filename']}",
                "",
                f"- Source size: {report['source_size']}",
                f"- Source frame size: {report['source_frame']}",
                f"- Rebuilt runtime size: {report['target_size']}",
                "",
                "| Row | Dropped Components | Replaced Frames | Held |",
                "|---|---:|---:|---|",
            ]
        )
        for row_index, row in enumerate(report["rows"]):
            dropped = sum(info.get("dropped", 0) for info in row)
            replaced = sum(1 for info in row if info.get("replaced"))
            held = "yes" if any(info.get("held_row") for info in row) else "no"
            lines.append(f"| {row_index + 1} | {dropped} | {replaced} | {held} |")
        lines.append("")
    REPORT_PATH.write_text("\n".join(lines), encoding="utf-8")


def main():
    reports = []
    for filename, body_only_rows, hold_rows in SHEETS:
        reports.append(rebuild_sheet(filename, body_only_rows, hold_rows))
    apply_row_holds()
    apply_fixed_strips()
    regenerate_portrait()
    write_report(reports)
    for report in reports:
        print(f"Rebuilt {report['filename']} from {report['source_size']} -> {report['target_size']}")
    print(f"Wrote {REPORT_PATH.relative_to(PROJECT_ROOT)}")


if __name__ == "__main__":
    main()
