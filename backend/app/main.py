"""FastAPI application factory with lifespan management.

Creates the FastAPI app, attaches middleware, registers exception handlers,
mounts routers, and manages startup/shutdown via the lifespan context.
"""

from __future__ import annotations

import logging
from contextlib import asynccontextmanager
from typing import AsyncGenerator

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import get_settings
from app.core.exceptions import register_exception_handlers
from app.core.logging import setup_logging
from app.api.router import api_router
from app.db.session import init_db


@asynccontextmanager
async def lifespan(app: FastAPI) -> AsyncGenerator[None, None]:
    """Application lifespan — startup / shutdown hooks."""
    settings = get_settings()
    setup_logging(settings.log_level)

    # Initialize database tables
    await init_db()

    # Seed demo data
    from app.db.seed import seed_if_empty, sync_knowledge_docs
    await seed_if_empty()
    # Delta-sync any corpus documents added after the first seed.
    await sync_knowledge_docs()

    # Initialize agent registry
    from app.agents.registry import initialize_agents
    initialize_agents()

    # Warm the offline RAG index (persistent ChromaDB collection + BM25)
    # from the seeded knowledge base so first queries hit a populated store.
    try:
        from app.rag.pipeline import get_rag_pipeline
        await get_rag_pipeline().warmup()
    except Exception as exc:  # pragma: no cover - non-fatal for the app
        logging.getLogger(__name__).warning("rag_warmup_failed: %s", exc)

    yield  # ← Application runs here

    # Shutdown cleanup (connection pools, etc.)


def create_app() -> FastAPI:
    """Application factory — returns a fully configured FastAPI instance."""
    settings = get_settings()

    app = FastAPI(
        title=settings.app_title,
        version=settings.app_version,
        description="Autonomous Multi-Agent AI Platform for Smart Campuses",
        docs_url="/api/docs",
        redoc_url="/api/redoc",
        openapi_url="/api/openapi.json",
        lifespan=lifespan,
    )

    # ── CORS ───────────────────────────────────────────────────────
    app.add_middleware(
        CORSMiddleware,
        allow_origins=["*"] if not settings.is_production else ["https://campusx.ai"],
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    # ── Exception handlers ─────────────────────────────────────────
    register_exception_handlers(app)

    # ── Routes ─────────────────────────────────────────────────────
    app.include_router(api_router, prefix="/api")

    from app.mcp.server import mcp_router
    from app.a2a.protocol import a2a_router
    app.include_router(mcp_router)
    app.include_router(a2a_router)

    return app


app = create_app()
