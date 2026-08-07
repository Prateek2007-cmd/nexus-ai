"""Placement domain models: Company and Drive."""

from __future__ import annotations

from sqlalchemy import String, Float, Boolean, Integer
from sqlalchemy.orm import Mapped, mapped_column

from app.models.base import Base, TimestampMixin, UUIDMixin


class Company(Base, UUIDMixin, TimestampMixin):
    __tablename__ = "companies"

    name: Mapped[str] = mapped_column(String(255), nullable=False)
    role: Mapped[str] = mapped_column(String(255), nullable=False)
    ctc: Mapped[str] = mapped_column(String(50), nullable=False)
    min_cgpa: Mapped[float] = mapped_column(Float, nullable=False)
    allowed_branches: Mapped[str] = mapped_column(String(500), default="CSE,IT", nullable=False)
    max_backlogs: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)


class Drive(Base, UUIDMixin, TimestampMixin):
    __tablename__ = "drives"

    company_id: Mapped[str] = mapped_column(String(36), nullable=False)
    status: Mapped[str] = mapped_column(String(20), default="open", nullable=False)
    deadline: Mapped[str | None] = mapped_column(String(50), nullable=True)
    registered_count: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
