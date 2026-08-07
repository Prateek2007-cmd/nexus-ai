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
    """Create all tables from metadata. Recreates stale tables if schema changed."""
    async with engine.begin() as conn:
        def check_schema(sync_conn):
            from sqlalchemy import inspect
            inspector = inspect(sync_conn)
            existing = inspector.get_table_names()

            # If documents table exists but is missing the 'category' column, drop & recreate
            if "documents" in existing:
                columns = [c["name"] for c in inspector.get_columns("documents")]
                if "category" not in columns:
                    Base.metadata.drop_all(sync_conn)

            # create_all is idempotent — creates any missing tables (e.g. calendar_blocks)
            Base.metadata.create_all(sync_conn)

        await conn.run_sync(check_schema)
