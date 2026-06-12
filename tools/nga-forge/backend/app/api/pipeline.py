from __future__ import annotations

import shutil
import threading
from pathlib import Path
from typing import Any

from fastapi import APIRouter, File, HTTPException, UploadFile
from pydantic import BaseModel

from ..core import statuses
from ..core.config import export_root
from ..core.paths import character_dir
from ..pipeline import blender_runner, png_fallback
from ..pipeline.exporter import export_character
from ..pipeline.render_presets import RENDER_PRESETS, outputs_for
from ..sources import import_file, placeholder
from ..state import characters, jobs
from ..store.characters import now_iso

router = APIRouter(prefix="/characters", tags=["pipeline"])


class GenerateRequest(BaseModel):
    sourceMode: str = "placeholder"


class CleanupRequest(BaseModel):
    targetHeight: float | None = None
    toonMaterial: bool | None = None


class RenderRequest(BaseModel):
    presets: list[str]


def _get_or_404(slug: str) -> dict[str, Any]:
    record = characters.get(slug)
    if not record:
        raise HTTPException(status_code=404, detail=f"Character '{slug}' not found.")
    return record


def _spawn(target, *args) -> None:
    threading.Thread(target=target, args=args, daemon=True).start()


def _set_step(slug: str, step: str, status: str) -> None:
    record = characters.get(slug)
    if not record:
        return
    record["pipeline"][step] = {"status": status, "updatedAt": now_iso()}
    characters.save(record)


def _fail(job_id: str, slug: str, step: str, exc: Exception) -> None:
    jobs.update(job_id, status="failed", progress=100, stage="failed", error=str(exc))
    _set_step(slug, step, statuses.FAILED)


def _progress(job_id: str):
    def report(value: int, stage: str) -> None:
        jobs.update(job_id, status="running", progress=max(0, min(value, 99)), stage=stage)

    return report


# ---------- Step 3: model source ----------


@router.post("/{slug}/model/generate")
def generate_model(slug: str, payload: GenerateRequest) -> dict[str, Any]:
    record = _get_or_404(slug)
    if payload.sourceMode != "placeholder":
        raise HTTPException(
            status_code=409,
            detail=f"Source mode '{payload.sourceMode}' is a future adapter and cannot generate yet. Use 'placeholder' or import a model.",
        )
    job = jobs.create("generate_model", slug, {"sourceMode": payload.sourceMode})
    _set_step(slug, "model", statuses.PROCESSING)
    _spawn(_run_generate, job["id"], slug)
    return job


def _run_generate(job_id: str, slug: str) -> None:
    try:
        record = characters.get(slug)
        if not record:
            raise ValueError(f"Character '{slug}' disappeared.")
        result = placeholder.generate(record, _progress(job_id))
        record = characters.get(slug)
        record["model"].update(
            {
                "sourceMode": "placeholder",
                "sourceFile": result.relpath,
                "sourceFormat": result.source_format,
                "cleanFile": None,
                "warnings": result.warnings,
            }
        )
        record["pipeline"]["model"] = {"status": statuses.PLACEHOLDER, "updatedAt": now_iso()}
        characters.save(record)
        jobs.update(
            job_id,
            status="completed",
            progress=100,
            stage="placeholder model ready",
            outputs={"files": [result.relpath]},
            warnings=result.warnings,
        )
    except Exception as exc:  # noqa: BLE001 - background jobs serialize failures into the record.
        _fail(job_id, slug, "model", exc)


@router.post("/{slug}/model/import")
async def import_model(slug: str, file: UploadFile = File(...)) -> dict[str, Any]:
    _get_or_404(slug)
    data = await file.read()
    try:
        result = import_file.store_imported_model(slug, data, file.filename or "")
    except ValueError as exc:
        raise HTTPException(status_code=422, detail=str(exc)) from exc
    record = characters.get(slug)
    record["model"].update(
        {
            "sourceMode": "import",
            "sourceFile": result.relpath,
            "sourceFormat": result.source_format,
            "cleanFile": None,
            "warnings": result.warnings,
        }
    )
    record["pipeline"]["model"] = {"status": statuses.READY, "updatedAt": now_iso()}
    characters.save(record)
    return {"model": record["model"], "warnings": result.warnings, "character": characters.get(slug)}


# ---------- Step 4: cleanup / normalize ----------


@router.post("/{slug}/pipeline/cleanup")
def cleanup_model(slug: str, payload: CleanupRequest) -> dict[str, Any]:
    record = _get_or_404(slug)
    if not (record.get("model") or {}).get("sourceFile"):
        raise HTTPException(status_code=409, detail="No source model yet. Run Step 3 (Model Source) first.")
    patch: dict[str, Any] = {}
    if payload.targetHeight is not None:
        patch["targetHeight"] = payload.targetHeight
    if payload.toonMaterial is not None:
        patch["toonMaterial"] = payload.toonMaterial
    if patch:
        characters.patch(slug, {"model": patch})
    job = jobs.create("cleanup_model", slug, payload.model_dump(exclude_none=True))
    _set_step(slug, "cleanup", statuses.PROCESSING)
    _spawn(_run_cleanup, job["id"], slug)
    return job


def _run_cleanup(job_id: str, slug: str) -> None:
    try:
        record = characters.get(slug)
        model = record["model"]
        char_dir = character_dir(slug)
        source = char_dir / model["sourceFile"]
        if not source.exists():
            raise ValueError(f"Source model '{model['sourceFile']}' is missing on disk.")
        report = _progress(job_id)

        report(10, "checking Blender")
        clean_rel = f"model/clean/{slug}_model.glb"
        clean_path = char_dir / clean_rel
        ok, warnings = blender_runner.run_cleanup(
            source, clean_path, float(model.get("targetHeight") or 2.05), bool(model.get("toonMaterial", True))
        )

        record = characters.get(slug)
        if ok:
            record["model"]["cleanFile"] = clean_rel
            record["model"]["warnings"] = []
            record["model"]["lastCleanupJobId"] = job_id
            record["pipeline"]["cleanup"] = {"status": statuses.READY, "updatedAt": now_iso()}
            characters.save(record)
            jobs.update(job_id, status="completed", progress=100, stage="clean GLB exported", outputs={"files": [clean_rel]})
            return

        # Honest fallback: keep the raw source as the working file, never pretend it was processed.
        report(70, "Blender unavailable — falling back to raw source passthrough")
        fallback_rel = f"model/clean/{slug}_model{source.suffix.lower()}"
        fallback_path = char_dir / fallback_rel
        fallback_path.parent.mkdir(parents=True, exist_ok=True)
        shutil.copy2(source, fallback_path)
        warnings = warnings + ["The 'clean' file is an unprocessed copy of the source model (no centering, feet origin, or height normalization)."]
        record["model"]["cleanFile"] = fallback_rel
        record["model"]["warnings"] = warnings
        record["model"]["lastCleanupJobId"] = job_id
        record["pipeline"]["cleanup"] = {"status": statuses.PLACEHOLDER, "updatedAt": now_iso()}
        characters.save(record)
        jobs.update(job_id, status="completed", progress=100, stage="passthrough fallback (no Blender)", outputs={"files": [fallback_rel]}, warnings=warnings)
    except Exception as exc:  # noqa: BLE001
        _fail(job_id, slug, "cleanup", exc)


# ---------- Step 6: 2.5D renders ----------


@router.post("/{slug}/pipeline/render")
def render_character(slug: str, payload: RenderRequest) -> dict[str, Any]:
    record = _get_or_404(slug)
    model = record.get("model") or {}
    if not (model.get("cleanFile") or model.get("sourceFile")):
        raise HTTPException(status_code=409, detail="No model to render. Run Step 3 (Model Source) first.")
    preset_ids = [p for p in payload.presets if p in RENDER_PRESETS]
    if not preset_ids:
        raise HTTPException(status_code=422, detail="Pick at least one valid render preset.")
    job = jobs.create("render_character", slug, {"presets": preset_ids})
    _set_step(slug, "render25d", statuses.PROCESSING)
    _spawn(_run_render, job["id"], slug, preset_ids)
    return job


def _run_render(job_id: str, slug: str, preset_ids: list[str]) -> None:
    try:
        record = characters.get(slug)
        model = record["model"]
        char_dir = character_dir(slug)
        model_rel = model.get("cleanFile") or model.get("sourceFile")
        input_model = char_dir / model_rel
        if not input_model.exists():
            raise ValueError(f"Model '{model_rel}' is missing on disk.")
        outputs = outputs_for(preset_ids)
        report = _progress(job_id)
        warnings: list[str] = []
        if not model.get("cleanFile") or model.get("warnings"):
            warnings.append("Rendering from a model that has not been fully cleaned/normalized; baseline and height may be off.")

        report(15, f"rendering {len(outputs)} output(s) via Blender")
        ok, blender_warnings = blender_runner.run_renders(
            input_model, char_dir, outputs, float(model.get("targetHeight") or 2.05)
        )

        rendered_placeholder = False
        if not ok:
            report(60, "Blender unavailable — writing stand-in PNGs")
            warnings.extend(blender_warnings)
            warnings.append("These PNGs are generated mannequin stand-ins, not real Blender renders.")
            for output in outputs:
                view = png_fallback.CAMERA_TO_VIEW.get(output["camera"], "front")
                png_fallback.render_fallback(char_dir / output["file"], view, output["width"], output["height"])
            rendered_placeholder = True

        record = characters.get(slug)
        for output in outputs:
            record["renders"][output["rendersKey"]] = output["file"]
        record["renders"]["lastRenderJobId"] = job_id
        record["pipeline"]["render25d"] = {
            "status": statuses.PLACEHOLDER if rendered_placeholder else statuses.READY,
            "updatedAt": now_iso(),
        }
        characters.save(record)
        jobs.update(
            job_id,
            status="completed",
            progress=100,
            stage="stand-in PNGs written (no Blender)" if rendered_placeholder else "renders complete",
            outputs={"files": [output["file"] for output in outputs]},
            warnings=warnings,
        )
    except Exception as exc:  # noqa: BLE001
        _fail(job_id, slug, "render25d", exc)


# ---------- Step 8: export ----------


@router.post("/{slug}/pipeline/export")
def export(slug: str) -> dict[str, Any]:
    record = _get_or_404(slug)
    if not ((record.get("model") or {}).get("cleanFile") or (record.get("model") or {}).get("sourceFile")):
        raise HTTPException(status_code=409, detail="Nothing to export yet. Run Step 3 (Model Source) first.")
    job = jobs.create("export_character", slug, {"exportRoot": str(export_root())})
    _set_step(slug, "export", statuses.PROCESSING)
    _spawn(_run_export, job["id"], slug)
    return job


def _run_export(job_id: str, slug: str) -> None:
    try:
        record = characters.get(slug)
        source_job_ids = [j for j in [record["model"].get("lastCleanupJobId"), record["renders"].get("lastRenderJobId")] if j]
        manifest, warnings = export_character(record, export_root(), source_job_ids, _progress(job_id))
        record = characters.get(slug)
        record["pipeline"]["export"] = {"status": statuses.EXPORTED, "updatedAt": now_iso()}
        characters.save(record)
        target = Path(export_root()) / "no-gods-above-export" / "characters" / slug
        jobs.update(
            job_id,
            status="completed",
            progress=100,
            stage="exported",
            outputs={"files": [str(target / "manifest.json")], "exportDir": str(target), "manifest": manifest},
            warnings=warnings,
        )
    except Exception as exc:  # noqa: BLE001
        _fail(job_id, slug, "export", exc)
