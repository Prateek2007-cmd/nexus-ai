"""Placement API — companies, eligibility."""

from __future__ import annotations
from fastapi import APIRouter, Depends
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from app.db.session import get_db
from app.models.placement import Company

router = APIRouter()


@router.get("/companies")
async def list_companies(db: AsyncSession = Depends(get_db)) -> list[dict]:
    result = await db.execute(select(Company).where(Company.is_active == True))
    companies = result.scalars().all()
    user_cgpa = 8.64  # Demo user
    return [
        {"name": c.name, "role": c.role, "ctc": c.ctc, "cgpa": c.min_cgpa, "eligible": user_cgpa >= c.min_cgpa}
        for c in companies
    ] if companies else [
        {"name": "Google", "role": "SDE Intern", "ctc": "₹2.1L/mo", "cgpa": 8.0, "eligible": True},
        {"name": "Microsoft", "role": "SWE Intern", "ctc": "₹1.8L/mo", "cgpa": 7.5, "eligible": True},
        {"name": "Nvidia", "role": "Systems Intern", "ctc": "₹1.6L/mo", "cgpa": 8.5, "eligible": False},
        {"name": "Stripe", "role": "Backend Intern", "ctc": "₹2.4L/mo", "cgpa": 8.2, "eligible": False},
    ]
