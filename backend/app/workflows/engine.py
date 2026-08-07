"""Workflow Engine — executes plans with retries and fallback."""

from __future__ import annotations
from typing import Any
from app.agents.types import AgentResult, AgentTask, ExecutionPlan
from app.core.logging import get_logger

logger = get_logger("workflows.engine")


class WorkflowEngine:
    """Orchestrates complex multi-agent execution graphs."""

    async def run_plan(self, plan: ExecutionPlan, user_id: str) -> dict[str, Any]:
        logger.info("running_plan", workflow_id=plan.workflow_id, steps=len(plan.steps))
        from app.agents.registry import get_registry
        registry = get_registry()

        results: dict[str, Any] = {}
        for step in plan.steps:
            agent = registry.get(step.agent)
            if not agent:
                continue
            task = AgentTask(
                task_id=step.step_id,
                agent_id=step.agent,
                action=step.action,
                params=step.params,
                user_id=user_id,
            )
            res = await agent.safe_execute(task)
            results[step.agent] = res.data

        return results
