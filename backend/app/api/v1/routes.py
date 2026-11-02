"""API v1 route definitions for ShopShield BD."""

from fastapi import APIRouter, HTTPException, status
from backend.app.config import settings
from backend.app.schemas.health import HealthResponse, ServiceStatus
from backend.app.schemas.analysis import AnalyzeRequest, AnalyzeResponse
from backend.app.services.analyzer import PurchasePromiseAnalyzer
from backend.app.services.ai_extractor import (
    ConfigurationError,
    AIProviderError,
    AIResponseValidationError,
)

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
    ai_status = "operational" if settings.GEMINI_API_KEY else "unconfigured (missing GEMINI_API_KEY)"
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


@router.get(
    "/status",
    summary="Platform Status Summary",
    description="High-level platform overview including hackathon build phase details.",
    tags=["System"],
)
async def get_status():
    """Return platform metadata and current development phase."""
    ai_ready = bool(settings.GEMINI_API_KEY)
    return {
        "project": settings.PROJECT_NAME,
        "phase": "Task 02 — Purchase Promise Extraction & Contradiction Detection",
        "event": "YUNet AIgnite Buildathon 2026",
        "ai_engine": {
            "model": settings.GEMINI_MODEL,
            "configured": ai_ready,
        },
        "features": {
            "purchase_promise_extraction": "implemented",
            "contradiction_detection": "implemented",
            "payment_safety_advisory": "implemented",
            "buyer_questions_generator": "implemented",
            "multimodal_screenshot_ocr": "planned (Task 03)",
            "courier_parity_verification": "planned (Task 03)",
            "community_risk_signals": "planned (Task 04)",
        },
        "documentation": "/docs",
    }


@router.post(
    "/analyze",
    response_model=AnalyzeResponse,
    status_code=status.HTTP_200_OK,
    summary="Analyze Purchase Promises & Detect Contradictions",
    description=(
        "Compares a seller advertisement against direct conversation text to extract "
        "structured promises, identify discrepancies (price, COD, advance payments, returns, warranty), "
        "evaluate payment safety rules, and generate practical verification questions in Bangla."
    ),
    tags=["Analysis"],
)
async def analyze_promises(request: AnalyzeRequest) -> AnalyzeResponse:
    """Analyze purchase promises and detect contradictions between advertisement and conversation."""
    if len(request.advertisement_text.strip()) < 5:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="Advertisement text is too short. Please provide at least 5 characters.",
        )
    if len(request.seller_chat_text.strip()) < 5:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="Seller chat text is too short. Please provide at least 5 characters.",
        )
    if len(request.advertisement_text) > settings.MAX_INPUT_TEXT_LENGTH:
        raise HTTPException(
            status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
            detail=f"Advertisement text exceeds maximum limit of {settings.MAX_INPUT_TEXT_LENGTH} characters.",
        )
    if len(request.seller_chat_text) > settings.MAX_INPUT_TEXT_LENGTH:
        raise HTTPException(
            status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
            detail=f"Seller chat text exceeds maximum limit of {settings.MAX_INPUT_TEXT_LENGTH} characters.",
        )

    analyzer = PurchasePromiseAnalyzer()

    try:
        result = analyzer.analyze(request)
        return result
    except ConfigurationError as e:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=str(e),
        )
    except AIProviderError as e:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail=str(e),
        )
    except AIResponseValidationError as e:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail=str(e),
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"An unexpected error occurred during promise analysis: {str(e)}",
        )
