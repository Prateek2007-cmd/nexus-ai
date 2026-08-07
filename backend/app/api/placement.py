"""Placement API — companies, eligibility, resume analyzer."""

from __future__ import annotations
import re
from fastapi import APIRouter, Depends
from pydantic import BaseModel
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from app.db.session import get_db
from app.models.placement import Company

router = APIRouter()


class ResumeAnalysisRequest(BaseModel):
    resume_text: str
    student_cgpa: float = 8.0
    student_branch: str = "CSE"


class ResumeAnalysisResponse(BaseModel):
    score: int
    extracted_skills: list[str]
    tips: list[str]
    matched_companies: list[str]


@router.get("/companies")
async def list_companies(cgpa: float = 8.0, db: AsyncSession = Depends(get_db)) -> list[dict]:
    result = await db.execute(select(Company).where(Company.is_active == True))
    companies = result.scalars().all()
    return [
        {"name": c.name, "role": c.role, "ctc": c.ctc, "cgpa": c.min_cgpa, "eligible": cgpa >= c.min_cgpa}
        for c in companies
    ] if companies else [
        {"name": "Google", "role": "SDE Intern", "ctc": "₹2.1L/mo", "cgpa": 8.0, "eligible": cgpa >= 8.0},
        {"name": "Microsoft", "role": "SWE Intern", "ctc": "₹1.8L/mo", "cgpa": 7.5, "eligible": cgpa >= 7.5},
        {"name": "Nvidia", "role": "Systems Intern", "ctc": "₹1.6L/mo", "cgpa": 8.5, "eligible": cgpa >= 8.5},
        {"name": "Stripe", "role": "Backend Intern", "ctc": "₹2.4L/mo", "cgpa": 8.2, "eligible": cgpa >= 8.2},
    ]


@router.post("/analyze-resume", response_model=ResumeAnalysisResponse)
async def analyze_resume(req: ResumeAnalysisRequest) -> ResumeAnalysisResponse:
    text = req.resume_text.lower()

    # Dictionary of tech skills to search for
    known_skills = [
        "python", "java", "c++", "c", "javascript", "typescript", "react", "next.js", "node.js",
        "express", "fastapi", "django", "flask", "html", "css", "tailwind", "sql", "postgresql",
        "mongodb", "redis", "docker", "kubernetes", "aws", "gcp", "azure", "git", "github",
        "machine learning", "deep learning", "ai", "llm", "rag", "pytorch", "tensorflow",
        "data structures", "algorithms", "system design", "distributed systems", "rest api", "graphql"
    ]

    extracted = [s.title() for s in known_skills if s in text]

    # Calculate ATS score
    score = 60
    if len(extracted) >= 3:
        score += 15
    if len(extracted) >= 7:
        score += 10
    if "project" in text or "built" in text or "developed" in text:
        score += 10
    if "cgpa" in text or "gpa" in text:
        score += 5
    score = min(score, 98)

    # Generated feedback tips
    tips = []
    if "project" not in text:
        tips.append("Add measurable impact metrics to project bullet points (e.g. 'Improved speed by 35%')")
    else:
        tips.append("✓ Project sections detected with technical implementation details")

    if not any(k in text for k in ["distributed systems", "system design", "microservices"]):
        tips.append("Recommended: Add System Design & Distributed Systems keywords for Tier-1 drives")
    else:
        tips.append("✓ Strong backend architecture & system design keywords found")

    if len(extracted) < 5:
        tips.append("Include more core technical competencies (e.g., Docker, SQL, Git)")
    else:
        tips.append(f"✓ Parsed {len(extracted)} core technical skills across languages & frameworks")

    # Match companies based on student CGPA
    matched = []
    if req.student_cgpa >= 8.0:
        matched.extend(["Google", "Microsoft", "Stripe"])
    elif req.student_cgpa >= 7.5:
        matched.extend(["Microsoft", "Amazon"])
    else:
        matched.append("TCS Digital")

    return ResumeAnalysisResponse(
        score=score,
        extracted_skills=extracted,
        tips=tips,
        matched_companies=matched,
    )
