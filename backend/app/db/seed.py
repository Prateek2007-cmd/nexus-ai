"""Database seed script — populates demo data on first run.

Exactly reproduces the mock.ts data so the frontend works identically,
then the backend begins producing live data as agents execute.
"""

from __future__ import annotations

from sqlalchemy import select

from app.db.session import async_session_factory
from app.core.security import hash_password
from app.models.user import User
from app.models.academic import Course, Enrollment
from app.models.placement import Company
from app.models.event import Event
from app.models.knowledge import Document
from app.models.notification import Notification
from app.models.memory import AgentMemory, UserPreference
from app.core.logging import get_logger

logger = get_logger("seed")


async def seed_if_empty() -> None:
    """Seed the database with demo data if no users exist."""
    async with async_session_factory() as session:
        result = await session.execute(select(User).limit(1))
        if result.scalar_one_or_none() is not None:
            logger.info("seed_skipped", reason="data_exists")
            return

        logger.info("seed_started")

        # ── Demo user ──────────────────────────────────────────────
        user = User(
            id="demo-user-001",
            email="aarav.r@campus.edu",
            name="Aarav Raman",
            hashed_password=hash_password("campusx2026"),
            role="student",
            roll_number="22B81A05C4",
            department="CSE",
            semester=5,
            cgpa=8.64,
            phone="+91 98xxx xx421",
            hostel="Block C · Room 214",
        )
        session.add(user)

        # ── Courses (matches mock.ts) ──────────────────────────────
        courses = [
            Course(code="CS502", name="Distributed Systems", department="CSE", semester=5, slot="09:00 — 10:00", room="B-204"),
            Course(code="CS514", name="Machine Learning", department="CSE", semester=5, slot="10:10 — 11:10", room="B-301"),
            Course(code="CS522", name="Compiler Design", department="CSE", semester=5, slot="11:20 — 12:20", room="A-108"),
            Course(code="CS540", name="Agentic AI Systems", department="CSE", semester=5, slot="14:00 — 15:00", room="AI Lab"),
        ]
        session.add_all(courses)
        await session.flush()

        enrollments = [
            Enrollment(user_id=user.id, course_id=courses[0].id, attendance_pct=92, classes_attended=46, classes_total=50),
            Enrollment(user_id=user.id, course_id=courses[1].id, attendance_pct=87, classes_attended=43, classes_total=50),
            Enrollment(user_id=user.id, course_id=courses[2].id, attendance_pct=74, classes_attended=37, classes_total=50),
            Enrollment(user_id=user.id, course_id=courses[3].id, attendance_pct=96, classes_attended=48, classes_total=50),
        ]
        session.add_all(enrollments)

        # ── Companies (matches mock.ts) ────────────────────────────
        companies = [
            Company(name="Google", role="SDE Intern", ctc="₹2.1L/mo", min_cgpa=8.0, allowed_branches="CSE,IT"),
            Company(name="Microsoft", role="SWE Intern", ctc="₹1.8L/mo", min_cgpa=7.5, allowed_branches="CSE,IT,ECE"),
            Company(name="Nvidia", role="Systems Intern", ctc="₹1.6L/mo", min_cgpa=8.5, allowed_branches="CSE"),
            Company(name="Stripe", role="Backend Intern", ctc="₹2.4L/mo", min_cgpa=8.2, allowed_branches="CSE,IT"),
        ]
        session.add_all(companies)

        # ── Events (matches mock.ts) ───────────────────────────────
        events = [
            Event(title="AI Systems Workshop", organizer="Dept. of CSE", date="Aug 12", tag="Workshop", seats_remaining=42, total_seats=100),
            Event(title="AgentX Hackathon 2026", organizer="HackerRank Campus Crew", date="Aug 18", tag="Hackathon", seats_remaining=120, total_seats=200),
            Event(title="Placement Prep Bootcamp", organizer="T&P Cell", date="Aug 21", tag="Bootcamp", seats_remaining=8, total_seats=60),
            Event(title="Robotics Club Open Lab", organizer="Robotics Club", date="Aug 24", tag="Club", seats_remaining=60, total_seats=80),
        ]
        session.add_all(events)

        # ── Documents (matches mock.ts) ────────────────────────────
        documents = [
            Document(title="Academic Regulations R22", doc_type="Handbook", total_chunks=412),
            Document(title="Placement Policy 2026", doc_type="Policy", total_chunks=168),
            Document(title="Hostel Code of Conduct", doc_type="Circular", total_chunks=96),
            Document(title="Scholarship Guidelines", doc_type="Notice", total_chunks=74),
            Document(title="Examination Manual", doc_type="Handbook", total_chunks=302),
            Document(title="Library Services FAQ", doc_type="FAQ", total_chunks=58),
        ]
        session.add_all(documents)

        # ── Notifications (matches mock.ts) ────────────────────────
        notifications = [
            Notification(user_id=user.id, title="Google internship shortlist released", body="You are on the shortlist. Interview slot booking opens tomorrow.", tone="primary", unread=True, source_agent="placement"),
            Notification(user_id=user.id, title="Attendance alert — Compiler Design", body="You are at 74%. 3 more classes required to reach 75%.", tone="amber", unread=True, source_agent="academic"),
            Notification(user_id=user.id, title="AI Systems Workshop confirmed", body="Seat reserved. Calendar entry and reminder created.", tone="cyan", unread=False, source_agent="events"),
            Notification(user_id=user.id, title="Library book due", body="Introduction to Algorithms is due in 2 days.", tone="violet", unread=False, source_agent="services"),
        ]
        session.add_all(notifications)

        # ── Agent Memory ───────────────────────────────────────────
        memories = [
            AgentMemory(user_id=user.id, agent_id="orchestrator", memory_type="long_term", content="Prefers concise answers with a source citation."),
            AgentMemory(user_id=user.id, agent_id="placement", memory_type="long_term", content="Interested in ML infrastructure and distributed systems roles."),
            AgentMemory(user_id=user.id, agent_id="academic", memory_type="long_term", content="Wants attendance warnings at the 78% mark, not 75%."),
            AgentMemory(user_id=user.id, agent_id="notification", memory_type="long_term", content="Time zone IST · reminders 60 minutes before an event."),
        ]
        session.add_all(memories)

        # ── User Preferences ──────────────────────────────────────
        prefs = [
            UserPreference(user_id=user.id, key="attendance_warning_threshold", value="78"),
            UserPreference(user_id=user.id, key="reminder_offset_minutes", value="60"),
            UserPreference(user_id=user.id, key="response_style", value="concise"),
        ]
        session.add_all(prefs)

        await session.commit()
        logger.info("seed_completed", users=1, courses=4, companies=4, events=4, documents=6)
