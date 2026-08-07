"""Event domain models: Event and Registration."""

from __future__ import annotations

from sqlalchemy import String, Integer, ForeignKey, Boolean
from sqlalchemy.orm import Mapped, mapped_column

from app.models.base import Base, TimestampMixin, UUIDMixin


class Event(Base, UUIDMixin, TimestampMixin):
    __tablename__ = "events"

    title: Mapped[str] = mapped_column(String(255), nullable=False)
    organizer: Mapped[str] = mapped_column(String(255), nullable=False)
    date: Mapped[str] = mapped_column(String(50), nullable=False)
    time: Mapped[str | None] = mapped_column(String(50), nullable=True)
    venue: Mapped[str | None] = mapped_column(String(255), nullable=True)
    tag: Mapped[str] = mapped_column(String(50), default="Event", nullable=False)
    total_seats: Mapped[int] = mapped_column(Integer, default=100, nullable=False)
    seats_remaining: Mapped[int] = mapped_column(Integer, default=100, nullable=False)
    description: Mapped[str | None] = mapped_column(String(1000), nullable=True)


class Registration(Base, UUIDMixin, TimestampMixin):
    __tablename__ = "registrations"

    user_id: Mapped[str] = mapped_column(String(36), ForeignKey("users.id"), nullable=False)
    event_id: Mapped[str] = mapped_column(String(36), ForeignKey("events.id"), nullable=False)
    confirmed: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
