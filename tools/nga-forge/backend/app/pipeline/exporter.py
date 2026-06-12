from __future__ import annotations

import json
import shutil
import time
from pathlib import Path
from typing import Any, Callable

from ..core.paths import character_dir
from ..store.characters import lore_markdown

FORGE_VERSION = "0.2.0"


def now_iso() -> str:
    return time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime())


def export_character(
    record: dict[str, Any],
    export_root: Path,
    source_job_ids: list[str] | None = None,
    progress: Callable[[int, str], None] | None = None,
) -> tuple[dict[str, Any], list[str]]:
    """Copy a character's clean assets into the No Gods Above export tree and write manifest.json."""

    def report(value: int, stage: str) -> None:
        if progress:
            progress(value, stage)

    slug = record["id"]
    char_dir = character_dir(slug)
    target = export_root / "no-gods-above-export" / "characters" / slug
    warnings: list[str] = []

    model = record.get("model") or {}
    model_rel = model.get("cleanFile") or model.get("sourceFile")
    if not model_rel:
        raise ValueError("Character has no model to export. Run Step 3 (Model Source) first.")
    model_src = char_dir / model_rel
    if not model_src.exists():
        raise ValueError(f"Model file '{model_rel}' is missing on disk.")
    if not model.get("cleanFile"):
        warnings.append("Exporting the raw source model — Blender cleanup has not produced a clean GLB.")

    report(10, "preparing export folders")
    for sub in ("model", "renders", "spritesheets", "animations", "lore"):
        (target / sub).mkdir(parents=True, exist_ok=True)

    report(25, "copying model")
    model_out_name = f"{slug}_model{model_src.suffix.lower()}"
    shutil.copy2(model_src, target / "model" / model_out_name)

    report(45, "copying renders")
    renders = record.get("renders") or {}
    exported_renders: dict[str, Any] = {}
    render_specs = {
        "preview25d": {"frameSize": 448, "camera": "front_three_quarter", "transparent": True},
        "turntableFront": {"camera": "front"},
        "turntableSide": {"camera": "side"},
        "turntableBack": {"camera": "back"},
        "turntableThreeQuarter": {"camera": "front_three_quarter"},
        "portraitSelect": {"size": [460, 520]},
        "splash": {"size": [1920, 1080]},
    }
    for key, spec in render_specs.items():
        rel = renders.get(key)
        if not rel:
            continue
        src = char_dir / rel
        if not src.exists():
            warnings.append(f"Render '{key}' is recorded but missing on disk; skipped.")
            continue
        shutil.copy2(src, target / "renders" / Path(rel).name)
        exported_renders[key] = {"file": f"renders/{Path(rel).name}", **spec}
    if not exported_renders:
        warnings.append("No renders were exported. Run Step 6 (2.5D Render) for game-ready previews.")

    report(65, "writing animation + lore data")
    animations = record.get("animations") or []
    (target / "animations" / "animations.json").write_text(json.dumps(animations, indent=2), encoding="utf-8")

    lore = record.get("lore") or {}
    lore_json = {
        "id": slug,
        "name": record.get("name"),
        "title": record.get("title"),
        "faction": record.get("faction"),
        "role": record.get("role"),
        **lore,
    }
    (target / "lore" / f"{slug}_lore.json").write_text(json.dumps(lore_json, indent=2), encoding="utf-8")
    (target / "lore" / f"{slug}_lore.md").write_text(lore_markdown(record), encoding="utf-8")

    report(80, "writing manifest")
    is_placeholder = bool(model.get("sourceMode") == "placeholder" or not model.get("cleanFile"))
    clip_count = sum(1 for slot in animations if slot.get("clipFile"))
    manifest = {
        "schemaVersion": 1,
        "forgeVersion": FORGE_VERSION,
        "exportedAt": now_iso(),
        "character": {
            "id": slug,
            "name": record.get("name"),
            "title": record.get("title"),
            "faction": record.get("faction"),
            "colorPalette": lore.get("colorPalette") or [],
        },
        "model": {
            "file": f"model/{model_out_name}",
            "format": model_src.suffix.lstrip(".").lower(),
            "targetHeight": model.get("targetHeight"),
            "originAtFeet": bool(model.get("cleanFile")),
            "processedBy": "blender" if model.get("cleanFile") else "unprocessed_passthrough",
            "warnings": model.get("warnings") or [],
        },
        "renders": exported_renders,
        "spritesheets": [],
        "animations": {"file": "animations/animations.json", "clipCount": clip_count},
        "lore": {"markdown": f"lore/{slug}_lore.md", "json": f"lore/{slug}_lore.json"},
        "sourceJobIds": source_job_ids or [],
        "placeholder": is_placeholder,
    }
    (target / "manifest.json").write_text(json.dumps(manifest, indent=2), encoding="utf-8")

    # Keep a dated manifest copy inside the character folder as export history.
    history_dir = char_dir / "exports"
    history_dir.mkdir(parents=True, exist_ok=True)
    stamp = time.strftime("%Y%m%d_%H%M%S", time.gmtime())
    (history_dir / f"manifest_{stamp}.json").write_text(json.dumps(manifest, indent=2), encoding="utf-8")

    report(95, "export complete")
    return manifest, warnings
