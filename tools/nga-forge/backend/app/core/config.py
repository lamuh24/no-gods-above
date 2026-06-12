from __future__ import annotations

import json
import os
import shutil
import threading
from pathlib import Path
from typing import Any

from .paths import DEFAULT_EXPORT_ROOT, PROJECT_DIR, ensure_data_dirs

SETTINGS_FILE = PROJECT_DIR / "project.json"

_DEFAULTS: dict[str, Any] = {
    "exportRoot": str(DEFAULT_EXPORT_ROOT),
    "blenderPath": "",
}

_lock = threading.RLock()


def load_settings() -> dict[str, Any]:
    with _lock:
        if SETTINGS_FILE.exists():
            try:
                stored = json.loads(SETTINGS_FILE.read_text(encoding="utf-8"))
            except json.JSONDecodeError:
                stored = {}
        else:
            stored = {}
        merged = {**_DEFAULTS, **{k: v for k, v in stored.items() if k in _DEFAULTS}}
        return merged


def update_settings(changes: dict[str, Any]) -> dict[str, Any]:
    with _lock:
        ensure_data_dirs()
        settings = load_settings()
        for key in _DEFAULTS:
            if key in changes and changes[key] is not None:
                settings[key] = str(changes[key])
        SETTINGS_FILE.write_text(json.dumps(settings, indent=2), encoding="utf-8")
        return settings


def find_blender() -> str | None:
    """Resolve the Blender executable: settings, then NGA_FORGE_BLENDER, then PATH."""
    settings = load_settings()
    configured = settings.get("blenderPath") or ""
    if configured and Path(configured).exists():
        return configured
    env_path = os.environ.get("NGA_FORGE_BLENDER")
    if env_path and Path(env_path).exists():
        return env_path
    return shutil.which("blender")


def export_root() -> Path:
    return Path(load_settings()["exportRoot"])
