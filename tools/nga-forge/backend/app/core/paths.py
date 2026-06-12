from __future__ import annotations

from pathlib import Path

BACKEND_DIR = Path(__file__).resolve().parents[2]
FORGE_ROOT = BACKEND_DIR.parent

BLENDER_SCRIPTS_DIR = BACKEND_DIR / "blender"
DATA_DIR = BACKEND_DIR / "data"
PROJECT_DIR = DATA_DIR / "project"
CHARACTERS_DIR = PROJECT_DIR / "characters"
JOBS_DIR = DATA_DIR / "jobs"
TMP_DIR = DATA_DIR / "tmp"

DEFAULT_EXPORT_ROOT = FORGE_ROOT / "export"


def ensure_data_dirs() -> None:
    for directory in (DATA_DIR, PROJECT_DIR, CHARACTERS_DIR, JOBS_DIR, TMP_DIR):
        directory.mkdir(parents=True, exist_ok=True)


def character_dir(slug: str) -> Path:
    return CHARACTERS_DIR / slug


def safe_character_file(slug: str, relpath: str) -> Path:
    """Resolve a path inside a character folder, refusing traversal outside it."""
    base = character_dir(slug).resolve()
    candidate = (base / relpath).resolve()
    if base != candidate and base not in candidate.parents:
        raise ValueError(f"Path '{relpath}' escapes the character folder.")
    return candidate
