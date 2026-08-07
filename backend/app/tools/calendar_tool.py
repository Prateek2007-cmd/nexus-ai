"""Calendar tool implementation."""

from __future__ import annotations
from typing import Any
from app.tools.registry import BaseTool
from app.schemas.common import ToolResult


class CalendarTool(BaseTool):
    name = "calendar_tool"
    description = "Create, search, or check events in campus calendar."
    parameters_schema = {
        "type": "object",
        "properties": {
            "action": {"type": "string", "enum": ["create", "check_conflict", "list"]},
            "title": {"type": "string"},
            "time": {"type": "string"},
        },
        "required": ["action"],
    }

    async def run(self, **kwargs: Any) -> ToolResult:
        action = kwargs.get("action", "list")
        title = kwargs.get("title", "Event")
        event_time = kwargs.get("time", "10:00")

        if action == "create":
            return ToolResult(
                tool_name=self.name,
                success=True,
                data={
                    "event_id": "evt-1092",
                    "title": title,
                    "time": event_time,
                    "status": "scheduled",
                },
            )
        elif action == "check_conflict":
            return ToolResult(
                tool_name=self.name,
                success=True,
                data={"has_conflict": False, "conflicting_event": None},
            )

        return ToolResult(
            tool_name=self.name,
            success=True,
            data={"events_count": 4, "next_event": "Distributed Systems"},
        )
