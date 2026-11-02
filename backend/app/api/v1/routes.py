"""API v1 route definitions for ShopShield BD."""

from fastapi import APIRouter, status
from backend.app.config import settings
from backend.app.schemas.health import HealthResponse, ServiceStatus

router = APIRouter()


@router.get(
    "/health",
    response_model=HealthResponse,
    status_code=status.HTTP_200_OK,
    summary="System Health & Diagnostic Check",
    description="Returns the operational status, version, and component readiness of ShopShield BD.",
    tags=["System"],
)
async def get_health() -> HealthResponse:
    """Perform a system health check and return service availability."""
    return HealthResponse(
        status="healthy",
        project=settings.PROJECT_NAME,
        version=settings.VERSION,
        environment=settings.ENVIRONMENT,
        services=ServiceStatus(
            api="operational",
            database="configured",
            ai_engine="standby",
        ),
        docs_url="/docs",
    )


@router.get(
    "/status",
    summary="Platform Status Summary",
    description="High-level platform overview including hackathon build phase details.",
    tags=["System"],
)
async def get_status():
    """Return platform metadata and current development phase."""
    return {
        "project": settings.PROJECT_NAME,
        "phase": "Foundation & Monorepo Setup (Task 01)",
        "event": "YUNet AIgnite Buildathon 2026",
        "features": {
            "purchase_promise_audit": "planned",
            "payment_safety_advisory": "planned",
            "multimodal_ocr_verification": "planned",
            "community_risk_signals": "planned",
        },
        "documentation": "/docs",
    }
