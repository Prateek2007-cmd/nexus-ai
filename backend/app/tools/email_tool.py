"""Email tool implementation."""

from __future__ import annotations
from typing import Any
from app.tools.registry import BaseTool
from app.schemas.common import ToolResult


class EmailTool(BaseTool):
    name = "email_tool"
    description = "Draft or dispatch emails."
    parameters_schema = {
        "type": "object",
        "properties": {
            "to": {"type": "string"},
            "subject": {"type": "string"},
            "body": {"type": "string"},
            "action": {"type": "string", "enum": ["draft", "send"]},
        },
        "required": ["to", "subject", "body"],
    }

    async def run(self, **kwargs: Any) -> ToolResult:
        action = kwargs.get("action", "draft")
        to = kwargs.get("to")
        subject = kwargs.get("subject")
        body = kwargs.get("body")

        return ToolResult(
            tool_name=self.name,
            success=True,
            data={
                "action": action,
                "to": to,
                "subject": subject,
                "body": body,
                "status": "drafted" if action == "draft" else "queued",
            },
        )
