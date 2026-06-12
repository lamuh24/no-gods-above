from __future__ import annotations

import json
import threading
import time
import uuid
from copy import deepcopy
from typing import Any

from ..core.paths import JOBS_DIR, ensure_data_dirs

TERMINAL_STATES = {"completed", "failed", "cancelled"}

JOB_TYPES = {
    "generate_model",
    "cleanup_model",
    "render_character",
    "export_character",
}


def now_iso() -> str:
    return time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime())


class JobStore:
    def __init__(self) -> None:
        ensure_data_dirs()
        self._lock = threading.RLock()
        self._jobs: dict[str, dict[str, Any]] = {}
        self._load_existing()

    def _load_existing(self) -> None:
        for path in sorted(JOBS_DIR.glob("*.json")):
            try:
                record = json.loads(path.read_text(encoding="utf-8"))
            except json.JSONDecodeError:
                continue
            if record.get("id"):
                # A job that was running when the backend stopped can never finish.
                if record.get("status") in ("queued", "running"):
                    record["status"] = "failed"
                    record["error"] = "Backend restarted while the job was running."
                self._jobs[record["id"]] = record

    def create(self, job_type: str, character_id: str, params: dict[str, Any] | None = None) -> dict[str, Any]:
        now = now_iso()
        record = {
            "id": f"job_{uuid.uuid4().hex[:12]}",
            "type": job_type,
            "characterId": character_id,
            "status": "queued",
            "progress": 0,
            "stage": "queued",
            "params": params or {},
            "outputs": {"files": []},
            "warnings": [],
            "error": None,
            "createdAt": now,
            "startedAt": None,
            "finishedAt": None,
        }
        with self._lock:
            self._jobs[record["id"]] = record
            self._persist_locked(record)
            return deepcopy(record)

    def update(self, job_id: str, **changes: Any) -> dict[str, Any]:
        with self._lock:
            record = self._jobs.get(job_id)
            if not record:
                raise KeyError(job_id)
            if changes.get("status") == "running" and not record.get("startedAt"):
                record["startedAt"] = now_iso()
            if changes.get("status") in TERMINAL_STATES:
                record["finishedAt"] = now_iso()
            record.update(changes)
            self._persist_locked(record)
            return deepcopy(record)

    def get(self, job_id: str) -> dict[str, Any] | None:
        with self._lock:
            record = self._jobs.get(job_id)
            return deepcopy(record) if record else None

    def list(self, active_only: bool = False, limit: int = 20) -> list[dict[str, Any]]:
        with self._lock:
            records = sorted(self._jobs.values(), key=lambda r: r.get("createdAt") or "", reverse=True)
            if active_only:
                records = [r for r in records if r.get("status") not in TERMINAL_STATES]
            return [deepcopy(r) for r in records[: max(1, min(limit, 100))]]

    def _persist_locked(self, record: dict[str, Any]) -> None:
        JOBS_DIR.mkdir(parents=True, exist_ok=True)
        (JOBS_DIR / f"{record['id']}.json").write_text(json.dumps(record, indent=2), encoding="utf-8")
