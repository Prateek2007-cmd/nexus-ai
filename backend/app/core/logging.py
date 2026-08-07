"""Structured logging with workflow context.

Uses structlog for structured JSON logging in production and human-readable
output in development. Every log entry carries workflow_id, agent, and
latency context when available.
"""

from __future__ import annotations

import logging
import sys
import time
import uuid
from contextvars import ContextVar
from typing import Any

import structlog

# Context variables for request-scoped logging
workflow_id_var: ContextVar[str] = ContextVar("workflow_id", default="")
agent_name_var: ContextVar[str] = ContextVar("agent_name", default="")
request_id_var: ContextVar[str] = ContextVar("request_id", default="")


def setup_logging(level: str = "INFO") -> None:
    """Configure structlog and stdlib logging."""
    log_level = getattr(logging, level.upper(), logging.INFO)

    structlog.configure(
        processors=[
            structlog.contextvars.merge_contextvars,
            structlog.processors.add_log_level,
            structlog.processors.TimeStamper(fmt="iso"),
            structlog.processors.StackInfoRenderer(),
            structlog.processors.format_exc_info,
            structlog.dev.ConsoleRenderer(),
        ],
        wrapper_class=structlog.make_filtering_bound_logger(log_level),
        context_class=dict,
        logger_factory=structlog.PrintLoggerFactory(file=sys.stderr),
        cache_logger_on_first_use=True,
    )

    # Suppress noisy third-party loggers
    for name in ("uvicorn.access", "httpx", "chromadb"):
        logging.getLogger(name).setLevel(logging.WARNING)


def get_logger(name: str | None = None) -> structlog.stdlib.BoundLogger:
    """Get a named logger instance."""
    return structlog.get_logger(name or "campusx")


def generate_workflow_id() -> str:
    """Generate a unique workflow ID."""
    return f"wf-{uuid.uuid4().hex[:12]}"


def generate_request_id() -> str:
    """Generate a unique request ID."""
    return f"req-{uuid.uuid4().hex[:8]}"


class WorkflowLogger:
    """Context manager that logs the full lifecycle of a workflow execution.

    Usage:
        async with WorkflowLogger("chat_request") as wlog:
            wlog.step("orchestrator", "intent_detection", tokens=42)
            wlog.step("placement", "check_eligibility", latency_ms=640)
    """

    def __init__(self, workflow_type: str) -> None:
        self.workflow_id = generate_workflow_id()
        self.workflow_type = workflow_type
        self.log = get_logger("workflow")
        self.start_time = 0.0
        self.steps: list[dict[str, Any]] = []

    async def __aenter__(self) -> "WorkflowLogger":
        self.start_time = time.monotonic()
        workflow_id_var.set(self.workflow_id)
        self.log.info(
            "workflow_started",
            workflow_id=self.workflow_id,
            workflow_type=self.workflow_type,
        )
        return self

    async def __aexit__(self, exc_type: Any, exc_val: Any, exc_tb: Any) -> None:
        elapsed = (time.monotonic() - self.start_time) * 1000
        self.log.info(
            "workflow_completed",
            workflow_id=self.workflow_id,
            total_latency_ms=round(elapsed, 1),
            steps=len(self.steps),
            error=str(exc_val) if exc_val else None,
        )
        workflow_id_var.set("")

    def step(
        self,
        agent: str,
        action: str,
        *,
        latency_ms: float = 0,
        prompt_tokens: int = 0,
        completion_tokens: int = 0,
        tool_calls: int = 0,
        confidence: float = 0,
        error: str | None = None,
        retries: int = 0,
    ) -> None:
        """Log a single step within the workflow."""
        entry = {
            "workflow_id": self.workflow_id,
            "agent": agent,
            "action": action,
            "latency_ms": round(latency_ms, 1),
            "prompt_tokens": prompt_tokens,
            "completion_tokens": completion_tokens,
            "tool_calls": tool_calls,
            "confidence": round(confidence, 3),
            "error": error,
            "retries": retries,
            "timestamp": time.time(),
        }
        self.steps.append(entry)
        agent_name_var.set(agent)
        self.log.info("workflow_step", **entry)
