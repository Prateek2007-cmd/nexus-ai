"""Custom exception hierarchy and FastAPI exception handlers.

Provides domain-specific exceptions that map to HTTP status codes with
structured error responses. Implements graceful degradation — the backend
never crashes; it returns partial results or degraded responses.
"""

from __future__ import annotations

from typing import Any

from fastapi import FastAPI, Request, status
from fastapi.responses import JSONResponse

from app.core.logging import get_logger

logger = get_logger("exceptions")


# ── Exception hierarchy ───────────────────────────────────────────

class CampusXError(Exception):
    """Base exception for all CampusX errors."""

    status_code: int = status.HTTP_500_INTERNAL_SERVER_ERROR
    detail: str = "Internal server error"

    def __init__(self, detail: str | None = None, **context: Any) -> None:
        self.detail = detail or self.__class__.detail
        self.context = context
        super().__init__(self.detail)


class AuthenticationError(CampusXError):
    status_code = status.HTTP_401_UNAUTHORIZED
    detail = "Authentication failed"


class AuthorizationError(CampusXError):
    status_code = status.HTTP_403_FORBIDDEN
    detail = "Insufficient permissions"


class NotFoundError(CampusXError):
    status_code = status.HTTP_404_NOT_FOUND
    detail = "Resource not found"


class ValidationError(CampusXError):
    status_code = 422
    detail = "Validation failed"


class RateLimitError(CampusXError):
    status_code = status.HTTP_429_TOO_MANY_REQUESTS
    detail = "Rate limit exceeded"


class AgentError(CampusXError):
    """An agent failed to execute its task."""
    status_code = status.HTTP_502_BAD_GATEWAY
    detail = "Agent execution failed"


class AgentTimeoutError(AgentError):
    """An agent exceeded its execution timeout."""
    detail = "Agent execution timed out"


class RAGError(CampusXError):
    """RAG pipeline failure."""
    detail = "Knowledge retrieval failed"


class LLMError(CampusXError):
    """LLM call failure."""
    detail = "Language model call failed"


class ToolError(CampusXError):
    """Tool execution failure."""
    detail = "Tool execution failed"


class WorkflowError(CampusXError):
    """Workflow engine failure."""
    detail = "Workflow execution failed"


# ── Exception handlers ────────────────────────────────────────────

def register_exception_handlers(app: FastAPI) -> None:
    """Register all custom exception handlers on the FastAPI app."""

    @app.exception_handler(CampusXError)
    async def campusx_error_handler(request: Request, exc: CampusXError) -> JSONResponse:
        logger.warning(
            "domain_error",
            error_type=type(exc).__name__,
            detail=exc.detail,
            path=str(request.url),
            **exc.context,
        )
        return JSONResponse(
            status_code=exc.status_code,
            content={
                "error": type(exc).__name__,
                "detail": exc.detail,
                "context": exc.context if exc.context else None,
            },
        )

    @app.exception_handler(Exception)
    async def unhandled_error_handler(request: Request, exc: Exception) -> JSONResponse:
        logger.error(
            "unhandled_error",
            error_type=type(exc).__name__,
            detail=str(exc),
            path=str(request.url),
            exc_info=exc,
        )
        return JSONResponse(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            content={
                "error": "InternalServerError",
                "detail": "An unexpected error occurred. Please try again.",
            },
        )
