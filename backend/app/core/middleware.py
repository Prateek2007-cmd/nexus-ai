"""FastAPI middleware: request ID injection, timing, rate limiting."""

from __future__ import annotations

import time
from collections import defaultdict

from fastapi import Request, Response
from starlette.middleware.base import BaseHTTPMiddleware, RequestResponseEndpoint

from app.core.logging import generate_request_id, request_id_var, get_logger

logger = get_logger("middleware")


class RequestContextMiddleware(BaseHTTPMiddleware):
    """Inject request ID and measure request latency."""

    async def dispatch(self, request: Request, call_next: RequestResponseEndpoint) -> Response:
        req_id = generate_request_id()
        request_id_var.set(req_id)
        start = time.monotonic()

        response = await call_next(request)

        elapsed_ms = (time.monotonic() - start) * 1000
        response.headers["X-Request-Id"] = req_id
        response.headers["X-Response-Time"] = f"{elapsed_ms:.1f}ms"

        logger.info(
            "http_request",
            method=request.method,
            path=str(request.url.path),
            status=response.status_code,
            latency_ms=round(elapsed_ms, 1),
            request_id=req_id,
        )
        return response


class RateLimitMiddleware(BaseHTTPMiddleware):
    """Simple in-memory rate limiter: max requests per minute per IP.

    For production, replace with Redis-backed sliding window.
    """

    def __init__(self, app: object, max_per_minute: int = 120) -> None:
        super().__init__(app)  # type: ignore[arg-type]
        self.max_per_minute = max_per_minute
        self._buckets: dict[str, list[float]] = defaultdict(list)

    async def dispatch(self, request: Request, call_next: RequestResponseEndpoint) -> Response:
        client_ip = request.client.host if request.client else "unknown"
        now = time.monotonic()
        window = [t for t in self._buckets[client_ip] if now - t < 60]
        window.append(now)
        self._buckets[client_ip] = window

        if len(window) > self.max_per_minute:
            return Response(
                content='{"error":"RateLimitExceeded","detail":"Too many requests"}',
                status_code=429,
                media_type="application/json",
            )

        return await call_next(request)
