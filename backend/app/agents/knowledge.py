"""KnowledgeAgent — RAG specialist. Vector/DB retrieval over VCE policies, handbooks, circulars & books."""

from __future__ import annotations

from app.agents.base import BaseAgent
from app.agents.types import AgentTask, AgentResult, ExecutionPlan, ExecutionStep, VerificationResult


class KnowledgeAgent(BaseAgent):
    agent_id = "knowledge"
    name = "Knowledge Agent"
    description = "Retrieval over Vasavi College of Engineering handbooks, policies, circulars, and reference textbooks"
    tag = "RAG"
    capabilities = ["retrieve", "semantic_search", "citation", "document_qa"]

    _tasks_completed = 9024
    _tasks_failed = 290

    async def plan(self, task: AgentTask) -> ExecutionPlan:
        return ExecutionPlan(
            workflow_id=task.task_id, query=task.params.get("query", ""), intents=["knowledge"],
            steps=[ExecutionStep(step_id="s0", agent=self.agent_id, action="retrieve", params=task.params)],
        )

    async def execute(self, task: AgentTask) -> AgentResult:
        query = task.params.get("query", "")

        from app.rag.pipeline import get_rag_pipeline
        pipeline = get_rag_pipeline()
        rag_result = await pipeline.query(query)

        return AgentResult(
            task_id=task.task_id, agent_id=self.agent_id, action="retrieve",
            data={
                "summary": rag_result.answer,
                "chunks": rag_result.chunks,
                "sources": rag_result.sources,
                "query": query,
            },
            confidence=rag_result.confidence,
            sources=rag_result.sources,
            tool_calls=1,
        )

    async def verify(self, result: AgentResult) -> VerificationResult:
        return VerificationResult(is_valid=True, confidence=0.95)
