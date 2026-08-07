"""PlannerAgent — generates structured execution plans from user intent.

The planner takes a user query and a set of detected intents, then constructs
an ordered, dependency-aware execution plan that the orchestrator executes.
"""

from __future__ import annotations

import uuid
from typing import Any

from app.agents.base import BaseAgent
from app.agents.types import AgentTask, AgentResult, ExecutionPlan, ExecutionStep, VerificationResult
from app.core.logging import get_logger

logger = get_logger("agent.planner")

# ── Intent → Agent mapping ─────────────────────────────────────────
INTENT_AGENT_MAP: dict[str, str] = {
    "academic": "academic",
    "attendance": "academic",
    "timetable": "academic",
    "course": "academic",
    "exam": "academic",
    "cgpa": "academic",
    "placement": "placement",
    "internship": "placement",
    "eligibility": "placement",
    "resume": "placement",
    "company": "placement",
    "event": "events",
    "workshop": "events",
    "hackathon": "events",
    "register": "events",
    "knowledge": "knowledge",
    "policy": "knowledge",
    "regulation": "knowledge",
    "handbook": "knowledge",
    "document": "knowledge",
    "hostel": "services",
    "library": "services",
    "scholarship": "services",
    "transport": "services",
    "grievance": "services",
    "email": "communication",
    "draft": "communication",
    "announcement": "communication",
    "notification": "notification",
    "reminder": "notification",
    "alert": "notification",
    "calendar": "calendar",
    "schedule": "calendar",
}


class PlannerAgent(BaseAgent):
    agent_id = "planner"
    name = "Planner Agent"
    description = "Generates structured execution plans from user intent"
    tag = "core"
    capabilities = ["plan", "decompose", "prioritize"]

    async def plan(self, task: AgentTask) -> ExecutionPlan:
        """Generate a plan — the planner IS the plan generator."""
        return await self._create_plan(task)

    async def execute(self, task: AgentTask) -> AgentResult:
        """Execute: generate the plan and return it as data."""
        plan = await self._create_plan(task)
        return AgentResult(
            task_id=task.task_id,
            agent_id=self.agent_id,
            action="create_plan",
            data=plan.model_dump(),
            confidence=0.92,
        )

    async def verify(self, result: AgentResult) -> VerificationResult:
        """Verify the plan has at least one step."""
        plan_data = result.data
        steps = plan_data.get("steps", [])
        if not steps:
            return VerificationResult(is_valid=False, issues=["Plan has no steps"])
        return VerificationResult(is_valid=True, confidence=0.95)

    async def _create_plan(self, task: AgentTask) -> ExecutionPlan:
        """Build a structured execution plan from intents."""
        query = task.params.get("query", "")
        intents = task.params.get("intents", [])

        if not intents:
            intents = self._detect_intents(query)

        steps: list[ExecutionStep] = []
        agent_steps: dict[str, int] = {}

        for i, intent in enumerate(intents):
            agent_id = INTENT_AGENT_MAP.get(intent, "knowledge")
            action = self._intent_to_action(intent)

            # Build dependency chain — later steps may depend on earlier ones
            deps: list[int] = []
            if agent_id in ("events", "calendar", "notification"):
                # These may depend on eligibility/data from prior agents
                for prev_agent, prev_idx in agent_steps.items():
                    if prev_agent in ("placement", "academic"):
                        deps.append(prev_idx)

            step = ExecutionStep(
                step_id=f"step-{i}",
                agent=agent_id,
                action=action,
                params={"query": query, "intent": intent, **task.params},
                depends_on=deps,
            )
            steps.append(step)
            agent_steps[agent_id] = i

        # Always add a knowledge retrieval step for grounding if not already present
        if "knowledge" not in agent_steps and len(steps) > 0:
            steps.insert(0, ExecutionStep(
                step_id=f"step-rag",
                agent="knowledge",
                action="retrieve",
                params={"query": query},
                depends_on=[],
            ))

        return ExecutionPlan(
            workflow_id=f"wf-{uuid.uuid4().hex[:12]}",
            query=query,
            intents=intents,
            steps=steps,
            estimated_latency_ms=len(steps) * 500,
        )

    def _detect_intents(self, query: str) -> list[str]:
        """Rule-based intent detection (enhanced by LLM when available)."""
        query_lower = query.lower()
        detected: list[str] = []

        intent_keywords: dict[str, list[str]] = {
            "eligibility": ["eligible", "eligibility", "qualify", "qualified"],
            "placement": ["placement", "drive", "company", "internship", "interview"],
            "academic": ["attendance", "timetable", "course", "class", "exam", "cgpa", "grade"],
            "event": ["event", "workshop", "hackathon", "seminar", "bootcamp"],
            "register": ["register", "sign up", "enroll", "join"],
            "knowledge": ["policy", "regulation", "handbook", "rule", "guideline", "manual"],
            "calendar": ["calendar", "schedule", "when", "tomorrow", "today"],
            "notification": ["remind", "reminder", "notify", "alert"],
            "email": ["email", "draft", "send", "mail"],
            "grievance": ["grievance", "complaint", "issue", "problem"],
            "hostel": ["hostel", "room", "mess"],
            "library": ["library", "book", "due"],
            "scholarship": ["scholarship", "financial", "aid"],
        }

        for intent, keywords in intent_keywords.items():
            if any(kw in query_lower for kw in keywords):
                detected.append(intent)

        if not detected:
            detected = ["knowledge"]  # Default to knowledge retrieval

        return detected

    def _intent_to_action(self, intent: str) -> str:
        """Map an intent to a concrete agent action."""
        action_map = {
            "eligibility": "check_eligibility",
            "placement": "list_opportunities",
            "academic": "get_academic_info",
            "attendance": "check_attendance",
            "timetable": "get_timetable",
            "event": "list_events",
            "register": "register_event",
            "knowledge": "retrieve",
            "policy": "retrieve",
            "calendar": "get_schedule",
            "notification": "schedule_reminder",
            "reminder": "schedule_reminder",
            "email": "draft_email",
            "grievance": "file_grievance",
            "hostel": "get_hostel_info",
            "library": "get_library_status",
            "scholarship": "get_scholarships",
        }
        return action_map.get(intent, "general_query")
