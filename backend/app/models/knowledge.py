"""Knowledge base models: Document and Chunk metadata."""

from __future__ import annotations

from sqlalchemy import String, Integer, Text, Float
from sqlalchemy.orm import Mapped, mapped_column

from app.models.base import Base, TimestampMixin, UUIDMixin


class Document(Base, UUIDMixin, TimestampMixin):
    __tablename__ = "documents"

    title: Mapped[str] = mapped_column(String(255), nullable=False)
    doc_type: Mapped[str] = mapped_column(String(50), nullable=False)  # Handbook, Policy, Circular, FAQ, Notice, Book
    category: Mapped[str] = mapped_column(String(50), default="institutional", nullable=False)  # institutional, book, circular
    description: Mapped[str] = mapped_column(Text, default="", nullable=False)
    author: Mapped[str | None] = mapped_column(String(255), nullable=True)
    file_path: Mapped[str | None] = mapped_column(String(500), nullable=True)
    total_chunks: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    embedding_model: Mapped[str] = mapped_column(String(100), default="text-embedding-004", nullable=False)


class Chunk(Base, UUIDMixin, TimestampMixin):
    __tablename__ = "chunks"

    document_id: Mapped[str] = mapped_column(String(36), nullable=False)
    chunk_index: Mapped[int] = mapped_column(Integer, nullable=False)
    content: Mapped[str] = mapped_column(Text, nullable=False)
    page_number: Mapped[int | None] = mapped_column(Integer, nullable=True)
    char_count: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    tags: Mapped[str] = mapped_column(String(500), default="", nullable=False)  # comma-separated topic tags
    chroma_id: Mapped[str | None] = mapped_column(String(100), nullable=True)
