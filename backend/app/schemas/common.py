"""Common schemas: pagination, error response, tool results."""

from __future__ import annotations

from typing import Any
from pydantic import BaseModel


class ErrorResponse(BaseModel):
    error: str
    detail: str
    context: dict[str, Any] | None = None


class ToolResult(BaseModel):
    """Every tool returns this structured format — never raw strings."""
    tool_name: str
    success: bool
    data: dict[str, Any] | None = None
    error: str | None = None
    latency_ms: float = 0


class HealthResponse(BaseModel):
    status: str = "healthy"
    version: str
    agents_online: int
    database: str = "connected"
