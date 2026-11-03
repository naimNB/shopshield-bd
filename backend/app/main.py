"""FastAPI application entry point for ShopShield BD."""

from fastapi import FastAPI, status
from fastapi.middleware.cors import CORSMiddleware
from backend.app.api.v1.routes import router as api_v1_router
from backend.app.config import settings
from backend.app.schemas.health import HealthResponse, ServiceStatus

app = FastAPI(
    title=settings.PROJECT_NAME,
    description=(
        "ShopShield BD — AI-Powered Purchase Promise & Payment Safety Assistant.\n\n"
        "Built for YUNet AIgnite Buildathon 2026. Protects consumers in Bangladesh "
        "e-commerce / f-commerce against advance payment fraud, promise drift, "
        "and fake courier delivery receipts."
    ),
    version=settings.VERSION,
    docs_url="/docs",
    redoc_url="/redoc",
    openapi_url="/openapi.json",
)

# Configure Cross-Origin Resource Sharing (CORS)
# Supports configured explicit origins and preview deployments matching https://shopshield-bd-*.vercel.app
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.ALLOWED_ORIGINS,
    allow_origin_regex=r"^https:\/\/shopshield-bd(-[a-zA-Z0-9_-]+)?\.vercel\.app$",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get(
    "/health",
    response_model=HealthResponse,
    status_code=status.HTTP_200_OK,
    summary="Root Health Check",
    description="Direct root health endpoint for container health probes and load balancers.",
    tags=["System"],
)
async def root_health() -> HealthResponse:
    """Return health status at root level."""
    ai_status = "configured (unverified)" if settings.GEMINI_API_KEY else "unconfigured (missing GEMINI_API_KEY)"
    return HealthResponse(
        status="healthy",
        project=settings.PROJECT_NAME,
        version=settings.VERSION,
        environment=settings.ENVIRONMENT,
        services=ServiceStatus(
            api="operational",
            database="configured",
            ai_engine=ai_status,
        ),
        docs_url="/docs",
    )


@app.get(
    "/",
    summary="Root Welcome & Index",
    description="Index route welcoming developers and linking to API documentation.",
    tags=["System"],
)
async def root_index():
    """Return basic information about the ShopShield BD service."""
    return {
        "message": "Welcome to ShopShield BD API — Purchase Promise & Payment Safety Assistant",
        "event": "YUNet AIgnite Buildathon 2026",
        "documentation": "/docs",
        "health": "/health",
        "api_v1_health": f"{settings.API_V1_PREFIX}/health",
        "api_v1_analyze": f"{settings.API_V1_PREFIX}/analyze",
    }


# Mount API V1 routes
app.include_router(api_v1_router, prefix=settings.API_V1_PREFIX)
