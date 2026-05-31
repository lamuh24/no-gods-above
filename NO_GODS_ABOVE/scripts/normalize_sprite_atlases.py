from pathlib import Path

import numpy as np
from PIL import Image


PROJECT_ROOT = Path(__file__).resolve().parents[1]
CELL_SIZE = 320
COLUMNS = 6
DEFAULT_ROWS = 6
BASELINE_Y = 300
MAGENTA = np.array([255, 0, 255, 255], dtype=np.uint8)
ALL_ROWS = set(range(DEFAULT_ROWS))
KAIRO_FINAL_ROWS = 5
KAIRO_FINAL_ALL_ROWS = set(range(KAIRO_FINAL_ROWS))

ATLASES = [
    ("assets/sprites/kairo_final_source/kairo_sheet_1_basic_movement.png", "assets/sprites/kairo_final/kairo_sheet_1_basic_movement.png", 6, KAIRO_FINAL_ROWS, KAIRO_FINAL_ALL_ROWS, {3}),
    ("assets/sprites/kairo_final_source/kairo_sheet_2_defense_recovery.png", "assets/sprites/kairo_final/kairo_sheet_2_defense_recovery.png", 6, KAIRO_FINAL_ROWS, KAIRO_FINAL_ALL_ROWS, set()),
    ("assets/sprites/kairo_final_source/kairo_sheet_3_core_attacks_a.png", "assets/sprites/kairo_final/kairo_sheet_3_core_attacks_a.png", 6, KAIRO_FINAL_ROWS, KAIRO_FINAL_ALL_ROWS, set()),
    ("assets/sprites/kairo_final_source/kairo_sheet_4_core_attacks_b.png", "assets/sprites/kairo_final/kairo_sheet_4_core_attacks_b.png", 6, KAIRO_FINAL_ROWS, KAIRO_FINAL_ALL_ROWS, set()),
    ("assets/sprites/kairo_final_source/kairo_sheet_5_low_air.png", "assets/sprites/kairo_final/kairo_sheet_5_low_air.png", 6, KAIRO_FINAL_ROWS, KAIRO_FINAL_ALL_ROWS, set()),
    ("assets/sprites/kairo_final_source/kairo_sheet_6_specials_ultimate.png", "assets/sprites/kairo_final/kairo_sheet_6_specials_ultimate.png", 6, KAIRO_FINAL_ROWS, KAIRO_FINAL_ALL_ROWS, {2}),
    ("assets/sprites/kairo_final_source/kairo_sheet_7_end_states_extras.png", "assets/sprites/kairo_final/kairo_sheet_7_end_states_extras.png", 6, KAIRO_FINAL_ROWS, KAIRO_FINAL_ALL_ROWS, set()),
]

ROW_HOLDS = [
    (
        "assets/sprites/kairo_final/kairo_sheet_1_basic_movement.png",
        3,
        0,
        "assets/sprites/kairo_final/kairo_sheet_1_basic_movement.png",
        3,
    ),
    (
        "assets/sprites/kairo_final/kairo_sheet_1_basic_movement.png",
        0,
        0,
        "assets/sprites/kairo_final/kairo_sheet_6_specials_ultimate.png",
        2,
    ),
]


def foreground_mask(frame: np.ndarray) -> np.ndarray:
    r = frame[:, :, 0].astype(np.int16)
    g = frame[:, :, 1].astype(np.int16)
    b = frame[:, :, 2].astype(np.int16)
    a = frame[:, :, 3]
    hot_magenta = (r > 218) & (g < 105) & (b > 205) & (np.abs(r - b) < 74)
    magenta_shadow = (r > 170) & (g < 80) & (b > 190) & (np.abs(r - b) < 70)
    return (a > 18) & ~(hot_magenta | magenta_shadow)


def connected_components(mask: np.ndarray, frame: np.ndarray):
    labels = np.zeros(mask.shape, dtype=np.int32)
    rgb_sum = frame[:, :, :3].astype(np.int16).sum(axis=2)
    h, w = mask.shape
    components = []
    label = 0

    for start_y, start_x in zip(*np.nonzero(mask & (labels == 0))):
        if labels[start_y, start_x] != 0:
            continue
        label += 1
        stack = [(int(start_y), int(start_x))]
        labels[start_y, start_x] = label
        xs = []
        ys = []
        dark_count = 0

        while stack:
            y, x = stack.pop()
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
                    if not mask[ny, nx] or labels[ny, nx] != 0:
                        continue
                    labels[ny, nx] = label
                    stack.append((ny, nx))

        xs_arr = np.array(xs)
        ys_arr = np.array(ys)
        components.append(
            {
                "label": label,
                "count": len(xs),
                "dark_count": dark_count,
                "min_x": int(xs_arr.min()),
                "max_x": int(xs_arr.max()),
                "min_y": int(ys_arr.min()),
                "max_y": int(ys_arr.max()),
                "center_x": float((xs_arr.min() + xs_arr.max()) / 2.0),
            }
        )

    return labels, components


def frame_root(mask: np.ndarray, frame: np.ndarray):
    ys, xs = np.nonzero(mask)
    if len(xs) == 0:
        return None

    rgb_sum = frame[:, :, :3].astype(np.int16).sum(axis=2)
    dark = mask & (rgb_sum < 430)
    dark_ys, dark_xs = np.nonzero(dark)

    if len(dark_xs) > 0:
        return float((dark_xs.min() + dark_xs.max()) / 2.0), int(dark_ys.max())
    return float((xs.min() + xs.max()) / 2.0), int(ys.max())


def select_body_component(components, width: int):
    if not components:
        return None
    best = None
    best_score = -10**12
    for component in components:
        center_penalty = abs(component["center_x"] - width / 2.0) * 2.5
        grounded_bonus = component["max_y"] * 16
        score = component["count"] + component["dark_count"] * 2.5 + grounded_bonus - center_penalty
        if score > best_score:
            best_score = score
            best = component
    return best


def is_unusable_body_component(component, width: int) -> bool:
    body_width = component["max_x"] - component["min_x"] + 1
    body_height = component["max_y"] - component["min_y"] + 1
    touches_left = component["min_x"] <= 1
    touches_right = component["max_x"] >= width - 2

    if component["count"] < 2500 or body_width < 55 or body_height < 80:
        return True

    # The AI source atlases sometimes place a partial body at the edge of a cell.
    # Treat those as missing poses so the row holds/duplicates a stable frame.
    if touches_left and component["center_x"] < width * 0.36:
        return True
    if touches_right and component["center_x"] > width * 0.72:
        return True
    return False


def normalized_frame(source: np.ndarray, src_box, keep_only_body: bool):
    sx, sy, sw, sh = src_box
    frame = source[sy : sy + sh, sx : sx + sw]
    mask = foreground_mask(frame)
    if keep_only_body:
        labels, components = connected_components(mask, frame)
        body = select_body_component(components, sw)
        if body is None:
            return None
        if is_unusable_body_component(body, sw):
            return None
        mask = labels == body["label"]
        root_center_x = body["center_x"]
        root_bottom = body["max_y"]
    else:
        root = frame_root(mask, frame)
        if root is None:
            return None
        root_center_x, root_bottom = root
    output = np.zeros((CELL_SIZE, CELL_SIZE, 4), dtype=np.uint8)
    output[:, :] = MAGENTA
    offset_x = int(round(CELL_SIZE / 2 - root_center_x))
    offset_y = int(round(BASELINE_Y - root_bottom))

    ys, xs = np.nonzero(mask)
    dx = offset_x + xs
    dy = offset_y + ys
    inside = (dx >= 0) & (dx < CELL_SIZE) & (dy >= 0) & (dy < CELL_SIZE)
    if not inside.any():
        return None

    output[dy[inside], dx[inside]] = frame[ys[inside], xs[inside]]
    foreground_count = int(inside.sum())
    return output, foreground_count


def normalize_atlas(source_rel: str, target_rel: str, source_columns: int, rows: int, body_only_rows, hold_rows):
    source_path = PROJECT_ROOT / source_rel
    target_path = PROJECT_ROOT / target_rel
    target_path.parent.mkdir(parents=True, exist_ok=True)

    source_img = Image.open(source_path).convert("RGBA")
    source = np.array(source_img)
    source_h, source_w = source.shape[:2]
    column_bounds = [round(i * source_w / source_columns) for i in range(source_columns + 1)]
    row_bounds = [round(i * source_h / rows) for i in range(rows + 1)]

    target = np.zeros((CELL_SIZE * rows, CELL_SIZE * COLUMNS, 4), dtype=np.uint8)
    target[:, :] = MAGENTA
    source_columns_for_output = [round(i * (source_columns - 1) / max(COLUMNS - 1, 1)) for i in range(COLUMNS)]

    for row in range(rows):
        row_frames = []
        last_valid = None
        for column in range(COLUMNS):
            source_column = source_columns_for_output[column]
            sx = column_bounds[source_column]
            sy = row_bounds[row]
            source_frame_w = column_bounds[source_column + 1] - sx
            source_frame_h = row_bounds[row + 1] - sy
            packed = normalized_frame(source, (sx, sy, source_frame_w, source_frame_h), row in body_only_rows)
            if packed is None:
                row_frames.append(None)
                continue
            frame_img, foreground_count = packed
            if foreground_count < 900 and last_valid is not None:
                row_frames.append(None)
                continue
            row_frames.append(frame_img)
            last_valid = frame_img

        fallback = next((frame for frame in row_frames if frame is not None), None)
        if fallback is None:
            continue

        if row in hold_rows:
            row_frames = [fallback for _ in range(COLUMNS)]

        for column in range(COLUMNS):
            if row_frames[column] is None:
                replacement = row_frames[column - 1] if column > 0 and row_frames[column - 1] is not None else fallback
                row_frames[column] = replacement
            target[row * CELL_SIZE : (row + 1) * CELL_SIZE, column * CELL_SIZE : (column + 1) * CELL_SIZE] = row_frames[column]

    Image.fromarray(target, "RGBA").save(target_path)
    print(f"Wrote {target_rel}")


def apply_row_holds():
    for source_rel, source_row, source_column, target_rel, target_row in ROW_HOLDS:
        source_path = PROJECT_ROOT / source_rel
        target_path = PROJECT_ROOT / target_rel
        source = np.array(Image.open(source_path).convert("RGBA"))
        target = np.array(Image.open(target_path).convert("RGBA"))
        held = source[
            source_row * CELL_SIZE : (source_row + 1) * CELL_SIZE,
            source_column * CELL_SIZE : (source_column + 1) * CELL_SIZE,
        ]
        for column in range(COLUMNS):
            target[
                target_row * CELL_SIZE : (target_row + 1) * CELL_SIZE,
                column * CELL_SIZE : (column + 1) * CELL_SIZE,
            ] = held
        Image.fromarray(target, "RGBA").save(target_path)
        print(f"Held row {target_row} in {target_rel} from {source_rel} row {source_row} frame {source_column}")


def main():
    for source_rel, target_rel, source_columns, rows, body_only_rows, hold_rows in ATLASES:
        normalize_atlas(source_rel, target_rel, source_columns, rows, body_only_rows, hold_rows)
    apply_row_holds()


if __name__ == "__main__":
    main()
