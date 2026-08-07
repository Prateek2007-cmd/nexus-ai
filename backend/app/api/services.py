"""Services API."""
from __future__ import annotations
from fastapi import APIRouter
router = APIRouter()

@router.get("")
async def list_services() -> list[dict]:
    return [
        {"name": "Hostel", "detail": "Room B-214 · Mess plan A · No dues", "icon": "home"},
        {"name": "Library", "detail": "2 books issued · 1 due in 2 days", "icon": "book"},
        {"name": "Scholarships", "detail": "Merit scholarship application open", "icon": "award"},
        {"name": "Transport", "detail": "Route 7 · Bus arrives 07:45", "icon": "bus"},
        {"name": "Grievances", "detail": "0 open tickets · Avg resolution 1.4d", "icon": "life"},
        {"name": "Campus FAQs", "detail": "1,240 answers indexed", "icon": "help"},
    ]
