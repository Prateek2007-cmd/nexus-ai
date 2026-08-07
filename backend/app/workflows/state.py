"""LangGraph compatible state definition for workflow orchestration."""

from __future__ import annotations
from typing import Any, TypedDict, Annotated
import operator


class GraphState(TypedDict):
    query: str
    user_id: str
    intents: list[str]
    plan: dict[str, Any]
    agent_outputs: Annotated[dict[str, Any], operator.ior]
    sources: Annotated[list[str], operator.add]
    final_response: str
    confidence: float
