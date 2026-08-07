"""LangGraph graph definitions for multi-agent workflows."""

from __future__ import annotations
from typing import Any
from app.workflows.state import GraphState
from app.core.logging import get_logger

logger = get_logger("workflows.graph")


async def node_intent_parsing(state: GraphState) -> dict[str, Any]:
    query = state["query"]
    from app.agents.planner import PlannerAgent
    planner = PlannerAgent()
    intents = planner._detect_intents(query)
    return {"intents": intents}


async def node_planning(state: GraphState) -> dict[str, Any]:
    from app.agents.planner import PlannerAgent
    from app.agents.types import AgentTask
    planner = PlannerAgent()
    task = AgentTask(task_id="wf-plan", agent_id="planner", action="create_plan", params={"query": state["query"], "intents": state["intents"]})
    res = await planner.execute(task)
    return {"plan": res.data}


async def node_synthesis(state: GraphState) -> dict[str, Any]:
    from app.llm.client import get_llm_client
    client = get_llm_client()
    query = state["query"]
    outputs = state.get("agent_outputs", {})
    sources = state.get("sources", [])

    synth = await client.synthesize(query, outputs, [])
    return {"final_response": synth or "Workflow completed.", "confidence": 0.95}
