"""Business logic and AI services package for ShopShield BD."""

from backend.app.services.ai_extractor import (
    AIExtractorService,
    ConfigurationError,
    AIProviderError,
    AIQuotaExhaustedError,
    AITimeoutError,
    AIResponseValidationError,
    verify_evidence_in_text,
)
from backend.app.services.comparison_service import ComparisonService
from backend.app.services.rules_engine import PaymentRulesEngine
from backend.app.services.analyzer import PurchasePromiseAnalyzer

__all__ = [
    "AIExtractorService",
    "ConfigurationError",
    "AIProviderError",
    "AIQuotaExhaustedError",
    "AITimeoutError",
    "AIResponseValidationError",
    "verify_evidence_in_text",
    "ComparisonService",
    "PaymentRulesEngine",
    "PurchasePromiseAnalyzer",
]
