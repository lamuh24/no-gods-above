from pathlib import Path
from PIL import Image, ImageDraw, ImageFilter


ROOT = Path(__file__).resolve().parents[1]
FRAMES = ROOT / "assets" / "sprites" / "sol_final" / "frames"
SOURCE_OUT = ROOT / "assets" / "sprites" / "sol_generated" / "sol_sheet_9_medium_heavy_corrections_chroma.png"
ATLAS_OUT = ROOT / "assets" / "sprites" / "sol_final" / "sol_sheet_9_medium_heavy_corrections_atlas.png"
FRAME_OUT = ROOT / "assets" / "sprites" / "sol_final" / "frames" / "sheet_9_medium_heavy_corrections"
MANIFEST_OUT = ROOT / "assets" / "sprites" / "sol_final" / "sol_medium_heavy_corrections_manifest.json"

CELL = 448
COLS = 7
ROWS = 3
BASELINE_Y = 382
CHROMA = (255, 0, 255, 255)


ROWS_SPEC = [
    {
        "key": "back_medium",
        "label": "Counter Elbow / Retreating Palm",
        "frames": 6,
        "sources": [
            ("sheet_6_defense_hit_reactions", "stand_block", 0),
            ("sheet_6_defense_hit_reactions", "stand_block", 1),
            ("sheet_3_ground_normals", "medium_attack", 1),
            ("sheet_3_ground_normals", "medium_attack", 2),
            ("sheet_6_defense_hit_reactions", "stand_block", 2),
            ("sheet_6_defense_hit_reactions", "stand_block", 3),
        ],
        "offsets": [(0, 0), (-8, 0), (-20, 0), (-28, 0), (-18, 0), (-6, 0)],
        "spark": [(4, 292, 244, 0.52)],
        "guard_glint": [(2, 268, 222, 0.54), (4, 280, 236, 0.5)],
        "dust": [(3, 0.34), (4, 0.42)],
    },
    {
        "key": "forward_heavy",
        "label": "Furnace Drive / Advancing Hook",
        "frames": 7,
        "sources": [
            ("sheet_3_ground_normals", "medium_attack", 0),
            ("sheet_3_ground_normals", "medium_attack", 1),
            ("sheet_3_ground_normals", "medium_attack", 2),
            ("sheet_3_ground_normals", "medium_attack", 3),
            ("sheet_3_ground_normals", "medium_attack", 4),
            ("sheet_3_ground_normals", "medium_attack", 5),
            ("sheet_3_ground_normals", "medium_attack", 5),
        ],
        "offsets": [(0, 0), (10, 0), (24, 0), (36, 0), (28, 0), (16, 0), (6, 0)],
        "spark": [(4, 386, 244, 0.82), (5, 366, 246, 0.52)],
        "ring": [(4, 374, 246, 38)],
        "dust": [(3, 0.48), (4, 0.68), (5, 0.42)],
    },
    {
        "key": "back_heavy",
        "label": "Iron Reversal / Guarded Counter Blow",
        "frames": 7,
        "sources": [
            ("sheet_6_defense_hit_reactions", "stand_block", 0),
            ("sheet_6_defense_hit_reactions", "stand_block", 1),
            ("sheet_3_ground_normals", "medium_attack", 1),
            ("sheet_3_ground_normals", "medium_attack", 2),
            ("sheet_3_ground_normals", "medium_attack", 3),
            ("sheet_3_ground_normals", "medium_attack", 4),
            ("sheet_3_ground_normals", "medium_attack", 5),
        ],
        "offsets": [(0, 0), (-10, 0), (-20, 0), (-30, 0), (-38, 0), (-26, 0), (-12, 0)],
        "spark": [(4, 284, 242, 0.72), (5, 292, 244, 0.44)],
        "ring": [(4, 288, 242, 34)],
        "guard_glint": [(2, 260, 218, 0.58), (6, 274, 226, 0.42)],
        "dust": [(3, 0.35), (4, 0.5), (5, 0.35)],
    },
]


def load_frame(sheet, key, index):
    folder = FRAMES / sheet / key
    paths = sorted(folder.glob("*.png"))
    if not paths:
        raise FileNotFoundError(folder)
    return Image.open(paths[min(index, len(paths) - 1)]).convert("RGBA")


def shifted_frame(base, offset):
    cell = Image.new("RGBA", (CELL, CELL), (0, 0, 0, 0))
    cell.alpha_composite(base, offset)
    return cell


def draw_spark(cell, x, y, strength):
    layer = Image.new("RGBA", (CELL, CELL), (0, 0, 0, 0))
    draw = ImageDraw.Draw(layer)
    radius = int(18 * strength)
    draw.ellipse((x - radius, y - radius, x + radius, y + radius), fill=(255, 208, 62, int(90 * strength)))
    for i, (dx, dy) in enumerate([(30, 0), (-20, 0), (0, -24), (0, 18), (18, -14), (-14, 14)]):
        draw.line((x, y, x + dx * strength, y + dy * strength), fill=(255, 236, 126, int(225 * strength)), width=3 if i < 2 else 2)
    draw.ellipse((x - 5, y - 5, x + 5, y + 5), fill=(255, 255, 220, int(235 * strength)))
    cell.alpha_composite(layer.filter(ImageFilter.GaussianBlur(0.35)))


def draw_ring(cell, x, y, radius):
    layer = Image.new("RGBA", (CELL, CELL), (0, 0, 0, 0))
    draw = ImageDraw.Draw(layer)
    draw.ellipse((x - radius, y - radius // 2, x + radius, y + radius // 2), outline=(255, 207, 72, 170), width=4)
    cell.alpha_composite(layer.filter(ImageFilter.GaussianBlur(0.5)))


def draw_guard_glint(cell, x, y, strength):
    layer = Image.new("RGBA", (CELL, CELL), (0, 0, 0, 0))
    draw = ImageDraw.Draw(layer)
    draw.line((x - 18, y + 12, x + 14, y - 14), fill=(255, 225, 96, int(185 * strength)), width=4)
    draw.line((x - 8, y + 14, x + 22, y - 8), fill=(255, 247, 190, int(145 * strength)), width=2)
    cell.alpha_composite(layer.filter(ImageFilter.GaussianBlur(0.35)))


def draw_dust(cell, strength):
    layer = Image.new("RGBA", (CELL, CELL), (0, 0, 0, 0))
    draw = ImageDraw.Draw(layer)
    alpha = int(105 * strength)
    for x, y, w in [(180, 382, 18), (238, 386, 22), (300, 383, 16)]:
        draw.ellipse((x - w, y - w // 3, x + w, y + w // 3), fill=(195, 142, 66, alpha))
    cell.alpha_composite(layer.filter(ImageFilter.GaussianBlur(1.1)))


def has_edge_risk(cell):
    bbox = cell.getchannel("A").getbbox()
    if not bbox:
        return False
    left, top, right, bottom = bbox
    return left <= 2 or top <= 2 or right >= CELL - 2 or bottom >= CELL - 2


def to_chroma(cell):
    bg = Image.new("RGBA", (CELL, CELL), CHROMA)
    bg.alpha_composite(cell)
    return bg


def build():
    SOURCE_OUT.parent.mkdir(parents=True, exist_ok=True)
    ATLAS_OUT.parent.mkdir(parents=True, exist_ok=True)
    FRAME_OUT.mkdir(parents=True, exist_ok=True)

    source_sheet = Image.new("RGBA", (COLS * CELL, ROWS * CELL), CHROMA)
    atlas = Image.new("RGBA", (COLS * CELL, ROWS * CELL), (0, 0, 0, 0))
    manifest_rows = []
    failures = []

    for row_index, spec in enumerate(ROWS_SPEC):
        row_dir = FRAME_OUT / spec["key"]
        row_dir.mkdir(parents=True, exist_ok=True)
        row_manifest = {
            "row": row_index + 1,
            "key": spec["key"],
            "label": spec["label"],
            "frames": spec["frames"],
            "atlasColumns": COLS,
            "pivot": {"mode": "lockedFrameBottomCenter", "x": CELL // 2, "y": BASELINE_Y},
            "cells": [],
        }

        for col in range(COLS):
            display_index = min(col, spec["frames"] - 1)
            base = load_frame(*spec["sources"][display_index])
            cell = shifted_frame(base, spec["offsets"][display_index])
            for spark_frame, x, y, strength in spec.get("spark", []):
                if spark_frame - 1 == display_index:
                    draw_spark(cell, x, y, strength)
            for ring_frame, x, y, radius in spec.get("ring", []):
                if ring_frame - 1 == display_index:
                    draw_ring(cell, x, y, radius)
            for glint_frame, x, y, strength in spec.get("guard_glint", []):
                if glint_frame - 1 == display_index:
                    draw_guard_glint(cell, x, y, strength)
            for dust_frame, strength in spec.get("dust", []):
                if dust_frame - 1 == display_index:
                    draw_dust(cell, strength)

            edge_risk = has_edge_risk(cell)
            if edge_risk:
                failures.append(f"{spec['key']} frame {display_index + 1} touches edge")

            x0 = col * CELL
            y0 = row_index * CELL
            source_sheet.alpha_composite(to_chroma(cell), (x0, y0))
            atlas.alpha_composite(cell, (x0, y0))
            frame_path = row_dir / f"{spec['key']}_{display_index + 1:02d}.png"
            cell.save(frame_path)
            row_manifest["cells"].append({
                "column": col + 1,
                "displayFrame": display_index + 1,
                "file": str(frame_path.relative_to(ROOT)).replace("\\", "/"),
                "heldFromFinalPose": col >= spec["frames"],
                "edgeTouchRisk": edge_risk,
            })

        manifest_rows.append(row_manifest)

    source_sheet.save(SOURCE_OUT)
    atlas.save(ATLAS_OUT)

    import json
    manifest = {
        "character": "Sol Raze",
        "sheet": "medium_heavy_directional_corrections",
        "status": "asset_ready_not_runtime_mapped",
        "cellSize": CELL,
        "baselineY": BASELINE_Y,
        "cols": COLS,
        "rows": ROWS,
        "frameCounts": [row["frames"] for row in ROWS_SPEC],
        "sourceChroma": str(SOURCE_OUT.relative_to(ROOT)).replace("\\", "/"),
        "transparentAtlas": str(ATLAS_OUT.relative_to(ROOT)).replace("\\", "/"),
        "intendedRuntimeMappings": {
            "back_medium": {"sheet": "solMediumHeavyCorrections", "row": 0},
            "forward_heavy": {"sheet": "solMediumHeavyCorrections", "row": 1},
            "back_heavy": {"sheet": "solMediumHeavyCorrections", "row": 2},
        },
        "runtimeHookupDeferred": "game.js was intentionally not edited because parallel Seris revamp work is active",
        "knownIssues": [
            "Sol directional Heavy has a minor visual pop/recovery snap in one row. Accepted temporarily for playtesting. Does not affect gameplay."
        ],
        "playtestDecision": "Accepted as usable for temporary Sol playable smoke testing / matchup testing; revisit later in a dedicated Sol polish pass if it remains distracting in-game.",
        "rows": manifest_rows,
        "failures": failures,
    }
    MANIFEST_OUT.write_text(json.dumps(manifest, indent=2), encoding="utf-8")

    if failures:
        raise SystemExit("\n".join(failures))
    print(json.dumps({
        "source": str(SOURCE_OUT.relative_to(ROOT)).replace("\\", "/"),
        "atlas": str(ATLAS_OUT.relative_to(ROOT)).replace("\\", "/"),
        "manifest": str(MANIFEST_OUT.relative_to(ROOT)).replace("\\", "/"),
        "frameCounts": manifest["frameCounts"],
        "failures": failures,
    }, indent=2))


if __name__ == "__main__":
    build()
