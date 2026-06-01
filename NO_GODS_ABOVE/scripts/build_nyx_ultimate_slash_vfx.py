from __future__ import annotations

from collections import deque
from pathlib import Path

from PIL import Image, ImageChops, ImageFilter


ROOT = Path(__file__).resolve().parents[1]
SOURCE = ROOT / "assets" / "effects" / "nyx" / "nyx_ult_source_exact.png"
CHROMA_OUT = ROOT / "assets" / "effects" / "nyx" / "nyx_phantom_slash_wave_ultimate_chroma.png"
RUNTIME_OUT = ROOT / "assets" / "effects" / "nyx" / "nyx_phantom_slash_wave_anim.png"

KEY = (255, 0, 255, 255)
CELL_W = 1024
CELL_H = 640
FRAMES = 8

# Peak frames deliberately fill 60-80% of cell height. Width is also pushed
# much larger than the old projectile-style export so the in-game draw call
# reads as a super slash instead of a tiny bullet.
HEIGHT_RATIOS = [0.34, 0.46, 0.60, 0.72, 0.78, 0.68, 0.52, 0.38]
WIDTH_RATIOS = [0.42, 0.55, 0.70, 0.82, 0.88, 0.76, 0.58, 0.44]
X_OFFSETS = [-70, -42, -20, 0, 12, 36, 62, 86]


def is_key(pixel: tuple[int, int, int, int]) -> bool:
    r, g, b, a = pixel
    return a > 0 and r >= 220 and g <= 70 and b >= 185


def alpha_from_chroma(img: Image.Image) -> Image.Image:
    rgba = img.convert("RGBA")
    pixels = rgba.load()
    w, h = rgba.size
    seen = bytearray(w * h)
    q: deque[tuple[int, int]] = deque()

    for x in range(w):
        for y in (0, h - 1):
            if is_key(pixels[x, y]):
                seen[y * w + x] = 1
                q.append((x, y))
    for y in range(h):
        for x in (0, w - 1):
            if is_key(pixels[x, y]) and not seen[y * w + x]:
                seen[y * w + x] = 1
                q.append((x, y))

    while q:
        cx, cy = q.popleft()
        pixels[cx, cy] = (255, 0, 255, 0)
        for nx, ny in ((cx + 1, cy), (cx - 1, cy), (cx, cy + 1), (cx, cy - 1)):
            if nx < 0 or ny < 0 or nx >= w or ny >= h:
                continue
            idx = ny * w + nx
            if seen[idx] or not is_key(pixels[nx, ny]):
                continue
            seen[idx] = 1
            q.append((nx, ny))
    return rgba


def occupied_bbox(img: Image.Image) -> tuple[int, int, int, int]:
    alpha = img.getchannel("A")
    bbox = alpha.getbbox()
    if bbox is None:
        raise ValueError("image has no occupied pixels after chroma removal")
    return bbox


def component_bboxes(alpha: Image.Image) -> list[tuple[int, int, int, int, int]]:
    mask = alpha.point(lambda v: 255 if v > 8 else 0)
    w, h = mask.size
    data = mask.load()
    seen = bytearray(w * h)
    boxes: list[tuple[int, int, int, int, int]] = []

    for y in range(h):
        for x in range(w):
            idx = y * w + x
            if seen[idx] or data[x, y] == 0:
                continue

            q: deque[tuple[int, int]] = deque([(x, y)])
            seen[idx] = 1
            min_x = max_x = x
            min_y = max_y = y
            area = 0

            while q:
                cx, cy = q.popleft()
                area += 1
                min_x = min(min_x, cx)
                max_x = max(max_x, cx)
                min_y = min(min_y, cy)
                max_y = max(max_y, cy)
                for nx, ny in ((cx + 1, cy), (cx - 1, cy), (cx, cy + 1), (cx, cy - 1)):
                    if nx < 0 or ny < 0 or nx >= w or ny >= h:
                        continue
                    nidx = ny * w + nx
                    if seen[nidx] or data[nx, ny] == 0:
                        continue
                    seen[nidx] = 1
                    q.append((nx, ny))

            if area > 20:
                boxes.append((min_x, min_y, max_x + 1, max_y + 1, area))

    return boxes


def merge_boxes(boxes: list[tuple[int, int, int, int, int]]) -> tuple[int, int, int, int]:
    if not boxes:
        raise ValueError("no slash components found")
    left = min(b[0] for b in boxes)
    top = min(b[1] for b in boxes)
    right = max(b[2] for b in boxes)
    bottom = max(b[3] for b in boxes)
    return left, top, right, bottom


def split_source_frames(source: Image.Image) -> list[Image.Image]:
    rgba = alpha_from_chroma(source)
    alpha = rgba.getchannel("A")
    alpha = ImageChops.lighter(alpha, alpha.filter(ImageFilter.MaxFilter(9)))
    boxes = component_bboxes(alpha)
    major_boxes = [b for b in boxes if b[4] >= 10000]
    major_boxes.sort(key=lambda b: b[0])
    if len(major_boxes) != FRAMES:
        raise ValueError(f"expected {FRAMES} major slash forms, found {len(major_boxes)}")

    frames: list[Image.Image] = []
    for i, major in enumerate(major_boxes):
        group = [major]
        for box in boxes:
            if box == major or box[4] >= 10000:
                continue
            cx = (box[0] + box[2]) / 2
            cy = (box[1] + box[3]) / 2
            # Keep fragments that belong to this slash body, but do not pull
            # in the previous frame's bright cutting edge. That was the source
            # of the unwanted isolated white slice in the old export.
            if (
                major[0] <= cx <= major[2] + 170
                and major[1] - 95 <= cy <= major[3] + 95
            ):
                group.append(box)

        box = merge_boxes(group)

        pad_x = 34
        pad_y = 38
        prev_right = major_boxes[i - 1][2] if i > 0 else 0
        next_left = major_boxes[i + 1][0] if i < FRAMES - 1 else rgba.width
        crop = (
            max(0, box[0] - pad_x, prev_right + 4 if i > 0 else 0),
            max(0, box[1] - pad_y),
            min(rgba.width, box[2] + pad_x, next_left - 4 if i < FRAMES - 1 else rgba.width),
            min(rgba.height, box[3] + pad_y),
        )
        frames.append(rgba.crop(crop))

    return frames


def fit_frame(frame: Image.Image, index: int) -> Image.Image:
    bbox = occupied_bbox(frame)
    crop = frame.crop(bbox)
    target_h = int(CELL_H * HEIGHT_RATIOS[index])
    target_w = int(CELL_W * WIDTH_RATIOS[index])
    height_scale = target_h / crop.height
    new_h = max(1, int(round(crop.height * height_scale)))
    new_w = max(1, int(round(crop.width * height_scale)))
    # This is a signature/super slash, not a normal projectile. If preserving
    # the source aspect ratio would leave the wave compact inside the cell,
    # widen it inside the frame instead of shrinking it down.
    if new_w < target_w:
        new_w = target_w
    elif new_w > CELL_W - 96:
        width_scale = (CELL_W - 96) / new_w
        new_w = int(round(new_w * width_scale))
        new_h = int(round(new_h * width_scale))
    enlarged = crop.resize((new_w, new_h), Image.Resampling.LANCZOS)

    cell = Image.new("RGBA", (CELL_W, CELL_H), KEY)
    x = (CELL_W - new_w) // 2 + X_OFFSETS[index]
    y = (CELL_H - new_h) // 2
    x = max(36, min(CELL_W - new_w - 36, x))
    y = max(42, min(CELL_H - new_h - 42, y))
    cell.alpha_composite(enlarged, (x, y))
    return cell


def chroma_to_transparent(sheet: Image.Image) -> Image.Image:
    rgba = sheet.convert("RGBA")
    pixels = rgba.load()
    for y in range(rgba.height):
        for x in range(rgba.width):
            if pixels[x, y][:3] == KEY[:3]:
                pixels[x, y] = (255, 0, 255, 0)
    return rgba


def validate(sheet: Image.Image, transparent: Image.Image) -> None:
    if sheet.size != (CELL_W * FRAMES, CELL_H):
        raise AssertionError(f"unexpected sheet size {sheet.size}")
    if transparent.size != sheet.size:
        raise AssertionError("transparent output size mismatch")

    for corner in ((0, 0), (sheet.width - 1, 0), (0, sheet.height - 1), (sheet.width - 1, sheet.height - 1)):
        if sheet.getpixel(corner) != KEY:
            raise AssertionError(f"chroma corner {corner} is {sheet.getpixel(corner)}, expected {KEY}")
        if transparent.getpixel(corner)[3] != 0:
            raise AssertionError(f"transparent corner {corner} is not transparent")

    for i in range(FRAMES):
        cell = transparent.crop((i * CELL_W, 0, (i + 1) * CELL_W, CELL_H))
        bbox = occupied_bbox(cell)
        occ_w = bbox[2] - bbox[0]
        occ_h = bbox[3] - bbox[1]
        height_ratio = occ_h / CELL_H
        if i in (3, 4) and not (0.60 <= height_ratio <= 0.80):
            raise AssertionError(f"peak frame {i + 1} height ratio {height_ratio:.2%} is outside 60-80%")
        if bbox[0] <= 0 or bbox[1] <= 0 or bbox[2] >= CELL_W or bbox[3] >= CELL_H:
            raise AssertionError(f"frame {i + 1} is cropped at cell edge: {bbox}")
        if i in (3, 4) and occ_w < CELL_W * 0.74:
            raise AssertionError(f"peak frame {i + 1} is too narrow: {occ_w}px")


def main() -> None:
    source = Image.open(SOURCE).convert("RGBA")
    source_frames = split_source_frames(source)
    chroma_cells = [fit_frame(frame, i) for i, frame in enumerate(source_frames)]

    chroma_sheet = Image.new("RGBA", (CELL_W * FRAMES, CELL_H), KEY)
    for i, cell in enumerate(chroma_cells):
        chroma_sheet.alpha_composite(cell, (i * CELL_W, 0))

    transparent_sheet = chroma_to_transparent(chroma_sheet)
    validate(chroma_sheet, transparent_sheet)

    CHROMA_OUT.parent.mkdir(parents=True, exist_ok=True)
    chroma_sheet.save(CHROMA_OUT)
    transparent_sheet.save(RUNTIME_OUT)

    print(f"wrote chroma={CHROMA_OUT}")
    print(f"wrote runtime={RUNTIME_OUT}")
    print(f"sheet={transparent_sheet.size} cell={CELL_W}x{CELL_H} frames={FRAMES}")
    for i in range(FRAMES):
        cell = transparent_sheet.crop((i * CELL_W, 0, (i + 1) * CELL_W, CELL_H))
        bbox = occupied_bbox(cell)
        print(
            f"frame {i + 1}: bbox={bbox} "
            f"size={bbox[2] - bbox[0]}x{bbox[3] - bbox[1]} "
            f"height_ratio={(bbox[3] - bbox[1]) / CELL_H:.1%}"
        )


if __name__ == "__main__":
    main()
