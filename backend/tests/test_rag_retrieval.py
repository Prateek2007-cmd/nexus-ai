"""Unit tests for the hybrid retrieval primitives (BM25 + RRF).

These cover the pure retrieval math ported from the RAG project
(`bm25.js`, `rff.js`) — no external services required.
"""

from __future__ import annotations

from app.rag.bm25 import BM25Index, tokenize
from app.rag.pipeline import citation_picks, regulation_first
from app.rag.rrf import reciprocal_rank_fusion


# ── BM25 ────────────────────────────────────────────────────────────────


def test_tokenize_lowercases_and_splits_words():
    assert tokenize("Kruskal's Algorithm O(E log V)") == [
        "kruskal",
        "s",
        "algorithm",
        "o",
        "e",
        "log",
        "v",
    ]


def test_bm25_ranks_matching_doc_first():
    docs = [
        {"id": "c1", "text": "Binary search runs in O(log n) time on a sorted array."},
        {"id": "c2", "text": "Bellman-Ford computes shortest paths and handles negative weights."},
        {"id": "c3", "text": "Kruskal's algorithm builds a minimum spanning tree using union-find."},
    ]
    index = BM25Index(docs)
    results = index.search("Kruskal minimum spanning tree", top_k=3)

    assert results, "expected at least one BM25 match"
    assert results[0]["id"] == "c3", "the Kruskal chunk should rank first"
    assert results[0]["score"] > 0


def test_bm25_returns_empty_when_no_term_overlap():
    docs = [
        {"id": "c1", "text": "Hostel curfew is 9:30 PM on weekdays."},
        {"id": "c2", "text": "Placement drives require a minimum CGPA of 7.5."},
    ]
    index = BM25Index(docs)
    assert index.search("quantum physics", top_k=3) == []


def test_bm25_handles_empty_corpus():
    index = BM25Index([])
    assert index.search("anything", top_k=3) == []


# ── Reciprocal Rank Fusion ──────────────────────────────────────────────


def test_rrf_boosts_documents_shared_by_both_lists():
    dense = [
        {"id": "a", "text": "attendance 75 percent"},
        {"id": "b", "text": "grading system"},
    ]
    sparse = [
        {"id": "b", "text": "grading system"},
        {"id": "c", "text": "promotion rules"},
    ]

    fused = reciprocal_rank_fusion([dense, sparse])

    ids = [r["id"] for r in fused]
    assert ids[0] == "b", "the doc ranked by both retrievers must fuse to the top"
    assert set(ids) == {"a", "b", "c"}


def test_rrf_preserves_score_and_text():
    dense = [{"id": "x", "text": "lab evaluation"}]
    fused = reciprocal_rank_fusion([dense])

    assert len(fused) == 1
    assert fused[0]["id"] == "x"
    assert fused[0]["text"] == "lab evaluation"
    assert abs(fused[0]["score"] - 1.0 / 61.0) < 1e-9


def test_rrf_skips_records_without_ids():
    fused = reciprocal_rank_fusion(
        [[{"id": None, "text": "no id"}, {"id": "ok", "text": "has id"}]]
    )
    assert [r["id"] for r in fused] == ["ok"]


def test_rrf_handles_empty_input():
    assert reciprocal_rank_fusion([]) == []
    assert reciprocal_rank_fusion([[], []]) == []
    assert reciprocal_rank_fusion([[{}], []]) == []


# ── Regulation-first citation ordering ──────────────────────────────────


def test_regulation_first_prefers_non_textbook_chunks():
    chunks = [
        {"id": "c1", "type": "Handbook", "doc": "Academic Regulations R22"},
        {"id": "c2", "type": "Book", "doc": "Compilers: Dragon Book"},
        {"id": "c3", "type": "Notice", "doc": "Library Notice"},
        {"id": "c4", "type": "Book", "doc": "Operating System Concepts"},
    ]
    ordered = regulation_first(chunks)
    assert [c["id"] for c in ordered] == ["c1", "c3", "c2", "c4"]


def test_regulation_first_preserves_order_within_groups():
    chunks = [
        {"id": "a", "type": "Policy", "doc": "p1"},
        {"id": "b", "type": "Book", "doc": "b1"},
        {"id": "c", "type": "Circular", "doc": "c1"},
        {"id": "d", "type": "Book", "doc": "b2"},
    ]
    ordered = regulation_first(chunks)
    assert [c["id"] for c in ordered] == ["a", "c", "b", "d"]


def test_regulation_first_keeps_fused_order_when_top_match_is_textbook():
    """CS-concept queries: the best match is a book, so incidental regulation
    chunks must NOT displace the textbook evidence."""
    chunks = [
        {"id": "a", "type": "Book", "doc": "Operating System Concepts"},
        {"id": "b", "type": "Handbook", "doc": "Academic Regulations R22"},
        {"id": "c", "type": "Book", "doc": "Operating System Concepts"},
    ]
    assert [c["id"] for c in regulation_first(chunks)] == ["a", "b", "c"]


def test_regulation_first_keeps_all_textbook_sets_unchanged():
    chunks = [
        {"id": "a", "type": "Book", "doc": "b1"},
        {"id": "b", "type": "Book", "doc": "b2"},
    ]
    assert [c["id"] for c in regulation_first(chunks)] == ["a", "b"]


def test_regulation_first_handles_missing_type():
    """Chunks without a doc_type default to 'Document' → regulation side."""
    chunks = [
        {"id": "a", "text": "no type"},
        {"id": "b", "type": "Book", "text": "textbook"},
    ]
    assert [c["id"] for c in regulation_first(chunks)] == ["a", "b"]


def test_regulation_first_handles_empty():
    assert regulation_first([]) == []


# ── Citation picks (top-3, on-topic) ───────────────────────────────────


def test_citation_picks_fills_slots_from_regulations_only():
    """'transport bus routes' style pool: only 2 regulation chunks exist — the
    textbook page must not be squeezed into the 3rd citation slot."""
    chunks = [
        {"id": "t1", "type": "Circular", "doc": "VCE Transport & Bus Routes", "text": "Route 7 arrives at 7:45 AM"},
        {"id": "t2", "type": "Circular", "doc": "VCE Transport & Bus Routes", "text": "Bus pass application"},
        {"id": "n1", "type": "Book", "doc": "Computer Networking", "text": "Transport Layer Mechanisms"},
    ]
    picks = citation_picks(chunks)
    assert [c["id"] for c in picks] == ["t1", "t2"]


def test_citation_picks_caps_at_three_regulation_chunks():
    chunks = [
        {"id": "r1", "type": "FAQ", "doc": "Library Rules", "text": "borrow 4 books"},
        {"id": "b1", "type": "Book", "doc": "Dragon Book", "text": "LR parsers"},
        {"id": "r2", "type": "FAQ", "doc": "Library Rules", "text": "digital library"},
        {"id": "r3", "type": "Circular", "doc": "Hostel Code", "text": "curfew"},
        {"id": "r4", "type": "Policy", "doc": "Fee Guidelines", "text": "installments"},
    ]
    picks = citation_picks(chunks)
    assert [c["id"] for c in picks] == ["r1", "r2", "r3"]


def test_citation_picks_keeps_fused_order_when_top_match_is_textbook():
    """Concept questions (best match is a textbook) keep the fused top-3."""
    chunks = [
        {"id": "os1", "type": "Book", "doc": "Operating System Concepts", "text": "semaphores"},
        {"id": "os2", "type": "Book", "doc": "Operating System Concepts", "text": "paging"},
        {"id": "cur", "type": "Handbook", "doc": "CSE Curriculum", "text": "Semester 5 subjects"},
    ]
    picks = citation_picks(chunks)
    assert [c["id"] for c in picks] == ["os1", "os2", "cur"]


def test_citation_picks_handles_empty():
    assert citation_picks([]) == []
