"""Request and response schemas for the analyze endpoint."""

from datetime import datetime, timezone
from typing import List, Optional
from pydantic import BaseModel, Field

from backend.app.schemas.claims import ExtractedClaims
from backend.app.schemas.comparison import ComparisonItem
from backend.app.schemas.rules import PaymentWarning, MissingInfoItem


class AnalyzeRequest(BaseModel):
    """Input payload for purchase promise analysis."""

    advertisement_text: str = Field(
        ...,
        min_length=5,
        max_length=15000,
        description="Text content of the seller's public post, caption, or advertisement",
        examples=["Special Offer! Wireless Earbuds only 1200 Tk. Cash on delivery available. 7 days replacement."],
    )
    seller_chat_text: str = Field(
        ...,
        min_length=5,
        max_length=15000,
        description="Text content of the direct message/chat with the seller",
        examples=["Hello, price is 1500 Tk. Send 200 Tk advance to 017XXXXXXXX via bKash. Rest on COD."],
    )
    image_urls: Optional[List[str]] = Field(
        default=None,
        description="Future extension point for multimodal screenshot URLs (Task 03+)",
    )


class AnalysisMetadata(BaseModel):
    """Processing metadata for the analysis request."""

    timestamp: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    model_used: Optional[str] = Field(None, description="Gemini model employed for extraction")
    ad_char_count: int
    chat_char_count: int
    execution_time_ms: Optional[float] = None


class AnalyzeResponse(BaseModel):
    """Complete analysis output comparing advertisement with conversation."""

    status: str = Field("success", description="Status of the analysis")
    advertisement_claims: ExtractedClaims
    seller_chat_claims: ExtractedClaims
    comparison_results: List[ComparisonItem] = Field(default_factory=list)
    has_contradictions: bool = Field(False, description="Whether any definitive CONTRADICTION was discovered")
    contradiction_count: int = Field(0, description="Total number of conflicting terms")
    needs_review_count: int = Field(0, description="Terms requiring buyer manual clarification")
    payment_warnings: List[PaymentWarning] = Field(default_factory=list)
    missing_information: List[MissingInfoItem] = Field(default_factory=list)
    buyer_questions_bangla: List[str] = Field(
        default_factory=list,
        description="Practical verification questions in Bangla for the buyer to ask the seller",
    )
    metadata: AnalysisMetadata
