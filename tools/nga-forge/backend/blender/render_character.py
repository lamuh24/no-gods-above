"""NGA Forge preset renderer. Run inside Blender:

blender --background --python render_character.py -- --input clean.glb --spec spec.json

spec.json:
{
  "targetHeight": 2.05,
  "outputs": [
    {"file": "...png", "width": 448, "height": 448, "camera": "front_three_quarter", "transparent": true}
  ]
}

The camera positions and light rig below are the SHARED 2.5D look for every
No Gods Above character — change them here and every character changes together.
"""

from __future__ import annotations

import argparse
import json
import sys
from pathlib import Path

import bpy
from mathutils import Vector


def parse_args() -> argparse.Namespace:
    argv = sys.argv[sys.argv.index("--") + 1 :] if "--" in sys.argv else []
    parser = argparse.ArgumentParser(description="Render NGA Forge character presets.")
    parser.add_argument("--input", required=True)
    parser.add_argument("--spec", required=True)
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


def add_lights() -> None:
    # Fixed three-point-ish rig: identical lighting across the whole roster.
    bpy.ops.object.light_add(type="AREA", location=(2.4, -4.2, 4.6))
    key = bpy.context.object
    key.name = "NGA Key"
    key.data.energy = 620
    key.data.size = 4.5

    bpy.ops.object.light_add(type="AREA", location=(-3.4, -2.2, 3.2))
    fill = bpy.context.object
    fill.name = "NGA Fill"
    fill.data.energy = 180
    fill.data.size = 5.0

    bpy.ops.object.light_add(type="POINT", location=(-1.2, 3.4, 3.4))
    rim = bpy.context.object
    rim.name = "NGA Rim"
    rim.data.energy = 240


def camera_for(view: str, target_height: float) -> tuple[Vector, Vector]:
    """Return (camera location, look-at target) for a named camera. Floor is z=0."""
    h = target_height
    positions = {
        "front": (Vector((0.0, -4.6, h * 0.55)), Vector((0.0, 0.0, h * 0.5))),
        "side": (Vector((4.6, 0.0, h * 0.55)), Vector((0.0, 0.0, h * 0.5))),
        "back": (Vector((0.0, 4.6, h * 0.55)), Vector((0.0, 0.0, h * 0.5))),
        # The fighting-game camera: slightly above waist height, 3/4 angle, fixed baseline.
        "front_three_quarter": (Vector((2.55, -4.05, h * 0.58)), Vector((0.0, 0.0, h * 0.5))),
        # Bust framing for select portraits.
        "portrait": (Vector((0.9, -1.85, h * 0.86)), Vector((0.0, 0.0, h * 0.82))),
        # Low hero angle for splash/trailer drafts.
        "hero": (Vector((2.3, -3.4, h * 0.34)), Vector((0.0, 0.0, h * 0.62))),
    }
    return positions.get(view, positions["front_three_quarter"])


def add_camera() -> bpy.types.Object:
    bpy.ops.object.camera_add(location=(0, -4.6, 1.2))
    camera = bpy.context.object
    bpy.context.scene.camera = camera
    return camera


def aim(camera: bpy.types.Object, location: Vector, target: Vector) -> None:
    camera.location = location
    direction = target - camera.location
    camera.rotation_euler = direction.to_track_quat("-Z", "Y").to_euler()


def configure_render() -> None:
    scene = bpy.context.scene
    engines = [item.identifier for item in scene.render.bl_rna.properties["engine"].enum_items]
    scene.render.engine = "BLENDER_EEVEE_NEXT" if "BLENDER_EEVEE_NEXT" in engines else "BLENDER_EEVEE"
    scene.view_settings.view_transform = "Standard"
    scene.view_settings.look = "Medium High Contrast"


def main() -> None:
    args = parse_args()
    spec = json.loads(Path(args.spec).read_text(encoding="utf-8"))
    target_height = float(spec.get("targetHeight") or 2.05)

    clear_scene()
    import_model(Path(args.input))
    add_lights()
    camera = add_camera()
    configure_render()

    scene = bpy.context.scene
    for output in spec["outputs"]:
        location, look_at = camera_for(output.get("camera", "front_three_quarter"), target_height)
        aim(camera, location, look_at)
        scene.render.resolution_x = int(output["width"])
        scene.render.resolution_y = int(output["height"])
        scene.render.film_transparent = bool(output.get("transparent", True))
        out_path = Path(output["file"])
        out_path.parent.mkdir(parents=True, exist_ok=True)
        scene.render.filepath = str(out_path)
        bpy.ops.render.render(write_still=True)


if __name__ == "__main__":
    main()
