from __future__ import annotations

import json
import subprocess
import uuid
from pathlib import Path
from typing import Any

from ..core.config import find_blender
from ..core.paths import BLENDER_SCRIPTS_DIR, TMP_DIR


def blender_status() -> dict[str, Any]:
    path = find_blender()
    return {"available": bool(path), "path": path}


def _run_script(script_name: str, args: list[str], timeout_seconds: int = 900) -> tuple[bool, list[str]]:
    blender = find_blender()
    if not blender:
        return False, [
            "Blender was not found (settings blenderPath, NGA_FORGE_BLENDER, and PATH were all checked). "
            "Install Blender or set the path in Settings to run real processing."
        ]
    script_path = BLENDER_SCRIPTS_DIR / script_name
    cmd = [blender, "--background", "--python", str(script_path), "--", *args]
    try:
        completed = subprocess.run(cmd, capture_output=True, text=True, timeout=timeout_seconds, check=False)
    except subprocess.TimeoutExpired:
        return False, [f"Blender timed out after {timeout_seconds}s running {script_name}."]
    if completed.returncode != 0:
        tail = (completed.stderr.strip() or completed.stdout.strip())[-2000:]
        return False, [f"Blender {script_name} failed (exit {completed.returncode}).", tail or "No Blender output captured."]
    return True, []


def run_cleanup(input_model: Path, output_glb: Path, target_height: float, toon_material: bool) -> tuple[bool, list[str]]:
    output_glb.parent.mkdir(parents=True, exist_ok=True)
    args = [
        "--input", str(input_model),
        "--output", str(output_glb),
        "--target-height", str(target_height),
        "--toon-material", "1" if toon_material else "0",
    ]
    ok, warnings = _run_script("process_model.py", args)
    if ok and not output_glb.exists():
        return False, ["Blender finished but the clean GLB was not written."]
    return ok, warnings


def run_renders(input_model: Path, char_dir: Path, outputs: list[dict[str, Any]], target_height: float) -> tuple[bool, list[str]]:
    spec = {
        "targetHeight": target_height,
        "outputs": [
            {
                "file": str(char_dir / output["file"]),
                "width": output["width"],
                "height": output["height"],
                "camera": output["camera"],
                "transparent": output["transparent"],
            }
            for output in outputs
        ],
    }
    TMP_DIR.mkdir(parents=True, exist_ok=True)
    spec_path = TMP_DIR / f"render_spec_{uuid.uuid4().hex[:8]}.json"
    spec_path.write_text(json.dumps(spec, indent=2), encoding="utf-8")
    try:
        args = ["--input", str(input_model), "--spec", str(spec_path)]
        ok, warnings = _run_script("render_character.py", args, timeout_seconds=1200)
        if ok:
            missing = [output["file"] for output in outputs if not (char_dir / output["file"]).exists()]
            if missing:
                return False, ["Blender finished but some renders were not written: " + ", ".join(missing)]
        return ok, warnings
    finally:
        spec_path.unlink(missing_ok=True)
