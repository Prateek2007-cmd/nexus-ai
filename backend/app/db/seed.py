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
    """Seed the database with demo data if empty."""
    async with async_session_factory() as session:
        user_res = await session.execute(select(User).limit(1))
        doc_res = await session.execute(select(Document).limit(1))
        has_user = user_res.scalar_one_or_none() is not None
        has_docs = doc_res.scalar_one_or_none() is not None

        if has_user and has_docs:
            logger.info("seed_skipped", reason="data_exists")
            return

        logger.info("seed_started")

        if not has_user:
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

        if not has_docs:
            # ── Documents & Chunks (Vasavi College of Engineering Corpus) ──────
            from app.db.vce_knowledge_data import VCE_DOCUMENTS

            for doc_info in VCE_DOCUMENTS:
                await _insert_document(session, doc_info)

        if not has_user:
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
        logger.info("seed_completed")


async def _insert_document(session, doc_info: dict) -> None:
    """Create a Document row plus its Chunk rows from a corpus entry.

    Shared by the initial seed and the delta-sync so the two paths cannot
    drift apart (e.g. if the chunk schema gains a field).
    """
    from app.models.knowledge import Chunk

    doc = Document(
        title=doc_info["title"],
        doc_type=doc_info["doc_type"],
        category=doc_info.get("category", "institutional"),
        description=doc_info.get("description", ""),
        author=doc_info.get("author", "Vasavi College of Engineering"),
        total_chunks=len(doc_info["chunks"]),
    )
    session.add(doc)
    await session.flush()  # populate doc.id for the chunk foreign keys

    for idx, chk in enumerate(doc_info["chunks"]):
        session.add(
            Chunk(
                document_id=doc.id,
                chunk_index=idx + 1,
                content=chk["text"],
                page_number=chk.get("page", 1),
                char_count=len(chk["text"]),
                tags=chk.get("tags", ""),
            )
        )


def missing_documents(existing_titles: set[str]) -> list[dict]:
    """Return corpus entries whose title is not present (idempotent delta).

    Pure helper — testable without a database. Note: dedup is by title only,
    so content edits to an already-seeded document are not re-propagated.
    """
    from app.db.vce_knowledge_data import VCE_DOCUMENTS

    return [d for d in VCE_DOCUMENTS if d["title"] not in existing_titles]


async def sync_knowledge_docs() -> None:
    """Idempotently add any corpus documents missing from the database.

    ``seed_if_empty`` only runs on a fresh database, so new documents added to
    ``VCE_DOCUMENTS`` later would never reach an already-seeded instance. This
    delta-syncs by title on every startup (no-op when nothing is missing).
    """
    async with async_session_factory() as session:
        existing_titles = set(
            (await session.execute(select(Document.title))).scalars().all()
        )
        added = 0
        for doc_info in missing_documents(existing_titles):
            await _insert_document(session, doc_info)
            added += 1

        if added:
            await session.commit()
            logger.info("knowledge_docs_synced", added=added)
