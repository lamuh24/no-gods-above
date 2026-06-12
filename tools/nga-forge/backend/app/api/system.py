from __future__ import annotations

from typing import Any

from fastapi import APIRouter
from pydantic import BaseModel

from ..core.config import load_settings, update_settings
from ..pipeline.blender_runner import blender_status
from ..pipeline.render_presets import preset_catalog
from ..sources.registry import model_source_modes

router = APIRouter(tags=["system"])


class SettingsPatch(BaseModel):
    exportRoot: str | None = None
    blenderPath: str | None = None


@router.get("/health")
def health() -> dict[str, str]:
    return {"ok": "true", "service": "nga-forge", "version": "0.2.0"}


@router.get("/settings")
def get_settings() -> dict[str, Any]:
    return {**load_settings(), "blender": blender_status()}


@router.patch("/settings")
def patch_settings(payload: SettingsPatch) -> dict[str, Any]:
    settings = update_settings(payload.model_dump(exclude_none=True))
    return {**settings, "blender": blender_status()}


@router.get("/model-sources")
def get_model_sources() -> dict[str, Any]:
    return {"modes": model_source_modes()}


@router.get("/render-presets")
def get_render_presets() -> dict[str, Any]:
    return {"presets": preset_catalog()}
