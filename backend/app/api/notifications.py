"""Notifications API."""
from __future__ import annotations
from fastapi import APIRouter, Depends
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from app.db.session import get_db
from app.models.notification import Notification
router = APIRouter()

@router.get("")
async def list_notifications(db: AsyncSession = Depends(get_db)) -> list[dict]:
    result = await db.execute(select(Notification))
    notifs = result.scalars().all()
    if notifs:
        return [{"title": n.title, "body": n.body, "time": "2m", "tone": n.tone, "unread": n.unread} for n in notifs]
    return [
        {"title": "Google internship shortlist released", "body": "You are on the shortlist.", "time": "2m", "tone": "primary", "unread": True},
        {"title": "Attendance alert — Compiler Design", "body": "You are at 74%.", "time": "1h", "tone": "amber", "unread": True},
    ]
