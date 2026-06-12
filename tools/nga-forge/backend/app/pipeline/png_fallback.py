"""Pure-Python transparent PNG stand-ins used when Blender is not available.

These are clearly stylized mannequin silhouettes, never passed off as real renders.
"""

from __future__ import annotations

import math
import struct
import zlib
from pathlib import Path

Color = tuple[int, int, int, int]


def _chunk(kind: bytes, data: bytes) -> bytes:
    return struct.pack(">I", len(data)) + kind + data + struct.pack(">I", zlib.crc32(kind + data) & 0xFFFFFFFF)


def write_png(path: Path, width: int, height: int, pixels: bytearray) -> None:
    raw = bytearray()
    stride = width * 4
    for y in range(height):
        raw.append(0)
        raw.extend(pixels[y * stride : (y + 1) * stride])
    payload = b"".join(
        [
            b"\x89PNG\r\n\x1a\n",
            _chunk(b"IHDR", struct.pack(">IIBBBBB", width, height, 8, 6, 0, 0, 0)),
            _chunk(b"IDAT", zlib.compress(bytes(raw), 9)),
            _chunk(b"IEND", b""),
        ]
    )
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_bytes(payload)


def _set(px: bytearray, width: int, height: int, x: int, y: int, color: Color) -> None:
    if not (0 <= x < width and 0 <= y < height):
        return
    i = (y * width + x) * 4
    src_a = color[3] / 255.0
    dst_a = px[i + 3] / 255.0
    out_a = src_a + dst_a * (1.0 - src_a)
    if out_a <= 0:
        return
    for c in range(3):
        src = color[c] / 255.0
        dst = px[i + c] / 255.0
        px[i + c] = int(round(((src * src_a) + (dst * dst_a * (1.0 - src_a))) / out_a * 255))
    px[i + 3] = int(round(out_a * 255))


def _rect(px: bytearray, width: int, height: int, x0: int, y0: int, x1: int, y1: int, color: Color) -> None:
    for y in range(max(0, y0), min(height, y1)):
        for x in range(max(0, x0), min(width, x1)):
            _set(px, width, height, x, y, color)


def _circle(px: bytearray, width: int, height: int, cx: int, cy: int, radius: int, color: Color) -> None:
    r2 = radius * radius
    for y in range(cy - radius, cy + radius + 1):
        for x in range(cx - radius, cx + radius + 1):
            if (x - cx) * (x - cx) + (y - cy) * (y - cy) <= r2:
                _set(px, width, height, x, y, color)


def _line(px: bytearray, width: int, height: int, x0: int, y0: int, x1: int, y1: int, color: Color, thickness: int = 1) -> None:
    steps = max(abs(x1 - x0), abs(y1 - y0), 1)
    for idx in range(steps + 1):
        t = idx / steps
        x = int(round(x0 + (x1 - x0) * t))
        y = int(round(y0 + (y1 - y0) * t))
        _circle(px, width, height, x, y, max(1, thickness), color)


def render_fallback(path: Path, view: str = "front", width: int = 448, height: int = 448) -> None:
    px = bytearray(width * height * 4)
    center = width // 2
    scale = height / 448

    cyan = (57, 221, 235, 190)
    gold = (238, 188, 92, 210)
    coat = (230, 232, 222, 235)
    inner = (32, 36, 42, 245)
    shadow = (2, 8, 12, 62)
    skin = (98, 68, 48, 245)

    def s(value: int) -> int:
        return int(round(value * scale))

    _circle(px, width, height, center, s(384), s(122), shadow)
    for angle in range(0, 360, 18):
        rad = math.radians(angle)
        _line(
            px,
            width,
            height,
            center,
            s(236),
            center + int(math.cos(rad) * s(74)),
            s(236) + int(math.sin(rad) * s(74)),
            (57, 221, 235, 26),
            1,
        )

    if view == "side":
        body_w = s(58)
        arm_offset = s(28)
    elif view == "back":
        body_w = s(86)
        arm_offset = s(46)
    else:
        body_w = s(78)
        arm_offset = s(54)

    _rect(px, width, height, center - body_w, s(156), center + body_w, s(296), coat)
    _rect(px, width, height, center - s(40), s(180), center + s(40), s(300), inner)
    _rect(px, width, height, center - s(8), s(160), center + s(8), s(302), gold)
    _circle(px, width, height, center, s(120), s(34), skin)
    _rect(px, width, height, center - s(30), s(96), center + s(30), s(116), (22, 20, 22, 245))

    _line(px, width, height, center - arm_offset, s(172), center - s(92), s(278), inner, s(8))
    _line(px, width, height, center + arm_offset, s(172), center + s(92), s(278), inner, s(8))
    _line(px, width, height, center - s(31), s(292), center - s(62), s(394), inner, s(11))
    _line(px, width, height, center + s(31), s(292), center + s(62), s(394), inner, s(11))
    _circle(px, width, height, center + s(96), s(276), s(14), cyan)
    _circle(px, width, height, center + s(96), s(276), s(7), (255, 255, 255, 210))
    _line(px, width, height, center - s(74), s(105), center + s(72), s(328), (238, 188, 92, 88), s(2))

    write_png(path, width, height, px)


CAMERA_TO_VIEW = {
    "front": "front",
    "side": "side",
    "back": "back",
    "front_three_quarter": "front",
    "portrait": "front",
    "hero": "front",
}
