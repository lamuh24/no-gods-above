#!/usr/bin/env python3
from __future__ import annotations

import argparse
import json
import sys
from pathlib import Path


FORGE_ROOT = Path(__file__).resolve().parents[1]
BACKEND_ROOT = FORGE_ROOT / "backend"
if str(BACKEND_ROOT) not in sys.path:
    sys.path.insert(0, str(BACKEND_ROOT))

from app.pipeline.motion_slice import (  # noqa: E402
    LEGACY_LAMUH_ATLAS,
    LEGACY_LAMUH_SOURCE_RELPATH,
    build_lamuh_legacy_motion_fixture,
)


def main() -> int:
    parser = argparse.ArgumentParser(
        description="Rebuild the rejected, non-deployable Lamuh legacy motion technical fixture."
    )
    parser.add_argument(
        "--output",
        type=Path,
        default=FORGE_ROOT / "review" / "lamuh-legacy-motion-fixture",
        help="Forge-local output folder. Existing contents are replaced only after a successful staged build.",
    )
    args = parser.parse_args()
    review_root = (FORGE_ROOT / "review").resolve()
    output = args.output.resolve()
    if output == review_root or review_root not in output.parents:
        parser.error(f"--output must be a child folder of {review_root}")
    summary = build_lamuh_legacy_motion_fixture(
        LEGACY_LAMUH_ATLAS,
        output,
        LEGACY_LAMUH_SOURCE_RELPATH,
    )
    print(json.dumps(summary, indent=2))
    return 0 if summary["validation"]["hardGatesPassed"] else 2


if __name__ == "__main__":
    raise SystemExit(main())
