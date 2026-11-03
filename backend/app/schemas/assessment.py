"""Structured assessment schemas for high-level safety states and product authenticity.

Enforces clear separation between seller claims and independent verification.
ShopShield never claims it can definitively prove physical authenticity or fraud from online text or screenshots.
"""

from typing import List, Literal, Optional
from pydantic import BaseModel, Field

AssessmentState = Literal[
    "WARNING_SIGNS_FOUND",
    "NO_SPECIFIC_WARNING_SIGNS_FOUND",
    "INSUFFICIENT_EVIDENCE",
]

AuthenticityStatus = Literal[
    "CLAIMED_ORIGINAL",
    "NOT_INDEPENDENTLY_VERIFIED",
    "INSUFFICIENT_EVIDENCE",
]


class AssessmentSummary(BaseModel):
    """High-level bilingual takeaway and recommended action for the buyer."""

    headline_bn: str = Field(..., description="Takeaway headline in Bengali")
    headline_en: str = Field(..., description="Takeaway headline in English")
    explanation_bn: str = Field(..., description="Contextual explanation in Bengali")
    explanation_en: str = Field(..., description="Contextual explanation in English")
    primary_action_bn: str = Field(..., description="Immediate buyer action in Bengali")
    primary_action_en: str = Field(..., description="Immediate buyer action in English")


class ProductAuthenticityAssessment(BaseModel):
    """Responsible authenticity analysis distinguishing marketing claims from independent verification."""

    status: AuthenticityStatus = Field(
        "NOT_INDEPENDENTLY_VERIFIED",
        description="Authenticity evaluation status",
    )
    status_label_bn: str = Field(
        "স্বাধীনভাবে যাচাইকৃত নয়",
        description="Bengali status label",
    )
    status_label_en: str = Field(
        "Not independently verified",
        description="English status label",
    )
    claim_detected: bool = Field(
        False,
        description="Whether the seller or ad explicitly made an originality/authenticity claim",
    )
    claim_evidence: Optional[str] = Field(
        None,
        description="Verbatim quote from text where originality was claimed",
    )
    explanation_bn: str = Field(
        ...,
        description="Detailed explanation in Bengali clarifying verification limits",
    )
    explanation_en: str = Field(
        ...,
        description="Detailed explanation in English clarifying verification limits",
    )
    verification_steps_bn: List[str] = Field(
        default_factory=list,
        description="Recommended physical inspection steps in Bengali",
    )
    verification_steps_en: List[str] = Field(
        default_factory=list,
        description="Recommended physical inspection steps in English",
    )
    disclaimer_bn: str = Field(
        "অনলাইন বিজ্ঞাপন বা স্ক্রিনশটের মাধ্যমে পণ্যের বাহ্যিক বা আসল-নকল অবস্থা নিশ্চিত করা অসম্ভব। ডেলিভারির সময় পণ্য যাচাই করে নিন।",
        description="Authenticity disclaimer in Bengali",
    )
    disclaimer_en: str = Field(
        "Online advertisements and screenshots cannot verify physical product authenticity. Always inspect the item in person upon delivery.",
        description="Authenticity disclaimer in English",
    )
