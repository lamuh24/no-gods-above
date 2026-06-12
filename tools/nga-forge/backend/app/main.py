from __future__ import annotations

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .api import characters as characters_api
from .api import jobs as jobs_api
from .api import pipeline as pipeline_api
from .api import system as system_api
from .core.paths import ensure_data_dirs
from .state import characters

ensure_data_dirs()
characters.ensure_seed()

app = FastAPI(title="NGA Forge", version="0.2.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://127.0.0.1:5175",
        "http://localhost:5175",
        "http://127.0.0.1:5173",
        "http://localhost:5173",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(system_api.router)
app.include_router(characters_api.router)
app.include_router(pipeline_api.router)
app.include_router(jobs_api.router)
