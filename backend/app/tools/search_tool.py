"""Search tool implementation."""

from __future__ import annotations
from typing import Any
from app.tools.registry import BaseTool
from app.schemas.common import ToolResult


class SearchTool(BaseTool):
    name = "search_tool"
    description = "Perform semantic vector search over knowledge base."
    parameters_schema = {
        "type": "object",
        "properties": {
            "query": {"type": "string"},
            "top_k": {"type": "integer"},
        },
        "required": ["query"],
    }

    async def run(self, **kwargs: Any) -> ToolResult:
        query = kwargs.get("query", "")
        top_k = kwargs.get("top_k", 5)

        try:
            from app.rag.pipeline import get_rag_pipeline
            rag = get_rag_pipeline()
            res = await rag.query(query, top_k=top_k)
            return ToolResult(
                tool_name=self.name,
                success=True,
                data={"chunks": res.chunks, "sources": res.sources, "confidence": res.confidence},
            )
        except Exception as exc:
            return ToolResult(tool_name=self.name, success=False, error=str(exc))
