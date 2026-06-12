from __future__ import annotations

from typing import Any

from fastapi import APIRouter, HTTPException

from ..state import jobs

router = APIRouter(prefix="/jobs", tags=["jobs"])


@router.get("")
def list_jobs(active: bool = False, limit: int = 20) -> dict[str, Any]:
    return {"jobs": jobs.list(active_only=active, limit=limit)}


@router.get("/{job_id}")
def get_job(job_id: str) -> dict[str, Any]:
    job = jobs.get(job_id)
    if not job:
        raise HTTPException(status_code=404, detail="Job not found.")
    return job
