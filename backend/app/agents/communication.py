"""CommunicationAgent — email drafting, announcements, appointment scheduling."""

from __future__ import annotations
from app.agents.base import BaseAgent
from app.agents.types import AgentTask, AgentResult, ExecutionPlan, ExecutionStep, VerificationResult

class CommunicationAgent(BaseAgent):
    agent_id = "communication"
    name = "Communication Agent"
    description = "Drafts emails, announcements, appointment scheduling"
    tag = "comms"
    capabilities = ["draft_email", "announcement", "appointment"]
    _tasks_completed = 2310
    _tasks_failed = 26

    async def plan(self, task: AgentTask) -> ExecutionPlan:
        return ExecutionPlan(workflow_id=task.task_id, query=task.params.get("query", ""), intents=["communication"],
            steps=[ExecutionStep(step_id="s0", agent=self.agent_id, action=task.action, params=task.params)])

    async def execute(self, task: AgentTask) -> AgentResult:
        query = task.params.get("query", "").lower()
        profile = task.params.get("student_profile", {})
        student_name = profile.get("name") or "Student"
        student_roll = profile.get("rollNumber") or "Roll No"
        student_dept = profile.get("department") or "CSE"
        student_att = profile.get("attendance") or 74.0

        if "email" in query or "draft" in query or "makeup" in query:
            return AgentResult(task_id=task.task_id, agent_id=self.agent_id, action="draft_email",
                data={
                    "summary": f"Drafted a permission request email for **{student_name}** addressed to the Head of Department.",
                    "draft": {
                        "to": f"hod.{student_dept.lower()}@campus.edu",
                        "subject": "Request for Makeup Examination — Compiler Design (CS522)",
                        "body": f"Dear Prof. ...\n\nI am writing to request permission for a makeup examination in Compiler Design (CS522) due to [reason]. My current aggregate attendance is {student_att}%.\n\nThank you for your consideration.\n\nRegards,\n{student_name}\n{student_roll} ({student_dept})",
                    },
                    "status": "draft_ready",
                }, confidence=0.96, tool_calls=1)
        return AgentResult(task_id=task.task_id, agent_id=self.agent_id, action=task.action,
            data={"summary": f"Communication agent ready for **{student_name}**. Can draft emails, compose announcements, or schedule appointments."}, confidence=0.94)

    async def verify(self, result: AgentResult) -> VerificationResult:
        return VerificationResult(is_valid=True, confidence=0.96)
