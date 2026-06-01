from pathlib import Path
from PIL import Image, ImageDraw, ImageFilter


ROOT = Path(__file__).resolve().parents[1]
FRAMES = ROOT / "assets" / "sprites" / "sol_final" / "frames"
SOURCE_OUT = ROOT / "assets" / "sprites" / "sol_generated" / "sol_sheet_8_directional_normals_chroma.png"
ATLAS_OUT = ROOT / "assets" / "sprites" / "sol_final" / "sol_sheet_8_directional_normals_atlas.png"
FRAME_OUT = ROOT / "assets" / "sprites" / "sol_final" / "frames" / "sheet_8_directional_normals"
MANIFEST_OUT = ROOT / "assets" / "sprites" / "sol_final" / "sol_directional_normals_manifest.json"

CELL = 448
COLS = 6
ROWS = 6
BASELINE_Y = 382
CHROMA = (255, 0, 255, 255)


ROWS_SPEC = [
    {
        "key": "forward_light",
        "label": "Step Jab",
        "frames": 4,
        "source": ("sheet_3_ground_normals", "light_attack"),
        "offsets": [(0, 0), (14, 0), (28, 0), (16, 0)],
        "spark": [(2, 342, 248, 0.58), (3, 350, 249, 0.74), (4, 326, 250, 0.34)],
        "dust": [(2, 0.55), (3, 0.8), (4, 0.45)],
    },
    {
        "key": "back_light",
        "label": "Guard Check",
        "frames": 4,
        "source": ("sheet_6_defense_hit_reactions", "stand_block"),
        "offsets": [(0, 0), (-12, 0), (-30, 0), (-18, 0)],
        "spark": [(2, 298, 230, 0.42), (3, 286, 229, 0.62)],
        "guard_glint": [(2, 258, 215, 0.5), (3, 272, 220, 0.6)],
    },
    {
        "key": "down_light",
        "label": "Low Body Tap",
        "frames": 4,
        "source": ("sheet_6_defense_hit_reactions", "crouch_block"),
        "offsets": [(0, 0), (4, 0), (16, 0), (6, 0)],
        "spark": [(2, 314, 324, 0.42), (3, 330, 331, 0.6)],
        "dust": [(3, 0.45)],
    },
    {
        "key": "forward_medium",
        "label": "Advancing Iron Palm",
        "frames": 6,
        "source": ("sheet_5_specials", "radiant_break"),
        "offsets": [(0, 0), (12, 0), (28, 0), (38, 0), (24, 0), (8, 0)],
        "spark": [(3, 344, 245, 0.74), (4, 366, 244, 0.9), (5, 340, 247, 0.42)],
        "ring": [(4, 356, 246, 42)],
        "dust": [(3, 0.5), (4, 0.65)],
    },
    {
        "key": "back_medium",
        "label": "Counter Elbow",
        "frames": 6,
        "source": ("sheet_3_ground_normals", "heavy_attack"),
        "offsets": [(0, 0), (-10, 0), (-24, 0), (-34, 0), (-24, 0), (-8, 0)],
        "spark": [(3, 300, 236, 0.58), (4, 284, 238, 0.72), (5, 300, 240, 0.34)],
        "ring": [(4, 288, 238, 30)],
        "guard_glint": [(2, 250, 220, 0.42)],
    },
    {
        "key": "down_medium",
        "label": "Low Knee Body Blow",
        "frames": 6,
        "source": ("sheet_6_defense_hit_reactions", "crouch_block"),
        "offsets": [(0, 0), (2, 0), (12, 0), (28, 0), (16, 0), (4, 0)],
        "spark": [(3, 330, 330, 0.58), (4, 350, 342, 0.82), (5, 322, 336, 0.38)],
        "dust": [(3, 0.5), (4, 0.72), (5, 0.45)],
    },
]


def load_frames(sheet, key):
    folder = FRAMES / sheet / key
    paths = sorted(folder.glob("*.png"))
    if not paths:
        raise FileNotFoundError(folder)
    return [Image.open(path).convert("RGBA") for path in paths]


def shifted_frame(base, offset):
    cell = Image.new("RGBA", (CELL, CELL), (0, 0, 0, 0))
    cell.alpha_composite(base, offset)
    return cell


def draw_spark(cell, x, y, strength):
    layer = Image.new("RGBA", (CELL, CELL), (0, 0, 0, 0))
    draw = ImageDraw.Draw(layer)
    radius = int(18 * strength)
    draw.ellipse((x - radius, y - radius, x + radius, y + radius), fill=(255, 208, 62, int(90 * strength)))
    for i, (dx, dy) in enumerate([(28, 0), (-18, 0), (0, -22), (0, 18), (18, -14), (-14, 14)]):
        width = 3 if i < 2 else 2
        draw.line((x, y, x + dx * strength, y + dy * strength), fill=(255, 236, 126, int(230 * strength)), width=width)
    draw.ellipse((x - 5, y - 5, x + 5, y + 5), fill=(255, 255, 220, int(240 * strength)))
    cell.alpha_composite(layer.filter(ImageFilter.GaussianBlur(0.35)))


def draw_ring(cell, x, y, radius):
    layer = Image.new("RGBA", (CELL, CELL), (0, 0, 0, 0))
    draw = ImageDraw.Draw(layer)
    draw.ellipse((x - radius, y - radius // 2, x + radius, y + radius // 2), outline=(255, 207, 72, 185), width=4)
    cell.alpha_composite(layer.filter(ImageFilter.GaussianBlur(0.5)))


def draw_guard_glint(cell, x, y, strength):
    layer = Image.new("RGBA", (CELL, CELL), (0, 0, 0, 0))
    draw = ImageDraw.Draw(layer)
    alpha = int(190 * strength)
    draw.line((x - 18, y + 12, x + 16, y - 14), fill=(255, 225, 96, alpha), width=4)
    draw.line((x - 8, y + 16, x + 24, y - 8), fill=(255, 247, 190, int(150 * strength)), width=2)
    draw.ellipse((x - 5, y - 5, x + 5, y + 5), fill=(255, 245, 168, int(160 * strength)))
    cell.alpha_composite(layer.filter(ImageFilter.GaussianBlur(0.35)))


def draw_low_check(cell, x, y, strength):
    layer = Image.new("RGBA", (CELL, CELL), (0, 0, 0, 0))
    draw = ImageDraw.Draw(layer)
    alpha = int(190 * strength)
    draw.arc((x - 46, y - 16, x + 34, y + 38), 205, 340, fill=(255, 199, 54, alpha), width=5)
    draw.line((x - 18, y + 6, x + 26, y + 12), fill=(255, 242, 154, int(170 * strength)), width=3)
    cell.alpha_composite(layer.filter(ImageFilter.GaussianBlur(0.35)))


def draw_low_arc(cell, frame_index):
    layer = Image.new("RGBA", (CELL, CELL), (0, 0, 0, 0))
    draw = ImageDraw.Draw(layer)
    alpha = [0, 70, 150, 220, 130, 50][frame_index]
    if alpha <= 0:
        return
    draw.arc((185, 312, 360, 390), 190, 340, fill=(255, 199, 54, alpha), width=7)
    draw.arc((205, 326, 348, 386), 190, 342, fill=(255, 244, 166, min(255, alpha + 25)), width=3)
    cell.alpha_composite(layer.filter(ImageFilter.GaussianBlur(0.35)))


def draw_dust(cell, frame_index, strength=1.0):
    layer = Image.new("RGBA", (CELL, CELL), (0, 0, 0, 0))
    draw = ImageDraw.Draw(layer)
    alpha = int((110 if frame_index in {2, 3} else 76) * strength)
    for x, y, w in [(180, 382, 18), (238, 386, 22), (300, 383, 16)]:
        draw.ellipse((x - w, y - w // 3, x + w, y + w // 3), fill=(195, 142, 66, alpha))
    cell.alpha_composite(layer.filter(ImageFilter.GaussianBlur(1.1)))


def has_edge_risk(cell):
    alpha = cell.getchannel("A")
    bbox = alpha.getbbox()
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
        source_frames = load_frames(*spec["source"])
        row_dir = FRAME_OUT / spec["key"]
        row_dir.mkdir(parents=True, exist_ok=True)
        row_manifest = {
            "row": row_index + 1,
            "key": spec["key"],
            "label": spec["label"],
            "frames": spec["frames"],
            "atlasColumns": COLS,
            "source": "/".join(spec["source"]),
            "pivot": {"mode": "lockedFrameBottomCenter", "x": CELL // 2, "y": BASELINE_Y},
            "cells": [],
        }

        for col in range(COLS):
            display_index = min(col, spec["frames"] - 1)
            base = source_frames[min(display_index, len(source_frames) - 1)]
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
            for check_frame, x, y, strength in spec.get("low_check", []):
                if check_frame - 1 == display_index:
                    draw_low_check(cell, x, y, strength)
            if spec.get("low_arc"):
                draw_low_arc(cell, display_index)
            for dust_frame, strength in spec.get("dust", []):
                if dust_frame - 1 == display_index:
                    draw_dust(cell, display_index, strength)

            if has_edge_risk(cell):
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
                "edgeTouchRisk": has_edge_risk(cell),
            })

        manifest_rows.append(row_manifest)

    source_sheet.save(SOURCE_OUT)
    atlas.save(ATLAS_OUT)

    manifest = {
        "character": "Sol Raze",
        "sheet": "directional_normals",
        "status": "runtime_ready",
        "cellSize": CELL,
        "baselineY": BASELINE_Y,
        "cols": COLS,
        "rows": ROWS,
        "frameCounts": [row["frames"] for row in ROWS_SPEC],
        "sourceChroma": str(SOURCE_OUT.relative_to(ROOT)).replace("\\", "/"),
        "transparentAtlas": str(ATLAS_OUT.relative_to(ROOT)).replace("\\", "/"),
        "rows": manifest_rows,
        "failures": failures,
    }
    import json
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
