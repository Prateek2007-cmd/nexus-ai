"""Knowledge API — documents, books, search, and detail endpoints."""

from __future__ import annotations
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from app.db.session import get_db
from app.models.knowledge import Document, Chunk
from app.models.retrieval import RetrievalLog

router = APIRouter()


class SearchQuery(BaseModel):
    query: str = ""
    category: str | None = None


@router.get("/documents")
async def list_documents(db: AsyncSession = Depends(get_db)) -> list[dict]:
    """Return all indexed documents and textbooks from DB."""
    result = await db.execute(select(Document))
    docs = result.scalars().all()
    return [
        {
            "id": d.id,
            "title": d.title,
            "type": d.doc_type,
            "category": d.category,
            "description": d.description,
            "author": d.author or "Vasavi College of Engineering",
            "chunks": d.total_chunks,
            "updated": d.updated_at.strftime("%b %d, %Y") if d.updated_at else "Aug 07, 2026",
        }
        for d in docs
    ]


@router.post("/search")
async def search_knowledge(body: SearchQuery) -> dict:
    """Semantic/DB search over institutional documents and reference textbooks."""
    from app.rag.pipeline import get_rag_pipeline
    pipeline = get_rag_pipeline()
    result = await pipeline.query(body.query)
    
    chunks = result.chunks
    if body.category and body.category != "all":
        chunks = [c for c in chunks if c.get("category") == body.category]

    return {
        "results": chunks,
        "sources": result.sources,
        "summary": result.answer,
        "confidence": result.confidence,
        "metrics": result.metrics,
    }


@router.get("/logs")
async def retrieval_logs(
    limit: int = 20,
    db: AsyncSession = Depends(get_db),
) -> list[dict]:
    """Return recent persisted retrieval metrics (query, hits, top docs)."""
    result = await db.execute(
        select(RetrievalLog)
        .order_by(RetrievalLog.created_at.desc())
        .limit(max(1, min(limit, 100)))
    )
    logs = result.scalars().all()
    return [
        {
            "id": log.id,
            "query": log.query,
            "dense_hits": log.dense_hits,
            "bm25_hits": log.bm25_hits,
            "fused_hits": log.fused_hits,
            "has_intersection": log.has_intersection,
            "reranked": log.reranked,
            "confidence": log.confidence,
            "top_docs": log.top_docs,
            "sources": log.sources,
            # SQLite stores timestamps as naive UTC — mark them so the browser
            # parses them as UTC instead of local time.
            "created_at": (
                log.created_at.isoformat() + "Z"
                if log.created_at and log.created_at.tzinfo is None
                else (log.created_at.isoformat() if log.created_at else None)
            ),
        }
        for log in logs
    ]


@router.get("/documents/{doc_id}")
async def get_document_details(doc_id: str, db: AsyncSession = Depends(get_db)) -> dict:
    """Get single document details with all chunks."""
    result = await db.execute(select(Document).where(Document.id == doc_id))
    doc = result.scalar_one_or_none()
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")

    chunk_res = await db.execute(select(Chunk).where(Chunk.document_id == doc_id).order_by(Chunk.chunk_index))
    chunks = chunk_res.scalars().all()

    return {
        "id": doc.id,
        "title": doc.title,
        "type": doc.doc_type,
        "category": doc.category,
        "description": doc.description,
        "author": doc.author,
        "updated": doc.updated_at.strftime("%b %d, %Y") if doc.updated_at else "",
        "chunks": [
            {
                "index": c.chunk_index,
                "page": c.page_number,
                "content": c.content,
                "tags": c.tags,
            }
            for c in chunks
        ]
    }
