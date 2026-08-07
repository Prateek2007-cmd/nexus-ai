"""Calendar API — persistent schedule management backed by SQLite DB."""

from __future__ import annotations
from fastapi import APIRouter, Depends
from pydantic import BaseModel
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from app.db.session import get_db, async_session_factory
from app.models.calendar import CalendarBlock
from app.models.notification import Notification

router = APIRouter()

BASE_SCHEDULE: list[dict] = [
    {"id": "c1", "title": "Distributed Systems Lecture", "date": "Aug 10", "time": "09:00 – 10:00 AM", "tone": "primary", "type": "Class"},
    {"id": "c2", "title": "Compiler Design Lab", "date": "Aug 11", "time": "10:15 – 12:15 PM", "tone": "cyan", "type": "Lab"},
    {"id": "c3", "title": "AI Systems Workshop", "date": "Aug 12", "time": "02:00 – 04:30 PM", "tone": "emerald", "type": "Workshop", "registered": True},
    {"id": "c4", "title": "Machine Learning Quiz 1", "date": "Aug 14", "time": "09:00 – 10:00 AM", "tone": "emerald", "type": "Quiz"},
    {"id": "c5", "title": "AgentX Hackathon 2026", "date": "Aug 18", "time": "09:00 – 09:00 PM", "tone": "primary", "type": "Hackathon", "registered": True},
    {"id": "c6", "title": "Placement Prep Bootcamp", "date": "Aug 21", "time": "02:00 – 04:00 PM", "tone": "violet", "type": "Bootcamp", "registered": True},
    {"id": "c7", "title": "Compiler Design Semester Exam", "date": "Aug 22", "time": "10:00 – 01:00 PM", "tone": "amber", "type": "Exam"},
    {"id": "c8", "title": "Discrete Mathematics Quiz 2", "date": "Aug 22", "time": "02:00 – 03:00 PM", "tone": "amber", "type": "Quiz"},
    {"id": "c9", "title": "Robotics Club Open Lab", "date": "Aug 24", "time": "05:30 – 07:00 PM", "tone": "cyan", "type": "Club"},
    {"id": "c10", "title": "Library Book Return Due", "date": "Aug 25", "time": "05:00 PM", "tone": "cyan", "type": "Deadline"},
]


class CreateBlockRequest(BaseModel):
    title: str
    date: str  # e.g. "Aug 18"
    time: str  # e.g. "03:00 PM"
    type: str = "Study"
    venue: str = "Student Schedule"


@router.get("/schedule")
async def get_schedule(db: AsyncSession = Depends(get_db)) -> list[dict]:
    """Returns combined base schedule and persistent database calendar blocks."""
    db_blocks = []
    try:
        res = await db.execute(select(CalendarBlock))
        blocks = res.scalars().all()
        for b in blocks:
            db_blocks.append({
                "id": b.id,
                "title": b.title,
                "date": b.date_str,
                "time": b.time_str,
                "tone": b.tone or "primary",
                "type": b.block_type or "Custom",
                "venue": b.venue or "Student Schedule",
                "registered": b.registered,
                "custom": True,
            })
    except Exception as e:
        print("Error fetching DB calendar blocks:", e)

    return BASE_SCHEDULE + db_blocks


@router.post("/create")
async def create_block(body: CreateBlockRequest, db: AsyncSession = Depends(get_db)) -> dict:
    """Create a new custom block on student calendar, saving permanently in SQLite DB and pushing an unread alert."""
    title = body.title.strip()
    date_str = body.date.strip()
    time_str = body.time.strip()
    block_type = body.type.strip()
    venue = body.venue.strip()

    # Save to SQLite database table `calendar_blocks`
    block = CalendarBlock(
        user_id="demo-user-001",
        title=title,
        date_str=date_str,
        time_str=time_str,
        tone="primary",
        block_type=block_type,
        venue=venue,
        registered=True,
    )
    db.add(block)

    # Save proactive reminder notification to SQLite database table `notifications`
    notif = Notification(
        user_id="demo-user-001",
        title=f"Upcoming Block Reminder: {title}",
        body=f"Scheduled for {date_str} at {time_str}. Proactive alert set 10 minutes prior.",
        tone="amber",
        source_agent="calendar",
        unread=True,
    )
    db.add(notif)

    await db.commit()
    await db.refresh(block)

    return {
        "status": "success",
        "block": {
            "id": block.id,
            "title": block.title,
            "date": block.date_str,
            "time": block.time_str,
            "tone": block.tone,
            "type": block.block_type,
            "venue": block.venue,
            "registered": block.registered,
            "custom": True,
        },
    }
