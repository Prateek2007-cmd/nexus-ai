"""LangGraph graph definitions for multi-agent workflows."""

from __future__ import annotations
from typing import Any, Literal
import sqlite3
from langgraph.graph import StateGraph, START, END
from langgraph.checkpoint.sqlite import SqliteSaver
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
    task = AgentTask(task_id="wf-plan", agent_id="planner", action="create_plan", params={"query": state["query"], "intents": state.get("intents", [])})
    res = await planner.execute(task)
    
    # Handle dict vs object for plan
    plan_data = res.data
    if hasattr(plan_data, "dict"):
        plan_data = plan_data.dict()
        
    return {"plan": plan_data}

async def node_execution(state: GraphState) -> dict[str, Any]:
    from app.agents.registry import get_registry
    from app.agents.types import AgentTask
    registry = get_registry()
    plan = state.get("plan", {})
    
    steps = plan.get("steps", []) if isinstance(plan, dict) else getattr(plan, "steps", [])
    
    outputs = {}
    sources = []
    
    for step in steps:
        agent_id = step.get("agent") if isinstance(step, dict) else getattr(step, "agent", "")
        agent = registry.get(agent_id)
        if agent:
            task = AgentTask(
                task_id=step.get("step_id", "s-1") if isinstance(step, dict) else getattr(step, "step_id", "s-1"),
                agent_id=agent_id,
                action=step.get("action", "") if isinstance(step, dict) else getattr(step, "action", ""),
                params=step.get("params", {}) if isinstance(step, dict) else getattr(step, "params", {}),
                user_id=state.get("user_id", "u-1")
            )
            res = await agent.safe_execute(task)
            outputs[agent_id] = res.data
            
    return {"agent_outputs": outputs, "sources": sources}

async def node_hitl_gate(state: GraphState) -> dict[str, Any]:
    # This node is the human-in-the-loop pause point.
    # It just passes state through, but we interrupt BEFORE it.
    return {}

async def node_synthesis(state: GraphState) -> dict[str, Any]:
    from app.llm.client import get_llm_client
    client = get_llm_client()
    query = state["query"]
    outputs = state.get("agent_outputs", {})
    sources = state.get("sources", [])

    synth = await client.synthesize(query, outputs, sources)
    return {"final_response": synth or "Workflow completed.", "confidence": 0.95}

def route_hitl(state: GraphState) -> Literal["hitl_gate", "execution"]:
    plan = state.get("plan", {})
    steps = plan.get("steps", []) if isinstance(plan, dict) else getattr(plan, "steps", [])
    
    # If any action involves registering or booking, interrupt
    for step in steps:
        action = step.get("action", "") if isinstance(step, dict) else getattr(step, "action", "")
        if "register" in action or "book" in action or "apply" in action:
            return "hitl_gate"
    return "execution"

_memory = None

def get_checkpointer():
    global _memory
    if _memory is None:
        conn = sqlite3.connect("campusx_checkpoints.db", check_same_thread=False)
        _memory = SqliteSaver(conn)
    return _memory

def build_graph():
    workflow = StateGraph(GraphState)
    
    workflow.add_node("intent", node_intent_parsing)
    workflow.add_node("planning", node_planning)
    workflow.add_node("hitl_gate", node_hitl_gate)
    workflow.add_node("execution", node_execution)
    workflow.add_node("synthesis", node_synthesis)
    
    workflow.add_edge(START, "intent")
    workflow.add_edge("intent", "planning")
    
    # Conditional routing to hitl_gate if required
    workflow.add_conditional_edges("planning", route_hitl, {"hitl_gate": "hitl_gate", "execution": "execution"})
    
    workflow.add_edge("hitl_gate", "execution")
    workflow.add_edge("execution", "synthesis")
    workflow.add_edge("synthesis", END)
    
    return workflow.compile(checkpointer=get_checkpointer(), interrupt_before=["hitl_gate"])
