"""Schemas for payment safety rules and missing information."""

from enum import Enum
from typing import Optional
from pydantic import BaseModel, Field


class PaymentWarningType(str, Enum):
    """Categorization of payment risk findings."""

    ADVANCE_FULL_PAYMENT = "ADVANCE_FULL_PAYMENT"
    ADVANCE_DELIVERY_CHARGE = "ADVANCE_DELIVERY_CHARGE"
    ADVANCE_BOOKING_FEE = "ADVANCE_BOOKING_FEE"
    ADVANCE_PARTIAL_PAYMENT = "ADVANCE_PARTIAL_PAYMENT"
    ADVANCE_UNSPECIFIED_PURPOSE = "ADVANCE_UNSPECIFIED_PURPOSE"
    HIGH_ADVANCE_AMOUNT = "HIGH_ADVANCE_AMOUNT"
    IMMEDIATE_URGENCY_PRESSURE = "IMMEDIATE_URGENCY_PRESSURE"
    MISSING_REFUND_POLICY = "MISSING_REFUND_POLICY"
    COD_DENIED_OR_CONFLICT = "COD_DENIED_OR_CONFLICT"
    UNSPECIFIED_WARRANTY = "UNSPECIFIED_WARRANTY"


class PaymentWarning(BaseModel):
    """Structured payment safety finding."""

    type: str = Field(..., description="Warning type identifier")
    severity: str = Field("warning", description="Severity: 'warning', 'caution', or 'info'")
    supporting_evidence: Optional[str] = Field(None, description="Exact quotation from text")
    explanation: str = Field(..., description="Clear explanation of the finding")
    suggested_buyer_action: str = Field(..., description="Actionable recommendation for the buyer")


class MissingInfoItem(BaseModel):
    """Important purchase terms omitted from both advertisement and conversation."""

    field: str = Field(..., description="Omitted field identifier (e.g. 'return_policy', 'warranty')")
    field_label: str = Field(..., description="Human-friendly label")
    description: str = Field(..., description="Why this information is critical before paying")
    importance: str = Field("medium", description="Importance level: 'high', 'medium', or 'low'")
