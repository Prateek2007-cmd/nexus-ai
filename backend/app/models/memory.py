"""Agent memory and user preference models."""

from __future__ import annotations

from sqlalchemy import String, Text, Float, ForeignKey, JSON
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import Base, TimestampMixin, UUIDMixin


class AgentMemory(Base, UUIDMixin, TimestampMixin):
    __tablename__ = "agent_memories"

    user_id: Mapped[str] = mapped_column(String(36), ForeignKey("users.id"), nullable=False)
    agent_id: Mapped[str] = mapped_column(String(50), nullable=False)
    memory_type: Mapped[str] = mapped_column(String(50), nullable=False)  # conversation | long_term | workflow
    content: Mapped[str] = mapped_column(Text, nullable=False)
    relevance_score: Mapped[float] = mapped_column(Float, default=1.0, nullable=False)
    metadata_json: Mapped[dict | None] = mapped_column(JSON, nullable=True)

    user = relationship("User", back_populates="memories")


class UserPreference(Base, UUIDMixin, TimestampMixin):
    __tablename__ = "user_preferences"

    user_id: Mapped[str] = mapped_column(String(36), ForeignKey("users.id"), nullable=False)
    key: Mapped[str] = mapped_column(String(100), nullable=False)
    value: Mapped[str] = mapped_column(Text, nullable=False)

    user = relationship("User", back_populates="preferences")
