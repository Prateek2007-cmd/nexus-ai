"""Agent info and status schemas."""

from __future__ import annotations

from pydantic import BaseModel


class AgentInfo(BaseModel):
    id: str
    name: str
    tag: str
    desc: str
    tasks: int
    success: float
    status: str = "idle"

    model_config = {"from_attributes": True}
