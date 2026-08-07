"""Tool registry and base tool definitions."""

from __future__ import annotations

import time
from abc import ABC, abstractmethod
from typing import Any
from pydantic import BaseModel

from app.schemas.common import ToolResult
from app.core.logging import get_logger

logger = get_logger("tools")


class BaseTool(ABC):
    """Abstract base class for tools used by agents."""

    name: str
    description: str
    parameters_schema: dict[str, Any]

    @abstractmethod
    async def run(self, **kwargs: Any) -> ToolResult:
        """Execute the tool with given parameters."""
        ...

    async def safe_run(self, **kwargs: Any) -> ToolResult:
        """Execute with latency tracking and error handling."""
        start = time.monotonic()
        try:
            res = await self.run(**kwargs)
            res.latency_ms = (time.monotonic() - start) * 1000
            return res
        except Exception as exc:
            logger.error("tool_failed", tool=self.name, error=str(exc))
            return ToolResult(
                tool_name=self.name,
                success=False,
                error=str(exc),
                latency_ms=(time.monotonic() - start) * 1000,
            )


class ToolRegistry:
    """Registry for agent tools."""

    def __init__(self) -> None:
        self._tools: dict[str, BaseTool] = {}

    def register(self, tool: BaseTool) -> None:
        self._tools[tool.name] = tool
        logger.info("tool_registered", name=tool.name)

    def get(self, name: str) -> BaseTool | None:
        return self._tools.get(name)

    def list_tools(self) -> list[dict[str, Any]]:
        return [
            {
                "name": t.name,
                "description": t.description,
                "schema": t.parameters_schema,
            }
            for t in self._tools.values()
        ]


_registry: ToolRegistry | None = None


def get_tool_registry() -> ToolRegistry:
    global _registry
    if _registry is None:
        _registry = ToolRegistry()
        _init_default_tools(_registry)
    return _registry


def _init_default_tools(registry: ToolRegistry) -> None:
    from app.tools.calendar_tool import CalendarTool
    from app.tools.email_tool import EmailTool
    from app.tools.search_tool import SearchTool
    from app.tools.notification_tool import NotificationTool

    registry.register(CalendarTool())
    registry.register(EmailTool())
    registry.register(SearchTool())
    registry.register(NotificationTool())
