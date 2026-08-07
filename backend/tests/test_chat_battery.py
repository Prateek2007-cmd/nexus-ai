"""Chat query battery — no query may fall through to a bare greeting.

Regression harness for the routing fixes. For every representative query the
planner must produce at least one agent step (an *empty* plan is the path that
previously degraded to the canned "Hello …" greeting), and orchestrator-style
synthesis with a stub agent result must yield grounded content — never the
greeting. Pure greetings remain the control that must still greet.
"""

from __future__ import annotations

import pytest

from app.agents.planner import PlannerAgent
from app.agents.registry import get_registry
from app.agents.types import AgentResult, AgentTask
from app.llm.client import LLMClient

# The 24 representative queries probed against the live chat API
# (fees, transport, holidays, library, exam rules, timings, misc).
QUERY_BATTERY: list[str] = [
    # fees
    "what is the tuition fee structure",
    "how much are the B.E. fees",
    "fee payment deadline",
    "hostel fees",
    # transport
    "transport bus routes",
    "college bus timings",
    "how do I get a bus pass",
    # holidays
    "when is the next holiday",
    "summer vacation dates",
    "is second saturday a holiday",
    # library
    "library rules",
    "how many books can I borrow",
    "library timings",
    "overdue fine",
    # exam rules
    "examination rules",
    "exam pattern and passing marks",
    "makeup exam",
    "revaluation process",
    # timings / misc
    "college timings",
    "what time does the college open",
    "attendance requirement",
    "hostel curfew",
    "scholarship eligibility",
    "placement eligibility",
]

GREETING_MARKERS: tuple[str, ...] = (
    "hello **",
    "welcome to campusx",
    "how can i assist you",
)


def _is_greeting(text: str) -> bool:
    low = text.lower()
    return any(marker in low for marker in GREETING_MARKERS)


def _task(query: str) -> AgentTask:
    return AgentTask(
        task_id="battery",
        agent_id="planner",
        action="create_plan",
        params={"query": query},
        user_id="u1",
    )


@pytest.mark.parametrize("query", QUERY_BATTERY)
async def test_battery_queries_produce_agent_steps(query: str) -> None:
    """An empty plan is the path that previously degraded to the greeting.

    Also guards the runtime path where a planned agent is missing from the
    registry (agent_not_found → zero results → greeting).
    """
    plan = await PlannerAgent().plan(_task(query))
    assert plan.steps, (
        f"{query!r} produced no agent steps — the orchestrator would "
        "fall through to the canned greeting"
    )
    known = set(get_registry().list_agent_ids())
    assert all(step.agent in known for step in plan.steps), (
        f"{query!r} plans an unregistered agent: "
        f"{sorted({s.agent for s in plan.steps if s.agent not in known})}"
    )


@pytest.mark.parametrize("query", QUERY_BATTERY)
async def test_battery_queries_synthesize_grounded_response(
    query: str, monkeypatch: pytest.MonkeyPatch
) -> None:
    """With a (stub) agent result present, synthesis must not degrade to the greeting.

    ``monkeypatch.delenv`` makes the test hermetic: ``LLMClient(api_key="")``
    would otherwise fall back to an ambient ``GROQ_API_KEY`` and hit the live
    API instead of the deterministic offline synthesizer.
    """
    monkeypatch.delenv("GROQ_API_KEY", raising=False)
    stub_result = AgentResult(
        task_id="battery",
        agent_id="knowledge",
        action="retrieve",
        data={"summary": "Grounded answer retrieved from the corpus."},
        confidence=0.9,
    )
    # No API key → the deterministic fallback synthesizer runs (offline).
    client = LLMClient(api_key="")
    out = await client.synthesize(
        query,
        {"knowledge": stub_result.data},
        [stub_result],
        student_profile={"name": "Aarav Raman"},
    )
    assert not _is_greeting(out), (
        f"{query!r} synthesized the greeting despite a result being present"
    )
    assert "Grounded answer retrieved from the corpus." in out


async def test_pure_greeting_control_still_greets() -> None:
    """Guard against over-fixing: actual greetings must keep the greeting."""
    plan = await PlannerAgent().plan(_task("hi"))
    assert plan.steps == []
