from __future__ import annotations

from dataclasses import dataclass, field
from typing import Callable

ProgressCallback = Callable[[int, str], None]


@dataclass
class SourceResult:
    """Result of putting a model file into a character's model/source/ folder."""

    relpath: str
    source_format: str
    placeholder: bool = False
    warnings: list[str] = field(default_factory=list)
    metadata: dict = field(default_factory=dict)
