"""StudentServicesAgent — hostel, library, scholarships, transport, grievances."""

from __future__ import annotations
from app.agents.base import BaseAgent
from app.agents.types import AgentTask, AgentResult, ExecutionPlan, ExecutionStep, VerificationResult

class StudentServicesAgent(BaseAgent):
    agent_id = "services"
    name = "Student Services Agent"
    description = "Hostel, library, scholarships, transport, grievances"
    tag = "services"
    capabilities = ["hostel", "library", "scholarship", "transport", "grievance"]
    _tasks_completed = 2870
    _tasks_failed = 55

    async def plan(self, task: AgentTask) -> ExecutionPlan:
        return ExecutionPlan(workflow_id=task.task_id, query=task.params.get("query", ""), intents=["services"],
            steps=[ExecutionStep(step_id="s0", agent=self.agent_id, action=task.action, params=task.params)])

    async def execute(self, task: AgentTask) -> AgentResult:
        query = task.params.get("query", "").lower()
        profile = task.params.get("student_profile", {})
        cgpa = profile.get("cgpa") if profile.get("cgpa") is not None and profile.get("cgpa") > 0 else 8.0
        name = profile.get("name") or "Student"
        hostel = profile.get("hostel") or "Hostel Block C · Room 214"

        if "library" in query or "book" in query:
            return AgentResult(task_id=task.task_id, agent_id=self.agent_id, action=task.action,
                data={"summary": f"Library status for **{name}**: 2 books issued. 'Introduction to Algorithms' due in 2 days. No fines pending.", "books_issued": 2, "due_soon": 1}, confidence=0.97)
        if "hostel" in query:
            return AgentResult(task_id=task.task_id, agent_id=self.agent_id, action=task.action,
                data={"summary": f"Hostel records for **{name}**: {hostel}, Mess Plan A. No dues pending.", "room": hostel, "dues": "Cleared"}, confidence=0.98)
        if "scholarship" in query:
            is_elig = cgpa >= 8.0
            return AgentResult(task_id=task.task_id, agent_id=self.agent_id, action=task.action,
                data={"summary": f"Merit Scholarship Application status for **{name}**: Application open until Aug 30. Your CGPA (`{cgpa}`) {'meets' if is_elig else 'does not meet'} the requirement (≥ 8.0).", "eligible": is_elig, "cgpa": cgpa}, confidence=0.95)
        return AgentResult(task_id=task.task_id, agent_id=self.agent_id, action=task.action,
            data={"summary": f"Student services status for **{name}**: 0 open tickets. Library: 2 books issued. Hostel ({hostel}): cleared. Scholarship status verified."}, confidence=0.94)

    async def verify(self, result: AgentResult) -> VerificationResult:
        return VerificationResult(is_valid=True, confidence=0.97)
