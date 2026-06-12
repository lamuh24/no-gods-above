from __future__ import annotations

from typing import Any

from ..core import statuses
from . import custom_nga, external_api, local_ai


def model_source_modes() -> list[dict[str, Any]]:
    _, external_reason = external_api.available()
    _, local_reason = local_ai.available()
    _, custom_reason = custom_nga.available()
    return [
        {
            "id": "placeholder",
            "label": "Placeholder Model",
            "status": statuses.READY,
            "selectable": True,
            "description": "Built-in mannequin/blockout GLB for testing the pipeline. Always available.",
        },
        {
            "id": "import",
            "label": "Import Existing Model",
            "status": statuses.READY,
            "selectable": True,
            "description": "Bring your own GLB, GLTF, FBX, or OBJ file.",
        },
        {
            "id": "external_api",
            "label": "External AI API",
            "status": statuses.FUTURE_ADAPTER,
            "selectable": False,
            "description": external_reason,
            "engines": list(external_api.ENGINES),
        },
        {
            "id": "local_ai",
            "label": "Local AI Generator",
            "status": statuses.FUTURE_ADAPTER,
            "selectable": False,
            "description": local_reason,
            "engines": list(local_ai.ENGINES),
        },
        {
            "id": "custom_nga",
            "label": "Custom NGA Generator",
            "status": statuses.FUTURE_ADAPTER,
            "selectable": False,
            "description": custom_reason,
        },
    ]


def selectable_mode_ids() -> set[str]:
    return {mode["id"] for mode in model_source_modes() if mode["selectable"]}
