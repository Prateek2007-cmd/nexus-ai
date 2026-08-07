"""Unit tests for the hybrid retrieval primitives (BM25 + RRF).

These cover the pure retrieval math ported from the RAG project
(`bm25.js`, `rff.js`) — no external services required.
"""

from __future__ import annotations

from app.rag.bm25 import BM25Index, tokenize
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
