"""Academic domain models: Course and Enrollment."""

from __future__ import annotations

from sqlalchemy import String, Integer, Float, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column

from app.models.base import Base, TimestampMixin, UUIDMixin


class Course(Base, UUIDMixin, TimestampMixin):
    __tablename__ = "courses"

    code: Mapped[str] = mapped_column(String(20), unique=True, nullable=False)
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    department: Mapped[str] = mapped_column(String(100), nullable=False)
    semester: Mapped[int] = mapped_column(Integer, nullable=False)
    credits: Mapped[int] = mapped_column(Integer, default=3, nullable=False)
    slot: Mapped[str | None] = mapped_column(String(50), nullable=True)
    room: Mapped[str | None] = mapped_column(String(50), nullable=True)
    instructor: Mapped[str | None] = mapped_column(String(255), nullable=True)


class Enrollment(Base, UUIDMixin, TimestampMixin):
    __tablename__ = "enrollments"

    user_id: Mapped[str] = mapped_column(String(36), ForeignKey("users.id"), nullable=False)
    course_id: Mapped[str] = mapped_column(String(36), ForeignKey("courses.id"), nullable=False)
    attendance_pct: Mapped[float] = mapped_column(Float, default=0.0, nullable=False)
    classes_attended: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    classes_total: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
