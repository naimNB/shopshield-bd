"""Pydantic schemas for Historical Purchase Promise & Policy Change Detection in ShopShield BD.

Provides structured models for comparing archived web content across distinct historical snapshots.
Categorizes changes strictly as factual chronological observations (CHANGED, UNCHANGED,
INSUFFICIENT_EVIDENCE, NOT_COMPARABLE, NEEDS_REVIEW) and avoids subjective fraud scores or accusations.
"""

from datetime import datetime, timezone
from enum import Enum
from typing import Any, Dict, List, Optional
from pydantic import BaseModel, Field, PrivateAttr


class TemporalChangeStatus(str, Enum):
    """Categorization of observed policy or promise changes over time."""
    CHANGED = "CHANGED"
    UNCHANGED = "UNCHANGED"
    INSUFFICIENT_EVIDENCE = "INSUFFICIENT_EVIDENCE"
    NOT_COMPARABLE = "NOT_COMPARABLE"
    NEEDS_REVIEW = "NEEDS_REVIEW"


class HistoricalPolicyClaims(BaseModel):
    """Structured purchase-related terms extracted from an archived web page snapshot."""
    product_name: Optional[str] = Field(None, description="Product or service name, if page is a product listing")
    price: Optional[float] = Field(None, description="Numeric product price in BDT")
    currency: Optional[str] = Field("BDT", description="Currency code")
    price_evidence: Optional[str] = Field(None, description="Exact verbatim text quote for the price")
    cod_available: Optional[bool] = Field(None, description="Whether Cash on Delivery is explicitly stated as available")
    cod_evidence: Optional[str] = Field(None, description="Exact verbatim text quote for Cash on Delivery")
    advance_payment_required: Optional[bool] = Field(None, description="Whether advance payment or courier fee is required")
    advance_payment_amount: Optional[float] = Field(None, description="Amount of advance payment if specified")
    advance_payment_evidence: Optional[str] = Field(None, description="Exact verbatim text quote for advance payment terms")
    delivery_charge: Optional[float] = Field(None, description="Stated delivery fee in BDT")
    delivery_charge_evidence: Optional[str] = Field(None, description="Exact verbatim text quote for delivery charge")
    return_policy_available: Optional[bool] = Field(None, description="Whether returns or refunds are allowed")
    return_days: Optional[int] = Field(None, description="Number of days within which returns/replacements are accepted")
    return_policy_terms: Optional[str] = Field(None, description="Summary of stated return/refund policy")
    return_policy_evidence: Optional[str] = Field(None, description="Exact verbatim text quote for return terms")
    replacement_terms: Optional[str] = Field(None, description="Replacement terms if stated separately")
    replacement_evidence: Optional[str] = Field(None, description="Exact verbatim text quote for replacement terms")
    warranty_available: Optional[bool] = Field(None, description="Whether warranty coverage is promised")
    warranty_terms: Optional[str] = Field(None, description="Duration and terms of warranty")
    warranty_evidence: Optional[str] = Field(None, description="Exact verbatim text quote for warranty terms")
    raw_text_snippet: Optional[str] = Field(None, description="Brief snippet of cleaned text used for extraction")


class HistoricalSnapshotContent(BaseModel):
    """Metadata and extracted terms from a single verified historical web archive snapshot."""
    timestamp: str = Field(..., description="14-digit Wayback timestamp YYYYMMDDhhmmss")
    formatted_date: str = Field(..., description="ISO date representation YYYY-MM-DD")
    snapshot_url: str = Field(..., description="Public Internet Archive playback URL")
    raw_content_url: Optional[str] = Field(None, description="Raw content URL used for fetching (with id_ flag)")
    status_code: int = Field(200, description="HTTP status code stored in archive")
    content_bytes: int = Field(0, description="Size of fetched raw HTML content in bytes")
    extracted_text_chars: int = Field(0, description="Character count of cleaned visible text")
    claims: Optional[HistoricalPolicyClaims] = Field(None, description="Extracted and grounded policy claims")
    fetch_status: str = Field("FETCHED", description="Retrieval status: FETCHED, ARCHIVE_UNAVAILABLE, CONTENT_TOO_LARGE, TIMEOUT")
    _extracted_text: Optional[str] = PrivateAttr(default=None)


class TemporalFieldComparison(BaseModel):
    """Detailed temporal comparison of a single purchase-related field across two historical snapshots."""
    field: str = Field(..., description="Machine-readable field key: return_policy, price, cod_availability, etc.")
    field_label: str = Field(..., description="Human-readable field name")
    status: TemporalChangeStatus = Field(..., description="Classification: CHANGED, UNCHANGED, INSUFFICIENT_EVIDENCE, NOT_COMPARABLE, NEEDS_REVIEW")
    previous_value: Optional[str] = Field(None, description="Observation from earlier snapshot")
    new_value: Optional[str] = Field(None, description="Observation from later snapshot")
    earlier_date: Optional[str] = Field(None, description="Observation date of earlier snapshot (YYYY-MM-DD)")
    later_date: Optional[str] = Field(None, description="Observation date of later snapshot (YYYY-MM-DD)")
    earlier_evidence_quote: Optional[str] = Field(None, description="Verbatim quote from earlier snapshot")
    later_evidence_quote: Optional[str] = Field(None, description="Verbatim quote from later snapshot")
    earliest_archive_url: Optional[str] = Field(None, description="Archive snapshot URL for earlier observation")
    latest_archive_url: Optional[str] = Field(None, description="Archive snapshot URL for later observation")
    retrieval_timestamp: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat(), description="ISO 8601 analysis timestamp")
    explanation: str = Field(..., description="Objective explanation of observed change or consistency")
    limitations: str = Field(..., description="Methodological limitation and disclaimers")


class CompareHistoryRequest(BaseModel):
    """Request payload for comparing historical website purchase policies and terms."""
    website_url: str = Field(..., description="Target e-commerce website or page URL to investigate historically")
    page_path: Optional[str] = Field(None, description="Optional path to policy or product page, e.g. /return-policy")
    earlier_timestamp: Optional[str] = Field(None, description="Optional specific 14-digit earlier timestamp")
    later_timestamp: Optional[str] = Field(None, description="Optional specific 14-digit later timestamp")


class CompareHistoryResponse(BaseModel):
    """Comprehensive historical comparison response evaluating policy evolution over time."""
    status: str = Field("success", description="API status code")
    research_status: str = Field(..., description="Outcome: COMPARISON_COMPLETED, INSUFFICIENT_ARCHIVES, CONTENT_UNAVAILABLE, NOT_COMPARABLE, RATE_LIMITED")
    target_url: str = Field(..., description="Fully normalized target URL analyzed")
    cleaned_domain: str = Field(..., description="Sanitized base domain")
    coverage_status: str = Field(..., description="Historical archive coverage grade")
    earlier_snapshot: Optional[HistoricalSnapshotContent] = Field(None, description="Earlier snapshot content and claims")
    later_snapshot: Optional[HistoricalSnapshotContent] = Field(None, description="Later snapshot content and claims")
    comparisons: List[TemporalFieldComparison] = Field(default_factory=list, description="List of comparative findings by field")
    has_changes: bool = Field(False, description="True if any verified policy or price change was detected")
    changes_count: int = Field(0, description="Total count of verified CHANGED items")
    buyer_questions_bangla: List[str] = Field(default_factory=list, description="Targeted verification questions in Bangla")
    disclaimer: str = Field(
        default=(
            "ShopShield BD provides evidence-based historical comparison of public web archives. "
            "Policy or price adjustments over time reflect normal business operations (e.g. inflation, "
            "promotions, supply terms) and do not constitute proof of seller fraud or dishonesty."
        ),
        description="Standard consumer protection disclaimer",
    )
    metadata: Dict[str, Any] = Field(default_factory=dict, description="Execution diagnostics and timing metadata")
