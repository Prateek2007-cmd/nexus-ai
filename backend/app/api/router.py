"""Master API router — aggregates all sub-routers."""

from __future__ import annotations

from fastapi import APIRouter

from app.api.auth import router as auth_router
from app.api.chat import router as chat_router
from app.api.agents import router as agents_router
from app.api.stats import router as stats_router
from app.api.academic import router as academic_router
from app.api.placement import router as placement_router
from app.api.events import router as events_router
from app.api.knowledge import router as knowledge_router
from app.api.calendar import router as calendar_router
from app.api.notifications import router as notifications_router
from app.api.services import router as services_router
from app.api.analytics import router as analytics_router
from app.api.health import router as health_router

api_router = APIRouter()

api_router.include_router(health_router, tags=["Health"])
api_router.include_router(auth_router, prefix="/auth", tags=["Authentication"])
api_router.include_router(chat_router, prefix="/chat", tags=["Chat"])
api_router.include_router(agents_router, prefix="/agents", tags=["Agents"])
api_router.include_router(stats_router, prefix="/stats", tags=["Stats"])
api_router.include_router(academic_router, prefix="/academic", tags=["Academic"])
api_router.include_router(placement_router, prefix="/placement", tags=["Placement"])
api_router.include_router(events_router, prefix="/events", tags=["Events"])
api_router.include_router(knowledge_router, prefix="/knowledge", tags=["Knowledge"])
api_router.include_router(calendar_router, prefix="/calendar", tags=["Calendar"])
api_router.include_router(notifications_router, prefix="/notifications", tags=["Notifications"])
api_router.include_router(services_router, prefix="/services", tags=["Services"])
api_router.include_router(analytics_router, prefix="/analytics", tags=["Analytics"])
