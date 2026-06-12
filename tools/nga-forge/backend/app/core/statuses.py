from __future__ import annotations

NOT_STARTED = "not_started"
NEEDS_REFERENCE = "needs_reference"
PLACEHOLDER = "placeholder"
READY = "ready"
PROCESSING = "processing"
EXPORTED = "exported"
FAILED = "failed"
FUTURE_ADAPTER = "future_adapter"

ALL_STATUSES = {
    NOT_STARTED,
    NEEDS_REFERENCE,
    PLACEHOLDER,
    READY,
    PROCESSING,
    EXPORTED,
    FAILED,
    FUTURE_ADAPTER,
}

PIPELINE_STEPS = (
    "profile",
    "references",
    "model",
    "cleanup",
    "render25d",
    "animation",
    "export",
)
