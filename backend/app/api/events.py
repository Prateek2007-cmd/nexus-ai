"""Events API."""

from __future__ import annotations
from fastapi import APIRouter, Depends
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from app.db.session import get_db
from app.models.event import Event

router = APIRouter()


@router.get("")
async def list_events(db: AsyncSession = Depends(get_db)) -> list[dict]:
    result = await db.execute(select(Event))
    events = result.scalars().all()
    return [
        {"title": e.title, "org": e.organizer, "date": e.date, "seats": e.seats_remaining, "tag": e.tag}
        for e in events
    ] if events else [
        {"title": "AI Systems Workshop", "org": "Dept. of CSE", "date": "Aug 12", "seats": 42, "tag": "Workshop"},
        {"title": "AgentX Hackathon 2026", "org": "HackerRank Campus Crew", "date": "Aug 18", "seats": 120, "tag": "Hackathon"},
        {"title": "Placement Prep Bootcamp", "org": "T&P Cell", "date": "Aug 21", "seats": 8, "tag": "Bootcamp"},
        {"title": "Robotics Club Open Lab", "org": "Robotics Club", "date": "Aug 24", "seats": 60, "tag": "Club"},
    ]
