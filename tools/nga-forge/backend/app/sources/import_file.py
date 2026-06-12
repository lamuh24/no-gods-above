from __future__ import annotations

from pathlib import Path

from ..core.paths import character_dir
from .base import SourceResult

SUPPORTED_FORMATS = (".glb", ".gltf", ".fbx", ".obj")
MAX_SIZE_BYTES = 300 * 1024 * 1024


def store_imported_model(slug: str, data: bytes, original_name: str) -> SourceResult:
    suffix = Path(original_name or "").suffix.lower()
    if suffix not in SUPPORTED_FORMATS:
        raise ValueError(f"Unsupported model format '{suffix or '(none)'}'. Use GLB, GLTF, FBX, or OBJ.")
    if len(data) > MAX_SIZE_BYTES:
        raise ValueError("Model file is larger than 300 MB.")
    if len(data) < 16:
        raise ValueError("Model file is empty or truncated.")

    warnings: list[str] = []
    if suffix == ".glb" and data[:4] != b"glTF":
        raise ValueError("File has a .glb extension but is not a valid binary glTF (missing glTF magic header).")
    if suffix in (".gltf", ".fbx", ".obj"):
        warnings.append("Non-GLB sources may reference external textures/buffers that were not uploaded. Run Blender cleanup to bake a self-contained GLB.")

    source_dir = character_dir(slug) / "model" / "source"
    source_dir.mkdir(parents=True, exist_ok=True)
    # One source model per character: clear previous source files so stale formats don't linger.
    for existing in source_dir.iterdir():
        if existing.is_file():
            existing.unlink()

    rel = f"model/source/{slug}_model{suffix}"
    (character_dir(slug) / rel).write_bytes(data)
    return SourceResult(
        relpath=rel,
        source_format=suffix.lstrip("."),
        placeholder=False,
        warnings=warnings,
        metadata={"originalName": original_name, "sizeBytes": len(data)},
    )
