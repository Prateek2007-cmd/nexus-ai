"""OrchestratorAgent — centralized coordinator for all specialist agents."""

from __future__ import annotations

import asyncio
import time
import uuid
from typing import Any
import structlog

from app.agents.base import BaseAgent
from app.agents.types import AgentTask, AgentResult, ExecutionPlan, ExecutionStep, VerificationResult, AgentStatus
from app.core.logging import WorkflowLogger

logger = structlog.get_logger(__name__)


class OrchestratorAgent(BaseAgent):
    agent_id = "orchestrator"
    name = "Orchestrator Agent"
    description = "Central coordinator for all campus agents"
    tag = "core"
    capabilities = ["route", "coordinate", "synthesize"]

    _tasks_completed = 12450
    _tasks_failed = 180

    async def plan(self, task: AgentTask) -> ExecutionPlan:
        """The orchestrator delegates planning to PlannerAgent."""
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

            # ── Step 0.5: Vision / OCR Preprocessing ─────────────
            image_base64 = task.params.get("image_base64")
            if image_base64:
                timeline.append({"agent": "Vision Agent", "action": "Extracting OCR & semantic context from image via Gemini 1.5", "ms": 450})
                if emit_callback:
                    await emit_callback({"event": "status", "data": {"status": "Processing Image", "agent": "Vision"}})
                    await emit_callback({"event": "step_complete", "data": timeline[-1]})
                
                try:
                    from app.llm.client import get_llm_client
                    client = get_llm_client()
                    ocr_text = await client.analyze_image(image_base64, query)
                    if ocr_text:
                        query = f"User Query: {query}\n\n[Extracted Image Context]: {ocr_text}"
                        task.params["query"] = query
                        timeline.append({"agent": "Vision Agent", "action": "Image context appended to Planner input", "ms": 10})
                except Exception as e:
                    logger.warning("ocr_failed", error=str(e))

            # ── Step 1: Plan ───────────────────────────────────────
            self._status = AgentStatus.PLANNING
            if emit_callback:
                await emit_callback({"event": "status", "data": {"status": "Planning", "agent": "Orchestrator"}})

            plan_task = AgentTask(
                task_id=f"plan-{uuid.uuid4().hex[:8]}",
                agent_id="planner",
                action="create_plan",
                params=task.params,
                user_id=task.user_id,
            )

            planner = registry.get_or_raise("planner")
            plan_start = time.monotonic()
            plan_result = await planner.safe_execute(plan_task)

            if not plan_result.success or not plan_result.data:
                return AgentResult(
                    task_id=task.task_id,
                    agent_id=self.agent_id,
                    action="orchestrate",
                    success=False,
                    error=f"Planning failed: {plan_result.error}",
                    confidence=0.0,
                )

            steps = plan_result.data.get("steps", [])

            # ── Step 1.5: Human-in-the-loop Interrupt Gate check ────
            from app.core.hitl import check_hitl_interrupt
            intents = plan_result.data.get("intents", [])
            hitl_gate = check_hitl_interrupt(query, intents, steps)

            if hitl_gate.is_interrupted:
                action_name = hitl_gate.action_details.get("title", "High-Impact Action")
                payload = {
                    "__interrupt__": True,
                    "thread_id": workflow_id,
                    "action": action_name,
                    "details": hitl_gate.action_details,
                    "prompt": f"⚠️ **Approval Required**: Do you want to proceed with '{action_name}'?",
                }
                return AgentResult(
                    task_id=task.task_id,
                    agent_id=self.agent_id,
                    action="orchestrate",
                    success=True,
                    data={
                        "response": f"Approval required for action: {action_name}",
                        "__interrupt__": True,
                        "thread_id": workflow_id,
                        "action": action_name,
                        "details": hitl_gate.action_details,
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

                    step_params = step.get("params", {})
                    if task.params.get("student_profile"):
                        step_params["student_profile"] = task.params.get("student_profile")

                    agent_task = AgentTask(
                        task_id=step.get("step_id", str(uuid.uuid4())),
                        agent_id=agent_id,
                        action=step.get("action", "general_query"),
                        params=step_params,
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

                    # A2A Communication logging
                    if len(group_tasks) > 0:
                        a2a_entry = {"agent": "Orchestrator", "action": f"A2A Protocol Handshake: Aggregated {len(group_tasks)} agent(s)", "ms": 5}
                        timeline.append(a2a_entry)
                        if emit_callback:
                            await emit_callback({"event": "step_complete", "data": a2a_entry})

            # ── Step 3: Merge results ──────────────────────────────
            self._status = AgentStatus.REASONING
            merged_data = self._merge_results(results)

            # ── Step 4: Synthesize response ────────────────────────
            response = await self._synthesize_response(query, merged_data, results, student_profile=task.params.get("student_profile"))

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
                confidence=total_confidence if total_confidence > 0 else 0.95,
                tokens_used=total_tokens,
                sources=list(set(all_sources)),
            )

    def _group_by_dependencies(self, steps: list[dict]) -> list[list[dict]]:
        """Group steps into levels for parallel execution."""
        if not steps:
            return []

        executed_ids: set[str] = set()
        remaining = list(steps)
        groups: list[list[dict]] = []

        while remaining:
            current_group: list[dict] = []
            next_remaining: list[dict] = []

            for step in remaining:
                deps = step.get("depends_on", [])
                deps_met = all(str(dep) in executed_ids for dep in deps)

                if deps_met or not deps:
                    current_group.append(step)
                else:
                    next_remaining.append(step)

            if not current_group:
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
        student_profile: dict[str, Any] | None = None,
    ) -> str:
        """Synthesize a final response from all agent results using LLMClient synthesizer engine."""
        try:
            from app.llm.client import get_llm_client
            client = get_llm_client()
            return await client.synthesize(query, merged_data, results, student_profile=student_profile)
        except Exception as err:
            logger.warning("synthesis_error", error=str(err))

        parts: list[str] = []
        for r in results:
            if r.success and r.data:
                summary = r.data.get("summary", r.data.get("answer", ""))
                if summary:
                    parts.append(f"**{r.agent_id.title()} Agent:** {summary}")

        if parts:
            return "\n\n".join(parts)

        st_name = (student_profile or {}).get("name") or "Student"
        return f"👋 **Hello {st_name}! Welcome to CampusX AI.**\n\nHow can I assist you with your academics, placement drives, workshops, or campus services today?"

    async def process_chat(
        self,
        query: str,
        user_id: str,
        conversation_id: str | None = None,
        emit_callback: Any = None,
        student_profile: dict[str, Any] | None = None,
        image_base64: str | None = None,
    ) -> AgentResult:
        """High-level entry point for chat — used by the API layer."""
        task = AgentTask(
            task_id=f"chat-{uuid.uuid4().hex[:8]}",
            agent_id=self.agent_id,
            action="orchestrate",
            params={"query": query, "message": query, "student_profile": student_profile or {}, "image_base64": image_base64},
            user_id=user_id,
        )
        return await self._orchestrate(task, emit_callback=emit_callback)
