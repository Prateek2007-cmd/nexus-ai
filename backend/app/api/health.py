"""Health check endpoint."""

from fastapi import APIRouter
from app.config import get_settings
from app.schemas.common import HealthResponse

router = APIRouter()


@router.get("/health", response_model=HealthResponse)
async def health_check() -> HealthResponse:
    settings = get_settings()
    try:
        from app.agents.registry import get_registry
        agents = get_registry().agents_online
    except Exception:
        agents = 0
    return HealthResponse(
        status="healthy",
        version=settings.app_version,
        agents_online=agents,
        database="connected",
    )
