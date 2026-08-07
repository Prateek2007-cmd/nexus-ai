"""Corpus & sync tests: schema invariants and idempotent delta-sync logic.

Pure unit tests — no external services or database required. The delta-sync
selector (`missing_documents`) is extracted as a pure helper so its
idempotency is testable without touching the real DB.
"""

from __future__ import annotations

from app.db.seed import missing_documents
from app.db.vce_knowledge_data import VCE_DOCUMENTS

REQUIRED_DOC_KEYS = {"title", "doc_type", "category", "author", "total_chunks", "chunks"}
REQUIRED_CHUNK_KEYS = {"page", "text", "tags"}


def test_corpus_entries_are_schema_consistent():
    """Every corpus entry must match the shape seed/sync rely on."""
    for doc in VCE_DOCUMENTS:
        missing_keys = REQUIRED_DOC_KEYS - set(doc)
        assert not missing_keys, f"{doc.get('title')} missing keys: {missing_keys}"
        assert doc["total_chunks"] == len(doc["chunks"]), (
            f"total_chunks mismatch in {doc['title']}: "
            f"{doc['total_chunks']} != {len(doc['chunks'])}"
        )
        for chunk in doc["chunks"]:
            chunk_missing = REQUIRED_CHUNK_KEYS - set(chunk)
            assert not chunk_missing, (
                f"{doc['title']} chunk missing keys: {chunk_missing}"
            )
            assert chunk["text"].strip(), f"{doc['title']} has an empty chunk"


def test_college_calendar_document_is_present():
    """The corpus-gap fix document must exist (college timings query)."""
    titles = {d["title"] for d in VCE_DOCUMENTS}
    assert "VCE College Calendar, Working Days & Class Timings" in titles
    calendar = next(
        d for d in VCE_DOCUMENTS if d["title"] == "VCE College Calendar, Working Days & Class Timings"
    )
    assert any("9:00 AM" in c["text"] for c in calendar["chunks"])


def test_transport_and_fee_documents_are_present():
    """The transport/fee corpus-gap documents must exist with key facts."""
    by_title = {d["title"]: d for d in VCE_DOCUMENTS}

    transport = by_title.get("VCE Transport & Bus Routes")
    assert transport is not None
    transport_text = " ".join(c["text"] for c in transport["chunks"])
    assert "Route 7" in transport_text and "Bus Pass" in transport_text

    fees = by_title.get("VCE Fee Structure & Payment Guidelines")
    assert fees is not None
    fees_text = " ".join(c["text"] for c in fees["chunks"])
    assert "1,10,000" in fees_text and "installment" in fees_text


def test_missing_documents_returns_empty_when_all_seeded():
    titles = {d["title"] for d in VCE_DOCUMENTS}
    assert missing_documents(titles) == []


def test_missing_documents_returns_only_absent_entries():
    seeded = {
        d["title"] for d in VCE_DOCUMENTS if d["title"] != "Academic Regulations R22"
    }
    missing = missing_documents(seeded)
    assert len(missing) == 1
    assert missing[0]["title"] == "Academic Regulations R22"
