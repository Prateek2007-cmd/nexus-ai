"""Notification tool implementation."""

from __future__ import annotations
from typing import Any
from app.tools.registry import BaseTool
from app.schemas.common import ToolResult


class NotificationTool(BaseTool):
    name = "notification_tool"
    description = "Dispatch push notifications or schedule reminders."
    parameters_schema = {
        "type": "object",
        "properties": {
            "title": {"type": "string"},
            "body": {"type": "string"},
            "offset_minutes": {"type": "integer"},
        },
        "required": ["title", "body"],
    }

    async def run(self, **kwargs: Any) -> ToolResult:
        title = kwargs.get("title")
        body = kwargs.get("body")
        offset = kwargs.get("offset_minutes", 0)

        return ToolResult(
            tool_name=self.name,
            success=True,
            data={
                "notification_id": "notif-883",
                "title": title,
                "body": body,
                "offset_minutes": offset,
                "status": "scheduled",
            },
        )
