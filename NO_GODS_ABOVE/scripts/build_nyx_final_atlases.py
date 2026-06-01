from __future__ import annotations

import json
from pathlib import Path

from PIL import Image


ROOT = Path(__file__).resolve().parents[1]
SOURCE_DIR = ROOT / "assets" / "sprites" / "nyx_generated"
OUTPUT_DIR = ROOT / "assets" / "sprites" / "nyx_final"
CELL_SIZE = 320
BASELINE_Y = 300
CHROMA = (255, 0, 255)
PAD = 10


SHEETS = [
    {
        "id": "sheet_1_core_movement",
        "source": "nyx_core_movement_dbfz_chroma.png",
        "output": "nyx_sheet_1_core_movement_atlas.png",
        "rows": [
            ("idle", 6, "ground"),
            ("walk_forward", 6, "ground"),
            ("walk_back", 6, "ground"),
            ("dash", 6, "ground"),
            ("dash_back", 6, "ground"),
            ("crouch", 4, "ground"),
        ],
    },
    {
        "id": "sheet_2_air_movement",
        "source": "nyx_sheet_2_air_movement_chroma.png",
        "output": "nyx_sheet_2_air_movement_atlas.png",
        "rows": [
            ("jump_up", 4, "air"),
            ("jump_forward", 4, "air"),
            ("jump_back", 4, "air"),
            ("fall", 4, "air"),
            ("air_dash_forward", 6, "air"),
            ("air_dash_back", 6, "air"),
        ],
    },
    {
        "id": "sheet_3_ground_normals",
        "source": "nyx_sheet_3_ground_normals_chroma.png",
        "output": "nyx_sheet_3_ground_normals_atlas.png",
        "rows": [
            ("light_attack", 4, "ground"),
            ("medium_attack", 8, "ground"),
            ("heavy_attack", 6, "ground"),
            ("launcher", 6, "ground"),
        ],
    },
    {
        "id": "sheet_4_air_normals",
        "source": "nyx_sheet_4_air_normals_chroma.png",
        "output": "nyx_sheet_4_air_normals_atlas.png",
        "rows": [
            ("air_light", 4, "air"),
            ("air_medium", 6, "air"),
            ("air_heavy", 6, "air"),
            ("air_recovery", 4, "air"),
        ],
    },
    {
        "id": "sheet_5_specials",
        "source": "nyx_sheet_5_specials_chroma.png",
        "output": "nyx_sheet_5_specials_atlas.png",
        "rows": [
            ("shadow_step_start", 4, "ground"),
            ("shadow_step_travel", 6, "ground"),
            ("shadow_step_end", 4, "ground"),
            ("falling_slash_start", 3, "air"),
            ("falling_slash_active", 4, "air"),
            ("falling_slash_land", 4, "ground"),
            ("rapid_flurry", 10, "ground"),
        ],
    },
    {
        "id": "sheet_6_defense_hit_reactions",
        "source": "nyx_sheet_6_defense_hit_reactions_chroma.png",
        "output": "nyx_sheet_6_defense_hit_reactions_atlas.png",
        "rows": [
            ("stand_block", 4, "ground"),
            ("crouch_block", 4, "ground"),
            ("air_block", 4, "air"),
            ("light_hitstun", 3, "ground"),
            ("medium_hitstun", 4, "ground"),
            ("heavy_hitstun", 6, "ground"),
            ("launch_hitstun", 5, "air"),
            ("air_hitstun", 5, "air"),
        ],
    },
    {
        "id": "sheet_7_knockdown_recovery_flavor",
        "source": "nyx_sheet_7_knockdown_recovery_flavor_chroma.png",
        "output": "nyx_sheet_7_knockdown_recovery_flavor_atlas.png",
        "rows": [
            ("knockdown_fall", 6, "air"),
            ("grounded", 3, "ground"),
            ("recovery_get_up", 6, "ground"),
            ("ko_defeat", 8, "ground"),
            ("intro", 8, "ground"),
            ("victory", 8, "ground"),
            ("taunt", 8, "ground"),
        ],
    },
]


def is_body_pixel(pixel: tuple[int, int, int, int]) -> bool:
    r, g, b, a = pixel
    return a > 18 and (r, g, b) != CHROMA


def transparentize_chroma(image: Image.Image) -> Image.Image:
    rgba = image.convert("RGBA")
    pixels = rgba.load()
    for y in range(rgba.height):
        for x in range(rgba.width):
            r, g, b, a = pixels[x, y]
            if a <= 18 or (r, g, b) == CHROMA:
                pixels[x, y] = (0, 0, 0, 0)
    return rgba


def content_bbox(image: Image.Image) -> tuple[int, int, int, int] | None:
    pixels = image.load()
    min_x = min_y = 10**9
    max_x = max_y = -1
    for y in range(image.height):
        for x in range(image.width):
            if not is_body_pixel(pixels[x, y]):
                continue
            min_x = min(min_x, x)
            min_y = min(min_y, y)
            max_x = max(max_x, x)
            max_y = max(max_y, y)
    if max_x < min_x:
        return None
    return (
        max(0, min_x - PAD),
        max(0, min_y - PAD),
        min(image.width, max_x + PAD + 1),
        min(image.height, max_y + PAD + 1),
    )


def place_frame(cell: Image.Image, mode: str) -> Image.Image:
    bbox = content_bbox(cell)
    out = Image.new("RGBA", (CELL_SIZE, CELL_SIZE), (0, 0, 0, 0))
    if bbox is None:
        return out

    sprite = transparentize_chroma(cell.crop(bbox))
    scale = min(1.0, (CELL_SIZE - 20) / max(sprite.width, 1), (CELL_SIZE - 20) / max(sprite.height, 1))
    if scale < 1.0:
        sprite = sprite.resize((max(1, round(sprite.width * scale)), max(1, round(sprite.height * scale))), Image.Resampling.LANCZOS)

    x = (CELL_SIZE - sprite.width) // 2
    if mode == "air":
        y = (CELL_SIZE - sprite.height) // 2
    else:
        y = BASELINE_Y - sprite.height
        y = max(0, min(CELL_SIZE - sprite.height, y))

    out.alpha_composite(sprite, (x, y))
    return out


def build_sheet(spec: dict) -> dict:
    source = Image.open(SOURCE_DIR / spec["source"]).convert("RGBA")
    rows = spec["rows"]
    max_cols = max(count for _, count, _ in rows)
    output = Image.new("RGBA", (CELL_SIZE * max_cols, CELL_SIZE * len(rows)), (0, 0, 0, 0))
    row_height = source.height / len(rows)
    row_manifest = []

    for row_index, (name, frame_count, mode) in enumerate(rows):
        frame_width = source.width / frame_count
        last_frame = None
        for frame_index in range(max_cols):
            source_frame = min(frame_index, frame_count - 1)
            left = round(source_frame * frame_width)
            upper = round(row_index * row_height)
            right = round((source_frame + 1) * frame_width)
            lower = round((row_index + 1) * row_height)
            cell = source.crop((left, upper, right, lower))
            placed = place_frame(cell, mode)
            output.alpha_composite(placed, (frame_index * CELL_SIZE, row_index * CELL_SIZE))
            last_frame = placed
        row_manifest.append(
            {
                "row": row_index,
                "animation": name,
                "sourceFrames": frame_count,
                "runtimeFrames": max_cols,
                "verticalMode": mode,
                "paddedByHoldingLastFrame": frame_count < max_cols,
            }
        )
        assert last_frame is not None

    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
    output_path = OUTPUT_DIR / spec["output"]
    output.save(output_path)
    return {
        "id": spec["id"],
        "source": str((SOURCE_DIR / spec["source"]).relative_to(ROOT)).replace("\\", "/"),
        "output": str(output_path.relative_to(ROOT)).replace("\\", "/"),
        "cols": max_cols,
        "rows": len(rows),
        "cellSize": CELL_SIZE,
        "baselineY": BASELINE_Y,
        "rowMap": row_manifest,
    }


def validate_atlas(path: Path) -> dict:
    image = Image.open(path).convert("RGBA")
    pixels = image.load()
    opaque = 0
    pink = 0
    for y in range(image.height):
        for x in range(image.width):
            r, g, b, a = pixels[x, y]
            if a > 18:
                opaque += 1
                if (r, g, b) == CHROMA:
                    pink += 1
    return {
        "size": list(image.size),
        "opaquePixels": opaque,
        "remainingOpaqueChromaPixels": pink,
        "transparentCorners": all(image.getpixel(p)[3] == 0 for p in [(0, 0), (image.width - 1, 0), (0, image.height - 1), (image.width - 1, image.height - 1)]),
    }


def main() -> None:
    manifest = {
        "character": "Nyx",
        "purpose": "Final transparent runtime atlases for No Gods Above Nyx sprite import.",
        "cellSize": CELL_SIZE,
        "baselineY": BASELINE_Y,
        "previousPlaceholderReferences": {
            "concept": "nyxConcept3x6",
            "fallbackSheets": ["kairoFinalBasic", "kairoFinalDefense", "kairoFinalCoreA", "kairoFinalCoreB", "kairoFinalLowAir", "kairoFinalSpecials", "kairoFinalEnd"],
        },
        "sheets": [],
    }

    for sheet in SHEETS:
        result = build_sheet(sheet)
        result["validation"] = validate_atlas(ROOT / result["output"])
        manifest["sheets"].append(result)

    manifest_path = OUTPUT_DIR / "nyx_final_atlas_manifest.json"
    manifest_path.write_text(json.dumps(manifest, indent=2) + "\n", encoding="utf-8")
    print(json.dumps(manifest, indent=2))


if __name__ == "__main__":
    main()
