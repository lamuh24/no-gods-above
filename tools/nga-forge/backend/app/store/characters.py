from __future__ import annotations

import json
import re
import threading
import time
import uuid
from pathlib import Path
from typing import Any

from ..core import statuses
from ..core.paths import CHARACTERS_DIR, character_dir, ensure_data_dirs

SCHEMA_VERSION = 1

REFERENCE_LABELS = (
    "main_design",
    "front_view",
    "side_view",
    "back_view",
    "expression",
    "outfit",
    "weapon",
    "trailer_style",
    "lore_world",
)

LORE_FIELDS = (
    "powerSource",
    "personality",
    "fightingStyle",
    "visualMotifs",
    "loreSummary",
    "storyArcNotes",
    "trailerHook",
    "seriesNotes",
)

ANIMATION_SOURCES = (
    "unassigned",
    "mixamo",
    "ai_mocap",
    "video_to_animation",
    "cascadeur",
    "blender",
    "custom",
)

DEFAULT_ANIMATION_SLOTS = (
    ("idle", "movement"),
    ("walk", "movement"),
    ("run", "movement"),
    ("jump", "movement"),
    ("fall", "movement"),
    ("land", "movement"),
    ("light_attack", "attack"),
    ("medium_attack", "attack"),
    ("heavy_attack", "attack"),
    ("special_1", "special"),
    ("special_2", "special"),
    ("hitstun", "reaction"),
    ("knockdown", "reaction"),
    ("ultimate_pose", "cinematic"),
    ("trailer_pose_1", "cinematic"),
)

ROSTER_SEED = (
    ("Lamuh", "protagonist"),
    ("Celeste", "roster"),
    ("Sol", "roster"),
    ("Seris", "roster"),
    ("Nyx", "roster"),
    ("Kairo", "roster"),
    ("Vanta Reign", "roster"),
)

RENDER_KEYS = (
    "preview25d",
    "turntableFront",
    "turntableSide",
    "turntableBack",
    "turntableThreeQuarter",
    "portraitSelect",
    "splash",
)


def now_iso() -> str:
    return time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime())


def slugify(name: str) -> str:
    slug = re.sub(r"[^a-z0-9]+", "-", name.strip().lower()).strip("-")
    return slug or "character"


def default_animation_slots() -> list[dict[str, Any]]:
    slots = []
    for name, category in DEFAULT_ANIMATION_SLOTS:
        slots.append(
            {
                "name": name,
                "category": category,
                "status": "planned",
                "source": "unassigned",
                "clipFile": None,
                "frameData": {"startup": None, "active": None, "recovery": None},
                "hitboxEvents": [],
                "rootMotion": False,
                "spriteExportRange": {"start": None, "end": None},
                "notes": "",
            }
        )
    return slots


def new_character(slug: str, name: str, title: str = "", faction: str = "", role: str = "roster") -> dict[str, Any]:
    now = now_iso()
    return {
        "schemaVersion": SCHEMA_VERSION,
        "id": slug,
        "name": name,
        "title": title,
        "faction": faction,
        "role": role,
        "lore": {
            "powerSource": "",
            "personality": "",
            "fightingStyle": "",
            "visualMotifs": "",
            "colorPalette": [],
            "loreSummary": "",
            "storyArcNotes": "",
            "trailerHook": "",
            "seriesNotes": "",
        },
        "references": [],
        "model": {
            "sourceMode": None,
            "sourceFile": None,
            "sourceFormat": None,
            "cleanFile": None,
            "targetHeight": 2.05,
            "toonMaterial": True,
            "lastCleanupJobId": None,
            "warnings": [],
        },
        "renders": {key: None for key in RENDER_KEYS} | {"lastRenderJobId": None},
        "animations": default_animation_slots(),
        "pipeline": {step: {"status": statuses.NOT_STARTED, "updatedAt": now} for step in statuses.PIPELINE_STEPS},
        "createdAt": now,
        "updatedAt": now,
    }


def derive_statuses(record: dict[str, Any]) -> None:
    """Recompute the statuses that are purely derivable from data (not job-driven)."""
    pipeline = record["pipeline"]

    def put(step: str, status: str) -> None:
        if pipeline[step]["status"] != status:
            pipeline[step] = {"status": status, "updatedAt": now_iso()}

    put("profile", statuses.READY if record.get("name") else statuses.NOT_STARTED)
    put("references", statuses.READY if record.get("references") else statuses.NEEDS_REFERENCE)

    model = record.get("model") or {}
    if pipeline["model"]["status"] not in (statuses.PROCESSING, statuses.FAILED):
        if not model.get("sourceFile"):
            put("model", statuses.NOT_STARTED)
        elif model.get("sourceMode") == "placeholder":
            put("model", statuses.PLACEHOLDER)
        else:
            put("model", statuses.READY)

    animations = record.get("animations") or []
    planned = all((slot.get("status") or "planned") == "planned" for slot in animations)
    has_frame_data = any(
        any(value is not None for value in (slot.get("frameData") or {}).values()) for slot in animations
    )
    if pipeline["animation"]["status"] not in (statuses.PROCESSING,):
        put("animation", statuses.READY if (has_frame_data or not planned) else statuses.NOT_STARTED)


def lore_markdown(record: dict[str, Any]) -> str:
    lore = record.get("lore") or {}
    palette = ", ".join(lore.get("colorPalette") or []) or "(none set)"
    sections = [
        f"# {record.get('name', 'Unknown')} — {record.get('title') or 'Untitled'}",
        "",
        f"- **Faction:** {record.get('faction') or '(none)'}",
        f"- **Role:** {record.get('role') or '(none)'}",
        f"- **Color palette:** {palette}",
        "",
    ]
    labels = {
        "powerSource": "Power Source",
        "personality": "Personality",
        "fightingStyle": "Fighting Style",
        "visualMotifs": "Visual Motifs",
        "loreSummary": "Lore Summary",
        "storyArcNotes": "Story Arc Notes",
        "trailerHook": "Trailer Hook",
        "seriesNotes": "Series / Episode Notes",
    }
    for key, label in labels.items():
        sections.append(f"## {label}")
        sections.append("")
        sections.append(lore.get(key) or "_Not written yet._")
        sections.append("")
    return "\n".join(sections)


class CharacterStore:
    def __init__(self) -> None:
        ensure_data_dirs()
        self._lock = threading.RLock()

    # ---------- persistence ----------

    def _file(self, slug: str) -> Path:
        return character_dir(slug) / "character.json"

    def exists(self, slug: str) -> bool:
        return self._file(slug).exists()

    def get(self, slug: str) -> dict[str, Any] | None:
        with self._lock:
            path = self._file(slug)
            if not path.exists():
                return None
            try:
                return json.loads(path.read_text(encoding="utf-8"))
            except json.JSONDecodeError:
                return None

    def save(self, record: dict[str, Any]) -> dict[str, Any]:
        with self._lock:
            derive_statuses(record)
            record["updatedAt"] = now_iso()
            char_dir = character_dir(record["id"])
            char_dir.mkdir(parents=True, exist_ok=True)
            self._file(record["id"]).write_text(json.dumps(record, indent=2), encoding="utf-8")
            (char_dir / "lore.md").write_text(lore_markdown(record), encoding="utf-8")
            return record

    # ---------- roster ----------

    def list_slugs(self) -> list[str]:
        if not CHARACTERS_DIR.exists():
            return []
        return sorted(p.name for p in CHARACTERS_DIR.iterdir() if (p / "character.json").exists())

    def summaries(self) -> list[dict[str, Any]]:
        result = []
        for slug in self.list_slugs():
            record = self.get(slug)
            if not record:
                continue
            result.append(self.summary(record))
        return result

    def summary(self, record: dict[str, Any]) -> dict[str, Any]:
        thumbnail = None
        refs = record.get("references") or []
        for ref in refs:
            if ref.get("label") == "main_design":
                thumbnail = ref.get("file")
                break
        if not thumbnail and refs:
            thumbnail = refs[0].get("file")
        return {
            "id": record["id"],
            "name": record.get("name", record["id"]),
            "title": record.get("title", ""),
            "faction": record.get("faction", ""),
            "role": record.get("role", ""),
            "colorPalette": (record.get("lore") or {}).get("colorPalette") or [],
            "thumbnail": thumbnail,
            "referenceCount": len(refs),
            "pipeline": record.get("pipeline", {}),
            "updatedAt": record.get("updatedAt"),
        }

    def create(self, name: str, title: str = "", faction: str = "", role: str = "roster") -> dict[str, Any]:
        with self._lock:
            slug = slugify(name)
            if self.exists(slug):
                raise ValueError(f"Character '{slug}' already exists.")
            record = new_character(slug, name.strip(), title.strip(), faction.strip(), role.strip() or "roster")
            return self.save(record)

    def delete(self, slug: str) -> None:
        import shutil

        with self._lock:
            char_dir = character_dir(slug)
            if char_dir.exists():
                shutil.rmtree(char_dir)

    def ensure_seed(self) -> None:
        with self._lock:
            if self.list_slugs():
                return
            for name, role in ROSTER_SEED:
                self.create(name, role=role)

    # ---------- controlled patching ----------

    def patch(self, slug: str, payload: dict[str, Any]) -> dict[str, Any]:
        with self._lock:
            record = self.get(slug)
            if not record:
                raise KeyError(slug)
            for key in ("name", "title", "faction", "role"):
                if key in payload and isinstance(payload[key], str):
                    record[key] = payload[key].strip()
            lore_patch = payload.get("lore")
            if isinstance(lore_patch, dict):
                for key in LORE_FIELDS:
                    if key in lore_patch and isinstance(lore_patch[key], str):
                        record["lore"][key] = lore_patch[key]
                if "colorPalette" in lore_patch and isinstance(lore_patch["colorPalette"], list):
                    record["lore"]["colorPalette"] = [str(c) for c in lore_patch["colorPalette"]][:8]
            model_patch = payload.get("model")
            if isinstance(model_patch, dict):
                if "targetHeight" in model_patch:
                    try:
                        record["model"]["targetHeight"] = max(0.25, min(20.0, float(model_patch["targetHeight"])))
                    except (TypeError, ValueError):
                        pass
                if "toonMaterial" in model_patch:
                    record["model"]["toonMaterial"] = bool(model_patch["toonMaterial"])
            return self.save(record)

    def set_animations(self, slug: str, animations: list[dict[str, Any]]) -> dict[str, Any]:
        with self._lock:
            record = self.get(slug)
            if not record:
                raise KeyError(slug)
            cleaned = []
            for slot in animations:
                if not isinstance(slot, dict) or not slot.get("name"):
                    continue
                frame_data = slot.get("frameData") or {}
                sprite_range = slot.get("spriteExportRange") or {}
                cleaned.append(
                    {
                        "name": str(slot["name"]),
                        "category": str(slot.get("category") or "movement"),
                        "status": str(slot.get("status") or "planned"),
                        "source": slot.get("source") if slot.get("source") in ANIMATION_SOURCES else "unassigned",
                        "clipFile": slot.get("clipFile"),
                        "frameData": {
                            "startup": _opt_int(frame_data.get("startup")),
                            "active": _opt_int(frame_data.get("active")),
                            "recovery": _opt_int(frame_data.get("recovery")),
                        },
                        "hitboxEvents": slot.get("hitboxEvents") if isinstance(slot.get("hitboxEvents"), list) else [],
                        "rootMotion": bool(slot.get("rootMotion")),
                        "spriteExportRange": {
                            "start": _opt_int(sprite_range.get("start")),
                            "end": _opt_int(sprite_range.get("end")),
                        },
                        "notes": str(slot.get("notes") or ""),
                    }
                )
            record["animations"] = cleaned
            return self.save(record)

    # ---------- references ----------

    def add_reference(self, slug: str, data: bytes, original_name: str, label: str, notes: str = "") -> dict[str, Any]:
        with self._lock:
            record = self.get(slug)
            if not record:
                raise KeyError(slug)
            if label not in REFERENCE_LABELS:
                label = "main_design"
            ref_id = f"ref_{uuid.uuid4().hex[:8]}"
            suffix = Path(original_name or "reference.png").suffix.lower()
            if suffix not in (".png", ".jpg", ".jpeg", ".webp", ".gif"):
                suffix = ".png"
            rel = f"references/{ref_id}{suffix}"
            target = character_dir(slug) / rel
            target.parent.mkdir(parents=True, exist_ok=True)
            target.write_bytes(data)
            ref = {
                "id": ref_id,
                "file": rel,
                "label": label,
                "originalName": original_name,
                "notes": notes,
                "addedAt": now_iso(),
            }
            record["references"].append(ref)
            self._write_refs_index(slug, record)
            self.save(record)
            return ref

    def update_reference(self, slug: str, ref_id: str, label: str | None, notes: str | None) -> dict[str, Any]:
        with self._lock:
            record = self.get(slug)
            if not record:
                raise KeyError(slug)
            for ref in record["references"]:
                if ref["id"] == ref_id:
                    if label and label in REFERENCE_LABELS:
                        ref["label"] = label
                    if notes is not None:
                        ref["notes"] = str(notes)
                    self._write_refs_index(slug, record)
                    self.save(record)
                    return ref
            raise KeyError(ref_id)

    def delete_reference(self, slug: str, ref_id: str) -> None:
        with self._lock:
            record = self.get(slug)
            if not record:
                raise KeyError(slug)
            remaining = []
            for ref in record["references"]:
                if ref["id"] == ref_id:
                    target = character_dir(slug) / ref["file"]
                    if target.exists():
                        target.unlink()
                else:
                    remaining.append(ref)
            record["references"] = remaining
            self._write_refs_index(slug, record)
            self.save(record)

    def _write_refs_index(self, slug: str, record: dict[str, Any]) -> None:
        refs_dir = character_dir(slug) / "references"
        refs_dir.mkdir(parents=True, exist_ok=True)
        (refs_dir / "refs.json").write_text(json.dumps(record["references"], indent=2), encoding="utf-8")


def _opt_int(value: Any) -> int | None:
    if value is None or value == "":
        return None
    try:
        return int(value)
    except (TypeError, ValueError):
        return None
