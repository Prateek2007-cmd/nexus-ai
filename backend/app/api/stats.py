"""Stats API — hero stats, KPIs. Matches mock.ts shapes exactly."""

from __future__ import annotations

import math
from fastapi import APIRouter
from app.schemas.stats import HeroStat, KPI, ActivityItem

router = APIRouter()


@router.get("/hero", response_model=list[HeroStat])
async def hero_stats() -> list[HeroStat]:
    return [
        HeroStat(label="Autonomous Workflows", value=128400, suffix="+"),
        HeroStat(label="Agents Online", value=8, suffix="/8"),
        HeroStat(label="Avg. Latency", value=412, suffix="ms"),
        HeroStat(label="Workflow Success", value=99.2, suffix="%", decimals=1),
    ]


@router.get("/kpis", response_model=list[KPI])
async def kpis() -> list[KPI]:
    return [
        KPI(label="System Health", value="Optimal", detail="All subsystems nominal", tone="emerald"),
        KPI(label="Agents Online", value="8 / 8", detail="0 degraded", tone="primary"),
        KPI(label="Workflow Success", value="99.2%", detail="+0.4% vs last week", tone="cyan"),
        KPI(label="Median Latency", value="412ms", detail="-38ms vs last week", tone="violet"),
        KPI(label="Knowledge Searches", value="24,918", detail="RAG hits today", tone="primary"),
        KPI(label="Memory Usage", value="62%", detail="12.4 GB vector store", tone="amber"),
        KPI(label="External API Calls", value="8,142", detail="Calendar · Mail · ERP", tone="cyan"),
        KPI(label="Task Queue", value="17", detail="Avg wait 0.8s", tone="violet"),
    ]


@router.get("/activities", response_model=list[ActivityItem])
async def activities() -> list[ActivityItem]:
    return [
        ActivityItem(agent="Placement Agent", text="Verified Google SDE internship eligibility for 42 students", time="12s ago", tone="primary"),
        ActivityItem(agent="Knowledge Agent", text="Retrieved 6 chunks from Academic Regulations R22 handbook", time="48s ago", tone="cyan"),
        ActivityItem(agent="Events Agent", text="Registered 118 participants for AI Systems Workshop", time="2m ago", tone="violet"),
        ActivityItem(agent="Notification Agent", text="Scheduled 96 reminders across campus calendar", time="4m ago", tone="emerald"),
        ActivityItem(agent="Communication Agent", text="Drafted makeup-exam permission email for review", time="7m ago", tone="amber"),
        ActivityItem(agent="Orchestrator", text="Decomposed multi-step request into 5 agent tasks", time="9m ago", tone="primary"),
    ]
