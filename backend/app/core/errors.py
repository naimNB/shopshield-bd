"""Unified error taxonomy for ShopShield BD.

Provides a clean hierarchy of domain exceptions across input validation,
external API providers (Gemini, Wayback Machine), and internal business rules.
Ensures consistent HTTP status code mapping and prevents leaking sensitive
internal server details or stack traces to end users.
"""

from typing import Optional


class ShopShieldError(Exception):
    """Root base exception for all ShopShield BD application errors."""

    def __init__(self, message: str = "An application error occurred.", detail: Optional[str] = None):
        super().__init__(message)
        self.message = message
        self.detail = detail or message


# ============================================================================
# 1. Input Validation Errors (Mapped to HTTP 422 / 413 / 415)
# ============================================================================

class InputValidationError(ShopShieldError):
    """Base exception for user input or request validation failures."""
    pass


class SSRFValidationError(InputValidationError):
    """Raised when a user-provided URL targets a private, loopback, or unsafe destination."""
    pass


class ImageValidationError(InputValidationError):
    """Raised when an uploaded screenshot is corrupt, unreadable, or invalid."""
    pass


class PayloadTooLargeError(ShopShieldError):
    """Raised when request payload or image size exceeds allowable limits."""
    pass


class UnsupportedMediaTypeError(ShopShieldError):
    """Raised when an uploaded file type or media format is not supported."""
    pass


# ============================================================================
# 2. Configuration Errors (Mapped to HTTP 503)
# ============================================================================

class ConfigurationError(ShopShieldError):
    """Raised when a service is missing required environment variables or credentials."""
    pass


# ============================================================================
# 3. AI Provider Errors (Mapped to HTTP 502 / 429 / 504)
# ============================================================================

class AIProviderError(ShopShieldError):
    """Base exception for Gemini multimodal AI provider communication failures."""
    pass


class AIQuotaExhaustedError(AIProviderError):
    """Raised when Gemini API rate limits or daily quotas are exhausted."""
    def __init__(self, message: str = "Gemini API quota exceeded. Please try again later.", detail: Optional[str] = None):
        super().__init__(message, detail)


class AITimeoutError(AIProviderError):
    """Raised when a request to the Gemini API times out."""
    def __init__(self, message: str = "Gemini API request timed out.", detail: Optional[str] = None):
        super().__init__(message, detail)


class AIResponseValidationError(AIProviderError):
    """Raised when the AI model returns empty output or invalid JSON schema."""
    def __init__(self, message: str = "AI output validation failed.", detail: Optional[str] = None):
        super().__init__(message, detail)


# ============================================================================
# 4. External Data Provider Errors (Wayback Machine / Public Registries)
# ============================================================================

class ExternalSourceError(ShopShieldError):
    """Base exception for failures communicating with third-party public registries or archives."""
    pass


class WaybackServiceError(ExternalSourceError):
    """Base exception for Internet Archive Wayback Machine CDX API errors."""
    pass


class WaybackTimeoutError(WaybackServiceError):
    """Raised when the Wayback Machine API request times out."""
    def __init__(self, message: str = "The Internet Archive Wayback Machine API request timed out.", detail: Optional[str] = None):
        super().__init__(message, detail)


class WaybackRateLimitError(WaybackServiceError):
    """Raised when the Wayback Machine API returns HTTP 429 Too Many Requests."""
    def __init__(self, message: str = "Internet Archive rate limit reached. Please try again shortly.", detail: Optional[str] = None):
        super().__init__(message, detail)


class WaybackSourceUnavailableError(WaybackServiceError):
    """Raised when the Wayback Machine API returns 5xx server errors or malformed responses."""
    def __init__(self, message: str = "Internet Archive service is currently unavailable.", detail: Optional[str] = None):
        super().__init__(message, detail)


class WaybackPayloadTooLargeError(WaybackServiceError):
    """Raised when a response from the Wayback CDX API exceeds the maximum safe limit."""
    def __init__(self, message: str = "Internet Archive response exceeded maximum safe limit.", detail: Optional[str] = None):
        super().__init__(message, detail)
