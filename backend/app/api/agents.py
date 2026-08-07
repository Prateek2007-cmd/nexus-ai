"""Agents API — agent info and status."""

from __future__ import annotations
from fastapi import APIRouter
from app.schemas.agent import AgentInfo

router = APIRouter()


@router.get("", response_model=list[AgentInfo])
async def list_agents() -> list[AgentInfo]:
    """List all agents with their current status and metrics."""
    from app.agents.registry import get_registry
    registry = get_registry()
    return [AgentInfo(**a.get_info()) for a in registry.list_agents()]


@router.get("/{agent_id}", response_model=AgentInfo)
async def get_agent(agent_id: str) -> AgentInfo:
    """Get a specific agent's info."""
    from app.agents.registry import get_registry
    agent = get_registry().get_or_raise(agent_id)
    return AgentInfo(**agent.get_info())
