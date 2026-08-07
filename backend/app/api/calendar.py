"""Calendar API."""
from __future__ import annotations
from fastapi import APIRouter
router = APIRouter()

@router.get("/schedule")
async def get_schedule() -> list[dict]:
    return [
        {"title": "Distributed Systems", "time": "09:00 – 10:00", "tone": "primary"},
        {"title": "Compiler Design Lab", "time": "10:15 – 12:15", "tone": "cyan"},
        {"title": "Placement Prep Bootcamp", "time": "14:00 – 16:00", "tone": "violet"},
        {"title": "Machine Learning", "time": "09:00 – 10:00", "tone": "emerald"},
        {"title": "Nexus Labs Drive", "time": "11:00 – 17:00", "tone": "amber"},
        {"title": "AI Research Seminar", "time": "16:00 – 17:30", "tone": "violet"},
        {"title": "Compiler Design Exam", "time": "10:00 – 13:00", "tone": "amber"},
        {"title": "Library Return Due", "time": "17:00", "tone": "cyan"},
        {"title": "Hackathon Kickoff", "time": "18:00 – 21:00", "tone": "primary"},
        {"title": "Mentor Sync", "time": "12:00 – 12:30", "tone": "emerald"},
        {"title": "Mock Interview", "time": "15:00 – 15:45", "tone": "violet"},
        {"title": "Robotics Club", "time": "17:30 – 19:00", "tone": "cyan"},
    ]
