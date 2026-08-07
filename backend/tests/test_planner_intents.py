"""Planner intent-routing tests.

Regression coverage for the "college timings" bug: informational queries that
matched no intent keyword fell through to ``chat`` and the orchestrator
answered with a bare greeting instead of delegating to the Knowledge Agent.
"""

from __future__ import annotations

from app.agents.planner import PlannerAgent
from app.agents.types import AgentTask


def _plan(query: str):
    planner = PlannerAgent()
    task = AgentTask(
        task_id="t1",
        agent_id="planner",
        action="create_plan",
        params={"query": query},
        user_id="u1",
    )
    return planner._create_plan(task)


def _step_agents(plan):
    return [step.agent for step in plan.steps]


async def test_college_timings_routes_to_knowledge_agent():
    plan = await _plan("what are the college timings")
    assert "knowledge" in plan.intents
    assert "knowledge" in _step_agents(plan)


async def test_college_timings_plan_has_retrieve_step():
    plan = await _plan("tell me about college timings")
    knowledge_steps = [s for s in plan.steps if s.agent == "knowledge"]
    assert knowledge_steps, "a knowledge retrieve step must exist"
    assert knowledge_steps[0].action == "retrieve"


async def test_working_hours_variants_route_to_knowledge():
    for query in [
        "what are the college working hours",
        "office hours of the admin block",
        "college class schedule",
        "academic calendar holidays",
    ]:
        plan = await _plan(query)
        assert "knowledge" in _step_agents(plan), f"{query!r} should route to knowledge"


async def test_personal_schedule_stays_with_calendar_agent():
    """Bare 'schedule'/'my daily schedule' is the student's timetable → calendar."""
    for query in ["show my daily schedule", "what is my class schedule today"]:
        plan = await _plan(query)
        agents = _step_agents(plan)
        assert "calendar" in agents, f"{query!r} should route to calendar"
        assert "knowledge" not in agents, f"{query!r} must not trigger a RAG step"


async def test_mess_timings_still_routes_to_services():
    plan = await _plan("hostel mess timings")
    assert "services" in _step_agents(plan)


async def test_pure_greeting_stays_chat_with_no_steps():
    plan = await _plan("hi")
    assert plan.intents == ["chat"]
    assert plan.steps == []


async def test_chat_prefix_with_knowledge_keyword_still_gets_rag_step():
    """'hi what are the college timings' trips the chat early-return, but the
    needs_rag fallback must still insert exactly one knowledge retrieve step."""
    plan = await _plan("hi what are the college timings")
    assert plan.intents == ["chat"]
    knowledge_steps = [s for s in plan.steps if s.agent == "knowledge"]
    assert len(knowledge_steps) == 1
    assert knowledge_steps[0].action == "retrieve"


async def test_knowledge_step_not_duplicated_when_intent_already_matches():
    """A query whose intents already include knowledge must not get a second
    RAG step inserted by the needs_rag fallback."""
    plan = await _plan("what are the college timings")
    knowledge_steps = [s for s in plan.steps if s.agent == "knowledge"]
    assert len(knowledge_steps) == 1


async def test_regulation_question_routes_to_knowledge():
    plan = await _plan("what are the examination regulations")
    assert "knowledge" in _step_agents(plan)


async def test_transport_queries_route_to_knowledge():
    for query in [
        "transport bus routes",
        "college bus timings",
        "how do I get a bus pass",
    ]:
        plan = await _plan(query)
        assert "knowledge" in _step_agents(plan), f"{query!r} should route to knowledge"


async def test_vacation_queries_route_to_knowledge():
    for query in ["summer vacation dates", "when does summer vacation start"]:
        plan = await _plan(query)
        assert "knowledge" in _step_agents(plan), f"{query!r} should route to knowledge"


async def test_revaluation_question_routes_to_knowledge():
    plan = await _plan("revaluation process")
    assert "knowledge" in _step_agents(plan)


async def test_fee_queries_route_to_knowledge():
    for query in [
        "what is the tuition fee structure",
        "fee payment deadline",
        "hostel fees",
    ]:
        plan = await _plan(query)
        assert "knowledge" in _step_agents(plan), f"{query!r} should route to knowledge"


async def test_exam_pattern_question_routes_to_knowledge():
    plan = await _plan("exam pattern and passing marks")
    assert "knowledge" in _step_agents(plan)


async def test_open_close_time_phrasings_route_to_knowledge():
    for query in [
        "what time does the college open",
        "college opening time",
        "what time does the office close",
        "library opening time",
    ]:
        plan = await _plan(query)
        assert "knowledge" in _step_agents(plan), f"{query!r} should route to knowledge"


async def test_busy_business_do_not_trigger_rag():
    """Bare "bus" would substring-match "busy"/"business" — excluded."""
    for query in ["are you busy", "i am busy right now"]:
        plan = await _plan(query)
        assert "knowledge" not in _step_agents(plan), f"{query!r} must not route to RAG"
