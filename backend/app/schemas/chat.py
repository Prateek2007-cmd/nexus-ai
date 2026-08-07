"""Chat and streaming schemas."""

from __future__ import annotations

from typing import Any
from pydantic import BaseModel, Field


class ChatRequest(BaseModel):
    message: str = Field(..., min_length=1, max_length=4000)
    conversation_id: str | None = None


class ChatResponse(BaseModel):
    conversation_id: str
    message_id: str
    content: str
    sources: list[str] = []
    workflow_id: str | None = None
    confidence: float = 0.0


class StreamEvent(BaseModel):
    """WebSocket event sent during agent execution."""
    event: str  # status | step_complete | token | error | done
    data: dict[str, Any]


class WorkflowStep(BaseModel):
    agent: str
    action: str
    ms: float = 0
    status: str = "pending"  # pending | running | completed | failed


class WorkflowPlan(BaseModel):
    workflow_id: str
    steps: list[WorkflowStep]
