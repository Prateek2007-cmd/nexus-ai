"""Stats and analytics schemas — matches frontend mock.ts shapes exactly."""

from __future__ import annotations

from pydantic import BaseModel


class HeroStat(BaseModel):
    label: str
    value: float
    suffix: str = ""
    decimals: int = 0


class KPI(BaseModel):
    label: str
    value: str
    detail: str
    tone: str


class ThroughputPoint(BaseModel):
    t: str
    workflows: int
    tokens: int


class LatencyPoint(BaseModel):
    t: str
    p50: int
    p95: int


class AgentLoadPoint(BaseModel):
    name: str
    load: int


class ActivityItem(BaseModel):
    agent: str
    text: str
    time: str
    tone: str
