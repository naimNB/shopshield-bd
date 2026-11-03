import asyncio
import logging
from fastapi import APIRouter, HTTPException, status, UploadFile, File, Form
from backend.app.config import settings
from backend.app.schemas.health import HealthResponse, ServiceStatus
from backend.app.schemas.analysis import AnalyzeRequest, AnalyzeResponse
from backend.app.schemas.screenshot import ScreenshotExtractionResponse
from backend.app.services.analyzer import PurchasePromiseAnalyzer
from backend.app.services.screenshot_extractor import (
    ScreenshotExtractorService,
    ImageValidationError,
)
from backend.app.services.ai_extractor import (
    ConfigurationError,
    AIProviderError,
    AIQuotaExhaustedError,
    AITimeoutError,
    AIResponseValidationError,
)

logger = logging.getLogger(__name__)
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
    """Perform a system health check and return service availability.

    Note: The presence of an API key represents configuration, not proof that the model is operational.
    """
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


@router.get(
    "/status",
    summary="Platform Status Summary",
    description="High-level platform overview including hackathon build phase details.",
    tags=["System"],
)
async def get_status():
    """Return platform metadata and current development phase."""
    ai_configured = bool(settings.GEMINI_API_KEY)
    ai_status_label = "configured (unverified)" if ai_configured else "unconfigured (missing GEMINI_API_KEY)"
    return {
        "project": settings.PROJECT_NAME,
        "phase": "Task 03 — Multimodal Screenshot OCR & Purchase Promise Extraction",
        "event": "YUNet AIgnite Buildathon 2026",
        "ai_engine": {
            "model": settings.GEMINI_MODEL,
            "configured": ai_configured,
            "status": ai_status_label,
            "timeout_seconds": settings.AI_REQUEST_TIMEOUT_SECONDS,
        },
        "features": {
            "purchase_promise_extraction": "implemented",
            "contradiction_detection": "implemented",
            "payment_safety_advisory": "implemented",
            "buyer_questions_generator": "implemented",
            "multimodal_screenshot_ocr": "implemented",
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
    ad_clean = request.advertisement_text.strip()
    chat_clean = request.seller_chat_text.strip()

    if len(ad_clean) < 5:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="Advertisement text is too short. Please provide at least 5 characters.",
        )
    if len(chat_clean) < 5:
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
        logger.warning("Configuration error: %s", type(e).__name__)
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Gemini API key is not configured. Please set the GEMINI_API_KEY environment variable.",
        )
    except AIQuotaExhaustedError:
        logger.warning("AI provider quota exhausted.")
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail="Gemini API quota or rate limit exceeded. Please try again later.",
        )
    except AITimeoutError:
        logger.warning("AI provider request timed out.")
        raise HTTPException(
            status_code=status.HTTP_504_GATEWAY_TIMEOUT,
            detail="The AI analysis request timed out. Please try again with shorter text.",
        )
    except AIResponseValidationError:
        logger.error("AI response schema validation failed.")
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail="The AI provider returned an unexpected response format. Please try again.",
        )
    except AIProviderError:
        logger.error("AI provider error occurred.")
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail="AI service provider is currently unavailable. Please try again later.",
        )
    except Exception as e:
        # User-safe generic message without exposing internal stack traces, private conversation, or secrets
        logger.exception("Unexpected internal error during promise analysis: %s", type(e).__name__)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="An internal server error occurred while analyzing purchase promises. Technical details have been logged.",
        )


@router.post(
    "/extract-screenshot",
    response_model=ScreenshotExtractionResponse,
    status_code=status.HTTP_200_OK,
    summary="Extract Visible Text from Commerce Screenshot via Multimodal Gemini OCR",
    description=(
        "Accepts an uploaded image file (PNG, JPEG, WebP, max 5 MB) representing a public advertisement "
        "or private seller conversation. Verifies image integrity and dimensions using Pillow, strips metadata, "
        "and extracts visible text in Bengali, English, or Banglish using Google Gemini. "
        "Images are processed strictly in memory and are never persisted to disk."
    ),
    tags=["OCR"],
)
async def extract_screenshot(
    file: UploadFile = File(..., description="Screenshot image file (PNG, JPEG, WebP, max 5 MB)"),
    source_type: str = Form("advertisement", description="Source classification: 'advertisement' or 'seller_chat'"),
) -> ScreenshotExtractionResponse:
    """Extract visible text from an uploaded advertisement or chat screenshot using Gemini OCR."""
    clean_source = source_type.strip().lower()
    if clean_source not in ("advertisement", "seller_chat"):
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="source_type must be either 'advertisement' or 'seller_chat'.",
        )

    # Validate declared MIME type if provided
    if file.content_type and file.content_type.lower() not in settings.ALLOWED_IMAGE_TYPES:
        raise HTTPException(
            status_code=status.HTTP_415_UNSUPPORTED_MEDIA_TYPE,
            detail=f"Unsupported media type '{file.content_type}'. Allowed types: PNG, JPEG, and WebP.",
        )

    try:
        file_bytes = await file.read()
    except Exception as e:
        logger.error("Failed to read uploaded file stream: %s", type(e).__name__)
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Could not read uploaded image data.",
        )

    if not file_bytes or len(file_bytes) == 0:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="Uploaded image file is empty.",
        )

    if len(file_bytes) > settings.MAX_IMAGE_SIZE_BYTES:
        max_mb = settings.MAX_IMAGE_SIZE_BYTES // (1024 * 1024)
        raise HTTPException(
            status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
            detail=f"Uploaded image exceeds maximum size limit of {max_mb} MB.",
        )

    service = ScreenshotExtractorService()

    try:
        # Execute CPU-bound Pillow decoding and network Gemini call asynchronously
        result = await asyncio.to_thread(
            service.extract_text,
            file_bytes,
            source_type=clean_source,
            declared_content_type=file.content_type,
        )
        return result
    except ImageValidationError as e:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=str(e),
        )
    except ConfigurationError as e:
        logger.warning("Configuration error during screenshot extraction: %s", type(e).__name__)
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Gemini API key is not configured. Please set the GEMINI_API_KEY environment variable.",
        )
    except AIQuotaExhaustedError:
        logger.warning("AI provider quota exhausted during screenshot extraction.")
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail="Gemini API quota or rate limit exceeded. Please try again later.",
        )
    except AITimeoutError:
        logger.warning("AI provider timeout during screenshot extraction.")
        raise HTTPException(
            status_code=status.HTTP_504_GATEWAY_TIMEOUT,
            detail="The AI screenshot extraction request timed out. Please try again with a clearer or smaller image.",
        )
    except AIProviderError:
        logger.error("AI provider error during screenshot extraction.")
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail="AI service provider is currently unavailable. Please try again later.",
        )
    except Exception as e:
        logger.exception("Unexpected error during screenshot OCR extraction: %s", type(e).__name__)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="An internal server error occurred while extracting screenshot text. Technical details have been logged.",
        )

