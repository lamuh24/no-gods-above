from __future__ import annotations

import json
from pathlib import Path

from PIL import Image


ROOT = Path(__file__).resolve().parents[1]
SOURCE_DIR = ROOT / "assets" / "sprites" / "sol_generated"
OUTPUT_DIR = ROOT / "assets" / "sprites" / "sol_final"
FRAMES_DIR = OUTPUT_DIR / "frames"

CHROMA = (255, 0, 255)
SOURCE_CELL_SIZE = 384
OUTPUT_CELL_SIZE = 448
OUTPUT_PAD = (OUTPUT_CELL_SIZE - SOURCE_CELL_SIZE) // 2
SOURCE_BASELINE_Y = 350
OUTPUT_BASELINE_Y = SOURCE_BASELINE_Y + OUTPUT_PAD


SHEETS = [
    {
        "id": "sheet_1_core_movement",
        "source": "sol_sheet_1_core_movement_chroma.png",
        "output": "sol_sheet_1_core_movement_atlas.png",
        "rows": [
            ("idle", "Idle", 8, "ground"),
            ("walk_forward", "Walk Forward", 6, "ground"),
            ("walk_back", "Walk Back", 6, "ground"),
            ("dash_forward", "Dash Forward", 6, "ground"),
            ("dash_back", "Dash Back", 6, "ground"),
            ("crouch", "Crouch / Low Stance", 4, "ground"),
        ],
    },
    {
        "id": "sheet_2_air_movement",
        "source": "sol_sheet_2_air_movement_chroma.png",
        "output": "sol_sheet_2_air_movement_atlas.png",
        "rows": [
            ("jump_up", "Jump Up / Rising", 4, "air"),
            ("jump_forward", "Jump Forward", 4, "air"),
            ("jump_back", "Jump Back", 4, "air"),
            ("fall", "Fall / Neutral Air Drift", 4, "air"),
            ("air_dash_forward", "Air Dash Forward", 6, "air"),
            ("air_dash_back", "Air Dash Back", 6, "air"),
        ],
    },
    {
        "id": "sheet_3_ground_normals",
        "source": "sol_sheet_3_ground_normals_chroma.png",
        "output": "sol_sheet_3_ground_normals_atlas.png",
        "rows": [
            ("light_attack", "Light Attack / Sun Jab", 4, "ground"),
            ("medium_attack", "Medium Attack / Iron Palm", 6, "ground"),
            ("heavy_attack", "Heavy Attack / Furnace Hook", 7, "ground"),
            ("launcher", "Launcher / Dawn Upper", 7, "ground"),
        ],
    },
    {
        "id": "sheet_4_air_normals",
        "source": "sol_sheet_4_air_normals_chroma.png",
        "output": "sol_sheet_4_air_normals_atlas.png",
        "rows": [
            ("air_light", "Air Light / Falling Tap", 4, "air"),
            ("air_medium", "Air Medium / Comet Knee", 6, "air"),
            ("air_heavy", "Air Heavy / Sunfall Axe", 7, "air"),
            ("air_recovery", "Air Recovery / Fall Transition", 4, "air"),
        ],
    },
    {
        "id": "sheet_5_specials",
        "source": "sol_sheet_5_specials_chroma.png",
        "output": "sol_sheet_5_specials_atlas.png",
        "rows": [
            ("solar_step", "Solar Step", 8, "ground"),
            ("radiant_break", "Radiant Break", 8, "ground"),
            ("rising_halo", "Rising Halo", 8, "ground"),
            ("solar_verdict_startup", "Solar Verdict Startup", 6, "ground"),
            ("solar_verdict_finish", "Solar Verdict Finish", 8, "ground"),
        ],
    },
    {
        "id": "sheet_6_defense_hit_reactions",
        "source": "sol_sheet_6_defense_hit_reactions_chroma.png",
        "output": "sol_sheet_6_defense_hit_reactions_atlas.png",
        "rows": [
            ("stand_block", "Stand Block", 4, "ground"),
            ("crouch_block", "Crouch Block", 4, "ground"),
            ("air_block", "Air Block", 4, "air"),
            ("light_hitstun", "Light Hitstun", 3, "ground"),
            ("medium_hitstun", "Medium Hitstun", 4, "ground"),
            ("heavy_hitstun", "Heavy Hitstun", 6, "ground"),
            ("launch_hitstun", "Launch Hitstun", 5, "air"),
            ("air_hitstun", "Air Hitstun", 5, "air"),
        ],
    },
    {
        "id": "sheet_7_knockdown_recovery_flavor",
        "source": "sol_sheet_7_knockdown_recovery_flavor_chroma.png",
        "output": "sol_sheet_7_knockdown_recovery_flavor_atlas.png",
        "rows": [
            ("knockdown_fall", "Knockdown Fall", 6, "air"),
            ("grounded", "Grounded / Downed", 3, "ground"),
            ("recovery_get_up", "Recovery / Get Up", 6, "ground"),
            ("ko_defeat", "KO / Defeat", 8, "ground"),
            ("intro_pose", "Intro Pose", 8, "ground"),
            ("victory_pose", "Victory Pose", 8, "ground"),
            ("taunt", "Taunt", 8, "ground"),
        ],
    },
]


ALIASES = {
    "crouch": ["low_stance"],
    "jump_up": ["rising"],
    "fall": ["neutral_air_drift"],
    "light_attack": ["sun_jab"],
    "medium_attack": ["iron_palm"],
    "heavy_attack": ["furnace_hook"],
    "launcher": ["dawn_upper"],
    "air_light": ["falling_tap"],
    "air_medium": ["comet_knee"],
    "air_heavy": ["sunfall_axe"],
    "air_recovery": ["fall_transition"],
    "grounded": ["downed"],
    "recovery_get_up": ["get_up"],
    "ko_defeat": ["defeat"],
}


def is_chroma_like(pixel: tuple[int, int, int, int]) -> bool:
    r, g, b, a = pixel
    return a <= 18 or (r, g, b) == CHROMA or (r >= 180 and b >= 150 and g <= 95)


def remove_chroma(cell: Image.Image) -> Image.Image:
    rgba = cell.convert("RGBA")
    pixels = rgba.load()
    for y in range(rgba.height):
        for x in range(rgba.width):
            if is_chroma_like(pixels[x, y]):
                pixels[x, y] = (0, 0, 0, 0)
    return rgba


def bbox_gap(a: tuple[int, int, int, int], b: tuple[int, int, int, int]) -> int:
    ax1, ay1, ax2, ay2 = a
    bx1, by1, bx2, by2 = b
    dx = max(0, bx1 - ax2, ax1 - bx2)
    dy = max(0, by1 - ay2, ay1 - by2)
    return max(dx, dy)


def remove_boundary_fragments(cell: Image.Image) -> Image.Image:
    rgba = cell.convert("RGBA")
    pixels = rgba.load()
    width, height = rgba.size
    visited = bytearray(width * height)
    components = []

    for start_y in range(height):
        for start_x in range(width):
            idx = start_y * width + start_x
            if visited[idx] or pixels[start_x, start_y][3] <= 18:
                visited[idx] = 1
                continue

            stack = [(start_x, start_y)]
            visited[idx] = 1
            points = []
            min_x = max_x = start_x
            min_y = max_y = start_y
            while stack:
                x, y = stack.pop()
                points.append((x, y))
                min_x = min(min_x, x)
                max_x = max(max_x, x)
                min_y = min(min_y, y)
                max_y = max(max_y, y)
                for nx, ny in ((x + 1, y), (x - 1, y), (x, y + 1), (x, y - 1)):
                    if nx < 0 or ny < 0 or nx >= width or ny >= height:
                        continue
                    nidx = ny * width + nx
                    if visited[nidx]:
                        continue
                    visited[nidx] = 1
                    if pixels[nx, ny][3] > 18:
                        stack.append((nx, ny))

            components.append(
                {
                    "points": points,
                    "area": len(points),
                    "bbox": (min_x, min_y, max_x + 1, max_y + 1),
                    "touchesBoundary": min_x <= 1 or min_y <= 1 or max_x >= width - 2 or max_y >= height - 2,
                }
            )

    if not components:
        return rgba

    main = max(components, key=lambda component: component["area"])
    main_bbox = main["bbox"]
    main_area = main["area"]
    keep_points = set()
    for component in components:
        keep = False
        if component is main:
            keep = True
        elif not component["touchesBoundary"]:
            keep = True
        elif component["area"] >= main_area * 0.35:
            keep = True
        elif component["area"] >= 12 and bbox_gap(component["bbox"], main_bbox) <= 18:
            keep = True

        if keep:
            keep_points.update(component["points"])

    out = Image.new("RGBA", rgba.size, (0, 0, 0, 0))
    out_pixels = out.load()
    for x, y in keep_points:
        out_pixels[x, y] = pixels[x, y]
    return out


def detect_spans_for_row(source: Image.Image, row_index: int, expected_spans: int) -> list[tuple[int, int]]:
    top = row_index * SOURCE_CELL_SIZE
    row = source.crop((0, top, source.width, top + SOURCE_CELL_SIZE)).convert("RGBA")
    pixels = row.load()
    x_counts = []
    for x in range(row.width):
        count = 0
        for y in range(row.height):
            if not is_chroma_like(pixels[x, y]):
                count += 1
        x_counts.append(count)

    candidates: list[list[tuple[int, int]]] = []
    for threshold in (8, 5, 3, 1, 12, 18):
        active = [count > threshold for count in x_counts]
        spans: list[list[int]] = []
        start = None
        for x, value in enumerate(active):
            if value and start is None:
                start = x
            if start is not None and ((not value) or x == len(active) - 1):
                end = x - 1 if not value else x
                if end - start >= 6:
                    spans.append([start, end + 1])
                start = None

        merged: list[list[int]] = []
        for span in spans:
            if merged and span[0] - merged[-1][1] <= 42:
                merged[-1][1] = span[1]
            else:
                merged.append(span)

        padded = []
        for left, right in merged:
            if right - left < 10:
                continue
            padded.append((max(0, left - 8), min(row.width, right + 8)))
        if padded:
            candidates.append(padded)

    exact = [spans for spans in candidates if len(spans) == expected_spans]
    if exact:
        return max(exact, key=lambda spans: sum(right - left for left, right in spans))

    # Fallback: use nominal cells for rows the source already arranged in fixed slots.
    return [(col * SOURCE_CELL_SIZE, (col + 1) * SOURCE_CELL_SIZE) for col in range(expected_spans)]


def place_extracted_cell(source_cell: Image.Image, vertical_mode: str) -> Image.Image:
    transparent = remove_boundary_fragments(remove_chroma(source_cell))
    bbox = content_bbox(transparent)
    if bbox is None:
        return Image.new("RGBA", (OUTPUT_CELL_SIZE, OUTPUT_CELL_SIZE), (0, 0, 0, 0))

    content = transparent.crop(bbox)
    max_size = OUTPUT_CELL_SIZE - (OUTPUT_PAD * 2)
    scale = min(1.0, max_size / max(content.width, 1), max_size / max(content.height, 1))
    if scale < 1.0:
        content = content.resize(
            (max(1, round(content.width * scale)), max(1, round(content.height * scale))),
            Image.Resampling.LANCZOS,
        )

    output_cell = Image.new("RGBA", (OUTPUT_CELL_SIZE, OUTPUT_CELL_SIZE), (0, 0, 0, 0))
    x = (OUTPUT_CELL_SIZE - content.width) // 2
    if vertical_mode == "ground":
        y = max(OUTPUT_PAD, min(OUTPUT_CELL_SIZE - OUTPUT_PAD - content.height, OUTPUT_BASELINE_Y - content.height))
    else:
        y = (OUTPUT_CELL_SIZE - content.height) // 2
    output_cell.alpha_composite(content, (x, y))
    return output_cell


def content_bbox(image: Image.Image) -> tuple[int, int, int, int] | None:
    pixels = image.load()
    min_x = min_y = 10**9
    max_x = max_y = -1
    for y in range(image.height):
        for x in range(image.width):
            if pixels[x, y][3] <= 18:
                continue
            min_x = min(min_x, x)
            min_y = min(min_y, y)
            max_x = max(max_x, x)
            max_y = max(max_y, y)
    if max_x < min_x:
        return None
    return min_x, min_y, max_x + 1, max_y + 1


def bbox_touches_edge(bbox: tuple[int, int, int, int] | None) -> bool:
    if bbox is None:
        return False
    left, top, right, bottom = bbox
    return left <= 1 or top <= 1 or right >= OUTPUT_CELL_SIZE - 1 or bottom >= OUTPUT_CELL_SIZE - 1


def validate_image(image: Image.Image, cols: int, rows: int) -> dict:
    pixels = image.load()
    opaque_pixels = 0
    remaining_pink = 0
    empty_cells = []
    edge_touch_cells = []
    for y in range(image.height):
        for x in range(image.width):
            r, g, b, a = pixels[x, y]
            if a > 18:
                opaque_pixels += 1
                if (r, g, b) == CHROMA:
                    remaining_pink += 1

    for row in range(rows):
        for col in range(cols):
            left = col * OUTPUT_CELL_SIZE
            top = row * OUTPUT_CELL_SIZE
            cell = image.crop((left, top, left + OUTPUT_CELL_SIZE, top + OUTPUT_CELL_SIZE))
            bbox = content_bbox(cell)
            if bbox is None:
                empty_cells.append({"row": row + 1, "col": col + 1})
            elif bbox_touches_edge(bbox):
                edge_touch_cells.append({"row": row + 1, "col": col + 1, "bbox": list(bbox)})

    corners = [
        image.getpixel((0, 0)),
        image.getpixel((image.width - 1, 0)),
        image.getpixel((0, image.height - 1)),
        image.getpixel((image.width - 1, image.height - 1)),
    ]
    return {
        "size": list(image.size),
        "opaquePixels": opaque_pixels,
        "remainingOpaqueChromaPixels": remaining_pink,
        "transparentCorners": all(pixel[3] == 0 for pixel in corners),
        "emptyCells": empty_cells,
        "edgeTouchCells": edge_touch_cells,
    }


def build_sheet(spec: dict) -> dict:
    source_path = SOURCE_DIR / spec["source"]
    source = Image.open(source_path).convert("RGBA")
    rows = spec["rows"]
    max_cols = source.width // SOURCE_CELL_SIZE
    row_count = source.height // SOURCE_CELL_SIZE
    expected_size = (max_cols * SOURCE_CELL_SIZE, row_count * SOURCE_CELL_SIZE)
    if source.size != expected_size:
        raise ValueError(f"{source_path} has unexpected non-cell size {source.size}; expected {expected_size}")
    if row_count != len(rows):
        raise ValueError(f"{source_path} has {row_count} rows; mapping defines {len(rows)}")

    atlas = Image.new("RGBA", (max_cols * OUTPUT_CELL_SIZE, row_count * OUTPUT_CELL_SIZE), (0, 0, 0, 0))
    row_manifest = []
    frame_root = FRAMES_DIR / spec["id"]
    frame_root.mkdir(parents=True, exist_ok=True)

    for row_index, (key, label, source_frames, vertical_mode) in enumerate(rows):
        row_dir = frame_root / key
        row_dir.mkdir(parents=True, exist_ok=True)
        row_entries = []
        spans = detect_spans_for_row(source, row_index, max_cols)
        for frame_index in range(max_cols):
            source_left, source_right = spans[frame_index]
            source_top = row_index * SOURCE_CELL_SIZE
            output_left = frame_index * OUTPUT_CELL_SIZE
            output_top = row_index * OUTPUT_CELL_SIZE
            cell = source.crop((source_left, source_top, source_right, source_top + SOURCE_CELL_SIZE))
            output_cell = place_extracted_cell(cell, vertical_mode)
            atlas.alpha_composite(output_cell, (output_left, output_top))
            if frame_index < source_frames:
                frame_name = f"{key}_{frame_index + 1:02d}.png"
                frame_path = row_dir / frame_name
                output_cell.save(frame_path)
                bbox = content_bbox(output_cell)
                row_entries.append(
                    {
                        "frame": frame_index + 1,
                        "file": str(frame_path.relative_to(ROOT)).replace("\\", "/"),
                        "contentBBox": list(bbox) if bbox else None,
                        "edgeTouchRisk": bbox_touches_edge(bbox),
                    }
                )

        row_manifest.append(
            {
                "row": row_index + 1,
                "key": key,
                "label": label,
                "aliases": ALIASES.get(key, []),
                "sourceFrames": source_frames,
                "atlasColumns": max_cols,
                "verticalMode": vertical_mode,
                "pivot": {
                    "mode": "lockedFrameBottomCenter" if vertical_mode == "ground" else "lockedFrameCenter",
                    "x": OUTPUT_CELL_SIZE // 2,
                    "y": OUTPUT_BASELINE_Y if vertical_mode == "ground" else OUTPUT_CELL_SIZE // 2,
                },
                "paddedCellsHeldFromSource": source_frames < max_cols,
                "frames": row_entries,
            }
        )

    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
    output_path = OUTPUT_DIR / spec["output"]
    atlas.save(output_path)
    validation = validate_image(atlas, max_cols, row_count)
    return {
        "id": spec["id"],
        "source": str(source_path.relative_to(ROOT)).replace("\\", "/"),
        "output": str(output_path.relative_to(ROOT)).replace("\\", "/"),
        "cols": max_cols,
        "rows": row_count,
        "sourceCellSize": SOURCE_CELL_SIZE,
        "cellSize": OUTPUT_CELL_SIZE,
        "sourceBaselineY": SOURCE_BASELINE_Y,
        "baselineY": OUTPUT_BASELINE_Y,
        "padFromSourceCell": OUTPUT_PAD,
        "rowMap": row_manifest,
        "validation": validation,
    }


def write_mapping_notes(manifest: dict) -> None:
    lines = [
        "# Sol Raze Animation Mapping Notes",
        "",
        "Sol Raze, the Iron Sun, uses fixed 448x448 transparent frame slots prepared from 384x384 chroma source cells.",
        "This is import prep only: Sol is not wired into runtime by this file.",
        "",
        "## Runtime Sheet Keys",
        "",
    ]
    for sheet in manifest["sheets"]:
        lines.append(f"### {sheet['id']}")
        lines.append("")
        lines.append(f"- Atlas: `{sheet['output']}`")
        lines.append(f"- Grid: {sheet['cols']} columns x {sheet['rows']} rows")
        lines.append(f"- Cell size: {sheet['cellSize']}x{sheet['cellSize']} prepared from {sheet['sourceCellSize']}x{sheet['sourceCellSize']} source cells")
        lines.append("")
        for row in sheet["rowMap"]:
            aliases = f" aliases: {', '.join(row['aliases'])}" if row["aliases"] else ""
            lines.append(
                f"- Row {row['row']}: `{row['key']}` ({row['label']}), "
                f"{row['sourceFrames']} source frames, {row['atlasColumns']} atlas slots, "
                f"{row['verticalMode']} pivot `{row['pivot']['mode']}`{aliases}"
            )
        lines.append("")
    lines.append("## Import Cautions")
    lines.append("")
    lines.append("- Keep Sol disabled until runtime config and character select are intentionally added later.")
    lines.append("- Use row-specific frame counts from `sol_final_atlas_manifest.json`; do not animate held padding cells as unique poses.")
    lines.append("- Grounded rows use bottom-center style alignment with baselineY 382 inside each 448px prepared cell.")
    lines.append("- Airborne rows use centered alignment in fixed cells.")
    lines.append("- Do not add chain, whip, tether, detached weapon, or Nyx-style shadow VFX behavior to Sol.")
    (OUTPUT_DIR / "sol_animation_mapping_notes.md").write_text("\n".join(lines), encoding="utf-8")


def main() -> None:
    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
    FRAMES_DIR.mkdir(parents=True, exist_ok=True)
    sheets = [build_sheet(spec) for spec in SHEETS]
    manifest = {
        "character": "Sol Raze",
        "title": "The Iron Sun",
        "status": "atlas_extraction_import_prep_only",
        "sourceDirectory": str(SOURCE_DIR.relative_to(ROOT)).replace("\\", "/"),
        "outputDirectory": str(OUTPUT_DIR.relative_to(ROOT)).replace("\\", "/"),
        "sourceCellSize": SOURCE_CELL_SIZE,
        "cellSize": OUTPUT_CELL_SIZE,
        "sourceBaselineY": SOURCE_BASELINE_Y,
        "baselineY": OUTPUT_BASELINE_Y,
        "padFromSourceCell": OUTPUT_PAD,
        "chromaRemoved": "#FF00FF",
        "runtimeImportStarted": False,
        "sheets": sheets,
    }
    (OUTPUT_DIR / "sol_final_atlas_manifest.json").write_text(json.dumps(manifest, indent=2), encoding="utf-8")
    write_mapping_notes(manifest)

    failures = []
    for sheet in sheets:
        validation = sheet["validation"]
        if validation["remainingOpaqueChromaPixels"] != 0:
            failures.append(f"{sheet['id']} has remaining opaque chroma pixels")
        if not validation["transparentCorners"]:
            failures.append(f"{sheet['id']} has nontransparent atlas corners")
        if validation["emptyCells"]:
            failures.append(f"{sheet['id']} has empty atlas cells: {validation['emptyCells'][:3]}")
        if validation["edgeTouchCells"]:
            failures.append(f"{sheet['id']} has edge-touch risk cells: {validation['edgeTouchCells'][:3]}")

    print(json.dumps({"sheets": len(sheets), "failures": failures}, indent=2))
    if failures:
        raise SystemExit(1)


if __name__ == "__main__":
    main()
