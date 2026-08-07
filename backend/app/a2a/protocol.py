"""Agent2Agent (A2A) Protocol implementation.

Publishes standardized Agent Cards at `/.well-known/agent.json` enabling
inter-agent discovery, capabilities negotiation, and cross-agent delegation.
"""

from __future__ import annotations
from typing import Any, Dict
from fastapi import APIRouter, Request
from fastapi.responses import JSONResponse

a2a_router = APIRouter(tags=["a2a"])

AGENT_CARD = {
    "name": "CampusX Multi-Agent System",
    "description": "Unified smart campus autonomous agent network with Orchestrator, Specialist agents, RAG, and HITL execution control.",
    "version": "2.5.0",
    "provider": "Vasavi College of Engineering / HackerRank Orchestrate",
    "capabilities": [
        "orchestration",
        "academic_management",
        "placement_eligibility",
        "events_discovery",
        "student_services",
        "self_healing_rag",
        "hitl_approval",
    ],
    "modalities": ["text", "voice", "mcp_jsonrpc", "a2a_jsonrpc"],
    "endpoints": {
        "chat": "/api/chat/send",
        "mcp": "/api/mcp",
        "a2a_delegate": "/api/a2a/delegate",
    },
    "protocols_supported": ["A2A-1.0", "MCP-2024-11", "JSON-RPC-2.0"],
}

@a2a_router.get("/.well-known/agent.json")
async def get_agent_card():
    """Publish standardized A2A Agent Card metadata."""
    return JSONResponse(AGENT_CARD)

@a2a_router.post("/api/a2a/delegate")
async def delegate_a2a_task(request: Request):
    """A2A Inter-Agent Delegation Endpoint."""
    try:
        body = await request.json()
        target_agent = body.get("target_agent", "orchestrator")
        task_query = body.get("query", "")

        from app.agents.registry import get_agent_registry
        registry = get_agent_registry()

        if not registry.is_initialized():
            await registry.initialize()

        agent = registry.get(target_agent)
        if not agent:
            return JSONResponse({"status": "error", "message": f"Target agent '{target_agent}' not found"}, status_code=404)

        from app.agents.types import AgentTask
        import uuid

        task = AgentTask(
            task_id=f"a2a-{uuid.uuid4().hex[:8]}",
            agent_id=target_agent,
            action="execute",
            params={"query": task_query},
        )

        result = await agent.execute(task)
        return JSONResponse({
            "status": "success",
            "delegated_by": body.get("caller_agent", "external_a2a_client"),
            "target_agent": target_agent,
            "result": result.model_dump(),
        })

    except Exception as exc:
        return JSONResponse({"status": "error", "message": str(exc)}, status_code=500)
