"""Reciprocal Rank Fusion (RRF).

Faithful Python port of the RAG project's `rff.js` (`reciprocalRankFusion`).

RRF combines several ranked lists (e.g. dense vector hits + sparse BM25 hits)
into a single fused ranking without needing normalized scores across lists.
Each item receives `1 / (k + rank + 1)` per list it appears in, so an item
ranked highly by *both* retrievers beats an item ranked highly by only one.
"""

from __future__ import annotations

from typing import Any, Iterable

DEFAULT_K = 60


def reciprocal_rank_fusion(
    ranked_lists: Iterable[Iterable[dict[str, Any]]],
    k: int = DEFAULT_K,
) -> list[dict[str, Any]]:
    """Fuse multiple ranked lists of ``{id, text, ...}`` records into one list.

    Args:
        ranked_lists: Iterable of ranked lists; rank 0 is the best hit.
        k: RRF smoothing constant (default 60, same as the RAG project).

    Returns:
        A list of ``{"id", "text", "score"}`` records sorted by fused score,
        highest first. Items with a missing ``id`` are skipped.
    """
    scores: dict[str, float] = {}
    text_by_id: dict[str, str] = {}

    for ranked in ranked_lists:
        for rank, item in enumerate(ranked):
            if not isinstance(item, dict):
                continue
            item_id = item.get("id")
            if not item_id:
                continue
            scores[item_id] = scores.get(item_id, 0.0) + 1.0 / (k + rank + 1)
            text_by_id[item_id] = item.get("text") or ""

    fused = [
        {"id": item_id, "text": text_by_id[item_id], "score": score}
        for item_id, score in sorted(scores.items(), key=lambda kv: kv[1], reverse=True)
    ]
    return fused
