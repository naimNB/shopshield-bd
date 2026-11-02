"""Schemas for contradiction and consistency comparison between sources."""

from enum import Enum
from typing import Optional
from pydantic import BaseModel, Field


class ContradictionStatus(str, Enum):
    """Result of cross-referencing advertisement vs. seller conversation."""

    CONTRADICTION = "CONTRADICTION"
    CONSISTENT = "CONSISTENT"
    INSUFFICIENT_INFORMATION = "INSUFFICIENT_INFORMATION"
    NEEDS_REVIEW = "NEEDS_REVIEW"


class ComparisonItem(BaseModel):
    """Detailed comparison for an individual purchase promise attribute."""

    field: str = Field(..., description="Key identifier (e.g. 'price', 'cod_availability', 'return_policy')")
    field_label: str = Field(..., description="Human-friendly label (e.g. 'Product Price', 'Cash on Delivery')")
    status: ContradictionStatus = Field(..., description="CONTRADICTION, CONSISTENT, INSUFFICIENT_INFORMATION, or NEEDS_REVIEW")
    ad_evidence: Optional[str] = Field(None, description="Supporting quotation from the advertisement")
    chat_evidence: Optional[str] = Field(None, description="Supporting quotation from the seller chat")
    explanation: str = Field(..., description="Detailed explanation of the consistency or discrepancy")
    severity: str = Field("info", description="Severity level: 'high', 'medium', 'low', or 'info'")
