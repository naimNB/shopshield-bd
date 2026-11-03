"""Request and response schemas for Ad-only Quick Check."""

from typing import List, Optional
from pydantic import BaseModel, Field

from backend.app.schemas.analysis import AnalysisMetadata
from backend.app.schemas.assessment import (
    AssessmentState,
    AssessmentSummary,
    ProductAuthenticityAssessment,
)
from backend.app.schemas.claims import ExtractedClaims
from backend.app.schemas.rules import MissingInfoItem, PaymentWarning
from backend.app.schemas.unified_evidence import UnifiedFinding


class AdAnalysisRequest(BaseModel):
    """Input payload for analyzing an advertisement before initiating seller contact."""

    advertisement_text: str = Field(
        ...,
        min_length=5,
        max_length=15000,
        description="Text content of the public advertisement, caption, or post",
        examples=[
            "Special Winter Sale! Premium Fleece Hoodie only 850 Tk. Cash on Delivery available across BD. 7 days exchange if size mismatch. Order now!"
        ],
    )
    product_context: Optional[str] = Field(
        None,
        description="Optional intended product name or category context",
    )
    seller_context: Optional[str] = Field(
        None,
        description="Optional seller name, page name, or website context",
    )


class AdAnalysisResponse(BaseModel):
    """Complete structured output for Ad-only Quick Check."""

    status: str = Field("success", description="Status of the analysis")
    overall_assessment: AssessmentState = Field(
        "NO_SPECIFIC_WARNING_SIGNS_FOUND",
        description="High-level assessment state: WARNING_SIGNS_FOUND | NO_SPECIFIC_WARNING_SIGNS_FOUND | INSUFFICIENT_EVIDENCE",
    )
    assessment_summary: Optional[AssessmentSummary] = Field(
        None,
        description="Bilingual summary headline, explanation, and primary recommended buyer action",
    )
    product_authenticity: Optional[ProductAuthenticityAssessment] = Field(
        None,
        description="Responsible authenticity assessment separating claims from proof",
    )
    advertisement_claims: ExtractedClaims = Field(
        ...,
        description="Structured claims extracted from the advertisement",
    )
    findings: List[UnifiedFinding] = Field(
        default_factory=list,
        description="Unified evidence findings categorized by standardized status",
    )
    explicit_terms: List[str] = Field(
        default_factory=list,
        description="List of verified commercial commitments explicitly stated in the ad",
    )
    missing_critical_info: List[MissingInfoItem] = Field(
        default_factory=list,
        description="Important purchase terms omitted from the advertisement",
    )
    ambiguous_statements: List[str] = Field(
        default_factory=list,
        description="Vague or ambiguous marketing claims requiring clarification",
    )
    payment_considerations: List[PaymentWarning] = Field(
        default_factory=list,
        description="Payment safety advisories and risk considerations based on observed terms",
    )
    buyer_questions_bangla: List[str] = Field(
        default_factory=list,
        description="Targeted verification questions in Bangla for the buyer to ask the seller",
    )
    buyer_questions_en: List[str] = Field(
        default_factory=list,
        description="Targeted verification questions in English for the buyer to ask the seller",
    )
    source_coverage: str = Field(
        "ADVERTISEMENT_ONLY",
        description="Scope of evidence: ADVERTISEMENT_ONLY",
    )
    limitations: str = Field(
        (
            "Analysis is based solely on the public advertisement text. "
            "An advertisement that appears complete and internally consistent does NOT constitute proof of "
            "seller legitimacy, business registration, or product quality. Direct seller conversation, "
            "courier tracking verification, and official merchant payment checks remain essential."
        ),
        description="Methodological limitations and safety disclaimer",
    )
    metadata: AnalysisMetadata = Field(
        ...,
        description="Processing and performance metadata",
    )
