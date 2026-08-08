"""Knowledge citation tests.

The grounded synthesizer must prefer regulation-type documents (handbooks,
policies, circulars, notices, FAQs) over reference textbooks when both are in
the retrieved set, so citations stay on-topic (e.g. no textbook pages under a
"library rules" query). Textbooks remain citable when nothing else exists.
"""

from __future__ import annotations

from app.agents.types import AgentResult
from app.llm.client import LLMClient


def _chunk(doc: str, doc_type: str, text: str) -> dict:
    return {"id": doc, "doc": doc, "type": doc_type, "text": text}


async def test_citations_prefer_regulation_docs_over_textbooks(
    monkeypatch,
) -> None:
    """For a campus-rule query the best match is a regulation doc — a textbook
    chunk ranked below it must not take a citation slot."""
    monkeypatch.delenv("GROQ_API_KEY", raising=False)
    chunks = [
        # Realistic fused order for "library rules": the policy chunk is the
        # best match; the textbook page is noise ranked second.
        _chunk(
            "VCE Central Library Rules & Digital Access",
            "Handbook",
            "Undergraduate B.E. students can borrow up to 4 books for 14 days.",
        ),
        _chunk(
            "Compilers: Principles, Techniques, and Tools",
            "Book",
            "Syntax Analysis & LR Parsers: construction of SLR and LALR tables.",
        ),
        _chunk(
            "VCE Fee Structure & Payment Guidelines",
            "Handbook",
            "Annual B.E. tuition is Rs. 1,10,000 in two installments.",
        ),
        _chunk(
            "VCE College Calendar, Working Days & Class Timings",
            "Circular",
            "Second Saturday of every month is a holiday.",
        ),
    ]
    stub = AgentResult(
        task_id="citation-test",
        agent_id="knowledge",
        action="retrieve",
        data={"summary": "Grounded answer from the corpus.", "chunks": chunks},
        confidence=0.9,
    )

    client = LLMClient(api_key="")
    out = await client.synthesize(
        "library rules",
        {"knowledge": stub.data},
        [stub],
        student_profile={"name": "Aarav Raman"},
    )

    assert "**Grounded Regulations & Citations:**" in out
    assert "VCE Central Library Rules & Digital Access" in out
    assert "VCE Fee Structure & Payment Guidelines" in out
    assert "Syntax Analysis & LR Parsers" not in out, (
        "a textbook chunk must not be cited while regulation docs exist"
    )


async def test_textbook_best_match_keeps_textbook_citations(monkeypatch) -> None:
    """CS-concept queries: the best match is a textbook, so incidental
    regulation chunks must not displace the textbook evidence."""
    monkeypatch.delenv("GROQ_API_KEY", raising=False)
    chunks = [
        _chunk(
            "Operating System Concepts",
            "Book",
            "Semaphores and the Banker's algorithm for deadlock avoidance.",
        ),
        _chunk(
            "VCE Department of CSE Curriculum & Syllabus 2026",
            "Handbook",
            "Semester 5 CSE subjects include Operating Systems.",
        ),
    ]
    stub = AgentResult(
        task_id="citation-test",
        agent_id="knowledge",
        action="retrieve",
        data={"summary": "Grounded answer from the corpus.", "chunks": chunks},
        confidence=0.9,
    )

    client = LLMClient(api_key="")
    out = await client.synthesize(
        "what is a semaphore",
        {"knowledge": stub.data},
        [stub],
        student_profile={"name": "Aarav Raman"},
    )

    assert "Operating System Concepts" in out
    assert "Semaphores and the Banker's algorithm" in out


async def test_textbook_chunks_still_cited_when_only_textbooks_retrieved(
    monkeypatch,
) -> None:
    monkeypatch.delenv("GROQ_API_KEY", raising=False)
    chunks = [
        _chunk(
            "Operating System Concepts",
            "Book",
            "Semaphores and the Banker's algorithm for deadlock avoidance.",
        ),
        _chunk(
            "Introduction to Algorithms (CLRS)",
            "Book",
            "Binary search runs in O(log n) time.",
        ),
    ]
    stub = AgentResult(
        task_id="citation-test",
        agent_id="knowledge",
        action="retrieve",
        data={"summary": "Grounded answer from the corpus.", "chunks": chunks},
        confidence=0.9,
    )

    client = LLMClient(api_key="")
    out = await client.synthesize(
        "what is a semaphore",
        {"knowledge": stub.data},
        [stub],
        student_profile={"name": "Aarav Raman"},
    )

    assert "Operating System Concepts" in out
    assert "Semaphores and the Banker's algorithm" in out
