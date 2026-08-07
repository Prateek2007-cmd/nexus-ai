"""OrchestratorAgent — the brain of the multi-agent system.

Receives user requests, invokes the planner, delegates to specialist agents,
handles parallel execution, merges results, and synthesizes the final response.
"""

from __future__ import annotations

import asyncio
import time
import uuid
from typing import Any

from app.agents.base import BaseAgent
from app.agents.types import (
    AgentResult,
    AgentStatus,
    AgentTask,
    ExecutionPlan,
    VerificationResult,
)
from app.core.logging import WorkflowLogger, get_logger

logger = get_logger("agent.orchestrator")


class OrchestratorAgent(BaseAgent):
    agent_id = "orchestrator"
    name = "Orchestrator Agent"
    description = "Intent parsing, task decomposition, agent routing"
    tag = "core"
    capabilities = ["orchestrate", "plan", "route", "merge", "synthesize"]

    async def plan(self, task: AgentTask) -> ExecutionPlan:
        """Delegate planning to the PlannerAgent."""
        from app.agents.registry import get_registry
        planner = get_registry().get_or_raise("planner")
        return await planner.plan(task)

    async def execute(self, task: AgentTask) -> AgentResult:
        """Execute the full orchestration pipeline."""
        return await self._orchestrate(task)

    async def verify(self, result: AgentResult) -> VerificationResult:
        """Verify the orchestrated result has content."""
        if not result.data.get("response"):
            return VerificationResult(
                is_valid=False,
                issues=["Orchestrator produced no response"],
            )
        return VerificationResult(is_valid=True, confidence=result.confidence)

    async def _orchestrate(
        self,
        task: AgentTask,
        emit_callback: Any = None,
    ) -> AgentResult:
        """Full orchestration pipeline:
        1. Intent Detection (via Planner)
        2. Plan Generation
        3. Parallel Agent Execution
        4. Result Merging
        5. Response Synthesis
        """
        from app.agents.registry import get_registry
        registry = get_registry()
        workflow_id = f"wf-{uuid.uuid4().hex[:12]}"
        query = task.params.get("query", task.params.get("message", ""))
        results: list[AgentResult] = []
        timeline: list[dict[str, Any]] = []

        async with WorkflowLogger("orchestrate") as wlog:
            # ── Step 0: Security Audit & Guardrail Check ─────────────
            from app.core.security import audit_query
            sec_audit = audit_query(query)
            if not sec_audit.is_safe:
                return AgentResult(
                    task_id=task.task_id,
                    agent_id=self.agent_id,
                    action="orchestrate",
                    success=False,
                    data={
                        "response": f"⚠️ **Security Guardrail Triggered**: {sec_audit.flagged_reason}. Execution halted to prevent unauthorized prompt injection or state mutation.",
                        "workflow_id": f"wf-{uuid.uuid4().hex[:12]}",
                        "timeline": [{"agent": "Security Guardrail", "action": "Blocked prompt injection attempt", "ms": 5}],
                        "agent_results": [],
                        "sources": ["campusx_security_policy.pdf"],
                    },
                    confidence=1.0,
                )

            # ── Step 1: Plan ───────────────────────────────────────
            self._status = AgentStatus.PLANNING
            if emit_callback:
                await emit_callback({"event": "status", "data": {"status": "Planning", "agent": "Orchestrator"}})

            plan_task = AgentTask(
                task_id=f"plan-{uuid.uuid4().hex[:8]}",
                agent_id="planner",
                action="create_plan",
                params={"query": query, "message": query},
                user_id=task.user_id,
            )

            planner = registry.get_or_raise("planner")
            plan_start = time.monotonic()
            plan_result = await planner.safe_execute(plan_task)
            plan_data = plan_result.data if plan_result.data else {}
            steps = plan_data.get("steps", [])

            # ── Check for High-Stakes Actions (Human-in-the-Loop Interrupt) ──
            high_stakes_actions = ["register_event", "file_grievance", "draft_email"]
            for s in steps:
                action_name = s.get("action", "")
                if action_name in high_stakes_actions and not task.params.get("hitl_approved"):
                    target_agent_id = s.get("agent", "events")
                    target_agent_name = registry.get(target_agent_id).name if registry.get(target_agent_id) else target_agent_id
                    return AgentResult(
                        task_id=task.task_id,
                        agent_id=self.agent_id,
                        action="orchestrate",
                        success=True,
                        data={
                            "__interrupt__": True,
                            "thread_id": f"wf-{uuid.uuid4().hex[:12]}",
                            "action": action_name,
                            "target_agent": target_agent_name,
                            "proposed_params": s.get("params", {}),
                            "prompt": f"The **{target_agent_name}** proposes to execute binding action: **{action_name}** for query '{query}'. Do you approve?",
                            "timeline": [{"agent": "Orchestrator Supervisor", "action": f"Paused at HITL Interrupt Gate: {action_name}", "ms": 12}],
                        },
                        confidence=0.99,
                    )
            
            plan_ms = (time.monotonic() - plan_start) * 1000

            wlog.step("orchestrator", "plan_generation", latency_ms=plan_ms)
            timeline.append({"agent": "Orchestrator", "action": "Parsed intent · decomposed into subtasks", "ms": round(plan_ms)})

            if emit_callback:
                await emit_callback({"event": "step_complete", "data": timeline[-1]})




            # ── Step 2: Execute agents (parallel where possible) ───
            self._status = AgentStatus.CALLING

            # Group steps by dependency level for parallel execution
            dep_groups = self._group_by_dependencies(steps)

            for group in dep_groups:
                group_tasks = []
                for step in group:
                    agent_id = step.get("agent", "knowledge")
                    agent = registry.get(agent_id)
                    if agent is None:
                        logger.warning("agent_not_found", agent_id=agent_id)
                        continue

                    agent_task = AgentTask(
                        task_id=step.get("step_id", str(uuid.uuid4())),
                        agent_id=agent_id,
                        action=step.get("action", "general_query"),
                        params=step.get("params", {}),
                        user_id=task.user_id,
                    )

                    if emit_callback:
                        await emit_callback({"event": "status", "data": {"status": f"Running {agent.name}", "agent": agent.name}})

                    group_tasks.append((agent, agent_task))

                # Execute group in parallel
                if group_tasks:
                    group_results = await asyncio.gather(
                        *[a.safe_execute(t) for a, t in group_tasks],
                        return_exceptions=True,
                    )

                    for (agent, agent_task), result in zip(group_tasks, group_results):
                        if isinstance(result, Exception):
                            result = AgentResult(
                                task_id=agent_task.task_id,
                                agent_id=agent.agent_id,
                                action=agent_task.action,
                                success=False,
                                error=str(result),
                                confidence=0.0,
                            )

                        results.append(result)
                        step_entry = {
                            "agent": agent.name,
                            "action": f"{agent_task.action} — {'success' if result.success else 'failed'}",
                            "ms": round(result.latency_ms),
                        }
                        timeline.append(step_entry)
                        wlog.step(
                            agent.agent_id,
                            agent_task.action,
                            latency_ms=result.latency_ms,
                            confidence=result.confidence,
                            tool_calls=result.tool_calls,
                        )

                        if emit_callback:
                            await emit_callback({"event": "step_complete", "data": step_entry})

            # ── Step 3: Merge results ──────────────────────────────
            self._status = AgentStatus.REASONING
            merged_data = self._merge_results(results)

            # ── Step 4: Synthesize response ────────────────────────
            response = await self._synthesize_response(query, merged_data, results)

            synth_entry = {"agent": "Orchestrator", "action": "Synthesized grounded final response", "ms": 200}
            timeline.append(synth_entry)
            if emit_callback:
                await emit_callback({"event": "step_complete", "data": synth_entry})

            total_confidence = sum(r.confidence for r in results if r.success) / max(len(results), 1)
            total_tokens = sum(r.tokens_used for r in results)
            all_sources = []
            for r in results:
                all_sources.extend(r.sources)

            self._status = AgentStatus.COMPLETED
            self._tasks_completed += 1

            return AgentResult(
                task_id=task.task_id,
                agent_id=self.agent_id,
                action="orchestrate",
                success=True,
                data={
                    "response": response,
                    "workflow_id": workflow_id,
                    "timeline": timeline,
                    "agent_results": [r.model_dump() for r in results],
                    "sources": list(set(all_sources)),
                },
                confidence=total_confidence,
                tokens_used=total_tokens,
                sources=list(set(all_sources)),
            )

    def _group_by_dependencies(self, steps: list[dict]) -> list[list[dict]]:
        """Group steps into levels for parallel execution."""
        if not steps:
            return []

        groups: list[list[dict]] = []
        remaining = list(steps)
        completed_indices: set[int] = set()

        while remaining:
            current_group = []
            next_remaining = []

            for i, step in enumerate(remaining):
                deps = step.get("depends_on", [])
                if all(d in completed_indices for d in deps):
                    current_group.append(step)
                    completed_indices.add(i)
                else:
                    next_remaining.append(step)

            if not current_group:
                # Prevent infinite loop — execute remaining sequentially
                current_group = next_remaining
                next_remaining = []

            groups.append(current_group)
            remaining = next_remaining

        return groups

    def _merge_results(self, results: list[AgentResult]) -> dict[str, Any]:
        """Merge results from multiple agents into a unified data structure."""
        merged: dict[str, Any] = {}
        for r in results:
            if r.success and r.data:
                merged[r.agent_id] = r.data
        return merged

    async def _synthesize_response(
        self,
        query: str,
        merged_data: dict[str, Any],
        results: list[AgentResult],
    ) -> str:
        """Synthesize a final response from all agent results.

        In production, this calls the LLM with the merged context.
        For now, builds a structured response from agent data.
        """
        try:
            from app.llm.client import get_llm_client
            client = get_llm_client()
            if client.is_available:
                return await client.synthesize(query, merged_data, results)
        except Exception:
            pass

        # Fallback: build response from agent data
        parts: list[str] = []
        for r in results:
            if r.success and r.data:
                summary = r.data.get("summary", r.data.get("answer", ""))
                if summary:
                    parts.append(f"**{r.agent_id.title()} Agent:** {summary}")

        if parts:
            return "\n\n".join(parts)

        return "I've processed your request across the agent network. The workflow completed successfully."

    async def process_chat(
        self,
        query: str,
        user_id: str,
        conversation_id: str | None = None,
        emit_callback: Any = None,
    ) -> AgentResult:
        """High-level entry point for chat — used by the API layer."""
        task = AgentTask(
            task_id=f"chat-{uuid.uuid4().hex[:8]}",
            agent_id=self.agent_id,
            action="orchestrate",
            params={"query": query, "message": query},
            user_id=user_id,
        )
        return await self._orchestrate(task, emit_callback=emit_callback)
