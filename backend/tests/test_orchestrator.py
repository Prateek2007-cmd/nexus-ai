"""Orchestrator and Planner agent tests."""

import pytest
from app.agents.planner import PlannerAgent
from app.agents.orchestrator import OrchestratorAgent
from app.agents.types import AgentTask


@pytest.mark.asyncio
async def test_planner_intent_detection():
    planner = PlannerAgent()
    intents = planner._detect_intents("Am I eligible for Google internship?")
    assert "eligibility" in intents or "placement" in intents


@pytest.mark.asyncio
async def test_orchestrator_chat():
    orch = OrchestratorAgent()
    task = AgentTask(
        task_id="test-1",
        agent_id="orchestrator",
        action="orchestrate",
        params={"query": "Am I eligible for the Google internship?"},
    )
    result = await orch.execute(task)
    assert result.success is True
    assert "response" in result.data
    assert "Google" in result.data["response"] or "eligible" in result.data["response"].lower()
