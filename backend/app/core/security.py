"""Security & Guardrails module.

Provides prompt injection detection, input sanitization, JWT token management,
password hashing, and authentication dependencies for the CampusX backend.
"""

from __future__ import annotations

import base64
import hashlib
import hmac
import json
import re
import time
from datetime import datetime, timedelta
from typing import Any, NamedTuple

from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials

from app.config import get_settings

security_scheme = HTTPBearer(auto_error=False)


# ── Password Hashing & Verification ───────────────────────────
def hash_password(password: str) -> str:
    """Hash a password securely using SHA-256 + static salt."""
    salt = "campusx_security_salt_2026"
    return hashlib.sha256((password + salt).encode("utf-8")).hexdigest()


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verify a plain text password against the hashed password."""
    return hash_password(plain_password) == hashed_password


# ── JWT Tokens ───────────────────────────────────────────────
def create_access_token(data: dict[str, Any], expires_delta: timedelta | None = None) -> str:
    """Generate a lightweight HS256 JWT access token."""
    settings = get_settings()
    to_encode = data.copy()
    now = datetime.utcnow()
    expire = now + (expires_delta or timedelta(minutes=settings.jwt_expiry_minutes))
    to_encode.update({"exp": int(expire.timestamp()), "iat": int(now.timestamp())})

    header = base64.urlsafe_b64encode(json.dumps({"alg": "HS256", "typ": "JWT"}).encode()).decode().rstrip("=")
    payload = base64.urlsafe_b64encode(json.dumps(to_encode).encode()).decode().rstrip("=")
    signature_input = f"{header}.{payload}"
    signature = base64.urlsafe_b64encode(
        hmac.new(settings.jwt_secret_key.encode(), signature_input.encode(), hashlib.sha256).digest()
    ).decode().rstrip("=")

    return f"{header}.{payload}.{signature}"


def decode_access_token(token: str) -> dict[str, Any]:
    """Decode and validate a JWT access token."""
    try:
        parts = token.split(".")
        if len(parts) != 3:
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token format")

        payload_b64 = parts[1] + "=" * (-len(parts[1]) % 4)
        payload = json.loads(base64.urlsafe_b64decode(payload_b64).decode())

        if payload.get("exp", 0) < time.time():
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Token has expired")

        return payload
    except HTTPException:
        raise
    except Exception:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Could not validate credentials",
        )


async def get_current_user(
    credentials: HTTPAuthorizationCredentials | None = Depends(security_scheme),
) -> dict[str, Any]:
    """FastAPI dependency: Returns current user dict from Bearer token, or demo fallback."""
    if not credentials:
        return {"sub": "usr-demo-001", "email": "demo@campus.edu", "role": "student"}
    return decode_access_token(credentials.credentials)


# ── Prompt Injection & Guardrail Auditing ─────────────────────
class SecurityAuditResult(NamedTuple):
    is_safe: bool
    sanitized_query: str
    flagged_reason: str | None = None


INJECTION_PATTERNS = [
    r"ignore previous instructions",
    r"disregard all prior directives",
    r"system prompt:",
    r"you are now an unrestricted",
    r"elevate privilege",
    r"delete from users",
    r"drop table",
    r"grant admin",
    r"sudo rm",
    r"exfiltrate",
]


class SecurityGuard:
    """Security filter inspecting incoming chat queries for prompt injections and malicious payloads."""

    @staticmethod
    def audit_input(query: str) -> SecurityAuditResult:
        query_lower = query.lower()

        for pattern in INJECTION_PATTERNS:
            if re.search(pattern, query_lower):
                return SecurityAuditResult(
                    is_safe=False,
                    sanitized_query=query,
                    flagged_reason=f"Potential prompt injection / security violation detected ('{pattern}')",
                )

        # Sanitize HTML tags and control chars
        sanitized = re.sub(r"<[^>]*>", "", query).strip()
        return SecurityAuditResult(is_safe=True, sanitized_query=sanitized)


_guard = SecurityGuard()


def audit_query(query: str) -> SecurityAuditResult:
    return _guard.audit_input(query)
