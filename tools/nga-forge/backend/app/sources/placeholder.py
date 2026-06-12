from __future__ import annotations

import json
import struct
from pathlib import Path

from ..core.paths import character_dir
from .base import ProgressCallback, SourceResult


def _box_vertices(cx: float, cy: float, cz: float, sx: float, sy: float, sz: float) -> tuple[list[float], list[float], list[int]]:
    x0, x1 = cx - sx / 2.0, cx + sx / 2.0
    y0, y1 = cy - sy / 2.0, cy + sy / 2.0
    z0, z1 = cz - sz / 2.0, cz + sz / 2.0
    faces = [
        ((x0, y0, z1), (x1, y0, z1), (x1, y1, z1), (x0, y1, z1), (0, 0, 1)),
        ((x1, y0, z0), (x0, y0, z0), (x0, y1, z0), (x1, y1, z0), (0, 0, -1)),
        ((x0, y1, z1), (x1, y1, z1), (x1, y1, z0), (x0, y1, z0), (0, 1, 0)),
        ((x0, y0, z0), (x1, y0, z0), (x1, y0, z1), (x0, y0, z1), (0, -1, 0)),
        ((x1, y0, z1), (x1, y0, z0), (x1, y1, z0), (x1, y1, z1), (1, 0, 0)),
        ((x0, y0, z0), (x0, y0, z1), (x0, y1, z1), (x0, y1, z0), (-1, 0, 0)),
    ]
    positions: list[float] = []
    normals: list[float] = []
    indices: list[int] = []
    for face in faces:
        offset = len(positions) // 3
        normal = face[-1]
        for vertex in face[:4]:
            positions.extend(vertex)
            normals.extend(normal)
        indices.extend([offset, offset + 1, offset + 2, offset, offset + 2, offset + 3])
    return positions, normals, indices


def _merge_boxes(boxes: list[tuple[float, float, float, float, float, float]]) -> tuple[list[float], list[float], list[int]]:
    positions: list[float] = []
    normals: list[float] = []
    indices: list[int] = []
    for box in boxes:
        p, n, idx = _box_vertices(*box)
        base = len(positions) // 3
        positions.extend(p)
        normals.extend(n)
        indices.extend([i + base for i in idx])
    return positions, normals, indices


def _align(data: bytearray) -> None:
    while len(data) % 4:
        data.append(0)


def _pack_floats(values: list[float]) -> bytes:
    return struct.pack("<" + "f" * len(values), *values)


def _pack_indices(values: list[int]) -> bytes:
    return struct.pack("<" + "H" * len(values), *values)


def _append_buffer(blob: bytearray, payload: bytes) -> tuple[int, int]:
    _align(blob)
    offset = len(blob)
    blob.extend(payload)
    _align(blob)
    return offset, len(payload)


def _accessor_minmax(positions: list[float]) -> tuple[list[float], list[float]]:
    xs = positions[0::3]
    ys = positions[1::3]
    zs = positions[2::3]
    return [min(xs), min(ys), min(zs)], [max(xs), max(ys), max(zs)]


def write_placeholder_glb(path: Path, character_name: str, target_height: float) -> None:
    scale = max(0.25, float(target_height)) / 2.05
    material_boxes = [
        [
            (0.0, 0.86 * scale, 0.0, 0.48 * scale, 0.84 * scale, 0.24 * scale),
            (0.0, 1.38 * scale, 0.0, 0.38 * scale, 0.42 * scale, 0.22 * scale),
            (-0.44 * scale, 1.05 * scale, 0.0, 0.18 * scale, 0.76 * scale, 0.18 * scale),
            (0.44 * scale, 1.05 * scale, 0.0, 0.18 * scale, 0.76 * scale, 0.18 * scale),
        ],
        [
            (0.0, 1.72 * scale, 0.0, 0.34 * scale, 0.34 * scale, 0.32 * scale),
            (-0.18 * scale, 0.34 * scale, 0.0, 0.2 * scale, 0.68 * scale, 0.18 * scale),
            (0.18 * scale, 0.34 * scale, 0.0, 0.2 * scale, 0.68 * scale, 0.18 * scale),
        ],
        [
            (0.0, 1.13 * scale, -0.14 * scale, 0.09 * scale, 0.94 * scale, 0.04 * scale),
            (0.0, 0.08 * scale, 0.0, 0.7 * scale, 0.04 * scale, 0.32 * scale),
            (0.52 * scale, 0.82 * scale, 0.08 * scale, 0.16 * scale, 0.16 * scale, 0.16 * scale),
        ],
    ]
    materials = [
        {
            "name": "placeholder_white_coat",
            "pbrMetallicRoughness": {"baseColorFactor": [0.86, 0.88, 0.82, 1], "roughnessFactor": 0.88, "metallicFactor": 0.0},
        },
        {
            "name": "placeholder_inner_body",
            "pbrMetallicRoughness": {"baseColorFactor": [0.04, 0.05, 0.07, 1], "roughnessFactor": 0.78, "metallicFactor": 0.0},
        },
        {
            "name": "placeholder_cyan_gold_accents",
            "pbrMetallicRoughness": {"baseColorFactor": [0.12, 0.78, 0.86, 1], "roughnessFactor": 0.35, "metallicFactor": 0.1},
        },
    ]

    blob = bytearray()
    buffer_views: list[dict] = []
    accessors: list[dict] = []
    primitives: list[dict] = []

    for material_index, boxes in enumerate(material_boxes):
        positions, normals, indices = _merge_boxes(boxes)
        pos_offset, pos_len = _append_buffer(blob, _pack_floats(positions))
        norm_offset, norm_len = _append_buffer(blob, _pack_floats(normals))
        idx_offset, idx_len = _append_buffer(blob, _pack_indices(indices))

        pos_view = len(buffer_views)
        buffer_views.append({"buffer": 0, "byteOffset": pos_offset, "byteLength": pos_len, "target": 34962})
        norm_view = len(buffer_views)
        buffer_views.append({"buffer": 0, "byteOffset": norm_offset, "byteLength": norm_len, "target": 34962})
        idx_view = len(buffer_views)
        buffer_views.append({"buffer": 0, "byteOffset": idx_offset, "byteLength": idx_len, "target": 34963})

        pos_min, pos_max = _accessor_minmax(positions)
        pos_accessor = len(accessors)
        accessors.append(
            {
                "bufferView": pos_view,
                "byteOffset": 0,
                "componentType": 5126,
                "count": len(positions) // 3,
                "type": "VEC3",
                "min": pos_min,
                "max": pos_max,
            }
        )
        norm_accessor = len(accessors)
        accessors.append({"bufferView": norm_view, "byteOffset": 0, "componentType": 5126, "count": len(normals) // 3, "type": "VEC3"})
        idx_accessor = len(accessors)
        accessors.append({"bufferView": idx_view, "byteOffset": 0, "componentType": 5123, "count": len(indices), "type": "SCALAR"})

        primitives.append(
            {
                "attributes": {"POSITION": pos_accessor, "NORMAL": norm_accessor},
                "indices": idx_accessor,
                "material": material_index,
            }
        )

    gltf = {
        "asset": {"version": "2.0", "generator": "NGA Forge placeholder GLB generator"},
        "scene": 0,
        "scenes": [{"name": "NGA Forge Placeholder Scene", "nodes": [0]}],
        "nodes": [{"name": f"{character_name} placeholder fighter", "mesh": 0}],
        "meshes": [{"name": "placeholder_fighting_game_character", "primitives": primitives}],
        "materials": materials,
        "buffers": [{"byteLength": len(blob)}],
        "bufferViews": buffer_views,
        "accessors": accessors,
        "extras": {"ngaForgePlaceholder": True, "targetHeight": target_height},
    }
    json_bytes = json.dumps(gltf, separators=(",", ":")).encode("utf-8")
    while len(json_bytes) % 4:
        json_bytes += b" "

    bin_bytes = bytes(blob)
    while len(bin_bytes) % 4:
        bin_bytes += b"\x00"

    total_len = 12 + 8 + len(json_bytes) + 8 + len(bin_bytes)
    header = struct.pack("<4sII", b"glTF", 2, total_len)
    json_chunk = struct.pack("<I4s", len(json_bytes), b"JSON") + json_bytes
    bin_chunk = struct.pack("<I4s", len(bin_bytes), b"BIN\x00") + bin_bytes
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_bytes(header + json_chunk + bin_chunk)


def generate(record: dict, progress: ProgressCallback) -> SourceResult:
    slug = record["id"]
    target_height = float((record.get("model") or {}).get("targetHeight") or 2.05)
    rel = f"model/source/{slug}_model.glb"
    target = character_dir(slug) / rel
    progress(30, "building placeholder mannequin mesh")
    write_placeholder_glb(target, record.get("name", slug), target_height)
    progress(85, "placeholder model written")
    return SourceResult(
        relpath=rel,
        source_format="glb",
        placeholder=True,
        warnings=["This model is the NGA Forge placeholder mannequin, not a real character reconstruction."],
        metadata={"targetHeight": target_height},
    )
