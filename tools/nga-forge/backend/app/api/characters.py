from __future__ import annotations

import mimetypes
from typing import Any

from fastapi import APIRouter, File, Form, HTTPException, UploadFile
from fastapi.responses import FileResponse
from pydantic import BaseModel

from ..core.paths import safe_character_file
from ..state import characters
from ..store.characters import REFERENCE_LABELS

router = APIRouter(prefix="/characters", tags=["characters"])

MAX_REFERENCE_BYTES = 40 * 1024 * 1024


class CreateCharacter(BaseModel):
    name: str
    title: str = ""
    faction: str = ""
    role: str = "roster"


class ReferencePatch(BaseModel):
    label: str | None = None
    notes: str | None = None


class AnimationsPayload(BaseModel):
    animations: list[dict[str, Any]]


def _get_or_404(slug: str) -> dict[str, Any]:
    record = characters.get(slug)
    if not record:
        raise HTTPException(status_code=404, detail=f"Character '{slug}' not found.")
    return record


@router.get("")
def list_characters() -> dict[str, Any]:
    return {"characters": characters.summaries(), "referenceLabels": list(REFERENCE_LABELS)}


@router.post("")
def create_character(payload: CreateCharacter) -> dict[str, Any]:
    name = payload.name.strip()
    if not name:
        raise HTTPException(status_code=422, detail="Character name is required.")
    try:
        return characters.create(name, payload.title, payload.faction, payload.role)
    except ValueError as exc:
        raise HTTPException(status_code=409, detail=str(exc)) from exc


@router.get("/{slug}")
def get_character(slug: str) -> dict[str, Any]:
    return _get_or_404(slug)


@router.patch("/{slug}")
def patch_character(slug: str, payload: dict[str, Any]) -> dict[str, Any]:
    _get_or_404(slug)
    return characters.patch(slug, payload or {})


@router.delete("/{slug}")
def delete_character(slug: str) -> dict[str, str]:
    _get_or_404(slug)
    characters.delete(slug)
    return {"deleted": slug}


@router.put("/{slug}/animations")
def put_animations(slug: str, payload: AnimationsPayload) -> dict[str, Any]:
    _get_or_404(slug)
    return characters.set_animations(slug, payload.animations)


@router.post("/{slug}/references")
async def add_reference(
    slug: str,
    file: UploadFile = File(...),
    label: str = Form("main_design"),
    notes: str = Form(""),
) -> dict[str, Any]:
    _get_or_404(slug)
    content_type = file.content_type or ""
    if not content_type.startswith("image/"):
        raise HTTPException(status_code=415, detail="Only image uploads are accepted as references.")
    data = await file.read()
    if len(data) > MAX_REFERENCE_BYTES:
        raise HTTPException(status_code=413, detail="Reference image is larger than 40 MB.")
    ref = characters.add_reference(slug, data, file.filename or "reference.png", label, notes)
    return {"reference": ref, "character": characters.get(slug)}


@router.patch("/{slug}/references/{ref_id}")
def patch_reference(slug: str, ref_id: str, payload: ReferencePatch) -> dict[str, Any]:
    _get_or_404(slug)
    try:
        ref = characters.update_reference(slug, ref_id, payload.label, payload.notes)
    except KeyError as exc:
        raise HTTPException(status_code=404, detail=f"Reference '{ref_id}' not found.") from exc
    return {"reference": ref, "character": characters.get(slug)}


@router.delete("/{slug}/references/{ref_id}")
def delete_reference(slug: str, ref_id: str) -> dict[str, Any]:
    _get_or_404(slug)
    characters.delete_reference(slug, ref_id)
    return {"character": characters.get(slug)}


@router.get("/{slug}/files/{relpath:path}")
def serve_character_file(slug: str, relpath: str) -> FileResponse:
    _get_or_404(slug)
    try:
        target = safe_character_file(slug, relpath)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc
    if not target.is_file():
        raise HTTPException(status_code=404, detail=f"File '{relpath}' not found.")
    media_type = mimetypes.guess_type(target.name)[0]
    if target.suffix.lower() == ".glb":
        media_type = "model/gltf-binary"
    return FileResponse(target, media_type=media_type or "application/octet-stream", filename=target.name)
