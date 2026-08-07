"""Analytics API — throughput, latency, agent load. Matches mock.ts shapes."""

from __future__ import annotations

import math
from fastapi import APIRouter
from app.schemas.stats import ThroughputPoint, LatencyPoint, AgentLoadPoint

router = APIRouter()


@router.get("/throughput", response_model=list[ThroughputPoint])
async def throughput() -> list[ThroughputPoint]:
    return [
        ThroughputPoint(
            t=f"{str(i).zfill(2)}:00",
            workflows=round(180 + math.sin(i / 2.4) * 90 + (i % 5) * 14),
            tokens=round(900 + math.cos(i / 3) * 320 + (i % 4) * 60),
        )
        for i in range(24)
    ]


@router.get("/latency", response_model=list[LatencyPoint])
async def latency() -> list[LatencyPoint]:
    return [
        LatencyPoint(
            t=f"T-{16 - i}",
            p50=round(300 + math.sin(i / 2) * 60),
            p95=round(680 + math.cos(i / 1.7) * 120),
        )
        for i in range(16)
    ]


@router.get("/agent-load", response_model=list[AgentLoadPoint])
async def agent_load() -> list[AgentLoadPoint]:
    agents = [
        ("Academic", 61), ("Placement", 44), ("Events", 39),
        ("Knowledge", 90), ("Services", 29), ("Communication", 23), ("Notification", 56),
    ]
    return [AgentLoadPoint(name=n, load=l) for n, l in agents]
