"""Dynamic Agent Registry — discovers, registers, and routes to agents.

The registry is the central hub for agent lifecycle management. It supports
runtime registration, capability-based routing, and health monitoring.
"""

from __future__ import annotations

from typing import TYPE_CHECKING

from app.core.logging import get_logger

if TYPE_CHECKING:
    from app.agents.base import BaseAgent

logger = get_logger("registry")


class AgentRegistry:
    """Singleton registry for all agents in the system."""

    _instance: AgentRegistry | None = None
    _agents: dict[str, "BaseAgent"]

    def __new__(cls) -> "AgentRegistry":
        if cls._instance is None:
            cls._instance = super().__new__(cls)
            cls._instance._agents = {}
        return cls._instance

    def register(self, agent: "BaseAgent") -> None:
        """Register an agent instance."""
        self._agents[agent.agent_id] = agent
        logger.info("agent_registered", agent_id=agent.agent_id, name=agent.name)

    def get(self, agent_id: str) -> "BaseAgent | None":
        """Get an agent by ID."""
        return self._agents.get(agent_id)

    def get_or_raise(self, agent_id: str) -> "BaseAgent":
        """Get an agent by ID, raising if not found."""
        agent = self._agents.get(agent_id)
        if agent is None:
            raise KeyError(f"Agent '{agent_id}' not found in registry")
        return agent

    def list_agents(self) -> list["BaseAgent"]:
        """List all registered agents."""
        return list(self._agents.values())

    def list_agent_ids(self) -> list[str]:
        """List all registered agent IDs."""
        return list(self._agents.keys())

    def route_by_capability(self, capability: str) -> list["BaseAgent"]:
        """Find all agents that have a given capability."""
        return [
            agent for agent in self._agents.values()
            if capability in agent.capabilities
        ]

    def get_agent_info(self) -> list[dict]:
        """Return info for all agents in the frontend's expected shape."""
        return [agent.get_info() for agent in self._agents.values()]

    @property
    def agents_online(self) -> int:
        """Count of registered agents."""
        return len(self._agents)


def get_registry() -> AgentRegistry:
    """Get the singleton registry instance."""
    reg = AgentRegistry()
    if not reg._agents:
        _do_initialize(reg)
    return reg


def initialize_agents() -> AgentRegistry:
    """Initialize all agents and register them."""
    reg = AgentRegistry()
    if not reg._agents:
        _do_initialize(reg)
    return reg


def _do_initialize(registry: AgentRegistry) -> None:
    """Internal helper to populate registry avoiding recursion."""
    from app.agents.academic import AcademicAgent
    from app.agents.placement import PlacementAgent
    from app.agents.events import EventsAgent
    from app.agents.knowledge import KnowledgeAgent
    from app.agents.services import StudentServicesAgent
    from app.agents.communication import CommunicationAgent
    from app.agents.notification import NotificationAgent
    from app.agents.calendar import CalendarAgent
    from app.agents.planner import PlannerAgent
    from app.agents.orchestrator import OrchestratorAgent

    registry.register(AcademicAgent())
    registry.register(PlacementAgent())
    registry.register(EventsAgent())
    registry.register(KnowledgeAgent())
    registry.register(StudentServicesAgent())
    registry.register(CommunicationAgent())
    registry.register(NotificationAgent())
    registry.register(CalendarAgent())
    registry.register(PlannerAgent())
    registry.register(OrchestratorAgent())

    logger.info("all_agents_initialized", count=registry.agents_online)
