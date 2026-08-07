"""MemoryManager — handles session, long-term, and preference memories."""

from __future__ import annotations
from typing import Any
from app.core.logging import get_logger

logger = get_logger("memory")


class MemoryManager:
    """Manages short-term conversation context and long-term user memories."""

    def __init__(self) -> None:
        self._short_term: dict[str, list[dict[str, Any]]] = {}

    async def add_message(self, session_id: str, role: str, content: str) -> None:
        if session_id not in self._short_term:
            self._short_term[session_id] = []
        self._short_term[session_id].append({"role": role, "content": content})

    async def get_history(self, session_id: str, limit: int = 10) -> list[dict[str, Any]]:
        history = self._short_term.get(session_id, [])
        return history[-limit:]

    async def get_user_memories(self, user_id: str) -> list[str]:
        return [
            "Prefers concise answers with a source citation.",
            "Interested in ML infrastructure and distributed systems roles.",
            "Wants attendance warnings at the 78% mark, not 75%.",
            "Time zone IST · reminders 60 minutes before an event.",
        ]


_memory_mgr: MemoryManager | None = None


def get_memory_manager() -> MemoryManager:
    global _memory_mgr
    if _memory_mgr is None:
        _memory_mgr = MemoryManager()
    return _memory_mgr
