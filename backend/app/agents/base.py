"""BaseAgent — Abstract base class for all CampusX agents.

Every agent in the system inherits from BaseAgent and implements the
six core methods: plan, execute, verify, handoff, confidence_score, recover.
This ensures a uniform interface for the orchestrator and workflow engine.
"""

from __future__ import annotations

import time
import uuid
from abc import ABC, abstractmethod
from typing import Any

from app.agents.types import (
    AgentResult,
    AgentStatus,
    AgentTask,
    ExecutionPlan,
    HandoffMessage,
    VerificationResult,
)
from app.core.logging import get_logger


class BaseAgent(ABC):
    """Abstract base class for all CampusX agents.

    Subclasses MUST implement:
        - plan()       — generate an execution plan for a task
        - execute()    — perform the task and return structured results
        - verify()     — validate the correctness of results

    Subclasses MAY override:
        - handoff()    — delegate work to another agent
        - confidence_score() — assess result quality
        - recover()    — handle failures gracefully
    """

    agent_id: str
    name: str
    description: str
    tag: str
    capabilities: list[str]

    def __init__(self) -> None:
        self.logger = get_logger(f"agent.{self.agent_id}")
        self._status: AgentStatus = AgentStatus.IDLE
        self._tasks_completed: int = 0
        self._tasks_failed: int = 0

    # ── Core interface ─────────────────────────────────────────────

    @abstractmethod
    async def plan(self, task: AgentTask) -> ExecutionPlan:
        """Generate an execution plan for the given task."""
        ...

    @abstractmethod
    async def execute(self, task: AgentTask) -> AgentResult:
        """Execute the task and return structured results."""
        ...

    @abstractmethod
    async def verify(self, result: AgentResult) -> VerificationResult:
        """Validate the correctness and quality of a result."""
        ...

    async def handoff(self, target: str, data: HandoffMessage) -> AgentResult:
        """Delegate work to another agent. Override for custom handoff logic."""
        self.logger.info("handoff", target=target, action=data.action)
        return AgentResult(
            task_id=str(uuid.uuid4()),
            agent_id=self.agent_id,
            action=f"handoff_to_{target}",
            data={"target": target, "payload": data.payload},
        )

    async def confidence_score(self, result: AgentResult) -> float:
        """Assess the quality/confidence of a result. Override for custom scoring."""
        if not result.success:
            return 0.0
        return result.confidence

    async def recover(self, error: Exception, task: AgentTask) -> AgentResult:
        """Handle failure gracefully. Override for custom recovery logic."""
        self.logger.warning(
            "recovery_attempt",
            error=str(error),
            task_id=task.task_id,
            action=task.action,
        )
        self._tasks_failed += 1
        return AgentResult(
            task_id=task.task_id,
            agent_id=self.agent_id,
            action=task.action,
            success=False,
            error=f"Agent recovery: {str(error)}",
            confidence=0.0,
        )

    # ── Execution wrapper ──────────────────────────────────────────

    async def safe_execute(self, task: AgentTask) -> AgentResult:
        """Execute with timing, status tracking, and automatic recovery."""
        self._status = AgentStatus.THINKING
        start = time.monotonic()

        try:
            self._status = AgentStatus.REASONING
            result = await self.execute(task)
            elapsed = (time.monotonic() - start) * 1000
            result.latency_ms = elapsed

            # Verify the result
            verification = await self.verify(result)
            if not verification.is_valid:
                result.confidence *= 0.7
                self.logger.warning("verification_issues", issues=verification.issues)

            self._tasks_completed += 1
            self._status = AgentStatus.COMPLETED

            self.logger.info(
                "task_completed",
                task_id=task.task_id,
                action=task.action,
                latency_ms=round(elapsed, 1),
                confidence=result.confidence,
                success=result.success,
            )
            return result

        except Exception as exc:
            elapsed = (time.monotonic() - start) * 1000
            self._status = AgentStatus.FAILED
            self.logger.error("task_failed", error=str(exc), task_id=task.task_id)

            # Attempt recovery
            try:
                recovery = await self.recover(exc, task)
                recovery.latency_ms = elapsed
                return recovery
            except Exception as recovery_exc:
                self.logger.error("recovery_failed", error=str(recovery_exc))
                return AgentResult(
                    task_id=task.task_id,
                    agent_id=self.agent_id,
                    action=task.action,
                    success=False,
                    error=str(exc),
                    latency_ms=elapsed,
                    confidence=0.0,
                )

    # ── Status & metrics ───────────────────────────────────────────

    @property
    def status(self) -> AgentStatus:
        return self._status

    @property
    def success_rate(self) -> float:
        total = self._tasks_completed + self._tasks_failed
        if total == 0:
            return 100.0
        return round((self._tasks_completed / total) * 100, 1)

    @property
    def total_tasks(self) -> int:
        return self._tasks_completed + self._tasks_failed

    def get_info(self) -> dict[str, Any]:
        """Return agent info in the shape the frontend expects."""
        return {
            "id": self.agent_id,
            "name": self.name,
            "tag": self.tag,
            "desc": self.description,
            "tasks": self._tasks_completed,
            "success": self.success_rate,
            "status": self._status.value,
        }
