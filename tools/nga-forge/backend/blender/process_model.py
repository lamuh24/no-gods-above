"""NGA Forge cleanup pass. Run inside Blender:

blender --background --python process_model.py -- --input src.glb --output clean.glb \
        --target-height 2.05 --toon-material 1

Imports GLB/GLTF/FBX/OBJ, centers the model, puts the feet at world origin,
normalizes height, applies scale, optionally adds a stylized fallback material,
and exports a self-contained clean GLB.
"""

from __future__ import annotations

import argparse
import sys
from pathlib import Path

import bpy
from mathutils import Vector


def parse_args() -> argparse.Namespace:
    argv = sys.argv[sys.argv.index("--") + 1 :] if "--" in sys.argv else []
    parser = argparse.ArgumentParser(description="Clean and normalize a character model for NGA Forge.")
    parser.add_argument("--input", required=True)
    parser.add_argument("--output", required=True)
    parser.add_argument("--target-height", type=float, default=2.05)
    parser.add_argument("--toon-material", default="1")
    return parser.parse_args(argv)


def clear_scene() -> None:
    bpy.ops.object.select_all(action="SELECT")
    bpy.ops.object.delete()


def import_model(path: Path) -> None:
    suffix = path.suffix.lower()
    if suffix in {".glb", ".gltf"}:
        bpy.ops.import_scene.gltf(filepath=str(path))
    elif suffix == ".obj":
        bpy.ops.wm.obj_import(filepath=str(path))
    elif suffix == ".fbx":
        bpy.ops.import_scene.fbx(filepath=str(path))
    else:
        raise ValueError(f"Unsupported model format: {suffix}")


def mesh_objects() -> list[bpy.types.Object]:
    return [obj for obj in bpy.context.scene.objects if obj.type == "MESH"]


def bounds_for(objects: list[bpy.types.Object]) -> tuple[Vector, Vector]:
    points = []
    for obj in objects:
        points.extend(obj.matrix_world @ Vector(corner) for corner in obj.bound_box)
    min_v = Vector((min(p.x for p in points), min(p.y for p in points), min(p.z for p in points)))
    max_v = Vector((max(p.x for p in points), max(p.y for p in points), max(p.z for p in points)))
    return min_v, max_v


def center_origin_and_scale(target_height: float) -> None:
    objects = mesh_objects()
    if not objects:
        raise RuntimeError("No mesh objects were imported.")
    min_v, max_v = bounds_for(objects)
    height = max(max_v.z - min_v.z, 0.001)
    scale = target_height / height

    for obj in objects:
        obj.location.x -= (min_v.x + max_v.x) / 2.0
        obj.location.y -= (min_v.y + max_v.y) / 2.0
        obj.location.z -= min_v.z
        obj.scale *= scale
        bpy.context.view_layer.objects.active = obj
        obj.select_set(True)
        bpy.ops.object.transform_apply(location=False, rotation=True, scale=True)
        obj.select_set(False)

    min_v, _ = bounds_for(objects)
    for obj in objects:
        obj.location.z -= min_v.z


def ensure_toon_material() -> None:
    material = bpy.data.materials.new("NGA Forge Toon Material")
    material.use_nodes = True
    bsdf = material.node_tree.nodes.get("Principled BSDF")
    if bsdf:
        bsdf.inputs["Base Color"].default_value = (0.85, 0.86, 0.8, 1.0)
        bsdf.inputs["Roughness"].default_value = 0.82
        bsdf.inputs["Metallic"].default_value = 0.0
    for obj in mesh_objects():
        if not obj.data.materials:
            obj.data.materials.append(material)


def export_glb(path: Path) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    bpy.ops.export_scene.gltf(filepath=str(path), export_format="GLB", export_apply=True)


def main() -> None:
    args = parse_args()
    clear_scene()
    import_model(Path(args.input))
    center_origin_and_scale(args.target_height)
    if args.toon_material not in ("0", "false", "False"):
        ensure_toon_material()
    export_glb(Path(args.output))


if __name__ == "__main__":
    main()
