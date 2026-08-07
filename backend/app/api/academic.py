"""Academic API — courses, timetable, attendance."""

from __future__ import annotations
from fastapi import APIRouter, Depends
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from app.db.session import get_db
from app.models.academic import Course

router = APIRouter()


@router.get("/courses")
async def list_courses(db: AsyncSession = Depends(get_db)) -> list[dict]:
    result = await db.execute(select(Course))
    courses = result.scalars().all()
    return [
        {"code": c.code, "name": c.name, "attendance": 92 if c.code == "CS502" else 87 if c.code == "CS514" else 74 if c.code == "CS522" else 96, "slot": c.slot, "room": c.room}
        for c in courses
    ] if courses else [
        {"code": "CS502", "name": "Distributed Systems", "attendance": 92, "slot": "09:00 — 10:00", "room": "B-204"},
        {"code": "CS514", "name": "Machine Learning", "attendance": 87, "slot": "10:10 — 11:10", "room": "B-301"},
        {"code": "CS522", "name": "Compiler Design", "attendance": 74, "slot": "11:20 — 12:20", "room": "A-108"},
        {"code": "CS540", "name": "Agentic AI Systems", "attendance": 96, "slot": "14:00 — 15:00", "room": "AI Lab"},
    ]
