"""Application configuration via Pydantic Settings.

Reads from environment variables and .env file. All secrets and tunables
are centralized here — no magic strings in application code.
"""

from __future__ import annotations

from pathlib import Path
from functools import lru_cache

try:
    from pydantic_settings import BaseSettings, SettingsConfigDict
except ImportError:
    try:
        from pydantic import BaseSettings
        SettingsConfigDict = dict
    except ImportError:
        from pydantic.v1 import BaseSettings
        SettingsConfigDict = dict


class Settings(BaseSettings):
    """Immutable, validated application configuration."""

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
        extra="ignore",
    )

    # ── Application ────────────────────────────────────────────────
    app_env: str = "development"
    app_debug: bool = True
    app_host: str = "127.0.0.1"
    app_port: int = 5050
    app_title: str = "CampusX AI"
    app_version: str = "1.0.0"

    # ── Security / JWT ─────────────────────────────────────────────
    jwt_secret_key: str = "dev-secret-change-in-production"
    jwt_algorithm: str = "HS256"
    jwt_expiry_minutes: int = 1440  # 24 hours

    # ── Database ───────────────────────────────────────────────────
    database_url: str = "sqlite+aiosqlite:///./campusx.db"

    # ── Redis ──────────────────────────────────────────────────────
    redis_url: str = "redis://localhost:6379/0"

    # ── LLM Keys ───────────────────────────────────────────────────
    google_api_key: str = ""
    groq_api_key: str = ""

    # ── ChromaDB ───────────────────────────────────────────────────
    chroma_persist_dir: str = "./data/chroma"

    # ── RAG ────────────────────────────────────────────────────────
    rag_chunk_size: int = 512
    rag_chunk_overlap: int = 64
    rag_top_k: int = 10
    rag_rerank_top: int = 6

    # ── Logging ────────────────────────────────────────────────────
    log_level: str = "INFO"
    log_format: str = "json"

    # ── Derived ────────────────────────────────────────────────────
    @property
    def is_production(self) -> bool:
        return self.app_env == "production"

    @property
    def chroma_path(self) -> Path:
        return Path(self.chroma_persist_dir)


@lru_cache(maxsize=1)
def get_settings() -> Settings:
    """Cached singleton — call this everywhere instead of constructing Settings."""
    return Settings()
