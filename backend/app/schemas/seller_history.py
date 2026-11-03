"""Pydantic schemas for Seller History Intelligence in ShopShield BD.

Supports evidence-based Facebook Page Transparency extraction, Internet Archive
(Wayback Machine) historical website analysis, and structured seller verification reports.
Strictly avoids fake trust scores, scam probabilities, or subjective fraud accusations.
"""

from enum import Enum
from typing import List, Optional, Any
from pydantic import BaseModel, Field


class SourceType(str, Enum):
    """Provenance classification of the evidence source."""
    USER_SCREENSHOT = "USER_SCREENSHOT"
    INTERNET_ARCHIVE_CDX = "INTERNET_ARCHIVE_CDX"
    COMMERCE_REGISTRY = "COMMERCE_REGISTRY"
    UNVERIFIED_INPUT = "UNVERIFIED_INPUT"


class VerificationStatus(str, Enum):
    """Verification grade of the finding."""
    USER_PROVIDED_UNVERIFIED = "USER_PROVIDED_UNVERIFIED"
    INDEPENDENTLY_RETRIEVED = "INDEPENDENTLY_RETRIEVED"
    UNAVAILABLE = "UNAVAILABLE"


class EvidenceFinding(BaseModel):
    """An individual verifiable finding with strict evidence provenance."""
    field_name: str = Field(..., description="Machine-readable field key, e.g. page_creation_date, name_changes")
    field_label: str = Field(..., description="Human-readable label in English/Bangla")
    observed_value: Any = Field(..., description="Factual observed value (date, name, list, count, or string)")
    source_type: SourceType = Field(..., description="Origin of the data: USER_SCREENSHOT, INTERNET_ARCHIVE_CDX, etc.")
    source_url: Optional[str] = Field(None, description="Direct URL to independent archive snapshot or source if available")
    observation_date: Optional[str] = Field(None, description="Date associated with the historical observation (YYYY-MM-DD or text)")
    retrieval_date: str = Field(..., description="ISO 8601 timestamp of when ShopShield BD extracted/retrieved this finding")
    evidence_text: Optional[str] = Field(None, description="Exact verbatim text or snippet supporting this finding")
    verification_status: VerificationStatus = Field(..., description="Verification status of the finding")
    limitations: str = Field(..., description="Explicit methodological limitation or disclaimer for this specific finding")


class PageNameChange(BaseModel):
    """A single recorded page name change from the Page Transparency panel."""
    previous_name: str = Field(..., description="Previous name of the page")
    change_date: Optional[str] = Field(None, description="Date the name was changed, if visible")
    evidence_text: Optional[str] = Field(None, description="Exact visible text snippet from the screenshot")


class PageManagerLocation(BaseModel):
    """Primary country or region for page managers."""
    country: str = Field(..., description="Country name, e.g. Bangladesh, Nigeria, United Kingdom")
    count: Optional[int] = Field(None, description="Number of managers in this country, if visible")
    evidence_text: Optional[str] = Field(None, description="Exact visible text snippet")


class PageTransparencyData(BaseModel):
    """Extracted data from a Facebook Page Transparency panel screenshot."""
    page_name: Optional[str] = Field(None, description="Visible name of the Facebook page")
    page_creation_date: Optional[str] = Field(None, description="Visible creation date string")
    page_age_months: Optional[int] = Field(None, description="Calculated age in months if creation date is parseable")
    name_changes_count: int = Field(0, description="Total number of visible name changes")
    name_changes: List[PageNameChange] = Field(default_factory=list, description="List of previous names and dates")
    merge_history: Optional[str] = Field(None, description="Visible page merge history or status")
    manager_locations: List[PageManagerLocation] = Field(default_factory=list, description="Manager country locations")
    is_running_ads: Optional[bool] = Field(None, description="Whether the page is currently running ads")
    unreadable_or_missing_fields: List[str] = Field(default_factory=list, description="Fields not visible or unreadable in image")
    raw_extracted_text: str = Field("", description="Full visible text transcribed from the screenshot")


class PageTransparencyResponse(BaseModel):
    """API response for Facebook Page Transparency screenshot analysis."""
    status: str = Field("success", description="Status of the extraction")
    transparency_data: PageTransparencyData = Field(..., description="Extracted transparency fields")
    findings: List[EvidenceFinding] = Field(default_factory=list, description="Standardized evidence findings")
    buyer_questions: List[str] = Field(default_factory=list, description="Practical verification questions in Bangla")
    disclaimer: str = Field(
        "User-provided screenshot evidence. Extracted directly from uploaded image; "
        "not independently verified against Meta/Facebook servers. "
        "Name changes and page age are historical observations and do not constitute proof of fraud or legitimacy.",
        description="Legal and methodological disclaimer"
    )
    model_used: Optional[str] = Field(None, description="Gemini model utilized for multimodal OCR")


class WebsiteArchiveSnapshot(BaseModel):
    """An individual archived capture snapshot from the Internet Archive."""
    timestamp: str = Field(..., description="14-digit Wayback timestamp, e.g. 20240101120000")
    formatted_date: str = Field(..., description="Human-readable ISO date (YYYY-MM-DD)")
    snapshot_url: str = Field(..., description="Direct link to view the archived capture on web.archive.org")
    status_code: Optional[str] = Field(None, description="HTTP response status code in archive (e.g. 200)")


class WebsiteArchiveData(BaseModel):
    """Historical archive coverage metadata for an e-commerce website."""
    target_url: str = Field(..., description="Original URL provided by user")
    cleaned_domain: str = Field(..., description="Normalized hostname/domain queried on Wayback CDX")
    archive_available: bool = Field(False, description="Whether any archived snapshots were found")
    total_snapshots_observed: int = Field(0, description="Number of snapshot captures observed in query")
    earliest_snapshot: Optional[WebsiteArchiveSnapshot] = Field(None, description="Earliest recorded archive capture")
    latest_snapshot: Optional[WebsiteArchiveSnapshot] = Field(None, description="Most recent recorded archive capture")
    sample_snapshots: List[WebsiteArchiveSnapshot] = Field(default_factory=list, description="Sample of historical snapshots")
    data_limitations: str = Field(
        "Earliest archive capture indicates when Internet Archive crawlers first indexed the website. "
        "It is NOT proof of the domain registration date or business founding date. "
        "The absence of snapshots does not automatically indicate an illegitimate business.",
        description="Methodological limitations of Wayback Machine data"
    )


class WebsiteHistoryRequest(BaseModel):
    """Request payload for website historical research."""
    url: str = Field(..., description="Full website URL to investigate (e.g. https://daraz.com.bd)")


class WebsiteHistoryResponse(BaseModel):
    """API response for website historical research."""
    status: str = Field("success", description="Status of the archive query")
    website_data: WebsiteArchiveData = Field(..., description="Verifiable archive metadata")
    findings: List[EvidenceFinding] = Field(default_factory=list, description="Standardized evidence findings")
    buyer_questions: List[str] = Field(default_factory=list, description="Practical verification questions in Bangla")
    disclaimer: str = Field(
        "Independently retrieved historical metadata from the Internet Archive Wayback Machine CDX API. "
        "First capture date does NOT prove domain creation date or business founding date.",
        description="Methodological disclaimer"
    )


class SellerHistoryReportRequest(BaseModel):
    """Consolidated request for a full seller history report."""
    transparency_data: Optional[PageTransparencyData] = None
    website_url: Optional[str] = None


class SellerHistoryReportResponse(BaseModel):
    """Consolidated evidence-based seller history report."""
    status: str = Field("success", description="Status of the report")
    independently_retrieved: List[EvidenceFinding] = Field(
        default_factory=list,
        description="Findings retrieved independently from authoritative or public sources (e.g. Wayback CDX API)"
    )
    user_provided_screenshots: List[EvidenceFinding] = Field(
        default_factory=list,
        description="Findings extracted from user-provided screenshots (unverified against third-party servers)"
    )
    unverified_or_unavailable: List[EvidenceFinding] = Field(
        default_factory=list,
        description="Expected trust markers that are missing, unreadable, or not provided"
    )
    buyer_verification_questions: List[str] = Field(
        default_factory=list,
        description="Actionable verification questions in Bangla tailored to the findings"
    )
    overall_summary: str = Field(
        ...,
        description="Factual, objective summary without subjective scores or scam accusations"
    )
    disclaimer: str = Field(
        "ShopShield BD provides evidence-based purchase and seller verification. "
        "It does not generate arbitrary trust scores or scam probabilities. "
        "All findings are grounded strictly in verifiable archive data or visible screenshot text.",
        description="System disclaimer"
    )
