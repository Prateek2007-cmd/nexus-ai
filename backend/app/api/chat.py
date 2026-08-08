"""Chat API — REST + WebSocket for multi-agent orchestrated conversations.

This is the primary interface between the frontend and the multi-agent backend.
It provides both synchronous (REST) and streaming (WebSocket) endpoints.
"""

from __future__ import annotations

import json
import uuid
import time
from typing import Any

from fastapi import APIRouter, WebSocket, WebSocketDisconnect
from pydantic import BaseModel, Field

from app.core.logging import get_logger

logger = get_logger("api.chat")

router = APIRouter()


class ChatRequest(BaseModel):
    message: str = Field(..., min_length=1, max_length=4000)
    conversation_id: str | None = None
    student_profile: dict[str, Any] | None = None
    image_base64: str | None = None


class ChatResponse(BaseModel):
    conversation_id: str
    message_id: str
    content: str
    sources: list[str] = []
    workflow_id: str | None = None
    confidence: float = 0.0
    timeline: list[dict[str, Any]] = []
    agents_used: list[str] = []


@router.post("/send", response_model=ChatResponse)
async def send_message(body: ChatRequest) -> ChatResponse:
    """Send a message and get the orchestrated multi-agent response."""
    start = time.monotonic()
    user_id = "demo-user-001"

    try:
        from app.agents.registry import get_registry
        orchestrator = get_registry().get_or_raise("orchestrator")

        result = await orchestrator.process_chat(
            query=body.message,
            user_id=user_id,
            conversation_id=body.conversation_id,
            student_profile=body.student_profile,
            image_base64=body.image_base64,
        )

        elapsed_ms = round((time.monotonic() - start) * 1000)

        # Check if the orchestrator paused at a HITL interrupt gate
        if result.data.get("__interrupt__"):
            import json as _json
            return ChatResponse(
                conversation_id=body.conversation_id or str(uuid.uuid4()),
                message_id=result.task_id,
                content=_json.dumps(result.data),
                sources=result.sources,
                workflow_id=result.data.get("thread_id"),
                confidence=result.confidence,
                timeline=result.data.get("timeline", []),
                agents_used=["Orchestrator Supervisor"],
            )

        response_text = result.data.get("response", "")
        timeline = result.data.get("timeline", [])
        agents_used = list({step.get("agent", "") for step in timeline if step.get("agent")})

        logger.info(
            "chat_completed",
            query=body.message[:80],
            agents=agents_used,
            confidence=result.confidence,
            latency_ms=elapsed_ms,
        )

        return ChatResponse(
            conversation_id=body.conversation_id or str(uuid.uuid4()),
            message_id=result.task_id,
            content=response_text,
            sources=result.sources,
            workflow_id=result.data.get("workflow_id"),
            confidence=result.confidence,
            timeline=timeline,
            agents_used=agents_used,
        )

    except Exception as exc:
        logger.error("chat_error", error=str(exc), query=body.message[:80])
        # Return a graceful fallback instead of a 500
        return ChatResponse(
            conversation_id=body.conversation_id or str(uuid.uuid4()),
            message_id=f"err-{uuid.uuid4().hex[:8]}",
            content=f"I encountered an issue processing your request. Error: {str(exc)[:200]}",
            sources=[],
            confidence=0.0,
            timeline=[],
            agents_used=[],
        )


class ResumeRequest(BaseModel):
    thread_id: str
    action: str
    approved: bool
    query: str
    conversation_id: str | None = None


@router.post("/resume", response_model=ChatResponse)
async def resume_hitl_action(body: ResumeRequest) -> ChatResponse:
    """Resume a paused Human-in-the-Loop (HITL) graph execution after user approval/rejection."""
    user_id = "demo-user-001"
    try:
        if not body.approved:
            return ChatResponse(
                conversation_id=body.conversation_id or str(uuid.uuid4()),
                message_id=f"hitl-rej-{uuid.uuid4().hex[:8]}",
                content=f"❌ **Action Cancelled**: You rejected the execution of **{body.action}**. No campus database changes were made.",
                sources=[],
                confidence=1.0,
                timeline=[{"agent": "Human Supervisor", "action": f"Rejected action: {body.action}", "ms": 5}],
                agents_used=["Human Supervisor"],
            )

        from app.agents.registry import get_registry
        orchestrator = get_registry().get_or_raise("orchestrator")

        from app.agents.types import AgentTask
        task = AgentTask(
            task_id=f"hitl-approved-{uuid.uuid4().hex[:8]}",
            agent_id="orchestrator",
            action="orchestrate",
            params={"query": body.query, "message": body.query, "hitl_approved": True},
            user_id=user_id,
        )

        result = await orchestrator._orchestrate(task)
        response_text = result.data.get("response", "")
        timeline = result.data.get("timeline", [])
        agents_used = list({step.get("agent", "") for step in timeline if step.get("agent")})

        return ChatResponse(
            conversation_id=body.conversation_id or str(uuid.uuid4()),
            message_id=result.task_id,
            content=f"✅ **Action Approved & Executed**:\n\n{response_text}",
            sources=result.sources,
            workflow_id=result.data.get("workflow_id"),
            confidence=result.confidence,
            timeline=timeline,
            agents_used=agents_used,
        )

    except Exception as exc:
        return ChatResponse(
            conversation_id=body.conversation_id or str(uuid.uuid4()),
            message_id=f"err-{uuid.uuid4().hex[:8]}",
            content=f"Error executing approved action: {str(exc)}",
            sources=[],
            confidence=0.0,
            timeline=[],
            agents_used=[],
        )


@router.get("/suggestions")
async def get_suggestions() -> list[str]:
    """Return suggested queries for the chat interface."""
    return [
        "Am I eligible for the Google internship?",
        "Summarize the examination regulations",
        "Show today's classes and recommend AI workshops",
        "Draft an email requesting a makeup exam",
    ]


@router.websocket("/stream")
async def chat_stream(websocket: WebSocket) -> None:
    """WebSocket endpoint for streaming agent execution events.

    Protocol:
    1. Client sends: {"token": "...", "message": "query text"}
    2. Server emits events:
       - {"event": "status", "data": {"status": "Planning", "agent": "Orchestrator"}}
       - {"event": "step_complete", "data": {"agent": "...", "action": "...", "ms": 123}}
       - {"event": "token", "data": {"text": "chunk..."}}
       - {"event": "done", "data": {"sources": [...], "confidence": 0.95, ...}}
    """
    await websocket.accept()

    try:
        raw = await websocket.receive_text()
        payload = json.loads(raw)
        message = payload.get("message", "")

        if not message:
            await websocket.send_json({"event": "error", "data": {"detail": "No message provided"}})
            await websocket.close()
            return

        user_id = "demo-user-001"

        async def emit(event: dict[str, Any]) -> None:
            try:
                await websocket.send_json(event)
            except Exception:
                pass

        from app.agents.registry import get_registry
        orchestrator = get_registry().get_or_raise("orchestrator")

        await emit({"event": "status", "data": {"status": "Thinking", "agent": "Orchestrator"}})

        result = await orchestrator.process_chat(
            query=message,
            user_id=user_id,
            emit_callback=emit,
        )

        response = result.data.get("response", "")
        if response:
            chunk_size = 12
            for i in range(0, len(response), chunk_size):
                chunk = response[i: i + chunk_size]
                await emit({"event": "token", "data": {"text": chunk}})

        await emit({
            "event": "done",
            "data": {
                "conversation_id": str(uuid.uuid4()),
                "sources": result.sources,
                "confidence": result.confidence,
                "workflow_id": result.data.get("workflow_id", ""),
                "timeline": result.data.get("timeline", []),
            },
        })

    except WebSocketDisconnect:
        pass
    except Exception as exc:
        try:
            await websocket.send_json({"event": "error", "data": {"detail": str(exc)}})
        except Exception:
            pass
    finally:
        try:
            await websocket.close()
        except Exception:
            pass
