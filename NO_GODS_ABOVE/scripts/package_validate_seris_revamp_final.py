#!/usr/bin/env python3
"""Collect and validate the authoritative Seris revamp runtime atlases.

This script copies the approved Sheet 1-7 outputs into a clean final folder,
validates their fixed-cell runtime contracts, and writes per-sheet contact
sheets plus one JSON summary. It does not alter gameplay or runtime code.
"""

from __future__ import annotations

import hashlib
import json
import shutil
from collections import deque
from dataclasses import dataclass
from pathlib import Path
from typing import Any

import numpy as np
from PIL import Image, ImageDraw, ImageFont


ROOT = Path(__file__).resolve().parents[1]
SOURCE_DIR = ROOT / "assets" / "sprites" / "seris_revamp"
FINAL_DIR = ROOT / "assets" / "sprites" / "seris_revamp_final"
VALIDATION_DIR = FINAL_DIR / "validation"


@dataclass(frozen=True)
class SheetContract:
    sheet: int
    label: str
    source: Path
    output_name: str
    atlas: tuple[int, int]
    grid: tuple[int, int]
    cell: tuple[int, int]
    frame_counts: list[int]


SHEETS = [
    SheetContract(
        1,
        "core_movement",
        SOURCE_DIR / "seris_sheet_1_core_movement_revamp_atlas.png",
        "seris_revamp_final_sheet_1_core_movement_atlas.png",
        (3072, 2304),
        (8, 6),
        (384, 384),
        [8, 6, 6, 6, 6, 4],
    ),
    SheetContract(
        2,
        "air_movement",
        SOURCE_DIR / "seris_sheet_2_air_movement_revamp_atlas.png",
        "seris_revamp_final_sheet_2_air_movement_atlas.png",
        (2304, 2304),
        (6, 6),
        (384, 384),
        [4, 4, 4, 4, 6, 6],
    ),
    SheetContract(
        3,
        "ground_normals",
        SOURCE_DIR / "seris_sheet_3_ground_normals_revamp_atlas.png",
        "seris_revamp_final_sheet_3_ground_normals_atlas.png",
        (6656, 1792),
        (8, 4),
        (832, 448),
        [4, 8, 7, 7],
    ),
    SheetContract(
        4,
        "air_normals",
        SOURCE_DIR / "seris_sheet_4_air_normals_revamp_atlas_row2stripfix.png",
        "seris_revamp_final_sheet_4_air_normals_atlas.png",
        (5824, 1792),
        (7, 4),
        (832, 448),
        [4, 6, 7, 4],
    ),
    SheetContract(
        5,
        "specials_body",
        SOURCE_DIR / "seris_sheet_5_specials_body_revamp_atlas.png",
        "seris_revamp_final_sheet_5_specials_body_atlas.png",
        (6656, 2688),
        (8, 6),
        (832, 448),
        [4, 6, 4, 8, 8, 4],
    ),
    SheetContract(
        6,
        "defense_hit_reactions",
        SOURCE_DIR / "seris_sheet_6_defense_hit_reactions_revamp_atlas.png",
        "seris_revamp_final_sheet_6_defense_hit_reactions_atlas.png",
        (2304, 3072),
        (6, 8),
        (384, 384),
        [4, 4, 4, 3, 4, 6, 5, 5],
    ),
    SheetContract(
        7,
        "knockdown_recovery_flavor",
        SOURCE_DIR / "seris_sheet_7_knockdown_recovery_flavor_revamp_atlas.png",
        "seris_revamp_final_sheet_7_knockdown_recovery_flavor_atlas.png",
        (3072, 2688),
        (8, 7),
        (384, 384),
        [6, 3, 6, 8, 8, 8, 8],
    ),
]


def rel(path: Path) -> str:
    return path.resolve().relative_to(ROOT).as_posix()


def sha256(path: Path) -> str:
    h = hashlib.sha256()
    with path.open("rb") as f:
        for chunk in iter(lambda: f.read(1024 * 1024), b""):
            h.update(chunk)
    return h.hexdigest()


def connected_components(mask: np.ndarray) -> list[dict[str, int]]:
    height, width = mask.shape
    seen = np.zeros(mask.shape, dtype=bool)
    components: list[dict[str, int]] = []
    ys, xs = np.where(mask)
    for start_y, start_x in zip(ys, xs):
        if seen[start_y, start_x]:
            continue
        q: deque[tuple[int, int]] = deque([(int(start_y), int(start_x))])
        seen[start_y, start_x] = True
        area = 0
        min_x = max_x = int(start_x)
        min_y = max_y = int(start_y)
        while q:
            y, x = q.popleft()
            area += 1
            min_x = min(min_x, x)
            max_x = max(max_x, x)
            min_y = min(min_y, y)
            max_y = max(max_y, y)
            for ny in (y - 1, y, y + 1):
                for nx in (x - 1, x, x + 1):
                    if ny == y and nx == x:
                        continue
                    if 0 <= ny < height and 0 <= nx < width and mask[ny, nx] and not seen[ny, nx]:
                        seen[ny, nx] = True
                        q.append((ny, nx))
        components.append({"area": area, "minX": min_x, "minY": min_y, "maxX": max_x, "maxY": max_y})
    return components


def make_contact_sheet(image: Image.Image, contract: SheetContract, output_path: Path) -> None:
    cols, rows = contract.grid
    cell_w, cell_h = contract.cell
    scale = min(0.42, 134 / max(cell_w, cell_h))
    thumb_w = max(1, int(cell_w * scale))
    thumb_h = max(1, int(cell_h * scale))
    label_w = 250
    label_h = 20
    font = ImageFont.load_default()
    out = Image.new("RGBA", (label_w + cols * thumb_w, rows * (thumb_h + label_h)), (28, 26, 34, 255))
    draw = ImageDraw.Draw(out)
    for row in range(rows):
        y = row * (thumb_h + label_h)
        draw.text((4, y + 4), f"row {row} ({contract.frame_counts[row]})", fill=(232, 232, 238), font=font)
        for col in range(cols):
            x = label_w + col * thumb_w
            cell = image.crop((col * cell_w, row * cell_h, (col + 1) * cell_w, (row + 1) * cell_h))
            bg = Image.new("RGBA", cell.size, (42, 40, 50, 255))
            bg.alpha_composite(cell)
            out.alpha_composite(bg.resize((thumb_w, thumb_h), Image.Resampling.NEAREST), (x, y + label_h))
            outline = (95, 92, 112, 255) if col < contract.frame_counts[row] else (170, 120, 80, 255)
            draw.rectangle((x, y + label_h, x + thumb_w - 1, y + label_h + thumb_h - 1), outline=outline)
            draw.text((x + 3, y + 4), str(col), fill=(210, 210, 218), font=font)
    output_path.parent.mkdir(parents=True, exist_ok=True)
    out.convert("RGB").save(output_path)


def validate_cells(arr: np.ndarray, contract: SheetContract) -> tuple[list[dict[str, Any]], list[str], list[str]]:
    cols, rows = contract.grid
    cell_w, cell_h = contract.cell
    failures: list[str] = []
    warnings: list[str] = []
    cells: list[dict[str, Any]] = []
    for row in range(rows):
        for col in range(cols):
            x0 = col * cell_w
            y0 = row * cell_h
            cell = arr[y0 : y0 + cell_h, x0 : x0 + cell_w, :]
            alpha = cell[:, :, 3] > 0
            cell_i = cell.astype(np.int16)
            r = cell_i[:, :, 0]
            g = cell_i[:, :, 1]
            b = cell_i[:, :, 2]
            mx = np.maximum.reduce([r, g, b])
            mn = np.minimum.reduce([r, g, b])
            opaque = int(alpha.sum())
            magenta = alpha & (r > 220) & (g < 40) & (b > 220)
            green = alpha & (g > 50) & (r < 150) & (b < 150) & (g - r > 15) & (g - b > 15)
            bright_low_sat = alpha & (r > 238) & (g > 238) & (b > 238) & ((mx - mn) < 24)
            edge = np.zeros(alpha.shape, dtype=bool)
            edge[:4, :] = True
            edge[-4:, :] = True
            edge[:, :4] = True
            edge[:, -4:] = True
            top_bottom = np.zeros(alpha.shape, dtype=bool)
            top_bottom[:16, :] = True
            top_bottom[-16:, :] = True
            vertical_grid = [
                c for c in connected_components(bright_low_sat)
                if c["maxY"] - c["minY"] + 1 >= 18 and c["maxX"] - c["minX"] + 1 <= 3 and c["area"] >= 18
            ]
            horizontal_grid = [
                c for c in connected_components(bright_low_sat)
                if c["maxX"] - c["minX"] + 1 >= 25 and c["maxY"] - c["minY"] + 1 <= 8 and c["area"] >= 25
            ]
            top_bottom_components = [
                c for c in connected_components(alpha & top_bottom) if c["area"] >= 30
            ]
            edge_count = int((alpha & edge).sum())
            magenta_count = int(magenta.sum())
            green_count = int(green.sum())
            is_trailing = col >= contract.frame_counts[row]
            label = f"sheet {contract.sheet} row {row} col {col}"
            if not is_trailing and opaque == 0:
                failures.append(f"{label}: active frame is empty")
            if magenta_count:
                failures.append(f"{label}: contains {magenta_count} opaque magenta/checker pixels")
            if green_count:
                failures.append(f"{label}: contains {green_count} opaque green/chroma pixels")
            if edge_count:
                failures.append(f"{label}: {edge_count} opaque pixels touch the 4px cell edge margin")
            if vertical_grid or horizontal_grid:
                failures.append(f"{label}: preview grid/margin fragments detected")
            if top_bottom_components:
                failures.append(f"{label}: top/bottom edge fragments detected: {top_bottom_components}")
            if is_trailing and opaque and not edge_count and not top_bottom_components:
                warnings.append(f"{label}: trailing cell is non-empty; visually confirm clean held pose")
            cells.append(
                {
                    "row": row,
                    "col": col,
                    "activeFrame": not is_trailing,
                    "opaquePixels": opaque,
                    "opaqueGreenPixels": green_count,
                    "opaqueMagentaPixels": magenta_count,
                    "cellEdgeOpaquePixels": edge_count,
                    "topBottomFragments": top_bottom_components,
                }
            )
    return cells, failures, warnings


def validate_sheet(path: Path, contract: SheetContract) -> dict[str, Any]:
    failures: list[str] = []
    warnings: list[str] = []
    image = Image.open(path)
    has_alpha = image.mode in ("RGBA", "LA") or "transparency" in image.info
    rgba = image.convert("RGBA")
    arr = np.asarray(rgba)
    alpha = arr[:, :, 3] > 0
    if rgba.size != contract.atlas:
        failures.append(f"Expected {contract.atlas[0]}x{contract.atlas[1]}, got {rgba.width}x{rgba.height}")
    if not has_alpha:
        failures.append("PNG must include alpha")
    if not np.any(~alpha):
        failures.append("PNG has no transparent pixels")
    edge = np.zeros(alpha.shape, dtype=bool)
    edge[0, :] = True
    edge[-1, :] = True
    edge[:, 0] = True
    edge[:, -1] = True
    outer_edge_opaque = int((alpha & edge).sum())
    if outer_edge_opaque:
        failures.append(f"Atlas outer edge has {outer_edge_opaque} opaque pixels")
    cells: list[dict[str, Any]] = []
    if rgba.size == contract.atlas:
        cells, cell_failures, cell_warnings = validate_cells(arr, contract)
        failures.extend(cell_failures)
        warnings.extend(cell_warnings)
    contact_path = VALIDATION_DIR / f"{path.stem}_contact.png"
    make_contact_sheet(rgba, contract, contact_path)
    report = {
        "sheet": contract.sheet,
        "label": contract.label,
        "input": rel(path),
        "status": "pass" if not failures else "fail",
        "contract": {
            "atlas": list(contract.atlas),
            "grid": list(contract.grid),
            "cell": list(contract.cell),
            "frameCounts": contract.frame_counts,
        },
        "checks": {
            "actualSize": [rgba.width, rgba.height],
            "hasAlpha": has_alpha,
            "transparentPixels": int((~alpha).sum()),
            "opaquePixels": int(alpha.sum()),
            "outerEdgeOpaquePixels": outer_edge_opaque,
        },
        "sha256": sha256(path),
        "failures": failures,
        "warnings": warnings,
        "cells": cells,
        "contactSheet": rel(contact_path),
    }
    report_path = VALIDATION_DIR / f"{path.stem}_validation_report.json"
    report_path.write_text(json.dumps(report, indent=2), encoding="utf-8")
    report["report"] = rel(report_path)
    return report


def make_summary_contact(reports: list[dict[str, Any]], output_path: Path) -> None:
    thumbs = []
    font = ImageFont.load_default()
    for report in reports:
        contact = Image.open(ROOT / report["contactSheet"]).convert("RGB")
        max_w = 540
        scale = min(1.0, max_w / contact.width)
        thumb = contact.resize((int(contact.width * scale), int(contact.height * scale)), Image.Resampling.BILINEAR)
        thumbs.append((report, thumb))
    width = max(t.width for _, t in thumbs) + 24
    height = sum(t.height + 46 for _, t in thumbs) + 12
    out = Image.new("RGB", (width, height), (24, 22, 30))
    draw = ImageDraw.Draw(out)
    y = 8
    for report, thumb in thumbs:
        status_color = (128, 230, 150) if report["status"] == "pass" else (255, 110, 90)
        draw.text((10, y), f"Sheet {report['sheet']} - {report['label']} - {report['status'].upper()}", fill=status_color, font=font)
        draw.text((10, y + 16), f"{report['contract']['atlas']} grid {report['contract']['grid']} cell {report['contract']['cell']}", fill=(222, 222, 230), font=font)
        out.paste(thumb, (10, y + 38))
        y += thumb.height + 46
    output_path.parent.mkdir(parents=True, exist_ok=True)
    out.save(output_path)


def main() -> int:
    FINAL_DIR.mkdir(parents=True, exist_ok=True)
    VALIDATION_DIR.mkdir(parents=True, exist_ok=True)
    copied = []
    for contract in SHEETS:
        if not contract.source.exists():
            raise FileNotFoundError(f"Missing approved source for Sheet {contract.sheet}: {contract.source}")
        output = FINAL_DIR / contract.output_name
        shutil.copy2(contract.source, output)
        copied.append({"sheet": contract.sheet, "source": rel(contract.source), "output": rel(output)})

    reports = [validate_sheet(FINAL_DIR / contract.output_name, contract) for contract in SHEETS]
    summary_contact = VALIDATION_DIR / "seris_revamp_final_all_sheets_contact.png"
    make_summary_contact(reports, summary_contact)
    summary = {
        "status": "pass" if all(r["status"] == "pass" for r in reports) else "fail",
        "finalDirectory": rel(FINAL_DIR),
        "copied": copied,
        "reports": reports,
        "summaryContactSheet": rel(summary_contact),
    }
    summary_path = VALIDATION_DIR / "seris_revamp_final_validation_summary.json"
    summary_path.write_text(json.dumps(summary, indent=2), encoding="utf-8")
    print(json.dumps({"status": summary["status"], "summary": rel(summary_path), "summaryContactSheet": rel(summary_contact)}, indent=2))
    return 0 if summary["status"] == "pass" else 1


if __name__ == "__main__":
    raise SystemExit(main())
