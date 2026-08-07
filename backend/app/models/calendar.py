"""Calendar ORM Model for persistent schedule storage."""

from __future__ import annotations
from sqlalchemy import String, Boolean
from sqlalchemy.orm import Mapped, mapped_column
from app.models.base import Base, UUIDMixin, TimestampMixin


class CalendarBlock(Base, UUIDMixin, TimestampMixin):
    __tablename__ = "calendar_blocks"

    user_id: Mapped[str] = mapped_column(String(64), default="demo-user-001", index=True)
    title: Mapped[str] = mapped_column(String(256), nullable=False, index=True)
    date_str: Mapped[str] = mapped_column(String(64), nullable=False, index=True)  # e.g. "Aug 18"
    time_str: Mapped[str] = mapped_column(String(64), nullable=False)              # e.g. "03:00 PM"
    tone: Mapped[str] = mapped_column(String(32), default="primary")
    block_type: Mapped[str] = mapped_column(String(64), default="Custom")          # e.g. "Study", "Quiz"
    venue: Mapped[str] = mapped_column(String(256), default="Student Schedule")
    registered: Mapped[bool] = mapped_column(Boolean, default=True)
