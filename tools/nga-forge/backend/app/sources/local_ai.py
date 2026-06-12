"""Future adapter slot: local image-to-3D models (TripoSR, Stable Fast 3D, Hunyuan3D).

Intentionally unimplemented. Any future implementation must work without CUDA
(target machine is Windows + Radeon RX 9070 XT — check DirectML/ONNX paths) and
must never become a required dependency of NGA Forge.
"""

from __future__ import annotations

ENGINES = ("TripoSR", "Stable Fast 3D", "Hunyuan3D")


def available() -> tuple[bool, str]:
    return False, "Local AI generator adapter is not wired yet. Planned engines: " + ", ".join(ENGINES) + "."
