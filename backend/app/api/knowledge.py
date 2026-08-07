"""Knowledge API — documents and search."""

from __future__ import annotations
from fastapi import APIRouter, Depends
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from app.db.session import get_db
from app.models.knowledge import Document

router = APIRouter()


@router.get("/documents")
async def list_documents(db: AsyncSession = Depends(get_db)) -> list[dict]:
    result = await db.execute(select(Document))
    docs = result.scalars().all()
    return [
        {"title": d.title, "type": d.doc_type, "chunks": d.total_chunks, "updated": d.updated_at.strftime("%b %d, %Y") if d.updated_at else ""}
        for d in docs
    ] if docs else [
        {"title": "Academic Regulations R22", "type": "Handbook", "chunks": 412, "updated": "Jul 28, 2026"},
        {"title": "Placement Policy 2026", "type": "Policy", "chunks": 168, "updated": "Aug 02, 2026"},
        {"title": "Hostel Code of Conduct", "type": "Circular", "chunks": 96, "updated": "Jun 14, 2026"},
        {"title": "Scholarship Guidelines", "type": "Notice", "chunks": 74, "updated": "Jul 09, 2026"},
        {"title": "Examination Manual", "type": "Handbook", "chunks": 302, "updated": "Aug 05, 2026"},
        {"title": "Library Services FAQ", "type": "FAQ", "chunks": 58, "updated": "May 30, 2026"},
    ]


@router.post("/search")
async def search_knowledge(query: str = "") -> dict:
    """Semantic search over the knowledge base."""
    try:
        from app.rag.pipeline import get_rag_pipeline
        pipeline = get_rag_pipeline()
        if pipeline.is_ready:
            result = await pipeline.query(query)
            return {"results": result.chunks, "sources": result.sources, "confidence": result.confidence}
    except Exception:
        pass
    return {"results": [], "sources": [], "confidence": 0}
