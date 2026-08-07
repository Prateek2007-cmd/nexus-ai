"""Async SQLAlchemy session factory and engine management.

Provides the async engine, session maker, and a dependency-injectable
session generator for FastAPI routes. Uses connection pooling in production.
"""

from __future__ import annotations

from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine

from app.config import get_settings
from app.models.base import Base

settings = get_settings()

# ── Engine ─────────────────────────────────────────────────────────
# SQLite needs connect_args for async; PostgreSQL uses pool settings
_connect_args = {}
if "sqlite" in settings.database_url:
    _connect_args = {"check_same_thread": False}

engine = create_async_engine(
    settings.database_url,
    echo=settings.app_debug and not settings.is_production,
    connect_args=_connect_args,
    pool_pre_ping=True,
)

# ── Session factory ────────────────────────────────────────────────
async_session_factory = async_sessionmaker(
    engine,
    class_=AsyncSession,
    expire_on_commit=False,
)


async def get_db() -> AsyncSession:  # type: ignore[misc]
    """FastAPI dependency — yields an async session, auto-closes on exit."""
    async with async_session_factory() as session:
        try:
            yield session
            await session.commit()
        except Exception:
            await session.rollback()
            raise
        finally:
            await session.close()


async def init_db() -> None:
    """Create all tables from metadata. Idempotent."""
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
