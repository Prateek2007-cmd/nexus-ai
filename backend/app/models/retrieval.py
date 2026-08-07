"""Retrieval log model — persisted per-query hybrid retrieval metrics."""

from __future__ import annotations

from sqlalchemy import JSON, Boolean, Float, Integer, String
from sqlalchemy.orm import Mapped, mapped_column

from app.models.base import Base, TimestampMixin, UUIDMixin


class RetrievalLog(Base, UUIDMixin, TimestampMixin):
    """One row per RAG query: what was searched and how each retriever scored."""

    __tablename__ = "retrieval_logs"

    query: Mapped[str] = mapped_column(String(500), nullable=False)
    dense_hits: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    bm25_hits: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    fused_hits: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    has_intersection: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    reranked: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    confidence: Mapped[float] = mapped_column(Float, default=0.0, nullable=False)

    # [{doc, page, score}, ...] for the top returned chunks.
    top_docs: Mapped[list] = mapped_column(JSON, default=list, nullable=False)
    # ["Document Title · p.4", ...]
    sources: Mapped[list] = mapped_column(JSON, default=list, nullable=False)
