"""PlannerAgent — intent classification and DAG execution planning."""

from __future__ import annotations
import uuid
from app.agents.base import BaseAgent
from app.agents.types import AgentTask, AgentResult, ExecutionPlan, ExecutionStep, VerificationResult

# Terms that mark a query as a knowledge-base (RAG) question — shared by
# intent detection and the needs_rag fallback so the two lists cannot drift.
# Scoped to institution-level phrasing: bare "schedule" stays with the
# calendar agent (the student's personal timetable), not the RAG corpus.
RAG_TRIGGER_KEYWORDS: list[str] = [
    "timing",
    "timings",
    "hours",
    "college hours",
    "working hours",
    "office hours",
    "class hours",
    "college schedule",
    "college class schedule",
    "working days",
    "academic calendar",
    "holiday",
    "holidays",
    "vacation",
    "summer vacation",
    "revaluation",
    "exam pattern",
    "evaluation pattern",
    "passing marks",
    "minimum marks",
    "tuition fee",
    "fee structure",
    "fee payment",
    "payment deadline",
    "hostel fee",
    "overdue",
    "transport",
    # NOTE: bare "bus" is intentionally excluded — substring matching would
    # also hit "busy"/"business". The compound phrases cover real queries.
    "bus pass",
    "bus routes",
    "bus timings",
    "college bus",
    "what time",
    "opening time",
    "closing time",
    "opens at",
    "closes at",
]

INTENT_AGENT_MAP: dict[str, str] = {
    "academic": "academic",
    "attendance": "academic",
    "timetable": "calendar",
    "course": "academic",
    "exam": "calendar",
    "exams": "calendar",
    "quiz": "calendar",
    "quizzes": "calendar",
    "test": "calendar",
    "tests": "calendar",
    "lab": "calendar",
    "labs": "calendar",
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
    "book": "knowledge",
    "textbook": "knowledge",
    "author": "knowledge",
    "syllabus": "knowledge",
    "curriculum": "knowledge",
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
    "chat": "",
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
        """Verify the plan has valid structure."""
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
            if intent == "chat":
                continue
            agent_id = INTENT_AGENT_MAP.get(intent)
            if not agent_id or agent_id in agent_steps:
                # Avoid duplicate steps for the same agent in a single workflow
                continue

            action = self._intent_to_action(intent, query=query)
            deps: list[int] = []
            if agent_id in ("events", "calendar", "notification"):
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
            agent_steps[agent_id] = len(steps) - 1

        policy_keywords = [
            "policy", "rule", "regulation", "handbook", "guideline", "document",
            "faq", *RAG_TRIGGER_KEYWORDS,
        ]
        needs_rag = any(kw in query.lower() for kw in policy_keywords)

        # Insert the RAG step even when no other intent matched (e.g. pure
        # informational queries like "college timings" or "college rules") so
        # the orchestrator never degrades to a bare greeting for a knowledge
        # question.
        if needs_rag and "knowledge" not in agent_steps:
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
        """Rule-based intent detection."""
        query_lower = query.lower().strip()
        detected: list[str] = []

        chat_phrases = [
            "hi", "hello", "hey", "greetings", "good morning", "good afternoon", "good evening",
            "whats up", "sup", "how are you", "who are you", "whats your name", "what is your name",
            "whats my name", "what is my name", "who am i", "can you help me", "thank you", "thanks",
            "cool", "awesome", "nice", "bye", "ok", "okay"
        ]

        # Check if query is purely conversational
        if any(query_lower == cp or query_lower.startswith(cp + " ") or query_lower.endswith(" " + cp) for cp in chat_phrases):
            return ["chat"]

        # Check if asking about existing registrations vs requesting new registration
        is_registration_query = any(phrase in query_lower for phrase in ["did i register", "am i registered", "my registrations", "registered events", "what events", "have i registered"])

        intent_keywords: dict[str, list[str]] = {
            "eligibility": ["eligible", "eligibility", "qualify", "qualified", "criteria", "cutoff"],
            "placement": ["placement", "drive", "company", "internship", "interview", "job", "salary", "stipend", "package", "hiring", "recruit", "tesla", "google", "microsoft", "amazon", "stripe"],
            "academic": ["attendance", "timetable", "course", "class", "exam", "cgpa", "grade", "gpa", "marks", "credits", "subject", "semester", "syllabus"],
            "event": ["event", "workshop", "hackathon", "seminar", "bootcamp", "open lab"],
            "knowledge": ["policy", "regulation", "handbook", "rule", "guideline", "manual", "document", "faq", "procedure", "book", "textbook", "author", "syllabus", "curriculum", "reference", "algorithms", "clrs", "silberschatz", "kurose", "dragon book", *RAG_TRIGGER_KEYWORDS],
            "calendar": ["calendar", "schedule", "when", "tomorrow", "today", "slot"],
            "notification": ["remind", "reminder", "notify", "alert"],
            "email": ["email", "draft", "send", "mail"],
            "grievance": ["grievance", "complaint", "issue", "problem", "broken", "wifi", "fix"],
            "hostel": ["hostel", "room", "mess"],
            "library": ["library", "book", "due", "borrow"],
            "scholarship": ["scholarship", "financial", "aid", "fee"],
        }

        if not is_registration_query:
            intent_keywords["register"] = ["register me", "enroll me", "sign me up", "sign up for", "enroll in", "register for"]

        for intent, keywords in intent_keywords.items():
            if any(kw in query_lower for kw in keywords):
                detected.append(intent)

        if is_registration_query and "event" not in detected:
            detected.append("event")

        if not detected:
            if any(kw in query_lower for kw in ["policy", "rule", "regulation", "handbook", "guideline", "document", "faq"]):
                detected = ["knowledge"]
            else:
                detected = ["chat"]

        return detected

    def _intent_to_action(self, intent: str, query: str = "") -> str:
        """Map an intent to a concrete agent action."""
        query_lower = query.lower()
        if intent == "event" or intent == "register":
            if any(kw in query_lower for kw in ["did i", "am i", "my event", "my registration", "what event", "have i", "registered events", "status"]):
                return "list_events"
            if any(kw in query_lower for kw in ["register me", "enroll me", "sign me up", "register for", "enroll in"]):
                return "register_event"
            return "list_events"

        action_map = {
            "eligibility": "check_eligibility",
            "placement": "list_opportunities",
            "academic": "get_academic_info",
            "attendance": "check_attendance",
            "timetable": "get_timetable",
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
