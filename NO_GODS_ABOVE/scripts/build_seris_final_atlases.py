from __future__ import annotations

import json
from pathlib import Path

from PIL import Image


ROOT = Path(__file__).resolve().parents[1]
SOURCE_DIR = ROOT / "assets" / "sprites" / "seris_generated"
BODY_OUTPUT_DIR = ROOT / "assets" / "sprites" / "seris_final"
BODY_FRAMES_DIR = BODY_OUTPUT_DIR / "frames"
VFX_OUTPUT_DIR = ROOT / "assets" / "effects" / "seris"
VFX_FRAMES_DIR = VFX_OUTPUT_DIR / "frames"

CHROMA = (255, 0, 255)
BODY_CELL_SIZE = 384
BODY_BASELINE_Y = 350
BODY_PAD = 12


BODY_SHEETS = [
    {
        "id": "sheet_1_core_movement",
        "source": "seris_sheet_1_core_movement_chroma.png",
        "output": "seris_sheet_1_core_movement_atlas.png",
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
        "source": "seris_sheet_2_air_movement_chroma.png",
        "manifest": "seris_sheet_2_air_movement_manifest.json",
        "output": "seris_sheet_2_air_movement_atlas.png",
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
        "source": "seris_sheet_3_ground_normals_chroma.png",
        "output": "seris_sheet_3_ground_normals_atlas.png",
        "manualSpans": {
            # Heavy Attack has a very long chain frame that projection scanning
            # can split into body and detached tip fragments. Keep the body and
            # weapon together, then hold the last clean pose for the underfilled
            # requested cells.
            2: [(30, 166), (222, 650), (690, 825), (836, 1189), (1221, 1445)],
        },
        "rows": [
            ("light_attack", "Light Attack", 4, "ground"),
            ("medium_attack", "Medium Attack", 8, "ground"),
            ("heavy_attack", "Heavy Attack", 7, "ground"),
            ("launcher", "Launcher", 7, "ground"),
        ],
    },
    {
        "id": "sheet_4_air_normals",
        "source": "seris_sheet_4_air_normals_chroma.png",
        "output": "seris_sheet_4_air_normals_atlas.png",
        "rows": [
            ("air_light", "Air Light", 4, "air"),
            ("air_medium", "Air Medium", 6, "air"),
            ("air_heavy", "Air Heavy", 7, "air"),
            ("air_recovery", "Air Recovery / Fall Transition", 4, "air"),
        ],
    },
    {
        "id": "sheet_5_specials_body",
        "source": "seris_sheet_5_specials_body_chroma.png",
        "output": "seris_sheet_5_specials_body_atlas.png",
        "rows": [
            ("chain_snare_start", "Chain Snare Start", 4, "ground"),
            ("chain_snare_active", "Chain Snare Active", 6, "ground"),
            ("chain_snare_recovery", "Chain Snare Recovery", 4, "ground"),
            ("sanctum_sweep", "Sanctum Sweep", 8, "ground"),
            ("divine_recoil", "Divine Recoil", 8, "ground"),
            ("special_recovery", "Special Recovery / Return to Stance", 4, "ground"),
        ],
    },
    {
        "id": "sheet_6_defense_hit_reactions",
        "source": "seris_sheet_6_defense_hit_reactions_chroma.png",
        "output": "seris_sheet_6_defense_hit_reactions_atlas.png",
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
        "source": "seris_sheet_7_knockdown_recovery_flavor_chroma.png",
        "output": "seris_sheet_7_knockdown_recovery_flavor_atlas.png",
        "sourceCell": (256, 224),
        "sourceCols": 8,
        "rows": [
            ("knockdown_fall", "Knockdown Fall", 6, "air"),
            ("grounded", "Grounded / Downed", 3, "ground"),
            ("recovery_get_up", "Recovery / Get Up", 6, "ground"),
            ("ko_defeat", "KO / Defeat", 8, "ground"),
            ("intro_pose", "Intro Pose", 8, "ground"),
            ("victory", "Victory Pose", 8, "ground"),
            ("taunt", "Taunt", 8, "ground"),
        ],
    },
]

VFX_SHEET = {
    "id": "sheet_8_chain_whip_vfx",
    "source": "seris_sheet_8_chain_whip_vfx_chroma.png",
    "output": "seris_chain_whip_vfx_atlas.png",
    "sourceCell": (512, 220),
    "sourceCols": 8,
    "pivot": {"mode": "left_center_overlay", "x": 0, "y": 110},
    "rows": [
        ("vfx_quick_chain_flick", "Quick Chain Flick", 5),
        ("vfx_horizontal_chain_snare", "Horizontal Chain Snare", 7),
        ("vfx_low_sweep_chain_arc", "Low Sweep Chain Arc", 7),
        ("vfx_rising_launcher_chain_arc", "Rising Launcher Chain Arc", 7),
        ("vfx_aerial_forward_chain_arc", "Aerial Forward Chain Arc", 6),
        ("vfx_aerial_downward_finisher_arc", "Aerial Downward Finisher Arc", 6),
        ("vfx_divine_recoil_tether_pull", "Divine Recoil Tether / Pull Effect", 8),
    ],
}


def transparentize(image: Image.Image) -> Image.Image:
    rgba = image.convert("RGBA")
    pixels = rgba.load()
    for y in range(rgba.height):
        for x in range(rgba.width):
            r, g, b, a = pixels[x, y]
            if a <= 18 or (r, g, b) == CHROMA:
                pixels[x, y] = (0, 0, 0, 0)
    return rgba


def scrub_exact_chroma(image: Image.Image) -> Image.Image:
    rgba = image.convert("RGBA")
    pixels = rgba.load()
    for y in range(rgba.height):
        for x in range(rgba.width):
            r, g, b, a = pixels[x, y]
            if a > 18 and (r, g, b) == CHROMA:
                pixels[x, y] = (0, 0, 0, 0)
    return rgba


def content_bbox(image: Image.Image, pad: int = BODY_PAD) -> tuple[int, int, int, int] | None:
    pixels = image.load()
    min_x = min_y = 10**9
    max_x = max_y = -1
    for y in range(image.height):
        for x in range(image.width):
            r, g, b, a = pixels[x, y]
            if a <= 18 or (r, g, b) == CHROMA:
                continue
            min_x = min(min_x, x)
            min_y = min(min_y, y)
            max_x = max(max_x, x)
            max_y = max(max_y, y)
    if max_x < min_x:
        return None
    return (
        max(0, min_x - pad),
        max(0, min_y - pad),
        min(image.width, max_x + pad + 1),
        min(image.height, max_y + pad + 1),
    )


def load_detected_spans(spec: dict) -> dict[int, list[tuple[int, int]]]:
    manifest_name = spec.get("manifest")
    if not manifest_name:
        return {}
    manifest_path = SOURCE_DIR / manifest_name
    if not manifest_path.exists():
        return {}
    data = json.loads(manifest_path.read_text(encoding="utf-8"))
    spans: dict[int, list[tuple[int, int]]] = {}
    for row in data.get("rows", []):
        if "detected_spans" not in row:
            continue
        spans[int(row["row"]) - 1] = [tuple(span) for span in row["detected_spans"]]
    return spans


def detect_spans_for_row(source: Image.Image, spec: dict, row_index: int, frame_count: int) -> list[tuple[int, int]]:
    row_height = source.height / len(spec["rows"])
    upper = round(row_index * row_height)
    lower = round((row_index + 1) * row_height)
    row = source.crop((0, upper, source.width, lower)).convert("RGBA")
    pixels = row.load()
    x_counts = []
    for x in range(row.width):
        count = 0
        for y in range(row.height):
            r, g, b, a = pixels[x, y]
            if a > 18 and (r, g, b) != CHROMA:
                count += 1
        x_counts.append(count)

    candidates = []
    for threshold in (8, 3, 1, 15, 25):
        active = [count > threshold for count in x_counts]
        spans: list[list[int]] = []
        start = None
        for x, value in enumerate(active):
            if value and start is None:
                start = x
            if start is not None and ((not value) or x == len(active) - 1):
                end = x - 1 if not value else x
                if end - start >= 5:
                    spans.append([start, end])
                start = None

        merged: list[list[int]] = []
        for span in spans:
            if merged and span[0] - merged[-1][1] <= 20:
                merged[-1][1] = span[1]
            else:
                merged.append(span)
        merged_tuples = [(left, right) for left, right in merged if right - left >= 10]
        if merged_tuples:
            candidates.append(merged_tuples)

    exact = [spans for spans in candidates if len(spans) == frame_count]
    if exact:
        return exact[0]
    under = [spans for spans in candidates if len(spans) < frame_count]
    if under:
        return max(under, key=len)
    over = [spans for spans in candidates if len(spans) > frame_count]
    if over:
        spans = min(over, key=len)
        if len(spans) > frame_count:
            step = len(spans) / frame_count
            return [spans[min(len(spans) - 1, round(i * step))] for i in range(frame_count)]
    return []


def build_span_map(source: Image.Image, spec: dict) -> dict[int, list[tuple[int, int]]]:
    spans = load_detected_spans(spec)
    manual_spans = spec.get("manualSpans", {})
    spans.update(manual_spans)
    if "sourceCell" in spec:
        return spans
    for row_index, (_, _, frame_count, _) in enumerate(spec["rows"]):
        if row_index in manual_spans:
            continue
        if row_index not in spans or len(spans[row_index]) != frame_count:
            spans[row_index] = detect_spans_for_row(source, spec, row_index, frame_count)
    return spans


def source_frame_for_body(source: Image.Image, spec: dict, span_map: dict[int, list[tuple[int, int]]], row_index: int, frame_index: int, frame_count: int) -> Image.Image:
    if "sourceCell" in spec:
        cell_w, cell_h = spec["sourceCell"]
        left = frame_index * cell_w
        upper = row_index * cell_h
        return source.crop((left, upper, left + cell_w, upper + cell_h))

    row_height = source.height / len(spec["rows"])
    upper = round(row_index * row_height)
    lower = round((row_index + 1) * row_height)
    spans = span_map.get(row_index)
    if spans:
        if frame_index >= len(spans):
            return Image.new("RGBA", (max(1, round(source.width / frame_count)), lower - upper), (*CHROMA, 255))
        span_left, span_right = spans[frame_index]
        left = round(max(0, span_left - BODY_PAD * 2))
        right = round(min(source.width, span_right + BODY_PAD * 2))
        return source.crop((left, upper, right, lower))

    frame_width = source.width / frame_count
    left = round(frame_index * frame_width)
    right = round((frame_index + 1) * frame_width)
    return source.crop((left, upper, right, lower))


def place_body_frame(source_frame: Image.Image, mode: str) -> tuple[Image.Image, dict]:
    bbox = content_bbox(source_frame)
    out = Image.new("RGBA", (BODY_CELL_SIZE, BODY_CELL_SIZE), (0, 0, 0, 0))
    if bbox is None:
        return out, {"empty": True, "scaled": False, "sourceBbox": None, "placedBbox": None}

    cropped = transparentize(source_frame.crop(bbox))
    max_size = BODY_CELL_SIZE - BODY_PAD * 2
    scale = min(1.0, max_size / max(cropped.width, 1), max_size / max(cropped.height, 1))
    scaled = scale < 1.0
    if scaled:
        cropped = cropped.resize(
            (max(1, round(cropped.width * scale)), max(1, round(cropped.height * scale))),
            Image.Resampling.LANCZOS,
        )

    x = (BODY_CELL_SIZE - cropped.width) // 2
    if mode == "air":
        y = (BODY_CELL_SIZE - cropped.height) // 2
    else:
        y = max(0, min(BODY_CELL_SIZE - cropped.height, BODY_BASELINE_Y - cropped.height))
    out.alpha_composite(cropped, (x, y))
    return out, {
        "empty": False,
        "scaled": scaled,
        "scale": round(scale, 4),
        "sourceBbox": list(bbox),
        "placedBbox": [x, y, x + cropped.width - 1, y + cropped.height - 1],
    }


def validate_transparent_atlas(path: Path) -> dict:
    image = Image.open(path).convert("RGBA")
    pixels = image.load()
    opaque = 0
    chroma = 0
    clipped_edges = []
    for y in range(image.height):
        for x in range(image.width):
            r, g, b, a = pixels[x, y]
            if a <= 18:
                continue
            opaque += 1
            if (r, g, b) == CHROMA:
                chroma += 1
            if x in (0, image.width - 1) or y in (0, image.height - 1):
                clipped_edges.append([x, y])
    corners = [(0, 0), (image.width - 1, 0), (0, image.height - 1), (image.width - 1, image.height - 1)]
    return {
        "size": list(image.size),
        "opaquePixels": opaque,
        "remainingOpaqueChromaPixels": chroma,
        "transparentCorners": all(image.getpixel(point)[3] == 0 for point in corners),
        "opaqueCanvasEdgePixels": len(clipped_edges),
    }


def save_frame(path: Path, image: Image.Image) -> str:
    path.parent.mkdir(parents=True, exist_ok=True)
    scrub_exact_chroma(image).save(path)
    return path.relative_to(ROOT).as_posix()


def build_body_sheet(spec: dict) -> dict:
    source_path = SOURCE_DIR / spec["source"]
    source = Image.open(source_path).convert("RGBA")
    span_map = build_span_map(source, spec)
    max_cols = max(row[2] for row in spec["rows"])
    output = Image.new("RGBA", (BODY_CELL_SIZE * max_cols, BODY_CELL_SIZE * len(spec["rows"])), (0, 0, 0, 0))
    row_map = []
    warnings = []

    for row_index, (key, label, frame_count, mode) in enumerate(spec["rows"]):
        row_dir = BODY_FRAMES_DIR / spec["id"] / key
        row_frames = []
        last_frame: Image.Image | None = None
        frame_meta = []
        for frame_index in range(frame_count):
            source_frame = source_frame_for_body(source, spec, span_map, row_index, frame_index, frame_count)
            placed, meta = place_body_frame(source_frame, mode)
            if meta["empty"] and last_frame is not None:
                placed = last_frame.copy()
                meta["heldFromPreviousDueEmptySourceSlot"] = True
                warnings.append(f"{spec['id']} {key} frame {frame_index + 1} held from previous because source slot was empty.")
            elif meta["empty"]:
                warnings.append(f"{spec['id']} {key} frame {frame_index + 1} was empty.")
            else:
                last_frame = placed.copy()
            output.alpha_composite(placed, (frame_index * BODY_CELL_SIZE, row_index * BODY_CELL_SIZE))
            row_frames.append(save_frame(row_dir / f"{key}_{frame_index + 1:02d}.png", placed))
            frame_meta.append({"frame": frame_index + 1, **meta})

        if last_frame is not None:
            for frame_index in range(frame_count, max_cols):
                output.alpha_composite(last_frame, (frame_index * BODY_CELL_SIZE, row_index * BODY_CELL_SIZE))

        row_map.append(
            {
                "row": row_index,
                "animation": key,
                "sourceLabel": label,
                "sourceFrames": frame_count,
                "runtimeFrames": max_cols,
                "verticalMode": mode,
                "pivotMode": "bottom_center" if mode == "ground" else "cell_center",
                "paddedByHoldingLastFrame": frame_count < max_cols,
                "detectedSourceRegions": len(span_map.get(row_index, [])) if row_index in span_map else None,
                "frames": row_frames,
                "frameMeta": frame_meta,
            }
        )

    BODY_OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
    output_path = BODY_OUTPUT_DIR / spec["output"]
    output = scrub_exact_chroma(output)
    output.save(output_path)
    return {
        "id": spec["id"],
        "source": source_path.relative_to(ROOT).as_posix(),
        "output": output_path.relative_to(ROOT).as_posix(),
        "cols": max_cols,
        "rows": len(spec["rows"]),
        "cellSize": BODY_CELL_SIZE,
        "baselineY": BODY_BASELINE_Y,
        "rowMap": row_map,
        "validation": validate_transparent_atlas(output_path),
        "warnings": warnings,
    }


def source_frame_for_vfx(source: Image.Image, row_index: int, frame_index: int) -> Image.Image:
    cell_w, cell_h = VFX_SHEET["sourceCell"]
    left = frame_index * cell_w
    upper = row_index * cell_h
    return source.crop((left, upper, left + cell_w, upper + cell_h))


def build_vfx_sheet() -> dict:
    source_path = SOURCE_DIR / VFX_SHEET["source"]
    source = Image.open(source_path).convert("RGBA")
    cell_w, cell_h = VFX_SHEET["sourceCell"]
    max_cols = VFX_SHEET["sourceCols"]
    output = Image.new("RGBA", (cell_w * max_cols, cell_h * len(VFX_SHEET["rows"])), (0, 0, 0, 0))
    row_map = []
    warnings = []

    for row_index, (key, label, frame_count) in enumerate(VFX_SHEET["rows"]):
        row_dir = VFX_FRAMES_DIR / key
        frames = []
        frame_meta = []
        for frame_index in range(frame_count):
            cell = transparentize(source_frame_for_vfx(source, row_index, frame_index))
            output.alpha_composite(cell, (frame_index * cell_w, row_index * cell_h))
            frame_path = save_frame(row_dir / f"{key}_{frame_index + 1:02d}.png", cell)
            frames.append(frame_path)
            bbox = content_bbox(cell, pad=0)
            if bbox is None:
                warnings.append(f"{key} frame {frame_index + 1} is empty.")
            else:
                left, top, right, bottom = bbox
                edge_pad = min(left, top, cell_w - right, cell_h - bottom)
                if edge_pad <= 0:
                    warnings.append(f"{key} frame {frame_index + 1} touches VFX cell edge.")
            frame_meta.append({"frame": frame_index + 1, "contentBbox": list(bbox) if bbox else None})

        row_map.append(
            {
                "row": row_index,
                "animation": key,
                "sourceLabel": label,
                "sourceFrames": frame_count,
                "runtimeFrames": frame_count,
                "atlasCols": max_cols,
                "pivotMode": VFX_SHEET["pivot"]["mode"],
                "pivot": [VFX_SHEET["pivot"]["x"], VFX_SHEET["pivot"]["y"]],
                "frames": frames,
                "frameMeta": frame_meta,
            }
        )

    VFX_OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
    output_path = VFX_OUTPUT_DIR / VFX_SHEET["output"]
    output = scrub_exact_chroma(output)
    output.save(output_path)
    manifest = {
        "character": "Seris",
        "purpose": "Transparent chain/whip VFX overlay atlas for later Seris runtime layering.",
        "source": source_path.relative_to(ROOT).as_posix(),
        "output": output_path.relative_to(ROOT).as_posix(),
        "cols": max_cols,
        "rows": len(VFX_SHEET["rows"]),
        "cellSize": {"width": cell_w, "height": cell_h},
        "background": "transparent",
        "sourceChromaRemoved": "#FF00FF",
        "layeringRule": "Overlay only. Do not bake into Seris body frames.",
        "rowMap": row_map,
        "validation": validate_transparent_atlas(output_path),
        "warnings": warnings,
    }
    manifest_path = VFX_OUTPUT_DIR / "seris_chain_whip_vfx_manifest.json"
    manifest_path.write_text(json.dumps(manifest, indent=2) + "\n", encoding="utf-8")
    return manifest


def write_mapping_notes(body_manifest: dict, vfx_manifest: dict) -> None:
    lines = [
        "# Seris Animation Mapping Notes",
        "",
        "Asset-only import prep. Seris is not wired into runtime gameplay yet.",
        "",
        "## Body Animation Keys",
        "",
    ]
    for sheet in body_manifest["sheets"]:
        lines.append(f"### {sheet['id']}")
        lines.append("")
        for row in sheet["rowMap"]:
            lines.append(
                f"- `{row['animation']}`: source row {row['row'] + 1}, "
                f"{row['sourceFrames']} source frames, {row['runtimeFrames']} atlas cells, "
                f"{row['verticalMode']} pivot `{row['pivotMode']}`."
            )
        lines.append("")
    lines.extend(["## Chain / Whip VFX Keys", ""])
    for row in vfx_manifest["rowMap"]:
        lines.append(
            f"- `{row['animation']}`: Sheet 8 source row {row['row'] + 1}, "
            f"{row['sourceFrames']} frames, pivot `{row['pivotMode']}` at {row['pivot']}."
        )
    lines.extend(
        [
            "",
            "## Runtime Safety Notes",
            "",
            "- These files are prepared assets and manifests only.",
            "- Do not add Seris to character select or gameplay until the next approved implementation step.",
            "- Sheet 8 VFX is a separate overlay layer and should not replace body animation frames.",
            "- Kairo, Vanta, Nyx, combat logic, stage files, UI files, and controller support were not touched by this extraction script.",
        ]
    )
    (BODY_OUTPUT_DIR / "seris_animation_mapping_notes.md").write_text("\n".join(lines) + "\n", encoding="utf-8")


def main() -> None:
    body_manifest = {
        "character": "Seris",
        "purpose": "Transparent atlas and frame export prep for No Gods Above Seris runtime import.",
        "cellSize": BODY_CELL_SIZE,
        "baselineY": BODY_BASELINE_Y,
        "sourceChromaRemoved": "#FF00FF",
        "identity": "Mid-range divine chain / whip fighter; ivory, black, turquoise, and gold.",
        "runtimeImportStatus": "Not wired. Prepared for a later Seris character config and select card step.",
        "sheets": [],
    }
    for spec in BODY_SHEETS:
        body_manifest["sheets"].append(build_body_sheet(spec))

    BODY_OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
    body_manifest_path = BODY_OUTPUT_DIR / "seris_final_atlas_manifest.json"
    body_manifest_path.write_text(json.dumps(body_manifest, indent=2) + "\n", encoding="utf-8")

    vfx_manifest = build_vfx_sheet()
    write_mapping_notes(body_manifest, vfx_manifest)

    print(json.dumps({"bodyManifest": body_manifest_path.relative_to(ROOT).as_posix(), "vfxManifest": "assets/effects/seris/seris_chain_whip_vfx_manifest.json"}, indent=2))


if __name__ == "__main__":
    main()
