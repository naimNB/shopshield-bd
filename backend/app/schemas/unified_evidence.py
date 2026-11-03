"""Unified Evidence Classification Schema for ShopShield BD.

Provides a single shared classification model across all ShopShield evidence sources:
- Advertisement-only analysis
- Advertisement vs Seller Chat promise comparison
- Internet Archive (Wayback Machine) historical snapshots
- Facebook Page Transparency panel verification

Preserves provenance: source origin, exact quotation, observation time,
retrieval time, verification status, claim category, and methodological limitations.
"""

from datetime import datetime, timezone
from enum import Enum
from typing import Any, List, Optional
import uuid
from pydantic import BaseModel, Field

from backend.app.schemas.seller_history import SourceType, VerificationStatus


class UnifiedFindingStatus(str, Enum):
    """Standardized classification of buyer-facing findings across all evidence sources."""
    AGREEMENT = "AGREEMENT"
    CONTRADICTION = "CONTRADICTION"
    MISSING_INFORMATION = "MISSING_INFORMATION"
    AMBIGUOUS = "AMBIGUOUS"
    HISTORICAL_CHANGE = "HISTORICAL_CHANGE"
    NEEDS_REVIEW = "NEEDS_REVIEW"
    SOURCE_UNAVAILABLE = "SOURCE_UNAVAILABLE"


class UnifiedFinding(BaseModel):
    """An individual verifiable finding with standardized classification and strict provenance."""
    finding_id: str = Field(
        default_factory=lambda: f"uf_{uuid.uuid4().hex[:10]}",
        description="Unique identifier for this unified finding",
    )
    claim_type: str = Field(
        ...,
        description="Category: price, delivery_charge, cod, advance_payment, return_policy, replacement, warranty, shipping, urgency, page_identity",
    )
    field_label: str = Field(
        ...,
        description="Human-readable label for display (English / Bangla)",
    )
    status: UnifiedFindingStatus = Field(
        ...,
        description="AGREEMENT, CONTRADICTION, MISSING_INFORMATION, AMBIGUOUS, HISTORICAL_CHANGE, NEEDS_REVIEW, SOURCE_UNAVAILABLE",
    )
    observed_value: Any = Field(
        None,
        description="Standardized or normalized value if observed (number, boolean, string, or dict)",
    )
    source_type: SourceType = Field(
        SourceType.USER_INPUT,
        description="Origin of the underlying data: USER_INPUT, USER_SCREENSHOT, INTERNET_ARCHIVE_CDX, etc.",
    )
    source_url: Optional[str] = Field(
        None,
        description="Direct URL to independent archive snapshot or source if applicable",
    )
    evidence_quote: Optional[str] = Field(
        None,
        description="Exact verbatim quotation from the source text supporting this finding",
    )
    observation_date: Optional[str] = Field(
        None,
        description="Historical or observation date (YYYY-MM-DD or 'present')",
    )
    retrieval_date: str = Field(
        default_factory=lambda: datetime.now(timezone.utc).isoformat(),
        description="ISO 8601 timestamp when ShopShield analyzed or retrieved this evidence",
    )
    verification_status: VerificationStatus = Field(
        VerificationStatus.USER_PROVIDED_UNVERIFIED,
        description="Verification grade: USER_PROVIDED_UNVERIFIED, INDEPENDENTLY_RETRIEVED, UNAVAILABLE, NEEDS_REVIEW",
    )
    evidence_confidence: Optional[str] = Field(
        None,
        description="Objective rating: INDEPENDENT_ARCHIVE_VERIFIED, USER_TEXT_GROUNDED, USER_SCREENSHOT_EXTRACTED, UNVERIFIED",
    )
    explanation: str = Field(
        ...,
        description="Clear, factual, and objective explanation of the finding without inflammatory accusations",
    )
    severity: str = Field(
        "info",
        description="Severity level for buyer awareness: 'high', 'medium', 'low', 'info'",
    )
    limitations: str = Field(
        ...,
        description="Explicit methodological disclaimer or limitation for this finding",
    )
    review_reason: Optional[str] = Field(
        None,
        description="Specific reason if status is NEEDS_REVIEW",
    )
