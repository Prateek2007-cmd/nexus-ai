"""Notification model."""

from __future__ import annotations

from sqlalchemy import String, Boolean, ForeignKey, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import Base, TimestampMixin, UUIDMixin


class Notification(Base, UUIDMixin, TimestampMixin):
    __tablename__ = "notifications"

    user_id: Mapped[str] = mapped_column(String(36), ForeignKey("users.id"), nullable=False)
    title: Mapped[str] = mapped_column(String(255), nullable=False)
    body: Mapped[str] = mapped_column(Text, nullable=False)
    tone: Mapped[str] = mapped_column(String(20), default="primary", nullable=False)
    unread: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    source_agent: Mapped[str | None] = mapped_column(String(50), nullable=True)

    user = relationship("User", back_populates="notifications")
