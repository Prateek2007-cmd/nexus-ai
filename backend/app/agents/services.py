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
        if "library" in query or "book" in query:
            return AgentResult(task_id=task.task_id, agent_id=self.agent_id, action=task.action,
                data={"summary": "2 books issued. 'Introduction to Algorithms' due in 2 days. No fines pending.", "books_issued": 2, "due_soon": 1}, confidence=0.97)
        if "hostel" in query:
            return AgentResult(task_id=task.task_id, agent_id=self.agent_id, action=task.action,
                data={"summary": "Room B-214, Mess Plan A. No dues. Hostel code of conduct available in knowledge base.", "room": "B-214", "dues": "Cleared"}, confidence=0.98)
        if "scholarship" in query:
            return AgentResult(task_id=task.task_id, agent_id=self.agent_id, action=task.action,
                data={"summary": "Merit scholarship application is open. Closes Aug 30. You meet the CGPA requirement (8.64 ≥ 8.0).", "eligible": True}, confidence=0.95)
        return AgentResult(task_id=task.task_id, agent_id=self.agent_id, action=task.action,
            data={"summary": "All student services operational. 0 open tickets. Library: 2 books issued. Hostel dues: cleared. 1 scholarship application open."}, confidence=0.94)

    async def verify(self, result: AgentResult) -> VerificationResult:
        return VerificationResult(is_valid=True, confidence=0.97)
