"""BM25 (Best Matching 25) keyword retrieval index.

Faithful Python port of the RAG project's `bm25.js`.

BM25 is the sparse / exact-keyword half of the hybrid retrieval pipeline.
It scores documents by term frequency weighted by inverse document frequency
(rare terms weigh more) and length-normalized (k1/b Okapi tuning). It makes no
network calls and runs fully offline, which makes it ideal for pairing with an
offline ChromaDB vector index via Reciprocal Rank Fusion.
"""

from __future__ import annotations

import math
import re
from typing import Any, Iterable

_WORD_RE = re.compile(r"[a-z0-9]+")


def tokenize(text: str) -> list[str]:
    """Lowercase and split text into word tokens (matches the JS regex)."""
    return _WORD_RE.findall((text or "").lower())


class BM25Index:
    """An in-memory BM25 index over a list of ``{"id", "text"}`` documents."""

    def __init__(
        self,
        documents: Iterable[dict[str, Any]],
        k1: float = 1.5,
        b: float = 0.75,
    ) -> None:
        self.k1 = k1
        self.b = b
        self.documents = list(documents)
        self.doc_tokens = [
            tokenize(doc.get("text") or doc.get("pageContent") or "") for doc in self.documents
        ]
        self.doc_lengths = [len(tokens) for tokens in self.doc_tokens]
        total_len = sum(self.doc_lengths)
        self.avg_doc_length = total_len / len(self.doc_lengths) if self.doc_lengths else 1.0
        self.N = len(self.documents)
        self.doc_freq: dict[str, int] = self._build_doc_freq()

    def _build_doc_freq(self) -> dict[str, int]:
        """Count how many documents contain each term (at least once)."""
        df: dict[str, int] = {}
        for tokens in self.doc_tokens:
            for term in set(tokens):
                df[term] = df.get(term, 0) + 1
        return df

    def _idf(self, term: str) -> float:
        """Inverse document frequency — rare terms carry more weight."""
        n = self.doc_freq.get(term, 0)
        return math.log((self.N - n + 0.5) / (n + 0.5) + 1)

    def _score_doc(self, query_tokens: list[str], doc_index: int) -> float:
        tokens = self.doc_tokens[doc_index] or []
        doc_length = self.doc_lengths[doc_index] or 0

        term_freq: dict[str, int] = {}
        for t in tokens:
            term_freq[t] = term_freq.get(t, 0) + 1

        score = 0.0
        for term in query_tokens:
            f = term_freq.get(term, 0)
            if f == 0:
                continue  # term absent from this doc — ignore
            numerator = f * (self.k1 + 1)
            denominator = f + self.k1 * (
                1 - self.b + self.b * (doc_length / self.avg_doc_length)
            )
            score += self._idf(term) * (numerator / denominator)
        return score

    def search(self, query: str, top_k: int = 10) -> list[dict[str, Any]]:
        """Return the top-``top_k`` documents that match ``query``, ranked by BM25."""
        query_tokens = tokenize(query)
        scored: list[dict[str, Any]] = []
        for i, doc in enumerate(self.documents):
            score = self._score_doc(query_tokens, i)
            if score > 0:
                scored.append(
                    {
                        "id": doc.get("id"),
                        "text": doc.get("text") or doc.get("pageContent") or "",
                        "score": score,
                    }
                )
        scored.sort(key=lambda r: r["score"], reverse=True)
        return scored[:top_k]
