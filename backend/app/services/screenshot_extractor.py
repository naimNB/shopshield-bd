"""Gemini-powered screenshot OCR extraction service for ShopShield BD.

Safely decodes and re-encodes user-uploaded screenshots in memory to remove EXIF/metadata,
validates image dimensions and file integrity with Pillow, and extracts visible
Bengali, English, and Banglish text using Google Gemini without persisting images to disk.
"""

import io
import logging
import re
import time
from typing import Optional, Any, Tuple
from PIL import Image, UnidentifiedImageError

from google import genai
from google.genai import types
from google.genai.errors import APIError
import httpx

from backend.app.config import settings
from backend.app.core.errors import (
    ImageValidationError,
    ConfigurationError,
    AIProviderError,
    AIQuotaExhaustedError,
    AITimeoutError,
)
from backend.app.schemas.screenshot import ScreenshotExtractionResponse

logger = logging.getLogger(__name__)

# Enforce Pillow decompression bomb limit (100 megapixels)
Image.MAX_IMAGE_PIXELS = 100_000_000

# Re-export for module consumers
__all__ = [
    "ScreenshotExtractorService",
    "ImageValidationError",
    "ConfigurationError",
    "AIProviderError",
    "AIQuotaExhaustedError",
    "AITimeoutError",
]


OCR_SYSTEM_PROMPT = """You are an objective, highly accurate Optical Character Recognition (OCR) assistant specialized in Bangladesh e-commerce and f-commerce screenshots (Facebook page captions, Marketplace product posts, Messenger chats, WhatsApp conversations, SMS, or courier delivery slips).

Extract all visible text from the provided image accurately.
The screenshot may contain text in Bengali (বাংলা), English, or Banglish (Bengali written using Latin script, e.g., 'baki taka COD te diben').

CRITICAL RULES:
1. Transcribe EXACTLY what is visible in the image. Preserve original wording, numbers, currency symbols (৳, Tk, BDT), and line breaks.
2. NEVER invent, hallucinate, extrapolate, or guess unreadable text.
3. If parts of the text are blurred, cropped, or completely unreadable, omit them. Do NOT guess what might have been there.
4. If no visible text is present in the screenshot, return an empty string.
5. Output ONLY the raw extracted text. Do NOT wrap the output in markdown code blocks (do NOT use ``` or ```text) and do NOT include conversational commentary or explanations.
"""


class ScreenshotExtractorService:
    """Service for validating screenshots and performing Gemini OCR text extraction."""

    def __init__(
        self,
        api_key: Optional[str] = None,
        model_name: Optional[str] = None,
        client: Optional[Any] = None,
    ):
        self.api_key = api_key or settings.GEMINI_API_KEY
        self.model_name = model_name or settings.GEMINI_MODEL
        self._client = client

    @property
    def client(self) -> genai.Client:
        """Lazy-loaded or injected Google GenAI client configured with request timeout."""
        if self._client is not None:
            return self._client
        if not self.api_key:
            raise ConfigurationError(
                "Gemini API key is not configured. Please set the GEMINI_API_KEY "
                "environment variable or configure it in your .env file."
            )
        timeout_ms = max(5000, settings.AI_REQUEST_TIMEOUT_SECONDS * 1000)
        http_options = types.HttpOptions(timeout=timeout_ms)
        self._client = genai.Client(
            api_key=self.api_key,
            http_options=http_options,
        )
        return self._client

    def validate_and_sanitize_image(self, raw_bytes: bytes, declared_content_type: Optional[str] = None) -> Tuple[bytes, int, int]:
        """Validate uploaded screenshot bytes, verify integrity, strip metadata, and re-encode to clean PNG in-memory.

        Returns:
            Tuple of (sanitized_png_bytes, width, height)

        Raises:
            ImageValidationError: If image is empty, malformed, corrupt, or outside dimension constraints.
        """
        if not raw_bytes or len(raw_bytes) == 0:
            raise ImageValidationError("Uploaded image file is empty.")

        if len(raw_bytes) > settings.MAX_IMAGE_SIZE_BYTES:
            max_mb = settings.MAX_IMAGE_SIZE_BYTES / (1024 * 1024)
            raise ImageValidationError(f"Image file size exceeds maximum limit of {max_mb:.0f} MB.")

        try:
            image = Image.open(io.BytesIO(raw_bytes))
            # image.load() forces decoding of all tile data to catch corrupted streams
            image.load()
        except (UnidentifiedImageError, OSError, SyntaxError) as e:
            raise ImageValidationError(f"Invalid or corrupted image file: {str(e)}") from e
        except Exception as e:
            raise ImageValidationError("Could not decode image stream.") from e

        # Validate recognized format
        image_format = (image.format or "").upper()
        if image_format not in ("PNG", "JPEG", "JPG", "WEBP"):
            raise ImageValidationError(
                f"Unsupported image format '{image_format}'. Allowed formats are PNG, JPEG, and WebP."
            )

        width, height = image.size
        if width < 10 or height < 10:
            raise ImageValidationError(
                f"Image dimensions ({width}x{height}) are too small. Minimum resolution is 10x10 pixels."
            )
        if width > 10000 or height > 10000:
            raise ImageValidationError(
                f"Image dimensions ({width}x{height}) exceed maximum allowed resolution of 10,000x10,000 pixels."
            )

        # Sanitize image: convert to RGB or RGBA, stripping all EXIF and non-pixel metadata
        sanitized_mode = "RGBA" if image.mode in ("RGBA", "LA") else "RGB"
        if image.mode != sanitized_mode:
            try:
                image = image.convert(sanitized_mode)
            except Exception as e:
                raise ImageValidationError(f"Failed to normalize image color profile: {str(e)}") from e

        # Re-encode to clean PNG in memory without metadata or comments
        output_buffer = io.BytesIO()
        try:
            image.save(output_buffer, format="PNG", optimize=True)
            sanitized_bytes = output_buffer.getvalue()
        except Exception as e:
            raise ImageValidationError(f"Failed to process and re-encode image: {str(e)}") from e

        return sanitized_bytes, width, height

    def extract_text(
        self,
        raw_bytes: bytes,
        source_type: str = "advertisement",
        declared_content_type: Optional[str] = None,
    ) -> ScreenshotExtractionResponse:
        """Process screenshot and perform OCR text extraction using Gemini without persisting images to disk."""
        sanitized_bytes, width, height = self.validate_and_sanitize_image(
            raw_bytes, declared_content_type=declared_content_type
        )

        image_part = types.Part.from_bytes(data=sanitized_bytes, mime_type="image/png")
        prompt = (
            f"{OCR_SYSTEM_PROMPT}\n\n"
            f"SOURCE TYPE: {source_type}\n\n"
            f"Transcribe all text from this screenshot:"
        )

        client = self.client
        models_to_try = [self.model_name]
        candidate_fallbacks = [
            "gemini-3.1-flash-lite",
            "gemini-3-flash-preview",
            "gemini-3.5-flash-lite",
        ]
        for candidate in candidate_fallbacks:
            if candidate not in models_to_try:
                models_to_try.append(candidate)

        response = None
        last_error = None
        used_model = self.model_name

        for model in models_to_try:
            used_model = model
            for attempt in range(2):
                try:
                    response = client.models.generate_content(
                        model=model,
                        contents=[
                            image_part,
                            prompt,
                        ],
                        config=types.GenerateContentConfig(
                            temperature=0.0,
                        ),
                    )
                    if response is not None:
                        break
                except ConfigurationError:
                    raise
                except APIError as e:
                    code = getattr(e, "code", None)
                    if code == 429:
                        last_error = e
                        if attempt == 0:
                            time.sleep(1.0)
                            continue
                        break
                    elif code in (408, 500, 502, 503, 504):
                        last_error = e
                        break
                    elif code in (401, 403):
                        raise ConfigurationError("Gemini API authentication failed. Please check your GEMINI_API_KEY.") from e
                    raise AIProviderError("AI service provider returned an error.") from e
                except (httpx.TimeoutException, TimeoutError) as e:
                    logger.error("AI provider timeout during OCR: %s", str(e))
                    last_error = e
                    break
                except Exception as e:
                    logger.error("Unexpected error during Gemini OCR: %s", type(e).__name__)
                    raise AIProviderError("AI service provider is currently unavailable. Please try again later.") from e
            if response is not None:
                break

        if response is None:
            if last_error:
                code = getattr(last_error, "code", None)
                if code == 429:
                    raise AIQuotaExhaustedError("Gemini API quota or rate limit exceeded. Please try again later.") from last_error
                if code in (408, 504) or isinstance(last_error, (httpx.TimeoutException, TimeoutError)):
                    raise AITimeoutError("The AI screenshot extraction request timed out. Please try again with a clearer or smaller image.") from last_error
                raise AIProviderError("AI service provider returned an error.") from last_error
            raise AIProviderError("AI provider returned an empty OCR response.")

        raw_text = response.text or ""
        # Clean markdown code fences if model accidentally wrapped output in ```
        cleaned_text = raw_text.strip()
        cleaned_text = re.sub(r"^```(?:markdown|text)?\n?", "", cleaned_text)
        cleaned_text = re.sub(r"\n?```$", "", cleaned_text).strip()

        return ScreenshotExtractionResponse(
            status="success",
            extracted_text=cleaned_text,
            source_type=source_type,
            character_count=len(cleaned_text),
            image_dimensions={"width": width, "height": height},
            model_used=used_model,
        )
