"""Future adapter slot: hosted image-to-3D APIs (Meshy, Tripo, Rodin).

Intentionally unimplemented. When a real adapter lands it must expose
`available() -> tuple[bool, str]` and `generate(record, progress) -> SourceResult`
with the same contract as sources/placeholder.py.
"""

from __future__ import annotations

ENGINES = ("Meshy", "Tripo", "Rodin")


def available() -> tuple[bool, str]:
    return False, "External AI API adapter is not wired yet. Planned engines: " + ", ".join(ENGINES) + "."
