"""AcademicAgent — courses, timetables, attendance, exam schedules."""

from __future__ import annotations

from app.agents.base import BaseAgent
from app.agents.types import AgentTask, AgentResult, ExecutionPlan, ExecutionStep, VerificationResult


class AcademicAgent(BaseAgent):
    agent_id = "academic"
    name = "Academic Agent"
    description = "Courses, timetables, attendance, exam schedules"
    tag = "academics"
    capabilities = ["attendance", "timetable", "exam_schedule", "cgpa", "course_info"]

    _tasks_completed = 6120
    _tasks_failed = 99

    async def plan(self, task: AgentTask) -> ExecutionPlan:
        return ExecutionPlan(
            workflow_id=task.task_id,
            query=task.params.get("query", ""),
            intents=["academic"],
            steps=[ExecutionStep(step_id="s0", agent=self.agent_id, action=task.action, params=task.params)],
        )

    async def execute(self, task: AgentTask) -> AgentResult:
        action = task.action
        query = task.params.get("query", "").lower()

        if action == "check_attendance" or "attendance" in query:
            return AgentResult(
                task_id=task.task_id, agent_id=self.agent_id, action=action,
                data={
                    "summary": "Your aggregate attendance is **87.2%** (above 75% threshold). Compiler Design is at 74% — attend next 3 sessions to restore eligibility per `academic_regulations_R22.pdf §6.2`.",
                    "courses": [
                        {"code": "CS502", "name": "Distributed Systems", "attendance": 92},
                        {"code": "CS514", "name": "Machine Learning", "attendance": 87},
                        {"code": "CS522", "name": "Compiler Design", "attendance": 74},
                        {"code": "CS540", "name": "Agentic AI Systems", "attendance": 96},
                    ],
                    "alert": "Compiler Design below 75% threshold",
                },
                confidence=0.96, sources=["academic_regulations_R22.pdf · §6.2"],
            )

        if action == "get_timetable" or "timetable" in query or "class" in query or "today" in query:
            return AgentResult(
                task_id=task.task_id, agent_id=self.agent_id, action=action,
                data={
                    "summary": "Today's schedule: Distributed Systems (09:00, B-204), Machine Learning (10:10, B-301), Compiler Design (11:20, A-108), Agentic AI Systems (14:00, AI Lab).",
                    "schedule": [
                        {"slot": "09:00 — 10:00", "course": "Distributed Systems", "room": "B-204"},
                        {"slot": "10:10 — 11:10", "course": "Machine Learning", "room": "B-301"},
                        {"slot": "11:20 — 12:20", "course": "Compiler Design", "room": "A-108"},
                        {"slot": "14:00 — 15:00", "course": "Agentic AI Systems", "room": "AI Lab"},
                    ],
                },
                confidence=0.98,
            )

        # Default
        return AgentResult(
            task_id=task.task_id, agent_id=self.agent_id, action=action,
            data={
                "summary": "CGPA: 8.64 (+0.12 vs last semester). 4 active courses in Semester V CSE. Next exam: Compiler Design on Aug 26 in A-108.",
                "cgpa": 8.64, "semester": 5, "active_courses": 4,
            },
            confidence=0.95,
        )

    async def verify(self, result: AgentResult) -> VerificationResult:
        return VerificationResult(is_valid=True, confidence=0.96)
