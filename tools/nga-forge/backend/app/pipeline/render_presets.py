from __future__ import annotations

from typing import Any

# The shared 2.5D look is defined HERE, once, for every character:
# the same camera angles, framing, and light rig keep the roster consistent.
RENDER_PRESETS: dict[str, dict[str, Any]] = {
    "sprite_frame_448": {
        "label": "2.5D Sprite Frame (448x448)",
        "description": "Transparent 448x448 frame, fixed 3/4 fighting-game camera, fixed floor baseline.",
        "outputs": [
            {
                "rendersKey": "preview25d",
                "file": "renders/preview_25d.png",
                "width": 448,
                "height": 448,
                "camera": "front_three_quarter",
                "transparent": True,
            }
        ],
    },
    "turntable_refs": {
        "label": "Turntable References",
        "description": "Front / side / back / 3-4 transparent reference renders at 1024px.",
        "outputs": [
            {"rendersKey": "turntableFront", "file": "renders/turntable_front.png", "width": 1024, "height": 1024, "camera": "front", "transparent": True},
            {"rendersKey": "turntableSide", "file": "renders/turntable_side.png", "width": 1024, "height": 1024, "camera": "side", "transparent": True},
            {"rendersKey": "turntableBack", "file": "renders/turntable_back.png", "width": 1024, "height": 1024, "camera": "back", "transparent": True},
            {"rendersKey": "turntableThreeQuarter", "file": "renders/turntable_three_quarter.png", "width": 1024, "height": 1024, "camera": "front_three_quarter", "transparent": True},
        ],
    },
    "portrait_select": {
        "label": "Character Select Portrait (460x520)",
        "description": "Bust/three-quarter crop matching the existing No Gods Above select portraits.",
        "outputs": [
            {
                "rendersKey": "portraitSelect",
                "file": "renders/portrait_select.png",
                "width": 460,
                "height": 520,
                "camera": "portrait",
                "transparent": True,
            }
        ],
    },
    "splash_trailer": {
        "label": "Trailer / Splash Art (1920x1080)",
        "description": "Hero-angle splash render for trailers and key art drafts.",
        "outputs": [
            {
                "rendersKey": "splash",
                "file": "renders/splash.png",
                "width": 1920,
                "height": 1080,
                "camera": "hero",
                "transparent": True,
            }
        ],
    },
}


def preset_catalog() -> list[dict[str, Any]]:
    return [
        {"id": preset_id, "label": preset["label"], "description": preset["description"], "outputs": preset["outputs"]}
        for preset_id, preset in RENDER_PRESETS.items()
    ]


def outputs_for(preset_ids: list[str]) -> list[dict[str, Any]]:
    outputs: list[dict[str, Any]] = []
    for preset_id in preset_ids:
        preset = RENDER_PRESETS.get(preset_id)
        if preset:
            outputs.extend(preset["outputs"])
    return outputs
