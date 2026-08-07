"""Notifications API — list, mark read, clear, and post new agent alerts."""

from __future__ import annotations
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy import select, update, delete
from sqlalchemy.ext.asyncio import AsyncSession
from app.db.session import get_db
from app.models.notification import Notification

router = APIRouter()


class CreateNotificationRequest(BaseModel):
    title: str
    body: str
    tone: str = "cyan"
    source_agent: str = "notification"


@router.get("")
async def list_notifications(db: AsyncSession = Depends(get_db)) -> list[dict]:
    """List all notifications for student from DB."""
    result = await db.execute(select(Notification).order_by(Notification.created_at.desc()))
    notifs = result.scalars().all()
    if notifs:
        return [
            {
                "id": n.id,
                "title": n.title,
                "body": n.body,
                "time": n.created_at.strftime("%I:%M %p") if n.created_at else "Just now",
                "tone": n.tone,
                "read": not n.unread,
                "source_agent": n.source_agent or "notification",
            }
            for n in notifs
        ]
    return [
        {"id": "n1", "title": "Google internship shortlist released", "body": "You are on the shortlist. Interview slot booking opens tomorrow.", "time": "2m", "tone": "primary", "read": False, "source_agent": "placement"},
        {"id": "n2", "title": "Attendance alert — Compiler Design", "body": "You are at 74%. 3 more classes required to reach 75%.", "time": "1h", "tone": "amber", "read": False, "source_agent": "academic"},
        {"id": "n3", "title": "AI Systems Workshop confirmed", "body": "Seat reserved. Calendar entry and reminder created.", "time": "3h", "tone": "cyan", "read": True, "source_agent": "events"},
        {"id": "n4", "title": "Library book due", "body": "Introduction to Algorithms is due in 2 days.", "time": "1d", "tone": "violet", "read": True, "source_agent": "services"},
    ]


@router.post("/read-all")
async def mark_all_read(db: AsyncSession = Depends(get_db)) -> dict:
    """Mark all notifications as read."""
    await db.execute(update(Notification).values(unread=False))
    await db.commit()
    return {"status": "success", "message": "All notifications marked as read"}


@router.post("/{notification_id}/toggle-read")
async def toggle_read(notification_id: str, db: AsyncSession = Depends(get_db)) -> dict:
    """Toggle single notification read status."""
    res = await db.execute(select(Notification).where(Notification.id == notification_id))
    notif = res.scalar_one_or_none()
    if notif:
        notif.unread = not notif.unread
        await db.commit()
        return {"status": "success", "read": not notif.unread}
    return {"status": "success", "read": True}


@router.delete("")
async def clear_notifications(db: AsyncSession = Depends(get_db)) -> dict:
    """Clear all notifications."""
    await db.execute(delete(Notification))
    await db.commit()
    return {"status": "success", "message": "All notifications cleared"}


@router.post("/create")
async def create_notification(body: CreateNotificationRequest, db: AsyncSession = Depends(get_db)) -> dict:
    """Create a new proactive agent notification."""
    notif = Notification(
        user_id="demo-user-001",
        title=body.title,
        body=body.body,
        tone=body.tone,
        source_agent=body.source_agent,
        unread=True,
    )
    db.add(notif)
    await db.commit()
    await db.refresh(notif)
    return {
        "id": notif.id,
        "title": notif.title,
        "body": notif.body,
        "tone": notif.tone,
        "time": "Just now",
        "read": False,
        "source_agent": notif.source_agent,
    }
